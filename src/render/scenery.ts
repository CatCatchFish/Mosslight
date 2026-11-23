import { CELL, key } from "../engine/route.ts";
import type { Entry, Level, Route } from "../engine/types.ts";
import { linePixels, pixelRing } from "./animation.ts";
import { paintSprite, stamp } from "./pixel-sprite.ts";
import { box, pathTiles, seeded } from "./terrain.ts";

interface AmbientPoint {
  x: number;
  y: number;
  phase: number;
}
export interface Ambient {
  flies: AmbientPoint[];
  ripples: AmbientPoint[];
}

const archArt = paintSprite((r, p) => {
  p("#202d25", [-26, 5], [-22, -6], [22, -6], [27, 5], [24, 8], [-23, 8]);
  p("#4a4d3f", [-26, 3], [-20, -4], [20, -4], [26, 3], [24, 6], [-24, 6]);
  r(-24, 2, 47, 2, "#827359");
  r(-21, 4, 40, 1, "#b29a69");
  p(
    "#292e29",
    [-22, -2],
    [-22, -22],
    [-16, -23],
    [-14, -30],
    [-8, -35],
    [9, -35],
    [17, -29],
    [19, -23],
    [23, -21],
    [23, -2],
  );
  p(
    "#696051",
    [-19, -2],
    [-19, -21],
    [-14, -22],
    [-12, -28],
    [-6, -33],
    [7, -33],
    [14, -28],
    [16, -21],
    [21, -20],
    [21, -2],
  );
  p(
    "#7e7767",
    [-18, -18],
    [-13, -20],
    [-11, -27],
    [-5, -32],
    [6, -32],
    [12, -28],
    [8, -26],
    [-3, -28],
    [-8, -22],
    [-10, -17],
  );
  p(
    "#211e23",
    [-13, 0],
    [-13, -19],
    [-8, -24],
    [-3, -27],
    [6, -27],
    [12, -22],
    [14, -17],
    [14, 0],
  );
  p(
    "#302832",
    [-10, -1],
    [-10, -18],
    [-6, -23],
    [-3, -25],
    [5, -25],
    [10, -21],
    [11, -17],
    [11, 0],
  );
  p("#422f34", [-8, 0], [-8, -16], [-5, -21], [-1, -24], [0, -3], [-2, 0]);
  r(-13, -16, 2, 13, "#634737");
  r(12, -15, 2, 13, "#8e5740");
  r(-12, -19, 2, 2, "#a97654");
  r(-7, -25, 3, 1, "#ae835a");
  r(6, -25, 4, 1, "#a27a53");
  r(-5, -31, 9, 1, "#ac9170");
  r(-20, -19, 5, 1, "#af8e66");
  r(15, -18, 6, 1, "#ab8b64");
  r(-19, -12, 6, 1, "#454335");
  r(14, -12, 7, 1, "#454335");
  r(16, -11, 1, 6, "#8c795e");
  r(-18, -4, 6, 2, "#a18a62");
  r(13, -4, 6, 2, "#a18a62");
  p("#513d36", [-24, -23], [-18, -23], [-17, -10], [-20, -8], [-23, -9]);
  p("#4d6248", [-23, -22], [-19, -22], [-18, -12], [-20, -10], [-22, -11]);
  r(-23, -22, 4, 1, "#809263");
  r(-22, -18, 2, 3, "#c7af75");
  p("#513d36", [18, -23], [24, -23], [23, -9], [20, -8], [18, -10]);
  p("#4d6248", [19, -22], [23, -22], [22, -11], [20, -10], [19, -12]);
  r(19, -22, 4, 1, "#809263");
  r(20, -18, 2, 3, "#c7af75");
  r(-3, -34, 6, 3, "#594839");
  r(-2, -33, 4, 1, "#d5af6e");
});
const mineArt = paintSprite((r, p) => {
  p("#4c352e", [-26,3],[-25,-17],[-19,-27],[-13,-34],[-4,-37],
    [12,-35],[22,-28],[28,-16],[27,3],[19,6],[-20,6]);
  p("#8e5943", [-24,-3],[-21,-17],[-16,-26],[-10,-32],[-3,-35],
    [12,-33],[21,-26],[24,-15],[23,-4],[16,-2],[-17,-2]);
  p("#bb7e59", [-19,-20],[-13,-29],[-7,-33],[-2,-34],[11,-32],[17,-28],
    [8,-27],[3,-29],[-7,-26],[-12,-21]);
  p("#322937", [-16,3],[-16,-19],[-8,-25],[10,-25],[17,-18],[18,3]);
  r(-18,-21,4,24,"#755040");
  r(15,-21,4,24,"#795140");
  r(-17,-21,2,21,"#bc9168");
  r(15,-21,1.5,21,"#ad7954");
  r(-20,-26,40,5,"#604437");
  r(-19,-25,36,2,"#d0a175");
  r(-15,-20,4,2,"#a8815e");
  r(12,-20,4,2,"#a8815e");
  r(-24,3,46,2,"#a77853");
  for (const [x,y] of [[-19,-11],[-17,-13],[20,-15],[23,-9],[11,-30],[-1,-33]]) {
    r(x,y,3,1,"#e0ab72");
    r(x+1,y+1,1,2,"#b37854");
  }
}, 2);
const coreBase = paintSprite((r, p) => {
  p("#1c342c", [-25, 2], [-18, -11], [18, -11], [25, 2], [22, 8], [-21, 8]);
  p("#526a5d", [-22, 0], [-13, -12], [13, -12], [22, 0], [20, 4], [-19, 4]);
  p("#849680", [-21, -1], [-12, -11], [12, -11], [19, -2], [8, 2], [-9, 2]);
  p("#31594e", [-17, -2], [-11, -7], [11, -7], [16, -1], [9, 1], [-10, 1]);
  r(-15, 3, 10, 2, "#91a58b");
  r(7, 3, 11, 1, "#a2ad83");
  r(-5, 0, 10, 1, "#5fa590");
  r(-21, -1, 4, 1, "#b1bc91");
  r(17, -1, 4, 1, "#b1bc91");
  r(-9, -8, 19, 1, "#a4ae89");
  p("#214e43", [-19, -3], [-18, -14], [-15, -18], [-12, -14], [-12, -5]);
  p("#5ba899", [-18, -5], [-17, -14], [-15, -17], [-13, -13], [-14, -6]);
  r(-16, -13, 1, 5, "#a3e3bd");
  p("#244d45", [12, -5], [12, -15], [16, -19], [19, -15], [20, -5]);
  p("#69b2a0", [14, -6], [14, -14], [16, -18], [18, -14], [18, -7]);
  r(16, -15, 1, 5, "#a3e3bd");
});
const coreGem = paintSprite((r, p) => {
  p(
    "#144d42",
    [-13, -22],
    [-8, -35],
    [1, -46],
    [8, -39],
    [14, -27],
    [11, -16],
    [0, -10],
    [-8, -14],
  );
  p(
    "#3d9b85",
    [-11, -22],
    [-7, -34],
    [1, -44],
    [7, -38],
    [12, -27],
    [10, -17],
    [0, -11],
    [-7, -15],
  );
  p(
    "#68dab0",
    [-10, -23],
    [-6, -34],
    [1, -43],
    [4, -37],
    [4, -29],
    [1, -19],
    [-6, -17],
  );
  p("#b1f4c4", [-9, -23], [-5, -33], [1, -41], [2, -35], [-4, -24], [-6, -20]);
  p("#20836f", [5, -37], [11, -27], [9, -18], [1, -13], [3, -21], [5, -27]);
  p("#59c6a3", [-5, -17], [-1, -21], [4, -19], [1, -13], [-4, -14]);
  r(-4, -26, 2, 3, "#d9f6c8");
  r(-1, -32, 2, 1, "#e7f8cf");
  r(1, -37, 1, 3, "#dcfadb");
});
function torch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  offset: number,
  on: boolean,
  wind: number,
) {
  box(ctx, x - 1, y, 2, 2, "#7f5435");
  const frame = Math.floor(time * 9 + offset) % 4;
  box(ctx, x - 1.5, y - 1.5, 3, 2, "#d37c45");
  box(
    ctx,
    x - 0.5 + (frame % 2) * 0.5 + wind,
    y - 3 - (frame % 3) * 0.5,
    1,
    3,
    "#ffb66b",
  );
  box(ctx, x - 0.5, y - 1.5, 1, 1.5, "#fff0b4");
  if (on)
    box(
      ctx,
      x - 0.5 + (frame % 3) * 0.5 + wind * 1.6,
      y - 4 - frame * 0.5,
      0.5,
      0.5,
      "#ffe0a0",
    );
}
export function drawEntrance(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: Entry["scenery"],
  active: boolean,
  ready: boolean,
  time: number,
  wind: number,
) {
  if (style === "mine") {
    stamp(ctx, mineArt, x + 4, y);
    torch(ctx, x + 12.5, y - 7, time, 1.3, ready || active, wind);
    if (active) box(ctx, x + 1 + (Math.floor(time * 11) % 3), y - 1, 4, .5, "#d3ac7c90");
    return;
  }
  if (style === "arch") {
    stamp(ctx, archArt, x + 3.5, y);
    box(ctx, x + 0.5, y - 12, 5, 0.5, "#85936b");
    box(ctx, x + 8, y - 13, 1, 5, "#658259");
    box(ctx, x + 8.5, y - 10, 1.5, 1, "#9b9d65");
    if (active)
      box(ctx, x + (Math.floor(time * 8) % 3), y - 4, 4, 1, "#9f7d5a65");
    torch(ctx, x + 12, y - 4, time, 1.7, ready || active, wind);
    return;
  }

  const offset = style === "landing" ? 7 : 5;
  const drawPost = (px: number, py: number) => {
    box(ctx, px - 1.5, py, 3, 3, "#273b2d");
    box(ctx, px - 1, py - 7, 2, 8, "#755739");
    box(ctx, px - 1, py - 7, 0.5, 8, "#ac8c5e");
    box(ctx, px - 2, py - 6, 4, 1, "#bd9f63");
  };
  if (style === "landing") {
    drawPost(x - offset, y + 2);
    drawPost(x + offset, y + 2);
    box(ctx, x - offset - 2, y + 2, 4, 0.5, "#9dd4b9");
    box(ctx, x + offset - 1, y + 3, 4, 0.5, "#9dd4b9");
    torch(ctx, x + offset, y - 5, time, 0.8, ready || active, wind);
  } else {
    drawPost(x + 1, y - 6);
    drawPost(x + offset, y + 4);
    box(ctx, x + 1, y - 11, 6, 1, "#62734b");
    box(ctx, x + 2, y - 9, 4, 1, "#a39c67");
    torch(ctx, x + offset, y - 3, time, 1, ready || active, wind);
  }
  if (active) {
    const pulse = (time * 1.8) % 1;
    ctx.globalAlpha = (1 - pulse) * 0.7;
    pixelRing(ctx, x, y + 2, 3 + pulse * 6, 9, "#dcb97b", 0.5);
    ctx.globalAlpha = 1;
  }
}

