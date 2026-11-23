import { CELL } from "../engine/route.ts";
import type { BattlefieldLandmark, Bridge, Level, Point } from "../engine/types.ts";
import { box } from "./canvas.ts";
import { drawMireKeep, drawRiverSkiff, landShape, splitIce } from "./landforms.ts";

export interface SceneryReaction {
  readonly landmark: BattlefieldLandmark;
  at: number;
  lit: boolean;
}

export function drawSceneryReaction(
  ctx: CanvasRenderingContext2D,
  { landmark, at, lit }: SceneryReaction,
  now: number,
  reducedMotion: boolean,
) {
  const [tileX, tileY] = landmark.at;
  const x = tileX * CELL + 8;
  const y = tileY * CELL + 11;
  const elapsed = Math.max(0, (now - at) / 1000);
  const duration = 1.4;
  const live = elapsed < duration;
  const t = reducedMotion ? 0.36 : elapsed / duration;

  if (landmark.kind === "cabin") {
    if (lit) {
      box(ctx, x + 1, y - 7, 7, 6, "#fac6714d");
      box(ctx, x + 3, y - 5, 2, 2, "#fff1b3");
    } else box(ctx, x + 3, y - 5, 2, 2, "#453e30");
    if (live && lit) {
      for (let i = 0; i < 3; i++) {
        const drift = t - i * 0.14;
        if (drift < 0) break;
        ctx.globalAlpha = (1 - drift) * 0.76;
        box(ctx, x + 4 + drift * 15, y - 17 - drift * 19, 2 + drift * 3, 2, "#e0e4c6");
      }
      ctx.globalAlpha = 1;
    }
    return;
  }
  if (!live) return;
  ctx.globalAlpha = 1 - t * 0.84;
  if (landmark.kind === "mine-cart" || landmark.kind === "ore-vein") {
    for (let i = 0; i < 11; i++) {
      const a = i * 2.4, radius = 3 + t * (7 + i % 5);
      box(ctx, x + Math.cos(a) * radius, y - 6 + Math.sin(a) * radius - t * 5,
        i % 3 ? 1 : 2, .75, i % 2 ? "#f7dc9c" : "#e89660");
    }
  } else if (landmark.kind === "skiff") {
    const drift = 4 + t * 15;
    box(ctx, x - 8, y + drift, 12 + t * 6, 1, "#b8e7c8");
    box(ctx, x - 11, y + drift + 3, 8 + t * 4, 1, "#8dcbb7");
  } else if (landmark.kind === "ruins" || landmark.kind === "mire-keep") {
    const radius = 9 + t * 17;
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      box(ctx, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.4, 2, 1, "#c9edb4");
    }
    box(ctx, x - 7, y - 10, 2, 4, "#d3f7be");
    box(ctx, x - 4, y - 8, 1, 3, "#99e4c1");
    box(ctx, x + 5, y - 6, 2, 2, "#cbefb7");
  } else if (landmark.kind === "floe") {
    for (let i = 0; i < 8; i++) {
      const dx = i % 4 * 3 - 5;
      const dy = i * 1.7 + t * 17;
      box(ctx, x + dx + Math.sin(dy) * t * 3, y - 6 + dy, i % 3 + 1, 1, "#dbf7ff");
    }
    box(ctx, x - 2, y - 4, 6, 1, "#f4f9ec");
    box(ctx, x + 1, y - 7, 1, 7, "#f4f9ec");
  } else if (landmark.kind === "birdhouse") {
    for (let i = 0; i < 3; i++) {
      const bx = x + (i - 1) * 4 + t * (i - 1) * 8;
      const by = y - 20 - Math.sin(t * Math.PI) * (7 + i * 3) - t * 6;
      box(ctx, bx, by, 2, 1, i % 2 ? "#c8b58e" : "#f1e5c8");
      box(ctx, bx + (i - 1) * 2, by - 1, 1, 1, "#5b5548");
    }
    for (let i = 0; i < 4; i++) box(ctx, x - 5 + i * 3, y - 14 + t * 8, 1, 1, "#d8bd79");
  } else if (landmark.kind === "campfire") {
    for (let i = 0; i < 5; i++) {
      const lift = t * (9 + i % 3 * 4);
      box(ctx, x - 3 + i % 3 * 3, y - 5 - lift, 2, 3 + i % 2, i % 2 ? "#ffb45f" : "#ffe09b");
    }
    for (let i = 0; i < 3; i++) box(ctx, x - 4 + i * 4, y - 12 - t * (6 + i * 3), 1, 1, "#fff0b0");
  } else if (landmark.kind === "fish-trap") {
    for (let i = 0; i < 5; i++) {
      const age = (t + i * .13) % 1;
      box(ctx, x - 5 + i * 2.4, y - 3 - age * 13, 1.4, 1.4, "#cde9c4");
    }
    if (t < .6) {
      const fish = t / .6;
      box(ctx, x + 4 + fish * 7, y - 1 - Math.sin(fish * Math.PI) * 4, 4, 1.5, "#c9ddc1");
      box(ctx, x + 8 + fish * 7, y - 2 - Math.sin(fish * Math.PI) * 4, 2, 2, "#eef5d8");
    }
  } else if (landmark.kind === "drift-buoy") {
    const bob = Math.sin(t * Math.PI) * 2;
    box(ctx, x - 6 - t * 10, y - 1 + bob, 5 + t * 6, 1, "#c2e6df");
    box(ctx, x + 5 + t * 11, y - 1 - bob, 4 + t * 5, 1, "#a8d7cd");
    box(ctx, x, y - 6 + bob, 2, 2, "#ffeab0");
  } else if (landmark.kind === "lily-bell") {
    for (let i = 0; i < 3; i++) {
      const r = 2 + t * (9 + i * 3);
      box(ctx, x - r, y - 1 + i, r * 2, .8, i % 2 ? "#bce6df" : "#8fc9bd");
    }
    for (let i = 0; i < 4; i++) box(ctx, x - 4 + i * 3, y - 8 - t * (7 + i * 2), 1.4, 1, "#f1d6df");
  } else if (landmark.kind === "rail-lantern") {
    const swing = Math.sin(t * Math.PI * 2) * 4;
    box(ctx, x + 6 + swing, y - 17 + t * 3, 4, 5, "#f5d087");
    for (let i = 0; i < 4; i++) box(ctx, x + 7 + swing + (i % 2 ? 2 : -2), y - 16 - t * (6 + i * 2), 1, 1, "#fff2b0");
    box(ctx, x + 5 + swing * .7, y - 20, 1, 4, "#8d7151");
  } else if (landmark.kind === "hand-pump") {
    for (let i = 0; i < 5; i++) {
      const age = t - i * .1;
      if (age < 0) break;
      box(ctx, x + 8 + age * (7 + i), y - 5 - Math.sin(age * Math.PI) * (5 + i), 1.3, 1.3, i % 2 ? "#d9f1ec" : "#9fd4d1");
    }
    box(ctx, x - 6, y - 15 - Math.sin(t * Math.PI) * 2, 1, 3, "#c4b9a0");
  } else if (landmark.kind === "ice-chime") {
    for (let i = 0; i < 4; i++) {
      const drift = t * (5 + i * 2);
      box(ctx, x - 6 + i * 3 + Math.sin(t * 7 + i) * 2, y - 13 + drift, 1.2, 2.6, i % 2 ? "#e5fbff" : "#bcecf7");
      box(ctx, x - 6 + i * 3, y - 10 + drift * .5, 1, 1, "#ffffff");
    }
  } else if (landmark.kind === "snow-lantern") {
    for (let i = 0; i < 4; i++) {
      const a = t * Math.PI * 2 + i * 1.57;
      const r = 3 + t * 7;
      box(ctx, x + Math.cos(a) * r, y - 5 - t * 6 + Math.sin(a) * r * .4, 1.2, 1.2, "#ffe9a8");
    }
    box(ctx, x - 3, y - 7 - t * 2, 6, 3, "#fff0b0");
  } else if (landmark.kind === "bog-idol") {
    box(ctx, x - 3.5, y - 9, 2.5, 2, "#d7f08a");
    box(ctx, x + 1.5, y - 9, 2.5, 2, "#d7f08a");
    for (let i = 0; i < 4; i++) {
      const a = t * Math.PI * 2 + i * 1.57;
      box(ctx, x + Math.cos(a) * (4 + t * 7), y - 7 - t * (5 + i), 1, 1, "#c8f57a");
    }
  } else if (landmark.kind === "glow-pod") {
    if (live) for (let i = 0; i < 7; i++) {
      const a = i * 1.2 + t * 2;
      const dist = t * (6 + i % 3 * 3);
      box(ctx, x + Math.cos(a) * dist, y - 4 - t * 5 + Math.sin(a) * dist * .55, 1.2, 1.2,
        i % 2 ? "#d8f58a" : "#a7d45e");
    }
  } else if (t < 0.46) {
    const leap = t / 0.46;
    const fx = x + leap * 12;
    const fy = y - 4 - Math.sin(leap * Math.PI) * 13;
    box(ctx, fx - 3, fy, 7, 3, "#365e4d");
    box(ctx, fx + 1, fy - 2, 4, 3, "#a5c595");
    box(ctx, fx + 3, fy - 2, 1, 1, "#26392f");
    box(ctx, fx - 5, fy + 2, 3, 1, "#7d9f75");
  } else {
    const ripple = 2 + (t - 0.46) * 15;
    box(ctx, x + 12 - ripple, y - 2, ripple * 0.8, 1, "#c2e6df");
    box(ctx, x + 12 + ripple * 0.2, y - 2, ripple * 0.8, 1, "#a8d7cd");
    box(ctx, x + 11 - ripple * 0.5, y + 1, ripple, 1, "#c2e6df");
  }
  ctx.globalAlpha = 1;
}

