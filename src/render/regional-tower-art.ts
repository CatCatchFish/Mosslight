import type { Rect, Shape } from "./pixel-sprite.ts";

const coldInk = "#283841", frostIron = "#546e7c", frostEdge = "#8aa5ad", snow = "#d3e4e6";
const wood = "#987754", brass = "#c3a36e";
function plinth(r: Rect, p: Shape, span: number) {
  p(coldInk, [-span, 2], [-span + 2, -5], [-span + 7, -9], [span - 6, -9],
    [span - 1, -4], [span, 2], [span - 6, 6], [-span + 5, 6]);
  p(frostIron, [-span + 2, 1], [-span + 7, -6], [span - 7, -6],
    [span - 2, 1], [span - 6, 4], [-span + 6, 4]);
  r(-span + 5, 1, 8, 1.5, frostEdge);
  r(span - 11, 1.5, 6, 1, "#b5cacf");
}

export function paintHailMortar(r: Rect, p: Shape, form: "base" | "avalanche" | "glacier" = "base") {
  const heavy = form === "avalanche", cooling = form === "glacier";
  const rim = heavy ? -38 : -35;
  plinth(r, p, heavy ? 27 : 24);
  p("#434443", [-18, -4], [-14, -18], [-10, -25], [11, -25], [16, -17], [19, -4],
    [12, 1], [-12, 1]);
  for (const side of [-1, 1]) {
    const x = side * (heavy ? 17 : 14);
    p(frostIron, [x - 5, -4], [x - 4, -18], [x, -22], [x + 5, -17], [x + 5, -6], [x + 2, -3]);
    p(frostEdge, [x - 4, -6], [x - 3, -17], [x, -20], [x + 1, -15], [x, -7]);
    r(x - 2, -9, 4, 2, brass);
    if (heavy) {
      p(coldInk, [x - 7, -20], [x - 5, -27], [x + 5, -27], [x + 7, -19], [x + 6, -8], [x - 5, -9]);
      r(x - 5, -23, 10, 3.5, frostEdge);
      r(x - 2, -22, 2, 1.5, brass);
    }
  }
  p(coldInk, [-19, rim + 5], [-11, rim], [10, rim], [18, rim + 6],
    [17, rim + 12], [11, -14], [-7, -14], [-15, rim + 14]);
  p(frostIron, [-16, rim + 6], [-10, rim + 2], [10, rim + 2], [15, rim + 6],
    [14, rim + 11], [10, -16], [-6, -16], [-13, rim + 12]);
  p(frostEdge, [-13, rim + 10], [-7, rim + 13], [8, rim + 12],
    [12, rim + 9], [8, -19], [-5, -19]);
  p("#29353c", [-12, rim + 6], [-8, rim + 3], [8, rim + 3], [12, rim + 7],
    [6, rim + 10], [-7, rim + 10]);
  p("#496675", [-10, rim + 7], [-7, rim + 5], [7, rim + 5], [10, rim + 7], [5, rim + 9], [-6, rim + 9]);
  p(snow, [-16, rim + 5], [-9, rim + 1], [-3, rim + 1], [-6, rim + 4], [-10, rim + 4], [-13, rim + 6]);
  if (cooling) for (const x of [-19, 20]) {
    p(coldInk, [x - 5, -9], [x - 4, -24], [x, -29], [x + 4, -24], [x + 5, -11], [x + 2, -8]);
    p("#79a8b6", [x - 3, -11], [x - 2, -23], [x, -26], [x + 2, -22], [x + 3, -12], [x, -10]);
    r(x - 1, -23, 1.5, 6, snow);
    r(x - 4, -15, 8, 2, frostIron);
  }
  r(-7, -15, 14, 2, wood);
  r(-8, -5, 16, 2, "#6e6050");
}

export function paintGlazeLance(r: Rect, p: Shape, form: "base" | "skewer" | "flurry" = "base") {
  const long = form === "skewer", volley = form === "flurry";
  plinth(r, p, volley ? 22 : 19);
  p(coldInk, [-13, -2], [-9, -25], [-7, -39], [7, -40], [10, -27], [13, -3], [8, 1], [-9, 1]);
  p("#624e42", [-10, -3], [-6, -25], [-4, -36], [4, -37], [7, -25], [10, -4], [6, -1], [-7, -1]);
  p(wood, [-10, -5], [-6, -27], [-4, -33], [-2, -32], [-4, -20], [-6, -5]);
  p(frostIron, [9, -7], [6, -29], [3, -29], [6, -9], [4, -4], [8, -4]);
  for (const y of [-9, -18, -29]) {
    r(-7, y, 14, 2.5, "#44494c");
    r(-6, y, 3, 1.25, brass);
  }
  const rails = volley ? [[-10, -43], [0, -49], [10, -43]] : [[0, long ? -54 : -48]];
  for (const [x, y] of rails) {
    p(coldInk, [x - 5, -19], [x - 5, y + 7], [x - 1, y], [x + 5, y + 6], [x + 5, -22], [x + 1, -17]);
    p(frostIron, [x - 3, -22], [x - 3, y + 8], [x - 1, y + 2], [x + 3, y + 7],
      [x + 3, -23], [x + 1, -19]);
    p(snow, [x - 2, y + 7], [x - 1, y + 2], [x + 1, y + 7], [x, y + 13], [x - 2, y + 13]);
  }
  if (!volley) for (const side of [-1, 1]) {
    p(coldInk, [side * 4, -23], [side * 12, -32], [side * (long ? 10 : 13), -43],
      [side * 6, -39], [side * 4, -31]);
    p(frostEdge, [side * 5, -26], [side * 9, -34], [side * 10, -40], [side * 7, -36]);
    r(side * 9 - 1, -34, 2, 2, brass);
    if (long) {
      p(coldInk, [side * 8, -5], [side * 15, -18], [side * 20, -20], [side * 19, -13],
        [side * 15, -2], [side * 11, 1]);
      p(frostEdge, [side * 10, -5], [side * 16, -17], [side * 18, -18], [side * 15, -10], [side * 13, -3]);
    }
  }
}
