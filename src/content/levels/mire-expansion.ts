import type { Entry, Level, Point, SpawnGroup, Wave } from "../../engine/types.ts";
import { MIRE_BOARDWALK } from "./mire-boardwalk.ts";
import { MIRE_WAVES } from "./mire-waves.ts";

const MIRE_COUNT_SCALE = 1.1;

function hardenGroups(groups: readonly SpawnGroup[]): readonly SpawnGroup[] {
  return groups.map(([members, count, gap, batch]) => [
    members,
    count > 1 ? Math.ceil(count * MIRE_COUNT_SCALE) : count,
    gap,
    batch,
  ] as SpawnGroup);
}

function hardenWaves(waves: readonly Wave[]): readonly Wave[] {
  return waves.map((wave, index) => index < 2 ? wave : {
    ...wave,
    groups: Object.fromEntries(
      Object.entries(wave.groups).map(([entry, groups]) => [entry, hardenGroups(groups)]),
    ),
  });
}

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
  const waves = hardenWaves(MIRE_WAVES[layout.id]);
  const preferred = layout.id === "14"
    ? ["arrow", "cannon", "frost", "ember", "reed-post"] as const
    : ["arrow", "storm", "frost", "reed-post",
        ...(Number(layout.id) >= 16 ? ["spore-caster"] as const : []), "salt-caster"] as const;
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
const peatIslandCore: Point = [16, 10];
const mistRidgeCore: Point = [4, 10];
const reedPensCore: Point = [5, 14];
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
    description: "沿第 14 关西北岸滑入潭盆，东埠浮桥与南桩栈桥分头登上中心泥炭孤岛。两路绕行菌墩外环形成交叉射界，东北岸高泥脊通向雾脊双岸。本关开放盐釉投罐塔。",
    entries: [
      approach("east", "东埠栈桥", 0, [[33,7],[28,7],[22,7],[22,6],[10,6],[10,10],peatIslandCore], "landing"),
      approach("south", "南桩浮桥", 4, [[7,21],[7,18],[16,18],[16,14],[21,14],[21,10],peatIslandCore], "landing"),
    ],
    shallows: [[30,7],[31,7],[32,7],[9,18],[10,18],[11,18],[12,18],[16,6],[17,6],[19,14],[20,14]],
    water: [
      [[2,6],[5,3],[11,2],[20,2],[26,3],[30,6],[31,12],[28,17],[23,20],[15,21],[8,19],[4,16],[2,12]],
    ],
    land: [
      // Central Peat Island (expanded slightly west to frame [10,6]->[10,10])
      [[9,5],[16,4],[22,5],[24,8],[24,13],[21,16],[14,16],[9,13],[9,8]],
      // East Landing Promontory
      [[28,4],[34,4],[34,13],[28,12],[27,9],[28,6]],
      // South Piling Shore
      [[3,17],[14,17],[19,17],[20,22],[3,22]],
      // West Lookout Islet (close enough across narrow channel to snipe [10,6..10])
      [[6,7],[9,7],[9,11],[6,11]],
    ],
    plots: [
      // Inner-bend golden spots & staggered island crossfire hubs
      [11,7],[11,9],[14,8],[17,7],[20,9],[14,11],[17,12],[20,13],
      // Staggered outer island flanks
      [14,5],[19,5],[14,14],[22,12],
      // East landing triangle
      [29,6],[32,6],[30,8],
      // South shore alternating flanks & bridgehead
      [6,19],[9,17],[12,19],[14,17],[17,19],
      // West islet sniper perch (dist 2.0 from west rim)
      [8,8],
    ],
    bridges: [
      { from: [23, 7], to: [28, 7], style: "mire-raft" },
      { from: [16, 15], to: [16, 17] },
    ],
    devices: [
      { kind: "mire-backwash", at: [15,19], from: [16,15], to: [16,18], label: "南桩闸" },
      { kind: "mire-beacon", at: [21,8], center: [22,7], label: "东埠灯" },
    ],
    scenery: [
      { at: [26,2], kind: "cabin" }, { at: [17,4], kind: "ruins" },
      { at: [5,5], kind: "skiff" }, { at: [26,16], kind: "skiff" },
      { at: [9,15], kind: "reeds" }, { at: [25,11], kind: "reeds" },
    ],
  }),
  "16": mireLevel({
    id: "16", name: "雾脊双岸", width: 34, height: 21, seed: 160782,
    description: "由泥炭孤岛沿西南低岸登坡。北面高泥脊开阔蜿蜒，南面芦沟贴河曲折，河心沙洲夹在双岸之间，两路在西侧石口汇合。双岸引灯共用灯油，能把河心炮火从一岸调到另一岸。本关开放孢匣塔，可让毒孢沿近邻怪流传播。",
    entries: [
      approach("north", "东脊高路", 0, [[33,5],[26,5],[26,3],[18,3],[18,6],[10,6],[10,8],[6,8],[6,10],mistRidgeCore]),
      approach("south", "南岸芦沟", 4, [[8,20],[8,17],[21,17],[21,12],[9,12],[9,10],mistRidgeCore]),
    ],
    shallows: [[29,5],[30,5],[31,5],[21,3],[22,3],[11,17],[12,17],[13,17],[17,17],[18,17]],
    water: [
      // Sinuous central misty river (tightened so central sandbar reaches both banks!)
      [[6,10],[10,7],[16,7],[22,7],[27,7],[34,8],[34,13],[26,13],[22,14],[15,14],[10,13],[6,14],[2,14],[0,12],[2,10]],
      // South-east marsh pond
      [[27,16],[34,15],[34,21],[25,21],[26,18]],
      // North-west cove
      [[0,0],[7,0],[6,3],[3,5],[0,5]],
    ],
    land: [
      // Central mid-river crossfire sandbar (zig-zag plots within 1-2 tiles of banks!)
      [[11,8],[18,7],[20,9],[20,12],[14,12],[11,10]],
      // West stone-gate terrace
      [[0,6],[11,6],[11,9],[9,11],[5,13],[0,12]],
      // South-west reed shore
      [[6,12],[13,12],[14,14],[22,14],[22,20],[6,20]],
      // East south bank bridgehead
      [[20,11],[25,11],[25,16],[20,16]],
    ],
    plots: [
      // Central mid-river sandbar (zig-zag crossfire, all minDist <= 2.0!)
      [12,8],[15,10],[17,8],[19,11],
      // North high ridge (alternating flanks & inner bends)
      [31,4],[28,6],[25,4],[21,2],[19,4],[14,5],[11,5],[8,7],
      // South reed trench (alternating flanks & inner bends)
      [7,19],[10,16],[13,18],[16,16],[19,18],[20,15],[22,14],[11,13],
      // West stone-gate convergence triangle
      [5,8],[7,11],[5,11],
    ],
    bridges: [
      { from: [9, 10], to: [9, 12], style: "mire-raft" },
      { from: [13, 12], to: [20, 12], style: "mire-raft" },
    ],
    devices: [
      { kind: "mire-beacon", at: [15,5], center: [15,6], cooldownGroup: "mist-ridge", label: "北脊灯" },
      { kind: "mire-beacon", at: [16,11], center: [16,12], cooldownGroup: "mist-ridge", label: "南岸灯" },
    ],
    scenery: [
      { at: [14,2], kind: "ruins" }, { at: [7,4], kind: "cabin" },
      { at: [27,10], kind: "skiff" }, { at: [3,13], kind: "skiff" },
      { at: [25,11], kind: "reeds" }, { at: [24,19], kind: "ruins" },
    ],
  }),
  "17": mireLevel({
    id: "17", name: "沉篱芦荡", width: 34, height: 22, seed: 170639,
    description: "雾脊双岸以西，岔流将旧芦圃切分成数座苇田沙岛。北路绕围篱长堤，东路在中心苇岛连番换岸，南路沿苔下田埂直插西南合流口。腐冠瘴母守在出口，击破她孵出的孢囊才能断绝供养。",
    entries: [
      approach("north", "北圃旧篱", 0, [[33,4],[26,4],[26,2],[17,2],[17,5],[9,5],[9,10],[5,10],reedPensCore]),
      approach("east", "东圃换岸", 3, [[33,11],[27,11],[27,8],[19,8],[19,12],[11,12],[11,14],reedPensCore]),
      approach("south", "苔下田埂", 6, [[33,19],[27,19],[27,16],[17,16],[17,19],[11,19],[11,14],reedPensCore]),
    ],
    shallows: [[29,4],[30,4],[29,11],[30,11],[31,11],[29,19],[30,19],[31,19],[19,16],[20,16]],
    water: [
      // Main diagonal marsh canal (north-center -> center -> south-west)
      [[12,0],[16,0],[16,7],[17,12],[16,16],[15,22],[12,22],[12,15],[12,9],[11,4]],
      // Northeast lagoon cove
      [[21,0],[25,0],[25,9],[22,10],[21,6]],
      // Southeast curved branch canal
      [[16,12],[23,12],[26,15],[26,22],[22,22],[22,17],[19,14],[16,14]],
      // West edge reeds pond
      [[0,17],[4,17],[6,20],[6,22],[0,22]],
    ],
    land: [
      // West Sanctuary Peninsula
      [[1,4],[11,4],[11,16],[9,19],[3,17],[1,14]],
      // Central Reed Polder Island
      [[16,7],[21,7],[21,13],[16,13]],
      // South-center Bund Polder
      [[15,15],[22,15],[22,20],[15,20]],
    ],
    plots: [
      // North fence dyke (inner bends & alternating flanks)
      [31,3],[28,5],[25,3],[19,3],[16,4],[10,4],[8,6],[7,9],[4,11],
      // East island-hop & central polder
      [31,10],[28,12],[26,9],[20,7],[18,9],[18,11],[10,11],[8,13],[6,13],
      // South bund & convergence kill-zone
      [31,18],[28,20],[26,17],[21,15],[18,17],[16,18],[10,18],[10,16],[8,15],
    ],
    bridges: [
      { from: [21, 2], to: [25, 2] },
      { from: [11, 5], to: [16, 5], style: "mire-raft" },
      { from: [21, 8], to: [25, 8] },
      { from: [11, 12], to: [17, 12], style: "mire-raft" },
      { from: [22, 16], to: [26, 16] },
      { from: [11, 19], to: [16, 19], style: "mire-raft" },
    ],
    devices: [
      { kind: "mire-beacon", at: [10,13], center: [11,12], label: "换岸灯" },
      { kind: "mire-backwash", at: [20,17], from: [18,16], to: [22,16], label: "田埂闸" },
    ],
    scenery: [
      { at: [19,5], kind: "cabin" }, { at: [30,14], kind: "ruins" },
      { at: [14,8], kind: "reeds" }, { at: [23,12], kind: "reeds" },
      { at: [14,17], kind: "reeds" }, { at: [24,20], kind: "skiff" },
      { at: [2,19], kind: "skiff" },
    ],
  }),
  "18": mireLevel({
    id: "18", name: "苔礁哨堡", width: 36, height: 24, seed: 180844,
    description: "从沉篱芦荡下到西南苔礁。北壁石埂、东堤长桥与南塘渡头三路跨越宽阔护堡水道，直逼石堡前庭。东堤与南桥的倒潮闸共用水仓，堡前引灯可把炮火集中到最后的汇合口。",
    entries: [
      approach("north", "北壁石埂", 0, [[25,0],[25,3],[19,3],[19,7],[11,7],[11,10],[7,10],mossKeepCore], "arch"),
      approach("east", "东堤长桥", 3, [[35,10],[29,10],[29,8],[24,8],[24,12],[12,12],mossKeepCore]),
      approach("south", "南塘渡头", 7, [[35,20],[29,20],[29,22],[23,22],[23,18],[12,18],[12,12],mossKeepCore], "landing"),
    ],
    shallows: [[21,3],[22,3],[31,10],[32,10],[33,10],[31,20],[32,20],[33,20],[26,22],[27,22]],
    water: [
      // Grand surrounding fortress moat & west bog
      [[0,0],[18,0],[22,5],[23,10],[22,16],[22,24],[0,24]],
      // Eastern marsh inlet separating East Causeway and South Landing
      [[24,14],[36,14],[36,17],[28,17],[23,16]],
    ],
    land: [
      // Grand Fortified Moss-Reef Citadel Island
      [[3,6],[6,5],[12,5],[15,8],[15,15],[14,19],[9,20],[4,18],[2,14],[2,9]],
      // North Rocky Headland
      [[16,0],[28,0],[28,7],[17,7],[16,4]],
      // East Outer Causeway Bank
      [[23,7],[36,7],[36,14],[24,14],[23,11]],
      // South Ferry Peninsula
      [[22,17],[36,17],[36,24],[22,24]],
      // Mid-East Moat Gatehouse Islet (holds East Sluice + forward turret)
      [[18,9],[21,9],[21,11],[18,11]],
      // Mid-South Moat Gatehouse Islet (holds South Sluice + forward turret)
      [[16,19],[20,19],[20,21],[16,21]],
    ],
    plots: [
      // Citadel inner ramparts & staggered forecourt kill-zone
      [6,11],[9,11],[10,8],[13,8],[12,10],[14,11],[13,13],[11,15],[13,17],[11,18],[8,13],
      // North headland (inner bends & bridgehead)
      [24,2],[21,2],[20,4],[18,6],
      // East causeway & gatehouse islet
      [33,9],[30,11],[28,9],[25,9],[25,11],[20,10],
      // South landing & gatehouse islet
      [33,19],[30,21],[26,21],[24,20],[17,20],[19,19],
    ],
    bridges: [
      { from: [14, 7], to: [19, 7] },
      { from: [15, 12], to: [23, 12], style: "mire-raft" },
      { from: [14, 18], to: [22, 18], style: "mire-raft" },
    ],
    devices: [
      { kind: "mire-backwash", at: [19,10], from: [16,12], to: [22,12], cooldownGroup: "keep", label: "东堤闸" },
      { kind: "mire-backwash", at: [18,20], from: [15,18], to: [21,18], cooldownGroup: "keep", label: "南桥闸" },
      { kind: "mire-beacon", at: [10,13], center: [11,12], label: "堡前灯" },
    ],
    scenery: [
      { at: [7,8], kind: "mire-keep" }, { at: [5,9], kind: "ruins" }, { at: [10,6], kind: "ruins" },
      { at: [18,15], kind: "skiff" }, { at: [13,21], kind: "skiff" },
      { at: [4,16], kind: "reeds" }, { at: [29,15], kind: "reeds" },
    ],
  }),
};
