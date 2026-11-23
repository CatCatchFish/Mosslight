import { key } from "../../engine/route.ts";
import type { Level, Point } from "../../engine/types.ts";

const deck: readonly Point[] = [
  [7, 5], [8, 5], [11, 5], [12, 5], [8, 7], [9, 7], [12, 7], [13, 7],
  [9, 10], [11, 10],
];
const downstreamDeck: readonly Point[] = [[5, 15], [7, 14], [11, 12]];
const platforms = new Set([...deck, ...downstreamDeck].map(([x, y]) => key(x, y)));
const banks = [[7, 15], [7, 15], [6, 15], [6, 14], [6, 14], [6, 14],
  [6, 14], [6, 14], [6, 14], [5, 15], [5, 15], [5, 15], [5, 14],
  [5, 14], [5, 13], [5, 13], [5, 12]] as const;
const water = banks.flatMap(([west, east], y) => Array.from({ length: east - west + 1 }, (_, i): Point =>
  [west + i, y]).filter(([x]) => !platforms.has(key(x, y))));

export const SLUICE_BRIDGE: Level = {
  id: "04",
  name: "灯闸长桥",
  chapter: 1,
  biome: "wetland",
  description: "河面陡然变宽。守住灯闸长桥，也要照看从下游折返、接上主桥的检修栈道。",
  width: 24,
  height: 17,
  seed: 41009,
  gold: 335,
  killRewardScale: 0.85,
  health: 17,
  towers: ["arrow", "cannon", "frost"],
  maxTowerTier: 3,
  guardPost: true,
  maxGuardTier: 2,
  wavePrep: 17,
  earlyRate: 3,
  maxEarlyReward: 10,
  entries: [
    { id: "west", label: "提灯桥头", scenery: "arch", delay: 0, marker: [0.5, 5],
      route: [[0, 5], [4, 5], [4, 6], [23, 6]] },
    { id: "sluice", label: "下游栈道", scenery: "landing", delay: 3, marker: [6, 15.65],
      route: [[6, 16], [6, 13], [10, 13], [10, 6], [23, 6]] },
  ],
  plots: [[2, 4], [4, 7], [5, 5], ...deck, [15, 5], [16, 7], [17, 5], [19, 7], [20, 5],
    ...downstreamDeck, [22, 7]],
  pools: water,
  bridges: [
    { from: [5, 6], to: [15, 6], style: "sluice" },
    { from: [10, 7], to: [10, 13] },
    { from: [6, 13], to: [10, 13] },
    { from: [6, 13], to: [6, 16] },
  ],
  bridgeDeck: [...deck, ...downstreamDeck],
  scenery: [
    { kind: "skiff", at: [7, 10] }, { kind: "drift-buoy", at: [14, 3] },
    { kind: "cabin", at: [17, 3] }, { kind: "ruins", at: [3, 8] },
    { kind: "fish-trap", at: [4, 14] }, { kind: "lily-bell", at: [12, 15] },
  ],
  devices: [
    { kind: "sluice", at: [16, 5], center: [14, 6] },
  ],
  waves: [
    { title: "桥边蛙跃", hp: 1.05, groups: { west: [["weir-frog", 7, 0.76, 3], ["reed-newt", 6, 0.68]] } },
    { title: "渡灯浮影", hp: 1.09, groups: {
      west: [["weir-frog", 6, 0.68, 3], ["ferry-snail", 2, 1.12]],
      sluice: [["ferry-snail", 2, 1.28], ["weir-frog", 3, 0.66]],
    } },
    { title: "双路涨潮", hp: 1.14, groups: {
      west: [[["reed-crab", "weir-frog"], 8, 0.67, 4], ["ferry-snail", 3, 1.12]],
      sluice: [[["ferry-snail", "reed-newt"], 8, 0.71, 4]],
    } },
    { title: "灯火摇晃", hp: 1.21, speed: 1.04, groups: {
      west: [["weir-frog", 10, 0.58, 5], ["ferry-snail", 4, 0.91, 2]],
      sluice: [[["reed-crab", "ferry-snail"], 10, 0.7, 5]],
    } },
    { title: "桥闸争流", hp: 1.25, groups: { west: [[["weir-frog", "reed-crab"], 13, .62, 4]],
      sluice: [["ferry-snail", 5, .90, 2], ["reed-newt", 8, .59, 4]] } },
    { title: "桥闸余波", hp: 1.27, groups: {
      west: [[["reed-crab", "weir-frog"], 8, 0.66, 3], ["ferry-snail", 4, 0.9, 2]],
      sluice: [[["ferry-snail", "reed-newt"], 8, 0.7, 4]],
    } },
    { title: "闸背鼋过桥", hp: 1.29, groups: {
      west: [["weir-frog", 4, 0.59], ["weir-turtle", 1, 1.2], ["ferry-snail", 5, 0.92]],
      sluice: [[["weir-frog", "ferry-snail"], 12, 0.69, 5]],
    } },
  ],
};
