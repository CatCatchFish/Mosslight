import { paintSprite, stamp } from "../../src/render/pixel-sprite.ts";
import { paintSporeCaster } from "../../src/render/mire-expansion-art.ts";
import { mireElder } from "../../src/render/mire-elder-art.ts";
import { mireMatriarch, sporePod } from "../../src/render/mire-matriarch-art.ts";
import { drawTower } from "../../src/render/tower-art.ts";
import { shadeSprite } from "../../src/render/tower-life.ts";
import { artFor, lanternMoth, mudskipper, paddleOtter, reedPost, reedSpider, reedSpiderling,
  saltCaster, shieldCrayfish, sluiceDragon, stoneClam, whiskerCatfish } from "./art.ts";
import type { Art, ArtOptions, OtterIdle, OtterPose, Painter, View } from "./art.ts";

const width = 984;
const paper = "#18282a";
const text = "#eeecda";
const secondary = "#abc0ae";
const accent = "#d3d99c";

function surface(id: string, height: number) {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);
  return ctx;
}

function label(ctx: CanvasRenderingContext2D, words: string, x: number, y: number, size = 16,
  color = text, weight = 500) {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(words, x, y);
}

function heading(ctx: CanvasRenderingContext2D, name: string, note: string) {
  ctx.fillStyle = accent;
  ctx.fillRect(27, 25, 4, 53);
  label(ctx, name, 44, 50, 28, text, 720);
  label(ctx, note, 45, 73, 14, secondary);
}

const backdrops = [
  ["#405a4e", "#53694f", "#778867", "#314e49"],
  ["#434c4d", "#505c53", "#7d896e", "#344b4d"],
  ["#43564b", "#546257", "#748579", "#314a47"],
] as const;

function tile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  color: number, shadow: number, seed: number) {
  const [dark, bank, fleck, water] = backdrops[color % backdrops.length];
  ctx.fillStyle = dark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = bank;
  ctx.beginPath();
  ctx.moveTo(x, y + h*.76);
  ctx.lineTo(x+w*.22, y+h*.63);
  ctx.lineTo(x+w*.56, y+h*.67);
  ctx.lineTo(x+w*.87, y+h*.56);
  ctx.lineTo(x+w, y+h*.61);
  ctx.lineTo(x+w, y+h);
  ctx.lineTo(x, y+h);
  ctx.fill();
  for (let i = 0; i < 38; i++) {
    ctx.fillStyle = i % 3 ? fleck : water;
    ctx.fillRect(x + 3 + (i*43+seed*13)%(w-8), y+3+(i*31+seed*7)%(h-7), i%3 ? 3 : 6, i%2+1);
  }
  const sx = Math.floor(x+w/2), sy = y+h-16;
  ctx.fillStyle = "#263b34";
  ctx.fillRect(sx-shadow, sy, shadow*2, 3);
  ctx.fillRect(sx-shadow+5, sy-2, shadow*2-10, 7);
}

function sprite(ctx: CanvasRenderingContext2D, draw: (painter: Art) => void, x: number, y: number, scale: number,
  frame = 0, options?: ArtOptions) {
  stamp(ctx, shadeSprite(paintSprite((r, p) => draw(artFor(r, p, frame, false, options)), 2)), x, y, scale);
}

function sporeFrame(ctx: CanvasRenderingContext2D, x: number, y: number,
  tier: number, path: string | null, age: number, scale = 2.5) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawTower(ctx, 0, 0, "spore-caster", tier, path, { age, time: .7, heading: 6 });
  ctx.restore();
}

