import assert from "node:assert/strict";
import { test } from "node:test";
import { LILY_SHOALS } from "../src/content/levels/lily-shoals.ts";
import { REED_BRIDGE } from "../src/content/levels/reed-bridge.ts";
import { SLUICE_BRIDGE } from "../src/content/levels/sluice-bridge.ts";
import { WINCH_GALLERY } from "../src/content/levels/winch-gallery.ts";
import { OCHRE_MINE } from "../src/content/levels/ochre-mine.ts";
import { FORK_STATION } from "../src/content/levels/fork-station.ts";
import { SUNMIRROR_BRIDGES } from "../src/content/levels/sunmirror-bridges.ts";
import { FROST_WATCH } from "../src/content/levels/frost-watch.ts";
import { MIRE_BOARDWALK } from "../src/content/levels/mire-boardwalk.ts";
import { DefenseGame, TRACK_SWITCH_RETURN } from "../src/engine/defense.ts";
import { beaconTargets, DEVICES, devicePace } from "../src/engine/devices.ts";
import type { BattlefieldDevice } from "../src/engine/devices.ts";
import { abilityCooldownRemaining, canNet, exposedDamageFactor, isAirborne, isBurrowing, isNetted, isStaggered, sunExposure } from "../src/engine/enemy-abilities.ts";
import { guardStats, guardUnitStats, GUARD_BRANCHES, GUARD_BUILDINGS, GUARD_MASTERIES } from "../src/engine/guards.ts";
import { createRoute, isInTunnel } from "../src/engine/route.ts";
import type { BuildingId, Level } from "../src/engine/types.ts";
import { rateBattle } from "../src/ui/ratings.ts";

const STEP = 1 / 60;

function until(game: DefenseGame, condition: () => boolean) {
  for (let step = 0; step < 12_000 && !condition() && !game.ended; step++) game.tick(STEP);
  assert(condition());
}

function deviceBattle(device: BattlefieldDevice) {
  return new DefenseGame({
    ...LILY_SHOALS,
    entries: [{ id: "test", label: "入口", scenery: "trail", delay: 0, marker: [0, 5], route: [[0, 5], [21, 5]] }],
    waves: [{ title: "机关", hp: 2, groups: { test: [[["lily-skater", "cinder-bat"], 2, 0.5]] } }],
    devices: [device],
  });
}

const mineTowerLane: Level = {
  ...WINCH_GALLERY,
  gold: 900,
  devices: [],
  plots: [[3, 4], [4, 6], [11, 6]],
  entries: [{ id: "test", label: "矿口", scenery: "mine", delay: 0, marker: [0, 5], route: [[0, 5], [20, 5]] }],
  waves: [{ title: "煤翎试飞", groups: { test: [["cinder-bat", 1, 1]] } }],
};

test("mining towers unlock in order and both unit towers occupy a loadout slot", () => {
  assert(new DefenseGame(OCHRE_MINE).loadout.includes("net"));
  assert(!OCHRE_MINE.towers.includes("griffin-roost"));
  assert(new DefenseGame(WINCH_GALLERY).loadout.includes("griffin-roost"));
  assert(!WINCH_GALLERY.towers.includes("prism"));
  assert(FORK_STATION.towers.includes("prism"));
  const game = new DefenseGame(mineTowerLane, ["arrow", "frost", "cannon", "net", "griffin-roost", "guard-post"]);
  assert.equal(game.loadout.length, 5);
  assert(game.buildOptions(1).includes("griffin-roost"));
  assert(!game.buildOptions(1).includes("guard-post"));
  assert(!game.build(1, "guard-post"));
  assert(game.build(1, "griffin-roost"));
  assert.equal(game.guardPosts.get(1)?.guards.length, 2);
  assert(game.guardPoints(1).some(([x, y]) => x === 7 && y === 5));
  assert(game.upgrade(1));
  const post = game.guardPosts.get(1)!;
  post.guards[0].hp = 20;
  assert(!game.upgrade(1, "shield"));
  assert(game.upgrade(1, "wingpair"));
  assert.equal(post.guards.length, 3);
  assert(post.guards[0].hp > 0);
  assert.equal(post.guards[1].hp, guardStats(post).health);
  assert.equal(post.guards[2].hp, guardUnitStats(post, post.guards[2]).health);
  assert(post.guards[2].hp < post.guards[1].hp);
  assert.equal(game.sell(1), 216);
});

test("a wingpair recruit joins at once and grows stronger than the original adults after two full waves", () => {
  for (const midWave of [false, true]) {
    const game = new DefenseGame({
      ...mineTowerLane,
      waves: Array.from({ length: 3 }, () => ({
        title: "霜翼训练", groups: { test: [["runner", 1, .5] as const] },
      })),
    }, ["griffin-roost"]);
    assert(game.build(1, "griffin-roost") && game.upgrade(1));
    if (midWave) assert(game.startFirstWave());
    assert(game.upgrade(1, "wingpair"));
    const post = game.guardPosts.get(1)!;
    const [first, second, recruit] = post.guards;
    const due = midWave ? 3 : 2;
    assert.equal(recruit.recruit?.adultAfter, due);
    const young = guardUnitStats(post, recruit);
    assert(young.damage < guardUnitStats(post, first).damage);
    assert(game.upgrade(1));
    assert.equal(post.guards[2], recruit);
    assert.equal(recruit.recruit?.adultAfter, due);
    if (!midWave) assert(game.startFirstWave());
    for (let wave = 1; wave <= due; wave++) {
      until(game, () => game.phase !== "active");
      assert.equal(recruit.recruit?.grown, wave === due);
      assert.equal(recruit.recruit?.grownAt, wave === due ? game.time : undefined);
      if (wave < due) assert(game.release("test"));
    }
    const raised = guardUnitStats(post, recruit);
    const regular = guardUnitStats(post, second);
    assert(raised.health > regular.health);
    assert.equal(raised.damage, regular.damage + 2);
    assert.equal(first.recruit, undefined);
    assert.equal(second.recruit, undefined);
    assert.equal(post.guards.length, 3);
  }
});

