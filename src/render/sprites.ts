import { paintNewEnemy } from "./late-game.ts";
import { paintWeirFrog, paintWeirTurtle } from "./bridge-enemies.ts";
import { paintCableOverseer, paintLilySkater, paintMagnetBeetle } from "./shoals-mine-enemies.ts";
import { paintMirrorIbex, paintSnowbrushFox } from "./sunmirror-enemies.ts";
import { paintOreCrawler, paintReedNewt } from "./region-grunts.ts";
import { paintFrostBear, paintFrostPorcupine, paintFrostYeti, paintIceSail } from "./frost-creatures.ts";
import { paintFrostMoose } from "./frost-boss.ts";
import type { MoosePose } from "./frost-boss.ts";
import {
  paintBloatSporer,
  paintMireCroc,
  paintMireMycelid,
  paintMireTreant,
} from "./mire-creatures.ts";
import { CRAWL_ATTACK_PHASE_FRAMES, CRAWL_FRAMES, paintVineViper } from "./mire-crawlers.ts";
import {
  paintBlizzardElk,
  paintFrostMammoth,
  paintLotusToad,
  paintPineBoar,
  paintRimeGolem,
  paintSlagColossus,
  paintSlagDriller,
} from "./regional-minibosses.ts";
import type { MammothPose } from "./regional-minibosses.ts";
import type { NewEnemy } from "./late-game.ts";
import { atlasEnemySprite, hasEnemyAtlas } from "./enemy-atlas.ts";
import type { AtlasEnemy } from "./enemy-atlas.ts";
import { REGIONAL_ENEMIES } from "../content/regional-enemies.ts";
import { ORIGIN_X, ORIGIN_Y, SIZE, paintSprite, SPRITE_DETAIL, stamp } from "./pixel-sprite.ts";
import type { Rect, Shape } from "./pixel-sprite.ts";
import type { Facing } from "../engine/formation.ts";
import { drawAxialEnemy } from "./fronts.ts";
import { paintChief } from "./chief.ts";
import type { ChiefPose } from "./chief.ts";
import { ENEMIES } from "../content/enemies.ts";
import { activeEnrage, isAirborne, isBurrowing, isNetted, isStaggered, quillsSpent, sunExposure } from "../engine/enemy-abilities.ts";
import { ANTLER_SWEEP_RADIUS, CHIEF_CLEAVE_RADIUS, MAMMOTH_QUAKE_RADIUS, WEIR_SURGE_RADIUS } from "../engine/melee.ts";
import { CELL } from "../engine/route.ts";
import type { Enemy, EnemyId } from "../engine/types.ts";
import { diamond, drawNetMesh, pixelRing } from "./animation.ts";
import { canvas2d } from "./canvas.ts";
import { highQuality } from "./quality.ts";
import { box } from "./terrain.ts";
import { pixelEllipse, shadeSprite } from "./tower-life.ts";
import { drawFrostStatus, drawNewEnemyAura, drawRichDefeat, drawSporeStatus, tintedSilhouette } from "./unit-life.ts";
import type { DefeatStyle } from "./unit-life.ts";

type EnemyPainter = (rect: Rect, shape: Shape, frame: number) => void;
type SunmirrorEnemy = "mirror-ibex" | "snowbrush-fox";
import { isMireEnemy, mireEnemyPose, mireEnemySprite, MIRE_HEIGHTS, MIRE_SCALES } from "./mire-units.ts";
import type { ArtOptions } from "./mire-expansion-art.ts";
import type { MireEnemy } from "./mire-units.ts";

type FrostCreature = "frost-bear" | "frost-yeti" | "frost-porcupine" | "ice-sail" | "frost-moose";
type MireCreature = "mire-treant" | "mire-croc" | "vine-viper" | "mire-mycelid" | "bloat-sporer";
type RegionGrunt =
  | "reed-newt" | "ore-crawler" | "frost-ray" | "frost-hare";
// 精细精灵使用单个物理像素作画，地图的逻辑格与碰撞坐标保持独立。
const enemyPainters: Record<Exclude<EnemyId, NewEnemy | AtlasEnemy | SunmirrorEnemy | FrostCreature | MireCreature | MireEnemy | RegionGrunt | "weir-frog" | "weir-turtle" | "lily-skater" | "magnet-beetle" | "cable-overseer" | "slag-colossus" | "pine-boar" | "lotus-toad" | "slag-driller" | "frost-mammoth" | "rime-golem" | "blizzard-elk" | "chief">, EnemyPainter> = {
  slime(r, p, frame) {
    const tall = [0, 2, 3, 1][frame];
    const base = frame === 0 ? 16 : 14;
    p(
      "#233821",
      [-base, 1],
      [-base, -5],
      [-10, -12 - tall],
      [-2, -16 - tall],
      [6, -15 - tall],
      [13, -9 - tall],
      [base, -3],
      [base, 2],
      [9, 5],
      [-8, 5],
    );
    p(
      "#698f40",
      [-base + 2, 0],
      [-base + 2, -5],
      [-9, -12 - tall],
      [-2, -15 - tall],
      [5, -14 - tall],
      [12, -8 - tall],
      [base - 2, -2],
      [base - 2, 2],
      [7, 4],
      [-9, 3],
    );
    p(
      "#9bc759",
      [-12, -4],
      [-8, -11 - tall],
      [-1, -14 - tall],
      [6, -12 - tall],
      [10, -8],
      [8, -3],
      [0, 0],
      [-9, -1],
    );
    p(
      "#c7dd78",
      [-10, -7],
      [-6, -11 - tall],
      [-2, -13 - tall],
      [3, -12 - tall],
      [0, -10 - tall],
      [-5, -9],
    );
    r(-8, -10 - tall, 4, 2, "#e9eca4");
    r(-5, -13 - tall, 2, 1, "#e0f5a1");
    r(-11, -5, 2, 2, "#bdcd6f");
    r(0, -6, 3, 3, "#263722");
    r(7, -7, 3, 3, "#2e3820");
    r(1, -6, 1, 1, "#fff1b9");
    r(8, -7, 1, 1, "#fff1b9");
    r(3, -1, 4, 1, "#4d662f");
    r(4, 0, 2, 1, "#d9d87d");
    r(-8, 2, 6, 1, "#597338");
    r(-12, -10 - tall, 2, 1, "#7ba84f");
    r(-15, -3, 3, 1, "#527c3d");
    r(11, -2, 3, 2, "#a9c763");
    p("#bbd870", [-11, -12 - tall], [-6, -16 - tall], [-1, -17 - tall],
      [4, -16 - tall], [5, -14 - tall], [0, -14 - tall], [-6, -12 - tall]);
    r(-5, -15 - tall, 3, 1, "#edf0a8");
    for (const [x, y, size] of [[-9, -3, 2.5], [-4, -5, 1.5], [10, 1, 1.5]]) {
      r(x, y, size, size * .7, "#6c9850");
      r(x + .5, y, .75, .75, "#e1dc88");
    }
  },
  runner(r, p, frame) {
    for (let i = 0; i < 3; i++) {
      const x = -10 + i * 7,
        step = ((frame + i) % 3) - 1;
      p(
        "#3e2923",
        [x - 2, -5],
        [x + 1, -5],
        [x + step + 2, 1],
        [x + step + 6, 1],
        [x + step + 6, 3],
        [x + step, 3],
      );
      r(x + step + 3, 1, 3, 1, "#ae6f45");
      p(
        "#5d3528",
        [x - 1, -7],
        [x + 1, -7],
        [x - step - 3, -1],
        [x - step - 5, -1],
        [x - step - 5, -3],
      );
    }
    p(
      "#3a2b22",
      [-17, -5],
      [-17, -11],
      [-12, -18],
      [-5, -21],
      [3, -20],
      [9, -15],
      [13, -17],
      [18, -15],
      [20, -9],
      [17, -5],
      [8, -5],
      [1, -2],
      [-10, -2],
    );
    p(
      "#a64d37",
      [-16, -6],
      [-15, -12],
      [-11, -17],
      [-4, -20],
      [2, -19],
      [9, -14],
      [9, -8],
      [2, -4],
      [-9, -3],
    );
    p(
      "#d87947",
      [-14, -11],
      [-11, -16],
      [-5, -19],
      [1, -18],
      [6, -15],
      [2, -12],
      [-3, -12],
      [-8, -8],
    );
    p(
      "#f2aa61",
      [-12, -13],
      [-9, -16],
      [-5, -17],
      [-2, -17],
      [-4, -15],
      [-8, -13],
    );
    p("#723b2a", [-3, -20], [-1, -19], [2, -12], [7, -8], [6, -7], [0, -11]);
    p("#b85e38", [7, -7], [9, -13], [13, -16], [17, -14], [19, -10], [17, -7]);
    r(14, -12, 4, 2, "#452f25");
    r(15, -12, 2, 1, "#ffe4a1");
    r(10, -15, 3, 1, "#eb9e58");
    r(17, -17, 1, 4, "#694530");
    r(18, -18 - (frame % 2), 3, 1, "#ecb56b");
    r(20, -19 - (frame % 2), 2, 1, "#eaca75");
    r(15, -19, 1, 4, "#80563b");
    r(16, -21, 2, 2, "#dba357");
    r(-12, -7, 3, 1, "#efa05c");
  },
  guard(r, p, frame) {
    for (let i = 0; i < 4; i++) {
      const x = -15 + i * 8,
        step = ((frame + i * 2) % 4) - 2;
      p(
        "#333831",
        [x - 3, -7],
        [x + 4, -7],
        [x + step + 5, 3],
        [x + step - 3, 3],
        [x + step - 4, 0],
      );
      r(x + step - 2, 0, 5, 2, "#586350");
      r(x + step - 2, 0, 3, 1, "#839073");
    }
    p(
      "#28362e",
      [-22, -5],
      [-21, -14],
      [-17, -21],
      [-7, -25],
      [6, -25],
      [14, -20],
      [19, -17],
      [23, -11],
      [20, -5],
      [16, -2],
      [-15, -2],
    );
    p(
      "#596c62",
      [-20, -7],
      [-19, -14],
      [-15, -20],
      [-7, -24],
      [5, -24],
      [15, -18],
      [17, -10],
      [8, -4],
      [-14, -3],
    );
    p("#849486", [-19, -12], [-16, -19], [-9, -22], [-7, -15], [-13, -10]);
    p("#abb09b", [-15, -19], [-10, -22], [-7, -22], [-10, -19], [-14, -17]);
    p(
      "#758a7d",
      [-5, -24],
      [4, -23],
      [11, -20],
      [5, -14],
      [-5, -15],
      [-7, -19],
    );
    p("#a4a991", [-4, -23], [4, -22], [7, -20], [3, -19], [-4, -20]);
    p("#4d6156", [-16, -9], [-6, -13], [3, -12], [3, -5], [-7, -4], [-12, -5]);
    p("#8a927a", [-12, -10], [-6, -12], [1, -11], [-1, -9], [-7, -8]);
    p(
      "#68796d",
      [9, -19],
      [17, -18],
      [22, -13],
      [23, -10],
      [18, -5],
      [11, -6],
      [7, -10],
    );
    p("#9aa58c", [13, -18], [17, -17], [20, -14], [15, -13], [11, -14]);
    r(16, -12, 6, 2, "#333c32");
    r(18, -12, 3, 1, "#b9f2c2");
    r(17, -6, 3, 2, "#c7bca2");
    r(-9, -23, 3, 1, "#9dc879");
    r(-12, -21, 3, 2, "#759c57");
    r(1, -20, 3, 1, "#9dba72");
    r(7, -7, 2, 1, "#a2ac85");
  },

};

