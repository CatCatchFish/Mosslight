import type { Facing } from "../engine/formation.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export type ChiefPose = "march" | "raise" | "strike" | "recover";

export function paintChief(r: Rect, p: Shape, frame: number, facing: Facing, exposed: boolean, pose: ChiefPose) {
  const side = facing === "east" || facing === "west", rear = facing === "north";
  const ink = "#192c29", stone = "#405747", bark = "#5c503b", copper = "#9c875a";
  const moss = "#72945b", jade = "#4c9c78", rim = "#b7d891";
  const hot = "#ffce78", bright = "#fff1ac";
  const shift = [0, -1, 0, 1][frame];
  const lean = pose === "strike" ? 3 : pose === "raise" ? -1 : shift;
  const head = side ? 8 : 0;

  // Roots and hanging moss keep the heavy body tied to the forest floor.
  for (const [x, step] of [[-15, shift], [3, -shift], [-5, -shift], [13, shift]]) {
    p(ink, [x-4,-10], [x+4,-11], [x+7+step,-2], [x+5+step,3], [x-5+step,3], [x-6,-2]);
    p(bark, [x-2,-9], [x+3,-9], [x+5+step,-1], [x+3+step,1], [x-4+step,1], [x-4,-3]);
    r(x - 2 + step, -1, 4, 1, copper);
  }
  p(ink, [-27,-15],[-25,-28],[-20,-37],[-13,-41],
    [10,-41],[20,-36],[25,-27],[25,-16],[19,-9],[11,-5],[-9,-5],[-20,-9]);
  p(stone, [-25,-16],[-22,-28],[-18,-36],[-10,-39],[10,-39],[19,-34],[23,-26],[22,-17],[16,-11],[8,-7],[-8,-7],[-18,-11]);
  p("#536d52", [-24,-22],[-21,-31],[-16,-36],[-10,-35],[-12,-24],[-18,-18]);
  p("#536d52", [12,-35],[18,-34],[22,-28],[22,-22],[17,-18],[11,-24]);
  p("#344736", [-25,-22],[-18,-24],[-15,-22],[-18,-19],[-19,-14],[-23,-16]);
  p("#344736", [22,-23],[16,-24],[13,-23],[16,-19],[17,-13],[21,-17]);
  for (const [x,y] of [[-23,-27],[-19,-33],[-15,-32],[15,-32],[19,-29],[-21,-14],[18,-15]]) {
    r(x, y, 4, 1, moss);
    r(x + 1, y + 1, 2, 2, "#567b4f");
    r(x + 1, y - 1, 2, 1, rim);
  }
  const chest = side ? 6 : 0;
  if (rear) {
    p(bark, [-5,-38],[6,-37],[9,-28],[6,-13],[0,-8],[-6,-12],[-8,-26]);
    for (let y = -34; y <= -13; y += 5) {
      r(-4, y, 8, 3, "#697c57");
      r(-2, y + 1, 4, 1, jade);
    }
  } else {
    p(ink, [chest-11,-29],[chest,-33],[chest+11,-29],[chest+12,-20],
      [chest+7,-11],[chest,-8],[chest-8,-12],[chest-12,-21]);
    p(copper, [chest-9,-28],[chest,-31],[chest+9,-27],[chest+9,-20],
      [chest+5,-13],[chest,-11],[chest-5,-14],[chest-9,-21]);
    if (exposed) {
      p("#4e382c", [chest-8,-23],[chest,-29],[chest+8,-23],[chest+4,-15],[chest,-13],[chest-5,-17]);
      p("#df8f4c", [chest-5,-23],[chest,-27],[chest+5,-23],[chest,-16]);
      p(hot, [chest-3,-23],[chest,-26],[chest+3,-23],[chest,-18]);
      r(chest - 1, -24, 2, 4, bright);
    } else {
      p(jade, [chest-8,-23],[chest,-29],[chest+8,-23],[chest+4,-16],[chest,-13],[chest-5,-17]);
      p("#2e6855", [chest,-27],[chest+7,-23],[chest+3,-17],[chest,-15]);
      r(chest - 1, -24, 2, 5, rim);
    }
  }

  // Each antler is split into crystal facets, with a separate silhouette at the rear.
  for (const sign of [-1, 1]) {
    const x = head + sign * (side && sign === 1 ? 4 : 7);
    const crown = (shade: string, ...pts: [number, number][]) =>
      p(shade, ...pts.map(([dx, y]): [number, number] => [x + dx * sign, y + lean]));
    crown(ink, [-3,-36],[0,-43],[2,-50],[8,-52],[7,-46],[12,-46],[10,-40],[4,-37]);
    crown(jade, [-1,-37],[2,-44],[3,-49],[7,-51],[5,-44],[10,-45],[8,-41],[4,-39]);
    crown(rim, [2,-45],[3,-49],[7,-51],[5,-47],[4,-43]);
  }
  p(ink, [head-9,-42+lean],[head-3,-46+lean],[head+6,-45+lean],[head+11,-40+lean],
    [head+8,-32+lean],[head+2,-29+lean],[head-6,-33+lean]);
  p(stone, [head-7,-41+lean],[head-3,-44+lean],[head+5,-43+lean],[head+9,-39+lean],
    [head+6,-34+lean],[head+1,-32+lean],[head-5,-35+lean]);
  r(head - 5, -41 + lean, 10, 2, "#a5ab71");
  if (!rear) {
    for (const x of side ? [head+3] : [head-5, head+3]) {
      r(x, -38+lean, 4, 2, "#22372c");
      r(x+1, -38+lean, 3, 1, exposed ? hot : rim);
    }
    r(head - 2, -33+lean, 6, 1, "#a89c70");
  }

  // The quartz hammer moves through its own per-frame positions as the chief lifts and lands it.
  const [hx, hy] = pose === "raise" ? [[21,-27],[20,-36],[16,-43],[13,-44]][frame]
    : pose === "strike" ? [24,-5] : pose === "recover" ? [23,-13] : [21,-15+shift];
  p(ink, [13,-28],[20,-26],[hx+4,hy+3],[hx,hy+8],[13,-18],[10,-23]);
  p(bark, [14,-26],[18,-25],[hx+1,hy+4],[hx-2,hy+5],[13,-21]);
  p(ink, [hx-8,hy-4],[hx-5,hy-9],[hx+2,hy-10],[hx+8,hy-6],[hx+9,hy+1],[hx+5,hy+6],[hx-6,hy+4]);
  p(jade, [hx-6,hy-4],[hx-4,hy-8],[hx+2,hy-8],[hx+7,hy-5],[hx+7,hy],[hx+3,hy+4],[hx-5,hy+2]);
  p("#285f50", [hx-6,hy-3],[hx+1,hy-2],[hx+7,hy-4],[hx+7,hy],[hx+3,hy+4],[hx-5,hy+2]);
  p(pose === "raise" || pose === "strike" ? hot : rim,
    [hx-3,hy-8],[hx+2,hy-8],[hx+6,hy-5],[hx+1,hy-4],[hx-4,hy-5]);
  r(hx + 2, hy - 5, 3, 1, pose === "raise" ? bright : "#99d9b2");
}
