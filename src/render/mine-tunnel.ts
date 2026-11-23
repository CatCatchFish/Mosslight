import { CELL } from "../engine/route.ts";
import type { MineTunnel, Point } from "../engine/types.ts";
import { box } from "./canvas.ts";
import { landShape, rockLedge } from "./landforms.ts";

function drawTunnelMouth(ctx: CanvasRenderingContext2D) {
  landShape(ctx, [[-7, 8], [-5, -3], [0, -11], [6, -14], [12, -9], [15, -3],
    [14, 7], [7, 10]], "#61463d");
  landShape(ctx, [[-4, -4], [1, -11], [6, -13], [12, -8], [9, -5], [4, -8], [0, -3]], "#a97d5c");
  landShape(ctx, [[-4, 7], [-3, -2], [1, -8], [6, -9], [10, -6], [12, 1], [10, 7]], "#342928");
  landShape(ctx, [[0, 6], [0, -2], [3, -6], [7, -6], [10, -2], [10, 5]], "#251f21");
  box(ctx, -2, -4, 1.25, 10, "#7a5947");
  box(ctx, 8, -5, 1, 9, "#654a3c");
  for (const y of [-3, 3]) {
    box(ctx, -9, y, 14, 1.25, "#4b3831");
    box(ctx, -9, y, 8, .5, "#cdb792");
    box(ctx, -1, y, 5, .5, "#765e4a");
  }
}

export function drawMineTunnel(ctx: CanvasRenderingContext2D, { from, to }: MineTunnel) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) * CELL;
  const ridge = (points: readonly Point[], color: string) =>
    landShape(ctx, points.map(([x, y]) => [x * length, y]), color);

  ctx.save();
  ctx.translate((from[0] + .5) * CELL, (from[1] + .5) * CELL);
  ctx.rotate(Math.atan2(dy, dx));

  ridge([[0, 5], [.08, -9], [.19, -15], [.28, -12], [.43, -21], [.57, -15],
    [.72, -20], [.87, -13], [.96, -7], [1.02, 6], [.94, 10],
    [.83, 7], [.72, 13], [.59, 8], [.44, 11], [.35, 8], [.19, 12], [.09, 7]], "#65483d");
  ridge([[.07, 3], [.19, -8], [.37, -11], [.57, -8], [.72, -11], [.91, -4],
    [.96, 5], [.81, 4], [.7, 9], [.55, 6], [.41, 8], [.28, 5], [.16, 9]], "#8a604a");

  // Use the same overlapping sandstone shelves as the rocks along the quarry tracks.
  for (const [x, y, size, slant] of [
    [.22, -5, .86, -.16], [.43, -7, 1.15, .19], [.65, -8, .98, -.18], [.84, -3, .84, .17],
    [.14, 5, .69, .19], [.32, 8, 1.02, -.18], [.51, 6, .86, .23], [.68, 9, 1.04, .16],
    [.88, 6, .76, -.13],
  ]) rockLedge(ctx, x * length, y, size, slant);

  drawTunnelMouth(ctx);
  ctx.translate(length, 0);
  ctx.scale(-1, 1);
  drawTunnelMouth(ctx);
  ctx.restore();
}
