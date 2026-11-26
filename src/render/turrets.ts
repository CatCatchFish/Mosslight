import { headingVector } from "../engine/formation.ts";
import type { Heading } from "../engine/formation.ts";
import type { Point, TowerId } from "../engine/types.ts";
import { paintSprite, stamp } from "./pixel-sprite.ts";
import type { Shape } from "./pixel-sprite.ts";
import { highQuality } from "./quality.ts";
import { shadeSprite } from "./tower-life.ts";

type Mount = { top: number; length: number };
const mounts: Record<TowerId, Mount> = {
  arrow: { top: -19.5, length: 9 },
  cannon: { top: -15.5, length: 11.5 },
  frost: { top: -19, length: 0 },
  ember: { top: -19, length: 0 },
  storm: { top: -22, length: 0 },
  ballista: { top: -18, length: 12 },
  net: { top: -17, length: 0 },
  prism: { top: -19.35, length: 0 },
  "hail-mortar": { top: -16, length: 0 },
  "glaze-lance": { top: -22, length: 0 },
  "salt-caster": { top: -18, length: 0 },
  "spore-caster": { top: -43.5, length: 0 },
};
const specializationMounts: Readonly<Record<string, Mount>> = {
  sniper: { top: -21.5, length: 13.5 },
  volley: { top: -17, length: 9.5 },
  blast: { top: -15, length: 14 },
  quake: { top: -19, length: 8.5 },
  chill: { top: -17, length: 0 },
  shatter: { top: -23, length: 0 },
  wildfire: { top: -15, length: 0 },
  coal: { top: -23, length: 0 },
  fork: { top: -24, length: 0 },
  surge: { top: -16, length: 0 },
  piercer: { top: -19, length: 14 },
  repeater: { top: -17.5, length: 11 },
  sinker: { top: -17.5, length: 0 },
  scatter: { top: -16.75, length: 0 },
  concentrate: { top: -19.15, length: 0 },
  refraction: { top: -18.75, length: 0 },
  avalanche: { top: -17, length: 0 },
  glacier: { top: -16.5, length: 0 },
  skewer: { top: -24, length: 0 },
  flurry: { top: -21, length: 0 },
  "burst-spores": { top: -43.5, length: 0 },
  "parasitic-spores": { top: -43.5, length: 0 },
};
const HEAD_PADDING = 10;
const headCache = new Map<string, HTMLCanvasElement>();

function mountFor(type: TowerId, path: string | null) {
  return path ? specializationMounts[path] ?? mounts[type] : mounts[type];
}

export function muzzleOffset(type: TowerId, heading: Heading, path: string | null = null): Point {
  const [dx, dy] = headingVector(heading),
    { top, length } = mountFor(type, path);
  return [dx * length, top + dy * length * 0.67];
}