function towerSheet() {
  const ctx = surface("towers", 1690);
  heading(ctx, "瘴雾毒沼 · 炮塔与水獭设计", "瘦高水乡塔楼 · 投罐塔连贯投掷 · 孢匣塔蓄力攻击 · 水獭分层待机");
  const options = [
    { name: "苇篷哨舍", note: "拦截塔 · 高脚水乡哨楼，派出水獭筏卫抵抗位移",
      tiers: ["1 级 苇篷", "2 级 加桩", "3 级 固堤班", "4 级 系缆阵", "3 级 探滩队", "4 级 双桨巡卫"],
      draw: reedPost },
    { name: "盐釉投罐塔", note: "攻击塔 · 高架投罐塔楼，陶罐落地溅开白盐削弱重甲",
      tiers: ["1 级 单罐", "2 级 加篮", "3 级 双簧", "4 级 厚釉破甲", "4 级 分罐盐雨", "脱篮抛射"],
      draw: (a: Art, index: number) => saltCaster(a, index === 5 ? 2 : index, index === 5 ? 5 / 9 : 0) },
    { name: "孢匣塔", note: "攻击塔 · 木架悬囊，毒孢附着地面敌人并在倒地后向近邻传播",
      tiers: ["1 级 单囊", "2 级 侧囊", "3 级 双囊", "4 级 爆孢", "4 级 寄生", "满囊压缩"],
      draw: (a: Art, index: number) => paintSporeCaster(a.r, a.p,
        index < 3 ? index + 1 : 3, index === 3 ? "burst-spores" : index === 4 ? "parasitic-spores" : null) },
  ];
  options.forEach((tower, i) => {
    const y = 104 + i * 194;
    label(ctx, tower.name, 27, y + 19, 22, accent, 670);
    label(ctx, tower.note, 192, y + 17, 14, secondary);
    tower.tiers.forEach((tier, j) => {
      const x = 27 + j * 156;
      tile(ctx, x, y + 30, 146, 114, i, j === 5 ? 27 : 29, j);
      if (tower.name === "孢匣塔") {
        sporeFrame(ctx, x + 73, y + 128, j < 3 ? j + 1 : 3,
          j === 3 ? "burst-spores" : j === 4 ? "parasitic-spores" : null,
          j === 5 ? -.012 : Infinity);
      } else sprite(ctx, a => tower.draw(a, j), x + 73, y + 128, 3.05);
      label(ctx, tier, x + 8, y + 165, 14);
    });
  });

  const yCharge = 650;
  label(ctx, "孢匣塔 · 蓄力攻击关键帧", 27, yCharge + 17, 22, accent, 670);
  label(ctx, "0.28 秒收囊蓄能：孢粒旋入 → 束带绷紧 → 满囊压缩 → 开囊喷射 → 弹囊回位", 272, yCharge + 16, 14, secondary);
  const chargeFrames: readonly [string, number][] = [
    ["1 待机悬囊", Infinity],
    ["2 孢粒旋入", -.2],
    ["3 束带绷紧", -.09],
    ["4 满囊压缩", -.012],
    ["5 开囊喷射", .015],
    ["6 余孢回弹", .16],
  ];
  chargeFrames.forEach(([name, age], i) => {
    const x = 27 + i * 156;
    tile(ctx, x, yCharge + 28, 146, 114, 2, 29, i + 40);
    sporeFrame(ctx, x + 73, yCharge + 126, 3, null, age, 2.35);
    label(ctx, name, x + 8, yCharge + 163, 14);
  });

  // Row 3: Salt-Caster throwing keyframes (continuous 10-frame catapult cycle showcase)
  const yThrow = 884;
  label(ctx, "盐釉投罐塔 · 投掷关键帧", 27, yThrow + 17, 22, accent, 670);
  label(ctx, "10 帧连贯蓄力抛射：后拉压簧 → 满蓄绷紧 → 弹臂猛挥 → 脱篮抛射 → 空臂回弹 → 补罐归位", 272, yThrow + 16, 14, secondary);
  const throwFrames: readonly [string, number][] = [
    ["1 后拉蓄力", 1 / 9],
    ["2 满蓄压簧", 3 / 9],
    ["3 弹臂猛挥", 4 / 9],
    ["4 脱篮抛射", 5 / 9],
    ["5 空臂惯性", 6 / 9],
    ["6 补罐回位", 8 / 9],
  ];
  throwFrames.forEach(([name, phase], i) => {
    const x = 27 + i * 156;
    tile(ctx, x, yThrow + 28, 146, 114, 1, 28, i + 20);
    sprite(ctx, a => saltCaster(a, 2, phase), x + 73, yThrow + 126, 3.05);
    label(ctx, name, x + 8, yThrow + 163, 14);
  });

  const yIdle = 1078;
  label(ctx, "水獭筏卫 · 分层待机", 27, yIdle + 17, 22, accent, 670);
  label(ctx, "呼吸底循环 · 单位间错峰 · 固定正面待机 · 嗅水 / 竖耳 / 张望 / 查桨 / 低频拍尾", 242, yIdle + 16, 14, secondary);
  const idleActions: readonly [string, string, OtterIdle, View, number][] = [
    ["安静呼吸", "8 帧起伏", "none", "front", 1],
    ["轻眨双眼", "短暂停顿", "blink", "front", 0],
    ["低头嗅水", "鼻尖探寻", "sniff", "front", 2],
    ["竖耳警觉", "耳尖弹动", "flick", "front", 1],
    ["左右张望", "头部巡视", "scan", "front", 2],
    ["检查船桨", "低头整理", "check-paddle", "front", 2],
    ["抬尾蓄势", "低频动作", "tail-lift", "front", 2],
    ["甩尾拍水", "水花余波", "tail-slap", "front", 0],
  ];
  idleActions.forEach(([name, detail, action, view, frame], i) => {
    const x = 27 + i * 117;
    tile(ctx, x, yIdle + 28, 108, 136, 2, 24, i + 60);
    sprite(ctx, a => paddleOtter(a, view, false), x + 54, yIdle + 151, 2.45, frame, {
      otter: { tier: 1, pose: "idle", idle: action },
    });
    label(ctx, name, x + 6, yIdle + 184, 12);
    label(ctx, detail, x + 6, yIdle + 201, 11, secondary);
  });

  // Row 4: Enlarged Upright Paddle Otter Sentinel — 8-frame rich idle, walk, attack & brace
  const yPose = 1298;
  label(ctx, "水獭筏卫 · 动作姿态", 27, yPose + 17, 22, accent, 670);
  label(ctx, "蓝黑描边 · 灰褐毛色 · 铜扣束带 · 8 帧待机与完整挥桨动作", 242, yPose + 16, 14, secondary);
  const poses: readonly [string, View, OtterPose, number, OtterIdle][] = [
    ["正面待机", "front", "idle", 0, "none"],
    ["待机拍尾", "front", "idle", 0, "tail-slap"],
    ["侧面步行", "side", "walk", 1, "none"],
    ["攻击蓄力", "side", "windup", 0, "none"],
    ["挥桨重劈", "side", "strike", 0, "none"],
    ["横桨接敌", "side", "brace", 0, "none"],
  ];
  poses.forEach(([name, view, pose, frame, action], i) => {
    const x = 27 + i * 156;
    tile(ctx, x, yPose + 28, 146, 116, 2, 27, i);
    sprite(ctx, a => paddleOtter(a, view, pose === "brace"), x + 73, yPose + 128, 3.35, frame, {
      otter: { tier: 1, pose, idle: action },
    });
    label(ctx, name, x + 8, yPose + 166, 14);
  });

  // Row 5: Paddle Otter — Upgrade progression preview
  const yTier = 1496;
  label(ctx, "水獭筏卫 · 升级形象", 27, yTier + 17, 22, accent, 670);
  label(ctx, "正面 / 侧面 / 背面 · 等级与分支通过护肩、头带、束带和背桨逐级区分", 242, yTier + 16, 14, secondary);
  const ranks: readonly [string, string, number, string | undefined, View][] = [
    ["1 级 苇篷水獭", "素束带", 1, undefined, "front"],
    ["2 级 加桩水獭", "额带护胸", 2, undefined, "front"],
    ["3 级 苇篷卫", "背面束带", 3, undefined, "back"],
    ["3 级 固堤班", "宽肩扣板", 3, "fixed-bank", "front"],
    ["3 级 探滩队", "轻巾单桨", 3, "mud-patrol", "side"],
    ["4 级 固堤系缆", "玉甲水标桨", 4, "fixed-bank", "front"],
    ["4 级 双桨巡卫", "红巾背双桨", 4, "mud-patrol", "side"],
  ];
  ranks.forEach(([name, detail, tier, branch, view], i) => {
    const x = 27 + i * 133;
    tile(ctx, x, yTier + 28, 124, 118, 2, 27, i + 10);
    sprite(ctx, a => paddleOtter(a, view, false), x + 62, yTier + 130, 3.25, 0, {
      otter: { tier, branch, pose: "idle" },
    });
    label(ctx, name, x + 7, yTier + 168, 12);
    label(ctx, detail, x + 7, yTier + 186, 11, secondary);
  });
}

