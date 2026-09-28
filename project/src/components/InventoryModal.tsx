import { Crosshair, Shield, HardHat, Gem, Star } from 'lucide-react';
import type { EngineSnapshot } from '@/game/engine';
import type { GearItem, Rarity } from '@/game/types';
import type { Lang } from '@/game/i18n';
import { t } from '@/game/i18n';
import { RARITY_COLORS, RARITY_GLOW } from '@/game/data';
import { gearScore, dismantleValue } from '@/game/stats';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  snap: EngineSnapshot | null;
  lang: Lang;
  onEquip: (item: GearItem) => void;
  onDismantle: (item: GearItem) => void;
}

const SLOT_ICONS: Record<string, typeof Crosshair> = {
  weapon: Crosshair, armor: Shield, helmet: HardHat, amulet: Gem,
};

export function InventoryModal({ open, onClose, snap, lang, onEquip, onDismantle }: Props) {
  const tr = t(lang);
  if (!snap) return null;
  const slots = ['weapon', 'armor', 'helmet', 'amulet'] as const;

  return (
    <Modal open={open} onClose={onClose} title={tr('inventory')} maxWidth="max-w-lg">
      {/* Equipped */}
      <div className="mb-4">
        <h3 className="text-white/50 text-xs font-bold uppercase mb-2">{tr('equipment')}</h3>
        <div className="grid grid-cols-4 gap-2">
          {slots.map(slot => {
            const item = snap.equipped[slot];
            const Icon = SLOT_ICONS[slot];
            return (
              <div
                key={slot}
                className="aspect-square rounded-xl bg-black/40 border-2 flex flex-col items-center justify-center relative overflow-hidden"
                style={{ borderColor: item ? RARITY_COLORS[item.rarity] : '#333' }}
              >
                {item ? (
                  <>
                    <Icon size={22} style={{ color: RARITY_COLORS[item.rarity] }} />
                    <span className="text-[8px] text-white/50 mt-1 px-1 text-center truncate w-full">{item.name}</span>
                    <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle, ${RARITY_GLOW[item.rarity]}, transparent)` }} />
                  </>
                ) : (
                  <>
                    <Icon size={20} className="text-white/15" />
                    <span className="text-[8px] text-white/20 mt-1">{tr('emptySlot')}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-[10px] text-white/40">{tr('damage')}</div>
          <div className="text-sm font-bold text-red-400">{snap.derived.damage}</div>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-[10px] text-white/40">{tr('maxHp')}</div>
          <div className="text-sm font-bold text-green-400">{snap.derived.maxHp}</div>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-[10px] text-white/40">{tr('armor')}</div>
          <div className="text-sm font-bold text-blue-400">{snap.derived.armor}</div>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-[10px] text-white/40">{tr('speed')}</div>
          <div className="text-sm font-bold text-amber-400">{snap.derived.speed.toFixed(1)}</div>
        </div>
      </div>

      {/* Inventory grid */}
      <h3 className="text-white/50 text-xs font-bold uppercase mb-2">
        {tr('inventory')} ({snap.inventory.length})
      </h3>
      {snap.inventory.length === 0 ? (
        <div className="text-center text-white/30 text-sm py-8">
          No items collected yet. Defeat beasts and open chests to find gear.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {snap.inventory.map(item => (
            <InventoryItem
              key={item.id}
              item={item}
              tr={tr}
              onEquip={() => onEquip(item)}
              onDismantle={() => onDismantle(item)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

function InventoryItem({ item, tr, onEquip, onDismantle }: {
  item: GearItem;
  tr: (k: string) => string;
  onEquip: () => void;
  onDismantle: () => void;
}) {
  const Icon = SLOT_ICONS[item.slot];
  const color = RARITY_COLORS[item.rarity];
  return (
    <div
      className="rounded-xl bg-black/40 border-2 p-2 flex flex-col items-center relative overflow-hidden"
      style={{ borderColor: color }}
    >
      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle, ${RARITY_GLOW[item.rarity]}, transparent)` }} />
      <Icon size={20} style={{ color }} />
      <span className="text-[8px] text-white/60 mt-1 text-center leading-tight truncate w-full">{item.name}</span>
      <div className="flex items-center gap-0.5 mt-1">
        <Star size={8} style={{ color }} />
        <span className="text-[8px] text-white/40">{gearScore(item)}</span>
      </div>
      <div className="flex gap-1 mt-1.5 w-full">
        <button
          onClick={onEquip}
          className="flex-1 text-[8px] py-1 rounded bg-emerald-600/80 text-white font-bold active:scale-95 transition"
        >
          {tr('equip')}
        </button>
        <button
          onClick={onDismantle}
          className="flex-1 text-[8px] py-1 rounded bg-red-600/60 text-white font-bold active:scale-95 transition"
        >
          {dismantleValue(item)}G
        </button>
      </div>
    </div>
  );
}
