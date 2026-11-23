import assert from "node:assert/strict";
import { test } from "node:test";
import { REED_BRIDGE } from "../src/content/levels/reed-bridge.ts";
import { SLUICE_BRIDGE } from "../src/content/levels/sluice-bridge.ts";
import { TUTORIAL_LEVEL } from "../src/content/levels/forest-outpost.ts";
import { DefenseGame } from "../src/engine/defense.ts";
import { guardPathfinder, guardRallyPoints, guardStats, GUARD_BRANCHES, GUARD_BUILDINGS, GUARD_POST, GUARD_REGEN, GUARD_UPGRADE, SPEAR_THROW } from "../src/engine/guards.ts";
import { createRoute } from "../src/engine/route.ts";
import type { Level, SpawnGroup } from "../src/engine/types.ts";

const STEP = 1 / 60;

function until(game: DefenseGame, condition: () => boolean) {
  for (let i = 0; i < 2400 && !condition(); i++) game.tick(STEP);
  assert(condition(), "Battle condition did not occur");
}

function defenseLane(group: SpawnGroup): Level {
  return {
    ...SLUICE_BRIDGE, maxGuardTier: 3, gold: 400, pools: [], bridges: [], bridgeDeck: [],
    entries: [{ id: "west", label: "入口", scenery: "trail", delay: 0, marker: [0, 5], route: [[0, 5], [21, 5]] }],
    plots: [[4, 6]],
    waves: [{ title: "拦截", groups: { west: [group] } }],
  };
}

test("the moose only kills interceptors in the marked area when its antlers land", () => {
  const game = new DefenseGame(defenseLane(["frost-moose", 1, 1]));
  assert(game.build(0, "guard-post"));
  assert(game.upgrade(0));
  assert(game.upgrade(0, "shield"));
  assert(game.setGuardRally(0, [4, 5]));
  assert(game.startFirstWave());
  until(game, () => game.enemies[0]?.melee?.style === "antler-sweep");
  const boss = game.enemies[0], attack = boss.melee!;
  const guards = game.guardPosts.get(0)!.guards;
  assert(guards.every(({ hp }) => hp > 0));
  while (game.time + STEP < attack.impact) game.tick(STEP);
  assert(!attack.hit);
  assert(guards.every(({ hp }) => hp > 0));
  const spared = guards.at(-1)!;
  spared.x = 10;
  spared.y = 5;
  game.tick(STEP);
  assert(attack.hit);
  assert(game.effects.some(({ kind }) => kind === "antler-sweep"));
  assert(guards.some(({ hp }) => hp === 0));
  assert(spared.hp > 0);
});

test("airborne enemies cross a fielded shield squad at full speed without enemy melee", () => {
  for (const type of ["moth", "wisp", "frost-owl", "cinder-bat", "frost-ray"] as const) {
    const game = new DefenseGame(defenseLane([type, 1, .8]));
    assert(game.build(0, "guard-post"));
    assert(game.upgrade(0));
    assert(game.upgrade(0, "shield"));
    assert(game.setGuardRally(0, [4, 5]));
    assert(game.startFirstWave());
    until(game, () => game.enemies[0]?.progress > 3.7);
    const enemy = game.enemies[0];
    const progress = enemy.progress;
    for (let i = 0; i < 60; i++) game.tick(STEP);
    assert(Math.abs(enemy.progress - progress - enemy.speed) < 1e-6);
    assert.equal(enemy.hp, enemy.maxHp);
    assert.equal(enemy.melee, undefined);
    assert(game.guardPosts.get(0)!.guards.every(guard => !guard.target && guard.hp === GUARD_BRANCHES.shield.health));
  }
});

