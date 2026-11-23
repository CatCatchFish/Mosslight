import { FROST_FORD } from "../src/content/levels/frost-ford.ts";
import { planFormation } from "../src/engine/formation.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { FIELD_LEVEL } from "../src/content/levels/emerald-woods.ts";
import { TUTORIAL_LEVEL } from "../src/content/levels/forest-outpost.ts";
import { PINE_CREEK } from "../src/content/levels/pine-creek.ts";
import { REED_BRIDGE } from "../src/content/levels/reed-bridge.ts";
import { SLUICE_BRIDGE } from "../src/content/levels/sluice-bridge.ts";
import { OCHRE_MINE } from "../src/content/levels/ochre-mine.ts";
import { ENEMIES } from "../src/content/enemies.ts";
import { DefenseGame } from "../src/engine/defense.ts";
import { applySlow } from "../src/engine/enemy-abilities.ts";
import { createRoute } from "../src/engine/route.ts";
import type { TowerId } from "../src/engine/types.ts";

function advance(game: DefenseGame, frames: number) {
  for (let i = 0; i < frames; i++) game.tick(1 / 60);
}

function finishWave(game: DefenseGame) {
  for (let i = 0; game.phase === "active" && i < 12000; i++) game.tick(1 / 60);
  assert.notEqual(game.phase, "active", "wave failed to settle");
}

test("tutorial waits for the first tower and is winnable without upgrades", () => {
  const game = new DefenseGame(TUTORIAL_LEVEL);
  advance(game, 120);
  assert.equal(game.time, 0);
  assert.equal(game.release("north", true), false);
  assert(!game.startFirstWave());
  assert(!game.build(0, "ember"));
  assert(game.build(0, "arrow"));
  assert.equal(game.upgrade(0), false);
  const before = game.gold;
  advance(game, 60 * 240);
  assert(game.awaitingFirstWave);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.seconds("north"), 0);
  assert.equal(game.reward("north"), 0);
  assert(!game.release("north", true));
  assert(game.startFirstWave());
  assert.equal(game.gold, before);
  assert.deepEqual([...game.encountered], []);
  advance(game, 30);
  assert.deepEqual([...game.encountered], ["slime"]);
  finishWave(game);
  const kill = (type: keyof typeof ENEMIES) =>
    Math.max(1, Math.round(ENEMIES[type].reward * (TUTORIAL_LEVEL.killRewardScale ?? 1)));
  assert.equal(game.gold - before, 6 * kill("slime") + 50);

  assert(game.build(3, "frost"));
  assert(game.release("north", true));
  const secondWaveGold = game.gold;
  finishWave(game);
  assert.equal(game.gold - secondWaveGold, 6 * kill("runner") + 2 * kill("slime") + 55);
  assert(game.build(4, "cannon"));
  assert(game.release("north", true));
  const thirdWaveGold = game.gold;
  finishWave(game);
  assert.equal(game.gold - thirdWaveGold, 7 * kill("slime") + 5 * kill("runner") + 40);
  assert(game.release("north", true));
  finishWave(game);
  assert(game.release("north", true));
  finishWave(game);
  assert.equal(game.phase, "won");
  assert.equal(game.health, TUTORIAL_LEVEL.health);
  assert.deepEqual([...game.encountered], ["slime", "runner"]);
  game.reset();
  assert.equal(game.encountered.size, 0);
});

