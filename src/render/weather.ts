import { WEATHER, weatherAtWave } from "../content/weather.ts";
import type {
  WeatherId,
  WeatherParticles,
  WeatherPlan,
  WeatherPreset,
  WeatherVignette,
} from "../content/weather.ts";
import { CELL } from "../engine/route.ts";
import { box, canvas2d } from "./canvas.ts";
import type { SceneBounds } from "./canvas.ts";
import { highQuality } from "./quality.ts";
import { seeded } from "./terrain.ts";

const FADE_SECONDS = 2.4;
const STANDARD_AREA = 22 * 13 * CELL ** 2;
const wrap = (value: number, span: number) => (value % span + span) % span;
const rainLanding = (index: number, height: number) => (index * 37 + 11) % height;
const firstRepeat = (value: number, span: number, lower: number) =>
  value + Math.ceil((lower - value) / span) * span;

function hexAlpha(alpha: number) {
  return Math.max(0, Math.min(255, Math.round(alpha * 255))).toString(16).padStart(2, "0");
}

function mistTexture(color: string) {
  const texture = document.createElement("canvas");
  texture.width = 128;
  texture.height = 32;
  const ctx = canvas2d(texture);
  // Draw a soft, horizontal bank once and reuse it for each drifting patch.
  ctx.scale(4, 1);
  const mist = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  mist.addColorStop(0, color + "cc");
  mist.addColorStop(0.42, color + "85");
  mist.addColorStop(0.75, color + "36");
  mist.addColorStop(1, color + "00");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, 32, 32);
  return texture;
}

function vignetteTexture({ color, opacity }: WeatherVignette) {
  const texture = document.createElement("canvas");
  texture.width = texture.height = 128;
  const ctx = canvas2d(texture);
  const shade = ctx.createRadialGradient(64, 64, 28, 64, 64, 88);
  shade.addColorStop(0, color + "00");
  shade.addColorStop(0.55, color + hexAlpha(opacity * 0.22));
  shade.addColorStop(1, color + hexAlpha(opacity));
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 128, 128);
  return texture;
}

function drawRainSplashes(
  ctx: CanvasRenderingContext2D, time: number, wind: number, fall: number,
  width: number, height: number, weight: number, isWater: (x: number, y: number) => boolean,
  points: readonly { x: number; y: number; size: number }[],
  splash: { readonly count: number; readonly radius: number },
) {
  ctx.strokeStyle = "#dcf5ff";
  ctx.lineWidth = .5;
  const landings = Math.min(points.length, Math.round(splash.count * width * height / STANDARD_AREA));
  for (let i = 0; i < landings; i++) {
    const point = points[i];
    const landing = rainLanding(i, height);
    const age = wrap(point.y + time * fall * point.size - landing, height) / (fall * point.size);
    if (time < age || age > .15) continue;
    const landedAt = time - age;
    const x = wrap(point.x + (landedAt * wind + 6 * Math.sin(landedAt * .57)) * point.size, width);
    const water = isWater(x, landing);
    const radius = (1 + age * 9) * splash.radius;
    ctx.globalAlpha = weight * (1 - age / .15) * (water ? .65 : .42);
    ctx.beginPath();
    ctx.ellipse(x, landing, radius, radius * .55, 0, 0, Math.PI * 2);
    if (water && age > .02) {
      ctx.moveTo(x + radius * .55, landing);
      ctx.ellipse(x, landing, radius * .55, radius * .3, 0, 0, Math.PI * 2);
      if (splash.radius > 1) {
        ctx.moveTo(x + radius * .82, landing);
        ctx.ellipse(x, landing, radius * .82, radius * .42, 0, 0, Math.PI * 2);
      }
    }
    ctx.stroke();
  }
}

