import { facingFor } from "../engine/formation.ts";
import type { Facing } from "../engine/formation.ts";
import { guardBraceReady, guardUnitStats } from "../engine/guards.ts";
import type { Guard, GuardBranch, GuardPost } from "../engine/guards.ts";
import { mireBossState } from "../engine/mire-rules.ts";
import { CELL } from "../engine/route.ts";
import type { Enemy, EnemyId, Point } from "../engine/types.ts";
import { diamond, pixelOval } from "./animation.ts";
import { box, canvas2d } from "./canvas.ts";
import { drawInterceptorUpgrade } from "./interceptor-upgrade.ts";
import { artFor, lanternMoth, mudskipper, paddleOtter, reedPost, reedSpider, reedSpiderling, shieldCrayfish,
  sluiceDragon, stoneClam, whiskerCatfish } from "./mire-expansion-art.ts";
import type { ArtOptions, EnemyAttackPhase, OtterPose, Painter } from "./mire-expansion-art.ts";
import { paintSprite, stamp } from "./pixel-sprite.ts";
import { highQuality } from "./quality.ts";
import { shadeSprite } from "./tower-life.ts";
import { guardBuildAlpha } from "./unit-life.ts";

const egg: Painter = ({ gem, trace, r, frame }) => {
  const wobble = Math.round(Math.sin(frame * Math.PI / 3) * 2);
  const shell = ["#806b79", "#c6adab", "#f2e3c7"] as const;
  trace([[-15, 3], [-6, -6], [7, -7], [14, 3]], "#b29c87", 1.1);
  gem(wobble, -6, 10, 9 - Math.abs(wobble) * .5, shell);
  trace([[-6 + wobble,-9], [wobble,-1], [6 + wobble,-5]], "#e7d5b2", 1.1);
  r(-4 + wobble, -10, 2, 1.5, "#fff0d0");
};

export const MIRE_PAINTERS = {
  mudskipper, "shield-crayfish": shieldCrayfish, "lantern-moth": lanternMoth, "whisker-catfish": whiskerCatfish,
  "stone-clam": stoneClam, "reed-spider": reedSpider, "spider-egg": egg, "reed-spiderling": reedSpiderling,
  "sluice-dragon": sluiceDragon,
} satisfies Partial<Record<EnemyId, Painter>>;

export type MireEnemy = keyof typeof MIRE_PAINTERS;

export function isMireEnemy(type: EnemyId): type is MireEnemy {
  return Object.hasOwn(MIRE_PAINTERS, type);
}

export const MIRE_SCALES: Record<MireEnemy, number> = {
  mudskipper: .61, "shield-crayfish": .74, "lantern-moth": .74, "whisker-catfish": .99,
  "stone-clam": 1.04, "reed-spider": 1.05, "spider-egg": .71, "reed-spiderling": .48, "sluice-dragon": 1.45,
};

export const MIRE_HEIGHTS: Record<MireEnemy, number> = {
  mudskipper: 45, "shield-crayfish": 50, "lantern-moth": 53, "whisker-catfish": 54,
  "stone-clam": 55, "reed-spider": 52, "spider-egg": 26, "reed-spiderling": 38, "sluice-dragon": 61,
};

const cached = new Map<string, HTMLCanvasElement>();

function sprite(id: string, painter: Painter, frame: number, facing: Facing, skill: boolean,
  options?: ArtOptions) {
  const view = facing === "north" ? "back" : facing === "south" ? "front" : "side";
  const rich = highQuality();
  const key = [
    id, frame, view, Number(skill), Number(rich),
    options?.gate, options?.fractured, options?.attack,
    options?.otter?.tier, options?.otter?.branch, options?.otter?.pose,
  ].join("/");
  let picture = cached.get(key);
  if (!picture) {
    const art = paintSprite((r, p) => painter(artFor(r, p, frame, true, options), view, skill), 2);
    picture = rich ? shadeSprite(art) : art;
    cached.set(key, picture);
  }
  return picture;
}

export function mireEnemySprite(type: MireEnemy, frame: number, facing: Facing, skill: boolean,
  options?: ArtOptions) {
  return sprite(type, MIRE_PAINTERS[type], frame, facing, skill, options);
}

export function mireEnemyPose(enemy: Enemy, reducedMotion: boolean, time = 0) {
  const cast = enemy.mireCast;
  const elapsed = cast ? enemy.age - cast.startedAt : 0;
  const melee = enemy.melee && time < enemy.melee.end ? enemy.melee : undefined;
  const attack: EnemyAttackPhase | undefined = melee
    ? (time < melee.impact ? "windup" : "strike")
    : undefined;
  const facing = cast?.direction ? facingFor(...cast.direction) : melee?.facing;
  const skill = enemy.type === "stone-clam" ? Boolean(cast && elapsed >= 2.75)
    : enemy.type === "sluice-dragon" ? mireBossState(enemy) === "open"
    : enemy.type === "reed-spiderling" ? enemy.age < .24 : Boolean(cast);
  const flaps = enemy.type === "lantern-moth";
  const frame = reducedMotion ? 0
    : enemy.type === "spider-egg" ? Math.floor(enemy.age * (enemy.age > 3 ? 13 : 6)) % 6
    : flaps ? Math.floor(enemy.age * (skill ? 12 : 18)) % 8
    : cast ? Math.floor(elapsed * 14) % 8
    : melee ? Math.floor((time - melee.start) * 14) % 8
    : Math.floor(enemy.walk * 2) % 8;
  const leap = enemy.type === "mudskipper" && cast && elapsed >= .35 && elapsed < .77
    ? 7 * Math.sin((elapsed - .35) / .42 * Math.PI) : undefined;
  const bossPose = enemy.type === "sluice-dragon" ? mireBossState(enemy) : undefined;
  const gate = bossPose === "windup" ? elapsed * .42
    : bossPose === "open" ? Math.min(1, .42 + (elapsed - 1) * 4, Math.max(.2, (3.5 - elapsed) / .4)) : 0;
  const options: ArtOptions = enemy.type === "sluice-dragon"
    ? { gate: Math.round(gate * 5) / 5, fractured: Boolean(enemy.mireFractured), attack }
    : { attack };
  return { frame, skill, leap, facing, options };
}

