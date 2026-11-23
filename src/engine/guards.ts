import { ENEMIES } from "../content/enemies.ts";
import { applySlow, isAirborne, isBurrowing, isStaggered } from "./enemy-abilities.ts";
import { facingFor } from "./formation.ts";
import type { Facing } from "./formation.ts";
import {
  ANTLER_SWEEP_RADIUS, ANTLER_SWEEP_REACH, CHIEF_CLEAVE_RADIUS, CHIEF_CLEAVE_REACH, enemyMeleeDamage, hasAimedBossMelee,
  MAMMOTH_QUAKE_RADIUS, MAMMOTH_QUAKE_SPLASH, startEnemyMelee, WEIR_SURGE_RADIUS,
} from "./melee.ts";
import { clamp, dist2, isInTunnel, key, overTunnel } from "./route.ts";
import type { Building, Effect, Enemy, GuardPostId, Level, MeleeStyle, Point, Route } from "./types.ts";

const BASIC_GUARD = { speed: 4.5, seekSpeed: 2.7, strikeInterval: 0.8, counterFactor: 1 } as const;
export const GUARD_REGEN = { delay: 3.0, rateFraction: 0.1 } as const;
export const GUARD_LEASH_PAD = 0.75;
export const GUARD_POST = {
  ...BASIC_GUARD, name: "兔卫岗哨", color: "#c5dca5",
  cost: 85, health: 80, damage: 8, respawn: 7, reach: 1.5, aggro: 1.55, squad: 2,
} as const;
export const GUARD_UPGRADE = {
  ...BASIC_GUARD, speed: 4.6, seekSpeed: 2.85,
  cost: 75, health: 100, damage: 10, respawn: 6, reach: 2.5, aggro: 1.75, squad: 3,
} as const;
export const SPEAR_THROW = { damage: 7, range: 2.8, interval: 2.2, speed: 10 } as const;
export const GUARD_BRANCHES = {
  shield: {
    name: "堤盾班", detail: "4 名兔卫 · 反击伤害降低 35% · 半径 3 格",
    cost: 120, health: 132, damage: 12, respawn: 5.5, reach: 3, aggro: 1.9, squad: 4,
    speed: 4.5, seekSpeed: 2.65, strikeInterval: 0.82, counterFactor: 0.65,
  },
  spear: {
    name: "苇枪队", detail: `优先近刺 · 闲时投枪 ${SPEAR_THROW.damage} 伤害 · 可对空`,
    cost: 115, health: 108, damage: 17, respawn: 4.5, reach: 3.5, aggro: 1.8, squad: 3,
    speed: 5.2, seekSpeed: 3.35, strikeInterval: 0.58, counterFactor: 1,
  },
  talon: {
    name: "合翼锐爪", detail: "两只合成一只 · 可拦 3 敌 · 38 伤害 · 反击减伤 24%",
    cost: 130, health: 282, damage: 38, respawn: 9.5, reach: 4.7, aggro: 3.1, squad: 1, block: 3,
    speed: 6.4, seekSpeed: 4.15, strikeInterval: .72, counterFactor: .76,
  },
  wingpair: {
    name: "霜翼编队", detail: "加派一只幼年狮鹫 · 两波后成年并强化",
    cost: 135, health: 124, damage: 16, respawn: 8.5, reach: 4.45, aggro: 2.9, squad: 3,
    speed: 6.1, seekSpeed: 3.9, strikeInterval: .86, counterFactor: .92,
  },
  pack: {
    name: "雪狼群阵", detail: "3 只霜狼协同拦截 · 扑咬附带寒霜减速",
    cost: 125, health: 142, damage: 18, respawn: 6.5, reach: 3.4, aggro: 2.5, squad: 3,
    speed: 6.2, seekSpeed: 4.15, strikeInterval: .64, counterFactor: .86,
    chill: { slow: 0.62, duration: 2.0 },
  },
  dire: {
    name: "冰鬃头狼", detail: "合成 1 只巨型头狼 · 可拦 2 敌 · 高血抗伤并强效减速",
    cost: 130, health: 310, damage: 36, respawn: 8.5, reach: 3.6, aggro: 2.65, squad: 1, block: 2,
    speed: 6.0, seekSpeed: 3.75, strikeInterval: .74, counterFactor: .72,
    chill: { slow: 0.58, duration: 2.2 },
  },
  "fixed-bank": {
    ...BASIC_GUARD, name: "固堤班", detail: "3 名筏卫，接战 0.45 秒即可立桨抵消位移",
    cost: 125, health: 160, damage: 17, respawn: 5.6, reach: 3.1, aggro: 2.05, squad: 3,
    brace: { contact: .45, cooldown: 7 },
  },
  "mud-patrol": {
    ...BASIC_GUARD, name: "探滩队", detail: "两名筏卫首次接战可踏前补一桨，各自冷却 6 秒",
    cost: 120, health: 150, damage: 19, respawn: 5.6, reach: 3.3, aggro: 2.15, squad: 2,
    seekSpeed: 3.45, strikeInterval: .66, brace: { contact: .6, cooldown: 7 }, patrol: 1,
  },
} as const;
export type GuardBranch = keyof typeof GUARD_BRANCHES;

interface GuardStats {
  readonly name?: string;
  readonly cost: number;
  readonly health: number;
  readonly damage: number;
  readonly respawn: number;
  readonly reach: number;
  readonly aggro: number;
  readonly squad: number;
  readonly block?: number;
  readonly speed: number;
  readonly seekSpeed: number;
  readonly strikeInterval: number;
  readonly counterFactor: number;
  readonly detail?: string;
  readonly brace?: { readonly contact: number; readonly cooldown: number; readonly share?: boolean };
  readonly patrol?: number;
  readonly chill?: { readonly slow: number; readonly duration: number };
}