function specializedHead(path: string, p: Shape, tension: number) {
  switch (path) {
    case "sniper":
      p("#342d29", [-11, -4], [8, -4], [10, -13], [14, -11], [12, -4], [26, -3],
        [27, 0], [25, 3], [12, 4], [14, 11], [10, 13], [8, 4], [-11, 4]);
      p("#d9b989", [-9, -2], [11, -1], [24, -1], [26, 0], [23, 2], [-9, 2]);
      p("#dac089", [9, -11], [11, -12], [12, -8], [10, -3], [9, 3], [12, 8], [11, 12], [9, 11], [8, 2]);
      p("#9cb6a2", [-6, -4], [-1, -4], [-1, -2], [-6, -1]);
      p("#fff1c7", [22, -2], [27, 0], [22, 2], [23, 0]);
      p("#d7d5a1", [4 - 4 * tension, 0], [10, -10], [10, -9], [5 - 4 * tension, 0], [10, 9], [10, 10]);
      return true;
    case "volley":
      p("#37392c", [-10, -9], [8, -10], [16, -7], [19, -3], [19, 3],
        [16, 7], [9, 10], [-10, 8]);
      for (const side of [-1, 1]) {
        p("#7d8a54", [-8, 6 * side], [10, 7 * side], [17, 3 * side], [12, 2 * side], [-7, 3 * side]);
        p("#c6ad69", [-8 + tension, 4 * side], [7, 4 * side], [10, 3 * side], [-7 + tension, 2 * side]);
      }
      p("#eddba2", [-8, -1], [16, -1], [19, 0], [16, 1], [-8, 1]);
      p("#d2df91", [4 - tension * 3, -3], [8 - tension * 3, -3], [8 - tension * 3, 3], [4 - tension * 3, 3]);
      return true;
    case "blast":
      p("#2f2c2b", [-10, -8], [-5, -11], [21, -11], [28, -7], [28, 7], [22, 11], [-5, 10], [-11, 6]);
      p("#615651", [-8, -7], [-3, -9], [22, -8], [26, -5], [26, 5], [21, 8], [-7, 7]);
      p("#bc8360", [15, -10], [23, -10], [28, -6], [28, 6], [22, 10], [15, 10], [18, 5], [18, -5]);
      p("#453b37", [22, -8], [27, -5], [27, 5], [23, 8], [22, 5]);
      p("#a17459", [1, -9], [5, -9], [5, 8], [1, 8], [2, 2]);
      p("#b69b83", [-6, -6], [16, -6], [17, -4], [-6, -3]);
      return true;
    case "quake":
      p("#29363a", [-10, -7], [-5, -9], [14, -8], [17, -5], [17, 6], [13, 8], [-7, 7], [-11, 3]);
      p("#6f8580", [-8, -5], [-5, -7], [12, -6], [15, -4], [15, 4], [11, 6], [-8, 5]);
      for (const offset of [-4, 3, 10]) {
        p("#c1ae76", [offset, -7], [offset + 2, -7], [offset + 2, 7], [offset, 7]);
        p("#e4c88d", [offset, -6], [offset + 2, -6], [offset + 2, -3], [offset, -3]);
      }
      p("#283838", [14, -4], [17, -4], [17, 5], [14, 5]);
      return true;
    case "piercer":
      p("#313837", [-12, -5], [7, -5], [12, -16], [17, -15], [16, -10], [14, -4],
        [23, -4], [28, 0], [23, 4], [14, 4], [16, 10], [17, 15], [12, 16], [7, 5], [-12, 5]);
      p("#82918a", [9, -4], [12, -13], [15, -14], [13, -6], [12, 0], [13, 6], [15, 14], [12, 13], [9, 4]);
      p("#b8bbb0", [-11, -3], [22, -2], [23, 1], [-10, 3]);
      p("#f5dfaa", [20, -3], [24, -4], [28, 0], [24, 4], [20, 3], [23, 0]);
      p("#dbbc87", [5 - tension * 5, 0], [13, -12], [13, -11], [6 - tension * 5, 0], [13, 11], [13, 12]);
      return true;
    case "repeater":
      p("#393a30", [-11, -9], [8, -9], [11, -12], [19, -11], [16, -4], [22, -3], [22, 3],
        [16, 4], [19, 11], [11, 12], [8, 9], [-11, 9]);
      for (const side of [-1, 1]) {
        p("#8b986e", [-9, 6 * side], [10, 6 * side], [15, 10 * side], [17, 9 * side], [13, 4 * side], [-9, 4 * side]);
        p("#cbb173", [-8, 7 * side], [6 - tension, 7 * side], [8 - tension, 5 * side], [-8, 5 * side]);
      }
      p("#e9d6a8", [-9, -2], [19, -2], [22, 0], [19, 2], [-9, 2]);
      return true;
    default:
      return false;
  }
}

