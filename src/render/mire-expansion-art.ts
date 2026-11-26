import type { Point } from "../engine/types.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export type View = "front" | "side" | "back";
export type OtterPose = "idle" | "walk" | "brace" | "windup" | "strike";
export type OtterIdle = "none" | "blink" | "sniff" | "flick" | "scan" | "check-paddle" | "tail-lift" | "tail-slap" | "splash";
export type EnemyAttackPhase = "windup" | "strike";
export interface ArtOptions {
  gate?: number;
  fractured?: boolean;
  attack?: EnemyAttackPhase;
  attackStep?: number;
  otter?: { tier?: number; branch?: string; pose?: OtterPose; idle?: OtterIdle };
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
  readonly otter?: ArtOptions["otter"];
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
  const out = "#172a2c";
  const skinDeep = "#243e40", skinMid = "#486764", skinLight = "#789184", skinRim = "#afc3a0";
  const bellyDeep = "#8d8064", bellyMid = "#c5b58c", bellyHi = "#e9dfba";
  const algaeDeep = "#3d5b3d", algaeMid = "#6f8d4e", algaeLight = "#b0c875";
  const mudDeep = "#31433d", mudLight = "#607260";
  const whiskerDeep = "#6d634a", whiskerLight = "#d8c78e", glow = "#f1e6a1";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const lunge = side ? (windup ? -.5 : striking ? 3.5 : 0) : 0;
  const flex = live || windup || striking ? Math.sin(f * Math.PI / 4) * 2.2 : 0;

  if (side) {
    p(out, [-17 + lunge, -14], [-22 + lunge, -16 + flex], [-27 + lunge, -23 + flex],
      [-24 + lunge, -15 + flex], [-21 + lunge, -10 + flex], [-24 + lunge, -5 + flex],
      [-27 + lunge, 1 + flex], [-21 + lunge, -5 + flex], [-15 + lunge, -6]);
    p(skinDeep, [-17.5 + lunge, -13.5], [-21.5 + lunge, -15.5 + flex], [-25.5 + lunge, -21 + flex],
      [-23 + lunge, -15 + flex], [-21 + lunge, -10 + flex], [-23 + lunge, -5.5 + flex],
      [-25.5 + lunge, -.5 + flex], [-21 + lunge, -6 + flex], [-16 + lunge, -7.5]);
    trace([[-25 + lunge, -20 + flex], [-22 + lunge, -15 + flex], [-20 + lunge, -10 + flex]], skinLight, .9);
    trace([[-20 + lunge, -10 + flex], [-22 + lunge, -5 + flex], [-25 + lunge, -1 + flex]], skinLight, .9);
    p(out, [-18 + lunge, -14], [-10 + lunge, -20], [3 + lunge, -21], [15 + lunge, -17],
      [22 + lunge, -11], [24 + lunge, -6], [20 + lunge, 0], [5 + lunge, 2], [-12 + lunge, 1], [-21 + lunge, -5]);
    p(skinDeep, [-18 + lunge, -13], [-10 + lunge, -18.5], [3 + lunge, -19.5], [14 + lunge, -16],
      [20.5 + lunge, -10.5], [22 + lunge, -7], [18.5 + lunge, -1.5], [5 + lunge, .3], [-11 + lunge, -.5], [-19 + lunge, -5.5]);
    p(skinMid, [-16 + lunge, -14], [-8 + lunge, -19], [3 + lunge, -20], [13 + lunge, -16],
      [19 + lunge, -11], [20 + lunge, -8], [16 + lunge, -4], [-7 + lunge, -3], [-17 + lunge, -7]);
    p(skinLight, [-11 + lunge, -16], [-4 + lunge, -19], [5 + lunge, -18], [12 + lunge, -14.5],
      [6 + lunge, -12], [-6 + lunge, -13]);
    p(bellyDeep, [-7 + lunge, -4], [14 + lunge, -5], [21 + lunge, -7], [18 + lunge, -2], [4 + lunge, .5], [-9 + lunge, -.5]);
    p(bellyMid, [-3 + lunge, -4], [14 + lunge, -5], [19 + lunge, -7], [15 + lunge, -4], [3 + lunge, -2]);
    r(-2 + lunge, -20, 9, 1.2, skinRim);
    p(out, [-8 + lunge, -21], [-3 + lunge, -27], [3 + lunge, -26], [8 + lunge, -20]);
    p(algaeDeep, [-6 + lunge, -21], [-2.5 + lunge, -25], [2 + lunge, -24], [5 + lunge, -21]);
    trace([[-4 + lunge, -22], [0 + lunge, -25], [4 + lunge, -22]], algaeMid, 1.2);
    p(out, [5 + lunge, -10], [11 + lunge, -15], [17 + lunge, -4], [10 + lunge, 0]);
    p(skinLight, [7 + lunge, -10], [10 + lunge, -13], [15 + lunge, -5], [11 + lunge, -1]);
    if (striking) {
      p(out, [7 + lunge, -10], [14 + lunge, -13], [24 + lunge, -6], [20 + lunge, -1], [11 + lunge, -2]);
      p(skinRim, [9 + lunge, -10], [14 + lunge, -11], [21 + lunge, -6], [19 + lunge, -3]);
    }
    trace([[7 + lunge, -18], [5 + lunge, -12], [8 + lunge, -6]], out, 1.6);
    trace([[8 + lunge, -17], [7 + lunge, -12], [9 + lunge, -7]], skinLight, .9);
    for (const [mx, my, w] of [[-14, -13, 4], [-7, -18, 3], [-3, -9, 5], [4, -16, 2.5], [14, -15, 3]]) {
      r(mx + lunge, my, w, 1.5, skinDeep);
      r(mx + lunge + 1, my - .4, w - 1, .7, skinLight);
    }
    for (const [mx, my, w] of [[-14, -3, 5], [-6, -1, 4], [1, -2, 3], [12, -3, 4]]) r(mx + lunge, my, w, 1.6, mudDeep);
    r(-11 + lunge, -2.5, 8, .8, mudLight);
  } else {
    p(out, [-23, -10], [-20, -20], [-9, -24], [8, -24], [20, -20], [24, -9],
      [19, 0], [7, 2], [-7, 2], [-19, 0]);
    p(skinDeep, [-21.5, -10], [-18.5, -19], [-8, -22.5], [7.5, -22.5], [18.5, -19], [22, -9],
      [17.5, -1.5], [6.5, .5], [-6.5, .5], [-17.5, -1.5]);
    p(skinMid, [-20, -10], [-17, -19], [-7, -22], [7, -22], [17, -19], [20.5, -10],
      [16, -3], [5.5, -2], [-5.5, -2], [-16, -3]);
    p(skinLight, [-13, -15], [-6, -21], [5, -21], [11, -16], [4, -13], [-8, -13]);
    if (back) {
      p(out, [-8, -23], [-3, -31], [4, -30], [9, -22]);
      p(algaeDeep, [-6, -23], [-2, -29], [3, -28], [6, -23]);
      trace([[-3, -24], [0, -29], [4, -24]], algaeMid, 1.1);
      for (const dx of [-13, -5, 5, 13]) trace([[dx, -17], [dx * .75, -7]], skinLight, .8);
      p(algaeMid, [-18, -15], [-22, -20], [-20, -10], [-17, -8]);
      p(algaeLight, [-17, -16], [-20, -19], [-18.5, -12]);
      r(-6, -6, 12, 2, mudDeep);
      return;
    }
    p(bellyDeep, [-14, -6], [-7, -9], [7, -9], [14, -6], [10, -1], [-10, -1]);
    p(bellyMid, [-11, -6], [-6, -8], [6, -8], [11, -6], [7, -3], [-7, -3]);
    r(-6, -7.5, 12, 1, bellyHi);
    for (const dx of [-16, 16]) {
      p(out, [dx - 3, -10], [dx, -14], [dx + 4, -5], [dx, -1]);
      p(skinLight, [dx - 1, -10], [dx, -12], [dx + 2, -5], [dx, -2]);
    }
  }

  const headX = side ? 12 + lunge : 0;
  p(out, [headX - (side ? 7 : 13), -19], [headX + (side ? 6 : 12), -18],
    [headX + (side ? 12 : 15), -10], [headX + (side ? 9 : 11), -4],
    [headX - (side ? 7 : 11), -4]);
  p(skinMid, [headX - (side ? 6 : 11), -18], [headX + (side ? 5 : 10), -17],
    [headX + (side ? 10 : 13), -10], [headX + (side ? 7 : 9), -5],
    [headX - (side ? 5 : 9), -5]);
  p(skinLight, [headX - (side ? 5 : 9), -17], [headX + (side ? 3 : 7), -16],
    [headX + (side ? 7 : 10), -11], [headX - (side ? 5 : 7), -10]);

  if (back) return;

  const eyeY = -16.2;
  for (const ex of side ? [headX + 2.5] : [headX - 6.5, headX + 3.5]) {
    r(ex - 1.2, eyeY - .8, 4.2, 3.8, out);
    r(ex, eyeY, 2.7, 2.1, skill || striking ? glow : "#e8c875");
    r(ex + .4, eyeY - .2, 1, 1, "#fff6d8");
  }
  trace([[headX - (side ? 3 : 9), eyeY - 1.2], [headX + (side ? 6 : 8), eyeY - 1.5]], skinDeep, 1.6);
  r(headX + (side ? 7.5 : -1), -11, side ? 1.8 : 2, 1.2, out);

  if (side) {
    p(out, [headX + 7, -9], [headX + 14, -8], [headX + 15, -5], [headX + 9, -3], [headX + 6, -5]);
    p(bellyDeep, [headX + 8, -8], [headX + 13, -7], [headX + 13.5, -5.5], [headX + 8, -4.5]);
    trace([[headX + 8, -6.2], [headX + 13, -6.2]], out, 1.2);
    r(headX + 10, -6.8, 3, .7, bellyHi);
  } else {
    p(out, [-10, -8], [-6, -10], [6, -10], [10, -8], [7, -4], [4, -2], [-4, -2], [-7, -4]);
    p(bellyDeep, [-8, -7], [-5, -8.5], [5, -8.5], [8, -7], [5, -4], [-5, -4]);
    trace([[-7, -6], [7, -6]], out, 1.5);
    r(-3, -6.8, 6, .8, bellyHi);
  }

  for (const d of [-1, 1]) {
    const startX = headX + (side ? 9 : d * 7);
    const upperEndX = side ? (windup ? headX - 8 : d < 0 ? headX - 10 : headX + (skill || striking ? 17 : 13))
      : d * (skill || striking ? 25 : 21);
    const upperEndY = windup ? -12 + d * 2 : striking ? -11 + d * 4 : skill ? -5 + d * 2 : -2 + d * 2;
    const upperMidX = startX + (upperEndX - startX) * .55;
    const upperMidY = windup ? -10 : skill || striking ? -9 : -5;
    const upper: Point[] = [[startX, -6.5], [upperMidX, upperMidY], [upperEndX, upperEndY]];
    trace(upper, out, 3);
    trace(upper, skill || striking ? glow : whiskerLight, 1.25);
    const lowerEndX = side ? (d < 0 ? headX - 5 : headX + (skill || striking ? 12 : 9)) : d * 17;
    const lower: Point[] = [[startX + d * 1.5, -5], [startX + (lowerEndX - startX) * .5, -.5], [lowerEndX, skill ? 2 : 3]];
    trace(lower, out, 2.4);
    trace(lower, whiskerDeep, 1);
    if (skill) {
      trace([[upperEndX - 1.5, upperEndY + 1], [upperEndX + 1.5, upperEndY - 1]], glow, 1);
      r(upperEndX - 1, upperEndY - 1, 2, 1, "#ffffff");
    }
  }
  if (striking) {
    trace([[headX + 8, -17], [headX + 19, -11], [headX + 16, -1]], glow, 1.8);
    trace([[headX + 11, -15], [headX + 17, -10], [headX + 15, -5]], "#ffffff", .9);
  }

  p(algaeMid, [headX - 8, -21], [headX - 5, -26], [headX - 2, -22], [headX - 4, -19]);
  r(headX - 6, -24, 3, 1.2, algaeLight);
  trace([[headX - 12, -20], [headX - 14, -26], [headX - 17, -27]], algaeMid, 1);
  trace([[headX - 16, -23], [headX - 19, -23], [headX - 21, -21]], algaeLight, .8);
};

