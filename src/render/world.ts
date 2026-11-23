import { WORLD_WIDTH, WORLD_HEIGHT, WAYPOINTS, SLUICE_CROSSING } from "../content/world.ts";
import { clamp } from "../engine/route.ts";
import type { Point } from "../engine/types.ts";
import { linePixels } from "./animation.ts";
import { canvas2d, sceneSurround } from "./canvas.ts";
import { box, seeded, tree } from "./terrain.ts";
import { bogPad, bogReed, broadleaf, drawMireKeep, drawRiverSkiff, landShape, lilyPad, logPile, reedBed, splitIce, swampTree } from "./landforms.ts";

const WORLD_REGIONS = [
  {
    kind: "forest",
    center: [73, 213],
    ground: ["#45633c", "#526f41", "#607c4a"],
    pine: ["#263e32", "#375941", "#50825a", "#719b6e", "#a4bb80"],
    rocks: ["#425744", "#70816b", "#9aaf80"],
  },
  {
    kind: "wetland",
    center: [228, 204],
    ground: ["#386862", "#457a69", "#528571"],
    pine: ["#2d4b39", "#39684a", "#54895b", "#7ba875", "#a9c58c"],
    rocks: ["#435d4f", "#718d7e", "#a3bd9d"],
  },
  {
    kind: "quarry",
    center: [402, 180],
    ground: ["#755846", "#8f694d", "#a37954"],
    pine: ["#413f2d", "#605a3c", "#7a744b", "#9b925d", "#bbab78"],
    rocks: ["#585143", "#84775e", "#b49f78"],
  },
  {
    kind: "frost",
    center: [321, 59],
    ground: ["#6f9cae", "#81adbb", "#99bac5"],
    pine: ["#344752", "#466572", "#60838b", "#8bb2af", "#c9d8bd"],
    rocks: ["#42637c", "#80a4b5", "#e4e9df"],
  },
  {
    kind: "mire",
    center: [124, 62],
    ground: ["#3c4647", "#495452", "#56635c"],
    pine: ["#21302e", "#2f433c", "#425b4b", "#5c7858", "#83996a"],
    rocks: ["#354040", "#596862", "#879685"],
  },
] as const;
function worldRegion(x: number, y: number) {
  return WORLD_REGIONS.reduce((best, region) => {
    const [bx, by] = best.center,
      [rx, ry] = region.center;
    return (x - rx) ** 2 + (y - ry) ** 2 < (x - bx) ** 2 + (y - by) ** 2
      ? region
      : best;
  });
}
function worldMountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tones: readonly string[],
) {
  const [deep, mid, light] = tones;
  const foot = Math.round(size);
  const rand = seeded(Math.round(x * 773 + y * 19));
  box(ctx, x - foot * .82, y + foot - 1, foot * 1.8, 3, "#223b344b");
  for (let row = 0; row <= foot; row++) {
    const t = row / foot;
    const left = Math.floor(x - row * .91 + Math.sin(row * .6) * t * 1.8);
    const right = Math.round(x + row * .78 + Math.sin(row * .75) * t * 1.25);
    const ridge = Math.round(x + row * .1 - Math.sin(t * 4.5) * row * .17);
    box(ctx, left, y + row, right - left + 1, 1, deep);
    box(ctx, left, y + row, Math.max(1, ridge - left), 1, mid);
    if (t < .37) {
      const snowEdge = Math.max(1, (ridge - left) * (1 - t * 1.4));
      box(ctx, left, y + row, snowEdge, 1, light);
      if (t < .21) box(ctx, ridge, y + row, 1 + (1 - t * 4) * row * .3, 1, mid);
    } else {
      if (row % 4 !== 0)
        box(ctx, ridge - 1 - t * 3, y + row, 1 + t * 2, 1, light + "91");
      if (rand() > .35)
        box(ctx, ridge + (right - ridge) * .54, y + row, 1 + t, 1, mid + "9c");
    }
    if (t > .85 && row % 2)
      box(ctx, left + t * 2, y + row, 2 + t * 4, 1, deep + "76");
    if (t > .28 && rand() > .48)
      box(ctx, left + (ridge - left) * rand(), y + row + .5, 1 + t, .5, light + "69");
    if (row % 3 === 2)
      box(ctx, right - 1, y + row, 1.5, .5, mid + "a0");
  }
}
function worldHut(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  roof: string,
) {
  box(ctx, x - 9, y - 1, 18, 4, "#2029208a");
  box(ctx, x - 7, y - 8, 14, 9, "#514c37");
  box(ctx, x - 6, y - 7, 12, 7, "#8b7552");
  box(ctx, x - 5, y - 7, 1, 6, "#b09763");
  for (let row = 0; row < 6; row++)
    box(ctx, x - row - 3, y - 13 + row, 7 + row * 2, 1, roof);
  for (let row = 1; row < 6; row++)
    for (let tile = -row - 1; tile < row + 2; tile += 2.5)
      box(ctx, x + tile + (row % 2) * .5, y - 13 + row, 1.5, .5, "#f4c58c55");
  box(ctx, x - 7, y - 8, 15, 1, "#d5bd86");
  box(ctx, x - 2, y - 4, 4, 4, "#3e3a2e");
  box(ctx, x + 4, y - 5, 2, 2, "#ffcf7a");
  box(ctx, x + 5, y - 5, .5, 2, "#b17c51");
}
function worldKeep(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shade: string,
) {
  box(ctx, x - 17, y, 35, 4, "#2925349a");
  box(ctx, x - 14, y - 14, 29, 15, "#353640");
  box(ctx, x - 13, y - 13, 27, 13, shade);
  box(ctx, x - 12, y - 13, 3, 12, "#ad9a9a");
  box(ctx, x - 15, y - 11, 6, 12, "#4f4c56");
  box(ctx, x + 10, y - 11, 6, 12, "#4f4c56");
  for (const dx of [-15, -11, 7, 11, 15])
    box(ctx, x + dx, y - 14, 2, 5, "#aa8d94");
  box(ctx, x - 6, y - 20, 13, 10, "#585460");
  box(ctx, x - 6, y - 21, 13, 2, "#c2a8a4");
  for (const dx of [-6, 0, 5]) box(ctx, x + dx, y - 23, 2, 3, "#c9afab");
  box(ctx, x - 3, y - 8, 7, 8, "#322932");
  box(ctx, x - 2, y - 9, 5, 2, "#443043");
  box(ctx, x + 4, y - 29, 1, 8, "#d4b195");
  box(ctx, x - 3, y - 29, 7, 4, "#ab678c");
  box(ctx, x - 3, y - 28, 6, 1, "#d995ad");
  for (let row = 0; row < 3; row++) {
    for (const dx of [-10, -6, 4, 8])
      box(ctx, x + dx + row % 2, y - 11 + row * 3, 2, .5, "#c8b3a463");
  }
  box(ctx, x -.5, y - 18, 1.5, 3, "#332d39");
}
function worldPool(ctx: CanvasRenderingContext2D, river: readonly Point[]) {
  const channel = new Path2D();
  channel.moveTo(...river[0]);
  for (let i = 1; i < river.length - 1; i++) {
    const [ax, ay] = river[i - 1], [x, y] = river[i], [bx, by] = river[i + 1];
    channel.lineTo(x + (ax - x) * .25, y + (ay - y) * .25);
    channel.quadraticCurveTo(x, y, x + (bx - x) * .25, y + (by - y) * .25);
  }
  channel.lineTo(...river[river.length - 1]);
  for (const [radius, color] of [
    [18, "#323d37"],
    [15, "#49645b"],
    [12.7, "#638f7d"],
    [11.5, "#39777a"],
    [9, "#478c89"],
    [4, "#559a92"],
  ] as const) {
    ctx.lineJoin = "round";
    ctx.lineWidth = radius * 2;
    ctx.strokeStyle = color;
    ctx.stroke(channel);
  }
  const rand = seeded(5517);
  for (let i = 0; i < river.length * 18; i++) {
    const segment = Math.floor(rand() * (river.length - 1)),
      t = rand();
    const [x, y] = river[segment],
      [nx, ny] = river[segment + 1];
    box(
      ctx,
      x + (nx - x) * t + rand() * 14 - 7,
      y + (ny - y) * t,
      1.5 + Math.floor(rand() * 4),
      0.5,
      i % 3 ? "#82a8a280" : "#b5c4a590",
    );
  }
  for (let i = 1; i < river.length; i++) {
    const [x, y] = river[i - 1], [nx, ny] = river[i];
    const length = Math.hypot(nx - x, ny - y);
    for (let d = 0; d < length; d += 3 + rand() * 6) {
      const side = rand() < .5 ? -1 : 1;
      const u = -(ny - y) / length, v = (nx - x) / length;
      const bx = x + (nx - x) * d / length + u * side * 14;
      const by = y + (ny - y) * d / length + v * side * 14;
      box(ctx, bx, by, 2 + rand() * 3, 1, "#bad4aa87");
      if (rand() > .55) {
        box(ctx, bx + u * side * 3, by + v * side * 3 - 2, 1, 3, "#283f38");
        box(ctx, bx + u * side * 3 + 1, by + v * side * 3 - 1, 1, 2, "#9eaf78");
      }
    }
  }
}
function trailPoint(index: number, t: number) {
  const [x, y] = WAYPOINTS[index - 1],
    [nx, ny] = WAYPOINTS[index];
  if (index === 3 || index === 4) {
    const corner = index === 3 ? SLUICE_CROSSING.west : SLUICE_CROSSING.east;
    const first = Math.hypot(corner[0] - x, corner[1] - y);
    const second = Math.hypot(nx - corner[0], ny - corner[1]);
    const distance = t * (first + second);
    const [sx, sy, dx, dy, step, length] = distance <= first
      ? [x, y, corner[0] - x, corner[1] - y, distance, first]
      : [corner[0], corner[1], nx - corner[0], ny - corner[1], distance - first, second];
    return { px: sx + dx * step / length, py: sy + dy * step / length, u: -dy / length, v: dx / length };
  }
  const mx = (x + nx) / 2,
    my = (y + ny) / 2 + (index % 2 ? 9 : -9);
  const a = 1 - t;
  const px = a * a * x + 2 * t * a * mx + t * t * nx,
    py = a * a * y + 2 * t * a * my + t * t * ny;
  const dx = a * (mx - x) + t * (nx - mx),
    dy = a * (my - y) + t * (ny - my),
    length = Math.hypot(dx, dy);
  return { px, py, u: -dy / length, v: dx / length };
}

