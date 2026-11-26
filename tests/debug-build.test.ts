import assert from "node:assert/strict";
import test from "node:test";
import { STAGES, unlockedThroughIndex } from "../src/content/campaign.ts";
import { spentStars, TALENTS, totalStarsEarned } from "../src/content/talents.ts";
import type { TalentLevels } from "../src/content/talents.ts";
import {
  DEBUG_CLEAR_RATINGS,
  DEBUG_SAVE_KEY,
  debugUnlockedBackend,
} from "../src/platform/debug.ts";
import { SAVE_KEY, SaveStore } from "../src/platform/save.ts";

function memoryBackend(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    async read(key: string) {
      return data.get(key) ?? null;
    },
    async write(key: string, value: string) {
      data.set(key, value);
    },
  };
}

test("debug unlocks keep the production save untouched", async () => {
  const playable = STAGES.filter((stage) => stage.level);
  const original = JSON.stringify({
    version: 1,
    ratings: { "01": 1 },
    sound: true,
    music: false,
  });
  const backend = memoryBackend({ [SAVE_KEY]: original });
  const save = new SaveStore(debugUnlockedBackend(backend));

  await save.load();

  assert.equal(Object.keys(DEBUG_CLEAR_RATINGS).length, playable.length);
  assert.equal(unlockedThroughIndex(save.snapshot.ratings), STAGES.length - 1);
  assert.equal(totalStarsEarned(save.snapshot.ratings), playable.length * 3);
  for (const stage of playable) assert.equal(save.snapshot.ratings[stage.id], 3);
  assert.equal(save.snapshot.sound, true);
  assert.equal(save.snapshot.music, false);

  const maxed = Object.fromEntries(TALENTS.map((talent) => [talent.id, 3])) as TalentLevels;
  save.setTalents(maxed);
  await save.settled();

  assert.equal(spentStars(save.snapshot.talents), 50);
  assert.equal(spentStars(save.snapshot.talents), spentStars(maxed));
  assert.equal(backend.data.get(SAVE_KEY), original);
  assert.notEqual(backend.data.get(DEBUG_SAVE_KEY), original);
  assert.deepEqual(JSON.parse(backend.data.get(DEBUG_SAVE_KEY)!).talents, maxed);
});

test("an existing debug save receives newly added stage ratings", async () => {
  const debugSave = JSON.stringify({
    version: 1,
    ratings: { "01": 1 },
    sound: false,
  });
  const backend = memoryBackend({ [DEBUG_SAVE_KEY]: debugSave });
  const save = new SaveStore(debugUnlockedBackend(backend));

  await save.load();

  assert.equal(save.snapshot.ratings["01"], 3);
  for (const stage of STAGES.filter((stage) => stage.level))
    assert.equal(save.snapshot.ratings[stage.id], 3);
  assert.notEqual(backend.data.get(DEBUG_SAVE_KEY), debugSave);
});