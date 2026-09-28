import { Gem, Crown, Play, Gift, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EngineSnapshot } from '@/game/engine';
import type { Lang } from '@/game/i18n';
import { t } from '@/game/i18n';
import { CHEST_COSTS } from '@/game/data';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  snap: EngineSnapshot | null;
  lang: Lang;
  onOpenChest: (rarity: 'rare' | 'epic' | 'legendary') => void;
  onClaimDaily: () => void;
  canClaimDaily: boolean;
  onWatchAdCrystals: () => void;
  onWatchAdBoost: () => void;
}

export function ShopModal({ open, onClose, snap, lang, onOpenChest, onClaimDaily, canClaimDaily, onWatchAdCrystals, onWatchAdBoost }: Props) {
  const tr = t(lang);
  if (!snap) return null;

  const chests = [
    { rarity: 'rare' as const, name: tr('chest_rare'), cost: CHEST_COSTS.rare, color: '#4a9eff', icon: Gem },
    { rarity: 'epic' as const, name: tr('chest_epic'), cost: CHEST_COSTS.epic, color: '#b04aff', icon: Sparkles },
    { rarity: 'legendary' as const, name: tr('chest_legendary'), cost: CHEST_COSTS.legendary, color: '#ffa726', icon: Crown },
  ];

  return (
    <Modal open={open} onClose={onClose} title={tr('shop')} maxWidth="max-w-lg">
      {/* Currency display */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-black/30 rounded-lg p-2 text-center">
          <div className="text-[10px] text-white/40">{tr('crystals')}</div>
          <div className="text-lg font-bold text-purple-400">{snap.stats.crystals}</div>
        </div>
        <div className="flex-1 bg-black/30 rounded-lg p-2 text-center">
          <div className="text-[10px] text-white/40">{tr('gems')}</div>
          <div className="text-lg font-bold text-green-400">{snap.stats.gems}</div>
        </div>
      </div>

      {/* Daily chest */}
      <div className="mb-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl p-3 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Gift size={20} className="text-amber-400" />
          <span className="text-white font-bold text-sm">{tr('freeChest')}</span>
        </div>
        <button
          disabled={!canClaimDaily}
          onClick={onClaimDaily}
          className={`w-full py-2 rounded-lg font-bold text-sm transition active:scale-95 ${
            canClaimDaily
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
              : 'bg-gray-700 text-white/40 cursor-not-allowed'
          }`}
        >
          {canClaimDaily ? tr('claim') : tr('claimed')}
        </button>
      </div>

      {/* Premium chests */}
      <h3 className="text-white/50 text-xs font-bold uppercase mb-2">{tr('chest')}</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {chests.map(c => {
          const Icon = c.icon;
          const canAfford = snap.stats.crystals >= c.cost;
          return (
            <motion.button
              key={c.rarity}
              whileTap={{ scale: 0.95 }}
              disabled={!canAfford}
              onClick={() => onOpenChest(c.rarity)}
              className={`rounded-xl p-3 border-2 flex flex-col items-center gap-1 transition ${
                canAfford ? 'bg-black/30' : 'bg-black/20 opacity-50'
              }`}
              style={{ borderColor: c.color }}
            >
              <Icon size={28} style={{ color: c.color }} />
              <span className="text-[10px] text-white/70 font-semibold text-center">{c.name}</span>
              <span className="text-xs font-bold text-purple-400">{c.cost} {tr('crystals')}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Rewarded ads */}
      <h3 className="text-white/50 text-xs font-bold uppercase mb-2">{tr('watchAd')}</h3>
      <div className="space-y-2">
        <button
          onClick={onWatchAdCrystals}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 active:scale-95 transition"
        >
          <Play size={20} className="text-purple-400" />
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-bold">{tr('watchAdGems')}</div>
          </div>
          <span className="text-purple-300 font-bold text-sm">+50</span>
        </button>
        <button
          onClick={onWatchAdBoost}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/20 active:scale-95 transition"
        >
          <Zap size={20} className="text-amber-400" />
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-bold">{tr('watchAdBoost')}</div>
          </div>
        </button>
      </div>

      {/* IAP placeholder */}
      <h3 className="text-white/50 text-xs font-bold uppercase mb-2 mt-4">{tr('buyCrystals')}</h3>
      <div className="grid grid-cols-3 gap-2">
        {[100, 500, 1200].map((amt, i) => (
          <div key={i} className="rounded-xl bg-black/30 border border-white/10 p-2 text-center">
            <div className="text-lg font-bold text-purple-400">{amt}</div>
            <div className="text-[10px] text-white/40 mb-1">{tr('crystals')}</div>
            <div className="text-xs text-white/60 font-semibold bg-white/5 rounded py-1">
              ${[0.99, 4.99, 9.99][i]}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
