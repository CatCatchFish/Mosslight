import { clamp } from "../engine/route.ts";
import { $ } from "./dom.ts";
import { icon } from "./icons.ts";

const BUTTON_ZOOM = 1.6;
const MAX_ZOOM = 3;
const DRAG_THRESHOLD = 6;
const KEY_STEP = 48;
const directions = {
  ArrowLeft: [1, 0],
  ArrowRight: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
} as const;

interface Position {
  x: number;
  y: number;
}

type Gesture =
  | { kind: "drag"; start: Position; offset: Position; moved: boolean }
  | { kind: "pinch"; center: Position; distance: number };

export function mountBattleViewport() {
  const space = $("battle-space");
  const world = $("battle-world");
  const toggle = $("battle-viewport");
  const hint = $("battle-pan-hint");
  const pointers = new Map<number, Position>();
  let scale = 1, x = 0, y = 0;
  let viewWidth = 0, viewHeight = 0, worldWidth = 0, worldHeight = 0;
  let gesture: Gesture | undefined;
  let suppressClick = false;

  function updateControls() {
    const zoomed = scale > 1;
    space.classList.toggle("zoomed", zoomed);
    hint.hidden = !zoomed;
    toggle.innerHTML = icon(zoomed ? "shrink" : "expand") + (zoomed ? "<span>还原</span>" : "<span>放大</span>");
    toggle.setAttribute("aria-pressed", String(zoomed));
    toggle.setAttribute("aria-label", zoomed ? "还原战场" : "放大战场");
    toggle.title = zoomed ? "双指缩放或拖动查看 · Z 还原" : "放大战场（Z）或用双指缩放";
  }

  function setView(nextScale: number, nextX: number, nextY: number) {
    const wasZoomed = scale > 1;
    scale = clamp(nextScale, 1, MAX_ZOOM);
    const zoomed = scale > 1;
    const limitX = zoomed ? Math.max(0, (worldWidth * scale - viewWidth) / 2) : 0;
    const limitY = zoomed ? Math.max(0, (worldHeight * scale - viewHeight) / 2) : 0;
    x = clamp(nextX, -limitX, limitX);
    y = clamp(nextY, -limitY, limitY);
    world.style.transform = zoomed ? `translate3d(${x}px, ${y}px, 0) scale(${scale})` : "";
    if (zoomed !== wasZoomed) updateControls();
    if (zoomed) {
      const label = `${Number(scale.toFixed(2))}× · 拖动查看`;
      if (hint.textContent !== label) hint.textContent = label;
    }
  }

  function fitBounds() {
    const view = space.getBoundingClientRect();
    const board = world.getBoundingClientRect();
    viewWidth = view.width;
    viewHeight = view.height;
    worldWidth = board.width / scale;
    worldHeight = board.height / scale;
    setView(scale, x, y);
  }

  function resetView(nextScale: number) {
    const ids = [...pointers.keys()];
    pointers.clear();
    gesture = undefined;
    for (const id of ids)
      if (space.hasPointerCapture(id)) space.releasePointerCapture(id);
    space.classList.remove("dragging");
    fitBounds();
    setView(nextScale, 0, 0);
  }

  function toggleZoom() {
    resetView(scale > 1 ? 1 : BUTTON_ZOOM);
  }

  function startDrag(start: Position, moved = false): Gesture {
    return { kind: "drag", start, offset: { x, y }, moved };
  }

  function measurePinch(): Extract<Gesture, { kind: "pinch" }> {
    const [a, b] = pointers.values();
    return {
      kind: "pinch",
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.max(8, Math.hypot(a.x - b.x, a.y - b.y)),
    };
  }

  function endPointer(id: number) {
    if (!pointers.delete(id)) return;
    const remaining = pointers.values().next().value;
    gesture = remaining ? startDrag(remaining, true) : undefined;
    if (space.hasPointerCapture(id)) space.releasePointerCapture(id);
    if (!remaining) space.classList.remove("dragging");
  }

  const resize = new ResizeObserver(fitBounds);
  resize.observe(space);
  resize.observe(world);

  toggle.addEventListener("click", toggleZoom);
  space.addEventListener("pointerdown", (event) => {
    if (pointers.size === 0) suppressClick = false;
    if (event.button !== 0 || pointers.size >= 2 ||
        (event.pointerType !== "touch" && (!event.isPrimary || scale === 1))) return;
    if (event.target instanceof Element && event.target.closest("#battle-viewport,#battle-settings")) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    if (pointers.size === 1) {
      gesture = startDrag(point);
    } else {
      gesture = measurePinch();
      suppressClick = true;
      for (const id of pointers.keys()) space.setPointerCapture(id);
      space.classList.add("dragging");
    }
  });
  space.addEventListener("pointermove", (event) => {
    if (!gesture || !pointers.has(event.pointerId)) return;
    if (event.buttons === 0) {
      endPointer(event.pointerId);
      return;
    }
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    if (gesture.kind === "pinch") {
      const current = measurePinch();
      const targetScale = clamp(scale * current.distance / gesture.distance, 1, MAX_ZOOM);
      const ratio = targetScale / scale;
      const { left, top } = space.getBoundingClientRect();
      const cx = left + viewWidth / 2, cy = top + viewHeight / 2;
      // Keep the map point under the old midpoint beneath the moving fingers.
      setView(targetScale, current.center.x - cx - (gesture.center.x - cx - x) * ratio,
        current.center.y - cy - (gesture.center.y - cy - y) * ratio);
      gesture = current;
    } else {
      const dx = point.x - gesture.start.x, dy = point.y - gesture.start.y;
      if (!gesture.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        gesture.moved = suppressClick = true;
        space.setPointerCapture(event.pointerId);
        space.classList.add("dragging");
      }
      setView(scale, gesture.offset.x + dx, gesture.offset.y + dy);
    }
    event.preventDefault();
  });
  for (const eventName of ["pointerup", "pointercancel"] as const)
    window.addEventListener(eventName, (event) => endPointer(event.pointerId));
  space.addEventListener("lostpointercapture", (event) => {
    if (event.target === space) endPointer(event.pointerId);
  });
  space.addEventListener("click", (event) => {
    if (!suppressClick || event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  space.addEventListener("keydown", (event) => {
    if (scale === 1 || event.ctrlKey || event.metaKey || event.altKey || !Object.hasOwn(directions, event.key)) return;
    event.preventDefault();
    const [dx, dy] = directions[event.key as keyof typeof directions];
    setView(scale, x + dx * KEY_STEP, y + dy * KEY_STEP);
  });
  world.addEventListener("focusin", (event) => {
    if (scale === 1 || !(event.target instanceof HTMLElement) || !event.target.matches(":focus-visible")) return;
    const visible = space.getBoundingClientRect();
    const target = event.target.getBoundingClientRect();
    const dx = Math.max(0, visible.left - target.left) - Math.max(0, target.right - visible.right);
    const dy = Math.max(0, visible.top - target.top) - Math.max(0, target.bottom - visible.bottom);
    if (dx || dy) setView(scale, x + dx, y + dy);
  });
  updateControls();

  return {
    get zoomed() { return scale > 1; },
    get view() {
      const width = worldWidth * scale, height = worldHeight * scale;
      return {
        width: viewWidth,
        height: viewHeight,
        board: { x: (viewWidth - width) / 2 + x, y: (viewHeight - height) / 2 + y, width, height },
      };
    },
    toggle: toggleZoom,
    refresh: fitBounds,
    reset: () => resetView(1),
  };
}
