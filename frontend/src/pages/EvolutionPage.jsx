import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { createPopulation, evolvePopulation, calculateFitness, genomeToPlayers } from '../utils/evolutionEngine';
import { simulateMatch } from '../utils/evolutionSimulator';
import { FORMATIONS } from '../utils/formations';
import './EvolutionPage.css';

const FORMATION_TEMPLATE = FORMATIONS['4-3-3'].positions;
const POPULATION_SIZE = 20;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function EvolutionPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canvasRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [bestFitness, setBestFitness] = useState(0);
  const [avgFitness, setAvgFitness] = useState(0);
  const [record, setRecord] = useState({ wins: 0, draws: 0, losses: 0 });
  const [history, setHistory] = useState([]);
  const [matchInfo, setMatchInfo] = useState({ homeScore: 0, awayScore: 0, minute: 0 });
  const [currentFormation, setCurrentFormation] = useState(null);

  const populationRef = useRef(null);
  const bestGenomeRef = useRef(null);
  const genCountRef = useRef(0);
  const recordRef = useRef({ wins: 0, draws: 0, losses: 0 });
  const historyRef = useRef([]);
  const animRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const mapPositions = useCallback((players, team) => {
    return players.map((p) => {
      let bx, by;
      if (p.position === 'GK') {
        bx = team === 'home' ? 80 : 1220;
        by = 375;
      } else if (team === 'home') {
        bx = (100 - p.py) / 100 * 1040 + 80;
        by = p.px / 100 * 650 + 50;
      } else {
        bx = 1300 - ((100 - p.py) / 100 * 1040 + 80);
        by = (100 - p.px) / 100 * 650 + 50;
      }
      return { ...p, baseX: bx, baseY: by, x: bx, y: by };
    });
  }, []);

  const runVisualMatch = useCallback((homeGenome) => {
    return new Promise((resolve) => {
      const homePlayers = mapPositions(genomeToPlayers(homeGenome, 'home'), 'home');
      const awayNames = ['Mendy', 'Romero', 'Stones', 'Maguire', 'Trippier', 'Rice', 'Mount', 'Eriksen', 'Rashford', 'Nunez', 'Saka'];
      const awayPlayers = mapPositions(
        FORMATION_TEMPLATE.map((pos, idx) => ({
          id: `away_${pos.index}`, name: awayNames[idx], position: pos.pos, index: pos.index, team: 'away',
          stats: { pac: 80, sho: 80, pas: 80, dri: 80, def: 80, phy: 80 }, overall: 80,
          px: pos.x, py: pos.y, x: 0, y: 0, baseX: 0, baseY: 0,
        })),
        'away'
      );
      const allPlayers = [...homePlayers, ...awayPlayers];
      const tactics = homeGenome.tactics;

      const ball = {
        x: 650, y: 375, vx: 0, vy: 0,
        carrier: null, isPassing: false, isShooting: false, isCrossing: false,
        targetX: 650, targetY: 375, passReceiver: null, trail: [],
        cooldowns: { tackle: 0, pass: 0, shoot: 0 },
      };

      let minutes = 0, seconds = 0, homeScore = 0, awayScore = 0;
      let status = 'playing', kickoffTeam = 'home', kickoffCooldown = 60;
      let restartCooldown = 0, restartReason = null, restartX = 0, restartY = 0;
      const speed = 1;
      const stats = { possessionTicks: { home: 0, away: 0 } };

      const getClosest = (x, y, team) => {
        let best = null, minD = Infinity;
        for (const p of allPlayers) {
          if (p.team === team && p.position !== 'GK') {
            const d = Math.hypot(p.x - x, p.y - y);
            if (d < minD) { minD = d; best = p; }
          }
        }
        return best;
      };

      const resetToKickoff = (team) => {
        kickoffTeam = team; kickoffCooldown = 60; status = 'kickoff';
        ball.carrier = null; ball.isPassing = false; ball.isShooting = false; ball.isCrossing = false;
        ball.vx = 0; ball.vy = 0; ball.x = 650; ball.y = 375;
        ball.cooldowns = { tackle: 0, pass: 0, shoot: 0 };
        allPlayers.forEach((p) => { p.x = p.baseX; p.y = p.baseY; });
      };

      const restartPlay = (reason, ox, oy) => {
        restartReason = reason; restartX = ox; restartY = oy;
        restartCooldown = 90; status = 'restart';
        ball.isPassing = false; ball.isShooting = false; ball.isCrossing = false;
        ball.carrier = null; ball.vx = 0; ball.vy = 0;
      };

      const executeRestart = () => {
        const team = (restartReason === 'goalkick' || restartReason === 'corner') ? 'away' : (restartY < 375 ? 'home' : 'away');
        if (restartReason === 'goalkick') {
          const gk = allPlayers.find(p => p.team === team && p.position === 'GK');
          const targets = allPlayers.filter(p => p.team === team && p.position !== 'GK');
          if (gk && targets.length > 0) {
            const r = targets[Math.floor(Math.random() * targets.length)];
            ball.x = gk.x; ball.y = gk.y; ball.isPassing = true; ball.passReceiver = r; ball.cooldowns.pass = 40;
          }
        } else if (restartReason === 'corner') {
          const w = allPlayers.find(p => p.team === team && ['LW', 'RW', 'LM', 'RM'].includes(p.position));
          if (w) {
            const tx = team === 'home' ? 1160 + (Math.random() - 0.5) * 80 : 140 + (Math.random() - 0.5) * 80;
            const ty = 375 + (Math.random() - 0.5) * 120;
            ball.x = restartX; ball.y = restartY; ball.isCrossing = true; ball.passReceiver = w;
            ball.targetX = tx; ball.targetY = ty;
            const d = Math.hypot(tx - restartX, ty - restartY);
            ball.vx = ((tx - restartX) / d) * 10; ball.vy = ((ty - restartY) / d) * 10;
            ball.cooldowns.pass = 60;
          }
        } else {
          const near = allPlayers.filter(p => p.team === team && p.position !== 'GK')
            .map(p => ({ p, d: Math.hypot(p.x - restartX, p.y - restartY) }))
            .sort((a, b) => a.d - b.d);
          if (near.length > 0) { ball.x = near[0].p.x; ball.y = near[0].p.y; ball.carrier = near[0].p; ball.cooldowns.tackle = 20; }
        }
        status = 'playing';
      };

      const execPass = (from, to) => {
        ball.carrier = null; ball.isPassing = true; ball.passReceiver = to;
        ball.x = from.x; ball.y = from.y; ball.cooldowns.pass = 40;
      };

      const execCross = (w) => {
        ball.carrier = null; ball.isCrossing = true; ball.passReceiver = w;
        ball.x = w.x; ball.y = w.y; ball.cooldowns.pass = 60;
        const tx = w.team === 'home' ? 1140 + (Math.random() - 0.5) * 80 : 160 + (Math.random() - 0.5) * 80;
        const ty = 375 + (Math.random() - 0.5) * 120;
        ball.targetX = tx; ball.targetY = ty;
        const d = Math.hypot(tx - w.x, ty - w.y);
        ball.vx = ((tx - w.x) / d) * 10; ball.vy = ((ty - w.y) / d) * 10;
      };

      const execShot = (sh) => {
        ball.carrier = null; ball.isShooting = true; ball.passReceiver = sh;
        ball.x = sh.x; ball.y = sh.y;
        const tx = sh.team === 'home' ? 1265 : 35;
        const ty = 375 + (Math.random() - 0.5) * 80;
        ball.targetX = tx; ball.targetY = ty;
        const d = Math.hypot(tx - sh.x, ty - sh.y);
        ball.vx = ((tx - sh.x) / d) * 18; ball.vy = ((ty - sh.y) / d) * 18;
        ball.cooldowns.shoot = 80;
      };

      const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const mPF = 0.025 * speed;
        minutes += mPF;
        seconds = Math.floor((minutes % 1) * 60);

        if (ball.cooldowns.tackle > 0) ball.cooldowns.tackle -= speed;
        if (ball.cooldowns.pass > 0) ball.cooldowns.pass -= speed;
        if (ball.cooldowns.shoot > 0) ball.cooldowns.shoot -= speed;

        if (status === 'kickoff') {
          kickoffCooldown -= speed;
          if (kickoffCooldown <= 0) {
            const kp = allPlayers.filter(p => p.team === kickoffTeam && p.position !== 'GK');
            if (kp.length > 0) ball.carrier = kp[Math.floor(Math.random() * kp.length)];
            status = 'playing';
          }
          allPlayers.forEach((p) => { p.x += (p.baseX - p.x) * 0.1; p.y += (p.baseY - p.y) * 0.1; });
        } else if (status === 'restart') {
          restartCooldown -= speed;
          if (restartCooldown <= 0) executeRestart();
        } else if (status === 'playing') {
          if (ball.carrier) stats.possessionTicks[ball.carrier.team]++;

          allPlayers.forEach((p) => {
            const isCarrier = ball.carrier && ball.carrier.id === p.id;
            let targetX = p.baseX, targetY = p.baseY;

            if (p.position !== 'GK') {
              targetX += (ball.x - 650) * tactics.ballShiftX;
              targetY += (ball.y - p.baseY) * tactics.ballShiftY;
              if (p.team === 'home') targetX += tactics.attackingBias * 100;
            }

            const isHomeAtt = (ball.carrier && ball.carrier.team === 'home') || (!ball.carrier && (ball.passReceiver?.team === 'home' || ball.isCrossing));
            const isAwayAtt = (ball.carrier && ball.carrier.team === 'away') || (!ball.carrier && (ball.passReceiver?.team === 'away' || ball.isCrossing));
            const isAtt = p.team === 'home' ? isHomeAtt : isAwayAtt;

            if (isCarrier) {
              if (['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(p.position)) {
                targetX = p.team === 'home' ? 1150 : 150;
                targetY = p.baseY < 375 ? 90 : 660;
              } else {
                targetX = p.team === 'home' ? 1220 : 80;
                targetY = 375 + Math.sin(minutes) * 60;
              }
            } else {
              if (['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(p.position) && isAtt) {
                targetY = p.baseY < 375 ? 80 + Math.sin(minutes * 0.1) * 30 : 670 + Math.cos(minutes * 0.1) * 30;
                targetX = clamp(targetX, Math.max(180, ball.x - 100), Math.min(1120, ball.x + 100));
              }
              if (ball.isCrossing && (p.position === 'ST' || p.position === 'CAM' || p.position.includes('CB') || p.position === 'CDM')) {
                targetX = ball.targetX; targetY = ball.targetY;
              }
              if (p.position === 'GK') {
                targetY = clamp(ball.y, 290, 460); targetX = p.team === 'home' ? 80 : 1220;
              } else if (!ball.isCrossing) {
                const carrier = ball.carrier;
                if (carrier && carrier.team !== p.team && carrier.position === 'GK') {
                  if (p.team === 'home' && p.x < 300 && p.y > 160 && p.y < 590) {
                    targetX = 300; targetY = 375 + (p.baseY - 375) * 1.5;
                  } else if (p.team === 'away' && p.x > 1000 && p.y > 160 && p.y < 590) {
                    targetX = 1000; targetY = 375 + (p.baseY - 375) * 1.5;
                  }
                } else if (carrier && carrier.team !== p.team) {
                  const c = getClosest(ball.x, ball.y, p.team);
                  const pressRange = tactics.pressDistance * tactics.pressIntensity;
                  if (c && c.id === p.id && Math.hypot(ball.x - p.x, ball.y - p.y) < pressRange) {
                    targetX = ball.x; targetY = ball.y;
                  }
                } else if (!carrier) {
                  const c = getClosest(ball.x, ball.y, p.team);
                  const pressRange = tactics.pressDistance * tactics.pressIntensity * 0.85;
                  if (c && c.id === p.id && Math.hypot(ball.x - p.x, ball.y - p.y) < pressRange) {
                    targetX = ball.x; targetY = ball.y;
                  }
                }
                if ((p.position.includes('B') || p.position === 'CDM' || p.position.includes('M')) && carrier && carrier.team !== p.team) {
                  targetY = targetY * 0.65 + ball.y * 0.35;
                }
                if (carrier && carrier.team === p.team && p.team === 'home') {
                  if (Math.random() < tactics.playThroughCenter) {
                    targetY = targetY * 0.7 + 375 * 0.3;
                  }
                  const distToBall = Math.hypot(ball.x - p.x, ball.y - p.y);
                  if (distToBall > 300) {
                    targetX += tactics.counterAttackSpeed * 150;
                  }
                }
              }
            }

            if (p.position !== 'GK' && !ball.isCrossing && !isCarrier) {
              const ts = 0.002 * Date.now();
              targetX += Math.sin(ts + p.index * 1.5) * 20;
              targetY += Math.cos(ts + p.index * 2.3) * 20;
            }

            targetX = clamp(targetX, 40, 1260);
            targetY = clamp(targetY, 40, 710);

            const dx = targetX - p.x, dy = targetY - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
              let spd = (1.8 + (p.stats.pac / 100) * 2.2) * Math.max(speed, 1);
              if (isCarrier) spd *= 0.9;
              const move = Math.min(dist, spd);
              p.x += (dx / dist) * move; p.y += (dy / dist) * move;
            }
          });

          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 8) ball.trail.shift();

          if (ball.carrier) {
            const c = ball.carrier;
            ball.x = c.x + (c.team === 'home' ? 1 : -1) * 8;
            ball.y = c.y + 4; ball.vx = 0; ball.vy = 0;

            if (c.position === 'GK' && ball.cooldowns.pass <= 0) {
              const tm = allPlayers.filter(p => p.team === c.team && p.id !== c.id && p.position !== 'GK');
              if (tm.length > 0) {
                const sorted = tm.sort((a, b) => {
                  const aA = c.team === 'home' ? a.x : 1300 - a.x;
                  const bA = c.team === 'home' ? b.x : 1300 - b.x;
                  return bA - aA;
                });
                const r = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
                execPass(c, r);
              }
            } else if (c.position !== 'GK') {
              const isW = ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(c.position);
            const inCross = c.team === 'home' ? (c.x > 750 && (c.y < 150 || c.y > 430)) : (c.x < 250 && (c.y < 150 || c.y > 430));

            if (isW && inCross && ball.cooldowns.pass <= 0 && Math.random() < tactics.crossChance) {
              execCross(c);
            } else {
              const goalSeek = tactics.goalSeekingIntensity;
              const dynamicShotRange = 1200 - (goalSeek * 350);
              const shotRange = c.team === 'home' ? dynamicShotRange : (1300 - dynamicShotRange);
              const inRange = c.team === 'home' ? c.x > shotRange : c.x < shotRange;
              const effectiveShootChance = tactics.shootChance * (1 + goalSeek * 0.5);

              if (inRange && Math.random() < effectiveShootChance && ball.cooldowns.shoot <= 0) {
                execShot(c);
              } else {
                const pp = tactics.passChance + (c.stats.pas / 100) * 0.01;
                if (Math.random() < pp && ball.cooldowns.pass <= 0) {
                  const tm = allPlayers.filter(p => p.team === c.team && p.id !== c.id && p.position !== 'GK');
                  const fwd = tm.filter(p => c.team === 'home' ? p.x > c.x - 30 : p.x < c.x + 30);
                  const pool = fwd.length > 0 ? fwd : tm;
                  if (pool.length > 0) {
                    let receiver;
                    if (Math.random() < tactics.forwardPassBias && fwd.length > 0) {
                      receiver = fwd.reduce((best, p) => {
                        const adv = c.team === 'home' ? p.x - c.x : c.x - p.x;
                        const bestAdv = c.team === 'home' ? best.x - c.x : c.x - best.x;
                        return adv > bestAdv ? p : best;
                      });
                    } else if (Math.random() < tactics.throughBallFrequency && fwd.length > 0) {
                      receiver = fwd.reduce((best, p) => {
                        const dg = c.team === 'home' ? Math.hypot(1260 - p.x, 375 - p.y) : Math.hypot(40 - p.x, 375 - p.y);
                        const bd = c.team === 'home' ? Math.hypot(1260 - best.x, 375 - best.y) : Math.hypot(40 - best.x, 375 - best.y);
                        return dg < bd ? p : best;
                      });
                    } else {
                      receiver = pool[Math.floor(Math.random() * pool.length)];
                    }
                    execPass(c, receiver);
                  }
                }
              }
              for (const opp of allPlayers.filter(p => p.team !== c.team && p.position !== 'GK')) {
                if (Math.hypot(opp.x - c.x, opp.y - c.y) < 24 && ball.cooldowns.tackle <= 0) {
                  if (Math.random() < (opp.stats.def / (opp.stats.def + c.stats.dri)) * 0.65) {
                    ball.carrier = opp; ball.cooldowns.tackle = 30; break;
                  }
                }
              }
            }
          }
        } else if (ball.isPassing && ball.passReceiver) {
            const r = ball.passReceiver;
            if (Math.hypot(r.x - ball.x, r.y - ball.y) < 15) {
              ball.carrier = r; ball.isPassing = false; ball.passReceiver = null;
            } else {
              const a = Math.atan2(r.y - ball.y, r.x - ball.x);
              ball.x += Math.cos(a) * 12; ball.y += Math.sin(a) * 12;
              const prevX = ball.x - Math.cos(a) * 12, prevY = ball.y - Math.sin(a) * 12;
              for (const opp of allPlayers.filter(p => p.team !== r.team && p.position !== 'GK')) {
                const sdx = ball.x - prevX, sdy = ball.y - prevY;
                const slq = sdx * sdx + sdy * sdy;
                let t = slq > 0 ? ((opp.x - prevX) * sdx + (opp.y - prevY) * sdy) / slq : 0;
                t = clamp(t, 0, 1);
                if (Math.hypot(opp.x - (prevX + t * sdx), opp.y - (prevY + t * sdy)) < 22) {
                  if (Math.random() < (opp.stats.def / 100) * 0.4) {
                    ball.carrier = opp; ball.isPassing = false; ball.passReceiver = null;
                    ball.cooldowns.tackle = 30; break;
                  }
                }
              }
            }
          } else if (ball.isCrossing) {
            const d = Math.hypot(ball.targetX - ball.x, ball.targetY - ball.y);
            if (d < 15) {
              ball.isCrossing = false;
              const w = ball.passReceiver;
              const atk = allPlayers.filter(p => p.team === w.team && p.position !== 'GK' && p.id !== w.id);
              const def = allPlayers.filter(p => p.team !== w.team && p.position !== 'GK');
              let bA = null, mA = Infinity, bD = null, mD = Infinity;
              for (const p of atk) { const dd = Math.hypot(p.x - ball.targetX, p.y - ball.targetY); if (dd < mA) { mA = dd; bA = p; } }
              for (const p of def) { const dd = Math.hypot(p.x - ball.targetX, p.y - ball.targetY); if (dd < mD) { mD = dd; bD = p; } }
              if (bA && bD) {
                const ap = (bA.stats.phy * 0.4 + bA.stats.sho * 0.6);
                const dp = (bD.stats.phy * 0.5 + bD.stats.def * 0.5);
                if (Math.random() < ap / (ap + dp)) {
                  ball.isShooting = true; ball.passReceiver = bA;
                  ball.x = bA.x; ball.y = bA.y;
                  const gx = w.team === 'home' ? 1265 : 35, gy = 375 + (Math.random() - 0.5) * 80;
                  ball.targetX = gx; ball.targetY = gy;
                  const sd = Math.hypot(gx - bA.x, gy - bA.y);
                  ball.vx = ((gx - bA.x) / sd) * 18; ball.vy = ((gy - bA.y) / sd) * 18;
                  ball.cooldowns.shoot = 80;
                } else {
                  ball.carrier = null; ball.vx = (Math.random() - 0.5) * 4; ball.vy = (Math.random() - 0.5) * 4;
                }
              } else {
                ball.carrier = null; ball.vx = (Math.random() - 0.5) * 4; ball.vy = (Math.random() - 0.5) * 4;
              }
            } else {
              ball.x += ball.vx; ball.y += ball.vy;
              if (ball.x < 30 || ball.x > 1270 || ball.y < 30 || ball.y > 720) restartPlay('goalkick', ball.x, ball.y);
            }
          } else if (ball.isShooting) {
            const attTeam = ball.targetX > 500 ? 'home' : 'away';
            const gk = allPlayers.find(p => p.team !== attTeam && p.position === 'GK');
            ball.x += ball.vx; ball.y += ball.vy;
            const inGY = ball.y >= 320 && ball.y <= 430;
            let goalDet = false;
            if (attTeam === 'home' && ball.x >= 1285 && inGY) goalDet = true;
            else if (attTeam === 'away' && ball.x <= 15 && inGY) goalDet = true;

            if (goalDet) {
              ball.isShooting = false; ball.vx = 0; ball.vy = 0;
              const sh = ball.passReceiver;
              const sc = sh ? sh.stats.sho : 75, gc = gk ? gk.stats.def : 75;
              if (Math.random() >= (gc / (gc + sc)) * 0.75) {
                if (attTeam === 'home') homeScore++; else awayScore++;
                resetToKickoff(attTeam === 'home' ? 'away' : 'home');
              } else {
                ball.x = gk.x + (attTeam === 'home' ? -40 : 40);
                ball.y = gk.y + (Math.random() > 0.5 ? 50 : -50);
                ball.vx = (Math.random() - 0.5) * 6; ball.vy = (Math.random() - 0.5) * 6;
              }
            } else if (ball.x < 30 || ball.x > 1270 || ball.y < 30 || ball.y > 720) {
              const wpgl = ball.x < 30 || ball.x > 1270;
              if (wpgl) {
                const st = ball.passReceiver?.team;
                const ia = ball.vx > 0 ? 'home' : 'away';
                restartPlay(st === ia ? 'goalkick' : 'corner', ball.x, ball.y);
              } else {
                restartPlay('throwin', ball.x, ball.y);
              }
            }
          } else {
            ball.x += ball.vx; ball.y += ball.vy;
            ball.vx *= 0.96; ball.vy *= 0.96;
            for (const p of allPlayers) {
              if (Math.hypot(p.x - ball.x, p.y - ball.y) < 18) {
                ball.carrier = p; ball.vx = 0; ball.vy = 0; ball.cooldowns.tackle = 20; break;
              }
            }
            if (ball.x < 30 || ball.x > 1270) restartPlay('goalkick', ball.x, ball.y);
            else if (ball.y < 30 || ball.y > 720) restartPlay('throwin', ball.x, ball.y);
          }
        }

        if (minutes >= 45 && minutes < 45.5 && status === 'playing') minutes = 45.5;

        // ─── RENDER ───
        ctx.clearRect(0, 0, 1300, 750);

        ctx.fillStyle = '#1b4332';
        ctx.fillRect(0, 0, 1300, 750);
        ctx.fillStyle = '#2d6a4f';
        for (let i = 0; i < 15; i += 2) ctx.fillRect(i * (1300 / 15), 0, 1300 / 15, 750);

        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2.5;
        ctx.strokeRect(40, 40, 1220, 670);
        ctx.beginPath(); ctx.moveTo(650, 40); ctx.lineTo(650, 710); ctx.stroke();
        ctx.beginPath(); ctx.arc(650, 375, 110, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(650, 375, 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
        ctx.strokeRect(40, 160, 200, 430); ctx.strokeRect(40, 260, 70, 230);
        ctx.beginPath(); ctx.arc(240, 375, 80, -Math.PI / 2.6, Math.PI / 2.6); ctx.stroke();
        ctx.strokeRect(1060, 160, 200, 430); ctx.strokeRect(1190, 260, 70, 230);
        ctx.beginPath(); ctx.arc(1060, 375, 80, Math.PI - Math.PI / 2.6, Math.PI + Math.PI / 2.6); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.strokeRect(10, 320, 30, 110); ctx.strokeRect(1260, 320, 30, 110);

        const vGrad = ctx.createRadialGradient(650, 375, 300, 650, 375, 750);
        vGrad.addColorStop(0, 'rgba(0,0,0,0)'); vGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = vGrad; ctx.fillRect(0, 0, 1300, 750);

        if (ball.trail.length > 1) {
          ctx.beginPath(); ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
          for (let i = 1; i < ball.trail.length; i++) ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
          ctx.lineTo(ball.x, ball.y);
          ctx.strokeStyle = 'rgba(255,200,50,0.45)'; ctx.lineWidth = 3; ctx.stroke();
        }

        allPlayers.forEach((p) => {
          const isC = ball.carrier && ball.carrier.id === p.id;
          ctx.save();
          ctx.shadowColor = isC ? 'rgba(255,183,3,0.7)' : (p.team === 'home' ? 'rgba(3,132,199,0.5)' : 'rgba(219,39,119,0.5)');
          ctx.shadowBlur = isC ? 18 : 8;

          if (isC) {
            ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(p.x, p.y, 13 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2); ctx.stroke();
          }

          const isGK = p.position === 'GK';
          const g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, 12);
          if (p.team === 'home') {
            g.addColorStop(0, isGK ? '#ffe57f' : '#bae6fd');
            g.addColorStop(0.5, isGK ? '#ffc107' : '#38bdf8');
            g.addColorStop(1, isGK ? '#e6a800' : '#0369a1');
          } else {
            g.addColorStop(0, isGK ? '#ffcc80' : '#fbcfe8');
            g.addColorStop(0.5, isGK ? '#ff9800' : '#ec4899');
            g.addColorStop(1, isGK ? '#e65100' : '#9d174d');
          }
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          ctx.strokeStyle = p.team === 'home' ? 'rgba(226,232,240,0.9)' : 'rgba(30,41,59,0.9)';
          ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.stroke();

          const hl = ctx.createRadialGradient(p.x - 3, p.y - 4, 0, p.x - 3, p.y - 4, 7);
          hl.addColorStop(0, 'rgba(255,255,255,0.35)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = p.team === 'home' ? '#000' : '#fff';
          ctx.font = 'bold 8px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(p.position, p.x, p.y + 0.5);

          ctx.font = '9px Outfit, sans-serif';
          const nw = ctx.measureText(p.name).width;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath(); ctx.roundRect(p.x - nw / 2 - 3, p.y - 24, nw + 6, 13, 3); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillText(p.name, p.x, p.y - 17.5);
        });

        const bGlow = ball.isShooting ? 25 : ball.isCrossing ? 18 : 6;
        ctx.save();
        ctx.shadowColor = ball.isShooting ? 'rgba(255,100,0,0.6)' : 'rgba(255,220,50,0.3)';
        ctx.shadowBlur = bGlow;
        ctx.fillStyle = '#ffb703'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 2, 0, Math.PI * 2); ctx.fill();

        setMatchInfo({ homeScore, awayScore, minute: Math.floor(minutes) });

        if (minutes < 90 && runningRef.current) {
          animRef.current = requestAnimationFrame(render);
        } else {
          resolve({ homeScore, awayScore });
        }
      };

      animRef.current = requestAnimationFrame(render);
    });
  }, [mapPositions]);

  const startEvolution = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);

    let pop = createPopulation(POPULATION_SIZE);
    populationRef.current = pop;

    while (runningRef.current) {
      const fitnesses = [];
      for (const genome of pop) {
        const result = simulateMatch(genome);
        fitnesses.push(calculateFitness(result));

        if (result.result === 'win') recordRef.current.wins++;
        else if (result.result === 'draw') recordRef.current.draws++;
        else recordRef.current.losses++;
      }

      const sorted = pop.map((g, i) => ({ g, f: fitnesses[i] })).sort((a, b) => b.f - a.f);
      bestGenomeRef.current = sorted[0].g;
      genCountRef.current++;

      const best = sorted[0].f;
      const avg = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;

      setGeneration(genCountRef.current);
      setBestFitness(Math.round(best));
      setAvgFitness(Math.round(avg));
      setRecord({ ...recordRef.current });
      setCurrentFormation(sorted[0].g.formation);

      historyRef.current.push({ gen: genCountRef.current, best, avg });
      if (historyRef.current.length > 30) historyRef.current.shift();
      setHistory([...historyRef.current]);

      await runVisualMatch(sorted[0].g);

      pop = evolvePopulation(pop, fitnesses);
      populationRef.current = pop;
    }

    setIsRunning(false);
  }, [runVisualMatch]);

  const stopEvolution = useCallback(() => {
    runningRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const maxBar = history.length > 0 ? Math.max(...history.map((h) => h.best), 1) : 1;

  return (
    <div className="evolution-page">
      <div className="evo-aurora">
        <div className="evo-aurora-blob evo-aurora-1" />
        <div className="evo-aurora-blob evo-aurora-2" />
      </div>

      <div className="evo-container">
        <div className="evo-header">
          <div className="evo-title-block">
            <h1 className="evo-title">Evolution Lab</h1>
            <p className="evo-subtitle">Watch AI teams evolve match after match</p>
          </div>
          <div className="evo-gen-badge">
            <span className="evo-gen-label">GEN</span>
            <span className="evo-gen-num">{generation}</span>
          </div>
        </div>

        <div className="evo-main">
          <div className="evo-canvas-col">
            <div className="evo-canvas-wrapper">
              <canvas ref={canvasRef} width={1300} height={750} className="evo-canvas" />
              {!isRunning && generation === 0 && (
                <div className="evo-canvas-overlay">
                  <button className="evo-play-btn" onClick={startEvolution}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>START EVOLUTION</span>
                  </button>
                </div>
              )}
              {isRunning && (
                <div className="evo-scoreboard">
                  <span className="evo-team home">EVOLVED</span>
                  <span className="evo-score">{matchInfo.homeScore} - {matchInfo.awayScore}</span>
                  <span className="evo-team away">AI RIVALS</span>
                  <span className="evo-clock">{String(matchInfo.minute).padStart(2, '0')}:00</span>
                </div>
              )}
            </div>

            <div className="evo-controls">
              {!isRunning ? (
                <button className="evo-ctrl-btn play" onClick={startEvolution}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {generation === 0 ? 'Start' : 'Resume'}
                </button>
              ) : (
                <button className="evo-ctrl-btn stop" onClick={stopEvolution}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  Pause
                </button>
              )}
            </div>

            {history.length > 0 && (
              <div className="evo-history">
                <div className="evo-history-header">
                  <span>Fitness History</span>
                  <span className="evo-history-legend">
                    <span className="legend-dot best" /> Best
                    <span className="legend-dot avg" /> Avg
                  </span>
                </div>
                <div className="evo-history-bars">
                  {history.map((h, i) => (
                    <div key={i} className="evo-bar-col">
                      <div className="evo-bar-stack">
                        <div className="evo-bar best" style={{ height: `${(h.best / maxBar) * 100}%` }} />
                        <div className="evo-bar avg" style={{ height: `${(h.avg / maxBar) * 100}%` }} />
                      </div>
                      <span className="evo-bar-label">{h.gen}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="evo-sidebar">
            <div className="evo-stats-card">
              <h3>Evolution Stats</h3>
              <div className="evo-stat-row"><span>Generation</span><span className="evo-val">{generation}</span></div>
              <div className="evo-stat-row"><span>Best Fitness</span><span className="evo-val gold">{bestFitness}</span></div>
              <div className="evo-stat-row"><span>Avg Fitness</span><span className="evo-val">{avgFitness}</span></div>
              <div className="evo-divider" />
              <div className="evo-stat-row"><span>Wins</span><span className="evo-val green">{record.wins}</span></div>
              <div className="evo-stat-row"><span>Draws</span><span className="evo-val yellow">{record.draws}</span></div>
              <div className="evo-stat-row"><span>Losses</span><span className="evo-val red">{record.losses}</span></div>
            </div>

            {currentFormation && (
              <div className="evo-formation-card">
                <h3>Best Formation</h3>
                <div className="evo-mini-pitch">
                  <div className="evo-mini-field" />
                  {FORMATION_TEMPLATE.map((pos, i) => {
                    const gene = currentFormation[i];
                    const left = `${gene.py}%`;
                    const top = `${100 - gene.px}%`;
                    return (
                      <div key={i} className="evo-mini-player" style={{ left, top }}>
                        <div className="evo-mini-dot" />
                        <span className="evo-mini-label">{pos.pos}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="evo-tactics-card">
              <h3>Best Tactics</h3>
              {bestGenomeRef.current && Object.entries(bestGenomeRef.current.tactics).map(([key, val]) => (
                <div key={key} className="evo-tactic-row">
                  <span className="evo-tactic-name">{key}</span>
                  <span className="evo-tactic-val">{typeof val === 'number' ? val.toFixed(3) : val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
