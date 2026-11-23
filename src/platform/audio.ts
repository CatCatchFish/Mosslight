import type { WeatherCueKind } from "../content/weather.ts";

const CUES = [
  "arrow-fire", "arrow-hit", "cannon-fire", "cannon-hit",
  "frost-fire", "frost-hit", "ember-fire", "ember-hit",
  "storm-fire", "storm-hit", "ballista-fire", "ballista-hit",
  "hail-fire", "hail-hit", "glaze-fire", "glaze-hit", "salt-fire", "salt-hit",
  "material-armor", "material-shell", "material-flesh", "material-wood",
  "material-slime", "material-wing", "material-water",
  "reed-strike", "reed-brace", "frost-strike", "net-capture", "freeze-lock", "ice-shatter",
  "burn-ignite", "poison-burst", "hatch-crack",
  "kill-small", "kill-big", "kill-boss",
  "breach", "boss-breach", "build", "upgrade", "dispatch",
  "interact", "victory",
  "ambience-forest", "ambience-wetland", "ambience-mine", "ambience-frost", "ambience-mire",
  "scenery-cabin", "scenery-ruins", "scenery-reeds", "scenery-floe", "scenery-skiff",
  "scenery-mine-cart", "scenery-ore-vein", "scenery-mire-keep", "scenery-birdhouse",
  "scenery-campfire", "scenery-fish-trap", "scenery-drift-buoy", "scenery-lily-bell",
  "scenery-rail-lantern", "scenery-hand-pump", "scenery-ice-chime", "scenery-snow-lantern",
  "scenery-bog-idol", "scenery-glow-pod", "boss-theme",
] as const;

const MONSTER_CUES = {
  "reed-whistle": { priority: 1, volume: 0.32, interval: 0.25 },
  "owl-bell": { priority: 1, volume: 0.32, interval: 0.25 },
  "charge-windup": { priority: 2, volume: 0.38, interval: 0.25 },
  "shell-crack": { priority: 2, volume: 0.36, interval: 0.25 },
  "core-expose": { priority: 3, volume: 0.42, interval: 0.25 },
  "pine-landing": { priority: -1, volume: 0.25, interval: 0.32 },
  "step-frog": { priority: -1, volume: 0.29, interval: 0.28 },
  "ferry-shell-break": { priority: 2, volume: 0.39, interval: 0.3 },
  "weir-shell-open": { priority: 3, volume: 0.43, interval: 0.65 },
  "weir-surge": { priority: 4, volume: 0.47, interval: 0.45 },
  "melee-impact": { priority: 0, volume: 0.27, interval: 0.17 },
  "step-ooze": { priority: -1, volume: 0.34, interval: 0.27 },
  "step-scurry": { priority: -1, volume: 0.21, interval: 0.3 },
  "step-bark": { priority: -1, volume: 0.29, interval: 0.32 },
  "step-shell": { priority: -1, volume: 0.26, interval: 0.3 },
  "step-ferry": { priority: -1, volume: 0.28, interval: 0.33 },
  "step-weir": { priority: 0, volume: 0.38, interval: 0.42 },
  "step-stone": { priority: -1, volume: 0.31, interval: 0.34 },
  "step-wing": { priority: -1, volume: 0.23, interval: 0.32 },
  "step-moth": { priority: -1, volume: 0.22, interval: 0.32 },
  "step-crystal": { priority: -1, volume: 0.24, interval: 0.34 },
  "step-wisp": { priority: -1, volume: 0.23, interval: 0.34 },
  "step-boss": { priority: -1, volume: 0.31, interval: 0.4 },
  "step-ram": { priority: 0, volume: 0.39, interval: 0.24 },
} as const;
type MonsterCue = keyof typeof MONSTER_CUES;
type Cue = (typeof CUES)[number] | MonsterCue;
const monsterCues = Object.keys(MONSTER_CUES) as MonsterCue[];

const MIX: Partial<Record<Cue, { readonly volume: number; readonly interval: number }>> = {
  "salt-fire": { volume: .3, interval: .1 },
  "salt-hit": { volume: .43, interval: .11 },
  "hail-fire": { volume: .31, interval: .12 },
  "hail-hit": { volume: .46, interval: .14 },
  "glaze-fire": { volume: .29, interval: .1 },
  "glaze-hit": { volume: .42, interval: .11 },
  "material-armor": { volume: .2, interval: .075 },
  "material-shell": { volume: .21, interval: .075 },
  "material-flesh": { volume: .18, interval: .075 },
  "material-wood": { volume: .2, interval: .075 },
  "material-slime": { volume: .19, interval: .08 },
  "material-wing": { volume: .14, interval: .075 },
  "material-water": { volume: .18, interval: .08 },
  "reed-strike": { volume: .34, interval: .1 },
  "reed-brace": { volume: .43, interval: .25 },
  "frost-strike": { volume: .34, interval: .1 },
  "net-capture": { volume: .38, interval: .12 },
  "freeze-lock": { volume: .36, interval: .2 },
  "ice-shatter": { volume: .43, interval: .18 },
  "burn-ignite": { volume: .3, interval: .18 },
  "poison-burst": { volume: .38, interval: .18 },
  "hatch-crack": { volume: .32, interval: .18 },
  "kill-small": { volume: .16, interval: .09 },
  "kill-big": { volume: .58, interval: .3 },
  "kill-boss": { volume: .7, interval: .8 },
  "boss-theme": { volume: .62, interval: 6 },
};

