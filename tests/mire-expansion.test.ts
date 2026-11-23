import assert from "node:assert/strict";
import { test } from "node:test";
import { MIRE_EXPANSION_LEVELS } from "../src/content/levels/mire-expansion.ts";
import { TOWERS } from "../src/content/towers.ts";
import { DefenseGame } from "../src/engine/defense.ts";
import { groundWithNet, isAirborne } from "../src/engine/enemy-abilities.ts";
import { guardStats, strikeGuardWithMire } from "../src/engine/guards.ts";
import { mireArmor, mireBossState, mireDamageFactor, raiseMudShield } from "../src/engine/mire-rules.ts";
import { rateBattle } from "../src/ui/ratings.ts";
import type { BuildingId } from "../src/engine/types.ts";
import type { Enemy, Level, SpawnGroup } from "../src/engine/types.ts";

const STEP = 1 / 60;
const siege = MIRE_EXPANSION_LEVELS["18"];

function until(game: DefenseGame, condition: () => boolean) {
  for (let i = 0; i < 3800 && !condition() && !game.ended; i++) game.tick(STEP);
  assert(condition());
}

function lane(groups: readonly SpawnGroup[], extra: Partial<Level> = {}): Level {
  return {
    ...siege, gold: 1700, width: 30, height: 12, pools: [], shallows: [], bridges: [], devices: [],
    plots: [[6, 4], [6, 6]], entries: [
      { id: "north", label: "北岸", delay: 0, scenery: "trail", marker: [0, 5], route: [[0, 5], [28, 5]] },
    ], waves: [{ title: "机制", groups: { north: groups } }], ...extra,
  };
}

function place(enemy: Enemy, progress: number) {
  enemy.progress = progress;
  Object.assign(enemy, enemy.route.at(progress, enemy.lateral));
}

test("reed post uses its intended tiers and can share bracing without suppressing damage", () => {
  const game = new DefenseGame(lane([["whisker-catfish", 1, 1]]), ["reed-post"]);
  assert(game.build(0, "reed-post"));
  assert.equal(game.gold, 1600);
  const post = game.guardPosts.get(0)!;
  assert.equal(post.guards.length, 2);
  assert.equal(guardStats(post).health, 105);
  assert(game.upgrade(0));
  assert.equal(guardStats(post).health, 135);
  assert(game.upgrade(0, "fixed-bank") && game.upgrade(0));
  assert.equal(post.guards.length, 3);
  assert.equal(guardStats(post).damage, 24);
  assert.equal(game.gold, 1700 - 100 - 85 - 125 - 145);
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 1);
  const [catfish] = game.enemies;
  const [first, ally] = post.guards;
  first.target = catfish;
  first.contactAt = game.time - .5;
  const health = first.hp;
  const firstX = first.x, allyX = ally.x;
  strikeGuardWithMire(post, first, catfish, game.time, game.effects, 32, [1, 0]);
  assert.equal(first.x, firstX);
  assert.equal(first.hp, health - 32);
  assert.equal(first.braceReadyAt, game.time + 7);
  assert.equal(ally.sharedBraceUntil, game.time + 2);
  strikeGuardWithMire(post, ally, catfish, game.time, game.effects, 32, [1, 0]);
  assert.equal(ally.x, allyX);
  assert.equal(ally.sharedBraceUntil, undefined);
  strikeGuardWithMire(post, first, catfish, game.time, game.effects, 32, [1, 0]);
  assert.equal(first.x, firstX + 1);
  assert.equal(first.target, null);
});

test("reed patrol's first strike hits the target twice and one nearby enemy once", () => {
  const game = new DefenseGame(lane([["mire-treant", 3, .1, 3]]), ["reed-post"]);
  assert(game.build(0, "reed-post") && game.upgrade(0) && game.upgrade(0, "mud-patrol") && game.upgrade(0));
  const post = game.guardPosts.get(0)!;
  assert.equal(post.guards.length, 2);
  const [guard, other] = post.guards;
  other.hp = 0;
  other.respawnAt = 200;
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 3);
  for (const enemy of game.enemies) place(enemy, 6);
  guard.x = 6;
  guard.y = 4.65;
  guard.path = [];
  guard.target = game.enemies[0];
  guard.contactAt = game.time;
  until(game, () => Boolean(guard.attack?.released));
  const dmg = guardStats(post).damage;
  const damage = game.enemies.map(enemy => enemy.maxHp - enemy.hp).sort((a, b) => a - b);
  assert.deepEqual(damage, [0, dmg, dmg * 2]);
  assert(guard.patrolReadyAt! > game.time + 5);
});

