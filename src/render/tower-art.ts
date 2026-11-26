import { paintSaltCaster, paintSporeCaster } from "./mire-expansion-art.ts";
import type { SporePose } from "./mire-expansion-art.ts";
import { TOWERS } from "../content/towers.ts";
import { headingVector } from "../engine/formation.ts";
import type { Heading } from "../engine/formation.ts";
import type { Level, Point, TowerId } from "../engine/types.ts";
import { paintFrostWatchTower } from "./frost-watch-art.ts";
import { diamond, drawNetMesh, linePixels } from "./animation.ts";
import { box, canvas2d } from "./canvas.ts";
import { paintSprite, stamp } from "./pixel-sprite.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";
import { drawTurret, muzzleOffset } from "./turrets.ts";
import { paintGlazeLance, paintHailMortar } from "./regional-tower-art.ts";
import { drawSporeAttack, SPECIALIZATION_ART } from "./tower-specializations.ts";
import { highQuality } from "./quality.ts";
import {
  BUILD_SECONDS, PENNANT_MOUNT, UPGRADE_SECONDS, UPGRADE_SWAP, buildPose, combine, drawContactShadow, drawDust,
  drawIdleDetail, drawLightPool, drawMasteryMotes, drawMuzzleFlash, drawMuzzleSmoke, drawPennant, drawRecoilDust,
  drawStringSnap, drawUpgradeGlow, firePose, shadeSprite, silhouette, upgradePose,
} from "./tower-life.ts";
import type { Squash } from "./tower-life.ts";

type Painter = (r: Rect, p: Shape) => void;

