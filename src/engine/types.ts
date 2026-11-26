import type { WeatherPlan } from "../content/weather.ts";
import type { BattlefieldDevice } from "./devices.ts";
import type { Facing, Heading } from "./formation.ts";
import type { Guard, GuardPost } from "./guards.ts";

export type Point = readonly [x: number, y: number];
export type TowerId =
  | "arrow" | "cannon" | "frost" | "ember" | "storm" | "ballista" | "net" | "prism"
  | "hail-mortar" | "glaze-lance" | "salt-caster" | "spore-caster";
export type GuardPostId = "guard-post" | "griffin-roost" | "frost-kennel" | "reed-post";
export type BuildingId = TowerId | GuardPostId;
export type EnemyId =
  | "slime" | "runner" | "guard" | "chief" | "moth" | "wisp" | "ram"
  | "pine-hopper" | "stump-spirit" | "reed-crab" | "ferry-snail" | "weir-frog" | "weir-turtle"
  | "lily-skater" | "magnet-beetle"
  | "cable-overseer" | "slag-colossus"
  | "pine-boar" | "lotus-toad" | "slag-driller" | "frost-mammoth"
  | "frost-bear" | "frost-yeti" | "rime-golem" | "blizzard-elk" | "frost-moose" | "mirror-ibex" | "snowbrush-fox"
  | "lamp-mole" | "slag-cart" | "cinder-bat" | "ice-sail" | "frost-owl"
  | "reed-newt" | "ore-crawler" | "frost-ray" | "frost-hare"
  | "moss-badger" | "mirror-shrimp" | "rivet-mite" | "frost-porcupine"
  | "mire-treant" | "mire-croc" | "vine-viper" | "mire-mycelid" | "bloat-sporer"
  | "mudskipper" | "shield-crayfish" | "lantern-moth" | "whisker-catfish" | "stone-clam"
  | "reed-spider" | "spider-egg" | "reed-spiderling" | "mire-elder" | "sluice-dragon"
  | "mire-matriarch" | "spore-pod";
export type BattlePhase = "ready" | "active" | "won" | "lost";
export type CreatureSound =
  | "ooze" | "scurry" | "bark" | "shell" | "stone" | "wing" | "crystal" | "boss" | "ram" | "moth"
  | "ferry" | "frog" | "weir" | "wisp";

export interface TowerStats {
  readonly cost: number;
  readonly damage: number;
  readonly range: number;
  readonly interval: number;
  readonly splash?: number;
  readonly slow?: number;
  readonly split?: boolean;
  readonly salt?: { readonly armor: number; readonly duration: number };
  readonly spore?: {
    readonly damagePerSecond: number;
    readonly duration: number;
    readonly spread: number;
    readonly jumps: number;
    readonly burst?: { readonly radius: number; readonly damage: number };
  };
  readonly duration?: number;
  readonly chilledDamage?: number;
  readonly color?: string;
  readonly burn?: {
    readonly damagePerSecond: number;
    readonly seconds: number;
  };
  readonly chain?: { readonly jumps: number; readonly range: number };
  readonly armorBonus?: number;
  readonly net?: { readonly seconds: number; readonly cooldown: number; readonly spread?: number };
  readonly focus?: { readonly seconds: number; readonly bonus: number; readonly armor?: number };
}

export interface Specialization extends TowerStats {
  readonly name: string;
  readonly detail: string;
  readonly color: string;
}

export interface TowerSpec {
  readonly name: string;
  readonly role: string;
  readonly sprite: TowerId;
  readonly tracks?: boolean;
  readonly flight: readonly [releaseDelay: number, tilesPerSecond: number];
  readonly color: string;
  readonly tiers: readonly [TowerStats, TowerStats, TowerStats];
  readonly paths: Readonly<Record<string, Specialization>>;
}

interface EnemyCycle {
  readonly cooldown: number;
  readonly initialDelay?: number;
  readonly windup: number;
  readonly active: number;
}

export type EnemyAbility =
  | (EnemyCycle & { readonly kind: "hop" | "dash" | "burrow"; readonly brace: number; readonly boost: number })
  | (EnemyCycle & { readonly kind: "vent"; readonly radius: number; readonly damage: number })
  | (EnemyCycle & { readonly kind: "freeze-towers"; readonly radius: number; readonly targets: number })
  | (EnemyCycle & { readonly kind: "quills"; readonly radius: number; readonly damage: number;
      readonly targets: number; readonly regrowth: number; readonly guardedFactor: number; readonly exposedFactor: number })
  | (EnemyCycle & {
      readonly kind: "rally" | "ward" | "screen";
      readonly radius: number;
      readonly duration: number;
      readonly strength: number;
    })
  | { readonly kind: "shell"; readonly threshold: number }
  | { readonly kind: "glide"; readonly turnBurst?: {
      readonly duration: number; readonly cooldown: number; readonly boost: number; readonly exposedFactor: number;
    } }
  | { readonly kind: "wing-cycle"; readonly cooldown: number; readonly initialDelay?: number;
      readonly opening: number; readonly flight: number;
      readonly damageFactor: number; readonly flightPace: number }
  | { readonly kind: "guard-cycle"; readonly closed: number; readonly cooldown: number; readonly damageFactor: number;
      readonly lightSensitive?: boolean;
      readonly exposedFactor?: number; readonly escortScreen?: { readonly radius: number; readonly duration: number; readonly strength: number } };