test("idle spear guards throw at flying enemies without intercepting them", () => {
  const game = new DefenseGame(defenseLane(["cinder-bat", 1, .8]));
  assert(game.build(0, "guard-post"));
  assert(game.upgrade(0));
  assert(game.upgrade(0, "spear"));
  assert(game.setGuardRally(0, [4, 5]));
  assert(game.startFirstWave());
  const post = game.guardPosts.get(0)!;
  until(game, () => post.guards.some((guard) => guard.attack?.kind === "throw"));
  const thrower = post.guards.find((guard) => guard.attack?.kind === "throw")!;
  const windup = thrower.attack!;
  const enemy = game.enemies[0], progress = enemy.progress;
  assert.equal(windup.target, enemy);
  assert(game.time < windup.impact);
  assert.equal(game.projectiles.length, 0);
  game.paused = true;
  game.tick(1);
  assert.equal(windup.released, false);
  game.paused = false;
  until(game, () => windup.released);
  assert(game.time >= windup.impact);
  assert(game.projectiles.some((shot) => shot.kind === "guard-spear"));
  assert.equal(enemy.hp, enemy.maxHp);
  assert(Math.abs(thrower.nextThrow - game.time - SPEAR_THROW.interval) < 1e-6);
  until(game, () => enemy.hp < enemy.maxHp);
  assert.equal((enemy.maxHp - enemy.hp) % SPEAR_THROW.damage, 0);
  assert(enemy.progress > progress);
  assert(post.guards.every(guard => !guard.target && guard.hp === GUARD_BRANCHES.spear.health));
});

test("spear guards throw at ground targets outside personal aggro range and then engage", () => {
  const game = new DefenseGame(defenseLane(["guard", 1, .8]));
  assert(game.build(0, "guard-post"));
  assert(game.upgrade(0));
  assert(game.upgrade(0, "spear"));
  assert(game.setGuardRally(0, [3, 5]));
  for (let i = 0; i < 120; i++) game.tick(STEP);
  assert(game.startFirstWave());
  until(game, () => game.projectiles.some(shot => shot.kind === "guard-spear"));
  const enemy = game.enemies[0];
  assert.equal(enemy.hp, enemy.maxHp);
  const post = game.guardPosts.get(0)!;
  const engaged = post.guards.find(guard => guard.target === enemy);
  assert.equal(engaged, undefined);
  until(game, () => post.guards.some(guard => guard.target === enemy && guard.contactAt !== undefined));
  const progress = enemy.progress;
  game.tick(STEP);
  assert.equal(enemy.progress, progress);
  until(game, () => post.guards.some((guard) => guard.attack?.kind === "thrust"));
  const thrust = post.guards.find((guard) => guard.attack?.kind === "thrust")!.attack!;
  assert(game.time < thrust.impact);
  assert(!game.effects.some((effect) => effect.kind === "guard-strike"));
  until(game, () => thrust.released);
  assert(game.time >= thrust.impact);
  assert(game.effects.some((effect) => effect.kind === "guard-strike"));
});

test("the optional post occupies one plot and can be sold for 60 percent", () => {
  assert.equal(new DefenseGame(TUTORIAL_LEVEL).build(0, "guard-post"), false);
  const game = new DefenseGame(REED_BRIDGE);
  assert(game.build(7, "guard-post"));
  assert.equal(game.gold, REED_BRIDGE.gold - GUARD_POST.cost);
  assert(!game.build(7, "guard-post"));
  assert(!game.build(7, "arrow"));
  assert(!game.setGuardRally(7, [0, 0]));
  assert.equal(game.towerSaleValue(7), 51);
  assert.equal(game.sell(7), 51);
  assert.equal(game.guardPosts.size, 0);
  assert(game.build(7, "arrow"));
});

test("two guards fight separate enemies, letting other monsters pass and releasing on redeployment", () => {
  const game = new DefenseGame(REED_BRIDGE);
  assert(game.build(7, "guard-post"));
  assert(game.setGuardRally(7, [11, 6]));
  assert(game.startFirstWave());
  const post = game.guardPosts.get(7)!;
  const targets = () => post.guards.map((guard) => guard.target);
  until(game, () => targets().every(Boolean) && game.enemies.length > 2);
  const [first, second] = targets();
  assert(first && second && first !== second);
  const moving = game.enemies.find((enemy) => enemy !== first && enemy !== second)!;
  const before = moving.progress;
  const blocked = first.progress;
  game.tick(STEP);
  assert(moving.progress > before);
  assert.equal(first.progress, blocked);
  until(game, () => first.hp < first.maxHp);

  assert(game.setGuardRally(7, [12, 8]));
  assert.deepEqual(targets(), [null, null]);
  game.tick(STEP);
  assert(first.progress > blocked);
  until(game, () => post.guards.every((guard) => guard.path.length === 0));
  assert(post.guards.every((guard) => Math.hypot(guard.x - 12, guard.y - 8) < 0.4));
});

