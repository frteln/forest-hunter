import type { GearItem, MonsterDef, Rarity, ZoneDef, StatType } from './types';

export const TILE = 64;
export const WORLD_W = 40;
export const WORLD_H = 40;

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#b0b8c4',
  rare: '#4a9eff',
  epic: '#b04aff',
  legendary: '#ffa726',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: 'rgba(176,184,196,0.5)',
  rare: 'rgba(74,158,255,0.6)',
  epic: 'rgba(176,74,255,0.7)',
  legendary: 'rgba(255,167,38,0.8)',
};

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
};

export const STAT_COST: Record<StatType, number> = {
  damage: 80,
  maxHp: 60,
  armor: 70,
  speed: 90,
};

export const STAT_PER_LEVEL: Record<StatType, number> = {
  damage: 3,
  maxHp: 20,
  armor: 2,
  speed: 0.15,
};

export const STAT_LABEL: Record<StatType, string> = {
  damage: 'Damage',
  maxHp: 'Max HP',
  armor: 'Armor',
  speed: 'Speed',
};

export const MONSTERS: Record<string, MonsterDef> = {
  slime: { type: 'slime', name: 'Forest Slime', hp: 30, damage: 5, speed: 0.5, xp: 10, gems: 8, radius: 16, color: '#5bbf4a', attackRange: 40, attackCooldown: 1200 },
  wolf: { type: 'wolf', name: 'Corrupted Wolf', hp: 55, damage: 10, speed: 1.1, xp: 18, gems: 14, radius: 18, color: '#8a6242', attackRange: 42, attackCooldown: 900 },
  spider: { type: 'spider', name: 'Giant Spider', hp: 45, damage: 8, speed: 0.9, xp: 15, gems: 12, radius: 16, color: '#6b4f8a', attackRange: 44, attackCooldown: 1000 },
  bear: { type: 'bear', name: 'Cursed Bear', hp: 100, damage: 16, speed: 0.7, xp: 30, gems: 25, radius: 24, color: '#5a4a3a', attackRange: 46, attackCooldown: 1100 },
  wraith: { type: 'wraith', name: 'Forest Wraith', hp: 80, damage: 14, speed: 1.0, xp: 25, gems: 20, radius: 20, color: '#7a5aaa', attackRange: 50, attackCooldown: 850 },
  golem: { type: 'golem', name: 'Stone Golem', hp: 160, damage: 22, speed: 0.45, xp: 45, gems: 40, radius: 28, color: '#7a7a8a', attackRange: 48, attackCooldown: 1300 },
  boss_witch: { type: 'boss_witch', name: 'Forest Witch', hp: 800, damage: 35, speed: 0.8, xp: 200, gems: 100, radius: 36, color: '#9a3a7a', attackRange: 120, attackCooldown: 700, isBoss: true },
  boss_troll: { type: 'boss_troll', name: 'Troll Brute', hp: 400, damage: 28, speed: 0.6, xp: 100, gems: 60, radius: 34, color: '#4a6a3a', attackRange: 60, attackCooldown: 900, isBoss: true },
  boss_spirit: { type: 'boss_spirit', name: 'Ancient Spirit', hp: 550, damage: 30, speed: 1.0, xp: 150, gems: 80, radius: 32, color: '#4aaaaa', attackRange: 100, attackCooldown: 800, isBoss: true },
};

export const ZONES: ZoneDef[] = [
  {
    id: 0, name: 'Whispering Glade', unlockCost: 0,
    bgColor: '#1a2a1a', grassColor: '#2d5a2d', pathColor: '#6a5a4a',
    monsterTypes: ['slime', 'wolf'], bossType: undefined, bossCount: 0,
    spawnRate: 2500, maxMonsters: 6,
    unlockX: WORLD_W * TILE - 120, unlockY: WORLD_H * TILE / 2,
  },
  {
    id: 1, name: 'Shadowed Thicket', unlockCost: 500,
    bgColor: '#1a1a2a', grassColor: '#264528', pathColor: '#5a4a3a',
    monsterTypes: ['wolf', 'spider', 'slime'], bossType: 'boss_troll', bossCount: 1,
    spawnRate: 2200, maxMonsters: 8,
    unlockX: 120, unlockY: WORLD_H * TILE - 120,
  },
  {
    id: 2, name: 'Cursed Hollow', unlockCost: 1500,
    bgColor: '#2a1a2a', grassColor: '#243528', pathColor: '#4a3a2a',
    monsterTypes: ['spider', 'wraith', 'bear'], bossType: 'boss_spirit', bossCount: 1,
    spawnRate: 2000, maxMonsters: 10,
    unlockX: WORLD_W * TILE - 120, unlockY: 120,
  },
  {
    id: 3, name: "Witch's Tower", unlockCost: 4000,
    bgColor: '#2a1a1a', grassColor: '#352835', pathColor: '#3a2a3a',
    monsterTypes: ['wraith', 'golem', 'bear'], bossType: 'boss_witch', bossCount: 1,
    spawnRate: 1800, maxMonsters: 12,
    unlockX: WORLD_W * TILE / 2, unlockY: 120,
  },
];

