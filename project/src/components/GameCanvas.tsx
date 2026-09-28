import { useEffect, useRef } from 'react';
import type { EngineSnapshot } from '@/game/engine';
import { ZONES, TILE, WORLD_W, WORLD_H, RARITY_COLORS } from '@/game/data';

interface Props {
  snap: EngineSnapshot | null;
  quality: 'low' | 'high';
}

export function GameCanvas({ snap, quality }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapRef = useRef<EngineSnapshot | null>(null);
  const rafRef = useRef(0);
  const qualityRef = useRef(quality);
  qualityRef.current = quality;
  snapRef.current = snap;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let trees: { x: number; y: number; r: number; type: number }[] = [];
    let lastZone = -1;

    function genDecor(zoneId: number) {
      trees = [];
      const z = ZONES[zoneId];
      for (let i = 0; i < 60; i++) {
        trees.push({
          x: Math.random() * WORLD_W * TILE,
          y: Math.random() * WORLD_H * TILE,
          r: 20 + Math.random() * 15,
          type: Math.floor(Math.random() * 3),
        });
      }
    }

    function render() {
      const s = snapRef.current;
      if (!s) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      if (lastZone !== s.currentZone) {
        lastZone = s.currentZone;
        genDecor(s.currentZone);
      }

      const zone = ZONES[s.currentZone];
      const px = s.player.x;
      const py = s.player.y;
      const camX = px - w / 2;
      const camY = py - h / 2;

      // Background
      ctx.fillStyle = zone.bgColor;
      ctx.fillRect(0, 0, w, h);

      // Grass tiles
      const startTx = Math.max(0, Math.floor(camX / TILE));
      const endTx = Math.min(WORLD_W, Math.ceil((camX + w) / TILE));
      const startTy = Math.max(0, Math.floor(camY / TILE));
      const endTy = Math.min(WORLD_H, Math.ceil((camY + h) / TILE));

      const high = qualityRef.current === 'high';

      for (let ty = startTy; ty < endTy; ty++) {
        for (let tx = startTx; tx < endTx; tx++) {
          const sx = tx * TILE - camX;
          const sy = ty * TILE - camY;
          // Checker pattern grass
          const dark = (tx + ty) % 2 === 0;
          ctx.fillStyle = dark ? zone.grassColor : shade(zone.grassColor, 1.15);
          ctx.fillRect(sx, sy, TILE, TILE);
          if (high && Math.random() < 0.0) {
            // grass detail
          }
        }
      }

      // Stone path (diagonal)
      ctx.strokeStyle = zone.pathColor;
      ctx.lineWidth = 48;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0 - camX, 0 - camY);
      ctx.lineTo(WORLD_W * TILE - camX, WORLD_H * TILE - camY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Trees
      for (const t of trees) {
        const sx = t.x - camX;
        const sy = t.y - camY;
        if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) continue;
        // Trunk
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(sx - 4, sy, 8, 12);
        // Foliage
        ctx.fillStyle = shade(zone.grassColor, 0.7);
        ctx.beginPath();
        ctx.arc(sx, sy - 6, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = shade(zone.grassColor, 0.85);
        ctx.beginPath();
        ctx.arc(sx - 5, sy - 10, t.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Unlock pads
      for (const z of ZONES) {
        if (s.unlockedZones.includes(z.id)) continue;
        const sx = z.unlockX - camX;
        const sy = z.unlockY - camY;
        if (sx < -80 || sx > w + 80 || sy < -80 || sy > h + 80) continue;
        // Pad circle
        ctx.fillStyle = 'rgba(255,200,50,0.2)';
        ctx.beginPath();
        ctx.arc(sx, sy, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(sx, sy, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Lock icon
        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', sx, sy + 5);
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.fillText(`${z.unlockCost} G`, sx, sy + 22);
      }

      // Unlocked zone portals
      for (const z of ZONES) {
        if (!s.unlockedZones.includes(z.id)) continue;
        if (z.id === s.currentZone) continue;
        const sx = z.unlockX - camX;
        const sy = z.unlockY - camY;
        if (sx < -80 || sx > w + 80 || sy < -80 || sy > h + 80) continue;
        const pulse = 0.5 + 0.3 * Math.sin(Date.now() / 300);
        ctx.fillStyle = `rgba(100,200,255,${pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#66ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#aaeeff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', sx, sy + 6);
      }

      // Gem pickups
      for (const g of s.gems) {
        const sx = g.x - camX;
        const sy = g.y - camY;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200 + g.x);
        ctx.fillStyle = `rgba(91,240,122,${pulse})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5bf07a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◆', sx, sy + 3);
      }

      // Monsters
      for (const m of s.monsters) {
        const sx = m.x - camX;
        const sy = m.y - camY;
        if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) continue;
        const r = m.def.radius;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + r * 0.8, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Body
        const flash = m.hitFlash > 0;
        ctx.fillStyle = flash ? '#fff' : m.def.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        if (!m.def.isBoss) {
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(sx - r * 0.3, sy - r * 0.2, 2, 0, Math.PI * 2);
          ctx.arc(sx + r * 0.3, sy - r * 0.2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Boss crown
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.moveTo(sx - r * 0.6, sy - r * 0.7);
          ctx.lineTo(sx - r * 0.3, sy - r * 1.1);
          ctx.lineTo(sx, sy - r * 0.8);
          ctx.lineTo(sx + r * 0.3, sy - r * 1.1);
          ctx.lineTo(sx + r * 0.6, sy - r * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(sx - r * 0.3, sy - r * 0.2, 3, 0, Math.PI * 2);
          ctx.arc(sx + r * 0.3, sy - r * 0.2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // HP bar
        if (m.hp < m.maxHp) {
          const bw = r * 2;
          const bh = 4;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw, bh);
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw * (m.hp / m.maxHp), bh);
        }
        // Name for boss
        if (m.def.isBoss) {
          ctx.fillStyle = '#ffaa00';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.def.name, sx, sy - r - 16);
        }
      }

      // Player
      {
        const sx = px - camX;
        const sy = py - camY;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 14, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Body
        const flash = s.player.hitFlash > 0;
        ctx.fillStyle = flash ? '#ff8888' : '#3a7a5a';
        ctx.beginPath();
        ctx.arc(sx, sy, 14, 0, Math.PI * 2);
        ctx.fill();
        // Cloak/hood
        ctx.fillStyle = '#2a5a3a';
        ctx.beginPath();
        ctx.arc(sx, sy - 4, 10, Math.PI, 0);
        ctx.fill();
        // Face
        ctx.fillStyle = '#e0c0a0';
        ctx.beginPath();
        ctx.arc(sx, sy - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        // Direction indicator (bow)
        const dir = s.player.dir;
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(dir) * 22, sy + Math.sin(dir) * 22);
        ctx.stroke();
        // Attack animation
        if (s.player.attackAnim > 0) {
          ctx.strokeStyle = 'rgba(255,255,100,0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(sx, sy, 26, dir - 0.5, dir + 0.5);
          ctx.stroke();
        }
        // HP bar above player
        const bw = 40;
        const bh = 5;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(sx - bw / 2, sy - 28, bw, bh);
        const hpPct = s.player.hp / s.player.maxHp;
        ctx.fillStyle = hpPct > 0.5 ? '#5bf07a' : hpPct > 0.25 ? '#ffaa44' : '#ff4444';
        ctx.fillRect(sx - bw / 2, sy - 28, bw * Math.max(0, hpPct), bh);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - bw / 2, sy - 28, bw, bh);
      }

      // Floating texts
      for (const f of s.floats) {
        const sx = f.x - camX;
        const sy = f.y - camY;
        const alpha = Math.min(1, f.ttl / 500);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(f.text, sx, sy);
        ctx.fillText(f.text, sx, sy);
        ctx.globalAlpha = 1;
      }

      // Unlock progress ring
      if (s.unlockProgress !== null) {
        const z = ZONES.find(z2 => !s.unlockedZones.includes(z2.id));
        if (z) {
          const sx = z.unlockX - camX;
          const sy = z.unlockY - camY;
          ctx.strokeStyle = '#ffcc44';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(sx, sy, 55, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.unlockProgress);
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full touch-none select-none"
    />
  );
}

function shade(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.floor(r * factor));
  const ng = Math.min(255, Math.floor(g * factor));
  const nb = Math.min(255, Math.floor(b * factor));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}
