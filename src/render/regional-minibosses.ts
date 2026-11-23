import type { Facing } from "../engine/formation.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

function at(p: Shape, x: number, y: number, mirror = 1): Shape {
  return (color, ...points) => p(color, ...points.map(([dx, dy]): [number, number] => [x + dx * mirror, y + dy]));
}

/**
 * 03 林缘岗哨 · 松鬃巨豕 (Pine-Mane Boar)
 * Heavy timber-brown tusked boar with layered mossy pine-needle mane, curved twin tusks, and muscular shoulders.
 */
export function paintPineBoar(
  r: Rect, p: Shape, frame: number, facing: Facing,
  active: boolean, enraged: boolean,
) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const stride = [1.5, 0, -1.5, 0][frame];
  const bob = frame % 2 ? -0.75 : 0;
  const lift = (active ? -2 : 0) + bob;
  const ink = "#241b18";
  const hideDark = "#473228", hide = "#664838", mid = "#87634b", hi = "#b08764";
  const maneDark = enraged ? "#b85f32" : active ? "#9c8743" : "#355437";
  const mane = enraged ? "#e89c4a" : active ? "#d4be68" : "#537c4d";
  const maneHi = enraged ? "#ffe69e" : active ? "#f8eba3" : "#8eb56c";

  // Curled bristle tail on the rear
  if (side) {
    p(ink, [-21, -18 + lift], [-26, -22 + lift], [-28, -19 + lift], [-25, -14 + lift], [-20, -14 + lift]);
    p(hide, [-21, -17 + lift], [-25, -20.5 + lift], [-26, -18.5 + lift], [-24, -15.5 + lift]);
  }

  // Far legs
  for (const offset of side ? [-14, 7] : [-12, 8]) {
    const step = offset < 0 ? -stride : stride;
    p(ink, [offset - 3.5, -12], [offset + 3.5, -12], [offset + 4, 2 + step], [offset - 3.5, 2 + step]);
    r(offset - 2, -11, 4.5, 11 + step, hideDark);
    r(offset - 2.5, -0.5 + step, 5, 2, "#2f2420");
  }

  // Main barrel torso with broad hunched shoulders
  p(ink, [-22, -11 + lift], [-21, -24 + lift], [-13, -31 + lift], [2, -33 + lift], [14, -31 + lift],
    [21, -23 + lift], [22, -11 + lift], [15, -4 + lift], [-16, -4 + lift]);
  p(hideDark, [-20, -11 + lift], [-19, -23 + lift], [-12, -29 + lift], [2, -31 + lift], [13, -29 + lift],
    [19, -22 + lift], [20, -11 + lift], [14, -6 + lift], [-15, -6 + lift]);
  p(hide, [-19, -15 + lift], [-17, -23 + lift], [-10, -28 + lift], [2, -30 + lift], [12, -28 + lift],
    [18, -21 + lift], [18, -13 + lift], [10, -8 + lift], [-13, -8 + lift]);
  p(mid, [-16, -18 + lift], [-13, -25 + lift], [-5, -28.5 + lift], [6, -29 + lift], [14, -24 + lift],
    [15, -17 + lift], [6, -13 + lift], [-10, -13 + lift]);
  p(hi, [-10, -24 + lift], [-2, -27.5 + lift], [8, -27 + lift], [12, -22 + lift], [4, -21 + lift], [-7, -21 + lift]);
  // Fur tufts along flank
  for (const [fx, fy] of [[-12, -14], [-4, -15], [4, -14], [-8, -19]]) r(fx, fy + lift, 3, 1, hideDark);

  // Near muscular legs
  for (const offset of side ? [-10, 12] : [-9, 5]) {
    const step = offset < 0 ? stride : -stride;
    p(ink, [offset - 4, -13], [offset + 4, -13], [offset + 4.5, 2.5 + step], [offset - 3.5, 2.5 + step]);
    r(offset - 2.5, -12, 5.5, 12 + step, hide);
    r(offset - 2, -11, 2.5, 8 + step, mid);
    r(offset - 2.5, 0 + step, 5.5, 2, "#352824");
    r(offset - 1.5, 0.25 + step, 2, 1, "#6e5c53");
  }

  // Layered spiky pine-needle dorsal mane (ripples with stride frame & bristles when rallying/enraged)
  const spikeLift = (active || enraged ? 3.5 : 0);
  for (let i = -3; i <= 2; i++) {
    const sx = i * 5.2 - 1;
    const wave = ((frame + i + 4) % 4 === 1 ? 1.2 : (frame + i + 4) % 4 === 3 ? -0.6 : 0);
    const h = (i === 0 || i === 1 ? 11.5 : 9.5) + spikeLift + wave;
    p(ink, [sx - 3.5, -27 + lift], [sx + 1, -28 - h + lift], [sx + 5.5, -27 + lift]);
    p(maneDark, [sx - 2, -27 + lift], [sx + 1, -27 - h + 1.5 + lift], [sx + 4, -27 + lift]);
    p(mane, [sx - 1.5, -27.5 + lift], [sx + 0.5, -27 - h + 2 + lift], [sx + 2.5, -27.5 + lift]);
    r(sx, -27 - h + 3 + lift, 1.5, 4.5, maneHi);
  }
  // Mossy shoulder collar tuft
  if (side) {
    p(maneDark, [7, -23 + lift], [15, -21 + lift], [13, -15 + lift], [6, -17 + lift]);
    p(mane, [8.5, -22 + lift], [13.5, -20.5 + lift], [12, -17 + lift], [7.5, -18.5 + lift]);
  }

  // Sculpted head, pointed ear (twitches on frame 1), angry brow, and curved twin tusks
  if (!rear) {
    const hx = side ? 17 : 0;
    const hy = (active ? -18.5 : -14.5) + lift;
    const earTwitch = frame === 1 ? -1.2 : 0;
    // Ear
    p(ink, [hx - 7, hy - 9], [hx - 10 + earTwitch, hy - 16 + earTwitch * .5], [hx - 3, hy - 14], [hx - 2, hy - 8]);
    p(mid, [hx - 6.5, hy - 9.5], [hx - 8.5 + earTwitch, hy - 14 + earTwitch * .5], [hx - 4, hy - 12.5], [hx - 3.5, hy - 9]);
    // Head
    p(ink, [hx - 9, hy - 10.5], [hx + 6, hy - 11], [hx + 13, hy - 4], [hx + 13, hy + 6],
      [hx + 4, hy + 9.5], [hx - 8, hy + 8.5]);
    p(hide, [hx - 7.5, hy - 9], [hx + 5, hy - 9.5], [hx + 11, hy - 3.5], [hx + 11, hy + 4.5], [hx + 3, hy + 7.5], [hx - 6.5, hy + 6.5]);
    p(mid, [hx - 6, hy - 8.5], [hx + 4, hy - 9], [hx + 9, hy - 4], [hx + 7, hy + 2], [hx - 5, hy + 1]);
    // Snout plate & nostrils
    p(ink, [hx + 7, hy - 4], [hx + 14, hy - 3], [hx + 14, hy + 5], [hx + 7, hy + 5]);
    r(hx + 8, hy - 2.5, 4.5, 6, "#9c6d5c");
    r(hx + 8.5, hy - 2, 2, 2, "#c2927c");
    r(hx + 10.5, hy - 1, 1.5, 2, "#2f1e1c");
    // Brow & glowing eye
    r(hx - 1, hy - 7.5, 6, 1.75, hideDark);
    r(hx + 1, hy - 5.5, 3, 2.5, enraged || active ? "#ffd966" : "#1f1816");
    r(hx + 1.5, hy - 5.25, 1, 1, enraged || active ? "#fffdf0" : "#d9a97c");
    // Curved ivory tusks with specular glint
    p(ink, [hx + 4, hy + 4.5], [hx + 14.5, hy + 3], [hx + 18, hy - 5.5], [hx + 13.5, hy - 3.5], [hx + 11, hy + 0.5], [hx + 6, hy + 1]);
    p("#e6d5b2", [hx + 5.5, hy + 3.5], [hx + 13.5, hy + 2], [hx + 16.5, hy - 4], [hx + 13.5, hy - 2], [hx + 11, hy + 1.5], [hx + 6, hy + 1.75]);
    r(hx + 13, hy - 3, 1.75, 2.5, "#fffef2");
    if (frame % 2 === 0 || enraged) r(hx + 15, hy - 4.5, 1.25, 1.25, "#ffffff");
  }
}

/**
 * 05 苔岸河湾 · 莲冠巨蟾 (Lotus-Crown Toad)
 * Plump marsh-green giant toad with webbed feet, mottled amphibious skin, blooming multi-petal lotus crown,
 * and luminous cyan-gold vocal sac when casting its shield.
 */
