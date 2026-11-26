import type { AnalyticsConsentStore } from "../platform/analytics-consent.ts";
import type { GameAnalytics } from "../platform/analytics.ts";
import { $, requiredChild } from "./dom.ts";
import { openPrivacyPolicy } from "./privacy-policy.ts";

export function mountAnalyticsConsent(
  store: AnalyticsConsentStore,
  analytics: GameAnalytics,
): Promise<boolean> {
  if (!analytics.supported) return Promise.resolve(true);
  const dialog = $("analytics-consent-dialog");
  const agree = $("analytics-consent-accept");
  const decline = $("analytics-consent-decline");
  const acknowledge = $("analytics-consent-ack");
  const error = $("analytics-consent-error");
  const body = requiredChild(dialog, ".analytics-consent-body");
  if (store.snapshot !== null) {
    analytics.restore(store.snapshot);
    return Promise.resolve(true);
  }

  acknowledge.addEventListener("change", () => {
    if (acknowledge.checked) error.hidden = true;
  });
  $("analytics-consent-policy").addEventListener("click", openPrivacyPolicy);
  return new Promise((resolve) => {
    let choosing = false;
    dialog.addEventListener("cancel", (event) => event.preventDefault());
    async function choose(allowed: boolean) {
      if (choosing) return;
      if (allowed && !acknowledge.checked) {
        error.textContent = "请先勾选下方同意框，确认您已阅读《隐私政策》并同意收集 OAID、AndroidID 与上述数据；如不同意请选择“不同意（仅单机）”。";
        error.hidden = false;
        acknowledge.focus();
        return;
      }
      choosing = true;
      agree.disabled = decline.disabled = true;
      error.hidden = true;
      try {
        await store.setConsent(allowed);
        analytics.setConsent(allowed);
        dialog.close();
        resolve(true);
      } catch {
        if (!allowed) {
          void analytics.setConsent(false);
          dialog.close();
          resolve(true);
          return;
        }
        error.textContent = "授权状态保存失败，请重试，或选择“不同意（仅单机）”继续游戏。";
        error.hidden = false;
        choosing = false;
        decline.disabled = false;
        agree.disabled = false;
      }
    }
    agree.addEventListener("click", () => { void choose(true); });
    decline.addEventListener("click", () => { void choose(false); });
    dialog.showModal();
    body.scrollTo(0, 0);
    acknowledge.focus({ preventScroll: true });
  });
}
