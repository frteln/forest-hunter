import { useState, useCallback } from 'react';
import { useGame } from '@/hooks/useGame';
import { GameCanvas } from '@/components/GameCanvas';
import { Joystick } from '@/components/Joystick';
import { MiniMap } from '@/components/MiniMap';
import { StatusBar } from '@/components/StatusBar';
import { Hotbar, UtilityButtons } from '@/components/Hotbar';
import { StoryIntro } from '@/components/StoryIntro';
import { InventoryModal } from '@/components/InventoryModal';
import { ShopModal } from '@/components/ShopModal';
import { StatsModal } from '@/components/StatsModal';
import { SettingsModal } from '@/components/SettingsModal';
import { MailModal } from '@/components/MailModal';
import { ToastNotif, GearFoundToast } from '@/components/Toasts';
import { DeathScreen, VictoryScreen } from '@/components/Overlays';
import type { Lang } from '@/game/i18n';
import type { StatType, GearItem } from '@/game/types';

type ModalType = 'none' | 'inventory' | 'shop' | 'stats' | 'settings' | 'mail';

function App() {
  const game = useGame();
  const [modal, setModal] = useState<ModalType>('none');
  const [chestResult, setChestResult] = useState<GearItem | null>(null);

  const lang = (game.save?.language as Lang) || 'en';
  const settings = game.save?.settings ?? { music: true, sfx: true, quality: 'high' as const };

  const handleOpenChest = useCallback((rarity: 'rare' | 'epic' | 'legendary') => {
    const result = game.openChest(rarity);
    if (result) {
      setChestResult(result);
      setTimeout(() => setChestResult(null), 3000);
    }
  }, [game]);

  const handleClaimDaily = useCallback(() => {
    const result = game.claimDailyChest();
    if (result) {
      setChestResult(result);
      setTimeout(() => setChestResult(null), 3000);
    }
  }, [game]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Game Canvas */}
      <GameCanvas snap={game.snap} quality={settings.quality} />

      {/* HUD */}
      <StatusBar
        snap={game.snap}
        lang={lang}
        onSettings={() => setModal('settings')}
        onMail={() => setModal('mail')}
        notifCount={game.snap?.notifications.filter(n => !n.read).length ?? 0}
      />

      {/* Mini-map top right */}
      <div className="absolute top-3 right-3 z-20">
        <MiniMap snap={game.snap} />
      </div>

      {/* Hotbar bottom left */}
      <Hotbar
        snap={game.snap}
        lang={lang}
        onOpenInventory={() => setModal('inventory')}
        onOpenChest={() => setModal('shop')}
        onOpenShop={() => setModal('shop')}
      />

      {/* Utility buttons bottom right */}
      <UtilityButtons
        onOpenInventory={() => setModal('inventory')}
        onOpenChest={() => setModal('shop')}
        onOpenShop={() => setModal('shop')}
      />

      {/* Stats upgrade button - small floating button */}
      <button
        onClick={() => setModal('stats')}
        className="absolute top-24 left-3 z-20 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-xs font-bold active:scale-95 transition flex items-center gap-1"
      >
        <span className="text-amber-400">+</span> Stats
      </button>

      {/* Joystick */}
      <Joystick onMove={game.setJoystick} />

      {/* Toasts */}
      <ToastNotif notif={game.notif} onDismiss={game.clearNotif} />
      <GearFoundToast gear={game.gearFound} onDismiss={game.clearGearFound} />

      {/* Story intro */}
      <StoryIntro open={game.showIntro} onBegin={game.dismissIntro} lang={lang} />

      {/* Death / Victory */}
      <DeathScreen open={game.dead} lang={lang} onRespawn={game.respawn} />
      <VictoryScreen open={game.victory} lang={lang} onPlayAgain={game.resetSave} />

      {/* Modals */}
      <InventoryModal
        open={modal === 'inventory'}
        onClose={() => setModal('none')}
        snap={game.snap}
        lang={lang}
        onEquip={game.equipItem}
        onDismantle={game.dismantleItem}
      />
      <ShopModal
        open={modal === 'shop'}
        onClose={() => setModal('none')}
        snap={game.snap}
        lang={lang}
        onOpenChest={handleOpenChest}
        onClaimDaily={handleClaimDaily}
        canClaimDaily={game.canClaimDailyChest()}
        onWatchAdCrystals={game.watchAdCrystals}
        onWatchAdBoost={game.watchAdBoost}
      />
      <StatsModal
        open={modal === 'stats'}
        onClose={() => setModal('none')}
        snap={game.snap}
        lang={lang}
        onUpgrade={game.upgradeStat}
      />
      <SettingsModal
        open={modal === 'settings'}
        onClose={() => setModal('none')}
        lang={lang}
        onLangChange={game.setLanguage}
        settings={settings}
        onSettingsChange={game.setSettings}
        onReset={game.resetSave}
      />
      <MailModal
        open={modal === 'mail'}
        onClose={() => setModal('none')}
        snap={game.snap}
        lang={lang}
        onClaimTask={game.claimTask}
      />

      {/* Chest result toast */}
      {chestResult && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className="rounded-2xl px-5 py-3 border-2 flex items-center gap-3 shadow-2xl animate-pulse"
            style={{
              background: 'rgba(0,0,0,0.85)',
              borderColor: ['#b0b8c4', '#4a9eff', '#b04aff', '#ffa726'][['common', 'rare', 'epic', 'legendary'].indexOf(chestResult.rarity)],
            }}
          >
            <div>
              <div className="text-white/50 text-xs">Chest opened!</div>
              <div className="text-white font-bold text-sm">{chestResult.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
