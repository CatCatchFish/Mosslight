import type { Point } from "../engine/types.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export type View = "front" | "side" | "back";
export type OtterPose = "idle" | "walk" | "brace" | "windup" | "strike";
export type EnemyAttackPhase = "windup" | "strike";
export interface ArtOptions {
  gate?: number;
  fractured?: boolean;
  attack?: EnemyAttackPhase;
  attackStep?: number;
  otter?: { tier?: number; branch?: string; pose?: OtterPose };
}
type Palette = readonly [shade: string, mid: string, light: string];
export type Painter = (art: Art, view: View, skill: boolean) => void;
const ink = "#22272e";
const teal = "#9adcc2";
const amber = "#f9c86a";
const cream = "#fff3d0";

export interface Art {
  readonly frame: number;
  readonly live: boolean;
  readonly gate?: number;
  readonly fractured?: boolean;
  readonly attack?: EnemyAttackPhase;
  readonly attackStep?: number;
  readonly otter?: { tier?: number; branch?: string; pose?: OtterPose };
  p: Shape;
  r: Rect;
  fill(color: Palette, points: readonly Point[], shade?: number): void;
  gem(x: number, y: number, w: number, h: number, colors: Palette): void;
  trace(points: readonly Point[], color: string, width: number): void;
  eyes(x: number, y: number, count: 1 | 2, color?: string): void;
}

export function artFor(r: Rect, p: Shape, frame = 0, live = false, options?: ArtOptions): Art {
  const trace = (points: readonly Point[], color: string, width: number) => {
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1], [bx, by] = points[i];
      const steps = Math.ceil(Math.hypot(bx - ax, by - ay));
      for (let step = 0; step <= steps; step++) {
        const t = step / (steps || 1);
        r(ax + (bx - ax) * t - width / 2, ay + (by - ay) * t - width / 2, width, width, color);
      }
    }
  };
  const fill: Art["fill"] = (colors, points, lift = 1) => {
    const x = points.reduce((sum, pt) => sum + pt[0], 0) / points.length;
    const y = points.reduce((sum, pt) => sum + pt[1], 0) / points.length;
    const inset = (amount: number, dy: number) => points.map(([px, py]): Point =>
      [px + (x - px) * amount, Math.min(py + (y - py) * amount, py + dy)]);
    p(ink, ...points);
    p(colors[0], ...inset(.15, 2));
    p(colors[1], ...inset(.23, 1.5).map(([px, py], i): Point => [px - .25, py - (points[i][1] > y ? lift : .15)]));
    p(colors[2], ...points.filter(([px, py]) => px <= x + 2 && py <= y)
      .map(([px, py]): Point => [px + (x - px) * .27, py + 2.2]), [x + 1, y - 1.5], [x - 3, y + .5]);
  };
  const gem: Art["gem"] = (x, y, w, h, colors) =>
    fill(colors, [[x-w,y+h*.2],[x-w*.77,y-h*.61],[x-w*.3,y-h],[x+w*.53,y-h*.87],[x+w,y-h*.13],[x+w*.88,y+h*.55],[x+w*.42,y+h],[x-w*.58,y+h*.89]]);
  const eyes: Art["eyes"] = (x, y, count, color = amber) => {
    for (const offset of count === 2 ? [-4.2, 2.8] : [0]) {
      r(x+offset-1.3,y-1.1,4.0,3.8,ink);
      r(x+offset,y,2.3,2.1,color);
      r(x+offset+.2,y-.1,1,1,cream);
    }
  };
  return { r, p, fill, gem, trace, eyes, frame, live, ...options };
}

export const mudskipper: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side", front = view === "front", back = view === "back";
  const out = "#1c2d2c";
  const skinDeep = "#274345", skinMid = "#426f6c", skinLight = "#73a094", skinRim = "#a9cfc0";
  const bellyDeep = "#a89879", bellyMid = "#dfcfab", bellyHi = "#f8eed3";
  const finDeep = "#2f4732", finMid = "#587d47", finLight = "#8cb063", finRim = "#cdd986";
  const gillDeep = "#8c3a2b", gillMid = "#d96543", gillLight = "#ff9f6e";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const lunge = windup ? -3.5 : striking ? 5.5 : 0;
  const lift = skill ? -7.5 : windup ? 1.5 : striking ? -4.5 : [0, -0.7, -1.5, -2.0, -1.2, -0.3, 0.4, 0.2][f];
  const finStep = skill || striking ? 1.5 : Math.sin((f * Math.PI) / 4) * 2.2;

  if (side) {
    // 1. Far pectoral fin peeking behind
    const farFinY = skill ? -4 + lift * 0.4 : 0.5;
    p(out, [4 + lunge, -10 + lift], [13 + lunge + finStep, -7 + lift * 0.6], [15 + lunge + finStep, farFinY], [7 + lunge, farFinY + 1], [2 + lunge, -5 + lift]);
    p(finDeep, [5 + lunge, -9 + lift], [11.5 + lunge + finStep, -6.5 + lift * 0.6], [13 + lunge + finStep, farFinY - 0.5], [7 + lunge, farFinY], [3.5 + lunge, -5.5 + lift]);

    // 2. Serrated algae-frilled dorsal sail (flares high on skill/windup)
    const sailTop = (skill || windup ? -29.5 : striking ? -27 : -25.5) + lift;
    p(out, [-17 + lunge, -11 + lift * 0.8], [-19 + lunge, -20 + lift], [-12 + lunge, sailTop], [-5 + lunge, sailTop + 2], [2 + lunge, -17 + lift], [4 + lunge, -11 + lift]);
    p(finDeep, [-15.5 + lunge, -11.5 + lift * 0.8], [-17 + lunge, -19.5 + lift], [-11.5 + lunge, sailTop + 1.8], [-5.5 + lunge, sailTop + 3.5], [1 + lunge, -17 + lift], [2.5 + lunge, -11.5 + lift]);
    p(finMid, [-14.5 + lunge, -12 + lift * 0.8], [-15.5 + lunge, -19 + lift], [-11 + lunge, sailTop + 2.5], [-6 + lunge, sailTop + 4], [-0.5 + lunge, -16.5 + lift], [0 + lunge, -12 + lift]);
    for (const dx of [-13.5, -10, -6.5]) {
      trace([[dx + lunge, -12 + lift], [dx - 0.8 + lunge, sailTop + 4]], finRim, 1.0);
    }

    // 3. Unified streamlined mudskipper body + sculpted tail + broad amphibious head
    const tailWag = Math.sin((f * Math.PI) / 4) * 1.6;
    p(out,
      [-28 + lunge, -8 + lift * 0.3 + tailWag], [-27 + lunge, -17 + lift * 0.4 + tailWag], [-18 + lunge, -13 + lift * 0.6], [-11 + lunge, -18 + lift * 0.8],
      [-2 + lunge, -22 + lift], [10 + lunge, -23 + lift], [19 + lunge, -18 + lift], [23.5 + lunge, -12 + lift],
      [22 + lunge, -5 + lift], [13 + lunge, -2 + lift], [-2 + lunge, -2 + lift], [-15 + lunge, -3 + lift * 0.6], [-25 + lunge, -4 + lift * 0.4 + tailWag]);
    p(skinDeep,
      [-26 + lunge, -8.5 + lift * 0.3 + tailWag], [-25.5 + lunge, -15.2 + lift * 0.4 + tailWag], [-17.5 + lunge, -12 + lift * 0.6], [-10.5 + lunge, -16.5 + lift * 0.8],
      [-2 + lunge, -20.5 + lift], [9.5 + lunge, -21.5 + lift], [18 + lunge, -17 + lift], [21.8 + lunge, -11.8 + lift],
      [20.5 + lunge, -6 + lift], [12.5 + lunge, -3.5 + lift], [-2 + lunge, -3.5 + lift], [-14.5 + lunge, -4.5 + lift * 0.6], [-24 + lunge, -5.5 + lift * 0.4 + tailWag]);
    p(skinMid,
      [-24.5 + lunge, -10 + lift * 0.3 + tailWag], [-24 + lunge, -14.5 + lift * 0.4 + tailWag], [-17 + lunge, -12.5 + lift * 0.6], [-10 + lunge, -16 + lift * 0.8],
      [-1.5 + lunge, -20 + lift], [9 + lunge, -20.8 + lift], [17 + lunge, -16.5 + lift], [20.5 + lunge, -11.5 + lift],
      [18.5 + lunge, -7.5 + lift], [9 + lunge, -6.5 + lift], [-5 + lunge, -6.5 + lift], [-17 + lunge, -7 + lift * 0.5]);
    p(skinLight, [-12 + lunge, -15 + lift * 0.8], [-2 + lunge, -19.5 + lift], [8.5 + lunge, -20.2 + lift], [15.5 + lunge, -16 + lift], [11 + lunge, -13.5 + lift], [-4 + lunge, -13 + lift]);
    r(-3 + lunge, -18.8 + lift, 9, 1.4, skinRim);
    r(-23.5 + lunge, -13 + lift * 0.4 + tailWag, 3.2, 1.3, skinRim);
    for (const [sx, sy] of [[-12, -12], [-6, -14], [1, -13.5]]) r(sx + lunge, sy + lift, 2.5, 1.8, skinDeep);
    p(bellyDeep, [-11 + lunge, -5.5 + lift], [14 + lunge, -5.5 + lift], [18.5 + lunge, -7 + lift], [12 + lunge, -3.5 + lift], [-4 + lunge, -3.5 + lift]);
    p(bellyMid, [-9 + lunge, -5.8 + lift], [13 + lunge, -5.8 + lift], [16.5 + lunge, -6.8 + lift], [11 + lunge, -4.5 + lift], [-3 + lunge, -4.5 + lift]);
    r(2 + lunge, -5.8 + lift, 8, 1.1, bellyHi);

    // 4. Coral-orange gill frills + snapping jaw during strike
    for (let i = 0; i < 3; i++) {
      const gx = 5.5 + lunge + i * 2.4, gy = -13.5 + i * 1.4 + lift;
      r(gx - 0.6, gy - 0.5, 2.4, 3.6, gillDeep);
      r(gx, gy, 1.5, 2.6, skill || windup || striking ? gillLight : gillMid);
    }
    if (striking) {
      p(out, [12 + lunge, -10.5 + lift], [23 + lunge, -11.5 + lift], [22 + lunge, -4 + lift], [13 + lunge, -5 + lift]);
      p("#ffcf9e", [16 + lunge, -10 + lift], [18.5 + lunge, -10 + lift], [17 + lunge, -7.5 + lift]);
      // Crisp cyan-cream water-snap bite arc ahead of jaw
      trace([[21 + lunge, -17 + lift], [27 + lunge, -11 + lift], [24 + lunge, -3 + lift]], teal, 2.4);
      trace([[22 + lunge, -15 + lift], [26 + lunge, -10 + lift], [23.5 + lunge, -5 + lift]], "#ffffff", 1.1);
    } else {
      trace([[11 + lunge, -8 + lift], [20.5 + lunge, -8.5 + lift]], out, 1.5);
    }
    r(12.5 + lunge, -10.2 + lift, 6.5, 1.1, skinRim);

    // 5. Perched turret eye on crown
    p(out, [4.5 + lunge, -21 + lift], [6 + lunge, -27.5 + lift], [12.5 + lunge, -27.5 + lift], [14.5 + lunge, -21.5 + lift], [10 + lunge, -18.5 + lift]);
    p(skinMid, [6 + lunge, -21.5 + lift], [7.2 + lunge, -26 + lift], [11.5 + lunge, -26 + lift], [13 + lunge, -21.5 + lift]);
    r(7.8 + lunge, -25.2 + lift, 3.8, 3.6, out);
    r(8.6 + lunge, -24.5 + lift, 2.4, 2.3, skill || striking ? "#fff4cc" : amber);
    r(8.9 + lunge, -24.3 + lift, 1.1, 1.1, "#ffffff");
  } else {
    const sailY = (skill || windup ? -30 : -26.5) + lift;
    p(out, [-5.5, -15 + lift], [-4.5, sailY + 2], [0, sailY], [4.5, sailY + 2], [5.5, -15 + lift]);
    p(finMid, [-4, -15 + lift], [-3, sailY + 2.5], [0, sailY + 1.5], [3, sailY + 2.5], [4, -15 + lift]);
    r(-1.2, sailY + 2.5, 2.4, 6.5, finRim);

    const rx = front ? 15 : 13;
    p(out,
      [-rx, -9 + lift], [-rx + 1.5, -18 + lift], [-rx * 0.55, -22.5 + lift], [rx * 0.55, -22.5 + lift],
      [rx - 1.5, -18 + lift], [rx, -9 + lift], [rx * 0.72, -1.5 + lift], [-rx * 0.72, -1.5 + lift]);
    p(skinDeep,
      [-rx + 1.5, -9.5 + lift], [-rx + 2.8, -17.2 + lift], [-rx * 0.48, -21 + lift], [rx * 0.48, -21 + lift],
      [rx - 2.8, -17.2 + lift], [rx - 1.5, -9.5 + lift], [rx * 0.62, -3 + lift], [-rx * 0.62, -3 + lift]);
    p(skinMid,
      [-rx + 2.2, -10.5 + lift], [-rx + 3.2, -16.8 + lift], [-rx * 0.45, -20.5 + lift], [rx * 0.45, -20.5 + lift],
      [rx - 3.5, -16.8 + lift], [rx - 3, -10.5 + lift], [rx * 0.4, -5 + lift], [-rx * 0.5, -5 + lift]);
    p(skinLight, [-rx * 0.65, -15 + lift], [-rx * 0.35, -20 + lift], [rx * 0.25, -20 + lift], [rx * 0.35, -15.5 + lift], [-rx * 0.3, -14 + lift]);

    if (front) {
      p(bellyMid, [-8.5, -6.5 + lift], [8.5, -6.5 + lift], [6.5, -3 + lift], [-6.5, -3 + lift]);
      r(-5, -6.2 + lift, 8, 1.3, bellyHi);
      trace([[-8, -9.5 + lift], [0, -8.2 + lift], [8, -9.5 + lift]], out, 1.6);
      for (const d of [-1, 1]) {
        const gx = d * (skill || windup ? 13.5 : 11.5);
        p(out, [d * 9, -15 + lift], [gx + d * 3, -16.5 + lift], [gx + d * 4, -11 + lift], [gx + d * 2, -6.5 + lift], [d * 8.5, -7.5 + lift]);
        p(gillMid, [d * 9.5, -14 + lift], [gx + d * 1.8, -15 + lift], [gx + d * 2.6, -11 + lift], [gx + d * 1, -8 + lift], [d * 9, -8.5 + lift]);
        r(gx, -13.5 + lift, 1.8, 3, gillLight);
      }
      for (const d of [-1, 1]) {
        p(out, [d * 5.5 - 4.2, -19.5 + lift], [d * 5.5 - 3.5, -25.5 + lift], [d * 5.5 + 3.5, -25.5 + lift], [d * 5.5 + 4.2, -19.5 + lift]);
        p(skinMid, [d * 5.5 - 2.8, -20 + lift], [d * 5.5 - 2.2, -24.2 + lift], [d * 5.5 + 2.2, -24.2 + lift], [d * 5.5 + 2.8, -20 + lift]);
        r(d * 5.5 - 1.8, -23.6 + lift, 3.6, 3.4, out);
        r(d * 5.5 - 1.1, -22.9 + lift, 2.2, 2.2, skill || striking ? "#fff4cc" : amber);
        r(d * 5.5 - 0.8, -22.7 + lift, 1, 1, "#ffffff");
      }
    } else {
      p(skinRim, [-2.5, -20 + lift], [2.5, -20 + lift], [3, -10 + lift], [-2.5, -9 + lift]);
      for (const [sx, sy] of [[-7, -14], [4.5, -14], [-6, -9], [4.5, -9.5]]) r(sx, sy + lift, 2.6, 1.8, skinDeep);
      p(out, [-5, -8 + lift], [5, -8 + lift], [3.5, 0.5], [0, 2.5], [-3.5, 0.5]);
      p(skinMid, [-3.5, -7.5 + lift], [3.5, -7.5 + lift], [2.2, -0.5], [0, 1], [-2.2, -0.5]);
      r(-1, -6.5 + lift, 2, 5, skinLight);
    }
  }

  for (const d of side ? [-1] : [-1, 1]) {
    const spread = skill || striking ? 23 : 17.5;
    const finY = skill ? -4 + lift * 0.35 : 0.8;
    const ox = side ? lunge : 0;
    p(out, [ox + d * 3, -11.5 + lift], [ox + d * 11, -12 + lift], [ox + d * spread, -7.5 + finY * 0.5], [ox + d * (spread - 1), finY + 1], [ox + d * (spread - 8), finY + 2], [ox + d * 6, -2 + lift * 0.5]);
    p(finDeep, [ox + d * 4.5, -10.5 + lift], [ox + d * 10.5, -10.8 + lift], [ox + d * (spread - 1.6), -7 + finY * 0.5], [ox + d * (spread - 2.2), finY], [ox + d * (spread - 7.5), finY + 0.8], [ox + d * 7, -3 + lift * 0.5]);
    p(finMid, [ox + d * 5, -10 + lift], [ox + d * 10.5, -10.2 + lift], [ox + d * (spread - 2.5), -6.8 + finY * 0.5], [ox + d * (spread - 3.5), finY - 1.2], [ox + d * 8, -4.5 + lift * 0.5]);
    for (let k = 0; k < 3; k++) {
      trace([[ox + d * 7.5, -9 + lift], [ox + d * (spread - 2.5 - k * 2.8), finY - 3 + k * 1.4]], finRim, 1.0);
    }
  }

  if (skill) {
    p("#35574f", [-16, 1.5], [0, -0.5], [16, 1.5], [12, 4], [-12, 4]);
    for (const [mx, my] of [[-20, 0.5], [-12, 2.5], [10, 2], [18, -0.5]]) {
      r(mx, my, 4, 1.5, finRim);
      r(mx + 1, my - 1.6, 2, 1.4, teal);
    }
  }
  if (back) r(-2.2, -17.5 + lift, 4.4, 1.4, finRim);
};

