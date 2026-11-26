import type { WeatherCueKind } from "../content/weather.ts";
import type { EnemyId } from "../engine/types.ts";

const CUES = [
  "arrow-fire", "arrow-hit", "cannon-fire", "cannon-hit",
  "frost-fire", "frost-hit", "ember-fire", "ember-hit",
  "storm-fire", "storm-hit", "ballista-fire", "ballista-hit",
  "hail-fire", "hail-hit", "glaze-fire", "glaze-hit", "salt-fire", "salt-hit", "spore-fire", "spore-hit",
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
  "reed-whistle": { priority: 1, volume: 0.3, interval: 0.35 },
  "owl-bell": { priority: 1, volume: 0.3, interval: 0.35 },
  "charge-windup": { priority: 2, volume: 0.36, interval: 0.32 },
  "shell-crack": { priority: 2, volume: 0.34, interval: 0.3 },
  "core-expose": { priority: 3, volume: 0.4, interval: 0.35 },
  "pine-landing": { priority: -1, volume: 0.22, interval: 0.38 },
  "step-frog": { priority: -1, volume: 0.24, interval: 0.38 },
  "ferry-shell-break": { priority: 2, volume: 0.38, interval: 0.35 },
  "weir-shell-open": { priority: 3, volume: 0.42, interval: 0.7 },
  "weir-surge": { priority: 4, volume: 0.46, interval: 0.5 },
  "melee-impact": { priority: 0, volume: 0.25, interval: 0.22 },
  "step-ooze": { priority: -1, volume: 0.25, interval: 0.4 },
  "step-scurry": { priority: -1, volume: 0.17, interval: 0.42 },
  "step-bark": { priority: -1, volume: 0.23, interval: 0.42 },
  "step-shell": { priority: -1, volume: 0.21, interval: 0.42 },
  "step-ferry": { priority: -1, volume: 0.23, interval: 0.44 },
  "step-weir": { priority: 0, volume: 0.32, interval: 0.5 },
  "step-stone": { priority: -1, volume: 0.25, interval: 0.46 },
  "step-wing": { priority: -1, volume: 0.19, interval: 0.42 },
  "step-moth": { priority: -1, volume: 0.18, interval: 0.42 },
  "step-crystal": { priority: -1, volume: 0.2, interval: 0.44 },
  "step-wisp": { priority: -1, volume: 0.19, interval: 0.44 },
  "step-boss": { priority: -1, volume: 0.28, interval: 0.52 },
  "step-ram": { priority: 0, volume: 0.34, interval: 0.36 },
} as const;
type MonsterCue = keyof typeof MONSTER_CUES;
type Cue = (typeof CUES)[number] | MonsterCue;
const monsterCues = Object.keys(MONSTER_CUES) as MonsterCue[];

export type UiCue =
  | "ui-select"
  | "ui-tab"
  | "ui-open"
  | "ui-close"
  | "ui-equip"
  | "ui-unequip"
  | "ui-denied"
  | "ui-preset"
  | "ui-clear"
  | "ui-confirm"
  | "ui-wildlife"
  | "ui-landmark";

export type BossSkillCue =
  | "miniboss-enter"
  | "boss-windup"
  | "boss-cleave"
  | "boss-antler-sweep"
  | "boss-ward"
  | "boss-tide-warn"
  | "boss-tide-break"
  | "boss-tide-surge"
  | "miniboss-quake"
  | "miniboss-vent"
  | "miniboss-drag"
  | "miniboss-clam-clamp"
  | "miniboss-clam-open";

const MAX_VOICES = 14;
const CATEGORY_INTERVALS = {
  fire: 0.05,
  hit: 0.055,
  material: 0.09,
} as const;

const BOSS_SKILL_INTERVALS: Record<BossSkillCue, number> = {
  "miniboss-enter": 1.2,
  "boss-windup": 0.45,
  "boss-cleave": 0.35,
  "boss-antler-sweep": 0.4,
  "boss-ward": 0.45,
  "boss-tide-warn": 0.55,
  "boss-tide-break": 0.8,
  "boss-tide-surge": 0.5,
  "miniboss-quake": 0.35,
  "miniboss-vent": 0.35,
  "miniboss-drag": 0.4,
  "miniboss-clam-clamp": 0.4,
  "miniboss-clam-open": 0.45,
};

