# POLYWORDS Current Context

Updated July 20, 2026. Active branch: `play-screen-overhaul`.

## Current Build

- Play-screen overhaul is implemented: Hunt arena, HeroBook intake, flat HUD, boss
  chamber, Returning Haunts, score feedback, and heartbeat pacing.
- Home, Results, Daily, and Hunt share the authored Polly pose/voice/memory system.
- Vault uses the fixed-aspect bookcase archive and measured shelf slots.
- Daily is live for device testing: five rounds, six UP-only answer cards, sequential
  clues, two Chances, result flow, and Gold Feather award/storage.
- Hunt Gold Feather spending remains quarantined until safe resume-state behavior is
  designed.
- Hunt BGM is device-confirmed with persistent owner-scoped playback; Daily music is a
  separate future polish lane.
- Daily clue-speed results are device-approved.
- TypeScript passed at the previous checkpoint; rerun it after code changes.

## Active Runtime Boundaries

- Live content: `assets/data/huntData.json`.
- Editorial master: `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`.
- Dormant V2 export: `assets/data/huntData.v2.json`.
- Live Polly art: `assets/images/polly/poses/*.png`.
- Live music: `assets/audio/bgm/*.mp3` through `app/audio/MusicEngine.ts`.

## Next Product Work

1. Device recheck of the living-rival pass and small-screen bubble clearance.
2. Right swipe-cue fine-tune if device testing still calls for it.
3. HeroBook proportion review after a full Hunt.
4. Mastery-shard integration and first-run onboarding.

## Protected Stashes

Reference by name only; never pop, drop, or clear without instruction:

- `wip hud material pass needs feather asset`
- `wip haunt loop type scaffolding`
- `wip intake sliver not approved - needs SwipeMask handoff`

Durable rules live in `CLAUDE.md`; gameplay specifics live in focused docs.