const bodies: Record<TowerId, Painter> = {
  // The open timber lookout is the narrowest of the mechanical towers.
  arrow(r, p) {
    p("#383a30", [-17, 2], [-14, -3], [-9, -31], [-16, -33], [-15, -41],
      [13, -41], [17, -35], [13, -30], [9, -29], [12, -5], [16, 2], [10, 6], [-10, 6]);
    p("#748265", [-14, 2], [-9, -3], [9, -3], [13, 2], [9, 4], [-9, 4]);
    p("#9f7952", [-12, -2], [-8, -29], [-4, -29], [-6, -9], [-8, 0]);
    p("#ad875d", [6, -29], [9, -29], [11, -7], [12, -1], [8, -1], [7, -7]);
    p("#6d543d", [-7, -25], [-5, -25], [8, -7], [8, -3], [5, -5], [-7, -21]);
    p("#c19d68", [-6, -24], [-4, -23], [8, -6], [6, -6]);
    p("#746b4b", [-12, -31], [-14, -36], [-11, -40], [11, -40], [15, -35], [11, -31]);
    p("#6a9066", [-10, -36], [-8, -39], [9, -39], [12, -36], [8, -34], [-8, -34]);
    r(-11, -35, 21, 1.25, "#b4b383");
    p("#415e4e", [-15, -31], [-3, -31], [-3, -11], [-9, -15], [-15, -11]);
    p("#7ca16b", [-13, -30], [-5, -30], [-5, -15], [-9, -17], [-13, -15]);
    p("#e1c98b", [-11.5, -26], [-8, -26], [-8, -22.5], [-9.75, -21], [-11.5, -22.5]);
    r(6, -31, 6, 2, "#af8e62");
  },
  // A low red-stone gun carriage, with a riveted turntable rather than a tower room.
  cannon(r, p) {
    p("#382f30", [-25, 2], [-25, -8], [-19, -14], [-15, -16], [-14, -25], [-8, -31],
      [10, -31], [17, -26], [18, -15], [23, -12], [25, -7], [24, 2], [18, 6], [-18, 6]);
    p("#634b49", [-23, 1], [-23, -6], [-18, -10], [18, -10], [23, -6], [22, 1], [17, 4], [-17, 4]);
    p("#9c6956", [-21, -3], [-20, -10], [-14, -14], [13, -14], [21, -10], [21, -4],
      [15, 0], [-15, 0]);
    p("#775348", [12, -13], [19, -10], [21, -4], [15, 0], [7, 0], [10, -6]);
    p("#47504e", [-15, -15], [-13, -25], [-8, -29], [10, -29], [15, -25], [16, -15],
      [9, -11], [-9, -11]);
    p("#879087", [-11, -21], [-10, -26], [-6, -28], [8, -28], [12, -25], [11, -21], [7, -18], [-7, -18]);
    r(-8, -24, 16, 2, "#b0b6a3");
    r(-18, -8, 5, 1.5, "#cc9976");
    r(12, -8, 5, 1.5, "#bf8768");
    r(-8, -10, 17, 1.25, "#bd8a74");
    p("#503e38", [-6, -11], [6, -11], [7, -5], [3, -2], [-3, -2], [-7, -5]);
    for (const side of [-1, 1]) {
      const x = side * 17;
      p("#473e3a", [x - 4, -6], [x + 3, -6], [x + 5, -3], [x + 3, 1], [x - 4, 1],
        [x - 5, -2]);
      r(x - 2, -4, 4, 3, "#d0a374");
      r(x - 1.5, -3.75, 1.5, 1.25, "#f0c89b");
    }
  },
  // Wide steel limbs and high buttresses identify the siege weapon at any heading.
  ballista(r, p) {
    p("#2f3a3c", [-26, 3], [-24, -6], [-18, -13], [-14, -30], [-17, -34], [-13, -38],
      [14, -38], [18, -34], [15, -29], [20, -12], [26, -5], [26, 3], [19, 6], [-18, 6]);
    p("#526663", [-23, 2], [-21, -5], [-17, -10], [17, -10], [23, -4], [23, 2],
      [18, 4], [-18, 4]);
    p("#5b706e", [-22, -3], [-19, -11], [-15, -23], [-13, -30], [-6, -29], [-9, -13], [-15, -2]);
    p("#728984", [-20, -5], [-17, -13], [-13, -27], [-9, -27], [-12, -16], [-16, -5]);
    p("#596c69", [7, -29], [14, -29], [17, -22], [21, -9], [23, -3], [16, -2], [11, -11]);
    p("#90a19a", [11, -27], [14, -26], [17, -17], [20, -6], [16, -6], [13, -16]);
    p("#38494e", [-14, -29], [-15, -34], [-12, -36], [13, -36], [16, -33], [12, -30]);
    r(-11, -33, 22, 2, "#b0b8a1");
    p("#3a474a", [-12, -8], [-10, -18], [-6, -23], [5, -23], [11, -18], [12, -8],
      [5, -5], [-5, -5]);
    p("#9a7b55", [-7, -15], [-4, -19], [4, -19], [7, -15], [7, -10], [4, -7], [-4, -7], [-7, -10]);
    r(-4, -15, 8, 4, "#534b3b");
    r(-2, -15, 4, 3, "#d9b273");
    for (const x of [-18, 16]) r(x, -4, 3, 2.5, "#bbc6ae");
  },
  // Light refracting through an octagonal frame reads differently from the pointed ice crown.
  prism(r, p) {
    p("#354d49", [-19, 2], [-14, -5], [-10, -25], [-14, -30], [-14, -45],
      [-9, -50], [9, -50], [14, -45], [14, -30], [9, -25], [13, -6], [18, 2], [12, 6], [-12, 6]);
    p("#6d8e78", [-16, 2], [-11, -5], [11, -5], [15, 2], [10, 4], [-10, 4]);
    p("#548779", [-11, -3], [-7, -24], [7, -24], [11, -5], [8, -2], [-8, -2]);
    p("#95b8a0", [-10, -6], [-6, -23], [-3, -23], [-6, -7]);
    p("#407166", [4, -24], [7, -23], [10, -6], [6, -4], [4, -8]);
    p("#274442", [-11, -43], [-7, -47], [7, -47], [11, -43], [11, -32], [7, -28], [-7, -28], [-11, -32]);
    p("#9eb79b", [-12, -42], [-12, -45], [-8, -48], [8, -48], [10, -46], [-6, -46], [-9, -43], [-9, -35]);
    p("#83a689", [11, -45], [12, -43], [12, -31], [8, -28], [-7, -28], [-9, -30], [7, -30], [10, -33]);
    r(-7, -7, 14, 2, "#a5bf9e");
    r(-2, -22, 4, 11, "#315a56");
    r(-.75, -20, 1.5, 8, "#a3d7ba");
  },
  // The open scaffolding makes room for a hanging bundle and a visible rope drum.
  net(r, p) {
    p("#483a33", [-24, 2], [-23, -3], [-17, -7], [-16, -30], [-23, -33],
      [-21, -40], [16, -41], [21, -39], [23, -33], [18, -29], [18, -7], [24, -3],
      [24, 2], [18, 6], [-18, 6]);
    p("#897457", [-21, 1], [-20, -3], [-15, -6], [15, -6], [20, -3], [21, 2],
      [16, 4], [-16, 4]);
    p("#b08559", [-17, -4], [-14, -34], [-10, -34], [-11, -9], [-13, -3]);
    p("#89613e", [10, -34], [15, -34], [16, -13], [18, -3], [13, -4], [11, -14]);
    p("#94714e", [-10, -13], [-8, -30], [-3, -34], [5, -32], [11, -26], [11, -13],
      [6, -8], [-6, -8]);
    p("#5f4b3e", [-8, -15], [-7, -28], [-2, -31], [4, -29], [8, -24], [8, -14], [5, -11], [-5, -11]);
    p("#cab080", [-20, -36], [-18, -39], [16, -39], [20, -36], [17, -33], [-18, -33]);
    r(-18, -35, 36, 1.25, "#e4c89a");
    r(-3, -37, 5, 6, "#806345");
    r(-14, -30, 3, 3, "#d9bc89");
    r(12, -30, 3, 3, "#bd9a6f");
    p("#514338", [-13, -7], [-9, -13], [9, -13], [14, -7], [10, -3], [-9, -3]);
    p("#be925b", [-11, -7], [-7, -11], [7, -11], [11, -7], [8, -5], [-8, -5]);
    for (const x of [-6, -2, 2, 6]) r(x, -10, 1.5, 4, "#e0bf88");
  },
  frost(r, p) {
    p("#2b4d5c", [-22, 0], [-18, -7], [-16, -14], [-18, -25], [-11, -28],
      [-6, -18], [6, -17], [12, -29], [18, -24], [16, -12], [21, -7], [22, 1], [14, 6], [-15, 6]);
    p("#5e909d", [-19, 0], [-15, -6], [-13, -14], [-16, -23], [-12, -25], [-7, -16], [7, -15],
      [12, -26], [15, -23], [13, -11], [18, -6], [19, 0], [13, 4], [-14, 4]);
    p("#8fbebd", [-17, -2], [-12, -9], [-12, -15], [-15, -22], [-12, -24], [-9, -16], [-9, -9], [-6, -5]);
    p("#317887", [7, -14], [12, -24], [13, -22], [11, -13], [12, -6], [8, -4]);
    p("#3e6879", [-14, -9], [-8, -16], [8, -16], [14, -9], [9, -5], [-9, -5]);
    p("#aed1c7", [-15, 0], [-10, -3], [10, -3], [15, 0], [10, 2], [-11, 2]);
    r(-17, -1, 3, 2, "#e4eee0");
    r(10, -1.5, 5, 1.5, "#c2e4dc");
  },
  ember(r, p) {
    p("#4e332b", [-23, 1], [-20, -5], [-14, -9], [-12, -21], [-19, -26], [-23, -32],
      [-19, -37], [19, -37], [23, -32], [19, -25], [12, -21], [14, -9], [20, -5], [23, 1],
      [17, 5], [-17, 5]);
    p("#7d5442", [-19, 0], [-16, -6], [-12, -10], [12, -10], [16, -6], [19, 0], [14, 3], [-14, 3]);
    p("#a56b4d", [-13, -8], [-10, -20], [9, -20], [12, -8], [8, -5], [-8, -5]);
    p("#553a33", [-8, -7], [-8, -14], [-4, -18], [4, -18], [8, -14], [8, -7], [4, -5], [-4, -5]);
    r(-4, -13, 8, 4.5, "#a75c42");
    r(-2.5, -12, 5, 3, "#e7a36a");
    p("#9a6548", [-20, -32], [-17, -35], [17, -35], [20, -31], [16, -26], [10, -23], [-10, -23], [-16, -26]);
    p("#59392e", [-17, -32], [-13, -34], [13, -34], [17, -32], [13, -29], [-13, -29]);
    p("#cc9569", [-19, -29], [-14, -27], [14, -27], [18, -29], [15, -25], [10, -24], [-10, -24], [-16, -25]);
    r(-17, -4, 3, 2, "#c69470");
    r(14, -4, 3, 2, "#ab775b");
  },
  storm(r, p) {
    p("#323751", [-18, 2], [-14, -5], [-10, -12], [-6, -29], [-15, -36], [-15, -49],
      [-11, -52], [-6, -50], [-6, -42], [-2, -37], [2, -37], [6, -42], [6, -50], [11, -52],
      [15, -49], [15, -36], [6, -29], [10, -12], [14, -5], [18, 2], [13, 6], [-13, 6]);
    p("#656882", [-15, 2], [-10, -5], [-7, -13], [7, -13], [10, -5], [15, 2], [11, 4], [-11, 4]);
    p("#555b79", [-7, -11], [-5, -27], [5, -27], [7, -11], [4, -7], [-4, -7]);
    p("#766c8f", [-5, -30], [-13, -37], [-13, -47], [-11, -50], [-8, -48], [-8, -41],
      [-4, -36], [4, -36], [8, -41], [8, -48], [11, -50], [13, -47], [13, -37], [5, -30]);
    p("#aaa0bf", [-13, -45], [-12, -48], [-10, -49], [-9, -46], [-9, -40], [-11, -39], [-12, -41]);
    p("#9b91b1", [8, -42], [9, -48], [11, -49], [12, -46], [12, -41], [10, -39]);
    for (const y of [-27, -22, -17]) {
      r(-6, y, 12, 3, "#795452");
      r(-5, y, 10, 1.25, "#c49779");
      r(-4, y + .25, 1.5, .75, "#ebc59a");
    }
    r(-10, -2, 20, 1.5, "#9f9cba");
  },
  "hail-mortar": paintHailMortar,
  "glaze-lance": paintGlazeLance,
  "salt-caster": (r, p) => paintSaltCaster(r, p, 1),
  "spore-caster": (r, p) => paintSporeCaster(r, p, 1),
};

