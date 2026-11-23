// Secondary motion and lighting for towers: sprite shading, contact shadows, build and upgrade
// transitions, squash-and-stretch around firing, smoke, light pools and tier flourishes.
// Everything here is derived from battle time, so no particle state is stored.
import type { Point, TowerId } from "../engine/types.ts";
import { box, canvas2d } from "./canvas.ts";
import { diamond, linePixels } from "./animation.ts";

export const BUILD_SECONDS = 0.62;
export const UPGRADE_SECONDS = 0.78;
export const UPGRADE_SWAP = 0.2;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Damped spring: starts at 1, oscillates and settles at 0. */
export function spring(t: number, frequency = 30, damping = 9) {
  return t < 0 ? 0 : Math.exp(-t * damping) * Math.cos(t * frequency);
}

// ---------------------------------------------------------------------------
// Cached sprite passes
// ---------------------------------------------------------------------------

const lum = (d: Uint8ClampedArray, i: number) => d[i] * .3 + d[i + 1] * .55 + d[i + 2] * .15;

/**
 * Bevel the authored sprite with a top-left key light: lit inner edges warm up, edges that face
 * away cool down, and the lower body receives a little ambient occlusion. Dark outline pixels
 * are left untouched so silhouettes stay crisp.
 */
export function shadeSprite(source: HTMLCanvasElement) {
  const { width, height } = source;
  const src = canvas2d(source).getImageData(0, 0, width, height);
  const d = src.data;
  const out = new Uint8ClampedArray(d);
  let top = height, bottom = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (d[(y * width + x) * 4 + 3] > 0) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  if (bottom <= top) return source;
  const solid = (x: number, y: number, l: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    const j = (y * width + x) * 4;
    if (d[j + 3] < 200) return false;
    const n = lum(d, j);
    return !(n < 58 && n < l - 28);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (d[i + 3] < 200) continue;
      const l = lum(d, i);
      if (l < 58) continue;
      const v = (y - top) / (bottom - top);
      // Soft vertical light: brighter crown, darker footing.
      let shift = 12 - v * 26;
      let warm = 0;
      const litEdge = !solid(x, y - 1, l) || !solid(x, y - 2, l) || !solid(x - 1, y - 1, l) || !solid(x - 2, y, l);
      const shadeEdge = !solid(x, y + 1, l) || !solid(x, y + 2, l) || !solid(x + 1, y + 1, l) || !solid(x + 2, y, l);
      if (litEdge && !shadeEdge) { shift += 40; warm = 10; }
      else if (shadeEdge && !litEdge) { shift -= 30; warm = -7; }
      out[i] = d[i] + shift + warm;
      out[i + 1] = d[i + 1] + shift;
      out[i + 2] = d[i + 2] + shift - warm * 1.2;
    }
  }
  const image = document.createElement("canvas");
  image.width = width;
  image.height = height;
  canvas2d(image).putImageData(new ImageData(out, width, height), 0, 0);
  return image;
}

const silhouettes = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
/** A flat light silhouette of a sprite, used for upgrade and build flashes. */
export function silhouette(source: HTMLCanvasElement, color = "#fff7dc") {
  const cached = silhouettes.get(source);
  if (cached) return cached;
  const image = document.createElement("canvas");
  image.width = source.width;
  image.height = source.height;
  const ctx = canvas2d(image);
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, image.width, image.height);
  silhouettes.set(source, image);
  return image;
}

// ---------------------------------------------------------------------------
// Ground layer
// ---------------------------------------------------------------------------

/** Stepped pixel ellipse, so soft shapes still read as pixel art. */
export function pixelEllipse(
  ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, step = .5,
) {
  for (let row = -ry; row <= ry; row += step) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (row / ry) ** 2)) / step) * step;
    if (half > 0) box(ctx, x - half, y + row, half * 2, step, color);
  }
}