const enemies: readonly { name: string; role: string; copy: readonly string[]; painter: Painter; skill: string; scale: number }[] = [
  { name: "藻褶弹涂鱼", role: "普通 · 浅泥快怪", copy: ["胸鳍张开、压腹蓄势", "在浅泥路段短跳"], painter: mudskipper, skill: "展鳍跃泥", scale: 3.25 },
  { name: "泥盾蝲蛄", role: "普通 · 朝向护甲", copy: ["单侧泥钳抬到头前", "侧翼与溅射绕过护盾"], painter: shieldCrayfish, skill: "单钳举盾", scale: 3.3 },
  { name: "灯囊沼蛾", role: "普通 · 空中投渡", copy: ["灯腹下沉并放下吊钩", "携带一只轻型同伴"], painter: lanternMoth, skill: "吊渡负重", scale: 3.2 },
  { name: "鞭须泥鲶", role: "小领主 · 拖拽", copy: ["扁头厚唇、四组长须与分叉尾", "背生短藻须，泥壳沿腹缘附着"], painter: whiskerCatfish, skill: "卷须拖拽", scale: 3.45 },
  { name: "瓮背石蚌", role: "小领主 · 壳体开合", copy: ["扇贝双壳、铰链、虹吸管与露珠", "壳缘覆藻，腹侧嵌入浓泥"], painter: stoneClam, skill: "开壳露珠", scale: 3.5 },
  { name: "芦影织蛛", role: "小领主 · 可打断增援", copy: ["枯枝足撑地，落下卵囊", "先打卵囊可阻止增援"], painter: reedSpider, skill: "织丝落囊", scale: 3.45 },
  { name: "芦影蛛幼体", role: "衍生 · 卵囊孵化", copy: ["乳白卵囊 4 秒未毁孵出 2 只", "低血快跑，无击杀金币"], painter: reedSpiderling, skill: "破囊而出", scale: 3.15 },
  { name: "古沼树祖", role: "小领主 · 召根助战", copy: ["根甲王座、苇冠枝角与持杖树脸", "扎根吟唱，唤出两只沼枝树精"], painter: mireElder, skill: "召根唤树", scale: 4.15 },
  { name: "活体孢囊", role: "衍生 · 破囊毒爆", copy: ["矮胖菌囊、抓地根须与发光菌核", "为毒母供养，击破后连锁炸伤近敌"], painter: sporePod, skill: "菌核脉动", scale: 3.1 },
  { name: "腐冠瘴母", role: "关底 Boss · 孢囊供养", copy: ["宽扁蛙躯、多层腐菌伞冠与发光喉囊", "扎根孵囊；先断供养，再集火毒母"], painter: mireMatriarch, skill: "腐冠孵瘴", scale: 3.7 },
  { name: "沉堤泽蛟", role: "最终 Boss · 两路泥潮", copy: ["重甲角冠、巨吻獠牙与骨刺长尾", "抬闸蓄势，半血裂纹双路放潮"], painter: sluiceDragon, skill: "抬闸放潮", scale: 4.1 },
];

