"""Cut the BACK mountain range out of bg.webp as its own see-through layer (ridge.webp).

bg.webp is one opaque painting (sky + back range + second range). The moon has to rise from BEHIND the back
range, so this makes a copy of the painting that is see-through above the back range's top edge and opaque
below it. Drawn on top of the moon, with the unchanged bg.webp underneath, it hides the moon until the moon
clears the ridge. Nothing in bg.webp changes.

Edge finding: per column, the first strong vertical drop in brightness (bright glow above, dark range below)
searched downward from SEARCH_TOP, then median-smoothed. Run:  python tools/art/home_terrace/make_ridge.py
Writes assets/images/home/terrace/ridge.webp and tools/art/source/ridge_check.png (red = the cut line).
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "assets/images/home/terrace/bg.webp"
OUT = ROOT / "assets/images/home/terrace/ridge.webp"
CHECK = ROOT / "tools/art/source/ridge_check.png"

SEARCH_TOP, SEARCH_BOTTOM = 1050, 1750  # px in the 1290 x 2796 painting
DROP = -16.0                            # brightness drop (over STEP px) that counts as the ridge edge
STEP = 8
SMOOTH = 15                             # median window across columns

im = Image.open(SRC).convert("RGB")
rgb = np.asarray(im).astype(float)
H, W = rgb.shape[:2]
L = rgb @ np.array([0.299, 0.587, 0.114])
S = np.apply_along_axis(lambda v: np.convolve(v, np.ones(7) / 7, mode="same"), 1, L[SEARCH_TOP:SEARCH_BOTTOM])
g = S[STEP:] - S[:-STEP]

# Start from the strong left edge, then follow the ridge column by column: in each column look only a short
# way above/below the previous edge and take the strongest brightness drop there. This stays on the BACK range
# on the right, where it fades into the magenta haze and a plain threshold jumps to the second range.
WINDOW = 28
first = np.where(g[:, 0] < DROP)[0]
edge = np.zeros(W)
edge[0] = SEARCH_TOP + first[0] + STEP / 2
for x in range(1, W):
    c = int(edge[x - 1] - SEARCH_TOP - STEP / 2)
    lo, hi = max(0, c - WINDOW), min(g.shape[0], c + WINDOW + 1)
    seg = g[lo:hi, x]
    edge[x] = SEARCH_TOP + lo + int(np.argmin(seg)) + STEP / 2
pad = SMOOTH // 2
padded = np.pad(edge, pad, mode="edge")
edge = np.array([np.median(padded[i:i + SMOOTH]) for i in range(W)])

# The last columns sit in the faintest haze and wobble; carry the line on at the slope of the 120 columns before.
TAIL = 50
slope = (edge[W - TAIL - 1] - edge[W - TAIL - 121]) / 120.0
for x in range(W - TAIL, W):
    edge[x] = edge[W - TAIL - 1] + slope * (x - (W - TAIL - 1))

# alpha: 0 above the edge, 1 below, 3 px soft transition
yy = np.arange(H)[:, None]
alpha = np.clip((yy - edge[None, :]) / 3.0 + 0.5, 0, 1)
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
Image.fromarray(out, "RGBA").save(OUT, "WEBP", quality=92, method=6)

chk = np.asarray(im).copy()
for x in range(W):
    y = int(edge[x])
    chk[max(0, y - 2):y + 3, x] = [255, 40, 40]
Image.fromarray(chk).resize((W // 2, H // 2)).save(CHECK)
print("edge y min/max:", edge.min(), edge.max())
