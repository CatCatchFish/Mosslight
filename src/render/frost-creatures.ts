import type { Facing } from "../engine/formation.ts";
import type { Shape } from "./pixel-sprite.ts";

const ink = "#26363d";
const shade = "#52656f";
const fleece = "#91a7ac";
const pale = "#c0cec9";
const snow = "#e4e9dc";
const frost = "#eff3df";
const iceRim = "#395e6e";
const iceBlue = "#528999";
const iceGlint = "#a0d5d3";

function at(p: Shape, x: number, y: number, mirror = 1): Shape {
  return (color, ...points) => p(color, ...points.map(([dx, dy]): [number, number] => [x + dx * mirror, y + dy]));
}

function iceShard(p: Shape, width: number, height: number, lean: number, lit: boolean) {
  p(iceRim, [-width, 1], [lean - 1.5, -height + 2], [lean + 1, -height], [width, -1], [width - 2, 3]);
  p(iceBlue, [-width + 1.5, 0], [lean, -height + 1.5], [width - 1.5, -0.5], [1, 1.5]);
  p(lit ? frost : iceGlint, [-width + 1, 0], [lean, -height + 1.5], [lean + 0.5, -height + 4], [-0.5, 0.5]);
}

const bearGait = [
  { reach: 3, foreLift: 0, hindLift: 1, shoulder: 0, rump: -1 },
  { reach: 1, foreLift: 0, hindLift: 2.5, shoulder: -1.5, rump: 0 },
  { reach: -3, foreLift: 1, hindLift: 0, shoulder: 0, rump: -1 },
  { reach: -1, foreLift: 2.5, hindLift: 0, shoulder: -1.5, rump: 0 },
];

