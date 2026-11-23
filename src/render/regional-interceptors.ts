import type { Guard, GuardBranch, GuardPost } from "../engine/guards.ts";
import { guardUnitStats } from "../engine/guards.ts";
import { CELL } from "../engine/route.ts";
import type { Level } from "../engine/types.ts";
import { diamond } from "./animation.ts";
import { box, canvas2d } from "./canvas.ts";
import { paintSnowFooting } from "./frost-watch-art.ts";
import { paintSprite, stamp } from "./pixel-sprite.ts";
import { highQuality } from "./quality.ts";
import { pixelEllipse, shadeSprite } from "./tower-life.ts";
import { drawClawSlash, drawGuardHeal, guardBuildAlpha, tintedSilhouette } from "./unit-life.ts";
import { drawInterceptorUpgrade, interceptorForm, interceptorLift } from "./interceptor-upgrade.ts";

const kennelCache = new Map<string, HTMLCanvasElement>();
const houndCache = new Map<string, HTMLCanvasElement>();

function kennelBuilding(tier: 1 | 2 | GuardBranch, style?: Level["towerStyle"], mastery = false) {
  const shaded = highQuality();
  const key = [tier, shaded, style, mastery].join("/");
  const cached = kennelCache.get(key);
  if (cached) return cached;
  const dire = tier === "dire", pack = tier === "pack", upgraded = tier !== 1;
  const painted = paintSprite((r, p) => {
    // Timber & frost-slate arctic kennel base
    p("#1d2b38", [-23, 2], [-20, -6], [-17, -26], [0, -39], [17, -26], [20, -6], [23, 2], [18, 6], [-18, 6]);
    p("#5e7687", [-20, 1], [-17, -5], [17, -5], [20, 1], [17, 4], [-17, 4]);
    p("#755a45", [-16, -5], [-15, -24], [15, -24], [16, -5], [11, -2], [-11, -2]);
    p("#594437", [9, -23], [15, -23], [16, -5], [10, -3]);
    r(-14, -20, 2, 14, "#a38262");
    for (const y of [-17, -11, -5]) {
      r(-15, y, 7, 1, "#4b4139");
      r(8, y, 7, 1, "#4b4139");
      r(-12, y + 1, 3, .75, "#a48665");
    }
    // Arched kennel entrance
    p("#233340", [-8, 0], [-8, -11], [-4, -16], [4, -16], [8, -11], [8, 0]);
    p("#16232e", [-5.5, -1], [-5.5, -10], [-3, -13], [3, -13], [5.5, -10], [5.5, -1]);
    r(-7, 0, 14, 2, "#b8d0dc");
    // Snow-laden pitched frost roof
    p("#294154", [-23, -22], [-17, -28], [0, -41], [17, -28], [23, -22], [17, -19], [-17, -19]);
    p(dire ? "#4f7fa3" : pack ? "#4d8a9c" : "#5e8da8", [-20, -23], [-15, -28], [0, -38.5], [15, -28], [20, -23], [15, -21], [-15, -21]);
    p("#99b7c5", [-22, -23], [-17, -29], [0, -41], [11, -34], [20, -25], [15, -25],
      [11, -29], [4, -32], [0, -35], [-7, -29], [-13, -28], [-16, -22]);
    p("#d9e8e8", [-20, -24], [-14, -30], [0, -40], [7, -35], [2, -35],
      [-4, -33], [-8, -29], [-13, -27], [-16, -23]);
    // Ice-blue wolf crest under the eaves
    p("#1d3242", [-6, -26], [-7, -33], [-3, -31], [0, -33], [3, -31], [7, -33], [6, -26], [0, -22]);
    p(dire ? "#dff9ff" : "#9fe4fa", [-4.5, -26.5], [-5, -31], [-2, -29.5], [0, -31], [2, -29.5], [5, -31], [4.5, -26.5], [0, -23.5]);
    r(-2.5, -28, 1.5, 1.5, "#1b3040");
    r(1, -28, 1.5, 1.5, "#1b3040");
    if (upgraded) {
      r(-19, -21, 38, 2, "#7e9aa3");
      r(-15, -20, 30, 1, "#b3c7c5");
      // Twin frost crystal lanterns
      for (const side of [-1, 1]) {
        r(side * 13 - 2, -16, 4, 6, "#283c4c");
        r(side * 13 - 1, -15, 2, 4, "#9ef0ff");
      }
    }
    if (dire) {
      // Twin icy spire horns on roof for Dire Alpha branch
      for (const side of [-1, 1]) {
        p("#233b4f", [side * 8, -32], [side * 14, -44], [side * 17, -39], [side * 12, -29]);
        p("#b8f4ff", [side * 9.5, -32], [side * 13.5, -42], [side * 15, -39], [side * 11.5, -30]);
      }
    } else if (pack) {
      // Pennant banner on roof for Pack branch
      r(11, -43, 2, 17, "#6e5540");
      p("#4ca6bf", [13, -43], [22, -40], [13, -36]);
      r(14, -41, 4, 1.5, "#e6fbff");
      p("#705842", [-21, -11], [-21, -15], [-15, -17], [-15, -3], [-21, -4]);
      r(-20, -13, 4, 1.5, "#cfaf80");
    }
    if (mastery) {
      const metal = dire ? "#91b9cf" : "#b4bba4";
      for (const side of [-1, 1]) {
        const x = side * 19;
        p("#354a59", [x - 4, 2], [x - 4, -11], [x, -16], [x + 4, -11], [x + 4, 2]);
        r(x - 2, -10, 4, 9, metal);
        r(x - 1, -8, 2, 3, "#dfeff0");
      }
      r(-8, -19, 16, 1.5, metal);
    }
    if (style === "frost-watch") paintSnowFooting(r, p, 22, 5.5);
  }, 2);
  const img = shaded ? shadeSprite(painted) : painted;
  kennelCache.set(key, img);
  return img;
}

