import type { GameAudio, Soundtrack } from "../platform/audio.ts";
import type { SaveStore } from "../platform/save.ts";
import { setArtQuality } from "../render/quality.ts";
import type { ArtQuality } from "../render/quality.ts";
import { $, requiredChild } from "./dom.ts";

export function mountSettings(
  save: SaveStore,
  audio: GameAudio,
  music: Soundtrack,
  onExit: () => Promise<void>,
) {
  const dialog = $("settings-dialog");

  function open(trigger: HTMLElement, inBattle: boolean) {
    const anchor = trigger.getBoundingClientRect();
    dialog.style.setProperty("--settings-top", `${Math.max(8, anchor.top)}px`);
    dialog.style.setProperty(
      "--settings-left",
      `${Math.max(8, anchor.left)}px`,
    );
    $("battle-settings-actions").hidden = !inBattle;
    $("exit-description").textContent = inBattle
      ? "退出会结束当前战斗。已获得的关卡评级和设置会保留。"
      : "已获得的关卡评级和设置会保留。";
    dialog.showModal();
  }

  function updateToggle(id: "music" | "audio" | "ambience", enabled: boolean) {
    const button = $(id);
    button.setAttribute("aria-pressed", String(enabled));
    requiredChild(button, ".setting-state").textContent = enabled ? "开" : "关";
  }

  function bindVolume(
    id: "music" | "sound", key: "musicVolume" | "soundVolume",
    apply: (volume: number) => void, preview?: () => void,
  ) {
    const slider = $(`${id}-volume`) as HTMLInputElement;
    const readout = $(`${id}-volume-value`);
    const refresh = () => {
      const value = slider.valueAsNumber;
      readout.textContent = `${value}%`;
      slider.setAttribute("aria-valuetext", `${value}%`);
      apply(value);
      return value;
    };
    slider.value = String(save.snapshot[key]);
    refresh();
    slider.addEventListener("input", refresh);
    slider.addEventListener("change", () => {
      const value = refresh();
      save.setVolume(key, value);
      if (value > 0) preview?.();
    });
  }

  const mapSettings = $("map-settings");
  const battleSettings = $("battle-settings");
  mapSettings.addEventListener("click", () => open(mapSettings, false));
  battleSettings.addEventListener("click", () => open(battleSettings, true));
  const exitDialog = $("exit-dialog");
  const confirmExit = $("confirm-exit");
  $("exit-game").addEventListener("click", () => exitDialog.showModal());
  confirmExit.addEventListener("click", async () => {
    confirmExit.disabled = true;
    try {
      await onExit();
    } finally {
      confirmExit.disabled = false;
    }
  });
  $("music").addEventListener("click", () => {
    const enabled = !save.snapshot.music;
    save.setMusic(enabled);
    music.setEnabled(enabled);
    updateToggle("music", enabled);
  });
  $("audio").addEventListener("click", () => {
    audio.enabled = !audio.enabled;
    save.setSound(audio.enabled);
    updateToggle("audio", audio.enabled);
    if (audio.enabled) {
      void audio
        .resume()
        .then(() => audio.play("interact"))
        .catch(() => {});
    } else audio.suspend();
  });
  $("ambience").addEventListener("click", () => {
    const enabled = !save.snapshot.ambience;
    save.setAmbience(enabled);
    audio.setAmbienceEnabled(enabled);
    updateToggle("ambience", enabled);
  });
  function updateQuality(quality: ArtQuality) {
    const button = $("art-quality");
    const high = quality === "high";
    button.setAttribute("aria-pressed", String(high));
    requiredChild(button, ".setting-state").textContent = high ? "高" : "低";
  }

  $("art-quality").addEventListener("click", () => {
    const next: ArtQuality = save.snapshot.artQuality === "high" ? "low" : "high";
    save.setArtQuality(next);
    setArtQuality(next);
    updateQuality(next);
  });
  setArtQuality(save.snapshot.artQuality);
  updateQuality(save.snapshot.artQuality);
  updateToggle("music", save.snapshot.music);
  updateToggle("audio", save.snapshot.sound);
  updateToggle("ambience", save.snapshot.ambience);
  bindVolume("music", "musicVolume", (volume) => music.setVolume(volume));
  bindVolume("sound", "soundVolume", (volume) => audio.setVolume(volume), () => {
    void audio.resume().then(() => audio.play("interact")).catch(() => {});
  });
  document.addEventListener("click", () => music.unlock());
}