export function paintLotusToad(
  r: Rect, p: Shape, frame: number, facing: Facing,
  active: boolean,
) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const hop = [0, -1.5, -3, -1][frame];
  const ink = "#182b23";
  const deep = "#254a3b", dark = "#35664d", body = "#518a62", hi = "#82b87d", belly = "#d2e8ba";

  // Broad webbed hind & fore feet
  for (const offset of side ? [-15, 11] : [-14, 9]) {
    p(ink, [offset - 7, -5.5], [offset + 8, -5.5], [offset + 11, 2], [offset - 8, 2]);
    p(deep, [offset - 5.5, -4], [offset + 6.5, -4], [offset + 9, 0.75], [offset - 6.5, 0.75]);
    for (let toe = -1; toe <= 1; toe++) r(offset + toe * 4, -1.5, 2.25, 1.5, hi);
  }

  // Squat muscular toad silhouette
  p(ink, [-23, -6 + hop], [-21, -21 + hop], [-12, -29.5 + hop], [10, -29.5 + hop],
    [21, -20 + hop], [23, -6 + hop], [15, 0.5 + hop], [-17, 0.5 + hop]);
  p(deep, [-21, -7 + hop], [-19, -19.5 + hop], [-11, -27.5 + hop], [9, -27.5 + hop],
    [19, -19 + hop], [21, -7 + hop], [14, -1.5 + hop], [-15, -1.5 + hop]);
  p(dark, [-19.5, -9 + hop], [-17.5, -20 + hop], [-10, -26.5 + hop], [9, -26.5 + hop],
    [18, -18.5 + hop], [19, -9 + hop], [11, -4 + hop], [-13, -4 + hop]);
  p(body, [-17, -12 + hop], [-15, -21 + hop], [-8, -25.5 + hop], [8, -25.5 + hop],
    [16, -18 + hop], [16, -11 + hop], [7, -7 + hop], [-10, -7 + hop]);
  p(hi, [-12, -20 + hop], [-4, -24.5 + hop], [6, -24 + hop], [12, -18 + hop], [4, -17 + hop], [-8, -17 + hop]);

  // Folded haunch & amphibious mottling
  p(deep, [-18, -13 + hop], [-11, -16 + hop], [-7, -9 + hop], [-15, -6 + hop]);
  p(body, [-16.5, -12.5 + hop], [-11.5, -14.5 + hop], [-9, -9.5 + hop], [-14.5, -7.5 + hop]);
  for (const [wx, wy, w] of [[-12, -16, 3.5], [-3, -19, 3.5], [5, -15, 3], [-6, -12, 2.5], [1, -11, 2.5]] as const) {
    r(wx, wy + hop, w, 2, deep);
    r(wx + .5, wy + .25 + hop, w - 1, 1.25, "#9fd18c");
  }

  // Swelling luminous vocal sac (subtle breath pulse when idle, full glow when casting) + bulging golden eyes
  if (!rear) {
    const sx = side ? 13.5 : 0;
    const breath = frame === 1 || frame === 2 ? 1.1 : 0;
    const swell = (active ? 4.8 : 0) + breath;
    p(ink, [sx - 7 - swell * .35, -10.5 + hop], [sx + 9.5 + swell, -10.5 + hop],
      [sx + 11 + swell, -0.5 + swell * .45 + hop], [sx - 6 - swell * .35, -0.5 + swell * .45 + hop]);
    p(active ? "#7cead9" : belly, [sx - 5.5 - swell * .25, -9 + hop], [sx + 8 + swell * .85, -9 + hop],
      [sx + 9 + swell * .85, -2 + swell * .35 + hop], [sx - 4.5 - swell * .25, -2 + swell * .35 + hop]);
    if (active) {
      r(sx - 1, -8 + hop, 7 + swell * .4, 3, "#eafffc");
      r(sx + 1, -4.5 + hop, 5, 1, "#b4fff3");
    } else {
      r(sx - 2, -8 + hop, 6 + breath * .5, 1.5, "#eef8df");
    }

    // Wide frog mouth line
    r(sx - 5, -12.5 + hop, 14, 1.25, ink);

    // Bulging crowned eyes
    for (const ex of side ? [5, 14.5] : [-9.5, 7.5]) {
      p(ink, [ex - 3.5, -28 + hop], [ex + 3.5, -28 + hop], [ex + 4.5, -21 + hop], [ex - 4.5, -21 + hop]);
      r(ex - 2.5, -26.5 + hop, 5, 4, active ? "#fff199" : "#f7dc7e");
      r(ex - 2, -26 + hop, 2, 1.5, "#fff8cf");
      r(ex + .25, -25 + hop, 1.75, 2.25, "#1f1b18");
    }
  }

  // Multi-layered blooming water-lily crown + green lily-pad collar (petals sway gently with hop)
  const ly = -28.5 + hop;
  const sway = [0, 0.8, 0, -0.8][frame];
  p(ink, [-15, ly + 2], [-11, ly - 1], [11, ly - 1], [15, ly + 2], [9, ly + 4.5], [-9, ly + 4.5]);
  p("#4a8a59", [-13, ly + 1.5], [-9, ly], [9, ly], [13, ly + 1.5], [8, ly + 3.25], [-8, ly + 3.25]);
  p(ink, [-12, ly + 1], [-9 + sway, ly - 6], [-3 + sway * .5, ly - 10.5], [3 + sway * .5, ly - 10.5], [9 + sway, ly - 6], [12, ly + 1], [6, ly + 3], [-6, ly + 3]);
  p("#cc6a93", [-10.5, ly], [-7.5 + sway, ly - 5], [sway * .5, ly - 8.5], [7.5 + sway, ly - 5], [10.5, ly], [5, ly + 2], [-5, ly + 2]);
  p("#f09fc0", [-7.5, ly - 0.5], [-4 + sway, ly - 6.5], [sway * .5, ly - 8.5], [4 + sway, ly - 6.5], [7.5, ly - 0.5], [3, ly + 1.25], [-3, ly + 1.25]);
  p("#ffe0ee", [-4, ly - 1], [-1.5 + sway * .5, ly - 5.5], [1.5 + sway * .5, ly - 5.5], [4, ly - 1], [1.5, ly + 0.5], [-1.5, ly + 0.5]);
  r(-2 + sway * .5, ly - 3.5, 4, 2.5, "#ffe074");
  r(-1 + sway * .5, ly - 3.25, 2, 1, active || frame % 2 === 0 ? "#ffffff" : "#fffbe0");
}

/**
 * 07 弃采矿道 · 熔心钻机 (Slag-Core Driller)
 * Heavy ochre-iron mining crawler with geared treads, riveted boiler hull, brass pipes,
 * glowing slag furnace grille, and a 4-frame rotating conical steel drill.
 */
export function paintSlagDriller(
  r: Rect, p: Shape, frame: number, facing: Facing,
  venting: boolean,
) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const rumble = frame % 2 ? -0.5 : 0;
  const ink = "#221d20";
  const ironDark = "#383c42", iron = "#545b63", steel = "#839099", steelHi = "#c4d1d6";
  const rustDark = "#6e3b2b", rust = "#99553b", rustHi = "#cf8157", brass = "#d9ad68";
  const core = venting ? "#fff9c2" : "#ff9b52";
  const coreGlow = venting ? "#ffaa44" : "#c74e2e";

  // Heavy geared iron treads
  p(ink, [-22.5, -8.5], [20.5, -8.5], [23, -2], [19.5, 3.5], [-19.5, 3.5], [-23, -2]);
  p(ironDark, [-20.5, -6.5], [18.5, -6.5], [20, -2], [17.5, 1.5], [-17.5, 1.5], [-20, -2]);
  const treadShift = (frame % 2) * 2.5;
  for (let x = -18 + treadShift; x <= 15; x += 6) {
    r(x, -5.5, 3.5, 5.5, "#6b7075");
    r(x + .5, -5, 2, 2, "#a5adb0");
  }
  // Drive wheels
  for (const wx of [-15, 0, 14]) {
    r(wx - 2, -4.5, 4, 4, ink);
    r(wx - 1, -3.5, 2, 2, brass);
  }

  // Riveted ochre boiler hull
  p(ink, [-20.5, -8 + rumble], [-19.5, -26.5 + rumble], [-12, -34 + rumble], [11.5, -34 + rumble], [19.5, -24.5 + rumble], [19.5, -8 + rumble]);
  p(rustDark, [-18.5, -9 + rumble], [-17.5, -25.5 + rumble], [-11, -32 + rumble], [10.5, -32 + rumble], [17.5, -23.5 + rumble], [17.5, -9 + rumble]);
  p(rust, [-17, -11 + rumble], [-16, -24.5 + rumble], [-9.5, -31 + rumble], [9.5, -31 + rumble], [16, -23 + rumble], [16, -11 + rumble]);
  p(rustHi, [-14, -24 + rumble], [-8.5, -29.5 + rumble], [8, -29.5 + rumble], [14, -23 + rumble], [9.5, -20 + rumble], [-11.5, -20 + rumble]);
  // Iron ribs & brass pressure pipe
  for (const rx of [-12.5, -1, 10]) {
    r(rx, -31 + rumble, 3, 21.5, iron);
    r(rx + .5, -30 + rumble, 1.25, 19.5, steel);
    r(rx + .75, -28 + rumble, 1, 1, steelHi);
    r(rx + .75, -14 + rumble, 1, 1, steelHi);
  }
  r(-15, -26 + rumble, 29, 1.75, brass);
  r(-14, -26 + rumble, 27, .75, "#f5dc9f");

  // Twin exhaust smokestacks & warning beacon on roof
  p(ink, [-15, -33 + rumble], [-15, -43 + rumble], [-6, -43 + rumble], [-6, -33 + rumble]);
  r(-13.5, -41.5 + rumble, 6, 8, iron);
  r(-12.5, -41.5 + rumble, 2.25, 8, steel);
  r(-14, -42.5 + rumble, 7, 1.5, brass);
  if (venting) {
    r(-13, -45 + rumble, 5, 2.5, "#ffbd6b");
    r(-11.5, -46 + rumble, 2.5, 1.5, "#fff8cf");
  }
  // Warning lantern on top right (pulses on alternating frames)
  p(ink, [3, -33 + rumble], [3, -39 + rumble], [9, -39 + rumble], [9, -33 + rumble]);
  r(4.25, -37.5 + rumble, 3.5, 3.5, venting ? "#fff5b0" : frame % 2 ? "#ffb85c" : "#d97036");
  if (venting || frame % 2) r(5, -37 + rumble, 1.5, 1.5, "#fffef0");

  // Slag furnace grille in center (pulsing molten glow)
  p(ink, [-8.5, -22.5 + rumble], [8.5, -22.5 + rumble], [8.5, -10.5 + rumble], [-8.5, -10.5 + rumble]);
  r(-7, -21 + rumble, 14, 9, coreGlow);
  r(-5.5, -19.5 + rumble, 11, 6, core);
  if (venting || frame % 2 === 0) r(-3.5, -18.5 + rumble, 7, 3.5, venting ? "#ffffff" : "#ffe69e");
  for (const gx of [-3.5, 0, 3.5]) r(gx, -21 + rumble, 1.25, 9, ink);

  // Rotating 4-frame conical steel drill on the front
  if (!rear) {
    const dx = side ? 18 : 0;
    const dy = -16.5 + rumble;
    // Collar
    p(ink, [dx - 3, dy - 11.5], [dx + 2, dy - 11.5], [dx + 2, dy + 11.5], [dx - 3, dy + 11.5]);
    r(dx - 1.5, dy - 10, 2.5, 20, brass);
    r(dx - 1, dy - 8, 1, 4, "#fff2c2");
    // Cone
    p(ink, [dx + 1, dy - 10.5], [dx + 17.5, dy - 2], [dx + 17.5, dy + 2], [dx + 1, dy + 10.5]);
    p(iron, [dx + 2, dy - 8.5], [dx + 15.5, dy - 1], [dx + 15.5, dy + 1], [dx + 2, dy + 8.5]);
    p(steel, [dx + 2, dy - 7.5], [dx + 15, dy - 1], [dx + 14, dy + 1], [dx + 2, dy + 2]);
    // Helical spiral grooves shifting smoothly with frame
    const shift = (frame % 4) * 0.9;
    for (let i = 0; i < 4; i++) {
      const fx = dx + 2.5 + i * 3.1 + shift;
      if (fx > dx + 15) continue;
      const fh = Math.max(1.5, 7.5 - (fx - dx) * .42);
      p(ink, [fx - .5, dy - fh], [fx + 1.25, dy - fh], [fx + 2, dy + fh], [fx + .25, dy + fh]);
      r(fx - .25, dy - fh, 1, fh, steelHi);
    }
    // Bright tip spark glint alternating on spin frames
    if (frame % 2 === 0 || venting) r(dx + 15.5, dy - 1, 1.75, 2, venting ? "#fff6b0" : "#ffffff");
  }
}

