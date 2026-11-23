import type { Facing } from "../engine/formation.ts";
import type { Point, Tower } from "../engine/types.ts";
import { diamond, linePixels, pixelRing } from "./animation.ts";
import { box } from "./canvas.ts";
import { landShape } from "./landforms.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export type MoosePose = "walk" | "cast" | "release" | "brace" | "sweep" | "recover";

/**
 * 12 冰脊哨台 · 凛冬麋王 (Winter Sovereign Moose)
 * Sacred ancient celestial frost-moose with pearl-snow & silver-blue pelage,
 * glacier-blue gold-trimmed ceremonial mantle, gilded brow diadem & hoof greaves,
 * towering crystalline antlers cradling a floating golden-ice winter halo, and full
 * 4-frame animations for walk, sacred frost invocation (cast/release), and antler sweep.
 */
export function paintFrostMoose(r: Rect, p: Shape, frame: number, facing: Facing, pose: MoosePose) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const casting = pose === "cast" || pose === "release";
  const sweeping = pose === "sweep";
  const bracing = pose === "brace";
  const recovering = pose === "recover";

  const k = [0.25, 0.58, 0.86, 1][frame];
  const rev = [1, 0.72, 0.35, 0.08][frame];
  const bob = pose === "walk"
    ? [0, -1.2, 0, -0.9][frame]
    : pose === "cast" ? -k * 1.4
    : pose === "release" ? [2.2, 1.4, 0.4, 0][frame]
    : bracing ? k * 1.5
    : sweeping ? [2, 0.6, -0.8, 0][frame]
    : recovering ? (1 - k) * 0.8 : 0;

  const ink = "#192338";
  const coatDeep = "#4d5f7a";
  const coat = "#7f96b2";
  const coatLight = "#c1d2e0";
  const snow = "#eff8fd";
  const capeDeep = "#2d5f80";
  const cape = "#4f9ec2";
  const goldDeep = "#9b722f";
  const gold = "#e8c266";
  const goldHi = "#fff5c2";
  const iceDeep = casting ? "#52b4d6" : "#3b84a8";
  const ice = casting ? "#c4f8ff" : "#7fdaf2";
  const iceBright = casting ? "#ffffff" : "#defcff";
  const eye = casting ? "#ffffff" : sweeping || bracing ? "#ffea85" : "#9cf8ff";

  // Floating celestial winter halo: delicate open golden ring + radiant 4-point star (no solid blob!)
  const drawHalo = (cx: number, cy: number, radius: number, flare: number) => {
    const outer = radius + flare * 1.3;
    const ry = Math.max(cy, -50 + outer); // keep halo anchored to head while preventing top clip
    const sx = side ? 0.72 : 1;
    // Draw a crisp open golden ring using 12 fine faceted ring nodes around the perimeter
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const a = (i * Math.PI * 2) / steps;
      const px = cx + Math.cos(a) * outer * sx;
      const py = ry + Math.sin(a) * outer;
      const major = i % 3 === 0;
      r(px - 0.9, py - 0.9, 1.8, 1.8, goldDeep);
      r(px - 0.65, py - 0.65, 1.3, 1.3, casting || major ? goldHi : gold);
    }
    // Delicate cardinal outer rays when casting/releasing
    if (casting || frame % 2 === 0) {
      const ray = outer + 1.8 + flare * 0.9;
      r(cx - 0.6, ry - ray, 1.2, 1.8, goldHi);
      r(cx + ray * sx - 0.6, ry - 0.6, 1.8, 1.2, iceBright);
      r(cx - ray * sx - 1.2, ry - 0.6, 1.8, 1.2, iceBright);
    }
    // Radiant floating 4-point winter crystal star centered inside the open halo
    const star = 2.4 + flare * 1.4;
    p(iceDeep, [cx, ry - star - 0.7], [cx + 1.4, ry - 1.4], [cx + (star + 0.7) * sx, ry], [cx + 1.4, ry + 1.4],
      [cx, ry + star + 0.7], [cx - 1.4, ry + 1.4], [cx - (star + 0.7) * sx, ry], [cx - 1.4, ry - 1.4]);
    p(iceBright, [cx, ry - star], [cx + 0.9, ry - 0.9], [cx + star * sx, ry], [cx + 0.9, ry + 0.9],
      [cx, ry + star], [cx - 0.9, ry + 0.9], [cx - star * sx, ry], [cx - 0.9, ry - 0.9]);
    r(cx - 0.7, ry - 0.7, 1.4, 1.4, "#ffffff");
  };

  // Noble feathered legs with gilded ankle greaves and dark crystalline hooves
  const leg = (x: number, fore: boolean, far: boolean, left: boolean) => {
    const phase = (frame + ((side ? fore !== far : fore !== left) ? 0 : 2)) % 4;
    const stride = pose === "walk"
      ? [-3.4, 0, 3.4, 1.0][phase]
      : pose === "cast" && fore ? (far ? 1 : 3.5 * k)
      : pose === "release" && fore ? [2.5, 1.5, 0.5, 0][frame]
      : bracing ? (fore ? -2.2 * k : -0.8 * k)
      : sweeping && fore ? [4.8, 5.4, 3.2, 1.2][frame]
      : recovering && fore ? (1 - k) * 1.5 : 0;
    const lift = pose === "walk"
      ? [0, 3.6, 0, 2.2][phase]
      : pose === "cast" && fore ? (far ? k * 3.5 : k * 7.2)
      : pose === "release" && fore ? [0, 0.6, 0, 0][frame]
      : sweeping && fore && !far ? [2.8, 1.6, 0.5, 0][frame] : 0;
    const root = (fore ? -22 : -20) + bob;
    const foot = (far ? -0.5 : 2.5) - lift;
    const toe = x + (side ? stride : (left ? -1 : 1) * stride * 0.35);
    const knee = (toe + x) * 0.5 + (side ? (fore ? (pose === "cast" ? 2.4 : 0.8) : -2) : 0);

    p(ink,
      [x - 4.6, root], [x + 4.6, root], [knee + 3.1, foot - 7.5],
      [toe + 3.6, foot - 2.2], [toe + 3.2, foot + 1.2], [toe - 3.6, foot + 1.2],
      [toe - 4.2, foot - 2.2], [knee - 3.1, foot - 7.5]);
    p(far ? coatDeep : coat,
      [x - 3.2, root + 0.6], [x + 3.2, root + 0.6], [knee + 1.8, foot - 7.5],
      [toe + 2.2, foot - 2.4], [toe - 2.5, foot - 2.4], [knee - 1.8, foot - 7.5]);
    if (!far) {
      // Silvery feathered fetlock tuft along rear of leg
      p(coatLight, [x - 2.2, root + 0.6], [x + 2.2, root + 0.6], [knee + 1.2, foot - 7.5], [toe + 0.8, foot - 3.5], [knee - 1.2, foot - 7.5]);
      p(snow, [knee - 2.5, foot - 7.5], [knee - 0.8, foot - 7.5], [toe - 1.8, foot - 3.5], [toe - 3.2, foot - 4.5]);
    }
    // Gilded sacred greave band above crystalline hoof
    r(toe - 2.6, foot - 3.4, 5.2, 1.5, far ? goldDeep : gold);
    if (!far) r(toe - 1.6, foot - 3.4, 2.2, 0.8, goldHi);
    r(toe - 2.6, foot - 1.8, 5.2, 1.9, far ? "#2d3b52" : "#446280");
    if (!far) r(toe - 1.4, foot - 1.4, 2.4, 0.9, ice);
  };

  if (side) {
    leg(-15, false, true, true);
    leg(5, true, true, false);

    // Flowing sacred silver-snow ribbon tail
    const tailFlow = [0, 1.8, 0.4, -1.4][frame] + (casting ? -2.5 : 0);
    p(ink, [-19, -22 + bob], [-25, -19 + bob + tailFlow * 0.4], [-26.5, -10 + tailFlow],
      [-23.5, -6.5 + tailFlow], [-20, -10.5 + tailFlow * 0.5], [-17, -20 + bob]);
    p(coatLight, [-19.5, -20.5 + bob], [-23.8, -17.5 + bob + tailFlow * 0.4], [-25, -10.5 + tailFlow],
      [-23, -8.2 + tailFlow], [-20.5, -12.5 + tailFlow * 0.5]);
    p(snow, [-21, -18.5 + bob], [-23.5, -16 + bob + tailFlow * 0.4], [-24.4, -10.5 + tailFlow],
      [-22.6, -9.2 + tailFlow], [-21, -13.5 + tailFlow * 0.5]);

    // Regal white-silver stag-moose torso with ceremonial glacier-blue & gold mantle
    const tilt = pose === "cast" ? -2.2 * k : bracing ? 1.5 * k : 0;
    const shY = -33.5 + bob + tilt;
    const rpY = -30 + bob - tilt * 0.4;
    p(ink,
      [-21.5, -24 + bob], [-16, rpY], [-5, rpY], [5.5, shY], [14, shY + 5],
      [15, -18 + bob + tilt * 0.5], [9, -12 + bob], [-4, -11.5 + bob], [-16.5, -13.5 + bob], [-22, -18.5 + bob]);
    p(coatDeep,
      [-20, -23.5 + bob], [-15.2, rpY + 1.5], [-5, rpY + 1.5], [5.5, shY + 1.6], [12.8, shY + 6],
      [13.4, -18.5 + bob + tilt * 0.5], [8, -13.5 + bob], [-4, -13 + bob], [-15.5, -15 + bob], [-20.5, -19 + bob]);
    p(coat,
      [-19.5, -23.5 + bob], [-15, rpY + 1.8], [-5, rpY + 1.8], [5.5, shY + 1.8], [12.4, shY + 6.2],
      [12.4, -19 + bob + tilt * 0.5], [6, -15.5 + bob], [-6, -15.5 + bob], [-15.5, -17 + bob], [-19.5, -20 + bob]);
    p(coatLight,
      [-18.5, -24 + bob], [-14.5, rpY + 2], [-4.5, rpY + 2], [5.5, shY + 2.2], [11, shY + 6.5],
      [5, -21 + bob], [-6, -21 + bob], [-15, -21 + bob]);
    p(snow,
      [-16, -25.5 + bob], [-13, rpY + 2.2], [-4, rpY + 2.2], [5, shY + 2.4], [9, shY + 5.2],
      [2, shY + 7.5], [-8, rpY + 6.2], [-14, rpY + 5]);

    // Sacred glacier-blue ceremonial blanket/mantle with golden trim & ice rune
    p(capeDeep, [-11, rpY + 3.2], [4.5, shY + 4], [7.5, -19 + bob], [1.5, -15 + bob], [-8.5, -16 + bob], [-13, -21 + bob]);
    p(cape, [-10, rpY + 3.8], [3.5, shY + 4.8], [6, -19.5 + bob], [1, -16.5 + bob], [-7.5, -17.5 + bob], [-11.5, -21.5 + bob]);
    // Golden border trim & rune emblem on mantle
    p(gold, [-11.5, -19 + bob], [-7.5, -16.2 + bob], [1.5, -15.2 + bob], [6.5, -18.5 + bob],
      [5.5, -19.6 + bob], [1, -16.8 + bob], [-7, -17.6 + bob], [-10.5, -20.2 + bob]);
    r(-4.5, -23.5 + bob, 4.2, 2.8, gold);
    r(-3.4, -22.9 + bob, 2, 1.6, casting ? "#ffffff" : iceBright);

    leg(-13, false, false, true);
    leg(7.5, true, false, false);

    // Majestic upright neck & billowing snow-white sacred mane
    const hx = sweeping ? 17 + [4.5, 6.8, 4.8, 2][frame]
      : bracing ? 14.5 - 2.2 * k
      : pose === "cast" ? 13 - 1.5 * k
      : pose === "release" ? 13.5 + [2, 1.5, 0.5, 0][frame]
      : recovering ? 15 + (1 - k) * 2
      : 15.5;
    const hy = (sweeping ? -24 - [0, 3.2, 5.2, 3.8][frame]
      : bracing ? -30 + 7.5 * k
      : pose === "cast" ? -34 - 3 * k
      : pose === "release" ? -36.5 + [2.5, 3, 2, 1][frame]
      : recovering ? -29 - 4 * k
      : -33.5) + bob;

    p(ink, [0, -32 + bob], [hx - 7.5, hy - 3], [hx + 1.5, hy + 1.5], [hx + 2, hy + 9], [12.5, -15 + bob], [4, -12 + bob], [-1.5, -17 + bob]);
    p(coatLight, [1, -30 + bob], [hx - 6.5, hy - 1.5], [hx, hy + 2], [hx, hy + 8], [11, -16.5 + bob], [4.5, -14 + bob], [0, -18 + bob]);
    // Billowing multi-tuft snow-white mane cascading down neck & chest
    const maneWave = [0, 1.2, 0, -1][frame];
    p(snow,
      [1.5, -30 + bob], [hx - 6.5, hy - 1.5], [hx - 1.5, hy + 1.5], [hx - 2.5, hy + 7.5],
      [10.5, -17.5 + bob], [9.5 + maneWave, -22 + bob], [5.5, -20.5 + bob], [4 + maneWave, -25.5 + bob]);
    // Golden ceremonial neck collar + luminous gem
    p(goldDeep, [3.5, -24 + bob], [11.5, -21 + bob], [11.5, -18.5 + bob], [3.5, -21.5 + bob]);
    p(gold, [4, -23.4 + bob], [11, -20.6 + bob], [11, -19.2 + bob], [4, -22 + bob]);
    r(9.2, -21 + bob, 2.2, 2.2, casting ? "#ffffff" : iceBright);

    // Floating sacred winter halo behind crown!
    const haloFlare = pose === "cast" ? k * 1.4 : pose === "release" ? rev * 2.0 : (frame % 2 === 0 ? 0.35 : 0);
    drawHalo(hx - 4.5, hy - 9.5, 5.2, haloFlare);

    const head: Shape = (color, ...pts) => p(color, ...pts.map(([x, y]): Point => [hx + x, hy + y]));
    // Sweeping towering crystalline antlers (far & near)
    const antler = (u: number, main: string, bright: string) => {
      head(ink,
        [0 + u, -2], [-5 + u, -6], [-11 + u, -7], [-16 + u, -12], [-18 + u, -16],
        [-14 + u, -16], [-10 + u, -12], [-9 + u, -16.5], [-6 + u, -15.5], [-5.5 + u, -10.5],
        [-2 + u, -8], [-1.5 + u, -14.5], [1.5 + u, -13.5], [2 + u, -8], [4.5 + u, -11], [6.5 + u, -9.5],
        [4 + u, -4.5], [3 + u, -1.5]);
      head(main,
        [0.5 + u, -2.5], [-4.5 + u, -6.5], [-10 + u, -7.5], [-14.5 + u, -12], [-16.2 + u, -14.8],
        [-13.5 + u, -14.5], [-9.5 + u, -11], [-8 + u, -15], [-6.5 + u, -14.2], [-6 + u, -9.5],
        [-1.8 + u, -7], [-0.8 + u, -13], [1 + u, -12], [1.5 + u, -7], [4 + u, -9.5], [5 + u, -8.8],
        [3 + u, -4], [2.2 + u, -2]);
      head(bright,
        [-15.5 + u, -14.5], [-10.5 + u, -11.5], [-8 + u, -14.5], [-7 + u, -10.5],
        [-1 + u, -12.5], [1 + u, -8], [-4 + u, -7.5], [-11 + u, -8.5]);
    };
    antler(-3.5, iceDeep, ice);
    antler(1.5, ice, iceBright);
    if (casting || sweeping) {
      r(hx - 15.5, hy - 15, 1.8, 1.8, "#ffffff");
      r(hx - 7.5, hy - 15.5, 1.6, 1.6, goldHi);
      r(hx + 1, hy - 13.5, 1.8, 1.8, "#ffffff");
    }

    // Sculpted noble stag-moose head with gilded brow diadem & serene luminous eye
    head(ink, [-8.5, 0], [-7.5, -4], [-2.5, -4], [2, -7], [6.5, -4.5], [7, -1], [10.5, 1], [11.5, 4.5], [9.5, 8.5], [4, 9.5], [-2.5, 5.5], [-5.5, 7]);
    head(coatLight, [-7, 0], [-2.5, -2.5], [2, -5.2], [5.5, -3.5], [5.8, -0.2], [9, 1.8], [10, 4.5], [8.5, 6.8], [4, 7.6], [-1.5, 4.5], [-4.5, 5.2]);
    head(snow, [-2, -2.5], [2, -5], [5.5, -3.5], [5.8, 0], [8.8, 1.8], [5, 2.6], [2, 1.4], [-1.5, 1.4]);
    head(coatDeep, [6, 3.4], [9.5, 3.4], [10.2, 4.8], [8.5, 6.8], [4.5, 7.2]);
    // Sacred golden brow diadem & jewel
    head(gold, [0, -5], [4.5, -4.5], [5.5, -2.5], [1.5, -3]);
    r(hx + 3.5, hy - 4.4, 1.5, 1.3, goldHi);
    // Serene luminous eye
    r(hx + 2.8, hy - 0.5, 2.5, 1.8, ink);
    r(hx + 3.7, hy - 0.3, 1.3, 1.2, eye);

    // Sacred frost-gold hoof impact burst on release slam
    if (pose === "release" && frame <= 1) {
      p(iceBright, [1, 2], [6, -2.5], [10.5, 1], [14.5, -2], [17.5, 3], [11.5, 4.2], [5, 4]);
      r(8, -0.5, 3, 1.5, goldHi);
    }
    return;
  }

  // Front (south) & Rear (north) — majestic symmetrical sacred winter sovereign
  leg(-7, rear, true, true);
  leg(7, rear, true, false);

  const tilt = pose === "cast" ? -2 * k : 0;
  p(ink,
    [-16.5, -18 + bob], [-15.5, -29.5 + bob + tilt], [-9, -34.5 + bob + tilt], [9, -34.5 + bob + tilt],
    [15.5, -29.5 + bob + tilt], [16.5, -18 + bob], [11, -11.5 + bob], [0, -8.5 + bob], [-11, -11.5 + bob]);
  p(coatDeep,
    [-14.8, -18.5 + bob], [-13.8, -28.5 + bob + tilt], [-8, -32.8 + bob + tilt], [8, -32.8 + bob + tilt],
    [13.8, -28.5 + bob + tilt], [14.8, -18.5 + bob], [10, -13.2 + bob], [0, -10.5 + bob], [-10, -13.2 + bob]);
  p(coat,
    [-13.8, -20 + bob], [-12.5, -28.5 + bob + tilt], [-7, -32.2 + bob + tilt], [7, -32.2 + bob + tilt],
    [12.5, -28.5 + bob + tilt], [13.8, -20 + bob], [9, -15 + bob], [0, -12.5 + bob], [-9, -15 + bob]);
  // Ceremonial glacier-blue mantle over shoulders + golden sash + billowing snow chest mane
  p(cape, [-13, -23 + bob], [-11, -29 + bob + tilt], [-6, -32 + bob + tilt], [6, -32 + bob + tilt],
    [11, -29 + bob + tilt], [13, -23 + bob], [8, -19 + bob], [0, -21 + bob], [-8, -19 + bob]);
  p(gold, [-12, -21 + bob], [-7, -18 + bob], [0, -19.5 + bob], [7, -18 + bob], [12, -21 + bob],
    [11, -22.2 + bob], [7, -19.4 + bob], [0, -20.8 + bob], [-7, -19.4 + bob], [-11, -22.2 + bob]);
  if (!rear) {
    p(snow, [-9, -25 + bob], [-5, -31 + bob + tilt], [5, -31 + bob + tilt], [9, -25 + bob],
      [6, -15 + bob], [0, -12 + bob], [-6, -15 + bob]);
    p(gold, [-2.5, -21.5 + bob], [2.5, -21.5 + bob], [1.5, -18 + bob], [-1.5, -18 + bob]);
    r(-1.1, -20.8 + bob, 2.2, 1.8, casting ? "#ffffff" : iceBright);
  } else {
    p(coatLight, [-10, -24 + bob], [-6, -31 + bob + tilt], [6, -31 + bob + tilt], [10, -24 + bob], [6, -18 + bob], [-6, -18 + bob]);
  }

  leg(-10, !rear, false, true);
  leg(10, !rear, false, false);

  const hy = (sweeping ? -25 - [0, 2.5, 4, 3][frame]
    : bracing ? -31 + 6 * k
    : pose === "cast" ? -34.5 - 3 * k
    : pose === "release" ? -37 + [2.5, 3, 2, 1][frame]
    : recovering ? -29 - 4 * k
    : -33.5) + bob;

  // Floating celestial winter halo dead-center between the soaring antlers!
  const haloFlare = pose === "cast" ? k * 1.5 : pose === "release" ? rev * 2.1 : (frame % 2 === 0 ? 0.35 : 0);
  drawHalo(0, hy - 10, 6.2, haloFlare);

  // Towering symmetrical palmate crystalline antlers
  for (const dir of [-1, 1]) {
    const spread = sweeping
      ? (dir < 0 ? 1.24 : 0.86)
      : pose === "release" ? 1.16 + rev * 0.08
      : pose === "cast" ? 1.05 + k * 0.1
      : 1;
    const branch: Shape = (color, ...pts) => p(color, ...pts.map(([x, y]): Point => [dir * x * spread, hy + y]));
    branch(ink,
      [4, 0], [5, -5.5], [9, -9], [14.5, -10.5], [17.5, -15], [20.5, -16], [21.5, -11.5],
      [18.5, -7], [23.5, -8.5], [24, -4.5], [17.5, -2.5], [13, -3.5], [10.5, 1], [7, 4]);
    branch(ice,
      [5, -1], [6, -4.5], [9.8, -8], [15, -9.2], [18, -13.5], [19.5, -14], [19.8, -11],
      [17, -6], [22, -7], [22.2, -5], [17, -3.5], [12.5, -4.5], [9.5, 0], [7, 2.2]);
    branch(iceBright,
      [10, -8], [15, -9.2], [18, -13.5], [19, -11], [15.5, -7], [11.5, -6.5]);
    if (casting || sweeping) {
      r(dir * 19.5 * spread - 0.8, hy - 15.2, 1.7, 1.7, "#ffffff");
      r(dir * 22.8 * spread - 0.8, hy - 7.5, 1.5, 1.5, goldHi);
    }
  }

  // Symmetrical sacred head with golden brow diadem & serene luminous eyes
  const head: Shape = (color, ...pts) => p(color, ...pts.map(([x, y]): Point => [x, hy + y]));
  head(ink, [-12.5, -2], [-8.5, -4.5], [-5.5, -7.5], [5.5, -7.5], [8.5, -4.5], [12.5, -2],
    [10.5, 2.2], [7.2, 3.2], [6.2, 10.5], [0, 13.5], [-6.2, 10.5], [-7.2, 3.2], [-10.5, 2.2]);
  head(rear ? coat : coatLight,
    [-10.2, -2], [-6.5, -3.2], [-4.2, -5.5], [4.2, -5.5], [6.5, -3.2], [10.2, -2],
    [8.2, 1.2], [5.2, 2.2], [4.4, 9.2], [0, 11.4], [-4.4, 9.2], [-5.2, 2.2], [-8.2, 1.2]);
  head(snow, [-5.2, -1], [-3.2, -5.2], [3.2, -5.2], [5.2, -1], [3.2, 3.5], [0, 5.5], [-3.2, 3.5]);

  if (rear) {
    // Flowing sacred silver-snow tail centered on rump
    const wag = [0, 1.8, 0, -1.8][frame];
    p(ink, [-3.2, -18 + bob], [3.2, -18 + bob], [4 + wag, -8.5 + bob], [wag, -5.5 + bob], [-4 + wag, -8.5 + bob]);
    p(snow, [-1.8, -16.8 + bob], [1.8, -16.8 + bob], [2.4 + wag, -9 + bob], [wag, -7 + bob], [-2.4 + wag, -9 + bob]);
  } else {
    // Ornate golden sovereign diadem with glowing central winter gem
    head(gold, [-4.5, -4.8], [0, -7.2], [4.5, -4.8], [3.5, -3.2], [0, -4.6], [-3.5, -3.2]);
    r(-1.2, hy - 6, 2.4, 2, casting ? "#ffffff" : iceBright);
    r(-5.8, hy + 0.8, 2.4, 2.1, ink);
    r(3.4, hy + 0.8, 2.4, 2.1, ink);
    r(-5.2, hy + 1.1, 1.4, 1.4, eye);
    r(3.8, hy + 1.1, 1.4, 1.4, eye);
    head(coatDeep, [-3.2, 7.2], [3.2, 7.2], [4.2, 9.4], [0, 11.2], [-4.2, 9.4]);
  }

  if (pose === "release" && frame <= 1) {
    p(iceBright, [-15, 2], [-10, -2], [-5, 3], [5, 3], [10, -2], [15, 2], [10, 4.5], [-10, 4.5]);
  }
}

