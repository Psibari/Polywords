"""Draw the Daily answer wall in castle B's cartoon style.

Pete (2026-09-26): the wall is the next painted asset to go cartoon, after the
castle and the door. Same frame as build_daily_answer_wall.py, drawn instead
of cut from painted art, on the same geometry so dailyCastleScene's
DAILY_ANSWER_WALL does not move: capstone y 1728-1898, panels 1898-2640,
pillars at x 0 / 585 / 1170, 120 px wide, sill from 2640 to the canvas foot.

Style is castle_cartoon.png's, sampled from it: rounded purple stones with a
lit rim and a hard shadow band, thick outlines in its line colour, a few
cracks. The capstone is a step like the castle's (top face, gold edge, front
face); the panels are darker recessed bricks so the answer blocks read.

    python3 tools/art/build_daily_answer_wall_cartoon.py [out.png] [castle|dusk]   (Pillow, numpy)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "assets/images/dailycastle/answerwall_framed.png"

W, H = 1290, 2796
CAP_TOP = 1728
CAP_H = 170
PANEL_TOP = CAP_TOP + CAP_H
PANEL_BOTTOM = 2640
PILLAR_W = 120
PILLARS = (0, (W - PILLAR_W) // 2, W - PILLAR_W)
SS = 2

LINE = (22, 1, 34)                 # castle outline colour
TONES = {
    # stone face, lit rim, shade, capstone top face, brick face, brick lit, brick shade
    # "castle": the tower stone as sampled. "dusk": the same hues about a third
    # darker, so the frame sits back behind the answer blocks like a foreground
    # in shadow.
    "castle": ((104, 36, 182), (128, 62, 208), (72, 16, 136), (112, 44, 196),
               (62, 16, 116), (76, 26, 136), (44, 8, 86)),
    "dusk": ((68, 18, 124), (86, 34, 150), (46, 6, 88), (80, 26, 146),
             (42, 8, 80), (52, 14, 96), (30, 3, 60)),
}
TONE = "castle"
RECESS = (30, 2, 58)               # flat cast shadow inside the panels
GOLD, GOLD_DARK = (245, 200, 66), (143, 111, 24)   # the game's golds, as on the steps


def s(v):
    return round(v * SS)


def stone(d, box, face, lit, shade, radius=16, outline=8):
    """A rounded cartoon stone: face, lit top-left rim, shaded bottom band."""
    x0, y0, x1, y1 = box
    d.rounded_rectangle([s(x0), s(y0), s(x1), s(y1)], radius=s(radius), fill=shade)
    d.rounded_rectangle([s(x0), s(y0), s(x1 - 6), s(y1 - 16)], radius=s(radius), fill=lit)
    d.rounded_rectangle([s(x0 + 10), s(y0 + 10), s(x1 - 6), s(y1 - 16)], radius=s(max(4, radius - 6)), fill=face)
    d.rounded_rectangle([s(x0), s(y0), s(x1), s(y1)], radius=s(radius), outline=LINE, width=s(outline))


def crack(d, rng, x, y, length):
    """A branching crack like the castle's: a jagged main line and one fork."""
    pts = [(x, y)]
    for _ in range(4):
        x += length / 4 * rng.uniform(0.7, 1.2)
        y += rng.uniform(-length / 6, length / 6)
        pts.append((x, y))
    d.line([(s(px), s(py)) for px, py in pts], fill=LINE, width=s(4), joint="curve")
    bx, by = pts[2]
    d.line([(s(bx), s(by)), (s(bx + length * 0.25), s(by + rng.choice([-1, 1]) * length * 0.22))], fill=LINE, width=s(3))


def cuts(rng, total, n, jitter):
    """n pieces summing to total, each within +-jitter of the mean."""
    w = total / n + rng.uniform(-jitter, jitter, n)
    return w * total / w.sum()