export const shieldCrayfish: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#321f1e";
  const shellDeep = "#5c2e28", shellMid = "#9e4d3a", shellLight = "#cf7752", shellRim = "#f0a978";
  const shieldDeep = "#283e42", shieldMid = "#497173", shieldLight = "#7aa49c", shieldRim = "#b7d9c9";
  const mossDeep = "#395239", mossMid = "#698c53", mossLight = "#a6bf74";
  const boneMid = "#d9bc8c", boneHi = "#fff0cc";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const bob = windup ? -1.5 : striking ? 1.2 : Math.sin((f * Math.PI) / 4) * 0.7;

  // 1. Articulated walking legs (8-frame smooth gait)
  for (const d of [-1, 1]) {
    for (let i = 0; i < (side ? 3 : 2); i++) {
      const lx = side ? -8 + i * 6.5 : d * (7 + i * 2.5);
      const kneeX = side ? lx + 3.5 : d * (15.5 + i * 2.5);
      const step = skill || windup || striking ? 0 : Math.sin(((f + i * 2.5 + (d < 0 ? 4 : 0)) * Math.PI) / 4);
      const footX = side ? lx + 6 + step * 2.6 : d * (18 + i * 2.5 + step);
      const footY = (side ? 1.5 - (i % 2) : -0.5 + i * 2.2) - Math.max(0, step) * 2.4;
      trace([[lx, -10 + bob], [kneeX, -6 + bob * 0.5], [footX, footY]], out, 3.8);
      trace([[lx, -10 + bob], [kneeX, -6 + bob * 0.5], [footX, footY]], d < 0 && side ? shellDeep : shellMid, 1.8);
      r(footX - 1.2, footY - 1, 2.4, 1.6, boneMid);
    }
  }

  // 2. Segmented crayfish tail + arched carapace
  if (side) {
    p(out,
      [-28, -7 + bob], [-26, -15 + bob], [-21, -14 + bob], [-17, -19 + bob], [-6, -24 + bob], [8, -23 + bob], [14, -15 + bob],
      [12, -5 + bob], [-4, -3 + bob], [-19, -2 + bob], [-27, -3 + bob]);
    p(shellDeep,
      [-26.5, -7.5 + bob], [-24.5, -13.5 + bob], [-20, -13 + bob], [-16, -17.5 + bob], [-5.5, -22.5 + bob], [7.5, -21.5 + bob], [12.5, -14.5 + bob],
      [10.5, -6.5 + bob], [-4, -4.5 + bob], [-18.5, -3.5 + bob], [-25.5, -4.5 + bob]);
    p(shellMid,
      [-25, -8.5 + bob], [-23.5, -12.8 + bob], [-19.5, -12.5 + bob], [-15.5, -17 + bob], [-5, -22 + bob], [7, -21 + bob], [11.5, -14.5 + bob],
      [8.5, -8.5 + bob], [-5, -7.5 + bob], [-19, -7 + bob]);
    p(shellLight, [-14, -16.5 + bob], [-5, -21.5 + bob], [6, -20.5 + bob], [9, -16 + bob], [1, -14 + bob], [-11, -13 + bob]);
    r(-5, -20.5 + bob, 9, 1.5, shellRim);
    for (const sx of [-21, -16, -11]) {
      trace([[sx, -16 + bob], [sx + 1.5, -6 + bob]], out, 1.4);
      r(sx + 1.8, -14 + bob, 2, 4.5, shellLight);
    }
    p(mossMid, [-8, -20 + bob], [-2, -21.5 + bob], [0, -17.5 + bob], [-6, -17 + bob]);
    r(-6, -20 + bob, 3.5, 1.3, mossLight);
  } else {
    p(out,
      [-15, -13 + bob], [-12, -23 + bob], [0, -25.5 + bob], [12, -23 + bob], [15, -13 + bob], [11, -3 + bob], [5, 3], [-5, 3], [-11, -3 + bob]);
    p(shellDeep,
      [-13.5, -13 + bob], [-10.5, -21.5 + bob], [0, -24 + bob], [10.5, -21.5 + bob], [13.5, -13 + bob], [9.5, -4 + bob], [4, 1.5], [-4, 1.5], [-9.5, -4 + bob]);
    p(shellMid,
      [-12.5, -13.5 + bob], [-9.8, -21 + bob], [0, -23.5 + bob], [9.8, -21 + bob], [12.2, -13.5 + bob], [7.5, -6 + bob], [3, -1], [-3, -1], [-8, -6 + bob]);
    p(shellLight, [-9, -16 + bob], [-6, -21.5 + bob], [3, -22.5 + bob], [6, -17.5 + bob], [-1, -15 + bob]);
    for (const sy of [-10, -5]) {
      trace([[-7, sy + bob], [7, sy + bob]], out, 1.3);
      r(-4.5, sy - 2 + bob, 9, 1.4, shellLight);
    }
    p(mossMid, [-6, -21 + bob], [1, -22 + bob], [2, -18 + bob], [-5, -18 + bob]);
  }

  // 3. Sweeping crayfish antennae
  if (!back) {
    const ax = side ? 11 : 0, ay = -21 + bob;
    trace([[ax + (side ? 0 : -3.5), ay], [ax + (side ? 8 : -11), ay - 9], [ax + (side ? 17 : -19), ay - 12]], out, 2.6);
    trace([[ax + (side ? 0 : -3.5), ay], [ax + (side ? 8 : -11), ay - 9], [ax + (side ? 17 : -19), ay - 12]], shellRim, 1.1);
    if (!side) {
      trace([[3.5, ay], [11, ay - 9], [19, ay - 12]], out, 2.6);
      trace([[3.5, ay], [11, ay - 9], [19, ay - 12]], shellRim, 1.1);
    }
  }

  // 4. Secondary rust pincer & eyes
  const nearside = back ? -1 : 1;
  const scx = side ? 7 : -nearside * 14, scy = -7 + bob;
  p(out, [scx - 6.5, scy - 2], [scx - 4, scy - 6.5], [scx + 3, scy - 6.5], [scx + 7, scy - 2], [scx + 2, scy - 0.5], [scx + 6, scy + 3.5], [scx + 1, scy + 6.5], [scx - 5, scy + 5.5]);
  p(shellMid, [scx - 5, scy - 1.5], [scx - 3, scy - 5], [scx + 2, scy - 5], [scx + 5, scy - 2], [scx + 1, scy - 0.5], [scx + 4, scy + 2.8], [scx + 0.5, scy + 5], [scx - 3.8, scy + 4.2]);
  r(scx - 3.5, scy - 4.2, 4.5, 1.4, shellRim);

  if (!back) {
    for (const ex of side ? [8.5] : [-5, 2.5]) {
      r(ex - 0.8, -20 + bob, 3.6, 3.5, out);
      r(ex, -19.2 + bob, 2.2, 2.2, amber);
      r(ex + 0.3, -19 + bob, 1, 1, "#ffffff");
    }
  }

  // 5. Armored elbow joint + MASSIVE blue-grey mud-stone shield claw (raises high on windup, slams forward on strike!)
  const shieldX = side
    ? (windup ? 7 : striking ? 23 : skill ? 12 : 20)
    : nearside * (skill ? 4 : 16);
  const shieldY = windup ? -25 : striking ? -9 : skill ? -19 : -11.5;
  const jointX = shieldX - (side ? 6.5 : nearside * 5.5), jointY = shieldY + 6;
  p(out, [jointX - 5, jointY - 3], [jointX, jointY - 5], [jointX + 5, jointY - 3], [jointX + 4.5, jointY + 4], [jointX - 4.5, jointY + 4]);
  p(boneMid, [jointX - 3.5, jointY - 2], [jointX, jointY - 3.5], [jointX + 3.5, jointY - 2], [jointX + 3, jointY + 2.5], [jointX - 3, jointY + 2.5]);
  r(jointX - 2, jointY - 2.5, 3.5, 1.4, boneHi);

  const w = 13.5, h = 13;
  p(out,
    [shieldX - w, shieldY - h * 0.25], [shieldX - w * 0.78, shieldY - h], [shieldX + 1.5, shieldY - h], [shieldX + w * 0.86, shieldY - h * 0.68],
    [shieldX + w, shieldY - h * 0.1], [shieldX + w * 0.36, shieldY - h * 0.16], [shieldX + w * 0.78, shieldY + h * 0.3],
    [shieldX + w, shieldY + h * 0.48], [shieldX + w * 0.48, shieldY + h], [shieldX - w * 0.58, shieldY + h * 0.92]);
  p(shieldDeep,
    [shieldX - w + 1.5, shieldY - h * 0.22], [shieldX - w * 0.7, shieldY - h + 1.4], [shieldX + 1, shieldY - h + 1.4], [shieldX + w * 0.76, shieldY - h * 0.6],
    [shieldX + w - 1.5, shieldY - h * 0.12], [shieldX + w * 0.25, shieldY - h * 0.15], [shieldX + w * 0.65, shieldY + h * 0.3],
    [shieldX + w - 1.5, shieldY + h * 0.44], [shieldX + w * 0.42, shieldY + h - 1.4], [shieldX - w * 0.5, shieldY + h * 0.8]);
  p(shieldMid,
    [shieldX - w + 2.2, shieldY - h * 0.28], [shieldX - w * 0.66, shieldY - h + 2], [shieldX + 0.8, shieldY - h + 2], [shieldX + w * 0.68, shieldY - h * 0.55],
    [shieldX + w * 0.7, shieldY - h * 0.18], [shieldX + w * 0.18, shieldY - h * 0.12], [shieldX + w * 0.5, shieldY + h * 0.4],
    [shieldX + w * 0.25, shieldY + h * 0.7], [shieldX - w * 0.48, shieldY + h * 0.65]);
  p(shieldLight,
    [shieldX - w * 0.72, shieldY - h * 0.3], [shieldX - w * 0.55, shieldY - h * 0.82], [shieldX + w * 0.1, shieldY - h * 0.8],
    [shieldX + w * 0.45, shieldY - h * 0.45], [shieldX - w * 0.1, shieldY - h * 0.15], [shieldX - w * 0.55, shieldY + h * 0.2]);
  p(mossDeep, [shieldX - w * 0.58, shieldY - h * 0.48], [shieldX - w * 0.08, shieldY - h * 0.7], [shieldX + 0.8, shieldY - h * 0.2], [shieldX - w * 0.48, shieldY - h * 0.08]);
  p(mossMid, [shieldX - w * 0.5, shieldY - h * 0.45], [shieldX - w * 0.12, shieldY - h * 0.64], [shieldX, shieldY - h * 0.28], [shieldX - w * 0.4, shieldY - h * 0.18]);
  r(shieldX + w * 0.28, shieldY - h * 0.12, 2.5, 1.8, boneHi);
  r(shieldX + w * 0.36, shieldY + h * 0.22, 2.5, 1.8, boneHi);
  if (skill) {
    trace([[shieldX - w * 0.68, shieldY - h * 0.72], [shieldX + w * 0.5, shieldY - h * 0.72]], shieldRim, 1.8);
    r(shieldX - 4, shieldY - h * 0.5, 5.5, 1.8, "#ffffff");
  }
  if (striking) {
    // Heavy shield-claw slam shockwave arc!
    trace([[shieldX + 6, shieldY - 14], [shieldX + 15, shieldY - 2], [shieldX + 11, shieldY + 10]], shieldRim, 2.5);
    trace([[shieldX + 8, shieldY - 11], [shieldX + 14, shieldY - 1], [shieldX + 11, shieldY + 7]], "#ffffff", 1.2);
  }
};

export const lanternMoth: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#2a1d2e";
  const wingDeep = "#432c4c", wingMid = "#6e4b75", wingLight = "#9d769e", wingRim = "#cfaec6";
  const brassDeep = "#4f3b28", brassMid = "#947044", brassLight = "#d9b06a";
  const glowDeep = "#d98836", glowMid = "#f7c454", glowLight = "#ffe896", glowCore = "#fffbe0";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const lift = (skill ? 4 : 0) + (windup ? -3.5 : striking ? 3 : 0);
  const bodyX = (side ? 2 : 0) + (windup ? -2.5 : striking ? 4 : 0);
  const flap = [0, -3.6, -1.2, 3.2, 7.6, 8.8, 5.2, 1.2][f];
  const wingY = (skill ? -23 : windup ? -37 : striking ? -22 : -31.5) + (windup || striking ? 0 : flap * (skill ? 0.55 : 1));

  const drawWing = (d: number, tucked: boolean) => {
    const end = bodyX + d * (tucked ? 17 : 27);
    p(out, [bodyX, -20 + lift], [end - d * 3.5, wingY + 3], [end - d * 2.5, wingY + 12], [end - d * 9, wingY + 15.5], [bodyX + d * 9, -13 + lift], [bodyX + d * 2, -14 + lift]);
    p(wingDeep, [bodyX + d * 1.5, -19.5 + lift], [end - d * 5, wingY + 4], [end - d * 4, wingY + 11], [end - d * 8.5, wingY + 13.8], [bodyX + d * 9, -14.5 + lift]);
    p(wingMid, [bodyX + d * 3, -19 + lift], [end - d * 6, wingY + 4.5], [end - d * 5.5, wingY + 10], [end - d * 9, wingY + 11.8], [bodyX + d * 9, -15.5 + lift]);
    r(end - d * 8, wingY + 7.5, 3.5, 2.2, glowLight);

    p(out,
      [bodyX, -23.5 + lift], [end - d * 11, wingY - 8], [end - d * 2, wingY - 9], [end + d * 1.5, wingY - 4],
      [end - d * 1, wingY + 3.5], [end - d * 7, wingY + 9], [bodyX + d * 11, -17.5 + lift], [bodyX + d * 3, -16.5 + lift]);
    p(wingDeep,
      [bodyX + d * 1.5, -23 + lift], [end - d * 10.5, wingY - 6.5], [end - d * 2.5, wingY - 7.5], [end, wingY - 3.5],
      [end - d * 2, wingY + 2.5], [end - d * 7, wingY + 7.5], [bodyX + d * 10.5, -18.5 + lift]);
    p(wingMid,
      [bodyX + d * 2.5, -22.5 + lift], [end - d * 10, wingY - 6], [end - d * 3, wingY - 6.8], [end - d * 1.2, wingY - 3],
      [end - d * 3.5, wingY + 1.5], [end - d * 8, wingY + 5.5], [bodyX + d * 10, -19 + lift]);
    p(wingLight, [end - d * 11, wingY - 5.5], [end - d * 4, wingY - 6.2], [end - d * 2.5, wingY - 3], [end - d * 7, wingY - 1.5]);
    trace([[bodyX + d * 4, -22 + lift], [end - d * 4, wingY - 3.5]], wingDeep, 1.2);
    trace([[bodyX + d * 5, -20 + lift], [end - d * 5.5, wingY + 3]], wingDeep, 1.1);
    const ex = end - d * (tucked ? 5.5 : 7.5), ey = wingY - 1;
    p(out, [ex - 3.6, ey - 2.8], [ex + 3.6, ey - 2.8], [ex + 3.8, ey + 2.6], [ex - 3.8, ey + 2.6]);
    p(glowMid, [ex - 2.5, ey - 1.8], [ex + 2.5, ey - 1.8], [ex + 2.6, ey + 1.7], [ex - 2.6, ey + 1.7]);
    r(ex - 1.1, ey - 1.1, 2.2, 2.2, wingDeep);
    r(ex - 0.6, ey - 1.1, 1.1, 1.1, glowCore);
  };

  if (side) drawWing(1, true);
  else { drawWing(-1, false); drawWing(1, false); }

  const lx = bodyX + (side ? -7 : 0), ly = -15 + lift;
  if (windup || striking) {
    p("#ffe28a55", [lx - 13, ly - 11], [lx + 13, ly - 11], [lx + 13, ly + 11], [lx - 13, ly + 11]);
  }
  p(out,
    [lx - 9.8, ly - 1], [lx - 7.5, ly - 9.5], [lx, ly - 11], [lx + 7.5, ly - 9.5],
    [lx + 9.8, ly - 1], [lx + 7.2, ly + 8.5], [lx, ly + 10.5], [lx - 7.2, ly + 8.5]);
  p(brassDeep,
    [lx - 8.4, ly - 1], [lx - 6.5, ly - 8], [lx, ly - 9.4], [lx + 6.5, ly - 8],
    [lx + 8.4, ly - 1], [lx + 6.2, ly + 7.2], [lx, ly + 9], [lx - 6.2, ly + 7.2]);
  p(glowDeep, [lx - 6.8, ly - 0.5], [lx - 5, ly - 6.8], [lx + 5, ly - 6.8], [lx + 6.8, ly - 0.5], [lx + 5, ly + 6], [lx - 5, ly + 6]);
  p(glowMid, [lx - 5.6, ly - 0.8], [lx - 4, ly - 6], [lx + 4, ly - 6], [lx + 5.6, ly - 0.8], [lx + 3.8, ly + 4.5], [lx - 3.8, ly + 4.5]);
  p(glowLight, [lx - 3.8, ly - 1.5], [lx - 2.5, ly - 5], [lx + 2.5, ly - 5], [lx + 3.5, ly - 1.5], [lx + 1.5, ly + 2.5], [lx - 2.2, ly + 2.5]);
  r(lx - 2.2, ly - 4, 3.8, 3.2, glowCore);
  for (const dx of [-3.6, 0, 3.6]) trace([[lx + dx, ly - 7.5], [lx + dx * 1.1, ly + 7]], brassDeep, 1.2);
  trace([[lx - 7, ly + 0.5], [lx + 7, ly + 0.5]], brassDeep, 1.2);
  r(lx - 4.5, ly + 6.2, 9, 2.4, brassMid);
  r(lx - 3, ly + 6.5, 4, 1, brassLight);

  if (side) drawWing(-1, false);

  const hx = bodyX + (side ? 7.5 : 0), hy = -25.5 + lift;
  p(out,
    [hx - 7.5, hy + 2.5], [hx - 7.8, hy - 5], [hx - 4, hy - 8], [hx + 4, hy - 8],
    [hx + 7.8, hy - 5], [hx + 7.5, hy + 2.5], [hx + 5, hy + 7.5], [hx - 5, hy + 7.5]);
  p(wingDeep, [hx - 6.2, hy + 2], [hx - 6.4, hy - 4.2], [hx - 3.2, hy - 6.6], [hx + 3.2, hy - 6.6], [hx + 6.4, hy - 4.2], [hx + 6.2, hy + 2], [hx + 4, hy + 6], [hx - 4, hy + 6]);
  p(wingMid, [hx - 5.5, hy + 1], [hx - 5.5, hy - 4], [hx - 2.8, hy - 6.2], [hx + 2.8, hy - 6.2], [hx + 5.5, hy - 4], [hx + 4.5, hy + 1.5], [hx - 3.5, hy + 1.5]);
  p(wingRim, [hx - 6, hy + 1.8], [hx + 6, hy + 1.8], [hx + 4.5, hy + 5.2], [hx - 4.5, hy + 5.2]);
  if (!back) {
    for (const d of [-1, 1]) {
      const ax = hx + (side ? 2 + d * 1.5 : d * 2.8);
      trace([[ax, hy - 5], [ax + d * 3.5, hy - 11.5], [ax + d * 8, hy - 12.5]], out, 2.8);
      trace([[ax, hy - 5], [ax + d * 3.5, hy - 11.5], [ax + d * 8, hy - 12.5]], glowLight, 1.3);
      r(ax + d * 4.5, hy - 12.8, 2, 1.6, glowMid);
    }
    for (const ex of side ? [hx + 2.2] : [hx - 4.2, hx + 1.6]) {
      r(ex - 0.8, hy - 2, 3.4, 3.4, out);
      r(ex, hy - 1.3, 2.0, 2.0, glowMid);
      r(ex + 0.3, hy - 1.1, 1, 1, glowCore);
    }
  } else {
    r(hx - 3.5, hy - 4.5, 7, 3, wingRim);
  }

  for (const d of [-1, 1]) {
    const ux = bodyX + d * 4;
    const sweepX = striking ? 7 : 0;
    trace([[ux, -9.5 + lift], [ux + d * 3.2 + sweepX, -3.5 + lift], [ux + d * 1 + sweepX + 2, -2 + lift]], out, 2.8);
    trace([[ux, -9.5 + lift], [ux + d * 3.2 + sweepX, -3.5 + lift], [ux + d * 1 + sweepX + 2, -2 + lift]], brassLight, 1.1);
    if (skill) {
      trace([[ux - d * 1, -7.5 + lift], [ux + d * 4.5, -0.5], [ux + d * 2.2, 1.5]], out, 2.4);
      trace([[ux - d * 1, -7.5 + lift], [ux + d * 4.5, -0.5], [ux + d * 2.2, 1.5]], glowLight, 1.0);
    }
  }
  if (striking) {
    trace([[bodyX + 12, -20 + lift], [bodyX + 21, -11 + lift], [bodyX + 16, -1 + lift]], glowLight, 2.2);
    trace([[bodyX + 14, -18 + lift], [bodyX + 19, -11 + lift], [bodyX + 16, -3 + lift]], "#ffffff", 1.1);
  }
  if (skill) {
    const px = bodyX, py = 0.8;
    p(out, [px - 9.5, py - 1], [px - 6, py - 5], [px + 6, py - 5], [px + 9.5, py - 1], [px + 6, py + 4], [px - 6, py + 4]);
    p("#426f6c", [px - 8, py - 1], [px - 5, py - 3.8], [px + 5, py - 3.8], [px + 8, py - 1], [px + 5, py + 2.8], [px - 5, py + 2.8]);
    r(px - 7.5, py - 1.5, 3.5, 2.2, "#8cb063");
    r(px + 4, py - 2.8, 2.4, 2.4, "#d96543");
    r(px + 2, py - 5.2, 2.8, 2.8, out);
    r(px + 2.6, py - 4.6, 1.5, 1.5, glowMid);
  }
};

