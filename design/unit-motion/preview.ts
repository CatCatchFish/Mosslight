// Contact sheet for guards, griffins and enemies.
//   ?mode=guards   rabbit guards & frost-silver griffins
//   ?mode=enemies  enemy walk, hit-flash, frost/slow, dissolve & shatter
//   ?mode=frost-bear  ice-ridge bear and yeti in all four directions
//   ?mode=frost-roster  snowbrush fox, bear and porcupine motion
//   ?mode=frost-moose  final boss gait, tower freeze and antler sweep
//   ?mode=mire-roster   poison-marsh enemies across facings & states
//   ?mode=mire-and-fox  snowbrush fox and the six poison-marsh enemies
//   ?mode=mire-crawlers  full movement and attack keyframes for leech and viper
import { ENEMIES } from "../../src/content/enemies.ts";
import { loadEnemyAtlases } from "../../src/render/enemy-atlas.ts";
import { drawGuard } from "../../src/render/guards.ts";
import { drawEnemy, drawEnemyDefeat } from "../../src/render/sprites.ts";
import { drawGuardQuill } from "../../src/render/animation.ts";
import { setArtQuality } from "../../src/render/quality.ts";
import type { Guard, GuardBranch, GuardPost } from "../../src/engine/guards.ts";
import type { Enemy, EnemyId } from "../../src/engine/types.ts";

const params = new URLSearchParams(location.search);
const mode = params.get("mode") ?? "guards";
const SCALE = Number(params.get("scale") ?? 4);
const canvas = document.querySelector<HTMLCanvasElement>("#sheet")!;
const ctx = canvas.getContext("2d")!;

const CELL_W = 42, CELL_H = 44, LABEL = 12, LEFT = 38;

function ground(x: number, y: number, w: number, h: number, snowy = false) {
  ctx.fillStyle = snowy ? "#aec9d4" : "#5c7944";
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 36; i++) {
    const s = Math.sin(i * 91.7 + x * .13 + y * .07) * 43758.5;
    const r = s - Math.floor(s);
    const s2 = Math.sin(i * 12.9 + x * .3) * 9341.2;
    const r2 = s2 - Math.floor(s2);
    ctx.fillStyle = i % 3 ? (snowy ? "#bed5d8" : "#6b8a4c") : (snowy ? "#94b0bb" : "#4f6b39");
    ctx.fillRect(x + Math.floor(r * w), y + Math.floor(r2 * h), 1, 1);
  }
}

function label(text: string, x: number, y: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#e9e2c8";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText(text, x * SCALE, y * SCALE);
  ctx.restore();
}

function makePost(type: "guard-post" | "griffin-roost" | "frost-kennel", tier: 1 | 2 | 3 | 4, branch?: GuardBranch): GuardPost {
  return {
    index: 0,
    type,
    origin: [0, 0],
    rally: [0, 0],
    tier,
    branch,
    findPath: () => [],
    guards: [],
  };
}

function makeGuard(overrides: Partial<Guard> = {}): Guard {
  return {
    x: 0, y: 0,
    hp: 999,
    facing: 1,
    walk: 0,
    movedAt: -10,
    hurtAt: -10,
    recoil: [0, 0],
    cooldown: 0,
    respawn: 0,
    path: [],
    slot: 0,
    ...overrides,
  };
}

const dummyRoute = { distance: 5, at: () => ({ x: 0, y: 0, facing: "east" as const }) } as unknown as Enemy["route"];

function makeEnemy(type: EnemyId, overrides: Partial<Enemy> = {}): Enemy {
  const spec = ENEMIES[type];
  return {
    type,
    route: dummyRoute,
    entry: "a",
    lane: 0,
    progress: 1,
    x: 0,
    y: 0,
    facing: "east",
    hp: spec.hp,
    maxHp: spec.hp,
    speed: spec.speed,
    armor: spec.armor ?? 0,
    walk: 0,
    age: 2,
    hurtAgo: 10,
    flash: 0,
    slows: new Map(),
    burn: 0,
    burnLife: 0,
    batch: 0,
    escaped: false,
    ...overrides,
  };
}

