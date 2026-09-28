import { Globe, Music, Volume2, Monitor, Trash2, Check } from 'lucide-react';
import type { Lang } from '@/game/i18n';
import { t, LANGS } from '@/game/i18n';
import type { GameSettings } from '@/game/types';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onLangChange: (lang: string) => void;
  settings: GameSettings;
  onSettingsChange: (s: GameSettings) => void;
  onReset: () => void;
}

export function SettingsModal({ open, onClose, lang, onLangChange, settings, onSettingsChange, onReset }: Props) {
  const tr = t(lang);

  return (
    <Modal open={open} onClose={onClose} title={tr('settings')} maxWidth="max-w-sm">
      {/* Language */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={16} className="text-blue-400" />
          <span className="text-white/50 text-xs font-bold uppercase">{tr('language')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => onLangChange(l.code)}
              className={`flex items-center gap-2 p-2 rounded-lg border transition active:scale-95 ${
                lang === l.code
                  ? 'bg-blue-600/30 border-blue-500/50 text-white'
                  : 'bg-black/30 border-white/10 text-white/60'
              }`}
            >
              <span className="text-xs font-bold w-8">{l.flag}</span>
              <span className="text-xs">{l.label}</span>
              {lang === l.code && <Check size={14} className="ml-auto text-blue-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2 mb-4">
        <ToggleRow
          icon={<Music size={16} className="text-emerald-400" />}
          label={tr('music')}
          value={settings.music}
          onToggle={() => onSettingsChange({ ...settings, music: !settings.music })}
        />
        <ToggleRow
          icon={<Volume2 size={16} className="text-amber-400" />}
          label={tr('sfx')}
          value={settings.sfx}
          onToggle={() => onSettingsChange({ ...settings, sfx: !settings.sfx })}
        />
        <div className="flex items-center gap-3 p-2 rounded-lg bg-black/30">
          <Monitor size={16} className="text-purple-400" />
          <span className="text-white/70 text-sm flex-1">{tr('quality')}</span>
          <button
            onClick={() => onSettingsChange({ ...settings, quality: settings.quality === 'high' ? 'low' : 'high' })}
            className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold"
          >
            {settings.quality === 'high' ? tr('high') : tr('low')}
          </button>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-bold active:scale-95 transition"
      >
        <Trash2 size={16} />
        {tr('resetSave')}
      </button>
    </Modal>
  );
}

function ToggleRow({ icon, label, value, onToggle }: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-black/30">
      {icon}
      <span className="text-white/70 text-sm flex-1">{label}</span>
      <button
        onClick={onToggle}
        className={`w-10 h-6 rounded-full transition relative ${value ? 'bg-emerald-500' : 'bg-gray-600'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