test("both new forest stages can earn three stars with basic towers and normal dispatch", () => {
  const plans = [
    {
      level: PINE_CREEK,
      deployments: [
        [[2, "arrow"], [4, "cannon"]],
        [[7, "frost"]],
        [[8, "cannon"]],
        [[6, "arrow"], [5, "arrow"]],
        [],
        [],
      ],
    },
    {
      level: REED_BRIDGE,
      deployments: [
        [[7, "cannon"], [8, "arrow"]],
        [[9, "frost"]],
        [[11, "cannon"], [12, "arrow"]],
        [[6, "arrow"], [13, "cannon"]],
        [[5, "arrow"], [10, "frost"]],
        [],
        [],
      ],
    },
  ] as const;
  for (const { level, deployments } of plans) {
    const game = new DefenseGame(level);
    for (const [index, purchases] of deployments.entries()) {
      for (const [plot, type] of purchases) assert(game.build(plot, type));
      if (index === 0) {
        assert(game.startFirstWave());
      } else {
        for (let frame = 0; game.phase === "ready" && frame < 3600; frame++)
          game.tick(1 / 60);
      }
      assert.equal(game.wave, index + 1);
      finishWave(game);
    }
    assert.equal(game.phase, "won");
    assert(game.health >= Math.ceil(level.health * 0.8));
    assert(game.encountered.has("pine-hopper") && game.encountered.has("stump-spirit"));
    assert.equal(game.encountered.has("moss-badger"), level.id === "03");
  }
});

test("the reed bridge allows tier two and rejects specialization without spending gold", () => {
  const game = new DefenseGame(REED_BRIDGE);
  assert(game.build(7, "arrow"));
  assert(game.upgrade(7));
  assert.equal(game.towers.get(7)?.tier, 2);
  const balance = game.gold;
  assert(!game.upgrade(7));
  assert(!game.upgrade(7, "sniper"));
  assert.equal(game.gold, balance);
  assert.equal(game.towerSaleValue(7), 81);
});

test("the river crossing applies authored wave health and movement speed", () => {
  const game = new DefenseGame(REED_BRIDGE);
  assert(game.startFirstWave());
  advance(game, 20);
  const enemy = game.enemies[0];
  assert.equal(enemy.type, "slime");
  assert.equal(enemy.maxHp, Math.round(ENEMIES.slime.hp * (REED_BRIDGE.waves[0].hp ?? 1)));
  const before = enemy.progress;
  advance(game, 60);
  assert(Math.abs(enemy.progress - before - ENEMIES.slime.speed * 1.03) < 1e-7);
  assert(!game.encountered.has("reed-crab"));
});

test("selling returns 60 percent of each tier's investment and frees the plot", () => {
  const game = new DefenseGame({ ...FIELD_LEVEL, gold: 500 });
  const initial = game.gold;
  assert(game.build(0, "arrow"));
  assert.equal(game.towerSaleValue(0), 42);
  assert(game.upgrade(0));
  assert.equal(game.towerSaleValue(0), 81);
  assert(!game.upgrade(0, "volley"));
  assert(game.upgrade(0));
  assert.equal(game.towerSaleValue(0), 114);
  assert(!game.upgrade(0, "invalid-branch"));
  assert(game.upgrade(0, "volley"));
  assert.equal(game.towers.get(0)?.tier, 4);
  assert(!game.upgrade(0, "sniper"));
  assert.equal(game.towerSaleValue(0), 177);
  assert.equal(game.sell(0), 177);
  assert.equal(game.sell(0), null);
  assert.equal(game.gold, initial - 295 + 177);

  assert(game.build(0, "frost"));
  assert(game.startFirstWave());
  assert.equal(game.sell(0), 54);
  assert(game.build(0, "arrow"));
  assert.equal(game.towers.get(0)?.tier, 1);
});

test("a boss breach ends the battle immediately with core health remaining", () => {
  const game = new DefenseGame({
    ...FIELD_LEVEL,
    entries: [{ ...FIELD_LEVEL.entries[0], route: [[0, 4], [2, 4]] }],
    waves: [{ title: "Boss", groups: { north: [["chief", 1, 1]] } }],
  });
  assert(game.startFirstWave());
  finishWave(game);
  assert.equal(game.phase, "lost");
  assert.equal(game.breachingBoss, "chief");
  assert.equal(game.health, FIELD_LEVEL.health);
  assert.equal(game.gold, FIELD_LEVEL.gold);
  const time = game.time;
  advance(game, 60);
  assert.equal(game.time, time);
  game.reset();
  assert.equal(game.breachingBoss, null);
});

