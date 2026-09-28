import { useEffect, useRef } from 'react';
import type { EngineSnapshot } from '@/game/engine';
import { ZONES, WORLD_W, WORLD_H, TILE } from '@/game/data';

interface Props {
  snap: EngineSnapshot | null;
}

export function MiniMap({ snap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapRef = useRef<EngineSnapshot | null>(null);
  snapRef.current = snap;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 90;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);

    let raf = 0;
    function render() {
      const s = snapRef.current;
      ctx.clearRect(0, 0, size, size);
      // Circle clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      // Background
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0, 0, size, size);

      if (s) {
        const px = s.player.x;
        const py = s.player.y;
        const range = 800;
        const scale = size / (range * 2);

        // Grid
        ctx.strokeStyle = 'rgba(100,200,100,0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
          ctx.beginPath();
          ctx.moveTo((i * size) / 4, 0);
          ctx.lineTo((i * size) / 4, size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, (i * size) / 4);
          ctx.lineTo(size, (i * size) / 4);
          ctx.stroke();
        }

        // Monsters
        for (const m of s.monsters) {
          const dx = (m.x - px) * scale + size / 2;
          const dy = (m.y - py) * scale + size / 2;
          if (dx < 0 || dx > size || dy < 0 || dy > size) continue;
          ctx.fillStyle = m.def.isBoss ? '#ff8800' : '#ff4444';
          const r = m.def.isBoss ? 3 : 2;
          ctx.beginPath();
          ctx.arc(dx, dy, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Gems
        for (const g of s.gems) {
          const dx = (g.x - px) * scale + size / 2;
          const dy = (g.y - py) * scale + size / 2;
          if (dx < 0 || dx > size || dy < 0 || dy > size) continue;
          ctx.fillStyle = '#5bf07a';
          ctx.fillRect(dx - 1, dy - 1, 2, 2);
        }

        // Portals
        for (const z of ZONES) {
          if (z.id === s.currentZone) continue;
          const dx = (z.unlockX - px) * scale + size / 2;
          const dy = (z.unlockY - py) * scale + size / 2;
          if (dx < 0 || dx > size || dy < 0 || dy > size) continue;
          if (s.unlockedZones.includes(z.id)) {
            ctx.fillStyle = '#66ccff';
          } else {
            ctx.fillStyle = '#ffcc44';
          }
          ctx.beginPath();
          ctx.arc(dx, dy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Player center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5bf07a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-[90px] h-[90px] rounded-full"
        style={{ width: 90, height: 90 }}
      />
    </div>
  );
}
