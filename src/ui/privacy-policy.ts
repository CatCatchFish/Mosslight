import privacyPage from "../../docs/privacy-policy.html?raw";
import type { AnalyticsConsentStore } from "../platform/analytics-consent.ts";
import type { GameAnalytics } from "../platform/analytics.ts";
import { $ } from "./dom.ts";

let mounted = false;

export function mountPrivacyConsentControls(
  store: AnalyticsConsentStore,
  analytics: GameAnalytics,
) {
  const action = $("privacy-consent-action");
  const status = $("privacy-consent-status");
  let busy = false;

  function update() {
    const allowed = store.snapshot;
    action.hidden = !analytics.supported || allowed === null;
    action.disabled = busy;
    action.textContent = allowed === true ? "撤回统计授权" : "重新开启统计";
  }

  analytics.observe(update);
  action.addEventListener("click", async () => {
    if (busy) return;
    const enable = store.snapshot !== true;
    busy = true;
    status.textContent = "";
    update();
    if (!enable) void analytics.setConsent(false);
    try {
      await store.setConsent(enable);
      if (enable) await analytics.setConsent(true);
      status.textContent = enable ? "数据统计已开启。" : "数据统计已撤回。";
    } catch {
      status.textContent = enable
        ? "授权状态保存失败，请重试。"
        : "本次已停止统计，但授权状态保存失败；重启后可能需要再次操作。";
    } finally {
      busy = false;
      update();
    }
  });
  update();
}

function mount() {
  if (mounted) return;
  const page = new DOMParser().parseFromString(privacyPage, "text/html");
  const article = page.querySelector("main");
  if (!article) throw new Error("Privacy policy content is missing");
  const content = $("privacy-policy-content");
  content.replaceChildren(
    ...Array.from(article.childNodes, (node) => document.importNode(node, true)),
  );
  $("close-privacy-policy").addEventListener("click", () => {
    $("privacy-dialog").close();
  });
  mounted = true;
}

export function openPrivacyPolicy() {
  mount();
  const dialog = $("privacy-dialog");
  const content = $("privacy-policy-content");
  if (!dialog.open) dialog.showModal();
  content.scrollTo(0, 0);
  $("close-privacy-policy").focus({ preventScroll: true });
}