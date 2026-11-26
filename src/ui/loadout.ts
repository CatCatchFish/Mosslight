import { CHAPTERS, STARTER_TOWERS, unlockedTowers } from "../content/campaign.ts";
import {
  ALL_BUILDINGS,
  battleLoadout,
  BUILDING_REGION,
  levelTowerOptions,
  LOADOUT_LIMIT,
  TOWERS,
} from "../content/towers.ts";
import { GUARD_BRANCHES, GUARD_BUILDINGS, isGuardPostId } from "../engine/guards.ts";
import type { BuildingId, Level } from "../engine/types.ts";
import type { GameAudio } from "../platform/audio.ts";
import type { GameAnalytics } from "../platform/analytics.ts";
import type { SaveStore } from "../platform/save.ts";
import { guardPostIcon } from "../render/guards.ts";
import { towerIcon } from "../render/tower-art.ts";
import { $ } from "./dom.ts";
import { icon } from "./icons.ts";

type LoadoutFilter = "all" | "ranged" | "interceptor";

const DEFAULT_GLOBAL_PRESET: readonly BuildingId[] = [
  "arrow", "cannon", "frost", "ballista", "guard-post",
];

function buildingMeta(type: BuildingId) {
  if (isGuardPostId(type)) {
    const spec = GUARD_BUILDINGS[type];
    const branches = spec.branches.map((branch) => GUARD_BRANCHES[branch].name).join(" / ");
    return {
      name: spec.name,
      role: spec.role,
      color: spec.color,
      cost: spec.base.cost,
      category: "拦截",
      paths: `专精：${branches}`,
      region: CHAPTERS[BUILDING_REGION[type]] ?? CHAPTERS[0],
    };
  }
  const spec = TOWERS[type];
  const paths = Object.values(spec.paths).map((p) => p.name).join(" / ");
  return {
    name: spec.name,
    role: spec.role,
    color: spec.color,
    cost: spec.tiers[0].cost,
    category: "远程",
    paths: `四级专精：${paths}`,
    region: CHAPTERS[BUILDING_REGION[type]] ?? CHAPTERS[0],
  };
}

function drawBuildingIcon(canvas: HTMLCanvasElement, type: BuildingId, style?: Level["towerStyle"]) {
  if (isGuardPostId(type)) guardPostIcon(canvas, 1, type, style);
  else towerIcon(canvas, type, null, style);
}

