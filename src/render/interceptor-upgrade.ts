import { GUARD_BUILDINGS } from "../engine/guards.ts";
import type { GuardPost } from "../engine/guards.ts";
import { diamond } from "./animation.ts";
import { box } from "./canvas.ts";
import { stamp } from "./pixel-sprite.ts";
import { highQuality } from "./quality.ts";
import {
  BUILD_SECONDS, UPGRADE_SECONDS, UPGRADE_SWAP,
  buildPose, combine, drawDust, drawUpgradeGlow, silhouette, upgradePose,
} from "./tower-life.ts";

type GuardForm = Pick<GuardPost, "tier" | "branch">;

export function interceptorForm(post: GuardPost, time: number, reducedMotion: boolean): GuardForm {
  const from = post.upgradeFrom;
  return !reducedMotion && from && time >= from.at && time - from.at < UPGRADE_SWAP ? from : post;
}

export function interceptorLift(post: GuardPost, time: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  const buildAge = post.builtAt === undefined ? Infinity : time - post.builtAt;
  const upgradeAge = time - (post.upgradeFrom?.at ?? -Infinity);
  let lift = 0;
  if (buildAge >= 0 && buildAge < BUILD_SECONDS) lift += buildPose(buildAge).lift;
  if (upgradeAge >= 0 && upgradeAge < UPGRADE_SECONDS) lift += upgradePose(upgradeAge).lift;
  return lift;
}

export function drawInterceptorUpgrade(
  ctx: CanvasRenderingContext2D, post: GuardPost, x: number, y: number, time: number,
  reducedMotion: boolean, paintForm: (form: GuardForm) => void,
  getSprite?: (form: GuardForm) => HTMLCanvasElement,
) {
  const buildAge = post.builtAt === undefined ? Infinity : time - post.builtAt;
  const upgradeAge = time - (post.upgradeFrom?.at ?? -Infinity);
  const building = !reducedMotion && buildAge >= 0 && buildAge < BUILD_SECONDS;
  const upgrading = !reducedMotion && upgradeAge >= 0 && upgradeAge < UPGRADE_SECONDS;
  if (!building && !upgrading) {
    paintForm(post);
    return;
  }

  let pose = { sx: 1, sy: 1, lift: 0, alpha: 1 };
  if (building) pose = combine(pose, buildPose(buildAge));
  if (upgrading) pose = combine(pose, upgradePose(upgradeAge));

  const form = interceptorForm(post, time, false);
  const base = y + 3;
  ctx.save();
  ctx.globalAlpha *= pose.alpha;
  ctx.translate(x, base - pose.lift);
  ctx.scale(pose.sx, pose.sy);
  ctx.translate(-x, -base);
  paintForm(form);

  if (highQuality() && getSprite) {
    let flash = 0;
    if (building && buildAge > 0.14) flash = Math.max(flash, 1 - (buildAge - 0.14) / 0.16);
    if (upgrading) {
      const upFlash = upgradeAge < UPGRADE_SWAP
        ? (upgradeAge / UPGRADE_SWAP) ** 2
        : Math.max(0, 1 - (upgradeAge - UPGRADE_SWAP) / 0.22);
      flash = Math.max(flash, upFlash);
    }
    if (flash > 0) {
      ctx.globalAlpha = flash * 0.72;
      const scale = post.type === "griffin-roost" ? 1 + (form.tier - 1) * 0.035 : 1;
      stamp(ctx, silhouette(getSprite(form)), x, y, scale);
    }
  }
  ctx.restore();

  if (!highQuality()) return;

  if (building) {
    const t = (buildAge - 0.15) / 0.45;
    if (t > 0 && t < 1) {
      const dustColor = post.type === "frost-kennel" ? "#cde6f0"
        : post.type === "griffin-roost" ? "#b8c7d4"
        : "#d9c49b";
      drawDust(ctx, x, y, t, post.type === "guard-post" ? 1.08 : 1.0, dustColor);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.82;
      for (const side of [-1, 1]) {
        if (post.type === "griffin-roost") {
          const dx = side * (4 + t * 12);
          const dy = -12 - Math.sin(t * Math.PI) * 9 - t * 3;
          diamond(ctx, x + dx, y + dy, 1.35, "#eaf5ff");
          box(ctx, x + dx - side * 2, y + dy + 2.5, 1.5, 0.85, "#9cc4de");
        } else if (post.type === "frost-kennel") {
          const dx = side * (5 + t * 10);
          const dy = -9 - t * 10;
          diamond(ctx, x + dx, y + dy, 1.3, "#e8fbff");
          box(ctx, x + dx * 0.7, y + dy + 3.5, 1.2, 1.2, "#9be5fa");
        } else {
          const dx = side * (5 + t * 11);
          const dy = -8 - Math.sin(t * Math.PI) * 7 - t * 2;
          box(ctx, x + dx, y + dy, 1.6, 1.1, "#d6ed9a");
          diamond(ctx, x + dx * 0.75, y + dy - 2.5, 1.0, "#fff2b8");
        }
      }
      ctx.restore();
    }
  }

  if (upgrading) {
    const accent = GUARD_BUILDINGS[post.type].color;
    drawUpgradeGlow(ctx, x, y, upgradeAge, accent, post.type === "frost-kennel" ? 21 : 25);
    const release = (upgradeAge - UPGRADE_SWAP) / (UPGRADE_SECONDS - UPGRADE_SWAP);
    if (release <= 0) return;
    if (post.type === "frost-kennel") {
      drawDust(ctx, x, y, release * 1.3, .9, "#b9d5df");
      return;
    }
    if (post.type === "guard-post") {
      drawDust(ctx, x, y, release * 1.25, .95, "#d9c49b");
      ctx.save();
      ctx.globalAlpha = (1 - release) * .78;
      for (const side of [-1, 1]) {
        const dx = side * (5 + 9 * release);
        const dy = -10 - 11 * release;
        diamond(ctx, x + dx, y + dy, 1.4, "#e6f2b6");
        box(ctx, x + dx * 0.7, y + dy + 2.5, 1.25, 1.25, "#ffdf99");
      }
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.globalAlpha = (1 - release) * .75;
    for (const side of [-1, 1]) {
      const dx = side * (5 + 11 * release);
      const dy = -11 - 13 * release;
      diamond(ctx, x + dx, y + dy, 1.5, "#e8eef1");
      diamond(ctx, x + dx - side, y + dy + 2, .75, "#9cbcd1");
    }
    ctx.restore();
  }
}
