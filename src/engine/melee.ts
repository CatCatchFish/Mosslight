import { ENEMIES } from "../content/enemies.ts";
import { isAirborne } from "./enemy-abilities.ts";
import { facingFor } from "./formation.ts";
import type { Guard } from "./guards.ts";
import type { Enemy, EnemyId, MeleeStyle, Point } from "./types.ts";

const styles = {
  "air-strike": { windup: .23, recovery: .3, interval: .96 },
  bite: { windup: 0.22, recovery: 0.26, interval: 0.9 },
  pounce: { windup: 0.27, recovery: 0.29, interval: 0.92 },
  claw: { windup: 0.25, recovery: 0.27, interval: 0.92 },
  stomp: { windup: 0.35, recovery: 0.34, interval: 1.04 },
  surge: { windup: 0.52, recovery: 0.42, interval: 1.35 },
  quake: { windup: 0.78, recovery: 0.48, interval: 1.45 },
  cleave: { windup: 0.9, recovery: 0.55, interval: 6.95 }, // 5.5 seconds from the end of recovery
  "antler-sweep": { windup: 0.78, recovery: 0.52, interval: 3.5 },
} as const;

const enemyStyles: Partial<Record<EnemyId, MeleeStyle>> = {
  slime: "pounce", "pine-hopper": "pounce", "weir-frog": "pounce", "ice-sail": "pounce",
  "reed-crab": "claw", guard: "claw", "lamp-mole": "claw",
  "lily-skater": "claw", "magnet-beetle": "stomp", "cable-overseer": "stomp", "slag-colossus": "stomp",
  "pine-boar": "stomp", "lotus-toad": "pounce", "slag-driller": "stomp", "frost-mammoth": "stomp",
  "frost-bear": "stomp", "frost-yeti": "stomp", "rime-golem": "stomp", "blizzard-elk": "stomp",
  "mirror-ibex": "stomp", "snowbrush-fox": "pounce",
  "reed-newt": "pounce", "ore-crawler": "claw", "frost-hare": "pounce",
  ram: "stomp", "stump-spirit": "stomp", "slag-cart": "stomp", "ferry-snail": "stomp",
  "moss-badger": "claw", "mirror-shrimp": "claw", "rivet-mite": "stomp", "frost-porcupine": "pounce",
  "mire-treant": "claw", "mire-croc": "bite", "vine-viper": "bite", "mire-mycelid": "stomp",
  "mire-elder": "stomp", "mire-matriarch": "stomp", "spore-pod": "pounce",
};

export const WEIR_SURGE_RADIUS = 1.35;
export const MAMMOTH_QUAKE_RADIUS = 1.55;
export const MAMMOTH_QUAKE_COOLDOWN = 4.8;
export const MAMMOTH_QUAKE_SPLASH = 0.8;
export const CHIEF_CLEAVE_REACH = 0.85;
export const CHIEF_CLEAVE_RADIUS = 0.8;
export const ANTLER_SWEEP_REACH = 1.14;
export const ANTLER_SWEEP_RADIUS = 0.9;

export function hasAimedBossMelee(enemy: Enemy) {
  return enemy.type === "chief" || enemy.type === "frost-moose";
}

export function startEnemyMelee(enemy: Enemy, [x, y]: Point, time: number, targetGuard?: Guard) {
  const quakeReady = enemy.type === "frost-mammoth" && (enemy.nextQuakeAt === undefined || time >= enemy.nextQuakeAt);
  const style: MeleeStyle = enemy.type === "chief" ? "cleave"
    : enemy.type === "frost-moose" ? "antler-sweep" : quakeReady ? "quake"
    : enemy.type === "weir-turtle" && enemy.action?.phase !== "exposed" ? "surge"
    : isAirborne(enemy) ? "air-strike" : enemyStyles[enemy.type] ?? "bite";
  const timing = styles[style];
  const dx = x - enemy.x, dy = y - enemy.y;
  const distance = Math.hypot(dx, dy);
  const impact = time + timing.windup;
  enemy.melee = {
    style, start: time, impact, end: impact + timing.recovery, hit: false,
    direction: distance ? [dx / distance, dy / distance] : [0, 0],
    facing: distance === 0 ? enemy.facing : facingFor(dx, dy),
    ...(style === "cleave" || style === "antler-sweep" ? { aim: [x, y] as Point } : {}),
    ...(targetGuard ? { targetGuard } : {}),
  };
  enemy.nextMeleeAt = time + timing.interval;
  if (style === "quake") enemy.nextQuakeAt = time + MAMMOTH_QUAKE_COOLDOWN;
}

export function enemyMeleeDamage(enemy: Enemy, style: MeleeStyle) {
  const spec = ENEMIES[enemy.type];
  if (style === "surge") return 60;
  if (style === "quake") return 92;
  if (enemy.type === "frost-mammoth") return 68;
  if (enemy.type === "mire-matriarch") return 76;
  return spec.miniboss ? 62 : spec.armored ? 22 : 12 + 2 * spec.leak;
}
