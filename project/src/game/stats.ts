import type { GearItem, Rarity, StatType } from './types';
import { STAT_PER_LEVEL } from './data';

export function getDerivedStats(
  base: { baseDamage: number; baseMaxHp: number; baseArmor: number; baseSpeed: number },
  statUpgrades: Record<StatType, number>,
  equipped: Record<string, GearItem | null>
): { damage: number; maxHp: number; armor: number; speed: number } {
  let damage = base.baseDamage + STAT_PER_LEVEL.damage * statUpgrades.damage;
  let maxHp = base.baseMaxHp + STAT_PER_LEVEL.maxHp * statUpgrades.maxHp;
  let armor = base.baseArmor + STAT_PER_LEVEL.armor * statUpgrades.armor;
  let speed = base.baseSpeed + STAT_PER_LEVEL.speed * statUpgrades.speed;

  for (const item of Object.values(equipped)) {
    if (!item) continue;
    damage += item.damage;
    maxHp += item.hp;
    armor += item.armor;
    speed += item.speed;
  }
  return { damage: Math.max(1, damage), maxHp: Math.max(10, maxHp), armor: Math.max(0, armor), speed: Math.max(0.5, speed) };
}

export function rarityRank(r: Rarity): number {
  return { common: 0, rare: 1, epic: 2, legendary: 3 }[r];
}

export function gearScore(item: GearItem): number {
  return item.damage * 3 + item.armor * 2 + item.hp + item.speed * 20;
}

export function dismantleValue(item: GearItem): number {
  const mult: Record<Rarity, number> = { common: 5, rare: 20, epic: 50, legendary: 150 };
  return mult[item.rarity];
}