export const GUARD_MASTERIES: Readonly<Record<GuardBranch, GuardStats>> = {
  shield: { ...GUARD_BRANCHES.shield, cost: 130, health: 167, damage: 16, respawn: 4.8, reach: 3.35, aggro: 2.05, seekSpeed: 2.8, counterFactor: .57 },
  spear: { ...GUARD_BRANCHES.spear, cost: 135, health: 133, damage: 22, respawn: 3.9, reach: 3.8, aggro: 1.95, speed: 5.3, seekSpeed: 3.55, strikeInterval: .54 },
  talon: { ...GUARD_BRANCHES.talon, cost: 155, health: 355, damage: 49, respawn: 8.5, reach: 5.2, aggro: 3.3, speed: 6.7, seekSpeed: 4.4,
    strikeInterval: .66, counterFactor: .68 },
  wingpair: { ...GUARD_BRANCHES.wingpair, cost: 155, health: 154, damage: 20, respawn: 7.7, reach: 4.9, aggro: 3.1, speed: 6.3, seekSpeed: 4.15,
    strikeInterval: .79, counterFactor: .86 },
  pack: { ...GUARD_BRANCHES.pack, cost: 140, health: 178, damage: 23, respawn: 5.8, reach: 3.8, aggro: 2.65, speed: 6.5, seekSpeed: 4.35,
    strikeInterval: .58, counterFactor: .8, chill: { slow: 0.56, duration: 2.2 } },
  dire: { ...GUARD_BRANCHES.dire, cost: 150, health: 390, damage: 48, respawn: 7.5, reach: 4.0, aggro: 2.8, speed: 6.3, seekSpeed: 3.95,
    strikeInterval: .68, counterFactor: .64, chill: { slow: 0.52, duration: 2.5 } },
  "fixed-bank": { ...GUARD_BRANCHES["fixed-bank"], name: "系缆阵", cost: 145, health: 205, damage: 24, respawn: 4.9,
    reach: 3.5, aggro: 2.2, brace: { contact: .45, cooldown: 7, share: true },
    detail: "抗推后为最近同哨筏卫提供 2 秒抗推，同一队友每 8 秒获得一次" },
  "mud-patrol": { ...GUARD_BRANCHES["mud-patrol"], name: "双桨巡卫", cost: 145, health: 195, damage: 28, respawn: 4.9,
    reach: 3.7, aggro: 2.3, strikeInterval: .56, patrol: 2,
    detail: "额外一桨可波及 0.8 格内另一名普通地面敌人" },
};

function fledglingStats(adult: GuardStats): GuardStats {
  return {
    ...adult,
    health: Math.round(adult.health * .58),
    damage: Math.round(adult.damage * .56),
    aggro: Number((adult.aggro * .88).toFixed(2)),
    speed: adult.speed * .86,
    seekSpeed: Number((adult.seekSpeed * .88).toFixed(2)),
  };
}

function raisedGriffinStats(adult: GuardStats): GuardStats {
  return { ...adult, health: Math.round(adult.health * 1.12), damage: adult.damage + 2 };
}

const WINGPAIR_RECRUIT = {
  3: { young: fledglingStats(GUARD_BRANCHES.wingpair), adult: raisedGriffinStats(GUARD_BRANCHES.wingpair) },
  4: { young: fledglingStats(GUARD_MASTERIES.wingpair), adult: raisedGriffinStats(GUARD_MASTERIES.wingpair) },
};

export const GUARD_BUILDINGS: Readonly<Record<GuardPostId, {
  name: string; color: string; role: string; unit: string; flying?: boolean;
  base: GuardStats; upgrade: GuardStats; branches: readonly GuardBranch[];
}>> = {
  "guard-post": {
    name: GUARD_POST.name, color: GUARD_POST.color, role: "兔卫小队 · 地面拦截", unit: "兔卫",
    base: GUARD_POST, upgrade: GUARD_UPGRADE, branches: ["shield", "spear"],
  },
  "griffin-roost": {
    name: "狮鹫巢塔", color: "#b9d8f4", role: "两只狮鹫 · 远距离对空、对地拦截", unit: "狮鹫", flying: true,
    base: { cost: 125, health: 86, damage: 10, respawn: 11, reach: 3.5, aggro: 2.55, squad: 2,
      speed: 5.6, seekSpeed: 3.5, strikeInterval: .92, counterFactor: 1 },
    upgrade: { cost: 100, health: 112, damage: 14, respawn: 10, reach: 4.15, aggro: 2.75, squad: 2,
      speed: 5.9, seekSpeed: 3.75, strikeInterval: .87, counterFactor: .92 },
    branches: ["talon", "wingpair"],
  },
  "frost-kennel": {
    name: "霜狼犬舍", color: "#a8e0f5", role: "霜狼猎手 · 地面疾速寒霜拦截", unit: "霜狼",
    base: { cost: 110, health: 96, damage: 11, respawn: 8.5, reach: 2.4, aggro: 2.2, squad: 2,
      speed: 5.6, seekSpeed: 3.7, strikeInterval: .72, counterFactor: .95, chill: { slow: 0.72, duration: 1.6 } },
    upgrade: { cost: 90, health: 128, damage: 15, respawn: 7.5, reach: 2.9, aggro: 2.35, squad: 2,
      speed: 5.9, seekSpeed: 3.9, strikeInterval: .68, counterFactor: .9, chill: { slow: 0.66, duration: 1.8 } },
    branches: ["pack", "dire"],
  },
  "reed-post": {
    name: "苇篷哨舍", color: "#dfb58a", role: "水獭筏卫 · 地面拦截，立桨抵抗位移", unit: "筏卫",
    base: { ...BASIC_GUARD, cost: 100, health: 105, damage: 11, respawn: 6.6, reach: 2, aggro: 1.8, squad: 2,
      brace: { contact: .6, cooldown: 8 } },
    upgrade: { ...BASIC_GUARD, cost: 85, health: 135, damage: 15, respawn: 6.1, reach: 2.6, aggro: 2, squad: 2,
      brace: { contact: .6, cooldown: 7 } },
    branches: ["fixed-bank", "mud-patrol"],
  },
};

export function isGuardPostId(type: string): type is GuardPostId {
  return Object.hasOwn(GUARD_BUILDINGS, type);
}

