import type { Level } from "../engine/types.ts";
import { box, canvas2d } from "./canvas.ts";
import { bogReed, broadleaf, drawRiverSkiff, landShape, reedBed, splitIce, swampTree } from "./landforms.ts";
import { seeded } from "./terrain.ts";

// A small landscape for the selected stop, drawn on an integer grid like the map.
export function drawPostcard(canvas: HTMLCanvasElement, chapter: number, biome?: Level["biome"], sluice = false) {
  const w = 240, h = 108;
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas2d(canvas);
  ctx.scale(2, 2);
  const rand = seeded(177 + chapter);
  const riverEdge = biome === "river-edge";
  const mireEdge = biome === "mire-edge";
  const camp = chapter === 0,
    river = chapter === 1,
    quarry = chapter === 2;
  const snow = chapter === 3,
    mire = chapter === 4;
  const sky = ctx.createLinearGradient(0, 0, 0, 78);
  const colors = [
    ["#465f5d", "#c49465", "#ffcf87"],
    ["#21585e", "#66a695", "#e0db9d"],
    ["#633e4b", "#c5765c", "#ffd08b"],
    ["#24466f", "#749fb8", "#dec9ad"],
    ["#2b383e", "#5b7166", "#ccd09a"],
  ][chapter];
  (riverEdge ? ["#3f665f", "#89a486", "#ffcc8c"] : mireEdge ? ["#254055", "#5c7c77", "#d4d4a6"] : colors).forEach((color, i) =>
    sky.addColorStop(i / 2, color),
  );
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  function rect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ) {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.ceil(width),
      Math.ceil(height),
    );
  }
  for (let i = 0; i < 36; i++) rect(rand() * w, rand() * 34, 1, 1, "#fff0caa0");
  const grain = seeded(1024 + chapter);
  for (let i = 0; i < 130; i++) {
    const y = grain() * 45;
    box(ctx, grain() * w, y, i % 9 ? .5 : 2, .5,
      i % 3 ? "#ffeed066" : "#b6dacf66");
  }
  const sunX = snow ? 65 : 146;
  for (let y = -11; !mire && y <= 11; y++) {
    const halfWidth = Math.floor(Math.sqrt(126 - y * y));
    rect(
      sunX - halfWidth,
      28 + y,
      halfWidth * 2 + 1,
      1,
      snow ? "#f4f4e2" : "#ffe3a8",
    );
  }
  for (let i = 0; i < 24; i++)
    rect(
      rand() * w - 15,
      9 + rand() * 39,
      5 + rand() * 31,
      1 + rand(),
      "#fae6c350",
    );
  const hill = (x: number) => 67 + 8 * Math.sin(x / 24) + 6 * Math.sin(x / 49);
  for (let x = 0; x < w; x++) {
    const ridge =
      36 +
      6 * Math.sin(x / 29) +
      13 * Math.abs(Math.sin(x / 23 + 1)) +
      2 * Math.sin(x / 4);
    rect(
      x,
      ridge,
      1,
      h - ridge,
      ["#858470", "#64938b", "#ab7565", "#738d9f", "#5b6c66"][chapter],
    );
    if (snow || (mireEdge && x > 135))
      rect(x, ridge, 1, 2 + 4 * Math.max(0, Math.cos(x / 7)), "#d7e1d9");
    const near = 55 + Math.sin(x / 28) * 7 + Math.cos(x / 11) * 3;
    rect(
      x,
      near,
      1,
      h - near,
      ["#687764", "#47756f", "#865947", "#526d7c", "#3e504a"][chapter],
    );
  }
  function pine(
    x: number,
    y: number,
    height: number,
    dark: string,
    light: string,
  ) {
    rect(x - 1, y - height, 2, height, dark);
    for (let tier = 0; tier < 3; tier++) {
      const top = y - height + tier * height * 0.19;
      const rows = Math.ceil(height * (0.32 + tier * 0.07));
      for (let row = 1; row <= rows; row++) {
        const spread = Math.floor(row * 0.48);
        rect(x - spread, top + row, 1 + spread * 2, 1, dark);
        if (spread > 1)
          rect(x - spread, top + row, Math.ceil(spread * 0.74), 1, light);
      }
    }
  }
  if (camp || snow)
    for (let x = -3; x < (riverEdge ? 110 : w + 5); x += 3 + rand() * 4)
      pine(
        x,
        hill(x) + 2,
        6 + rand() * 17,
        "#354f51",
        snow ? "#a6bfc2" : "#668070",
      );
  if (mireEdge)
    for (let x = 148; x < w + 5; x += 4 + rand() * 4)
      pine(x, hill(x) + 2, 7 + rand() * 14, "#354f51", "#a6bfc2");
  for (let x = 0; x < w; x++)
    rect(
      x,
      hill(x),
      1,
      h,
      ["#374d39", "#2c6766", "#644739", "#496978", "#2d3d37"][chapter],
    );
  const landmark = "#263b3d",
    lit = "#ffcd78";
  if (sluice) {
    for (let i = 0; i < 32; i++)
      rect(rand() * w, 68 + rand() * 32, 4 + rand() * 18, 1, "#a4d4b384");
    const deckY = 57;
    rect(12, deckY, 216, 8, "#a39163");
    rect(12, deckY, 216, 2, "#d5b97e");
    rect(12, deckY + 6, 216, 3, "#344c44");
    for (const x of [31, 76, 119, 162, 204]) {
      rect(x, deckY + 7, 9, 20, "#344f49");
      rect(x + 1, deckY + 9, 3, 16, "#74927a");
      rect(x, deckY - 12, 3, 13, landmark);
      rect(x - 2, deckY - 13, 7, 6, "#4a5948");
      rect(x - 1, deckY - 12, 5, 4, lit);
    }
    drawRiverSkiff(ctx, 180, 90);
    reedBed(ctx, 18, 92, 1.2);
    reedBed(ctx, 225, 96, 1.3);
  } else if (riverEdge) {
    landShape(ctx, [[82, 60], [116, 56], [166, 61], [240, 77], [240, h], [72, h]], "#3e827e");
    for (let i = 0; i < 24; i++)
      rect(93 + rand() * 130, 67 + rand() * 27, 4 + rand() * 15, 1, "#a7cead91");
    for (const x of [156, 176, 208, 226]) {
      broadleaf(ctx, x, 70 + x / 27, 0.62);
      reedBed(ctx, x + 7, 81);
    }
    rect(87, 59, 113, 5, "#bd9667");
    rect(87, 64, 113, 3, "#544a38");
    for (let x = 90; x < 196; x += 12) rect(x, 61, 2, 12, "#735b41");
    rect(160, 48, 1, 13, landmark);
    rect(158, 50, 4, 4, lit);
    drawRiverSkiff(ctx, 136, 84);
  } else if (camp) {
    const x = 182,
      y = 47;
    for (const dx of [-7, 5]) rect(x + dx, y, 3, 24, landmark);
    for (let i = 0; i < 13; i++) {
      rect(x - 6 + i, y + 8 + i, 2, 2, landmark);
      rect(x + 6 - i, y + 8 + i, 2, 2, landmark);
    }
    rect(x - 10, y - 8, 20, 14, landmark);
    rect(x - 7, y - 6, 5, 6, lit);
    rect(x + 1, y - 6, 5, 6, "#f8a85f");
    rect(x - 13, y + 3, 26, 2, "#cdb788");
    for (let i = 0; i < 8; i++)
      rect(x - 3 - i * 1.5, y - 16 + i, 7 + i * 3, 1, "#423e40");
    rect(x + 1, y - 27, 1, 13, landmark);
    rect(x + 2, y - 26, 9, 3, "#eb8860");
    rect(x + 7, y - 23, 5, 2, "#b46352");
  } else if (snow) {
    for (const [x, y] of [
      [12, 78],
      [53, 73],
      [88, 80],
      [142, 71],
      [207, 73],
    ])
      splitIce(ctx, x, y);
    for (let x = 134; x < 221; x++) {
      const y = 52 - 10 * Math.sin(((x - 134) / 87) * Math.PI);
      rect(x, y, 1, 3, "#dbcdb0");
      rect(x, y + 3, 1, 3, landmark);
      if ((x - 134) % 9 === 0) rect(x, y - 4, 2, 5, landmark);
      if (x % 26 < 3) rect(x, y + 3, 1, 30, landmark);
    }
    rect(136, 37, 2, 17, landmark);
    rect(133, 35, 8, 5, lit);
    rect(132, 33, 10, 2, landmark);
  } else if (river) {
    for (const [x, y, size] of [
      [20, 80, 1.2],
      [48, 75, 0.8],
      [98, 69, 0.58],
      [225, 79, 1.4],
    ])
      broadleaf(ctx, x, y, size);
    for (let i = 0; i < 25; i++)
      rect(rand() * w, 70 + rand() * 15, 7 + rand() * 17, 1, "#9bceb77c");
    for (const x of [26, 59, 127, 204, 211]) reedBed(ctx, x, 85, 1.2);
    for (let i = 0; i < 32; i++) {
      const y = 52 - 14 * Math.sin((i / 31) * Math.PI);
      rect(166 + i, y, 1, 5, "#6b8069");
      rect(166 + i, y + 5, 1, 2, landmark);
    }
    for (const x of [166, 191]) {
      rect(x, 53, 7, 15, landmark);
      rect(x, 53, 3, 13, "#60826d");
      rect(x + 1, 48, 2, 3, "#f0d783");
    }
  } else if (quarry) {
    for (let i = 0; i < 5; i++) {
      const x = 100 - i * 10,
        y = 41 + i * 9;
      landShape(
        ctx,
        [
          [x, y],
          [x + 36, y - 5],
          [240, y - 7],
          [240, y + 7],
          [x + 14, y + 10],
        ],
        i % 2 ? "#bf8a58" : "#9f684a",
      );
      rect(x + 16, y + 7, 115, 2, "#754734");
    }
    rect(167, 44, 31, 25, "#46352e");
    rect(172, 50, 21, 20, "#272b2b");
    rect(166, 44, 33, 4, "#e3ad71");
    rect(165, 49, 6, 22, "#92623d");
    rect(195, 49, 5, 22, "#92623d");
    rect(192, 53, 3, 4, lit);
  } else if (mireEdge) {
    // Border crossing: Mire bank on the left, cold blue-teal river + wooden bridge across to snowy Frost Ridge on the right.
    for (let y = -10; y <= 10; y++) {
      const half = Math.floor(Math.sqrt(104 - y * y));
      rect(144 - half, 26 + y, half * 2 + 1, 1, "#e8ecc69e");
    }
    // Cold main river sweeping down from Frost Ridge in the center-right
    landShape(ctx, [[76, 62], [122, 58], [186, 63], [240, 74], [240, h], [62, h]], "#316a7a");
    landShape(ctx, [[88, 69], [142, 66], [204, 71], [240, 80], [240, h], [78, h]], "#3e7d8b");
    for (let i = 0; i < 24; i++)
      rect(84 + rand() * 136, 68 + rand() * 28, 4 + rand() * 14, 1, "#a7d5dc80");
    // Snowy east Frost Ridge shoreline
    landShape(ctx, [[174, 59], [212, 56], [240, 58], [240, 82], [192, 76], [178, 67]], "#9ab8c4");
    landShape(ctx, [[184, 59], [216, 57], [240, 59], [240, 71], [198, 68]], "#c6d9df");
    splitIce(ctx, 134, 83);
    splitIce(ctx, 162, 91);
    // West Mire bank with drooping mossy swamp trees matching the world map
    landShape(ctx, [[0, 62], [44, 60], [88, 66], [76, 84], [48, h], [0, h]], "#34443c");
    landShape(ctx, [[0, 74], [38, 72], [68, 82], [44, 96], [0, 94]], "#45644a");
    for (const [x, y, size] of [
      [18, 75, 1.15],
      [48, 70, 0.82],
    ])
      swampTree(ctx, x, y, size);
    // Wooden river-crossing bridge linking Mire west bank to Frost Ridge east bank
    rect(72, 60, 124, 5, "#827858");
    rect(72, 60, 124, 1.5, "#afa47e");
    rect(72, 65, 124, 2.5, "#323f38");
    for (const px of [84, 108, 132, 156, 180]) {
      rect(px, 65, 3, 18, "#334848");
      rect(px, 65, 1, 15, "#677d76");
      rect(px - 1, 79, 5, 1, "#9cc9cf78");
    }
    // Bridgehead watch lantern on the Mire pier
    rect(96, 46, 2, 15, landmark);
    rect(93, 45, 7, 2, landmark);
    rect(94, 47, 5, 5, "#47594c");
    rect(95, 48, 3, 3, lit);
    for (const x of [24, 60, 74]) bogReed(ctx, x, 85, 1.05);
    // Foreground frosty pines on the east Frost bank
    for (const x of [212, 226, 240])
      pine(x, 86 + rand() * 5, 26 + rand() * 20, "#243b46", "#8bb0b8");
  } else if (mire) {
    // Pale misty moon veiled in swamp haze
    for (let y = -10; y <= 10; y++) {
      const half = Math.floor(Math.sqrt(104 - y * y));
      rect(158 - half, 27 + y, half * 2 + 1, 1, "#e6e8bc99");
    }
    // Calm flat murky swamp water across the lower basin (matching river/sluice style)
    landShape(ctx, [
      [0, 72], [58, 67], [116, 70], [182, 66], [240, 70], [240, h], [0, h],
    ], "#355246");
    landShape(ctx, [
      [0, 79], [68, 75], [134, 78], [198, 74], [240, 77], [240, h], [0, h],
    ], "#46684d");
    landShape(ctx, [
      [34, 83], [108, 80], [182, 82], [218, 89], [164, 96], [82, 94], [26, 89],
    ], "#5c7f54");
    for (let i = 0; i < 26; i++)
      rect(rand() * w, 72 + rand() * 28, 6 + rand() * 18, 1, "#a6bd8470");
    // Subtle organic mire bubbles on the glassy water
    for (const [bx, by] of [[68, 86], [104, 91], [148, 85], [188, 92]]) {
      rect(bx - 2, by, 4, 2, "#355342");
      rect(bx - 1, by - 1, 3, 2, "#87a868");
      rect(bx - 1, by - 1, 1, 1, "#d2df9e");
    }
    // Drooping mossy swamp trees matching the Mire region on the world map
    for (const [x, y, size] of [
      [20, 77, 1.15],
      [48, 72, 0.78],
      [224, 76, 1.3],
    ])
      swampTree(ctx, x, y, size);
    // Weathered mossy wooden boardwalk & watch-lantern extending into the mist
    rect(114, 62, 76, 4, "#7a7054");
    rect(114, 62, 76, 1, "#a99e77");
    rect(114, 66, 76, 2, "#313d37");
    for (const px of [120, 140, 160, 180]) {
      rect(px, 65, 3, 18, "#33423b");
      rect(px, 65, 1, 15, "#5c6c5d");
      rect(px - 1, 79, 5, 1, "#8aa67375");
    }
    // Mossy lantern post on the boardwalk
    rect(164, 46, 2, 17, landmark);
    rect(161, 45, 7, 2, landmark);
    rect(162, 47, 5, 5, "#47594c");
    rect(163, 48, 3, 3, lit);
    // Reeds and quiet bog fungi tucked by the marsh shore
    for (const x of [24, 62, 108, 198, 214]) bogReed(ctx, x, 85, 1.1);
    for (const [mx, my] of [[78, 78], [86, 80], [192, 79]]) {
      rect(mx - 1, my - 3, 2, 4, "#9ca384");
      rect(mx - 3, my - 5, 6, 2, "#6a586d");
      rect(mx - 2, my - 6, 4, 1, "#907b91");
      rect(mx - 1, my - 5, 1, 1, "#c2d28e");
    }
  }
  if (camp || snow)
    for (const x of riverEdge ? [-4, 10, 28] : [-4, 10, 28, 215, 228, 243])
      pine(
        x,
        85 + rand() * 6,
        28 + rand() * 27,
        "#20363b",
        snow ? "#73939b" : "#3a5854",
      );
  for (let i = 0; i < 32; i++)
    rect(rand() * w, 57 + rand() * 32, 1, 1, snow ? "#e9f5e5" : mire ? "#cfdba0" : "#f4e396");
}