const bodiesCache = new Map<string, HTMLCanvasElement>();
const cores = new Map<string, HTMLCanvasElement>();

function towerBody(type: TowerId, tier: number, path: string | null, accent: string,
  style?: Level["towerStyle"], lift = 0, sporePose?: SporePose) {
  const shaded = highQuality();
  const key = [type, tier, path, shaded, style, lift,
    sporePose ? `${sporePose.charge}/${sporePose.release}` : ""].join("/");
  const cached = bodiesCache.get(key);
  if (cached) return cached;
  const painted = paintSprite((r, p) => {
    if (type === "salt-caster") {
      paintSaltCaster(r, p, tier, path, lift);
      return;
    }
    const art = path && SPECIALIZATION_ART[type][path];
    if (art) {
      const span = type === "arrow" || type === "storm" ? 16 : 20;
      const regional = type === "hail-mortar" || type === "glaze-lance" || type === "spore-caster";
      if (!regional) {
        p("#233a36", [-span - 4, 3], [-span - 2, -1], [-span + 4, -6], [span - 5, -6],
          [span + 2, -1], [span + 4, 3], [span - 1, 7], [-span, 7]);
        p("#65786b", [-span - 2, 2], [-span + 3, -4], [span - 4, -4],
          [span + 2, 2], [span - 2, 5.5], [-span + 1, 5.5]);
      }
      art.body(r, p, sporePose);
      if (style === "frost-watch") paintFrostWatchTower(type, r, p, true);
      for (const sign of [-1, 1]) {
        const x = sign * (regional ? 11 : span - 3);
        r(x - 2, regional ? 3.5 : 4.5, 4, 1, accent);
        if (!regional) r(x - 1, 6.5, 2, .5, "#afae91");
      }
      return;
    }
    if (type === "spore-caster") paintSporeCaster(r, p, tier, path, sporePose);
    else bodies[type](r, p);
    if (style === "frost-watch") paintFrostWatchTower(type, r, p, false);
    if (tier < 2) return;
    r(-tier * 2 - 1, 1.25, tier * 4 + 2, 3.35, "#303a36");
    for (let i = 0; i < tier; i++) r(-tier * 2 + 4 * i + .5, 2.1, 2.75, 1.8, accent);
  }, 2);
  const image = shaded ? shadeSprite(painted) : painted;
  bodiesCache.set(key, image);
  return image;
}

