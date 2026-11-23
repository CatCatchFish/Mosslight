import { battleWeather, CHAPTERS } from "../../src/content/campaign.ts";
import { REGIONAL_ENEMIES } from "../../src/content/regional-enemies.ts";
import { DefenseGame } from "../../src/engine/defense.ts";
import { abilityCooldownRemaining, isBurrowing } from "../../src/engine/enemy-abilities.ts";
import type { Facing } from "../../src/engine/formation.ts";
import type { EnemyId, Level } from "../../src/engine/types.ts";
import { createBattleRenderer } from "../../src/render/battlefield.ts";
import { canvas2d } from "../../src/render/canvas.ts";
import { atlasEnemySprite, loadEnemyAtlases } from "../../src/render/enemy-atlas.ts";
import { paintFrostPorcupine } from "../../src/render/frost-creatures.ts";
import { paintSprite } from "../../src/render/pixel-sprite.ts";

const scenarios = {
  "moss-badger": { chapter: 0, biome: "forest", ally: "stump-spirit", status: "潜行 · 兔卫失去拦截" },
  "mirror-shrimp": { chapter: 1, biome: "wetland", ally: "weir-frog", status: "喷出水幕 · 同批怪物获得一次撞击减伤" },
  "rivet-mite": { chapter: 2, biome: "quarry", ally: "lamp-mole", status: "沿路冲刺 · 暂时甩开拦截" },
  "frost-porcupine": { chapter: 3, biome: "frost", ally: "wisp", status: "发射霜刺 · 背部露出" },
} as const satisfies Record<keyof typeof REGIONAL_ENEMIES, {
  chapter: number; biome: Level["biome"]; ally: EnemyId; status: string;
}>;

const selector = document.querySelector<HTMLSelectElement>("#enemy")!;
const facing = document.querySelector<HTMLSelectElement>("#facing")!;
const motion = document.querySelector<HTMLSelectElement>("#motion")!;
const defenses = document.querySelector<HTMLInputElement>("#defenses")!;
const arena = document.querySelector<HTMLCanvasElement>("#arena")!;
const ctx = canvas2d(document.querySelector<HTMLCanvasElement>("#pose")!);
const name = document.querySelector("#name")!;
const mechanic = document.querySelector("#mechanic")!;
const status = document.querySelector("#status")!;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const step = 1 / 60;
let game: DefenseGame;
let render: ReturnType<typeof createBattleRenderer>;
let type: keyof typeof scenarios;
let statusText = "";
let poseStart = 0;
let lastFrame = 0, remainder = 0;
const porcupinePoses = new Map<string, HTMLCanvasElement>();

for (const [id, { chapter }] of Object.entries(scenarios)) {
  const { name } = REGIONAL_ENEMIES[id as keyof typeof scenarios];
  selector.add(new Option(CHAPTERS[chapter].name + " · " + name, id));
}

function replay() {
  type = selector.value as keyof typeof scenarios;
  const { chapter, biome, ally } = scenarios[type];
  const spec = REGIONAL_ENEMIES[type];
  const badger = type === "moss-badger";
  name.textContent = spec.name;
  mechanic.textContent = type === "moss-badger" ? spec.note : `${spec.note} 技能冷却 ${spec.ability.cooldown} 秒。`;
  const level: Level = {
    id: "preview", name: spec.name, chapter, biome, description: spec.note,
    width: 22, height: 11, seed: 80732 + chapter, gold: 500, health: 30,
    towers: ["arrow", "frost", "cannon"], guardPost: true, wavePrep: 16, earlyRate: 3, maxEarlyReward: 0,
    entries: [{ id: "mouth", label: "演练入口", marker: [0, 5], delay: 0, scenery: "trail",
      route: [[0, 5], [7, 5], [7, 8], [14, 8], [14, 4], [21, 4]] }],
    plots: badger ? [[4, 4], [6, 4], [16, 4]] : [[4, 6], [10, 7], [16, 4]],
    pools: [],
    waves: [{ title: "机制演练", groups: { mouth: badger ? [[type, 1, 1]] : [[[type, ally], 4, 0.34, 4]] } }],
  };
  game = new DefenseGame(level);
  if (defenses.checked) {
    game.build(0, "guard-post");
    game.build(1, badger ? "guard-post" : "frost");
    if (!badger) game.build(2, "arrow");
  }
  render = createBattleRenderer(arena, game, battleWeather(level));
  game.startFirstWave();
  poseStart = performance.now();
  lastFrame = 0;
  remainder = 0;
}

function abilityStatus() {
  if (game.ended) return "演练结束，可重播或切换候选。";
  const candidates = game.enemies.filter((enemy) => enemy.type === type);
  if (candidates.some(isBurrowing) || candidates.some((enemy) => enemy.action?.phase === "active"))
    return scenarios[type].status;
  if (candidates.some((enemy) => enemy.action?.phase === "windup"))
    return type === "moss-badger" ? "刨土预警 · 兔卫仍可拦截" : "技能预警";
  const recovering = candidates.find((enemy) => abilityCooldownRemaining(enemy) > 0);
  if (recovering) {
    const wait = Math.ceil(abilityCooldownRemaining(recovering));
    if (type === "moss-badger") return `已经出土 · 可拦截 · 冷却还剩 ${wait} 秒`;
    if (recovering.action?.phase === "exposed") return `腹侧露出 · 护甲还需 ${wait} 秒恢复`;
    if (game.enemies.some((enemy) => enemy.screen && enemy.screen.until > enemy.age))
      return `水幕已附着 · 可用快射消耗 · 冷却还剩 ${wait} 秒`;
    return `下次技能还需 ${wait} 秒`;
  }
  if (type === "moss-badger") return "潜行就绪 · 遇到兔卫拦截时会刨土";
  return "实战演练";
}

function frame(now: number) {
  remainder += Math.min(0.1, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  while (remainder >= step) {
    game.tick(step);
    remainder -= step;
  }
  const active = motion.value === "attack";
  const time = Math.floor((now - poseStart) / (active ? 145 : 125));
  const pose = reducedMotion.matches ? active ? 2 : 0 : active ? Math.min(time % 8, 3) : time % 4;
  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;
  const direction = facing.value as Facing;
  if (type === "frost-porcupine") {
    const key = `${direction}/${pose}/${active}`;
    let sprite = porcupinePoses.get(key);
    if (!sprite) {
      sprite = paintSprite((_, p) => paintFrostPorcupine(p, pose, direction, active, active && pose >= 2), 2);
      porcupinePoses.set(key, sprite);
    }
    ctx.save();
    if (direction === "west") {
      ctx.translate(56, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sprite, 0, 0, 64, 64);
    ctx.restore();
  } else ctx.drawImage(atlasEnemySprite(type, pose, direction, active), 0, 0, 64, 64);
  const { width, height } = arena.getBoundingClientRect();
  render({ width, height, board: { x: 0, y: 0, width, height } }, {
    selected: null, hoveredType: null, training: null, uiTime: now, scenery: [], showRanges: false, guardRange: null,
  });
  const nextStatus = abilityStatus();
  if (nextStatus !== statusText) {
    statusText = nextStatus;
    status.textContent = statusText;
  }
  requestAnimationFrame(frame);
}

try {
  await loadEnemyAtlases();
  selector.addEventListener("change", replay);
  defenses.addEventListener("change", replay);
  document.querySelector("#replay")!.addEventListener("click", replay);
  motion.addEventListener("change", () => { poseStart = performance.now(); });
  replay();
  requestAnimationFrame(frame);
} catch {
  status.textContent = "候选素材加载失败，请刷新页面。";
}
