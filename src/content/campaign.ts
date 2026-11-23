import { FROST_FORD } from "./levels/frost-ford.ts";
import { SUNMIRROR_BRIDGES } from "./levels/sunmirror-bridges.ts";
import { FROST_WATCH } from "./levels/frost-watch.ts";
import { MIRE_BOARDWALK } from "./levels/mire-boardwalk.ts";
import { MIRE_EXPANSION_LEVELS } from "./levels/mire-expansion.ts";
import type { EnemyId } from "../engine/types.ts";
import { TUTORIAL_LEVEL } from "./levels/forest-outpost.ts";
import { PINE_CREEK } from "./levels/pine-creek.ts";
import { REED_BRIDGE } from "./levels/reed-bridge.ts";
import { SLUICE_BRIDGE } from "./levels/sluice-bridge.ts";
import { LILY_SHOALS } from "./levels/lily-shoals.ts";
import { FIELD_LEVEL } from "./levels/emerald-woods.ts";
import { OCHRE_MINE } from "./levels/ochre-mine.ts";
import { WINCH_GALLERY } from "./levels/winch-gallery.ts";
import { FORK_STATION } from "./levels/fork-station.ts";
import type { Level } from "../engine/types.ts";
import { planFormation } from "../engine/formation.ts";
import type { WeatherPlan } from "./weather.ts";

export interface Stage {
  id: string;
  index: number;
  chapter: number;
  level: Level | null;
}

export const CHAPTERS = [
  { name: "林缘岗哨", short: "林哨", icon: "pine", color: "#c9e494", surface: "#203626", landscape: "松林小径通往伐木营地。",
    weather: { initial: "breeze", changes: [{ wave: 5, preset: "gale" }] } },
  { name: "苔岸河湾", short: "河湾", icon: "water", color: "#9fe6c9", surface: "#183936", landscape: "芦苇和浅滩围绕着古老的渡口。",
    weather: { initial: "mist", changes: [{ wave: 2, preset: "rain" }, { wave: 4, preset: "downpour" }, { wave: 5, preset: "mist" }, { wave: 7, preset: "thunderstorm" }] } },
  { name: "弃采矿道", short: "矿道", icon: "pick", color: "#f5c58a", surface: "#382c23", landscape: "旧矿轨沿着赤岩采石层深入山体。",
    weather: { initial: "dust", changes: [{ wave: 6, preset: "sandstorm" }] } },
  { name: "霜脊高地", short: "霜脊", icon: "snow", color: "#bce6ff", surface: "#213646", landscape: "雪峰下的桥灯指向冰河渡口。",
    weather: { initial: "snow", changes: [{ wave: 4, preset: "snowSquall" }, { wave: 8, preset: "blizzard" }] } },
  { name: "瘴雾毒沼", short: "毒沼", icon: "mire", color: "#b6da9e", surface: "#222e2b", landscape: "枯枝、苔礁与低垂瘴雾覆在沉静的毒沼浅滩上。",
    weather: { initial: "miasma", changes: [{ wave: 6, preset: "toxicStorm" }] } },
] as const satisfies readonly { weather: WeatherPlan; [key: string]: unknown }[];

export function battleWeather(level: Pick<Level, "chapter" | "weather">): WeatherPlan {
  return level.weather ?? CHAPTERS[level.chapter]?.weather ?? { initial: "clear" };
}
export const PLAYABLE_LEVELS: Readonly<Record<string, Level>> = {
  "01": TUTORIAL_LEVEL,
  "02": PINE_CREEK,
  "03": REED_BRIDGE,
  "04": SLUICE_BRIDGE,
  "05": LILY_SHOALS,
  "06": FIELD_LEVEL,
  "07": OCHRE_MINE,
  "08": WINCH_GALLERY,
  "09": FORK_STATION,
  "10": FROST_FORD,
  "11": SUNMIRROR_BRIDGES,
  "12": FROST_WATCH,
  "13": MIRE_BOARDWALK,
  ...MIRE_EXPANSION_LEVELS,
};
export const STAGES: readonly Stage[] = Array.from(
  { length: 18 },
  (_, index) => {
    const id = String(index + 1).padStart(2, "0");
    const level = PLAYABLE_LEVELS[id] ?? null;
    return { id, index, chapter: Math.min(4, Math.floor(index / 3)), level };
  },
);

// The almanac uses the first playable stage containing each enemy.
const introductions = new Map<string, ReadonlySet<EnemyId>>();
const known = new Set<EnemyId>();
for (const { id, level } of STAGES) {
  if (!level) continue;
  const introduced = new Set<EnemyId>();
  for (const wave of level.waves)
    for (const group of Object.values(wave.groups)) {
      for (const { type } of planFormation(group).arrivals) {
        if (!known.has(type)) introduced.add(type);
        known.add(type);
      }
    }
  if (introduced.has("reed-spider")) {
    for (const spawn of ["spider-egg", "reed-spiderling"] as const) {
      known.add(spawn);
      introduced.add(spawn);
    }
  }
  introductions.set(id, introduced);
}
export function newlyIntroduced(levelId: string): ReadonlySet<EnemyId> {
  return introductions.get(levelId) ?? new Set();
}