const enemyArt = new Map<string, HTMLCanvasElement>();
const healthBarOffsets: Partial<Record<EnemyId, number>> = {
  chief: 32,
  guard: 17,
  ram: 25,
  wisp: 18,
  "pine-hopper": 19,
  "stump-spirit": 22,
  "reed-crab": 18,
  "ferry-snail": 20,
  "weir-frog": 17,
  "weir-turtle": 36,
  "lily-skater": 13,
  "magnet-beetle": 25,
  "cable-overseer": 40,
  "slag-colossus": 30,
  "pine-boar": 38,
  "lotus-toad": 36,
  "slag-driller": 42,
  "frost-mammoth": 31,
  "frost-bear": 25,
  "frost-porcupine": 27,
  "frost-yeti": 32,
  "rime-golem": 25,
  "blizzard-elk": 30,
  "frost-moose": 33,
  "mirror-ibex": 25,
  "snowbrush-fox": 21,
  "reed-newt": 17,
  "ore-crawler": 19,
  "frost-ray": 29,
  "frost-hare": 33,
  "lamp-mole": 20,
  "slag-cart": 21,
  "cinder-bat": 31,
  "ice-sail": 22,
  "frost-owl": 26,
  "mire-treant": 28,
  "mire-elder": 36,
  "mire-croc": 18,
  "vine-viper": 23,
  "mire-mycelid": 27,
  "bloat-sporer": 31,
};
const CHIEF_ART_SCALE = 1.52;
const regionalArtScale: Partial<Record<EnemyId, number>> = {
  ram: 1.08,
  "frost-mammoth": 1.30,
  "slag-colossus": 1.24,
  "frost-bear": 0.96,
  "frost-porcupine": 0.85,
  "frost-yeti": 1.12,
  "rime-golem": 0.88,
  "blizzard-elk": 1.20,
  "frost-moose": 1.52,
  "mirror-ibex": 0.78,
  "snowbrush-fox": 0.88,
  "ice-sail": 0.86,
  "reed-newt": 0.95,
  "ore-crawler": 0.86,
  "moth": 0.95,
  "frost-ray": 1.02,
  "mire-treant": 0.92,
  "mire-croc": 0.88,
  "vine-viper": 1.0,
  "mire-mycelid": 0.94,
  "bloat-sporer": 0.86,
};
const regionalIconHeight: Partial<Record<EnemyId, number>> = {
  ram: 52,
  "frost-mammoth": 58,
  "slag-colossus": 60,
  "frost-bear": 52,
  "frost-porcupine": 55,
  "frost-yeti": 60,
  "rime-golem": 52,
  "blizzard-elk": 59,
  "frost-moose": 64,
  "mirror-ibex": 61,
  "snowbrush-fox": 44,
  "ice-sail": 40,
  "reed-newt": 40,
  "ore-crawler": 40,
  "moth": 44,
  "frost-ray": 49,
  "frost-hare": 54,
  "mire-treant": 52,
  "mire-croc": 36,
  "vine-viper": 46,
  "mire-mycelid": 50,
  "bloat-sporer": 52,
};
const SHADED_NEW_ENEMIES = new Set<EnemyId>([
  "ram",
  "pine-boar",
  "lotus-toad",
  "slag-driller",
  "frost-mammoth",
  "slag-colossus",
  "frost-bear",
  "frost-porcupine",
  "frost-yeti",
  "rime-golem",
  "blizzard-elk",
  "frost-moose",
  "snowbrush-fox",
  "mirror-ibex",
  "ice-sail",
  "reed-newt",
  "ore-crawler",
  "moth",
  "mire-treant",
  "mire-croc",
  "vine-viper",
  "mire-mycelid",
  "bloat-sporer",
]);
function enemySprite(type: EnemyId, frame: number, facing: Facing, activePose = false, enraged = false,
  striking = false, flying = false, chiefPose: ChiefPose = "march", spentQuills = false,
  mammothPose: MammothPose = "march", moosePose: MoosePose = "walk", mireOptions?: ArtOptions) {
  if (isMireEnemy(type)) return mireEnemySprite(type, frame, facing, activePose, mireOptions);
  if (hasEnemyAtlas(type)) return atlasEnemySprite(type, frame, facing, activePose);
  const side = facing === "east" || facing === "west";
  const shaded = highQuality() && SHADED_NEW_ENEMIES.has(type);
  const key = type + "/" + frame + "/" + (side ? "profile" : facing) + (activePose ? "/charge" : "")
    + "/" + chiefPose + "/" + mammothPose + "/" + moosePose + (enraged ? "/rage" : "") + (striking ? "/strike" : "")
    + (flying ? "/flight" : "") + (shaded ? "/hq" : "") + (spentQuills ? "/spent" : "");
  const existing = enemyArt.get(key);
  if (existing) return existing;
  const raw = paintSprite((r, p) => {
    if (type === "chief") {
      paintChief(r, p, frame, facing, activePose, chiefPose);
    } else if (type === "weir-frog") {
      paintWeirFrog(r, p, frame, facing);
    } else if (type === "weir-turtle") {
      paintWeirTurtle(r, p, frame, facing, activePose, enraged, striking);
    } else if (type === "lily-skater") {
      paintLilySkater(r, p, frame, facing, activePose);
    } else if (type === "magnet-beetle") {
      paintMagnetBeetle(r, p, frame, facing, activePose, flying);
    } else if (type === "cable-overseer") {
      paintCableOverseer(r, p, frame, facing, activePose);
    } else if (type === "slag-colossus") {
      paintSlagColossus(r, p, frame, facing, activePose, enraged);
    } else if (type === "pine-boar") {
      paintPineBoar(r, p, frame, facing, activePose, enraged);
    } else if (type === "lotus-toad") {
      paintLotusToad(r, p, frame, facing, activePose);
    } else if (type === "slag-driller") {
      paintSlagDriller(r, p, frame, facing, activePose);
    } else if (type === "frost-mammoth") {
      paintFrostMammoth(r, p, frame, facing, activePose, mammothPose);
    } else if (type === "frost-bear") {
      paintFrostBear(p, frame, facing, activePose);
    } else if (type === "frost-porcupine") {
      paintFrostPorcupine(p, frame, facing, activePose, spentQuills);
    } else if (type === "frost-yeti") {
      paintFrostYeti(p, frame, facing, activePose, enraged);
    } else if (type === "ice-sail") {
      paintIceSail(p, frame, facing, activePose);
    } else if (type === "mire-treant") {
      paintMireTreant(p, frame, facing, activePose);
    } else if (type === "mire-croc") {
      paintMireCroc(p, frame, facing, activePose);
    } else if (type === "vine-viper") {
      paintVineViper(p, frame, facing, spentQuills);
    } else if (type === "mire-mycelid") {
      paintMireMycelid(p, frame, facing);
    } else if (type === "bloat-sporer") {
      paintBloatSporer(p, frame, facing, activePose);
    } else if (type === "rime-golem") {
      paintRimeGolem(r, p, frame, facing, activePose);
    } else if (type === "blizzard-elk") {
      paintBlizzardElk(r, p, frame, facing, activePose);
    } else if (type === "frost-moose") {
      paintFrostMoose(r, p, frame, facing, moosePose);
    } else if (type === "mirror-ibex") {
      paintMirrorIbex(r, p, frame, facing, activePose);
    } else if (type === "snowbrush-fox") {
      paintSnowbrushFox(r, p, frame, facing, activePose);
    } else if (type === "reed-newt") {
      paintReedNewt(r, p, frame, facing);
    } else if (type === "ore-crawler") {
      paintOreCrawler(r, p, frame, facing);
    } else if (type === "moth" || type === "wisp" || type === "ram" || type === "cinder-bat") {
      paintNewEnemy(type, r, p, frame, facing, activePose, striking);
    } else if (side) {
      enemyPainters[type](r, p, frame);
    } else {
      drawAxialEnemy(type, r, p, frame, facing === "north");
    }
    if (type === "guard" && activePose) {
      const x = side ? -3 : 0, lift = frame % 2;
      p("#2c352c", [x - 10,-24],[x + 9,-24],[x + 10,-17],[x + 4,-10],[x - 6,-11],[x - 11,-17]);
      p("#8b9b83", [x - 14,-22],[x - 10,-27-lift],[x - 5,-25-lift],[x - 6,-17],[x - 12,-16]);
      p("#a4ad94", [x + 5,-26-lift],[x + 11,-27-lift],[x + 15,-21],[x + 12,-16],[x + 6,-18]);
      p("#df9861", [x - 5,-18],[x,-23],[x + 5,-18],[x,-12]);
      p("#ffde91", [x - 3,-18],[x,-21],[x + 3,-18],[x,-14]);
      r(x - 1, -19, 2, 1, "#fff2bd");
    }
  }, 2);
  const image = shaded ? shadeSprite(raw) : raw;
  enemyArt.set(key, image);
  return image;
}
function activeEnemyPose(enemy: Enemy, frame: number) {
  const action = enemy.action;
  switch (enemy.type) {
    case "ram":
      return Boolean(activeEnrage(enemy));
    case "reed-crab":
      return action !== undefined;
    case "frost-owl":
      return action?.phase === "active" ? frame !== 1 : (action?.progress ?? 0) > 0.48;
    case "ferry-snail":
    case "rime-golem":
      return Boolean(enemy.shellBroken);
    case "mirror-ibex":
      return action?.phase !== "exposed" && !sunExposure(enemy);
    case "snowbrush-fox":
      return action !== undefined;
    case "lamp-mole":
      return action?.phase === "windup" && Math.floor(action.progress * 7) % 2 === 0;
    case "slag-cart":
      return action !== undefined || frame % 2 === 1;
    case "ice-sail":
    case "lily-skater":
      return enemy.age < (enemy.turnBurstUntil ?? 0) || (enemy.turnAt !== undefined && enemy.age - enemy.turnAt < 0.28);
    case "magnet-beetle":
    case "cable-overseer":
    case "slag-colossus":
    case "pine-boar":
    case "lotus-toad":
    case "slag-driller":
    case "frost-bear":
    case "frost-yeti":
    case "blizzard-elk":
    case "mire-treant":
    case "mire-croc":
    case "bloat-sporer":
      return action !== undefined;
    case "chief":
    case "guard":
    case "weir-turtle":
    case "frost-mammoth":
      return action?.phase === "exposed";
    default:
      return false;
  }
}

