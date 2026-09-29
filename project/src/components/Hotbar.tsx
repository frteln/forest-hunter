import { Crosshair, Shield, HardHat, Gem, Zap, Lock } from 'lucide-react';
import type { EngineSnapshot } from '@/game/engine';
import type { Lang } from '@/game/i18n';
import { RARITY_COLORS } from '@/game/data';

interface Props {
  snap: EngineSnapshot | null;
  lang: Lang;
  onOpenInventory: () => void;
  onOpenChest: () => void;
  onOpenShop: () => void;
}

export function Hotbar({ snap, lang: _lang }: Props) {
  if (!snap) return null;
  const slots = ['weapon', 'armor', 'helmet', 'amulet'] as const;
  const slotIcons: Record<string, typeof Crosshair> = { weapon: Crosshair, armor: Shield, helmet: HardHat, amulet: Gem };
  const slotLabels: Record<string, string> = { weapon: 'WPN', armor: 'ARM', helmet: 'HLM', amulet: 'AML' };

  return (
    <div className="flex flex-col gap-1.5 pointer-events-auto select-none">
      {/* Equipment slots */}
      <div className="flex gap-1.5">
        {slots.map(slot => {
          const item = snap.equipped[slot];
          const Icon = slotIcons[slot];
          const color = item ? RARITY_COLORS[item.rarity] : '#64748b';
          return (
            <div
              key={slot}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center relative overflow-hidden shadow-md"
              style={{ borderColor: item ? color : undefined }}
            >
              <Icon size={16} style={{ color }} />
              <span className="text-[7px] font-bold text-white/50 absolute bottom-0.5">{slotLabels[slot]}</span>
              {item && (
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${RARITY_COLORS[item.rarity]}60, transparent)` }}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Skill slots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center relative shadow-md"
          >
            {i === 0 ? (
              <Zap size={16} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            ) : (
              <Lock size={12} className="text-white/30" />
            )}
            <span className="text-[7px] font-bold text-white/40 absolute bottom-0.5">SKL{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UtilityButtons({ onOpenInventory, onOpenChest, onOpenShop }: Pick<Props, 'onOpenInventory' | 'onOpenChest' | 'onOpenShop'>) {
  return (
    <div className="flex flex-col gap-2 pointer-events-auto select-none">
      <button
        onClick={onOpenInventory}
        className="w-11 h-11 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition flex-col gap-0.5 shadow-md shadow-black/40"
      >
        <Crosshair size={18} className="text-emerald-400" />
        <span className="text-[8px] font-bold text-white/70">BAG</span>
      </button>
      <button
        onClick={onOpenChest}
        className="w-11 h-11 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition flex-col gap-0.5 shadow-md shadow-black/40"
      >
        <Gem size={18} className="text-purple-400" />
        <span className="text-[8px] font-bold text-white/70">CST</span>
      </button>
      <button
        onClick={onOpenShop}
        className="w-11 h-11 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition flex-col gap-0.5 shadow-md shadow-black/40"
      >
        <Shield size={18} className="text-amber-400" />
        <span className="text-[8px] font-bold text-white/70">SHP</span>
      </button>
    </div>
  );
}