def main(out_path: Path, tone: str) -> None:
    global STONE, STONE_LIT, STONE_SHADE, TOP_FACE, BRICK, BRICK_LIT, BRICK_SHADE
    STONE, STONE_LIT, STONE_SHADE, TOP_FACE, BRICK, BRICK_LIT, BRICK_SHADE = TONES[tone]
    rng = np.random.default_rng(11)
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Mortar behind everything below the capstone's top face, so the wall is solid.
    d.rectangle([0, s(CAP_TOP + 40), s(W), s(H)], fill=LINE)

    # Panels: running-bond bricks, then a flat cast shadow under the capstone
    # and down each panel's left side (light comes from the upper left).
    panels = [(PILLARS[0] + PILLAR_W, PILLARS[1]), (PILLARS[1] + PILLAR_W, PILLARS[2])]
    brick_h, brick_w = 92, 176
    for x0, x1 in panels:
        d.rectangle([s(x0), s(PANEL_TOP), s(x1), s(PANEL_BOTTOM)], fill=LINE)
        row, y = 0, PANEL_TOP - 30
        while y < PANEL_BOTTOM:
            x = x0 - (brick_w / 2 if row % 2 else 0) - 20
            while x < x1:   # overhang is covered by the pillars drawn later
                bw = brick_w * rng.uniform(0.8, 1.2)
                tint = rng.integers(-5, 6)
                face = tuple(int(c + tint) for c in BRICK)
                stone(d, (x + 4, y + 4, x + bw - 4, y + brick_h - 4), face, BRICK_LIT, BRICK_SHADE, radius=10, outline=6)
                if rng.random() < 0.1:
                    crack(d, rng, x + rng.uniform(30, 70), y + rng.uniform(30, 55), 60)
                x += bw
            y += brick_h
            row += 1
        shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rectangle([s(x0), s(PANEL_TOP), s(x1), s(PANEL_TOP + 46)], fill=RECESS + (215,))
        sd.rectangle([s(x0), s(PANEL_TOP), s(x0 + 30), s(PANEL_BOTTOM)], fill=RECESS + (190,))
        img.alpha_composite(shadow)
        d = ImageDraw.Draw(img)

    # Pillars: stacked stones with a lit left edge.
    for px in PILLARS:
        d.rectangle([s(px), s(PANEL_TOP), s(px + PILLAR_W), s(PANEL_BOTTOM)], fill=LINE)
        y0 = PANEL_TOP
        for sh in cuts(rng, PANEL_BOTTOM - PANEL_TOP, 5, 40):
            stone(d, (px + 3, y0 + 3, px + PILLAR_W - 3, y0 + sh - 3), STONE, STONE_LIT, STONE_SHADE)
            if rng.random() < 0.3:
                crack(d, rng, px + rng.uniform(20, 36), y0 + rng.uniform(40, sh - 50), 52)
            y0 += sh

    # Sill: long stones along the foot, lit top edge.
    x0 = -100
    for sw in cuts(rng, W + 200, 5, 60):
        stone(d, (x0 + 3, PANEL_BOTTOM + 3, x0 + sw - 3, H + 40), STONE, STONE_LIT, STONE_SHADE, radius=14)
        if rng.random() < 0.5:
            crack(d, rng, x0 + rng.uniform(80, 160), PANEL_BOTTOM + rng.uniform(40, 80), 90)
        x0 += sw

    # Capstone: a step like the castle's. Top face, gold edge, front face in
    # long stones.
    top_face_h = 58
    d.rectangle([s(-10), s(CAP_TOP), s(W + 10), s(CAP_TOP + top_face_h)], fill=TOP_FACE, outline=LINE, width=s(8))
    gold_y = CAP_TOP + top_face_h
    d.rectangle([s(-10), s(gold_y - 4), s(W + 10), s(gold_y + 12)], fill=GOLD, outline=LINE, width=s(5))
    d.rectangle([s(-10), s(gold_y + 7), s(W + 10), s(gold_y + 12)], fill=GOLD_DARK)
    front_top = gold_y + 12
    x0 = -120
    for cw in cuts(rng, W + 240, 4, 70):
        stone(d, (x0 + 3, front_top + 2, x0 + cw - 3, PANEL_TOP + 2), STONE, STONE_LIT, STONE_SHADE, radius=12)
        x0 += cw
    d.line([(0, s(front_top)), (s(W), s(front_top))], fill=LINE, width=s(8))

    out = img.resize((W, H), Image.BOX)
    a = np.asarray(out)[..., 3]
    assert (a[CAP_TOP + 2 :, :] == 255).all(), "holes in the wall"
    out.save(out_path, optimize=True)
    print(f"wrote {out_path} {out.size}")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT,
         sys.argv[2] if len(sys.argv) > 2 else TONE)
