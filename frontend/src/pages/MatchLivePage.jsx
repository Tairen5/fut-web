import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { FORMATIONS } from '../utils/formations';
import './MatchLivePage.css';

// Nombres de jugadores famosos por dificultad
const OPPONENT_NAMES_EASY = [
  'Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 
  'Johnson', 'Davis', 'Miller', 'Anderson', 'Thomas', 'White'
];
const OPPONENT_NAMES_MEDIUM = [
  'Mendy', 'Romero', 'Stones', 'Maguire', 'Trippier', 
  'Rice', 'Mount', 'Eriksen', 'Rashford', 'Nunez', 'Saka'
];
const OPPONENT_NAMES_HARD = [
  'Courtois', 'A. Davies', 'Van Dijk', 'Rudiger', 'Walker', 
  'Rodri', 'Bellingham', 'De Bruyne', 'Vinicius Jr.', 'Haaland', 'Salah'
];

export default function MatchLivePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthStore();

  const mode = searchParams.get('mode') || 'friendlies';
  const difficulty = searchParams.get('difficulty') || 'medium';

  // State
  const [loading, setLoading] = useState(true);
  const [matchStatus, setMatchStatus] = useState('not_started'); // 'not_started', 'playing', 'halftime', 'finished'
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [matchTime, setMatchTime] = useState({ minutes: 0, seconds: 0 });
  const [mentality, setMentality] = useState('balanced'); // 'defending', 'balanced', 'attacking'
  const [gameSpeed, setGameSpeed] = useState(1); // 1, 2, 5, 0 (paused)
  const [commentary, setCommentary] = useState([]);
  const [stats, setStats] = useState({
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    saves: { home: 0, away: 0 },
    passes: { home: 0, away: 0 },
  });
  
  // Post-match rewards
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState({ coins: 0, elo: 0 });

  // Refs for the simulation loop
  const canvasRef = useRef(null);
  const simStateRef = useRef({
    status: 'not_started',
    minutes: 0,
    seconds: 0,
    speed: 1,
    mentality: 'balanced',
    homeScore: 0,
    awayScore: 0,
    stats: {
      possessionTicks: { home: 0, away: 0 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      saves: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
    },
    players: [],
    ball: {
      x: 650,
      y: 375,
      vx: 0,
      vy: 0,
      carrier: null,
      isPassing: false,
      isShooting: false,
      isCrossing: false,
      targetX: 650,
      targetY: 375,
      passReceiver: null,
      trail: [],
      cooldowns: {
        tackle: 0,
        pass: 0,
        shoot: 0,
      }
    },
    opponentName: 'AI Rivals FC',
    kickoffTeam: 'home', // 'home' or 'away'
    kickoffCooldown: 60, // frames to stay in kickoff
    restartCooldown: 0,   // frames to wait before restarting play
    restartReason: null,  // 'corner' | 'goalkick' | 'throwin'
    restartX: 0,
    restartY: 0,
  });

  const commentaryEndRef = useRef(null);

  // Cargar Squad y generar Oponente
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadMatchData();
  }, [user]);

  const loadMatchData = async () => {
    try {
      // 1. Fetch active squad
      let homePlayers = [];
      let homeFormationName = '4-3-3';
      try {
        const squadRes = await api.get(`/squad/active/${user._id}`);
        const squad = squadRes.data;
        homeFormationName = squad.formation || '4-3-3';
        
        // Obtener formación
        const formation = FORMATIONS[homeFormationName] || FORMATIONS['4-3-3'];
        
        // Obtener colección para mapear jugadores
        const colRes = await api.get(`/user-players/${user._id}`);
        const collection = colRes.data;

        // Mapear cada posición
        formation.positions.forEach((pos) => {
          const slot = squad.startingEleven?.find((s) => s.positionIndex === pos.index);
          let playerInfo = null;
          if (slot) {
            const slotId = slot.user_player_id?._id || slot.user_player_id;
            const up = collection.find((c) => c._id === slotId);
            if (up && up.player_id) playerInfo = up.player_id;
          }

          if (playerInfo) {
            homePlayers.push({
              id: `home_${pos.index}`,
              name: playerInfo.name.split(' ').pop(), // Usar apellido
              fullName: playerInfo.name,
              position: pos.pos,
              index: pos.index,
              team: 'home',
              stats: playerInfo.stats || { pac: 75, sho: 75, pas: 75, dri: 75, def: 75, phy: 75 },
              overall: playerInfo.overall,
              px: pos.x,
              py: pos.y,
              x: 0,
              y: 0,
              baseX: 0,
              baseY: 0,
            });
          } else {
            // Placeholder si la posición está vacía
            homePlayers.push({
              id: `home_${pos.index}`,
              name: pos.pos,
              fullName: `Generic ${pos.pos}`,
              position: pos.pos,
              index: pos.index,
              team: 'home',
              stats: { pac: 65, sho: 65, pas: 65, dri: 65, def: 65, phy: 65 },
              overall: 65,
              px: pos.x,
              py: pos.y,
              x: 0,
              y: 0,
              baseX: 0,
              baseY: 0,
            });
          }
        });
      } catch (err) {
        console.error('Error fetching squad, creating default players:', err);
        // Fallback completo si no hay squad activo o hay error
        const formation = FORMATIONS['4-3-3'];
        formation.positions.forEach((pos) => {
          homePlayers.push({
            id: `home_${pos.index}`,
            name: pos.pos,
            fullName: `Generic ${pos.pos}`,
            position: pos.pos,
            index: pos.index,
            team: 'home',
            stats: { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 },
            overall: 70,
            px: pos.x,
            py: pos.y,
            x: 0,
            y: 0,
            baseX: 0,
            baseY: 0,
          });
        });
      }

      // 2. Generar oponente según dificultad
      let oppName = 'AI Rivals FC';
      let oppOvrRange = { min: 78, max: 84 };
      let namesPool = OPPONENT_NAMES_MEDIUM;

      if (difficulty === 'easy') {
        oppName = 'Novice FC';
        oppOvrRange = { min: 68, max: 74 };
        namesPool = OPPONENT_NAMES_EASY;
      } else if (difficulty === 'hard') {
        oppName = 'Elite United';
        oppOvrRange = { min: 88, max: 94 };
        namesPool = OPPONENT_NAMES_HARD;
      }

      // Generar 11 oponentes en 4-3-3
      const oppFormation = FORMATIONS['4-3-3'];
      const awayPlayers = oppFormation.positions.map((pos, idx) => {
        const pName = namesPool[idx % namesPool.length];
        const overall = Math.floor(Math.random() * (oppOvrRange.max - oppOvrRange.min + 1)) + oppOvrRange.min;
        return {
          id: `away_${pos.index}`,
          name: pName,
          fullName: pName,
          position: pos.pos,
          index: pos.index,
          team: 'away',
          stats: {
            pac: overall + (Math.random() > 0.5 ? 2 : -2),
            sho: overall + (Math.random() > 0.5 ? 2 : -2),
            pas: overall + (Math.random() > 0.5 ? 2 : -2),
            dri: overall + (Math.random() > 0.5 ? 2 : -2),
            def: overall + (Math.random() > 0.5 ? 2 : -2),
            phy: overall + (Math.random() > 0.5 ? 2 : -2),
          },
          overall,
          px: pos.x,
          py: pos.y,
          x: 0,
          y: 0,
          baseX: 0,
          baseY: 0,
        };
      });

      // Configurar nombres del equipo
      simStateRef.current.opponentName = oppName;

      // Calcular posiciones base en campo horizontal (1300 x 750)
      // Campo horizontal: x de 0 a 1300, y de 0 a 750.
      // Home: defiende Izquierda (GK a x=80), ataca Derecha.
      // Away: defiende Derecha (GK a x=1220), ataca Izquierda.
      homePlayers = homePlayers.map(p => {
        // En formación vertical: px=0..100 (horizontal), py=0..100 (vertical de arriba a abajo)
        // Convertir py (arriba/delantero=28, abajo/portero=88) a horizontal
        let bx, by;
        if (p.position === 'GK') {
          bx = 80;
          by = 375;
        } else {
          bx = (100 - p.py) / 100 * 1040 + 80;
          by = p.px / 100 * 650 + 50;
        }
        return { ...p, baseX: bx, baseY: by, x: bx, y: by };
      });

      const awayPlayersMapped = awayPlayers.map(p => {
        // Mirrored para el oponente
        let bx, by;
        if (p.position === 'GK') {
          bx = 1220;
          by = 375;
        } else {
          bx = 1300 - ((100 - p.py) / 100 * 1040 + 80);
          by = (100 - p.px) / 100 * 650 + 50;
        }
        return { ...p, baseX: bx, baseY: by, x: bx, y: by };
      });

      // Unificar todos los jugadores
      simStateRef.current.players = [...homePlayers, ...awayPlayersMapped];

      // Poner el partido en estado kickoff
      resetToKickoff('home');

      setLoading(false);
      
      // Añadir primer comentario de bienvenida
      addCommentaryEvent(0, 0, `¡Bienvenidos! Partido de ${mode.toUpperCase()} contra ${oppName} en dificultad ${difficulty.toUpperCase()}.`, 'whistle');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Helper para añadir comentarios en React state
  const addCommentaryEvent = (min, sec, text, type = 'info') => {
    const timeStr = `${String(Math.floor(min)).padStart(2, '0')}:${String(Math.floor(sec)).padStart(2, '0')}`;
    const newEvent = { time: timeStr, text, type, id: Math.random().toString() };
    setCommentary((prev) => {
      const updated = [...prev, newEvent];
      // Limitar a 60 comentarios
      return updated.slice(-60);
    });
  };

  // Autoscroll de comentarios
  useEffect(() => {
    if (commentaryEndRef.current) {
      commentaryEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [commentary]);

  // Reset a Kickoff
  const resetToKickoff = (team) => {
    const sim = simStateRef.current;
    sim.status = 'kickoff';
    sim.kickoffTeam = team;
    sim.kickoffCooldown = 60; // 1 segundo a 60fps

    // Reubicar jugadores en posiciones de kickoff
    sim.players.forEach((p) => {
      if (p.position === 'GK') {
        p.x = p.baseX;
        p.y = p.baseY;
      } else if (p.team === 'home') {
        if (p.position === 'ST') {
          p.x = 635;
          p.y = 375;
        } else {
          // Espaciar un poco hacia atrás en su propio campo
          p.x = Math.min(615, p.baseX - 45);
          p.y = p.baseY;
        }
      } else {
        if (p.position === 'ST') {
          p.x = 665;
          p.y = 375;
        } else {
          p.x = Math.max(685, p.baseX + 45);
          p.y = p.baseY;
        }
      }
    });

    // Colocar el balón y asignar portador
    sim.ball.x = 650;
    sim.ball.y = 375;
    sim.ball.vx = 0;
    sim.ball.vy = 0;
    sim.ball.isPassing = false;
    sim.ball.isShooting = false;
    sim.ball.isCrossing = false;
    sim.ball.trail = [];

    const kickoffTaker = sim.players.find(
      (p) => p.team === team && p.position === 'ST'
    );
    sim.ball.carrier = kickoffTaker || null;
  };

  // Iniciar Partido
  const handleStartMatch = () => {
    setMatchStatus('playing');
    simStateRef.current.status = 'playing';
    addCommentaryEvent(0, 0, '¡Arranca el partido! El árbitro da el pitido inicial.', 'whistle');
  };

  // Cambiar Tácticas (Mentalidad)
  const handleMentalityChange = (m) => {
    setMentality(m);
    simStateRef.current.mentality = m;
    
    // Añadir comentario táctico
    const text = m === 'attacking' 
      ? '¡El equipo adelanta líneas y adopta una mentalidad ofensiva!'
      : m === 'defending' 
        ? 'El equipo se repliega, priorizando el orden defensivo.'
        : 'Volvemos a un estilo de juego equilibrado.';
    
    addCommentaryEvent(
      simStateRef.current.minutes, 
      simStateRef.current.seconds, 
      text, 
      'tactics'
    );
  };

  // Ajustar Velocidad
  const handleSpeedChange = (speed) => {
    setGameSpeed(speed);
    simStateRef.current.speed = speed;
  };

  // Simulación Instantánea al Final
  const handleSimulateToEnd = () => {
    // Si ya terminó, no hacer nada
    if (simStateRef.current.status === 'finished') return;

    // Desactivar renderizado normal y correr la simulación velozmente
    const sim = simStateRef.current;
    sim.speed = 100; // Super speed interna

    // Ejecutar hasta llegar a 90 minutos
    let safetyCounter = 0;
    while (sim.status !== 'finished' && safetyCounter < 10000) {
      updateSimulationLogic();
      safetyCounter++;
    }

    // Actualizar UI React
    setScore({ home: sim.homeScore, away: sim.awayScore });
    setMatchTime({ minutes: 90, seconds: 0 });
    setMatchStatus('finished');
    
    // Sincronizar estadísticas
    updateUIStats();

    // Completar el partido en backend
    completeMatchBackend(sim.homeScore, sim.awayScore);
  };

  // Sincronizar estadísticas de simRef a React State
  const updateUIStats = () => {
    const sim = simStateRef.current;
    const ticksHome = sim.stats.possessionTicks.home || 1;
    const ticksAway = sim.stats.possessionTicks.away || 1;
    const totalTicks = ticksHome + ticksAway;
    const possHome = Math.round((ticksHome / totalTicks) * 100);
    const possAway = 100 - possHome;

    setStats({
      possession: { home: possHome, away: possAway },
      shots: { ...sim.stats.shots },
      shotsOnTarget: { ...sim.stats.shotsOnTarget },
      saves: { ...sim.stats.saves },
      passes: { ...sim.stats.passes },
    });
  };

  // ============================================================
  // Reinicio de jugada (córner, saque de banda, saque de puerta)
  // ============================================================
  const restartPlay = (reason, outX, outY) => {
    const sim = simStateRef.current;
    const ball = sim.ball;

    // Cancelar cualquier estado de balón en vuelo
    ball.isShooting = false;
    ball.isPassing = false;
    ball.isCrossing = false;
    ball.carrier = null;
    ball.vx = 0;
    ball.vy = 0;

    // Entrar en estado de pausa antes de reanudar
    sim.status = 'restart';
    sim.restartCooldown = 90; // ~1.5 segundos a 60fps
    sim.restartReason = reason;
    sim.restartX = outX;
    sim.restartY = outY;

    if (reason === 'corner') {
      addCommentaryEvent(sim.minutes, sim.seconds, '¡Córner! El árbitro señala la esquina.', 'info');
      const attackingTeam = outX > 650 ? 'home' : 'away';
      const cornerX = outX > 650 ? 1240 : 60;
      const cornerY = outY < 375 ? 60 : 690;
      ball.x = cornerX;
      ball.y = cornerY;

      const cornerTaker = sim.players.find(
        p => p.team === attackingTeam && ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB', 'ST'].includes(p.position)
      ) || sim.players.find(p => p.team === attackingTeam && p.position !== 'GK');

      if (cornerTaker) {
        cornerTaker.x = cornerX;
        cornerTaker.y = cornerY;
      }

    } else if (reason === 'goalkick') {
      addCommentaryEvent(sim.minutes, sim.seconds, 'Saque de puerta. El portero se prepara.', 'info');
      const defendingTeam = outX > 650 ? 'away' : 'home';
      const gk = sim.players.find(p => p.team === defendingTeam && p.position === 'GK');
      const kickX = outX > 650 ? 1220 : 80;
      ball.x = kickX;
      ball.y = 375;

      if (gk) {
        gk.x = kickX;
        gk.y = 375;
      }

    } else if (reason === 'throwin') {
      addCommentaryEvent(sim.minutes, sim.seconds, 'Saque de banda.', 'info');
      const lastTeam = ball.passReceiver?.team || 'home';
      const throwTeam = lastTeam === 'home' ? 'away' : 'home';
      const throwX = Math.max(60, Math.min(1240, outX));
      const throwY = outY < 375 ? 45 : 705; // En la línea exacta de banda

      // Encontrar el jugador más cercano del equipo lanzador
      let thrower = null;
      let minD = Infinity;
      sim.players.forEach(p => {
        if (p.team === throwTeam && p.position !== 'GK') {
          const d = Math.hypot(p.x - throwX, p.y - throwY);
          if (d < minD) { minD = d; thrower = p; }
        }
      });

      if (thrower) {
        // Colocar al lanzador en la banda (fuera del campo)
        thrower.x = throwX;
        thrower.y = throwY;
        ball.x = throwX;
        ball.y = throwY;
      }
    }

    ball.cooldowns.tackle = 60;
    ball.cooldowns.pass = 40;
    ball.cooldowns.shoot = 40;
  };

  // Ejecutar el reinicio tras el cooldown
  const executeRestart = () => {
    const sim = simStateRef.current;
    const ball = sim.ball;
    const { restartReason: reason, restartX: outX, restartY: outY } = sim;

    sim.status = 'playing';

    if (reason === 'corner') {
      const attackingTeam = outX > 650 ? 'home' : 'away';
      const cornerX = outX > 650 ? 1240 : 60;
      const cornerY = outY < 375 ? 60 : 690;

      const cornerTaker = sim.players.find(
        p => p.team === attackingTeam && ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB', 'ST'].includes(p.position)
      ) || sim.players.find(p => p.team === attackingTeam && p.position !== 'GK');

      if (cornerTaker) {
        // Ejecutar centro desde córner directamente
        ball.carrier = null;
        ball.isCrossing = true;
        ball.passReceiver = cornerTaker;
        const crossTargetX = attackingTeam === 'home' ? 1140 + (Math.random() - 0.5) * 100 : 160 + (Math.random() - 0.5) * 100;
        const crossTargetY = 375 + (Math.random() - 0.5) * 130;
        ball.targetX = crossTargetX;
        ball.targetY = crossTargetY;
        const crossDist = Math.hypot(crossTargetX - cornerX, crossTargetY - cornerY);
        ball.vx = ((crossTargetX - cornerX) / crossDist) * 6;
        ball.vy = ((crossTargetY - cornerY) / crossDist) * 6;
        addCommentaryEvent(sim.minutes, sim.seconds, '¡Córner al área! Jugadores disputando el balón.', 'shoot');
      }

    } else if (reason === 'goalkick') {
      const defendingTeam = outX > 650 ? 'away' : 'home';
      const gk = sim.players.find(p => p.team === defendingTeam && p.position === 'GK');

      if (gk) {
        // GK pasa largo a un centrocampista o defensa
        const receivers = sim.players.filter(
          p => p.team === defendingTeam && p.position !== 'GK'
        );
        // Preferir jugadores en zona media propia
        const target = receivers.find(p => ['CB', 'CM', 'CDM'].includes(p.position)) || receivers[0];
        if (target) {
          executePass(gk, target);
          addCommentaryEvent(sim.minutes, sim.seconds, `${gk.name} lanza largo el saque de puerta.`, 'info');
        } else {
          ball.carrier = gk;
        }
      }

    } else if (reason === 'throwin') {
      const lastTeam = ball.passReceiver?.team || 'home';
      const throwTeam = lastTeam === 'home' ? 'away' : 'home';
      const throwX = Math.max(60, Math.min(1240, outX));
      const throwY = outY < 375 ? 45 : 705; // En la línea exacta de banda

      // Encontrar el jugador más cercano del equipo lanzador
      let thrower = null;
      let minD = Infinity;
      sim.players.forEach(p => {
        if (p.team === throwTeam && p.position !== 'GK') {
          const d = Math.hypot(p.x - throwX, p.y - throwY);
          if (d < minD) { minD = d; thrower = p; }
        }
      });

      if (thrower) {
        // Buscar el receptor del pase más cercano dentro del campo (no el lanzador)
        let receiver = null;
        let minRecD = Infinity;
        sim.players.forEach(p => {
          if (p.team === throwTeam && p.id !== thrower.id && p.position !== 'GK') {
            const d = Math.hypot(p.x - throwX, p.y - 375);
            if (d < minRecD) { minRecD = d; receiver = p; }
          }
        });

        if (receiver) {
          // Lanzar el pase desde la banda
          executePass(thrower, receiver);
          addCommentaryEvent(sim.minutes, sim.seconds, `${thrower.name} saca de banda hacia ${receiver.name}.`, 'info');
        } else {
          ball.carrier = thrower;
        }
      }
    }

    ball.cooldowns.tackle = 40;
    ball.cooldowns.pass = 20;
  };

  // Lógica de simulación (se ejecuta cada frame)
  const updateSimulationLogic = () => {

    const sim = simStateRef.current;
    if (sim.status === 'finished') return;

    // 1. Manejo del Tiempo
    // minutesPerFrame a 1x: aprox 0.025 min por frame (a 60fps, 1 seg real = 1.5 min partido, total 90 min = 60 seg real)
    const minutesPerFrame = 0.025 * sim.speed;
    
    if (sim.status !== 'halftime' && sim.status !== 'finished') {
      sim.seconds += minutesPerFrame * 60;
      if (sim.seconds >= 60) {
        sim.minutes += Math.floor(sim.seconds / 60);
        sim.seconds = sim.seconds % 60;
      }
    }

    // Control del final de parte / partido
    if (sim.minutes >= 45 && sim.minutes < 46 && sim.status === 'playing') {
      // Fin del primer tiempo
      sim.status = 'halftime';
      setMatchStatus('halftime');
      setGameSpeed(0); // Pausar visualmente
      sim.speed = 0;
      addCommentaryEvent(45, 0, '¡Final de la primera parte! Los jugadores se retiran al vestuario.', 'whistle');
      updateUIStats();
      return;
    }

    if (sim.minutes >= 90) {
      sim.minutes = 90;
      sim.seconds = 0;
      sim.status = 'finished';
      setMatchStatus('finished');
      setGameSpeed(0);
      sim.speed = 0;
      addCommentaryEvent(90, 0, '¡FINAL DEL PARTIDO! El árbitro señala el final del encuentro.', 'whistle');
      updateUIStats();
      
      // Completar en backend
      completeMatchBackend(sim.homeScore, sim.awayScore);
      return;
    }

    // 2. Cooldowns
    if (sim.ball.cooldowns.tackle > 0) sim.ball.cooldowns.tackle--;
    if (sim.ball.cooldowns.pass > 0) sim.ball.cooldowns.pass--;
    if (sim.ball.cooldowns.shoot > 0) sim.ball.cooldowns.shoot--;

    // 3. Kickoff Cooldown
    if (sim.status === 'kickoff') {
      sim.kickoffCooldown--;
      if (sim.kickoffCooldown <= 0) {
        sim.status = 'playing';
        // Hacer un pase corto inicial
        const carrier = sim.ball.carrier;
        if (carrier) {
          // Buscar un centrocampista cercano del mismo equipo
          const teammates = sim.players.filter(p => p.team === carrier.team && p.id !== carrier.id);
          const mid = teammates.find(p => p.position.includes('M')) || teammates[0];
          if (mid) {
            executePass(carrier, mid);
          }
        }
      }
      return; // No procesar más lógica durante kickoff
    }

    // 3b. Restart Cooldown (córner, saque de banda, saque de puerta)
    if (sim.status === 'restart') {
      sim.restartCooldown -= sim.speed || 1;
      if (sim.restartCooldown <= 0) {
        executeRestart();
      }
      return; // No procesar más lógica durante pausa de reinicio
    }

    // Registrar ticks de posesión para la estadística
    if (sim.status === 'playing') {
      const carrier = sim.ball.carrier;
      if (carrier) {
        sim.stats.possessionTicks[carrier.team]++;
      } else {
        // Si no hay portador, buscar quién tocó por última vez
        const lastTeam = sim.ball.passReceiver?.team || 'home';
        sim.stats.possessionTicks[lastTeam]++;
      }
    }

    // 4. Actualizar Movimiento de Jugadores
    sim.players.forEach((p) => {
      const isCarrier = sim.ball.carrier && sim.ball.carrier.id === p.id;
      const isWinger = ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(p.position);
      
      let targetX = p.baseX;
      let targetY = p.baseY;

      // Desplazamiento dinámico del bloque del equipo siguiendo el balón (para outfield players)
      if (p.position !== 'GK' && sim.status === 'playing') {
        const ballShiftX = (sim.ball.x - 650) * 0.45;
        const ballShiftY = (sim.ball.y - p.baseY) * 0.2;
        
        targetX += ballShiftX;
        targetY += ballShiftY;

        // Modificaciones según mentalidad del usuario
        if (p.team === 'home') {
          if (sim.mentality === 'attacking') {
            targetX += 100;
          } else if (sim.mentality === 'defending') {
            targetX -= 100;
          }
        }
      }

      const isHomeAttacking = (sim.ball.carrier && sim.ball.carrier.team === 'home') || (!sim.ball.carrier && (sim.ball.passReceiver?.team === 'home' || sim.ball.isCrossing));
      const isAwayAttacking = (sim.ball.carrier && sim.ball.carrier.team === 'away') || (!sim.ball.carrier && (sim.ball.passReceiver?.team === 'away' || sim.ball.isCrossing));
      const isAttacking = p.team === 'home' ? isHomeAttacking : isAwayAttacking;

      if (sim.status === 'playing') {
        if (isCarrier) {
          // A) Si es el portador, su objetivo es avanzar hacia portería rival o córner (extremos)
          if (isWinger) {
            targetX = p.team === 'home' ? 1150 : 150;
            targetY = p.baseY < 375 ? 90 : 660;
          } else {
            targetX = p.team === 'home' ? 1220 : 80;
            targetY = 375 + Math.sin(sim.minutes) * 60; // Ligero zig-zag
          }
        } else {
          // B) Desmarques por las bandas para Extremos sin balón
          if (isWinger && isAttacking && p.position !== 'GK') {
            if (p.baseY < 375) {
              targetY = 80 + Math.sin(sim.minutes * 0.1) * 30;
            } else {
              targetY = 670 + Math.cos(sim.minutes * 0.1) * 30;
            }
            if (p.team === 'home') {
              targetX = Math.max(targetX, Math.min(1120, sim.ball.x + 100));
            } else {
              targetX = Math.min(targetX, Math.max(180, sim.ball.x - 100));
            }
          }

          // C) Si el balón está centrado al área, correr hacia el punto de penalti
          if (sim.ball.isCrossing) {
            const inBoxZone = p.position === 'ST' || p.position === 'CAM' || p.position.includes('CB') || p.position === 'CDM';
            if (inBoxZone) {
              targetX = sim.ball.targetX;
              targetY = sim.ball.targetY;
            }
          }

          // D) Lógica de marcaje/presión: seguir al balón
          const ballDist = Math.hypot(sim.ball.x - p.x, sim.ball.y - p.y);
          
          if (p.position === 'GK') {
            targetY = Math.max(290, Math.min(460, sim.ball.y));
            targetX = p.team === 'home' ? 80 : 1220;
          } else if (!sim.ball.isCrossing) {
            const carrier = sim.ball.carrier;
            if (carrier && carrier.team !== p.team) {
              const closestToBall = getClosestPlayer(sim.ball.x, sim.ball.y, p.team);
              if (closestToBall && closestToBall.id === p.id && ballDist < 350) {
                targetX = sim.ball.x;
                targetY = sim.ball.y;
              }
            } else if (!carrier) {
              const closestToBall = getClosestPlayer(sim.ball.x, sim.ball.y, p.team);
              if (closestToBall && closestToBall.id === p.id && ballDist < 300) {
                targetX = sim.ball.x;
                targetY = sim.ball.y;
              }
            }

            // Compactar bloque
            const isDefensiveMid = p.position.includes('B') || p.position === 'CDM' || p.position.includes('M');
            if (isDefensiveMid && carrier && carrier.team !== p.team) {
              targetY = targetY * 0.65 + sim.ball.y * 0.35;
            }
          }
        }
      }

      // E) Añadir un ligero movimiento orgánico
      if (p.position !== 'GK' && sim.status === 'playing' && !sim.ball.isCrossing && !isCarrier) {
        const timeScale = 0.002 * Date.now();
        targetX += Math.sin(timeScale + p.index * 1.5) * 20;
        targetY += Math.cos(timeScale + p.index * 2.3) * 20;
      }

      // Límites físicos del campo (mantener dentro del canvas 1300x750 con márgenes)
      targetX = Math.max(40, Math.min(1260, targetX));
      targetY = Math.max(40, Math.min(710, targetY));

      // Mover jugador suavemente hacia el objetivo sin teletransporte
      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        // Velocidad máxima basada en PAC (ritmo del juego ralentizado)
        let baseMaxSpeed = (1.8 + (p.stats.pac / 100) * 2.2) * Math.max(sim.speed, 1);
        if (isCarrier) {
          baseMaxSpeed *= 0.9;
        }
        const moveDist = Math.min(dist, baseMaxSpeed);
        p.x += (dx / dist) * moveDist;
        p.y += (dy / dist) * moveDist;
      }
    });

    // 5. Actualizar Física del Balón
    const ball = sim.ball;
    
    // Guardar rastro (trail) para el efecto visual
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();

    if (ball.carrier) {
      // El balón va pegado al jugador con un leve desfase al frente
      const carrier = ball.carrier;
      const dirX = carrier.team === 'home' ? 1 : -1;
      ball.x = carrier.x + dirX * 8;
      ball.y = carrier.y + 4;
      ball.vx = 0;
      ball.vy = 0;

      // Lógica de decisión del portador (correr, pasar, tirar, centrar)
      if (sim.status === 'playing') {
        const goalDist = carrier.team === 'home' 
          ? Math.hypot(1260 - carrier.x, 375 - carrier.y)
          : Math.hypot(40 - carrier.x, 375 - carrier.y);

        // A) Si es extremo y está en zona de centro profunda, ¡CENTRAR!
        const isWinger = ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(carrier.position);
        const inCrossZone = carrier.team === 'home'
          ? (carrier.x > 750 && (carrier.y < 150 || carrier.y > 430))
          : (carrier.x < 250 && (carrier.y < 150 || carrier.y > 430));

        if (isWinger && inCrossZone && ball.cooldowns.pass === 0) {
          executeCross(carrier);
          return;
        }

        // B) Chutar si está cerca
        const shotRange = carrier.team === 'home' ? 1000 : 300;
        const inRange = carrier.team === 'home' ? (carrier.x > shotRange) : (carrier.x < shotRange);
        
        // Probabilidad de chutar incrementada por mentalidad ofensiva
        let shootChance = 0.015;
        if (sim.mentality === 'attacking' && carrier.team === 'home') shootChance = 0.03;
        
        if (inRange && Math.random() < shootChance && ball.cooldowns.shoot === 0) {
          executeShot(carrier);
          return;
        }

        // C) Pasar si hay un compañero desmarcado por delante
        // Frecuencia de pases depende del atributo pas del jugador
        const passChance = 0.01 + (carrier.stats.pas / 100) * 0.015;
        if (Math.random() < passChance && ball.cooldowns.pass === 0) {
          // Buscar receptores viables por delante
          const teammates = sim.players.filter(p => p.team === carrier.team && p.id !== carrier.id && p.position !== 'GK');
          const forwardTeammates = teammates.filter(p => {
            return carrier.team === 'home' ? p.x > carrier.x - 30 : p.x < carrier.x + 30;
          });

          const pool = forwardTeammates.length > 0 ? forwardTeammates : teammates;
          if (pool.length > 0) {
            // Elegir uno al azar
            const receiver = pool[Math.floor(Math.random() * pool.length)];
            executePass(carrier, receiver);
            return;
          }
        }

        // D) Si no pasa ni tira, regatea hacia la portería rival o avanza por banda
        // En regate, el movimiento principal ya lo hace el bucle de jugadores hacia su target.

        // D) Chequear entrada de defensores rivales
        const opponents = sim.players.filter(p => p.team !== carrier.team && p.position !== 'GK');
        opponents.forEach(opp => {
          const oppDist = Math.hypot(opp.x - carrier.x, opp.y - carrier.y);
          if (oppDist < 24 && ball.cooldowns.tackle === 0) {
            // Iniciar duelo de entrada: DEF vs DRI
            // Dificultad altera la probabilidad
            let diffModifier = 1.0;
            if (opp.team === 'away') {
              if (difficulty === 'easy') diffModifier = 0.7;
              else if (difficulty === 'hard') diffModifier = 1.3;
            } else {
              // El usuario defiende
              if (difficulty === 'easy') diffModifier = 1.2;
              else if (difficulty === 'hard') diffModifier = 0.8;
            }

            const defPower = opp.stats.def * diffModifier;
            const driPower = carrier.stats.dri;
            const tackleProb = defPower / (defPower + driPower) * 0.65; // Factor de balanceo

            if (Math.random() < tackleProb) {
              // Robo de balón con éxito
              ball.carrier = opp;
              ball.cooldowns.tackle = 30; // Evitar robos consecutivos instantáneos
              
              // Evento de comentario
              const templates = [
                `¡Excelente recuperación de ${opp.name}! Corta la jugada de peligro.`,
                `${opp.name} presiona y roba limpiamente el balón a ${carrier.name}.`,
                `Falla en el control de ${carrier.name} y ${opp.name} recupera la posesión.`
              ];
              addCommentaryEvent(sim.minutes, sim.seconds, templates[Math.floor(Math.random() * templates.length)], 'tackle');
            }
          }
        });
      }
    } else if (ball.isPassing) {
      // El balón viaja al receptor del pase
      const receiver = ball.passReceiver;
      if (receiver) {
        const dist = Math.hypot(receiver.x - ball.x, receiver.y - ball.y);
        if (dist < 15) {
          // Llegó el balón
          ball.carrier = receiver;
          ball.isPassing = false;
          ball.passReceiver = null;
          sim.stats.passes[receiver.team]++;
        } else {
          // Mover balón hacia el objetivo
          const angle = Math.atan2(receiver.y - ball.y, receiver.x - ball.x);
          const speed = 12;
          ball.x += Math.cos(angle) * speed;
          ball.y += Math.sin(angle) * speed;

          // Posibilidad de interceptar por defensores rivales en la trayectoria
          const opponents = sim.players.filter(p => p.team !== ball.passReceiver.team && p.position !== 'GK');
          const prevBallX = ball.x - Math.cos(angle) * speed;
          const prevBallY = ball.y - Math.sin(angle) * speed;
          for (let opp of opponents) {
            // Distancia punto-segmento: trayectoria del pase al centro del defensor
            const px = prevBallX, py = prevBallY;
            const qx = ball.x, qy = ball.y;
            const rx = opp.x, ry = opp.y;
            const segDx = qx - px, segDy = qy - py;
            const segLenSq = segDx * segDx + segDy * segDy;
            let t = segLenSq > 0 ? ((rx - px) * segDx + (ry - py) * segDy) / segLenSq : 0;
            t = Math.max(0, Math.min(1, t));
            const closestX = px + t * segDx;
            const closestY = py + t * segDy;
            const oppDistToPath = Math.hypot(rx - closestX, ry - closestY);

            if (oppDistToPath < 22) {
              const interceptProb = (opp.stats.def / 100) * 0.4;
              if (Math.random() < interceptProb) {
                ball.carrier = opp;
                ball.isPassing = false;
                ball.passReceiver = null;
                ball.cooldowns.tackle = 30;
                addCommentaryEvent(sim.minutes, sim.seconds, `¡Intercepción! ${opp.name} leyó el pase y cortó el avance.`, 'tackle');
                break;
              }
            }
          }
        }
      } else {
        ball.isPassing = false;
      }
    } else if (ball.isCrossing) {
      // El balón viaja al punto del centro (área de penalti)
      const targetX = ball.targetX;
      const targetY = ball.targetY;
      const dist = Math.hypot(targetX - ball.x, targetY - ball.y);

      if (dist < 15) {
        ball.isCrossing = false;

        const winger = ball.passReceiver;
        const attackingTeam = winger.team;

        // Buscar el atacante y defensor más cercanos al área de centro
        const attackers = sim.players.filter(p => p.team === attackingTeam && p.position !== 'GK' && p.id !== winger.id);
        const defenders = sim.players.filter(p => p.team !== attackingTeam && p.position !== 'GK');

        let bestAttacker = null;
        let minAttDist = Infinity;
        attackers.forEach(p => {
          const d = Math.hypot(p.x - targetX, p.y - targetY);
          if (d < minAttDist) { minAttDist = d; bestAttacker = p; }
        });

        let bestDefender = null;
        let minDefDist = Infinity;
        defenders.forEach(p => {
          const d = Math.hypot(p.x - targetX, p.y - targetY);
          if (d < minDefDist) { minDefDist = d; bestDefender = p; }
        });

        if (bestAttacker && bestDefender) {
          // Duelo de cabezazo
          let diffModifier = 1.0;
          if (attackingTeam === 'away') {
            if (difficulty === 'easy') diffModifier = 0.6;
            else if (difficulty === 'hard') diffModifier = 1.3;
          } else {
            if (difficulty === 'easy') diffModifier = 1.3;
            else if (difficulty === 'hard') diffModifier = 0.7;
          }

          const attPower = (bestAttacker.stats.phy * 0.4 + bestAttacker.stats.sho * 0.6) * diffModifier;
          const defPower = (bestDefender.stats.phy * 0.5 + bestDefender.stats.def * 0.5);
          const attChance = attPower / (attPower + defPower);

          if (Math.random() < attChance) {
            // Remate a puerta
            ball.isShooting = true;
            ball.passReceiver = bestAttacker; // tirador

            const goalX = attackingTeam === 'home' ? 1265 : 35;
            const goalY = 375 + (Math.random() - 0.5) * 80;
            ball.targetX = goalX;
            ball.targetY = goalY;
            ball.cooldowns.shoot = 60;

            const headerTypes = ['remate de cabeza impecable', 'potente testarazo', 'espectacular remate de volea'];
            const headerType = headerTypes[Math.floor(Math.random() * headerTypes.length)];

            addCommentaryEvent(
              sim.minutes, 
              sim.seconds, 
              `¡Remata ${bestAttacker.name}! Conecta un ${headerType} directo a puerta.`, 
              'shoot'
            );
          } else {
            // Despeje
            ball.carrier = null;
            const clearDir = attackingTeam === 'home' ? -1 : 1;
            ball.vx = clearDir * (6 + Math.random() * 5);
            ball.vy = (Math.random() - 0.5) * 8;
            ball.cooldowns.tackle = 30;

            const clearTypes = ['despeja el peligro', 'revienta el balón de cabeza', 'gana la posición y aleja el balón'];
            const clearType = clearTypes[Math.floor(Math.random() * clearTypes.length)];

            addCommentaryEvent(
              sim.minutes, 
              sim.seconds, 
              `¡Excelente defensivamente ${bestDefender.name}! Se eleva y ${clearType}.`, 
              'tackle'
            );
          }
        } else {
          ball.carrier = null;
          ball.vx = (Math.random() - 0.5) * 4;
          ball.vy = (Math.random() - 0.5) * 4;
        }
      } else {
        // El centro viaja con velocidad fija precalculada
        const nextCX = ball.x + ball.vx;
        const nextCY = ball.y + ball.vy;
        if (nextCX < 30 || nextCX > 1270 || nextCY < 30 || nextCY > 720) {
          // Centro salió del campo sin llegar al área
          restartPlay('goalkick', nextCX, nextCY);
        } else {
          ball.x += ball.vx;
          ball.y += ball.vy;
        }
      }
    } else if (ball.isShooting) {
      // El balón viaja hacia la portería rival
      const targetX = ball.targetX;
      const targetY = ball.targetY;
      const attackingTeam = targetX > 500 ? 'home' : 'away';
      const gk = sim.players.find(p => p.team !== attackingTeam && p.position === 'GK');

      // 1. Mover el balón primero
      ball.x += ball.vx;
      ball.y += ball.vy;

      // 2. Comprobar si el balón cruzó la línea de gol
      const goalTop = 320;
      const goalBottom = 430;
      const inGoalY = ball.y >= goalTop && ball.y <= goalBottom;

      let goalDetected = false;
      if (attackingTeam === 'home' && ball.x >= 1285 && inGoalY) {
        goalDetected = true;
      } else if (attackingTeam === 'away' && ball.x <= 15 && inGoalY) {
        goalDetected = true;
      }

      if (goalDetected) {
        // 3. El balón llegó a la portería: comprobar si el portero lo para
        ball.isShooting = false;
        ball.vx = 0;
        ball.vy = 0;

        const shooter = ball.passReceiver;
        const shootStat = shooter ? shooter.stats.sho : 75;
        const gkStat = gk ? gk.stats.def : 75;

        let difficultyMultiplier = 1.0;
        if (attackingTeam === 'away') {
          if (difficulty === 'easy') difficultyMultiplier = 0.6;
          else if (difficulty === 'hard') difficultyMultiplier = 1.4;
        } else {
          if (difficulty === 'easy') difficultyMultiplier = 1.3;
          else if (difficulty === 'hard') difficultyMultiplier = 0.7;
        }

        const saveChance = (gkStat / (gkStat + shootStat * difficultyMultiplier)) * 0.75;

        sim.stats.shots[attackingTeam]++;
        sim.stats.shotsOnTarget[attackingTeam]++;

        if (Math.random() < saveChance) {
          // Atajada del portero
          sim.stats.saves[gk.team]++;
          ball.x = gk.x + (attackingTeam === 'home' ? -40 : 40);
          ball.y = gk.y + (Math.random() > 0.5 ? 50 : -50);
          ball.vx = (Math.random() - 0.5) * 6;
          ball.vy = (Math.random() - 0.5) * 6;
          ball.carrier = null;

          addCommentaryEvent(
            sim.minutes,
            sim.seconds,
            `¡Paradón de ${gk.name}! Salva un gol cantado tras el remate de ${shooter ? shooter.name : 'atacante'}.`,
            'save'
          );
        } else {
          // ¡¡GOL!!
          if (attackingTeam === 'home') {
            sim.homeScore++;
            setScore(prev => ({ ...prev, home: sim.homeScore }));
          } else {
            sim.awayScore++;
            setScore(prev => ({ ...prev, away: sim.awayScore }));
          }

          addCommentaryEvent(
            sim.minutes,
            sim.seconds,
            `¡¡¡GOOOOOL!!! ${shooter ? shooter.name : '¡Espectacular!'} define con clase y anota para ${attackingTeam === 'home' ? user.username : sim.opponentName}.`,
            'goal'
          );

          if (sim.speed < 10) {
            triggerGoalOverlay(shooter ? shooter.name : 'GOAL');
          }

          resetToKickoff(attackingTeam === 'home' ? 'away' : 'home');
        }

      } else if (ball.x < 30 || ball.x > 1270 || ball.y < 30 || ball.y > 720) {
        // 4. Fuera de campo
        const wentPastGoalLine = ball.x < 30 || ball.x > 1270;
        if (wentPastGoalLine) {
          const shooterTeam = ball.passReceiver?.team;
          const isAttackingHome = ball.vx > 0;
          const outTeam = isAttackingHome ? 'home' : 'away';
          if (shooterTeam === outTeam) {
            restartPlay('goalkick', ball.x, ball.y);
          } else {
            restartPlay('corner', ball.x, ball.y);
          }
        } else {
          restartPlay('throwin', ball.x, ball.y);
        }
      }
    // fin isShooting

    } else {
      // Balón suelto (física inercial básica)
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= 0.95; // Fricción
      ball.vy *= 0.95;

      // Límites del campo para balón suelto: reiniciar el juego correctamente
      if (ball.x < 30 || ball.x > 1270) {
        // Salió por la línea de fondo: córner o saque de puerta
        // Determinar basado en quién lo tocó último
        const lastTeam = ball.passReceiver?.team || 'home';
        const isLeft = ball.x < 30;
        const teamDefendingLeft = sim.players.find(p => p.position === 'GK' && p.team === 'home')?.x < 200 ? 'home' : 'away';
        if (lastTeam === teamDefendingLeft && isLeft) {
          restartPlay('corner', ball.x, ball.y);
        } else if (lastTeam !== teamDefendingLeft && !isLeft) {
          restartPlay('corner', ball.x, ball.y);
        } else {
          restartPlay('goalkick', ball.x, ball.y);
        }
      } else if (ball.y < 30 || ball.y > 720) {
        // Salió por la banda: saque de banda
        restartPlay('throwin', ball.x, ball.y);
      }

      // Buscar al jugador más cercano de cualquier equipo para recoger el balón
      sim.players.forEach(p => {
        const dist = Math.hypot(p.x - ball.x, p.y - ball.y);
        if (dist < 18) {
          ball.carrier = p;
          ball.vx = 0;
          ball.vy = 0;
          ball.cooldowns.tackle = 20; // Pequeño delay de posesión segura
        }
      });
    }
  };

  // Pase ejecutado
  const executePass = (fromPlayer, toPlayer) => {
    const sim = simStateRef.current;
    sim.ball.carrier = null;
    sim.ball.isPassing = true;
    sim.ball.passReceiver = toPlayer;
    
    // El balón viaja desde la posición del emisor
    sim.ball.x = fromPlayer.x;
    sim.ball.y = fromPlayer.y;
    sim.ball.cooldowns.pass = 40; // Cooldown para evitar pases inmediatos consecutivos
    
    if (Math.random() < 0.25) {
      addCommentaryEvent(sim.minutes, sim.seconds, `${fromPlayer.name} la juega al espacio para ${toPlayer.name}.`, 'info');
    }
  };

  // Centro al área ejecutado
  const executeCross = (winger) => {
    const sim = simStateRef.current;
    sim.ball.carrier = null;
    sim.ball.isCrossing = true;
    sim.ball.passReceiver = winger; // centrador

    sim.ball.x = winger.x;
    sim.ball.y = winger.y;
    sim.ball.cooldowns.pass = 60; // Cooldown de pase

    // Destino del centro: la olla
    const targetX = winger.team === 'home'
      ? 1140 + (Math.random() - 0.5) * 80
      : 160 + (Math.random() - 0.5) * 80;
    const targetY = 375 + (Math.random() - 0.5) * 120;

    sim.ball.targetX = targetX;
    sim.ball.targetY = targetY;

    // Calcular velocidad fija del centro (trayectoria recta sin desviación)
    const crossDist = Math.hypot(targetX - winger.x, targetY - winger.y);
    const crossSpeed = 10;
    sim.ball.vx = ((targetX - winger.x) / crossDist) * crossSpeed;
    sim.ball.vy = ((targetY - winger.y) / crossDist) * crossSpeed;

    addCommentaryEvent(
      sim.minutes, 
      sim.seconds, 
      `¡${winger.name} desborda por la banda y cuelga un centro peligroso al área!`, 
      'shoot'
    );
  };

  // Tiro ejecutado
  const executeShot = (shooter) => {
    const sim = simStateRef.current;
    sim.ball.carrier = null;
    sim.ball.isShooting = true;
    sim.ball.passReceiver = shooter; // Almacenamos al tirador aquí temporalmente
    sim.ball.x = shooter.x;
    sim.ball.y = shooter.y;

    // Apuntar a puerta con un pequeño offset aleatorio vertical
    const targetX = shooter.team === 'home' ? 1265 : 35;
    const targetY = 375 + (Math.random() - 0.5) * 80; // La portería mide 110 de alto (320 a 430)

    sim.ball.targetX = targetX;
    sim.ball.targetY = targetY;

    // Calcular velocidad fija una sola vez (trayectoria recta sin desviación)
    const shotDist = Math.hypot(targetX - shooter.x, targetY - shooter.y);
    const shotSpeed = 18;
    sim.ball.vx = ((targetX - shooter.x) / shotDist) * shotSpeed;
    sim.ball.vy = ((targetY - shooter.y) / shotDist) * shotSpeed;

    sim.ball.cooldowns.shoot = 80; // Cooldown de tiro largo

    addCommentaryEvent(sim.minutes, sim.seconds, `¡Ojo! ${shooter.name} se perfila... ¡Saca un disparo con potencia!`, 'shoot');
  };

  // Encontrar el jugador más cercano
  const getClosestPlayer = (x, y, team) => {
    const sim = simStateRef.current;
    let closest = null;
    let minDist = Infinity;

    sim.players.forEach(p => {
      if (p.team === team && p.position !== 'GK') {
        const dist = Math.hypot(p.x - x, p.y - y);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
    });

    return closest;
  };

  // Overlay de Gol temporal en UI
  const [goalScorer, setGoalScorer] = useState(null);
  const goalFlashRef = useRef(0);
  const triggerGoalOverlay = (name) => {
    setGoalScorer(name);
    goalFlashRef.current = 30;
    setTimeout(() => {
      setGoalScorer(null);
    }, 2500);
  };

  // Enviar resultado al backend
  const completeMatchBackend = async (homeScore, awayScore) => {
    // Evitar múltiples llamadas
    if (showRewards) return;

    let result = 'draw';
    if (homeScore > awayScore) result = 'win';
    else if (homeScore < awayScore) result = 'loss';

    try {
      const res = await api.post('/matches/complete', {
        result,
        difficulty,
        mode,
      });

      if (res.data.success) {
        setRewards({
          coins: res.data.coinReward,
          elo: res.data.eloChange,
        });
        
        // Actualizar el usuario global en Zustand para que los cambios se reflejen al volver a la web
        setUser(res.data.updatedUser);
        setShowRewards(true);
      }
    } catch (err) {
      console.error('Error recording match result:', err);
      // Fallback local por si el backend falla en el guardado
      setShowRewards(true);
    }
  };

  // Renderizado en Canvas (60fps)
  useEffect(() => {
    if (loading) return;

    let animFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    let lastMin = -1;
    let lastSec = -1;
    
    const render = () => {
      // 1. Ejecutar lógica si el partido está en juego (o kickoff / restart)
      const sim = simStateRef.current;
      if (sim.status === 'playing' || sim.status === 'kickoff' || sim.status === 'restart') {
        updateSimulationLogic();
        
        // Sincronizar tiempo y marcador en UI de React periódicamente (solo si cambia el segundo)
        const currentMin = Math.floor(sim.minutes);
        const currentSec = Math.floor(sim.seconds);
        if (currentMin !== lastMin || currentSec !== lastSec) {
          lastMin = currentMin;
          lastSec = currentSec;
          setMatchTime({ minutes: currentMin, seconds: currentSec });
        }
      }

      // Decrementar flash de gol
      if (goalFlashRef.current > 0) goalFlashRef.current--;

      // 2. Limpiar
      ctx.clearRect(0, 0, 1300, 750);

      // 3. Dibujar Campo de Juego
      // Fondo verde césped
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(0, 0, 1300, 750);

      // Rayas del césped (verticales)
      ctx.fillStyle = '#2d6a4f';
      for (let i = 0; i < 15; i += 2) {
        ctx.fillRect(i * (1300 / 15), 0, 1300 / 15, 750);
      }

      // Líneas de cal (blancas)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2.5;

      // Líneas exteriores
      ctx.strokeRect(40, 40, 1220, 670);

      // Línea de medio campo
      ctx.beginPath();
      ctx.moveTo(650, 40);
      ctx.lineTo(650, 710);
      ctx.stroke();

      // Círculo central
      ctx.beginPath();
      ctx.arc(650, 375, 110, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(650, 375, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();

      // Áreas de penalti
      // Izquierda (Home)
      ctx.strokeRect(40, 160, 200, 430); // Gran área
      ctx.strokeRect(40, 260, 70, 230);  // Área chica
      ctx.beginPath();
      ctx.arc(240, 375, 80, -Math.PI/2.6, Math.PI/2.6); // Semióvalo de área
      ctx.stroke();

      // Derecha (Away)
      ctx.strokeRect(1060, 160, 200, 430);
      ctx.strokeRect(1190, 260, 70, 230);
      ctx.beginPath();
      ctx.arc(1060, 375, 80, Math.PI - Math.PI/2.6, Math.PI + Math.PI/2.6);
      ctx.stroke();

      // Porterías (Líneas blancas y red)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      // Izquierda
      ctx.strokeRect(10, 320, 30, 110);
      // Derecha
      ctx.strokeRect(1260, 320, 30, 110);

      // Viñeta de profundidad en los bordes
      const vignetteGrad = ctx.createRadialGradient(650, 375, 300, 650, 375, 750);
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, 1300, 750);

      // 4. Dibujar el Rastro del Balón (Trail) clásico
      const ball = sim.ball;
      const ballSpeed = Math.hypot(ball.vx || 0, ball.vy || 0);
      if (ball.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        for (let i = 1; i < ball.trail.length; i++) {
          ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        }
        ctx.lineTo(ball.x, ball.y);
        ctx.strokeStyle = 'rgba(255, 200, 50, 0.45)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 5. Dibujar Jugadores
      sim.players.forEach((p, pIdx) => {
        const isCarrier = ball.carrier && ball.carrier.id === p.id;
        const isGK = p.position === 'GK';

        // Sombra/glow detrás de cada jugador para profundidad
        ctx.save();
        ctx.shadowColor = p.team === 'home' ? 'rgba(3, 132, 199, 0.5)' : 'rgba(219, 39, 119, 0.5)';
        ctx.shadowBlur = isCarrier ? 18 : 8;

        // Anillo de portador de balón (Pulsante dorado)
        if (isCarrier) {
          ctx.shadowColor = 'rgba(255, 183, 3, 0.7)';
          ctx.shadowBlur = 22;
          ctx.strokeStyle = '#ffb703';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const pulseRadius = 13 + Math.sin(Date.now() / 100) * 3;
          ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Círculo principal del jugador
        let mainGrad = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, 12);

        if (p.team === 'home') {
          if (isGK) {
            mainGrad.addColorStop(0, '#ffe57f');
            mainGrad.addColorStop(0.7, '#ffc107');
            mainGrad.addColorStop(1, '#e6a800');
          } else {
            mainGrad.addColorStop(0, '#bae6fd');
            mainGrad.addColorStop(0.5, '#38bdf8');
            mainGrad.addColorStop(1, '#0369a1');
          }
        } else {
          if (isGK) {
            mainGrad.addColorStop(0, '#ffcc80');
            mainGrad.addColorStop(0.7, '#ff9800');
            mainGrad.addColorStop(1, '#e65100');
          } else {
            mainGrad.addColorStop(0, '#fbcfe8');
            mainGrad.addColorStop(0.5, '#ec4899');
            mainGrad.addColorStop(1, '#9d174d');
          }
        }

        ctx.fillStyle = mainGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Borde exterior con highlight
        ctx.strokeStyle = p.team === 'home' ? 'rgba(226, 232, 240, 0.9)' : 'rgba(30, 41, 59, 0.9)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.stroke();

        // Highlight specular en la parte superior del círculo
        const highlightGrad = ctx.createRadialGradient(p.x - 3, p.y - 4, 0, p.x - 3, p.y - 4, 7);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fill();

        // Indicador de dirección (triángulo pequeño)
        if (sim.status === 'playing' && p.position !== 'GK') {
          const dx = (p._prevX !== undefined ? p.x - p._prevX : 0);
          const dy = (p._prevY !== undefined ? p.y - p._prevY : 0);
          const moveMag = Math.hypot(dx, dy);
          if (moveMag > 0.3) {
            const angle = Math.atan2(dy, dx);
            const tipX = p.x + Math.cos(angle) * 14;
            const tipY = p.y + Math.sin(angle) * 14;
            const leftX = p.x + Math.cos(angle - 0.6) * 8;
            const leftY = p.y + Math.sin(angle - 0.6) * 8;
            const rightX = p.x + Math.cos(angle + 0.6) * 8;
            const rightY = p.y + Math.sin(angle + 0.6) * 8;
            ctx.fillStyle = p.team === 'home' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(236, 72, 153, 0.45)';
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(leftX, leftY);
            ctx.lineTo(rightX, rightY);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Guardar posición previa para calcular dirección en el siguiente frame
        p._prevX = p.x;
        p._prevY = p.y;

        // Texto inside (posición)
        ctx.fillStyle = p.team === 'home' ? '#000' : '#fff';
        ctx.font = 'bold 8px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.position, p.x, p.y + 0.5);

        // Nombre del jugador con fondo sutil para legibilidad
        const nameText = p.name;
        ctx.font = '9px Outfit, sans-serif';
        const nameWidth = ctx.measureText(nameText).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.roundRect(p.x - nameWidth / 2 - 3, p.y - 24, nameWidth + 6, 13, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, p.x, p.y - 17.5);
      });

      // 6. Dibujar el Balón con glow dinámico
      const ballGlow = ball.isShooting ? 25 : ball.isCrossing ? 18 : (ballSpeed > 3 ? 12 : 6);
      const ballGlowColor = ball.isShooting ? 'rgba(255, 100, 0, 0.6)' : ball.isCrossing ? 'rgba(255, 183, 3, 0.5)' : 'rgba(255, 220, 50, 0.3)';

      ctx.save();
      ctx.shadowColor = ballGlowColor;
      ctx.shadowBlur = ballGlow;
      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Diseño interior del balón
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Flash de gol: superponer un destello blanco que se desvanece
      if (goalFlashRef.current > 0) {
        const flashAlpha = goalFlashRef.current / 30;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.7})`;
        ctx.fillRect(0, 0, 1300, 750);
        // Anillo expansivo desde el centro del arco
        const flashRadius = (1 - flashAlpha) * 400;
        ctx.strokeStyle = `rgba(255, 215, 0, ${flashAlpha * 0.5})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, flashRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Solicitar el siguiente frame
      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="match-live-page">
        <div className="match-loading">
          <div className="match-loading-spinner" />
          <p>Preparando simulación táctica...</p>
        </div>
      </div>
    );
  }

  const sim = simStateRef.current;
  const matchMinuteStr = String(matchTime.minutes).padStart(2, '0');
  const matchSecondStr = String(matchTime.seconds).padStart(2, '0');

  return (
    <div className="match-live-page">
      <div className="match-aurora">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
      </div>

      <div className="match-live-container">
        {/* Marcador Superior */}
        <div className="scoreboard-container">
          <div className="scoreboard-side home-side">
            <span className="team-name">{user?.username || 'MI EQUIPO'}</span>
            <div className="team-indicator home-indicator" />
          </div>

          <div className="scoreboard-score-clock">
            <span className="score">{score.home}</span>
            <div className="clock-col">
              <span className="time">{matchMinuteStr}:{matchSecondStr}</span>
              <span className="period">
                {matchTime.minutes < 45 ? '1T' : matchTime.minutes < 90 ? '2T' : 'FIN'}
              </span>
            </div>
            <span className="score">{score.away}</span>
          </div>

          <div className="scoreboard-side away-side">
            <div className="team-indicator away-indicator" />
            <span className="team-name">{sim.opponentName}</span>
          </div>
        </div>

        <div className="match-layout-main">
          {/* Campo de Juego y Controles */}
          <div className="pitch-section">
            <div className="pitch-canvas-wrapper">
              <canvas 
                ref={canvasRef} 
                width="1300" 
                height="750" 
                className="pitch-canvas"
              />
              
              {/* Overlay de Gol */}
              {goalScorer && (
                <div className="goal-banner-overlay animate-goal">
                  <div className="goal-banner-content">
                    <h2>¡¡GOOOOL!!</h2>
                    <p>{goalScorer.toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Pantalla de Inicio / Halftime */}
              {matchStatus === 'not_started' && (
                <div className="pitch-state-overlay">
                  <button className="pitch-play-btn" onClick={handleStartMatch}>
                    COMENZAR SIMULACIÓN
                  </button>
                </div>
              )}

              {matchStatus === 'halftime' && (
                <div className="pitch-state-overlay">
                  <div className="state-modal">
                    <h3>Descanso</h3>
                    <p>Marcador actual: {score.home} - {score.away}</p>
                    <button className="pitch-play-btn" onClick={() => {
                      setMatchStatus('playing');
                      simStateRef.current.status = 'playing';
                      handleSpeedChange(1); // Reanudar a 1x
                      resetToKickoff('away'); // Saca el oponente
                      addCommentaryEvent(45, 0, '¡Comienza la segunda parte! Rueda el balón.', 'whistle');
                    }}>
                      INICIAR SEGUNDO TIEMPO
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel de Controles Tácticos */}
            <div className="controls-panel">
              <div className="control-group speeds">
                <span className="control-label">Velocidad</span>
                <div className="control-buttons">
                  <button 
                    className={`ctrl-btn ${gameSpeed === 0 ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(0)}
                    disabled={matchStatus === 'not_started' || matchStatus === 'finished'}
                  >
                    ⏸
                  </button>
                  <button 
                    className={`ctrl-btn ${gameSpeed === 1 ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(1)}
                    disabled={matchStatus === 'not_started' || matchStatus === 'finished'}
                  >
                    1X
                  </button>
                  <button 
                    className={`ctrl-btn ${gameSpeed === 2 ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(2)}
                    disabled={matchStatus === 'not_started' || matchStatus === 'finished'}
                  >
                    2X
                  </button>
                  <button 
                    className={`ctrl-btn ${gameSpeed === 5 ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(5)}
                    disabled={matchStatus === 'not_started' || matchStatus === 'finished'}
                  >
                    5X
                  </button>
                </div>
              </div>

              <div className="control-group mentalities">
                <span className="control-label">Mentalidad</span>
                <div className="control-buttons">
                  <button 
                    className={`ctrl-btn ${mentality === 'defending' ? 'active' : ''}`}
                    onClick={() => handleMentalityChange('defending')}
                    disabled={matchStatus !== 'playing'}
                  >
                    Defensiva
                  </button>
                  <button 
                    className={`ctrl-btn ${mentality === 'balanced' ? 'active' : ''}`}
                    onClick={() => handleMentalityChange('balanced')}
                    disabled={matchStatus !== 'playing'}
                  >
                    Equilibrada
                  </button>
                  <button 
                    className={`ctrl-btn ${mentality === 'attacking' ? 'active' : ''}`}
                    onClick={() => handleMentalityChange('attacking')}
                    disabled={matchStatus !== 'playing'}
                  >
                    Atacante
                  </button>
                </div>
              </div>

              <button 
                className="skip-btn" 
                onClick={handleSimulateToEnd}
                disabled={matchStatus === 'finished'}
              >
                Simulación Instantánea ⚡
              </button>
            </div>
          </div>

          {/* Panel Lateral: Comentarios y Estadísticas en Vivo */}
          <div className="sidebar-section">
            <div className="sidebar-tabs">
              <div className="tab active">Comentarios en Vivo</div>
            </div>

            <div className="commentary-feed">
              <div className="commentary-scroll">
                {commentary.map((evt) => (
                  <div key={evt.id} className={`feed-item item-${evt.type}`}>
                    <span className="feed-time">{evt.time}</span>
                    <span className="feed-text">{evt.text}</span>
                  </div>
                ))}
                <div ref={commentaryEndRef} />
              </div>
            </div>

            {/* Estadísticas en Vivo */}
            <div className="live-stats">
              <h4>Estadísticas del Encuentro</h4>
              
              <div className="stat-bar-item">
                <div className="labels">
                  <span>{stats.possession.home}%</span>
                  <span>Posesión</span>
                  <span>{stats.possession.away}%</span>
                </div>
                <div className="bar-wrapper">
                  <div className="bar-fill home" style={{ width: `${stats.possession.home}%` }} />
                  <div className="bar-fill away" style={{ width: `${stats.possession.away}%` }} />
                </div>
              </div>

              <div className="stat-row-item">
                <span className="val">{stats.shots.home}</span>
                <span className="label">Disparos</span>
                <span className="val">{stats.shots.away}</span>
              </div>

              <div className="stat-row-item">
                <span className="val">{stats.shotsOnTarget.home}</span>
                <span className="label">Disparos a Puerta</span>
                <span className="val">{stats.shotsOnTarget.away}</span>
              </div>

              <div className="stat-row-item">
                <span className="val">{stats.saves.home}</span>
                <span className="label">Paradas</span>
                <span className="val">{stats.saves.away}</span>
              </div>

              <div className="stat-row-item">
                <span className="val">{stats.passes.home}</span>
                <span className="label">Pases</span>
                <span className="val">{stats.passes.away}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Overlay de Recompensas Post-Partido */}
      {showRewards && (
        <div className="rewards-overlay">
          <div className="rewards-modal">
            <h2>Partido Finalizado</h2>
            <div className="result-indicator">
              {score.home > score.away ? (
                <span className="result-badge win">¡VICTORIA!</span>
              ) : score.home === score.away ? (
                <span className="result-badge draw">EMPATE</span>
              ) : (
                <span className="result-badge loss">DERROTA</span>
              )}
            </div>
            
            <div className="final-score-display">
              <span>{score.home}</span>
              <span>-</span>
              <span>{score.away}</span>
            </div>

            <div className="rewards-summary">
              <h3>Recompensas Obtenidas:</h3>
              <div className="reward-row">
                <div className="reward-item coins">
                  <span className="icon">🪙</span>
                  <span className="val">+{rewards.coins} Monedas</span>
                </div>
                
                {mode === 'rivals' && (
                  <div className="reward-item elo">
                    <span className="icon">🏆</span>
                    <span className={`val ${rewards.elo >= 0 ? 'plus' : 'minus'}`}>
                      {rewards.elo >= 0 ? `+${rewards.elo}` : rewards.elo} GRL / ELO
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button className="confirm-btn" onClick={() => navigate('/matches')}>
              VOLVER AL HUB DE PARTIDOS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
