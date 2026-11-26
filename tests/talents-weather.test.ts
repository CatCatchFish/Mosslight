import assert from "node:assert/strict";
import { test } from "node:test";
import { PLAYABLE_LEVELS, STARTER_TOWERS, unlockedTowers } from "../src/content/campaign.ts";
import { resolveTalentEffects, sanitizeTalents, spentStars, totalStarsEarned } from "../src/content/talents.ts";
import { TOWERS } from "../src/content/towers.ts";
import { WEATHER } from "../src/content/weather.ts";
import { DefenseGame } from "../src/engine/defense.ts";
import { DEVICES } from "../src/engine/devices.ts";
import { SaveStore } from "../src/platform/save.ts";
import type { SaveBackend } from "../src/platform/save.ts";

function memoryBackend(initial: Record<string, string> = {}): SaveBackend {
  const store = new Map(Object.entries(initial));
  return {
    async read(key) { return store.get(key) ?? null; },
    async write(key, value) { store.set(key, value); },
  };
}

test("severe weather presets weaken towers and buff enemies, mitigated by weather-ward talent", () => {
  const level = PLAYABLE_LEVELS["07"];
  const plain = new DefenseGame(level);
  plain.applyWeather(WEATHER.sandstorm);
  assert.equal(plain.weatherTowerRange, 0.91);
  assert.equal(plain.weatherEnemyArmor, 0.93);

  plain.applyWeather(WEATHER.toxicStorm);
  assert.equal(plain.weatherTowerRate, 0.9);
  assert.equal(plain.weatherEnemyArmor, 0.92);
  assert.equal(plain.weatherEnemySpeed, 1.06);

  const warded = new DefenseGame(level, undefined, { "weather-ward": 3 });
  warded.applyWeather(WEATHER.blizzard);
  // Blizzard raw towerRate is 0.70 (-30%); max rank-3 ward cuts debuff by 50% -> 0.85
  assert(Math.abs(warded.weatherTowerRate - 0.85) < 1e-6);
  // Enemy armor buff still applies during blizzard
  assert.equal(warded.weatherEnemyArmor, 0.94);
});

test("star talents apply percentage starting gold, sell refund, device cooldown, and respawn bonuses", () => {
  const level = PLAYABLE_LEVELS["04"];
  const base = new DefenseGame(level);
  const boosted = new DefenseGame(level, undefined, {
    supply: 2,
    salvage: 3,
    "device-craft": 2,
    "swift-dispatch": 2,
  });

  assert.equal(boosted.gold, Math.round(base.gold * 1.08));
  assert(boosted.build(0, "arrow"));
  assert.equal(boosted.towerSaleValue(0), Math.floor(TOWERS.arrow.tiers[0].cost * 0.75));

  assert(boosted.startFirstWave());
  boosted.tick(0.05);
  assert(boosted.activateDevice(0));
  const expectedCd = DEVICES[level.devices![0].kind].cooldown * (1 - 0.12);
  assert(Math.abs(boosted.deviceCooldown(0) - expectedCd) < 0.01);

  const effects = resolveTalentEffects({ "guard-spirit": 3 });
  assert.equal(effects.guardRespawnFactor, 0.78);
});

test("save store persists talents, seen towers, and clamps spent stars within earned stars", async () => {
  const backend = memoryBackend();
  const save = new SaveStore(backend);
  await save.load();
  save.recordClear("01", 3);
  save.recordClear("02", 2);
  assert.equal(totalStarsEarned(save.snapshot.ratings), 5);

  // Clearing stage 02 unlocks stage 03 which introduces guard-post
  const unlocked = unlockedTowers(save.snapshot.ratings);
  assert(unlocked.includes("guard-post"));
  assert(unlocked.filter((id) => !STARTER_TOWERS.includes(id)).includes("guard-post"));
  save.markTowersSeen(unlocked);

  save.setTalents({ supply: 2, salvage: 3 }); // costs 5 + 6 = 11 > 5 stars -> salvage clamped
  assert(spentStars(save.snapshot.talents) <= 5);
  await save.settled();

  const reloaded = new SaveStore(backend);
  await reloaded.load();
  assert.deepEqual(reloaded.snapshot.talents, save.snapshot.talents);
  assert(reloaded.snapshot.seenTowers.includes("guard-post"));
  assert.deepEqual(sanitizeTalents({ supply: 99, invalid: 3 }, 10), { supply: 3 });
});