export function drawFootbridge(
  ctx: CanvasRenderingContext2D,
  bridge: Bridge,
  frozen = false,
  rift = false,
  mire = false,
) {
  const [x, y] = bridge.from,
    [tx, ty] = bridge.to;
  const vertical = x === tx;
  const start = (vertical ? Math.min(y, ty) : Math.min(x, tx)) * CELL + 1;
  const end = (vertical ? Math.max(y, ty) : Math.max(x, tx)) * CELL + CELL - 1;
  const across = (vertical ? x : y) * CELL + CELL / 2;
  const widthScale = bridge.style === "sluice" ? 1.55 : 1.7;
  const beam = (
    along: number,
    offset: number,
    len: number,
    breadth: number,
    shade: string,
  ) =>
    vertical
      ? box(ctx, across + offset * widthScale, along, breadth * widthScale, len, shade)
      : box(ctx, along, across + offset * widthScale, len, breadth * widthScale, shade);
  if (bridge.style === "mire-raft") {
    const shape = (at: number, color: string, points: readonly Point[], direction = 1) =>
      landShape(ctx, points.map(([u, v]) => vertical
        ? [across + v * widthScale, at + direction * u]
        : [at + direction * u, across + v * widthScale]), color);
    // Silt and moss gather where the first logs rest on the bank.
    for (const direction of [1, -1]) {
      const bank = direction === 1 ? start : end;
      shape(bank, "#645e46", [[-5,-4],[-2,-8],[5,-9],[12,-7],[17,-3],[20,1],[14,6],[6,9],[-4,6]], direction);
      shape(bank, "#525c41", [[-2,-7],[3,-9],[9,-8],[11,-6],[7,-5],[1,-5]], direction);
      shape(bank, "#797257", [[-4,1],[0,-3],[6,-2],[9,1],[4,4],[-3,5]], direction);
    }
    const sections = Math.ceil((end - start) / 22);
    const span = (end - start) / sections;
    const wood = ["#786247", "#826b50", "#6c5944", "#887658", "#755f4a"];
    for (let section = 0; section < sections; section++) {
      const a = start + section * span;
      const drift = [0, -.55, .65, .2][section % 4];
      for (const side of [-1, 1]) {
        const edge = side * 6.4 + drift;
        const log = a + (side === 1 ? .75 : -.5);
        beam(log - .75, edge - 1.9, span + 1, 3.8, "#293c30a0");
        beam(log, edge - 1.3, span - .25, 2.6, "#423b30");
        beam(log + 1, edge - 1, span - 2, .75, "#67573f");
        beam(log + 3, edge + side * 1.4, span * .45, .5, "#75875d99");
      }
      for (let board = 0; board < 4; board++) {
        const at = a + 1 + board * (span - 1.25) / 4;
        const length = (span - 1.25) / 4 - .65;
        const far = drift - 6.1 + [0, .5, -.35, .15][(board + section) % 4];
        const near = drift + 6.6 + [.5, -.55, .2][(board + section) % 3];
        shape(at, "#3c362c", [[0,far+.8],[.65,far],[length,far+.3],[length+.35,near-.75],
          [length-.25,near],[.5,near],[-.2,near-.8]]);
        shape(at, wood[(board + section * 2) % wood.length], [[.3,far+1],[.8,far+.3],[length-.55,far+.65],
          [length-.45,near-1.2],[.6,near-.65]]);
        const grain = drift + (board % 2 ? -3.5 : 1.5);
        beam(at + 1.35, grain, .55, 2.5 + board % 3, "#564735");
        beam(at + 2.2, grain - .8, .45, 2.75, "#a08d645c");
        if ((board + section) % 3 !== 1) {
          const moss = board % 2 ? near - 1.9 : far + .25;
          beam(at + .5, moss, length - .6, 1.35, "#566447");
          beam(at + 1.1, moss + .3, Math.min(1.4, length - 1), .7, "#778159");
        }
      }
      for (const side of [-1, 1]) {
        const lashing = a + span * (side === 1 ? .72 : .29);
        const edge = drift + side * 6.05;
        beam(lashing, edge - 1.45, 2, 3, "#483c2d");
        beam(lashing + .45, edge - 1.55, 1.1, 3, "#9b8a5c");
        beam(lashing + 1.35, edge - 1.15, .6, 2.35, "#746749");
      }
    }
    return;
  }
  // The lip falls onto the approach on both ends.
  for (const edge of [start - 2, end]) beam(edge, -6.75, 2, 13.5, "#263b396e");
  if (bridge.style === "stones") {
    beam(start, -9, end - start, 18, "#3a746a");
    beam(start, -7.5, end - start, 15, "#497d72");
    for (let i = start, row = 0; i < end; i += 6.5, row++) {
      const length = Math.min(6, end - i);
      const edge = -5.5 + (row % 3 - 1) * 0.6;
      beam(i, edge, length, 11, "#455d54");
      beam(i, edge + 0.6, Math.max(0, length - 0.65), 9.5, row % 2 ? "#8b9c80" : "#a3ac8e");
      beam(i + 0.5, edge + 1, Math.max(0, length - 1), 0.7, "#c3c8a1");
      if (length > 3) beam(i + 2, edge + 8, 1.2, 1.5, "#70856a");
    }
    return;
  }
  if (bridge.style === "sluice") {
    const length = end - start;
    beam(start, -10, length, 21, "#1c403d");
    beam(start, -8.5, length, 18, "#556e60");
    beam(start, -6.5, length, 13, "#675b43");
    for (let i = start; i < end; i += 5) {
      const width = Math.min(4.5, end - i);
      beam(i, -6, width, 12, (i - start) % 2 ? "#bba477" : "#a58e68");
      beam(i, -5.5, 1, 10, "#d3bb89");
      beam(i + 1, 2.5, 2, 0.5, "#877a59");
      beam(i + 1.5, -2.5, Math.min(1.5, width), .25, "#e4ca97");
      beam(i + 2, 4.5, .5, .5, "#5b5442");
    }
    for (const side of [-8.5, 7]) {
      for (let i = start; i < end; i += 13) {
        beam(i, side, Math.min(12, end - i), 1.7, "#7e9376");
        beam(i, side + 0.3, 2, 1.2, "#abc0a0");
      }
      for (const i of [start + 9, end - 13]) {
        beam(i, side - 0.7, 5, 3.8, "#2a4842");
        beam(i + 1, side, 3, 2, "#e9bc68");
        beam(i + 2, side + 0.5, 1.5, 1, "#ffe8a1");
      }
    }
    return;
  }
  if (rift) {
    beam(start, -9, end - start, 19, "#262232");
    beam(start, -7.5, end - start, 15, "#514755");
    for (let i = start, row = 0; i < end; i += 7, row++) {
      const length = Math.min(6.5, end - i);
      beam(i, -6, length, 12, row % 2 ? "#887886" : "#7b6d7c");
      beam(i + .5, -5.5, Math.max(0, length - 1), 1, "#a6969e");
      beam(i, row % 2 ? -1.5 : 2, length, .5, "#504657");
      beam(i + 1, 5.5, Math.max(0, length - 1.5), .5, "#5f5264");
    }
    for (const side of [-8.25, 6.5]) {
      beam(start, side, end - start, 2, "#615363");
      beam(start, side, end - start, .5, "#92808c");
      for (const i of [start + 2, end - 7]) {
        beam(i, side - .5, 5, 3.25, "#45374a");
        beam(i + .5, side - .25, 4, 2.5, "#9d8299");
        beam(i + 1.5, side + .25, 2, 1.25, "#e6b9cc");
      }
    }
    beam(start + 5, 8.5, Math.max(0, end - start - 10), 1, "#382d43");
    for (const i of [start + 8, end - 11]) beam(i, 8, 3, 2.25, "#645267");
    return;
  }
  if (frozen) {
    beam(start, -9, end - start, 18, "#426473");
    beam(start, -7, end - start, 14, "#758d98");
    for (let i = start; i < end; i += 5) {
      beam(
        i,
        -6,
        Math.min(4.5, end - i),
        12,
        (i - start) % 2 ? "#becbd0" : "#a7b9c1",
      );
      beam(i, -6, 0.7, 12, "#d8e2df");
      beam(i + 1, 1, 1.7, 1, "#93a6b2");
      beam(i + 1.75, -3.5, 1.5, .25, "#e4ece8");
    }
    for (const side of [-8, 6]) {
      beam(start, side, end - start, 2, "#87a6b3");
      for (let i = start + 2; i < end; i += 10) {
        beam(i, side, 2.5, 2.3, "#d4e6e5");
        beam(i + 1.5, side, 0.8, 2.3, "#7797a7");
      }
    }
    return;
  }
  if (mire) {
    beam(start, -9, end - start, 19, "#1c2b27");
    beam(start, -7, end - start, 14, "#3b4337");
    for (let i = start; i < end; i += 3) {
      const board = Math.min(end - i, 2.5);
      beam(i, -6, board, 12, (i - start) % 2 ? "#736d53" : "#827b5e");
      beam(i, -5.5, 0.5, 11, "#a29a76");
      beam(i + 0.5, 3.5, 1.5, 1.5, "#596e52");
      beam(i + 0.5, -2.5, 1.25, .4, "#869c6c");
    }
    beam(start, -7, end - start, 1.5, "#55614a");
    beam(start, 5.5, end - start, 1.5, "#3f4939");
    for (let i = start + 1; i < end; i += 12) {
      for (const offset of [-8, 6]) {
        beam(i, offset, 2, 2.5, "#2f3b34");
        beam(i, offset, 1, 2, "#8b9470");
      }
    }
    return;
  }
  beam(start, -9, end - start, 19, "#193b37");
  beam(start, -7, end - start, 14, "#513e2f");
  for (let i = start; i < end; i += 3) {
    const board = Math.min(end - i, 2.5);
    beam(i, -6, board, 12, (i - start) % 2 ? "#a78254" : "#b79260");
    beam(i, -5.5, 0.5, 11, "#d1ab76");
    beam(i + 0.5, 3.5, 1.5, 1.5, "#7f664d");
    beam(i + .5, -1.5, 1.5, .25, "#cda675");
  }
  beam(start, -7, end - start, 1.5, "#735536");
  beam(start, 5.5, end - start, 1.5, "#554633");
  for (let i = start + 1; i < end; i += 12) {
    for (const offset of [-8, 6]) {
      beam(i, offset, 2, 2.5, "#46392d");
      beam(i, offset, 1, 2, "#b39261");
    }
  }
}

