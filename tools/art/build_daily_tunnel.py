"""Build assets/images/dailycastle/tunnel.png: the tunnel behind the Daily gate.

Pete's idea (2026-09-26): with the feathers moving to the floor, the space
behind the gate becomes depth — a tunnel the thrown block flies down.
Built only from existing art, like the plaque and the answer wall.

Tunnel mapping: every pixel of the 680 x 761 opening gets a shape norm n
(1 at the arch's edge, 0 at the vanishing point). Depth z = 1/n. Walls and
vault sample ARCHNEW's tower stone at (perimeter position, z); the floor
samples ARCHNEW's courtyard floor. Light falls off with depth; the far
opening glows. Output is the arch opening at 3x (680 x 761), drawn at the
opening's exact size behind the gate.

    python3 tools/art/build_daily_tunnel.py   (Pillow, numpy)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = str(Path(__file__).resolve().parents[2]) + "/"
OUT = ROOT + "assets/images/dailycastle/tunnel.png"
W, H = 680, 761
VX, VY = W / 2, 440            # vanishing point
A = W / 2                      # half width at the mouth
B_UP, B_DOWN = VY, H - VY
FAR_N = 0.16                   # norm of the far opening
WALL_TILES_AROUND = 4.2        # stone texture repeats around the tunnel
DEPTH_TILE = 1.75              # stone repeats per unit of depth

arch = Image.open(ROOT + "assets/images/dailycastle/ARCHNEW.png").convert("RGB")
stone = np.asarray(arch.crop((12, 420, 200, 850))).astype(np.float32)       # tower stone, clear of ropes, fully opaque
floor = np.asarray(arch.crop((220, 1610, 1080, 1780))).astype(np.float32)   # courtyard floor

ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
dx, dy = (xs - VX) / A, ys - VY
up = dy < 0
n = np.where(up, np.sqrt(dx ** 2 + (dy / B_UP) ** 2), np.maximum(np.abs(dx), dy / B_DOWN))
n = np.maximum(n, 1e-3)
z = 1.0 / n
is_floor = (~up) & (dy / B_DOWN >= np.abs(dx))

# perimeter coordinate: angle around the vault, position along the walls
theta = np.arctan2(dy / B_UP, dx)                 # -pi (left) .. 0 (right) through top
u_wall = np.where(up, (theta + np.pi) / np.pi, np.where(dx < 0, -(dy / B_DOWN) / n, 1 + (dy / B_DOWN) / n))
u_floor = (dx / n + 1) / 2                        # across the floor


def sample(tex, u, v):
    th, tw = tex.shape[:2]
    xi = (np.mod(u, 1.0) * (tw - 1)).astype(int)
    yi = (np.mod(v, 1.0) * (th - 1)).astype(int)
    return tex[yi, xi]


wall_rgb = sample(stone, u_wall * WALL_TILES_AROUND, z * DEPTH_TILE)
floor_rgb = sample(floor, u_floor * 1.6, z * 0.55)
rgb = np.where(is_floor[..., None], floor_rgb, wall_rgb)

# light: bright at the mouth, falling into the dark, then the far glow
depth01 = np.clip((1 - n) / (1 - FAR_N), 0, 1)           # 0 mouth .. 1 far end
# 0.8 at the mouth (not full) so the tunnel sits back behind the gate.
light = 0.8 * (1 - depth01) ** 1.6 + 0.06
fog = np.array([11, 9, 32], np.float32)                   # brand bgDeep #0B0920
rgb = rgb * light[..., None] + fog * (1 - light[..., None]) * 0.9
# the lit far opening, and a soft bloom around it
glow = np.array([74, 52, 128], np.float32)                # scroll-rod purple #4A3480-ish
far = n < FAR_N
bloom = np.clip(1 - (n - FAR_N) / 0.12, 0, 1)[..., None] * 0.55
rgb = rgb * (1 - bloom * (~far)[..., None]) + glow * bloom * (~far)[..., None]
inner = np.clip(1 - n / FAR_N, 0, 1)[..., None]
far_col = glow * (1 - inner * 0.35) + np.array([150, 130, 210], np.float32) * inner * 0.35
rgb = np.where(far[..., None], far_col, rgb)

out = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
path = sys.argv[1] if len(sys.argv) > 1 else OUT
out.save(path, optimize=True)
print(f"wrote {path} {out.size}")