export type MammothPose = "march" | "rear" | "slam" | "recover";

/**
 * 10 霜脊高地 · 霜角巨犸 (Frost-Tusk Mammoth)
 * Ferocious primeval woolly glacier mammoth with shaggy fur skirt, heavy muscular limbs,
 * twin sweeping frost tusks, jagged natural glacier ridge armor (splitting organically
 * when exposed), and a rearing two-foot ground-slam quake pose when engaging blockers.
 */
export function paintFrostMammoth(
  r: Rect, p: Shape, frame: number, facing: Facing,
  exposed: boolean, pose: MammothPose = "march",
) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const rearing = pose === "rear";
  const slamming = pose === "slam";
  const recovering = pose === "recover";
  const liftAmt = rearing ? [0.45, 0.78, 1, 1][frame] : 0;
  const stride = pose === "march" ? [2, 0, -2, 0][frame] : 0;
  const bob = rearing ? -liftAmt * 2 : slamming ? 2.5 : recovering ? 1 : (frame % 2 ? -1 : 0);
  const frontLift = rearing ? liftAmt * 9.5 : slamming ? -1.5 : 0;

  const ink = "#231c1d";
  const furDeep = "#453632";
  const furDark = "#685148";
  const fur = "#937668";
  const furPale = "#c9b8ad";
  const snow = "#edf7fc";
  const hoof = "#322b2b";
  const nail = "#9c8f86";
  const iceDeep = "#336c8f";
  const iceMid = "#5eb5d9";
  const iceBright = "#b9efff";
  const iceGlint = "#f0fdff";
  const eyeGlow = rearing || slamming ? "#ffea75" : exposed ? "#ffbc52" : "#ff9b3d";

  const drawSpire = (cx: number, cy: number, w: number, h: number, lean = 0) => {
    p(ink, [cx - w, cy + 2], [cx + lean - 1, cy - h], [cx + lean + 1.5, cy - h + 1], [cx + w, cy + 2]);
    p(iceDeep, [cx - w + 1.4, cy + 1], [cx + lean, cy - h + 2], [cx + w - 1.4, cy + 1]);
    p(iceMid, [cx - w + 1.6, cy + 1], [cx + lean, cy - h + 2], [cx + lean * 0.4 + 0.6, cy + 1]);
    p(iceBright, [cx - w * 0.45, cy - 0.5], [cx + lean, cy - h + 2.5], [cx + lean + 0.6, cy - h + 6], [cx - 0.5, cy]);
  };

  if (side) {
    // Muscular pillar leg helper with shaggy knee tuft & broad toes
    const leg = (x: number, fore: boolean, far: boolean) => {
      const step = (fore !== far ? stride : -stride);
      const lift = fore ? frontLift : 0;
      const topY = (fore ? -19 - lift * 0.55 : -17) + bob * 0.5;
      const footX = x + (fore && rearing ? 4 + liftAmt * 3 : fore && slamming ? 2.5 : step);
      const footY = (far ? 0 : 3) - (fore ? lift : Math.max(0, -step * 0.5));
      const kneeX = (x + footX) * 0.5 + (fore && rearing ? 3.5 : fore ? 1 : -1.5);
      const kneeY = (topY + footY) * 0.5;
      p(ink,
        [x - 6, topY], [x + 6, topY], [kneeX + 5.5, kneeY],
        [footX + 5.5, footY - 3], [footX + 6, footY + 1], [footX - 5.5, footY + 1],
        [footX - 6, footY - 3], [kneeX - 5.5, kneeY]);
      p(far ? furDeep : furDark,
        [x - 4.5, topY + 1], [x + 4.5, topY + 1], [kneeX + 4, kneeY],
        [footX + 4, footY - 2], [footX - 4, footY - 2], [kneeX - 4, kneeY]);
      if (!far) {
        // Shaggy fur ridge down front of leg
        p(fur, [x - 3, topY + 1], [x + 3.5, topY + 1], [kneeX + 3, kneeY], [footX + 1.5, footY - 4], [kneeX - 2, kneeY - 1]);
      }
      // Heavy splayed elephant hoof & nails
      p(hoof, [footX - 4.5, footY - 3], [footX + 4.5, footY - 3], [footX + 4.8, footY], [footX - 4.8, footY]);
      if (!far) {
        r(footX + 1.2, footY - 2.2, 2.2, 1.8, nail);
        r(footX - 2, footY - 2.2, 2, 1.8, nail);
      }
    };

    // Short shaggy tail behind rump
    const tailY = -20 + bob * 0.5 + (rearing ? 2 : 0);
    p(ink, [-22, tailY], [-26, tailY + 5], [-25, tailY + 9], [-21, tailY + 7], [-19, tailY + 2]);
    p(furDark, [-21.5, tailY + 1], [-24.5, tailY + 5], [-23.8, tailY + 7.5], [-21, tailY + 5.5]);

    // Far legs
    leg(-14, false, true);
    leg(8, true, true);

    // Massive primeval mammoth body: towering hunched shoulder peak sloping to heavy hindquarters
    const shoulderY = -36.5 + bob - frontLift * 0.45;
    const rumpY = -28.5 + bob + (rearing ? 2 : 0);
    const bellyY = -7 + bob * 0.5 - frontLift * 0.25;

    p(ink,
      [-22, -14 + bob], [-22, -24 + bob], [-15, rumpY], [-6, rumpY - 2.5],
      [2, shoulderY], [11, shoulderY + 1], [19, shoulderY + 9],
      [20.5, bellyY - 5], [16, bellyY + 2], [10, bellyY - 1], [4, bellyY + 2],
      [-2, bellyY], [-9, bellyY + 3], [-16, bellyY + 1], [-20, -10 + bob]);
    p(furDeep,
      [-20, -15 + bob], [-20, -23.5 + bob], [-14, rumpY + 1.5], [-5, rumpY - 1],
      [2.5, shoulderY + 1.8], [10.5, shoulderY + 2.5], [17.5, shoulderY + 9.5],
      [18.5, bellyY - 5], [14.5, bellyY], [9.5, bellyY - 2], [4, bellyY + 0.5],
      [-3, bellyY - 1.5], [-10, bellyY + 1], [-15.5, bellyY - 0.5]);
    // Layered shaggy wool & snow-frosted shoulder mane
    p(furDark,
      [-19, -19 + bob], [-13, rumpY + 2], [-5, rumpY - 0.5], [3, shoulderY + 2],
      [10, shoulderY + 3], [16.5, shoulderY + 10], [14, bellyY - 4],
      [8.5, bellyY - 7], [3, bellyY - 3], [-5, bellyY - 6], [-11.5, bellyY - 3], [-17, bellyY - 6]);
    p(fur,
      [-17, -21 + bob], [-11, rumpY + 3], [-4, rumpY], [3.5, shoulderY + 2.5],
      [10, shoulderY + 3.5], [15, shoulderY + 10], [10, shoulderY + 17],
      [5, shoulderY + 14.5], [-1, shoulderY + 18], [-8, rumpY + 10], [-14, rumpY + 8]);
    p(furPale,
      [-11, rumpY + 3.5], [-4, rumpY + 1], [3.5, shoulderY + 3], [9.5, shoulderY + 4],
      [13, shoulderY + 9], [7.5, shoulderY + 12], [2, shoulderY + 9], [-4, rumpY + 7.5]);
    p(snow,
      [-2, shoulderY + 4], [4, shoulderY + 3], [9, shoulderY + 4.5], [11, shoulderY + 7.5], [5, shoulderY + 7.5]);

    // Natural glacier spine & jagged flank frost-crust (organic ice armor instead of a mechanical box!)
    const split = exposed ? 4.5 : 0;
    drawSpire(-12 - split * 0.3, rumpY + 1, 3.8, 7.5, -2.5);
    drawSpire(-3, shoulderY + 3.5, 4.4, 9.5, -2);
    drawSpire(5.5 + split * 0.3, shoulderY + 2.5, 4.2, 8.8, -1);

    if (exposed) {
      // Cracked glacier plates parted by jagged glowing warm-amber primal rib fissures
      const pulse = frame % 2 === 0 ? 1 : 0;
      p(ink, [-9, shoulderY + 14], [-2, shoulderY + 11.5], [6, shoulderY + 13.5], [8, shoulderY + 21], [1, shoulderY + 24], [-7, shoulderY + 21.5]);
      p("#b84f2b", [-7.5, shoulderY + 15], [-2, shoulderY + 13], [4.5, shoulderY + 14.5], [6, shoulderY + 20], [0.5, shoulderY + 22.5], [-5.5, shoulderY + 20]);
      p("#f08d3c", [-5.5, shoulderY + 16], [-1.5, shoulderY + 14.5], [3, shoulderY + 15.5], [4 + pulse * 0.5, shoulderY + 19.5], [-0.5, shoulderY + 21], [-4.5, shoulderY + 19]);
      p("#ffe285", [-3, shoulderY + 16.5], [0, shoulderY + 15.5], [2 + pulse * 0.5, shoulderY + 18], [-1, shoulderY + 19.5]);
      // Shattered frost-plate fragments pulled outward
      p(iceMid, [-14, shoulderY + 13.5], [-9.5, shoulderY + 11.5], [-8.5, shoulderY + 20], [-13, shoulderY + 21]);
      p(iceBright, [-12.5, shoulderY + 14], [-10, shoulderY + 12.5], [-10, shoulderY + 17.5], [-12, shoulderY + 18.5]);
      p(iceMid, [7.5, shoulderY + 12.5], [12.5, shoulderY + 14], [11.5, shoulderY + 21], [7, shoulderY + 19.5]);
      p(iceBright, [8.5, shoulderY + 13.5], [11, shoulderY + 14.5], [10.5, shoulderY + 18.5], [8, shoulderY + 17.5]);
    } else {
      // Three natural jagged frost-crust shards clinging along the woolly ribs (organic, non-mechanical)
      for (const [fx, fy, fw, fh] of [[-9.5, shoulderY + 18, 4.5, 6.5], [-1.5, shoulderY + 15.5, 5.5, 8.5], [6.5, shoulderY + 17.5, 4.5, 6.5]] as const) {
        p(ink, [fx - fw, fy + 2], [fx - fw * 0.4, fy - fh], [fx + fw * 0.5, fy - fh + 1.5], [fx + fw, fy + 2], [fx + fw * 0.2, fy + 6], [fx - fw * 0.5, fy + 5]);
        p(iceDeep, [fx - fw + 1.2, fy + 1.5], [fx - fw * 0.35, fy - fh + 1.5], [fx + fw * 0.45, fy - fh + 2.5], [fx + fw - 1.2, fy + 1.5], [fx + 0.5, fy + 4.5]);
        p(iceMid, [fx - fw + 1.5, fy + 1], [fx - fw * 0.3, fy - fh + 2], [fx + fw * 0.35, fy - fh + 2.8], [fx + 1, fy + 2.5]);
        p(iceBright, [fx - fw * 0.5, fy - 0.5], [fx - fw * 0.25, fy - fh + 2.2], [fx + fw * 0.25, fy - fh + 3], [fx, fy + 0.5]);
      }
    }

    // Near legs
    leg(-10, false, false);
    leg(11, true, false);

    // Fierce woolly head, heavy brow, raging roaring trunk & massive curved twin ice tusks
    const hx = 13.5 - (rearing ? liftAmt * 2.5 : 0) + (slamming ? 2 : 0);
    const hy = -21.5 + bob - frontLift * 0.55;
    const h = at(p, hx, hy);
    const trunkSway = [0, 1.5, 0.5, -1][frame];

    // Far giant curved frost tusk (slightly behind trunk for depth)
    const farTusk = (color: string, ...pts: [number, number][]) => h(color, ...pts.map(([x, y]): [number, number] => [x + 2, y - 2.5 - liftAmt * 2.5]));
    farTusk(ink, [3, 2], [11, 3], [16.5, -4], [14.5, -8], [10, -1], [4, -1]);
    farTusk(iceDeep, [4, 1], [10.5, 2], [15, -4], [14, -6.5], [10, 0], [4.5, 0]);

    // Shaggy rugged ear swept back
    h(ink, [-10.5, -6.5], [-4, -10.5], [-2, 1], [-8, 3], [-11.5, -1]);
    h(furDark, [-9, -5.5], [-4.5, -8.5], [-3.5, 0], [-7.5, 1.5], [-9.5, -1]);
    h(furDeep, [-8, -3.5], [-5, -5.5], [-4.5, -0.5], [-7.5, 0]);

    // Heavy domed skull + fierce snout & roaring/trumpeting trunk
    if (rearing) {
      // Trumpeting skyward trunk & open roaring maw!
      h(ink,
        [-8, -11], [-2, -15], [6.5, -13], [10.5, -6.5], [14, -12], [17.5, -18], [13.5, -20.5], [9.5, -16],
        [7.5, -10], [10.5, -2], [8.5, 5], [3, 7], [-5, 5], [-8, -2]);
      h(fur,
        [-6.5, -10], [-1.5, -13.5], [5.5, -11.5], [9, -5.5], [13, -11.5], [15.5, -17], [13.2, -18.8], [10, -14.5],
        [7.5, -7.5], [9, -2], [6.5, 4], [2.5, 5.5], [-4, 4], [-6.5, -2]);
      h(snow, [-5, -10], [-1, -13], [5, -11], [6.5, -7.5], [0, -8.5]);
      // Open furious roaring mouth
      h("#6b2b34", [4, 0], [9, -0.5], [8, 4.5], [3.5, 4]);
      h("#b84b4b", [5, 1.5], [8, 1.5], [7, 3.8], [4.5, 3.5]);
    } else {
      const tipY = slamming ? 16 : 13.5;
      const tipX = slamming ? 15 : 11.5 + trunkSway;
      h(ink,
        [-8, -10.5], [-1, -14], [6.5, -12], [11, -4.5], [tipX + 2, tipY - 3],
        [tipX, tipY + 2], [tipX - 4.5, tipY + 1], [tipX - 5, tipY - 5], [6, 4], [0, 6], [-6.5, 4.5], [-8.5, -3]);
      h(fur,
        [-6.5, -9.5], [-1, -12.5], [5.5, -10.5], [9.5, -4], [tipX + 0.5, tipY - 3],
        [tipX - 0.5, tipY + 0.5], [tipX - 3.5, tipY - 0.5], [tipX - 4, tipY - 5], [5.5, 2.5], [0, 4.5], [-5, 3]);
      h(furPale, [-5, -9.5], [-1, -12], [5, -10], [8, -4.5], [5, -3.5], [-2, -5.5]);
      h(snow, [-3, -11.5], [4, -10.5], [5.5, -8], [-1, -8.5]);
      // Trunk muscular folds
      h(furDark, [7, 1], [10, 1.5], [9.5, 3], [6.8, 2.5]);
      h(furDark, [8, 5], [11, 5.5], [10.5, 7], [7.8, 6.5]);
    }

    // Fierce lowered brow ridge + glowing fierce amber eye
    h(ink, [0, -8], [7, -6], [6.5, -2.5], [1, -3.5]);
    h(eyeGlow, [2.2, -5.9], [5.4, -5.1], [5, -3.5], [2.2, -4.1]);
    r(hx + 4.1, hy - 5.5, 1.1, 1.1, "#ffffff");

    // Near massive curved glacial tusk sweeping down, forward, and violently upward
    const tLift = rearing ? -4 * liftAmt : slamming ? 2 : 0;
    h(ink,
      [0, 1], [5, 5 + tLift * 0.2], [12.5, 4.5 + tLift * 0.5], [19.5, -2.5 + tLift], [21, -10.5 + tLift],
      [16.5, -11 + tLift], [14.5, -4.5 + tLift * 0.7], [10, 0.5 + tLift * 0.3], [3, -1.5]);
    h(iceDeep,
      [1.5, 0.5], [5.5, 3.8 + tLift * 0.2], [12, 3.2 + tLift * 0.5], [18, -3 + tLift], [19.4, -9.2 + tLift],
      [17, -9.5 + tLift], [15, -4 + tLift * 0.7], [10, 1 + tLift * 0.3], [3, -0.5]);
    h(iceMid,
      [2.5, 0.2], [6.2, 2.8 + tLift * 0.2], [12, 2.5 + tLift * 0.5], [17.5, -3.5 + tLift], [18.8, -8.4 + tLift],
      [17, -8.5 + tLift], [15.2, -3.6 + tLift * 0.7], [10.5, 1.3 + tLift * 0.3], [3.5, 0]);
    h(iceBright,
      [9.5, 1.6 + tLift * 0.4], [15.8, -3 + tLift * 0.85], [18.5, -8.6 + tLift], [17.5, -8.8 + tLift],
      [15.4, -4 + tLift * 0.75], [11.5, 0.5 + tLift * 0.35]);
    if (frame % 2 === 0 || rearing || slamming) {
      r(hx + 17, hy - 8.5 + tLift, 1.8, 1.8, iceGlint);
    }

    // Slam shock-sparks under front hooves on impact frame
    if (slamming) {
      p(iceGlint, [4, 2], [9, -2], [14, 1], [18, -2], [22, 3], [15, 4], [9, 4]);
    }
    return;
  }

  // Front (south) & Rear (north) — massive imposing shaggy glacier beast
  const axialLeg = (x: number, fore: boolean, far: boolean) => {
    const lift = fore ? frontLift : 0;
    const step = pose === "march" ? (x < 0 !== far ? stride : -stride) * 0.6 : 0;
    const s = Math.sign(x);
    const topY = -18 + bob * 0.5 - lift * 0.45;
    const flare = fore && rearing ? s * (4.5 + liftAmt * 3) : 0;
    const footX = x + flare;
    const footY = (far ? 0 : 3.5) - (fore && rearing ? lift * 1.45 : lift) + step;
    const midX = (x + footX) * 0.5 + s * (fore && rearing ? 2.5 : 0.8);
    const midY = (topY + footY) * 0.5;
    p(ink,
      [x - 6, topY], [x + 6, topY], [midX + 6, midY], [footX + 5.5, footY - 3],
      [footX + 5, footY + 1.5], [footX - 5, footY + 1.5], [footX - 5.5, footY - 3], [midX - 6, midY]);
    p(far ? furDeep : furDark,
      [x - 4.5, topY + 1], [x + 4.5, topY + 1], [midX + 4.5, midY],
      [footX + 4, footY - 2], [footX - 4, footY - 2], [midX - 4.5, midY]);
    if (!far) {
      // Shaggy tapered fur tufts down the leg
      p(fur, [x - 3.5, topY + 1], [x + 3.5, topY + 1], [midX + 3.5, midY],
        [footX + 2.5, footY - 4], [footX, footY - 2.5], [footX - 2.5, footY - 4], [midX - 3.5, midY]);
    }
    p(hoof, [footX - 4.5, footY - 3], [footX + 4.5, footY - 3], [footX + 4, footY + 0.5], [footX - 4, footY + 0.5]);
    if (!far) {
      r(footX - 3.2, footY - 2, 1.8, 1.7, nail);
      r(footX - 0.8, footY - 1.8, 1.8, 1.7, nail);
      r(footX + 1.6, footY - 2, 1.8, 1.7, nail);
    }
  };

  axialLeg(-11, rear, true);
  axialLeg(11, rear, true);

  const shoulderY = -36.5 + bob - frontLift * 0.4;
  const bellyY = -7 + bob * 0.5 - frontLift * 0.2;

  // Towering wide furry torso
  p(ink,
    [-21, -13 + bob], [-22, -25 + bob], [-15, shoulderY + 6], [-7, shoulderY], [7, shoulderY],
    [15, shoulderY + 6], [22, -25 + bob], [21, -13 + bob],
    [15, bellyY + 2], [8, bellyY], [0, bellyY + 2.5], [-8, bellyY], [-15, bellyY + 2]);
  p(furDeep,
    [-19.5, -14 + bob], [-20, -24.5 + bob], [-14, shoulderY + 7.5], [-6.5, shoulderY + 1.8], [6.5, shoulderY + 1.8],
    [14, shoulderY + 7.5], [20, -24.5 + bob], [19.5, -14 + bob], [14, bellyY], [-14, bellyY]);
  p(furDark,
    [-18, -17 + bob], [-18, -25 + bob], [-13, shoulderY + 8], [-6, shoulderY + 2.5], [6, shoulderY + 2.5],
    [13, shoulderY + 8], [18, -25 + bob], [18, -17 + bob], [10, bellyY - 4], [0, bellyY - 1], [-10, bellyY - 4]);
  p(fur,
    [-16, -21 + bob], [-15, -26 + bob], [-11, shoulderY + 9], [-5.5, shoulderY + 3], [5.5, shoulderY + 3],
    [11, shoulderY + 9], [15, -26 + bob], [16, -21 + bob], [9, shoulderY + 20], [0, shoulderY + 17], [-9, shoulderY + 20]);
  p(furPale,
    [-11, shoulderY + 9], [-5, shoulderY + 3.5], [5, shoulderY + 3.5], [11, shoulderY + 9],
    [7, shoulderY + 12.5], [0, shoulderY + 10.5], [-7, shoulderY + 12.5]);
  p(snow, [-6, shoulderY + 4], [6, shoulderY + 4], [8, shoulderY + 7.5], [0, shoulderY + 6.5], [-8, shoulderY + 7.5]);

  // Glacier dorsal spines crowning the hump
  const spread = exposed ? 4 : 0;
  drawSpire(-9 - spread * 0.5, shoulderY + 5.5, 3.8, 8.5, -2);
  drawSpire(0, shoulderY + 2, 4.5, 10.5, 0);
  drawSpire(9 + spread * 0.5, shoulderY + 5.5, 3.8, 8.5, 2);

  if (exposed && rear) {
    // Glowing heat fissure visible between parted glacier back plates from the rear
    p(ink, [-6, shoulderY + 14], [6, shoulderY + 14], [7, shoulderY + 25], [-7, shoulderY + 25]);
    p("#b84f2b", [-4.5, shoulderY + 15.5], [4.5, shoulderY + 15.5], [5.5, shoulderY + 23.5], [-5.5, shoulderY + 23.5]);
    p("#f08d3c", [-3, shoulderY + 16.5], [3, shoulderY + 16.5], [3.5, shoulderY + 22], [-3.5, shoulderY + 22]);
    p("#ffe285", [-1.5, shoulderY + 18], [1.5, shoulderY + 18], [1.5, shoulderY + 21], [-1.5, shoulderY + 21]);
  } else if (rear) {
    // Closed glacier carapace across upper back
    p(ink, [-11, shoulderY + 15], [0, shoulderY + 12], [11, shoulderY + 15], [9, shoulderY + 24], [0, shoulderY + 26], [-9, shoulderY + 24]);
    p(iceDeep, [-9.5, shoulderY + 16], [0, shoulderY + 13.5], [9.5, shoulderY + 16], [7.5, shoulderY + 22.5], [0, shoulderY + 24], [-7.5, shoulderY + 22.5]);
    p(iceMid, [-7.5, shoulderY + 16.5], [0, shoulderY + 14.5], [7.5, shoulderY + 16.5], [4.5, shoulderY + 21], [-4.5, shoulderY + 21]);
    p(iceBright, [-4, shoulderY + 16], [4, shoulderY + 16], [2, shoulderY + 18.5], [-2, shoulderY + 18.5]);
  }

  axialLeg(-11, !rear, false);
  axialLeg(11, !rear, false);

  if (rear) {
    // Tusk tips curving out on far left & right + shaggy rear tail
    for (const s of [-1, 1]) {
      p(ink, [s * 18, shoulderY + 16], [s * 25, shoulderY + 12], [s * 24, shoulderY + 6], [s * 20, shoulderY + 11]);
      p(iceMid, [s * 19, shoulderY + 15], [s * 23.5, shoulderY + 11.5], [s * 23, shoulderY + 8], [s * 20.5, shoulderY + 11.5]);
    }
    p(ink, [-3, -15 + bob], [3, -15 + bob], [4, -7 + bob], [0, -4 + bob], [-4, -7 + bob]);
    p(furDark, [-2, -14 + bob], [2, -14 + bob], [2.5, -7.5 + bob], [0, -5.5 + bob], [-2.5, -7.5 + bob]);
    return;
  }

  // Front view: imposing fierce head, flared ears, glowing eyes, rearing/slamming trunk, and symmetrical giant curved ice tusks!
  const hy = -23 + bob - frontLift * 0.55;
  const h = at(p, 0, hy);

  // Flared broad woolly ears
  for (const s of [-1, 1]) {
    const ear = at(h, 13 * s, -4, s);
    ear(ink, [-4, -6], [5, -9], [8, -2], [6, 5], [-3, 4]);
    ear(furDark, [-3, -5], [4, -7], [6.5, -1.5], [4.5, 3.5], [-2, 2.5]);
    ear(furDeep, [-1, -3], [4, -4.5], [4.5, 1], [0, 1.5]);
  }

  // Heavy domed skull
  h(ink, [-12, -8], [-6, -14], [6, -14], [12, -8], [13, 2], [9, 7], [-9, 7], [-13, 2]);
  h(fur, [-10.5, -7.5], [-5.5, -12.5], [5.5, -12.5], [10.5, -7.5], [11.5, 1.5], [8, 5.5], [-8, 5.5], [-11.5, 1.5]);
  h(furPale, [-9, -7], [-5, -12], [5, -12], [9, -7], [6, -3], [-6, -3]);
  h(snow, [-5, -12], [5, -12], [6.5, -8.5], [-6.5, -8.5]);

  // Fierce V-shaped furrowed brow & burning amber eyes
  for (const s of [-1, 1]) {
    h(ink, [s * 2.5, -4], [s * 9.5, -6.5], [s * 9, -2.5], [s * 3.5, -1.5]);
    h(eyeGlow, [s * 4, -4.2], [s * 7.8, -5.2], [s * 7.5, -3.2], [s * 4.2, -2.8]);
    r(s * 6 - 0.5, hy - 4.8, 1.1, 1.1, "#ffffff");
  }

  // Exposed warm primal chest glow peeking beneath tusks when armor splits
  if (exposed) {
    h("#f08d3c", [-6, 6], [6, 6], [4.5, 11], [-4.5, 11]);
    h("#ffe285", [-3, 7], [3, 7], [2, 10], [-2, 10]);
  }

  // Twin colossal curving glacial tusks framing the face symmetrically
  for (const s of [-1, 1]) {
    const tLift = rearing ? -4 * liftAmt : slamming ? 2 : 0;
    const tk = at(h, 0, tLift, s);
    tk(ink,
      [5, 2], [11, 7], [19, 4], [25, -4], [24, -12], [19.5, -10.5], [18, -3], [12, 2.5], [6, -1]);
    tk(iceDeep,
      [6, 1.5], [11, 5.5], [18, 3], [23.5, -4], [22.8, -10.2], [20.2, -9], [18.5, -2.5], [12.5, 3], [6.5, 0]);
    tk(iceMid,
      [6.5, 1], [11.5, 4.5], [18, 2.2], [22.5, -4.2], [22.2, -9.2], [20.5, -8.5], [18.8, -2.5], [12.5, 2.5], [7, 0]);
    tk(iceBright, [14, 2.2], [20.5, -3.5], [22.2, -9.2], [21, -8.8], [18.8, -3], [14.5, 1.2]);
  }

  // Muscular trunk: coiled high showing open roaring mouth during rear, slamming downward on impact!
  if (rearing) {
    h("#6b2b34", [-4.5, 2], [4.5, 2], [4, 7.5], [-4, 7.5]);
    h("#b84b4b", [-3, 4], [3, 4], [2.5, 6.8], [-2.5, 6.8]);
    h(ink, [-4, 0], [-5.5, -9], [-2, -16], [4, -16], [6, -10], [4, 0]);
    h(fur, [-2.5, -0.5], [-4, -8.5], [-1.5, -14], [3, -14], [4.5, -9.5], [2.5, -0.5]);
    h(furPale, [-2, -7], [-1, -13], [2.5, -13], [3, -7]);
  } else {
    const sway = [0, 1.5, 0, -1.5][frame];
    const tipY = slamming ? 19 : 15;
    h(ink, [-4.5, -1], [4.5, -1], [5 + sway * 0.5, 8], [3.5 + sway, tipY], [-3.5 + sway, tipY], [-5 + sway * 0.5, 8]);
    h(fur, [-3, 0], [3, 0], [3.5 + sway * 0.5, 8], [2.2 + sway, tipY - 1.5], [-2.2 + sway, tipY - 1.5], [-3.5 + sway * 0.5, 8]);
    h(furPale, [-2, 0.5], [2, 0.5], [2 + sway * 0.4, 7], [-2 + sway * 0.4, 7]);
    h(furDark, [-2.5 + sway * 0.3, 5], [2.5 + sway * 0.3, 5], [2.5 + sway * 0.3, 6.4], [-2.5 + sway * 0.3, 6.4]);
    h(furDark, [-2.2 + sway * 0.6, 9.5], [2.2 + sway * 0.6, 9.5], [2.2 + sway * 0.6, 11], [-2.2 + sway * 0.6, 11]);
  }

  if (slamming) {
    p(iceGlint, [-18, 3], [-12, -2], [-6, 3], [0, -1], [6, 3], [12, -2], [18, 3], [12, 5], [-12, 5]);
  }
}