function towerCore(type: "frost" | "ember" | "storm", frame: number, accent: string) {
  const shaded = highQuality() && type !== "ember";
  const key = [type, frame, accent, shaded].join("/");
  const cached = cores.get(key);
  if (cached) return cached;
  const painted = paintSprite((r, p) => {
    if (type === "frost") {
      p("#2c6074", [-13, -21], [-18, -31], [-17, -42], [-9, -39], [-7, -35], [-4, -45], [1, -52],
        [7, -45], [8, -37], [16, -41], [17, -33], [11, -21], [2, -18]);
      p("#77bbcc", [-13, -24], [-16, -31], [-16, -40], [-11, -37], [-8, -31], [-7, -25]);
      p("#d4eefa", [-16, -40], [-11, -37], [-11, -33], [-14, -34]);
      p("#8ecadd", [8, -31], [15, -39], [15, -33], [10, -24], [6, -23]);
      p("#a8d5eb", [-8, -31], [-4, -43], [1, -50], [5, -43], [8, -29], [3, -21], [-3, -22]);
      p(accent, [-1, -38], [1, -50], [5, -43], [8, -29], [3, -21], [1, -30]);
      p("#e8f8fb", [-6, -32], [-3, -42], [1, -50], [1, -41], [-1, -31], [-3, -26]);
    } else if (type === "ember") {
      const bend = frame - 1;
      p("#c96343", [-9, -29], [-6 - bend * 2, -40], [-2, -37], [2 + bend * 2, -47],
        [6, -37], [10, -31], [5, -26], [-5, -26]);
      p("#ffaf65", [-5, -28], [-4, -37], [-1, -34], [2 + bend, -44], [5, -36], [7, -31], [4, -27]);
      p("#ffe8a1", [-2, -29], [-1, -35], [1, -34], [3 + bend, -40], [4, -34], [3, -29]);
      r(-1 + bend * .5, -32, 2, 2.5, "#fff2be");
    } else {
      p("#493965", [-8, -42], [-6, -46], [-2, -48], [3, -48], [7, -45], [8, -41], [6, -37],
        [2, -35], [-3, -36], [-7, -38]);
      p(accent, [-6, -42], [-4, -45], [-1, -46], [3, -46], [6, -43], [6, -40], [3, -37], [-2, -37], [-5, -39]);
      r(-5, -43, 9, 2.25, "#f1e8ff");
      r(-3, -44.75, 4, 1.75, "#f1e8ff");
      r(1.75, -39.5, 3, 1.5, "#8a83bf");
    }
  }, 2);
  const image = shaded ? shadeSprite(painted) : painted;
  cores.set(key, image);
  return image;
}

