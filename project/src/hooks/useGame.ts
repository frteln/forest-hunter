import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, type EngineSnapshot } from '@/game/engine';
import { loadSave, writeSave, clearSave, defaultSave } from '@/game/save';
import type { GearItem, Notification, SaveData } from '@/game/types';

export function useGame() {
  const engineRef = useRef<GameEngine | null>(null);
  const [snap, setSnap] = useState<EngineSnapshot | null>(null);
  const [notif, setNotif] = useState<Notification | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [dead, setDead] = useState(false);
  const [victory, setVictory] = useState(false);
  const [gearFound, setGearFound] = useState<GearItem | null>(null);
  const [save, setSave] = useState<SaveData>(defaultSave());

  useEffect(() => {
    const s = loadSave();
    setSave(s);
    setShowIntro(!s.storySeen);

    const engine = new GameEngine(s, {
      onState: (st) => setSnap(st),
      onNotification: (n) => setNotif(n),
      onBossDefeated: () => setNotif({ id: 'boss', title: 'Boss Defeated!', body: '+30 Crystals earned', read: false, time: Date.now() }),
      onZoneUnlocked: () => setNotif({ id: 'zone', title: 'Zone Unlocked!', body: 'A new forest zone is open', read: false, time: Date.now() }),
      onVictory: () => setVictory(true),
      onDeath: () => setDead(true),
      onGearFound: (item) => setGearFound(item),
    });
    engineRef.current = engine;
    engine.start();

    const saveInterval = setInterval(() => {
      const e = engineRef.current;
      if (e) writeSave(e.getSaveData());
    }, 5000);

    const onUnload = () => {
      const e = engineRef.current;
      if (e) writeSave(e.getSaveData());
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', onUnload);
      onUnload();
      engine.stop();
    };
  }, []);

  const setJoystick = useCallback((x: number, y: number) => {
    engineRef.current?.setJoystick(x, y);
  }, []);

  const upgradeStat = useCallback((stat: 'damage' | 'maxHp' | 'armor' | 'speed') => {
    return engineRef.current?.upgradeStat(stat) ?? false;
  }, []);

  const equipItem = useCallback((item: GearItem) => {
    engineRef.current?.equipItem(item);
  }, []);

  const dismantleItem = useCallback((item: GearItem) => {
    engineRef.current?.dismantleItem(item);
  }, []);

  const openChest = useCallback((rarity: 'rare' | 'epic' | 'legendary') => {
    return engineRef.current?.openChest(rarity) ?? null;
  }, []);

  const claimDailyChest = useCallback(() => {
    return engineRef.current?.claimDailyChest() ?? null;
  }, []);

  const canClaimDailyChest = useCallback(() => {
    return engineRef.current?.canClaimDailyChest() ?? false;
  }, []);

  const watchAdCrystals = useCallback(() => {
    return engineRef.current?.watchAdCrystals() ?? false;
  }, []);

  const watchAdBoost = useCallback(() => {
    engineRef.current?.watchAdBoost();
  }, []);

  const claimTask = useCallback((taskId: string) => {
    return engineRef.current?.claimTask(taskId) ?? false;
  }, []);

  const respawn = useCallback(() => {
    engineRef.current?.respawn();
    setDead(false);
  }, []);

  const dismissIntro = useCallback(() => {
    setShowIntro(false);
    const s = engineRef.current?.getSaveData();
    if (s) {
      s.storySeen = true;
      writeSave(s);
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    const e = engineRef.current;
    if (!e) return;
    e.save.language = lang;
    setSave(e.getSaveData());
    writeSave(e.getSaveData());
  }, []);

  const setSettings = useCallback((settings: SaveData['settings']) => {
    const e = engineRef.current;
    if (!e) return;
    e.save.settings = settings;
    setSave(e.getSaveData());
    writeSave(e.getSaveData());
  }, []);

  const resetSave = useCallback(() => {
    clearSave();
    window.location.reload();
  }, []);

  const clearGearFound = useCallback(() => setGearFound(null), []);
  const clearNotif = useCallback(() => setNotif(null), []);

  return {
    snap, save, notif, showIntro, dead, victory, gearFound,
    setJoystick, upgradeStat, equipItem, dismantleItem,
    openChest, claimDailyChest, canClaimDailyChest,
    watchAdCrystals, watchAdBoost, claimTask, respawn,
    dismissIntro, setLanguage, setSettings, resetSave,
    clearGearFound, clearNotif,
  };
}
