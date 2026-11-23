import type { TowerId } from "../engine/types.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

const snow = "#d2e6ec";
const snowShadow = "#8baabf";

export function paintSnowFooting(r: Rect, p: Shape, width: number, front: number) {
  p("#435a70", [-width, front - 2], [-width + 3, front - 4], [-width + 9, front - 3],
    [width - 8, front - 3], [width - 3, front - 4], [width, front - 2], [width - 2, front + 1],
    [width - 7, front + 2], [-width + 7, front + 2], [-width + 2, front + 1]);
  p(snowShadow, [-width + 1, front - 2], [-width + 4, front - 3], [-width + 8, front - 1],
    [width - 8, front - 1], [width - 4, front - 3], [width - 1, front - 2], [width - 5, front + 1], [-width + 5, front + 1]);
  r(-width + 3, front - 2, 5, 1.5, snow);
  r(width - 8, front - 2, 5, 1.5, snow);
  r(-4, front, 5, 1, "#658499");
}

const spans: Record<TowerId, number> = {
  arrow: 16, cannon: 24, ballista: 25, frost: 21, ember: 21, storm: 17, net: 23, prism: 18,
  "hail-mortar": 24, "glaze-lance": 19, "salt-caster": 22,
};

export function paintFrostWatchTower(type: TowerId, r: Rect, p: Shape, specialized: boolean) {
  const span = specialized ? (type === "arrow" || type === "storm" ? 19 : 23) : spans[type];
  paintSnowFooting(r, p, span, 5.5);
  if (specialized) return;

  switch (type) {
    case "hail-mortar":
      p(snowShadow, [12, -11], [17, -13], [20, -11], [18, -8], [14, -8]);
      r(16, -11, 3, 1.5, snow);
      break;
    case "glaze-lance":
      p(snow, [-12, -4], [-9, -8], [-6, -8], [-5, -5], [-8, -4]);
      break;
    case "arrow":
      p(snow, [-15, -38], [-13, -41], [-5, -41.5], [1, -40], [-4, -38], [-10, -38], [-12, -35]);
      p(snowShadow, [7, -41], [13, -41], [16, -37], [13, -36], [10, -39]);
      r(-10, -34.5, 2, 3, snowShadow);
      break;
    case "cannon":
      for (const x of [-19, 13]) {
        p(snow, [x - 3, -9], [x + 1, -12], [x + 6, -12], [x + 8, -10], [x + 5, -8], [x, -8]);
        r(x + 1, -8, 4, 1.5, snowShadow);
      }
      break;
    case "ballista":
      p(snow, [-17, -15], [-14, -24], [-12, -25], [-10, -23], [-13, -17], [-15, -15]);
      p(snowShadow, [13, -24], [15, -23], [20, -13], [16, -13]);
      r(15, -19, 2, 3, snow);
      break;
    case "frost":
      for (const x of [-14, 14]) {
        p(snowShadow, [x - 5, -2], [x - 1, -12], [x + 4, -9], [x + 6, -4], [x + 1, 0]);
        p(snow, [x - 3, -3], [x - 1, -10], [x + 2, -8], [x, -4]);
      }
      break;
    case "ember":
      // Soot-dark stone and a thin, thawing rim around the hot brazier.
      p("#756f71", [-20, -28], [-15, -26], [-12, -23], [-17, -23], [-21, -26]);
      p("#756f71", [14, -24], [18, -27], [20, -26], [18, -23], [14, -21]);
      r(-16, -3, 5, 1, snowShadow);
      break;
    case "storm":
      p(snow, [-15, -48], [-11, -52.5], [-7, -51], [-8, -48], [-11, -49], [-13, -46]);
      p(snow, [7, -49], [10, -52], [14, -51], [15, -48], [12, -48], [11, -50]);
      break;
    case "net":
      p(snow, [-21, -39], [-17, -42], [-11, -42], [-5, -40], [0, -40], [-6, -38], [-15, -38], [-19, -36]);
      p(snowShadow, [10, -41], [17, -41], [21, -39], [22, -36], [19, -35], [17, -38], [12, -39]);
      r(-17, -34, 1.5, 3, snowShadow);
      break;
    case "prism":
      p(snow, [-14, -44], [-10, -50], [-4, -51], [1, -49], [5, -49], [7, -47], [-7, -47], [-11, -43]);
      p(snowShadow, [7, -50], [11, -49], [15, -45], [14, -41], [12, -44], [10, -46]);
      break;
  }
}
