"""Paint 8-pose, four-direction atlases for the Frost Ridge grunts in the candidate-sheet style.

Rows 0-3 are the movement cycle, rows 4-7 the active pose (ice-sail glide, hare pounce,
ray dive). Columns are east, south, west, north; the foot origin is (28, 54) in each cell.
All sprites keep x in [-27, +27] so the west flip is 100% lossless.

    python3 design/enemy-candidates/draw_frost_grunts.py src/render/enemy-art
    python3 design/enemy-candidates/draw_frost_grunts.py --preview /tmp/frost-grunts.png
"""
from functools import partial
from pathlib import Path
import argparse

from PIL import Image, ImageDraw
from draw_enemies import FACINGS, SIZE, make_view


# ---------------------------------------------------------------------------
# 1. 冰帆貂 · Ice-sail stoat
# Low-slung winter stoat with cream-white coat, silver-blue underside,
# fierce alert eyes, and a tall crystalline ice-sail tail fin that flares on glide.
# ---------------------------------------------------------------------------
STOAT = dict(
    ink="#2c3f4d",
    shade="#6e8d9c",
    fur="#9eb8c2",
    moon="#eef2dd",
    hi="#fafcf0",
    ice_dark="#4c7c94",
    ice="#7ec0d6",
    tip="#cff1f2",
    nose="#e4a48d",
    glint="#fff2c2",
)


def stoat_tail(p, facing, low, sway, glide):
    """Project the same pair of crystal facets on the tail in every view."""
    c = STOAT
    height = (38 if glide else 31) + sway
    width = 11 if glide else 6
    sweep = -3 if glide else 0
    # Points use (forward, lateral, height) from the trunk center.
    base = (-14, 0, 10)
    hinge = (-20, 2, 15)
    edge = (-24 + sweep, width, height - 6)
    peak = (-21 + sweep, width - 3, height)
    notch = (-14, 0, height - 8)
    spur = (-10, 2, height - 4)
    foot = (-8, 3, 17)

    def project(vertex, sign):
        t, w, h = vertex
        w = w * sign + sway * (h - 10) / (height - 10)
        if facing == "east":
            return t, round(-h + low + w * 0.12)
        direction = 1 if facing == "south" else -1
        return round(w * direction), round(-h + low + t * direction * 0.23)

    def facet(color, sign, *vertices):
        p(color, *(project(vertex, sign) for vertex in vertices))

    if facing != "east":
        p(c["ink"], project(edge, -1), project(peak, -1), project(notch, 1),
            project(peak, 1), project(edge, 1), project(base, 1))
        inner = (edge[0], width - 2, height - 8)
        p(c["ice_dark"], project(inner, -1), project((-15, 0, height - 10), 1),
            project(inner, 1), project((-14, 0, 15), 1))

    for sign in (-1, 1):
        facet(c["ink"], sign, base, hinge, edge, peak, notch, spur, foot)
        facet(c["ice_dark"], sign, (-15, 1, 12), (-20, 2, 17),
            (edge[0] + 1, width - 1, height - 7), (peak[0], width - 3, height - 2),
            notch, (spur[0], 1, height - 6), (-10, 2, 17))
        facet(c["ice"], sign, (-19, 2, 16), (peak[0], width - 3, height - 2),
            (edge[0] + 2, width - 1, height - 7), (-15, 3, height - 11))
        facet(c["tip"], sign, (peak[0], width - 3, height - 2),
            (peak[0] - 1, width - 2, height - 5), (peak[0] + 2, width - 4, height - 6))