export const whiskerCatfish: Painter = ({ r, p, trace, frame, live, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#1c2b2e";
  const skinDeep = "#243d44", skinMid = "#3d666b", skinLight = "#6e9894", skinRim = "#a5ccc0";
  const bellyDeep = "#9e8e74", bellyMid = "#d9c6a0", bellyHi = "#f5e8ca";
  const woodDeep = "#453328", woodMid = "#7c5c40", woodLight = "#b38a5e", woodRim = "#d9b482";
  const mossMid = "#5c8049", mossLight = "#98b86a";
  const bronzeMid = "#c99a52", bronzeHi = "#ffe69e";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const lunge = windup ? -3 : striking ? 4 : 0;
  const x = (side ? -2 : 0) + lunge;

  // 1. Muscular forked catfish tail + heavy mud-speckled body (8-frame undulating swim/crawl)
  if (side) {
    const flex = live || windup || striking ? Math.sin((f * Math.PI) / 4) * 3.0 + (windup ? -2 : 0) : 0;
    p(out,
      [-29 + lunge, -13 + flex], [-27.5 + lunge, -27 + flex], [-19 + lunge, -24 + flex * 0.6], [-15 + lunge, -16],
      [-4 + lunge, -22], [11 + lunge, -22], [22 + lunge, -16], [26.5 + lunge, -9], [23 + lunge, -2], [11 + lunge, 1], [-8 + lunge, 1],
      [-20 + lunge, -3], [-27 + lunge, -7 + flex * 0.6]);
    p(skinDeep,
      [-27.2 + lunge, -13 + flex], [-26 + lunge, -25 + flex], [-18.5 + lunge, -22.5 + flex * 0.6], [-14.5 + lunge, -15],
      [-4 + lunge, -20.5], [10.5 + lunge, -20.5], [20.5 + lunge, -15], [24.8 + lunge, -9], [21.5 + lunge, -3.5], [10.5 + lunge, -0.5], [-8 + lunge, -0.5],
      [-19.5 + lunge, -4.5], [-25.5 + lunge, -8 + flex * 0.6]);
    p(skinMid,
      [-25.5 + lunge, -13.5 + flex], [-24.5 + lunge, -23.5 + flex], [-18 + lunge, -21.5 + flex * 0.6], [-14 + lunge, -14.5],
      [-3.5 + lunge, -20], [10 + lunge, -20], [19.5 + lunge, -14.5], [23 + lunge, -9.5], [19.5 + lunge, -5.5], [5 + lunge, -5], [-13 + lunge, -6], [-23 + lunge, -9.5 + flex * 0.6]);
    p(skinLight, [-12 + lunge, -16], [-3 + lunge, -19.5], [9 + lunge, -19.5], [17 + lunge, -14.5], [12 + lunge, -11.5], [-5 + lunge, -12]);
    r(-3 + lunge, -18.5, 11, 1.4, skinRim);
    for (const dy of [-22, -17.5, -12.5]) trace([[-25 + lunge, dy + flex], [-17 + lunge, -14]], skinLight, 1.0);
    for (const [mx, my] of [[-12, -10], [-4, -13], [4, -9], [-8, -6]]) r(x + mx, my, 2.8, 1.8, skinDeep);
    p(bellyDeep, [-4 + lunge, -4.5], [20 + lunge, -5], [22.5 + lunge, -7.5], [19.5 + lunge, -3.5], [9 + lunge, -1], [-4 + lunge, -1]);
    p(bellyMid, [-2 + lunge, -4.8], [19 + lunge, -5.2], [21 + lunge, -7], [17 + lunge, -4], [8 + lunge, -2.2], [-2 + lunge, -2.5]);
    if (striking) {
      p(out, [12 + lunge, -9], [26 + lunge, -10], [25 + lunge, -2], [12 + lunge, -3]);
    } else {
      trace([[5 + lunge, -6.5], [24.5 + lunge, -6.5]], out, 1.7);
    }
    r(7 + lunge, -9.2, 11, 1.2, skinRim);
  } else {
    if (back) {
      p(out, [-12, -19], [-3, -25], [9, -19], [14, -9], [8, 0], [-4, -2], [-12, 0]);
      p(skinMid, [-10.5, -18.5], [-3, -23], [7.8, -18], [12, -9], [7, -1.5], [-4, -3.5], [-10.5, -1.5]);
      trace([[-7, -17], [5, -11]], skinLight, 1.2);
    }
    p(out, [-24, -10], [-20, -21], [-8, -24], [8, -24], [20, -21], [24, -10], [18, -1], [6, 1.5], [-6, 1.5], [-18, -1]);
    p(skinDeep, [-22.5, -10], [-18.5, -19.5], [-7.5, -22.5], [7.5, -22.5], [18.5, -19.5], [22.5, -10], [17, -2.5], [5.5, 0], [-5.5, 0], [-17, -2.5]);
    p(skinMid, [-21.5, -10.5], [-17.5, -19], [-7, -22], [7, -22], [17.5, -19], [21, -10.5], [15, -4.5], [4, -3], [-5, -3], [-15, -4.5]);
    p(skinLight, [-15, -15], [-7, -21], [5, -21], [11, -16], [2, -13], [-10, -13]);
    if (!back) {
      p(bellyMid, [-14, -5.5], [-7, -8.5], [7, -8.5], [14, -5.5], [9, -1.5], [-9, -1.5]);
      r(-7, -7.8, 12, 1.3, bellyHi);
      trace([[-12, -6.8], [12, -6.8]], out, 1.8);
    }
  }

  // 2. Weathered sunken-boat timber rib-hull lashed across its back
  const hullY = -21;
  trace([[x - 18, hullY + 3], [x - 6, hullY - 3.5], [x + 8, hullY - 2.5], [x + 15, hullY + 2]], out, 5.8);
  trace([[x - 18, hullY + 3], [x - 6, hullY - 3.5], [x + 8, hullY - 2.5], [x + 15, hullY + 2]], woodMid, 3.4);
  trace([[x - 16, hullY + 2], [x - 5, hullY - 4], [x + 7, hullY - 3]], woodRim, 1.2);
  for (let i = 0; i < 4; i++) {
    const rx = x - 13.5 + i * 7.5;
    const hTop = -28.5 - (i % 2) * 1.5;
    p(out, [rx - 3.5, -15], [rx - 2.8, hTop + 1.5], [rx + 1.8, hTop], [rx + 4, -24.5], [rx + 2.8, -15]);
    p(woodDeep, [rx - 2.2, -16], [rx - 1.6, hTop + 2.2], [rx + 1.4, hTop + 1.2], [rx + 2.8, -24.5], [rx + 1.8, -16]);
    p(woodMid, [rx - 2, -16.5], [rx - 1.4, hTop + 2.5], [rx + 0.8, hTop + 1.6], [rx + 1.5, -24.5], [rx + 0.5, -16.5]);
    r(rx - 1.4, hTop + 2.5, 2.2, 2, woodRim);
    r(rx - 0.5, -19.5, 1.8, 1.8, out);
  }
  trace([[x - 16, -17], [x - 2, -19], [x + 13, -16]], out, 2.6);
  trace([[x - 16, -17], [x - 2, -19], [x + 13, -16]], bellyMid, 1.2);
  p(mossMid, [x - 11, -27.5], [x - 5, -29], [x - 2.5, -23], [x - 9, -21.5]);
  r(x - 9, -27, 4, 1.6, mossLight);

  if (back) {
    r(-4, -19, 8, 9.5, woodMid);
    r(-2, -18, 3.5, 6.5, woodRim);
    return;
  }

  // 3. Fierce amber catfish eyes & heavy brow ridge
  const hx = (side ? 12 : 0) + lunge;
  for (const ex of side ? [hx + 3.5] : [hx - 6.5, hx + 3.5]) {
    r(ex - 0.8, -16.8, 4.0, 3.8, out);
    r(ex, -16, 2.5, 2.3, skill || striking ? "#fff4cc" : amber);
    r(ex + 0.4, -15.8, 1.1, 1.1, "#ffffff");
  }
  r(hx + (side ? 1.5 : -7.5), -18.2, side ? 6.5 : 15, 1.4, skinDeep);

  // 4. Forked bronze-gold whip whiskers (coiled back in windup, lashing forward with golden arc in strike!)
  for (const d of [-1, 1]) {
    const startX = hx + (side ? 4 + d * 3 : d * 9);
    const endX = side
      ? (windup ? (d < 0 ? -12 : 12) : striking ? (d < 0 ? 16 : 36) : d < 0 ? -7 : 34)
      : d * (skill || striking ? 28 : 22);
    const endY = windup ? -14 + d * 3 : striking ? -10 + d * 5 : skill ? -1 + d * 2 : -1.5 + d * 0.6;
    const midX = startX + (endX - startX) * 0.56;
    const midY = windup ? -13 + d * 2 : striking ? -14 + d * 2 : skill ? -6.5 + d * 2 : -4.5 + d * 3;
    const mainPts: Point[] = [[startX, -7.2], [midX, midY], [endX, endY]];
    trace(mainPts, out, 3.8);
    trace(mainPts, skill || striking ? bronzeHi : bronzeMid, 1.8);
    const forkEndX = midX + (endX - midX) * 0.56, forkEndY = midY + 4.8;
    trace([[midX, midY], [forkEndX, forkEndY]], out, 2.6);
    trace([[midX, midY], [forkEndX, forkEndY]], skill || striking ? "#fff4cc" : bellyHi, 1.1);
    if (skill) {
      trace([[startX, -5.2], [midX, midY - 2], [endX, endY - 1]], "#fff4cc", 1.1);
      r(endX - 3, endY + 1.2, 5, 1.5, teal);
      r(endX - 1, endY - 1.6, 2.2, 1.3, "#ffffff");
    }
  }
  if (striking) {
    trace([[hx + 10, -21], [hx + 23, -12], [hx + 18, -1]], bronzeHi, 2.4);
    trace([[hx + 13, -18], [hx + 21, -11], [hx + 17, -3]], "#ffffff", 1.2);
  }
};

export const stoneClam: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#2a1f30";
  const mudDeep = "#243a3d", mudMid = "#416766", mudLight = "#78a397";
  const shellDeep = "#3d2b47", shellMid = "#694c73", shellLight = "#9c7ba3", shellRim = "#cfb3cc";
  const mossDeep = "#344d33", mossMid = "#5f854b", mossLight = "#9ebd6d";
  const bronzeDeep = "#523e2c", bronzeMid = "#947044", bronzeLight = "#deb46a";
  const pearlDeep = "#d9923b", pearlMid = "#f7cc65", pearlLight = "#ffefa6";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const shake = windup ? (f % 2 ? 1.5 : -1.5) : 0;
  const x = (side ? -2 : 0) + shake;

  p(out, [x - 24, -4], [x - 20, -12], [x + 20, -12], [x + 25, -4], [x + 19, 2.5], [x - 17, 2.5]);
  p(mudDeep, [x - 22.5, -4.5], [x - 18.5, -10.5], [x + 18.5, -10.5], [x + 23.5, -4.5], [x + 18, 1], [x - 16, 1]);
  p(mudMid, [x - 21, -5.5], [x - 17.5, -10], [x + 17.5, -10], [x + 21.5, -5.5], [x + 15, -1.5], [x - 14, -1.5]);
  r(x - 16, -2.2, 32, 1.4, mudLight);

  const lw = side ? 22 : 23;
  p(out, [x - lw, -9], [x - lw + 2, -17], [x + lw - 2, -17], [x + lw, -9], [x + lw - 5, -1], [x - lw + 5, -1]);
  p(shellDeep, [x - lw + 1.5, -9.5], [x - lw + 3, -15.5], [x + lw - 3, -15.5], [x + lw - 1.5, -9.5], [x + lw - 5.5, -2.5], [x - lw + 5.5, -2.5]);
  p(shellMid, [x - lw + 2.5, -10], [x - lw + 3.5, -15], [x + lw - 4, -15], [x + lw - 3, -10], [x + lw - 7, -4.5], [x - lw + 7, -4.5]);
  trace([[x - 18, -10.5], [x, -7.5], [x + 18, -10.5]], shellLight, 1.4);

  const opening = skill ? -12.5 : windup ? -5.5 : striking ? 2.2 : [0, 0.2, 0.6, 1.0, 0.8, 0.4, 0.1, 0][f];

  if ((skill || windup) && !back) {
    p("#1c1524", [x - 19, -11], [x - 16, -27], [x - 7, -30], [x + 12, -26], [x + 20, -12], [x + 10, -5], [x - 12, -5]);
    trace([[x - 16, -12], [x, -8.5], [x + 17, -12]], "#e0bc8d", 1.8);
    trace([[x - 14, -23], [x, -26.5], [x + 14, -22]], shellRim, 1.2);
  }

  const rawTop: Point[] = [
    [x - 23, -13], [x - 21, -25 + opening], [x - 13, -35 + opening], [-3 + x, -38 + opening], [8 + x, -37 + opening],
    [x + 19, -30 + opening], [x + 24, -21 + opening], [x + 24, -13 + opening * 0.62],
    [x + 16, -9.5 + opening * 0.62], [x + 3, -8.5 + opening * 0.62], [x - 13, -9.5 + opening * 0.62],
  ];
  const warp = (pts: Point[]) => side ? pts.map(([px, py]): Point => [px, py + (px + 6) * 0.11]) : pts;
  const top = warp(rawTop);
  p(out, ...top);
  p(shellDeep, ...warp([
    [x - 21.4, -13.5], [x - 19.5, -24.5 + opening], [x - 12, -33.5 + opening], [-3 + x, -36.4 + opening], [7.5 + x, -35.4 + opening],
    [x + 17.8, -29 + opening], [x + 22.4, -20.8 + opening], [x + 22.4, -13.5 + opening * 0.62],
    [x + 15.2, -10.8 + opening * 0.62], [x + 3, -10 + opening * 0.62], [x - 12.2, -10.8 + opening * 0.62],
  ]));
  p(shellMid, ...warp([
    [x - 20.4, -14.5], [x - 18.5, -24.5 + opening], [x - 11.5, -33 + opening], [-3 + x, -35.8 + opening], [7 + x, -34.8 + opening],
    [x + 16.5, -28.5 + opening], [x + 20.5, -20.5 + opening], [x + 18, -14 + opening * 0.62],
    [x + 2, -12.5 + opening * 0.62], [x - 14, -13 + opening * 0.62],
  ]));
  p(shellLight, ...warp([
    [x - 17, -23 + opening], [x - 11, -32.5 + opening], [-2 + x, -35.2 + opening], [6 + x, -34 + opening],
    [9 + x, -27 + opening], [-1 + x, -23 + opening], [x - 14, -19 + opening * 0.8],
  ]));

  trace([[x - 18, -21.5 + opening * 0.85], [x, -25 + opening * 0.9], [x + 18, -20.5 + opening * 0.85]], shellDeep, 1.3);
  trace([[x - 17, -20.3 + opening * 0.85], [x, -23.8 + opening * 0.9], [x + 17, -19.3 + opening * 0.85]], shellRim, 1.0);
  for (const dx of [-13.5, -6, 3, 11.5]) {
    trace([[x + dx * 0.7, -33.5 + opening], [x + dx * 1.12, -23.5 + opening], [x + dx * 1.42, -13 + opening * 0.65]], shellDeep, 1.8);
    trace([[x + dx * 0.78, -32.5 + opening], [x + dx * 1.2, -23.5 + opening], [x + dx * 1.48, -13 + opening * 0.65]], shellRim, 0.95);
  }
  if (!skill && !back) trace([[x - 13, -11], [x + 13, -11]], windup || striking ? pearlLight : pearlMid, windup || striking ? 2.2 : 1.3);

  p(out, [x - 18.5, -23.5 + opening], [x - 14, -32.5 + opening], [x - 6, -31.5 + opening], [x - 4.5, -25.5 + opening], [x - 10.5, -21 + opening]);
  p(mossDeep, [x - 17, -24 + opening], [x - 13.2, -31.2 + opening], [x - 6.8, -30.5 + opening], [x - 5.8, -25.8 + opening], [x - 10.5, -22.2 + opening]);
  p(mossMid, [x - 16.2, -25 + opening], [x - 13, -30.8 + opening], [x - 7.5, -30 + opening], [x - 7, -26.5 + opening], [x - 11.5, -24 + opening]);
  r(x - 13.5, -29.5 + opening, 4.5, 2, mossLight);
  r(x - 9.5, -23.5 + opening, 2.2, 4.2, mossMid);
  p(mossMid, [x + 9, -30.5 + opening], [x + 14.5, -29.5 + opening], [x + 15.5, -25 + opening], [x + 10.5, -26 + opening]);

  if (back) {
    p(out, [x - 7.5, -16.5 + opening * 0.6], [x + 7.5, -16.5 + opening * 0.6], [x + 8.5, -9.5 + opening * 0.6], [x - 8.5, -9.5 + opening * 0.6]);
    p(bronzeMid, [x - 6, -15 + opening * 0.6], [x + 6, -15 + opening * 0.6], [x + 6.8, -11 + opening * 0.6], [x - 6.8, -11 + opening * 0.6]);
    r(x - 4.5, -14 + opening * 0.6, 2.2, 2.2, bronzeLight);
    r(x + 2.3, -14 + opening * 0.6, 2.2, 2.2, bronzeLight);
    r(x - 5, -12, 10, 1.2, bronzeDeep);
  }

  if (striking) {
    // Crushing slam shockwave ring & stone shards bursting forward from shell clamp!
    trace([[x + 16, -21], [x + 28, -11], [x + 23, 0]], pearlLight, 2.6);
    trace([[x + 18, -18], [x + 26, -10], [x + 22, -2]], "#ffffff", 1.2);
    for (const [sx, sy] of [[x + 21, -16], [x + 27, -7], [x + 24, 1], [x - 24, -4]]) {
      r(sx, sy, 2.8, 1.8, pearlMid);
    }
  }

  if (skill && !back) {
    const px = side ? 8 : 0, py = -12.5;
    p("#f8c66f55", [px - 11, py - 8], [px + 11, py - 8], [px + 11, py + 8], [px - 11, py + 8]);
    p(out, [px - 8, py - 1], [px - 6, py - 7.5], [px, py - 8.5], [px + 6, py - 7.5], [px + 8, py - 1], [px + 5.5, py + 6.5], [px, py + 7.8], [px - 5.5, py + 6.5]);
    p(pearlDeep, [px - 6.6, py - 1], [px - 4.8, py - 6.2], [px, py - 7.2], [px + 4.8, py - 6.2], [px + 6.6, py - 1], [px + 4.5, py + 5.4], [px, py + 6.4], [px - 4.5, py + 5.4]);
    p(pearlMid, [px - 5.8, py - 1.5], [px - 4.2, py - 5.8], [px, py - 6.6], [px + 4.2, py - 5.8], [px + 5.2, py - 1.5], [px + 3, py + 4], [px - 3.5, py + 4]);
    p(pearlLight, [px - 4.2, py - 2.5], [px - 2.8, py - 5.4], [px + 2, py - 5.4], [px + 3, py - 2.5], [px, py + 1], [px - 3, py + 0.5]);
    r(px - 2.8, py - 4.2, 3.4, 2.8, "#ffffff");
    for (const [sx, sy] of [[18, -15], [23, -10.5], [26, -6], [20, -5], [28, -12.5]]) {
      r(sx, sy, 2.6, 1.6, pearlLight);
      r(sx + 1, sy - 1, 1.3, 1.2, "#ffffff");
    }
  }
};

