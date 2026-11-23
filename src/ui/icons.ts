const ICONS = {
  range: '<circle cx="12" cy="12" r="7"/><path d="M12 2v6m0 8v6M2 12h6m8 0h6"/>',
  expand: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
  shrink: '<path d="M4 9h5V4m11 5h-5V4M4 15h5v5m11-5h-5v5"/>',
  shield: '<path d="M12 3l7 3v6c0 4-4 7-7 9-3-2-7-5-7-9V6zM8 13c3-3 5 3 8 0"/>',
  spear: '<path d="M4 20 15 9m-2-2 8-4-4 8-4-4zm-3 6 3 3"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8m-2-7h3.2a1.5 1.5 0 0 1 0 3h-2.4a1.5 1.5 0 0 0 0 3H14"/>',
  lantern:
    '<path d="M9 7V5a3 3 0 0 1 6 0v2M7 7h10l2 3-2 10H7L5 10zM6 10h12M8 17h8m-4-6-2 4h4z"/>',
  compass:
    '<path d="M12 2.5 21.5 12 12 21.5 2.5 12zM12 7l2.7 7.7L7 12zM12 2.5v2m0 15v2m7.5-9.5h2m-19 0h2"/>',
  book: '<path d="M4 5h6c2 0 2 2 2 2s0-2 2-2h6v14h-6c-2 0-2 2-2 2s0-2-2-2H4zM12 7v12m-5-9h2m6 0h2m-10 4h2m6 0h2"/>',
  heart: '<path d="M20 9c0 4-8 9-8 9s-8-5-8-9a4 4 0 0 1 8-1 4 4 0 0 1 8 1Z"/>',
  flag: '<path d="M5 21V4m0 1c6-5 8 4 14 0v10c-6 4-8-5-14 0"/>',
  skull:
    '<path d="M7 17H5v-3a7 7 0 1 1 14 0v3h-2v4H7zM10 17v4m4-4v4"/><path d="M8 13h1m6 0h1"/>',
  sound:
    '<path d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/>',
  muted: '<path d="M4 10h4l5-4v12l-5-4H4zm12 0 4 4m0-4-4 4"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 7m-2-7V5m0 6h6"/>',
  play: '<path d="m8 4 13 8-13 8z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M9 5v14m6-14v14" stroke-width="3"/>',
  hammer: '<path d="m13 8-9 9 3 3 9-9m-5-5 3-3 7 7-3 3z"/>',
  upgrade: '<path d="m6 11 6-6 6 6m-12 7 6-6 6 6"/>',
  pointer: '<path d="M5 4l14 8-7 1-3 6z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="m10 3 4 0 1 3 2 1 3-1 2 4-2 2v1l2 2-2 4-3-1-2 1-1 3h-4l-1-3-2-1-3 1-2-4 2-2v-1l-2-2 2-4 3 1 2-1z"/>',
  music: '<path d="M9 18V6l11-2v11M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="15" rx="3" ry="2"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  exit: '<path d="M13 5H5v14h8m-3-7h11m-4-4 4 4-4 4"/>',
  speed: '<path d="m4 7 5 5-5 5m7-10 5 5-5 5"/>',
  trail: '<path d="M3 6h3c4 0 3 12 7 12h8M3 18h3c4 0 3-12 7-12h8m-4-3 4 3-4 3m0 6 4 3-4 3"/>',
  arch: '<path d="M4 21V11a8 8 0 0 1 16 0v10M8 21V11a4 4 0 0 1 8 0v10M2 21h8m4 0h8M12 3v4M5 9l4 1m6 0 4-1"/>',
  water: '<path d="M3 8c3-3 6 3 9 0s6 3 9 0M3 12c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0"/>',
  fence: '<path d="M5 19V5l2-2 2 2v14m6 0V5l2-2 2 2v14M3 9h18M3 15h18M3 21c3-2 6 2 9 0s6 2 9 0"/>',
  pine: '<path d="m12 2 5 7h-3l5 6h-4l4 4H5l4-4H5l5-6H7zm0 17v3"/>',
  pick: '<path d="m6 20 10-12M4 10c4-6 13-6 17 2M11 5l5 3"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3l3 3 3-3m-6 18 3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1M3 14l4 1-1 4M18 5l-1 4 4 1"/>',
  gem: '<path d="m12 2 7 6v8l-7 6-7-6V8zm0 0 3 7v6l-3 7-3-7V9z"/>',
  mire: '<path d="M4 13a8 7 0 0 1 16 0Z"/><path d="M9 13v4a2 2 0 0 0 6 0v-4M3 20c3-2 6 2 9 0s6 2 9 0"/><circle cx="7" cy="5" r="1.2"/><circle cx="17" cy="4" r="1.5"/>',
  flame: '<path d="M12 2.5c2 3.2 5 5.5 5 9.8a5 5 0 0 1-10 0c0-2.4 1-4.3 2.5-5.8.2 1.7 1.1 2.7 2.2 3C11 6.7 11.4 4.4 12 2.5Z"/>',
  sparkle: '<path d="M12 3c0 6 3 9 9 9-6 0-9 3-9 9 0-6-3-9-9-9 6 0 9-3 9-9Z"/>',
};
export const icon = (name: keyof typeof ICONS) =>
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + "</svg>";
export function isIcon(name: string): name is keyof typeof ICONS {
  return Object.hasOwn(ICONS, name);
}
