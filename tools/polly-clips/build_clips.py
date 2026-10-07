#!/usr/bin/env python3
"""
Polly clip pipeline (TEST). Source video -> keyed, normalized animated WebP.
- Decodes frames (VP9-alpha via libvpx; white-background clips are keyed by border flood-fill)
- Registers each clip onto the approved neutral perch sprite (uniform scale + offset found by
  silhouette overlap of frame 0), so Polly's apparent scale matches POLLY_MODEL_SHEET_v1.
- Exports animated WebP on the 1038x1515 model-sheet aspect.
"""
import json, os, subprocess, sys, glob, shutil, tempfile
import numpy as np
from PIL import Image, ImageFilter
import scipy.ndimage as ndi

NEUTRAL = sys.argv[1]            # polly_perch_neutral.png
OUT = sys.argv[2]
SRC = json.loads(sys.argv[3])    # list of dicts
W, H = 1038, 1515
os.makedirs(OUT, exist_ok=True)
neu = np.array(Image.open(NEUTRAL).convert('RGBA'))[..., 3] > 128

def decode(path, alpha_vp9):
    d = tempfile.mkdtemp()
    cmd = ['ffmpeg', '-v', 'error'] + (['-c:v', 'libvpx-vp9'] if alpha_vp9 else []) + \
          ['-i', path, '-pix_fmt', 'rgba', '-vsync', '0', d + '/f_%04d.png']
    subprocess.run(cmd, check=True)
    return d, sorted(glob.glob(d + '/f_*.png'))

def key_white(img):
    a = np.array(img.convert('RGB')).astype(int)
    near = a.min(axis=2) > 236
    lab, _ = ndi.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    soft = a.min(axis=2) > 205                       # light fringe next to the background
    bg = bg | (ndi.binary_dilation(bg, iterations=2) & soft)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6)))
    return Image.fromarray(np.dstack([a.astype(np.uint8), alpha]), 'RGBA')

def find_transform(frame):
    fa = frame.split()[3]; fw, fh = frame.size
    ds = 4; nS = neu[::ds, ::ds]
    def mask(s, tx, ty):
        m = fa.resize((int(round(fw * s)), int(round(fh * s))), Image.BILINEAR)
        c = Image.new('L', (W, H), 0); c.paste(m, (int(round(tx)), int(round(ty))))
        return (np.array(c) > 128)[::ds, ::ds]
    # start from bbox-fit guess
    ys, xs = np.where(np.array(fa) > 128)
    bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    nys, nxs = np.where(neu); nw, nh = nxs.max() - nxs.min() + 1, nys.max() - nys.min() + 1
    s0 = ((nw / bw) + (nh / bh)) / 2
    tx0 = nxs.min() - xs.min() * s0; ty0 = nys.min() - ys.min() * s0
    best = None
    for s in np.arange(s0 - 0.05, s0 + 0.0501, 0.01):
        for tx in range(int(tx0) - 40, int(tx0) + 41, 8):
            for ty in range(int(ty0) - 40, int(ty0) + 41, 8):
                m = mask(s, tx, ty); i = (m & nS).sum() / (m | nS).sum()
                if best is None or i > best[0]: best = (i, s, tx, ty)
    i0, s1, tx1, ty1 = best
    for s in np.arange(s1 - 0.008, s1 + 0.0081, 0.002):
        for tx in range(int(tx1) - 8, int(tx1) + 9, 2):
            for ty in range(int(ty1) - 8, int(ty1) + 9, 2):
                m = mask(s, tx, ty); i = (m & nS).sum() / (m | nS).sum()
                if i > best[0]: best = (i, s, tx, ty)
    return best

report = []
for c in SRC:
    d, fs = decode(c['path'], c.get('vp9alpha', False))
    fill_fs = decode(c['fill_src'], False)[1] if c.get('fill_src') else None
    first = Image.open(fs[0]).convert('RGBA')
    if not c.get('vp9alpha'): first = key_white(first)
    iou, s, tx, ty = find_transform(first)
    step = c['step']; out_w = c['out_w']; out_h = int(round(out_w * H / W))
    frames = []
    idxs = range(c.get('start', 0), c.get('end', len(fs)), step)
    for fi in idxs:
        f = fs[fi]
        im = Image.open(f).convert('RGBA')
        if not c.get('vp9alpha'): im = key_white(im)
        if fill_fs:                               # tool alpha made the eye white see-through (its RGB
            arr = np.array(im); solid = arr[..., 3] > 128   # there is black). Restore it from the white render,
            holes = ndi.binary_fill_holes(solid) & ~solid    # but ONLY the large hole near the eye, so edge
            lab, nh = ndi.label(holes)                       # pixels never inherit the white render's halo.
            keep = np.zeros_like(holes)
            cx, cy = c['eye_xy']
            for k in range(1, nh + 1):
                comp = lab == k
                yy, xx = np.where(comp)
                if comp.sum() >= 60 and abs(xx.mean() - cx) < 130 and abs(yy.mean() - cy) < 90:
                    keep |= comp
            keep = ndi.binary_dilation(keep, iterations=1) & (arr[..., 3] < 255)
            wsrc = np.array(Image.open(fill_fs[fi]).convert('RGB'))
            arr[keep, :3] = wsrc[keep]; arr[keep, 3] = 255
            im = Image.fromarray(arr, 'RGBA')
        if c.get('levels'):                       # tighten a soft/ghosty tool-made alpha
            lo, hi = c['levels']
            arr = np.array(im); al = arr[..., 3].astype(float)
            arr[..., 3] = np.clip((al - lo) / (hi - lo), 0, 1).__mul__(255).astype(np.uint8)
            im = Image.fromarray(arr, 'RGBA')
        im = im.resize((int(round(im.width * s)), int(round(im.height * s))), Image.LANCZOS)
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0)); canvas.paste(im, (int(round(tx)), int(round(ty))), im)
        frames.append(canvas.resize((out_w, out_h), Image.LANCZOS))
    dur = int(round(1000 * step / 24.0))
    name = c['name']; p = f'{OUT}/{name}.webp'
    frames[0].save(p, save_all=True, append_images=frames[1:], duration=dur, loop=c['loop'],
                   quality=c['quality'], method=4)
    kb = round(os.path.getsize(p) / 1024)
    report.append(dict(name=name, frames=len(frames), frame_ms=dur, total_ms=dur * len(frames),
                       size=[out_w, out_h], kb=kb, loop=c['loop'], registration_iou=round(float(iou), 3),
                       scale=round(float(s), 4), tx=tx, ty=ty))
    print(report[-1], flush=True)
    shutil.rmtree(d)
json.dump(report, open(f'{OUT}/clips_report.json', 'w'), indent=1)
