// Art quality switch. "high" enables sprite shading, extra particles and secondary motion;
// "low" keeps the original lightweight drawing for slower phones.
export type ArtQuality = "high" | "low";

let current: ArtQuality = "high";
const listeners = new Set<(quality: ArtQuality) => void>();

export function artQuality(): ArtQuality {
  return current;
}

export function highQuality() {
  return current === "high";
}

export function setArtQuality(quality: ArtQuality) {
  if (quality === current) return;
  current = quality;
  for (const listener of listeners) listener(quality);
}

export function onArtQualityChange(listener: (quality: ArtQuality) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
