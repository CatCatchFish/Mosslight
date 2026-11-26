import { createRoute, lowerTrackPoints, overTunnel } from "../src/engine/route.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PLAYABLE_LEVELS,
  STAGES,
  battleWeather,
  newlyIntroduced,
} from "../src/content/campaign.ts";
import { ENEMIES } from "../src/content/enemies.ts";
import { TOWERS } from "../src/content/towers.ts";
import { WEATHER, weatherAtWave } from "../src/content/weather.ts";
import { SLUICE_CROSSING, WAYPOINTS } from "../src/content/world.ts";
import { DefenseGame } from "../src/engine/defense.ts";
import { planFormation } from "../src/engine/formation.ts";
import type { TowerId } from "../src/engine/types.ts";
import { SPECIALIZATION_ART } from "../src/render/tower-specializations.ts";

test("campaign has 18 mapped stations, including the full mire campaign", () => {
  assert.equal(STAGES.length, WAYPOINTS.length);
  assert.equal(STAGES.length, 18);
  assert.equal(STAGES.filter((stage) => stage.chapter === 4).length, 6);
  assert.equal(new Set(STAGES.map((stage) => stage.id)).size, STAGES.length);
  const playable = Array.from({ length: 18 }, (_, i) => String(i + 1).padStart(2, "0"));
  assert.deepEqual(Object.keys(PLAYABLE_LEVELS).sort(), playable);
  for (const id of playable) {
    assert(STAGES.some((stage) => stage.id === id && stage.level?.id === id));
  }
  const expansion = STAGES.slice(-5);
  assert.deepEqual(expansion.map((stage) => stage.level?.entries.length), [2, 2, 2, 3, 3]);
  assert(expansion.every((stage) => !(stage.level?.bridges ?? []).some((bridge) => bridge.style === "stones")));
});

test("the opening regions gradually unlock tower tiers and guard specializations", () => {
  const games = Object.keys(PLAYABLE_LEVELS).sort().map((id) => new DefenseGame(PLAYABLE_LEVELS[id]));
  assert.deepEqual(games.map((game) => game.maxTowerTier), [1, 2, 2, 3, 3, ...Array(13).fill(4)]);
  assert.deepEqual(games.map((game) => game.level.guardPost ? game.maxGuardTier : 0), [0, 0, 2, 2, 2, ...Array(13).fill(4)]);
  for (const game of games.slice(0, 6)) {
    game.gold = 1000;
    assert(game.build(0, "arrow"));
    for (let tier = 2; tier <= Math.min(3, game.maxTowerTier); tier++) assert(game.upgrade(0));
    assert(!game.upgrade(0));
    assert.equal(game.upgrade(0, "sniper"), game.maxTowerTier === 4);
  }
});

test("each playable stage opens with lighter waves before a larger and tougher finale", () => {
  const levels = Object.values(PLAYABLE_LEVELS).sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(levels.map(({ waves }) => waves.length), [5, 6, 7, 7, 8, 10, 9, 9, 11, 9, 10, 10, 9, 9, 9, 10, 10, 11]);
  for (const { id, waves } of levels) {
    const [first, second, last] = [waves[0], waves[1], waves[waves.length - 1]].map((wave) => {
      const arrivals = Object.values(wave.groups).flatMap((groups) => planFormation(groups).arrivals);
      const health = arrivals.reduce((sum, { type }) => sum + Math.round(ENEMIES[type].hp * (wave.hp ?? 1)), 0);
      return { count: arrivals.length, health };
    });
    assert(last.count > Math.max(first.count, second.count), id);
    assert(last.health > Math.max(first.health, second.health), id);
  }
});

test("every tower specialization has dedicated battle and icon art", () => {
  for (const type of Object.keys(TOWERS) as TowerId[])
    assert.deepEqual(Object.keys(SPECIALIZATION_ART[type]).sort(), Object.keys(TOWERS[type].paths).sort(), type);
});

