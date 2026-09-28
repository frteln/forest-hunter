import type { SaveData, GameSettings, GearItem } from './types';
import { makeInitialStats, makeStarterGear } from './data';

const SAVE_KEY = 'forest_hunter_save_v1';
const SAVE_VERSION = 1;

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    stats: makeInitialStats(),
    equipped: { weapon: makeStarterGear(), armor: null, helmet: null, amulet: null },
    inventory: [],
    unlockedZones: [0],
    currentZone: 0,
    playerX: 640,
    playerY: 640,
    dailyChestClaimed: 0,
    lastAdTime: 0,
    language: 'en',
    settings: { music: true, sfx: true, quality: 'high' },
    storySeen: false,
    bossesDefeated: 0,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return defaultSave();
    return { ...defaultSave(), ...data };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

export function defaultSettings(): GameSettings {
  return { music: true, sfx: true, quality: 'high' };
}

export type { GearItem };
