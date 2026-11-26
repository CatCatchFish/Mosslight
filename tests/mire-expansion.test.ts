import assert from "node:assert/strict";
import { test } from "node:test";
import { WEATHER } from "../src/content/weather.ts";
import { MIRE_EXPANSION_LEVELS } from "../src/content/levels/mire-expansion.ts";
import { TOWERS } from "../src/content/towers.ts";
import { DefenseGame } from "../src/engine/defense.ts";
import { groundWithNet, isAirborne } from "../src/engine/enemy-abilities.ts";
import { guardStats, strikeGuardWithMire } from "../src/engine/guards.ts";
import { startEnemyMelee } from "../src/engine/melee.ts";
import { mireArmor, mireBloomSupply, mireBossState, mireDamageFactor, raiseMudShield } from "../src/engine/mire-rules.ts";
import { mireEnemyPose } from "../src/render/mire-units.ts";
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

test("salt rain targets air and ground and deduplicates the overlapping blast", () => {
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
  assert.equal(game.projectiles.length, 2);
  assert(game.projectiles.some(({ target }) => target === flyer));
  until(game, () => !game.projectiles.length);
  assert(Math.abs(first.hp - (first.maxHp - 64 * .78)) < 1e-6);
  assert(Math.abs(second.hp - (second.maxHp - 64 * .78)) < 1e-6);
  assert(Math.abs(flyer.hp - (flyer.maxHp - 64)) < 1e-6);
  assert(Math.abs(mireArmor(first) - .88) < 1e-6);
  assert.equal(flyer.salt, undefined);
});

function sporeWave(count: number, path: string | null = null) {
  const game = new DefenseGame(lane([["mire-treant", count, .12]]), ["spore-caster"]);
  assert(game.build(0, "spore-caster"));
  if (path) {
    assert(game.upgrade(0) && game.upgrade(0) && game.upgrade(0, path));
  }
  const tower = game.towers.get(0)!;
  tower.cooldown = 100;
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === count);
  game.enemies.forEach((enemy, index) => place(enemy, 6 + index * .55));
  tower.cooldown = 0;
  game.tick(STEP);
  until(game, () => !game.projectiles.length);
  tower.cooldown = 100;
  const source = game.enemies.find(enemy => enemy.spore);
  assert(source);
  const others = game.enemies.filter(enemy => enemy !== source);
  game.enemies = [source, ...others];
  place(source, 6);
  others.forEach((enemy, index) => place(enemy, 6.55 + index * .55));
  return game;
}

test("spore caster targets airborne enemies and applies damage over time", () => {
  const game = new DefenseGame(lane([[["mire-treant", "lantern-moth"], 2, .12, 2]]), ["spore-caster"]);
  assert(game.build(0, "spore-caster"));
  const tower = game.towers.get(0)!;
  tower.cooldown = 100;
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 2);
  const [ground, flyer] = game.enemies;
  place(ground, 6);
  place(flyer, 6.2);
  tower.cooldown = 0;
  game.tick(STEP);
  until(game, () => !game.projectiles.length);
  assert(flyer.spore && flyer.spore.jumps === 2);
  assert.equal(ground.hp, ground.maxHp);
  assert.equal(ground.spore, undefined);
  const hp = flyer.hp;
  game.tick(STEP);
  assert(flyer.hp < hp);
  flyer.age = flyer.spore!.until;
  game.tick(STEP);
  assert.equal(flyer.spore, undefined);
});

test("spore caster propagates to the nearest neighbor for at most two jumps", () => {
  const game = sporeWave(4);
  const [first, second, third, fourth] = game.enemies;
  assert(first.spore);
  first.hp = 0;
  game.tick(STEP);
  assert(!game.enemies.includes(first));
  assert(second.spore && second.spore.jumps === 1);
  second.hp = 0;
  game.tick(STEP);
  assert(third.spore && third.spore.jumps === 0);
  assert.equal(fourth.spore, undefined);
  assert(Math.abs(third.spore.duration - TOWERS["spore-caster"].tiers[0].spore!.duration * .64) < 1e-6);
});