export function drawScenerySnow(
  ctx: CanvasRenderingContext2D,
  level: Level,
  snow: number,
  time: number,
  still: boolean,
) {
  if (snow <= .01) return;
  const thickness = .7 + snow * 9;
  const snowColor = "#eef9fb";
  ctx.save();
  ctx.globalAlpha = Math.min(.95, .3 + snow * 1.2);
  for (const landmark of level.scenery ?? []) {
    const x = landmark.at[0] * CELL + 8;
    const y = landmark.at[1] * CELL + 11;
    if (landmark.kind === "cabin") {
      box(ctx, x - 4, y - 15 - thickness, 8, thickness, snowColor);
      box(ctx, x - 10, y - 10 - thickness * .55, 6, thickness * .55, snowColor);
      box(ctx, x + 4, y - 10 - thickness * .55, 6, thickness * .55, snowColor);
    } else if (landmark.kind === "ruins") {
      box(ctx, x - 9, y - 14 - thickness * .55, 6, thickness * .55, snowColor);
      box(ctx, x + 3, y - 9 - thickness * .45, 6, thickness * .45, snowColor);
      box(ctx, x - 10, y - 3 - thickness * .32, 17, thickness * .32, "#e7f4f6");
    } else if (landmark.kind === "floe") {
      box(ctx, x - 8, y - 5 - thickness * .35, 16, thickness * .35, snowColor);
    } else if (landmark.kind === "skiff") {
      box(ctx, x - 8, y - 7 - thickness * .3, 16, thickness * .3, "#e7f4f6");
    } else if (landmark.kind === "ice-chime") {
      box(ctx, x - 7, y - 19 - thickness * .5, 14, thickness * .5, snowColor);
    } else if (landmark.kind === "snow-lantern") {
      box(ctx, x - 4.5, y - 9 - thickness * .7, 9, thickness * .7, snowColor);
    } else {
      box(ctx, x - 4, y - 12 - thickness * .4, 8, thickness * .4, "#e7f4f6");
    }
  }
  for (const bridge of level.bridges ?? []) {
    const [x, y] = bridge.from, [tx, ty] = bridge.to;
    const vertical = x === tx;
    const start = (vertical ? Math.min(y, ty) : Math.min(x, tx)) * CELL + 2;
    const end = (vertical ? Math.max(y, ty) : Math.max(x, tx)) * CELL + CELL - 2;
    const across = (vertical ? x : y) * CELL + CELL / 2;
    const edge = 1.2 + snow * 4.5;
    if (vertical) {
      box(ctx, across - 5.5, start, edge, end - start, snowColor);
      box(ctx, across + 5.5 - edge, start, edge, end - start, "#e7f4f6");
    } else {
      box(ctx, start, across - 5.5, end - start, edge, snowColor);
      box(ctx, start, across + 5.5 - edge, end - start, edge, "#e7f4f6");
    }
  }
  ctx.restore();
  if (still || snow < .16) return;
  ctx.save();
  ctx.globalAlpha = .35 + snow * .35;
  for (const [index, landmark] of (level.scenery ?? []).entries()) {
    if (index % 2) continue;
    const x = landmark.at[0] * CELL + 8;
    const y = landmark.at[1] * CELL + 11;
    const drift = Math.sin(time * 1.4 + index * 1.7) * 4;
    const fall = (time * 5 + index * 7) % 17;
    box(ctx, x + drift, y - 11 + fall, 1.2, 1.2, "#f8feff");
  }
  ctx.restore();
}

