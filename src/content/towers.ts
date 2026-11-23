import { isGuardPostId } from "../engine/guards.ts";
import type { BuildingId, Level, TowerId, TowerSpec } from "../engine/types.ts";

export const LOADOUT_LIMIT = 5;

export function validTowerSelection(value: unknown): BuildingId[] {
  if (!Array.isArray(value)) return [];
  const types = value.map((id) => id === "rivet-foundry" ? "griffin-roost" : id).filter(
    (id): id is BuildingId => typeof id === "string" &&
      (Object.hasOwn(TOWERS, id) || isGuardPostId(id)),
  );
  return [...new Set(types)];
}

export function levelTowerOptions(level: Level) {
  return validTowerSelection(level.guardPost ? [...level.towers, "guard-post"] : level.towers);
}

export function battleLoadout(level: Level, selection?: readonly BuildingId[]) {
  const available = levelTowerOptions(level);
  const picked = level.tutorial
    ? []
    : validTowerSelection(selection).filter((type) => available.includes(type));
  return (picked.length ? picked : available).slice(0, LOADOUT_LIMIT);
}

export const BUILDING_REGION: Readonly<Record<BuildingId, number>> = {
  arrow: 0,
  cannon: 0,
  frost: 0,
  "guard-post": 0,
  ember: 1,
  ballista: 2,
  net: 2,
  "griffin-roost": 2,
  prism: 2,
  storm: 3,
  "hail-mortar": 3,
  "glaze-lance": 3,
  "frost-kennel": 3,
  "reed-post": 4,
  "salt-caster": 4,
};

export const ALL_BUILDINGS: readonly BuildingId[] = [
  "arrow", "cannon", "frost", "ember", "ballista", "net", "prism", "storm",
  "hail-mortar", "glaze-lance", "salt-caster",
  "guard-post", "griffin-roost", "frost-kennel", "reed-post",
];

