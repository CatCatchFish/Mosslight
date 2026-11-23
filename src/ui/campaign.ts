import { CHAPTERS, STAGES } from "../content/campaign.ts";
import type { Stage } from "../content/campaign.ts";
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  WAYPOINTS,
  REGION_SIGNS,
  MAP_LANDMARKS,
  MAP_ANIMALS,
} from "../content/world.ts";
import type { Landmark } from "../content/world.ts";
import type { Level, Point, BuildingId } from "../engine/types.ts";
import type { SaveStore } from "../platform/save.ts";
import {
  makeLandmarkCrop,
  makeTrailScout,
  makeWorldMap,
} from "../render/world.ts";
import { makeAnimalStrip } from "../render/wildlife.ts";
import { drawPostcard } from "../render/postcard.ts";
import { $, revealView } from "./dom.ts";
import { icon } from "./icons.ts";
import { mountLoadout } from "./loadout.ts";
import { starsText } from "./ratings.ts";

export function mountCampaign(
  save: SaveStore,
  onEnter: (level: Level, loadout?: readonly BuildingId[]) => void,
) {
  const playable = STAGES.filter((stage) => stage.level);
  let mapSelection = playable.find((stage) => !save.snapshot.ratings[stage.id]) ?? playable[0];
  const lastStops = new Map<number, Stage>();
  const regionButtons: HTMLButtonElement[] = [];
  const regionLabels: HTMLElement[] = [];
  let visibleRegion = -1;
  const showStageLoadout = mountLoadout(save);
  let campaignNodes: { node: HTMLButtonElement; small: HTMLSpanElement }[] = [];
  let landmarkButtons: { place: Landmark; button: HTMLButtonElement }[] = [];
  let wildlifeTimer: number | undefined;
  let descriptionExpanded = false;
  let descriptionRaf = 0;

  function syncDescriptionToggle() {
    const wrap = $("stage-desc");
    const desc = $("map-description");
    const toggle = $("toggle-description");
    wrap.classList.toggle("expanded", descriptionExpanded);
    toggle.setAttribute("aria-expanded", String(descriptionExpanded));
    toggle.textContent = descriptionExpanded ? "收起 ▴" : "展开 ▾";
    if (descriptionExpanded) {
      toggle.hidden = false;
      wrap.classList.add("expandable");
      return;
    }
    const overflows = desc.clientHeight > 0 && desc.scrollHeight > desc.clientHeight + 1;
    toggle.hidden = !overflows;
    wrap.classList.toggle("expandable", overflows);
  }

  function scheduleDescriptionCheck() {
    cancelAnimationFrame(descriptionRaf);
    syncDescriptionToggle();
    descriptionRaf = requestAnimationFrame(syncDescriptionToggle);
  }
  function drawChapterMap() {
    const canvas = makeWorldMap($("map-surround"));
    $("campaign-map").src = canvas.toDataURL("image/png");
    return canvas;
  }
  function positionWorldItem(item: HTMLElement, [x, y]: Point) {
    item.style.left = (x / WORLD_WIDTH) * 100 + "%";
    item.style.top = (y / WORLD_HEIGHT) * 100 + "%";
  }
  function discoveredCount() {
    return MAP_LANDMARKS.filter((place) =>
      save.snapshot.landmarks.includes(place.id),
    ).length;
  }
  function updateDiscoveries() {
    $("discovery-count").textContent =
      "路标 " + discoveredCount() + " / " + MAP_LANDMARKS.length;
    for (const { place, button } of landmarkButtons) {
      const seen = save.snapshot.landmarks.includes(place.id);
      button.classList.toggle("visited", seen);
      button.setAttribute(
        "aria-label",
        place.name + (seen ? "，已发现" : "，探索路标"),
      );
    }
  }
  function openLandmark(place: Landmark, crop: string) {
    save.discover(place.id);
    updateDiscoveries();
    $("landmark-title").textContent = place.name;
    $("landmark-count").textContent =
      "沿途手记 · 已发现 " + discoveredCount() + " / " + MAP_LANDMARKS.length;
    $("landmark-note").textContent = place.story;
    $("landmark-art").src = crop;
    $("landmark-dialog").showModal();
  }
  function buildLandmarks(map: HTMLCanvasElement) {
    landmarkButtons = MAP_LANDMARKS.map((place) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "landmark-pin";
      button.title = place.name;
      button.innerHTML = icon("lantern");
      positionWorldItem(button, place.pin);
      const crop = makeLandmarkCrop(map, place.anchor);
      button.addEventListener("click", () => openLandmark(place, crop));
      $("landmark-pins").append(button);
      return { place, button };
    });
    updateDiscoveries();
    const points: [string, number, number][] = [
      ["smoke", 49, 169],
      ["smoke", 51, 167],
      ["water", 225, 27],
      ["water", 219, 111],
      ["water", 192, 184],
      ["water", 211, 246],
      ["fly", 18, 185],
      ["fly", 81, 214],
      ["fly", 123, 172],
      ["fly", 262, 201],
      ["fly", 297, 140],
      ["fly", 167, 92],
      ["fly", 114, 111],
      ["flurry", 296, 30],
      ["flurry", 315, 50],
      ["flurry", 367, 39],
      ["flurry", 404, 29],
      ["flurry", 443, 57],
      ["miasma", 42, 92],
      ["miasma", 118, 98],
      ["miasma", 156, 118],
      ["miasma", 172, 34],
    ];
    points.forEach(([kind, x, y], index) => {
      const spark = document.createElement("span");
      spark.className = "map-particle " + kind;
      spark.style.setProperty("--delay", -index * 0.73 + "s");
      positionWorldItem(spark, [x, y]);
      $("map-ambience").append(spark);
    });
    $("scout-art").src = makeTrailScout();
  }
  function buildCampaign() {
    const map = drawChapterMap();
    buildLandmarks(map);
    for (const animal of MAP_ANIMALS) {
      const button = document.createElement("button");
      const sprite = document.createElement("span");
      button.type = "button";
      button.className = "map-animal " + animal.kind;
      button.setAttribute("aria-label", animal.name);
      button.title = animal.name;
      sprite.className = "animal-sprite";
      sprite.style.backgroundImage = `url(${makeAnimalStrip(animal.kind)})`;
      positionWorldItem(button, animal.at);
      button.append(sprite);
      sprite.addEventListener("animationend", (event) => {
        if (event.animationName === "animal-hop") sprite.classList.remove("react");
      });
      button.addEventListener("click", () => {
        const note = $("wildlife-note");
        note.textContent = animal.note;
        note.hidden = false;
        sprite.classList.remove("react");
        void sprite.offsetWidth;
        sprite.classList.add("react");
        clearTimeout(wildlifeTimer);
        wildlifeTimer = window.setTimeout(() => { note.hidden = true; }, 3600);
      });
      $("map-wildlife").append(button);
    }
    CHAPTERS.forEach((chapter, index) => {
      const plaque = document.createElement("span");
      plaque.className = "region-label";
      plaque.innerHTML = icon(chapter.icon) + "<b>" + chapter.name + "</b>";
      plaque.style.setProperty("--region", chapter.color);
      positionWorldItem(plaque, REGION_SIGNS[index]);
      $("region-signs").append(plaque);
      regionLabels.push(plaque);

      const tab = document.createElement("button");
      tab.type = "button";
      tab.innerHTML = icon(chapter.icon) + "<span>" + chapter.short + "</span>";
      tab.setAttribute("aria-label", chapter.name);
      tab.title = chapter.name;
      tab.style.setProperty("--region", chapter.color);
      tab.addEventListener("click", () => {
        const stages = STAGES.filter((stage) => stage.chapter === index);
        selectStage(lastStops.get(index) ?? stages.find((stage) => stage.level) ?? stages[0]);
      });
      $("region-tabs").append(tab);
      regionButtons.push(tab);
    });
    campaignNodes = STAGES.map((stage) => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = "route-node" + (stage.level ? " available" : "");
      node.style.setProperty("--region", CHAPTERS[stage.chapter].color);
      node.textContent = stage.id;
      const small = document.createElement("span");
      small.className = "marker-note";
      small.setAttribute("aria-hidden", "true");
      node.append(small);
      if (stage.level) {
        const stars = document.createElement("span");
        stars.className = "marker-stars";
        stars.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 3; i++) {
          const star = document.createElement("i");
          star.textContent = "★";
          stars.append(star);
        }
        stars.style.setProperty("--spark-delay", -(stage.index * 1.27) + "s");
        node.append(stars);
      } else {
        const question = document.createElement("span");
        question.className = "marker-question";
        question.setAttribute("aria-hidden", "true");
        question.textContent = "?";
        node.append(question);
      }
      positionWorldItem(node, WAYPOINTS[stage.index]);
      node.addEventListener("click", () => selectStage(stage));
      $("map-nodes").append(node);
      return { node, small };
    });
    $("start-level").addEventListener("click", () => {
      const mission = mapSelection.level;
      if (!mission) return;
      const chosen = save.globalLoadout.length
        ? save.globalLoadout
        : save.snapshot.loadouts[mapSelection.id];
      onEnter(mission, chosen);
    });
    const toggleDescription = () => {
      if (!$("stage-desc").classList.contains("expandable")) return;
      descriptionExpanded = !descriptionExpanded;
      syncDescriptionToggle();
    };
    $("toggle-description").addEventListener("click", toggleDescription);
    $("map-description").addEventListener("click", toggleDescription);
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => {
        if (!descriptionExpanded) {
          cancelAnimationFrame(descriptionRaf);
          descriptionRaf = requestAnimationFrame(syncDescriptionToggle);
        }
      }).observe($("map-description"));
    } else {
      window.addEventListener("resize", () => {
        if (!descriptionExpanded) syncDescriptionToggle();
      });
    }
    selectStage(mapSelection);
  }
  function updateRegionStops(stage: Stage) {
    const stops = $("region-stops");
    if (visibleRegion !== stage.chapter) {
      visibleRegion = stage.chapter;
      stops.replaceChildren();
      for (const stop of STAGES.filter((item) => item.chapter === stage.chapter)) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.stage = stop.id;
        button.classList.toggle("available", Boolean(stop.level));
        button.setAttribute("aria-label", `选择第 ${stop.id} 关，${stop.level?.name ?? "未开发"}`);
        button.innerHTML = icon(stop.level ? "flag" : "trail") + "<span>" + stop.id + "</span>";
        button.addEventListener("click", () => selectStage(stop));
        stops.append(button);
      }
    }
    for (const button of stops.querySelectorAll("button")) {
      const id = button.dataset.stage!;
      const rating = button.classList.contains("available") && save.snapshot.ratings[id];
      button.setAttribute("aria-pressed", String(id === stage.id));
      button.classList.toggle("cleared", Boolean(rating));
    }
  }
  function selectStage(stage: Stage, note = "") {
    mapSelection = stage;
    const { id, level, chapter, index } = stage;
    const map = level;
    const region = CHAPTERS[chapter];
    lastStops.set(chapter, stage);
    const view = $("campaign-view");
    view.style.setProperty("--region", region.color);
    view.style.setProperty("--region-surface", region.surface);
    drawPostcard($("stage-art"), chapter, map?.biome, Boolean(map?.bridgeDeck));
    regionButtons.forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === chapter));
      regionLabels[i].classList.toggle("current", i === chapter);
    });
    updateRegionStops(stage);
    showStageLoadout(map ?? null);
    const stars = level ? save.snapshot.ratings[id] ?? 0 : 0;
    campaignNodes.forEach(({ node, small }, i) => {
      const mission = STAGES[i],
        rating = mission.level ? save.snapshot.ratings[mission.id] ?? 0 : 0;
      const name = mission.level?.name ?? "未开发";
      node.title = "第 " + mission.id + " 关 · " + name;
      node.setAttribute(
        "aria-label",
        node.title + (rating ? "，已通关 " + rating + " 星" : ""),
      );
      node.setAttribute("aria-pressed", String(index === i));
      node.classList.toggle("in-region", mission.chapter === chapter);
      node.classList.toggle("cleared", Boolean(rating));
      node.classList.toggle("three-stars", rating === 3);
      small.textContent = rating ? name + " " + starsText(rating) : name;
    });
    $("clear-total").textContent =
      "已通关 " +
      STAGES.filter((stage) => stage.level && save.snapshot.ratings[stage.id])
        .length +
      " 关";
    const [x, y] = WAYPOINTS[index];
    positionWorldItem($("trail-scout"), [x + (x > 390 ? -13 : 10), y - 1]);
    $("map-chapter").textContent = CHAPTERS[chapter].name;
    $("map-mission-status").classList.toggle("open", Boolean(level));
    $("map-mission-status").textContent = level
      ? stars
        ? "已通关"
        : level.tutorial
          ? "入门关卡"
          : "可游玩"
      : "未开发阶段";
    $("stage-number").textContent = id;
    $("map-mission").textContent = map?.name ?? "待探索";
    $("map-mission").parentElement!.setAttribute("aria-label", map ? "第 " + id + " 关 · " + map.name : "第 " + id + " 关");
    descriptionExpanded = false;
    $("map-description").textContent = map?.description ?? region.landscape;
    scheduleDescriptionCheck();
    $("stage-facts").hidden = !map;
    $("stage-waves").textContent = level ? `${level.waves.length} 波` : "";
    $("stage-entries").textContent = map ? `${map.entries.length} 个入口` : "";
    $("start-level").disabled = !map;
    $("start-label").textContent = level
      ? stars
        ? "再次出战"
        : level.tutorial
          ? "进入林场"
          : "进入战场"
      : "暂未开放";
    $("best-rating").textContent = stars ? starsText(stars) : "";
    $("best-rating").setAttribute(
      "aria-label",
      stars ? "最高评级 " + stars + " 星" : "",
    );
    $("travel-note").textContent = note;
    $("travel-note").hidden = !note;
  }

  buildCampaign();
  return {
    open(id = mapSelection.id, note = "") {
      revealView("campaign-view");
      const next = STAGES.find((stage) => stage.id === id) ?? STAGES[0];
      selectStage(next, note);
      campaignNodes[next.index].node.focus({ preventScroll: true });
    },
  };
}