export interface EnemySpec {
  readonly name: string;
  readonly hp: number;
  readonly speed: number;
  readonly reward: number;
  readonly leak: number;
  readonly color: string;
  readonly pace: number;
  readonly note: string;
  readonly soundFamily: CreatureSound;
  readonly hpTier?: "base" | "elite";
  readonly boss?: boolean;
  readonly miniboss?: boolean;
  readonly airborne?: boolean;
  readonly armored?: boolean;
  readonly cartStagger?: number;
  readonly armorFactor?: number;
  readonly slowResistance?: number;
  readonly regeneration?: { readonly rate: number; readonly delay: number };
  readonly enrage?: { readonly speedMultiplier: number; readonly slowResistance: number };
  readonly gasBurst?: { readonly radius: number; readonly damage: number; readonly burnDamage: number; readonly burnSeconds: number };
  readonly bloomBurst?: { readonly radius: number; readonly damage: number };
  readonly ability?: EnemyAbility;
}

export interface Entry {
  readonly id: string;
  readonly label: string;
  readonly scenery: "trail" | "arch" | "landing" | "mine";
  readonly delay: number;
  readonly marker: Point;
  readonly route: readonly Point[];
  readonly revealWave?: number;
}

export interface TrackSwitch {
  readonly at: Point;
  readonly upper: readonly Point[];
  readonly lower: readonly Point[];
}

// Mixed lineups repeat from the first member at the start of each batch.
export type SpawnGroup = readonly [
  members: EnemyId | readonly [EnemyId, ...EnemyId[]],
  count: number,
  gap: number,
  batchSize?: number,
];
export interface Wave {
  readonly title: string;
  readonly hp?: number;
  readonly speed?: number;
  readonly groups: Readonly<Record<string, readonly SpawnGroup[]>>;
}

export interface Tutorial {
  readonly plots: readonly number[];
  readonly towers: readonly TowerId[];
  readonly steps: readonly string[];
}

export interface MineTunnel {
  readonly from: Point;
  readonly to: Point;
}

export interface Bridge {
  readonly from: Point;
  readonly to: Point;
  readonly style?: "sluice" | "stones" | "mire-raft";
}
export type BattlefieldLandmarkKind =
  | "cabin" | "ruins" | "reeds" | "floe" | "skiff" | "mine-cart" | "ore-vein" | "mire-keep"
  | "birdhouse" | "campfire" | "fish-trap" | "drift-buoy" | "lily-bell"
  | "rail-lantern" | "hand-pump" | "ice-chime" | "snow-lantern" | "bog-idol" | "glow-pod";

export interface BattlefieldLandmark {
  readonly at: Point;
  readonly kind: BattlefieldLandmarkKind;
}

export interface Level {
  readonly id: string;
  readonly name: string;
  readonly chapter: number;
  readonly description: string;
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  readonly gold: number;
  readonly killRewardScale?: number;
  readonly health: number;
  readonly towers: readonly BuildingId[];
  readonly biome?: "forest" | "river-edge" | "wetland" | "quarry" | "frost" | "rift" | "mire" | "mire-edge";
  readonly towerStyle?: "frost-watch";
  readonly weather?: WeatherPlan;
  readonly devices?: readonly BattlefieldDevice[];
  readonly trackSwitch?: TrackSwitch;
  readonly tunnels?: readonly MineTunnel[];
  readonly wavePrep: number;
  readonly earlyRate: number;
  readonly maxEarlyReward: number;
  readonly maxTowerTier?: Tower["tier"];
  readonly guardPost?: boolean;
  readonly maxGuardTier?: 2 | 3 | 4;
  readonly entries: readonly Entry[];
  readonly plots: readonly Point[];
  readonly pools: readonly Point[];
  readonly waves: readonly Wave[];
  readonly bridges?: readonly Bridge[];
  readonly bridgeDeck?: readonly Point[];
  readonly shallows?: readonly Point[];
  readonly scenery?: readonly BattlefieldLandmark[];
  readonly tutorial?: Tutorial;
}

export interface RouteSegment {
  readonly start: Point;
  readonly dx: number;
  readonly dy: number;
  readonly length: number;
  readonly from: number;
}

export interface Route {
  readonly points: readonly Point[];
  readonly segments: readonly RouteSegment[];
  readonly distance: number;
  readonly tunnels: readonly { readonly from: number; readonly to: number }[];
  at(progress: number, lateral?: number): { x: number; y: number };
}

export type TargetPriority = "first" | "strong" | "weak";

