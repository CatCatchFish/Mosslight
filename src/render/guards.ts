import { drawPaddleOtter, drawReedPost, drawReedPostIcon } from "./mire-units.ts";
import { guardUnitStats } from "../engine/guards.ts";
import type { GuardPostId, Level } from "../engine/types.ts";
import type { Guard, GuardBranch, GuardPost } from "../engine/guards.ts";
import { CELL } from "../engine/route.ts";
import { box, canvas2d } from "./canvas.ts";
import { linePixels } from "./animation.ts";
import { paintSprite, stamp } from "./pixel-sprite.ts";
import { drawGriffin, drawGriffinIcon, drawGriffinRoost, griffinRoostSprite } from "./griffin.ts";
import { drawRegionalInterceptorIcon, drawRegionalInterceptorPost, drawRegionalInterceptorUnit } from "./regional-interceptors.ts";
import { highQuality } from "./quality.ts";
import { pixelEllipse, shadeSprite } from "./tower-life.ts";
import { drawBlockBurst, drawGuardHeal, drawThrustArc, guardBuildAlpha, tintedSilhouette } from "./unit-life.ts";
import { paintSnowFooting } from "./frost-watch-art.ts";
import { drawInterceptorUpgrade, interceptorLift } from "./interceptor-upgrade.ts";

const PALETTES = {
  scout: { roof: "#699456", trim: "#c0d48d", coat: "#598975", dark: "#304d48", gear: "#e3b16e", scarf: "#e4a465" },
  keeper: { roof: "#507c86", trim: "#b8d0c3", coat: "#538696", dark: "#34485f", gear: "#e6bb78", scarf: "#edba72" },
  shield: { roof: "#457f73", trim: "#a0cfa6", coat: "#507b70", dark: "#244749", gear: "#e2bd7f", scarf: "#a8c882" },
  spear: { roof: "#a66a48", trim: "#ecb97e", coat: "#95624f", dark: "#50394a", gear: "#d2e0ae", scarf: "#efaa78" },
} as const;

type Uniform = keyof typeof PALETTES;
const uniforms = (post: GuardPost): Uniform => post.branch === "shield" || post.branch === "spear"
  ? post.branch : post.tier === 2 ? "keeper" : "scout";
const postArt = new Map<string, HTMLCanvasElement>();
const guardArt = new Map<string, HTMLCanvasElement>();

function guardHouse(uniform: Uniform, style?: Level["towerStyle"]) {
  const shaded = highQuality();
  const key = [uniform, shaded, style].join("/");
  const cached = postArt.get(key);
  if (cached) return cached;
  const { roof, trim, dark, gear } = PALETTES[uniform];
  const painted = paintSprite((r, p) => {
    // Low stone steps and a deep, arched timber entrance.
    p("#263535", [-23, 2], [-20, -5], [-17, -27], [14, -29], [20, -21], [21, -5], [25, 1],
      [20, 6], [-18, 6]);
    p("#7c7964", [-21, 0], [-17, -5], [17, -5], [21, 0], [18, 4], [-18, 4]);
    p("#a68760", [-17, -5], [-16, -25], [13, -26], [18, -20], [17, -5], [12, -2], [-12, -2]);
    p("#775943", [11, -24], [18, -20], [17, -5], [11, -3]);
    r(-15, -21, 2, 15, "#d0a475");
    r(-18, -6, 36, 2, uniform === "scout" ? "#bc9362" : "#82958a");
    for (const [x, y] of [[-14, -16], [-12, -11], [7, -12], [13, -17], [13, -8]])
      r(x, y, 3, .5, "#65483995");
    p("#543f38", [-8, 0], [-8, -10], [-6, -14], [-3, -16], [2, -16], [6, -13], [8, -8], [8, 1]);
    p("#253b3a", [-5.5, -1], [-5.5, -9], [-3, -13], [2, -13], [5, -9], [5, -1]);
    r(-7, 0, 14, 2, "#c49f70");
    r(-9, 2, 18, 1.5, "#8f7456");
    r(9, -16, 6, 6, "#4b4036");
    r(10, -15, 4, 4, "#ffcf85");
    r(11.5, -15, .5, 4, "#ab6b4c");

    // Scalloped roof tiles follow the curved ridge.
    p(dark, [-24, -23], [-20, -27], [-14, -30], [-9, -38], [0, -43], [9, -40], [16, -32],
      [20, -30], [24, -24], [17, -21], [-17, -22]);
    p(roof, [-21, -24], [-16, -28], [-12, -31], [-7, -38], [0, -41], [8, -38], [14, -31],
      [20, -27], [21, -24], [15, -23], [-17, -24]);
    p(trim, [-19, -26], [-13, -30], [-6, -38], [0, -41], [4, -39], [-4, -36], [-11, -28], [-16, -25]);
    for (const [y, left, right] of [[-36, -5, 8], [-32, -9, 11], [-28, -14, 16], [-25, -17, 18]]) {
      for (let x = left; x < right; x += 4.5) r(x, y + (x % 3) * .25, 2.5, .75, trim + "a6");
    }
    if (uniform !== "scout") {
      r(-17, -24, 34, 1, gear);
      for (const [x, y] of [[-15, -3], [-10, -1], [12, -4], [14, 0]])
        r(x, y, 3.5, .75, "#b5b8a2");
      r(-16, -19, 3, 5, dark);
      r(-15.5, -18.5, 2, 3, "#ffd69c");
    }

    if (style === "frost-watch") {
      paintSnowFooting(r, p, 23, 5.5);
      p("#d2e6ec", [-17, -29], [-13, -31], [-8, -39], [0, -43], [5, -42], [7, -39],
        [0, -39], [-6, -36], [-10, -30], [-14, -27]);
      p("#a7c4d4", [10, -38], [16, -32], [20, -30], [19, -28], [15, -29]);
    }
    if (uniform === "shield") {
      // A large enamel crest and a second stone buttress mark the defensive branch.
      p("#354c4a", [-22, 2], [-21, -14], [-16, -16], [-12, -12], [-13, 3]);
      p("#6c9290", [-20, 0], [-20, -12], [-16, -13], [-14, -11], [-15, 0]);
      p(gear, [-7, -34], [7, -34], [7, -27], [4, -24], [0, -22], [-4, -24], [-7, -28]);
      p(roof, [-5, -32.5], [5, -32.5], [5, -28], [0, -24], [-5, -28]);
      r(-2, -31, 4, 1.5, "#f1e0a6");
      r(-.75, -32, 1.5, 5, "#f1e0a6");
    } else if (uniform === "spear") {
      p("#593c38", [12, -26], [13, -43], [19, -44], [22, -39], [20, -24]);
      p("#ad7854", [14, -28], [15, -42], [19, -42], [20, -39], [18, -27]);
      p(gear, [13, -43], [17, -50], [23, -43], [19, -44], [16, -44]);
      r(15.5, -39.5, 2.5, 4, "#ffd998");
      p(gear, [-8, -32], [-6.5, -33], [5.5, -24], [4, -23]);
      p("#edca94", [-6, -24], [5.5, -33], [7, -32], [-4.5, -23]);
    } else {
      // Carved rabbit medallion under the eaves.
      p("#544d3b", [-5, -25], [-5, -29], [-2, -32], [3, -32], [6, -29], [6, -25], [2, -23], [-2, -23]);
      p("#eed3a3", [-3, -25.5], [-3, -28.5], [-1.5, -29.5], [-2, -33], [-.5, -33.5],
        [.5, -30], [1.5, -30], [2, -33], [3.5, -32.5], [3, -28.5], [4, -26], [2, -24.5], [-1, -24.5]);
      r(1.5, -28, .75, 1, "#624e3b");
    }
  }, 2);
  const image = shaded ? shadeSprite(painted) : painted;
  postArt.set(key, image);
  return image;
}