export function drawContactShadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, lift: number) {
  const squeeze = 1 / (1 + Math.max(0, lift) * .08);
  ctx.save();
  ctx.globalAlpha = .2 * squeeze;
  pixelEllipse(ctx, x + .5, y + 3, width * squeeze + 2, 2.6 * squeeze, "#10160f");
  ctx.globalAlpha = .22 * squeeze;
  pixelEllipse(ctx, x + .5, y + 3, width * .72 * squeeze, 1.7 * squeeze, "#10160f");
  ctx.restore();
}

const LIGHT: Partial<Record<TowerId, { color: string; rx: number; ry: number; speed: number }>> = {
  ember: { color: "#ff9b4f", rx: 14, ry: 6, speed: 7.3 },
  frost: { color: "#9fe6ff", rx: 13, ry: 5.5, speed: 2.1 },
  storm: { color: "#b49cff", rx: 12, ry: 5, speed: 3.4 },
  prism: { color: "#d7ffc7", rx: 11, ry: 4.5, speed: 1.6 },
};

/** Colored light pool on the ground under glowing towers, flaring when they fire. */
export function drawLightPool(
  ctx: CanvasRenderingContext2D, type: TowerId, x: number, y: number, beat: number, flare: number, focus: number,
) {
  const light = LIGHT[type];
  if (!light) return;
  const flicker = type === "ember"
    ? .82 + .1 * Math.sin(beat * light.speed) + .08 * Math.sin(beat * 17.3)
    : .88 + .12 * Math.sin(beat * light.speed);
  const strength = Math.min(1.6, flicker + flare * .7 + focus * .5);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [scale, alpha] of [[1, .05], [.7, .06], [.42, .07]] as const) {
    ctx.globalAlpha = alpha * strength;
    pixelEllipse(ctx, x, y + 2, light.rx * scale * (1 + flare * .2), light.ry * scale, light.color);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Lifecycle poses
// ---------------------------------------------------------------------------

export interface Squash { sx: number; sy: number; lift: number; alpha: number }

/** Drop-in from above, land with squash, then a damped wobble. */
export function buildPose(age: number): Squash {
  if (age >= BUILD_SECONDS) return { sx: 1, sy: 1, lift: 0, alpha: 1 };
  const fall = .17;
  if (age < fall) {
    const t = age / fall;
    return { sx: .9, sy: 1.12, lift: (1 - t * t) * 12, alpha: clamp01(t * 2.2) };
  }
  const wobble = spring(age - fall, 27, 8.5);
  return { sx: 1 + wobble * .2, sy: 1 - wobble * .26, lift: 0, alpha: 1 };
}

/** Old form squeezes down, swaps at UPGRADE_SWAP, and the new form springs up taller. */
export function upgradePose(age: number): Squash {
  if (age >= UPGRADE_SECONDS) return { sx: 1, sy: 1, lift: 0, alpha: 1 };
  if (age < UPGRADE_SWAP) {
    const t = age / UPGRADE_SWAP;
    const ease = t * t;
    return { sx: 1 + ease * .12, sy: 1 - ease * .18, lift: 0, alpha: 1 };
  }
  const wobble = spring(age - UPGRADE_SWAP, 24, 7);
  return { sx: 1 - wobble * .14, sy: 1 + wobble * .24, lift: Math.max(0, wobble) * 2.5, alpha: 1 };
}

/** Anticipation while charging, kick when releasing. */
export function firePose(type: TowerId, path: string | null, charge: number, age: number): Squash {
  const heavy = type === "cannon" ? (path === "blast" ? .13 : .1)
    : type === "hail-mortar" ? (path === "avalanche" ? .16 : .12)
    : type === "ballista" || type === "glaze-lance" ? .075 : type === "storm" || type === "ember" ? .06 : .045;
  if (charge > 0) {
    const c = charge * charge;
    return { sx: 1 + c * heavy * .45, sy: 1 - c * heavy * .6, lift: 0, alpha: 1 };
  }
  if (age > .5) return { sx: 1, sy: 1, lift: 0, alpha: 1 };
  const kick = spring(age, 34, 10);
  return { sx: 1 - kick * heavy * .5, sy: 1 + kick * heavy * .7, lift: 0, alpha: 1 };
}

export function combine(a: Squash, b: Squash): Squash {
  return { sx: a.sx * b.sx, sy: a.sy * b.sy, lift: a.lift + b.lift, alpha: a.alpha * b.alpha };
}

// ---------------------------------------------------------------------------
// Particles and flourishes
// ---------------------------------------------------------------------------

/** Dust kicked out on both sides when a tower lands or upgrades. */
export function drawDust(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, spread = 1, color = "#d9c49b") {
  if (t <= 0 || t >= 1) return;
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1;
    const speed = .6 + hash(i) * .6;
    const px = x + side * (6 + t * 13 * speed) * spread;
    const py = y + 3 - Math.sin(t * Math.PI) * (2 + hash(i + 9) * 4) - t * 2;
    const size = (1.6 + hash(i + 3) * 1.6) * (1 - t * .5);
    ctx.globalAlpha = (1 - t) * .75;
    pixelEllipse(ctx, px, py, size, size * .75, i % 3 ? color : "#f2e4c3");
  }
  ctx.restore();
}

