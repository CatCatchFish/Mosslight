import type { Facing } from "../engine/formation.ts";
import type { Shape } from "./pixel-sprite.ts";

const ink = "#2a3034";

function at(p: Shape, x: number, y: number, sign = 1): Shape {
  return (color, ...points) => p(color, ...points.map(([dx, dy]): [number, number] => [x + sign * dx, y + dy]));
}
function chip(p: Shape, x: number, y: number, width: number, height: number, color: string) {
  p(color, [x, y], [x + width, y], [x + width, y + height], [x, y + height]);
}

export function paintMireTreant(raw: Shape, frame: number, facing: Facing, casting: boolean) {
  // Squash the tall tree silhouette into the game's chibi proportions while keeping the authored shapes.
  const p: Shape = (color, ...points) =>
    raw(color, ...points.map(([x, y]): [number, number] => [x * 1.16, y * 0.78]));
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const stride = [2.2, 0.7, -2.2, -0.7][frame];
  const bob = casting ? [-1.0, -2.0, -1.5, -0.8][frame] : [0.4, -0.8, 0.4, -0.6][frame];
  const sway = casting ? [2.0, -2.0, 1.5, -1.4][frame] : [1.3, 0.4, -1.3, -0.4][frame];

  const barkDeep = "#30281f";
  const barkDark = "#493d2d";
  const barkMid = "#6b5a40";
  const barkLight = "#95815d";
  const leafDark = "#263a30";
  const leafMid = "#3f5f45";
  const leafLight = "#648256";
  const leafRim = "#91a874";
  const moss = "#758c5c";
  const mossLight = "#a3b47d";
  const eyeGlow = casting ? "#e9c46a" : "#e8b45a";
  const eyeCore = casting ? "#fff2b8" : "#ffe7a2";
  const bud = casting ? "#f0d38a" : "#cfae68";

  // Helper for organic scalloped foliage tufts (distinctly tree-bough clusters, never a smooth dome!)
  const tuft = (q: Shape, cx: number, cy: number, rx: number, ry: number) => {
    const pts = (sx: number, sy: number, pad = 0): [number, number][] => [
      [cx - sx - pad, cy + sy * 0.15],
      [cx - sx * 0.85 - pad * 0.7, cy - sy * 0.65 - pad * 0.7],
      [cx - sx * 0.25, cy - sy - pad],
      [cx + sx * 0.3, cy - sy * 0.95 - pad],
      [cx + sx * 0.88 + pad * 0.7, cy - sy * 0.55 - pad * 0.7],
      [cx + sx + pad, cy + sy * 0.2],
      [cx + sx * 0.65 + pad * 0.5, cy + sy * 0.82 + pad * 0.6],
      [cx, cy + sy * 0.65 + pad * 0.5],
      [cx - sx * 0.68 - pad * 0.5, cy + sy * 0.85 + pad * 0.6],
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

  // Root-leg anchored securely into hip (top tracks bob so it can NEVER detach!)
  const drawRootLeg = (hipX: number, dir: number, far: boolean) => {
    const stepX = side ? stride * dir : stride * dir * 0.22;
    const lift = dir * stride < 0 ? 1.2 : 0;
    const hipY = -11 + bob;
    const footX = hipX + stepX;
    const footY = (far ? 0 : 1.2) - lift;
    const midX = (hipX + footX) * 0.5 + (side ? dir * 0.7 : 0);
    const midY = (hipY + footY) * 0.5;
    p(ink,
      [hipX - 3.6, hipY - 1.5], [hipX + 3.4, hipY - 1.5],
      [midX + 3.4, midY], [footX + 5.2, footY + 0.6], [footX + 2.8, footY + 2.1],
      [footX + 0.4, footY + 0.5], [footX - 1.6, footY + 2.1], [footX - 4.6, footY + 1.1],
      [midX - 3.4, midY]);
    p(far ? barkDark : barkMid,
      [hipX - 2.3, hipY - 0.5], [hipX + 2.2, hipY - 0.5],
      [midX + 2.1, midY], [footX + 3.7, footY + 0.2], [footX + 2.1, footY + 1.0],
      [footX + 0.3, footY - 0.5], [footX - 1.1, footY + 1.0], [footX - 3.2, footY + 0.4],
      [midX - 2.2, midY]);
    if (!far) {
      p(barkLight, [hipX - 1.2, hipY + 0.5], [hipX + 0.6, hipY + 0.5], [midX + 0.5, midY + 1.5], [midX - 1.1, midY + 1.5]);
      chip(p, footX - 2.4, footY - 1.8, 2.2, 1.1, moss);
    }
  };

  // Gnarled wooden branch-arm with forked twig claws; placed cleanly so it never hides the face
  const drawBranchArm = (ax: number, ay: number, s: number, far: boolean, sideArm: boolean) => {
    const swing = sideArm ? -stride * s * 0.85 : s * 0.8;
    const elbowX = casting
      ? ax + s * (sideArm ? 5.4 : 5.0)
      : ax + s * (far ? 4.4 : 5.2) + swing * 0.45;
    const elbowY = casting
      ? ay - (sideArm ? 2.0 : 2.8)
      : ay + (sideArm ? 3.2 : 2.8);
    const handX = casting
      ? ax + s * (sideArm ? 9.4 : 8.6)
      : ax + s * (far ? 7.6 : 8.8) + swing;
    const handY = casting
      ? ay - (sideArm ? 7.4 : 8.2)
      : ay + (sideArm ? 5.2 : 5.8) + Math.abs(stride) * 0.25;

    p(ink,
      [ax - s * 1.4, ay - 2.4], [elbowX, elbowY - 2.2], [handX, handY - 2.0],
      [handX + s * 4.0, handY - 4.2], [handX + s * 1.8, handY - 0.5],
      [handX + s * 4.6, handY + 0.6], [handX + s * 1.4, handY + 1.7],
      [handX + s * 2.5, handY + 4.0], [handX - s * 1.3, handY + 2.0],
      [elbowX - s * 0.8, elbowY + 2.2], [ax - s * 1.4, ay + 2.2]);
    p(far ? barkDark : barkMid,
      [ax - s * 0.5, ay - 1.3], [elbowX, elbowY - 1.1], [handX, handY - 1.0],
      [handX + s * 2.6, handY - 2.8], [handX + s * 1.0, handY - 0.2],
      [handX + s * 3.1, handY + 0.5], [handX + s * 0.7, handY + 1.0],
      [handX + s * 1.4, handY + 2.6], [handX - s * 0.5, handY + 1.0],
      [elbowX - s * 0.4, elbowY + 1.1], [ax - s * 0.5, ay + 1.1]);
    if (!far) {
      p(barkLight, [ax, ay - 0.6], [elbowX, elbowY - 0.5], [handX - s * 0.6, handY - 0.4], [elbowX, elbowY + 0.4]);
      // Small leafy sprout on forearm
      p(leafMid, [elbowX - 1.5, elbowY - 2.6], [elbowX + 1.5, elbowY - 3.6], [elbowX + 2.2, elbowY - 1], [elbowX - 0.6, elbowY - 0.5]);
      p(moss, [elbowX - 1.0, elbowY + 1.0], [elbowX + 1.5, elbowY + 1.0],
        [elbowX + sway * 0.25 + 0.9, elbowY + 4.6], [elbowX + sway * 0.25 - 0.7, elbowY + 4.2]);
      if (casting) {
        chip(p, handX + s * 1.6 - 1.0, handY - 3.2, 2.2, 2.2, eyeCore);
        chip(p, handX + s * 2.6 - 0.8, handY - 0.8, 1.8, 1.8, bud);
      }
    }
  };

  // Multi-clustered organic tree canopy (3 distinct asymmetrical leafy boughs + moss wisps)
  const drawTreeCrown = (q: Shape, isSide: boolean, isRear: boolean) => {
    // Back/side leafy clusters framing the gnarled crown-branches
    tuft(q, isSide ? -10.5 : -11.5, -30.0, 8.2, 6.4);
    tuft(q, isSide ? 9.5 : 11.5, -30.5, 8.0, 6.2);
    // Central tall cypress crest tuft
    tuft(q, isSide ? -0.5 : 0, -34.5, 9.2, 6.8);
    // Small shoulder leaf-tuft breaking the silhouette further
    tuft(q, isSide ? -13.5 : -14.5, -25.0, 5.0, 4.0);
    if (!isSide) tuft(q, 14.5, -25.0, 5.0, 4.0);

    // Delicate swaying curtains of pale hanging bog-moss under the outer boughs
    const drapes = isSide
      ? [[-15.5, -23.0, 6.0], [12.5, -24.0, 6.0]]
      : isRear
        ? [[-15.5, -23.0, 6.5], [15.5, -23.0, 6.5]]
        : [[-15.5, -23.0, 6.5], [15.5, -23.0, 6.5]];
    for (const [mx, my, len] of drapes) {
      q(ink, [mx - 1.4, my], [mx + 1.4, my], [mx + sway * 0.55 + 1.0, my + len], [mx + sway * 0.55 - 1.0, my + len]);
      q(moss, [mx - 0.8, my + 0.4], [mx + 0.8, my + 0.4],
        [mx + sway * 0.55 + 0.5, my + len - 0.7], [mx + sway * 0.55 - 0.5, my + len - 0.7]);
      chip(q, mx + sway * 0.22 - 0.35, my + 1.2, 0.8, len * 0.45, mossLight);
    }

    // Glowing marsh-wisp buds tucked among the leafy boughs
    for (const [bx, by] of [[-10.5, -30.5], [10.2, -30.5]]) {
      chip(q, bx - 1.0, by - 0.5, 2.2, 2.0, bud);
      if (casting) chip(q, bx - 0.5, by, 1.2, 1.1, eyeCore);
    }
  };

  // Muted bog-vines wrapped around the trunk with a few hanging tendrils.
  const drawVines = (q: Shape, isSide: boolean, isRear: boolean) => {
    const vineDeep = "#33452f";
    const vineMid = "#5a7046";
    const vineLight = "#819463";
    const wrap: [number, number][] = isSide
      ? [[-8.6, -13.2], [-3, -14.6], [3, -13.8], [9.8, -11.4], [9.4, -9.6], [3.4, -11.6], [-3, -12.6], [-8.2, -11.8]]
      : [[-9.2, -13.6], [-3, -15.2], [3.4, -14.2], [9.2, -11.4], [8.8, -9.4], [3.6, -11.8], [-3, -12.8], [-8.8, -12.0]];
    const inset: [number, number][] = isSide
      ? [[-8.1, -12.9], [-3, -13.9], [3, -13.1], [9.1, -11.2], [8.8, -10.4], [3.3, -12.3], [-3, -13.2], [-7.8, -12.5]]
      : [[-8.6, -13.3], [-3, -14.4], [3.3, -13.5], [8.4, -11.2], [8.2, -10.2], [3.5, -12.4], [-3, -13.4], [-8.2, -12.7]];
    q(ink, ...wrap);
    q(vineMid, ...inset);
    chip(q, -5.2, -14.1, 2.6, 0.9, vineLight);
    chip(q, 2.4, -13.6, 2.4, 0.8, vineLight);

    const hang = (hx: number, top: number, bottom: number, curl: number) => {
      const tipX = hx + sway * 0.45;
      q(ink, [hx - 1.5, top], [hx + 1.5, top], [tipX + curl + 1.3, bottom - 2.6],
        [tipX + curl + 2.6, bottom + 1.0], [tipX + curl - 0.3, bottom - 0.2],
        [tipX - 1.3, bottom - 3.2]);
      q(vineDeep, [hx - 0.8, top + 0.4], [hx + 0.8, top + 0.4], [tipX + curl + 1.0, bottom - 2.9],
        [tipX + curl + 1.9, bottom + 0.2], [tipX + curl - 0.2, bottom - 0.8],
        [tipX - 0.6, bottom - 3.4]);
      q(vineLight, [hx - 0.4, top + 1], [hx + 0.2, top + 1], [tipX + curl + 0.4, bottom - 3.6],
        [tipX + curl - 0.2, bottom - 2.6]);
      chip(q, hx - 2.6, top + 3.2, 2.0, 1.1, vineMid);
      chip(q, tipX + curl + 0.2, bottom - 5.0, 1.8, 1.0, vineMid);
    };

    if (isRear) {
      hang(0.8, -24.5, -12.0, 1.4);
      hang(-7.6, -21.0, -14.0, -1.0);
    } else if (isSide) {
      hang(-7.4, -23.0, -13.2, -0.8);
      hang(10.0, -18.5, -13.0, 1.0);
    } else {
      hang(-8.0, -23.5, -13.0, -0.9);
      hang(7.8, -21.0, -14.2, 1.0);
    }
  };

  const b = at(p, 0, bob);

  if (side) {
    // Far root-leg & far branch-arm behind the leaning trunk
    drawRootLeg(-3.5, 1, true);
    drawBranchArm(5.5, -17.5 + bob, 1, true, true);

    // Gnarled, forward-leaning treant trunk with knotted bark hip & carved hollow face
    b(ink,
      [-8.5, -9.5], [-10.5, -17.5], [-8.5, -27.5], [6.5, -28.5], [10.8, -22], [10.2, -14], [7.8, -8.5], [-5.5, -8]);
    b(barkDeep,
      [-7.2, -10], [-9, -17.5], [-7.2, -26.2], [5.4, -27], [9.2, -21.5], [8.8, -14.2], [6.4, -9.5], [-4.8, -9]);
    b(barkMid,
      [-5.6, -10.8], [-7.2, -17.5], [-5.4, -25.6], [4.6, -26.2], [8.2, -21], [7.6, -14.8], [5.2, -10.2]);
    // Sculpted vertical bark ridges
    b(barkLight, [-4.5, -24.5], [-1.8, -25], [-0.4, -12.5], [-3.0, -12]);
    b(barkLight, [2.0, -25], [4.6, -24.5], [5.2, -14], [2.8, -13.5]);
    // Knotted moss-vine belt around waist
    b(leafDark, [-8.2, -13.5], [8.4, -11.5], [8.0, -9.6], [-7.8, -11.6]);
    b(moss, [-5.8, -12.8], [5.4, -11.2], [5.0, -10.1], [-5.4, -11.7]);

    // Profile carved bark-hollow face + glowing marsh-amber eye (100% unobstructed!)
    b(ink, [3.0, -24.0], [9.6, -23.0], [9.8, -17.8], [6.0, -16.4], [2.4, -19.0]);
    chip(b, 5.2, -21.8, 3.2, 2.2, eyeGlow);
    chip(b, 6.2, -21.3, 1.5, 1.3, eyeCore);
    // Protruding knotted bark brow + mossy chin beard
    b(barkLight, [2.2, -25.0], [9.6, -24.2], [9.0, -22.6], [2.6, -23.0]);
    b(moss, [6.2, -16.6], [9.0, -16.4], [8.6 + sway * 0.25, -12.5], [6.4 + sway * 0.25, -13.0]);

    // Near root-leg securely planted in front of lower trunk
    drawRootLeg(3.2, -1, false);

    drawVines(b, true, false);

    // Multi-clustered weeping willow tree crown
    drawTreeCrown(b, true, false);

    // Near branch-arm attached at lower-rear shoulder so it swings cleanly BELOW the face & raises outward when casting
    drawBranchArm(-3.8, -15.2 + bob, casting ? -1 : 1, false, true);
    return;
  }

  // Front (`south`) and Rear (`north`) views
  drawRootLeg(-5.6, 1, rear);
  drawRootLeg(5.6, -1, !rear);

  // Symmetrical gnarled branch-arms reaching out from the bark shoulders
  drawBranchArm(-8.2, -17.5 + bob, -1, false, false);
  drawBranchArm(8.2, -17.5 + bob, 1, false, false);

  // Tapered gnarled tree trunk
  b(ink,
    [-9.2, -9.5], [-10.8, -17.5], [-10.6, -27], [10.6, -27], [10.8, -17.5], [9.2, -9.5], [5.8, -7.8], [-5.8, -7.8]);
  b(barkDeep,
    [-7.8, -10.2], [-9.2, -17.5], [-9.0, -25.8], [9.0, -25.8], [9.2, -17.5], [7.8, -10.2], [4.8, -9.0], [-4.8, -9.0]);
  b(barkMid,
    [-6.4, -10.8], [-7.8, -17.5], [-7.4, -25.2], [7.4, -25.2], [7.8, -17.5], [6.4, -10.8], [3.6, -9.6], [-3.6, -9.6]);
  // Vertical bark grain ridges
  b(barkLight, [-6.0, -24.2], [-3.6, -24.5], [-3.2, -11.5], [-5.2, -11.5]);
  b(barkLight, [3.6, -24.5], [6.0, -24.2], [5.2, -11.5], [3.2, -11.5]);
  // Diagonal vine wrap around waist
  b(leafDark, [-8.8, -13.2], [8.8, -11.2], [8.4, -9.5], [-8.4, -11.5]);
  b(moss, [-6.8, -12.6], [6.4, -10.9], [6.0, -9.9], [-6.4, -11.6]);

  if (!rear) {
    // Carved dark hollow treant face with glowing twin lantern eyes & mossy wooden beard
    b(ink, [-6.6, -23.2], [6.6, -23.2], [6.0, -17.2], [2.4, -15.2], [-2.4, -15.2], [-6.0, -17.2]);
    // Furrowed gnarled brow overhang
    b(barkLight, [-7.2, -24.4], [0, -23.0], [7.2, -24.4], [6.4, -22.4], [0, -21.4], [-6.4, -22.4]);
    // Twin marsh-amber eyes
    for (const s of [-1, 1]) {
      chip(b, s * 3.1 - 1.5, -21.0, 3.0, 2.2, eyeGlow);
      chip(b, s * 3.1 - 0.7, -20.6, 1.4, 1.3, eyeCore);
    }
    // Mossy root-beard hanging below the carved chin
    b(moss, [-2.6, -15.4], [2.6, -15.4], [2.0 + sway * 0.25, -11.6], [0 + sway * 0.25, -10.6], [-2.0 + sway * 0.25, -11.6]);
    if (casting) chip(b, -1.6, -17.8, 3.2, 1.5, bud);
  } else {
    // Rear gnarled trunk spine knot & vertical moss patch
    b(barkDeep, [-2.4, -24.8], [2.4, -24.8], [3.0, -13], [-3.0, -13]);
    b(moss, [-6.4, -21.5], [-1.5, -23], [-2.4, -14], [-6.6, -15]);
    b(mossLight, [-5.2, -21], [-2.6, -22], [-3.2, -16], [-5.2, -16.5]);
  }

  drawVines(b, false, rear);

  // Asymmetrical multi-clustered leafy canopy
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
