import { guardUnitStats } from "../engine/guards.ts";
import type { Guard, GuardBranch, GuardPost } from "../engine/guards.ts";
import { CELL, clamp } from "../engine/route.ts";
import type { Level, Point } from "../engine/types.ts";
import { linePixels, pixelRing } from "./animation.ts";
import { box, canvas2d } from "./canvas.ts";
import { paintSprite, stamp } from "./pixel-sprite.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";
import { highQuality } from "./quality.ts";
import { shadeSprite } from "./tower-life.ts";
import { drawClawSlash, drawGuardHeal, drawWingGust, guardBuildAlpha, tintedSilhouette } from "./unit-life.ts";
import { paintSnowFooting } from "./frost-watch-art.ts";
import { interceptorForm } from "./interceptor-upgrade.ts";

const wingbeat = ["raised", "open", "lowered", "open"] as const;
type GriffinPose = (typeof wingbeat)[number] | "dive" | "tuck" | "perch" | "claw";
type GriffinLook = "adult" | "young" | "grown" | "merged";
type GriffinIdle = "none" | "blink" | "scan" | "cry" | "preen";
type RoostStyle = 1 | 2 | GuardBranch;

const ink = "#2e3243";
const bodyDark = "#51586a";
const bodyMid = "#777e90";
const bodyLight = "#a7aab8";
const silver = "#ebe9e6";
const sizes: Record<GriffinLook, number> = { adult: 1, young: .74, grown: 1.09, merged: 1.26 };

const roosts = new Map<string, HTMLCanvasElement>();
const griffins = new Map<string, HTMLCanvasElement>();

function roostSprite(style: RoostStyle, towerStyle?: Level["towerStyle"], mastery = false) {
  const shaded = highQuality();
  const key = [style, shaded, towerStyle, mastery].join("/");
  const cached = roosts.get(key);
  if (cached) return cached;
  const crest = style === "talon" ? "#6b5d76" : style === "wingpair" ? "#416878" : "#4a5a76";
  const painted = paintSprite((r, p) => {
    // The taper, metal eaves and two open levels distinguish the roost at map scale.
    p("#343b47", [-22, 2], [-20, -5], [-16, -15], [-15, -28], [-19, -33],
      [-16, -39], [15, -39], [20, -31], [15, -26], [17, -12], [21, -4], [23, 2], [17, 6], [-16, 6]);
    p("#617582", [-19, 1], [-16, -5], [17, -5], [20, 1], [15, 4], [-16, 4]);
    p("#6f8093", [-15, -4], [-13, -13], [-12, -28], [11, -28], [14, -14], [16, -6], [11, -3], [-11, -3]);
    p("#515e74", [7, -28], [12, -27], [14, -13], [16, -6], [10, -4], [7, -8]);
    p("#8a98a5", [-17, -4], [-15, -13], [-12, -16], [-9, -14], [-11, -5], [-13, 0], [-17, 0]);
    p("#8595a5", [12, -14], [15, -12], [17, -5], [18, 0], [14, 1], [11, -6], [10, -12]);
    r(-13, -18, 6, 1.5, "#4d5d70");
    r(7, -18, 7, 1.5, "#414e66");
    r(-12, -14, 5, 1, "#a5b0b8");

    p("#a1968b", [-9, -2], [-8, -10], [-4, -16], [4, -16], [8, -11], [9, -2]);
    p("#64544f", [-7, -2], [-6, -10], [-3, -13], [3, -13], [6, -10], [7, -1]);
    p("#303743", [-4, -1], [-4, -9], [4, -9], [5, -1]);
    r(-6, -11, 2, 8, "#ad8463");
    r(-5, -12, 10, 2, "#c69b70");
    r(-8, 0, 16, 2, "#a3abb1");

    r(-15, -34, 30, 8, "#393c48");
    p("#8d6c54", [-15, -34], [-10, -35], [-9, -27], [-12, -26], [-14, -28]);
    p("#785848", [11, -35], [15, -34], [15, -27], [11, -26]);
    p("#ae8a5b", [-7, -28], [-4, -30], [4, -30], [7, -28], [4, -26], [-4, -26]);
    p("#495568", [-16, -28], [16, -28], [13, -24], [-13, -24]);
    r(-11, -27, 22, 1.5, "#92a3b1");

    p("#404c62", [-23, -34], [-21, -40], [-15, -45], [14, -45], [21, -40], [23, -34], [16, -31], [-16, -31]);
    p("#91a1b5", [-21, -35], [-19, -39], [-14, -43], [13, -43], [19, -39], [21, -35], [16, -33], [-16, -33]);
    p("#b8c4ce", [-20, -36], [-15, -42], [-11, -43], [-14, -37], [-17, -34]);
    p("#71829e", [11, -43], [15, -42], [20, -36], [16, -34], [12, -37]);
    for (const x of [-10, -3, 5, 12]) p("#6e7e96", [x, -40], [x + 1, -40], [x + 2, -34], [x, -34]);
    r(-9, -34.5, 17, 1, "#d1d7d7");

    p("#3b4659", [-17, -42], [-16, -48], [-10, -51], [10, -51], [16, -48], [17, -42],
      [11, -39], [-11, -39]);
    p("#95a5b6", [-15, -43], [-14, -47], [-10, -49], [9, -49], [14, -47], [15, -43],
      [10, -40], [-10, -40]);
    p("#3c3b43", [-13, -44], [-9, -47], [9, -47], [13, -44], [8, -42], [-8, -42]);
    p("#a88357", [-12, -44], [-8, -46], [8, -46], [12, -44], [7, -41.5], [-8, -41.5]);
    p("#6e543f", [-8, -44], [-5, -45], [6, -45], [8, -44], [4, -43], [-4, -43]);
    r(-12, -44, 6, 1, "#caab73");
    r(-4, -42.75, 8, 1, "#e3c88e");
    r(7, -44, 5, 1, "#c9a371");

    p("#344253", [-5.5, -25], [5.5, -25], [5.5, -19], [0, -15], [-5.5, -19]);
    p(crest, [-4.5, -24], [4.5, -24], [4.5, -19.5], [0, -16.5], [-4.5, -19.5]);
    p("#d8dee0", [-3, -23], [.5, -22.75], [2.75, -21], [3.5, -19.75], [1, -20.75],
      [.5, -18.75], [-2.5, -19.25], [-1.75, -21]);
    if (style !== 1) {
      r(-10, -24.5, 20, 1, "#b7b5a8");
      r(-16, -29, 32, 1.5, "#8e7a65");
      r(-15, -29, 8, 1, "#c5a77b");
    }
    if (style === "wingpair") {
      p("#435567", [-23, -34], [-25, -27], [-20, -25], [-10, -27], [-12, -31], [-18, -33]);
      p("#bda586", [-23, -31], [-21, -29], [-13, -28], [-15, -31]);
      r(-23, -27.5, 11, 1.5, "#8f7e67");
      r(-22, -30, 2, 2, "#d8e2de");
    } else if (style === "talon") {
      p("#4c4c60", [-19, -40], [-20, -48], [-16, -51], [-13, -44], [-15, -37]);
      p("#b59768", [-18, -43], [-18, -48], [-16, -49.5], [-15, -44], [-16, -41]);
      p("#4c4c60", [14, -40], [13, -47], [17, -51], [21, -47], [19, -39]);
      p("#c4a77b", [16, -43], [16, -47], [17.5, -49], [19, -47], [18, -43]);
    }
    if (mastery) {
      for (const side of [-1, 1]) {
        const x = side * 12;
        p("#53566a", [x - 3, -14], [x + 3, -15], [x + 4, -4], [x - 3, -2]);
        r(x - 2, -12, 4, 2, style === "talon" ? "#c9ac74" : "#b7cbd0");
        r(x - .75, -10, 1.5, 4, "#d9dedc");
      }
      r(-6, -33, 12, 1.5, style === "talon" ? "#dabe81" : "#c8d9dc");
    }

    r(15, -26, 8, 2, "#4a5362");
    r(21, -25, 1.5, 4, "#505c6c");
    p("#364150", [19, -22], [24, -22], [25, -19.5], [24, -15.5], [19, -15.5], [18, -19.5]);
    r(19.5, -20.75, 4, 4, "#72bacb");
    r(20.25, -20.25, 1.25, 2.75, "#cbede5");
    if (towerStyle === "frost-watch") {
      paintSnowFooting(r, p, 22, 5.5);
      p("#d2e6ec", [-22, -36], [-20, -41], [-16, -44], [-13, -42], [-15, -39], [-18, -38], [-19, -34]);
      p("#a7c4d4", [13, -43], [19, -41], [22, -36], [19, -35], [16, -39], [12, -40]);
      p("#d2e6ec", [-17, -47], [-11, -51.5], [-5, -51], [-7, -48], [-12, -47], [-14, -44]);
    }
  }, 2);
  const art = shaded ? shadeSprite(painted) : painted;
  roosts.set(key, art);
  return art;
}

