"""Draw the Daily answer wall in castle B's cartoon style, to Pete's design.

Pete (2026-09-26): the castle, floor and first cartoon walls were all one light
purple. His mock separates them: a muted slate-violet frame (top face
(101, 93, 142), body (61, 50, 104)) around recessed panels. This draws it in
the castle's cartoon style: black outlines, a strong lit edge and shadow edge
on every frame piece (Pete: stronger edges, no cracks). Since the answer
blocks went flush (Pete, 2026-09-27) each panel is black mortar with three
block recesses; the blocks cover them.

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
# Panels: black mortar and the answer blocks' recesses (a dark hole, deeper
# shadow under its top edge and down its left side, where the light is blocked).
MORTAR = (0, 0, 0)
MORTAR_PX = 14                      # dailyCastleScene DAILY_ANSWER_MORTAR_PX; change both together
HOLE = (26, 12, 46)
HOLE_SHADOW = (9, 3, 18)


def s(v):
    return round(v * SS)


def slab(d, box, face, lit, shade, radius=10, lit_w=18, shade_w=24):
    """A cartoon slab: lit top/left edge, shaded bottom/right edge, black outline."""
    x0, y0, x1, y1 = box
    d.rounded_rectangle([s(x0), s(y0), s(x1), s(y1)], radius=s(radius), fill=shade)
    d.rounded_rectangle([s(x0), s(y0), s(x1 - shade_w), s(y1 - shade_w)], radius=s(radius), fill=lit)
    d.rounded_rectangle([s(x0 + lit_w), s(y0 + lit_w), s(x1 - shade_w), s(y1 - shade_w)], radius=s(max(2, radius - 4)), fill=face)
    d.rounded_rectangle([s(x0), s(y0), s(x1), s(y1)], radius=s(radius), outline=LINE, width=s(OUTLINE))


def recess(d, box):
    """An answer block's empty recess: a dark hole with a hard cast shadow."""
    x0, y0, x1, y1 = box
    d.rectangle([s(x0), s(y0), s(x1), s(y1)], fill=HOLE)
    d.rectangle([s(x0), s(y0), s(x1), s(y0 + 40)], fill=HOLE_SHADOW)
    d.rectangle([s(x0), s(y0), s(x0 + 26), s(y1)], fill=HOLE_SHADOW)


def main(out_path: Path) -> None:
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Solid behind everything below the capstone's top edge.
    d.rectangle([0, s(CAP_TOP + 10), s(W), s(H)], fill=LINE)

    # Panels (Pete, 2026-09-27): black mortar with six recesses, one per
    # answer block. The blocks sit flush over them (dailyCastleScene's
    # DAILY_CASTLE_GRID uses the same rule: MORTAR_PX round the panel edge and
    # between blocks); a block pulled out leaves its recess showing.
    panels = [(PILLARS[0] + PILLAR_W, PILLARS[1]), (PILLARS[1] + PILLAR_W, PILLARS[2])]
    block_h = (PANEL_BOTTOM - PANEL_TOP - 4 * MORTAR_PX) / 3
    for x0, x1 in panels:
        d.rectangle([s(x0), s(PANEL_TOP), s(x1), s(PANEL_BOTTOM)], fill=MORTAR)
        for row in range(3):
            y0 = PANEL_TOP + MORTAR_PX + row * (block_h + MORTAR_PX)
            recess(d, (x0 + MORTAR_PX, y0, x1 - MORTAR_PX, y0 + block_h))

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
