import assert from "node:assert/strict";
import { test } from "node:test";
import { FIELD_LEVEL } from "../src/content/levels/emerald-woods.ts";
import { ENEMIES } from "../src/content/enemies.ts";
import { TOWERS } from "../src/content/towers.ts";
import { DefenseGame, FROST_THAW_TAPS } from "../src/engine/defense.ts";
import { abilityCooldownRemaining, applySlow, blockHeavyHit, enemyPace, exposedDamageFactor, isAirborne, isBurrowing, spendScreen, updateEnemyActions } from "../src/engine/enemy-abilities.ts";
import type { EnemyId, SpawnGroup, TowerId } from "../src/engine/types.ts";

const STEP = 1 / 60;
const entry = { ...FIELD_LEVEL.entries[0], id: "north", route: [[0, 4], [9, 4], [9, 28]] } as const;

function battle(north: readonly SpawnGroup[], south?: readonly SpawnGroup[]) {
  const game = new DefenseGame({
    ...FIELD_LEVEL,
    gold: 500,
    towers: ["arrow", "cannon", "frost", "ballista"],
    plots: [[1, 3]],
    entries: south ? [entry, { ...entry, id: "south", route: [[0, 5], [9, 5], [9, 28]] }] : [entry],
    waves: [{ title: "Ability check", groups: south ? { north, south } : { north } }],
  });
  assert(game.startFirstWave());
  return game;
}

function until(game: DefenseGame, condition: () => boolean) {
  for (let i = 0; i < 1200; i++) {
    if (condition()) return;
    game.tick(STEP);
  }
  assert.fail("Battle condition did not occur");
}

function first(game: DefenseGame) {
  until(game, () => game.enemies.length > 0);
  return game.enemies[0];
}

function near(actual: number, expected: number) {
  assert(Math.abs(actual - expected) < 1e-7, `${actual} did not match ${expected}`);
}

test("the moose telegraphs two towers, disables their fire and releases them through clicks or defeat", () => {
  const game = new DefenseGame({
    ...FIELD_LEVEL,
    gold: 1000, devices: [],
    plots: [[2, 3], [3, 5], [5, 3]],
    entries: [entry],
    waves: [{ title: "冰封", groups: { north: [["frost-moose", 1, 1]] } }],
  });
  for (let index = 0; index < 3; index++) assert(game.build(index, "arrow"));
  assert(game.startFirstWave());
  const boss = first(game);
  const [nearTower, secondTower, lastTower] = [...game.towers.values()];
  until(game, () => boss.action?.phase === "windup");
  assert.deepEqual([...boss.iceTargets!.keys()], [0, 1]);
  assert.equal(Boolean(nearTower.frost || secondTower.frost), false);
  const markedAt = boss.progress;
  until(game, () => Boolean(nearTower.frost));
  assert.equal(boss.progress, markedAt);
  assert(nearTower.frost && secondTower.frost && !lastTower.frost);
  assert(nearTower.frost.frozenAt <= game.time, "frozen tower should record frozenAt timestamp");
  const freezeEffects = game.effects.filter(({ kind }) => kind === "tower-freeze");
  assert(freezeEffects.some((e) => e.radius && e.enemy === "frost-moose"), "boss should emit a domain frost-nova wave");
  assert(freezeEffects.every((e) => !e.arcs), "reworked freeze skill must not emit laser arcs");
  assert(!game.upgrade(0));
  assert.equal(game.sell(0), null);
  const lastShot = nearTower.fired;
  const reload = nearTower.cooldown;
  for (let i = 0; i < 90; i++) game.tick(STEP);
  assert.equal(nearTower.fired, lastShot);
  assert.equal(nearTower.cooldown, reload);
  assert(abilityCooldownRemaining(boss) > 5);

  game.paused = true;
  assert(!game.thawTower(0));
  game.paused = false;
  assert(game.thawTower(0));
  for (let i = 0; i < 85; i++) game.tick(STEP);
  assert.equal(nearTower.frost?.taps, 0);
  for (let taps = 1; taps < FROST_THAW_TAPS; taps++) {
    assert(game.thawTower(0));
    assert.equal(nearTower.frost?.taps, taps);
  }
  assert(game.thawTower(0));
  assert(!nearTower.frost && secondTower.frost && !lastTower.frost);
  assert(!game.thawTower(0));
  until(game, () => nearTower.fired > lastShot);
  boss.hp = 0;
  game.tick(STEP);
  assert(!secondTower.frost);
});