function drawSluiceCrossing(ctx: CanvasRenderingContext2D) {
  const { west: [x, y], east: [right] } = SLUICE_CROSSING;
  const length = right - x;
  box(ctx, x + 2, y - 5, length, 13, "#203e39");
  for (const offset of [5, 17, 29, 41]) {
    box(ctx, x + offset, y + 2, 4, 9, "#446659");
    box(ctx, x + offset, y + 5, 2, 5, "#768978");
    box(ctx, x + offset - 2, y + 10, 11, 1, "#9bcd9e78");
  }
  box(ctx, x, y - 5, length, 10, "#5d5f4a");
  for (let i = 0; i < length; i += 3) {
    box(ctx, x + i, y - 3, 2.5, 6, i % 2 ? "#a59062" : "#bba575");
    box(ctx, x + i, y - 3, 2.5, 1, "#d2bc8c");
  }
  box(ctx, x, y - 5, length, 1, "#8da58b");
  box(ctx, x, y + 4, length, 1, "#354f44");
  for (const offset of [4, length - 6]) {
    box(ctx, x + offset, y - 9, 3, 6, "#2c4943");
    box(ctx, x + offset, y - 8, 2, 2, "#ffda8c");
  }
}

function pathDistanceSquared(x: number, y: number, river: readonly Point[]) {
  let best = Infinity;
  for (let i = 1; i < river.length; i++) {
    const [px, py] = river[i - 1],
      [nx, ny] = river[i],
      dx = nx - px,
      dy = ny - py;
    const t = clamp(
      ((x - px) * dx + (y - py) * dy) / (dx * dx + dy * dy),
      0,
      1,
    );
    best = Math.min(best, (x - px - t * dx) ** 2 + (y - py - t * dy) ** 2);
  }
  return best;
}

