import type { Facing } from "../engine/formation.ts";
import type { Shape } from "./pixel-sprite.ts";

const ink = "#2a3034";

function at(p: Shape, x: number, y: number, sign = 1): Shape {
  return (color, ...points) => p(color, ...points.map(([dx, dy]): [number, number] => [x + sign * dx, y + dy]));
}
function chip(p: Shape, x: number, y: number, width: number, height: number, color: string) {
  p(color, [x, y], [x + width, y], [x + width, y + height], [x, y + height]);
}

export function paintMireTreant(p: Shape, frame: number, facing: Facing, casting: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const stride = [2.4, 0.8, -2.4, -0.8][frame];
  const bob = casting ? [-1.0, -2.2, -1.6, -0.8][frame] : [0.4, -1.0, 0.4, -0.8][frame];
  const sway = casting ? [2.2, -2.2, 1.6, -1.5][frame] : [1.4, 0.5, -1.4, -0.5][frame];

  const barkDeep = "#2c231b";
  const barkDark = "#473a2b";
  const barkMid = "#6d5b41";
  const barkLight = "#9a845e";
  const barkRim = "#bda77c";
  const leafDark = "#23382d";
  const leafMid = "#3d6146";
  const leafLight = "#648957";
  const leafRim = "#96b376";
  const moss = "#76915c";
  const mossLight = "#a8bd82";
  const eyeGlow = casting ? "#f0ca6e" : "#e8b458";
  const eyeCore = casting ? "#fff6c7" : "#ffe9a8";
  const bud = casting ? "#f5dc93" : "#d4b26a";

  // Organic scalloped foliage clusters (lush cypress/willow boughs in crisp 1:1 proportions)
  const tuft = (q: Shape, cx: number, cy: number, rx: number, ry: number) => {
    const pts = (sx: number, sy: number, pad = 0): [number, number][] => [
      [cx - sx - pad, cy + sy * 0.16],
      [cx - sx * 0.84 - pad * 0.7, cy - sy * 0.64 - pad * 0.7],
      [cx - sx * 0.24, cy - sy - pad],
      [cx + sx * 0.3, cy - sy * 0.94 - pad],
      [cx + sx * 0.86 + pad * 0.7, cy - sy * 0.54 - pad * 0.7],
      [cx + sx + pad, cy + sy * 0.2],
      [cx + sx * 0.64 + pad * 0.5, cy + sy * 0.8 + pad * 0.6],
      [cx, cy + sy * 0.64 + pad * 0.5],
      [cx - sx * 0.66 - pad * 0.5, cy + sy * 0.82 + pad * 0.6],
    ];
    q(ink, ...pts(rx, ry, 1.4));
    q(leafDark, ...pts(rx, ry, 0));
    q(leafMid,
      [cx - rx * 0.82, cy + ry * 0.05], [cx - rx * 0.68, cy - ry * 0.62],
      [cx - rx * 0.18, cy - ry * 0.88], [cx + rx * 0.35, cy - ry * 0.82],
      [cx + rx * 0.78, cy - ry * 0.42], [cx + rx * 0.72, cy + ry * 0.25],
      [cx + rx * 0.15, cy + ry * 0.42], [cx - rx * 0.52, cy + ry * 0.4]);
    q(leafLight,
      [cx - rx * 0.56, cy - ry * 0.18], [cx - rx * 0.45, cy - ry * 0.68],
      [cx + rx * 0.05, cy - ry * 0.82], [cx + rx * 0.52, cy - ry * 0.55],
      [cx + rx * 0.32, cy - ry * 0.1], [cx - rx * 0.28, cy - ry * 0.05]);
    q(leafRim,
      [cx - rx * 0.36, cy - ry * 0.54], [cx + rx * 0.05, cy - ry * 0.74],
      [cx + rx * 0.34, cy - ry * 0.54], [cx + rx * 0.1, cy - ry * 0.34], [cx - rx * 0.22, cy - ry * 0.36]);
  };

  // Tall gnarled deadwood crown-horns breaking cleanly above the leafy canopy
  const drawAntler = (q: Shape, bx: number, by: number, dir: number, tall: number) => {
    const midX = bx + dir * 4.5, midY = by - tall * 0.58;
    const tipX = bx + dir * 7.2, tipY = by - tall;
    const forkX = bx + dir * 1.8, forkY = by - tall * 0.84;
    q(ink,
      [bx - dir * 1.4, by + 1], [bx + dir * 2.2, by + 1], [midX + dir * 1.8, midY + 1.2],
      [tipX + dir * 1.2, tipY - 1.2], [tipX - dir * 1.4, tipY - 0.6], [midX - dir * 0.4, midY - 0.8],
      [forkX + dir * 1.0, forkY - 1.2], [forkX - dir * 1.4, forkY - 0.4], [midX - dir * 1.8, midY + 0.6]);
    q(barkMid,
      [bx - dir * 0.4, by], [bx + dir * 1.2, by], [midX + dir * 0.8, midY + 0.4],
      [tipX + dir * 0.2, tipY], [tipX - dir * 0.6, tipY + 0.4], [midX - dir * 0.5, midY - 0.2],
      [forkX + dir * 0.2, forkY], [forkX - dir * 0.6, forkY + 0.4], [midX - dir * 0.9, midY + 0.4]);
    chip(q, midX - 0.5, midY - 1.2, 1.3, 2.2, barkRim);
  };

  // Strong forked root-legs (natural tall stride, never squashed)
  const drawRootLeg = (hipX: number, dir: number, far: boolean) => {
    const stepX = side ? stride * dir : stride * dir * 0.25;
    const lift = dir * stride < 0 ? 1.5 : 0;
    const hipY = -12 + bob;
    const footX = hipX + stepX;
    const footY = (far ? -0.5 : 1.2) - lift;
    const midX = (hipX + footX) * 0.5 + (side ? dir * 0.8 : 0);
    const midY = (hipY + footY) * 0.5;
    p(ink,
      [hipX - 3.4, hipY - 1.8], [hipX + 3.2, hipY - 1.8],
      [midX + 3.1, midY], [footX + 5.0, footY + 0.6], [footX + 2.6, footY + 2.0],
      [footX + 0.3, footY + 0.5], [footX - 1.5, footY + 2.0], [footX - 4.4, footY + 1.0],
      [midX - 3.1, midY]);
    p(far ? barkDark : barkMid,
      [hipX - 2.1, hipY - 0.6], [hipX + 2.0, hipY - 0.6],
      [midX + 1.9, midY], [footX + 3.5, footY + 0.2], [footX + 2.0, footY + 1.0],
      [footX + 0.2, footY - 0.4], [footX - 1.0, footY + 1.0], [footX - 3.0, footY + 0.4],
      [midX - 2.0, midY]);
    if (!far) {
      p(barkLight, [hipX - 1.1, hipY + 0.4], [hipX + 0.6, hipY + 0.4], [midX + 0.5, midY + 1.8], [midX - 1.0, midY + 1.8]);
      chip(p, footX - 2.2, footY - 2.0, 2.2, 1.2, moss);
    }
  };

  // Gnarled wooden branch-arm with forked twig claws; lifts proudly when casting
  const drawBranchArm = (ax: number, ay: number, s: number, far: boolean, sideArm: boolean) => {
    const swing = sideArm ? -stride * s * 0.9 : s * 0.8;
    const elbowX = casting
      ? ax + s * (sideArm ? 5.6 : 5.2)
      : ax + s * (far ? 4.4 : 5.2) + swing * 0.45;
    const elbowY = casting
      ? ay - (sideArm ? 3.2 : 3.8)
      : ay + (sideArm ? 3.4 : 3.0);
    const handX = casting
      ? ax + s * (sideArm ? 9.8 : 9.0)
      : ax + s * (far ? 7.6 : 8.8) + swing;
    const handY = casting
      ? ay - (sideArm ? 9.5 : 10.2)
      : ay + (sideArm ? 5.6 : 6.2) + Math.abs(stride) * 0.25;

    p(ink,
      [ax - s * 1.4, ay - 2.3], [elbowX, elbowY - 2.1], [handX, handY - 1.9],
      [handX + s * 4.0, handY - 4.2], [handX + s * 1.8, handY - 0.5],
      [handX + s * 4.6, handY + 0.6], [handX + s * 1.4, handY + 1.7],
      [handX + s * 2.5, handY + 4.0], [handX - s * 1.3, handY + 2.0],
      [elbowX - s * 0.8, elbowY + 2.1], [ax - s * 1.4, ay + 2.1]);
    p(far ? barkDark : barkMid,
      [ax - s * 0.5, ay - 1.2], [elbowX, elbowY - 1.0], [handX, handY - 0.9],
      [handX + s * 2.6, handY - 2.8], [handX + s * 1.0, handY - 0.2],
      [handX + s * 3.1, handY + 0.5], [handX + s * 0.7, handY + 1.0],
      [handX + s * 1.4, handY + 2.6], [handX - s * 0.5, handY + 1.0],
      [elbowX - s * 0.4, elbowY + 1.0], [ax - s * 0.5, ay + 1.0]);
    if (!far) {
      p(barkLight, [ax, ay - 0.5], [elbowX, elbowY - 0.4], [handX - s * 0.6, handY - 0.3], [elbowX, elbowY + 0.4]);
      p(leafMid, [elbowX - 1.5, elbowY - 2.8], [elbowX + 1.5, elbowY - 3.8], [elbowX + 2.2, elbowY - 1], [elbowX - 0.6, elbowY - 0.5]);
      p(moss, [elbowX - 1.0, elbowY + 1.0], [elbowX + 1.5, elbowY + 1.0],
        [elbowX + sway * 0.25 + 0.9, elbowY + 5.2], [elbowX + sway * 0.25 - 0.7, elbowY + 4.8]);
      if (casting) {
        chip(p, handX + s * 1.6 - 1.0, handY - 3.4, 2.4, 2.4, eyeCore);
        chip(p, handX + s * 2.8 - 0.8, handY - 0.8, 1.9, 1.9, bud);
      }
    }
  };

  // Tall, layered marsh-cypress canopy + exposed deadwood horns + weeping bog-moss curtains
  const drawTreeCrown = (q: Shape, isSide: boolean, isRear: boolean) => {
    // Exposed gnarled crown branches breaking upward through the foliage
    drawAntler(q, isSide ? -5.5 : -6.5, -34.0, -1, 10.5);
    drawAntler(q, isSide ? 4.5 : 6.5, -34.5, 1, 9.5);

    // Asymmetrical layered foliage boughs (tall organic crown, never a flat pancake!)
    tuft(q, isSide ? -9.5 : -10.5, -32.0, 7.6, 6.8);
    tuft(q, isSide ? 8.5 : 10.5, -32.5, 7.4, 6.6);
    tuft(q, isSide ? -0.5 : 0, -37.5, 8.8, 7.4);
    tuft(q, isSide ? -12.5 : -13.5, -26.5, 4.6, 4.2);
    if (!isSide) tuft(q, 13.5, -26.5, 4.6, 4.2);

    // Swaying curtains of pale hanging bog-moss
    const drapes = isSide
      ? [[-14.2, -24.0, 7.8], [11.5, -25.0, 7.2]]
      : isRear
        ? [[-14.2, -24.0, 8.0], [14.2, -24.0, 8.0]]
        : [[-14.2, -24.0, 8.0], [14.2, -24.0, 8.0]];
    for (const [mx, my, len] of drapes) {
      q(ink, [mx - 1.4, my], [mx + 1.4, my], [mx + sway * 0.55 + 1.0, my + len], [mx + sway * 0.55 - 1.0, my + len]);
      q(moss, [mx - 0.8, my + 0.4], [mx + 0.8, my + 0.4],
        [mx + sway * 0.55 + 0.5, my + len - 0.7], [mx + sway * 0.55 - 0.5, my + len - 0.7]);
      chip(q, mx + sway * 0.22 - 0.35, my + 1.4, 0.85, len * 0.46, mossLight);
    }

    // Glowing marsh-wisp buds tucked among the leafy boughs
    for (const [bx, by] of [[-9.5, -32.5], [9.2, -32.5]]) {
      chip(q, bx - 1.0, by - 0.6, 2.2, 2.2, bud);
      if (casting) chip(q, bx - 0.5, by, 1.2, 1.2, eyeCore);
    }
  };

  // Muted bog-vines wrapped around the trunk with hanging tendrils
  const drawVines = (q: Shape, isSide: boolean, isRear: boolean) => {
    const vineDeep = "#33452f";
    const vineMid = "#5a7046";
    const vineLight = "#819463";
    const wrap: [number, number][] = isSide
      ? [[-8.2, -14.2], [-2.8, -15.6], [2.8, -14.8], [9.0, -12.4], [8.6, -10.4], [3.2, -12.6], [-2.8, -13.6], [-7.8, -12.8]]
      : [[-8.8, -14.6], [-2.8, -16.2], [3.2, -15.2], [8.8, -12.4], [8.4, -10.4], [3.4, -12.8], [-2.8, -13.8], [-8.4, -13.0]];
    const inset: [number, number][] = isSide
      ? [[-7.7, -13.9], [-2.8, -14.9], [2.8, -14.1], [8.3, -12.2], [8.0, -11.2], [3.1, -13.3], [-2.8, -14.2], [-7.4, -13.5]]
      : [[-8.2, -14.3], [-2.8, -15.4], [3.1, -14.5], [8.0, -12.2], [7.8, -11.2], [3.3, -13.4], [-2.8, -14.4], [-7.8, -13.7]];
    q(ink, ...wrap);
    q(vineMid, ...inset);
    chip(q, -5.0, -15.1, 2.6, 0.9, vineLight);
    chip(q, 2.2, -14.6, 2.4, 0.8, vineLight);

    const hang = (hx: number, top: number, bottom: number, curl: number) => {
      const tipX = hx + sway * 0.45;
      q(ink, [hx - 1.4, top], [hx + 1.4, top], [tipX + curl + 1.2, bottom - 2.6],
        [tipX + curl + 2.4, bottom + 1.0], [tipX + curl - 0.3, bottom - 0.2],
        [tipX - 1.2, bottom - 3.2]);
      q(vineDeep, [hx - 0.7, top + 0.4], [hx + 0.7, top + 0.4], [tipX + curl + 0.9, bottom - 2.9],
        [tipX + curl + 1.8, bottom + 0.2], [tipX + curl - 0.2, bottom - 0.8],
        [tipX - 0.6, bottom - 3.4]);
      q(vineLight, [hx - 0.35, top + 1], [hx + 0.2, top + 1], [tipX + curl + 0.4, bottom - 3.6],
        [tipX + curl - 0.2, bottom - 2.6]);
      chip(q, hx - 2.4, top + 3.4, 1.9, 1.1, vineMid);
      chip(q, tipX + curl + 0.2, bottom - 5.2, 1.8, 1.0, vineMid);
    };

    if (isRear) {
      hang(0.8, -26.0, -12.5, 1.4);
      hang(-7.2, -22.5, -14.5, -1.0);
    } else if (isSide) {
      hang(-7.0, -24.5, -14.0, -0.8);
      hang(9.2, -20.0, -13.5, 1.0);
    } else {
      hang(-7.6, -25.0, -13.8, -0.9);
      hang(7.4, -22.5, -14.8, 1.0);
    }
  };

  const b = at(p, 0, bob);

  if (side) {
    drawRootLeg(-3.2, 1, true);
    drawBranchArm(5.2, -19.0 + bob, 1, true, true);

    // Tall, stately gnarled treant trunk (1:1 natural height)
    b(ink,
      [-8.0, -10.5], [-9.8, -19.0], [-8.0, -29.8], [6.2, -30.8], [10.0, -23.5], [9.4, -15.0], [7.2, -9.5], [-5.2, -9.0]);
    b(barkDeep,
      [-6.8, -11.0], [-8.4, -19.0], [-6.8, -28.4], [5.2, -29.2], [8.6, -23.0], [8.1, -15.2], [6.0, -10.5], [-4.5, -10.0]);
    b(barkMid,
      [-5.2, -11.8], [-6.8, -19.0], [-5.0, -27.8], [4.4, -28.4], [7.6, -22.5], [7.0, -15.8], [4.8, -11.2]);
    b(barkLight, [-4.2, -26.5], [-1.6, -27.0], [-0.4, -13.5], [-2.8, -13.0]);
    b(barkLight, [1.8, -27.0], [4.2, -26.5], [4.8, -15.0], [2.6, -14.5]);
    b(leafDark, [-7.8, -14.5], [7.8, -12.5], [7.4, -10.6], [-7.4, -12.6]);
    b(moss, [-5.4, -13.8], [5.0, -12.2], [4.6, -11.1], [-5.0, -12.7]);

    // Carved bark-hollow profile face + glowing marsh-amber eye
    b(ink, [2.8, -26.2], [9.0, -25.2], [9.2, -19.6], [5.6, -18.0], [2.2, -20.8]);
    chip(b, 4.8, -23.8, 3.2, 2.4, eyeGlow);
    chip(b, 5.8, -23.3, 1.5, 1.4, eyeCore);
    b(barkLight, [2.0, -27.2], [9.0, -26.4], [8.4, -24.6], [2.4, -25.0]);
    b(moss, [5.8, -18.2], [8.4, -18.0], [8.0 + sway * 0.25, -13.6], [6.0 + sway * 0.25, -14.2]);

    drawRootLeg(3.0, -1, false);
    drawVines(b, true, false);
    drawTreeCrown(b, true, false);
    drawBranchArm(-3.5, -16.8 + bob, casting ? -1 : 1, false, true);
    return;
  }

  // Front (`south`) and Rear (`north`) views
  drawRootLeg(-5.2, 1, rear);
  drawRootLeg(5.2, -1, !rear);

  drawBranchArm(-7.6, -19.2 + bob, -1, false, false);
  drawBranchArm(7.6, -19.2 + bob, 1, false, false);

  // Tall tapered gnarled trunk
  b(ink,
    [-8.6, -10.5], [-10.0, -19.0], [-9.8, -29.5], [9.8, -29.5], [10.0, -19.0], [8.6, -10.5], [5.4, -8.8], [-5.4, -8.8]);
  b(barkDeep,
    [-7.3, -11.2], [-8.6, -19.0], [-8.4, -28.2], [8.4, -28.2], [8.6, -19.0], [7.3, -11.2], [4.5, -10.0], [-4.5, -10.0]);
  b(barkMid,
    [-6.0, -11.8], [-7.2, -19.0], [-7.0, -27.5], [7.0, -27.5], [7.2, -19.0], [6.0, -11.8], [3.4, -10.6], [-3.4, -10.6]);
  b(barkLight, [-5.6, -26.4], [-3.4, -26.8], [-3.0, -12.5], [-4.8, -12.5]);
  b(barkLight, [3.4, -26.8], [5.6, -26.4], [4.8, -12.5], [3.0, -12.5]);
  b(leafDark, [-8.2, -14.2], [8.2, -12.2], [7.8, -10.5], [-7.8, -12.5]);
  b(moss, [-6.4, -13.6], [6.0, -11.9], [5.6, -10.9], [-6.0, -12.6]);

  if (!rear) {
    b(ink, [-6.2, -25.4], [6.2, -25.4], [5.6, -19.0], [2.2, -16.8], [-2.2, -16.8], [-5.6, -19.0]);
    b(barkLight, [-6.8, -26.6], [0, -25.2], [6.8, -26.6], [6.0, -24.6], [0, -23.6], [-6.0, -24.6]);
    for (const s of [-1, 1]) {
      chip(b, s * 2.9 - 1.5, -23.0, 3.0, 2.4, eyeGlow);
      chip(b, s * 2.9 - 0.7, -22.5, 1.4, 1.4, eyeCore);
    }
    b(moss, [-2.4, -17.0], [2.4, -17.0], [1.9 + sway * 0.25, -12.6], [0 + sway * 0.25, -11.4], [-1.9 + sway * 0.25, -12.6]);
    if (casting) chip(b, -1.6, -19.6, 3.2, 1.6, bud);
  } else {
    b(barkDeep, [-2.2, -27.0], [2.2, -27.0], [2.8, -14.0], [-2.8, -14.0]);
    b(moss, [-6.0, -23.5], [-1.4, -25.0], [-2.2, -15.0], [-6.2, -16.0]);
    b(mossLight, [-4.8, -23.0], [-2.4, -24.0], [-3.0, -17.0], [-4.8, -17.5]);
  }

  drawVines(b, false, rear);
  drawTreeCrown(b, false, rear);
}

