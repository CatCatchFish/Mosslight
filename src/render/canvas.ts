export const PIXEL_SCALE = 4;

export interface SceneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function canvas2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  return context;
}

export function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * PIXEL_SCALE) / PIXEL_SCALE, Math.round(y * PIXEL_SCALE) / PIXEL_SCALE, w, h);
}

export function sceneSurround(canvas: HTMLCanvasElement, width: number, height: number, scale: number) {
  canvas.width = width * scale * 2;
  canvas.height = height * scale * 3;
  const ctx = canvas2d(canvas);
  ctx.setTransform(scale, 0, 0, scale, width * scale / 2, height * scale);
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