// 一至三级使用 tiers，四级按方向选择 paths。
// stats 中 splash 是溅射半径，slow 是受击后移动速度倍率。
export const TOWERS: Readonly<Record<TowerId, TowerSpec>> = {
  arrow: {
    name: "弩箭塔",
    role: "快速单体",
    sprite: "arrow",
    tracks: true,
    flight: [0.075, 36],
    color: "#ffdc94",
    tiers: [
      { cost: 70, damage: 12, range: 3.25, interval: 0.4 },
      { cost: 65, damage: 20, range: 3.45, interval: 0.37 },
      { cost: 55, damage: 26, range: 3.6, interval: 0.35 },
    ],
    paths: {
      sniper: {
        name: "猎隼弩",
        detail: "射得更远，单发 71 伤害",
        color: "#ffd294",
        cost: 108,
        damage: 71,
        range: 4.85,
        interval: 0.76,
      },
      volley: {
        name: "连发弩",
        detail: "连续快射，擅长截击轻型快怪",
        color: "#d9ee8d",
        cost: 105,
        damage: 28,
        range: 3.6,
        interval: 0.26,
      },
    },
  },
  cannon: {
    name: "火炮塔",
    role: "爆炸溅射",
    sprite: "cannon",
    tracks: true,
    flight: [0.25, 25],
    color: "#ff9764",
    tiers: [
      { cost: 105, damage: 35, range: 3.6, interval: 1.85, splash: 1.32 },
      { cost: 90, damage: 50, range: 3.85, interval: 1.74, splash: 1.46 },
      { cost: 65, damage: 62, range: 3.95, interval: 1.68, splash: 1.53 },
    ],
    paths: {
      blast: {
        name: "重爆炮",
        detail: "89 点范围伤害，爆炸半径 1.85 格",
        color: "#ff9c61",
        cost: 125,
        damage: 89,
        range: 4.2,
        interval: 2.05,
        splash: 1.85,
      },
      quake: {
        name: "震地炮",
        detail: "对爆炸范围内敌人减速 40%",
        color: "#f9dc8c",
        cost: 115,
        damage: 63,
        range: 3.95,
        interval: 1.5,
        splash: 1.58,
        slow: 0.6,
        duration: 1.35,
      },
    },
  },
  frost: {
    name: "冰晶塔",
    role: "减速控场",
    sprite: "frost",
    flight: [0.18, 30],
    color: "#9df1f6",
    tiers: [
      {
        cost: 90,
        damage: 8,
        range: 3.05,
        interval: 0.8,
        slow: 0.65,
        duration: 1.4,
      },
      {
        cost: 75,
        damage: 12,
        range: 3.25,
        interval: 0.74,
        slow: 0.58,
        duration: 1.5,
      },
      {
        cost: 60,
        damage: 15,
        range: 3.4,
        interval: 0.7,
        slow: 0.55,
        duration: 1.65,
      },
    ],
    paths: {
      chill: {
        name: "寒潮晶柱",
        detail: "同时减速目标周围的敌人",
        color: "#b8f6ff",
        cost: 110,
        damage: 18,
        range: 3.6,
        interval: 0.68,
        splash: 1.55,
        slow: 0.47,
        duration: 1.85,
      },
      shatter: {
        name: "碎晶尖塔",
        detail: "对减速中的目标造成双倍伤害",
        color: "#d8c1ff",
        cost: 105,
        damage: 24,
        range: 3.45,
        interval: 0.64,
        slow: 0.54,
        duration: 1.65,
        chilledDamage: 2,
      },
    },
  },
  ember: {
    name: "燧火塔",
    role: "持续灼烧",
    sprite: "ember",
    flight: [0.11, 28],
    color: "#f39958",
    tiers: [
      {
        cost: 85,
        damage: 8,
        range: 2.9,
        interval: 0.7,
        burn: { damagePerSecond: 12, seconds: 2.15 },
      },
      {
        cost: 75,
        damage: 14,
        range: 3.1,
        interval: 0.67,
        burn: { damagePerSecond: 20, seconds: 2.3 },
      },
      {
        cost: 60,
        damage: 16,
        range: 3.2,
        interval: 0.64,
        burn: { damagePerSecond: 23, seconds: 2.4 },
      },
    ],
    paths: {
      wildfire: {
        name: "散火炉",
        detail: "火星溅射，能同时点燃靠近的敌人",
        cost: 112,
        damage: 18,
        range: 3.35,
        interval: 0.7,
        splash: 1.06,
        burn: { damagePerSecond: 23, seconds: 2.4 },
        color: "#ff9b59",
      },
      coal: {
        name: "长明炉",
        detail: "延长燃烧时间，灼伤高生命目标",
        cost: 105,
        damage: 24,
        range: 3.55,
        interval: 0.88,
        burn: { damagePerSecond: 37, seconds: 3.55 },
        color: "#f6cd72",
      },
    },
  },
  storm: {
    name: "雷鸣塔",
    role: "连锁闪电",
    sprite: "storm",
    flight: [0.05, 58],
    color: "#c8b8ff",
    tiers: [
      {
        cost: 115,
        damage: 23,
        range: 3.4,
        interval: 1.22,
        chain: { jumps: 2, range: 1.7 },
      },
      {
        cost: 90,
        damage: 33,
        range: 3.6,
        interval: 1.17,
        chain: { jumps: 2, range: 1.82 },
      },
      {
        cost: 65,
        damage: 39,
        range: 3.7,
        interval: 1.1,
        chain: { jumps: 3, range: 1.9 },
      },
    ],
    paths: {
      fork: {
        name: "岔雷针",
        detail: "一次最多跳跃四次，适合长队",
        cost: 128,
        damage: 53,
        range: 3.9,
        interval: 1.08,
        chain: { jumps: 4, range: 1.9 },
        color: "#b0e4ff",
      },
      surge: {
        name: "雷涌柱",
        detail: "跳跃次数较少，单次伤害更高",
        cost: 120,
        damage: 85,
        range: 3.75,
        interval: 1.28,
        chain: { jumps: 2, range: 2.4 },
        color: "#e7c3ff",
      },
    },
  },
  ballista: {
    name: "重弩塔",
    role: "远射破甲",
    sprite: "ballista",
    tracks: true,
    flight: [0.085, 41],
    color: "#ffdbac",
    tiers: [
      { cost: 125, damage: 46, range: 4.8, interval: 1.52, armorBonus: 1.5 },
      { cost: 95, damage: 63, range: 5.05, interval: 1.43, armorBonus: 1.62 },
      { cost: 70, damage: 74, range: 5.2, interval: 1.38, armorBonus: 1.72 },
    ],
    paths: {
      piercer: {
        name: "破甲弩",
        detail: "重甲敌人承受 1.75 倍伤害",
        cost: 132,
        damage: 106,
        range: 5.5,
        interval: 1.45,
        armorBonus: 1.75,
        color: "#ffe2aa",
      },
      repeater: {
        name: "机簧弩",
        detail: "更快装填，兼顾快速小队",
        cost: 120,
        damage: 60,
        range: 5,
        interval: 0.72,
        armorBonus: 1.45,
        color: "#d5eca1",
      },
    },
  },
  net: {
    name: "缚网塔",
    role: "连续发射短矢 · 辅助捕网",
    sprite: "net",
    flight: [.085, 36],
    color: "#dcce9b",
    tiers: [
      { cost: 100, damage: 16, range: 3.6, interval: .82, net: { seconds: 1.35, cooldown: 5.2 } },
      { cost: 80, damage: 22, range: 3.8, interval: .76, net: { seconds: 1.65, cooldown: 5 } },
      { cost: 65, damage: 28, range: 4, interval: .72, net: { seconds: 1.9, cooldown: 4.7 } },
    ],
    paths: {
      sinker: {
        name: "坠索",
        detail: "重型短矢，辅助捕网使单体落地 2.9 秒",
        color: "#e2bf83",
        cost: 120, damage: 37, range: 4.2, interval: .85,
        net: { seconds: 2.9, cooldown: 5.2 },
      },
      scatter: {
        name: "散网",
        detail: "短矢发射更快，辅助捕网最多罩住 3 个飞行目标",
        color: "#bce3ad",
        cost: 125, damage: 32, range: 4.05, interval: .65,
        net: { seconds: 1.45, cooldown: 4.6, spread: 1.45 },
      },
    },
  },
  prism: {
    name: "蓄光棱镜",
    role: "锁定同一敌人，持续照射增伤",
    sprite: "prism",
    flight: [.045, 74],
    color: "#acebd2",
    tiers: [
      { cost: 115, damage: 17, range: 3.25, interval: .72, focus: { seconds: 1.8, bonus: .55 } },
      { cost: 90, damage: 23, range: 3.45, interval: .68, focus: { seconds: 1.7, bonus: .65 } },
      { cost: 70, damage: 29, range: 3.65, interval: .64, focus: { seconds: 1.6, bonus: .75 } },
    ],
    paths: {
      concentrate: {
        name: "聚束",
        detail: "1.05 秒即可蓄满，满蓄光束对重甲更有效",
        color: "#fff0ae",
        cost: 135, damage: 37, range: 3.85, interval: .66,
        focus: { seconds: 1.05, bonus: .72, armor: 1.35 },
      },
      refraction: {
        name: "折光",
        detail: "满蓄后向近邻分出一束光",
        color: "#c7e7ff",
        cost: 130, damage: 32, range: 3.75, interval: .65,
        focus: { seconds: 1.6, bonus: .70 }, chain: { jumps: 1, range: 1.5 },
      },
    },
  },
  "hail-mortar": {
    name: "冰雹迫击塔",
    role: "远距冰雹溅射与减速",
    sprite: "hail-mortar",
    flight: [0.22, 24],
    color: "#8ed8f5",
    tiers: [
      { cost: 120, damage: 34, range: 4.5, interval: 1.95, splash: 1.45, slow: 0.75, duration: 1.4 },
      { cost: 95, damage: 48, range: 4.75, interval: 1.85, splash: 1.6, slow: 0.70, duration: 1.55 },
      { cost: 75, damage: 61, range: 4.95, interval: 1.76, splash: 1.72, slow: 0.66, duration: 1.7 },
    ],
    paths: {
      avalanche: {
        name: "雪崩重臼",
        detail: "大范围冰岩砸击，强效减速整片敌群",
        color: "#a8ecff",
        cost: 135, damage: 90, range: 5.2, interval: 2.05, splash: 2.0, slow: 0.58, duration: 1.9,
      },
      glacier: {
        name: "冰裂速臼",
        detail: "装填更快，对已减速目标造成额外碎冰伤害",
        color: "#c7d4ff",
        cost: 125, damage: 61, range: 4.95, interval: 1.2, splash: 1.55, slow: 0.66, duration: 1.6, chilledDamage: 1.65,
      },
    },
  },
  "glaze-lance": {
    name: "霜枪塔",
    role: "破甲霜枪 · 追击减速目标",
    sprite: "glaze-lance",
    flight: [0.08, 44],
    color: "#bcecff",
    tiers: [
      { cost: 115, damage: 36, range: 4.1, interval: 1.15, armorBonus: 1.35, chilledDamage: 1.35 },
      { cost: 90, damage: 50, range: 4.35, interval: 1.08, armorBonus: 1.45, chilledDamage: 1.42 },
      { cost: 70, damage: 63, range: 4.55, interval: 1.02, armorBonus: 1.55, chilledDamage: 1.5 },
    ],
    paths: {
      skewer: {
        name: "贯冰长枪",
        detail: "超远距重型冰枪，专克重甲与受寒大怪",
        color: "#e0f7ff",
        cost: 135, damage: 90, range: 5.1, interval: 1.24, armorBonus: 1.65, chilledDamage: 1.55,
      },
      flurry: {
        name: "连霜齐射",
        detail: "高速冰针并向近邻弹射，压制密集编队",
        color: "#a5e8e0",
        cost: 125, damage: 42, range: 4.5, interval: 0.7, armorBonus: 1.35, chilledDamage: 1.35,
        chain: { jumps: 2, range: 1.75 },
      },
    },
  },
  "salt-caster": {
    name: "盐釉投罐塔", role: "地面溅射 · 盐釉降低护甲减伤", sprite: "salt-caster",
    color: "#ead6ad", flight: [.26, 10],
    tiers: [
      { cost: 115, damage: 36, range: 3.5, interval: 1.85, splash: 1, groundOnly: true, salt: { armor: .08, duration: 2.8 } },
      { cost: 90, damage: 50, range: 3.7, interval: 1.7, splash: 1.05, groundOnly: true, salt: { armor: .09, duration: 3 } },
      { cost: 70, damage: 64, range: 3.9, interval: 1.55, splash: 1.1, groundOnly: true, salt: { armor: .1, duration: 3.2 } },
    ],
    paths: {
      "thick-glaze": {
        name: "厚釉破甲", detail: "82 冲击伤害 · 护甲减伤降低 18 个百分点，持续 4 秒",
        cost: 130, damage: 82, range: 3.9, interval: 1.45, splash: 1.2, groundOnly: true,
        color: "#f0dcaa", salt: { armor: .18, duration: 4 },
      },
      "salt-rain": {
        name: "分罐盐雨", detail: "向两个不同地面目标投罐 · 每个敌人每轮最多承受一次冲击",
        cost: 125, damage: 64, range: 3.9, interval: 1.55, splash: 1.1, groundOnly: true, split: true,
        color: "#e7ac80", salt: { armor: .1, duration: 3.6 },
      },
    },
  },
};
