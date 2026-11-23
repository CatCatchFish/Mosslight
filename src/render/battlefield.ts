import { TOWERS } from "../content/towers.ts";
import type { WeatherPlan } from "../content/weather.ts";
import { towerStats } from "../engine/defense.ts";
import type { DefenseGame } from "../engine/defense.ts";
import { beaconTargets } from "../engine/devices.ts";
import { guardStats, GUARD_BUILDINGS, isGuardPost, isGuardPostId } from "../engine/guards.ts";
import type { Guard, GuardPost } from "../engine/guards.ts";
import { CELL, isInTunnel, key, overTunnel } from "../engine/route.ts";
import type { BuildingId, Enemy, Tower } from "../engine/types.ts";
import { drawEffect, drawGroundEffect, drawGuardQuill, drawProjectile, pixelOval } from "./animation.ts";
import { canvas2d } from "./canvas.ts";
import type { SceneBounds } from "./canvas.ts";
import { drawSceneryReaction, drawScenerySnow } from "./battle-details.ts";
import type { SceneryReaction } from "./battle-details.ts";
import { drawAmbient, drawCore, drawEntrance, makeAmbient } from "./scenery.ts";
import { drawEnemy, drawEnemyDefeat, drawEnemyWarning, drawEnemyWarningGround } from "./sprites.ts";
import { drawTower } from "./tower-art.ts";
import { drawGuard, drawGuardPost } from "./guards.ts";
import { drawDeviceCarts, drawDevices, drawTrackSwitch } from "./devices.ts";
import { drawFreezeMark, drawFrozenTower } from "./frost-boss.ts";
import { reducedMotion } from "./motion.ts";
import { createFootprints, drawDefeatDebris } from "./combat-details.ts";
import { box, buildTerrain, drawEmptyPlotPad } from "./terrain.ts";
import { createWeatherRenderer } from "./weather.ts";

interface BattleFrame {
  selected: number | null;
  hoveredType: BuildingId | null;
  training: number | null;
  uiTime: number;
  scenery: readonly SceneryReaction[];
  showRanges: boolean;
  guardRange: number | null;
  highlightEntry?: string | null;
  devicePreview?: number | "track-switch" | null;
}

interface BattleView {
  width: number;
  height: number;
  board: SceneBounds;
}