export function drawBattleLandmark(
  ctx: CanvasRenderingContext2D,
  landmark: BattlefieldLandmark,
  frozen = false,
  mire = false,
) {
  const [tileX, tileY] = landmark.at;
  const x = tileX * CELL + 8,
    y = tileY * CELL + 11;
  const b = (dx: number, dy: number, w: number, h: number, c: string) =>
    box(ctx, x + dx, y + dy, w, h, c);
  if (landmark.kind === "mire-keep") {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(2.05, 2.05);
    drawMireKeep(ctx, 0, 0);
    ctx.restore();
  } else if (landmark.kind === "mine-cart" || landmark.kind === "ore-vein") {
    const shape = (c: string, points: readonly [number, number][]) =>
      landShape(ctx, points.map(([dx, dy]) => [x + dx,y + dy]), c);
    if (landmark.kind === "mine-cart") {
      b(-13, 1, 27, 2, "#695043");
      b(-10, 0, 20, .5, "#c49a6c");
      shape("#4e393d", [[-11,-10],[-7,-13],[2,-12],[7,-10],[11,-5],[6,-1],[-6,-1],[-9,-4]]);
      shape("#92614e", [[-10,-10],[-6,-12],[3,-11],[9,-6],[6,-2],[-6,-2],[-7,-6]]);
      shape("#4b3d3d", [[-8,-10],[-5,-11],[3,-10],[7,-7],[3,-6],[-6,-7]]);
      b(-6,-10,5,1,"#956b52");
      b(-9,-6,17,1,"#d2a47a");
      for (const wheel of [-6,3]) {
        b(wheel,-3,4,4,"#423739");
        b(wheel+1,-2,2,2,"#ba8d6b");
      }
      b(0,-10,2,1,"#edaf72");
    } else {
      shape("#655044", [[-12,1],[-11,-5],[-7,-8],[-4,-13],[3,-13],[8,-8],[12,-5],[12,0],[8,2],[-8,2]]);
      shape("#95644d", [[-11,-2],[-7,-7],[-4,-12],[2,-12],[7,-8],[10,-4],[5,0],[-8,0]]);
      for (const [dx,dy] of [[-8,-2],[-5,-6],[-.5,-5],[1,-9],[4,-8],[7,-4]]) {
        shape("#d0925f", [[dx-1,dy],[dx+1.5,dy-2.5],[dx+3,dy-1],[dx+1,dy+1.5]]);
        b(dx+.5,dy-1,1.25,.5,"#ffdf9b");
      }
    }
  } else if (landmark.kind === "cabin") {
    b(-11, 0, 22, 3, "#22352a");
    b(-7, -8, 14, 9, "#634d36");
    b(-6, -7, 12, 7, "#a58153");
    b(-5, -6, 1, 7, "#c29b60");
    b(4, -5, 1, 5, "#705a3e");
    for (let j = 0; j < 7; j++)
      b(
        -4 - j,
        -15 + j,
        8 + j * 2,
        1,
        frozen
          ? j < 5
            ? "#d0e0dd"
            : "#91a6ae"
          : mire
            ? j % 2
              ? "#4f634e"
              : "#61755d"
            : j % 2
              ? "#8b664a"
              : "#9f7450",
      );
    b(-10, -8, 20, 1, "#c1a475");
    b(-2, -4, 4, 5, "#413928");
    b(3, -5, 2, 2, "#ecc981");
    b(4, -15, 2, 5, "#554c3e");
    b(3, -16, 4, 1, "#7c6b51");
    b(-9, 0, 18, 1, "#73674c");
    for (let row = 2; row < 7; row++)
      for (let tile = -row - 1; tile < row + 2; tile += 3)
        b(tile + .5 * (row % 2), -15 + row, 1.5, .5, "#d6c39a70");
    b(3.5, -5, .5, 2, "#ad7c51");
  } else if (landmark.kind === "ruins") {
    b(-12, 0, 23, 3, "#293b30");
    b(-10, -2, 20, 3, "#556756");
    b(-10, -3, 17, 1, "#84937a");
    b(-8, -13, 4, 11, "#526153");
    b(-7, -13, 2, 10, "#92a089");
    b(-9, -14, 6, 2, "#7d8b73");
    b(-8, -13, 2, 1, "#a5ac89");
    b(4, -8, 4, 7, "#647667");
    b(3, -9, 6, 1, "#8a977e");
    b(-2, -4, 5, 2, "#5f6e5f");
    b(1, -4, 2, 1, "#9da785");
    b(-10, -2, 3, 1, "#899b62");
    b(5, -1, 4, 1, "#7b955e");
    b(-7.5, -9, 3, .5, "#afb59a");
    b(-7, -6.5, 2, .5, "#46594b");
    b(4, -4.5, 3.5, .5, "#a5ad91");
  } else if (landmark.kind === "floe") {
    splitIce(ctx, x - 3, y - 4);
    splitIce(ctx, x + 4, y + 1);
  } else if (landmark.kind === "skiff") {
    drawRiverSkiff(ctx, x, y - 2);
  } else if (landmark.kind === "birdhouse") {
    b(-1.2, -14, 2.4, 14, "#57412f");
    b(-5, -22, 10, 8, "#8a6747");
    b(-6, -23, 12, 2, "#5f7d52");
    b(-5.5, -22, 11, 1, "#b08a5c");
    b(-1.6, -20, 3.2, 3.2, "#2d2620");
    b(-4, -14.5, 8, 1, "#bd925e");
    b(-2.5, -14, 1, 2, "#6b5138");
  } else if (landmark.kind === "campfire") {
    for (const [dx, s2] of [[-6, 2.5], [-2.5, 2], [1, 2.4], [4.5, 1.8]] as const) b(dx, -1, s2, 2, "#6b665d");
    b(-6, -2, 12, 1.5, "#4d3c2c");
    b(-4, -4, 8, 2, "#3b2d23");
    b(-2, -6, 4, 2, "#544033");
    b(-3, -5, 6, 1, "#7a5b3e");
  } else if (landmark.kind === "fish-trap") {
    b(-8, -3, 16, 4, "#4d4938");
    b(-6, -5, 12, 2, "#76684a");
    for (const dx of [-5, -2, 1, 4]) b(dx, -4, .6, 4, "#a58b5f");
    b(-7, -6, 2, 2, "#c4a46d");
    b(5, -6, 2, 2, "#c4a46d");
    b(-8, 1, 16, 1, "#31463e");
  } else if (landmark.kind === "drift-buoy") {
    b(-3.5, -7, 7, 7, "#7f5b43");
    b(-3.5, -5, 7, 1.2, "#c49a6c");
    b(-3.5, -2, 7, 1.2, "#5b4034");
    b(-1, -9, 2, 2, "#e7be72");
    b(3, -1, 3, 1, "#9bb9a1");
  } else if (landmark.kind === "lily-bell") {
    landShape(ctx, [[x-11,y],[x-6,y-3],[x+2,y-4],[x+9,y-2],[x+12,y+1],[x+4,y+2],[x-5,y+2]], "#3f644b");
    landShape(ctx, [[x-8,y-1],[x-3,y-3],[x+4,y-3],[x+8,y-1],[x+3,y+1],[x-3,y+1]], "#6d8f5c");
    b(-1, -8, 2, 5, "#6d9b62");
    landShape(ctx, [[x-3,y-10],[x,y-12],[x+3,y-10],[x,y-8]], "#efc9d2");
    b(-.4, -9, 1, 1, "#f8e6a2");
  } else if (landmark.kind === "rail-lantern") {
    b(-1, -20, 2, 20, "#5c4633");
    b(0, -20, 8, 1.2, "#7b5c3d");
    b(6, -20, 1, 3, "#3b3a36");
    b(5, -17, 4, 5, "#3b3a36");
    b(5.6, -16.4, 2.8, 3.8, "#f0c778");
    b(6.4, -15.8, 1.2, 2.4, "#fff1b0");
  } else if (landmark.kind === "hand-pump") {
    b(-5, -10, 10, 10, "#58555a");
    b(-4, -9, 8, 2, "#8c868d");
    b(-6, -14, 11, 2, "#44605e");
    b(-7, -16, 3, 3, "#8e5e4b");
    b(4, -7, 5, 2, "#7a747b");
    b(3, -4, 2, 4, "#3e3a41");
  } else if (landmark.kind === "ice-chime") {
    b(-1, -19, 2, 19, "#5d6f78");
    b(-7, -19, 14, 1.5, "#899ea6");
    for (const dx of [-5, -2, 2, 5]) {
      b(dx, -18, 1, 6 + (dx === -2 || dx === 2 ? 2 : 0), "#c8f0f8");
      b(dx - .7, -11, 2.4, 1, "#eefcff");
    }
    b(-2, -7, 4, 1, "#a9dce6");
  } else if (landmark.kind === "snow-lantern") {
    b(-5, -1, 10, 2, "#566c72");
    b(-4, -8, 8, 7, "#d8eef4");
    b(-2.5, -6.5, 5, 4, "#f3d58a");
    b(-4.5, -9, 9, 1.2, "#f6feff");
    b(-2, -11, 4, 2, "#b6dce6");
  } else if (landmark.kind === "bog-idol") {
    b(-6, -13, 12, 13, "#4e5749");
    b(-5, -12, 10, 3, "#66725c");
    b(-3.5, -8, 2.5, 2, "#d7f08a");
    b(1.5, -8, 2.5, 2, "#d7f08a");
    b(-4, -3, 8, 1, "#3a4438");
    b(-6, -5, 2, 5, "#6c8b59");
    b(4, -9, 2, 4, "#7f9a61");
  } else if (landmark.kind === "glow-pod") {
    landShape(ctx, [[x-7,y],[x-5,y-7],[x-1,y-10],[x+5,y-7],[x+8,y-2],[x+4,y+1],[x-4,y+1]], "#596b48");
    landShape(ctx, [[x-4,y-1],[x-3,y-6],[x,y-8],[x+4,y-6],[x+5,y-2],[x+2,y],[x-2,y]], "#7e995c");
    b(-1, -6, 2, 4, "#d8f58a");
    b(2, -4, 1.5, 2.5, "#b7dc6b");
    b(-7, -3, 3, 1.2, "#a7c96e");
  } else {
    b(-9, 1, 21, 1, mire ? "#385741" : "#3a8475");
    for (const [dx, h] of [
      [-6, 5],
      [-3, 8],
      [2, 6],
      [6, 9],
      [8, 5],
    ]) {
      b(dx, -h, 1, h + 1, mire ? "#577052" : "#5a7d4e");
      b(dx - 1, -h, 2, 2, mire ? "#7e6859" : "#a08454");
      b(dx + 1, -h / 2, 2, 1, mire ? "#768f5e" : "#9bb16c");
    }
    b(-9, -1, 4, 1, mire ? "#5e7a52" : "#77a179");
    b(9, 0, 3, 1, mire ? "#5e7a52" : "#77a179");
  }
}