function rabbit(uniform: Uniform, stride: number, wind: boolean, ears = 0, blinking = false, sniff = false) {
  const key = uniform + "/" + stride + "/" + Number(wind) + "/" + ears + "/" + Number(blinking) + "/" + Number(sniff);
  const cached = guardArt.get(key);
  if (cached) return cached;
  const { coat, dark, gear, scarf, trim } = PALETTES[uniform];
  const image = paintSprite((r, p) => {
    const outline = "#463842";
    const shade = "#d3aebe";
    const fur = "#f1dfd9";
    const cream = "#fff5eb";
    const pink = "#d786a0";
    const flick = wind ? -2 : stride + ears;
    // Asymmetric perk for curious listening (ears = ±2) while keeping big flicks (±3) snappy
    const earL = Math.abs(ears) === 2 ? -ears * 0.9 : flick;
    const earR = Math.abs(ears) === 2 ? ears * 1.15 : flick;
    const tailLift = Math.abs(ears) >= 2 ? -1.2 : 0;

    // Both ears are visible from the three-quarter angle. The gap should read at game size.
    p(outline, [-10, -31], [-14 + earL, -42], [-14 + earL, -48], [-11 + earL, -51],
      [-8 + earL, -50], [-5 + earL, -46], [-4, -32]);
    p(shade, [-8.5, -32], [-12 + earL, -43], [-12 + earL, -48], [-10.5 + earL, -49],
      [-8.5 + earL, -48], [-7 + earL, -44], [-6, -32]);
    p(pink, [-8.25, -34], [-10.75 + earL, -44], [-10.5 + earL, -47.5],
      [-9 + earL, -47], [-8 + earL, -43], [-7, -35]);
    p(outline, [-2, -32], [-.5 + earR, -47], [1.5 + earR, -51.5], [5.5 + earR, -52],
      [8 + earR, -49], [8.5 + earR, -45], [5.5, -31]);
    p(fur, [0, -32], [1 + earR, -46], [3 + earR, -49.75], [5.25 + earR, -50],
      [7 + earR, -47.5], [7 + earR, -44.5], [4, -31.5]);
    p(pink, [1.5, -33], [2.5 + earR, -45], [4 + earR, -48.25],
      [5 + earR, -48.25], [5.5 + earR, -45], [3, -34]);
    r(3 + earR, -49, 2, .75, cream);

    p(outline, [-10, -4 + tailLift], [-15, -4 + tailLift], [-18.5, -7.5 + tailLift], [-18.5, -11 + tailLift],
      [-16, -14 + tailLift], [-12.5, -14.5 + tailLift], [-9, -12.5 + tailLift], [-8, -8 + tailLift]);
    p(fur, [-10, -6 + tailLift], [-14.5, -6 + tailLift], [-17, -8 + tailLift], [-17, -10.5 + tailLift],
      [-15.5, -12.5 + tailLift], [-13, -13 + tailLift], [-10, -11.5 + tailLift], [-9.5, -8 + tailLift]);
    r(-15.5, -11.5 + tailLift, 3, 1.5, cream);

    p(outline, [-10.5, -2 + stride], [-7, -5], [-2, -3], [0, 1 + stride],
      [-4, 2.5 + stride], [-10.5, 1.5 + stride]);
    p(outline, [1, -3], [6, -5], [10.5, -1 - stride], [10.5, 1.5 - stride], [2, 2.5 - stride]);
    r(-9, -.5 + stride, 5, 1.5, shade);
    r(5.5, -1 - stride, 3.75, 1.5, fur);

    p(dark, [-11, -6], [-10, -12], [-5, -19], [4, -19], [9, -13], [10, -7], [7, -3], [-7, -3]);
    p(coat, [-9.5, -7], [-8, -12], [-4, -17], [3, -17], [7, -12], [8, -7], [5, -4.5], [-6, -4.5]);
    p(trim, [-8, -12], [-3.5, -16], [0, -15.5], [-3, -12], [-5, -11], [-6, -8]);
    // Layered tunic fold & shoulder pauldrons by rank/branch
    if (uniform === "shield") {
      p("#254549", [-12, -16], [-7, -18], [-4, -13], [-9, -11]);
      p("#7ea89f", [-11, -15.5], [-7.5, -17], [-5.5, -13.5], [-9, -12.5]);
      r(-9.5, -15.5, 2, 1, "#e7f3dc");
      p("#254549", [5, -17], [10, -16], [10, -11], [6, -12]);
      p("#7ea89f", [6, -16], [9, -15], [9, -12], [6.5, -12.5]);
    } else if (uniform === "spear") {
      p("#5c3638", [-12, -15], [-5, -18], [-2, -14], [-10, -11]);
      p("#c97e52", [-11, -14.5], [-6, -17], [-3.5, -14], [-9.5, -12]);
      r(-8.5, -15, 2.5, 1, "#ffdfb0");
    } else if (uniform === "keeper") {
      r(-9.5, -15, 3, 2, gear);
      r(-9, -15, 1.5, .75, cream);
    }
    r(-7, -7, 14, 1.5, "#503f40");
    r(2, -7.5, 2.5, 2.5, gear);
    r(3, -7, .75, 1, "#593f41");
    p(scarf, [-10, -15], [-4, -17], [7, -17], [7, -13], [1, -12], [-5, -13], [-10, -11],
      [-13 + flick * .5, -12], [-11, -14]);
    r(-3, -13.5, 5, .75, "#ffe0ab");
    r(4, -12.25, 2, 1.5, gear);

    // A continuous round cheek line frames a small nose and two soft cheeks.
    p(outline, [-12.5, -24], [-11, -29], [-7.5, -33], [-3.5, -34.5], [4, -34.5],
      [8.5, -32.5], [12, -28.5], [12.5, -23], [11, -19], [7.5, -16],
      [1, -14.5], [-6, -15.5], [-10, -18]);
    p(shade, [-11, -24], [-9.75, -28.5], [-6.5, -31.75], [-3, -33], [3.75, -33],
      [8, -31], [10.5, -27.75], [11, -23], [9.5, -19], [6.5, -17], [.5, -16], [-5.5, -17], [-9, -19]);
    p(fur, [-9.5, -24.5], [-8.75, -28], [-5.75, -31.25], [-2.5, -32.25], [3.5, -32.25],
      [7.5, -30.75], [10, -27.75], [10.5, -23.75], [9.5, -21], [7.75, -19],
      [2, -17.5], [-4.5, -18], [-8.5, -20.5]);
    p(cream, [-5.5, -23], [-2, -24], [2, -23], [5.5, -24], [9.5, -23], [9.5, -20.5],
      [7, -18.5], [2.5, -17.25], [-2.5, -17.5], [-5, -19.25]);
    r(-7.5, -22, 3, 1.25, "#e6a0ad");
    r(8.5, -22, 1.5, 1, "#e6a0ad");
    for (const [eye, width] of [[-4, 2.75], [6.5, 2]]) {
      r(eye, blinking ? -24.75 : -27, width, blinking ? 0.75 : 3.75, "#34313c");
      if (!blinking) r(eye + .5, -26.75, .75, 1, "#fffaf0");
    }
    const noseY = sniff ? -0.8 : 0;
    p("#a15977", [1.5, -22.5 + noseY], [4.5, -22.5 + noseY], [3, -20.5 + noseY]);
    r(2, -22.75 + noseY, 1.25, .5, sniff ? "#ffd0dc" : "#eaa1b3");
    r(2.75, -21 + noseY * .5, .5, 1.5, "#9c6475");
    r(1.25, -19.75, 3.5, .5, "#9c6475");
    r(2, -19.25, 1.75, 1, "#fffdf2");
    r(2.75, -19.25, .25, 1, "#caa7ae");

    if (uniform !== "scout") {
      p(dark, [-10, -30.5], [-6, -33.5], [3, -34], [8, -32.25], [9.5, -29.5],
        [4, -31.25], [-2.5, -31.5], [-8.5, -29]);
      p(coat, [-8, -30.75], [-5, -32.5], [3, -33.25], [7, -32], [7.5, -31],
        [3, -32], [-4, -31.25]);
      r(.5, -33, 2, 1.75, gear);
      r(.75, -32.75, .75, .75, cream);
      if (uniform === "spear") {
        // Small crest feather tucked into the spear-squad brow band
        p(dark, [-9.5, -30.5], [-14 + flick * .6, -34], [-12 + flick * .6, -36], [-8, -32]);
        p("#f2c879", [-9, -31], [-12.5 + flick * .6, -34], [-11 + flick * .6, -35], [-8.5, -32]);
      } else if (uniform === "shield") {
        // Steel brow rim highlight
        r(-6, -32.25, 9, .75, "#cfe3d4");
      }
    }
    p(outline, [4, -12], [7, -13], [11 + (wind ? 2 : 0), -10], [11, -7], [6, -7]);
    p(fur, [6, -11.5], [9, -11], [10.5 + (wind ? 1 : 0), -9], [9, -8], [6, -8]);
  }, 2);
  guardArt.set(key, image);
  return image;
}