const wingAngles = { raised: .69, open: .06, lowered: -.72, dive: .48 };
const primaries: readonly Point[] = [[-30, -17], [-30, -12], [-28, -6], [-25, -1], [-21, 3], [-16, 5]];
const wingTips: Record<GriffinLook, string> = {
  adult: "#83b3ce", young: "#b2c2cf", grown: "#a5c6d5", merged: "#dcc087",
};

function paintWing(p: Shape, rootX: number, rootY: number, angle: number, span: number, side: -1 | 1,
  near: boolean, look: GriffinLook) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const length = span * (look === "young" ? .79 : look === "grown" ? 1.035 : 1);
  const wing: Shape = (color, ...points) => p(color, ...points.map(([x, y]): Point => [
    rootX + side * length * (x * cos - y * sin),
    rootY + length * (x * sin + y * cos),
  ]));
  const blue = near
    ? (look === "merged" ? "#3b476e" : look === "grown" ? "#495f80" : look === "young" ? "#657288" : "#526183")
    : (look === "merged" ? "#313b5c" : "#434f70");
  const tip = near ? wingTips[look] : (look === "merged" ? "#b89f68" : "#6f9cb7");
  // Broad primaries stay distinct even when the shoulder rolls into the downstroke.
  primaries.forEach(([tx, ty], i) => {
    const bx = -10 + i * 1.8, by = -9 + i * 2.7;
    const foldX = tx * .72 + bx * .28, foldY = ty * .72 + by * .28;
    wing(ink, [bx, by - 3], [tx + 3, ty - 2.5], [tx, ty], [tx + 1, ty + 2.5],
      [bx - 2, by + 4], [bx + 3, by + 2]);
    wing(blue, [bx, by - 1.5], [tx + 3.5, ty - 1.5], [tx + 1.5, ty], [tx + 2, ty + 1],
      [bx - 1.25, by + 2.5], [bx + 1.5, by + 1]);
    wing(tip, [foldX, foldY - .7], [tx + 3.5, ty - 1.5], [tx + 1.5, ty], [tx + 2, ty + 1],
      [foldX + 1, foldY + 1.5]);
  });
  wing(ink, [5, -2], [1, -9], [-9, -15], [-17, -15], [-20, -11], [-16, -7], [-16, -2],
    [-13, 3], [-9, 5], [-3, 6], [3, 3]);
  wing(blue, [3, -2], [0, -8], [-9, -13.5], [-16, -13.5], [-18, -11], [-14, -7],
    [-14, -2], [-11, 2], [-8, 4], [-3, 4], [1, 2]);
  wing(near ? (look === "merged" ? "#7e8eb8" : look === "grown" ? "#98aec0" : "#939fbe") : "#7b8ca6",
    [2, -5], [-3, -10], [-9, -13.5], [-16, -13.5], [-18, -11],
    [-13, -8], [-15, -6], [-9, -5], [-11, -1], [-5, -1], [-3, 2], [1, 0]);
  if (near) {
    if (look === "merged") {
      wing("#baa179", [-1, -8], [-9, -13.5], [-15, -13.5], [-13, -11], [-7, -9.5], [-4, -6]);
      wing("#e7d4aa", [-4, -10.5], [-9, -13], [-13, -12.5], [-11, -11], [-6, -10]);
    } else if (look === "grown") {
      wing("#d9e5e9", [-1, -8], [-9, -13.5], [-15, -13.5], [-13, -11], [-7, -9.5], [-4, -6]);
      wing("#bccdd7", [-11, -8], [-14, -7], [-13, -5], [-8, -6], [-6, -5], [-8, -8]);
    } else {
      wing("#c5ccda", [-1, -8], [-9, -13.5], [-15, -13.5], [-13, -11], [-7, -9.5], [-4, -6]);
    }
    wing("#727fa5", [-11, -2], [-8, 0], [-9, 3], [-5, 3], [-3, 1], [-6, -1]);
  }
}

