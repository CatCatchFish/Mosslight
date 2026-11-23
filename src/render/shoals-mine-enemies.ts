import type { Facing } from "../engine/formation.ts";
import type { Point } from "../engine/types.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export function paintLilySkater(r: Rect, p: Shape, frame: number, facing: Facing, turning: boolean) {
  const axial = facing === "north" || facing === "south";
  const backwards = facing === "north";
  const orient = (a: number, b: number): Point => axial
    ? [b, a * (backwards ? -0.52 : 0.52)]
    : [a, b];
  const part: Shape = (color, ...points) => p(color, ...points.map(([a, b]) => {
    const [x, y] = orient(a, b);
    return [x, y - 8] as const;
  }));
  const drift = turning ? 3 : (frame % 2) * 2 - 1;
  for (const side of [-1, 1]) {
    for (const row of [-1, 1]) {
      const reach = axial ? 12 : 8;
      const legX = row * (16 + drift * side);
      const legY = side > 0 ? reach : -reach * 0.62;
      part("#294d45", [row * 4, 1], [legX * 0.72, legY * 0.8], [legX, legY],
        [legX + row * 4, legY + 0.7], [legX - row * 0.7, legY + 2], [row * 4, 4]);
      part("#9fbe75", [row * 6, 2], [legX, legY + 0.65], [legX + row * 2.5, legY + 0.7],
        [legX - row, legY + 1.1]);
    }
  }
  part("#254e43", [-13, -2], [-7, -8], [3, -7.5], [8, -4], [12, -4], [15, -1], [14, 4], [9, 5],
    [3, 5], [-6, 6], [-13, 2]);
  part("#63a96e", [-12, -2], [-7, -7], [2, -6.5], [8, -3], [4, 2], [-6, 4.5], [-11, 2]);
  part("#b3d487", [-9, -3], [-5, -5.5], [0, -5.2], [4, -3], [-2, -2], [-8, 1]);
  part("#e4ed9b", [-7, -3], [-3, -4.7], [1, -4], [-2, -3]);
  part("#376d55", [6, -2], [11, -3], [13.5, -1], [12.5, 2.6], [8.5, 3], [5.5, 1]);
  if (!backwards) {
    const [x, y] = orient(11, -1);
    r(x - 0.6, y - 9.5, 1.7, 1.65, "#fff2b0");
    r(x + 0.4, y - 9.2, 0.7, 0.95, "#26383a");
  }
}

