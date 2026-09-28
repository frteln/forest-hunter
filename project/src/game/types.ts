export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type GearSlot = 'weapon' | 'armor' | 'helmet' | 'amulet';

export type StatType = 'damage' | 'maxHp' | 'armor' | 'speed';

export type Currency = 'gems' | 'crystals';

export interface GearItem {
  id: string;
  slot: GearSlot;
  rarity: Rarity;
  name: string;
  damage: number;
  armor: number;
  hp: number;
  speed: number;
  icon: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  gems: number;
  crystals: number;
  baseDamage: number;
  baseMaxHp: number;
  baseArmor: number;
  baseSpeed: number;
  statUpgrades: Record<StatType, number>;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface MonsterDef {
  type: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  xp: number;
  gems: number;
  radius: number;
  color: string;
  attackRange: number;
  attackCooldown: number;
  isBoss?: boolean;
}

export interface Monster {
  id: string;
  def: MonsterDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  lastAttack: number;
  hitFlash: number;
  vx: number;
  vy: number;
}

export interface GemPickup {
  id: string;
  x: number;
  y: number;
  amount: number;
  ttl: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  ttl: number;
  vy: number;
}

export interface ZoneDef {
  id: number;
  name: string;
  unlockCost: number;
  bgColor: string;
  grassColor: string;
  pathColor: string;
  monsterTypes: string[];
  bossType?: string;
  bossCount: number;
  spawnRate: number;
  maxMonsters: number;
  unlockX: number;
  unlockY: number;
}

export interface SaveData {
  version: number;
  stats: PlayerStats;
  equipped: Record<GearSlot, GearItem | null>;
  inventory: GearItem[];
  unlockedZones: number[];
  currentZone: number;
  playerX: number;
  playerY: number;
  dailyChestClaimed: number;
  lastAdTime: number;
  language: string;
  settings: GameSettings;
  storySeen: boolean;
  bossesDefeated: number;
}

export interface GameSettings {
  music: boolean;
  sfx: boolean;
  quality: 'low' | 'high';
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  time: number;
}

export interface DailyTask {
  id: string;
  desc: string;
  goal: number;
  progress: number;
  reward: number;
  claimed: boolean;
}
