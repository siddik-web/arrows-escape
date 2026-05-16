import { useState, useEffect, useRef, useCallback } from 'react';
import type { Arrow, Particle, FloatingText, Direction, PlayerState } from '../types/game';
import { DIRECTIONS, THEMES, COMBO_TIMEOUT, ARROW_TYPES_CONFIG, CHALLENGE_THRESHOLDS } from '../constants/config';
import { SFX, initAudio } from '../lib/audio';

// --- Module-level Utilities (Outside Hook Scope) ---

const computeArrowBlocking = (arrows: Arrow[]) => {
  const hasKey = arrows.some(a => a.type === 'key' && a.status !== 'leaving');
  return arrows.map(a => {
    if (a.status === 'leaving') return a;
    if (a.type === 'stone') return { ...a, blocked: true };
    if (a.type === 'lock' && hasKey) return { ...a, blocked: true };
    if (a.forceUnblocked) return { ...a, blocked: false };
    let isBlocked = false;
    const d = DIRECTIONS[a.dir];
    arrows.forEach(other => {
      if (a === other || other.status === 'leaving') return;
      if (d.dx === 1 && other.y === a.y && other.x > a.x) isBlocked = true;
      if (d.dx === -1 && other.y === a.y && other.x < a.x) isBlocked = true;
      if (d.dy === -1 && other.x === a.x && other.y < a.y) isBlocked = true;
      if (d.dy === 1 && other.x === a.x && other.y > a.y) isBlocked = true;
    });
    return { ...a, blocked: isBlocked };
  });
};

const getExplosionTargets = (x: number, y: number, currentArrows: Arrow[]) => {
  const remaining = currentArrows.filter(a => a.status !== 'leaving');
  const blastCount = Math.min(Math.floor(Math.random() * 3) + 1, remaining.length);
  const targets: Arrow[] = [];
  const pool = [...remaining];
  for(let i=0; i<blastCount; i++) {
     const idx = Math.floor(Math.random() * pool.length);
     targets.push(pool.splice(idx, 1)[0]);
  }
  return currentArrows.map(a => {
    if (targets.find(t => t.id === a.id)) return { ...a, status: 'leaving' as const, forceUnblocked: false };
    return a;
  });
};

const triggerEngineParticles = (
  ax: number, ay: number, color: string, 
  setGameState: React.Dispatch<React.SetStateAction<GameState>>, 
  settings: { particles: boolean },
  reverseDir?: { angle: number }, 
  amount = 15, 
  speedMult = 1
) => {
  if (!settings.particles) return;
  const newParticles: Particle[] = [];
  for (let i = 0; i < amount; i++) {
    const angle = (reverseDir) ? reverseDir.angle + (Math.random() - 0.5) * Math.PI : Math.random() * Math.PI * 2;
    const speed = (Math.random() * 5 + 2) * speedMult;
    newParticles.push({
      x: ax, y: ay,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      color,
      size: Math.random() * 4 + 2,
    });
  }
  setGameState(prev => ({ ...prev, particles: [...prev.particles, ...newParticles] }));
};

const spawnEngineFloatingText = (
  ax: number, ay: number, text: string, 
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  color = "#ffffff", 
  scale = 1
) => {
  setGameState(prev => ({
    ...prev,
    floatingTexts: [...prev.floatingTexts, { x: ax, y: ay, text, color, life: 1.0, scale, vy: -1.5 }]
  }));
};