test("slow caps cover towers and terrain while weaker slows keep separate expiry times", () => {
  const game = battle([[["slime", "chief", "weir-turtle"], 3, 0.55, 3]]);
  const slime = first(game);
  applySlow(slime, 0.4, 0.3);
  applySlow(slime, 0.8, 2);
  near(enemyPace(slime, 0.52), 0.5);
  until(game, () => slime.slows.size === 1);
  near(enemyPace(slime), 0.8);
  until(game, () => game.enemies.length === 3);
  for (const boss of game.enemies.slice(1)) {
    applySlow(boss, 0.1, 1);
    near(enemyPace(boss, 0.52), 0.75);
  }
});

test("the chief opens its chest and briefly shields nearby armored escorts on the same route", () => {
  const game = battle([[["chief", "guard", "runner"], 3, 0.6, 3]], [["guard", 1, 1]]);
  const boss = first(game);
  near(exposedDamageFactor(boss), 0.76);
  until(game, () => boss.action?.phase === "exposed");
  near(exposedDamageFactor(boss), 1.25);
  const screened = game.enemies.filter((enemy) => enemy.screen);
  assert.equal(screened.length, 1);
  assert.equal(screened[0].type, "guard");
  assert.equal(screened[0].route, boss.route);
  near(spendScreen(screened[0], game.effects), 0.45);
  near(spendScreen(screened[0], game.effects), 1);
});

test("the chief's marked hammer impact kills shield guards only when they remain inside", () => {
  for (const retreat of [false, true]) {
    const game = new DefenseGame({
      ...FIELD_LEVEL, plots: [[3, 3]], pools: [], bridges: [], gold: 500,
      entries: [entry], waves: [{ title: "举槌", groups: { north: [["chief", 1, 1]] } }],
    });
    assert(game.build(0, "guard-post") && game.upgrade(0) && game.upgrade(0, "shield"));
    const post = game.guardPosts.get(0)!;
    assert(game.startFirstWave());
    const boss = first(game);
    until(game, () => boss.melee?.style === "cleave");
    const attack = boss.melee!;
    assert(attack.aim && post.guards.every((guard) => guard.hp > 0));
    if (retreat) assert(game.setGuardRally(0, [5, 4]));
    until(game, () => attack.hit);
    assert(game.time >= attack.impact);
    assert(game.effects.some(({ kind }) => kind === "chief-cleave"));
    assert.equal(post.guards.every((guard) => guard.hp > 0), retreat);
    assert(boss.nextMeleeAt! - attack.end >= 5.49);
  }
});

test("the moss badger drops its melee engagement when it burrows and becomes exposed on return", () => {
  const game = new DefenseGame({
    ...FIELD_LEVEL, entries: [entry], plots: [[1, 3], [3, 3]], gold: 500,
    waves: [{ title: "掘洞测试", groups: { north: [["moss-badger", 1, 0.45]] } }],
  });
  assert(game.build(0, "guard-post"));
  assert(game.build(1, "guard-post"));
  assert(game.startFirstWave());
  const badger = first(game);
  const guards = [...game.guardPosts.values()].flatMap((post) => post.guards);
  until(game, () => guards.some((guard) => guard.target === badger));
  until(game, () => isBurrowing(badger));
  assert(guards.every((guard) => guard.target !== badger));
  assert(game.effects.some(({ kind }) => kind === "enemy-burrow-in"));
  assert(!isAirborne(badger));
  near(exposedDamageFactor(badger), 0.6);
  until(game, () => !isBurrowing(badger));
  assert(game.effects.some(({ kind }) => kind === "enemy-burrow-out"));
  near(abilityCooldownRemaining(badger), 9);
  near(exposedDamageFactor(badger), 1);
  until(game, () => guards.some((guard) => guard.target === badger && guard.contactAt !== undefined));
  const progress = badger.progress;
  game.tick(STEP);
  near(badger.progress, progress);
  assert(abilityCooldownRemaining(badger) > 0 && badger.action === undefined);
});

test("repeatable enemy abilities leave their configured cooldown after each use", () => {
  for (const type of Object.keys(ENEMIES) as EnemyId[]) {
    const ability = ENEMIES[type].ability;
    if (!ability || !("cooldown" in ability) || ability.kind === "freeze-towers") continue;
    const game = battle([[type, 1, 0.45]]);
    const enemy = first(game);
    let ready = false, cooldownStartedAt: number | undefined, resumed = false;
    for (let age = 0; age <= 24; age += STEP) {
      enemy.age = age;
      updateEnemyActions([enemy], [], () => true, () => true);
      const wait = abilityCooldownRemaining(enemy);
      if (!ready) ready = wait === 0;
      else if (cooldownStartedAt === undefined && wait > 0) {
        cooldownStartedAt = age;
        assert(wait >= ability.cooldown - STEP - 1e-7, type);
      } else if (cooldownStartedAt !== undefined && wait === 0) {
        assert(age - cooldownStartedAt >= ability.cooldown - STEP - 1e-7, type);
        resumed = true;
        break;
      }
    }
    assert(resumed, type);
  }
});

