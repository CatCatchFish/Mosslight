import { isAirborne, isBurrowing } from "./enemy-abilities.ts";
import { clamp, dist2, isInTunnel } from "./route.ts";
import type { Enemy, Point } from "./types.ts";

export type BattlefieldDevice = { readonly at: Point; readonly cooldownGroup?: string } & (
  | { readonly kind: "sluice"; readonly center: Point }
  | { readonly kind: "sun-mirror"; readonly center: Point; readonly label: string }
  | { readonly kind: "mire-boom"; readonly center: Point }
  | { readonly kind: "mire-beacon"; readonly center: Point; readonly label?: string }
  | { readonly kind: "mire-backwash"; readonly from: Point; readonly to: Point; readonly label?: string }
  | { readonly kind: "rail-cart"; readonly from: Point; readonly to: Point }
  | { readonly kind: "log-roll"; readonly from: Point; readonly to: Point }
);

export const DEVICES = {
  sluice: { name: "浅滩水闸", duration: 5, cooldown: 15, radius: 2.6, pace: 0.52 },
  "rail-cart": { name: "运矿绞盘", duration: 1.9, cooldown: 16, radius: 0.84, damage: 88, armorBonus: 1.55 },
  "log-roll": { name: "伐木滚木", duration: 1.5, cooldown: 16, radius: 0.9, damage: 46, stagger: 1.5 },
  "sun-mirror": { name: "日轮镜阵", duration: 0.8, cooldown: 15, radius: 2.7, exposure: 4, multiplier: 1.35 },
  "mire-boom": { name: "沉木拦栅", duration: 3.4, cooldown: 14, radius: 1.85, capacity: 4 },
  "mire-backwash": { name: "倒潮闸", duration: 1.35, cooldown: 17, radius: 1.1, retreat: 2.4, stagger: .35 },
  "mire-beacon": { name: "引灯信标", duration: 5.5, cooldown: 16, radius: 3.1 },
} as const;

export interface DeviceState {
  readonly spec: BattlefieldDevice;
  usedAt: number;
  readonly struck: Set<Enemy>;
}

type SweepingDevice = Extract<BattlefieldDevice, { from: Point }>;

export function deviceSweepPosition(
  spec: SweepingDevice,
  elapsed: number,
): Point {
  const t = clamp(elapsed / DEVICES[spec.kind].duration, 0, 1);
  return [spec.from[0] + (spec.to[0] - spec.from[0]) * t, spec.from[1] + (spec.to[1] - spec.from[1]) * t];
}

export function devicePace(devices: readonly DeviceState[], enemy: Enemy, time: number) {
  if (!devices.length || isAirborne(enemy)) return 1;
  const { duration, radius, pace } = DEVICES.sluice;
  return devices.some(({ spec, usedAt }) =>
    spec.kind === "sluice" && time - usedAt < duration &&
    dist2(enemy.x, enemy.y, ...spec.center) <= radius ** 2) ? pace : 1;
}

export function boomHolds(devices: readonly DeviceState[], enemy: Enemy, time: number) {
  const rule = DEVICES["mire-boom"];
  for (const { spec, usedAt, struck } of devices) {
    if (spec.kind !== "mire-boom" || time - usedAt >= rule.duration ||
        dist2(enemy.x, enemy.y, ...spec.center) > rule.radius ** 2) continue;
    if (enemy.type === "spider-egg" || isAirborne(enemy) || isBurrowing(enemy) || isInTunnel(enemy)) return false;
    if (struck.has(enemy)) return true;
    if (struck.size >= rule.capacity) continue;
    struck.add(enemy);
    return true;
  }
  return false;
}

export function deviceSweepHits(devices: readonly DeviceState[], enemies: readonly Enemy[], time: number, dt: number) {
  const hits: { enemy: Enemy; kind: SweepingDevice["kind"] }[] = [];
  for (const { spec, usedAt, struck } of devices) {
    if (!("from" in spec)) continue;
    const { duration, radius } = DEVICES[spec.kind];
    const elapsed = time - usedAt;
    if (elapsed - dt >= duration) continue;
    const [x, y] = deviceSweepPosition(spec, elapsed - dt);
    const [tx, ty] = deviceSweepPosition(spec, elapsed);
    const dx = tx - x, dy = ty - y;
    const length = dx * dx + dy * dy || 1;
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.escaped || isAirborne(enemy) || struck.has(enemy)) continue;
      const t = clamp(((enemy.x - x) * dx + (enemy.y - y) * dy) / length, 0, 1);
      if (dist2(enemy.x, enemy.y, x + t * dx, y + t * dy) > radius ** 2) continue;
      struck.add(enemy);
      hits.push({ enemy, kind: spec.kind });
    }
  }
  return hits;
}

export function beaconTargets(devices: readonly DeviceState[], enemies: readonly Enemy[], time: number) {
  const { duration, radius } = DEVICES["mire-beacon"];
  const active = devices.flatMap(({ spec, usedAt }) =>
    spec.kind === "mire-beacon" && time - usedAt < duration ? [spec.center] : []);
  if (!active.length) return;
  return new Set(enemies.filter(enemy => enemy.hp > 0 && !enemy.escaped && !isInTunnel(enemy) &&
    active.some(center => dist2(enemy.x, enemy.y, ...center) <= radius ** 2)));
}
