"""Draw assets/images/dailycastle/tunnel.png: the tunnel behind the Daily gate.

Pete's idea (2026-09-26): the space behind the gate is a tunnel the thrown
block flies down. Redrawn in castle B's cartoon style (Pete, 2026-09-27):
rings of stone step back in perspective, each a flat colour darker than the
last, with black outlines and stone joints, to a far opening lit gold. The
walls are the castle's hero-book purple (2026-09-27). The
vanishing point is where the thrown block ends its flight
(dailyCastleScene DAILY_CASTLE_FLIGHT.end, 302 pt), and the far opening is
about the size the block has shrunk to there, so it flies into the light.

Output is the castle's opening at 3x (DAILY_CASTLE_OPENING: 578 x 828 px),
drawn at the opening's exact size behind the gate. Its arch matches the
opening: a half circle over straight sides. Outside the arch the castle art
covers it.

    python3 tools/art/build_daily_tunnel.py [out.png]   (Pillow, numpy)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/images/dailycastle/tunnel.png"

W, H = 578, 828                      # DAILY_CASTLE_OPENING x 3
VX = W / 2
VY = (302 - 442 / 3) * 3             # flight end (302 pt) inside the opening: 464 px
RINGS = 5                            # stone courses between the mouth and the far opening
FAR_SCALE = 0.31                     # far opening vs the mouth
SS = 3

LINE = (14, 4, 24)                   # the wall's outline colour
# The castle's hero-book purple (40, 28, 115), a step darker at the mouth so
# the tunnel reads as inside (Pete, 2026-09-27: match the new purple).
WALL_MOUTH = (34, 23, 100)
FLOOR_MOUTH = (27, 18, 82)
FOG = (9, 5, 24)                     # deep in the tunnel
# The far opening's light is the game's gold (Pete, 2026-09-27: not white).
GLOW_OUT = (200, 146, 14)            # amber
GLOW_IN = (245, 200, 66)             # gold
# The course nearest the light is lit purple stone, not purple mixed with gold
# (that mix went a muddy brown); the gold rim round the opening carries the spill.
LIT_STONE = (92, 66, 176)
JOINTS = 9                           # stone joints across each course


def s(v):
    return v * SS


def arch_outline(n=64):
    """The mouth's outline, clockwise from the bottom-left: sides and half circle."""
    r = W / 2
    pts = [(0, H), (0, r)]
    for i in range(1, n):
        a = np.pi + np.pi * i / n
        pts.append((VX + r * np.cos(a), r + r * np.sin(a)))
    pts += [(W, r), (W, H)]
    return pts


def scaled(pts, k):
    return [(VX + (x - VX) * k, VY + (y - VY) * k) for x, y in pts]


def mix(a, b, t):
    return tuple(round(x * (1 - t) + y * t) for x, y in zip(a, b))


def perimeter_points(pts, count, offset):
    """`count` points spaced evenly along the walls and vault (the open path, not the floor edge)."""
    path = np.array(pts, float)
    seg = np.hypot(*np.diff(path, axis=0).T)
    total = seg.sum()
    out = []
    for i in range(count):
        d = (i + offset) / count * total
        j = min(np.searchsorted(np.cumsum(seg), d), len(seg) - 1)
        t = (d - (np.cumsum(seg)[j] - seg[j])) / seg[j]
        out.append(tuple(path[j] + (path[j + 1] - path[j]) * t))
    return out


def main(out: Path) -> None:
    img = Image.new("RGBA", (W * SS, H * SS), FOG + (255,))
    d = ImageDraw.Draw(img)
    mouth = arch_outline()
    scales = [FAR_SCALE ** (k / RINGS) for k in range(RINGS + 1)]

    for k in range(RINGS):
        outer, inner = scaled(mouth, scales[k]), scaled(mouth, scales[k + 1])
        t = (k / RINGS) ** 0.9
        wall = mix(WALL_MOUTH, FOG, t * 0.85)
        floor = mix(FLOOR_MOUTH, FOG, t * 0.85)
        # the course nearest the light is lit by it
        if k == RINGS - 1:
            wall = mix(wall, LIT_STONE, 0.45)
            floor = mix(floor, LIT_STONE, 0.35)
        d.polygon([(s(x), s(y)) for x, y in outer], fill=wall)
        # floor: the band between the two rings' bottom edges
        d.polygon([(s(outer[0][0]), s(outer[0][1])), (s(outer[-1][0]), s(outer[-1][1])),
                   (s(inner[-1][0]), s(inner[-1][1])), (s(inner[0][0]), s(inner[0][1]))], fill=floor)
        width = max(2.0, 7 * scales[k])
        # stone joints: radial segments across the course, staggered by course
        for p in perimeter_points(outer, JOINTS, 0.5 * (k % 2)):
            q = (VX + (p[0] - VX) * scales[k + 1] / scales[k], VY + (p[1] - VY) * scales[k + 1] / scales[k])
            d.line([(s(p[0]), s(p[1])), (s(q[0]), s(q[1]))], fill=LINE, width=round(s(width * 0.8)))
        # floor slabs: lines converging on the vanishing point
        for fx in np.linspace(0, W, 5)[1:-1]:
            a = (VX + (fx - VX) * scales[k], VY + (H - VY) * scales[k])
            b = (VX + (fx - VX) * scales[k + 1], VY + (H - VY) * scales[k + 1])
            d.line([(s(a[0]), s(a[1])), (s(b[0]), s(b[1]))], fill=LINE, width=round(s(width * 0.7)))
        d.line([(s(x), s(y)) for x, y in outer] + [(s(outer[0][0]), s(outer[0][1]))], fill=LINE, width=round(s(width)))
        d.line([(s(outer[0][0]), s(outer[0][1])), (s(inner[0][0]), s(inner[0][1]))], fill=LINE, width=round(s(width)))
        d.line([(s(outer[-1][0]), s(outer[-1][1])), (s(inner[-1][0]), s(inner[-1][1]))], fill=LINE, width=round(s(width)))

    # the far opening: two flat tones of light, outlined
    far = scaled(mouth, scales[-1])
    d.polygon([(s(x), s(y)) for x, y in far], fill=GLOW_OUT)
    d.polygon([(s(x), s(y)) for x, y in scaled(mouth, scales[-1] * 0.72)], fill=GLOW_IN)
    d.line([(s(x), s(y)) for x, y in far] + [(s(far[0][0]), s(far[0][1]))], fill=LINE, width=round(s(2.5)))
    # gold rim: the light spilling over the opening's edge, up the walls and
    # over the vault (the open path, not along the floor)
    rim = scaled(mouth, scales[-1] * 1.04)
    d.line([(s(x), s(y)) for x, y in rim], fill=GLOW_IN, width=round(s(3)))

    result = img.resize((W, H), Image.BOX)
    result.save(out, optimize=True)
    print(f"wrote {out} {result.size}")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else OUT)
