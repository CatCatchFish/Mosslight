import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { AntiAddictionProvider, AntiAddictionResult } from "../platform/anti-addiction.ts";

const MESSAGES: Record<number, string> = {
  1000: "登录状态已失效，请重新登录 TapTap。",
  1001: "请使用 TapTap 登录后继续游戏。",
  1030: "当前时段无法游玩，请在允许的时段内再来。",
  1050: "今日可玩时长已用尽，请明天再来。",
  1100: "当前账号未达到本游戏的年龄要求。",
  1200: "TapTap 服务连接失败，请检查网络后重试。",
  9002: "实名认证未完成，请重新完成认证。",
};

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
}

function renderGate(result: AntiAddictionResult) {
  const root = document.createElement("div");
  root.className = "anti-addiction-gate";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.innerHTML =
    '<section class="anti-addiction-gate__panel">' +
    '<p class="anti-addiction-gate__eyebrow">TAPTAP 防沉迷</p>' +
    '<h2>进入微光防线</h2>' +
    '<p class="anti-addiction-gate__message"></p>' +
    '<p class="anti-addiction-gate__hint">实名认证与时段限制由 TapTap 合规服务提供。</p>' +
    '<div class="anti-addiction-gate__actions">' +
    '<button class="anti-addiction-gate__primary" type="button"></button>' +
    '<button class="anti-addiction-gate__secondary" type="button">退出游戏</button>' +
    "</div>" +
    "</section>";
  const message = root.querySelector<HTMLElement>(".anti-addiction-gate__message")!;
  const primary = root.querySelector<HTMLButtonElement>(".anti-addiction-gate__primary")!;
  const secondary = root.querySelector<HTMLButtonElement>(".anti-addiction-gate__secondary")!;
  message.textContent = result.message ?? MESSAGES[result.code] ?? "暂时无法进入游戏。";
  primary.textContent = result.needsLogin ? "TapTap 登录" : "重试认证";
  return { root, primary, secondary };
}

function waitForAccess(provider: AntiAddictionProvider, first: AntiAddictionResult) {
  return new Promise<boolean>((resolve) => {
    const { root, primary, secondary } = renderGate(first);
    document.body.append(root);
    primary.focus();

    const finish = () => {
      root.remove();
      resolve(true);
    };
    const exit = () => {
      root.remove();
      if (Capacitor.getPlatform() === "android")
        void App.exitApp().catch((error) => console.error("Exit game:", error));
      resolve(false);
    };
    const retry = async (login: boolean) => {
      primary.disabled = true;
      secondary.disabled = true;
      try {
        const next = login ? await provider.login() : await startAfterInitialize(provider);
        if (next.allowed) finish();
        else {
          root.remove();
          resolve(waitForAccess(provider, next));
        }
      } catch (error) {
        console.error("Anti-addiction:", error);
        const message = error instanceof Error ? error.message : String(error);
        primary.disabled = false;
        secondary.disabled = false;
        primary.textContent = login ? "重新登录" : "重试认证";
        root.querySelector<HTMLElement>(".anti-addiction-gate__message")!.textContent = message;
      }
    };

    primary.addEventListener("click", () => void retry(first.needsLogin));
    secondary.addEventListener("click", exit);
  });
}

async function startAfterInitialize(provider: AntiAddictionProvider) {
  const init = await provider.initialize();
  if (!init.configured) throw new Error("TapTap 防沉迷尚未配置。");
  return provider.start();
}

export async function enforceAntiAddiction(provider: AntiAddictionProvider | null) {
  if (!provider) return true;
  try {
    const init = await provider.initialize();
    if (!init.configured) return true;
  } catch (error) {
    if (errorCode(error) === "NOT_CONFIGURED") {
      console.warn("TapTap anti-addiction is not configured.");
      return true;
    }
    console.error("Anti-addiction init:", error);
    return waitForAccess(provider, {
      code: 1200,
      allowed: false,
      needsLogin: false,
      ageRange: -1,
      remainingSeconds: -1,
      message: "TapTap 防沉迷初始化失败，请检查网络或应用配置。",
    });
  }

  try {
    const result = await provider.start();
    return result.allowed || waitForAccess(provider, result);
  } catch (error) {
    console.error("Anti-addiction start:", error);
    return waitForAccess(provider, {
      code: 1200,
      allowed: false,
      needsLogin: false,
      ageRange: -1,
      remainingSeconds: -1,
      message: error instanceof Error ? error.message : "TapTap 认证服务暂时不可用。",
    });
  }
}