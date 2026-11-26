import type { TalentId } from "../content/talents.ts";

function setupPixelCanvas(canvas: HTMLCanvasElement, grid = 16) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const scale = canvas.width / grid;
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x * scale),
      Math.round(y * scale),
      Math.max(1, Math.round(w * scale)),
      Math.max(1, Math.round(h * scale)),
    );
  };
  return { ctx, px, scale };
}

/**
 * Draws a crisp 16x16 pixel-art emblem for each camp glimmer blessing.
 */
export function drawTalentIcon(canvas: HTMLCanvasElement, id: TalentId, rank: number) {
  const g = setupPixelCanvas(canvas, 16);
  if (!g) return;
  const { px } = g;
  const lit = rank > 0;
  const maxed = rank >= 3;

  // Soft pixel pedestal / backing aura
  if (lit) {
    px(2, 2, 12, 12, maxed ? "rgba(244, 214, 122, 0.16)" : "rgba(182, 226, 178, 0.12)");
    px(3, 1, 10, 14, maxed ? "rgba(244, 214, 122, 0.08)" : "rgba(182, 226, 178, 0.07)");
  }

  switch (id) {
    case "supply": {
      // Supply crate + golden coins pouch
      px(3, 12, 10, 2, "#132020");
      // Wooden crate
      px(2, 6, 7, 7, "#6b472a");
      px(3, 7, 5, 5, "#9c6b3f");
      px(2, 8, 7, 1, "#53341d");
      px(5, 6, 1, 7, "#53341d");
      px(3, 7, 2, 1, "#c28f57");
      // Coin stack & pouch on right
      px(9, 8, 5, 5, "#b37c24");
      px(10, 7, 3, 1, "#f2cf78");
      px(10, 9, 4, 1, "#f7e096");
      px(10, 11, 4, 1, "#e5b64e");
      px(10, 10, 3, 1, "#c8902e");
      // Gleam
      px(8, 3, 2, 2, "#f8e49c");
      px(9, 2, 1, 1, "#fff8d6");
      px(12, 4, 1, 1, lit ? "#fff5c0" : "#b8a66a");
      break;
    }
    case "swift-dispatch": {
      // Brass war horn / bugle + fluttering golden pennant
      px(3, 11, 9, 2, "#132020");
      // Flag pole & pennant
      px(4, 2, 1, 10, "#8f7a5a");
      px(5, 2, 6, 4, "#c95a3c");
      px(5, 3, 5, 2, "#eb834f");
      px(11, 3, 2, 2, "#f5c26b");
      px(6, 3, 2, 1, "#ffebb3");
      // Brass bugle
      px(3, 9, 6, 2, "#d8a045");
      px(4, 8, 4, 1, "#f6cf78");
      px(9, 8, 3, 4, "#e6b454");
      px(11, 7, 2, 6, "#f7da8c");
      px(12, 8, 1, 4, "#fff2c2");
      // Speed streaks
      px(1, 7, 2, 1, lit ? "#ffe79b" : "#9ba898");
      px(1, 10, 2, 1, lit ? "#ffe79b" : "#9ba898");
      break;
    }
    case "device-craft": {
      // Interlocking brass gear + glowing turquoise rune core
      px(4, 12, 8, 2, "#132020");
      // Gear teeth
      px(7, 2, 2, 12, "#8e7343");
      px(2, 7, 12, 2, "#8e7343");
      px(4, 4, 8, 8, "#b79355");
      px(3, 5, 10, 6, "#b79355");
      px(5, 3, 6, 10, "#b79355");
      // Rim highlight
      px(5, 4, 6, 1, "#e5c37a");
      px(4, 5, 1, 6, "#e5c37a");
      // Inner cavity
      px(5, 5, 6, 6, "#213638");
      // Glowing rune core
      px(6, 6, 4, 4, lit ? "#66d1bd" : "#4b8c82");
      px(7, 7, 2, 2, lit ? "#d2fff4" : "#8fd1c4");
      // Wrench spark
      px(12, 3, 2, 2, lit ? "#a6f5e3" : "#6c8a85");
      break;
    }
    case "guard-spirit": {
      // Kite shield with crossed spear & moss-gold crest
      px(4, 13, 8, 2, "#132020");
      // Crossed spear behind
      px(2, 2, 2, 2, "#d9e6eb");
      px(4, 4, 1, 1, "#8d6741");
      px(12, 11, 2, 2, "#8d6741");
      px(12, 2, 2, 2, "#d9e6eb");
      px(11, 4, 1, 1, "#8d6741");
      px(2, 11, 2, 2, "#8d6741");
      // Shield body
      px(4, 3, 8, 7, "#3a5c46");
      px(5, 10, 6, 2, "#3a5c46");
      px(6, 12, 4, 1, "#2b4635");
      // Shield border
      px(4, 3, 8, 1, "#d5bc78");
      px(4, 3, 1, 7, "#d5bc78");
      px(11, 3, 1, 7, "#b49654");
      px(5, 10, 1, 2, "#b49654");
      px(10, 10, 1, 2, "#b49654");
      // Glowing ember emblem in center
      px(7, 5, 2, 5, lit ? "#a8e882" : "#6ea36a");
      px(6, 6, 4, 2, lit ? "#d9ffad" : "#8bc280");
      px(7, 6, 2, 2, "#f8ffd8");
      break;
    }
    case "salvage": {
      // Blacksmith hammer & returned gold ingots
      px(3, 12, 10, 2, "#132020");
      // Anvil / timber block
      px(3, 9, 10, 3, "#4c5a61");
      px(4, 8, 8, 1, "#7b8d96");
      px(5, 12, 6, 1, "#323c42");
      // Hammer
      px(5, 3, 5, 3, "#8fa1ab");
      px(6, 3, 3, 1, "#cad8df");
      px(7, 6, 2, 4, "#9c6b3f");
      // Sparkling gold nuggets salvaged
      px(10, 6, 3, 2, "#e8b954");
      px(11, 5, 2, 1, "#ffe89e");
      px(2, 6, 2, 2, "#d4a03e");
      px(3, 4, 1, 1, lit ? "#fff2b3" : "#a39162");
      px(12, 3, 1, 1, lit ? "#fff2b3" : "#a39162");
      break;
    }
    case "weather-ward": {
      // Hooded storm lantern deflecting snow & gale streaks
      px(4, 13, 8, 2, "#132020");
      // Hood & handle
      px(6, 2, 4, 1, "#9aa9b2");
      px(5, 3, 6, 2, "#4e646e");
      px(4, 5, 8, 1, "#7c95a1");
      // Glass lantern body
      px(5, 6, 6, 5, "#233c48");
      px(6, 6, 4, 5, lit ? "#f2c66d" : "#a68c54");
      px(7, 7, 2, 3, lit ? "#fff6c7" : "#d8c48a");
      // Lantern base
      px(5, 11, 6, 2, "#4e646e");
      px(6, 11, 4, 1, "#7c95a1");
      // Wind / frost barrier arcs
      px(2, 4, 2, 1, "#9cdcf5");
      px(1, 7, 2, 1, "#c8f0ff");
      px(2, 10, 2, 1, "#9cdcf5");
      px(12, 5, 2, 1, "#9cdcf5");
      px(13, 8, 2, 1, "#c8f0ff");
      break;
    }
  }

  // Max-rank golden corner sparkles
  if (maxed) {
    px(1, 1, 2, 1, "#ffe794");
    px(1, 1, 1, 2, "#ffe794");
    px(13, 1, 2, 1, "#ffe794");
    px(14, 1, 1, 2, "#ffe794");
    px(1, 14, 2, 1, "#ffe794");
    px(13, 14, 2, 1, "#ffe794");
  }
}