def ice_sail_frames(r, p, facing, frame):
    c = STOAT
    glide = frame >= 4
    f = frame % 4
    low = 5 if glide else [2, 1, 0, 1][f]
    stride = 0 if glide else [4, 1, -4, -1][f]
    sway = [-1, 0, 1, 0][f]
    side, rear = facing == "east", facing == "north"

    if side:
        stoat_tail(p, facing, low, sway, glide)

        # Far paws (stride opposite)
        for bx, mult in [(-11, -1), (10, 1)]:
            px = bx + (-5 if glide else mult * stride)
            py = 1 if glide else (0 if mult * stride > 0 else 1)
            p(c["ink"], (bx - 3, -9 + low), (bx + 3, -9 + low), (px + 4, py), (px - 3, py))
            p(c["shade"], (bx - 1, -8 + low), (bx + 2, -8 + low), (px + 2, py - 1), (px - 1, py - 1))

        # Broad shoulders and a rounded haunch, joined by a low back.
        p(c["ink"], (-20, -9 + low), (-19, -17 + low), (-14, -22 + low),
            (-8, -24 + low), (2, -22 + low), (11, -24 + low), (17, -23 + low),
            (21, -17 + low), (20, -9 + low), (14, -5 + low), (3, -6 + low),
            (-7, -5 + low), (-14, -4 + low))
        p(c["shade"], (-18, -9 + low), (-17, -16 + low), (-13, -20 + low),
            (-8, -22 + low), (2, -20 + low), (11, -22 + low), (16, -21 + low),
            (19, -16 + low), (18, -10 + low), (13, -7 + low), (2, -8 + low),
            (-8, -7 + low), (-13, -6 + low))
        p(c["fur"], (-17, -10 + low), (-16, -16 + low), (-12, -20 + low),
            (-8, -22 + low), (1, -20 + low), (11, -22 + low), (16, -20 + low),
            (17, -14 + low), (13, -11 + low), (4, -11 + low), (-2, -10 + low),
            (-10, -11 + low), (-13, -8 + low))
        p(c["moon"], (-15, -14 + low), (-12, -19 + low), (-8, -21 + low),
            (2, -20 + low), (11, -21 + low), (15, -19 + low), (16, -15 + low),
            (11, -12 + low), (4, -14 + low), (-3, -14 + low), (-9, -12 + low),
            (-12, -13 + low))
        p(c["hi"], (-13, -16 + low), (-10, -19 + low), (-6, -20 + low),
            (1, -19 + low), (-4, -18 + low), (-10, -18 + low))

        # Near paws
        for bx, mult in [(-14, 1), (12, -1)]:
            px = bx + (-4 if glide else mult * stride)
            py = 2 if glide else (0 if mult * stride > 0 else 2)
            p(c["ink"], (bx - 3, -9 + low), (bx + 4, -9 + low), (px + 5, py), (px - 3, py))
            p(c["fur"], (bx - 1, -8 + low), (bx + 2, -8 + low), (px + 3, py - 1), (px - 1, py - 1))
            r(c["moon"], px, py - 2, 3, 1)

        # Head + rounded stoat ears (far ear + near ear) + fierce expression
        hx = 16 if glide else 15
        hy = -19 + low
        # Far ear
        p(c["ink"], (hx - 2, hy - 5), (hx - 2, hy - 9), (hx, hy - 12),
            (hx + 4, hy - 12), (hx + 6, hy - 9), (hx + 5, hy - 5))
        p(c["shade"], (hx, hy - 6), (hx, hy - 9), (hx + 2, hy - 10),
            (hx + 4, hy - 9), (hx + 3, hy - 6))
        # Head silhouette
        p(
            c["ink"],
            (hx - 10, hy - 1),
            (hx - 8, hy - 7),
            (hx - 2, hy - 9),
            (hx + 5, hy - 7),
            (hx + 10, hy - 2),
            (hx + 10, hy + 3),
            (hx + 6, hy + 6),
            (hx - 5, hy + 7),
            (hx - 9, hy + 4),
        )
        p(
            c["fur"],
            (hx - 8, hy),
            (hx - 6, hy - 5),
            (hx - 1, hy - 7),
            (hx + 4, hy - 5),
            (hx + 8, hy - 1),
            (hx + 8, hy + 2),
            (hx + 5, hy + 4),
            (hx - 4, hy + 5),
        )
        p(
            c["moon"],
            (hx - 4, hy - 2),
            (hx, hy - 6),
            (hx + 4, hy - 4),
            (hx + 8, hy - 1),
            (hx + 7, hy + 2),
            (hx + 3, hy + 3),
            (hx - 3, hy + 2),
        )
        # Near ear
        p(c["ink"], (hx - 7, hy - 4), (hx - 9, hy - 7), (hx - 8, hy - 11),
            (hx - 6, hy - 12), (hx - 3, hy - 12), (hx - 1, hy - 10), (hx - 1, hy - 5))
        p(c["fur"], (hx - 6, hy - 5), (hx - 7, hy - 8), (hx - 6, hy - 10),
            (hx - 4, hy - 10), (hx - 3, hy - 8), (hx - 3, hy - 5))
        r(c["shade"], hx - 6, hy - 8, 2, 2)
        # Fierce slanted brow, glinting eye & pink nose
        p(c["ink"], (hx + 1, hy - 4), (hx + 6, hy - 2), (hx + 5, hy - 1), (hx + 1, hy - 2))
        r(c["ink"], hx + 2, hy - 2, 3, 3)
        r(c["glint"], hx + 3, hy - 2, 1, 1)
        r(c["nose"], hx + 8, hy - 1, 2, 2)

        # Glide frost spray
        if glide:
            for i, (sx, sy) in enumerate([(-26, -1), (-23, 1), (-19, -2), (-25, 2)]):
                if (i + f) % 2 == 0:
                    r(c["tip"] if i % 2 else c["ice"], sx, sy, 2, 1)
        return

    # South looks across the forepaws to the tail. North sees the rump first.
    def at(t, height):
        return round(-height + low + t * (-0.23 if rear else 0.23))

    if not rear:
        stoat_tail(p, facing, low, sway, glide)

    for sign in (-1, 1):
        for near in (False, True):
            hind = near == rear
            x = sign * (12 if hind else 8)
            t = -12 if hind else 12
            dy = 0 if glide or stride * sign < 0 else 2
            y = at(t, dy) - low + int(near)
            p(c["ink"], (x - 3, y - 7), (x + 3, y - 7), (x + 4, y - 2),
                (x + 3, y), (x - 3, y), (x - 4, y - 2))
            r(c["moon"] if near else c["fur"], x - 2, y - 3, 5, 2)

    # The shoulders are narrower than the haunches, and the muzzle sits in front of the chest.
    crown = at(14, 27)
    if rear:
        p(c["ink"], (-9, crown + 8), (-9, crown + 1), (-6, crown - 1),
            (6, crown - 1), (9, crown + 1), (9, crown + 8))
        p(c["fur"], (-7, crown + 8), (-7, crown + 2), (-4, crown + 1),
            (4, crown + 1), (7, crown + 2), (7, crown + 8))

    top = at(-4 if rear else 2, 23)
    floor = at(-9 if rear else 8, 5)
    width = 17 if rear else 15
    p(c["ink"], (-width, floor - 4), (-width + 1, top + 7), (-8, top + 2),
        (-4, top), (4, top), (8, top + 2), (width - 1, top + 7),
        (width, floor - 4), (width - 3, floor), (3, floor + 1), (-7, floor + 1), (-width + 3, floor))
    p(c["shade"], (-width + 2, floor - 4), (-width + 3, top + 7), (-7, top + 3),
        (-4, top + 2), (4, top + 2), (7, top + 3), (width - 3, top + 7),
        (width - 2, floor - 4), (width - 4, floor - 1), (-width + 4, floor - 1))
    p(c["fur"], (-width + 3, floor - 4), (-width + 4, top + 7), (-5, top + 2),
        (4, top + 2), (9, top + 5), (width - 3, floor - 5), (5, floor - 3), (-7, floor - 2))
    p(c["moon"], (-width + 4, top + 9), (-7, top + 4), (-4, top + 2), (4, top + 2),
        (8, top + 5), (width - 5, top + 9), (5, floor - 5), (-6, floor - 4))

    for sign in (-1, 1):
        p(c["ink"], (sign * 5, crown + 2), (sign * 5, crown - 2), (sign * 8, crown - 5),
            (sign * 11, crown - 5), (sign * 13, crown - 3), (sign * 13, crown + 1),
            (sign * 11, crown + 3), (sign * 7, crown + 3))
        p(c["fur"], (sign * 7, crown + 1), (sign * 7, crown - 2),
            (sign * 9, crown - 3), (sign * 11, crown - 3), (sign * 11, crown + 1))
        if not rear:
            r(c["shade"], sign * 9 - 1, crown - 2, 2, 2)

    if rear:
        stoat_tail(p, facing, low, sway, glide)
    else:
        chin = at(21, 12)
        p(c["ink"], (-12, crown + 6), (-8, crown + 1), (8, crown + 1), (12, crown + 6),
            (13, chin - 5), (10, chin - 1), (5, chin + 2), (-5, chin + 2),
            (-10, chin - 1), (-13, chin - 5))
        p(c["moon"], (-10, crown + 6), (-7, crown + 3), (7, crown + 3), (10, crown + 6),
            (11, chin - 5), (8, chin - 2), (4, chin), (-4, chin), (-8, chin - 2), (-11, chin - 5))
        for sign in (-1, 1):
            p(c["ink"], (sign * 3, crown + 8), (sign * 8, crown + 6),
                (sign * 7, crown + 10), (sign * 4, crown + 10))
            r(c["glint"], sign * 5, crown + 8, 1, 1)
        r(c["nose"], -2, chin - 3, 4, 2)
        r(c["shade"], -1, chin, 3, 1)