test("a defeated guard returns at the post after its tier's reinforcement delay", () => {
  const game = new DefenseGame(REED_BRIDGE);
  assert(game.build(7, "guard-post"));
  assert(game.setGuardRally(7, [11, 6]));
  assert(game.startFirstWave());
  const post = game.guardPosts.get(7)!;
  until(game, () => post.guards.some((guard) => guard.hp === 0));
  const guard = post.guards.find((candidate) => candidate.hp === 0)!;
  const defeatedAt = game.time;
  assert.equal(guard.respawnAt, defeatedAt + GUARD_POST.respawn);
  game.paused = true;
  game.tick(20);
  assert.equal(game.time, defeatedAt);
  assert.equal(guard.hp, 0);
  game.paused = false;
  until(game, () => guard.hp > 0);
  assert.equal(guard.hp, GUARD_POST.health);
  assert(game.time - defeatedAt >= GUARD_POST.respawn);
  assert(game.time - defeatedAt < GUARD_POST.respawn + STEP * 2);
  assert.deepEqual([guard.x, guard.y], post.origin);
});

test("posts share the construction plots and gain more deployment points after upgrading", () => {
  const game = new DefenseGame({ ...REED_BRIDGE, plots: [[6, 7], [1, 2]] });
  assert.deepEqual(game.buildOptions(0), ["arrow", "cannon", "frost", "guard-post"]);
  assert.deepEqual(game.buildOptions(1), ["arrow", "cannon", "frost"]);
  assert.deepEqual(game.buildOptions(2), []);
  assert(!game.build(1, "guard-post"));
  assert(!game.build(2, "guard-post"));
  assert.equal(game.gold, REED_BRIDGE.gold);
  assert(game.build(0, "guard-post"));
  assert.deepEqual(game.buildOptions(0), []);
  const post = game.guardPosts.get(0)!;
  assert.deepEqual(game.guardPoints(post.index), [[6, 6], [5, 6], [7, 6]]);
  assert(game.setGuardRally(post.index, [7, 6]));
  assert(!game.setGuardRally(post.index, [8, 6]));
  assert.equal(guardStats(post).reach, 1.5);
  assert(game.upgrade(post.index));
  assert.equal(guardStats(post).reach, 2.5);
  assert(game.setGuardRally(post.index, [8, 6]));
  assert(!game.setGuardRally(post.index, [18, 8]));
  assert(!game.setGuardRally(post.index, [7, 8]));
  assert.equal(post.guards.length, GUARD_UPGRADE.squad);
  assert(!game.upgrade(post.index));
  assert.equal(game.gold, REED_BRIDGE.gold - GUARD_POST.cost - GUARD_UPGRADE.cost);
  assert.equal(game.sell(post.index), 96);
});

test("a close road is a deployment option only if it can be reached", () => {
  const island = {
    ...REED_BRIDGE,
    width: 4,
    height: 3,
    pools: [[1, 0], [1, 1], [1, 2]] as const,
    bridges: [],
  };
  const route = createRoute([[2, 0], [2, 2]]);
  assert.deepEqual(guardRallyPoints([0, 1], [route], guardPathfinder(island), 2.5), []);
  const connected = { ...island, bridges: [{ from: [1, 1], to: [2, 1] }] } as const;
  assert.deepEqual(guardRallyPoints([0, 1], [route], guardPathfinder(connected), 2.5), [[2, 1]]);
});