export function isFlyingGuardPost(type: GuardPostId) {
  return Boolean(GUARD_BUILDINGS[type].flying);
}

export function isGuardPost(building: Building): building is GuardPost {
  return isGuardPostId(building.type);
}


interface GuardAttack {
  readonly kind: "thrust" | "throw";
  readonly pose?: "air" | "ground";
  readonly target: Enemy;
  readonly direction: Point;
  readonly start: number;
  readonly impact: number;
  readonly end: number;
  released: boolean;
  bonus?: boolean;
}

export interface Guard {
  x: number;
  y: number;
  hp: number;
  target: Enemy | null;
  extraTargets?: Enemy[];
  respawnAt: number;
  nextStrike: number;
  nextThrow: number;
  attack?: GuardAttack;
  contactAt?: number;
  hurtAt: number;
  combatAt: number;
  healedAt?: number;
  recoil: Point;
  walk: number;
  movedAt: number;
  facing: -1 | 1;
  path: Point[];
  switchDuty?: boolean;
  flight?: { height: number; landedAt: number };
  recruit?: { adultAfter: number; grown: boolean; grownAt?: number };
  braceReadyAt?: number;
  braceAt?: number;
  sharedBraceUntil?: number;
  nextBraceShare?: number;
  patrolReadyAt?: number;
  patrolTarget?: Enemy;
  fusion?: { from: Point; at: number };
}

type GuardPath = (from: Point, to: Point) => Point[] | null;

export interface GuardPost {
  readonly type: GuardPostId;
  readonly index: number;
  readonly origin: Point;
  rally: Point;
  readonly guards: Guard[];
  tier: 1 | 2 | 3 | 4;
  branch?: GuardBranch;
  readonly builtAt?: number;
  upgradeFrom?: { readonly at: number; readonly tier: GuardPost["tier"]; readonly branch?: GuardBranch };
  readonly findPath: GuardPath;
  readonly canLand?: (point: Point) => boolean;
}

export function guardStats(post: GuardPost): GuardStats {
  const spec = GUARD_BUILDINGS[post.type];
  if (post.branch) return post.tier === 4 ? GUARD_MASTERIES[post.branch] : GUARD_BRANCHES[post.branch];
  return post.tier === 2 ? spec.upgrade : spec.base;
}

export function guardUnitStats(post: GuardPost, guard: Guard): GuardStats {
  if (!guard.recruit) return guardStats(post);
  const recruit = WINGPAIR_RECRUIT[post.tier === 4 ? 4 : 3];
  return guard.recruit.grown ? recruit.adult : recruit.young;
}

export function guardPathfinder(level: Level, flying = false): GuardPath {
  const water = new Set(level.pools.map(([x, y]) => key(x, y)));
  for (const { from: [x, y], to: [tx, ty] } of level.bridges ?? []) {
    for (let step = 0; step <= Math.abs(tx - x) + Math.abs(ty - y); step++)
      water.delete(key(x + step * Math.sign(tx - x), y + step * Math.sign(ty - y)));
  }
  const tunnels = level.tunnels ?? [];
  const blocked = (x: number, y: number) =>
    (!flying && water.has(key(x, y))) || tunnels.some((tunnel) => overTunnel(tunnel, x, y));
  return ([x, y], to) => {
    const start: Point = [Math.round(x), Math.round(y)];
    const [tx, ty] = to;
    if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height || blocked(tx, ty)) return null;
    const distance = Math.abs(tx - start[0]) + Math.abs(ty - start[1]);
    if (flying || distance < 2) return distance === 0 ? [start] : [start, to];
    const nodes = [{ at: start, previous: -1 }];
    const seen = new Set([key(...start)]);
    for (let i = 0; i < nodes.length; i++) {
      const { at: [cx, cy] } = nodes[i];
      if (cx === to[0] && cy === to[1]) {
        const path: Point[] = [];
        for (let at = i; at !== -1; at = nodes[at].previous) path.push(nodes[at].at);
        return path.reverse();
      }
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        const tile = key(nx, ny);
        if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height ||
            blocked(nx, ny) || seen.has(tile)) continue;
        seen.add(tile);
        nodes.push({ at: [nx, ny], previous: i });
      }
    }
    return null;
  };
}

export function guardRallyPoints(origin: Point, routes: readonly Route[], findPath: GuardPath, radius: number) {
  const points = new Map<string, Point>();
  const endpoints = new Set(routes.flatMap((route) => {
    const first = route.points[0], last = route.points[route.points.length - 1];
    return [key(...first), key(...last)];
  }));
  for (const route of routes) {
    for (let step = 1; step < route.distance; step++) {
      const { x, y } = route.at(step);
      const tile = key(x, y);
      if (!endpoints.has(tile) && !points.has(tile) &&
          dist2(...origin, x, y) <= radius ** 2 && findPath(origin, [x, y]))
        points.set(tile, [x, y]);
    }
  }
  return [...points.values()].sort((a, b) => dist2(...origin, ...a) - dist2(...origin, ...b));
}

function newGuard(post: GuardPost, health: number, time = 0): Guard {
  const [x, y] = post.origin;
  return { x, y, hp: health, target: null, respawnAt: 0, nextStrike: 0, nextThrow: 0,
    attack: undefined, contactAt: undefined, hurtAt: -Infinity, combatAt: time, healedAt: undefined,
    recoil: [0, 0], walk: 0, movedAt: -Infinity, facing: 1, path: post.findPath(post.origin, post.rally) ?? [],
    flight: isFlyingGuardPost(post.type) ? { height: 1, landedAt: -Infinity } : undefined,
    braceReadyAt: undefined, braceAt: undefined, sharedBraceUntil: undefined, nextBraceShare: undefined,
    patrolReadyAt: undefined, patrolTarget: undefined, fusion: undefined };
}

