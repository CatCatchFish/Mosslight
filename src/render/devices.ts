import { deviceSweepPosition, DEVICES } from "../engine/devices.ts";
import type { DefenseGame } from "../engine/defense.ts";
import type { BattlefieldDevice, DeviceState } from "../engine/devices.ts";
import { CELL, key } from "../engine/route.ts";
import { diamond, pixelRing } from "./animation.ts";
import { box } from "./canvas.ts";

export function drawTrackSwitch(ctx: CanvasRenderingContext2D, game: DefenseGame, preview: boolean) {
  const spec = game.level.trackSwitch;
  if (!spec) return;
  const upper = game.track === "upper";
  const light = upper ? "#ffd08e" : "#a7f5df";
  if (preview) {
    const [start, ...points] = upper ? spec.lower : spec.upper;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(start[0] * CELL + 8, start[1] * CELL + 8);
    let previous = start;
    for (const point of points) {
      const [x, y] = point;
      const underground = game.level.tunnels?.some(({ from, to }) =>
        (key(...from) === key(...previous) && key(...to) === key(...point)) ||
        (key(...to) === key(...previous) && key(...from) === key(...point)));
      if (underground) ctx.moveTo(x * CELL + 8, y * CELL + 8);
      else ctx.lineTo(x * CELL + 8, y * CELL + 8);
      previous = point;
    }
    ctx.strokeStyle = "#392718cc";
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.strokeStyle = upper ? "#a7f5df" : "#fff0b9";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  const [x, y] = spec.at.map((axis) => axis * CELL + 8);
  box(ctx, x - 6, y + 4, 12, 4, "#4d352c");
  box(ctx, x - 4, y + 3, 8, 3, "#af845c");
  box(ctx, x - 1, y - 4, 2, 9, "#342a23");
  box(ctx, x - 3, y - (upper ? 7 : 4), 6, 3, light);
}

export function drawDevices(ctx: CanvasRenderingContext2D, devices: readonly DeviceState[], time: number, still: boolean, preview: number | null) {
  for (const [index, { spec, usedAt, struck }] of devices.entries()) {
    const x = spec.at[0] * CELL + 8, y = spec.at[1] * CELL + 8;
    const elapsed = time - usedAt;
    const active = elapsed < DEVICES[spec.kind].duration;
    if (index === preview && !active) drawDevicePreview(ctx, spec);
    if (spec.kind === "sun-mirror") {
      drawSunMirror(ctx, spec, x, y, elapsed, still);
    } else if (spec.kind === "mire-boom") {
      drawMireBoom(ctx, spec, x, y, elapsed, struck.size, still);
    } else if (spec.kind === "mire-beacon") {
      box(ctx, x - 6, y + 1, 12, 3, "#2c3e35");
      box(ctx, x - 2, y - 9, 4, 11, "#796447");
      box(ctx, x - 4, y - 11, 8, 7, "#2b4740");
      box(ctx, x - 2.5, y - 10, 5, 4, active ? "#ebffb7" : "#84a075");
      box(ctx, x - 5, y - 12, 10, 2, "#bfa77c");
      if (active) {
        const [cx, cy] = spec.center.map(axis => axis * CELL + 8);
        const reach = DEVICES["mire-beacon"].radius * CELL;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, reach, 0, Math.PI * 2);
        ctx.fillStyle = "#d5f79b22";
        ctx.fill();
        pixelRing(ctx, cx, cy, reach, 44, "#cbe89e", 1);
        diamond(ctx, cx, cy, 2.8, "#ebfbb4");
        if (!still) pixelRing(ctx,cx,cy,reach * (.4 + .57 * (elapsed % 1)),26,"#f5ffd269",1);
        ctx.restore();
      }
    } else if (spec.kind === "mire-backwash") {
      box(ctx, x - 9, y - 2, 18, 5, "#2e4945");
      box(ctx, x - 6, y - 10, 12, 10, "#405649");
      box(ctx, x - 6, y - 11, 12, 2, "#98a486");
      for (const dx of [-4, 0, 4]) box(ctx, x + dx - .5, y - 8, 1, 7, active ? "#aaf3d8" : "#889576");
      if (active) {
        const [cx, cy] = deviceSweepPosition(spec, elapsed).map(axis => axis * CELL + 8);
        const dx = Math.sign(spec.to[0] - spec.from[0]);
        const dy = Math.sign(spec.to[1] - spec.from[1]);
        for (let i = -8; i <= 8; i++) {
          const bow = 6 - Math.abs(i) * .65;
          box(ctx, cx + dx * bow - dy * i * 1.65, cy + dy * bow + dx * i * 1.65,
            dx ? 3.5 : 2.5, dy ? 3.5 : 2, i % 4 ? "#80c1ad" : "#c7f4ce");
          if (!still) box(ctx, cx + dx * (bow-6) - dy * i * 1.65, cy + dy * (bow-6) + dx * i * 1.65, 2, 1, "#79b59c99");
        }
      }
    } else if (spec.kind === "sluice") {
      if (active) {
        const cx = spec.center[0] * CELL + 8, cy = spec.center[1] * CELL + 8;
        const radius = DEVICES.sluice.radius * CELL;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#7be6db30";
        ctx.fill();
        pixelRing(ctx, cx, cy, radius, 32, "#b1f2d9be", 1.1);
        for (let i = 0; i < 3; i++) {
          const progress = still ? (i + 1) / 4 : (elapsed * 0.84 + i / 3) % 1;
          ctx.globalAlpha = (1 - progress) * 0.8;
          pixelRing(ctx, cx, cy, 4 + progress * (radius - 4), 18, "#def9df", 1);
        }
        ctx.globalAlpha = 1;
      }
      box(ctx, x - 8, y - 1, 16, 5, "#304b45");
      box(ctx, x - 7, y - 0.5, 14, 2, "#a58c66");
      box(ctx, x - 6, y - 8, 2, 10, "#35493f");
      box(ctx, x + 4, y - 8, 2, 10, "#35493f");
      box(ctx, x - 5, y - 3 - (active ? 3 : 0), 10, 3, active ? "#9fdfce" : "#9f986c");
    } else if (spec.kind === "log-roll") {
      // Stacked pine timber rack next to the road
      box(ctx, x - 8, y + 1, 16, 3, "#3b2c22");
      box(ctx, x - 7, y - 3, 14, 4, "#6e4e35");
      box(ctx, x - 6, y - 2.5, 12, 1.5, "#a67950");
      if (!active) {
        box(ctx, x - 6, y - 7, 12, 4, "#7a583b");
        box(ctx, x - 5, y - 6.5, 10, 1.5, "#bd9160");
        box(ctx, x + 5, y - 6.5, 1.5, 3, "#e0c492");
      }
      box(ctx, x - 7, y - 6, 1.5, 8, "#473428");
      box(ctx, x + 5.5, y - 6, 1.5, 8, "#473428");
    } else {
      box(ctx, x - 8, y, 16, 4, "#583c36");
      box(ctx, x - 7, y - 1, 14, 2, "#ab7f5d");
      box(ctx, x - 5, y - 7, 10, 6, "#81644e");
      box(ctx, x - 4, y - 5, 8, 2, "#432e31");
    }
  }
}

