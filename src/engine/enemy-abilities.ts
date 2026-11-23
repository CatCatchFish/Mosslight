import { ENEMIES } from "../content/enemies.ts";
import { dist2 } from "./route.ts";
import type { Effect, Enemy, EnemyAbility } from "./types.ts";

export const MIN_ENEMY_PACE = 0.50;
export const MIN_BOSS_PACE = 0.75;

export function applySlow(enemy: Enemy, multiplier: number, duration: number) {
  const resistance = ENEMIES[enemy.type].slowResistance ?? 0;
  const pace = 1 - (1 - multiplier) * (1 - resistance);
  enemy.slows.set(pace, Math.max(enemy.slows.get(pace) ?? 0, enemy.age + duration));
}

function guardPosition(enemy: Enemy, ability: Extract<EnemyAbility, { kind: "guard-cycle" }>) {
  return enemy.age % (ability.closed + ability.cooldown) - ability.closed;
}

function cyclePosition(enemy: Enemy, ability: { cooldown: number; initialDelay?: number }, duration: number) {
  const sinceReady = enemy.age - (enemy.abilityReadyAt ?? ability.initialDelay ?? ability.cooldown);
  if (sinceReady < 0) return sinceReady;
  const period = duration + ability.cooldown;
  const elapsed = sinceReady % period;
  return elapsed < duration ? elapsed : elapsed - period;
}

function wingPosition(enemy: Enemy, ability: Extract<EnemyAbility, { kind: "wing-cycle" }>) {
  return cyclePosition(enemy, ability, ability.opening + ability.flight);
}

export const NET_IMMUNITY = 2.25;

export function isNetted(enemy: Enemy) {
  return enemy.age < (enemy.netUntil ?? 0);
}

export function isAirborne(enemy: Enemy) {
  const spec = ENEMIES[enemy.type];
  return !isNetted(enemy) &&
    (Boolean(enemy.carriedBy) || spec.airborne === true || (spec.ability?.kind === "wing-cycle" && enemy.action?.phase === "active"));
}

export function canNet(enemy: Enemy) {
  const { boss, miniboss } = ENEMIES[enemy.type];
  return !boss && !miniboss && !enemy.carriedBy && enemy.age >= (enemy.netImmuneUntil ?? 0) && isAirborne(enemy);
}

export function groundWithNet(enemy: Enemy, seconds: number) {
  if (!canNet(enemy)) return;
  enemy.netUntil = enemy.age + seconds;
  enemy.netImmuneUntil = enemy.netUntil + NET_IMMUNITY;
}

export function isBurrowing(enemy: Enemy) {
  return ENEMIES[enemy.type].ability?.kind === "burrow" && enemy.action?.phase === "active";
}

function activeTurnBurst(enemy: Enemy) {
  const ability = ENEMIES[enemy.type].ability;
  return ability?.kind === "glide" && enemy.age < (enemy.turnBurstUntil ?? 0) ? ability.turnBurst : undefined;
}

export function enemyTurned(enemy: Enemy, effects: Effect[]) {
  const ability = ENEMIES[enemy.type].ability;
  if (ability?.kind !== "glide") return;
  enemy.turnAt = enemy.age;
  const burst = ability.turnBurst;
  if (!burst || enemy.age < (enemy.abilityReadyAt ?? 0)) return;
  enemy.turnBurstUntil = enemy.age + burst.duration;
  enemy.abilityReadyAt = enemy.turnBurstUntil + burst.cooldown;
  effects.push({ kind: "enemy-splash", enemy: enemy.type, x: enemy.x, y: enemy.y,
    color: "#a7eed3", life: 0.45, total: 0.45 });
}

export function interruptVent(enemy: Enemy, effects: Effect[]) {
  const ability = ENEMIES[enemy.type].ability;
  if (ability?.kind !== "vent" || enemy.action?.phase !== "windup" || enemy.hp <= 0) return;
  enemy.action = undefined;
  enemy.triggeredAbilityStartedAt = undefined;
  enemy.iceTargets = undefined;
  enemy.abilityReadyAt = enemy.age + ability.cooldown;
  effects.push({ kind: "enemy-vent-stop", enemy: enemy.type, x: enemy.x, y: enemy.y,
    color: "#bbebf2", life: 0.5, total: 0.5 });
}

export function isStaggered(enemy: Enemy) {
  return enemy.age < (enemy.staggeredUntil ?? 0);
}

