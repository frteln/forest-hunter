import { Sword, Heart, Shield, Zap, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EngineSnapshot } from '@/game/engine';
import type { StatType } from '@/game/types';
import type { Lang } from '@/game/i18n';
import { t } from '@/game/i18n';
import { STAT_LABEL } from '@/game/data';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  snap: EngineSnapshot | null;
  lang: Lang;
  onUpgrade: (stat: StatType) => void;
}

const STAT_ICONS: Record<StatType, typeof Sword> = {
  damage: Sword, maxHp: Heart, armor: Shield, speed: Zap,
};

const STAT_COLORS: Record<StatType, string> = {
  damage: '#ff6b6b', maxHp: '#5bf07a', armor: '#4a9eff', speed: '#ffa726',
};

export function StatsModal({ open, onClose, snap, lang, onUpgrade }: Props) {
  const tr = t(lang);
  if (!snap) return null;

  const stats: StatType[] = ['damage', 'maxHp', 'armor', 'speed'];

  return (
    <Modal open={open} onClose={onClose} title={tr('stats')} maxWidth="max-w-sm">
      <div className="mb-4 text-center">
        <div className="text-white/40 text-xs">{tr('gems')}</div>
        <div className="text-2xl font-bold text-green-400">{snap.stats.gems}</div>
      </div>
      <div className="space-y-2">
        {stats.map(stat => {
          const Icon = STAT_ICONS[stat];
          const color = STAT_COLORS[stat];
          const level = snap.stats.statUpgrades[stat];
          const base = { damage: 80, maxHp: 60, armor: 70, speed: 90 }[stat];
          const cost = Math.floor(base * Math.pow(1.5, level));
          const canAfford = snap.stats.gems >= cost;
          const currentVal = stat === 'damage' ? snap.derived.damage
            : stat === 'maxHp' ? snap.derived.maxHp
            : stat === 'armor' ? snap.derived.armor
            : snap.derived.speed;
          return (
            <motion.div
              key={stat}
              className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/5"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-bold">{tr(STAT_LABEL[stat].toLowerCase() as string)}</span>
                  <span className="text-white/30 text-xs">Lv.{level}</span>
                </div>
                <div className="text-xs" style={{ color }}>
                  Current: {stat === 'speed' ? currentVal.toFixed(2) : currentVal}
                </div>
              </div>
              <button
                disabled={!canAfford}
                onClick={() => onUpgrade(stat)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition active:scale-95 ${
                  canAfford
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-white/40 cursor-not-allowed'
                }`}
              >
                {cost}G
              </button>
            </motion.div>
          );
        })}
      </div>
    </Modal>
  );
}
