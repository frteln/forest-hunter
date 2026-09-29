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

// 🎨 SPRITE ASSETS (Yüksek Kaliteli Oyun Sprite'ları)
const ASSETS_URLS = {
  tree: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><ellipse cx="50" cy="110" rx="35" ry="10" fill="rgba(0,0,0,0.3)"/><path d="M42 70 L58 70 L55 110 L45 110 Z" fill="%233a2312"/><path d="M50 10 L85 65 L68 65 L88 85 L12 85 L32 65 L15 65 Z" fill="%231e5128"/><path d="M50 10 L85 65 L50 60 Z" fill="%232e7d32" opacity="0.5"/><path d="M50 30 L75 75 L50 70 Z" fill="%234caf50" opacity="0.4"/></svg>',
  player: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><ellipse cx="40" cy="70" rx="22" ry="8" fill="rgba(0,0,0,0.35)"/><circle cx="40" cy="38" r="22" fill="%231b4332"/><path d="M18 38 Q40 18 62 38 Q40 32 18 38" fill="%232d6a4f"/><circle cx="40" cy="38" r="12" fill="%23fecdd3"/><circle cx="35" cy="36" r="2.5" fill="%230f172a"/><circle cx="45" cy="36" r="2.5" fill="%230f172a"/><path d="M22 28 Q40 12 58 28 Z" fill="%23081c15"/><path d="M58 38 C68 25 68 50 58 38" stroke="%23fbbf24" stroke-width="4" fill="none"/></svg>',
  monster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><ellipse cx="40" cy="68" rx="20" ry="7" fill="rgba(0,0,0,0.3)"/><path d="M15 50 Q10 20 40 18 Q70 20 65 50 Q40 62 15 50 Z" fill="%23dc2626"/><circle cx="30" cy="36" r="5" fill="%23fef08a"/><circle cx="50" cy="36" r="5" fill="%23fef08a"/><circle cx="31" cy="36" r="2" fill="%23000"/><circle cx="51" cy="36" r="2" fill="%23000"/><path d="M28 48 Q40 56 52 48" stroke="%237f1d1d" stroke-width="3" fill="none"/></svg>',
  boss: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="88" rx="30" ry="10" fill="rgba(0,0,0,0.4)"/><path d="M15 65 Q8 20 50 15 Q92 20 85 65 Q50 82 15 65 Z" fill="%237c3aed"/><path d="M30 18 L40 2 L50 12 L60 2 L70 18 Z" fill="%23fbbf24"/><circle cx="36" cy="42" r="7" fill="%23ef4444"/><circle cx="64" cy="42" r="7" fill="%23ef4444"/><circle cx="37" cy="42" r="3" fill="%23000"/><circle cx="65" cy="42" r="3" fill="%23000"/></svg>',
};

interface Tree {
  x: number;
  y: number;
  r: number;
}

interface GroundDetail {
  x: number;
  y: number;
  type: 'grass' | 'flower' | 'pebble';
  color: string;
  size: number;
}

export function GameCanvas({ snap, quality }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapRef = useRef<EngineSnapshot | null>(null);
  const rafRef = useRef(0);
  const qualityRef = useRef(quality);
  qualityRef.current = quality;
  snapRef.current = snap;

  const imagesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // Assets Preloader
    Object.entries(ASSETS_URLS).forEach(([key, url]) => {
      const img = new Image();
      img.src = url;
      imagesRef.current[key] = img;
    });

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
    let lastZone = -1;

    function genDecor(zoneId: number) {
      trees = [];
      groundDetails = [];
      const zone = ZONES[zoneId] || ZONES[0];

      for (let i = 0; i < 70; i++) {
        trees.push({
          x: Math.random() * WORLD_W * TILE,
          y: Math.random() * WORLD_H * TILE,
          r: 32 + Math.random() * 18,
        });
      }

      const flowerColors = ['#f472b6', '#fbbf24', '#a78bfa', '#38bdf8'];
      for (let i = 0; i < 300; i++) {
        const rand = Math.random();
        groundDetails.push({
          x: Math.random() * WORLD_W * TILE,
          y: Math.random() * WORLD_H * TILE,
          type: rand < 0.6 ? 'grass' : rand < 0.85 ? 'flower' : 'pebble',
          color: rand < 0.6 ? shade(zone.grassColor, 1.25) : flowerColors[Math.floor(Math.random() * flowerColors.length)],
          size: 2 + Math.random() * 3,
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
      const images = imagesRef.current;

      // 1. Organic Base Ground
      ctx.fillStyle = zone.grassColor;
      ctx.fillRect(0, 0, w, h);

      // 2. Stone Path
      ctx.strokeStyle = zone.pathColor;
      ctx.lineWidth = 48;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.45;
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
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 2, sy - d.size * 2);
          ctx.moveTo(sx + 2, sy);
          ctx.lineTo(sx + 3, sy - d.size * 2.2);
          ctx.stroke();
        } else if (d.type === 'flower') {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Gem Pickups
      for (const g of s.gems) {
        const sx = g.x - camX;
        const sy = g.y - camY;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
        ctx.fillStyle = '#5bf07a';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◆', sx, sy + 4);
      }

      // 5. Sprite Trees (Görsel Ağaçlar)
      const treeImg = images['tree'];
      for (const t of trees) {
        const sx = t.x - camX;
        const sy = t.y - camY;
        if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) continue;

        if (treeImg && treeImg.complete) {
          const size = t.r * 2.4;
          ctx.drawImage(treeImg, sx - size / 2, sy - size / 1.2, size, size * 1.2);
        }
      }

      // 6. Sprite Monsters (Görsel Düşmanlar)
      const monsterImg = images['monster'];
      const bossImg = images['boss'];
      for (const m of s.monsters) {
        const sx = m.x - camX;
        const sy = m.y - camY;
        if (sx < -70 || sx > w + 70 || sy < -70 || sy > h + 70) continue;

        const r = m.def.radius;
        const currentImg = m.def.isBoss ? bossImg : monsterImg;

        if (currentImg && currentImg.complete) {
          const size = r * 2.6;
          ctx.drawImage(currentImg, sx - size / 2, sy - size / 2, size, size);
        }

        // HP Bar
        if (m.hp < m.maxHp) {
          const bw = r * 2.2;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(sx - bw / 2, sy - r - 12, bw * (m.hp / m.maxHp), 5);
        }
      }

      // 7. Sprite Player (Görsel Avcı)
      {
        const sx = px - camX;
        const sy = py - camY;
        const playerImg = images['player'];

        if (playerImg && playerImg.complete) {
          const size = 52;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(s.player.dir + Math.PI / 2);
          ctx.drawImage(playerImg, -size / 2, -size / 2, size, size);
          ctx.restore();
        }

        // Player HP Bar
        const bw = 42;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(sx - bw / 2, sy - 32, bw, 5);
        const hpPct = s.player.hp / s.player.maxHp;
        ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : '#ef4444';
        ctx.fillRect(sx - bw / 2, sy - 32, bw * Math.max(0, hpPct), 5);
      }

      // 8. Damage Floating Text
      for (const f of s.floats) {
        const sx = f.x - camX;
        const sy = f.y - camY;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(f.text, sx, sy);
        ctx.fillText(f.text, sx, sy);
      }

      // 9. Forest Vignette Overlay
      if (high) {
        const vignette = ctx.createRadialGradient(
          w / 2, h / 2, Math.max(w, h) * 0.35,
          w / 2, h / 2, Math.max(w, h) * 0.8
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(2, 18, 8, 0.5)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
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