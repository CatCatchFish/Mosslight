import { key } from "../../engine/route.ts";
import type { Level, Point } from "../../engine/types.ts";

const channels = [
  [[10, 15], [19, 24], [27, 31]],
  [[10, 16], [18, 23], [28, 31]],
  [[11, 16], [18, 22], [29, 31]],
  [[16, 18], [21, 23], [29, 31]],
  [[7, 8], [15, 18], [21, 23], [26, 28]],
  [[7, 8], [15, 17], [20, 22], [26, 28]],
  [[6, 8], [11, 13], [15, 17], [19, 22], [26, 28]],
  [[0, 1], [6, 7], [11, 13], [19, 21], [26, 27]],
  [[0, 1], [10, 16], [19, 22], [27, 28]],
  [[6, 7], [9, 14], [16, 16], [18, 21], [23, 23], [26, 27]],
  [[9, 13], [20, 23]],
  [[9, 12], [18, 21], [24, 28]],
  [[5, 8], [11, 19], [24, 27]],
  [[5, 8], [11, 20], [24, 26]],
  [[8, 10], [12, 21], [24, 26]],
  [[10, 16], [19, 22], [25, 26]],
  [[10, 22], [24, 26]],
  [[10, 17], [19, 23]],
  [[1, 4], [10, 17], [20, 24]],
  [[1, 5], [9, 18], [20, 25]],
] as const;
const platforms: readonly Point[] = [[11, 9], [13, 6], [12, 2]];
const dry = new Set(platforms.map((point) => key(...point)));
const lagoon = channels.flatMap((row, y) => row.flatMap(([west, east]) =>
  Array.from({ length: east - west + 1 }, (_, i): Point => [west + i, y]))).filter((point) => !dry.has(key(...point)));

export const LILY_SHOALS: Level = {
  id: "05",
  name: "睡莲浅滩",
  chapter: 1,
  biome: "wetland",
  description: "三条长路绕过芦滩和狭湾，再踏石合围湖心岛。可以在外岸提前拦截，也可以等敌群过水道时择一侧开闸。",
  width: 32,
  height: 20,
  seed: 51761,
  gold: 395,
  health: 17,
  towers: ["arrow", "cannon", "frost"],
  maxTowerTier: 3,
  guardPost: true,
  maxGuardTier: 2,
  wavePrep: 16,
  earlyRate: 3,
  maxEarlyReward: 10,
  weather: {
    initial: "mist",
    changes: [
      { wave: 2, preset: "rain" },
      { wave: 5, preset: "downpour" },
      { wave: 6, preset: "rain" },
      { wave: 8, preset: "thunderstorm" },
    ],
  },
  entries: [
    { id: "west", label: "西汀芦径", scenery: "trail", delay: 0, marker: [0.55, 16.85],
      route: [[0, 17], [6, 17], [6, 14], [3, 14], [3, 8], [8, 8], [8, 10], [16, 10]] },
    { id: "north", label: "北塘跳石", scenery: "trail", delay: 2.5, marker: [6, 0.4],
      route: [[6, 0], [6, 3], [14, 3], [14, 5], [10, 5], [10, 7], [16, 7], [16, 10]] },
    { id: "east", label: "东塘采莲渡", scenery: "landing", delay: 4.5, marker: [30.55, 16.85],
      route: [[31, 17], [27, 17], [27, 14], [30, 14], [30, 7], [24, 7], [24, 10], [16, 10]] },
  ],
  plots: [[2, 12], [5, 9], [11, 9], [13, 11], [15, 9], [17, 9], [15, 11], [17, 11],
    [8, 2], [13, 6], [17, 7], [22, 9], [26, 8], [28, 15], [29, 9], [30, 18], [7, 2], [8, 15],
    [10, 4], [24, 4], [9, 13], [23, 13], [29, 11], [12, 2]],
  pools: lagoon,
  bridges: [
    { from: [9, 10], to: [13, 10], style: "stones" },
    { from: [11, 7], to: [13, 7], style: "stones" },
    { from: [16, 8], to: [16, 9], style: "stones" },
    { from: [26, 7], to: [27, 7], style: "stones" },
    { from: [20, 10], to: [23, 10], style: "stones" },
  ],
  bridgeDeck: platforms,
  devices: [
    { kind: "sluice", at: [10, 12], center: [11, 10], cooldownGroup: "shallows" },
    { kind: "sluice", at: [22, 12], center: [21, 10], cooldownGroup: "shallows" },
  ],
  scenery: [
    { kind: "skiff", at: [23, 11] }, { kind: "lily-bell", at: [8, 7] }, { kind: "cabin", at: [18, 6] },
    { kind: "drift-buoy", at: [14, 16] }, { kind: "fish-trap", at: [27, 5] },
  ],
  waves: [
    { title: "两岸探路", hp: 1.02, groups: { west: [["weir-frog", 7, 0.79]], east: [["reed-newt", 8, 0.72]] } },
    { title: "莲叶掠水", hp: 1.05, groups: {
      north: [["lily-skater", 6, 0.63]], east: [["weir-frog", 4, 0.65], ["ferry-snail", 2, 1.1]],
    } },
    { title: "三面来潮", hp: 1.10, groups: {
      west: [[["reed-crab", "lily-skater"], 7, 0.7, 3]], north: [["ferry-snail", 5, 0.9]],
      east: [[["mirror-shrimp", "weir-frog", "weir-frog", "weir-frog"], 7, 0.65, 4]],
    } },
    { title: "沉灯与急脚", hp: 1.15, groups: {
      west: [["ferry-snail", 7, 0.83, 2]], north: [["lily-skater", 9, 0.58, 3]],
      east: [[["weir-frog", "reed-crab"], 9, 0.64, 3]],
    } },
    { title: "东西换潮", hp: 1.22, groups: {
      west: [["lily-skater", 11, 0.55, 4]], north: [[["mirror-shrimp", "weir-frog", "weir-frog", "weir-frog"], 8, 0.63, 4]],
      east: [["lotus-toad", 1, 1.2], [["reed-crab", "ferry-snail", "lily-skater"], 10, 0.59, 4]],
    } },
    { title: "双岸水幕", hp: 1.27, groups: { west: [[["lily-skater", "mirror-shrimp"], 10, .69, 4]],
      north: [["ferry-snail", 6, .87, 3], ["reed-crab", 5, .73, 3]], east: [[["weir-frog", "lily-skater"], 11, .58, 4]] } },
    { title: "湖心前潮", hp: 1.28, groups: {
      west: [["lily-skater", 8, 0.6, 3]],
      north: [["ferry-snail", 4, 0.8, 2]],
      east: [[["reed-crab", "weir-frog"], 8, 0.66, 4]],
    } },
    { title: "合围湖心", hp: 1.30, groups: {
      west: [["lotus-toad", 1, 1.3], [["reed-crab", "lily-skater"], 12, 0.58, 4]],
      north: [["lotus-toad", 1, 1.2], [["ferry-snail", "weir-frog"], 9, 0.65, 4]],
      east: [["lily-skater", 9, 0.52, 4], [["reed-crab", "ferry-snail"], 8, 0.6, 3]],
    } },
  ],
};
