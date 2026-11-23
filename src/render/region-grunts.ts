import type { Facing } from "../engine/formation.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

/** A winter stoat with a black-tipped tail and folding ice fins at the hips. */
export function paintIceSail(r: Rect, p: Shape, frame: number, facing: Facing, gliding: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const low = gliding ? 6 : [3, 4, 2, 3][frame];
  const stride = [2, 0, -2, 0][frame];
  const ink = "#283941", shadow = "#718c99", fur = "#abbfc2", white = "#e8ecdf";
  const iceDark = "#557b8d", ice = "#84adbc", frost = "#bfe0df";

  if (side) {
    // A real tail lies behind the hindquarters, distinct from the two hip fins.
    const tip = gliding ? 3 : [0, -2, -1, 1][frame];
    p(ink, [-12, -14 + low], [-19, -13 + low], [-24, -11 + tip], [-27, -12 + tip],
      [-26, -7 + tip], [-23, -6 + tip], [-15, -8 + low], [-11, -10 + low]);
    p(fur, [-13, -12 + low], [-19, -11 + low], [-24, -9 + tip], [-25, -9 + tip],
      [-24, -7 + tip], [-20, -8 + tip], [-14, -10 + low]);
    if (gliding) {
      p(ink, [-10, -10 + low], [-18, -17 + low], [-25, -18 + low], [-22, -13 + low], [-15, -9 + low]);
      p(iceDark, [-12, -11 + low], [-19, -15 + low], [-23, -16 + low], [-20, -13 + low], [-15, -11 + low]);
    }

    for (const [x, dir, far] of [[-9, 1, true], [8, -1, true], [-13, -1, false], [12, 1, false]] as const) {
      const paw = x + (gliding ? -4 : dir * stride);
      const foot = gliding ? (far ? -1 : 2) : (far ? -1 : 2) - (dir * stride > 0 ? 1 : 0);
      p(ink, [x - 3, -9 + low], [x + 3, -9 + low], [paw + 2, foot - 3], [paw + 4, foot - 1],
        [paw + 3, foot], [paw - 3, foot], [paw - 3, foot - 3]);
      p(far ? shadow : fur, [x - 1, -8 + low], [x + 1, -8 + low], [paw + 1, foot - 3],
        [paw + 2, foot - 1], [paw - 2, foot - 1], [paw - 1, foot - 3]);
    }

    p(ink, [-16, -10 + low], [-14, -18 + low], [-7, -21 + low], [3, -20 + low],
      [11, -22 + low], [18, -17 + low], [18, -10 + low], [12, -5 + low], [0, -7 + low], [-12, -5 + low]);
    p(shadow, [-14, -10 + low], [-12, -17 + low], [-7, -19 + low], [3, -18 + low],
      [10, -20 + low], [16, -17 + low], [16, -11 + low], [11, -7 + low], [0, -9 + low], [-11, -7 + low]);
    p(white, [-13, -13 + low], [-9, -18 + low], [-6, -19 + low], [2, -18 + low],
      [10, -20 + low], [15, -16 + low], [11, -12 + low], [1, -12 + low], [-6, -14 + low], [-12, -11 + low]);
    if (gliding) {
      p(ink, [-9, -15 + low], [-16, -14 + low], [-27, -10 + low], [-25, -6 + low],
        [-20, -5 + low], [-6, -9 + low]);
      p(ice, [-10, -14 + low], [-17, -12 + low], [-25, -10 + low], [-23, -7 + low], [-19, -7 + low], [-8, -10 + low]);
      p(frost, [-10, -14 + low], [-17, -12 + low], [-24, -10 + low], [-20, -10 + low], [-12, -12 + low]);
    } else {
      p(ink, [-15, -13 + low], [-13, -17 + low], [-8, -18 + low], [-4, -15 + low],
        [-8, -11 + low], [-13, -10 + low]);
      p(ice, [-13, -13 + low], [-12, -16 + low], [-8, -17 + low], [-6, -15 + low], [-9, -13 + low]);
      r(-12, -15 + low, 3, 1, frost);
    }

    const hx = gliding ? 17 : 15;
    const hy = -19 + low + (gliding ? 1 : 0);
    const head: Shape = (color, ...points) => p(color, ...points.map(([x, y]): [number, number] => [hx + x, hy + y]));
    head(ink, [-8, -1], [-7, -6], [-4, -8], [-1, -7], [0, -4], [5, -3], [9, 1], [12, 2],
      [12, 5], [9, 8], [2, 8], [-3, 9], [-7, 5]);
    head(fur, [-6, 0], [-5, -5], [-3, -6], [-1, -4], [4, -1], [8, 2], [10, 3], [10, 5],
      [7, 6], [1, 6], [-3, 8], [-5, 5]);
    head(white, [-4, 0], [1, -2], [4, -1], [8, 2], [10, 4], [7, 5], [0, 5], [-3, 4]);
    r(hx - 4, hy - 5, 2, 2, shadow);
    r(hx + 3, hy + 1, 2, 2, ink);
    r(hx + 10, hy + 2, 2, 2, ink);
    return;
  }

  const y = (rear ? -23 : -18) + low;
  const spread = gliding ? 19 : 14;
  const hip = -13 + low + (rear ? 2 : 0);
  const finTip = hip + (gliding ? (rear ? 2 : -4) : -1);
  for (const dir of [-1, 1]) {
    p(ink, [dir * 8, hip - 3], [dir * 11, hip - 4], [dir * (spread - 2), finTip - 2],
      [dir * spread, finTip], [dir * (spread - 1), finTip + 3], [dir * 8, hip + 3]);
    p(rear ? iceDark : ice, [dir * 10, hip - 2], [dir * (spread - 2), finTip - 1],
      [dir * (spread - 1), finTip], [dir * (spread - 2), finTip + 2], [dir * 9, hip + 1]);
    if (gliding) r(dir * 15 - 1.5, finTip, 3, 1, frost);

    const x = dir * (rear ? 9 : 7);
    const foot = (gliding ? 2 : 3) - (dir * stride > 0 ? 1.5 : 0);
    p(ink, [dir * 8, -10 + low], [dir * 12, -9 + low], [dir * 15, -3], [dir * 10, -2], [dir * 7, -5]);
    p(ink, [x - 3, -9 + low], [x + 3, -9 + low], [x + 4, foot - 2],
      [x + 3, foot], [x - 3, foot], [x - 4, foot - 2]);
    r(x - 2, foot - 3, 4, 2, fur);
  }

  if (rear) {
    p(ink, [-9, y + 4], [-9, y - 1], [-6, y - 5], [6, y - 5], [9, y - 1], [9, y + 4]);
    p(fur, [-7, y + 4], [-7, y - 1], [-5, y - 3], [5, y - 3], [7, y - 1], [7, y + 4]);
  }
  const width = rear ? 13 : 12;
  p(ink, [-width, -7 + low], [-width, -13 + low], [-10, -19 + low], [-6, -23 + low], [6, -23 + low],
    [10, -19 + low], [width, -13 + low], [width, -7 + low], [8, -5 + low], [-8, -5 + low]);
  p(shadow, [-width + 2, -8 + low], [-width + 2, -13 + low], [-8, -18 + low], [-5, -21 + low],
    [5, -21 + low], [8, -18 + low], [width - 2, -13 + low], [width - 2, -8 + low], [7, -7 + low], [-7, -7 + low]);
  for (const dir of [-1, 1]) {
    p(ink, [dir * 3, y - 3], [dir * 4, y - 7], [dir * 8, y - 7], [dir * 9, y - 4], [dir * 7, y]);
    p(rear ? fur : shadow, [dir * 4, y - 3], [dir * 5, y - 6], [dir * 7, y - 6],
      [dir * 8, y - 4], [dir * 6, y - 1]);
  }
  if (rear) {
    p(fur, [-10, -9 + low], [-10, -13 + low], [-5, -19 + low], [0, -21 + low], [5, -19 + low],
      [10, -13 + low], [10, -9 + low], [5, -7 + low], [-5, -7 + low]);
    p(white, [-8, -15 + low], [-5, -19 + low], [0, -21 + low], [5, -19 + low],
      [8, -15 + low], [3, -16 + low], [-2, -15 + low]);
    for (const dir of [-1, 1]) {
      p(iceDark, [dir * 7, -14 + low], [dir * 11, -15 + low], [dir * 13, -12 + low],
        [dir * 12, -9 + low], [dir * 9, -10 + low]);
      p(ice, [dir * 8, -13 + low], [dir * 11, -14 + low], [dir * 12, -12 + low], [dir * 10, -11 + low]);
    }
    const tail = gliding ? 5 : [5, 3, 1, 3][frame];
    p(ink, [-3, -11 + low], [2, -11 + low], [tail + 2, -5], [tail + 5, -3], [tail + 4, 1],
      [tail, 1], [tail - 3, -2], [-3, -7 + low]);
    p(fur, [-1, -10 + low], [1, -10 + low], [tail + 1, -4], [tail + 2, -3], [tail - 1, -2], [-1, -8 + low]);
    return;
  }
  p(ink, [-10, y - 2], [-6, y - 5], [6, y - 5], [10, y - 2], [10, y + 3], [5, y + 8], [-5, y + 8], [-10, y + 3]);
  p(white, [-8, y - 1], [-5, y - 3], [5, y - 3], [8, y - 1], [8, y + 2],
    [4, y + 6], [-4, y + 6], [-8, y + 2]);
  r(-5, y + 1, 2, 2, ink);
  r(3, y + 1, 2, 2, ink);
  r(-2, y + 4, 4, 2, "#4b5156");
  r(-1, y + 6, 2, 1, shadow);
}