test("the mirror shrimp protects a nearby batchmate once per screen", () => {
  const game = battle([[["mirror-shrimp", "slime"], 2, 0.35, 2]],
    [["slime", 1, 0.45]]);
  const allies = () => game.enemies.filter((enemy) => enemy.type === "slime");
  until(game, () => allies().some((enemy) => enemy.screen));
  const protectedAlly = allies().find((enemy) => enemy.screen)!;
  assert.equal(protectedAlly.route, game.routes.north);
  assert(allies().filter((enemy) => enemy.route === game.routes.south).every((enemy) => !enemy.screen));
  near(spendScreen(protectedAlly, game.effects), 0.45);
  near(spendScreen(protectedAlly, game.effects), 1);
});

test("a skater jets around the first corner while exposed and cannot boost at the next corner", () => {
  const game = new DefenseGame({
    ...FIELD_LEVEL, entries: [{ ...entry, route: [[0, 4], [2, 4], [2, 6], [8, 6]] }],
    waves: [{ title: "急弯", groups: { north: [["lily-skater", 1, 1]] } }],
  });
  assert(game.startFirstWave());
  const skater = first(game);
  until(game, () => skater.facing === "south");
  const firstBurst = skater.turnBurstUntil;
  assert(firstBurst !== undefined);
  near(enemyPace(skater), 1.2);
  near(exposedDamageFactor(skater), 1.25);
  until(game, () => skater.facing === "east");
  assert.equal(skater.turnBurstUntil, firstBurst);
  until(game, () => skater.age >= firstBurst);
  near(exposedDamageFactor(skater), 1);
  assert(abilityCooldownRemaining(skater) > 0);
});

test("a blocked slag cart vents once, and a frost shot during windup quenches it", () => {
  for (const quench of [false, true]) {
    const game = new DefenseGame({
      ...FIELD_LEVEL, plots: [[2, 3], [2, 5]], pools: [], bridges: [], gold: 500,
      entries: [entry], waves: [{ title: "排压", groups: { north: [["slag-cart", 1, 1]] } }],
    });
    assert(game.build(0, "guard-post") && game.startFirstWave());
    const cart = first(game);
    until(game, () => cart.action?.phase === "windup");
    const guards = game.guardPosts.get(0)!.guards;
    const health = guards.map(({ hp }) => hp);
    if (quench) assert(game.build(1, "frost"));
    until(game, () => game.effects.some(({ kind }) => kind === (quench ? "enemy-vent-stop" : "enemy-vent")));
    if (quench) {
      assert.deepEqual(guards.map(({ hp }) => hp), health);
      near(abilityCooldownRemaining(cart), 7.5);
      assert.equal(cart.action, undefined);
    } else {
      assert(guards.some(({ hp }, index) => hp === health[index] - 18));
      const afterVent = guards.map(({ hp }) => hp);
      for (let i = 0; i < 10; i++) game.tick(STEP);
      assert.deepEqual(guards.map(({ hp }) => hp), afterVent);
    }
  }
});

test("porcupine quills warn, travel to fixed positions, and can hit after the shooter falls", () => {
  const game = new DefenseGame({
    ...FIELD_LEVEL, plots: [[2, 3], [2, 5]], pools: [], bridges: [], gold: 500,
    entries: [entry], waves: [{ title: "霜刺", groups: { north: [["frost-porcupine", 1, 1]] } }],
  });
  assert(game.build(0, "guard-post") && game.build(1, "guard-post") && game.startFirstWave());
  const porcupine = first(game);
  until(game, () => porcupine.action?.phase === "windup");
  assert.equal(game.guardQuills.length, 0);
  near(exposedDamageFactor(porcupine), .84);
  until(game, () => game.guardQuills.length > 0);
  near(exposedDamageFactor(porcupine), 1.12);
  assert.equal(game.guardQuills.length, 3);
  const [hit, miss] = game.guardQuills;
  const hitHealth = hit.target.hp, missHealth = miss.target.hp;
  assert(!game.effects.some(({ kind }) => kind === "enemy-quill-impact"));
  const hold = [...game.guardPosts.values()].find((post) => post.guards.includes(hit.target))!;
  hold.rally = [hit.tx, hit.ty];
  hit.target.path = [];
  miss.target.x += 4;
  porcupine.hp = 0;
  game.tick(STEP);
  assert.equal(hit.target.hp, hitHealth);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.phase, "active");
  until(game, () => game.guardQuills.length === 0);
  assert.equal(hit.target.hp, hitHealth - 17);
  assert.equal(miss.target.hp, missHealth);
  assert.equal(game.phase, "won");
});

