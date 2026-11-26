import type { Point } from "../engine/types.ts";
import type { Painter } from "./mire-expansion-art.ts";
import type { Shape } from "./pixel-sprite.ts";

const out = "#202127";

function offsetShape(p: Shape, ox: number, oy: number): Shape {
  return (color, ...points) => p(color, ...points.map(([x, y]): Point => [x + ox, y + oy]));
}

export const mireMatriarch: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side";
  const back = view === "back";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup";
  const striking = attack === "strike";
  const casting = skill && !windup && !striking;
  const step = casting ? 0 : windup ? -1.8 : striking ? 2.6 : Math.sin(f * Math.PI / 4) * 2.2;
  const bob = casting ? .7 + Math.sin(f * Math.PI / 2) * .6
    : windup ? -1.3 : striking ? 1.6 : [0, -.5, -.9, -.3, .2, .7, .3, -.4][f];
  const lean = side ? (windup ? -1.5 : striking ? 3.5 : 0) : 0;
  const pulse = casting ? .5 + .5 * Math.sin(f * Math.PI / 2) : 0;

  const skinDeep = "#403744";
  const skinDark = "#625064";
  const skinMid = "#8a6d83";
  const skinLight = "#b5939d";
  const bellyDeep = "#7d716c";
  const belly = "#b3a080";
  const bellyLight = "#e0c99c";
  const capDeep = "#49384f";
  const capDark = "#6a4b68";
  const capMid = "#926d8c";
  const capLight = "#bd94ad";
  const capRim = "#e0b9c1";
  const gillDeep = "#553b55";
  const gill = "#b37c9e";
  const gillLight = "#e6a9b4";
  const moss = "#526346";
  const mossLight = "#92a66d";
  const glow = casting ? "#e7f59b" : "#c8df83";
  const glowCore = casting ? "#ffffd5" : "#f2ffc0";
  const eye = striking ? "#ffbf62" : "#eab968";
  const eyeCore = "#fff1b7";

  const originX = side ? .5 + lean : 1;
  const q = offsetShape(p, originX, bob);
  const chip = (shape: Shape, x: number, y: number, w: number, h: number, color: string) =>
    shape(color, [x, y], [x + w, y], [x + w, y + h], [x, y + h]);
  const line = (points: readonly Point[], color: string, width: number) =>
    trace(points.map(([x, y]): Point => [x + originX, y + bob]), color, width);

  const leg = (x: number, dir: number, front: boolean, far: boolean) => {
    const stride = side ? step * dir * (front ? .8 : .5) : step * dir * .25;
    const raise = casting ? 0 : front && windup ? 3 : front && striking ? -1.2 : Math.max(0, dir * step - .7) * .7;
    const footX = x + dir * (front ? 5 : 6) + stride;
    const footY = (far ? 0 : 2.2) - raise;
    const kneeX = x + dir * (front ? 4 : 5);
    const kneeY = -7 - raise * .35;
    q(out, [x - 4.2, -12], [x + 4.4, -12], [kneeX + 4.3, kneeY],
      [footX + 5.8, footY], [footX + 4.2, footY + 3], [footX + 1.4, footY + 1.4],
      [footX + 2.8, footY + 3.6], [footX - 1.2, footY + 2.4], [footX - 4.2, footY + 3.1],
      [footX - 5.5, footY + .6], [kneeX - 4.3, kneeY]);
    q(far ? skinDark : skinMid, [x - 2.8, -11], [x + 2.8, -11], [kneeX + 2.8, kneeY + .5],
      [footX + 4.8, footY + .6], [footX + 2.9, footY + 1.8], [footX + .9, footY + .5],
      [footX + 1.8, footY + 2.5], [footX - 1.5, footY + 1.5], [footX - 3.6, footY + 1.9],
      [kneeX - 2.8, kneeY + .4]);
    if (!far) {
      q(skinLight, [x - 1.4, -9.8], [x + 1.5, -9.8], [kneeX + 1.2, kneeY + 1.5],
        [kneeX - 1, kneeY + 1.5]);
      for (const toe of [-3.4, .2, 3.8]) {
        q(out, [footX + toe - 1.2, footY + .3], [footX + toe + 1.4, footY + .2],
          [footX + toe + 1.8, footY + 2], [footX + toe, footY + 2.5]);
        q(bellyLight, [footX + toe - .6, footY + .7], [footX + toe + .8, footY + .6],
          [footX + toe + 1.1, footY + 1.5]);
      }
      chip(q, footX - 1.8, footY - 2.2, 3.2, 1.2, moss);
    }
  };

  const cap = (isSide: boolean, isRear: boolean) => {
    const crownLift = casting ? -2 - pulse * 1.5 : windup ? -.8 : 0;
    if (isSide) {
      q(out, [-25, -23], [-26, -30], [-20, -37 + crownLift], [-9, -42 + crownLift],
        [4, -44 + crownLift], [16, -40 + crownLift], [24, -34 + crownLift], [26, -26],
        [18, -21], [3, -20], [-11, -21]);
      q(capDeep, [-23, -24], [-24, -30], [-18.5, -35.5 + crownLift], [-8.5, -40 + crownLift],
        [3.5, -42 + crownLift], [15, -38.5 + crownLift], [22.5, -33 + crownLift], [23.5, -26],
        [16.5, -23], [2.5, -22], [-10, -23]);
      q(capDark, [-21, -29], [-19, -34 + crownLift], [-11, -38 + crownLift], [-2, -40 + crownLift],
        [8, -39 + crownLift], [18, -35 + crownLift], [22, -30], [18, -27], [3, -26], [-12, -27]);
      q(capMid, [-18, -32 + crownLift * .6], [-13, -36 + crownLift], [-5, -38.5 + crownLift],
        [4, -39 + crownLift], [13, -36 + crownLift], [19, -32], [14, -30], [1, -31], [-10, -30]);
      q(capLight, [-15, -34 + crownLift], [-10, -36.5 + crownLift], [-3, -37.5 + crownLift],
        [5, -37 + crownLift], [10, -35 + crownLift], [3, -34], [-7, -33.5]);
      q(capRim, [-21, -31], [-17, -35 + crownLift], [-11, -37 + crownLift], [-3, -38 + crownLift],
        [2, -37.4 + crownLift], [-4, -36.5 + crownLift], [-11, -35.5 + crownLift], [-17, -33]);
      q(gillDeep, [-21, -26], [-12, -25], [-3, -25.5], [8, -24], [20, -25], [23, -27],
        [14, -23], [2, -22], [-11, -23]);
      for (const [gx, gy] of [[-18, -26], [-11, -25.5], [-4, -25], [4, -24.5], [12, -24.5], [19, -25]] as const) {
        line([[gx, gy], [gx + 1.5, gy + 4.5]], out, 1.6);
        line([[gx, gy + .4], [gx + 1.2, gy + 3.7]], gill, .9);
      }
      for (const [sx, sy, size] of [[-17, -33, 2.3], [-7, -36, 2], [4, -34, 2.6], [14, -31, 1.8], [20, -29, 1.3]] as const) {
        q(out, [sx - size, sy - size * .55], [sx, sy - size], [sx + size, sy - size * .4],
          [sx + size * .7, sy + size * .65], [sx - size * .6, sy + size * .75]);
        q(skill ? glow : capRim, [sx - size * .65, sy - size * .3], [sx, sy - size * .7],
          [sx + size * .65, sy - size * .2], [sx + size * .4, sy + size * .35],
          [sx - size * .35, sy + size * .4]);
      }
      q(moss, [-23, -29], [-19, -31], [-16, -29], [-20, -27]);
      q(mossLight, [-22, -29.5], [-19.5, -30.5], [-18, -29.5]);
      return;
    }
    q(out, [-25, -23], [-25, -31], [-18, -39 + crownLift], [-8, -43 + crownLift],
      [5, -44 + crownLift], [17, -39 + crownLift], [25, -31], [25, -23], [16, -20], [-15, -20]);
    q(capDeep, [-23, -24], [-23, -31], [-17, -37 + crownLift], [-7, -41 + crownLift],
      [4, -42 + crownLift], [15, -37 + crownLift], [23, -30], [23, -24], [15, -22], [-14, -22]);
    q(capDark, [-20, -29], [-17, -35 + crownLift], [-8, -39 + crownLift], [3, -40 + crownLift],
      [14, -36 + crownLift], [20, -30], [18, -27], [4, -26], [-11, -27]);
    q(capMid, [-17, -32 + crownLift * .6], [-12, -36 + crownLift], [-4, -38.5 + crownLift],
      [5, -38 + crownLift], [13, -35 + crownLift], [17, -31], [11, -29], [-3, -30], [-12, -29]);
    q(capLight, [-14, -34 + crownLift], [-8, -37 + crownLift], [-1, -38 + crownLift],
      [7, -36.5 + crownLift], [11, -34 + crownLift], [3, -33], [-7, -33]);
    q(capRim, [-18, -32], [-13, -36 + crownLift], [-6, -38 + crownLift], [1, -38 + crownLift],
      [-5, -36.5 + crownLift], [-12, -35 + crownLift]);
    q(gillDeep, [-22, -25], [-12, -23.5], [0, -23], [12, -23.5], [22, -25],
      [19, -22], [10, -20.5], [0, -20], [-10, -20.5], [-19, -22]);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const gx = s * (5 + i * 4.2);
        line([[gx, -24 + i * .4], [gx + s * .8, -20 + i * .1]], out, 1.5);
        line([[gx, -23.6 + i * .4], [gx + s * .5, -20.5 + i * .1]], gill, .8);
      }
    }
    for (const [sx, sy, size] of [[-14, -34, 2.4], [-5, -37, 2], [5, -36, 2.5], [14, -32, 2.2], [0, -30, 1.6]] as const) {
      q(out, [sx - size, sy - size * .5], [sx, sy - size], [sx + size, sy - size * .4],
        [sx + size * .7, sy + size * .6], [sx - size * .6, sy + size * .7]);
      q(skill ? glow : capRim, [sx - size * .6, sy - size * .25], [sx, sy - size * .65],
        [sx + size * .6, sy - size * .15], [sx + size * .35, sy + size * .3],
        [sx - size * .3, sy + size * .35]);
    }
    if (isRear) {
      q(moss, [-18, -30], [-12, -33], [-5, -31], [-10, -28]);
      q(moss, [8, -33], [15, -31], [18, -27], [11, -28]);
      q(mossLight, [-16, -30.5], [-12, -31.5], [-10, -30]);
      q(mossLight, [12, -30.5], [15, -30], [16, -28.5]);
    }
  };

  const body = (isSide: boolean, isRear: boolean) => {
    if (isSide) {
      q(out, [-24, -9], [-24, -18], [-18, -27], [-7, -31], [9, -30], [21, -25],
        [26, -17], [24, -9], [15, -5], [-10, -5]);
      q(skinDeep, [-22, -10], [-22, -18], [-16, -25], [-6, -29], [8, -28],
        [19, -23], [23.5, -16], [21.5, -10], [13, -7], [-9, -7]);
      q(skinDark, [-18, -11], [-19, -19], [-13, -25], [-4, -27], [9, -26],
        [18, -22], [21, -15], [18, -10], [10, -8.5], [-10, -8.5]);
      q(skinMid, [-15, -13], [-15, -20], [-10, -24], [-2, -25], [8, -24],
        [16, -20], [18, -14], [14, -11], [5, -10], [-8, -11]);
      q(bellyDeep, [-14, -10], [1, -8], [17, -10], [20, -14], [11, -12], [-3, -10.5]);
      q(belly, [-9, -9.5], [3, -8.5], [15, -10], [16, -12], [4, -10], [-5, -11]);
      q(skinLight, [-13, -22], [-9, -24], [-7, -14], [-10, -13]);
      for (const [bx, by, size] of [[-17, -19, 1.8], [-7, -23, 1.4], [2, -20, 1.7], [11, -18, 1.3], [-11, -14, 1.1]] as const) {
        q(skinLight, [bx - size, by - size * .45], [bx, by - size * .7],
          [bx + size, by], [bx + size * .5, by + size * .55], [bx - size * .5, by + size * .5]);
      }
      line([[-18, -26], [-16, -21], [-18, -16], [-14, -11]], skinDeep, 1.2);
      return;
    }
    q(out, [-23, -9], [-24, -19], [-18, -28], [-8, -31], [8, -31], [18, -28],
      [24, -19], [23, -9], [14, -5], [-14, -5]);
    q(skinDeep, [-21, -10], [-22, -19], [-16, -26], [-7, -29], [7, -29],
      [16, -26], [22, -19], [21, -10], [12, -7], [-12, -7]);
    q(skinDark, [-18, -11], [-19, -20], [-14, -25], [-6, -27], [6, -27],
      [14, -25], [19, -20], [18, -11], [10, -9], [-10, -9]);
    q(skinMid, [-15, -13], [-15, -21], [-11, -24], [-5, -25], [5, -25],
      [11, -24], [15, -21], [15, -13], [9, -11], [-9, -11]);
    q(bellyDeep, [-13, -11], [13, -11], [16, -17], [10, -22], [-10, -22], [-16, -17]);
    q(belly, [-10, -12], [10, -12], [12, -17], [7, -20], [-7, -20], [-12, -17]);
    q(bellyLight, [-6, -13], [6, -13], [8, -17], [4, -18.5], [-4, -18.5], [-8, -17]);
    if (isRear) {
      q(skinDeep, [-4, -26], [4, -26], [5, -14], [-5, -14]);
      for (const s of [-1, 1]) {
        q(skinLight, [s * 7 - 2, -23], [s * 7 + 2, -22], [s * 9, -13], [s * 5, -14]);
      }
    }
  };

  const face = (isSide: boolean, isRear: boolean) => {
    if (isRear) {
      q(skinDeep, [-3, -25], [3, -25], [4, -13], [-4, -13]);
      line([[-1.5, -24], [1.5, -20], [-1, -16]], skinLight, 1);
      return;
    }
    if (isSide) {
      const hx = striking ? 2 : 0;
      const hq = offsetShape(q, hx, 0);
      hq(out, [7, -27], [17, -28], [24, -23], [26, -17], [21, -12], [10, -13], [5, -19]);
      hq(skinMid, [9, -25.5], [16.5, -26.5], [22.5, -22], [23.5, -17], [20, -14], [11, -15], [7, -19]);
      hq(skinLight, [10, -25], [16, -25.5], [20.5, -22], [21, -18], [16, -16], [11, -17]);
      hq(out, [11, -25], [17, -25.5], [19.5, -22.5], [13, -22]);
      hq(capDark, [12, -24.4], [16.5, -24.7], [18, -23], [13, -23.2]);
      chip(hq, 14.5, -24.2, 4.2, 3.1, out);
      chip(hq, 15.1, -23.7, 2.7, 1.8, eye);
      chip(hq, 16, -23.8, .9, 1.6, eyeCore);
      hq(out, [17, -18], [25, -17], [26, -15], [20, -14.5], [15, -16]);
      hq(belly, [18, -17.2], [23.8, -16.4], [24.2, -15.6], [19, -15.8]);
      for (const x of [19, 23]) chip(hq, x, -17.3, 1.2, 1.8, bellyLight);
      const sac = casting ? 1 + pulse * .3 : windup ? 1.16 : 1;
      hq(out, [7, -16], [15, -16 * sac], [17, -10 * sac], [12, -7 * sac], [5, -9], [3, -13]);
      hq(gillDeep, [8, -15], [13.8, -14.6 * sac], [15.2, -10.5 * sac],
        [11.5, -8.5 * sac], [6.2, -10], [4.5, -13]);
      hq(casting ? glow : gill, [8.8, -14], [12.8, -13.7 * sac], [13.8, -11 * sac],
        [11, -9.7 * sac], [7.3, -11], [6, -13]);
      hq(glowCore, [9.5, -13], [11.8, -12.6 * sac], [12.3, -11.4 * sac], [10.5, -11 * sac]);
      return;
    }
    q(out, [-15, -27], [-5, -29], [5, -29], [15, -27], [17, -18], [11, -11], [-11, -11], [-17, -18]);
    q(skinMid, [-13, -25.5], [-4, -27], [4, -27], [13, -25.5], [14.5, -18],
      [9, -13], [-9, -13], [-14.5, -18]);
    q(skinLight, [-11, -25], [-4, -26], [4, -26], [11, -25], [12, -19], [7, -15], [-7, -15], [-12, -19]);
    for (const s of [-1, 1]) {
      q(out, [s * 4 - 4, -25], [s * 4 + 4, -25], [s * 4 + 4.5, -21.5], [s * 4 - 4.5, -21.5]);
      q(capDark, [s * 4 - 3.2, -24.3], [s * 4 + 3.2, -24.3], [s * 4 + 3.4, -22.2], [s * 4 - 3.4, -22.2]);
      chip(q, s * 5 - 2, -23.8, 4.2, 3.1, out);
      chip(q, s * 5 - 1.4, -23.3, 2.7, 1.8, eye);
      chip(q, s * 5 - .5, -23.5, .9, 1.6, eyeCore);
      q(skinLight, [s * 12 - 2, -22], [s * 12 + 2, -22], [s * 13, -18], [s * 9, -18]);
    }
    q(out, [-11, -17], [11, -17], [8, -13], [-8, -13]);
    q(bellyDeep, [-9, -16.2], [9, -16.2], [6.5, -14], [-6.5, -14]);
    line([[-8, -16], [0, -14.8], [8, -16]], bellyLight, 1);
    for (const x of [-5, 4]) chip(q, x, -16.3, 1.5, 2.1, bellyLight);
    const sac = casting ? 1 + pulse * .3 : windup ? 1.16 : 1;
    q(out, [-8, -13], [8, -13], [10, -8 * sac], [5, -4.8 * sac], [-5, -4.8 * sac], [-10, -8 * sac]);
    q(gillDeep, [-6.5, -12], [6.5, -12], [8, -8 * sac], [4, -6 * sac], [-4, -6 * sac], [-8, -8 * sac]);
    q(casting ? glow : gill, [-4.5, -11.5], [4.5, -11.5], [5.8, -8.4 * sac],
      [2.8, -7.1 * sac], [-2.8, -7.1 * sac], [-5.8, -8.4 * sac]);
    q(glowCore, [-2.2, -11], [2.2, -11], [2.8, -8.8 * sac], [0, -8 * sac], [-2.8, -8.8 * sac]);
  };

  const spores = () => {
    if (!casting) return;
    for (const [sx, sy, phase] of [[-20, -30, 0], [18, -34, .3], [23, -21, .6], [-23, -17, .2]] as const) {
      const rise = (f + phase * 8) % 8 * .8;
      q(out, [sx - 1.5, sy - rise - 1.5], [sx + 1.5, sy - rise - 1.5],
        [sx + 1.5, sy - rise + 1.5], [sx - 1.5, sy - rise + 1.5]);
      q(glow, [sx - .8, sy - rise - .8], [sx + .8, sy - rise - .8],
        [sx + .8, sy - rise + .8], [sx - .8, sy - rise + .8]);
    }
  };

  if (side) {
    leg(-14.5, -1, false, true);
    leg(16, 1, true, true);
    body(true, false);
    cap(true, false);
    leg(-14, 1, false, false);
    face(true, false);
    leg(16, -1, true, false);
  } else {
    leg(-16, -1, false, back);
    leg(16, 1, false, !back);
    body(false, back);
    cap(false, back);
    leg(-16, 1, false, !back);
    face(false, back);
    leg(16, -1, true, false);
    if (back) leg(-16, -1, true, true);
  }
  spores();
};

