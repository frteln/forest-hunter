import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import type { GearItem } from '@/game/types';
import { RARITY_COLORS } from '@/game/data';

interface Props {
  notif: { title: string; body: string } | null;
  onDismiss: () => void;
}

export function ToastNotif({ notif, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {notif && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="absolute top-20 left-1/2 z-40 pointer-events-none"
          onClick={onDismiss}
        >
          <div className="bg-black/80 backdrop-blur-md rounded-xl px-4 py-2 border border-amber-500/30 flex items-center gap-2 shadow-lg">
            <Sparkles size={16} className="text-amber-400" />
            <div>
              <div className="text-white text-sm font-bold">{notif.title}</div>
              <div className="text-white/60 text-xs">{notif.body}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface GearProps {
  gear: GearItem | null;
  onDismiss: () => void;
}

export function GearFoundToast({ gear, onDismiss }: GearProps) {
  return (
    <AnimatePresence>
      {gear && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40"
          onClick={onDismiss}
        >
          <div
            className="rounded-2xl px-5 py-3 border-2 flex items-center gap-3 shadow-2xl"
            style={{
              background: 'rgba(0,0,0,0.85)',
              borderColor: RARITY_COLORS[gear.rarity],
            }}
          >
            <Sparkles size={20} style={{ color: RARITY_COLORS[gear.rarity] }} />
            <div>
              <div className="text-white/50 text-xs">New Gear Found!</div>
              <div className="text-white font-bold text-sm" style={{ color: RARITY_COLORS[gear.rarity] }}>
                {gear.name}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