export function createGuardPost(index: number, origin: Point, rally: Point, findPath: GuardPath,
  type: GuardPostId = "guard-post", canLand?: GuardPost["canLand"], builtAt?: number): GuardPost {
  const { health, squad } = GUARD_BUILDINGS[type].base;
  const post: GuardPost = { type, index, origin, rally, guards: [], findPath, canLand, tier: 1, builtAt };
  for (let i = 0; i < squad; i++) post.guards.push(newGuard(post, health, builtAt ?? 0));
  return post;
}

function adjustGuardStats(guard: Guard, previous: GuardStats, next: GuardStats, time: number) {
  if (guard.hp > 0) guard.hp = Math.max(1, guard.hp + next.health - previous.health);
  else guard.respawnAt = time + Math.max(0, guard.respawnAt - time) * next.respawn / previous.respawn;
}

export function reinforceGuardPost(post: GuardPost, time: number, branch?: GuardBranch, wave = 0) {
  const previous = guardStats(post);
  const previousUnits = post.guards.map((guard) => guardUnitStats(post, guard));
  post.upgradeFrom = { at: time, tier: post.tier, branch: post.branch };
  post.tier = post.tier === 1 ? 2 : post.tier === 2 ? 3 : 4;
  post.branch = branch ?? post.branch;
  const next = guardStats(post);
  if (branch === "talon" || branch === "dire") {
    const [first, second] = post.guards;
    const keepSecond = second.hp > first.hp || (second.hp === 0 && second.respawnAt < first.respawnAt);
    const [merged, removed] = keepSecond ? [second, first] : [first, second];
    if (merged.hp > 0) {
      merged.hp = Math.max(1, Math.round(next.health * (merged.hp + removed.hp) / (2 * previous.health)));
      if (removed.hp > 0) merged.fusion = { from: [removed.x, removed.y], at: time };
    } else adjustGuardStats(merged, previous, next, time);
    releaseGuard(removed);
    post.guards.splice(0, post.guards.length, merged);
    return;
  }
  post.guards.forEach((guard, i) => adjustGuardStats(guard, previousUnits[i], guardUnitStats(post, guard), time));
  while (post.guards.length < next.squad) {
    const guard = newGuard(post, next.health, time);
    if (branch === "wingpair") {
      guard.recruit = { adultAfter: wave + 2, grown: false };
      guard.hp = guardUnitStats(post, guard).health;
    }
    post.guards.push(guard);
  }
}

export function matureGriffins(post: GuardPost, wave: number, time: number) {
  if (post.branch !== "wingpair") return;
  for (const guard of post.guards) {
    const recruit = guard.recruit;
    if (!recruit || recruit.grown || wave < recruit.adultAfter) continue;
    const previous = guardUnitStats(post, guard);
    recruit.grown = true;
    recruit.grownAt = time;
    adjustGuardStats(guard, previous, guardUnitStats(post, guard), time);
  }
}

export function moveGuardRally(post: GuardPost, rally: Point) {
  post.rally = rally;
  for (const guard of post.guards) {
    releaseGuard(guard);
    guard.attack = undefined;
    if (guard.hp > 0 && !guard.switchDuty) guard.path = post.findPath([guard.x, guard.y], rally) ?? [];
  }
}

export function releaseGuard(guard: Guard) {
  if (guard.target?.melee && guard.target.melee.style !== "cleave" && guard.target.melee.style !== "quake" && !guard.target.melee.hit)
    guard.target.melee = undefined;
  if (guard.extraTargets) {
    for (const extra of guard.extraTargets)
      if (extra.melee && extra.melee.style !== "cleave" && extra.melee.style !== "quake" && !extra.melee.hit) extra.melee = undefined;
    guard.extraTargets = undefined;
  }
  if (guard.attack?.kind === "thrust" && !guard.attack.released) guard.attack = undefined;
  guard.target = null;
  guard.patrolTarget = undefined;
  guard.contactAt = undefined;
}

export function guardBraceReady(guard: Guard, post: GuardPost, time: number) {
  const rule = guardStats(post).brace;
  return Boolean(rule && guard.hp > 0 && (time < (guard.sharedBraceUntil ?? 0) ||
    (guard.target && guard.target.hp > 0 && guard.contactAt !== undefined &&
      time - guard.contactAt >= rule.contact && time >= (guard.braceReadyAt ?? 0))));
}

export function strikeGuardWithMire(post: GuardPost, guard: Guard, attacker: Enemy, time: number,
  effects: Effect[], amount: number, displacement?: Point) {
  const stats = guardUnitStats(post, guard);
  const x = guard.x, y = guard.y;
  const dx = x - attacker.x, dy = y - attacker.y;
  const length = Math.hypot(dx, dy) || 1;
  guard.recoil = [dx / length, dy / length];
  guard.hp = Math.max(0, guard.hp - Math.round(amount * stats.counterFactor));
  guard.hurtAt = guard.combatAt = time;
  guard.healedAt = undefined;
  effects.push({ kind: "guard-hit", enemy: attacker.type, x, y, direction: guard.recoil,
    color: "#d1cfaa", life: .23, total: .23 });
  if (!guard.hp) {
    releaseGuard(guard);
    guard.attack = undefined;
    guard.respawnAt = time + stats.respawn;
    return;
  }
  if (!displacement) return;
  if (guardBraceReady(guard, post, time)) {
    const shared = time < (guard.sharedBraceUntil ?? 0);
    guard.braceAt = time;
    effects.push({ kind: "mire-brace", x, y, color: "#f8dd9c", life: .32, total: .32 });
    if (shared) {
      guard.sharedBraceUntil = undefined;
    } else {
      guard.braceReadyAt = time + stats.brace!.cooldown;
      if (stats.brace!.share) {
        const ally = post.guards.filter(candidate => candidate !== guard && candidate.hp > 0).sort((a, b) =>
          dist2(x, y, a.x, a.y) - dist2(x, y, b.x, b.y))[0];
        if (ally && time >= (ally.nextBraceShare ?? 0)) {
          ally.sharedBraceUntil = time + 2;
          ally.nextBraceShare = time + 8;
        }
      }
    }
    return;
  }
  releaseGuard(guard);
  // Keep displaced units on walkable mud and deck tiles along the movement.
  for (const fraction of [.25, .5, .75, 1]) {
    const nx = x + displacement[0] * fraction, ny = y + displacement[1] * fraction;
    const tile: Point = [Math.round(nx), Math.round(ny)];
    if (!post.findPath([guard.x, guard.y], tile)) break;
    guard.x = nx;
    guard.y = ny;
  }
  guard.path = post.findPath([guard.x, guard.y], post.rally) ?? [];
  guard.movedAt = time;
}

