import { useEffect, useRef } from 'react';
import type { EngineSnapshot } from '@/game/engine';
import { ZONES, TILE, WORLD_W, WORLD_H, RARITY_COLORS } from '@/game/data';

interface Props {
  snap: EngineSnapshot | null;
  quality: 'low' | 'high';
}

function hash2D(x: number, y: number) {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return h - Math.floor(h);
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
      for (let i = 0; i < 75; i++) {
        trees.push({
          x: Math.random() * WORLD_W * TILE,
          y: Math.random() * WORLD_H * TILE,
          r: 22 + Math.random() * 14,
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

      // 1. Background Fill
      ctx.fillStyle = zone.bgColor;
      ctx.fillRect(0, 0, w, h);

      // 2. Organic Grass Ground Tiles
      const startTx = Math.max(0, Math.floor(camX / TILE));
      const endTx = Math.min(WORLD_W, Math.ceil((camX + w) / TILE));
      const startTy = Math.max(0, Math.floor(camY / TILE));
      const endTy = Math.min(WORLD_H, Math.ceil((camY + h) / TILE));

      const high = qualityRef.current === 'high';

      for (let ty = startTy; ty < endTy; ty++) {
        for (let tx = startTx; tx < endTx; tx++) {
          const sx = tx * TILE - camX;
          const sy = ty * TILE - camY;

          // Organic shade variation using 2D pseudo-hash
          const rand = hash2D(tx, ty);
          const shadeFactor = 0.92 + rand * 0.16;
          ctx.fillStyle = shade(zone.grassColor, shadeFactor);
          ctx.fillRect(sx, sy, TILE, TILE);

          // Grass blade details
          if (high && rand > 0.6) {
            ctx.fillStyle = shade(zone.grassColor, 1.25);
            ctx.beginPath();
            ctx.fillRect(sx + 10, sy + 14, 2, 5);
            ctx.fillRect(sx + 13, sy + 11, 2, 8);
            ctx.fillRect(sx + 32, sy + 24, 2, 6);
            ctx.fill();
          }
        }
      }

      // 3. Stone Path
      ctx.strokeStyle = zone.pathColor;
      ctx.lineWidth = 54;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(0 - camX, 0 - camY);
      ctx.lineTo(WORLD_W * TILE - camX, WORLD_H * TILE - camY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Path Cobblestone Highlights
      if (high) {
        ctx.fillStyle = shade(zone.pathColor, 1.2);
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 25; i++) {
          const pathStep = (i / 25) * WORLD_W * TILE;
          const pxPos = pathStep - camX + (hash2D(i, 1) - 0.5) * 20;
          const pyPos = pathStep - camY + (hash2D(i, 2) - 0.5) * 20;
          if (pxPos > -30 && pxPos < w + 30 && pyPos > -30 && pyPos < h + 30) {
            ctx.beginPath();
            ctx.arc(pxPos, pyPos, 6 + hash2D(i, 3) * 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      // 4. Layered 2.5D Trees & Foliage
      for (const t of trees) {
        const sx = t.x - camX;
        const sy = t.y - camY;
        if (sx < -80 || sx > w + 80 || sy < -80 || sy > h + 80) continue;

        // Ground Shadow
        ctx.fillStyle = 'rgba(5, 15, 8, 0.35)';
        ctx.beginPath();
        ctx.ellipse(sx + 4, sy + 16, t.r * 1.1, t.r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden Trunk
        ctx.fillStyle = '#3a271d';
        ctx.fillRect(sx - 5, sy - 2, 10, 20);
        ctx.fillStyle = '#543b2c';
        ctx.fillRect(sx - 2, sy - 2, 4, 20);

        // Canopy Base Layer (Dark)
        const baseColor = zone.grassColor;
        ctx.fillStyle = shade(baseColor, 0.55);
        ctx.beginPath();
        ctx.arc(sx, sy - 8, t.r * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Canopy Middle Layer
        ctx.fillStyle = shade(baseColor, 0.78);
        ctx.beginPath();
        ctx.arc(sx - 3, sy - 14, t.r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Canopy Top Highlight Layer
        ctx.fillStyle = shade(baseColor, 1.05);
        ctx.beginPath();
        ctx.arc(sx - 5, sy - 20, t.r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Magic Ambient Glow on certain trees
        if (t.type === 1) {
          ctx.fillStyle = 'rgba(255, 230, 150, 0.6)';
          ctx.beginPath();
          ctx.arc(sx + t.r * 0.2, sy - t.r * 0.7, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Unlock Pads
      for (const z of ZONES) {
        if (s.unlockedZones.includes(z.id)) continue;
        const sx = z.unlockX - camX;
        const sy = z.unlockY - camY;
        if (sx < -90 || sx > w + 90 || sy < -90 || sy > h + 90) continue;

        // Pad aura
        ctx.fillStyle = 'rgba(255, 190, 40, 0.18)';
        ctx.beginPath();
        ctx.arc(sx, sy, 52, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.arc(sx, sy, 52, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Lock label
        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', sx, sy + 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${z.unlockCost} G`, sx, sy + 24);
      }

      // 6. Unlocked Portals
      for (const z of ZONES) {
        if (!s.unlockedZones.includes(z.id)) continue;
        if (z.id === s.currentZone) continue;
        const sx = z.unlockX - camX;
        const sy = z.unlockY - camY;
        if (sx < -90 || sx > w + 90 || sy < -90 || sy > h + 90) continue;

        const pulse = 0.5 + 0.35 * Math.sin(Date.now() / 280);
        ctx.fillStyle = `rgba(100, 210, 255, ${pulse * 0.35})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 46, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#66ccff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 46, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#baefff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', sx, sy + 6);
      }

      // 7. Gem Pickups
      for (const g of s.gems) {
        const sx = g.x - camX;
        const sy = g.y - camY;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

        const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 180 + g.x);
        // Gem Glow
        ctx.fillStyle = `rgba(91, 240, 122, ${pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5bf07a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◆', sx, sy + 4);
      }

      // 8. Monsters
      for (const m of s.monsters) {
        const sx = m.x - camX;
        const sy = m.y - camY;
        if (sx < -70 || sx > w + 70 || sy < -70 || sy > h + 70) continue;
        const r = m.def.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + r * 0.85, r * 1.05, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Monster Body
        const flash = m.hitFlash > 0;
        ctx.fillStyle = flash ? '#ffffff' : m.def.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // Monster Features
        if (!m.def.isBoss) {
          ctx.fillStyle = '#ff2222';
          ctx.beginPath();
          ctx.arc(sx - r * 0.3, sy - r * 0.25, 2.5, 0, Math.PI * 2);
          ctx.arc(sx + r * 0.3, sy - r * 0.25, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Boss Crown
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.moveTo(sx - r * 0.6, sy - r * 0.7);
          ctx.lineTo(sx - r * 0.3, sy - r * 1.15);
          ctx.lineTo(sx, sy - r * 0.8);
          ctx.lineTo(sx + r * 0.3, sy - r * 1.15);
          ctx.lineTo(sx + r * 0.6, sy - r * 0.7);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(sx - r * 0.3, sy - r * 0.2, 3.5, 0, Math.PI * 2);
          ctx.arc(sx + r * 0.3, sy - r * 0.2, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // HP Bar
        if (m.hp < m.maxHp) {
          const bw = r * 2.2;
          const bh = 5;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw, bh);
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw * (m.hp / m.maxHp), bh);
        }

        if (m.def.isBoss) {
          ctx.fillStyle = '#ffaa00';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.def.name, sx, sy - r - 16);
        }
      }

      // 9. Player (Avcı)
      {
        const sx = px - camX;
        const sy = py - camY;

        // Player Ground Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 15, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Player Cloak / Body
        const flash = s.player.hitFlash > 0;
        ctx.fillStyle = flash ? '#ff8888' : '#2d6a4f';
        ctx.beginPath();
        ctx.arc(sx, sy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = '#1b4332';
        ctx.beginPath();
        ctx.arc(sx, sy - 3, 11, Math.PI, 0);
        ctx.fill();

        // Face
        ctx.fillStyle = '#e0c0a0';
        ctx.beginPath();
        ctx.arc(sx, sy - 1, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Direction Indicator (Golden Bow)
        const dir = s.player.dir;
        ctx.strokeStyle = '#f4a261';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(dir) * 24, sy + Math.sin(dir) * 24);
        ctx.stroke();

        // Attack Swing Arc
        if (s.player.attackAnim > 0) {
          ctx.strokeStyle = 'rgba(255, 230, 110, 0.85)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 28, dir - 0.55, dir + 0.55);
          ctx.stroke();
        }

        // Player HP Bar
        const bw = 42;
        const bh = 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(sx - bw / 2, sy - 28, bw, bh);
        const hpPct = s.player.hp / s.player.maxHp;
        ctx.fillStyle = hpPct > 0.5 ? '#5bf07a' : hpPct > 0.25 ? '#ffaa44' : '#ff4444';
        ctx.fillRect(sx - bw / 2, sy - 28, bw * Math.max(0, hpPct), bh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - bw / 2, sy - 28, bw, bh);
      }

      // 10. Floating Texts (Damage numbers & gains)
      for (const f of s.floats) {
        const sx = f.x - camX;
        const sy = f.y - camY;
        const alpha = Math.min(1, f.ttl / 500);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(f.text, sx, sy);
        ctx.fillText(f.text, sx, sy);
        ctx.globalAlpha = 1;
      }

      // 11. Unlock Ring Progress
      if (s.unlockProgress !== null) {
        const z = ZONES.find(z2 => !s.unlockedZones.includes(z2.id));
        if (z) {
          const sx = z.unlockX - camX;
          const sy = z.unlockY - camY;
          ctx.strokeStyle = '#ffcc44';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(sx, sy, 58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.unlockProgress);
          ctx.stroke();
        }
      }

      // 12. Forest Vignette Lighting Overlay
      const vignette = ctx.createRadialGradient(
        w / 2, h / 2, Math.max(w, h) * 0.35,
        w / 2, h / 2, Math.max(w, h) * 0.8
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(4, 20, 10, 0.42)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

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