test("new enemies debut in the planned regional waves", () => {
  const debuts = new Map<string, [string, number]>();
  for (const { level } of STAGES) {
    if (!level) continue;
    level.waves.forEach((wave, index) => {
      for (const groups of Object.values(wave.groups))
        for (const { type } of planFormation(groups).arrivals)
          if (!debuts.has(type)) debuts.set(type, [level.id, index + 1]);
    });
  }
  assert.deepEqual(debuts.get("moss-badger"), ["03", 4]);
  assert.deepEqual(debuts.get("mirror-shrimp"), ["05", 3]);
  assert.deepEqual(debuts.get("rivet-mite"), ["07", 5]);
  assert.deepEqual(debuts.get("ice-sail"), ["10", 3]);
  assert.deepEqual(debuts.get("frost-porcupine"), ["10", 6]);
  assert.deepEqual(debuts.get("mirror-ibex"), ["11", 2]);
  assert.deepEqual(debuts.get("snowbrush-fox"), ["11", 2]);
  assert(!ENEMIES.slime.ability && !ENEMIES.runner.ability);
});

test("weather inherits region presets, supports level overrides, and changes on authored waves", () => {
  const ids = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
  assert.deepEqual(
    ids.map((id) => weatherAtWave(battleWeather(PLAYABLE_LEVELS[id]), 0)),
    ["clear", "breeze", "mist", "mist", "mist", "mist", "dust", "dust", "dust", "snow"],
  );
  const wetland = battleWeather(PLAYABLE_LEVELS["04"]);
  assert.deepEqual([0, 1, 2, 4, 5].map((wave) => weatherAtWave(wetland, wave)),
    ["mist", "mist", "rain", "downpour", "mist"]);
  assert.equal(weatherAtWave(battleWeather(PLAYABLE_LEVELS["03"]), 2), "mist");
  assert.equal(weatherAtWave(battleWeather(PLAYABLE_LEVELS["10"]), 4), "snowSquall");

  for (const chapter of new Set(STAGES.map((stage) => stage.chapter))) {
    const plan = battleWeather({ chapter });
    assert(Object.hasOwn(WEATHER, plan.initial));
    let previous = 0;
    for (const { wave, preset } of plan.changes ?? []) {
      assert(Number.isInteger(wave) && wave > previous);
      assert(Object.hasOwn(WEATHER, preset));
      previous = wave;
    }
  }
  assert.equal(weatherAtWave(battleWeather({ chapter: 4 }), 0), "miasma");
  assert.equal(weatherAtWave(battleWeather({ chapter: 999 }), 0), "clear");

  for (const [id, level] of Object.entries(PLAYABLE_LEVELS)) {
    const plan = battleWeather(level);
    assert(Object.hasOwn(WEATHER, plan.initial), `stage ${id} initial weather valid`);
    let previous = 0;
    let hasSevere = false;
    for (const { wave, preset } of plan.changes ?? []) {
      assert(Number.isInteger(wave) && wave > previous && wave <= level.waves.length,
        `stage ${id} weather wave ${wave} in range`);
      assert(Object.hasOwn(WEATHER, preset), `stage ${id} weather preset ${preset} valid`);
      if (WEATHER[preset].severity === "severe") hasSevere = true;
      previous = wave;
    }
    if (id !== "01") {
      assert(hasSevere, `stage ${id} escalates to severe weather on hard waves`);
      const finale = WEATHER[weatherAtWave(plan, level.waves.length)];
      assert.equal(finale.severity, "severe", `stage ${id} finale wave has severe weather`);
    }
  }
  for (const [id, preset] of Object.entries(WEATHER)) {
    assert(preset.label.length > 0 && preset.desc.length > 0 && preset.accent.startsWith("#"),
      `weather ${id} has UI metadata`);
    if (preset.severity === "severe") {
      assert("cue" in preset && preset.cue, `severe weather ${id} defines audio cue`);
      assert("vignette" in preset && preset.vignette, `severe weather ${id} defines vignette`);
    }
  }
});

