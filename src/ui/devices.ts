import { DEVICES } from "../engine/devices.ts";
import { TRACK_SWITCH_REACH, TRACK_SWITCH_RETURN } from "../engine/defense.ts";
import type { DefenseGame } from "../engine/defense.ts";
import { $, requiredChild } from "./dom.ts";
import { icon } from "./icons.ts";

export type DevicePreview = number | "track-switch" | null;

const labels = {
  sluice: { ready: "水闸", active: "开闸", help: "减缓所在浅滩的地面敌人", icon: "water" as const },
  "rail-cart": { ready: "绞盘", active: "行进", help: "放出矿车撞击地面敌人，可打断绞链矿傀", icon: "pick" as const },
  "log-roll": { ready: "滚木", active: "滚落", help: "滚出原木撞击并短暂眩晕地面敌人", icon: "pine" as const },
  "sun-mirror": { ready: "镜阵", active: "照射", help: "照射金色标线内的敌人，4 秒内多受 35% 伤害，并使镜甲岩羊失去冰甲", icon: "sparkle" as const },
  "mire-boom": { ready: "沉木拦栅", active: "拦截", help: `升起木栅，扣住标线内最多 ${DEVICES["mire-boom"].capacity} 名地面敌人，空中与潜泥单位可通过`, icon: "fence" as const },
  "mire-backwash": { ready: "倒潮闸", active: "倒潮", help: "逆水推回触及的普通地面敌人，飞行、潜泥与领主可通过", icon: "water" as const },
  "mire-beacon": { ready: "引灯信标", active: "引灯", help: "炮塔优先攻击射程内进入灯圈的目标", icon: "lantern" as const },
} as const;

export function mountBattleDevices(
  game: DefenseGame,
  onActivate: (name: string, kind: keyof typeof DEVICES) => void,
  onSwitch: () => void,
) {
  const layer = $("battle-devices");
  const dock = $("device-dock");
  layer.replaceChildren();
  dock.replaceChildren();
  const hasAny = game.devices.length > 0 || Boolean(game.level.trackSwitch);
  dock.hidden = !hasAny;
  let selected: DevicePreview = null;
  const confirm = (target: Exclude<DevicePreview, null>, commit: () => boolean) => {
    if (game.paused || game.ended) return;
    if (selected !== target) selected = target;
    else if (commit()) selected = null;
    sync();
  };

  const bindings = game.devices.map(({ spec }, index) => {
    const { name } = DEVICES[spec.kind];
    const info = labels[spec.kind];
    const trigger = () => confirm(index, () => {
      if (!game.activateDevice(index)) return false;
      onActivate(name, spec.kind);
      return true;
    });

    // Compact, semi-transparent circular on-map marker (does not obscure roads/plots on phones)
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "device-control device-pin";
    pin.dataset.kind = spec.kind;
    pin.innerHTML = icon(info.icon) + "<span></span>";
    pin.style.left = `${(spec.at[0] + 0.5) * 100 / game.level.width}%`;
    pin.style.top = `${(spec.at[1] + 0.5) * 100 / game.level.height}%`;
    pin.addEventListener("click", trigger);
    layer.append(pin);

    // Ergonomic bottom-left dock button for unobstructed thumb access on mobile
    const dockButton = document.createElement("button");
    dockButton.type = "button";
    dockButton.className = "device-dock-button";
    dockButton.dataset.kind = spec.kind;
    const tag = "label" in spec && spec.label ? spec.label : game.devices.length > 1
      ? (spec.at[0] < game.level.width / 2 ? "西" : "东") + info.ready
      : info.ready;
    dockButton.innerHTML = icon(info.icon) + `<b>${tag}</b><span></span>`;
    dockButton.addEventListener("click", trigger);
    dock.append(dockButton);

    return {
      pin,
      pinText: requiredChild(pin, "span"),
      dockButton,
      dockText: requiredChild(dockButton, "span"),
      tag,
      key: "",
    };
  });
  const syncTrack = mountTrackSwitch(game, layer, dock, () => confirm("track-switch", () => {
    if (!game.switchTrack()) return false;
    onSwitch();
    return true;
  }));
  function sync() {
    const available = !game.ended && !game.paused;
    if (!available) selected = null;
    syncTrack?.(selected === "track-switch");
    for (const [index, { spec, usedAt, struck }] of game.devices.entries()) {
      const binding = bindings[index];
      const ready = game.deviceReady(index);
      const elapsed = game.time - usedAt;
      const rule = DEVICES[spec.kind];
      const active = !game.ended && elapsed < rule.duration;
      const wait = Math.ceil(game.deviceCooldown(index));
      const preview = selected === index;
      const state = preview ? "preview" : active ? "active" : ready ? "ready" : "waiting";
      const count = spec.kind === "mire-boom" && active ? ` ${struck.size}/${DEVICES[spec.kind].capacity}` : "";
      const key = `${state}/${wait}/${count}/${available}/${ready}`;
      if (key === binding.key) continue;
      binding.key = key;
      const label = labels[spec.kind];
      const status = preview && ready ? "再点触发" : active ? label.active + count
        : wait ? `冷却 ${wait} 秒` : ready ? "点按查看范围" : "交战时可触发";
      const help = spec.cooldownGroup ? label.help + "，同组机关共用冷却" : label.help;
      const title = `${"label" in spec && spec.label ? binding.tag : rule.name} · ${help} · ${status}`;

      binding.pin.dataset.state = state;
      binding.pin.disabled = !available;
      binding.pin.setAttribute("aria-pressed", String(preview));
      binding.pinText.textContent = preview && ready ? "✓" : wait ? `${wait}` : "";
      binding.pin.title = title;
      binding.pin.setAttribute("aria-label", title);

      binding.dockButton.dataset.state = state;
      binding.dockButton.disabled = !available;
      binding.dockButton.setAttribute("aria-pressed", String(preview));
      binding.dockText.textContent = preview && ready ? "再点触发" : active ? label.active + count : wait ? `${wait}s` : "查看";
      binding.dockButton.title = title;
      binding.dockButton.setAttribute("aria-label", title);
    }
  }
  return {
    get preview() { return selected; },
    cancel() {
      if (selected === null) return false;
      selected = null;
      sync();
      return true;
    },
    sync,
  };
}

