import assert from "node:assert/strict";
import { test } from "node:test";
import { SAVE_KEY, SaveStore } from "../src/platform/save.ts";
import type { SaveBackend } from "../src/platform/save.ts";

function memoryBackend(data = new Map<string, string>()) {
  const storage: SaveBackend = {
    read: async (key) => data.get(key) ?? null,
    write: async (key, value) => {
      data.set(key, value);
    },
  };
  return { data, storage };
}

test("the Web save migrates existing ratings and landmarks", async () => {
  const { data, storage } = memoryBackend(
    new Map([
      ["emerald-riftwatch.campaign.v1", '{"01":3,"06":7}'],
      ["emerald-riftwatch.landmarks.v1", '["hut","hut","ferry",1]'],
    ]),
  );
  const store = new SaveStore(storage);
  await store.load();
  assert.deepEqual(store.snapshot, {
    version: 1,
    ratings: { "01": 3 },
    landmarks: ["hut", "ferry"],
    sound: false,
    music: true,
    ambience: true,
    soundVolume: 100,
    musicVolume: 40,
    artQuality: "high",
    loadouts: {},
    talents: {},
    seenTowers: [],
    reviewPrompts: [],
    reviewOpened: false,
  });
  assert.deepEqual(JSON.parse(data.get(SAVE_KEY) ?? ""), store.snapshot);
});

test("back-to-back writes preserve progression and independent audio settings", async () => {
  const { storage } = memoryBackend();
  const store = new SaveStore(storage);
  await store.load();
  store.recordClear("01", 3);
  store.recordClear("01", 1);
  store.discover("hut");
  store.discover("hut");
  store.setSound(true);
  store.setMusic(false);
  store.setAmbience(false);
  store.setVolume("soundVolume", 0);
  store.setVolume("musicVolume", 73);
  store.setArtQuality("low");
  store.setLoadout("10", ["storm", "arrow", "ballista"]);
  store.setLoadout("06", ["cannon", "ember"]);
  await store.settled();
  const reopened = new SaveStore(storage);
  await reopened.load();
  assert.deepEqual(reopened.snapshot, {
    version: 1,
    ratings: { "01": 3 },
    landmarks: ["hut"],
    sound: true,
    music: false,
    ambience: false,
    soundVolume: 0,
    musicVolume: 73,
    artQuality: "low",
    loadouts: { "06": ["cannon", "ember"], "10": ["storm", "arrow", "ballista"] },
    talents: {},
    seenTowers: [],
    reviewPrompts: [],
    reviewOpened: false,
  });
});

test("existing saves keep their mute settings and recover usable mixer levels", async () => {
  const { storage } = memoryBackend(new Map([
    [SAVE_KEY, '{"version":1,"sound":true,"music":false,"musicVolume":"invalid"}'],
  ]));
  const store = new SaveStore(storage);
  await store.load();
  assert.equal(store.snapshot.sound, true);
  assert.equal(store.snapshot.music, false);
  assert.equal(store.snapshot.ambience, true);
  assert.equal(store.snapshot.soundVolume, 100);
  assert.equal(store.snapshot.musicVolume, 40);
  assert.equal(store.snapshot.artQuality, "high");
  store.setVolume("soundVolume", 123);
  store.setVolume("musicVolume", -5);
  store.setVolume("musicVolume", NaN);
  assert.equal(store.snapshot.soundVolume, 100);
  assert.equal(store.snapshot.musicVolume, 0);
});

test("a newer save survives opening a previous app version", async () => {
  const { storage, data } = memoryBackend(
    new Map([[SAVE_KEY, '{"version":2,"anything":true}']]),
  );
  let problems = 0;
  const store = new SaveStore(storage, () => {
    problems++;
  });
  await store.load();
  store.discover("hut");
  await store.settled();
  assert.equal(problems, 1);
  assert.equal(data.get(SAVE_KEY), '{"version":2,"anything":true}');
});

test("retired rift towers are removed from saved loadouts without losing ratings or valid towers", async () => {
  const { storage } = memoryBackend(new Map([
    [SAVE_KEY, JSON.stringify({
      version: 1,
      ratings: { "12": 2, "13": 3 },
      loadouts: {
        global: ["rift-arc", "arrow", "void-spire", "frost-kennel", "crystal-citadel"],
        "12": ["frost-kennel", "arrow"],
        "13": ["rift-arc", "crystal-citadel"],
      },
    })],
  ]));
  const store = new SaveStore(storage);
  await store.load();
  assert.deepEqual(store.snapshot.ratings, { "12": 2, "13": 3 });
  assert.deepEqual(store.snapshot.loadouts, {
    global: ["arrow", "frost-kennel"],
    "12": ["frost-kennel", "arrow"],
  });
});
