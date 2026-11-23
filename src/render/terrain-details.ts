import { CELL } from "../engine/route.ts";
import type { Level } from "../engine/types.ts";
import { box } from "./canvas.ts";
import type { SceneBounds } from "./canvas.ts";
import { landShape, splitIce } from "./landforms.ts";
import { highQuality } from "./quality.ts";

export function drawRiftOutcrop(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number, crystalline: boolean,
) {
  const shape = (color: string, points: readonly [number, number][]) =>
    landShape(ctx, points.map(([dx, dy]) => [x + dx * size, y + dy * size]), color);
  shape("#252432", [[-12, 1], [-11, -4], [-7, -7], [-4, -13], [3, -15], [8, -11], [13, -6], [12, 1], [4, 3], [-7, 3]]);
  shape("#4e475a", [[-11, 0], [-10, -3], [-6, -6], [-3, -12], [3, -13], [7, -10], [11, -6], [10, 0], [3, 1], [-5, 2]]);
  shape("#666070", [[-8, -3], [-5, -6], [-2, -12], [3, -13], [6, -10], [1, -8], [-3, -3]]);
  shape("#393545", [[-10, 0], [-2, -2], [3, -6], [10, -7], [11, -5], [4, -4], [0, -1], [-6, 1]]);
  shape("#82727f", [[-5, -6], [1, -10], [5, -11], [6, -10], [1, -8], [-3, -6]]);
  if (!crystalline) {
    shape("#72647a", [[4, -5], [7, -6], [10, -6], [9, -5], [6, -4]]);
    return;
  }
  for (const [dx, base, tip] of [[-6, -5, -15], [1, -8, -24], [6, -5, -17]]) {
    shape("#34263e", [[dx - 4, base - 1], [dx - 1, tip + 2], [dx + 2, tip],
      [dx + 5, base - 4], [dx + 3, base + 2]]);
    shape("#8c6994", [[dx - 2, base - 1], [dx + 2, tip + 2], [dx + 4, base - 4], [dx + 2, base]]);
    shape("#cca3ba", [[dx - 2, base - 2], [dx + 2, tip + 2], [dx + 2, base - 5], [dx, base - 3]]);
  }
}

