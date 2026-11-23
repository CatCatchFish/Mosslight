import type { Facing } from "../engine/formation.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export function paintWeirFrog(r: Rect, p: Shape, frame: number, facing: Facing) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const hop = [0, 2, -2, 0][frame], spread = [1, 3, -2, 0][frame];
  const ink = "#243b36", moss = "#749953", lime = "#b7c878", gold = "#f5cf78";
  for (const sign of [-1, 1]) {
    const knee = sign * (12 + spread);
    const foot = knee + sign * 3;
    p(ink, [knee - 6, -7 + hop], [knee - 1, -11 + hop], [knee + 5, -8 + hop],
      [foot + 5, -1], [foot + 3, 2], [foot - 5, 2], [knee - 6, -2]);
    p(moss, [knee - 4, -7 + hop], [knee - 1, -9 + hop], [knee + 4, -7 + hop],
      [foot + 3, 0], [foot - 3, .5], [knee - 4, -2]);
    r(foot - 2, -.5, 4, 1, "#a9b86f");
    r(foot - 3, 1, 1.5, .5, "#e2c987");
    r(foot + 1, 1, 1.5, .5, "#e2c987");
  }

  const head = side ? 4 : 0;
  p(ink, [-18, -6], [-18, -12 + hop], [-13, -18 + hop], [-5, -21 + hop],
    [head + 8, -21 + hop], [head + 15, -16 + hop], [head + 17, -10 + hop],
    [head + 16, -5], [head + 11, -2], [head - 6, -1], [-13, -2]);
  p("#568451", [-16, -6], [-16, -12 + hop], [-11, -17 + hop], [-5, -19 + hop],
    [head + 7, -19 + hop], [head + 13, -15 + hop], [head + 15, -10 + hop],
    [head + 13, -5], [head + 8, -3], [-12, -3]);
  p(moss, [-14, -8], [-11, -15 + hop], [-5, -19 + hop], [head + 5, -19 + hop],
    [head + 11, -15 + hop], [head + 10, -12], [head + 1, -9], [-8, -7]);
  p(lime, [-10, -13 + hop], [-6, -17 + hop], [-2, -18.5 + hop], [3, -17 + hop], [0, -15 + hop], [-6, -13 + hop]);

  for (const [x, y] of [[-12,-9], [-9,-11], [-5,-12], [-12,-5], [-4,-7], [2,-13]]) {
    r(x, y + hop * .5, 2.5, 1.5, "#3e704d");
    r(x + .5, y + hop * .5 - .5, 1, .5, "#b3bc73");
  }
  const eyes = side ? [head - 2, head + 9] : [-8, 7];
  for (const x of eyes) {
    const y = -21 + hop;
    p(ink, [x - 4, y + 5], [x - 4, y], [x - 2, y - 3], [x + 2, y - 3], [x + 4, y], [x + 4, y + 4]);
    p(rear ? moss : gold, [x - 2.5, y + 3.5], [x - 2.5, y], [x - 1, y - 1.5],
      [x + 1.5, y - 1.5], [x + 3, y + .5], [x + 3, y + 3.5]);
    if (!rear) {
      r(x + (side ? .5 : -.75), y - .5, 1.5, 3.5, ink);
      r(x + (side ? 1.25 : 0), y, .75, .75, "#fff1a4");
    }
  }
  if (!rear) {
    p("#a5b977", [head - 6, -8], [head + 3, -9], [head + 13, -8], [head + 11, -4],
      [head + 6, -2.5], [head, -3.5]);
    p("#395744", [head - 8, -10], [head, -8.5], [head + 13, -9.5], [head + 10, -7.5],
      [head + 1, -7], [head - 5, -8]);
    r(head + 6, -7, 3, 1.5, "#d2a474");
  }
}