test("guard paths invest separately and keep wounded or returning guards consistent", () => {
  for (const path of ["shield", "spear"] as const) {
    const game = new DefenseGame({ ...SLUICE_BRIDGE, maxGuardTier: 3 });
    const index = SLUICE_BRIDGE.plots.findIndex(([x, y]) => x === 11 && y === 5);
    assert(game.build(index, "guard-post"));
    const post = game.guardPosts.get(index)!;
    assert(!game.upgrade(post.index, path));
    assert(game.upgrade(post.index));
    assert(!game.upgrade(post.index));
    const [wounded, returning] = post.guards;
    const stageTwoPoints = game.guardPoints(post.index).length;
    wounded.hp -= 12;
    returning.hp = 0;
    returning.respawnAt = game.time + 3;
    const branch = GUARD_BRANCHES[path];
    assert(game.upgrade(post.index, path));
    assert.equal(post.tier, 3);
    assert.equal(post.branch, path);
    assert.equal(wounded.hp, branch.health - 12);
    assert.equal(returning.hp, 0);
    assert.equal(returning.respawnAt, game.time + branch.respawn / 2);
    assert.equal(post.guards.length, branch.squad);
    assert.equal(guardStats(post).reach, branch.reach);
    assert(game.guardPoints(post.index).length >= stageTwoPoints);
    if (path === "spear") assert(game.guardPoints(post.index).length > stageTwoPoints);
    assert(!game.upgrade(post.index, path));
    assert.equal(game.sell(post.index), Math.floor((GUARD_POST.cost + GUARD_UPGRADE.cost + branch.cost) * 0.6));
  }
  const demo = new DefenseGame(REED_BRIDGE);
  assert(demo.build(7, "guard-post"));
  assert(demo.upgrade(7));
  assert(!demo.upgrade(7, "shield"));
});

test("posts built on shared plots have independent ownership and resale", () => {
  const game = new DefenseGame(SLUICE_BRIDGE);
  for (const index of [5, 0, 1]) assert(game.build(index, "guard-post"));
  const left = game.guardPosts.get(0)!, right = game.guardPosts.get(1)!;
  assert.deepEqual([...game.guardPosts.keys()], [5, left.index, right.index]);
  assert(!game.build(5, "arrow"));
  assert(!game.build(left.index, "guard-post"));
  assert.equal(game.sell(left.index), 51);
  assert.equal(game.guardPosts.get(right.index), right);
  assert(game.upgrade(5));
  assert.equal(game.guardPosts.get(5)?.tier, 2);
  assert.equal(right.tier, 1);
  assert.equal(game.sell(5), 96);
  assert(game.build(5, "arrow"));
  assert.equal(game.guardPosts.size, 1);
  game.reset();
  assert.equal(game.guardPosts.size, 0);
});

test("overlapping posts assign live interceptors to distinct enemies", () => {
  const game = new DefenseGame({
    ...SLUICE_BRIDGE,
    waves: [{ title: "Overlap", groups: { west: [["slime", 12, 0.48, 4]] } }],
  });
  for (const index of [5, 6]) {
    assert(game.build(index, "guard-post"));
    assert(game.setGuardRally(index, [11, 6]));
  }
  assert(game.startFirstWave());
  const guards = [...game.guardPosts.values()].flatMap((post) => post.guards);
  const engaged = () => guards.filter((guard) => guard.contactAt !== undefined && guard.target);
  until(game, () => engaged().length >= 3);
  const targets = engaged().map((guard) => guard.target);
  assert.equal(new Set(targets).size, targets.length);
  assert.equal(game.sell(5), 51);
  assert(game.guardPosts.get(6)?.guards.some((guard) => guard.target));
});

test("a counterattack damages the guard only on impact and selling cancels the next windup", () => {
  const game = new DefenseGame(REED_BRIDGE);
  assert(game.build(7, "guard-post"));
  assert(game.setGuardRally(7, [11, 6]));
  assert(game.startFirstWave());
  const post = game.guardPosts.get(7)!;
  until(game, () => post.guards.some((guard) => guard.target?.melee?.style === "pounce"));
  const guard = post.guards.find((candidate) => candidate.target?.melee)!;
  const foe = guard.target!;
  const attack = foe.melee!;
  assert(game.time < attack.impact && guard.hp === GUARD_POST.health);
  until(game, () => attack.hit);
  assert(game.time >= attack.impact && guard.hp < GUARD_POST.health);
  assert(game.effects.some((effect) => effect.kind === "guard-hit" && effect.melee === "pounce"));
  until(game, () => post.guards.some((unit) => unit.target?.melee && !unit.target.melee.hit));
  const preparing = post.guards.find((unit) => unit.target?.melee && !unit.target.melee.hit)!.target!;
  const waiting = preparing.melee!;
  assert.equal(game.sell(7), 51);
  assert.equal(preparing.melee, undefined);
  until(game, () => game.time > waiting.impact);
  assert(!waiting.hit);
});