export function drawRegionalDetail(
  ctx: CanvasRenderingContext2D, x: number, y: number, biome: Level["biome"], variant: number,
) {
  const b = (dx: number, dy: number, w: number, h: number, color: string) =>
    box(ctx, x + dx, y + dy, w, h, color);
  if (biome === "mire") {
    if (variant === 0) {
      // Dusky bog toadstools with olive-lime spore spots
      b(-1.5, -3.5, 2.2, 4, "#838a72");
      b(-0.8, -3.5, 1, 3.2, "#b5baa0");
      b(-4, -5.5, 7.5, 2.2, "#4c4050");
      b(-3, -6.7, 5.5, 1.8, "#6c596f");
      b(-2, -6.4, 1.2, .75, "#c2d28e");
      b(1, -5.8, 1, .6, "#b8c78a");
      b(2.2, -2, 1.3, 2.5, "#7b836c");
      b(1.2, -3.5, 3.4, 1.5, "#4d6646");
      b(1.8, -4.1, 2, .9, "#79945d");
    } else if (variant === 1) {
      // Bubbling olive-moss mire puddle
      b(-5, 0, 10, 2.5, "#334c3a");
      b(-3.5, -1, 7, 3, "#496949");
      b(-1.5, -.5, 2.5, 1.5, "#83a761");
      b(-1, -.5, 1, .7, "#d0df9c");
      b(2, .2, 1.5, 1, "#6f9254");
    } else {
      // Swamp cattails and fern tuft
      b(-3.5, -2.5, .8, 4.5, "#556f4f");
      b(-4.1, -3.5, 1.8, 1.8, "#7e6859");
      b(0, -4, .8, 6, "#5b7752");
      b(-0.6, -4.8, 1.8, 2, "#87705e");
      b(2.5, -1.5, 2.5, 1.2, "#74925a");
      b(-1.5, .5, 2.2, 1.2, "#627f50");
    }
  } else if (biome === "rift") {
    if (variant === 0) {
      drawRiftOutcrop(ctx, x, y + 1, .32, true);
    } else if (variant === 1) {
      b(-5, 1, 4, 1.5, "#302638");
      b(-2, -1, 4, 2.5, "#302638");
      b(1, -2, 4, 1.5, "#302638");
      b(-2, .25, 1.5, .5, "#a07b9c");
      b(0, -.5, 2, .75, "#bb92af");
      b(2, -1.25, 2, .5, "#a280a1");
    } else {
      drawRiftOutcrop(ctx, x, y + 1, .42, false);
      b(-.5, -2, 1.5, .75, "#b08a9e");
      b(-5, 2, 1.5, .75, "#796d78");
    }
  } else if (biome === "frost") {
    if (variant === 0) {
      for (const [cx, cy, size] of [[-3, 0, 1], [1, -2, 2], [4, 1, 1]]) {
        b(cx, cy - size, .75, size * 2 + 1, "#f0ffff");
        b(cx - size, cy, size * 2 + 1, .75, "#c9f1fa");
      }
    } else if (variant === 1) splitIce(ctx, x, y);
    else {
      b(-5, 0, 11, 3, "#8caebf");
      b(-4, -1, 9, 3, "#e1eff0");
      b(-2, -2, 5, 2, "#f8faf1");
    }
  } else if (biome === "quarry") {
    if (variant === 0) {
      for (const [cx, cy] of [[-3, 1], [0, -2], [3, 0]]) {
        b(cx, cy, 3, 2, "#665148");
        b(cx, cy, 2, .75, "#d9b683");
      }
    } else if (variant === 1) {
      for (const dx of [-3, 1, 4]) b(dx, -2, 1.5, 6, "#695146");
      for (const dy of [-1, 2]) {
        b(-4, dy, 10, 1, "#a26345");
        b(-3, dy, 5, .5, "#c4875c");
      }
    } else {
      b(-3, 1, 6, 2, "#645345");
      b(-2, -2, 4, 3, "#826449");
      b(-1, -2, 2, 1, "#d3a86b");
      b(4, 1, 1.25, .75, "#66514b");
      b(-5, -1, 1, .75, "#5f4c44");
    }
  } else if (biome === "wetland" || biome === "river-edge") {
    if (variant === 0) {
      b(-5, 0, 10, 2.5, "#a5bc554d");
      b(-3, -1.25, 6, 4.5, "#83a54a82");
      b(1, 0, 3.5, .75, "#b5c77b7a");
    } else if (variant === 1) {
      b(-4, 0, 8, 2.5, "#345e54");
      b(-2.5, -.75, 5, 4, "#4d8b82");
      b(-2, .25, 3, .5, "#b3ded0");
    } else {
      b(0, -3, .75, 6, "#b8ba77");
      b(-2, -4, 4.5, .75, "#a9e4cc");
      b(0, -4.75, .75, 2.25, "#487c78");
    }
  } else if (variant === 0) {
    for (const [i, [cx, cy]] of [[-4, 1], [-2, -2], [1, 1], [3, -3], [5, 0]].entries()) {
      b(cx, cy, .5, 2, "#345e37");
      b(cx - .5, cy - .5, 1.5, 1, i % 2 ? "#e5c577" : "#e0a9b9");
    }
  } else if (variant === 1) {
    for (const [cx, cy] of [[-3, 1], [1, -2], [4, 1]]) {
      b(cx, cy, .75, 2.5, "#e2d7ad");
      b(cx - .75, cy - .75, 2.5, 1.25, "#cc785c");
      b(cx, cy - .75, .5, .5, "#f7dfb3");
    }
  } else {
    for (const [i, [cx, cy]] of [[-4, 0], [-2, 2], [0, -1], [2, 1], [4, 0]].entries())
      b(cx, cy, 2, 1, i % 2 ? "#b78b50" : "#946945");
  }
}