function earthColor(base: string, weight: number) {
  const rgb = Number.parseInt(base.slice(1), 16);
  const soil = [198, 164, 108];
  return (
    "#" +
    [16, 8, 0]
      .map((shift, i) =>
        Math.round(((rgb >> shift) & 255) * (1 - weight) + soil[i] * weight)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function layTrail(ctx: CanvasRenderingContext2D, river: readonly Point[]) {
  const marks = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);
  const texture = seeded(6397);
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const [x, y] = WAYPOINTS[i - 1],
      [nx, ny] = WAYPOINTS[i];
    const steps = Math.ceil(Math.hypot(nx - x, ny - y) * 1.6);
    for (let j = 0; j <= steps; j++) {
      const { px, py } = trailPoint(i, j / steps);
      const radius = 3.4 + Math.sin(j * 0.16 + i) * 0.9;
      for (let ly = Math.floor(py - 5); ly <= py + 5; ly++)
        for (let lx = Math.floor(px - 5); lx <= px + 5; lx++) {
          if (lx < 0 || ly < 0 || lx >= WORLD_WIDTH || ly >= WORLD_HEIGHT)
            continue;
          const intensity = 1 - Math.hypot(lx - px, ly - py) / (radius + 1.5);
          const index = ly * WORLD_WIDTH + lx;
          if (intensity > marks[index]) marks[index] = intensity;
        }
    }
  }
  for (let y = 0; y < WORLD_HEIGHT; y++)
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const worn = marks[y * WORLD_WIDTH + x];
      if (
        worn < 0.1 ||
        (worn < 0.23 && texture() > 0.43) ||
        pathDistanceSquared(x, y, river) < 14 ** 2
      )
        continue;
      const region = worldRegion(
        x + Math.sin(y * 0.07) * 14,
        y + Math.sin(x * 0.057) * 13,
      );
      const color = earthColor(
        region.ground[1],
        0.22 + 0.73 * worn + (texture() - 0.5) * 0.17,
      );
      box(ctx, x, y, 1, 1, color);
      if (worn > 0.49 && texture() > 0.965)
        box(ctx, x, y, 2, 1, earthColor(region.rocks[1], 0.28));
    }
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const [x, y] = WAYPOINTS[i - 1],
      [nx, ny] = WAYPOINTS[i];
    const steps = Math.ceil(Math.hypot(nx - x, ny - y) / 1.5);
    for (let j = 0; j <= steps; j++) {
      const { px, py, u, v } = trailPoint(i, j / steps);
      if (pathDistanceSquared(px, py, river) > 17 ** 2) continue;
      linePixels(
        ctx,
        px - u * 3.8,
        py - v * 3.8,
        px + u * 3.8,
        py + v * 3.8,
        "#5a5340",
      );
      linePixels(
        ctx,
        px - u * 2.9,
        py - v * 2.9,
        px + u * 2.9,
        py + v * 2.9,
        j % 2 ? "#ad8b64" : "#917856",
      );
      box(ctx, px - u * 3.8, py - v * 3.8, 1, 1, j % 3 ? "#9a835e" : "#d1b587");
      box(ctx, px + u * 3.7, py + v * 3.7, 1, 1, "#665641");
    }
  }
  return marks;
}
function drawMarsh(ctx: CanvasRenderingContext2D) {
  landShape(ctx, [[188, 211], [201, 210], [213, 204], [224, 203], [235, 205], [244, 210],
    [255, 217], [266, 215], [283, 217], [302, 222], [310, 228], [319, 238], [321, 245],
    [312, 253], [299, 255], [289, 256], [273, 254], [263, 249], [251, 238], [239, 239],
    [221, 242], [207, 238], [198, 231]], "#487e68");
  landShape(ctx, [[198, 216], [210, 212], [221, 208], [233, 208], [241, 212], [254, 222],
    [265, 220], [280, 222], [298, 226], [307, 232], [314, 244], [304, 249], [287, 252],
    [267, 246], [253, 232], [238, 234], [219, 239], [204, 229]], "#387975");
  landShape(ctx, [[257, 225], [270, 223], [285, 227], [296, 231], [303, 239], [296, 243],
    [287, 243], [273, 240], [266, 233]], "#499a8e");
  const random = seeded(1540);
  for (let i = 0; i < 19; i++) {
    const x = 269 + random() * 26, y = 229 + random() * 10;
    if (i % 4) box(ctx, x, y, 1 + random() * 4, 0.5, "#8ac9b2a6");
    else lilyPad(ctx, x, y, i % 3 === 0);
  }
  for (const [x, y] of [[250, 216], [279, 220], [312, 230], [318, 241], [278, 248], [251, 237]])
    reedBed(ctx, x, y, 0.85);
}