test("a reed whistle boosts only nearby allies from its entry and batch", () => {
  const game = battle([
    ["slime", 1, 0.45],
    [["reed-crab", "runner"], 2, 0.65, 2],
  ], [["slime", 1, 0.45], ["stump-spirit", 1, 0.45]]);
  until(game, () => game.effects.some((effect) => effect.kind === "enemy-rally"));
  const crab = game.enemies.find((enemy) => enemy.type === "reed-crab")!;
  const runner = game.enemies.find((enemy) => enemy.type === "runner")!;
  const slime = game.enemies.find((enemy) => enemy.type === "slime")!;
  const spirit = game.enemies.find((enemy) => enemy.type === "stump-spirit")!;
  assert.equal(crab.batch, runner.batch);
  assert.notEqual(slime.batch, crab.batch);
  assert.equal(spirit.batch, crab.batch);
  assert.notEqual(spirit.route, crab.route);
  assert.deepEqual(game.enemies.filter((enemy) => enemy.haste), [runner]);
  const before = runner.progress;
  game.tick(STEP);
  near(runner.progress - before, runner.speed * 1.28 * STEP);
  crab.hp = 0;
  until(game, () => runner.age >= runner.haste!.until);
  const after = runner.progress;
  game.tick(STEP);
  near(runner.progress - after, runner.speed * STEP);
});

test("the owl ward softens existing slowdown and expires", () => {
  const game = battle([[["frost-owl", "slime"], 2, 0.55, 2]]);
  until(game, () => game.enemies.length === 2);
  const [owl, slime] = game.enemies;
  applySlow(slime, 0.5, 8);
  until(game, () => game.effects.some((effect) => effect.kind === "enemy-ward"));
  const before = slime.progress;
  game.tick(STEP);
  near(slime.progress - before, slime.speed * 0.825 * STEP);
  owl.hp = 0;
  until(game, () => slime.age >= slime.slowWard!.until);
  const after = slime.progress;
  game.tick(STEP);
  near(slime.progress - after, slime.speed * 0.5 * STEP);
});

test("the snowbrush fox shields only nearby batchmates and absorbs part of only one hit", () => {
  const game = battle([
    [["snowbrush-fox", "runner", "wisp"], 3, .5, 3],
    ["slime", 1, .5],
  ], [["slime", 1, .5]]);
  until(game, () => game.enemies.length === 5);
  const [fox] = game.enemies.filter(({ type }) => type === "snowbrush-fox");
  const runner = game.enemies.find(({ type }) => type === "runner")!;
  const wisp = game.enemies.find(({ type }) => type === "wisp")!;
  const slimes = game.enemies.filter(({ type }) => type === "slime");
  for (const ally of [runner, wisp, ...slimes]) {
    ally.x = fox.x + (ally === wisp ? 2.51 : 2.49);
    ally.y = fox.y;
    ally.screen = undefined;
  }
  fox.age = 3.17;
  fox.action = undefined;
  updateEnemyActions(game.enemies, game.effects, () => false);
  assert.deepEqual(game.enemies.filter(({ screen }) => screen), [runner]);
  near(runner.screen!.until - runner.age, 2.8);
  near(spendScreen(runner, game.effects), 0.4);
  near(spendScreen(runner, game.effects), 1);
});

test("the frost bear resists a quarter of slowdown and surges forward after bracing", () => {
  const game = battle([["frost-bear", 1, 1]]);
  const bear = first(game);
  applySlow(bear, 0.6, 0.5);
  near(enemyPace(bear), 0.7);
  until(game, () => bear.action?.phase === "windup");
  const brace = bear.progress;
  until(game, () => bear.action?.phase === "active");
  const launch = bear.progress;
  until(game, () => !bear.action);
  assert(launch - brace < 0.3);
  assert(bear.progress - launch > 1.2);
});