/**
 * 04–06 苔岸河湾 · 芦溪蝾螈 (Reed Newt)
 * Agile emerald-teal amphibious newt with coral gill frills, amber flank spots & undulating tail.
 */
export function paintReedNewt(r: Rect, p: Shape, frame: number, facing: Facing) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const stride = [2, 0, -2, 0][frame];
  const wag = [0, -1.2, 0, 1.2][frame];
  const bob = -(frame % 2) * .6;
  const ink = "#1b2b26", deep = "#2f4d3f", skin = "#5f8265", light = "#8fa878";
  const belly = "#c7c39a", gill = "#c97a6e", eye = "#f2c062";

  if (side) {
    // Short tapered tail keeps the silhouette chunky.
    p(ink, [-13, -7 + bob], [-20, -9 + wag], [-22, -6 + wag], [-17, -4 + wag], [-12, -4 + bob]);
    p(deep, [-12, -6 + bob], [-18, -7.5 + wag], [-19, -6 + wag], [-15, -5 + wag], [-11, -5 + bob]);
    // Translucent tail fin edged with one pale rim.
    p(light, [-16, -5 + wag], [-21, -6 + wag], [-23, -3.5 + wag], [-20, -2.5 + wag], [-17, -3.5 + wag]);
    for (const [x, dir, far] of [[-7, 1, true], [3, -1, true], [-9, -1, false], [5, 1, false]] as const) {
      const paw = x + dir * stride;
      const foot = far ? -1 : 2;
      p(ink, [x - 2.5, -8 + bob], [x + 2.5, -8 + bob], [paw + 3, foot], [paw - 3, foot]);
      p(far ? deep : skin, [x - 1.5, -7 + bob], [x + 1.5, -7 + bob], [paw + 1.5, foot - 1], [paw - 1.5, foot - 1]);
      if (!far) {
        r(paw - 2.4, foot - 1, 1, 1, deep);
        r(paw + 1.4, foot - 1, 1, 1, deep);
      }
    }
    // Round damp body and pale belly.
    p(ink, [-12, -6 + bob], [-11, -15 + bob], [-5, -19 + bob], [6, -19 + bob], [12, -14 + bob],
      [13, -7 + bob], [7, -3 + bob], [-8, -3 + bob]);
    p(deep, [-10, -6 + bob], [-9, -13.5 + bob], [-4, -17 + bob], [5, -17 + bob], [10, -12.5 + bob],
      [11, -7 + bob], [6, -5 + bob], [-7, -5 + bob]);
    p(skin, [-9, -8 + bob], [-8, -12 + bob], [-3, -15 + bob], [4, -15 + bob], [8, -11 + bob],
      [9, -7 + bob], [5, -5.5 + bob], [-6, -5.5 + bob]);
    r(-6, -14 + bob, 9, 2.5, light);
    p(belly, [-8, -5 + bob], [6, -5 + bob], [4, -3 + bob], [-6, -3 + bob]);
    // Mottled dorsal spots, throat creases and a damp sheen.
    r(-5, -12 + bob, 2, 1, deep);
    r(-1, -13 + bob, 1.5, 1, "#53705b");
    r(2, -11.5 + bob, 2, 1, deep);
    r(-6, -4.2 + bob, 3, .7, "#a8aa86");
    r(0, -4.2 + bob, 3, .7, "#a8aa86");
    r(13, -12.5 + bob, 2, .8, "#c9d3b4");
    // Larger chibi head.
    p(ink, [8, -14 + bob], [15, -15 + bob], [19, -11 + bob], [18, -5 + bob], [12, -3 + bob], [8, -5 + bob]);
    p(skin, [9, -12.5 + bob], [15, -13 + bob], [17.5, -10 + bob], [16.5, -6.5 + bob], [12, -5 + bob], [9, -6.5 + bob]);
    r(11, -12 + bob, 5, 1.8, light);
    // Single muted coral gill frill accent.
    p(ink, [6, -16 + bob], [3, -21 + bob], [9, -19 + bob], [11, -14 + bob]);
    p(gill, [6.5, -16 + bob], [4.5, -19.5 + bob], [8, -18 + bob], [9.5, -14.5 + bob]);
    r(5.2, -17.5 + bob, .8, 3.4, "#9f5c55");
    r(7.2, -18 + bob, .8, 3.1, "#b06a5f");
    r(14, -11 + bob, 2.4, 2.4, eye);
    r(15, -10.3 + bob, 1, 1.1, ink);
    r(14.4, -10.8 + bob, .7, .7, "#fff0b0");
    r(16, -6.5 + bob, 2.5, .8, deep);
  } else {
    for (const [i, x] of ([-7, 7] as const).entries()) {
      const foot = 2 + (i === 0 ? stride * .35 : -stride * .35);
      p(ink, [x - 3, -7 + bob], [x + 3, -7 + bob], [x + 3.5, foot], [x - 3.5, foot]);
      p(skin, [x - 1.5, -6 + bob], [x + 1.5, -6 + bob], [x + 2, foot - 1], [x - 2, foot - 1]);
      r(x - 2.2, foot - 1, .9, 1, deep);
      r(x + 1.3, foot - 1, .9, 1, deep);
    }
    for (const dir of [-1, 1]) {
      p(ink, [dir * 6, -14 + bob], [dir * 12, -17 + bob], [dir * 11, -10 + bob], [dir * 6, -9 + bob]);
      p(gill, [dir * 7, -13 + bob], [dir * 10.5, -15 + bob], [dir * 9.5, -11 + bob], [dir * 7, -10.5 + bob]);
      r(dir * 8 - .5, -14 + bob, .8, 2.6, "#9f5c55");
    }
    p(ink, [-9, -5 + bob], [-9, -15 + bob], [-5, -19 + bob], [5, -19 + bob], [9, -15 + bob], [10, -5 + bob], [5, -2 + bob], [-5, -2 + bob]);
    p(deep, [-7.5, -5.5 + bob], [-7.5, -14 + bob], [-4, -17 + bob], [4, -17 + bob], [7.5, -14 + bob], [8.5, -5.5 + bob], [4, -3.5 + bob], [-4, -3.5 + bob]);
    p(skin, [-6, -7 + bob], [-6, -13 + bob], [-3, -15.5 + bob], [3, -15.5 + bob], [6, -13 + bob], [7, -7 + bob], [3, -4.5 + bob], [-3, -4.5 + bob]);
    r(-4, -16 + bob, 8, 2, light);
    p(belly, [-4.5, -7 + bob], [4.5, -7 + bob], [3, -3.5 + bob], [-3, -3.5 + bob]);
    r(-3.5, -12 + bob, 1.6, 1, deep);
    r(2, -13 + bob, 1.4, 1, "#53705b");
    r(-0.5, -10.5 + bob, 1.6, 1, deep);
    r(-3, -5.5 + bob, 2.4, .7, "#a8aa86");
    r(1, -4.6 + bob, 2.4, .7, "#a8aa86");
    r(0, -15 + bob, 2.5, .7, "#c9d3b4");
    if (!rear) {
      for (const ex of [-4.5, 2.5]) {
        r(ex, -12 + bob, 2.3, 2.3, eye);
        r(ex + .6, -11.3 + bob, 1, 1.1, ink);
        r(ex + .4, -11.6 + bob, .7, .7, "#fff0b0");
      }
      r(-2, -7.5 + bob, 4, 1, deep);
    } else {
      r(-2, -12 + bob, 2, 1.5, "#a8b47f");
      r(1, -10 + bob, 2, 1.5, "#a8b47f");
    }
  }
}