/** Column of light, rising sparks and a pulse ring for an upgrade. */
export function drawUpgradeGlow(
  ctx: CanvasRenderingContext2D, x: number, y: number, age: number, accent: string, height: number,
) {
  const t = age / UPGRADE_SECONDS;
  if (t >= 1) return;
  ctx.save();
  // Gathering motes before the swap.
  if (age < UPGRADE_SWAP) {
    const g = age / UPGRADE_SWAP;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + g * 2;
      const r = 16 * (1 - g) + 2;
      ctx.globalAlpha = .4 + g * .6;
      diamond(ctx, x + Math.cos(a) * r, y - height * .45 + Math.sin(a) * r * .55, 1, i % 2 ? "#fff6d6" : accent);
    }
  } else {
    const p = (age - UPGRADE_SWAP) / (UPGRADE_SECONDS - UPGRADE_SWAP);
    // Beam.
    const beamAlpha = (1 - p) * (1 - p) * .4;
    ctx.globalCompositeOperation = "lighter";
    for (const [w, a] of [[7, .3], [3.5, .55], [1.5, 1]] as const) {
      ctx.globalAlpha = beamAlpha * a;
      box(ctx, x - w / 2, y - height - 10 - p * 8, w, height + 12 + p * 8, accent);
    }
    ctx.globalCompositeOperation = "source-over";
    // Ring at the base.
    ctx.globalAlpha = 1 - p;
    const r = 6 + p * 14;
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * Math.PI * 2;
      box(ctx, x + Math.cos(a) * r - .5, y + 2 + Math.sin(a) * r * .38 - .5, 1, 1, i % 2 ? accent : "#fff3c9");
    }
    // Sparks.
    for (let i = 0; i < 12; i++) {
      const delay = hash(i + 40) * .3;
      const q = clamp01((p - delay) / (1 - delay));
      if (q <= 0 || q >= 1) continue;
      const a = hash(i) * Math.PI * 2;
      const r2 = 4 + hash(i + 5) * 9;
      ctx.globalAlpha = 1 - q;
      const sx = x + Math.cos(a + q * 3) * r2;
      const sy = y - 4 - q * (height + 10) * (.6 + hash(i + 7) * .5);
      if (i % 3 === 0) diamond(ctx, sx, sy, 1, "#fffbe8");
      else box(ctx, sx, sy, 1, 1, i % 2 ? accent : "#ffe9a8");
    }
  }
  ctx.restore();
}