export const CHEST_COSTS = {
  rare: 50,
  epic: 150,
  legendary: 400,
};

export const GEAR_NAMES: Record<string, { weapon: string[]; armor: string[]; helmet: string[]; amulet: string[] }> = {
  common: {
    weapon: ['Rusty Bow', 'Wooden Axe', 'Crude Sword'],
    armor: ['Tattered Cloak', 'Leather Vest', 'Cloth Robe'],
    helmet: ['Leather Cap', 'Woven Hood', 'Bone Helm'],
    amulet: ['Pebble Charm', 'Twig Pendant', 'Shell Necklace'],
  },
  rare: {
    weapon: ['Hunter Bow', 'Iron Axe', 'Steel Sword'],
    armor: ['Studded Leather', 'Chain Mail', 'Padded Armor'],
    helmet: ['Iron Helm', 'Wolf Hood', 'Ranger Hat'],
    amulet: ['Gem Charm', 'Wolf Pendant', 'Forest Necklace'],
  },
  epic: {
    weapon: ['Moonlit Bow', 'Runed Axe', 'Crystal Sword'],
    armor: ['Runic Armor', 'Beast Hide', 'Mystic Robe'],
    helmet: ['Rune Helm', 'Antler Crown', 'Spirit Hood'],
    amulet: ['Mystic Crystal', 'Rune Pendant', 'Spirit Necklace'],
  },
  legendary: {
    weapon: ['Witch Bane Bow', 'Ancient Axe', 'Hunter Legend Sword'],
    armor: ['Dragon Scale', 'Witch Plate', 'Eternal Cloak'],
    helmet: ['Crown of Forest', 'Witch Helm', 'Ancient Crown'],
    amulet: ['Heart of Forest', 'Witch Crystal', 'Eternal Amulet'],
  },
};

export const GEAR_ICONS: Record<string, string> = {
  weapon: 'Crosshair',
  armor: 'Shield',
  helmet: 'HardHat',
  amulet: 'Gem',
};

export function rollRarity(): Rarity {
  const total = Object.values(RARITY_WEIGHT).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [rar, w] of Object.entries(RARITY_WEIGHT)) {
    r -= w;
    if (r <= 0) return rar as Rarity;
  }
  return 'common';
}

export function makeGear(rarity: Rarity, slot: string): GearItem {
  const slotKey = slot as keyof (typeof GEAR_NAMES)[typeof rarity];
  const names = GEAR_NAMES[rarity][slotKey];
  const name = names[Math.floor(Math.random() * names.length)];
  const rarMult: Record<Rarity, number> = { common: 1, rare: 2, epic: 4, legendary: 8 };
  const m = rarMult[rarity];
  return {
    id: Math.random().toString(36).slice(2, 11),
    slot: slot as GearItem['slot'],
    rarity,
    name,
    damage: slot === 'weapon' ? Math.floor((5 + Math.random() * 5) * m) : 0,
    armor: slot === 'armor' || slot === 'helmet' ? Math.floor((3 + Math.random() * 3) * m) : 0,
    hp: slot === 'armor' ? Math.floor((10 + Math.random() * 10) * m) : 0,
    speed: slot === 'amulet' ? +(0.05 * m).toFixed(2) : 0,
    icon: GEAR_ICONS[slot],
  };
}

export function makeStarterGear(): GearItem {
  return makeGear('common', 'weapon');
}

export function xpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.3, level - 1));
}

export function makeInitialStats() {
  return {
    level: 1,
    xp: 0,
    xpToNext: xpForLevel(1),
    gems: 0,
    crystals: 0,
    baseDamage: 12,
    baseMaxHp: 100,
    baseArmor: 0,
    baseSpeed: 2.0,
    statUpgrades: { damage: 0, maxHp: 0, armor: 0, speed: 0 } as Record<StatType, number>,
  };
}
