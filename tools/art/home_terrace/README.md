# Home terrace art (2026-10-20)

Runtime assets live in `assets/images/home/terrace/`. They are derived from Pete's own element
art (wall, casing, two slabs, cage halves), cleaned and regraded to the Daily castle palette.

- `bg.webp` is the locked 1290x2796 sky-and-ridges background, unchanged apart from webp encoding.
- `front.webp` is the part of `bg.webp` below the front ridge (from y=1440), alpha-cut along the
  front ridge so the castle can sit between the two ridge ranges. It is drawn over the castle.
- `castle.webp` is the locked violet castle (brightness 1.14, saturation 1.12 baked in).
- `wall.png`, `casing.png`, `slab_*.png`, `cage_*.png` are the cleaned and regraded elements.

The `*.py` files here are the scripts that produced the cleaned/regraded elements. They were run
in a scratch session and still contain that session's file paths; edit the paths before rerunning.
Pete's original uncleaned PNGs are not in the repo.
Final colors are NOT approved; Pete said color tuning comes next.
