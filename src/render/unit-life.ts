// Secondary motion, shading, hit-flashes, status overlays and defeat shatter/dissolve
// for guards, griffins and enemies. Stateless: everything is derived from battle time.
import type { Enemy } from "../engine/types.ts";
import { ENEMIES } from "../content/enemies.ts";
import { CELL } from "../engine/route.ts";
import { box, canvas2d } from "./canvas.ts";
import { diamond, linePixels, pixelRing } from "./animation.ts";
import { ORIGIN_X, ORIGIN_Y, SIZE } from "./pixel-sprite.ts";
import { pixelEllipse } from "./tower-life.ts";

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// Cached sprite passes (tinted silhouettes & sampled chunks for shatter/dissolve)
// ---------------------------------------------------------------------------

const tintCache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

/** Flat tinted silhouette of any cached sprite, used for crisp hit-flashes and frost coats. */
export function tintedSilhouette(source: HTMLCanvasElement, color: string): HTMLCanvasElement {
  let byColor = tintCache.get(source);
  if (!byColor) {
    byColor = new Map();
    tintCache.set(source, byColor);
  }
  const cached = byColor.get(color);
  if (cached) return cached;
  const image = document.createElement("canvas");
  image.width = source.width;
  image.height = source.height;
  const ctx = canvas2d(image);
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, image.width, image.height);
  byColor.set(color, image);
  return image;
}

export interface SpriteChunk {
  /** Local coordinates in sprite art units (ORIGIN_X / ORIGIN_Y centered, 2 art px per logical px). */
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly seed: number;
}

const chunkCache = new WeakMap<HTMLCanvasElement, readonly SpriteChunk[]>();

/**
 * Sample opaque pixels from a cached sprite on a coarse grid so defeat shatter/dissolve
 * uses the creature's exact palette without per-frame getImageData calls.
 */
export function spriteChunks(source: HTMLCanvasElement): readonly SpriteChunk[] {
  const cached = chunkCache.get(source);
  if (cached) return cached;
  const { width, height } = source;
  const data = canvas2d(source).getImageData(0, 0, width, height).data;
  const step = Math.max(4, Math.round(width / 22));
  const unitsPerPixel = SIZE / width;
  const chunks: SpriteChunk[] = [];
  for (let py = step >> 1; py < height; py += step) {
    for (let px = step >> 1; px < width; px += step) {
      const i = (py * width + px) * 4;
      if (data[i + 3] < 200) continue;
      // Skip very dark outline pixels when brighter interior colors exist nearby.
      const lum = data[i] * .3 + data[i + 1] * .55 + data[i + 2] * .15;
      if (lum < 48 && chunks.length % 3 !== 0) continue;
      chunks.push({
        x: (px * unitsPerPixel - ORIGIN_X) / 2,
        y: (py * unitsPerPixel - ORIGIN_Y) / 2,
        color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
        seed: hash(px * 19.3 + py * 37.7),
      });
    }
  }
  // Cap to 26 evenly spread chunks so large bosses stay fast on mobile.
  const stride = chunks.length > 26 ? chunks.length / 26 : 1;
  const trimmed = stride > 1
    ? Array.from({ length: 26 }, (_, k) => chunks[Math.floor(k * stride)])
    : chunks;
  chunkCache.set(source, trimmed);
  return trimmed;
}

// ---------------------------------------------------------------------------
// Guard & griffin combat / motion flourishes
// ---------------------------------------------------------------------------

/** Crisp pixel thrust smear and tip gleam for rabbit guard spear/staff strikes. */
export function drawThrustArc(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, dx: number, dy: number, followThrough: number, spear: boolean,
) {
  if (followThrough <= 0.15) return;
  const length = (spear ? 9 : 6) * followThrough;
  const perpX = -dy, perpY = dx;
  ctx.save();
  ctx.globalAlpha = Math.min(1, followThrough * 1.15);
  linePixels(ctx, x - dx * 2, y - dy * 2, x + dx * length, y + dy * length, "#fff6d2", .5, spear ? 1.1 : .85);
  for (const side of [-1, 1]) {
    const spread = (spear ? 2.4 : 1.7) * (1 - followThrough * .4);
    linePixels(
      ctx,
      x + perpX * side * spread - dx * 1.5,
      y + perpY * side * spread - dy * 1.5,
      x + dx * (length * .85),
      y + dy * (length * .85),
      spear ? "#dff0b8" : "#ffe6ad",
      .6,
      .6,
    );
  }
  if (followThrough > .55) {
    diamond(ctx, x + dx * length, y + dy * length, spear ? 1.5 : 1, "#fffdf0");
  }
  ctx.restore();
}

/** Shield block burst: short expanding ring + directional sparks. */
export function drawBlockBurst(ctx: CanvasRenderingContext2D, x: number, y: number, side: number, age: number) {
  const life = .18;
  if (age < 0 || age >= life) return;
  const t = age / life;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  pixelRing(ctx, x + side * 1.5, y - 3, 2 + t * 5.5, 10, "#fff2bd", .8);
  for (let i = -2; i <= 2; i++) {
    const a = (side < 0 ? Math.PI : 0) + i * .36;
    const d = 1.5 + t * 6.5;
    box(ctx, x + Math.cos(a) * d, y - 3 + Math.sin(a) * d, 1, 1, i % 2 ? "#ffe596" : "#fffdf0");
  }
  ctx.restore();
}

/** Three curved silver-ice claw streaks for griffin air-dive and ground-claw attacks. */
export function drawClawSlash(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, side: number, followThrough: number, air: boolean, scale: number,
) {
  if (followThrough <= .15) return;
  const p = 1 - followThrough;
  const reach = (air ? 11 : 8) * scale;
  ctx.save();
  ctx.globalAlpha = Math.min(1, followThrough * 1.25);
  for (let i = -1; i <= 1; i++) {
    const offset = i * 2.4 * scale;
    const sx = x + side * (2 + p * 3) + offset * .3;
    const sy = y - (air ? 7 : 6) * scale + offset;
    const ex = sx + side * reach * (1 - Math.abs(i) * .12);
    const ey = sy + (air ? 5 : 4) * scale;
    linePixels(ctx, sx, sy, ex, ey, i === 0 ? "#f4fbff" : "#a8dcff", .55, i === 0 ? 1.1 : .75);
  }
  if (followThrough > .6) {
    diamond(ctx, x + side * (reach + 2), y - (air ? 3 : 2) * scale, 1.4, "#ffffff");
  }
  ctx.restore();
}