export function mountLoadout(save: SaveStore, audio: GameAudio, analytics: GameAnalytics) {
  const trigger = $("open-loadout");
  const dialog = $("loadout-dialog");
  const deck = $("loadout-deck");
  const tabs = $("loadout-tabs");
  const grid = $("loadout-grid");
  const detail = $("loadout-detail");
  const apply = $("save-loadout");
  const clearButton = $("loadout-clear");
  const presetButton = $("loadout-preset");

  let level: Level | null = null;
  let selected: BuildingId[] = [];
  let filter: LoadoutFilter = "all";
  let inspected: BuildingId = "arrow";
  let newlyUnlocked = new Set<BuildingId>();
  const cards = new Map<BuildingId, HTMLButtonElement>();
  const newBadge = $("loadout-new-badge");

  function unseenUnlockedTowers(): BuildingId[] {
    const seen = new Set<BuildingId>([...STARTER_TOWERS, ...save.snapshot.seenTowers]);
    return unlockedTowers(save.snapshot.ratings).filter((id) => !seen.has(id));
  }

  function availablePool(): readonly BuildingId[] {
    return level ? levelTowerOptions(level) : ALL_BUILDINGS;
  }

  function activeGlobalLoadout(): readonly BuildingId[] {
    if (save.globalLoadout.length) return save.globalLoadout;
    if (level) return battleLoadout(level, save.snapshot.loadouts[level.id]);
    return DEFAULT_GLOBAL_PRESET;
  }

  function updateTrigger() {
    // Standalone campaign loadout module is always accessible from the main map.
    trigger.disabled = false;
    const count = $("loadout-total");
    const global = save.globalLoadout;
    if (level) {
      const effective = battleLoadout(level, global.length ? global : save.snapshot.loadouts[level.id]);
      count.textContent = `${effective.length}/${LOADOUT_LIMIT}`;
    } else {
      count.textContent = `${(global.length ? global : DEFAULT_GLOBAL_PRESET).length}/${LOADOUT_LIMIT}`;
    }
    const unseen = unseenUnlockedTowers();
    const hasNew = unseen.length > 0;
    trigger.classList.toggle("has-new-towers", hasNew);
    newBadge.hidden = !hasNew;
    if (hasNew) {
      newBadge.textContent = unseen.length > 1 ? `新 +${unseen.length}` : "新解锁";
      const names = unseen.map((id) => buildingMeta(id).name).join("、");
      trigger.title = `发现新解锁炮塔：${names}`;
    } else {
      trigger.removeAttribute("title");
    }
  }

  const deckBar = deck.parentElement;
  let fullNoticeTimer: number | undefined;

  function nudgeFullDeck() {
    audio.playUi("ui-denied");
    $("loadout-help").textContent = "编队已满（5/5），请先点按上方槽位或已选卡片移出 1 座。";
    if (!deckBar) return;
    deckBar.classList.remove("nudge");
    void deckBar.offsetWidth;
    deckBar.classList.add("nudge");
    window.clearTimeout(fullNoticeTimer);
    fullNoticeTimer = window.setTimeout(() => deckBar.classList.remove("nudge"), 550);
  }

  function renderDetail(type: BuildingId) {
    inspected = type;
    for (const [id, button] of cards) {
      button.classList.toggle("inspected", id === inspected);
    }
    const meta = buildingMeta(type);
    detail.innerHTML = "";
    const title = document.createElement("strong");
    title.textContent = `${meta.name} · ${meta.category}`;
    const regionTag = document.createElement("span");
    regionTag.className = "loadout-region-pill";
    regionTag.style.setProperty("--region", meta.region.color);
    regionTag.textContent = meta.region.name;
    const desc = document.createElement("span");
    desc.className = "loadout-detail-desc";
    desc.textContent = `${meta.role} · ${meta.paths}`;
    const head = document.createElement("div");
    head.className = "loadout-detail-head";
    head.append(title, regionTag);
    detail.append(head, desc);
  }

  function renderDeck() {
    deck.replaceChildren();
    for (let i = 0; i < LOADOUT_LIMIT; i++) {
      const type = selected[i];
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "loadout-slot" + (type ? " filled" : " empty");
      if (type) {
        const meta = buildingMeta(type);
        slot.style.setProperty("--tower-color", meta.color);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 44;
        canvas.setAttribute("aria-hidden", "true");
        drawBuildingIcon(canvas, type, level?.towerStyle);
        const name = document.createElement("span");
        name.className = "loadout-slot-name";
        name.textContent = meta.name;
        const remove = document.createElement("i");
        remove.className = "loadout-slot-remove";
        remove.textContent = "×";
        slot.title = `移除 ${meta.name}`;
        slot.append(canvas, name, remove);
        slot.addEventListener("click", () => {
          selected = selected.filter((item) => item !== type);
          audio.playUi("ui-unequip");
          updateEditor();
        });
        slot.addEventListener("mouseenter", () => renderDetail(type));
      } else {
        slot.disabled = true;
        slot.innerHTML = `<span class="loadout-slot-empty">空位 ${i + 1}</span>`;
      }
      deck.append(slot);
    }
  }

  function renderTabs() {
    const pool = availablePool();
    const rangedCount = pool.filter((id) => !isGuardPostId(id)).length;
    const interceptorCount = pool.filter(isGuardPostId).length;
    const defs: [LoadoutFilter, string][] = [
      ["all", `全部 (${pool.length})`],
      ...(rangedCount > 0 ? [["ranged", `远程炮塔 (${rangedCount})`] as [LoadoutFilter, string]] : []),
      ...(interceptorCount > 0 ? [["interceptor", `拦截建筑 (${interceptorCount})`] as [LoadoutFilter, string]] : []),
    ];
    if (!defs.some(([id]) => id === filter)) filter = "all";
    tabs.replaceChildren();
    for (const [id, label] of defs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "tab";
      btn.className = "loadout-tab";
      btn.setAttribute("aria-selected", String(filter === id));
      btn.textContent = label;
      btn.addEventListener("click", () => {
        if (filter !== id) audio.playUi("ui-tab");
        filter = id;
        renderTabs();
        renderGrid();
        updateCards();
      });
      tabs.append(btn);
    }
  }

  function renderGrid() {
    grid.replaceChildren();
    cards.clear();
    const visible = availablePool().filter((type) =>
      filter === "all" ? true : filter === "interceptor" ? isGuardPostId(type) : !isGuardPostId(type),
    );
    for (const type of visible) {
      const meta = buildingMeta(type);
      const isNew = newlyUnlocked.has(type);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "loadout-card" + (isNew ? " is-new" : "");
      button.style.setProperty("--tower-color", meta.color);

      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 56;
      canvas.setAttribute("aria-hidden", "true");
      drawBuildingIcon(canvas, type, level?.towerStyle);

      const label = document.createElement("span");
      label.className = "loadout-card-body";
      const topRow = document.createElement("span");
      topRow.className = "loadout-card-top";
      const name = document.createElement("strong");
      name.textContent = meta.name;
      const region = document.createElement("em");
      region.className = "loadout-region-tag";
      region.style.setProperty("--region", meta.region.color);
      region.textContent = meta.region.short;
      topRow.append(name, region);
      if (isNew) {
        const badge = document.createElement("span");
        badge.className = "loadout-card-new";
        badge.textContent = "新解锁";
        topRow.append(badge);
      }

      const detailLine = document.createElement("small");
      detailLine.className = "loadout-card-meta";
      detailLine.innerHTML = `<span class="loadout-role">${meta.role}</span><span class="loadout-cost">${icon("coin")}${meta.cost}</span>`;
      label.append(topRow, detailLine);

      const mark = document.createElement("span");
      mark.className = "loadout-mark";
      mark.setAttribute("aria-hidden", "true");
      button.append(canvas, label, mark);

      button.addEventListener("click", () => {
        if (newlyUnlocked.has(type)) {
          newlyUnlocked.delete(type);
          save.markTowersSeen([type]);
          button.classList.remove("is-new");
          button.querySelector(".loadout-card-new")?.remove();
          updateTrigger();
        }
        renderDetail(type);
        const index = selected.indexOf(type);
        if (index >= 0) {
          selected.splice(index, 1);
          audio.playUi("ui-unequip");
          updateEditor();
        } else if (selected.length < LOADOUT_LIMIT) {
          selected.push(type);
          audio.playUi("ui-equip");
          updateEditor();
        } else {
          nudgeFullDeck();
        }
      });
      button.addEventListener("mouseenter", () => renderDetail(type));
      grid.append(button);
      cards.set(type, button);
    }
  }

  function updateCards() {
    const count = selected.length;
    const pool = availablePool();
    $("loadout-stage").textContent = level
      ? level.tutorial
        ? `第 ${level.id} 关「${level.name}」 · 教学固定编队`
        : `第 ${level.id} 关「${level.name}」 · 本关开放 ${pool.length} 座炮塔`
      : `全局出战编队 · 已展示全部 ${ALL_BUILDINGS.length} 座炮塔`;
    const newInPool = pool.filter((type) => newlyUnlocked.has(type));
    $("loadout-count").textContent = `已编入 ${count} / ${LOADOUT_LIMIT}`;
    $("loadout-help").textContent = count === 0
      ? "请至少编入 1 座炮塔。"
      : newInPool.length > 0
        ? `新解锁：${newInPool.map((id) => buildingMeta(id).name).join("、")}，点按卡片即可编入队列。`
        : level?.tutorial
          ? "第 01 关使用固定教学编队，此处修改将用于后续关卡。"
          : count === LOADOUT_LIMIT
            ? "编队已满，点按上方槽位或已选卡片移出后再替换。"
            : "点按下方炮塔卡片即可编入或移出。";
    apply.disabled = count === 0;
    clearButton.disabled = count === 0;

    for (const [type, button] of cards) {
      const slotIndex = selected.indexOf(type);
      const equipped = slotIndex >= 0;
      const fullBlocked = !equipped && count >= LOADOUT_LIMIT;
      button.setAttribute("aria-pressed", String(equipped));
      button.classList.toggle("full-locked", fullBlocked);
      button.classList.toggle("inspected", type === inspected);
      button.lastElementChild!.textContent = equipped ? `#${slotIndex + 1}` : "+";
    }
  }

  function updateEditor() {
    renderDeck();
    updateCards();
  }

  clearButton.addEventListener("click", () => {
    selected = [];
    audio.playUi("ui-clear");
    updateEditor();
  });

  presetButton.addEventListener("click", () => {
    selected = level
      ? levelTowerOptions(level).slice(0, LOADOUT_LIMIT)
      : [...DEFAULT_GLOBAL_PRESET];
    audio.playUi("ui-preset");
    updateEditor();
  });

  trigger.addEventListener("click", () => {
    audio.playUi("ui-open");
    newlyUnlocked = new Set(unseenUnlockedTowers());
    selected = level
      ? battleLoadout(level, activeGlobalLoadout())
      : [...activeGlobalLoadout()].slice(0, LOADOUT_LIMIT);
    filter = "all";
    renderTabs();
    renderGrid();
    const firstNew = availablePool().find((id) => newlyUnlocked.has(id));
    renderDetail(firstNew ?? selected[0] ?? availablePool()[0] ?? "arrow");
    updateEditor();
    dialog.showModal();
  });

  apply.addEventListener("click", () => {
    if (!selected.length) return;
    audio.playUi("ui-confirm");
    save.setGlobalLoadout(selected);
    analytics.logEvent("loadout_save", {
      stage_id: level?.id ?? "global", tower_count: selected.length,
    });
    updateTrigger();
    dialog.close();
  });

  return (stage: Level | null) => {
    level = stage;
    updateTrigger();
  };
}
