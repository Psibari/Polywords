"""Draw the Daily answer block: answerplaque_stone.png and answerblock_top.png.

Pete's design (2026-09-27). A block sits flush in the answer wall like a
brick; the only thing that sets it apart is its gold outline, which is its
mortar. Its face is his muted purple (55, 41, 89), a touch lighter across the
middle. When tapped it pops out of the wall and its top face shows: a
trapezoid in the door's indigo (42, 26, 92), ringed in the same gold, drawn
above the block by DailyAnswerCard. Pulled out, it leaves its recess in the
wall art (build_daily_answer_wall.py).

answerplaque_stone.png is 3x the block, which fills its panel less the
mortar (dailyCastleScene DAILY_CASTLE_GRID): 437 x 229 px. answerblock_top.png
is the top face at the same width; DailyAnswerCard sizes it by TOP_RATIO.

    python3 tools/art/build_daily_plaque.py   (Pillow, numpy)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT_FACE = ROOT / "assets/images/dailycastle/answerplaque_stone.png"
OUT_TOP = ROOT / "assets/images/dailycastle/answerblock_top.png"

W, H = 437, 229             # 3x (465 - 2*14) / 3 by (742 - 4*14) / 9 pt
TOP_H = 46                  # top face height, px; TOP_RATIO in DailyAnswerCard = TOP_H / H
TOP_INSET = 0.07            # the top face's back edge is inset this share of the width each side
GOLD = (245, 200, 66)
FACE = (55, 41, 89)
FACE_MID = (60, 44, 96)
FACE_LOW = (48, 36, 80)
TOP = (42, 26, 92)          # the door's indigo
BORDER = 9                  # gold mortar round the face, px
SS = 4


def s(v):
    return round(v * SS)


def face() -> Image.Image:
    y = np.linspace(0, 1, H)[:, None, None]
    mid = np.exp(-((y - 0.45) ** 2) / 0.08)
    field = np.array(FACE, float) * (1 - mid) + np.array(FACE_MID, float) * mid
    foot = np.clip((y - 0.8) / 0.2, 0, 1)
    field = field * (1 - foot) + np.array(FACE_LOW, float) * foot
    rgb = np.broadcast_to(field, (H, W, 3)).round().astype(np.uint8)
    out = Image.fromarray(np.ascontiguousarray(rgb), "RGB").convert("RGBA")
    d = ImageDraw.Draw(out)
    for i in range(BORDER):
        d.rectangle([i, i, W - 1 - i, H - 1 - i], outline=GOLD)
    return out


def top() -> Image.Image:
    img = Image.new("RGBA", (s(W), s(TOP_H)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    inset = W * TOP_INSET
    d.polygon([(s(inset), 0), (s(W - inset), 0), (s(W), s(TOP_H)), (0, s(TOP_H))], fill=GOLD)
    k = BORDER * inset / TOP_H   # slanted gold as thick as the sides
    d.polygon([(s(inset + k), s(BORDER * 0.6)), (s(W - inset - k), s(BORDER * 0.6)),
               (s(W - BORDER), s(TOP_H)), (s(BORDER), s(TOP_H))], fill=TOP)
    return img.resize((W, TOP_H), Image.BOX)


def main() -> None:
    face().save(OUT_FACE, optimize=True)
    top().save(OUT_TOP, optimize=True)
    print(f"wrote {OUT_FACE.name} {W}x{H}, {OUT_TOP.name} {W}x{TOP_H}")


if __name__ == "__main__":
    main()
