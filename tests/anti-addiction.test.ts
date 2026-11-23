import assert from "node:assert/strict";
import test from "node:test";
import { enforceAntiAddiction } from "../src/ui/anti-addiction.ts";
import type { AntiAddictionProvider, AntiAddictionResult } from "../src/platform/anti-addiction.ts";

const allowed: AntiAddictionResult = {
  code: 500,
  allowed: true,
  needsLogin: false,
  ageRange: 18,
  remainingSeconds: 3600,
};

function provider(overrides: Partial<AntiAddictionProvider> = {}): AntiAddictionProvider {
  return {
    initialize: async () => ({ configured: false, sdk: "test" }),
    start: async () => ({ ...allowed }),
    login: async () => ({ ...allowed }),
    status: async () => ({ allowed: true, ageRange: 18, remainingSeconds: 3600 }),
    logout: async () => {},
    ...overrides,
  };
}

test("anti-addiction skips the gate when the native SDK is not configured", async () => {
  assert.equal(await enforceAntiAddiction(provider()), true);
});

test("anti-addiction treats NOT_CONFIGURED as an opt-out for offline builds", async () => {
  const unconfigured = provider({
    initialize: async () => {
      throw Object.assign(new Error("missing credentials"), { code: "NOT_CONFIGURED" });
    },
  });
  assert.equal(await enforceAntiAddiction(unconfigured), true);
});

test("anti-addiction lets a successful compliance result enter the game", async () => {
  const configured = provider({ initialize: async () => ({ configured: true, sdk: "test" }) });
  assert.equal(await enforceAntiAddiction(configured), true);
});