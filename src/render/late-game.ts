import type { Facing } from "../engine/formation.ts";
import type { EnemyId } from "../engine/types.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";

export type NewEnemy = Extract<EnemyId, "moth" | "wisp" | "ram" | "cinder-bat">;

export function paintNewEnemy(
  type: NewEnemy,
  r: Rect,
  p: Shape,
  frame: number,
  facing: Facing,
  charging: boolean,
  striking = false,
) {
  const side = facing === "east" || facing === "west",
    rear = facing === "north";
  const step = [1, 0, -1, 0][frame];
  if (type === "cinder-bat") {
    const lift = striking ? -9 : [-11, -6, 3, -4][frame];
    const outline = "#292634", membrane = "#864b46", rim = "#ce815e";
    for (const sideWing of [-1, 1]) {
      const w = (side && sideWing === 1 ? .68 : 1) * (striking ? .83 : 1);
      const wing = (color: string, points: readonly [number, number][]) =>
        p(color, ...points.map(([x, y]): [number, number] => [x * sideWing * w, y]));
      wing(outline, [[1,-14],[9,-18+lift],[18,-21+lift],[24,-17+lift],
        [22,-9+lift],[16,-12+lift],[14,-5+lift*.6],[9,-9],[5,-5]]);
      wing(membrane, [[4,-14],[11,-18+lift],[18,-19+lift],[22,-16+lift],
        [21,-12+lift],[16,-14+lift],[13,-8+lift*.6],[9,-11],[6,-7]]);
      wing(rim, [[4,-14],[11,-18+lift],[18,-19+lift],[21,-17+lift],
        [17,-17+lift],[13,-16+lift],[9,-12]]);
      wing("#5c3941", [[10,-14],[15,-16+lift],[16,-14+lift],[13,-9+lift*.6]]);
    }
    const head = side ? 5 : 0;
    p(outline, [head-9,-9],[head-9,-19],[head-7,-25],[head-4,-22],[head+3,-22],
      [head+7,-26],[head+9,-20],[head+9,-11],[head+5,-6],[head,-4],[head-6,-6]);
    p("#564055", [head-7,-10],[head-7,-20],[head-6,-22],[head-3,-19.5],[head+4,-20],
      [head+6,-23],[head+7,-19],[head+7,-11],[head+4,-7],[head-5,-7]);
    r(head-5.5,-20,2,2,"#ad6e65");
    r(head+5,-21,1.5,2,"#da9677");
    if (!rear) {
      r(head-4,-16,2.5,1.5,"#ffc27b");
      r(head+3,-16.5,2.5,1.5,"#ffdb92");
      if (striking) {
        p("#2b2234", [head-3,-12],[head+7,-13],[head+6,-8],[head+3,-5],[head-1,-7]);
        r(head+1,-12,1,2,"#f7e3b8");
        r(head+4,-12,1,2.5,"#fff2cf");
        r(head+2,-8,2.5,1,"#ad6762");
      } else {
        r(head-.5,-12,2.5,1.75,"#302630");
        r(head+1.25,-11.5,.75,1.5,"#f7e3b8");
      }
    } else {
      p("#8b5c63", [-4,-17],[0,-18],[4,-16],[3,-14],[0,-11],[-3,-14]);
    }
    return;
  }
  if (type === "moth") {
    const flap = striking ? 1 : frame % 2 === 0 ? 5 : 1;
    const ink = "#28332f", wingDark = "#60756d", wingMid = "#8fa69a", wingLight = "#cdd6c1";
    const fur = "#d6ceb2", body = "#8b9b8d", accent = "#cf8f7a", eye = "#f0c46a";
    if (side) {
      // Far wing and lower hind wing behind the compact body.
      p(ink, [-2, -9], [-11, -15 - flap], [-19, -12 - flap], [-17, -4], [-9, 0], [-2, -2]);
      p(wingDark, [-3, -9], [-10, -13 - flap], [-17, -11 - flap], [-15, -5], [-8, -2], [-4, -3]);
      p(wingMid, [-4, -10], [-10, -13 - flap], [-14, -11 - flap], [-12, -7 - flap], [-7, -4]);
      p(ink, [-1, -7], [-8, -8 - flap * .4], [-13, -3], [-8, 1], [-2, -1]);
      p(wingDark, [-2, -7], [-7, -7 - flap * .35], [-11, -3], [-7, -1], [-3, -2]);
      // Near upper wing with one pale accent stripe.
      p(ink, [0, -10], [-9, -17 - flap], [-17, -14 - flap], [-15, -5], [-7, -1], [-1, -3]);
      p(wingMid, [-1, -10], [-8, -15 - flap], [-15, -13 - flap], [-13, -6], [-6, -2], [-2, -4]);
      p(wingLight, [-2, -11], [-8, -14 - flap], [-12, -13 - flap], [-10, -9 - flap], [-5, -5]);
      p(accent, [-6, -14 - flap], [-9, -13 - flap], [-9, -10 - flap], [-6, -11]);
      // Wing veins and a pale eyespot keep the flange readable at 1x.
      r(-8, -13 - flap, 4.2, .6, "#53665e");
      r(-5.5, -9.5 - flap * .3, 3.4, .6, "#53665e");
      r(-9, -12 - flap, 2.6, 2.6, accent);
      r(-8.2, -11.2 - flap, 1.2, 1.2, fur);
      // Round fuzzy body, banded abdomen and tucked legs.
      p(ink, [-1, -5], [0, -16], [4, -17], [7, -11], [6, -4], [3, -1]);
      p(body, [0, -6], [1, -14.5], [4, -15.5], [6, -11], [5, -5], [3, -2]);
      r(2, -9, 4, 4, fur);
      r(1, -13, 2, 2, accent);
      r(.7, -7, 2.2, .7, accent);
      r(.6, -5, 2, .6, "#6e8074");
      r(2, -2, .9, 2, ink);
      r(4.2, -2, .9, 2, ink);
      r(3, -17, 1, 5, ink);
      r(4, -17, 1, 5, ink);
      p(ink, [3, -17], [6, -21], [7.2, -20.4], [4, -17]);
      p(ink, [4, -17], [2, -21], [.8, -20.4], [3, -17]);
      r(4, -11, 2.2, 2.2, eye);
      r(5, -10.4, 1, 1, ink);
      r(4.5, -10.9, .7, .7, "#fff0b0");
      if (striking) {
        r(5.2, -6.2, 3.4, .8, "#6d6580");
        r(6.6, -4.6, 2.6, .7, "#d6ceb2");
        p("#f0c46a", [7.6, -6], [8.6, -5.6], [8.2, -4.8]);
      }
    } else {
      const drawWing = (sx: number, near: boolean) => {
        p(ink, [sx * 2, -9], [sx * 14, -16 - flap], [sx * 23, -11 - flap], [sx * 19, -3], [sx * 8, 0], [sx * 2, -3]);
        p(near ? wingMid : wingDark, [sx * 3, -9], [sx * 13, -14 - flap], [sx * 20, -10 - flap], [sx * 17, -4], [sx * 8, -2], [sx * 3, -4]);
        p(near ? wingLight : wingMid, [sx * 4, -10], [sx * 12, -13 - flap], [sx * 17, -10 - flap], [sx * 13, -7], [sx * 7, -4]);
        p(accent, [sx * 15, -12 - flap], [sx * 19, -10 - flap], [sx * 16, -8], [sx * 13, -9]);
        r(sx * 13 - 1.6, -11 - flap, 3.2, 3.2, accent);
        r(sx * 13 - .8, -10.2 - flap, 1.4, 1.4, fur);
        r(sx * 6 - 2, -8, 4, .6, "#53665e");
        r(sx * 9 - 2, -5, 3, .6, "#53665e");
      };
      drawWing(-1, false);
      drawWing(1, true);
      p(ink, [-4, -5], [-4, -16], [-1, -19], [3, -18], [5, -13], [4, -4], [0, -1]);
      p(body, [-3, -6], [-3, -15], [-1, -17], [2, -16.5], [4, -12], [3, -5], [0, -2.5]);
      r(-3, -14, 6, 5, fur);
      r(-4, -20, 1, 5, ink);
      r(3, -20, 1, 5, ink);
      r(-2, -9, 4, 3, accent);
      r(-2.4, -7, 1.6, .7, "#6e8074");
      r(-1, -5.5, 1.5, .6, accent);
      for (const lx of [-5, 0, 5]) r(lx, -2, .9, 2, ink);
      p(ink, [-4, -20], [-6, -24], [-4.8, -24.4], [-2.8, -20.5]);
      p(ink, [4, -20], [6, -24], [4.8, -24.4], [2.8, -20.5]);
      if (!rear) {
        for (const ex of [-4.5, 2.5]) {
          r(ex, -12, 2.2, 2.2, eye);
          r(ex + .6, -11.4, 1, 1, ink);
          r(ex + .4, -11.8, .7, .7, "#fff0b0");
        }
      } else {
        p(accent, [-5, -11], [0, -13], [5, -11], [3, -7], [0, -6], [-3, -7]);
      }
    }
    return;
  }
  if (type === "wisp") {
    const lean = side ? 3 : 0,
      bob = step * 2;
    p(
      "#2d576b",
      [-15, -4 + bob],
      [-10, -13 + bob],
      [-8, -23 + bob],
      [1, -30 + bob],
      [8, -24 + bob],
      [11, -12 + bob],
      [16, -5 + bob],
      [7, -5 + bob],
      [4, 2 + bob],
      [0, -2 + bob],
      [-5, 1 + bob],
    );
    p(
      "#669ab7",
      [-12, -6 + bob],
      [-7, -14 + bob],
      [-6, -23 + bob],
      [1, -28 + bob],
      [7, -22 + bob],
      [8, -13 + bob],
      [12, -7 + bob],
      [3, -9 + bob],
      [0, -2 + bob],
      [-5, -9 + bob],
    );
    p(
      "#addfee",
      [-6, -14 + bob],
      [-4, -22 + bob],
      [1, -26 + bob],
      [5, -21 + bob],
      [4, -14 + bob],
      [-1, -11 + bob],
    );
    p(
      "#e3fafa",
      [-5, -15 + bob],
      [-3, -21 + bob],
      [0, -24 + bob],
      [0, -19 + bob],
      [-3, -15 + bob],
    );
    r(-9, -9 + bob, 3, 1, "#77b4cf");
    r(8, -10 + bob, 3, 1, "#8ccbe3");
    r(-9, -3 + bob, 2, 2, "#a1d4ed");
    r(10, -4 + bob, 2, 1, "#b6eef2");
    r(-13, -17 - step, 1, 2, "#b6eef2");
    r(12, -17 + step, 1, 2, "#b6eef2");
    p("#96d5dc", [-12, -6 + bob], [-7, -11 + bob], [-5, -16 + bob],
      [-3, -13 + bob], [-5, -7 + bob], [-10, -4 + bob]);
    p("#d4eff1", [-7, -8 + bob], [-3.5, -12 + bob], [-1.5, -11 + bob],
      [-3, -5 + bob], [-6, -1 + bob]);
    r(-10, -5 + bob, 1, 2, "#c5ecef");
    if (rear) {
      r(-2, -18 + bob, 4, 2, "#81c7da");
      r(-1, -17 + bob, 2, 7, "#558fa8");
      r(0, -16 + bob, 1, 3, "#bbe5f0");
    }
    else {
      r(-4 + lean, -15 + bob, 2, 2, "#2d536b");
      r(2 + lean, -15 + bob, 2, 2, "#2d536b");
      r(-1 + lean, -11 + bob, 2, 1, "#effaf5");
    }
    return;
  }
  // 雪冠犀 (Snow-Crown Rhino): heavy armored glacial rhinoceros with segmented hide plates,
  // crystalline snow-crown dorsal crest, twin ice horns, 4 articulated legs, and a lowered ramming charge pose.
  const ink = "#1f2e38";
  const hideDeep = "#3c5461";
  const hideDark = "#587584";
  const hide = "#7b9ba6";
  const hideHi = "#a8c7cf";
  const snow = "#e8f6f7";
  const crownDeep = "#387893";
  const crownMid = "#6ec1d8";
  const crownBright = "#c6f4ff";
  const crownGlint = "#f5ffff";
  const hoof = "#2a3741";
  const nail = "#97adb5";
  const eyeColor = charging ? "#ff9345" : "#ffe085";

  const stride = [2.2, 0.4, -2.2, -0.4][frame] * (charging ? 1.35 : 1);
  const bob = charging ? [0, -1.6, 0.5, -1.2][frame] : (frame % 2 ? -0.9 : 0);

  const drawCrownSpike = (cx: number, cy: number, w: number, h: number, lean = 0) => {
    p(ink, [cx - w, cy + 1.5], [cx + lean - 0.8, cy - h], [cx + lean + 1.2, cy - h + 0.8], [cx + w, cy + 1.5]);
    p(crownDeep, [cx - w + 1.2, cy + 0.8], [cx + lean, cy - h + 1.6], [cx + w - 1.2, cy + 0.8]);
    p(crownMid, [cx - w + 1.5, cy + 0.6], [cx + lean, cy - h + 1.8], [cx + lean * 0.35 + 0.6, cy + 0.6]);
    p(crownBright, [cx - w * 0.4, cy - 0.5], [cx + lean, cy - h + 2.2], [cx + lean + 0.5, cy - h + 5.2], [cx - 0.2, cy]);
  };

  if (side) {
    const leg = (x: number, fore: boolean, far: boolean) => {
      const s = (fore !== far ? stride : -stride);
      const lift = charging ? Math.max(0, (fore !== far ? [0, 2.4, 0, 0.8] : [0.8, 0, 2.4, 0])[frame]) : Math.max(0, -s * 0.45);
      const topY = -14.5 + bob * 0.5;
      const footX = x + s + (charging && fore ? 2 : 0);
      const footY = (far ? 0 : 2.8) - lift;
      const kneeX = (x + footX) * 0.5 + (fore ? 1.2 : -1.4);
      const kneeY = (topY + footY) * 0.5;
      p(ink,
        [x - 5.2, topY], [x + 5.2, topY], [kneeX + 4.8, kneeY],
        [footX + 4.8, footY - 2.6], [footX + 5.2, footY + 1], [footX - 4.8, footY + 1],
        [footX - 5.2, footY - 2.6], [kneeX - 4.8, kneeY]);
      p(far ? hideDeep : hideDark,
        [x - 3.8, topY + 0.8], [x + 3.8, topY + 0.8], [kneeX + 3.4, kneeY],
        [footX + 3.4, footY - 1.8], [footX - 3.4, footY - 1.8], [kneeX - 3.4, kneeY]);
      if (!far) {
        p(hide, [x - 2.6, topY + 0.8], [x + 3, topY + 0.8], [kneeX + 2.4, kneeY], [footX + 1.2, footY - 3.2], [kneeX - 1.8, kneeY - 0.8]);
        // Armored knee cap ridge
        r(kneeX - 1.6, kneeY - 1.4, 3.8, 1.5, hideHi);
      }
      p(hoof, [footX - 3.8, footY - 2.4], [footX + 3.8, footY - 2.4], [footX + 4, footY], [footX - 4, footY]);
      if (!far) {
        r(footX + 0.8, footY - 1.8, 2, 1.4, nail);
        r(footX - 2, footY - 1.8, 1.8, 1.4, nail);
      }
    };

    // Short frosted rhino tail at rear
    const tailWag = [0, 1.5, 0.5, -1][frame] + (charging ? -2 : 0);
    p(ink, [-22, -18 + bob], [-26.5, -14 + bob + tailWag], [-25.5, -10 + bob + tailWag], [-22, -12 + bob], [-20, -16 + bob]);
    p(hideDark, [-22, -17 + bob], [-25, -14 + bob + tailWag], [-24.4, -11.5 + bob + tailWag], [-21.5, -13.5 + bob]);
    r(-25.6, -13 + bob + tailWag, 2, 2.2, snow);

    // Far legs
    leg(-15.5, false, true);
    leg(5.5, true, true);

    // Heavy armored rhino torso with shoulder shield, barrel rib plate & haunch plate
    const pitch = charging ? 1.8 : 0;
    const shY = -31 + bob + pitch;
    const rpY = -28 + bob - pitch * 0.4;
    p(ink,
      [-23.5, -11 + bob], [-23.5, -21 + bob], [-17, rpY], [-8, rpY - 2],
      [1, shY], [10, shY + 2], [17, -20 + bob + pitch],
      [18, -10 + bob + pitch], [12, -4.5 + bob + pitch], [0, -4.5 + bob], [-15, -5 + bob], [-21, -7 + bob]);
    p(hideDeep,
      [-21.8, -11.5 + bob], [-21.8, -20.5 + bob], [-16, rpY + 1.5], [-7.5, rpY - 0.4],
      [1, shY + 1.6], [9.2, shY + 3.4], [15.5, -19.5 + bob + pitch],
      [16.2, -10.5 + bob + pitch], [11, -6.2 + bob + pitch], [0, -6.2 + bob], [-14.5, -6.6 + bob]);
    p(hideDark,
      [-21, -15 + bob], [-20.5, -21 + bob], [-15, rpY + 2], [-7, rpY], [1.5, shY + 2],
      [9, shY + 3.8], [15, -19 + bob + pitch], [14.5, -11 + bob + pitch], [8, -8 + bob + pitch], [-13, -8.5 + bob]);
    // Rear haunch armor plate
    p(hide, [-20, -14 + bob], [-19.5, -21 + bob], [-14.5, rpY + 2.5], [-8.5, rpY + 1], [-9.5, -11 + bob], [-17, -10 + bob]);
    p(hideHi, [-18, -20 + bob], [-14, rpY + 3], [-9.5, rpY + 2], [-11, -18 + bob], [-17, -17 + bob]);
    // Mid barrel rib armor band
    p(hide, [-7.5, rpY + 1], [1, shY + 2.6], [1.5, -10 + bob], [-7.5, -10.5 + bob]);
    p(hideHi, [-6.5, rpY + 2], [0.5, shY + 3.4], [0, -17 + bob], [-6.5, -17.5 + bob]);
    // Heavy shoulder shield plate
    p(hide, [3, shY + 3.2], [9.5, shY + 4.4], [14.5, -19 + bob + pitch], [13.5, -11 + bob + pitch], [5, -9.5 + bob + pitch], [2.5, -15 + bob + pitch]);
    p(hideHi, [3.5, shY + 4], [9, shY + 5], [12.5, -18.5 + bob + pitch], [9, -15 + bob + pitch], [4, -15.5 + bob + pitch]);
    // Crisp dark plate-fold crevices & frost rivets
    p(hideDeep, [-9.2, rpY + 1.5], [-7.4, rpY + 1.2], [-7.4, -9.5 + bob], [-9.2, -10 + bob]);
    p(hideDeep, [1.2, shY + 2.8], [3.1, shY + 3.2], [3.2, -9.2 + bob + pitch], [1.3, -9.5 + bob + pitch]);
    for (const [rx, ry] of [[-15.5, -13], [-3, -14], [8.5, -14]] as const) {
      r(rx, ry + bob, 2.2, 1.4, hideDeep);
      r(rx, ry - 0.6 + bob, 2.2, 0.9, crownBright);
    }
    // Snow-packed ridge along dorsal back
    p(snow, [-15, rpY + 2.2], [-7, rpY + 0.6], [1.5, shY + 2.4], [8.5, shY + 4.4], [9, shY + 7.2], [0, shY + 6.4], [-13, rpY + 5.8]);

    // Iconic crystalline "Snow Crown" (雪冠) glacial crest sweeping along back & shoulder hump
    const lean = charging ? 2.5 : -1.5;
    drawCrownSpike(-15.5, rpY + 2.5, 3.2, 6.2, lean - 1);
    drawCrownSpike(-7.5, rpY + 1, 4.0, 9.2, lean - 0.5);
    drawCrownSpike(1.5, shY + 3, 4.4, 10.5, lean + 0.5);
    drawCrownSpike(8.5, shY + 5.5, 3.3, 7.2, lean + 1.2);

    // Near legs
    leg(-12.5, false, false);
    leg(8, true, false);

    // Sculpted heavy rhino head, swept ears, armored brow visor, glowing eye, flared snout & twin glacial horns
    const hx = charging ? 15.5 : 14;
    const hy = (charging ? -11.5 : -16.5) + bob;
    const h: Shape = (color, ...pts) => p(color, ...pts.map(([x, y]): [number, number] => [hx + x, hy + y]));

    // Far & near pointed frosted ears
    h(ink, [-5, -9], [-9.5, -15.5], [-5.5, -16], [-1.5, -10]);
    h(hideDark, [-5, -9.5], [-8, -14], [-5.5, -14.2], [-3, -10]);
    h(snow, [-7.5, -13.5], [-5.5, -14], [-5, -12], [-6.8, -12]);

    // Heavy armored skull & blunt rhino snout
    h(ink,
      [-8.5, -8.5], [-1, -11.5], [7, -9.5], [13.5, -3], [15.5, 3.5],
      [13, 8.5], [5.5, 9.5], [-4.5, 7.5], [-9.5, 2.5], [-10, -4]);
    h(hideDark,
      [-7, -7.2], [-1, -9.8], [6.2, -8], [12, -2.5], [13.8, 3],
      [11.8, 7], [5.2, 7.8], [-3.8, 6], [-8, 1.8], [-8.2, -3.5]);
    h(hide,
      [-6.2, -6.8], [-0.5, -9.4], [5.8, -7.6], [11.2, -2.5], [12.5, 2],
      [6, 3.2], [-2.5, 2.5], [-6.8, -1.5]);
    h(snow, [-4.5, -7.8], [0, -9.4], [5.5, -7.6], [7.5, -5], [0, -5.5]);
    // Armored jaw plate & nostril
    h(hideDeep, [-5, 3], [6, 3.5], [12.5, 2.5], [11.5, 6.8], [4.5, 7.5], [-3.5, 5.8]);
    r(hx + 10.2, hy + 1.4, 2.4, 2, ink);
    if (charging || frame % 2 === 0) {
      r(hx + 13.5, hy + 3.2, 2.2, 1.5, crownBright);
      if (charging) r(hx + 15.8, hy + 1.8, 1.8, 1.4, snow);
    }

    // Furrowed brow ridge & fierce glowing eye
    h(ink, [-1.5, -4.8], [5.8, -3.4], [5.2, -0.2], [-0.8, -0.8]);
    r(hx + 1.2, hy - 3.1, 3.1, 1.8, eyeColor);
    r(hx + 3.1, hy - 3.2, 1.1, 1.1, "#ffffff");

    // Secondary smaller brow ice horn
    const hLean = charging ? 3.5 : 0;
    h(ink, [0.5, -6.5], [4 + hLean * 0.4, -13.5], [6.8 + hLean * 0.3, -12.5], [6, -6]);
    h(crownMid, [1.8, -7], [4.2 + hLean * 0.4, -12], [5.5 + hLean * 0.3, -11.4], [5, -6.5]);
    h(crownBright, [2.6, -7.5], [4.2 + hLean * 0.4, -11.6], [4.8 + hLean * 0.3, -9.5], [3.5, -7.2]);

    // Primary massive curved glacial nasal horn!
    const tipX = charging ? 18 : 15;
    const tipY = charging ? -12 : -15.5;
    h(ink, [6.5, 1.2], [9.5, -5.5], [tipX - 1.2, tipY], [tipX + 1.4, tipY + 0.8], [15.2, -4], [14.2, 2.5], [9.5, 3.2]);
    h(crownDeep, [7.8, 0.8], [10.4, -5], [tipX - 0.2, tipY + 1.8], [14, -4], [13, 1.6], [9.5, 2]);
    h(crownMid, [8.2, 0.2], [10.8, -5.2], [tipX - 0.1, tipY + 2], [13, -4.5], [11.6, 0.8]);
    h(crownBright, [9.2, -1], [11.2, -5.5], [tipX, tipY + 2.2], [tipX - 0.5, tipY + 6.5], [10.8, -1.5]);
    if (charging || frame % 2 === 0) {
      r(hx + tipX - 1, hy + tipY + 1.2, 2, 2, crownGlint);
    }
    return;
  }

  // Front (south) & Rear (north) — broad armored glacial rhino silhouette
  const axialLeg = (x: number, far: boolean) => {
    const s = (x < 0 !== far ? stride : -stride) * 0.55;
    const topY = -14 + bob * 0.5;
    const footY = (far ? 0 : 3) + s;
    p(ink, [x - 5, topY], [x + 5, topY], [x + 5.2, footY - 2], [x + 4.8, footY + 1.2], [x - 4.8, footY + 1.2], [x - 5.2, footY - 2]);
    p(far ? hideDeep : hideDark, [x - 3.6, topY + 0.8], [x + 3.6, topY + 0.8], [x + 3.6, footY - 1.5], [x - 3.6, footY - 1.5]);
    if (!far) {
      p(hide, [x - 2.6, topY + 0.8], [x + 2.6, topY + 0.8], [x + 2.2, footY - 3], [x - 2.2, footY - 3]);
      r(x - 2, (topY + footY) * 0.5 - 1, 4, 1.4, hideHi);
    }
    p(hoof, [x - 3.8, footY - 2.2], [x + 3.8, footY - 2.2], [x + 3.5, footY + 0.3], [x - 3.5, footY + 0.3]);
    if (!far) {
      r(x - 2.6, footY - 1.7, 1.5, 1.4, nail);
      r(x - 0.6, footY - 1.6, 1.5, 1.4, nail);
      r(x + 1.3, footY - 1.7, 1.5, 1.4, nail);
    }
  };

  axialLeg(-8.5, true);
  axialLeg(8.5, true);

  const shY = -30.5 + bob;
  // Broad muscular armored barrel body
  p(ink,
    [-18.5, -10 + bob], [-19, -21 + bob], [-13, shY + 4], [-6, shY], [6, shY],
    [13, shY + 4], [19, -21 + bob], [18.5, -10 + bob], [13, -4.5 + bob], [-13, -4.5 + bob]);
  p(hideDeep,
    [-17, -10.5 + bob], [-17.2, -20.5 + bob], [-12, shY + 5.2], [-5.5, shY + 1.6], [5.5, shY + 1.6],
    [12, shY + 5.2], [17.2, -20.5 + bob], [17, -10.5 + bob], [12, -6 + bob], [-12, -6 + bob]);
  p(hideDark,
    [-16, -13 + bob], [-16, -21 + bob], [-11, shY + 5.8], [-5, shY + 2.2], [5, shY + 2.2],
    [11, shY + 5.8], [16, -21 + bob], [16, -13 + bob], [10, -8 + bob], [-10, -8 + bob]);
  p(hide,
    [-14.5, -16 + bob], [-14, -21.5 + bob], [-10, shY + 6.4], [-4.5, shY + 2.8], [4.5, shY + 2.8],
    [10, shY + 6.4], [14, -21.5 + bob], [14.5, -16 + bob], [9, -11.5 + bob], [-9, -11.5 + bob]);
  p(hideHi, [-10, shY + 6.8], [-4.5, shY + 3.2], [4.5, shY + 3.2], [10, shY + 6.8], [6, shY + 10.5], [-6, shY + 10.5]);
  p(snow, [-6.5, shY + 3.4], [6.5, shY + 3.4], [9, shY + 6.8], [0, shY + 5.8], [-9, shY + 6.8]);

  // Symmetric crystalline snow-crown crest crowning the shoulders
  drawCrownSpike(-9, shY + 5.5, 3.2, 7.5, -2.5);
  drawCrownSpike(0, shY + 2.5, 4.2, 10.5, 0);
  drawCrownSpike(9, shY + 5.5, 3.2, 7.5, 2.5);

  axialLeg(-11.5, false);
  axialLeg(11.5, false);

  if (rear) {
    // Segmented armored haunch seam + frosted flicking tail
    r(-13, -17 + bob, 26, 1.8, hideDeep);
    r(-10, -16 + bob, 20, 1, hideHi);
    const wag = [0, 2, 0, -2][frame];
    p(ink, [-3, -19 + bob], [3, -19 + bob], [3.5 + wag, -10 + bob], [wag, -7.5 + bob], [-3.5 + wag, -10 + bob]);
    p(hideDark, [-1.8, -18 + bob], [1.8, -18 + bob], [2.2 + wag, -10.5 + bob], [-2.2 + wag, -10.5 + bob]);
    p(snow, [-2 + wag, -11.5 + bob], [2 + wag, -11.5 + bob], [wag, -8.5 + bob]);
    return;
  }

  // Front (south) armored rhino head, flared ears, glowing eyes & towering central ice horn
  const hy = (charging ? -11 : -15.5) + bob;
  const h: Shape = (color, ...pts) => p(color, ...pts.map(([x, y]): [number, number] => [x, hy + y]));

  // Flared frosted ears
  for (const s of [-1, 1]) {
    h(ink, [s * 8, -8], [s * 14.5, -13.5], [s * 15, -8.5], [s * 10.5, -4]);
    h(hideDark, [s * 9, -7.8], [s * 13.2, -11.8], [s * 13.5, -8.8], [s * 10, -5.2]);
    h(snow, [s * 11, -10.5], [s * 13, -11.5], [s * 13, -9.2], [s * 11, -9]);
  }

  // Wide armored brow & square snout
  h(ink,
    [-11.5, -6.5], [-7.5, -11], [7.5, -11], [11.5, -6.5], [12.5, 2],
    [9.5, 9], [4.5, 11], [-4.5, 11], [-9.5, 9], [-12.5, 2]);
  h(hideDark,
    [-10, -5.8], [-6.8, -9.4], [6.8, -9.4], [10, -5.8], [10.8, 1.5],
    [8.2, 7.6], [4, 9.4], [-4, 9.4], [-8.2, 7.6], [-10.8, 1.5]);
  h(hide,
    [-9, -5.5], [-6, -9], [6, -9], [9, -5.5], [9.5, 0.5], [6, 4.5], [-6, 4.5], [-9.5, 0.5]);
  h(snow, [-6, -8.8], [6, -8.8], [7.5, -5.5], [0, -6.5], [-7.5, -5.5]);

  // Fierce eyes under armored brow visor + flared nostrils
  for (const s of [-1, 1]) {
    h(ink, [s * 3.5, -4.5], [s * 9.5, -3.5], [s * 9, -0.4], [s * 3.8, -0.8]);
    r(s > 0 ? 4.8 : -7.8, hy - 3.2, 3, 1.8, eyeColor);
    r(s > 0 ? 5.2 : -7.4, hy - 3.2, 1, 1, "#ffffff");
    r(s > 0 ? 3.2 : -5.6, hy + 5.2, 2.4, 1.8, ink);
  }
  if (charging || frame % 2 === 0) {
    r(-7.5, hy + 6.5, 2, 1.4, crownBright);
    r(5.5, hy + 6.5, 2, 1.4, crownBright);
  }

  // Secondary brow ice horn + massive primary central glacial horn aiming forward!
  const hTop = charging ? -12 : -18;
  const hBase = charging ? 7.5 : 4.5;
  h(ink, [-3.2, -5.5], [0, -13.5], [3.2, -5.5]);
  h(crownMid, [-1.8, -6], [0, -11.8], [1.8, -6]);
  h(ink, [-4.8, hBase], [-3.8, -2], [-1, hTop], [1, hTop], [3.8, -2], [4.8, hBase], [0, hBase + 2.5]);
  h(crownDeep, [-3.4, hBase - 0.5], [-2.5, -2], [0, hTop + 2], [2.5, -2], [3.4, hBase - 0.5], [0, hBase + 1.2]);
  h(crownMid, [-2.4, hBase - 0.8], [-1.8, -2.5], [0, hTop + 2.2], [1.4, -2.5], [1.2, hBase - 0.8]);
  h(crownBright, [-1.2, hBase - 2], [-0.8, -3], [0, hTop + 2.5], [0.8, -3], [0.5, hBase - 2.5]);
  if (charging || frame % 2 === 0) r(-1, hy + hTop + 1.8, 2, 2, crownGlint);
}
