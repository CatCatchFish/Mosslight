import { mireBloomSupply, mireBossState } from "../engine/mire-rules.ts";
import { STAGES, battleWeather, newlyIntroduced } from "../content/campaign.ts";
import { ENEMIES } from "../content/enemies.ts";
import { TOWERS } from "../content/towers.ts";
import { WEATHER, weatherAtWave } from "../content/weather.ts";
import type { WeatherId, WeatherPlan, WeatherPreset } from "../content/weather.ts";
import { DefenseGame, FROST_THAW_TAPS, supportsTargetPriority, TOWER_RESALE_PERCENT, towerStats } from "../engine/defense.ts";
import { NET_IMMUNITY } from "../engine/enemy-abilities.ts";
import { guardStats, guardUnitStats, GUARD_BRANCHES, GUARD_BUILDINGS, GUARD_MASTERIES, isGuardPost, isGuardPostId, SPEAR_THROW } from "../engine/guards.ts";
import type { GuardBranch } from "../engine/guards.ts";
import type { BuildingId, Effect, Enemy, EnemyId, Entry, GuardPostId, Level, Projectile, TargetPriority } from "../engine/types.ts";
import { BOSS_MUSIC_THEMES, type BossMusicTheme, type GameAudio } from "../platform/audio.ts";
import type { GameAnalytics } from "../platform/analytics.ts";
import type { SaveStore } from "../platform/save.ts";
import { createBattleRenderer } from "../render/battlefield.ts";
import type { SceneryReaction } from "../render/battle-details.ts";
import { reducedMotion } from "../render/motion.ts";
import { guardPostIcon } from "../render/guards.ts";
import { drawPostcard } from "../render/postcard.ts";
import { spriteIcon } from "../render/sprites.ts";
import { towerIcon } from "../render/tower-art.ts";
import { $, requiredChild, revealView } from "./dom.ts";
import { mountBattleViewport } from "./battle-viewport.ts";
import { mountBattleDevices } from "./devices.ts";
import { icon } from "./icons.ts";
import { rateBattle, starsText } from "./ratings.ts";
import { mountBattleScenery } from "./scenery.ts";

interface GateControl {
  entry: Entry;
  marker: HTMLButtonElement;
  button: HTMLButtonElement;
  clock: HTMLElement;
  sub: HTMLElement;
  bonus: HTMLElement;
  preview: HTMLElement;
  timer: HTMLElement;
  key: string | null;
}
interface MenuOption {
  name: string;
  detail: string;
  cost: number;
  type?: BuildingId;
  path?: string;
  guardArt?: { type: GuardPostId; tier: 1 | 2 | GuardBranch; mastery?: boolean };
  action: () => void;
}