export const reedSpider: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#2a1f2d";
  const abdDeep = "#3d2948", abdMid = "#694875", abdLight = "#9b76a3", abdRim = "#cfb3cb";
  const woodDeep = "#453328", woodMid = "#7c5c40", woodLight = "#b3895c", woodRim = "#dec08e";
  const mossMid = "#5c8049", mossLight = "#9ec06e";
  const sacDeep = "#9e8b7c", sacMid = "#dfd1bd", sacLight = "#f7f0df";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const lean = skill ? 2.2 : windup ? -2.4 : striking ? 1.8 : 0;
  const lunge = windup ? -2.5 : striking ? 3.5 : 0;

  const drawLeg = (
    ox: number, oy: number,
    kx: number, ky: number,
    fx: number, fy: number,
    col: string, far = false,
  ) => {
    const step = skill || windup || striking ? 0 : Math.sin(((f * 1.0 + fx * 0.35 + (far ? 4 : 0)) * Math.PI) / 4);
    fx += step * 2.2;
    fy -= Math.max(0, step) * 2.0;
    const pts: Point[] = [[ox, oy], [kx + step * 0.9, ky], [fx, fy]];
    trace(pts, out, far ? 3.2 : 3.9);
    trace(pts, col, far ? 1.4 : 2.0);
    r(kx - 1.2, ky - 1.2, 2.4, 2.4, out);
    r(kx - 0.6, ky - 0.8, 1.3, 1.2, far ? woodMid : woodRim);
    r(fx - 1.1, fy - 0.5, 2.4, 1.5, out);
  };

  const drawEggSac = (tx: number, ty: number, sw: number, sh: number) => {
    p(out, [tx - sw, ty], [tx - sw * 0.72, ty - sh * 0.82], [tx, ty - sh], [tx + sw * 0.72, ty - sh * 0.82],
      [tx + sw, ty], [tx + sw * 0.65, ty + sh * 0.88], [tx, ty + sh], [tx - sw * 0.65, ty + sh * 0.88]);
    p(sacDeep, [tx - sw + 1.2, ty], [tx - sw * 0.64, ty - sh * 0.7], [tx, ty - sh + 1.1], [tx + sw * 0.64, ty - sh * 0.7],
      [tx + sw - 1.2, ty], [tx + sw * 0.56, ty + sh * 0.76], [tx, ty + sh - 1.1], [tx - sw * 0.56, ty + sh * 0.76]);
    p(sacMid, [tx - sw + 1.6, ty - 0.5], [tx - sw * 0.6, ty - sh * 0.66], [tx, ty - sh + 1.4], [tx + sw * 0.55, ty - sh * 0.6],
      [tx + sw * 0.7, ty], [tx + sw * 0.25, ty + sh * 0.58], [tx - sw * 0.45, ty + sh * 0.55]);
    p(sacLight, [tx - sw * 0.55, ty - sh * 0.2], [tx - sw * 0.35, ty - sh * 0.65], [tx + sw * 0.2, ty - sh * 0.65], [tx + sw * 0.25, ty - sh * 0.15]);
    trace([[tx - sw * 0.58, ty - sh * 0.25], [tx + sw * 0.58, ty + sh * 0.25]], "#d4bfa0", 0.95);
    trace([[tx - sw * 0.45, ty + sh * 0.35], [tx + sw * 0.45, ty - sh * 0.35]], "#ffffff", 0.85);
    r(tx - 2.2, ty - 2, 2.6, 1.3, "#ffffff");
  };

  if (side) {
    const hx = 6.5 + lunge, hy = -14.5 + lean;
    const ax = -9.5 + lunge * 0.7, ay = -22 + (skill ? 0.5 : windup ? 1.5 : 0);

    const farLegs: [number, number, number, number, number, number][] = [
      [hx + 2, hy - 1, 16 + lunge + (windup ? -3 : striking ? 5 : skill ? 2 : 0), windup ? -34 : -25 + lean * 0.5, 23 + lunge + (windup ? -2 : striking ? 6 : skill ? 2 : 0), windup ? -22 : -4.5],
      [hx + 0.5, hy - 1, 11 + lunge, -24 + lean * 0.5, 15 + lunge, -4],
      [hx - 1.5, hy - 1, 2 + lunge, -23 + lean * 0.5, 5 + lunge, -4],
      [hx - 3.5, hy - 1, -5 + lunge, -24 + lean * 0.5, -7 + lunge, -4.5],
    ];
    for (const [ox, oy, kx, ky, fx, fy] of farLegs) drawLeg(ox, oy, kx, ky, fx, fy, woodDeep, true);

    const spinX = ax - 8.5, spinY = ay + 4.5;
    const tx = skill ? -20 : ax - 4.5, ty = skill ? -2.2 : ay + 9.5;
    if (skill) {
      for (const s of [-2.2, 0, 2.2]) {
        trace([[spinX + s * 0.35, spinY], [tx + s * 0.8 + 1.5, -10], [tx + s * 0.4, ty - 3.2]], "#f0e5c8", 1.15);
      }
    } else {
      trace([[spinX + 1, spinY - 1], [tx - 1, ty - 2]], "#d9c49c", 1.0);
      trace([[ax - 1, ay + 6], [tx + 2, ty - 2]], "#d9c49c", 1.0);
    }
    drawEggSac(tx, ty, skill ? 7 : 5, skill ? 5.5 : 4.1);

    p(out,
      [ax - 11.5, ay - 3], [ax - 10.5, ay - 10.5], [ax - 4, ay - 13.5], [ax + 4.5, ay - 11.5],
      [ax + 10, ay - 4], [ax + 10.5, ay + 3], [ax + 5, ay + 8], [ax - 3, ay + 9], [ax - 10, ay + 6], [ax - 12, ay + 1]);
    p(abdDeep,
      [ax - 10.2, ay - 3], [ax - 9.2, ay - 9.5], [ax - 3.6, ay - 12], [ax + 3.8, ay - 10.2],
      [ax + 8.6, ay - 3.6], [ax + 9, ay + 2.5], [ax + 4.2, ay + 6.8], [ax - 2.8, ay + 7.6], [ax - 8.8, ay + 4.8], [ax - 10.5, ay + 0.8]);
    p(abdMid,
      [ax - 9.5, ay - 3.5], [ax - 8.5, ay - 9], [ax - 3.4, ay - 11.4], [ax + 3.4, ay - 9.6],
      [ax + 7.8, ay - 3.5], [ax + 7.2, ay + 1.8], [ax + 2, ay + 5], [ax - 5.5, ay + 4.5], [ax - 9.5, ay + 0.2]);
    p(abdLight, [ax - 8, ay - 8.5], [ax - 2, ay - 10.8], [ax + 4.5, ay - 7], [ax + 1, ay - 3.5], [ax - 7.5, ay - 4.5]);
    for (const dx of [-5, 0, 5]) {
      trace([[ax + dx - 2.5, ay - 5], [ax + dx, ay - 1], [ax + dx - 2, ay + 4]], abdDeep, 1.3);
      r(ax + dx - 1, ay - 2, 2.2, 1.2, abdRim);
    }
    trace([[ax - 8, ay - 7], [ax + 7, ay - 5]], mossMid, 1.7);
    r(ax - 3, ay - 7, 4.2, 1.3, mossLight);
    p(out, [spinX - 2, spinY - 2], [spinX + 2.5, spinY - 1.5], [spinX + 1, spinY + 2.5], [spinX - 2.5, spinY + 1.5]);
    r(spinX - 1, spinY - 1, 2.2, 2, woodLight);

    r(hx - 8.5, hy - 3, 4.2, 5, out);
    r(hx - 7.5, hy - 2, 3, 3, woodDeep);
    p(out, [hx - 9, hy], [hx - 6.5, hy - 6.5], [hx + 4, hy - 6.5], [hx + 9, hy - 1], [hx + 7.5, hy + 5.5], [hx - 6.5, hy + 5.5]);
    p(woodDeep, [hx - 7.6, hy], [hx - 5.5, hy - 5.2], [hx + 3.5, hy - 5.2], [hx + 7.6, hy - 0.8], [hx + 6.2, hy + 4.2], [hx - 5.5, hy + 4.2]);
    p(woodMid, [hx - 6.8, hy - 0.5], [hx - 5, hy - 4.8], [hx + 3, hy - 4.8], [hx + 6.6, hy - 1], [hx + 4.5, hy + 2.5], [hx - 5, hy + 2.5]);
    r(hx - 4, hy - 4.4, 7.5, 1.5, woodLight);
    trace([[hx + 7, hy + 1], [hx + 11.5, hy + 2.5], [hx + 12.5, hy + 6]], out, 2.6);
    trace([[hx + 7, hy + 1], [hx + 11.5, hy + 2.5], [hx + 12.5, hy + 6]], woodLight, 1.2);
    r(hx + 5.8, hy + 3.2, 2.8, windup || striking ? 4.8 : 3.8, out);
    r(hx + 6.4, hy + 3.6, 1.5, windup || striking ? 3.8 : 2.8, "#ffffff");

    const nearLegs: [number, number, number, number, number, number, string][] = [
      [hx + 2.2, hy + 2.8, 20 + lunge + (windup ? -5 : striking ? 6 : skill ? 2.5 : 0), windup ? -33 : striking ? -18 : -20 + lean * 0.4, 26.5 + lunge + (windup ? -4 : striking ? 6 : skill ? 2.5 : 0), windup ? -22 : striking ? -3 : -0.5, woodLight],
      [hx + 0.2, hy + 3.0, 12.5 + lunge, -21 + lean * 0.4, 15.5 + lunge, 1.2, woodMid],
      [hx - 2.0, hy + 2.8, 3.2 + lunge, -21 + lean * 0.4, 3.2 + lunge, 1.6, woodLight],
      [hx - 4.2, hy + 2.2, -6.5 + lunge, -22 + lean * 0.4, -9.5 + lunge, 0.8, woodMid],
    ];
    for (const [ox, oy, kx, ky, fx, fy, col] of nearLegs) drawLeg(ox, oy, kx, ky, fx, fy, col, false);

    if (striking) {
      // Venomous foreleg slash arc
      trace([[hx + 16, -26], [hx + 27, -14], [hx + 22, -2]], abdRim, 2.4);
      trace([[hx + 18, -23], [hx + 25, -13], [hx + 21, -4]], "#ffffff", 1.1);
    }

    r(hx + 3.8, hy - 2.2, 3.6, 3.4, out);
    r(hx + 4.5, hy - 1.5, 2.2, 2.2, skill || striking ? "#fff4cc" : amber);
    r(hx + 4.8, hy - 1.3, 1, 1, "#ffffff");
    r(hx + 2, hy - 3.4, 2, 2, amber);
    r(hx + 6.6, hy - 0.6, 1.6, 1.6, amber);
    return;
  }

  for (const d of [-1, 1]) {
    const legSpecs: [number, number, number, number, number, number, string][] = [
      [d * 5.5, -14 + lean, d * 13, -27 + lean * 0.4, d * 20, -4.5, woodMid],
      [d * 6, -13 + lean, d * 16.5, -23 + lean * 0.4, d * 23, -1.5, woodLight],
      [d * 5.5, -12 + lean, d * 15, -18 + lean * 0.4, d * 20.5, 1.0, woodMid],
      [d * 4.5, -11 + lean, d * (11.5 + (skill ? 1.5 : 0)), -14 + lean * 0.4, d * (15 + (skill ? 2 : 0)), 2.2, woodLight],
    ];
    for (const [ox, oy, kx, ky, fx, fy, col] of legSpecs) drawLeg(ox, oy, kx, ky, fx, fy, col, false);
  }

  const ay = -21 + lean;
  p(out, [-14, ay], [-11.5, ay - 10], [-4, ay - 13.5], [4, ay - 13.5], [11.5, ay - 10], [14, ay], [10.5, ay + 10], [0, ay + 13], [-10.5, ay + 10]);
  p(abdDeep, [-12.5, ay], [-10.2, ay - 8.8], [-3.5, ay - 12], [3.5, ay - 12], [10.2, ay - 8.8], [12.5, ay], [9.2, ay + 8.8], [0, ay + 11.5], [-9.2, ay + 8.8]);
  p(abdMid, [-11.5, ay - 0.5], [-9.5, ay - 8.2], [-3.2, ay - 11.4], [3.2, ay - 11.4], [9.5, ay - 8.2], [11, ay - 0.5], [7, ay + 7.2], [0, ay + 9.2], [-8, ay + 7]);
  p(abdLight, [-8, ay - 8.5], [-1, ay - 10.5], [4, ay - 6], [-2, ay - 3.5], [-8.5, ay - 4.5]);
  for (const dy of [-5, 0, 5]) {
    trace([[-6.5, ay + dy], [0, ay + dy - 2.5], [6.5, ay + dy]], abdDeep, 1.4);
    r(-1.2, ay + dy - 2.5, 2.4, 1.2, abdRim);
  }
  trace([[-8, ay - 6], [7.5, ay - 8.5]], mossMid, 1.7);
  r(-4, ay - 7.5, 4.2, 1.3, mossLight);

  if (back) {
    p(woodLight, [-5, -16 + lean], [0, -22 + lean], [5, -16 + lean], [3.5, -12 + lean], [-3.5, -12 + lean]);
    r(-2, -12 + lean, 4, 2.4, woodRim);
  } else {
    const hy = -12 + lean;
    p(out, [-9.5, hy], [-7, hy - 7.5], [7, hy - 7.5], [9.5, hy], [7, hy + 6.5], [-7, hy + 6.5]);
    p(woodDeep, [-8, hy], [-5.8, hy - 6], [5.8, hy - 6], [8, hy], [5.8, hy + 5.2], [-5.8, hy + 5.2]);
    p(woodMid, [-7.2, hy - 0.5], [-5.2, hy - 5.5], [5.2, hy - 5.5], [7, hy - 0.5], [4.5, hy + 3.5], [-5, hy + 3.5]);
    r(-4.5, hy - 5, 9, 1.5, woodLight);
    for (const ex of [-4.4, 2.2]) {
      r(ex - 0.7, hy - 2.2, 3.6, 3.4, out);
      r(ex, hy - 1.5, 2.2, 2.2, skill || striking ? "#fff4cc" : amber);
      r(ex + 0.3, hy - 1.3, 1, 1, "#ffffff");
    }
    r(-6.5, hy - 2.2, 2, 2, amber);
    r(4.8, hy - 2.2, 2, 2, amber);
    for (const fx of [-4.2, 2.6]) {
      r(fx - 0.6, hy + 3.8, 2.8, 3.8, out);
      r(fx, hy + 4.1, 1.6, 2.9, sacLight);
    }
  }

  const ty = skill ? -1.5 : back ? -10 + lean : -6 + lean;
  if (skill) {
    for (const sx of [-3, 0, 3]) {
      trace([[sx * 0.5, -13 + lean], [sx, -7], [sx * 0.4, ty - 3]], "#f0e5c8", 1.15);
    }
  }
  drawEggSac(0, ty, skill ? 7.4 : 4.6, skill ? 6 : 3.8);
};