function drawDevicePreview(ctx: CanvasRenderingContext2D, spec: BattlefieldDevice) {
  const { radius } = DEVICES[spec.kind];
  const color = spec.kind === "sluice" || spec.kind === "mire-backwash" ? "#a5efda"
    : spec.kind === "mire-beacon" ? "#e7f4a8" : spec.kind === "sun-mirror" ? "#ffe2a3" : "#efce91";
  ctx.save();
  ctx.beginPath();
  if ("center" in spec) {
    const [x, y] = spec.center;
    ctx.arc(x * CELL + 8, y * CELL + 8, radius * CELL, 0, Math.PI * 2);
    ctx.fillStyle = color + "29";
    ctx.fill();
  } else {
    const [x, y] = spec.from, [tx, ty] = spec.to;
    ctx.moveTo(x * CELL + 8, y * CELL + 8);
    ctx.lineTo(tx * CELL + 8, ty * CELL + 8);
    ctx.strokeStyle = color + "3d";
    ctx.lineCap = "round";
    ctx.lineWidth = radius * CELL * 2;
    ctx.stroke();
    diamond(ctx, tx * CELL + 8, ty * CELL + 8, 2, color);
  }
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#26312de0";
  ctx.lineWidth = 2.7;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();
}

function drawSunMirror(
  ctx: CanvasRenderingContext2D, spec: Extract<BattlefieldDevice, { kind: "sun-mirror" }>,
  x: number, y: number, elapsed: number, still: boolean,
) {
  const { duration, radius } = DEVICES["sun-mirror"];
  const cx = spec.center[0] * CELL + 8, cy = spec.center[1] * CELL + 8;
  const reach = radius * CELL;
  const active = elapsed < duration;
  const pulse = active ? (still ? .55 : Math.max(0, 1 - elapsed / duration)) : 0;
  if (active) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, reach, 0, Math.PI * 2);
    ctx.fillStyle = "#ffda8a";
    ctx.globalAlpha = .14 + pulse * .22;
    ctx.fill();
    ctx.globalAlpha = .9;
    ctx.strokeStyle = "#fff5c2";
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.globalAlpha = .22 + pulse * .56;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(cx - 14, cy);
    ctx.lineTo(cx + 14, cy);
    ctx.closePath();
    ctx.fillStyle = "#ffe59c";
    ctx.fill();
    pixelRing(ctx, cx, cy, reach * (.55 + (1 - pulse) * .45), 29, "#fff7ce", 1.5);
    diamond(ctx, cx, cy, 2 + pulse * 4, "#fff5cc");
    ctx.restore();
  }

  box(ctx, x - 10, y + 4, 20, 4, "#394655");
  box(ctx, x - 8, y + 4, 16, 1.5, "#92adbe");
  box(ctx, x - 4, y - 5, 8, 9, "#745843");
  box(ctx, x - 2, y - 5, 4, 10, "#c18e59");
  diamond(ctx, x, y - 10, 9, "#484341");
  diamond(ctx, x, y - 10, 7.5, "#d4a668");
  diamond(ctx, x, y - 10, 5.5, active ? "#fff0ad" : "#abc4c9");
  box(ctx, x - 2.5, y - 12, 4, 2, active ? "#ffffe0" : "#e1edf1");
}

