import type { Point } from "../engine/types.ts";
import { canvas2d } from "./canvas.ts";

export type Rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) => void;
export type Shape = (color: string, ...points: Point[]) => void;
export const SIZE = 64,
  ORIGIN_X = 28,
  ORIGIN_Y = 54;
const ART_PIXELS_PER_UNIT = 2;
export const SPRITE_DETAIL = 2;

// Split authored pixels into smaller color blocks while preserving the silhouette.
// This runs when the frame is cached, never in the battle drawing loop.
export function refinePixelArt(source: HTMLCanvasElement) {
  const { width, height } = source;
  const original = canvas2d(source).getImageData(0, 0, width, height).data;
  const image = document.createElement("canvas");
  image.width = width * SPRITE_DETAIL;
  image.height = height * SPRITE_DETAIL;
  const ctx = canvas2d(image);
  const refined = ctx.createImageData(image.width, image.height);
  const data = refined.data;
  const distance = (a: number, b: number) =>
    Math.abs(original[a] - original[b]) + Math.abs(original[a + 1] - original[b + 1])
      + Math.abs(original[a + 2] - original[b + 2]);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = (y * width + x) * 4;
      const alpha = original[pixel + 3];
      if (alpha === 0) continue;
      const seed = ((Math.imul(x + 31, 45737) ^ Math.imul(y + 19, 76963)) >>> 3) % 19;
      for (let dy = 0; dy < SPRITE_DETAIL; dy++) {
        for (let dx = 0; dx < SPRITE_DETAIL; dx++) {
          const out = ((y * SPRITE_DETAIL + dy) * image.width + x * SPRITE_DETAIL + dx) * 4;
          const nx = x + (dx ? 1 : -1);
          const ny = y + (dy ? 1 : -1);
          const horizontal = (y * width + nx) * 4;
          const vertical = (ny * width + x) * 4;
          let blend = 0;
          let grain = 0;
          if (alpha >= 240 && nx >= 0 && nx < width && ny >= 0 && ny < height
            && original[horizontal + 3] >= 240 && original[vertical + 3] >= 240) {
            if (distance(horizontal, vertical) < 28 && distance(pixel, horizontal) >= 30)
              blend = 0.42;
            else if (dx + dy === 0 && seed <= 3 && distance(pixel, horizontal) < 34)
              grain = seed === 0 ? -9 : 9;
          }
          for (let c = 0; c < 3; c++) {
            const base = original[pixel + c];
            const target = blend ? (original[horizontal + c] + original[vertical + c]) / 2 : base;
            data[out + c] = base + (target - base) * blend + grain;
          }
          data[out + 3] = alpha;
        }
      }
    }
  }
  ctx.putImageData(refined, 0, 0);
  return image;
}

export function paintSprite(draw: (rect: Rect, shape: Shape) => void, detail: 1 | 2 = 1) {
  const image = document.createElement("canvas");
  image.width = image.height = SIZE * detail;
  const ctx = canvas2d(image);
  ctx.scale(detail, detail);
  const rect: Rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + ORIGIN_X, y + ORIGIN_Y, w, h);
  };
  const shape: Shape = (color, ...points) => {
    const rows = points.map(([, y]) => y);
    const step = 1 / detail;
    for (let y = Math.floor(Math.min(...rows) * detail) / detail; y < Math.max(...rows); y += step) {
      const crossings: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i],
          [bx, by] = points[(i + 1) % points.length];
        const at = y + step / 2;
        if (at < Math.min(ay, by) || at >= Math.max(ay, by)) continue;
        crossings.push(Math.round((ax + ((bx - ax) * (at - ay)) / (by - ay)) * detail) / detail);
      }
      crossings.sort((a, b) => a - b);
      for (let i = 0; i < crossings.length; i += 2)
        rect(crossings[i], y, crossings[i + 1] - crossings[i], step, color);
    }
  };
  draw(rect, shape);
  return detail === SPRITE_DETAIL ? image : refinePixelArt(image);
}
export function stamp(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  x: number,
  y: number,
  scale = 1,
  facing = 1,
) {
  const unit = scale / ART_PIXELS_PER_UNIT;
  ctx.save();
  ctx.translate(Math.round(x * 2) / 2, Math.round(y * 2) / 2);
  ctx.scale(facing, 1);
  ctx.drawImage(
    image,
    -ORIGIN_X * unit,
    -ORIGIN_Y * unit,
    SIZE * unit,
    SIZE * unit,
  );
  ctx.restore();
}
