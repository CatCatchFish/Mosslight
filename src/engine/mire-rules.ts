import { ENEMIES } from "../content/enemies.ts";
import { isAirborne, isStaggered } from "./enemy-abilities.ts";
import { facingFor } from "./formation.ts";
import { strikeGuardWithMire } from "./guards.ts";
import type { GuardPost } from "./guards.ts";
import { dist2, isInTunnel, key } from "./route.ts";
import type { Effect, Enemy, Point, Route, TowerStats } from "./types.ts";

const SKILLS = {
  mudskipper: { windup: .35, active: .42, recovery: .35, cooldown: 6, distance: 1.4 },
  crayfish: { duration: 3, cooldown: 7 },
  moth: { duration: 1.6, cooldown: 9, distance: 1.8 },
  catfish: { windup: .7, cooldown: 6.5, radius: 1.8, damage: 32, distance: .8 },
  clam: { windup: .75, closed: 2, open: 2.8, cooldown: 6.5, radius: 1.6 },
  spider: { windup: .8, hatch: 4, cooldown: 8 },
  dragon: { windup: 1, echo: .9, front: .55, exposure: 2.5, cooldown: 8.5, length: 5 },
} as const;

export const MIRE_SKILL_ENEMIES = new Set<Enemy["type"]>([
  "mudskipper", "shield-crayfish", "lantern-moth", "whisker-catfish", "stone-clam", "reed-spider", "spider-egg", "sluice-dragon",
]);

export function mireArmor(enemy: Enemy) {
  if (mireBossState(enemy) === "open") return 1;
  const base = ENEMIES[enemy.type].armorFactor ?? 1;
  let salt = 0;
  for (const [amount, until] of enemy.salt ?? []) {
    if (enemy.age < until) salt = Math.max(salt, amount);
    else enemy.salt!.delete(amount);
  }
  return Math.min(1, base + salt);
}

export function applySalt(enemy: Enemy, salt: NonNullable<TowerStats["salt"]>) {
  if (!ENEMIES[enemy.type].armored) return;
  enemy.salt ??= new Map();
  enemy.salt.set(salt.armor, Math.max(enemy.salt.get(salt.armor) ?? 0, enemy.age + salt.duration));
}

export function mireDamageFactor(enemy: Enemy, directFrom?: Point) {
  const attack = enemy.mireCast;
  if (!attack) return 1;
  const elapsed = enemy.age - attack.startedAt;
  if (enemy.type === "sluice-dragon") return mireBossState(enemy) === "open" ? 1.25 : 1;
  if (enemy.type === "stone-clam") {
    const { windup, closed } = SKILLS.clam;
    if (elapsed < windup) return 1;
    return elapsed < windup + closed ? .55 : 1.25;
  }
  if (enemy.type === "shield-crayfish" && attack.direction && directFrom) {
    const dx = directFrom[0] - enemy.x, dy = directFrom[1] - enemy.y;
    const cosine = (attack.direction[0] * dx + attack.direction[1] * dy) / (Math.hypot(dx, dy) || 1);
    return cosine >= Math.cos(50 * Math.PI / 180) ? .70 : 1;
  }
  return 1;
}

export function raiseMudShield(enemy: Enemy, source: Point) {
  if (enemy.type !== "shield-crayfish" || enemy.mireCast || enemy.age < (enemy.mireReadyAt ?? 0) || isStaggered(enemy)) return;
  const dx = source[0] - enemy.x, dy = source[1] - enemy.y;
  const distance = Math.hypot(dx, dy);
  if (!distance) return;
  enemy.mireCast = { startedAt: enemy.age, direction: [dx / distance, dy / distance] };
}

export function mireBossState(enemy: Enemy) {
  if (enemy.type !== "sluice-dragon" || !enemy.mireCast) return undefined;
  const elapsed = enemy.age - enemy.mireCast.startedAt;
  if (elapsed < SKILLS.dragon.windup) return "windup";
  if (elapsed < SKILLS.dragon.windup + SKILLS.dragon.exposure) return "open";
  return undefined;
}

