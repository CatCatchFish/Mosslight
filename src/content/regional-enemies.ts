import type { EnemyId, EnemySpec } from "../engine/types.ts";

export const REGIONAL_ENEMIES = {
  "moss-badger": {
    name: "苔背獾", soundFamily: "bark", color: "#a5ba72", hp: 106, speed: 1.25, pace: 8,
    reward: 9, leak: 1,
    ability: { kind: "burrow", cooldown: 9, initialDelay: 0, windup: 0.65, active: 0.95, brace: 0.45, boost: 1.15 },
    note: "被兔卫拦住时先刨土，随后短暂潜入地下并获得减伤。出土后有较长间隔，趁此时重新拦截。",
  },
  "mirror-shrimp": {
    name: "水镜虾", soundFamily: "shell", color: "#83e6da", hp: 117, speed: 1.4, pace: 9,
    reward: 9, leak: 1,
    ability: { kind: "screen", cooldown: 7, initialDelay: 2.5, windup: 0.65, active: 0.45, radius: 2.3, duration: 2.5, strength: 0.55 },
    note: "合拢透明双螯后喷出水幕，使附近同批怪物下一次受到的直击大幅减伤。快射塔适合先消耗水幕。",
  },
  "rivet-mite": {
    name: "铆钉螨", soundFamily: "stone", color: "#e69c68", hp: 168, speed: 1.18, pace: 10,
    reward: 11, leak: 2, armored: true, armorFactor: 0.84,
    ability: { kind: "dash", cooldown: 6.5, initialDelay: 2.6, windup: 0.76, active: 0.72, brace: 0.27, boost: 2.05 },
    note: "轮轴蓄力时橙灯逐盏点亮，随后沿道路冲刺并甩开拦截。蓄力时走得慢，适合让炮塔在那段路集中攻击。",
  },
  "frost-porcupine": {
    name: "霜刺豪猪", soundFamily: "ram", color: "#bceaf5", hp: 185, speed: 1.1, pace: 6,
    reward: 12, leak: 2,
    ability: { kind: "quills", initialDelay: 1.7, windup: 0.72, active: 0.42, cooldown: 6,
      radius: 2.1, damage: 17, targets: 3, regrowth: 3, guardedFactor: 0.84, exposedFactor: 1.12 },
    note: "遇到附近的地面拦截单位时会伏低竖刺，向它们所在的位置发射冰刺。冰刺可以躲开，射完后露出的软背适合集火。",
  },
} as const satisfies Partial<Record<EnemyId, EnemySpec>>;