# ---------------------------------------------------------------------------
# 2. 雪原冰兔 · Frost hare
# Crouched snow hare with round cheeks, dark-tipped ears and a small frost cluster.
# ---------------------------------------------------------------------------
HARE = dict(
    ink="#293c4b",
    shade="#7390a3",
    fur="#aec7d0",
    snow="#eef2e6",
    light="#fbfbef",
    ear="#a88f9b",
    tip="#486078",
    ice="#89c2d2",
    frost="#c7eced",
    nose="#ce8f82",
)


def hare_ear(p, x, y, bend, length, fill, inner=False):
    """Long ears have the same dark tips on both sides of the head."""
    c = HARE
    tx, ty = x + bend, y - length
    p(c["ink"], (x - 4, y), (tx - 4, ty + 6), (tx - 3, ty + 2), (tx, ty),
        (tx + 3, ty + 2), (tx + 5, ty + 6), (x + 4, y + 1))
    p(fill, (x - 2, y - 1), (tx - 2, ty + 6), (tx, ty + 2),
        (tx + 3, ty + 6), (x + 2, y))
    p(c["tip"], (tx - 2, ty + 6), (tx, ty + 2), (tx + 3, ty + 6),
        (tx + 3, ty + 9), (tx - 1, ty + 8))
    if inner:
        p(c["ear"], (x, y - 4), (tx - 1, ty + 9), (tx + 2, ty + 10), (x + 2, y - 3))


