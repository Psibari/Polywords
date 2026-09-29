"""Build the Daily castle scene (castle_cartoon.png) from Pete's cartoon castle.

Source: tools/art/source/castle_cartoon_src.png, 864 x 1152, the castle Pete
picked on 2026-09-26 ("B"), generated in the cartoon style of his own art so
it matches Polly. This script:

  1. remaps every gold area (tower domes, ropes, step edges) onto a white
     ramp at rest, keeping each area's light and shade: #C9C9C8, #DDDDDC,
     #EFEFEE, #FFFFFF (Pete, 2026-09-27: they flash gold on a correct answer);
  2. centres the arch (the source draws it CENTRE_SHIFT px left of centre;
     the left edge is filled by reflection);
  3. removes the top step (rows STEP_CUT: one 53-row repeat of gold edge,
     face and the next step's top) and stretches only the arch's straight
     sides (rows STRETCH_Y0..STRETCH_Y1) by STRETCH_ADD px, so the door
     reaches down into the removed step's place and the clues have room to
     sit centred (Pete, 2026-09-26);
  4. scales to the 1290 px canvas width and places it on the shared
     1290 x 2796 castle canvas at OFFSET_Y, sky colour filled above, so the
     courtyard floor runs under the answer wall;
  5. cuts the arch opening out (flood fill of its flat colour), so the gate
     and tunnel behind it show;
  6. retints every purple to the hero book's cover (Pete, 2026-09-27: the
     castle was too light): hue, saturation and brightness move by the
     difference between the castle's lit stone face (median purple in
     STONE_SAMPLE, the right tower's face) and the book's median cover
     purple, measured from HERO_BOOK itself, so every shade keeps its place
     relative to the others. The trim and the opening's shape are untouched;
  7. retints the courtyard floor (rows FLOOR_ROWS, below the bottom step and
     down to the answer wall's cap) the same way, from the band's own median
     purple to FLOOR_TARGET, measured from Pete's mock (2026-09-27). The walls
     keep step 6's colour.

It also writes castle_cartoon_gold_flash.png: the same canvas, transparent
except the trim, which it paints in the game's golds (#8F6F18, #C8920E,
#F5C842, #FFF7D6). DailyCastleStage lights it over the castle on every
correct answer, as part of the gold hit (a crown-gold tint and a bloom behind
each cap; app/ui/dailyCastleScene.ts DAILY_GOLD_HIT).

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
OUT_FLASH = ROOT / "assets/images/dailycastle/castle_cartoon_gold_flash.png"

W, H = 1290, 2796
CENTRE_SHIFT = 23          # source px: arch centre x 409 vs image centre 432
STRETCH_Y0, STRETCH_Y1 = 420, 685   # source rows: the arch's straight sides
STEP_CUT = (697, 750)      # source rows of the top step, removed (4 steps -> 3)
STRETCH_ADD = 60 + (STEP_CUT[1] - STEP_CUT[0])   # the cut step's height goes to the door
OFFSET_Y = 70              # canvas px: clues clear the HUD on 375x667, step edge above the coins
OPENING_SEED = (432, 520)  # source px inside the opening (after centring)
OPENING_TOL = 20           # colour tolerance for the opening flood fill

HERO_BOOK = ROOT / "assets/images/hero-book-rig-v1/cover-outer.png"
STONE_SAMPLE = (900, 400, 1290, 1000)   # canvas px: the right tower's lit stone face

FLOOR_ROWS = (1521, 1728)  # canvas px: bottom step's outline to DAILY_ANSWER_WALL.capTopPx
FLOOR_TARGET = (0x27, 0x1A, 0x50)   # the floor in Pete's mock (2026-09-27)

GOLDS = [(0x8F, 0x6F, 0x18), (0xC8, 0x92, 0x0E), (0xF5, 0xC8, 0x42), (0xFF, 0xF7, 0xD6)]
WHITES = [(0xC9, 0xC9, 0xC8), (0xDD, 0xDD, 0xDC), (0xEF, 0xEF, 0xEE), (0xFF, 0xFF, 0xFF)]


def hsv(rgb):
    r, g, b = [rgb[..., i].astype(np.float32) / 255 for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    h = np.where(nz & (mx == r), ((g - b) / np.where(nz, d, 1)) % 6, h)
    h = np.where(nz & (mx == g), (b - r) / np.where(nz, d, 1) + 2, h)
    h = np.where(nz & (mx == b), (r - g) / np.where(nz, d, 1) + 4, h)
    return h * 60, np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0), mx


def regold(a, ramp):
    """Remap the gold trim onto ramp; also return the trim's mask."""
    h, s, v = hsv(a)
    gold = (h >= 8) & (h <= 50) & (s > 0.3) & (v > 0.2)
    t = np.clip((v - 0.43) / (0.98 - 0.43), 0, 1) * (len(ramp) - 1)
    i = np.clip(np.floor(t).astype(int), 0, len(ramp) - 2); f = (t - i)[..., None]
    stops = np.array(ramp, np.float32)
    ramp = stops[i] * (1 - f) + stops[i + 1] * f
    out = a.astype(np.float32)
    out[gold] = ramp[gold]
    return out.clip(0, 255).astype(np.uint8), gold


def purples(rgb):
    h, s, v = hsv(rgb)
    return (h >= 235) & (h <= 305) & (s > 0.25), h, s, v


def median_purple(rgb, mask):
    return np.median(rgb[mask].reshape(-1, 3), axis=0)


def hsv_of(c):
    return [x.item() for x in hsv(np.array(c, np.float32).reshape(1, 1, 3))]