export function mountBattle(
  save: SaveStore,
  audio: GameAudio,
  analytics: GameAnalytics,
  onExit: (id: string, note?: string) => void,
  onStageCleared?: (stageId: string) => void,
  onBossMusic?: (theme: BossMusicTheme | null) => void,
) {
  const viewport = mountBattleViewport();
  let game: DefenseGame;
  let stageStartedAt = 0;
  let renderBattle: ReturnType<typeof createBattleRenderer>;
  let weather: WeatherPlan;
  let devices: ReturnType<typeof mountBattleDevices> | undefined;
  let scenery: SceneryReaction[] = [];
  let showRanges = false;
  let plots: HTMLButtonElement[] = [],
    gateButtons: GateControl[] = [];
  let running = false,
    foreground = true;
  let frameId: number | null = null;
  const menu = $("menu");
  const rewards = $("gold-rewards");
  reducedMotion.addEventListener("change", () => rewards.replaceChildren());
  let shownGold: number | undefined, shownWave: number | undefined;
  let shownWeather: WeatherId | undefined;
  const rallyLayer = $("guard-rally");
  const rallyHint = $("battle-rally-hint");
  let rallyPost: number | null = null;
  let introductions: ReadonlySet<EnemyId>;
  const readDiscoveries = new Set<EnemyId>();
  let selected: number | null = null;
  let hoveredType: BuildingId | null = null;
  let speed = 1,
    lastFrame = 0,
    accumulator = 0;
  let revision = -1;
  let resultShown = false,
    flashTimer: number | undefined;
  let bossStatus = "";
  let activeBossTheme: BossMusicTheme | null = null;
  function syncBossMusic(next: BossMusicTheme | null) {
    if (next === activeBossTheme) return;
    activeBossTheme = next;
    onBossMusic?.(next);
  }
  const heard = new WeakSet<Effect | Projectile>();
  const announcedMinibosses = new WeakSet<Enemy>();
  const announcedBosses = new WeakSet<Enemy>();
  let highlightEntry: string | null = null;
  let highlightUntil = 0;

  function flashRoute(entryId: string, durationMs = 2400) {
    highlightEntry = entryId;
    highlightUntil = performance.now() + durationMs;
  }

  function entryPreviewText(entryId: string) {
    const wave = game.level.waves[game.waveIndex];
    const groups = wave?.groups[entryId];
    if (!groups?.length) return "";
    const counts = new Map<EnemyId, number>();
    for (const [members, count] of groups) {
      if (typeof members === "string") {
        counts.set(members, (counts.get(members) ?? 0) + count);
      } else {
        for (let i = 0; i < count; i++) {
          const type = members[i % members.length];
          counts.set(type, (counts.get(type) ?? 0) + 1);
        }
      }
    }
    // Sort: miniboss/boss first, then airborne, then by count descending
    const sorted = [...counts.entries()].sort((a, b) => {
      const sa = ENEMIES[a[0]], sb = ENEMIES[b[0]];
      const rank = (s: typeof sa) => (s.boss ? 3 : s.miniboss ? 2 : s.airborne ? 1 : 0);
      return rank(sb) - rank(sa) || b[1] - a[1];
    });
    return sorted.slice(0, 3).map(([type, count]) => {
      const spec = ENEMIES[type];
      const tag = spec.boss || spec.miniboss ? "★" : spec.airborne ? "✈" : "";
      return `${tag}${spec.name}×${count}`;
    }).join(" · ");
  }

  function open(level: Level, loadout?: readonly BuildingId[]) {
    game = new DefenseGame(level, loadout, save.snapshot.talents);
    introductions = newlyIntroduced(level.id);
    weather = battleWeather(level);
    stageStartedAt = performance.now();
    analytics.logEvent("stage_start", {
      stage_id: level.id, chapter: level.chapter, biome: level.biome ?? "unknown",
      weather: weatherAtWave(weather, 1) ?? weather.initial,
    });
    renderBattle = createBattleRenderer($("battlefield"), game, weather);
    drawPostcard($("battle-art"), level.chapter, level.biome, Boolean(level.bridgeDeck));
    running = true;
    $("level-caption").textContent = `第 ${level.id} 关 · ${level.name}`;
    $("plots").replaceChildren();
    $("gate-markers").replaceChildren();
    $("gate-controls").replaceChildren();
    $("gate-controls").classList.toggle("three-entries", level.entries.length === 3);
    $("gate-controls").classList.toggle("single", level.entries.length === 1);
    mountBattleControls();
    devices = mountBattleDevices(game, (name, kind) => {
      notify(kind === "sun-mirror" ? name + "已照射"
        : kind === "mire-boom" ? name + "已升起"
        : kind === "mire-backwash" ? "倒潮沿栈道涌出"
        : kind === "mire-beacon" ? "引灯已亮 · 炮塔优先集火"
        : kind === "sluice" ? name + "已开闸"
        : kind === "log-roll" ? "滚木已放出" : "矿车已出发");
      audio.play(kind === "sun-mirror" ? "storm-fire"
        : kind === "sluice" || kind === "mire-boom" || kind === "mire-backwash" ? "weir-surge"
        : kind === "log-roll" ? "cannon-hit" : "interact");
    }, () => {
      notify(game.track === "upper" ? "运渣口走短轨 · 兔卫已去值勤" : "运渣口走长轨 · 兔卫已去值勤");
      audio.play("interact");
    });
    scenery = mountBattleScenery(level, (text) => {
      notify(text);
    }, (kind) => audio.play(`scenery-${kind}`));
    $("wave-pips").replaceChildren(
      ...level.waves.map((_, index) => {
        const pip = document.createElement("i");
        const pipWeather = WEATHER[weatherAtWave(weather, index + 1)];
        if (pipWeather.severity === "severe") {
          pip.classList.add("severe-weather");
          pip.title = `第 ${index + 1} 波 · ${pipWeather.label}`;
        }
        return pip;
      }),
    );
    $("game-view").style.setProperty("--board-ratio", String(level.width / level.height));
    $("field").style.setProperty("--tile-width", `${100 / level.width}%`);
    $("field").style.setProperty("--tile-height", `${100 / level.height}%`);
    $("game-view").classList.toggle("snow-scene", level.biome === "frost");
    $("game-view").classList.toggle("quarry-scene", level.biome === "quarry");
    const marsh = level.biome === "wetland" || level.biome === "river-edge" || level.biome === "mire" || level.biome === "mire-edge";
    $("game-view").classList.toggle("marsh-scene", marsh);
    $("game-view").classList.toggle("mire-scene", level.biome === "mire" || level.biome === "mire-edge");
    bossStatus = "";
    activeBossTheme = null;
    revealView("game-view");
    reset();
    draw();
    startAnimation();
    void audio.resume().catch(() => {});
    const target = level.tutorial
      ? plots[level.tutorial.plots[0]]
      : $("battle-settings");
    target.focus({ preventScroll: true });
  }
  function notify(text: string, error = false, bossAlert = false) {
    const notice = $("notice");
    clearTimeout(flashTimer);
    notice.textContent = text;
    notice.classList.toggle("error", error);
    notice.classList.toggle("boss-alert", bossAlert);
    notice.hidden = false;
    flashTimer = window.setTimeout(() => {
      notice.hidden = true;
      notice.classList.remove("boss-alert");
    }, bossAlert ? 3200 : 2350);
  }
  function closeMenu(restoreFocus = false) {
    const previous = selected ?? rallyPost;
    selected = null;
    hoveredType = null;
    menu.hidden = true;
    rallyLayer.hidden = true;
    rallyHint.hidden = true;
    rallyPost = null;
    rallyLayer.replaceChildren();
    $("command-controls").hidden = false;
    document.body.classList.remove("menu-open");
    if (previous !== null) {
      plots[previous]?.setAttribute("aria-expanded", "false");
      if (restoreFocus) plots[previous]?.focus({ preventScroll: true });
    }
  }
  function openMenu(index: number, keyboard: boolean) {
    if (game.ended) return;
    if (selected === index) {
      closeMenu(true);
      return;
    }
    closeMenu();
    selected = index;
    if (!game.buildingAt(index)) {
      const lesson = game.level.tutorial;
      hoveredType = lesson && tutorialMarker() !== null
        ? lesson.towers[game.waveIndex] : null;
    }
    plots[index]?.setAttribute("aria-expanded", "true");
    $("command-controls").hidden = true;
    menu.hidden = false;
    document.body.classList.add("menu-open");
    renderMenu();
    $("menu-content").scrollTop = 0;
    if (keyboard)
      (
        menu.querySelector<HTMLButtonElement>(".suggested:not(:disabled)") ??
        menu.querySelector<HTMLButtonElement>(".choice:not(:disabled)") ??
        $("close-menu")
      ).focus({ preventScroll: true });
    if (matchMedia("(orientation: portrait)").matches)
      menu.scrollIntoView({ block: "nearest" });
  }
  function chooseBuild(type: BuildingId) {
    const index = selected;
    if (index === null) return;
    if (!game.build(index, type)) return;
    analytics.logEvent("tower_build", {
      stage_id: game.level.id, tower_id: type, tier: 1,
    });
    closeMenu(true);
    notify((isGuardPostId(type) ? GUARD_BUILDINGS[type].name : TOWERS[type].name) + "已建成");
    audio.play("build");
    sync();
  }
  function chooseRally(index: number) {
    const post = game.guardPosts.get(index);
    if (!post || game.ended) return;
    closeMenu();
    rallyHint.textContent = `点布防圈内的道路 · 半径 ${guardStats(post).reach} 格`;
    for (const [index, point] of game.guardPoints(post.index).entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "guard-rally-point";
      button.innerHTML = icon("flag");
      button.setAttribute("aria-label", "防守点 " + (index + 1));
      button.setAttribute("aria-pressed", String(point[0] === post.rally[0] && point[1] === post.rally[1]));
      place(button, ...point);
      button.addEventListener("click", () => {
        if (!game.setGuardRally(post.index, point)) return;
        closeMenu(true);
        notify(GUARD_BUILDINGS[post.type].unit + "已收到换防指令");
        audio.play("interact");
      });
      rallyLayer.append(button);
    }
    rallyPost = post.index;
    rallyLayer.hidden = false;
    rallyHint.hidden = false;
    rallyLayer.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }
  function chooseUpgrade(path?: string) {
    const index = selected;
    if (index === null) return;
    const building = game.buildingAt(index);
    if (!building || !game.upgrade(index, path)) return;
    analytics.logEvent("tower_upgrade", {
      stage_id: game.level.id, tower_id: building.type, tier: building.tier,
      action: path ? "specialize" : "upgrade",
    });
    const name = isGuardPost(building)
      ? (building.branch ? GUARD_BRANCHES[building.branch].name : GUARD_BUILDINGS[building.type].name)
      : (building.path ? TOWERS[building.type].paths[building.path].name : TOWERS[building.type].name);
    notify(path ? "已专精为" + name : `${name}升至 ${building.tier} 级`);
    audio.play("upgrade");
    // Refresh the menu in place so multi-tier upgrades and newly unlocked priority controls are one tap away.
    renderMenu();
    sync();
  }
  function callEntry(entry: Entry) {
    const result = game.release(entry.id, true);
    if (!result) return;
    closeMenu();
    notify(entry.label + "提前出怪 · +" + result.bonus + " 金币");
    audio.play("dispatch");
    sync();
  }
  function togglePause() {
    if (!running || !foreground || game.ended) return;
    game.paused = !game.paused;
    resetFrameTime();
    audio.setAmbiencePaused(game.paused);
    if (game.paused) audio.suspend();
    else void audio.resume().catch(() => {});
    sync();
  }
  function reset() {
    devices?.cancel();
    if (!running) return;
    for (const id of [
      "restart-dialog",
      "result-dialog",
      "journal-dialog",
      "route-dialog",
    ] as const)
      if ($(id).open) $(id).close();
    closeMenu();
    viewport.reset();
    game.reset();
    syncBossMusic(null);
    audio.setAmbiencePaused(false);
    if (foreground) void audio.resume().catch(() => {});
    readDiscoveries.clear();
    shownGold = shownWave = undefined;
    shownWeather = undefined;
    rewards.replaceChildren();
    showRanges = false;
    $("range-scout").setAttribute("aria-pressed", "false");
    for (const reaction of scenery) {
      reaction.at = -Infinity;
      reaction.lit = false;
    }
    speed = 1;
    resetFrameTime();
    resultShown = false;
    clearTimeout(flashTimer);
    $("notice").hidden = true;
    sync();
  }

  function place(element: HTMLElement, x: number, y: number) {
    element.style.left = ((x + 0.5) / game.level.width) * 100 + "%";
    element.style.top = ((y + 0.5) / game.level.height) * 100 + "%";
  }
  function mountBattleControls() {
    plots = game.level.plots.map(([x, y], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "plot";
      button.setAttribute("aria-controls", "menu");
      button.setAttribute("aria-expanded", "false");
      place(button, x, y);
      let thawedAt = -Infinity;
      button.addEventListener("click", (event) => {
        if (!game.towers.get(index)?.frost) {
          if (performance.now() - thawedAt >= 220) openMenu(index, event.detail === 0);
          return;
        }
        if (game.thawTower(index)) {
          if (!game.towers.get(index)?.frost) thawedAt = performance.now();
          sync();
        }
      });
      $("plots").append(button);
      return button;
    });
    gateButtons = game.level.entries.map((entry) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "gate-marker";
      if (game.level.trackSwitch) {
        marker.classList.add("named-gate");
        marker.textContent = entry.label;
      }
      marker.setAttribute("aria-label", entry.label);
      marker.tabIndex = -1;
      place(marker, ...entry.marker);
      marker.addEventListener("click", () => {
        flashRoute(entry.id);
        callEntry(entry);
      });
      marker.addEventListener("pointerenter", () => flashRoute(entry.id, 1800));
      $("gate-markers").append(marker);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gate-control";
      button.innerHTML =
        '<span class="gate-symbol" aria-hidden="true">' +
        icon(entry.scenery === "arch" ? "arch" : entry.scenery === "landing" ? "water" : "trail") +
        '</span><span class="gate-line">' +
        entry.label +
        '<b></b></span><span class="gate-sub"><span></span><b></b></span>' +
        '<span class="gate-preview"></span>' +
        '<span class="gate-timer" aria-hidden="true" hidden><i></i></span>';
      button.addEventListener("click", () => {
        flashRoute(entry.id);
        if (button.classList.contains("dispatchable")) callEntry(entry);
      });
      button.addEventListener("pointerenter", () => flashRoute(entry.id, 1800));
      button.addEventListener("focus", () => flashRoute(entry.id, 2200));
      $("gate-controls").append(button);
      return {
        entry,
        marker,
        button,
        clock: requiredChild(button, ".gate-line b"),
        sub: requiredChild(button, ".gate-sub span"),
        bonus: requiredChild(button, ".gate-sub b"),
        preview: requiredChild(button, ".gate-preview"),
        timer: requiredChild(button, ".gate-timer"),
        key: null,
      };
    });
  }
  function updateGates() {
    const manual = game.awaitingFirstWave;
    $("gate-controls").hidden = false;
    for (const binding of gateButtons) {
      const { entry, marker, button, clock, sub, bonus, preview, timer } = binding;
      button.hidden = marker.hidden = !game.entryVisible(entry);
      if (button.hidden) continue;
      const schedule = game.pending.get(entry.id);
      const pending = Boolean(schedule) && !game.ended;
      timer.hidden = !pending || manual;
      if (!timer.hidden && schedule) {
        const fullTime = game.level.wavePrep + entry.delay;
        const remaining = Math.max(0, Math.min(1, (schedule.at - game.time) / Math.max(fullTime, .01)));
        timer.style.setProperty("--gate-fill", (remaining * 100).toFixed(1) + "%");
      }
      timer.classList.toggle("last", game.waveIndex === game.level.waves.length - 1);
      timer.classList.toggle("paused", game.paused);
      const assigned =
        game.level.waves[game.waveIndex].groups[entry.id]?.length;
      const active = game.phase === "active" && assigned && !pending;
      const seconds = pending ? game.seconds(entry.id) : 0;
      const reward = pending ? game.reward(entry.id) : 0;
      const holding = game.tutorialHold;
      const deployment = game.deployment(entry.id);
      const key = [
        pending,
        active,
        seconds,
        reward,
        game.paused,
        game.ended,
        holding,
        manual,
        deployment?.batch,
        deployment?.remaining,
        game.waveIndex,
      ].join("/");
      if (key === binding.key) continue;
      binding.key = key;
      const previewText = pending || manual ? entryPreviewText(entry.id) : "";
      preview.textContent = previewText;
      preview.hidden = !previewText;
      const dispatchable = pending && !game.paused && !manual;
      marker.disabled = !dispatchable;
      button.disabled = game.ended;
      button.setAttribute("aria-disabled", String(!dispatchable));
      button.classList.toggle("dispatchable", dispatchable);
      button.classList.toggle("deploying", Boolean(active && deployment?.remaining));
      clock.textContent = manual
        ? ""
        : pending
          ? Math.floor(seconds / 60) +
            ":" +
            String(seconds % 60).padStart(2, "0")
          : "";
      sub.textContent = holding
        ? "先建塔"
        : manual
          ? "首波待命"
          : pending
            ? "提前出怪"
            : game.ended
              ? "战斗结束"
              : !active
                ? "本波无敌人"
                : !deployment?.remaining
                  ? "全部入场"
                  : deployment.batch
                    ? "第 " +
                      deployment.batch +
                      " / " +
                      deployment.batches +
                      " 批"
                    : "首批将至";
      bonus.innerHTML = pending && !manual ? icon("coin") + "+" + reward : "";
      const rewardLabel = pending && !manual ? `奖励 ${reward} 金币` : "";
      button.setAttribute(
        "aria-label",
        [entry.label, clock.textContent, sub.textContent, rewardLabel].filter(Boolean).join("，"),
      );
      button.title = marker.title =
        pending && !manual
          ? entry.label + " · 提前出怪 +" + reward + " 金币"
          : entry.label;
    }
    $("gate-controls").classList.toggle("single", gateButtons.filter(({ button }) => !button.hidden).length === 1);
  }
  function optionButton({
    name,
    detail,
    cost,
    type,
    path,
    guardArt,
    action,
  }: MenuOption) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.dataset.cost = String(cost);
    if (type) {
      if (path) button.dataset.specialization = path;
      else button.dataset.building = type;
      const color = isGuardPostId(type) ? GUARD_BUILDINGS[type].color : path ? TOWERS[type].paths[path].color : TOWERS[type].color;
      button.style.setProperty("--tower-color", color);
    }
    button.innerHTML =
      (type || guardArt
        ? '<span class="sprite"><canvas width="56" height="56" aria-hidden="true"></canvas></span>'
        : '<span class="branch-icon">' + icon("upgrade") + "</span>") +
      "<span><strong>" +
      name + (type && !path && game.level.tutorial ? "<em>推荐</em>" : "") +
      "</strong><small>" +
      detail +
      '<span class="shortfall" hidden> · 金币不足</span></small></span><span class="cost" aria-label="' +
      cost +
      ' 金币">' +
      icon("coin") +
      cost +
      "</span>";
    const style = game.level.towerStyle;
    if (type && !isGuardPostId(type)) towerIcon(requiredChild<HTMLCanvasElement>(button, "canvas"), type, path, style);
    if (guardArt) guardPostIcon(requiredChild<HTMLCanvasElement>(button, "canvas"),
      guardArt.tier, guardArt.type, style, guardArt.mastery);
    if (type && !path) {
      button.addEventListener("pointerenter", () => {
        hoveredType = type;
      });
      button.addEventListener("pointerleave", () => {
        hoveredType = null;
      });
      button.addEventListener("focus", () => {
        hoveredType = type;
      });
      button.addEventListener("blur", () => {
        hoveredType = null;
      });
    }
    button.addEventListener("click", action);
    return button;
  }
  function syncMenu() {
    if (selected === null) return;
    const post = game.guardPosts.get(selected);
    const suggested = tutorialMarker() !== null ? game.level.tutorial?.towers[game.waveIndex] : undefined;
    const stock = menu.querySelector(".guard-stock");
    if (stock && post) {
      const available = post.guards.filter((guard) => guard.hp > 0 && !guard.switchDuty).length;
      stock.textContent = available + " / " + post.guards.length + (post === game.switchPost ? " · 1 名值勤" : "");
    }
    const growth = menu.querySelector(".griffin-growth");
    const recruit = post?.guards.find((guard) => guard.recruit);
    if (growth && post && recruit?.recruit) {
      const completed = game.wave - Number(game.phase === "active");
      const remaining = Math.min(2, recruit.recruit.adultAfter - completed);
      const stats = guardUnitStats(post, recruit);
      const stage = recruit.recruit.grown ? "育成狮鹫" : `幼年狮鹫 · 再完成 ${remaining} 波成年`;
      const label = `${stage} · ${stats.health} 生命 · ${stats.damage} 伤害`;
      if (growth.textContent !== label) growth.textContent = label;
    }
    const sale = menu.querySelector<HTMLButtonElement>(".sell-tower");
    if (sale) {
      sale.disabled = Boolean(post && post === game.switchPost);
      sale.title = sale.disabled ? "值勤兔卫归队后可出售" : "";
    }
    for (const button of menu.querySelectorAll<HTMLButtonElement>(".choice[data-cost]")) {
      const affordable = game.gold >= Number(button.dataset.cost);
      button.disabled = !affordable;
      requiredChild(button, ".shortfall").hidden = affordable;
      button.classList.toggle("suggested", suggested !== undefined && button.dataset.building === suggested);
    }
  }
  function renderMenu() {
    if (selected === null) return;
    const building = game.buildingAt(selected);
    const maxTier = game.maxTowerTier;
    const content = $("menu-content");
    content.replaceChildren();
    const choices = document.createElement("div");
    choices.className = "choices";
    if (building && isGuardPost(building)) {
      const guardPost = building;
      const spec = GUARD_BUILDINGS[guardPost.type];
      const branch = guardPost.branch;
      const current = guardStats(guardPost);
      $("menu-title").innerHTML = `${current.name ?? spec.name} <small>${guardPost.tier} / ${game.maxGuardTier} 级</small>`;
      const stats = document.createElement("div");
      stats.className = "statline guard-stats";
      stats.innerHTML = `<span>${spec.unit} <b class="guard-stock"></b> · 补员 <b>${current.respawn}</b> 秒</span>
        <span>布防 <b>${current.reach}</b> 格 · 寻敌 <b>${current.aggro}</b> 格</span>
        <span>生命 <b>${current.health}</b> · 伤害 <b>${current.damage}</b> · 脱战回血</span>`;
      if (current.brace) {
        const brace = document.createElement("span");
        brace.textContent = `接战 ${current.brace.contact} 秒可立桨 · 冷却 ${current.brace.cooldown} 秒`;
        stats.append(brace);
        if (current.detail && guardPost.tier === 4) {
          const mastery = document.createElement("span");
          mastery.textContent = current.detail;
          stats.append(mastery);
        }
      }
      if (branch === "wingpair") {
        const growth = document.createElement("span");
        growth.className = "griffin-growth";
        stats.append(growth);
      }
      if (branch === "spear") {
        const ranged = document.createElement("span");
        ranged.textContent = `投枪可对空 · ${SPEAR_THROW.damage} 伤 · ${SPEAR_THROW.range} 格 · ${SPEAR_THROW.interval} 秒/次`;
        stats.append(ranged);
      }
      content.append(stats);
      const move = document.createElement("button");
      move.type = "button";
      move.className = "choice guard-move";
      move.innerHTML = `<span class="branch-icon">${icon("flag")}</span><strong>调整布防</strong>`;
      move.addEventListener("click", () => chooseRally(guardPost.index));
      choices.append(move);
      if (guardPost.tier === 1) choices.append(optionButton({
        name: "升至 2 级",
        detail: `${spec.unit} ×${spec.upgrade.squad} · ${spec.upgrade.health} 生命 · ${spec.upgrade.damage} 伤害`,
        cost: spec.upgrade.cost,
        guardArt: { type: guardPost.type, tier: 2 },
        action: () => chooseUpgrade(),
      }));
      if (guardPost.tier === 2 && game.maxGuardTier >= 3) {
        for (const path of spec.branches) {
          const choice = optionButton({ ...GUARD_BRANCHES[path], guardArt: { type: guardPost.type, tier: path },
            action: () => chooseUpgrade(path) });
          choice.dataset.guardBranch = path;
          choices.append(choice);
        }
      } else if (guardPost.tier === 2) {
        const detail = document.createElement("p");
        detail.textContent = "兔卫专精从第 6 关开放。";
        content.append(detail);
      } else if (guardPost.tier === 3 && branch && game.maxGuardTier === 4) {
        const mastery = GUARD_MASTERIES[branch];
        choices.append(optionButton({
          name: guardPost.type === "reed-post" ? mastery.name ?? "升至 4 级" : "升至 4 级",
          detail: (guardPost.type === "reed-post" ? mastery.detail : undefined) ??
            `${mastery.health} 生命 · ${mastery.damage} 伤害 · ${mastery.reach} 格布防`,
          cost: mastery.cost,
          guardArt: { type: guardPost.type, tier: branch, mastery: true },
          action: () => chooseUpgrade(),
        }));
      }
    } else if (!building) {
      $("menu-title").textContent = "建造防御";
      const options = game.buildOptions(selected);
      if (!options.length) {
        const detail = document.createElement("p");
        detail.textContent = "派兵炮塔须建在可到达道路的地块。";
        content.append(detail);
      }
      for (const type of options) {
        if (isGuardPostId(type)) {
          const spec = GUARD_BUILDINGS[type];
          choices.append(optionButton({
            name: spec.name,
            detail: spec.role,
            cost: spec.base.cost,
            type,
            guardArt: { type, tier: 1 },
            action: () => chooseBuild(type),
          }));
          continue;
        }
        const candidate = TOWERS[type];
        const { cost } = candidate.tiers[0];
        choices.append(
          optionButton({
            name: candidate.name,
            detail: candidate.role,
            cost,
            type,
            action: () => chooseBuild(type),
          }),
        );
      }
    } else {
      const tower = building;
      const spec = TOWERS[tower.type];
      const stats = towerStats(tower);
      const label = tower.path ? spec.paths[tower.path].name : spec.name;
      $("menu-title").innerHTML =
        label + ` <small>${tower.tier} / ${maxTier} 级</small>`;
      const statline = document.createElement("div");
      statline.className = "statline stat-grid";
      statline.innerHTML =
        "<span class=\"stat-cell\"><small>伤害</small><b>" +
        stats.damage +
        "</b></span><span class=\"stat-cell\"><small>射程</small><b>" +
        stats.range +
        "格</b></span><span class=\"stat-cell\"><small>间隔</small><b>" +
        stats.interval +
        "s</b></span>";
      if (stats.net) {
        const netTime = document.createElement("span");
        netTime.className = "stat-note";
        netTime.textContent = `捕网冷却 ${stats.net.cooldown}s · 落地 ${stats.net.seconds}s · 免疫 ${NET_IMMUNITY}s`;
        statline.append(netTime);
      }
      if (stats.focus) {
        const focusTime = document.createElement("span");
        focusTime.className = "stat-note";
        focusTime.textContent = `照射 ${stats.focus.seconds}s 蓄满 · 伤害 +${Math.round(stats.focus.bonus * 100)}%`;
        statline.append(focusTime);
      }
      content.append(statline);
      if (supportsTargetPriority(tower)) {
        const PRIORITY_OPTIONS: readonly [TargetPriority, string][] = [
          ["first", "最前"],
          ["strong", "高血"],
          ["weak", "低血"],
        ];
        const box = document.createElement("div");
        box.className = "priority-box";
        const heading = document.createElement("span");
        heading.className = "menu-section-label";
        heading.innerHTML = `${icon("range")}索敌策略`;
        const bar = document.createElement("div");
        bar.className = "priority-bar";
        bar.setAttribute("role", "group");
        bar.setAttribute("aria-label", "索敌策略");
        const current = tower.priority ?? "first";
        const buttons: HTMLButtonElement[] = [];
        for (const [mode, labelText] of PRIORITY_OPTIONS) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "priority-pill";
          btn.dataset.priority = mode;
          btn.setAttribute("aria-pressed", String(current === mode));
          btn.textContent = labelText;
          btn.addEventListener("click", () => {
            if (selected === null) return;
            const applied = game.setTowerPriority(selected, mode);
            if (!applied) return;
            for (const other of buttons) {
              other.setAttribute("aria-pressed", String(other.dataset.priority === applied));
            }
            audio.play("interact");
            sync();
          });
          buttons.push(btn);
          bar.append(btn);
        }
        box.append(heading, bar);
        content.append(box);
      }
      if (maxTier === 1) {
        const detail = document.createElement("p");
        detail.textContent = spec.role + " · 本关练习布防与塔型搭配。";
        content.append(detail);
      } else if (tower.tier >= maxTier) {
        const detail = document.createElement("p");
        detail.className = "specialized";
        detail.textContent = tower.path
          ? spec.paths[tower.path].detail + " · 已满级"
          : `已达本关 ${maxTier} 级上限。四级专精从第 6 关开放。`;
        content.append(detail);
      } else if (tower.tier === 1 || tower.tier === 2) {
        const next = spec.tiers[tower.tier];
        const parts = [`伤害 ${stats.damage}→${next.damage}`];
        if (next.range !== stats.range) parts.push(`射程 ${stats.range}→${next.range}`);
        if (next.interval !== stats.interval) parts.push(`间隔 ${stats.interval}→${next.interval}s`);
        choices.append(
          optionButton({
            name: `升至 ${tower.tier + 1} 级`,
            detail: parts.join(" · "),
            cost: next.cost,
            action: () => chooseUpgrade(),
          }),
        );
      } else {
        const instruction = document.createElement("p");
        instruction.textContent = "选择一条专精，升至 4 级";
        content.append(instruction);
        for (const [id, path] of Object.entries(spec.paths)) {
          choices.append(
            optionButton({
              name: path.name,
              detail: `${path.detail} · ${path.range} 格 / ${path.interval} 秒`,
              cost: path.cost,
              type: tower.type,
              path: id,
              action: () => chooseUpgrade(id),
            }),
          );
        }
      }
    }
    if (choices.childElementCount) content.append(choices);
    const saleValue = game.towerSaleValue(selected);
    if (saleValue !== null) {
      const sell = document.createElement("button");
      sell.type = "button";
      sell.className = "sell-tower";
      const label = "出售建筑";
      sell.innerHTML = `<span>${label}<small>返还 ${TOWER_RESALE_PERCENT}%</small></span>
        <b>${icon("coin")}+${saleValue}</b>`;
      sell.setAttribute("aria-label", `${label}，获得 ${saleValue} 金币`);
      sell.addEventListener("click", () => {
        if (selected === null) return;
        const proceeds = game.sell(selected);
        if (proceeds === null) return;
        closeMenu(true);
        notify("建筑已售出 · +" + proceeds + " 金币");
        audio.play("interact");
        sync(true);
      });
      content.append(sell);
    }
    syncMenu();
  }
  function localDiscoveries() {
    return [...game.encountered].filter((type) => introductions.has(type));
  }
  function journalEntries() {
    const encountered = [...game.encountered];
    return [
      ...encountered.filter((type) => introductions.has(type)),
      ...encountered.filter((type) => !introductions.has(type)),
    ];
  }

  function updateRoster() {
    const discoveries = localDiscoveries();
    const unread = discoveries.filter((type) => !readDiscoveries.has(type)).length;
    $("wave-roster").hidden = game.ended || unread === 0;
    const label = unread ? `怪物图鉴 · ${unread} 种未读` : "怪物图鉴";
    $("journal").title = label;
    $("journal").setAttribute("aria-label", label);
  }
  function updateBoss() {
    const boss = game.enemies.find(
      (enemy) => ENEMIES[enemy.type].boss && !enemy.escaped,
    );
    const bossTheme = boss && !game.ended ? (BOSS_MUSIC_THEMES[boss.type] ?? null) : null;
    syncBossMusic(bossTheme);
    const percent =
      boss && !game.ended
        ? Math.max(1, Math.ceil((boss.hp * 100) / boss.maxHp))
        : null;
    let state = "突围即败";
    if (boss?.type === "chief") {
      if (boss.melee?.style === "cleave" && game.time < boss.melee.impact) state = "举槌 · 撤开";
      else if (boss.action?.phase === "exposed") state = "晶核暴露";
    } else if (boss?.type === "frost-moose") {
      if (boss.melee?.style === "antler-sweep" && game.time < boss.melee.impact) state = "低头蓄力 · 撤开";
      else if (boss.action?.phase === "windup") state = "鹿角蓄霜 · 即将冻塔";
      else if ([...game.towers.values()].some(({ frost }) => frost)) state = "炮塔冰封 · 连点破冰";
    }
    if (boss?.type === "sluice-dragon") {
      const phase = mireBossState(boss);
      state = phase === "windup" ? "抬闸蓄潮 · 撤出预警带"
        : phase === "open" ? "闸背敞开 · 集中火力"
        : boss.mireFractured ? "溃口并流 · 注意两路" : "闸背闭合 · 突围即败";
    }
    if (boss?.type === "mire-matriarch") {
      const supplied = mireBloomSupply(boss, game.enemies).length;
      state = boss.mireCast ? "腐冠鼓囊 · 孢囊将破土"
        : supplied ? `孢囊供养 ×${supplied} · 优先破囊` : "供养断绝 · 集火毒母";
    }
    const status = boss?.type + "/" + percent + "/" + state;
    if (status === bossStatus) return;
    bossStatus = status;
    $("boss-bar").hidden = percent === null;
    $("battle-space").classList.toggle("has-boss", percent !== null);
    if (!boss || percent === null) return;
    $("boss-name").textContent = ENEMIES[boss.type].name;
    $("boss-state").textContent = state;
    $("boss-percent").textContent = percent + "%";
    $("boss-fill").style.width = percent + "%";
    $("boss-bar").setAttribute("aria-valuenow", String(percent));
  }
  function buildJournal(visible: readonly EnemyId[]) {
    const list = $("journal-list");
    list.replaceChildren();
    $("journal-empty").hidden = visible.length > 0;
    $("journal-count").textContent = visible.length
      ? "本关已遭遇 " + visible.length + " 种怪物"
      : "";
    for (const type of visible) {
      const enemy = ENEMIES[type];
      const tags: string[] = [];
      if (enemy.boss) tags.push("大领主");
      else if (enemy.miniboss) tags.push("小领主");
      else if (enemy.hp >= 220) tags.push("高生命");
      else if (enemy.hp >= 110) tags.push("中生命");
      else tags.push("轻型");
      if (type === "spider-egg") tags.push("可摧毁卵囊");
      else if (type === "spore-pod") tags.push("可摧毁孢囊");
      else tags.push(enemy.speed >= 2.1 ? "极快" : enemy.speed >= 1.45 ? "较快" : enemy.speed >= 1.0 ? "适中" : "缓慢");
      if (enemy.armored) tags.push("重甲");
      if (enemy.slowResistance) tags.push("抗寒");
      if (enemy.regeneration) tags.push("自愈");
      const entry = document.createElement("article");
      entry.className = "journal-entry";
      entry.innerHTML =
        '<canvas width="62" height="54" aria-hidden="true"></canvas><div><h3>' +
        enemy.name +
        (introductions.has(type) ? ' <span class="new-label">新遇</span>' : "") +
        (enemy.airborne ? ' <span class="airborne-label">飞行</span>' :
          enemy.ability?.kind === "wing-cycle" ? ' <span class="airborne-label">间歇飞行</span>' : "") +
        "</h3><p>" +
        enemy.note +
        "</p><small>" +
        tags.join(" · ") +
        "</small></div>";
      spriteIcon(requiredChild<HTMLCanvasElement>(entry, "canvas"), type);
      list.append(entry);
    }
  }
  function tutorialTip() {
    const lesson = game.level.tutorial;
    if (!lesson) return "";
    const index = game.waveIndex;
    if (game.tutorialHold) return "点路旁的＋，在弯道旁建一座弩箭塔。";
    if (index === 0 && game.towers.size)
      return game.pending.size
        ? "准备好了就开战。点已建的塔可以折价出售。"
        : "塔会自动攻击范围内的怪物，击败怪物可得金币。";
    if (
      index > 0 &&
      Array.from(game.towers.values()).some(
        (tower) => tower.type === lesson.towers[index],
      )
    ) {
      return index === 1
        ? "冰晶塔会减慢敌人。试着让它的射程和弩箭塔重叠。"
        : "火炮负责成群的敌人，弩箭和冰晶塔接住跑得快的。";
    }
    return lesson.steps[index];
  }
  function tutorialMarker() {
    const lesson = game.level.tutorial;
    if (!lesson || game.ended || game.phase !== "ready") return null;
    const index = game.waveIndex;
    if (index === 0) return game.tutorialHold ? lesson.plots[0] : null;
    if (
      Array.from(game.towers.values()).some(
        (tower) => tower.type === lesson.towers[index],
      )
    )
      return null;
    const suggested = lesson.plots[index];
    if (!game.towers.has(suggested)) return suggested;
    const free = game.level.plots.findIndex((_, i) => !game.towers.has(i));
    return free >= 0 ? free : null;
  }
  function trackSwitchTip() {
    if (!game.level.trackSwitch || game.phase !== "ready") return "";
    if (!game.trackPending) return "南侧运渣口本波待命。先守总矿口和北侧风井。";
    if (game.awaitingFirstWave || game.wave === 2) {
      if (!game.loadout.includes("guard-post")) return "编队需带兔卫岗哨才能为运渣口换轨。";
      if (game.switchPost) return "运渣口调度后锁轨，值勤兔卫稍后归队。";
      return game.switchCandidate()
        ? "运渣口即将出怪，点道岔可换轨。"
        : "运渣口即将出怪，在标记地块建兔卫岗哨可换轨。";
    }
    const groups = Object.values(game.level.waves[game.waveIndex].groups).flat();
    const enemies = new Set(groups.flatMap(([members]) => typeof members === "string" ? [members] : members));
    return enemies.size ? "下一波 · " + [...enemies].map((type) => ENEMIES[type].name).join("、") : "";
  }
  function showGoldGain(amount: number, resale: boolean) {
    if (reducedMotion.matches) return;
    if (rewards.childElementCount >= 4) rewards.firstElementChild?.remove();
    const gain = document.createElement("span");
    gain.className = "gold-gain" + (resale ? " resale" : "");
    gain.textContent = "+" + amount;
    gain.addEventListener("animationend", () => gain.remove(), { once: true });
    rewards.append(gain);
  }

  function sync(resale = false) {
    revision = game.revision;
    const weatherId = weatherAtWave(weather, game.wave);
    const weatherPreset: WeatherPreset = WEATHER[weatherId];
    const indicator = $("battle-weather");
    if (shownWeather !== weatherId) {
      indicator.textContent = weatherPreset.label;
      indicator.title = weatherPreset.label + " · " + weatherPreset.desc +
        (weatherPreset.effectSummary ? `（${weatherPreset.effectSummary}）` : "");
      indicator.dataset.severity = weatherPreset.severity;
      indicator.style.setProperty("--weather-accent", weatherPreset.accent);
      game.applyWeather(weatherPreset);
      if (shownWeather !== undefined) {
        if (weatherPreset.cue) audio.playWeather(weatherPreset.cue);
        if (weatherPreset.severity === "severe" && weatherPreset.effectSummary)
          notify(`${weatherPreset.label} · ${weatherPreset.effectSummary}`, false, true);
      }
      shownWeather = weatherId;
    }
    const gain = game.gold - (shownGold ?? game.gold);
    if (gain > 0) showGoldGain(gain, resale);
    if (shownGold !== game.gold) $("gold").textContent = String(game.gold);
    shownGold = game.gold;
    $("health").innerHTML =
      game.health + "<span>/" + game.level.health + "</span>";
    const waveNumber = Math.min(game.waveIndex + 1, game.level.waves.length);
    if (shownWave !== waveNumber) {
      const number = document.createElement("strong");
      number.textContent = String(waveNumber);
      if (shownWave !== undefined) number.className = "wave-bump";
      const total = document.createElement("span");
      total.textContent = " / " + game.level.waves.length;
      $("wave").replaceChildren(number, total);
      shownWave = waveNumber;
    }
    $("kills").textContent = String(game.kills);
    $("wave-pips").querySelectorAll("i").forEach((pip, index) => {
      pip.classList.toggle("passed", index < game.waveIndex || game.phase === "won");
      pip.classList.toggle("current", !game.ended && index === game.waveIndex);
    });
    const current = game.level.waves[game.waveIndex];
    updateRoster();
    updateBoss();
    const won = game.phase === "won";
    const defeatTitle = game.breachingBoss ? "防线被突破" : "核心失守";
    $("battle-title").textContent = game.ended
      ? won
        ? "水晶守住了"
        : defeatTitle
      : game.paused
        ? "战斗暂停"
        : current.title;
    const tip = $("battle-tip");
    const hasFrozenTower = [...game.towers.values()].some(({ frost }) => frost);
    if (selected !== null && game.towers.get(selected)?.frost) closeMenu();
    tip.textContent = game.ended || game.paused ? "" : hasFrozenTower
      ? `连点冰封的炮塔 ${FROST_THAW_TAPS} 次，敲碎冰层。`
      : tutorialTip() || trackSwitchTip() ||
      (game.awaitingFirstWave || !game.hasBuildings
        ? (game.level.devices?.length ? "点＋布防，开战后可使用地图机关。"
          : game.loadout.some(isGuardPostId) ? "点＋建造炮塔。派兵炮塔须靠近道路。" : "点路旁的＋建造炮塔。")
        : "");
    tip.hidden = !tip.textContent;
    const pause = $("pause");
    const pauseLabel = game.paused ? "继续" : "暂停";
    pause.disabled = game.ended;
    pause.innerHTML = icon(game.paused ? "play" : "pause");
    pause.setAttribute("aria-label", pauseLabel);
    pause.title = `${pauseLabel}（P）`;
    $("speed-value").textContent = speed + "×";
    $("speed").dataset.fast = String(speed > 1);
    const healthScore = $("health").closest(".score");
    if (healthScore) healthScore.classList.toggle("low", game.health <= Math.ceil(game.level.health * 0.35));
    const training = tutorialMarker();
    plots.forEach((button, index) => {
      const building = game.buildingAt(index);
      const frost = game.towers.get(index)?.frost;
      const trackSite = !building && game.trackPending && !game.trackLocked && !game.switchPost &&
        game.loadout.includes("guard-post") && game.isNearTrackSwitch(game.level.plots[index]) &&
        game.guardPoints(index).length > 0;
      button.classList.toggle("track-crew-plot", trackSite);
      button.classList.toggle("empty", !building);
      let label = "空地 " + (index + 1) + "，建造防御" + (index === training ? "，教学推荐" : "");
      if (trackSite) label += "，可建道岔值勤岗哨";
      if (building && isGuardPost(building)) {
        const name = building.branch ? GUARD_BRANCHES[building.branch].name : GUARD_BUILDINGS[building.type].name;
        label = name + " " + building.tier + " 级，查看建筑";
      } else if (building) {
        const spec = TOWERS[building.type];
        const name = building.path ? spec.paths[building.path].name : spec.name;
        label = frost ? `冰封的${name} ${building.tier} 级，连点破冰，还需 ${FROST_THAW_TAPS - frost.taps} 次`
          : name + " " + building.tier + " 级，查看建筑";
      }
      if (frost) button.dataset.thaw = `${frost.taps}/${FROST_THAW_TAPS}`;
      else delete button.dataset.thaw;
      button.setAttribute("aria-label", label);
      button.disabled = game.ended || (Boolean(frost) && game.paused);
    });
    updateGates();
    devices?.sync();
    const start = $("start-first-wave");
    start.hidden = !game.awaitingFirstWave;
    start.disabled = game.paused;
    $("first-action-icon").innerHTML = icon(game.tutorialHold ? "hammer" : "play");
    $("first-action-label").textContent = game.tutorialHold ? "建造第一座塔" : "开始第 1 波";
    if (game.ended && !resultShown) {
      resultShown = true;
      closeMenu();
      $("restart-dialog").close();
      const stars = won ? rateBattle(game.level, game.health) : 0;
      analytics.logEvent("stage_result", {
        stage_id: game.level.id, chapter: game.level.chapter, biome: game.level.biome ?? "unknown",
        weather: weatherAtWave(weather, game.wave) ?? weather.initial, result: won ? "win" : "loss",
        stars, health: game.health, wave: game.wave,
        duration_seconds: Math.max(0, Math.round((performance.now() - stageStartedAt) / 1000)),
      });
      if (stars) {
        save.recordClear(game.level.id, stars);
        onStageCleared?.(game.level.id);
      }
      $("result-stars").hidden = !stars;
      $("result-stars").textContent = stars ? starsText(stars) : "";
      $("result-stars").setAttribute("aria-label", won ? stars + " 星" : "");
      $("result-art").src = $("battle-art").toDataURL();
      const next = nextPlayable();
      $("result-next").hidden = !won || !next;
      if (next) $("result-next").textContent = "下一站 · " + next.level!.name;
      $("replay").className = won ? "dialog-secondary" : "action";
      $("result-route").className = won && !next ? "action" : "dialog-secondary";
      $("replay").textContent = won ? "再玩一次" : "重试关卡";
      $("result-title").textContent = won
        ? game.level.tutorial
          ? "林场初哨 · 教学完成"
          : "守卫成功"
        : defeatTitle;
      $("result-summary").textContent =
        game.breachingBoss
          ? ENEMIES[game.breachingBoss].name + "已突破防线，本局结束。"
          : `第 ${game.wave} 波 · 击败 ${game.kills} 个敌人 · 核心生命 ${game.health}`;
      $("result-dialog").showModal();
      (won ? (next ? $("result-next") : $("result-route")) : $("replay")).focus({ preventScroll: true });
      if (won) audio.play("victory");
    }
    syncMenu();
  }

  function draw() {
    if (highlightEntry && performance.now() > highlightUntil) highlightEntry = null;
    renderBattle(viewport.view, {
      selected,
      hoveredType,
      training: tutorialMarker(),
      uiTime: lastFrame,
      scenery,
      showRanges,
      guardRange: rallyPost ?? selected,
      highlightEntry,
      devicePreview: devices?.preview,
    });
  }
  function toggleRanges() {
    showRanges = !showRanges;
    $("range-scout").setAttribute("aria-pressed", String(showRanges));
    if (showRanges && !game.hasBuildings) notify("建成后会显示射程和布防范围。");
  }
  function resetFrameTime() {
    lastFrame = 0;
    accumulator = 0;
  }
  function stopAnimation() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    resetFrameTime();
  }
  function materialCue(enemy: EnemyId, airborne = false) {
    if (airborne) return "material-wing" as const;
    const spec = ENEMIES[enemy];
    switch (spec.soundFamily) {
      case "shell": return "material-shell" as const;
      case "stone":
      case "crystal": return "material-armor" as const;
      case "bark": return "material-wood" as const;
      case "ooze":
      case "wisp": return "material-slime" as const;
      case "moth":
      case "wing": return "material-wing" as const;
      case "frog":
      case "weir":
      case "ferry": return "material-water" as const;
      default: return spec.armored ? "material-armor" as const : "material-flesh" as const;
    }
  }
  function startAnimation() {
    if (running && foreground && frameId === null)
      frameId = requestAnimationFrame(frame);
  }
  function playCombatCues() {
    const pan = (x: number) => (x / (game.level.width - 1) - 0.5) * 0.9;
    for (const shot of game.projectiles) {
      if (shot.age < shot.releaseDelay || heard.has(shot)) continue;
      heard.add(shot);
      audio.play(
        shot.kind === "prism" ? "frost-fire"
          : shot.kind === "hail-mortar" ? "hail-fire"
          : shot.kind === "salt-caster" ? "salt-fire"
          : shot.kind === "spore-caster" ? "spore-fire"
          : shot.kind === "glaze-lance" ? "glaze-fire"
          : shot.kind === "guard-spear" || shot.kind === "net" || shot.kind === "net-capture" ? "arrow-fire"
          : `${shot.kind}-fire`,
        pan(shot.x),
      );
    }
    for (const effect of game.effects) {
      if (heard.has(effect)) continue;
      heard.add(effect);
      switch (effect.kind) {
        case "breach":
          audio.play(game.breachingBoss ? "boss-breach" : "breach");
          break;
        case "enemy-rally":
          if (effect.enemy === "pine-boar" || effect.enemy === "frost-yeti")
            audio.playBossSkill("miniboss-enter", pan(effect.x));
          else audio.play("reed-whistle", pan(effect.x));
          break;
        case "enemy-ward": {
          const caster = effect.enemy ? ENEMIES[effect.enemy] : undefined;
          if (caster?.boss || caster?.miniboss) audio.playBossSkill("boss-ward", pan(effect.x));
          else if (effect.enemy === "mire-treant") audio.play("step-bark", pan(effect.x));
          else if (effect.enemy === "mirror-shrimp") audio.play("net-capture", pan(effect.x));
          else if (effect.enemy === "snowbrush-fox") audio.play("step-wing", pan(effect.x));
          else if (effect.enemy === "bloat-sporer") audio.play("poison-burst", pan(effect.x));
          else audio.play("owl-bell", pan(effect.x));
          break;
        }
        case "enemy-windup": {
          const caster = effect.enemy ? ENEMIES[effect.enemy] : undefined;
          if (caster?.boss || caster?.miniboss) audio.playBossSkill("boss-windup", pan(effect.x));
          else audio.play("charge-windup", pan(effect.x));
          break;
        }
        case "enemy-expose":
          audio.play(effect.enemy === "weir-turtle" ? "weir-shell-open"
            : effect.enemy === "guard" ? "shell-crack" : "core-expose", pan(effect.x));
          break;
        case "shell-break":
          audio.play(effect.enemy === "ferry-snail" ? "ferry-shell-break" : "shell-crack", pan(effect.x));
          break;
        case "enemy-needles":
          audio.play("pine-landing", pan(effect.x));
          break;
        case "enemy-splash":
          audio.play("step-frog", pan(effect.x));
          break;
        case "enemy-burrow-in":
        case "enemy-burrow-out":
          audio.play(effect.enemy === "mire-croc" ? "step-frog" : "step-bark", pan(effect.x));
          break;
        case "enemy-vent":
          audio.playBossSkill("miniboss-vent", pan(effect.x));
          break;
        case "enemy-vent-stop":
          audio.play("shell-crack", pan(effect.x));
          break;
        case "enemy-quill-launch":
          audio.play(effect.enemy === "vine-viper" ? "spore-fire" : "frost-fire", pan(effect.x));
          break;
        case "enemy-quill-impact":
          audio.play(effect.enemy === "vine-viper" ? "spore-hit" : "frost-hit", pan(effect.x));
          break;
        case "tower-freeze":
          audio.play("freeze-lock", pan(effect.x));
          break;
        case "tower-crack":
        case "tower-thaw":
          audio.play("ice-shatter", pan(effect.x));
          break;
        case "enemy-step":
          if (effect.enemy) audio.play(`step-${ENEMIES[effect.enemy].soundFamily}`, pan(effect.x));
          break;
        case "guard-hit":
          if (effect.melee && effect.melee !== "surge" && effect.melee !== "quake" && effect.melee !== "antler-sweep") audio.play("melee-impact", pan(effect.x));
          break;
        case "guard-strike":
          audio.play(effect.post === "reed-post" ? "reed-strike"
            : effect.post === "frost-kennel" ? "frost-strike" : "melee-impact", pan(effect.x));
          break;
        case "guard-spear":
        case "net":
          audio.play("arrow-hit", pan(effect.x));
          break;
        case "net-capture":
          audio.play("net-capture", pan(effect.x));
          break;
        case "prism":
          audio.play("frost-hit", pan(effect.x));
          if (effect.enemy) audio.play(materialCue(effect.enemy, effect.airborne), pan(effect.x));
          break;
        case "glaze-lance":
          audio.play("glaze-hit", pan(effect.x));
          if (effect.enemy) audio.play(materialCue(effect.enemy, effect.airborne), pan(effect.x));
          break;
        case "hail-mortar":
          audio.play("hail-hit", pan(effect.x));
          if (effect.enemy) audio.play(materialCue(effect.enemy, effect.airborne), pan(effect.x));
          break;
        case "salt-caster":
          audio.play("salt-hit", pan(effect.x));
          if (effect.enemy) audio.play(materialCue(effect.enemy, effect.airborne), pan(effect.x));
          break;
        case "spore-caster":
          audio.play("spore-hit", pan(effect.x));
          if (effect.enemy) audio.play(materialCue(effect.enemy, effect.airborne), pan(effect.x));
          break;
        case "spore-burst":
          audio.play("poison-burst", pan(effect.x));
          break;
        case "spore-spread":
          audio.play("spore-hit", pan(effect.x));
          break;
        case "burn-ignite":
          audio.play("burn-ignite", pan(effect.x));
          break;
        case "mire-tide-warning":
          audio.playBossSkill("boss-tide-warn", pan(effect.x));
          break;
        case "mire-tide-break":
          audio.playBossSkill("boss-tide-break", pan(effect.x));
          break;
        case "mire-tide":
          audio.playBossSkill("boss-tide-surge", pan(effect.x));
          break;
        case "mire-drag":
          audio.playBossSkill("miniboss-drag", pan(effect.x));
          break;
        case "weir-surge":
          audio.play("weir-surge", pan(effect.x));
          break;
        case "rail-impact":
          audio.play("cannon-hit", pan(effect.x));
          break;
        case "chief-cleave":
          audio.playBossSkill("boss-cleave", pan(effect.x));
          break;
        case "antler-sweep":
          audio.playBossSkill("boss-antler-sweep", pan(effect.x));
          break;
        case "mammoth-quake":
          audio.playBossSkill("miniboss-quake", pan(effect.x));
          break;
        case "mire-blast":
          audio.play("poison-burst", pan(effect.x));
          break;
        case "mire-shell-warning":
          audio.playBossSkill("miniboss-clam-clamp", pan(effect.x));
          break;
        case "mire-shell":
          audio.playBossSkill("miniboss-clam-open", pan(effect.x));
          break;
        case "mire-hatch":
          audio.play("hatch-crack", pan(effect.x));
          break;
        case "mire-summon":
          if (effect.enemy === "mire-elder") audio.play("hatch-crack", pan(effect.x));
          break;
        case "mire-bloom":
          audio.playBossSkill("boss-ward", pan(effect.x));
          break;
        case "mire-bloom-burst":
          audio.play("poison-burst", pan(effect.x));
          break;
        case "mire-brace":
          audio.play("reed-brace", pan(effect.x));
          break;
        case "pop": {
          const fallen = effect.fallen && ENEMIES[effect.fallen.type];
          if (fallen?.boss) audio.play("kill-boss", pan(effect.x));
          else if (fallen?.miniboss) audio.play("kill-big", pan(effect.x));
          else audio.play("kill-small", pan(effect.x));
          break;
        }
        case "enemy-dust":
        case "gate":
        case "build":
          break;
        default:
          audio.play(`${effect.kind}-hit`, pan(effect.x));
          if (effect.enemy) audio.play(materialCue(effect.enemy, effect.airborne), pan(effect.x));
      }
    }
  }
  function frame(timestamp: number) {
    frameId = null;
    if (!running || !foreground) return;
    const delta = Math.min(
      0.075,
      (timestamp - (lastFrame || timestamp)) / 1000,
    );
    lastFrame = timestamp;
    const modalOpen =
      $("settings-dialog").open ||
      $("restart-dialog").open ||
      $("journal-dialog").open ||
      $("exit-dialog").open ||
      $("route-dialog").open;
    const playing = !game.paused && !modalOpen && !game.ended;
    if (playing) {
      accumulator += delta * speed;
      while (accumulator >= 1 / 60) {
        game.tick(1 / 60);
        accumulator -= 1 / 60;
      }
      playCombatCues();
      for (const enemy of game.enemies) {
        const spec = ENEMIES[enemy.type];
        if (spec.boss && !announcedBosses.has(enemy)) {
          announcedBosses.add(enemy);
          audio.play("boss-theme");
        }
        if (!spec.miniboss || announcedMinibosses.has(enemy)) continue;
        announcedMinibosses.add(enemy);
        audio.playBossSkill("miniboss-enter");
        notify(`⚠ 小领主逼近 · ${spec.name}`, false, true);
      }
    }
    if (revision !== game.revision) sync();
    else if (!game.ended) {
      updateGates();
      devices?.sync();
    }
    updateBoss();
    draw();
    startAnimation();
  }
  function stopBattle() {
    running = false;
    activeBossTheme = null;
    closeMenu();
    for (const dialog of document.querySelectorAll<HTMLDialogElement>(
      "dialog[open]",
    ))
      dialog.close();
    stopAnimation();
    audio.setAmbiencePaused(false);
    audio.suspend();
    clearTimeout(flashTimer);
  }
  function exitBattle(id = game.level.id, note = "") {
    stopBattle();
    onExit(id, note);
  }
  function requestMap() {
    if (game.ended || (!game.wave && !game.hasBuildings)) exitBattle();
    else {
      closeMenu();
      $("route-dialog").showModal();
    }
  }
  $("route-home").addEventListener("click", () => {
    $("settings-dialog").close();
    requestMap();
  });
  $("confirm-route").addEventListener("click", () => exitBattle());
  $("result-route").addEventListener("click", () => exitBattle());
  $("result-dialog").addEventListener("close", () => {
    if (running && game.ended) exitBattle();
  });
  function nextPlayable() {
    const current = STAGES.findIndex((stage) => stage.id === game.level.id);
    return STAGES.slice(current + 1).find((stage) => stage.level);
  }
  $("result-next").addEventListener("click", () => {
    const next = nextPlayable();
    if (next) exitBattle(next.id);
  });
  $("journal").addEventListener("click", () => {
    closeMenu();
    const visible = journalEntries();
    buildJournal(visible);
    $("journal-dialog").showModal();
    for (const type of localDiscoveries()) readDiscoveries.add(type);
    updateRoster();
  });
  $("start-first-wave").addEventListener("click", () => {
    if (game.tutorialHold && game.level.tutorial) {
      openMenu(game.level.tutorial.plots[0], true);
      return;
    }
    if (!game.startFirstWave()) return;
    closeMenu();
    notify("第 1 波 · " + game.level.waves[0].title);
    sync();
  });
  $("pause").addEventListener("click", togglePause);
  $("range-scout").addEventListener("click", toggleRanges);
  $("speed").addEventListener("click", () => {
    speed = (speed % 3) + 1;
    sync();
  });
  $("restart").addEventListener("click", () => {
    closeMenu();
    $("settings-dialog").close();
    $("restart-dialog").showModal();
  });
  $("confirm-restart").addEventListener("click", reset);
  $("replay").addEventListener("click", reset);
  $("close-menu").addEventListener("click", () => closeMenu(true));
  function dismissOutside(target: Element) {
    if (running && !target.closest(".device-control,.device-dock-button")) devices?.cancel();
    if ((!rallyLayer.hidden && !target.closest("#guard-rally")) ||
        (selected !== null && !target.closest(".menu,.plot,.battle-actions"))) closeMenu();
  }
  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Element) || event.target.closest("#battle-viewport")) return;
    const onMap = event.target.closest("#battle-space") && !event.target.closest("#battle-settings");
    if (onMap && (event.pointerType === "touch" || viewport.zoomed)) return;
    dismissOutside(event.target);
  });
  $("battle-space").addEventListener("click", (event) => {
    if (event.target instanceof Element && !event.composedPath().includes($("battle-viewport")))
      dismissOutside(event.target);
  });
  document.addEventListener("keydown", (event) => {
    if (
      !running ||
      event.repeat ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      document.querySelector("dialog[open]")
    )
      return;
    if (event.key === "Escape") {
      if (devices?.cancel()) return;
      if (selected !== null || !rallyLayer.hidden) closeMenu(true);
      else if (viewport.zoomed) viewport.reset();
    }
    if (event.key.toLowerCase() === "p") togglePause();
    if (event.key.toLowerCase() === "r") toggleRanges();
    if (event.key.toLowerCase() === "z") viewport.toggle();
  });
  return {
    open,
    stop: stopBattle,
    back() {
      if (!running) return false;
      if (devices?.cancel()) return true;
      if (selected !== null || !rallyLayer.hidden) closeMenu(true);
      else if (viewport.zoomed) viewport.reset();
      else requestMap();
      return true;
    },
    setActive(active: boolean) {
      foreground = active;
      if (!active) {
        stopAnimation();
        audio.setAmbiencePaused(true);
        audio.suspend();
        if (running && !game.ended) {
          game.paused = true;
          sync();
        }
      } else {
        if (running) {
          viewport.refresh();
          draw();
        }
        startAnimation();
      }
    },
  };
}
