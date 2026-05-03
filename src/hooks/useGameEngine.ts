import { useState, useEffect, useRef, useCallback } from 'react';
import type { Arrow, Particle, FloatingText, Direction, PlayerState } from '../types/game';
import { DIRECTIONS, THEMES, COMBO_TIMEOUT } from '../constants/config';
import { SFX, initAudio } from '../lib/audio';

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
}

export const useGameEngine = (
  _playerState: PlayerState, 
  themeIndex: number, 
  onWin: (shards: number, score: number, level: number) => void,
  onFail: () => void,
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
  });

  const stateRef = useRef<GameState>(gameState);
  const currentRunId = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);

  // Sync ref with state
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const checkBlocking = useCallback((arrows: Arrow[]) => {
    return arrows.map(a => {
      if (a.status === 'leaving') return a;
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
  }, []);

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
      const isBomb = (lvl >= 3 && Math.random() < 0.15);
      
      newArrows.push({
        id: Date.now() + i,
        x,
        y,
        dir: dirs[Math.floor(Math.random() * dirs.length)],
        color: isBomb ? "#EF4444" : theme.colors[Math.floor(Math.random() * theme.colors.length)],
        type: isBomb ? "bomb" : "normal",
        status: "active",
        animProgress: 0,
        blocked: false,
        shakeStart: 0,
        isSpinning: false,
        spinAngle: 0,
        forceUnblocked: false,
      });
    }

    const initialArrows = checkBlocking(newArrows);
    setGameState({
      arrows: initialArrows,
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
    });
  }, [themeIndex, checkBlocking]);

  const spawnParticles = (x: number, y: number, color: string, reverseDir?: { angle: number }, amount = 15, speedMult = 1) => {
    if (!settings.particles) return;
    const newParticles: Particle[] = [];
    for (let i = 0; i < amount; i++) {
      const angle = (reverseDir) ? reverseDir.angle + (Math.random() - 0.5) * Math.PI : Math.random() * Math.PI * 2;
      const speed = (Math.random() * 5 + 2) * speedMult;
      newParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2,
      });
    }
    setGameState(prev => ({ ...prev, particles: [...prev.particles, ...newParticles] }));
  };

  const spawnFloatingText = (x: number, y: number, text: string, color = "#ffffff", scale = 1) => {
    setGameState(prev => ({
      ...prev,
      floatingTexts: [...prev.floatingTexts, { x, y, text, color, life: 1.0, scale, vy: -1.5 }]
    }));
  };

  const triggerVibration = (pattern: number | number[]) => {
    if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
  };

  const detonateBomb = useCallback((x: number, y: number) => {
    SFX.bombExplosion();
    triggerVibration([100, 50, 100]);
    // SFX and triggerVibration already called
    const cellSize = 90; // Approx
    spawnParticles(x * cellSize, y * cellSize, "#EF4444", undefined, 40, 2);
    spawnFloatingText(x * cellSize, y * cellSize - 40, "BOOM!", "#EF4444", 1.5);

    setGameState(prev => {
      const remaining = prev.arrows.filter(a => a.status !== 'leaving');
      const blastCount = Math.min(Math.floor(Math.random() * 3) + 1, remaining.length);
      const targets: Arrow[] = [];
      const pool = [...remaining];
      for(let i=0; i<blastCount; i++) {
         const idx = Math.floor(Math.random() * pool.length);
         targets.push(pool.splice(idx, 1)[0]);
      }
      
      const newArrows = prev.arrows.map(a => {
        if (targets.find(t => t.id === a.id)) return { ...a, status: 'leaving' as const, forceUnblocked: false };
        return a;
      });
      return { ...prev, arrows: checkBlocking(newArrows) };
    });
  }, [themeIndex, checkBlocking, spawnParticles, spawnFloatingText, triggerVibration]);

  const triggerDeadlockEvent = useCallback(() => {
    const runId = currentRunId.current;
    setGameState(prev => ({ 
      ...prev, 
      isDeadlockShuffling: true, 
      deadlocksSurvived: prev.deadlocksSurvived + 1,
      comboMultiplier: 1,
      arrows: prev.arrows.map(a => a.status !== 'leaving' ? { ...a, isSpinning: true, spinAngle: 0 } : a)
    }));
    SFX.deadlockAlarm();
    triggerVibration([100, 100, 100, 100, 300]);

    setTimeout(() => {
      if (runId !== currentRunId.current) return;
      setGameState(prev => {
        let currentArrows = [...prev.arrows];
        let attempts = 0;
        const dirs = Object.keys(DIRECTIONS) as Direction[];
        
        while (currentArrows.filter(a => a.status !== 'leaving').every(a => checkBlocking(currentArrows).find(ca => ca.id === a.id)?.blocked) && attempts < 100) {
          currentArrows = currentArrows.map(a => a.status !== 'leaving' ? { ...a, dir: dirs[Math.floor(Math.random() * 4)] } : a);
          attempts++;
        }
        
        let finalArrows = checkBlocking(currentArrows);
        const active = finalArrows.filter(a => a.status !== 'leaving');
        if (active.length > 0 && active.every(a => a.blocked)) {
          finalArrows = finalArrows.map(a => a.id === active[0].id ? { ...a, forceUnblocked: true, blocked: false } : a);
        }

        return {
          ...prev,
          isDeadlockShuffling: false,
          arrows: finalArrows.map(a => ({ ...a, isSpinning: false, spinAngle: 0 }))
        };
      });
      SFX.deadlockResolve();
    }, 1500);
  }, [checkBlocking]);

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
        if (a.blocked) {
          SFX.tapError();
          triggerVibration([30, 40, 30]);
          setGameState(prev => {
            const newMistakes = prev.mistakes + 1;
            const newArrows = prev.arrows.map(arr => arr.id === a.id ? { ...arr, shakeStart: timeNow, isHinted: false } : { ...arr, isHinted: false });
            if (newMistakes >= 3) {
                onFail();
                return { ...prev, mistakes: newMistakes, isLevelFailed: true, arrows: newArrows, comboMultiplier: 1 };
            }
            return { ...prev, mistakes: newMistakes, arrows: newArrows, comboMultiplier: 1 };
          });
        } else {
          let newCombo = 1;
          if (timeNow - lastTapTime.current < COMBO_TIMEOUT) {
            newCombo = stateRef.current.comboMultiplier + 1;
          }
          lastTapTime.current = timeNow;

          SFX.tapSuccess(newCombo);
          triggerVibration(40);
          
          setGameState(prev => {
            const nextArrows = prev.arrows.map(arr => arr.id === a.id ? { ...arr, status: 'leaving' as const, forceUnblocked: false, isHinted: false } : { ...arr, isHinted: false });
            const blockedArrows = checkBlocking(nextArrows);
            const maxCombo = Math.max(prev.maxComboReached, newCombo);
            
            if (newCombo > 1) {
              spawnFloatingText(ax, ay - 20, `${newCombo}x COMBO!`, "#FBBF24", 1 + newCombo * 0.05);
            } else {
              spawnFloatingText(ax, ay - 20, `+${100 * newCombo}`, "#ffffff", 1);
            }

            return {
              ...prev,
              arrows: blockedArrows,
              comboMultiplier: newCombo,
              maxComboReached: maxCombo,
              lastTapTime: timeNow
            };
          });
          spawnParticles(ax, ay, a.color, { angle: (DIRECTIONS[a.dir]?.angle || 0) + Math.PI });
        }
        return;
      }
    }
  };

  const update = useCallback((dt: number) => {
    setGameState(prev => {
      if (prev.isLevelFailed) return prev;

      // Update Particles
      const nextParticles = prev.particles.map(p => ({
        ...p,
        x: p.x + p.vx * dt * 60,
        y: p.y + p.vy * dt * 60,
        life: p.life - 1.2 * dt
      })).filter(p => p.life > 0);

      // Update Floating Texts
      const nextFloatingTexts = prev.floatingTexts.map(ft => ({
        ...ft,
        y: ft.y + ft.vy * dt * 60,
        life: ft.life - 1.2 * dt
      })).filter(ft => ft.life > 0);

      // Update Arrows
      let stillAnimating = false;
      const nextArrows = prev.arrows.map(a => {
        let nextA = { ...a };
        if (a.status === 'leaving') {
          nextA.animProgress += 3.0 * dt;
          stillAnimating = true;
        }
        if (a.isSpinning) {
          nextA.spinAngle += 18.0 * dt;
          stillAnimating = true;
        }
        return nextA;
      }).filter(a => {
        const finished = a.status === 'leaving' && a.animProgress >= 1;
        if (finished && a.type === 'bomb') {
          detonateBomb(a.x, a.y);
        }
        return !finished;
      });

      let nextCleared = prev.isLevelCleared;
      
      // Check for Win
      if (!nextCleared && !prev.isLevelFailed) {
        if (nextArrows.length === 0 && prev.arrows.length > 0) {
          nextCleared = true;
          const score = (prev.currentLevel * 1000 - prev.mistakes * 250) + 
                        (prev.maxComboReached > 2 ? prev.maxComboReached * 200 : 0) + 
                        (prev.deadlocksSurvived * 1500);
          onWin(Math.floor(score / 10), score, prev.currentLevel);
        } else if (!prev.isDeadlockShuffling && !stillAnimating && nextArrows.length > 0) {
          const active = nextArrows.filter(a => a.status !== 'leaving');
          if (active.length > 0 && active.every(a => a.blocked)) {
            triggerDeadlockEvent();
          }
        }
      }

      return {
        ...prev,
        particles: nextParticles,
        floatingTexts: nextFloatingTexts,
        arrows: nextArrows,
        isLevelCleared: nextCleared,
      };
    });
  }, [onWin, triggerDeadlockEvent, detonateBomb]);

  const triggerHint = useCallback(() => {
    setGameState(prev => {
      const currentHinted = prev.arrows.some(a => a.isHinted);
      if (currentHinted) return prev;
      
      const unblocked = prev.arrows.filter(a => !a.blocked && a.status !== 'leaving');
      if (unblocked.length === 0) return prev;

      const targetId = unblocked[Math.floor(Math.random() * unblocked.length)].id;
      
      return {
        ...prev,
        arrows: prev.arrows.map(a => a.id === targetId ? { ...a, isHinted: true } : a)
      };
    });
  }, []);

  // Main Loop
  useEffect(() => {
    let frameId: number;
    const loop = (time: number) => {
      if (!lastFrameTime.current) lastFrameTime.current = time;
      const dt = Math.max(0, Math.min((time - lastFrameTime.current) / 1000, 0.1));
      lastFrameTime.current = time;
      
      update(dt);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [update]);

  return {
    gameState,
    initLevel,
    handleTap,
    triggerHint,
  };
};
