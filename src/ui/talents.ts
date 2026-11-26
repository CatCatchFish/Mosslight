import {
  spentStars,
  TALENTS,
  totalStarsEarned,
} from "../content/talents.ts";
import type { TalentId } from "../content/talents.ts";
import type { GameAudio } from "../platform/audio.ts";
import type { GameAnalytics } from "../platform/analytics.ts";
import type { SaveStore } from "../platform/save.ts";
import { drawCampLanternCrest, drawTalentIcon } from "../render/talent-art.ts";
import { $ } from "./dom.ts";

const ROMAN = ["I", "II", "III"] as const;

export function mountTalents(save: SaveStore, audio: GameAudio, analytics: GameAnalytics) {
  const trigger = $("open-talents");
  const dialog = $("talents-dialog") as HTMLDialogElement;
  const grid = $("talents-grid");
  const summary = $("talents-stars");
  const resetButton = $("talents-reset") as HTMLButtonElement;
  const crest = $("talents-crest") as HTMLCanvasElement;
  const availablePill = $("talents-available-pill");
  const rankCount = $("talents-rank-count");
  const progressFill = $("talents-progress-fill");

  const maxTotalRanks = TALENTS.reduce((sum, spec) => sum + spec.costs.length, 0);
  let lastUpgraded: TalentId | null = null;

  function starBudget() {
    const earned = totalStarsEarned(save.snapshot.ratings);
    const spent = spentStars(save.snapshot.talents);
    return { earned, spent, available: Math.max(0, earned - spent) };
  }

  function totalLitRanks() {
    let sum = 0;
    for (const spec of TALENTS) sum += save.snapshot.talents[spec.id] ?? 0;
    return sum;
  }

  function updateTrigger() {
    const { earned, available } = starBudget();
    const badge = $("talents-total");
    badge.textContent = available > 0 ? `★${available}` : earned > 0 ? `★0` : "";
    trigger.classList.toggle("has-unspent", available > 0);
  }

  function render() {
    const { earned, spent, available } = starBudget();
    const litRanks = totalLitRanks();
    const current = save.snapshot.talents;

    summary.textContent = `累计星数 ★ ${earned} · 已投入 ★ ${spent}`;
    availablePill.textContent = `★ ${available} 可用`;
    availablePill.classList.toggle("empty", available === 0);
    rankCount.textContent = `已点亮 ${litRanks} / ${maxTotalRanks} 阶`;
    progressFill.style.width = `${Math.round((litRanks / maxTotalRanks) * 100)}%`;
    drawCampLanternCrest(crest, litRanks, maxTotalRanks);

    resetButton.disabled = spent === 0;
    grid.replaceChildren();

    for (const spec of TALENTS) {
      const rank = current[spec.id] ?? 0;
      const maxed = rank >= spec.costs.length;
      const nextCost = maxed ? 0 : spec.costs[rank];
      const canBuy = !maxed && available >= nextCost;

      const card = document.createElement("div");
      card.className =
        "talent-card" +
        (rank > 0 ? " active" : "") +
        (maxed ? " maxed" : "") +
        (canBuy ? " affordable" : "") +
        (lastUpgraded === spec.id ? " just-upgraded" : "");
      card.style.setProperty("--talent-accent", spec.accent);

      // Top row: pixel-art emblem + title/category/desc
      const top = document.createElement("div");
      top.className = "talent-top";

      const iconWrap = document.createElement("div");
      iconWrap.className = "talent-icon-frame";
      const iconCanvas = document.createElement("canvas");
      iconCanvas.width = 48;
      iconCanvas.height = 48;
      iconCanvas.setAttribute("aria-hidden", "true");
      drawTalentIcon(iconCanvas, spec.id, rank);
      const levelTag = document.createElement("span");
      levelTag.className = "talent-level-tag";
      levelTag.textContent = maxed ? "MAX" : `Lv.${rank}`;
      iconWrap.append(iconCanvas, levelTag);

      const info = document.createElement("div");
      info.className = "talent-info";
      const head = document.createElement("div");
      head.className = "talent-head";
      const title = document.createElement("strong");
      title.textContent = spec.name;
      const cat = document.createElement("span");
      cat.className = "talent-cat";
      cat.textContent = spec.category;
      head.append(title, cat);

      const desc = document.createElement("p");
      desc.className = "talent-desc";
      desc.textContent = spec.summary;
      info.append(head, desc);

      top.append(iconWrap, info);

      // Middle: visual 3-tier progression stepper
      const tiers = document.createElement("div");
      tiers.className = "talent-tiers";
      tiers.setAttribute("aria-label", `${rank}/${spec.costs.length} 级`);
      spec.shortLabels.forEach((label, idx) => {
        const step = document.createElement("div");
        const state = idx < rank ? "lit" : idx === rank ? "next" : "locked";
        step.className = `talent-tier ${state}`;
        step.title = spec.labels[idx];
        const numeral = document.createElement("em");
        numeral.textContent = ROMAN[idx];
        const val = document.createElement("b");
        val.textContent = label;
        step.append(numeral, val);
        tiers.append(step);
      });

      // Bottom: action button
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = maxed ? "dialog-secondary talent-btn maxed" : "action talent-btn";
      btn.disabled = maxed;
      btn.classList.toggle("insufficient", !maxed && !canBuy);
      btn.innerHTML = maxed
        ? `<span class="talent-btn-label">已圆满</span>`
        : `<span class="talent-btn-label">${rank === 0 ? "点亮" : "进阶"}</span><span class="talent-btn-cost">★ ${nextCost}</span>`;
      btn.addEventListener("click", () => {
        if (maxed) return;
        const budget = starBudget();
        if (budget.available < nextCost) {
          audio.playUi("ui-denied");
          return;
        }
        const next: Partial<Record<TalentId, number>> = { ...save.snapshot.talents, [spec.id]: rank + 1 };
        save.setTalents(next);
        analytics.logEvent("talent_upgrade", { talent_id: spec.id, level: rank + 1 });
        lastUpgraded = spec.id;
        audio.playUi("ui-equip");
        updateTrigger();
        render();
      });

      card.append(top, tiers, btn);
      grid.append(card);
    }
    lastUpgraded = null;
  }

  trigger.addEventListener("click", () => {
    audio.playUi("ui-open");
    render();
    dialog.showModal();
  });

  resetButton.addEventListener("click", () => {
    if (spentStars(save.snapshot.talents) === 0) return;
    save.setTalents({});
    analytics.logEvent("talent_reset");
    lastUpgraded = null;
    audio.playUi("ui-clear");
    updateTrigger();
    render();
  });

  updateTrigger();
  return updateTrigger;
}