function drawQuarry(ctx: CanvasRenderingContext2D) {
  const tones = ["#624c43", "#b4865d", "#a56e50", "#d8a371"];
  for (let i = 0; i < 4; i++) {
    const x = 402 + i * 7, y = 204 + i * 11;
    landShape(ctx, [[x, y], [x + 26, y - 8], [459, y - 6], [459, y + 11], [x + 13, y + 10]], tones[0]);
    landShape(ctx, [[x, y], [x + 26, y - 8], [459, y - 6], [459, y + 3], [x + 15, y + 4]], tones[1 + i % 2]);
    box(ctx, x + 14, y + 4, 27, 1, tones[3]);
  }
  const x = 423, y = 213;
  box(ctx, x - 11, y - 10, 24, 11, "#684637");
  box(ctx, x - 7, y - 8, 16, 9, "#2c2a2a");
  box(ctx, x - 10, y - 12, 22, 3, "#c59666");
  box(ctx, x - 10, y - 10, 3, 12, "#9d6b47");
  box(ctx, x + 9, y - 10, 3, 12, "#9d6b47");
  box(ctx, x + 10, y - 7, 2, 2, "#f9d28b");
  for (let t = 0; t < 21; t++) {
    const dx = Math.floor(t * 0.75);
    if (t % 3 === 0) box(ctx, x - dx - 4, y + t, 8, 1, "#725a47");
    box(ctx, x - dx - 3, y + t, 1, 1, "#d5b19b");
    box(ctx, x - dx + 2, y + t, 1, 1, "#d5b19b");
  }
  box(ctx, x - 12, y + 6, 9, 5, "#6c6463");
  box(ctx, x - 13, y + 6, 11, 1, "#c49c85");
  box(ctx, x - 11, y + 11, 2, 2, "#473e39");
  box(ctx, x - 6, y + 11, 2, 2, "#473e39");
}