const towerIceCracks = [
  [-8, -11, -2, -9, 5, -14],
  [5, -22, 1.5, -15, 5, -11],
  [4, -12, -1, -5, 9, -2],
] as const;

const towerIceSpurs = [
  [-6, -4, -3, -8, -1, -13],
  [2, -18, -3, -15, -7, -17],
] as const;

/**
 * Animated faceted glacier-crystal encasement for frozen towers:
 * - Grows rapidly upward from the base over 0.34s after `frozenAt` with a sweeping frost sheen;
 * - Shakes & flashes crisply on each tap (`lastTap`), revealing progressive fracture webs (`taps = 1..3`);
 * - Pulses subtly with warm inner light at 3 taps to signal 1 final tap shatters the ice.
 */
export function drawFrozenTower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frost: NonNullable<Tower["frost"]>,
  time: number,
  reducedMotion = false,
) {
  const { taps, frozenAt, lastTap } = frost;
  const age = Math.max(0, time - frozenAt);
  const grow = reducedMotion ? 1 : Math.min(1, age / 0.34);
  const ease = 1 - (1 - grow) ** 3;
  const tapAge = time - lastTap;
  const shake = !reducedMotion && tapAge >= 0 && tapAge < 0.16
    ? Math.sin(tapAge * 95) * (1 - tapAge / 0.16) * 2.1
    : 0;
  const flash = tapAge >= 0 && tapAge < 0.12 ? 1 - tapAge / 0.12 : 0;

  ctx.save();
  ctx.translate(x + shake, y);
  // Rise cleanly from the plot base during freeze-in!
  const scaleY = 0.12 + 0.88 * ease;
  const scaleX = 0.84 + 0.16 * ease + (grow < 1 ? Math.sin(grow * Math.PI) * 0.06 : 0);
  ctx.scale(scaleX, scaleY);

  // Frosted snow-rim collar anchoring the ice prism to the plot
  landShape(ctx, [[-12, 2], [-10, -2], [0, -3], [10, -2], [12, 2], [7, 5], [-7, 5]], "#d8f8ff68");
  landShape(ctx, [[-9, 3], [-6, 0], [6, 0], [9, 3], [4, 5], [-4, 5]], "#f2fdff85");

  // Main multi-faceted hexagonal glacier crystal shell
  landShape(ctx, [
    [-10.5, 1.5], [-12, -5.5], [-8.5, -13], [-5, -23], [2.5, -25.5],
    [9.5, -17], [9, -10.5], [12.5, -5], [10.5, 2], [3.5, 4.5], [-6, 3.8],
  ], "#4ca4cc80");
  // Luminous left crystal facet
  landShape(ctx, [
    [-9.5, -4.5], [-8, -12.5], [-4.8, -22.5], [2.5, -25], [4.5, -19.5],
    [0.5, -11], [-4.5, -6.5], [-6.5, 1.5],
  ], "#c4f4ff94");
  // Deep sapphire right shadow facet
  landShape(ctx, [
    [2.5, -24.5], [9, -16.8], [8.5, -10.5], [12, -5], [10, 2],
    [3.5, 4.2], [5.8, -3.5], [3.8, -9.5], [6, -16.5],
  ], "#3d7aa8a8");
  // Inner icy crown highlight prism
  landShape(ctx, [[-4.2, -21.5], [2, -24.2], [3.5, -17.5], [-2, -14.5]], "#ecfdff80");

  // Crisp crystal bevel edge highlights
  linePixels(ctx, -4.8, -23, 2.5, -25.5, "#f0fdff", .65, 1.1);
  linePixels(ctx, 2.5, -25.5, 9.5, -17, "#cbf6ff", .65, .95);
  linePixels(ctx, -12, -5.5, -8.5, -13, "#b2ecff", .65, .9);
  linePixels(ctx, -8.5, -13, -4.8, -23, "#e4fbff", .65, .95);

  // Sweeping upward crystallization sheen during freeze-in (0..0.38s)
  if (!reducedMotion && age < 0.42) {
    const sweepY = 2 - (age / 0.42) * 26;
    ctx.globalAlpha = Math.sin((age / 0.42) * Math.PI) * 0.85;
    box(ctx, -9, sweepY, 18, 2.2, "#ffffff");
    box(ctx, -7, sweepY + 2.2, 14, 1.5, "#b9f4ff");
    ctx.globalAlpha = 1;
  }

  // Progressive fracture network (1..3 taps)
  for (let i = 0; i < Math.min(taps, towerIceCracks.length); i++) {
    const [sx, sy, mx, my, ex, ey] = towerIceCracks[i];
    linePixels(ctx, sx, sy, mx, my, "#164d6d", .65, 1.35);
    linePixels(ctx, mx, my, ex, ey, "#f4fdff", .65, .95);
  }
  if (taps >= 2) {
    const [sx, sy, mx, my, ex, ey] = towerIceSpurs[0];
    linePixels(ctx, sx, sy, mx, my, "#1b597b", .65, 1.1);
    linePixels(ctx, mx, my, ex, ey, "#e8fbff", .65, .8);
  }
  if (taps >= 3) {
    const [sx, sy, mx, my, ex, ey] = towerIceSpurs[1];
    linePixels(ctx, sx, sy, mx, my, "#164d6d", .65, 1.2);
    linePixels(ctx, mx, my, ex, ey, "#ffffff", .65, .9);
    // Warm golden inner pulse warning that 1 final tap shatters the prison!
    const pulse = reducedMotion ? 0.55 : 0.4 + 0.4 * Math.sin(time * 12);
    ctx.globalAlpha = pulse;
    diamond(ctx, 0, -11, 3.2, "#fff1b8");
    ctx.globalAlpha = 1;
  }

  // Brief bright fracture flash right after tapping
  if (flash > 0) {
    ctx.globalAlpha = flash * 0.65;
    landShape(ctx, [[-8, -12], [-4, -22], [2, -24], [8, -16], [8, -4], [-7, -2]], "#ffffff");
    ctx.globalAlpha = 1;
  }

  // Subtle living crystal glints
  const glintPhase = reducedMotion ? 0 : Math.sin(time * 3.5 + x * 0.2);
  if (glintPhase > -0.2) diamond(ctx, -7.5, -13.5, 1.15, "#eaffff");
  if (glintPhase < 0.4) diamond(ctx, 4.5, -20.5, 1.0, "#ffffff");
  ctx.restore();
}

