import { muzzleOffset } from "./turrets.ts";
import { isAirborne } from "../engine/enemy-abilities.ts";
import { QUILL_FLIGHT } from "../engine/guards.ts";
import type { GuardQuill } from "../engine/guards.ts";
import { facingFor } from "../engine/formation.ts";
import type { Facing, Heading } from "../engine/formation.ts";
import { CELL } from "../engine/route.ts";
import type { Effect, Point, Projectile, TowerId } from "../engine/types.ts";
import { box } from "./canvas.ts";
import { highQuality } from "./quality.ts";

export function linePixels(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  color: string,
  step = 1,
  pixelSize = 1,
) {
  const length = Math.hypot(tx - x, ty - y);
  const count = Math.max(1, Math.ceil(length / step));
  for (let i = 0; i <= count; i++)
    box(
      ctx,
      x + ((tx - x) * i) / count,
      y + ((ty - y) * i) / count,
      pixelSize,
      pixelSize,
      color,
    );
}
export function diamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  for (let i = -r; i <= r; i++) {
    const size = r - Math.abs(i);
    box(ctx, x - size, y + i, size * 2 + 1, 1, color);
  }
}
export function drawNetMesh(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  for (const side of [-1, 1]) {
    linePixels(ctx, x - rx, y, x, y + side * ry, color, .85, .65);
    linePixels(ctx, x, y + side * ry, x + rx, y, color, .85, .65);
    linePixels(ctx, x - rx / 2, y + side * ry / 2, x + rx / 2, y - side * ry / 2, color, .85, .65);
    box(ctx, x + side * rx - .5, y - .5, 1, 1, "#f3d5a0");
  }
}

function towerMuzzle(
  type: TowerId,
  x: number,
  y: number,
  heading: Heading,
  path: string | null,
) {
  const [dx, dy] = muzzleOffset(type, heading, path);
  return [x * CELL + 8 + dx, y * CELL + 9 + dy];
}
function impactOffset(airborne?: boolean) {
  return airborne ? -5 : 4;
}

const venomMuzzle = {
  east: [11, 2.5],
  west: [-11, 2.5],
  south: [1.5, 3.8],
  north: [1.5, -6],
} satisfies Record<Facing, readonly [number, number]>;

export function drawGuardQuill(ctx: CanvasRenderingContext2D, shot: Omit<GuardQuill, "target" | "damage">,
  time: number, reducedMotion: boolean) {
  const t = Math.max(0, Math.min(1, 1 - (shot.impactAt - time) / QUILL_FLIGHT));
  const venom = shot.enemy === "vine-viper";
  const [mx, my] = venom ? venomMuzzle[shot.facing ?? facingFor(shot.tx - shot.x, shot.ty - shot.y)] : [0, -3];
  const sx = shot.x * CELL + 8 + mx, sy = shot.y * CELL + my;
  const tx = shot.tx * CELL + 8, ty = shot.ty * CELL + 4;
  const dx = tx - sx, dy = ty - sy;
  const lift = venom ? 2.5 : reducedMotion ? 3 : 10;
  const x = sx + dx * t, y = sy + dy * t - Math.sin(Math.PI * t) * lift;
  const angle = Math.atan2(dy - Math.cos(Math.PI * t) * Math.PI * lift, dx);
  const ux = Math.cos(angle), uy = Math.sin(angle);
  pixelRing(ctx, tx, ty + 4, 2.5 + t * 2, 9, venom ? "#538a46" : "#7f535d", .75);
  if (venom) {
    if (!reducedMotion) {
      for (const distance of [3, 5.5, 8]) {
        if (t < .15 * distance / 6) continue;
        const offset = distance === 5.5 ? -.9 : .65;
        box(ctx, x - ux * distance - uy * offset, y - uy * distance + ux * offset,
          1.55, 1.2, distance < 6 ? "#a6cc66" : "#769c526e");
      }
    }
    linePixels(ctx, x - ux * 1.7, y - uy * 1.7, x, y, "#354a39", .6, 2.65);
    diamond(ctx, x, y, 1, "#d8f798");
    return;
  }
  if (!reducedMotion) linePixels(ctx, x - ux * 11, y - uy * 11, x - ux * 4, y - uy * 4, "#8ac6ddaa", 2, .85);
  linePixels(ctx, x - ux * 5, y - uy * 5, x, y, "#344d68", .75, 2);
  linePixels(ctx, x - ux * 4, y - uy * 4, x, y, "#e1f8ff", .75, 1);
}

