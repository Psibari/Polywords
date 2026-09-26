"""Build the Daily floor coins: coin_feather.png and coin_gold.png.

Pete's design (2026-09-26): each solved round leaves a coin on the
courtyard floor between the bottom step and the answer wall, one to four
with a white feather; the win replaces them with one bigger gold-feather
coin. A coin is a disc seen from above at the floor's angle: a stone face
(the step slab's top face, ledge.png) inside a gold ring, on a gold edge,
with a soft shadow where it meets the floor. Feathers are the game's own
feather art (assets/ui/feather-life-filled.png, feather-gold-reward.png),
standing upright on the face like an emblem. Colours are the brand golds
(#F5C842, amber #C8920E, gold-dark #8F6F18).

Output is 3x: white coin 62 x 40 pt -> 186 x 120 px; gold 80 x 52 pt ->
240 x 156 px. The coin's contact point with the floor is the bottom of the
edge, at (image height - SHADOW_PAD) — dailyCastleScene mirrors this.

    python3 tools/art/build_daily_coins.py   (Pillow, numpy)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
LEDGE = ROOT / "assets/images/dailycastle/ledge.png"
WHITE_FEATHER = ROOT / "assets/ui/feather-life-filled.png"
GOLD_FEATHER = ROOT / "assets/ui/feather-gold-reward.png"
OUT_DIR = ROOT / "assets/images/dailycastle"

SLAB = (24, 96, 1309, 292)
SEAM = 100
GOLD = (245, 200, 66)
AMBER = (200, 146, 14)
GOLD_DARK = (143, 111, 24)
FACE_RATIO = 0.53      # ellipse height / width: the floor's viewing angle
EDGE_FRAC = 0.09       # coin thickness as a fraction of its width
RING_FRAC = 0.055      # gold ring width as a fraction of its width
SHADOW_PAD = 6         # px of transparent margin under the edge for the shadow


def ellipse_mask(size, box, blur=0.0):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).ellipse(box, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def coin(width_px: int, feather_path: Path, feather_frac: float) -> Image.Image:
    face_h = round(width_px * FACE_RATIO)
    edge = round(width_px * EDGE_FRAC)
    h = face_h + edge + SHADOW_PAD
    size = (width_px, h)
    out = Image.new("RGBA", size)

    # Soft contact shadow on the floor.
    shadow = Image.new("RGBA", size, (5, 4, 12, 0))
    shadow.putalpha(ellipse_mask(size, (2, edge + 4, width_px - 2, face_h + edge + SHADOW_PAD - 1), blur=3).point(lambda v: v * 0.55))
    out.alpha_composite(shadow)

    # Gold edge: the face ellipse swept down by the thickness, shaded left to right.
    edge_layer = Image.new("RGBA", size)
    x = np.linspace(0, 1, width_px)[None, :, None]
    shade = 0.62 + 0.38 * np.sin(np.pi * x) ** 0.6
    base = np.array(AMBER, np.float32)[None, None, :] * shade + np.array(GOLD_DARK, np.float32)[None, None, :] * (1 - shade) * 0.6
    edge_rgb = np.broadcast_to(base, (h, width_px, 3)).copy()
    edge_layer = Image.fromarray(np.clip(edge_rgb, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    sweep = Image.new("L", size, 0)
    d = ImageDraw.Draw(sweep)
    d.ellipse((0, edge, width_px - 1, face_h + edge - 1), fill=255)
    d.rectangle((0, face_h // 2, width_px - 1, face_h // 2 + edge), fill=255)
    edge_layer.putalpha(sweep)
    out.alpha_composite(edge_layer)

    # Gold ring (the face's rim), lit from the top.
    ring = Image.new("RGBA", size)
    rv = np.linspace(1.15, 0.8, h)[:, None, None]
    ring_rgb = np.clip(np.array(GOLD, np.float32)[None, None, :] * rv, 0, 255)
    ring = Image.fromarray(np.broadcast_to(ring_rgb, (h, width_px, 3)).astype(np.uint8), "RGB").convert("RGBA")
    ring.putalpha(ellipse_mask(size, (0, 0, width_px - 1, face_h - 1)))
    out.alpha_composite(ring)

    # Stone face inside the ring: the step slab's top face, a touch darker so
    # the feather reads.
    r = round(width_px * RING_FRAC)
    slab = Image.open(LEDGE).convert("RGBA").crop(SLAB)
    top = slab.crop((300, 8, 700, SEAM - 8)).resize((width_px, face_h), Image.LANCZOS)
    t = np.asarray(top).astype(np.float32)
    t[..., :3] *= 0.72
    face = Image.fromarray(np.clip(t, 0, 255).astype(np.uint8), "RGBA")
    face.putalpha(ellipse_mask((width_px, face_h), (r, round(r * FACE_RATIO), width_px - 1 - r, face_h - 1 - round(r * FACE_RATIO)), blur=0.6))
    out.alpha_composite(face, (0, 0))
    # inner shadow under the ring's top lip
    lip = Image.new("RGBA", size, (5, 4, 12, 0))
    lm = ellipse_mask(size, (r, round(r * FACE_RATIO), width_px - 1 - r, face_h - 1 - round(r * FACE_RATIO)))
    inner = ellipse_mask(size, (r, round(r * FACE_RATIO) + 5, width_px - 1 - r, face_h - 1 - round(r * FACE_RATIO) + 5))
    lip.putalpha(Image.fromarray((np.asarray(lm).astype(np.int16) - np.asarray(inner)).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)).point(lambda v: v * 0.6))
    out.alpha_composite(lip)

    # Feather emblem, upright, centred on the face.
    f = Image.open(feather_path).convert("RGBA")
    f = f.crop(f.getbbox())
    fh = round(face_h * feather_frac)
    fw = round(f.width * fh / f.height)
    f = f.resize((fw, fh), Image.LANCZOS)
    fs = Image.new("RGBA", f.size, (5, 4, 12, 0))
    fs.putalpha(f.getchannel("A").point(lambda v: v * 0.5))
    cx, cy = width_px // 2, face_h // 2
    out.alpha_composite(fs, (cx - fw // 2 + 2, cy - fh // 2 - round(fh * 0.04) + 3))
    out.alpha_composite(f, (cx - fw // 2, cy - fh // 2 - round(fh * 0.04)))
    return out


def main() -> None:
    white = coin(186, WHITE_FEATHER, 0.74)
    gold = coin(240, GOLD_FEATHER, 0.74)
    white.save(OUT_DIR / "coin_feather.png", optimize=True)
    gold.save(OUT_DIR / "coin_gold.png", optimize=True)
    print("wrote coin_feather.png", white.size, "coin_gold.png", gold.size)


if __name__ == "__main__":
    main()