const buckler = paintSprite((r, p) => {
  p("#1f3337", [-7.5, -12.5], [-4.5, -14.5], [4.5, -14.5], [7.5, -12.5], [7.5, -4.5], [4.25, -.5], [0, 1.5], [-4.25, -.5], [-7.5, -4.5]);
  p("#e5c289", [-6.25, -11.75], [-3.75, -13.25], [3.75, -13.25], [6.25, -11.75], [6.25, -4.75], [3.25, -1.25], [0, .25],
    [-3.25, -1.25], [-6.25, -4.75]);
  p("#3f7467", [-4.75, -10.75], [-3, -11.75], [3, -11.75], [4.75, -10.75], [4.75, -4.75], [0, -1.75], [-4.75, -4.75]);
  // Diagonal sheen across shield face
  p("#5f9c88", [-4.25, -10.25], [-1.25, -11.25], [1.5, -11.25], [-4.25, -6.5]);
  // Gold crest & boss
  r(-.75, -10.5, 1.5, 6.75, "#efe8b4");
  r(-3.25, -8.25, 6.5, 1.5, "#efe8b4");
  r(-.75, -8.25, 1.5, 1.5, "#fffef0");
  // Corner rivets
  for (const [rx, ry] of [[-5, -11], [4.5, -11], [-5, -5.5], [4.5, -5.5]]) r(rx, ry, .75, .75, "#fff2c6");
}, 2);

