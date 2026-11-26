import assert from "node:assert/strict";
import test from "node:test";
import {
  REVIEW_PROMPT_STAGES,
  ReviewPromptController,
  sanitizeReviewPrompts,
} from "../src/platform/review.ts";
import { SAVE_KEY, SaveStore } from "../src/platform/save.ts";
import type { SaveBackend } from "../src/platform/save.ts";

function memoryBackend(initial: Record<string, string> = {}): SaveBackend {
  const data = new Map(Object.entries(initial));
  return {
    async read(key) {
      return data.get(key) ?? null;
    },
    async write(key, value) {
      data.set(key, value);
    },
  };
}

test("review prompt queues only for stages 06 and 12 and consumes once", () => {
  const controller = new ReviewPromptController();
  assert.deepEqual([...REVIEW_PROMPT_STAGES], ["06", "12"]);

  assert.equal(controller.noteStageCleared("05", []), false);
  assert.equal(controller.consumePending([]), null);

  assert.equal(controller.noteStageCleared("06", []), true);
  assert.equal(controller.peekPending([]), "06");
  assert.equal(controller.consumePending([]), "06");
  assert.equal(controller.consumePending([]), null);

  assert.equal(controller.noteStageCleared("06", ["06"], false), false);
  assert.equal(controller.noteStageCleared("12", ["06"], false), true);
  assert.equal(controller.consumePending(["06"], false), "12");

  // Once the player has opened TapTap review (e.g. after stage 06), stage 12 no longer prompts.
  assert.equal(controller.noteStageCleared("12", ["06"], true), false);
  assert.equal(controller.consumePending(["06"], true), null);
});

test("review prompt persists prompted stages in save and stays compatible with legacy saves", async () => {
  const backend = memoryBackend({
    [SAVE_KEY]: JSON.stringify({
      version: 1,
      ratings: { "06": 3 },
      landmarks: [],
      sound: false,
      music: true,
    }),
  });
  const save = new SaveStore(backend);
  await save.load();
  assert.deepEqual(save.snapshot.reviewPrompts, []);
  assert.equal(save.snapshot.reviewOpened, false);

  save.markReviewPrompted("06");
  save.markReviewPrompted("06");
  save.markReviewOpened();
  await save.settled();

  const reloaded = new SaveStore(backend);
  await reloaded.load();
  assert.deepEqual(reloaded.snapshot.reviewPrompts, ["06"]);
  assert.equal(reloaded.snapshot.reviewOpened, true);
  assert.deepEqual(sanitizeReviewPrompts(["06", "01", "12", "12", 42]), ["06", "12"]);
});

test("review prompts and opening wait for TapTap service consent", async () => {
  let allowed = false;
  let calls = 0;
  const controller = new ReviewPromptController({
    async openReview() {
      calls++;
      return { opened: true };
    },
  }, () => allowed);

  assert.equal(controller.noteStageCleared("06", []), false);
  assert.equal(controller.peekPending([]), null);
  assert.deepEqual(await controller.openReview(), { opened: false, reason: "consent" });
  assert.equal(calls, 0);

  allowed = true;
  assert.equal(controller.noteStageCleared("06", []), true);
  assert.equal(controller.consumePending([]), "06");
  assert.deepEqual(await controller.openReview(), { opened: true });
  assert.equal(calls, 1);

  allowed = false;
  assert.equal(controller.noteStageCleared("12", [], false), false);
});

test("review controller bridges to native TapReview plugin and degrades safely when unsupported", async () => {
  const webController = new ReviewPromptController();
  assert.equal(webController.supported, false);
  assert.deepEqual(await webController.openReview(), { opened: false, reason: "unsupported" });

  let calls = 0;
  const androidController = new ReviewPromptController({
    async openReview() {
      calls++;
      return { opened: true };
    },
  });
  assert.equal(androidController.supported, true);
  assert.deepEqual(await androidController.openReview(), { opened: true });
  assert.equal(calls, 1);

  const invokedController = new ReviewPromptController({
    async openReview() {
      return { invoked: true, tapInstalled: true };
    },
  });
  assert.deepEqual(await invokedController.openReview(), {
    invoked: true,
    tapInstalled: true,
  });

  const failingController = new ReviewPromptController({
    async openReview() {
      throw new Error("tap review unavailable");
    },
  });
  assert.deepEqual(await failingController.openReview(), {
    opened: false,
    reason: "failed",
    message: "tap review unavailable",
  });
});
