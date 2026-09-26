"""Draw the Daily answer wall in castle B's cartoon style, to Pete's design.

Pete (2026-09-26): the castle, floor and first cartoon walls were all one light
purple. His mock separates them: a muted slate-violet frame (top face
(101, 93, 142), body (61, 50, 104)) around recessed panels of strong purple
bricks with thick black mortar. This draws that design cleanly in the
castle's cartoon style: black outlines, a strong lit edge and shadow edge on
every frame piece (Pete: stronger edges, no cracks), a flat cast shadow inside
each panel.

Same geometry as the painted wall this replaced, so dailyCastleScene's
DAILY_ANSWER_WALL (and the answer-block grid sized to its panels) did not
move: capstone y 1728-1898, panels 1898-2640, pillars at x 0 / 585 / 1170,
120 px wide, sill from 2640 to the canvas foot.

    python3 tools/art/build_daily_answer_wall.py [out.png]   (Pillow, numpy)
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
TOP_FACE_H = 62
SS = 2

LINE = (14, 4, 24)                  # near-black, a touch of the castle's line hue
OUTLINE = 9                         # px
# Pete's frame: slate-violet slab, lighter top face.
FRAME = (61, 50, 104)
FRAME_LIT = (104, 92, 156)
FRAME_SHADE = (32, 25, 60)
TOP = (101, 93, 142)
TOP_LIT = (122, 114, 164)
# Pete's bricks: strong purple, sampled tints, black mortar.
BRICKS = ((76, 32, 132), (80, 28, 144), (68, 28, 120), (88, 28, 156))
MORTAR = (0, 0, 0)
RECESS = (8, 2, 16)
BRICK_H, BRICK_W, MORTAR_W = 150, 290, 14


def s(v):
    return round(v * SS)


def slab(d, box, face, lit, shade, radius=10, lit_w=18, shade_w=24):
    """A cartoon slab: lit top/left edge, shaded bottom/right edge, black outline."""
    x0, y0, x1, y1 = box
    d.rounded_rectangle([s(x0), s(y0), s(x1), s(y1)], radius=s(radius), fill=shade)
    d.rounded_rectangle([s(x0), s(y0), s(x1 - shade_w), s(y1 - shade_w)], radius=s(radius), fill=lit)
    d.rounded_rectangle([s(x0 + lit_w), s(y0 + lit_w), s(x1 - shade_w), s(y1 - shade_w)], radius=s(max(2, radius - 4)), fill=face)
    d.rounded_rectangle([s(x0), s(y0), s(x1), s(y1)], radius=s(radius), outline=LINE, width=s(OUTLINE))


def main(out_path: Path) -> None:
    rng = np.random.default_rng(5)
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Solid behind everything below the capstone's top edge.
    d.rectangle([0, s(CAP_TOP + 10), s(W), s(H)], fill=LINE)

    # Panels: black mortar, running-bond bricks with a lit top edge.
    panels = [(PILLARS[0] + PILLAR_W, PILLARS[1]), (PILLARS[1] + PILLAR_W, PILLARS[2])]
    for x0, x1 in panels:
        d.rectangle([s(x0), s(PANEL_TOP), s(x1), s(PANEL_BOTTOM)], fill=MORTAR)
        row, y = 0, PANEL_TOP - 40
        while y < PANEL_BOTTOM:
            x = x0 - (BRICK_W * 0.55 if row % 2 else 0) - 30
            while x < x1:   # overhang is covered by the pillars drawn later
                bw = BRICK_W * rng.uniform(0.85, 1.15)
                face = BRICKS[rng.integers(len(BRICKS))]
                lit = tuple(min(255, c + 16) for c in face)
                bx0, by0 = x + MORTAR_W / 2, y + MORTAR_W / 2
                bx1, by1 = x + bw - MORTAR_W / 2, y + BRICK_H - MORTAR_W / 2
                d.rounded_rectangle([s(bx0), s(by0), s(bx1), s(by1)], radius=s(6), fill=lit)
                d.rounded_rectangle([s(bx0), s(by0 + 8), s(bx1), s(by1)], radius=s(6), fill=face)
                x += bw
            y += BRICK_H
            row += 1
        # Recessed: flat cast shadow under the capstone and down the left side.
        shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rectangle([s(x0), s(PANEL_TOP), s(x1), s(PANEL_TOP + 48)], fill=RECESS + (200,))
        sd.rectangle([s(x0), s(PANEL_TOP), s(x0 + 34), s(PANEL_BOTTOM)], fill=RECESS + (170,))
        img.alpha_composite(shadow)
        d = ImageDraw.Draw(img)

    # Pillars: one slab each.
    for px in PILLARS:
        slab(d, (px, PANEL_TOP - 6, px + PILLAR_W, PANEL_BOTTOM + 6), FRAME, FRAME_LIT, FRAME_SHADE)

    # Sill.
    slab(d, (-20, PANEL_BOTTOM, W + 20, H + 40), FRAME, FRAME_LIT, FRAME_SHADE)

    # Capstone: front face slab, then the lighter top face over it.
    slab(d, (-20, CAP_TOP + TOP_FACE_H - 4, W + 20, PANEL_TOP + 4), FRAME, FRAME_LIT, FRAME_SHADE)
    slab(d, (-20, CAP_TOP, W + 20, CAP_TOP + TOP_FACE_H), TOP, TOP_LIT, FRAME, radius=6, lit_w=10, shade_w=14)

    out = img.resize((W, H), Image.BOX)
    a = np.asarray(out)[..., 3]
    assert (a[CAP_TOP + 4 :, :] == 255).all(), "holes in the wall"
    out.save(out_path, optimize=True)
    foot = np.asarray(out)[-16:, :, :3].reshape(-1, 3).mean(0).round().astype(int)
    print(f"wrote {out_path} {out.size}; foot colour (DAILY_ANSWER_WALL_FOOT) "
          f"#{foot[0]:02X}{foot[1]:02X}{foot[2]:02X}")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT)