const MIX: Partial<Record<Cue, { readonly volume: number; readonly interval: number }>> = {
  "salt-fire": { volume: .28, interval: .13 },
  "salt-hit": { volume: .41, interval: .14 },
  "spore-fire": { volume: .25, interval: .14 },
  "spore-hit": { volume: .36, interval: .16 },
  "hail-fire": { volume: .29, interval: .14 },
  "hail-hit": { volume: .44, interval: .16 },
  "glaze-fire": { volume: .27, interval: .12 },
  "glaze-hit": { volume: .4, interval: .14 },
  "material-armor": { volume: .15, interval: .16 },
  "material-shell": { volume: .16, interval: .16 },
  "material-flesh": { volume: .14, interval: .16 },
  "material-wood": { volume: .15, interval: .16 },
  "material-slime": { volume: .14, interval: .17 },
  "material-wing": { volume: .12, interval: .16 },
  "material-water": { volume: .14, interval: .17 },
  "reed-strike": { volume: .31, interval: .16 },
  "reed-brace": { volume: .41, interval: .3 },
  "frost-strike": { volume: .31, interval: .16 },
  "net-capture": { volume: .36, interval: .18 },
  "freeze-lock": { volume: .36, interval: .25 },
  "ice-shatter": { volume: .42, interval: .2 },
  "burn-ignite": { volume: .27, interval: .28 },
  "poison-burst": { volume: .36, interval: .26 },
  "hatch-crack": { volume: .3, interval: .24 },
  "kill-small": { volume: .15, interval: .14 },
  "kill-big": { volume: .56, interval: .35 },
  "kill-boss": { volume: .7, interval: .8 },
  "boss-theme": { volume: .62, interval: 6 },
};

function monsterCue(cue: Cue) {
  return Object.hasOwn(MONSTER_CUES, cue) ? MONSTER_CUES[cue as MonsterCue] : undefined;
}
export type BossMusicTheme =
  | "boss-chief"
  | "boss-slag-colossus"
  | "boss-frost-moose"
  | "boss-mire-matriarch"
  | "boss-sluice-dragon";