const MIRE_CHANNEL: readonly Point[] = [[-251, 35], [-165, 60], [-111, 59], [-71, 82], [-31, 82],
  [-2, 102], [23, 112], [42, 104], [65, 116], [88, 111],
  [116, 129], [133, 121], [159, 133], [177, 119]];

function drawBogFungi(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 1,
) {
  const b = (dx: number, dy: number, w: number, h: number, color: string) =>
    box(ctx, x + dx * size, y + dy * size, w * size, h * size, color);
  b(-4, 0.5, 9, 1.8, "#1b282490");
  // Subtle natural bog toadstools in muted dusky tones
  b(-1.2, -3.5, 2.4, 4, "#838a72");
  b(-0.6, -3.5, 1, 3.2, "#b5baa0");
  b(-4, -5.5, 8, 2.5, "#4c4050");
  b(-3, -6.8, 6, 2, "#6c596f");
  b(-2, -7.2, 3.5, 1, "#8e778e");
  b(-1.8, -6.5, 1.2, 0.7, "#b8c78a");
  b(1.2, -5.8, 1, 0.6, "#b8c78a");
  // Smaller lichen-olive companion cap
  b(2.6, -2.2, 1.4, 2.6, "#7b836c");
  b(1.4, -3.8, 3.8, 1.7, "#4d6646");
  b(2, -4.4, 2.5, 1, "#79945d");
  b(2.2, -4.3, 1, 0.5, "#b7c886");
}