function mountTrackSwitch(
  game: DefenseGame,
  layer: HTMLElement,
  dock: HTMLElement,
  trigger: () => void,
) {
  const spec = game.level.trackSwitch;
  if (!spec) return;
  // Compact on-map switch pin
  const pin = document.createElement("button");
  pin.type = "button";
  pin.className = "device-control device-pin track-switch";
  pin.dataset.kind = "track-switch";
  pin.innerHTML = icon("trail") + "<span></span>";
  pin.style.left = `${(spec.at[0] + 0.5) * 100 / game.level.width}%`;
  pin.style.top = `${(spec.at[1] + 0.5) * 100 / game.level.height}%`;
  pin.addEventListener("click", trigger);
  layer.append(pin);

  // Full-status button in the bottom-left dock
  const dockButton = document.createElement("button");
  dockButton.type = "button";
  dockButton.className = "device-dock-button track-switch";
  dockButton.dataset.kind = "track-switch";
  dockButton.innerHTML = icon("trail") + "<b></b><span></span>";
  dockButton.addEventListener("click", trigger);
  dock.append(dockButton);

  const pinText = requiredChild(pin, "span");
  const track = requiredChild(dockButton, "b");
  const status = requiredChild(dockButton, "span");
  let previous = "";
  return (preview: boolean) => {
    const key = `${game.revision}/${game.paused}/${preview}`;
    if (key === previous) return;
    previous = key;
    const ready = Boolean(game.switchCandidate());
    const upper = game.track === "upper";
    const current = upper ? "短轨" : "长轨";
    const next = upper ? "长轨" : "短轨";
    const stateText = game.ended ? "已结束" : game.paused ? "暂停"
      : game.trackLocked ? "锁定" : !game.trackPending ? "待命"
      : game.switchPost ? "值勤中" : ready ? preview ? `再点切${next}` : "查看路线"
      : game.loadout.includes("guard-post") ? "需岗哨" : "缺岗哨";
    const help = `南侧运渣口每波出怪前可换轨一次。长轨经过矿洞，炮塔无法锁定洞内敌人。派遣 ${TRACK_SWITCH_REACH} 格内岗哨的一名兔卫，运渣口出怪 ${TRACK_SWITCH_RETURN} 秒后开始归队。`;
    const title = `矿站道岔 · ${current} · ${stateText}。${help}`;
    const state = preview ? "preview" : ready ? "ready" : "waiting";

    pinText.textContent = upper ? "短" : "长";
    pin.disabled = game.ended || game.paused;
    pin.dataset.state = state;
    pin.setAttribute("aria-pressed", String(preview));
    pin.dataset.track = game.track;
    pin.title = title;
    pin.setAttribute("aria-label", title);

    track.textContent = current;
    status.textContent = stateText;
    dockButton.disabled = game.ended || game.paused;
    dockButton.setAttribute("aria-pressed", String(preview));
    dockButton.dataset.state = state;
    dockButton.dataset.track = game.track;
    dockButton.title = title;
    dockButton.setAttribute("aria-label", title);
  };
}