export function paintFrostBear(p: Shape, frame: number, facing: Facing, charging: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const brace = charging && frame === 1;
  const rush = charging && frame === 2;
  const gait = bearGait[frame];
  const shoulder = brace ? -3.5 : rush ? 3 : gait.shoulder;
  const rump = brace ? 2 : rush ? -1 : gait.rump;
  const lit = brace || rush;

  const leg = (x: number, fore: boolean, far: boolean) => {
    const phase = far ? -1 : 1;
    const lead = fore !== far;
    const stride = lead ? gait.reach : -gait.reach;
    const reach = brace ? (fore ? -2 : 0) : rush ? (fore ? 5 : -4) : stride;
    const lift = brace ? (fore ? 3 : 0) : rush ? (far ? 2 : 1) : lead ? gait.foreLift : gait.hindLift;
    const y = (far ? -1.5 : 2) - lift;
    const root = fore ? -12 + shoulder : -13 + rump;
    const foot = x + (side ? reach : phase * (rush ? 2 : 0));
    p(ink, [x - 7, root + 2], [x - 5, root], [x + 6, root - 1], [x + 7, root + 4], [foot + 5.5, y - 4],
      [foot + 7, y - 1.5], [foot + 6, y + 2], [foot - 5.5, y + 2], [foot - 7, y], [x - 6, root + 5]);
    p(far ? shade : fleece, [x - 5.5, root + 2], [x - 4, root + 1], [x + 5, root + .5], [x + 5.5, root + 4],
      [foot + 4, y - 4], [foot + 5.5, y - 1], [foot + 4.5, y + 0.5], [foot - 5, y + .5], [foot - 5.5, y - 1], [x - 4.5, root + 5]);
    if (!far) {
      p(pale, [x - 4, root + .4], [x + 4, root + .3], [x + 5, root + 4], [foot + 2.5, y - 3], [foot - 3.5, y - 2.5]);
      if (!rear) {
        p(snow, [foot + .5, y - 1.3], [foot + 4.5, y - 1.5], [foot + 4.5, y + .5], [foot + .5, y + .5]);
        p(shade, [foot + 2.5, y - .9], [foot + 3.25, y - .9], [foot + 3.25, y + .5], [foot + 2.5, y + .5]);
      }
    }
  };

  if (side) {
    const tail = at(p, -21, -18 + rump);
    tail(ink, [2, -3], [-3, -2], [-5, 1], [-3, 4], [2, 4]);
    tail(pale, [1, -1.5], [-2.5, -1], [-3, 1.5], [0, 2.5]);

    leg(-12, false, true);
    leg(9, true, true);

    p(ink, [-23, -10 + rump], [-24, -19 + rump], [-19, -26 + rump], [-11, -29 + rump],
      [-5, -29 + rump], [3, -34 + shoulder], [11, -33 + shoulder], [19, -28 + shoulder],
      [22, -18 + shoulder], [18, -6 + shoulder], [11, -3.5 + shoulder], [5, -5 + shoulder],
      [-2, -4 + rump], [-13, -5 + rump], [-19, -6 + rump]);
    p(fleece, [-22, -12 + rump], [-22, -19 + rump], [-18, -24 + rump], [-10, -27 + rump],
      [-4, -27 + rump], [3, -32 + shoulder], [11, -31 + shoulder], [18, -26 + shoulder],
      [20, -17 + shoulder], [16, -7.5 + shoulder], [11, -5.5 + shoulder], [7, -7 + shoulder],
      [0, -6 + rump], [-14, -7 + rump]);
    p(shade, [-22, -17 + rump], [-18, -13 + rump], [-11, -15 + rump], [-7, -12 + rump],
      [1, -11 + rump], [8, -13 + shoulder], [12, -9 + shoulder], [17, -12 + shoulder],
      [13, -7 + shoulder], [2, -7 + shoulder], [-13, -9 + rump], [-21, -12 + rump]);
    p(pale, [-21, -18 + rump], [-17, -24 + rump], [-11, -26 + rump], [-3, -26 + rump],
      [4, -32 + shoulder], [11, -31 + shoulder], [17, -25 + shoulder], [15, -15 + shoulder],
      [10, -12 + shoulder], [11, -17 + shoulder], [5, -13 + shoulder], [-1, -14 + shoulder],
      [-6, -16 + rump], [-11, -14 + rump], [-13, -17 + rump], [-17, -15 + rump]);
    p(snow, [-18, -21 + rump], [-13, -24 + rump], [-5, -25 + rump], [4, -30.5 + shoulder],
      [11, -29.5 + shoulder], [15, -24 + shoulder], [10, -22 + shoulder], [7, -24 + shoulder],
      [2, -20 + shoulder], [-4, -21 + rump], [-8, -18 + rump], [-12, -20 + rump]);

    iceShard(at(p, -14, -25 + rump), 4, 5, -2, lit);
    iceShard(at(p, -6, -28 + rump), 4.5, 7.5, -2, lit);
    iceShard(at(p, 3, -31 + shoulder), 5, 10, -3, lit);
    iceShard(at(p, 10, -30 + shoulder), 3.5, 6.5, -1, lit);

    leg(-15, false, false);
    leg(11, true, false);

    const h = at(p, rush ? 20 : brace ? 15 : 17, -22 + shoulder + (brace ? -2 : rush ? 3 : 0));
    const jaw = lit ? 3 : 0;
    h(ink, [-4, -6], [-3, -11], [1, -11], [4, -8], [7, -5], [10, -4], [13, -2], [13, 1],
      [10, 3], [9, 6 + jaw], [4, 7 + jaw], [-3, 6], [-7, 3], [-8, -1], [-9, -6], [-7, -9], [-4, -9]);
    h(snow, [-7, -3], [-7.5, -6], [-6, -7.5], [-3.5, -5.5], [-1, -8.5], [2, -8], [6, -5],
      [9, -3], [11, -1], [10, 1.5], [6, 3], [1, 2], [-1, 5], [-4, 3]);
    h(fleece, [-6.5, -5.5], [-5.5, -6.5], [-4.5, -4.5], [-6, -4]);
    h(pale, [-4, 1.5], [1, 0], [4.5, 2], [9, 1.5], [8, 4 + jaw], [4, 5.5 + jaw], [-1, 4.5]);
    h(ink, [8, -3.5], [12, -2.5], [12.5, 0], [10, 1.5], [8, 0]);
    h(ink, [2, 2], [7, 2.5], [10, 0.5], [8, 3.5 + jaw], [4, 3.5 + jaw]);
    if (lit) h(frost, [6.5, 2.5], [8.5, 2], [7.5, 5]);
    h(ink, [1, -4.5], [5, -4], [4.5, -1.5], [2, -1.5]);
    h(lit ? "#e3ba78" : "#9b976d", [2.5, -3.5], [4.5, -3.5], [4.5, -2.5], [2.5, -2.5]);
    return;
  }

  leg(-8, rear, true);
  leg(8, rear, true);
  const b = at(p, 0, shoulder);
  b(ink, [-19, -11], [-20, -20], [-17, -27], [-10, -31], [0, -34], [10, -31], [17, -27], [20, -20],
    [19, -11], [14, -4.5], [7, -5], [0, -3.5], [-8, -5], [-14, -4.5]);
  b(fleece, [-18, -12], [-18, -20], [-15, -26], [-8, -29], [0, -32], [8, -29], [15, -26],
    [18, -20], [18, -12], [13, -6], [7, -7], [0, -5.5], [-7, -7], [-13, -6]);
  b(pale, [-17, -17], [-15, -24], [-8, -28], [0, -31], [8, -28], [15, -24], [17, -18],
    [14, -14], [11, -16], [7, -13], [1, -15], [-4, -13], [-9, -16], [-13, -14]);
  b(snow, [-15, -21], [-11, -26], [-5, -28], [0, -30], [6, -28], [12, -26], [15, -21],
    [10, -20], [6, -22], [2, -18], [-3, -21], [-8, -19], [-11, -21]);

  iceShard(at(b, -12, -26), 4, 7, -3, lit);
  iceShard(at(b, 11, -27), 4, 6, 2, lit);
  iceShard(at(b, 1, -32), 5, 9.5, -1, lit);
  leg(-12, !rear, false);
  leg(12, !rear, false);
  if (rear) {
    b(shade, [-6, -12], [-4, -16], [3, -16], [6, -12], [4, -8], [-3, -8]);
    b(snow, [-4.5, -12], [-3, -14.5], [2, -14.5], [4, -12], [2, -10], [-2, -10]);
    return;
  }

  const h = at(b, lit ? 0 : Math.sign(gait.reach) * .65, rush ? -15 : brace ? -24 : -20);
  for (const sign of [-1, 1]) {
    const ear = at(h, 9 * sign, -9, sign);
    ear(ink, [-3, -2], [-1, -5], [3, -5], [4, -3], [4, 1], [-2, 2]);
    ear(pale, [-1.5, -2], [0, -3.5], [2.5, -3.5], [2.5, 0], [-1, 0]);
    ear(shade, [0, -2], [2, -2], [2, 0], [0, 0]);
  }
  h(ink, [-13, -5], [-8, -10], [0, -11], [8, -10], [13, -5], [12, 2], [8, 5], [6, lit ? 11 : 7],
    [-6, lit ? 11 : 7], [-8, 5], [-12, 2]);
  h(pale, [-11, -5], [-8, -8], [0, -9.5], [8, -8], [11, -5], [10, 1], [5, 4],
    [4, lit ? 9 : 5.5], [-4, lit ? 9 : 5.5], [-5, 4], [-10, 1]);
  h(snow, [-10, -4], [-7, -8], [0, -8.5], [7, -8], [10, -4], [7, -3], [5, -4], [0, -2], [-5, -4], [-7, -3]);
  h(ink, [-8, -3.5], [-4, -2.5], [-4.5, -1], [-8, -1]);
  h(ink, [8, -3.5], [4, -2.5], [4.5, -1], [8, -1]);
  h(frost, [-6.5, -2], [-4, -3], [4, -3], [6.5, -2], [6, 2.5], [3.5, 4.5], [-3.5, 4.5], [-6, 2.5]);
  h(ink, [-3.5, -1], [3.5, -1], [2.5, 1.8], [0, 3], [-2.5, 1.8]);
  h(ink, [-4, 3.4], [0, 4.5], [4, 3.4], [4, lit ? 8 : 5], [-4, lit ? 8 : 5]);
  if (lit) {
    h("#8e5654", [-2, 6.5], [2, 6.5], [3, 8], [-3, 8]);
    h(frost, [-3.5, 4], [-1, 4.5], [-2.5, 6.5]);
    h(frost, [3.5, 4], [1, 4.5], [2.5, 6.5]);
  }
}

const yetiGait = [
  { reach: 4, nearLift: 0, farLift: 2, sway: -1, bob: 0 },
  { reach: 1, nearLift: 0, farLift: 4, sway: 1, bob: -1.5 },
  { reach: -4, nearLift: 2, farLift: 0, sway: 1, bob: 0 },
  { reach: -1, nearLift: 4, farLift: 0, sway: -1, bob: -1.5 },
];

