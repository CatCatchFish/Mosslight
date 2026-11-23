import type { Point } from "../engine/types.ts";
import { box } from "./canvas.ts";

export function landShape(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  color: string,
) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function broadleaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const b = (dx: number, dy: number, w: number, h: number, color: string) =>
    box(ctx, x + dx * size, y + dy * size, w * size, h * size, color);
  const crown = (color: string, points: readonly Point[]) =>
    landShape(ctx, points.map(([px, py]) => [x + px * size, y + py * size]), color);
  b(-11, 0, 23, 3, "#172e30a1");
  b(-2, -17, 5, 19, "#514d33");
  b(1, -11, 1, 11, "#88825a");
  crown("#264e3e", [[-13,-9],[-12,-14],[-9,-17],[-8,-21],[-4,-24],[2,-25],[7,-22],
    [10,-18],[13,-15],[14,-10],[11,-6],[6,-3],[0,-4],[-5,-3],[-10,-5]]);
  crown("#3f7c5c", [[-12,-10],[-10,-14],[-7,-15],[-6,-20],[-2,-22],[4,-23],[8,-20],
    [8,-17],[12,-14],[12,-10],[8,-6],[3,-5],[-2,-6],[-7,-5],[-10,-7]]);
  crown("#699d70", [[-9,-13],[-6,-17],[-5,-20],[-2,-22],[3,-22],[6,-20],[4,-16],
    [1,-14],[-4,-14],[-7,-12]]);
  b(-3, -21, 7, 2, "#7db27d");
  b(-8, -16, 5, 2, "#70a77a");
  b(-10, -10, 7, 2, "#4d8963");
  b(3, -9, 8, 2, "#275943");
  b(-10, -7, 3, 4, "#2b694c");
  b(6, -7, 4, 5, "#326d52");
  b(7, -5, 1, 3, "#548262");
  for (const [dx, dy, w] of [[-4, -19, 3], [1, -17, 2], [-8, -13, 4], [4, -11, 3]])
    b(dx, dy, w, .65, "#b9c69385");
  b(-1, -3, .65, 4, "#c19e6e");
}

export function reedBed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
) {
  for (const [dx, height] of [
    [-4, 4],
    [-2, 7],
    [1, 5],
    [3, 8],
  ]) {
    const stem = x + dx * scale;
    box(ctx, stem, y - height * scale, scale, height * scale, "#709b68");
    box(ctx, stem - scale, y - height * scale, scale * 2, scale * 2, "#b99a58");
    box(ctx, stem - scale * .5, y - height * scale, scale, .5, "#e0be7d");
    box(
      ctx,
      stem + scale,
      y - height * scale * 0.5,
      scale * 2,
      scale,
      "#94b577",
    );
  }
  box(ctx, x - 4 * scale, y + scale, 9 * scale, scale, "#539b8275");
}

export function lilyPad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bloom: boolean,
) {
  box(ctx, x - 3, y + 1, 8, 2, "#1e5657");
  box(ctx, x - 3, y - 1, 7, 2, "#558e67");
  box(ctx, x - 2, y - 2, 5, 1, "#85aa71");
  box(ctx, x + 2, y, 3, 1, "#2f7674");
  box(ctx, x - 2.5, y - .5, 3.5, .5, "#a6c583");
  if (bloom) {
    box(ctx, x - 1, y - 3, 3, 1, "#eebabe");
    box(ctx, x, y - 4, 1, 2, "#f9ddbb");
  }
}

export function splitIce(ctx: CanvasRenderingContext2D, x: number, y: number) {
  landShape(
    ctx,
    [
      [x - 6, y],
      [x - 3, y - 3],
      [x + 2, y - 4],
      [x + 6, y - 2],
      [x + 7, y + 1],
      [x + 3, y + 3],
      [x - 4, y + 3],
    ],
    "#9dc9d2ba",
  );
  box(ctx, x - 4, y - 2, 6, 1, "#def1e3");
  box(ctx, x - 2, y + 3, 6, 1, "#326477");
  box(ctx, x + 2, y, 2, 1, "#d8e7e2");
  box(ctx, x + 4, y - 1, 1, 1, "#d8e7e2");
  box(ctx, x - 3, y + 1, 3, .5, "#b7e3e3");
  box(ctx, x + .5, y + .5, .5, 2, "#538d9e");
}

