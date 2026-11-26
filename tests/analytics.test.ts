import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANALYTICS_CONSENT_KEY,
  AnalyticsConsentStore,
} from "../src/platform/analytics-consent.ts";
import {
  GameAnalytics,
  sanitizeProperties,
} from "../src/platform/analytics.ts";
import type { TapDBBridge, TapDBState } from "../src/platform/analytics.ts";
import { SAVE_KEY } from "../src/platform/save.ts";
import type { SaveBackend } from "../src/platform/save.ts";

function memoryBackend(data = new Map<string, string>()): SaveBackend {
  return {
    read: async (key) => data.get(key) ?? null,
    write: async (key, value) => { data.set(key, value); },
  };
}

function bridge(initialState: TapDBState = "ready") {
  const calls: { method: string; options?: unknown }[] = [];
  let state = initialState;
  const native: TapDBBridge = {
    async getStatus() {
      calls.push({ method: "status" });
      return { supported: true, configured: true, consent: true, state };
    },
    async setConsent(options) {
      calls.push({ method: "consent", options });
      return { supported: true, configured: true, consent: options.allowed, state };
    },
    async initialize() {
      calls.push({ method: "initialize" });
      return { state };
    },
    async logEvent(options) {
      calls.push({ method: "event", options });
      return { accepted: true };
    },
  };
  return { native, calls, setState: (next: TapDBState) => { state = next; } };
}

test("analytics consent is independent from the game save and persists both choices", async () => {
  const data = new Map<string, string>([[SAVE_KEY, '{"version":1,"ratings":{"01":3}}']]);
  const backend = memoryBackend(data);
  const store = new AnalyticsConsentStore(backend);
  assert.equal(store.snapshot, null);
  await store.load();
  assert.equal(store.snapshot, null);
  await store.setConsent(true);
  assert.equal(store.snapshot, true);
  assert.equal(data.get(SAVE_KEY), '{"version":1,"ratings":{"01":3}}');
  assert.deepEqual(JSON.parse(data.get(ANALYTICS_CONSENT_KEY) ?? ""), { version: 1, allowed: true });
  const reopened = new AnalyticsConsentStore(backend);
  await reopened.load();
  assert.equal(reopened.snapshot, true);
  await reopened.setConsent(false);
  const rejected = new AnalyticsConsentStore(backend);
  await rejected.load();
  assert.equal(rejected.snapshot, false);
});

test("missing or malformed consent remains undecided", async () => {
  for (const raw of [null, "broken", '{"version":1}', '{"allowed":"true"}']) {
    const store = new AnalyticsConsentStore(memoryBackend(new Map(
      raw === null ? [] : [[ANALYTICS_CONSENT_KEY, raw]],
    )));
    await store.load();
    assert.equal(store.snapshot, null);
  }
});

test("a failed consent write does not enable analytics", async () => {
  const backend: SaveBackend = {
    read: async () => null,
    write: async () => { throw new Error("storage full"); },
  };
  const store = new AnalyticsConsentStore(backend);
  await assert.rejects(store.setConsent(true), /storage full/);
  assert.equal(store.snapshot, null);
});

test("rejected consent never initializes or reports", async () => {
  const { native, calls } = bridge();
  const analytics = new GameAnalytics(native);
  analytics.restore(false);
  analytics.logEvent("stage_start", { stage_id: "01" });
  await analytics.initialize();
  assert.equal(calls.length, 0);
  assert.equal(analytics.state, "denied");
});

test("accepted consent sanitizes event properties before bridging", async () => {
  const { native, calls } = bridge();
  const analytics = new GameAnalytics(native);
  analytics.restore(true);
  await Promise.resolve();
  analytics.logEvent("stage_result", {
    stage_id: "17", stars: 3, health: 0, invalid: Number.NaN,
    huge: 1e16, "Bad-Key": "discard", note: "x".repeat(257), result: "win",
  });
  assert.equal(calls.filter((call) => call.method === "event").length, 1);
  assert.deepEqual(calls.find((call) => call.method === "event")?.options, {
    event: "stage_result",
    properties: { stage_id: "17", stars: 3, health: 0, result: "win" },
  });
  assert.deepEqual(sanitizeProperties({ edge: -9e15, text: "x".repeat(256) }), {
    edge: -9e15, text: "x".repeat(256),
  });
});

test("events wait for initialization and are discarded after failure or withdrawal", async () => {
  const originalWindow = Reflect.get(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { setTimeout: () => 0 },
  });
  try {
    const { native, calls, setState } = bridge("initializing");
    const analytics = new GameAnalytics(native);
    await analytics.setConsent(true);
    analytics.logEvent("stage_start", { stage_id: "01" });
    assert.equal(calls.filter((call) => call.method === "event").length, 0);
    setState("ready");
    await analytics.refresh();
    assert.equal(calls.filter((call) => call.method === "event").length, 1);

    setState("ready");
    await analytics.refresh();
    assert.equal(calls.filter((call) => call.method === "event").length, 1);

    setState("initializing");
    await analytics.refresh();
    analytics.logEvent("stage_result", { stage_id: "01", result: "win" });
    setState("failed");
    await analytics.refresh();
    setState("initializing");
    await analytics.initialize();
    analytics.logEvent("talent_reset");
    await analytics.setConsent(false);
    setState("ready");
    await analytics.refresh();
    assert.equal(calls.filter((call) => call.method === "event").length, 1);
    assert.deepEqual(calls.filter((call) => call.method === "consent").at(-1)?.options, { allowed: false });
  } finally {
    if (originalWindow === undefined) Reflect.deleteProperty(globalThis, "window");
    else Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  }
});

test("unconfigured and failed SDK states stay silent without breaking the game flow", async () => {
  const unconfigured = bridge("unconfigured");
  const first = new GameAnalytics(unconfigured.native);
  await first.setConsent(true);
  first.logEvent("stage_start", { stage_id: "01" });
  assert.equal(unconfigured.calls.some((call) => call.method === "event"), false);

  const failed = bridge("configuration_error");
  const second = new GameAnalytics(failed.native);
  await second.setConsent(true);
  await second.initialize();
  second.logEvent("stage_result", { stage_id: "01" });
  assert.equal(failed.calls.some((call) => call.method === "initialize"), false);
  assert.equal(failed.calls.some((call) => call.method === "event"), false);
  assert.equal(second.configurationError, true);
});