export function paintOreCrawler(r: Rect, p: Shape, frame: number, facing: Facing) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const bob = -(frame % 2) * .6;
  const ink = "#1f1a1d", ironDark = "#3d3a40", iron = "#56525a", rust = "#8a583c";
  const copper = "#b0794e", ore = "#f0b45c", oreHi = "#ffe2a3";

  if (side) {
    for (let i = 0; i < 3; i++) {
      const lx = -8 + i * 8;
      const step = ((frame + i) % 2 ? 2 : -2);
      p(ink, [lx - 2, -7 + bob], [lx + 2, -7 + bob], [lx + step + 4, 2], [lx + step - 2, 2]);
      p(iron, [lx - .8, -5 + bob], [lx + .8, -5 + bob], [lx + step + 2, 1], [lx + step - 1, 1]);
      r(lx + step - 2.5, -3 + bob, 1.6, .8, "#78737c");
    }
    // Chunky domed shell.
    p(ink, [-15, -5 + bob], [-15, -13 + bob], [-8, -18 + bob], [6, -18 + bob], [14, -13 + bob],
      [15, -6 + bob], [9, -2 + bob], [-10, -2 + bob]);
    p(ironDark, [-13, -6 + bob], [-13, -12 + bob], [-7, -16 + bob], [5, -16 + bob], [12, -12 + bob],
      [13, -7 + bob], [8, -4 + bob], [-9, -4 + bob]);
    p(iron, [-11, -9 + bob], [-6, -15 + bob], [5, -15 + bob], [10, -10 + bob], [6, -8 + bob], [-8, -8 + bob]);
    p(rust, [-11, -5 + bob], [10, -5 + bob], [8, -3 + bob], [-9, -3 + bob]);
    // Iron plate seams, rivets and rust streaks.
    r(-8, -11.5 + bob, 9, .7, "#302d34");
    r(3, -12.5 + bob, 6, .7, "#302d34");
    for (const [rx, ry] of [[-11, -10], [-3, -13], [4, -14], [10, -9]] as const)
      r(rx, ry + bob, 1, .8, "#8a858d");
    r(-7, -8 + bob, 1.2, 2, "#6d4030");
    r(6, -7 + bob, 1, 1.4, "#6d4030");
    // One clear amber ore cluster as the memory accent.
    p(ink, [-5, -15 + bob], [0, -21 + bob], [5, -15 + bob]);
    p(ore, [-3.2, -15 + bob], [0, -19.5 + bob], [3.2, -15 + bob]);
    p("#c47d38", [-2.4, -16.5 + bob], [-.3, -19 + bob], [.5, -16.8 + bob]);
    r(-.6, -19 + bob, 1.2, 2.2, frame % 2 ? oreHi : "#ffd47e");
    p(ink, [4.5, -14 + bob], [6.8, -17.5 + bob], [8.5, -14 + bob]);
    p(ore, [5.2, -14 + bob], [6.7, -16.4 + bob], [7.8, -14 + bob]);
    r(6.3, -16 + bob, .8, 1.2, oreHi);
    // Small brass headlamp at the front with a warm lens ring.
    p(ink, [11, -10 + bob], [17, -9 + bob], [16, -4 + bob], [11, -4 + bob]);
    p(copper, [12, -9 + bob], [16, -8.5 + bob], [15, -5.5 + bob], [12, -5.5 + bob]);
    r(12.6, -8.6 + bob, 3.4, 3, "#3a2c2a");
    r(13.1, -8.2 + bob, 2.4, 2.2, frame % 2 ? oreHi : ore);
  } else {
    for (const [i, x] of ([-8, 8] as const).entries()) {
      const lift = (frame + i) % 2 ? -1.2 : 0;
      p(ink, [x - 2.5, -8 + bob], [x + 2.5, -8 + bob], [x + (x < 0 ? -4 : 4), 2 + lift], [x - 1, 2 + lift]);
      p(iron, [x - 1, -6 + bob], [x + 1, -6 + bob], [x + (x < 0 ? -2 : 2), 1 + lift], [x, 1 + lift]);
    }
    p(ink, [-12, -5 + bob], [-12, -14 + bob], [-6, -19 + bob], [6, -19 + bob], [12, -14 + bob],
      [12, -5 + bob], [6, -2 + bob], [-6, -2 + bob]);
    p(ironDark, [-10, -6 + bob], [-10, -13 + bob], [-5, -17 + bob], [5, -17 + bob], [10, -13 + bob],
      [10, -6 + bob], [5, -4 + bob], [-5, -4 + bob]);
    p(iron, [-8, -9 + bob], [-4, -16 + bob], [4, -16 + bob], [8, -9 + bob], [4, -7 + bob], [-4, -7 + bob]);
    p(rust, [-8, -5 + bob], [8, -5 + bob], [6, -3 + bob], [-6, -3 + bob]);
    r(-6, -12 + bob, 12, .7, "#302d34");
    for (const rx of [-9, -3, 3, 8]) r(rx, -9 + bob, 1, .8, "#8a858d");
    r(-7, -7 + bob, 1.2, 1.8, "#6d4030");
    p(ink, [-4, -16 + bob], [0, -22 + bob], [4, -16 + bob]);
    p(ore, [-2.2, -16 + bob], [0, -20.5 + bob], [2.2, -16 + bob]);
    p("#c47d38", [-1.6, -17 + bob], [0, -19.5 + bob], [.8, -17.4 + bob]);
    r(-.5, -19.8 + bob, 1.1, 2.2, oreHi);
    p(ink, [5, -14.5 + bob], [7, -17.5 + bob], [8.8, -14.5 + bob]);
    p(ore, [5.7, -14.5 + bob], [7, -16.6 + bob], [8.1, -14.5 + bob]);
    if (!rear) {
      p(ink, [-4, -11 + bob], [4, -11 + bob], [3.5, -7 + bob], [-3.5, -7 + bob]);
      p(copper, [-3, -10.5 + bob], [3, -10.5 + bob], [2.5, -7.5 + bob], [-2.5, -7.5 + bob]);
      r(-2.4, -10.2 + bob, 4.8, 2.6, "#3a2c2a");
      r(-1.7, -9.7 + bob, 3.4, 1.8, frame % 2 ? oreHi : ore);
    }
  }
}

