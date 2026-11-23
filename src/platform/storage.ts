import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { SaveBackend } from "./save.ts";

export function localSaveBackend(): SaveBackend {
  if (Capacitor.isNativePlatform()) {
    return {
      read: async (key) => (await Preferences.get({ key })).value,
      write: (key, value) => Preferences.set({ key, value }),
    };
  }
  return {
    read: async (key) => window.localStorage.getItem(key),
    write: async (key, value) => window.localStorage.setItem(key, value),
  };
}
