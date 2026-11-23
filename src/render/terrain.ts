import { drawBattleLandmark, drawFootbridge } from "./battle-details.ts";
import { CELL, clamp, key, overTunnel } from "../engine/route.ts";
import type { Level, Route, RouteSegment } from "../engine/types.ts";
import { linePixels } from "./animation.ts";
import { PIXEL_SCALE, box, canvas2d } from "./canvas.ts";
import type { SceneBounds } from "./canvas.ts";
import { drawMineTunnel } from "./mine-tunnel.ts";
import { createSurfaceDetails, drawRegionalDetail, drawRiftOutcrop } from "./terrain-details.ts";
import { bogPad, bogReed, broadleaf, landShape, lilyPad, logPile, reedBed, rockLedge, splitIce, swampTree } from "./landforms.ts";

// 像素画渲染层。关卡地形先绘制到离屏画布，每帧只更新战斗对象。
export function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function stone(ctx: CanvasRenderingContext2D, x: number, y: number, size = 1) {
  const b = (dx: number, dy: number, w: number, h: number, color: string) =>
    box(ctx, x + dx * size, y + dy * size, w * size, h * size, color);
  b(-4, 0, 10, 3, "#162d25");
  b(-3, -3, 7, 5, "#475f55");
  b(-1, -5, 5, 5, "#627b6c");
  b(-1, -4, 4, 1, "#91a496");
  b(-3, -1, 3, 2, "#6b8a72");
  b(3, -2, 2, 4, "#334e44");
  b(0, -3, 2.5, .5, "#b0bb985c");
  b(1, -.5, 2, .5, "#293f3280");
}

function clearing(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, biome?: Level["biome"]) {
  const snow = biome === "frost";
  const peat = biome === "wetland" || biome === "river-edge";
  const quarry = biome === "quarry";
  const rift = biome === "rift";
  const mire = biome === "mire";
  const ground = rift ? "#68526854" : mire ? "#4c5c4a60" : quarry ? "#cfa16a45" : snow ? "#d8e7db70" : peat ? "#648b6360" : "#7d975861";
  const leaf = rift ? "#87728a" : mire ? "#53744a" : quarry ? "#9c8255" : snow ? "#77949a" : peat ? "#548859" : "#69864a";
  const tip = rift ? "#c4a2b6" : mire ? "#a2ba78" : quarry ? "#d4b777" : snow ? "#e1eae3" : peat ? "#afbc78" : "#d4bd72";
  const patch = (color: string, points: readonly [number, number][]) =>
    landShape(ctx, points.map(([px, py]) => [x + px * size, y + py * size]), color);
  patch(ground, [[-8,2],[-7,-1],[-4,-2],[-3,-4],[2,-3],[4,-1],[7,-1],[8,2],[4,3],[-3,4]]);
  for (const [px, py, height] of [[-5, 1, 2], [-1, 2, 4], [2, -1, 3], [5, 2, 2]]) {
    patch(leaf, [[px,py], [px-2,py-height], [px+.5,py-height+.75], [px+1.5,py-height-.5], [px+.75,py+.5]]);
    box(ctx, x + (px - 1.75) * size, y + (py - height - .25) * size, 1.25 * size, .75, tip);
  }
}
export function tree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  variant: boolean,
  needles?: readonly string[],
) {
  const b = (dx: number, dy: number, w: number, h: number, color: string) =>
    box(
      ctx,
      x + dx * size,
      y + dy * size,
      Math.max(1, Math.round(w * size)),
      Math.max(1, Math.round(h * size)),
      color,
    );
  const palette =
    needles ??
    (variant
      ? ["#1c3b2f", "#285640", "#39724a", "#529158", "#77a766"]
      : ["#142f29", "#224a37", "#306545", "#488253", "#67995d"]);
  const [outline, dark, mid, light, tip] = palette;
  b(-7, -1, 17, 3, "#122e254e");
  b(-3, -2, 6, 4, "#163227");
  b(-1, -8, 3, 9, "#493f2d");
  b(0, -5, 1, 5, "#8c7150");
  b(-7, -9, 15, 6, outline);
  b(-5, -15, 11, 14, outline);
  b(-3, -19, 7, 16, outline);
  b(-1, -22, 3, 18, outline);
  b(-6, -8, 13, 4, dark);
  b(-4, -13, 9, 8, dark);
  b(-2, -18, 5, 11, dark);
  b(0, -21, 1, 9, mid);
  b(-5, -8, 10, 2, mid);
  b(-4, -11, 7, 2, mid);
  b(-3, -14, 6, 3, mid);
  b(-1, -18, 3, 4, mid);
  b(-4, -8, 3, 1, light);
  b(-3, -11, 3, 1, light);
  b(-2, -14, 3, 1, light);
  b(-1, -17, 2, 1, light);
  b(0, -20, 1, 1, tip);
  b(-3, -11, 1, 1, tip);
  b(-5, -7, 1, 1, light);
  b(2, -6, 2, 1, dark);
  for (let tier = 0; tier < 4; tier++) {
    const sy = -18 + tier * 3;
    box(ctx, x - tier * size * .7, y + sy * size, size, .5, tip + "90");
    box(ctx, x + size * (tier + .5), y + (sy + 1.5) * size, size, .5, light + "90");
  }
  box(ctx, x + size, y - size * 3, .5, size * 2, "#b59a694f");
}
export function crystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  palette: readonly string[],
) {
  const b = (dx: number, dy: number, w: number, h: number, color: string) =>
    box(ctx, x + dx * size, y + dy * size, w * size, h * size, color);
  const [edge, shade, face, glint] = palette;
  b(-1, -14, 3, 13, edge);
  b(-3, -11, 7, 9, edge);
  b(-4, -8, 9, 5, edge);
  b(-2, -3, 5, 3, edge);
  b(-1, -12, 2, 10, face);
  b(-3, -8, 4, 4, face);
  b(1, -10, 2, 7, shade);
  b(2, -8, 2, 4, shade);
  b(-1, -11, 1, 7, glint);
  b(-2, -8, 1, 3, glint);
  b(0, -3, 2, 1, face);
  b(-.5, -10, .5, 4, "#fff7dd9c");
  b(1.5, -6, 1, .5, glint + "79");
}
export const EMERALD = ["#153d37", "#32a98b", "#7ef3c1", "#e0ffe0"];

