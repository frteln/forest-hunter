import { Settings, Mail } from 'lucide-react';
import type { EngineSnapshot } from '@/game/engine';
import type { Lang } from '@/game/i18n';
import { t } from '@/game/i18n';

interface Props {
  snap: EngineSnapshot | null;
  lang: Lang;
  onSettings: () => void;
  onMail: () => void;
  notifCount: number;
}

export function StatusBar({ snap, lang, onSettings, onMail, notifCount }: Props) {
  const tr = t(lang);
  if (!snap) return null;
  const hpPct = Math.max(0, snap.player.hp / snap.player.maxHp);
  const zone = ['Whispering Glade', 'Shadowed Thicket', 'Cursed Hollow', "Witch's Tower"][snap.currentZone] || `Zone ${snap.currentZone + 1}`;

  return (
    <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-auto">
      {/* Level + HP */}
      <div className="bg-black/50 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-amber-400 to-amber-700 flex items-center justify-center text-white font-bold text-sm border border-amber-300/50">
          {snap.stats.level}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-white/90 text-xs font-semibold">{zone}</span>
          </div>
          <div className="w-28 h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${hpPct * 100}%`,
                background: hpPct > 0.5 ? 'linear-gradient(90deg,#5bf07a,#3ad958)' : hpPct > 0.25 ? 'linear-gradient(90deg,#ffaa44,#ff8822)' : 'linear-gradient(90deg,#ff6666,#ff3333)',
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/70">
            <span>{Math.ceil(snap.player.hp)}/{snap.player.maxHp} HP</span>
            <span className="text-amber-300">{snap.stats.gems} G</span>
            <span className="text-purple-300">{snap.stats.crystals} C</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onSettings}
          className="w-9 h-9 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={onMail}
          className="w-9 h-9 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition relative"
        >
          <Mail size={18} />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
              {notifCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
