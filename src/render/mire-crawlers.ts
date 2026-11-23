import type { Facing } from "../engine/formation.ts";
import type { Point } from "../engine/types.ts";
import type { Shape } from "./pixel-sprite.ts";

export const CRAWL_FRAMES = 8;
export const CRAWL_ATTACK_PHASE_FRAMES = 3;

type Joint = readonly [x: number, y: number, radius: number];
const outline = "#16211b";
const TAU = 2 * Math.PI;

const mix = ([ax, ay]: Point, [bx, by]: Point, t: number): Point => [ax + (bx - ax) * t, ay + (by - ay) * t];

// Sculpted serpentine body: smooth continuous silhouette, pale bone belly, dark vine wraps & lime thorns.
function viperBody(
  p: Shape,
  spine: readonly Joint[],
  side: boolean,
  rear: boolean,
  spent: boolean,
) {
  const normals = spine.map(([x, y], i) => {
    const [ax, ay] = spine[i - 1] ?? [x, y];
    const [bx, by] = spine[i + 1] ?? [x, y];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    // Left-hand normal along spine (for side view moving right, positive offset is upward dorsal side)
    return [(by - ay) / len, (ax - bx) / len] as const;
  });
  const edge = (i: number, offset: number, pad = 0): Point => {
    const [x, y, radius] = spine[i];
    const [nx, ny] = normals[i];
    return [x + nx * (radius + pad) * offset, y + ny * (radius + pad) * offset];
  };
  const idx = spine.map((_, i) => i);
  const strip = (color: string, a: number, b: number, pad = 0) =>
    p(color, ...idx.map((i) => edge(i, a, pad)), ...idx.toReversed().map((i) => edge(i, b, pad)));

  const dark = "#2b4434";
  const mid = "#4a6a4a";
  const bright = "#7d9669";
  const bone = "#c9c09a";
  const boneShade = "#9e9776";
  const vine = "#33402e";
  const thorn = spent ? "#788265" : "#b3c96f";

  // Crisp outer ink outline + deep jade base + sunlit emerald flank
  strip(outline, 1, -1, 1.85);
  strip(dark, 1, -1);
  if (side) {
    // Upper dorsal emerald band & lower pale weathered-bone ventral plates
    strip(mid, 0.94, -0.32);
    strip(boneShade, -0.32, -0.95);
    strip(bone, -0.45, -0.88);
  } else {
    strip(mid, 0.88, -0.88);
    if (!rear) {
      // Raised pale segmented belly along the front centerline
      strip(boneShade, 0.42, -0.42);
      strip(bone, 0.28, -0.28);
    }
  }

  // Segment details: twisted bog-vine bands, pale bone dorsal chevrons & lime vine thorns
  for (let i = 1; i < spine.length - 1; i++) {
    const d0 = edge(i, 0.92), v0 = edge(i, -0.82);
    const d1 = edge(i + 1, 0.9), v1 = edge(i + 1, -0.82);
    if (side) {
      // Sunlit upper scale highlight
      p(bright, mix(d0, d1, 0.14), mix(d0, d1, 0.78), mix(edge(i, 0.36), edge(i + 1, 0.36), 0.7), edge(i, 0.36));
      // Ventral belly rib notches
      if (i >= 2) {
        p(dark, edge(i, -0.35), edge(i, -0.94), mix(v0, v1, 0.22), mix(edge(i, -0.35), edge(i + 1, -0.35), 0.2));
      }
      // Alternating dark bog-vine wrap & pale bone dorsal ridge plate
      if (i % 3 === 1 && i < spine.length - 2) {
        p(vine, mix(d0, d1, 0.08), mix(v0, v1, 0.42), mix(v0, v1, 0.66), mix(d0, d1, 0.36));
        const tip = edge(i, 1, 2.2);
        const bL = mix(d0, d1, 0.05), bR = mix(d0, d1, 0.44);
        p(outline, bL, [tip[0] - 0.8, tip[1] - 0.9], [tip[0] + 1.1, tip[1] - 0.2], bR);
        p(thorn, mix(bL, bR, 0.2), [tip[0], tip[1] - 0.1], mix(bL, bR, 0.8));
      }
    } else {
      // Front/rear markings
      if (rear) {
        // Muted dorsal bone ridge down the back
        if (i % 3 === 1) {
          const midA = mix(edge(i, 0.35), edge(i, -0.35), 0.5);
          const midB = mix(edge(i + 1, 0.35), edge(i + 1, -0.35), 0.5);
          p(boneShade,
            edge(i, 0.3), midA, edge(i, -0.3),
            mix(edge(i, -0.2), edge(i + 1, -0.2), 0.55), midB, mix(edge(i, 0.2), edge(i + 1, 0.2), 0.55));
        }
      } else if (i % 3 === 1) {
        // Belly plate shadow dividers
        p(dark, edge(i, 0.36), edge(i, -0.36), mix(edge(i, -0.36), edge(i + 1, -0.36), 0.26), mix(edge(i, 0.36), edge(i + 1, 0.36), 0.26));
      }
      // Sparse thorn spurs along outer coil bend
      if (i % 4 === 1 && i >= 2 && i <= 6) {
        const s = i % 8 === 1 ? 1 : -1;
        const base = edge(i, s * 0.92);
        const next = edge(i + 1, s * 0.92);
        const spur = edge(i, s, 1.8);
        p(outline, base, spur, next);
        p(thorn, mix(base, spur, 0.18), mix(base, spur, 0.85), mix(next, spur, 0.25));
      }
    }
  }

  // Thorny vine-leaf tail tip flourish
  const [tx, ty] = spine[0];
  const [t1x, t1y] = spine[1];
  const dx = tx - t1x, dy = ty - t1y;
  const tl = Math.hypot(dx, dy) || 1;
  const ux = dx / tl, uy = dy / tl;
  p(outline, [tx - uy * 1.4, ty + ux * 1.4], [tx + ux * 3.8, ty + uy * 3.8], [tx + uy * 1.4, ty - ux * 1.4]);
  p(thorn, [tx - uy * 0.7, ty + ux * 0.7], [tx + ux * 2.6, ty + uy * 2.6], [tx + uy * 0.7, ty - ux * 0.7]);
}