type HoundPose = "rest" | "run" | "brace" | "bite";

interface HoundFrameSpec {
  bob: number;
  rearBob: number;
  stretch: number;
  tailY: number;
  tailTip: number;
  hx: number;
  hy: number;
  headAngle: number;
  earPin: number;
  earFlick: boolean;
  blink: boolean;
  jaw: number;
  // [farRear, farFront, nearRear, nearFront] as [reachX, liftY]
  legs: readonly [readonly [number, number], readonly [number, number], readonly [number, number], readonly [number, number]];
}

const REST_FRAMES: readonly HoundFrameSpec[] = [
  // 0: calm alert stance
  { bob: 0, rearBob: 0, stretch: 0, tailY: 0, tailTip: 0, hx: 12, hy: -23, headAngle: 0, earPin: 0, earFlick: false, blink: false, jaw: 0,
    legs: [[0, 0], [0, 0], [0, 0], [0, 0]] },
  // 1: inhale rise & gentle tail sway up
  { bob: -1.1, rearBob: -0.4, stretch: 0.3, tailY: -2.2, tailTip: -1.6, hx: 12.4, hy: -23.7, headAngle: -0.05, earPin: -0.6, earFlick: false, blink: false, jaw: 0,
    legs: [[0, 0], [0.3, 0], [0, 0], [0.4, 0]] },
  // 2: calm blink & tail sweep down
  { bob: 0.4, rearBob: 0.2, stretch: -0.2, tailY: 1.8, tailTip: 1.2, hx: 12, hy: -22.7, headAngle: 0.04, earPin: 0.4, earFlick: false, blink: true, jaw: 0,
    legs: [[0, 0], [0, 0], [0, 0], [0, 0]] },
  // 3: sniff the snow
  { bob: 0.7, rearBob: -0.5, stretch: 0.5, tailY: -3.2, tailTip: -2.0, hx: 14.2, hy: -19.8, headAngle: 0.28, earPin: -0.8, earFlick: false, blink: false, jaw: 0,
    legs: [[0, 0], [1.0, 0], [-0.4, 0], [1.5, 0]] },
  // 4: vigilant ear flick & head raise
  { bob: -0.9, rearBob: 0, stretch: 0.2, tailY: -3.6, tailTip: -2.6, hx: 11.5, hy: -24.8, headAngle: -0.14, earPin: -1.2, earFlick: true, blink: false, jaw: 0,
    legs: [[-0.4, 0], [0.6, 0], [-0.4, 0], [0.8, 0]] },
  // 5: frost wolf howl
  { bob: -1.8, rearBob: 1.1, stretch: -0.5, tailY: 3.2, tailTip: 2.2, hx: 10.2, hy: -26.8, headAngle: -0.46, earPin: 1.4, earFlick: false, blink: false, jaw: 2.8,
    legs: [[-0.8, 0], [1.2, 0], [-1.0, 0], [1.6, 0]] },
];