test("stage four is on the world bridge and its battle deck is connected to the road", () => {
  const [x, y] = WAYPOINTS[3];
  assert.equal(y, SLUICE_CROSSING.west[1]);
  assert(x > SLUICE_CROSSING.west[0] && x < SLUICE_CROSSING.east[0]);
  const level = PLAYABLE_LEVELS["04"];
  assert(level.bridges?.some(({ style }) => style === "sluice"));
  assert(level.bridgeDeck?.length);
  for (const platform of level.bridgeDeck) assert(level.plots.includes(platform));
});

test("campaign maps have valid entry IDs, routes, devices and wave groups", () => {
  for (const level of Object.values(PLAYABLE_LEVELS)) {
    const trackSwitch = level.trackSwitch;
    for (const [x, y] of [
      ...level.entries.flatMap((entry) => entry.route), ...level.plots, ...level.pools,
      ...(trackSwitch ? [trackSwitch.at, ...trackSwitch.upper, ...trackSwitch.lower] : []),
      ...(level.tunnels ?? []).flatMap(({ from, to }) => [from, to]),
      ...(level.devices ?? []).map((device) => device.at),
      ...(level.scenery ?? []).map((landmark) => landmark.at),
      ...(level.shallows ?? []),
    ]) {
      assert(Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < level.width && y >= 0 && y < level.height,
        `${level.id} tile ${x},${y} outside the battlefield`);
    }
    const roads = new Set<string>();
    const entries = new Set(level.entries.map((entry) => entry.id));
    assert.equal(entries.size, level.entries.length);
    assert(level.waves.length > 0);
    const routes = level.entries.map(({ route }) => route);
    for (const entry of level.entries) {
      if (entry.revealWave !== undefined)
        assert(Number.isInteger(entry.revealWave) && entry.revealWave >= 1 && entry.revealWave <= level.waves.length);
    }
    if (trackSwitch) {
      assert(level.guardPost);
      assert(trackSwitch.upper.length >= 2 && trackSwitch.lower.length >= 2);
      assert.deepEqual(trackSwitch.lower[0], trackSwitch.upper[0]);
      assert.deepEqual(trackSwitch.lower.at(-1), trackSwitch.upper.at(-1));
      const lowerRoutes = level.entries.flatMap(({ route }) => {
        const lower = lowerTrackPoints(route, trackSwitch);
        return lower ? [lower] : [];
      });
      assert(lowerRoutes.length > 0);
      routes.push(...lowerRoutes);
    }
    for (const route of routes) {
      assert(route.length >= 2);
      assert.deepEqual(route.at(-1), level.entries[0].route.at(-1));
      for (let i = 1; i < route.length; i++) {
        const [x, y] = route[i - 1];
        const [a, b] = route[i];
        assert.notEqual(
          x === a,
          y === b,
          "route segment must be orthogonal and nonempty",
        );
        const n = Math.abs(a - x) + Math.abs(b - y);
        for (let step = 0; step <= n; step++)
          roads.add(
            [x + Math.sign(a - x) * step, y + Math.sign(b - y) * step].join(
              ",",
            ),
          );
      }
    }
    for (const tunnel of level.tunnels ?? []) {
      const { from: [x, y], to: [tx, ty] } = tunnel;
      assert.notEqual(x === tx, y === ty, "tunnel must span a straight section");
      assert(routes.some((route) => createRoute(route, [tunnel]).tunnels.length > 0), "tunnel must cover a route");
      assert(level.plots.every(([px, py]) => !overTunnel(tunnel, px, py)), "tunnel roof cannot have build plots");
    }
    const bridged = new Set<string>();
    for (const {
      from: [x, y],
      to: [tx, ty],
    } of level.bridges ?? []) {
      assert.notEqual(
        x === tx,
        y === ty,
        "bridge must span a straight section",
      );
      for (let i = 0; i <= Math.abs(tx - x) + Math.abs(ty - y); i++) {
        const tile = [
          x + Math.sign(tx - x) * i,
          y + Math.sign(ty - y) * i,
        ].join(",");
        assert(roads.has(tile), level.id + " bridge off road: " + tile);
        bridged.add(tile);
      }
    }
    const pools = new Set(level.pools.map((point) => point.join(",")));
    const plots = new Set(level.plots.map((point) => point.join(",")));
    for (const point of level.plots) {
      assert(
        !roads.has(point.join(",")) && !pools.has(point.join(",")),
        level.id + " blocked plot " + point.join(","),
      );
    }
    for (const point of level.shallows ?? [])
      assert(roads.has(String(point)) && !pools.has(String(point)), `${level.id} invalid shallows ${point}`);
    for (const tile of pools)
      assert(
        !roads.has(tile) || bridged.has(tile),
        level.id + " unbridged water " + tile,
      );
    for (const { at } of [...(level.devices ?? []), ...(trackSwitch ? [trackSwitch] : [])]) {
      const tile = at.join(",");
      assert(!pools.has(tile) && !plots.has(tile) && !roads.has(tile), level.id + " blocked device " + tile);
    }
    for (const device of level.devices ?? []) {
      if ("center" in device) {
        assert(roads.has(device.center.join(",")));
      } else {
        const [x, y] = device.from, [tx, ty] = device.to;
        assert.notEqual(x === tx, y === ty);
        for (let step = 0; step <= Math.abs(tx - x) + Math.abs(ty - y); step++)
          assert(roads.has([x + step * Math.sign(tx - x), y + step * Math.sign(ty - y)].join(",")));
      }
    }
    for (const [index, wave] of level.waves.entries()) {
      assert(Object.keys(wave.groups).length > 0);
      for (const [id, groups] of Object.entries(wave.groups)) {
        assert(entries.has(id));
        assert((level.entries.find((entry) => entry.id === id)?.revealWave ?? 1) <= index + 1);
        assert(groups.length);
        for (const [members, count, gap] of groups) {
          const lineup = typeof members === "string" ? [members] : members;
          assert(lineup.every((enemy) => Object.hasOwn(ENEMIES, enemy)));
          assert(Number.isInteger(count) && count > 0 && gap > 0);
        }
      }
    }
  }
});