interface TowerPose {
  style?: Level["towerStyle"];
  heading: Heading;
  time: number;
  age: number;
  load: number;
  reducedMotion: boolean;
  focus: number;
  /** Seconds since construction / latest upgrade (Infinity when settled). */
  built: number;
  upgraded: number;
  previous: { tier: number; path: string | null } | undefined;
}

const SHADOW_WIDTH: Record<TowerId, number> = {
  arrow: 8, cannon: 11, ballista: 11, frost: 9, ember: 9, storm: 8, net: 10, prism: 8,
  "hail-mortar": 11, "glaze-lance": 9, "salt-caster": 12, "spore-caster": 12,
};

export function drawTower(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  type: TowerId, tier: number, path: string | null = null,
  pose: Partial<TowerPose> = {},
) {
  const { reducedMotion = false } = pose;
  if (reducedMotion || !highQuality()) {
    drawTowerForm(ctx, x, y, type, tier, path, pose, false);
    return;
  }
  const {
    heading = 0, time = 0, age: releaseAge = Infinity, focus = 0,
    built = Infinity, upgraded = Infinity, previous,
  } = pose;
  const spec = TOWERS[type];
  const seed = x * 7.31 + y * 3.17;
  const beat = time + x * 0.031 + y * 0.023;
  const preparing = releaseAge < 0;
  const charge = preparing ? Math.max(0, 1 + releaseAge / spec.flight[0]) : 0;
  const age = preparing ? Infinity : releaseAge;
  const building = built >= 0 && built < BUILD_SECONDS;
  const upgrading = upgraded >= 0 && upgraded < UPGRADE_SECONDS;
  const oldForm = upgrading && upgraded < UPGRADE_SWAP && previous ? previous : null;
  const formTier = oldForm ? oldForm.tier : tier;
  const formPath = oldForm ? oldForm.path : path;
  const accent = formPath ? spec.paths[formPath].color : spec.color;

  let squash: Squash = firePose(type, formPath, charge, age);
  if (building) squash = combine(squash, buildPose(built));
  if (upgrading) squash = combine(squash, upgradePose(upgraded));
  const base = y + 3;
  const flare = age < .35 ? 1 - age / .35 : 0;

  drawLightPool(ctx, type, x, y, beat, flare, focus);
  drawContactShadow(ctx, x, y, SHADOW_WIDTH[type] + (formPath ? 2 : 0), squash.lift);

  ctx.save();
  ctx.globalAlpha *= squash.alpha;
  ctx.translate(x, base - squash.lift);
  ctx.scale(squash.sx, squash.sy);
  ctx.translate(-x, -base);
  drawTowerForm(ctx, x, y, type, formTier, formPath, pose, true);
  let flash = 0;
  if (building && built > .14) flash = Math.max(0, 1 - (built - .14) / .16);
  if (upgrading) flash = upgraded < UPGRADE_SWAP
    ? (upgraded / UPGRADE_SWAP) ** 2
    : Math.max(0, 1 - (upgraded - UPGRADE_SWAP) / .22);
  if (flash > 0) {
    ctx.globalAlpha = flash * .72;
    stamp(ctx, silhouette(towerBody(type, formTier, formPath, accent, pose.style)), x, y);
  }
  ctx.restore();

  const place = ([px, py]: Point): Point =>
    [x + px * squash.sx, base + (py - 3) * squash.sy - squash.lift];

  // Rank flourishes.
  const mount = PENNANT_MOUNT[type];
  if (!formPath && formTier >= 2 && mount) {
    const [px, py] = place(mount);
    drawPennant(ctx, px, py, beat, accent, formTier);
  }
  if (formTier >= 4) drawMasteryMotes(ctx, x, y, beat, accent, seed);
  drawIdleDetail(ctx, type, x, y, beat, age, seed);

  // Release effects.
  if (!preparing && age < 1) {
    const [mx, my] = muzzleOffset(type, heading, formPath);
    const muzzle = place([mx, my]);
    const dir = headingVector(heading);
    if (type === "cannon" || type === "hail-mortar") {
      const heavy = formPath === "blast" || formPath === "avalanche" ? 1.4 : formPath === "quake" ? 1.1 : 1;
      if (type === "cannon") drawMuzzleSmoke(ctx, muzzle, dir, age, heavy, seed);
      drawMuzzleFlash(ctx, muzzle, dir, age, accent, 3.5 * heavy);
      drawRecoilDust(ctx, x, y, age, heavy);
    } else if (type === "arrow" || type === "ballista") {
      drawStringSnap(ctx, muzzle, dir, age);
      drawMuzzleFlash(ctx, muzzle, dir, age, accent, type === "ballista" ? 2.2 : 1.5);
      if (type === "ballista") drawRecoilDust(ctx, x, y, age, .6);
    } else if (type === "ember") {
      drawMuzzleSmoke(ctx, muzzle, [0, -1], age, .6, seed);
    }
  }

  if (building) drawDust(ctx, x, y, (built - .15) / .45, 1);
  if (upgrading) {
    drawUpgradeGlow(ctx, x, y, upgraded, path ? spec.paths[path].color : spec.color, 24);
    if (upgraded > UPGRADE_SWAP) drawDust(ctx, x, y, (upgraded - UPGRADE_SWAP) / .45, .8);
  }
}

