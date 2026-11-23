import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export async function bindLifecycle(
  onActive: (active: boolean) => void,
  onBack: () => boolean,
) {
  if (!Capacitor.isNativePlatform()) {
    const update = () => onActive(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    return;
  }

  await App.addListener("pause", () => onActive(false));
  await App.addListener("resume", () => onActive(true));
  if (Capacitor.getPlatform() === "android") {
    await App.addListener("backButton", () => {
      if (!onBack()) void App.exitApp();
    });
  }
  onActive((await App.getState()).isActive);
}