export function pathTiles(segments: readonly RouteSegment[]) {
  const tiles = new Set<string>();
  for (const part of segments) {
    const sx = Math.sign(part.dx), sy = Math.sign(part.dy);
    for (let i = 0; i <= part.length; i++)
      tiles.add(key(part.start[0] + sx * i, part.start[1] + sy * i));
  }
  return tiles;
}

function drawMineRail(ctx: CanvasRenderingContext2D, route: Route, painted?: Set<string>) {
  const fresh = painted && route.segments.filter((part) => {
    const id = [part.start, part.dx, part.dy].join("/");
    if (painted.has(id)) return false;
    painted.add(id);
    return true;
  });
  const visible = (distance: number) => !fresh ||
    fresh.some(({ from, length }) => distance >= from && distance < from + length);
  const position = (d: number, across = 0) => route.at(d, across);
  const track = (a: {x: number; y: number}, b: {x: number; y: number}, color: string, width: number) =>
    linePixels(ctx, a.x * CELL + 8, a.y * CELL + 8, b.x * CELL + 8, b.y * CELL + 8,
      color, .55, width);
  for (let d = 0; d < route.distance - .35; d += .39) {
    if (!visible(d)) continue;
    track(position(d, -.33), position(d, .33), "#695243", 1.5);
    track(position(d, -.27), position(d, .28), "#ac8060", .65);
  }
  for (const side of [-.19,.19]) {
    for (let d = 0; d < route.distance - .3; d += .21) {
      if (!visible(d)) continue;
      const a = position(d, side), b = position(Math.min(d + .21, route.distance), side);
      track(a, b, "#54453e", 1.5);
      track(a, b, "#cdb792", .65);
    }
  }
}

function mireFrostSplitTile(level: Level, tileY: number) {
  const edgeY = clamp(tileY, 0, level.height - 1);
  const shiftX = Math.sin(tileY * 0.28) * Math.min(3, Math.abs(tileY - edgeY) * 0.28);
  return level.width - 2.55 - edgeY * .19 + Math.max(0, edgeY - 12) * .38 - shiftX;
}

