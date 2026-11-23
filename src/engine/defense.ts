import { facingFor, headingFor, planFormation } from "./formation.ts";
import type { Arrival } from "./formation.ts";
import { ENEMIES } from "../content/enemies.ts";
import { battleLoadout, TOWERS } from "../content/towers.ts";
import { createRoute, dist2, isInTunnel, key, lowerTrackPoints } from "./route.ts";
import { applySlow, blockHeavyHit, canNet, groundWithNet, enemyPace, enemyTurned, exposedDamageFactor, interruptVent, isAirborne, isBurrowing, isStaggered, spendScreen, staggerEnemy, updateEnemyActions } from "./enemy-abilities.ts";
import { beaconTargets, boomHolds, DEVICES, devicePace, deviceSweepHits } from "./devices.ts";
import type { DeviceState } from "./devices.ts";
import { canReceiveQuill, createGuardPost, guardPathfinder, guardRallyPoints, guardStats, guardUnitStats, GUARD_BRANCHES, GUARD_BUILDINGS, GUARD_MASTERIES, isFlyingGuardPost, isGuardPost, isGuardPostId, matureGriffins, moveGuardRally, reinforceGuardPost, releaseGuard, SPEAR_THROW, updateGuards } from "./guards.ts";
import type { Guard, GuardBranch, GuardPost, GuardQuill } from "./guards.ts";
import { applySalt, dropMirePassenger, MIRE_SKILL_ENEMIES, mireAdvance, mireArmor, mireDamageFactor,
  raiseMudShield, stepMireSkills, syncMirePassenger } from "./mire-rules.ts";
import type {
  BattlePhase,
  Building,
  BuildingId,
  ChainPoint,
  Entry,
  Effect,
  Enemy,
  EnemyId,
  GuardPostId,
  Level,
  Projectile,
  Point,
  Route,
  SpawnGroup,
  TargetPriority,
  Tower,
  TowerStats,
  TowerId,
} from "./types.ts";

export const TOWER_RESALE_PERCENT = 60;
export const FROST_THAW_TAPS = 4;
const FROST_TAP_GAP = 1.35;
export const TRACK_SWITCH_REACH = 4;
export const TRACK_SWITCH_RETURN = 4;

export function supportsTargetPriority(tower: Pick<Tower, "type" | "path">) {
  return tower.type === "ballista" || tower.type === "prism" || tower.type === "cannon" ||
    tower.type === "hail-mortar" || tower.type === "glaze-lance" || tower.type === "salt-caster" ||
    (tower.type === "arrow" && tower.path === "sniper");
}

const PRIORITY_CYCLE: readonly TargetPriority[] = ["first", "strong", "weak"];

export function towerStats(tower: Tower): TowerStats {
  const spec = TOWERS[tower.type];
  return tower.path
    ? spec.paths[tower.path]
    : spec.tiers[Math.min(tower.tier - 1, spec.tiers.length - 1)];
}

interface PendingEntry {
  at: number;
  groups: readonly SpawnGroup[];
  hp: number;
  speed: number;
}
interface Deployment {
  route: Route;
  hp: number;
  speed: number;
  batches: number;
  arrivals: Arrival[];
  sent: number;
  nextAt: number;
}

export class DefenseGame {
  readonly level: Level;
  readonly loadout: readonly BuildingId[];
  readonly routes: Readonly<Record<string, Route>>;
  readonly allRoutes: readonly Route[];
  private readonly lowerRoutes = new Map<string, Route>();
  private readonly shallows: ReadonlySet<string>;
  private useAlternateTrack = false;
  private trackDispatchAt?: number;
  private switchCrew?: { post: GuardPost; guard: Guard };
  gold = 0;
  health = 0;
  kills = 0;
  weatherTowerRate = 1;
  coreHit = -Infinity;
  breachingBoss: EnemyId | null = null;
  wave = 0;
  waveStartedAt = 0;
  time = 0;
  paused = false;
  towers = new Map<number, Tower>();
  readonly guardPosts = new Map<number, GuardPost>();
  readonly devices: readonly DeviceState[];
  enemies: Enemy[] = [];
  encountered = new Set<EnemyId>();
  effects: Effect[] = [];
  projectiles: Projectile[] = [];
  readonly guardQuills: GuardQuill[] = [];
  private deployments = new Map<string, Deployment>();
  private readonly guardPaths = new Map<GuardPostId, ReturnType<typeof guardPathfinder>>();
  private readonly griffinCanLand?: (point: Point) => boolean;
  private readonly rallyPoints = new Map<string, readonly Point[]>();
  revision = 0;
  phase: BattlePhase = "ready";
  pending = new Map<string, PendingEntry>();

  constructor(level: Level, selection?: readonly BuildingId[]) {
    this.level = level;
    this.shallows = new Set(level.shallows?.map(point => key(...point)));
    this.loadout = battleLoadout(level, selection);
    this.devices = (level.devices ?? []).map((spec) => ({ spec, usedAt: -Infinity, struck: new Set() }));
    this.routes = Object.fromEntries(
      level.entries.map((entry) => [entry.id, createRoute(entry.route, level.tunnels)]),
    );
    if (level.trackSwitch) {
      for (const entry of level.entries) {
        const lower = lowerTrackPoints(entry.route, level.trackSwitch);
        if (lower) this.lowerRoutes.set(entry.id, createRoute(lower, level.tunnels));
      }
    }
    this.allRoutes = [...level.entries.map(({ id }) => this.routes[id]), ...this.lowerRoutes.values()];
    for (const type of this.loadout) {
      if (isGuardPostId(type)) this.guardPaths.set(type, guardPathfinder(level, isFlyingGuardPost(type)));
    }
    if ([...this.guardPaths.keys()].some(isFlyingGuardPost)) {
      const ground = this.guardPaths.get("guard-post") ?? guardPathfinder(level);
      this.griffinCanLand = (point) => ground(point, point) !== null;
    }
    this.reset();
  }
  reset() {
    this.gold = this.level.gold;
    this.health = this.level.health;
    this.kills = 0;
    this.coreHit = -Infinity;
    this.breachingBoss = null;
    this.wave = 0;
    this.waveStartedAt = 0;
    this.time = 0;
    this.paused = false;
    this.towers = new Map();
    this.guardPosts.clear();
    this.useAlternateTrack = false;
    this.switchCrew = undefined;
    for (const device of this.devices) {
      device.usedAt = -Infinity;
      device.struck.clear();
    }
    this.enemies = [];
    this.encountered = new Set();
    this.effects = [];
    this.projectiles = [];
    this.guardQuills.length = 0;
    this.deployments.clear();
    this.revision++;
    this.prepare();
  }
  private prepare() {
    this.returnSwitchGuard();
    this.trackDispatchAt = undefined;
    this.phase = "ready";
    this.deployments.clear();
    const delay = this.wave ? this.level.wavePrep : Infinity;
    const next = this.level.waves[this.wave];
    this.pending = new Map(
      this.level.entries
        .filter((entry) => next.groups[entry.id]?.length)
        .map((entry) => [
          entry.id,
          {
            at: this.time + delay + entry.delay,
            groups: next.groups[entry.id],
            hp: next.hp ?? 1,
            speed: next.speed ?? 1,
          },
        ]),
    );
  }
  get awaitingFirstWave() {
    return this.phase === "ready" && this.wave === 0;
  }