export function paintFrostYeti(p: Shape, frame: number, facing: Facing, roaring: boolean, enraged: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const brace = roaring && frame === 1;
  const roar = roaring && frame === 2;
  const gait = yetiGait[frame];
  const bob = brace ? 2 : roar ? -2 : gait.bob;
  const sway = roaring ? 0 : gait.sway;
  const skin = "#687e84";
  const mane = "#d7dfd3";
  const blush = enraged ? "#b76558" : "#6b494b";
  const eyes = enraged ? "#ffb377" : roar ? "#fbde98" : "#bfb690";

  const leg = (x: number, near: boolean) => {
    const reach = roaring ? 0 : gait.reach * (near ? 1 : -1);
    const y = (near ? 4 : 1) - (roaring ? 0 : near ? gait.nearLift : gait.farLift);
    const f = x + (side ? reach : 0);
    const limb = at(p, f, y);
    const thigh = x - f;
    limb(ink, [thigh - 6, -15 + bob], [thigh + 7, -14 + bob], [3, -6], [7, -2],
      [7, 1], [3, 2], [-6, 2], [-7, -1], [-4, -7]);
    limb(near ? fleece : shade, [thigh - 4.8, -14 + bob], [thigh + 5.5, -13 + bob], [2, -6],
      [5.5, -2], [5.5, 0.5], [-5, 0.5], [-5, -1], [-2, -8]);
    limb(near ? mane : fleece, [thigh - 3.5, -14 + bob], [thigh + 4.5, -13 + bob], [1, -7],
      [3, -4], [-1, -5], [-2, -3], [-4, -5]);
    if (!rear) limb(skin, [0, -2.5], [4, -2.5], [5, -1], [4, .5], [-1, .5]);
  };

  const arm = (sign: number, far: boolean) => {
    // A bent elbow carries the swing so the forearm hangs like an ape's.
    const sx = side ? (far ? 5 : -6) : (rear ? 14 : 13);
    const pose = roar ? (side ? (far ? [15, -34, 20, -42] : [14, -33, 20, -41]) : [21, -31, 20, -40])
      : brace ? (side ? (far ? [10, -21, 14, -23] : [2, -20, 10, -23]) : rear ? [17, -21, 15, -23] : [14, -19, 7, -24])
      : side ? [sx + gait.reach * .65, -15, sx + gait.reach * 1.75, -5 - Math.abs(gait.reach) * .55]
      : [17, -17 + sign * gait.reach * .45, 19, -5 + sign * gait.reach * .9];
    const [ex, ey, fx, fy] = pose;
    const s = at(p, side ? 0 : sway, bob, sign);
    const sy = -32;
    s(ink, [sx - 7, sy + 1], [sx - 3, sy - 6], [sx + 4, sy - 7], [sx + 8, sy - 2], [ex + 6, ey - 3],
      [fx + 6, fy - 4], [fx + 7, fy + 2], [fx + 4, fy + 6], [fx - 4, fy + 6], [fx - 7, fy + 2],
      [ex - 7, ey + 2], [sx - 6, sy + 10]);
    s(far ? shade : fleece, [sx - 5, sy], [sx - 2, sy - 4.5], [sx + 4, sy - 5], [sx + 6, sy - 1],
      [ex + 4.5, ey - 2], [fx + 4.5, fy - 3], [fx + 5, fy + 2], [fx + 3, fy + 4.5],
      [fx - 3.5, fy + 4.5], [fx - 5.5, fy + 1], [ex - 5.5, ey + 1], [sx - 5, sy + 8]);
    s(far ? fleece : mane, [sx - 4, sy], [sx - 2, sy - 4], [sx + 3.5, sy - 4.5], [sx + 6, sy],
      [ex + 4, ey - 3], [fx + 3, fy - 4], [fx + 1, fy - .5], [fx - 1, fy - 2], [fx - 4, fy + 1],
      [ex - 3, ey - 1], [ex - 5, ey + 2], [sx - 3, sy + 6]);
    s(shade, [fx - 4, fy + .5], [fx - 1, fy - 1], [fx + 1, fy + 1], [fx + 4, fy - .5],
      [fx + 5, fy + 2], [fx + 3, fy + 4.5], [fx - 3.5, fy + 4.5]);
    s(skin, [fx + 1.5, fy + 1], [fx + 4.5, fy + .5], [fx + 4.5, fy + 3], [fx + 1.5, fy + 3.5]);
    if (!far) s(roar || enraged ? iceGlint : pale, [fx + 2, fy - 2], [fx + 4, fy - 3.5], [fx + 5.5, fy], [fx + 3, fy + .5]);
  };

  if (side) arm(-1, true);
  leg(side ? -8 : -9, false);
  leg(side ? 5 : 9, true);
  const b = at(p, sway, bob);
  if (side) {
    b(ink, [-17, -10], [-21, -20], [-21, -29], [-16, -37], [-10, -42], [-3, -44],
      [5, -43], [14, -37], [18, -31], [17, -21], [12, -11], [5, -8], [-1, -10], [-9, -7]);
    b(fleece, [-16, -12], [-19.5, -21], [-19.5, -29], [-15, -36], [-9, -40], [-3, -42],
      [5, -41], [13, -35], [16, -31], [15, -22], [10, -12], [5, -10], [-1, -12], [-9, -9]);
    b(shade, [-19, -22], [-14, -18], [-12, -19], [-8, -16], [-3, -18], [0, -14], [6, -16], [11, -17],
      [9, -12], [4, -10], [-1, -12], [-9, -9], [-16, -12]);
    b(mane, [-19, -26], [-17, -32], [-13, -37], [-8, -40], [-2, -42], [5, -41], [12, -36],
      [14, -30], [9, -24], [7, -30], [2, -23], [-2, -27], [-6, -23], [-10, -27], [-15, -25], [-14, -29]);
    b(snow, [-16, -32], [-10, -38], [-3, -41], [2, -40], [9, -36],
      [5, -33], [1, -35], [-3, -31], [-8, -34], [-13, -31]);
    arm(1, false);
  } else {
    b(ink, [-20, -24], [-19, -34], [-14, -40], [-7, -43], [0, -42], [7, -43], [14, -40],
      [19, -34], [20, -24], [15, -14], [12, -9], [6, -10], [0, -7], [-7, -10], [-13, -9], [-16, -14]);
    b(fleece, [-18.5, -24], [-17.5, -34], [-13, -39], [-7, -41.5], [0, -40.5], [7, -41.5], [13, -39],
      [17.5, -34], [18.5, -24], [14, -15], [11, -11], [6, -12], [0, -9], [-7, -12], [-12, -11], [-15, -15]);
    b(shade, [-16, -22], [-10, -18], [-5, -20], [0, -17], [5, -20], [10, -18],
      [16, -22], [13, -15], [10, -11], [4, -12], [0, -9], [-7, -12], [-12, -11]);
    b(mane, [-17, -29], [-15, -35], [-12, -38], [-6, -41], [0, -39], [7, -41], [14, -37],
      [17, -32], [16, -27], [12, -29], [10, -23], [6, -25], [3, -20], [-2, -25], [-7, -23], [-10, -27], [-15, -25]);
    if (rear) {
      b(snow, [-14, -35], [-6, -40], [0, -38], [7, -40], [14, -35], [10, -32],
        [6, -34], [3, -30], [0, -34], [-4, -31], [-8, -34], [-12, -32]);
      b(pale, [-5, -29], [-1, -30], [3, -27], [0, -25], [-4, -26]);
    }
    arm(-1, false);
    arm(1, false);
  }

  const h = at(b, side ? (brace ? 10 : 11) : 0, roar ? -33 : brace ? -30 : -32.5);
  const jaw = roar ? 4 : enraged ? 1.5 : 0;
  const horn = (q: Shape) => {
    q(ink, [-3, 1], [-4, -3], [-1, -5], [3, -8], [4, -13], [7, -11], [7, -6], [4, -2], [1, 2]);
    q(shade, [-2, 0], [-2.5, -2.5], [0, -4], [4.5, -8], [5, -11], [6, -10], [6, -6], [3.5, -2], [1, .5]);
    q(roar ? iceGlint : pale, [-.5, -3], [3.5, -6.5], [5, -10.5], [5.5, -8], [4.5, -5], [1, -2]);
    if (enraged) q("#e2bb84", [3.2, -8], [5, -11], [6, -10], [5.4, -7]);
  };

  if (side) {
    horn(at(h, 1, -4, -1));
    h(ink, [-10, -5], [-6, -10], [2, -11], [8, -8], [10, -5], [13, -2], [12, 2], [13, 5 + jaw],
      [9, 7 + jaw], [4, 7 + jaw], [1, 12 + jaw], [-2, 10 + jaw], [-6, 11], [-7, 7], [-11, 9], [-12, 2]);
    h(mane, [-9, -4], [-5, -8.5], [2, -9.5], [7, -7], [10, -3], [11, 1], [8, 4 + jaw],
      [5, 5 + jaw], [1, 10 + jaw], [-2, 8 + jaw], [-5, 9], [-5.5, 5], [-9, 6], [-10.5, 1]);
    h(skin, [-1, -6], [6, -6], [9.5, -3], [11, -1], [9, 1.5], [11, 4 + jaw], [8.5, 6 + jaw],
      [4, 5 + jaw], [0, 3], [-2, -1]);
    h(snow, [-8, -4], [-5, -8], [1, -9], [7, -7], [8.5, -5], [4, -5.5], [1, -3.5], [-2, -4.5], [-5, -2]);
    h(ink, [3, -4.5], [8, -4], [7.5, -1.5], [3.5, -2]);
    h(eyes, [4.5, -3.5], [7, -3], [6.5, -2], [4.5, -2.4]);
    h(ink, [5, .5], [10, 0], [10, 2], [8, 3], [10, 3 + jaw], [8, 5 + jaw], [4, 2 + jaw], [4, 2]);
    if (roar || enraged) h(blush, [5, 2], [9, 2], [9, 2.5 + jaw], [7.5, 3.5 + jaw], [5, 2.5 + jaw]);
    h(frost, [8, 1.5], [10, 1.5], [8.5, 3.8]);
  } else {
    horn(at(h, -7, -5, -1));
    horn(at(h, 7, -5));
    h(ink, [-12, -5], [-8, -10], [-2, -12], [2, -11], [7, -11], [11, -7], [13, -1],
      [11, 6], [7, 6 + jaw], [4, 10 + jaw], [0, 12 + jaw], [-2, 9 + jaw], [-6, 10 + jaw], [-8, 5], [-11, 6]);
    h(mane, [-10, -5], [-7, -8.5], [-2, -10.5], [2, -9.5], [7, -9.5], [10, -6], [11, -1],
      [9, 4], [6, 4 + jaw], [3, 9 + jaw], [0, 10 + jaw], [-2, 7 + jaw], [-5, 8 + jaw], [-7, 4], [-9, 4]);
    if (rear) {
      h(snow, [-8, -5], [-4, -9], [2, -9.5], [7, -8], [9, -4], [6, 0], [2, -3], [-1, 1], [-4, -1], [-7, 0]);
    } else {
      h(skin, [-8, -5], [-4, -7], [0, -6], [4, -7], [8, -5], [8, -1], [6, 2],
        [5, 5 + jaw], [0, 7 + jaw], [-5, 5 + jaw], [-6, 2], [-8, -1]);
      h(snow, [-9, -5], [-5, -8], [0, -7], [5, -8], [9, -5], [5, -4], [2, -5], [0, -3], [-2, -5], [-5, -4]);
      h(ink, [-7, -4], [-2, -3.5], [-2.5, -1], [-6.5, -1.5]);
      h(ink, [7, -4], [2, -3.5], [2.5, -1], [6.5, -1.5]);
      for (const sign of [-1, 1]) at(h, 0, 0, sign)(eyes, [3, -3], [6, -3.5], [6, -2], [3, -2]);
      h(shade, [-2, -2], [2, -2], [2.5, 0], [0, 1.5], [-2.5, 0]);
      h(ink, [-5, 2], [-2, 1], [2, 1], [5, 2], [4, 4.5 + jaw], [0, 5.5 + jaw], [-4, 4.5 + jaw]);
      if (roar || enraged) h(blush, [-3, 3], [3, 3], [3, 3.5 + jaw], [0, 4.5 + jaw], [-3, 3.5 + jaw]);
      h(frost, [-4.5, 2], [-2, 1.5], [-3, 4.5]);
      h(frost, [4.5, 2], [2, 1.5], [3, 4.5]);
    }
  }
}

