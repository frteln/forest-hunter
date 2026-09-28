import type {
  Monster, MonsterDef, GemPickup, FloatingText, PlayerStats, GearItem, Vec2, ZoneDef, SaveData, DailyTask, Notification,
} from './types';
import {
  ZONES, MONSTERS, TILE, WORLD_W, WORLD_H, xpForLevel, makeGear, rollRarity, CHEST_COSTS,
} from './data';
import { getDerivedStats } from './stats';

let idCounter = 0;
export function uid(): string {
  return `${Date.now().toString(36)}${(idCounter++).toString(36)}`;
}

export interface EngineCallbacks {
  onState: (s: EngineSnapshot) => void;
  onNotification: (n: Notification) => void;
  onBossDefeated: (zoneId: number) => void;
  onZoneUnlocked: (zoneId: number) => void;
  onVictory: () => void;
  onDeath: () => void;
  onGearFound: (item: GearItem) => void;
}

export interface EngineSnapshot {
  player: { x: number; y: number; hp: number; maxHp: number; dir: number; attackAnim: number; hitFlash: number };
  monsters: Monster[];
  gems: GemPickup[];
  floats: FloatingText[];
  currentZone: number;
  unlockedZones: number[];
  stats: PlayerStats;
  derived: { damage: number; maxHp: number; armor: number; speed: number };
  equipped: Record<string, GearItem | null>;
  inventory: GearItem[];
  bossesDefeated: number;
  unlockProgress: number | null;
  attackSpeedBoostUntil: number;
  dailyTasks: DailyTask[];
  notifications: Notification[];
  dead: boolean;
  victory: boolean;
}

export class GameEngine {
  cb: EngineCallbacks;
  save: SaveData;

  player = { x: 640, y: 640, hp: 100, maxHp: 100, dir: 0, attackAnim: 0, hitFlash: 0 };
  monsters: Monster[] = [];
  gems: GemPickup[] = [];
  floats: FloatingText[] = [];
  currentZone = 0;
  unlockedZones: number[] = [0];
  bossesDefeated = 0;
  dead = false;
  victory = false;

  attackSpeedBoostUntil = 0;
  lastSpawn = 0;
  lastSave = 0;
  lastAttack = 0;
  unlockProgress: number | null = null;
  unlockTargetZone = -1;
  unlockTimer = 0;

  joyVec: Vec2 = { x: 0, y: 0 };

  dailyTasks: DailyTask[] = [];
  notifications: Notification[] = [];

  equipped: Record<string, GearItem | null> = { weapon: null, armor: null, helmet: null, amulet: null };
  inventory: GearItem[] = [];
  stats: PlayerStats;

  running = false;
  lastFrame = 0;
  rafId = 0;

  constructor(save: SaveData, cb: EngineCallbacks) {
    this.save = save;
    this.cb = cb;
    this.stats = save.stats;
    this.equipped = save.equipped;
    this.inventory = save.inventory;
    this.currentZone = save.currentZone;
    this.unlockedZones = save.unlockedZones;
    this.bossesDefeated = save.bossesDefeated;
    this.player.x = save.playerX;
    this.player.y = save.playerY;
    this.dailyTasks = this.makeDailyTasks();
    this.notifications = [];
  }

  makeDailyTasks(): DailyTask[] {
    return [
      { id: 'kill', desc: 'questKill', goal: 20, progress: 0, reward: 10, claimed: false },
      { id: 'boss', desc: 'questBoss', goal: 1, progress: 0, reward: 30, claimed: false },
      { id: 'gems', desc: 'questGems', goal: 300, progress: 0, reward: 15, claimed: false },
      { id: 'zone', desc: 'questZone', goal: 1, progress: 0, reward: 20, claimed: false },
    ];
  }

  get derived() {
    return getDerivedStats(this.stats, this.stats.statUpgrades, this.equipped);
  }

