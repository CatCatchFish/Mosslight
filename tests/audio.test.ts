import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { ENEMIES } from "../src/content/enemies.ts";
import { BOSS_MUSIC_THEMES, GameAudio, Soundtrack } from "../src/platform/audio.ts";

class FakeAudioElement extends EventTarget {
  loop = false;
  preload = "none";
  volume = 1;
  paused = true;
  private srcAttr: string | null = null;
  loadCalls = 0;
  playCalls = 0;
  pauseCalls = 0;
  nextPlayError?: Error;

  get src() {
    return this.srcAttr ?? "";
  }

  set src(value: string) {
    this.srcAttr = value;
  }

  getAttribute(name: string) {
    return name === "src" ? this.srcAttr : null;
  }

  setAttribute(name: string, value: string) {
    if (name === "src") this.srcAttr = value;
  }

  load() {
    this.loadCalls++;
  }

  play() {
    this.playCalls++;
    const error = this.nextPlayError;
    this.nextPlayError = undefined;
    if (error) {
      this.paused = true;
      return Promise.reject(error);
    }
    this.paused = false;
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  }

  pause() {
    this.pauseCalls++;
    this.paused = true;
  }
}

test("Soundtrack preloads default track and autoplays on setActive(true) without requiring a click", async () => {
  const player = new FakeAudioElement();
  const music = new Soundtrack(player as unknown as HTMLAudioElement, true, 40);

  assert.equal(player.preload, "auto");
  assert.equal(player.getAttribute("src"), "/music/trail.m4a");
  assert.equal(player.playCalls, 0);

  music.setActive(true);
  await Promise.resolve();

  assert.equal(player.playCalls, 1);
  assert.equal(player.paused, false);
  assert.equal(music.needsUnlock, false);
});

test("Soundtrack recovers on unlock() when browser autoplay policy rejects initial play()", async () => {
  const player = new FakeAudioElement();
  const blockedError = new Error("Autoplay blocked");
  blockedError.name = "NotAllowedError";
  player.nextPlayError = blockedError;

  const music = new Soundtrack(player as unknown as HTMLAudioElement, true, 40);
  music.setActive(true);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(player.playCalls, 1);
  assert.equal(player.paused, true);
  assert.equal(music.needsUnlock, true);

  music.unlock();
  await Promise.resolve();

  assert.equal(player.playCalls, 2);
  assert.equal(player.paused, false);
  assert.equal(music.needsUnlock, false);
});

test("Soundtrack reloads and plays when switching themes, and pauses when inactive or disabled", async () => {
  const player = new FakeAudioElement();
  const music = new Soundtrack(player as unknown as HTMLAudioElement, true, 50);
  music.setActive(true);
  await Promise.resolve();

  music.setTheme("woods");
  assert.equal(player.getAttribute("src"), "/music/woods.m4a");
  assert.equal(player.loadCalls, 2);
  assert.equal(player.playCalls, 2);

  music.setActive(false);
  assert.equal(player.paused, true);

  music.setActive(true);
  assert.equal(player.paused, false);

  music.setEnabled(false);
  assert.equal(player.paused, true);
});

test("GameAudio.resume resolves immediately once AudioContext is running without waiting for sample decode", async () => {
  let resolveFetch!: () => void;
  const pendingFetch = new Promise<void>((resolve) => {
    resolveFetch = resolve;
  });

  const originalFetch = globalThis.fetch;
  const originalAudioContext = globalThis.AudioContext;

  class FakeAudioContext {
    state: AudioContextState = "suspended";
    currentTime = 0;
    destination = {};
    createDynamicsCompressor() {
      return {
        threshold: { value: 0 },
        ratio: { value: 0 },
        attack: { value: 0 },
        release: { value: 0 },
        connect(target: unknown) {
          return target;
        },
      };
    }
    createGain() {
      return {
        gain: { value: 1, setTargetAtTime() {} },
        connect(target: unknown) {
          return target;
        },
      };
    }
    async decodeAudioData() {
      return {} as AudioBuffer;
    }
    async resume() {
      this.state = "running";
    }
  }

  globalThis.fetch = (() => pendingFetch.then(() => new Response(new ArrayBuffer(8), { status: 200 }))) as typeof fetch;
  globalThis.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
  try {
    const audio = new GameAudio(true, 100, true);
    const result = await Promise.race([
      audio.resume().then(() => "resumed"),
      new Promise((resolve) => setTimeout(() => resolve("timed-out"), 50)),
    ]);
    assert.equal(result, "resumed");
  } finally {
    resolveFetch();
    globalThis.fetch = originalFetch;
    globalThis.AudioContext = originalAudioContext;
  }
});

test("every big boss has a dedicated BGM theme and audio asset", () => {
  const bosses = Object.entries(ENEMIES)
    .filter(([, spec]) => spec.boss)
    .map(([id]) => id);
  assert.ok(bosses.length >= 5);
  const themes = new Set<string>();
  for (const bossId of bosses) {
    const theme = BOSS_MUSIC_THEMES[bossId as keyof typeof ENEMIES];
    assert.ok(theme, `Missing boss music theme for ${bossId}`);
    assert.equal(themes.has(theme), false, `Duplicate boss music theme ${theme}`);
    themes.add(theme);
    const assetPath = path.resolve(process.cwd(), "public/music", `${theme}.m4a`);
    assert.equal(existsSync(assetPath), true, `Missing audio file ${assetPath}`);
  }
});

test("Soundtrack crossfades smoothly into a boss theme and back to the stage theme", async () => {
  const primary = new FakeAudioElement();
  const secondary = new FakeAudioElement();
  const music = new Soundtrack(
    primary as unknown as HTMLAudioElement,
    true,
    50,
    secondary as unknown as HTMLAudioElement,
  );

  music.setTheme("woods");
  music.setActive(true);
  await Promise.resolve();
  assert.equal(primary.paused, false);
  assert.equal(primary.volume, 0.5);

  // Boss appears -> crossfade to boss-chief on secondary deck
  music.setTheme("boss-chief", { fadeMs: 60, restart: true });
  assert.equal(secondary.getAttribute("src"), "/music/boss-chief.m4a");
  assert.equal(secondary.paused, false);
  assert.equal(secondary.volume, 0);

  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(primary.paused, true);
  assert.equal(primary.volume, 0);
  assert.equal(secondary.paused, false);
  assert.equal(secondary.volume, 0.5);

  // Boss defeated -> crossfade back to woods on primary deck
  music.setTheme("woods", { fadeMs: 60 });
  assert.equal(primary.getAttribute("src"), "/music/woods.m4a");
  assert.equal(primary.paused, false);

  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(secondary.paused, true);
  assert.equal(primary.paused, false);
  assert.equal(primary.volume, 0.5);
});
