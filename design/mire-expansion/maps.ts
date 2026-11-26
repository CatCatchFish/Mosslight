import { battleWeather } from "../../src/content/campaign.ts";
import { MIRE_EXPANSION_LEVELS } from "../../src/content/levels/mire-expansion.ts";
import { DefenseGame } from "../../src/engine/defense.ts";
import { createBattleRenderer } from "../../src/render/battlefield.ts";

const ids = ["15", "16", "17", "18"] as const;
const cardW = 680;
const cardH = 440;
const pad = 22;
const headerH = 88;
const sheetW = pad * 3 + cardW * 2;
const sheetH = headerH + pad * 2 + cardH * 2;

const sheet = document.getElementById("maps") as HTMLCanvasElement;
sheet.width = sheetW;
sheet.height = sheetH;
const ctx = sheet.getContext("2d")!;
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = "#162426";
ctx.fillRect(0, 0, sheetW, sheetH);

// Title
ctx.fillStyle = "#d3d99c";
ctx.fillRect(pad, 22, 4, 46);
ctx.fillStyle = "#eeecda";
ctx.font = "700 26px system-ui, sans-serif";
ctx.fillText("瘴雾毒沼 · 第 15 - 18 关重制地图", pad + 18, 46);
ctx.fillStyle = "#9fb7a6";
ctx.font = "400 14px system-ui, sans-serif";
ctx.fillText("保留全部特殊机关（倒潮闸 / 引灯信标 / 浅滩泥地 / 浮筏栈桥 / 苔礁石堡）· 全面重构地形与路线", pad + 18, 68);

ids.forEach((id, idx) => {
  const level = MIRE_EXPANSION_LEVELS[id];
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const cx = pad + col * (cardW + pad);
  const cy = headerH + row * (cardH + pad);

  // Card frame
  ctx.fillStyle = "#1e3032";
  ctx.fillRect(cx, cy, cardW, cardH);
  ctx.strokeStyle = "#364f4e";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx + 0.5, cy + 0.5, cardW - 1, cardH - 1);

  // Card header
  ctx.fillStyle = "#eeecda";
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.fillText(`${id} ${level.name}`, cx + 14, cy + 28);
  const deviceText = (level.devices ?? []).map(d => ("label" in d && d.label) ? d.label : d.kind).join(" · ");
  ctx.fillStyle = "#a9c0ae";
  ctx.font = "400 12px system-ui, sans-serif";
  ctx.fillText(`槽位 ${level.plots.length} · 机关：${deviceText}`, cx + 160, cy + 27);

  // Render battlefield offscreen
  const mapW = cardW - 24;
  const mapH = cardH - 52;
  const off = document.createElement("canvas");
  off.width = mapW;
  off.height = mapH;
  const game = new DefenseGame(level);
  const draw = createBattleRenderer(off, game, battleWeather(level));
  const aspect = level.width / level.height;
  let bw = mapW, bh = mapW / aspect;
  if (bh > mapH) { bh = mapH; bw = mapH * aspect; }
  const bx = (mapW - bw) / 2;
  const by = (mapH - bh) / 2;
  draw(
    { width: mapW, height: mapH, board: { x: bx, y: by, width: bw, height: bh } },
    { selected: null, hoveredType: null, training: null, uiTime: 0, scenery: [], showRanges: false, guardRange: null },
  );
  ctx.drawImage(off, cx + 12, cy + 38, mapW, mapH);
});

const link = document.getElementById("save-maps") as HTMLAnchorElement | null;
if (link) link.href = sheet.toDataURL("image/png");