/** 09 分岔矿站 · 熔轨巨擘 */
export function paintSlagColossus(
  r: Rect, p: Shape, frame: number, facing: Facing,
  charging: boolean, enraged: boolean,
) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const stride = [2, 0, -2, 0][frame];
  const rushing = charging && frame === 2;
  const bob = rushing ? 2 : charging ? 1 : -frame % 2;
  const ink = "#241b23", iron = "#4a4853", steel = "#827f87";
  const rust = "#854235", copper = "#b96242", rim = "#db9459", brass = "#e7b66e";
  const heat = enraged || rushing ? "#fff2ab" : "#ffbc65";

  // Twin dorsal smokestacks with pulsing exhaust flames & piston bounce
  for (const [i, [x, top]] of ([[-16, -52], [7, -49]] as const).entries()) {
    const piston = (frame + i) % 2 === 0 ? -1 : 0;
    const y = top + bob + piston * (charging || enraged ? 1.2 : 0.5);
    p(ink, [x - 4, y], [x + 8, y], [x + 9, y + 4], [x + 5, y + 7], [x + 5, y + 17],
      [x - 3, y + 20], [x - 3, y + 6], [x - 5, y + 4]);
    r(x - 1, y + 5, 4, 12, iron);
    r(x - 1, y + 6, 2, 9, steel);
    r(x - 3, y + 1, 10, 2, rim);
    r(x - 1, y + 3, 6, 1.5, charging || enraged ? heat : rust);
    if (charging || enraged || (frame + i) % 2 === 0) {
      const fh = charging || enraged ? 5 : 2.5;
      p("#ff7f36", [x - 1, y], [x + 2, y - fh], [x + 5, y]);
      r(x + 1, y - fh * .65, 2, fh * .65, heat);
    }
  }

  for (const [x, step] of [[-10, stride], [9, -stride]]) {
    const foot = x + (rushing ? step * 2 : 0);
    p(ink, [x - 6, -19], [x + 6, -19], [foot + 5, -4 + step], [foot + 8, step],
      [foot + 8, 4 + step], [foot - 7, 4 + step], [foot - 8, -2 + step]);
    p(iron, [x - 4, -16], [x + 4, -16], [foot + 3, -5 + step], [foot - 4, -3 + step]);
    // Knee armor cap + brass hydraulic rivet
    r(foot - 3, -12 + step * .5, 6, 3.5, copper);
    r(foot - 2, -11.5 + step * .5, 3, 1.5, brass);
    r(foot - 2, -9 + step, 3, 8, steel);
    r(foot - 6, -2 + step, 12, 3.5, rust);
    r(foot - 5, -1 + step, 10, 1.5, rim);
    for (const lug of [-4, 0, 4]) r(foot + lug, 2 + step, 2, 2, steel);
  }

  p(ink, [-23, -33 + bob], [-13, -43 + bob], [12, -43 + bob], [23, -33 + bob],
    [21, -15 + bob], [12, -8 + bob], [-12, -8 + bob], [-21, -16 + bob]);
  p(rust, [-21, -32 + bob], [-12, -41 + bob], [11, -41 + bob], [21, -32 + bob],
    [19, -17 + bob], [11, -10 + bob], [-11, -10 + bob], [-19, -17 + bob]);
  p(copper, [-20, -32 + bob], [-12, -39 + bob], [11, -39 + bob], [19, -32 + bob],
    [14, -24 + bob], [-13, -24 + bob]);
  // Riveted brass boiler collar & top specular ridge
  r(-12, -39 + bob, 23, 1.5, rim);
  r(-15, -34 + bob, 30, 1.5, brass);

  for (const dir of [-1, 1]) {
    const x = dir * 17 + (side ? 1 : 0);
    const y = -28 + bob + (rushing ? -dir * 3 : dir * stride * .45);
    const offset = (side && rushing ? 3 : 0) + dir * 3;
    p(ink, [x - 8, y - 6], [x - 3, y - 10], [x + 6, y - 8], [x + 8, y - 2],
      [x + offset + 6, y + 5], [x + offset + 5, y + 14], [x + offset - 5, y + 16],
      [x + offset - 8, y + 11], [x - 6, y + 3]);
    p(steel, [x - 6, y - 5], [x - 2, y - 8], [x + 5, y - 6], [x + 6, y - 2], [x - 4, y]);
    p(iron, [x + offset - 6, y + 6], [x + offset + 4, y + 4], [x + offset + 4, y + 12],
      [x + offset - 4, y + 14], [x + offset - 6, y + 11]);
    r(x - 4, y - 4, 2, 2, brass);
    r(x + 3, y - 4, 2, 2, brass);
    if (charging || enraged) {
      r(x - 3, y - 7, 7, 1.5, heat);
      r(x + offset - 3, y + 5.5, 6, 1.5, heat);
    }
    for (const tooth of [-4, 0, 4]) r(x + offset + tooth, y + 8, 2, 4, dir === 1 ? rim : steel);
  }

  const core = side ? 4 : 0;
  p(ink, [core - 11, -28 + bob], [core - 7, -33 + bob], [core + 7, -33 + bob],
    [core + 11, -28 + bob], [core + 9, -15 + bob], [core - 9, -15 + bob]);
  if (rear) {
    r(-8, -29 + bob, 16, 11, iron);
    for (const x of [-5, 0, 5]) r(x, -27 + bob, 2, 7, enraged ? heat : rim);
  } else {
    const pulse = frame % 2 === 0 || charging || enraged;
    p("#c95736", [core - 9, -27 + bob], [core - 5, -31 + bob], [core + 5, -31 + bob],
      [core + 9, -27 + bob], [core + 7, -17 + bob], [core - 7, -17 + bob]);
    r(core - 6, -26 + bob, 12, 6, heat);
    if (pulse) r(core - 3.5, -25 + bob, 7, 3.5, "#ffffff");
    for (const rib of [-6, -2, 2, 6]) r(core + rib, -29 + bob, 1.5, 12, iron);
  }

  const hx = side ? 5 : 0;
  const hy = -41 + bob + (rushing ? 2 : 0);
  p(ink, [hx - 9, hy - 2], [hx - 5, hy - 7], [hx + 6, hy - 7], [hx + 11, hy - 2],
    [hx + 10, hy + 5], [hx + 5, hy + 8], [hx - 6, hy + 7], [hx - 9, hy + 4]);
  p(copper, [hx - 7, hy - 2], [hx - 4, hy - 5], [hx + 5, hy - 5], [hx + 8, hy - 2],
    [hx + 7, hy + 1], [hx - 7, hy + 1]);
  r(hx - 6, hy - 1, 14, 1.5, brass);
  r(hx - 4, hy - 4.5, 8, 1.25, rim);
  if (!rear) {
    r(hx - 4, hy + 2, 10, 4, iron);
    r(hx - (side ? 1 : 3), hy + 2, side ? 7 : 6, 2, heat);
    if (enraged || charging || frame % 2 === 0) r(hx + (side ? 2 : -1), hy + 2.25, 2, 1.25, "#ffffff");
  } else {
    r(hx - 5, hy + 2, 10, 2, steel);
  }
}