function monsterCue(cue: Cue) {
  return Object.hasOwn(MONSTER_CUES, cue) ? MONSTER_CUES[cue as MonsterCue] : undefined;
}
type MusicTheme = "trail" | "woods" | "wetland" | "frost";
export type AmbienceTheme = "forest" | "wetland" | "mine" | "frost" | "mire";
const AMBIENCE_CUES = {
  forest: "ambience-forest",
  wetland: "ambience-wetland",
  mine: "ambience-mine",
  frost: "ambience-frost",
  mire: "ambience-mire",
} as const satisfies Record<AmbienceTheme, Cue>;
const AMBIENCE_VOLUME = .16;

export class GameAudio {
  private context?: AudioContext;
  private output?: DynamicsCompressorNode;
  private master?: GainNode;
  private loading?: Promise<void>;
  private samples = new Map<Cue, AudioBuffer[]>();
  private voices = new Set<AudioBufferSourceNode>();
  private monsterVoice?: { source: AudioBufferSourceNode; priority: number };
  private lastPlayed = new Map<Cue, number>();
  private nextVariant = new Map<Cue, number>();
  private noiseBuffer?: AudioBuffer;
  private ambienceTheme?: AmbienceTheme;
  private ambience?: { source: AudioBufferSourceNode; gain: GainNode };
  enabled: boolean;
  ambienceEnabled: boolean;

  constructor(enabled: boolean, private volume = 100, ambienceEnabled = true) {
    this.enabled = enabled;
    this.ambienceEnabled = ambienceEnabled;
  }

  async resume() {
    if (!this.enabled) return;
    const context = (this.context ??= new AudioContext());
    if (!this.output) {
      this.output = context.createDynamicsCompressor();
      this.output.threshold.value = -11;
      this.output.ratio.value = 5;
      this.output.attack.value = 0.005;
      this.output.release.value = 0.14;
      this.master = context.createGain();
      this.master.gain.value = this.volume / 100;
      this.output.connect(this.master).connect(context.destination);
    }
    const resumed = context.state === "running" ? Promise.resolve() : context.resume();
    this.loading ??= this.loadSamples(context);
    await Promise.all([resumed, this.loading]);
    if (this.ambienceTheme) this.startAmbience();
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(volume / 100, this.context.currentTime, 0.015);
  }

  setAmbience(theme: AmbienceTheme | null) {
    const next = theme ?? undefined;
    if (next === this.ambienceTheme) {
      if (next && !this.ambience && this.context?.state === "running") this.startAmbience();
      return;
    }
    this.stopAmbience();
    this.ambienceTheme = next;
    if (next && this.context?.state === "running") this.startAmbience();
  }

  setAmbienceEnabled(enabled: boolean) {
    if (this.ambienceEnabled === enabled) return;
    this.ambienceEnabled = enabled;
    if (!enabled) this.stopAmbience();
    else if (this.ambienceTheme && this.context?.state === "running") this.startAmbience();
  }

  private startAmbience() {
    const context = this.context;
    const output = this.output;
    const theme = this.ambienceTheme;
    const sample = theme && this.samples.get(AMBIENCE_CUES[theme])?.[0];
    if (!theme || !sample || !context || !output || this.ambience || !this.enabled ||
        !this.ambienceEnabled || this.volume === 0) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = sample;
    source.loop = true;
    source.connect(gain).connect(output);
    const time = context.currentTime;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(AMBIENCE_VOLUME, time + 0.8);
    source.start(time);
    source.addEventListener("ended", () => {
      if (this.ambience?.source === source) this.ambience = undefined;
    }, { once: true });
    this.ambience = { source, gain };
  }

  private stopAmbience(fade = 0.3) {
    const ambience = this.ambience;
    const context = this.context;
    this.ambience = undefined;
    if (!ambience) return;
    if (!context) {
      try { ambience.source.stop(); } catch { /* already stopped */ }
      return;
    }
    const time = context.currentTime;
    ambience.gain.gain.cancelScheduledValues(time);
    ambience.gain.gain.setValueAtTime(ambience.gain.gain.value, time);
    ambience.gain.gain.linearRampToValueAtTime(0.0001, time + fade);
    try { ambience.source.stop(time + fade + 0.02); } catch { /* already stopped */ }
  }

  private async loadSamples(context: AudioContext) {
    const base = `${import.meta.env.BASE_URL}sounds/`;
    await Promise.all([...CUES, ...monsterCues].map(async (cue) => {
      const varied = monsterCue(cue) || cue.endsWith("-fire") || cue.endsWith("-hit");
      const names = varied ? [cue, cue + "-2", cue + "-3"] : [cue];
      const loaded = await Promise.all(names.map(async (name) => {
        try {
          const response = await fetch(base + name + ".wav");
          if (!response.ok) throw new Error(String(response.status));
          return await context.decodeAudioData(await response.arrayBuffer());
        } catch (error) {
          console.warn("Unable to load sound cue:", name, error);
          return null;
        }
      }));
      const samples = loaded.filter((sample) => sample !== null);
      if (samples.length) this.samples.set(cue, samples);
    }));
  }