test("spores propagate from a ground host to a nearby airborne enemy", () => {
  const game = new DefenseGame(lane([[["mire-treant", "lantern-moth"], 2, .12, 2]]), ["spore-caster"]);
  assert(game.build(0, "spore-caster"));
  const tower = game.towers.get(0)!;
  tower.cooldown = 100;
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 2);
  const [ground, flyer] = game.enemies;
  place(ground, 6.4);
  place(flyer, 6.1);
  tower.cooldown = 0;
  game.tick(STEP);
  until(game, () => !game.projectiles.length);
  assert(ground.spore);
  tower.cooldown = 100;
  ground.hp = 0;
  game.tick(STEP);
  assert(flyer.spore && flyer.spore.jumps === 1);
});

test("burst spores trade propagation reach for a local death explosion", () => {
  const game = sporeWave(3, "burst-spores");
  const [first, second, third] = game.enemies;
  const secondHp = second.hp, thirdHp = third.hp;
  const multiplier = game.weatherEnemyArmor * mireArmor(second);
  first.hp = 0;
  game.tick(STEP);
  assert(second.spore && second.spore.jumps === 0);
  assert.equal(third.spore, undefined);
  assert(Math.abs(secondHp - second.hp - 34 * multiplier) < 1e-6);
  assert(Math.abs(thirdHp - third.hp - 34 * game.weatherEnemyArmor * mireArmor(third)) < 1e-6);
  assert(game.effects.some(({ kind, radius }) => kind === "spore-burst" && radius === 1.35));
});