test("salt rain launches two aimed pots, hits only ground and deduplicates the overlapping blast", () => {
  const game = new DefenseGame(lane([[["mire-mycelid", "mire-mycelid", "lantern-moth"], 3, .18, 3]]), ["salt-caster"]);
  assert(game.build(0, "salt-caster") && game.upgrade(0) && game.upgrade(0) && game.upgrade(0, "salt-rain"));
  const tower = game.towers.get(0)!;
  tower.cooldown = 100;
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 3);
  const [first, second, flyer] = game.enemies;
  place(first, 6);
  place(second, 6.18);
  place(flyer, 6.32);
  tower.cooldown = 0;
  game.tick(STEP);
  assert.deepEqual(new Set(game.projectiles.map(({ target }) => target)), new Set([first, second]));
  until(game, () => !game.projectiles.length);
  assert(Math.abs(first.hp - (first.maxHp - 64 * .82)) < 1e-6);
  assert(Math.abs(second.hp - (second.maxHp - 64 * .82)) < 1e-6);
  assert.equal(flyer.hp, flyer.maxHp);
  assert(Math.abs(mireArmor(first) - .92) < 1e-6);
});

test("mud shield blocks its frontal arc and a clam only exposes the pearl after opening", () => {
  const game = new DefenseGame(lane([[["shield-crayfish", "stone-clam"], 2, .18, 2]]));
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 2);
  const [crayfish, clam] = game.enemies;
  raiseMudShield(crayfish, [crayfish.x + 1, crayfish.y]);
  assert.equal(mireDamageFactor(crayfish, [crayfish.x + 2, crayfish.y]), .7);
  assert.equal(mireDamageFactor(crayfish, [crayfish.x - 2, crayfish.y]), 1);
  assert.equal(mireDamageFactor(crayfish), 1);
  clam.hp -= 10;
  clam.age = 2;
  clam.hurtAgo = 0;
  game.tick(STEP);
  assert(clam.mireCast);
  assert.equal(mireDamageFactor(clam), 1);
  until(game, () => mireDamageFactor(clam) === .55);
  until(game, () => mireDamageFactor(clam) === 1.25);
  until(game, () => mireDamageFactor(clam) === 1);
});

test("mudskipper jumps only on shallow mud and a netted moth drops its passenger immediately", () => {
  const ground = new DefenseGame(lane([["mudskipper", 1, .4]], { shallows: [[4, 5], [5, 5]] }));
  assert(ground.startFirstWave());
  until(ground, () => Boolean(ground.enemies[0]?.mireCast));
  const fish = ground.enemies[0], origin = fish.progress;
  let maxStep = 0;
  while (fish.mireCast && fish.age - fish.mireCast.startedAt < .78) {
    const start = fish.progress;
    ground.tick(STEP);
    maxStep = Math.max(maxStep, fish.progress - start);
  }
  assert(maxStep > fish.speed * STEP * 1.5 && fish.progress - origin < 1.5);
  until(ground, () => !fish.mireCast);
  assert(fish.mireReadyAt! - fish.age >= 5.99);

  const air = new DefenseGame(lane([[["lantern-moth", "mudskipper"], 2, .16, 2]]));
  assert(air.startFirstWave());
  until(air, () => air.enemies.length === 2);
  const [moth, rider] = air.enemies;
  place(moth, 4.3);
  place(rider, 4.1);
  rider.age = moth.age = 2;
  air.tick(STEP);
  assert.equal(rider.carriedBy, moth);
  assert(isAirborne(rider));
  for (let i = 0; i < 15; i++) air.tick(STEP);
  assert(rider.progress > 4.3 && rider.progress < 5.9);
  groundWithNet(moth, 2);
  air.tick(STEP);
  assert(!isAirborne(rider) && !rider.carriedBy);
  assert(moth.mireReadyAt! - moth.age >= 8.99);
});