/** Downstroke wing gust & occasional silver feather for flying griffins. */
export function drawWingGust(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, side: number, phase: number, scale: number, elite: boolean,
) {
  const beat = phase % 4;
  ctx.save();
  // Brief gust curl on downstroke (beat 1.5 .. 2.7).
  if (beat > 1.4 && beat < 2.8) {
    const t = (beat - 1.4) / 1.4;
    ctx.globalAlpha = Math.sin(t * Math.PI) * .45;
    for (const s of [-1, 1]) {
      const gx = x + s * (5 + t * 5) * scale;
      const gy = y - (7 - t * 4) * scale;
      box(ctx, gx, gy, 2.2, .75, "#cdeeff");
      box(ctx, gx + s * 1.5, gy + 1.2, 1.4, .65, "#9fd2f0");
    }
  }
  // Elite (merged talon / grown recruit) frost motes orbiting gently.
  if (elite) {
    for (let i = 0; i < 2; i++) {
      const a = phase * .45 + i * Math.PI;
      ctx.globalAlpha = .55;
      box(
        ctx,
        x - side * 2 + Math.cos(a) * 8 * scale,
        y - 8 * scale + Math.sin(a) * 3.5 * scale,
        1, 1, i === 0 ? "#e8f8ff" : "#9bd4ff",
      );
    }
  }
  ctx.restore();
}

/** Smooth fade-in for freshly spawned units while their newly constructed interceptor post finishes dropping in. */
export function guardBuildAlpha(builtAt: number | undefined, time: number, reducedMotion: boolean): number {
  if (reducedMotion || builtAt === undefined) return 1;
  const age = time - builtAt;
  if (age < 0 || age >= 0.28) return 1;
  return Math.max(0, Math.min(1, (age - 0.14) / 0.14));
}

