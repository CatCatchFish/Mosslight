import type { Level } from "../engine/types.ts";
import type { Rating } from "../platform/save.ts";

export function rateBattle(level: Level, remainingHealth: number): Rating {
  return remainingHealth >= Math.ceil(level.health * 0.8)
    ? 3
    : remainingHealth >= Math.ceil(level.health * 0.5)
      ? 2
      : 1;
}

export function starsText(stars: number) {
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}