// Flared thorny cobra-vine hood behind the upper neck
function viperHood(
  p: Shape,
  x: number,
  y: number,
  side: boolean,
  rear: boolean,
  flare: number,
  spent: boolean,
) {
  const h: Shape = (color, ...pts) => p(color, ...pts.map(([dx, dy]): Point => [x + dx * 1.14, y + dy * 1.14]));
  const hoodDark = "#2b4033";
  const hoodMid = "#4a6a4a";
  const hoodRim = "#7d9669";
  const bone = "#cfc49b";
  const thorn = spent ? "#788265" : "#b3c96f";
  const sacOuter = spent ? "#5d6953" : "#9caf62";
  const sacGlow = spent ? "#7a856b" : "#e6f2a8";

  if (side) {
    const f = flare;
    // Swept dorsal vine-collar & spiny crest arching behind the head
    h(outline,
      [-7 - f * 1.5, -4], [-5 - f * 1.4, -9 - f * 0.7], [-1 - f * 0.4, -10.5 - f * 0.7],
      [3.5, -7.5], [4.5, 2], [-1, 6.5], [-6.5, 4.5], [-8.5 - f * 1.2, 0.5]);
    h(hoodDark,
      [-5.5 - f * 1.2, -3.5], [-4 - f, -7.6 - f * 0.5], [-0.8 - f * 0.3, -8.8 - f * 0.5],
      [2.5, -6], [3, 1.5], [-1, 5], [-5.2, 3.5], [-6.8 - f, 0.5]);
    h(hoodMid,
      [-4.2 - f * 0.8, -4.5], [-1.2, -7.8 - f * 0.4], [2, -5.2], [1.5, 1], [-3, 2.5], [-5.2 - f * 0.6, -0.5]);
    // Pale bone hood-ribs
    h(bone, [-4.5 - f * 0.6, -5.2], [-1.5, -6.8 - f * 0.3], [-1, -5], [-3.8 - f * 0.4, -3.4]);
    h(bone, [-5 - f * 0.7, -1.6], [-2, -2.5], [-1.8, -0.8], [-4.4 - f * 0.5, 0.2]);
    // Twin thorny vine spurs along back edge of hood
    for (const [sx, sy, ox, oy] of [
      [-4.5 - f * 1.1, -6.5 - f * 0.5, -3.2, -2.5],
      [-6.5 - f * 1.1, -1.8, -3.4, -0.6],
      [-5.2 - f * 0.8, 2.6, -2.8, 1.4],
    ]) {
      h(outline, [sx, sy - 1.4], [sx + ox, sy + oy], [sx + 0.6, sy + 1.5]);
      h(thorn, [sx, sy - 0.6], [sx + ox * 0.75, sy + oy * 0.75], [sx + 0.3, sy + 0.7]);
    }
    // Bioluminescent throat venom sac tucked under jaw/front neck
    const sacR = (spent ? 1.8 : 2.8) + f * 1.15;
    h(outline, [0.5, 0.2], [4.5 + sacR * 0.6, 0.5], [5 + sacR * 0.85, 3.4 + sacR * 0.4],
      [2.2 + sacR * 0.3, 5.6 + sacR * 0.5], [-1.6, 4.4 + sacR * 0.2]);
    h(sacOuter, [1.2, 1.1], [4.1 + sacR * 0.45, 1.4], [4.3 + sacR * 0.65, 3.4 + sacR * 0.3],
      [2 + sacR * 0.2, 4.7 + sacR * 0.35], [-0.8, 3.8 + sacR * 0.15]);
    if (!spent) {
      h(sacGlow, [1.8, 1.8], [3.6 + sacR * 0.35, 2], [3.5 + sacR * 0.45, 3.5 + sacR * 0.2], [1.6, 3.8 + sacR * 0.15]);
    }
    return;
  }

  // Front & Rear symmetrical cobra-vine hood
  const w = 9.5 + flare * 1.8;
  h(outline,
    [-w, -1], [-w * 0.92, -6.5], [-w * 0.55, -10], [0, -10.5],
    [w * 0.55, -10], [w * 0.92, -6.5], [w, -1],
    [w * 0.75, 5], [w * 0.36, 8.5], [-w * 0.36, 8.5], [-w * 0.75, 5]);
  h(hoodDark,
    [-w + 1.4, -1], [-w * 0.8, -5.8], [-w * 0.48, -8.5], [0, -9],
    [w * 0.48, -8.5], [w * 0.8, -5.8], [w - 1.4, -1],
    [w * 0.62, 4.2], [w * 0.3, 7], [-w * 0.3, 7], [-w * 0.62, 4.2]);
  h(hoodMid,
    [-w + 2.6, -1.2], [-w * 0.68, -5.5], [-w * 0.38, -7.8], [0, -8.2],
    [w * 0.38, -7.8], [w * 0.68, -5.5], [w - 2.6, -1.2],
    [w * 0.5, 3.4], [-w * 0.5, 3.4]);

  // Serrated vine-thorns projecting off both hood wings
  for (const s of [-1, 1]) {
    for (const [ty, len] of [[-5.5, 2.8], [-0.5, 3.0]]) {
      const bx = s * (w - 0.8);
      h(outline, [bx, ty - 1.4], [bx + s * len, ty - 0.4], [bx, ty + 1.4]);
      h(thorn, [bx, ty - 0.6], [bx + s * (len - 0.8), ty - 0.3], [bx, ty + 0.6]);
    }
  }

  if (rear) {
    // Bold pale bone-chevron crest on the back of the hood
    h(hoodRim, [-w * 0.52, -5.5], [0, -7.6], [w * 0.52, -5.5], [w * 0.36, 1.5], [0, 3.5], [-w * 0.36, 1.5]);
    h(bone, [-4.2, -5.4], [0, -7], [4.2, -5.4], [2.4, -3.2], [0, -4.4], [-2.4, -3.2]);
    h(bone, [-3.6, -1.4], [0, -2.8], [3.6, -1.4], [2, 0.8], [0, -0.4], [-2, 0.8]);
    h(bone, [-2.4, 2.6], [0, 1.5], [2.4, 2.6], [1.2, 4.4], [0, 3.6], [-1.2, 4.4]);
    if (!spent && flare > 0.5) {
      for (const s of [-1, 1]) {
        h(sacGlow, [s * (w * 0.65), 1], [s * (w * 0.86), 2.5], [s * (w * 0.62), 4.8]);
      }
    }
  } else {
    // Front hood: pale ribbed bone belly column + twin glowing venom glands
    h(bone, [-3.4, -3], [3.4, -3], [3.8, 6.8], [-3.8, 6.8]);
    for (const yRib of [-0.5, 2, 4.5]) {
      h(hoodDark, [-3.3, yRib], [3.3, yRib], [3.3, yRib + 0.9], [-3.3, yRib + 0.9]);
    }
    for (const s of [-1, 1]) {
      h(hoodRim, [s * 4.4, -5.5], [s * (w - 3), -4.2], [s * (w - 3.2), 1.5], [s * 4.4, 2.5]);
      // Twin venom sacs framing the lower neck
      const gx = s * (3.8 + flare * 0.8);
      const gw = (spent ? 1.5 : 2.3) + flare * 0.7;
      h(outline, [gx - gw, 1], [gx, -0.8 - flare * 0.4], [gx + gw, 1], [gx + gw * 0.8, 4.5 + flare * 0.4], [gx - gw * 0.8, 4.5 + flare * 0.4]);
      h(sacOuter, [gx - gw * 0.72, 1.3], [gx, 0 - flare * 0.3], [gx + gw * 0.72, 1.3], [gx + gw * 0.55, 3.8 + flare * 0.3], [gx - gw * 0.55, 3.8 + flare * 0.3]);
      if (!spent) {
        h(sacGlow, [gx - gw * 0.42, 1.6], [gx, 0.8], [gx + gw * 0.42, 1.6], [gx, 3.2 + flare * 0.2]);
      }
    }
  }
}

