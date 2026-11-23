"""Export a concept board and transparent four-direction candidate sprite strips."""

import argparse
import json
import random
from functools import partial
from io import BytesIO
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from PIL import Image, ImageDraw, ImageFont

from draw_enemies import (
    FACINGS, ORIGIN, SIZE, ferry_snail, frost_owl, ice_sail,
    lamp_mole, make_view, pine_hopper, reed_crab, slag_cart, stump_spirit,
)


REGIONS = [
    ("林缘岗哨", "02–03", "#c9e494", "#25352a", "#304135", "#53614b"),
    ("苔岸河湾", "04–05", "#9fe6c9", "#1c3637", "#285052", "#446664"),
    ("弃采矿道", "07–09", "#f5c58a", "#392e29", "#534037", "#725746"),
    ("霜脊高地", "11–12", "#bce6ff", "#273746", "#3d5969", "#536e7c"),
]

# ID, regional index, artist, name, role, development note.
CANDIDATES = [
    ("pine-hopper", 0, pine_hopper, "松针跳鼠", "轻型快怪", "弹跳前压低身体，落地扬起松针。"),
    ("stump-spirit", 0, stump_spirit, "年轮树灵", "慢速肉盾", "正面露出年轮与亮眼，厚树皮承受火力。"),
    ("reed-crab", 1, reed_crab, "苇哨蟹", "小队支援", "抬起橙色大钳吹哨，短时加速同批怪物。"),
    ("ferry-snail", 1, ferry_snail, "渡灯蜗", "一次护壳", "铜色螺壳挡下一次重击，灯芯熄灭后护壳消失。"),
    ("lamp-mole", 2, lamp_mole, "矿灯鼹", "短距冲刺", "帽灯急闪并扬尘，随后沿原路线冲一小段。"),
    ("slag-cart", 2, slag_cart, "炉渣矿车", "重型装甲", "旧矿车装着发红炉渣，适合检验重弩破甲。"),
    ("ice-sail", 3, ice_sail, "冰帆貂", "伏地快怪", "压低身形沿冰面滑行，冰尾在转弯时撑开。"),
    ("frost-owl", 3, frost_owl, "霜铃鸮", "抗减速支援", "振翅鸣铃，短时减轻附近小队受到的减速。"),
]

FONT_NORMAL = "/System/Library/Fonts/STHeiti Light.ttc"
FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_NUMBERS = "/System/Library/Fonts/Menlo.ttc"


def show_field(region, seed):
    """A subdued regional ground swatch keeps the largest sprite readable."""
    _, _, _, _, ground, road = REGIONS[region]
    panel = Image.new("RGB", (92, 65), ground)
    draw = ImageDraw.Draw(panel)
    draw.polygon([(0, 51), (22, 47), (45, 44), (78, 47), (92, 44),
                  (92, 61), (68, 61), (56, 60), (37, 64), (0, 64)], fill=road)
    rng = random.Random(seed)
    accents = ("#698965", "#50877b", "#9b7459", "#819caa", "#8b668b")
    for _ in range(62):
        x, y = rng.randrange(92), rng.randrange(65)
        draw.line((x, y, x + rng.randrange(1, 4), y), fill=accents[region])
    for edge_x in (5, 80):
        y = 30 + rng.randrange(12)
        if region == 0:
            draw.polygon([(edge_x, y-12), (edge_x-8, y+4), (edge_x+8, y+4)], fill="#233a31")
            draw.line((edge_x, y+3, edge_x, y+9), fill="#92714e")
        elif region == 1:
            for offset in (0, 2, 4):
                draw.line((edge_x+offset, y-8+offset, edge_x+offset, y+2), fill="#7a986f")
        elif region == 2:
            for offset in (0, 3):
                draw.line((edge_x-5, y+offset, edge_x+8, y+offset-4), fill="#d39971")
        elif region == 3:
            draw.polygon([(edge_x, y-7), (edge_x-7, y+2), (edge_x+3, y+4),
                          (edge_x+7, y+1)], fill="#91b8c6")
        else:
            draw.polygon([(edge_x, y-8), (edge_x-3, y-3), (edge_x-3, y+4),
                          (edge_x+4, y+3), (edge_x+5, y-3)], fill="#a374a6")
    return panel.resize((184, 130), Image.Resampling.NEAREST)


