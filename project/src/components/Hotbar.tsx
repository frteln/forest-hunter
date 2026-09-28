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

const ICONS: Record<string, typeof Crosshair> = {
  Crosshair, Shield, HardHat, Gem,
};

export function Hotbar({ snap, lang: _lang, onOpenInventory, onOpenChest, onOpenShop }: Props) {
  if (!snap) return null;
  const slots = ['weapon', 'armor', 'helmet', 'amulet'] as const;
  const slotIcons: Record<string, typeof Crosshair> = { weapon: Crosshair, armor: Shield, helmet: HardHat, amulet: Gem };
  const slotLabels: Record<string, string> = { weapon: 'WPN', armor: 'ARM', helmet: 'HLM', amulet: 'AML' };

  return (
    <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-2">
      {/* Equipment slots */}
      <div className="flex gap-1.5">
        {slots.map(slot => {
          const item = snap.equipped[slot];
          const Icon = slotIcons[slot];
          const color = item ? RARITY_COLORS[item.rarity] : '#555';
          return (
            <div
              key={slot}
              className="w-11 h-11 rounded-lg bg-black/50 backdrop-blur-md border-2 flex flex-col items-center justify-center relative overflow-hidden"
              style={{ borderColor: color }}
            >
              <Icon size={18} style={{ color }} />
              <span className="text-[7px] text-white/40 absolute bottom-0.5">{slotLabels[slot]}</span>
              {item && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: `radial-gradient(circle, ${RARITY_COLORS[item.rarity]}40, transparent)` }}
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
            className="w-11 h-11 rounded-lg bg-black/50 backdrop-blur-md border-2 border-white/10 flex items-center justify-center relative"
          >
            {i === 0 ? (
              <Zap size={18} className="text-amber-400" />
            ) : (
              <Lock size={14} className="text-white/20" />
            )}
            <span className="text-[7px] text-white/40 absolute bottom-0.5">SKL{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UtilityButtons({ onOpenInventory, onOpenChest, onOpenShop }: Pick<Props, 'onOpenInventory' | 'onOpenChest' | 'onOpenShop'>) {
  return (
    <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-2">
      <button
        onClick={onOpenInventory}
        className="w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition flex-col gap-0.5"
      >
        <Crosshair size={20} />
        <span className="text-[7px]">BAG</span>
      </button>
      <button
        onClick={onOpenChest}
        className="w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition flex-col gap-0.5"
      >
        <Gem size={20} />
        <span className="text-[7px]">CST</span>
      </button>
      <button
        onClick={onOpenShop}
        className="w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition flex-col gap-0.5"
      >
        <Shield size={20} />
        <span className="text-[7px]">SHP</span>
      </button>
    </div>
  );
}
