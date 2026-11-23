export type WeatherSeverity = "calm" | "moderate" | "severe";
export type WeatherCueKind = "gust" | "thunder" | "blizzard" | "miasma";

export interface WeatherParticles {
  readonly style: "leaves" | "rain" | "dust" | "snow" | "sleet" | "crystal" | "spore" | "ember";
  readonly count: number;
  readonly wind: number;
  readonly fall: number;
  readonly color: string;
  readonly opacity: number;
  readonly scale?: number;
  readonly splash?: { readonly count: number; readonly radius: number };
}

export interface WeatherLightning {
  readonly color: string;
  readonly flashColor: string;
  readonly interval: number;
  readonly flashOpacity: number;
  readonly boltOpacity: number;
  readonly branch?: boolean;
}

export interface WeatherWindStreaks {
  readonly count: number;
  readonly speed: number;
  readonly angle: number;
  readonly color: string;
  readonly opacity: number;
  readonly length: number;
}

export interface WeatherVignette {
  readonly color: string;
  readonly opacity: number;
}

export interface WeatherPreset {
  readonly label: string;
  readonly desc: string;
  readonly severity: WeatherSeverity;
  readonly accent: string;
  readonly cue?: WeatherCueKind;
  readonly towerRate?: number;
  readonly tint?: string;
  readonly vignette?: WeatherVignette;
  readonly mist?: { readonly color: string; readonly opacity: number; readonly drift: number };
  readonly particles?: WeatherParticles;
  readonly windStreaks?: WeatherWindStreaks;
  readonly accumulation?: { readonly max: number; readonly rate: number; readonly melt: number };
  readonly bubbles?: { readonly count: number; readonly rise: number; readonly color: string; readonly opacity: number };
  readonly lightning?: WeatherLightning;
}

