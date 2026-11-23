import type { Entry, Level, Point } from "../../engine/types.ts";
import { MIRE_BOARDWALK } from "./mire-boardwalk.ts";
import { MIRE_WAVES } from "./mire-waves.ts";

type Lagoon = readonly Point[];

function insideLagoon(x: number, y: number, bank: Lagoon) {
  let inside = false;
  for (let i = 0, j = bank.length - 1; i < bank.length; j = i++) {
    const [ax, ay] = bank[i], [bx, by] = bank[j];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay))
      inside = !inside;
  }
  return inside;
}

type MireTerrain = Pick<Level, "id" | "name" | "description" | "width" | "height" | "seed" |
  "entries" | "plots" | "bridges" | "scenery" | "devices" | "shallows"> & {
  readonly water: readonly Lagoon[];
  readonly land?: readonly Lagoon[];
};

function mireLevel({ water, land = [], ...layout }: MireTerrain): Level {
  const pools: Point[] = [];
  for (let y = 0; y < layout.height; y++) {
    for (let x = 0; x < layout.width; x++) {
      if (water.some(bank => insideLagoon(x + .5, y + .5, bank)) &&
          !land.some(bank => insideLagoon(x + .5, y + .5, bank))) pools.push([x, y]);
    }
  }
  const waves = MIRE_WAVES[layout.id];
  const preferred = layout.id === "14"
    ? ["arrow", "cannon", "frost", "ember", "reed-post"] as const
    : ["arrow", "storm", "frost", "reed-post", "salt-caster"] as const;
  return {
    ...layout, chapter: 4, biome: "mire", pools, waves,
    weather: { initial: "miasma", changes: [{ wave: waves.length - 1, preset: "toxicStorm" }] },
    gold: 820 + (Number(layout.id) - 14) * 65, health: 18,
    towers: [...new Set([...preferred, ...MIRE_BOARDWALK.towers])],
    guardPost: true, maxTowerTier: 4, maxGuardTier: 4,
    wavePrep: 20, earlyRate: 3, maxEarlyReward: 12,
  };
}

function approach(id: string, label: string, delay: number, route: Entry["route"], scenery: Entry["scenery"] = "trail"): Entry {
  return { id, label, delay, route, marker: route[0], scenery };
}

const reedForkCore: Point = [5, 5];
const peatIslandCore: Point = [20, 8];
const mistRidgeCore: Point = [4, 7];
const reedPensCore: Point = [5, 17];
const mossKeepCore: Point = [7, 12];