export function logPile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  box(ctx, x - 8, y + 2, 18, 3, "#3b3c2cba");
  for (const [dx, dy] of [
    [-7, 0],
    [-4, -4],
    [-1, -1],
  ]) {
    box(ctx, x + dx, y + dy, 12, 4, "#675134");
    box(ctx, x + dx + 1, y + dy, 8, 1, "#9d7546");
    box(ctx, x + dx + 9, y + dy + 1, 3, 3, "#d2a165");
    box(ctx, x + dx + 10, y + dy + 2, 1, 1, "#7c5735");
    box(ctx, x + dx + 3, y + dy + 1.5, 5, .5, "#b2844f");
    box(ctx, x + dx + 9.5, y + dy + 1.5, 2, .5, "#e6b883");
  }
}

export function drawRiverSkiff(ctx: CanvasRenderingContext2D, x: number, y: number) {
  box(ctx, x - 12, y + 1, 25, 3, "#2b4747a6");
  box(ctx, x - 9, y - 4, 18, 6, "#875a40");
  box(ctx, x - 7, y - 3, 13, 4, "#d09c63");
  box(ctx, x - 10, y - 2, 3, 3, "#aa774e");
  box(ctx, x + 6, y - 2, 4, 3, "#ad7b52");
  box(ctx, x - 10, y - 4, 20, 1, "#e0b575");
  box(ctx, x - 7, y, 14, 1, "#694734");
  box(ctx, x - 5, y - 2, 2, 3, "#9d704b");
  box(ctx, x + 2, y - 3, 2, 4, "#9d704b");
  box(ctx, x + 7, y - 8, 1, 5, "#6d5136");
  box(ctx, x + 6, y - 8, 3, 3, "#f1bf68");
  box(ctx, x + 7, y - 8, 1, 1, "#fff0b7");
  box(ctx, x - 5, y - 1, 7, .5, "#a56b48");
  box(ctx, x - 7, y + 2, 10, .5, "#73ac9b");
}

export function rockLedge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, slant: number) {
  const rock = (color: string, points: readonly [number, number][]) =>
    landShape(ctx, points.map(([dx, dy]) => [x + (dx + dy * slant) * size, y + dy * size]), color);
  const b = (dx: number, dy: number, w: number, color: string) =>
    box(ctx, x + (dx + dy * slant) * size, y + dy * size, w * size, .65 * size, color);
  rock("#4a382da0", [[-14,-2],[-11,-7],[13,-7],[17,-1],[11,3],[-12,3]]);
  rock("#61463d", [[-13,-2],[-13,-9],[-8,-17],[-4,-19],[5,-20],[13,-16],
    [15,-9],[14,-3],[8,1],[-6,1]]);
  rock("#996b50", [[-12,-6],[-9,-13],[-6,-18],[5,-19],[11,-16],[10,-12],[4,-10],[-1,-11],[-5,-5]]);
  rock("#bf9268", [[-7,-15],[-5,-18],[4,-19],[10,-16],[5,-14],[-1,-14],[-3,-12]]);
  rock("#815a47", [[-11,-7],[-5,-5],[-1,-10],[4,-9],[9,-11],[14,-10],[12,-5],[5,-2],[-6,-2]]);
  b(-5,-15,6,"#d6ab7d");
  b(-7,-7,4,"#c58d65");
  b(1,-6,5,"#bd8967");
  b(7,-3,3,"#a97553");
}

export function bogReed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
) {
  for (const [dx, height] of [
    [-4, 4],
    [-2, 7],
    [1, 5],
    [3, 7],
  ]) {
    const stem = x + dx * scale;
    box(ctx, stem, y - height * scale, scale, height * scale, "#577052");
    box(ctx, stem - scale * 0.8, y - height * scale, scale * 1.8, scale * 2, "#7e6859");
    box(ctx, stem - scale * 0.4, y - height * scale, scale, 0.5, "#ab9474");
    box(ctx, stem + scale, y - height * scale * 0.5, scale * 1.8, scale, "#768f5e");
  }
  box(ctx, x - 4 * scale, y + scale, 9 * scale, scale, "#3f634c78");
}

export function bogPad(ctx: CanvasRenderingContext2D, x: number, y: number) {
  box(ctx, x - 3, y + 0.5, 7, 1.5, "#243b32");
  box(ctx, x - 3, y - 0.5, 6, 1.5, "#4e6d4b");
  box(ctx, x - 2, y - 1, 4, 1, "#79945d");
  box(ctx, x - 2, y - 0.5, 2.5, 0.5, "#9bb375");
}