function viperHead(
  p: Shape,
  x: number,
  y: number,
  side: boolean,
  rear: boolean,
  jaw: number,
  tongue: boolean,
  spitting: boolean,
  spent: boolean,
) {
  const h: Shape = (color, ...pts) => p(color, ...pts.map(([dx, dy]): Point => [x + dx * 1.16, y + dy * 1.16]));
  const dark = "#2b4434";
  const emerald = "#4f7050";
  const bright = "#8aa172";
  const bone = "#d2c7a0";
  const eye = "#f0bf4a";
  const eyeGlow = "#fff0a8";
  const venom = spent ? "#85966c" : "#d7e98c";
  const mouth = "#4a2334";

  if (side) {
    // Sharp angular venomous viper head with arched brow-crest & hinged fanged jaw
    h(outline,
      [-7.5, -2.5], [-5.5, -7.2], [-1, -8.8], [5.5, -7.4], [9.5, -4.8], [10.4, -2],
      [7.8, 0.2], [8.6, 1.6 + jaw], [5.6, 3.4 + jaw], [-1.5, 3 + jaw * 0.6], [-6.5, 1.2]);
    // Upper skull
    h(dark, [-6, -2.5], [-4.5, -6], [-0.8, -7.4], [5, -6.2], [8.5, -4], [9, -2], [4, -1.2], [-1.5, 0.2], [-5.2, -0.2]);
    h(emerald, [-5, -3], [-3.8, -5.6], [-0.5, -6.8], [4.6, -5.8], [7.8, -3.9], [7.8, -2.5], [3.8, -2.2], [-1, -1.2], [-4.5, -1.4]);
    // Sunlit brow & bone crown plate
    h(bright, [-3.4, -5.4], [-0.2, -6.5], [4.2, -5.6], [6.6, -4.1], [3.5, -4.1], [0, -4.8]);
    h(bone, [-4.8, -5.8], [-2.2, -7.2], [1.4, -6.8], [-0.4, -5.4], [-3.2, -4.8]);
    // Open mouth interior + lower jaw
    if (jaw > 0.5) {
      h(mouth, [0.8, -1.4], [7.6, -1.6], [7.4, 0.8 + jaw], [1.2, 1.4 + jaw * 0.7]);
    }
    h(bone, [-2.2, 1.1], [2.4, 0.6 + jaw * 0.8], [7.4, 0.2 + jaw], [6.2, 2 + jaw], [1.2, 2.2 + jaw * 0.7], [-3.6, 1.2]);
    // Fierce shadowed eye socket + amber slit-pupil eye
    h(outline, [-2.4, -4.8], [1.4, -5.4], [4.8, -4.4], [2.8, -2.1], [-0.8, -2.2]);
    h(eye, [0.1, -4.6], [3.3, -4.3], [2.7, -2.6], [0.2, -2.8]);
    h(eyeGlow, [0.4, -4.3], [1.6, -4.2], [1.4, -3.2], [0.5, -3.2]);
    h(outline, [1.5, -4.4], [2.2, -4.3], [2, -2.7], [1.5, -2.7]);
    // Twin curved ivory venom fangs + glowing acid venom bead when spitting
    if (jaw >= 2) {
      h("#fff7dc", [4.8, -1.5], [6.8, -1.6], [5.8, 2.1]);
      h("#fff7dc", [6.8, -1.7], [8.3, -1.7], [7.7, 1.3]);
      if (spitting && !spent) {
        h(outline, [7.6, -1], [11.6, -1.6], [12.4, 0.6], [9.6, 2.2], [7.2, 0.8]);
        h(venom, [8.1, -0.4], [10.8, -0.8], [11.2, 0.5], [9.3, 1.4], [7.8, 0.5]);
        h("#f4ffb8", [8.8, -0.2], [10.2, -0.2], [9.9, 0.7], [8.8, 0.6]);
      }
    }
    // Flickering crimson forked tongue
    if (tongue) {
      h("#e8586e", [8.4, -1], [11.8, -0.8], [13.4, -2.3], [12.6, -0.5], [14.2, 0.4], [11.5, 0.2], [8.4, -0.1]);
    }
    return;
  }

  // Front & Rear angular diamond viper head
  h(outline,
    [-7.4, -3.4], [-5.2, -7.8], [0, -9.2], [5.2, -7.8], [7.4, -3.4],
    [5.8, 1.2], [2.4, 3.6 + jaw], [-2.4, 3.6 + jaw], [-5.8, 1.2]);
  h(dark,
    [-6, -3.4], [-4.2, -6.6], [0, -7.8], [4.2, -6.6], [6, -3.4],
    [4.6, 0.6], [1.8, 2.2 + jaw * 0.4], [-1.8, 2.2 + jaw * 0.4], [-4.6, 0.6]);
  h(emerald,
    [-5.2, -3.6], [-3.6, -6.2], [0, -7.2], [3.6, -6.2], [5.2, -3.6],
    [3.8, -0.2], [0, 1.2], [-3.8, -0.2]);
  // Pale bone-crest diamond crown on forehead
  h(bone, [-3.4, -5.2], [0, -7.1], [3.4, -5.2], [1.6, -2.8], [0, -1.6], [-1.6, -2.8]);
  h(bright, [-1.5, -5.8], [0, -6.6], [1.5, -5.8], [0, -4.4]);

  if (!rear) {
    // Fierce golden slit eyes under furrowed emerald brow ridges
    for (const s of [-1, 1]) {
      h(outline, [s * 2.1, -4.2], [s * 5.6, -4.4], [s * 5.2, -1.3], [s * 2.6, -1.2]);
      h(eye, [s * 2.7, -3.6], [s * 4.9, -3.6], [s * 4.5, -1.9], [s * 3.1, -1.9]);
      h(outline, [s * 3.6, -3.5], [s * 4.2, -3.5], [s * 4, -1.9], [s * 3.6, -1.9]);
    }
    // Open fanged jaws & acid droplet
    if (jaw > 0.5) {
      h(mouth, [-3.6, 0.2], [3.6, 0.2], [2.4, 2.6 + jaw], [-2.4, 2.6 + jaw]);
      h(bone, [-3, 1.4 + jaw * 0.7], [3, 1.4 + jaw * 0.7], [1.8, 2.9 + jaw], [-1.8, 2.9 + jaw]);
      for (const s of [-1, 1]) {
        h("#fff7dc", [s * 1.4, 0.2], [s * 2.9, 0.2], [s * 2.2, 2.7 + jaw * 0.35]);
      }
      if (spitting && !spent) {
        h(venom, [-1.6, 1.2], [1.6, 1.2], [2.1, 3.2 + jaw * 0.4], [0, 4.6 + jaw * 0.4], [-2.1, 3.2 + jaw * 0.4]);
        h("#f4ffb8", [-0.7, 1.9], [0.7, 1.9], [0.5, 3.2 + jaw * 0.3], [-0.5, 3.2 + jaw * 0.3]);
      }
    }
    if (tongue) {
      h("#e8586e", [-0.65, 1.7], [0.65, 1.7], [1.2, 5.4], [0, 4.2], [-1.2, 5.4]);
    }
  }
}