function paintFoldedWing(p: Shape, look: GriffinLook, tucking: boolean, ruffle = false) {
  const span = look === "young" ? .64 : look === "grown" ? .85 : .79;
  const wing: Shape = (color, ...points) => p(color, ...points.map(([x, y]): Point =>
    tucking ? [look === "young" ? 8 + (x - 8) * .82 : x, y + (x - 8) * .2]
      : [8 + (x - 8) * span, y - (ruffle ? 2.2 - (x - 8) * .08 : .5)]));
  // The wrist sits high while the long feathers fold backward over the haunch.
  wing(ink, [9, -25], [7, -29], [1, -29], [-5, -26], [-13, -23], [-22, -21],
    [-27, -18], [-23, -17], [-27, -14], [-22, -14], [-24, -11], [-18, -12],
    [-19, -10.5], [-13, -12], [-6, -15], [1, -17], [7, -20]);
  const tips: readonly Point[] = [[-26, -18], [-25, -14.5], [-22, -12.5], [-17, -11.75]];
  tips.forEach(([x, y], i) => {
    const rootX = -3 + i * 2.25, rootY = -25 + i * 1.75;
    wing(i % 2 === 0 ? "#617496" : "#4d6080", [rootX, rootY], [x + 3, y - 1], [x, y],
      [x + 4, y + 1.15], [rootX + 1.5, rootY + 2.75]);
    wing(wingTips[look], [x + 4.75, y - 1], [x + 1, y], [x + 4, y + .75], [x + 8, y - .6]);
  });
  wing("#394962", [-24, -16], [-16, -19.25], [-7, -21.5], [-8, -20], [-16, -17.75], [-22, -15.25]);
  wing("#394962", [-21, -13.5], [-13, -16.75], [-4, -19.25], [-5, -17.75], [-13, -15.25], [-19, -12.75]);
  wing("#7183a6", [8, -25], [6, -27.5], [1, -27.5], [-5, -24.5], [-11, -22],
    [-15, -20], [-10, -19.5], [-5, -21], [-6, -18.5], [0, -20], [3, -22], [5, -21]);
  wing("#aebcd1", [6, -26.5], [1, -27.5], [-4, -25], [-9, -23.25], [-11.5, -21.5],
    [-6, -22.5], [-2, -24], [1, -24.5], [4.5, -24.25]);
  wing("#c6ced9", [1, -27.5], [-3, -25.5], [-5, -24], [-1, -24.75], [2, -25.5], [4, -25.5]);
}

function paintFarFoldedWing(p: Shape) {
  p(ink, [7, -23], [5, -28], [2, -30], [-4, -30], [-10, -27], [-16, -25], [-22, -22],
    [-16, -22], [-20, -20], [-13, -21], [-8, -22], [2, -22]);
  p("#536685", [4, -24], [3, -27], [1, -28.5], [-4, -28.5], [-10, -25.5], [-16, -24], [-20, -22.5],
    [-14, -23], [-11, -22.5], [-5, -24], [-2, -23.5]);
  p("#8eaac1", [-4, -28.5], [-10, -25.5], [-16, -24], [-11, -24], [-5, -26], [-1, -27.5]);
}

function paintEagleHead(r: Rect, p: Shape, x: number, y: number, striking: boolean, look: GriffinLook = "adult", idle: GriffinIdle = "none") {
  const cry = !striking && idle === "cry";
  const blink = !striking && idle === "blink";
  const openBeak = striking || cry;
  const hx = x + (idle === "scan" ? .5 : idle === "preen" ? 1.2 : cry ? -1 : 0);
  const hy = y + (idle === "scan" ? -1.4 : idle === "preen" ? 1.8 : cry ? -2.2 : 0);
  const angle = cry ? -0.26 : idle === "preen" ? 0.18 : idle === "scan" ? -0.09 : 0;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const face: Shape = (color, ...points) => p(color, ...points.map(([px, py]): Point =>
    angle === 0
      ? [px + hx, py + hy]
      : [hx + px * cos - (py + 4) * sin, hy - 4 + px * sin + (py + 4) * cos]));
  const dot = (px: number, py: number, w: number, h: number, color: string) => {
    if (angle === 0) r(hx + px, hy + py, w, h, color);
    else face(color, [px, py], [px + w, py], [px + w, py + h], [px, py + h]);
  };
  if (look === "young") {
    face(ink, [-8, -8], [-7, -14], [-3, -18], [-1, -16], [3, -18], [9, -17], [13, -14],
      [16, -10], [15, -6], [11, -3], [7, -1], [2, -1], [0, -3], [-4, -2], [-4, -5]);
    face("#beb9b2", [-6, -8], [-5, -14], [-2, -16], [0, -14.5], [4, -16.5], [8, -16], [11, -14],
      [14, -10], [13, -6.5], [10, -4.5], [6, -2.5], [2, -2.5], [0, -4.5], [-3, -3.5]);
    face("#f1e8d8", [-4, -8], [-4, -13], [-1, -15], [0, -13.5], [4, -15.5], [8, -15],
      [11, -12.5], [10, -10], [7, -11.5], [6, -8], [2, -6], [1, -8], [-1, -6]);
    face("#dad5cf", [0, -7], [3, -9], [10, -8], [10, -5], [5, -3.5], [3, -5.5], [0, -4.5]);
    if (blink) {
      dot(8.2, -10.4, 4.2, 1.1, ink);
    } else {
      dot(8, -12, 4.5, 3.5, ink);
      dot(8.75, -11.75, 2.6, 2.7, "#cf9f59");
      dot(10, -11.4, 1.5, 2, "#403443");
      dot(9, -11.6, 1, 1, "#ffeece");
    }
    face(ink, [12, -11], [16, -10.75], [18, -8.5], [17.5, -6.75],
      [15.5, openBeak ? -4.5 : -6.25], [14.5, -8], [12, -8]);
    face("#c8a87f", [13, -10.4], [15.75, -10.2], [17, -8.75], [16.5, -7],
      [15.25, -8.4], [13, -8.6]);
    return;
  }
  if (look === "grown") {
    face(ink, [-6, -13], [-12, -16], [-12.5, -20.5], [-5, -19.5], [3, -17], [1, -13]);
    face("#91a4bb", [-9, -17], [-10.5, -19.5], [-5, -18.5], [0, -16.5], [-4, -15]);
    face("#dededb", [-10, -19], [-6, -18.5], [-2, -17], [-6, -16.5]);
  }
  face(ink, [-8, -9], [-5, -13], [-9, -17], [-2, -16], [-4, -19], [4, -18],
    [10, -16], [13, -15], [17, -11], [16, -7], [12, -5], [9, -5], [5, -1],
    [1, 0], [0, -3], [-4, -2], [-4, -5], [-7, -6]);
  face("#aeb2c3", [-6, -9], [-3, -13], [-5, -15.5], [1, -14.5], [-1, -17.5], [4, -16.5],
    [10, -14.5], [13, -13.5], [15, -10.5], [14.5, -8], [11.5, -6.5], [8, -7],
    [5, -3], [1.5, -1.75], [1, -5], [-3, -4], [-2.5, -6.5], [-5, -7.5]);
  face(silver, [-4, -9.5], [-2, -13], [-4.5, -15.25], [2.5, -14], [0, -17], [4.5, -16],
    [9, -14.25], [12, -13.5], [14, -11.5], [11, -10], [8, -11], [5, -8], [3, -9],
    [.5, -6.5], [0, -10]);
  face("#c9ced8", [-2, -7], [2, -9], [3, -6.5], [8, -9], [6, -6], [2.5, -3.75], [2, -6], [-1, -5]);
  if (look === "merged") {
    face(ink, [0, -16.75], [3, -20], [7, -18.5], [10, -16.5], [14, -16], [13, -13], [2, -14]);
    face("#bea274", [2, -16.5], [3.5, -19], [6.5, -17.5], [10, -15.75], [12.5, -15.25],
      [11.5, -13.75], [3.5, -14.75]);
    dot(4, -17.75, 2, 1.5, "#e5cf9b");
    dot(8, -15.75, 2.5, 1.25, "#a9cbd0");
  }
  if (blink) {
    face(ink, [8.5, -11.4], [14, -11.2], [14, -10.1], [8.5, -10.3]);
  } else {
    face(ink, [8, -13], [14, -12], [14, -10], [10.5, -9.75], [9, -11]);
    dot(10.25, -12, 2.75, 1.5, look === "merged" ? "#ffd86b" : "#dfaa5d");
    dot(12.25, -11.75, .75, 1.25, "#393343");
    dot(10.25, -12, 1, .75, "#f4d589");
  }

  if (openBeak) {
    face("#282d3b", [13, -10], [18.5, -10], [19.25, -7], [16, -4.5], [13, -6]);
    dot(15, -7.5, 2.75, 1.5, "#ae6f53");
  }
  face(ink, [13, -12.5], [17.5, -12], [20.5, -9.75], [20.5, -7.75], [18.5, -6.5], [17, -9], [13, -9]);
  face(look === "merged" ? "#d6be86" : "#a4a5b1", [14.5, -11.5], [17.5, -11], [19.25, -9.5], [19, -8], [17.5, -9.75], [14, -10]);
  dot(15.25, -11.25, 2, .75, look === "merged" ? "#fff3c4" : "#ddd8ca");
}