export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  shot: Projectile,
  reducedMotion: boolean,
) {
  if (shot.age < shot.releaseDelay) return;
  const flight = shot.duration - shot.releaseDelay;
  const t = Math.min(1, (shot.age - shot.releaseDelay) / flight);
  const toX = shot.tx * CELL + 8;
  const toY = shot.ty * CELL + impactOffset(isAirborne(shot.target));
  if (shot.kind === "guard-spear") {
    const startX = shot.x * CELL + 8, startY = shot.y * CELL + 1;
    const dx = toX - startX, dy = toY - startY;
    const arc = reducedMotion ? 2 : 7;
    const x = startX + dx * t, y = startY + dy * t - Math.sin(Math.PI * t) * arc;
    const angle = Math.atan2(dy - Math.cos(Math.PI * t) * Math.PI * arc, dx);
    const ux = Math.cos(angle), uy = Math.sin(angle);
    if (!reducedMotion) {
      for (let i = 1; i <= 3; i++) {
        const p = t - i * 0.09;
        if (p < 0) break;
        box(ctx, startX + dx * p - ux * 8, startY + dy * p - Math.sin(Math.PI * p) * arc - uy * 8,
          1, 0.65, i === 1 ? "#e4d6a590" : "#e4d6a54c");
      }
    }
    linePixels(ctx, x - ux * 10, y - uy * 10, x, y, "#705746", .5, 1.1);
    linePixels(ctx, x - ux * 9, y - uy * 9 - .4, x, y - .4, shot.color, .5, .65);
    linePixels(ctx, x - ux * 2 - uy, y - uy * 2 + ux, x + ux, y + uy, "#f9f2cc", .5, 1.1);
    return;
  }
  const [fromX, fromY] = towerMuzzle(shot.kind === "net-capture" ? "net" : shot.kind, shot.x, shot.y, shot.heading, shot.path);
  const dx = toX - fromX,
    dy = toY - fromY,
    a = Math.atan2(dy, dx);
  const travel = Math.hypot(dx, dy) * t;
  const x = fromX + dx * t,
    y = fromY + dy * t;
  const b = (px: number, py: number, w: number, h: number, c: string) =>
    box(ctx, px, py, w, h, c);
  if (shot.kind === "net-capture") {
    const spread = 2.5 + t * (shot.path === "scatter" ? 6 : 4.5);
    drawNetMesh(ctx, x, y, spread, spread * .55, shot.color);
    return;
  }
  if (shot.kind === "arrow" || shot.kind === "ballista" || shot.kind === "net" || shot.kind === "glaze-lance") {
    const length = Math.min(shot.kind === "ballista" || shot.kind === "glaze-lance" ? 13 : shot.path === "sniper" ? 9 : 6, Math.max(2, travel)),
      ux = Math.cos(a),
      uy = Math.sin(a);
    const icy = shot.kind === "glaze-lance";
    if (!reducedMotion && (!icy || highQuality()) && t > 0.18) linePixels(
      ctx,
      x - ux * (length + 5),
      y - uy * (length + 5),
      x - ux * 3,
      y - uy * 3,
      icy ? "#91c8db99" : "#a97d4b99",
      2,
    );
    linePixels(ctx, x - ux * length, y - uy * length, x, y, shot.color);
    linePixels(ctx, x - ux * length, y - uy * length - .25, x, y - .25, icy ? "#eefcffcc" : "#fff1c7a6", .5, .5);
    linePixels(ctx, x - ux * 3 - uy * 2, y - uy * 3 + ux * 2, x, y, icy ? "#ffffff" : "#fff2cc");
    linePixels(ctx, x - ux * 3 + uy * 2, y - uy * 3 - ux * 2, x, y, icy ? "#ffffff" : "#fff2cc");
    if (icy && highQuality() && !reducedMotion && travel > 5) for (const side of [-1, 1]) {
      linePixels(ctx, x - ux * 6 + uy * side * 2, y - uy * 6 - ux * side * 2,
        x - ux * 2 + uy * side, y - uy * 2 - ux * side, "#c8e7ecb0", .8, .6);
    }
    return;
  }
  if (shot.kind === "spore-caster") {
    const podX = x + (1 - t) * 4;
    const podY = y - (1 - t) * 4 - Math.sin(t * Math.PI) * (reducedMotion ? 9 : 17);
    if (!reducedMotion && t > .12) {
      for (let i = 1; i <= 3; i++) {
        const trail = t - i * .065;
        if (trail < 0) continue;
        const tx = fromX + dx * trail + (1 - trail) * 4;
        const ty = fromY + dy * trail - (1 - trail) * 4 - Math.sin(trail * Math.PI) * 17;
        b(tx - .7, ty - .7, 1.4, 1.4, i === 1 ? "#b7d878aa" : "#7b9d5a66");
      }
    }
    ctx.save();
    ctx.translate(podX, podY);
    if (!reducedMotion) ctx.rotate((t - .3) * 2.2 * Math.sign(dx || 1));
    const size = shot.path === "burst-spores" ? 1.2 : shot.path === "parasitic-spores" ? .92 : 1;
    ctx.scale(size, size);
    b(-3.4, -2.4, 6.8, 5.6, "#2e3d2e");
    b(-2.6, -1.2, 5.2, 3.8, "#698650");
    b(-2.8, -3.1, 5.6, 2.2, "#a9c878");
    b(-1.6, -1.2, 1.5, 1.5, "#e0eda0");
    b(1.2, -2.1, 1.2, 1.2, "#d4e58e");
    b(-3.5, -2.8, 7, 1, "#574d35");
    ctx.restore();
    return;
  }
  if (shot.kind === "salt-caster") {
    const potX = x + (1 - t) * 6;
    const potY = y - (1 - t) * 3 - Math.sin(t * Math.PI) * (reducedMotion ? 8 : 15);
    const size = shot.path === "thick-glaze" ? 1.28 : shot.path === "salt-rain" ? .81 : 1;
    ctx.save();
    ctx.translate(potX, potY);
    if (!reducedMotion) ctx.rotate((t - .25) * 2.6 * Math.sign(dx || 1));
    ctx.scale(size, size);
    b(-3.2, -2.2, 6.4, 5.2, "#49352f");
    b(-2.3, -.6, 4.6, 3.3, "#b87555");
    b(-3.3, -3.2, 6.6, 2.4, "#f4e7bf");
    b(-1.8, -1, 1.6, 1.5, "#ebc085");
    ctx.restore();
    return;
  }
  if (shot.kind === "cannon" || shot.kind === "hail-mortar") {
    const hail = shot.kind === "hail-mortar";
    const arc = (p: number) =>
      Math.sin(Math.PI * p) * (reducedMotion ? 6 : shot.path === "blast" || shot.path === "avalanche" ? 24 : 17);
    for (let i = reducedMotion || (hail && !highQuality()) ? 2 : 5; i >= 1; i--) {
      const trail = t - i * 0.06;
      if (trail < 0) continue;
      const tx = fromX + dx * trail,
        ty = fromY + dy * trail - arc(trail);
      const size = Math.ceil(i * 0.65);
      b(
        tx - size / 2,
        ty - size / 2,
        size,
        size,
        hail ? (i < 3 ? "#bedfe7" : "#88b0c67b") : (i < 3 ? "#f2b36b" : "#cbac827b"),
      );
    }
    const py = y - arc(t);
    b(x - 2, py - 1, 5, 3, hail ? "#244359" : "#2c2c20");
    b(x - 1, py - 2, 3, 5, hail ? "#2e5570" : "#302b22");
    b(x - 1, py - 1, 2, 2, hail ? "#9ee8ff" : "#e8b371");
    b(x + 1, py - 1, 1, 1, hail ? "#ffffff" : "#fff1b0");
    b(x - .5, py + 1, 2, .5, hail ? "#5999b8" : "#896546");
    return;
  }
  if (shot.kind === "prism") {
    linePixels(ctx, fromX, fromY, x, y, shot.color, .7, 1.55);
    linePixels(ctx, fromX, fromY - .3, x, y - .3, "#f3ffdb", .72, .7);
    diamond(ctx, x, y, 1.5, "#efffe1");
    return;
  }
  if (shot.kind === "storm") {
    const turn = reducedMotion ? 0 : shot.age * 80;
    lightning(ctx, fromX, fromY, x, y, shot.color, turn);
    diamond(ctx, x, y, 2, "#fff5ff");
    return;
  }
  if (shot.kind === "ember") {
    const top = y - Math.sin(Math.PI * t) * 6;
    for (let i = 1; i <= 4; i++) {
      const age = t - i * 0.075;
      if (age < 0) break;
      b(
        fromX + dx * age,
        fromY + dy * age - Math.sin(Math.PI * age) * 6,
        1.5,
        1.5,
        i % 2 ? "#b57558" : "#e3a359",
      );
    }
    diamond(ctx, x, top, 3, shot.color);
    diamond(ctx, x, top, 1, "#fff0b2");
    b(x - dx * .045, top - dy * .045 - 1.5, .5, .5, "#ffe0a0");
    return;
  }
  // 冰晶沿射线旋转，拖出两列交错的冷光。
  const ux = Math.cos(a),
    uy = Math.sin(a);
  for (let i = 1; i <= (reducedMotion ? 2 : 6) && i * 2 <= travel; i++) {
    const angle = (reducedMotion ? 0 : t * 17) - i * 0.8;
    const offset = Math.sin(angle) * 2.7;
    const px = x - ux * i * 2 - uy * offset,
      py = y - uy * i * 2 + ux * offset;
    diamond(ctx, px, py, i <= 2 ? 1 : 0, i % 2 ? "#73c3d3" : "#d3fcf5");
  }
  diamond(ctx, x, y, 3, shot.color);
  diamond(ctx, x - 1, y - 1, 1, "#f0ffff");
  b(x + .5, y + .5, .5, 1.5, "#b9e3f9");
}
export function pixelRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  points: number,
  color: string,
  size = 1,
) {
  for (let i = 0; i < points; i++) {
    const a = (i * Math.PI * 2) / points;
    box(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, size, size, color);
  }
}
export function pixelOval(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  points: number,
  color: string,
  size = 1,
) {
  for (let i = 0; i < points; i++) {
    const a = (i * Math.PI * 2) / points;
    box(ctx, x + Math.cos(a) * rx, y + Math.sin(a) * ry, size, size, color);
  }
}
function plumeColor(enemy?: string) {
  switch (enemy) {
    case "moth": return "#d8d0bd";
    case "frost-ray": return "#bfe8f2";
    case "cinder-bat": return "#f2a66f";
    case "frost-owl": return "#c9edf2";
    case "bloat-sporer": return "#c9f070";
    case "wisp": return "#a8e6ff";
    default: return "#d9e9e4";
  }
}
function lightning(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  color: string,
  phase: number,
) {
  const dx = tx - x,
    dy = ty - y,
    len = Math.max(1, Math.hypot(dx, dy));
  const pieces = Math.max(2, Math.min(10, Math.ceil(len / 7)));
  let px = x,
    py = y;
  for (let i = 1; i <= pieces; i++) {
    const t = i / pieces,
      bend = i === pieces ? 0 : Math.sin(i * 2.9 + phase) * 2.5;
    const nx = x + dx * t - (dy / len) * bend,
      ny = y + dy * t + (dx / len) * bend;
    linePixels(ctx, px, py, nx, ny, color);
    linePixels(ctx, px + 0.25, py + 0.25, nx + 0.25, ny + 0.25, "#eee3ff", .5, .5);
    px = nx;
    py = ny;
  }
}

