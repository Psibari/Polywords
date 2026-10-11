"""Wall vein glow layers for the Hunt stone wall.

Pete's decision (2026-10-11): the Hunt wall's gold veins pulse once on each CORRECT
answer, tinted to the momentum tier. This builds the four layers that pulse.

Reads  assets/images/background/StoneWall.png (853x1844).
Writes assets/images/background/wall-veins/ -- all four are 853x1844 RGBA, the exact canvas
of StoneWall.png, so they register pixel for pixel. WHITE with alpha only: the app tints
them per tier with Image tintColor.
  veins.png        crisp vein lines on the wall body (ledge excluded)
  veins_halo.png   pre-blurred glow around those veins
  shelf.png        crisp lines on the ledge and brackets (y 1320-1500)
  shelf_halo.png   pre-blurred glow for the ledge
Generated art: never hand-edit the PNGs, re-run this script.

Usage: python3 tools/art/build_wall_veins.py [wall_png] [out_dir]   (Pillow, numpy)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parents[2]
WALL = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO / 'assets/images/background/StoneWall.png'
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else REPO / 'assets/images/background/wall-veins'

SHELF_Y0, SHELF_Y1 = 1320, 1500   # ledge lit edge is y=1350 (bossGauntletLedge.ts), plus brackets


def blur_alpha(a, rad):
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.array(img.filter(ImageFilter.GaussianBlur(rad))) / 255.0


def white(alpha_map):
    h, w = alpha_map.shape
    o = np.zeros((h, w, 4), np.uint8)
    o[..., :3] = 255
    o[..., 3] = (np.clip(alpha_map, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(o, 'RGBA')


def main():
    wall = Image.open(WALL).convert('RGB')
    w, h = wall.size
    assert (w, h) == (853, 1844), f'unexpected wall size {w}x{h}'
    im = np.array(wall).astype(float)
    r, b = im[..., 0], im[..., 2]

    # soft "gold on purple" score
    alpha = np.clip((r - b - 12) / (60 - 12), 0, 1) * np.clip((r - 60) / 50, 0, 1)
    yy = np.arange(h)[:, None] * np.ones((1, w))
    shelf = (yy >= SHELF_Y0) & (yy < SHELF_Y1)

    # thicken slightly so a glowing vein reads at phone size
    thick = np.maximum(alpha, blur_alpha(alpha, 1.2) * 1.6)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, mask in (('veins', ~shelf), ('shelf', shelf)):
        white(np.where(mask, thick, 0)).save(OUT / f'{name}.png', optimize=True)
        base = np.where(mask, alpha, 0)
        halo = np.maximum(blur_alpha(base, 7) * 5.0, blur_alpha(base, 18) * 9.0)
        white(halo).save(OUT / f'{name}_halo.png', optimize=True)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
