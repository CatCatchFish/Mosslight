import "./ui/styles.css";
import "./ui/scene.css";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { tapAntiAddiction } from "./platform/anti-addiction.ts";
import { GameAudio, Soundtrack } from "./platform/audio.ts";
import { bindLifecycle } from "./platform/lifecycle.ts";
import { SaveStore } from "./platform/save.ts";
import { localSaveBackend } from "./platform/storage.ts";
import { loadEnemyAtlases } from "./render/enemy-atlas.ts";
import { enforceAntiAddiction } from "./ui/anti-addiction.ts";
import { mountBattle } from "./ui/battle.ts";
import { mountCampaign } from "./ui/campaign.ts";
import { $, revealView, setMapExpanded } from "./ui/dom.ts";
import { icon, isIcon } from "./ui/icons.ts";
import { mountSettings } from "./ui/settings.ts";

async function start() {
  $("map-viewport").addEventListener("click", () => setMapExpanded(!$("campaign-view").classList.contains("wide-board")));
  for (const element of document.querySelectorAll<HTMLElement>("[data-icon]")) {
    const name = element.dataset.icon;
    if (name && isIcon(name)) element.innerHTML = icon(name);
  }
  const closeArt =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  for (const id of ["close-menu", "close-journal", "close-landmark", "close-loadout"])
    $(id).innerHTML = closeArt;

  const save = new SaveStore(localSaveBackend(), (error) => {
    console.error("Local save:", error);
    const status = $("storage-status");
    status.textContent = "本地存档暂时不可用，本次游玩仍可继续。";
    status.hidden = false;
  });
  await Promise.all([save.load(), loadEnemyAtlases()]);
  const audio = new GameAudio(save.snapshot.sound, save.snapshot.soundVolume, save.snapshot.ambience);
  const music = new Soundtrack($("soundtrack"), save.snapshot.music, save.snapshot.musicVolume);
  const battle = mountBattle(save, audio, (id, note) => {
    audio.setAmbience(null);
    music.setTheme("trail");
    campaign.open(id, note);
  });
  const campaign = mountCampaign(save, (level, loadout) => {
    music.setTheme(
      level.biome === "frost" ? "frost"
        : level.biome === "wetland" || level.biome === "river-edge" || level.biome === "mire" || level.biome === "mire-edge" ? "wetland"
        : "woods",
    );
    audio.setAmbience(
      level.biome === "frost" ? "frost"
        : level.biome === "mire" || level.biome === "mire-edge" ? "mire"
        : level.biome === "quarry" ? "mine"
        : level.biome === "wetland" || level.biome === "river-edge" ? "wetland"
        : "forest",
    );
    battle.open(level, loadout);
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
    music.setTheme("trail");
    music.setActive(true);
    campaign.open();
  });
  if (!(await enforceAntiAddiction(tapAntiAddiction()))) return;
  revealView("campaign-view");
  await bindLifecycle((active) => {
    music.setActive(active && $("exit-view").hidden === true);
    battle.setActive(active);
  }, () => {
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