test("fusion leaves one griffin and preserves the pair's wounds or pending reinforcement", () => {
  for (const knockedOut of [false, true]) {
    const game = new DefenseGame(mineTowerLane, ["griffin-roost"]);
    assert(game.build(1, "griffin-roost") && game.upgrade(1));
    const post = game.guardPosts.get(1)!;
    const [first, second] = post.guards;
    const previous = guardStats(post);
    first.hp = knockedOut ? 0 : previous.health / 2;
    second.hp = knockedOut ? 0 : previous.health;
    first.respawnAt = game.time + 6;
    second.respawnAt = game.time + 4;
    assert(game.upgrade(1, "talon"));
    assert.deepEqual(post.guards, [second]);
    const fused = guardStats(post);
    if (knockedOut) {
      assert.equal(second.hp, 0);
      assert.equal(second.respawnAt, game.time + 4 * fused.respawn / previous.respawn);
      until(game, () => second.hp > 0);
      assert.equal(second.hp, fused.health);
    } else {
      assert.equal(second.hp, Math.round(fused.health * .75));
      assert(second.fusion);
    }
  }
});

test("interceptor towers retain their specialization and record the previous form on upgrade", () => {
  for (const type of ["guard-post", "griffin-roost", "frost-kennel"] as const) {
    const { base, upgrade, branches } = GUARD_BUILDINGS[type];
    const [first, second] = branches;
    for (const [branch, other] of [[first, second], [second, first]]) {
      const game = new DefenseGame({ ...mineTowerLane, towers: [...mineTowerLane.towers, "frost-kennel"] }, [type]);
      assert(game.build(1, type));
      const post = game.guardPosts.get(1)!;
      for (const [tier, path] of [[1, undefined], [2, branch]] as const) {
        game.tick(STEP);
        assert(game.upgrade(1, path));
        assert.deepEqual(post.upgradeFrom, { tier, branch: undefined, at: game.time });
      }
      const mastery = GUARD_MASTERIES[branch];
      const before = game.gold;
      post.guards[0].hp -= 12;
      assert(!game.upgrade(1, other));
      assert.equal(post.upgradeFrom?.tier, 2);
      game.tick(STEP);
      assert(game.upgrade(1));
      assert.deepEqual(post.upgradeFrom, { tier: 3, branch, at: game.time });
      assert.equal(post.tier, 4);
      assert.equal(post.branch, branch);
      assert.equal(guardStats(post), mastery);
      assert.equal(post.guards.length, mastery.squad);
      assert.equal(post.guards[0].hp, mastery.health - 12);
      assert.equal(game.gold, before - mastery.cost);
      assert(!game.upgrade(1));
      const investment = base.cost + upgrade.cost + GUARD_BRANCHES[branch].cost + mastery.cost;
      assert.equal(game.sell(1), Math.floor(investment * .6));
    }
  }
});

test("net's bolts attack leading ground enemies while its separately timed net grounds nearby fliers", () => {
  const game = new DefenseGame({
    ...mineTowerLane,
    waves: [{ title: "混合目标", groups: { test: [[["runner", "cinder-bat"], 2, .65]] } }],
  }, ["net"]);
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 2);
  const [runner, bat] = game.enemies;
  assert(runner.progress > bat.progress);
  assert(game.build(0, "net"));
  game.tick(STEP);
  const shots = game.projectiles;
  assert.equal(shots.find(({ kind }) => kind === "net")?.target, runner);
  assert.equal(shots.find(({ kind }) => kind === "net-capture")?.target, bat);
  until(game, () => isNetted(bat));
  assert(!isAirborne(bat));
  assert(runner.hp < runner.maxHp);
  assert.equal(bat.hp, bat.maxHp);
  const tower = game.towers.get(0)!;
  assert(tower.fired < game.time && tower.nextNetAt! > game.time);
  until(game, () => isAirborne(bat));
  assert(!canNet(bat));
});

test("griffins hover in air combat, land for ground combat and resume flying afterwards", () => {
  for (const [type, air] of [["cinder-bat", true], ["runner", false]] as const) {
    const game = new DefenseGame({
      ...mineTowerLane,
      pools: [[4, 5]],
      waves: [
        { title: "狮鹫拦截", hp: 2.4, groups: { test: [[type, 1, 1]] } },
        { title: "下一波", groups: { test: [[type, 1, 1]] } },
      ],
    }, ["griffin-roost"]);
    assert(game.build(1, "griffin-roost") && game.startFirstWave());
    const post = game.guardPosts.get(1)!;
    assert.deepEqual(post.rally, [4, 5]);
    const [griffin] = post.guards;
    until(game, () => griffin.contactAt !== undefined);
    const [enemy] = game.enemies;
    assert.equal(griffin.target, enemy);
    assert.equal(isAirborne(enemy), air);
    assert.equal(griffin.flight?.height, air ? 1 : 0);
    const progress = enemy.progress;
    for (let step = 0; step < 6; step++) game.tick(STEP);
    assert.equal(enemy.progress, progress);
    until(game, () => Boolean(griffin.attack?.released));
    assert.equal(griffin.attack?.pose, air ? "air" : "ground");
    assert(enemy.hp < enemy.maxHp);
    until(game, () => enemy.melee?.hit === true);
    assert.equal(enemy.melee?.style, air ? "air-strike" : "bite");
    enemy.hp = 0;
    for (let step = 0; step < 20; step++) game.tick(STEP);
    assert.equal(griffin.flight?.height, 1);
  }
});

test("the prism grows stronger on a held target and starts at base damage on a new one", () => {
  const game = new DefenseGame({
    ...mineTowerLane,
    towers: ["prism"],
    waves: [{ title: "蓄光", hp: 10, groups: { test: [["stump-spirit", 2, .45, 2]] } }],
  });
  assert(game.build(0, "prism") && game.startFirstWave());
  const tower = game.towers.get(0)!;
  until(game, () => game.projectiles.some(({ kind }) => kind === "prism"));
  const first = game.projectiles[0];
  assert(first.kind === "prism");
  assert.equal(first.stats.damage, 17);
  until(game, () => game.projectiles.some((shot) => shot.kind === "prism" && shot.stats.damage > 17));
  assert.equal(tower.focus?.target, first.target);
  first.target.hp = 0;
  until(game, () => game.projectiles.some((shot) => shot.kind === "prism" && shot.target !== first.target));
  const retarget = game.projectiles.find((shot) => shot.kind === "prism" && shot.target !== first.target)!;
  assert(retarget.kind === "prism");
  assert.equal(retarget.stats.damage, 17);
});

test("scatter nets ground three nearby fliers at most", () => {
  const game = new DefenseGame({
    ...mineTowerLane,
    waves: [{ title: "散网", groups: { test: [["cinder-bat", 4, .45, 4]] } }],
  }, ["net"]);
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 4);
  const target = game.enemies[2];
  game.projectiles.push({
    kind: "net-capture", path: "scatter", x: 3, y: 4, tx: target.x, ty: target.y, target,
    age: 0, releaseDelay: 0, duration: STEP, color: "#fff", heading: 0,
    stats: { cost: 0, range: 4, interval: 1, damage: 0, net: { seconds: 1.45, cooldown: 4.6, spread: 1.45 } },
  });
  game.tick(STEP);
  assert(isNetted(target));
  assert.equal(game.enemies.filter(isNetted).length, 3);
});

