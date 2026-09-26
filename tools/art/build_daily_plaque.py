"""Build assets/images/dailycastle/answerplaque_stone.png from ledge.png.

The Daily answer plaque is a stone block jutting out of the answer wall: the
castle-step slab from ledge.png, cut to a thin top lip over a tall front face
(the look Pete approved from the 2026-09-26 mock), built the same way as that
mock except that the front's two halves crossfade instead of butting, which
removes the vertical line the mock showed down the middle.

Output is 3x the plaque slot (184 x 64 pt -> 552 x 192 px). Rerun after any
change to ledge.png:  python3 tools/art/build_daily_plaque.py   (needs Pillow)
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets/images/dailycastle/ledge.png"
OUT = ROOT / "assets/images/dailycastle/answerplaque_stone.png"

W, H = 552, 192
LIP = round(H * 0.2)          # top-face share of the plaque height
SLAB = (24, 96, 1309, 292)    # ledge.png visible-alpha bounds
SEAM = 100                    # gold seam row inside SLAB (top face above it)
LIP_END = 160                 # lip: slab px kept at each end, middle stretched
BLEND = 60                    # front: output px over which the halves crossfade


def three_slice(img: Image.Image, width: int, height: int, end_src: int) -> Image.Image:
    """Ends at their natural proportion, the middle stretched between them."""
    k = height / img.height
    end = max(1, round(end_src * k))
    left = img.crop((0, 0, end_src, img.height)).resize((end, height), Image.LANCZOS)
    right = img.crop((img.width - end_src, 0, img.width, img.height)).resize((end, height), Image.LANCZOS)
    mid = img.crop((end_src, 0, img.width - end_src, img.height)).resize((width - 2 * end, height), Image.LANCZOS)
    out = Image.new("RGBA", (width, height))
    out.paste(left, (0, 0))
    out.paste(mid, (end, 0))
    out.paste(right, (width - end, 0))
    return out


def two_ends(img: Image.Image, width: int, height: int) -> Image.Image:
    """The slab's two natural-proportion ends, crossfaded in the middle.

    At plaque height the slab's ends alone are wider than the plaque, so the
    front is its left end and right end meeting in the middle. A hard cut
    there showed as a vertical line; the BLEND band hides the join.
    """
    k = height / img.height
    scaled = img.resize((round(img.width * k), height), Image.LANCZOS)
    half = width // 2 + BLEND // 2
    left = scaled.crop((0, 0, half, height))
    right = scaled.crop((scaled.width - half, 0, scaled.width, height))
    out = Image.new("RGBA", (width, height))
    out.paste(left, (0, 0))
    # Right half, faded in across the blend band.
    mask = Image.new("L", (half, height), 255)
    for x in range(BLEND):
        for y in range(height):
            mask.putpixel((x, y), round(255 * (x + 0.5) / BLEND))
    out.paste(right, (width - half, 0), mask)
    return out


def main() -> None:
    slab = Image.open(SRC).convert("RGBA").crop(SLAB)
    # +3 keeps the whole gold seam on the lip.
    top = slab.crop((0, 0, slab.width, SEAM + 3))
    front = slab.crop((0, SEAM + 3, slab.width, slab.height))
    plaque = Image.new("RGBA", (W, H))
    plaque.alpha_composite(three_slice(top, W, LIP, LIP_END), (0, 0))
    plaque.alpha_composite(two_ends(front, W, H - LIP), (0, LIP))
    plaque.save(OUT, optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} {plaque.size}")


if __name__ == "__main__":
    main()
