import type { Facing } from "../engine/formation.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export function paintMirrorIbex(r: Rect, p: Shape, frame: number, facing: Facing, plated: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const bob = -(frame % 2);
  const stride = [2, 0, -2, 0][frame];
  const ink = "#323041", shade = "#67505a", fur = "#a17b6d", cream = "#d9bc9e";

  const legs = side ? [-10, 6, -15, 12] : [-5, 5, -10, 10];
  for (const [index, x] of legs.entries()) {
    const far = index < 2;
    const knee = x + (side && x < 0 ? 2 : 0);
    const foot = x + (index % 2 === Number(far) ? stride : -stride);
    const y = far ? -1 : 3;
    p(ink, [x - 4, -21 + bob], [x + 5, -21 + bob], [knee + 3, -8],
      [foot + 3, y - 4], [foot + 4, y], [foot - 4, y], [foot - 3, y - 4],
      [knee - 3, -8], [x - 5, -15 + bob]);
    p(far ? shade : fur, [x - 2, -20 + bob], [x + 3, -20 + bob], [knee + 1.5, -8],
      [foot + 2, y - 4], [foot - 1.5, y - 4], [knee - 1, -8], [x - 3, -15 + bob]);
    r(foot - 2, y - 3, 4, 1.5, "#896c68");
  }

  const width = side ? 20 : 13;
  p(ink, [-width - 2, -24 + bob], [-width + 4, -32 + bob], [-2, -33 + bob], [width - 5, -34 + bob],
    [width + 1, -25 + bob], [width - 1, -15 + bob], [6, -12 + bob], [-8, -17 + bob], [-width + 4, -15 + bob]);
  p(shade, [-width, -24 + bob], [-width + 5, -30 + bob], [-2, -31 + bob], [width - 5, -32 + bob],
    [width - 1, -25 + bob], [width - 3, -17 + bob], [6, -14 + bob], [-7, -19 + bob], [-width + 5, -17 + bob]);
  p(fur, [-width + 2, -24 + bob], [-width + 6, -30 + bob], [-3, -31 + bob], [width - 7, -31 + bob],
    [width - 6, -25 + bob], [4, -20 + bob], [-6, -21 + bob], [-width + 5, -19 + bob]);
  if (side) p(cream, [-width + 2, -25 + bob], [-width + 7, -29 + bob], [-width + 10, -28 + bob],
    [-width + 7, -24 + bob], [-width + 5, -21 + bob]);

  for (const x of side ? [-10, 1, 11] : [-8, 3]) {
    const center = x + 4;
    const top = (plated ? -34 : -31) + bob;
    const tip = (plated ? -17 : -23) + bob;
    p("#334a61", [x - 5, top + 4], [center - 3, top], [center + 4, top + 2],
      [center + 6, top + 7], [center, tip], [x - 3, tip - 3]);
    p(plated ? "#5998b6" : "#727d8e", [x - 4, top + 4.5], [center - 2.5, top + 1], [center + 3, top + 3],
      [center + 4.5, top + 7], [center, tip - 1.5], [x - 2, tip - 4]);
    p(plated ? "#b5e1eb" : "#9aabb5", [x - 3, top + 4.5], [center - 2, top + 1.5], [center + 3, top + 3],
      [center, top + 7], [x - 1, top + 8]);
    if (plated) r(center - 1.5, top + 4, 1.5, 4, "#eefaff");
  }

  const hx = side ? 15 : 0;
  const hy = -29 + bob;
  const hornRoots = side ? [[hx + 1, -1, .85], [hx - 4, -1, 1]] : [[hx - 6, -1, 1], [hx + 6, 1, 1]];
  for (const [root, dir, scale] of hornRoots) {
    const horn: Shape = (color, ...points) => p(color, ...points.map(([x, y]): [number, number] => [
      root + dir * x * scale, hy + y * scale,
    ]));
    horn(ink, [-2, -4], [-4, -11], [-2, -17], [2, -21], [8, -23], [15, -21], [20, -16], [20, -10],
      [16, -14], [13, -16], [7, -17], [4, -14], [4, -7], [2, -4]);
    horn("#8d796d", [-1, -6], [-2, -11], [0, -16], [3, -20], [8, -21], [14, -19], [18, -15],
      [17, -14], [13, -18], [7, -19], [3, -15], [2, -7]);
    horn("#c5aa8c", [-1, -13], [1, -17], [4, -20], [8, -21], [13, -20], [11, -19], [6, -19], [2, -15]);
    horn("#ded0b6", [1, -17], [3, -19], [5, -18], [3, -16]);
    horn("#ded0b6", [7, -20], [9, -21], [11, -20], [9, -19]);
  }
  const head: Shape = (color, ...points) => p(color, ...points.map(([x, y]): [number, number] => [hx + x, hy + y]));
  if (side) {
    head(ink, [-7, 2], [-10, -6], [-5, -6], [-3, -9], [5, -8], [9, -3], [14, 3],
      [12, 7], [6, 8], [5, 13], [1, 10], [-1, 7]);
    head(fur, [-5, 1], [-8, -4], [-4, -4], [-2, -7], [4, -6], [8, -2], [12, 3],
      [11, 5], [5, 6], [4, 10], [2, 8], [0, 5]);
    head(cream, [-2, -5], [3, -6], [7, -2], [11, 3], [8, 4], [5, 1], [1, 1]);
    r(hx + 4, hy - 2, 3, 2, ink);
    r(hx + 5, hy - 2, 1.5, 1, "#ffd581");
    r(hx + 11, hy + 3, 2.5, 2, ink);
  } else {
    head(ink, [-10, -6], [-6, -8], [6, -8], [10, -6], [7, 4], [3, 12], [-3, 12], [-7, 4]);
    head(rear ? fur : cream, [-8, -5], [-5, -6], [5, -6], [8, -5], [5, 3], [2, 9], [-2, 9], [-5, 3]);
    if (!rear) {
      for (const x of [-5, 3]) r(hx + x, hy - 1, 2, 1.5, ink);
      r(hx - 2.5, hy + 5, 5, 2, ink);
    }
  }
}

