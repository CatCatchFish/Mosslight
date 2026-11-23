import type { BattlefieldLandmark, BattlefieldLandmarkKind, Level } from "../engine/types.ts";
import type { SceneryReaction } from "../render/battle-details.ts";
import { $ } from "./dom.ts";

const details = {
  cabin: {
    name: "木屋的灯",
    note: "点亮了木屋，烟囱里冒出一缕白烟。",
  },
  ruins: {
    name: "石墩上的刻痕",
    note: "石缝中亮起符纹，一圈微光沿石阶散开。",
  },
  reeds: {
    name: "水边的芦苇",
    note: "芦苇晃了晃，一只小蛙跳进了水里。",
  },
  floe: {
    name: "冰溪浮冰",
    note: "浮冰轻轻一晃，冰屑顺溪流走了。",
  },
  skiff: {
    name: "渡口泊船",
    note: "船桨碰了一下船舷，水纹绕过了桥桩。",
  },
  "mine-cart": { name: "掉轮旧矿车", note: "敲了敲旧矿车，车厢里飞出几点火星。" },
  "ore-vein": { name: "岩缝里的矿脉", note: "擦去岩灰，矿脉在灯下闪了几下。" },
  "mire-keep": { name: "苔礁的守堡灯", note: "堡顶的守夜灯在雾中闪了一下。" },
  birdhouse: { name: "松木鸟屋", note: "敲了敲鸟屋，几只山雀扑棱棱飞出来。" },
  campfire: { name: "守林火堆", note: "拨了拨炭火，火星噼啪跃起。" },
  "fish-trap": { name: "浅滩鱼篓", note: "碰了碰鱼篓，篓口冒出一串气泡。" },
  "drift-buoy": { name: "漂流水灯", note: "水灯轻轻一荡，灯影顺着水纹散开。" },
  "lily-bell": { name: "莲铃浮叶", note: "拨动浮叶，莲铃叮的一声，水纹荡开。" },
  "rail-lantern": { name: "矿轨风灯", note: "碰了碰风灯，灯芯轻摆，溅出几点矿火。" },
  "hand-pump": { name: "旧手压泵", note: "压了两下手柄，泵口喷出一小股清水。" },
  "ice-chime": { name: "冰棱风铃", note: "冰棱碰在一起，细碎铃声飘进寒风。" },
  "snow-lantern": { name: "雪灯", note: "擦亮雪灯，暖光在冰面上晃了一圈。" },
  "bog-idol": { name: "苔沼石偶", note: "拂开青苔，石偶的眼睛亮起两点幽光。" },
  "glow-pod": { name: "荧光孢囊", note: "轻碰孢囊，细碎荧光孢子散进雾里。" },
} as const satisfies Record<
  BattlefieldLandmark["kind"],
  { name: string; note: string }
>;

export function mountBattleScenery(
  level: Level,
  notify: (text: string) => void,
  interact: (kind: BattlefieldLandmarkKind) => void,
) {
  const layer = $("battle-scenery");
  layer.replaceChildren();
  return (level.scenery ?? []).map((landmark) => {
    const reaction: SceneryReaction = { landmark, at: -Infinity, lit: false };
    const { name, note } = details[landmark.kind];
    const low = ["reeds", "floe", "skiff", "fish-trap", "drift-buoy", "lily-bell", "glow-pod"]
      .includes(landmark.kind);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenery-hit";
    button.setAttribute("aria-label", name);
    const [x, y] = landmark.at;
    button.style.left = `${((x + 0.5) * 100) / level.width}%`;
    button.style.top = `${((y + (low ? 0.5 : 0.32)) * 100) / level.height}%`;
    button.style.width = `${140 / level.width}%`;
    button.style.height = `${(low ? 88 : 120) / level.height}%`;
    button.addEventListener("click", () => {
      const cabin = landmark.kind === "cabin";
      reaction.at = performance.now();
      if (cabin) reaction.lit = !reaction.lit;
      interact(landmark.kind);
      notify(
        cabin && !reaction.lit ? "木屋的灯熄了，守夜人打了个哈欠。" : note,
      );
    });
    layer.append(button);
    return reaction;
  });
}
