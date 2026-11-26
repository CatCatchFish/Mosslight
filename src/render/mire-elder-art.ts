import type { Point } from "../engine/types.ts";
import type { Painter } from "./mire-expansion-art.ts";
import type { Shape } from "./pixel-sprite.ts";

const out = "#172323";

function offsetShape(p: Shape, ox: number, oy: number): Shape {
  return (color, ...points) =>
    p(color, ...points.map(([x, y]): Point => [x + ox, y + oy]));
}

export const mireElder: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side";
  const back = view === "back";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup";
  const striking = attack === "strike";
  const casting = skill && !windup && !striking;
  const phase = (f * Math.PI) / 4;
  const stride = casting ? 0 : windup ? -1.2 : striking ? 2.2 : Math.sin(phase) * 2.2;
  const bob = casting
    ? .8 + Math.sin(phase * 2) * .6
    : windup
      ? -1.2
      : striking
        ? 1.1
        : [0, -.5, -.8, -.3, .3, .6, .2, -.4][f];
  const lean = side ? (windup ? -2.2 : striking ? 3 : 0) : 0;
  const sway = casting ? Math.sin(phase * 2) * 2 : Math.sin(phase) * 1.2;
  const pulse = casting ? .5 + .5 * Math.sin(phase * 2) : 0;

  const barkDeep = "#292326";
  const barkDark = "#44363a";
  const barkMid = "#67504c";
  const barkLight = "#947365";
  const barkRim = "#c09a7d";
  const mossDeep = "#223c36";
  const moss = "#416a58";
  const mossLight = "#83a17a";
  const reedDeep = "#3e5145";
  const reedMid = "#718166";
  const reedLight = "#b5b783";
  const tideDeep = "#235f5b";
  const tideMid = "#4bb9a4";
  const tideHi = "#c8fff0";
  const eye = striking ? "#ffd166" : "#f3b95e";
  const eyeCore = "#fff4c2";
  const bone = "#e6d5aa";
  const spore = casting ? "#b7f38d" : "#75c986";
  const sporeCore = casting ? "#f4ffd5" : "#d9ffb8";

  const q = offsetShape(p, lean, bob);
  const stroke = (points: readonly Point[], color: string, width: number) =>
    trace(points.map(([x, y]): Point => [x + lean, y + bob]), color, width);
  const chip = (shape: Shape, x: number, y: number, w: number, h: number, color: string) =>
    shape(color, [x, y], [x + w, y], [x + w, y + h], [x, y + h]);

  const rootFoot = (hipX: number, dir: number, far: boolean) => {
    const step = side ? stride * dir : stride * dir * .32;
    const lift = casting ? 0 : dir * stride < -.35 ? 1.4 : 0;
    const hipY = -12;
    const footX = hipX + step + (casting ? dir * 1.8 : 0);
    const footY = (far ? -.2 : 1.8) - lift;
    const kneeX = (hipX + footX) * .5 + dir * (side ? 1.2 : .3);
    const kneeY = -6.2 - lift * .3;
    q(out,
      [hipX - 4.4, hipY - 1.4], [hipX + 4.2, hipY - 1.4],
      [kneeX + 4.2, kneeY], [footX + 7.4, footY + .6],
      [footX + 5.2, footY + 2.8], [footX + 2.1, footY + 1.1],
      [footX + 3.1, footY + 3.5], [footX - .4, footY + 2.7],
      [footX - 3.2, footY + 3.4], [footX - 5.8, footY + 1.2],
      [kneeX - 4.2, kneeY]);
    q(far ? barkDark : barkMid,
      [hipX - 2.8, hipY - .2], [hipX + 2.7, hipY - .2],
      [kneeX + 2.7, kneeY + .7], [footX + 5.5, footY + 1],
      [footX + 3.4, footY + 1.9], [footX + 1.5, footY + .3],
      [footX + 2, footY + 2.2], [footX - .8, footY + 1.6],
      [footX - 3.7, footY + 2], [kneeX - 2.6, kneeY + .6]);
    if (!far) {
      q(barkLight, [hipX - 1.4, hipY + .8], [hipX + 1.1, hipY + .8],
        [kneeX + .7, kneeY + 2], [kneeX - 1.2, kneeY + 2]);
      for (const toe of [-4.2, 0, 4.1]) {
        q(out, [footX + toe - 1.2, footY + .1], [footX + toe + 1.3, footY],
          [footX + toe + 1.8, footY + 2], [footX + toe - .3, footY + 2.4]);
        q(barkRim, [footX + toe - .6, footY + .5], [footX + toe + .8, footY + .4],
          [footX + toe + 1.1, footY + 1.3]);
      }
      chip(q, footX - 2, footY - 2.2, 3.4, 1.3, moss);
    }
  };

  const rootSkirt = (isSide: boolean, isRear: boolean) => {
    const w = isSide ? 19 : 22;
    q(out, [-w + 3, -17], [-w, -11], [-w + 1, -5], [-w + 7, -2.2],
      [-w + 10, -5], [-7, -3.2], [-3, -1.2], [1, -3.5], [6, -1.4],
      [w - 6, -4], [w - 2, -2], [w - 1, -8], [w - 4, -16]);
    q(barkDark, [-w + 5, -15.5], [-w + 2.5, -10.5], [-w + 3.5, -6],
      [-w + 8, -4], [-w + 10.5, -6.5], [-6, -5], [-2, -3], [2, -5],
      [7, -3], [w - 7, -5.5], [w - 3.5, -4], [w - 3.5, -9], [w - 6, -14.5]);
    q(mossDeep, [-w + 5, -14], [-w + 7, -10], [-4, -8.2], [3, -9.5],
      [w - 5, -12], [w - 6, -14], [4, -11], [-4, -10.5]);
    q(moss, [-w + 7, -12.5], [-w + 9, -9.5], [-6, -7.5], [1, -8.5],
      [w - 7, -11], [w - 8, -12.5], [2, -10], [-5, -9]);
    for (const [rx, len, curl] of isSide
      ? [[-16, 7, -1.4], [-8, 5, .8], [8, 6, 1.3], [16, 7, -.8]] as const
      : [[-17, 7, -1], [-8, 5, .7], [8, 5, -.7], [17, 7, 1]] as const) {
      const tipX = rx + sway * .25 + curl;
      q(out, [rx - 1.4, -10], [rx + 1.4, -10], [tipX + 1.4, -10 + len],
        [tipX + .2, -8 + len], [tipX - 1.4, -10 + len]);
      q(moss, [rx - .7, -9.5], [rx + .7, -9.5], [tipX + .7, -10 + len],
        [tipX - .6, -9 + len]);
    }
    if (isRear) {
      q(mossLight, [-8, -13], [-2, -14.5], [1, -12.5], [-2, -9], [-8, -10]);
      chip(q, -5, -12.4, 2.2, 1, reedLight);
    }
  };

  const staff = (isSide: boolean) => {
    const x = isSide ? 18 : 21;
    const topX = x + (casting ? 4.5 : windup ? -4.5 : striking ? 6 : 1);
    const topY = casting ? -44 : windup ? -42 : striking ? -30 : -40;
    q(out, [x - 1.9, 3], [x + 1.9, 3], [topX + 1.6, topY], [topX - 1.6, topY]);
    q(barkDark, [x - 1, 2.5], [x + 1, 2.5], [topX + .7, topY + .5], [topX - .7, topY + .5]);
    q(barkLight, [x - .7, 2], [x + .2, 2], [topX + .2, topY + 1], [topX - .2, topY + 1]);
    for (const y of [-31, -22, -13]) chip(q, x - 1.8, y, 3.6, 1.4, out);
    for (const y of [-30.4, -21.4, -12.4]) chip(q, x - 1.1, y, 2.2, .7, tideMid);
    q(out, [topX - 1.5, topY + 2], [topX - 5.5, topY - 3], [topX - 4.5, topY - 6],
      [topX - 1, topY - 2], [topX + 2, topY + 1]);
    q(barkMid, [topX - 1, topY + .5], [topX - 4.4, topY - 3.4],
      [topX - 3.8, topY - 4.8], [topX - .5, topY - 1.2], [topX + 1.2, topY]);
    const bloom = casting ? 1 + pulse * .35 : 1;
    q(out, [topX + 2, topY - 6 * bloom], [topX + 6 * bloom, topY - 3 * bloom],
      [topX + 4 * bloom, topY + 2 * bloom], [topX, topY + 4 * bloom],
      [topX - 3 * bloom, topY + 1 * bloom], [topX - 2 * bloom, topY - 4 * bloom]);
    q(tideDeep, [topX + 1.6, topY - 5 * bloom], [topX + 4.8 * bloom, topY - 2.6 * bloom],
      [topX + 3.1 * bloom, topY + 1 * bloom], [topX, topY + 2.5 * bloom],
      [topX - 2 * bloom, topY], [topX - 1.2 * bloom, topY - 3 * bloom]);
    q(spore, [topX + .7, topY - 4 * bloom], [topX + 3.4 * bloom, topY - 2 * bloom],
      [topX + 2, topY + .4 * bloom], [topX, topY + 1.2 * bloom]);
    chip(q, topX - .5, topY - 2.4 * bloom, 2.1 * bloom, 2.1 * bloom, sporeCore);
    if (casting) {
      for (const [dx, dy] of [[-5, -1], [5, -1], [1, 5]] as const) {
        q(out, [topX + dx - 1.4, topY + dy - 1.4], [topX + dx + 1.4, topY + dy - 1.4],
          [topX + dx + 1.4, topY + dy + 1.4], [topX + dx - 1.4, topY + dy + 1.4]);
        q(spore, [topX + dx - .7, topY + dy - .7], [topX + dx + .7, topY + dy - .7],
          [topX + dx + .7, topY + dy + .7], [topX + dx - .7, topY + dy + .7]);
      }
    }
  };

  const clawArm = (isSide: boolean, near: boolean) => {
    const sx = isSide ? -12 : -15;
    const sy = -24 + (casting || windup ? -1 : 0);
    const reach = casting || windup ? 7 : striking ? 9 : 5;
    const handX = sx + (isSide ? -reach : -3 - reach * .35);
    const handY = casting ? -34 : windup ? -36 : striking ? -9 : -17 + Math.abs(stride) * .4;
    const elbowX = sx + (isSide ? -5 : -6);
    const elbowY = casting ? -31 : windup ? -32 : striking ? -15 : -20;
    q(out, [sx - 3.2, sy - 2.4], [elbowX, elbowY - 3], [handX, handY - 2.8],
      [handX - 5.4, handY - 5.4], [handX - 2, handY - 1.4],
      [handX - 5.8, handY + .4], [handX - 2.2, handY + 1.4],
      [handX - 4, handY + 4.8], [handX + 1.3, handY + 2.3],
      [elbowX + 1.6, elbowY + 2.8], [sx + 2.8, sy + 2.2]);
    q(near ? barkMid : barkDark, [sx - 1.8, sy - 1], [elbowX, elbowY - 1.3],
      [handX, handY - 1.2], [handX - 3.6, handY - 3.8], [handX - 1.4, handY - .7],
      [handX - 3.9, handY + .2], [handX - 1.4, handY + .8],
      [handX - 2.5, handY + 3.2], [handX + .4, handY + 1.2],
      [elbowX + .7, elbowY + 1.5], [sx + 1.5, sy + 1]);
    if (near) {
      q(barkLight, [sx - .8, sy - .4], [elbowX, elbowY - .5],
        [handX + .4, handY - .2], [elbowX, elbowY + .6]);
      q(moss, [elbowX - 2.4, elbowY - 2], [elbowX + 1.5, elbowY - 3.4],
        [elbowX + 2.4, elbowY + .5], [elbowX - 1, elbowY + 1.2]);
      q(mossLight, [elbowX - 1.1, elbowY + 1.2], [elbowX + 1.1, elbowY + 1.2],
        [elbowX + sway * .2 + .7, elbowY + 5.4], [elbowX + sway * .2 - .7, elbowY + 5]);
      if (casting || windup) {
        chip(q, handX - 2.4, handY - 5.4, 2.4, 2.4, spore);
        chip(q, handX - 1.6, handY - 4.7, 1.1, 1.1, sporeCore);
      }
    }
  };

  const staffArm = (isSide: boolean) => {
    const sx = isSide ? 8 : 15;
    const sy = -24 + (casting || windup ? -1 : 0);
    const handX = isSide ? 18 : 21;
    const handY = casting ? -27 : windup ? -32 : striking ? -10 : -20;
    const elbowX = isSide ? 14 : 19;
    const elbowY = casting ? -28 : windup ? -31 : striking ? -16 : -22;
    q(out, [sx - 3.4, sy - 2.6], [elbowX, elbowY - 3], [handX + 1.8, handY - 2.8],
      [handX + 4.2, handY - 1], [handX + 2.5, handY + 1.2],
      [handX + 4.1, handY + 3.2], [handX + .6, handY + 3.6],
      [elbowX + 1.6, elbowY + 3], [sx + 2.6, sy + 2.4]);
    q(barkMid, [sx - 1.8, sy - 1], [elbowX, elbowY - 1.4], [handX + .8, handY - 1.3],
      [handX + 2.8, handY], [handX + 1.4, handY + 1.8], [handX + 2.7, handY + 2],
      [handX + .4, handY + 2.1], [elbowX + .7, elbowY + 1.6], [sx + 1.4, sy + 1]);
    q(barkLight, [sx - .6, sy - .4], [elbowX, elbowY - .6],
      [handX + .3, handY - .4], [elbowX, elbowY + .5]);
    q(moss, [elbowX - 2, elbowY - 2.6], [elbowX + 1.6, elbowY - 3.2],
      [elbowX + 2.2, elbowY], [elbowX - .8, elbowY + 1]);
    for (const dy of [-1.4, .6, 2.4]) {
      q(out, [handX - 2.2, handY + dy - .7], [handX + 2.4, handY + dy - .7],
        [handX + 2.4, handY + dy + .7], [handX - 2.2, handY + dy + .7]);
      q(barkRim, [handX - 1.5, handY + dy - .35], [handX + 1.5, handY + dy - .35],
        [handX + 1.5, handY + dy + .35], [handX - 1.5, handY + dy + .35]);
    }
  };

  const crown = (isSide: boolean) => {
    const antlers = isSide
      ? [
          [[-9, -35], [-14, -41], [-18, -47], [-16, -50]],
          [[-13, -41], [-19, -42], [-22, -46]],
          [[8, -35], [13, -41], [17, -47], [15, -50]],
          [[13, -42], [19, -43], [21, -47]],
        ] as const
      : [
          [[-9, -35], [-14, -42], [-18, -48], [-16, -50]],
          [[-14, -42], [-20, -43], [-22, -47]],
          [[9, -35], [14, -42], [18, -48], [16, -50]],
          [[14, -42], [20, -43], [22, -47]],
        ] as const;
    for (const points of antlers) {
      stroke(points, out, 4.6);
      stroke(points, barkMid, 2.3);
      stroke(points.slice(0, 2), barkRim, .8);
    }
    for (const [cx, cy, rx, ry] of isSide
      ? [[-13, -35, 7, 3.5], [0, -37, 9, 4], [13, -35, 7, 3.5]] as const
      : [[-13, -35, 7, 3.5], [0, -38, 9, 4], [13, -35, 7, 3.5]] as const) {
      q(out, [cx - rx, cy], [cx - rx * .6, cy - ry], [cx + rx * .25, cy - ry * 1.2],
        [cx + rx, cy - ry * .2], [cx + rx * .6, cy + ry * .7], [cx - rx * .5, cy + ry]);
      q(mossDeep, [cx - rx * .8, cy], [cx - rx * .45, cy - ry * .7],
        [cx + rx * .2, cy - ry], [cx + rx * .75, cy - ry * .15],
        [cx + rx * .45, cy + ry * .45], [cx - rx * .4, cy + ry * .7]);
      q(moss, [cx - rx * .45, cy - ry * .25], [cx, cy - ry * .7],
        [cx + rx * .5, cy - ry * .25], [cx + rx * .2, cy + ry * .35],
        [cx - rx * .3, cy + ry * .35]);
    }
    for (const [rx, height, bend] of isSide
      ? [[-16, 10, -2], [-8, 13, 1], [1, 11, -1], [10, 12, 2], [16, 8, 1]] as const
      : [[-15, 10, -2], [-7, 13, 1], [1, 11, -1], [8, 13, 2], [15, 10, 2]] as const) {
      const tipX = rx + bend + sway * .2;
      q(out, [rx - .8, -34], [rx + .8, -34], [tipX + .7, -34 - height], [tipX - .7, -34 - height]);
      q(reedMid, [rx - .35, -34], [rx + .35, -34], [tipX + .3, -34 - height], [tipX - .3, -34 - height]);
      q(out, [tipX - 1.7, -34 - height + 1], [tipX + 1.7, -34 - height + 1],
        [tipX + 1.2, -36 - height], [tipX - 1.2, -36 - height]);
      q(casting ? spore : reedLight, [tipX - 1, -34 - height + 1.2],
        [tipX + 1, -34 - height + 1.2], [tipX + .7, -35.6 - height], [tipX - .7, -35.6 - height]);
    }
    for (const [mx, my, len] of isSide
      ? [[-18, -31, 8], [17, -31, 9]] as const
      : [[-18, -31, 8], [18, -31, 8]] as const) {
      q(out, [mx - 1.2, my], [mx + 1.2, my], [mx + sway * .4 + 1, my + len],
        [mx + sway * .4 - 1, my + len]);
      q(moss, [mx - .6, my + .4], [mx + .6, my + .4],
        [mx + sway * .4 + .5, my + len - .5], [mx + sway * .4 - .5, my + len - .5]);
    }
  };

  const face = (isSide: boolean, isRear: boolean) => {
    if (isRear) {
      q(barkDeep, [-3.2, -31], [3.2, -31], [4.2, -16], [-4.2, -16]);
      q(moss, [-10, -28], [-4, -30], [-5, -17], [-11, -19]);
      q(mossLight, [-8, -26], [-5.5, -27], [-6.5, -20], [-9, -21]);
      stroke([[-1.5, -29], [1, -25], [-1, -21], [1.8, -17]], tideDeep, 1.8);
      if (casting) stroke([[-1.5, -29], [1, -25], [-1, -21], [1.8, -17]], spore, .8);
      return;
    }
    if (isSide) {
      q(out, [3, -31], [12, -32], [17, -27], [17, -21], [11, -18], [4, -21]);
      q(barkLight, [4.5, -29.5], [11.5, -30.5], [15.2, -26.5], [15.2, -21.5],
        [10.5, -19.5], [5.5, -22]);
      q(out, [3.5, -30], [13.5, -31], [15.5, -28.5], [4.5, -27.5]);
      q(barkRim, [4.5, -29.4], [12.8, -30], [14.2, -28.8], [5, -28.3]);
      chip(q, 9.2, -27.8, 4.6, 3.2, out);
      chip(q, 10, -27.2, 2.8, 1.8, eye);
      chip(q, 11, -27.4, .9, 1.7, eyeCore);
      q(out, [12, -26], [17, -24], [18, -22], [13, -22.5]);
      q(barkRim, [12.5, -25.5], [16.2, -23.8], [16.8, -22.8], [12.8, -23.2]);
      q(out, [6, -21.5], [15, -21], [13, -18.5], [7, -19]);
      q(barkDark, [7.2, -20.8], [13.8, -20.5], [12.4, -19.2], [7.8, -19.7]);
      for (const x of [8, 12]) {
        q(bone, [x, -20.5], [x + 1.5, -20.5], [x + .7, -17.8]);
      }
      q(mossDeep, [4.5, -20], [8, -19.5], [7 + sway * .3, -12], [4.5 + sway * .3, -10.5]);
      q(moss, [5.5, -19], [7.2, -18.8], [6.4 + sway * .3, -12.5], [5.2 + sway * .3, -11.5]);
      return;
    }
    q(out, [-10.5, -31], [10.5, -31], [12, -24], [8, -18], [-8, -18], [-12, -24]);
    q(barkLight, [-8.8, -29.5], [8.8, -29.5], [10, -24], [6.8, -19.5],
      [-6.8, -19.5], [-10, -24]);
    q(out, [-11, -30.5], [0, -29], [11, -30.5], [9.5, -27], [0, -25.8], [-9.5, -27]);
    q(barkRim, [-9.5, -29.5], [0, -28.4], [9.5, -29.5], [8.5, -27.8],
      [0, -26.8], [-8.5, -27.8]);
    for (const s of [-1, 1]) {
      chip(q, s * 5.4 - 2.3, -27, 4.6, 3.2, out);
      chip(q, s * 5.4 - 1.5, -26.4, 2.8, 1.8, eye);
      chip(q, s * 5.4 - .7, -26.7, .9, 1.9, eyeCore);
    }
    q(out, [-2.1, -28], [2.1, -28], [3.1, -22], [0, -20], [-3.1, -22]);
    q(barkRim, [-1.2, -27], [1.2, -27], [1.8, -22.5], [0, -21], [-1.8, -22.5]);
    q(out, [-7, -21.5], [7, -21.5], [5.5, -18.8], [-5.5, -18.8]);
    q(barkDark, [-5.5, -20.8], [5.5, -20.8], [4.2, -19.4], [-4.2, -19.4]);
    for (const x of [-4.5, 3]) q(bone, [x, -20.7], [x + 1.5, -20.7], [x + .7, -18]);
    for (const s of [-1, 1]) {
      q(mossDeep, [s * 1.5, -19], [s * 5, -19], [s * 4 + sway * .2, -11.5],
        [s * 2 + sway * .2, -9.5]);
      q(moss, [s * 2.2, -18], [s * 4, -18], [s * 3.2 + sway * .2, -11.8],
        [s * 2.5 + sway * .2, -10.8]);
    }
  };

  const heart = (isSide: boolean) => {
    const x = isSide ? 7 : 0;
    const y = isSide ? -16 : -15.5;
    q(out, [x - 3.8, y - 3], [x, y - 5], [x + 3.8, y - 3], [x + 3, y + 2],
      [x, y + 4.2], [x - 3, y + 2]);
    q(tideDeep, [x - 2.7, y - 2], [x, y - 3.8], [x + 2.7, y - 2],
      [x + 2, y + 1.2], [x, y + 3], [x - 2, y + 1.2]);
    q(spore, [x - 1.6, y - 1.4], [x, y - 2.8], [x + 1.6, y - 1.4],
      [x + 1.1, y + .7], [x, y + 1.8], [x - 1.1, y + .7]);
    chip(q, x - .8, y - 1.8, 1.6, 1.6, sporeCore);
  };

  const body = (isSide: boolean, isRear: boolean) => {
    if (isSide) {
      q(out, [-17, -11], [-18, -23], [-14, -33], [-5, -37], [8, -36],
        [17, -30], [19, -20], [15, -11], [7, -9], [-9, -9]);
      q(barkDeep, [-15, -12], [-16, -23], [-12.5, -31.5], [-4.5, -35],
        [7.5, -34], [15, -29], [16.5, -20], [13, -12], [6, -10.5], [-8.5, -10.5]);
      q(barkMid, [-12.5, -13], [-13.5, -23], [-10.5, -30], [-3.5, -33],
        [7, -32], [13, -27.5], [14, -20], [11, -13], [5, -12], [-8, -12]);
      q(barkLight, [-10, -29], [-6, -31], [-4.5, -15], [-7, -14]);
      q(barkLight, [3, -31], [6.5, -30], [7, -15], [4.5, -14]);
      q(mossDeep, [-15, -25], [-9, -28], [-7, -22], [-11, -18], [-16, -20]);
      q(moss, [-13.5, -24], [-10, -25.5], [-9, -22], [-12, -20]);
      q(mossLight, [-12.5, -23.5], [-10.5, -24.5], [-11, -22]);
      stroke([[-13, -30], [-11, -25], [-13, -20], [-11, -14]], barkDark, 1.4);
      stroke([[8, -32], [7, -27], [9, -23], [7, -17]], barkDark, 1.4);
      return;
    }
    q(out, [-18, -11], [-20, -23], [-16, -33], [-8, -37], [8, -37],
      [16, -33], [20, -23], [18, -11], [10, -8], [-10, -8]);
    q(barkDeep, [-16, -12], [-17.5, -23], [-14, -31.5], [-7, -35],
      [7, -35], [14, -31.5], [17.5, -23], [16, -12], [8.5, -9.5], [-8.5, -9.5]);
    q(barkMid, [-13.5, -13], [-14.5, -23], [-11.5, -30], [-6, -33],
      [6, -33], [11.5, -30], [14.5, -23], [13.5, -13], [7.5, -11], [-7.5, -11]);
    q(barkLight, [-11, -30], [-7, -32], [-6, -14], [-9, -14]);
    q(barkLight, [7, -32], [11, -30], [9, -14], [6, -14]);
    q(mossDeep, [-17, -26], [-11, -29], [-8, -23], [-12, -17], [-18, -20]);
    q(mossDeep, [17, -26], [11, -29], [8, -23], [12, -17], [18, -20]);
    q(moss, [-15, -25], [-11.5, -27], [-10, -23], [-13, -20]);
    q(moss, [15, -25], [11.5, -27], [10, -23], [13, -20]);
    stroke([[-12, -31], [-10, -26], [-12, -21], [-10, -15]], barkDark, 1.4);
    stroke([[12, -31], [10, -26], [12, -21], [10, -15]], barkDark, 1.4);
    if (isRear) {
      q(mossDeep, [-7, -30], [7, -30], [9, -20], [5, -14], [-5, -14], [-9, -20]);
      q(moss, [-5, -28], [5, -28], [6.5, -21], [3.5, -16], [-3.5, -16], [-6.5, -21]);
      q(mossLight, [-3.5, -26], [1, -27], [2.5, -22], [-1, -19], [-4.5, -21]);
    }
  };

  const summonRoots = (foreground: boolean) => {
    const branches = [
      [[0, -2], [-8, -.5], [-16, 2], [-23, 1]],
      [[0, -2], [-6, 2], [-12, 4], [-18, 4]],
      [[0, -2], [7, .5], [15, 2], [23, 1]],
      [[0, -2], [6, 2], [12, 4], [18, 4]],
    ] as const;
    for (const points of branches) {
      stroke(points, out, foreground ? 2.4 : 4);
      if (foreground) stroke(points, barkMid, 1.2);
    }
    if (foreground) {
      for (const [x, y] of [[-23, 1], [-18, 4], [18, 4], [23, 1]] as const) {
        q(out, [x - 2, y - 1], [x, y - 3], [x + 2, y - 1], [x + 1.4, y + 1.4], [x - 1.4, y + 1.4]);
        q(spore, [x - 1.1, y - .8], [x, y - 2], [x + 1.1, y - .8], [x + .7, y + .7], [x - .7, y + .7]);
        chip(q, x - .4, y - 1.1, .9, .9, sporeCore);
      }
    }
  };

  const stomp = () => {
    for (const [x, dir, h] of [[-21, -1, 4], [-13, 1, 3], [12, -1, 3], [21, 1, 4]] as const) {
      q(out, [x - 1.6, 3], [x + dir * (2 + h), -h], [x + 1.6, 3]);
      q(barkLight, [x - .7, 2.5], [x + dir * (1.4 + h), -h + .7], [x + .7, 2.5]);
    }
    stroke([[-23, 2.8], [-12, 3.8], [0, 2.5], [12, 3.8], [23, 2.8]], tideMid, 1.6);
  };

  if (casting) summonRoots(false);

  if (side) {
    rootFoot(-10, 1, true);
    clawArm(true, false);
    staff(true);
    body(true, false);
    rootSkirt(true, false);
    rootFoot(10, -1, false);
    face(true, false);
    heart(true);
    crown(true);
    staffArm(true);
  } else {
    rootFoot(-11, 1, back);
    rootFoot(11, -1, !back);
    clawArm(false, false);
    staff(false);
    body(false, back);
    rootSkirt(false, back);
    face(false, back);
    if (!back) heart(false);
    crown(false);
    clawArm(false, true);
    staffArm(false);
  }

  if (casting) summonRoots(true);
  if (striking) stomp();
};