function drawRange(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  range: number,
  guideColor?: string,
) {
  ctx.beginPath();
  ctx.arc(x, y, range * CELL, 0, Math.PI * 2);
  ctx.setLineDash([3, 3]);
  if (guideColor) {
    ctx.strokeStyle = "#172b26ad";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = "#f8e7a522";
    ctx.fill();
  }
  ctx.strokeStyle = guideColor ? guideColor + "db" : "#f7eba9a0";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
}
export function createBattleRenderer(
  canvas: HTMLCanvasElement,
  game: DefenseGame,
  weather: WeatherPlan,
) {
  const level = game.level, routes = game.allRoutes;
  const ambient = makeAmbient(level, routes);
  const width = level.width * CELL,
    height = level.height * CELL;
  const water = new Set(level.pools.map(([x, y]) => key(x, y)));
  const waterAt = (x: number, y: number) => water.has(key(Math.floor(x / CELL), Math.floor(y / CELL)));
  const decks = new Set(level.bridgeDeck?.map(([x, y]) => key(x, y)));
  for (const { from: [x, y], to: [tx, ty], style } of level.bridges ?? []) {
    if (style === "stones") continue;
    for (let i = 0; i <= Math.abs(tx - x) + Math.abs(ty - y); i++)
      decks.add(key(x + i * Math.sign(tx - x), y + i * Math.sign(ty - y)));
  }
  const isWater = (x: number, y: number) =>
    waterAt(x, y) && !decks.has(key(Math.floor(x / CELL), Math.floor(y / CELL)));
  const weatherArt = createWeatherRenderer(weather, width, height, level.seed, isWater);
  const tunnels = level.tunnels ?? [];
  const enemyVisible = (enemy: Enemy) => !enemy.escaped && !isInTunnel(enemy);
  const drawFootprints = createFootprints(isWater);
  const lastImpact = new WeakMap<Enemy, Enemy["projectileImpact"]>();
  const ctx = canvas2d(canvas);
  let terrain: ReturnType<typeof buildTerrain> | undefined;

  function draw(view: BattleView, {
    selected,
    hoveredType,
    training,
    uiTime,
    scenery,
    showRanges,
    guardRange,
    highlightEntry,
    devicePreview,
  }: BattleFrame) {
    if (!view.width || !view.height || !view.board.width || !view.board.height) return;
    const still = reducedMotion.matches;
    const scaleX = view.board.width / width, scaleY = view.board.height / height;
    const visible = {
      x: -view.board.x / scaleX, y: -view.board.y / scaleY,
      width: view.width / scaleX, height: view.height / scaleY,
    };
    if (!terrain || visible.x < terrain.x || visible.y < terrain.y ||
        visible.x + visible.width > terrain.x + terrain.width ||
        visible.y + visible.height > terrain.y + terrain.height) {
      terrain = buildTerrain(level, routes, visible);
    }
    const density = Math.min(window.devicePixelRatio, 2);
    const pixelWidth = Math.max(1, Math.round(view.width * density));
    const pixelHeight = Math.max(1, Math.round(view.height * density));
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const pixelsX = pixelWidth / view.width, pixelsY = pixelHeight / view.height;
    ctx.setTransform(scaleX * pixelsX, 0, 0, scaleY * pixelsY,
      view.board.x * pixelsX, view.board.y * pixelsY);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(terrain.canvas, terrain.x, terrain.y, terrain.width, terrain.height);
    const surface = weatherArt.surface(game.wave, game.time, still);
    terrain.surfaces.draw(ctx, game.time, surface.snow, still);
    drawScenerySnow(ctx, level, surface.snow, game.time, still);
    for (const [x, y] of level.shallows ?? []) {
      const dx = x * CELL, dy = y * CELL;
      box(ctx, dx + 1, dy + 5, 12, 4, "#506a52a8");
      box(ctx, dx + 2, dy + 7, 6, 1, "#8da582ce");
      box(ctx, dx + 8, dy + 4, 5, 1, "#99ab83a5");
      box(ctx, dx + 4, dy + 11, 4, 1, "#768f6a8d");
    }
    terrain.drawFoliage(ctx, surface.wind, game.time);
    drawAmbient(ctx, ambient, still ? 0 : game.time);
    weatherArt.draw(ctx, visible, game.wave, game.waveStartedAt, game.time, still);
    drawDevices(ctx, game.devices, game.time, still, typeof devicePreview === "number" ? devicePreview : null);
    drawTrackSwitch(ctx, game, devicePreview === "track-switch");
    const traceEntries = highlightEntry
      ? level.entries.filter((entry) => entry.id === highlightEntry && game.entryVisible(entry))
      : (!level.trackSwitch && game.awaitingFirstWave && selected === null)
        ? level.entries.filter((entry) => game.entryVisible(entry))
        : [];
    if (traceEntries.length) {
      // Trace approaches in deployment phase or when inspecting an entry route.
      const drift = still ? 0 : (uiTime / (highlightEntry ? 1500 : 2300)) % 4;
      const bodyColor = highlightEntry ? "#ffe680dd" : "#fff0bcaa";
      const tipColor = highlightEntry ? "#fff9d4ff" : "#fff0bccc";
      for (const entry of traceEntries) {
        const route = game.routes[entry.id];
        for (let distance = 1 + drift; distance < route.distance - 1; distance += highlightEntry ? 3.2 : 4) {
          const here = route.at(distance);
          const ahead = route.at(distance + 0.1);
          const angle = Math.atan2(ahead.y - here.y, ahead.x - here.x);
          ctx.save();
          ctx.translate(Math.round(here.x * CELL + 8), Math.round(here.y * CELL + 8));
          ctx.rotate(angle);
          for (const offset of [-3, 0]) {
            box(ctx, offset, -2, 1, 1, bodyColor);
            box(ctx, offset + 1, -1, 1, 1, bodyColor);
            box(ctx, offset + 2, 0, 1, 1, tipColor);
            box(ctx, offset + 1, 1, 1, 1, bodyColor);
            box(ctx, offset, 2, 1, 1, bodyColor);
          }
          ctx.restore();
        }
      }
    }
    for (const reaction of scenery)
      drawSceneryReaction(ctx, reaction, uiTime, still);
    for (const entry of game.level.entries) {
      if (!game.entryVisible(entry)) continue;
      const [x, y] = entry.route[0];
      drawEntrance(
        ctx,
        Math.max(7, x * CELL + 8),
        y * CELL + 7,
        entry.scenery,
        Boolean(game.deployment(entry.id)?.remaining),
        !game.awaitingFirstWave &&
          game.pending.has(entry.id) &&
          !game.tutorialHold &&
          !game.ended,
        still ? 0 : game.time,
        surface.wind * (.74 + .26 * Math.sin(game.time * .57)),
      );
    }
    const [endX, endY] =
      game.level.entries[0].route[game.level.entries[0].route.length - 1];
    drawCore(
      ctx,
      Math.min(width - 13, endX * CELL + 7),
      endY * CELL + 7,
      game.time,
      game.time - game.coreHit,
      game.health / level.health,
      still,
    );
    if (showRanges) {
      for (const [index, tower] of game.towers) {
        if (index === selected) continue;
        const stats = towerStats(tower);
        drawRange(
          ctx,
          tower.x * CELL + 8,
          tower.y * CELL + 8,
          stats.range,
          stats.color ?? TOWERS[tower.type].color,
        );
      }
    }
    if (selected !== null && level.plots[selected]) {
      const [x, y] = game.level.plots[selected],
        building = game.buildingAt(selected);
      if (building && !isGuardPost(building)) {
        drawRange(ctx, x * CELL + 8, y * CELL + 8, towerStats(building).range);
      } else if (!building && hoveredType) {
        const range = isGuardPostId(hoveredType) ? GUARD_BUILDINGS[hoveredType].base.reach : TOWERS[hoveredType].tiers[0].range;
        drawRange(ctx, x * CELL + 8, y * CELL + 8, range);
      }
    }
    game.level.plots.forEach(([x, y], index) => {
      const px = x * CELL,
        py = y * CELL;
      if (index === selected || index === training) {
        ctx.strokeStyle = index === training ? "#fff1a9" : "#f5e9a6";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1.5, py + 1.5, 13, 12);
      }
      if (!game.buildingAt(index)) {
        drawEmptyPlotPad(ctx, px, py, level);
        ctx.save();
        ctx.globalAlpha = still ? .22 : .225 + .075 * Math.sin(uiTime / 650 + index * .51);
        ctx.strokeStyle = "#ffd38b";
        ctx.lineWidth = .75;
        ctx.strokeRect(px + 2.5, py + 2.5, 11, 11);
        ctx.restore();
        const color =
          index === selected || index === training ? "#fff1b8" : "#dbe3ad";
        box(ctx, px + 7.5, py + 5, 1, 6, color);
        box(ctx, px + 5, py + 7.5, 6, 1, color);
        box(ctx, px + 3.5, py + 3.5, 1, 1, "#aac38c");
        box(ctx, px + 11.5, py + 11.5, 1, 1, "#779768");
      }
      if (index === training) {
        const bob = still ? 0 : Math.floor(uiTime / 200) % 3;
        box(ctx, px + 7.5, py - 6 - bob, 2, 4, "#ffeaa6");
        box(ctx, px + 5.5, py - 3 - bob, 6, 1, "#ffeaa6");
        box(ctx, px + 6.5, py - 2 - bob, 4, 1, "#ffeaa6");
        box(ctx, px + 7.5, py - 1 - bob, 2, 1, "#ffeaa6");
      }
    });
    const visibleEnemies = game.enemies.filter(enemyVisible);
    const units: (Tower | Enemy | { y: number; guard: Guard; post: GuardPost } | { y: number; post: GuardPost })[] = [
      ...game.towers.values(),
      ...visibleEnemies,
    ];
    for (const post of game.guardPosts.values()) {
      if (guardRange === post.index || showRanges) {
        const [x, y] = post.origin;
        const stats = guardStats(post);
        drawRange(ctx, x * CELL + 8, y * CELL + 8, stats.reach,
          showRanges && guardRange !== post.index ? GUARD_BUILDINGS[post.type].color : undefined);
        if (guardRange === post.index) {
          // Secondary ring around the rally point highlights the individual unit's own aggro radius.
          const [rx, ry] = post.rally;
          drawRange(ctx, rx * CELL + 8, ry * CELL + 8, stats.aggro, GUARD_BUILDINGS[post.type].color);
        }
      }
      units.push({ y: post.origin[1], post });
      for (const guard of post.guards) {
        if (guard.hp > 0 || game.time - guard.hurtAt < 0.32) units.push({ y: guard.y, guard, post });
      }
    }
    drawFootprints(ctx, visibleEnemies, game.time, still);
    const lit = beaconTargets(game.devices, visibleEnemies, game.time);
    for (const enemy of lit ?? [])
      pixelOval(ctx, enemy.x * CELL + 8, enemy.y * CELL + 9, 7.5, 4, 16, "#edf8a4", 1);
    for (const enemy of visibleEnemies) drawEnemyWarningGround(ctx, enemy, game.time);
    for (const effect of game.effects) {
      if (tunnels.some((tunnel) => overTunnel(tunnel, effect.x, effect.y))) continue;
      drawGroundEffect(ctx, effect, still);
    }
    units.sort((a, b) => a.y - b.y);
    let flashes = 0, guardEffects = 0;
    for (const unit of units) {
      if ("guard" in unit) {
        drawGuard(ctx, unit.guard, game.time, unit.post, still, level.biome, guardEffects++ < 24);
        if (unit.guard.switchDuty) {
          const x = unit.guard.x * CELL + 8, y = unit.guard.y * CELL - 3;
          box(ctx, x - 2, y, 4, 2, "#ffe6a0");
          box(ctx, x - 1, y + 2, 2, 1, "#ffe6a0");
        }
        continue;
      } else if ("post" in unit) {
        drawGuardPost(ctx, unit.post, game.time, level.towerStyle, still);
        continue;
      } else if ("hp" in unit) {
        const hit = unit.projectileImpact;
        const fresh = hit && game.time - hit.time < .1 && lastImpact.get(unit) !== hit;
        if (hit) lastImpact.set(unit, hit);
        drawEnemy(ctx, unit, game.time, still, !still && fresh && flashes++ < 24 ? hit : undefined);
        continue;
      }
      const tower = unit;
      const stats = towerStats(tower);
      const age = tower.frost ? Infinity : game.time - tower.fired - TOWERS[tower.type].flight[0];
      drawTower(
        ctx,
        tower.x * CELL + 8,
        tower.y * CELL + 9,
        tower.type,
        tower.tier,
        tower.path,
        {
          heading: age < 0.14 ? tower.launchHeading : tower.heading,
          style: level.towerStyle,
          time: game.time,
          age,
          load: 1 - Math.min(1, tower.cooldown / stats.interval),
          reducedMotion: still,
          focus: tower.focus?.since !== undefined && stats.focus
            ? Math.min(1, (game.time - tower.focus.since) / stats.focus.seconds) : 0,
          built: tower.builtAt === undefined ? Infinity : game.time - tower.builtAt,
          upgraded: tower.upgradedAt === undefined ? Infinity : game.time - tower.upgradedAt,
          previous: tower.previous,
        },
      );
      if (tower.frost) drawFrozenTower(ctx, tower.x * CELL + 8, tower.y * CELL + 9, tower.frost, game.time, still);
    }
    drawDeviceCarts(ctx, game.devices, game.time, still);
    for (const shot of game.projectiles) drawProjectile(ctx, shot, still);
    for (const shot of game.guardQuills) drawGuardQuill(ctx, shot, game.time, still);
    let debris = 0, spearFlashes = 0;
    for (const effect of game.effects) {
      if (tunnels.some((tunnel) => overTunnel(tunnel, effect.x, effect.y))) continue;
      if (effect.fallen) {
        drawEnemyDefeat(ctx, effect.fallen, 1 - effect.life / effect.total, still);
        if (!still && effect.total - effect.life < .3 && debris++ < 24) drawDefeatDebris(ctx, effect, effect.fallen);
      }
      const spareSpearFlash = effect.kind !== "guard-spear" || effect.total - effect.life >= .065 || spearFlashes++ < 24;
      drawEffect(ctx, effect, still, spareSpearFlash);
    }
    for (const enemy of visibleEnemies) {
      drawEnemyWarning(ctx, enemy, game.time);
      if (enemy.action?.phase !== "windup" || !enemy.iceTargets) continue;
      for (const [plot, tower] of enemy.iceTargets) {
        if (game.towers.get(plot) === tower)
          drawFreezeMark(ctx, tower.x * CELL + 8, tower.y * CELL + 9, enemy.action.progress, game.time);
      }
    }
  }
  return draw;
}