function drawToxicSwamp(ctx: CanvasRenderingContext2D) {
  // Painterly flat organic fen-marshes matching drawMarsh's soft hand-shaped contours
  // 1. Sprawling southern mire fen separating Forest from Mire (extends left into surround)
  landShape(ctx, [
    [-256, 28], [-170, 50], [-108, 50], [-68, 72], [-28, 74], [0, 96], [26, 103],
    [48, 101], [74, 102], [94, 86], [116, 83], [136, 89], [148, 107], [164, 122],
    [176, 124], [181, 130], [166, 137], [146, 136], [124, 128], [104, 129],
    [82, 120], [60, 124], [38, 115], [16, 121], [-8, 110], [-36, 92], [-76, 92],
    [-116, 69], [-172, 70], [-256, 44],
  ], "#354a3f");
  landShape(ctx, [
    [-256, 32], [-168, 54], [-110, 54], [-70, 77], [-30, 78], [-2, 100], [25, 107],
    [47, 105], [76, 105], [98, 91], [118, 88], [134, 94], [143, 112], [162, 126],
    [172, 129], [160, 133], [144, 131], [122, 123], [103, 124], [81, 114],
    [60, 119], [39, 110], [17, 116], [-6, 106], [-34, 87], [-74, 87],
    [-114, 64], [-170, 65], [-256, 40],
  ], "#406047");
  // Shallow murky sulfur-moss pockets inside the southern fen
  landShape(ctx, [
    [97, 105], [115, 105], [131, 108], [134, 116], [121, 121], [104, 118], [95, 112],
  ], "#577d4d");
  landShape(ctx, [
    [104, 108], [120, 109], [127, 114], [119, 118], [105, 115],
  ], "#6e9455");
  landShape(ctx, [
    [10, 107], [28, 109], [48, 107], [68, 110], [76, 116], [58, 118], [36, 110], [16, 114],
  ], "#53784c");
  landShape(ctx, [
    [140, 123], [156, 126], [166, 129], [156, 132], [141, 128],
  ], "#5a804f");
  // Mossy peat tussock islet anchoring Stage 15 inside the fen basin
  landShape(ctx, [
    [106, 94], [118, 89], [130, 95], [126, 104], [109, 103],
  ], "#46554e");
  landShape(ctx, [
    [109, 95], [118, 91], [127, 96], [123, 102], [112, 101],
  ], "#536459");
  // 2. Northwest fen lagoon
  landShape(ctx, [
    [8, 25], [21, 18], [39, 17], [55, 22], [65, 31], [61, 41], [48, 46],
    [31, 45], [16, 40], [6, 33],
  ], "#354a3f");
  landShape(ctx, [
    [15, 27], [28, 22], [45, 23], [56, 30], [54, 38], [40, 41], [23, 38], [14, 32],
  ], "#416148");
  landShape(ctx, [
    [24, 29], [39, 27], [49, 32], [44, 37], [29, 36],
  ], "#5b824f");
  landShape(ctx, [
    [30, 31], [41, 30], [45, 34], [35, 35],
  ], "#709657");
  // 3. Eastern mire cove feeding near the river bend
  landShape(ctx, [
    [156, 23], [170, 18], [186, 20], [196, 29], [193, 39], [178, 42], [162, 40], [153, 32],
  ], "#354a3f");
  landShape(ctx, [
    [162, 26], [175, 23], [187, 27], [186, 36], [173, 38], [161, 34],
  ], "#45674a");
  landShape(ctx, [
    [168, 29], [179, 28], [183, 33], [172, 35],
  ], "#5d8450");
  // Delicate horizontal water glints, subtle bubbles, bog pads, and reeds
  const rand = seeded(7741);
  for (const [rx, ry, rw, rh] of [
    [18, 25, 34, 13],
    [98, 93, 36, 20],
    [163, 25, 22, 11],
    [14, 103, 56, 11],
  ]) {
    for (let i = 0; i < 10; i++) {
      const px = rx + rand() * rw, py = ry + rand() * rh;
      if (i % 4) box(ctx, px, py, 1.5 + rand() * 3.5, 0.5, i % 2 ? "#94b3748a" : "#b0c78870");
      else bogPad(ctx, px, py);
    }
  }
  // Tiny subtle mire gas bubbles
  for (const [bx, by] of [
    [33, 32], [44, 34], [113, 101], [124, 106], [175, 31], [38, 106], [62, 111], [153, 123],
  ]) {
    box(ctx, bx - 1, by, 2.5, 1.5, "#36523e");
    box(ctx, bx - 0.5, by - 0.5, 2, 1.2, "#84a862");
    box(ctx, bx, by - 0.5, 0.8, 0.6, "#cfe09c");
  }
  for (const [rx, ry] of [
    [14, 41], [59, 40], [92, 92], [144, 105], [108, 126], [160, 39], [191, 36], [52, 118], [164, 131], [86, 110],
  ]) {
    bogReed(ctx, rx, ry, 0.8);
  }
}

function drawGlacialLake(ctx: CanvasRenderingContext2D) {
  landShape(ctx, [[235, 35], [255, 29], [272, 34], [287, 41], [292, 54],
    [284, 69], [266, 76], [252, 70], [237, 57]], "#5b94a7");
  landShape(ctx, [[245, 36], [257, 33], [277, 39], [287, 48], [287, 56],
    [278, 66], [263, 70], [250, 64], [241, 52]], "#7cadba");
  for (const [x, y] of [[256, 49], [272, 45], [279, 53], [263, 63], [251, 58]])
    splitIce(ctx, x, y);
}