test("gates run independently and pausing freezes the timer", () => {
  const game = new DefenseGame(FIELD_LEVEL);
  assert(game.build(4, "arrow"));
  assert(game.build(5, "cannon"));
  const start = game.gold;
  advance(game, 60 * 90);
  assert(game.awaitingFirstWave);
  assert(game.startFirstWave());
  assert.equal(game.gold, start);
  assert(!game.startFirstWave());
  finishWave(game);
  const reward = game.reward("south");
  const beforeRelease = game.gold;
  assert.deepEqual(game.release("south", true), { bonus: reward });
  assert.equal(game.gold, beforeRelease + reward);
  assert.equal(game.release("south", true), false);
  assert(game.pending.has("north"));
  game.paused = true;
  const before = game.seconds("north");
  advance(game, 600);
  assert.equal(game.seconds("north"), before);
  game.paused = false;
  advance(game, before * 60 + 1);
  assert(!game.pending.has("north"));
  assert(game.gold >= beforeRelease + reward);
});

type Purchase = ["build", number, TowerId] | ["upgrade", number, string?];

test("the emerald woods can earn three stars with the slow caps and the new boss", () => {
  const game = new DefenseGame(FIELD_LEVEL);
  assert(game.build(4, "arrow"));
  assert(game.build(5, "cannon"));
  assert(game.upgrade(4));
  const purchases: Purchase[] = [
    ["build", 7, "frost"],
    ["build", 2, "cannon"],
    ["upgrade", 4],
    ["upgrade", 4, "sniper"],
    ["upgrade", 5],
    ["build", 6, "arrow"],
    ["upgrade", 7],
    ["upgrade", 2],
    ["upgrade", 5],
    ["upgrade", 5, "blast"],
    ["build", 9, "cannon"],
    ["upgrade", 2],
    ["upgrade", 2, "quake"],
    ["upgrade", 9],
    ["upgrade", 7],
    ["upgrade", 7, "chill"],
    ["upgrade", 9],
    ["upgrade", 9, "blast"],
    ["build", 10, "arrow"],
    ["upgrade", 6],
    ["upgrade", 10],
    ["upgrade", 6],
    ["upgrade", 6, "volley"],
    ["upgrade", 10],
    ["upgrade", 10, "sniper"],
  ];
  for (let wave = 1; wave <= FIELD_LEVEL.waves.length; wave++) {
    if (wave === 1) assert(game.startFirstWave());
    else
      for (let frame = 0; game.phase === "ready" && frame < 3600; frame++) game.tick(1 / 60);
    finishWave(game);
    assert.notEqual(game.phase, "lost");
    if (wave < FIELD_LEVEL.waves.length) assert(!game.encountered.has("chief"));
    while (purchases.length) {
      const [action, plot, choice] = purchases[0];
      const completed =
        action === "build"
          ? game.build(plot, choice)
          : game.upgrade(plot, choice);
      if (!completed) break;
      purchases.shift();
    }
  }
  assert.equal(game.phase, "won");
  assert.equal(game.wave, FIELD_LEVEL.waves.length);
  assert(game.health >= Math.ceil(FIELD_LEVEL.health * 0.8));
  assert(game.encountered.has("chief"));
});

test("mixed squads keep their pauses and faster units overtake slower units", () => {
  const plan = planFormation([
    ["runner", 8, 0.2],
    ["guard", 2, 0.45],
  ]);
  assert.deepEqual(
    plan.arrivals.map((unit) => unit.batch),
    [1, 1, 1, 2, 2, 2, 3, 3, 4, 4],
  );
  assert.equal(plan.batches, 4);
  assert(plan.arrivals[3].at - plan.arrivals[2].at > 1.35);
  assert.notEqual(plan.arrivals[0].lateral, plan.arrivals[1].lateral);

  const game = new DefenseGame({
    ...FIELD_LEVEL,
    waves: [{ title: "Mixed arrival", groups: { north: [["guard", 2, 0.55], ["runner", 3, 0.55]] } }],
  });
  assert(game.startFirstWave());
  advance(game, 20);
  const lead = game.enemies[0];
  assert.equal(lead.type, "guard");
  applySlow(lead, 0.2, 10);
  advance(game, 160);
  const second = game.enemies[1];
  const runner = game.enemies[2];
  assert.equal(game.deployment("north")?.batch, 2);
  assert.equal(second.type, "guard");
  assert.equal(runner.type, "runner");
  assert(second.progress > lead.progress);
  const before = runner.progress;
  advance(game, 120);
  assert(Math.abs(runner.progress - before - ENEMIES.runner.speed * 2) < 1e-7);
  assert(runner.progress > second.progress);
  assert.equal(runner.facing, "east");
  advance(game, 45);
  assert.equal(runner.facing, "south");
});