def hsv_to_rgb(h, s, v):
    c = v * s
    hp = (h / 60) % 6
    x = c * (1 - np.abs(hp % 2 - 1))
    z = np.zeros_like(h)
    conds = [hp < 1, hp < 2, hp < 3, hp < 4, hp < 5, hp >= 5]
    r = np.select(conds, [c, x, z, z, x, c]); g = np.select(conds, [x, c, c, x, z, z]); b = np.select(conds, [z, z, x, c, c, x])
    m = v - c
    return np.stack([r + m, g + m, b + m], -1) * 255


def shift(rgb, mask, h, s, v, source, target):
    """Move the masked pixels by the HSV difference between source and target."""
    (th, ts, tv), (sh, ss, sv) = hsv_of(target), hsv_of(source)
    out = rgb.astype(np.float32)
    new = hsv_to_rgb(h + (th - sh), np.clip(s * ts / ss, 0, 1), np.clip(v * tv / sv, 0, 1))
    out[mask] = new[mask]
    return out.clip(0, 255).astype(np.uint8)


def retint(rgb):
    """Move the castle's purples onto the hero book's cover purple."""
    book = np.array(Image.open(HERO_BOOK).convert("RGBA"))
    book_mask, *_ = purples(book[..., :3])
    book_mask &= book[..., 3] > 250
    target = median_purple(book[..., :3], book_mask)
    mask, h, s, v = purples(rgb)
    x0, y0, x1, y1 = STONE_SAMPLE
    face = mask[y0:y1, x0:x1] & (v[y0:y1, x0:x1] > 0.55)     # lit faces, not shading or lines
    source = median_purple(rgb[y0:y1, x0:x1], face)
    return shift(rgb, mask, h, s, v, source, target), source, target


def retint_floor(rgb):
    """Move the floor band's purples onto FLOOR_TARGET; nothing else moves."""
    y0, y1 = FLOOR_ROWS
    mask, h, s, v = purples(rgb)
    mask[:y0] = False; mask[y1:] = False
    source = median_purple(rgb, mask)
    target = np.array(FLOOR_TARGET, np.float32)
    return shift(rgb, mask, h, s, v, source, target), source, target


def centre(a):
    pad = a[:, :CENTRE_SHIFT][:, ::-1]                      # reflect the left edge
    return np.concatenate([pad, a[:, :-CENTRE_SHIFT]], axis=1)


def cut_step(a):
    return np.concatenate([a[:STEP_CUT[0]], a[STEP_CUT[1]:]], axis=0)


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


def shape(a):
    """Centre, cut the step, stretch and scale to the canvas width."""
    a = stretch(cut_step(centre(a)))
    k = W / a.shape[1]
    return np.array(Image.fromarray(a).resize((W, round(a.shape[0] * k)), Image.LANCZOS)), k


def place(big, grown):
    canvas = np.zeros((H, W, 4), np.uint8)
    canvas[:OFFSET_Y + 2, :, :3] = big[2]; canvas[:OFFSET_Y + 2, :, 3] = 255
    h = min(big.shape[0], H - OFFSET_Y)
    canvas[OFFSET_Y:OFFSET_Y + h, :, :3] = big[:h]
    canvas[OFFSET_Y:OFFSET_Y + h, :, 3] = np.where(grown[:h], 0, 255)
    return canvas, h


def main():
    src = np.array(Image.open(SRC).convert("RGB"))
    white, gold = regold(src, WHITES)
    golden, _ = regold(src, GOLDS)
    big, k = shape(white)
    big_gold, _ = shape(golden)
    trim, _ = shape(np.where(gold, 255, 0).astype(np.uint8))
    seed = (round(OPENING_SEED[0] * k), round((OPENING_SEED[1] + STRETCH_ADD / 2) * k))
    opening = flood(big, seed, OPENING_TOL)
    # close the opening's ragged anti-aliased rim by one pixel
    grown = opening.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        grown |= np.roll(opening, (dy, dx), (0, 1))
    canvas, h = place(big, grown)
    canvas[..., :3], castle_purple, book_purple = retint(canvas[..., :3])
    canvas[..., :3], floor_before, floor_after = retint_floor(canvas[..., :3])
    Image.fromarray(canvas, "RGBA").save(OUT, optimize=True)
    print(f"retint: castle median purple {castle_purple.round()} -> hero book {book_purple.round()}")
    print(f"retint: floor median purple {floor_before.round()} -> mock floor {floor_after.round()}")

    # The flash: the same trim in the golds, pixel for pixel, clear elsewhere.
    flash, _ = place(big_gold, grown)
    trim_canvas, _ = place(np.stack([trim] * 3, -1), grown)
    flash[..., 3] = np.where((trim_canvas[..., 0] > 127) & (canvas[..., 3] > 0), 255, 0)
    flash[:OFFSET_Y + 2, :, 3] = 0
    Image.fromarray(flash, "RGBA").save(OUT_FLASH, optimize=True)

    ys, xs = np.nonzero(grown); ys = ys + OFFSET_Y
    print(f"wrote {OUT.name}, {OUT_FLASH.name}: trim px {int(gold.sum())}, source scale {k:.4f}, image bottom {OFFSET_Y + h} px")
    print(f"opening px: x {xs.min()}-{xs.max()}  y {ys.min()}-{ys.max()}")
    for y in range(ys.min(), ys.max() + 1, 30):
        r = np.nonzero(grown[y - OFFSET_Y])[0]
        if r.size: print(f"  y {y:5d} px ({y / 3:6.1f} pt)  opening x {r.min()}-{r.max()} px  width {(r.max() - r.min() + 1) / 3:6.1f} pt")
    col = canvas[:, W // 2, :3].astype(int).sum(1)
    print("step edge / floor search: dark rows at centre below opening:", [y for y in range(ys.max(), ys.max() + 420) if col[y] < 90][::6])


if __name__ == "__main__":
    main()
