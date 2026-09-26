"""Build assets/images/dailycastle/gate_door.png: the Daily's cartoon plank door.

Pete (2026-09-26): the recoloured painted gate is flat and the clues float on
it. The door is drawn in castle B's cartoon style instead: flat wood, hard
cel-shaded highlight and shadow bands, thick dark outlines in the castle's
own line colour, a little grain, and two riveted iron straps on the planks
that never carry a clue.

Geometry is gate2.png's, so nothing in dailyCastleScene moves: a 1399 x 1597
canvas, board x 107-1248 px, eight planks between lines at y = 119 + 167.4*i
(DAILY_GATE_ART; change both together). Planks 2-4 carry the clues and are
kept plain in the middle. Only the doorway's middle ~192 pt (about 620 px)
is ever seen; the arch hides the rest.

    python3 tools/art/build_daily_door.py [indigo|brown]   (Pillow, numpy)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/images/dailycastle/gate_door.png"

W, H = 1399, 1597
BOARD_X = (107, 1248)
FIRST_LINE = 119
PITCH = 167.4
PLANKS = 8
CLUE_PLANKS = (2, 3, 4)
STRAP_PLANKS = (1, 5)
SS = 2                      # supersampling for clean edges

LINE = (22, 1, 34)          # castle_cartoon.png's outline colour (median of its darkest pixels)
SEAM = 8                    # px, about 2.5 pt: Pete's seam thickness
WOODS = {
    # face, highlight, shadow, grain
    "indigo": ((58, 30, 128), (84, 52, 164), (38, 16, 90), (46, 22, 106)),
    # Polly's perch brown (sprite4.png)
    "brown": ((128, 70, 34), (162, 96, 50), (90, 46, 20), (106, 56, 26)),
}
IRON = ((52, 50, 70), (104, 102, 124), (30, 28, 44))
RIVET = ((170, 170, 188), (228, 228, 240))


def line_y(i: int) -> float:
    return FIRST_LINE + PITCH * i


def main() -> None:
    wood = sys.argv[1] if len(sys.argv) > 1 else "indigo"
    face, hi, lo, grain = WOODS[wood]
    rng = np.random.default_rng(7)
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = lambda v: round(v * SS)
    x0, x1 = BOARD_X
    cx = (x0 + x1) / 2

    for i in range(PLANKS):
        top, bot = line_y(i), line_y(i + 1)
        d.rectangle((s(x0), s(top), s(x1), s(bot)), fill=face)
        d.rectangle((s(x0), s(top), s(x1), s(top + 12)), fill=hi)       # lit top edge
        d.rectangle((s(x0), s(bot - 16), s(x1), s(bot)), fill=lo)       # shaded bottom edge
        # Grain: short wavy strokes. On clue planks they are fewer, fainter
        # and kept to the ends so the text sits on clean wood.
        clue = i in CLUE_PLANKS
        strokes = 4 if clue else 7
        col = tuple(round(f * 0.55 + g * 0.45) for f, g in zip(face, grain)) if clue else grain
        for _ in range(strokes):
            length = rng.uniform(90, 220 if clue else 340)
            if clue:
                side = rng.choice([-1, 1])
                gx = cx + side * rng.uniform(300, 420) - length / 2
            else:
                gx = rng.uniform(x0 + 40, x1 - 40 - length)
            gy = rng.uniform(top + 30, bot - 34)
            pts = [(s(gx + t), s(gy + 5 * np.sin(t / 38 + gy))) for t in np.linspace(0, length, 24)]
            d.line(pts, fill=col, width=s(4), joint="curve")
        if not clue and i not in STRAP_PLANKS:
            kx, ky = rng.uniform(cx - 250, cx + 250), (top + bot) / 2 + rng.uniform(-20, 20)
            d.ellipse((s(kx - 26), s(ky - 13), s(kx + 26), s(ky + 13)), fill=lo, outline=LINE, width=s(5))
            d.ellipse((s(kx - 10), s(ky - 5), s(kx + 10), s(ky + 5)), fill=LINE)

    # Iron straps with rivets on the planks that carry no clue.
    iron, iron_hi, iron_lo = IRON
    for i in STRAP_PLANKS:
        mid = (line_y(i) + line_y(i + 1)) / 2
        t, b = mid - 24, mid + 24
        d.rectangle((s(x0), s(t), s(x1), s(b)), fill=iron, outline=LINE, width=s(7))
        d.rectangle((s(x0 + 7), s(t + 7), s(x1 - 7), s(t + 14)), fill=iron_hi)
        d.rectangle((s(x0 + 7), s(b - 14), s(x1 - 7), s(b - 7)), fill=iron_lo)
        for rx in np.arange(cx - 5 * 110, cx + 5 * 110 + 1, 110):
            d.ellipse((s(rx - 11), s(mid - 11), s(rx + 11), s(mid + 11)), fill=RIVET[0], outline=LINE, width=s(4))
            d.ellipse((s(rx - 6), s(mid - 7), s(rx - 1), s(mid - 2)), fill=RIVET[1])

    # Seams and the board's outline, drawn last so they sit over everything.
    for i in range(1, PLANKS):
        y = line_y(i)
        d.rectangle((s(x0), s(y - SEAM / 2), s(x1), s(y + SEAM / 2)), fill=LINE)
    d.rectangle((s(x0), s(line_y(0)), s(x1), s(line_y(PLANKS))), outline=LINE, width=s(10))

    out = img.resize((W, H), Image.BOX)   # a plain 2x2 average: no ringing into the edges
    a = np.asarray(out)[..., 3]
    board = a[round(line_y(0)) + 2 : round(line_y(PLANKS)) - 2, x0 + 2 : x1 - 2]
    assert board.min() == 255, "door board must be fully opaque"
    out.save(OUT, optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} ({wood})")


if __name__ == "__main__":
    main()