test("offset march paths are distinct and continuous through a corner", () => {
  const route = createRoute([[0, 0], [4, 0], [4, 4]]);
  assert.deepEqual(route.at(2, 0.4), { x: 2, y: 0.4 });
  assert.deepEqual(route.at(2, -0.4), { x: 2, y: -0.4 });
  const before = route.at(4 - 0.00001, 0.4);
  const after = route.at(4 + 0.00001, 0.4);
  assert(Math.hypot(after.x - before.x, after.y - before.y) < 0.0001);
  assert.deepEqual(route.at(6, 0.4), { x: 3.6, y: 2 });
});

test("turrets choose different headings as targets move, and shots keep their launch heading", () => {
  const game = new DefenseGame(FIELD_LEVEL);
  game.build(1, "cannon");
  game.build(2, "frost");
  assert(game.startFirstWave());
  const orientations = new Set();
  for (let i = 0; i < 1000; i++) {
    game.tick(1 / 60);
    const cannon = game.towers.get(1);
    assert(cannon);
    for (const shot of game.projectiles) {
      if (shot.age !== 0 || shot.kind !== "cannon") continue;
      assert.equal(shot.heading, cannon.heading);
      orientations.add(shot.heading);
    }
  }
  assert(orientations.size >= 3);
  assert.equal(game.towers.get(2)?.heading, 6);
});

test("the sluice bridge clears with capped guard posts and third-tier towers", () => {
  for (const early of [false, true]) {
    const game = new DefenseGame(SLUICE_BRIDGE);
    assert(game.build(10, "guard-post"));
    assert(game.build(5, "cannon"));
    assert(game.build(6, "arrow"));
    const purchases = [
      () => game.upgrade(10), () => game.build(9, "frost"),
      () => game.upgrade(5), () => game.upgrade(6), () => game.upgrade(5),
      () => game.upgrade(9), () => game.upgrade(6),
      () => game.build(13, "cannon"), () => game.upgrade(13),
      () => game.build(14, "arrow"), () => game.upgrade(14),
      () => game.build(7, "cannon"), () => game.upgrade(7),
      () => game.build(15, "cannon"), () => game.upgrade(15),
    ];
    assert(game.startFirstWave());
    for (let wave = 0; wave < SLUICE_BRIDGE.waves.length; wave++) {
      if (wave > 0 && early) for (const entry of SLUICE_BRIDGE.entries) assert(game.release(entry.id, true));
      if (wave > 0 && !early) for (let frame = 0; game.phase === "ready" && frame < 3600; frame++) game.tick(1 / 60);
      finishWave(game);
      while (purchases.length && !game.ended && purchases[0]()) purchases.shift();
    }
    assert.equal(game.phase, "won");
    assert(game.health >= Math.ceil(SLUICE_BRIDGE.health * 0.8));
    assert.equal(game.guardPosts.get(10)?.tier, 2);
    assert(game.encountered.has("weir-frog") && game.encountered.has("ferry-snail") && game.encountered.has("weir-turtle"));
  }
});