export const WEATHER = {
  clear: {
    label: "晴朗",
    desc: "林间天朗气清",
    severity: "calm",
    accent: "#e8d68a",
  },
  breeze: {
    label: "林风",
    desc: "微风拂过松梢",
    severity: "calm",
    accent: "#c9e494",
    particles: { style: "leaves", count: 22, wind: 14, fall: 4, color: "#e5d17e", opacity: 0.78 },
  },
  gale: {
    label: "林涛疾风",
    desc: "狂风卷动密林，落叶横飞",
    severity: "severe",
    accent: "#b5d976",
    cue: "gust",
    tint: "#192d221c",
    vignette: { color: "#0f2018", opacity: 0.34 },
    mist: { color: "#b7cca1", opacity: 0.2, drift: 26 },
    particles: { style: "leaves", count: 68, wind: 48, fall: 11, color: "#dfc46c", opacity: 0.88 },
    windStreaks: { count: 14, speed: 128, angle: 0.14, color: "#e7f1d4", opacity: 0.24, length: 44 },
  },
  mist: {
    label: "河雾",
    desc: "薄雾轻笼水岸",
    severity: "calm",
    accent: "#9fe6c9",
    tint: "#bfd9d108",
    vignette: { color: "#0d1d2b", opacity: 0.16 },
    mist: { color: "#c5e3d4", opacity: 0.38, drift: 5 },
  },
  rain: {
    label: "细雨",
    desc: "细雨斜洒河湾",
    severity: "moderate",
    accent: "#8fd0ee",
    tint: "#223f5e1c",
    vignette: { color: "#0d1d2b", opacity: 0.2 },
    mist: { color: "#9bbfc4", opacity: 0.22, drift: 9 },
    particles: {
      style: "rain", count: 88, wind: 34, fall: 122, color: "#c3e3fa", opacity: 0.48,
      splash: { count: 28, radius: 0.76 },
    },
  },
  downpour: {
    label: "大雨",
    desc: "骤雨倾泻，水面涟漪四起",
    severity: "severe",
    accent: "#72bdf2",
    cue: "thunder",
    tint: "#1630482e",
    vignette: { color: "#091724", opacity: 0.34 },
    mist: { color: "#89aebd", opacity: 0.32, drift: 16 },
    particles: {
      style: "rain", count: 164, wind: 56, fall: 196, color: "#d5ecff", opacity: 0.64,
      splash: { count: 80, radius: 1.35 },
    },
    windStreaks: { count: 10, speed: 112, angle: 0.3, color: "#cde8ff", opacity: 0.18, length: 34 },
    lightning: { color: "#f4fcff", flashColor: "#eaf7ff", interval: 9.7, flashOpacity: 0.14, boltOpacity: 0.72 },
  },
  thunderstorm: {
    label: "雷暴倾盆",
    desc: "电闪雷鸣，狂风暴雨席卷渡口",
    severity: "severe",
    accent: "#8bd0ff",
    cue: "thunder",
    tint: "#0f233b3b",
    vignette: { color: "#07111e", opacity: 0.46 },
    mist: { color: "#7598ad", opacity: 0.36, drift: 24 },
    particles: {
      style: "rain", count: 180, wind: 76, fall: 228, color: "#e0f3ff", opacity: 0.74,
      splash: { count: 96, radius: 1.55 },
    },
    windStreaks: { count: 16, speed: 146, angle: 0.36, color: "#d7eeff", opacity: 0.26, length: 42 },
    lightning: {
      color: "#f8fdff", flashColor: "#dff3ff", interval: 5.4, flashOpacity: 0.22, boltOpacity: 0.88, branch: true,
    },
  },
  dust: {
    label: "沙尘",
    desc: "干风卷起矿道浮尘",
    severity: "moderate",
    accent: "#e8be84",
    tint: "#d2a16c0f",
    vignette: { color: "#2b1d12", opacity: 0.16 },
    mist: { color: "#e2b888", opacity: 0.22, drift: 16 },
    particles: { style: "dust", count: 52, wind: 34, fall: 2, color: "#f2ce91", opacity: 0.62 },
  },
  sandstorm: {
    label: "风沙蔽日",
    desc: "黄沙呼啸掠过赤岩采区",
    severity: "severe",
    accent: "#f3b469",
    cue: "gust",
    tint: "#b87a3d28",
    vignette: { color: "#341e0d", opacity: 0.42 },
    mist: { color: "#dfa96b", opacity: 0.42, drift: 34 },
    particles: { style: "dust", count: 132, wind: 72, fall: 6, color: "#f6d496", opacity: 0.78 },
    windStreaks: { count: 18, speed: 150, angle: 0.08, color: "#f8d8a2", opacity: 0.28, length: 50 },
  },
  emberStorm: {
    label: "熔烬风暴",
    desc: "热浪夹杂火星与炉灰翻涌",
    severity: "severe",
    accent: "#ff9b5e",
    cue: "gust",
    tint: "#421c102e",
    vignette: { color: "#240d08", opacity: 0.48 },
    mist: { color: "#c97447", opacity: 0.32, drift: 26 },
    particles: { style: "ember", count: 88, wind: 48, fall: -16, color: "#ffb14d", opacity: 0.9 },
    windStreaks: { count: 14, speed: 122, angle: -0.1, color: "#ffbd7a", opacity: 0.24, length: 40 },
  },
  snow: {
    label: "小雪",
    desc: "雪粒清晰飘落，桥面与景物渐渐积雪",
    severity: "calm",
    accent: "#c5ecff",
    towerRate: 0.95,
    particles: { style: "snow", count: 40, wind: 7, fall: 16, color: "#f7feff", opacity: 0.86, scale: 1.15 },
    accumulation: { max: 0.18, rate: 0.0032, melt: 0.006 },
  },
  snowSquall: {
    label: "阵雪",
    desc: "阵雪压桥，景物积雪加厚，炮塔射速下降",
    severity: "moderate",
    accent: "#a5dcff",
    towerRate: 0.82,
    particles: { style: "snow", count: 64, wind: 22, fall: 26, color: "#f7feff", opacity: 0.9, scale: 1.28 },
    windStreaks: { count: 6, speed: 84, angle: 0.18, color: "#eef8ff", opacity: 0.16, length: 30 },
    accumulation: { max: 0.46, rate: 0.011, melt: 0.012 },
  },
  blizzard: {
    label: "暴风雪",
    desc: "暴雪封锁雪线，厚雪压住景物，炮塔射速明显下降",
    severity: "severe",
    accent: "#8fd4ff",
    cue: "blizzard",
    towerRate: 0.7,
    vignette: { color: "#0b1c2e", opacity: 0.1 },
    particles: { style: "snow", count: 92, wind: 46, fall: 48, color: "#f9feff", opacity: 0.92, scale: 1.42 },
    windStreaks: { count: 12, speed: 126, angle: 0.24, color: "#f0f9ff", opacity: 0.22, length: 42 },
    accumulation: { max: 0.76, rate: 0.022, melt: 0.012 },
  },
  crystalHaze: {
    label: "晶雾",
    desc: "淡紫晶尘在雾中浮动",
    severity: "moderate",
    accent: "#dbb4ef",
    tint: "#c49bd415",
    vignette: { color: "#21142d", opacity: 0.22 },
    mist: { color: "#c39be1", opacity: 0.34, drift: 7 },
    particles: { style: "crystal", count: 26, wind: 7, fall: -5, color: "#f2d4fa", opacity: 0.65 },
  },
  miasma: {
    label: "毒瘴",
    desc: "湿重孢子与沼气泡浮于浅滩",
    severity: "moderate",
    accent: "#b5e078",
    particles: { style: "spore", count: 32, wind: 6, fall: -6, color: "#c9f56c", opacity: 0.72 },
    bubbles: { count: 28, rise: 11, color: "#a9d86a", opacity: 0.65 },
  },
  toxicStorm: {
    label: "剧毒瘴暴",
    desc: "毒孢随酸风席卷沼泽，水面翻泡",
    severity: "severe",
    accent: "#bef567",
    cue: "miasma",
    vignette: { color: "#0d1f10", opacity: 0.22 },
    particles: { style: "spore", count: 88, wind: 34, fall: -10, color: "#d7ff78", opacity: 0.88 },
    windStreaks: { count: 14, speed: 108, angle: -0.06, color: "#c9f57a", opacity: 0.24, length: 42 },
    bubbles: { count: 52, rise: 15, color: "#c0f06e", opacity: 0.8 },
    lightning: { color: "#e5ffad", flashColor: "#c8f576", interval: 8.1, flashOpacity: 0.14, boltOpacity: 0.62 },
  },
} as const satisfies Readonly<Record<string, WeatherPreset>>;

export type WeatherId = keyof typeof WEATHER;
export interface WeatherPlan {
  readonly initial: WeatherId;
  readonly changes?: readonly { readonly wave: number; readonly preset: WeatherId }[];
}

export function weatherAtWave(plan: WeatherPlan, wave: number): WeatherId {
  // Changes are authored in ascending wave order. Wave 0 is the preparation period.
  const changes = plan.changes ?? [];
  for (let i = changes.length - 1; i >= 0; i--)
    if (wave >= changes[i].wave) return changes[i].preset;
  return plan.initial;
}