const foxRun = [
  { bob: 0, pitch: 0.5, tailY: 0, tailSwing: -2, fl: [4.5, 0], fr: [-3.5, 2.5], hl: [-4.5, 2], hr: [3.5, 0] },
  { bob: -2.5, pitch: -0.5, tailY: -2, tailSwing: 1, fl: [6, 3.5], fr: [1, 1], hl: [-6, 3.5], hr: [-1, 1] },
  { bob: -0.5, pitch: 0, tailY: -1, tailSwing: 3, fl: [-3.5, 2.5], fr: [4.5, 0], hl: [3.5, 0], hr: [-4.5, 2] },
  { bob: -1.5, pitch: 0.5, tailY: 1, tailSwing: 0, fl: [0.5, 1], fr: [5.5, 3], hl: [-1, 1], hr: [-5.5, 3] },
] as const;

export function paintSnowbrushFox(r: Rect, p: Shape, frame: number, facing: Facing, sweeping: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const gait = foxRun[frame];
  const crouch = sweeping ? (frame === 0 ? 1.5 : frame === 1 ? 3.5 : frame === 2 ? 1.5 : 0) : 0;
  const bob = sweeping ? crouch : gait.bob;
  const ink = "#272a39";
  const boot = "#4d526a";
  const shadow = "#7a7591";
  const coat = "#a8a1be";
  const silver = "#d5cee0";
  const ivory = "#f6efe7";
  const frost = "#dff6ff";
  const nose = "#413042";
  const eyeColor = sweeping ? "#fff3ab" : "#f7c46a";

  // Plush "snowbrush" tail: slender root swelling into a sweeping multi-tuft snow-dusted plume.
  const drawTail = () => {
    if (side) {
      // Sweeping arc: normal run trails in a lush S-curve; windup (f0-1) coils high & puffs up;
      // sweep (f2) whips forward over the back scattering snow crystals; recover (f3) rebounds back.
      const lift = sweeping ? [5, 11, 12, 6][frame] : gait.tailY;
      const forward = sweeping ? [-1, 3, 17, 5][frame] : 0;
      const sway = sweeping ? [0, -2, 2, -1][frame] : gait.tailSwing * 0.45;
      const tx = -11 + forward * 0.15;
      const ty = -14 + bob * 0.6;
      const midX = tx - 8.5 + forward * 0.45;
      const midY = ty - 7 - lift * 0.55;
      const tipX = tx - 11 + forward;
      const tipY = ty - 16 - lift + sway;
      p(ink,
        [tx + 3.2, ty + 1.4], [tx - 3.2, ty + 4.4], [midX - 4.4, midY + 7.4],
        [tipX - 5.2, tipY + 8.3], [tipX - 5.2, tipY + 0.8], [tipX + 0.1, tipY - 5.2], [tipX + 7.2, tipY - 3.2],
        [tipX + 9.2, tipY + 2.4], [midX + 6.1, midY - 2.3], [tx + 4.2, ty - 4.3]);
      p(coat,
        [tx + 2, ty + 0.2], [tx - 3, ty + 3], [midX - 2.8, midY + 6],
        [tipX - 3.6, tipY + 7], [tipX - 3.6, tipY + 1.4], [tipX + 0.5, tipY - 3.6], [tipX + 6, tipY - 1.6],
        [tipX + 7.6, tipY + 2.5], [midX + 4.5, midY - 1], [tx + 3, ty - 3]);
      p(silver,
        [midX - 1.5, midY + 4], [tipX - 3.5, tipY + 6], [tipX - 3.5, tipY + 1.5],
        [tipX + 0.5, tipY - 3.5], [tipX + 6, tipY - 1.5], [tipX + 7, tipY + 2.5], [midX + 3, midY + 1]);
      // Lush jagged snow-white brush plume tip
      p(ivory,
        [tipX - 3.5, tipY + 4], [tipX - 3.5, tipY + 0.5], [tipX + 0.5, tipY - 3.5], [tipX + 6, tipY - 1.5],
        [tipX + 7.5, tipY + 2], [tipX + 4, tipY + 3], [tipX + 4.5, tipY + 6], [tipX + 0.5, tipY + 4.5],
        [tipX - 1, tipY + 7]);
      if (sweeping && (frame === 1 || frame === 2)) {
        r(tipX + 1, tipY - 2, 3.5, 2, frost);
        r(tipX + 8.5, tipY - 4.5, 2, 2, frost);
        r(tipX + 12.5, tipY + 1, 2, 1.5, ivory);
        if (frame === 2) {
          r(tipX + 14.5, tipY - 3, 2.5, 2, frost);
          r(tipX + 5.5, tipY - 7.5, 2, 1.5, ivory);
          r(tipX - 6.5, tipY - 4.5, 2, 1.5, frost);
        }
      }
      return;
    }

    // Axial (front & rear) large curved brush tail visibly peeking out to the side even while running,
    // and whipping broadly across the body when sweeping.
    const sweepX = sweeping ? [-7, -12, 12, 4][frame] : (rear ? 7 + gait.tailSwing * 1.1 : -7 + gait.tailSwing * 1.1);
    const lift = sweeping ? [5, 10, 11, 5][frame] : 2 + Math.abs(gait.tailY) * 0.8;
    const base = rear ? -11 + bob * 0.6 : -17 + bob * 0.6;
    const tx = sweepX;
    const ty = base - 15 - lift;
    p(ink,
      [-4.4, base + 2.3], [4.4, base + 2.3], [tx + 8.3, ty + 11], [tx + 9.3, ty + 4.1],
      [tx + 5.2, ty - 3.9], [tx - 1.1, ty - 4.9], [tx - 7.3, ty + 0.9], [tx - 8.3, ty + 9.3]);
    p(coat,
      [-2.8, base + 1], [2.8, base + 1], [tx + 6.6, ty + 10], [tx + 7.6, ty + 4.5],
      [tx + 4, ty - 2.2], [tx - 1, ty - 3.2], [tx - 5.6, ty + 2], [tx - 6.6, ty + 8.5]);
    p(silver,
      [tx - 5, ty + 7], [tx - 5, ty + 2], [tx - 1, ty - 3], [tx + 4, ty - 2],
      [tx + 7, ty + 4.5], [tx + 5, ty + 8], [tx, ty + 6]);
    p(ivory,
      [tx - 5.5, ty + 3], [tx - 1, ty - 3], [tx + 4, ty - 2], [tx + 6.5, ty + 3.5],
      [tx + 3, ty + 4], [tx + 1.5, ty + 6.5], [tx - 1.5, ty + 4.5], [tx - 4, ty + 6]);
    if (sweeping && (frame === 1 || frame === 2)) {
      r(tx - 2, ty - 1.5, 3.5, 2, frost);
      r(tx + (frame === 2 ? 10 : -11), ty + 1, 2, 2, frost);
      r(tx + (frame === 2 ? 12 : -9), ty - 4, 1.5, 1.5, ivory);
    }
  };
  if (!rear) drawTail();

  // Agile yet clearly legible fox legs with refined medium outline, dark stockings, and white paws
  const leg = (x: number, [strideX, liftY]: readonly [number, number], fore: boolean, far: boolean) => {
    const sx = sweeping ? (fore ? (frame === 1 ? 2.5 : 1) : -1) : strideX;
    const ly = sweeping ? (fore && frame === 2 ? 2 : 0) : liftY;
    const rootY = -12.3 + bob;
    const footX = side ? x + sx : x + (far ? 0 : sx * 0.16);
    const kneeX = side ? (x + footX) * 0.5 + (fore ? -1.1 : 1.7) : x;
    const kneeY = -6 + bob * 0.5 - ly * 0.4;
    const footY = (far ? 0 : 2.5) - ly;
    const hipW = fore ? 3.4 : 4.0;

    p(ink,
      [x - hipW, rootY], [x + hipW, rootY], [kneeX + 3.1, kneeY],
      [footX + 3.2, footY - 2], [footX + 3.3, footY + 0.9], [footX - 3.0, footY + 0.9],
      [footX - 3.2, footY - 2], [kneeX - 3.0, kneeY]);
    p(far ? shadow : coat,
      [x - hipW + 1.4, rootY + 0.5], [x + hipW - 1.4, rootY + 0.5],
      [kneeX + 1.7, kneeY + 0.2], [kneeX - 1.6, kneeY + 0.2]);
    // Dark fox stocking on lower leg
    p(boot,
      [kneeX - 1.6, kneeY - 0.5], [kneeX + 1.7, kneeY - 0.5],
      [footX + 1.9, footY - 1.8], [footX + 1.8, footY - 0.5], [footX - 1.8, footY - 0.5], [footX - 1.8, footY - 1.8]);
    if (!far) {
      r(footX - 0.9, footY - 2.0, 2.7, 1.4, ivory);
    }
  };

  if (side) {
    leg(-10, gait.hr, false, true);
    leg(7, gait.fr, true, true);
  } else {
    leg(-4.8, gait.hr, rear, true);
    leg(4.8, gait.fr, rear, true);
  }

  // Lithe arched fox torso with fluffy chest ruff and refined crisp outline
  if (side) {
    const pLean = sweeping ? (frame === 1 ? 2.5 : frame === 2 ? 1 : 0.5) : gait.pitch;
    p(ink,
      [-15.3, -13 + bob], [-14.3, -19.2 + bob], [-8.2, -22.5 + bob], [1, -23 + bob + pLean * 0.4],
      [11.3, -21.3 + bob + pLean], [15.4, -15 + bob + pLean], [13.3, -7.7 + bob + pLean],
      [5.1, -6.7 + bob + pLean * 0.5], [-4, -8.1 + bob], [-12.5, -7.7 + bob]);
    p(coat,
      [-13.6, -13 + bob], [-12.6, -18 + bob], [-7.5, -20.8 + bob], [1, -21.2 + bob + pLean * 0.4],
      [10, -19.5 + bob + pLean], [13.6, -14.5 + bob + pLean], [11.6, -9.4 + bob + pLean],
      [5, -8.4 + bob + pLean * 0.5], [-4, -9.8 + bob], [-11, -9.4 + bob]);
    p(silver,
      [-12, -16 + bob], [-7, -20 + bob], [2, -20.5 + bob + pLean * 0.4],
      [9, -18.5 + bob + pLean], [6, -13.5 + bob + pLean * 0.5], [-5, -14 + bob]);
    p(shadow,
      [-12, -10.5 + bob], [-4, -11.5 + bob], [4, -10 + bob + pLean * 0.5],
      [1, -8.4 + bob], [-11, -9.4 + bob]);
    // Fluffy ivory chest ruff
    p(ivory,
      [5, -17 + bob + pLean], [12.5, -17 + bob + pLean], [14, -12.5 + bob + pLean],
      [11.5, -9 + bob + pLean], [7.5, -9.4 + bob + pLean], [5.5, -12.5 + bob + pLean]);
    p(silver, [6, -11.5 + bob + pLean], [11.5, -11.5 + bob + pLean], [9.5, -9 + bob + pLean]);
  } else {
    p(ink,
      [-11, -10.2 + bob], [-11.4, -18.2 + bob], [-6.4, -22.4 + bob], [6.4, -22.4 + bob],
      [11.4, -18.2 + bob], [11, -10.2 + bob], [6.2, -6.7 + bob], [-6.2, -6.7 + bob]);
    p(coat,
      [-9.2, -11 + bob], [-9.6, -17.5 + bob], [-5.6, -20.6 + bob], [5.6, -20.6 + bob],
      [9.6, -17.5 + bob], [9.2, -11 + bob], [5.2, -8.4 + bob], [-5.2, -8.4 + bob]);
    p(silver,
      [-8, -16 + bob], [-5, -20 + bob], [5, -20 + bob], [8, -16 + bob], [5, -12 + bob], [-5, -12 + bob]);
    if (!rear) {
      // Fluffy V-shaped chest ruff
      p(ivory, [-7, -17 + bob], [7, -17 + bob], [5.5, -10 + bob], [0, -7.8 + bob], [-5.5, -10 + bob]);
      p(silver, [-4.5, -11.5 + bob], [4.5, -11.5 + bob], [0, -8.6 + bob]);
    }
  }

  if (side) {
    leg(-12, gait.hl, false, false);
    leg(9, gait.fl, true, false);
  } else {
    leg(-6.8, gait.hl, !rear, false);
    leg(6.8, gait.fl, !rear, false);
  }

  // Sharp, expressive fox head with pointed dark-tipped ears, sleek muzzle & refined crisp outline
  const hx = side ? 12.5 + (sweeping && frame === 1 ? 1.5 : 0) : 0;
  const hy = -20.5 + bob + (sweeping ? (frame === 1 ? 2.5 : frame === 2 ? 1 : 0) : gait.pitch * 0.6);
  const h: Shape = (color, ...points) => p(color, ...points.map(([x, y]): [number, number] => [hx + x, hy + y]));

  if (side) {
    // Far ear behind skull
    h(ink, [0.7, -6.8], [2.8, -15.6], [7.4, -14.4], [7.9, -5.8]);
    h(boot, [2.6, -10], [3.6, -14], [6, -13], [6, -9]);
    h(coat, [2.2, -7], [3, -10.5], [6, -9.5], [6, -6]);
    // Main skull + sleek pointed muzzle + cheek fluff
    h(ink,
      [-9, 2], [-9.4, -4.2], [-7.5, -15.9], [-1.8, -15.2], [1.2, -8.4], [7.3, -7.9],
      [11.4, -3.7], [18, -0.7], [18.4, 2.7], [13.7, 5.4], [7.6, 6.9], [-1, 7.4], [-7, 5.9]);
    // Upper coat crown & near ear
    h(coat,
      [-7.2, 1.5], [-7.6, -4], [-5.8, -13.8], [-2.5, -13.2], [0.5, -6.5], [6.5, -6],
      [10, -2.5], [15.5, 0], [10, 2], [4, 2.5], [-3, 3.5]);
    h(boot, [-6.5, -9], [-5.8, -13.8], [-2.5, -13.2], [-2.5, -9]);
    h("#c98b9c", [-5.5, -9], [-3, -10], [-1.5, -5.5], [-4.5, -5]);
    // Bright ivory cheeks & lower muzzle
    h(ivory,
      [-6.5, 2.5], [-2, 1.5], [4, 0.5], [10.5, -1], [16, 0.5], [16, 2],
      [12.5, 4], [7, 5], [-1, 5.5], [-5.5, 4.5]);
    h(silver, [-5.5, 4], [1, 3.5], [7, 4], [5, 5.5], [-2, 5.5]);
    // Sleek slanted eye with bright amber iris
    h(ink, [3.4, -3.6], [8.5, -2.6], [8.1, 0], [3.9, 0]);
    r(hx + 5.1, hy - 2.3, 2.3, 1.6, eyeColor);
    r(hx + 6.4, hy - 2.4, 0.9, 0.9, "#ffffff");
    // Dainty nose
    r(hx + 15.2, hy - 0.5, 2.8, 2.2, nose);
  } else {
    h(ink,
      [-12, -1], [-11.4, -11.1], [-8.8, -16.4], [-4.4, -13.4], [-2.3, -8], [2.3, -8],
      [4.4, -13.4], [8.8, -16.4], [11.4, -11.1], [12, -1], [10.4, 4.3], [4.1, 8.4], [-4.1, 8.4], [-10.4, 4.3]);
    h(rear ? coat : silver,
      [-10, -1], [-9.5, -10], [-8, -14], [-4.8, -11.5], [-2.5, -6], [2.5, -6],
      [4.8, -11.5], [8, -14], [9.5, -10], [10, -1], [8.5, 3.5], [3.5, 6.5], [-3.5, 6.5], [-8.5, 3.5]);
    // Dark ear tips on both front & rear
    for (const s of [-1, 1]) {
      h(boot, [s * 9.5, -9], [s * 8, -14], [s * 5.2, -11.5], [s * 6, -8.5]);
    }
    if (rear) {
      h(shadow, [-8.5, 0], [-4, -2], [4, -2], [8.5, 0], [6.5, 5], [-6.5, 5]);
    } else {
      // Mask crown + bright ivory cheeks & pointed chin
      h(coat, [-9, -2], [-6, -6], [6, -6], [9, -2], [5, -1], [0, 1.5], [-5, -1]);
      h(ivory, [-9.5, 0], [-4.5, -1], [0, 1.5], [4.5, -1], [9.5, 0], [8, 4], [3.5, 6.5], [-3.5, 6.5], [-8, 4]);
      for (const s of [-1, 1]) {
        h("#c98b9c", [s * 5.8, -9.5], [s * 7.8, -11.5], [s * 8.4, -5.5], [s * 6.2, -6]);
        h(ink, [s * 2.7, -1.6], [s * 6.8, -2.6], [s * 6.5, 0.2], [s * 3.1, 0.2]);
        r(s * 4.5 - 0.9, hy - 1.6, 1.8, 1.4, eyeColor);
      }
      r(-1.7, hy + 2.7, 3.4, 2.1, nose);
    }
  }
  if (rear) drawTail();
}