export function paintMireCroc(p: Shape, frame: number, facing: Facing, submerging: boolean) {
  const side = facing === "east" || facing === "west", rear = facing === "north";
  const crouch = submerging ? 3 + frame % 2 : frame % 2 ? -.5 : 0;
  const b = at(p, 0, crouch);
  const shade = "#3e5354", hide = "#537679", sheen = "#7b9c94", patina = "#ab9e76", jaw = "#dbc08b";
  const step = [3, 0, -3, 1][frame];
  const foot = (x: number, far: boolean, direction: number) => {
    if (submerging) return;
    const paw = at(p, x + (side ? step * direction : step * direction * .38), (far ? -.5 : 3) - (direction * step < 0 ? 2 : 0));
    paw(ink, [-5, -4], [-2, -8], [4, -7], [6, -2], [5, 1], [-4, 1]);
    paw(far ? shade : hide, [-3, -4], [-1, -6.5], [3, -6], [4.5, -2], [3.5, -.5], [-2.5, -.5]);
    if (!far) chip(paw, 1, -2, 2, 1, patina);
  };
  const brow = (q: Shape) => {
    chip(q, -2, -2, 5, 4, ink);
    chip(q, -1, -1, 3, 2, "#edb960");
    chip(q, 0, -1, 1, 2, ink);
  };
  if (side) {
    for (const [x, d] of [[-10, 1], [7, -1]]) foot(x, true, d);
    const tail = [1, -1, 0, 2][frame];
    b(ink, [-27, -2 + tail], [-23, -5 + tail], [-18, -7], [-13, -14], [-5, -17], [7, -18],
      [14, -13], [17, -5], [12, 1], [-10, 1], [-18, 0], [-23, 1 + tail]);
    b(shade, [-24, -2 + tail], [-20, -5], [-15, -8], [-12, -12], [-5, -15.5], [7, -16],
      [13, -11], [15, -5], [11, -.5], [-10, -.5], [-17, -1.5], [-22, -.5 + tail]);
    b(hide, [-21, -4], [-17, -7], [-11, -12], [-5, -15], [7, -15], [12, -11],
      [11, -6], [2, -4], [-10, -5], [-17, -3]);
    b(patina, [-11, -3], [5, -4], [13, -6], [11, -1.5], [-8, -.5]);
    for (const [x, sy, size] of [[-17, -8, 3], [-11, -12, 5], [-5, -15, 5], [2, -16, 6], [8, -15, 4]]) {
      const q = at(b, x, sy);
      q(ink, [-3.5, 1], [-2, -size], [2, -size], [4, 0], [1, 2]);
      q(sheen, [-2, .5], [-1, -size + 1.5], [1.5, -size + 1.5], [2.5, -.5]);
    }
    foot(-12, false, -1);
    foot(9, false, 1);
    const h = at(b, 13, -9);
    h(ink, [-7, 2], [-6, -6], [-1, -8], [4, -7], [6, -4], [16, -4], [19, -2], [19, 2], [16, 5], [4, 6], [-3, 7]);
    h(hide, [-5, 1], [-4.5, -5], [-1, -6.5], [3.5, -5.5], [5.5, -2.5], [16, -2.5], [17.5, -.7],
      [17.5, 1], [9, 1], [4, 2], [-2, 4]);
    chip(h, 8, -2, 7, 1.5, sheen);
    h(jaw, [0, 4], [5, 2.5], [11, 3], [17, 2], [15.5, 3.5], [4, 4.5], [-2, 5.5]);
    for (const x of [7, 10, 14]) chip(h, x, 1, 1.5, 2, jaw);
    chip(h, 15, -2, 2, 1.5, ink);
    brow(at(h, -.5, -4.5));
    return;
  }
  foot(-9, true, -1);
  foot(9, true, 1);
  b(ink, [-14, 0], [-13, -11], [-10, -17], [-5, -21], [5, -21], [10, -17], [13, -11],
    [14, 0], [9, 3], [-9, 3]);
  b(shade, [-12, -1], [-11.5, -11], [-9, -16], [-4, -19.5], [4, -19.5], [9, -16], [11.5, -11],
    [12, -1], [8, 1.5], [-8, 1.5]);
  b(hide, [-10, -12], [-8, -16], [-4, -19], [4, -19], [8, -16], [10, -12], [6, -8], [-6, -8]);
  for (const [x, y] of [[-7, -14], [0, -19], [7, -14]]) {
    const q = at(b, x, y);
    q(ink, [-3, 0], [-2, -4], [1.5, -4], [3, 0], [0, 2]);
    q(sheen, [-1.8, 0], [-1, -2.5], [1, -2.5], [1.75, -.2]);
  }
  foot(-11, false, 1);
  foot(11, false, -1);
  if (rear) {
    const tail = [2, -2, -1, 3][frame];
    b(ink, [-5, -10], [5, -10], [5, -3], [tail + 2, 5], [tail - 2, 5], [-4, -2]);
    b(hide, [-3, -9], [3, -9], [3.5, -3], [tail + .5, 4], [tail - .5, 3], [-3, -2]);
    chip(b, -2, -6, 4.5, 2, sheen);
  } else {
    const h = at(b, 0, -5);
    h(ink, [-11, 2], [-9, -5], [-6, -8], [6, -8], [9, -5], [11, 2], [8, 6], [-8, 6]);
    h(hide, [-9, 1], [-7.5, -4], [-5, -6], [5, -6], [7.5, -4], [9, 1], [6, 3], [-6, 3]);
    chip(h, -5.5, -3.5, 11, 2, sheen);
    chip(h, -7, 3, 14, 1.5, jaw);
    for (const x of [-6, -2, 2, 6]) chip(h, x - .75, 1.8, 1.5, 2, jaw);
    for (const x of [-6.5, 5]) brow(at(h, x, -6));
  }
}