def hare_crystals(p, x, y):
    """A short frost cluster lies over the spine at the shoulders."""
    c = HARE
    p(c["ink"], (x - 6, y + 1), (x - 4, y - 5), (x - 1, y - 3),
        (x + 1, y - 7), (x + 4, y - 4), (x + 5, y + 1))
    p(c["ice"], (x - 4, y), (x - 3, y - 3), (x, y - 1),
        (x + 1, y - 5), (x + 3, y - 3), (x + 3, y + 1))
    p(c["frost"], (x + 1, y - 5), (x + 3, y - 3), (x + 1, y - 1))


def frost_hare(r, p, facing, frame):
    c = HARE
    leap = frame >= 4
    f = frame % 4
    rise = ([1, 2, -5, -1] if leap else [0, 2, -3, -1])[f]
    stride = ([-2, -3, 7, 3] if leap else [1, -3, 4, 2])[f]
    sweep = ([-4, -6, -8, -5] if leap else [0, -4, -5, -2])[f]
    foot = ([2, 1, -3, 1] if leap else [2, 2, -1, 1])[f]
    rear = facing == "north"
    y = -23 + rise

    if facing == "east":
        hx = 11 + (2 if leap and f == 2 else 0)
        hare_ear(p, hx + 1, y - 1, -4 + sweep, 17, c["shade"])
        hare_ear(p, hx - 4, y - 1, -5 + sweep, 20, c["fur"], inner=True)

        # Short tail and far-side feet tuck behind the haunch.
        p(c["ink"], (-14, -11 + rise), (-20, -11 + rise), (-22, -15 + rise),
            (-20, -18 + rise), (-16, -18 + rise), (-13, -15 + rise))
        p(c["snow"], (-15, -12 + rise), (-19, -13 + rise), (-20, -15 + rise),
            (-18, -16 + rise), (-15, -15 + rise))
        for x, dx, width in [(-12, -stride, 8), (9, stride, 5)]:
            px, py = x + dx, foot - 3
            p(c["ink"], (x - 3, -10 + rise), (x + 3, -10 + rise),
                (px + width, py - 2), (px + width - 1, py), (px - 2, py), (px - 3, py - 2))
            p(c["shade"], (x - 1, -9 + rise), (x + 2, -9 + rise),
                (px + width - 2, py - 1), (px - 1, py - 1))

        hair = -23 + rise
        hare_crystals(p, -1, hair + 1)
        p(c["ink"], (-17, -9 + rise), (-17, -17 + rise), (-13, hair + 1), (-7, hair - 2),
            (0, hair - 1), (6, -20 + rise), (14, -17 + rise), (16, -10 + rise),
            (11, -6 + rise), (-4, -6 + rise), (-12, -4 + rise))
        p(c["shade"], (-15, -9 + rise), (-15, -16 + rise), (-11, hair + 2), (-7, hair),
            (0, hair + 1), (5, -18 + rise), (12, -16 + rise), (14, -11 + rise),
            (10, -8 + rise), (-4, -8 + rise), (-11, -6 + rise))
        p(c["snow"], (-14, -12 + rise), (-13, -17 + rise), (-9, hair + 2), (-5, hair),
            (1, hair + 3), (7, -16 + rise), (12, -15 + rise), (12, -12 + rise),
            (5, -9 + rise), (0, -10 + rise), (-6, -10 + rise), (-11, -7 + rise))

        # The near hock leads into a long hind foot. The front paw is shorter.
        heel = -13 - stride
        p(c["ink"], (-13, -15 + rise), (-7, -15 + rise), (-4, -10 + rise),
            (-7, -6 + rise), (heel + 10, foot - 3), (heel + 8, foot),
            (heel - 3, foot), (heel - 4, foot - 2), (-14, -5 + rise))
        p(c["fur"], (-12, -14 + rise), (-7, -13 + rise), (-6, -10 + rise),
            (-9, -6 + rise), (heel + 7, foot - 2), (heel - 2, foot - 1), (-12, -6 + rise))
        r(c["snow"], heel + 2, foot - 2, 5, 1)
        toe = 10 + stride
        p(c["ink"], (8, -10 + rise), (12, -11 + rise), (toe + 5, foot - 3),
            (toe + 4, foot), (toe - 2, foot), (toe - 3, foot - 2))
        p(c["fur"], (9, -9 + rise), (11, -9 + rise), (toe + 2, foot - 3), (toe + 2, foot - 1),
            (toe - 1, foot - 1))

        p(c["ink"], (hx - 8, y), (hx - 6, y - 5), (hx - 1, y - 7), (hx + 4, y - 6),
            (hx + 8, y - 3), (hx + 11, y + 1), (hx + 11, y + 5), (hx + 7, y + 9),
            (hx, y + 9), (hx - 6, y + 6))
        p(c["snow"], (hx - 6, y), (hx - 4, y - 4), (hx, y - 5), (hx + 4, y - 4),
            (hx + 9, y + 1), (hx + 9, y + 4), (hx + 6, y + 7),
            (hx, y + 7), (hx - 4, y + 5))
        p(c["light"], (hx - 2, y - 3), (hx + 4, y - 4), (hx + 7, y - 1), (hx + 2, y + 1))
        r(c["ink"], hx + 3, y, 3, 3)
        r(c["light"], hx + 4, y, 1, 1)
        r(c["nose"], hx + 9, y + 2, 2, 2)
        return

    # The long ears and hindquarters read in both foreshortened directions.
    for sign in (-1, 1):
        hare_ear(p, sign * 6, y - 2, sign * (3 + abs(sweep) // 4), 19 + (sign < 0),
            c["shade"] if rear else c["fur"], inner=not rear)
    if rear:
        p(c["ink"], (-10, y + 5), (-8, y - 4), (-4, y - 7), (4, y - 7),
            (8, y - 4), (10, y + 5))
        p(c["fur"], (-8, y + 4), (-6, y - 3), (-3, y - 5),
            (3, y - 5), (6, y - 3), (8, y + 4))
    else:
        hare_crystals(p, 0, y + 1)

    width = 15 if rear else 14
    p(c["ink"], (-width, -10 + rise), (-width + 2, -17 + rise), (-8, -23 + rise),
        (-3, -25 + rise), (5, -24 + rise), (11, -20 + rise), (width, -13 + rise),
        (width, -6 + rise), (width - 3, foot), (7, foot), (4, -4 + rise),
        (-4, -4 + rise), (-7, foot), (-width + 3, foot), (-width, -4 + rise))
    p(c["shade"], (-width + 2, -10 + rise), (-width + 4, -17 + rise), (-7, -21 + rise),
        (-3, -23 + rise), (5, -22 + rise), (10, -18 + rise), (width - 2, -13 + rise),
        (width - 2, -6 + rise), (width - 4, foot - 1), (8, foot - 1), (5, -5 + rise),
        (-5, -5 + rise), (-8, foot - 1), (-width + 4, foot - 1), (-width + 2, -5 + rise))
    p(c["fur"], (-width + 3, -11 + rise), (-10, -18 + rise), (-5, -22 + rise), (4, -22 + rise),
        (9, -18 + rise), (width - 3, -12 + rise), (9, -6 + rise), (-8, -6 + rise))
    for sign in (-1, 1):
        r(c["fur"], sign * 10 - 2, foot - 3, 5, 2)

    if rear:
        hare_crystals(p, 0, -19 + rise)
        p(c["snow"], (-10, -11 + rise), (-7, -17 + rise), (-3, -17 + rise),
            (3, -15 + rise), (9, -16 + rise), (11, -11 + rise), (5, -7 + rise), (-6, -7 + rise))
        p(c["ink"], (-5, -8 + rise), (-3, -11 + rise), (3, -11 + rise),
            (5, -8 + rise), (4, -4 + rise), (-4, -4 + rise))
        p(c["snow"], (-3, -8 + rise), (-1, -10 + rise), (2, -10 + rise),
            (4, -7 + rise), (2, -5 + rise), (-2, -5 + rise))
        return

    for sign in (-1, 1):
        x = sign * 5
        p(c["ink"], (x - 3, -6 + rise), (x + 3, -6 + rise), (x + 4, foot - 1),
            (x + 2, foot + 1), (x - 2, foot + 1), (x - 4, foot - 1))
        p(c["fur"], (x - 2, -5 + rise), (x + 2, -5 + rise), (x + 2, foot - 1),
            (x - 2, foot - 1))
        r(c["snow"], x - 2, foot - 2, 5, 1)
    y += 2
    p(c["ink"], (-11, y + 1), (-9, y - 4), (-5, y - 7), (5, y - 7), (9, y - 4),
        (11, y + 1), (11, y + 6), (7, y + 10), (-7, y + 10), (-11, y + 6))
    p(c["snow"], (-9, y + 1), (-7, y - 3), (-4, y - 5), (4, y - 5), (7, y - 3),
        (9, y + 1), (9, y + 5), (5, y + 8), (-5, y + 8), (-9, y + 5))
    p(c["snow"], (-6, y + 7), (6, y + 7), (6, y + 10), (2, y + 12), (-4, y + 11))
    r(c["light"], -5, y - 4, 7, 2)
    for x in (-6, 4):
        r(c["ink"], x, y + 1, 3, 3)
        r(c["light"], x, y + 1, 1, 1)
    r(c["nose"], -2, y + 4, 4, 2)
    r(c["shade"], -1, y + 6, 3, 1)


# ---------------------------------------------------------------------------
# 3. 霜翼鳐 · Frost ray
# The broad disc rises and falls from the fin roots; the ribbon tail follows it.
# ---------------------------------------------------------------------------
RAY = dict(
    ink="#203344",
    deep="#2e536c",
    fin="#54869b",
    rim="#a9dfe3",
    snow="#eaf3ef",
    belly="#96b5c4",
    amber="#ffd085",
)


def frost_ray(r, p, facing, frame):
    c = RAY
    diving = frame >= 4
    f = frame % 4
    side, rear = facing == "east", facing == "north"
    bob = ([0, 1, -1, 0] if diving else [0, 2, 0, -1])[f]
    flap = ([2, -3, -7, 3] if diving else [1, 10, -8, -3])[f]
    span = ([22, 20, 18, 23] if diving else [26, 24, 25, 26])[f]
    tail_sway = ([0, -1, 2, 1] if diving else [1, 3, -1, -3])[f]
    pitch = ([0.03, .12, .22, .08][f] if diving else 0)

    # Positions are forward, lateral, and vertical offsets from the disc center.
    def project(t, w, h):
        h += bob - t * pitch
        if side:
            return round(t - w * .15), round(-h + w * .35)
        direction = -1 if rear else 1
        return round(w * direction), round(-h + t * direction * .35)

    def surface(color, *vertices):
        p(c[color], *(project(*vertex) for vertex in vertices))

    def tail():
        bend = tail_sway
        surface("ink", (-9, -2, 15), (-16, bend, 11), (-21, bend + 4, 7),
            (-26, bend + 5, 7), (-24, bend + 2, 3), (-21, bend, 4),
            (-15, bend - 3, 8), (-9, 3, 11))
        surface("fin", (-12, 0, 12), (-16, bend + 1, 10), (-21, bend + 3, 6),
            (-24, bend + 4, 6), (-21, bend + 1, 5), (-16, bend - 1, 8))

    def fin(sign):
        tip = 19 + flap
        setback = -11 if diving else -6
        mid = 21 + flap * .6

        def wing(color, *vertices):
            surface(color, *((t, sign * w, h) for t, w, h in vertices))

        wing("ink", (11, 3, 20), (8, 10, 21), (2, 17, mid + 2), (setback, span, tip),
            (setback - 4, span - 3, tip - 5), (-11, 16, mid - 9),
            (-16, 8, 12), (-13, 2, 15), (-2, 1, 16))
        wing("fin", (8, 6, 19), (6, 10, 20), (1, 17, mid),
            (setback - 1, span - 2, tip - 1), (setback - 3, span - 4, tip - 4),
            (-10, 16, mid - 7), (-14, 9, 13), (-10, 6, 15))
        if not side or sign > 0:
            wing("rim", (3, 13, mid), (setback - 1, span - 2, tip - 1),
                (setback - 2, span - 5, tip - 3), (-5, 15, mid - 4), (-4, 10, mid - 4))

    if not rear:
        tail()

    def eye(sign):
        ex, ey = project(11, sign * 5.5, 20)
        r(c["ink"], ex - 2, ey - 1, 5, 4)
        r(c["amber"], ex - 1, ey, 3, 2)

    if side:
        # Show the chest and belly through the gap between the far and near fins.
        fin(-1)
        surface("ink", (-16, 0, 13), (-12, 0, 18), (-7, 0, 22),
            (2, 0, 24), (10, 0, 24), (15, 0, 21), (17, 0, 17), (17, 0, 14),
            (14, 0, 10), (9, 0, 8), (2, 0, 8), (-7, 0, 10), (-12, 0, 11))
        surface("deep", (-13, 0, 13), (-10, 0, 18), (-6, 0, 21), (2, 0, 23),
            (9, 0, 23), (14, 0, 20), (15, 0, 17), (15, 0, 14), (12, 0, 11),
            (8, 0, 10), (2, 0, 10), (-6, 0, 11))
        surface("belly", (-12, 0, 13), (-5, 0, 14), (3, 0, 15), (11, 0, 16),
            (15, 0, 17), (15, 0, 14), (12, 0, 11), (8, 0, 10), (2, 0, 10), (-6, 0, 11))
        surface("snow", (1, 0, 13), (7, 0, 14), (15, 0, 16), (14, 0, 13),
            (10, 0, 11), (5, 0, 11))
        fin(1)
        eye(1)
        return

    for sign in (-1, 1):
        fin(sign)

    def cross_section(color, *half):
        mirrored = ((t, -w, h) for t, w, h in reversed(half[1:-1]))
        surface(color, *half, *mirrored)

    # The axial silhouettes use the same 24-unit back and 8-unit belly heights
    # as the profile. The contour narrows towards the middle of the belly.
    cross_section("ink", (8, 0, 24), (6, 5, 24), (4, 9, 22), (2, 11, 19),
        (-2, 11, 14), (-5, 8, 11), (-3, 4, 9), (0, 0, 8))
    cross_section("deep", (8, 0, 22), (6, 5, 22), (4, 8, 21), (2, 9, 18),
        (-2, 9, 14), (-5, 7, 12), (-3, 4, 10), (0, 0, 10))
    cross_section("fin", (7, 0, 22), (6, 4, 22), (4, 7, 20), (2, 7, 17),
        (-2, 5, 15), (-3, 3, 13), (-3, 0, 13))

    if rear:
        tail()
        return

    cross_section("ink", (16, 0, 19), (14, 5, 20), (12, 9, 19), (9, 10, 16),
        (8, 9, 12), (8, 6, 9), (9, 3, 8), (10, 0, 8))
    cross_section("belly", (15, 0, 18), (13, 5, 19), (11, 8, 18), (9, 8, 15),
        (8, 7, 12), (8, 5, 10), (9, 2, 9), (10, 0, 9))
    cross_section("snow", (14, 0, 16), (12, 4, 17), (10, 7, 16), (9, 7, 13),
        (8, 5, 11), (9, 2, 10), (10, 0, 10))
    for sign in (-1, 1):
        eye(sign)
    mx, my = project(12, 0, 14)
    r(c["deep"], mx - 2, my, 5, 1)


PAINTERS = {"ice-sail": ice_sail_frames, "frost-hare": frost_hare, "frost-ray": frost_ray}


def build_sheet(name, painter):
    sheet = Image.new("RGBA", (SIZE * len(FACINGS), SIZE * 8))
    for frame in range(8):
        views = [make_view(partial(painter, frame=frame), facing) for facing in FACINGS]
        if views[0].getchannel("A").histogram() != views[2].getchannel("A").histogram():
            raise ValueError(f"{name} frame {frame} clips facing west")
        for column, view in enumerate(views):
            sheet.paste(view, (column * SIZE, frame * SIZE))
    return sheet


def export(output):
    output.mkdir(parents=True, exist_ok=True)
    for name, painter in PAINTERS.items():
        build_sheet(name, painter).save(output / f"{name}.png", optimize=True)


def preview(target, scale=4):
    sheets = [build_sheet(n, p) for n, p in PAINTERS.items()]
    w = SIZE * len(FACINGS)
    board = Image.new("RGBA", (w * len(sheets) + 16 * (len(sheets) - 1), SIZE * 8), "#3d5969")
    draw = ImageDraw.Draw(board)
    for i, sheet in enumerate(sheets):
        x = i * (w + 16)
        for row in range(8):
            for col in range(4):
                if (row + col) % 2:
                    draw.rectangle(
                        (x + col * SIZE, row * SIZE, x + col * SIZE + SIZE - 1, row * SIZE + SIZE - 1),
                        fill="#536e7c",
                    )
        board.alpha_composite(sheet, (x, 0))
    board = board.resize((board.width * scale, board.height * scale), Image.Resampling.NEAREST)
    board.save(target)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, nargs="?")
    parser.add_argument("--preview", type=Path)
    args = parser.parse_args()
    if args.preview:
        preview(args.preview)
    if args.output:
        export(args.output)