function postArt(tier: number, branch?: GuardBranch) {
  const pose = branch === "mud-patrol" ? (tier === 4 ? 5 : 4)
    : branch === "fixed-bank" ? (tier === 4 ? 3 : 2) : tier - 1;
  const key = "reed-post/" + pose + "/" + highQuality();
  let image = cached.get(key);
  if (!image) {
    const raw = paintSprite((r, p) => reedPost(artFor(r, p), pose), 2);
    image = highQuality() ? shadeSprite(raw) : raw;
    cached.set(key, image);
  }
  return image;
}

export function drawReedPost(ctx: CanvasRenderingContext2D, post: GuardPost, time: number, still: boolean) {
  const x = post.origin[0] * CELL + 8, y = Math.max(25, post.origin[1] * CELL + 10);
  pixelOval(ctx, x, y + 2, 13, 3, 20, "#17252066", 1.7);
  drawInterceptorUpgrade(ctx, post, x, y, time, still,
    ({ tier, branch }) => stamp(ctx, postArt(tier, branch), x, y, .96),
    ({ tier, branch }) => postArt(tier, branch));
  const [rx, ry] = post.rally;
  box(ctx, rx * CELL + 5, ry * CELL + 10, 6, 1, "#e2bc80");
}

export function drawReedPostIcon(canvas: HTMLCanvasElement, tier: 1 | 2 | GuardBranch, mastery: boolean) {
  stamp(canvas2d(canvas), postArt(typeof tier === "number" ? tier : mastery ? 4 : 3,
    typeof tier === "number" ? undefined : tier), canvas.width / 2, canvas.height - 6, canvas.height / 33);
}

export function drawPaddleOtter(ctx: CanvasRenderingContext2D, guard: Guard, post: GuardPost, time: number, still: boolean) {
  const sinceHit = time - guard.hurtAt;
  const dead = guard.hp <= 0;
  const alpha = dead ? Math.max(0, 1 - sinceHit / .32) : guardBuildAlpha(post.builtAt, time, still);
  if (!alpha) return;
  const strike = !dead && guard.attack;
  const impact = strike ? time - strike.impact : -Infinity;
  const move = !still && time - guard.movedAt < .17;
  const ready = !strike && guardBraceReady(guard, post, time);
  const braced = time - (guard.braceAt ?? -Infinity) < .38 ||
    (ready && Boolean(guard.target?.mireCast));
  const thrust = strike && impact >= 0 && impact < .22 ? (1 - impact / .22) * (strike.bonus ? 4 : 2.5) : 0;
  const pull = strike && impact < 0 ? -1.5 : 0;
  const [dx, dy]: Point = strike ? strike.direction : [guard.facing, 0];
  const facing = facingFor(dx, dy);
  const recoil = Math.max(0, 1 - sinceHit / .19) * 3;
  const x = guard.x * CELL + 8 + (still ? 0 : dx * (thrust + pull) + guard.recoil[0] * recoil);
  const y = guard.y * CELL + 10 + (still ? 0 : dy * (thrust + pull) + guard.recoil[1] * recoil);
  const stride = still ? 0 : move ? Math.floor(guard.walk * 2) % 6 : Math.floor(time * 2.2 + post.index * 1.7) % 6;
  const pose: OtterPose = strike
    ? (impact < 0 ? "windup" : "strike")
    : braced ? "brace"
    : move ? "walk" : "idle";
  const bob = still ? 0 : move ? Math.abs(Math.sin(stride * Math.PI / 3)) : Math.sin(time * 2.9 + post.index) * .35;
  ctx.save();
  ctx.globalAlpha = alpha;
  pixelOval(ctx, x, y + .8, 7, 2.2, 16, "#17252085", 1.1);
  if (ready) box(ctx, x - 3.5, y + 1.2, 7, .8, "#f6df9c");
  if (braced) diamond(ctx, x + 5.5, y - 5.5, 1.5, "#fff4be");
  stamp(
    ctx,
    sprite("paddle-otter", paddleOtter, stride, facing, braced, {
      otter: { tier: post.tier, branch: post.branch, pose },
    }),
    x,
    y - bob,
    dead ? .56 - .15 * (1 - alpha) : .64,
    facing === "west" ? -1 : 1,
  );
  const health = guard.hp / guardUnitStats(post, guard).health;
  if (!dead && health < 1) {
    box(ctx, x - 5, y - 26, 10, 2.5, "#30352d");
    box(ctx, x - 4.5, y - 25.4, 9 * health, 1, "#c9df8f");
  }
  ctx.restore();
}
