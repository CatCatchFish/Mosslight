import "./ui/styles.css";
import "./ui/scene.css";
import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { createGameAnalytics } from "./platform/analytics.ts";
import { AnalyticsConsentStore } from "./platform/analytics-consent.ts";
import { GameAudio, Soundtrack, type MusicTheme } from "./platform/audio.ts";
import { DEBUG_UNLOCK_ALL, debugUnlockedBackend } from "./platform/debug.ts";
import { bindLifecycle } from "./platform/lifecycle.ts";
import { createReviewController } from "./platform/review.ts";
import { SaveStore } from "./platform/save.ts";
import { localSaveBackend } from "./platform/storage.ts";
import { loadEnemyAtlases } from "./render/enemy-atlas.ts";
import { mountBattle } from "./ui/battle.ts";
import { mountAnalyticsConsent } from "./ui/analytics-consent.ts";
import { mountCampaign } from "./ui/campaign.ts";
import { $, revealView, setMapExpanded } from "./ui/dom.ts";
import { icon, isIcon } from "./ui/icons.ts";
import { mountPrivacyConsentControls } from "./ui/privacy-policy.ts";
import { mountReviewPrompt } from "./ui/review.ts";
import { mountSettings } from "./ui/settings.ts";

async function waitForAppHandoff(timeoutMs = 6000) {
  if (!Capacitor.isNativePlatform()) return false;
  return new Promise<boolean>((resolve) => {
    let settled = false;
    let listener: PluginListenerHandle | undefined;
    const finish = (handedOff: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (listener) void listener.remove().catch(() => undefined);
      resolve(handedOff);
    };
    const onVisibilityChange = () => {
      if (document.hidden) finish(true);
    };
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    void App.addListener("pause", () => finish(true))
      .then(async (handle) => {
        listener = handle;
        const state = await App.getState();
        if (!state.isActive) finish(true);
        if (settled) void handle.remove().catch(() => undefined);
      })
      .catch(() => finish(false));
  });
}

async function start() {
  for (const element of document.querySelectorAll<HTMLElement>("[data-icon]")) {
    const name = element.dataset.icon;
    if (name && isIcon(name)) element.innerHTML = icon(name);
  }
  const closeArt =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  for (const id of ["close-menu", "close-journal", "close-landmark", "close-loadout", "close-talents"])
    $(id).innerHTML = closeArt;

  const backend = localSaveBackend();
  const saveBackend = DEBUG_UNLOCK_ALL ? debugUnlockedBackend(backend) : backend;
  const save = new SaveStore(saveBackend, (error) => {
    console.error("Local save:", error);
    const status = $("storage-status");
    status.textContent = "本地存档暂时不可用，本次游玩仍可继续。";
    status.hidden = false;
  });
  await Promise.all([save.load(), loadEnemyAtlases()]);
  const analytics = createGameAnalytics();
  const consentStore = new AnalyticsConsentStore(backend);
  await consentStore.load().catch((error) => console.error("Analytics consent:", error));
  await mountAnalyticsConsent(consentStore, analytics);
  mountPrivacyConsentControls(consentStore, analytics);
  if (DEBUG_UNLOCK_ALL) {
    $("debug-build-badge").hidden = false;
    document.title = "【调试·全解锁】" + document.title;
  }
  const audio = new GameAudio(save.snapshot.sound, save.snapshot.soundVolume, save.snapshot.ambience);
  const music = new Soundtrack($("soundtrack"), save.snapshot.music, save.snapshot.musicVolume);
  const review = createReviewController(() => analytics.consent);
  const promptReviewIfPending = mountReviewPrompt(
    save,
    audio,
    review,
    waitForAppHandoff,
  );
  $("map-viewport").addEventListener("click", () => {
    setMapExpanded(!$("campaign-view").classList.contains("wide-board"));
    audio.playUi("ui-tab");
  });
  for (const id of ["close-menu", "close-journal", "close-landmark", "close-loadout", "close-talents"])
    $(id).addEventListener("click", () => audio.playUi("ui-close"));
  let stageMusicTheme: MusicTheme = "woods";
  const battle = mountBattle(save, audio, analytics, (id, note) => {
    audio.setAmbience(null);
    music.setTheme("trail", { fadeMs: 500 });
    campaign.open(id, note);
  }, (stageId) => {
    review.noteStageCleared(
      stageId,
      save.snapshot.reviewPrompts,
      save.snapshot.reviewOpened,
    );
  }, (bossTheme) => {
    if (bossTheme) music.setTheme(bossTheme, { fadeMs: 750, restart: true });
    else music.setTheme(stageMusicTheme, { fadeMs: 850 });
  });
  const campaign = mountCampaign(save, audio, analytics, (level, loadout) => {
    stageMusicTheme =
      level.biome === "frost" ? "frost"
        : level.biome === "wetland" || level.biome === "river-edge" || level.biome === "mire" || level.biome === "mire-edge" ? "wetland"
        : "woods";
    music.setTheme(stageMusicTheme, { fadeMs: 500, restart: true });
    audio.setAmbience(
      level.biome === "frost" ? "frost"
        : level.biome === "mire" || level.biome === "mire-edge" ? "mire"
        : level.biome === "quarry" ? "mine"
        : level.biome === "wetland" || level.biome === "river-edge" ? "wetland"
        : "forest",
    );
    battle.open(level, loadout);
  }, () => audio.play("dispatch"), () => {
    promptReviewIfPending();
  });
  mountSettings(save, audio, music, async () => {
    await save.settled();
    battle.stop();
    music.setActive(false);
    revealView("exit-view");
    $("resume-game").focus();
    if (Capacitor.getPlatform() === "android")
      await App.exitApp().catch((error) => console.error("Exit game:", error));
  });
  $("resume-game").addEventListener("click", () => {
    audio.playUi("ui-confirm");
    music.setTheme("trail");
    music.setActive(true);
    campaign.open();
  });
  revealView("campaign-view");
  if (audio.enabled) void audio.resume().catch(() => {});
  await bindLifecycle((active) => {
    if (active) void analytics.initialize();
    else void save.settled();
    music.setActive(active && $("exit-view").hidden === true);
    battle.setActive(active);
  }, () => {
    if (analytics.supported && consentStore.snapshot === null) return false;
    const dialog = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]")).at(-1);
    if (dialog) {
      dialog.close();
      return true;
    }
    return battle.back();
  }).catch((error) => console.error("App lifecycle:", error));
}

void start().catch((error) => {
  console.error(error);
  const status = $("storage-status");
  status.textContent = "游戏启动失败，请重新打开应用。";
  status.hidden = false;
});