export function staggerEnemy(enemy: Enemy, seconds: number) {
  const ability = ENEMIES[enemy.type].ability;
  enemy.staggeredUntil = enemy.age + seconds;
  if (ability && "cooldown" in ability)
    enemy.abilityReadyAt = enemy.staggeredUntil + ability.cooldown;
  enemy.triggeredAbilityStartedAt = undefined;
  enemy.action = undefined;
  enemy.melee = undefined;
}

export function abilityCooldownRemaining(enemy: Enemy) {
  const ability = ENEMIES[enemy.type].ability;
  if (ability?.kind === "glide")
    return activeTurnBurst(enemy) ? 0 : Math.max(0, (enemy.abilityReadyAt ?? 0) - enemy.age);
  if (!ability || !("cooldown" in ability)) return 0;
  if (ability.kind === "guard-cycle") {
    const exposed = guardPosition(enemy, ability);
    return exposed < 0 ? 0 : ability.cooldown - exposed;
  }
  if (ability.kind === "burrow" || ability.kind === "vent" || ability.kind === "quills" || ability.kind === "freeze-towers")
    return Math.max(0, (enemy.abilityReadyAt ?? ability.initialDelay ?? ability.cooldown) - enemy.age);
  if (ability.kind === "wing-cycle") return Math.max(0, -wingPosition(enemy, ability));
  return Math.max(0, -cyclePosition(enemy, ability, ability.windup + ability.active));
}

export function quillsSpent(enemy: Enemy) {
  return enemy.age < (enemy.quillsRegrowAt ?? 0);
}

export function exposedDamageFactor(enemy: Enemy) {
  const ability = ENEMIES[enemy.type].ability;
  const light = sunExposure(enemy);
  let factor = 1;
  if (isBurrowing(enemy)) factor = 0.6;
  else if (ability?.kind === "wing-cycle" && wingPosition(enemy, ability) < 0) factor = ability.damageFactor;
  else if (ability?.kind === "guard-cycle" && !(light && ability.lightSensitive))
    factor = guardPosition(enemy, ability) < 0 ? ability.damageFactor : ability.exposedFactor ?? 1;
  else if (ability?.kind === "quills")
    factor = quillsSpent(enemy) ? ability.exposedFactor : ability.guardedFactor;
  else if (ability?.kind === "glide") factor = activeTurnBurst(enemy)?.exposedFactor ?? 1;
  return factor * (light?.multiplier ?? 1);
}

export function sunExposure(enemy: Enemy) {
  return enemy.sunlit && enemy.age < enemy.sunlit.until ? enemy.sunlit : undefined;
}

export function spendScreen(enemy: Enemy, effects: Effect[]) {
  const screen = enemy.screen;
  if (!screen || screen.until <= enemy.age) return 1;
  enemy.screen = undefined;
  effects.push({ kind: "enemy-ward", x: enemy.x, y: enemy.y, color: "#a7f7eb", radius: 0.75, life: 0.28, total: 0.28 });
  return 1 - screen.strength;
}

export function blockHeavyHit(enemy: Enemy, damage: number, effects: Effect[]) {
  const ability = ENEMIES[enemy.type].ability;
  if (ability?.kind !== "shell" || enemy.shellBroken || damage < ability.threshold)
    return false;
  enemy.shellBroken = true;
  effects.push({
    kind: "shell-break",
    enemy: enemy.type,
    x: enemy.x,
    y: enemy.y,
    color: enemy.type === "rime-golem" ? "#9bedf4" : "#f3c68d",
    life: 0.4,
    total: 0.4,
  });
  return true;
}

export function activeEnrage(enemy: Enemy) {
  return enemy.hp <= enemy.maxHp / 2 ? ENEMIES[enemy.type].enrage : undefined;
}

