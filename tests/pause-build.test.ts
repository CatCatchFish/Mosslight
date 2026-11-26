import assert from "node:assert/strict";
import test from "node:test";
import { STAGES } from "../src/content/campaign.ts";
import { DefenseGame } from "../src/engine/defense.ts";
import { buildPose } from "../src/render/tower-life.ts";

const stage01 = STAGES[0].level!;
const stage04 = STAGES[3].level!;

test("building or upgrading while paused settles immediately without invisible drop-in state", () => {
  const game = new DefenseGame(stage04, ["arrow", "cannon", "guard-post"]);
  game.gold = 1000;
  game.paused = true;

  assert.equal(game.build(0, "arrow"), true);
  const tower = game.towers.get(0);
  assert.ok(tower);
  assert.equal(tower.builtAt, undefined);

  assert.equal(game.upgrade(0), true);
  assert.equal(tower.tier, 2);
  assert.equal(tower.upgradedAt, undefined);
  assert.equal(tower.previous, undefined);

  const guardPlot = stage04.plots.findIndex((_, index) => index > 0 && game.guardPoints(index, "guard-post").length > 0);
  assert.ok(guardPlot >= 0);
  assert.equal(game.build(guardPlot, "guard-post"), true);
  const post = game.guardPosts.get(guardPlot);
  assert.ok(post);
  assert.equal(post.builtAt, undefined);

  assert.equal(game.upgrade(guardPlot), true);
  assert.equal(post.tier, 2);
  assert.equal(post.upgradeFrom, undefined);
});

test("building while active keeps animation timestamps and never renders at zero alpha", () => {
  const game = new DefenseGame(stage01, ["arrow", "cannon"]);
  assert.equal(game.build(0, "arrow"), true);
  const tower = game.towers.get(0);
  assert.ok(tower);
  assert.equal(tower.builtAt, game.time);
  assert.ok(buildPose(0).alpha >= 0.35);
});