  suspend() {
    this.stopAmbience(0.08);
    for (const voice of this.voices) voice.stop();
    this.voices.clear();
    this.monsterVoice = undefined;
    this.lastPlayed.clear();
    if (this.context?.state === "running")
      void this.context.suspend().catch(() => {});
  }

  play(cue: Cue, pan = 0) {
    const context = this.context;
    const samples = this.samples.get(cue);
    const output = this.output;
    if (!this.enabled || this.volume === 0 || context?.state !== "running" || !samples || !output) return;

    const time = context.currentTime;
    const launch = cue.endsWith("-fire");
    const impact = cue.endsWith("-hit");
    const warning = cue === "breach" || cue === "boss-breach";
    const scenery = cue.startsWith("scenery-");
    const monster = monsterCue(cue);
    const mix = MIX[cue];
    const interval = monster?.interval ?? mix?.interval ?? (warning ? 0.16 : scenery ? 0.12 : launch || impact ? 0.085 : 0.05);
    if (time - (this.lastPlayed.get(cue) ?? -Infinity) < interval) return;
    if (monster && this.monsterVoice) {
      const playing = this.monsterVoice;
      if (playing.priority >= monster.priority) return;
      playing.source.stop();
      this.voices.delete(playing.source);
    }
    this.lastPlayed.set(cue, time);

    const source = context.createBufferSource();
    const gain = context.createGain();
    const variant = this.nextVariant.get(cue) ?? 0;
    source.buffer = samples[variant];
    this.nextVariant.set(cue, (variant + 1) % samples.length);
    gain.gain.value = monster?.volume ?? mix?.volume ?? (scenery ? 0.44 : launch ? 0.32 : impact ? 0.45 : warning ? 0.8 : 0.54);
    source.connect(gain);
    if (pan && typeof context.createStereoPanner === "function") {
      const position = context.createStereoPanner();
      position.pan.value = pan;
      gain.connect(position).connect(output);
    } else gain.connect(output);
    source.addEventListener("ended", () => {
      this.voices.delete(source);
      if (this.monsterVoice?.source === source) this.monsterVoice = undefined;
    }, { once: true });
    this.voices.add(source);
    if (monster) this.monsterVoice = { source, priority: monster.priority };
    source.start(time);
  }

  playWeather(kind: WeatherCueKind) {
    const context = this.context;
    const output = this.output;
    if (!this.enabled || this.volume === 0 || context?.state !== "running" || !output) return;
    if (!this.noiseBuffer) {
      const length = Math.floor(context.sampleRate * 1.4);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    const time = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const duration = kind === "thunder" ? 1.3 : kind === "blizzard" ? 1.15 : 1.0;

    if (kind === "thunder") {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(340, time);
      filter.frequency.exponentialRampToValueAtTime(75, time + duration);
      filter.Q.value = 1.4;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.32, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else if (kind === "blizzard") {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(380, time);
      filter.frequency.exponentialRampToValueAtTime(920, time + 0.42);
      filter.frequency.exponentialRampToValueAtTime(340, time + duration);
      filter.Q.value = 2.8;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.24, time + 0.34);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else if (kind === "miasma") {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(190, time);
      filter.frequency.exponentialRampToValueAtTime(340, time + 0.4);
      filter.frequency.exponentialRampToValueAtTime(140, time + duration);
      filter.Q.value = 3.2;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.22, time + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(260, time);
      filter.frequency.exponentialRampToValueAtTime(640, time + 0.35);
      filter.frequency.exponentialRampToValueAtTime(220, time + duration);
      filter.Q.value = 1.9;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.24, time + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    }

    source.connect(filter).connect(gain).connect(output);
    source.addEventListener("ended", () => {
      this.voices.delete(source);
    }, { once: true });
    this.voices.add(source);
    source.start(time);
    source.stop(time + duration + 0.02);
  }
}

export class Soundtrack {
  private theme: MusicTheme = "trail";
  private active = true;
  private unlocked = false;

  constructor(private player: HTMLAudioElement, private enabled: boolean, volume = 40) {
    this.setVolume(volume);
  }

  setVolume(volume: number) {
    this.player.volume = volume / 100;
  }

  setTheme(theme: MusicTheme) {
    this.theme = theme;
    this.sync();
  }

  setActive(active: boolean) {
    this.active = active;
    this.sync();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.sync();
  }

  unlock() {
    this.unlocked = true;
    this.sync();
  }

  private sync() {
    if (!this.enabled || !this.active || !this.unlocked) {
      this.player.pause();
      return;
    }
    const source = `${import.meta.env.BASE_URL}music/${this.theme}.m4a`;
    if (this.player.getAttribute("src") !== source) this.player.src = source;
    if (this.player.paused) void this.player.play().catch(() => {});
  }
}
