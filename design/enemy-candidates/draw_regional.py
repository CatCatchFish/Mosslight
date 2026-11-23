"""Paint four directions and eight animation poses for the new regional candidates."""
from functools import partial
from pathlib import Path
import argparse

from PIL import Image
from draw_enemies import FACINGS, SIZE, make_view


def moss_badger(r, p, facing, frame):
    ink, coat, moss, light, mask = "#232c25", "#576052", "#68894b", "#9cb65f", "#d5d2a6"
    side, rear = facing == "east", facing == "north"
    attack = frame >= 4
    z = [0, -1, 0, -1, 3, 5, 0, -2][frame]
    stride = [3, 1, -3, -1, -2, -3, 5, 1][frame]
    for i, x in enumerate((-13, -5, 5, 12)):
        step = stride if i % 2 else -stride
        p(ink, (x - 3, -10), (x + 3, -9), (x + step + 4, 2), (x + step - 4, 2))
        r(coat, x + step - 2, -1, 4, 2)
    p(ink, (-21, -5+z), (-22, -14+z), (-16, -25+z), (-5, -28+z),
      (9, -26+z), (17, -20+z), (21, -9+z), (15, -3+z), (-13, -3+z))
    p(coat, (-19, -7+z), (-17, -21+z), (-5, -26+z), (10, -24+z),
      (17, -15+z), (18, -8+z), (12, -5+z), (-13, -5+z))
    p(moss, (-19, -17+z), (-13, -25+z), (-5, -30+z), (2, -27+z), (11, -28+z),
      (14, -24+z), (7, -20+z), (-3, -19+z), (-10, -15+z))
    for x, y, w in [(-12,-24,5),(-5,-27,4),(3,-25,7),(-15,-20,5)]:
        r(light, x, y+z, w, 2)
    h = 11 if side else 0
    if not rear:
        p(mask, (h-8, -18+z), (h-4, -23+z), (h+5, -20+z),
          (h+(15 if side else 8), -10+z), (h+3, -5+z), (h-5, -8+z))
        for x in ((h+4,) if side else (-6, 4)):
            r(ink, x, -16+z, 4, 3)
            r("#ffda8e", x+1, -16+z, 1, 1)
        r(ink, h+(12 if side else -1), -10+z, 4, 3)
    if attack:
        for i, x in enumerate((10, 14, 18) if side else (-9, 0, 9)):
            y = 0 - (i * 3 if frame in (5, 6) else 0)
            r("#ce9a60", x, y, 3, 2)
            r("#a17447", x+3, y+2, 2, 1)


def mirror_shrimp(r, p, facing, frame):
    ink, jade, glass, glint, coral = "#23454a", "#4f8f8e", "#72c9ba", "#d6fae4", "#e29477"
    side, rear = facing == "east", facing == "north"
    t = [0, 2, -1, -2, -4, -6, 5, 1][frame]
    for sign in (-1, 1):
        for i in range(3):
            x = sign * (6 + i * 3)
            y = -8 + ((-1) ** i) * (t // 2)
            p(ink, (x, y-3), (x+sign*7, y-1), (x+sign*11, y+5), (x+sign*7, y+4))
            r(coral, x+sign*5-1, y, 3, 1)
    p(ink, (-23,-6),(-18,-13),(-14,-23),(-3,-28),(12,-24),(19,-15),(16,-7),(5,-2),(-15,-2))
    p(jade, (-21,-6),(-15,-14),(-13,-22),(-3,-26),(11,-22),(17,-15),(14,-8),(4,-4),(-14,-4))
    for x, y in [(-15,-12),(-9,-20),(-2,-23),(5,-22),(11,-18)]:
        p(glass, (x-4,y+5),(x,y),(x+6,y+2),(x+2,y+9))
        r(glint, x, y+2, 3, 1)
    for sign in ((1,) if side else (-1, 1)):
        cx = 12*sign + (t if side else t*sign)
        cy = (-16 if side else -13) - abs(t)
        p(ink, (cx-7,cy+3),(cx-6,cy-6),(cx-1,cy-10),(cx+7,cy-9),
          (cx+9,cy-3),(cx+5,cy-2),(cx+9,cy+3),(cx+3,cy+6),(cx-3,cy+6))
        p(glass, (cx-5,cy+2),(cx-4,cy-5),(cx,cy-8),(cx+6,cy-7),
          (cx+3,cy-2),(cx+7,cy+3),(cx+3,cy+4))
        r(glint, cx-3, cy-5, 4, 2)
    if not rear:
        for x in ((10, 14) if side else (-5, 4)):
            r(ink,x,-18,3,3)
            r("#fff0b1",x+1,-18,1,1)
    if frame == 6:
        for dx, dy in [(-22,-18),(-12,-35),(1,-34),(14,-31),(24,-18)]:
            r("#c2fff6",dx,dy,3,2)
            r(glass,dx+1,dy+3,2,2)


def rivet_mite(r, p, facing, frame):
    ink, dark, copper, edge = "#30272d", "#5f4c50", "#9f674e", "#ca9368"
    side, rear = facing == "east", facing == "north"
    shift = [0, 2, 1, -2, -2, -4, 6, 2][frame]
    for x in (-14, -6, 5, 13):
        p(ink, (x-4,-10),(x+4,-8),(x+shift+5,1),(x+shift-4,2))
        r(dark,x+shift-2,-4,5,4)
        r(edge,x+shift,-4,2,2)
    p(ink, (-23,-7),(-24,-18),(-17,-27),(-4,-29),(12,-27),(22,-21),(25,-12),(20,-5),(-14,-4))
    p(copper, (-21,-8),(-21,-18),(-15,-25),(-4,-27),(11,-25),(20,-20),(23,-12),(18,-7),(-13,-6))
    for x, y in [(-16,-21),(-7,-24),(3,-23),(12,-20)]:
        p(dark,(x-5,y+1),(x+3,y-3),(x+7,y+2),(x+5,y+12),(x-2,y+13))
        r(edge,x,y,4,2)
        r("#ffbf60" if frame >= 4 else "#7d5a54",x,y+6,3,2)
    hx = 16 if side else 0
    p(dark,(hx-8,-13),(hx-5,-21),(hx+7,-19),(hx+9,-11),(hx+3,-6),(hx-6,-6))
    if not rear:
        r("#ffe6a8", hx+2, -14, 4, 2)
    if frame in (5, 6):
        for x, y in [(-24,-6),(-19,-3),(19,-25),(23,-21)]:
            r("#f7b675",x,y,3,2)


PAINTERS = {
    "moss-badger": moss_badger, "mirror-shrimp": mirror_shrimp, "rivet-mite": rivet_mite,
}


def export(output):
    output.mkdir(parents=True, exist_ok=True)
    for name, painter in PAINTERS.items():
        sheet = Image.new("RGBA", (SIZE * len(FACINGS), SIZE * 8))
        for frame in range(8):
            views = [make_view(partial(painter, frame=frame), facing) for facing in FACINGS]
            if views[0].getchannel("A").histogram() != views[2].getchannel("A").histogram():
                raise ValueError(f"{name} frame {frame} clips facing west")
            for column, view in enumerate(views):
                sheet.paste(view, (column * SIZE, frame * SIZE))
        sheet.save(output / f"{name}.png", optimize=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    export(parser.parse_args().output)