test("a destroyed egg stays empty, a live egg hatches twice, and killing its hatchlings pays zero", () => {
  const game = new DefenseGame(lane([["reed-spider", 1, .4]]));
  assert(game.startFirstWave());
  until(game, () => Boolean(game.enemies[0]?.egg));
  const spider = game.enemies[0];
  const egg = spider.egg!;
  egg.hp = 0;
  for (let i = 0; i < 240; i++) game.tick(STEP);
  assert(!game.enemies.some(({ type }) => type === "reed-spiderling"));
  until(game, () => Boolean(spider.egg && spider.egg !== egg));
  const live = spider.egg!;
  until(game, () => game.enemies.filter(({ type }) => type === "reed-spiderling").length === 2);
  assert(!game.enemies.includes(live));
  assert(game.encountered.has("spider-egg") && game.encountered.has("reed-spiderling"));
  const gold = game.gold;
  for (const enemy of game.enemies) if (enemy.type === "reed-spiderling") enemy.hp = 0;
  game.tick(STEP);
  assert.equal(game.gold, gold);
});

test("dragon telegraphs and exposes its armor, then staggers its half-health surge by lane", () => {
  const entries = [
    lane([]).entries[0],
    { id: "east", label: "东堤", delay: 0, scenery: "trail", marker: [3, 9], route: [[3, 9], [16, 9], [16, 5], [28, 5]] },
  ] as const;
  const game = new DefenseGame(lane([["sluice-dragon", 1, 1]], { entries }), ["reed-post"]);
  assert(game.startFirstWave());
  until(game, () => Boolean(game.enemies[0]?.mireCast));
  const [dragon] = game.enemies;
  assert.equal(mireBossState(dragon), "windup");
  assert.equal(mireArmor(dragon), .75);
  assert(game.effects.some(effect => effect.kind === "mire-tide-warning"));
  until(game, () => mireBossState(dragon) === "open");
  assert.equal(mireArmor(dragon), 1);
  assert.equal(mireDamageFactor(dragon), 1.25);
  dragon.hp = dragon.maxHp / 2;
  game.tick(STEP);
  assert(dragon.mireFractured);
  assert(game.effects.some(effect => effect.kind === "mire-tide-break"));
  until(game, () => dragon.mireCast?.lanes?.length === 2);
  assert.equal(dragon.mireCast!.lanes![1].route, game.routes.east);
  until(game, () => game.effects.some(effect => effect.kind === "mire-tide"));
  const first = game.time;
  assert.equal(dragon.mireCast?.struck?.size, 0);
  // The first visual has already expired when the echo arrives.
  until(game, () => game.time > first + .6 && game.effects.some(effect => effect.kind === "mire-tide"));
  assert(Math.abs(game.time - first - .9) < .04);
});

test("salt-caster specialization paths follow their single-target damage and armor curves", () => {
  const thickDamage = TOWERS["salt-caster"].paths["thick-glaze"].damage;
  const thick = new DefenseGame(lane([["mire-mycelid", 1, 1]]), ["salt-caster"]);
  assert(thick.build(0, "salt-caster") && thick.upgrade(0) && thick.upgrade(0) && thick.upgrade(0, "thick-glaze"));
  const thickTower = thick.towers.get(0)!;
  thickTower.cooldown = 100;
  assert(thick.startFirstWave());
  until(thick, () => thick.enemies.length === 1);
  const heavy = thick.enemies[0];
  place(heavy, 6);
  thickTower.cooldown = 0;
  thick.tick(STEP);
  until(thick, () => thick.effects.some((effect) => effect.kind === "salt-caster"));
  assert(Math.abs(heavy.hp - (heavy.maxHp - thickDamage * .82)) < 1e-6);
  assert.equal(mireArmor(heavy), 1);

  const rainDamage = TOWERS["salt-caster"].paths["salt-rain"].damage;
  const rain = new DefenseGame(lane([["mire-mycelid", 1, 1]]), ["salt-caster"]);
  assert(rain.build(0, "salt-caster") && rain.upgrade(0) && rain.upgrade(0) && rain.upgrade(0, "salt-rain"));
  const rainTower = rain.towers.get(0)!;
  rainTower.cooldown = 100;
  assert(rain.startFirstWave());
  until(rain, () => rain.enemies.length === 1);
  const single = rain.enemies[0];
  place(single, 6);
  rainTower.cooldown = 0;
  rain.tick(STEP);
  assert.equal(rain.projectiles.length, 1);
  until(rain, () => rain.effects.some((effect) => effect.kind === "salt-caster"));
  assert(Math.abs(single.hp - (single.maxHp - rainDamage * .82)) < 1e-6);
  assert(Math.abs(mireArmor(single) - .92) < 1e-6);
});