test("tower access grows by stage and introductions contain only first appearances", () => {
  assert.deepEqual(PLAYABLE_LEVELS["01"].towers, ["arrow", "cannon", "frost"]);
  assert(PLAYABLE_LEVELS["06"].towers.includes("ember"));
  assert(!PLAYABLE_LEVELS["06"].towers.includes("storm"));
  assert(PLAYABLE_LEVELS["10"].towers.includes("storm"));
  assert(PLAYABLE_LEVELS["07"].towers.includes("ballista"));
  assert(PLAYABLE_LEVELS["10"].towers.includes("ballista"));
  assert.deepEqual([...newlyIntroduced("01")].sort(), ["runner", "slime"]);
  assert.deepEqual([...newlyIntroduced("02")].sort(), ["pine-hopper", "stump-spirit"]);
  assert.deepEqual([...newlyIntroduced("03")].sort(), ["moss-badger", "pine-boar"]);
  assert.deepEqual([...newlyIntroduced("04")].sort(), ["ferry-snail", "reed-crab", "reed-newt", "weir-frog", "weir-turtle"]);
  assert.deepEqual([...newlyIntroduced("05")].sort(), ["lily-skater", "lotus-toad", "mirror-shrimp"]);
  assert.deepEqual([...newlyIntroduced("06")].sort(), [
    "chief",
    "guard",
    "moth",
  ]);
  assert.deepEqual([...newlyIntroduced("07")].sort(), ["cinder-bat", "lamp-mole", "ore-crawler", "rivet-mite", "slag-cart", "slag-driller"]);
  assert.deepEqual([...newlyIntroduced("08")], ["magnet-beetle", "cable-overseer"]);
  assert.deepEqual([...newlyIntroduced("09")], ["slag-colossus"]);
  assert.deepEqual([...newlyIntroduced("10")].sort(), ["frost-hare", "frost-mammoth", "frost-porcupine", "frost-ray", "ice-sail", "ram", "wisp"]);
  assert.deepEqual([...newlyIntroduced("11")].sort(), ["mirror-ibex", "snowbrush-fox"]);
  assert.deepEqual([...newlyIntroduced("12")].sort(), ["blizzard-elk", "frost-bear", "frost-moose", "frost-owl", "frost-yeti", "rime-golem"]);
  assert.deepEqual([...newlyIntroduced("13")].sort(), ["bloat-sporer", "mire-croc", "mire-mycelid", "mire-treant", "vine-viper"]);
  assert.deepEqual([...newlyIntroduced("14")].sort(), ["mire-elder", "mudskipper", "whisker-catfish"]);
  assert.deepEqual([...newlyIntroduced("15")].sort(), ["shield-crayfish", "stone-clam"]);
  assert.deepEqual([...newlyIntroduced("16")], ["lantern-moth"]);
  assert.deepEqual([...newlyIntroduced("17")].sort(), ["mire-matriarch", "reed-spider", "reed-spiderling", "spider-egg", "spore-pod"]);
  assert.deepEqual([...newlyIntroduced("18")], ["sluice-dragon"]);
  assert(!PLAYABLE_LEVELS["13"].towers.includes("reed-post"));
  assert(PLAYABLE_LEVELS["14"].towers.includes("reed-post"));
  assert(!PLAYABLE_LEVELS["14"].towers.includes("salt-caster"));
  assert(PLAYABLE_LEVELS["15"].towers.includes("salt-caster"));
  assert(!PLAYABLE_LEVELS["15"].towers.includes("spore-caster"));
  assert(PLAYABLE_LEVELS["16"].towers.includes("spore-caster"));
  assert(PLAYABLE_LEVELS["17"].towers.includes("spore-caster"));
  assert(PLAYABLE_LEVELS["18"].towers.includes("spore-caster"));
});

