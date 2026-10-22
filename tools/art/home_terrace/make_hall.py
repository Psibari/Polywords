"""Cuts the terrace Home HALL (the lit passage seen when ENTER THE HUNT / POLYBOOK retreat) out of
Pete's 2026-10-22 art `tools/art/source/hall_with_casing.png` (2040 x 1200).

That source is the console casing with the hall showing through its opening: the Daily's tunnel at
its true proportions, centred, with the side walls extended to fill the wide opening (no stretching;
the first attempt stretched the tall tunnel and warped the arch). The opening in the source, measured
from the frame's inner edges, is x 416..1627, y 216..961 (1212 x 746). This script keeps that
opening, inset 2 px so no frame edge comes along, and scales it to 1140 x 705, the casing's opening
(casing.png: x 161..1300, y 143..847). The result is drawn BEHIND the casing in the console's niche.

Output: assets/images/home/terrace/hall.png, 1140 x 705. Rerun this script; never hand-edit it.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / 'tools/art/source/hall_with_casing.png'
OUT = ROOT / 'assets/images/home/terrace/hall.png'

OPENING = (416, 216, 1628, 962)   # left, top, right, bottom (exclusive) of the opening in the source
INSET = 2
SIZE = (1140, 705)

box = (OPENING[0] + INSET, OPENING[1] + INSET, OPENING[2] - INSET, OPENING[3] - INSET)
im = Image.open(SRC).convert('RGBA')
hall = im.crop(box)
alpha = hall.getchannel('A')
assert alpha.getextrema()[0] >= 250, ('opening has transparent pixels', alpha.getextrema())
hall = hall.convert('RGB').resize(SIZE, Image.LANCZOS)
hall.save(OUT, optimize=True)
print('wrote', OUT, hall.size)
