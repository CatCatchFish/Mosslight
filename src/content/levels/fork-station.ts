import type { Level, Point } from "../../engine/types.ts";

const core: Point = [28, 9];
const northMerge: readonly Point[] = [[22, 8], [24, 8], [24, 9], core];

const split: Point = [6, 13], merge: Point = [22, 12];
const tunnel = { from: [10, 19], to: [17, 19] } as const;
const shortTrack: readonly Point[] = [split, [19, 13], [19, 12], merge];
const longTrack: readonly Point[] = [split, [6, 19], tunnel.from, tunnel.to, [22, 19], merge];

export const FORK_STATION: Level = {
  id: "09",
  name: "分岔矿站",
  chapter: 2,
  biome: "quarry",
  weather: {
    initial: "dust",
    changes: [{ wave: 6, preset: "sandstorm" }, { wave: 8, preset: "dust" }, { wave: 10, preset: "emberStorm" }],
  },
  description: "总矿口与北侧风井在东侧汇合。第 3 波起南侧运渣口出怪，可换轨。长轨矿洞遮蔽敌人，末波大领主「熔轨巨擘」从总矿口入场，中央绞盘可打断其冲锋。",
  width: 30,
  height: 22,
  seed: 90519,
  gold: 620,
  health: 16,
  towers: ["arrow", "cannon", "frost", "ballista", "guard-post", "ember", "net", "griffin-roost", "prism"],
  guardPost: true,
  maxGuardTier: 4,
  wavePrep: 18,
  earlyRate: 3,
  maxEarlyReward: 10,
  entries: [
    {
      id: "shaft",
      label: "总矿口",
      scenery: "mine",
      marker: [1.8, 9],
      delay: 0,
      route: [[1, 8], [7, 8], [7, 7], [18, 7], [18, 8], ...northMerge],
    },
    {
      id: "vent",
      label: "北侧风井",
      scenery: "arch",
      marker: [2.95, 3.1],
      delay: 3,
      route: [[3, 2], [12, 2], [12, 4], [22, 4], ...northMerge],
    },
    {
      id: "freight",
      label: "南侧运渣口",
      scenery: "mine",
      marker: [1.75, 14.1],
      delay: 6,
      route: [[1, 13], ...shortTrack, [26, 12], [26, 10], [28, 10], core],
    },
  ],
  devices: [{ kind: "rail-cart", at: [17, 6], from: [17, 7], to: [7, 7] }],
  trackSwitch: { at: [3, 16], upper: shortTrack, lower: longTrack },
  tunnels: [tunnel],
  plots: [
    // Fixed routes and their eastern junction.
    [5, 7], [9, 8], [14, 6], [17, 8], [20, 7], [23, 7], [25, 8],
    [5, 3], [9, 3], [13, 3], [16, 3], [19, 5], [21, 6],
    // Switch crew and short-track firing positions.
    [4, 14], [8, 12], [10, 14], [12, 12], [14, 14], [16, 12], [18, 14], [20, 13],
    // Long-track portals and the separate approach to the core.
    [8, 20], [19, 20], [23, 16], [24, 11], [27, 11], [27, 8],
    [5, 18], [18, 18], [21, 17],
  ],
  pools: [
    [0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2],
    [16, 0], [17, 0], [16, 1], [17, 1], [18, 1],
    [12, 9], [13, 9], [14, 9], [13, 10], [14, 10], [15, 10],
    [3, 17], [4, 17], [3, 18], [4, 18], [3, 19],
    [26, 16], [27, 16], [27, 17], [28, 17], [28, 18], [29, 18],
    [1, 20], [2, 20], [0, 21], [1, 21], [2, 21],
  ],
  scenery: [
    { kind: "ore-vein", at: [10, 5] },
    { kind: "mine-cart", at: [11, 11] },
    { kind: "rail-lantern", at: [24, 18] },
  ],
  waves: [
    { title: "矿站试车", hp: 0.78, speed: 0.96, groups: {
      shaft: [[["lamp-mole", "ore-crawler"], 15, 0.78, 4]],
      vent: [[["ore-crawler", "lamp-mole"], 13, 0.76, 4]],
    } },
    { title: "甲虫越线", hp: 0.83, speed: 0.96, groups: {
      shaft: [["lamp-mole", 7, 0.78, 4], ["magnet-beetle", 2, 1.12, 2], ["lamp-mole", 5, 0.76, 3]],
      vent: [[["lamp-mole", "ore-crawler", "cinder-bat"], 13, 0.80, 6]],
    } },
    { title: "运渣口开班", hp: 0.89, speed: 0.97, groups: {
      shaft: [[["ore-crawler", "lamp-mole", "magnet-beetle"], 12, 0.75, 4]],
      vent: [[["ore-crawler", "lamp-mole", "cinder-bat"], 10, 0.75, 4]],
      freight: [[["slag-cart", "rivet-mite"], 4, 1.06, 2], ["lamp-mole", 4, 0.8]],
    } },
    { title: "双翼掠轨", hp: 0.95, speed: 0.98, groups: {
      shaft: [[["magnet-beetle", "cinder-bat", "lamp-mole"], 12, 0.76, 4]],
      vent: [[["cinder-bat", "magnet-beetle", "lamp-mole"], 11, 0.76, 4]],
      freight: [["ore-crawler", 6, 0.7, 3], ["cinder-bat", 2, 0.78]],
    } },
    { title: "南线重车", hp: 1.01, speed: 0.98, groups: {
      shaft: [[["lamp-mole", "magnet-beetle", "ore-crawler"], 11, 0.75, 4]],
      vent: [["cinder-bat", 6, 0.68, 3], ["ore-crawler", 4, 0.68]],
      freight: [[["slag-cart", "rivet-mite", "lamp-mole"], 6, 0.92, 3], ["lamp-mole", 3, 0.78]],
    } },
    { title: "三路会车", hp: 1.08, speed: 0.99, groups: {
      shaft: [["slag-driller", 1, 1.4], [["lamp-mole", "slag-cart", "magnet-beetle"], 10, 0.82, 4]],
      vent: [[["cinder-bat", "lamp-mole"], 9, 0.72, 4]],
      freight: [[["ore-crawler", "magnet-beetle", "lamp-mole"], 6, 0.76, 3], ["cinder-bat", 3, 0.76]],
    } },
    { title: "换线护送", hp: 1.12, groups: { shaft: [[["slag-cart", "lamp-mole"], 14, .74, 4]],
      vent: [[["cinder-bat", "ore-crawler"], 14, .64, 4]], freight: [[["rivet-mite", "magnet-beetle"], 11, .89, 3]] } },
    { title: "矿轨满载", hp: 1.16, speed: 1.0, groups: {
      shaft: [[["slag-cart", "rivet-mite", "lamp-mole"], 10, 0.87, 4]],
      vent: [[["cinder-bat", "magnet-beetle", "ore-crawler"], 9, 0.73, 3]],
      freight: [[["rivet-mite", "ore-crawler", "slag-cart"], 6, 0.84, 3], ["lamp-mole", 4, 0.78]],
    } },
    { title: "末班车前阵", hp: 1.22, groups: { shaft: [[["slag-cart", "magnet-beetle"], 13, .74, 4]],
      vent: [[["cinder-bat", "lamp-mole"], 17, .63, 4]], freight: [[["rivet-mite", "slag-cart", "ore-crawler"], 14, .80, 3]] } },
    { title: "末班加挂", hp: 1.24, groups: {
      shaft: [[["slag-cart", "magnet-beetle"], 10, 0.72, 4]],
      vent: [[["cinder-bat", "lamp-mole"], 8, 0.64, 4]],
      freight: [[["rivet-mite", "ore-crawler"], 6, 0.8, 3]],
    } },
    { title: "熔轨巨擘", hp: 1.27, speed: 1.0, groups: {
      shaft: [["slag-colossus", 1, 1.6], [["slag-cart", "magnet-beetle", "lamp-mole"], 14, 0.78, 4]],
      vent: [["cinder-bat", 9, 0.69, 3], ["ore-crawler", 3, 0.68]],
      freight: [[["slag-cart", "magnet-beetle", "lamp-mole"], 9, 0.78, 3], ["lamp-mole", 2, 0.8]],
    } },
  ],
};
