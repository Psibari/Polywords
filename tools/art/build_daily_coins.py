"""Build the Daily floor coins: coin_feather.png, coin_gold.png, coin_glow.png.

Pete's design (2026-09-26): each solved round leaves a coin on the
courtyard floor between the bottom step and the answer wall, one to four
with a white feather; the win replaces them with one bigger gold-feather
coin. A coin is a disc seen from above at the floor's angle: a midnight
enamel face inside a metal ring, on a metal edge, with a soft shadow where it
meets the floor. Option D (Pete, 2026-09-26): the white-feather coins are
silver and gold is kept for the win's coin, whose gold is the brand golds
(#F5C842, amber #C8920E, gold-dark #8F6F18). Feathers are the game's own
feather art (assets/ui/feather-life-filled.png, feather-gold-reward.png),
standing upright on the face like an emblem.

Output is 3x: white coin 62 x 40.7 pt -> 186 x 122 px; gold 100 x 64 pt ->
300 x 192 px. The coin's contact point with the floor is the bottom of the
edge, at (image height - SHADOW_PAD) — dailyCastleScene mirrors this.

coin_glow.png is the win's soft gold glow behind the gold coin: an ellipse
at the floor's angle, brand gold, falling off smoothly to fully transparent
at its edge. It is an image because a View with a large borderRadius draws
a hard-edged pill on native (seen on device).

    python3 tools/art/build_daily_coins.py   (Pillow, numpy)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
WHITE_FEATHER = ROOT / "assets/ui/feather-life-filled.png"
GOLD_FEATHER = ROOT / "assets/ui/feather-gold-reward.png"
OUT_DIR = ROOT / "assets/images/dailycastle"

GOLD = (245, 200, 66)
AMBER = (200, 146, 14)
GOLD_DARK = (143, 111, 24)
# Metals: (ring, edge highlight, edge shadow). Pete, 2026-09-26 (option D): the
# white-feather coins are silver; gold is kept for the win's coin alone.
GOLD_METAL = (GOLD, AMBER, GOLD_DARK)
SILVER_METAL = ((214, 214, 228), (160, 160, 178), (88, 88, 104))
# Enamel face: brand surface-raised at the centre darkening to background-deep
# (#211B4A family -> #0B0920) at the rim, with a faint grain.
FACE_CENTRE = (46, 36, 88)
FACE_RIM = (14, 11, 32)
FACE_RATIO = 0.53      # ellipse height / width: the floor's viewing angle
EDGE_FRAC = 0.09       # coin thickness as a fraction of its width
RING_FRAC = 0.055      # ring width as a fraction of its width
SHADOW_PAD = 6         # px of transparent margin under the edge for the shadow


def ellipse_mask(size, box, blur=0.0):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).ellipse(box, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def enamel_face(width: int, height: int) -> Image.Image:
    """Midnight enamel: radial from FACE_CENTRE to FACE_RIM, fixed-seed grain."""
    y, x = np.mgrid[0:height, 0:width].astype(np.float32)
    r = np.clip(np.hypot((x + 0.5) / width * 2 - 1, (y + 0.5) / height * 2 - 1), 0, 1)[..., None] ** 1.4
    rgb = np.array(FACE_CENTRE, np.float32) * (1 - r) + np.array(FACE_RIM, np.float32) * r
    rgb += np.random.default_rng(1).normal(0, 6, (height, width, 1))
    alpha = np.full((height, width, 1), 255, np.float32)
    return Image.fromarray(np.clip(np.concatenate([rgb, alpha], 2), 0, 255).astype(np.uint8), "RGBA")


def coin(width_px: int, feather_path: Path, feather_frac: float, metal=GOLD_METAL) -> Image.Image:
    ring_rgb, edge_hi, edge_lo = metal
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
    base = np.array(edge_hi, np.float32)[None, None, :] * shade + np.array(edge_lo, np.float32)[None, None, :] * (1 - shade) * 0.6
    edge_rgb = np.broadcast_to(base, (h, width_px, 3)).copy()
    edge_layer = Image.fromarray(np.clip(edge_rgb, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    sweep = Image.new("L", size, 0)
    d = ImageDraw.Draw(sweep)
    d.ellipse((0, edge, width_px - 1, face_h + edge - 1), fill=255)
    d.rectangle((0, face_h // 2, width_px - 1, face_h // 2 + edge), fill=255)
    edge_layer.putalpha(sweep)
    out.alpha_composite(edge_layer)

    # The ring (the face's rim), lit from the top.
    ring = Image.new("RGBA", size)
    rv = np.linspace(1.15, 0.8, h)[:, None, None]
    ring_rgb = np.clip(np.array(ring_rgb, np.float32)[None, None, :] * rv, 0, 255)
    ring = Image.fromarray(np.broadcast_to(ring_rgb, (h, width_px, 3)).astype(np.uint8), "RGB").convert("RGBA")
    ring.putalpha(ellipse_mask(size, (0, 0, width_px - 1, face_h - 1)))
    out.alpha_composite(ring)

    # Enamel face inside the ring.
    r = round(width_px * RING_FRAC)
    face = enamel_face(width_px, face_h)
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


def glow(width: int, height: int) -> Image.Image:
    """Elliptical radial glow: brand gold, alpha (1 - r)^2, zero at the rim."""
    y, x = np.mgrid[0:height, 0:width].astype(np.float32)
    r = np.hypot((x + 0.5) / width * 2 - 1, (y + 0.5) / height * 2 - 1)
    a = np.clip(1 - r, 0, 1) ** 2
    out = np.zeros((height, width, 4), np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = 0xF5, 0xC8, 0x42
    out[..., 3] = np.round(a * 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def main() -> None:
    white = coin(186, WHITE_FEATHER, 0.74, SILVER_METAL)
    # 100 pt wide, about 1.6x a white coin (Pete, 2026-09-26).
    gold = coin(300, GOLD_FEATHER, 0.74, GOLD_METAL)
    white.save(OUT_DIR / "coin_feather.png", optimize=True)
    gold.save(OUT_DIR / "coin_gold.png", optimize=True)
    halo = glow(660, 365)   # the gold coin (300 x 192) at 2.2 x 1.9
    halo.save(OUT_DIR / "coin_glow.png", optimize=True)
    print("wrote coin_feather.png", white.size, "coin_gold.png", gold.size, "coin_glow.png", halo.size)


if __name__ == "__main__":
    main()
