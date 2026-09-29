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
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-black select-none touch-none">
      {/* Game Canvas */}
      <GameCanvas snap={game.snap} quality={settings.quality} />

      {/* Top HUD Area */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none flex justify-between items-start p-2 sm:p-3">
        <div className="pointer-events-auto">
          <StatusBar
            snap={game.snap}
            lang={lang}
            onSettings={() => setModal('settings')}
            onMail={() => setModal('mail')}
            notifCount={game.snap?.notifications.filter(n => !n.read).length ?? 0}
          />
        </div>

        <div className="pointer-events-auto">
          <MiniMap snap={game.snap} />
        </div>
      </div>

      {/* Stats Upgrade Floating Button */}
      <button
        onClick={() => setModal('stats')}
        className="absolute top-20 left-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-amber-500/30 text-white text-xs font-semibold active:scale-95 transition flex items-center gap-1.5 shadow-lg shadow-black/40 pointer-events-auto"
      >
        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold">+</span>
        <span>{lang === 'tr' ? 'İstatistikler' : 'Stats'}</span>
      </button>

      {/* Joystick Area */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <Joystick onMove={game.setJoystick} />
      </div>

      {/* Bottom HUD Area (Hotbar & Utility Buttons) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none pb-2 px-2 sm:pb-3 sm:px-3 flex items-end justify-between">
        {/* Hotbar (Bottom Left) */}
        <div className="pointer-events-auto scale-90 origin-bottom-left sm:scale-100">
          <Hotbar
            snap={game.snap}
            lang={lang}
            onOpenInventory={() => setModal('inventory')}
            onOpenChest={() => setModal('shop')}
            onOpenShop={() => setModal('shop')}
          />
        </div>

        {/* Utility Buttons (Bottom Right) */}
        <div className="pointer-events-auto scale-90 origin-bottom-right sm:scale-100">
          <UtilityButtons
            onOpenInventory={() => setModal('inventory')}
            onOpenChest={() => setModal('shop')}
            onOpenShop={() => setModal('shop')}
          />
        </div>
      </div>

      {/* Toasts */}
      <ToastNotif notif={game.notif} onDismiss={game.clearNotif} />
      <GearFoundToast gear={game.gearFound} onDismiss={game.clearGearFound} />

      {/* Story Intro */}
      <StoryIntro open={game.showIntro} onBegin={game.dismissIntro} lang={lang} />

      {/* Death / Victory Overlays */}
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

      {/* Chest Result Toast */}
      {chestResult && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className="rounded-2xl px-5 py-3 border-2 flex items-center gap-3 shadow-2xl animate-pulse backdrop-blur-md"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderColor: ['#b0b8c4', '#4a9eff', '#b04aff', '#ffa726'][['common', 'rare', 'epic', 'legendary'].indexOf(chestResult.rarity)],
            }}
          >
            <div>
              <div className="text-white/60 text-xs font-medium">
                {lang === 'tr' ? 'Sandık Açıldı!' : 'Chest Opened!'}
              </div>
              <div className="text-white font-bold text-sm">{chestResult.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;