const RUN_FRAMES: readonly HoundFrameSpec[] = [
  // 0: full extended airborne bound
  { bob: -2.4, rearBob: -2.0, stretch: 1.8, tailY: -3.2, tailTip: -2.0, hx: 14.2, hy: -23.4, headAngle: 0.06, earPin: 1.6, earFlick: false, blink: false, jaw: 1.0,
    legs: [[-5.2, -2.6], [4.6, -3.2], [-6.6, -3.2], [6.0, -3.8]] },
  // 1: front paw landing & hind gather
  { bob: 0.6, rearBob: -1.6, stretch: -0.4, tailY: -4.6, tailTip: -3.0, hx: 13.0, hy: -22.5, headAngle: 0.02, earPin: 1.0, earFlick: false, blink: false, jaw: 0.5,
    legs: [[2.2, -2.5], [1.6, 0], [3.5, -3.0], [2.8, -0.4]] },
  // 2: coiled mid-stride tuck
  { bob: 1.0, rearBob: -0.6, stretch: -1.8, tailY: -1.2, tailTip: 0.4, hx: 12.2, hy: -22.2, headAngle: 0.08, earPin: 1.2, earFlick: false, blink: false, jaw: 0.4,
    legs: [[4.2, -0.4], [-3.6, -2.2], [5.0, 0], [-4.8, -2.8]] },
  // 3: powerful hind drive / launch
  { bob: -1.8, rearBob: 0.5, stretch: 0.9, tailY: 0.8, tailTip: 1.8, hx: 13.6, hy: -23.8, headAngle: -0.04, earPin: 1.4, earFlick: false, blink: false, jaw: 1.2,
    legs: [[-3.2, 0], [4.0, -3.4], [-4.4, -0.6], [5.2, -3.8]] },
];

const BRACE_FRAMES: readonly HoundFrameSpec[] = [
  // 0: early coiling crouch
  { bob: 2.0, rearBob: 1.2, stretch: -0.6, tailY: 1.2, tailTip: 0.6, hx: 13.2, hy: -21.4, headAngle: 0.1, earPin: 1.5, earFlick: false, blink: false, jaw: 0.8,
    legs: [[1.6, 0], [-2.0, 0], [2.0, 0], [-2.4, 0]] },
  // 1: peak spring coil, ears pinned & fangs bared
  { bob: 3.6, rearBob: 2.2, stretch: -1.4, tailY: -1.6, tailTip: -1.0, hx: 14.2, hy: -20.0, headAngle: 0.16, earPin: 2.8, earFlick: false, blink: false, jaw: 2.2,
    legs: [[3.0, 0], [-3.4, 0], [3.6, 0], [-3.8, 0]] },
];

const BITE_FRAMES: readonly HoundFrameSpec[] = [
  // 0: leaping pounce with wide jaw lunge
  { bob: -3.2, rearBob: -1.4, stretch: 2.0, tailY: -5.4, tailTip: -3.6, hx: 16.8, hy: -24.2, headAngle: -0.06, earPin: 2.2, earFlick: false, blink: false, jaw: 4.8,
    legs: [[-5.6, -2.6], [6.6, -4.2], [-6.6, -3.0], [7.6, -4.6]] },
  // 1: jaw snap & front paw slam landing
  { bob: 1.0, rearBob: 0.2, stretch: 0.4, tailY: -1.6, tailTip: -0.8, hx: 15.0, hy: -21.5, headAngle: 0.12, earPin: 1.4, earFlick: false, blink: false, jaw: 0.8,
    legs: [[-1.6, -0.8], [3.8, 0], [-2.2, -1.0], [4.6, 0]] },
];

function houndSpec(pose: HoundPose, frame: number): HoundFrameSpec {
  const table = pose === "run" ? RUN_FRAMES : pose === "brace" ? BRACE_FRAMES : pose === "bite" ? BITE_FRAMES : REST_FRAMES;
  return table[Math.max(0, Math.min(table.length - 1, frame))];
}