def overview(views, target):
    width, height = 1440, 202 + len(REGIONS) * 234
    image = Image.new("RGB", (width, height), "#101d20")
    draw = ImageDraw.Draw(image)
    headline = ImageFont.truetype(FONT_BOLD, 48)
    small = ImageFont.truetype(FONT_NORMAL, 19)
    label = ImageFont.truetype(FONT_BOLD, 18)
    title = ImageFont.truetype(FONT_BOLD, 28)
    region_font = ImageFont.truetype(FONT_BOLD, 24)
    digits = ImageFont.truetype(FONT_NUMBERS, 17)
    pose_font = ImageFont.truetype(FONT_NORMAL, 15)
    color = "#edece0"
    draw.rectangle((45, 39, 49, 103), fill="#d5e5ab")
    draw.text((64, 44), "微光防线", font=headline, fill=color)
    draw.text((290, 47), "候选怪物", font=headline, fill="#d5e5ab")
    draw.text((67, 109), "四个地区 · 八种候选 · 正面 / 侧面 / 背面", font=small, fill="#9aada6")
    draw.text((1393, 116), "64 × 64 px", font=digits, anchor="rs", fill="#9aada6")
    draw.line((46, 145, 1393, 145), fill="#48615d")

    for chapter, (name, stages, accent, *_theme) in enumerate(REGIONS):
        y = 161 + chapter * 234
        draw.rectangle((46, y + 15, 50, y + 81), fill=accent)
        draw.text((63, y + 19), name, font=region_font, fill=accent)
        draw.text((65, y + 55), stages, font=digits, fill="#bac6b9")
        draw.text((64, y + 77), "建议关卡", font=small, fill="#8da099")
        if chapter > 0:
            draw.line((46, y - 7, 1393, y - 7), fill="#2b4140")

    for index, (identifier, region, _, name, role, note) in enumerate(CANDIDATES):
        _name, _stages, accent, panel, *_tones = REGIONS[region]
        x, y = 192 + (index % 2) * 606, 161 + region * 234
        draw.rounded_rectangle((x, y, x + 595, y + 219), 9, fill=panel, outline="#536663")
        draw.text((x + 15, y + 15), name, font=title, fill=color)
        tag_width = int(draw.textlength(role, font=label))
        tag_x = x + 577 - tag_width
        draw.rounded_rectangle((tag_x - 8, y + 13, x + 581, y + 39), 4, fill="#101d20")
        draw.text((tag_x, y + 17), role, font=label, fill=accent)
        for column, (direction, pose) in enumerate([("south", "正面"), ("east", "侧面"), ("north", "背面")]):
            tx, ty = x + 15 + column * 190, y + 52
            tile = show_field(region, 204 + index * 3 + column)
            tile_draw = ImageDraw.Draw(tile)
            tile_draw.ellipse((44, 105, 141, 119), fill="#263638")
            sprite = views[identifier][direction].resize((128, 128), Image.Resampling.NEAREST)
            tile.paste(sprite, (36, 1), sprite)
            tile_draw.rounded_rectangle((5, 5, 43, 26), 3, fill="#203030")
            tile_draw.text((9, 8), pose, fill="#d6e3d7", font=pose_font)
            image.paste(tile, (tx, ty))
            draw.rectangle((tx - 1, ty - 1, tx + 184, ty + 130), outline="#647773")
        draw.text((x + 15, y + 193), note, font=small, fill="#e4e5d7")

    image.save(target, optimize=True)


def game_atlases(output):
    output.mkdir(parents=True, exist_ok=True)
    for identifier, _, painter, *_ in CANDIDATES:
        if identifier in ("pine-hopper", "stump-spirit"):
            poses = (painter,)
        else:
            poses = (painter, partial(painter, active=True))
        atlas = Image.new("RGBA", (SIZE * len(FACINGS), SIZE * len(poses)))
        for row, pose in enumerate(poses):
            frames = [make_view(pose, facing) for facing in FACINGS]
            if frames[0].getchannel("A").histogram() != frames[2].getchannel("A").histogram():
                raise ValueError(f"{identifier} lost pixels during the west-facing flip")
            for column, frame in enumerate(frames):
                atlas.paste(frame, (SIZE * column, SIZE * row))
        atlas.save(output / f"{identifier}.png")


def export(output, include_overview):
    output.mkdir(parents=True, exist_ok=True)
    views = {}
    manifest = {
        "frame": list((SIZE, SIZE)),
        "origin": list(ORIGIN),
        "order": list(FACINGS),
        "candidates": [],
    }
    with ZipFile(output / "glimmer-defense-enemy-sprites.zip", "w", ZIP_DEFLATED) as pack:
        for identifier, region, painter, name, role, note in CANDIDATES:
            atlas = Image.new("RGBA", (SIZE * len(FACINGS), SIZE))
            by_direction = {facing: make_view(painter, facing) for facing in FACINGS}
            views[identifier] = by_direction
            east, west = (by_direction[f].getchannel("A").histogram() for f in ("east", "west"))
            if east != west:
                raise ValueError(f"{identifier} lost pixels during the west-facing flip")
            for index, facing in enumerate(FACINGS):
                atlas.paste(by_direction[facing], (SIZE * index, 0))
            file = f"sprites/{identifier}.png"
            sprite_bytes = BytesIO()
            atlas.save(sprite_bytes, format="PNG")
            pack.writestr(file, sprite_bytes.getvalue())
            manifest["candidates"].append({
                "id": identifier, "name": name, "region": REGIONS[region][0],
                "suggestedStages": REGIONS[region][1], "role": role,
                "idea": note, "file": file,
            })
        pack.writestr("catalog.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        pack.write(Path(__file__).with_name("README.md"), "README.md")
    if include_overview:
        overview(views, output / "glimmer-defense-enemy-concepts.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--sprites-only", action="store_true",
                        help="Skip the concept board, which uses system fonts from macOS.")
    parser.add_argument("--game-atlases", action="store_true",
                        help="Export game sheets with additional rows for ability poses.")
    args = parser.parse_args()
    if args.game_atlases:
        game_atlases(args.output)
    else:
        export(args.output, include_overview=not args.sprites_only)