test("a closed-shell weir surge damages guards from two posts and emits one wave", () => {
  const game = new DefenseGame({
    ...SLUICE_BRIDGE,
    waves: [{ title: "Surge", groups: { west: [["weir-turtle", 1, 0.85]] } }],
  });
  for (const index of [5, 6]) {
    assert(game.build(index, "guard-post"));
    assert(game.setGuardRally(index, [11, 6]));
  }
  assert(game.startFirstWave());
  until(game, () => game.enemies.some((enemy) => enemy.melee?.style === "surge" && !enemy.melee.hit));
  const boss = game.enemies[0];
  const attack = boss.melee!;
  until(game, () => attack.hit);
  for (const post of game.guardPosts.values())
    assert(post.guards.some((guard) => guard.hurtAt === game.time));
  assert.equal(game.effects.filter((effect) => effect.kind === "weir-surge").length, 1);
  for (const index of game.guardPosts.keys()) assert(game.sell(index));
  const fullSpeedFrom = boss.progress;
  game.tick(STEP);
  const fullSpeed = boss.progress - fullSpeedFrom;
  const rageFrom = boss.progress;
  boss.hp = boss.maxHp / 2;
  game.tick(STEP);
  assert(Math.abs((boss.progress - rageFrom) / fullSpeed - 1.28) < 1e-7);
  assert(game.effects.some((effect) => effect.kind === "enemy-windup" && effect.enemy === "weir-turtle"));
});

test("slime contacts follow its landing frame and a defeated slime keeps its last pose", () => {
  const game = new DefenseGame(REED_BRIDGE);
  assert(game.startFirstWave());
  until(game, () => game.effects.some((effect) => effect.kind === "enemy-step"));
  const step = game.effects.find((effect) => effect.kind === "enemy-step")!;
  const slime = game.enemies[0];
  assert.equal(step.enemy, "slime");
  assert.equal(Math.floor(slime.walk) % 4, 0);
  slime.hp = 0;
  game.tick(STEP);
  const defeat = game.effects.find((effect) => effect.kind === "pop");
  assert.equal(defeat?.fallen, slime);
  assert.equal(defeat?.enemy, "slime");
});

test("merged talon griffin blocks up to three nearby enemies simultaneously", () => {
  const game = new DefenseGame({
    ...REED_BRIDGE,
    gold: 1000,
    maxGuardTier: 4,
    towers: [...REED_BRIDGE.towers, "griffin-roost"],
    plots: [[4, 4]],
    pools: [],
    bridges: [],
    entries: [{ id: "north", label: "北路", scenery: "trail", delay: 0, marker: [0, 5], route: [[0, 5], [10, 5]] }],
    waves: [{ title: "测试", groups: { north: [["slime", 4, 0.25]] } }],
  }, ["griffin-roost"]);
  assert(game.build(0, "griffin-roost"));
  assert(game.upgrade(0));
  assert(game.upgrade(0, "talon"));
  const post = game.guardPosts.get(0)!;
  assert.equal(post.guards.length, 1);
  assert(game.startFirstWave());
  const [griffin] = post.guards;
  until(game, () => (griffin.extraTargets?.length ?? 0) === 2);
  const pinned = [griffin.target!, ...griffin.extraTargets!];
  assert.equal(pinned.length, 3);
  const before = pinned.map((e) => e.progress);
  game.tick(STEP);
  assert.deepEqual(pinned.map((e) => e.progress), before);
});

test("all three interceptor buildings record builtAt for construction animations", () => {
  for (const type of ["guard-post", "griffin-roost", "frost-kennel"] as const) {
    const game = new DefenseGame({
      ...defenseLane(["slime", 1, 1]),
      towers: ["guard-post", "griffin-roost", "frost-kennel"],
      gold: 500,
    }, [type]);
    game.tick(0.25);
    assert(game.build(0, type));
    const post = game.guardPosts.get(0)!;
    assert.equal(post.builtAt, game.time);
  }
});