export interface Tower {
  readonly type: TowerId;
  readonly x: number;
  readonly y: number;
  tier: 1 | 2 | 3 | 4;
  path: string | null;
  cooldown: number;
  fired: number;
  heading: Heading;
  launchHeading: Heading;
  nextNetAt?: number;
  focus?: { target: Enemy; since?: number };
  priority?: TargetPriority;
  frost?: { readonly source: Enemy; readonly frozenAt: number; taps: number; lastTap: number };
  /** Battle time of construction and the latest upgrade; presentation only. */
  builtAt?: number;
  upgradedAt?: number;
  previous?: { tier: 1 | 2 | 3 | 4; path: string | null };
}
export type Building = Tower | GuardPost;

export type MeleeStyle = "air-strike" | "bite" | "pounce" | "claw" | "stomp" | "surge" | "quake" | "cleave" | "antler-sweep";

export interface EnemyMelee {
  readonly style: MeleeStyle;
  readonly direction: Point;
  readonly facing: Facing;
  readonly start: number;
  readonly impact: number;
  readonly end: number;
  readonly aim?: Point;
  readonly targetGuard?: Guard;
  hit: boolean;
}

export interface MireCast {
  readonly startedAt: number;
  readonly direction?: Point;
  readonly aim?: Point;
  readonly lanes?: readonly { readonly route: Route; readonly from: number; readonly to: number }[];
  readonly struck?: Set<Guard>;
}

export interface Enemy {
  readonly type: EnemyId;
  readonly route: Route;
  readonly maxHp: number;
  readonly speed: number;
  readonly lateral: number;
  readonly batch: number;
  age: number;
  progress: number;
  x: number;
  y: number;
  hp: number;
  walk: number;
  facing: Facing;
  readonly slows: Map<number, number>;
  flash: number;
  netUntil?: number;
  netImmuneUntil?: number;
  projectileImpact?: { readonly time: number; readonly heavy: boolean };
  escaped?: boolean;
  hurtAgo: number;
  burnLife?: number;
  burnRate?: number;
  action?: { phase: "windup" | "active" | "exposed"; progress: number; impact?: boolean };
  abilityReadyAt?: number;
  triggeredAbilityStartedAt?: number;
  iceTargets?: ReadonlyMap<number, Tower>;
  quillsRegrowAt?: number;
  quillFacing?: Facing;
  haste?: { until: number; strength: number };
  slowWard?: { until: number; strength: number };
  screen?: { until: number; strength: number };
  sunlit?: { until: number; multiplier: number };
  shellBroken?: boolean;
  turnAt?: number;
  turnBurstUntil?: number;
  chargeAnnounced?: boolean;
  staggeredUntil?: number;
  melee?: EnemyMelee;
  nextMeleeAt?: number;
  nextQuakeAt?: number;
  mireCast?: MireCast;
  mireFractured?: boolean;
  mireReadyAt?: number;
  salt?: Map<number, number>;
  spore?: {
    until: number;
    duration: number;
    damagePerSecond: number;
    jumps: number;
    spread: number;
    burst?: { readonly radius: number; readonly damage: number };
  };
  carriedBy?: Enemy;
  passenger?: Enemy;
  egg?: Enemy;
}

interface Location {
  readonly x: number;
  readonly y: number;
  readonly color: string;
}

interface ProjectileFlight extends Location {
  tx: number;
  ty: number;
  readonly target: Enemy;
  lostInTunnel?: boolean;
  volleyHits?: Set<Enemy>;
  age: number;
  readonly releaseDelay: number;
  readonly duration: number;
}

export type Projectile = ProjectileFlight & (
  | { readonly kind: TowerId | "net-capture"; readonly path: string | null; readonly heading: Heading; readonly stats: TowerStats }
  | { readonly kind: "guard-spear"; readonly damage: number }
);

export type ChainPoint = readonly [x: number, y: number, airborne: boolean];

export interface Effect extends Location {
  readonly kind: TowerId | "net-capture" | "gate" | "build" | "breach" | "pop"
    | "enemy-rally" | "enemy-ward" | "enemy-dust" | "enemy-needles" | "enemy-splash" | "shell-break"
    | "enemy-windup" | "enemy-expose" | "enemy-step" | "enemy-burrow-in" | "enemy-burrow-out"
    | "guard-hit" | "guard-strike" | "guard-spear" | "weir-surge" | "mammoth-quake" | "rail-impact" | "chief-cleave"
    | "enemy-vent" | "enemy-vent-stop" | "enemy-quill-launch" | "enemy-quill-impact" | "mire-blast"
    | "antler-sweep" | "tower-freeze" | "tower-crack" | "tower-thaw"
    | "mire-tide-warning" | "mire-tide" | "mire-tide-break" | "mire-drag" | "mire-shell-warning" | "mire-shell" | "mire-hatch" | "mire-brace" | "mire-summon"
    | "mire-bloom" | "mire-bloom-burst"
    | "burn-ignite" | "spore-burst" | "spore-spread";
  readonly path?: string | null;
  readonly enemy?: EnemyId;
  readonly post?: GuardPostId;
  readonly airborne?: boolean;
  readonly melee?: MeleeStyle;
  readonly direction?: Point;
  readonly fallen?: Enemy;
  readonly radius?: number;
  readonly pathPoints?: readonly Point[];
  readonly arcs?: readonly (readonly [ChainPoint, ChainPoint])[];
  life: number;
  readonly total: number;
}