test("only the freight entrance switches tracks while the two northern routes share an approach", () => {
  const game = new DefenseGame(FORK_STATION);
  const { upper, lower } = FORK_STATION.trackSwitch!;
  assert.equal(FORK_STATION.entries.length, 3);
  assert.equal(createRoute(upper).distance, 17);
  assert.equal(createRoute(lower).distance, 29);
  assert.equal(game.gold, 620);
  assert.deepEqual(game.routes.shaft.points.slice(-4), game.routes.vent.points.slice(-4));
  const northernTiles = new Set([game.routes.shaft, game.routes.vent].flatMap((route) =>
    Array.from({ length: route.distance }, (_, step) => {
      const { x, y } = route.at(step);
      return x + "," + y;
    })));
  for (let step = 0; step < game.routes.freight.distance; step++) {
    const { x, y } = game.routes.freight.at(step);
    assert(!northernTiles.has(x + "," + y));
  }
  assert(game.build(13, "guard-post") && game.build(3, "ballista") && game.build(11, "arrow") &&
    game.build(4, "arrow") && game.build(9, "arrow") && game.build(12, "arrow"));
  assert(game.startFirstWave());
  until(game, () => game.phase === "ready");
  until(game, () => game.phase === "active");
  until(game, () => game.phase === "ready");
  assert.equal(game.wave, 2);
  assert(game.switchTrack());
  assert.equal(game.trackRoute("shaft"), game.routes.shaft);
  assert.equal(game.trackRoute("vent"), game.routes.vent);
  assert.equal(game.trackRoute("freight").distance - game.routes.freight.distance, 12);
  assert.equal(game.routes.freight.tunnels.length, 0);
  assert.deepEqual(game.trackRoute("freight").tunnels, [{ from: 15, to: 22 }]);
});

test("freight stays idle until wave three and locks the switch only on its own dispatch", () => {
  const game = new DefenseGame(FORK_STATION);
  assert.equal(game.track, "upper");
  assert(!game.trackPending);
  assert(game.build(0, "guard-post") && game.build(3, "ballista") && game.build(11, "arrow") &&
    game.build(4, "arrow") && game.build(9, "arrow") && game.build(12, "arrow"));
  assert(!game.switchTrack());
  assert(game.startFirstWave());
  assert(game.deployment("shaft") && game.deployment("vent"));
  assert.equal(game.deployment("freight"), null);
  assert(!game.trackPending && !game.trackLocked);
  until(game, () => game.phase === "ready");
  assert.equal(game.waveIndex, 1);
  assert(!game.trackPending && !game.trackLocked);
  until(game, () => game.phase === "active");
  assert.equal(game.deployment("freight"), null);
  assert(!game.switchTrack());
  until(game, () => game.phase === "ready");
  assert.equal(game.waveIndex, 2);
  assert(game.trackPending && !game.trackLocked);
  assert(!game.switchTrack());
  assert(game.build(13, "guard-post"));
  game.paused = true;
  assert(!game.switchTrack());
  game.paused = false;

  const bonus = game.reward("vent"), gold = game.gold;
  assert.deepEqual(game.release("vent", true), { bonus });
  assert.equal(game.gold, gold + bonus);
  assert.deepEqual([...game.pending.keys()], ["shaft", "freight"]);
  assert(game.trackPending && !game.trackLocked);
  assert(game.switchTrack());
  const post = game.guardPosts.get(13)!;
  const guard = post.guards.find((member) => member.switchDuty)!;
  assert.equal(game.switchPost, post);
  assert(guard);
  assert.equal(game.sell(13), null);
  assert(!game.switchTrack());
  until(game, () => game.time - game.waveStartedAt >= TRACK_SWITCH_RETURN);
  assert(guard.switchDuty);

  assert(game.release("freight", true));
  assert(game.trackLocked);
  assert(!game.switchTrack());
  const dispatch = game.time;
  game.paused = true;
  game.tick(TRACK_SWITCH_RETURN + 1);
  assert.equal(game.time, dispatch);
  assert(guard.switchDuty);
  game.paused = false;
  until(game, () => game.time - dispatch >= TRACK_SWITCH_RETURN);
  assert(!guard.switchDuty);
  assert.equal(game.switchPost, undefined);
  assert(game.enemies.some(({ route }) => route === game.trackRoute("freight")));
  game.reset();
  assert.equal(game.track, "upper");
  assert.equal(game.switchPost, undefined);
  assert(!game.trackPending && !game.trackLocked && !game.switchTrack());
});

test("freight loses tower targeting between tunnel mouths and can be attacked after reappearing", () => {
  const testPlot = FORK_STATION.plots.length;
  const game = new DefenseGame({
    ...FORK_STATION,
    plots: [...FORK_STATION.plots, [13, 17]],
    waves: [{ title: "矿洞", groups: { freight: [["cinder-bat", 1, 1]] } }],
  });
  assert(game.build(13, "guard-post") && game.switchTrack() && game.startFirstWave());
  until(game, () => game.enemies.length > 0);
  const [enemy] = game.enemies;
  until(game, () => enemy.progress >= enemy.route.tunnels[0].from - .25);
  const shot = {
    kind: "arrow" as const, path: null, x: 8, y: 20, tx: enemy.x, ty: enemy.y, target: enemy,
    age: 0, releaseDelay: 0, duration: .3, color: "#fff", heading: 0 as const,
    stats: { cost: 0, range: 4, interval: 1, damage: 20 },
  };
  game.projectiles.push(shot);
  const hp = enemy.hp;
  until(game, () => isInTunnel(enemy));
  assert(game.build(testPlot, "arrow"));
  until(game, () => enemy.x >= 15);
  assert(isInTunnel(enemy));
  assert.equal(enemy.hp, hp);
  assert.equal(game.towers.get(testPlot)!.fired, -Infinity);
  assert(game.build(22, "arrow"));
  until(game, () => enemy.hp < hp);
  assert(!isInTunnel(enemy));
  assert(game.towers.get(22)!.fired > 0);
});