export function updateEnemyActions(
  enemies: readonly Enemy[],
  effects: Effect[],
  isIntercepted: (enemy: Enemy) => boolean,
  hasQuillTarget?: (enemy: Enemy, radius: number) => boolean,
) {
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.escaped) continue;
    const { ability, color } = ENEMIES[enemy.type];
    if (isStaggered(enemy)) continue;
    if (!enemy.chargeAnnounced && activeEnrage(enemy)) {
      enemy.chargeAnnounced = true;
      effects.push({ kind: "enemy-windup", enemy: enemy.type, x: enemy.x, y: enemy.y, color, life: 0.4, total: 0.4 });
    }
    if (!ability) continue;
    if (ability.kind === "shell" || ability.kind === "glide" || ability.kind === "freeze-towers") continue;
    if (ability.kind === "wing-cycle") {
      const elapsed = wingPosition(enemy, ability);
      const previous = enemy.action?.phase;
      if (elapsed < 0) enemy.action = undefined;
      else if (elapsed < ability.opening) {
        enemy.action = { phase: "windup", progress: elapsed / ability.opening };
        if (previous !== "windup")
          effects.push({ kind: "enemy-expose", enemy: enemy.type, x: enemy.x, y: enemy.y, color, life: 0.42, total: 0.42 });
      } else {
        if (previous !== "active") enemy.melee = undefined;
        enemy.action = { phase: "active", progress: (elapsed - ability.opening) / ability.flight };
      }
      continue;
    }
    if (ability.kind === "guard-cycle") {
      const openFor = guardPosition(enemy, ability);
      if (openFor >= 0 && enemy.action?.phase !== "exposed") {
        effects.push({ kind: "enemy-expose", enemy: enemy.type, x: enemy.x, y: enemy.y, color, life: 0.5, total: 0.5 });
        const screen = ability.escortScreen;
        if (screen) {
          for (const ally of enemies) {
            const spec = ENEMIES[ally.type];
            if (ally === enemy || ally.route !== enemy.route || ally.hp <= 0 || ally.escaped ||
                !spec.armored || spec.boss || spec.miniboss || isAirborne(ally) ||
                dist2(ally.x, ally.y, enemy.x, enemy.y) > screen.radius ** 2) continue;
            ally.screen = { until: ally.age + screen.duration, strength: screen.strength };
          }
          effects.push({ kind: "enemy-ward", x: enemy.x, y: enemy.y, color, radius: screen.radius, life: 0.55, total: 0.55 });
        }
      }
      enemy.action = openFor >= 0 ? { phase: "exposed", progress: openFor / ability.cooldown } : undefined;
      continue;
    }
    if (ability.kind === "burrow" || ability.kind === "vent" || ability.kind === "quills") {
      const venting = ability.kind === "vent";
      const quills = ability.kind === "quills";
      const readyAt = enemy.abilityReadyAt ?? ability.initialDelay ?? ability.cooldown;
      if (enemy.triggeredAbilityStartedAt === undefined && enemy.age >= readyAt &&
          (quills ? hasQuillTarget?.(enemy, ability.radius) : isIntercepted(enemy))) {
        enemy.triggeredAbilityStartedAt = enemy.age;
        enemy.melee = undefined;
        if (venting || quills)
          effects.push({ kind: "enemy-windup", enemy: enemy.type, x: enemy.x, y: enemy.y,
            color: venting ? "#f8a56a" : color, life: 0.45, total: 0.45 });
      }
      if (enemy.triggeredAbilityStartedAt === undefined) continue;
      const elapsed = enemy.age - enemy.triggeredAbilityStartedAt;
      if (elapsed < ability.windup) {
        enemy.action = { phase: "windup", progress: elapsed / ability.windup };
      } else if (elapsed < ability.windup + ability.active) {
        const impact = enemy.action?.phase !== "active";
        if (impact && quills) enemy.quillsRegrowAt = enemy.age + ability.regrowth;
        if (impact && !quills)
          effects.push({
            kind: venting ? "enemy-vent" : "enemy-burrow-in",
            enemy: enemy.type,
            x: enemy.x,
            y: enemy.y,
            color: venting ? "#f4a66a" : enemy.type === "mire-croc" ? "#4d6b47" : "#d3a371",
            radius: venting ? ability.radius : undefined,
            life: 0.55,
            total: 0.55,
          });
        enemy.action = { phase: "active", progress: (elapsed - ability.windup) / ability.active, impact };
      } else {
        enemy.action = undefined;
        enemy.triggeredAbilityStartedAt = undefined;
        enemy.abilityReadyAt = enemy.age + ability.cooldown;
        if (!venting && !quills)
          effects.push({
            kind: "enemy-burrow-out",
            enemy: enemy.type,
            x: enemy.x,
            y: enemy.y,
            color: enemy.type === "mire-croc" ? "#6f8f56" : "#e4b785",
            life: 0.6,
            total: 0.6,
          });
      }
      continue;
    }

    const before = enemy.action?.phase;
    const elapsed = cyclePosition(enemy, ability, ability.windup + ability.active);
    if (elapsed < 0) {
      enemy.action = undefined;
      if (ability.kind === "hop" && before === "active")
        effects.push({
          kind: enemy.type === "weir-frog" ? "enemy-splash" : "enemy-needles",
          enemy: enemy.type,
          x: enemy.x,
          y: enemy.y,
          color: enemy.type === "weir-frog" ? "#b6e5ce" : "#c6b46a",
          life: 0.28,
          total: 0.28,
        });
      continue;
    }
    if (elapsed < ability.windup) {
      if (ability.kind === "dash" && before !== "windup")
        effects.push({ kind: "enemy-windup", x: enemy.x, y: enemy.y, color, life: 0.42, total: 0.42 });
      enemy.action = { phase: "windup", progress: elapsed / ability.windup };
      continue;
    }
    enemy.action = { phase: "active", progress: (elapsed - ability.windup) / ability.active };
    if (before === "active") continue;

    if (ability.kind === "dash") {
      effects.push({
        kind: "enemy-dust",
        x: enemy.x,
        y: enemy.y,
        color: enemy.type === "frost-bear" ? "#d6f2fc" : "#d3a677",
        life: 0.48,
        total: 0.48,
      });
    }
    if (ability.kind === "rally" || ability.kind === "ward" || ability.kind === "screen") {
      const rally = ability.kind === "rally";
      const status = rally ? "haste" : ability.kind === "screen" ? "screen" : "slowWard";
      let reachedAlly = false;
      const leader = ENEMIES[enemy.type].miniboss || ENEMIES[enemy.type].boss;
      for (const ally of enemies) {
        if (ally === enemy || ally.route !== enemy.route || (!leader && ally.batch !== enemy.batch) ||
            ally.hp <= 0 || ally.escaped ||
            dist2(ally.x, ally.y, enemy.x, enemy.y) > ability.radius ** 2)
          continue;
        ally[status] = {
          until: Math.max(ally[status]?.until ?? 0, ally.age + ability.duration),
          strength: ability.strength,
        };
        reachedAlly = true;
      }
      if (reachedAlly)
        effects.push({
          kind: rally ? "enemy-rally" : "enemy-ward",
          x: enemy.x,
          y: enemy.y,
          color: rally
            ? (enemy.type === "frost-yeti" ? "#b4f0ff" : "#f6d18b")
            : enemy.type === "bloat-sporer"
              ? "#b7e874"
              : enemy.type === "mire-treant"
                ? "#8ee084"
                : enemy.type === "snowbrush-fox" ? color : "#bceef2",
          radius: ability.radius,
          life: 0.55,
          total: 0.55,
        });
    }
  }
}

