import { STAGES } from "../content/campaign.ts";
import { SAVE_KEY } from "./save.ts";
import type { SaveBackend } from "./save.ts";

export const DEBUG_UNLOCK_ALL = import.meta.env?.MODE === "debug-unlocks";
export const DEBUG_SAVE_KEY = "mosslight-expedition.debug-save.v1";

const ratings: Record<string, 3> = {};
for (const stage of STAGES) if (stage.level) ratings[stage.id] = 3;
export const DEBUG_CLEAR_RATINGS: Readonly<Record<string, 3>> = Object.freeze(ratings);

function object(value: string | null): Record<string, unknown> | null {
  try {
    const parsed: unknown = value === null ? null : JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function withFullClear(value: string | null): string | null {
  if (value === null)
    return JSON.stringify({ version: 1, ratings: DEBUG_CLEAR_RATINGS });
  const data = object(value);
  if (!data || data.version !== 1) return value;
  return JSON.stringify({
    ...data,
    ratings: {
      ...(typeof data.ratings === "object" && data.ratings !== null &&
        !Array.isArray(data.ratings) ? data.ratings : {}),
      ...DEBUG_CLEAR_RATINGS,
    },
  });
}

export function debugUnlockedBackend(backend: SaveBackend): SaveBackend {
  return {
    async read(key) {
      if (key !== SAVE_KEY) return backend.read(key);
      const debug = await backend.read(DEBUG_SAVE_KEY);
      const source = debug ?? await backend.read(SAVE_KEY);
      const seeded = withFullClear(source);
      if (seeded !== null && seeded !== debug) {
        await backend.write(DEBUG_SAVE_KEY, seeded).catch(() => {});
      }
      return seeded;
    },
    write(key, value) {
      return backend.write(key === SAVE_KEY ? DEBUG_SAVE_KEY : key, value);
    },
  };
}