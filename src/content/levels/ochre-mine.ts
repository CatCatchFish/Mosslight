import type { Level, Point } from "../../engine/types.ts";

const switchback: readonly Point[] = [[8, 6], [11, 6], [11, 7], [16, 7], [16, 8], [21, 8]];

export const OCHRE_MINE: Level = {
  id: "07",
  chapter: 2,
  name: "赭岩旧矿",
  biome: "quarry",
  weather: {
    initial: "dust",
    changes: [{ wave: 6, preset: "sandstorm" }, { wave: 7, preset: "dust" }, { wave: 9, preset: "sandstorm" }],
  },
  description: "矿轨与运渣坡在红岩下交汇。煤翎蝠会飞过卫兵，重装矿车则会沿旧轨推进。用弩箭守住空中，把重弩留给矿车。",
  width: 22,
  height: 13,
  seed: 72831,
  gold: 490,
  health: 17,
  towers: ["arrow", "cannon", "ballista", "guard-post", "net", "frost", "ember"],
  guardPost: true,
  maxGuardTier: 4,
  wavePrep: 16,
  earlyRate: 3,
  maxEarlyReward: 10,
  entries: [
    { id: "shaft", label: "断轨矿口", scenery: "mine", delay: 0,
      marker: [.6, 3.65], route: [[0, 4], [5, 4], [5, 6], ...switchback] },
    { id: "scree", label: "运渣斜坡", scenery: "trail", delay: 3.5,
      marker: [1.55, 11.55], route: [[1, 12], [1, 9], [8, 9], ...switchback] },
  ],
  plots: [
    [3, 3], [4, 5], [6, 5], [7, 7], [9, 5], [10, 7], [12, 6], [13, 8],
    [15, 6], [17, 7], [19, 9], [3, 8], [5, 10], [7, 10], [9, 9], [2, 11],
  ],
  pools: [
    [10, 0], [11, 0], [12, 0], [10, 1], [11, 1], [12, 1], [13, 1], [11, 2], [12, 2], [13, 2], [12, 3],
    [18, 0], [19, 0], [20, 0], [19, 1], [20, 1], [21, 1], [20, 2], [21, 2],
    [11, 11], [12, 11], [13, 11], [12, 12], [13, 12], [14, 12], [15, 12], [15, 11],
  ],
  scenery: [
    { kind: "mine-cart", at: [6, 3] },
    { kind: "ore-vein", at: [15, 3] },
    { kind: "rail-lantern", at: [11, 9] },
  ],
  waves: [
    { title: "井口灯晃", hp: 1.00, groups: {
      shaft: [["lamp-mole", 10, .7, 4]],
      scree: [["ore-crawler", 8, .62, 4]],
    } },
    { title: "煤翎掠坡", hp: 1.09, groups: {
      shaft: [["lamp-mole", 7, .7, 3], ["cinder-bat", 6, .50, 3]],
      scree: [["cinder-bat", 6, .57, 3]],
    } },
    { title: "重车试轨", hp: 1.21, groups: {
      shaft: [[["slag-cart", "lamp-mole", "lamp-mole"], 12, .74, 3]],
      scree: [[["lamp-mole", "ore-crawler", "cinder-bat"], 12, .66, 3]],
    } },
    { title: "飞影交错", hp: 1.35, speed: 1.04, groups: {
      shaft: [[["cinder-bat", "lamp-mole", "cinder-bat", "cinder-bat"], 16, .50, 4], ["slag-cart", 3, .92]],
      scree: [["slag-cart", 4, .91, 2], ["cinder-bat", 8, .54, 4]],
    } },
    { title: "回声运渣坡", hp: 1.49, groups: {
      shaft: [[["lamp-mole", "lamp-mole", "rivet-mite"], 9, .55, 3], ["slag-cart", 7, .79, 2]],
      scree: [[["slag-cart", "lamp-mole", "cinder-bat"], 18, .60, 3]],
    } },
    { title: "熄灯前的车队", hp: 1.65, speed: 1.04, groups: {
      shaft: [[["slag-cart", "rivet-mite", "lamp-mole", "cinder-bat"], 18, .65, 4], ["cinder-bat", 8, .50, 4]],
      scree: [["slag-driller", 1, 1.3], ["cinder-bat", 9, .52, 5], [["slag-cart", "rivet-mite", "lamp-mole"], 12, .67, 3]],
    } },
    { title: "铆车会班", hp: 1.75, groups: { shaft: [[["rivet-mite", "slag-cart", "lamp-mole"], 18, .67, 6]],
      scree: [[["cinder-bat", "ore-crawler", "slag-cart"], 20, .61, 6], ["cinder-bat", 5, .60, 3]] } },
    { title: "矿脉余响", hp: 1.80, groups: {
      shaft: [[["lamp-mole", "cinder-bat"], 12, .58, 4], ["slag-cart", 3, .78, 2]],
      scree: [[["ore-crawler", "cinder-bat"], 10, .62, 4], ["rivet-mite", 2, .8, 2]],
    } },
    { title: "矿脉回响", hp: 1.84, speed: 1.07, groups: {
      shaft: [["slag-driller", 1, 1.4], ["slag-cart", 5, .75, 2], [["lamp-mole", "cinder-bat", "cinder-bat"], 13, .52, 3],
        [["slag-cart", "rivet-mite", "lamp-mole"], 12, .70, 3]],
      scree: [["slag-driller", 1, 1.4], [["slag-cart", "cinder-bat", "cinder-bat", "lamp-mole"], 16, .62, 4],
        ["slag-cart", 4, .75, 2]],
    } },
  ],
};