function paintGroundGriffin(r: Rect, p: Shape, look: GriffinLook, striking: boolean, idle: GriffinIdle = "none") {
  // The curled tail sits behind the wings, with a darker tuft separated from the rump.
  const tw = idle === "scan" ? -1.8 : idle === "cry" ? 1.5 : 0;
  p(ink, [-13, -19], [-18, -19.5], [-22, -17], [-24.5, -17.5 + tw * .4], [-25, -20 + tw * .5], [-23, -24.5 + tw * .6],
    [-24.5, -27 + tw], [-23.5, -31.5 + tw], [-20.75, -34.5 + tw], [-18.5, -32.5 + tw], [-18.75, -28.5 + tw],
    [-20.5, -25.5 + tw * .6], [-23, -20 + tw * .4], [-22.5, -19.25], [-18.5, -22.5], [-14, -22.5]);
  p(bodyMid, [-13.5, -20.25], [-18.25, -20.75], [-22, -18.25], [-23.75, -18.75 + tw * .4], [-23.75, -20 + tw * .5],
    [-21.5, -25 + tw * .6], [-20.25, -25.75 + tw * .6], [-22, -20.5 + tw * .4], [-22.75, -19.25], [-22, -18.5], [-18.5, -21.75],
    [-14.5, -21.5]);
  p("#505b76", [-23.25, -27 + tw], [-22.75, -30.5 + tw], [-20.75, -32.5 + tw], [-19.75, -30.75 + tw], [-20, -28 + tw],
    [-21.5, -25.75 + tw * .7]);
  p("#8ba1ba", [-22.75, -29 + tw], [-22, -31 + tw], [-20.75, -32.5 + tw], [-20.75, -30 + tw], [-21.5, -28.75 + tw]);
  paintFarFoldedWing(p);

  // Offset the far paws so the low stance still shows four separate supports.
  p(ink, [-13.5, -17.5], [-6.5, -16.25], [-2.75, -12.25], [-5.75, -7.75], [-9, -5], [-8, -2.75],
    [-3.5, -2.25], [-2.5, -.25], [-4.25, 1], [-11.5, 1], [-14.75, -3.5], [-13.5, -8.25], [-15.5, -13]);
  p(bodyDark, [-12.75, -15.5], [-7.5, -14.75], [-5, -12], [-7, -9], [-10.75, -5.5], [-10.5, -3],
    [-6, -1], [-11, -.5], [-12.75, -3.5], [-11.75, -8], [-13.5, -12.5]);
  p(ink, [14.5, -19], [20.5, -17], [22.5, -12.75], [22, -6], [23.5, -3.5], [28, -2.75],
    [29, -.5], [27, 1], [18.75, 1], [16.5, -1.5], [17.25, -7], [14, -12]);
  p(bodyMid, [16, -17], [19.75, -15.5], [20.5, -12.5], [20, -6], [21.5, -2.5], [25.5, -1.35],
    [26, -.5], [19.5, -.5], [18.25, -1.75], [19, -7], [16, -12]);
  r(22.75, -1.5, 2, 1.25, "#a59688");

  // A deep rib cage flows into a lifted abdomen and a high, rounded haunch.
  p(ink, [-20, -17], [-18, -22], [-13, -24], [-8.5, -23.5], [-2.5, -21], [3, -22.5], [8.5, -26],
    [14, -26], [19, -22.5], [22.5, -17], [22, -12.5], [18, -8], [13, -7.5], [7.5, -9.5], [3, -12.5],
    [-2.5, -14], [-8, -12.5], [-12, -10], [-17, -11], [-19.5, -13]);
  p(bodyDark, [-18, -16.75], [-16.5, -20.5], [-13, -22.25], [-9, -21.75], [-2.5, -19.25], [3.5, -20.75],
    [9, -24], [13.75, -24], [17.5, -21.5], [20.5, -16.75], [20, -13], [16.75, -9.75], [13, -9.5],
    [8.25, -11.25], [3.5, -14], [-2.75, -15.75], [-8.5, -14.25], [-12.5, -12], [-16.5, -12.75]);
  p(bodyMid, [-18, -17], [-16, -20.25], [-12.5, -21.75], [-8, -21], [-3, -18.5], [3.5, -19.5],
    [9, -23.5], [13, -23.5], [16.5, -21], [18.5, -17.25], [17.25, -14], [13, -12], [9.75, -13.25],
    [6, -16.5], [1, -17], [-4.5, -16.5], [-9.75, -15], [-15.5, -15]);
  p(bodyLight, [-17, -17.75], [-14.75, -20.75], [-10.25, -21.25], [-7.75, -19.5], [-10.25, -17.75],
    [-13.75, -16.5], [-16.5, -16.5]);

  // The near hind leg drives forward at the knee and back at the hock.
  p(ink, [-16.75, -20], [-11.5, -20], [-7.5, -17.75], [-5.75, -13.5], [-8, -9.75], [-12, -7.25],
    [-15, -4.8], [-14.75, -2.75], [-10, -1.25], [-8.5, 1.25], [-10.75, 3.25], [-21, 3.25],
    [-23, .5], [-21, -3.5], [-18, -7.5], [-20.5, -12.5], [-20, -16.5]);
  p(bodyMid, [-16.25, -18.25], [-11.5, -18.3], [-9, -16.5], [-7.75, -13.75], [-9.75, -10.75],
    [-13, -8.75], [-17, -5.5], [-17, -2.25], [-14.75, -1.25], [-11.25, .5], [-12.5, 1.75], [-20.25, 1.75],
    [-20.65, .25], [-19.5, -2.75], [-15.75, -7.5], [-18.5, -12.75], [-18.5, -16]);
  p(bodyLight, [-16.75, -17], [-13.75, -18.25], [-10.5, -17.25], [-9.25, -14.25], [-11.75, -11.75],
    [-14.25, -11.25], [-16.75, -13.5]);
  p("#8791a4", [-18.75, -4.25], [-16.5, -5.75], [-16.75, -3], [-18.25, -.75], [-20, -.75]);
  r(-18.5, .75, 2.25, 1, "#c5bcb8");
  r(-15, .75, 2.25, 1, "#c5bcb8");
  paintFoldedWing(p, look, false, !striking && (idle === "cry" || idle === "scan"));

  if (striking) {
    p(ink, [9, -19.5], [16, -20], [20.5, -17], [23.5, -13], [27, -12], [31.5, -12.75],
      [35, -10.75], [35, -7.5], [32.25, -8], [30.5, -5.5], [27.5, -5.5], [24.5, -7.5],
      [19.5, -8.75], [14, -10.5], [10, -14]);
    p("#9da8ba", [11, -17.75], [16, -18.25], [19, -15.75], [22.25, -11.75], [26.5, -10.5],
      [26.5, -8.5], [23.5, -9.25], [18.5, -10.75], [14.75, -12.25], [11.5, -15]);
    p("#c5a775", [27.25, -10.5], [31.25, -11.25], [33, -10], [33, -9], [30.7, -9.35],
      [29.25, -7.25], [27.4, -7.8]);
    r(30.5, -10.5, 2, 1, "#ead0a0");
  } else {
    p(ink, [7.5, -21], [14.5, -21.75], [19.5, -18.75], [21, -15.25], [19.25, -9.5], [17.25, -4.25],
      [19, -2.25], [22, -1], [23, 1.5], [20.75, 3.25], [9.25, 3.25], [6.5, 1], [7.25, -3.75],
      [7.5, -8.25], [5.75, -13.25], [6, -17.5]);
    p("#929bad", [8.5, -19.25], [14.25, -20], [18, -17.75], [19.25, -15], [17.5, -9.75], [15.25, -4.25],
      [17, -1.75], [20, -.25], [20.5, 1.5], [9.5, 1.5], [8.75, .25], [9.25, -3.5], [9.5, -8.5],
      [7.75, -13.5], [7.75, -17]);
    p("#b1bbca", [9.5, -17.5], [13.25, -18.75], [16.5, -16.75], [16.75, -14.5], [14.25, -10.5],
      [11.5, -10.5], [10.75, -13]);
    r(11, .5, 2.25, 1, "#d6cbb7");
    r(14.5, .5, 2.25, 1, "#d6cbb7");
    r(18, .5, 2, 1, "#d6cbb7");
  }

  // The low eagle head sits inside a heavy feather ruff over the lion's chest.
  p(ink, [6, -22], [10, -24.5], [17, -25.25], [22, -23.25], [24, -19], [22, -14],
    [22.5, -11.5], [19.75, -12], [17.5, -8.5], [15.5, -9.75], [13.5, -7.75], [11.75, -11.75],
    [8.75, -10], [9.5, -14], [6, -16.5]);
  p("#76849b", [8, -21.25], [11, -23.25], [16.75, -23.75], [21, -22], [22.25, -19], [20.25, -14.75],
    [20.25, -13.75], [19, -14], [17.5, -10.75], [15.5, -12.25], [14, -10.5], [12.5, -14],
    [10.25, -12.75], [10.75, -15.75], [8, -17]);
  p("#a9b2c2", [9.5, -20.5], [14, -22.5], [20, -20.5], [20.75, -18.25], [18.5, -15.25],
    [17.25, -12.5], [16.5, -16], [14.5, -13.25], [13.75, -17], [11.75, -14.75], [12, -17.5]);
  if (look === "merged") {
    // Frost-steel breastplate with gilded rim on grounded merged griffin
    p(ink, [10, -17], [21, -17], [22, -11], [16, -8], [10, -11]);
    p("#556d8c", [11.5, -16], [19.5, -16], [20.5, -11.5], [16, -9.25], [11.5, -11.5]);
    r(12.5, -15.5, 6.5, 1.25, "#c9b58a");
    p("#adbfc3", [14, -13.75], [17, -13.5], [16, -10.75], [14.5, -11.25]);
  } else if (look === "grown") {
    p("#99b0bf", [8, -18], [14, -17], [17, -13], [14, -10], [12.5, -12], [10, -11]);
    p("#d9e5e6", [10, -18], [14, -17], [15, -14], [13, -12], [11, -14]);
  }
  paintEagleHead(r, p, striking ? 14.5 : 13.5, striking ? -12.5 : -14.5, striking, look, idle);
}