test("the rime golem's shell absorbs exactly one hit at or above 32 damage", () => {
  const game = battle([["rime-golem", 1, 1]]);
  const golem = first(game);
  assert(!blockHeavyHit(golem, 31.99, game.effects));
  assert(!golem.shellBroken);
  assert(blockHeavyHit(golem, 32, game.effects));
  assert(golem.shellBroken);
  assert(!blockHeavyHit(golem, 64, game.effects));
  assert.equal(game.effects.filter(({ kind }) => kind === "shell-break").length, 1);
});

test("the blizzard elk wards same-route allies from another batch and regenerates after 2.4 seconds", () => {
  const game = battle([["blizzard-elk", 1, 1], [["slime", "runner"], 2, 0.5]], [["slime", 1, 1]]);
  until(game, () => game.enemies.length === 4);
  const elk = game.enemies.find(({ type }) => type === "blizzard-elk")!;
  const nearAlly = game.enemies.find(({ type, route }) => type === "slime" && route === elk.route)!;
  const farAlly = game.enemies.find(({ type }) => type === "runner")!;
  const otherRoute = game.enemies.find(({ route }) => route !== elk.route)!;
  assert.notEqual(nearAlly.batch, elk.batch);
  nearAlly.x = elk.x + 4.19;
  farAlly.x = elk.x + 4.21;
  otherRoute.x = elk.x;
  nearAlly.y = farAlly.y = otherRoute.y = elk.y;
  for (const enemy of game.enemies) enemy.slowWard = undefined;
  applySlow(nearAlly, 0.5, 5);
  elk.age = 2.36;
  elk.action = undefined;
  updateEnemyActions(game.enemies, game.effects, () => false);
  assert.equal(nearAlly.slowWard?.strength, 0.65);
  near(enemyPace(nearAlly), 0.825);
  assert(!farAlly.slowWard && !otherRoute.slowWard);

  const injured = elk.hp - 100;
  elk.hp = injured;
  elk.hurtAgo = 0;
  for (let step = 0; step < 143; step++) game.tick(STEP);
  near(elk.hp, injured);
  until(game, () => elk.hp > injured);
  assert(elk.hurtAgo >= 2.4 && elk.hurtAgo < 2.4 + STEP);
  near(elk.hp, injured + 32 * STEP);
});

test("the ferry snail ignores one heavy strike and keeps damage from light hits", () => {
  const game = battle([["ferry-snail", 1, 0.6]]);
  assert(game.build(0, "arrow"));
  const snail = first(game);
  until(game, () => snail.hp < snail.maxHp);
  const afterArrow = snail.hp;
  assert.equal(afterArrow, snail.maxHp - TOWERS.arrow.tiers[0].damage);
  assert(!snail.shellBroken);
  assert.ok(game.sell(0));
  assert(game.build(0, "cannon"));
  until(game, () => snail.shellBroken === true);
  assert.equal(snail.hp, afterArrow);
  assert(game.effects.some((effect) => effect.kind === "shell-break"));
  until(game, () => snail.hp < afterArrow);
  assert.equal(snail.hp, afterArrow - TOWERS.cannon.tiers[0].damage);
});

test("tree bark and the slag cart reduce direct damage, and the ballista punches through", () => {
  for (const type of ["stump-spirit", "slag-cart"] as const) {
    for (const tower of ["arrow", "ballista"] as const) {
      const game = battle([[type, 1, 0.6]]);
      assert(game.build(0, tower));
      const enemy = first(game);
      until(game, () => enemy.hp < enemy.maxHp);
      const stats = TOWERS[tower].tiers[0];
      near(enemy.maxHp - enemy.hp, stats.damage * (stats.armorBonus ?? 1) * ENEMIES[type].armorFactor!);
    }
  }
});

test("the hopper and both chargers visibly prepare and change pace on their own routes", () => {
  for (const type of ["pine-hopper", "lamp-mole", "rivet-mite"] as const) {
    const game = battle([[type, 1, 0.6]]);
    const enemy = first(game);
    until(game, () => enemy.action?.phase === "windup");
    const before = enemy.progress;
    game.tick(STEP);
    assert(enemy.progress - before < enemy.speed * STEP);
    until(game, () => enemy.action?.phase === "active");
    const preRush = enemy.progress;
    game.tick(STEP);
    assert(enemy.progress - preRush > enemy.speed * STEP);
    assert.deepEqual({ x: enemy.x, y: enemy.y }, enemy.route.at(enemy.progress, enemy.lateral));
    until(game, () => game.effects.some((effect) =>
      effect.kind === (type === "pine-hopper" ? "enemy-needles" : "enemy-dust")));
  }
});