  get zone(): ZoneDef {
    return ZONES[this.currentZone];
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.player.maxHp = this.derived.maxHp;
    this.player.hp = this.player.maxHp;
    this.loop(this.lastFrame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  setJoystick(x: number, y: number) {
    this.joyVec.x = x;
    this.joyVec.y = y;
  }

  loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(50, now - this.lastFrame);
    this.lastFrame = now;
    this.update(dt, now);
    this.emitState();
    if (now - this.lastSave > 3000) {
      this.lastSave = now;
      this.persist();
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  update(dt: number, now: number) {
    if (this.dead || this.victory) return;

    const d = this.derived;
    this.player.maxHp = d.maxHp;

    // Movement
    const jlen = Math.hypot(this.joyVec.x, this.joyVec.y);
    if (jlen > 0.1) {
      const nx = this.joyVec.x / jlen;
      const ny = this.joyVec.y / jlen;
      const spd = d.speed * (dt / 16.67) * 2.5;
      this.player.x += nx * spd;
      this.player.y += ny * spd;
      this.player.dir = Math.atan2(ny, nx);
      // World bounds
      this.player.x = Math.max(40, Math.min(WORLD_W * TILE - 40, this.player.x));
      this.player.y = Math.max(40, Math.min(WORLD_H * TILE - 40, this.player.y));
    }

    // Zone transition: check if player walked into an unlocked neighbor zone pad
    this.checkZoneTransition();

    // Unlock pad logic
    this.checkUnlockPad(now, dt);

    // Spawning
    if (now - this.lastSpawn > this.zone.spawnRate && this.monsters.length < this.zone.maxMonsters) {
      this.lastSpawn = now;
      this.spawnMonster();
    }

    // Spawn boss if zone has one and not yet defeated
    if (this.zone.bossType && !this.monsters.some(m => m.def.isBoss) && this.bossesDefeated <= this.countBossesDefeatedInZone()) {
      // only spawn boss after some kills in zone
      if (this.monsters.length >= 3 || this.zone.id === 3) {
        this.spawnBoss();
      }
    }

    // Update monsters
    const px = this.player.x;
    const py = this.player.y;
    const attackSpeedMult = now < this.attackSpeedBoostUntil ? 2 : 1;

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      const dx = px - m.x;
      const dy = py - m.y;
      const dist = Math.hypot(dx, dy);
      const mspd = m.def.speed * (dt / 16.67) * 1.5;

      if (dist > m.def.attackRange) {
        m.vx = (dx / dist) * mspd;
        m.vy = (dy / dist) * mspd;
        m.x += m.vx;
        m.y += m.vy;
      } else {
        // Attack player
        if (now - m.lastAttack > m.def.attackCooldown) {
          m.lastAttack = now;
          const dmg = Math.max(1, m.def.damage - d.armor * 0.5);
          this.player.hp -= dmg;
          this.player.hitFlash = 200;
          this.addFloat(px, py - 30, `-${Math.floor(dmg)}`, '#ff6b6b');
        }
      }
      if (m.hitFlash > 0) m.hitFlash -= dt;
    }

    // Auto-attack
    if (now - this.lastAttack > (800 / attackSpeedMult)) {
      const target = this.findNearestMonster();
      if (target) {
        this.lastAttack = now;
        this.player.attackAnim = 200;
        const dmg = d.damage * (0.85 + Math.random() * 0.3);
        target.hp -= dmg;
        target.hitFlash = 150;
        this.addFloat(target.x, target.y - 20, `${Math.floor(dmg)}`, '#ffdd55');
        if (target.hp <= 0) {
          this.killMonster(target);
        }
      }
    }

    if (this.player.attackAnim > 0) this.player.attackAnim -= dt;
    if (this.player.hitFlash > 0) this.player.hitFlash -= dt;

    // Pick up gems
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.ttl -= dt;
      const dx = px - g.x;
      const dy = py - g.y;
      if (Math.hypot(dx, dy) < 50 || g.ttl <= 0) {
        this.stats.gems += g.amount;
        this.updateTask('gems', g.amount);
        this.addFloat(px, py - 40, `+${g.amount} G`, '#5bf07a');
        this.gems.splice(i, 1);
      }
    }

    // Floats
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.ttl -= dt;
      f.y += f.vy * (dt / 16);
      if (f.ttl <= 0) this.floats.splice(i, 1);
    }

    // Death
    if (this.player.hp <= 0 && !this.dead) {
      this.dead = true;
      this.cb.onDeath();
    }
  }