export function drawCore(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  sinceHit: number,
  health: number,
  reducedMotion: boolean,
) {
  const low = Math.max(0, 1 - health / .5);
  const glow = low ? `rgb(${Math.round(101 + 151 * Math.min(1, low * 2))}, ${Math.round(216 - low * 128)}, ${Math.round(163 - low * 73)})` : "#65d8a3";
  ctx.globalAlpha = 0.11 + (reducedMotion ? 0 : 0.05 * Math.sin(time * 2.7));
  pixelRing(ctx, x, y - 6, 12, 22, low ? glow : "#a3f0c6", 1);
  box(ctx, x - 12, y - 18, 24, 13, glow);
  ctx.globalAlpha = 1;
  stamp(ctx, coreBase, x, y + 3);
  const float = Math.sin((reducedMotion ? 0 : time) * 2.4);
  const vibration = !reducedMotion && sinceHit < .065 ? (sinceHit < .032 ? -1 : 1) : 0;
  const gx = x + vibration, gy = y + float;
  ctx.save();
  if (!reducedMotion && sinceHit < .16) ctx.filter = "brightness(1.32)";
  stamp(ctx, coreGem, gx, gy);
  ctx.restore();
  if (health < 1) {
    linePixels(ctx, gx - 3, gy - 10, gx, gy - 8, "#234e4e", .5, .75);
    linePixels(ctx, gx, gy - 8, gx - 1.5, gy - 6, "#234e4e", .5, .75);
    if (health < .5) linePixels(ctx, gx, gy - 8, gx + 3, gy - 10, "#234e4e", .5, .75);
  }
  if (reducedMotion) return;
  for (let i = 0; i < 5; i++) {
    const a = time * (0.8 + i * 0.1) + i * 2.4;
    const glintX = x + Math.cos(a) * (8 + i * 0.7);
    const glintY = y - 8 - i * 2 + Math.sin(a) * 3;
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(a + 1) ** 2;
    box(ctx, glintX, glintY, 0.5, 1, "#c6f9bc");
  }
  ctx.globalAlpha = 1;
}
export function makeAmbient(level: Level, routes: readonly Route[]): Ambient {
  const rand = seeded(level.seed + 15);
  const roads = pathTiles(routes.flatMap((route) => route.segments));
  const grasses: AmbientPoint[] = [];
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand() * level.width),
      y = Math.floor(rand() * level.height);
    if (
      roads.has(key(x, y)) ||
      level.plots.some(([px, py]) => px === x && py === y) ||
      level.pools.some(([px, py]) => px === x && py === y)
    )
      continue;
    grasses.push({
      x: x * CELL + 2 + rand() * 12,
      y: y * CELL + 2 + rand() * 12,
      phase: rand() * 6.3,
    });
  }
  return {
    flies: level.biome === "frost" ? [] : grasses,
    ripples: level.pools.map(([x, y]) => ({
      x: x * CELL + 3 + rand() * 9,
      y: y * CELL + 3 + rand() * 9,
      phase: rand() * 8,
    })),
  };
}
export function drawAmbient(
  ctx: CanvasRenderingContext2D,
  ambient: Ambient,
  time: number,
) {
  for (const { x, y, phase } of ambient.ripples) {
    const t = (time * 0.38 + phase) % 1;
    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.48;
    const width = (2 + t * 5) * 0.5;
    box(ctx, x + Math.sin(t * Math.PI) * 2, y, width, 0.5, "#a2cabb");
    box(ctx, x + 2, y + 1.5, width * 0.65, 0.5, "#659e91");
  }
  for (const { x, y, phase } of ambient.flies) {
    const t = time * 0.72 + phase;
    ctx.globalAlpha = Math.max(0, Math.sin(t)) * 0.86;
    const px = x + Math.sin(t * 1.4) * 3,
      py = y + Math.cos(t) * 2;
    box(ctx, px, py, 1, 1, "#e5dd86");
    box(ctx, px - 0.5, py + 0.5, 2, 0.5, "#dcd27b55");
  }
  ctx.globalAlpha = 1;
}