function frosthoundSprite(tier: GuardPost["tier"], branch: GuardBranch | undefined, frame: number, pose: HoundPose) {
  const shaded = highQuality();
  const key = [tier, branch, frame, pose, shaded].join("/");
  const cached = houndCache.get(key);
  if (cached) return cached;
  const dire = branch === "dire", pack = branch === "pack", mastery = tier === 4;
  const spec = houndSpec(pose, frame);
  const bite = pose === "bite" && frame === 0;
  const shoulder = spec.bob - (dire ? 4 : tier > 1 ? 1.5 : 0);
  const rear = spec.rearBob;
  const ink = "#283546", shadow = dire ? "#4a6076" : "#687f90";
  const coat = dire ? "#8daabc" : pack ? "#bacdd0" : "#a8bac5";
  const frost = dire ? "#d0e7ed" : "#dce8e9";
  const band = pack ? "#528983" : tier === 1 ? "#9b7150" : "#58758a";
  const trim = pack ? "#b9d8c5" : "#c9dce0";
  const width = (dire ? 19 : pack ? 17 : 16) + spec.stretch * 0.65;

  const painted = paintSprite((r, p) => {
    const tail = spec.tailY, tip = spec.tailTip;
    p(ink, [-width + 3, -19 + rear], [-width - 3, -19 + tail], [-width - 9, -17 + tail + tip * .5],
      [-width - 10, -12 + tail + tip], [-width - 6, -9 + tail + tip], [-width - 1, -11 + tail], [-width + 3, -13 + rear]);
    p(shadow, [-width + 4, -17 + rear], [-width - 3, -17 + tail], [-width - 8, -15 + tail + tip * .5],
      [-width - 8, -12 + tail + tip], [-width - 6, -11 + tail + tip], [-width - 2, -12 + tail], [-width + 4, -14 + rear]);
    p(frost, [-width - 9, -15 + tail + tip * .5], [-width - 6, -14 + tail + tip * .6], [-width - 4, -13 + tail + tip * .5],
      [-width - 6, -11 + tail + tip], [-width - 8, -11 + tail + tip]);

    const legBases: readonly [number, boolean, number][] = [
      [-10 - spec.stretch * .35, true, 0],
      [6 + spec.stretch * .35, true, 1],
      [-14 - spec.stretch * .45, false, 2],
      [11 + spec.stretch * .45, false, 3],
    ];
    for (const [x, far, legIdx] of legBases) {
      const front = legIdx === 1 || legIdx === 3;
      const [reach, lift] = spec.legs[legIdx];
      const knee = x + (front ? 0.5 : 3) + reach * .52;
      const paw = x + reach;
      const y = (far ? -1 : 3) + lift;
      const top = front ? -14 + shoulder : -15 + rear;
      const kneeY = (top + y) * .54 + (lift < -1.5 ? -1.4 : 0);
      const thick = dire ? 4.5 : pack ? 3 : 3.5;
      p(ink, [x - thick, top], [x + thick, top - 1], [knee + thick * .68, kneeY],
        [paw + thick + 1, y - 1], [paw + thick, y], [paw - thick, y], [knee - thick * .62, kneeY + 1], [x - thick, top + 4]);
      p(far ? shadow : coat, [x - thick + 1.5, top], [x + thick - 1.5, top], [knee + 1.25, kneeY],
        [paw + thick - 1, y - 1.25], [paw - thick + 1.5, y - 1.25], [knee - 1, kneeY + 1]);
      if (!far) r(paw - .5, y - 2, thick, 1.25, mastery ? trim : frost);
    }

    const frontEdge = 17 + spec.stretch * .5;
    p(ink, [-width, -12 + rear], [-width - 1, -19 + rear], [-width + 5, -25 + rear],
      [-6, -26 + rear], [4, -27 + shoulder], [12 + spec.stretch * .3, -26 + shoulder], [frontEdge + 1, -20 + shoulder],
      [frontEdge, -12 + shoulder], [9, -7 + shoulder], [2, -9 + shoulder], [-7, -13 + rear], [-width + 5, -11 + rear]);
    p(shadow, [-width + 1, -13 + rear], [-width + 1, -18 + rear], [-width + 6, -23 + rear],
      [-6, -24 + rear], [4, -25 + shoulder], [12 + spec.stretch * .3, -24 + shoulder], [frontEdge - 1, -20 + shoulder],
      [frontEdge - 2, -13 + shoulder], [8, -9 + shoulder], [2, -11 + shoulder], [-7, -15 + rear], [-width + 5, -13 + rear]);
    p(coat, [-width + 2, -18 + rear], [-width + 6, -23 + rear], [-6, -24 + rear], [4, -25 + shoulder],
      [11 + spec.stretch * .3, -24 + shoulder], [13 + spec.stretch * .3, -20 + shoulder], [6, -16 + shoulder],
      [-3, -17 + rear], [-8, -20 + rear], [-width + 4, -16 + rear]);
    p(frost, [-width + 6, -22 + rear], [-6, -24 + rear], [4, -25 + shoulder], [10 + spec.stretch * .3, -24 + shoulder],
      [9 + spec.stretch * .2, -21 + shoulder], [4, -20 + shoulder], [-6, -21 + rear], [-width + 7, -20 + rear]);

    if (dire) {
      const spikes = mastery ? [[-4, 4], [3, 7], [9, 8]] : [[0, 4], [7, 6]];
      for (const [x, rise] of spikes) {
        const y = -24 + shoulder;
        p(ink, [x - 4, y + 1], [x - 3, y - rise], [x + 4, y - 2], [x + 5, y + 1]);
        p("#77adc4", [x - 2.5, y], [x - 2, y - rise + 2], [x + 3, y - 1], [x + 3, y + 1]);
        p(frost, [x - 2.5, y - 1], [x - 2, y - rise + 2], [x + .5, y - 1]);
      }
    } else if (tier >= 2) {
      const y = -22 + shoulder;
      p(ink, [-2, y + 3], [2, y - 3], [9, y - 3], [11, y + 4], [7, y + 10], [0, y + 9]);
      p(band, [0, y + 3], [3, y - 2], [8, y - 2], [9, y + 3], [6, y + 8], [1, y + 7]);
      p(trim, [1, y + 2], [3, y - 1], [8, y - 1], [7, y + 1], [3, y + 2]);
      if (mastery) {
        p("#80b8b4", [-5, y + 3], [-3, y], [1, y + 1], [2, y + 6], [-2, y + 7]);
        r(4, y + 4, 3, 1.75, "#d8ddbd");
      }
    }

    const hx = spec.hx + spec.stretch * .35;
    const hy = spec.hy + (dire ? -4 : tier > 1 ? -1.5 : 0);
    const cos = Math.cos(spec.headAngle), sin = Math.sin(spec.headAngle);
    const px = -3, py = 3; // neck pivot in local head coordinates
    const rot = (x: number, y: number): [number, number] => [
      hx + px + (x - px) * cos - (y - py) * sin,
      hy + py + (x - px) * sin + (y - py) * cos,
    ];
    const head: typeof p = (color, ...points) => p(color, ...points.map(([x, y]) => rot(x, y)));
    const jaw = spec.jaw;
    const ep = spec.earPin;
    const nearEarX = -8 - ep * 1.1;
    const nearEarY = -12 + ep * 1.4;
    const farEarX = spec.earFlick ? 1 : 3 - ep * .9;
    const farEarY = spec.earFlick ? -12.5 : -11 + ep * 1.2;

    head(ink, [-8, 3], [-6, -4], [nearEarX, nearEarY], [-3 - ep * .4, -10 + ep * .5], [1, -6],
      [farEarX, farEarY], [7 - ep * .3, -7 + ep * .5], [7, -4],
      [11, -2], [17, 0], [16, 4], [12, 5], [10, 7 + jaw], [5, 8 + jaw], [-1, 7], [-4, 10], [-7, 6]);
    head(shadow, [-6, 3], [-4, -4], [nearEarX + 2, nearEarY + 2.5], [-3 - ep * .3, -8 + ep * .4], [1, -4],
      [farEarX, farEarY + 2.5], [5 - ep * .2, -6 + ep * .4], [6, -3], [10, -1],
      [15, 1], [14, 3], [10, 4], [9, 5 + jaw], [5, 6 + jaw], [-1, 5], [-4, 8], [-5, 5]);
    head(frost, [-5, 1], [-3, -4], [1, -4], [5, -5], [9, -3], [11, 0], [15, 1],
      [12, 2], [8, 2], [5, 4], [0, 3], [-3, 6]);
    // Eye
    if (spec.blink) {
      head(ink, [3, -1], [7.5, -1.2], [7.5, 0], [3, 0.2]);
    } else {
      head(ink, [2, -2], [6, -3], [8, -1], [6, 1], [3, .5]);
      const eyeColor = dire ? (bite || pose === "brace" ? "#d4fbff" : "#a4deef") : "#d9b67c";
      head(eyeColor, [4, -1.3], [6.6, -1.3], [6.6, -0.1], [4, -0.1]);
    }
    // Nose
    head(ink, [14.5, 0], [17, 0], [17, 2], [14.5, 2]);
    // Open mouth / fangs during bite, brace snarl, or howl
    if (jaw >= 2) {
      head(ink, [7, 4], [14.5, 3], [12.5, 5 + jaw * .45], [9, 6 + jaw * .55], [6, 5.5]);
      if (bite) {
        head("#9d4d5b", [7.5, 4.8], [12, 4.5], [10.5, 6.8], [7.5, 6.2]);
        head("#f4fcff", [11.5, 3.6], [13.8, 3.5], [12.5, 6.0]);
        head("#f4fcff", [8.8, 6.5], [10.5, 5.2], [10.8, 7.6]);
      } else {
        head(frost, [10.5, 3.8], [13, 3.8], [11.2, 5.4]);
      }
    }
    head(band, [-6, 5], [-3, 5], [-4, 10], [-7, 9]);
    head(mastery || dire ? "#dcebef" : "#d8b16c", [-5.5, 7], [-3.5, 7], [-3.5, 9], [-5.5, 9]);
  }, 2);
  const img = shaded ? shadeSprite(painted) : painted;
  houndCache.set(key, img);
  return img;
}

