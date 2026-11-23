import type { Enemy, MineTunnel, Point, Route, TrackSwitch } from "./types.ts";

export const CELL = 16;
export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
export const key = (x: number, y: number) => x + "," + y;
export const dist2 = (x: number, y: number, tx: number, ty: number) =>
  (x - tx) ** 2 + (y - ty) ** 2;
export function createRoute(points: readonly Point[], tunnels: readonly MineTunnel[] = []): Route {
  if (points.length < 2)
    throw new Error("A route requires at least two points.");
  let distance = 0;
  const segments = points.slice(1).map((end, i) => {
    const start = points[i],
      dx = end[0] - start[0],
      dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    const part = { start, dx, dy, length, from: distance };
    distance += length;
    return part;
  });
  const normals = segments.map(({ dx, dy, length }): Point => [
    -dy / length,
    dx / length,
  ]);
  const covered = tunnels.flatMap((tunnel) => segments.flatMap((segment) => {
    const offset = ([x, y]: Point) => {
      const dx = x - segment.start[0], dy = y - segment.start[1];
      return segment.dx * dy === segment.dy * dx
        ? (dx * segment.dx + dy * segment.dy) / segment.length : -1;
    };
    const first = offset(tunnel.from), last = offset(tunnel.to);
    if (first < 0 || last < 0 || first > segment.length || last > segment.length || first === last) return [];
    return [{ from: segment.from + Math.min(first, last), to: segment.from + Math.max(first, last) }];
  }));
  return {
    points,
    segments,
    distance,
    tunnels: covered,
    at(progress, lateral = 0) {
      const match = segments.findIndex(
        (segment) => progress <= segment.from + segment.length,
      );
      const index = match === -1 ? segments.length - 1 : match;
      const part = segments[index];
      const along = clamp(progress - part.from, 0, part.length);
      const t = along / part.length;
      const x = part.start[0] + part.dx * t;
      const y = part.start[1] + part.dy * t;
      if (!lateral) return { x, y };

      // Meet the neighboring lane smoothly through the turn, without changing path progress.
      const bend = Math.min(0.85, part.length / 2);
      const [nx, ny] = normals[index];
      const before = normals[index - 1] ?? normals[index];
      const after = normals[index + 1] ?? normals[index];
      const startMix = Math.max(0, 1 - along / bend) / 2;
      const endMix = Math.max(0, 1 - (part.length - along) / bend) / 2;
      return {
        x:
          x +
          lateral *
            (nx + (before[0] - nx) * startMix + (after[0] - nx) * endMix),
        y:
          y +
          lateral *
            (ny + (before[1] - ny) * startMix + (after[1] - ny) * endMix),
      };
    },
  };
}

export function isInTunnel({ route, progress }: Enemy) {
  return route.tunnels.some(({ from, to }) => progress >= from && progress < to);
}

// Positions use tile centers, like the route coordinates.
export function overTunnel({ from, to }: MineTunnel, x: number, y: number) {
  if (from[1] === to[1])
    return x >= Math.min(from[0], to[0]) && x < Math.max(from[0], to[0]) && Math.abs(y - from[1]) <= 1;
  return y >= Math.min(from[1], to[1]) && y < Math.max(from[1], to[1]) && Math.abs(x - from[0]) <= 1;
}

export function lowerTrackPoints(points: readonly Point[], { upper, lower }: TrackSwitch) {
  const start = points.findIndex((_, index) => upper.every(([x, y], offset) => {
    const point = points[index + offset];
    return point?.[0] === x && point[1] === y;
  }));
  return start < 0 ? null : [...points.slice(0, start), ...lower, ...points.slice(start + upper.length)];
}