export function makeWorldMap(surround: HTMLCanvasElement) {
  const scale = 2;
  const ctx = sceneSurround(surround, WORLD_WIDTH, WORLD_HEIGHT, scale);
  const rand = seeded(4810);
  const grain = seeded(301);
  const left = -WORLD_WIDTH / 2;
  const right = WORLD_WIDTH - left;
  const top = -WORLD_HEIGHT;
  const bottom = WORLD_HEIGHT * 2;
  // Broad contours keep the ground continuous underneath roads and landmarks.
  for (let y = top; y < bottom; y++) {
    let runStart = left;
    let runColor = "";
    for (let x = left; x < right; x++) {
      const region = worldRegion(
        x + Math.sin(y * 0.07) * 14,
        y + Math.sin(x * 0.057) * 13,
      );
      const relief = Math.sin(x / 19 + y / 28) + Math.sin(y / 8 - x / 36);
      const tone = region.ground[relief < -0.75 ? 0 : relief < 0.85 ? 1 : 2];
      if (tone === runColor) continue;
      if (x > runStart) box(ctx, runStart, y, x - runStart, 1, runColor);
      runColor = tone;
      runStart = x;
    }
    box(ctx, runStart, y, right - runStart, 1, runColor);
  }
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (grain() < 0.14) box(ctx, x, y, grain() < .4 ? 1.5 : .5, .5, "#c2d4ad38");
      if (grain() < 0.055) box(ctx, x + .5, y + .5, .5, .5, "#182e2b35");
    }
  }
  const mist = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  mist.addColorStop(0, "#151c2966");
  mist.addColorStop(0.5, "#25362700");
  mist.addColorStop(1, "#172c2666");
  ctx.fillStyle = mist;
  ctx.fillRect(left, top, right - left, bottom - top);
  const river: readonly Point[] = [
    [102, top - 24],
    [145, -195],
    [115, -149],
    [154, -110],
    [178, -66],
    [205, -16],
    [239, 18],
    [252, 44],
    [232, 70],
    [218, 94],
    [229, 117],
    [211, 142],
    [183, 165],
    [188, 194],
    [224, 221],
    [212, 265],
    [188, 302],
    [201, 348],
    [245, 392],
    [237, 445],
    [267, bottom + 24],
  ];
  drawGlacialLake(ctx);
  worldPool(ctx, river);
  drawMarsh(ctx);
  drawToxicSwamp(ctx);
  const trail = layTrail(ctx, river);
  drawSluiceCrossing(ctx);
  const inMap = (x: number, y: number) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  const trees: Point[] = [];
  for (let i = 0; i < 420; i++) trees.push([Math.floor(rand() * WORLD_WIDTH), Math.floor(rand() * WORLD_HEIGHT)]);
  for (let y = top; y < bottom; y += 9) {
    for (let x = left; x < right; x += 9) {
      const px = Math.floor(x + rand() * 9);
      const py = Math.floor(y + rand() * 9);
      if (!inMap(px, py) && rand() > .3) trees.push([px, py]);
    }
  }
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of trees) {
    if (pathDistanceSquared(x, y, river) < 18 ** 2 || pathDistanceSquared(x, y, MIRE_CHANNEL) < 13 ** 2)
      continue;
    if (inMap(x, y) && (
      trail[y * WORLD_WIDTH + x] > 0.28 ||
      (x > 235 && x < 294 && y > 30 && y < 77) ||
      (x > 190 && x < 324 && y > 213) ||
      (x > 392 && y > 197) ||
      (x < 178 && y > 95 && y < 140) ||
      (x > 6 && x < 67 && y > 16 && y < 48) ||
      (x > 22 && x < 68 && y > 54 && y < 88) ||
      (x > 87 && x < 150 && y > 83 && y < 121) ||
      (x > 152 && x < 198 && y > 19 && y < 47) ||
      WAYPOINTS.some(([px, py]) => (x - px) ** 2 + (y - py) ** 2 < 15 ** 2)
    ))
      continue;
    const region = worldRegion(x, y);
    const detail = rand();
    if (region.kind === "wetland") {
      if (detail > 0.3) broadleaf(ctx, x, y, 0.34 + rand() * 0.39);
      else reedBed(ctx, x, y, 0.8);
    } else if (region.kind === "quarry") {
      if (detail > 0.55) worldMountain(ctx, x, y - 6, 4 + Math.round(rand() * 7), region.rocks);
    } else if (region.kind === "mire") {
      if (detail > 0.56) swampTree(ctx, x, y, 0.38 + rand() * 0.36);
      else if (detail > 0.34) tree(ctx, x, y, 0.34 + rand() * 0.38, false, region.pine);
      else if (detail > 0.22) bogReed(ctx, x, y, 0.75);
    } else if (detail > 0.2) {
      tree(ctx, x, y, 0.38 + rand() * 0.46, false, region.pine);
    }
  }
  for (const [x, y, size] of [
    [282, 25, 22],
    [303, 21, 26],
    [323, 28, 16],
    [341, 17, 30],
    [364, 24, 28],
    [385, 28, 20],
    [408, 43, 15],
    [14, 34, 14],
    [34, 28, 15],
    [56, 30, 11],
    [438, 128, 14],
    [449, 151, 16],
  ]) {
    worldMountain(ctx, x, y, size, worldRegion(x, y).rocks);
  }
  drawQuarry(ctx);
  worldHut(ctx, 46, 182, "#92674e");
  logPile(ctx, 29, 187);
  logPile(ctx, 63, 187);
  worldHut(ctx, 115, 211, "#946d4b");
  logPile(ctx, 129, 216);
  // The forest road reaches the reed bank here, just before the next district.
  for (const [x, y, size] of [[170, 187, 0.7], [174, 200, 0.65], [180, 210, 0.85], [209, 194, 0.7]])
    reedBed(ctx, x, y, size);
  broadleaf(ctx, 207, 183, 0.58);
  drawRiverSkiff(ctx, 192, 198);
  worldHut(ctx, 253, 211, "#7d7458");
  worldHut(ctx, 392, 153, "#a0694a");
  worldHut(ctx, 174, 52, "#5c6f59");
  drawMireKeep(ctx, 44, 80);
  worldKeep(ctx, 370, 79, "#767f7c");
  drawRiverSkiff(ctx, 219, 224);
  for (const [x, y, size] of [
    [62, 76, 0.75],
    [97, 74, 0.72],
    [154, 48, 0.75],
    [48, 108, 0.8],
    [152, 126, 0.75],
  ]) {
    drawBogFungi(ctx, x, y, size);
  }
  const terrain = document.createElement("canvas");
  terrain.width = WORLD_WIDTH * scale;
  terrain.height = WORLD_HEIGHT * scale;
  canvas2d(terrain).drawImage(surround, terrain.width / 2, terrain.height,
    terrain.width, terrain.height, 0, 0, terrain.width, terrain.height);
  return terrain;
}