export function drawRegionalInterceptorPost(
  ctx: CanvasRenderingContext2D, post: GuardPost, time: number, style?: Level["towerStyle"], reducedMotion = false,
) {
  const x = post.origin[0] * CELL + 8, y = Math.max(23, post.origin[1] * CELL + 10);
  const squeeze = 1 / (1 + Math.max(0, interceptorLift(post, time, reducedMotion)) * 0.08);
  if (highQuality()) {
    ctx.save();
    ctx.globalAlpha = .28 * squeeze;
    pixelEllipse(ctx, x, y + 2, 12.5 * squeeze, 2.6 * squeeze, "#112230");
    ctx.restore();
  } else {
    box(ctx, x - 11 * squeeze, y, 22 * squeeze, 3 * squeeze, "#14293878");
  }
  drawInterceptorUpgrade(
    ctx, post, x, y, time, reducedMotion,
    ({ tier, branch }) => {
      stamp(ctx, kennelBuilding(branch ?? (tier === 2 ? 2 : 1), style, tier === 4), x, y);
    },
    ({ tier, branch }) => kennelBuilding(branch ?? (tier === 2 ? 2 : 1), style, tier === 4),
  );
  if (highQuality() && !reducedMotion) {
    const pulse = .5 + .5 * Math.sin(time * 2.8 + x * .05);
    ctx.save();
    ctx.globalAlpha = .3 + pulse * .4;
    diamond(ctx, x, y - 14 - (time * 2.5 % 4), 1, "#c8f6ff");
    ctx.restore();
  }
  const rx = post.rally[0] * CELL + 8, ry = post.rally[1] * CELL + 10;
  box(ctx, rx - 3, ry + 1, 6, 1, "#2b4d61b5");
  const trim = "#9fe4fa";
  box(ctx, rx - 2, ry, 1.5, 1, trim);
  box(ctx, rx + .5, ry - 1, 1.5, 1, trim);
}