export function paintFrostPorcupine(p: Shape, frame: number, facing: Facing, acting: boolean, spent: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const bracing = acting && frame < 2;
  const recoil = acting && frame === 2;
  const bob = bracing ? 2 + frame * 1.5 : recoil ? -2 : [0, -1.5, 0, -1][frame];
  const reach = acting ? 0 : [2.5, 0.5, -2.5, -0.5][frame];
  const rim = "#2c2838";
  const dark = "#4e3f54";
  const coat = "#7a6370";
  const buff = "#b49c94";
  const muzzle = "#d9c8aa";
  const frostBase = "#46627a";
  const frostMid = "#6998ad";
  const frostBright = "#c8ece8";
  const frostPeak = "#f3fcff";

  const paw = (x: number, y: number, dir: number, near: boolean) => {
    const f = at(p, x + (side ? reach * dir : 0), y - (reach * dir < 0 ? 1.8 : 0));
    f(rim, [-5, -9 + bob], [4, -9 + bob], [5, -1], [4, 1], [-4, 1], [-5, -1]);
    f(near ? coat : dark, [-3.5, -7 + bob], [3, -7 + bob], [3.5, -1], [-3.5, -0.5]);
    if (near && !rear) f(buff, [0, -3], [3.5, -2], [3.5, -0.8], [0, -0.5]);
  };

  paw(side ? -11 : -5, -0.5, -1, false);
  paw(side ? 7 : 5, -0.5, 1, false);
  const b = at(p, 0, bob);
  const width = side ? 21 : 15;

  // Rounded bulky body with frosted saddle armor under the dense quill layers
  b(rim, [-width, -7], [-width - 1, -18], [-width + 3, -25], [-width + 11, -30], [3, -31],
    [width - 4, -27], [width + 1, -19], [width, -9], [width - 6, -4.5], [-width + 5, -4]);
  b(dark, [-width + 1.5, -8], [-width + 1, -17], [-width + 4.5, -24], [-width + 11, -28.5], [2, -29.5],
    [width - 5, -26], [width - 1, -18], [width - 1.5, -10], [width - 7, -6], [-width + 6, -6]);
  b(coat, [-width + 2, -16], [-width + 6, -24], [-width + 11, -28], [3, -29], [width - 5, -25],
    [width - 2, -17], [width - 7, -11], [3, -12], [-4, -10], [-11, -12], [-width + 4, -11]);

  // Textured frost-crust mantle & crystalline root plates filling the back so it never looks bare
  if (!spent) {
    b(frostBase,
      [-width + 2, -15], [-width + 5, -23], [-width + 11, -27.5], [3, -28.5], [width - 6, -24.5],
      [width - 5, -16], [width - 9, -13], [2, -14], [-6, -12.5], [-width + 5, -13]);
    b("#587e94",
      [-width + 4, -18], [-width + 8, -24.5], [2, -26.5], [width - 8, -23],
      [width - 8, -17], [1, -16], [-8, -16]);
  } else {
    // Exposed warm soft fur & scattered crystal stubble when quills are spent
    b(buff, [-width + 4, -16], [-width + 8, -24], [2, -26], [width - 7, -22], [width - 7, -14], [-width + 6, -13]);
    b(muzzle, [-width + 7, -21], [-2, -25], [6, -23], [3, -18], [-6, -18]);
    b(coat, [-width + 5, -15], [-3, -16], [5, -15], [2, -12], [-7, -12]);
  }

  const quill = (x: number, y: number, lean: number, height: number, layer: 0 | 1 | 2, thick = 1) => {
    const q = at(b, x, y);
    const h = spent ? height * 0.34 : bracing ? height + 2.5 + frame * 1.4 : height;
    const skew = spent ? lean * 0.35 : bracing ? lean * (0.55 - frame * 0.14) : lean;
    const w = 2.7 * thick;
    const bodyCol = layer === 0 ? "#486580" : layer === 1 ? frostMid : "#7bb3c4";
    const hiCol = bracing ? frostPeak : layer === 2 ? frostPeak : layer === 1 ? frostBright : "#99c3cc";
    q(rim, [-w, 1], [skew - 0.3, -h], [skew + 1.4, -h + 1.2], [w, -0.8], [1.1, 2.6]);
    q(bodyCol, [-w + 1, 0.3], [skew + 0.4, -h + 1.6], [w - 1, -0.4], [0.4, 1.5]);
    q(hiCol, [-w + 1.2, -0.1], [skew + 0.5, -h + 1.5], [skew + 1.2, -h + 3.8], [0, -0.5]);
  };

  if (side) {
    // Layer 0 (far dorsal crest): 6 tall jagged crystal spines along the skyline
    const crest: readonly [number, number, number, number][] = [
      [-18, -21, -10, 11], [-14, -26, -8, 15], [-8, -29, -6, 17],
      [-1, -30, -5, 18], [6, -28, -4, 15], [12, -25, -3, 11],
    ];
    for (const [x, y, lean, h] of crest) quill(x, y, lean, h, 0, 1.05);

    // Layer 1 (upper-mid dense rows): 6 staggered quills bridging the upper back
    const midRow: readonly [number, number, number, number][] = [
      [-19, -16, -9, 10], [-14, -20, -8, 14], [-8, -23, -7, 15],
      [-2, -24, -5, 15], [4, -23, -4, 14], [10, -21, -3, 11],
    ];
    for (const [x, y, lean, h] of midRow) quill(x, y, lean, h, 1, 1.0);

    // Layer 2 (lower flank & rump cluster): 6 shorter stout quills filling the lower half cleanly
    const flankRow: readonly [number, number, number, number][] = [
      [-17, -11, -8, 8.5], [-12, -14, -7, 11], [-6, -16, -6, 11.5],
      [0, -17, -5, 11.5], [6, -16, -4, 10], [11, -15, -3, 8.5],
    ];
    for (const [x, y, lean, h] of flankRow) quill(x, y, lean, h, 2, 0.92);

    // Small frost crystal studs nestled at the base of the flank quills
    if (!spent) {
      for (const [sx, sy] of [[-14, -12], [-7, -13], [1, -14], [7, -13]]) {
        b(frostPeak, [sx - 1.2, sy], [sx, sy - 2], [sx + 1.2, sy], [sx, sy + 1]);
      }
    }
  } else {
    // Full radiating fan of quills for both Front and Rear views (3 layered rings)
    const outerFan: readonly [number, number, number, number][] = [
      [-14, -19, -8, 11], [-12, -25, -7, 15], [-6, -29, -4, 17],
      [0, -30, 0, 18.5], [6, -29, 4, 17], [12, -25, 7, 15], [14, -19, 8, 11],
    ];
    for (const [x, y, lean, h] of outerFan) quill(x, y, lean, h, 0, 1.02);

    const midFan: readonly [number, number, number, number][] = [
      [-13, -15, -8, 10], [-9, -20, -6, 13.5], [-3, -24, -2.5, 14.5],
      [3, -24, 2.5, 14.5], [9, -20, 6, 13.5], [13, -15, 8, 10],
    ];
    for (const [x, y, lean, h] of midFan) quill(x, y, lean, h, 1, 0.96);

    const innerFan: readonly [number, number, number, number][] = rear
      ? [[-10, -12, -6, 9], [-5, -16, -3, 11.5], [0, -18, 0, 12.5], [5, -16, 3, 11.5], [10, -12, 6, 9]]
      : [[-11, -13, -7, 8.5], [-6, -18, -4, 10.5], [0, -21, 0, 11], [6, -18, 4, 10.5], [11, -13, 7, 8.5]];
    for (const [x, y, lean, h] of innerFan) quill(x, y, lean, h, 2, 0.9);

    if (rear && !spent) {
      // Extra central lower spines on the rear view so the entire back forms a bristling dome
      for (const [x, y, lean, h] of [[-6, -10, -4, 7.5], [0, -12, 0, 9], [6, -10, 4, 7.5]] as const) {
        quill(x, y, lean, h, 2, 0.85);
      }
    }
  }

  paw(side ? -14 : -9, 3, 1, true);
  paw(side ? 10 : 9, 3, -1, true);
  if (rear) {
    b(rim, [-4.5, -7.5], [0, -9.5], [4.5, -7.5], [4, -4.5], [1, -3], [-3, -4]);
    b(buff, [-3, -6.8], [0, -8], [2.5, -6.8], [1.5, -4.5], [-2, -5.2]);
    return;
  }

  const head = at(b, side ? (bracing ? 13 : 15) : 0, bracing ? -12 : -15);
  if (side) {
    head(rim, [-8, 4], [-8, -3], [-5, -8], [-3, -10], [1, -9], [3, -5], [7, -3], [14, 0],
      [15, 3], [11, 6], [4, 8], [-4, 8]);
    head(buff, [-6, 3], [-6, -2], [-3, -7], [0, -7.5], [2, -4], [6, -1.5], [12, 1], [13, 3],
      [10, 4.5], [4, 6.5], [-4, 6.5]);
    head(muzzle, [1, 2], [5, 0], [12, 1], [13, 3], [8, 5], [3, 5.5]);
    head(dark, [-5, -4], [-3, -8], [0, -7], [1, -4], [-1, -2]);
    head(rim, [3.5, -2.5], [6.5, -2], [6.5, 0.5], [4, 0.5]);
    head(bracing ? "#f5c384" : "#dbac77", [5, -1.75], [6.25, -1.75], [6.25, -0.5], [5, -0.5]);
    head(rim, [11, 0.5], [14.5, 1], [14.5, 3.5], [12, 3.6]);
  } else {
    head(rim, [-11, -1], [-10, -8], [-6, -9], [-3, -6], [3, -6], [6, -9], [10, -8], [11, -1],
      [8, 4], [4, 8], [-4, 8], [-8, 4]);
    head(buff, [-9, -1], [-8.5, -6.5], [-6, -7], [-3, -4.5], [3, -4.5], [6, -7], [8.5, -6.5], [9, -1],
      [6.5, 3], [3, 6.5], [-3, 6.5], [-6.5, 3]);
    head(muzzle, [-5, 1.5], [0, -0.5], [5, 1.5], [3, 6.5], [-3, 6.5]);
    head(rim, [-3, 1.8], [3, 1.8], [2, 4.5], [-2, 4.5]);
    for (const s of [-1, 1]) {
      const eye = at(head, 5.5 * s, -1.5, s);
      eye(rim, [-1.3, -1], [1.7, -1], [1.7, 1], [-1.3, 1]);
      if (bracing) eye("#f5c384", [-0.25, -0.5], [1, -0.5], [1, 0.5], [-0.25, 0.5]);
    }
  }
}

