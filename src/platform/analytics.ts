import { Capacitor, registerPlugin } from "@capacitor/core";

export const ANALYTICS_EVENTS = [
  "stage_start", "stage_result", "tower_build", "tower_upgrade",
  "loadout_save", "talent_upgrade", "talent_reset",
] as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[number];
export type AnalyticsProperties = Readonly<Record<string, string | number>>;
export type TapDBState = "idle" | "initializing" | "ready" | "failed" |
  "configuration_error" | "unconfigured" | "denied";

export interface TapDBBridge {
  getStatus(): Promise<{
    supported: boolean;
    configured: boolean;
    consent: boolean;
    state: TapDBState;
    errorCode?: number;
    errorMessage?: string;
  }>;
  setConsent(options: { allowed: boolean }): Promise<{
    supported: boolean;
    configured: boolean;
    consent: boolean;
    state: TapDBState;
  }>;
  initialize(): Promise<{ state: TapDBState }>;
  logEvent(options: { event: string; properties: AnalyticsProperties }): Promise<{ accepted: boolean }>;
}

const MAX_QUEUE = 50;
const MAX_STRING = 256;
const MAX_NUMBER = 9E15;

export function sanitizeProperties(properties: AnalyticsProperties): AnalyticsProperties {
  const clean: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!/^[a-z][a-z0-9_]{0,47}$/.test(key)) continue;
    if (typeof value === "string") {
      if (value.length <= MAX_STRING) clean[key] = value;
    } else if (Number.isFinite(value) && Math.abs(value) <= MAX_NUMBER) {
      clean[key] = value;
    }
  }
  return clean;
}

export class GameAnalytics {
  readonly supported: boolean;
  private readonly native?: TapDBBridge;
  private allowed = false;
  private current: TapDBState = "idle";
  private configured = false;
  private errorCode?: number;
  private errorMessage?: string;
  private queue: { event: AnalyticsEvent; properties: AnalyticsProperties }[] = [];
  private polling = false;
  private pollAttempts = 0;
  private onChange?: () => void;

  constructor(native?: TapDBBridge) {
    this.native = native;
    this.supported = Boolean(native);
  }

  get consent() {
    return this.allowed;
  }

  get state() {
    return this.current;
  }

  get configurationError() {
    return this.current === "configuration_error" || this.errorCode === 1001;
  }

  observe(change: () => void) {
    this.onChange = change;
  }

  private update(status: Partial<{
    configured: boolean; state: TapDBState; errorCode?: number; errorMessage?: string;
  }>) {
    if (status.configured !== undefined) this.configured = status.configured;
    if (status.state !== undefined) {
      this.current = status.state;
      if (this.current === "failed" || this.current === "configuration_error" ||
          this.current === "unconfigured") this.queue = [];
    }
    if (status.errorCode !== undefined) this.errorCode = status.errorCode;
    if (status.errorMessage !== undefined) this.errorMessage = status.errorMessage;
    this.onChange?.();
  }

  restore(allowed: boolean) {
    this.allowed = allowed;
    this.current = allowed ? "idle" : "denied";
    if (allowed) void this.setConsent(true);
  }

  async setConsent(allowed: boolean) {
    this.allowed = allowed;
    this.pollAttempts = 0;
    if (!allowed) {
      this.queue = [];
      this.current = "denied";
      this.onChange?.();
      if (this.native) await this.native.setConsent({ allowed: false }).catch(() => {});
      return;
    }
    if (!this.native) {
      this.current = "unconfigured";
      this.onChange?.();
      return;
    }
    try {
      this.update(await this.native.setConsent({ allowed: true }));
    } catch {
      this.update({ state: "failed" });
      return;
    }
    this.schedulePoll();
  }

  async initialize() {
    if (!this.allowed || !this.native || this.current === "ready" ||
        this.current === "initializing" || this.current === "configuration_error" ||
        this.current === "unconfigured") return;
    try {
      this.update(await this.native.initialize());
      this.schedulePoll();
    } catch {
      this.update({ state: "failed" });
    }
  }

  private schedulePoll() {
    if (this.polling || !this.allowed || !this.native ||
        this.current === "ready" || this.current === "failed" ||
        this.current === "configuration_error" || this.current === "unconfigured" ||
        this.pollAttempts >= 30) return;
    this.polling = true;
    window.setTimeout(() => { void this.refresh(); }, 1000);
  }

  async refresh() {
    this.polling = false;
    if (!this.allowed || !this.native) return;
    try {
      this.update(await this.native.getStatus());
    } catch {
      this.update({ state: "failed" });
      return;
    }
    if (this.current === "ready") {
      this.flush();
      return;
    }
    this.pollAttempts++;
    this.schedulePoll();
  }

  logEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
    if (!this.allowed || !this.supported) return;
    const clean = sanitizeProperties(properties);
    if (this.current === "ready") {
      void this.native!.logEvent({ event, properties: clean }).catch(() => {});
    } else if (this.current === "idle" || this.current === "initializing") {
      if (this.queue.length < MAX_QUEUE) this.queue.push({ event, properties: clean });
    }
  }

  private flush() {
    if (!this.native) return;
    const pending = this.queue;
    this.queue = [];
    for (const entry of pending) {
      void this.native.logEvent(entry).catch(() => {});
    }
  }

  get diagnostic(): string {
    if (!this.supported) return "当前平台未启用 TapDB";
    if (!this.allowed) return "未同意数据统计";
    if (!this.configured) return "TapDB 尚未配置 Client ID / Token";
    if (this.current === "failed" || this.current === "configuration_error")
      return `TapDB 暂不可用${this.errorCode ? `（${this.errorCode}）` : ""}`;
    return this.current === "ready" ? "TapDB 已连接" : "TapDB 正在初始化";
  }
}

export function createGameAnalytics(): GameAnalytics {
  return new GameAnalytics(
    Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("TapDB")
      ? registerPlugin<TapDBBridge>("TapDB")
      : undefined,
  );
}
