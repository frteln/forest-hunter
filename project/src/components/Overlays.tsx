import { motion, AnimatePresence } from 'framer-motion';
import { Skull, RotateCcw, Trophy, Heart } from 'lucide-react';
import type { Lang } from '@/game/i18n';
import { t } from '@/game/i18n';

interface DeathProps {
  open: boolean;
  lang: Lang;
  onRespawn: () => void;
}

export function DeathScreen({ open, lang, onRespawn }: DeathProps) {
  const tr = t(lang);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[55] flex items-center justify-center bg-red-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Skull size={64} className="text-red-500" />
            <h2 className="text-2xl font-black text-white">{tr('youDied')}</h2>
            <p className="text-white/60 text-sm">{tr('revived')}</p>
            <button
              onClick={onRespawn}
              className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold flex items-center gap-2 active:scale-95 transition"
            >
              <RotateCcw size={18} />
              {tr('respawn')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface VictoryProps {
  open: boolean;
  lang: Lang;
  onPlayAgain: () => void;
}

export function VictoryScreen({ open, lang, onPlayAgain }: VictoryProps) {
  const tr = t(lang);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[55] flex items-center justify-center bg-gradient-to-b from-amber-900/80 to-emerald-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-sm px-6"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Trophy size={64} className="text-amber-400" />
            </motion.div>
            <Heart size={32} className="text-red-400" fill="currentColor" />
            <h2 className="text-3xl font-black text-white">{tr('victory')}</h2>
            <p className="text-white/70 text-sm">{tr('storyBody')}</p>
            <button
              onClick={onPlayAgain}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-bold flex items-center gap-2 active:scale-95 transition"
            >
              <RotateCcw size={18} />
              {tr('playAgain')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
