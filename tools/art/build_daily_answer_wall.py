"""Build the Daily answer wall (framed, two brick panels) from existing art.

Pete's layout (2026-09-26): a frame of top beam, three pillars and a bottom
beam holding two recessed brick panels, one column of three answer blocks
each. Built on the shared 1290 x 2796 castle canvas so it registers with
ARCHNEW.png. Materials, all already in the repo:
  - top beam: the castle-step slab (ledge.png) with its top face and gold
    seam, the same stone as the steps;
  - pillars and bottom beam: that slab's front-face stone, with a lit left
    edge and a shadowed right edge so they read as solid blocks;
  - panels: the painted bricks of cornerwall.png, darkened and shadowed
    along their edges so they sit behind the frame. The middle pillar
    covers cornerwall's seam at x ~617.

    python3 tools/art/build_daily_answer_wall.py [out.png]   (Pillow, numpy)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LEDGE = ROOT / "assets/images/dailycastle/ledge.png"
BRICKS = ROOT / "assets/images/dailycastle/cornerwall.png"
DEFAULT_OUT = ROOT / "assets/images/dailycastle/answerwall_framed.png"

W, H = 1290, 2796
CAP_TOP = 1728            # canvas px (576 pt): top of the capstone beam
CAP_H = 170               # capstone height
PANEL_TOP = CAP_TOP + CAP_H
PANEL_BOTTOM = 2640       # 880 pt
PILLAR_W = 120
PILLARS = (0, (W - PILLAR_W) // 2, W - PILLAR_W)
SLAB = (24, 96, 1309, 292)    # ledge.png visible-alpha bounds
SEAM = 100                    # gold seam row inside SLAB
BRICK_SRC_TOP = 1893          # first all-brick row of cornerwall.png
END_SRC = 200                 # slab px kept at natural proportion at each end


def arr(img):
    return np.asarray(img).astype(np.float32)


def img(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def three_slice(src, width, height):
    k = height / src.height
    end = max(1, round(END_SRC * k))
    left = src.crop((0, 0, END_SRC, src.height)).resize((end, height), Image.LANCZOS)
    right = src.crop((src.width - END_SRC, 0, src.width, src.height)).resize((end, height), Image.LANCZOS)
    mid = src.crop((END_SRC, 0, src.width - END_SRC, src.height)).resize((width - 2 * end, height), Image.LANCZOS)
    out = Image.new("RGBA", (width, height))
    out.paste(left, (0, 0)); out.paste(mid, (end, 0)); out.paste(right, (width - end, 0))
    return out


def shade(a, x0, x1, y0, y1, start, end, axis):
    """Multiply RGB by a linear ramp start->end across [x0:x1, y0:y1]."""
    n = (x1 - x0) if axis == "x" else (y1 - y0)
    ramp = np.linspace(start, end, n, dtype=np.float32)
    region = a[y0:y1, x0:x1, :3]
    region *= ramp[None, :, None] if axis == "x" else ramp[:, None, None]


def main(out_path: Path) -> None:
    slab = Image.open(LEDGE).convert("RGBA").crop(SLAB)
    front = slab.crop((0, SEAM + 3, slab.width, slab.height))
    bricks = Image.open(BRICKS).convert("RGBA")
    canvas = Image.new("RGBA", (W, H))

    # Brick panels first; the frame is laid over their edges.
    panel_h = PANEL_BOTTOM - PANEL_TOP
    for x0, x1 in ((PILLARS[0] + PILLAR_W, PILLARS[1]), (PILLARS[1] + PILLAR_W, PILLARS[2])):
        canvas.paste(bricks.crop((x0, BRICK_SRC_TOP, x1, BRICK_SRC_TOP + panel_h)), (x0, PANEL_TOP))
    a = arr(canvas)
    a[PANEL_TOP:PANEL_BOTTOM, :, :3] *= 0.82                     # set back
    for x0, x1 in ((PILLARS[0] + PILLAR_W, PILLARS[1]), (PILLARS[1] + PILLAR_W, PILLARS[2])):
        shade(a, x0, x0 + 40, PANEL_TOP, PANEL_BOTTOM, 0.45, 1.0, "x")   # left edge
        shade(a, x1 - 40, x1, PANEL_TOP, PANEL_BOTTOM, 1.0, 0.55, "x")   # right edge
        shade(a, x0, x1, PANEL_TOP, PANEL_TOP + 70, 0.35, 1.0, "y")      # under the capstone
        shade(a, x0, x1, PANEL_BOTTOM - 24, PANEL_BOTTOM, 1.0, 0.7, "y") # onto the sill
    canvas = img(a)

    # Pillars: the slab's front stone turned upright, edge-lit.
    pillar_tex = front.rotate(90, expand=True)
    for px in PILLARS:
        canvas.alpha_composite(pillar_tex.resize((PILLAR_W, panel_h), Image.LANCZOS), (px, PANEL_TOP))
    a = arr(canvas)
    for px in PILLARS:
        shade(a, px, px + 10, PANEL_TOP, PANEL_BOTTOM, 1.35, 1.0, "x")                  # lit edge
        shade(a, px + PILLAR_W - 14, px + PILLAR_W, PANEL_TOP, PANEL_BOTTOM, 1.0, 0.55, "x")  # shadow edge
        shade(a, px, px + PILLAR_W, PANEL_TOP, PANEL_TOP + 30, 0.6, 1.0, "y")           # under the capstone
    canvas = img(a)

    # Bottom beam (sill): front stone, lit top edge.
    sill = three_slice(front, W, H - PANEL_BOTTOM)
    canvas.alpha_composite(sill, (0, PANEL_BOTTOM))
    a = arr(canvas)
    shade(a, 0, W, PANEL_BOTTOM, PANEL_BOTTOM + 8, 1.4, 1.0, "y")
    canvas = img(a)

    # Capstone: the whole slab, top face and gold seam, across the wall.
    canvas.alpha_composite(three_slice(slab, W, CAP_H), (0, CAP_TOP))

    canvas.save(out_path, optimize=True)
    print(f"wrote {out_path} {canvas.size}")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT)