  findNearestMonster(): Monster | null {
    let best: Monster | null = null;
    let bestDist = 300; // attack range
    for (const m of this.monsters) {
      const d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
      if (d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    return best;
  }

  spawnMonster() {
    const types = this.zone.monsterTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    const def = MONSTERS[type];
    if (!def) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 400 + Math.random() * 200;
    const x = Math.max(40, Math.min(WORLD_W * TILE - 40, this.player.x + Math.cos(angle) * dist));
    const y = Math.max(40, Math.min(WORLD_H * TILE - 40, this.player.y + Math.sin(angle) * dist));
    const zoneMult = 1 + this.currentZone * 0.4;
    this.monsters.push({
      id: uid(), def: { ...def, hp: Math.floor(def.hp * zoneMult), damage: Math.floor(def.damage * zoneMult) },
      x, y, hp: Math.floor(def.hp * zoneMult), maxHp: Math.floor(def.hp * zoneMult),
      lastAttack: 0, hitFlash: 0, vx: 0, vy: 0,
    });
  }

  spawnBoss() {
    const type = this.zone.bossType!;
    const def = MONSTERS[type];
    if (!def) return;
    const zoneMult = 1 + this.currentZone * 0.5;
    const x = this.player.x + (Math.random() < 0.5 ? -300 : 300);
    const y = this.player.y + (Math.random() < 0.5 ? -300 : 300);
    this.monsters.push({
      id: uid(), def: { ...def, hp: Math.floor(def.hp * zoneMult), damage: Math.floor(def.damage * zoneMult), isBoss: true },
      x, y, hp: Math.floor(def.hp * zoneMult), maxHp: Math.floor(def.hp * zoneMult),
      lastAttack: 0, hitFlash: 0, vx: 0, vy: 0,
    });
    this.addFloat(this.player.x, this.player.y - 60, 'BOSS APPROACHES!', '#ff4444');
  }

  countBossesDefeatedInZone(): number {
    // count how many times boss defeated in current zone (simplified: bossesDefeated total)
    return this.bossesDefeated;
  }

  killMonster(m: Monster) {
    const idx = this.monsters.indexOf(m);
    if (idx >= 0) this.monsters.splice(idx, 1);
    // Drop gems
    this.gems.push({ id: uid(), x: m.x, y: m.y, amount: m.def.gems, ttl: 8000 });
    // XP
    this.stats.xp += m.def.xp;
    this.updateTask('kill', 1);
    while (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level++;
      this.stats.xpToNext = xpForLevel(this.stats.level);
      this.player.hp = this.derived.maxHp;
      this.addFloat(this.player.x, this.player.y - 50, 'LEVEL UP!', '#ffdd55');
    }
    // Boss kill
    if (m.def.isBoss) {
      this.bossesDefeated++;
      this.stats.crystals += 30;
      this.updateTask('boss', 1);
      this.addFloat(this.player.x, this.player.y - 60, '+30 Crystals!', '#b04aff');
      this.cb.onBossDefeated(this.currentZone);
      // Gear drop from boss
      const rarity = rollRarity();
      const slots = ['weapon', 'armor', 'helmet', 'amulet'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      const gear = makeGear(rarity === 'common' ? 'rare' : rarity, slot);
      this.inventory.push(gear);
      this.cb.onGearFound(gear);
      // Final boss victory
      if (m.def.type === 'boss_witch') {
        this.victory = true;
        this.cb.onVictory();
      }
    } else {
      // Small chance of gear drop
      if (Math.random() < 0.08) {
        const slots = ['weapon', 'armor', 'helmet', 'amulet'];
        const slot = slots[Math.floor(Math.random() * slots.length)];
        const gear = makeGear(rollRarity(), slot);
        this.inventory.push(gear);
        this.cb.onGearFound(gear);
      }
    }
  }

  checkZoneTransition() {
    // If player is near an unlocked zone's unlock pad and that zone is unlocked, switch to it
    for (const zoneId of this.unlockedZones) {
      if (zoneId === this.currentZone) continue;
      const z = ZONES[zoneId];
      const dx = this.player.x - z.unlockX;
      const dy = this.player.y - z.unlockY;
      if (Math.hypot(dx, dy) < 60) {
        this.currentZone = zoneId;
        this.monsters = [];
        this.gems = [];
        this.player.x = WORLD_W * TILE / 2;
        this.player.y = WORLD_H * TILE / 2;
        this.addNotification('Zone', `Entered ${z.name}`);
        break;
      }
    }
  }

  checkUnlockPad(now: number, dt: number) {
    // Find locked zone whose pad is near player
    for (const zone of ZONES) {
      if (this.unlockedZones.includes(zone.id)) continue;
      // Only check adjacent zones (simplified: check all)
      const dx = this.player.x - zone.unlockX;
      const dy = this.player.y - zone.unlockY;
      if (Math.hypot(dx, dy) < 70) {
        if (this.unlockTargetZone !== zone.id) {
          this.unlockTargetZone = zone.id;
          this.unlockTimer = 0;
        }
        this.unlockTimer += dt;
        this.unlockProgress = Math.min(1, this.unlockTimer / 3000);
        if (this.unlockTimer >= 3000) {
          if (this.stats.gems >= zone.unlockCost) {
            this.stats.gems -= zone.unlockCost;
            this.unlockedZones.push(zone.id);
            this.updateTask('zone', 1);
            this.cb.onZoneUnlocked(zone.id);
            this.addNotification('Zone', `Unlocked ${zone.name}!`);
            this.unlockProgress = null;
            this.unlockTargetZone = -1;
          } else {
            this.addFloat(this.player.x, this.player.y - 40, 'Not enough gems!', '#ff6b6b');
            this.unlockProgress = null;
            this.unlockTargetZone = -1;
          }
        }
        return;
      }
    }
    this.unlockProgress = null;
    this.unlockTargetZone = -1;
  }

  addFloat(x: number, y: number, text: string, color: string) {
    this.floats.push({ id: uid(), x, y, text, color, ttl: 1000, vy: -0.8 });
  }

  addNotification(title: string, body: string) {
    this.notifications.unshift({ id: uid(), title, body, read: false, time: Date.now() });
    if (this.notifications.length > 20) this.notifications.pop();
    this.cb.onNotification(this.notifications[0]);
  }

  updateTask(id: string, amount: number) {
    const task = this.dailyTasks.find(t => t.id === id);
    if (task && !task.claimed) {
      task.progress = Math.min(task.goal, task.progress + amount);
    }
  }

  claimTask(taskId: string) {
    const task = this.dailyTasks.find(t => t.id === taskId);
    if (task && !task.claimed && task.progress >= task.goal) {
      task.claimed = true;
      this.stats.crystals += task.reward;
      return true;
    }
    return false;
  }

  upgradeStat(stat: 'damage' | 'maxHp' | 'armor' | 'speed'): boolean {
    const cost = this.statCost(stat);
    if (this.stats.gems < cost) return false;
    this.stats.gems -= cost;
    this.stats.statUpgrades[stat]++;
    this.player.hp = this.derived.maxHp;
    return true;
  }

  statCost(stat: 'damage' | 'maxHp' | 'armor' | 'speed'): number {
    const base = { damage: 80, maxHp: 60, armor: 70, speed: 90 }[stat];
    const lvl = this.stats.statUpgrades[stat];
    return Math.floor(base * Math.pow(1.5, lvl));
  }

  equipItem(item: GearItem): boolean {
    const current = this.equipped[item.slot];
    this.equipped[item.slot] = item;
    const idx = this.inventory.indexOf(item);
    if (idx >= 0) this.inventory.splice(idx, 1);
    if (current) this.inventory.push(current);
    this.player.hp = Math.min(this.player.hp, this.derived.maxHp);
    return true;
  }

  dismantleItem(item: GearItem): boolean {
    const idx = this.inventory.indexOf(item);
    if (idx < 0) return false;
    const val = { common: 5, rare: 20, epic: 50, legendary: 150 }[item.rarity];
    this.inventory.splice(idx, 1);
    this.stats.gems += val;
    this.addFloat(this.player.x, this.player.y - 30, `+${val} G`, '#5bf07a');
    return true;
  }

  openChest(rarity: 'rare' | 'epic' | 'legendary'): GearItem | null {
    const cost = CHEST_COSTS[rarity];
    if (this.stats.crystals < cost) return null;
    this.stats.crystals -= cost;
    const slots = ['weapon', 'armor', 'helmet', 'amulet'];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    // Chests bias rarity upward
    let rolled: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
    const r = Math.random();
    if (rarity === 'rare') rolled = r < 0.6 ? 'rare' : r < 0.9 ? 'epic' : 'legendary';
    if (rarity === 'epic') rolled = r < 0.5 ? 'epic' : 'legendary';
    if (rarity === 'legendary') rolled = r < 0.7 ? 'legendary' : 'epic';
    const gear = makeGear(rolled, slot);
    this.inventory.push(gear);
    return gear;
  }

  claimDailyChest(): GearItem | null {
    const today = Math.floor(Date.now() / 86400000);
    if (this.save.dailyChestClaimed === today) return null;
    this.save.dailyChestClaimed = today;
    const gear = makeGear(rollRarity(), ['weapon', 'armor', 'helmet', 'amulet'][Math.floor(Math.random() * 4)]);
    this.inventory.push(gear);
    return gear;
  }

  canClaimDailyChest(): boolean {
    const today = Math.floor(Date.now() / 86400000);
    return this.save.dailyChestClaimed !== today;
  }

  watchAdCrystals() {
    const now = Date.now();
    if (now - this.save.lastAdTime < 60000) return false;
    this.save.lastAdTime = now;
    this.stats.crystals += 50;
    this.addFloat(this.player.x, this.player.y - 40, '+50 Crystals!', '#b04aff');
    return true;
  }

  watchAdBoost() {
    this.attackSpeedBoostUntil = performance.now() + 15 * 60 * 1000;
    this.addFloat(this.player.x, this.player.y - 40, '2x Attack Speed!', '#ffdd55');
  }

  respawn() {
    this.dead = false;
    this.player.hp = this.derived.maxHp;
    this.currentZone = 0;
    this.player.x = 640;
    this.player.y = 640;
    this.monsters = [];
    this.gems = [];
  }

  emitState() {
    const snap: EngineSnapshot = {
      player: { ...this.player },
      monsters: this.monsters.map(m => ({ ...m })),
      gems: this.gems.map(g => ({ ...g })),
      floats: this.floats.map(f => ({ ...f })),
      currentZone: this.currentZone,
      unlockedZones: [...this.unlockedZones],
      stats: { ...this.stats, statUpgrades: { ...this.stats.statUpgrades } },
      derived: this.derived,
      equipped: { ...this.equipped },
      inventory: [...this.inventory],
      bossesDefeated: this.bossesDefeated,
      unlockProgress: this.unlockProgress,
      attackSpeedBoostUntil: this.attackSpeedBoostUntil,
      dailyTasks: this.dailyTasks.map(t => ({ ...t })),
      notifications: [...this.notifications],
      dead: this.dead,
      victory: this.victory,
    };
    this.cb.onState(snap);
  }

  persist() {
    this.save.stats = this.stats;
    this.save.equipped = this.equipped as any;
    this.save.inventory = this.inventory;
    this.save.unlockedZones = this.unlockedZones;
    this.save.currentZone = this.currentZone;
    this.save.playerX = this.player.x;
    this.save.playerY = this.player.y;
    this.save.bossesDefeated = this.bossesDefeated;
  }

  getSaveData(): SaveData {
    this.persist();
    return { ...this.save };
  }
}