/** Draw an authored pixel weapon (short sword for shield branch, feathered silver pike for spear, iron-tipped spear for scout/keeper). */
function drawGuardWeapon(
  ctx: CanvasRenderingContext2D,
  uniform: Uniform,
  handX: number, handY: number,
  tipX: number, tipY: number,
  side: number,
  time: number,
) {
  const vx = tipX - handX, vy = tipY - handY;
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len, uy = vy / len;
  const px = -uy, py = ux;

  if (uniform === "shield") {
    // Broad steel short-sword with golden crossguard and pommel
    const pomX = handX - ux * 1.6, pomY = handY - uy * 1.6;
    const guardX = handX + ux * 1.2, guardY = handY + uy * 1.2;
    const bladeEndX = handX + ux * (len * .95), bladeEndY = handY + uy * (len * .95);
    linePixels(ctx, pomX, pomY, guardX, guardY, "#513934", .5, 1.2);
    box(ctx, pomX - .6, pomY - .6, 1.2, 1.2, "#e8c27b");
    // Blade outline + steel body + bright fuller edge
    linePixels(ctx, guardX, guardY, bladeEndX, bladeEndY, "#28363b", .45, 2.2);
    linePixels(ctx, guardX + ux * .6, guardY + uy * .6, bladeEndX, bladeEndY, "#b8cbd1", .45, 1.4);
    linePixels(ctx, guardX + ux * .9 + px * .35, guardY + uy * .9 + py * .35,
      bladeEndX + px * .2, bladeEndY + py * .2, "#f0f9fc", .45, .65);
    // Golden crossguard
    linePixels(ctx, guardX - px * 2.2, guardY - py * 2.2, guardX + px * 2.2, guardY + py * 2.2, "#4a382c", .5, 1.35);
    linePixels(ctx, guardX - px * 1.8, guardY - py * 1.8, guardX + px * 1.8, guardY + py * 1.8, "#ebd08e", .5, .8);
    return;
  }

  // Polearm / spear shaft (extends slightly behind hand for balanced grip)
  const buttX = handX - ux * (uniform === "spear" ? 3.2 : 2.2);
  const buttY = handY - uy * (uniform === "spear" ? 3.2 : 2.2);
  const neckX = tipX - ux * (uniform === "spear" ? 3.4 : 2.4);
  const neckY = tipY - uy * (uniform === "spear" ? 3.4 : 2.4);
  linePixels(ctx, buttX, buttY, neckX, neckY, "#3f2e2b", .5, 1.4);
  linePixels(ctx, buttX, buttY - .2, neckX, neckY - .2, uniform === "spear" ? "#9e6b46" : "#b8895c", .45, .75);
  // Butt cap
  box(ctx, buttX - .5, buttY - .5, 1, 1, "#d9ba7b");

  if (uniform === "spear") {
    // Silver leaf-bladed pike + golden collar + fluttering feather tassel
    box(ctx, neckX - .8, neckY - .8, 1.6, 1.6, "#e8c47a");
    const wave = Math.sin(time * 9 + handX) * .7;
    linePixels(ctx, neckX, neckY, neckX - side * 2.2 + wave * .4, neckY + 2.4, "#e69458", .5, 1.0);
    linePixels(ctx, neckX - side * .6, neckY + .8, neckX - side * 2.6 + wave * .6, neckY + 3.0, "#ffe4a3", .5, .65);
    // Broad steel leaf head
    const midX = neckX + ux * 1.7, midY = neckY + uy * 1.7;
    linePixels(ctx, neckX, neckY, tipX + ux * 1.5, tipY + uy * 1.5, "#2b3838", .45, 2.2);
    linePixels(ctx, midX - px * 1.0, midY - py * 1.0, tipX + ux * 1.4, tipY + uy * 1.4, "#c8dbcf", .45, 1.1);
    linePixels(ctx, midX + px * 1.0, midY + py * 1.0, tipX + ux * 1.4, tipY + uy * 1.4, "#e9f5e6", .45, 1.0);
    box(ctx, tipX + ux * .6 - .4, tipY + uy * .6 - .4, 1.1, 1.1, "#fffef0");
  } else {
    // Scout / Keeper iron-tipped spear with binding wrap
    box(ctx, neckX - .6, neckY - .6, 1.3, 1.3, uniform === "keeper" ? "#e4be7a" : "#c76c52");
    linePixels(ctx, neckX, neckY, tipX + ux * .9, tipY + uy * .9, "#2d3538", .45, 1.9);
    linePixels(ctx, neckX + ux * .5, neckY + uy * .5, tipX + ux * .8, tipY + uy * .8,
      uniform === "keeper" ? "#d5e4e8" : "#c5ced1", .45, 1.1);
    box(ctx, tipX - .35, tipY - .35, .9, .9, "#fff9df");
  }
}