export function paintFrostHare(r: Rect, p: Shape, frame: number, facing: Facing) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const rise = [0, 3, -6, -2][frame];
  const reach = [0, -4, 7, 4][frame];
  const earSweep = [0, -2, -5, -2][frame];
  const ink = "#2d3b4b", shade = "#778e9f", coat = "#b9ccd0", white = "#e8efea";
  const tip = "#536980", ear = "#a7b0ba", ice = "#8fbdc7";

  if (side) {
    p(ink, [-12, -12 + rise], [-16, -16 + rise], [-20, -15 + rise], [-22, -11 + rise],
      [-19, -7 + rise], [-13, -8 + rise]);
    p(white, [-14, -11 + rise], [-17, -14 + rise], [-19, -13 + rise], [-20, -11 + rise],
      [-17, -9 + rise], [-14, -9 + rise]);
    for (const [x, far, hind] of [[-9, true, true], [7, true, false], [-12, false, true], [10, false, false]] as const) {
      const footX = x + (hind ? -reach : reach) + (far ? 1 : 0);
      const y = (far ? -1 : 3) + (frame === 2 ? -4 : frame === 3 && hind ? -2 : 0);
      const knee = x + (hind ? 4 : 0);
      const heel = footX - (hind ? 5 : 2);
      const toe = footX + (hind ? 7 : 4);
      p(ink, [x - 4, -11 + rise], [x + 4, -12 + rise], [knee + 3, -5 + rise],
        [toe, y - 3], [toe, y], [heel, y], [heel - 1, y - 3], [knee - 3, -5 + rise], [x - 4, -7 + rise]);
      p(far ? shade : coat, [x - 2, -10 + rise], [x + 2, -10 + rise], [knee + 1, -5 + rise],
        [toe - 2, y - 2], [heel, y - 1], [knee - 1, -5 + rise]);
      if (!far) r(footX, y - 2, hind ? 4 : 2, 1, white);
    }
    p(ink, [-16, -10 + rise], [-16, -18 + rise], [-12, -24 + rise], [-5, -26 + rise],
      [2, -24 + rise], [6, -20 + rise], [14, -17 + rise], [15, -11 + rise], [10, -6 + rise],
      [3, -6 + rise], [-2, -8 + rise], [-10, -5 + rise]);
    p(shade, [-14, -10 + rise], [-14, -17 + rise], [-11, -22 + rise], [-5, -24 + rise],
      [1, -22 + rise], [5, -18 + rise], [12, -16 + rise], [13, -11 + rise], [9, -8 + rise],
      [3, -8 + rise], [-2, -10 + rise], [-10, -7 + rise]);
    p(coat, [-13, -13 + rise], [-12, -18 + rise], [-9, -22 + rise], [-4, -24 + rise], [1, -21 + rise],
      [5, -17 + rise], [10, -16 + rise], [10, -12 + rise], [4, -10 + rise], [-1, -13 + rise], [-7, -10 + rise]);
    p(white, [-12, -16 + rise], [-9, -21 + rise], [-4, -23 + rise], [1, -21 + rise], [3, -17 + rise],
      [-2, -16 + rise], [-7, -14 + rise], [-11, -12 + rise]);
    p(ice, [-10, -13 + rise], [-7, -15 + rise], [-5, -13 + rise], [-7, -11 + rise]);

    const hx = frame === 2 ? 13 : 10;
    const hy = -20 + rise;
    for (const far of [true, false]) {
      const x = hx + (far ? 1 : -3);
      const bend = (far ? -4 : -7) + earSweep;
      const top = hy - (far ? 20 : 22);
      p(ink, [x - 3, hy - 1], [x - 4 + bend, top + 4], [x - 3 + bend, top + 1], [x + bend, top],
        [x + 4 + bend, top + 2], [x + 5 + bend, top + 6], [x + 3, hy - 1]);
      p(far ? shade : coat, [x - 1, hy - 3], [x - 2 + bend, top + 4], [x + bend, top + 2],
        [x + 3 + bend, top + 4], [x + 3 + bend, top + 6], [x + 1, hy - 3]);
      p(tip, [x - 2 + bend, top + 4], [x - 1 + bend, top + 2], [x + 2 + bend, top + 2],
        [x + 3 + bend, top + 5], [x + bend, top + 7]);
      if (!far) p(ear, [x + bend, top + 7], [x + 2 + bend, top + 6], [x + 1, hy - 4], [x - 1, hy - 4]);
    }
    const head: Shape = (color, ...points) => p(color, ...points.map(([x, y]): [number, number] => [hx + x, hy + y]));
    head(ink, [-8, 0], [-6, -5], [-1, -8], [5, -7], [9, -3], [12, 1], [11, 5], [6, 8], [-2, 8], [-7, 5]);
    head(coat, [-6, 0], [-4, -4], [0, -6], [5, -5], [7, -2], [10, 1], [9, 4], [5, 6], [-1, 6], [-5, 4]);
    head(white, [-4, -1], [-1, -5], [3, -5], [6, -2], [9, 1], [6, 4], [1, 5], [-3, 3]);
    r(hx + 4, hy - 2, 2.5, 2.5, ink);
    r(hx + 4.5, hy - 1.5, 1, 1, "#cfab7b");
    r(hx + 10, hy + 1, 2, 1.5, ink);
    return;
  }

  const headY = (rear ? -24 : -22) + rise;
  for (const dir of [-1, 1]) {
    const x = dir * 4;
    const out = dir * (2 + (frame === 2 ? 3 : 0));
    const fartherEar = rear ? dir < 0 : dir > 0;
    const y = headY - 22 + (fartherEar ? 2 : 0);
    p(ink, [x - 3, headY + 1], [x - 4 + out, y + 5], [x - 2 + out, y + 1], [x + 1 + out, y],
      [x + 4 + out, y + 3], [x + 4 + out, y + 7], [x + 3, headY + 1]);
    p(rear ? shade : coat, [x - 1.5, headY - 1], [x - 2 + out, y + 6], [x - 1 + out, y + 2],
      [x + 1 + out, y + 2], [x + 2 + out, y + 5], [x + 1, headY - 1]);
    p(tip, [x - 2 + out, y + 6], [x - 1 + out, y + 2], [x + 1 + out, y + 2], [x + 2 + out, y + 5], [x, y + 8]);
    if (!rear) p(ear, [x - 1 + out, y + 8], [x + 1 + out, y + 7], [x + 1, headY - 2], [x - 1, headY - 2]);
  }
  if (rear) {
    p(ink, [-8, headY + 5], [-7, headY - 4], [-3, headY - 8], [3, headY - 8],
      [7, headY - 4], [8, headY + 5]);
    p(coat, [-6, headY + 4], [-5, headY - 3], [-2, headY - 6], [2, headY - 6], [5, headY - 3], [6, headY + 4]);
  }
  const foot = frame === 2 ? -1 : 3;
  for (const dir of [-1, 1]) {
    const hindY = foot - (rear ? (frame === 3 ? 2 : 0) : 2);
    p(ink, [dir * 7, -15 + rise], [dir * 13, -13 + rise], [dir * 16, -8 + rise],
      [dir * 15, hindY - 4], [dir * 17, hindY - 2], [dir * 16, hindY], [dir * 7, hindY], [dir * 6, -8 + rise]);
    p(rear ? coat : shade, [dir * 7, -13 + rise], [dir * 12, -11 + rise], [dir * 14, -7 + rise],
      [dir * 13, hindY - 4], [dir * 15, hindY - 2], [dir * 9, hindY - 2], [dir * 8, -8 + rise]);
  }

  const width = rear ? 14 : 13;
  p(ink, [-width, -7 + rise], [-width, -13 + rise], [-10, -20 + rise], [-5, -25 + rise], [5, -25 + rise],
    [10, -20 + rise], [width, -13 + rise], [width, -7 + rise], [8, -4 + rise], [-8, -4 + rise]);
  p(shade, [-width + 2, -8 + rise], [-width + 2, -13 + rise], [-8, -19 + rise], [-4, -23 + rise],
    [4, -23 + rise], [8, -19 + rise], [width - 2, -13 + rise], [width - 2, -8 + rise], [7, -6 + rise], [-7, -6 + rise]);
  p(coat, [-width + 3, -12 + rise], [-8, -18 + rise], [-4, -21 + rise], [4, -21 + rise], [8, -18 + rise],
    [width - 3, -12 + rise], [5, -8 + rise], [-5, -8 + rise]);
  if (rear) {
    p(white, [-8, -14 + rise], [-5, -20 + rise], [4, -21 + rise], [8, -17 + rise], [3, -15 + rise], [-2, -16 + rise]);
    p(ice, [-10, -11 + rise], [-8, -14 + rise], [-6, -11 + rise], [-8, -10 + rise]);
    p(ice, [10, -11 + rise], [8, -14 + rise], [6, -11 + rise], [8, -10 + rise]);
    p(ink, [-5, -8 + rise], [-3, -12 + rise], [3, -12 + rise], [5, -8 + rise],
      [4, -4 + rise], [-4, -4 + rise]);
    p(white, [-3, -8 + rise], [-2, -10 + rise], [2, -10 + rise], [3, -8 + rise], [2, -6 + rise], [-2, -6 + rise]);
    return;
  }

  for (const dir of [-1, 1]) {
    const x = dir * 5;
    p(ink, [x - 3, -7 + rise], [x + 2, -7 + rise], [x + 4, foot - 2],
      [x + 3, foot], [x - 2, foot], [x - 4, foot - 2]);
    r(x - 2, foot - 3, 4, 2, coat);
  }
  p(white, [-6, -15 + rise], [-3, -17 + rise], [3, -17 + rise], [6, -15 + rise],
    [6, -10 + rise], [3, -8 + rise], [-3, -8 + rise], [-6, -10 + rise]);
  const cheek = headY + 3;
  p(ink, [-11, cheek + 1], [-9, cheek - 5], [-5, cheek - 9], [5, cheek - 9], [9, cheek - 5],
    [11, cheek + 1], [9, cheek + 5], [5, cheek + 8], [-5, cheek + 8], [-9, cheek + 5]);
  p(white, [-9, cheek + 1], [-7, cheek - 4], [-4, cheek - 7], [4, cheek - 7], [7, cheek - 4],
    [9, cheek + 1], [7, cheek + 4], [4, cheek + 6], [-4, cheek + 6], [-7, cheek + 4]);
  for (const x of [-6, 3]) {
    r(x, cheek - 1, 3, 3, ink);
    r(x + 1, cheek - .5, 1, 1, "#cfab7b");
  }
  r(-1.5, cheek + 3, 3, 1.5, "#525864");
  r(-1, cheek + 5, 2, 1, shade);
}