/** 12 冰脊哨台 · 寒岩雪傀 */
export function paintRimeGolem(
  r: Rect, p: Shape, frame: number, facing: Facing,
  broken: boolean,
) {
  const rear = facing === "north";
  const side = facing === "east" || facing === "west";
  const step = [2, 0, -2, 0][frame];
  const bob = -frame % 2;
  const ink = "#233246", shadow = "#465974", rock = "#677f9a", frost = "#a2bacd", snow = "#e0f2f7";

  for (const [x, stride] of [[-9, step], [8, -step]]) {
    p(ink, [x - 6, -16], [x + 5, -16], [x + 6, -5 + stride], [x + 8, stride],
      [x + 6, 4 + stride], [x - 7, 4 + stride], [x - 8, -2 + stride]);
    p(shadow, [x - 4, -14], [x + 4, -13], [x + 4, -5 + stride], [x - 4, -3 + stride]);
    p(rock, [x - 6, -2 + stride], [x - 3, -5 + stride], [x + 4, -4 + stride],
      [x + 6, stride], [x + 4, 2 + stride], [x - 5, 2 + stride]);
    r(x - 4, -2 + stride, 5, 1.5, frost);
  }

  p(ink, [-18, -24 + bob], [-12, -37 + bob], [-4, -40 + bob], [12, -39 + bob],
    [20, -29 + bob], [18, -13 + bob], [11, -7 + bob], [-10, -7 + bob], [-18, -15 + bob]);
  p(shadow, [-16, -24 + bob], [-10, -35 + bob], [-3, -38 + bob], [11, -37 + bob],
    [18, -29 + bob], [16, -14 + bob], [10, -9 + bob], [-9, -9 + bob], [-16, -16 + bob]);
  for (const [x, swing] of [[-18, -step], [18, step]]) {
    const y = -23 + bob + swing * .5;
    p(ink, [x - 9, y - 7], [x - 4, y - 12], [x + 6, y - 11], [x + 9, y - 4], [x + 7, y + 6],
      [x + 8, y + 12], [x + 3, y + 17], [x - 6, y + 15], [x - 9, y + 9]);
    p(rock, [x - 7, y - 6], [x - 3, y - 10], [x + 4, y - 9], [x + 7, y - 4],
      [x + 5, y + 4], [x - 5, y + 6], [x - 7, y + 2]);
    p(snow, [x - 7, y - 6], [x - 3, y - 10], [x + 4, y - 9], [x + 6, y - 5],
      [x + 2, y - 3], [x - 1, y - 5], [x - 5, y - 3]);
    p(rock, [x - 6, y + 8], [x + 3, y + 6], [x + 6, y + 11], [x + 2, y + 15], [x - 5, y + 13]);
    r(x - 4, y + 8, 5, 1.5, frost);
  }

  const cx = side ? 4 : 0;
  const y = -21 + bob;
  if (broken) {
    const pulse = frame % 2 === 0 ? 1 : 0;
    p("#293d57", [cx, y - 11], [cx + 12, y - 6], [cx + 13, y + 4], [cx, y + 11],
      [cx - 12, y + 6], [cx - 13, y - 5]);
    p("#48abc7", [cx, y - 8 - pulse * .5], [cx + 7 + pulse * .6, y - 2], [cx + 5, y + 4 + pulse * .5], [cx, y + 9], [cx - 7 - pulse * .6, y]);
    p("#affff8", [cx, y - 7], [cx + 4 + pulse * .5, y - 2], [cx, y + 5 + pulse * .5], [cx - 3 - pulse * .5, y]);
    p("#e9ffff", [cx, y - 6], [cx + 1.5, y - 1], [cx - 1, y + 2.5], [cx - 3, y]);
    if (pulse) r(cx - 1, y - 2.5, 2, 2, "#ffffff");
    for (const dir of [-1, 1]) {
      p(frost, [cx + dir * 7, y - 8], [cx + dir * 13, y - 6], [cx + dir * 13, y + 1], [cx + dir * 9, y - 2]);
      r(cx + dir * 9 - 1, y + 4, 2, 1.5, "#63d6e4");
    }
  } else {
    p(ink, [cx - 10, y - 10], [cx + 6, y - 11], [cx + 14, y - 5], [cx + 11, y + 8],
      [cx + 2, y + 12], [cx - 9, y + 7], [cx - 13, y]);
    p("#537f9f", [cx - 9, y - 8], [cx + 5, y - 9], [cx + 12, y - 4], [cx + 9, y + 7],
      [cx + 2, y + 10], [cx - 8, y + 5], [cx - 11, y]);
    p("#88b9d5", [cx - 9, y - 8], [cx + 5, y - 9], [cx + 9, y - 5], [cx + 2, y + 4], [cx - 8, y + 2]);
    p(snow, [cx - 9, y - 8], [cx + 5, y - 9], [cx + 8, y - 6], [cx - 3, y - 5], [cx - 8, y]);
    p("#abd8e9", [cx + 8, y - 4], [cx + 10, y - 3], [cx + 7, y + 5], [cx + 2, y + 8]);
    // Shifting diagonal crystal glint across intact ice armor
    const gx = cx - 4 + (frame % 4) * 2.5;
    r(gx, y - 4, 3, 1.25, "#ffffff");
  }

  p(ink, [cx - 8, y - 11], [cx - 7, y - 18], [cx - 3, y - 21], [cx + 5, y - 20],
    [cx + 9, y - 16], [cx + 8, y - 11], [cx + 3, y - 8], [cx - 5, y - 9]);
  p(rock, [cx - 6, y - 12], [cx - 5, y - 17], [cx - 2, y - 19], [cx + 5, y - 18],
    [cx + 7, y - 15], [cx + 5, y - 11], [cx - 3, y - 10]);
  r(cx - 4, y - 18, 9, 2, snow);
  if (!rear) for (const eye of side ? [2] : [-4, 2]) r(cx + eye, y - 14, 2, 1.5, "#aafff6");
}

