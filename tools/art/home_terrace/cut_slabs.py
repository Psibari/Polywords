# Cuts Pete's ORIGINAL slab art (his composite, 2026-10-20) into the two shipped slab images.
# No regrade: the pixels are exactly his. Usage: python3 cut_slabs.py <composite.png> <out_dir>
import sys
from PIL import Image
src = Image.open(sys.argv[1]).convert('RGBA')
out = sys.argv[2]
# Row bands found from the alpha channel: Hunt rows 152-394, Polybook rows 472-599, cols 145-763.
src.crop((145, 152, 764, 395)).save(f'{out}/slab_hunt.png')
src.crop((145, 472, 764, 600)).save(f'{out}/slab_book.png')