export function mireAdvance(enemy: Enemy, dt: number, usual: number, held: boolean) {
  if (held || enemy.carriedBy || enemy.type === "spider-egg") return 0;
  const attack = enemy.mireCast;
  if (!attack) return usual;
  const elapsed = enemy.age - attack.startedAt;
  switch (enemy.type) {
    case "mudskipper": {
      const { windup, active, distance } = SKILLS.mudskipper;
      if (elapsed < windup) return 0;
      if (elapsed >= windup + active) return usual * .45;
      const running = Math.min(active, elapsed - windup);
      return distance / active * Math.min(running, dt);
    }
    case "stone-clam": return elapsed < SKILLS.clam.windup + SKILLS.clam.closed ? 0 : usual;
    case "whisker-catfish": case "reed-spider": return 0;
    case "lantern-moth": return Math.min(usual, SKILLS.moth.distance / SKILLS.moth.duration * dt);
    case "sluice-dragon": return elapsed < SKILLS.dragon.windup ? 0 : usual;
    default: return usual;
  }
}

function moveTo(enemy: Enemy, progress: number) {
  const at = enemy.route.at(progress, enemy.lateral);
  if (dist2(enemy.x, enemy.y, at.x, at.y) > 1e-8) enemy.facing = facingFor(at.x - enemy.x, at.y - enemy.y);
  enemy.progress = progress;
  Object.assign(enemy, at);
}

export function syncMirePassenger(carrier: Enemy) {
  const cast = carrier.mireCast;
  if (!cast?.passenger || cast.passenger.carriedBy !== carrier) return;
  const passenger = cast.passenger;
  const start = cast.origin!;
  moveTo(passenger, Math.max(passenger.progress, Math.min(carrier.progress, start + SKILLS.moth.distance,
    passenger.route.distance - .01)));
}

export function dropMirePassenger(carrier: Enemy) {
  const passenger = carrier.mireCast?.passenger;
  if (passenger?.carriedBy !== carrier) return;
  syncMirePassenger(carrier);
  passenger.carriedBy = undefined;
}

function section(route: Route, from: number, to: number): Point[] {
  const at = (progress: number): Point => {
    const { x, y } = route.at(progress);
    return [x, y];
  };
  return [at(from), ...route.segments.filter(segment => from < segment.from && segment.from < to).map(segment => segment.start), at(to)];
}

function insideTide(x: number, y: number, path: readonly Point[]) {
  return path.slice(1).some(([tx, ty], index) => {
    const [sx, sy] = path[index];
    return dist2(x, y, Math.max(Math.min(sx, tx), Math.min(Math.max(sx, tx), x)),
      Math.max(Math.min(sy, ty), Math.min(Math.max(sy, ty), y))) <= .65 ** 2;
  });
}

interface MireBattle {
  readonly enemies: readonly Enemy[];
  readonly posts: Iterable<GuardPost>;
  readonly routes: readonly Route[];
  readonly shallows: ReadonlySet<string>;
  readonly effects: Effect[];
  readonly time: number;
  spawn(type: Enemy["type"], parent: Enemy, progress: number, lateral: number): Enemy;
}