  startFirstWave() {
    if (!this.awaitingFirstWave || this.tutorialHold || this.paused)
      return false;
    for (const entrance of this.level.entries) {
      const pending = this.pending.get(entrance.id);
      if (pending) this.activateEntry(entrance.id, pending, entrance.delay);
    }
    return true;
  }

  get tutorialHold() {
    return (
      Boolean(this.level.tutorial) &&
      this.phase === "ready" &&
      this.wave === 0 &&
      !this.towers.size
    );
  }
  get ended() {
    return this.phase === "won" || this.phase === "lost";
  }
  entryVisible(entry: Entry) {
    return (entry.revealWave ?? 1) <= this.waveIndex + 1;
  }

  get track() { return this.useAlternateTrack ? "lower" : "upper"; }
  get switchPost() { return this.switchCrew?.post; }
  get trackLocked() { return this.trackDispatchAt !== undefined; }
  get trackPending() {
    for (const id of this.lowerRoutes.keys()) if (this.pending.has(id)) return true;
    return false;
  }

  trackRoute(entryId: string) {
    return (this.useAlternateTrack ? this.lowerRoutes.get(entryId) : undefined) ?? this.routes[entryId];
  }

  isNearTrackSwitch(point: Point) {
    const trackSwitch = this.level.trackSwitch;
    return Boolean(trackSwitch && dist2(...point, ...trackSwitch.at) <= TRACK_SWITCH_REACH ** 2);
  }

  switchCandidate() {
    const trackSwitch = this.level.trackSwitch;
    if (!trackSwitch || !this.trackPending || this.trackLocked || this.ended || this.paused || this.switchCrew) return;
    const posts = [...this.guardPosts.values()].filter(({ type, origin }) => type === "guard-post" && this.isNearTrackSwitch(origin));
    posts.sort((a, b) => dist2(...a.origin, ...trackSwitch.at) - dist2(...b.origin, ...trackSwitch.at) || a.index - b.index);
    for (const post of posts) {
      const guard = post.guards.find((member) => member.hp > 0 && !member.target);
      if (!guard) continue;
      const path = post.findPath([guard.x, guard.y], trackSwitch.at);
      if (path) return { post, guard, path };
    }
  }

  switchTrack() {
    const crew = this.switchCandidate();
    if (!crew) return false;
    const { guard, post, path } = crew;
    releaseGuard(guard);
    guard.attack = undefined;
    guard.switchDuty = true;
    guard.path = path;
    this.switchCrew = { guard, post };
    this.useAlternateTrack = !this.useAlternateTrack;
    this.revision++;
    return true;
  }

  private returnSwitchGuard() {
    if (!this.switchCrew) return;
    const { post, guard } = this.switchCrew;
    this.switchCrew = undefined;
    guard.switchDuty = undefined;
    guard.path = post.findPath([guard.x, guard.y], post.rally) ?? [];
    this.revision++;
  }

  deviceReady(index: number) {
    return !this.paused && this.phase === "active" && this.deviceCooldown(index) === 0;
  }

  deviceCooldown(index: number) {
    const device = this.devices[index];
    if (!device) return Infinity;
    const spec = device.spec;
    let usedAt = device.usedAt;
    if (spec.cooldownGroup) {
      for (const other of this.devices)
        if (other.spec.kind === spec.kind && other.spec.cooldownGroup === spec.cooldownGroup)
          usedAt = Math.max(usedAt, other.usedAt);
    }
    return Math.max(0, DEVICES[spec.kind].cooldown - (this.time - usedAt));
  }

