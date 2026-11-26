import { ENEMIES } from "../content/enemies.ts";
import type { EnemyId, Point, SpawnGroup } from "./types.ts";

const SQUAD_SIZE: Record<EnemyId, number> = {
  slime: 4,
  runner: 3,
  "pine-hopper": 3,
  "stump-spirit": 2,
  "reed-crab": 3,
  "ferry-snail": 2,
  "weir-frog": 3,
  "weir-turtle": 1,
  "lily-skater": 4,
  "lamp-mole": 3,
  "slag-cart": 2,
  "cinder-bat": 3,
  "magnet-beetle": 2,
  "cable-overseer": 1,
  "slag-colossus": 1,
  "pine-boar": 1,
  "lotus-toad": 1,
  "slag-driller": 1,
  "frost-mammoth": 1,
  "frost-bear": 2,
  "frost-yeti": 1,
  "rime-golem": 2,
  "blizzard-elk": 1,
  "frost-moose": 1,
  "mirror-ibex": 2,
  "snowbrush-fox": 3,
  "ice-sail": 3,
  "frost-owl": 2,
  "moss-badger": 2,
  "mirror-shrimp": 2,
  "rivet-mite": 2,
  "frost-porcupine": 2,
  "reed-newt": 4,
  "ore-crawler": 3,
  "frost-ray": 3,
  "frost-hare": 3,
  guard: 3,
  chief: 1,
  moth: 3,
  wisp: 3,
  ram: 2,
  "mire-treant": 3,
  "mire-croc": 2,
  "vine-viper": 2,
  "mire-mycelid": 2,
  "bloat-sporer": 2,
  mudskipper: 3,
  "shield-crayfish": 2,
  "lantern-moth": 2,
  "whisker-catfish": 2,
  "stone-clam": 1,
  "reed-spider": 1,
  "spider-egg": 1,
  "reed-spiderling": 2,
  "mire-elder": 1,
  "mire-matriarch": 1,
  "spore-pod": 1,
  "sluice-dragon": 1,
};
const MARCH_OFFSETS = [-0.4, 0.4, -0.18, 0.18] as const;

export interface Arrival {
  readonly type: EnemyId;
  readonly batch: number;
  readonly at: number;
  readonly lateral: number;
}

export function planFormation(groups: readonly SpawnGroup[]) {
  const arrivals: Arrival[] = [];
  let at = 0,
    batch = 0;
  for (const [members, count, interval, capacity] of groups) {
    const lineup = typeof members === "string" ? [members] : members;
    const squadSize = Math.max(lineup.length, Math.floor(capacity ?? SQUAD_SIZE[lineup[0]]));
    for (let i = 0; i < count; i++) {
      const slot = i % squadSize;
      if (slot === 0) {
        if (batch > 0) at += 1.35;
        batch++;
      }
      const type = lineup[slot % lineup.length];
      const { boss, miniboss } = ENEMIES[type];
      const lateral =
        boss || miniboss
          ? 0
          : MARCH_OFFSETS[arrivals.length % MARCH_OFFSETS.length];
      arrivals.push({ type, batch, at, lateral });
      at += Math.max(0.43, interval);
    }
  }
  return { arrivals, batches: batch };
}

export type Facing = "east" | "south" | "west" | "north";
export type Heading = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function facingFor(dx: number, dy: number): Facing {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "east" : "west";
  return dy >= 0 ? "south" : "north";
}

export function headingFor(dx: number, dy: number): Heading {
  return ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8) as Heading;
}

export function headingVector(heading: Heading): Point {
  const angle = heading * (Math.PI / 4);
  return [Math.cos(angle), Math.sin(angle)];
}