export function paintWeirTurtle(
  r: Rect, p: Shape, frame: number, facing: Facing,
  open: boolean, enraged: boolean, striking: boolean,
) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const stride = [1, 0, -1, 0][frame];
  const ink = "#1a2929", hide = "#40554a", scales = "#56715a";
  const ochre = enraged ? "#ed9b58" : "#b6a476";
  const shell = "#394849", rim = "#76877a", slate = "#596865";
  const head = side ? (striking ? 21 : open ? 20 : 17) : 0;
  const chest = side ? -3 : 0;
  if (side) {
    p(ink, [-18, -12], [-28, -8], [-27, -4], [-18, -2], [-11, -5]);
    p(hide, [-24, -7], [-19, -10], [-12, -7], [-17, -4], [-24, -5]);
    r(-24, -7, 3, 1, scales);
  }
  for (const offset of [-21, 12]) {
    const step = offset < 0 ? stride : -stride;
    p(ink, [chest + offset - 2, -13], [chest + offset + 8, -12],
      [chest + offset + 10, -3 + step], [chest + offset + 8, 2 + step],
      [chest + offset - 2, 2 + step], [chest + offset - 3, -3 + step]);
    r(chest + offset - 1, -8, 9, 7 + step, hide);
    r(chest + offset, -5 + step, 2, 2, scales);
    r(chest + offset + 4, -6 + step, 3, 2, "#63765c");
    for (let i = 0; i < 3; i++) r(chest + offset + i * 3, -1 + step, 2, 2, "#969879");
  }
  if (!rear) {
    const neck = striking ? -7 : side ? open ? -10 : -13 : -8;
    p(ink, [head - 11, neck + 7], [head - 10, neck - 7], [head - 4, neck - 12],
      [head + 4, neck - 12], [head + 9, neck - 6], [head + 13, neck - 4],
      [head + 14, neck + 2], [head + 7, neck + 7]);
    p(open ? "#6c7654" : hide, [head - 9, neck + 4], [head - 7, neck - 7],
      [head + 3, neck - 10], [head + 8, neck - 5], [head + 12, neck - 4],
      [head + 11, neck + 1], [head + 5, neck + 4]);
    p(scales, [head - 5, neck - 8], [head + 2, neck - 11],
      [head + 9, neck - 5], [head + 7, neck - 3], [head + 2, neck - 6]);
    if (side) {
      p("#304339", [head - 7, neck - 7], [head + 1, neck - 9],
        [head + 7, neck - 5], [head - 2, neck - 4]);
      r(head + 2, neck - 6, 4, 2, ink);
      r(head + 3, neck - 6, 2, 1, enraged ? "#ff855d" : "#f8d678");
      r(head + 10, neck - 4, 2, 1, "#849283");
      r(head + 3, neck + 1, 8, striking ? 3 : 1, ink);
      r(head + 8, neck + 4, 3, 1, "#75816b");
      if (striking) {
        r(head + 6, neck + 1, 1, 2, "#ddca99");
        r(head + 9, neck + 1, 1, 2, "#ddca99");
      }
    } else {
      r(head - 7, neck - 5, 4, 1, ochre);
      r(head + 4, neck - 5, 4, 1, ochre);
      r(head - 5, neck + 1, 12, striking ? 3 : 1, ink);
    }
  }

  const edge = side ? -6 : rear ? -9 : -16;
  p(ink, [chest - 24, edge - 5], [chest - 22, -24], [chest - 16, -32],
    [chest - 12, -42], [chest - 3, -36], [chest + 4, -42], [chest + 8, -34],
    [chest + 17, -36], [chest + 23, -22], [chest + 24, edge - 4],
    [chest + 18, edge + 1], [chest - 17, edge + 1]);
  p(shell, [chest - 22, edge - 5], [chest - 20, -24], [chest - 14, -32],
    [chest - 12, -39], [chest - 3, -34], [chest + 4, -39], [chest + 8, -32],
    [chest + 16, -34], [chest + 21, -21], [chest + 22, edge - 5],
    [chest + 17, edge - 1], [chest - 16, edge - 1]);
  if (open) {
    const gap = Math.min(-15, edge - 2);
    r(chest - 16, gap, 32, 4, "#563f31");
    r(chest - 13, gap + 1, 26, 2, enraged ? "#db7851" : "#ad7850");
    for (let i = -12; i <= 12; i += 6) r(chest + i, gap, 2, 3, "#e3b879");
  }
  for (let i = 0; i < 3; i++) {
    const x = chest - 19 + i * 12;
    const lift = open ? [3, 6, 2][i] : 0;
    const top = (i === 1 ? -35 : -31) - lift;
    const foot = (side || rear ? -13 : -19) - lift;
    p(ink, [x - 1, top + 4], [x + 5, top - 3], [x + 11, top + 1],
      [x + 13, foot - 4], [x + 8, foot + 2], [x, foot]);
    p(slate, [x, top + 4], [x + 5, top - 1], [x + 10, top + 2],
      [x + 11, foot - 5], [x + 7, foot], [x + 1, foot - 2]);
    p(rim, [x, top + 5], [x + 5, top - 1], [x + 9, top + 2], [x + 5, top + 1]);
    p("#63746e", [x + 1, top + 7], [x + 4, top + 3], [x + 6, top + 7],
      [x + 5, top + 13], [x + 3, top + 11], [x + 1, top + 14]);
    r(x + 7, top + 4, 2, Math.max(2, foot - top - 10), "#2f413e");
    r(x + 4, foot - 8, 2, 2, ochre);
    r(x + 5, foot - 3, 2, 1, "#acb094");
    r(x + 9, foot - 8, 1, 3, "#9fa390");
    r(x + 8, foot - 6, 2, 1, "#344743");
    p("#899181", [x + 1, top + 4], [x + 5, top + 1], [x + 8, top + 3],
      [x + 5, top + 4], [x + 3, top + 9]);
    p("#394e48", [x + 2, top + 10], [x + 4, top + 9], [x + 4.5, top + 13],
      [x + 9, top + 15], [x + 7, top + 16], [x + 3, top + 14]);
    r(x + 5, top + 4, 1.75, .5, "#c1b79a");
    r(x + 1, foot - 5, 1.5, .75, "#aab096");
  }
  for (const [dx, dy, span] of [[-17, -26, 5], [-20, -20, 5], [-12, -16, 5], [11, -24, 5], [14, -20, 5], [6, -31, 4]]) {
    r(chest + dx, dy, span, 2, "#586e52");
    r(chest + dx + 1, dy - 1, span - 2, 1, "#819875");
  }
  if (enraged) {
    for (const [dx, dy] of [[-10,-24], [-1,-29], [10,-25]]) {
      r(chest + dx, dy, 1, 4, "#db7645");
      r(chest + dx + 1, dy + 3, 3, 1, "#ecc26c");
    }
  }
  if (rear) {
    p(ink, [-5, -10], [5, -10], [4, 0], [0, 4], [-3, 2]);
    r(-2, -8, 4, 7, hide);
    r(-1, -3, 2, 4, scales);
  }
}
