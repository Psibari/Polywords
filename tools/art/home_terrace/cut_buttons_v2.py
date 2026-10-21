# Pete's flat-button console art (2026-10-21). Usage: python3 cut_buttons_v2.py <uploads_dir> <out_dir>
# Inputs (his files): polybook bar, hunt bar, casing-with-hole, wall. Makes the hole transparent
# (flood from centre over near-black pixels) so the tunnel/dark niche behind can show.
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
up, out = sys.argv[1], sys.argv[2]
def load(n): return Image.open(f'{up}/{n}-image.png').convert('RGBA')
def trim(im, box=None):
    a = np.array(im); al = a[:, :, 3] > 8
    rgb = a[:, :, :3]; nonwhite = ~((rgb > 240).all(2))
    ys, xs = np.where(al & nonwhite) if box is None else (None, None)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)) if box is None else im.crop(box)
trim(load('eab71c44')).save(f'{out}/btn_book.png')   # 1121 x 263
trim(load('2c431ab9')).save(f'{out}/btn_hunt.png')   # 1117 x 404
cas = load('f248027c').crop((50, 239, 1508, 1273))    # 1458 x 1034
a = np.array(cas); dark = (a[:, :, :3].max(2) < 14) & (a[:, :, 3] > 10)
lab, _ = ndimage.label(dark); hole = lab == lab[a.shape[0] // 2, a.shape[1] // 2]
ys, xs = np.where(hole); print('hole', xs.min(), ys.min(), xs.max(), ys.max())
a[hole, 3] = 0
Image.fromarray(a).save(f'{out}/casing.png')
trim(load('a41c3e96')).save(f'{out}/wall.png')       # 1095 x 353