export function drawGuardPost(ctx: CanvasRenderingContext2D, post: GuardPost, time: number, style?: Level["towerStyle"], reducedMotion = false) {
  if (post.type === "reed-post") {
    drawReedPost(ctx, post, time, reducedMotion);
    return;
  }
  if (post.type === "frost-kennel") {
    drawRegionalInterceptorPost(ctx, post, time, style, reducedMotion);
    return;
  }
  const roost = post.type === "griffin-roost";
  const x = post.origin[0] * CELL + 8, y = Math.max(23, post.origin[1] * CELL + 10);
  const uniform = uniforms(post);
  const rich = highQuality();
  const squeeze = 1 / (1 + Math.max(0, interceptorLift(post, time, reducedMotion)) * 0.08);
  const formUniform = (form: Pick<GuardPost, "tier" | "branch">): Uniform =>
    form.branch === "shield" || form.branch === "spear" ? form.branch : form.tier === 2 ? "keeper" : "scout";
  if (roost) {
    if (rich) {
      ctx.save();
      ctx.globalAlpha = .26 * squeeze;
      pixelEllipse(ctx, x, y + 1, 11.5 * squeeze, 2.5 * squeeze, "#101e29");
      ctx.restore();
    } else box(ctx, x - 10 * squeeze, y - 1, 20 * squeeze, 3 * squeeze, "#16293478");
    drawInterceptorUpgrade(
      ctx, post, x, y, time, reducedMotion,
      ({ tier, branch }) => drawGriffinRoost(ctx, x, y, tier, branch, style),
      ({ tier, branch }) => griffinRoostSprite(tier, branch, style),
    );
    if (rich && !reducedMotion) {
      // Soft silver-ice glint around the roost.
      const pulse = .5 + .5 * Math.sin(time * 2.4 + x * .05);
      ctx.save();
      ctx.globalAlpha = .25 + pulse * .35;
      box(ctx, x - 3 + Math.sin(time * 1.7) * 2, y - 14 - (time * 3 % 5), 1, 1, "#d8f0ff");
      ctx.restore();
    }
  } else {
    if (rich) {
      ctx.save();
      ctx.globalAlpha = .28 * squeeze;
      pixelEllipse(ctx, x + .5, y + 2.5, 13 * squeeze, 2.8 * squeeze, "#101f19");
      ctx.restore();
    } else box(ctx, x - 12 * squeeze, y + 1, 24 * squeeze, 3 * squeeze, "#142c2578");
    const glow = Math.max(0, Math.sin(time * 3 + x * 0.05));
    drawInterceptorUpgrade(
      ctx, post, x, y, time, reducedMotion,
      (form) => {
        stamp(ctx, guardHouse(formUniform(form), style), x, y);
        box(ctx, x + 5, y - 7.5, 1, 1.5, glow > 0.5 ? "#ffebb2" : "#ffe0ab");
      },
      (form) => guardHouse(formUniform(form), style),
    );
    if (rich && squeeze > 0.9) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = .08 + glow * .07;
      pixelEllipse(ctx, x + 5.5, y - 6.5, 4.5, 3.5, "#ffd78a");
      ctx.restore();
    }
  }
  const rx = post.rally[0] * CELL + 8, ry = post.rally[1] * CELL + 10;
  box(ctx, rx - 3, ry + 1, 6, 1, "#305452b5");
  const trim = roost ? "#b9d8f4" : PALETTES[uniform].trim;
  box(ctx, rx - 2, ry, 1.5, 1, trim);
  box(ctx, rx + .5, ry - 1, 1.5, 1, trim);
}

