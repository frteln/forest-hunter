import { Check, Gift, Crown, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EngineSnapshot } from '@/game/engine';
import type { Lang } from '@/game/i18n';
import { t } from '@/game/i18n';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  snap: EngineSnapshot | null;
  lang: Lang;
  onClaimTask: (id: string) => void;
}

export function MailModal({ open, onClose, snap, lang, onClaimTask }: Props) {
  const tr = t(lang);
  if (!snap) return null;

  const unread = snap.notifications.filter(n => !n.read).length;

  return (
    <Modal open={open} onClose={onClose} title={tr('notifications')} maxWidth="max-w-sm">
      {/* Daily tasks */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-white/50 text-xs font-bold uppercase">{tr('dailyTasks')}</span>
        </div>
        <div className="space-y-2">
          {snap.dailyTasks.map(task => {
            const pct = Math.min(1, task.progress / task.goal);
            const done = task.progress >= task.goal;
            return (
              <div key={task.id} className="p-2 rounded-lg bg-black/30 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/70 text-xs">{tr(task.desc)}</span>
                  <span className="text-white/40 text-xs">{task.progress}/{task.goal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct * 100}%`,
                        background: done ? '#5bf07a' : '#4a9eff',
                      }}
                    />
                  </div>
                  {done && !task.claimed && (
                    <button
                      onClick={() => onClaimTask(task.id)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold active:scale-95 transition"
                    >
                      {tr('claim')} +{task.reward}
                    </button>
                  )}
                  {task.claimed && <Check size={16} className="text-emerald-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <h3 className="text-white/50 text-xs font-bold uppercase mb-2">{tr('mail')}</h3>
      {snap.notifications.length === 0 ? (
        <div className="text-center text-white/30 text-sm py-6">{tr('noNotifications')}</div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {snap.notifications.map(n => (
            <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-black/20">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="text-white/80 text-xs font-bold">{n.title}</div>
                <div className="text-white/50 text-xs">{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