function turretHead(type: TowerId, heading: Heading, load: number, path: string | null) {
  const tension = type === "cannon" ? 3 : Math.floor(load * 3.999);
  const shaded = highQuality();
  const key = [type, heading, tension, path, shaded].join("/");
  const cached = headCache.get(key);
  if (cached) return cached;
  const [dx, dy] = headingVector(heading);
  const top = mountFor(type, path).top * 2 + HEAD_PADDING;
  const painted = paintSprite((r, shape) => {
    const p = (color: string, ...points: Point[]) =>
      shape(
        color,
        ...points.map(
          ([along, across]) =>
            [
              Math.round(along * dx - across * dy),
              Math.round(top + (along * dy + across * dx) * 0.67),
            ] as Point,
        ),
      );
    r(-4, top + 1, 8, 5, "#2d352d");
    r(-3, top, 6, 4, "#8b8d68");
    if (path && specializedHead(path, p, tension)) return;
    if (type === "cannon") {
      p("#333238", [-10, -4], [-6, -8], [14, -8], [17, -11], [22, -10], [25, -6],
        [25, 6], [22, 10], [17, 10], [14, 7], [-7, 7], [-10, 4]);
      p("#716f6d", [-8, -4], [-5, -6], [15, -6], [17, -4], [17, 4], [14, 5], [-6, 5]);
      p("#aaa398", [-6, -5], [15, -5], [16, -2.5], [-6, -2]);
      p("#a36e54", [2, -7], [5, -7], [5, 6], [2, 6]);
      p("#d19e74", [2, -6], [4, -6], [4, -2.5], [2, -2.5]);
      p("#c79563", [16, -7], [18, -9], [22, -8], [24, -5], [24, 5], [21, 8], [18, 8], [16, 5]);
      p("#ead1a3", [17, -7], [19, -8], [22, -7], [23, -5], [19, -5], [17, -3]);
      p("#50453c", [20, -6], [23, -4], [23, 4], [21, 6], [19, 3], [19, -3]);
      p("#302c32", [21, -3.5], [23, -2], [23, 2.5], [21, 4], [20, 2], [20, -1.75]);
    } else if (type === "ballista") {
      p("#39474b", [-13, -6], [-8, -7], [6, -6], [9, -10], [12, -17], [16, -18], [18, -14],
        [14, -7], [12, -4], [23, -3], [25, 0], [22, 4], [12, 5], [15, 8], [18, 15],
        [16, 18], [12, 17], [8, 10], [6, 6], [-8, 7], [-13, 5]);
      for (const side of [-1, 1]) {
        p("#819b99", [7, 5 * side], [10, 9 * side], [13, 16 * side], [16, 16 * side],
          [14, 10 * side], [10, 4 * side], [10, 2 * side]);
        p("#b6c4b8", [11, 10 * side], [13.5, 15.5 * side], [15.5, 15.5 * side], [13.5, 11 * side]);
      }
      p("#90734d", [-11, -4], [-7, -5], [11, -3], [12, 3], [7, 4], [-11, 5]);
      p("#d1af7b", [-9, -3], [7, -2.5], [10, -1], [-9, .5]);
      p("#a6b6af", [1, -2], [18, -2], [20, 0], [17, 2], [1, 1]);
      p("#e3e9d4", [17, 0], [21, -3], [25, 0], [21, 3]);
      const catchAt = 6 - tension * 5;
      p("#dbc6a1", [catchAt, 0], [14, -14], [14, -12.5], [catchAt + 1.5, 0], [14, 12.5], [14, 14]);
    } else if (type === "arrow") {
      p(
        "#433229",
        [-9, -3],
        [7, -3],
        [8, -12],
        [12, -14],
        [13, -10],
        [11, 0],
        [13, 10],
        [12, 14],
        [8, 12],
        [7, 3],
        [-9, 3],
      );
      p(
        "#d5a260",
        [10, -13],
        [12, -13],
        [10, -5],
        [9, 1],
        [11, 9],
        [12, 13],
        [10, 13],
        [7, 2],
        [8, -5],
      );
      p("#e9c181", [-8, -2], [11, -1], [18, -1], [18, 1], [11, 2], [-8, 2]);
      p("#fff2c2", [14, 0], [17, -3], [19, 0], [17, 3]);
      const catchAt = 7 - tension * 4;
      p("#f3c887", [catchAt, 0], [10, -10], [10, -9], [catchAt + 1, 0], [10, 9], [10, 10]);
    } else {
      p("#446f82", [5, -4], [14, -5], [20, 0], [14, 5], [5, 4], [8, 1]);
      p("#a1dfe6", [7, -3], [14, -3], [19, 0], [14, 1], [8, 1]);
      p("#e6fff0", [13, -2], [18, 0], [14, 0]);
    }
  });
  const image = shaded ? shadeSprite(painted) : painted;
  headCache.set(key, image);
  return image;
}
export function drawTurret(
  ctx: CanvasRenderingContext2D,
  type: TowerId,
  x: number,
  y: number,
  heading: Heading,
  recoil: number,
  load: number,
  path: string | null = null,
) {
  const [dx, dy] = headingVector(heading);
  stamp(
    ctx,
    turretHead(type, heading, load, path),
    x - dx * recoil,
    y - dy * recoil * 0.65 - HEAD_PADDING / 2,
  );
}