function drawBadgerSoil(
  ctx: CanvasRenderingContext2D, x: number, y: number, facing: Facing,
  depth: number, progress: number, reducedMotion: boolean, swampMud = false,
) {
  const dx = facing === "east" ? 1 : facing === "west" ? -1 : 0;
  const dy = facing === "south" ? 1 : facing === "north" ? -1 : 0;
  if (depth > 0) {
    const bob = reducedMotion ? 0 : Math.round(Math.sin(progress * 36));
    box(ctx, x - 8, y + 1, 16, 3, swampMud ? "#243429" : "#423127");
    box(ctx, x - 7, y - 1, 14, 3, swampMud ? "#3f583d" : "#785136");
    box(ctx, x - 5 + dx * bob, y - 4 + dy * bob, 10, 4, swampMud ? "#5f824e" : "#ae754b");
    box(ctx, x - 3 + dx * bob, y - 4 + dy * bob, 6, 1.5, swampMud ? "#9fc26e" : "#e2b276");
    if (swampMud) {
      for (const eyeX of [-2, 1.5]) {
        box(ctx, x + eyeX + dx * 2, y - 5 + dy * 0.5, 1.5, 1.5, "#1e2923");
        box(ctx, x + eyeX + 0.3 + dx * 2, y - 4.7 + dy * 0.5, 0.9, 0.9, "#f2cc5c");
      }
    }
    for (let i = 1; i <= 3; i++) {
      const trail = i * 3;
      box(ctx, x - dx * trail - dy * (i % 2) - 1, y - dy * trail * 0.65 + dx * (i % 2) + 3,
        3, 1.5, swampMud ? (i === 1 ? "#678c52" : "#405c43") : (i === 1 ? "#aa794d" : "#896448"));
    }
  } else {
    box(ctx, x - 7, y + 1, 14, 3, swampMud ? "#27392c" : "#493227");
    box(ctx, x - 5, y + 1.5, 10, 1, swampMud ? "#6a8e54" : "#c18951");
  }
  const sweep = reducedMotion ? 0.45 : (progress * 6) % 1;
  for (let i = 0; i < 5; i++) {
    const t = (sweep + i / 5) % 1;
    const side = i % 2 ? 1 : -1;
    box(ctx, x + side * (5 + 6 * t), y + 1 - Math.sin(t * Math.PI) * (4 + i),
      2, 1.5, swampMud ? (i % 2 ? "#8eb864" : "#4b6944") : (i % 2 ? "#e5b77c" : "#ac7650"));
  }
}

function warningDashArc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number,
  from: number, to: number, color: string, weight = 1.2, segments = 16) {
  const step = (to - from) / segments;
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  for (let i = 0; i < segments; i += 2) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, from + i * step, from + (i + 0.72) * step);
    ctx.stroke();
  }
}

function warningCracks(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number,
  color: string, progress: number, seed = 0, count = 7) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  for (let i = 0; i < count; i++) {
    const base = seed + i * (Math.PI * 2 / count);
    let x = cx, y = cy;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const reach = radius * (.35 + .65 * progress) * (.72 + (i % 3) * .14);
    for (let step = 1; step <= 3; step++) {
      const a = base + Math.sin(i * 2.7 + step * 1.4) * .28;
      x += Math.cos(a) * reach / 3;
      y += Math.sin(a) * reach * .42 / 3;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (i % 2 === 0) box(ctx, x - 1, y - .5, 1.8, 1, color);
  }
}