test("a half-health snow rhino charges through existing frost while still being slowed", () => {
  const game = battle([["ram", 1, 0.6]]);
  assert(game.build(0, "frost"));
  assert(game.upgrade(0));
  assert(game.upgrade(0));
  assert(game.upgrade(0, "chill"));
  const ram = first(game);
  const stride = () => {
    const before = ram.progress;
    game.tick(STEP);
    return (ram.progress - before) / STEP;
  };
  near(stride(), ram.speed);
  until(game, () => ram.slows.size > 0);
  assert(ram.hp > ram.maxHp / 2);
  near(stride(), ram.speed * 0.5);

  until(game, () => ram.hp <= ram.maxHp / 2);
  assert(ram.slows.size > 0);
  const chilledCharge = stride();
  near(chilledCharge, ram.speed * 1.7 * 0.735);
  assert(chilledCharge > ram.speed);
  assert(game.effects.some((effect) => effect.kind === "enemy-windup" && effect.enemy === "ram"));

  assert(game.sell(0));
  until(game, () => !ram.slows.size);
  const freeCharge = stride();
  near(freeCharge, ram.speed * 1.7);
  assert(freeCharge > chilledCharge);
});

test("the ice sail glides continuously and signals changes in facing", () => {
  const game = battle([["ice-sail", 1, 0.6]]);
  const enemy = first(game);
  assert.equal(enemy.facing, "east");
  const before = enemy.progress;
  game.tick(STEP);
  near(enemy.progress - before, enemy.speed * STEP);
  until(game, () => enemy.facing === "south");
  assert.equal(enemy.turnAt, enemy.age);
  assert((enemy.turnBurstUntil ?? 0) > enemy.age);
  const turned = enemy.progress;
  game.tick(STEP);
  assert(enemy.progress - turned > enemy.speed * STEP * 1.15);
});

test("the bridge miniboss exposes its neck and still triggers a defeat on breach", () => {
  const game = battle([["weir-turtle", 1, 0.6]]);
  assert(game.build(0, "arrow"));
  const turtle = first(game);
  const spec = ENEMIES[turtle.type];
  assert(turtle.maxHp >= 800 && !spec.boss && spec.miniboss && spec.ability?.kind === "guard-cycle");
  until(game, () => turtle.hp < turtle.maxHp);
  const expected = TOWERS.arrow.tiers[0].damage * spec.armorFactor!;
  near(turtle.maxHp - turtle.hp, expected * spec.ability.damageFactor);
  until(game, () => game.effects.some((effect) => effect.kind === "enemy-expose" && effect.enemy === "weir-turtle"));
  const health = turtle.hp;
  until(game, () => turtle.hp < health);
  near(health - turtle.hp, expected);
  for (let i = 0; !game.ended && i < 3500; i++) game.tick(STEP);
  assert.equal(game.health, FIELD_LEVEL.health);
  assert.equal(game.breachingBoss, "weir-turtle");
  assert.equal(game.phase, "lost");
});

function firstShot(tower: TowerId, type: EnemyId) {
  const game = battle([[type, 1, 0.6]]);
  assert(game.build(0, tower));
  until(game, () => game.projectiles.length > 0);
  return game.projectiles[0];
}

test("the launch uses each tower's flight profile and the roles have different ranges and fire rates", () => {
  for (const tower of ["arrow", "cannon", "frost", "ballista"] as const) {
    const shot = firstShot(tower, "slag-cart");
    const [delay, speed] = TOWERS[tower].flight;
    assert.equal(shot.releaseDelay, delay);
    assert(shot.age < shot.releaseDelay);
    near(shot.duration, delay + Math.hypot(shot.x - shot.tx, shot.y - shot.ty) / speed);
  }
  const [arrow, cannon, frost, ballista] = [TOWERS.arrow, TOWERS.cannon, TOWERS.frost, TOWERS.ballista]
    .map((tower) => tower.tiers[0]);
  assert(arrow.interval < frost.interval && frost.interval < cannon.interval);
  assert(frost.range < cannon.range && cannon.range < ballista.range);
});

test("selling a tower cancels its windup and leaves a shot already in flight", () => {
  const game = battle([["slag-cart", 1, 0.6]]);
  assert(game.build(0, "cannon"));
  until(game, () => game.projectiles.length > 0);
  assert(game.projectiles[0].age < game.projectiles[0].releaseDelay);
  assert(game.sell(0));
  assert.equal(game.projectiles.length, 0);

  assert(game.build(0, "cannon"));
  until(game, () => game.projectiles.some((shot) => shot.age >= shot.releaseDelay));
  const [launched] = game.projectiles;
  assert(game.sell(0));
  assert.deepEqual(game.projectiles, [launched]);
  until(game, () => game.effects.some((effect) => effect.kind === "cannon"));
});

