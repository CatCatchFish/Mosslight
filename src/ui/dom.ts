interface ElementById {
  "stage-art": HTMLCanvasElement;
  "battle-art": HTMLCanvasElement;
  "result-art": HTMLImageElement;
  "start-first-wave": HTMLButtonElement;
  "campaign-map": HTMLImageElement;
  "map-surround": HTMLCanvasElement;
  "scout-art": HTMLImageElement;
  "toggle-description": HTMLButtonElement;
  "start-level": HTMLButtonElement;
  "open-loadout": HTMLButtonElement;
  "loadout-dialog": HTMLDialogElement;
  "save-loadout": HTMLButtonElement;
  "loadout-clear": HTMLButtonElement;
  "loadout-preset": HTMLButtonElement;
  soundtrack: HTMLAudioElement;
  "settings-dialog": HTMLDialogElement;
  "analytics-consent-dialog": HTMLDialogElement;
  "analytics-consent-accept": HTMLButtonElement;
  "analytics-consent-decline": HTMLButtonElement;
  "analytics-consent-policy": HTMLButtonElement;
  "analytics-consent-ack": HTMLInputElement;
  "analytics-consent-error": HTMLElement;
  "review-dialog": HTMLDialogElement;
  "review-later": HTMLButtonElement;
  "review-open": HTMLButtonElement;
  "review-policy": HTMLButtonElement;
  "review-status": HTMLElement;
  "privacy-dialog": HTMLDialogElement;
  "privacy-policy-content": HTMLElement;
  "privacy-consent-action": HTMLButtonElement;
  "privacy-consent-status": HTMLElement;
  "close-privacy-policy": HTMLButtonElement;
  "debug-build-badge": HTMLElement;
  "exit-dialog": HTMLDialogElement;
  "confirm-exit": HTMLButtonElement;
  "route-home": HTMLButtonElement;
  pause: HTMLButtonElement;
  speed: HTMLButtonElement;
  audio: HTMLButtonElement;
  restart: HTMLButtonElement;
  battlefield: HTMLCanvasElement;
  "close-menu": HTMLButtonElement;
  journal: HTMLButtonElement;
  "landmark-dialog": HTMLDialogElement;
  "landmark-art": HTMLImageElement;
  "close-landmark": HTMLButtonElement;
  "route-dialog": HTMLDialogElement;
  "confirm-route": HTMLButtonElement;
  "restart-dialog": HTMLDialogElement;
  "confirm-restart": HTMLButtonElement;
  "journal-dialog": HTMLDialogElement;
  "close-journal": HTMLButtonElement;
  "result-dialog": HTMLDialogElement;
  "result-route": HTMLButtonElement;
  replay: HTMLButtonElement;
  "result-next": HTMLButtonElement;
}

export function $<K extends keyof ElementById>(id: K): ElementById[K];
export function $(id: string): HTMLElement;
export function $(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error("Missing interface element #" + id);
  return element;
}

export function revealView(id: "campaign-view" | "game-view" | "exit-view") {
  $("campaign-view").hidden = id !== "campaign-view";
  $("game-view").hidden = id !== "game-view";
  $("exit-view").hidden = id !== "exit-view";
  const view = $(id);
  view.classList.remove("arrive");
  void view.offsetWidth;
  view.classList.add("arrive");
  window.scrollTo(0, 0);
}

export function setMapExpanded(expanded: boolean) {
  $("campaign-view").classList.toggle("wide-board", expanded);
  const button = $("map-viewport");
  button.setAttribute("aria-pressed", String(expanded));
  button.setAttribute("aria-label", expanded ? "显示指挥面板" : "放大地图");
}

export function requiredChild<T extends HTMLElement = HTMLElement>(
  parent: Element,
  selector: string,
): T {
  const child = parent.querySelector<T>(selector);
  if (!child) throw new Error("Missing interface element " + selector);
  return child;
}