export function paintMireMycelid(p: Shape, frame: number, facing: Facing) {
  const side = facing === "east" || facing === "west", rear = facing === "north";
  const stride = [3, 1, -3, -1][frame], bob = [1, -1, 1, -1][frame];
  const bark = "#66584b", wood = "#ab8d60", mold = "#746e53", cap = "#896173", capShade = "#5a475d", capLight = "#b78589";
  for (const s of [-1, 1]) {
    const f = at(p, s * (side ? 9 : 10) + (side ? stride * s : 0), s * stride > 0 ? 1 : 3);
    f(ink, [-7, 0], [-6, -10], [4, -11], [7, -1], [4, 2], [-5, 2]);
    f(bark, [-5, 0], [-4, -9], [3, -9.5], [5, -1], [3, .5]);
    chip(f, -2, -5, 4, 4, wood);
  }
  const b = at(p, 0, bob);
  b(ink, [-21, -12], [-19, -25], [-10, -30], [10, -30], [19, -25], [21, -12], [15, -8], [10, -11], [6, -5], [-8, -5], [-12, -10], [-17, -8]);
  b(bark, [-19, -13], [-17.5, -25], [-9, -28], [9, -28], [17, -24], [19, -13], [15, -10], [10, -13], [5, -7], [-7, -7], [-12, -12], [-16, -10]);
  b(wood, [-17, -18], [-13, -25], [-4, -23], [-6, -10], [-11, -11], [-13, -17]);
  b(mold, [3, -24], [12, -25], [16, -17], [13, -13], [8, -15], [5, -10], [1, -12]);
  b(ink, [-24, -26], [-22, -34], [-16, -40], [-9, -43], [6, -43], [16, -39], [23, -32], [24, -26],
    [18, -21], [-20, -21]);
  b(capShade, [-22, -27], [-20, -33], [-15, -38], [-8, -41], [6, -41], [15, -37], [21, -31],
    [22, -27], [17, -23], [-19, -23]);
  b(cap, [-21, -28], [-18, -34], [-12, -39], [-7, -41], [6, -41], [15, -37], [20, -32],
    [18, -28], [11, -27], [5, -28], [-6, -27], [-13, -28]);
  b(capLight, [-16, -34], [-11, -38.5], [-6, -40], [1, -40], [6, -38], [2, -35], [-7, -35], [-12, -33]);
  chip(b, -12, -32, 3.5, 2, "#d3ad9d");
  chip(b, 7, -36, 4, 2, "#d3ad9d");
  chip(b, 13, -31, 3, 1.5, "#bc9590");
  for (const x of [-13, -7, 0, 7, 13]) chip(b, x, -24, 4, 2, wood);
  if (!rear) {
    const face = at(b, side ? 9 : 0, -16);
    face(ink, [-8, -4], [7, -4], [6, 1], [3, 4], [-4, 4], [-7, 1]);
    chip(face, side ? 1 : -4.5, -2, 3, 2, "#e3d085");
    if (!side) chip(face, 2, -2, 3, 2, "#e3d085");
  } else {
    chip(b, -9, -18, 4, 7, "#8e7c57");
    chip(b, 2, -17, 3.5, 6, "#8e7c57");
  }
}