export const reedSpiderling: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#2d2130";
  const pupaDeep = "#735a7e", pupaMid = "#bfa8c7", pupaLight = "#f0e5d8";
  const woodDeep = "#453328", woodMid = "#7c5c40", woodLight = "#b3895c", woodRim = "#dec08e";
  const sacDeep = "#9e8b7c", sacMid = "#dfd1bd", sacLight = "#f7f0df";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const hop = striking ? -3.5 : windup ? 1.5 : 0;
  const lunge = windup ? -2 : striking ? 4 : 0;

  const drawTinyLeg = (
    ox: number, oy: number,
    kx: number, ky: number,
    fx: number, fy: number,
    col: string, far = false,
  ) => {
    const step = skill || windup || striking ? 0 : Math.sin(((f + fx * 0.35 + (far ? 4 : 0)) * Math.PI) / 4);
    fx += step * 2.2;
    fy -= Math.max(0, step) * 2.0;
    const pts: Point[] = [[ox, oy], [kx + step * 0.9, ky], [fx, fy]];
    trace(pts, out, far ? 2.4 : 2.9);
    trace(pts, col, far ? 1.1 : 1.5);
    r(kx - 0.8, ky - 0.8, 1.6, 1.6, far ? woodDeep : woodRim);
    r(fx - 0.8, fy - 0.4, 1.7, 1.1, out);
  };

  if (side) {
    const shiftX = (skill ? 7.5 : 0) + lunge;
    if (skill) {
      const ex = -12, ey = -7;
      trace([[ex - 6, ey + 2], [ex - 11, 1]], "#d9c49c", 1.1);
      trace([[ex + 5, ey + 3], [ex + 9, 1]], "#d9c49c", 1.1);
      trace([[ex - 3, ey - 5], [ex - 10, -2]], "#f0e5c8", 1.0);
      p(out, [ex - 8, ey], [ex - 6, ey - 7], [ex, ey - 8], [ex + 6, ey - 7], [ex + 8, ey], [ex + 5.5, ey + 7], [ex - 5.5, ey + 7]);
      p(sacDeep, [ex - 6.8, ey], [ex - 5, ey - 5.8], [ex, ey - 6.8], [ex + 5, ey - 5.8], [ex + 6.8, ey], [ex + 4.5, ey + 5.8], [ex - 4.5, ey + 5.8]);
      p(sacMid, [ex - 6.2, ey - 0.5], [ex - 4.5, ey - 5.4], [ex, ey - 6.2], [ex + 4.5, ey - 5.2], [ex + 5, ey], [ex + 2, ey + 4.5], [ex - 4, ey + 4.5]);
      r(ex - 3.5, ey - 3.8, 3, 1.6, "#ffffff");
      p(out, [ex + 3, ey - 3.5], [ex + 7.8, ey - 1.5], [ex + 7.2, ey + 3.8], [ex + 2.5, ey + 3.2]);
      p("#3d2948", [ex + 3.5, ey - 2], [ex + 6.2, ey - 0.8], [ex + 5.8, ey + 2.2], [ex + 3.2, ey + 2]);
      trace([[ex + 6, ey - 3], [ex + 10.5, ey - 5.5]], "#f7f1de", 1.0);
      trace([[ex + 6.5, ey + 2.5], [ex + 10, ey + 4]], "#ece0be", 0.9);
    }

    const hx = 4.2 + shiftX, hy = -7.5 + hop;
    const ax = -4.2 + shiftX, ay = -11.5 + hop;

    drawTinyLeg(hx + 1, hy, hx + 6.5, -13.5 + hop, hx + 10.5, -2.2 + hop * 0.5, woodDeep, true);
    drawTinyLeg(hx - 0.5, hy, hx + 1.5, -13 + hop, hx + 3, -2 + hop * 0.5, woodDeep, true);
    drawTinyLeg(hx - 2, hy, hx - 5.5, -13 + hop, hx - 7.5, -2.2 + hop * 0.5, woodDeep, true);

    p(out, [ax - 6.5, ay], [ax - 4.8, ay - 5.5], [ax + 4.8, ay - 5.5], [ax + 6.5, ay], [ax + 4.5, ay + 5.2], [ax - 4.5, ay + 5.2]);
    p(pupaDeep, [ax - 5.2, ay], [ax - 3.8, ay - 4.4], [ax + 3.8, ay - 4.4], [ax + 5.2, ay], [ax + 3.5, ay + 4], [ax - 3.5, ay + 4]);
    p(pupaMid, [ax - 4.6, ay - 0.4], [ax - 3.5, ay - 4], [ax + 3.4, ay - 4], [ax + 4.4, ay - 0.4], [ax + 2.5, ay + 2.8], [ax - 3.2, ay + 2.8]);
    p(pupaLight, [ax - 3.5, ay - 3.5], [ax + 1, ay - 4], [ax + 2.2, ay - 1.5], [ax - 2.5, ay - 1]);
    trace([[ax - 2.5, ay - 1], [ax, ay + 1], [ax + 2.5, ay - 1]], "#694875", 1.1);
    r(ax - 5.5, ay + 1, 2, 1.5, woodMid);

    p(out, [hx - 5, hy], [hx - 3.5, hy - 4.2], [hx + 3.5, hy - 4.2], [hx + 5, hy], [hx + 3.5, hy + 3.8], [hx - 3.5, hy + 3.8]);
    p(woodMid, [hx - 3.8, hy], [hx - 2.5, hy - 3], [hx + 2.5, hy - 3], [hx + 3.8, hy], [hx + 2.5, hy + 2.6], [hx - 2.5, hy + 2.6]);
    r(hx - 2, hy - 2.6, 4, 1.1, woodLight);
    r(hx + 3.2, hy + 1.6, 1.8, 2.4, out);
    r(hx + 3.6, hy + 1.9, 1.0, 1.7, sacLight);

    drawTinyLeg(hx + 1.2, hy + 1.5, hx + 8, -12 + hop, hx + 12.2, 0.2 + hop * 0.5, woodLight, false);
    drawTinyLeg(hx - 0.5, hy + 1.8, hx + 2, -11.5 + hop, hx + 3.2, 0.8 + hop * 0.5, woodMid, false);
    drawTinyLeg(hx - 2.2, hy + 1.4, hx - 6.2, -12 + hop, hx - 8.5, 0.4 + hop * 0.5, woodLight, false);

    if (striking) {
      trace([[hx + 7, hy - 6], [hx + 14, hy - 1], [hx + 11, hy + 4]], "#ffffff", 1.5);
    }

    r(hx + 1.4, hy - 1.6, 3.2, 3.0, out);
    r(hx + 2, hy - 1.0, 2.0, 1.9, skill || striking ? "#fff4cc" : amber);
    r(hx + 2.2, hy - 0.9, 0.9, 0.9, "#ffffff");
    r(hx + 0.5, hy - 2.2, 1.6, 1.6, amber);
    return;
  }

  for (const d of [-1, 1]) {
    drawTinyLeg(d * 3, -7.5, d * 8.5, -14.5, d * 12, -1.5, woodMid, false);
    drawTinyLeg(d * 3.2, -7, d * 10, -11.5, d * 13, 0.4, woodLight, false);
    drawTinyLeg(d * 2.5, -6.5, d * 7, -8.5, d * 9.5, 1.4, woodMid, false);
  }

  p(out, [-6.5, -11.5], [-4.8, -17.5], [4.8, -17.5], [6.5, -11.5], [4.5, -6], [-4.5, -6]);
  p(pupaDeep, [-5.2, -11.5], [-3.8, -16.2], [3.8, -16.2], [5.2, -11.5], [3.5, -7.2], [-3.5, -7.2]);
  p(pupaMid, [-4.5, -12], [-3.5, -15.8], [3.5, -15.8], [4.4, -12], [2.5, -8.5], [-3, -8.5]);
  p(pupaLight, [-3.2, -15.2], [0.8, -15.6], [2.5, -13], [-2, -12.2]);
  trace([[-3, -11.5], [0, -13], [3, -11.5]], "#694875", 1.2);

  if (back) {
    r(-1.6, -8.5, 3.2, 2.2, woodLight);
    r(-0.8, -7.8, 1.6, 1.2, sacLight);
  } else {
    p(out, [-5.5, -6.8], [-4, -11], [4, -11], [5.5, -6.8], [4, -3], [-4, -3]);
    p(woodMid, [-4.2, -6.8], [-3, -9.8], [3, -9.8], [4.2, -6.8], [3, -4.2], [-3, -4.2]);
    r(-2.2, -9.2, 4.4, 1.1, woodLight);
    for (const ex of [-3.2, 1.4]) {
      r(ex - 0.6, -8.2, 3.0, 2.9, out);
      r(ex, -7.6, 1.9, 1.8, amber);
      r(ex + 0.2, -7.5, 0.9, 0.9, "#ffffff");
    }
    for (const fx of [-2.4, 1.2]) {
      r(fx - 0.3, -4.5, 1.8, 2.4, out);
      r(fx, -4.2, 1.1, 1.7, sacLight);
    }
  }
};

