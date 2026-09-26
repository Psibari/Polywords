"""Build assets/images/dailycastle/gate_scroll.png from gate2.png.

Pete's ruling (2026-09-26): the Daily gate takes the old Daily scroll colour
(assets/images/textures/scroll_paper.png). Measured, the two are nearly the
same hue and lightness; the scroll is about twice as saturated. So this only
moves hue, saturation and mean lightness to the scroll's, and keeps every
pixel's own lightness offset — the plank lines and grain keep their contrast.
(A straight histogram match was tried first; it flattened the plank lines.)

Rerun after any change to either source:
    python3 tools/art/build_daily_gate.py   (needs Pillow and numpy)
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
GATE = ROOT / "assets/images/dailycastle/gate2.png"
SCROLL = ROOT / "assets/images/textures/scroll_paper.png"
OUT = ROOT / "assets/images/dailycastle/gate_scroll.png"


def rgb_to_hls(rgb):
    with np.errstate(divide="ignore", invalid="ignore"):
        return _rgb_to_hls(rgb)


def _rgb_to_hls(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    l = (mx + mn) / 2
    d = mx - mn
    s = np.where(d == 0, 0, d / np.where(l < 0.5, mx + mn, 2 - mx - mn + 1e-12))
    safe = np.where(d == 0, 1, d)
    h = np.where(mx == r, ((g - b) / safe) % 6,
        np.where(mx == g, (b - r) / safe + 2, (r - g) / safe + 4)) / 6
    return np.where(d == 0, 0, h), l, s


def hls_to_rgb(h, l, s):
    c = (1 - np.abs(2 * l - 1)) * s
    hp = (h % 1) * 6
    x = c * (1 - np.abs(hp % 2 - 1))
    z = np.zeros_like(h)
    conds = [hp < 1, hp < 2, hp < 3, hp < 4, hp < 5, hp >= 5]
    rs = np.select(conds, [c, x, z, z, x, c])
    gs = np.select(conds, [x, c, c, x, z, z])
    bs = np.select(conds, [z, z, x, c, c, x])
    m = l - c / 2
    return np.stack([rs + m, gs + m, bs + m], -1)


def stats(path):
    a = np.asarray(Image.open(path).convert("RGBA")).astype(float) / 255
    px = a[a[..., 3] > 0.8][:, :3]
    h, l, s = rgb_to_hls(px)
    return np.median(h), l.mean(), s.mean()


def main() -> None:
    g_h, g_l, g_s = stats(GATE)
    s_h, s_l, s_s = stats(SCROLL)
    gate = np.asarray(Image.open(GATE).convert("RGBA")).astype(float) / 255
    h, l, s = rgb_to_hls(gate[..., :3])
    h = (h + (s_h - g_h)) % 1
    l = np.clip(l + (s_l - g_l), 0, 1)
    s = np.clip(s * (s_s / g_s), 0, 1)
    rgb = np.clip(hls_to_rgb(h, l, s), 0, 1)
    out = np.concatenate([rgb, gate[..., 3:]], -1)
    Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA").save(OUT, optimize=True)
    print(f"gate hue {g_h*360:.0f} -> {s_h*360:.0f}, lightness {g_l:.3f} -> {s_l:.3f}, "
          f"saturation x{s_s/g_s:.2f}; wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