test("splash and chain damage from outside the tunnel skip enemies under its roof", () => {
  const game = new DefenseGame({
    ...FORK_STATION,
    trackSwitch: undefined,
    entries: [
      { id: "covered", label: "矿洞", scenery: "mine", marker: [1, 6], delay: 0, route: [[1, 6], [14, 6]] },
      { id: "open", label: "地面", scenery: "mine", marker: [1, 8], delay: 0, route: [[1, 8], [14, 8], [14, 6]] },
    ],
    tunnels: [{ from: [5, 6], to: [10, 6] }],
    waves: [{ title: "遮蔽", groups: { covered: [["runner", 1, 1]], open: [["runner", 1, 1]] } }],
  });
  assert(game.startFirstWave());
  until(game, () => game.enemies.some(isInTunnel));
  const [covered, open] = game.enemies;
  const hp = covered.hp;
  game.projectiles.push({
    kind: "cannon", path: null, x: open.x, y: 9, tx: open.x, ty: open.y, target: open,
    age: 0, releaseDelay: 0, duration: STEP, color: "#fff", heading: 0,
    stats: { cost: 0, range: 4, interval: 1, damage: 10, splash: 3, chain: { jumps: 2, range: 3 } },
  });
  game.tick(STEP);
  assert(open.hp < open.maxHp);
  assert.equal(covered.hp, hp);
});

test("both station tracks can earn three stars and interrupt the strengthened colossus using the winch", () => {
  const counts = FORK_STATION.waves.map(({ groups }) => {
    const total = Object.values(groups).flat().reduce((count, group) => count + group[1], 0);
    const freight = (groups.freight ?? []).reduce((count, group) => count + group[1], 0);
    return [total, freight];
  });
  assert.deepEqual(counts, [[28, 0], [27, 0], [30, 8], [31, 8], [30, 9], [29, 9], [39, 11], [29, 10], [44, 14], [24, 6], [38, 11]]);
  const short = new DefenseGame(FORK_STATION, ["arrow", "cannon", "frost", "ember", "ballista"]);
  const long = new DefenseGame(FORK_STATION);
  assert(short.build(3, "ballista") && short.build(4, "arrow") && short.build(11, "ember") &&
    short.build(9, "arrow") && short.build(12, "arrow") && short.build(14, "cannon"));
  assert(long.build(3, "ballista") && long.build(4, "arrow") && long.build(11, "arrow") &&
    long.build(9, "arrow") && long.build(12, "arrow") && long.build(22, "ballista") && long.build(23, "frost"));
  const plans = [
    { game: short, actions: [
      () => short.upgrade(3) && short.build(18, "frost") && short.build(19, "arrow"),
      () => short.upgrade(14) && short.upgrade(4) && short.upgrade(19),
      () => short.upgrade(18) && short.upgrade(14) && short.build(2, "ballista") && short.upgrade(3),
      () => short.upgrade(3, "piercer") && short.upgrade(2) && short.build(1, "ballista") && short.upgrade(2),
      () => short.upgrade(2, "piercer") && short.upgrade(1) && short.upgrade(1),
      () => short.upgrade(1, "piercer") && short.build(5, "ballista") && short.upgrade(5),
      () => short.upgrade(5) && short.upgrade(5, "piercer"),
      () => short.build(6, "ballista") && short.upgrade(6) && short.upgrade(6) && short.upgrade(6, "piercer"),
      () => short.build(7, "ballista") && short.upgrade(7) && short.upgrade(7) && short.upgrade(7, "piercer") && short.build(8, "cannon") && short.upgrade(8),
    ] },
    { game: long, actions: [
      () => long.upgrade(3) && long.upgrade(4) && long.build(13, "guard-post"),
      () => long.upgrade(22) && long.build(24, "arrow") && long.upgrade(23),
      () => long.upgrade(22) && long.upgrade(24) && long.build(2, "ballista") && long.upgrade(3),
      () => long.upgrade(22, "piercer") && long.upgrade(3, "piercer") && long.build(1, "ballista"),
      () => long.upgrade(2) && long.upgrade(2) && long.upgrade(2, "piercer"),
      () => long.upgrade(1) && long.upgrade(1) && long.upgrade(1, "piercer"),
      () => long.build(25, "ballista") && long.upgrade(25) && long.upgrade(25) && long.upgrade(25, "piercer"),
      () => long.build(5, "ballista") && long.upgrade(5) && long.upgrade(5) && long.upgrade(5, "piercer"),
      () => long.build(6, "ballista") && long.upgrade(6) && long.upgrade(6) && long.upgrade(6, "piercer") && long.build(7, "cannon") && long.upgrade(7),
    ] },
  ];
  for (const { game, actions } of plans) {
    const spec = game.devices[0].spec;
    assert(spec.kind === "rail-cart");
    const onTrack = (x: number, y: number) => x >= spec.to[0] + 1 && x <= spec.from[0] - 1 &&
      Math.abs(y - spec.from[1]) < .65;
    const finalWave = FORK_STATION.waves.length;
    let interrupted = false;
    assert(game.startFirstWave());
    for (let wave = 1; wave <= finalWave; wave++) {
      until(game, () => game.phase === "active");
      assert.equal(game.wave, wave);
      for (let step = 0; step < 12_000 && game.phase === "active"; step++) {
        const boss = game.enemies.find(({ type }) => type === "slag-colossus");
        if (boss) assert.equal(wave, finalWave);
        const charging = boss?.action?.phase === "windup" || boss?.action?.phase === "active";
        if (game.deviceReady(0)) {
          const targets = game.enemies.filter((enemy) => !isAirborne(enemy) && onTrack(enemy.x, enemy.y));
          const release = wave === finalWave ? boss && charging && onTrack(boss.x, boss.y) : targets.length >= 2;
          if (release) assert(game.activateDevice(0));
        }
        game.tick(STEP);
        if (boss && charging && isStaggered(boss) && !boss.action) interrupted = true;
      }
      assert.notEqual(game.phase, "active");
      if (game === long && wave === 2) assert(game.switchTrack());
      const action = actions[wave - 1];
      if (action) assert(action());
    }
    assert(interrupted);
    assert.equal(game.phase, "won");
    assert.equal(rateBattle(FORK_STATION, game.health), 3);
  }
});