export function stepMireSkills(battle: MireBattle, dt: number) {
  const { enemies, posts, routes, shallows, time, effects, spawn } = battle;
  const units = Array.from(posts).flatMap(post => post.guards.map(guard => ({ post, guard })));
  const onGround = () => units.filter(({ guard }) => guard.hp > 0 && (guard.flight?.height ?? 0) < .48);
  const living = (enemy: Enemy) => enemy.hp > 0 && !enemy.escaped;
  const cue = (enemy: Enemy, kind: Effect["kind"], life: number, details: Partial<Effect> = {}) => {
    effects.push({ kind, enemy: enemy.type, x: enemy.x, y: enemy.y, color: ENEMIES[enemy.type].color,
      life, total: life, ...details });
  };
  const finish = (enemy: Enemy, cooldown: number) => {
    dropMirePassenger(enemy);
    enemy.mireCast = undefined;
    enemy.mireReadyAt = enemy.age + cooldown;
  };
  const engage = (enemy: Enemy) => units.some(({ guard }) =>
    guard.hp > 0 && guard.contactAt !== undefined && guard.target === enemy);
  for (const enemy of [...enemies]) {
    if (!living(enemy)) {
      dropMirePassenger(enemy);
      continue;
    }
    if (enemy.carriedBy || isInTunnel(enemy)) continue;
    if (isStaggered(enemy) && enemy.type !== "spider-egg") {
      if (enemy.mireCast) finish(enemy, enemy.type === "lantern-moth" ? SKILLS.moth.cooldown
        : enemy.type === "shield-crayfish" ? SKILLS.crayfish.cooldown : SKILLS.mudskipper.cooldown);
      continue;
    }
    const cast = enemy.mireCast;
    const elapsed = cast ? enemy.age - cast.startedAt : 0;
    const crossed = (threshold: number) => elapsed >= threshold && elapsed - dt < threshold;
    const ready = !cast && enemy.age >= (enemy.mireReadyAt ?? 1.5) && !(enemy.melee && time < enemy.melee.end);
    if (enemy.type === "mudskipper") {
      const { windup, active, recovery, cooldown } = SKILLS.mudskipper;
      if (cast && (engage(enemy) || elapsed >= windup + active + recovery)) {
        finish(enemy, cooldown);
      } else if (cast && crossed(windup + active)) {
        cue(enemy, "enemy-splash", .35);
      } else if (ready && shallows.has(key(Math.round(enemy.x), Math.round(enemy.y))) && !engage(enemy)) {
        enemy.mireCast = { startedAt: enemy.age };
        cue(enemy, "enemy-windup", windup);
      }
    } else if (enemy.type === "shield-crayfish") {
      if (cast && elapsed >= SKILLS.crayfish.duration) finish(enemy, SKILLS.crayfish.cooldown);
    } else if (enemy.type === "lantern-moth") {
      if (cast && (elapsed >= SKILLS.moth.duration || !isAirborne(enemy) || !living(cast.passenger!) ||
          cast.passenger!.progress >= cast.origin! + SKILLS.moth.distance - 1e-6)) {
        finish(enemy, SKILLS.moth.cooldown);
        cue(enemy, "enemy-splash", .32);
      } else if (ready && isAirborne(enemy)) {
        const passenger = enemies.find(other => other.type === "mudskipper" && living(other) &&
          other.route === enemy.route && !other.carriedBy && !engage(other) &&
          Math.abs(other.progress - enemy.progress) <= .72);
        if (passenger) {
          passenger.mireCast = undefined;
          passenger.mireReadyAt = passenger.age + SKILLS.mudskipper.cooldown;
          passenger.carriedBy = enemy;
          enemy.mireCast = { startedAt: enemy.age, passenger, origin: passenger.progress };
          cue(enemy, "enemy-rally", .32, { radius: .8 });
        }
      }
    } else if (enemy.type === "whisker-catfish") {
      const { windup, cooldown, radius, damage, distance } = SKILLS.catfish;
      const nearby = (x: number, y: number) => onGround().filter(({ guard }) =>
        dist2(guard.x, guard.y, x, y) <= radius ** 2).sort((a, b) =>
        dist2(a.guard.x, a.guard.y, x, y) - dist2(b.guard.x, b.guard.y, x, y));
      if (cast && elapsed >= windup) {
        const [x, y] = cast.aim!;
        for (const { post, guard } of nearby(x, y).slice(0, 2)) {
          const dx = x - guard.x, dy = y - guard.y;
          const length = Math.hypot(dx, dy) || 1;
          strikeGuardWithMire(post, guard, enemy, time, effects, damage, [dx * distance / length, dy * distance / length]);
        }
        cue(enemy, "mire-drag", .42, { radius, direction: cast.direction });
        finish(enemy, cooldown);
      } else if (ready && nearby(enemy.x, enemy.y).length) {
        const { guard } = nearby(enemy.x, enemy.y)[0];
        enemy.mireCast = { startedAt: enemy.age, aim: [enemy.x, enemy.y], direction: [guard.x - enemy.x, guard.y - enemy.y] };
        cue(enemy, "mire-drag", windup, { radius });
      }
    } else if (enemy.type === "stone-clam") {
      const { windup, closed, open, cooldown, radius } = SKILLS.clam;
      if (cast && elapsed >= windup + closed + open) {
        finish(enemy, cooldown);
      } else if (cast && crossed(windup + closed)) {
        const [dx, dy] = cast.direction!;
        for (const { post, guard } of onGround()) {
          const gx = guard.x - enemy.x, gy = guard.y - enemy.y;
          if (gx * dx + gy * dy >= -.12 && dist2(guard.x, guard.y, enemy.x, enemy.y) <= radius ** 2)
            strikeGuardWithMire(post, guard, enemy, time, effects, 26);
        }
        cue(enemy, "mire-shell", .50, { radius, direction: cast.direction });
      } else if (ready && (enemy.hp < enemy.maxHp && enemy.hurtAgo < .4 || engage(enemy))) {
        const { x, y } = enemy.route.at(enemy.progress + .3);
        const length = Math.hypot(x - enemy.x, y - enemy.y) || 1;
        enemy.mireCast = { startedAt: enemy.age, direction: [(x - enemy.x) / length, (y - enemy.y) / length] };
        cue(enemy, "mire-shell-warning", windup + closed, { radius, direction: enemy.mireCast.direction });
      }
    } else if (enemy.type === "reed-spider") {
      const { windup, cooldown } = SKILLS.spider;
      if (cast && elapsed >= windup) {
        enemy.egg = spawn("spider-egg", enemy, Math.max(0, enemy.progress - 1.25), 0);
        finish(enemy, cooldown);
      } else if (ready && enemy.progress > 2.3 && (!enemy.egg || !living(enemy.egg))) {
        enemy.mireCast = { startedAt: enemy.age };
        cue(enemy, "enemy-windup", windup);
      }
    } else if (enemy.type === "spider-egg") {
      if (enemy.age < SKILLS.spider.hatch) continue;
      enemy.escaped = true;
      cue(enemy, "mire-hatch", .5, { radius: .7 });
      spawn("reed-spiderling", enemy, enemy.progress, -.25);
      spawn("reed-spiderling", enemy, enemy.progress, .25);
    } else if (enemy.type === "sluice-dragon") {
      const { windup, echo, front, exposure, cooldown, length } = SKILLS.dragon;
      const half = enemy.hp <= enemy.maxHp / 2;
      if (half && !enemy.mireFractured) {
        enemy.mireFractured = true;
        cue(enemy, "mire-tide-break", 1.2);
        const nextLane = routes.find(route => route !== enemy.route);
        if (nextLane) {
          const [x, y] = nextLane.points[0];
          cue(enemy, "mire-tide-warning", 1.2, { x, y, pathPoints: section(nextLane, .25, 2.25) });
        }
        enemy.mireReadyAt = enemy.age + 1.2;
      }
      if (cast && elapsed >= windup + exposure) {
        const firstBrokenCast = half && cast.lanes!.length === 1 && routes.some(route => route !== enemy.route);
        const retry = firstBrokenCast ? Math.max(0, (enemy.mireReadyAt ?? 0) - enemy.age) : cooldown - exposure;
        finish(enemy, retry);
      } else if (cast) {
        for (const [index, lane] of cast.lanes!.entries()) {
          const arrival = windup + (index ? echo : 0);
          if (index && crossed(arrival - 1.2))
            cue(enemy, "mire-tide-warning", 1.2, { pathPoints: section(lane.route, lane.from, lane.to) });
          if (crossed(arrival)) {
            const [x, y] = section(lane.route, lane.from, lane.to)[0];
            cue(enemy, "mire-tide", front, { x, y, pathPoints: section(lane.route, lane.from, lane.to) });
          }
          const sweep = elapsed - arrival;
          if (sweep < 0 || sweep - dt >= front) continue;
          const fraction = (t: number) => lane.from + (lane.to - lane.from) * Math.max(0, Math.min(t / front, 1));
          const path = section(lane.route, fraction(sweep - dt), fraction(sweep));
          const at = fraction(sweep);
          const a = lane.route.at(Math.max(lane.from, at - .02));
          const b = lane.route.at(Math.min(lane.to, at + .02));
          const dx = b.x - a.x, dy = b.y - a.y;
          const norm = Math.hypot(dx, dy) || 1;
          const scale = index ? .7 : 1;
          for (const { post, guard } of onGround()) {
            if (cast.struck!.has(guard) || !insideTide(guard.x, guard.y, path)) continue;
            cast.struck!.add(guard);
            strikeGuardWithMire(post, guard, enemy, time, effects, 44 * scale,
              [1.1 * scale * dx / norm, 1.1 * scale * dy / norm]);
          }
        }
      } else if (ready && enemy.age >= (enemy.mireReadyAt ?? 0)) {
        const from = enemy.progress;
        const lanes = [{ route: enemy.route, from, to: Math.min(from + length, enemy.route.distance) }];
        const other = routes.find(route => route !== enemy.route);
        if (half && other) {
          const start = Math.max(0, Math.min(other.distance - length - 3, other.distance - (enemy.route.distance - from)));
          lanes.push({ route: other, from: start, to: Math.min(start + length, other.distance) });
        }
        enemy.mireCast = { startedAt: enemy.age, lanes, struck: new Set() };
        cue(enemy, "mire-tide-warning", windup, { pathPoints: section(enemy.route, from, lanes[0].to) });
      }
    }
  }
}
