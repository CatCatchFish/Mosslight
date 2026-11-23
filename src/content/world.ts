import type { Point } from "../engine/types.ts";

export interface Landmark {
  id: string;
  name: string;
  pin: Point;
  anchor: Point;
  story: string;
}

// 主线节点坐标以主线画布像素为单位，序号和 LEVELS 使用相同顺序。
export const WORLD_WIDTH = 460,
  WORLD_HEIGHT = 256;
export const SLUICE_CROSSING = { west: [163, 171], east: [209, 171] } as const;
export const WAYPOINTS: readonly Point[] = [
  [42, 204],
  [101, 224],
  [160, 197],
  [185, 171],
  [233, 201],
  [287, 188],
  [346, 213],
  [411, 183],
  [419, 128],
  [381, 92],
  [323, 77],
  [266, 106],
  [202, 84],
  [164, 118],
  [118, 98],
  [138, 56],
  [82, 52],
  [44, 94],
];
export const REGION_SIGNS: readonly Point[] = [
  [95, 183],
  [253, 229],
  [380, 239],
  [348, 47],
  [124, 34],
];
export const MAP_ANIMALS = [
  {
    kind: "fox",
    at: [72, 153],
    name: "红尾狐",
    note: "红尾狐竖起耳朵，把松果藏到了树根后。",
  },
  {
    kind: "duck",
    at: [224, 121],
    name: "河鸭",
    note: "河鸭拍了拍水，鱼群一下子散开了。",
  },
  {
    kind: "hare",
    at: [414, 65],
    name: "雪兔",
    note: "雪兔扑进雪堆，只留下两只耳朵在外面。",
  },
] as const satisfies readonly { kind: string; at: Point; name: string; note: string }[];
export const MAP_LANDMARKS: readonly Landmark[] = [
  {
    id: "hut",
    name: "门槛上的爪印",
    pin: [49, 162],
    anchor: [46, 181],
    story:
      "林场小屋门口挂着纸条：「备用钥匙在花盆下面。」一串狐狸爪印绕了三个圈，最后停在信箱前。",
  },
  {
    id: "ferry",
    name: "靠岸的渡船",
    pin: [211, 233],
    anchor: [218, 226],
    story:
      "船夫把量水尺刻成鱼的样子，只有水退到鱼尾露出来才开船。船头的苔灯一直亮着，像是在等下一趟。",
  },
  {
    id: "lookout",
    name: "山顶的风旗",
    pin: [389, 40],
    anchor: [371, 67],
    story:
      "瞭望台顶上有两面小旗，风一大就指向不同的方向。守岗的人干脆在下面画了支箭：「朝好景色走。」",
  },
];