function drawMireBoom(
  ctx: CanvasRenderingContext2D,
  spec: Extract<BattlefieldDevice, { kind: "mire-boom" }>,
  x: number,
  y: number,
  elapsed: number,
  caught: number,
  still: boolean,
) {
  const { duration, cooldown, radius, capacity } = DEVICES[spec.kind];
  const cx = spec.center[0] * CELL + 8, cy = spec.center[1] * CELL + 8;
  const active = elapsed < duration;
  const ready = elapsed >= cooldown;
  const height = !active ? 0 : still ? 9 : 9 * Math.min(1, elapsed * 6, (duration - elapsed) * 5);
  if (active) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * CELL, 0, Math.PI * 2);
    ctx.fillStyle = "#ddbd7626";
    ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#23332e";
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#eed19a";
    ctx.stroke();
    ctx.restore();
  }

  // Stained timber posts and wet slats attached to the winding rope.
  for (const end of [-12, 12]) {
    const py = cy + end;
    box(ctx, cx - 4, py + 1, 8, 3, "#213331");
    box(ctx, cx - 2.5, py - 12, 5, 14, "#42352b");
    box(ctx, cx - 1.5, py - 11, 2.5, 12, "#837256");
    box(ctx, cx - 2, py - 8, 4, 1.5, "#c1a576");
    box(ctx, cx - 3, py - 13, 6, 3, ready || active ? "#ad9b6e" : "#6b745b");
  }
  box(ctx, cx - 3, cy - 11 - height, 6, 23, active ? "#513a2d" : "#35483e");
  box(ctx, cx - 2, cy - 10 - height, 1.5, 22, active ? "#bf9a64" : "#7b8d6a");
  for (let i = -9; i <= 9; i += 4.5) {
    box(ctx, cx - 3.5, cy + i - height, 7, active ? 2.5 : 1, active ? "#a58860" : "#627c65");
    if (active) box(ctx, cx - 2, cy + i - height, 2, .75, "#e2c39a");
  }
  if (active) {
    const spread = still ? .55 : (elapsed * 2.5) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - spread) * .75;
    for (const sign of [-1, 1])
      box(ctx, cx - 8 - spread * 4, cy + sign * (10 + spread * 5), 13 + spread * 8, 1.1, "#a4c9b0");
    ctx.restore();
  }

  box(ctx, x - 6, y + 3, 12, 5, "#29342e");
  box(ctx, x - 4.5, y - 6, 9, 10, "#796447");
  box(ctx, x - 5, y - 7, 10, 3, "#a58c63");
  box(ctx, x - 1, y - 8, 2, 5, active ? "#efe5bd" : "#8ea68a");
  for (let slot = 0; slot < capacity; slot++)
    box(ctx, x - 4.5 + slot * 2.5, y, 1.5, 2, active && slot < caught ? "#f0c580" : "#3c4a39");
}