function enemySheet() {
  const rowHeight = 136;
  const ctx = surface("enemies", 119 + enemies.length * rowHeight + 18);
  heading(ctx, "瘴雾毒沼 · 怪物与首领", "8 帧行走动作 · 专属近战攻击姿态 · 技能姿态");
  const views: readonly [string, View, boolean, boolean][] = [
    ["正面", "front", false, false],
    ["侧面", "side", false, false],
    ["背面", "back", false, false],
    ["攻击姿态", "side", false, true],
    ["技能姿态", "side", true, false],
  ];
  views.forEach(([title], i) => label(ctx, title, 250 + i * 142, 104, 14, secondary, 600));
  enemies.forEach((enemy, i) => {
    const isBoss = enemy.name === "腐冠瘴母" || enemy.name === "沉堤泽蛟";
    const isMinion = enemy.name === "芦影蛛幼体" || enemy.name === "活体孢囊";
    const y = 117 + i * rowHeight, color = isBoss ? 2 : i >= 3 ? 1 : 0;
    ctx.fillStyle = isBoss ? "#293c39" : "#233633";
    ctx.fillRect(26, y, 932, rowHeight - 7);
    label(ctx, enemy.name, 42, y + 29, 22, isBoss ? "#f0d59b" : accent, 680);
    label(ctx, enemy.role, 42, y + 54, 14, text);
    enemy.copy.forEach((line, j) => label(ctx, line, 42, y + 81 + j * 20, 13, secondary));
    views.forEach(([, view, skill, attacking], j) => {
      const x = 244 + j * 142;
      const shadow = isBoss ? 44 : isMinion ? (skill ? 30 : 19) : i >= 3 ? 34 : 27;
      tile(ctx, x, y + 6, 134, 115, color, shadow, i * 5 + j);
      sprite(
        ctx,
        a => enemy.painter(a, view, skill),
        x + 67,
        y + 101,
        enemy.scale * 0.92,
        0,
        attacking ? { attack: "strike" } : undefined,
      );
      if (attacking) label(ctx, "近战出手", x + 6, y + 117, 12, "#ffd9a0", 650);
      if (skill) label(ctx, enemy.skill, x + 6, y + 117, 12, "#fff3cc", 650);
    });
  });
}

towerSheet();
enemySheet();
(document.getElementById("save-towers") as HTMLAnchorElement).href =
  (document.getElementById("towers") as HTMLCanvasElement).toDataURL("image/png");
(document.getElementById("save-enemies") as HTMLAnchorElement).href =
  (document.getElementById("enemies") as HTMLCanvasElement).toDataURL("image/png");
document.title += " · ready";