function drawDriftingParticle(
  ctx: CanvasRenderingContext2D,
  style: Exclude<WeatherParticles["style"], "rain">,
  x: number,
  y: number,
  size: number,
  phase: number,
  color: string,
) {
  switch (style) {
    case "leaves": {
      const tilt = Math.sin(phase);
      box(ctx, x, y, 1.75 * size, 0.8, color);
      box(ctx, x + tilt * size, y + 0.75, 0.85 * size, 0.75, "#ab803f");
      break;
    }
    case "dust":
      box(ctx, x, y, size * 1.65, 0.65, color);
      if (size > 1.1) box(ctx, x - 2.8, y + 0.25, 2.4, 0.4, color + "68");
      break;
    case "snow":
      box(ctx, x, y, size, size, color);
      if (size > 1.2) box(ctx, x - 0.5, y + 0.5, size + 1, 0.5, color + "78");
      break;
    case "sleet":
      box(ctx, x, y, size * 1.1, size * 0.9, color);
      box(ctx, x - 2.2 * size, y - 1.2 * size, size * 2.2, 0.55, color + "85");
      break;
    case "crystal":
      box(ctx, x, y - 0.5, 0.65, 2 * size, color);
      box(ctx, x - 0.5 * size, y + 0.25, 1.65 * size, 0.65, color);
      break;
    case "spore":
      // Crisp drifting seed; no trailing streak.
      box(ctx, x, y, 1.05 * size, 1.05 * size, color);
      box(ctx, x + .15 * size, y - 1.2 * size, .5 * size, .7 * size, color);
      break;
    case "ember": {
      const glow = 0.75 + 0.35 * Math.sin(phase * 2.4);
      box(ctx, x - 0.7 * size, y - 0.7 * size, 2.2 * size * glow, 2.2 * size * glow, "#ff5e2b50");
      box(ctx, x, y, 1.05 * size, 0.95 * size, color);
      if (size > 1.05) box(ctx, x + 0.2, y + 0.1, 0.55 * size, 0.55 * size, "#fff4b8");
      break;
    }
  }
}

