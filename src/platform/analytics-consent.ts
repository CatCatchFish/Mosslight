import type { SaveBackend } from "./save.ts";

export const ANALYTICS_CONSENT_KEY = "mosslight-expedition.analytics-consent.v1";

export class AnalyticsConsentStore {
  private allowed: boolean | null = null;
  private pending = Promise.resolve();
  private readonly backend: SaveBackend;

  constructor(backend: SaveBackend) {
    this.backend = backend;
  }

  get snapshot(): boolean | null {
    return this.allowed;
  }

  async load() {
    const raw = await this.backend.read(ANALYTICS_CONSENT_KEY);
    try {
      const value: unknown = raw === null ? null : JSON.parse(raw);
      this.allowed = typeof value === "object" && value !== null &&
        "allowed" in value && typeof value.allowed === "boolean"
        ? value.allowed : null;
    } catch {
      this.allowed = null;
    }
  }

  async setConsent(allowed: boolean) {
    const write = this.pending.then(() => this.backend.write(
      ANALYTICS_CONSENT_KEY,
      JSON.stringify({ version: 1, allowed }),
    ));
    this.pending = write.catch(() => {});
    await write;
    this.allowed = allowed;
  }

  settled() {
    return this.pending;
  }
}