export const sluiceDragon: Painter = ({ r, p, trace, frame, live, gate, fractured, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#17272a";
  const scaleDeep = "#20383d", scaleMid = "#395e61", scaleLight = "#65918a", scaleRim = "#9ecab9";
  const boneDeep = "#7d6854", boneMid = "#c9ae82", boneLight = "#ede0b8", boneHi = "#fff7de";
  const antlerDeep = "#402f23", antlerMid = "#78583c", antlerLight = "#b88d5c";
  const bronzeDeep = "#3c3026", bronzeMid = "#7f6241", bronzeLight = "#c79d5e", bronzeHi = "#f7dc8e";
  const mossDeep = "#304a33", mossMid = "#587d47", mossLight = "#98b86b";
  const tideDeep = "#367d75", tideMid = "#6ec4b4", tideHi = "#c8fff0";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const open = gate ?? Number(skill);
  const bob = live ? Math.sin((f * Math.PI) / 4) * 1.1 : 0;

  if (side) {
    const tailWave = live ? Math.sin((f * Math.PI) / 4) * 2.0 : 0;
    for (const dx of [-13, 12]) {
      p(out, [dx - 5, -10], [dx + 3, -10], [dx + 6, -3], [dx + 4, 2], [dx - 6, 2], [dx - 7, -3]);
      p(scaleDeep, [dx - 3.8, -9], [dx + 2, -9], [dx + 4.5, -3], [dx + 3, 0.5], [dx - 4.5, 0.5]);
      r(dx + 1, -1.5, 2.2, 2.2, boneMid);
    }

    p(out,
      [-28, -9 + tailWave], [-26, -18 + tailWave], [-19, -17 + tailWave * 0.6], [-14, -14],
      [-7, -23 + bob], [5, -26 + bob], [18, -22 + bob], [22, -13 + bob],
      [15, -5 + bob], [4, -4 + bob], [-7, 1], [-17, 2.5], [-25, -2 + tailWave * 0.5], [-28.5, -6 + tailWave]);
    p(scaleDeep,
      [-26.5, -9.5 + tailWave], [-24.5, -16.5 + tailWave], [-18.5, -15.5 + tailWave * 0.6], [-13.5, -13],
      [-6.5, -21.5 + bob], [5, -24.5 + bob], [16.8, -20.8 + bob], [20.5, -13 + bob],
      [14, -6.5 + bob], [4, -5.5 + bob], [-7, -0.5], [-16.5, 1], [-24, -3 + tailWave * 0.5]);
    p(scaleMid,
      [-25, -10.5 + tailWave], [-23.5, -15.5 + tailWave], [-18, -14.8 + tailWave * 0.6], [-13, -12.8],
      [-6, -21 + bob], [5, -23.8 + bob], [16, -20 + bob], [19, -13.5 + bob],
      [11.5, -8.5 + bob], [1, -8 + bob], [-11, -3.5], [-21, -5 + tailWave * 0.5]);
    p(scaleLight, [-12, -16 + bob], [-4, -21 + bob], [6, -23 + bob], [14, -19 + bob], [9, -15 + bob], [-5, -13 + bob]);
    for (const [sx, baseY] of [[-19, -10], [-11, -12], [-2, -14.5], [7, -14.5]]) {
      const sy = baseY + bob + (live ? Math.sin((f * Math.PI) / 4 + sx * 0.24) * 1.4 : 0);
      p(scaleDeep, [sx - 3.2, sy - 4], [sx + 3.2, sy - 5], [sx + 4.2, sy + 2], [sx - 2.2, sy + 3]);
      p(scaleMid, [sx - 2.5, sy - 3.5], [sx + 2.5, sy - 4.4], [sx + 3.2, sy + 1], [sx - 1.5, sy + 2]);
      r(sx - 2, sy - 4, 4.5, 1.4, scaleRim);
    }
    p("#a3b58c", [-22, -3.5], [-13, -2], [-4, -6], [-4, -3], [-14, 1], [-22, 0]);
    trace([[-25, -13 + tailWave], [-19, -15 + tailWave * 0.6], [-13, -13]], tideMid, 1.3);
  } else {
    p(out, [-25, -16 + bob], [-21, -28 + bob], [0, -32 + bob], [21, -28 + bob], [25, -16 + bob], [20, -4], [-20, -4]);
    p(scaleDeep, [-23.5, -16 + bob], [-19.5, -26.5 + bob], [0, -30.5 + bob], [19.5, -26.5 + bob], [23.5, -16 + bob], [18.5, -5.5], [-18.5, -5.5]);
    p(scaleMid, [-22, -16.5 + bob], [-18.5, -26 + bob], [0, -29.8 + bob], [18.5, -26 + bob], [22, -16.5 + bob], [16, -8], [-16, -8]);
    p(scaleLight, [-17, -21 + bob], [-11, -27 + bob], [7, -28 + bob], [13, -22 + bob], [0, -18 + bob]);
    for (const d of [-1, 1]) {
      r(d * 14.5, -21.5 + bob, 5.5, 2, scaleRim);
      r(d * 15.5, -16.5 + bob, 5.5, 2, scaleDeep);
    }
    if (back) {
      p(out, [-7, -20], [7, -20], [9, -9], [7, -1], [11, 4], [5, 7], [-3, 5], [-7, -3], [-9, -11]);
      p(scaleDeep, [-5.5, -19], [5.5, -19], [7.5, -9], [5.5, -1.5], [9, 3.2], [4.5, 5.5], [-2, 3.8], [-5.5, -3], [-7.5, -11]);
      p(scaleMid, [-4.5, -18.5], [4.5, -18.5], [6, -9], [4.5, -2], [7, 2.8], [4, 4.5], [-1.5, 3], [-4.5, -3.5]);
      for (const ty of [-16, -11, -6, -1]) r(-1.8, ty, 3.6, 2.2, scaleRim);
    }
  }

  const drawStrap = (sx: number, sy: number) => {
    p(out, [sx - 3.6, sy - 10], [sx + 3.6, sy - 10], [sx + 5, sy - 1], [sx + 2.2, sy + 5], [sx - 4, sy + 3]);
    p(bronzeDeep, [sx - 2.4, sy - 9], [sx + 2.4, sy - 9], [sx + 3.8, sy - 1], [sx + 1.2, sy + 3.8], [sx - 2.6, sy + 2]);
    p(bronzeMid, [sx - 2, sy - 8.5], [sx + 1.8, sy - 8.5], [sx + 2.8, sy - 1.5], [sx + 0.5, sy + 2.5], [sx - 2, sy + 1.5]);
    r(sx - 1.1, sy - 7, 2.4, 2.4, skill ? tideHi : bronzeHi);
    r(sx - 0.6, sy - 1, 2.2, 1.6, bronzeLight);
  };
  for (const sx of fractured ? (side ? [-8, 1] : [13]) : (side ? [-16, -8, 1] : [-15, 13])) {
    drawStrap(sx, (side ? -13.5 : -14.5) + bob);
  }
  if (fractured) {
    const fx = side ? -19 : -15;
    trace([[fx - 3, -21], [fx, -14.5], [fx - 2, -10], [fx + 2.5, -6.5]], "#c96e4b", 2.6);
    trace([[fx - 3, -20], [fx, -14.5], [fx - 2, -10]], "#ffe296", 1.1);
  }

  const gx = side ? -6.5 : 0;
  const gTop = Math.round((side ? -42 : -45) * (1 - open) - 52 * open) + bob;
  p(out,
    [gx - 15.5, -20 + bob], [gx - 14.5, -36 + bob], [gx - 9.5, gTop], [gx + 9.5, gTop],
    [gx + 14.5, -36 + bob], [gx + 15.5, -20 + bob], [gx + 9, -16 + bob], [gx - 9, -16 + bob]);
  p(scaleDeep,
    [gx - 14, -20.5 + bob], [gx - 13, -35 + bob], [gx - 8.5, gTop + 1.5], [gx + 8.5, gTop + 1.5],
    [gx + 13, -35 + bob], [gx + 14, -20.5 + bob], [gx + 8, -17.5 + bob], [gx - 8, -17.5 + bob]);
  p(scaleMid,
    [gx - 13, -21.5 + bob], [gx - 12, -34.5 + bob], [gx - 8, gTop + 2], [gx + 8, gTop + 2],
    [gx + 11.5, -34.5 + bob], [gx + 12, -21.5 + bob]);
  trace([[gx - 11.5, -34.5 + bob], [gx - 7.5, gTop + 2.5], [gx + 7.5, gTop + 2.5], [gx + 11.5, -34.5 + bob]], bronzeLight, 2.2);
  r(gx - 7, gTop + 2, 14, 1.8, bronzeHi);
  p(mossDeep, [gx - 11.5, gTop + 2], [gx - 2, gTop + 1], [gx - 1, gTop + 7.5], [gx - 10, gTop + 7.5]);
  p(mossMid, [gx - 10.5, gTop + 2.5], [gx - 3, gTop + 1.8], [gx - 2.5, gTop + 6], [gx - 9, gTop + 6]);
  r(gx - 9, gTop + 3, 4.5, 1.6, mossLight);

  const liftGate = -Math.round(open * 7);
  r(gx - 8.5, -35.5 + bob, 17, 16, out);
  r(gx - 6.8, -34.2 + bob, 13.6, 13.5, open > 0.2 ? tideDeep : bronzeDeep);
  if (open > 0.2) {
    r(gx - 6.8, -28 + bob, 13.6, 7.2, tideMid);
    r(gx - 5, -26 + bob, 10, 3.6, tideHi);
    r(gx - 3, -25.2 + bob, 6, 1.8, "#ffffff");
  }
  for (const bx of [gx - 4.4, gx - 0.9, gx + 2.6]) {
    r(bx, -34.2 + bob + liftGate, 2.0, 12, open > 0.2 ? bronzeHi : bronzeLight);
    r(bx, -34.2 + bob + liftGate, 0.9, 12, bronzeDeep);
  }
  for (const lx of [gx - 12.2, gx + 9.2]) {
    r(lx - 0.8, -36.5 + bob, 4.6, 4.6, out);
    r(lx, -35.7 + bob, 3.0, 3.0, open > 0.2 || striking ? tideMid : bronzeHi);
    r(lx + 0.5, -35.3 + bob, 1.3, 1.3, "#ffffff");
  }

  if (side) {
    const headShiftX = windup ? -3 : striking ? 4 : 0;
    const headShiftY = windup ? -3.5 : striking ? 2.5 : 0;
    const hx = 14.5 + headShiftX, hy = -28 + open * 2.5 + bob + headShiftY;
    const sweep = open > 0.2 || windup ? -3.5 : 0;
    const mainHorn: Point[] = [[hx - 5, hy - 4], [hx - 11.5 + sweep, hy - 16.5], [hx - 18 + sweep, hy - 23]];
    trace(mainHorn, out, 4.8);
    trace(mainHorn, antlerMid, 2.6);
    trace([[hx - 5.5, hy - 4.5], [hx - 11.5 + sweep, hy - 16.5], [hx - 17.5 + sweep, hy - 22.5]], antlerLight, 1.0);
    trace([[hx - 11.5 + sweep, hy - 16.5], [hx - 7 + sweep, hy - 23], [hx - 9.5 + sweep, hy - 26.5]], out, 3.8);
    trace([[hx - 11.5 + sweep, hy - 16.5], [hx - 7 + sweep, hy - 23], [hx - 9.5 + sweep, hy - 26.5]], antlerLight, 1.8);
    trace([[hx - 8 + sweep, hy - 11], [hx - 2.5 + sweep, hy - 16.5]], antlerLight, 1.6);

    p(out, [hx - 13, hy - 3], [hx - 15, hy - 11], [hx - 7, hy - 11], [hx - 1.5, hy + 1], [hx - 4, hy + 13.5], [hx - 12, hy + 16.5]);
    p(mossDeep, [hx - 11.5, hy - 3], [hx - 13.5, hy - 9.5], [hx - 7, hy - 9.5], [hx - 3, hy + 1], [hx - 5, hy + 12], [hx - 11, hy + 14.8]);
    p(mossMid, [hx - 11, hy - 3.5], [hx - 12.5, hy - 9], [hx - 7.5, hy - 9], [hx - 4.5, hy + 1], [hx - 6.5, hy + 10], [hx - 10.5, hy + 12]);
    r(hx - 11, hy - 6.5, 4.5, 2.2, mossLight);

    const jaw = open > 0.2 || striking ? 6 : windup ? 3 : 0;
    p(out,
      [hx - 9.5, hy - 2], [hx - 8.5, hy - 11], [hx - 1, hy - 15], [hx + 7.5, hy - 13], [hx + 11, hy - 8.5],
      [hx + 19, hy - 5.5], [hx + 21, hy + 0.5], [hx + 15.5, hy + 6.5 + jaw], [hx + 5, hy + 7 + jaw], [hx - 5, hy + 4.5]);
    p(boneDeep,
      [hx - 8, hy - 2], [hx - 7, hy - 9.5], [hx - 1, hy - 13.5], [hx + 7, hy - 11.5], [hx + 10, hy - 7.5],
      [hx + 17.5, hy - 4.8], [hx + 19.2, hy + 0.2], [hx + 14.5, hy + 5.2 + jaw], [hx + 5, hy + 5.6 + jaw], [hx - 4, hy + 3.5]);
    p(boneMid,
      [hx - 7.5, hy - 2.5], [hx - 6.5, hy - 9], [hx - 1, hy - 12.8], [hx + 6.8, hy - 11], [hx + 9.5, hy - 7.2],
      [hx + 16.5, hy - 4.5], [hx + 18, hy - 0.5], [hx + 12, hy + 1.5], [hx - 3, hy + 1.5]);
    p(boneLight, [hx - 5.5, hy - 8.5], [hx - 0.5, hy - 12.2], [hx + 6.5, hy - 10.5], [hx + 15.5, hy - 4.5], [hx + 9, hy - 2.5], [hx - 2, hy - 4]);
    r(hx + 1, hy - 11.2, 7.5, 1.5, boneHi);
    r(hx + 15.5, hy - 3.5, 2.2, 1.4, out);
    p(out, [hx - 4, hy + 0.8], [hx + 18.5, hy + 0.2], [hx + 15, hy + 3.8 + jaw], [hx + 5, hy + 5.8 + jaw], [hx - 3, hy + 4]);
    p(boneHi, [hx + 9.5, hy + 0.8], [hx + 13, hy + 0.8], [hx + 11, hy + 5]);
    p(boneHi, [hx + 4, hy + 1.2], [hx + 7, hy + 1.2], [hx + 5.4, hy + 4.5]);
    r(hx + 4.2, hy - 8.6, 4.2, 4.0, out);
    r(hx + 5.0, hy - 7.8, 2.6, 2.6, open > 0.2 || striking ? tideHi : bronzeHi);
    r(hx + 5.4, hy - 7.5, 1.2, 1.2, "#ffffff");
    trace([[hx + 10.5, hy + 2], [hx + 17, hy - 2], [hx + 23, hy - 1]], out, 2.8);
    trace([[hx + 10.5, hy + 2], [hx + 17, hy - 2], [hx + 23, hy - 1]], boneLight, 1.3);
    if (open > 0.2 || striking) {
      p(tideMid, [hx + 9, hy + 5], [hx + 19, hy + 5], [hx + 21, hy + 12], [hx + 16, hy + 15.5], [hx + 12, hy + 11.5]);
      p(tideHi, [hx + 12, hy + 6.5], [hx + 18, hy + 6.5], [hx + 19, hy + 10.5], [hx + 15, hy + 12]);
      r(hx + 13.5, hy + 7.2, 3.8, 1.8, "#ffffff");
    }
    if (striking) {
      // Sweeping draconic jaw-and-water fang slash arc!
      trace([[hx + 14, hy - 10], [hx + 26, hy + 1], [hx + 20, hy + 14]], tideHi, 2.8);
      trace([[hx + 16, hy - 7], [hx + 24, hy + 1], [hx + 19, hy + 11]], "#ffffff", 1.3);
    }
  } else if (!back) {
    const hy = (open > 0.2 ? -21.5 : -25.5) + bob;
    for (const d of [-1, 1]) {
      const horn: Point[] = [[d * 8.5, hy - 3], [d * 14.5, hy - 16], [d * 20, hy - 22.5]];
      trace(horn, out, 4.8);
      trace(horn, antlerMid, 2.5);
      trace([[d * 13.5, hy - 13], [d * 9.5, hy - 19], [d * 8.5, hy - 25.5]], out, 3.6);
      trace([[d * 13.5, hy - 13], [d * 9.5, hy - 19], [d * 8.5, hy - 25.5]], antlerLight, 1.8);
      p(out, [d * 8, hy - 3], [d * 15, hy - 7.5], [d * 20, hy - 3], [d * 18, hy + 9], [d * 10, hy + 13]);
      p(mossMid, [d * 9, hy - 3], [d * 14.5, hy - 6], [d * 18.5, hy - 2.5], [d * 16.5, hy + 7.5], [d * 10.5, hy + 11]);
      r(d * 13.5 - 1, hy - 2, 3.4, 2.2, mossLight);
    }
    p(out, [-16, hy - 3], [-12.5, hy - 11], [-5.5, hy - 14], [5.5, hy - 14], [12.5, hy - 11], [16, hy - 3], [12.5, hy + 5.5], [7.5, hy + 11], [-7.5, hy + 11], [-12.5, hy + 5.5]);
    p(boneDeep, [-14.5, hy - 3], [-11.2, hy - 9.8], [-5, hy - 12.6], [5, hy - 12.6], [11.2, hy - 9.8], [14.5, hy - 3], [11.2, hy + 4.5], [6.8, hy + 9.5], [-6.8, hy + 9.5], [-11.2, hy + 4.5]);
    p(boneMid, [-13.5, hy - 3.5], [-10.5, hy - 9.2], [-4.8, hy - 12], [4.8, hy - 12], [10.5, hy - 9.2], [13.5, hy - 3.5], [9.8, hy + 3.5], [5.5, hy + 7.5], [-5.5, hy + 7.5], [-9.8, hy + 3.5]);
    p(boneLight, [-5, hy - 11], [5, hy - 11], [3.5, hy + 1.5], [-3.5, hy + 1.5]);
    r(-3, hy - 10.5, 6, 1.6, boneHi);
    trace([[-10.5, hy - 8.5], [-4, hy - 6], [4, hy - 6], [10.5, hy - 8.5]], boneDeep, 1.6);
    r(-3.8, hy - 1, 1.8, 1.8, out);
    r(2.0, hy - 1, 1.8, 1.8, out);
    p(out, [-10.5, hy + 3], [10.5, hy + 3], [7.5, hy + 7], [-7.5, hy + 7]);
    for (const d of [-1, 1]) {
      p(boneHi, [d * 6.5, hy + 3], [d * 9.8, hy + 3], [d * 8, hy + 7.8]);
      trace([[d * 11, hy + 2], [d * 17.5, hy], [d * 23, hy + 1.2]], out, 3.0);
      trace([[d * 11, hy + 2], [d * 17.5, hy], [d * 23, hy + 1.2]], boneLight, 1.4);
      const ex = d < 0 ? -7.2 : 3.2;
      r(ex - 0.8, hy - 7.6, 4.2, 4.0, out);
      r(ex, hy - 6.8, 2.6, 2.5, open > 0.2 ? tideHi : bronzeHi);
      r(ex + 0.4, hy - 6.5, 1.1, 1.1, "#ffffff");
    }
  } else {
    r(-8.5, -28.5 + bob, 17, 4.2, scaleRim);
    for (const rx of [-9.5, 7.2]) r(rx, -23.5 + bob, 2.4, 2.4, bronzeHi);
    trace([[-1, -20.5 + bob], [-1, -9], [2, -1]], tideMid, open > 0.2 ? 3.0 : 1.4);
  }

  for (const dx of [-17.5, side ? 9.5 : 17.5]) {
    p(out, [dx - 5.5, -11.5], [dx + 2, -11.5], [dx + 7.5, -5], [dx + 6.5, -0.5], [dx - 3.5, 2.5], [dx - 9.5, -2]);
    p(scaleDeep, [dx - 4.2, -10.2], [dx + 1.5, -10.2], [dx + 6, -4.8], [dx + 5.2, -1.5], [dx - 3, 1], [dx - 7.8, -2.5]);
    p(scaleMid, [dx - 3.8, -9.8], [dx + 1, -9.8], [dx + 4.8, -5], [dx + 3.5, -2.5], [dx - 3, -1], [dx - 6.5, -3.5]);
    p(scaleLight, [dx - 3.2, -9.2], [dx + 0.8, -9.2], [dx + 2, -6], [dx - 2.5, -5.5]);
    for (const cx of [-4, -0.8, 2.4]) r(dx + cx, -2.6, 2.0, 2.6, boneHi);
  }

  if (skill && side && !live) {
    p(tideDeep, [2, -1], [12, -5.5], [19, -7.5], [22, -12], [29, -9.5], [35, -3], [32, 1.5], [13, 3.5], [6, 4.5], [-4, 3.5]);
    p(tideMid, [6, -1], [15, -4], [22, -7.5], [28, -7.5], [33, -2.5], [28, 1], [12, 2.5]);
    trace([[7, 0.5], [16, -1.5], [24, -4.5], [30, -6.5], [34.5, -3]], tideHi, 1.8);
    trace([[13, -4.5], [21, -6.5], [28, -8.5]], "#ffffff", 1.1);
    for (const [dx, dy] of [[24, -10.5], [30, -8.5], [33, -1]]) r(dx, dy, 2.4, 1.5, "#e6e0b8");
  }
};

export function reedPost({ r, p, trace }: Art, tier: number) {
  const fortified = tier === 2 || tier === 3;
  const patrol = tier >= 4;
  const full = tier === 3 || tier === 5;
  const out = "#263332";
  const stoneDeep = "#3c4b4b", stoneMid = "#5b6f6a", stoneLight = "#899e90";
  const timberDeep = "#453429", timberMid = "#795a40", timberLight = "#ac8459", timberRim = "#cfa876";
  const roofDeep = fortified ? "#2e4b52" : "#344c38";
  const roofMid = fortified ? "#497378" : "#56784c";
  const roofLight = fortified ? "#7aa4a0" : "#83a166";
  const roofRim = fortified ? "#b1d1c7" : "#b8c78a";
  const bannerDeep = "#733b30", bannerMid = "#b55d42", bannerLight = "#e38e62";
  const ropeMid = "#caa673", ropeLight = "#f0d9a8";
  const brass = "#e2b86d", brassHi = "#fff0bf";

  // Tall, slender marsh stilt-pavilion silhouette (matching arrow/prism/storm height: y ∈ [-49..6], x ∈ [-18..18])
  const eaveW = tier === 0 ? 17 : 18.5;
  const roofPeak = full ? -50 : tier >= 2 ? -48 : -45;
  const deckY = -10;

  // 1. Compact marsh stone footing & elevated wooden stilt legs
  p(out,
    [-19, 2], [-17, -4], [-14, deckY], [-13, -30], [-eaveW - 1, -30], [-14, -39], [0, roofPeak - 1],
    [14, -39], [eaveW + 1, -30], [13, -30], [14, deckY], [17, -4], [19, 2], [14, 6], [-14, 6]);

  p(stoneDeep, [-17.5, 1], [-15, -4], [15, -4], [17.5, 1], [13.5, 4.5], [-13.5, 4.5]);
  p(stoneMid, [-16, 0], [-14, -3.5], [14, -3.5], [16, 0], [12, 3], [-12, 3]);
  p(stoneLight, [-14, -1.5], [-12, -3.5], [3, -3.5], [1, -1.5], [-11, -1]);
  r(-12, 3.2, 6, 1, "#6b998b");
  r(4, 3.4, 7, 1, "#6b998b");

  // Tall stilt pilings + cross-bracing beneath raised boardwalk deck
  p("#1d2b2b", [-12, -3], [-12, deckY + 1], [12, deckY + 1], [12, -3]);
  trace([[-10, -3], [10, deckY + 1]], timberDeep, 2.2);
  trace([[10, -3], [-10, deckY + 1]], timberMid, 2.0);
  for (const px of [-13.5, -5, 5, 13.5]) {
    r(px - 1.6, deckY, 3.2, 11.5, out);
    r(px - 0.9, deckY + 0.5, 1.8, 10, px < 0 ? timberLight : timberMid);
  }

  // Raised timber deck beam
  p(out, [-16, deckY - 3], [16, deckY - 3], [17, deckY + 2], [-17, deckY + 2]);
  p(timberMid, [-15, deckY - 2], [15, deckY - 2], [15.5, deckY + 1], [-15.5, deckY + 1]);
  r(-14, deckY - 1.8, 18, 1.2, timberRim);

  // 2. Slender tall watch-lodge walls (y: -12 .. -31)
  p(timberMid, [-12.5, deckY - 2], [-12, -31], [12, -31], [12.5, deckY - 2]);
  p(timberDeep, [5, -31], [12, -31], [12.5, deckY - 2], [6, deckY - 2]);
  p(timberLight, [-12, -30], [-9.5, -30], [-9.5, deckY - 2], [-12, deckY - 2]);
  r(-11.4, -29, 1.2, 16, timberRim);
  for (const y of [-25, -20, -15]) {
    r(-11, y, 5, 0.9, timberDeep);
    r(6, y, 5, 0.9, timberDeep);
  }

  // Tall arched reed-lodge entrance + warm upper watch lantern
  p("#2c2522", [-6.2, deckY - 2], [-6.2, -23], [-3.6, -27], [3.6, -27], [6.2, -23], [6.2, deckY - 2]);
  p("#162324", [-4.4, deckY - 2.2], [-4.4, -22], [-2.4, -25], [2.4, -25], [4.4, -22], [4.4, deckY - 2.2]);
  r(-6, deckY - 2.6, 12, 1.4, timberRim);

  // Warm watch window/lantern on right post
  r(6.8, -26.5, 4.4, 5.8, out);
  r(7.6, -25.6, 2.8, 4.0, tier >= 1 ? "#f7c468" : "#d99b52");
  r(8, -25.2, 1.4, 1.8, brassHi);

  // 3. Steep, lofty thatched reed spire-roof (or slate-shingle dike steeple)
  p(out, [-eaveW - 1, -29], [-eaveW + 2, -37], [-9, roofPeak + 4], [0, roofPeak - 1],
    [9, roofPeak + 4], [eaveW - 2, -37], [eaveW + 1, -29], [13, -27.5], [-13, -27.5]);
  p(roofDeep, [-eaveW + 0.8, -29.8], [-eaveW + 3, -37], [-8.2, roofPeak + 5], [0, roofPeak + 0.8],
    [8.2, roofPeak + 5], [eaveW - 3, -37], [eaveW - 0.8, -29.8], [12.5, -28.5], [-12.5, -28.5]);
  p(roofMid, [-eaveW + 1.6, -30.5], [-eaveW + 3.6, -37], [-7.5, roofPeak + 5.5], [0, roofPeak + 1.4],
    [7.5, roofPeak + 5.5], [eaveW - 3.6, -37], [eaveW - 1.6, -30.5], [11.5, -29.5], [-11.5, -29.5]);
  p(roofLight, [-eaveW + 2.5, -31.5], [-12, -37.5], [-6.5, roofPeak + 5.5], [0, roofPeak + 1.6],
    [2.5, roofPeak + 3.5], [-3, roofPeak + 8], [-9.5, -33], [-13.5, -31]);
  p(roofRim, [-10.5, -37], [-5.5, roofPeak + 6], [0, roofPeak + 2], [1.5, roofPeak + 4], [-4, roofPeak + 7.5], [-8.5, -35]);
  for (const [ry, left, right] of [[roofPeak + 8, -5, 6], [roofPeak + 13, -9, 10], [-33, -14, 14]]) {
    for (let sx = left; sx < right; sx += 4) r(sx, ry, 2.4, 0.9, sx < 1 ? roofRim : roofDeep);
  }
  r(-15, -30, 30, 1.5, fortified ? brass : timberLight);
  r(-13, -29.6, 13, 0.75, fortified ? brassHi : timberRim);

  // Carved otter medallion high under the tall eaves
  p(out, [-4.8, -32.5], [-4.8, -37.5], [-2, -39.8], [2, -39.8], [4.8, -37.5], [4.8, -32.5], [1.8, -30.5], [-1.8, -30.5]);
  p(fortified ? "#52787a" : "#875c42", [-3.5, -33], [-3.5, -36.8], [-1.5, -38.4], [1.5, -38.4], [3.5, -36.8], [3.5, -33], [1.2, -31.6], [-1.2, -31.6]);
  p(brassHi, [-2.2, -33.8], [-2.4, -36.2], [-1, -37.2], [1, -37.2], [2.4, -36.2], [2.2, -33.8], [0, -32.6]);
  r(-1.3, -35.6, 0.9, 0.9, out);
  r(0.5, -35.6, 0.9, 0.9, out);

  // 4. Tier 1+: Tall mooring pilings & roof finial
  if (tier >= 1) {
    for (const side of [-1, 1]) {
      const px = side * 15.5;
      p(out, [px - 2.6, 2], [px - 2.6, -22], [px, -25.5], [px + 2.6, -22], [px + 2.6, 2]);
      p(timberMid, [px - 1.5, 0.5], [px - 1.5, -21], [px, -23.5], [px + 1.5, -21], [px + 1.5, 0.5]);
      r(px - 1.2, -19, 1.2, 13, timberLight);
      r(px - 1.8, -17, 3.6, 1.6, ropeMid);
    }
    p(out, [-3.5, roofPeak + 1], [0, roofPeak - 4], [3.5, roofPeak + 1]);
    p(timberLight, [-2, roofPeak + 0.5], [0, roofPeak - 2.6], [2, roofPeak + 0.5]);
  }

  // 5. Fortified branch: 3级 固堤班 / 4级 系缆阵
  if (fortified) {
    for (const side of [-1, 1]) {
      const bx = side * 16.2;
      p(out, [bx - 3.8, 3], [bx - 3.8, -24], [bx - 0.8, -28], [bx + 1.5, -28], [bx + 3.8, -24], [bx + 3.8, 3]);
      p("#7b4d3f", [bx - 2.5, 1.5], [bx - 2.5, -23], [bx, -26], [bx + 2.5, -23], [bx + 2.5, 1.5]);
      p("#b87556", [bx - 2, 0], [bx - 2, -22.5], [bx, -25], [bx + 0.4, -22], [bx + 0.4, 0]);
      r(bx - 2.6, -21, 5.2, 2, brass);
      r(bx - 1.8, -20.8, 2.5, 0.9, brassHi);
    }
    if (full) {
      trace([[-17, -17.5], [-9, -14.5], [0, -16], [9, -14.5], [17, -17.5]], out, 3.6);
      trace([[-17, -17.5], [-9, -14.5], [0, -16], [9, -14.5], [17, -17.5]], ropeMid, 1.9);
      trace([[-16, -18], [-9, -15.2], [0, -16.8], [9, -15.2], [16, -18]], ropeLight, 0.9);
      // Tall luminous jade tide-crystal spire at roof peak
      p(out, [-4, roofPeak + 3], [0, roofPeak - 6], [4, roofPeak + 3], [0, roofPeak + 7]);
      p("#52a898", [-2.6, roofPeak + 2.5], [0, roofPeak - 4], [2.6, roofPeak + 2.5], [0, roofPeak + 5]);
      p("#c8fff0", [-1.2, roofPeak + 1.8], [0, roofPeak - 2.2], [1, roofPeak + 1.5]);
      r(-11.2, -26.5, 4.4, 5.8, out);
      r(-10.4, -25.6, 2.8, 4.0, "#8ef0d8");
      r(-10, -25.2, 1.4, 1.8, "#e8fff8");
    }
  }

  // 6. Patrol branch: 3级 探滩队 / 4级 双桨巡卫
  if (patrol) {
    const drawMountedPaddle = (px: number, dir: number) => {
      trace([[px, 1], [px + dir * 2, -37]], out, 3.8);
      trace([[px, 1], [px + dir * 2, -37]], timberLight, 1.9);
      const bx = px + dir * 2;
      p(out, [bx - 3.6, -35], [bx - 4.4, -45], [bx - 0.8, -51], [bx + 2.6, -51], [bx + 4.4, -45], [bx + 3.2, -35]);
      p(ropeMid, [bx - 2.4, -36], [bx - 3, -44.5], [bx - 0.4, -49.5], [bx + 1.8, -49.5], [bx + 3, -44.5], [bx + 1.8, -36]);
      p(ropeLight, [bx - 1.8, -38], [bx - 2.2, -44], [bx, -48.5], [bx + 0.8, -44], [bx, -38]);
      r(bx - 2.2, -49, 4.4, 2, brass);
      r(bx - 1.4, -48.8, 2.2, 0.9, brassHi);
    };
    drawMountedPaddle(15.2, 1);
    if (full) drawMountedPaddle(-15.8, -1);

    p(out, [8, -33], [21, -34], [18, -28], [21, -22], [8, -24]);
    p(bannerDeep, [9, -31.5], [19, -32.5], [16.5, -28], [19, -23.5], [9, -25]);
    p(bannerMid, [9.5, -31.5], [18, -32], [15.5, -28], [17, -25], [9.5, -26.5]);
    r(10.5, -30.5, 5.8, 1.4, bannerLight);
    r(11, -28, 4.5, 1.2, brassHi);

    if (full) {
      r(-1, roofPeak - 8, 2.2, 10, out);
      r(-0.4, roofPeak - 7.5, 1.1, 8.5, timberRim);
      p(out, [1, roofPeak - 8], [13.5, roofPeak - 5.5], [1, roofPeak - 1.5]);
      p(bannerMid, [1.5, roofPeak - 7], [11, roofPeak - 5.2], [1.5, roofPeak - 2.5]);
      r(2.5, roofPeak - 6.2, 4.8, 1.2, brassHi);
    }
  }
}

export const paddleOtter: Painter = ({ r, p, trace, frame, otter }, view, skill) => {
  const side = view === "side", back = view === "back";
  const tier = otter?.tier ?? 1;
  const branch = otter?.branch;
  const fixedBank = branch === "fixed-bank";
  const mudPatrol = branch === "mud-patrol";
  const mastery = tier >= 4;
  const pose: OtterPose = otter?.pose ?? (skill ? "brace" : "idle");
  const windup = pose === "windup";
  const striking = pose === "strike";
  const bracing = pose === "brace" || (skill && !windup && !striking);
  const idle = pose === "idle" && !bracing;
  const walking = pose === "walk";
  const f = ((frame % 6) + 6) % 6;

  // Clean, high-contrast palette matching rabbit-guard & frost-wolf clarity
  const ink = "#2f211e";
  const furShade = "#6b4735", fur = "#9d6e4e", furHi = "#bd8c67";
  const creamShade = "#d8c4a6", cream = "#f5ebd6", creamHi = "#fffaf0";
  const wood = "#966a45", woodHi = "#c99b68";
  const gold = "#ebca78", goldHi = "#fff4c4";
  const jade = "#7ee8cc";

  // Clean tunic + scarf color identity by tier/branch (parallels rabbit-guard)
  const coatDark = fixedBank ? "#26474a" : mudPatrol ? "#6b3124" : tier >= 2 ? "#29414f" : "#2c4c42";
  const coat = fixedBank ? "#3d7473" : mudPatrol ? "#b8553b" : tier >= 2 ? "#466c80" : "#477867";
  const coatHi = fixedBank ? "#65a39c" : mudPatrol ? "#dc7c58" : tier >= 2 ? "#6e99ad" : "#6ca38b";
  const scarf = fixedBank ? "#d9c27c" : mudPatrol ? "#e8a84d" : tier >= 2 ? "#e2b25c" : "#d99248";
  const scarfHi = "#ffebb8";
  const bladeBand = fixedBank ? (mastery ? jade : "#6eb5ac") : mudPatrol ? "#d96743" : tier >= 2 ? gold : "#5ba395";

  // Snappy motion curves + 6-frame idle with tail-slap (f=1..2 lift + blink, f=3 slap ground + splash!)
  const leanX = windup ? -2.8 : striking ? 4.2 : bracing ? 1.4 : 0;
  const x = (side ? 1.5 : 0) + leanX;
  const crouch = bracing ? 3.5 : windup ? 1.4 : striking ? 1.8 : 0;
  const slapLift = idle && (f === 1 || f === 2);
  const tailSlap = idle && f === 3;
  const slapAfter = idle && f === 4;
  const bob = idle ? [0, -1.0, -1.5, 0.9, -0.3, 0][f]
    : walking ? [0, -1.1, -1.6, -0.6, 0, 0.4][f]
    : 0;
  const py = bob + crouch;
  const blink = idle && f === 2;
  const earTwitch = idle && (f === 1 || f === 3) ? -0.9 : 0;
  const stepA = walking ? Math.sin((f * Math.PI) / 3) : 0;
  const stepB = -stepA;
  const tailSway = bracing ? -1.8
    : windup ? 2.2
    : striking ? -3.0
    : idle ? [0, -5.5, -9.8, 2.2, -1.2, 0.2][f]
    : Math.sin((f * Math.PI) / 3) * 1.6;

  // 0. Tier 4 Mud-Patrol: crisp spare brass-edged paddle tucked diagonally behind back
  if (mudPatrol && mastery) {
    trace([[x - 12.5, -36 + py], [x + 9, -7 + crouch * 0.4]], ink, 3.4);
    trace([[x - 12.5, -36 + py], [x + 9, -7 + crouch * 0.4]], woodHi, 1.5);
    p(ink, [x - 16.5, -40 + py], [x - 10, -42 + py], [x - 7.5, -35 + py], [x - 14, -33 + py]);
    p(gold, [x - 15, -39 + py], [x - 10.8, -40.5 + py], [x - 9, -35.8 + py], [x - 13.4, -34.5 + py]);
  }

  // 1. Signature sleek, long tapering otter rudder-tail (clean 2-tone curve; lifts high on f=1..2 and slaps ground on f=3!)
  const tMidY = slapLift ? -12.5 + tailSway * 0.45 : tailSlap ? -5.5 : -9.5 + tailSway * 0.5;
  const tTipY = tailSlap ? 1.8 : -2.5 + tailSway;
  const tTopY = tailSlap ? -2.2 : -6.5 + tailSway;
  const tBotY = tailSlap ? 3.8 : 2 + tailSway;
  p(ink,
    [x - 5, -12 + bob * 0.6], [x - 14, tMidY], [x - 23.5, tTopY], [x - 28.5, tTipY],
    [x - 26.5, tBotY], [x - 17, tailSlap ? 3.4 : 2.5 + tailSway * 0.5], [x - 7, 0.5]);
  p(furShade,
    [x - 6, -10.5 + bob * 0.6], [x - 14.5, tMidY + 1.4], [x - 22.8, tTopY + 1.2], [x - 26.8, tTipY + 0.5],
    [x - 24.8, tBotY - 1.3], [x - 16.5, tailSlap ? 2.0 : 1 + tailSway * 0.5], [x - 7.5, -1]);
  p(fur,
    [x - 7, -10 + bob * 0.6], [x - 15, tMidY + 1.6], [x - 22, tTopY + 1.4], [x - 25.2, tTipY],
    [x - 18, tailSlap ? 0.4 : -1.6 + tailSway * 0.6], [x - 9, -4.5 + bob * 0.4]);

  // Tail-slap ground impact splash & water droplets on idle f=3 (and tiny fading droplets on f=4)
  if (tailSlap) {
    // Crisp turquoise marsh-water ripple under slapped tail
    p("#54b3a4", [x - 31, 3.2], [x - 24, 0.8], [x - 14, 1.8], [x - 18, 4.8], [x - 29, 4.8]);
    r(x - 27, 2.2, 7.5, 1.3, creamHi);
    // Upward splash arc & droplets
    trace([[x - 29, 0.5], [x - 32, -4.5], [x - 30.5, -7.8]], "#88d6c7", 1.5);
    trace([[x - 21, -1.5], [x - 22.5, -6.5]], "#88d6c7", 1.3);
    r(x - 32.5, -9.2, 2.0, 2.0, creamHi);
    r(x - 24, -8.5, 1.8, 1.8, creamHi);
    r(x - 17.5, -4.8, 1.6, 1.6, "#88d6c7");
  } else if (slapAfter) {
    r(x - 30, -5.5, 1.5, 1.5, "#88d6c7");
    r(x - 22, -6.2, 1.4, 1.4, creamHi);
  }

  // 2. Clean webbed otter feet (no busy inner lines)
  const drawFoot = (fx: number, lift: number, far: boolean) => {
    const fy = (far ? -1 : 0.8) - Math.max(0, lift) * 2.0;
    p(ink, [fx - 5, fy - 1.5], [fx - 2, fy - 4], [fx + 3, fy - 3.8], [fx + 5.5, fy - 0.5], [fx + 4.5, fy + 2], [fx - 4.5, fy + 2]);
    p(far ? furShade : fur, [fx - 3.6, fy - 1], [fx - 1.5, fy - 2.6], [fx + 2.4, fy - 2.5], [fx + 4, fy - 0.3], [fx + 3.2, fy + 0.8], [fx - 3.2, fy + 0.8]);
  };
  if (side) {
    drawFoot(x - 4.5 + stepB * 2.8 + (windup ? -1.5 : 0), stepB, true);
    drawFoot(x + 5 + stepA * 3 + (striking ? 2.5 : 0), stepA, false);
  } else {
    drawFoot(x - 5.5, stepA, false);
    drawFoot(x + 5.5, stepB, false);
  }

  // 3. Clean, iconic tunic & scarf (simple large color blocks, zero strap clutter)
  p(ink,
    [x - 11.5, -5.5 + py * 0.5], [x - 12, -14 + py], [x - 9.5, -23.5 + py], [x + 9.5, -23.5 + py],
    [x + 12, -14 + py], [x + 11.5, -5.5 + py * 0.5], [x + 7, -2.5], [x - 7, -2.5]);
  p(coatDark,
    [x - 10, -6.5 + py * 0.5], [x - 10.4, -14 + py], [x - 8, -22 + py], [x + 8, -22 + py],
    [x + 10.4, -14 + py], [x + 10, -6.5 + py * 0.5], [x + 6, -4 + py * 0.3], [x - 6, -4 + py * 0.3]);
  p(coat,
    [x - 9.2, -7.5 + py * 0.5], [x - 9.6, -14.5 + py], [x - 7.5, -21.5 + py], [x + 7.2, -21.5 + py],
    [x + 9.2, -14.5 + py], [x + 7.2, -7.5 + py * 0.5], [x - 4, -6 + py * 0.5]);
  p(coatHi, [x - 8.5, -15 + py], [x - 6.8, -21 + py], [x + 1, -21 + py], [x - 1, -15 + py], [x - 6.5, -13 + py]);

  // Clean thin belt with single crisp buckle (like rabbit-guard)
  r(x - 8.8, -9.8 + py * 0.6, 17.6, 1.8, "#45342e");
  if (!back) {
    r(x + (side ? 1.5 : -1.5), -10.3 + py * 0.6, 3.2, 2.8, fixedBank && mastery ? jade : gold);
    r(x + (side ? 2.1 : -0.9), -9.8 + py * 0.6, 1.2, 1.2, creamHi);
  }

  // Branch shoulder accent (clean & readable)
  if (fixedBank) {
    for (const d of [-1, 1]) {
      p(ink, [x + d * 6, -22.5 + py], [x + d * 13.5, -21 + py], [x + d * 13, -15.5 + py], [x + d * 6.5, -16.5 + py]);
      p("#729e9a", [x + d * 7, -21.2 + py], [x + d * 12, -20 + py], [x + d * 11.6, -16.8 + py], [x + d * 7.4, -17.5 + py]);
      r(x + d * 9.5 - 1, -20.5 + py, 2, 1.1, mastery ? jade : creamHi);
    }
  } else if (mudPatrol) {
    // Fluttering scarf tail behind shoulder
    const flutter = Math.sin((f * Math.PI) / 3) * 1.8;
    p(ink, [x - 8, -21.5 + py], [x - 17, -20.5 + py + flutter], [x - 19, -15.5 + py + flutter], [x - 9.5, -16.5 + py]);
    p(scarf, [x - 8.5, -20.5 + py], [x - 15.8, -19.5 + py + flutter], [x - 17.2, -16.8 + py + flutter], [x - 9.5, -17.5 + py]);
    r(x - 15, -19 + py + flutter * 0.7, 4.5, 1.1, scarfHi);
  }

  // Clean neckerchief collar (signature warm accent separating head & tunic)
  p(ink, [x - 10, -21 + py], [x - 6, -24 + py], [x + 6, -24 + py], [x + 10, -21 + py], [x + 7, -17 + py], [x, -16 + py], [x - 7, -17 + py]);
  p(scarf, [x - 8.5, -20.8 + py], [x - 5.2, -23 + py], [x + 5.2, -23 + py], [x + 8.5, -20.8 + py], [x + 6, -18 + py], [x, -17.2 + py], [x - 6, -18 + py]);
  r(x - 4.5, -20.5 + py, 5.5, 1.2, scarfHi);

  // 4. Unmistakable OTTER HEAD: front preserved cleanly; side uses cute blunt 3/4 otter profile (zero pointy snout, both round ears logical)
  const hx = x + (side ? 1.0 : 0);
  const hy = -30 + py;

  // Small, low-set round otter ears
  const drawEar = (ex: number, ey: number, far = false) => {
    const dy = ey + earTwitch;
    p(ink, [ex - 3.6, dy + 1.2], [ex - 3.8, dy - 2.6], [ex - 1, dy - 4.5], [ex + 2.2, dy - 4.2], [ex + 3.8, dy - 1.5], [ex + 3, dy + 1.6]);
    p(far ? furShade : fur, [ex - 2.3, dy + 0.5], [ex - 2.4, dy - 2], [ex - 0.5, dy - 3.2], [ex + 1.6, dy - 3], [ex + 2.4, dy - 1.1], [ex + 1.8, dy + 0.6]);
    if (!back && !far) r(ex - 0.8, dy - 1.8, 1.8, 1.8, "#d4a488");
  };
  if (side) {
    // Far ear peeking cleanly behind upper-front crown in 3/4 view
    drawEar(hx + 7.2, hy - 6.0, true);
    // Near ear sitting cleanly on upper-back edge of round otter head
    drawEar(hx - 9.4, hy - 5.2, false);
  } else {
    drawEar(hx - 10.2, hy - 5.2);
    drawEar(hx + 10.2, hy - 5.2);
  }

  // Smooth, blunt, plump round otter head silhouette (same adorable roundness in both front & 3/4 side!)
  p(ink,
    [hx - 13, hy + 2], [hx - 12.2, hy - 5.5], [hx - 7.5, hy - 10.2], [hx + 7.5, hy - 10.2],
    [hx + 12.2, hy - 5.5], [hx + 13, hy + 2], [hx + 9.2, hy + 8], [hx - 9.2, hy + 8]);
  p(furShade,
    [hx - 11.4, hy + 1.6], [hx - 10.6, hy - 4.8], [hx - 6.5, hy - 8.8], [hx + 6.5, hy - 8.8],
    [hx + 10.6, hy - 4.8], [hx + 11.4, hy + 1.6], [hx + 7.8, hy + 6.6], [hx - 7.8, hy + 6.6]);
  p(fur,
    [hx - 10.5, hy + 0.4], [hx - 9.8, hy - 4.8], [hx - 6.2, hy - 8.4], [hx + 6.2, hy - 8.4],
    [hx + 9.8, hy - 4.6], [hx + 9.8, hy + 0.4], [hx + 5.5, hy + 4.8], [hx - 6.5, hy + 4.8]);
  p(furHi, [hx - 7, hy - 5.2], [hx - 4.5, hy - 8], [hx + 3.5, hy - 8], [hx + 4.8, hy - 5.2], [hx - 1.5, hy - 4.4]);

  // Clean Tier 2+ brow-band (parallels rabbit-guard's neat rank headband)
  if (tier >= 2) {
    p(ink, [hx - 10.2, hy - 5.2], [hx - 6.5, hy - 8.2], [hx + 6.5, hy - 8.2], [hx + 10.2, hy - 5.2], [hx + 8.5, hy - 3.6], [hx - 8.5, hy - 3.6]);
    p(fixedBank ? "#74a6a1" : coat, [hx - 8.8, hy - 5.2], [hx - 5.8, hy - 7.2], [hx + 5.8, hy - 7.2], [hx + 8.8, hy - 5.2], [hx + 7.5, hy - 4.4], [hx - 7.5, hy - 4.4]);
    r(hx + (side ? 1.8 : -1.5), hy - 7.2, 3, 2.4, fixedBank && mastery ? jade : goldHi);
    if (mudPatrol) {
      // Crisp scout crest feather tucked in headband (like rabbit spear branch!)
      p(ink, [hx - 9, hy - 6], [hx - 14.5, hy - 11.5], [hx - 11.5, hy - 13.5], [hx - 6.5, hy - 7.5]);
      p(scarfHi, [hx - 8.5, hy - 6.5], [hx - 13, hy - 11], [hx - 11, hy - 12.2], [hx - 7.2, hy - 7.5]);
    }
  }

  if (!back) {
    // Signature big continuous pale-cream otter cheeks, muzzle & chin bib (blunt & round, shifted gently in 3/4 side)
    const mx = hx + (side ? 3.2 : 0);
    const my = hy + 3.2;
    const ml = side ? 7.6 : 9.8, mr = side ? 7.8 : 9.8;
    p(creamShade,
      [mx - ml, my - 1.2], [mx - ml * 0.62, my - 4.2], [mx + mr * 0.62, my - 4.2],
      [mx + mr, my - 1.2], [mx + mr * 0.78, my + 4.2], [mx - ml * 0.78, my + 4.2]);
    p(cream,
      [mx - (ml - 0.8), my - 1.4], [mx - (ml - 0.8) * 0.62, my - 3.8], [mx + (mr - 0.8) * 0.62, my - 3.8],
      [mx + (mr - 0.8), my - 1.4], [mx + (mr - 0.8) * 0.75, my + 3.2], [mx - (ml - 0.8) * 0.75, my + 3.2]);
    r(mx - (side ? 3.0 : 4.2), my - 3.2, side ? 6.8 : 8.4, 2.0, creamHi);

    // Subtle rosy otter cheek blush
    if (side) {
      r(hx - 3.8, my - 0.6, 2.2, 1.3, "#e09c96");
    } else {
      r(hx - 8.4, my - 0.6, 2.2, 1.3, "#e09c96");
      r(hx + 6.2, my - 0.6, 2.2, 1.3, "#e09c96");
    }

    // Prominent blunt glossy black diamond otter nose + cute mouth (centered in 3/4 muzzle)
    const nx = hx + (side ? 4.4 : 0);
    p("#241e24", [nx - 2.4, my - 3.2], [nx + 2.4, my - 3.2], [nx + 1.6, my - 1.0], [nx, my - 0.2], [nx - 1.6, my - 1.0]);
    r(nx - 1.2, my - 3.0, 1.3, 0.9, "#899aa6");
    r(nx - 0.4, my - 0.2, 0.8, 1.5, "#78574a");
    r(nx - 2.0, my + 1.1, 4.0, 0.8, "#78574a");

    // Clean short cream otter whiskers
    for (const wy of [-1.2, 1.0]) {
      if (side) {
        r(mx + 6.2, my + wy, 3.2, 1.0, creamHi);
        r(mx - 8.8, my + wy, 3.2, 1.0, creamHi);
      } else {
        r(mx + 7.4, my + wy, 4.4, 1.0, creamHi);
        r(mx - 11.8, my + wy, 4.4, 1.0, creamHi);
      }
    }

    // Crisp dark expressive bead eyes with white specular catchlight (3/4 asymmetric pair on side, just like rabbit-guard!)
    const eyes: readonly [number, number][] = side
      ? [[hx - 1.2, 2.8], [hx + 6.4, 2.0]]
      : [[hx - 5.4, 2.8], [hx + 2.8, 2.8]];
    for (const [ex, ew] of eyes) {
      if (blink) {
        r(ex - 0.3, hy - 1.2, ew + 0.6, 1.1, "#2a232b");
      } else {
        r(ex, hy - 3.2, ew, 3.6, "#2a232b");
        r(ex + 0.4, hy - 2.8, Math.min(1.0, ew * 0.45), 1.2, creamHi);
      }
    }
    // Determined brow only in combat poses
    if (bracing || windup || striking) {
      r(hx + (side ? -1.8 : -6.2), hy - 4.4, side ? 10.6 : 12.4, 1.2, ink);
    }
  } else {
    r(hx - 4, hy - 6.5, 8, 1.8, furHi);
  }

  // 5. Iconic clean wooden boat-paddle (distinctive flat oar silhouette + painted river-band)
  const ox = side ? 11.5 : 10.5;
  const idleSway = idle ? [0, 0.7, 0.3, -0.7, -0.3, 0][f] : 0;

  if (windup) {
    // Coiled overhead paddle raise
    const tip: Point = [ox - 2, -10 + py];
    const end: Point = [x - 15.5, -40 + py];
    trace([tip, end], ink, 4.2);
    trace([tip, end], wood, 2.0);
    const [bx, by] = end;
    p(ink, [bx - 6.5, by - 4.5], [bx + 2.5, by - 8.5], [bx + 7, by - 2], [bx + 2.5, by + 5.5], [bx - 5.5, by + 3.5]);
    p(wood, [bx - 5, by - 3.5], [bx + 2, by - 7], [bx + 5.5, by - 1.5], [bx + 1.8, by + 4], [bx - 4.2, by + 2.5]);
    p(bladeBand, [bx - 4.5, by - 3], [bx + 2, by - 6.2], [bx + 3.5, by - 2.2], [bx - 2.2, by + 0.5]);
  } else if (striking) {
    // Fierce horizontal paddle cleave + clean luminous water-slash arc (clear of face)
    const tip: Point = [x - 4, -13 + py];
    const end: Point = [x + 24, -15 + py];
    p("#54b3a480", [x + 11, -33 + py], [x + 25, -28 + py], [x + 30, -14 + py], [x + 21, -4 + py], [x + 18, -11 + py], [x + 22, -21 + py], [x + 13, -27 + py]);
    trace([[x + 13, -30 + py], [x + 24.5, -24 + py], [x + 28.5, -14 + py], [x + 22, -7 + py]], bladeBand, 2.2);
    trace([[x + 16, -27 + py], [x + 23.5, -21 + py], [x + 26.5, -14 + py]], creamHi, 1.1);
    trace([tip, end], ink, 4.2);
    trace([tip, end], wood, 2.0);
    const [bx, by] = end;
    p(ink, [bx - 5.5, by - 5], [bx + 7.5, by - 5.8], [bx + 9.2, by], [bx + 6.5, by + 5.4], [bx - 5.5, by + 4.2]);
    p(wood, [bx - 4.2, by - 3.8], [bx + 6.2, by - 4.4], [bx + 7.8, by], [bx + 5.2, by + 4], [bx - 4.2, by + 3]);
    p(bladeBand, [bx + 2, by - 4], [bx + 6.2, by - 4.2], [bx + 7.4, by], [bx + 5, by + 3.6], [bx + 1.5, by + 3]);
    r(bx + 2.8, by - 3.4, 3.6, 1.3, creamHi);
  } else if (bracing) {
    // Planted diagonal breakwater paddle + crisp water ripple
    const tip: Point = [ox + 15, -15.5 + crouch * 0.5];
    const end: Point = [ox - 18.5, 0.8];
    trace([tip, end], ink, 4.2);
    trace([tip, end], wood, 2.0);
    const [bx, by] = end;
    p(ink, [bx - 10.5, by - 3.2], [bx - 3, by - 7.5], [bx + 6.5, by - 3.8], [bx + 6.5, by + 2.6], [bx - 2, by + 4], [bx - 10.5, by + 1.8]);
    p(wood, [bx - 9, by - 2.2], [bx - 2.8, by - 6], [bx + 5, by - 2.8], [bx + 5, by + 1.4], [bx - 1.8, by + 2.6], [bx - 9, by + 0.8]);
    r(bx - 8.6, by - 2.2, 3.2, 3.8, bladeBand);
    p("#5cb8aa", [bx - 12, by + 2.4], [bx - 2, by + 0.4], [bx + 8, by + 1.8], [bx + 2, by + 4.4], [bx - 9, by + 4]);
    r(bx - 6.5, by + 1.2, 5.5, 1.2, creamHi);
  } else {
    // Upright boat-paddle held cleanly at side (instantly readable teardrop oar blade)
    const tip: Point = [ox - 1.5, 2.5];
    const end: Point = [ox + 3.5 + idleSway, -37 + bob];
    trace([tip, end], ink, 4.0);
    trace([tip, end], wood, 2.0);
    trace([[tip[0] - 0.5, tip[1] - 0.5], [end[0] - 0.5, end[1] - 0.5]], woodHi, 0.9);
    const [bx, by] = end;
    p(ink, [bx - 5.2, by - 7.5], [bx + 2.6, by - 9], [bx + 6.8, by - 4], [bx + 5, by + 4], [bx - 1, by + 6.2], [bx - 5.2, by + 1.2]);
    p(wood, [bx - 3.8, by - 6.2], [bx + 2, by - 7.4], [bx + 5.2, by - 3.5], [bx + 3.8, by + 2.8], [bx - 0.8, by + 4.6], [bx - 3.8, by + 0.6]);
    p(woodHi, [bx - 3.2, by - 5.8], [bx + 1.6, by - 6.8], [bx + 2, by + 2], [bx - 1, by + 3.4], [bx - 3.2, by + 0.2]);
    // Crisp painted river-band across blade tip
    r(bx - 3.2, by - 7.2, 6.2, 2.4, bladeBand);
    r(bx - 2.2, by - 6.8, 3.2, 1.0, creamHi);
  }

  // 6. Neat, soft rounded otter forepaw gripping paddle (no bulky black box)
  const drawPaw = (pawX: number, pawY: number) => {
    p(ink, [pawX - 3.4, pawY - 2.4], [pawX + 3.4, pawY - 2.4], [pawX + 3.6, pawY + 2.6], [pawX - 3.2, pawY + 2.6]);
    p(fur, [pawX - 2.2, pawY - 1.4], [pawX + 2.2, pawY - 1.4], [pawX + 2.3, pawY + 1.5], [pawX - 2, pawY + 1.5]);
    r(pawX - 1.4, pawY - 1.1, 2.0, 1.0, furHi);
  };
  if (windup) {
    drawPaw(ox - 2, -14.5 + py);
    drawPaw(x - 5.5, -22 + py);
  } else if (striking) {
    drawPaw(x + 8.5, -13.5 + py);
    drawPaw(x + 1, -13 + py);
  } else {
    drawPaw(ox + 0.5 + idleSway * 0.3, -14.5 + py);
    if (bracing) drawPaw(ox - 8, -9 + py * 0.7);
  }
};

export function saltCaster({ r, p, trace }: Art, tier: number, firing: boolean | number) {
  const double = tier === 4;
  const heavy = tier === 3;
  const out = "#2a2b2d";
  const stoneDeep = "#3c4c4b", stoneMid = "#5b716b", stoneLight = "#8ba395";
  const timberDeep = "#463529", timberMid = "#7d5d41", timberLight = "#b3895c", timberRim = "#d6af7a";
  const ironDeep = "#3d464d", ironMid = "#637278", ironLight = "#97a8ab";
  const brassDeep = "#735432", brassMid = "#b58b4e", brassLight = "#e8c474", brassHi = "#fff2c2";
  const clayDeep = "#5e362c", clayMid = "#9c5942", clayLight = "#d18760";
  const glazeDeep = "#a89d8b", glazeMid = "#dcd4c0", glazeLight = "#f7f3e4", glazeHi = "#ffffff";

  const lift = typeof firing === "number" ? firing : Number(firing);
  const span = heavy || double ? 19 : 17.5;
  const deckY = -27;

  // 1. Compact octagonal stone foundation plinth (slender footprint, tall silhouette)
  p(out,
    [-span, 2], [-span + 2, -5], [-13, -10], [13, -10],
    [span - 2, -5], [span, 2], [span - 5, 6], [-span + 5, 6]);
  p(stoneDeep, [-span + 2, 1], [-span + 5, -5], [span - 5, -5], [span - 2, 1], [span - 5, 4.5], [-span + 5, 4.5]);
  p(stoneMid, [-span + 3, 0], [-span + 6, -4.5], [span - 6, -4.5], [span - 3, 0], [span - 6, 3], [-span + 6, 3]);
  p(stoneLight, [-span + 4.5, -1.5], [-span + 6.5, -4.5], [2, -4.5], [0, -2], [-span + 6, -1]);

  // 2. Tall, slender timber-and-iron trestle tower shaft (y: -6 .. -28)
  p(out, [-14, -4], [-11.5, deckY], [11.5, deckY], [14, -4], [10, 0], [-10, 0]);
  p("#232d2e", [-11, -5], [-9.5, deckY + 2], [9.5, deckY + 2], [11, -5]);
  // Diagonal timber X-bracing inside tall frame
  trace([[-10, -5], [9, deckY + 3]], timberDeep, 3.0);
  trace([[10, -5], [-9, deckY + 3]], timberMid, 2.8);
  trace([[9, -5.5], [-8.5, deckY + 3]], timberRim, 0.9);
  // Left & right tapered main tower legs
  p(timberMid, [-13, -4], [-10.5, deckY], [-6.5, deckY], [-8.5, -4]);
  p(timberLight, [-12.5, -5], [-10, deckY + 1], [-8.2, deckY + 1], [-10.2, -5]);
  p(timberDeep, [6.5, deckY], [10.5, deckY], [13, -4], [8.5, -4]);
  p(timberMid, [7.2, deckY + 1], [9.5, deckY + 1], [11.5, -5], [9, -5]);
  // Iron collar bands along shaft
  for (const by of [-11, -20]) {
    r(-11.5, by, 23, 2.6, ironDeep);
    r(-10.5, by + 0.4, 10, 1.1, ironLight);
  }

  // 3. Elevated turntable platform at y = -27
  p(out, [-16, deckY + 2], [-15, deckY - 5], [-10, deckY - 8], [10, deckY - 8], [15, deckY - 5], [16, deckY + 2], [12, deckY + 5], [-12, deckY + 5]);
  p(timberMid, [-14.5, deckY + 1], [-13.5, deckY - 4], [13.5, deckY - 4], [14.5, deckY + 1], [11, deckY + 3.5], [-11, deckY + 3.5]);
  p(ironMid, [-11, deckY - 2], [-9, deckY - 6.5], [9, deckY - 6.5], [11, deckY - 2], [8, deckY], [-8, deckY]);
  r(-8.5, deckY - 4.5, 17, 1.5, ironLight);

  // 4. Tier 1+: Side hanging willow ammo basket on mid-tower
  if (tier >= 1) {
    p(out, [-19, -10], [-20, -22], [-15, -25], [-9, -24], [-9, -11], [-14, -9]);
    p(timberMid, [-17.8, -11], [-18.5, -21], [-14.5, -23.5], [-10, -23], [-10, -12], [-14, -10.2]);
    p(clayMid, [-17, -21.5], [-16, -26], [-11, -26], [-10.5, -21.5]);
    r(-16.5, -26.5, 5.5, 2, glazeLight);
    r(-18, -17, 8, 1.1, timberDeep);
    r(-17.5, -13.5, 7.5, 1.1, timberDeep);
  }

  // 5. Tier 2+: Tall vertical coiled brass torsion springs flanking the upper shaft
  if (tier >= 2) {
    const drawSpring = (sx: number) => {
      p(out, [sx - 3.4, -14], [sx - 3.4, -31], [sx + 3.4, -31], [sx + 3.4, -14]);
      p(brassDeep, [sx - 2.3, -15], [sx - 2.3, -29.8], [sx + 2.3, -29.8], [sx + 2.3, -15]);
      for (const cy of [-28.5, -25, -21.5, -18]) {
        r(sx - 2.1, cy, 4.2, 1.7, brassMid);
        r(sx - 1.7, cy, 2.2, 0.85, brassHi);
      }
    };
    drawSpring(12.2);
    if (heavy || double) drawSpring(-11.5);
  }

  // 6. Tier 3 (厚釉破甲): Tall riveted bronze armor cheek-shields; Tier 4 (分罐盐雨): Twin high ammo baskets
  if (heavy) {
    for (const side of [-1, 1]) {
      const sx = side * 14.5;
      p(out, [sx - 4.5, -9], [sx - 4, -33], [sx, -37], [sx + 4, -33], [sx + 4.5, -9], [sx, -6]);
      p(ironMid, [sx - 3.2, -10.5], [sx - 2.8, -32], [sx, -35.2], [sx + 2.8, -32], [sx + 3.2, -10.5]);
      p(ironLight, [sx - 2.6, -12], [sx - 2.2, -31.5], [sx, -34.2], [sx + 0.5, -31], [sx, -12]);
      r(sx - 2.5, -29, 5, 2, brassLight);
      r(sx - 1.3, -21, 2.6, 2.6, brassHi);
    }
  } else if (double) {
    p(out, [10, -10], [11, -22], [17, -24], [20, -19], [18.5, -10], [13, -9]);
    p(timberMid, [11.2, -11], [12, -21], [16.5, -22.5], [18.6, -18.5], [17.2, -11], [13.2, -10.2]);
    r(12.5, -24, 5.2, 2, glazeLight);
    r(11.8, -16, 6.8, 1.1, timberDeep);
  }

  // 7. High-mounted throwing arm, brass pivot hub & glazed salt pot(s) (stays cleanly inside y >= -50)
  const pivotX = -5, pivotY = deckY - 5;
  const armY = -41 - Math.round(lift * 5);
  const tipX = lift >= 0.85 ? 14 : 9.5;
  trace([[pivotX - 4, pivotY + 7], [pivotX, pivotY], [tipX, armY + 4]], out, 7.2);
  trace([[pivotX - 4, pivotY + 7], [pivotX, pivotY], [tipX, armY + 4]], timberMid, 4.4);
  trace([[pivotX - 3.2, pivotY + 6], [pivotX - 0.6, pivotY - 0.6], [tipX - 1, armY + 3]], timberRim, 1.5);

  p(out, [pivotX - 5.5, pivotY - 3.5], [pivotX - 2.5, pivotY - 6], [pivotX + 2.5, pivotY - 6], [pivotX + 5.5, pivotY - 2.5],
    [pivotX + 4.8, pivotY + 3.5], [pivotX - 4.8, pivotY + 3.5]);
  p(brassMid, [pivotX - 4, pivotY - 2.5], [pivotX - 1.8, pivotY - 4.5], [pivotX + 1.8, pivotY - 4.5], [pivotX + 4, pivotY - 1.8],
    [pivotX + 3.2, pivotY + 2.2], [pivotX - 3.2, pivotY + 2.2]);
  r(pivotX - 1.8, pivotY - 2.6, 2.8, 2.8, brassHi);

  const drawSaltPot = (cx: number, cy: number, rx: number, ry: number, ornate: boolean) => {
    p(out,
      [cx - rx, cy - ry * 0.3], [cx - rx * 0.85, cy - ry], [cx + rx * 0.85, cy - ry], [cx + rx, cy - ry * 0.3],
      [cx + rx * 0.9, cy + ry * 0.65], [cx + rx * 0.4, cy + ry], [cx - rx * 0.4, cy + ry], [cx - rx * 0.9, cy + ry * 0.65]);
    p(clayDeep,
      [cx - rx + 1.2, cy - ry * 0.2], [cx + rx - 1.2, cy - ry * 0.2],
      [cx + rx * 0.78, cy + ry * 0.55], [cx + rx * 0.32, cy + ry - 1.1], [cx - rx * 0.32, cy + ry - 1.1], [cx - rx * 0.78, cy + ry * 0.55]);
    p(clayMid,
      [cx - rx + 1.4, cy - ry * 0.2], [cx + rx * 0.65, cy - ry * 0.2],
      [cx + rx * 0.55, cy + ry * 0.5], [cx - rx * 0.2, cy + ry - 1.4], [cx - rx * 0.72, cy + ry * 0.5]);
    p(clayLight, [cx - rx + 1.8, cy - ry * 0.1], [cx - rx * 0.1, cy - ry * 0.1], [cx - rx * 0.2, cy + ry * 0.55], [cx - rx * 0.65, cy + ry * 0.4]);
    p(glazeDeep,
      [cx - rx + 1.1, cy - ry * 0.35], [cx - rx * 0.75, cy - ry + 1.0], [cx + rx * 0.75, cy - ry + 1.0],
      [cx + rx - 1.1, cy - ry * 0.35], [cx + rx * 0.8, cy + ry * 0.1], [cx + rx * 0.3, cy - ry * 0.05],
      [cx, cy + ry * 0.22], [cx - rx * 0.35, cy - ry * 0.05], [cx - rx * 0.8, cy + ry * 0.12]);
    p(glazeMid,
      [cx - rx + 1.4, cy - ry * 0.45], [cx - rx * 0.7, cy - ry + 1.2], [cx + rx * 0.7, cy - ry + 1.2],
      [cx + rx - 1.4, cy - ry * 0.45], [cx + rx * 0.55, cy - ry * 0.15], [cx, cy + ry * 0.1], [cx - rx * 0.6, cy - ry * 0.1]);
    r(cx - rx * 0.6, cy - ry + 1.4, rx * 0.9, 1.5, glazeHi);
    if (ornate) {
      r(cx - rx + 1.6, cy + ry * 0.12, (rx - 1.6) * 2, 1.7, brassLight);
      r(cx - rx * 0.45, cy + ry * 0.15, rx * 0.6, 0.85, brassHi);
      r(cx - 1.1, cy - ry - 1.6, 2.2, 2.2, glazeHi);
    }
  };

  if (lift >= 0.85) {
    p(out, [tipX - 5, armY + 1], [tipX + 5, armY + 1], [tipX + 4.5, armY + 6], [tipX - 4.5, armY + 6]);
    p(brassMid, [tipX - 3.8, armY + 2], [tipX + 3.8, armY + 2], [tipX + 3.4, armY + 4.8], [tipX - 3.4, armY + 4.8]);
    trace([[tipX + 1, armY + 1], [tipX + 5, armY - 1.5], [tipX + 9, armY - 3]], glazeMid, 1.6);
    for (const [sx, sy] of [[tipX + 2, armY - 1], [tipX + 7, armY - 3], [tipX + 10, armY + 1]]) r(sx, sy, 2, 1.3, glazeHi);
    drawSaltPot(tipX + 9, armY - 0.5, heavy ? 6.6 : 5.4, heavy ? 6.6 : 5.4, heavy);
    if (double) drawSaltPot(tipX + 1, armY + 1.5, 4.5, 4.6, false);
  } else {
    p(out, [1, armY + 2], [17.5, armY + 2], [16, armY + 7.5], [2.5, armY + 7.5]);
    p(brassMid, [2.4, armY + 3.2], [16.2, armY + 3.2], [14.8, armY + 6.2], [3.8, armY + 6.2]);
    r(4, armY + 3.5, 9.5, 1.1, brassHi);
    if (double) {
      drawSaltPot(3.5, armY - 1, 6.2, 6.4, false);
      drawSaltPot(13.5, armY - 3, 6.2, 6.4, false);
    } else {
      drawSaltPot(9, armY - 2, heavy ? 9.2 : 7.5, heavy ? 8.8 : 7.4, heavy);
    }
  }
}

export function paintSaltCaster(r: Rect, p: Shape, tier: number, path: string | null = null, lift = 0) {
  saltCaster(artFor(r, p), path === "thick-glaze" ? 3 : path === "salt-rain" ? 4 : tier - 1, lift);
}