export const MIRE_EXPANSION_LEVELS: Readonly<Record<string, Level>> = {
  "14": mireLevel({
    id: "14", name: "芦湾折汊", width: 32, height: 20, seed: 140963,
    description: "从瘴缘渡桥向西南进入湾口，东北旧堤和东南泥滩绕过同一片芦湾，在西北岸汇合。两道倒潮闸共用水仓，放哪一侧要看敌人先到哪段折弯。本关开放苇篷哨舍。",
    entries: [
      approach("north", "东北旧堤", 0, [[31,4],[26,4],[26,7],[20,7],[20,4],[12,4],[12,7],[8,7],[8,5],reedForkCore]),
      approach("south", "东南泥滩", 4, [[31,15],[24,15],[24,12],[18,12],[18,15],[13,15],[13,11],[8,11],[8,5],reedForkCore]),
    ],
    shallows: [[27,4],[28,4],[24,15],[25,15],[26,15],[28,15],[29,15],[19,12],[20,12]],
    water: [
      [[-1,8],[4,8],[7,10],[11,9],[15,8],[19,9],[23,8],[27,9],[30,8],[32,9],[32,13],[28,12],[25,11],[22,12],[18,11],[15,12],[11,13],[8,12],[4,14],[-1,13]],
      [[12,20],[13,17],[18,16],[21,17],[25,16],[27,17],[32,17],[32,20]],
      [[2,0],[4,2],[7,1],[11,1],[14,0]],
    ],
    land: [[[8,11],[12,11],[15,10],[16,12],[14,14],[8,14]]],
    plots: [[29,3],[27,5],[24,6],[22,6],[19,5],[17,3],[15,5],[13,6],[10,6],[6,6],[4,4],
      [29,14],[27,16],[23,14],[25,13],[20,13],[17,14],[15,14],[12,12],[10,12],[7,8]],
    bridges: [
      { from: [8, 7], to: [8, 11], style: "mire-raft" },
    ],
    devices: [
      { kind: "mire-backwash", at: [21,6], from: [21,7], to: [25,7], cooldownGroup: "reed-fork", label: "北堤闸" },
      { kind: "mire-backwash", at: [19,13], from: [19,12], to: [23,12], cooldownGroup: "reed-fork", label: "南滩闸" },
    ],
    scenery: [{ at: [5,3], kind: "cabin" }, { at: [3,10], kind: "skiff" }, { at: [16,9], kind: "reeds" },
      { at: [23,10], kind: "reeds" }, { at: [28,11], kind: "skiff" }],
  }),
  "15": mireLevel({
    id: "15", name: "泥炭孤岛", width: 34, height: 22, seed: 150618,
    description: "沿第 14 关西北岸滑入潭盆，南桩与东埠的两路栈桥分头上岛。菌墩外环给炮塔留了较长的交叉射界，东北岸的高泥脊通向雾脊双岸。本关开放盐釉投罐塔。",
    entries: [
      approach("east", "东埠栈桥", 0, [[33,15],[28,15],[28,10],[22,10],[22,7],[20,7],peatIslandCore], "landing"),
      approach("south", "南桩浮桥", 4, [[9,21],[9,18],[13,18],[13,14],[17,14],[17,11],[15,11],[15,8],peatIslandCore], "landing"),
    ],
    shallows: [[29,15],[30,15],[31,15],[9,19],[9,20],[16,14],[17,14],[17,13]],
    water: [
      [[4,7],[6,4],[11,2],[19,2],[25,4],[27,7],[31,9],[31,12],[28,15],[28,18],[22,21],[17,21],[12,19],[7,16],[5,13]],
      [[0,10],[2,10],[5,11],[9,13],[8,17],[5,18],[1,16],[0,16]],
    ],
    land: [
      [[13,16],[14,12],[15,6],[18,5],[21,4],[23,6],[25,8],[24,13],[21,15],[17,16],[15,17]],
      [[9,22],[10,19],[14,19],[15,21],[14,22]],
      [[28,7],[34,7],[34,22],[29,22],[29,17],[27,15],[28,13]],
      [[25,8],[27,8],[27,10],[25,10]],
      [[23,11],[25,11],[25,13],[23,14]],
    ],
    plots: [[31,14],[29,11],[26,9],[24,9],[23,8],[21,9],[19,7],[18,9],[16,7],[16,10],[18,12],
      [16,13],[17,15],[14,15],[16,15],[11,20],[10,20],[29,16],[24,12],[20,13]],
    bridges: [
      { from: [24, 10], to: [28, 10], style: "mire-raft" },
      { from: [9, 18], to: [13, 18], style: "mire-raft" },
      { from: [13, 14], to: [13, 18] },
      { from: [13, 14], to: [15, 14] },
    ],
    devices: [{ kind: "mire-backwash", at: [13,20], from: [13,14], to: [13,17], label: "南桩闸" },
      { kind: "mire-beacon", at: [21,12], center: [22,10], label: "东埠灯" }],
    scenery: [{ at: [25,3], kind: "cabin" }, { at: [11,9], kind: "skiff" }, { at: [20,6], kind: "ruins" },
      { at: [8,13], kind: "reeds" }, { at: [24,17], kind: "skiff" }, { at: [22,16], kind: "reeds" }],
  }),
  "16": mireLevel({
    id: "16", name: "雾脊双岸", width: 34, height: 21, seed: 160782,
    description: "由泥炭孤岛沿西南低岸登坡。北面的高泥脊长而开阔，南面的芦沟多折，两岸在西侧石口汇合。两座引灯信标共用灯油，能把炮火从一岸调到另一岸。",
    entries: [
      approach("north", "东脊高路", 0, [[33,5],[27,5],[27,3],[20,3],[20,5],[12,5],[12,7],mistRidgeCore]),
      approach("south", "南岸芦沟", 4, [[6,20],[6,16],[11,16],[11,18],[23,18],[23,14],[18,14],[18,11],[10,11],[10,7],mistRidgeCore]),
    ],
    shallows: [[7,16],[8,16],[9,16],[13,18],[14,18],[21,18],[22,18],[25,3],[26,3]],
    water: [
      [[3,9],[7,9],[11,8],[16,8],[19,9],[24,9],[29,7],[34,8],[34,14],[29,13],[27,14],[24,13],[20,14],
        [16,13],[12,13],[8,12],[4,13],[3,12]],
      [[11,20],[21,20],[28,18],[32,17],[34,18],[34,21],[11,21]],
      [[0,14],[4,15],[4,18],[2,20],[0,21]],
    ],
    land: [[[13,12],[15,12],[15,14],[13,14]], [[16,12],[18,12],[18,15],[16,15]]],
    plots: [[30,4],[28,6],[25,4],[23,4],[21,2],[18,4],[15,4],[13,6],[9,6],[7,8],[5,6],
      [7,17],[9,15],[12,17],[15,17],[18,19],[21,17],[24,17],[22,15],[19,15],[17,12],[14,12],[8,8],[11,6]],
    bridges: [
      { from: [10, 8], to: [10, 11], style: "mire-raft" },
      { from: [10, 11], to: [18, 11] },
      { from: [18, 11], to: [18, 14] },
      { from: [18, 14], to: [23, 14], style: "mire-raft" },
    ],
    devices: [
      { kind: "mire-beacon", at: [17,6], center: [16,5], cooldownGroup: "mist-ridge", label: "北脊灯" },
      { kind: "mire-beacon", at: [20,16], center: [22,14], cooldownGroup: "mist-ridge", label: "南岸灯" },
    ],
    scenery: [{ at: [15,2], kind: "ruins" }, { at: [8,3], kind: "cabin" }, { at: [23,7], kind: "reeds" },
      { at: [27,11], kind: "skiff" }, { at: [5,11], kind: "reeds" }, { at: [28,17], kind: "ruins" }],
  }),
  "17": mireLevel({
    id: "17", name: "沉篱芦荡", width: 34, height: 22, seed: 170639,
    description: "雾脊双岸以西，旧芦圃的水沟隔成三条进路。北面的围篱路最长，东路连续换岸，南路走旧田埂。敌群到西南窄口前才合流，沿芦荡边可继续去苔礁哨堡。",
    entries: [
      approach("north", "北圃旧篱", 0, [[33,4],[28,4],[28,2],[20,2],[20,5],[13,5],[13,8],[6,8],[6,12],[5,12],reedPensCore]),
      approach("east", "东圃换岸", 3, [[33,10],[26,10],[26,8],[18,8],[18,11],[11,11],[11,14],[8,14],[8,17],reedPensCore]),
      approach("south", "苔下田埂", 6, [[33,19],[25,19],[25,15],[19,15],[19,18],[13,18],[13,20],[8,20],[8,17],reedPensCore]),
    ],
    shallows: [[29,19],[30,19],[31,19],[18,18],[18,8],[27,10],[28,10],[29,10]],
    water: [
      [[9,0],[11,0],[10,4],[11,8],[10,12],[8,16],[9,19],[11,22],[6,22],[5,20],[6,17],[7,13],[8,10],[8,6],[7,3]],
      [[15,0],[17,0],[17,5],[16,8],[17,11],[16,15],[15,18],[16,22],[13,22],[12,18],[13,14],[14,10],[13,6],[14,2]],
      [[22,0],[24,0],[24,5],[23,8],[24,11],[23,16],[23,19],[24,22],[20,22],[19,18],[20,14],[21,11],[20,8],[21,4]],
      [[30,6],[34,6],[34,8],[31,8]], [[29,12],[34,12],[34,16],[30,16],[28,14]],
    ],
    land: [
      [[4,10],[7,10],[8,15],[8,18],[7,21],[3,21],[3,15]],
    ],
    plots: [[30,3],[27,3],[25,3],[19,3],[18,4],[12,6],[11,7],[7,7],[5,9],[4,13],[4,16],
      [31,9],[27,11],[25,9],[19,9],[19,10],[12,10],[10,13],[9,15],[7,16],
      [31,18],[27,18],[26,15],[24,14],[18,16],[17,17],[11,19],[10,19],[9,18]],
    bridges: [
      { from: [21,2], to: [24,2] },
      { from: [13,5], to: [16,5] }, { from: [13,5], to: [13,8] },
      { from: [7,8], to: [12,8], style: "mire-raft" },
      { from: [20,8], to: [24,8] }, { from: [13,11], to: [18,11], style: "mire-raft" },
      { from: [8,14], to: [10,14] }, { from: [19,15], to: [24,15] },
      { from: [19,15], to: [19,18] },
      { from: [13,18], to: [17,18], style: "mire-raft" }, { from: [13,18], to: [13,20] },
      { from: [8,20], to: [11,20] }, { from: [8,17], to: [8,20] },
    ],
    devices: [
      { kind: "mire-beacon", at: [12,13], center: [11,12], label: "换岸灯" },
      { kind: "mire-backwash", at: [24,17], from: [25,16], to: [25,19], label: "田埂闸" },
    ],
    scenery: [{ at: [19,6], kind: "cabin" }, { at: [12,3], kind: "reeds" }, { at: [16,13], kind: "reeds" },
      { at: [22,12], kind: "reeds" }, { at: [21,20], kind: "skiff" }, { at: [30,13], kind: "ruins" }],
  }),
  "18": mireLevel({
    id: "18", name: "苔礁哨堡", width: 36, height: 24, seed: 180844,
    description: "从沉篱芦荡下到西南苔礁。北壁石埂、东侧长堤和南侧渡头分别越过护堡水道，在石堡前汇合。东堤与南桥的倒潮闸共用水仓，堡外引灯可把炮火集中到最后一个转角。",
    entries: [
      approach("north", "北壁石埂", 0, [[22,0],[22,3],[16,3],[16,7],[12,7],[12,10],[7,10],mossKeepCore], "arch"),
      approach("east", "东堤长桥", 3, [[35,9],[28,9],[28,7],[23,7],[23,10],[17,10],[17,12],[12,12],mossKeepCore]),
      approach("south", "南塘渡头", 7, [[35,20],[29,20],[29,22],[24,22],[24,18],[14,18],[14,15],[9,15],[9,12],mossKeepCore], "landing"),
    ],
    shallows: [[30,20],[31,20],[32,20],[33,20],[28,22],[29,22],[30,9],[31,9],[32,9]],
    water: [
      [[0,2],[6,1],[12,2],[18,4],[23,5],[27,8],[29,11],[27,15],[27,19],[24,22],[21,24],[0,24]],
      [[29,13],[36,13],[36,17],[33,17],[30,16]],
    ],
    land: [
      [[1,8],[5,5],[10,5],[12,7],[14,9],[15,12],[15,15],[14,17],[10,19],[6,19],[2,16],[0,15],[0,10]],
      [[16,2],[20,1],[23,2],[23,5],[21,7],[18,6],[16,6]],
      [[26,9],[28,7],[32,7],[36,9],[36,24],[26,24],[25,21],[26,18],[25,14]],
      [[18,8],[21,8],[23,9],[21,11],[19,11],[18,10]],
      [[16,17],[19,17],[20,19],[18,21],[16,21],[15,19]],
    ],
    plots: [[20,2],[17,4],[13,9],[11,8],[10,9],[6,9],[6,11],[8,11],[7,13],[11,11],
      [32,8],[30,10],[27,6],[24,5],[21,8],[25,11],[21,9],[14,11],[14,13],
      [32,21],[30,21],[26,20],[25,21],[13,16],[11,16],[8,16],[10,13]],
    bridges: [
      { from: [16,5], to: [16,7] },
      { from: [12,7], to: [16,7] },
      { from: [23,7], to: [27,7] },
      { from: [23,7], to: [23,10] },
      { from: [17,10], to: [23,10] },
      { from: [17,10], to: [17,12] },
      { from: [12,12], to: [17,12] },
      { from: [14,18], to: [24,18], style: "mire-raft" },
      { from: [14,15], to: [14,18] },
      { from: [24,18], to: [24,22] },
    ],
    devices: [
      { kind: "mire-backwash", at: [19,9], from: [18,10], to: [22,10], cooldownGroup: "keep", label: "东堤闸" },
      { kind: "mire-backwash", at: [17,19], from: [16,18], to: [22,18], cooldownGroup: "keep", label: "南桥闸" },
      { kind: "mire-beacon", at: [10,14], center: [10,12], label: "堡前灯" },
    ],
    scenery: [
      { at: [7,8], kind: "mire-keep" }, { at: [4,9], kind: "ruins" }, { at: [10,6], kind: "ruins" },
      { at: [24,13], kind: "skiff" }, { at: [3,17], kind: "reeds" }, { at: [12,20], kind: "skiff" },
    ],
  }),
};
