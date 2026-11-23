import type { Facing } from "../engine/formation.ts";
import { canvas2d } from "./canvas.ts";
import { ORIGIN_Y, refinePixelArt, SIZE } from "./pixel-sprite.ts";
import pineHopper from "./enemy-art/pine-hopper.png?inline";
import stumpSpirit from "./enemy-art/stump-spirit.png?inline";
import reedCrab from "./enemy-art/reed-crab.png?inline";
import ferrySnail from "./enemy-art/ferry-snail.png?inline";
import lampMole from "./enemy-art/lamp-mole.png?inline";
import slagCart from "./enemy-art/slag-cart.png?inline";
import frostOwl from "./enemy-art/frost-owl.png?inline";
import mossBadger from "./enemy-art/moss-badger.png?inline";
import mirrorShrimp from "./enemy-art/mirror-shrimp.png?inline";
import rivetMite from "./enemy-art/rivet-mite.png?inline";
import frostHare from "./enemy-art/frost-hare.png?inline";
import frostRay from "./enemy-art/frost-ray.png?inline";

const sources = {
  "pine-hopper": pineHopper,
  "stump-spirit": stumpSpirit,
  "reed-crab": reedCrab,
  "ferry-snail": ferrySnail,
  "lamp-mole": lampMole,
  "slag-cart": slagCart,
  "frost-owl": frostOwl,
  "moss-badger": mossBadger,
  "mirror-shrimp": mirrorShrimp,
  "rivet-mite": rivetMite,
  "frost-hare": frostHare,
  "frost-ray": frostRay,
};
export type AtlasEnemy = keyof typeof sources;

const sheets = new Map<AtlasEnemy, HTMLImageElement>();
const frames = new Map<string, HTMLCanvasElement>();
const columns: Record<Facing, number> = {
  east: 0,
  south: 1,
  west: 2,
  north: 3,
};
const motion: Partial<Record<AtlasEnemy, { heights: number[]; sway: number[] }>> = {
  "pine-hopper": { heights: [64, 57, 65, 62], sway: [0, 0, 0, 0] },
  "stump-spirit": { heights: [64, 63, 64, 63], sway: [0, -1, 0, 1] },
  "reed-crab": { heights: [64, 62, 63, 62], sway: [0, -1, 0, 1] },
  "lamp-mole": { heights: [64, 62, 63, 62], sway: [0, 0, 1, 0] },
};

// Directional bounce light and highlights are tuned by material, with the painted hues intact.
const light: Partial<Record<AtlasEnemy, {shadow: readonly number[]; highlight: readonly number[]}>> = {
  "pine-hopper": {shadow: [-8, -2, 7], highlight: [18, 10, 0]},
  "stump-spirit": {shadow: [-9, 1, 6], highlight: [14, 17, 5]},
  "reed-crab": {shadow: [-11, -1, 8], highlight: [14, 17, 3]},
  "ferry-snail": {shadow: [5, -3, 13], highlight: [14, 18, 7]},
  "lamp-mole": {shadow: [-5, 3, 12], highlight: [22, 12, 0]},
  "slag-cart": {shadow: [-8, 0, 9], highlight: [22, 12, 0]},
  "frost-owl": {shadow: [0, 2, 13], highlight: [12, 12, 7]},
  "frost-hare": {shadow: [0, 2, 13], highlight: [12, 12, 7]},
};

function lightAtlasFrame(ctx: CanvasRenderingContext2D, type: AtlasEnemy) {
  const palette = light[type];
  if (!palette) return;
  const image = ctx.getImageData(0, 0, SIZE, SIZE);
  const { data } = image;
  const { shadow, highlight } = palette;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      if (data[i + 3] < 220) continue;
      const luma = (data[i] * 3 + data[i + 1] * 6 + data[i + 2]) / 10;
      const rim = y > 1 && data[i - SIZE * 4 + 3] > 220 && data[i - SIZE * 8 + 3] < 100;
      const lit = Math.max(0, (luma - 85) / 170) * .8 + (rim && luma > 70 ? .42 : 0);
      const muted = Math.max(0, 1 - luma / 145);
      for (let c = 0; c < 3; c++) data[i + c] += muted * shadow[c] + lit * highlight[c];
    }
  }
  ctx.putImageData(image, 0, 0);
}

export function hasEnemyAtlas(type: string): type is AtlasEnemy {
  return Object.hasOwn(sources, type);
}

export async function loadEnemyAtlases() {
  await Promise.all(
    (Object.keys(sources) as AtlasEnemy[]).map(async (type) => {
      const image = new Image();
      image.src = sources[type];
      await image.decode();
      sheets.set(type, image);
    }),
  );
}

export function atlasEnemySprite(
  type: AtlasEnemy,
  frame: number,
  facing: Facing,
  active: boolean,
) {
  const key = type + "/" + frame + "/" + facing + "/" + Number(active);
  const cached = frames.get(key);
  if (cached) return cached;
  const image = sheets.get(type);
  if (!image) throw new Error("Enemy art not loaded: " + type);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas2d(canvas);
  const pose = motion[type];
  const row = image.height === SIZE * 8 ? frame + (active ? 4 : 0) : active ? 1 : 0;
  const height = pose?.heights[frame] ?? SIZE;
  const y = ORIGIN_Y - Math.round((ORIGIN_Y * height) / SIZE);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    columns[facing] * SIZE,
    row * SIZE,
    SIZE,
    SIZE,
    pose?.sway[frame] ?? 0,
    y,
    SIZE,
    height,
  );
  lightAtlasFrame(ctx, type);
  const refined = refinePixelArt(canvas);
  frames.set(key, refined);
  return refined;
}
