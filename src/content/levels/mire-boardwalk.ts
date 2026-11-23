import type { Level, Point } from "../../engine/types.ts";

const core: Point = [28, 9];

// The boundary river enters from the northeast and bends south along the peat bank.
const boundaryRiver: readonly (readonly [Point, Point])[] = [
  [[25, 0], [27, 3]], [[24, 4], [26, 7]], [[22, 8], [25, 11]],
  [[21, 12], [24, 14]], [[22, 15], [25, 18]],
];
const bogRows: readonly (readonly Point[])[] = [
  [[0, 10], [14, 19]], [[0, 10], [14, 20]], [[0, 4], [8, 11], [15, 20]],
  [[0, 3], [8, 10], [15, 21]], [[0, 1], [8, 10], [15, 19]], [[8, 10], [14, 17]],
  [[1, 3], [8, 10], [14, 16]], [[1, 5], [8, 10]], [[1, 6], [8, 14]],
  [[2, 7], [9, 14]], [[1, 7], [9, 13]], [[1, 5], [10, 13], [17, 18]],
  [[0, 4], [10, 12], [17, 18]], [[0, 2], [5, 7], [10, 12], [17, 19]],
  [[0, 1], [5, 7], [11, 13]], [[0, 1], [13, 18]], [[0, 1], [5, 10], [13, 18]],
  [[0, 1], [5, 10], [14, 19]], [[0, 1], [4, 11], [15, 19]],
];
const waters: Point[] = [];
for (const [[left, top], [right, bottom]] of boundaryRiver)
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++) waters.push([x, y]);
for (const [y, spans] of bogRows.entries())
  for (const [left, right] of spans)
    for (let x = left; x <= right; x++) waters.push([x, y]);

export const MIRE_BOARDWALK: Level = {
  id: "13",
  name: "瘴缘渡桥",
  chapter: 4,
  biome: "mire-edge",
  description:
    "东面的界河木桥通往冰脊哨台，西南泥道通向毒沼深处。北岸长栈道与南侧旧浮桥在桥头合流。升起桥头的沉木拦栅可扣住一批地面敌人，趁它们停步集中火力。",
  width: 30,
  height: 19,
  seed: 130627,
  gold: 760,
  health: 16,
  towers: [
    "arrow",
    "cannon",
    "frost",
    "ballista",
    "guard-post",
    "ember",
    "storm",
    "net",
    "griffin-roost",
    "prism",
    "hail-mortar",
    "glaze-lance",
    "frost-kennel",
  ],
  guardPost: true,
  maxTowerTier: 4,
  maxGuardTier: 4,
  wavePrep: 18,
  earlyRate: 3,
  maxEarlyReward: 10,
  weather: {
    initial: "miasma",
    changes: [{ wave: 6, preset: "toxicStorm" }, { wave: 7, preset: "miasma" }, { wave: 8, preset: "toxicStorm" }],
  },
  entries: [
    {
      id: "north",
      label: "垂苔沼湾",
      scenery: "trail",
      delay: 0,
      marker: [0, 5],
      route: [[0, 5], [6, 5], [6, 3], [12, 3], [12, 7], [18, 7], [18, 9], core],
    },
    {
      id: "south",
      label: "南沼泥道",
      scenery: "trail",
      delay: 4,
      marker: [3, 18],
      route: [[3, 18], [3, 15], [9, 15], [9, 12], [15, 12], [15, 14], [20, 14], [20, 9], core],
    },
  ],
  plots: [
    [2, 4], [4, 6], [5, 4], [7, 4], [12, 2], [11, 6], [13, 6], [17, 6], [16, 8],
    [4, 16], [8, 14], [10, 15], [8, 12], [13, 13], [14, 11], [16, 13], [19, 12],
    [17, 9], [19, 8], [19, 10], [21, 8], [21, 10], [27, 8], [27, 10], [28, 8],
  ],
  pools: waters,
  bridges: [
    { from: [7, 3], to: [11, 3] },
    { from: [9, 12], to: [13, 12], style: "mire-raft" },
    { from: [21, 9], to: [26, 9] },
  ],
  devices: [
    { kind: "mire-boom", at: [20, 8], center: [20, 9] },
  ],
  scenery: [
    { kind: "bog-idol", at: [18, 4] },
    { kind: "glow-pod", at: [25, 4] },
    { kind: "skiff", at: [22, 13] },
    { kind: "ruins", at: [27, 14] },
    { kind: "reeds", at: [3, 3] },
    { kind: "fish-trap", at: [7, 13] },
  ],
  waves: [
    {
      title: "瘴岸试探",
      hp: 0.82,
      groups: {
        north: [["mire-treant", 6, 0.95, 3]],
        south: [["mire-treant", 6, 0.98, 3]],
      },
    },
    {
      title: "潜鳄伏滩",
      hp: 0.91,
      groups: {
        north: [["mire-treant", 6, 0.90, 3], ["mire-croc", 2, 1.15, 2]],
        south: [["mire-croc", 2, 1.15, 2], ["mire-treant", 5, 0.92, 2]],
      },
    },
    {
      title: "蔓蛇窜道",
      hp: 0.99,
      groups: {
        north: [["mire-croc", 3, 1.05, 2], [["mire-treant", "vine-viper"], 6, 0.86, 3]],
        south: [["vine-viper", 3, 0.96, 2], [["mire-treant", "mire-croc"], 6, 0.90, 3]],
      },
    },
    {
      title: "腐菌沉步",
      hp: 1.07,
      groups: {
        north: [["mire-mycelid", 2, 1.25, 2], [["vine-viper", "mire-treant"], 6, 0.84, 3]],
        south: [["mire-croc", 3, 0.98, 2], [["mire-mycelid", "mire-treant"], 5, 0.95, 2]],
      },
    },
    { title: "毒牙绕滩", hp: 1.13, groups: { north: [[["mire-treant", "vine-viper"], 12, .74, 3]],
      south: [[["mire-croc", "mire-treant", "mire-mycelid"], 12, .86, 3]] } },
    {
      title: "浮囊飘瘴",
      hp: 1.18,
      speed: 1.02,
      groups: {
        north: [[["bloat-sporer", "mire-mycelid", "mire-treant"], 9, 0.88, 3]],
        south: [["bloat-sporer", 3, 0.95, 2], [["mire-croc", "vine-viper", "mire-treant"], 8, 0.84, 3]],
      },
    },
    { title: "菌幕叠涌", hp: 1.24, groups: { north: [[["mire-mycelid", "bloat-sporer", "vine-viper"], 14, .81, 3]],
      south: [[["mire-croc", "vine-viper", "mire-treant"], 12, .78, 4], ["bloat-sporer", 5, .83, 2]] } },
    { title: "界河前线", hp: 1.27, groups: {
      north: [[["mire-mycelid", "vine-viper"], 8, 0.82, 3], ["mire-treant", 4, 0.8, 2]],
      south: [[["mire-croc", "bloat-sporer"], 6, 0.84, 2], ["vine-viper", 4, 0.8, 2]],
    } },
    {
      title: "界河合流",
      hp: 1.29,
      speed: 1.03,
      groups: {
        north: [[["mire-mycelid", "bloat-sporer", "vine-viper"], 12, 0.84, 3], [["mire-croc", "mire-treant"], 6, 0.82, 2]],
        south: [[["mire-mycelid", "bloat-sporer", "mire-croc"], 12, 0.86, 3], [["vine-viper", "mire-treant"], 6, 0.82, 2]],
      },
    },
  ],
};