const sailGait = [
  { bob: 0, arch: 1, fl: 4, fr: -2, hl: -4, hr: 2, sway: -1 },
  { bob: -2, arch: 2.5, fl: 6, fr: 1, hl: -6, hr: -1, sway: 0.5 },
  { bob: 0, arch: 0.5, fl: -2, fr: 4, hl: 2, hr: -4, sway: 1 },
  { bob: -1.5, arch: 2, fl: 1, fr: 5.5, hl: -1, hr: -5.5, sway: -0.5 },
] as const;

/**
 * 冰帆貂 (Ice-Sail Stoat)
 * Sleek snow-white winter weasel with rounded ears, blue-slate belly, and a crystalline tail sail
 * that folds upright while sprinting and fans out wide when low-gliding through turns.
 * All three orientations (side, front, rear) share identical ear, coat, and tail-sail anatomy.
 */
export function paintIceSail(p: Shape, frame: number, facing: Facing, gliding: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const gait = sailGait[frame];
  const bob = gliding ? 3.5 + (frame % 2) * 0.5 : gait.bob;
  const outline = "#243542";
  const slate = "#4e6a7c";
  const belly = "#7c9bac";
  const coat = "#d4e4e7";
  const bright = "#f1f7f0";
  const earInner = "#b98e98";
  const nose = "#d78b83";
  const sailRim = "#2e556e";
  const sailDeep = "#5393b0";
  const sailMid = "#8cd5ea";
  const sailHi = "#e5fbff";

  // Crystalline ice-sail tail: single streamlined upright fin when running,
  // unfurling into a broad three-ribbed crystalline fan when gliding low.
  const drawSail = () => {
    const flutter = (frame % 2 ? 1 : -1) * (gliding ? 0.8 : 0.5);
    if (side) {
      const tx = -14;
      const ty = -10 + bob * 0.65;
      const s = at(p, tx, ty);
      if (gliding) {
        // Broad unfurled three-ribbed fan sail sweeping back and high (matching axial fan)
        s(outline,
          [4, 2], [-3, 3.5], [-11, -2], [-15.5, -13 + flutter], [-11.5, -23 + flutter],
          [-3.5, -25 + flutter], [3, -18.5 + flutter], [5.5, -10], [5, -3]);
        s(sailDeep,
          [3, 1], [-2.5, 2], [-9.5, -2.5], [-13.5, -12.5 + flutter], [-10, -21 + flutter],
          [-3.5, -22.5 + flutter], [2, -16.5 + flutter], [4, -9], [4, -2.5]);
        s(sailMid,
          [-1, -1], [-8.5, -4], [-12, -12.5 + flutter], [-9, -19.5 + flutter],
          [-3.5, -21 + flutter], [1, -15.5 + flutter], [2.5, -8]);
        // Two crisp sail ribs echoing the axial three-ribbed fan
        s(sailRim, [0, -1], [-9.5, -12.5 + flutter], [-8.2, -14 + flutter], [1.2, -2.5]);
        s(sailRim, [1, -2], [-4.5, -19.5 + flutter], [-3, -19.5 + flutter], [2.2, -3]);
        s(sailHi, [-3.5, -21 + flutter], [-8.8, -19 + flutter], [-6.5, -13 + flutter], [-2, -14 + flutter]);
        s(sailHi, [-11.8, -12.5 + flutter], [-8.5, -12 + flutter], [-6.5, -7], [-9, -6]);
      } else {
        // Compact folded upright crystal fin
        s(outline,
          [4, 1], [-1, 2], [-7, -2], [-10, -11 + flutter], [-6, -17 + flutter],
          [-1, -14 + flutter], [2, -7], [4, -2]);
        s(sailDeep,
          [3, 0.5], [-1, 1], [-5.5, -2.5], [-8, -10.5 + flutter], [-5.5, -15 + flutter],
          [-1.5, -12.5 + flutter], [1, -6.5], [3, -2]);
        s(sailMid, [-2, -2], [-6.5, -10 + flutter], [-5, -14.2 + flutter], [-2, -11.5 + flutter], [0, -6]);
        s(sailHi, [-5, -14 + flutter], [-6.5, -10 + flutter], [-4.5, -9 + flutter], [-3.2, -11.5 + flutter]);
      }
      return;
    }

    // Axial (front & rear) sail — strictly matches the side profile:
    // Running: ONE sleek central upright ice fin rising from the tail.
    // Gliding: ONE broad symmetrical three-ribbed crystalline fan unfurling behind the lowered body.
    const sy = (rear ? -11 : -16) + bob * 0.7;
    const s = at(p, 0, sy);
    if (gliding) {
      // Wide arched crystalline fan (three faceted lobes fused into one broad sail)
      s(outline,
        [-4, 2], [-12, -3], [-16, -12 + flutter], [-11, -20 + flutter],
        [-4, -22 + flutter], [0, -24 + flutter], [4, -22 + flutter],
        [11, -20 + flutter], [16, -12 + flutter], [12, -3], [4, 2]);
      s(sailDeep,
        [-3, 1], [-10.5, -3.5], [-14, -11.5 + flutter], [-9.5, -18.5 + flutter],
        [-3.5, -20 + flutter], [0, -22 + flutter], [3.5, -20 + flutter],
        [9.5, -18.5 + flutter], [14, -11.5 + flutter], [10.5, -3.5], [3, 1]);
      s(sailMid,
        [-2, 0], [-9, -4], [-12, -11 + flutter], [-8, -17.5 + flutter],
        [0, -20.5 + flutter], [8, -17.5 + flutter], [12, -11 + flutter], [9, -4], [2, 0]);
      // Three radiating ice-sail ribs matching the side profile
      s(sailRim, [-1, 0], [-1, -19 + flutter], [1, -19 + flutter], [1, 0]);
      s(sailRim, [-2, -1], [-10, -14 + flutter], [-8.5, -15.5 + flutter], [-1, -2.5]);
      s(sailRim, [2, -1], [10, -14 + flutter], [8.5, -15.5 + flutter], [1, -2.5]);
      // Crisp glacier highlights across top facets
      s(sailHi, [-3, -19 + flutter], [0, -21 + flutter], [3, -19 + flutter], [0, -14 + flutter]);
      s(sailHi, [-11.5, -11.5 + flutter], [-8.5, -17 + flutter], [-6, -15 + flutter], [-8, -10.5 + flutter]);
      s(sailHi, [11.5, -11.5 + flutter], [8.5, -17 + flutter], [6, -15 + flutter], [8, -10.5 + flutter]);
    } else {
      // Single sleek central upright crystal fin behind the spine
      const lean = gait.sway * 1.1;
      s(outline,
        [-3.5, 2], [-5, -5], [-4 + lean, -13], [lean, -18.5],
        [4 + lean, -13], [5, -5], [3.5, 2]);
      s(sailDeep,
        [-2.5, 1], [-3.5, -5], [-2.8 + lean, -12.5], [lean, -16.5],
        [2.8 + lean, -12.5], [3.5, -5], [2.5, 1]);
      s(sailMid,
        [-1.5, 0], [-2.5, -6], [-1.8 + lean, -12.5], [lean, -16],
        [1.5 + lean, -12], [2, -5.5], [1, 0]);
      s(sailHi, [-1.8 + lean, -12.5], [lean, -16], [0.8 + lean, -11], [-0.5 + lean, -9]);
    }
  };

  if (side) {
    drawSail();

    const leg = (x: number, stride: number, far: boolean, fore: boolean) => {
      const rootY = -7 + bob;
      if (gliding) {
        // Low tucked sled-runner paws skimming the snow
        const gx = x + (fore ? 3 : -3);
        const y = far ? 0.5 : 2.5;
        p(outline, [gx - 4, rootY + 2], [gx + 4, rootY + 2], [gx + (fore ? 6 : 2), y], [gx - (fore ? 3 : 6), y]);
        p(far ? slate : belly, [gx - 2.5, rootY + 2.5], [gx + 2.5, rootY + 2.5], [gx + (fore ? 4.5 : 1), y - 1], [gx - (fore ? 2 : 4.5), y - 1]);
        if (!far) p(bright, [gx - 1, y - 2], [gx + (fore ? 4 : 1), y - 2], [gx + (fore ? 4 : 1), y - 1], [gx - 1, y - 1]);
        return;
      }
      const lift = stride > 1.5 ? 2.5 : stride < -1.5 ? 1.5 : 0;
      const fx = x + stride * 0.65;
      const fy = (far ? 0 : 2.5) - lift;
      p(outline, [x - 3, rootY], [x + 3, rootY], [fx + 3, fy - 2], [fx + 3.5, fy + 0.5], [fx - 2.5, fy + 0.5], [fx - 3, fy - 2]);
      p(far ? slate : belly, [x - 1.8, rootY + 0.5], [x + 1.8, rootY + 0.5], [fx + 1.8, fy - 1.5], [fx + 2, fy - 0.5], [fx - 1.8, fy - 0.5]);
      if (!far) p(coat, [fx - 1, fy - 2.2], [fx + 2, fy - 2.2], [fx + 2, fy - 0.8], [fx - 1, fy - 0.8]);
    };

    leg(-9, gait.hr, true, false);
    leg(8, gait.fr, true, true);

    // Long, sleek low-slung winter stoat body
    const arch = gliding ? -1 : gait.arch;
    p(outline,
      [-16, -9 + bob], [-15, -14.5 + bob], [-7, -17 - arch + bob], [5, -17 - arch * 0.5 + bob],
      [14, -15 + bob], [16, -9 + bob], [13, -4.5 + bob], [2, -4 + bob], [-11, -4.5 + bob]);
    p(belly,
      [-14.5, -9.5 + bob], [-13.5, -13.5 + bob], [-6.5, -15.5 - arch + bob], [5, -15.5 - arch * 0.5 + bob],
      [13, -13.5 + bob], [14.5, -9 + bob], [12, -6 + bob], [2, -5.5 + bob], [-10.5, -6 + bob]);
    p(coat,
      [-14, -11 + bob], [-13, -13.5 + bob], [-6.5, -15.5 - arch + bob], [5, -15.5 - arch * 0.5 + bob],
      [13, -13.5 + bob], [13.5, -10 + bob], [6, -9 + bob], [-7, -9 + bob]);
    p(bright,
      [-11, -13 + bob], [-6, -15 - arch + bob], [5, -15 - arch * 0.5 + bob],
      [11, -13.5 + bob], [8, -11 + bob], [-8, -11 + bob]);
    // Subtle slate frost stripe along upper flank
    p(slate, [-13, -8 + bob], [-2, -7.5 + bob], [10, -8 + bob], [8, -6.5 + bob], [-10, -6.5 + bob]);

    leg(-11, gait.hl, false, false);
    leg(10, gait.fl, false, true);

    // Compact rounded-ear stoat head extending forward
    const h = at(p, gliding ? 15.5 : 13.5, -12.5 + bob + (gliding ? 2 : 0));
    // Far small round ear
    h(outline, [0, -7], [2, -10.5], [5.5, -10], [6, -6.5]);
    h(coat, [1.2, -7], [2.4, -9], [4.5, -8.8], [4.8, -6.5]);
    // Head + pointed stoat muzzle
    h(outline,
      [-7, 1], [-7, -5], [-4.5, -9.5], [-0.5, -10], [2, -7], [6, -6.5],
      [10.5, -2.5], [12, 0.5], [10, 3.5], [4, 5], [-3, 5]);
    h(coat,
      [-5.5, 1], [-5.5, -4.5], [-3.8, -8], [-1, -8.3], [1.5, -5.5], [5.5, -5],
      [9.5, -1.8], [10.3, 0.4], [8.8, 2.5], [3.5, 3.5], [-2.5, 3.5]);
    h(bright,
      [-3, -5], [4.5, -5], [8.8, -1.5], [9.8, 0.5], [8.5, 2], [2, 2.5], [-3.5, 1]);
    // Near round ear inner
    h(slate, [-4.5, -7.5], [-1.5, -7.8], [-1, -5.5], [-4, -5]);
    h(earInner, [-3.8, -6.5], [-2, -6.8], [-1.8, -5.2], [-3.5, -5]);
    // Sharp slanted eye & pink nose
    h(outline, [2.5, -3.5], [6.5, -2.2], [5.8, -0.2], [2.8, -0.5]);
    h(bright, [4.6, -2.4], [5.6, -2.4], [5.6, -1.4], [4.6, -1.4]);
    h(nose, [9.2, -0.8], [11.2, -0.4], [11, 1.4], [9.2, 1.2]);
    return;
  }

  // Front (south) & Rear (north) — narrow agile stoat silhouette matching the side profile
  if (!rear) drawSail();

  // Paws (tucked slightly outward when gliding, alternating briskly when running)
  const axialPaw = (x: number, y: number, lift: number, far: boolean) => {
    const px = gliding ? x * 1.15 : x;
    const py = gliding ? y + 1 : y - lift;
    p(outline, [px - 3, py - 4], [px + 3, py - 4], [px + 3.2, py + 1], [px - 3.2, py + 1]);
    p(far ? slate : belly, [px - 1.8, py - 3], [px + 1.8, py - 3], [px + 2, py - 0.2], [px - 2, py - 0.2]);
    if (!far) p(coat, [px - 1.4, py - 2], [px + 1.4, py - 2], [px + 1.4, py - 0.8], [px - 1.4, py - 0.8]);
  };

  axialPaw(-5.5, 0, gait.hr > 0 ? 1.5 : 0, true);
  axialPaw(5.5, 0, gait.fr > 0 ? 1.5 : 0, true);

  // Sleek tapered stoat torso (not a wide hamster ball!)
  const bodyW = gliding ? 10.5 : 9.5;
  const topY = (gliding ? -16 : -18) + bob;
  p(outline,
    [-bodyW, -8 + bob], [-bodyW + 1, topY + 3], [-5, topY], [5, topY],
    [bodyW - 1, topY + 3], [bodyW, -8 + bob], [7.5, -3.5 + bob], [-7.5, -3.5 + bob]);
  p(belly,
    [-bodyW + 1.5, -8 + bob], [-bodyW + 2.2, topY + 3.5], [-4.5, topY + 1.5], [4.5, topY + 1.5],
    [bodyW - 2.2, topY + 3.5], [bodyW - 1.5, -8 + bob], [6.5, -5 + bob], [-6.5, -5 + bob]);
  p(coat,
    [-bodyW + 2, -10 + bob], [-bodyW + 2.5, topY + 3.5], [-4.5, topY + 1.5], [4.5, topY + 1.5],
    [bodyW - 2.5, topY + 3.5], [bodyW - 2, -10 + bob], [5, -8 + bob], [-5, -8 + bob]);
  p(bright,
    [-6.5, topY + 4], [-4, topY + 2], [4, topY + 2], [6.5, topY + 4], [4.5, -10 + bob], [-4.5, -10 + bob]);

  axialPaw(-6.5, 2.5, gait.hl > 0 ? 2 : 0, false);
  axialPaw(6.5, 2.5, gait.fl > 0 ? 2 : 0, false);

  if (rear) {
    // Rear head & compact low-set rounded ears matching side profile (sitting naturally on the shoulders)
    const h = at(p, 0, topY + 2);
    for (const s of [-1, 1]) {
      const ear = at(h, 6.2 * s, -4.5, s);
      ear(outline, [-2.5, 1.5], [-2, -2.5], [1.5, -3], [3, -0.5], [2, 2.5]);
      ear(slate, [-1.3, 1], [-1, -1.3], [1, -1.6], [1.8, -0.2], [1, 1.5]);
    }
    h(outline, [-7.5, 0], [-6.5, -4.5], [-2.5, -6], [2.5, -6], [6.5, -4.5], [7.5, 0], [5, 3], [-5, 3]);
    h(coat, [-6, 0], [-5.2, -3.5], [-2, -4.7], [2, -4.7], [5.2, -3.5], [6, 0], [4, 2], [-4, 2]);
    h(bright, [-4.5, -2], [-2, -4.3], [2, -4.3], [4.5, -2], [3, 0], [-3, 0]);
    // Tail sail sits cleanly in front of the rear rump!
    drawSail();
    return;
  }

  // Front head: sleek low-slung triangular stoat face with compact rounded ears, sharp eyes, pink nose
  const h = at(p, 0, (gliding ? -11 : -13) + bob);
  for (const s of [-1, 1]) {
    const ear = at(h, 6.5 * s, -5.5, s);
    ear(outline, [-2.5, 2], [-2, -2.5], [1.5, -3], [3.2, -0.5], [2, 2.8]);
    ear(coat, [-1.4, 1.5], [-1, -1.4], [1, -1.7], [1.9, -0.2], [1.1, 1.8]);
    ear(earInner, [-0.4, 1], [-0.2, -0.6], [1, -0.6], [1.1, 1]);
  }
  h(outline,
    [-8.5, -1], [-7.5, -5.5], [-3, -7], [3, -7], [7.5, -5.5], [8.5, -1],
    [6.5, 4], [2.5, 6.2], [-2.5, 6.2], [-6.5, 4]);
  h(coat,
    [-7, -1], [-6, -4.5], [-2.5, -5.6], [2.5, -5.6], [6, -4.5], [7, -1],
    [5.2, 3], [2, 4.8], [-2, 4.8], [-5.2, 3]);
  h(bright,
    [-6, -1.5], [-4, -4.8], [4, -4.8], [6, -1.5], [4.5, 2.5], [1.8, 4.2], [-1.8, 4.2], [-4.5, 2.5]);
  // Sharp slanted stoat eyes (matching side profile) & soft slate cheek shadow
  for (const s of [-1, 1]) {
    h(outline, [s * 2.2, -1.4], [s * 5.6, -2.5], [s * 5.2, -0.3], [s * 2.6, -0.1]);
    h(bright, [s * 3.8, -1.8], [s * 4.6, -1.8], [s * 4.6, -1.0], [s * 3.8, -1.0]);
  }
  // Dainty tapered muzzle & pink nose
  h(nose, [-1.8, 1.5], [1.8, 1.5], [1.2, 3.3], [-1.2, 3.3]);
}