test("interceptor units target by their own aggro radius independent of tower origin reach and move at seekSpeed", () => {
  const lane = {
    ...defenseLane(["guard", 1, 1]),
    towers: ["guard-post", "griffin-roost", "frost-kennel"] as const,
    gold: 500,
    plots: [[8, 6] as const],
  };
  const game = new DefenseGame(lane, ["guard-post"]);
  assert(game.build(0, "guard-post"));
  assert(game.upgrade(0));
  // Rally at [6, 5] (distance 2.24 from origin [8, 6], near tier-2 reach 2.5).
  assert(game.setGuardRally(0, [6, 5]));
  const post = game.guardPosts.get(0)!;
  const stats = guardStats(post);
  assert(stats.seekSpeed < stats.speed);
  // Let guards settle on station around [6, 5].
  for (let i = 0; i < 180; i++) game.tick(STEP);
  assert(game.startFirstWave());
  // Wait until the enemy reaches ~4.6 (dist from origin [8,6] is ~3.54 > reach 2.5,
  // yet inside the unit's personal aggro radius 1.75 around [6, 5]!).
  until(game, () => post.guards.some((g) => g.target !== null));
  const pursuer = post.guards.find((g) => g.target !== null)!;
  const foe = pursuer.target!;
  const distFromTowerOrigin = Math.hypot(foe.x - post.origin[0], foe.y - post.origin[1]);
  const distFromUnit = Math.hypot(foe.x - pursuer.x, foe.y - pursuer.y);
  assert(distFromTowerOrigin > stats.reach, `expected enemy (${distFromTowerOrigin.toFixed(2)}) outside tower reach (${stats.reach})`);
  assert(distFromUnit <= stats.aggro + 0.05, `expected enemy (${distFromUnit.toFixed(2)}) inside unit aggro (${stats.aggro})`);
  // Verify controlled pursuit speed matches seekSpeed rather than full redeployment speed.
  const startX = pursuer.x, startY = pursuer.y;
  game.tick(STEP);
  const moved = Math.hypot(pursuer.x - startX, pursuer.y - startY);
  assert(moved > 0, "expected pursuer to advance toward enemy");
  assert(moved <= stats.seekSpeed * STEP + 1e-6, `moved ${moved} exceeded seekSpeed step ${stats.seekSpeed * STEP}`);
  assert(moved < stats.speed * STEP * 0.85, "seeking speed should stay meaningfully slower than march speed");
});

test("interceptor units regenerate health out of combat after the delay and stop regenerating when hurt", () => {
  for (const type of ["guard-post", "griffin-roost", "frost-kennel"] as const) {
    const game = new DefenseGame({
      ...defenseLane(["slime", 1, 1]),
      towers: ["guard-post", "griffin-roost", "frost-kennel"],
      gold: 500,
    }, [type]);
    assert(game.build(0, type));
    const post = game.guardPosts.get(0)!;
    const guard = post.guards[0];
    const maxHp = GUARD_BUILDINGS[type].base.health;
    // Simulate a guard leaving combat with half HP at t = 1.0.
    for (let i = 0; i < 60; i++) game.tick(STEP);
    guard.hp = Math.round(maxHp * 0.5);
    guard.hurtAt = game.time;
    guard.combatAt = game.time;
    const woundedHp = guard.hp;
    // Should NOT heal before GUARD_REGEN.delay (3.0s).
    for (let i = 0; i < Math.floor((GUARD_REGEN.delay - 0.15) / STEP); i++) game.tick(STEP);
    assert.equal(guard.hp, woundedHp, `${type} should not heal before out-of-combat delay`);
    // Advance past delay + 2 seconds: should visibly recover health.
    for (let i = 0; i < Math.ceil(2.2 / STEP); i++) game.tick(STEP);
    assert(guard.hp > woundedHp + maxHp * 0.12, `${type} should recover HP after out-of-combat delay`);
    assert(guard.healedAt !== undefined && game.time - guard.healedAt < 0.1);
    // Advance until full HP and ensure it caps cleanly at maxHp.
    for (let i = 0; i < Math.ceil(12 / STEP); i++) game.tick(STEP);
    assert.equal(guard.hp, maxHp, `${type} should cap out-of-combat regen at maxHp`);
  }
});