test("both sun mirrors share cooldown and only expose enemies present in the selected circle", () => {
  const game = new DefenseGame({
    ...SUNMIRROR_BRIDGES,
    waves: [{ title: "镜光", groups: {
      north: [["mirror-ibex", 3, .45, 3], ["moth", 1, .5]],
      south: [["runner", 1, .5]],
    } }],
  });
  const rule = DEVICES["sun-mirror"];
  assert(!game.activateDevice(0));
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 5);
  const [goat, edge, outside] = game.enemies.filter(({ type }) => type === "mirror-ibex");
  const moth = game.enemies.find(({ type }) => type === "moth")!;
  const runner = game.enemies.find(({ type }) => type === "runner")!;
  const north = game.devices[0].spec;
  const south = game.devices[1].spec;
  assert(north.kind === "sun-mirror" && south.kind === "sun-mirror");
  const [x, y] = north.center;
  Object.assign(goat, { x, y, age: 0 });
  Object.assign(edge, { x: x - rule.radius + .01, y });
  Object.assign(outside, { x: x - rule.radius - .01, y });
  Object.assign(moth, { x, y });
  Object.assign(runner, { x: south.center[0], y: south.center[1] });
  assert.equal(exposedDamageFactor(goat), .52);
  assert(isAirborne(moth));
  assert(game.activateDevice(0));
  assert.equal(exposedDamageFactor(goat), rule.multiplier);
  assert.equal(exposedDamageFactor(moth), rule.multiplier);
  assert(sunExposure(edge));
  assert(!sunExposure(outside) && !sunExposure(runner));
  assert.equal(game.deviceCooldown(1), rule.cooldown);
  assert(!game.activateDevice(1));

  Object.assign(outside, { x, y });
  game.tick(STEP);
  assert(!sunExposure(outside));
  until(game, () => goat.age >= rule.exposure);
  assert.equal(exposedDamageFactor(goat), .52);
  until(game, () => game.deviceReady(1));
  Object.assign(runner, { x: south.center[0], y: south.center[1] });
  assert(game.activateDevice(1));
  assert(sunExposure(runner));
  assert(!game.deviceReady(0));
  game.reset();
  assert.equal(game.deviceCooldown(0), 0);
  assert.equal(game.deviceCooldown(1), 0);
});

test("stage 11 can earn three stars and firing both mirrors can preserve full health", () => {
  const level = SUNMIRROR_BRIDGES;
  const start = [[4, "prism"], [3, "cannon"], [2, "arrow"], [13, "ballista"], [14, "cannon"], [16, "arrow"]] as const;
  const upgrades = [
    [3], [13], [4], [3], [4], [13], [12, "build", "arrow"], [16],
    [3, "blast"], [13, "piercer"], [4, "concentrate"], [14], [14],
    [14, "blast"], [12], [12], [16], [17, "build", "net"],
    [12, "volley"], [16, "sniper"], [17], [17], [8, "build", "arrow"], [8],
    [17, "scatter"], [8], [8, "volley"], [7, "build", "prism"], [7],
  ] as const;
  for (const useMirrors of [false, true]) {
    const game = new DefenseGame(level, ["prism", "cannon", "arrow", "ballista", "net"]);
    for (const [plot, type] of start) assert(game.build(plot, type));
    assert(game.startFirstWave());
    const activated = new Set<number>();
    let sawMammoth = false;
    let nextUpgrade = 0;
    for (let wave = 1; wave <= level.waves.length; wave++) {
      until(game, () => game.phase === "active");
      for (let step = 0; step < 12_000 && game.phase === "active"; step++) {
        sawMammoth ||= game.enemies.some(({ type }) => type === "frost-mammoth");
        if (useMirrors && game.deviceReady(0)) {
          const targets = game.devices.map(({ spec }) => {
            assert(spec.kind === "sun-mirror");
            return game.enemies.filter(({ x, y }) =>
              Math.hypot(x - spec.center[0], y - spec.center[1]) <= DEVICES["sun-mirror"].radius);
          });
          const scores = targets.map((enemies) => enemies.reduce((score, { type, action }) => score +
            (type === "frost-mammoth" ? 8 : type === "mirror-ibex" && action?.phase !== "exposed" ? 3 : 1), 0));
          const index = scores[1] > scores[0] ? 1 : 0;
          if (scores[index] >= 3 && game.activateDevice(index)) activated.add(index);
        }
        game.tick(STEP);
      }
      assert.notEqual(game.phase, "active");
      while (!game.ended && nextUpgrade < upgrades.length) {
        const [plot, action, type] = upgrades[nextUpgrade];
        const succeeded = action === "build" ? game.build(plot, type) : game.upgrade(plot, action);
        if (!succeeded) break;
        nextUpgrade++;
      }
    }
    assert(sawMammoth);
    assert.equal(game.phase, "won");
    assert.equal(rateBattle(level, game.health), 3);
    if (useMirrors) {
      assert.equal(game.health, level.health);
      assert.equal(activated.size, 2);
    }
  }
});

test("stage 12 unlocks the ridge on wave three and is winnable by breaking the final boss's tower ice", () => {
  const game = new DefenseGame(FROST_WATCH, ["arrow", "ballista", "storm", "ember", "frost"]);
  assert(!game.entryVisible(FROST_WATCH.entries[2]));
  assert(game.build(14, "ballista") && game.build(15, "storm") && game.build(16, "ember") &&
    game.build(17, "frost") && game.build(5, "arrow") && game.build(10, "arrow") && game.build(4, "arrow"));
  assert(game.startFirstWave());
  let sawElk = false, sawMoose = false, thawed = 0;
  for (let wave = 1; wave <= FROST_WATCH.waves.length; wave++) {
    until(game, () => game.phase === "active");
    if (wave >= 3) assert(game.entryVisible(FROST_WATCH.entries[2]));
    for (let step = 0; step < 12_000 && game.phase === "active"; step++) {
      if (game.enemies.some((e) => e.type === "blizzard-elk")) sawElk = true;
      if (game.enemies.some((e) => e.type === "frost-moose")) {
        assert.equal(wave, FROST_WATCH.waves.length);
        sawMoose = true;
      }
      for (const [plot, tower] of game.towers) {
        if (!tower.frost || step % 12 !== 0) continue;
        assert(game.thawTower(plot));
        if (!tower.frost) thawed++;
      }
      if (game.deviceReady(0) && game.enemies.some((e) => Math.hypot(e.x - 11, e.y - 10) < 2.2))
        game.activateDevice(0);
      game.tick(STEP);
    }
    if (wave === 1) { game.upgrade(14); game.upgrade(15); game.upgrade(5); }
    if (wave === 2) { game.upgrade(14); game.upgrade(16); game.upgrade(10); game.build(9, "ember"); }
    if (wave === 3) { game.upgrade(14, "piercer"); game.upgrade(15); game.upgrade(5); game.build(13, "ballista"); }
    if (wave === 4) { game.upgrade(15, "fork"); game.upgrade(13); game.upgrade(13); game.upgrade(4); }
    if (wave === 5) { game.upgrade(13, "piercer"); game.upgrade(16); game.upgrade(16, "wildfire"); game.upgrade(17); game.upgrade(17); }
    if (wave === 6) { game.upgrade(17, "shatter"); game.upgrade(9); game.upgrade(9); game.upgrade(9, "coal"); game.upgrade(5, "volley"); game.upgrade(10); game.upgrade(10, "volley"); }
    if (wave === 7) {
      assert(game.build(1, "ballista") && game.upgrade(1) && game.upgrade(1) && game.upgrade(1, "piercer"));
      assert(game.build(2, "frost") && game.upgrade(2));
    }
    if (wave === 8) {
      assert(game.build(3, "ballista") && game.upgrade(3) && game.upgrade(3) && game.upgrade(3, "piercer"));
    }
  }
  assert(sawElk && sawMoose && thawed > 0);
  assert.equal(game.phase, "won");
  assert.equal(rateBattle(FROST_WATCH, game.health), 3);
});

