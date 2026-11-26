export type TalentId =
  | "supply"
  | "swift-dispatch"
  | "device-craft"
  | "guard-spirit"
  | "salvage"
  | "weather-ward";

export interface TalentSpec {
  readonly id: TalentId;
  readonly name: string;
  readonly category: string;
  readonly accent: string;
  readonly summary: string;
  readonly costs: readonly [number, number, number];
  readonly shortLabels: readonly [string, string, string];
  readonly labels: readonly [string, string, string];
  readonly values: readonly [number, number, number];
}

export const TALENTS: readonly TalentSpec[] = [
  {
    id: "supply",
    name: "行军补给",
    category: "经济",
    accent: "#f2cf78",
    summary: "按比例提高每局战斗的初始金币",
    costs: [2, 3, 5],
    shortLabels: ["+4%", "+8%", "+12%"],
    labels: ["初始金币 +4%", "初始金币 +8%", "初始金币 +12%"],
    values: [0.04, 0.08, 0.12],
  },
  {
    id: "swift-dispatch",
    name: "急行赏金",
    category: "经济",
    accent: "#f2a463",
    summary: "提高提前召唤波次的金币奖励",
    costs: [1, 2, 4],
    shortLabels: ["+15%", "+30%", "+45%"],
    labels: ["提前发波奖励 +15%", "提前发波奖励 +30%", "提前发波奖励 +45%"],
    values: [0.15, 0.3, 0.45],
  },
  {
    id: "device-craft",
    name: "巧工机括",
    category: "机关",
    accent: "#7ad6c4",
    summary: "缩短各类战场机关的冷却时间",
    costs: [2, 3, 4],
    shortLabels: ["-6%", "-12%", "-18%"],
    labels: ["机关冷却 -6%", "机关冷却 -12%", "机关冷却 -18%"],
    values: [0.06, 0.12, 0.18],
  },
  {
    id: "guard-spirit",
    name: "卫队鼓舞",
    category: "拦截",
    accent: "#a4df7e",
    summary: "加快倒下拦截单位的重整复活速度",
    costs: [2, 3, 4],
    shortLabels: ["-8%", "-15%", "-22%"],
    labels: ["卫兵复活 -8%", "卫兵复活 -15%", "卫兵复活 -22%"],
    values: [0.08, 0.15, 0.22],
  },
  {
    id: "salvage",
    name: "整备回收",
    category: "整备",
    accent: "#e8c47a",
    summary: "提高拆卖炮塔与哨舍时的金币返还比例",
    costs: [1, 2, 3],
    shortLabels: ["65%", "70%", "75%"],
    labels: ["拆塔返还 65%", "拆塔返还 70%", "拆塔返还 75%"],
    values: [0.65, 0.7, 0.75],
  },
  {
    id: "weather-ward",
    name: "避风灯罩",
    category: "气候",
    accent: "#98d8f5",
    summary: "减轻恶劣天气对炮塔射速与射程的削弱",
    costs: [2, 3, 4],
    shortLabels: ["-18%", "-35%", "-50%"],
    labels: ["恶劣天气削弱 -18%", "恶劣天气削弱 -35%", "恶劣天气削弱 -50%"],
    values: [0.18, 0.35, 0.5],
  },
] as const;

export const TALENT_MAP: Readonly<Record<TalentId, TalentSpec>> = Object.fromEntries(
  TALENTS.map((spec) => [spec.id, spec]),
) as Record<TalentId, TalentSpec>;

export type TalentLevels = Readonly<Partial<Record<TalentId, number>>>;

export function totalStarsEarned(ratings: Readonly<Record<string, number | undefined>>): number {
  let total = 0;
  for (const stars of Object.values(ratings)) {
    if (typeof stars === "number" && stars > 0) total += Math.min(3, Math.floor(stars));
  }
  return total;
}

export function talentCost(id: TalentId, rank: number): number {
  const spec = TALENT_MAP[id];
  if (!spec) return 0;
  let sum = 0;
  const clamped = Math.max(0, Math.min(spec.costs.length, Math.floor(rank)));
  for (let i = 0; i < clamped; i++) sum += spec.costs[i];
  return sum;
}

export function spentStars(talents: TalentLevels): number {
  let sum = 0;
  for (const spec of TALENTS) sum += talentCost(spec.id, talents[spec.id] ?? 0);
  return sum;
}

export function sanitizeTalents(raw: unknown, maxStars?: number): Record<TalentId, number> {
  const result = {} as Record<TalentId, number>;
  let used = 0;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return result;
  const record = raw as Record<string, unknown>;
  for (const spec of TALENTS) {
    const val = record[spec.id];
    if (typeof val !== "number" || !Number.isFinite(val)) continue;
    let rank = Math.max(0, Math.min(spec.costs.length, Math.floor(val)));
    while (rank > 0 && maxStars !== undefined && used + talentCost(spec.id, rank) > maxStars) rank--;
    if (rank > 0) {
      result[spec.id] = rank;
      used += talentCost(spec.id, rank);
    }
  }
  return result;
}

export interface TalentEffects {
  readonly startingGoldFactor: number;
  readonly earlyRewardFactor: number;
  readonly deviceCooldownFactor: number;
  readonly guardRespawnFactor: number;
  readonly sellRefundRate: number;
  readonly weatherMitigation: number;
}

function rankValue(talents: TalentLevels | undefined, id: TalentId, fallback = 0): number {
  const rank = talents?.[id] ?? 0;
  if (rank <= 0) return fallback;
  const spec = TALENT_MAP[id];
  return spec.values[Math.min(spec.values.length, Math.floor(rank)) - 1] ?? fallback;
}

export function resolveTalentEffects(talents?: TalentLevels): TalentEffects {
  return {
    startingGoldFactor: 1 + rankValue(talents, "supply", 0),
    earlyRewardFactor: 1 + rankValue(talents, "swift-dispatch", 0),
    deviceCooldownFactor: 1 - rankValue(talents, "device-craft", 0),
    guardRespawnFactor: 1 - rankValue(talents, "guard-spirit", 0),
    sellRefundRate: rankValue(talents, "salvage", 0.6),
    weatherMitigation: rankValue(talents, "weather-ward", 0),
  };
}