export function drawRegionalInterceptorIcon(
  canvas: HTMLCanvasElement, tier: 1 | 2 | GuardBranch,
  style?: Level["towerStyle"], mastery = false,
) {
  const ctx = canvas2d(canvas);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const branch = typeof tier === "string" ? tier : undefined;
  const rank = mastery ? 4 : branch ? 3 : tier === 2 ? 2 : 1;
  const x = canvas.width / 2, y = canvas.height - 8;
  stamp(ctx, kennelBuilding(tier, style, mastery), x - 5, y - 4, 1.5);
  const unit = frosthoundSprite(rank, branch, 0, "rest");
  stamp(ctx, unit, x + 8, y + 1, branch === "dire" ? 1.2 : 1);
}

export function drawRegionalInterceptorUnit(
  ctx: CanvasRenderingContext2D, guard: Guard, post: GuardPost, time: number,
  reducedMotion: boolean, showEffects: boolean,
) {
  const sinceHit = time - guard.hurtAt;
  const fallen = guard.hp <= 0;
  if (fallen && sinceHit >= 0.32) return;
  const buildFade = guardBuildAlpha(post.builtAt, time, reducedMotion);
  if (buildFade <= 0) return;
  const attack = fallen ? undefined : guard.attack;
  const aiming = attack !== undefined && time < attack.impact;
  const striking = attack !== undefined && !aiming;
  const windup = aiming ? Math.min(1, (time - attack.start) / Math.max(0.01, attack.impact - attack.start)) : 0;
  const recovery = striking ? Math.min(1, (time - attack.impact) / Math.max(0.01, attack.end - attack.impact)) : 0;
  const followThrough = striking ? (1 - recovery) ** 2 : 0;
  const recoil = reducedMotion ? 0 : Math.max(0, 1 - sinceHit / 0.19) * 3.2;
  const x = guard.x * CELL + 8 + guard.recoil[0] * recoil;
  const ground = guard.y * CELL + 10 + guard.recoil[1] * recoil;
  const moving = !fallen && !attack && time - guard.movedAt < .14;
  const idle = !reducedMotion && !moving && !fallen && !attack && !guard.target && sinceHit > 0.2;
  const rich = highQuality() && !reducedMotion;
  const form = interceptorForm(post, time, reducedMotion);
  const dire = form.branch === "dire";
  const scale = dire ? (form.tier === 4 ? 1.12 : 1.03) : .82 + (form.tier - 1) * .035;

  // Staggered per-wolf idle choreography (breathe, blink, sniff snow, ear-flick glance, howl)
  const slot = Math.max(0, post.guards.indexOf(guard));
  const breathClock = time * (2.35 + slot * 0.19) + post.index * 1.13 + slot * 2.47;
  const breath = idle ? Math.sin(breathClock) : 0;
  const watch = idle ? (time * (1 + 0.053 * slot) + post.index * 0.91 + slot * 2.63) % 8.6 : 0;
  const howlCycle = dire ? 13.5 : 18.5;
  const howlBeat = idle ? (time + post.index * 4.37 + slot * 6.81) % howlCycle : Infinity;
  const howling = idle && howlBeat < 0.95;
  const sniffing = idle && !howling && watch > 2.6 && watch < 3.45;
  const alertLook = idle && !howling && watch > 6.2 && watch < 7.05;
  const blinking = idle && !howling && !sniffing && ((watch > 1.35 && watch < 1.54) || (watch > 5.05 && watch < 5.22));
  const glancing = alertLook && watch > 6.38 && watch < 6.92;

  const dx = attack?.direction[0] ?? guard.facing;
  const dy = attack?.direction[1] ?? 0;
  const side = attack && Math.abs(dx) > 0.12 ? Math.sign(dx) : glancing ? -guard.facing : guard.facing;

  const houndPose: HoundPose = striking ? "bite" : aiming ? "brace" : moving ? "run" : "rest";
  const poseFrame = reducedMotion
    ? 0
    : houndPose === "run"
      ? Math.floor(guard.walk * 7.5) % 4
      : houndPose === "brace"
        ? (windup >= 0.52 ? 1 : 0)
        : houndPose === "bite"
          ? (recovery < 0.45 ? 0 : 1)
          : howling
            ? 5
            : blinking
              ? 2
              : sniffing
                ? 3
                : alertLook
                  ? 4
                  : breath > 0.12
                    ? 1
                    : 0;

  // Dynamic motion transforms
  const runPhase = moving ? guard.walk * Math.PI * 3.75 : 0;
  const runHop = !reducedMotion && moving ? Math.max(0, Math.sin(runPhase)) * 1.6 : 0;
  const pounceHop = !reducedMotion && striking ? Math.sin(Math.min(1, recovery * 1.35) * Math.PI) * 3.4 : 0;
  const lift = runHop + pounceHop;
  const coilPull = !reducedMotion && aiming ? -2.2 * windup : 0;
  const lunge = !reducedMotion && striking ? followThrough * 5.2 : 0;
  const tremor = rich && aiming && windup > 0.65 ? Math.sin(time * 55 + slot) * 0.45 : 0;

  // Snow paw-kick puffs while running
  if (rich && showEffects && moving) {
    const kick = (guard.walk * 3.75) % 1;
    if (kick < 0.42) {
      const k = kick / 0.42;
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.52;
      box(ctx, x - side * (5 + k * 5.5), ground + 0.5 - k * 2.4, 1.5, 1.2, "#dceef5");
      box(ctx, x - side * (3 + k * 3.5), ground + 1.2 - k * 1.3, 1, 1, "#b4d5e3");
      ctx.restore();
    }
  }

  // Ground shadow shrinks softly while bounding or pouncing
  const shadowScale = Math.max(0.68, 1 - lift * 0.065);
  ctx.save();
  ctx.globalAlpha = (fallen ? Math.max(0, 1 - sinceHit / 0.32) : 1) * 0.28 * shadowScale * buildFade;
  pixelEllipse(ctx, x + dx * (lunge * 0.65 + coilPull * 0.4), ground + 1.5, 7.2 * scale * shadowScale, 2 * scale * shadowScale, "#10202b");
  ctx.restore();

  const sprite = frosthoundSprite(form.tier, form.branch, poseFrame, houndPose);
  ctx.save();
  ctx.globalAlpha *= buildFade;
  ctx.translate(x + dx * (lunge + coilPull) + tremor, ground + dy * (lunge + coilPull) - lift);
  if (fallen) {
    const f = Math.min(1, sinceHit / 0.32);
    ctx.globalAlpha = Math.max(0, 1 - f);
    ctx.rotate(side * f * 0.16);
    ctx.scale(1 + f * 0.14, Math.max(0.3, 1 - f * 0.72));
  } else if (!reducedMotion) {
    if (aiming) {
      ctx.rotate(-side * 0.05 * windup);
      ctx.scale(1 + 0.07 * windup, 1 - 0.09 * windup);
    } else if (striking) {
      ctx.rotate(side * (recovery < 0.45 ? -0.09 : 0.07) * followThrough);
      ctx.scale(1 + 0.11 * followThrough, 1 - 0.06 * followThrough);
    } else if (moving) {
      const pitch = Math.cos(runPhase) * (rich ? 0.075 : 0.045);
      const stretch = Math.sin(runPhase) * (rich ? 0.055 : 0.03);
      ctx.rotate(side * pitch);
      ctx.scale(1 + stretch, 1 - stretch * 0.7);
    } else if (idle) {
      const sy = howling ? 1.035 + Math.sin(howlBeat * 14) * 0.015 : 1 + breath * 0.028;
      const sx = howling ? 0.97 : 1 - breath * 0.016;
      ctx.scale(sx, sy);
    }
    if (sinceHit < 0.15) {
      const h = 1 - sinceHit / 0.15;
      ctx.rotate(-side * h * 0.12);
      ctx.scale(1 + h * 0.09, 1 - h * 0.1);
    }
  }
  stamp(ctx, sprite, 0, 0, scale, side);
  if (rich && !fallen && sinceHit < 0.12) {
    ctx.globalAlpha = (1 - sinceHit / 0.12) * 0.72;
    stamp(ctx, tintedSilhouette(sprite, "#ffffff"), 0, 0, scale, side);
  }
  ctx.restore();

  // Idle cold-air frost breath mist (on exhale or during howl)
  if (rich && showEffects && idle) {
    const exhale = Math.sin(breathClock - 1.1);
    if (howling) {
      const h = howlBeat / 0.95;
      ctx.save();
      ctx.globalAlpha = Math.sin(h * Math.PI) * 0.65;
      const mx = x + side * (7.5 * scale) + side * h * 3.5;
      const my = ground - (16.5 * scale) - h * 6.5;
      diamond(ctx, mx, my, 1.35, "#e2fbff");
      box(ctx, mx + side * 2, my - 2.5, 1.4, 1.4, "#b8ecff");
      ctx.restore();
    } else if (!sniffing && exhale > 0.35) {
      const p = (exhale - 0.35) / 0.65;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.42;
      const mx = x + side * (12.5 * scale + p * 3.2);
      const my = ground - (11 * scale) - p * 2.6;
      box(ctx, mx, my, 1.4, 1.2, "#daf6ff");
      if (p > 0.3) box(ctx, mx + side * 1.8, my - 1.4, 1, 1, "#b4e8fa");
      ctx.restore();
    }
  }

  // Subtle frost mane shimmer for Dire Alpha or Tier 4 mastery
  if (rich && showEffects && !fallen && (dire || form.tier === 4)) {
    const spark = (time * 1.4 + post.index * 0.7 + slot * 1.3) % 1;
    if (spark < 0.45) {
      const s = spark / 0.45;
      ctx.save();
      ctx.globalAlpha = Math.sin(s * Math.PI) * 0.55;
      diamond(ctx, x + side * (1.5 - s * 2.5), ground - (13 + s * 5) * scale - lift, 0.9, "#d6f8ff");
      ctx.restore();
    }
  }

  // Fallen frost motes
  if (rich && showEffects && fallen) {
    const f = Math.min(1, sinceHit / 0.32);
    ctx.save();
    ctx.globalAlpha = (1 - f) * 0.65;
    for (const i of [-1, 0, 1]) {
      diamond(ctx, x + i * (3 + f * 4), ground - 5 - f * 7 + Math.abs(i) * 2, 1, "#c8f2ff");
    }
    ctx.restore();
  }

  const fusion = !fallen ? guard.fusion : undefined;
  const fusionAge = time - (fusion?.at ?? -Infinity);
  if (fusion && fusionAge >= 0 && fusionAge < .42 && showEffects && rich) {
    const t = fusionAge / .42;
    const startX = fusion.from[0] * CELL + 8, startY = fusion.from[1] * CELL + 10;
    ctx.save();
    ctx.globalAlpha = (1 - t) * .72;
    stamp(ctx, frosthoundSprite(2, undefined, Math.floor(t * 8) % 4, "run"),
      startX + (x - startX) * t, startY + (ground - startY) * t, .855, startX <= x ? 1 : -1);
    diamond(ctx, x + (1 - t) * 5, ground - 8 - t * 5, 1.5, "#d1e6ed");
    ctx.restore();
  }

  // Frost pounce-bite slash & icy crunch particles
  if (showEffects && rich && striking && followThrough > 0.16) {
    drawClawSlash(ctx, x + dx * 2, ground - lift * 0.5, side, followThrough, false, scale * (dire ? 1.12 : 1));
    const reach = (1 - followThrough) * 7.5;
    ctx.save();
    ctx.globalAlpha = Math.min(1, followThrough * 1.25);
    for (const i of [-1, 0, 1]) {
      const hitX = x + dx * (6.5 + reach) - dy * i * 2.4;
      const hitY = ground - 4.5 + dy * reach + dx * i * 2.4;
      diamond(ctx, hitX, hitY, i === 0 ? (dire ? 1.6 : 1.35) : .85, i === 0 ? "#e6fbff" : "#a8e6f8");
    }
    ctx.restore();
  }

  // Health bar & out-of-combat recovery sparkles when damaged
  const maxHp = guardUnitStats(post, guard).health;
  const healing = !fallen && guard.hp < maxHp && guard.healedAt !== undefined && time - guard.healedAt < 0.25;
  if (healing && showEffects) drawGuardHeal(ctx, x, ground - 6 * scale - lift * 0.5, time, reducedMotion);
  if (!fallen && guard.hp < maxHp) {
    const bar = dire ? 13 : 10;
    const top = ground - (dire ? 22 : 20) * scale - lift * 0.5;
    box(ctx, x - bar / 2 - 0.5, top, bar + 1, 2, "#201c24cc");
    box(ctx, x - bar / 2, top + 0.5, Math.max(0.5, bar * (guard.hp / maxHp)), 1, healing ? "#8ef2b8" : "#8ee6ff");
  }
}