export function drawEnemyWarningGround(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  if (enemy.hp <= 0 || enemy.escaped) return;
  const spec = ENEMIES[enemy.type];
  const ability = spec.ability;
  const seed = enemy.x * .07 + enemy.y * .03;
  const px = enemy.x * CELL + 8, py = enemy.y * CELL + 8;

  if (enemy.type === "bloat-sporer" && spec.gasBurst && (enemy.burnLife ?? 0) > 0) {
    // True ground-plane danger zone beneath the burning floating spore sac.
    const reach = spec.gasBurst.radius * CELL;
    const pulse = .55 + .45 * Math.sin(time * 11 + seed);
    ctx.save();
    ctx.globalAlpha = .16 + pulse * .08;
    ctx.fillStyle = "#8bc942";
    ctx.beginPath();
    ctx.ellipse(px, py + 2, reach, reach * .56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = .46 + pulse * .3;
    for (let i = 0; i < 28; i++) {
      if (i % 4 === 3) continue;
      const a = i * (Math.PI * 2 / 28);
      box(ctx, px + Math.cos(a) * reach, py + 2 + Math.sin(a) * reach * .56,
        1.8, 1.4, i % 8 < 2 ? "#ffd27a" : "#c9f070");
    }
    ctx.restore();
    return;
  }
  if (enemy.type === "blizzard-elk" && ability?.kind === "ward" && enemy.action?.phase === "windup") {
    const radius = ability.radius * CELL;
    ctx.save();
    ctx.globalAlpha = .22;
    pixelEllipse(ctx, px, py + 2, radius * .72, 3.6, "#d8f4ff");
    ctx.restore();
    return;
  }
  if (ability?.kind === "vent" && enemy.action?.phase === "windup") {
    const radius = ability.radius * CELL;
    const progress = enemy.action.progress;
    const driller = enemy.type === "slag-driller";
    ctx.save();
    ctx.globalAlpha = .14 + progress * .14;
    ctx.fillStyle = driller ? "#e86e2c" : "#d98842";
    ctx.beginPath();
    ctx.ellipse(px, py + 2, radius * (.55 + progress * .42), radius * (.32 + progress * .25), 0, 0, Math.PI * 2);
    ctx.fill();
    warningCracks(ctx, px, py + 2, radius, driller ? "#ff9e52" : "#ffc47d", progress, .7, driller ? 9 : 6);
    ctx.restore();
    return;
  }
  if (ability?.kind === "freeze-towers" && enemy.action?.phase === "windup") {
    const radius = ability.radius * CELL;
    const progress = enemy.action.progress;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#62c4e81c";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#3c84a8aa";
    ctx.stroke();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = "#d9fbffcc";
    ctx.stroke();
    // Sacred expanding winter frost-rune wave on the ground beneath units & towers.
    pixelRing(ctx, px, py, radius * (0.22 + progress * 0.74), 24, "#b8f6ff", 1.25);
    pixelRing(ctx, px, py, radius * (0.14 + progress * 0.56), 16, "#fff0b2", 1.0);
    ctx.restore();
    return;
  }
  const attack = enemy.melee;
  if (attack?.style === "surge" && !attack.hit && time < attack.impact) {
    const radius = WEIR_SURGE_RADIUS * CELL;
    const progress = (time - attack.start) / (attack.impact - attack.start);
    ctx.save();
    ctx.globalAlpha = .18 + progress * .18;
    ctx.fillStyle = "#4c9698";
    ctx.beginPath();
    ctx.ellipse(px, py + 2, radius * (.45 + progress * .52), radius * (.27 + progress * .31), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = .5 + progress * .35;
    for (let i = 0; i < 18; i++) {
      if (i % 3 === 2) continue;
      const a = i * (Math.PI * 2 / 18) + progress * .4;
      const d = radius * (.42 + progress * .56);
      box(ctx, px + Math.cos(a) * d, py + 2 + Math.sin(a) * d * .58, 2.2, 1.1, i % 2 ? "#d6f5df" : "#7ec4bc");
    }
    ctx.restore();
    return;
  }
  if (attack?.style === "quake" && !attack.hit && time < attack.impact) {
    const radius = MAMMOTH_QUAKE_RADIUS * CELL;
    const progress = (time - attack.start) / (attack.impact - attack.start);
    ctx.save();
    ctx.globalAlpha = .14 + progress * .14;
    ctx.fillStyle = "#4f8aa8";
    ctx.beginPath();
    ctx.ellipse(px, py + 2, radius * (.5 + progress * .48), radius * (.28 + progress * .28), 0, 0, Math.PI * 2);
    ctx.fill();
    warningCracks(ctx, px, py + 2, radius, "#b8f1ff", progress, 1.1, 8);
    for (const side of [-1, 1]) {
      ctx.globalAlpha = .32 + progress * .28;
      ctx.fillStyle = "#33515f";
      ctx.beginPath();
      ctx.ellipse(px + side * 6.5, py + 2, 3.6 + progress * 2.2, 1.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 9; i++) {
      const a = i * (Math.PI * 2 / 9) + .3;
      const d = radius * (.28 + progress * .62) * (.84 + (i % 3) * .08);
      ctx.globalAlpha = .38 + progress * .35;
      box(ctx, px + Math.cos(a) * d, py + 2 + Math.sin(a) * d * .55, 1.6, 1, "#7ecbe6");
    }
    ctx.restore();
    return;
  }
  if (!attack?.aim || attack.hit || time >= attack.impact) return;
  const [x, y] = attack.aim;
  const ax = x * CELL + 8, ay = y * CELL + 8;
  const ice = attack.style === "antler-sweep";
  const radius = (ice ? ANTLER_SWEEP_RADIUS : CHIEF_CLEAVE_RADIUS) * CELL;
  const progress = (time - attack.start) / (attack.impact - attack.start);
  const [dx, dy] = attack.direction ?? [1, 0];
  const angle = Math.atan2(dy, dx);
  ctx.save();
  if (ice) {
    ctx.globalAlpha = .22 + progress * .1;
    ctx.fillStyle = "#4880a1";
    ctx.beginPath();
    ctx.ellipse(ax, ay + 2, radius, radius * .5, angle, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Moss-stone & jade-amber impact crater under the Chief's falling crystal hammer.
    ctx.globalAlpha = .24 + progress * .12;
    ctx.fillStyle = "#2d4c3e";
    ctx.beginPath();
    ctx.ellipse(ax, ay + 2, radius * .96, radius * .54, angle, 0, Math.PI * 2);
    ctx.fill();
    warningCracks(ctx, ax, ay + 2, radius * .95, "#ffd18f", progress, 2.2, 7);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + .4;
      const d = radius * (.35 + progress * .55);
      box(ctx, ax + Math.cos(a) * d, ay + 2 + Math.sin(a) * d * .55, 1.8, 1.1, i % 2 ? "#72945b" : "#9c875a");
    }
  }
  ctx.restore();
}

export function drawEnemyWarning(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  if (enemy.hp <= 0 || enemy.escaped) return;
  const ability = ENEMIES[enemy.type].ability;
  const seed = enemy.x * .07 + enemy.y * .03;
  if (enemy.type === "blizzard-elk" && ability?.kind === "ward" && enemy.action?.phase === "windup") {
    const x = enemy.x * CELL + 8, y = enemy.y * CELL + 8;
    const radius = ability.radius * CELL;
    const progress = enemy.action.progress;
    ctx.save();
    // Aurora ribbons curl up from the antlers above the unit.
    for (let i = 0; i < 3; i++) {
      const baseY = y - 15 - i * 3;
      ctx.globalAlpha = .4 + progress * .35;
      ctx.strokeStyle = i % 2 ? "#b8f7ff" : "#fff0b2";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x - 9, baseY);
      ctx.quadraticCurveTo(x - 2, baseY - 7 - i * 2, x + 3, baseY - 1);
      ctx.quadraticCurveTo(x + 7, baseY - 5, x + 10, baseY - 2);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const a = -2.5 + i * .72;
      const dist = radius * (.42 + progress * .48) * (.86 + (i % 3) * .08);
      ctx.globalAlpha = .35 + .45 * Math.sin(Math.PI * progress);
      diamond(ctx, x + Math.cos(a) * dist, y + Math.sin(a) * dist * .45 - 2,
        i % 2 === 0 ? 1.3 : .9, i % 2 ? "#d9faff" : "#fff4bd");
    }
    ctx.globalAlpha = .6 + progress * .3;
    diamond(ctx, x, y - 20, 1.6 + progress, "#fff4bd");
    ctx.restore();
    return;
  }
  if ((ability?.kind === "vent" || ability?.kind === "quills") && enemy.action?.phase === "windup") {
    const vent = ability.kind === "vent";
    const venom = enemy.type === "vine-viper";
    const driller = enemy.type === "slag-driller";
    const x = enemy.x * CELL + 8, y = enemy.y * CELL + 8;
    const radius = ability.radius * CELL;
    const progress = enemy.action.progress;
    ctx.save();
    if (vent) {
      // Escaping furnace steam from boiler stacks; driller vents taller dual jets than slag-cart.
      const jetSpread = driller ? radius * .44 : radius * .36;
      const jetBase = driller ? y - 11 : y - 5;
      for (const side of [-1, 1]) {
        const lift = progress * (driller ? 13 : 8);
        ctx.globalAlpha = .4 + progress * .38;
        pixelEllipse(ctx, x + side * jetSpread, jetBase - lift, (driller ? 3 : 2.2) + progress * 1.8, 1.5 + progress, "#ffd9a1");
        box(ctx, x + side * (jetSpread * 1.1), jetBase + 3 - lift * .5, driller ? 1.6 : 1.1, driller ? 3.4 : 2.2, "#ff8b42");
      }
      ctx.globalAlpha = .6 + progress * .35;
      diamond(ctx, x, driller ? y - 15 : y - 9, (driller ? 2.2 : 1.7) + progress * 1.4, "#ffe6a6");
    } else if (venom) {
      // Spitting cobra: swelling fluorescent throat sac + directional venom fang-arc toward target facing.
      const face = enemy.quillFacing ?? enemy.facing;
      const bearing = face === "west" ? Math.PI : face === "south" ? Math.PI / 2 : face === "north" ? -Math.PI / 2 : 0;
      const mx = x + (face === "east" ? 9 : face === "west" ? -9 : 1);
      const my = y + (face === "north" ? -10 : face === "south" ? -1 : -5);
      ctx.strokeStyle = "#b8ec68";
      ctx.lineWidth = 1.1;
      for (let i = -2; i <= 2; i++) {
        const a = bearing + i * .22;
        const reach = 5 + progress * 10;
        ctx.globalAlpha = .42 + progress * .4;
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(a) * 2, my + Math.sin(a) * 2);
        ctx.lineTo(mx + Math.cos(a) * reach, my + Math.sin(a) * reach);
        ctx.stroke();
        diamond(ctx, mx + Math.cos(a) * reach, my + Math.sin(a) * reach, i === 0 ? 1.3 : .85, i % 2 ? "#d8ff8a" : "#9be05a");
      }
      ctx.globalAlpha = .65 + progress * .3;
      diamond(ctx, mx, my, 1.5 + progress * 1.2, "#d8ff8a");
    } else {
      // Frost porcupine: bristling glacial-blue dorsal quill fan around its arched spine.
      ctx.strokeStyle = "#d4f2ff";
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 12; i++) {
        const a = i * (Math.PI * 2 / 12) + seed + .2;
        const inner = radius * .24;
        const outer = radius * (.44 + progress * .44) * (.9 + (i % 3) * .06);
        const bx = x + Math.cos(a) * inner, by = y - 6 + Math.sin(a) * inner * .58;
        const tx = x + Math.cos(a) * outer, ty = y - 6 + Math.sin(a) * outer * .58;
        ctx.globalAlpha = .45 + progress * .4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        diamond(ctx, tx, ty, i % 3 === 0 ? 1.25 : .8, i % 2 ? "#f6fbff" : "#9cdcf5");
      }
      ctx.globalAlpha = .6 + progress * .3;
      diamond(ctx, x, y - 11, 1.6 + progress, "#dff8ff");
    }
    ctx.restore();
    return;
  }
  if (ability?.kind === "freeze-towers" && enemy.action?.phase === "windup") {
    const px = enemy.x * CELL + 8, py = enemy.y * CELL + 8;
    const radius = ability.radius * CELL;
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const a = time * 0.9 + (i * Math.PI) / 3;
      const rx = px + Math.cos(a) * radius;
      const ry = py + Math.sin(a) * radius;
      diamond(ctx, rx, ry, i % 2 === 0 ? 1.8 : 1.3, i % 2 === 0 ? "#fff4bd" : "#d8fbff");
    }
    ctx.restore();
    return;
  }
  const attack = enemy.melee;
  if (attack?.style === "quake" && !attack.hit && time < attack.impact) {
    const px = enemy.x * CELL + 8, py = enemy.y * CELL + 8;
    const progress = (time - attack.start) / (attack.impact - attack.start);
    ctx.save();
    for (const side of [-1, 1]) {
      ctx.globalAlpha = .45 + progress * .35;
      box(ctx, px + side * (7 + progress * 3), py - 2 - progress * 2, 1.6, 3.2, "#dff8ff");
    }
    ctx.globalAlpha = .6 + progress * .35;
    diamond(ctx, px, py - 19, 1.8 + progress * 1.1, "#eafcff");
    ctx.restore();
    return;
  }
  if (!attack?.aim || attack.hit || time >= attack.impact) return;
  const [x, y] = attack.aim;
  const px = x * CELL + 8, py = y * CELL + 8;
  const ice = attack.style === "antler-sweep";
  const radius = (ice ? ANTLER_SWEEP_RADIUS : CHIEF_CLEAVE_RADIUS) * CELL;
  const progress = (time - attack.start) / (attack.impact - attack.start);
  const [dx, dy] = attack.direction ?? [1, 0];
  const angle = Math.atan2(dy, dx);
  ctx.save();
  if (ice) {
    // Antler sweep: overhead glacial-and-gold crescent arcs sweeping across the target.
    warningDashArc(ctx, px, py - 2, radius * (.58 + progress * .35), angle - 1.18, angle + 1.18, "#b8f1ff", 1.6, 12);
    warningDashArc(ctx, px, py - 2, radius * (.38 + progress * .28), angle - .95, angle + .95, "#fff0b2", 1, 9);
    for (let i = 0; i < 6; i++) {
      const a = angle - 1.05 + i * .42;
      const d = radius * (.45 + progress * .5);
      diamond(ctx, px + Math.cos(a) * d, py - 2 + Math.sin(a) * d * .55 - progress * 2,
        i % 2 ? 1 : 1.5, i % 2 ? "#d9fbff" : "#fff4bd");
    }
  } else {
    // Crystal hammer: falling jade-and-amber strike column descending from the Chief's raised hammer.
    for (const offset of [-4, 0, 4]) {
      const fall = 1 - progress;
      ctx.globalAlpha = .38 + progress * .42;
      box(ctx, px + offset, py - 18 - fall * 12, 1.8, 9, offset === 0 ? "#ffce78" : "#6cc79d");
      diamond(ctx, px + offset, py - 7 - fall * 12, 1.3, "#fff1ac");
    }
  }
  ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number, reducedMotion: boolean,
  impact?: { readonly heavy: boolean }) {
  const carrier = enemy.carriedBy;
  const x = (carrier?.x ?? enemy.x) * CELL + 8,
    y = (carrier?.y ?? enemy.y) * CELL + 9;
  const { boss, miniboss, ability } = ENEMIES[enemy.type];
  const airborne = isAirborne(enemy);
  const lifting = airborne && ability?.kind === "wing-cycle";
  const action = enemy.action;
  const burrowing = isBurrowing(enemy);
  const digging = ability?.kind === "burrow" && action?.phase === "windup";
  const burrowProgress = action?.progress ?? 0;
  const depth = burrowing ? Math.min(1, burrowProgress / 0.2, (1 - burrowProgress) / 0.24) : 0;
  const attack = enemy.melee && time < enemy.melee.end ? enemy.melee : undefined;
  const preparing = attack !== undefined && time < attack.impact;
  const attackProgress = !attack ? 0 : preparing
    ? (time - attack.start) / (attack.impact - attack.start)
    : Math.min(1, (time - attack.impact) / (attack.end - attack.impact));
  const raised = attack?.style === "stomp" || attack?.style === "surge";
  const pouncing = attack?.style === "pounce";
  const airStrike = airborne && attack?.style === "air-strike";
  const launch = pouncing && preparing ? Math.max(0, (attackProgress - 0.68) / 0.32) : 0;
  const striking = Boolean(attack && !preparing && attackProgress < 0.55);
  const enraged = (enemy.type === "weir-turtle" || enemy.type === "pine-boar" || enemy.type === "slag-colossus" || enemy.type === "frost-yeti") && Boolean(activeEnrage(enemy));
  const hopping = ability?.kind === "hop";
  const sliding = ability?.kind === "glide";
  const venom = enemy.type === "vine-viper";
  const crawler = venom;
  const fightingFrame = striking || launch > 0 ? 2 : preparing ? 1 : 3;
  const regional = Object.hasOwn(REGIONAL_ENEMIES, enemy.type);
  const regionalAction = regional && (action !== undefined || (attack !== undefined && ability?.kind !== "quills"));
  const skillPose = enemy.type === "blizzard-elk" || enemy.type === "slag-colossus" || enemy.type === "frost-bear" || enemy.type === "frost-yeti"
    || enemy.type === "mire-treant" || enemy.type === "mire-croc" || enemy.type === "bloat-sporer";
  let frame = airStrike ? fightingFrame : lifting ? (reducedMotion ? 0 : Math.floor(enemy.age * 14) % 4)
    : skillPose && action ? (action.phase === "windup" ? 1 : 2)
    : attack ? fightingFrame : (hopping && !skillPose)
    ? (action?.phase === "windup" ? 1 : action?.phase === "active" ? 2 : 0)
    : Math.floor(enemy.walk) % 4;
  const chiefAttack = attack?.style === "cleave" ? attack : undefined;
  const chiefPose: ChiefPose = !chiefAttack ? "march" : preparing ? "raise" : striking ? "strike" : "recover";
  if (chiefAttack && preparing) frame = Math.min(3, Math.floor(attackProgress * 4));
  const quakeAttack = attack?.style === "quake" ? attack : undefined;
  const mammothPose: MammothPose = !quakeAttack ? "march" : preparing ? "rear" : striking ? "slam" : "recover";
  if (quakeAttack && preparing) frame = Math.min(3, Math.floor(attackProgress * 4));
  const antlerAttack = attack?.style === "antler-sweep" ? attack : undefined;
  const moosePose: MoosePose = antlerAttack ? (preparing ? "brace" : striking ? "sweep" : "recover")
    : ability?.kind === "freeze-towers" && action ? (action.phase === "windup" ? "cast" : "release") : "walk";
  if (enemy.type === "frost-moose" && moosePose !== "walk") {
    const progress = antlerAttack
      ? (preparing ? attackProgress : striking ? Math.min(1, attackProgress / 0.55) : Math.min(1, (attackProgress - 0.55) / 0.45))
      : (action?.progress ?? 0);
    frame = Math.min(3, Math.floor(Math.max(0, progress) * 4));
  }
  if ((regionalAction || enemy.type === "snowbrush-fox" || enemy.type === "frost-hare") && !airStrike) {
    if (attack) frame = preparing ? Number(attackProgress > 0.55) : fightingFrame;
    else if (action?.phase === "windup") frame = Number(action.progress > 0.55);
    else if (action?.phase === "exposed") frame = 3;
    else if (action && ability?.kind === "burrow") frame = action.progress < 0.8 ? 1 : 2;
    else if (action) frame = action.progress < (ability?.kind === "quills" ? 0.45 : 0.58) ? 2 : 3;
  }
  if (crawler) {
    const phaseFrames = CRAWL_ATTACK_PHASE_FRAMES;
    const keyframe = (progress: number) => Math.min(phaseFrames - 1, Math.floor(Math.max(0, progress) * phaseFrames));
    if (venom && action) {
      frame = CRAWL_FRAMES + (action.phase === "windup" ? 0 : phaseFrames) + keyframe(action.progress);
    } else if (attack) {
      frame = CRAWL_FRAMES + (venom ? phaseFrames * 2 : 0) + (preparing ? 0 : phaseFrames) + keyframe(attackProgress);
    } else {
      frame = (reducedMotion ? Math.floor(enemy.walk) * 2 : Math.floor(enemy.walk * 2)) % CRAWL_FRAMES;
    }
  }
  const mire = isMireEnemy(enemy.type) ? mireEnemyPose(enemy, reducedMotion, time) : undefined;
  const scale = (isMireEnemy(enemy.type) ? MIRE_SCALES[enemy.type] : regionalArtScale[enemy.type]) ?? (enemy.type === "chief" ? CHIEF_ART_SCALE : boss || miniboss ? 0.9
    : enemy.type === "ram" || enemy.type === "stump-spirit" ? 0.8
    : enemy.type === "pine-hopper" ? 0.68 : 0.74);
  const activePose = regionalAction || activeEnemyPose(enemy, frame)
    || (enemy.type === "reed-crab" && attack?.style === "claw")
    || ((enemy.type === "frost-hare" || enemy.type === "frost-ray") && attack !== undefined);
  const ramCharge = enemy.type === "ram" && activePose;
  const rushing = ramCharge ||
    (ability?.kind === "dash" && action?.phase === "active");
  const leap = carrier ? 2.5 : mire?.leap ?? (
    lifting && action ? (8 + frame % 2) * Math.min(1, action.progress * 8, (1 - action.progress) * 8)
      : airborne ? 7 + (reducedMotion ? 0 : frame % 2)
      : attack ? (pouncing ? (preparing ? 4 * Math.sin(launch * Math.PI / 2) : 4 * (1 - attackProgress) ** 2)
      : raised && preparing ? 4 * attackProgress : 0) : hopping
      ? (action?.phase === "active" ? Math.sin(action.progress * Math.PI) * (skillPose ? 5.6 : 4.7) : 0)
      : enemy.type === "slime"
      ? [0, 1, 2, 1][frame]
      : boss ? [0.5, 1, 1.5, 1][frame] : 0);
  if (carrier) {
    box(ctx, x - 2.5, y - 15, 1, 7.5, "#d1be81");
    box(ctx, x + 1.5, y - 15, 1, 7.5, "#ede0a9");
  }
  const wide = scale * (
    boss || miniboss
      ? 13
      : enemy.type === "guard" || enemy.type === "ram" || enemy.type === "stump-spirit" || enemy.type === "frost-bear" || enemy.type === "mire-mycelid"
        ? 11
        : 8);
  const rich = highQuality() && !reducedMotion;
  const slowed = enemy.slows.size > 0;
  if (airborne) {
    const shadowHeight = reducedMotion ? 7 : leap;
    const radius = wide * (1 - shadowHeight * .035);
    ctx.fillStyle = "#202f28";
    ctx.globalAlpha = .38 - shadowHeight * .017;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, radius, 1.7 - shadowHeight * .066, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (rich) {
    const liftScale = 1 / (1 + leap * .06);
    ctx.save();
    ctx.globalAlpha = .24 * liftScale;
    pixelEllipse(ctx, x, y + 2, wide * liftScale, 2.2 * liftScale, "#142019");
    ctx.globalAlpha = .18 * liftScale;
    pixelEllipse(ctx, x, y + 2, wide * .68 * liftScale, 1.4 * liftScale, "#142019");
    ctx.restore();
  } else {
    box(ctx, x - wide, y + 1, wide * 2, 3, "#202f2866");
    box(ctx, x - wide + 3, y + 3, wide * 2 - 6, 1, "#23322840");
  }
  if (preparing && attack?.style === "surge") {
    // Two advancing tidal crescents with foam, not concentric halos.
    const radius = WEIR_SURGE_RADIUS * CELL * (0.5 + attackProgress * 0.5);
    ctx.globalAlpha = 0.4 + 0.4 * attackProgress;
    warningDashArc(ctx, x, y - 1, radius, -Math.PI * .82, -Math.PI * .18, "#f0c985", 1.5, 7);
    warningDashArc(ctx, x, y - 1, radius, Math.PI * .18, Math.PI * .82, "#b7e0cc", 1.3, 7);
    for (let i = 0; i < 6; i++) {
      const a = i < 3 ? -Math.PI * .72 + i * .42 : Math.PI * .28 + (i - 3) * .42;
      box(ctx, x + Math.cos(a) * radius, y - 1 + Math.sin(a) * radius * .55,
        1.4, .9, i % 2 ? "#e0f1ca" : "#f0c985");
    }
    ctx.globalAlpha = 1;
  }
  const stride = enemy.walk % 1;
  if (!reducedMotion && !airborne && !burrowing && !attack && enemy.walk > 0 && !hopping &&
      (sliding || rushing || enraged)) {
    const dx = enemy.facing === "east" ? -1 : enemy.facing === "west" ? 1 : 0;
    const dy = enemy.facing === "south" ? -1 : enemy.facing === "north" ? 1 : 0;
    ctx.globalAlpha = sliding || rushing || enraged ? 0.42 : 0.46 * (1 - stride / 0.38);
    if (ramCharge) {
      for (let i = 0; i < 4; i++) {
        const age = (stride + i * 0.25) % 1;
        const trail = wide + 1 + age * 13;
        const spread = (i % 2 ? -1 : 1) * (2 + age * 5);
        ctx.globalAlpha = 0.86 * (1 - age);
        box(ctx, x + dx * trail - dy * spread - 1, y + dy * trail * 0.65 + dx * spread + 2,
          age < 0.45 ? 3 : 2, age < 0.35 ? 2 : 1, i % 2 ? "#d8eff0" : "#f3fbf2");
      }
    } else if (sliding || rushing || enraged) {
      const color = enemy.type === "slag-colossus" ? "#ffb167"
        : enemy.type === "frost-bear" || enemy.type === "frost-yeti" ? "#d6f4ff"
        : enraged ? "#b3d9b9" : enemy.type === "lily-skater" ? "#aee3bd" : sliding ? "#c1e4ea" : "#d8a982";
      box(ctx, x + dx * (wide + 2) - 2, y + dy * 5 + 3, 3, 1, color);
      box(ctx, x + dx * (wide + 5) + 1, y + dy * 8 + 1, 2, 1, color);
    } else {
      box(ctx, x + dx * (wide - 2) - 1, y + dy * 3 + 2, 1, 1, "#e0b77d");
      box(ctx, x + dx * (wide + 1) + 1, y + dy * 5 + 1, 0.5, 1, "#f1cc87");
    }
    ctx.globalAlpha = 1;
  }
  if (slowed) {
    if (rich) {
      drawFrostStatus(ctx, x, y, wide, time, airborne, leap);
    } else {
      pixelRing(ctx, x, y + 1, wide * 0.86, 10, "#96ddec", 0.5);
      box(ctx, x - wide * 0.6, y + 3, wide * 1.2, 1, "#86bbdb95");
    }
  }
  if (enemy.haste && enemy.haste.until > enemy.age) {
    box(ctx, x - wide * 0.7, y + 4, wide * 1.4, 1, "#f2c56a");
    diamond(ctx, x - wide, y - 1, 1, "#ffe2a2");
  }
  if (enemy.slowWard && enemy.slowWard.until > enemy.age) {
    pixelRing(ctx, x, y + 1, wide + 2, 10, "#c2f1ea");
  }
  if (enemy.screen && enemy.screen.until > enemy.age) {
    pixelRing(ctx, x, y + 1, wide + 2, 13, "#a7f7eb");
    diamond(ctx, x + wide, y - 4, 1.5, "#e2fff1");
  }
  if ([...(enemy.salt?.values() ?? [])].some(until => enemy.age < until)) {
    box(ctx, x - wide * .65, y + 3, wide * 1.3, .8, "#fff0c9");
    diamond(ctx, x + wide, y - leap - 6, 1.8, "#f9e5b8");
  }
  const sunlit = sunExposure(enemy);
  if (sunlit) {
    pixelRing(ctx, x, y + 1, wide + 3, 12, "#ffdb90", 1.5);
    diamond(ctx, x + wide, y - leap - 12, 2, "#fff1b2");
  }
  const facing = mire?.facing ?? (venom && action ? enemy.quillFacing : attack?.facing) ?? enemy.facing;
  const image = enemySprite(enemy.type, mire?.frame ?? frame, facing, mire?.skill ?? activePose, enraged, (miniboss || airStrike) && striking,
    lifting, chiefPose, quillsSpent(enemy), mammothPose, moosePose, mire?.options);
  ctx.save();
  if (!reducedMotion && !rich && enemy.flash > 0 && !impact) ctx.filter = "brightness(1.25)";
  if (impact?.heavy) ctx.translate(facing === "west" ? 1 : -1, 0);
  const mirror = facing === "west" && !hasEnemyAtlas(enemy.type);
  const drawPose = (sprite = image) => stamp(ctx, sprite, 0, 0, scale, mirror ? -1 : 1);
  let showPose = true;
  if (crawler) {
    ctx.translate(x, y);
  } else if (burrowing) {
    ctx.beginPath();
    ctx.rect(x - 24, y - 30, 48, 33);
    ctx.clip();
    showPose = depth < 1;
    ctx.translate(x, y + depth * 24);
  } else if (airStrike && attack && !reducedMotion) {
    const [dx, dy] = attack.direction;
    const drive = (1 - attackProgress) ** 2;
    const motion = preparing ? -4 * attackProgress : 5.8 * drive;
    const rise = preparing ? 3.5 * attackProgress : -2.5 * drive;
    ctx.translate(x + dx * motion, y + dy * motion - leap - rise);
    ctx.rotate((dx < 0 ? -1 : 1) * (preparing ? -.16 * attackProgress : .22 * drive));
    ctx.scale(1 + (preparing ? -.12 * attackProgress : .15 * drive), 1);
  } else if (quakeAttack && !reducedMotion) {
    const pulse = preparing ? 0 : (1 - attackProgress) ** 2;
    const squash = preparing ? 0 : 0.11 * pulse;
    ctx.translate(x, y - leap + (preparing ? 0 : 1.5 * pulse));
    ctx.scale(1 + squash, 1 - squash * 0.85);
  } else if (attack && !chiefAttack && !reducedMotion) {
    const [dx, dy] = attack.direction;
    const pulse = (1 - attackProgress) ** 2;
    const movement = preparing ? 6.7 * launch - 2.7 * attackProgress : (raised ? 2.5 : 6.2) * pulse;
    const sweep = attack.style === "claw" || antlerAttack ? (preparing ? -1.8 * attackProgress : 2.6 * pulse) : 0;
    const stretch = preparing ? 0.13 * launch - 0.08 * attackProgress : 0.15 * pulse;
    ctx.translate(x + dx * movement - dy * sweep, y + dy * movement + dx * sweep - leap);
    ctx.scale(1 + stretch, 1 - stretch);
  } else {
    let walkBob = 0, walkSx = 1, walkSy = 1, walkRot = 0;
    if (rich && !airborne && !hopping && enemy.walk > 0) {
      const cycle = enemy.walk * Math.PI * .5;
      const damp = slowed ? .5 : 1;
      const dir = facing === "west" ? -1 : 1;
      if (enemy.type === "slime") {
        const s = Math.cos(cycle * 2) * .085 * damp;
        walkSx = 1 + s;
        walkSy = 1 - s * 1.1;
      } else if (rushing || sliding) {
        walkRot = dir * .065 * damp;
        walkSx = 1 + .06 * damp;
        walkSy = 1 - .05 * damp;
      } else if (boss || miniboss || ENEMIES[enemy.type].armored) {
        const stomp = Math.abs(Math.sin(cycle));
        walkBob = stomp * .65 * damp;
        walkRot = Math.sin(cycle) * .026 * damp;
        walkSx = 1 + (1 - stomp) * .03 * damp;
        walkSy = 1 - (1 - stomp) * .03 * damp;
      } else {
        const stepBounce = Math.abs(Math.sin(cycle * 2));
        walkBob = stepBounce * .85 * damp;
        walkRot = Math.sin(cycle * 2) * .042 * damp;
        walkSx = 1 - stepBounce * .035 * damp;
        walkSy = 1 + stepBounce * .04 * damp;
      }
    }
    ctx.translate(x, y - leap - walkBob);
    if (walkRot) ctx.rotate(walkRot);
    if (walkSx !== 1 || walkSy !== 1) ctx.scale(walkSx, walkSy);
  }
  if (rich && (impact || enemy.flash > .08)) {
    const kick = impact ? (impact.heavy ? .12 : .07) : Math.min(.06, enemy.flash * .35);
    ctx.scale(1 + kick, 1 - kick);
  }
  if (showPose) {
    drawPose();
    if (rich && slowed) {
      ctx.save();
      ctx.globalAlpha = .3 + .08 * Math.sin(time * 5 + x * .05);
      drawPose(tintedSilhouette(image, "#8ae2ff"));
      ctx.restore();
    }
    if (rich && (impact || enemy.flash > 0)) {
      ctx.save();
      ctx.globalAlpha = impact ? (impact.heavy ? .88 : .76) : Math.min(.72, enemy.flash * 4.5);
      drawPose(tintedSilhouette(image, "#fffef2"));
      ctx.restore();
    } else if (impact) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = .4;
      ctx.filter = "brightness(2.6) saturate(0)";
      drawPose();
    }
  }
  ctx.restore();
  if (enemy.spore && enemy.spore.until > enemy.age)
    drawSporeStatus(ctx, x, y, wide, time, airborne, leap, enemy.spore.until - enemy.age);
  if (rich && showPose) drawNewEnemyAura(ctx, enemy, x, y, wide, scale, time, leap, enraged);
  if (airStrike && attack && !reducedMotion) {
    const [dx, dy] = attack.direction;
    const plume = enemy.type === "moth" ? "#d8d0bd"
      : enemy.type === "frost-ray" || enemy.type === "frost-owl" ? "#c5edf5"
      : enemy.type === "cinder-bat" ? "#f2a66f"
      : enemy.type === "bloat-sporer" ? "#c9f070"
      : enemy.type === "wisp" ? "#a8e6ff" : "#d9e9e4";
    ctx.save();
    if (preparing) {
      // Wings gather the air in the dive direction; a small feather leading edge.
      ctx.globalAlpha = .35 + .35 * attackProgress;
      for (let i = 0; i < 4; i++) {
        const d = 6 + i * 3 + (1 - attackProgress) * 5;
        box(ctx, x + dx * d - dy * (i - 1.5) * 1.3, y - leap + dy * d + dx * (i - 1.5) * 1.3,
          2.2, 1, i === 0 ? "#ffffff" : plume);
      }
      diamond(ctx, x + dx * (wide + 3), y - leap + dy * (wide + 3), 1.1, "#ffffff");
    } else {
      // Diving afterimage and speed feathers trailing behind the strike.
      const fade = Math.max(0, 1 - attackProgress);
      ctx.globalAlpha = .55 * fade;
      for (let i = 0; i < 4; i++) {
        const d = 8 + i * 4;
        box(ctx, x - dx * d - dy * (i - 1.5) * 3, y - leap - dy * d + dx * (i - 1.5) * 3,
          3, 1.2, i % 2 ? plume : "#eef9f5");
      }
      if (rich) {
        ctx.globalAlpha = .18 * fade;
        ctx.translate(-dx * 6, -dy * 3);
        drawPose(tintedSilhouette(image, plume));
      }
    }
    ctx.restore();
  }
  if (ability?.kind === "vent" && action?.phase === "windup") {
    diamond(ctx, x, y - 12, action.progress > 0.55 ? 3 : 2, "#ff9759");
    box(ctx, x - 1, y - 14, 2, 2, "#ffecb2");
  }
  if (digging || burrowing) drawBadgerSoil(ctx, x, y, facing, depth, burrowProgress, reducedMotion, enemy.type === "mire-croc");
  if (isStaggered(enemy)) {
    const drift = reducedMotion ? 0 : Math.sin(time * 11) * 4;
    diamond(ctx, x - 7 + drift, y - 22, 1, "#ffe6a5");
    diamond(ctx, x + 6 - drift, y - 20, 1, "#fff2bd");
  }
  const healingDelay = ENEMIES[enemy.type].regeneration?.delay;
  if (healingDelay !== undefined && enemy.hp < enemy.maxHp && enemy.hurtAgo >= healingDelay) {
    const drift = ((enemy.hurtAgo - healingDelay) * 9) % 8;
    diamond(ctx, x - 7, y - 5 - drift, 1, "#b6efd5");
    diamond(ctx, x + 6, y - 6 - ((drift + 4) % 8), 0.8, "#ebffec");
  }
  if (isNetted(enemy)) drawNetMesh(ctx, x, y - 5, wide + 1, 5, "#efd8a1");
  if (enemy.burnLife) {
    box(ctx, x - 2, y - 9 - frame, 1, 2, "#ea9857");
    box(ctx, x + 4, y - 7 - frame, 0.5, 1.5, "#ffe0a1");
  }
  if (slowed && !rich) {
    diamond(ctx, x - wide * 0.65, y - 2, 1, "#bce8fa");
    if (frame % 2) diamond(ctx, x + wide * 0.7, y - 4, 1, "#abf7ec");
  }
  if (enemy.hp < enemy.maxHp || boss || miniboss) {
    const bar = boss ? 19 : miniboss ? 15 : 12;
    const top = y - (venom && action ? 27 : healthBarOffsets[enemy.type] ?? 14) * scale - leap;
    const left = x - bar * 0.5;
    box(ctx, left - 1, top, bar + 2, 2.5, "#302923d8");
    box(
      ctx,
      left,
      top + 0.5,
      Math.max(0.5, (bar * enemy.hp) / enemy.maxHp),
      1,
      boss ? "#e589bf" : miniboss ? "#f5c564" : "#e9bf76",
    );
    if (miniboss) {
      // Crisp 5x4 gold crown badge to the left of the miniboss HP bar
      const cx = left - 6.5, cy = top - 1;
      box(ctx, cx - .5, cy + .5, 5.5, 3.5, "#2b2119");
      box(ctx, cx, cy + 2, 4.5, 1.5, "#f0bd4f");
      box(ctx, cx, cy + 1, 1, 1.5, "#ffe484");
      box(ctx, cx + 1.75, cy + .5, 1, 2, "#fff5bd");
      box(ctx, cx + 3.5, cy + 1, 1, 1.5, "#ffe484");
    }
  }
}
export function drawEnemyDefeat(ctx: CanvasRenderingContext2D, enemy: Enemy, progress: number, reducedMotion: boolean) {
  const x = enemy.x * CELL + 8, y = enemy.y * CELL + 9;
  const { armored, boss, miniboss, color } = ENEMIES[enemy.type];
  const heavy = armored || boss;
  const facing = enemy.facing === "west" && !hasEnemyAtlas(enemy.type) ? -1 : 1;
  const pose = enemySprite(enemy.type, progress < 0.3 ? 1 : 0, enemy.facing,
    Boolean(enemy.shellBroken) || (miniboss === true && enemy.action?.phase === "exposed") ||
      (enemy.type === "magnet-beetle" && !!enemy.action) ||
      (enemy.type === "mirror-ibex" && activeEnemyPose(enemy, 0)),
    miniboss === true && Boolean(enemy.chargeAnnounced), false, false, "march", quillsSpent(enemy), "march", "walk",
    enemy.type === "sluice-dragon" ? mireEnemyPose(enemy, reducedMotion).options : undefined);
  const scale = (isMireEnemy(enemy.type) ? MIRE_SCALES[enemy.type] : regionalArtScale[enemy.type]) ?? (enemy.type === "chief" ? CHIEF_ART_SCALE : boss || miniboss ? 0.9 : heavy ? 0.8 : 0.74);
  if (highQuality() && !reducedMotion) {
    const mechanical = enemy.type === "slag-cart" || enemy.type === "slag-driller" || enemy.type === "slag-colossus" || enemy.type === "cable-overseer" || enemy.type === "magnet-beetle";
    const style: DefeatStyle = enemy.slows.size > 0
      ? "frost-shatter"
      : heavy || miniboss || mechanical
        ? "armor-shatter"
        : "dissolve";
    drawRichDefeat(ctx, pose, x, y, scale, facing, progress, style, color, Boolean(heavy || miniboss));
    return;
  }
  const relax = Math.min(1, progress * 1.5);
  const shake = !reducedMotion && progress < 0.3 ? Math.sin(progress * 42) * (1 - progress * 3) : 0;
  ctx.save();
  ctx.globalAlpha = 1 - progress ** 1.8;
  ctx.translate(x + shake, y);
  if (!reducedMotion) ctx.scale(1 + relax * 0.12, 1 - relax * (heavy ? 0.58 : 0.76));
  stamp(ctx, pose, 0, 0, scale, facing);
  ctx.restore();
}