export function paintBloatSporer(p: Shape, frame: number, facing: Facing, casting: boolean) {
  const side = facing === "east" || facing === "west", rear = facing === "north";
  const bob = [0, -2, -1, 1][frame], swing = [1, 0, -1, 0][frame];
  const width = (side ? 15 : 18) + (casting ? 2 : 0);
  const n = at(p, side ? -1 : swing, bob);
  const rim = "#526861", veil = "#7c8a75", sac = "#ab996c", top = "#dcc185", light = "#efda99", freckles = "#a36467";
  for (const [x, d] of [[-9, 1], [0, -1], [9, 1]]) {
    n(ink, [x - 3, -16], [x + 3, -16], [x + 2, -11], [x + 4 + d * swing, -6],
      [x + 2 + d * swing, -2], [x - 2 + d * swing, -2], [x - 3 + d * swing, -8]);
    n(veil, [x - 1.5, -14], [x + 1.5, -14], [x + 1, -9], [x + 2.5 + d * swing, -6],
      [x + 1 + d * swing, -3.5], [x - 1 + d * swing, -4], [x - 1.5 + d * swing, -8]);
  }
  const crown = casting ? -45 : -41;
  n(ink, [-width, -16], [-width - 1, -27], [-width + 2, -35], [-7, crown + 1], [6, crown], [width - 4, -37],
    [width, -29], [width, -18], [width - 6, -12], [-width + 6, -11]);
  n(rim, [-width + 2, -17], [-width + 1, -27], [-width + 4, -34], [-7, crown + 3], [6, crown + 2], [width - 5, -35],
    [width - 2, -28], [width - 2, -18], [width - 7, -14], [-width + 6, -13]);
  n(sac, [-width + 4, -22], [-width + 4, -32], [-6, crown + 4], [5, crown + 3],
    [width - 5, -34], [width - 3, -26], [width - 7, -20], [5, -18], [-7, -18]);
  n(top, [-width + 6, -31], [-6, crown + 4], [5, crown + 3], [width - 6, -34], [width - 5, -27],
    [7, -23], [0, -22], [-8, -23], [-width + 5, -26]);
  n(light, [-9, -33], [-4, crown + 5], [4, crown + 4], [8, -35], [3, -32], [-4, -33], [-8, -30]);
  for (const [x, y] of [[-8, -29], [-4, -26], [5, -34], [10, -30]]) chip(n, x, y, 2.5, 2, freckles);
  if (!rear) {
    const hood = at(n, side ? 8 : 0, -19);
    hood(ink, [-6, -2], [-4, -5], [4, -5], [6, -2], [5, 2], [-5, 2]);
    chip(hood, side ? 0 : -3.5, -2.5, 3, 2, casting ? "#fff0ad" : top);
    if (!side) chip(hood, 1, -2.5, 2.5, 2, casting ? "#fff0ad" : top);
  } else chip(n, -5, -18, 10, 2, veil);
}
