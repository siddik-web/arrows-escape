import { useRef, useEffect } from 'react';
import type { Arrow, Particle, FloatingText, Theme } from '../../types/game';
import { DIRECTIONS } from '../../constants/config';

interface GameCanvasProps {
  gameState: {
    arrows: Arrow[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    currentLevel: number;
    isLevelFailed: boolean;
  };
  theme: Theme;
  skin: string;
  cellSize: number;
  offset: { x: number, y: number };
  onTap: (x: number, y: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, skin, cellSize, offset, onTap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawArrow = (ctx: CanvasRenderingContext2D, arrow: Arrow, time: number, width: number, height: number) => {
    const dir = DIRECTIONS[arrow.dir];
    if (!dir) return;
    
    let x = offset.x + arrow.x * cellSize;
    let y = offset.y + arrow.y * cellSize;

    if (gameState.isLevelFailed && arrow.status !== 'leaving') {
      const shakeAmt = Math.sin(time * 0.05) * 8;
      x += dir.dy * shakeAmt;
      y += dir.dx * shakeAmt;
    } else if (arrow.shakeStart > 0 && time - arrow.shakeStart < 300) {
      const shakeAmt = Math.sin((time - arrow.shakeStart) * 0.05) * 5;
      x += dir.dy * shakeAmt;
      y += dir.dx * shakeAmt;
    }

    ctx.save();
    if (arrow.status === 'leaving') {
      const ease = Math.pow(arrow.animProgress, 3);
      const dist = ease * Math.max(width, height);
      ctx.translate(x + dir.dx * dist, y + dir.dy * dist);
    } else {
      ctx.translate(x, y);
    }

    ctx.rotate(dir.angle + arrow.spinAngle);

    if (gameState.isLevelFailed && arrow.status !== 'leaving') {
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "#EF4444";
      ctx.fillStyle = "#EF4444";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#EF4444";
    } else if (arrow.blocked && !arrow.isSpinning) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = arrow.color;
      ctx.fillStyle = arrow.color;
      ctx.shadowBlur = 0;
    } else {
      const pulse = arrow.isSpinning || arrow.isHinted ? 15 + Math.sin(time * 0.01) * 10 : Math.sin(time * 0.003) * 5 + 10;
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = arrow.isSpinning || arrow.isHinted ? "#FBBF24" : arrow.color;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = pulse;
    }

    const padding = cellSize * 0.25;
    const length = cellSize - padding * 2;
    const headSize = cellSize * 0.25;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = cellSize * 0.15;

    ctx.beginPath();
    if (skin === 'stealth') {
      ctx.moveTo(length / 2, 0);
      ctx.lineTo(-length / 2, headSize * 1.2);
      ctx.lineTo(-length / 2 + headSize / 2, 0);
      ctx.lineTo(-length / 2, -headSize * 1.2);
      ctx.closePath();
      ctx.fill();
    } else if (skin === 'dot') {
      ctx.arc(0, 0, cellSize * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(length / 2 - headSize * 0.5, 0, cellSize * 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(-length / 2, 0);
      ctx.lineTo(length / 2 - headSize * 0.5, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(length / 2 - headSize, -headSize);
      ctx.lineTo(length / 2, 0);
      ctx.lineTo(length / 2 - headSize, headSize);
      ctx.stroke();
    }

    if (arrow.type === 'bomb') {
      ctx.beginPath();
      ctx.arc(0, 0, cellSize * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10 + Math.sin(time * 0.01) * 5;
      ctx.fill();
    }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      const gridDim = Math.min(3 + Math.floor(gameState.currentLevel / 4), 6);
      for (let i = -Math.floor(gridDim / 2); i <= Math.ceil(gridDim / 2); i++) {
        ctx.beginPath();
        ctx.moveTo(offset.x + i * cellSize - cellSize / 2, 0);
        ctx.lineTo(offset.x + i * cellSize - cellSize / 2, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, offset.y + i * cellSize - cellSize / 2);
        ctx.lineTo(canvas.width, offset.y + i * cellSize - cellSize / 2);
        ctx.stroke();
      }

      // Draw Arrows
      gameState.arrows.forEach(a => {
        if (a.blocked && a.status !== 'leaving') drawArrow(ctx, a, time, canvas.width, canvas.height);
      });
      gameState.arrows.forEach(a => {
        if (!a.blocked || a.status === 'leaving') drawArrow(ctx, a, time, canvas.width, canvas.height);
      });

      // Draw Particles
      gameState.particles.forEach(p => {
        ctx.globalAlpha = p.life > 1 ? 1 : p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Floating Text
      ctx.textAlign = "center";
      gameState.floatingTexts.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = `900 ${24 * ft.scale}px Inter`;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1.0;

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, offset, cellSize, skin]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    onTap(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      className="z-0 touch-none"
    />
  );
};

export default GameCanvas;