function paintGround(
  ctx: CanvasRenderingContext2D,
  level: Level,
  bounds: SceneBounds,
  wetTile: (x: number, y: number) => boolean,
  dryColors: readonly string[],
  marshColors: readonly string[],
  waterColors: readonly string[],
) {
  const rgb = (color: string) => [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
  const dry = dryColors.map(rgb), marsh = marshColors.map(rgb), water = waterColors.map(rgb);
  const frosty = level.biome === "frost";
  const quarry = level.biome === "quarry";
  const rift = level.biome === "rift";
  const mireEdge = level.biome === "mire-edge";
  const mire = level.biome === "mire" || mireEdge;
  const shore = rgb(rift ? "#786778" : mire ? "#68614d" : quarry ? "#ac7955" : frosty ? "#bccdcf" : level.biome === "forest" ? "#7c8d56" : "#7e9569");
  const shallow = rgb(rift ? "#6f506e" : mire ? "#53695b" : quarry ? "#8e9068" : frosty ? "#80aebc" : "#609d89");
  const frostLand = ["#9ab7c2", "#a8c4ce", "#b4ced6", "#a2bec9"].map(rgb);
  const frostShore = rgb("#b8cbd0");
  const riverWater = ["#2e6678", "#357184", "#3c7c8e", "#326c7e"].map(rgb);
  const riverShallow = rgb("#72a6b4");
  // Sample past the cache edges so the shoreline keeps its shape when the cache grows.
  const tileX = bounds.x / CELL - 3, tileY = bounds.y / CELL - 3;
  const wetRows = Array.from({length: bounds.height / CELL + 6}, (_, y) =>
    Array.from({length: bounds.width / CELL + 6}, (_, x) => Number(wetTile(tileX + x, tileY + y))));
  const depths = wetRows.map((row, y) => row.map((wet, x) => {
    if (!wet) return 0;
    for (let distance = 1; distance <= 2; distance++) {
      for (let dx = -distance; dx <= distance; dx++) {
        const dy = distance - Math.abs(dx);
        if (wetRows[y + dy]?.[x + dx] === 0 || wetRows[y - dy]?.[x + dx] === 0)
          return distance;
      }
    }
    return 3;
  }));
  const height = level.height * CELL;
  const ground = document.createElement("canvas");
  ground.width = bounds.width;
  ground.height = bounds.height;
  const surface = canvas2d(ground);
  const data = surface.createImageData(ground.width, ground.height);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const waterDepth = (x: number, y: number) => depths[y - tileY][x - tileX];
  const wet = (x: number, y: number) => wetRows[y - tileY][x - tileX];
  for (let row = 0; row < ground.height; row++) {
    const y = row + bounds.y;
    const bankShift = Math.sin(y * .12 + level.seed) * 2.5 + Math.sin(y * .043) * 4;
    const bend = Math.min(20, Math.max(-y, y - height, 0) * .12);
    for (let col = 0; col < ground.width; col++) {
      const x = col + bounds.x;
      const cellOffsetX = x - (Math.floor(x / CELL) + .5) * CELL;
      const cellOffsetY = y - (Math.floor(y / CELL) + .5) * CELL;
      const edgeWeight = Math.min(1, (Math.abs(cellOffsetX) + Math.abs(cellOffsetY)) / 6);
      const sx = (x + (bankShift + bend * Math.sin(y * .022)) * edgeWeight) / CELL - .5;
      const sy = (y + (Math.sin(x * .096) * 3 + Math.cos(x * .17) * 1.5) * edgeWeight) / CELL - .5;
      const ix = Math.floor(sx), iy = Math.floor(sy);
      const a = mix(wet(ix, iy), wet(ix + 1, iy), sx - ix);
      const b = mix(wet(ix, iy + 1), wet(ix + 1, iy + 1), sx - ix);
      const depth = mix(a, b, sy - iy);
      const relief = Math.sin(x * .065 + y * .043) + Math.cos(y * .12 + x * .025)
        + Math.sin((x + y) * .19) * .18;
      const band = Math.round(clamp((relief + 2.1) * .72, 0, 3));
      const isMarsh = level.biome === "wetland" || (level.biome === "river-edge" && x > 168 + bankShift * 2.5);
      const splitX = mireEdge ? mireFrostSplitTile(level, y / CELL) * CELL + bankShift * 1.6 : Infinity;
      const eastFrost = mireEdge && x > splitX;
      const mainRiver = mireEdge && x > splitX - 4.5 * CELL;
      const gravel = depth < .5 ? clamp((depth - .29) * 4.75, 0, .94) : clamp((.85 - depth) * 2.5, 0, .88);
      const base = depth >= .5
        ? (mainRiver ? riverWater : water)[band]
        : (eastFrost ? frostLand : isMarsh ? marsh : dry)[band];
      const edge = depth >= .5
        ? (mainRiver ? riverShallow : shallow)
        : (eastFrost ? frostShore : shore);
      const index = (row * ground.width + col) * 4;
      const shallowWater = depth >= .5 ? clamp((2.65 - mix(
        mix(waterDepth(ix, iy), waterDepth(ix + 1, iy), sx - ix),
        mix(waterDepth(ix, iy + 1), waterDepth(ix + 1, iy + 1), sx - ix), sy - iy,
      )) * .19, -.09, .28) : 0;
      const rim = rift ? (gravel + shallowWater) * .65 + Math.max(0, .18 - Math.abs(depth - .5)) * 1.15
        : gravel + shallowWater;
      for (let channel = 0; channel < 3; channel++)
        data.data[index + channel] = mix(base[channel], edge[channel], rim);
      data.data[index + 3] = 255;
    }
  }
  surface.putImageData(data, 0, 0);
  ctx.drawImage(ground, bounds.x, bounds.y);
}

export function buildTerrain(level: Level, routes: readonly Route[], visible: SceneBounds) {
  const distinct = new Map<string, RouteSegment>();
  for (const route of routes)
    for (const part of route.segments) {
      distinct.set([part.start, part.dx, part.dy].join("/"), part);
    }
  const segments = Array.from(distinct.values());
  const width = level.width * CELL, height = level.height * CELL;
  const padX = Math.ceil(Math.max(0, -visible.x, visible.x + visible.width - width) / CELL) + 2;
  const padY = Math.ceil(Math.max(0, -visible.y, visible.y + visible.height - height) / CELL) + 2;
  const bounds = { x: -padX * CELL, y: -padY * CELL, width: width + 2 * padX * CELL, height: height + 2 * padY * CELL };
  const canvas = document.createElement("canvas");
  canvas.width = bounds.width * PIXEL_SCALE;
  canvas.height = bounds.height * PIXEL_SCALE;
  const ctx = canvas2d(canvas);
  ctx.setTransform(PIXEL_SCALE, 0, 0, PIXEL_SCALE, -bounds.x * PIXEL_SCALE, -bounds.y * PIXEL_SCALE);
  ctx.imageSmoothingEnabled = false;
  const rand = seeded(level.seed);
  const frozen = level.biome === "frost";
  const quarry = level.biome === "quarry";
  const rift = level.biome === "rift";
  const mireEdge = level.biome === "mire-edge";
  const mire = level.biome === "mire" || mireEdge;
  const marsh = level.biome === "wetland";
  const sluice = Boolean(level.bridgeDeck);
  const riverEdge = level.biome === "river-edge";
  const isMarsh = (x: number, y: number) =>
    marsh || (riverEdge && x >= 10.5 + Math.sin(y * 0.55));
  const isFrostBank = (x: number, y: number) =>
    frozen || (mireEdge && x >= mireFrostSplitTile(level, y));
  const isMainRiver = (x: number, y: number) =>
    mireEdge && x >= mireFrostSplitTile(level, y) - 4.5;
  const land = rift ? ["#403b49", "#48424f", "#514a58", "#47414f"]
    : mire ? ["#37413a", "#424c3e", "#4b5440", "#41483a"]
    : quarry ? ["#865e4b", "#91694f", "#a77856", "#9b7053"]
    : frozen ? ["#abc7cf", "#b4ced6", "#b9d3d8", "#aec9d4"]
    : ["#4a5f35", "#52663a", "#566c3f", "#506739"];
  const marshLand = ["#36665a", "#3a6b59", "#406d5c", "#426c56"];
  const water = rift ? ["#211d2e", "#292336", "#312940", "#262033"]
    : mire ? ["#273537", "#2d4145", "#3a5051", "#304448"]
    : quarry ? ["#4c6059", "#51675f", "#5c7465", "#627a69"]
    : frozen ? ["#386e88", "#3e778e", "#437b93", "#3d7390"]
    : marsh || riverEdge
      ? ["#268781", "#2a8980", "#27817d", "#29867e"]
      : ["#286762", "#2e6e69", "#2f736c", "#286b63"];
  const frostGrass = ["#a4c2c3", "#7495a2", "#bed5d8", "#6c8c9d", "#d3e3df"];
  const grass = rift ? ["#71657a70", "#554a626c", "#2d2b3866", "#80648365", "#a7889a50"]
    : mire ? ["#547349", "#364b3b", "#648251", "#4b4338", "#769358"]
    : quarry ? ["#ca9d725b", "#af876474", "#614e4360", "#ad9b6e8c", "#d3a57873"]
    : frozen ? frostGrass
    : ["#69814b", "#405730", "#76834b", "#634f35", "#7a884c"];
  const marshGrass = ["#558471", "#3d7562", "#5b8a6b", "#538470"];
  const riverWaterGrain = ["#8ab8cc80", "#6a99ae86", "#53788c65", "#b3d1d780"];
  const waterGrain = rift ? ["#90709360", "#624b7078", "#1d192880", "#b992b04c"]
    : mire ? ["#6c898160", "#9aa88b55", "#273b427a", "#5c7f7766"]
    : quarry ? ["#b3986380", "#cca87a30", "#3b514d80", "#95997685"]
    : frozen ? riverWaterGrain
    : ["#74ac9754", "#a1c2a265", "#28625878", "#23605c58"];
  const frostFir = ["#355467", "#47717e", "#7ea8af", "#b9d4d5", "#eef4ea"];
  const mireFir = ["#21302e", "#2f433c", "#425b4b", "#5c7858", "#83996a"];
  const fir = frozen
    ? frostFir
    : mire
      ? mireFir
      : ["#21382a", "#365038", "#527141", "#74914d", "#a6ab69"];
  const choose = (list: readonly string[], random: () => number) =>
    list[Math.floor(random() * list.length)];
  const inside = (x: number, y: number) => x >= 0 && x < level.width && y >= 0 && y < level.height;
  const left = -padX, right = level.width + padX, top = -padY, bottom = level.height + padY;
  const fringeRandom = (x: number, y: number, salt: number) =>
    seeded(level.seed + Math.imul(x, 73856093) + Math.imul(y, 19349663) + salt);
  const roads = pathTiles(segments);
  const pools = new Set(level.pools.map(([x, y]) => key(x, y)));
  const wetTile = (x: number, y: number) => {
    const edgeX = clamp(x, 0, level.width - 1), edgeY = clamp(y, 0, level.height - 1);
    // Let rivers and channels continue beyond the playable shore with a gradual bend.
    const shiftX = Math.round(Math.sin(y * .28) * Math.min(3, Math.abs(y - edgeY) * .28));
    const shiftY = Math.round(Math.sin(x * .32) * Math.min(3, Math.abs(x - edgeX) * .28));
    return pools.has(key(clamp(x + shiftX, 0, level.width - 1), clamp(y + shiftY, 0, level.height - 1)));
  };
  const approaches = routes.map((route, index) => {
    const { start: [x, y], dx, dy } = route.segments[0];
    const sx = -Math.sign(dx), sy = -Math.sign(dy);
    const style = level.entries[index]?.scenery;
    if ((style !== "trail" && style !== "arch") || inside(x + sx, y + sy)) return 0;
    let length = 0;
    for (let step = 1; step <= 3 && !wetTile(x + sx * step, y + sy * step); step++) {
      roads.add(key(x + sx * step, y + sy * step));
      length = step;
    }
    return length;
  });
  const bridgeTiles = new Set(level.bridgeDeck?.map(([x, y]) => key(x, y)));
  for (const { from: [x, y], to: [tx, ty] } of level.bridges ?? []) {
    const dx = Math.sign(tx - x), dy = Math.sign(ty - y);
    for (let i = 0; i <= Math.abs(tx - x) + Math.abs(ty - y); i++)
      bridgeTiles.add(key(x + i * dx, y + i * dy));
  }
  const covered = (x: number, y: number) => roads.has(key(x, y)) || bridgeTiles.has(key(x, y));
  const plots = new Set(level.plots.map(([x, y]) => key(x, y)));
  // Keep a 1-tile prop clearance around every build plot so trees, rocks and props never clip into plots or towers.
  const nearPlot = new Set<string>();
  for (const [px, py] of level.plots) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        nearPlot.add(key(px + dx, py + dy));
  }
  const reserved = new Set(level.scenery?.map(({ at: [x, y] }) => key(x, y)));
  const treeBlocked = new Set<string>();
  for (const { kind, at: [x, y] } of level.scenery ?? []) {
    if (kind === "mire-keep") {
      for (let dy = -4; dy <= 1; dy++)
        for (let dx = -2; dx <= 2; dx++)
          treeBlocked.add(key(x + dx, y + dy));
    }
    if (kind === "cabin" || kind === "ruins") {
      for (let dy = 0; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          treeBlocked.add(key(x + dx, y + dy));
    }
  }
  for (const { at: [x, y] } of level.devices ?? []) {
    reserved.add(key(x, y));
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        treeBlocked.add(key(x + dx, y + dy));
  }
  if (level.trackSwitch) reserved.add(key(...level.trackSwitch.at));
  for (const tunnel of level.tunnels ?? []) {
    const [x, y] = tunnel.from, [tx, ty] = tunnel.to;
    for (let row = Math.min(y, ty) - 1; row <= Math.max(y, ty) + 1; row++)
      for (let col = Math.min(x, tx) - 1; col <= Math.max(x, tx) + 1; col++)
        if (overTunnel(tunnel, col, row)) reserved.add(key(col, row));
  }
  type TreeKind = "pine" | "broadleaf" | "swamp" | "mire-pine" | "frost-pine";
  const decor: [number, number, number, boolean, TreeKind][] = [];
  const foliage: { canvas: HTMLCanvasElement; x: number; y: number; size: number }[] = [];
  const cacheFoliage = (x: number, y: number, size: number, paint: (sprite: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * PIXEL_SCALE;
    const sprite = canvas2d(canvas);
    sprite.setTransform(PIXEL_SCALE, 0, 0, PIXEL_SCALE, (size / 2 - x) * PIXEL_SCALE, (size - 6 - y) * PIXEL_SCALE);
    paint(sprite);
    foliage.push({ canvas, x, y, size });
  };
  paintGround(ctx, level, bounds, wetTile, land, marshLand, water);
  const ripple = (surface: CanvasRenderingContext2D, x: number, y: number, coldRiver = false) => {
    const light = rift ? "#b78aa755" : coldRiver || frozen ? "#a5d1db66" : mire ? "#92afa368" : quarry ? "#c4b77a6e" : "#a6d4b55c";
    const shadow = rift ? "#4c2c6680" : coldRiver || frozen ? "#5a929f80" : mire ? "#25353f80" : quarry ? "#50605180" : "#578c8080";
    if (sluice) {
      box(surface, x, y, .5, 6, light);
      box(surface, x + 1, y + 3, .5, 4, shadow);
    } else {
      box(surface, x, y, 5, .5, light);
      box(surface, x + 2, y + 1, 3, .5, shadow);
    }
  };
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const px = x * CELL,
        py = y * CELL,
        tile = key(x, y);
      const random = inside(x, y) ? rand : fringeRandom(x, y, 43);
      const wet = wetTile(x, y);
      const floodplain = isMarsh(x, y);
      const coldBank = isFrostBank(x, y);
      const coldRiver = isMainRiver(x, y);
      for (let i = 0; i < 15; i++) {
        const dx = Math.floor(random() * 14),
          dy = Math.floor(random() * 15);
        box(
          ctx,
          px + dx,
          py + dy,
          i % 4 === 0 ? 2 : 1,
          1,
          choose(
            wet ? (coldRiver ? riverWaterGrain : waterGrain)
              : floodplain ? marshGrass
              : coldBank ? frostGrass
              : grass,
            random,
          ),
        );
      }
      if (wet) {
        ripple(ctx, px + 4 + Math.abs(x * 9 + y * 5) % 7, py + 2 + Math.abs(x * 5 + y * 3) % 7, coldRiver);
        if (sluice) {
          const xx = px + 2 + random() * 11, yy = py + random() * 12;
          if (random() > 0.17) {
            box(ctx, xx, yy, 0.6, 5 + random() * 8, "#9dd7b64c");
            box(ctx, xx + 0.6, yy + 3, 0.5, 3 + random() * 5, "#6eb8a376");
          }
        } else if (rift) {
          const ledge = !wetTile(x - 1, y) ? 3 : !wetTile(x + 1, y) ? 11 : 7;
          const notch = Math.abs(x * 11 + y * 7) % 5;
          box(ctx, px + ledge - 2, py + notch + 3, 4, 6, "#4e3e5490");
          box(ctx, px + ledge, py + notch + 5, 2.5, .75, "#a782994a");
          if (!roads.has(tile) && (x + y) % 4 === 1) box(ctx, px + ledge + 1, py + notch + 7, 1.5, .75, "#bf97ad66");
        } else {
          box(ctx, px + 3, py + 8, 6, 1, frozen || coldRiver ? "#8dbec5" : mire ? "#5c8051" : "#5e9384");
          box(ctx, px + 7, py + 9, 5, 1, frozen || coldRiver ? "#639ca9" : mire ? "#36553e" : "#367469");
        }
        if (!roads.has(tile) && !reserved.has(tile)) {
          const shore = !wetTile(x, y + 1);
          if (mire && !coldRiver) {
            if (shore && !nearPlot.has(tile) && random() < 0.45) bogReed(ctx, px + 8, py + 14, 0.92);
            else if (random() < 0.36) bogPad(ctx, px + 9, py + 10);
          } else if (coldRiver) {
            if (y <= 7 && random() < 0.3) splitIce(ctx, px + 8, py + 8);
            else if (shore && !coldBank && !nearPlot.has(tile) && random() < 0.38) bogReed(ctx, px + 8, py + 14, 0.88);
          } else if ((floodplain || riverEdge) && shore && !nearPlot.has(tile) && random() < 0.72) reedBed(ctx, px + 8, py + 14);
          else if (floodplain && random() < (sluice ? 0.14 : 0.56)) lilyPad(ctx, px + 9, py + 10, random() > 0.66);
          else if (frozen && random() < 0.6) splitIce(ctx, px + 8, py + 8);
        }
      } else if (!roads.has(tile) && !plots.has(tile) && !reserved.has(tile)) {
        const nearBorder = x >= -2 && x < level.width + 2 && y >= -2 && y < level.height + 2;
        const dense = nearBorder && (y <= 1 || y >= level.height - 2 || x < 2 || x >= level.width - 2);
        const roll = random(),
          clear = !roads.has(key(x, y - 1)) && !nearPlot.has(tile) && !nearPlot.has(key(x, y - 1)) && !treeBlocked.has(tile);
        const grove = Math.cos(x * .95 + Math.sin(y * .8)) + Math.sin(y * .81 + x * .17);
        if (roll < (dense ? .55 : floodplain ? .29 : .36) + grove * .15 && clear) {
          const kind: TreeKind = floodplain
            ? "broadleaf"
            : coldBank
              ? "frost-pine"
              : mire
                ? (random() < 0.7 ? "swamp" : "mire-pine")
                : "pine";
          decor.push([
            px + 4 + random() * 8,
            py + 8 + random() * 8,
            0.65 + random() * 0.62,
            random() > 0.48,
            kind,
          ]);
        } else if ((quarry || rift) && !nearPlot.has(tile) && roll < .67) clearing(ctx, px + 7, py + 8, .7, level.biome);
        else if (!quarry && !rift && !mire && !frozen && !floodplain && !nearPlot.has(tile) && roll > 0.91 && x > (riverEdge ? 2 : 9) && x < 19 && y < 5)
          logPile(ctx, px + 7, py + 10);
        else if (!nearPlot.has(tile) && roll < 0.58) {
          stone(
            ctx,
            px + 5 + random() * 6,
            py + 6 + random() * 6,
            0.7 + random() * 0.35,
          );
          box(ctx, px + 2, py + 13, 3, 1, rift ? "#9a74b8" : coldBank ? "#d7e6e5" : mire ? "#5e7a52" : "#69834a");
        } else {
          for (let i = 0; i < 4; i++) {
            const gx = px + 2 + random() * 12,
              gy = py + 3 + random() * 11;
            box(ctx, gx, gy, 1, 3, rift ? "#6d5285" : coldBank ? "#7493a0" : mire ? "#3e593d" : "#537b46");
            box(
              ctx,
              gx + 1,
              gy + 1,
              2,
              1,
              choose(coldBank ? frostGrass : quarry || rift || mire ? grass : ["#709750", "#7c9e58", "#32573c"], random),
            );
          }
          if (!mire && roll > 0.87) {
            box(ctx, px + 8, py + 9, 2, 2, "#dabb77");
            box(ctx, px + 12, py + 6, 1, 2, "#cfad6d");
            box(ctx, px + 4, py + 5, 1, 1, "#edc887");
          }
        }
      }
    }
  }
  // Round the visible road over its original route so its painted edges still cover marching units.
  const roadLayer = (radius: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = radius * 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [index, route] of routes.entries()) {
      const first = route.at(0);
      const startX = first.x * CELL + 8, startY = first.y * CELL + 8;
      if (approaches[index]) {
        const { dx, dy } = route.segments[0];
        const backX = -Math.sign(dx) * approaches[index] * CELL;
        const backY = -Math.sign(dy) * approaches[index] * CELL;
        ctx.moveTo(startX + backX - backY * .22, startY + backY + backX * .22);
        ctx.quadraticCurveTo(startX + backX / 2, startY + backY / 2, startX, startY);
      } else {
        ctx.moveTo(startX, startY);
      }
      for (let d = 0; d < route.distance; d += .24) {
        const sample = route.at(d);
        const next = route.at(Math.min(d + .24, route.distance));
        const sway = Math.sin(sample.x * 1.33 + sample.y * .84) * 2.1 + Math.sin(d * 1.45) * .65;
        const x = (sample.x + next.x) * CELL / 2 + 8;
        const y = (sample.y + next.y) * CELL / 2 + 8;
        ctx.quadraticCurveTo(sample.x * CELL + 8 - Math.sign(next.y - sample.y) * sway,
          sample.y * CELL + 8 + Math.sign(next.x - sample.x) * sway, x, y);
      }
      const last = route.at(route.distance);
      ctx.lineTo(last.x * CELL + 8, last.y * CELL + 8);
    }
    ctx.stroke();
  };
  const marshRoad = ["#2b5952", "#517b68", "#7d9277", "#9cac88", "#b5bd95"];
  const mireRoad = ["#242e28", "#424a3c", "#62624c", "#7b765b", "#928b6c"];
  const frostRoad = ["#6a8999", "#87a6b3", "#b2c9ce", "#c6d9df", "#d7e6ea"];
  const road = rift ? ["#2d2837", "#514859", "#6f6475", "#897e88", "#a3989c"]
    : mire ? mireRoad
    : quarry ? ["#694c3b", "#895d45", "#ad7a52", "#c8996e", "#d5a87a"]
    : frozen ? frostRoad
    : marsh
      ? marshRoad
      : ["#3a4931", "#706344", "#9f764b", "#c39761", "#d4aa73"];
  const paintRoad = (colors: string[]) => {
    roadLayer(15.5, colors[0]);
    roadLayer(14.5, colors[1]);
    roadLayer(13, colors[2]);
    ctx.save();
    ctx.translate(0, -1);
    roadLayer(11, colors[3]);
    roadLayer(8, colors[4]);
    ctx.restore();
  };
  ctx.save();
  // Draw water, rather than a dirt road, beneath the floating span between the landings.
  for (const { style, from: [x, y], to: [tx, ty] } of level.bridges ?? []) {
    if (style !== "mire-raft") continue;
    const vertical = x === tx;
    const start = (Math.min(vertical ? y : x, vertical ? ty : tx) + 1) * CELL;
    const end = Math.max(vertical ? y : x, vertical ? ty : tx) * CELL;
    if (start >= end) continue;
    const across = ((vertical ? x : y) - 1) * CELL;
    ctx.beginPath();
    ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    if (vertical) ctx.rect(across, start, CELL * 3, end - start);
    else ctx.rect(start, across, end - start, CELL * 3);
    ctx.clip("evenodd");
  }
  paintRoad(road);
  if (riverEdge) {
    // The long bridge hides the join between the forest dirt and the floodplain road.
    ctx.save();
    ctx.beginPath();
    const eastBank = 10 * CELL;
    ctx.rect(eastBank, bounds.y, bounds.x + bounds.width - eastBank, bounds.height);
    ctx.clip();
    paintRoad(marshRoad);
    ctx.restore();
  }
  if (mireEdge) {
    // The river crossing bridge hides the join between the mire road and the frost-ridge approach.
    ctx.save();
    ctx.beginPath();
    const rightEdge = bounds.x + bounds.width;
    ctx.moveTo(mireFrostSplitTile(level, top) * CELL, bounds.y);
    for (let y = top; y <= bottom; y++) {
      ctx.lineTo(mireFrostSplitTile(level, y) * CELL, y * CELL);
    }
    ctx.lineTo(rightEdge, bounds.y + bounds.height);
    ctx.lineTo(rightEdge, bounds.y);
    ctx.closePath();
    ctx.clip();
    paintRoad(frostRoad);
    ctx.restore();
  }
  const shoulderRandom = seeded(level.seed + 36);
  for (const part of segments) {
    const sx = Math.sign(part.dx),
      sy = Math.sign(part.dy);
    for (const side of [-1, 1]) {
      for (let d = 4; d < part.length * CELL - 3; d += 2 + shoulderRandom() * 3) {
        const offset = side * (14.75 + shoulderRandom() * 2.75);
        const px = part.start[0] * CELL + 8 + d * sx - offset * sy;
        const py = part.start[1] * CELL + 8 + d * sy + offset * sx;
        if (!wetTile(Math.floor(px / CELL), Math.floor(py / CELL)))
          box(
            ctx,
            px,
            py,
            1 + shoulderRandom(),
            .75,
            (isMarsh(px / CELL, py / CELL) ? marshRoad : isFrostBank(px / CELL, py / CELL) ? frostRoad : road)[1] + "95",
          );
      }
    }
    for (let i = 0; i < part.length * 9; i++) {
      const along = rand() * part.length * CELL;
      const across = Math.floor(rand() * 23) - 11;
      const px = part.start[0] * CELL + 8 + along * sx + across * Math.abs(sy);
      const py = part.start[1] * CELL + 8 + along * sy + across * Math.abs(sx);
      box(
        ctx,
        px,
        py,
        rand() > 0.78 ? 2 : 1,
        1,
        choose(
          rift
            ? ["#b8a9b0", "#756878", "#988b94", "#cabcc4"]
            : isFrostBank(px / CELL, py / CELL)
              ? ["#dce6dc", "#8299a1", "#b3c9ca", "#e2e9df"]
            : mire
              ? ["#a49a77", "#5b694e", "#7e7b60", "#b6be89"]
            : isMarsh(px / CELL, py / CELL)
              ? ["#bdd2ae", "#a7bb9c", "#83977f", "#ccd0a6"]
              : ["#e4c28b", "#b99868", "#94744e", "#c99a5c", "#dfb17b"],
          rand,
        ),
      );
    }
    if (rift) for (let along = 4; along < part.length * CELL - 3; along += 7 + Math.round(rand() * 4)) {
      const across = (rand() > .5 ? 1 : -1) * (7 + rand() * 2);
      const px = part.start[0] * CELL + 8 + along * sx + across * Math.abs(sy);
      const py = part.start[1] * CELL + 8 + along * sy + across * Math.abs(sx);
      box(ctx, px, py, sx ? 1.25 : 3, sx ? 3 : 1.25, "#665d6e85");
      box(ctx, px + (sx ? 1 : 0), py + (sy ? 1 : 0), sx ? 0.75 : 3, sx ? 2.5 : 0.75, "#b4a6ab77");
    }
    const incoming = segments.find((previous) => previous.from + previous.length === part.from &&
      previous.start[0] + previous.dx === part.start[0] &&
      previous.start[1] + previous.dy === part.start[1] && previous.dx * sx + previous.dy * sy === 0);
    if (incoming && !wetTile(...part.start)) {
      const [cx, cy] = part.start.map((coordinate) => coordinate * CELL + 8);
      for (let i = 0; i < 10; i++) {
        const a = 5 + shoulderRandom() * 8, b = 5 + shoulderRandom() * 8;
        box(ctx, cx + Math.sign(incoming.dx) * a - sx * b, cy + Math.sign(incoming.dy) * a - sy * b, 1.5, .75, road[0] + "8c");
      }
    }
    if (part.length >= 4 && part.from > 0) {
      const x = part.start[0] * CELL + 8 + part.dx * CELL * 0.5;
      const y = part.start[1] * CELL + 8 + part.dy * CELL * 0.5;
      for (let i = -2; i <= 2; i++)
        box(
          ctx,
          x + i * sy + (2 - Math.abs(i)) * sx,
          y + i * sx + (2 - Math.abs(i)) * sy,
          1,
          1,
          "#e2c893",
        );
    }
  }
  ctx.restore();
  const details = seeded(level.seed + 400);
  for (let y = top; y < bottom; y++)
    for (let x = left; x < right; x++) {
      const detail = inside(x, y) ? details : fringeRandom(x, y, 400);
      const tile = key(x, y),
        wet = wetTile(x, y),
        road = roads.has(tile);
      if (plots.has(tile)) continue;
      for (let i = 0; i < (road ? 14 : 27); i++) {
        const dx = road ? 4 + detail() * 8 : 1 + detail() * 14;
        const dy = road ? 4 + detail() * 8 : 1 + detail() * 14;
        const color = wet
          ? rift ? "#aa84a649" : "#9bc1ad57"
          : road
            ? rift ? "#cab4bf60" : "#ead0a56b"
            : i % 3
              ? rift ? "#78667b4a" : "#8caa674a"
              : rift ? "#b791aa54" : quarry ? "#f1c38b55" : "#b6bf7d55";
        box(ctx, x * CELL + dx, y * CELL + dy, i % 4 ? 0.5 : 1.5, i % 3 ? 0.25 : 0.5, color);
      }
      const safe = !road && !wet && !reserved.has(tile) && !bridgeTiles.has(tile) && !nearPlot.has(tile);
      const tileBiome: Level["biome"] = mireEdge
        ? (isFrostBank(x, y) ? "frost" : "mire")
        : riverEdge && !isMarsh(x, y)
          ? "forest"
          : level.biome;
      if (safe && detail() > 0.58) {
        const px = x * CELL + detail() * 9 + 4,
          py = y * CELL + detail() * 10 + 3;
        const size = .48 + detail() * .44;
        if (!quarry && !isFrostBank(x, y) && inside(x, y) && foliage.length < 10 && (x * 7 + y * 3) % 11 === 0)
          cacheFoliage(px, py, 24, (sprite) => clearing(sprite, px, py, size, tileBiome));
        else clearing(ctx, px, py, size, tileBiome);
      }
      if (safe) {
        const prop = fringeRandom(x, y, 615);
        if (prop() < .24)
          drawRegionalDetail(ctx, x * CELL + 6 + prop() * 4, y * CELL + 7 + prop() * 5,
            tileBiome, Math.floor(prop() * 3));
      }
    }
  for (const [x, y] of level.bridgeDeck ?? []) {
    const px = x * CELL, py = y * CELL;
    box(ctx, px, py, CELL, CELL, "#304f42");
    box(ctx, px + 0.5, py + 0.5, 15, 14, "#a58d62");
    for (let row = 2; row < 15; row += 4) {
      box(ctx, px + 1, py + row, 14, 1, "#c2ab7b");
      box(ctx, px + 1, py + row + 1, 2, 1, "#6f7458");
      box(ctx, px + 4, py + row + 1.5, 4.5, .25, "#634b3368");
      box(ctx, px + 10, py + row - .5, 2.5, .25, "#e4c992a1");
      box(ctx, px + 13.5, py + row + 1, .5, .5, "#544d3e");
    }
  }
  for (const bridge of level.bridges ?? []) drawFootbridge(ctx, bridge, frozen, rift, mire);
  if (quarry) {
    if (level.trackSwitch) {
      const painted = new Set<string>();
      for (const route of routes) drawMineRail(ctx, route, painted);
    } else drawMineRail(ctx, routes[0]);
  }
  for (const [x, y, size, variant, kind] of decor) {
    if (quarry) rockLedge(ctx, x, y, size * .9, variant ? .23 : -.15);
    else if (rift) drawRiftOutcrop(ctx, x, y, size * .85, variant);
    else {
      const paint = (surface: CanvasRenderingContext2D) => kind === "broadleaf"
        ? broadleaf(surface, x, y, size * .82)
        : kind === "swamp"
          ? swampTree(surface, x, y, size * .86)
          : kind === "mire-pine"
            ? tree(surface, x, y, size * .92, variant, mireFir)
            : kind === "frost-pine"
              ? tree(surface, x, y, size, variant, frostFir)
              : tree(surface, x, y, size, variant, fir);
      if (kind !== "frost-pine" && foliage.length < 22 && inside(Math.floor(x / CELL), Math.floor(y / CELL)) &&
          Math.floor(x + y) % 7 === 0)
        cacheFoliage(x, y, 40, paint);
      else paint(ctx);
    }
  }
  for (const tunnel of level.tunnels ?? []) drawMineTunnel(ctx, tunnel);
  for (const landmark of level.scenery ?? []) {
    const lmFrost = isFrostBank(landmark.at[0], landmark.at[1]);
    drawBattleLandmark(ctx, landmark, lmFrost, mire && !lmFrost);
  }
  const surfaces = createSurfaceDetails(bounds, wetTile, covered,
    (x, y) => !covered(x, y) && !nearPlot.has(key(x, y)) && !reserved.has(key(x, y)), seeded(level.seed + 93),
    rift ? "rift" : mire && !mireEdge ? "mire" : "default");
  return {
    canvas, ...bounds, surfaces,
    drawFoliage(ctx: CanvasRenderingContext2D, wind: number, time: number) {
      for (const { canvas, x, y, size } of foliage) {
        // The ground anchor stays still while the tips bend with the weather.
        const bend = wind * (.51 + .49 * Math.sin(time * .57 + x * .13 + y * .06));
        ctx.save();
        ctx.transform(1, 0, -bend / (size - 6), 1, bend * y / (size - 6), 0);
        ctx.drawImage(canvas, x - size / 2, y - size + 6, size, size);
        ctx.restore();
      }
    },
  };
}
export function drawEmptyPlotPad(ctx: CanvasRenderingContext2D, px: number, py: number, level: Level) {
  const { biome } = level;
  const frostBank = biome === "mire-edge" && px / CELL >= mireFrostSplitTile(level, py / CELL);
  const quarry = biome === "quarry",
    frozen = biome === "frost" || frostBank,
    rift = biome === "rift",
    mire = biome === "mire" || (biome === "mire-edge" && !frostBank);
  const tile = (color: string, points: readonly [number, number][]) =>
    landShape(ctx, points.map(([dx, dy]) => [px + dx, py + dy]), color);
  tile(rift ? "#281b38" : mire ? "#1d2c26" : frozen ? "#506d78" : "#243c37", [[.5, 6], [3, 2], [7, 1], [12, 2], [15, 5], [15, 12], [12, 15], [4, 15], [1, 12]]);
  tile(rift ? "#99869d" : mire ? "#76876d" : quarry ? "#bba17f" : frozen ? "#9fbbbb" : "#8d9a71", [[1, 6], [4, 2.5], [11.5, 2.5], [14.5, 6], [14, 11.5], [11, 14], [4, 13.5], [2, 11]]);
  tile(rift ? "#5b4b63" : mire ? "#3e5244" : quarry ? "#765947" : frozen ? "#648491" : "#48684f", [[3, 6], [5, 4], [11, 4], [13, 6], [12.5, 11], [10.5, 12], [5, 12], [3.5, 10]]);
  for (const [dx, dy] of [[4, 3], [11.5, 3.5], [3, 11.5], [12, 11.5]]) {
    box(ctx, px + dx, py + dy, 1, 1, rift ? "#ba8ca6" : mire ? "#9db874" : "#a1b77c");
    box(ctx, px + dx, py + dy, 0.5, 0.5, rift ? "#e1bad1" : mire ? "#d4e09e" : "#d3d7aa");
  }
  for (const [dx, dy, w, h] of [[6, 3, 4, 0.5], [5, 12.5, 5, 0.5], [2.5, 6, 0.5, 3], [13.5, 6, 0.5, 4]])
    box(ctx, px + dx, py + dy, w, h, rift ? "#a07ec2" : mire ? "#789862" : "#7c9a69");
}

export function pedestal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color = "#65755a",
) {
  box(ctx, x - 8, y - 2, 17, 6, "#17312c");
  box(ctx, x - 7, y - 4, 15, 6, "#374e45");
  box(ctx, x - 6, y - 5, 13, 5, color);
  box(ctx, x - 5, y - 5, 10, 1, "#a9af83");
  box(ctx, x - 4, y - 1, 9, 1, "#33423b");
}

export { box } from "./canvas.ts";