function prepareWeather(id: WeatherId, preset: WeatherPreset, width: number, height: number, seed: number,
  isWater: (x: number, y: number) => boolean) {
  const random = seeded(seed);
  const { tint, mist, particles, bubbles, lightning, windStreaks } = preset;
  const texture = mist && mistTexture(mist.color);
  const vignette = preset.vignette && vignetteTexture(preset.vignette);
  const sun = (id === "breeze" || id === "clear") && mistTexture("#ffdf99");
  const banks = mist ? Array.from({ length: 6 }, (_, i) => ({
    x: (i * 0.22 - 0.2 + random() * 0.14) * width,
    y: (0.10 + (i % 3) * 0.31 + random() * 0.15) * height,
    phase: random() * Math.PI * 2,
    width: width * (0.45 + random() * 0.28),
    height: 18 + random() * 34,
  })) : [];
  const count = particles ? Math.min(200, Math.round(particles.count * width * height / STANDARD_AREA)) : 0;
  const points = Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    phase: random() * Math.PI * 2,
    size: (0.65 + random() * 0.8) * (particles?.scale ?? 1),
  }));
  const streakRandom = seeded(seed + 547);
  const streaks = windStreaks
    ? Array.from({ length: Math.min(24, Math.max(6, Math.round(windStreaks.count * width * height / STANDARD_AREA))) }, () => ({
        x: streakRandom() * width,
        y: streakRandom() * height,
        phase: streakRandom() * Math.PI * 2,
        scale: 0.72 + streakRandom() * 0.65,
      }))
    : [];
  const bubbleRandom = seeded(seed + 991);
  const bubblePoints = bubbles
    ? Array.from({ length: 200 }, () => ({
        x: bubbleRandom() * width,
        y: bubbleRandom() * height,
        phase: bubbleRandom() * Math.PI * 2,
        size: .7 + bubbleRandom() * .9,
      })).filter((point) => isWater(point.x, point.y)).slice(0, bubbles.count)
    : [];

  return (ctx: CanvasRenderingContext2D, view: SceneBounds, time: number, weight: number, still: boolean) => {
    if (weight <= 0) return;
    ctx.save();
    const hq = highQuality();
    const right = view.x + view.width, bottom = view.y + view.height;
    if (tint) {
      ctx.globalAlpha = weight;
      ctx.fillStyle = tint;
      ctx.fillRect(view.x - 1, view.y - 1, view.width + 2, view.height + 2);
    }
    if (sun) {
      for (let i = 0; i < 2; i++) {
        ctx.globalAlpha = weight * (i ? .038 : .053);
        const x = width * (.13 + i * .51) + Math.sin(time * .16 + i * 1.9) * width * .15;
        ctx.drawImage(sun, x, height * (.12 + i * .38), width * .42, height * .38);
      }
    }
    if (vignette) {
      ctx.globalAlpha = weight;
      ctx.drawImage(vignette, view.x - 1, view.y - 1, view.width + 2, view.height + 2);
    }
    if (mist && texture) {
      for (const bank of banks) {
        const px = bank.x + time * mist.drift;
        const py = bank.y + 3 * Math.sin(bank.phase + time * 0.34);
        const left = firstRepeat(px, width, view.x - bank.width);
        const top = firstRepeat(py, height, view.y - bank.height);
        ctx.globalAlpha = weight * mist.opacity * (0.8 + 0.2 * Math.sin(bank.phase + time * 0.36));
        for (let y = top; y < bottom; y += height)
          for (let x = left; x < right; x += width)
            ctx.drawImage(texture, x, y, bank.width, bank.height);
      }
    }
    if (windStreaks && !still && streaks.length) {
      const step = hq ? 1 : 2;
      const dx = Math.cos(windStreaks.angle);
      const dy = Math.sin(windStreaks.angle);
      ctx.strokeStyle = windStreaks.color;
      ctx.lineWidth = 0.75;
      for (let i = 0; i < streaks.length; i += step) {
        const s = streaks[i];
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.35 + s.phase);
        if (pulse < 0.18) continue;
        const len = windStreaks.length * s.scale;
        const travel = time * windStreaks.speed * s.scale;
        const sx = firstRepeat(s.x + travel * dx, width, view.x - len);
        const sy = firstRepeat(s.y + travel * dy + Math.sin(time * 1.6 + s.phase) * 3, height, view.y - 12);
        ctx.globalAlpha = weight * windStreaks.opacity * pulse;
        ctx.beginPath();
        for (let py = sy; py < bottom + 12; py += height)
          for (let px = sx; px < right + len; px += width) {
            ctx.moveTo(px, py);
            ctx.lineTo(px - dx * len, py - dy * len);
          }
        ctx.stroke();
      }
    }
    if (particles) {
      const { style, wind, fall, color, opacity } = particles;
      const rain = style === "rain";
      const splash = particles.splash ?? { count: 24, radius: 1 };
      const landingCount = Math.min(points.length, Math.round(splash.count * width * height / STANDARD_AREA));
      if (rain) {
        ctx.beginPath();
        ctx.lineWidth = 0.65;
        ctx.strokeStyle = color;
      }
      const gust = 6 * Math.sin(time * 0.57) + (preset.severity === "severe" ? 8 * Math.sin(time * 1.45) : 0);
      const step = still ? 3 : hq ? 1 : points.length > 120 ? 2 : 1;
      for (let i = 0; i < points.length; i += step) {
        const { x, y, phase, size } = points[i];
        const sway = phase + time * (style === "leaves" || style === "ember" ? 3 : 1.3);
        const drift = rain ? 0 : Math.sin(sway) * (style === "leaves" || style === "ember" ? 4.5 : 2);
        // Tile the field in world coordinates, including strokes that begin just off-screen.
        const left = firstRepeat(x + (time * wind + gust) * size + drift, width, view.x - 10);
        const vertical = y + time * fall * size + drift * .7;
        const lands = rain && !still && i < landingCount;
        const landing = lands ? rainLanding(i, height) : 0;
        const top = lands
          ? landing - height + wrap(vertical - landing, height)
          : firstRepeat(vertical, height, view.y - 10);
        if (!rain) {
          const crisp = style === "snow" || style === "sleet";
          ctx.globalAlpha = weight * opacity * (crisp ? 0.82 + 0.18 * Math.sin(sway) ** 2 : 0.54 + 0.46 * Math.sin(sway) ** 2);
        }
        const limit = lands ? Math.min(bottom + 10, top + 1) : bottom + 10;
        for (let py = top; py < limit; py += height)
          for (let px = left; px < right + 10; px += width) {
            if (rain) {
              const rx = Math.round(px * 2) / 2, ry = Math.round(py * 2) / 2;
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx - wind / fall * 5.5 * size, ry - 5.5 * size);
            } else {
              drawDriftingParticle(ctx, style, px, py, size, sway, color);
            }
          }
      }
      if (rain) {
        ctx.globalAlpha = weight * opacity;
        ctx.stroke();
        if (!still) drawRainSplashes(ctx, time, wind, fall, width, height, weight, isWater, points, splash);
      }
    }
    if (bubbles && !still && bubblePoints.length) {
      for (const point of bubblePoints) {
        const age = (time * .24 + point.phase) % 1;
        const bx = point.x + Math.sin(time * .7 + point.phase) * 1.4;
        const by = point.y - age * bubbles.rise;
        if (age < .72) {
          const r = (.75 + point.size * .8) * (1 - age * .3);
          ctx.globalAlpha = weight * bubbles.opacity * (1 - age * .38);
          ctx.strokeStyle = bubbles.color;
          ctx.lineWidth = .6;
          ctx.beginPath();
          ctx.ellipse(bx, by, r, r * .82, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha *= .3;
          ctx.fillStyle = bubbles.color;
          ctx.fill();
        } else if (age < .92) {
          const pop = (age - .72) / .2;
          ctx.globalAlpha = weight * bubbles.opacity * (1 - pop);
          ctx.strokeStyle = bubbles.color;
          ctx.lineWidth = .65;
          ctx.beginPath();
          ctx.ellipse(point.x, point.y - .72 * bubbles.rise, 2 + pop * 6, (2 + pop * 6) * .45,
            0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    if (lightning && !still) {
      const phase = time % lightning.interval;
      const strike = seed * .013 + Math.floor(time / lightning.interval) * 97;
      if (phase < .34) {
        const k = phase / .34;
        const doubleFlash = phase < .08 ? 1 : phase < .15 ? .35 : phase < .22 ? .72 : .42;
        ctx.globalAlpha = weight * lightning.flashOpacity * (1 - k * .8) * doubleFlash;
        ctx.fillStyle = lightning.flashColor;
        ctx.fillRect(view.x - 1, view.y - 1, view.width + 2, view.height + 2);
        if (phase < .18) {
          const sx = width * (.16 + Math.abs(Math.sin(strike)) * .68);
          ctx.globalAlpha = weight * lightning.boltOpacity * (1 - phase / .22);
          ctx.strokeStyle = lightning.color;
          ctx.lineWidth = 1.15;
          ctx.beginPath();
          let bx = sx;
          ctx.moveTo(bx, view.y - 2);
          let branchStartX = sx, branchStartY = view.y;
          for (let i = 1; i <= 7; i++) {
            bx = sx + Math.sin(strike + i * 2.7) * 8;
            const by = view.y + view.height * (i / 7);
            ctx.lineTo(bx, by);
            if (i === 3) { branchStartX = bx; branchStartY = by; }
          }
          ctx.stroke();
          if (lightning.branch) {
            ctx.lineWidth = 0.7;
            ctx.globalAlpha *= 0.65;
            ctx.beginPath();
            ctx.moveTo(branchStartX, branchStartY);
            const dir = Math.sin(strike * 1.7) >= 0 ? 1 : -1;
            ctx.lineTo(branchStartX + dir * 10, branchStartY + view.height * 0.14);
            ctx.lineTo(branchStartX + dir * 18, branchStartY + view.height * 0.27);
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  };
}

export function createWeatherRenderer(plan: WeatherPlan, width: number, height: number, seed: number,
  isWater: (x: number, y: number) => boolean) {
  const presets = new Set([plan.initial, ...(plan.changes ?? []).map((change) => change.preset)]);
  const layers = new Map<WeatherId, ReturnType<typeof prepareWeather>>();
  for (const id of presets)
    layers.set(id, prepareWeather(id, WEATHER[id], width, height, seed + 251 + layers.size * 67, isWater));

  let snow = 0, lastTime = 0;
  return {
    surface(wave: number, time: number, reducedMotion: boolean) {
      if (time < lastTime) snow = 0;
      const elapsed = Math.max(0, time - lastTime);
      lastTime = time;
      const current = weatherAtWave(plan, wave);
      const preset: WeatherPreset = WEATHER[current];
      const accumulation = preset.accumulation;
      if (accumulation) {
        snow = snow < accumulation.max
          ? Math.min(accumulation.max, snow + elapsed * accumulation.rate)
          : Math.max(accumulation.max, snow - elapsed * accumulation.melt);
      } else {
        snow = Math.max(0, snow - elapsed * .012);
      }
      const wind = preset.particles?.wind ?? 0;
      const maxBend = preset.severity === "severe" ? 1.85 : 1;
      return {
        snow: reducedMotion ? 0 : snow,
        wind: reducedMotion ? 0 : Math.sign(wind) * Math.min(maxBend, Math.abs(wind) / 22),
      };
    },
    draw(ctx: CanvasRenderingContext2D, view: SceneBounds, wave: number, waveStartedAt: number, time: number, reducedMotion: boolean) {
      const current = weatherAtWave(plan, wave);
      const weatherTime = reducedMotion ? 0 : time;
      if (wave > 0 && !reducedMotion && time - waveStartedAt < FADE_SECONDS) {
        const previous = weatherAtWave(plan, wave - 1);
        if (previous !== current) {
          const t = (time - waveStartedAt) / FADE_SECONDS;
          const weight = t * t * (3 - 2 * t);
          layers.get(previous)?.(ctx, view, weatherTime, 1 - weight, false);
          layers.get(current)?.(ctx, view, weatherTime, weight, false);
          return;
        }
      }
      layers.get(current)?.(ctx, view, weatherTime, 1, reducedMotion);
    },
  };
}