export type MusicTheme = "trail" | "woods" | "wetland" | "frost" | BossMusicTheme;
export const BOSS_MUSIC_THEMES: Partial<Record<EnemyId, BossMusicTheme>> = {
  chief: "boss-chief",
  "slag-colossus": "boss-slag-colossus",
  "frost-moose": "boss-frost-moose",
  "mire-matriarch": "boss-mire-matriarch",
  "sluice-dragon": "boss-sluice-dragon",
};
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
  private lastPlayed = new Map<string, number>();
  private lastCategory = new Map<keyof typeof CATEGORY_INTERVALS, number>();
  private nextVariant = new Map<Cue, number>();
  private noiseBuffer?: AudioBuffer;
  private ambienceTheme?: AmbienceTheme;
  private ambiencePaused = false;
  private ambience?: { source: AudioBufferSourceNode; gain: GainNode };
  private volume: number;
  enabled: boolean;
  ambienceEnabled: boolean;

  constructor(enabled: boolean, volume = 100, ambienceEnabled = true) {
    this.enabled = enabled;
    this.volume = volume;
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
    this.loading ??= this.loadSamples(context);
    if (context.state !== "running") await context.resume();
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
    else if (this.ambienceTheme && !this.ambiencePaused && this.context?.state === "running") this.startAmbience();
  }

  setAmbiencePaused(paused: boolean) {
    if (this.ambiencePaused === paused) return;
    this.ambiencePaused = paused;
    if (paused) this.stopAmbience(0.08);
    else if (this.ambienceTheme && this.context?.state === "running") this.startAmbience();
  }

  private startAmbience() {
    const context = this.context;
    const output = this.output;
    const theme = this.ambienceTheme;
    const sample = theme && this.samples.get(AMBIENCE_CUES[theme])?.[0];
    if (!theme || !sample || !context || !output || this.ambience || !this.enabled ||
        !this.ambienceEnabled || this.ambiencePaused || this.volume === 0) return;
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
    const base = `${import.meta.env?.BASE_URL ?? "/"}sounds/`;
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
      if (samples.length) {
        this.samples.set(cue, samples);
        if (this.ambienceTheme && AMBIENCE_CUES[this.ambienceTheme] === cue && this.context?.state === "running") {
          this.startAmbience();
        }
      }
    }));
  }

  suspend() {
    this.stopAmbience(0.08);
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* already stopped */ }
    }
    this.voices.clear();
    this.monsterVoice = undefined;
    this.lastPlayed.clear();
    this.lastCategory.clear();
    if (this.context?.state === "running")
      void this.context.suspend().catch(() => {});
  }

  private ensureNoise(context: AudioContext) {
    if (!this.noiseBuffer) {
      const length = Math.floor(context.sampleRate * 1.4);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  private connectOutput(context: AudioContext, node: AudioNode, pan = 0) {
    const output = this.output!;
    if (pan && typeof context.createStereoPanner === "function") {
      const position = context.createStereoPanner();
      position.pan.value = Math.max(-0.9, Math.min(0.9, pan));
      node.connect(position).connect(output);
    } else {
      node.connect(output);
    }
  }

  private synthTone(
    context: AudioContext,
    start: number,
    duration: number,
    fromHz: number,
    toHz: number,
    gainPeak: number,
    type: OscillatorType = "triangle",
    pan = 0,
  ) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, fromHz), start);
    if (toHz !== fromHz) osc.frequency.exponentialRampToValueAtTime(Math.max(20, toHz), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + Math.min(0.014, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    this.connectOutput(context, gain, pan);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private synthNoise(
    context: AudioContext,
    start: number,
    duration: number,
    filterType: BiquadFilterType,
    fromHz: number,
    toHz: number,
    q: number,
    gainPeak: number,
    pan = 0,
  ) {
    const src = context.createBufferSource();
    src.buffer = this.ensureNoise(context);
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(30, fromHz), start);
    if (toHz !== fromHz) filter.frequency.exponentialRampToValueAtTime(Math.max(30, toHz), start + duration);
    filter.Q.value = q;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + Math.min(0.02, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(filter).connect(gain);
    this.connectOutput(context, gain, pan);
    src.start(start);
    src.stop(start + duration + 0.02);
  }

  playUi(cue: UiCue) {
    if (!this.enabled || this.volume === 0) return;
    if (!this.context || this.context.state !== "running" || !this.output) {
      void this.resume().then(() => this.triggerUi(cue)).catch(() => {});
      return;
    }
    this.triggerUi(cue);
  }

  private triggerUi(cue: UiCue) {
    const context = this.context;
    if (!this.enabled || this.volume === 0 || context?.state !== "running" || !this.output) return;
    const t = context.currentTime;
    if (t - (this.lastPlayed.get(cue) ?? -Infinity) < 0.055) return;
    this.lastPlayed.set(cue, t);

    switch (cue) {
      case "ui-select":
        this.synthTone(context, t, 0.075, 520, 660, 0.16, "triangle");
        this.synthTone(context, t + 0.015, 0.06, 780, 740, 0.07, "sine");
        break;
      case "ui-tab":
        this.synthTone(context, t, 0.055, 440, 560, 0.13, "triangle");
        break;
      case "ui-open":
        this.synthTone(context, t, 0.09, 440, 523, 0.14, "triangle");
        this.synthTone(context, t + 0.055, 0.13, 659, 784, 0.13, "sine");
        break;
      case "ui-close":
        this.synthTone(context, t, 0.08, 494, 349, 0.12, "triangle");
        break;
      case "ui-equip":
        this.synthTone(context, t, 0.07, 466, 622, 0.16, "triangle");
        this.synthTone(context, t + 0.045, 0.11, 740, 880, 0.14, "sine");
        break;
      case "ui-unequip":
        this.synthTone(context, t, 0.065, 587, 415, 0.14, "triangle");
        this.synthTone(context, t + 0.035, 0.075, 392, 311, 0.1, "sine");
        break;
      case "ui-denied":
        this.synthTone(context, t, 0.07, 195, 155, 0.17, "sawtooth");
        this.synthTone(context, t + 0.08, 0.09, 165, 130, 0.16, "sawtooth");
        break;
      case "ui-preset":
        this.synthTone(context, t, 0.07, 523, 523, 0.13, "triangle");
        this.synthTone(context, t + 0.05, 0.08, 659, 659, 0.13, "triangle");
        this.synthTone(context, t + 0.1, 0.12, 784, 988, 0.14, "sine");
        break;
      case "ui-clear":
        this.synthTone(context, t, 0.07, 587, 440, 0.12, "triangle");
        this.synthTone(context, t + 0.05, 0.1, 440, 294, 0.11, "sine");
        break;
      case "ui-confirm":
        this.synthTone(context, t, 0.1, 523, 659, 0.16, "triangle");
        this.synthTone(context, t + 0.06, 0.18, 784, 1046, 0.15, "sine");
        break;
      case "ui-wildlife":
        this.synthTone(context, t, 0.06, 880, 1240, 0.12, "sine");
        this.synthTone(context, t + 0.065, 0.08, 1046, 1397, 0.11, "sine");
        break;
      case "ui-landmark":
        this.synthTone(context, t, 0.14, 587, 587, 0.15, "sine");
        this.synthTone(context, t + 0.07, 0.22, 880, 1175, 0.13, "triangle");
        break;
    }
  }

  playBossSkill(cue: BossSkillCue, pan = 0) {
    const context = this.context;
    if (!this.enabled || this.volume === 0 || context?.state !== "running" || !this.output) return;
    const t = context.currentTime;
    if (t - (this.lastPlayed.get(cue) ?? -Infinity) < BOSS_SKILL_INTERVALS[cue]) return;
    this.lastPlayed.set(cue, t);

    switch (cue) {
      case "miniboss-enter":
        this.synthTone(context, t, 0.36, 146, 110, 0.28, "sawtooth", pan);
        this.synthTone(context, t + 0.08, 0.34, 220, 165, 0.18, "triangle", pan);
        this.synthNoise(context, t, 0.22, "lowpass", 240, 90, 1.4, 0.24, pan);
        break;
      case "boss-windup":
        this.synthTone(context, t, 0.34, 130, 260, 0.22, "sawtooth", pan);
        this.synthTone(context, t + 0.05, 0.3, 196, 392, 0.14, "triangle", pan);
        break;
      case "boss-cleave":
        this.synthTone(context, t, 0.24, 150, 46, 0.36, "sawtooth", pan);
        this.synthNoise(context, t, 0.2, "lowpass", 780, 140, 1.2, 0.32, pan);
        this.synthTone(context, t, 0.11, 420, 160, 0.16, "square", pan);
        break;
      case "boss-antler-sweep":
        this.synthNoise(context, t, 0.32, "bandpass", 1400, 420, 2.2, 0.28, pan);
        this.synthTone(context, t, 0.26, 740, 310, 0.2, "triangle", pan);
        this.synthTone(context, t + 0.04, 0.2, 1320, 880, 0.14, "sine", pan);
        break;
      case "boss-ward":
        this.synthTone(context, t, 0.3, 294, 440, 0.2, "triangle", pan);
        this.synthTone(context, t + 0.04, 0.34, 440, 587, 0.16, "sine", pan);
        break;
      case "boss-tide-warn":
        this.synthTone(context, t, 0.42, 92, 155, 0.26, "sawtooth", pan);
        this.synthNoise(context, t, 0.4, "bandpass", 220, 460, 2.6, 0.22, pan);
        break;
      case "boss-tide-break":
        this.synthTone(context, t, 0.34, 240, 68, 0.34, "sawtooth", pan);
        this.synthNoise(context, t, 0.26, "bandpass", 1200, 280, 1.8, 0.3, pan);
        this.synthTone(context, t + 0.06, 0.22, 620, 220, 0.16, "square", pan);
        break;
      case "boss-tide-surge":
        this.synthNoise(context, t, 0.46, "lowpass", 820, 180, 1.5, 0.34, pan);
        this.synthTone(context, t, 0.36, 135, 62, 0.24, "triangle", pan);
        break;
      case "miniboss-quake":
        this.synthTone(context, t, 0.26, 118, 42, 0.36, "triangle", pan);
        this.synthNoise(context, t, 0.24, "lowpass", 360, 85, 1.1, 0.3, pan);
        break;
      case "miniboss-vent":
        this.synthNoise(context, t, 0.3, "highpass", 950, 2400, 1.2, 0.24, pan);
        this.synthTone(context, t, 0.18, 220, 95, 0.22, "sawtooth", pan);
        break;
      case "miniboss-drag":
        this.synthNoise(context, t, 0.22, "bandpass", 980, 320, 2.4, 0.25, pan);
        this.synthTone(context, t, 0.2, 340, 125, 0.2, "triangle", pan);
        break;
      case "miniboss-clam-clamp":
        this.synthTone(context, t, 0.15, 290, 110, 0.28, "triangle", pan);
        this.synthNoise(context, t, 0.12, "bandpass", 620, 260, 2.0, 0.22, pan);
        break;
      case "miniboss-clam-open":
        this.synthTone(context, t, 0.16, 587, 880, 0.18, "sine", pan);
        this.synthTone(context, t + 0.05, 0.22, 880, 1175, 0.16, "triangle", pan);
        break;
    }
  }

  play(cue: Cue, pan = 0) {
    const context = this.context;
    const samples = this.samples.get(cue);
    const output = this.output;
    if (!this.enabled || this.volume === 0 || context?.state !== "running" || !samples || !output) return;

    const time = context.currentTime;
    const launch = cue.endsWith("-fire");
    const impact = cue.endsWith("-hit");
    const material = cue.startsWith("material-");
    const warning = cue === "breach" || cue === "boss-breach";
    const important = warning || cue === "boss-theme" || cue === "kill-boss" || cue === "kill-big" || cue === "victory";
    const scenery = cue.startsWith("scenery-");
    const monster = monsterCue(cue);
    const mix = MIX[cue];
    const interval = monster?.interval ?? mix?.interval ?? (warning ? 0.18 : scenery ? 0.14 : launch ? 0.11 : impact ? 0.12 : 0.07);
    if (time - (this.lastPlayed.get(cue) ?? -Infinity) < interval) return;

    // Category-level throttle prevents simultaneous multi-tower bursts from clipping or spamming.
    const category = launch ? "fire" : impact ? "hit" : material ? "material" : undefined;
    if (category && time - (this.lastCategory.get(category) ?? -Infinity) < CATEGORY_INTERVALS[category]) return;

    // Global polyphony cap keeps dense late-game waves clean while preserving high-priority cues.
    if (!important && this.voices.size >= MAX_VOICES) return;

    if (monster && this.monsterVoice) {
      const playing = this.monsterVoice;
      if (playing.priority >= monster.priority) return;
      try { playing.source.stop(); } catch { /* already stopped */ }
      this.voices.delete(playing.source);
    }
    this.lastPlayed.set(cue, time);
    if (category) this.lastCategory.set(category, time);

    const source = context.createBufferSource();
    const gain = context.createGain();
    const variant = this.nextVariant.get(cue) ?? 0;
    source.buffer = samples[variant];
    this.nextVariant.set(cue, (variant + 1) % samples.length);
    gain.gain.value = monster?.volume ?? mix?.volume ?? (scenery ? 0.42 : launch ? 0.28 : impact ? 0.41 : warning ? 0.78 : 0.52);
    source.connect(gain);
    this.connectOutput(context, gain, pan);
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

export interface ThemeTransitionOptions {
  readonly fadeMs?: number;
  readonly restart?: boolean;
}

export class Soundtrack {
  private current: HTMLAudioElement;
  private spare?: HTMLAudioElement;
  private enabled: boolean;
  private targetVolume = 0.4;
  private theme: MusicTheme = "trail";
  private active = false;
  private blocked = false;
  private playRequest = 0;
  private fadeTimer?: ReturnType<typeof setInterval>;
  private fadeOutgoing?: HTMLAudioElement;
  private fadeProgress = 1;

  constructor(player: HTMLAudioElement, enabled: boolean, volume = 40, secondary?: HTMLAudioElement) {
    this.current = player;
    this.spare = secondary ?? this.createSecondaryPlayer(player);
    this.enabled = enabled;
    this.configurePlayer(this.current);
    if (this.spare) this.configurePlayer(this.spare);
    this.setVolume(volume);
    if (this.enabled) this.ensureSource(this.current, this.theme, false);
  }

  private createSecondaryPlayer(primary: HTMLAudioElement): HTMLAudioElement | undefined {
    if (typeof primary.cloneNode !== "function") return undefined;
    const clone = primary.cloneNode(false) as HTMLAudioElement;
    if (typeof clone.removeAttribute === "function") clone.removeAttribute("id");
    clone.hidden = true;
    primary.parentElement?.insertBefore(clone, primary.nextSibling);
    return clone;
  }

  private configurePlayer(player: HTMLAudioElement) {
    player.loop = true;
    player.preload = "auto";
    player.addEventListener("playing", () => {
      if (player === this.current) this.blocked = false;
    });
    player.addEventListener("canplay", () => {
      if (player === this.current && this.enabled && this.active && !this.blocked && player.paused) {
        this.attemptPlay(player);
      }
    });
  }

  get needsUnlock() {
    return this.enabled && this.active && (this.blocked || this.current.paused);
  }

  setVolume(volume: number) {
    this.targetVolume = Math.max(0, Math.min(1, volume / 100));
    if (this.fadeTimer && this.fadeOutgoing) {
      this.current.volume = this.targetVolume * this.fadeProgress;
      this.fadeOutgoing.volume = this.targetVolume * (1 - this.fadeProgress);
    } else {
      this.current.volume = this.targetVolume;
    }
  }

  setTheme(theme: MusicTheme, options: ThemeTransitionOptions = {}) {
    const fadeMs = Math.max(0, options.fadeMs ?? 0);
    const restart = options.restart ?? false;
    if (this.theme === theme) {
      if (restart && this.enabled && this.active) {
        try { this.current.currentTime = 0; } catch { /* ignore seek before load */ }
      }
      this.sync();
      return;
    }
    const previousPlaying = this.enabled && this.active && !this.current.paused;
    this.theme = theme;
    if (previousPlaying && fadeMs > 0 && this.spare) {
      this.crossfadeTo(theme, fadeMs, restart);
      return;
    }
    this.cancelFade(true);
    const changed = this.ensureSource(this.current, theme, restart);
    if (this.enabled && this.active && (changed || this.current.paused)) {
      this.current.volume = this.targetVolume;
      this.attemptPlay(this.current);
    }
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
    if (!this.enabled || !this.active) return;
    if (this.blocked || this.current.paused) {
      this.blocked = false;
      this.sync();
    }
  }

  private sourceFor(theme: MusicTheme) {
    return `${import.meta.env?.BASE_URL ?? "/"}music/${theme}.m4a`;
  }

  private ensureSource(player: HTMLAudioElement, theme: MusicTheme, restart: boolean) {
    const source = this.sourceFor(theme);
    if (player.getAttribute("src") !== source) {
      player.setAttribute("src", source);
      if (typeof player.load === "function") player.load();
      return true;
    }
    if (restart) {
      try { player.currentTime = 0; } catch { /* ignore seek before load */ }
    }
    return false;
  }

  private cancelFade(pauseOutgoing: boolean) {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = undefined;
    }
    if (this.fadeOutgoing) {
      if (pauseOutgoing) this.fadeOutgoing.pause();
      this.fadeOutgoing.volume = 0;
      this.fadeOutgoing = undefined;
    }
    this.fadeProgress = 1;
  }

  private crossfadeTo(theme: MusicTheme, fadeMs: number, restart: boolean) {
    this.cancelFade(true);
    const outgoing = this.current;
    const incoming = this.spare!;
    this.current = incoming;
    this.spare = outgoing;
    this.fadeOutgoing = outgoing;
    this.fadeProgress = 0;

    this.ensureSource(incoming, theme, restart);
    incoming.volume = 0;
    this.attemptPlay(incoming);

    const startTime = Date.now();
    const stepMs = 25;
    this.fadeTimer = setInterval(() => {
      if (!this.enabled || !this.active || this.current !== incoming) {
        this.cancelFade(true);
        return;
      }
      const progress = Math.min(1, (Date.now() - startTime) / fadeMs);
      this.fadeProgress = progress;
      incoming.volume = this.targetVolume * progress;
      outgoing.volume = this.targetVolume * (1 - progress);
      if (progress >= 1) {
        this.cancelFade(true);
        incoming.volume = this.targetVolume;
      }
    }, stepMs);
  }

  private attemptPlay(player: HTMLAudioElement) {
    const requestId = ++this.playRequest;
    const result = player.play();
    if (!result || typeof result.then !== "function") {
      if (player === this.current) this.blocked = false;
      return;
    }
    void result.then(() => {
      if (requestId !== this.playRequest || player !== this.current) return;
      this.blocked = false;
      if (!this.enabled || !this.active) player.pause();
    }).catch((error: unknown) => {
      if (requestId !== this.playRequest || player !== this.current) return;
      const name = typeof error === "object" && error && "name" in error
        ? String((error as { name?: unknown }).name)
        : "";
      if (name === "AbortError") return;
      this.blocked = true;
    });
  }

  private sync() {
    if (!this.enabled || !this.active) {
      this.playRequest++;
      this.blocked = false;
      this.cancelFade(true);
      this.current.pause();
      this.spare?.pause();
      return;
    }
    const changed = this.ensureSource(this.current, this.theme, false);
    if (!this.fadeTimer) this.current.volume = this.targetVolume;
    if (changed || this.current.paused) this.attemptPlay(this.current);
  }
}