/**
 * Sacred non-laser frost-domain target telegraph on nearby towers during Moose King's cast windup:
 * rotating 6-point winter rune circle + creeping crystalline spikes sprouting around the base.
 */
export function drawFreezeMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  time = 0,
) {
  const ease = Math.min(1, Math.max(0, progress));
  ctx.save();
  // Ground frost-rune circle tightening onto the tower
  ctx.globalAlpha = 0.35 + 0.55 * ease;
  pixelRing(ctx, x, y + 1, 13 - 2.2 * ease, 16, "#469ec2", 1.2);
  pixelRing(ctx, x, y + 1, 5.5 + 5.5 * ease, 12, "#d4fbff", 1.0);

  // 6 rotating sacred frost-gold rune nodes around the plot
  const spin = time * 1.8 + ease * 1.4;
  for (let i = 0; i < 6; i++) {
    const a = spin + (i * Math.PI) / 3;
    const rx = x + Math.cos(a) * (12.2 - 1.5 * ease);
    const ry = y + 1 + Math.sin(a) * (9.2 - 1.2 * ease);
    diamond(ctx, rx, ry, i % 2 === 0 ? 1.4 : 1.05, i % 2 === 0 ? "#fff3ba" : "#d6fbff");
  }

  // Creeping ice spikes growing up from the tower base as freeze approaches
  const spikeH = 3 + ease * 10;
  ctx.globalAlpha = 0.45 + 0.45 * ease;
  for (const [ox, hScale] of [[-7.5, 0.78], [0, 1.0], [7.5, 0.82]] as const) {
    const h = spikeH * hScale;
    landShape(ctx, [[x + ox - 2.4, y + 2], [x + ox, y + 2 - h], [x + ox + 2.4, y + 2]], "#9ceeff99");
    linePixels(ctx, x + ox, y + 2 - h, x + ox, y + 1, "#f2ffff", .65, .85);
  }

  // Converging floating frost star above tower
  ctx.globalAlpha = 0.65 + 0.35 * ease;
  diamond(ctx, x, y - 20 + ease * 3, 1.5 + ease * 1.4, "#ffffff");
  diamond(ctx, x, y - 20 + ease * 3, 2.3 + ease * 1.6, "#9ceeff70");
  ctx.restore();
}
