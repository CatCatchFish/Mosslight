import type { Level } from "../../engine/types.ts";

export const WINCH_GALLERY: Level = {
  id: "08",
  name: "绞盘矿廊",
  chapter: 2,
  biome: "quarry",
  weather: {
    initial: "dust",
    changes: [{ wave: 5, preset: "sandstorm" }, { wave: 8, preset: "emberStorm" }],
  },
  description: "沿折返矿轨守住上层核心。最后一波绞链矿傀会从中层检修门突入，可用迎面开来的矿车打断它的冲锋。",
  width: 22,
  height: 13,
  seed: 83640,
  gold: 535,
  health: 18,
  towers: ["arrow", "cannon", "ballista", "net", "griffin-roost", "frost", "guard-post", "ember"],
  guardPost: true,
  maxGuardTier: 4,
  wavePrep: 14,
  earlyRate: 3,
  maxEarlyReward: 10,
  entries: [
    { id: "drift", label: "谷底矿口", scenery: "mine", delay: 0, marker: [1.5, 11.65],
      route: [[1, 12], [1, 9], [19, 9], [19, 5], [4, 5], [4, 2], [12, 2]] },
    { id: "upper", label: "中层检修门", scenery: "arch", delay: 3, marker: [20.4, 5], revealWave: 7,
      route: [[21, 5], [4, 5], [4, 2], [12, 2]] },
  ],
  plots: [[3, 8], [6, 8], [9, 8], [11, 8], [14, 8], [17, 8], [18, 10], [16, 6],
    [13, 6], [10, 6], [7, 6], [7, 4], [10, 4], [13, 4], [3, 4], [5, 1], [8, 1], [11, 3], [20, 7]],
  pools: [
    [0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2],
    [15, 0], [16, 0], [17, 0], [18, 0], [15, 1], [16, 1], [17, 1], [18, 1],
    [16, 2], [17, 2], [18, 2], [17, 3], [18, 3],
    [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
    [5, 11], [6, 11], [7, 11], [8, 11], [10, 11], [6, 12], [7, 12], [8, 12], [9, 12], [10, 12],
  ],
  devices: [{ kind: "rail-cart", at: [5, 6], from: [5, 5], to: [18, 5] }],
  scenery: [{ kind: "mine-cart", at: [5, 8] }, { kind: "ore-vein", at: [15, 3] }, { kind: "hand-pump", at: [15, 10] }],
  waves: [
    { title: "谷底换班", hp: 1.06, groups: { drift: [["ore-crawler", 8, 0.63, 4], ["lamp-mole", 7, 0.82]] } },
    { title: "矿屑初潮", hp: 1.15, groups: { drift: [["ore-crawler", 8, 0.83, 3], ["lamp-mole", 8, 0.65, 4]] } },
    { title: "空轨会车", hp: 1.27, groups: { drift: [[["slag-cart", "cinder-bat", "magnet-beetle"], 15, 0.67, 4]] } },
    { title: "一线两层", hp: 1.39, groups: { drift: [
      [["slag-cart", "rivet-mite"], 5, 0.77, 2], [["lamp-mole", "cinder-bat", "magnet-beetle"], 15, 0.59, 5],
    ] } },
    { title: "连翼过弯", hp: 1.53, groups: { drift: [
      [["magnet-beetle", "cinder-bat"], 18, 0.55, 6], ["lamp-mole", 9, 0.54, 4],
    ] } },
    { title: "重车抢轨", hp: 1.67, groups: { drift: [
      [["slag-cart", "lamp-mole", "magnet-beetle"], 24, 0.61, 6], ["cinder-bat", 9, 0.52, 4],
    ] } },
    { title: "检修门试开", hp: 1.75, groups: { drift: [[["magnet-beetle", "cinder-bat", "lamp-mole"], 22, .64, 6]],
      upper: [["slag-cart", 4, .86, 2], ["rivet-mite", 4, .76, 2]] } },
    { title: "终班加挂", hp: 1.80, groups: {
      drift: [[["magnet-beetle", "cinder-bat"], 10, 0.62, 4], ["lamp-mole", 6, 0.6, 3]],
      upper: [["slag-cart", 3, 0.9, 2], ["rivet-mite", 3, 0.8, 2]],
    } },
    { title: "绞链领班", hp: 1.84, groups: {
      drift: [[["slag-cart", "magnet-beetle"], 8, 0.65, 4], [["lamp-mole", "cinder-bat", "magnet-beetle"], 23, 0.58, 5]],
      upper: [["cable-overseer", 2, 1.5], ["slag-cart", 2, 0.9]],
    } },
  ],
};