function griffinSprite(pose: GriffinPose, look: GriffinLook, idle: GriffinIdle = "none") {
  const shaded = highQuality();
  const key = pose + "/" + look + "/" + idle + "/" + Number(shaded);
  const cached = griffins.get(key);
  if (cached) return cached;
  const grounded = pose === "perch" || pose === "claw";
  const folded = pose === "tuck";
  const painted = paintSprite((r, p) => {
    if (grounded) {
      paintGroundGriffin(r, p, look, pose === "claw", idle);
      return;
    }
    const striking = pose === "dive";
    const wing = folded ? 0 : wingAngles[pose];
    if (folded) paintFarFoldedWing(p);
    else paintWing(p, 6, -22, wing + .14, .78, -1, false, look);

    if (pose === "dive") {
      p(ink, [-17, -15], [-23, -13], [-27.5, -15], [-26.5, -11], [-22, -9], [-18, -10], [-14, -12]);
      p("#95aec0", [-26, -13], [-23, -12], [-21, -12], [-23, -10.5], [-25.5, -11]);
    } else {
      p(ink, [-17, -14], [-22, -15], [-24, -18], [-24, -23], [-27, -27], [-27.5, -23], [-28, -18],
        [-25, -13], [-21, -11], [-16, -11]);
      p(bodyMid, [-17, -13], [-22, -13], [-25, -16], [-26, -21], [-24, -20], [-23, -16], [-20, -14]);
      p("#8eaac1", [-26.5, -24], [-24.5, -22], [-24.5, -19.5], [-26.5, -21]);
    }

    const heel = pose === "dive" ? -22 : -12;
    p(ink, [-20, -18], [-11, -16], [heel + 8, -9], [heel + 3, -2], [heel - 2, 0],
      [heel - 5, -3], [heel - 3, -6], [heel - 1, -9]);
    p(bodyMid, [-18, -16], [-12.5, -14.5], [heel + 5, -9], [heel + 1, -3.5], [heel - 2, -2.5],
      [heel - 2.5, -4], [heel + 1, -9]);
    p(ink, [12, -19], [19, -17], [22, -12], [25, -10.5], [26, -7.5], [22.5, -5.5],
      [18, -5.5], [15, -8], [15, -12]);
    p(bodyMid, [14.5, -16.5], [17.5, -15.5], [19.5, -11], [23, -9], [23, -7.5], [19, -7],
      [17, -9], [16.5, -12]);
    r(21, -9.5, 2, 1.75, "#b39a78");

    p(ink, [-23, -16], [-21.5, -20], [-17, -23], [-12, -23.5], [-6, -21.25], [1, -21.5], [8, -24.5],
      [15, -25], [20, -22], [21, -16], [18, -11], [13, -9.75], [7, -11.5], [1, -14],
      [-6, -13.75], [-12, -10], [-18, -10.5], [-22, -13]);
    p(bodyDark, [-21, -16], [-20, -19], [-16, -21], [-12, -21.75], [-6, -19.5], [1, -19.75],
      [8.5, -22.5], [14.5, -23], [18.5, -21], [19, -16], [16.5, -12.5], [13, -11.5],
      [7.5, -13.25], [1, -15.75], [-6, -15.5], [-12.5, -11.75], [-17.5, -12], [-20, -14]);
    p(bodyMid, [-20.5, -16.25], [-18, -19.25], [-14, -20.5], [-10, -20], [-5, -18.25], [1, -18.5],
      [9, -21.5], [14.5, -22.25], [17.5, -19.75], [17.5, -16], [14, -13], [8.25, -14.75],
      [3, -16.75], [-5, -16.5], [-11.5, -14.5], [-14.5, -13.25], [-18, -14]);
    p(bodyLight, [-19.5, -16.5], [-16, -19.25], [-13, -19.75], [-10, -19], [-12, -16.5], [-16, -15]);
    p("#969daf", [-6, -18.5], [1, -19], [8, -21.5], [11.5, -21], [8, -18.75], [2.5, -17.25], [-2, -17.25]);
    p("#9ca5b8", [12, -21.5], [15.5, -20.75], [17.5, -18.5], [16.75, -15.25], [14.5, -13.5],
      [13, -16], [10.75, -17.25]);

    if (!folded) paintWing(p, 1, -21, wing, pose === "lowered" ? .8 : .91, 1, true, look);

    if (pose !== "dive") {
      p(ink, [-20.5, -16.5], [-14.25, -17], [-9.5, -14], [-9.75, -10], [-12.75, -6],
        [-7.5, -2.75], [-7.5, .25], [-12.75, 2.75], [-18.75, 1.5], [-20, -.5], [-19, -3],
        [-17.5, -5.75], [-22, -9], [-22.5, -12]);
      p(bodyMid, [-20, -14.5], [-15, -15], [-11.75, -12.75], [-12, -10], [-15, -6.5],
        [-10, -3], [-9.75, -.5], [-13, 1], [-17.25, -.25], [-17.25, -2], [-15.25, -5.75],
        [-19.75, -9.25], [-20.5, -11.5]);
      p(bodyLight, [-20, -12.75], [-17.75, -14], [-14.5, -13.75], [-15, -11], [-17.5, -9.75], [-19, -10]);
      r(-14.5, -.75, 2, 1.25, "#b3a597");
      r(-11.75, -1, 1.5, 1, "#b3a597");
    } else {
      p(ink, [-19.5, -16], [-11.75, -16.5], [-9.5, -13.5], [-12.75, -9.25], [-19, -6.25], [-21.75, -3],
        [-26.25, -2.25], [-27.5, -4.75], [-25.75, -7], [-24.5, -10.75], [-22.5, -14.25]);
      p(bodyMid, [-19.25, -14.25], [-13, -14.5], [-12, -13.5], [-15, -10.25], [-20.25, -7.75],
        [-23.25, -4.75], [-25.75, -4.25], [-24, -6.5], [-23, -9.75], [-21.25, -13.25]);
      p(bodyLight, [-22.25, -10.5], [-19.75, -13.25], [-16.5, -13], [-17.75, -11.25], [-20.5, -10]);
      r(-25.25, -5, 2.75, 1.25, "#b3a597");
    }

    if (folded) paintFoldedWing(p, look, true);

    if (look === "merged") {
      // Gilded chestplate on airborne merged griffin
      p(ink, [11, -21], [20, -21], [20.5, -13], [14, -11], [10, -14]);
      p("#516787", [12, -20], [18.5, -20], [19, -14], [14.5, -12.25], [11.5, -14.5]);
      r(13, -19.5, 5, 1.25, "#e6c77c");
      r(14.5, -17, 2.25, 2.25, "#a6ecff");
    }
    if (look === "grown") {
      p("#9fb5c3", [9, -23], [15, -22], [19, -18], [15, -13], [13, -15], [11, -13], [10, -16]);
      p("#dae6e7", [10, -22], [14, -21], [17, -18], [15, -15], [13, -17], [12, -16]);
    }
    paintEagleHead(r, p, striking ? 14 : 11, striking ? -17 : -20, striking, look, idle);

    if (striking) {
      p(ink, [9, -18.5], [15, -18.75], [19, -16], [22, -13], [26, -12.5], [30, -13.25], [34, -11.5],
        [35, -9], [34, -6.75], [31.5, -7.75], [30, -4.75], [28, -4.5], [25, -7], [20.5, -7.5],
        [13.5, -10], [9, -13]);
      p("#a8adbb", [10.75, -16.5], [14.5, -17], [18, -14.75], [21.25, -11.25], [26, -10.75],
        [26.15, -8.5], [21, -9.25], [14, -12], [11.25, -14]);
      p("#b9becb", [11.75, -15.75], [14.25, -16.25], [17, -14.25], [18, -12.75], [14.5, -13.75]);
      p("#c5a775", [26.5, -11.25], [30, -11.75], [33, -10.5], [33.5, -9.25], [30.75, -9.5],
        [29.5, -6.25], [27.5, -7.75], [26.5, -9]);
      r(29.25, -10.75, 2.5, 1.25, "#ead0a0");
      r(27.75, -8.5, 1.25, 1.5, "#ead0a0");
    } else {
      p(ink, [8.25, -18.25], [14.5, -18], [17.5, -15.5], [18.25, -10.25], [20, -8.25], [22, -6.75],
        [22.25, -3.5], [19.5, -1.5], [14.5, -.75], [11.25, -3], [10, -5.5], [11.75, -9.5], [8, -13.25]);
      p("#a3aab9", [9.75, -16.5], [13.75, -16.5], [16, -14.25], [16.25, -10.25], [18.25, -7.75],
        [20, -6.25], [20.25, -4.25], [17.75, -3.5], [15, -2.5], [12.75, -4.75], [13.5, -9.5],
        [10.5, -12.75]);
      r(17.25, -5.75, 2, 1.75, "#ccaf82");
      r(14.25, -3.9, 2, 1.25, "#ccaf82");
    }
  }, 2);
  const art = shaded ? shadeSprite(painted) : painted;
  griffins.set(key, art);
  return art;
}

