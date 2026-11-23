import { LOADOUT_LIMIT, validTowerSelection } from "../content/towers.ts";
import type { BuildingId } from "../engine/types.ts";
import type { ArtQuality } from "../render/quality.ts";

export interface SaveBackend {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
}

export type Rating = 1 | 2 | 3;
export interface SaveData {
  readonly version: 1;
  readonly ratings: Readonly<Record<string, Rating>>;
  readonly landmarks: readonly string[];
  readonly sound: boolean;
  readonly music: boolean;
  readonly ambience: boolean;
  readonly soundVolume: number;
  readonly musicVolume: number;
  readonly artQuality: ArtQuality;
  readonly loadouts: Readonly<Record<string, readonly BuildingId[]>>;
}

export const GLOBAL_LOADOUT_KEY = "global";

export const SAVE_KEY = "mosslight-expedition.save";
const LEGACY_CAMPAIGN = "emerald-riftwatch.campaign.v1";
const LEGACY_LANDMARKS = "emerald-riftwatch.landmarks.v1";
const DEFAULT_SOUND_VOLUME = 100;
const DEFAULT_MUSIC_VOLUME = 40;

function volumeFrom(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : fallback;
}

function parse(value: string | null): unknown {
  try {
    return value === null ? null : JSON.parse(value);
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ratingsFrom(value: unknown): Record<string, Rating> {
  return isObject(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (pair): pair is [string, Rating] =>
            /^[a-z0-9-]{1,48}$/i.test(pair[0]) &&
            [1, 2, 3].some((rating) => rating === pair[1]),
        ),
      )
    : {};
}

function landmarksFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is string =>
          typeof id === "string" && /^[a-z0-9-]{1,48}$/i.test(id),
      ),
    ),
  ];
}

function loadoutsFrom(value: unknown): SaveData["loadouts"] {
  if (!isObject(value)) return {};
  const entries: [string, BuildingId[]][] = [];
  for (const [id, selection] of Object.entries(value)) {
    if (!/^[a-z0-9-]{1,48}$/i.test(id)) continue;
    const types = validTowerSelection(selection).slice(0, LOADOUT_LIMIT);
    if (types.length) entries.push([id, types]);
  }
  return Object.fromEntries(entries);
}

const empty = (): SaveData => ({
  version: 1,
  ratings: {},
  landmarks: [],
  sound: false,
  music: true,
  ambience: true,
  soundVolume: DEFAULT_SOUND_VOLUME,
  musicVolume: DEFAULT_MUSIC_VOLUME,
  artQuality: "high",
  loadouts: {},
});

export class SaveStore {
  private data: SaveData = empty();
  private pending = Promise.resolve();
  private writable = true;
  private readonly backend: SaveBackend;
  private readonly onError: (error: unknown) => void;

  constructor(
    backend: SaveBackend,
    onError: (error: unknown) => void = () => {},
  ) {
    this.backend = backend;
    this.onError = onError;
  }

  get snapshot(): SaveData {
    return this.data;
  }

  async load() {
    try {
      const current = parse(await this.backend.read(SAVE_KEY));
      if (isObject(current) && current.version === 1) {
        this.data = {
          version: 1,
          ratings: ratingsFrom(current.ratings),
          landmarks: landmarksFrom(current.landmarks),
          sound: current.sound === true,
          music: current.music !== false,
          ambience: current.ambience !== false,
          soundVolume: volumeFrom(current.soundVolume, DEFAULT_SOUND_VOLUME),
          musicVolume: volumeFrom(current.musicVolume, DEFAULT_MUSIC_VOLUME),
          artQuality: current.artQuality === "low" ? "low" : "high",
          loadouts: loadoutsFrom(current.loadouts),
        };
        return;
      }
      if (
        isObject(current) &&
        typeof current.version === "number" &&
        current.version > 1
      ) {
        this.writable = false;
        this.onError(
          new Error("Save data requires a newer version of the game."),
        );
        return;
      }
      const [ratings, landmarks] = await Promise.all([
        this.backend.read(LEGACY_CAMPAIGN),
        this.backend.read(LEGACY_LANDMARKS),
      ]);
      this.data = {
        ...empty(),
        ratings: ratingsFrom(parse(ratings)),
        landmarks: landmarksFrom(parse(landmarks)),
      };
      if (Object.keys(this.data.ratings).length || this.data.landmarks.length)
        await this.flush();
    } catch (error) {
      this.onError(error);
    }
  }

  recordClear(level: string, rating: Rating) {
    if ((this.data.ratings[level] ?? 0) >= rating) return;
    this.data = {
      ...this.data,
      ratings: { ...this.data.ratings, [level]: rating },
    };
    void this.flush();
  }

  discover(id: string) {
    if (this.data.landmarks.includes(id)) return;
    this.data = { ...this.data, landmarks: [...this.data.landmarks, id] };
    void this.flush();
  }

  setSound(sound: boolean) {
    if (this.data.sound === sound) return;
    this.data = { ...this.data, sound };
    void this.flush();
  }

  setMusic(music: boolean) {
    if (this.data.music === music) return;
    this.data = { ...this.data, music };
    void this.flush();
  }

  setAmbience(ambience: boolean) {
    if (this.data.ambience === ambience) return;
    this.data = { ...this.data, ambience };
    void this.flush();
  }

  setVolume(key: "soundVolume" | "musicVolume", value: number) {
    const volume = volumeFrom(value, this.data[key]);
    if (this.data[key] === volume) return;
    this.data = { ...this.data, [key]: volume };
    void this.flush();
  }

  setArtQuality(artQuality: ArtQuality) {
    if (this.data.artQuality === artQuality) return;
    this.data = { ...this.data, artQuality };
    void this.flush();
  }

  setLoadout(level: string, selection: readonly BuildingId[]) {
    if (!/^[a-z0-9-]{1,48}$/i.test(level)) return;
    const types = validTowerSelection(selection).slice(0, LOADOUT_LIMIT);
    const previous = Object.hasOwn(this.data.loadouts, level)
      ? this.data.loadouts[level]
      : [];
    if (!types.length || types.join() === previous.join()) return;
    this.data = { ...this.data, loadouts: { ...this.data.loadouts, [level]: types } };
    void this.flush();
  }

  get globalLoadout(): readonly BuildingId[] {
    return this.data.loadouts[GLOBAL_LOADOUT_KEY] ?? [];
  }

  setGlobalLoadout(selection: readonly BuildingId[]) {
    this.setLoadout(GLOBAL_LOADOUT_KEY, selection);
  }

  async settled() {
    await this.pending;
  }

  private flush() {
    if (!this.writable) return this.pending;
    const value = JSON.stringify(this.data);
    this.pending = this.pending
      .then(() => this.backend.write(SAVE_KEY, value))
      .catch((error) => this.onError(error));
    return this.pending;
  }
}