function drawTowerForm(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  type: TowerId, tier: number, path: string | null,
  { heading = 0, time = 0, age: releaseAge = Infinity, load = 1, reducedMotion = false, focus = 0, style }: Partial<TowerPose>,
  rich: boolean,
) {
  const spec = TOWERS[type];
  const accent = path ? spec.paths[path].color : spec.color;
  const preparing = releaseAge < 0;
  const charge = preparing ? Math.max(0, 1 + releaseAge / spec.flight[0]) : 0;
  const age = preparing ? Infinity : releaseAge;
  const beat = reducedMotion ? 0 : time + x * 0.031 + y * 0.023;
  // Salt-caster 10-keyframe catapult throw cycle:
  // preparing (0.26s): Draw 1 -> Draw 2 -> Full Tension -> Whip Up (kf 1..4)
  // post-shot (0.56s): Release -> Follow-through -> Recoil -> Reload 1 -> Reload 2 -> Ready (kf 5..9 -> 0)
  const saltPhase = type !== "salt-caster" || reducedMotion ? 0
    : preparing ? 0.11 + charge * 0.34
    : age < 0.56 ? 0.55 + (age / 0.56) * 0.45
    : 0;
  const lift = saltPhase > 0.02 ? Math.min(9, Math.max(1, Math.round(saltPhase * 9))) / 9 : 0;
  const sporePose = rich && type === "spore-caster" && !reducedMotion ? {
    charge: Math.round(charge * 5) / 5,
    release: preparing ? Infinity : age < .36 ? Math.round(age / .06) * .06 : Infinity,
  } : undefined;
  const body = towerBody(type, tier, path, accent, style, lift, sporePose);
  const compression = reducedMotion || rich ? 0 : .05 * Math.max(0, 1 - age / .06);
  stamp(ctx, body, x, y, 1 - compression);
  if (type === "salt-caster") return;

  const art = path && SPECIALIZATION_ART[type][path];
  if (art) {
    art.animate(ctx, { x, y, beat, age, load, accent, charge, focus, rich, heading });
  } else if (type === "prism") {
    const top = y - 19.35;
    box(ctx, x - 3, top - 3.75, 6, 7.5, "#527b68");
    box(ctx, x - 4.5, top - 2.5, 9, 5, "#527b68");
    box(ctx, x - 3, top - 2.5, 6, 4.75, accent);
    box(ctx, x - 2, top - 3.25, 4, 1.2, "#efffea");
    box(ctx, x + .75, top + 1, 2.25, 1.5, "#75b099");
    if (focus > 0) {
      ctx.save();
      ctx.globalAlpha = .22 + .64 * focus;
      diamond(ctx, x, top, 1 + 1.25 * focus, "#ffffdf");
      ctx.restore();
    }
  } else if (type === "net") {
    const lift = reducedMotion ? 0 : Math.sin(beat * 3) * .5 + charge;
    drawNetMesh(ctx, x, y - 16 - lift, 7, 3.5, accent);
    box(ctx, x - 1.25, y - 10.5, 2.5, 1.5, "#a8805b");
  } else if (type === "arrow") {
    const drift = Math.round(Math.sin(beat * 4) * 1.5);
    box(ctx, x - 5.25 + drift * .5, y - 8.5, 1.5, 1.25, "#8caf76");
    box(ctx, x - 5 + drift, y - 7.75, 1, .75, "#bbbf87");
  } else if (type === "cannon") {
    box(ctx, x - 2, y - 4.5, 4 * Math.max(0.12, load), 1, load >= 0.96 ? "#f6d49d" : "#c37a51");
  } else if (type === "frost") {
    const lift = Math.round(Math.sin(beat * 3.5) * 2) / 2;
    const pulse = age < 0.25 ? 1 - age / 0.25 : 0;
    stamp(ctx, towerCore(type, 0, accent), x, y - lift - pulse);
    for (let i = 0; i < 3; i++) {
      const orbit = beat * 1.7 + i * 2.1;
      diamond(ctx, x + Math.cos(orbit) * (5.5 + pulse * 5), y - 18 + Math.sin(orbit) * 4,
        pulse > 0.4 ? 1.5 : 1, i === 1 ? "#c4fae9" : accent);
    }
  } else if (type === "ember") {
    const burst = age < 0.24 ? 1 - age / 0.24 : 0;
    stamp(ctx, towerCore(type, Math.floor(beat * 9) % 3, accent), x, y - Math.round(2 * burst));
    const warm = Math.sin(beat * 9) > 0 ? "#efaa62" : "#bb6643";
    box(ctx, x - 2.5, y - 5.5, 5, 2, warm);
    box(ctx, x - 2, y - 5, 1.5, 1, "#ffd08c");
    for (let i = 0; i < 3; i++) {
      const t = (beat * 1.5 + i * 0.31) % 1;
      box(ctx, x + Math.sin(beat * 2 + i) * t * 6, y - 18 - t * (6 + burst * 4),
        1, 1, t < 0.55 ? "#f8c276" : "#d58a66");
    }
  } else if (type === "hail-mortar") {
    const bob = rich ? Math.sin(beat * 3) * .5 : 0;
    const ready = load >= 0.88;
    diamond(ctx, x, y - 15.5 + bob, ready ? 2.8 : 1.8, ready ? "#d8f7ff" : "#8ac8e0");
    if (ready) box(ctx, x - 1, y - 16.5 + bob, 1.5, 1.5, "#ffffff");
  } else if (type === "glaze-lance") {
    const lift = rich ? Math.sin(beat * 3.6) * .5 + charge * 1.5 : 0;
    linePixels(ctx, x, y - 16 - lift, x, y - 26 - lift, accent, 0.7, 1.6);
    diamond(ctx, x, y - 26 - lift, 1.6, "#ffffff");
  } else if (type === "spore-caster") {
    const pulse = rich ? Math.sin(beat * 3.2) : 0;
    box(ctx, x - 1.2, y - 42.5 + pulse * .25, 2.4, 1.2, pulse > .2 ? "#e6f2ac" : "#b8d47d");
    box(ctx, x + 1.2, y - 39.5 - pulse * .3, 1.2, 1.2, "#d9e99b");
    if (rich) drawSporeAttack(ctx, { x, y, beat, age, load, accent, charge, focus, rich, heading });
    return;
  } else if (type === "storm") {
    stamp(ctx, towerCore(type, 0, accent), x, y + Math.round(Math.sin(beat * 4)) / 2);
    const arc = !reducedMotion && (age < 0.20 || Math.sin(beat * 3.1) > 0.94);
    if (arc) {
      const tilt = Math.sin(beat * 12) > 0 ? 1 : -1;
      linePixels(ctx, x - 5.5, y - 24, x + tilt, y - 21.5, "#cbb7ff");
      linePixels(ctx, x + tilt, y - 21.5, x + 5.5, y - 24, "#a9dbed");
      diamond(ctx, x + tilt, y - 21.5, 1.5, "#f2e7ff");
    }
  } else {
    const turn = (1 - load) * Math.PI * 2;
    box(ctx, x - 1.7, y - 8.6, 3.5, 3, "#86958a");
    box(ctx, x + Math.cos(turn) - 0.6, y - 7 + Math.sin(turn), 1.5, 1, "#e1c08a");
  }

  const [dx, dy] = headingVector(heading);
  const [mx, my] = muzzleOffset(type, heading, path);
  const muzzleX = x + mx, muzzleY = y + my;
  if (!reducedMotion && preparing) {
    ctx.save();
    ctx.globalAlpha = .18 + charge * .82;
    diamond(ctx, muzzleX, muzzleY, charge > .85 ? 2 : 1, charge > .85 ? "#fff6db" : accent);
    ctx.restore();
  }
  if (!spec.tracks) {
    if (preparing && !reducedMotion) {
      const spread = 7 - charge * 5;
      for (let i = 0; i < 3; i++) {
        const angle = i * Math.PI * 2 / 3;
        diamond(ctx, muzzleX + Math.cos(angle) * spread, muzzleY + Math.sin(angle) * spread, 1, accent);
      }
    } else if (!reducedMotion && age < 0.1) {
      diamond(ctx, muzzleX, muzzleY, age < 0.04 ? 3 : 2, accent);
      diamond(ctx, muzzleX, muzzleY, 1, "#fff4db");
    }
    return;
  }
  const strength = type === "cannon"
    ? path === "blast" ? 3.6 : path === "quake" ? 1.7 : 2.8
    : path === "piercer" ? 1.8 : 1.25;
  const recoil = reducedMotion ? 0
    : rich ? (age > 0.6 ? 0 : strength * 1.15 * Math.exp(-age * 9) * Math.max(-0.3, Math.cos(age * 17)))
    : Math.max(0, 1 - age / 0.19) * strength;
  drawTurret(ctx, type, x, y, heading, recoil, preparing ? 0.75 + 0.25 * charge : load, path);
  if (preparing || reducedMotion || rich || age >= 0.25) return;
  if (age < 0.085) {
    diamond(ctx, x + mx, y + my, path === "blast" ? 4.5 : type === "cannon" ? 3.5 : 1.5, accent);
    box(ctx, x + mx, y + my, 1, 1, "#fff4cd");
  }
  if (type === "cannon" && !reducedMotion) {
    const progress = age / 0.25;
    for (let i = 0; i < 3; i++)
      box(ctx, x + mx + dx * progress * 9 + i - 1, y + my + dy * progress * 6 - i * 2,
        2 + progress, 1.5 + progress, progress < 0.45 ? "#d3b18b86" : "#a3988869");
  }
}

export function towerIcon(canvas: HTMLCanvasElement, type: TowerId, path: string | null = null, style?: Level["towerStyle"]) {
  const ctx = canvas2d(canvas);
  const scale = type === "salt-caster" ? Math.min(canvas.width / 29, (canvas.height - 8) / 23)
    : Math.min(canvas.width / 28, (canvas.height - 8) / 27);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height - 7);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;
  drawTower(ctx, 0, 0, type, path ? 4 : 1, path, { reducedMotion: true, style });
  ctx.restore();
}