/** 12 冰脊哨台 · 霜冕寒鹿 */
export function paintBlizzardElk(
  r: Rect, p: Shape, frame: number, facing: Facing,
  warding: boolean,
) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const gathering = warding && frame === 1;
  const released = warding && frame === 2;
  const stride = warding ? 0 : [2, 0, -2, 0][frame];
  const bob = -(frame % 2);
  const withers = gathering ? 2 : released ? -2 : bob;
  const ink = "#233043", shade = "#485a73", coat = "#839eb6", frost = "#bad0dd", snow = "#e0edf2";
  const crystal = released ? "#87eafa" : gathering ? "#74c2dc" : "#6d9fbd";
  const facet = released ? "#e8ffff" : "#b3e2ef";

  const legs = side ? [[-10, 1, true], [6, -1, true], [-15, -1, false], [14, 1, false]] as const
    : [[-6, 1, true], [6, -1, true], [-10, -1, false], [10, 1, false]] as const;
  for (const [x, dir, far] of legs) {
    const front = side ? x > 0 : far === rear;
    const root = front ? -25 + withers : -26 + bob;
    const knee = x + (side && !front ? 4 : 1) + dir * stride * .4;
    const hock = knee - (side && !front ? 5 : 1);
    const bracing = warding && !far ? (side ? (front ? 3 : -2) : Math.sign(x) * 2) : 0;
    const hoof = x + dir * stride + bracing + (side && !front ? -1 : 0);
    const foot = far ? -1 : 3;
    p(ink, [x - 6, root], [x + 6, root], [knee + 4, foot - 15], [hock + 3.5, foot - 9],
      [hoof + 3.5, foot - 5], [hoof + 5.5, foot - 3], [hoof + 5.5, foot + 1],
      [hoof - 5, foot + 1], [hoof - 5, foot - 4], [hock - 4, foot - 8],
      [knee - 4, foot - 14], [x - 5, root + 7]);
    p(far ? shade : coat, [x - 4, root + 1], [x + 4, root + 1], [knee + 2.5, foot - 15],
      [hock + 2, foot - 9], [hoof + 2, foot - 4], [hoof - 3, foot - 4],
      [hock - 2.5, foot - 8], [knee - 2, foot - 14], [x - 4, root + 7]);
    r(hoof - 3.5, foot - 2.5, 7.5, 2, shade);
    if (!side && !far) r(hoof, foot - 2, 1, 3, ink);
  }

  const rump = side ? -20 : -12;
  const chest = side ? 19 : 12;
  if (side) {
    p(ink, [rump + 4, -31 + bob], [rump - 2, -30 + bob], [rump - 6, -27 + bob], [rump - 6, -24 + bob],
      [rump - 2, -25 + bob], [rump + 4, -27 + bob]);
    p(frost, [rump + 3, -30 + bob], [rump - 2, -29 + bob], [rump - 5, -26 + bob], [rump - 2, -27 + bob],
      [rump + 2, -28 + bob]);
  }
  p(ink, [rump, -22 + bob], [rump, -27 + bob], [rump + 4, -32 + bob], [-7, -34 + bob],
    [4, -34 + withers], [chest - 5, -35 + withers], [chest, -28 + withers], [chest - 1, -19 + withers],
    [9, -16 + withers], [1, -19 + withers], [-6, -23 + bob], [rump + 5, -21 + bob]);
  p(shade, [rump + 2, -23 + bob], [rump + 2, -27 + bob], [rump + 5, -30 + bob], [-7, -32 + bob],
    [4, -32 + withers], [chest - 5, -33 + withers], [chest - 2, -28 + withers], [chest - 3, -20 + withers],
    [8, -17.5 + withers], [2, -21 + withers], [-6, -24 + bob], [rump + 5, -23 + bob]);
  p(coat, [rump + 3, -26 + bob], [rump + 5, -30 + bob], [-7, -32 + bob],
    [3, -32 + withers], [chest - 6, -33 + withers], [chest - 5, -28 + withers],
    [chest - 9, -23 + withers], [0, -24 + bob], [-6, -26 + bob], [rump + 5, -24 + bob]);
  p(frost, [rump + 4, -28 + bob], [rump + 7, -31 + bob], [-7, -32 + bob],
    [4, -33 + withers], [chest - 7, -32 + withers], [chest - 9, -29 + withers],
    [-6, -30 + bob], [rump + 7, -28 + bob]);
  if (side) {
    p(snow, [rump, -27 + bob], [rump + 4, -30 + bob], [rump + 8, -31 + bob],
      [rump + 6, -27 + bob], [rump + 4, -24 + bob], [rump + 2, -26 + bob]);
    // Frost-crystal flank rune stripe that brightens when warding
    r(-7, -27 + bob, 9, 1.25, warding ? facet : crystal);
    if (warding) r(-4, -27 + bob, 4, 1.25, "#ffffff");
  }

  const nx = side ? 9 : 0;
  const hx = side ? (released ? 12 : gathering ? 18 : 15) : 0;
  const hy = released ? -40 : gathering ? -33 : -37 + bob;
  p(ink, [nx - 8, -23 + withers], [nx - 6, -31 + withers], [hx - 5, hy - 5], [hx + 4, hy - 2],
    [hx + 5, hy + 5], [nx + 9, -27 + withers], [nx + 7, -20 + withers],
    [nx + 3, -17 + withers], [nx - 3, -19 + withers]);
  p(coat, [nx - 6, -24 + withers], [nx - 4, -31 + withers], [hx - 4, hy - 3], [hx + 2, hy - 1],
    [hx + 3, hy + 4], [nx + 7, -27 + withers], [nx + 5, -21 + withers],
    [nx + 2, -19 + withers], [nx - 2, -21 + withers]);
  p(frost, [hx + 1, hy + 1], [hx + 3, hy + 4], [nx + 6, -28 + withers],
    [nx + 4, -23 + withers], [nx + 1, -21 + withers], [nx + 2, -29 + withers]);
  p(crystal, [nx - 3, -27 + withers], [nx + 1, -31 + withers], [nx + 3, -28 + withers],
    [nx + 2, -24 + withers], [nx - 1, -23 + withers]);
  if (warding) p(facet, [nx - 1, -28 + withers], [nx + 1, -30 + withers], [nx + 1, -25 + withers]);

  // The near antler sweeps back in profile. Both are wide and forked when facing the lane.
  const antlers = side ? [[hx + 1, 1, .61], [hx - 5, -1, 1]] : [[-5, -1, .86], [5, 1, .86]];
  const rootY = Math.max(-38, hy - 2);
  for (const [root, dir, span] of antlers) {
    const horn: Shape = (color, ...points) => p(color, ...points.map(([x, y]): [number, number] => [
      root + dir * x * span, rootY + y + (gathering ? x * .15 : 0),
    ]));
    horn(ink, [-2, 3], [0, -3], [5, -8], [5, -12], [3, -16], [8, -14], [10, -10],
      [14, -11], [15, -16], [19, -15], [18, -10], [21, -11], [24, -15], [26, -14],
      [25, -9], [21, -6], [14, -6], [11, -3], [6, -3], [3, 3]);
    horn(crystal, [0, 2], [2, -3], [7, -8], [6, -13], [8.5, -11], [9, -7],
      [15, -9], [16, -14], [18, -14], [17, -8], [21, -9], [24, -12], [24, -9],
      [20, -7], [13, -7], [10, -4], [5, -4], [2, 2]);
    horn(facet, [2, -3], [9, -8], [14, -9], [16, -13], [17, -14], [16, -10],
      [14, -8], [9, -6], [5, -4]);
    horn(facet, [21, -9], [24, -13], [25, -13], [24, -10]);
    if (warding || frame % 2 === 0) {
      r(root + dir * 16.5 * span - .75, rootY - 14.5 + (gathering ? 2.4 : 0), 1.5, 1.5, "#ffffff");
      r(root + dir * 24 * span - .75, rootY - 14 + (gathering ? 3.5 : 0), 1.5, 1.5, warding ? "#ffffff" : facet);
    }
  }

  const head: Shape = (color, ...points) => p(color, ...points.map(([x, y]): [number, number] => [hx + x, hy + y]));
  if (side) {
    head(ink, [-7, 2], [-9, -3], [-14, -7], [-15, -11], [-10, -10], [-4, -6], [-1, -6],
      [5, -5], [8, -1], [14, 4], [14, 7], [11, 9], [6, 8], [1, 5], [-2, 6]);
    head(coat, [-5, 1], [-7, -3], [-12, -7], [-13, -9], [-10, -8], [-4, -4], [-1, -4],
      [4, -4], [7, 0], [12, 4], [12, 6], [10, 7], [6, 6], [1, 3], [-3, 4]);
    head(shade, [-12, -8], [-8, -6], [-6, -3], [-10, -5]);
    head(snow, [-3, -3], [0, -5], [5, -4], [8, 0], [5, 0], [1, -1], [-2, 2]);
    head(ink, [0, 0], [4, -1], [7, 1], [4, 2.5], [1, 2]);
    head(facet, [2, .5], [5.5, 1], [3.5, 2]);
    head(shade, [6, 4], [11, 4], [13, 6], [10, 8], [6, 6]);
    r(hx + 11, hy + 4.5, 3, 2, ink);
  } else {
    head(ink, [-10, 3], [-14, -5], [-8, -6], [-4, -4], [0, -6], [5, -5], [9, -6],
      [14, -5], [10, 3], [7, 6], [4, 11], [-4, 11], [-7, 6]);
    head(coat, [-8, 2], [-11, -4], [-8, -4], [-4, -2], [0, -4], [5, -3], [9, -4],
      [11, -4], [8, 2], [5, 5], [3, 9], [-3, 9], [-5, 5]);
    if (rear) {
      head(frost, [-7, -3], [-3, -2], [0, -4], [5, -3], [7, -1], [3, 3], [-3, 4]);
    } else {
      head(snow, [-8, -3], [-4, -3], [0, -1], [5, -3], [8, -2], [3, 1], [4, 5],
        [2, 7], [-2, 7], [-4, 5], [-3, 1]);
      head(ink, [-8, -1], [-3, 1], [-3, 3], [-7, 2]);
      head(ink, [8, -1], [3, 1], [3, 3], [7, 2]);
      head(facet, [-7, .5], [-3.5, 1.5], [-5, 2.5]);
      head(facet, [7, .5], [3.5, 1.5], [5, 2.5]);
      r(-3, hy + 6, 6, 2.5, ink);
    }
  }
}
