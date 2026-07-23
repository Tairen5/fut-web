import { FORMATIONS } from './formations';
import { genomeToPlayers } from './evolutionEngine';

const FORMATION_TEMPLATE = FORMATIONS['4-3-3'].positions;
const MATCH_DURATION = 90;
const SPEED = 100;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function createFixedOpponent() {
  const names = ['Mendy', 'Romero', 'Stones', 'Maguire', 'Trippier', 'Rice', 'Mount', 'Eriksen', 'Rashford', 'Nunez', 'Saka'];
  return FORMATION_TEMPLATE.map((pos, idx) => {
    const overall = 80;
    return {
      id: `away_${pos.index}`,
      name: names[idx],
      position: pos.pos,
      index: pos.index,
      team: 'away',
      stats: {
        pac: overall + Math.floor((Math.random() - 0.5) * 6),
        sho: overall + Math.floor((Math.random() - 0.5) * 6),
        pas: overall + Math.floor((Math.random() - 0.5) * 6),
        dri: overall + Math.floor((Math.random() - 0.5) * 6),
        def: overall + Math.floor((Math.random() - 0.5) * 6),
        phy: overall + Math.floor((Math.random() - 0.5) * 6),
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
}

function mapPositions(players, team) {
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
}

function getClosestPlayer(x, y, team, players) {
  let closest = null;
  let minDist = Infinity;
  for (const p of players) {
    if (p.team === team && p.position !== 'GK') {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < minDist) { minDist = d; closest = p; }
    }
  }
  return closest;
}

// ─── Simulación completa de un partido ───
export function simulateMatch(homeGenome) {
  const homePlayers = mapPositions(genomeToPlayers(homeGenome, 'home'), 'home');
  const awayPlayers = mapPositions(createFixedOpponent(), 'away');
  const allPlayers = [...homePlayers, ...awayPlayers];

  const tactics = homeGenome.tactics;

  const ball = {
    x: 650, y: 375, vx: 0, vy: 0,
    carrier: null, isPassing: false, isShooting: false, isCrossing: false,
    targetX: 650, targetY: 375,
    passReceiver: null, trail: [],
    cooldowns: { tackle: 0, pass: 0, shoot: 0 },
  };

  let minutes = 0;
  let seconds = 0;
  let homeScore = 0;
  let awayScore = 0;
  let status = 'playing';
  let kickoffTeam = 'home';
  let kickoffCooldown = 60;
  let restartCooldown = 0;
  let restartReason = null;
  let restartX = 0;
  let restartY = 0;

  const stats = {
    possessionTicks: { home: 0, away: 0 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    saves: { home: 0, away: 0 },
    passes: { home: 0, away: 0 },
  };

  function resetToKickoff(team) {
    kickoffTeam = team;
    kickoffCooldown = 60;
    status = 'kickoff';
    ball.carrier = null;
    ball.isPassing = false;
    ball.isShooting = false;
    ball.isCrossing = false;
    ball.vx = 0;
    ball.vy = 0;
    ball.x = 650;
    ball.y = 375;
    ball.cooldowns = { tackle: 0, pass: 0, shoot: 0 };
    allPlayers.forEach((p) => {
      p.x = p.baseX;
      p.y = p.baseY;
    });
  }

  function restartPlay(reason, outX, outY) {
    restartReason = reason;
    restartX = outX;
    restartY = outY;
    restartCooldown = 90;
    status = 'restart';
    ball.isPassing = false;
    ball.isShooting = false;
    ball.isCrossing = false;
    ball.carrier = null;
    ball.vx = 0;
    ball.vy = 0;
  }

  function executeRestart() {
    const team = restartReason === 'goalkick' || restartReason === 'corner'
      ? 'away'
      : (restartY < 375 ? 'home' : 'away');

    if (restartReason === 'goalkick') {
      const gk = allPlayers.find(p => p.team === team && p.position === 'GK');
      if (gk) {
        const targets = allPlayers.filter(p => p.team === team && p.position !== 'GK');
        if (targets.length > 0) {
          const receiver = targets[Math.floor(Math.random() * targets.length)];
          ball.x = gk.x;
          ball.y = gk.y;
          ball.isPassing = true;
          ball.passReceiver = receiver;
          ball.cooldowns.pass = 40;
        }
      }
    } else if (restartReason === 'corner') {
      const winger = allPlayers.find(p => p.team === team && ['LW', 'RW', 'LM', 'RM'].includes(p.position));
      if (winger) {
        const targetX = team === 'home' ? 1160 + (Math.random() - 0.5) * 80 : 140 + (Math.random() - 0.5) * 80;
        const targetY = 375 + (Math.random() - 0.5) * 120;
        ball.x = restartX;
        ball.y = restartY;
        ball.isCrossing = true;
        ball.passReceiver = winger;
        ball.targetX = targetX;
        ball.targetY = targetY;
        const d = Math.hypot(targetX - restartX, targetY - restartY);
        ball.vx = ((targetX - restartX) / d) * 10;
        ball.vy = ((targetY - restartY) / d) * 10;
        ball.cooldowns.pass = 60;
      }
    } else {
      const nearPlayers = allPlayers
        .filter(p => p.team === team && p.position !== 'GK')
        .map(p => ({ p, d: Math.hypot(p.x - restartX, p.y - restartY) }))
        .sort((a, b) => a.d - b.d);
      if (nearPlayers.length > 0) {
        const thrower = nearPlayers[0].p;
        ball.x = thrower.x;
        ball.y = thrower.y;
        ball.carrier = thrower;
        ball.cooldowns.tackle = 20;
      }
    }
    status = 'playing';
  }

  function executePass(from, to) {
    ball.carrier = null;
    ball.isPassing = true;
    ball.passReceiver = to;
    ball.x = from.x;
    ball.y = from.y;
    ball.cooldowns.pass = 40;
  }

  function executeCross(winger) {
    ball.carrier = null;
    ball.isCrossing = true;
    ball.passReceiver = winger;
    ball.x = winger.x;
    ball.y = winger.y;
    ball.cooldowns.pass = 60;
    const targetX = winger.team === 'home' ? 1140 + (Math.random() - 0.5) * 80 : 160 + (Math.random() - 0.5) * 80;
    const targetY = 375 + (Math.random() - 0.5) * 120;
    ball.targetX = targetX;
    ball.targetY = targetY;
    const d = Math.hypot(targetX - winger.x, targetY - winger.y);
    ball.vx = ((targetX - winger.x) / d) * 10;
    ball.vy = ((targetY - winger.y) / d) * 10;
  }

  function executeShot(shooter) {
    ball.carrier = null;
    ball.isShooting = true;
    ball.passReceiver = shooter;
    ball.x = shooter.x;
    ball.y = shooter.y;
    const targetX = shooter.team === 'home' ? 1265 : 35;
    const targetY = 375 + (Math.random() - 0.5) * 80;
    ball.targetX = targetX;
    ball.targetY = targetY;
    const d = Math.hypot(targetX - shooter.x, targetY - shooter.y);
    ball.vx = ((targetX - shooter.x) / d) * 18;
    ball.vy = ((targetY - shooter.y) / d) * 18;
    ball.cooldowns.shoot = 80;
  }

  // ─── Bucle principal ───
  while (minutes < MATCH_DURATION) {
    const minutesPerFrame = 0.025 * SPEED;
    minutes += minutesPerFrame;
    seconds = Math.floor((minutes % 1) * 60);

    if (ball.cooldowns.tackle > 0) ball.cooldowns.tackle -= SPEED;
    if (ball.cooldowns.pass > 0) ball.cooldowns.pass -= SPEED;
    if (ball.cooldowns.shoot > 0) ball.cooldowns.shoot -= SPEED;

    if (status === 'kickoff') {
      kickoffCooldown -= SPEED;
      if (kickoffCooldown <= 0) {
        const kickoffPlayers = allPlayers.filter(p => p.team === kickoffTeam && p.position !== 'GK');
        if (kickoffPlayers.length > 0) {
          ball.carrier = kickoffPlayers[Math.floor(Math.random() * kickoffPlayers.length)];
        }
        status = 'playing';
      }
      allPlayers.forEach((p) => { p.x += (p.baseX - p.x) * 0.1; p.y += (p.baseY - p.y) * 0.1; });
    } else if (status === 'restart') {
      restartCooldown -= SPEED;
      if (restartCooldown <= 0) executeRestart();
    } else if (status === 'playing') {
      if (ball.carrier) {
        stats.possessionTicks[ball.carrier.team]++;
      }

      allPlayers.forEach((p) => {
        const isCarrier = ball.carrier && ball.carrier.id === p.id;
        let targetX = p.baseX;
        let targetY = p.baseY;

        if (p.position !== 'GK') {
          const ballShiftX = (ball.x - 650) * tactics.ballShiftX;
          const ballShiftY = (ball.y - p.baseY) * tactics.ballShiftY;
          targetX += ballShiftX;
          targetY += ballShiftY;

          if (p.team === 'home') {
            targetX += tactics.attackingBias * 100;
          }
        }

        const isHomeAttacking = (ball.carrier && ball.carrier.team === 'home') || (!ball.carrier && (ball.passReceiver?.team === 'home' || ball.isCrossing));
        const isAwayAttacking = (ball.carrier && ball.carrier.team === 'away') || (!ball.carrier && (ball.passReceiver?.team === 'away' || ball.isCrossing));
        const isAttacking = p.team === 'home' ? isHomeAttacking : isAwayAttacking;

        if (isCarrier) {
          if (['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(p.position)) {
            targetX = p.team === 'home' ? 1150 : 150;
            targetY = p.baseY < 375 ? 90 : 660;
          } else {
            targetX = p.team === 'home' ? 1220 : 80;
            targetY = 375 + Math.sin(minutes) * 60;
          }
        } else {
          const isWinger = ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(p.position);
          if (isWinger && isAttacking && p.position !== 'GK') {
            targetY = p.baseY < 375 ? 80 + Math.sin(minutes * 0.1) * 30 : 670 + Math.cos(minutes * 0.1) * 30;
            if (p.team === 'home') {
              targetX = clamp(targetX, Math.max(180, ball.x - 100), Math.min(1120, ball.x + 100));
            } else {
              targetX = clamp(targetX, Math.max(180, ball.x - 100), Math.min(1120, ball.x + 100));
            }
          }

          if (ball.isCrossing) {
            if (p.position === 'ST' || p.position === 'CAM' || p.position.includes('CB') || p.position === 'CDM') {
              targetX = ball.targetX;
              targetY = ball.targetY;
            }
          }

          if (p.position === 'GK') {
            targetY = clamp(ball.y, 290, 460);
            targetX = p.team === 'home' ? 80 : 1220;
          } else if (!ball.isCrossing) {
            const carrier = ball.carrier;
            // Si el portero rival tiene el balón, no presionar - salir del área
            if (carrier && carrier.team !== p.team && carrier.position === 'GK') {
              const areaLeft = 40, areaRight = 240;
              const areaTop = 160, areaBottom = 590;
              if (p.team === 'home') {
                if (p.x < areaRight && p.y > areaTop && p.y < areaBottom) {
                  targetX = areaRight + 60;
                  targetY = 375 + (p.baseY - 375) * 1.5;
                }
              } else {
                if (p.x > areaLeft && p.x < (1300 - areaRight + 40) && p.y > areaTop && p.y < areaBottom) {
                  targetX = 1300 - areaRight - 60;
                  targetY = 375 + (p.baseY - 375) * 1.5;
                }
              }
            } else if (carrier && carrier.team !== p.team) {
              const closest = getClosestPlayer(ball.x, ball.y, p.team, allPlayers);
              if (closest && closest.id === p.id) {
                const pressRange = tactics.pressDistance * tactics.pressIntensity;
                if (Math.hypot(ball.x - p.x, ball.y - p.y) < pressRange) {
                  targetX = ball.x;
                  targetY = ball.y;
                }
              }
            } else if (!carrier) {
              const closest = getClosestPlayer(ball.x, ball.y, p.team, allPlayers);
              if (closest && closest.id === p.id) {
                const pressRange = tactics.pressDistance * tactics.pressIntensity * 0.85;
                if (Math.hypot(ball.x - p.x, ball.y - p.y) < pressRange) {
                  targetX = ball.x;
                  targetY = ball.y;
                }
              }
            }

            if ((p.position.includes('B') || p.position === 'CDM' || p.position.includes('M')) && carrier && carrier.team !== p.team) {
              targetY = targetY * 0.65 + ball.y * 0.35;
            }

            // Juego por banda vs centro
            if (p.position !== 'GK' && carrier && carrier.team === p.team) {
              if (Math.random() < tactics.playThroughCenter) {
                targetY = targetY * 0.7 + 375 * 0.3;
              }
            }

            // Contraataque: si recuperamos el balón, avanzar rápido
            if (carrier && carrier.team === p.team && p.team === 'home') {
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

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          let speed = (1.8 + (p.stats.pac / 100) * 2.2) * Math.max(SPEED, 1);
          if (isCarrier) speed *= 0.9;
          const move = Math.min(dist, speed);
          p.x += (dx / dist) * move;
          p.y += (dy / dist) * move;
        }
      });

      // Ball physics
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();

      if (ball.carrier) {
        const carrier = ball.carrier;
        const dirX = carrier.team === 'home' ? 1 : -1;
        ball.x = carrier.x + dirX * 8;
        ball.y = carrier.y + 4;
        ball.vx = 0;
        ball.vy = 0;

        // Si el portero tiene el balón, sacar largo inmediatamente
        if (carrier.position === 'GK' && ball.cooldowns.pass <= 0) {
          const teammates = allPlayers.filter(p => p.team === carrier.team && p.id !== carrier.id && p.position !== 'GK');
          if (teammates.length > 0) {
            // Elegir el más adelantado posible
            const sorted = teammates.sort((a, b) => {
              const advA = carrier.team === 'home' ? a.x : 1300 - a.x;
              const advB = carrier.team === 'home' ? b.x : 1300 - b.x;
              return advB - advA;
            });
            const receiver = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
            executePass(carrier, receiver);
          }
        } else if (carrier.position !== 'GK') {

        const isWinger = ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(carrier.position);
        const inCrossZone = carrier.team === 'home'
          ? (carrier.x > 750 && (carrier.y < 150 || carrier.y > 430))
          : (carrier.x < 250 && (carrier.y < 150 || carrier.y > 430));

        if (isWinger && inCrossZone && ball.cooldowns.pass <= 0 && Math.random() < tactics.crossChance) {
          executeCross(carrier);
        } else {
          // Determinar si buscar gol directamente
          const goalSeek = tactics.goalSeekingIntensity;
          const dynamicShotRange = 1200 - (goalSeek * 350);
          const shotRange = carrier.team === 'home' ? dynamicShotRange : (1300 - dynamicShotRange);
          const inRange = carrier.team === 'home' ? carrier.x > shotRange : carrier.x < shotRange;
          const effectiveShootChance = tactics.shootChance * (1 + goalSeek * 0.5);

          if (inRange && Math.random() < effectiveShootChance && ball.cooldowns.shoot <= 0) {
            executeShot(carrier);
          } else {
            const passProb = tactics.passChance + (carrier.stats.pas / 100) * 0.01;
            if (Math.random() < passProb && ball.cooldowns.pass <= 0) {
              const teammates = allPlayers.filter(p => p.team === carrier.team && p.id !== carrier.id && p.position !== 'GK');
              const forward = teammates.filter(p => carrier.team === 'home' ? p.x > carrier.x - 30 : p.x < carrier.x + 30);
              const pool = forward.length > 0 ? forward : teammates;
              if (pool.length > 0) {
                let receiver;
                if (Math.random() < tactics.forwardPassBias && forward.length > 0) {
                  // Buscar el más adelantado (pase profundo / pase filtrado)
                  receiver = forward.reduce((best, p) => {
                    const adv = carrier.team === 'home' ? p.x - carrier.x : carrier.x - p.x;
                    const bestAdv = carrier.team === 'home' ? best.x - carrier.x : carrier.x - best.x;
                    return adv > bestAdv ? p : best;
                  });
                } else if (Math.random() < tactics.throughBallFrequency && forward.length > 0) {
                  // Pase filtrado: buscar al que esté en mejor posición de carrera
                  receiver = forward.reduce((best, p) => {
                    const distToGoal = carrier.team === 'home'
                      ? Math.hypot(1260 - p.x, 375 - p.y)
                      : Math.hypot(40 - p.x, 375 - p.y);
                    const bestDist = carrier.team === 'home'
                      ? Math.hypot(1260 - best.x, 375 - best.y)
                      : Math.hypot(40 - best.x, 375 - best.y);
                    return distToGoal < bestDist ? p : best;
                  });
                } else {
                  receiver = pool[Math.floor(Math.random() * pool.length)];
                }
                executePass(carrier, receiver);
              }
            } else if (Math.random() < tactics.dribbleBias * 0.3) {
              // Regateo: no hacer nada, el movimiento ya avanza hacia el arco
            }
          }

          const opponents = allPlayers.filter(p => p.team !== carrier.team && p.position !== 'GK');
          for (const opp of opponents) {
            const oppDist = Math.hypot(opp.x - carrier.x, opp.y - carrier.y);
            if (oppDist < 24 && ball.cooldowns.tackle <= 0) {
              const tackleProb = (opp.stats.def / (opp.stats.def + carrier.stats.dri)) * 0.65;
              if (Math.random() < tackleProb) {
                ball.carrier = opp;
                ball.cooldowns.tackle = 30;
                break;
              }
            }
          }
        }
      }
      } else if (ball.isPassing && ball.passReceiver) {
        const receiver = ball.passReceiver;
        const dist = Math.hypot(receiver.x - ball.x, receiver.y - ball.y);
        if (dist < 15) {
          ball.carrier = receiver;
          ball.isPassing = false;
          ball.passReceiver = null;
          stats.passes[receiver.team]++;
        } else {
          const angle = Math.atan2(receiver.y - ball.y, receiver.x - ball.x);
          ball.x += Math.cos(angle) * 12;
          ball.y += Math.sin(angle) * 12;

          const opponents = allPlayers.filter(p => p.team !== ball.passReceiver.team && p.position !== 'GK');
          const prevX = ball.x - Math.cos(angle) * 12;
          const prevY = ball.y - Math.sin(angle) * 12;
          for (const opp of opponents) {
            const segDx = ball.x - prevX, segDy = ball.y - prevY;
            const segLenSq = segDx * segDx + segDy * segDy;
            let t = segLenSq > 0 ? ((opp.x - prevX) * segDx + (opp.y - prevY) * segDy) / segLenSq : 0;
            t = clamp(t, 0, 1);
            const closestX = prevX + t * segDx;
            const closestY = prevY + t * segDy;
            if (Math.hypot(opp.x - closestX, opp.y - closestY) < 22) {
              if (Math.random() < (opp.stats.def / 100) * 0.4) {
                ball.carrier = opp;
                ball.isPassing = false;
                ball.passReceiver = null;
                ball.cooldowns.tackle = 30;
                break;
              }
            }
          }
        }
      } else if (ball.isCrossing) {
        const targetX = ball.targetX;
        const targetY = ball.targetY;
        const dist = Math.hypot(targetX - ball.x, targetY - ball.y);
        if (dist < 15) {
          ball.isCrossing = false;
          const winger = ball.passReceiver;
          const attackers = allPlayers.filter(p => p.team === winger.team && p.position !== 'GK' && p.id !== winger.id);
          const defenders = allPlayers.filter(p => p.team !== winger.team && p.position !== 'GK');

          let bestAtt = null, minAtt = Infinity;
          for (const p of attackers) { const d = Math.hypot(p.x - targetX, p.y - targetY); if (d < minAtt) { minAtt = d; bestAtt = p; } }
          let bestDef = null, minDef = Infinity;
          for (const p of defenders) { const d = Math.hypot(p.x - targetX, p.y - targetY); if (d < minDef) { minDef = d; bestDef = p; } }

          if (bestAtt && bestDef) {
            const attPower = (bestAtt.stats.phy * 0.4 + bestAtt.stats.sho * 0.6);
            const defPower = (bestDef.stats.phy * 0.5 + bestDef.stats.def * 0.5);
            if (Math.random() < attPower / (attPower + defPower)) {
              ball.isShooting = true;
              ball.passReceiver = bestAtt;
              ball.x = bestAtt.x;
              ball.y = bestAtt.y;
              const goalX = winger.team === 'home' ? 1265 : 35;
              const goalY = 375 + (Math.random() - 0.5) * 80;
              ball.targetX = goalX;
              ball.targetY = goalY;
              const sd = Math.hypot(goalX - bestAtt.x, goalY - bestAtt.y);
              ball.vx = ((goalX - bestAtt.x) / sd) * 18;
              ball.vy = ((goalY - bestAtt.y) / sd) * 18;
              ball.cooldowns.shoot = 80;
            } else {
              ball.carrier = null;
              ball.vx = (Math.random() - 0.5) * 4;
              ball.vy = (Math.random() - 0.5) * 4;
            }
          } else {
            ball.carrier = null;
            ball.vx = (Math.random() - 0.5) * 4;
            ball.vy = (Math.random() - 0.5) * 4;
          }
        } else {
          ball.x += ball.vx;
          ball.y += ball.vy;
          if (ball.x < 30 || ball.x > 1270 || ball.y < 30 || ball.y > 720) {
            restartPlay('goalkick', ball.x, ball.y);
          }
        }
      } else if (ball.isShooting) {
        const targetX = ball.targetX;
        const targetY = ball.targetY;
        const attackingTeam = targetX > 500 ? 'home' : 'away';
        const gk = allPlayers.find(p => p.team !== attackingTeam && p.position === 'GK');

        ball.x += ball.vx;
        ball.y += ball.vy;

        const goalTop = 320, goalBottom = 430;
        const inGoalY = ball.y >= goalTop && ball.y <= goalBottom;
        let goalDetected = false;
        if (attackingTeam === 'home' && ball.x >= 1285 && inGoalY) goalDetected = true;
        else if (attackingTeam === 'away' && ball.x <= 15 && inGoalY) goalDetected = true;

        if (goalDetected) {
          ball.isShooting = false;
          ball.vx = 0;
          ball.vy = 0;
          const shooter = ball.passReceiver;
          const shootStat = shooter ? shooter.stats.sho : 75;
          const gkStat = gk ? gk.stats.def : 75;
          const saveChance = (gkStat / (gkStat + shootStat)) * 0.75;

          stats.shots[attackingTeam]++;
          stats.shotsOnTarget[attackingTeam]++;

          if (Math.random() < saveChance) {
            stats.saves[gk.team]++;
            ball.x = gk.x + (attackingTeam === 'home' ? -40 : 40);
            ball.y = gk.y + (Math.random() > 0.5 ? 50 : -50);
            ball.vx = (Math.random() - 0.5) * 6;
            ball.vy = (Math.random() - 0.5) * 6;
          } else {
            if (attackingTeam === 'home') homeScore++;
            else awayScore++;
            resetToKickoff(attackingTeam === 'home' ? 'away' : 'home');
          }
        } else if (ball.x < 30 || ball.x > 1270 || ball.y < 30 || ball.y > 720) {
          const wentPastGoalLine = ball.x < 30 || ball.x > 1270;
          if (wentPastGoalLine) {
            const shooterTeam = ball.passReceiver?.team;
            const isAttackingHome = ball.vx > 0;
            const outTeam = isAttackingHome ? 'home' : 'away';
            restartPlay(shooterTeam === outTeam ? 'goalkick' : 'corner', ball.x, ball.y);
          } else {
            restartPlay('throwin', ball.x, ball.y);
          }
        }
      } else {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.96;
        ball.vy *= 0.96;

        allPlayers.forEach((p) => {
          const d = Math.hypot(p.x - ball.x, p.y - ball.y);
          if (d < 18) {
            ball.carrier = p;
            ball.vx = 0;
            ball.vy = 0;
            ball.cooldowns.tackle = 20;
          }
        });

        if (ball.x < 30 || ball.x > 1270) restartPlay('goalkick', ball.x, ball.y);
        else if (ball.y < 30 || ball.y > 720) restartPlay('throwin', ball.x, ball.y);
      }
    }

    if (minutes >= 45 && minutes < 45.5 && status === 'playing') {
      minutes = 45.5;
    }
  }

  let result;
  if (homeScore > awayScore) result = 'win';
  else if (homeScore < awayScore) result = 'loss';
  else result = 'draw';

  return {
    result,
    homeScore,
    awayScore,
    stats,
    minutes: MATCH_DURATION,
  };
}