test("regional minibosses trigger their signature mechanics and lose the battle on breach", () => {
  // 1. Pine-Mane Boar rallies nearby route allies and enrages under half HP.
  const boarGame = battle([["pine-boar", 1, 0.2], ["slime", 1, 0.2]]);
  until(boarGame, () => boarGame.enemies.length === 2);
  const [, ally] = boarGame.enemies;
  until(boarGame, () => Boolean(ally.haste && ally.haste.until > ally.age));
  assert(ally.haste && ally.haste.strength > 0);

  // 2. Lotus-Crown Toad shields nearby route allies and regenerates when untouched.
  const toadGame = battle([["lotus-toad", 1, 0.2], ["slime", 1, 0.2]]);
  until(toadGame, () => toadGame.enemies.length === 2);
  const [toad, escort] = toadGame.enemies;
  until(toadGame, () => Boolean(escort.screen && escort.screen.until > escort.age));
  toad.hp = Math.floor(toad.maxHp * 0.6);
  toad.hurtAgo = 3;
  const damaged = toad.hp;
  for (let i = 0; i < 60; i++) toadGame.tick(STEP);
  assert(toad.hp > damaged);

  // 3. Slag-Core Driller vents when intercepted and frost interrupts its windup.
  const drillGame = new DefenseGame({
    ...FIELD_LEVEL, plots: [[2, 3], [2, 5]], pools: [], bridges: [], gold: 500,
    entries: [entry], waves: [{ title: "排压", groups: { north: [["slag-driller", 1, 0.2]] } }],
  });
  assert(drillGame.build(0, "guard-post") && drillGame.startFirstWave());
  const driller = first(drillGame);
  until(drillGame, () => driller.action?.phase === "windup");
  assert(drillGame.build(1, "frost"));
  until(drillGame, () => drillGame.effects.some((e) => e.kind === "enemy-vent-stop"));
  assert.equal(driller.action, undefined);

  // 4. Frost-Tusk Mammoth cycles armor/exposed, shields nearby armored escorts, and causes instant defeat on breach.
  const mammothGame = battle([["frost-mammoth", 1, 0.2], ["guard", 1, 0.2]]);
  until(mammothGame, () => mammothGame.enemies.length === 2);
  const [mammoth, armoredEscort] = mammothGame.enemies;
  until(mammothGame, () => mammoth.action?.phase === "exposed");
  assert(armoredEscort.screen && armoredEscort.screen.until > armoredEscort.age);
  for (let i = 0; i < 4000 && mammothGame.phase !== "lost"; i++) mammothGame.tick(STEP);
  assert.equal(mammothGame.phase, "lost");

  // 5. Frost-Bellow Yeti rallies nearby same-route allies, enrages below half HP, and causes instant defeat on breach.
  const yetiGame = battle([["frost-yeti", 1, 0.2], ["frost-bear", 1, 0.2]]);
  until(yetiGame, () => yetiGame.enemies.length === 2);
  const [yeti, bearAlly] = yetiGame.enemies;
  const calmPace = enemyPace(yeti);
  until(yetiGame, () => yeti.action?.phase === "active");
  assert(bearAlly.haste && bearAlly.haste.until > bearAlly.age);
  yeti.hp = Math.floor(yeti.maxHp * 0.4);
  assert(enemyPace(yeti) > calmPace);
  for (let i = 0; i < 4000 && yetiGame.phase !== "lost"; i++) yetiGame.tick(STEP);
  assert.equal(yetiGame.phase, "lost");
});

