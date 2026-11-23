import type { Level, Point } from "../../engine/types.ts";

const core: Point = [24, 8];

const lake: Point[] = [];
for (let x = 8; x <= 12; x++) {
  for (let y = 8; y <= 11; y++) lake.push([x, y]);
}
for (let x = 20; x <= 22; x++) {
  for (let y = 1; y <= 3; y++) lake.push([x, y]);
}

export const FROST_WATCH: Level = {
  id: "12",
  name: "冰脊哨台",
  chapter: 3,
  biome: "frost",
  weather: {
    initial: "snow",
    changes: [{ wave: 4, preset: "snowSquall" }, { wave: 7, preset: "blizzard" }],
  },
  towerStyle: "frost-watch",
  description: "霜脊高地深处三路合围，第 3 波开启南侧寒风崖口。末波凛冬麋王从雪峰栈道入场，冻住附近炮塔。连点被冻的塔 4 次可破冰，麋王低头蓄力时可调开拦截单位。",
  width: 26,
  height: 16,
  seed: 120412,
  gold: 720,
  health: 16,
  towers: ["arrow", "cannon", "frost", "ballista", "guard-post", "ember", "storm", "net", "griffin-roost", "prism", "hail-mortar", "glaze-lance", "frost-kennel"],
  guardPost: true,
  maxTowerTier: 4,
  maxGuardTier: 4,
  wavePrep: 18,
  earlyRate: 3,
  maxEarlyReward: 10,
  entries: [
    {
      id: "north",
      label: "雪峰栈道",
      scenery: "trail",
      delay: 0,
      marker: [1.5, 2.5],
      route: [[1, 2], [9, 2], [9, 5], [17, 5], [17, 8], core],
    },
    {
      id: "west",
      label: "冰湖长桥",
      scenery: "arch",
      delay: 3,
      marker: [1.1, 10],
      route: [[0, 10], [17, 10], [17, 8], core],
    },
    {
      id: "ridge",
      label: "寒风崖口",
      scenery: "trail",
      delay: 5,
      revealWave: 3,
      marker: [5.5, 14.7],
      route: [[5, 15], [5, 13], [14, 13], [14, 10], [17, 10], [17, 8], core],
    },
  ],
  plots: [
    [4, 3], [7, 3], [11, 4], [14, 4], [16, 6], [18, 6],
    [3, 9], [6, 9], [6, 11], [13, 11], [15, 9],
    [7, 14], [11, 14], [15, 12],
    [19, 7], [19, 9], [21, 7], [22, 9],
  ],
  pools: lake,
  bridges: [
    { from: [8, 10], to: [12, 10] },
  ],
  devices: [
    { kind: "sluice", at: [13, 9], center: [11, 10] },
  ],
  scenery: [
    { kind: "cabin", at: [3, 6] },
    { kind: "snow-lantern", at: [10, 8] },
    { kind: "ruins", at: [20, 4] },
  ],
  waves: [
    {
      title: "雪线探路",
      hp: 0.88,
      groups: {
        north: [["frost-hare", 10, 0.82, 4]],
        west: [["frost-hare", 9, 0.78, 3]],
      },
    },
    {
      title: "寒岩开路",
      hp: 0.97,
      groups: {
        north: [["frost-hare", 4, 0.82, 2], ["rime-golem", 2, 1.15, 2], [["snowbrush-fox", "frost-bear"], 5, 0.86, 2]],
        west: [["frost-hare", 4, 0.78, 2], [["rime-golem", "wisp", "frost-bear"], 7, 0.88, 3]],
      },
    },
    {
      title: "霜铃惊崖",
      hp: 1.06,
      groups: {
        north: [["frost-hare", 3, 0.8, 2], [["rime-golem", "frost-porcupine"], 5, 0.96, 2], ["frost-bear", 4, 0.88, 2]],
        west: [["frost-hare", 4, 0.78, 2], ["wisp", 7, 0.7, 3], ["ram", 2, 1.05]],
        ridge: [["frost-ray", 3, 0.76, 2], ["frost-owl", 3, 0.95, 2], ["frost-bear", 4, 0.88, 2]],
      },
    },
    {
      title: "风雪压境",
      hp: 1.15,
      speed: 1.0,
      groups: {
        north: [["frost-hare", 4, 0.8, 2], [["frost-owl", "wisp", "frost-bear"], 8, 0.82, 3]],
        west: [["frost-hare", 4, 0.78, 2], ["rime-golem", 3, 0.98, 2], [["snowbrush-fox", "ram", "ice-sail"], 7, 0.78, 3]],
        ridge: [[["frost-owl", "frost-ray"], 7, 0.72, 3], ["rime-golem", 2, 1.05]],
      },
    },
    {
      title: "霜冕初现",
      hp: 1.25,
      speed: 1.02,
      groups: {
        north: [["frost-hare", 4, 0.78, 2], [["rime-golem", "snowbrush-fox", "frost-bear"], 8, 0.82, 3]],
        west: [["frost-hare", 4, 0.76, 2], ["blizzard-elk", 1, 1.4], [["rime-golem", "frost-porcupine", "wisp"], 8, 0.82, 3]],
        ridge: [["frost-ray", 3, 0.75, 2], ["frost-owl", 4, 0.8, 2], ["frost-bear", 5, 0.84, 2]],
      },
    },
    { title: "三径结霜", hp: 1.31, groups: { north: [["frost-hare", 4, .76, 2], [["rime-golem", "snowbrush-fox"], 12, .8, 4]],
      west: [[["frost-bear", "frost-hare"], 13, .77, 4]], ridge: [["frost-ray", 3, .72, 2], [["frost-owl", "ice-sail"], 11, .74, 4]] } },
    {
      title: "双领主合围",
      hp: 1.38,
      speed: 1.03,
      groups: {
        north: [["frost-hare", 4, 0.78, 2], ["frost-yeti", 1, 1.4], [["rime-golem", "ram", "frost-bear"], 8, 0.84, 3]],
        west: [["frost-hare", 4, 0.76, 2], ["blizzard-elk", 1, 1.4], [["wisp", "frost-porcupine", "ice-sail"], 9, 0.76, 3]],
        ridge: [["frost-ray", 3, 0.73, 2], [["frost-owl", "frost-bear"], 8, 0.8, 3]],
      },
    },
    { title: "暴风前哨", hp: 1.44, groups: { north: [["frost-yeti", 1, 1.4], ["frost-hare", 5, .76, 2], [["frost-bear", "rime-golem", "wisp"], 15, .78, 6]],
      west: [["frost-hare", 4, .74, 2], [["ram", "frost-porcupine", "snowbrush-fox"], 15, .74, 6]], ridge: [["frost-ray", 4, .7, 2], [["frost-owl", "ice-sail"], 13, .71, 4]] } },
    { title: "暴风前夜", hp: 1.48, groups: {
      north: [["frost-hare", 4, 0.78, 2], [["rime-golem", "frost-bear"], 6, 0.86, 2], ["wisp", 5, 0.7, 3]],
      west: [["frost-hare", 4, 0.76, 2], [["frost-owl", "frost-ray"], 6, 0.8, 2], ["snowbrush-fox", 4, 0.78, 2]],
      ridge: [["frost-ray", 3, 0.74, 2], [["frost-bear", "ice-sail"], 6, 0.82, 2]],
    } },
    {
      title: "凛冬麋王",
      hp: 1.51,
      speed: 1.04,
      groups: {
        north: [["frost-moose", 1, 1.4], ["frost-hare", 5, 0.76, 2], [["rime-golem", "snowbrush-fox", "frost-bear"], 12, 0.82, 3]],
        west: [["frost-hare", 4, 0.74, 2], [["rime-golem", "ram", "frost-porcupine"], 10, 0.8, 3]],
        ridge: [["frost-ray", 3, 0.7, 2], ["frost-owl", 5, 0.76, 3], [["frost-bear", "ice-sail"], 6, 0.78, 2]],
      },
    },
  ],
};