/** Soft rising emerald-mint healing sparkles & pixel cross when a friendly interceptor recovers out of combat. */
export function drawGuardHeal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number,
  reducedMotion: boolean,
) {
  ctx.save();
  if (reducedMotion) {
    ctx.globalAlpha = 0.85;
    box(ctx, x - 0.5, y - 9, 1, 3, "#9ef2c4");
    box(ctx, x - 1.5, y - 8, 3, 1, "#9ef2c4");
    ctx.restore();
    return;
  }
  for (let i = 0; i < 3; i++) {
    const phase = (time * 1.15 + i * 0.33 + x * 0.03) % 1;
    const mx = x + (i - 1) * 4.5 + Math.sin(time * 3.2 + i * 2.1) * 1.2;
    const my = y - 2 - phase * 11;
    ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.9;
    if (i === 1) {
      box(ctx, mx - 0.4, my - 1.4, 0.8, 2.8, "#8ff2be");
      box(ctx, mx - 1.4, my - 0.4, 2.8, 0.8, "#8ff2be");
      box(ctx, mx - 0.35, my - 0.35, 0.7, 0.7, "#ecfff4");
    } else {
      diamond(ctx, mx, my, 0.95, i === 0 ? "#a9f5cd" : "#e6fff2");
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Enemy status & defeat effects
// ---------------------------------------------------------------------------

/** Detailed frost ring, crystalline spikes and drifting chill motes on slowed enemies. */
export function drawFrostStatus(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, wide: number, time: number, airborne: boolean, leap: number,
) {
  const baseY = y + (airborne ? -leap + 2 : 1);
  ctx.save();
  // Ground frost ring + cold puddle (only on grounded targets).
  if (!airborne) {
    ctx.globalAlpha = .26;
    pixelEllipse(ctx, x, y + 2, wide * .95, 2.4, "#8fdff5");
    ctx.globalAlpha = .72;
    pixelRing(ctx, x, y + 1.5, wide * .88, 12, "#b5ecfc", .65);
  }
  // Crystalline shards sticking around the base / body.
  ctx.globalAlpha = .9;
  for (let i = -1; i <= 1; i++) {
    const sx = x + i * wide * .55;
    const sy = baseY - (i === 0 ? 1 : 0);
    const h = i === 0 ? 3.5 : 2.5;
    box(ctx, sx - .6, sy - h, 1.2, h, "#9ee6fa");
    box(ctx, sx - .3, sy - h - .7, .6, 1.2, "#eefcff");
  }
  // Slow drifting snow/frost motes.
  for (let i = 0; i < 3; i++) {
    const t = (time * .75 + i * .33 + x * .02) % 1;
    const mx = x + Math.sin(time * 2.4 + i * 2.1) * (wide * .7);
    const my = baseY - 2 - t * 11;
    ctx.globalAlpha = Math.sin(t * Math.PI) * .85;
    if (i === 0) diamond(ctx, mx, my, .9, "#e6fdff");
    else box(ctx, mx, my, .9, .9, "#aeeeff");
  }
  ctx.restore();
}

export function drawSporeStatus(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, wide: number, time: number, airborne: boolean, leap: number, remaining: number,
) {
  const baseY = y - leap - wide * .25;
  ctx.save();
  ctx.globalAlpha = Math.min(1, remaining * 2.5) * .92;
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * wide * .48;
    const sy = baseY - (i === 1 ? wide * .28 : 0) + Math.sin(time * 3 + i) * .3;
    pixelEllipse(ctx, sx, sy, 1.7 + (i === 1 ? .5 : 0), 1.25, "#385337");
    pixelEllipse(ctx, sx - .35, sy - .35, 1.1, .75, "#82a85b");
    box(ctx, sx - .8, sy - 1, 1.1, .75, "#c4dc86");
  }
  for (let i = 0; i < 3; i++) {
    const t = (time * .65 + i * .33 + x * .01) % 1;
    ctx.globalAlpha = Math.sin(t * Math.PI) * .7 * Math.min(1, remaining * 2.5);
    box(ctx, x + Math.sin(time * 2 + i * 2.1) * wide * .8,
      baseY - t * (wide + 5), 1, 1, i === 1 ? "#e0ecab" : "#9dbe6c");
  }
  ctx.restore();
}

export type DefeatStyle = "frost-shatter" | "armor-shatter" | "dissolve";

/**
 * Rich pixel defeat animation:
 *  - frost-shatter: freezes bright cyan-white, then bursts into ice + sprite shards
 *  - armor-shatter: shakes with golden crack flash, then blasts solid sprite chunks + smoke
 *  - dissolve: squashes with a brief flash, then erodes upward into glowing pixel motes
 */
export function drawRichDefeat(
  ctx: CanvasRenderingContext2D,
  pose: HTMLCanvasElement,
  x: number, y: number,
  scale: number,
  facing: number,
  progress: number,
  style: DefeatStyle,
  accent: string,
  heavy: boolean,
) {
  const chunks = spriteChunks(pose);
  const unit = scale / 2;

  if (style === "frost-shatter") {
    const breakAt = .22;
    if (progress < breakAt) {
      const p = progress / breakAt;
      const shake = Math.sin(p * 34) * (1.2 - p * .5);
      ctx.save();
      ctx.translate(x + shake, y);
      ctx.scale(facing, 1);
      ctx.drawImage(pose, -ORIGIN_X * unit, -ORIGIN_Y * unit, SIZE * unit, SIZE * unit);
      ctx.globalAlpha = .55 + p * .45;
      const ice = tintedSilhouette(pose, "#ccf6ff");
      ctx.drawImage(ice, -ORIGIN_X * unit, -ORIGIN_Y * unit, SIZE * unit, SIZE * unit);
      ctx.restore();
      return;
    }
    const t = (progress - breakAt) / (1 - breakAt);
    ctx.save();
    if (t < .35) {
      ctx.globalAlpha = (1 - t / .35) * .85;
      pixelRing(ctx, x, y - 5 * scale, 3 + t * 24 * scale, 14, "#dcfaff", 1.2);
      diamond(ctx, x, y - 6 * scale, Math.max(1, 3 * (1 - t * 2.5)), "#ffffff");
    }
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const angle = Math.atan2(c.y + 6, c.x) + (c.seed - .5) * .8;
      const speed = (10 + c.seed * 18) * scale;
      const px = x + c.x * scale * facing + Math.cos(angle) * speed * t;
      const py = y + c.y * scale + Math.sin(angle) * speed * t * .7 - 7 * t + 18 * t * t;
      const size = (1.1 + c.seed * 1.1) * (1 - t * .55);
      ctx.globalAlpha = Math.max(0, 1 - t ** 1.4);
      const color = i % 3 === 0 ? "#e6fcff" : i % 3 === 1 ? "#8ce0fa" : c.color;
      if (i % 4 === 0) diamond(ctx, px, py, size * .75, color);
      else box(ctx, px - size / 2, py - size / 2, size, size, color);
    }
    ctx.restore();
    return;
  }

  if (style === "armor-shatter") {
    const breakAt = .25;
    if (progress < breakAt) {
      const p = progress / breakAt;
      const shake = Math.sin(p * 44) * (1.6 - p * .6);
      ctx.save();
      ctx.translate(x + shake, y);
      ctx.scale(facing * (1 + p * .08), 1 - p * .1);
      ctx.drawImage(pose, -ORIGIN_X * unit, -ORIGIN_Y * unit, SIZE * unit, SIZE * unit);
      ctx.globalAlpha = p * .85;
      const flash = tintedSilhouette(pose, "#fff3cc");
      ctx.drawImage(flash, -ORIGIN_X * unit, -ORIGIN_Y * unit, SIZE * unit, SIZE * unit);
      ctx.restore();
      return;
    }
    const t = (progress - breakAt) / (1 - breakAt);
    ctx.save();
    // Smoke puff + shock ring.
    if (t < .5) {
      const st = t / .5;
      ctx.globalAlpha = (1 - st) * .7;
      pixelRing(ctx, x, y - 3, 4 + st * (heavy ? 18 : 13), 16, "#f2d69b", 1.2);
      for (let i = 0; i < 5; i++) {
        const a = i * 1.25 + x * .1;
        const r = 2 + st * 9;
        ctx.globalAlpha = (1 - st) * .45;
        pixelEllipse(ctx, x + Math.cos(a) * r, y - 4 + Math.sin(a) * r * .5 - st * 4, 2 + st * 2, 1.5 + st, "#9e9487");
      }
    }
    // Sprite chunks arcing out and bouncing once on the ground.
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const angle = Math.atan2(c.y + 5, c.x) + (c.seed - .5) * .9;
      const speed = (11 + c.seed * 16) * scale;
      const px = x + c.x * scale * facing + Math.cos(angle) * speed * t;
      const rawY = c.y * scale + Math.sin(angle) * speed * t * .5 - (8 + c.seed * 6) * t + 26 * t * t;
      const py = y + Math.min(2, rawY);
      const size = (1.2 + c.seed * 1.1) * (1 - t * .4);
      ctx.globalAlpha = Math.max(0, 1 - t ** 1.5);
      box(ctx, px - size / 2, py - size / 2, size, size, i % 5 === 0 ? "#ffe5a8" : c.color);
    }
    ctx.restore();
    return;
  }

  // "dissolve": quick white impact squash, then upward pixel erosion + floating motes.
  const startAt = .15;
  ctx.save();
  if (progress < startAt) {
    const p = progress / startAt;
    const shake = Math.sin(p * 36) * .9;
    ctx.translate(x + shake, y);
    ctx.scale(facing * (1 + p * .12), 1 - p * .16);
    ctx.drawImage(pose, -ORIGIN_X * unit, -ORIGIN_Y * unit, SIZE * unit, SIZE * unit);
    ctx.globalAlpha = .7 * (1 - p * .4);
    const flash = tintedSilhouette(pose, "#fff9e2");
    ctx.drawImage(flash, -ORIGIN_X * unit, -ORIGIN_Y * unit, SIZE * unit, SIZE * unit);
    ctx.restore();
    return;
  }
  const t = (progress - startAt) / (1 - startAt);
  // Remaining core sprite eroding from top and bottom while fading.
  if (t < .68) {
    const core = 1 - t / .68;
    ctx.save();
    ctx.globalAlpha = core * .85;
    ctx.translate(x, y - t * 3);
    ctx.scale(facing * (1 + t * .08), 1 - t * .22);
    const clipH = SIZE * unit * core;
    ctx.beginPath();
    ctx.rect(-ORIGIN_X * unit, -ORIGIN_Y * unit + (SIZE * unit - clipH) * .35, SIZE * unit, clipH);
    ctx.clip();
    ctx.drawImage(pose, -ORIGIN_X * unit, -ORIGIN_Y * unit, SIZE * unit, SIZE * unit);
    ctx.restore();
  }
  // Detached pixel motes rising and twinkling away.
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const delay = c.seed * .32;
    const m = (t - delay) / (1 - delay);
    if (m <= 0 || m >= 1) continue;
    const drift = Math.sin(m * 7 + c.seed * 12) * 2.5;
    const px = x + c.x * scale * facing + drift;
    const py = y + c.y * scale - m * (11 + c.seed * 9);
    const size = (1 + c.seed * .9) * (1 - m * .65);
    ctx.globalAlpha = Math.sin((1 - m) * Math.PI * .5) * .92;
    box(ctx, px - size / 2, py - size / 2, size, size, i % 4 === 0 ? accent : c.color);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Signature ambient & ability VFX for the 8 regional minibosses & new enemies
// ---------------------------------------------------------------------------

export function drawNewEnemyAura(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  x: number, y: number,
  wide: number, scale: number,
  time: number, leap: number,
  enraged: boolean,
) {
  const dir = enemy.facing === "west" ? -1 : 1;
  const action = enemy.action;
  const seed = x * .07 + y * .03;

  switch (enemy.type) {
    case "slag-colossus": {
      ctx.save();
      const hot = action !== undefined || enraged;
      // Twin dorsal smokestack soot puffs & rising furnace embers.
      const stacks = [[-7.5 * dir, -26 * scale], [3.5 * dir, -24.5 * scale]] as const;
      for (let s = 0; s < stacks.length; s++) {
        const [sx, sy] = stacks[s];
        for (let i = 0; i < 2; i++) {
          const t = (time * (hot ? 1.45 : .95) + i * .5 + s * .27 + seed) % 1;
          const px = x + sx - dir * t * 4 + Math.sin(time * 3 + i * 2 + s) * 1.4;
          const py = y - leap + sy - t * (hot ? 13 : 9);
          ctx.globalAlpha = Math.sin(t * Math.PI) * (hot ? .62 : .42);
          pixelEllipse(ctx, px, py, 1.4 + t * 2.2, 1.1 + t * 1.5, i === 0 && hot ? "#6e564a" : "#4a4347");
        }
        // Embers
        const et = (time * (hot ? 2.1 : 1.3) + s * .41 + seed) % 1;
        ctx.globalAlpha = Math.sin(et * Math.PI) * (hot ? .95 : .7);
        box(ctx, x + sx + Math.sin(time * 7 + s * 3) * 2.5, y - leap + sy - et * 14, 1.1, 1.1, hot ? "#fff0a6" : "#ff994a");
      }
      // Charging / enraged ground ember wake.
      if (hot) {
        for (let i = 0; i < 3; i++) {
          const t = (time * 2.4 + i * .33 + seed) % 1;
          const ex = x - dir * (4 + t * 12);
          const ey = y + 1 - Math.sin(t * Math.PI) * 5;
          ctx.globalAlpha = (1 - t) * .85;
          if (i === 0) diamond(ctx, ex, ey, 1.1, "#ffea9e");
          else box(ctx, ex, ey, 1.3, 1.3, "#ff8b3d");
        }
      }
      ctx.restore();
      return;
    }

    case "frost-bear": {
      ctx.save();
      const side = enemy.facing === "east" || enemy.facing === "west";
      const south = enemy.facing === "south";
      if (action?.phase === "active") {
        // Glacial bulldoze speed-streaks & flying snow clods (4-way direction aware).
        if (side) {
          for (let i = 0; i < 3; i++) {
            const sy = y - leap - (4 + i * 4.5) * scale;
            const sx = x - dir * (6 + i * 2.5);
            ctx.globalAlpha = .78 - i * .16;
            linePixels(ctx, sx, sy, sx - dir * (8 - i), sy + 1, i === 0 ? "#f2fdff" : "#8ddcf2", .95, 1.1);
          }
          for (let i = 0; i < 4; i++) {
            const t = (time * 3.1 + i * .25 + seed) % 1;
            const sx = x - dir * (4 + t * 11);
            const sy = y + 1 - Math.sin(t * Math.PI) * 5 + (i % 2 - .5) * 2;
            ctx.globalAlpha = (1 - t) * .82;
            box(ctx, sx, sy, i % 2 === 0 ? 1.5 : 1.1, i % 2 === 0 ? 1.5 : 1.1, i === 0 ? "#ffffff" : "#cbeffa");
          }
        } else {
          const vy = south ? -1 : 1;
          for (let i = -1; i <= 1; i++) {
            const sx = x + i * 6.5 * scale;
            const sy = y - (south ? 18 : 2) * scale + vy * Math.abs(i) * 2;
            ctx.globalAlpha = .74 - Math.abs(i) * .14;
            linePixels(ctx, sx, sy, sx, sy + vy * 7, i === 0 ? "#f2fdff" : "#8ddcf2", .95, 1.1);
          }
          for (let i = 0; i < 3; i++) {
            const t = (time * 3 + i * .33 + seed) % 1;
            ctx.globalAlpha = (1 - t) * .8;
            box(ctx, x + (i - 1) * 5.5, y + (south ? -16 : 2) + vy * t * 7, 1.3, 1.3, i === 1 ? "#ffffff" : "#cbeffa");
          }
        }
      } else if (action?.phase === "windup") {
        // Rearing frost-roar breath puff & dorsal ice-ridge glint.
        const t = action.progress;
        if (side) {
          ctx.globalAlpha = Math.sin(t * Math.PI) * .78;
          pixelEllipse(ctx, x + dir * (10.5 * scale + t * 5), y - 10.5 * scale - t * 2, 1.8 + t * 1.8, 1.3 + t * 1.1, "#e2faff");
        } else if (south) {
          ctx.globalAlpha = Math.sin(t * Math.PI) * .72;
          pixelEllipse(ctx, x, y - 6 * scale + t * 4, 2.2 + t * 1.8, 1.2 + t * .9, "#e2faff");
        }
        ctx.globalAlpha = (.4 + .6 * Math.sin(t * Math.PI)) * .85;
        diamond(ctx, x, y - 22 * scale, 1.4 + t * .6, "#f4ffff");
      } else {
        // Subtle drifting frost flakes around the ice-ridged back.
        const t = (time * .65 + seed) % 1;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .55;
        box(ctx, x + Math.sin(time * 2 + seed) * (wide * .6), y - 8 - t * 12 * scale, 1.1, 1.1, "#def8ff");
      }
      ctx.restore();
      return;
    }

    case "frost-yeti": {
      ctx.save();
      const enraged = enemy.hp <= enemy.maxHp / 2;
      if (action?.phase === "active") {
        // Expanding frost war-cry shockwave ring & rising cold mist on bellow.
        const t = action.progress;
        ctx.globalAlpha = (1 - t) * .82;
        pixelRing(ctx, x, y - 10 * scale, wide * (.8 + t * 2.1), 18, "#c2f2ff", .65);
        ctx.globalAlpha = (1 - t) * .65;
        pixelRing(ctx, x, y - 10 * scale, wide * (.5 + t * 1.45), 14, "#ffffff", .55);
        for (let i = 0; i < 4; i++) {
          const a = i * (Math.PI / 2) + time * 2.5 + seed;
          ctx.globalAlpha = (1 - t) * .8;
          box(ctx, x + Math.cos(a) * (wide * (.7 + t * 1.1)), y - 16 * scale + Math.sin(a) * 5 - t * 6, 1.3, 1.3, "#eafcff");
        }
      } else if (action?.phase === "windup") {
        // Gathering glacial breath & shimmering horn-crest before chest-beat roar.
        const t = action.progress;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .72;
        pixelEllipse(ctx, x + dir * (9 + t * 3) * scale, y - 8 * scale - t * 2,
          1.6 + t * 1.4, 1.1 + t * .8, "#d9f8ff");
        ctx.globalAlpha = .5 + .3 * Math.sin(t * Math.PI);
        diamond(ctx, x, y - 24 * scale, 1.5 + t * .8, "#f2ffff");
      }
      if (enraged) {
        // Blazing snow-steam motes & chilled fury aura below half HP.
        for (let i = 0; i < 3; i++) {
          const t = (time * 1.9 + i * .33 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .72;
          const ox = Math.sin(time * 3.5 + i * 2.1) * (wide * .65);
          box(ctx, x + ox, y - 10 * scale - t * 16 * scale, 1.3, 1.3, i === 0 ? "#fff4b8" : "#c7f5ff");
        }
      } else if (!action) {
        // Subtle drifting alpine snow flakes around shaggy shoulders.
        const t = (time * .6 + seed) % 1;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .5;
        box(ctx, x + Math.sin(time * 1.8 + seed) * (wide * .7), y - 12 - t * 13 * scale, 1.1, 1.1, "#e2f8ff");
      }
      ctx.restore();
      return;
    }

    case "rime-golem": {
      ctx.save();
      if (enemy.shellBroken) {
        // Pulsing exposed cyan crystal core glint & orbiting frost shards.
        const pulse = .6 + .4 * Math.sin(time * 7 + seed);
        ctx.globalAlpha = pulse * .85;
        diamond(ctx, x + dir * 2, y - 10 * scale, 1.6 + pulse * .7, "#e8ffff");
        for (let i = 0; i < 3; i++) {
          const a = time * 2.6 + i * (Math.PI * 2 / 3) + seed;
          ctx.globalAlpha = .75;
          box(ctx, x + Math.cos(a) * (wide * .95), y - 10 * scale + Math.sin(a) * 4, 1.1, 1.1, i === 0 ? "#c8ffff" : "#67d8eb");
        }
      } else {
        // Subtle drifting cold mist motes around intact ice armor.
        for (let i = 0; i < 2; i++) {
          const t = (time * .7 + i * .5 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .6;
          box(ctx, x + Math.sin(time * 2 + i * 3) * (wide * .8), y - 4 - t * 14 * scale, 1, 1, "#d9f7ff");
        }
      }
      ctx.restore();
      return;
    }

    case "blizzard-elk": {
      ctx.save();
      const warding = action !== undefined;
      const crownY = y - leap - 22 * scale;
      if (warding) {
        // Flowing aurora ribbons over the antlers instead of a crown ring.
        const pulse = .55 + .45 * Math.sin(time * 8);
        for (let k = 0; k < 3; k++) {
          const y0 = crownY - k * 2;
          ctx.globalAlpha = (.32 + pulse * .3) * (1 - k * .18);
          ctx.strokeStyle = k % 2 ? "#b8f7ff" : "#fff0b2";
          ctx.lineWidth = .9;
          ctx.beginPath();
          ctx.moveTo(x - 8, y0);
          ctx.quadraticCurveTo(x - 2, y0 - 6 - k, x + 3, y0 - 1);
          ctx.quadraticCurveTo(x + 7, y0 - 4, x + 9, y0 - 2);
          ctx.stroke();
        }
        for (let i = 0; i < 4; i++) {
          const t = (time * 1.6 + i * .25 + seed) % 1;
          const ax = x + dir * 3 + Math.cos(time * 3 + i * 1.6) * 9 * scale;
          const ay = crownY + 3 - t * 12;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .9;
          diamond(ctx, ax, ay, i % 2 === 0 ? 1.2 : .85, i % 2 === 0 ? "#ffffff" : "#99ecff");
        }
      } else {
        // Gentle frost-sparkle motes drifting off the crystal antlers.
        for (let i = 0; i < 2; i++) {
          const t = (time * .85 + i * .5 + seed) % 1;
          const ax = x + dir * 2 + (i === 0 ? -4 : 5) * scale + Math.sin(time * 2.5 + i * 2) * 1.5;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .7;
          diamond(ctx, ax, crownY - t * 6, .8, "#dcfaff");
        }
      }
      ctx.restore();
      return;
    }

    case "pine-boar": {
      ctx.save();
      // Rhythmic snout steam puff.
      const puff = (time * 1.35 + seed) % 1;
      if (puff < .55) {
        const t = puff / .55;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .65;
        pixelEllipse(ctx, x + dir * (12 + t * 5) * scale, y - 6 * scale - t * 3, 1.3 + t * 1.2, 1 + t * .8, enraged ? "#ffe6a3" : "#e8f0e2");
      }
      if (action !== undefined || enraged) {
        // Golden rally / rage sparks rising from pine-needle mane.
        for (let i = 0; i < 3; i++) {
          const t = (time * 1.9 + i * .33 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .85;
          const sx = x + (i - 1) * 5 * scale + Math.sin(time * 5 + i) * 1.5;
          diamond(ctx, sx, y - 14 * scale - t * 9, .95, i === 0 ? "#fff6bd" : "#f2b857");
        }
      }
      ctx.restore();
      return;
    }

    case "lotus-toad": {
      ctx.save();
      // Gentle pink lotus-petal mote drifting from the crown.
      const pt = (time * .75 + seed) % 1;
      ctx.globalAlpha = Math.sin(pt * Math.PI) * .78;
      box(ctx, x + Math.sin(time * 2.6 + seed) * 6, y - leap - 16 * scale - pt * 6, 1.4, 1, "#ffb8d8");
      if (action !== undefined) {
        // Broken lotus ripples on the water, not a vertical halo.
        for (let ring = 0; ring < 2; ring++) {
          const rPulse = (time * 1.15 + ring * .5 + seed) % 1;
          const spread = wide * (.7 + rPulse * .85);
          ctx.globalAlpha = (1 - rPulse) * .55;
          for (let i = 0; i < 15; i++) {
            if (i % 3 === 2) continue;
            const a = i * (Math.PI * 2 / 15);
            box(ctx, x + Math.cos(a) * spread, y + 1 + Math.sin(a) * spread * .34,
              1.3, .9, i % 2 ? "#8ff5e6" : "#c9fff2");
          }
        }
        for (let i = 0; i < 3; i++) {
          const bt = (time * 1.7 + i * .33 + seed) % 1;
          ctx.globalAlpha = Math.sin(bt * Math.PI) * .85;
          diamond(ctx, x + (i - 1) * 5.5, y - 5 - bt * 12, .9, "#d4fff8");
        }
      }
      ctx.restore();
      return;
    }

    case "slag-driller": {
      ctx.save();
      const venting = action?.phase === "windup";
      // Roof chimney smoke puff.
      const st = (time * (venting ? 1.8 : 1.05) + seed) % 1;
      ctx.globalAlpha = Math.sin(st * Math.PI) * (venting ? .65 : .42);
      pixelEllipse(ctx, x - dir * (4 + st * 4) * scale, y - 20 * scale - st * 10, 1.5 + st * 2, 1.1 + st * 1.4, venting ? "#785848" : "#4b464a");
      // Flying orange sparks from the spinning conical drill tip.
      for (let i = 0; i < 2; i++) {
        const sp = (time * 3.2 + i * .5 + seed) % 1;
        const sx = x + dir * (13 + sp * 4) * scale;
        const sy = y - 8 * scale + (i === 0 ? -1 : 1) * sp * 5 + sp * sp * 4;
        ctx.globalAlpha = (1 - sp) * .9;
        box(ctx, sx, sy, 1.1, 1.1, i === 0 ? "#fff0a8" : "#ff8d3d");
      }
      if (venting) {
        for (let i = 0; i < 3; i++) {
          const vt = (time * 2.6 + i * .33 + seed) % 1;
          ctx.globalAlpha = (1 - vt) * .9;
          diamond(ctx, x + Math.cos(i * 2.1 + time * 6) * 7 * scale, y - 9 * scale - vt * 8, 1.1, "#ffe596");
        }
      }
      ctx.restore();
      return;
    }

    case "frost-moose": {
      ctx.save();
      const casting = action?.phase === "windup";
      const releasing = action?.phase === "active";
      if (casting || releasing) {
        // Sacred ascending golden-cyan winter runes & radiant mist during domain invocation
        const pulse = (time * 2.2 + seed) % 1;
        ctx.globalAlpha = (1 - pulse) * 0.85;
        pixelRing(ctx, x, y + 1, wide * (0.85 + pulse * 1.15), 18, releasing ? "#fff4bd" : "#a8f3ff", 1.2);
        for (let i = 0; i < 6; i++) {
          const t = (time * 2.1 + i * (1 / 6) + seed) % 1;
          const a = time * 2.6 + i * (Math.PI / 3);
          const rx = x + Math.cos(a) * (8 + t * 5) * scale * 0.7;
          const ry = y - 6 - t * 24 * scale;
          ctx.globalAlpha = Math.sin(t * Math.PI) * 0.92;
          diamond(ctx, rx, ry, i % 2 === 0 ? 1.45 : 1.05, i % 2 === 0 ? "#fff4bd" : "#dcfbff");
        }
      } else {
        // Serene drifting sacred snow-gold starlight motes & faint frost hoof mist while striding
        for (let i = 0; i < 4; i++) {
          const t = (time * 0.85 + i * 0.25 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * 0.72;
          const mx = x + (i - 1.5) * 5.2 * scale + Math.sin(time * 2.4 + i * 1.7) * 2;
          const my = y - 8 * scale - t * 18 * scale;
          diamond(ctx, mx, my, i % 2 === 0 ? 1.15 : 0.85, i % 2 === 0 ? "#fff4c2" : "#cdf7ff");
        }
        const mist = (time * 1.15 + seed) % 1;
        ctx.globalAlpha = Math.sin(mist * Math.PI) * 0.45;
        pixelEllipse(ctx, x - dir * (6 + mist * 6) * scale, y + 1, (2.2 + mist * 2.5) * scale, 1.3 * scale, "#dcf8ff");
      }
      ctx.restore();
      return;
    }

    case "frost-mammoth": {
      ctx.save();
      const rearing = enemy.melee?.style === "quake" && time < enemy.melee.impact;
      if (rearing) {
        // Surging frost shards & roaring breath mist as the mammoth rears up for its twin-foot quake.
        for (let i = 0; i < 4; i++) {
          const t = (time * 2.4 + i * 0.25 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * 0.92;
          const ox = (i - 1.5) * 4.5 * scale;
          diamond(ctx, x + ox, y - 3 - t * 14 * scale, 1.2, i % 2 ? "#e9fdff" : "#80d6f2");
        }
      } else if (action?.phase === "exposed") {
        // Rising warm primal steam wisps from cracked glacier armor fissures.
        for (let i = 0; i < 3; i++) {
          const t = (time * 1.55 + i * .33 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .78;
          const sx = x + (i - 1) * 3.5 + Math.sin(time * 4 + i * 2) * 1.5;
          const sy = y - 10 * scale - t * 12;
          pixelEllipse(ctx, sx, sy, 1.4 + t * 1.4, 1 + t, i === 1 ? "#ffdf9e" : "#fff1cf");
        }
      } else {
        // Cold frost breath puffing from the snout & drifting glacier motes.
        const bt = (time * 1.05 + seed) % 1;
        ctx.globalAlpha = Math.sin(bt * Math.PI) * 0.65;
        pixelEllipse(ctx, x + dir * (10 + bt * 6) * scale, y - 9 * scale - bt * 4, 1.3 + bt * 1.5, 1 + bt, "#e6faff");
        for (let i = 0; i < 2; i++) {
          const t = (time * .75 + i * .5 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .65;
          diamond(ctx, x + (i === 0 ? -6 : 6) * scale, y - 12 * scale - t * 8, .85, "#ccf6ff");
        }
      }
      ctx.restore();
      return;
    }

    case "snowbrush-fox": {
      ctx.save();
      const sweeping = action !== undefined;
      if (sweeping) {
        // Brush-tail sweep: a low directional mist arc instead of a full ring.
        for (let i = 0; i < 5; i++) {
          const t = (time * 1.8 + i * .16 + seed) % 1;
          const a = -1.0 + i * .5;
          const sx = x - dir * (3 + t * 8) + Math.cos(a) * (2 + t * 4);
          const sy = y - 5 * scale + Math.sin(a) * 2.4 - t * 4;
          ctx.globalAlpha = (1 - t) * .72;
          if (i % 2 === 0) diamond(ctx, sx, sy, 1, "#ffffff");
          else pixelEllipse(ctx, sx, sy, 1.5 + t, 1.1, "#e8ccf2");
        }
        for (let i = 0; i < 4; i++) {
          const t = (time * 1.9 + i * .25 + seed) % 1;
          const a = time * 3.2 + i * 1.57 + seed;
          const mx = x - dir * 4 + Math.cos(a) * (4 + t * 8);
          const my = y - 7 * scale + Math.sin(a) * 3 - t * 6;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .88;
          if (i % 2 === 0) diamond(ctx, mx, my, 1, "#ffffff");
          else pixelEllipse(ctx, mx, my, 1.5, 1.1, "#e8ccf2");
        }
      } else {
        // Subtle drifting snow-sparkle motes trailing off the fluffy brush tail.
        for (let i = 0; i < 2; i++) {
          const t = (time * 1.2 + i * .5 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .7;
          box(ctx, x - dir * (7 + t * 5) * scale, y - 7 * scale - t * 5, 1, 1, i === 0 ? "#ffffff" : "#e8ccf2");
        }
      }
      ctx.restore();
      return;
    }

    case "ice-sail": {
      ctx.save();
      const turning = enemy.age < (enemy.turnBurstUntil ?? 0) || (enemy.turnAt !== undefined && enemy.age - enemy.turnAt < 0.28);
      const dx = enemy.facing === "east" ? 1 : enemy.facing === "west" ? -1 : 0;
      const dy = enemy.facing === "south" ? 1 : enemy.facing === "north" ? -1 : 0;
      // The tail sail leaves two trails of snow through the turn.
      for (let i = 0; i < (turning ? 4 : 2); i++) {
        const t = (time * (turning ? 2.6 : 1.7) + i * .24 + seed) % 1;
        const spread = (i % 2 ? 1 : -1) * (turning ? 3 + t * 3 : 1) * scale;
        const distance = (turning ? 7 + t * 10 : 6 + t * 5) * scale;
        const wx = x - dx * distance - dy * spread;
        const wy = y - dy * distance + dx * spread - 2;
        ctx.globalAlpha = (1 - t) * (turning ? .9 : .65);
        if (turning && i === 0) diamond(ctx, wx, wy, 1.1, "#e8fdff");
        else box(ctx, wx, wy, 1.4, .9, "#9ee4f7");
      }
      ctx.restore();
      return;
    }

    case "ore-crawler": {
      ctx.save();
      const sp = (time * 2.2 + seed) % 1;
      ctx.globalAlpha = (1 - sp) * .78;
      box(ctx, x - dir * (4 + sp * 6) * scale, y - 3 - sp * 3, 1, 1, "#ffcf73");
      ctx.restore();
      return;
    }

    case "frost-ray": {
      if (leap <= 0) return;
      ctx.save();
      const dx = enemy.facing === "east" ? 1 : enemy.facing === "west" ? -1 : 0;
      const dy = enemy.facing === "south" ? 1 : enemy.facing === "north" ? -1 : 0;
      for (const side of [-1, 1]) {
        const phase = (time * 1.2 + seed + (side + 1) * .17) % 1;
        const trail = (6 + phase * 5) * scale;
        const drift = side * (6 + phase * 3) * scale;
        ctx.globalAlpha = Math.sin(phase * Math.PI) * .65;
        box(ctx, x - trail * dx - dy * drift, y - leap - 6 * scale - trail * dy + dx * drift,
          1.5, 1, "#c4eef0");
      }
      ctx.restore();
      return;
    }

    case "mire-treant": {
      ctx.save();
      if (action) {
        // Pollen spirals out of the boughs; no circular halo around the body.
        for (let i = 0; i < 5; i++) {
          const t = (time * 1.7 + i * .19 + seed) % 1;
          const a = time * 2.2 + i * 1.26 + seed;
          const r = wide * (.55 + t * .85);
          ctx.globalAlpha = (1 - t) * .82;
          if (i % 2 === 0) diamond(ctx, x + Math.cos(a) * r, y - 20 * scale + Math.sin(a) * r * .32, 1, "#f4ffa8");
          else box(ctx, x + Math.cos(a) * r, y - 20 * scale + Math.sin(a) * r * .32, 1.2, 1.2, "#9ef086");
        }
      } else {
        for (let i = 0; i < 2; i++) {
          const t = (time * .75 + i * .5 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .58;
          box(ctx, x + Math.sin(time * 2.1 + i * 2.7 + seed) * (wide * .8), y - 19 * scale - t * 8,
            1.1, 1.1, i === 0 ? "#c9f584" : "#f7db7c");
        }
      }
      ctx.restore();
      return;
    }

    case "mire-elder": {
      ctx.save();
      if (enemy.mireCast) {
        // Rising emerald-gold summoning spores & root motes around the elder's feet and crown
        for (let i = 0; i < 7; i++) {
          const t = (time * 1.85 + i * .14 + seed) % 1;
          const a = time * 2.5 + i * .9 + seed;
          const r = wide * (.48 + t * .85);
          const py = y - 2 - t * (26 * scale);
          ctx.globalAlpha = (1 - t) * .9;
          if (i % 2 === 0) diamond(ctx, x + Math.cos(a) * r, py, 1.3, "#f6ffc2");
          else box(ctx, x + Math.cos(a) * r, py, 1.5, 1.5, i % 3 === 0 ? "#ffd975" : "#9cf284");
        }
      } else {
        // Gentle warm lantern sparks & canopy pollen drifting upward
        for (let i = 0; i < 3; i++) {
          const t = (time * .65 + i * .33 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .68;
          const px = x + Math.sin(time * 1.9 + i * 2.1 + seed) * (wide * .75);
          const py = y - 16 * scale - t * 12;
          if (i === 0) diamond(ctx, px, py, 1.1, "#ffe89e");
          else box(ctx, px, py, 1.2, 1.2, i === 1 ? "#b6f283" : "#f5c96b");
        }
      }
      ctx.restore();
      return;
    }

    case "mire-matriarch": {
      ctx.save();
      const count = action ? 9 : 4;
      for (let i = 0; i < count; i++) {
        const t = (time * (action ? 1.9 : .62) + i * .13 + seed) % 1;
        const drift = Math.sin(time * (action ? 2.8 : 1.5) + i * 1.7 + seed);
        const px = x + drift * wide * (action ? .7 + t * .6 : .72);
        const py = y - 5 - t * (action ? 45 : 30) * scale;
        ctx.globalAlpha = Math.sin(t * Math.PI) * (action ? .88 : .56);
        if (i % 3 === 0) diamond(ctx, px, py, action ? 1.35 : .95, action ? "#f3ffc2" : "#d6e69a");
        else box(ctx, px, py, 1.15, 1.15, action ? "#d3ed87" : "#aebf7c");
      }
      ctx.restore();
      return;
    }

    case "spore-pod": {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const t = (time * .7 + i * .33 + seed) % 1;
        const a = time * 1.3 + i * 2.1 + seed;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .7;
        diamond(ctx, x + Math.cos(a) * wide * .8, y - 9 * scale - t * 12 * scale,
          1 + (i === 0 ? .4 : 0), i === 0 ? "#f2ffbf" : "#c6df83");
      }
      ctx.restore();
      return;
    }

    case "mire-croc": {
      ctx.save();
      if (action) {
        // Mud fissures and clods spread along the ground; no glowing ring.
        for (let i = 0; i < 6; i++) {
          const a = i * 1.05 + seed;
          const length = (6 + (i % 3) * 4) * scale;
          const fade = .45 + .25 * Math.sin(time * 8 + i);
          ctx.globalAlpha = fade;
          linePixels(ctx, x, y + 1, x + Math.cos(a) * length, y + Math.sin(a) * length * .42,
            i % 2 ? "#6d7f72" : "#8d9b82", .8);
          if (i % 2 === 0) box(ctx, x + Math.cos(a) * length, y + Math.sin(a) * length * .42 - 1, 1.5, 1, "#a4b9a2");
        }
      } else {
        const t = (time * .9 + seed) % 1;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .45;
        box(ctx, x + dir * 6 * scale, y - 3 - t * 4, 1, 1, "#a7b5a6");
      }
      ctx.restore();
      return;
    }

    case "vine-viper": {
      ctx.save();
      const spent = enemy.age < (enemy.quillsRegrowAt ?? 0);
      if (action?.phase === "windup") {
        const t = action.progress;
        ctx.globalAlpha = .48 + t * .42;
        // Orbit glowing venom glint below the jaw/throat so the viper's amber eye stays crisp
        diamond(ctx, x + dir * 9.5 * scale, y - 9.5 * scale, 1.0 + t * .55, "#d8ff7a");
      } else if (!spent) {
        const t = (time * 1.1 + seed) % 1;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .65;
        box(ctx, x + dir * 7 * scale + Math.sin(time * 3 + seed) * 1.8, y - 9 * scale + t * 5, 1.1, 1.4, "#aef266");
      } else {
        const t = (time * .8 + seed) % 1;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .35;
        box(ctx, x + Math.sin(time * 3 + seed) * 3, y - 12 * scale - t * 5, 1, 1, "#84947a");
      }
      ctx.restore();
      return;
    }

    case "mire-mycelid": {
      ctx.save();
      for (let i = 0; i < 2; i++) {
        const t = (time * .7 + i * .5 + seed) % 1;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .62;
        box(ctx, x + Math.sin(time * 2 + i * 2.5) * (wide * .6), y - 18 * scale - t * 9, 1.2, 1.2,
          i === 0 ? "#c8ec7c" : "#957b99");
      }
      ctx.restore();
      return;
    }

    case "bloat-sporer": {
      ctx.save();
      if (action) {
        // Soft spore veil dome over the protected batch instead of a hard halo.
        const t = (time * 1.8 + seed) % 1;
        ctx.globalAlpha = (1 - t) * .5;
        const spread = wide * (.85 + t * 1.0);
        for (let i = 0; i <= 12; i++) {
          const a = Math.PI + i * (Math.PI / 12);
          box(ctx, x + Math.cos(a) * spread, y - leap - 4 + Math.sin(a) * spread * .55,
            1.5, 1, i % 3 === 0 ? "#f2ffc0" : "#a9c96e");
        }
        for (let i = 0; i < 3; i++) {
          const t2 = (time * 1.6 + i * .27 + seed) % 1;
          ctx.globalAlpha = Math.sin(t2 * Math.PI) * .8;
          diamond(ctx, x + (i - 1) * 5.5 * scale, y - leap - 13 * scale - t2 * 8, .9, "#dcf888");
        }
      }
      const burst = ENEMIES["bloat-sporer"].gasBurst;
      if (burst && (enemy.burnLife ?? 0) > 0) {
        // Airborne sac fuse glow & sparks (ground blast radius is rendered on the ground layer).
        const pulse = .55 + .45 * Math.sin(time * 11 + seed);
        ctx.globalAlpha = .72 + pulse * .25;
        diamond(ctx, x, y - leap - 18 * scale, 1.3 + pulse * .75, "#ffe29a");
        for (let i = 0; i < 3; i++) {
          const t2 = (time * 2.4 + i * .3 + seed) % 1;
          ctx.globalAlpha = (1 - t2) * .85;
          box(ctx, x + (i - 1) * 4 * scale, y - leap - 12 * scale - t2 * 8, 1.1, 1.1, "#ff9f6a");
        }
      } else {
        for (let i = 0; i < 2; i++) {
          const t = (time * 1.1 + i * .5 + seed) % 1;
          ctx.globalAlpha = Math.sin(t * Math.PI) * .65;
          box(ctx, x + (i === 0 ? -5 : 5) * scale, y - leap - 16 * scale - t * 7, 1.2, 1.2, "#dcf888");
        }
      }
      ctx.restore();
      return;
    }

    default:
      return;
  }
}