function drawPose(ctx: CanvasRenderingContext2D, pose: GriffinPose, x: number, y: number, scale: number,
  facing = 1, tilt = 0, look: GriffinLook = "adult", sx = 1, sy = 1, flash = 0, idle: GriffinIdle = "none") {
  const art = griffinSprite(pose, look, idle);
  ctx.save();
  ctx.translate(Math.round(x * 2) / 2, Math.round(y * 2) / 2);
  ctx.rotate(tilt);
  if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
  stamp(ctx, art, 0, 0, scale, facing);
  if (flash > 0) {
    ctx.globalAlpha *= flash;
    stamp(ctx, tintedSilhouette(art, "#f4fbff"), 0, 0, scale, facing);
  }
  ctx.restore();
}

export function griffinRoostSprite(tier: GuardPost["tier"], branch?: GuardBranch, towerStyle?: Level["towerStyle"]) {
  return roostSprite(branch ?? (tier === 1 ? 1 : 2), towerStyle, tier === 4);
}

export function drawGriffinRoost(ctx: CanvasRenderingContext2D, x: number, y: number,
  tier: GuardPost["tier"], branch?: GuardBranch, towerStyle?: Level["towerStyle"]) {
  stamp(ctx, griffinRoostSprite(tier, branch, towerStyle), x, y, 1 + (tier - 1) * .035);
}

