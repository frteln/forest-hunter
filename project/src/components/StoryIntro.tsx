import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Sword, ArrowRight } from 'lucide-react';
import type { Lang } from '@/game/i18n';
import { t } from '@/game/i18n';

interface Props {
  open: boolean;
  onBegin: () => void;
  lang: Lang;
}

export function StoryIntro({ open, onBegin, lang }: Props) {
  const tr = t(lang);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-gradient-to-b from-emerald-950/95 to-black/95"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="w-full max-w-lg flex flex-col items-center text-center gap-5"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-800 flex items-center justify-center border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/30">
                <Sword size={40} className="text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                className="absolute -inset-3"
              >
                <Sparkles size={16} className="absolute top-0 left-1/2 text-amber-400" />
                <Sparkles size={14} className="absolute bottom-0 left-1/2 text-emerald-300" />
              </motion.div>
            </motion.div>

            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {tr('appTitle')}
              </h1>
              <p className="text-emerald-400 text-sm font-semibold tracking-wide mt-1">
                {tr('appSubtitle')}
              </p>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <Heart size={16} />
                <span className="text-sm font-bold">{tr('storyTitle')}</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                {tr('storyBody')}
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBegin}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold text-base flex items-center gap-2 shadow-lg shadow-emerald-500/30 border border-emerald-400/30"
            >
              {tr('begin')}
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