test("hail mortar splashes clustered ground targets and applies its slow", () => {
  const game = new DefenseGame(lane([["mire-mycelid", 3, .18, 3]]), ["hail-mortar"]);
  assert(game.build(0, "hail-mortar") && game.upgrade(0) && game.upgrade(0) && game.upgrade(0, "avalanche"));
  const tower = game.towers.get(0)!;
  tower.cooldown = 100;
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 3);
  for (const enemy of game.enemies) place(enemy, 6);
  const before = game.enemies.map((enemy) => enemy.hp);
  tower.cooldown = 0;
  game.tick(STEP);
  until(game, () => game.effects.some((effect) => effect.kind === "hail-mortar"));
  for (const [index, enemy] of game.enemies.entries()) {
    assert(enemy.hp < before[index]);
    assert(enemy.slows.size > 0);
  }
});

test("glaze lance applies armor and chilled damage multipliers", () => {
  const damage = TOWERS["glaze-lance"].paths.skewer.damage;
  const armorBonus = TOWERS["glaze-lance"].paths.skewer.armorBonus!;
  const chilled = TOWERS["glaze-lance"].paths.skewer.chilledDamage!;
  const hit = (slow: boolean) => {
    const game = new DefenseGame(lane([["mire-mycelid", 1, 1]]), ["glaze-lance"]);
    assert(game.build(0, "glaze-lance") && game.upgrade(0) && game.upgrade(0) && game.upgrade(0, "skewer"));
    const tower = game.towers.get(0)!;
    tower.cooldown = 100;
    assert(game.startFirstWave());
    until(game, () => game.enemies.length === 1);
    const enemy = game.enemies[0];
    place(enemy, 6);
    if (slow) enemy.slows.set(.7, 100);
    tower.cooldown = 0;
    game.tick(STEP);
    until(game, () => game.effects.some((effect) => effect.kind === "glaze-lance"));
    return enemy.maxHp - enemy.hp;
  };
  const plain = hit(false);
  const chilledHit = hit(true);
  assert(Math.abs(plain - damage * armorBonus * .82) < 1e-6);
  assert(Math.abs(chilledHit - plain * chilled) < 1e-4);
});

test("stage 14 earns three stars with reed post and hail mortar support", () => {
  const level = MIRE_EXPANSION_LEVELS["14"];
  const game = new DefenseGame(level, ["arrow", "storm", "cannon", "hail-mortar", "reed-post"]);
  const start: readonly (readonly [number, BuildingId])[] = [
    [0, "arrow"], [2, "storm"], [6, "hail-mortar"], [8, "cannon"],
    [15, "storm"], [18, "hail-mortar"], [20, "reed-post"], [4, "arrow"],
  ];
  for (const [plot, type] of start) assert(game.build(plot, type), `${plot} ${type}`);
  assert(game.startFirstWave());
  const purchases: readonly (readonly [number, ("fixed-bank" | "blast" | "fork" | "avalanche" | "glacier")?])[] = [
    [0], [2], [6], [8], [15], [18], [20],
    [0], [2], [6], [8], [15], [18],
    [20, "fixed-bank"], [20],
  ];
  let next = 0;
  for (let wave = 1; wave <= level.waves.length; wave++) {
    until(game, () => game.phase === "active");
    for (let step = 0; step < 20_000 && game.phase === "active"; step++) game.tick(STEP);
    assert.notEqual(game.phase, "active");
    while (!game.ended && next < purchases.length) {
      const [plot, action] = purchases[next];
      if (!game.upgrade(plot, action)) break;
      next++;
    }
  }
  assert.equal(game.phase, "won");
  assert.equal(rateBattle(level, game.health), 3);
});