export function makeTrailScout() {
  const image = document.createElement("canvas");
  image.width = 54;
  image.height = 38;
  const ctx = canvas2d(image);
  ctx.scale(2, 2);
  const b = (x: number, y: number, w: number, h: number, c: string) =>
    box(ctx, x, y, w, h, c);
  b(4, 16, 20, 2, "#24251dbb");
  b(2, 11, 11, 4, "#643b2b");
  b(0, 9, 5, 4, "#a26642");
  b(1, 8, 3, 3, "#e5bf85");
  b(6, 10, 12, 6, "#704334");
  b(7, 9, 10, 6, "#be794e");
  b(8, 10, 7, 3, "#d2925b");
  b(8, 14, 2, 3, "#52372c");
  b(15, 14, 2, 3, "#52372c");
  b(14, 4, 9, 9, "#6b4633");
  b(14, 3, 3, 4, "#b5784c");
  b(20, 3, 3, 4, "#b5784c");
  b(15, 2, 1, 2, "#e5b27a");
  b(21, 2, 1, 2, "#e5b27a");
  b(15, 6, 8, 6, "#da9260");
  b(16, 10, 8, 3, "#ebc498");
  b(20, 8, 2, 2, "#443728");
  b(23, 10, 2, 1, "#45342a");
  b(11, 11, 4, 2, "#7d8a63");
  b(11, 13, 2, 3, "#7c956e");
  b(24, 12, 1, 2, "#a2744b");
  b(23, 14, 4, 4, "#e9b670");
  b(24, 14, 2, 3, "#ffe4a0");
  b(7.5, 9.5, 4, .5, "#e7a56b");
  b(14.5, 4, 1, 2, "#e5aa7a");
  b(20, 8, .5, .5, "#f8d2a8");
  b(12.5, 12, 2, .5, "#b4b78a");
  b(24, 14, .5, 3, "#fff3b7");
  return image.toDataURL();
}

export function makeLandmarkCrop(image: HTMLCanvasElement, anchor: Point) {
  const crop = document.createElement("canvas");
  const scale = image.width / WORLD_WIDTH;
  const width = 120;
  const height = 55;
  crop.width = width * scale;
  crop.height = height * scale;
  const x = clamp(anchor[0] - width / 2, 0, WORLD_WIDTH - width);
  const y = clamp(anchor[1] - 28, 0, WORLD_HEIGHT - height);
  canvas2d(crop).drawImage(
    image,
    x * scale,
    y * scale,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );
  return crop.toDataURL("image/png");
}