test("enemies from earlier regions do not appear in later regions", () => {
  const seenInChapter = new Map<string, number>();
  for (const { level } of STAGES) {
    if (!level) continue;
    for (const wave of level.waves) {
      for (const groups of Object.values(wave.groups)) {
        for (const { type } of planFormation(groups).arrivals) {
          const prev = seenInChapter.get(type);
          if (prev !== undefined) {
            assert.equal(prev, level.chapter, `enemy ${type} leaked from chapter ${prev} into chapter ${level.chapter} (${level.id})`);
          } else {
            seenInChapter.set(type, level.chapter);
          }
        }
      }
    }
  }
});

test("starting gold increases smoothly across playable stages and wave HP scales without dips", () => {
  const playable = STAGES.map((stage) => stage.level).filter((level) => level !== null);
  for (let i = 1; i < playable.length; i++) {
    assert(
      playable[i].gold > playable[i - 1].gold,
      `stage ${playable[i].id} gold (${playable[i].gold}) should exceed stage ${playable[i - 1].id} (${playable[i - 1].gold})`,
    );
  }
  for (const level of playable) {
    let prevHp = 0;
    for (let w = 0; w < level.waves.length; w++) {
      const hp = level.waves[w].hp ?? 1;
      assert(hp >= prevHp, `stage ${level.id} wave ${w + 1} hp (${hp}) dipped below previous wave (${prevHp})`);
      assert(hp <= 2.0, `stage ${level.id} wave ${w + 1} hp (${hp}) exceeds balanced cap`);
      prevHp = hp;
    }
  }
});