test("the mire boom holds four ground enemies, releases them together, and lets flying and submerged enemies through", () => {
  const game = new DefenseGame({
    ...MIRE_BOARDWALK, plots: [], pools: [], bridges: [],
    entries: [{ ...MIRE_BOARDWALK.entries[0], route: [[0, 5], [29, 5]] }],
    devices: [{ kind: "mire-boom", at: [6, 4], center: [6, 5] }],
    waves: [{ title: "扣栅", groups: { north: [["mire-treant", 5, .25], ["bloat-sporer", 1, .25], ["mire-croc", 1, .25]] } }],
  });
  assert(!game.activateDevice(0));
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 7);
  const croc = game.enemies.find(({ type }) => type === "mire-croc")!;
  croc.triggeredAbilityStartedAt = croc.age - .5;
  for (const enemy of game.enemies) {
    enemy.progress = 6;
    Object.assign(enemy, enemy.route.at(6, enemy.lateral));
  }
  const { struck, spec } = game.devices[0];
  const rule = DEVICES[spec.kind];
  assert(spec.kind === "mire-boom");
  assert(game.activateDevice(0));
  game.tick(STEP);
  assert(isBurrowing(croc));
  assert.equal(struck.size, 4);
  assert.equal(game.enemies.filter((enemy) => enemy.progress > 6).length, 3);
  assert([...struck].every((enemy) => enemy.type === "mire-treant" && enemy.hp === enemy.maxHp));
  const countdown = game.deviceCooldown(0);
  game.paused = true;
  game.tick(1);
  assert.equal(game.deviceCooldown(0), countdown);
  game.paused = false;
  until(game, () => game.time - game.devices[0].usedAt >= rule.duration);
  assert([...struck].every((enemy) => enemy.progress > 6));
  assert(!game.deviceReady(0));
  game.reset();
  assert.equal(struck.size, 0);
});

test("mire backwash pushes a ground enemy once and locks its linked gate", () => {
  const game = new DefenseGame({
    ...MIRE_BOARDWALK, plots: [], pools: [], bridges: [],
    entries: [{ ...MIRE_BOARDWALK.entries[0], route: [[0, 5], [29, 5]] }],
    devices: [
      { kind: "mire-backwash", at: [5, 4], from: [5, 5], to: [8, 5], cooldownGroup: "bank" },
      { kind: "mire-backwash", at: [12, 4], from: [12, 5], to: [15, 5], cooldownGroup: "bank" },
    ],
    waves: [{ title: "倒潮", groups: { north: [[["mire-treant", "bloat-sporer"], 2, .25]] } }],
  });
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 2);
  const [ground, airborne] = game.enemies;
  assert(isAirborne(airborne));
  for (const enemy of game.enemies) {
    enemy.progress = 5.4;
    Object.assign(enemy, enemy.route.at(enemy.progress, enemy.lateral));
  }
  assert(game.activateDevice(0));
  assert.equal(game.deviceCooldown(1), DEVICES["mire-backwash"].cooldown);
  assert(!game.activateDevice(1));
  game.tick(STEP);
  assert(Math.abs(ground.progress - 3) < .02 && isStaggered(ground));
  assert(airborne.progress > 5.4);
  ground.progress = 5.4;
  Object.assign(ground, ground.route.at(ground.progress, ground.lateral));
  game.tick(STEP);
  assert(ground.progress >= 5.4);
});

test("mire beacon temporarily overrides cannon targeting only within its normal range", () => {
  const game = new DefenseGame({
    ...MIRE_BOARDWALK, plots: [[5, 4]], pools: [], bridges: [],
    entries: [{ ...MIRE_BOARDWALK.entries[0], route: [[0, 5], [29, 5]] }],
    devices: [{ kind: "mire-beacon", at: [1, 4], center: [1, 5] }],
    waves: [{ title: "引灯", hp: 3, groups: { north: [["mire-treant", 3, .25]] } }],
  }, ["cannon"]);
  assert(game.build(0, "cannon"));
  const gun = game.towers.get(0)!;
  gun.cooldown = 100;
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 3);
  const [outOfRange, lit, closestToCore] = game.enemies;
  for (const [enemy, progress] of [[outOfRange, .2], [lit, 3.2], [closestToCore, 6.8]] as const) {
    enemy.progress = progress;
    Object.assign(enemy, enemy.route.at(progress, enemy.lateral));
  }
  assert(game.activateDevice(0));
  gun.cooldown = 0;
  game.tick(STEP);
  assert.equal(game.projectiles.at(-1)?.target, lit);
  assert.deepEqual(beaconTargets(game.devices, game.enemies, game.time), new Set([outOfRange, lit]));
  const expired = game.devices[0].usedAt + DEVICES["mire-beacon"].duration + STEP;
  assert.equal(beaconTargets(game.devices, game.enemies, expired), undefined);
});