/** Muzzle smoke that pushes out along the heading, then rises and thins. */
export function drawMuzzleSmoke(
  ctx: CanvasRenderingContext2D, [mx, my]: Point, [dx, dy]: Point, age: number, amount: number, seed: number,
) {
  const life = .85;
  if (age < 0 || age > life) return;
  ctx.save();
  const count = Math.round(4 + amount * 4);
  for (let i = 0; i < count; i++) {
    const delay = i * .03;
    const t = (age - delay) / (life - delay);
    if (t <= 0 || t >= 1) continue;
    const push = (1 - (1 - t) ** 3) * (4 + amount * 6) * (.7 + hash(seed + i) * .6);
    const swirl = Math.sin(t * 5 + i) * 1.5;
    const px = mx + dx * push + (hash(seed + i + 3) - .5) * 4 - dy * swirl;
    const py = my + dy * push * .67 - t * (6 + amount * 4) + dx * swirl * .4;
    const size = (1.2 + t * (2.4 + amount * 1.6)) * (.8 + hash(seed + i + 9) * .4);
    ctx.globalAlpha = (1 - t) * (1 - t) * .55;
    pixelEllipse(ctx, px, py, size, size * .85, t < .25 ? "#e8d3b0" : i % 2 ? "#8f8a82" : "#aaa49b");
  }
  ctx.restore();
}

/** Directional muzzle flash: bright core plus three rays along the heading. */
export function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D, [mx, my]: Point, [dx, dy]: Point, age: number, accent: string, size: number,
) {
  const life = .1;
  if (age < 0 || age > life) return;
  const t = age / life;
  const angle = Math.atan2(dy * .67, dx);
  ctx.save();
  ctx.globalAlpha = 1 - t * .6;
  for (const [offset, length, color] of [[-.55, .55, accent], [.55, .55, accent], [0, 1, "#fff2c4"]] as const) {
    const a = angle + offset;
    const reach = size * length * (1.4 + t * .8);
    linePixels(ctx, mx, my, mx + Math.cos(a) * reach, my + Math.sin(a) * reach, color, .6, offset ? .75 : 1.25);
  }
  diamond(ctx, mx, my, Math.max(1, Math.round(size * (1 - t) * .7)), accent);
  box(ctx, mx - .5, my - .5, 1.5, 1.5, "#fffdf0");
  ctx.restore();
}

/** Bowstring snap: two short streaks for mechanical launchers. */
export function drawStringSnap(ctx: CanvasRenderingContext2D, [mx, my]: Point, [dx, dy]: Point, age: number) {
  if (age < 0 || age > .12) return;
  const t = age / .12;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  for (const side of [-1, 1]) {
    const ox = -dy * side * (2 + t * 3), oy = dx * side * (2 + t * 3) * .67;
    linePixels(ctx, mx + ox - dx * 2, my + oy - dy * 1.3, mx + ox + dx * (2 + t * 5), my + oy + dy * (1.3 + t * 3.3),
      "#fff3d2", .6, .6);
  }
  ctx.restore();
}

/** Ground shock ring for heavy guns. */
export function drawRecoilDust(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, strength: number) {
  const life = .42;
  if (age < 0 || age > life) return;
  const t = age / life;
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    const px = x + side * (8 + t * 8 * strength + hash(i) * 3);
    const py = y + 3 - Math.sin(t * Math.PI) * (1.5 + hash(i + 2) * 2);
    ctx.globalAlpha = (1 - t) * .6;
    pixelEllipse(ctx, px, py, 1.2 + t * 1.5, 1, "#cdb48c");
  }
  ctx.restore();
}

/** Tier 2–3 pennant fluttering in the wind; tier 4 towers get rising motes instead. */
export function drawPennant(
  ctx: CanvasRenderingContext2D, x: number, y: number, beat: number, color: string, tier: number,
) {
  const length = tier >= 3 ? 7 : 5;
  const pole = tier >= 3 ? 8 : 6;
  box(ctx, x, y - pole, .75, pole, "#4a3a2c");
  box(ctx, x - .25, y - pole - .75, 1.25, 1, "#e6c98b");
  for (let i = 0; i < length; i++) {
    const wave = Math.sin(beat * 6 - i * .9) * (i / length) * 1.3;
    const h = (tier >= 3 ? 3 : 2.25) * (1 - i / (length + 1.5));
    box(ctx, x + .75 + i, y - pole + wave + (3 - h) * .2, 1, h, i === 0 ? "#3d3127" : color);
    if (i > 0 && i < length - 1) box(ctx, x + .75 + i, y - pole + wave + (3 - h) * .2, 1, .5, "#ffffff40");
  }
}