export function paintMagnetBeetle(r: Rect, p: Shape, frame: number, facing: Facing, open: boolean, flying: boolean) {
  const axial = facing === "north" || facing === "south";
  const back = facing === "north";
  const bob = [0, 0.5, 1.5, 0.5][frame];
  const body: Shape = (color, ...points) => p(color, ...points.map(([x, y]) => [x, y - bob] as const));
  if (flying) {
    const span = [16, 22, 17, 12][frame];
    const lift = [13, 18, 11, 5][frame];
    for (const side of [-1, 1]) {
      body("#655571", [side * 3, -17], [side * span, -17 - lift], [side * (span + 2), -14 - lift],
        [side * (span - 4), -9 - lift], [side * 8, -13]);
      body("#b991c6", [side * 5, -17], [side * span, -16 - lift],
        [side * (span - 2), -12 - lift], [side * 7, -14]);
      body("#f8dbed", [side * 7, -17], [side * (span - 1), -15 - lift], [side * (span - 3), -14 - lift]);
    }
  }
  for (const side of [-1, 1]) {
    const step = side * (frame % 2 ? 2 : -1);
    for (const row of [-1, 1]) {
      const x = row * (axial ? 8 : 10);
      const y = side < 0 ? -5 : -2;
      p("#372c39", [x - 3, y - 4], [x + row * 4, y], [x + row * 5.5, y + 3 + step],
        [x + row * 2, y + 4 + step], [x + row, y + 1], [x - 3, y]);
    }
  }
  body("#392e40", [-17, -4], [-16, -13], [-12, -20], [-5, -24], [8, -23], [15, -17], [18, -9],
    [16, -3], [8, 1], [-9, 1]);
  body("#574759", [-15, -5], [-13, -14], [-6, -20], [7, -20], [13, -15], [15, -5], [8, -1], [-8, -1]);
  const shell = (offset: number) => {
    body("#745e61", [-15 + offset, -9], [-13 + offset, -16], [-7 + offset, -22], [1 + offset, -22],
      [4 + offset, -17], [2 + offset, -11], [-2 + offset, -6], [-11 + offset, -6]);
    body("#aa8580", [-13 + offset, -14], [-8 + offset, -20], [-2 + offset, -22],
      [-1 + offset, -19], [-6 + offset, -16], [-9 + offset, -11]);
    body("#987078", [4 - offset, -22], [10 - offset, -21], [15 - offset, -16], [16 - offset, -11],
      [9 - offset, -8], [4 - offset, -10], [2 - offset, -16]);
    body("#d3a791", [6 - offset, -21], [11 - offset, -19], [14 - offset, -15], [10 - offset, -16], [5 - offset, -19]);
  };
  if (open) {
    shell(-4);
    body("#723f78", [-8, -11], [-4, -20], [2, -23], [7, -18], [7, -11], [2, -7], [-5, -7]);
    body("#c789dc", [-5, -13], [0, -21], [5, -17], [5, -12], [1, -9]);
    body("#ffe5fd", [-1, -17], [1, -21], [4, -17], [1, -14]);
    r(-2, -11 - bob, 2, 1, "#e7a9e8");
  } else {
    shell(0);
    r(-0.5, -18 - bob, 2, 1, "#cb8ac3");
  }
  const frontX = axial ? 0 : 13;
  if (!back) {
    r(frontX - 3, -5 - bob, 7, 3, "#3e3042");
    r(frontX + 1, -5 - bob, 1.5, 1.25, "#f9cf87");
    if (axial) r(frontX - 3, -5 - bob, 1.5, 1.25, "#f9cf87");
  }
}

export function paintCableOverseer(r: Rect, p: Shape, frame: number, facing: Facing, winding: boolean) {
  const axial = facing === "north" || facing === "south";
  const tracks = [0, 2, 4, 2][frame];
  p("#342b32", [-24, -6], [-21, -18], [-15, -22], [16, -23], [23, -15], [25, -5], [20, 1], [-20, 1]);
  r(-19, -6, 38, 6, "#645148");
  for (let x = -17; x <= 17; x += 7) {
    r(x, -5, 5, 4, "#302b33");
    r(x + (tracks % 3) * 0.5, -4, 2, 1.5, "#b78658");
  }
  p("#5a4b4a", [-19, -12], [-17, -27], [-10, -32], [10, -33], [17, -28], [20, -15], [14, -9], [-13, -9]);
  p("#987561", [-17, -19], [-14, -27], [-8, -31], [10, -31], [15, -26], [7, -24], [-8, -25]);
  r(-15, -20, 30, 8, "#79554a");
  r(-14, -19, 28, 2, "#b18962");
  for (const x of [-14, -9, 9, 14]) r(x, -16, 2, 2, "#e2a96b");
  const drum = winding ? "#ffd27c" : "#b18456";
  p("#3e3033", [-9, -25], [-9, -34], [-5, -39], [6, -39], [10, -34], [10, -24], [5, -20], [-5, -20]);
  p(drum, [-6, -26], [-6, -34], [-3, -37], [5, -37], [7, -33], [7, -25], [4, -23], [-4, -23]);
  for (let row = 0; row < 4; row++)
    r(-4 + (row % 2) * 0.5, -35 + row * 3.15, 9, 1, row === tracks % 4 && winding ? "#fff2ae" : "#704939");
  if (facing !== "north") {
    const nose = axial ? 0 : 17;
    r(nose - 4, -16, 8, 4, "#403039");
    r(nose - 2, -15, winding ? 5 : 3.5, 1.75, winding ? "#fff2ba" : "#eea26e");
  }
  const hook = winding ? 30 : 23;
  p("#423237", [12, -25], [20, -22], [hook, -13], [hook, -8], [hook - 7, -7], [hook - 7, -11],
    [hook - 3, -11], [hook - 3, -14], [17, -19], [12, -21]);
  r(hook - 4, -12, 3, 1, winding ? "#f6d485" : "#aa7954");
}