test("stage 13 mire boardwalk gradually introduces all five swamp enemies and earns three stars", () => {
  const level = MIRE_BOARDWALK;
  const game = new DefenseGame(level, ["arrow", "ember", "frost", "ballista", "storm"]);
  const ember = 19, bridgeArrow = 18, ballista = 20, frost = 17, storm = 21, northArrow = 6, southArrow = 14;
  assert(game.build(ember, "ember") && game.build(bridgeArrow, "arrow") && game.build(ballista, "ballista") &&
    game.build(frost, "frost") && game.build(storm, "storm") && game.build(northArrow, "arrow") && game.build(southArrow, "arrow"));
  assert(game.startFirstWave());
  let usedBoom = false;
  for (let wave = 1; wave <= level.waves.length; wave++) {
    until(game, () => game.phase === "active");
    for (let step = 0; step < 12_000 && game.phase === "active"; step++) {
      for (const [index, { spec }] of game.devices.entries()) {
        if (spec.kind !== "mire-boom" || !game.deviceReady(index)) continue;
        const targets = game.enemies.filter((e) => !isAirborne(e) &&
          Math.hypot(e.x - spec.center[0], e.y - spec.center[1]) <= DEVICES[spec.kind].radius);
        if (targets.length >= 2) game.activateDevice(index);
      }
      game.tick(STEP);
      usedBoom ||= game.devices.some(({ struck }) => struck.size >= 2);
    }
    assert.notEqual(game.phase, "active");
    if (wave === 1) { game.upgrade(ember); game.upgrade(bridgeArrow); game.upgrade(ballista); }
    if (wave === 2) { game.upgrade(ember); game.upgrade(bridgeArrow); game.upgrade(frost); game.upgrade(storm); }
    if (wave === 3) { game.upgrade(bridgeArrow, "volley"); game.upgrade(ballista); game.upgrade(ballista, "piercer"); game.upgrade(northArrow); }
    if (wave === 4) { game.upgrade(ember, "wildfire"); game.upgrade(storm); game.upgrade(storm, "fork"); game.upgrade(frost); }
    if (wave === 5) { game.upgrade(frost, "shatter"); game.upgrade(northArrow); game.upgrade(northArrow, "volley"); game.upgrade(southArrow); game.upgrade(southArrow); game.upgrade(southArrow, "sniper"); }
  }
  assert(usedBoom);
  assert.equal(game.phase, "won");
  assert.equal(rateBattle(level, game.health), 3);
  for (const id of ["mire-treant", "mire-croc", "vine-viper", "mire-mycelid", "bloat-sporer"] as const) {
    assert(game.encountered.has(id), `expected ${id} to appear in stage 13`);
  }
});

test("frost interceptors and ranged towers work with standalone global loadout restrictions", () => {
  // Frost-kennel hounds chill ground enemies on strike; dire merges two hounds into one multi-block alpha.
  const kennelGame = new DefenseGame({
    ...mineTowerLane,
    towers: [...mineTowerLane.towers, "frost-kennel"],
    waves: [{ title: "霜狼拦截", hp: 4, groups: { test: [["runner", 1, 1]] } }],
  }, ["frost-kennel"]);
  assert(kennelGame.build(1, "frost-kennel") && kennelGame.startFirstWave());
  until(kennelGame, () => kennelGame.enemies.some((e) => e.slows.size > 0));
  assert(kennelGame.upgrade(1) && kennelGame.upgrade(1, "dire"));
  assert.equal(kennelGame.guardPosts.get(1)?.guards.length, 1);

  // Standalone global loadout restricts battles to chosen towers while preserving earlier-region unlocks.
  const chosen: BuildingId[] = ["arrow", "hail-mortar", "glaze-lance"];
  const earlyStage = new DefenseGame(REED_BRIDGE, chosen);
  assert.deepEqual(earlyStage.loadout, ["arrow"]);
  const frostStage = new DefenseGame(FROST_WATCH, chosen);
  assert.deepEqual(frostStage.loadout, ["arrow", "hail-mortar", "glaze-lance"]);
  assert(!frostStage.build(0, "cannon"));
  assert(frostStage.build(0, "hail-mortar") && frostStage.build(1, "glaze-lance"));
});

test("every shoal approach gives at least 28 tiles to defend before the lake island", () => {
  const game = new DefenseGame(LILY_SHOALS);
  assert(LILY_SHOALS.width >= 32 && LILY_SHOALS.height >= 20);
  assert.equal(Object.keys(game.routes).length, 3);
  for (const route of Object.values(game.routes)) assert(route.distance >= 28);
});

test("the expanded river approaches allow upstream defense and normal-dispatch victory", () => {
  const reed = new DefenseGame(REED_BRIDGE);
  const sluice = new DefenseGame(SLUICE_BRIDGE);
  assert(reed.routes.south.distance >= 26 && sluice.routes.sluice.distance >= 27);
  assert(reed.guardPoints(14).length > 0 && sluice.guardPoints(18).length > 0);
  assert(reed.build(7, "guard-post") && reed.build(8, "cannon") && reed.build(12, "arrow"));
  assert(reed.startFirstWave());
  const purchases: readonly (readonly [number, BuildingId?])[] = [
    // The boar now outdamages the upstream post, so damage upgrades come before the guard tier.
    [8], [12], [9, "cannon"], [9], [5, "arrow"], [5], [6, "arrow"], [6], [7],
  ];
  let nextPurchase = 0;
  for (let wave = 1; wave <= REED_BRIDGE.waves.length; wave++) {
    until(reed, () => reed.phase === "active");
    assert.equal(reed.wave, wave);
    until(reed, () => reed.phase !== "active");
    while (!reed.ended && nextPurchase < purchases.length) {
      const [plot, type] = purchases[nextPurchase];
      if (!(type ? reed.build(plot, type) : reed.upgrade(plot))) break;
      nextPurchase++;
    }
  }
  assert.equal(reed.phase, "won");
  assert.equal(rateBattle(REED_BRIDGE, reed.health), 3);
});

test("the sluice slows nearby ground enemies for five seconds and pauses with the game", () => {
  const game = deviceBattle({ kind: "sluice", at: [2, 4], center: [2, 5] });
  assert.equal(game.activateDevice(0), false);
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 2);
  const [ground, air] = game.enemies;
  assert(game.activateDevice(0));
  assert.equal(game.activateDevice(0), false);
  const groundStart = ground.progress, airStart = air.progress;
  game.tick(STEP);
  assert(Math.abs(ground.progress - groundStart - ground.speed * DEVICES.sluice.pace * STEP) < 1e-7);
  assert(Math.abs(air.progress - airStart - air.speed * STEP) < 1e-7);
  assert.equal(devicePace(game.devices, ground, game.devices[0].usedAt + 4.99), DEVICES.sluice.pace);
  assert.equal(devicePace(game.devices, ground, game.devices[0].usedAt + 5), 1);
  game.paused = true;
  const time = game.time;
  game.tick(10);
  assert.equal(game.time, time);
  game.reset();
  assert(game.startFirstWave());
  assert(game.deviceReady(0));
});

test("the mine cart hits a ground enemy once and rolls beneath airborne enemies", () => {
  const game = deviceBattle({ kind: "rail-cart", at: [0, 4], from: [0, 5], to: [8, 5] });
  assert(game.startFirstWave());
  until(game, () => game.enemies.length === 2);
  const [skater, bat] = game.enemies;
  assert(game.activateDevice(0));
  until(game, () => game.effects.some(({ kind }) => kind === "rail-impact"));
  assert.equal(skater.hp, skater.maxHp - DEVICES["rail-cart"].damage);
  assert.equal(bat.hp, bat.maxHp);
  for (let i = 0; i < 180; i++) game.tick(STEP);
  assert.equal(game.devices[0].struck.size, 1);
  assert.equal(skater.hp, skater.maxHp - DEVICES["rail-cart"].damage);
  assert.equal(bat.hp, bat.maxHp);
});