function move(guard: Guard, x: number, y: number, step: number, time: number, stop = 0) {
  const dx = x - guard.x, dy = y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= stop) return;
  const fraction = Math.min(step, distance - stop) / distance;
  guard.x += dx * fraction;
  guard.y += dy * fraction;
  guard.walk += distance * fraction;
  if (distance * fraction > 0.004) guard.movedAt = time;
  if (Math.abs(dx) > 0.08) guard.facing = dx < 0 ? -1 : 1;
}

function followGuardPath(guard: Guard, step: number, time: number) {
  const waypoint = guard.path[0];
  if (!waypoint) return false;
  move(guard, ...waypoint, step, time);
  if (dist2(guard.x, guard.y, ...waypoint) < 0.001) guard.path.shift();
  return true;
}

function canBlockBase(enemy: Enemy, post: GuardPost) {
  const spec = ENEMIES[enemy.type];
  return enemy.hp > 0 && !enemy.escaped && (!spec.boss || hasAimedBossMelee(enemy)) &&
    (isFlyingGuardPost(post.type) || !isAirborne(enemy)) && !isBurrowing(enemy) && !isInTunnel(enemy) &&
    !(spec.ability?.kind === "dash" && enemy.action?.phase === "active");
}

function unitLeash(stats: GuardStats) {
  return stats.aggro + GUARD_LEASH_PAD;
}

/** Unit-centered target acquisition: checks the individual guard's own aggro radius and rally patrol leash (independent of tower origin reach). */
function canUnitEngage(guard: Guard, enemy: Enemy, post: GuardPost, stats: GuardStats) {
  return canBlockBase(enemy, post) &&
    dist2(enemy.x, enemy.y, guard.x, guard.y) <= stats.aggro ** 2 &&
    dist2(enemy.x, enemy.y, ...post.rally) <= unitLeash(stats) ** 2;
}

/** Slightly wider hysteresis while already pursuing or fighting a claimed target so movement jitter does not drop aggro. */
function canUnitHold(guard: Guard, enemy: Enemy, post: GuardPost, stats: GuardStats) {
  return canBlockBase(enemy, post) &&
    dist2(enemy.x, enemy.y, guard.x, guard.y) <= (stats.aggro + 1.0) ** 2 &&
    dist2(enemy.x, enemy.y, ...post.rally) <= (unitLeash(stats) + 0.35) ** 2;
}

function throwTarget(guard: Guard, enemies: readonly Enemy[]) {
  let air: Enemy | undefined, ground: Enemy | undefined;
  let nearAir = SPEAR_THROW.range ** 2, nearGround: number = nearAir;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.escaped || isInTunnel(enemy)) continue;
    const distance = dist2(guard.x, guard.y, enemy.x, enemy.y);
    if (isAirborne(enemy)) {
      if (distance <= nearAir) {
        air = enemy;
        nearAir = distance;
      }
    } else if (distance >= 1.1 ** 2 && distance <= nearGround) {
      ground = enemy;
      nearGround = distance;
    }
  }
  return air ?? ground;
}

function startGuardAttack(guard: Guard, target: Enemy, kind: GuardAttack["kind"], time: number,
  pose?: GuardAttack["pose"]) {
  const dx = target.x - guard.x, dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy) || 1;
  const impact = time + (kind === "throw" ? .22 : pose === "air" ? .21 : .14);
  if (Math.abs(dx) > 0.08) guard.facing = dx < 0 ? -1 : 1;
  guard.attack = {
    kind, pose, target, direction: [dx / distance, dy / distance], start: time, impact,
    end: impact + (kind === "throw" ? 0.23 : 0.24), released: false,
  };
}

function flyTo(guard: Guard, desired: number, dt: number, time: number) {
  const flight = guard.flight;
  if (!flight) return;
  const previous = flight.height;
  flight.height = clamp(desired, previous - dt * 4.5, previous + dt * 4.8);
  if (flight.height === 0 && previous > 0) flight.landedAt = time;
}

export interface GuardQuill {
  readonly x: number;
  readonly y: number;
  readonly tx: number;
  readonly ty: number;
  readonly target: Guard;
  readonly damage: number;
  readonly impactAt: number;
  readonly enemy?: Enemy["type"];
  readonly facing?: Facing;
}

export const QUILL_FLIGHT = 0.34;

export function canReceiveQuill(guard: Guard) {
  return guard.hp > 0 && !guard.switchDuty && (guard.flight?.height ?? 0) < .48;
}