test("the mine can earn three stars at normal dispatch with armor piercing and a spear squad", () => {
  const game = new DefenseGame(OCHRE_MINE, ["arrow", "cannon", "frost", "ballista", "guard-post"]);
  for (const [plot, type] of [[3, "arrow"], [4, "arrow"], [5, "cannon"], [13, "arrow"], [7, "arrow"], [2, "arrow"]] as const)
    assert(game.build(plot, type));
  const purchases = [
    () => game.upgrade(5), () => game.upgrade(4), () => game.upgrade(13),
    () => game.build(6, "guard-post"), () => game.upgrade(6),
    () => game.upgrade(5), () => game.upgrade(5, "blast"), () => game.upgrade(4),
    () => game.upgrade(4, "volley"), () => game.upgrade(6, "spear"),
    () => game.build(8, "ballista"), () => game.upgrade(8), () => game.upgrade(8), () => game.upgrade(8, "piercer"),
    () => game.upgrade(13), () => game.upgrade(13, "volley"), () => game.build(10, "cannon"), () => game.upgrade(10),
    () => game.upgrade(10), () => game.upgrade(10, "blast"), () => game.build(9, "ballista"), () => game.upgrade(9),
    () => game.upgrade(9), () => game.upgrade(9, "piercer"), () => game.build(14, "frost"), () => game.upgrade(14),
    () => game.upgrade(14), () => game.upgrade(14, "chill"),
  ];
  assert(game.startFirstWave());
  let hitBat = false;
  for (let wave = 0; wave < OCHRE_MINE.waves.length; wave++) {
    for (let frame = 0; game.phase === "ready" && frame < 3600; frame++) game.tick(1 / 60);
    assert.equal(game.wave, wave + 1);
    for (let frame = 0; game.phase === "active" && frame < 12000; frame++) {
      game.tick(1 / 60);
      hitBat ||= game.effects.some(effect => effect.kind === "guard-spear" && effect.enemy === "cinder-bat");
    }
    assert.notEqual(game.phase, "active");
    while (purchases.length && !game.ended && purchases[0]()) purchases.shift();
  }
  assert.equal(game.phase, "won");
  assert(game.health >= Math.ceil(OCHRE_MINE.health * 0.8));
  assert(game.encountered.has("lamp-mole") && game.encountered.has("slag-cart") && hitBat);
});

test("frost ford is winnable with the new towers and a mixed defense", () => {
  const game = new DefenseGame(FROST_FORD);
  assert(game.build(6, "storm"));
  assert(game.build(7, "ballista"));
  assert(game.build(4, "ember"));
  const purchases: Purchase[] = [
    ["upgrade", 6],
    ["upgrade", 7],
    ["build", 5, "cannon"],
    ["upgrade", 4],
    ["upgrade", 6],
    ["upgrade", 6, "fork"],
    ["upgrade", 7],
    ["upgrade", 7, "piercer"],
    ["upgrade", 5],
    ["build", 3, "frost"],
    ["upgrade", 5],
    ["upgrade", 5, "blast"],
    ["upgrade", 3],
    ["upgrade", 4],
    ["upgrade", 4, "wildfire"],
    ["build", 8, "ballista"],
    ["upgrade", 8],
    ["upgrade", 3],
    ["upgrade", 3, "chill"],
    ["upgrade", 8],
    ["upgrade", 8, "repeater"],
    ["build", 9, "storm"],
    ["upgrade", 9],
  ];
  assert(game.startFirstWave());
  for (let i = 0; i < FROST_FORD.waves.length; i++) {
    if (i > 0)
      for (const gate of FROST_FORD.entries)
        assert(game.release(gate.id, true));
    finishWave(game);
    assert.notEqual(game.phase, "lost");
    while (purchases.length) {
      const [action, index, arg] = purchases[0];
      if (
        !(action === "build"
          ? game.build(index, arg)
          : game.upgrade(index, arg))
      )
        break;
      purchases.shift();
    }
  }
  assert.equal(game.phase, "won");
  assert(game.encountered.has("wisp") && game.encountered.has("ram"));
});