export function drawDeviceCarts(ctx: CanvasRenderingContext2D, devices: readonly DeviceState[], time: number, still: boolean) {
  for (const { spec, usedAt } of devices) {
    if (spec.kind !== "rail-cart" && spec.kind !== "log-roll") continue;
    const elapsed = time - usedAt;
    if (elapsed >= DEVICES[spec.kind].duration) continue;
    const [tx, ty] = deviceSweepPosition(spec, elapsed);
    const px = tx * CELL + 8, py = ty * CELL + 8;
    const side = Math.sign(spec.to[0] - spec.from[0]) || 1;
    const spin = still ? 0 : Math.floor(elapsed * 22) % 3;
    if (spec.kind === "log-roll") {
      // Rolling pine log bouncing down the road with woodchips/dust
      const bounce = still ? 0 : Math.abs(Math.sin(elapsed * 18)) * 1.5;
      box(ctx, px - 6, py + 2, 12, 2.5, "#2b241cb0");
      box(ctx, px - 5, py - 8 - bounce, 10, 11, "#3d2a1e");
      box(ctx, px - 4, py - 7 - bounce, 8, 9, "#875f3e");
      box(ctx, px - 3, py - 6 - bounce + spin, 6, 2, "#b88959");
      box(ctx, px - 3, py - 2 - bounce + (spin % 2), 6, 1.5, "#63432b");
      box(ctx, px - 4, py - 7.5 - bounce, 8, 1.5, "#d8b482");
      if (!still) {
        box(ctx, px - side * (7 + spin), py + 1.5, 2, 1, "#d9c292b8");
        box(ctx, px - side * (11 + spin), py + 2.5, 2.5, 1, "#9c855c66");
      }
      continue;
    }
    box(ctx, px - 8, py + 1, 16, 3, "#48352fb0");
    box(ctx, px - 8, py - 7, 16, 8, "#442f32");
    box(ctx, px - 7, py - 6, 14, 5, "#b07848");
    box(ctx, px - 6.5, py - 5, 13, 1.5, "#efd08b");
    box(ctx, px - 5, py - 9, 10, 3, "#483c43");
    box(ctx, px - 4, py - 8, 8, 1.5, "#e9ab65");
    box(ctx, px + side * 7, py - 4, 1.5, 2, "#ffe2a1");
    for (const wheel of [-5, 4]) {
      box(ctx, px + wheel, py, 3, 3, "#292c35");
      box(ctx, px + wheel + spin * 0.5, py + 1, 1, 1, "#e0be8c");
    }
    if (!still) {
      box(ctx, px - side * (9 + spin), py + 1.5, 2, 0.6, "#eec37baf");
      box(ctx, px - side * (14 + spin), py + 3, 3, 1, "#a97d544e");
    }
  }
}