test("frost mammoth triggers twin-foot quake AoE only when engaging blockers, respects cooldown, and spares airborne griffins", () => {
  // 1. Without any blockers, frost-mammoth marches without ever triggering quake.
  const soloGame = new DefenseGame({
    ...defenseLane(["frost-mammoth", 1, 0.2]),
    towers: ["guard-post", "griffin-roost"],
    gold: 600,
  });
  assert(soloGame.startFirstWave());
  for (let i = 0; i < 180; i++) {
    soloGame.tick(STEP);
    const mammoth = soloGame.enemies[0];
    assert.notEqual(mammoth?.melee?.style, "quake", "mammoth must not trigger quake without engaging blockers");
    assert(!soloGame.effects.some((e) => e.kind === "mammoth-quake"));
  }

  // 2. With two ground guard posts at the same rally point + an airborne griffin hovered above,
  // engaging frost-mammoth triggers quake AoE hitting both ground posts while sparing flying griffins.
  const game = new DefenseGame({
    ...defenseLane(["frost-mammoth", 1, 0.2]),
    plots: [[4, 6], [4, 4], [8, 6]],
    towers: ["guard-post", "griffin-roost"],
    gold: 900,
  }, ["guard-post", "griffin-roost"]);
  assert(game.build(0, "guard-post"));
  assert(game.build(1, "guard-post"));
  assert(game.build(2, "griffin-roost"));
  assert(game.setGuardRally(0, [4, 5]));
  assert(game.setGuardRally(1, [4, 5]));
  assert(game.setGuardRally(2, [8, 5]));
  assert(game.startFirstWave());

  until(game, () => game.enemies.some((e) => e.type === "frost-mammoth" && e.melee?.style === "quake" && !e.melee.hit));
  const mammoth = game.enemies.find((e) => e.type === "frost-mammoth")!;
  const firstQuake = mammoth.melee!;
  assert.equal(firstQuake.style, "quake");
  assert(firstQuake.targetGuard, "quake should record the primary attacked blocker");
  const primary = firstQuake.targetGuard!;

  // Snapshot HP of all ground guards right before quake impact so we can verify primary 100% vs splash 80%.
  const baseHp = 120;
  const groundGuards = [0, 1].flatMap((idx) => game.guardPosts.get(idx)!.guards);
  for (const g of groundGuards) g.hp = baseHp;

  // Keep griffin hovered in midair right next to the mammoth to verify ground-only AoE.
  const roost = game.guardPosts.get(2)!;
  for (const g of roost.guards) {
    g.x = mammoth.x + 0.4;
    g.y = mammoth.y;
    if (g.flight) g.flight.height = 1;
  }

  // Wait for twin-foot slam impact.
  until(game, () => firstQuake.hit);
  assert.equal(game.effects.filter((e) => e.kind === "mammoth-quake").length, 1);

  // Primary blocker takes full 100% quake damage (92); other grounded blockers in AoE take 80% (Math.round(92 * 0.8) = 74).
  const primaryDamage = baseHp - primary.hp;
  const splashGuards = groundGuards.filter((g) => g !== primary && g.hurtAt === game.time);
  assert.equal(primaryDamage, 92, "primary target should take full 100% quake damage");
  assert(splashGuards.length >= 1, "at least one other grounded guard in AoE should take splash quake damage");
  for (const other of splashGuards) {
    const splashDamage = baseHp - other.hp;
    assert.equal(splashDamage, Math.round(92 * 0.8), "other ground blockers in AoE should take 80% quake damage");
    assert(splashDamage < primaryDamage, "splash damage should be strictly lower than primary target damage");
  }
  // Both ground guard posts should have at least one unit damaged by the AoE slam at the exact impact tick.
  for (const idx of [0, 1]) {
    const post = game.guardPosts.get(idx)!;
    assert(post.guards.some((g) => g.hurtAt === game.time), `ground post ${idx} should take quake AoE damage`);
  }
  // Airborne griffins high in flight are spared from the ground quake.
  assert(roost.guards.every((g) => g.hurtAt < game.time),
    "airborne griffins should not be damaged by ground quake");

  // During quake cooldown, subsequent melee falls back to regular stomp.
  until(game, () => mammoth.melee !== firstQuake && mammoth.melee !== undefined);
  assert.equal(mammoth.melee!.style, "stomp", "mammoth should use regular stomp while quake is on cooldown");
});