test("parasitic spores last longer and propagate one additional jump", () => {
  const game = sporeWave(5, "parasitic-spores");
  const [first, second, third, fourth, fifth] = game.enemies;
  assert.equal(second.spore, undefined);
  first.hp = 0;
  game.tick(STEP);
  second.hp = 0;
  game.tick(STEP);
  third.hp = 0;
  game.tick(STEP);
  assert(fourth.spore && fourth.spore.jumps === 0);
  assert.equal(fifth.spore, undefined);
  assert(Math.abs(fourth.spore.duration - 5.5 * .8 ** 3) < 1e-6);
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

test("mudskipper jumps only on shallow mud", () => {
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
});

test("a lantern moth boards a mudskipper on entry and releases it on net or death", () => {
  const carryingMoth = () => {
    const game = new DefenseGame(lane([[["lantern-moth", "mudskipper"], 2, .16, 2]]));
    assert(game.startFirstWave());
    until(game, () => game.enemies.length === 2);
    const [moth, rider] = game.enemies;
    assert.equal(moth.type, "lantern-moth");
    assert.equal(rider.type, "mudskipper");
    assert.equal(moth.passenger, rider);
    assert.equal(rider.carriedBy, moth);
    assert(isAirborne(rider));
    for (let i = 0; i < 240; i++) game.tick(STEP);
    assert.equal(rider.carriedBy, moth);
    assert.equal(moth.passenger, rider);
    return { game, moth, rider };
  };

  const netted = carryingMoth();
  groundWithNet(netted.moth, 2);
  netted.game.tick(STEP);
  assert.equal(netted.rider.carriedBy, undefined);
  assert.equal(netted.moth.passenger, undefined);
  assert(netted.game.enemies.includes(netted.rider));
  assert(!isAirborne(netted.rider));

  const killed = carryingMoth();
  killed.moth.hp = 0;
  killed.game.tick(STEP);
  assert.equal(killed.rider.carriedBy, undefined);
  assert.equal(killed.moth.passenger, undefined);
  assert(killed.game.enemies.includes(killed.rider));
  assert(!isAirborne(killed.rider));
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

test("mire elder roots in place to summon two mire treants and exposes attack/summon poses", () => {
  const game = new DefenseGame(lane([["mire-elder", 1, .4]]), ["reed-post"]);
  assert(game.startFirstWave());
  until(game, () => Boolean(game.enemies[0]?.mireCast));
  const elder = game.enemies[0];
  const frozenProgress = elder.progress;
  const castPose = mireEnemyPose(elder, false, game.time);
  assert.equal(castPose.skill, true);
  assert.equal(castPose.options.attack, undefined);
  for (let i = 0; i < 15; i++) game.tick(STEP);
  assert.equal(elder.progress, frozenProgress);
  until(game, () => game.enemies.filter(({ type }) => type === "mire-treant").length === 2);
  assert(game.effects.some(effect => effect.kind === "mire-summon"));
  assert(game.encountered.has("mire-elder") && game.encountered.has("mire-treant"));

  // Engage with a reed-post guard to verify melee windup & strike animation phases.
  const duel = new DefenseGame(lane([["mire-elder", 1, .4]]), ["reed-post"]);
  assert(duel.build(0, "reed-post"));
  assert(duel.startFirstWave());
  until(duel, () => duel.enemies.length > 0);
  const fighter = duel.enemies[0];
  fighter.mireReadyAt = 99;
  place(fighter, 5.4);
  until(duel, () => Boolean(fighter.melee));
  assert.equal(fighter.melee!.style, "stomp");
  assert.equal(mireEnemyPose(fighter, false, duel.time).options.attack, "windup");
  until(duel, () => Boolean(fighter.melee && duel.time >= fighter.melee.impact && duel.time < fighter.melee.end));
  assert.equal(mireEnemyPose(fighter, false, duel.time).options.attack, "strike");
});

test("mire matriarch roots to hatch three pods, heals from supply, and chains pod bursts into the boss", () => {
  const game = new DefenseGame(lane([["mire-matriarch", 1, .4]]), ["reed-post"]);
  assert(game.startFirstWave());
  until(game, () => Boolean(game.enemies[0]?.mireCast));
  const matriarch = game.enemies[0];
  const frozenProgress = matriarch.progress;
  const castPose = mireEnemyPose(matriarch, false, game.time);
  assert.equal(castPose.skill, true);
  assert.equal(castPose.options.attack, undefined);
  for (let i = 0; i < 15; i++) game.tick(STEP);
  assert.equal(matriarch.progress, frozenProgress);
  until(game, () => game.enemies.filter(({ type }) => type === "spore-pod").length === 3);
  const pods = game.enemies.filter(({ type }) => type === "spore-pod");
  assert.equal(mireBloomSupply(matriarch, game.enemies).length, 3);
  assert(game.effects.some(({ kind }) => kind === "mire-bloom"));
  assert(game.encountered.has("mire-matriarch") && game.encountered.has("spore-pod"));

  matriarch.hp -= 100;
  matriarch.hurtAgo = 2;
  const suppliedHp = matriarch.hp;
  game.tick(STEP);
  assert(Math.abs(matriarch.hp - suppliedHp - 28 * STEP) < 1e-6);
  pods.forEach((pod, index) => {
    place(pod, matriarch.progress - .12);
    pod.x = matriarch.x + index * .12;
    pod.y = matriarch.y;
  });
  const beforeBurst = matriarch.hp;
  pods[0].hp = 0;
  game.tick(STEP);
  assert.equal(game.enemies.filter(({ type }) => type === "spore-pod").length, 0);
  assert.equal(mireBloomSupply(matriarch, game.enemies).length, 0);
  assert(matriarch.hp < beforeBurst - 300);
  assert(game.effects.filter(({ kind }) => kind === "mire-bloom-burst").length === 3);
  const unsuppliedHp = matriarch.hp;
  game.tick(STEP);
  assert.equal(matriarch.hp, unsuppliedHp);
});

test("mire matriarch uses a heavy stomp windup and release pose", () => {
  const game = new DefenseGame(lane([["mire-matriarch", 1, .4]]));
  assert(game.startFirstWave());
  until(game, () => game.enemies.length > 0);
  const matriarch = game.enemies[0];
  matriarch.mireReadyAt = 99;
  place(matriarch, 5.4);
  startEnemyMelee(matriarch, [matriarch.x + 1, matriarch.y], game.time);
  assert.equal(matriarch.melee!.style, "stomp");
  assert.equal(mireEnemyPose(matriarch, false, game.time).options.attack, "windup");
  until(game, () => game.time >= matriarch.melee!.impact && game.time < matriarch.melee!.end);
  assert.equal(mireEnemyPose(matriarch, false, game.time).options.attack, "strike");
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
  assert(Math.abs(heavy.hp - (heavy.maxHp - thickDamage * .78)) < 1e-6);
  assert(Math.abs(mireArmor(heavy) - .96) < 1e-6);

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
  assert(Math.abs(single.hp - (single.maxHp - rainDamage * .78)) < 1e-6);
  assert(Math.abs(mireArmor(single) - .88) < 1e-6);
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
  assert(Math.abs(plain - damage * armorBonus * .78) < 1e-6);
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
  const purchases: readonly (readonly [number, (BuildingId | "fixed-bank" | "blast" | "fork" | "avalanche" | "glacier")?])[] = [
    [0], [2], [6], [8], [15], [18], [20],
    [0], [2], [6], [8], [15], [18],
    [20, "fixed-bank"], [20],
    [6, "avalanche"], [18, "avalanche"], [2, "fork"], [15, "fork"], [8, "blast"],
    [9, "cannon"], [9], [9], [9, "blast"],
  ];
  let next = 0;
  const buildable = new Set<string>(["arrow", "storm", "cannon", "hail-mortar", "reed-post"]);
  for (let wave = 1; wave <= level.waves.length; wave++) {
    until(game, () => game.phase === "active");
    for (let step = 0; step < 25_000 && game.phase === "active"; step++) game.tick(STEP);
    assert.notEqual(game.phase, "active");
    while (!game.ended && next < purchases.length) {
      const [plot, action] = purchases[next];
      const ok = action && buildable.has(action)
        ? game.build(plot, action as BuildingId)
        : game.upgrade(plot, action);
      if (!ok) break;
      next++;
    }
  }
  assert.equal(game.phase, "won");
  assert.equal(rateBattle(level, game.health), 3);
});

function runMireCampaignPlan(
  stageId: "15" | "16" | "17" | "18",
  loadout: readonly BuildingId[],
  start: readonly (readonly [number, BuildingId])[],
  plan: readonly (readonly [number, string?])[],
) {
  const level = MIRE_EXPANSION_LEVELS[stageId];
  const game = new DefenseGame(level, loadout);
  const buildable = new Set<string>(loadout);
  for (const [plot, type] of start) assert(game.build(plot, type), `stage ${stageId} plot ${plot} ${type}`);
  assert(game.startFirstWave());
  let next = 0;
  const spend = () => {
    while (!game.ended && next < plan.length) {
      const [plot, action] = plan[next];
      const ok = action && buildable.has(action)
        ? game.build(plot, action as BuildingId)
        : game.upgrade(plot, action);
      if (!ok) break;
      next++;
    }
  };
  spend();
  for (let wave = 1; wave <= level.waves.length; wave++) {
    until(game, () => game.phase === "active");
    for (let step = 0; step < 30_000 && game.phase === "active"; step++) {
      game.tick(STEP);
      if (step % 30 === 0) spend();
    }
    assert.notEqual(game.phase, "active");
    spend();
  }
  assert.equal(game.phase, "won");
  assert.equal(rateBattle(level, game.health), 3);
}

test("stage 15 earns three stars using salt-caster armor shred and reed-post blocking", () => {
  runMireCampaignPlan(
    "15",
    ["storm", "salt-caster", "hail-mortar", "glaze-lance", "reed-post"],
    [
      [1, "reed-post"], [2, "salt-caster"], [3, "storm"], [5, "hail-mortar"],
      [6, "glaze-lance"], [4, "storm"], [0, "glaze-lance"],
    ],
    [
      [2], [3], [6], [5], [4], [0], [1],
      [2], [3], [6], [5], [4], [0],
      [2, "salt-rain"], [1, "fixed-bank"], [1],
      [6, "skewer"], [0, "skewer"], [3, "fork"], [4, "fork"], [5, "avalanche"],
      [7, "salt-caster"], [7], [7], [7, "thick-glaze"],
      [20, "glaze-lance"], [20], [20], [20, "skewer"],
    ],
  );
});

test("stage 16 earns three stars combining spore-caster, salt-caster, and reed-post", () => {
  runMireCampaignPlan(
    "16",
    ["storm", "spore-caster", "salt-caster", "glaze-lance", "reed-post"],
    [
      [20, "reed-post"], [21, "glaze-lance"], [22, "storm"], [11, "salt-caster"],
      [0, "spore-caster"], [19, "storm"], [10, "glaze-lance"],
    ],
    [
      [21], [22], [11], [0], [19], [10], [20],
      [21], [22], [11], [0], [19], [10],
      [21, "skewer"], [11, "salt-rain"], [0, "burst-spores"], [20, "fixed-bank"], [20],
      [22, "fork"], [19, "fork"], [10, "skewer"],
      [1, "spore-caster"], [1], [1], [1, "parasitic-spores"],
      [9, "salt-caster"], [9], [9], [9, "thick-glaze"],
      [2, "glaze-lance"], [2], [2], [2, "skewer"],
    ],
  );
});

test("stage 17 matriarch finale erupts three pods and falls to a fully developed defense", () => {
  const stage = MIRE_EXPANSION_LEVELS["17"];
  const level: Level = { ...stage, waves: [stage.waves[stage.waves.length - 1]] };
  const loadout = ["hail-mortar", "spore-caster", "salt-caster", "glaze-lance"] as const;
  const game = new DefenseGame(level, loadout);
  const paths = {
    "glaze-lance": "skewer",
    "hail-mortar": "avalanche",
    "spore-caster": "burst-spores",
    "salt-caster": "salt-rain",
  } as const;
  type DamageTower = keyof typeof paths;
  const plan: readonly (readonly [number, DamageTower])[] = [
    [0, "glaze-lance"], [1, "hail-mortar"], [2, "spore-caster"], [3, "salt-caster"],
    [4, "glaze-lance"], [8, "hail-mortar"],
    [9, "glaze-lance"], [10, "hail-mortar"], [11, "spore-caster"],
    [12, "glaze-lance"], [13, "spore-caster"], [14, "salt-caster"],
    [15, "glaze-lance"], [16, "hail-mortar"], [17, "salt-caster"],
    [26, "glaze-lance"],
  ];
  game.gold = 30_000;
  for (const [plot, type] of plan) {
    assert(game.build(plot, type), `plot ${plot} ${type}`);
    assert(game.upgrade(plot) && game.upgrade(plot), `tiers ${plot}`);
    assert(game.upgrade(plot, paths[type]), `specialization ${plot}`);
  }
  game.applyWeather(WEATHER.toxicStorm);
  assert(game.startFirstWave());
  let sawMatriarch = false;
  let sawBloomBurst = false;
  let maxPods = 0;
  let maxSupply = 0;
  for (let step = 0; step < 10_000 && !game.ended; step++) {
    game.tick(STEP);
    for (let index = 0; index < game.devices.length; index++) game.activateDevice(index);
    const matriarch = game.enemies.find(enemy => enemy.type === "mire-matriarch");
    sawMatriarch ||= Boolean(matriarch);
    sawBloomBurst ||= game.effects.some(effect => effect.kind === "mire-bloom-burst");
    const pods = game.enemies.filter(enemy => enemy.type === "spore-pod");
    maxPods = Math.max(maxPods, pods.length);
    if (matriarch) maxSupply = Math.max(maxSupply, mireBloomSupply(matriarch, game.enemies).length);
  }
  assert(sawMatriarch);
  assert.equal(maxPods, 3);
  assert.equal(maxSupply, 3);
  assert(sawBloomBurst);
  assert.equal(game.phase, "won");
  assert.equal(game.health, stage.health);
  assert.equal(rateBattle(level, game.health), 3);
});

test("stage 18 finale earns three stars with full mire and frost new-tower roster", () => {
  runMireCampaignPlan(
    "18",
    ["hail-mortar", "spore-caster", "salt-caster", "glaze-lance", "reed-post"],
    [
      [0, "reed-post"], [1, "glaze-lance"], [4, "hail-mortar"], [5, "salt-caster"],
      [6, "spore-caster"], [10, "reed-post"], [2, "glaze-lance"],
    ],
    [
      [0], [1], [4], [5], [6], [2], [10],
      [1], [4], [5], [2], [6],
      [1, "skewer"], [4, "avalanche"], [5, "thick-glaze"], [0, "fixed-bank"], [0],
      [2, "skewer"], [6, "burst-spores"], [10, "mud-patrol"], [10],
      [3, "glaze-lance"], [3], [3], [3, "skewer"],
      [7, "salt-caster"], [7], [7], [7, "salt-rain"],
      [20, "spore-caster"], [20], [20], [20, "parasitic-spores"],
      [14, "glaze-lance"], [14], [14], [14, "skewer"],
      [8, "hail-mortar"], [8], [8], [8, "avalanche"],
      [9, "glaze-lance"], [9], [9], [9, "skewer"],
      [19, "salt-caster"], [19], [19], [19, "thick-glaze"],
      [13, "glaze-lance"], [13], [13], [13, "skewer"],
    ],
  );
});
