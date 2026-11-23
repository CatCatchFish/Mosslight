import { Capacitor, registerPlugin } from "@capacitor/core";

export interface AntiAddictionResult {
  readonly code: number;
  readonly allowed: boolean;
  readonly needsLogin: boolean;
  readonly ageRange: number;
  readonly remainingSeconds: number;
  readonly message?: string;
}

export interface AntiAddictionProvider {
  initialize(): Promise<{ configured: boolean; sdk: string }>;
  start(): Promise<AntiAddictionResult>;
  login(): Promise<AntiAddictionResult>;
  status(): Promise<Pick<AntiAddictionResult, "allowed" | "ageRange" | "remainingSeconds">>;
  logout(): Promise<void>;
}

interface NativeTapAntiAddiction {
  initialize(): Promise<{ configured: boolean; sdk: string }>;
  start(): Promise<AntiAddictionResult>;
  login(): Promise<AntiAddictionResult>;
  status(): Promise<Pick<AntiAddictionResult, "allowed" | "ageRange" | "remainingSeconds">>;
  logout(): Promise<void>;
}

const NativeTap = registerPlugin<NativeTapAntiAddiction>("TapAntiAddiction");

export class TapTapAntiAddictionProvider implements AntiAddictionProvider {
  initialize() {
    return NativeTap.initialize();
  }
  start() {
    return NativeTap.start();
  }
  login() {
    return NativeTap.login();
  }
  status() {
    return NativeTap.status();
  }
  logout() {
    return NativeTap.logout();
  }
}

export function tapAntiAddiction(): TapTapAntiAddictionProvider | null {
  return Capacitor.getPlatform() === "android"
    ? new TapTapAntiAddictionProvider()
    : null;
}