export const sporePod: Painter = ({ r, p, trace, frame, attack }, view) => {
  const side = view === "side";
  const back = view === "back";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup";
  const striking = attack === "strike";
  const wobble = Math.sin(f * Math.PI / 4) * (windup ? .3 : 1.1);
  const stretch = windup ? 1.13 : striking ? .88 : 1;
  const lunge = side ? (windup ? -1.5 : striking ? 2.5 : 0) : 0;
  const bob = striking ? 1 : [0, -.4, -.8, -.4, .2, .6, .2, -.3][f];
  const q = offsetShape(p, lunge, bob);
  const skinDeep = "#3b4935";
  const skin = "#71814a";
  const skinLight = "#a8b96b";
  const bulb = "#536b3e";
  const bulbLight = "#91ad58";
  const glow = "#d4ef83";
  const core = "#f5ffc0";
  const gill = "#a5c46b";

  const bulbShape = (shape: Shape, isSide: boolean, isRear: boolean) => {
    const h = 19 * stretch;
    shape(out, [-11, -4], [-13, -12], [-10 + wobble, -h - 4], [-4, -h - 8],
      [5, -h - 7], [11 + wobble, -h - 1], [12, -9], [8, -3], [-7, -3]);
    shape(skinDeep, [-9.5, -5], [-11, -12], [-8.5 + wobble, -h - 3], [-3.5, -h - 6],
      [4.5, -h - 5], [9.5 + wobble, -h], [10, -9], [6.5, -5], [-6.5, -5]);
    shape(bulb, [-8, -9], [-7 + wobble, -h], [-2, -h - 4], [4, -h - 3],
      [8 + wobble, -h + 1], [8, -8], [5, -6], [-5, -6]);
    shape(bulbLight, [-5 + wobble * .5, -h + 1], [-1, -h - 3], [3, -h - 2],
      [5 + wobble * .5, -h + 1], [3, -h + 3], [-2, -h + 4]);
    for (const [sx, sy] of isSide
      ? [[-5, -14], [3, -17], [7, -11]] as const
      : [[-6, -15], [0, -18], [6, -15], [-3, -10], [4, -9]] as const) {
      shape(out, [sx - 1.6, sy - .8], [sx, sy - 1.8], [sx + 1.6, sy - .8],
        [sx + .8, sy + 1.1], [sx - .8, sy + 1.1]);
      shape(glow, [sx - .9, sy - .4], [sx, sy - 1.1], [sx + .9, sy - .4],
        [sx + .4, sy + .5], [sx - .4, sy + .5]);
    }
    if (!isRear) {
      if (isSide) {
        shape(out, [5, -12], [10, -11], [9, -7], [4, -8]);
        shape(glow, [6, -10.8], [8.8, -10.2], [8.2, -8.4], [5.8, -8.8]);
        shape(core, [7, -10.2], [8, -9.8], [7.6, -8.9], [6.8, -9.2]);
        shape(out, [6, -6.5], [11, -6], [9, -4.5], [5, -5]);
        shape(gill, [6.8, -6], [9.8, -5.7], [8.8, -5.1], [6.2, -5.5]);
      } else {
        for (const s of [-1, 1]) {
          shape(out, [s * 3 - 2.5, -11.5], [s * 3 + 2.5, -11.5], [s * 3 + 2.5, -8.5], [s * 3 - 2.5, -8.5]);
          shape(glow, [s * 3 - 1.6, -11], [s * 3 + 1.6, -11], [s * 3 + 1.6, -9], [s * 3 - 1.6, -9]);
          shape(core, [s * 3 - .6, -10.6], [s * 3 + .6, -10.6], [s * 3 + .6, -9.4], [s * 3 - .6, -9.4]);
        }
        shape(out, [-4, -6.5], [4, -6.5], [3, -4.5], [-3, -4.5]);
        shape(gill, [-2.8, -6], [2.8, -6], [2, -5], [-2, -5]);
      }
    } else {
      shape(skin, [-2, -h - 2], [2, -h - 2], [2.5, -7], [-2.5, -7]);
      shape(skinLight, [-1, -h], [1, -h], [1.2, -8], [-1.2, -8]);
    }
  };

  for (const dir of [-1, 1]) {
    const footX = dir * (side ? 7 : 8);
    q(out, [footX - 3, -7], [footX + 3, -7], [footX + dir * 5, -1],
      [footX + dir * 3.5, 1.5], [footX - dir * 2, .8], [footX - dir * 3, 1.8]);
    q(skin, [footX - 1.8, -6], [footX + 1.8, -6], [footX + dir * 3.8, -1.2],
      [footX + dir * 2.5, .7], [footX - dir * 1.3, .2]);
    q(skinLight, [footX + dir * 1, -2.2], [footX + dir * 3.3, -1.6], [footX + dir * 3.5, -.6]);
  }
  bulbShape(q, side, back);
  if (striking) {
    const dir = side ? 1 : 0;
    q(out, [dir * 7 - 3, -3], [dir * 14 - 2, -5], [dir * 16, -3], [dir * 14, -1], [dir * 7, -1]);
    q(glow, [dir * 8 - 2, -3.4], [dir * 13 - 1, -4.2], [dir * 14.5, -3], [dir * 13, -2], [dir * 8, -2]);
  }
};
