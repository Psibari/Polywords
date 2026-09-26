"""Build the Daily castle scene (castle_cartoon.png) from Pete's cartoon castle.

Source: tools/art/source/castle_cartoon_src.png, 864 x 1152, the castle Pete
picked on 2026-09-26 ("B"), generated in the cartoon style of his own art so
it matches Polly. This script:

  1. remaps every gold area (tower domes, ropes, step edges) onto the game's
     golds, keeping each area's light and shade: #8F6F18, #C8920E, #F5C842,
     #FFF7D6;
  2. centres the arch (the source draws it CENTRE_SHIFT px left of centre;
     the left edge is filled by reflection);
  3. stretches only the arch's straight sides (rows STRETCH_Y0..STRETCH_Y1)
     by STRETCH_ADD px, so the three clue planks keep their full size;
  4. scales to the 1290 px canvas width and places it on the shared
     1290 x 2796 castle canvas at OFFSET_Y, sky colour filled above, so the
     courtyard floor runs under the answer wall;
  5. cuts the arch opening out (flood fill of its flat colour), so the gate
     and tunnel behind it show.

It prints the opening's measurements; app/ui/dailyCastleScene.ts mirrors them.
Rerun it, never hand-edit the output.

    python3 tools/art/build_daily_castle.py   (Pillow, numpy)
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "tools/art/source/castle_cartoon_src.png"
OUT = ROOT / "assets/images/dailycastle/castle_cartoon.png"

W, H = 1290, 2796
CENTRE_SHIFT = 23          # source px: arch centre x 409 vs image centre 432
STRETCH_Y0, STRETCH_Y1 = 420, 685   # source rows: the arch's straight sides
STRETCH_ADD = 60           # source px added to that band
OFFSET_Y = 70              # canvas px: clues clear the HUD on 375x667, step edge above the coins
OPENING_SEED = (432, 520)  # source px inside the opening (after centring)
OPENING_TOL = 20           # colour tolerance for the opening flood fill

GOLDS = [(0x8F, 0x6F, 0x18), (0xC8, 0x92, 0x0E), (0xF5, 0xC8, 0x42), (0xFF, 0xF7, 0xD6)]


def hsv(rgb):
    r, g, b = [rgb[..., i].astype(np.float32) / 255 for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    h = np.where(nz & (mx == r), ((g - b) / np.where(nz, d, 1)) % 6, h)
    h = np.where(nz & (mx == g), (b - r) / np.where(nz, d, 1) + 2, h)
    h = np.where(nz & (mx == b), (r - g) / np.where(nz, d, 1) + 4, h)
    return h * 60, np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0), mx


def regold(a):
    h, s, v = hsv(a)
    gold = (h >= 8) & (h <= 50) & (s > 0.3) & (v > 0.2)
    t = np.clip((v - 0.43) / (0.98 - 0.43), 0, 1) * (len(GOLDS) - 1)
    i = np.clip(np.floor(t).astype(int), 0, len(GOLDS) - 2); f = (t - i)[..., None]
    stops = np.array(GOLDS, np.float32)
    ramp = stops[i] * (1 - f) + stops[i + 1] * f
    out = a.astype(np.float32)
    out[gold] = ramp[gold]
    return out.clip(0, 255).astype(np.uint8), int(gold.sum())


def centre(a):
    pad = a[:, :CENTRE_SHIFT][:, ::-1]                      # reflect the left edge
    return np.concatenate([pad, a[:, :-CENTRE_SHIFT]], axis=1)


def stretch(a):
    band = Image.fromarray(a[STRETCH_Y0:STRETCH_Y1])
    band = np.array(band.resize((a.shape[1], STRETCH_Y1 - STRETCH_Y0 + STRETCH_ADD), Image.LANCZOS))
    return np.concatenate([a[:STRETCH_Y0], band, a[STRETCH_Y1:]], axis=0)


def flood(a, seed, tol):
    x0, y0 = seed; ref = a[y0, x0].astype(int)
    close = (np.abs(a.astype(int) - ref).max(-1) <= tol)
    seen = np.zeros(close.shape, bool); q = deque([(y0, x0)]); seen[y0, x0] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < close.shape[0] and 0 <= nx < close.shape[1] and close[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    return seen


def main():
    a = np.array(Image.open(SRC).convert("RGB"))
    a, n_gold = regold(a)
    a = stretch(centre(a))
    k = W / a.shape[1]
    big = np.array(Image.fromarray(a).resize((W, round(a.shape[0] * k)), Image.LANCZOS))
    seed = (round(OPENING_SEED[0] * k), round((OPENING_SEED[1] + STRETCH_ADD / 2) * k))
    opening = flood(big, seed, OPENING_TOL)
    # close the opening's ragged anti-aliased rim by one pixel
    grown = opening.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        grown |= np.roll(opening, (dy, dx), (0, 1))
    canvas = np.zeros((H, W, 4), np.uint8)
    canvas[:OFFSET_Y + 2, :, :3] = big[2]; canvas[:OFFSET_Y + 2, :, 3] = 255
    h = min(big.shape[0], H - OFFSET_Y)
    canvas[OFFSET_Y:OFFSET_Y + h, :, :3] = big[:h]
    canvas[OFFSET_Y:OFFSET_Y + h, :, 3] = np.where(grown[:h], 0, 255)
    Image.fromarray(canvas, "RGBA").save(OUT, optimize=True)

    ys, xs = np.nonzero(grown); ys = ys + OFFSET_Y
    print(f"wrote {OUT.name}: gold px remapped {n_gold}, source scale {k:.4f}, image bottom {OFFSET_Y + h} px")
    print(f"opening px: x {xs.min()}-{xs.max()}  y {ys.min()}-{ys.max()}")
    for y in range(ys.min(), ys.max() + 1, 30):
        r = np.nonzero(grown[y - OFFSET_Y])[0]
        if r.size: print(f"  y {y:5d} px ({y / 3:6.1f} pt)  opening x {r.min()}-{r.max()} px  width {(r.max() - r.min() + 1) / 3:6.1f} pt")
    col = canvas[:, W // 2, :3].astype(int).sum(1)
    print("step edge / floor search: dark rows at centre below opening:", [y for y in range(ys.max(), ys.max() + 420) if col[y] < 90][::6])


if __name__ == "__main__":
    main()