// [reachX, headY, hoodFlare, jawOpen]
const viperSpit = [
  [11, -17, 1.2, 0], [9, -20, 2.2, 0.5], [7, -22, 3.0, 1.2],
  [17, -18, 2.4, 4.2], [15, -16, 1.4, 2.5], [13, -13, 0.4, 0],
] as const;
const viperBite = [
  [12, -12, 0.8, 0], [9, -14, 1.6, 0.6], [7, -16, 2.2, 1.4],
  [18, -10, 1.6, 4.2], [15, -11, 1.0, 2.2], [13, -12, 0.2, 0],
] as const;

export function paintVineViper(p: Shape, frame: number, facing: Facing, spent: boolean) {
  const side = facing === "east" || facing === "west";
  const rear = facing === "north";
  const attacking = frame >= CRAWL_FRAMES;
  const biting = frame >= CRAWL_FRAMES + viperSpit.length;
  const phaseIdx = attacking ? (biting ? frame - CRAWL_FRAMES - viperSpit.length : frame - CRAWL_FRAMES) : -1;
  const pose = attacking ? (biting ? viperBite[phaseIdx] : viperSpit[phaseIdx]) : undefined;
  const spitting = attacking && !biting && (phaseIdx === 3 || phaseIdx === 4);
  const wave = (frame % CRAWL_FRAMES) * TAU / CRAWL_FRAMES;
  const [reach, headY, flare, jaw] = pose ?? [
    13 + Math.sin(wave) * 1.3,
    -13 + Math.sin(wave - 0.5) * 1.2,
    0.35 + Math.sin(wave) * 0.15,
    0,
  ];

  // Build a longer serpentine spine that crawls in wide S-coils before rising into the hood.
  const spine: Joint[] = [];
  const count = 14;
  const coilCount = 10;
  const radii = [0.9, 1.4, 2.0, 2.6, 3.2, 3.8, 4.3, 4.7, 5.0, 5.2, 5.2, 5.0, 4.7, 4.2];
  const tighten = attacking ? 0.86 : 1;
  for (let i = 0; i < count; i++) {
    if (i < coilCount) {
      const t = i / (coilCount - 1);
      const blend = Math.max(0, (t - 0.7) / 0.3);
      const smooth = blend * blend * (3 - 2 * blend);
      if (side) {
        const amp = (4.2 - t * 1.4) * tighten;
        const xBase = -20 + t * (reach + 15.5);
        const yBase = -3.4 + Math.sin(t * TAU * 1.9 + wave) * amp +
          Math.sin(wave - t * TAU * 0.8) * 0.4;
        spine.push([xBase * (1 - smooth) + (reach - 4.5) * smooth,
          yBase * (1 - smooth) - 4.5 * smooth, radii[i]]);
      } else {
        const amp = (rear ? 5.2 : 6.0) * (1 - t * 0.55) * tighten;
        const sway = Math.sin(t * TAU * 1.7 + wave * (rear ? 0.9 : 1)) * amp + t * 1.2;
        spine.push([sway * (1 - smooth) + 1.2 * smooth,
          (-2.2 - t * 2.3) * (1 - smooth) - 4.5 * smooth, radii[i]]);
      }
      continue;
    }
    // Neck/chest: rise from the end of the crawl into the hood and head.
    const u = (i - coilCount + 1) / (count - coilCount);
    spine.push([
      side ? (reach - 4.5) + 4.0 * u - flare * 0.4 * u : 1.2 + (0 - 1.2) * u,
      -4.5 + (headY + 4.5) * u,
      radii[i],
    ]);
  }

  const [nx, ny] = spine[count - 2];
  const [hx, hy] = spine[count - 1];

  if (side) {
    viperBody(p, spine, true, false, spent);
    viperHood(p, nx + 0.6, ny - 0.8, true, false, flare, spent);
    viperHead(p, reach - 0.5, headY, true, false, jaw,
      !attacking && !spent && (frame === 1 || frame === 2 || frame === 6), spitting, spent);
  } else if (rear) {
    // Rear view: head & hood first, then spine overlaps slightly from behind for depth
    viperHead(p, hx, hy - 3.2, false, true, jaw, false, false, spent);
    viperHood(p, nx, ny - 0.5, false, true, flare, spent);
    viperBody(p, spine.slice(0, coilCount), false, true, spent);
  } else {
    // Front view: coiled body behind, then flared thorny hood, then fierce viper head in front
    viperBody(p, spine, false, false, spent);
    viperHood(p, nx, ny - 0.8, false, false, flare, spent);
    viperHead(p, hx, hy - 3.0, false, false, jaw,
      !attacking && !spent && (frame === 1 || frame === 2 || frame === 6), spitting, spent);
  }
}
