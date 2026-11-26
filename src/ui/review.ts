import type { GameAudio } from "../platform/audio.ts";
import type { ReviewPromptController, TapReviewResult } from "../platform/review.ts";
import type { SaveStore } from "../platform/save.ts";
import { $ } from "./dom.ts";
import { openPrivacyPolicy } from "./privacy-policy.ts";

export function mountReviewPrompt(
  save: SaveStore,
  audio: GameAudio,
  review: ReviewPromptController,
  waitForHandoff: () => Promise<boolean> = async () => true,
) {
  const dialog = $("review-dialog");
  const later = $("review-later");
  const open = $("review-open");
  const status = $("review-status");
  let opening = false;

  $("review-policy").addEventListener("click", () => {
    audio.playUi("ui-tab");
    openPrivacyPolicy();
  });

  later.addEventListener("click", () => {
    audio.playUi("ui-close");
    dialog.close();
  });

  open.addEventListener("click", async () => {
    if (opening) return;
    opening = true;
    open.disabled = later.disabled = true;
    status.hidden = true;
    audio.playUi("ui-confirm");
    const watchHandoff = waitForHandoff();
    let result: TapReviewResult = await review.openReview();
    if (result.invoked) {
      status.textContent = "正在跳转 TapTap……";
      status.hidden = false;
      result = (await watchHandoff)
        ? { ...result, opened: true }
        : { ...result, opened: false, reason: "no-handoff" };
    }
    opening = false;
    open.disabled = later.disabled = false;
    if (result.opened) {
      save.markReviewOpened();
      dialog.close();
      return;
    }
    status.textContent =
      result.reason === "unsupported"
        ? "当前环境暂不支持跳转 TapTap，请在 Android 端通过 TapTap 页面评价。"
        : result.reason === "consent"
          ? "请先在隐私政策中开启 TapTap 数据服务授权，再使用评价功能。"
          : result.reason === "not-ready"
            ? "TapTap 服务正在准备，请稍后再试。"
            : result.reason === "no-handoff"
              ? result.tapInstalled === false
                ? "未检测到 TapTap 客户端，也未能打开 TapTap 网页。请安装 TapTap 后重试。"
                : "评价 SDK 已调用，但未检测到页面跳转。请检查 TapTap 开发者中心的包名、签名证书与已上传 APK 是否属于同一应用。"
              : result.reason === "review-url-missing"
                ? "未收到 TapTap 评价地址。请检查开发者中心的包名、签名 MD5 与已审核 APK 是否为同一应用。"
                : "暂时无法打开 TapTap 评价页，你可以稍后再前往 TapTap 留下想法。";
    status.hidden = false;
  });

  return function promptIfPending() {
    if (dialog.open) return false;
    const stageId = review.consumePending(
      save.snapshot.reviewPrompts,
      save.snapshot.reviewOpened,
    );
    if (!stageId) return false;
    save.markReviewPrompted(stageId);
    status.hidden = true;
    status.textContent = "";
    open.disabled = later.disabled = false;
    dialog.showModal();
    open.focus({ preventScroll: true });
    return true;
  };
}