test("the two shoal sluices share a cooldown and only open on the selected side", () => {
  const game = new DefenseGame(LILY_SHOALS);
  assert(game.startFirstWave());
  assert(game.deviceReady(0) && game.deviceReady(1));
  assert(game.activateDevice(1));
  assert.equal(game.devices[0].usedAt, -Infinity);
  assert.equal(game.deviceCooldown(0), game.deviceCooldown(1));
  assert.equal(game.activateDevice(0), false);
  until(game, () => game.deviceCooldown(0) === 0);
});

test("a magnet beetle gains altitude after opening its shell and releases blocking guards", () => {
  const game = new DefenseGame({
    ...deviceBattle({ kind: "rail-cart", at: [2, 4], from: [2, 5], to: [9, 5] }).level,
    plots: [[2, 6]],
    waves: [{ title: "试飞", groups: { test: [["magnet-beetle", 1, 1]] } }],
  });
  assert(game.build(0, "guard-post"));
  assert(game.startFirstWave());
  const guards = game.guardPosts.get(0)!.guards;
  until(game, () => guards.some((guard) => guard.target?.type === "magnet-beetle"));
  const [enemy] = game.enemies;
  assert(!isAirborne(enemy));
  assert(exposedDamageFactor(enemy) < 1);
  until(game, () => enemy.action?.phase === "windup");
  assert.equal(exposedDamageFactor(enemy), 1);
  assert(!isAirborne(enemy));
  until(game, () => isAirborne(enemy));
  assert(guards.every((guard) => guard.target !== enemy));
  assert.equal(enemy.melee, undefined);
  const start = enemy.progress;
  game.tick(STEP);
  assert(enemy.progress > start + enemy.speed * STEP);
  until(game, () => !isAirborne(enemy));
  assert(exposedDamageFactor(enemy) < 1);
});

test("mine carts interrupt the overseer's charge and a later breach still ends the battle", () => {
  const game = new DefenseGame({
    ...deviceBattle({ kind: "rail-cart", at: [2, 4], from: [2, 5], to: [12, 5] }).level,
    waves: [{ title: "领班", groups: { test: [["cable-overseer", 1, 1]] } }],
  });
  assert(game.startFirstWave());
  until(game, () => game.enemies[0]?.action?.phase === "windup");
  const [boss] = game.enemies;
  assert(game.activateDevice(0));
  until(game, () => isStaggered(boss));
  const before = boss.progress;
  assert.equal(boss.action, undefined);
  for (let i = 0; i < 120; i++) game.tick(STEP);
  assert.equal(boss.progress, before);
  until(game, () => boss.progress > before);
  assert.equal(boss.action, undefined);
  assert(abilityCooldownRemaining(boss) >= 4.7 - STEP - 1e-7);
  until(game, () => game.phase === "lost");
  assert.equal(game.breachingBoss, "cable-overseer");
  assert.equal(game.health, game.level.health);
});

test("the new shoals and mine can each earn three stars with normal dispatch", () => {
  type Plan = {
    level: Level;
    start: readonly (readonly [number, BuildingId])[];
    purchases: readonly (readonly [plot: number, action?: BuildingId | "blast" | "volley" | "piercer"])[];
  };
  const plans: readonly Plan[] = [
    {
      level: LILY_SHOALS, start: [[3, "cannon"], [4, "cannon"], [7, "arrow"], [10, "arrow"]],
      purchases: [[4], [3], [7], [10], [5, "frost"], [5], [4], [3], [10], [7], [6, "cannon"], [6], [6],
        [2, "arrow"], [2], [2], [9, "arrow"], [9], [9]],
    },
    {
      level: WINCH_GALLERY, start: [[2, "arrow"], [4, "arrow"], [8, "cannon"], [9, "cannon"], [10, "arrow"]],
      purchases: [[9], [10], [9], [9, "blast"], [8], [8], [8, "blast"], [10], [10, "volley"], [4], [2], [4], [4, "volley"], [2], [2, "volley"],
        [11, "arrow"], [12, "cannon"], [11], [12], [3, "cannon"], [7, "arrow"], [6, "cannon"],
        [1, "ballista"], [1], [1], [1, "piercer"], [5, "arrow"],
        [11, "volley"], [12, "blast"], [3], [7], [6], [5]],
    },
  ];
  for (const { level, start, purchases } of plans) {
    const game = new DefenseGame(level);
    for (const [plot, type] of start) assert(game.build(plot, type));
    assert(game.startFirstWave());
    let nextPurchase = 0;
    let used = 0;
    let interrupted = false;
    for (let wave = 1; wave <= level.waves.length; wave++) {
      until(game, () => game.phase === "active");
      assert.equal(game.wave, wave);
      for (let step = 0; step < 12_000 && game.phase === "active"; step++) {
        for (const [index, { spec }] of game.devices.entries()) {
          if (!game.deviceReady(index)) continue;
          const targets = game.enemies.filter((enemy) => !isAirborne(enemy) && (spec.kind === "sluice"
            ? Math.hypot(enemy.x - spec.center[0], enemy.y - spec.center[1]) <= DEVICES.sluice.radius
            : enemy.x >= 7 && enemy.x <= 17 && Math.abs(enemy.y - 5) < 0.7));
          if ((targets.length >= 2 || targets.some(({ type }) => type === "cable-overseer" || type === "lotus-toad")) && game.activateDevice(index))
            used++;
        }
        game.tick(STEP);
        interrupted ||= game.enemies.some((enemy) => enemy.type === "cable-overseer" && isStaggered(enemy));
      }
      assert.notEqual(game.phase, "active");
      while (!game.ended && nextPurchase < purchases.length) {
        const [plot, action] = purchases[nextPurchase];
        const succeeded = action === undefined || action === "blast" || action === "volley" || action === "piercer"
          ? game.upgrade(plot, action)
          : game.build(plot, action);
        if (!succeeded) break;
        nextPurchase++;
      }
    }
    assert.equal(game.phase, "won", level.name);
    assert.equal(rateBattle(level, game.health), 3, level.name);
    assert(used >= 1);
    if (level === WINCH_GALLERY) {
      assert(game.encountered.has("cable-overseer"));
      assert(interrupted);
    }
  }
});
