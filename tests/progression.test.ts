import assert from "node:assert/strict";
import test from "node:test";
import { STAGES, unlockedThroughIndex } from "../src/content/campaign.ts";

test("campaign progression starts at the first stage and reveals one frontier at a time", () => {
  assert.equal(unlockedThroughIndex({}), 0);
  assert.equal(unlockedThroughIndex({ "01": 3 }), 1);
  assert.equal(unlockedThroughIndex({ "01": 3, "02": 1 }), 2);
  assert.equal(unlockedThroughIndex({ "03": 2 }), 3);
});

test("campaign progression never reveals past the final station", () => {
  const all = Object.fromEntries(STAGES.map((stage) => [stage.id, 3]));
  assert.equal(unlockedThroughIndex(all), STAGES.length - 1);
});