function drawMireTide(ctx: CanvasRenderingContext2D, points: readonly Point[], progress: number, warning: boolean, still: boolean) {
  if (points.length < 2) return;
  const pixel = ([x, y]: Point): Point => [x * CELL + 8, y * CELL + 9];
  if (warning) {
    ctx.beginPath();
    ctx.moveTo(...pixel(points[0]));
    for (const point of points.slice(1)) ctx.lineTo(...pixel(point));
    ctx.lineJoin = "round";
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#764f3290";
    ctx.stroke();
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = still ? 0 : -progress * 14;
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#f6d18f";
    ctx.stroke();
    return;
  }
  const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  const reach = lengths.reduce((sum, value) => sum + value, 0) * progress;
  let walked = 0;
  for (const [i, length] of lengths.entries()) {
    if (!length) continue;
    const at = Math.min(1, (reach - walked) / length);
    const behind = Math.max(0, (reach - walked - .9) / length);
    walked += length;
    if (at < behind) break;
    const [x, y] = pixel(points[i]);
    const [tx, ty] = pixel(points[i + 1]);
    const dx = (tx - x) / (length * CELL), dy = (ty - y) / (length * CELL);
    const headX = x + (tx - x) * at, headY = y + (ty - y) * at;
    ctx.beginPath();
    ctx.moveTo(x + (tx - x) * behind, y + (ty - y) * behind);
    ctx.lineTo(headX, headY);
    ctx.lineCap = "round";
    ctx.lineWidth = 16;
    ctx.strokeStyle = "#4a8e7fc9";
    ctx.stroke();
    if (reach > walked) continue;
    for (let j = -8; j <= 8; j++) {
      const crest = 4.3 - Math.abs(j) * .54;
      box(ctx, headX - dy * j * 1.25 + dx * crest, headY + dx * j * 1.25 + dy * crest - 1,
        j % 3 ? 2 : 3, 1.8, j % 3 ? "#a9e2c4" : "#f5ebc9");
      if (!still && j % 3 === 0) {
        box(ctx, headX - dy * j * 1.42, headY + dx * j * 1.42 - 5 - (j % 4), 1.4, 1.2, "#cfeacb");
      }
    }
    break;
  }
}