export function guardPostIcon(canvas: HTMLCanvasElement, tier: 1 | 2 | GuardBranch,
  type: GuardPostId = "guard-post", style?: Level["towerStyle"], mastery = false) {
  if (type === "griffin-roost") {
    drawGriffinIcon(canvas, tier, style, mastery);
    return;
  }
  if (type === "reed-post") {
    drawReedPostIcon(canvas, tier, mastery);
    return;
  }
  if (type === "frost-kennel") {
    drawRegionalInterceptorIcon(canvas, tier, style, mastery);
    return;
  }
  const ctx = canvas2d(canvas);
  ctx.imageSmoothingEnabled = false;
  const art = guardHouse(tier === "shield" || tier === "spear" ? tier : tier === 2 ? "keeper" : "scout", style);
  stamp(ctx, art, canvas.width / 2, canvas.height - 8, 1.75);
}

const GUARD_SCALE = 0.86;

export function drawGuard(ctx: CanvasRenderingContext2D, guard: Guard, time: number, post: GuardPost, reducedMotion: boolean,
  biome: Level["biome"], showEffects: boolean) {
  if (post.type === "reed-post") {
    drawPaddleOtter(ctx, guard, post, time, reducedMotion);
    return;
  }
  if (post.type === "griffin-roost") {
    drawGriffin(ctx, guard, post, time, reducedMotion, showEffects);
    return;
  }
  if (post.type === "frost-kennel") {
    drawRegionalInterceptorUnit(ctx, guard, post, time, reducedMotion, showEffects);
    return;
  }
  const sinceHit = time - guard.hurtAt;
  const fallen = guard.hp <= 0;
  if (fallen && sinceHit >= 0.32) return;
  const buildFade = guardBuildAlpha(post.builtAt, time, reducedMotion);
  if (buildFade <= 0) return;
  const attack = fallen ? undefined : guard.attack;
  const aiming = attack !== undefined && time < attack.impact;
  const windup = aiming ? Math.min(1, (time - attack.start) / (attack.impact - attack.start)) : 0;
  const recovery = attack && !aiming ? Math.min(1, (time - attack.impact) / (attack.end - attack.impact)) : 0;
  const [dx, dy] = attack?.direction ?? [guard.facing, 0];
  const thrust = attack?.kind === "thrust";
  const throwing = attack?.kind === "throw";
  const brace = !attack && !fallen && post.branch === "shield" && Boolean(guard.target?.melee && time < guard.target.melee.impact);
  const followThrough = attack && !aiming ? (1 - recovery) ** 2 : 0;
  const sway = reducedMotion ? 0 : thrust ? -1.6 * windup + 3.8 * followThrough : -1.1 * windup + 1.8 * followThrough;
  const recoil = reducedMotion ? 0 : Math.max(0, 1 - sinceHit / 0.19) * 3.2;
  const x = guard.x * CELL + 8 + guard.recoil[0] * recoil;
  const ground = guard.y * CELL + 10 + guard.recoil[1] * recoil;
  const moving = time - guard.movedAt < 0.16;
  const idle = !reducedMotion && !moving && !fallen && !attack && !guard.target && sinceHit > 0.2;
  const slot = Math.max(0, post.guards.indexOf(guard));
  const breathClock = time * (2.65 + 0.17 * slot) + post.index * 1.13 + slot * 2.19;
  const breath = idle ? Math.sin(breathClock) : 0;
  const watch = idle ? (time * (1 + 0.047 * slot) + post.index * 0.43 + slot * 1.73) % 7.4 : 0;
  const listening = watch > 2.0 && watch < 2.75;
  const idleHopWindow = watch > 3.7 && watch < 4.16;
  const idleHopT = idleHopWindow ? (watch - 3.7) / 0.46 : 0;
  const idleHop = idleHopWindow ? Math.sin(idleHopT * Math.PI) * 2.15 : 0;
  const glancing = watch > 5.65 && watch < 6.45;
  const blinking = idle && ((watch > 1.12 && watch < 1.3) || (watch > 4.88 && watch < 5.04));
  const sniffing = listening && Math.floor(watch * 7) % 2 === 0;
  const idleBeat = idle ? (time + post.index * 3.71 + slot * 4.83) % (11.5 + (post.index + slot) % 5) : Infinity;
  const greeting = idleBeat < 0.85;
  const companion = greeting ? post.guards.find((other) => other !== guard && other.hp > 0 &&
    !other.target && Math.hypot(other.x - guard.x, other.y - guard.y) <= 2.4) : undefined;
  const flourish = idle && !companion && !idleHopWindow && idleBeat > 3.2 && idleBeat < 4.12;
  const flourishT = flourish ? (idleBeat - 3.2) / 0.92 : 0;
  const flourishArc = flourish ? Math.sin(flourishT * Math.PI) : 0;
  const warming = idle && biome === "frost" && idleBeat > 6.8 && idleBeat < 7.8;
  const wiping = idle && biome === "quarry" && idleBeat > 6.8 && idleBeat < 7.35;
  const earBreeze = idle && !listening && !idleHopWindow && !glancing && Math.sin(breathClock * 0.5) > 0.55 ? 1 : 0;
  const ears = idleHopWindow ? (idleHopT < 0.5 ? -3 : 2)
    : listening ? (watch < 2.38 ? 2 : -2)
    : flourish ? (flourishT < 0.5 ? 2 : -1)
    : glancing ? -1
    : earBreeze;
  const step = warming ? (Math.floor(idleBeat * 8) % 2 ? 3 : -3)
    : idleHopWindow ? (idleHopT < 0.5 ? 1 : -1)
    : !reducedMotion && moving && !attack && !brace && !fallen ? [0, 1, 0, -1][Math.floor(guard.walk * 8) % 4] : 0;
  const rich = highQuality() && !reducedMotion;
  const walkPhase = moving && !attack && !brace && !fallen ? guard.walk * Math.PI * 4 : 0;
  const greetHop = companion ? Math.abs(Math.sin(idleBeat * Math.PI * 3)) * 1.1 : 0;
  const hop = (rich && moving && !attack && !brace && !fallen ? Math.abs(Math.sin(walkPhase)) * 1.15 : Math.abs(step) * 0.25)
    + idleHop + greetHop;
  const y = ground - hop;
  const side = attack && Math.abs(dx) > 0.12 ? Math.sign(dx) : companion ? (companion.x < guard.x ? -1 : 1) : glancing ? -guard.facing : guard.facing;
  const uniform = uniforms(post);
  const spear = post.branch === "spear";

  const contactAge = time - (guard.contactAt ?? -Infinity);
  if (showEffects && !reducedMotion && contactAge < .14) {
    ctx.save();
    const spread = contactAge * 25;
    ctx.globalAlpha = .7 * (1 - contactAge / .14);
    for (let i = 0; i < 3; i++)
      box(ctx, x - side * (2 + spread) + i * 2 - 2, ground + 1 - i * .75, 1.25, 1, "#d5ac82");
    ctx.restore();
  }
  if (rich && showEffects && moving && !attack && !fallen) {
    const dust = (guard.walk * 4) % 1;
    if (dust < .45) {
      ctx.save();
      ctx.globalAlpha = (1 - dust / .45) * .45;
      box(ctx, x - side * (3 + dust * 5), ground + 1 - dust * 2, 1.25, 1, "#d8c39d");
      ctx.restore();
    }
  }
  if (rich && showEffects && idleHopWindow && idleHopT > 0.78) {
    const p = (idleHopT - 0.78) / 0.22;
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.42;
    box(ctx, x - 3.5 - p * 2.5, ground + 1, 1.2, 0.9, "#d8c39d");
    box(ctx, x + 2.5 + p * 2.5, ground + 1, 1.2, 0.9, "#d8c39d");
    ctx.restore();
  }
  if (rich) {
    ctx.save();
    ctx.globalAlpha = .28 / (1 + hop * .15);
    pixelEllipse(ctx, x, ground + 1.5, 5.2 / (1 + idleHop * 0.08), 1.5, "#15261e");
    ctx.restore();
  } else {
    box(ctx, x - 4.75, ground + 1, 9.5, 1.5, "#233c3380");
  }
  ctx.save();
  ctx.globalAlpha *= buildFade;
  ctx.translate(x + dx * sway, y + dy * sway);
  ctx.scale(GUARD_SCALE, GUARD_SCALE);
  if (rich && !fallen) {
    if (thrust) {
      const sx = 1 + (aiming ? .06 * windup : .13 * followThrough);
      const sy = 1 - (aiming ? .08 * windup : .1 * followThrough);
      ctx.scale(sx, sy);
    } else if (throwing) {
      ctx.rotate(side * (aiming ? -.15 * windup : .16 * followThrough));
      ctx.scale(1 - (aiming ? .04 * windup : -.08 * followThrough), 1 + (aiming ? .08 * windup : -.05 * followThrough));
    } else if (brace) {
      ctx.scale(1.07, .93);
    } else if (moving) {
      const stretch = Math.sin(walkPhase) * .05;
      ctx.rotate(side * Math.sin(walkPhase) * .045);
      ctx.scale(1 - Math.abs(stretch) * .5, 1 + Math.abs(stretch));
    } else if (idle) {
      if (idleHopWindow) {
        const liftStretch = Math.sin(idleHopT * Math.PI) * 0.07;
        ctx.scale(1 - liftStretch * 0.55, 1 + liftStretch);
      } else {
        ctx.rotate(side * (flourish ? -flourishArc * 0.045 : listening ? 0.03 : 0));
        ctx.scale(1 - breath * 0.018, 1 + breath * 0.036);
      }
    }
    if (sinceHit < .1) {
      const h = 1 - sinceHit / .1;
      ctx.scale(1 + h * .1, 1 - h * .12);
    }
  } else if (idle) {
    ctx.scale(1 - breath * 0.015, 1 + breath * 0.03);
  }
  const sprite = rabbit(uniform, step, Boolean(attack) || brace, ears, blinking, sniffing);
  if (fallen) {
    ctx.globalAlpha = 1 - sinceHit / 0.32;
    ctx.scale(1.15, Math.max(0.28, 1 - sinceHit * 3.4));
  } else if (!reducedMotion && !rich && sinceHit < 0.085) ctx.filter = "brightness(1.26)";
  stamp(ctx, sprite, 0, 0, 1, side);
  if (rich && !fallen && sinceHit < 0.1) {
    ctx.save();
    ctx.globalAlpha = (1 - sinceHit / 0.1) * .78;
    stamp(ctx, tintedSilhouette(sprite, "#fffef4"), 0, 0, 1, side);
    ctx.restore();
  }

  if (!throwing || aiming || recovery > 0.72) {
    const idleWeaponLift = idle ? breath * 0.45 + (flourish ? (spear ? 3.2 : uniform === "shield" ? 1.8 : 2.1) * flourishArc : 0) : 0;
    const idleWeaponSway = idle && flourish ? (uniform === "shield" ? -2.2 : spear ? 1.8 : 0.8) * flourishArc : 0;
    const handX = side * (4 - (throwing ? 3.5 * windup : 0) + idleWeaponSway * 0.45);
    const handY = -4.5 - (throwing ? 6 * windup : 0) - idleWeaponLift * 0.55;
    const extension = thrust ? 4.5 * followThrough - 2 * windup : 0;
    const tipX = throwing
      ? handX + side * (8 - windup * 2)
      : side * (spear ? 9 : 6.5) + dx * extension + side * idleWeaponSway;
    const tipY = throwing
      ? handY - 6 + (dy * 7 + 3.5) * windup
      : -(spear ? 12 : 9) + (4 + dy * 4) * followThrough - 2 * windup + (glancing ? 1 : 0) - idleWeaponLift;
    drawGuardWeapon(ctx, uniform, handX, handY, tipX, tipY, side, time);
    if (rich && thrust && followThrough > 0.18) {
      drawThrustArc(ctx, tipX, tipY, dx, dy, followThrough, spear);
    } else if (thrust && followThrough > 0.4) {
      linePixels(ctx, tipX - dx * 2, tipY - dy * 2, tipX + dx * 4, tipY + dy * 4, "#fff0b5", 0.6, 0.7);
    }
  } else {
    linePixels(ctx, side * 3, -6, side * (4 + 5 * followThrough), -7 + dy * 5 * followThrough, "#d9b991", 0.6, 2);
    if (rich && followThrough > .35) {
      ctx.save();
      ctx.globalAlpha = followThrough * .7;
      linePixels(ctx, side * 6, -7, side * (11 + 4 * followThrough), -8 + dy * 5, "#fff4d0", .6, .75);
      ctx.restore();
    }
  }
  if (companion || wiping) {
    const pawX = side * (companion ? 6 + Math.sin(idleBeat * 24) : 3.5);
    const pawY = companion ? -8 : -9;
    linePixels(ctx, side * 2, -4, pawX, pawY, "#d3aebe", .55, 1.65);
    box(ctx, pawX - .75, pawY - .75, 1.5, 1.5, "#fff0de");
  }
  if (rich && showEffects && warming) {
    const p = (idleBeat - 6.8) % 0.5 / 0.5;
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.48;
    box(ctx, side * (5 + p * 3), -10 - p * 2.5, 1.25, 1, "#e2f5ff");
    ctx.restore();
  }
  if (post.branch === "shield") {
    const block = showEffects && !reducedMotion && !fallen && sinceHit < .055;
    const shieldIdleLift = idle && flourish ? flourishArc * 2.4 : 0;
    const shieldX = side * (brace || block ? 7 : flourish ? -1.5 + flourishArc * 4.5 : -4);
    const shieldY = (brace || block ? -3 : 0) - shieldIdleLift;
    stamp(ctx, buckler, shieldX, shieldY, 1, side);
    if (rich && showEffects && flourish && flourishT > 0.38 && flourishT < 0.66) {
      ctx.save();
      ctx.globalAlpha = Math.sin(((flourishT - 0.38) / 0.28) * Math.PI) * 0.85;
      box(ctx, shieldX + side * 1.5, shieldY - 5, 2.2, 0.75, "#fff6c8");
      box(ctx, shieldX + side * 2.2, shieldY - 5.8, 0.75, 2.2, "#fffef0");
      ctx.restore();
    }
    if (rich && showEffects && !fallen && sinceHit < .18) {
      drawBlockBurst(ctx, shieldX, shieldY, side, sinceHit);
    } else if (block) {
      box(ctx, shieldX - 1.5, shieldY - 4, 3, .75, "#fff1bb");
      box(ctx, shieldX, shieldY - 5, .75, 3, "#fff9dd");
    }
  }
  ctx.restore();

  const health = guardUnitStats(post, guard).health;
  const healing = !fallen && guard.hp < health && guard.healedAt !== undefined && time - guard.healedAt < 0.25;
  if (healing && showEffects) drawGuardHeal(ctx, x, y - 4, time, reducedMotion);
  if (!fallen && guard.hp < health) {
    const barY = Math.max(0.5, y - 17);
    box(ctx, x - 3.5, barY, 7, 1.5, "#2b302c");
    box(ctx, x - 3.5, barY + 0.25, 7 * guard.hp / health, 1, healing ? "#8ef2b8" : "#a7d9c1");
  }
}