  activateDevice(index: number) {
    if (!this.deviceReady(index)) return false;
    const device = this.devices[index];
    device.usedAt = this.time;
    device.struck.clear();
    const { spec } = device;
    if (spec.kind === "sun-mirror") {
      const { radius, exposure, multiplier } = DEVICES[spec.kind];
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || enemy.escaped || isInTunnel(enemy) || isBurrowing(enemy) ||
            dist2(enemy.x, enemy.y, ...spec.center) > radius ** 2) continue;
        enemy.sunlit = { until: enemy.age + exposure, multiplier };
      }
    }
    this.revision++;
    return true;
  }
  get hasBuildings() {
    return this.towers.size > 0 || this.guardPosts.size > 0;
  }
  buildingAt(index: number): Building | undefined {
    return this.guardPosts.get(index) ?? this.towers.get(index);
  }
  buildOptions(index: number): readonly BuildingId[] {
    if (this.ended || !this.level.plots[index] || this.buildingAt(index)) return [];
    return this.loadout.filter((type) => !isGuardPostId(type) || this.guardPoints(index, type).length > 0);
  }
  get waveIndex() {
    return this.phase === "ready" ? this.wave : Math.max(0, this.wave - 1);
  }
  seconds(id: string) {
    const entry = this.pending.get(id);
    return entry && Number.isFinite(entry.at)
      ? Math.max(0, Math.ceil(entry.at - this.time - 1e-7))
      : 0;
  }
  reward(id: string) {
    return Math.min(
      this.level.maxEarlyReward,
      Math.ceil(this.seconds(id) / this.level.earlyRate),
    );
  }
  release(id: string, early = false) {
    const entry = this.pending.get(id);
    if (
      !entry ||
      this.ended ||
      this.awaitingFirstWave ||
      (early && this.paused)
    )
      return false;
    const bonus = early ? this.reward(id) : 0;
    this.gold += bonus;
    this.activateEntry(id, entry, 0);
    return { bonus };
  }

  private activateEntry(id: string, entry: PendingEntry, delay: number) {
    this.pending.delete(id);
    if (this.lowerRoutes.has(id)) this.trackDispatchAt ??= this.time + delay;
    if (this.phase === "ready") {
      this.phase = "active";
      this.wave++;
      this.waveStartedAt = this.time;
    }
    this.deployments.set(id, {
      ...planFormation(entry.groups),
      route: this.trackRoute(id),
      hp: entry.hp,
      speed: entry.speed,
      sent: 0,
      nextAt: this.time + delay + 0.25,
    });
    this.revision++;
  }
  build(index: number, type: BuildingId) {
    const plot = this.level.plots[index];
    if (!plot || this.ended || this.buildingAt(index) || !this.loadout.includes(type)) return false;
    if (isGuardPostId(type)) {
      const { base, color } = GUARD_BUILDINGS[type];
      const findPath = this.guardPaths.get(type);
      if (!findPath || this.gold < base.cost) return false;
      const [rally] = this.guardPoints(index, type);
      if (!rally) return false;
      this.guardPosts.set(index, createGuardPost(index, plot, rally, findPath, type,
        isFlyingGuardPost(type) ? this.griffinCanLand : undefined, this.time));
      this.completeConstruction(plot, base.cost, color);
      return true;
    }
    const spec = TOWERS[type];
    const stats = spec.tiers[0];
    if (this.gold < stats.cost) return false;
    const [x, y] = plot;
    this.towers.set(index, {
      type,
      x,
      y,
      tier: 1,
      path: null,
      cooldown: 0,
      fired: -Infinity,
      heading: 6,
      launchHeading: 6,
      builtAt: this.time,
    });
    this.completeConstruction(plot, stats.cost, spec.color);
    return true;
  }
  private completeConstruction([x, y]: Point, cost: number, color: string) {
    this.gold -= cost;
    this.effects.push({ kind: "build", x, y, color, life: 0.4, total: 0.4 });
    this.revision++;
  }
  guardPoints(index: number, type: GuardPostId = "guard-post") {
    const post = this.guardPosts.get(index);
    const origin = post?.origin ?? this.level.plots[index];
    return origin ? this.guardPointsAt(post?.type ?? type, origin, post ? guardStats(post).reach : GUARD_BUILDINGS[type].base.reach) : [];
  }
  private guardPointsAt(type: GuardPostId, origin: Point, radius: number) {
    const findPath = this.guardPaths.get(type);
    if (!findPath) return [];
    const site = `${type}/${origin[0]},${origin[1]}/${radius}`;
    const cached = this.rallyPoints.get(site);
    if (cached) return cached;
    const points = guardRallyPoints(origin, this.allRoutes, findPath, radius);
    this.rallyPoints.set(site, points);
    return points;
  }
  get maxGuardTier() {
    return this.level.maxGuardTier ?? 2;
  }
  private upgradeGuardPost(post: GuardPost, branch?: GuardBranch) {
    if (post.tier >= this.maxGuardTier) return false;
    const spec = GUARD_BUILDINGS[post.type];
    const next = post.tier === 1 && !branch ? spec.upgrade
      : post.tier === 2 && branch && spec.branches.includes(branch) ? GUARD_BRANCHES[branch]
      : post.tier === 3 && post.branch && !branch ? GUARD_MASTERIES[post.branch] : null;
    if (!next || this.gold < next.cost) return false;
    reinforceGuardPost(post, this.time, branch, this.wave);
    this.completeConstruction(post.origin, next.cost, spec.color);
    return true;
  }
  setGuardRally(index: number, point: Point) {
    const post = this.guardPosts.get(index);
    if (!post || this.ended) return false;
    const rally = this.guardPoints(post.index).find(([x, y]) => x === point[0] && y === point[1]);
    if (!rally) return false;
    if (post.rally[0] !== rally[0] || post.rally[1] !== rally[1]) {
      moveGuardRally(post, rally);
      this.revision++;
    }
    return true;
  }
  towerSaleValue(index: number) {
    if (this.ended) return null;
    const post = this.guardPosts.get(index);
    if (post) {
      const { base, upgrade } = GUARD_BUILDINGS[post.type];
      const cost = base.cost + (post.tier >= 2 ? upgrade.cost : 0)
        + (post.branch ? GUARD_BRANCHES[post.branch].cost + (post.tier === 4 ? GUARD_MASTERIES[post.branch].cost : 0) : 0);
      return Math.floor(cost * TOWER_RESALE_PERCENT / 100);
    }
    const tower = this.towers.get(index);
    if (!tower || tower.frost) return null;
    const spec = TOWERS[tower.type];
    const investment = spec.tiers.slice(0, tower.tier).reduce((sum, tier) => sum + tier.cost, 0)
      + (tower.path ? spec.paths[tower.path].cost : 0);
    return Math.floor((investment * TOWER_RESALE_PERCENT) / 100);
  }
  sell(index: number) {
    const building = this.buildingAt(index);
    if (!building || building === this.switchPost) return null;
    const proceeds = this.towerSaleValue(index);
    if (proceeds === null) return null;
    if (isGuardPost(building)) {
      for (const guard of building.guards) releaseGuard(guard);
      this.guardPosts.delete(index);
    } else {
      this.towers.delete(index);
      this.projectiles = this.projectiles.filter((shot) =>
        shot.age >= shot.releaseDelay || shot.x !== building.x || shot.y !== building.y);
    }
    this.gold += proceeds;
    this.revision++;
    return proceeds;
  }
  get maxTowerTier() {
    return this.level.maxTowerTier ?? 4;
  }
  upgrade(index: number, path?: string) {
    const tower = this.buildingAt(index);
    if (!tower || this.ended) return false;
    if (isGuardPost(tower)) {
      if (path !== undefined && !Object.hasOwn(GUARD_BRANCHES, path)) return false;
      return this.upgradeGuardPost(tower, path as GuardBranch | undefined);
    }
    if (tower.frost || tower.tier >= this.maxTowerTier) return false;
    const spec = TOWERS[tower.type];
    const next = tower.tier === 1 || tower.tier === 2
      ? path === undefined ? spec.tiers[tower.tier] : undefined
      : path && Object.hasOwn(spec.paths, path) ? spec.paths[path] : undefined;
    if (!next || this.gold < next.cost) return false;
    tower.previous = { tier: tower.tier, path: tower.path };
    tower.upgradedAt = this.time;
    tower.tier = tower.tier === 1 ? 2 : tower.tier === 2 ? 3 : 4;
    tower.path = path ?? null;
    this.completeConstruction([tower.x, tower.y], next.cost, next.color ?? spec.color);
    return true;
  }

  thawTower(index: number) {
    const tower = this.towers.get(index);
    if (!tower?.frost || this.paused || this.ended) return false;
    tower.frost.taps++;
    tower.frost.lastTap = this.time;
    if (tower.frost.taps >= FROST_THAW_TAPS) this.breakTowerIce(tower);
    else this.effects.push({ kind: "tower-crack", x: tower.x, y: tower.y, color: "#cdf4ff", life: .34, total: .34 });
    this.revision++;
    return true;
  }

  private breakTowerIce(tower: Tower) {
    tower.frost = undefined;
    this.effects.push({ kind: "tower-thaw", x: tower.x, y: tower.y, color: "#d8f8ff", life: .62, total: .62 });
  }

  private stepTowerFreeze() {
    let changed = false;
    for (const enemy of this.enemies) {
      const ability = ENEMIES[enemy.type].ability;
      if (ability?.kind !== "freeze-towers" || enemy.hp <= 0 || enemy.escaped || isStaggered(enemy)) continue;
      if (!enemy.iceTargets) {
        if (enemy.age < (enemy.abilityReadyAt ?? ability.initialDelay ?? ability.cooldown) ||
            (enemy.melee && this.time < enemy.melee.end) || isInTunnel(enemy)) continue;
        const towers = [...this.towers];
        const slots = ability.targets - towers.filter(([, tower]) => tower.frost).length;
        if (slots <= 0) continue;
        const targets = towers.filter(([, tower]) => !tower.frost &&
          dist2(tower.x, tower.y, enemy.x, enemy.y) <= ability.radius ** 2)
          .sort(([, a], [, b]) => dist2(a.x, a.y, enemy.x, enemy.y) - dist2(b.x, b.y, enemy.x, enemy.y))
          .slice(0, slots);
        if (!targets.length) continue;
        enemy.iceTargets = new Map(targets);
        enemy.triggeredAbilityStartedAt = enemy.age;
        this.effects.push({ kind: "enemy-windup", enemy: enemy.type, x: enemy.x, y: enemy.y,
          color: "#9beaff", life: .53, total: .53 });
      }
      const elapsed = enemy.age - (enemy.triggeredAbilityStartedAt ?? enemy.age);
      if (elapsed < ability.windup) {
        enemy.action = { phase: "windup", progress: elapsed / ability.windup };
      } else if (elapsed < ability.windup + ability.active) {
        if (enemy.action?.phase !== "active") {
          let frozeAny = false;
          for (const [plot, tower] of enemy.iceTargets) {
            if (this.towers.get(plot) !== tower || tower.frost) continue;
            tower.frost = { source: enemy, frozenAt: this.time, taps: 0, lastTap: -Infinity };
            tower.focus = undefined;
            this.projectiles = this.projectiles.filter((shot) => shot.age >= shot.releaseDelay ||
              shot.kind === "guard-spear" || shot.x !== tower.x || shot.y !== tower.y);
            this.effects.push({ kind: "tower-freeze", x: tower.x, y: tower.y, color: "#9ee9ff", life: .56, total: .56 });
            frozeAny = true;
            changed = true;
          }
          if (frozeAny) {
            this.effects.push({
              kind: "tower-freeze",
              enemy: enemy.type,
              x: enemy.x,
              y: enemy.y,
              color: "#a8f3ff",
              radius: ability.radius,
              life: .68,
              total: .68,
            });
          }
        }
        enemy.action = { phase: "active", progress: (elapsed - ability.windup) / ability.active };
      } else {
        enemy.action = undefined;
        enemy.iceTargets = undefined;
        enemy.triggeredAbilityStartedAt = undefined;
        enemy.abilityReadyAt = enemy.age + ability.cooldown;
      }
    }
    return changed;
  }
  cycleTowerPriority(index: number): TargetPriority | null {
    const building = this.buildingAt(index);
    if (!building || isGuardPost(building) || this.ended || !supportsTargetPriority(building)) return null;
    const current = building.priority ?? "first";
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length];
    return this.setTowerPriority(index, next);
  }
  setTowerPriority(index: number, priority: TargetPriority): TargetPriority | null {
    const building = this.buildingAt(index);
    if (!building || isGuardPost(building) || this.ended || !supportsTargetPriority(building)) return null;
    if ((building.priority ?? "first") === priority) return priority;
    building.priority = priority;
    building.focus = undefined;
    this.revision++;
    return priority;
  }
  private fire(tower: Tower, target: Enemy, stats: TowerStats, capture = false, volleyHits?: Set<Enemy>) {
    const spec = TOWERS[tower.type];
    const [releaseDelay, tilesPerSecond] = capture ? [.12, 28] : spec.flight;
    const distance = Math.hypot(tower.x - target.x, tower.y - target.y);
    this.projectiles.push({
      kind: capture ? "net-capture" : spec.sprite,
      path: tower.path,
      x: tower.x,
      y: tower.y,
      tx: target.x,
      ty: target.y,
      heading: tower.heading,
      target,
      volleyHits,
      stats,
      age: 0,
      releaseDelay,
      duration: releaseDelay + distance / tilesPerSecond,
      color: stats.color ?? spec.color,
    });
    if (capture) {
      tower.nextNetAt = this.time + stats.net!.cooldown;
      return;
    }
    tower.fired = this.time;
    tower.launchHeading = tower.heading;
    tower.cooldown = stats.interval / Math.max(.35, this.weatherTowerRate);
  }
  private damage(enemy: Enemy, stats: Omit<TowerStats, "cost" | "range" | "interval">, strength = 1, projectile?: Projectile["kind"], source?: Point) {
    const spec = ENEMIES[enemy.type];
    const armor = spec.armored ? (stats.armorBonus ?? 1) : 1;
    const damage =
      stats.damage *
      strength *
      armor *
      (enemy.slows.size ? (stats.chilledDamage ?? 1) : 1);
    if (blockHeavyHit(enemy, damage, this.effects)) return;
    enemy.hp -= damage * mireArmor(enemy) * mireDamageFactor(enemy, source && !stats.splash ? source : undefined) *
      exposedDamageFactor(enemy) * spendScreen(enemy, this.effects);
    if (source && enemy.type === "shield-crayfish" && enemy.hp > 0 && !enemy.mireCast) {
      let nearest = source;
      for (const shot of this.projectiles) {
        if (shot.target !== enemy || shot.kind === "guard-spear" || shot.kind === "net-capture" || shot.lostInTunnel) continue;
        if (dist2(enemy.x, enemy.y, shot.x, shot.y) < dist2(enemy.x, enemy.y, ...nearest))
          nearest = [shot.x, shot.y];
      }
      raiseMudShield(enemy, nearest);
    }
    if (stats.salt) applySalt(enemy, stats.salt);
    enemy.hurtAgo = 0;
    const freshBurn = stats.burn && (enemy.burnLife ?? 0) <= 0;
    if (stats.burn && (enemy.burnRate ?? 0) <= stats.burn.damagePerSecond) {
      enemy.burnLife = Math.max(enemy.burnLife ?? 0, stats.burn.seconds);
      enemy.burnRate = stats.burn.damagePerSecond;
    }
    if (freshBurn) this.effects.push({
      kind: "burn-ignite", enemy: enemy.type, x: enemy.x, y: enemy.y,
      color: stats.color ?? "#ff9b59", life: .3, total: .3,
    });
    enemy.flash = 0.12;
    if (projectile) enemy.projectileImpact = {
      time: this.time,
      heavy: projectile === "cannon" || projectile === "salt-caster" || projectile === "ballista" || projectile === "storm" ||
        (enemy.projectileImpact?.time === this.time && enemy.projectileImpact.heavy),
    };
    if (stats.slow && stats.duration) {
      applySlow(enemy, stats.slow, stats.duration);
      interruptVent(enemy, this.effects);
    }
  }
  private applyChain(origin: Enemy, stats: TowerStats, kind: TowerId) {
    if (!stats.chain) return [];
    const seen = new Set([origin]);
    const arcs: [ChainPoint, ChainPoint][] = [];
    let source = origin;
    for (let jump = 0; jump < stats.chain.jumps; jump++) {
      let closest: Enemy | null = null;
      let distance = stats.chain.range ** 2;
      for (const next of this.enemies) {
        if (seen.has(next) || next.hp <= 0 || next.escaped || isInTunnel(next)) continue;
        const d = dist2(source.x, source.y, next.x, next.y);
        if (d <= distance) {
          closest = next;
          distance = d;
        }
      }
      if (!closest) break;
      arcs.push([
        [source.x, source.y, isAirborne(source)],
        [closest.x, closest.y, isAirborne(closest)],
      ]);
      this.damage(closest, stats, Math.pow(0.78, jump + 1), kind, [source.x, source.y]);
      seen.add(closest);
      source = closest;
    }
    return arcs;
  }
  private advanceProjectiles(dt: number) {
    this.projectiles = this.projectiles.filter((shot) => {
      const { target } = shot;
      if (isInTunnel(target)) shot.lostInTunnel = true;
      const available = !shot.lostInTunnel && !target.escaped && target.hp > 0;
      if (available) {
        shot.tx = target.x;
        shot.ty = target.y;
      }
      shot.age += dt;
      if (shot.age < shot.duration) return true;
      if (shot.kind === "guard-spear") {
        if (available) {
          this.damage(target, { damage: shot.damage }, 1, shot.kind);
          this.effects.push({ kind: shot.kind, enemy: target.type, x: shot.tx, y: shot.ty,
            airborne: isAirborne(target),
            direction: [shot.tx - shot.x, shot.ty - shot.y],
            color: shot.color, life: 0.18, total: 0.18 });
        }
        return false;
      }
      const { stats } = shot;
      const airborneAtImpact = isAirborne(target);
      if (shot.kind === "net-capture") {
        const net = stats.net;
        if (available && net) {
          groundWithNet(target, net.seconds);
          if (target.type === "lantern-moth") dropMirePassenger(target);
          if (net.spread) {
            const radiusSquared = net.spread ** 2;
            const nearby = this.enemies.filter((enemy) => enemy !== target && enemy.hp > 0 && !enemy.escaped &&
              !isInTunnel(enemy) && canNet(enemy) && dist2(enemy.x, enemy.y, shot.tx, shot.ty) <= radiusSquared);
            nearby.sort((a, b) => dist2(a.x, a.y, shot.tx, shot.ty) - dist2(b.x, b.y, shot.tx, shot.ty));
            for (const enemy of nearby.slice(0, 2)) {
              groundWithNet(enemy, net.seconds);
              if (enemy.type === "lantern-moth") dropMirePassenger(enemy);
            }
          }
        }
        this.effects.push({
          kind: shot.kind, x: shot.tx, y: shot.ty, airborne: airborneAtImpact,
          color: shot.color, life: .24, total: .24,
        });
        return false;
      }
      const impact = (enemy: Enemy) => {
        if (shot.volleyHits?.has(enemy) || (stats.groundOnly && isAirborne(enemy))) return;
        shot.volleyHits?.add(enemy);
        this.damage(enemy, stats, 1, shot.kind, [shot.x, shot.y]);
      };
      if (available) impact(target);
      const arcs = available && stats.chain ? this.applyChain(target, stats, shot.kind) : undefined;
      if (stats.splash) {
        for (const enemy of this.enemies) {
          if (
            enemy !== target &&
            enemy.hp > 0 &&
            !enemy.escaped &&
            !isInTunnel(enemy) &&
            dist2(enemy.x, enemy.y, shot.tx, shot.ty) <= stats.splash ** 2
          )
            impact(enemy);
        }
      }
      const total =
        shot.kind === "cannon" || shot.kind === "salt-caster" ? 0.46 : shot.kind === "frost" ? 0.4 : 0.18;
      this.effects.push({
        kind: shot.kind,
        path: shot.path,
        x: shot.tx,
        y: shot.ty,
        enemy: target.type,
        airborne: airborneAtImpact,
        direction: [shot.tx - shot.x, shot.ty - shot.y],
        color: shot.color,
        radius: stats.splash,
        arcs,
        life: total,
        total,
      });
      return false;
    });
  }
  deployment(id: string) {
    const group = this.deployments.get(id);
    if (!group) return null;
    return {
      batch: group.sent ? group.arrivals[group.sent - 1].batch : 0,
      batches: group.batches,
      remaining: group.arrivals.length - group.sent,
    };
  }

  private placeEnemy(type: EnemyId, route: Route, batch: number, lateral: number,
    progress: number, healthFactor = 1, speedFactor = 1) {
    const spec = ENEMIES[type];
    const hp = Math.round(spec.hp * healthFactor);
    const point = route.at(progress, lateral);
    const ahead = route.at(progress + .05, lateral);
    const enemy: Enemy = {
      type, route, batch, lateral, progress, age: 0, hp, maxHp: hp, speed: spec.speed * speedFactor,
      walk: 0, facing: facingFor(ahead.x - point.x, ahead.y - point.y),
      slows: new Map(), flash: 0, hurtAgo: 0, ...point,
    };
    if (!this.encountered.has(type)) {
      this.encountered.add(type);
      this.revision++;
    }
    this.enemies.push(enemy);
    return enemy;
  }

  private spawnArrivals() {
    for (const group of this.deployments.values()) {
      const next = group.arrivals[group.sent];
      if (!next || this.time + 1e-7 < group.nextAt) continue;
      const [first] = group.route.points;
      this.placeEnemy(next.type, group.route, next.batch, next.lateral, 0, group.hp, group.speed);
      const previous = group.arrivals[group.sent - 1];
      if (!previous || previous.batch !== next.batch) {
        const [x, y] = first;
        this.effects.push({
          kind: "gate",
          x,
          y,
          color: "#dabc81",
          life: 0.38,
          total: 0.38,
        });
      }
      group.sent++;
      const following = group.arrivals[group.sent];
      if (following) group.nextAt = this.time + following.at - next.at;
    }
  }

  tick(dt: number) {
    if (this.paused || this.ended || this.tutorialHold) return;
    this.time += dt;
    this.effects = this.effects.filter((effect) => (effect.life -= dt) > 0);
    for (const [id, entry] of this.pending) {
      if (entry.at <= this.time + 1e-7) this.release(id);
    }
    if (this.switchCrew && this.trackDispatchAt !== undefined && this.time - this.trackDispatchAt >= TRACK_SWITCH_RETURN)
      this.returnSwitchGuard();
    if (this.phase !== "active") {
      this.stepGuards([], dt);
      return;
    }
    this.spawnArrivals();
    let changed = false;
    for (const enemy of this.enemies) {
      enemy.age += dt;
      for (const [pace, expiry] of enemy.slows)
        if (expiry <= enemy.age) enemy.slows.delete(pace);
      enemy.flash -= dt;
      const spec = ENEMIES[enemy.type];
      enemy.hurtAgo += dt;
      if (enemy.burnLife && enemy.burnRate) {
        enemy.hp -= enemy.burnRate * Math.min(dt, enemy.burnLife) * exposedDamageFactor(enemy) *
          mireArmor(enemy) * mireDamageFactor(enemy);
        enemy.hurtAgo = 0;
        if (enemy.hp > 0) {
          enemy.burnLife = Math.max(0, enemy.burnLife - dt);
          if (!enemy.burnLife) enemy.burnRate = 0;
        }
      } else if (spec.regeneration && enemy.hurtAgo >= spec.regeneration.delay) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + spec.regeneration.rate * dt);
      }
    }
    updateEnemyActions(this.enemies, this.effects, (enemy) => {
      for (const { guards } of this.guardPosts.values())
        if (guards.some((guard) => guard.hp > 0 && guard.target === enemy && guard.contactAt !== undefined)) return true;
      return false;
    }, (enemy, radius) => {
      if (isInTunnel(enemy)) return false;
      let target: Guard | undefined;
      let nearest = radius ** 2;
      for (const { guards } of this.guardPosts.values()) {
        for (const guard of guards) {
          if (!canReceiveQuill(guard)) continue;
          const distance = dist2(guard.x, guard.y, enemy.x, enemy.y);
          if (distance > nearest) continue;
          if (enemy.type !== "vine-viper") return true;
          if (target && distance === nearest) continue;
          target = guard;
          nearest = distance;
        }
      }
      if (!target) return false;
      enemy.quillFacing = facingFor(target.x - enemy.x, target.y - enemy.y);
      return true;
    });
    if (this.devices.length) {
      for (const { enemy, kind } of deviceSweepHits(this.devices, this.enemies, this.time, dt)) {
        if (enemy.hp <= 0 || isInTunnel(enemy)) continue;
        if (kind === "mire-backwash") {
          const spec = ENEMIES[enemy.type];
          if (spec.boss || spec.miniboss || enemy.type === "spider-egg" || isBurrowing(enemy)) continue;
          const rule = DEVICES[kind];
          this.effects.push({ kind: "enemy-splash", x: enemy.x, y: enemy.y, color: "#a6e4cb", life: .42, total: .42 });
          enemy.progress = Math.max(0, enemy.progress - rule.retreat);
          Object.assign(enemy, enemy.route.at(enemy.progress, enemy.lateral));
          staggerEnemy(enemy, rule.stagger);
        } else if (kind === "log-roll") {
          const rule = DEVICES["log-roll"];
          this.damage(enemy, { damage: rule.damage });
          const spec = ENEMIES[enemy.type];
          if (enemy.hp > 0 && !spec.boss) staggerEnemy(enemy, spec.miniboss ? 1.1 : rule.stagger);
          this.effects.push({ kind: "rail-impact", x: enemy.x, y: enemy.y, color: "#d8b077", life: 0.3, total: 0.3 });
        } else {
          this.damage(enemy, DEVICES["rail-cart"]);
          const stagger = ENEMIES[enemy.type].cartStagger;
          if (enemy.hp > 0 && stagger) staggerEnemy(enemy, stagger);
          this.effects.push({ kind: "rail-impact", x: enemy.x, y: enemy.y, color: "#ffd694", life: 0.32, total: 0.32 });
        }
      }
    }
    if (this.enemies.some(enemy => MIRE_SKILL_ENEMIES.has(enemy.type))) {
      stepMireSkills({ enemies: this.enemies, posts: this.guardPosts.values(), routes: this.allRoutes,
        shallows: this.shallows, effects: this.effects, time: this.time,
        spawn: (type, parent, progress, lateral) => this.placeEnemy(type, parent.route, parent.batch, lateral, progress),
      }, dt);
    }
    if (this.stepTowerFreeze()) changed = true;
    const blocked = this.stepGuards(this.enemies, dt);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || enemy.escaped || enemy.carriedBy) continue;
      const spec = ENEMIES[enemy.type];
      const heldByBoom = boomHolds(this.devices, enemy, this.time);
      const advance = mireAdvance(enemy, dt, enemy.speed * enemyPace(enemy, devicePace(this.devices, enemy, this.time)) * dt,
        heldByBoom || Boolean(blocked?.has(enemy)));
      enemy.progress += advance;
      const previousStep = Math.floor(enemy.walk / 4);
      if (advance) enemy.walk += (spec.pace * advance) / spec.speed;
      const position = enemy.route.at(enemy.progress, enemy.lateral);
      if (advance > 0) {
        const facing = facingFor(position.x - enemy.x, position.y - enemy.y);
        if (facing !== enemy.facing) enemyTurned(enemy, this.effects);
        enemy.facing = facing;
      }
      Object.assign(enemy, position);
      if (enemy.type === "lantern-moth") syncMirePassenger(enemy);
      if (spec.ability?.kind !== "hop" && enemy.progress < enemy.route.distance &&
          Math.floor(enemy.walk / 4) > previousStep)
        this.effects.push({
          kind: "enemy-step", enemy: enemy.type, x: enemy.x, y: enemy.y,
          color: spec.color, life: 0.26, total: 0.26,
        });
      if (enemy.progress >= enemy.route.distance) {
        enemy.escaped = true;
        this.health = Math.max(0, this.health - spec.leak);
        this.coreHit = this.time;
        this.effects.push({
          kind: "breach",
          x: enemy.x,
          y: enemy.y,
          color: "#ff8d72",
          life: 0.4,
          total: 0.4,
        });
        if (spec.boss || spec.miniboss) {
          this.breachingBoss = enemy.type;
          break;
        }
        changed = true;
      }
    }
    if (this.breachingBoss || !this.health) {
      this.phase = "lost";
      this.revision++;
      return;
    }
    this.advanceProjectiles(dt);
    const bursted = new Set<Enemy>();
    let propagated = true;
    while (propagated) {
      propagated = false;
      for (const enemy of this.enemies) {
        if (enemy.escaped || enemy.hp > 0 || bursted.has(enemy)) continue;
        const burst = ENEMIES[enemy.type].gasBurst;
        if (!burst || (enemy.burnLife ?? 0) <= 0) continue;
        bursted.add(enemy);
        propagated = true;
        this.effects.push({
          kind: "mire-blast",
          enemy: enemy.type,
          x: enemy.x,
          y: enemy.y,
          color: "#c8f066",
          radius: burst.radius,
          life: 0.52,
          total: 0.52,
        });
        for (const other of this.enemies) {
          if (other === enemy || other.hp <= 0 || other.escaped || isInTunnel(other) ||
              dist2(enemy.x, enemy.y, other.x, other.y) > burst.radius ** 2) continue;
          this.damage(other, {
            damage: burst.damage,
            burn: { damagePerSecond: burst.burnDamage, seconds: burst.burnSeconds },
          });
        }
        for (const post of this.guardPosts.values()) {
          for (const guard of post.guards) {
            if (guard.hp <= 0 || dist2(enemy.x, enemy.y, guard.x, guard.y) > burst.radius ** 2) continue;
            const stats = guardUnitStats(post, guard);
            const damage = Math.max(1, Math.round(burst.damage * stats.counterFactor));
            guard.hp = Math.max(0, guard.hp - damage);
            guard.hurtAt = this.time;
            guard.combatAt = this.time;
            guard.healedAt = undefined;
            const dx = guard.x - enemy.x, dy = guard.y - enemy.y;
            const distance = Math.hypot(dx, dy) || 1;
            guard.recoil = [dx / distance, dy / distance];
            this.effects.push({
              kind: "guard-hit", enemy: enemy.type, x: guard.x, y: guard.y,
              direction: guard.recoil, airborne: (guard.flight?.height ?? 0) >= .48,
              color: "#c8f066", life: .23, total: .23,
            });
            if (guard.hp === 0) {
              releaseGuard(guard);
              guard.attack = undefined;
              guard.respawnAt = this.time + stats.respawn;
            }
          }
        }
      }
    }
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.escaped) {
        dropMirePassenger(enemy);
        return false;
      }
      if (enemy.hp > 0) return true;
      dropMirePassenger(enemy);
      const reward = ENEMIES[enemy.type].reward;
      if (reward) this.gold += Math.max(1, Math.round(reward * (this.level.killRewardScale ?? 1)));
      this.kills++;
      const duration = ENEMIES[enemy.type].boss ? 0.76 : 0.5;
      this.effects.push({
        kind: "pop",
        enemy: enemy.type,
        fallen: enemy,
        x: enemy.x,
        y: enemy.y,
        color: ENEMIES[enemy.type].color,
        life: duration,
        total: duration,
      });
      changed = true;
      return false;
    });
    const litTargets = beaconTargets(this.devices, this.enemies, this.time);
    for (const tower of this.towers.values()) {
      if (tower.frost) {
        if (tower.frost.source.hp > 0) {
          if (tower.frost.taps && this.time - tower.frost.lastTap > FROST_TAP_GAP) {
            tower.frost.taps = 0;
            changed = true;
          }
          continue;
        }
        this.breakTowerIce(tower);
        changed = true;
      }
      tower.cooldown = Math.max(0, tower.cooldown - dt);
      const stats = towerStats(tower);
      const inRange = (enemy: Enemy) => enemy.hp > 0 && !enemy.escaped && !isInTunnel(enemy) &&
        (!stats.groundOnly || !isAirborne(enemy)) && dist2(enemy.x, enemy.y, tower.x, tower.y) <= stats.range ** 2;
      const held = tower.focus?.target;
      let target = held && inRange(held) ? held : undefined;
      let capture: Enemy | undefined;
      let second: Enemy | undefined;
      const netReady = stats.net && this.time >= (tower.nextNetAt ?? 0);
      const remaining = (enemy: Enemy) => enemy.route.distance - enemy.progress;
      const priority = supportsTargetPriority(tower) ? (tower.priority ?? "first") : "first";
      const betterTarget = (candidate: Enemy, current: Enemy) => {
        const lit = litTargets?.has(candidate), currentLit = litTargets?.has(current);
        if (lit !== currentLit) return Boolean(lit);
        if (current === held) return false;
        if (priority === "strong") {
          if (candidate.hp !== current.hp) return candidate.hp > current.hp;
        } else if (priority === "weak") {
          if (candidate.hp !== current.hp) return candidate.hp < current.hp;
        }
        return remaining(candidate) < remaining(current);
      };
      for (const enemy of this.enemies) {
        if (!inRange(enemy)) continue;
        if (!target || betterTarget(enemy, target)) {
          if (stats.split) second = target;
          target = enemy;
        } else if (stats.split && enemy !== target && (!second || betterTarget(enemy, second))) second = enemy;
        if (netReady && canNet(enemy) && (!capture || remaining(enemy) < remaining(capture)) &&
            !this.projectiles.some((shot) => shot.kind === "net-capture" && shot.target === enemy && !shot.lostInTunnel))
          capture = enemy;
      }
      if (capture) this.fire(tower, capture, stats, true);
      if (!target) {
        tower.focus = undefined;
        continue;
      }
      if (stats.focus && tower.focus?.target !== target) tower.focus = { target };
      const dx = target.x - tower.x, dy = target.y - tower.y;
      const spec = TOWERS[tower.type];
      if (spec.tracks && this.time - tower.fired >= spec.flight[0] && Math.abs(dx) + Math.abs(dy) > 0.08)
        tower.heading = headingFor(dx, dy);
      if (tower.cooldown > 0) continue;
      let shotStats = stats;
      if (stats.focus && tower.focus) {
        tower.focus.since ??= this.time;
        const charge = Math.min(1, (this.time - tower.focus.since) / stats.focus.seconds);
        shotStats = { ...stats, damage: Math.round(stats.damage * (1 + stats.focus.bonus * charge)),
          armorBonus: charge === 1 ? stats.focus.armor : undefined, chain: charge === 1 ? stats.chain : undefined };
      }
      const volley = stats.split && second ? new Set<Enemy>() : undefined;
      this.fire(tower, target, shotStats, false, volley);
      if (volley && second) this.fire(tower, second, shotStats, false, volley);
    }
    const deployed = [...this.deployments.values()].every(
      (group) => group.sent >= group.arrivals.length,
    );
    if (!this.pending.size && deployed && !this.enemies.length && !this.guardQuills.length) {
      this.projectiles.length = 0;
      const openingSupplies = this.wave <= 2 ? 20 : 0;
      this.gold += 25 + this.wave * 5 + openingSupplies;
      for (const post of this.guardPosts.values()) matureGriffins(post, this.wave, this.time);
      if (this.wave === this.level.waves.length) this.phase = "won";
      else this.prepare();
      changed = true;
    }
    if (changed) this.revision++;
  }

  private stepGuards(enemies: readonly Enemy[], dt: number) {
    if (!this.guardPosts.size && !this.guardQuills.length &&
        !enemies.some((enemy) => (enemy.melee?.aim || enemy.melee?.style === "quake") && this.time < enemy.melee.end)) return;
    const guards = [...this.guardPosts.values()].flatMap((post) => post.guards);
    const alive = guards.filter((guard) => guard.hp > 0).length;
    const blocked = updateGuards(this.guardPosts.values(), enemies, this.time, dt, this.effects,
      (enemy, damage) => this.damage(enemy, { damage }),
      (guard, target) => this.projectiles.push({
        kind: "guard-spear", x: guard.x, y: guard.y, tx: target.x, ty: target.y,
        target, damage: SPEAR_THROW.damage, color: "#f1d69e", age: 0,
        releaseDelay: 0,
        duration: Math.max(0.12, Math.hypot(target.x - guard.x, target.y - guard.y) / SPEAR_THROW.speed),
      }), this.guardQuills);
    if (alive !== guards.filter((guard) => guard.hp > 0).length) this.revision++;
    return blocked;
  }
}