async function run() {
  await loadEnemyAtlases();

  if (mode === "guards") {
    const cols = ["旧·待机", "新·待机", "移动/振翅", "蓄力", "攻击瞬间", "格挡/落地", "受击闪白"];
    const rows: { name: string; draw: (col: number, cx: number, cy: number) => void }[] = [
      {
        name: "兔卫·堤盾",
        draw(col, cx, cy) {
          setArtQuality(col === 0 ? "low" : "high");
          const post = makePost("guard-post", 3, "shield");
          const time = 2.0;
          const g = makeGuard({
            x: (cx + CELL_W / 2 - 8) / 16,
            y: (cy + CELL_H - 12 - 10) / 16,
            walk: col === 2 ? 1.15 : 0,
            movedAt: col === 2 ? time - .04 : -10,
            hurtAt: col === 5 ? time - .05 : col === 6 ? time - .03 : -10,
            attack: col === 3
              ? { kind: "thrust", direction: [1, 0], start: time - .16, impact: time + .04, end: time + .24 }
              : col === 4
                ? { kind: "thrust", direction: [1, 0], start: time - .22, impact: time - .04, end: time + .22 }
                : undefined,
          });
          post.guards.push(g);
          drawGuard(ctx, g, time, post, false, "woods", true);
        },
      },
      {
        name: "兔卫·苇枪",
        draw(col, cx, cy) {
          setArtQuality(col === 0 ? "low" : "high");
          const post = makePost("guard-post", 3, "spear");
          const time = 2.0;
          const g = makeGuard({
            x: (cx + CELL_W / 2 - 8) / 16,
            y: (cy + CELL_H - 12 - 10) / 16,
            walk: col === 2 ? 1.35 : 0,
            movedAt: col === 2 ? time - .04 : -10,
            hurtAt: col === 6 ? time - .03 : -10,
            attack: col === 3
              ? { kind: "throw", direction: [1, -.2], start: time - .16, impact: time + .04, end: time + .24 }
              : col === 4
                ? { kind: "thrust", direction: [1, 0], start: time - .22, impact: time - .03, end: time + .22 }
                : col === 5
                  ? { kind: "throw", direction: [1, -.2], start: time - .22, impact: time - .05, end: time + .22 }
                  : undefined,
          });
          post.guards.push(g);
          drawGuard(ctx, g, time, post, false, "woods", true);
        },
      },
      {
        name: "霜银狮鹫",
        draw(col, cx, cy) {
          setArtQuality(col === 0 ? "low" : "high");
          const post = makePost("griffin-roost", 2);
          const time = col === 2 ? 2.18 : 2.0;
          const g = makeGuard({
            x: (cx + CELL_W / 2 - 8) / 16,
            y: (cy + CELL_H - 11 - 9) / 16,
            hurtAt: col === 6 ? time - .03 : -10,
            flight: {
              height: col === 5 ? 0 : 1,
              landedAt: col === 5 ? time - .08 : -10,
            },
            attack: col === 3
              ? { kind: "claw", pose: "air", direction: [1, .2], start: time - .16, impact: time + .04, end: time + .24 }
              : col === 4
                ? { kind: "claw", pose: "air", direction: [1, .2], start: time - .22, impact: time - .03, end: time + .22 }
                : undefined,
          });
          post.guards.push(g);
          drawGuard(ctx, g, time, post, false, "frost", true);
        },
      },
      {
        name: "合翼锐爪",
        draw(col, cx, cy) {
          setArtQuality(col === 0 ? "low" : "high");
          const post = makePost("griffin-roost", 3, "talon");
          const time = col === 2 ? 2.18 : 2.0;
          const g = makeGuard({
            x: (cx + CELL_W / 2 - 8) / 16,
            y: (cy + CELL_H - 11 - 9) / 16,
            hurtAt: col === 6 ? time - .03 : -10,
            flight: {
              height: col === 4 || col === 5 ? 0 : 1,
              landedAt: col === 5 ? time - .08 : -10,
            },
            attack: col === 3
              ? { kind: "claw", pose: "air", direction: [1, .2], start: time - .16, impact: time + .04, end: time + .24 }
              : col === 4
                ? { kind: "claw", pose: "ground", direction: [1, 0], start: time - .22, impact: time - .03, end: time + .22 }
                : undefined,
          });
          post.guards.push(g);
          drawGuard(ctx, g, time, post, false, "frost", true);
        },
      },
      {
        name: "霜翼编队",
        draw(col, cx, cy) {
          setArtQuality(col === 0 ? "low" : "high");
          const post = makePost("griffin-roost", 3, "wingpair");
          const time = col === 2 ? 2.18 : 2.0;
          const g = makeGuard({
            x: (cx + CELL_W / 2 - 8) / 16,
            y: (cy + CELL_H - 11 - 9) / 16,
            hurtAt: col === 6 ? time - .03 : -10,
            recruit: col === 5 ? { adultAfter: 1, grown: true } : undefined,
            flight: { height: 1, landedAt: -10 },
            attack: col === 3
              ? { kind: "claw", pose: "air", direction: [1, .2], start: time - .16, impact: time + .04, end: time + .24 }
              : col === 4
                ? { kind: "claw", pose: "air", direction: [1, .2], start: time - .22, impact: time - .03, end: time + .22 }
                : undefined,
          });
          post.guards.push(g);
          drawGuard(ctx, g, time, post, false, "frost", true);
        },
      },
    ];

    canvas.width = (cols.length * CELL_W + LEFT) * SCALE;
    canvas.height = (rows.length * CELL_H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#23271f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, LEFT + i * CELL_W + 2, LABEL - 3));
    rows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * CELL_H + CELL_H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = LEFT + c * CELL_W, cy = LABEL + r * CELL_H;
        ground(cx, cy, CELL_W - 1, CELL_H - 1);
        row.draw(c, cx, cy);
      });
    });
  } else if (mode === "regional-new") {
    const W = 44, H = 48, L = LEFT + 14;
    const cols = ["侧面·行走", "侧面·滑行/动作", "正面·常态", "正面·动作", "背面·常态"];
    const rows: { name: string; type: EnemyId; turnBurst?: boolean }[] = [
      { name: "冰帆貂(新)", type: "ice-sail", turnBurst: true },
      { name: "镜甲岩羊(缩小)", type: "mirror-ibex" },
      { name: "04-06 芦溪蝾螈", type: "reed-newt" },
      { name: "04-06 雾翅蛾", type: "moth" },
      { name: "07-09 矿屑爬虫", type: "ore-crawler" },
      { name: "10-12 霜翼鳐", type: "frost-ray" },
      { name: "10-11 雪原冰兔", type: "frost-hare" },
    ];
    canvas.width = (cols.length * W + L) * SCALE;
    canvas.height = (rows.length * H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#23271f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, L + i * W + 2, LABEL - 3));
    rows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * H + H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = L + c * W, cy = LABEL + r * H;
        ground(cx, cy, W - 1, H - 1);
        setArtQuality("high");
        const ex = (cx + W / 2 - 8) / 16;
        const ey = (cy + H - 10 - 9) / 16;
        const facing = c < 2 ? "east" : c < 4 ? "south" : "north";
        const active = c === 1 || c === 3;
        const e = makeEnemy(row.type, {
          x: ex, y: ey,
          facing,
          walk: active ? 2.4 : 1.2,
          age: 2,
          turnBurstUntil: row.turnBurst && active ? 3 : 0,
          action: !row.turnBurst && active ? { phase: "exposed", progress: 0.5 } : undefined,
        });
        drawEnemy(ctx, e, 2.35, false);
      });
    });
  } else if (mode === "frost-moose") {
    const width = 68, height = 58;
    const columns = ["步态 F0", "步态 F1", "步态 F2", "步态 F3", "抬角蓄霜", "释放冰封", "低头蓄力", "鹿角横扫", "收势"];
    const rows = [["东侧", "east"], ["西侧", "west"], ["正面", "south"], ["背面", "north"]] as const;
    canvas.width = (LEFT + width * columns.length) * SCALE;
    canvas.height = (LABEL + height * rows.length + 4) * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.fillStyle = "#202d38";
    ctx.fillRect(0, 0, canvas.width / SCALE, canvas.height / SCALE);
    setArtQuality("high");
    columns.forEach((title, index) => label(title, LEFT + width * index + 2, LABEL - 3));
    for (const [row, [title, facing]] of rows.entries()) {
      label(title, 5, LABEL + height * row + height / 2);
      for (let col = 0; col < columns.length; col++) {
        const x = LEFT + width * col, y = LABEL + height * row;
        ground(x, y, width - 1, height - 1, true);
        const now = col === 6 ? .55 : col === 7 ? .81 : 1.23;
        const direction = facing === "east" ? [1, 0] : facing === "west" ? [-1, 0]
          : facing === "south" ? [0, 1] : [0, -1];
        const enemy = makeEnemy("frost-moose", {
          x: (x + width / 2 - 8) / 16, y: (y + height - 10 - 9) / 16, facing,
          walk: col < 4 ? col : 0,
          action: col === 4 ? { phase: "windup", progress: .8 } : col === 5 ? { phase: "active", progress: .15 } : undefined,
          melee: col < 6 ? undefined : {
            style: "antler-sweep", facing, direction: [direction[0], direction[1]],
            start: 0, impact: .78, end: 1.3, hit: col > 6,
          },
        });
        drawEnemy(ctx, enemy, now, false);
      }
    }
  } else if (mode === "minibosses") {
    const W = 48, H = 56, L = LEFT + 14;
    const cols = ["低画质", "高画质·常态", "机制/技能触发", "受击闪白", "减速/冰冻", "死亡 .42"];
    const rows: {
      name: string;
      type: EnemyId;
      actionPhase?: "active" | "windup" | "exposed";
      enraged?: boolean;
      shellBroken?: boolean;
      frostDeath?: boolean;
    }[] = [
      { name: "09 熔轨巨擘", type: "slag-colossus", actionPhase: "active", enraged: true },
      { name: "12 冰脊雪熊", type: "frost-bear", actionPhase: "active", frostDeath: true },
      { name: "12 霜吼雪怪", type: "frost-yeti", actionPhase: "active", enraged: true, frostDeath: true },
      { name: "12 寒岩雪傀", type: "rime-golem", shellBroken: true, frostDeath: true },
      { name: "12 霜冕寒鹿", type: "blizzard-elk", actionPhase: "active", frostDeath: true },
      { name: "11/12 雪帚狐", type: "snowbrush-fox", actionPhase: "active", frostDeath: true },
      { name: "10-12 冰帆貂", type: "ice-sail", actionPhase: "active", frostDeath: true },
      { name: "03 松鬃巨豕", type: "pine-boar", actionPhase: "active", enraged: true },
      { name: "05 莲冠巨蟾", type: "lotus-toad", actionPhase: "active" },
      { name: "07 熔心钻机", type: "slag-driller", actionPhase: "windup" },
      { name: "10 霜角巨犸", type: "frost-mammoth", actionPhase: "exposed", frostDeath: true },
    ];
    canvas.width = (cols.length * W + L) * SCALE;
    canvas.height = (rows.length * H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#23271f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, L + i * W + 2, LABEL - 3));
    rows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * H + H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = L + c * W, cy = LABEL + r * H;
        ground(cx, cy, W - 1, H - 1);
        setArtQuality(c === 0 ? "low" : "high");
        const ex = (cx + W / 2 - 8) / 16;
        const ey = (cy + H - 10 - 9) / 16;
        const spec = ENEMIES[row.type];
        const e = makeEnemy(row.type, {
          x: ex, y: ey,
          walk: 2.2,
          hp: c === 2 && row.enraged ? Math.floor(spec.hp * 0.4) : spec.hp,
          shellBroken: c === 2 && row.shellBroken ? true : undefined,
          action: c === 2 && row.actionPhase ? { phase: row.actionPhase, progress: 0.52 } : undefined,
          flash: c === 3 ? .18 : 0,
          slows: c === 4 || (c === 5 && row.frostDeath) ? new Map([[0.45, 5]]) : new Map(),
        });
        if (c < 5) drawEnemy(ctx, e, 2.35, false, c === 3 ? { heavy: true } : undefined);
        else drawEnemyDefeat(ctx, e, .42, false);
      });
    });
  } else if (mode === "interceptors-idle") {
    const W = 54, H = 54, L = 66;
    const cols = ["待机·常态", "待机·眨眼", "待机·嗅/梳理", "待机·轻跳/滑翔", "待机·环顾", "待机·招牌/长鸣"];
    const rows: {
      name: string;
      type: "guard-post" | "griffin-roost";
      tier: 1 | 2 | 3 | 4;
      branch?: GuardBranch;
      grounded?: boolean;
    }[] = [
      { name: "兔卫·堤盾班", type: "guard-post", tier: 4, branch: "shield" },
      { name: "兔卫·苇枪队", type: "guard-post", tier: 4, branch: "spear" },
      { name: "狮鹫·悬停", type: "griffin-roost", tier: 2 },
      { name: "合翼锐爪·栖地", type: "griffin-roost", tier: 4, branch: "talon", grounded: true },
    ];
    canvas.width = (cols.length * W + L) * SCALE;
    canvas.height = (rows.length * H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#1c2832";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, L + i * W + 2, LABEL - 3));
    rows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * H + H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = L + c * W, cy = LABEL + r * H;
        ground(cx, cy, W - 1, H - 1);
        setArtQuality("high");
        const post = makePost(row.type, row.tier, row.branch);
        const gx = (cx + W / 2 - 8) / 16;
        const gy = (cy + H - 10 - 8) / 16;
        let t = 8.0;
        const g = makeGuard({
          x: gx, y: gy,
          flight: row.type === "griffin-roost" ? { height: row.grounded ? 0 : 1, landedAt: -10 } : undefined,
        });
        if (row.type === "guard-post") {
          // watch % 7.4, idleBeat % 11.5
          if (c === 0) t = 11.5 + 0.5; // calm breathe (wait idleBeat < 0.85 is greeting, no companion so normal)
          else if (c === 1) t = 1.2 + 7.4; // blink
          else if (c === 2) t = 2.15 + 7.4; // ear-perk + sniff
          else if (c === 3) t = 3.93 + 7.4; // happy rabbit hop
          else if (c === 4) t = 6.0 + 7.4; // scout glance
          else if (c === 5) t = 3.66 + 11.5; // branch signature flourish (shield-tap / pike-lift)
        } else {
          // watch % 8.8, cryBeat % (13.5 or 16.5)
          if (c === 0) t = 8.8 + 0.4; // calm hover / perch
          else if (c === 1) t = 1.28 + 8.8; // blink
          else if (c === 2) t = 2.8 + 8.8; // preen
          else if (c === 3) t = 5.95 + 8.8; // thermal glide / scan
          else if (c === 4) t = 6.05 + 8.8; // glance scan
          else if (c === 5) t = 0.35; // proud sky cry
        }
        post.guards = [g];
        drawGuard(ctx, g, t, post, false, "forest", true);
      });
    });
  } else if (mode === "frost-wolves") {
    const W = 54, H = 50, L = 58;
    const cols = [
      "待机·呼吸", "待机·眨眼", "待机·嗅雪", "待机·警觉", "待机·长嚎",
      "奔跑 0", "奔跑 1", "奔跑 2", "奔跑 3",
      "蓄力扑", "扑咬瞬间", "落地收口", "受击", "倒下",
    ];
    const rows: { name: string; tier: 1 | 2 | 3 | 4; branch?: GuardBranch }[] = [
      { name: "霜狼 Lv1", tier: 1 },
      { name: "雪狼群阵 Lv4", tier: 4, branch: "pack" },
      { name: "冰鬃头狼 Lv4", tier: 4, branch: "dire" },
    ];
    canvas.width = (cols.length * W + L) * SCALE;
    canvas.height = (rows.length * H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#1c2832";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, L + i * W + 2, LABEL - 3));
    rows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * H + H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = L + c * W, cy = LABEL + r * H;
        ctx.fillStyle = "#8ba8b5";
        ctx.fillRect(cx, cy, W - 1, H - 1);
        ctx.fillStyle = "#9cb8c4";
        ctx.fillRect(cx, cy, W - 1, Math.floor(H * 0.55));
        setArtQuality("high");
        const post = makePost("frost-kennel", row.tier, row.branch);
        const gx = (cx + W / 2 - 8) / 16;
        const gy = (cy + H - 10 - 8) / 16;
        let t = 2.0;
        let g = makeGuard({ x: gx, y: gy });
        if (c === 0) { t = 0.7 + 8.6; } // inhale breath
        else if (c === 1) { t = 1.44 + 8.6; } // blink
        else if (c === 2) { t = 3.0 + 8.6; } // sniff
        else if (c === 3) { t = 6.3 + 8.6; } // alert
        else if (c === 4) { t = 0.45; } // howl (howlBeat < 0.95)
        else if (c >= 5 && c <= 8) {
          const rf = c - 5;
          t = 5.0;
          g = makeGuard({ x: gx, y: gy, walk: (rf + 0.2) / 7.5, movedAt: t - 0.02 });
        } else if (c === 9) {
          t = 5.0;
          g = makeGuard({ x: gx, y: gy, attack: { kind: "thrust", start: 4.7, impact: 5.05, end: 5.35, direction: [1, 0] } });
        } else if (c === 10) {
          t = 5.08;
          g = makeGuard({ x: gx, y: gy, attack: { kind: "thrust", start: 4.7, impact: 5.0, end: 5.36, direction: [1, 0] } });
        } else if (c === 11) {
          t = 5.22;
          g = makeGuard({ x: gx, y: gy, attack: { kind: "thrust", start: 4.7, impact: 5.0, end: 5.36, direction: [1, 0] } });
        } else if (c === 12) {
          t = 5.0;
          g = makeGuard({ x: gx, y: gy, hurtAt: 4.95, recoil: [-1, 0] });
        } else if (c === 13) {
          t = 5.0;
          g = makeGuard({ x: gx, y: gy, hp: 0, hurtAt: 4.86 });
        }
        post.guards = [g];
        drawGuard(ctx, g, t, post, false, "frost", true);
      });
    });
  } else if (mode === "frost-bear" || mode === "frost-roster") {
    const W = 57, H = 48, L = 42;
    const roster = mode === "frost-roster";
    const cols = ["步态 F0", "步态 F1", "步态 F2", "步态 F3", "蓄力", "技能释放", roster ? "恢复 / 缺刺" : "受击 / 暴怒"];
    if (!roster) cols.push("减速");
    const directions = [["east", "朝东"], ["south", "朝南"], ["west", "朝西"], ["north", "朝北"]] as const;
    const rows = (roster ? [["snowbrush-fox", "雪狐"], ["frost-bear", "雪熊"], ["frost-porcupine", "豪猪"]] as const
      : [["frost-bear", "雪熊"], ["frost-yeti", "雪怪"]] as const).flatMap(([type, name]) =>
      directions.map(([facing, direction]) => ({ name: `${name} · ${direction}`, type, facing })));
    canvas.width = (cols.length * W + L) * SCALE;
    canvas.height = (rows.length * H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#23271f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, L + i * W + 2, LABEL - 3));
    rows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * H + H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = L + c * W, cy = LABEL + r * H;
        ground(cx, cy, W - 1, H - 1, true);
        setArtQuality("high");
        const ex = (cx + W / 2 - 8) / 16;
        const ey = (cy + H - 10 - 9) / 16;
        const spec = ENEMIES[row.type];
        const isYeti = row.type === "frost-yeti";
        const porcupine = row.type === "frost-porcupine";
        const e = makeEnemy(row.type, {
          x: ex, y: ey,
          facing: row.facing,
          walk: c < 4 ? c + 0.1 : 1.1,
          hp: isYeti && c === 6 ? Math.floor(spec.hp * 0.4) : spec.hp,
          action: c === 4 ? { phase: "windup", progress: 0.72 }
            : c === 5 ? { phase: "active", progress: porcupine ? 0.24 : 0.48 } : undefined,
          quillsRegrowAt: porcupine && c >= 5 ? 3 : undefined,
          flash: !roster && !isYeti && c === 6 ? .12 : 0,
          slows: c === 7 ? new Map([[0.45, 5]]) : new Map(),
        });
        drawEnemy(ctx, e, 2.35, false);
        if (porcupine && c === 5) {
          const dx = row.facing === "east" ? 1 : row.facing === "west" ? -1 : 0;
          const dy = row.facing === "north" ? -1 : row.facing === "south" ? 1 : 0;
          drawGuardQuill(ctx, { x: ex, y: ey, tx: ex + dx * 1.15, ty: ey + dy * .95,
            impactAt: 2.49 }, 2.35, false);
        }
      });
    });
  } else if (mode === "mire-crawlers") {
    const width = 46, height = 35, left = 54;
    const columns = [...Array.from({ length: 8 }, (_, i) => `爬行 ${i + 1}`),
      "蓄力 1", "蓄力 2", "蓄力 3", "释放", "回缩", "收势"];
    const facings = [["侧面", "east"], ["正面", "south"], ["背面", "north"]] as const;
    const rows = (["vine-viper"] as const)
      .flatMap(type => facings.map(([name, facing]) => ({ type, name, facing })));
    canvas.width = (left + columns.length * width) * SCALE;
    canvas.height = (LABEL + rows.length * height + 4) * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.fillStyle = "#25342e";
    ctx.fillRect(0, 0, canvas.width / SCALE, canvas.height / SCALE);
    setArtQuality("high");
    columns.forEach((title, col) => label(title, left + col * width + 3, LABEL - 3));
    for (const [rowIndex, row] of rows.entries()) {
      label(ENEMIES[row.type].name, 4, LABEL + rowIndex * height + 13);
      label(row.name, 4, LABEL + rowIndex * height + 24);
      for (let col = 0; col < columns.length; col++) {
        const x = left + col * width, y = LABEL + rowIndex * height;
        ctx.fillStyle = "#4c5a4b";
        ctx.fillRect(x, y, width - 1, height - 1);
        for (let i = 0; i < 16; i++) {
          ctx.fillStyle = i % 2 ? "#4a6953" : "#364b40";
          ctx.fillRect(x + (i * 19 + rowIndex * 7) % (width - 3), y + (i * 13 + col * 5) % (height - 3), 1, 1);
        }
        const attack = col >= 8, preparing = col < 11;
        const progress = ((col - 8) % 3 + .45) / 3;
        const now = !attack ? 0 : preparing ? progress * .36 : .36 + progress * .36;
        const anchorX = x + width / 2, anchorY = y + height - 7;
        const enemy = makeEnemy(row.type, {
          x: (anchorX - 8) / 16, y: (anchorY - 9) / 16, facing: row.facing,
          walk: col / 2 + .08,
          action: attack ? { phase: preparing ? "windup" : "active", progress } : undefined,
          quillsRegrowAt: attack && !preparing ? 3 : undefined,
        });
        ctx.save();
        ctx.translate(anchorX, anchorY);
        ctx.scale(1.58, 1.58);
        ctx.translate(-anchorX, -anchorY);
        drawEnemy(ctx, enemy, now, false);
        ctx.restore();
      }
    }
  } else if (mode === "mire-roster" || mode === "mire-and-fox") {
    const W = 74, H = 72, L = 45;
    const cols = ["步态 F0", "步态 F1", "步态 F2", "步态 F3", "朝西", "朝南", "朝北", "蓄势", "释放", "恢复"];
    const rows: { name: string; type: EnemyId }[] = [
      { name: "沼枝树精", type: "mire-treant" },
      { name: "古沼树祖", type: "mire-elder" },
      { name: "泥沼潜鳄", type: "mire-croc" },
      { name: "蔓骨毒蛇", type: "vine-viper" },
      { name: "腐根菌巨兽", type: "mire-mycelid" },
      { name: "浮囊瘴母", type: "bloat-sporer" },
      { name: "活体孢囊", type: "spore-pod" },
      { name: "腐冠瘴母", type: "mire-matriarch" },
    ];
    if (mode === "mire-and-fox") rows.unshift({ name: "雪帚狐", type: "snowbrush-fox" });
    canvas.width = (cols.length * W + L) * SCALE;
    canvas.height = (rows.length * H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#23271f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, L + i * W + 2, LABEL - 3));
    rows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * H + H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = L + c * W, cy = LABEL + r * H;
        const isFox = row.type === "snowbrush-fox";
        ctx.fillStyle = isFox ? "#697d8d" : "#48534a";
        ctx.fillRect(cx, cy, W - 1, H - 1);
        for (let i = 0; i < 24; i++) {
          ctx.fillStyle = isFox ? "#91aab7" : i % 2 ? "#485e4b" : "#2c3a34";
          ctx.fillRect(cx + ((i * 19 + r * 7) % (W - 3)), cy + ((i * 13 + c * 5) % (H - 3)), 1, 1);
        }
        setArtQuality("high");
        const ex = (cx + W / 2 - 8) / 16;
        const ey = (cy + H - 10 - 9) / 16;
        const facing = c === 4 ? "west" : c === 5 ? "south" : c === 6 ? "north" : "east";
        const isTreant = row.type === "mire-treant";
        const isElder = row.type === "mire-elder";
        const isViper = row.type === "vine-viper";
        const isCroc = row.type === "mire-croc";
        const isSporer = row.type === "bloat-sporer";
        const isPod = row.type === "spore-pod";
        const isMatriarch = row.type === "mire-matriarch";
        const hasMelee = isMatriarch || isPod;
        const melee = hasMelee && c < 9 ? {
          style: (isMatriarch ? "stomp" : "pounce") as const,
          start: c === 7 ? 2.05 : 1.82,
          impact: c === 7 ? 2.6 : 2.18,
          end: c === 7 ? 3 : 2.6,
          hit: false,
          direction: [1, 0] as const,
          facing: "east" as const,
        } : undefined;
        const e = makeEnemy(row.type, {
          x: ex,
          y: ey,
          facing,
          walk: c < 4 ? c + 0.15 : 1.1,
          action: isTreant || isElder || isViper || isCroc || isSporer || isFox
            ? c === 7 ? { phase: "windup", progress: .72 }
              : c === 8 ? { phase: "active", progress: isCroc ? .14 : .4 } : undefined
            : undefined,
          melee,
          mireCast: isElder && c === 8 || isMatriarch && c === 9
            ? { startedAt: 1.2 } : undefined,
          quillsRegrowAt: isViper && c >= 8 ? 3 : undefined,
        });
        ctx.save();
        const anchorX = cx + W / 2, anchorY = cy + H - 10;
        ctx.translate(anchorX, anchorY);
        const artScale = isMatriarch ? .82 : isElder ? .95 : 1.4;
        ctx.scale(artScale, artScale);
        ctx.translate(-anchorX, -anchorY);
        drawEnemy(ctx, e, 2.35, false);
        if (isViper && c === 8) {
          drawGuardQuill(ctx, {
            x: ex, y: ey, tx: ex + 1.15, ty: ey,
            impactAt: 2.49, enemy: "vine-viper",
          }, 2.35, false);
        }
        ctx.restore();
      });
    });
  } else {
    const cols = ["旧·行走", "新·行走", "受击闪白", "减速/冰冻", "死亡 .12", "死亡 .42", "死亡 .75"];
    const enemyRows: { name: string; type: EnemyId; frostDeath?: boolean }[] = [
      { name: "苔泥怪(溶解)", type: "slime" },
      { name: "矿灯鼹(溶解)", type: "lamp-mole" },
      { name: "炉渣矿车(碎裂)", type: "slag-cart" },
      { name: "雪冠犀(冰碎)", type: "ram", frostDeath: true },
      { name: "岩壳兽(碎裂)", type: "guard" },
    ];
    canvas.width = (cols.length * CELL_W + LEFT + 6) * SCALE;
    canvas.height = (enemyRows.length * CELL_H + LABEL + 4) * SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#23271f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    cols.forEach((c, i) => label(c, LEFT + 6 + i * CELL_W + 2, LABEL - 3));
    enemyRows.forEach((row, r) => {
      label(row.name, 2, LABEL + r * CELL_H + CELL_H / 2);
      cols.forEach((_, c) => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const cx = LEFT + 6 + c * CELL_W, cy = LABEL + r * CELL_H;
        ground(cx, cy, CELL_W - 1, CELL_H - 1);
        setArtQuality(c === 0 ? "low" : "high");
        const ex = (cx + CELL_W / 2 - 8) / 16;
        const ey = (cy + CELL_H - 12 - 9) / 16;
        const slowed = c === 3 || (row.frostDeath && c >= 4);
        const e = makeEnemy(row.type, {
          x: ex, y: ey,
          walk: 1.4,
          flash: c === 2 ? .18 : 0,
          slows: slowed ? new Map([[0.45, 5]]) : new Map(),
        });
        if (c < 4) {
          drawEnemy(ctx, e, 2.3, false, c === 2 ? { heavy: true } : undefined);
        } else {
          const progress = c === 4 ? .12 : c === 5 ? .42 : .75;
          drawEnemyDefeat(ctx, e, progress, false);
        }
      });
    });
  }
  document.title += " · ready";
}

void run();
