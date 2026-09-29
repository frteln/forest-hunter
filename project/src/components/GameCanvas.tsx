import { useEffect, useRef } from 'react';
import type { EngineSnapshot } from '@/game/engine';
import { ZONES, TILE, WORLD_W, WORLD_H } from '@/game/data';

interface Props {
  snap: EngineSnapshot | null;
  quality: 'low' | 'high';
}

function hash2D(x: number, y: number) {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return h - Math.floor(h);
}

interface Tree {
  x: number;
  y: number;
  r: number;
  type: number;
}

interface GroundDetail {
  x: number;
  y: number;
  type: 'grass' | 'flower' | 'pebble' | 'mushroom';
  color: string;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  size: number;
  alpha: number;
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

    let trees: Tree[] = [];
    let groundDetails: GroundDetail[] = [];
    let particles: Particle[] = [];
    let lastZone = -1;

    function genDecor(zoneId: number) {
      trees = [];
      groundDetails = [];
      particles = [];

      const zone = ZONES[zoneId] || ZONES[0];

      // 1. Generate Trees
      for (let i = 0; i < 85; i++) {
        trees.push({
          x: Math.random() * WORLD_W * TILE,
          y: Math.random() * WORLD_H * TILE,
          r: 26 + Math.random() * 16,
          type: Math.floor(Math.random() * 3),
        });
      }

      // 2. Generate Ground Decor (Flowers, Mushrooms, Pebbles, Grass clumps)
      const flowerColors = ['#f472b6', '#fbbf24', '#a78bfa', '#38bdf8', '#f87171'];
      for (let i = 0; i < 350; i++) {
        const randType = Math.random();
        let type: GroundDetail['type'] = 'grass';
        let color = '#4ade80';

        if (randType < 0.5) {
          type = 'grass';
          color = shade(zone.grassColor, 1.2 + Math.random() * 0.3);
        } else if (randType < 0.75) {
          type = 'flower';
          color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        } else if (randType < 0.9) {
          type = 'pebble';
          color = '#64748b';
        } else {
          type = 'mushroom';
          color = '#ef4444';
        }

        groundDetails.push({
          x: Math.random() * WORLD_W * TILE,
          y: Math.random() * WORLD_H * TILE,
          type,
          color,
          size: 2 + Math.random() * 4,
        });
      }

      // 3. Floating spores/fireflies
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: -0.2 - Math.random() * 0.3,
          size: 1.5 + Math.random() * 2.5,
          alpha: 0.3 + Math.random() * 0.5,
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

      const zone = ZONES[s.currentZone] || ZONES[0];
      const px = s.player.x;
      const py = s.player.y;
      const camX = px - w / 2;
      const camY = py - h / 2;
      const high = qualityRef.current === 'high';
      const time = Date.now();

      // 1. Organic Base Fill (Smooth organic grass)
      ctx.fillStyle = zone.grassColor;
      ctx.fillRect(0, 0, w, h);

      // Organic terrain light variation patches
      for (let i = 0; i < 12; i++) {
        const patchX = ((i * 320 + 100) % (WORLD_W * TILE)) - camX;
        const patchY = ((i * 280 + 150) % (WORLD_H * TILE)) - camY;
        if (patchX > -250 && patchX < w + 250 && patchY > -250 && patchY < h + 250) {
          const grad = ctx.createRadialGradient(patchX, patchY, 20, patchX, patchY, 180);
          grad.addColorStop(0, shade(zone.grassColor, 1.12));
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(patchX, patchY, 180, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Stone Path
      ctx.strokeStyle = zone.pathColor;
      ctx.lineWidth = 50;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(0 - camX, 0 - camY);
      ctx.lineTo(WORLD_W * TILE - camX, WORLD_H * TILE - camY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Cobblestone Accents
      if (high) {
        ctx.fillStyle = shade(zone.pathColor, 1.25);
        ctx.globalAlpha = 0.35;
        for (let i = 0; i < 30; i++) {
          const pathStep = (i / 30) * WORLD_W * TILE;
          const pxPos = pathStep - camX + (hash2D(i, 1) - 0.5) * 24;
          const pyPos = pathStep - camY + (hash2D(i, 2) - 0.5) * 24;
          if (pxPos > -30 && pxPos < w + 30 && pyPos > -30 && pyPos < h + 30) {
            ctx.beginPath();
            ctx.arc(pxPos, pyPos, 5 + hash2D(i, 3) * 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      // 3. Organic Ground Details (Flowers, Grass Clumps, Pebbles, Mushrooms)
      for (const d of groundDetails) {
        const sx = d.x - camX;
        const sy = d.y - camY;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

        if (d.type === 'grass') {
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 2, sy - d.size * 2);
          ctx.moveTo(sx + 2, sy);
          ctx.lineTo(sx + 3, sy - d.size * 2.2);
          ctx.stroke();
        } else if (d.type === 'flower') {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(sx, sy, d.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(sx, sy, d.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (d.type === 'pebble') {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.ellipse(sx, sy, d.size, d.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (d.type === 'mushroom') {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(sx, sy - 2, d.size, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(sx - 1, sy - 2, 2, 3);
        }
      }

      // 4. Unlock Pads
      for (const z of ZONES) {
        if (s.unlockedZones.includes(z.id)) continue;
        const sx = z.unlockX - camX;
        const sy = z.unlockY - camY;
        if (sx < -90 || sx > w + 90 || sy < -90 || sy > h + 90) continue;

        ctx.fillStyle = 'rgba(255, 190, 40, 0.2)';
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

        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', sx, sy + 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${z.unlockCost} G`, sx, sy + 24);
      }

      // 5. Unlocked Portals
      for (const z of ZONES) {
        if (!s.unlockedZones.includes(z.id)) continue;
        if (z.id === s.currentZone) continue;
        const sx = z.unlockX - camX;
        const sy = z.unlockY - camY;
        if (sx < -90 || sx > w + 90 || sy < -90 || sy > h + 90) continue;

        const pulse = 0.5 + 0.35 * Math.sin(time / 280);
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

      // 6. Gem Pickups
      for (const g of s.gems) {
        const sx = g.x - camX;
        const sy = g.y - camY;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

        const pulse = 0.65 + 0.35 * Math.sin(time / 180 + g.x);
        ctx.fillStyle = `rgba(91, 240, 122, ${pulse * 0.45})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5bf07a';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◆', sx, sy + 4);
      }

      // 7. Layered 2.5D Trees
      for (const t of trees) {
        const sx = t.x - camX;
        const sy = t.y - camY;
        if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) continue;

        // Ground Shadow
        ctx.fillStyle = 'rgba(2, 18, 8, 0.45)';
        ctx.beginPath();
        ctx.ellipse(sx + 6, sy + 20, t.r * 1.25, t.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#2b1a10';
        ctx.fillRect(sx - 6, sy - 4, 12, 24);
        ctx.fillStyle = '#422c1d';
        ctx.fillRect(sx - 2, sy - 4, 5, 24);

        // Canopy Layer 1 (Dark)
        const baseColor = zone.grassColor;
        ctx.fillStyle = shade(baseColor, 0.45);
        ctx.beginPath();
        ctx.arc(sx, sy - 10, t.r * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // Canopy Layer 2 (Mid)
        ctx.fillStyle = shade(baseColor, 0.72);
        ctx.beginPath();
        ctx.arc(sx - 4, sy - 16, t.r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Canopy Layer 3 (Highlight)
        ctx.fillStyle = shade(baseColor, 1.1);
        ctx.beginPath();
        ctx.arc(sx - 7, sy - 22, t.r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Magic Orbs on Trees
        if (t.type === 1) {
          const glow = 0.5 + 0.5 * Math.sin(time / 400 + t.x);
          ctx.fillStyle = `rgba(253, 224, 71, ${glow * 0.8})`;
          ctx.beginPath();
          ctx.arc(sx + t.r * 0.3, sy - t.r * 0.8, 3.5, 0, Math.PI * 2);
          ctx.arc(sx - t.r * 0.4, sy - t.r * 0.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 8. Monsters
      for (const m of s.monsters) {
        const sx = m.x - camX;
        const sy = m.y - camY;
        if (sx < -70 || sx > w + 70 || sy < -70 || sy > h + 70) continue;
        const r = m.def.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + r * 0.85, r * 1.1, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const flash = m.hitFlash > 0;
        ctx.fillStyle = flash ? '#ffffff' : m.def.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        if (!m.def.isBoss) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(sx - r * 0.3, sy - r * 0.25, 2.8, 0, Math.PI * 2);
          ctx.arc(sx + r * 0.3, sy - r * 0.25, 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Boss Crown
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(sx - r * 0.6, sy - r * 0.7);
          ctx.lineTo(sx - r * 0.3, sy - r * 1.2);
          ctx.lineTo(sx, sy - r * 0.8);
          ctx.lineTo(sx + r * 0.3, sy - r * 1.2);
          ctx.lineTo(sx + r * 0.6, sy - r * 0.7);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(sx - r * 0.3, sy - r * 0.2, 4, 0, Math.PI * 2);
          ctx.arc(sx + r * 0.3, sy - r * 0.2, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // HP Bar
        if (m.hp < m.maxHp) {
          const bw = r * 2.2;
          const bh = 5;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw, bh);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw * (m.hp / m.maxHp), bh);
        }

        if (m.def.isBoss) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.def.name, sx, sy - r - 16);
        }
      }

      // 9. Player (Avcı)
      {
        const sx = px - camX;
        const sy = py - camY;

        // Player Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 15, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Player Cloak / Body
        const flash = s.player.hitFlash > 0;
        ctx.fillStyle = flash ? '#ff8888' : '#15803d';
        ctx.beginPath();
        ctx.arc(sx, sy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(sx, sy - 3, 11, Math.PI, 0);
        ctx.fill();

        // Face
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(sx, sy - 1, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Direction Indicator (Bow Aim)
        const dir = s.player.dir;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(dir) * 25, sy + Math.sin(dir) * 25);
        ctx.stroke();

        // Attack Swing Arc
        if (s.player.attackAnim > 0) {
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 30, dir - 0.6, dir + 0.6);
          ctx.stroke();
        }

        // Player HP Bar
        const bw = 42;
        const bh = 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(sx - bw / 2, sy - 28, bw, bh);
        const hpPct = s.player.hp / s.player.maxHp;
        ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : hpPct > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.fillRect(sx - bw / 2, sy - 28, bw * Math.max(0, hpPct), bh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - bw / 2, sy - 28, bw, bh);
      }

      // 10. Floating Damage Texts
      for (const f of s.floats) {
        const sx = f.x - camX;
        const sy = f.y - camY;
        const alpha = Math.min(1, f.ttl / 500);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
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
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(sx, sy, 58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.unlockProgress);
          ctx.stroke();
        }
      }

      // 12. Floating Spores / Fireflies
      if (high) {
        ctx.fillStyle = '#fef08a';
        for (const p of particles) {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.y < 0) p.y = h;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;

          ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(time / 300 + p.x));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // 13. Deep Forest Vignette Overlay
      const vignette = ctx.createRadialGradient(
        w / 2, h / 2, Math.max(w, h) * 0.3,
        w / 2, h / 2, Math.max(w, h) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(2, 18, 8, 0.55)');
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