interface GameState {
  arrows: Arrow[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  currentLevel: number;
  mistakes: number;
  isLevelCleared: boolean;
  isLevelFailed: boolean;
  isDeadlockShuffling: boolean;
  deadlocksSurvived: number;
  comboMultiplier: number;
  maxComboReached: number;
  lastTapTime: number;
  timeLeft: number;
  isTimerActive: boolean;
  initialArrowCount: number;
}

export const useGameEngine = (
  _playerState: PlayerState, 
  themeIndex: number, 
  onWin: (shards: number, score: number, level: number) => void,
  handleFailure: () => void,
  settings: { sound: boolean; haptics: boolean; particles: boolean }
) => {
  const [gameState, setGameState] = useState<GameState>({
    arrows: [],
    particles: [],
    floatingTexts: [],
    currentLevel: 1,
    mistakes: 0,
    isLevelCleared: false,
    isLevelFailed: false,
    isDeadlockShuffling: false,
    deadlocksSurvived: 0,
    comboMultiplier: 1,
    maxComboReached: 1,
    lastTapTime: 0,
    timeLeft: 0,
    isTimerActive: false,
    initialArrowCount: 0,
  });

  const stateRef = useRef<GameState>(gameState);
  const currentRunId = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const initLevel = useCallback((lvl: number) => {
    currentRunId.current++;
    const theme = THEMES[themeIndex];
    const size = Math.min(3 + Math.floor(lvl / 3), 6);
    const count = Math.min(5 + lvl * 2, (size * size) - 1);
    const newArrows: Arrow[] = [];
    const usedPos = new Set<string>();

    for (let i = 0; i < count; i++) {
      let x, y, key;
      do {
        x = Math.floor(Math.random() * size) - Math.floor(size / 2);
        y = Math.floor(Math.random() * size) - Math.floor(size / 2);
        key = `${x},${y}`;
      } while (usedPos.has(key));
      usedPos.add(key);
      const dirs = Object.keys(DIRECTIONS) as Direction[];
      let type: Arrow['type'] = 'normal';
      let color = theme.colors[Math.floor(Math.random() * theme.colors.length)];
      let tapsRequired = 1;

      if (lvl >= CHALLENGE_THRESHOLDS.BOMB && Math.random() < 0.15) {
        type = 'bomb';
        color = ARROW_TYPES_CONFIG.BOMB.color;
      } else if (lvl >= CHALLENGE_THRESHOLDS.ICE && Math.random() < 0.15) {
        type = 'ice';
        color = ARROW_TYPES_CONFIG.ICE.color;
        tapsRequired = ARROW_TYPES_CONFIG.ICE.taps;
      } else if (lvl >= CHALLENGE_THRESHOLDS.STONE && Math.random() < 0.1) {
        type = 'stone';
        color = ARROW_TYPES_CONFIG.STONE.color;
      }
      
      newArrows.push({
        id: Date.now() + i,
        x, y,
        dir: dirs[Math.floor(Math.random() * dirs.length)],
        color, type, status: "active", animProgress: 0, blocked: false,
        shakeStart: 0, isSpinning: false, spinAngle: 0, forceUnblocked: false, tapsRequired,
      });
    }

    if (lvl >= CHALLENGE_THRESHOLDS.LOCK_KEY && newArrows.filter(a => a.type === 'normal').length >= 2) {
      const normal = newArrows.filter(a => a.type === 'normal');
      normal[0].type = 'lock';
      normal[0].color = ARROW_TYPES_CONFIG.LOCK.color;
      normal[1].type = 'key';
      normal[1].color = ARROW_TYPES_CONFIG.KEY.color;
    }

    const initial = computeArrowBlocking(newArrows);
    setGameState({
      arrows: initial,
      particles: [],
      floatingTexts: [],
      currentLevel: lvl,
      mistakes: 0,
      isLevelCleared: false,
      isLevelFailed: false,
      isDeadlockShuffling: false,
      deadlocksSurvived: 0,
      comboMultiplier: 1,
      maxComboReached: 1,
      lastTapTime: 0,
      timeLeft: 0,
      isTimerActive: false,
      initialArrowCount: initial.length,
    });
  }, [themeIndex]);

  const applyEngineHaptics = useCallback((pattern: number | number[]) => {
    if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }, [settings.haptics]);

  const triggerDeadlockEvent = useCallback(() => {
    const runId = currentRunId.current;
    setGameState(prev => ({ 
      ...prev, isDeadlockShuffling: true, deadlocksSurvived: prev.deadlocksSurvived + 1,
      comboMultiplier: 1,
      arrows: prev.arrows.map(a => a.status !== 'leaving' ? { ...a, isSpinning: true, spinAngle: 0 } : a)
    }));
    SFX.deadlockAlarm();
    applyEngineHaptics([100, 100, 100, 100, 300]);

    setTimeout(() => {
      if (runId !== currentRunId.current) return;
      setGameState(prev => {
        let current = [...prev.arrows];
        let attempts = 0;
        const dirs = Object.keys(DIRECTIONS) as Direction[];
        while (current.filter(a => a.status !== 'leaving').every(a => computeArrowBlocking(current).find(ca => ca.id === a.id)?.blocked) && attempts < 100) {
          current = current.map(a => a.status !== 'leaving' ? { ...a, dir: dirs[Math.floor(Math.random() * 4)] } : a);
          attempts++;
        }
        let final = computeArrowBlocking(current);
        const active = final.filter(a => a.status !== 'leaving');
        if (active.length > 0 && active.every(a => a.blocked)) {
          final = final.map(a => a.id === active[0].id ? { ...a, forceUnblocked: true, blocked: false } : a);
        }
        return { ...prev, isDeadlockShuffling: false, arrows: final.map(a => ({ ...a, isSpinning: false, spinAngle: 0 })) };
      });
      SFX.deadlockResolve();
    }, 1500);
  }, [applyEngineHaptics]);

  const handleTap = (ex: number, ey: number, canvasOffset: { x: number, y: number }, cellSize: number) => {
    initAudio();
    const { isDeadlockShuffling, isLevelFailed, isLevelCleared, arrows } = stateRef.current;
    if (isDeadlockShuffling || isLevelFailed || isLevelCleared) return;

    const timeNow = performance.now();
    const unblocked = arrows.filter(a => !a.blocked && a.status !== 'leaving');
    const blocked = arrows.filter(a => a.blocked && a.status !== 'leaving');
    const hitOrder = [...unblocked, ...blocked];

    for (const a of hitOrder) {
      const ax = canvasOffset.x + a.x * cellSize;
      const ay = canvasOffset.y + a.y * cellSize;
      if (Math.hypot(ex - ax, ey - ay) < cellSize / 1.5) {
        if (a.blocked || a.type === 'stone') {
          SFX.tapError();
          applyEngineHaptics([30, 40, 30]);
          setGameState(prev => {
            const newM = prev.mistakes + 1;
            const nextA = prev.arrows.map(arr => arr.id === a.id ? { ...arr, shakeStart: timeNow, isHinted: false } : { ...arr, isHinted: false });
            if (newM >= 3) { handleFailure(); return { ...prev, mistakes: newM, isLevelFailed: true, arrows: nextA, comboMultiplier: 1 }; }
            return { ...prev, mistakes: newM, arrows: nextA, comboMultiplier: 1 };
          });
        } else {
          let newC = 1;
          if (timeNow - lastTapTime.current < COMBO_TIMEOUT) { newC = stateRef.current.comboMultiplier + 1; }
          lastTapTime.current = timeNow;
          SFX.tapSuccess(newC);
          applyEngineHaptics(40);
          if (a.type === 'ice' && a.tapsRequired && a.tapsRequired > 1) {
            triggerEngineParticles(ax, ay, "#ffffff", setGameState, settings, undefined, 10, 1.5);
            setGameState(prev => ({
              ...prev, arrows: prev.arrows.map(arr => arr.id === a.id ? { ...arr, tapsRequired: arr.tapsRequired! - 1, shakeStart: timeNow, isHinted: false } : { ...arr, isHinted: false }),
              comboMultiplier: newC, maxComboReached: Math.max(prev.maxComboReached, newC), lastTapTime: timeNow
            }));
            return;
          }
          setGameState(prev => {
            const nextA = prev.arrows.map(arr => arr.id === a.id ? { ...arr, status: 'leaving' as const, forceUnblocked: false, isHinted: false } : { ...arr, isHinted: false });
            const blockedA = computeArrowBlocking(nextA);
            const maxC = Math.max(prev.maxComboReached, newC);
            if (newC > 1) { spawnEngineFloatingText(ax, ay - 20, `${newC}x COMBO!`, setGameState, "#FBBF24", 1 + newC * 0.05); }
            else { spawnEngineFloatingText(ax, ay - 20, `+${100 * newC}`, setGameState, "#ffffff", 1); }
            return { ...prev, arrows: blockedA, comboMultiplier: newC, maxComboReached: maxC, lastTapTime: timeNow };
          });
          triggerEngineParticles(ax, ay, a.color, setGameState, settings, { angle: (DIRECTIONS[a.dir]?.angle || 0) + Math.PI });
        }
        return;
      }
    }
  };

  const update = useCallback((dt: number) => {
    setGameState(prev => {
      if (prev.isLevelFailed) return prev;
      const nextP = prev.particles.map(p => ({ ...p, x: p.x + p.vx * dt * 60, y: p.y + p.vy * dt * 60, life: p.life - 1.2 * dt })).filter(p => p.life > 0);
      const nextFT = prev.floatingTexts.map(ft => ({ ...ft, y: ft.y + ft.vy * dt * 60, life: ft.life - 1.2 * dt })).filter(ft => ft.life > 0);
      let stillA = false;
      const bombs: Arrow[] = [];
      const nextArrows = prev.arrows.map(a => {
        let n = { ...a };
        if (a.status === 'leaving') { n.animProgress += 3.0 * dt; stillA = true; }
        if (a.isSpinning) { n.spinAngle += 18.0 * dt; stillA = true; }
        return n;
      }).filter(a => {
        const finished = a.status === 'leaving' && a.animProgress >= 1;
        if (finished && a.type === 'bomb') bombs.push(a);
        return !finished;
      });

      let finalA = nextArrows;
      bombs.forEach(bomb => {
        SFX.bombExplosion();
        applyEngineHaptics([100, 50, 100]);
        const cellS = 90;
        triggerEngineParticles(bomb.x * cellS, bomb.y * cellS, "#EF4444", setGameState, settings, undefined, 40, 2);
        spawnEngineFloatingText(bomb.x * cellS, bomb.y * cellS - 40, "BOOM!", setGameState, "#EF4444", 1.5);
        finalA = computeArrowBlocking(getExplosionTargets(bomb.x, bomb.y, finalA));
      });

      let nextC = prev.isLevelCleared;
      let nextTimerA = prev.isTimerActive;
      let nextTimeL = prev.timeLeft;
      let nextF = prev.isLevelFailed;

      if (nextTimerA && !nextC && !nextF) {
        nextTimeL -= dt;
        if (nextTimeL <= 0) { nextTimeL = 0; nextF = true; handleFailure(); }
      } else if (!nextTimerA && !nextC && prev.currentLevel >= 15) {
        const rem = finalA.filter(a => a.status !== 'leaving').length;
        if (rem > 0 && (prev.initialArrowCount - rem) / prev.initialArrowCount >= 0.7) {
          nextTimerA = true;
          nextTimeL = 15;
          spawnEngineFloatingText(0, -100, "PANIC TIMER!", setGameState, "#EF4444", 1.5);
        }
      }

      if (!nextC && !nextF) {
        const playable = finalA.filter(a => a.type !== 'stone' || a.status === 'leaving');
        if (playable.length === 0 && prev.arrows.filter(a => a.type !== 'stone').length > 0) {
          nextC = true;
          const score = (prev.currentLevel * 1000 - prev.mistakes * 250) + (prev.maxComboReached > 2 ? prev.maxComboReached * 200 : 0) + (prev.deadlocksSurvived * 1500);
          onWin(Math.floor(score / 10), score, prev.currentLevel);
        } else if (!prev.isDeadlockShuffling && !stillA && finalA.length > 0) {
          const active = finalA.filter(a => a.status !== 'leaving' && a.type !== 'stone' && a.type !== 'lock');
          if (active.length > 0 && active.every(a => a.blocked)) { triggerDeadlockEvent(); }
        }
      }
      return { ...prev, particles: nextP, floatingTexts: nextFT, arrows: finalA, isLevelCleared: nextC, isTimerActive: nextTimerA, timeLeft: nextTimeL, isLevelFailed: nextF };
    });
  }, [onWin, triggerDeadlockEvent, applyEngineHaptics, handleFailure, settings]);

  const triggerHint = useCallback(() => {
    setGameState(prev => {
      const activeHint = prev.arrows.some(a => a.isHinted);
      if (activeHint) return prev;
      const unblocked = prev.arrows.filter(a => !a.blocked && a.status !== 'leaving');
      if (unblocked.length === 0) return prev;
      const targetId = unblocked[Math.floor(Math.random() * unblocked.length)].id;
      return { ...prev, arrows: prev.arrows.map(a => a.id === targetId ? { ...a, isHinted: true } : a) };
    });
  }, []);

  useEffect(() => {
    let fId: number;
    const loop = (time: number) => {
      if (!lastFrameTime.current) lastFrameTime.current = time;
      const dt = Math.max(0, Math.min((time - lastFrameTime.current) / 1000, 0.1));
      lastFrameTime.current = time;
      update(dt);
      fId = requestAnimationFrame(loop);
    };
    fId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(fId);
  }, [update]);

  return { gameState, initLevel, handleTap, triggerHint };
};