export function swampTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const b = (dx: number, dy: number, w: number, h: number, color: string) =>
    box(ctx, x + dx * size, y + dy * size, w * size, h * size, color);
  const crown = (color: string, points: readonly Point[]) =>
    landShape(ctx, points.map(([px, py]) => [x + px * size, y + py * size]), color);
  b(-10, 0, 21, 3, "#17252499");
  // Flared cypress root & slightly curved trunk
  b(-4, -2, 8, 3, "#36352c");
  b(-2, -16, 4, 16, "#464336");
  b(-1, -13, 1.2, 12, "#756e57");
  // Organic drooping cypress/willow silhouette matching broadleaf's sculpted craft
  crown("#223630", [[-13, -8], [-12, -13], [-8, -17], [-5, -21], [1, -22], [6, -20],
    [10, -16], [13, -12], [12, -7], [8, -5], [3, -6], [-2, -5], [-8, -5], [-11, -6]]);
  crown("#355140", [[-11, -9], [-10, -13], [-6, -16], [-4, -19], [2, -20], [7, -18],
    [9, -14], [11, -11], [8, -7], [3, -7], [-2, -6], [-8, -7]]);
  crown("#52704e", [[-8, -12], [-5, -16], [-3, -19], [2, -19], [5, -17], [3, -14],
    [-1, -13], [-5, -12]]);
  b(-4, -18, 6, 1.5, "#6b8858");
  b(-8, -13, 5, 1.5, "#5c7a52");
  b(2, -10, 7, 1.5, "#284136");
  // Delicate hanging moss wisps tucked naturally under the crown
  for (const [dx, dy, len] of [[-9, -6, 3.5], [-5, -5, 4], [5, -6, 4], [9, -7, 3]]) {
    b(dx, dy, 1.1, len, "#334f3d");
    b(dx, dy, 0.7, Math.max(1, len - 1.5), "#648155");
  }
  for (const [dx, dy, w] of [[-4, -17, 3], [0, -15, 2.5], [-7, -11, 3.5], [3, -11, 2.5]])
    b(dx, dy, w, 0.65, "#9fb47780");
}

export function drawMireKeep(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Architectural sibling to worldKeep, weathered with bog moss and warm watch-light
  box(ctx, x - 17, y, 35, 4, "#1f2a299a");
  box(ctx, x - 14, y - 14, 29, 15, "#2d3836");
  box(ctx, x - 13, y - 13, 27, 13, "#54635c");
  box(ctx, x - 12, y - 13, 3, 12, "#8c9a8b");
  box(ctx, x - 15, y - 11, 6, 12, "#43504b");
  box(ctx, x + 10, y - 11, 6, 12, "#43504b");
  for (const dx of [-15, -11, 7, 11, 15])
    box(ctx, x + dx, y - 14, 2, 5, "#839282");
  box(ctx, x - 6, y - 20, 13, 10, "#4b5953");
  box(ctx, x - 6, y - 21, 13, 2, "#97a692");
  for (const dx of [-6, 0, 5]) box(ctx, x + dx, y - 23, 2, 3, "#9eab96");
  box(ctx, x - 3, y - 8, 7, 8, "#26302d");
  box(ctx, x - 2, y - 9, 5, 2, "#35443c");
  // Subtle mossy patches along the damp stonework
  box(ctx, x - 14, y - 4, 7, 4, "#3b5741");
  box(ctx, x - 12, y - 4, 4, 1.5, "#658454");
  box(ctx, x + 8, y - 6, 6, 5, "#3b5741");
  box(ctx, x + 9, y - 6, 3, 1.5, "#658454");
  box(ctx, x - 5, y - 14, 3, 4, "#456448");
  // Tattered sage-olive watch banner & warm watchtower slit
  box(ctx, x + 4, y - 29, 1, 8, "#a69c7e");
  box(ctx, x - 3, y - 29, 7, 4, "#5d7a53");
  box(ctx, x - 3, y - 28, 6, 1, "#8ea86e");
  for (let row = 0; row < 3; row++) {
    for (const dx of [-10, -6, 4, 8])
      box(ctx, x + dx + (row % 2), y - 11 + row * 3, 2, 0.5, "#b3bfaa60");
  }
  box(ctx, x - 0.5, y - 18, 2, 3, "#f0cf80");
  box(ctx, x, y - 18, 1, 1.5, "#fff0bd");
}
