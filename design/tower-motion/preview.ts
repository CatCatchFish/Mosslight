// Contact sheet for tower motion. Query options:
//   ?mode=sheet (default)  frozen frames of every state
//   ?mode=spec             all tier-4 specializations, old vs new
//   ?mode=live             animated loop of build → idle → fire → upgrade
import { TOWERS } from "../../src/content/towers.ts";
import type { TowerId } from "../../src/engine/types.ts";
import { drawTower } from "../../src/render/tower-art.ts";
import { setArtQuality } from "../../src/render/quality.ts";
import type { Heading } from "../../src/engine/formation.ts";

const params = new URLSearchParams(location.search);
const mode = params.get("mode") ?? "sheet";
const SCALE = Number(params.get("scale") ?? 4);
const canvas = document.querySelector<HTMLCanvasElement>("#sheet")!;
const ctx = canvas.getContext("2d")!;
const types = Object.keys(TOWERS) as TowerId[];

interface Frame {
  label: string;
  quality: "high" | "low";
  tier: number;
  path?: string | null;
  age?: number;
  built?: number;
  upgraded?: number;
  previous?: { tier: number; path: string | null };
  time?: number;
  heading?: Heading;
}

const CELL_W = 44, CELL_H = 46, LABEL = 10;

function ground(x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#5d7a43";
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 40; i++) {
    const s = Math.sin(i * 91.7 + x * .13 + y * .07) * 43758.5;
    const r = s - Math.floor(s);
    const s2 = Math.sin(i * 12.9 + x * .3) * 9341.2;
    const r2 = s2 - Math.floor(s2);
    ctx.fillStyle = i % 3 ? "#6b8a4c" : "#4f6b39";
    ctx.fillRect(x + Math.floor(r * w), y + Math.floor(r2 * h), 1, 1);
  }
}

function drawFrame(type: TowerId, f: Frame, cx: number, cy: number) {
  setArtQuality(f.quality);
  ground(cx, cy, CELL_W - 1, CELL_H - 1);
  drawTower(ctx, cx + CELL_W / 2, cy + CELL_H - 10, type, f.tier, f.path ?? null, {
    heading: f.heading ?? 0,
    time: f.time ?? 1.3,
    age: f.age ?? 9,
    load: 1,
    built: f.built ?? Infinity,
    upgraded: f.upgraded ?? Infinity,
    previous: f.previous,
  });
}

function label(text: string, x: number, y: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#e9e2c8";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText(text, x * SCALE, y * SCALE);
  ctx.restore();
}

function sheet(frames: (type: TowerId) => Frame[], rows: TowerId[]) {
  const columns = frames(rows[0]).length;
  canvas.width = (columns * CELL_W + 30) * SCALE;
  canvas.height = (rows.length * CELL_H + LABEL + 4) * SCALE;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#23271f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  frames(rows[0]).forEach((f, i) => label(f.label, 30 + i * CELL_W + 2, LABEL - 3));
  rows.forEach((type, row) => {
    label(TOWERS[type].name ?? type, 1, LABEL + row * CELL_H + CELL_H / 2);
    frames(type).forEach((f, col) => {
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      drawFrame(type, f, 30 + col * CELL_W, LABEL + row * CELL_H);
    });
  });
}

const fireAt = (type: TowerId) => -TOWERS[type].flight[0];
if (mode === "diff") {
  const a = document.createElement("canvas"), b = document.createElement("canvas");
  a.width = b.width = 200; a.height = b.height = 200;
  const ca = a.getContext("2d")!, cb = b.getContext("2d")!;
  setArtQuality("low"); drawTower(ca, 100, 150, "cannon", 1, null, { age: 9 });
  setArtQuality("high"); drawTower(cb, 100, 150, "cannon", 1, null, { age: 9 });
  const da = ca.getImageData(0, 0, 200, 200).data, db = cb.getImageData(0, 0, 200, 200).data;
  let changed = 0, opaque = 0, total = 0;
  for (let i = 0; i < da.length; i += 4) {
    if (da[i + 3] > 200) opaque++;
    const delta = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    if (delta > 10) { changed++; total += delta; }
  }
  document.body.dataset.result = `opaque=${opaque} changed=${changed} avg=${(total / Math.max(1, changed)).toFixed(1)}`;
} else if (mode === "sheet") {
  sheet((type) => [
    { label: "旧·1级", quality: "low", tier: 1 },
    { label: "新·1级", quality: "high", tier: 1 },
    { label: "新·2级", quality: "high", tier: 2 },
    { label: "新·3级", quality: "high", tier: 3 },
    { label: "蓄力", quality: "high", tier: 3, age: fireAt(type) * .25 },
    { label: "开火 .02", quality: "high", tier: 3, age: .02 },
    { label: "开火 .08", quality: "high", tier: 3, age: .08 },
    { label: "开火 .25", quality: "high", tier: 3, age: .25 },
    { label: "建造 .08", quality: "high", tier: 1, built: .08 },
    { label: "建造 .2", quality: "high", tier: 1, built: .2 },
    { label: "建造 .32", quality: "high", tier: 1, built: .32 },
    { label: "升级 .15", quality: "high", tier: 3, upgraded: .15, previous: { tier: 2, path: null } },
    { label: "升级 .3", quality: "high", tier: 3, upgraded: .3, previous: { tier: 2, path: null } },
    { label: "升级 .5", quality: "high", tier: 3, upgraded: .5, previous: { tier: 2, path: null } },
  ], types);
} else if (mode === "spec") {
  const rows = types;
  sheet((type) => {
    const [a, b] = Object.keys(TOWERS[type].paths);
    return [
      { label: "旧·" + a, quality: "low", tier: 4, path: a },
      { label: "新", quality: "high", tier: 4, path: a },
      { label: "开火", quality: "high", tier: 4, path: a, age: .05 },
      { label: "旧·" + b, quality: "low", tier: 4, path: b },
      { label: "新", quality: "high", tier: 4, path: b },
      { label: "开火", quality: "high", tier: 4, path: b, age: .05 },
      { label: "专精 .3", quality: "high", tier: 4, path: a, upgraded: .3, previous: { tier: 3, path: null } },
    ];
  }, rows);
} else {
  const columns = 4;
  const rows = Math.ceil(types.length / columns);
  canvas.width = columns * CELL_W * SCALE;
  canvas.height = rows * CELL_H * SCALE;
  const start = performance.now();
  const loop = () => {
    const t = (performance.now() - start) / 1000;
    const cycle = t % 6;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    types.forEach((type, i) => {
      const fireCycle = (cycle - 1.4) % 1.1;
      const frame: Frame = {
        label: "", quality: "high", time: t,
        tier: cycle < 4.2 ? 2 : 3,
        built: cycle,
        upgraded: cycle >= 4.2 ? cycle - 4.2 : Infinity,
        previous: { tier: 2, path: null },
        age: cycle > 1.4 && cycle < 4.2 ? fireCycle - .2 : 9,
        heading: (Math.floor(t / 2) % 8) as Heading,
      };
      drawFrame(type, frame, (i % columns) * CELL_W, Math.floor(i / columns) * CELL_H);
    });
    requestAnimationFrame(loop);
  };
  loop();
}
document.title += " · ready";
