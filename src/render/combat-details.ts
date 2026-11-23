import { ENEMIES } from "../content/enemies.ts";
import { isAirborne, isBurrowing } from "../engine/enemy-abilities.ts";
import { CELL } from "../engine/route.ts";
import type { Effect, Enemy } from "../engine/types.ts";
import { linePixels, pixelRing } from "./animation.ts";
import { box } from "./canvas.ts";

const TRACK_AGE = .075;

interface Footprint {
  x: number;
  y: number;
  dx: number;
  dy: number;
  water: boolean;
  crawl: boolean;
  time: number;
}

export function createFootprints(isWater: (x: number, y: number) => boolean) {
  let tracks: Footprint[] = [];
  let steps = new WeakMap<Enemy, { walk: number; time: number }>();
  let lastTime = 0;
  return (ctx: CanvasRenderingContext2D, enemies: readonly Enemy[], time: number, reducedMotion: boolean) => {
    if (time < lastTime) {
      tracks = [];
      steps = new WeakMap();
    }
    lastTime = time;
    if (reducedMotion) return;
    tracks = tracks.filter((track) => time - track.time < TRACK_AGE);
    for (const enemy of enemies) {
      if (enemy.escaped || enemy.hp <= 0 || isAirborne(enemy) || isBurrowing(enemy) || !enemy.walk) continue;
      const step = steps.get(enemy);
      if (step && (step.walk === enemy.walk || time - step.time < .13)) continue;
      steps.set(enemy, { walk: enemy.walk, time });
      if (tracks.length >= 48) continue;
      const dx = enemy.facing === "east" ? -1 : enemy.facing === "west" ? 1 : 0;
      const dy = enemy.facing === "south" ? -1 : enemy.facing === "north" ? 1 : 0;
      const x = enemy.x * CELL + 8, y = enemy.y * CELL + 9;
      tracks.push({ x: x + dx * 5, y: y + dy * 4 + 1, dx, dy, water: isWater(x, y),
        crawl: enemy.type === "vine-viper", time });
    }
    ctx.save();
    for (const { x, y, dx, dy, water, crawl, time: born } of tracks) {
      const age = (time - born) / TRACK_AGE;
      ctx.globalAlpha = (1 - age) * .64;
      if (crawl) {
        linePixels(ctx, x - dy, y + dx, x + dx * 5 + dy, y + dy * 3 - dx,
          water ? "#b4d8c3" : "#889a6b", .85, .75);
      } else if (water) {
        const spread = 2 + age;
        for (const side of [-1, 1])
          linePixels(ctx, x, y, x + dx * 2 - dy * side * spread, y + dy * 2 + dx * side * spread,
            "#d1faeb", .6, .75);
      } else box(ctx, x + dx * age * 2, y + dy * age, 1, 1, "#dfc8a4");
    }
    ctx.restore();
  };
}

export function drawDefeatDebris(ctx: CanvasRenderingContext2D, effect: Effect, enemy: Enemy) {
  const { boss, miniboss } = ENEMIES[enemy.type];
  const elapsed = effect.total - effect.life;
  const age = elapsed / .12;
  const x = effect.x * CELL + 8, y = effect.y * CELL + 9;
  if (age >= 1 && (!(boss || miniboss) || elapsed >= .3)) return;
  ctx.save();
  if (age < 1) {
    ctx.globalAlpha = 1 - age * .85;
    const count = 3 + Math.floor(enemy.batch % 3);
    for (let i = 0; i < count; i++) {
      const angle = i * 2.4 + x * .16;
      const distance = 2 + age * (4 + i);
      box(ctx, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * .55 - age * 5,
        i % 2 ? 1 : 1.5, 1, effect.color);
    }
  }
  if ((boss || miniboss) && elapsed < .3) {
    const phase = elapsed / .3;
    ctx.globalAlpha = .75 * (1 - phase);
    pixelRing(ctx, x, y - 3, 4 + phase * (boss ? 24 : 17), boss ? 22 : 16, "#ffe6ae", 1);
  }
  ctx.restore();
}