/**
 * Draws the camp glimmer brazier/lantern crest for the Talents dialog header.
 * Glow intensity scales with spent ranks (0..18).
 */
export function drawCampLanternCrest(canvas: HTMLCanvasElement, litRanks: number, totalRanks: number) {
  const g = setupPixelCanvas(canvas, 20);
  if (!g) return;
  const { px } = g;
  const ratio = totalRanks > 0 ? Math.min(1, litRanks / totalRanks) : 0;

  // Warm aura rings
  if (ratio > 0) {
    px(3, 3, 14, 14, `rgba(246, 204, 110, ${(0.08 + ratio * 0.14).toFixed(2)})`);
    px(5, 5, 10, 10, `rgba(255, 230, 148, ${(0.1 + ratio * 0.16).toFixed(2)})`);
  }

  // Stone altar pedestal
  px(4, 15, 12, 3, "#3c4f52");
  px(5, 14, 10, 1, "#698082");
  px(3, 17, 14, 1, "#212e30");

  // Lantern iron frame
  px(8, 2, 4, 1, "#8ea3a6");
  px(6, 3, 8, 2, "#4b6266");
  px(5, 5, 10, 1, "#7b9699");
  px(6, 6, 1, 8, "#4b6266");
  px(13, 6, 1, 8, "#4b6266");

  // Inner glimmer flame
  const outerFlame = ratio > 0.5 ? "#ffae4d" : ratio > 0 ? "#e8a54a" : "#7a6845";
  const midFlame = ratio > 0.5 ? "#ffe07d" : ratio > 0 ? "#f2cc72" : "#a89263";
  const coreFlame = ratio > 0 ? "#fffbe0" : "#cfc29b";
  px(7, 6, 6, 8, "#1e3033");
  px(8, 7, 4, 6, outerFlame);
  px(9, 6, 2, 1, outerFlame);
  px(9, 8, 2, 4, midFlame);
  px(9, 9, 2, 2, coreFlame);

  // Floating glimmer sparks proportional to lit ranks
  if (litRanks >= 1) px(3, 7, 1, 1, "#ffe99e");
  if (litRanks >= 4) px(16, 6, 1, 1, "#ffe99e");
  if (litRanks >= 8) px(4, 3, 1, 1, "#fff6cc");
  if (litRanks >= 12) px(15, 11, 1, 1, "#ffe99e");
  if (litRanks >= 16) {
    px(16, 3, 2, 1, "#fff6cc");
    px(2, 11, 1, 1, "#fff6cc");
  }
}