export function updateGuards(
  posts: Iterable<GuardPost>, enemies: readonly Enemy[], time: number, dt: number,
  effects: Effect[], hit: (target: Enemy, damage: number) => void,
  throwSpear: (guard: Guard, enemy: Enemy) => void,
  quills: GuardQuill[],
) {
  const roster = Array.from(posts).flatMap((post) =>
    post.guards.map((guard, i) => ({ guard, i, post, stats: guardUnitStats(post, guard) })));
  const claimed = new Set<Enemy>();
  const engaged = new Set<Enemy>();
  const release = (guard: Guard) => {
    if (guard.target) claimed.delete(guard.target);
    if (guard.extraTargets) for (const extra of guard.extraTargets) claimed.delete(extra);
    releaseGuard(guard);
  };
  const hurt = ({ guard, stats }: (typeof roster)[number], attacker: Pick<Enemy, "type" | "x" | "y">,
    damage: number, style?: MeleeStyle) => {
    guard.hp = Math.max(0, guard.hp - damage);
    guard.hurtAt = time;
    guard.combatAt = time;
    guard.healedAt = undefined;
    const dx = guard.x - attacker.x, dy = guard.y - attacker.y;
    const distance = Math.hypot(dx, dy) || 1;
    guard.recoil = [dx / distance, dy / distance];
    effects.push({ kind: "guard-hit", enemy: attacker.type, melee: style, x: guard.x, y: guard.y,
      direction: guard.recoil, airborne: (guard.flight?.height ?? 0) >= .48,
      color: !style ? "#b7eaf1" : stats.counterFactor < 1 ? "#ffe0a1" : "#ffbd91", life: 0.23, total: 0.23 });
    if (guard.hp === 0) {
      release(guard);
      guard.attack = undefined;
      guard.respawnAt = time + stats.respawn;
    }
  };

  for (let i = quills.length - 1; i >= 0; i--) {
    const shot = quills[i];
    if (time < shot.impactAt) continue;
    quills.splice(i, 1);
    effects.push({
      kind: "enemy-quill-impact",
      enemy: shot.enemy,
      x: shot.tx,
      y: shot.ty,
      color: shot.enemy === "vine-viper" ? "#9ee868" : "#b7eaf1",
      life: .3,
      total: .3,
    });
    const entry = roster.find(({ guard }) => guard === shot.target);
    if (!entry || !canReceiveQuill(entry.guard) || dist2(entry.guard.x, entry.guard.y, shot.tx, shot.ty) > .55 ** 2) continue;
    hurt(entry, { type: shot.enemy ?? "frost-porcupine", x: shot.x, y: shot.y }, Math.round(shot.damage * entry.stats.counterFactor));
  }

  for (const boss of enemies) {
    const moose = boss.type === "frost-moose";
    if (!hasAimedBossMelee(boss) || boss.hp <= 0 || boss.escaped || isStaggered(boss)) continue;
    const attack = boss.melee;
    if (attack?.aim && !attack.hit && time >= attack.impact) {
      const [x, y] = attack.aim;
      attack.hit = true;
      const radius = moose ? ANTLER_SWEEP_RADIUS : CHIEF_CLEAVE_RADIUS;
      effects.push({ kind: moose ? "antler-sweep" : "chief-cleave", enemy: boss.type, x, y,
        color: moose ? "#b1efff" : "#f0c78b", direction: attack.direction, radius, life: 0.58, total: 0.58 });
      for (const entry of roster) {
        const { guard } = entry;
        if (guard.hp > 0 && dist2(guard.x, guard.y, x, y) <= radius ** 2)
          hurt(entry, boss, guard.hp, attack.style);
      }
    }
    if (attack && time < attack.end) {
      engaged.add(boss);
      continue;
    }
    if (time < (boss.nextMeleeAt ?? 0) || (moose && boss.action)) continue;
    let nearest = (moose ? ANTLER_SWEEP_REACH : CHIEF_CLEAVE_REACH) ** 2;
    let target: Guard | undefined;
    for (const { guard } of roster) {
      if (guard.hp <= 0 || guard.switchDuty) continue;
      const distance = dist2(guard.x, guard.y, boss.x, boss.y);
      if (distance >= nearest) continue;
      nearest = distance;
      target = guard;
    }
    if (target) {
      startEnemyMelee(boss, [target.x, target.y], time);
      effects.push({ kind: "enemy-windup", enemy: boss.type, x: boss.x, y: boss.y,
        color: moose ? "#beeefa" : "#f2be77", life: 0.4, total: 0.4 });
      engaged.add(boss);
    }
  }

  for (const enemy of enemies) {
    if (enemy.type !== "frost-mammoth" || enemy.hp <= 0 || enemy.escaped || isStaggered(enemy)) continue;
    const attack = enemy.melee;
    if (attack?.style !== "quake") continue;
    if (!attack.hit && time >= attack.impact) {
      attack.hit = true;
      const power = enemyMeleeDamage(enemy, "quake");
      effects.push({
        kind: "mammoth-quake",
        enemy: enemy.type,
        x: enemy.x,
        y: enemy.y,
        color: "#a7e6f7",
        radius: MAMMOTH_QUAKE_RADIUS,
        life: 0.56,
        total: 0.56,
      });
      for (const other of roster) {
        if (other.guard.hp <= 0 || (other.guard.flight?.height ?? 0) >= 0.48 ||
            dist2(other.guard.x, other.guard.y, enemy.x, enemy.y) > MAMMOTH_QUAKE_RADIUS ** 2) continue;
        const share = other.guard === attack.targetGuard ? 1 : MAMMOTH_QUAKE_SPLASH;
        hurt(other, enemy, Math.round(power * share * other.stats.counterFactor), "quake");
      }
    }
    if (time < attack.end) engaged.add(enemy);
  }

  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.escaped || !enemy.action?.impact) continue;
    const ability = ENEMIES[enemy.type].ability;
    if (ability?.kind === "quills" && !isInTunnel(enemy)) {
      const targets = roster.filter(({ guard }) => canReceiveQuill(guard) &&
        dist2(guard.x, guard.y, enemy.x, enemy.y) <= ability.radius ** 2)
        .sort((a, b) => dist2(a.guard.x, a.guard.y, enemy.x, enemy.y) - dist2(b.guard.x, b.guard.y, enemy.x, enemy.y))
        .slice(0, ability.targets);
      const venom = enemy.type === "vine-viper";
      const first = targets[0]?.guard;
      const direction: Point | undefined = venom && first ? [first.x - enemy.x, first.y - enemy.y] : undefined;
      if (direction) enemy.quillFacing = facingFor(...direction);
      for (const { guard } of targets)
        quills.push({ x: enemy.x, y: enemy.y, tx: guard.x, ty: guard.y, target: guard,
          damage: ability.damage, impactAt: time + QUILL_FLIGHT, enemy: enemy.type, facing: enemy.quillFacing });
      effects.push({
        kind: "enemy-quill-launch",
        enemy: enemy.type,
        x: enemy.x,
        y: enemy.y,
        color: venom ? "#b6f07a" : "#c7eef3",
        direction,
        life: .26,
        total: .26,
      });
      continue;
    }
    if (ability?.kind !== "vent") continue;
    for (const entry of roster) {
      const { guard, stats } = entry;
      if (guard.hp > 0 && dist2(guard.x, guard.y, enemy.x, enemy.y) <= ability.radius ** 2)
        hurt(entry, enemy, Math.round(ability.damage * stats.counterFactor), "stomp");
    }
  }

  for (const { guard, post, stats } of roster) {
    if (!guard.target) {
      guard.extraTargets = undefined;
      continue;
    }
    if (guard.hp > 0 && canUnitHold(guard, guard.target, post, stats)) {
      claimed.add(guard.target);
      if (guard.extraTargets) {
        guard.extraTargets = guard.extraTargets.filter((extra) =>
          extra !== guard.target && canUnitHold(guard, extra, post, stats) &&
          dist2(guard.x, guard.y, extra.x, extra.y) <= 1.35 ** 2);
        for (const extra of guard.extraTargets) claimed.add(extra);
      }
    } else releaseGuard(guard);
  }
  for (const entry of roster) {
    const { i, guard, post, stats } = entry;
    if (guard.hp === 0) {
      if (time < guard.respawnAt) continue;
      Object.assign(guard, newGuard(post, stats.health, time));
    }
    if (guard.attack && time >= guard.attack.end) guard.attack = undefined;
    if (guard.switchDuty) {
      followGuardPath(guard, stats.speed * dt, time);
      continue;
    }

    const boss = enemies.find((enemy) => ENEMIES[enemy.type].boss && !hasAimedBossMelee(enemy) && !isAirborne(enemy) && enemy.hp > 0 &&
      enemy.type !== "sluice-dragon" && !enemy.escaped && dist2(guard.x, guard.y, enemy.x, enemy.y) < 0.72 ** 2);
    if (boss) {
      hurt(entry, boss, guard.hp, "stomp");
      continue;
    }

    if (guard.target && !canUnitHold(guard, guard.target, post, stats)) release(guard);
    if (!guard.target) {
      flyTo(guard, 1, dt, time);
      if (followGuardPath(guard, stats.speed * dt, time)) {
        if (!guard.attack && guard.hp < stats.health && time - Math.max(guard.hurtAt, guard.combatAt) >= GUARD_REGEN.delay) {
          guard.hp = Math.min(stats.health, guard.hp + stats.health * GUARD_REGEN.rateFraction * dt);
          guard.healedAt = time;
        }
        continue;
      }
      const offset = (i - (stats.squad - 1) / 2) * (guard.flight ? .68 : stats.squad > 3 ? .28 : .4);
      const spread: Point = [post.rally[0] + offset, post.rally[1] - offset];
      const stand = guard.flight || post.findPath(post.rally, [Math.round(spread[0]), Math.round(spread[1])]) ? spread : post.rally;
      const leash = unitLeash(stats);
      if (dist2(guard.x, guard.y, ...post.rally) <= leash ** 2) {
        let best: Enemy | null = null;
        let bestDist = Infinity;
        for (const enemy of enemies) {
          if (claimed.has(enemy) || !canUnitEngage(guard, enemy, post, stats)) continue;
          const d = Math.hypot(guard.x - enemy.x, guard.y - enemy.y);
          if (!best || d < bestDist - 0.35 || (Math.abs(d - bestDist) <= 0.35 && enemy.progress > best.progress)) {
            best = enemy;
            bestDist = d;
          }
        }
        if (best) {
          guard.target = best;
          claimed.add(best);
        }
      }
      if (!guard.target && !guard.attack) move(guard, ...stand, stats.speed * dt, time);
    }

    const target = guard.target;
    if (!target) {
      const attack = guard.attack;
      if (attack?.kind === "throw" && !attack.released) {
        guard.combatAt = time;
        const aim = attack.target;
        if (aim.hp <= 0 || aim.escaped || isInTunnel(aim)) guard.attack = undefined;
        else if (time >= attack.impact) {
          attack.released = true;
          guard.nextThrow = time + SPEAR_THROW.interval;
          throwSpear(guard, aim);
        }
      } else if (!attack && post.branch === "spear" && time >= guard.nextThrow) {
        const distant = throwTarget(guard, enemies);
        if (distant) {
          startGuardAttack(guard, distant, "throw", time);
          guard.combatAt = time;
        }
      }
      if (!guard.attack && guard.hp < stats.health && time - Math.max(guard.hurtAt, guard.combatAt) >= GUARD_REGEN.delay) {
        guard.hp = Math.min(stats.health, guard.hp + stats.health * GUARD_REGEN.rateFraction * dt);
        guard.healedAt = time;
      }
      continue;
    }
    guard.combatAt = time;
    if (guard.attack?.kind === "throw" && !guard.attack.released) guard.attack = undefined;
    const targetTile: Point = [Math.round(target.x), Math.round(target.y)];
    const route = post.findPath([guard.x, guard.y], targetTile);
    if (!route) {
      release(guard);
      continue;
    }
    const stride = stats.seekSpeed * dt * (guard.flight?.height === 0 ? .78 : 1);
    const stop = guard.flight ? .8 : .42;
    if (route.length > 2) move(guard, ...route[1], stride, time);
    else move(guard, target.x, target.y, stride, time, stop);
    const gap = dist2(guard.x, guard.y, target.x, target.y);
    const targetFlying = isAirborne(target);
    const canLand = !targetFlying && (post.canLand?.([Math.round(guard.x), Math.round(guard.y)]) ?? true);
    const attackHeight = targetFlying ? 1 : canLand ? 0 : .48;
    const pose = guard.flight ? (canLand ? "ground" : "air") : undefined;
    if (guard.flight) {
      flyTo(guard, gap <= 1.04 ** 2 ? attackHeight : 1, dt, time);
      if (guard.attack?.kind === "thrust" && !guard.attack.released && guard.attack.pose !== pose)
        guard.attack = undefined;
      if (target.melee && !target.melee.aim && target.melee.style !== "quake" && (target.melee.style === "air-strike") !== targetFlying)
        target.melee = undefined;
    }
    const inPosition = !guard.flight || guard.flight.height === attackHeight;
    if (gap > (stop + .12) ** 2 || !inPosition) {
      guard.contactAt = undefined;
      if (guard.attack?.kind === "thrust" && !guard.attack.released) guard.attack = undefined;
      if (target.melee && !target.melee.aim && target.melee.style !== "quake" && !target.melee.hit) target.melee = undefined;
      continue;
    }
    guard.contactAt ??= time;
    // Multi-block units (e.g. merged talon griffin) can pin extra nearby enemies simultaneously.
    const maxBlock = stats.block ?? 1;
    if (maxBlock > 1) {
      const extras = guard.extraTargets ?? [];
      for (const enemy of enemies) {
        if (extras.length >= maxBlock - 1) break;
        if (enemy === target || claimed.has(enemy) || !canUnitEngage(guard, enemy, post, stats)) continue;
        if (isAirborne(enemy) !== targetFlying) continue;
        if (dist2(guard.x, guard.y, enemy.x, enemy.y) > 1.35 ** 2) continue;
        extras.push(enemy);
        claimed.add(enemy);
      }
      guard.extraTargets = extras.length ? extras : undefined;
    }
    if (guard.attack?.kind === "thrust" && !guard.attack.released && time >= guard.attack.impact) {
      guard.attack.released = true;
      hit(target, stats.damage * (guard.attack.bonus ? 2 : 1));
      if (guard.attack.bonus && stats.patrol === 2) {
        const extra = enemies.find(enemy => enemy !== target && enemy.hp > 0 && !enemy.escaped &&
          !isAirborne(enemy) && !isBurrowing(enemy) && !isInTunnel(enemy) &&
          !ENEMIES[enemy.type].boss && !ENEMIES[enemy.type].miniboss && enemy.type !== "spider-egg" &&
          dist2(target.x, target.y, enemy.x, enemy.y) <= .8 ** 2);
        if (extra) hit(extra, stats.damage);
      }
      if (stats.chill && target.hp > 0) applySlow(target, stats.chill.slow, stats.chill.duration);
      if (guard.extraTargets) {
        const cleave = Math.max(1, Math.round(stats.damage * 0.35));
        for (const extra of guard.extraTargets) {
          if (extra.hp > 0) {
            hit(extra, cleave);
            if (stats.chill && extra.hp > 0) applySlow(extra, stats.chill.slow, stats.chill.duration);
          }
        }
      }
      effects.push({ kind: "guard-strike", post: post.type, x: target.x, y: target.y, direction: guard.attack.direction,
        airborne: targetFlying, color: post.type === "griffin-roost" ? "#c7e6ff"
          : post.type === "frost-kennel" ? "#9eeeff"
          : post.branch === "spear" ? "#fff0b5" : "#dce8bc", life: 0.18, total: 0.18 });
    } else if (!guard.attack && time >= guard.nextStrike) {
      if (stats.patrol && guard.patrolTarget !== target && time >= (guard.patrolReadyAt ?? 0)) {
        move(guard, target.x, target.y, .5, time, .22);
        startGuardAttack(guard, target, "thrust", time, pose);
        guard.attack!.bonus = true;
        guard.patrolReadyAt = time + 6;
      } else startGuardAttack(guard, target, "thrust", time, pose);
      if (stats.patrol) guard.patrolTarget = target;
      guard.nextStrike = time + stats.strikeInterval;
    }
    if (target.hp <= 0) {
      const nextPrimary = guard.extraTargets?.find((extra) => extra.hp > 0 && canUnitHold(guard, extra, post, stats));
      if (nextPrimary) {
        claimed.delete(target);
        guard.target = nextPrimary;
        guard.extraTargets = guard.extraTargets?.filter((extra) => extra !== nextPrimary);
      } else {
        release(guard);
      }
      continue;
    }
    const ability = ENEMIES[target.type].ability;
    if (hasAimedBossMelee(target) || isStaggered(target) || target.type === "spider-egg" ||
        (target.mireCast && target.type !== "shield-crayfish") ||
        (ability?.kind === "burrow" && target.action?.phase === "windup") ||
        ((ability?.kind === "vent" || ability?.kind === "quills") && target.action))
      continue;
    if (time >= Math.max(guard.contactAt + 0.3, target.nextMeleeAt ?? 0)) {
      startEnemyMelee(target, [guard.x, guard.y], time, guard);
      if (target.melee?.style === "quake") {
        effects.push({ kind: "enemy-windup", enemy: target.type, x: target.x, y: target.y,
          color: "#a7e6f7", life: 0.44, total: 0.44 });
        engaged.add(target);
      }
    }
    const attack = target.melee;
    if (!attack || attack.style === "quake" || attack.hit || time < attack.impact) continue;
    attack.hit = true;
    const power = enemyMeleeDamage(target, attack.style);
    hurt(entry, target, Math.round(power * stats.counterFactor), attack.style);
    if (attack.style === "surge") {
      effects.push({ kind: "weir-surge", enemy: target.type, x: target.x, y: target.y,
        color: "#acdcca", radius: WEIR_SURGE_RADIUS, life: 0.51, total: 0.51 });
      for (const other of roster) {
        if (other.guard === guard || other.guard.hp <= 0 ||
            dist2(other.guard.x, other.guard.y, target.x, target.y) > WEIR_SURGE_RADIUS ** 2) continue;
        hurt(other, target, Math.round(power * 0.5 * other.stats.counterFactor), attack.style);
      }
    }
  }
  for (const { guard, post, stats } of roster) {
    if (guard.contactAt !== undefined && guard.target && !hasAimedBossMelee(guard.target) &&
        canUnitHold(guard, guard.target, post, stats)) {
      engaged.add(guard.target);
      if (guard.extraTargets) {
        for (const extra of guard.extraTargets)
          if (!hasAimedBossMelee(extra) && canUnitHold(guard, extra, post, stats)) engaged.add(extra);
      }
    }
  }
  return engaged;
}