export function drawGroundEffect(ctx: CanvasRenderingContext2D, effect: Effect, reducedMotion: boolean) {
  const { kind, x, y, life, total, color, radius } = effect;
  const px = x * CELL + 8, py = y * CELL + 9;
  const t = 1 - life / total;
  ctx.save();
  if (effect.pathPoints && (kind === "mire-tide" || kind === "mire-tide-warning")) {
    drawMireTide(ctx, effect.pathPoints, t, kind === "mire-tide-warning", reducedMotion);
  } else if (kind === "salt-caster" || kind === "mire-hatch" || kind === "mire-brace") {
    const reach = (radius ?? .65) * CELL * (.20 + t * .8);
    ctx.globalAlpha *= 1 - t;
    pixelOval(ctx, px, py + 2, reach, reach * .47, 19, kind === "salt-caster" ? "#f9e9bf" : color, 1.35);
    if (kind === "salt-caster") pixelOval(ctx, px, py + 1, reach * .83, reach * .37, 11, "#fff5d7", .8);
  } else if (kind === "mire-summon") {
    const reach = (radius ?? .9) * CELL * (.24 + t * .76);
    ctx.globalAlpha *= (1 - t) * .92;
    pixelOval(ctx, px, py + 2, reach, reach * .46, 22, "#4e8a4e", 1.5);
    pixelOval(ctx, px, py + 1.5, reach * .72, reach * .32, 16, "#b4f78b", 1.1);
    for (let i = 0; i < (reducedMotion ? 4 : 7); i++) {
      const a = i * (Math.PI * 2 / (reducedMotion ? 4 : 7)) + t * .6;
      const d = reach * (.45 + (i % 2) * .25);
      const rx = px + Math.cos(a) * d;
      const ry = py + 1 + Math.sin(a) * d * .45;
      const rise = (4 + (i % 3) * 3) * Math.sin(Math.min(1, t * 1.4) * Math.PI);
      linePixels(ctx, rx, ry + 1, rx + Math.cos(a) * 2.5, ry - rise, i % 2 ? "#7d6446" : "#a8f285", 1.4, 1);
      if (i % 2 === 0) diamond(ctx, rx, ry - rise - t * 6, 1.3, "#f7ffbf");
    }
  } else if (kind === "mire-bloom") {
    const reach = (radius ?? 1) * CELL * (.24 + t * .76);
    ctx.globalAlpha *= (1 - t) * .94;
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + .2;
      const rx = px + Math.cos(a) * reach * .68;
      const ry = py + 1 + Math.sin(a) * reach * .35;
      const rise = (5 + i % 2 * 3) * Math.sin(Math.min(1, t * 1.5) * Math.PI);
      linePixels(ctx, rx, ry, rx + Math.cos(a) * 2, ry - rise, i % 2 ? "#786248" : "#c7e686", 1.5, 1);
      diamond(ctx, rx + Math.cos(a) * 2, ry - rise - t * 4, 1.7, i % 2 ? "#b8ed83" : "#f0ffc1");
    }
  } else if (kind === "spore-caster" || kind === "spore-burst") {
    const reach = (radius ?? .55) * CELL * (.18 + .82 * t);
    ctx.globalAlpha *= 1 - t;
    pixelOval(ctx, px, py + 2, reach, reach * .42, 17, "#587647", 1.2);
    pixelOval(ctx, px, py + 1, reach * .72, reach * .3, 12, "#94b966", .9);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399;
      const d = reach * (.35 + i % 3 * .2);
      box(ctx, px + Math.cos(a) * d, py + 1 + Math.sin(a) * d * .45,
        i % 2 ? 1.6 : 1, i % 2 ? 1.6 : 1, i % 3 ? "#b9d67c" : "#e1eca1");
    }
  } else if (kind === "mire-shell-warning" && effect.direction) {
    const [dx, dy] = effect.direction;
    const angle = Math.atan2(dy, dx), reach = (radius ?? 1.6) * CELL;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, reach, angle - Math.PI * .5, angle + Math.PI * .5);
    ctx.closePath();
    ctx.fillStyle = "#78516878";
    ctx.fill();
    ctx.strokeStyle = "#ecc5bd";
    ctx.lineWidth = 1.1;
    ctx.setLineDash([3, 2]);
    ctx.globalAlpha *= .56 + t * .44;
    ctx.stroke();
  } else if (kind === "mire-drag" || kind === "mire-shell") {
    const reach = (radius ?? 1) * CELL;
    const hit = effect.direction !== undefined;
    ctx.globalAlpha *= hit ? (1 - t) * .75 : .55 + t * .41;
    pixelOval(ctx, px, py + 1, hit ? reach * (.55 + .45 * t) : reach, hit ? reach * .61 : reach, 29,
      kind === "mire-drag" ? "#e4b17c" : "#e7c7df", 1.4);
  } else if (kind === "mammoth-quake") {
    const reach = (radius ?? 1.45) * CELL;
    const ease = 1 - (1 - t) ** 2;
    ctx.globalAlpha = (1 - t) * .9;
    // Twin heavy front-hoof impact craters & radial glacial ground fissures.
    for (const side of [-1, 1]) {
      ctx.fillStyle = "#2b4958";
      ctx.beginPath();
      ctx.ellipse(px + side * 6.5, py + 1, 4.2 + ease * 2.5, 2.2 + ease * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 8; i++) {
      const a = i * (Math.PI / 4) + 0.25;
      const dist = reach * (0.3 + 0.68 * ease) * (0.82 + (i % 2) * 0.16);
      linePixels(ctx, px, py + 1, px + Math.cos(a) * dist, py + 1 + Math.sin(a) * dist * 0.58,
        i % 2 ? "#7ecbe6" : "#d8f8ff", 1.5, 1.1);
    }
    pixelOval(ctx, px, py + 1, reach * (0.24 + 0.78 * ease), reach * 0.58 * (0.24 + 0.78 * ease), 28, color, 2.0);
    pixelOval(ctx, px, py + 1, reach * (0.16 + 0.6 * ease), reach * 0.58 * (0.16 + 0.6 * ease), 18, "#eefbff", 1.2);
  } else if (kind === "chief-cleave") {
    const reach = (radius ?? 0.8) * CELL;
    const ease = 1 - (1 - t) ** 2;
    ctx.globalAlpha = (1 - t) * .9;
    ctx.fillStyle = "#263f34";
    ctx.beginPath();
    ctx.ellipse(px, py + 1, reach * (.4 + .45 * ease), reach * .56 * (.4 + .45 * ease), 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = i * (Math.PI / 3) + 0.35;
      const dist = reach * (0.35 + 0.62 * ease);
      linePixels(ctx, px, py + 1, px + Math.cos(a) * dist, py + 1 + Math.sin(a) * dist * 0.56,
        i % 2 ? "#4c9c78" : "#ffce78", 1.4, 1.1);
    }
    pixelOval(ctx, px, py + 1, reach * (0.3 + 0.78 * ease), reach * 0.58 * (0.3 + 0.78 * ease), 22, "#ffce78", 1.8);
    pixelOval(ctx, px, py + 1, reach * (0.2 + 0.58 * ease), reach * 0.58 * (0.2 + 0.58 * ease), 16, "#4c9c78", 1.2);
  } else if (kind === "weir-surge") {
    const reach = (radius ?? 1.35) * CELL;
    const ease = 1 - (1 - t) ** 2;
    const rx = reach * (0.22 + 0.82 * ease);
    const ry = rx * 0.6;
    ctx.globalAlpha = (1 - t) * .32;
    ctx.fillStyle = "#4d9898";
    ctx.beginPath();
    ctx.ellipse(px, py + 1, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = (1 - t) * .92;
    pixelOval(ctx, px, py + 1, rx, ry, 26, "#d9f5d8", 1.8);
    pixelOval(ctx, px, py + 1, rx * 0.76, ry * 0.76, 18, "#6cb5b0", 1.3);
    if (t < 0.25) pixelOval(ctx, px, py + 1, 4 + 7 * t, 2.5 + 4 * t, 12, "#fff1b2", 1.1);
  } else if (kind === "tower-freeze" && radius) {
    // Sacred Winter Sovereign Frost-Nova expanding along the ground beneath all units & towers.
    const reach = radius * CELL;
    const ease = 1 - (1 - t) ** 2;
    ctx.globalAlpha = (1 - t) * 0.9;
    pixelRing(ctx, px, py, reach * (0.12 + 0.92 * ease), 32, color, 2.1);
    pixelRing(ctx, px, py, reach * (0.08 + 0.72 * ease), 20, "#fff2bd", 1.3);
    if (t < 0.28) pixelRing(ctx, px, py, 10 + 18 * (t / 0.28), 16, "#ffffff", 1.5);
  } else if (kind === "enemy-vent" || kind === "enemy-vent-stop") {
    const quenched = kind === "enemy-vent-stop";
    const driller = effect.enemy === "slag-driller";
    const reach = (radius ?? (driller ? 1.3 : 1.05)) * CELL;
    const ease = 1 - (1 - t) ** 2;
    const rx = reach * (0.28 + 0.74 * ease);
    const ry = rx * 0.58;
    ctx.globalAlpha = (1 - t) * (quenched ? .22 : .28);
    ctx.fillStyle = quenched ? "#78c4dc" : driller ? "#e86a28" : "#d98842";
    ctx.beginPath();
    ctx.ellipse(px, py + 1, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = (1 - t) * .88;
    pixelOval(ctx, px, py + 1, rx, ry, driller ? 24 : 18, quenched ? "#d9f6ff" : color, driller ? 1.7 : 1.3);
  } else if (kind === "mire-blast") {
    // Ground acid-scorch shockwave & bubbling toxic splash beneath the airborne bloat-sporer.
    const reach = (radius ?? 2.2) * CELL;
    const ease = 1 - (1 - t) ** 2;
    const rx = 5 + reach * ease;
    const ry = rx * 0.58;
    ctx.globalAlpha = (1 - t * 0.85) * .26;
    ctx.fillStyle = "#76b83c";
    ctx.beginPath();
    ctx.ellipse(px, py + 1, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1 - t * 0.85;
    pixelOval(ctx, px, py + 1, rx, ry, 26, "#ffe88a", 1.6);
    pixelOval(ctx, px, py + 1, rx * 0.68, ry * 0.68, 18, color, 1.4);
    if (!reducedMotion && t < 0.7) {
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + t * 0.6;
        const d = rx * (0.3 + (i % 3) * 0.22);
        box(ctx, px + Math.cos(a) * d, py + 1 + Math.sin(a) * d * 0.58, 2.2, 1.2, i % 2 ? "#c9f070" : "#ffae54");
      }
    }
  } else if (kind === "enemy-quill-impact" && effect.enemy === "vine-viper") {
    ctx.globalAlpha = 1 - t;
    pixelOval(ctx, px, py + 1, 2.5 + 6.5 * t, 1.5 + 3.8 * t, 12, "#93bd55", 1.1);
    box(ctx, px - 2.5 - t * 2, py, 5 + t * 4, 2, "#7ba452b0");
  }
  ctx.restore();
}

export function drawEffect(ctx: CanvasRenderingContext2D, effect: Effect, reducedMotion: boolean, showSpearGlint = true) {
  if (effect.kind === "enemy-step") return;
  if (effect.kind === "mire-tide-warning" || effect.kind === "mire-tide") return;
  const { kind, x, y, life, total, color, path, radius } = effect;
  const px = x * CELL + 8,
    py = y * CELL + 8;
  const t = 1 - life / total;
  const ramCharge = kind === "enemy-windup" && effect.enemy === "ram";
  const weirCharge = kind === "enemy-windup" && effect.enemy === "weir-turtle";
  if (kind === "pop" && t < 0.5) return;
  ctx.save();
  const hitY = y * CELL + impactOffset(effect.airborne);
  if (kind === "net-capture") {
    ctx.globalAlpha = 1 - t;
    drawNetMesh(ctx, px, hitY, 6 + t * 4, 4 + t * 2, color);
  } else if (kind === "spore-spread" && effect.pathPoints?.[0]) {
    const [from, to] = effect.pathPoints;
    const fx = from[0] * CELL + 8, fy = from[1] * CELL + 5;
    const tx = to[0] * CELL + 8, ty = to[1] * CELL + 5;
    ctx.globalAlpha = Math.sin(t * Math.PI) * .9;
    for (let i = 0; i <= 10; i++) {
      const p = i / 10;
      if (p > t * 1.25) continue;
      const x = fx + (tx - fx) * p, y = fy + (ty - fy) * p - Math.sin(p * Math.PI) * 7;
      box(ctx, x - .7, y - .7, i % 3 ? 1.2 : 1.8, i % 3 ? 1.2 : 1.8,
        i % 3 ? "#8fb760" : "#d9ec95");
    }
    diamond(ctx, fx + (tx - fx) * t, fy + (ty - fy) * t - Math.sin(t * Math.PI) * 7, 1.4, "#edf5bb");
  } else if (kind === "spore-caster" || kind === "spore-burst") {
    ctx.globalAlpha = 1 - t;
    if (t < .3) diamond(ctx, px, hitY - 2, kind === "spore-burst" ? 3 : 2, "#e1edac");
    const reach = kind === "spore-burst" ? (radius ?? 1.35) * CELL : 9;
    for (let i = 0; i < (reducedMotion ? 4 : 9); i++) {
      const a = i * 2.399 + t;
      const d = reach * (.2 + .8 * t) * (.55 + i % 3 * .18);
      const x = px + Math.cos(a) * d, y = hitY + Math.sin(a) * d * .55 - Math.sin(t * Math.PI) * (4 + i % 3 * 3);
      box(ctx, x, y, i % 2 ? 1.8 : 1.2, i % 2 ? 1.8 : 1.2,
        i % 3 ? "#a9ca70" : "#e4efb0");
    }
  } else if (kind === "guard-strike" || kind === "guard-spear" || kind === "arrow" || kind === "ballista" || kind === "net") {
    const [dx, dy] = effect.direction ?? [1, 0];
    const angle = Math.atan2(dy, dx);
    const heavy = kind === "ballista";
    const reach = (heavy ? 10 : 6) * t;
    ctx.globalAlpha = 1 - t;
    if (!reducedMotion && t < .36) diamond(ctx, px, hitY, heavy ? 2 : 1, "#fff4ce");
    if (kind === "guard-spear" && showSpearGlint && !reducedMotion && t < .36) {
      box(ctx, px - 1.75, hitY, 3.5, .75, "#fff9df");
      box(ctx, px, hitY - 1.5, .75, 3, "#fff9df");
    }
    for (let i = -2; i <= 2; i++) {
      const fan = angle + i * 0.33;
      const length = 1.5 + reach * (1 - Math.abs(i) * 0.12);
      const ux = Math.cos(fan), uy = Math.sin(fan);
      linePixels(ctx, px + ux * length, hitY + uy * length,
        px + ux * (length + 2), hitY + uy * (length + 2), color, 0.6, i === 0 ? 1.1 : 0.75);
    }
  } else if (kind === "guard-hit") {
    ctx.globalAlpha = 1 - t;
    const width = 2 + 2 * t;
    if (effect.melee === "air-strike") {
      // Air duel: claw streaks and scattered feathers at the intercepted flier's altitude.
      const side = (effect.direction?.[0] ?? 1) >= 0 ? 1 : -1;
      const reach = 3.5 + 4.5 * t;
      linePixels(ctx, px - side * 2, hitY - 7, px + side * reach, hitY - 1, "#fff4cf", .8, 1.25);
      linePixels(ctx, px - side * 4, hitY - 3, px + side * (reach - 1), hitY + 2, color, .75, .9);
      diamond(ctx, px + side * reach, hitY - 2, 1.6, "#ffffff");
      for (let i = 0; i < 4; i++) {
        const fx = px + side * (i - 1.5) * 2.5 + Math.sin(t * 5 + i) * 2;
        const fy = hitY - 5 - t * (5 + i) + i % 2;
        box(ctx, fx, fy, 1.5, .8, i % 2 ? "#e9f4ee" : plumeColor(effect.enemy));
      }
    } else if (effect.airborne) {
      const side = (effect.direction?.[0] ?? 1) >= 0 ? 1 : -1;
      linePixels(ctx, px - side * width, hitY - 5, px + side * width, hitY - 2, color);
      diamond(ctx, px + side * width, hitY - 2, 1, "#fff1bc");
    } else if (effect.melee === "claw") {
      const side = (effect.direction?.[0] ?? 1) >= 0 ? 1 : -1;
      linePixels(ctx, px - side * width, py - 7, px + side * width, py - 3, color);
      linePixels(ctx, px - side * (width - 1), py - 9, px + side * (width + 1), py - 5, "#fff1bc");
    } else if (effect.melee === "stomp" || effect.melee === "surge" || effect.melee === "quake") {
      pixelRing(ctx, px, py + 1, 2 + 6 * t, 7, color, 1.5);
      box(ctx, px - 1, py - 4 - 6 * t, 2, 2, color);
    } else diamond(ctx, px, py - 6, t < 0.4 ? 2 : 1, color);
  } else if (kind === "mammoth-quake") {
    // Rising glacial ice spires & snow chunks erupting upward from the mammoth's front hooves.
    const reach = (radius ?? 1.45) * CELL;
    ctx.globalAlpha = 1 - t;
    if (t < 0.26) {
      diamond(ctx, px - 6, py - 2, 3.0 * (1 - t / 0.26), "#ffffff");
      diamond(ctx, px + 6, py - 2, 3.0 * (1 - t / 0.26), "#fff5c4");
    }
    for (let i = 0; i < 14; i++) {
      const a = i * (Math.PI * 2 / 14) + 0.2;
      const spread = reach * (0.22 + 0.74 * t) * (0.78 + (i % 3) * 0.12);
      const lift = reducedMotion ? 3 : Math.sin(t * Math.PI) * (6 + (i % 4) * 3.2);
      const sx = px + Math.cos(a) * spread;
      const sy = py + Math.sin(a) * spread * 0.58 - lift;
      if (i % 3 === 0) {
        // Jagged glacial ice shard
        box(ctx, sx - 0.8, sy - 3, 1.6, 4.2, "#dff9ff");
        diamond(ctx, sx, sy - 3.5, 1.2, "#ffffff");
      } else {
        box(ctx, sx - 1.2, sy - 1, 2.5, 1.8, i % 2 ? "#7ecbe6" : "#56748c");
      }
    }
  } else if (kind === "antler-sweep") {
    // Sacred Winter Sovereign double-crescent antler slash (glacial ice + royal gold filigree).
    const reach = (radius ?? .9) * CELL;
    const [dx, dy] = effect.direction ?? [1, 0];
    const angle = Math.atan2(dy, dx);
    const spread = reach * (.7 + .38 * t);
    const inner = spread * .72;
    const slashY = py - 5 - 4 * (1 - t);
    ctx.globalAlpha = 1 - t;
    for (let step = 0; step < 10; step++) {
      const a = angle - 1.5 + step * .3;
      const b = a + .3;
      linePixels(ctx, px + Math.cos(a) * spread, slashY + Math.sin(a) * spread * .62,
        px + Math.cos(b) * spread, slashY + Math.sin(b) * spread * .62,
        step % 3 ? color : "#f0ffff", .65, step > 2 && step < 7 ? 2.2 : 1.1);
      if (step >= 1 && step <= 8) {
        linePixels(ctx, px + Math.cos(a) * inner, slashY + 1 + Math.sin(a) * inner * .62,
          px + Math.cos(b) * inner, slashY + 1 + Math.sin(b) * inner * .62,
          "#fff0b2", .75, 1);
      }
    }
    for (let i = 0; i < 9; i++) {
      const a = angle - 1.4 + i * .35;
      const distance = reach * (.38 + t) * (0.85 + i % 3 * .15);
      diamond(ctx, px + Math.cos(a) * distance, py - 2 + Math.sin(a) * distance * .62 - t * (4 + i % 4),
        i % 3 === 0 ? 1.8 : 1.1, i % 3 === 0 ? "#fff4bd" : i % 2 ? color : "#ecffff");
    }
  } else if (kind === "tower-freeze") {
    if (radius) {
      // Rising golden-ice starlight motes swirling above the ground nova ring.
      const reach = radius * CELL;
      const ease = 1 - (1 - t) ** 2;
      ctx.globalAlpha = (1 - t) * 0.92;
      if (t < 0.28) diamond(ctx, px, py - 10, 3.8 * (1 - t / 0.28), "#ffffff");
      for (let i = 0; i < 16; i++) {
        const a = i * (Math.PI * 2 / 16) + 0.15 + t * 0.35;
        const dist = reach * (0.14 + 0.86 * ease) * (0.86 + (i % 3) * 0.08);
        const lift = reducedMotion ? 3 : Math.sin(t * Math.PI) * (5 + (i % 4) * 2.5);
        const sx = px + Math.cos(a) * dist;
        const sy = py + Math.sin(a) * dist * 0.88 - lift;
        if (i % 4 === 0) diamond(ctx, sx, sy, 2.0, "#fff4bd");
        else if (i % 2 === 0) diamond(ctx, sx, sy, 1.7, "#ebfeff");
        else box(ctx, sx - 1.2, sy - 1, 2.4, 1.4, "#8be3f7");
      }
    } else {
      // Per-tower ground-up frost crystallization burst (no beam/laser)
      ctx.globalAlpha = 1 - t;
      pixelRing(ctx, px, py + 1, 5 + 12 * t, 18, color, 1.6);
      pixelRing(ctx, px, py + 1, 3 + 8 * t, 12, "#f0fdff", 1.1);
      for (let i = 0; i < 8; i++) {
        const a = i * (Math.PI / 4) + 0.2;
        const rSpread = 4 + 8 * t;
        const rise = reducedMotion ? 8 : (6 + (i % 3) * 5) * Math.sin(Math.min(1, t * 1.4) * Math.PI * 0.65);
        const sx = px + Math.cos(a) * rSpread;
        const sy = py - 2 - rise + Math.sin(a) * 3;
        if (i % 2 === 0) diamond(ctx, sx, sy, 1.65, "#f2ffff");
        else box(ctx, sx - 1, sy - 2, 2, 3.5, "#7edbf2");
      }
    }
  } else if (kind === "tower-crack") {
    // Crisp tactile ice-chip burst when tapping a frozen tower
    ctx.globalAlpha = 1 - t;
    if (t < 0.25) {
      diamond(ctx, px, py - 11, 3.4 * (1 - t / 0.25), "#ffffff");
      pixelRing(ctx, px, py - 9, 4 + 7 * (t / 0.25), 10, "#e8fdff", 1.1);
    }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.85 + i * 0.42 + (i % 2) * 0.15;
      const speed = 6 + (i % 3) * 3.5;
      const sx = px + Math.cos(a) * speed * t;
      const sy = py - 11 + Math.sin(a) * speed * t + t * t * 14;
      if (i % 2 === 0) diamond(ctx, sx, sy, 1.45, "#f2ffff");
      else box(ctx, sx - 1.1, sy - 0.9, 2.2, 1.8, i % 3 === 0 ? "#8ce4f8" : "#c8f5ff");
    }
  } else if (kind === "tower-thaw") {
    // Dramatic full glacier-shell shatter + warm golden-white tower wake-up shimmer
    ctx.globalAlpha = 1 - t;
    if (t < 0.22) {
      const flash = 1 - t / 0.22;
      diamond(ctx, px, py - 11, 5.2 * flash, "#ffffff");
      pixelRing(ctx, px, py - 4, 7 + 14 * (t / 0.22), 18, "#fff4bd", 1.6);
    }
    pixelRing(ctx, px, py + 1, 6 + 15 * t, 20, "#b9f4ff", 1.5);
    // 12 sculpted tumbling ice chunks bursting outward & falling with gravity
    for (let i = 0; i < 12; i++) {
      const a = i * (Math.PI * 2 / 12) + 0.18;
      const spread = (8 + (i % 4) * 3.5) * t;
      const launchY = -(6 + (i % 3) * 5) * t;
      const gravity = t * t * 20;
      const sx = px + Math.cos(a) * spread;
      const sy = py - 10 + Math.sin(a) * spread * 0.55 + launchY + gravity;
      if (i % 3 === 0) diamond(ctx, sx, sy, 1.9, "#ffffff");
      else box(ctx, sx - 1.4, sy - 1.2, i % 2 ? 2.8 : 2.1, i % 2 ? 2.2 : 2.6, i % 2 ? "#8fe4f7" : "#4ea5cc");
    }
    // Rising warm golden-white thaw motes as the tower restores power
    for (let i = 0; i < 6; i++) {
      const mx = px + (i - 2.5) * 3.8 + Math.sin(t * 6 + i) * 1.5;
      const my = py - 3 - t * (16 + (i % 3) * 5);
      ctx.globalAlpha = Math.sin(t * Math.PI) * 0.9;
      diamond(ctx, mx, my, i % 2 === 0 ? 1.4 : 1.0, i % 2 === 0 ? "#fff3ba" : "#ffffff");
    }
  } else if (kind === "chief-cleave") {
    // Moss-stone rubble, copper sparks & jade-amber crystal shards bursting from the hammer impact.
    const reach = (radius ?? 0.8) * CELL;
    ctx.globalAlpha = 1 - t;
    if (t < 0.25) {
      diamond(ctx, px, py - 3, 3.6 * (1 - t / 0.25), "#fff1ac");
      diamond(ctx, px, py - 3, 2.0 * (1 - t / 0.25), "#6cc79d");
    }
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4;
      const spread = reach * (0.26 + 0.92 * t) * (0.75 + i % 3 * 0.12);
      const lift = reducedMotion ? 3 : Math.sin(t * Math.PI) * (5 + i % 4 * 2.8);
      const sx = px + Math.cos(a) * spread;
      const sy = py + Math.sin(a) * spread * 0.58 - lift;
      if (i % 4 === 0) diamond(ctx, sx, sy, 1.5, i % 8 === 0 ? "#ffce78" : "#6cc79d");
      else box(ctx, sx, sy, 2.2, 1.55, i % 3 === 1 ? "#72945b" : i % 3 === 2 ? "#405747" : "#9c875a");
    }
  } else if (kind === "rail-impact") {
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 6; i++) {
      const spread = (i - 2.5) * (1.5 + t * 3);
      const lift = (3 + i % 3) * Math.sin(t * Math.PI);
      linePixels(ctx, px + spread, py - lift, px + spread + 1.5, py - lift - 2, i % 2 ? color : "#f4a961", 0.7);
    }
  } else if (kind === "weir-surge") {
    // Leaping river-water spray, foam crests & reed-jade mist arcing off the ground tidal ring.
    ctx.globalAlpha = 1 - t;
    const spread = (radius ?? 1.35) * CELL * (0.24 + 0.78 * t);
    for (let i = 0; i < 18; i++) {
      const a = i * (Math.PI * 2 / 18) + 0.15;
      const lift = reducedMotion ? 3 : Math.sin(t * Math.PI) * (4.5 + (i % 4) * 2.2);
      const dx = Math.cos(a) * spread, dy = Math.sin(a) * spread * 0.6;
      box(ctx, px + dx, py + dy - lift, 2 + i % 2, 1.4, i % 3 === 0 ? "#f0fff2" : i % 2 ? "#c7ebd0" : color);
    }
  } else if (weirCharge) {
    ctx.globalAlpha = 1 - t;
    // Shell plates brace shut with two side brackets, rather than a glowing halo.
    const spread = 8 + 8 * t;
    linePixels(ctx, px - spread, py - 11, px - spread * .62, py + 2, "#e8a36f", 1);
    linePixels(ctx, px + spread, py - 11, px + spread * .62, py + 2, "#e8a36f", 1);
    for (const s of [-1, 1]) {
      box(ctx, px + s * spread * .8 - 1, py - 8 - 4 * t, 2.4, 3.2, "#f4cf7e");
      box(ctx, px + s * spread * .6 - 1, py - 2 + 2 * t, 2.2, 2.6, "#b98a5c");
    }
    diamond(ctx, px, py - 8, 1.2 + t * .6, "#fff1b2");
  } else if (kind === "enemy-rally" || kind === "enemy-ward") {
    ctx.globalAlpha = 1 - t;
    const spread = 5 + t * (radius ?? 0) * CELL;
    if (kind === "enemy-rally") {
      // Rising war-cry chevrons instead of a ring.
      for (let i = 0; i < 3; i++) {
        const lift = 7 + (t + i * .12) * 13;
        const wx = px + (i - 1) * 4.2;
        linePixels(ctx, wx - 3, py - lift, wx, py - lift - 3, color, .8);
        linePixels(ctx, wx, py - lift - 3, wx + 3, py - lift, color, .8);
        if (i === 1) box(ctx, wx - .5, py - lift + 1, 1, 3, color);
      }
    } else {
      // A soft canopy dome over nearby allies, with a broken rim and rising motes.
      for (let i = 0; i <= 16; i++) {
        if (i % 4 === 3) continue;
        const a = Math.PI + i * (Math.PI / 16);
        box(ctx, px + Math.cos(a) * spread, py + 1 + Math.sin(a) * spread * .55,
          1.6, 1.1, i % 3 === 0 ? "#ffffff" : color);
      }
      for (let i = 0; i < 4; i++) {
        const mt = (t + i * .18) % 1;
        ctx.globalAlpha = (1 - mt) * .7;
        diamond(ctx, px + (i - 1.5) * spread * .38, py + 1 - mt * 10, .9, color);
      }
    }
  } else if (kind === "enemy-splash") {
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const lift = Math.sin(t * Math.PI) * (2 + i % 3);
      box(ctx, px + Math.cos(angle) * (3 + t * 8), py + Math.sin(angle) * (2 + t * 4) - lift,
        1 + i % 2, 1, i % 2 ? color : "#e4f4ba");
    }
  } else if (kind === "enemy-quill-launch" || kind === "enemy-quill-impact") {
    if (effect.enemy === "vine-viper") {
      // Spitting cobra venom cone from its hood muzzle / toxic droplet splash on impact.
      const launching = kind === "enemy-quill-launch";
      const facing = facingFor(...(effect.direction ?? [1, 0]));
      const [mx, my] = launching ? venomMuzzle[facing] : [0, hitY - y * CELL];
      const sx = px + mx, sy = y * CELL + my;
      const bearing = facing === "west" ? Math.PI : facing === "south" ? Math.PI / 2 : facing === "north" ? -Math.PI / 2 : 0;
      ctx.globalAlpha = 1 - t;
      for (let i = 0; i < 8; i++) {
        const angle = launching ? bearing + (i - 3.5) * .22 : i * 2.4;
        const reach = 1.6 + t * (4.5 + i % 3 * 2.4);
        diamond(ctx, sx + Math.cos(angle) * reach, sy + Math.sin(angle) * reach - (launching ? 0 : 4 * Math.sin(Math.PI * t)),
          i % 3 ? .85 : 1.35, i % 2 ? "#d8ff8a" : "#81ac53");
      }
      ctx.restore();
      return;
    }
    // Frost porcupine: barbed glacial quills fanning from its dorsal spine / ice shatter on impact.
    const origin = kind === "enemy-quill-launch" ? py - 11 : hitY;
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 7; i++) {
      const angle = i * (Math.PI * 2 / 7) + 0.3;
      const spread = 2 + 8 * t;
      const sx = px + Math.cos(angle) * spread;
      const sy = origin + Math.sin(angle) * spread * 0.75;
      linePixels(ctx, sx, sy, sx + Math.cos(angle) * 2.5, sy + Math.sin(angle) * 2.5, i % 2 ? color : "#f3fdff");
      if (i % 2 === 0) diamond(ctx, sx, sy, 0.9, "#dff9ff");
    }
  } else if (kind === "enemy-vent" || kind === "enemy-vent-stop") {
    const quenched = kind === "enemy-vent-stop";
    const driller = effect.enemy === "slag-driller";
    const reach = (radius ?? (driller ? 1.3 : 1.05)) * CELL;
    ctx.globalAlpha = 1 - t;
    const count = driller ? 12 : 8;
    for (let i = 0; i < count; i++) {
      const angle = i * (Math.PI * 2 / count) + 0.2;
      const spread = reach * (0.2 + 0.72 * t) * (0.8 + (i % 3) * 0.12);
      const lift = reducedMotion ? 3 : Math.sin(t * Math.PI) * (quenched ? 9 : driller ? 8 + (i % 4) * 2.5 : 4 + (i % 4) * 1.4);
      const sx = px + Math.cos(angle) * spread;
      const sy = py - (driller ? 4 : 1) + Math.sin(angle) * spread * 0.56 - lift;
      if (!quenched && driller && i % 3 === 0) {
        diamond(ctx, sx, sy - 2, 1.5, "#ffe49e");
      } else {
        box(ctx, sx, sy, (driller ? 2.8 : 2) + i % 2, driller ? 1.8 : 1.3,
          quenched ? (i % 2 ? "#e5f8ff" : "#8fd6ec") : (i % 3 ? color : "#ffdfaa"));
      }
    }
    if (driller && !quenched && t < 0.3) {
      for (const side of [-1, 1]) diamond(ctx, px + side * 8, py - 12 - t * 14, 2.4 * (1 - t / 0.3), "#fff0b5");
    }
  } else if (kind === "enemy-burrow-in" || kind === "enemy-burrow-out") {
    const emerging = kind === "enemy-burrow-out";
    const swampMud = effect.enemy === "mire-croc";
    ctx.globalAlpha = 1 - t;
    box(ctx, px - 6, py, 12, 4, swampMud ? "#293b2d" : "#3e2a22");
    box(ctx, px - 5, py + 3, 10, 1.5, swampMud ? "#5f8252" : "#a8744d");
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4;
      const spread = reducedMotion ? 6 : 3 + t * (8 + i % 3);
      const lift = Math.sin(t * Math.PI) * (emerging ? 6 + i : 3 + i / 2);
      box(ctx, px + Math.cos(angle) * spread, py + Math.sin(angle) * spread * 0.55 - lift,
        2 + i % 2, 1.5 + i % 2, i % 3 ? color : swampMud ? "#3f583d" : "#805839");
    }
  } else if (kind === "mire-blast") {
    // Airborne bloat-sporer gas sac rupture at floating elevation (ground scorch is on ground layer).
    const blastY = py - 11;
    const r = 4 + t * ((radius ?? 2.2) * CELL * 0.78);
    ctx.globalAlpha = 1 - t * 0.85;
    if (t < 0.36) {
      const flash = 1 - t / 0.36;
      diamond(ctx, px, blastY, 5.5 * flash, "#ffae54");
      diamond(ctx, px, blastY, 3.2 * flash, "#fff6be");
    }
    pixelRing(ctx, px, blastY, r * 0.72, 18, color, 1.5);
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39996 + (reducedMotion ? 0 : t * 1.4);
      const dist = r * (0.24 + (i % 4) * 0.22);
      const xx = px + Math.cos(a) * dist;
      const drop = i % 3 === 2 ? t * t * 14 : -t * 7;
      const yy = blastY + Math.sin(a) * dist * 0.65 + drop;
      if (i % 4 === 0) {
        diamond(ctx, xx, yy, 1.6, "#ffe89a");
      } else {
        box(ctx, xx, yy, i % 2 ? 2.4 : 1.6, i % 2 ? 2.4 : 1.6,
          i % 3 === 1 ? color : "#ff9b48");
      }
    }
  } else if (ramCharge || kind === "enemy-dust" || kind === "enemy-needles" || kind === "shell-break") {
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.39996;
      const distance = 2 + t * (5 + i * 1.4);
      const px2 = px + Math.cos(angle) * distance;
      const py2 = py + Math.sin(angle) * distance * 0.55 - Math.sin(t * Math.PI) * (3 + i * 0.8);
      if (kind === "enemy-needles") linePixels(ctx, px2, py2, px2 + 2, py2 - 1, color);
      else if (kind === "shell-break") diamond(ctx, px2, py2 - 3, i % 2 ? 2 : 1, color);
      else if (ramCharge) box(ctx, px2, py2 + 3, 2 + i % 2, 1 + i % 2, i % 2 ? "#effaf6" : color);
      else box(ctx, px2, py2, 2 + i % 2, 1 + i % 2, color);
    }
  } else if (kind === "prism") {
    ctx.globalAlpha = 1 - t;
    diamond(ctx, px, hitY, 2, "#f3ffe5");
    if (radius) pixelRing(ctx, px, hitY, 3 + t * radius * CELL, 14, color, 1.1);
    for (const [[sx, sy, from], [tx, ty, to]] of effect.arcs ?? []) {
      linePixels(ctx, sx * CELL + 8, sy * CELL + impactOffset(from),
        tx * CELL + 8, ty * CELL + impactOffset(to), color, .72, 1.25);
    }
  } else if (kind === "storm" || kind === "glaze-lance") {
    ctx.globalAlpha = 1 - t * 0.92;
    for (const [[sx, sy, from], [tx, ty, to]] of effect.arcs ?? []) {
      const aX = sx * CELL + 8, aY = sy * CELL + impactOffset(from);
      const bX = tx * CELL + 8, bY = ty * CELL + impactOffset(to);
      lightning(
        ctx,
        aX, aY, bX, bY,
        color,
        reducedMotion ? 0 : t * 10,
      );
    }
    pixelRing(ctx, px, py, 3 + t * (radius ? radius * CELL : 8), 13, color, 1);
    diamond(ctx, px, hitY, 2, kind === "glaze-lance" ? "#eefcff" : "#f5e3ff");
  } else if (kind === "salt-caster" || kind === "mire-tide-break" || kind === "mire-hatch" || kind === "mire-bloom-burst" ||
      ((kind === "mire-shell" || kind === "mire-drag") && effect.direction)) {
    const [dx, dy] = effect.direction ?? [0, 0];
    const reach = (radius ?? (kind === "mire-tide-break" ? 1.6 : .8)) * CELL;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < (reducedMotion ? 4 : 8); i++) {
      const angle = i * 2.399;
      const dist = reach * (.2 + .8 * t) * (.50 + i % 3 * .17);
      const shardX = px + Math.cos(angle) * dist + dx * t * 4;
      const shardY = py + Math.sin(angle) * dist * .55 - 7 * Math.sin(t * Math.PI) + dy * t * 3;
      const shard = kind === "mire-tide-break" ? (i % 2 ? "#676b50" : "#ad9366")
        : kind === "mire-bloom-burst" ? (i % 2 ? "#8fa34d" : "#e0f7a0")
        : kind === "salt-caster" ? (i % 2 ? "#bd8062" : "#fff1cf") : (i % 2 ? color : "#f2e0c5");
      box(ctx, shardX, shardY, i % 2 ? 3 : 2, 1.5, shard);
    }
    ctx.restore();
  } else if (kind === "hail-mortar") {
    ctx.globalAlpha = 1 - t * 0.85;
    const r = 4 + t * (radius ? radius * CELL : 16);
    pixelRing(ctx, px, hitY, r, 16, "#b4d9e5", 1.25);
    if (highQuality() && !reducedMotion) for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + t;
      const dx = Math.cos(a), dy = Math.sin(a);
      const x = px + dx * r * .7, y = hitY + dy * r * .55 - (1 - t) * 6;
      linePixels(ctx, x - dx * 1.25, y - dy * 1.5, x, y - 1.5, i % 2 ? "#e2eef0" : "#8bb6cb", .6, 1);
      box(ctx, x, y, .75, .75, "#ecf6f6");
    }
  } else if (kind === "ember") {
    ctx.globalAlpha = 1 - t * 0.86;
    const r = 3 + t * (radius ? radius * CELL : 9);
    if (t < 0.35) diamond(ctx, px, hitY, 2, "#ffe4ad");
    pixelRing(ctx, px, hitY, r, 12, "#df8a58");
    for (let i = 0; i < 6; i++) {
      const a = i * 2.3999;
      diamond(
        ctx,
        px + Math.cos(a) * r,
        hitY + Math.sin(a) * r - t * 7,
        1,
        i % 2 ? "#e09a57" : "#ffe3a1",
      );
    }
  } else if (kind === "cannon") {
    const r = 3 + t * ((radius ?? 1) * CELL * 0.78);
    ctx.globalAlpha = 1 - t * 0.84;
    pixelRing(ctx, px, py, r, 18, path === "quake" ? "#e2cc92" : "#d69a6a", 2);
    pixelRing(ctx, px, py, r * 0.58, 10, "#eedd92", 2);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.39996,
        d = r * (0.38 + (i % 4) * 0.15);
      const xx = px + Math.cos(a) * d,
        yy = py + Math.sin(a) * d - t * 7;
      box(
        ctx,
        xx,
        yy,
        t < 0.32 ? 3 : 2,
        t < 0.32 ? 3 : 2,
        i % 2 ? "#ffb65f" : "#7d6956",
      );
    }
    if (t < 0.27) {
      diamond(ctx, px, hitY, 5, "#e78a4e");
      diamond(ctx, px, hitY, 3, "#fff1b3");
    }
  } else if (kind === "frost") {
    const r = 3 + t * (radius ? radius * CELL * 0.82 : 10);
    ctx.globalAlpha = 1 - t * 0.9;
    pixelRing(ctx, px, py, r, 16, color);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + t * 0.55,
        xx = px + Math.cos(a) * r,
        yy = py + Math.sin(a) * r;
      diamond(ctx, xx, yy, t < 0.55 ? 2 : 1, i % 2 ? "#dfedff" : color);
    }
    if (t < 0.28) diamond(ctx, px, hitY, 3, "#ecffff");
  } else {
    const r = 3 + t * (kind === "gate" ? 13 : 9);
    ctx.globalAlpha = 1 - t * 0.86;
    pixelRing(ctx, px, py, r, kind === "build" ? 8 : 6, color, t < 0.5 ? 2 : 1);
  }
  ctx.restore();
}
