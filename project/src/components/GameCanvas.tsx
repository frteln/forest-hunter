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

// Asset preloader storage
const ASSET_PATHS: Record<string, string> = {
  player: '/assets/player.png',
  slime: '/assets/slime.png',
  tree: '/assets/tree.png',
  gem: '/assets/gem.png',
};

const loadedAssets: Record<string, HTMLImageElement> = {};

function loadAssets() {
  Object.entries(ASSET_PATHS).forEach(([key, src]) => {
    if (!loadedAssets[key]) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedAssets[key] = img;
      };
    }
  });
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
    loadAssets(); // Start loading sprites

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

      for (let i = 0; i < 85; i++) {
        trees.push({
          x: Math.random() * WORLD_W * TILE,
          y: Math.random() * WORLD_H * TILE,
          r: 28 + Math.random() * 16,
          type: Math.floor(Math.random() * 3),
        });
      }

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

      // 1. Organic Base Fill
      ctx.fillStyle = zone.grassColor;
      ctx.fillRect(0, 0, w, h);

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

      // 3. Ground Details
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

      // 4. Layered Trees (PNG Sprite / Fallback)
      for (const t of trees) {
        const sx = t.x - camX;
        const sy = t.y - camY;
        if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) continue;

        // Ground Shadow
        ctx.fillStyle = 'rgba(2, 18, 8, 0.45)';
        ctx.beginPath();
        ctx.ellipse(sx + 6, sy + 20, t.r * 1.25, t.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (loadedAssets.tree) {
          // Render Tree PNG
          const size = t.r * 2.8;
          ctx.drawImage(loadedAssets.tree, sx - size / 2, sy - size / 2 - 10, size, size);
        } else {
          // Fallback Canvas Tree
          ctx.fillStyle = '#2b1a10';
          ctx.fillRect(sx - 6, sy - 4, 12, 24);

          ctx.fillStyle = '#1e3a1e';
          ctx.beginPath();
          ctx.moveTo(sx, sy - t.r * 1.8);
          ctx.lineTo(sx - t.r * 0.9, sy - t.r * 0.6);
          ctx.lineTo(sx + t.r * 0.9, sy - t.r * 0.6);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#2d5a2d';
          ctx.beginPath();
          ctx.moveTo(sx, sy - t.r * 2.3);
          ctx.lineTo(sx - t.r * 0.75, sy - t.r * 1.1);
          ctx.lineTo(sx + t.r * 0.75, sy - t.r * 1.1);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 5. Monsters (PNG Sprite / Fallback)
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

        if (loadedAssets.slime) {
          const size = r * 2.6;
          ctx.drawImage(loadedAssets.slime, sx - size / 2, sy - size / 2, size, size);
        } else {
          const flash = m.hitFlash > 0;
          ctx.fillStyle = flash ? '#ffffff' : m.def.color;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(sx - r * 0.3, sy - r * 0.25, 2.8, 0, Math.PI * 2);
          ctx.arc(sx + r * 0.3, sy - r * 0.25, 2.8, 0, Math.PI * 2);
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
      }

      // 6. Player (Avcı Sprite / Fallback)
      {
        const sx = px - camX;
        const sy = py - camY;

        // Player Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 15, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        if (loadedAssets.player) {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(s.player.dir);
          const pSize = 42;
          ctx.drawImage(loadedAssets.player, -pSize / 2, -pSize / 2, pSize, pSize);
          ctx.restore();
        } else {
          const flash = s.player.hitFlash > 0;
          ctx.fillStyle = flash ? '#ff8888' : '#15803d';
          ctx.beginPath();
          ctx.arc(sx, sy, 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#14532d';
          ctx.beginPath();
          ctx.arc(sx, sy - 3, 11, Math.PI, 0);
          ctx.fill();

          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(sx, sy - 1, 5.5, 0, Math.PI * 2);
          ctx.fill();

          const dir = s.player.dir;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(dir) * 25, sy + Math.sin(dir) * 25);
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
      }

      // 7. Floating Damage Texts
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

      // 8. Forest Vignette
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