export function drawMasteryMotes(ctx: CanvasRenderingContext2D, x: number, y: number, beat: number, accent: string, seed: number) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const t = (beat * .35 + hash(seed + i) ) % 1;
    const a = hash(seed + i * 7) * Math.PI * 2;
    const r = 8 + hash(seed + i * 3) * 5;
    ctx.globalAlpha = Math.sin(t * Math.PI) * .8;
    box(ctx, x + Math.cos(a) * r, y + 1 + Math.sin(a) * r * .35 - t * 16, 1, 1, i % 2 ? accent : "#fff4cf");
  }
  ctx.restore();
}

/** Small per-type idle details. */
export function drawIdleDetail(
  ctx: CanvasRenderingContext2D, type: TowerId, x: number, y: number, beat: number, age: number, seed: number,
) {
  ctx.save();
  if (type === "ember") {
    // Thin heat wisps just above the flame.
    for (let i = 0; i < 2; i++) {
      const t = (beat * .7 + hash(seed + i)) % 1;
      ctx.globalAlpha = (1 - t) * t * .7;
      pixelEllipse(ctx, x + Math.sin(t * 6 + i) * 1.5 + (i - .5) * 2, y - 23 - t * 7, .7 + t * 1.3, .7 + t, "#a59a90");
    }
  } else if (type === "frost" || type === "hail-mortar" || type === "glaze-lance") {
    // Cold motes sinking around the plinth.
    for (let i = 0; i < 5; i++) {
      const t = (beat * .3 + hash(seed + i)) % 1;
      const side = i % 2 ? 1 : -1;
      ctx.globalAlpha = Math.sin(t * Math.PI) * .7;
      box(ctx, x + side * (4 + t * 6 + hash(seed + i * 3) * 3), y - 14 + t * 14, .75, .75, i % 2 ? "#e6fbff" : "#a9e3f2");
    }
  } else if (type === "storm") {
    // Static crawling over the frame every so often.
    const window = (beat * .9 + hash(seed)) % 1;
    if (window < .12 || age < .3) {
      const s = Math.floor(beat * 24);
      const x0 = x + (hash(s) - .5) * 10, y0 = y - 6 - hash(s + 1) * 16;
      const x1 = x0 + (hash(s + 2) - .5) * 6, y1 = y0 - 2 - hash(s + 3) * 4;
      ctx.globalAlpha = .9;
      linePixels(ctx, x0, y0, x1, y1, "#d9ccff", .6, .75);
      box(ctx, x1 - .25, y1 - .25, 1, 1, "#ffffff");
    }
  } else if (type === "prism") {
    // A glint sweeping across the lens.
    const t = (beat * .33 + hash(seed)) % 1;
    if (t < .18) {
      const p = t / .18;
      ctx.globalAlpha = Math.sin(p * Math.PI) * .9;
      linePixels(ctx, x - 3 + p * 6, y - 23, x - 5 + p * 6, y - 17, "#ffffff", .5, .75);
    }
  } else if (type === "cannon") {
    // Lingering barrel smoke for a while after a shot.
    if (age > .3 && age < 2.4) {
      const fade = 1 - (age - .3) / 2.1;
      for (let i = 0; i < 2; i++) {
        const t = (beat * .8 + i * .5) % 1;
        ctx.globalAlpha = (1 - t) * .3 * fade;
        pixelEllipse(ctx, x + Math.sin(t * 4 + i) * 1.5, y - 18 - t * 9, .8 + t * 1.6, .8 + t * 1.3, "#9d978e");
      }
    }
  }
  ctx.restore();
}

/** World-space positions for tier pennants on the base (unspecialized) bodies. */
export const PENNANT_MOUNT: Partial<Record<TowerId, Point>> = {
  arrow: [-7, -17.5],
  cannon: [-8, -11],
  ballista: [-8, -16],
  net: [-8, -16],
  prism: [-7, -21],
};