export function spriteIcon(canvas: HTMLCanvasElement, type: EnemyId) {
  const ctx = canvas2d(canvas);
  ctx.imageSmoothingEnabled = false;
  const { boss, miniboss } = ENEMIES[type];
  const image = enemySprite(type, 0, boss ? "south" : "east", type === "mirror-ibex");
  const artHeight = isMireEnemy(type) ? MIRE_HEIGHTS[type] : regionalIconHeight[type];
  const sx = artHeight ? SIZE : type === "chief" || hasEnemyAtlas(type) ? 56 : miniboss ? 62 : boss ? 51 : type === "cinder-bat" ? 54 : type === "ram" ? 48 : 44;
  const sy = artHeight ?? (boss ? 55 : miniboss ? 49 : hasEnemyAtlas(type) ? 45 : type === "ram" || type === "wisp" || type === "cinder-bat" ? 39 : type === "guard" ? 31 : 28);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min((canvas.width - 2) / sx, (canvas.height - 2) / sy);
  const w = Math.round(sx * scale),
    h = Math.round(sy * scale);
  ctx.drawImage(
    image,
    (artHeight ? 0 : miniboss ? 1 : ORIGIN_X - Math.floor(sx / 2)) * SPRITE_DETAIL,
    (ORIGIN_Y - sy + (artHeight ? 7 : 5)) * SPRITE_DETAIL,
    sx * SPRITE_DETAIL,
    sy * SPRITE_DETAIL,
    Math.round((canvas.width - w) / 2),
    Math.round((canvas.height - h) / 2),
    w,
    h,
  );
}
