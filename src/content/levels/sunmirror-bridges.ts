import type { Level, Point } from "../../engine/types.ts";

const core: Point = [25, 8];
const mirrorCircuit = "sunmirror-bridges";

export const SUNMIRROR_BRIDGES: Level = {
  id: "11",
  name: "照雪双桥",
  chapter: 3,
  biome: "frost",
  description: "北坡短桥有密集炮位，南坡冰湖栈桥更长。两座日轮镜阵共用 15 秒冷却，照中敌人后使其 4 秒内多受 35% 伤害，并使镜甲岩羊的冰甲失效。等敌群踏进金色标线再照射。",
  width: 27,
  height: 17,
  seed: 11182,
  gold: 680,
  health: 16,
  towers: ["arrow", "ballista", "cannon", "frost", "storm", "ember", "net", "prism", "guard-post", "griffin-roost", "hail-mortar", "glaze-lance", "frost-kennel"],
  maxTowerTier: 4,
  guardPost: true,
  maxGuardTier: 4,
  wavePrep: 18,
  earlyRate: 3,
  maxEarlyReward: 10,
  weather: {
    initial: "snow",
    changes: [{ wave: 5, preset: "snowSquall" }, { wave: 9, preset: "blizzard" }],
  },
  entries: [
    {
      id: "north",
      label: "雪松坡",
      scenery: "trail",
      delay: 0,
      marker: [1.2, 3],
      route: [[1, 3], [6, 3], [6, 5], [17, 5], [17, 8], core],
    },
    {
      id: "south",
      label: "冰湖栈桥",
      scenery: "arch",
      delay: 4,
      marker: [1.25, 14],
      route: [[1, 14], [4, 14], [4, 11], [10, 11], [10, 14], [21, 14], [21, 10],
        [23, 10], [23, 8], core],
    },
  ],
  plots: [
    [4, 4], [8, 4], [10, 6], [12, 4], [14, 6], [15, 4], [16, 7], [19, 7], [20, 9],
    [5, 12], [9, 12], [12, 13], [15, 15], [18, 13], [20, 15], [22, 12],
    [22, 7], [24, 9], [24, 7],
  ],
  pools: [
    [9, 0], [10, 0], [10, 1], [10, 2], [11, 2], [10, 3], [11, 3], [10, 4], [11, 4],
    [10, 5], [11, 5], [11, 6], [11, 7], [12, 7], [10, 8], [11, 8], [12, 8], [11, 9], [12, 9],
    [14, 9], [15, 9], [16, 9], [17, 9], [15, 10], [16, 10], [17, 10], [18, 10], [16, 11], [17, 11],
    [16, 13], [17, 13], [16, 14], [17, 14], [18, 14], [16, 15], [17, 15], [18, 15], [19, 15],
    [17, 16], [18, 16], [19, 16], [20, 16],
    [23, 1], [24, 1], [25, 1], [23, 2], [24, 2], [25, 2], [25, 3], [26, 2], [26, 3],
  ],
  bridges: [
    { from: [10, 5], to: [11, 5] },
    { from: [16, 14], to: [18, 14] },
  ],
  devices: [
    { kind: "sun-mirror", at: [13, 7], center: [13, 5], label: "北坡镜阵", cooldownGroup: mirrorCircuit },
    { kind: "sun-mirror", at: [17, 12], center: [17, 14], label: "南坡镜阵", cooldownGroup: mirrorCircuit },
  ],
  scenery: [
    { kind: "cabin", at: [3, 7] },
    { kind: "ruins", at: [20, 3] },
    { kind: "floe", at: [15, 9] },
    { kind: "snow-lantern", at: [19, 16] },
  ],
  waves: [
    { title: "雪桥试光", hp: 0.78, groups: {
      north: [["frost-hare", 12, 0.73, 4], ["frost-ray", 3, 0.9, 2]],
      south: [["frost-hare", 12, 0.73, 3]],
    } },
    { title: "白尾扬雪", hp: 0.89, groups: {
      north: [[["mirror-ibex", "frost-hare"], 10, 0.81, 4]],
      south: [[["snowbrush-fox", "ice-sail", "frost-hare"], 12, 0.75, 3]],
    } },
    { title: "双桥抢渡", hp: 0.93, groups: {
      north: [[["snowbrush-fox", "mirror-ibex", "frost-hare"], 15, 0.76, 3]],
      south: [[["mirror-ibex", "ice-sail"], 8, 0.82, 4], ["frost-hare", 6, 0.66, 3]],
    } },
    { title: "风过桥头", hp: 1.01, groups: {
      north: [[["mirror-ibex", "wisp", "snowbrush-fox"], 15, 0.75, 3]],
      south: [[["snowbrush-fox", "ram", "frost-hare"], 12, 0.8, 3], ["frost-ray", 4, 0.64, 2]],
    } },
    { title: "风雪蔽日", hp: 1.09, speed: 1.02, groups: {
      north: [["frost-hare", 4, 0.74, 2], [["snowbrush-fox", "frost-porcupine", "mirror-ibex"], 15, 0.79, 3]],
      south: [["frost-hare", 4, 0.73, 2], [["mirror-ibex", "wisp", "snowbrush-fox"], 15, 0.77, 3]],
    } },
    { title: "镜外探步", hp: 1.13, groups: { north: [[["frost-hare", "snowbrush-fox", "mirror-ibex"], 17, .72, 3]],
      south: [[["ice-sail", "wisp", "mirror-ibex"], 16, .75, 3]] } },
    { title: "镜光争夺", hp: 1.18, speed: 1.02, groups: {
      north: [[["mirror-ibex", "snowbrush-fox", "frost-ray"], 15, 0.76, 3]],
      south: [[["ram", "snowbrush-fox", "mirror-ibex"], 15, 0.77, 3], ["ice-sail", 4, 0.72, 2]],
    } },
    { title: "镜甲压阵", hp: 1.24, groups: { north: [[["mirror-ibex", "snowbrush-fox"], 16, .72, 4], ["wisp", 5, .73, 3]],
      south: [[["mirror-ibex", "ice-sail", "frost-hare"], 19, .69, 6]] } },
    { title: "镜桥前阵", hp: 1.27, groups: {
      north: [[["mirror-ibex", "snowbrush-fox"], 10, 0.74, 3], ["wisp", 4, 0.7, 2]],
      south: [[["ram", "ice-sail", "frost-hare"], 10, 0.76, 3]],
    } },
    { title: "巨犸踏桥", hp: 1.29, speed: 1.04, groups: {
      north: [[["snowbrush-fox", "frost-hare", "mirror-ibex"], 12, 0.72, 3], [["mirror-ibex", "wisp"], 8, 0.76, 4]],
      south: [["frost-mammoth", 2, 1.5], [["mirror-ibex", "snowbrush-fox", "ice-sail"], 18, 0.78, 3]],
    } },
  ],
};
