# Dormant Polly Rig

Legacy layered proof cut from a flattened raster. It is not the live Polly path and has
irrecoverable hidden-pixel gaps. Live UI uses `assets/images/polly/poses/*.png`; do not revive
these specific files without approval — nothing imports them and they should stay that way.

This is scoped to these files, not the layered-rig concept: Pete approved reviving a layered
face rig on 2026-08-27, and it is now live on Home, Daily, and Results (idle/smug pose only).
It's a fresh implementation — `app/components/PollyPerchRig.tsx`, cut from `sprite4.png` — not
a reactivation of anything in this directory. See CLAUDE.md's Presentation and Character
section for the current state.