export function drawGriffinIcon(canvas: HTMLCanvasElement, style: RoostStyle, towerStyle?: Level["towerStyle"], mastery = false) {
  const ctx = canvas2d(canvas);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const x = canvas.width / 2;
  const y = canvas.height;
  const specialized = style === "talon" || style === "wingpair";
  stamp(ctx, roostSprite(style, towerStyle, mastery), x - (specialized ? 7 : 3), y - 7, specialized ? 1.45 : 1.72);
  if (style === "talon") drawPose(ctx, "dive", x + 7, y - 21, 1.15, 1, 0, "merged");
  else if (style === "wingpair") {
    drawPose(ctx, "open", x + 7, y - 27, .9, 1, 0, "adult");
    drawPose(ctx, "perch", x + 12, y - 12, .7, 1, 0, "young");
  } else drawPose(ctx, "open", x + 12, y - 29, .85);
}

export function drawGriffin(ctx: CanvasRenderingContext2D, guard: Guard, post: GuardPost, time: number,
  reducedMotion: boolean, showEffects: boolean) {
  const sinceHit = time - guard.hurtAt;
  const fallen = guard.hp <= 0;
  if (fallen && sinceHit >= .32) return;
  const flight = guard.flight?.height ?? 1;
  const grounded = flight <= .16;
  const attack = fallen ? undefined : guard.attack;
  const windingUp = Boolean(attack && time < attack.impact);
  const windup = attack && windingUp ? clamp((time - attack.start) / (attack.impact - attack.start), 0, 1) : 0;
  const followThrough = attack && !windingUp ? clamp(1 - (time - attack.impact) / (attack.end - attack.impact), 0, 1) : 0;
  const slot = Math.max(0, post.guards.indexOf(guard));
  const moving = !fallen && !attack && time - guard.movedAt < .16;
  const idle = !reducedMotion && !moving && !fallen && !attack && !guard.target && sinceHit > .2;
  // Slightly slower, more stately wingbeat frequency (4.5 vs previous 6.4)
  const phase = time * 4.5 + post.index * .37 + slot * 1.35;
  const watch = idle ? (time * (1 + .05 * slot) + post.index * .77 + slot * 2.41) % 8.8 : 0;
  const cryCycle = post.branch === "talon" ? 13.5 : 16.5;
  const cryBeat = idle ? (time + post.index * 3.9 + slot * 5.7) % cryCycle : Infinity;
  const crying = idle && cryBeat < .78;
  const gliding = idle && !grounded && !crying && flight >= .46 && watch > 5.4 && watch < 6.55;
  const preening = idle && !crying && watch > 2.4 && watch < 3.25;
  const scanning = idle && !crying && !preening && watch > 5.6 && watch < 6.5;
  const blinking = idle && !crying && ((watch > 1.2 && watch < 1.38) || (watch > 4.65 && watch < 4.82));
  const glancing = scanning && watch > 5.78 && watch < 6.36;
  const idleExpr: GriffinIdle = crying ? "cry" : blinking ? "blink" : preening ? "preen" : scanning ? "scan" : "none";

  const strike = windup > .82 || followThrough > .36;
  const diving = !grounded && attack?.pose === "air" && strike;
  const pose: GriffinPose = grounded ? (attack?.pose === "ground" && strike ? "claw" : "perch")
    : diving ? "dive" : reducedMotion || gliding ? "open" : flight < .46 ? "tuck" : wingbeat[Math.floor(phase) % wingbeat.length];
  const rich = highQuality() && !reducedMotion;
  const growthAge = time - (guard.recruit?.grownAt ?? -Infinity);
  const growing = !fallen && !reducedMotion && growthAge >= 0 && growthAge < .65;
  const form = interceptorForm(post, time, reducedMotion);
  const look: GriffinLook = form.branch === "talon" ? "merged"
    : guard.recruit?.grown && (!growing || growthAge >= .18) ? "grown"
    : guard.recruit ? "young" : "adult";
  const swell = growing && growthAge >= .18 ? Math.sin(Math.PI * (growthAge - .18) / .47) * .085 : 0;
  const scale = sizes[look] * (1 + swell);
  const bobAmp = look === "young" ? 1.2 : 1.0;
  const glideLift = gliding ? Math.sin(((watch - 5.4) / 1.15) * Math.PI) * 1.45 : 0;
  const bob = reducedMotion ? 0 : gliding ? glideLift : Math.sin(phase * Math.PI / 2) * bobAmp;
  const height = flight * (10 + bob * (diving ? .25 : 1))
    * (fallen && !reducedMotion ? clamp(1 - sinceHit * 3.3, 0, 1) : 1);
  const recoil = reducedMotion ? 0 : Math.max(0, 1 - sinceHit / .17) * 1.6;
  const driftClock = time * 1.15 + post.index * 1.1 + slot * 2.15;
  const driftX = idle && !grounded ? Math.sin(driftClock) * (gliding ? 2.4 : 1.55) : 0;
  const driftY = idle && !grounded ? Math.cos(driftClock * 1.35) * .65 : 0;
  const x = guard.x * CELL + 8 + guard.recoil[0] * recoil + driftX;
  const y = guard.y * CELL + 9 + guard.recoil[1] * recoil + driftY;
  const [dx, dy] = attack?.direction ?? [0, 0];
  const side = attack && Math.abs(dx) > .12 ? Math.sign(dx) : glancing ? -guard.facing : guard.facing;
  const travel = reducedMotion ? 0 : followThrough * (grounded ? 1.85 : 4.3) - windup * (grounded ? 1.1 : 2.75);
  const idleBank = idle && !grounded ? Math.cos(driftClock) * (gliding ? .07 : .04) : 0;
  const turn = reducedMotion ? 0
    : grounded ? (crying ? -side * .04 : 0)
    : side * (followThrough * .19 - windup * .12) + idleBank;
  const poseX = x + dx * travel;
  const poseY = y - height + dy * travel;

  const buildFade = guardBuildAlpha(post.builtAt, time, reducedMotion);
  if (buildFade <= 0) return;

  ctx.save();
  ctx.globalAlpha = (fallen ? Math.max(0, 1 - sinceHit / .32) : 1) * buildFade;
  ctx.beginPath();
  ctx.ellipse(x - side * .9, y + 1.1, scale * (8.1 - height * .16), 1.8 - height * .04, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#222b3677";
  ctx.fill();

  if (showEffects && !reducedMotion && !fallen) {
    const landing = time - (guard.flight?.landedAt ?? -Infinity);
    const fusion = guard.fusion;
    if (landing < .24) {
      ctx.globalAlpha = .65 * (1 - landing / .24);
      if (rich) pixelRing(ctx, x, y + .5, 3 + landing * 30, 10, "#d9ccb5", .75);
      for (const s of [-1, 1]) {
        box(ctx, x + s * (3 + landing * 19), y - landing * 6, 1.5, .75, "#d4c1a6");
        box(ctx, x + s * (5 + landing * 20), y - .75 - landing * 7, 1, 1, "#ece3cb");
      }
    }
    if (fusion && time - fusion.at < .43) {
      const progress = (time - fusion.at) / .43;
      const [fx, fy] = fusion.from;
      ctx.globalAlpha = 1 - progress;
      drawPose(ctx, "open", x + (fx * CELL + 8 - x) * (1 - progress),
        y - height + (fy * CELL + 9 - y) * (1 - progress), sizes.adult, guard.facing);
      pixelRing(ctx, x, y - height - 4, 3 + progress * 11, 12, "#b6e1ff", .8);
    }
    ctx.globalAlpha = 1;
  }

  let sx = 1, sy = 1;
  if (!fallen && !reducedMotion) {
    if (diving) {
      sx = 1 + .14 * followThrough - .07 * windup;
      sy = 1 - .1 * followThrough + .08 * windup;
    } else if (grounded && attack?.pose === "ground") {
      sx = 1 + .11 * followThrough - .06 * windup;
      sy = 1 - .08 * followThrough + .06 * windup;
    } else if (grounded && idle) {
      const breath = Math.sin(time * 2.2 + slot * 1.9 + post.index) * .026;
      sx = crying ? .97 : 1 - breath * .6;
      sy = crying ? 1.04 : 1 + breath;
    } else if (!grounded && rich) {
      const pulse = gliding ? .015 : Math.sin(phase * Math.PI / 2) * .03;
      sx = 1 - pulse;
      sy = 1 + pulse;
    }
    if (rich && sinceHit < .1) {
      const h = 1 - sinceHit / .1;
      sx += h * .09;
      sy -= h * .1;
    }
  }
  const hitFlash = rich && !fallen && sinceHit < .1 ? (1 - sinceHit / .1) * .78 : 0;
  const growthFlash = rich && growing ? Math.max(0, 1 - Math.abs(growthAge - .18) / .18) * .62 : 0;

  if (rich && showEffects && !fallen && !grounded) {
    if (!gliding) drawWingGust(ctx, poseX, poseY, side, phase, scale, look === "merged" || look === "grown");
    if (diving && followThrough > .25) {
      ctx.save();
      ctx.globalAlpha = followThrough * .65;
      for (const offset of [-3, 2]) {
        linePixels(ctx, poseX - dx * 9, poseY - 8 * scale + offset - dy * 6,
          poseX - dx * 2, poseY - 8 * scale + offset, "#cceeff", .6, .75);
      }
      ctx.restore();
    }
  }

  drawPose(ctx, pose, poseX, poseY, scale, side, turn, look, sx, sy, Math.max(hitFlash, growthFlash), idleExpr);

  // Subtle sky-cry silver glint when calling during idle
  if (rich && showEffects && crying) {
    const c = cryBeat / .78;
    ctx.save();
    ctx.globalAlpha = Math.sin(c * Math.PI) * .62;
    const bx = poseX + side * (12 * scale + c * 4.5);
    const by = poseY - (grounded ? 14 : 17.5) * scale - c * 4.5;
    box(ctx, bx, by, 1.5, 1, "#e8f6ff");
    box(ctx, bx + side * 2, by - 1.5, 1.2, 1.2, look === "merged" ? "#ffe9ab" : "#b8dcf2");
    ctx.restore();
  }

  if (rich && showEffects && growing) {
    const t = growthAge / .65;
    ctx.save();
    ctx.globalAlpha = .75 * Math.sin(t * Math.PI);
    for (const s of [-1, 1]) {
      box(ctx, poseX + s * (4 + t * 9), poseY - 6 - t * 12, 1, 1.75, "#e5edf2");
      box(ctx, poseX + s * (7 + t * 9), poseY - 4 - t * 8, 1.25, .75, "#9ebed0");
    }
    ctx.restore();
  }

  if (rich && showEffects && !fallen && attack && followThrough > .18) {
    drawClawSlash(ctx, poseX, poseY, side, followThrough, attack.pose === "air", scale);
  }
  const maxHp = guardUnitStats(post, guard).health;
  const healing = !fallen && guard.hp < maxHp && guard.healedAt !== undefined && time - guard.healedAt < 0.25;
  if (healing && showEffects) drawGuardHeal(ctx, poseX, poseY - 4 * scale, time, reducedMotion);
  if (!fallen && guard.hp < maxHp) {
    const bar = y - height - (grounded ? 19 : 27) * scale;
    box(ctx, x - 4.5, bar, 9, 1.5, "#252a3b");
    box(ctx, x - 4.5, bar + .25, 9 * guard.hp / maxHp, 1, healing ? "#94f2c2" : "#b9d8f4");
  }
  ctx.restore();
}