test("swamp enemies submerge, spit venom, regenerate unless burned, and detonate gas sacs only while burning", () => {
  // 1. Mire croc burrows when intercepted and returns to the surface on cooldown.
  const crocGame = new DefenseGame({
    ...FIELD_LEVEL,
    plots: [[2, 3], [4, 3]],
    pools: [],
    bridges: [],
    gold: 500,
    devices: [],
    entries: [entry],
    waves: [{ title: "潜鳄测试", groups: { north: [["mire-croc", 1, 0.2]] } }],
  });
  assert(crocGame.build(0, "guard-post") && crocGame.startFirstWave());
  const croc = first(crocGame);
  until(crocGame, () => isBurrowing(croc));
  near(exposedDamageFactor(croc), 0.6);
  until(crocGame, () => !isBurrowing(croc));
  near(exposedDamageFactor(croc), 1);
  near(abilityCooldownRemaining(croc), 6.4);

  // 2. Vine viper spits venom at guards and becomes more vulnerable while spent.
  const viperGame = new DefenseGame({
    ...FIELD_LEVEL,
    plots: [[2, 3]],
    pools: [],
    bridges: [],
    gold: 500,
    entries: [entry],
    waves: [{ title: "毒蛇测试", groups: { north: [["vine-viper", 1, 0.2]] } }],
  });
  assert(viperGame.build(0, "guard-post") && viperGame.startFirstWave());
  const viper = first(viperGame);
  near(exposedDamageFactor(viper), 0.88);
  const guards = viperGame.guardPosts.get(0)!.guards;
  const startHp = guards.map((guard) => guard.hp);
  until(viperGame, () => viperGame.effects.some((effect) => effect.kind === "enemy-quill-launch" && effect.enemy === "vine-viper"));
  near(exposedDamageFactor(viper), 1.32);
  until(viperGame, () => guards.some((guard, i) => guard.hp < startHp[i]));

  // 3. Mire mycelid regenerates after delay, and ember burn suppresses regeneration.
  const mycelidGame = battle([["mire-mycelid", 1, 0.2]]);
  const mycelid = first(mycelidGame);
  mycelid.hp = Math.floor(mycelid.maxHp * 0.6);
  mycelid.hurtAgo = 2;
  const beforeRegen = mycelid.hp;
  for (let i = 0; i < 60; i++) mycelidGame.tick(STEP);
  assert(mycelid.hp > beforeRegen);
  mycelid.burnLife = 2;
  mycelid.burnRate = 12;
  const beforeBurn = mycelid.hp;
  for (let i = 0; i < 60; i++) mycelidGame.tick(STEP);
  assert(mycelid.hp < beforeBurn);

  // 4. Bloat sporer shields batchmates and chains explosion on death ONLY when burning.
  const coldGame = battle([[["bloat-sporer", "mire-treant"], 2, 0.25, 2]]);
  until(coldGame, () => coldGame.enemies.length === 2);
  const [coldSporer, coldTreant] = coldGame.enemies;
  until(coldGame, () => Boolean(coldTreant.screen && coldTreant.screen.until > coldTreant.age));
  // Mire treant also grants slow-ward to its batchmate.
  until(coldGame, () => Boolean(coldSporer.slowWard && coldSporer.slowWard.until > coldSporer.age));
  coldSporer.hp = 0;
  coldGame.tick(STEP);
  assert.equal(coldTreant.hp, coldTreant.maxHp);
  assert(!coldGame.effects.some((effect) => effect.kind === "mire-blast"));

  const burnGame = battle([[["bloat-sporer", "mire-treant"], 2, 0.25, 2]]);
  until(burnGame, () => burnGame.enemies.length === 2);
  const [hotSporer, hotTreant] = burnGame.enemies;
  hotSporer.burnLife = 1.5;
  hotSporer.burnRate = 10;
  hotSporer.hp = 0;
  burnGame.tick(STEP);
  assert(hotTreant.hp < hotTreant.maxHp);
  assert((hotTreant.burnLife ?? 0) > 0);
  assert(burnGame.effects.some((effect) => effect.kind === "mire-blast"));

  // 5. The gas burst also wounds ground interceptors inside its radius.
  const blastGame = new DefenseGame({
    ...FIELD_LEVEL,
    plots: [[2, 3]],
    pools: [],
    bridges: [],
    gold: 500,
    entries: [entry],
    waves: [{ title: "爆囊测试", groups: { north: [["bloat-sporer", 1, 0.2]] } }],
  });
  assert(blastGame.build(0, "guard-post") && blastGame.startFirstWave());
  const spore = first(blastGame);
  const blastGuards = blastGame.guardPosts.get(0)!.guards;
  const [inside, outside] = blastGuards;
  inside.x = spore.x + 0.4; inside.y = spore.y; inside.hp = 1;
  outside.x = spore.x + 3.6; outside.y = spore.y;
  const outsideHp = outside.hp;
  spore.burnLife = 1.5;
  spore.burnRate = 10;
  spore.hp = 0;
  blastGame.tick(STEP);
  assert.equal(inside.hp, 0);
  assert(inside.respawnAt > blastGame.time);
  assert.equal(outside.hp, outsideHp);
  assert(blastGame.effects.some((effect) => effect.kind === "guard-hit" && effect.enemy === "bloat-sporer"));
});