export function createSurfaceDetails(
  bounds: SceneBounds,
  wetTile: (x: number, y: number) => boolean,
  coveredTile: (x: number, y: number) => boolean,
  snowTile: (x: number, y: number) => boolean,
  random: () => number,
  surface: "default" | "rift" | "mire",
) {
  const rift = surface === "rift";
  const mire = surface === "mire";
  const water = new Path2D(), snow = new Path2D();
  const glares: { x: number; y: number; phase: number }[] = [];
  const foam: { x: number; y: number; period: number; phase: number; vertical: boolean }[] = [];
  const right = (bounds.x + bounds.width) / CELL, bottom = (bounds.y + bounds.height) / CELL;
  const sides = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let hasWater = false;
  for (let y = bounds.y / CELL; y < bottom; y++) {
    for (let x = bounds.x / CELL; x < right; x++) {
      const px = x * CELL, py = y * CELL;
      if (!wetTile(x, y)) {
        if (!snowTile(x, y)) continue;
        const inset = sides.map(([dx, dy]) => coveredTile(x + dx, y + dy) ? 8 : 0);
        // A tile flanked by roads may have no clear center.
        if (inset[0] + inset[1] < CELL && inset[2] + inset[3] < CELL)
          snow.rect(px + inset[0], py + inset[2], CELL - inset[0] - inset[1], CELL - inset[2] - inset[3]);
        continue;
      }
      if (coveredTile(x, y)) continue;
      hasWater = true;
      const inset = sides.map(([dx, dy]) => coveredTile(x + dx, y + dy) ? 8 : wetTile(x + dx, y + dy) ? 0 : 3);
      water.rect(px + inset[0], py + inset[2], CELL - inset[0] - inset[1], CELL - inset[2] - inset[3]);
      if (glares.length < 180 && random() < .65)
        glares.push({ x: px + 5 + random() * 6, y: py + 5 + random() * 6, phase: random() });
      for (const [dx, dy] of sides) {
        if (foam.length >= 140 || wetTile(x + dx, y + dy) || coveredTile(x + dx, y + dy)) continue;
        const along = 5 + random() * 6;
        foam.push({ x: px + (dx ? 8 + dx * 4 : along), y: py + (dy ? 8 + dy * 4 : along),
          phase: random(), period: 4 + random() * 2, vertical: dx !== 0 });
      }
    }
  }

  return {
    draw(ctx: CanvasRenderingContext2D, time: number, snowCover: number, reducedMotion: boolean) {
      ctx.save();
      if (snowCover > 0) {
        ctx.fillStyle = "#edfaff";
        ctx.globalAlpha = snowCover;
        ctx.fill(snow);
      }
      if (hasWater && !reducedMotion && (!rift || highQuality())) {
        ctx.clip(water);
        const sweep = (time / 3) % 1;
        const x = bounds.x + sweep * bounds.width;
        if (!rift) {
          ctx.globalAlpha = mire ? .08 : .1;
          for (let y = bounds.y + 9; y < bounds.y + bounds.height; y += 19)
            box(ctx, x + Math.sin(y) * 8 - 14, y, 28, 1, mire ? "#b7d38d" : "#deffe8");
        }
        const spark = time * (mire ? 3.5 : 5);
        const glint = rift ? "#c49cb9" : mire ? "#cbe291" : "#ebffdf";
        for (let i = 0; i < Math.min(3, glares.length); i++) {
          const point = glares[(Math.floor(spark) * 13 + i * 31) % glares.length];
          ctx.globalAlpha = (rift ? .32 : mire ? .48 : .59) * Math.sin(Math.PI * (spark % 1));
          box(ctx, point.x, point.y, 1.5, .5, glint);
          if (point.phase > .55) box(ctx, point.x + .5, point.y - .5, .5, 1.5, glint);
        }
        for (const dot of foam) {
          const age = (time / dot.period + dot.phase) % 1;
          ctx.globalAlpha = (rift ? .24 : mire ? .32 : .4) * Math.sin(Math.PI * age) ** 2;
          box(ctx, dot.x, dot.y, dot.vertical ? .75 : 1.75, dot.vertical ? 1.75 : .75,
            rift ? "#a781a2" : mire ? "#9ac275" : "#e1fff2");
        }
      }
      ctx.restore();
    },
  };
}