test("lightning hits a second enemy and the ember suppresses frozen wisp healing", () => {
  const game = new DefenseGame({
    ...FROST_FORD,
    waves: [{ title: "霜灯", groups: { north: [["wisp", 4, 0.6, 2]] } }],
  });
  assert(game.build(0, "ember"));
  assert(game.build(1, "storm"));
  assert(game.startFirstWave());
  let arced = false,
    burned = false;
  for (let f = 0; f < 1400; f++) {
    game.tick(1 / 60);
    arced ||= game.effects.some(
      (effect) => effect.kind === "storm" && (effect.arcs?.length ?? 0) > 0,
    );
    burned ||= game.enemies.some(
      (enemy) =>
        enemy.type === "wisp" &&
        (enemy.burnLife ?? 0) > 0 &&
        enemy.hurtAgo === 0,
    );
  }
  assert(arced && burned);
});

test("the battle accepts only equipped, stage-available towers and caps the loadout at five", () => {
  const game = new DefenseGame(FROST_FORD, ["arrow", "arrow", "ember"]);
  assert.deepEqual(game.loadout, ["arrow", "ember"]);
  assert(game.build(0, "arrow"));
  assert.equal(game.build(1, "storm"), false);
  game.reset();
  assert(game.build(0, "ember"));
  assert.equal(game.build(1, "storm"), false);
  assert.equal(new DefenseGame(FROST_FORD, FROST_FORD.towers).loadout.length, 5);
  assert.deepEqual(new DefenseGame(FIELD_LEVEL, ["ballista", "cannon"]).loadout, ["cannon"]);
  assert.deepEqual(new DefenseGame(TUTORIAL_LEVEL, ["cannon"]).loadout, TUTORIAL_LEVEL.towers);
});

test("high-damage towers can cycle targeting priority and focus the strongest enemy", () => {
  const game = new DefenseGame({
    ...FROST_FORD,
    gold: 1000,
    plots: [[5, 3], [5, 5]],
    pools: [],
    bridges: [],
    entries: [{ id: "north", label: "北路", scenery: "trail", delay: 0, marker: [0, 4], route: [[0, 4], [12, 4]] }],
    waves: [{ title: "集火测试", groups: { north: [["slime", 1, 0.2], ["guard", 1, 0.2]] } }],
  }, ["ballista", "frost"]);
  assert(game.build(1, "frost"));
  // Frost does not support priority toggle; ballista does.
  assert.equal(game.cycleTowerPriority(1), null);
  assert(game.sell(1));
  assert(game.startFirstWave());
  for (let i = 0; i < 600 && game.enemies.length < 2; i++) game.tick(1 / 60);
  // Advance until both slime (leading) and guard (higher HP) are well inside plot 0's range.
  for (let i = 0; i < 180; i++) game.tick(1 / 60);
  assert(game.build(0, "ballista"));
  assert.equal(game.cycleTowerPriority(0), "strong");
  const [slime, guard] = game.enemies;
  for (let i = 0; i < 600 && guard.hp === guard.maxHp; i++) game.tick(1 / 60);
  assert(guard.hp < guard.maxHp);
  assert.equal(slime.hp, slime.maxHp);
  assert.equal(game.cycleTowerPriority(0), "weak");
  assert.equal(game.cycleTowerPriority(0), "first");
});

test("pine-creek log-roll device damages and staggers ground enemies", () => {
  const game = new DefenseGame(PINE_CREEK);
  assert(game.devices.length === 1 && game.devices[0].spec.kind === "log-roll");
  assert(game.startFirstWave());
  for (let i = 0; i < 900 && !game.enemies.some((e) => e.x >= 7 && e.x <= 13 && Math.abs(e.y - 4) < 0.5); i++)
    game.tick(1 / 60);
  const victim = game.enemies.find((e) => e.x >= 7 && e.x <= 13 && Math.abs(e.y - 4) < 0.5)!;
  assert(victim);
  const beforeHp = victim.hp;
  assert(game.activateDevice(0));
  for (let i = 0; i < 120; i++) game.tick(1 / 60);
  assert(victim.hp < beforeHp);
  assert(game.deviceCooldown(0) > 0);
});
