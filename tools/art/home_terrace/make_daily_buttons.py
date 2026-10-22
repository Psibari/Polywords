"""Draws the terrace DAILY CHALLENGE button (two states).

Same flat build as Pete's btn_book.png / btn_hunt.png (navy face, 30 px side frame, thin shaded
inner edge) at 1121 x 175, the size of the strip of wall recess left visible above the console.
Frame is gold while the Daily is unplayed, dull gray once played. Rerun this script; never hand-edit the outputs.
"""
from pathlib import Path
import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[3] / 'assets/images/home/terrace'
W, H = 1121, 175
SIDE, TOPBOT = 30, 10
FACE = (27, 26, 57)
FRAMES = {'': (245, 200, 66), '_done': (112, 110, 126)}  # unplayed gold, played gray


def button(frame):
    a = np.zeros((H, W, 4), np.uint8)
    base = np.array(frame, float)
    a[..., :3] = np.array(FACE)
    a[..., 3] = 255
    a[:TOPBOT, :, :3] = base
    a[:, :SIDE, :3] = base
    # Right and bottom frame sit slightly in shade, as in the lavender buttons.
    shade = (base * 0.87).astype(np.uint8)
    a[H - TOPBOT:, :, :3] = shade
    a[:, W - SIDE:, :3] = shade
    # One thin darker line where frame meets face.
    line = (base * 0.77).astype(np.uint8)
    a[TOPBOT:TOPBOT + 1, SIDE:W - SIDE, :3] = line
    a[TOPBOT:H - TOPBOT, SIDE:SIDE + 1, :3] = line
    # Softened outer rim, as the originals carry.
    a[0, :, 3] = 223
    a[-1, :, 3] = 127
    a[:, 0, 3] = 223
    a[:, -1, 3] = 223
    return Image.fromarray(a, 'RGBA')


for tag, frame in FRAMES.items():
    button(frame).save(OUT / f'btn_daily{tag}.png')
print('ok')