export function enemyPace(enemy: Enemy, deviceMultiplier = 1) {
  if (isStaggered(enemy)) return 0;
  const { ability, boss, miniboss } = ENEMIES[enemy.type];
  if (ability?.kind === "freeze-towers" && enemy.action) return 0;
  const rage = activeEnrage(enemy);
  const haste = enemy.haste && enemy.haste.until > enemy.age ? 1 + enemy.haste.strength : 1;
  const ward = enemy.slowWard && enemy.slowWard.until > enemy.age ? enemy.slowWard.strength : 0;
  const slowScale = (1 - ward) * (1 - (rage?.slowResistance ?? 0));
  let strongest = 1;
  for (const pace of enemy.slows.keys()) strongest = Math.min(pace, strongest);
  const slow = Math.max(boss || miniboss ? MIN_BOSS_PACE : MIN_ENEMY_PACE,
    (1 - (1 - strongest) * slowScale) * deviceMultiplier);
  let actionPace = 1;
  if ((ability?.kind === "hop" || ability?.kind === "dash" || ability?.kind === "burrow") && enemy.action) {
    actionPace = enemy.action.phase === "windup" ? ability.brace : ability.boost;
  }
  if (ability?.kind === "wing-cycle" && isAirborne(enemy)) actionPace = ability.flightPace;
  if ((ability?.kind === "vent" || ability?.kind === "quills") && enemy.action) actionPace = 0.55;
  if (ability?.kind === "glide") actionPace = activeTurnBurst(enemy)?.boost ?? 1;
  return haste * slow * (rage?.speedMultiplier ?? 1) * actionPace;
}