export const stoneClam: Painter = ({ r, p, trace, frame, attack }, view, skill) => {
  const side = view === "side", back = view === "back";
  const out = "#1c2b2d";
  const mudDeep = "#263b38", mudMid = "#46645b", mudLight = "#77917a";
  const shellDeep = "#354a49", shellMid = "#607875", shellLight = "#93a79a", shellRim = "#c9d1ad";
  const algaeDeep = "#38543a", algaeMid = "#68884a", algaeLight = "#b1c975";
  const mantleDeep = "#77806a", mantleMid = "#b4bd91", mantleLight = "#e1dbb0";
  const pearlDeep = "#b99b45", pearlMid = "#ead477", pearlLight = "#fff3b0";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const shake = windup ? (f % 2 ? 1 : -1) : 0;
  const x = (side ? -1 : 0) + shake;
  const breath = [0, .15, .35, .55, .4, .2, .05, 0][f];
  const open = skill ? 1 : windup ? .48 : striking ? .06 : breath * .08;

  p(out, [-25 + x, -4], [-20 + x, -10], [17 + x, -10], [26 + x, -4], [20 + x, 2], [-16 + x, 2]);
  p(mudDeep, [-23 + x, -4.5], [-18 + x, -9], [16 + x, -9], [24 + x, -4.5], [18 + x, .5], [-14 + x, .5]);
  p(mudMid, [-21 + x, -5], [-16 + x, -8], [14 + x, -8], [22 + x, -5], [16 + x, -1.5], [-12 + x, -1.5]);
  r(-17 + x, -2, 36, 1.1, mudLight);
  for (const [mx, my, w] of [[-18, -4, 5], [-9, -1, 4], [2, -3, 6], [13, -1, 4], [20, -4, 3]]) r(mx + x, my, w, 1.3, mudDeep);

  const lowerWarp = (pts: Point[]) => side ? pts.map(([px, py]): Point => [px + x, py + (px + 8) * .045]) : pts.map(([px, py]): Point => [px + x, py]);
  p(out, ...lowerWarp([[-24, -9], [-20, -16], [-11, -18], [0, -19], [11, -18], [21, -15], [24, -9], [19, -2], [10, 1], [-10, 1], [-20, -2]]));
  p(shellDeep, ...lowerWarp([[-22.5, -9.5], [-18.5, -14.5], [-10, -16.5], [0, -17.5], [10, -16.5], [19.5, -13.5], [22, -9.5], [17, -3.5], [9, -.5], [-9, -.5], [-18, -3.5]]));
  p(shellMid, ...lowerWarp([[-21, -10], [-17, -14], [-9, -15.5], [0, -16], [9, -15.5], [18, -13], [20.5, -10], [15.5, -5], [7, -3], [-7, -3], [-15.5, -5]]));
  p(shellLight, ...lowerWarp([[-18, -12], [-10, -14.5], [0, -15], [9, -14], [15, -12], [7, -10], [-4, -11], [-13, -10]]));
  for (const dx of [-16, -9, 0, 9, 16]) {
    trace(lowerWarp([[dx * .75, -15], [dx, -10], [dx * 1.18, -5]]), shellDeep, 1.3);
    trace(lowerWarp([[dx * .75 + 1, -14.5], [dx + 1, -9.5]]), shellRim, .65);
  }
  trace(lowerWarp([[-20, -9], [-10, -6], [0, -5.5], [11, -7], [21, -9]]), out, 1.4);
  trace(lowerWarp([[-18, -9.5], [-9, -7.2], [0, -6.8], [10, -8], [18, -9.5]]), mantleMid, .9);

  const cavityWarp = (pts: Point[]) => side
    ? pts.map(([px, py]): Point => [px + x, py + (px + 8) * .045])
    : pts.map(([px, py]): Point => [px + x, py]);
  const upperWarp = (pts: Point[]) => pts.map(([px, py]): Point => {
    const [cx, cy] = cavityWarp([[px, py]])[0];
    return side ? [cx, cy - Math.max(0, px + 19) * .55 * open] : [cx, cy - 12 * open];
  });

  if ((skill || windup) && !back) {
    p(out, ...cavityWarp([[-21, -10], [-18, -23], [-10, -29], [3, -30], [16, -24], [21, -12], [15, -8], [-9, -8]]));
    p("#172e2d", ...cavityWarp([[-19, -11], [-16, -21], [-8, -26], [2, -27], [14, -22], [18, -12], [12, -10], [-8, -10]]));
    trace(cavityWarp([[-17, -11], [-8, -9], [4, -10], [16, -12]]), mantleMid, 2);
    trace(cavityWarp([[-15, -12], [-7, -10], [5, -11], [13, -13]]), mantleLight, .8);
    if (side) {
      p(out, ...cavityWarp([[12, -14], [15, -20], [18, -22], [21, -20], [20, -15], [17, -12]]));
      p(mantleDeep, ...cavityWarp([[14, -15], [16, -19], [18, -20], [19, -18], [18, -15]]));
      const siphon = cavityWarp([[18, -20]])[0];
      r(siphon[0], siphon[1], 2, 1.2, out);
    }
  }

  if (skill && !back) {
    const px = side ? 5 + x : x, py = -14.5;
    p("#f3d67a44", [px - 10, py - 7], [px + 10, py - 7], [px + 10, py + 7], [px - 10, py + 7]);
    p(out, [px - 6, py - 1], [px - 4.5, py - 6], [px, py - 7.5], [px + 4.5, py - 6], [px + 6, py - 1], [px + 4, py + 5], [px, py + 6.5], [px - 4, py + 5]);
    p(pearlDeep, [px - 5, py - 1], [px - 3.5, py - 5], [px, py - 6.5], [px + 3.5, py - 5], [px + 5, py - 1], [px + 3.5, py + 4], [px, py + 5.5], [px - 3.5, py + 4]);
    p(pearlMid, [px - 4, py - 1.5], [px - 2.8, py - 4.5], [px + 1.5, py - 5.5], [px + 4, py - 1.5], [px + 2.5, py + 3], [px - 2.5, py + 3]);
    p(pearlLight,
      [px - 3, py - 2], [px - 1.5, py - 4], [px + 2, py - 4],
      [px + 2.5, py - 2], [px, py + .5], [px - 2, py]);
    r(px - 2.5, py - 3.5, 3, 2.2, "#ffffff");
  }

  const topShape: Point[] = side
    ? [[-24, -11], [-23, -18], [-17, -28], [-7, -34], [4, -35], [15, -30], [22, -22], [25, -13], [18, -9], [3, -8], [-10, -9]]
    : [[-24, -12], [-22, -23], [-16, -32], [-7, -37], [2, -39], [11, -36], [19, -30], [24, -21], [25, -12], [17, -9], [5, -8], [-7, -9], [-17, -10]];
  p(out, ...upperWarp(topShape));
  p(shellDeep, ...upperWarp(side
    ? [[-22, -12], [-21, -18], [-15.5, -26.5], [-6.5, -32.5], [3.5, -33.5], [13.5, -28.5], [20.5, -21], [23, -13], [16.5, -11], [2, -10], [-10, -11]]
    : [[-22, -12.5], [-20, -22.5], [-14.5, -31], [-6.5, -35.5], [1.5, -37.5], [10, -34.5], [17.5, -29], [22, -21], [23, -12.5], [16, -10.5], [5, -9.5], [-7, -10.5], [-16, -11.5]]));
  p(shellMid, ...upperWarp(side
    ? [[-20.5, -13], [-19, -18.5], [-14, -25.5], [-6, -31], [3, -32], [12.5, -27.5], [19, -20.5], [21, -13.5], [15, -12.5], [2, -11.5], [-10, -12.5]]
    : [[-20, -13], [-18, -22], [-13, -30], [-5.5, -34.5], [1, -36], [9, -33.5], [16, -28], [20.5, -20.5], [21, -13], [15, -11.5], [5, -10.5], [-7, -11.5], [-15, -12.5]]));
  p(shellLight, ...upperWarp(side
    ? [[-17, -20], [-12, -28], [-5, -31], [3, -30.5], [10, -26], [4, -23], [-7, -24], [-14, -20]]
    : [[-14, -25], [-9, -33], [-2, -36], [6, -34.5], [12, -29], [7, -25], [-3, -27], [-11, -23]]));

  for (let i = 0; i < 3; i++) {
    const spread = 18 - i * 3;
    trace(upperWarp([[-spread, -15 - i * 3], [-spread * .45, -20 - i * 4.5], [0, -22 - i * 4.5], [spread * .55, -19 - i * 3.5], [spread, -14 - i * 2]]), i % 2 ? shellDeep : shellRim, i % 2 ? 1 : .65);
  }
  for (const dx of [-15, -8, 0, 8, 15]) {
    trace(upperWarp([[dx * .45, -35], [dx * .8, -25], [dx * 1.2, -13]]), shellDeep, 1.15);
    trace(upperWarp([[dx * .45 + .8, -34], [dx * .8 + .8, -24.5], [dx * 1.2 + .8, -13]]), shellRim, .55);
  }
  trace(upperWarp(side ? [[25, -13], [18, -9], [3, -8], [-10, -9]] : [[25, -12], [17, -9], [5, -8], [-7, -9], [-17, -10]]), out, 2.8);
  trace(upperWarp(side ? [[24, -14], [17, -10], [3, -9], [-10, -10]] : [[24, -13], [16, -10], [5, -9], [-7, -10], [-16, -11]]), shellRim, 1.3);

  p(algaeDeep, ...upperWarp([[-19, -22], [-17, -30], [-10, -33], [-7, -28], [-10, -22]]));
  p(algaeMid, ...upperWarp([[-17, -23], [-15.5, -29], [-11, -31.5], [-9, -27], [-11.5, -23]]));
  r(-14 + x, -29 - (side ? 0 : open * 7), 4, 1.4, algaeLight);
  p(algaeMid, ...upperWarp([[10, -29], [15, -29], [17, -25], [12, -24]]));
  if (side) {
    r(-23 + x, -13, 7, 5, out);
    r(-22 + x, -12, 5, 3, shellDeep);
    r(-21.5 + x, -11.5, 3, 1, shellRim);
  }
  if (back) {
    trace(upperWarp([[-13, -18], [-5, -23], [5, -23], [13, -18]]), shellDeep, 1.2);
    p(out, ...upperWarp([[-6, -15], [6, -15], [7, -10], [-7, -10]]));
    p(shellRim, ...upperWarp([[-4.5, -14], [4.5, -14], [5, -11], [-5, -11]]));
    r(-3 + x, -13.5 - open * 3, 2, 1.5, shellDeep);
    r(1 + x, -13.5 - open * 3, 2, 1.5, shellDeep);
    p(algaeMid, ...upperWarp([[-20, -13], [-23, -20], [-20, -23], [-17, -16]]));
  }

  if (striking) {
    trace([[x + 17, -18], [x + 28, -11], [x + 23, -1]], pearlLight, 2.2);
    trace([[x + 19, -16], [x + 25, -10], [x + 22, -4]], "#ffffff", .9);
    for (const [sx, sy] of [[x + 22, -17], [x + 29, -8], [x + 26, 0], [x - 24, -4]]) {
      p(out, [sx - 2, sy + 1], [sx - 1, sy - 2], [sx + 2, sy - 1], [sx + 2, sy + 1]);
      r(sx, sy - 1, 2, 1.2, pearlMid);
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
  const out = "#112326";
  const scaleDeep = "#1b343a", scaleMid = "#375b5e", scaleLight = "#6c928b", scaleRim = "#a9c9b3";
  const mudDeep = "#3c4939", mudMid = "#657454", mudLight = "#9caa70";
  const boneDeep = "#78624f", boneMid = "#c7aa7f", boneLight = "#eee0b7", boneHi = "#fff8dc";
  const bronzeDeep = "#352b24", bronzeMid = "#795c3d", bronzeLight = "#c39a59", bronzeHi = "#f5d681";
  const mossDeep = "#2d4734", mossMid = "#557849", mossLight = "#9ab96c";
  const tideDeep = "#286d69", tideMid = "#54b7aa", tideHi = "#c5fff0";
  const mouthDeep = "#321f28", gum = "#925647";
  const f = ((frame % 8) + 8) % 8;
  const windup = attack === "windup", striking = attack === "strike";
  const open = gate ?? Number(skill);
  const bob = live ? Math.sin((f * Math.PI) / 4) * .9 : 0;
  const jaw = open > .2 || striking ? 5 : windup ? 2.5 : 0;

  const drawLeg = (x: number, rear: boolean, far = false) => {
    const spread = rear ? 6.2 : 7.4;
    const phase = (f * Math.PI) / 4 + (rear ? 0 : Math.PI) + (far ? Math.PI : 0);
    const walking = live && !windup && !striking;
    const stride = walking ? Math.sin(phase) * 2.2 : 0;
    const lift = walking ? Math.max(0, Math.cos(phase)) * 1.7 : 0;
    const depth = far ? -1.6 : 0;
    const kneeY = -6 - lift * .45 + depth;
    const footY = 1 - lift + depth;
    const hide = far ? scaleDeep : scaleMid;
    const light = far ? scaleMid : scaleLight;
    p(out, [x - 5, -14 + depth], [x + 4, -14 + depth], [x + spread + 1 + stride, kneeY],
      [x + spread + 3 + stride, footY + 1], [x + spread - 1 + stride, footY + 2.4],
      [x - spread + stride, footY + 1.6], [x - spread - 2 + stride, kneeY + 1]);
    p(hide, [x - 3.7, -12.8 + depth], [x + 2.8, -12.8 + depth], [x + spread + stride, kneeY + .5],
      [x + spread + 1.8 + stride, footY + .3], [x + spread - .8 + stride, footY + 1.2],
      [x - spread + .5 + stride, footY + .7], [x - spread - .5 + stride, kneeY + .5]);
    p(light, [x - 2.8, -11.8 + depth], [x + 1.8, -11.8 + depth], [x + spread - .8 + stride, kneeY + 1],
      [x + spread + stride, footY - .3], [x - 3.5, footY - .6]);
    p(out, [x + spread - 3.5 + stride, kneeY - 2.5], [x + spread + 1.5 + stride, kneeY - 2],
      [x + spread + 2.5 + stride, kneeY + 1.5], [x + spread - 1.5 + stride, kneeY + 2.5]);
    p(far ? scaleMid : scaleRim, [x + spread - 2.5 + stride, kneeY - 1.5],
      [x + spread + .8 + stride, kneeY - 1.2], [x + spread + 1.2 + stride, kneeY + .5]);
    r(x - 2.3, -12.2 + depth, 4.2, 1.2, far ? scaleMid : scaleRim);
    for (const cx of [-spread + 1, -.8, spread - 2]) {
      p(out, [x + cx + stride - 1, footY - .4], [x + cx + stride + 1.2, footY - .6],
        [x + cx + stride + 2, footY + 1.5], [x + cx + stride - .4, footY + 1.9]);
      p(boneHi, [x + cx + stride - .5, footY + .1], [x + cx + stride + .8, footY],
        [x + cx + stride + 1.2, footY + .9], [x + cx + stride, footY + 1.1]);
    }
  };

  if (side) {
    const tailWave = live ? Math.sin((f * Math.PI) / 4) * 2.2 : 0;

    p(out, [-11, -10], [-15, -11 + tailWave * .3], [-19, -10 + tailWave * .5], [-22, -8 + tailWave * .6],
      [-25, -5 + tailWave * .7], [-27, -3 + tailWave * .7], [-26, -1 + tailWave * .7], [-24, 0 + tailWave * .65],
      [-27, 2 + tailWave * .6], [-25, 3 + tailWave * .55], [-22, 2 + tailWave * .5],
      [-18, 1 + tailWave * .4], [-14, -1 + tailWave * .3], [-11, -4]);
    p(scaleDeep, [-12, -8], [-15, -9 + tailWave * .3], [-19, -8.5 + tailWave * .5], [-21.5, -6.5 + tailWave * .6], [-24.5, -4 + tailWave * .7],
      [-25.5, -2.5 + tailWave * .7], [-24, -1 + tailWave * .65], [-25.5, 1.5 + tailWave * .6], [-24, 2 + tailWave * .55], [-21, 1 + tailWave * .5], [-17, .5 + tailWave * .4], [-12, -1 + tailWave * .3], [-12, -3]);
    p(scaleMid, [-12, -7], [-15, -7.5 + tailWave * .3], [-19, -6.5 + tailWave * .5], [-21.5, -4.5 + tailWave * .6], [-24, -2 + tailWave * .7],
      [-24, -.5 + tailWave * .7], [-23, 1 + tailWave * .65], [-18, -.5 + tailWave * .4], [-12, -3], [-12, -4]);
    p(scaleLight, [-25, -4 + tailWave * .7], [-22, -6 + tailWave * .6], [-18, -7.5 + tailWave * .5], [-14, -4 + tailWave * .4],
      [-12, 0], [-17, -1 + tailWave * .4], [-21, -2 + tailWave * .6], [-24, -2 + tailWave * .7]);
    p(scaleRim, [-25, -4 + tailWave * .7], [-22, -6 + tailWave * .6], [-18, -7.5 + tailWave * .5], [-14, -4 + tailWave * .4],
      [-15, 0 + tailWave * .4], [-18, -1 + tailWave * .5], [-22, -2 + tailWave * .6]);
    p(out, [-23, -6 + tailWave * .6], [-26, -11 + tailWave * .7], [-20, -8 + tailWave * .5]);
    p(boneDeep, [-23.5, -7 + tailWave * .6], [-25.5, -10.5 + tailWave * .7], [-21, -9 + tailWave * .5]);
    p(boneLight, [-24.5, -8 + tailWave * .7], [-25, -10 + tailWave * .7], [-23.5, -9 + tailWave * .6]);
    p(out, [-17, -8 + tailWave * .5], [-20, -13 + tailWave * .6], [-14, -10 + tailWave * .4]);
    p(boneMid, [-17.5, -9 + tailWave * .5], [-19.5, -12 + tailWave * .6], [-15, -10.5 + tailWave * .4]);
    trace([[-25, 1 + tailWave * .6], [-21, -1 + tailWave * .5], [-13, -4]], tideMid, 1.2);

    drawLeg(-12, true, true);
    drawLeg(15, false, true);

    p(out, [-15, -8 + tailWave * .3], [-16, -22 + bob], [-13, -33 + bob], [7, -35 + bob],
      [27, -35 + bob], [32, -24 + bob], [32, -14 + bob], [21, -6 + bob], [4, -4 + bob], [-14, 1], [-15, 1.5], [-16, -2 + tailWave * .3]);
    p(scaleDeep, [-14, -8 + tailWave * .3], [-15, -20.5 + bob], [-12, -31.5 + bob], [7, -33.5 + bob],
      [25.5, -33.5 + bob], [30, -23.5 + bob], [30, -14 + bob], [20, -7.5 + bob], [3, -5.8 + bob], [-14, -.5], [-14, .5], [-15, -2 + tailWave * .3]);
    p(scaleMid, [-14, -9 + tailWave * .3], [-14, -20 + bob], [-12, -30.5 + bob], [7, -32.5 + bob],
      [24.5, -32.5 + bob], [28, -24 + bob], [28, -16 + bob], [19, -10 + bob], [2, -8 + bob], [-14, -2.5], [-15, -1], [-16, -3]);
    p(scaleLight, [-7, -24 + bob], [-2, -29 + bob], [6, -29.8 + bob], [22, -26 + bob],
      [11, -22 + bob], [-4, -20.5 + bob]);
    p(mudMid, [-15, -3], [-7, -1], [1, -7], [13, -8 + bob], [20, -5 + bob], [-2, -2], [-5, 1], [-16, -.5]);
    p(mudLight, [-12, -2], [-7, -.5], [-3, -4], [-7, -1]);
    p(scaleLight, [-26, -3 + tailWave * .7], [-22, -6 + tailWave * .6], [-18, -7 + tailWave * .5], [-16, -1],
      [-16, 1 + tailWave * .4], [-21, 0 + tailWave * .6], [-24, 0 + tailWave * .7]);
    p(mudLight, [-24, 0 + tailWave * .7], [-20, -1 + tailWave * .5], [-16, 0], [-17, 2 + tailWave * .4], [-23, 2 + tailWave * .5]);
    trace([[-26, -3 + tailWave * .7], [-22, -6 + tailWave * .6], [-18, -7 + tailWave * .5], [-16, -1]], scaleRim, 1.4);
    trace([[-16, -7], [-15, -3], [-16, 1]], out, 1.8);
    for (const [tx, ty, size] of [[-24, -4.5, 2.8], [-21, -5.8, 3.2], [-18, -6.2, 3]]) {
      const y = ty + tailWave * .6;
      p(out, [tx - size, y + 1], [tx, y - 1.8], [tx + size, y + .5], [tx, y + 2]);
      p(scaleMid, [tx - size + .6, y + .6], [tx, y - 1], [tx + size - .6, y + .2], [tx, y + 1.2]);
      r(tx - .8, y - .7, 1.6, .8, scaleRim);
    }
    p(boneMid, [-27, tailWave * .6], [-24, .8 + tailWave * .5], [-25.5, 1 + tailWave * .5]);
    p(mudLight, [-25, 3.5 + tailWave * .4], [-22.5, 2.7 + tailWave * .4], [-23, 3.4 + tailWave * .4]);
    trace([[-24, 2 + tailWave * .5], [-20, 1.2 + tailWave * .4], [-17, .4 + tailWave * .3]], mudLight, 1);

    for (const [sx, sy] of [[-11, -15], [-5, -18], [2, -21], [9, -20], [17, -17], [23, -14]]) {
      const y = sy + bob;
      p(out, [sx - 4, y - 3], [sx + 3, y - 5], [sx + 4.5, y + 1], [sx - 1, y + 3.5]);
      p(scaleMid, [sx - 3, y - 2.5], [sx + 2.2, y - 4], [sx + 3.4, y], [sx - .8, y + 2.5]);
      p(scaleRim, [sx - 2.5, y - 3.3], [sx + 1.8, y - 4], [sx + 2.8, y - 2.8], [sx - 1.8, y - 1.8]);
      r(sx - 1.5, y - 2.4, 2.5, 1.1, mudLight);
    }
    for (const [sx, sy] of [[-15, -31], [-8, -34], [1, -35], [10, -34], [18, -31], [25, -27]]) {
      const y = sy + bob;
      p(out, [sx - 3, y + 4], [sx - 1, y - 6], [sx + 1, y - 9], [sx + 3.5, y + 3]);
      p(boneDeep, [sx - 1.5, y + 2], [sx, y - 5], [sx + 1, y - 7], [sx + 2, y + 2]);
      p(boneLight, [sx, y], [sx + .5, y - 4.5], [sx + 1, y - 5.5]);
    }
    trace([[-22, -7 + tailWave * .4], [-15, -9], [-6, -8], [1, -7]], tideDeep, 1.6);
    trace([[-18, -5], [-11, -6], [-3, -5], [5, -5]], tideMid, 1.1);
    drawLeg(-10, true);
    drawLeg(20, false);
  } else {
    for (const d of [-1, 1]) {
      p(out, [d * 13, -16], [d * 23, -14], [d * 27, -5], [d * 26, 1], [d * 16, 2], [d * 11, -5]);
      p(scaleDeep, [d * 14, -14], [d * 22, -12], [d * 25, -5], [d * 24, -.5], [d * 16, .5], [d * 12.5, -5]);
      p(scaleMid, [d * 15, -13], [d * 21, -11], [d * 23, -6], [d * 19, -4], [d * 14, -6]);
      p(scaleLight, [d * 15, -12], [d * 20, -10.5], [d * 20, -8], [d * 15, -9]);
      for (const cx of [17, 21, 24]) {
        p(out, [d * (cx - 1), -.5], [d * (cx + 1), -.5], [d * (cx + 1.8), 2], [d * cx, 2.8]);
        p(boneHi, [d * cx, 0], [d * (cx + 1), 0], [d * (cx + 1.2), 1.5]);
      }
    }

    p(out, [-25, -17 + bob], [-21, -29 + bob], [-9, -34 + bob], [0, -35 + bob], [9, -34 + bob],
      [21, -29 + bob], [25, -17 + bob], [20, -6], [12, -2], [-12, -2], [-20, -6]);
    p(scaleDeep, [-23.5, -17 + bob], [-19.5, -27.5 + bob], [-8, -32.5 + bob], [0, -33.5 + bob],
      [8, -32.5 + bob], [19.5, -27.5 + bob], [23.5, -17 + bob], [18.5, -7.5], [11, -3.5], [-11, -3.5], [-18.5, -7.5]);
    p(scaleMid, [-21.5, -18 + bob], [-18, -27 + bob], [-7, -31.5 + bob], [0, -32.5 + bob],
      [7, -31.5 + bob], [18, -27 + bob], [21.5, -18 + bob], [17, -9], [10, -5], [-10, -5], [-17, -9]);
    p(scaleLight, [-17, -24 + bob], [-9, -31 + bob], [7, -31.5 + bob], [14, -25 + bob], [0, -20 + bob]);
    p(mudMid, [-20, -9], [-12, -4], [0, -6], [12, -4], [20, -9], [17, -5], [9, -1.5], [-9, -1.5], [-17, -5]);

    for (const d of [-1, 1]) {
      for (const [x, y] of [[13, -27], [20, -22], [19, -15]]) {
        p(out, [d * (x - 3), y + 4 + bob], [d * (x + 1), y - 7 + bob], [d * (x + 3), y + 3 + bob]);
        p(boneDeep, [d * (x - 1), y + 2 + bob], [d * (x + .5), y - 5 + bob], [d * (x + 1.5), y + 2 + bob]);
        p(boneLight, [d * x, y + bob], [d * (x + .5), y - 3.5 + bob]);
      }
      p(out, [d * 8, -24], [d * 16, -29], [d * 23, -23], [d * 20, -15], [d * 10, -14]);
      p(scaleDeep, [d * 9.5, -23], [d * 16, -27], [d * 21.5, -22.5], [d * 18.5, -16.5], [d * 10.5, -15.5]);
      p(scaleLight, [d * 11, -23], [d * 16, -26], [d * 19, -23], [d * 13, -19]);
      r(d < 0 ? -18 : 13, -24 + bob, 5, 1.5, scaleRim);
    }

    if (back) {
      p(out, [-7, -3], [7, -3], [10, 0], [9, 4], [6, 7], [3.5, 9], [1.5, 6], [-1.5, 6], [-3.5, 9], [-6, 7], [-9, 4], [-10, 0]);
      p(scaleDeep, [-5.5, -2], [5.5, -2], [8, .5], [7, 3.5], [4.5, 6], [2.5, 7.5], [0, 5], [-2.5, 7.5], [-4.5, 6], [-7, 3.5], [-8, .5]);
      p(scaleMid, [-4, -1], [4, -1], [6, 1], [5, 3], [3, 5], [1.5, 6], [0, 4], [-1.5, 6], [-3, 5], [-5, 3], [-6, 1]);
      p(scaleLight, [-3, -.5], [3, -.5], [4, 1.5], [2.5, 3.5], [0, 4.5], [-2.5, 3.5], [-4, 1.5]);
      for (const ty of [1, 4, 6]) {
        p(out, [-5 + ty * .35, ty], [0, ty - 1.5], [5 - ty * .35, ty], [0, ty + 1.5]);
        p(scaleRim, [-3.5 + ty * .25, ty], [0, ty - .8], [3.5 - ty * .25, ty], [0, ty + .8]);
      }
      for (const d of [-1, 1]) {
        p(out, [d * 2, 2], [d * 5, -.5], [d * 6, 2]);
        p(boneMid, [d * 2.5, 1.5], [d * 4.8, 0], [d * 5.2, 1.8]);
        p(boneLight, [d * 3, .8], [d * 4.5, .3]);
      }
      trace([[0, -1], [0, 3], [0, 6]], tideDeep, 1.8);
      trace([[-1, 1], [1, 3], [0, 5]], tideMid, 1.1);
    }
  }

  const gx = side ? -4 : 0;
  const half = side ? 10 : 17;
  const panelHalf = side ? 5.5 : 11;
  const panelTop = -35 - Math.round(open * 16) + bob;
  r(gx - half + 1, -36 + bob, half * 2 - 2, 16, out);
  r(gx - half + 2.5, -34.5 + bob, half * 2 - 5, 13, "#16272a");
  r(gx - half + 4, -32 + bob, half * 2 - 8, 9, open > .2 ? tideDeep : bronzeDeep);
  if (open > .2) {
    r(gx - half + 4, -27 + bob, half * 2 - 8, 4, tideMid);
    r(gx - half + 6, -25.5 + bob, half * 2 - 12, 2, tideHi);
    r(gx - 3, -25 + bob, 6, 1.2, "#ffffff");
  }

  r(gx - panelHalf - 1, panelTop - 1, panelHalf * 2 + 2, 14, out);
  r(gx - panelHalf, panelTop, panelHalf * 2, 12, bronzeMid);
  r(gx - panelHalf + 1, panelTop + 1, 2, 10, bronzeLight);
  r(gx + panelHalf - 3, panelTop + 1, 2, 10, bronzeDeep);
  for (const bx of [-panelHalf + 2.5, -1.2, panelHalf - 3.3]) {
    r(gx + bx, panelTop, 2, 12, bronzeLight);
    r(gx + bx, panelTop, .8, 12, bronzeHi);
  }
  r(gx - panelHalf, panelTop + 9, panelHalf * 2, 2, bronzeDeep);

  for (const d of [-1, 1]) {
    const px = gx + d * (half + .5);
    r(px - 3, -52 + bob, 6, 34, out);
    r(px - 2, -51 + bob, 4, 32, scaleDeep);
    r(px - 1.5, -50 + bob, 1.5, 29, scaleLight);
    r(px - 3.5, -43 + bob, 7, 4, bronzeDeep);
    r(px - 3, -42.5 + bob, 6, 1.2, bronzeLight);
    r(px - 3.5, -27 + bob, 7, 4, bronzeDeep);
    r(px - 3, -26.5 + bob, 6, 1.2, bronzeLight);
    r(px - 2.2, -49 + bob, 4.4, 4.4, out);
    r(px - 1.4, -48.2 + bob, 2.8, 2.8, open > .2 || striking ? tideMid : bronzeHi);
    r(px - .8, -47.6 + bob, 1.4, 1.4, "#ffffff");
  }
  r(gx - half - 4, -52 + bob, half * 2 + 8, 5, out);
  r(gx - half - 3, -51 + bob, half * 2 + 6, 3, scaleMid);
  r(gx - half - 2, -51 + bob, half * 2 + 4, 1, scaleRim);
  p(mossDeep, [gx - half - 2, -51 + bob], [gx - half + 3, -52 + bob], [gx - half + 1, -47 + bob], [gx - half - 3, -48 + bob]);
  p(mossMid, [gx - half - 1, -50.5 + bob], [gx - 2, -51.5 + bob], [gx - 3, -48 + bob], [gx - half, -48.5 + bob]);
  r(gx - half, -50 + bob, 4, 1.2, mossLight);

  if (fractured) {
    const cx = gx - (side ? 2 : 7);
    trace([[cx - 2, panelTop + 1], [cx + 1, panelTop + 5], [cx - 1, panelTop + 8], [cx + 2, panelTop + 11]], "#d4774d", 2.1);
    trace([[cx - 2, panelTop + 1], [cx + 1, panelTop + 5], [cx - 1, panelTop + 8]], "#ffe19a", .9);
    trace([[gx - half - 2, -43 + bob], [gx - half + 1, -38 + bob], [gx - half - 1, -32 + bob]], "#d4774d", 1.8);
  }

  if (side) {
    const hx = 15 + (windup ? -2 : 0);
    const hy = -26 + open * 1.8 + bob + (windup ? -1 : striking ? 2.5 : 0);
    const mainHorn: Point[] = [[hx - 7, hy - 5], [hx - 13, hy - 13], [hx - 12, hy - 18]];
    trace(mainHorn, out, 5.2);
    trace(mainHorn, boneMid, 2.8);
    trace([[hx - 7.5, hy - 5], [hx - 12.5, hy - 12], [hx - 11.8, hy - 16.5]], boneLight, 1.1);
    trace([[hx - 12, hy - 12], [hx - 18, hy - 15], [hx - 20, hy - 19]], out, 3.8);
    trace([[hx - 12, hy - 12], [hx - 18, hy - 15], [hx - 19.5, hy - 18]], boneLight, 1.6);
    trace([[hx - 3, hy - 9], [hx - 6, hy - 16], [hx - 4, hy - 18]], out, 3.8);
    trace([[hx - 3, hy - 9], [hx - 5.5, hy - 15], [hx - 4, hy - 16.5]], boneMid, 1.8);

    p(out, [hx - 13, hy - 2], [hx - 15, hy - 10], [hx - 8, hy - 12], [hx - 1, hy - 1], [hx - 4, hy + 13], [hx - 12, hy + 16]);
    p(scaleDeep, [hx - 11.5, hy - 2], [hx - 13.5, hy - 9], [hx - 8, hy - 10.5], [hx - 2.5, hy - 1], [hx - 5.5, hy + 11.5], [hx - 11, hy + 14.5]);
    p(scaleMid, [hx - 10.5, hy - 3], [hx - 12, hy - 8], [hx - 8, hy - 9], [hx - 4, hy - 1], [hx - 6.5, hy + 10], [hx - 10, hy + 12.5]);
    p(mossMid, [hx - 12, hy - 5], [hx - 13, hy - 10], [hx - 9, hy - 9], [hx - 7, hy - 5]);
    r(hx - 12, hy - 7, 3.5, 1.5, mossLight);

    p(out, [hx - 10, hy - 4], [hx - 9, hy - 12], [hx - 2, hy - 16], [hx + 7, hy - 13],
      [hx + 12, hy - 7], [hx + 20, hy - 3], [hx + 20, hy + 3], [hx + 10, hy + 5], [hx - 4, hy + 4], [hx - 11, hy + 1]);
    p(scaleDeep, [hx - 8.5, hy - 4], [hx - 7.5, hy - 10.5], [hx - 1, hy - 14], [hx + 6.5, hy - 11.5],
      [hx + 11, hy - 6], [hx + 18.5, hy - 2.5], [hx + 18.5, hy + 2], [hx + 9.5, hy + 3.5], [hx - 3.5, hy + 2.5], [hx - 9.5, hy]);
    p(scaleMid, [hx - 7, hy - 5], [hx - 6, hy - 10], [hx - 1, hy - 12.8], [hx + 6, hy - 10.8],
      [hx + 10, hy - 6], [hx + 17, hy - 2.5], [hx + 10, hy - .5], [hx - 3, hy - 1]);
    p(scaleLight, [hx - 6, hy - 9.5], [hx - 1, hy - 12], [hx + 5, hy - 10.5], [hx + 8, hy - 6], [hx + 2, hy - 6]);
    p(mudMid, [hx - 7, hy - 8], [hx - 2, hy - 11], [hx + 1, hy - 8], [hx - 2, hy - 5]);
    r(hx - 5, hy - 9.5, 4, 1.2, scaleRim);
    r(hx + 14, hy - 2.8, 2.6, 1.6, out);
    r(hx + 14.5, hy - 2.5, 1.2, .8, tideDeep);

    p(mouthDeep, [hx - 3, hy + 2], [hx + 18.5, hy + 2], [hx + 17, hy + 6 + jaw], [hx + 2, hy + 8 + jaw], [hx - 4, hy + 5]);
    p(gum, [hx + 1, hy + 3], [hx + 16.5, hy + 3], [hx + 15, hy + 5 + jaw * .55], [hx + 2, hy + 6 + jaw * .55]);
    p(out, [hx - 5, hy + 6], [hx + 2, hy + 7], [hx + 18, hy + 6 + jaw], [hx + 16, hy + 11 + jaw],
      [hx + 5, hy + 13 + jaw], [hx - 5, hy + 10]);
    p(boneMid, [hx - 3.5, hy + 7], [hx + 2, hy + 8], [hx + 16.5, hy + 7 + jaw],
      [hx + 14.5, hy + 10 + jaw], [hx + 5, hy + 11.5 + jaw], [hx - 3.5, hy + 9]);
    r(hx + 4, hy + 8 + jaw, 9, 1.2, boneLight);
    for (const tx of [2, 8, 14]) {
      p(boneHi, [hx + tx, hy + 2], [hx + tx + 2.4, hy + 2], [hx + tx + 1.1, hy + (tx === 14 ? 4.5 : 6)]);
    }
    for (const tx of [3, 10]) {
      p(boneHi, [hx + tx, hy + 8 + jaw], [hx + tx + 2.2, hy + 8 + jaw], [hx + tx + 1.1, hy + 4.5 + jaw * .5]);
    }
    p(out, [hx + .5, hy - 9], [hx + 8, hy - 10], [hx + 7, hy - 5], [hx + 2, hy - 6]);
    p(bronzeHi, [hx + 2, hy - 8], [hx + 7, hy - 8.5], [hx + 6, hy - 6.5], [hx + 2.5, hy - 6.8]);
    r(hx + 4, hy - 8, 1.2, 2, open > .2 || striking ? tideHi : "#fff2c1");
    trace([[hx - 1, hy - 10], [hx + 4, hy - 12], [hx + 9, hy - 9]], scaleRim, 1.8);
    p(scaleLight, [hx - 9, hy - 1], [hx - 4, hy - 5], [hx, hy - 1], [hx - 3, hy + 3], [hx - 8, hy + 2]);

    trace([[hx + 9, hy + 4], [hx + 15, hy + 1], [hx + 18, hy + 2]], out, 2.6);
    trace([[hx + 9, hy + 4], [hx + 15, hy + 1], [hx + 18, hy + 2]], boneLight, 1.2);
    if (open > .2 || striking) {
      p(tideMid, [hx + 8, hy + 7], [hx + 17, hy + 6 + jaw], [hx + 20, hy + 12], [hx + 15, hy + 15], [hx + 11, hy + 11]);
      p(tideHi, [hx + 11, hy + 8], [hx + 16, hy + 8 + jaw * .5], [hx + 17, hy + 11], [hx + 14, hy + 13]);
      r(hx + 12, hy + 8.5, 3.5, 1.5, "#ffffff");
    }
    if (striking) {
      trace([[hx + 13, hy - 10], [32.5, hy + 2], [29, hy + 15]], tideHi, 2.8);
      trace([[hx + 15, hy - 7], [30.5, hy + 1], [28, hy + 11]], "#ffffff", 1.2);
    }
  } else if (!back) {
    const hy = -24 + open * 1.5 + bob + (windup ? -1.5 : striking ? 2 : 0);
    for (const d of [-1, 1]) {
      const horn: Point[] = [[d * 9, hy - 6], [d * 15, hy - 16], [d * 20, hy - 22]];
      trace(horn, out, 5);
      trace(horn, boneMid, 2.7);
      trace([[d * 9.5, hy - 6], [d * 14.5, hy - 15], [d * 19.5, hy - 21]], boneLight, 1.1);
      trace([[d * 14, hy - 14], [d * 21, hy - 17], [d * 24, hy - 20]], out, 3.6);
      trace([[d * 14, hy - 14], [d * 21, hy - 17], [d * 23.5, hy - 19]], boneLight, 1.5);
      p(out, [d * 7, hy - 4], [d * 15, hy - 8], [d * 21, hy - 3], [d * 19, hy + 9], [d * 10, hy + 13]);
      p(scaleDeep, [d * 8.5, hy - 3], [d * 14.5, hy - 6], [d * 19.5, hy - 2], [d * 17.5, hy + 7.5], [d * 10.5, hy + 11.5]);
      p(mossMid, [d * 10, hy - 4], [d * 14.5, hy - 5], [d * 17.5, hy - 2], [d * 16, hy + 4], [d * 11, hy + 7]);
      r(d < 0 ? -15 : 11, hy - 2, 3.5, 1.8, mossLight);
    }

    p(out, [-17, hy - 4], [-14, hy - 13], [-7, hy - 18], [7, hy - 18], [14, hy - 13], [17, hy - 4],
      [14, hy + 6], [8, hy + 11], [-8, hy + 11], [-14, hy + 6]);
    p(scaleDeep, [-15.5, hy - 4], [-12.5, hy - 11.5], [-6, hy - 16], [6, hy - 16], [12.5, hy - 11.5],
      [15.5, hy - 4], [12.5, hy + 4.5], [7, hy + 9.5], [-7, hy + 9.5], [-12.5, hy + 4.5]);
    p(scaleMid, [-14, hy - 5], [-11, hy - 11], [-5, hy - 14.5], [5, hy - 14.5], [11, hy - 11],
      [14, hy - 5], [11, hy + 3], [6, hy + 7.5], [-6, hy + 7.5], [-11, hy + 3]);
    p(scaleLight, [-10, hy - 12], [-4, hy - 15], [5, hy - 14], [9, hy - 10], [0, hy - 6], [-6, hy - 8]);
    p(mudMid, [-9, hy - 10], [-3, hy - 12], [3, hy - 9], [0, hy - 5], [-5, hy - 6]);
    r(-4, hy - 12, 7, 1.4, scaleRim);

    for (const d of [-1, 1]) {
      p(out, [d * 4, hy - 9], [d * 12, hy - 10], [d * 11, hy - 5], [d * 4.5, hy - 6]);
      p(bronzeHi, [d * 5, hy - 8], [d * 11, hy - 8.8], [d * 10, hy - 6.4], [d * 5.5, hy - 7]);
      r(d < 0 ? -8 : 6, hy - 8.2, 1.4, 2.4, open > .2 || striking ? tideHi : "#fff1b9");
      trace([[d * 4, hy - 10], [d * 8, hy - 12], [d * 13, hy - 9]], scaleRim, 1.8);
    }
    r(-2.2, hy - 2.5, 1.6, 1.8, out);
    r(.6, hy - 2.5, 1.6, 1.8, out);
    p(mouthDeep, [-12, hy + 2], [12, hy + 2], [9, hy + 7 + jaw], [5, hy + 9 + jaw], [-5, hy + 9 + jaw], [-9, hy + 7 + jaw]);
    p(gum, [-9, hy + 3], [9, hy + 3], [7, hy + 5 + jaw * .5], [-7, hy + 5 + jaw * .5]);
    p(out, [-9, hy + 7 + jaw], [9, hy + 7 + jaw], [7, hy + 11 + jaw], [-7, hy + 11 + jaw]);
    p(boneMid, [-7.5, hy + 8 + jaw], [7.5, hy + 8 + jaw], [6, hy + 10 + jaw], [-6, hy + 10 + jaw]);
    for (const d of [-1, 1]) {
      p(boneHi, [d * 6, hy + 2], [d * 9.5, hy + 2], [d * 7.5, hy + 8]);
      p(boneHi, [d * 5, hy + 10 + jaw], [d * 7.5, hy + 10 + jaw], [d * 6.2, hy + 5 + jaw * .5]);
      trace([[d * 11, hy + 3], [d * 17, hy], [d * 21, hy + 2]], out, 2.8);
      trace([[d * 11, hy + 3], [d * 17, hy], [d * 21, hy + 2]], boneLight, 1.2);
    }
    if (open > .2 || striking) {
      p(tideMid, [-5, hy + 3], [5, hy + 3], [4, hy + 7 + jaw * .5], [-4, hy + 7 + jaw * .5]);
      r(-2.5, hy + 4, 5, 1.4, tideHi);
    }
  } else {
    r(-10, -43 + bob, 20, 3, bronzeDeep);
    r(-8, -42 + bob, 16, 1.2, bronzeLight);
    for (const d of [-1, 1]) r(d < 0 ? -15 : 12, -25 + bob, 3, 3, bronzeHi);
    trace([[0, -18 + bob], [0, -5]], tideMid, open > .2 ? 3 : 1.4);
  }

  if (skill && side && !live) {
    p(tideDeep, [2, -1], [12, -5.5], [19, -8], [23, -13], [29, -10], [35, -3], [32, 2], [13, 3.5], [6, 4.5], [-4, 3.5]);
    p(tideMid, [6, -1], [15, -4], [22, -8], [28, -8], [33, -2.5], [28, 1], [12, 2.5]);
    trace([[7, .5], [16, -1.5], [24, -5], [30, -7], [34, -3]], tideHi, 1.8);
    trace([[13, -4.5], [21, -6.5], [28, -8.5]], "#ffffff", 1.1);
    for (const [dx, dy] of [[24, -11], [30, -9], [33, -1]]) r(dx, dy, 2.4, 1.5, "#e6e0b8");
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
  const f8 = ((frame % 8) + 8) % 8;
  const f6 = ((frame % 6) + 6) % 6;
  const action = otter?.idle ?? "none";
  const actionFrame = ((frame % 4) + 4) % 4;

  const ink = "#2e3243";
  const shadow = fixedBank ? "#454e59" : mudPatrol ? "#55483f" : "#4e4845";
  const coat = fixedBank ? "#6e7474" : mudPatrol ? "#85634e" : "#746055";
  const sheen = fixedBank ? "#a1aaa9" : mudPatrol ? "#b08e6e" : "#a08b79";
  const creamShade = "#bcb9a8", cream = "#dfdccb", creamHi = "#f7f2df";
  const leather = "#3b393b", leatherMid = "#695747";
  const wood = "#72573f", woodHi = "#bc966b";
  const copper = "#a1764d", copperHi = "#e9c087";
  const jade = "#8ddbc9", water = "#58aaa4", waterHi = "#bcebe0";
  const band = fixedBank ? "#426b73" : mudPatrol ? "#934f3e" : tier >= 2 ? "#536d73" : "#77604b";
  const bandTrim = fixedBank ? (mastery ? jade : "#9abfba") : mudPatrol ? "#e0a06b" : tier >= 2 ? "#bacdca" : "#c5ad83";
  const bladeBand = fixedBank ? (mastery ? jade : "#7eb7b0") : mudPatrol ? "#cf7952" : tier >= 2 ? copper : "#6f9e93";
  const eyeColor = fixedBank && mastery ? "#a8ecdc" : "#efc078";
  const slapLift = idle && action === "tail-lift";
  const tailSlap = idle && action === "tail-slap";
  const slapAfter = idle && action === "splash";
  const checkingPaddle = idle && action === "check-paddle";
  const sniffing = idle && action === "sniff";
  const scanning = idle && action === "scan";
  const earFlick = idle && action === "flick";
  const blink = idle && action === "blink";
  const earTwitch = earFlick ? (actionFrame % 2 ? -1.0 : 0.4) : 0;
  const headTurn = scanning ? [-1.6, 0, 1.6, 0][actionFrame]
    : sniffing ? 1.8
    : checkingPaddle ? -1.2
    : 0;

  const leanX = windup ? -2.2 : striking ? 3.0 : bracing ? 1.0 : 0;
  const x = (side ? 1.0 : 0) + leanX;
  const crouch = bracing ? 3.2 : windup ? 1.2 : striking ? 1.4 : 0;
  const idleBob = [0, -0.8, -1.2, 0.5, -0.4, -0.9, -0.3, 0][f8];
  const actionBob = sniffing ? [0, 0.7, 1.2, 0.7][actionFrame]
    : checkingPaddle ? [0, -0.5, -1.0, -0.4][actionFrame]
    : scanning ? [0, -0.6, -0.9, -0.4][actionFrame]
    : earFlick ? [0, -0.8, -0.4, 0][actionFrame]
    : slapLift ? [0, -0.5, -1.0, -0.5][actionFrame]
    : 0;
  const bob = idle ? idleBob + actionBob
    : walking ? [0, -1.2, -1.8, -0.6, 0.2, 0.5][f6]
    : 0;
  const py = bob + crouch;
  const bulk = fixedBank ? 1.6 : mudPatrol ? -0.4 : 0;
  const stepA = walking ? Math.sin((f6 * Math.PI) / 3) : 0;
  const stepB = -stepA;
  const tailSway = bracing ? -1.6
    : windup ? 2.5
    : striking ? -3.0
    : slapLift ? [-4.0, -7.0, -11.0, -8.0][actionFrame]
    : idle ? [0, -1.2, 0.8, 0, -0.8, 1.0, -0.4, 0][f8]
    : Math.sin((f6 * Math.PI) / 3) * 1.8;

  // 0. Tier 4 Mud-Patrol: spare gold-tipped sentinel paddle strapped cleanly behind back
  if (mudPatrol && mastery) {
    trace([[x - 13.5, -40 + py], [x + 10, -8 + crouch * 0.4]], ink, 3.4);
    trace([[x - 13.5, -40 + py], [x + 10, -8 + crouch * 0.4]], woodHi, 1.5);
    p(ink, [x - 18, -44 + py], [x - 11, -46 + py], [x - 8.5, -39 + py], [x - 15.5, -37 + py]);
    p(copper, [x - 16.5, -43 + py], [x - 12, -44.5 + py], [x - 10, -39.8 + py], [x - 14.5, -38.5 + py]);
    r(x - 13.5, -43 + py, 3.0, 1.2, copperHi);
  }

  // 1. Long, muscular tapering otter rudder-tail (behind lower hip; lifts & slaps ground on idle f8=3!)
  const tBaseX = side ? x - 6.5 : x - 5.5;
  const tMidY = slapLift ? -13.5 + tailSway * 0.45 : tailSlap ? -5.0 : -9.2 + tailSway * 0.5;
  const tTipX = x - 24;
  const tTipY = tailSlap ? 2.0 : -2.2 + tailSway;
  const tTopY = tailSlap ? -2.0 : -6.4 + tailSway;
  const tBotY = tailSlap ? 4.0 : 2.2 + tailSway;
  p(ink,
    [tBaseX, -13 + bob * 0.6], [tBaseX - 9.5, tMidY], [tTipX + 5.5, tTopY], [tTipX, tTipY],
    [tTipX + 2.2, tBotY], [tBaseX - 11, tailSlap ? 3.6 : 2.6 + tailSway * 0.5], [tBaseX - 1, 0.6]);
  p(shadow,
    [tBaseX - 1, -11.6 + bob * 0.6], [tBaseX - 10, tMidY + 1.4], [tTipX + 6, tTopY + 1.2], [tTipX + 1.8, tTipY + 0.5],
    [tTipX + 3.6, tBotY - 1.2], [tBaseX - 10.5, tailSlap ? 2.2 : 1.2 + tailSway * 0.5], [tBaseX - 1.5, -0.8]);
  p(coat,
    [tBaseX - 2, -11.2 + bob * 0.6], [tBaseX - 10.5, tMidY + 1.6], [tTipX + 7, tTopY + 1.4], [tTipX + 3.4, tTipY],
    [tBaseX - 12.5, tailSlap ? 0.4 : -1.4 + tailSway * 0.6], [tBaseX - 3, -5.0 + bob * 0.4]);

  // Tail-slap ground impact ripple & water droplets on idle f8=3..4
  if (tailSlap) {
    p("#54b3a4", [tTipX - 2.5, 3.4], [tTipX + 4.8, 0.8], [tTipX + 15.5, 1.8], [tTipX + 11.2, 5.0], [tTipX - 0.5, 5.0]);
    r(tTipX + 1.8, 2.3, 8.0, 1.4, creamHi);
    trace([[tTipX - 0.5, 0.6], [tTipX - 3.8, -4.8], [tTipX - 2.2, -8.4]], "#88d6c7", 1.6);
    trace([[tTipX + 8.0, -1.6], [tTipX + 6.4, -7.0]], "#88d6c7", 1.4);
    r(tTipX - 4.2, -9.8, 2.1, 2.1, creamHi);
    r(tTipX + 4.8, -9.0, 1.9, 1.9, creamHi);
    r(tTipX + 11.8, -5.0, 1.7, 1.7, "#88d6c7");
  } else if (slapAfter) {
    r(tTipX - 1.8, -6.0, 1.6, 1.6, "#88d6c7");
    r(tTipX + 7.0, -6.8, 1.5, 1.5, creamHi);
  }

  // 2. Sturdy upright sentinel hind feet (consistent bipedal stance across ALL views!)
  const drawFoot = (fx: number, lift: number, far: boolean) => {
    const fy = (far ? -1.0 : 1.0) - Math.max(0, lift) * 2.5;
    p(ink, [fx - 5.4, fy - 1.6], [fx - 2.2, fy - 4.8], [fx + 3.6, fy - 4.4], [fx + 6.2, fy - 0.5], [fx + 5.0, fy + 2.2], [fx - 5.0, fy + 2.2]);
    p(far ? shadow : coat, [fx - 3.8, fy - 1.0], [fx - 1.6, fy - 3.2], [fx + 2.8, fy - 2.9], [fx + 4.6, fy - 0.3], [fx + 3.6, fy + 0.9], [fx - 3.4, fy + 0.9]);
    if (!far) r(fx + 0.5, fy - 1.1, 2.4, 1.1, sheen);
  };
  if (side) {
    drawFoot(x - 5.2 + stepB * 3.8 + (windup ? -2.0 : 0), stepB, true);
    drawFoot(x + 5.5 + stepA * 4.0 + (striking ? 3.0 : bracing ? 2.0 : 0), stepA, false);
  } else {
    drawFoot(x - 6.8, stepA, false);
    drawFoot(x + 6.8, stepB, false);
  }

  // 3. Enlarged UPRIGHT muscular otter sentinel torso (SAME tall standing stature in Front, Side, and Back!)
  if (side) {
    // Upright standing side torso: proud arched back on left (-x), bright cream chest facing forward (+x)
    p(ink,
      [x - 10.5 - bulk, -5.5 + py * 0.5], [x - 11.8 - bulk, -15.5 + py], [x - 9.0 - bulk * 0.5, -27.5 + py],
      [x + 7.5 + bulk * 0.5, -27.5 + py], [x + 11.5 + bulk * 0.8, -16.5 + py], [x + 10.5 + bulk * 0.5, -5.5 + py * 0.5],
      [x + 6.2, -2.2], [x - 6.8, -2.2]);
    p(shadow,
      [x - 9.0 - bulk, -6.5 + py * 0.5], [x - 10.2 - bulk, -15.5 + py], [x - 7.6 - bulk * 0.4, -26.0 + py],
      [x + 6.4 + bulk * 0.4, -26.0 + py], [x + 10.0 + bulk * 0.7, -16.5 + py], [x + 9.0 + bulk * 0.4, -6.5 + py * 0.5],
      [x + 5.2, -3.6 + py * 0.3], [x - 5.8, -3.6 + py * 0.3]);
    p(coat,
      [x - 8.2 - bulk * 0.8, -7.5 + py * 0.5], [x - 9.2 - bulk * 0.8, -16.0 + py], [x - 6.8, -25.4 + py],
      [x + 5.8, -25.4 + py], [x + 8.6, -16.5 + py], [x + 5.0, -7.5 + py * 0.5], [x - 4.5, -6.0 + py * 0.5]);
    // Sleek wet-fur highlight along arched upright back
    p(sheen, [x - 8.2, -16.5 + py], [x - 6.4, -24.8 + py], [x - 1.5, -24.8 + py], [x - 3.5, -16.5 + py], [x - 6.8, -11.5 + py * 0.7]);
    // Proud bright cream chest & belly facing forward (+x)
    p(creamShade, [x + 1.2, -7.5 + py * 0.5], [x + 2.0, -24.5 + py], [x + 7.4, -24.5 + py], [x + 9.8, -16.5 + py], [x + 8.6, -7.5 + py * 0.5], [x + 4.5, -5.0 + py * 0.4]);
    p(cream, [x + 2.4, -8.5 + py * 0.5], [x + 3.0, -24.0 + py], [x + 7.2, -24.0 + py], [x + 9.0, -16.5 + py], [x + 7.4, -8.5 + py * 0.5]);
    r(x + 4.2, -22.2 + py, 3.2, 3.0, creamHi);
  } else {
    // Upright standing front/back torso (matching height y: -27.5 .. -2.2)
    p(ink,
      [x - 12.2 - bulk, -5.5 + py * 0.5], [x - 12.8 - bulk, -15.5 + py], [x - 9.8 - bulk * 0.5, -27.5 + py],
      [x + 9.8 + bulk * 0.5, -27.5 + py], [x + 12.8 + bulk, -15.5 + py], [x + 12.2 + bulk, -5.5 + py * 0.5],
      [x + 7.4, -2.2], [x - 7.4, -2.2]);
    p(shadow,
      [x - 10.6 - bulk, -6.5 + py * 0.5], [x - 11.2 - bulk, -15.5 + py], [x - 8.4 - bulk * 0.4, -26.0 + py],
      [x + 8.4 + bulk * 0.4, -26.0 + py], [x + 11.2 + bulk, -15.5 + py], [x + 10.6 + bulk, -6.5 + py * 0.5],
      [x + 6.2, -3.6 + py * 0.3], [x - 6.2, -3.6 + py * 0.3]);
    p(coat,
      [x - 9.8 - bulk * 0.8, -7.5 + py * 0.5], [x - 10.2 - bulk * 0.8, -16.0 + py], [x - 7.6, -25.4 + py],
      [x + 7.6, -25.4 + py], [x + 10.2 + bulk * 0.8, -16.0 + py], [x + 8.4, -7.5 + py * 0.5], [x - 5.0, -6.0 + py * 0.5]);
    if (!back) {
      p(creamShade, [x - 7.4, -9.0 + py * 0.5], [x - 6.8, -24.5 + py], [x + 6.8, -24.5 + py], [x + 7.4, -9.0 + py * 0.5], [x + 4.4, -5.2 + py * 0.4], [x - 4.4, -5.2 + py * 0.4]);
      p(cream, [x - 6.2, -10.2 + py * 0.5], [x - 5.8, -24.0 + py], [x + 5.8, -24.0 + py], [x + 6.2, -10.2 + py * 0.5], [x + 3.4, -6.8 + py * 0.4], [x - 3.4, -6.8 + py * 0.4]);
      r(x - 3.4, -22.2 + py, 6.8, 2.4, creamHi);
    } else {
      p(sheen, [x - 5.4, -24.2 + py], [x + 5.4, -24.2 + py], [x + 6.2, -13.0 + py * 0.7], [x - 6.2, -13.0 + py * 0.7]);
    }
  }

  // 4. Clean sentinel martial gear (Frost-Wolf-style crisp collar, waist belt, tier harness & branch pauldrons/capelet)
  // Crisp waist-belt with single brass/jade clasp (gives disciplined guardian silhouette without boxy clothes!)
  const beltW = side ? 9.6 : 10.6;
  r(x - beltW, -11.4 + py * 0.6, beltW * 2, 2.2, ink);
  r(x - beltW + 1, -11.2 + py * 0.6, beltW * 2 - 2, 1.4, leatherMid);
  if (!back) {
    const bx = side ? x + 3.8 : x - 1.6;
    r(bx, -11.9 + py * 0.6, 3.4, 3.0, fixedBank && mastery ? jade : copper);
    r(bx + 0.7, -11.4 + py * 0.6, 1.3, 1.2, copperHi);
  }

  if (fixedBank) {
    // Heavy riveted breakwater shoulder pauldrons (consistent in front & side!)
    if (side) {
      p(ink, [x - 6.5, -26.5 + py], [x + 4.5, -26.0 + py], [x + 5.5, -18.5 + py], [x - 6.0, -19.2 + py]);
      p(band, [x - 5.2, -25.2 + py], [x + 3.4, -24.8 + py], [x + 4.2, -19.8 + py], [x - 4.8, -20.4 + py]);
      p(bandTrim, [x - 4.4, -24.4 + py], [x + 2.6, -24.0 + py], [x + 2.8, -22.2 + py], [x - 4.2, -22.6 + py]);
      if (mastery) r(x - 1.5, -22.0 + py, 2.6, 1.8, jade);
    } else {
      for (const d of [-1, 1]) {
        p(ink, [x + d * 5.8, -26.5 + py], [x + d * 14.2, -24.5 + py], [x + d * 13.8, -17.5 + py], [x + d * 6.4, -18.5 + py]);
        p(band, [x + d * 6.8, -25.2 + py], [x + d * 12.6, -23.5 + py], [x + d * 12.2, -18.8 + py], [x + d * 7.2, -19.6 + py]);
        p(bandTrim, [x + d * 7.4, -24.4 + py], [x + d * 11.8, -23.0 + py], [x + d * 11.4, -21.2 + py], [x + d * 7.8, -21.8 + py]);
        r(x + d * 11.8 - 0.6, -23.0 + py, 1.2, 1.2, copperHi);
      }
    }
  } else if (mudPatrol) {
    // Fluttering martial scout scarf/capelet behind shoulder
    const flutter = Math.sin((f6 * Math.PI) / 3) * 2.0;
    p(ink, [x - 7.5, -25.5 + py], [x - 18.5, -24.0 + py + flutter], [x - 20.5, -18.0 + py + flutter], [x - 9.0, -19.5 + py]);
    p(band, [x - 8.2, -24.4 + py], [x - 17.0, -23.0 + py + flutter], [x - 18.5, -19.4 + py + flutter], [x - 9.0, -20.5 + py]);
    r(x - 16.2, -22.2 + py + flutter * 0.7, 5.2, 1.2, bandTrim);
  } else if (tier >= 2) {
    // Sleek sentinel leather V-harness across chest
    if (side) {
      trace([[x - 5.5, -24.5 + py], [x + 6.5, -17.5 + py]], ink, 3.4);
      trace([[x - 5.2, -24.5 + py], [x + 6.2, -17.5 + py]], band, 1.8);
    } else {
      trace([[x - 9.2, -24.5 + py], [x, -17.5 + py], [x + 9.2, -24.5 + py]], ink, 3.4);
      trace([[x - 8.8, -24.5 + py], [x, -17.5 + py], [x + 8.8, -24.5 + py]], band, 1.8);
    }
  }

  if (tier >= 2) {
    const colW = side ? 8.4 : 9.2;
    p(ink, [x - colW, -25.2 + py], [x - 5.8, -27.4 + py], [x + 5.8, -27.4 + py], [x + colW, -25.2 + py], [x + 6.8, -22.4 + py], [x - 6.8, -22.4 + py]);
    p(band, [x - colW + 1.2, -24.8 + py], [x - 5.0, -26.4 + py], [x + 5.0, -26.4 + py], [x + colW - 1.2, -24.8 + py], [x + 5.8, -23.2 + py], [x - 5.8, -23.2 + py]);
    r(x - 4.8, -24.5 + py, 9.6, 1.0, bandTrim);
  }

  // 5. UNIFIED UPRIGHT OTTER HEAD (SAME height hy = -33.8 in Front, Side, and Back — sleek naturalistic Frost-Wolf proportions!)
  const hx = x + headTurn + (side ? 1.5 : 0);
  const hy = -33.8 + py + (sniffing ? 2.0 : checkingPaddle ? 1.0 : 0);
  const earPin = windup || striking || bracing ? 1.2 : earFlick ? [0.8, -0.6, 1.2, 0][actionFrame] : 0;

  if (side) {
    // Far small round otter ear peeking at upper-front crown
    p(ink, [hx - 1.0, hy - 6.8 + earPin], [hx + 2.8, hy - 9.4 + earPin], [hx + 5.6, hy - 6.6 + earPin], [hx + 2.2, hy - 4.6]);
    p(shadow, [hx + 0.0, hy - 6.2 + earPin], [hx + 2.6, hy - 8.0 + earPin], [hx + 4.2, hy - 6.2 + earPin], [hx + 1.8, hy - 5.0]);

    p(ink,
      [hx - 9.6, hy + 2.0], [hx - 9.2, hy - 4.2], [hx - 5.2, hy - 8.2], [hx + 3.2, hy - 8.0],
      [hx + 8.4, hy - 4.2], [hx + 10.2, hy - 0.6], [hx + 9.8, hy + 3.6], [hx + 6.6, hy + 6.4], [hx - 5.8, hy + 6.6]);
    p(shadow,
      [hx - 8.2, hy + 1.6], [hx - 7.8, hy - 3.6], [hx - 4.4, hy - 6.9], [hx + 2.8, hy - 6.7],
      [hx + 7.0, hy - 3.2], [hx + 8.8, hy - 0.2], [hx + 8.4, hy + 2.8], [hx + 5.6, hy + 5.0], [hx - 4.8, hy + 5.2]);
    p(coat,
      [hx - 7.5, hy + 0.2], [hx - 7.2, hy - 3.4], [hx - 4.0, hy - 6.3], [hx + 2.8, hy - 6.1],
      [hx + 6.6, hy - 3.0], [hx + 8.0, hy - 0.4], [hx + 5.6, hy + 2.8], [hx - 4.4, hy + 3.0]);
    p(sheen, [hx - 4.8, hy - 4.0], [hx - 3.0, hy - 6.1], [hx + 2.2, hy - 5.9], [hx + 3.6, hy - 3.8], [hx - 1.0, hy - 3.2]);

    if (tier >= 2) {
      p(ink, [hx - 7.8, hy - 3.8], [hx - 4.2, hy - 6.6], [hx + 3.8, hy - 6.4], [hx + 7.6, hy - 3.8], [hx + 6.6, hy - 2.4], [hx - 6.6, hy - 2.4]);
      p(band, [hx - 6.8, hy - 3.8], [hx - 3.8, hy - 5.8], [hx + 3.2, hy - 5.6], [hx + 6.6, hy - 3.8], [hx + 5.8, hy - 3.2], [hx - 5.8, hy - 3.2]);
      r(hx + 2.0, hy - 5.8, 2.6, 2.0, fixedBank && mastery ? jade : copperHi);
    }

    p(creamShade, [hx - 3.8, hy + 1.4], [hx + 3.8, hy - 0.2], [hx + 8.8, hy + 0.4], [hx + 8.2, hy + 3.6], [hx + 5.4, hy + 5.4], [hx - 3.2, hy + 5.2]);
    p(cream, [hx - 3.0, hy + 1.2], [hx + 3.8, hy + 0.0], [hx + 8.0, hy + 0.6], [hx + 7.4, hy + 2.8], [hx + 4.6, hy + 4.0], [hx - 2.2, hy + 3.8]);

    p(ink, [hx + 6.8, hy - 1.4], [hx + 9.8, hy - 0.8], [hx + 9.4, hy + 1.6], [hx + 6.8, hy + 1.4]);
    r(hx + 7.4, hy - 1.0, 1.2, 0.9, sheen);

    // Crisp white whiskers
    r(hx + 6.2, hy + 1.8, 4.8, 1.0, creamHi);
    r(hx + 5.4, hy + 3.5, 4.4, 1.0, creamHi);

    // Sharp Frost-Wolf-style dark-socket amber/jade eye
    if (blink) {
      r(hx + 0.6, hy - 2.0, 3.8, 1.1, ink);
    } else {
      p(ink, [hx - 0.2, hy - 3.2], [hx + 4.0, hy - 3.8], [hx + 5.4, hy - 1.8], [hx + 3.6, hy - 0.2], [hx + 0.4, hy - 0.6]);
      r(hx + 1.6, hy - 2.8, 2.4, 1.6, eyeColor);
      r(hx + 2.0, hy - 2.8, 1.0, 0.9, creamHi);
    }

    // Near small round otter ear clearly drawn ON TOP of upper-back skull
    p(ink, [hx - 9.4, hy - 1.8 + earPin], [hx - 9.6, hy - 5.8 + earPin], [hx - 6.2, hy - 7.6 + earPin], [hx - 3.2, hy - 5.0 + earPin], [hx - 4.0, hy - 1.4 + earPin]);
    p(coat, [hx - 8.0, hy - 2.4 + earPin], [hx - 8.0, hy - 5.2 + earPin], [hx - 5.8, hy - 6.2 + earPin], [hx - 4.4, hy - 4.6 + earPin], [hx - 5.0, hy - 2.2 + earPin]);
    r(hx - 6.8, hy - 4.5 + earPin, 1.7, 1.7, "#c99b82");
  } else {
    // Front & Back head (exact same height & width as side!)
    for (const d of [-1, 1]) {
      const ex = hx + d * 8.2, ey = hy - 4.6 + earTwitch;
      p(ink, [ex - 2.8, ey + 1.2], [ex - 3.0, ey - 2.2], [ex - 0.8, ey - 3.8], [ex + 1.8, ey - 3.6], [ex + 3.0, ey - 1.2], [ex + 2.4, ey + 1.6]);
      p(coat, [ex - 1.8, ey + 0.5], [ex - 1.9, ey - 1.8], [ex - 0.4, ey - 2.8], [ex + 1.2, ey - 2.6], [ex + 1.9, ey - 0.8], [ex + 1.4, ey + 0.6]);
      if (!back) r(ex - 0.7, ey - 1.7, 1.6, 1.6, sheen);
    }

    p(ink,
      [hx - 9.8, hy + 1.8], [hx - 9.4, hy - 4.8], [hx - 5.8, hy - 8.8], [hx + 5.8, hy - 8.8],
      [hx + 9.4, hy - 4.8], [hx + 9.8, hy + 1.8], [hx + 7.2, hy + 7.0], [hx - 7.2, hy + 7.0]);
    p(shadow,
      [hx - 8.5, hy + 1.4], [hx - 8.1, hy - 4.2], [hx - 4.8, hy - 7.5], [hx + 4.8, hy - 7.5],
      [hx + 8.1, hy - 4.2], [hx + 8.5, hy + 1.4], [hx + 6.0, hy + 5.4], [hx - 6.0, hy + 5.4]);
    p(coat,
      [hx - 7.9, hy + 0.2], [hx - 7.3, hy - 4.0], [hx - 4.6, hy - 7.1], [hx + 4.6, hy - 7.1],
      [hx + 7.3, hy - 3.8], [hx + 7.4, hy + 0.2], [hx + 4.4, hy + 4.1], [hx - 5.2, hy + 4.1]);
    p(sheen, [hx - 5.4, hy - 4.4], [hx - 3.4, hy - 6.7], [hx + 2.8, hy - 6.7], [hx + 3.8, hy - 4.4], [hx - 1.2, hy - 3.6]);

    if (tier >= 2) {
      p(ink, [hx - 8.2, hy - 4.4], [hx - 4.8, hy - 7.0], [hx + 4.8, hy - 7.0], [hx + 8.2, hy - 4.4], [hx + 6.8, hy - 3.0], [hx - 6.8, hy - 3.0]);
      p(band, [hx - 7.0, hy - 4.3], [hx - 4.2, hy - 6.0], [hx + 4.2, hy - 6.0], [hx + 7.0, hy - 4.3], [hx + 5.8, hy - 3.7], [hx - 5.8, hy - 3.7]);
      r(hx - 1.4, hy - 6.3, 2.8, 2.0, fixedBank && mastery ? jade : copperHi);
    }

    if (!back) {
      const my = hy + 3.0;
      p(creamShade, [hx - 8.6, my - 1.2], [hx - 5.4, my - 3.8], [hx + 5.4, my - 3.8], [hx + 8.6, my - 1.2], [hx + 6.8, my + 4.0], [hx - 6.8, my + 4.0]);
      p(cream, [hx - 7.8, my - 1.4], [hx - 4.8, my - 3.4], [hx + 4.8, my - 3.4], [hx + 7.8, my - 1.4], [hx + 5.8, my + 3.0], [hx - 5.8, my + 3.0]);
      r(hx - 3.6, my - 2.8, 7.2, 1.8, creamHi);

      p("#201c20", [hx - 2.6, my - 2.8], [hx + 2.6, my - 2.8], [hx + 1.8, my - 0.6], [hx, my + 0.2], [hx - 1.8, my - 0.6]);
      r(hx - 1.2, my - 2.6, 1.4, 0.9, "#8e9ca6");
      r(hx - 0.4, my + 0.2, 0.8, 1.4, "#6b4e42");
      r(hx - 2.0, my + 1.4, 4.0, 0.8, "#6b4e42");

      for (const wy of [-1.2, 1.1]) {
        r(hx + 6.8, my + wy, 4.4, 1.0, creamHi);
        r(hx - 11.2, my + wy, 4.4, 1.0, creamHi);
      }

      for (const d of [-1, 1]) {
        const ex = hx + d * 4.5;
        if (blink) {
          r(ex - 1.8, hy - 1.4, 3.6, 1.1, ink);
        } else {
          p(ink, [ex - 2.0, hy - 3.0], [ex + 2.0, hy - 3.2], [ex + 2.2, hy - 0.4], [ex - 1.8, hy - 0.4]);
          r(ex - 1.1, hy - 2.5, 2.2, 1.7, eyeColor);
          r(ex - 0.7, hy - 2.5, 1.0, 0.9, creamHi);
        }
      }
    } else {
      r(hx - 4.0, hy - 6.2, 8.0, 1.8, sheen);
    }
  }

  // 6. Sentinel Boat-Paddle Polearm (tall, proud upright halberd stance in idle/walk; dynamic windup/strike/brace!)
  const idleSway = checkingPaddle ? [0, 2.0, 3.2, 1.4][actionFrame]
    : idle ? [0, 0.6, 0.2, -0.6, 0.4, 0.8, -0.3, 0][f8]
    : 0;
  const idleLift = checkingPaddle ? [0, -1.0, -3.0, -1.2][actionFrame] : 0;

  if (windup) {
    // Upright sentinel hoists paddle high behind shoulder
    const tip: Point = [x + 8.5, -14 + py];
    const end: Point = [x - 15, -39.5 + py];
    trace([tip, end], ink, 4.2);
    trace([tip, end], wood, 2.0);
    const [bx, by] = end;
    p(ink, [bx - 6.4, by - 4.4], [bx + 2.4, by - 8.2], [bx + 6.8, by - 1.8], [bx + 2.4, by + 5.2], [bx - 5.4, by + 3.4]);
    p(wood, [bx - 5.0, by - 3.4], [bx + 1.8, by - 6.8], [bx + 5.4, by - 1.4], [bx + 1.6, by + 4.0], [bx - 4.2, by + 2.4]);
    p(bladeBand, [bx - 4.4, by - 3.0], [bx + 1.8, by - 6.0], [bx + 3.4, by - 2.0], [bx - 2.0, by + 0.5]);
  } else if (striking) {
    // Upright sentinel steps forward into a fierce horizontal paddle cleave + luminous water arc
    const tip: Point = [x - 4, -17 + py];
    const end: Point = [x + 22, -18 + py];
    p("#54b3a480", [x + 12, -37 + py], [x + 26, -31 + py], [x + 31, -17 + py], [x + 22, -6 + py], [x + 19, -14 + py], [x + 23, -24 + py], [x + 14, -30 + py]);
    trace([[x + 14, -34 + py], [x + 25.5, -27 + py], [x + 29.5, -17 + py], [x + 23, -9 + py]], bladeBand, 2.3);
    trace([[x + 17, -30 + py], [x + 24.5, -24 + py], [x + 27.5, -17 + py]], creamHi, 1.2);
    trace([tip, end], ink, 4.2);
    trace([tip, end], wood, 2.0);
    const [bx, by] = end;
    p(ink, [bx - 5.5, by - 5.0], [bx + 7.5, by - 5.6], [bx + 9.2, by], [bx + 6.4, by + 5.2], [bx - 5.5, by + 4.0]);
    p(wood, [bx - 4.2, by - 3.8], [bx + 6.2, by - 4.4], [bx + 7.8, by], [bx + 5.2, by + 4.0], [bx - 4.2, by + 3.0]);
    p(bladeBand, [bx + 1.8, by - 4.0], [bx + 6.2, by - 4.2], [bx + 7.4, by], [bx + 5.0, by + 3.6], [bx + 1.4, by + 3.0]);
    r(bx + 2.8, by - 3.4, 3.6, 1.3, creamHi);
  } else if (bracing) {
    // Disciplined low upright sentinel plants paddle diagonally into mud with turquoise ripple
    const tip: Point = [x + 17, -18 + crouch * 0.5];
    const end: Point = [x - 16, 1.0];
    trace([tip, end], ink, 4.2);
    trace([tip, end], wood, 2.0);
    const [bx, by] = end;
    p(ink, [bx - 10.2, by - 3.2], [bx - 2.8, by - 7.4], [bx + 6.5, by - 3.6], [bx + 6.5, by + 2.6], [bx - 1.8, by + 4.0], [bx - 10.2, by + 1.8]);
    p(wood, [bx - 8.8, by - 2.2], [bx - 2.6, by - 5.8], [bx + 5.0, by - 2.8], [bx + 5.0, by + 1.4], [bx - 1.6, by + 2.6], [bx - 8.8, by + 0.8]);
    r(bx - 8.4, by - 2.2, 3.2, 3.8, bladeBand);
    p("#5cb8aa", [bx - 12, by + 2.4], [bx - 2, by + 0.4], [bx + 8, by + 1.8], [bx + 2, by + 4.4], [bx - 9, by + 4]);
    r(bx - 6.4, by + 1.2, 5.5, 1.2, creamHi);
  } else {
    // Upright sentinel halberd-grip (both Front idle & Side walk — tall, clean, unobstructed!)
    const ox = side ? x + 11.8 : x + 11.4;
    const tip: Point = [ox - 1.4, 2.5 + idleLift * 0.6];
    const end: Point = [ox + 3.0 + idleSway + (side ? stepA * 1.0 : 0), -37.0 + bob + idleLift];
    trace([tip, end], ink, 4.0);
    trace([tip, end], wood, 2.0);
    trace([[tip[0] - 0.5, tip[1] - 0.5], [end[0] - 0.5, end[1] - 0.5]], woodHi, 0.9);
    const [bx, by] = end;
    p(ink, [bx - 5.2, by - 7.4], [bx + 2.6, by - 8.8], [bx + 6.6, by - 4.0], [bx + 5.0, by + 4.0], [bx - 1.0, by + 6.0], [bx - 5.2, by + 1.0]);
    p(wood, [bx - 3.8, by - 6.2], [bx + 2.0, by - 7.2], [bx + 5.0, by - 3.4], [bx + 3.8, by + 2.8], [bx - 0.8, by + 4.5], [bx - 3.8, by + 0.6]);
    p(woodHi, [bx - 3.2, by - 5.8], [bx + 1.5, by - 6.6], [bx + 2.0, by + 2.0], [bx - 0.8, by + 3.4], [bx - 3.2, by + 0.2]);
    r(bx - 3.2, by - 7.0, 6.0, 2.3, bladeBand);
    r(bx - 2.2, by - 6.6, 3.2, 1.0, creamHi);
  }

  // 7. Sentinel forepaws gripping paddle cleanly
  const drawForePaw = (pawX: number, pawY: number) => {
    p(ink, [pawX - 3.2, pawY - 2.4], [pawX + 3.2, pawY - 2.4], [pawX + 3.4, pawY + 2.5], [pawX - 3.0, pawY + 2.5]);
    p(coat, [pawX - 2.0, pawY - 1.4], [pawX + 2.0, pawY - 1.4], [pawX + 2.2, pawY + 1.5], [pawX - 1.9, pawY + 1.5]);
    r(pawX - 1.3, pawY - 1.0, 1.9, 1.0, sheen);
  };
  if (windup) {
    drawForePaw(x + 7.5, -15.5 + py);
    drawForePaw(x - 3.5, -25.5 + py);
  } else if (striking) {
    drawForePaw(x + 10.5, -17.0 + py);
    drawForePaw(x + 2.5, -16.5 + py);
  } else if (bracing) {
    drawForePaw(x + 9.0, -13.5 + py * 0.7);
    drawForePaw(x - 1.5, -8.5 + py * 0.7);
  } else {
    const ox = side ? x + 12.0 : x + 11.6;
    drawForePaw(ox + idleSway * 0.35 + (side ? stepA * 0.4 : 0), -16.5 + py + idleLift * 0.6);
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

  // 10-keyframe smooth catapult throw cycle (phase ∈ [0, 1]; boolean true maps to launch frame 5)
  const rawPhase = typeof firing === "number" ? firing : firing ? 0.55 : 0;
  const phase = Math.max(0, Math.min(1, rawPhase));
  // Keyframe index 0..9:
  // 0: Ready | 1: Draw 1 | 2: Draw 2 | 3: Full tension | 4: Whip up
  // 5: Release! | 6: Follow-through (empty) | 7: Recoil (empty) | 8: Reloading pot | 9: Settle
  const kf = phase <= 0.02 ? 0 : Math.min(9, Math.max(1, Math.round(phase * 9)));
  const springSqueeze = [0, 0.35, 0.72, 1.0, 0.3, 0, -0.1, 0.05, 0, 0][kf];
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
    // Spare pot dips briefly during reload frame (kf === 8) as it transfers to cradle
    if (kf !== 8) {
      p(clayMid, [-17, -21.5], [-16, -26], [-11, -26], [-10.5, -21.5]);
      r(-16.5, -26.5, 5.5, 2, glazeLight);
    }
    r(-18, -17, 8, 1.1, timberDeep);
    r(-17.5, -13.5, 7.5, 1.1, timberDeep);
  }

  // 5. Tier 2+: Tall vertical coiled brass torsion springs (visibly compress & gleam under draw tension!)
  if (tier >= 2) {
    const drawSpring = (sx: number) => {
      const topY = -31 + springSqueeze * 3.5;
      p(out, [sx - 3.4, -14], [sx - 3.4, topY], [sx + 3.4, topY], [sx + 3.4, -14]);
      p(brassDeep, [sx - 2.3, -15], [sx - 2.3, topY + 1.2], [sx + 2.3, topY + 1.2], [sx + 2.3, -15]);
      const step = (15 + topY) / 4; // compress coils smoothly
      for (let ci = 0; ci < 4; ci++) {
        const cy = topY + 2.2 - ci * step;
        r(sx - 2.1, cy, 4.2, 1.7, springSqueeze >= 0.7 ? brassLight : brassMid);
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
    if (kf !== 8) r(12.5, -24, 5.2, 2, glazeLight);
    r(11.8, -16, 6.8, 1.1, timberDeep);
  }

  // 7. High-mounted throwing arm with 10 continuous keyframes (draw -> full tension -> whip -> launch -> follow-through -> recoil -> reload)
  const pivotX = -4.5, pivotY = deckY - 5;
  // [tipX, tipY] arm end coordinates per keyframe (strictly inside y >= -44 so pots never clip y = -52!)
  const armKeyframes: readonly [number, number][] = [
    [9.5, -37.0],  // 0: Ready
    [4.0, -35.8],  // 1: Draw 1 (pulling back)
    [-3.5, -34.2], // 2: Draw 2 (deep pull)
    [-9.5, -35.0], // 3: Full tension (max cocked back)
    [2.0, -42.5],  // 4: Whip up (fast upward snap through apex)
    [12.0, -42.8], // 5: Release! (launch point)
    [15.8, -39.2], // 6: Follow-through (arm overshoots forward, empty)
    [12.4, -40.8], // 7: Recoil (arm bounces slightly back, empty)
    [10.2, -38.4], // 8: Reload 1 (returning & loading fresh pot)
    [9.5, -37.2],  // 9: Reload 2 (pot settles into ready)
  ];
  const [tipX, tipY] = armKeyframes[kf];
  // Counterweight butt end opposite the arm direction
  const dx = tipX - pivotX, dy = tipY - pivotY;
  const len = Math.hypot(dx, dy) || 1;
  const buttX = pivotX - (dx / len) * 6.5;
  const buttY = pivotY - (dy / len) * 6.5;

  // Motion blur arc behind arm during fast whip & launch (kf 4 & 5)
  if (kf === 4) {
    trace([[-9, -36], [-4, -42], [2, -43]], "#e8c47466", 3.2);
  } else if (kf === 5) {
    trace([[-2, -42], [5, -45], [13, -43]], "#f7f3e488", 3.4);
  }

  trace([[buttX, buttY], [pivotX, pivotY], [tipX, tipY]], out, 7.0);
  trace([[buttX, buttY], [pivotX, pivotY], [tipX, tipY]], timberMid, 4.2);
  trace([[buttX, buttY - 0.6], [pivotX - 0.5, pivotY - 0.6], [tipX - 0.6, tipY - 0.6]], timberRim, 1.4);

  // Brass pivot hub (brightens slightly at full tension kf=3)
  p(out, [pivotX - 5.5, pivotY - 3.5], [pivotX - 2.5, pivotY - 6], [pivotX + 2.5, pivotY - 6], [pivotX + 5.5, pivotY - 2.5],
    [pivotX + 4.8, pivotY + 3.5], [pivotX - 4.8, pivotY + 3.5]);
  p(kf === 3 ? brassLight : brassMid, [pivotX - 4, pivotY - 2.5], [pivotX - 1.8, pivotY - 4.5], [pivotX + 1.8, pivotY - 4.5], [pivotX + 4, pivotY - 1.8],
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

  // Brass cradle cup mounted cleanly on the arm tip
  const cupW = double ? 8.2 : 6.6;
  p(out, [tipX - cupW, tipY - 1.8], [tipX + cupW, tipY - 1.8], [tipX + cupW - 1.4, tipY + 3.4], [tipX - cupW + 1.4, tipY + 3.4]);
  p(brassMid, [tipX - cupW + 1.3, tipY - 0.8], [tipX + cupW - 1.3, tipY - 0.8], [tipX + cupW - 2.4, tipY + 2.2], [tipX - cupW + 2.4, tipY + 2.2]);
  r(tipX - cupW + 2.2, tipY - 0.5, (cupW - 2.2) * 1.4, 1.1, brassHi);

  // Pot & glaze trail by animation stage:
  if (kf === 5) {
    // Release! Salt pot launches cleanly out of the cradle with white salt-glaze streak & crystals
    trace([[tipX + 1, tipY - 1], [tipX + 5.5, tipY - 3.5], [tipX + 9.5, tipY - 4.5]], glazeMid, 1.8);
    for (const [sx, sy] of [[tipX + 2, tipY - 3.5], [tipX + 7, tipY - 5], [tipX + 10.5, tipY - 1]]) r(sx, sy, 2.0, 1.4, glazeHi);
    drawSaltPot(tipX + 9.2, tipY - 2.0, heavy ? 6.4 : 5.4, heavy ? 6.4 : 5.4, heavy);
    if (double) drawSaltPot(tipX + 1.5, tipY - 1.0, 4.6, 4.6, false);
  } else if (kf === 6 || kf === 7) {
    // Follow-through & recoil: empty cradle + dissipating white salt dust puffs
    if (kf === 6) {
      r(tipX + 3.5, tipY - 4.5, 2.4, 2.0, glazeLight);
      r(tipX + 7.5, tipY - 2.5, 1.8, 1.6, glazeHi);
      r(tipX + 1.0, tipY - 6.0, 1.6, 1.4, glazeMid);
    } else {
      r(tipX + 2.5, tipY - 3.5, 1.6, 1.4, glazeLight);
    }
  } else if (kf === 8) {
    // Reloading: fresh pot popping smoothly down into the returning cradle
    if (double) {
      drawSaltPot(tipX - 4.2, tipY - 4.5, 5.4, 5.6, false);
      drawSaltPot(tipX + 4.4, tipY - 6.0, 5.4, 5.6, false);
    } else {
      drawSaltPot(tipX, tipY - 5.2, heavy ? 8.2 : 6.8, heavy ? 7.8 : 6.6, heavy);
    }
  } else {
    // Seated in cradle (Ready 0, Draw 1..3, Whip 4, Settle 9)
    const seatY = kf === 4 ? -4.5 : kf === 3 ? -3.4 : kf === 9 ? -3.8 : -4.2;
    if (kf === 3) {
      // Subtle tension spark at full draw
      r(tipX - 5.5, tipY - 6.5, 2.2, 1.4, brassHi);
    }
    if (double) {
      drawSaltPot(tipX - 4.4, tipY + seatY + 0.6, 5.8, 6.0, false);
      drawSaltPot(tipX + 4.6, tipY + seatY - 1.2, 5.8, 6.0, false);
    } else {
      drawSaltPot(tipX, tipY + seatY, heavy ? 8.8 : 7.2, heavy ? 8.4 : 7.0, heavy);
    }
  }
}

export function paintSaltCaster(r: Rect, p: Shape, tier: number, path: string | null = null, lift = 0) {
  saltCaster(artFor(r, p), path === "thick-glaze" ? 3 : path === "salt-rain" ? 4 : tier - 1, lift);
}

export interface SporePose {
  readonly charge: number;
  readonly release: number;
}

function sporeCaster({ r, p }: Art, form: number, pose: SporePose = { charge: 0, release: Infinity }) {
  const out = "#252d2a";
  const stoneDeep = "#354744", stoneMid = "#587069", stoneLight = "#8ba69a";
  const timberDeep = "#45372b", timberMid = "#756044", timberLight = "#ad8c5e";
  const brassDeep = "#635437", brassMid = "#a18a51", brassLight = "#d8c27d";
  const podDeep = "#3f583d", podMid = "#6f9252", podLight = "#a9c975", podGlow = "#e1efa2";
  const burst = form === 3, parasitic = form === 4;
  const charge = Math.max(0, Math.min(1, pose.charge)) ** (burst ? .85 : parasitic ? 1.3 : 1.15);
  const release = pose.release < .36
    ? Math.exp(-pose.release * 10) * Math.cos(pose.release * 28) : 0;
  const podWidth = 1 + charge * .22 + release * .12;
  const podHeight = 1 + charge * .3 - release * .16;
  const pod = (cx: number, bottom: number, rx: number, ry: number) => {
    const px = (x: number) => cx + x * rx * podWidth;
    const py = (y: number) => bottom - y * ry * podHeight;
    p(out, [px(-1), py(0)], [px(-1.05), py(.78)], [px(-.72), py(1.15)],
      [px(.72), py(1.15)], [px(1.05), py(.78)], [px(1), py(0)], [px(.65), py(-.18)], [px(-.65), py(-.18)]);
    p(podDeep, [px(-.8), py(.15)], [px(-.85), py(.82)], [px(-.55), py(1.05)],
      [px(.55), py(1.05)], [px(.85), py(.82)], [px(.8), py(.15)], [px(.5), py(-.05)], [px(-.5), py(-.05)]);
    p(podMid, [px(-.64), py(.17)], [px(-.68), py(.78)], [px(-.4), py(.98)],
      [px(.4), py(.98)], [px(.68), py(.78)], [px(.64), py(.17)], [px(.4), py(.03)], [px(-.4), py(.03)]);
    p(podLight, [px(-.53), py(.2)], [px(-.55), py(.72)], [px(-.32), py(.9)],
      [px(.05), py(.91)], [px(-.06), py(.8)], [px(-.28), py(.2)]);
    r(px(-.27), py(.86), rx * podWidth * .44, ry * podHeight * .13,
      charge > .72 ? "#f2f7c4" : podGlow);
    r(px(-.14), py(.54), rx * podWidth * .28, ry * podHeight * .13,
      charge > .45 ? podGlow : podLight);
    r(px(.06), py(.25), rx * podWidth * .18, ry * podHeight * .13, podLight);
  };
  const span = burst ? 18 : parasitic ? 17 : 16;
  p(out, [-span, 2], [-span + 2, -5], [-12, -9], [12, -9], [span - 2, -5], [span, 2], [span - 5, 6], [-span + 5, 6]);
  p(stoneDeep, [-span + 2, 1], [-span + 5, -5], [span - 5, -5], [span - 2, 1], [span - 5, 4.5], [-span + 5, 4.5]);
  p(stoneMid, [-span + 4, 0], [-span + 6, -4], [span - 6, -4], [span - 4, 0], [span - 7, 3], [-span + 7, 3]);
  p(stoneLight, [-span + 5, -1.5], [-span + 7, -4], [1, -4], [-1, -2], [-span + 6, -1]);
  for (const x of [-11, 8]) {
    r(x, -2, 4, 1.2, stoneLight);
    r(x + .7, -1, 2.5, .7, stoneDeep);
  }
  p(out, [-14, -5], [-10, -32], [10, -32], [14, -5], [9, 0], [-9, 0]);
  p(timberDeep, [-11, -6], [-8, -31], [-4, -31], [-7, -6]);
  p(timberMid, [-10.5, -7], [-7.7, -30], [-5.7, -30], [-8.2, -7]);
  p(timberLight, [-10, -8], [-7.3, -29], [-6.4, -29], [-8.8, -8]);
  p(timberMid, [4, -31], [8, -31], [11, -6], [7, -6]);
  p(timberLight, [5.8, -30], [7.3, -30], [9.7, -8], [8, -8]);
  p(timberDeep, [-8, -8], [8, -27], [8, -24], [-8, -5]);
  p(timberMid, [8, -8], [-8, -27], [-8, -24], [8, -5]);
  p(timberLight, [-7.5, -7], [7.5, -25.5], [7.5, -24.4], [-7.5, -5.9]);
  for (const y of [-13, -23]) {
    r(-11, y, 22, 2.3, brassDeep);
    r(-10, y + .35, 13, .85, brassLight);
  }
  p(out, [-15, -29], [-15, -35], [-10, -39], [10, -39], [15, -35], [15, -29], [10, -25], [-10, -25]);
  p(timberMid, [-13.5, -29], [-13, -34], [-9, -37], [9, -37], [13, -34], [13.5, -29], [9, -27], [-9, -27]);
  p(brassMid, [-10, -30], [-8, -35], [8, -35], [10, -30], [7, -28], [-7, -28]);
  r(-8, -34, 16, 1.2, brassLight);
  pod(0, -35, 8.4, 14.8);
  const crownLift = charge * .8 - release * .5;
  p(brassDeep, [-8.5 - charge, -48 + crownLift], [-7 - charge * .5, -52 + crownLift],
    [7 + charge * .5, -52 + crownLift], [8.5 + charge, -48 + crownLift], [6, -46], [-6, -46]);
  p(brassMid, [-6.5 - charge * .6, -49 + crownLift], [-5.5, -50.5 + crownLift],
    [5.5, -50.5 + crownLift], [6.5 + charge * .6, -49 + crownLift], [5, -47.5], [-5, -47.5]);
  r(-2 - charge * .3, -51 + crownLift, 4 + charge * .6, 1.8, brassLight);
  r(-6.8 - charge, -36.5, 13.6 + charge * 2, 2.2, brassDeep);
  r(-5.8 - charge, -36.2, 11.6 + charge * 2, .9, charge > .72 ? "#f0db91" : brassLight);
  if (form >= 1) {
    p(out, [-16, -17], [-17, -28], [-13, -31], [-8, -29], [-8, -18], [-11, -15]);
    p(timberMid, [-14.8, -18], [-15.2, -27], [-12.5, -29], [-9.8, -27.5], [-9.8, -19], [-12, -17]);
    pod(-12, -19, 2.9, 8.5);
    r(-15, -22.5, 6.5, 1.1, brassMid);
  }
  if (form >= 2) {
    p(out, [9, -18], [9, -29], [12, -32], [17, -29], [17, -18], [13, -15]);
    p(timberMid, [10.5, -18], [10.5, -27.5], [12.5, -30], [15, -27.5], [15, -18], [13, -17]);
    pod(13, -19, 2.9, 8.5);
    r(-7.2, -42.5, 14.4, 1.2, brassMid);
    r(-5.5, -32.5, 11, 1.3, brassLight);
  }
  if (burst) {
    p("#dbc27b", [-5.4, -45.5], [-2.2, -43.5], [-3.4, -41.8], [.2, -40.2], [-.6, -37.5], [1.2, -35.8], [2.4, -38.2], [5.2, -39.5], [3.2, -42], [4.8, -43.5], [1.2, -45.2], [.2, -47.2]);
    r(-6.5, -34, 4, 2, "#caa45d");
    r(3.5, -34, 4, 2, "#caa45d");
  }
  if (parasitic) {
    p(podDeep, [-4, -32], [-5.5, -26], [-3.5, -22], [-1.5, -26], [-1.5, -32]);
    p(podMid, [-3.5, -30], [-4.2, -26], [-3, -24], [-2.3, -27], [-2.3, -30]);
    p(podDeep, [2, -32], [2.5, -25], [5, -23], [6, -27], [4.5, -32]);
    p(podLight, [3.2, -29], [3.6, -25], [4.7, -24.5], [4.8, -27], [4, -30]);
    r(-7, -46, 3, 1.2, podGlow);
    r(4.5, -43.5, 2.5, 1.2, podGlow);
  }
}

export function paintSporeCaster(r: Rect, p: Shape, tier: number, path: string | null = null, pose?: SporePose) {
  sporeCaster(artFor(r, p), path === "burst-spores" ? 3 : path === "parasitic-spores" ? 4 : tier - 1, pose);
}
