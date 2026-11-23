import type { MAP_ANIMALS } from "../content/world.ts";
import { box, canvas2d } from "./canvas.ts";

type Animal = (typeof MAP_ANIMALS)[number]["kind"];

export function makeAnimalStrip(kind: Animal) {
  const canvas = document.createElement("canvas");
  canvas.width = 208;
  canvas.height = 40;
  const ctx = canvas2d(canvas);
  ctx.scale(2, 2);

  for (let frame = 0; frame < 4; frame++) {
    const active = frame === 1 || frame === 3;
    const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    const pixel = (x: number, y: number, w: number, h: number, color: string) =>
      box(ctx, frame * 26 + x, y, w, h, color);
    if (kind === "fox") {
      pixel(5, 17, 18, 2, "#24302486");
      pixel(2, 10 - step, 10, 5, "#5f382c");
      pixel(3, 10 - step, 8, 3, "#b05d38");
      pixel(2, 10 - step, 3, 3, "#e8d0ac");
      pixel(9, 9, 12, 7, "#58372d");
      pixel(9, 9, 10, 5, "#cf8050");
      pixel(10 + step, 15, 2, 3, "#684135");
      pixel(17 - step, 15, 2, 3, "#684135");
      pixel(15, 5, 3, 6, "#aa6246");
      pixel(20, 6 - step, 2, 5, "#aa6246");
      pixel(15, 8, 7, 6, "#e29b68");
      pixel(18, 12, 6, 2, "#f2dab9");
      pixel(19, 10, 1, 1, "#322820");
      pixel(23, 12, 1, 1, "#322820");
      pixel(4, 11 - step, 3, .5, "#ecb781");
      pixel(11, 10, 4.5, .5, "#f2bc88");
      pixel(15.5, 6, 1, 2, "#efb591");
      pixel(19, 10, .5, .5, "#c8be9c");
    } else if (kind === "duck") {
      pixel(1 + frame, 15, 10, 1, "#90c3bd");
      pixel(4 + frame, 17, 13, 1, "#81b7b2");
      pixel(9, 13, 13, 3, "#2c5b58");
      pixel(8, 11 - step, 11, 4, "#a59d7e");
      pixel(10, 11 - step, 7, 2, "#584d45");
      pixel(12, 11 - step, 4, 1, "#697b91");
      pixel(17, 8 - step, 4, 5, "#3b735d");
      pixel(18, 8 - step, 4, 2, "#61a47c");
      pixel(18, 11 - step, 2, 1, "#e7dfbd");
      pixel(21, 10 - step, 3, 1, "#e7b65a");
      pixel(20, 9 - step, 1, 1, "#26372e");
      pixel(11, 13 - step, 3.5, .5, "#c2b598");
      pixel(5 + frame, 16, 5, .5, "#a9d3c897");
      pixel(18, 8 - step, 2, .5, "#9fca9d");
      if (active) pixel(3, 12 - step, 2, 1, "#badbd0");
    } else {
      const lift = active ? 2 : 0;
      pixel(5, 17, 16, 2, "#40576176");
      pixel(5, 12 - lift, 3, 3, "#dbe6e0");
      pixel(7, 10 - lift, 11, 6, "#8b9ca3");
      pixel(8, 10 - lift, 10, 5, "#dde4df");
      pixel(10 - step, 15 - lift, 5, 2, "#bdccca");
      pixel(17, 3 - lift, 2, 7, "#d6e0dc");
      pixel(14 + step, 2 - lift, 2, 8, "#eef0e4");
      pixel(15 + step, 4 - lift, 1, 4, "#b88e9a");
      pixel(15, 8 - lift, 6, 6, "#eaf0e8");
      pixel(19, 10 - lift, 1, 1, "#3d494e");
      pixel(21, 12 - lift, 1, 1, "#a68b90");
      pixel(18 + step, 15 - lift, 3, 1, "#afc2c4");
      pixel(8.5, 10.5 - lift, 4.5, .5, "#fff1d9");
      pixel(16.5, 11.5 - lift, 1.5, .5, "#c0ccc6");
      pixel(19, 10 - lift, .5, .5, "#d5e6e0");
    }
  }
  return canvas.toDataURL("image/png");
}
