# Reactive BGM: hunt/daily replacement, static-idle state, chain-break stinger

Date: 2026-07-12
Branch: play-screen-overhaul

## Goal

Bring in the user's own edited background music and wire it into the existing
`MusicEngine.ts` track-swap architecture: replace the `hunt` and `daily`
tracks, add a new `static` (idle/stuck) music state, and add a chain-break
stinger. No new engine capability is needed — this extends the existing
whole-track crossfade model that already exists for `hunt`/`tension`/`boss`/`daily`.

## Non-goals

- No new audio for `panic` (crisis) or `boss` states. Those triggers already
  work (`lives <= 2` → `crisis`/tension track, `eventType === 'bossWord'` →
  `boss` track); their audio files are untouched in this round. New audio for
  them is a future batch.
- No revival of the layered/stem-based adaptive mixing system that was
  explicitly removed (`c809bcb`, `419bfd5`). This design stays within the
  track-swap model.
- No changes to `SwipeMask`, scoring, swipe grammar, or Hunt/Boss/Daily
  gameplay rules.

## Source assets

Raw files live in `C:\Users\pdiba\Downloads\backgroundSFX\` — four ~2-minute
stock-music tracks, unlooped (fade-in/fade-out intros/outros), unnormalized.

| Source file | Destination | New/Replace |
|---|---|---|
| `desifreemusic-sneaky-mystery-underscore-for-detective-and-thriller-scenes-488452.mp3` | `assets/audio/bgm/hunt_suspense_loop.mp3` | Replace |
| `ikoliks_aj-funny-comedy-cartoon-background-music-562774.mp3` | `assets/audio/bgm/daily_detective_clue_patrol.mp3` | Replace |
| `leberch-funny-comedy-355603 (1).mp3` | `assets/audio/bgm/static_idle_loop.mp3` | New |
| `viacheslavstarostin-comedy-funny-cartoon-background-music-346752.mp3` | `assets/audio/sfx/chain_break_stinger.mp3` | New |

## Editing pipeline (ffmpeg)

Applies to the three loop tracks (`hunt`, `daily`, `static`):

1. Inspect the source (`ffprobe`/`astats`) to locate the fade-in/fade-out
   boundaries and pick a clean interior segment — the raw fades are not
   loop-safe as-is.
2. Stitch the loop seam with `acrossfade` so the track repeats without a
   bump when `MusicEngine.ts`'s native `player.loop = true` cycles it.
3. Measure the *existing* `hunt`/`tension`/`boss`/`daily` tracks' integrated
   loudness first (one-pass `loudnorm` analysis), then normalize each new
   track to that same target loudness. This keeps the existing
   `TRACK_VOLUMES` gains (0.14–0.22) meaningful without retuning them.
4. Export as mp3 at settings matching the current source files (44.1/48kHz,
   256kbps).
5. `daily` track note: the source build-up is good per user feedback, maybe
   a touch fast. Prefer a gentler fade-in curve / trimming before the ramp
   over hard-cutting into it. This is a judgment call made during editing,
   not a fixed automated transform — confirm by ear with the user after a
   first pass.

For the chain-break stinger:

1. Since audio can't be evaluated by ear programmatically, extract 2-3
   candidate short clips (1.5-3s) from the source using energy/transient
   detection (`astats`/`silencedetect`) to find likely high-energy moments.
2. Present candidates to the user for a listen; they pick the one that lands.
3. `loudnorm` + mp3-export only the chosen candidate to
   `assets/audio/sfx/chain_break_stinger.mp3`.

## `MusicEngine.ts` changes

Add `'static'` as a fifth `TrackKey` / `MusicState`, following the existing
pattern exactly:

- `TRACK_SOURCES.static` → `require('../../assets/audio/bgm/static_idle_loop.mp3')`
- `TRACK_VOLUMES.static`, `TRACK_START_POSITIONS_SECONDS.static`,
  `TRACK_FADE_IN_MS.static` — values consistent with sibling tracks (volume
  in the existing 0.14-0.22 range; start position 0; fade-in ~300ms).
- `STATE_TO_TRACK.static = 'static'`

No changes to the crossfade/state-swap logic itself — it's already generic
over `TrackKey`.

Remove the dead `triggerChainBreak()` export (currently a no-op stub with
the comment "The track-based engine has no beat stem to duck.") along with
its import in `GameScreen.tsx`, since the chain-break stinger is delivered
through `sfx.ts` instead (see below).

## `GameScreen.tsx` changes

**Idle/dwell timer.** A new `useEffect` (same ref-based timer pattern as the
existing chain-break detector at line ~575) tracks time since the current
step became active or the last swipe attempt, whichever is more recent —
covering both "player went idle" and "player is stuck fumbling on one word."

- New constant: `STATIC_IDLE_TIMEOUT_MS = 15000` (15s), tunable by feel once
  playable.
- Timer resets on: `game.stepIndex` change (step advanced), and any swipe
  attempt (including wrong swipes).
- On fire: only takes effect if the state the existing music state-machine
  would otherwise compute is `neutral`, `rhythm`, or `onARun`. It never
  overrides `crisis` or `boss`.
- Priority order: `boss` > `crisis` > `static` > `onARun`/`rhythm` >
  `neutral`.
- Exits `static` and resumes normal state computation the moment the player
  swipes or the step advances.

This slots into the existing music state `useEffect`
(`GameScreen.tsx:552-573`) as an additional condition in the if/else chain,
reusing `setMusicState`.

**Chain-break stinger.** The existing chain-break detection block
(`GameScreen.tsx:576-578`, `prevChainRef.current >= 2.5 && game.chainMultiplier === 1.0`)
swaps its call from `triggerChainBreak()` to `playSfx('chainBreak')`.

## `sfx.ts` changes

Add `'chainBreak'` to `SfxName` and a corresponding `SFX` config entry
(source: `assets/audio/sfx/chain_break_stinger.mp3`; volume/cooldown in
line with similar impactful one-shots like `trapShatter`). No other changes
— the existing pooled-player, cooldown, and self-heal logic in `sfx.ts`
already handles this generically.

## Verification

- `npx tsc --noEmit`, `git diff --check`, `git status --short` per project
  workflow.
- Manual playtest (audio correctness needs ears, not just typecheck): run
  the app and confirm — hunt/daily music replaced and loop cleanly, idle
  timer triggers `static` after ~15s of no step-advance/swipe and reverts
  correctly on resume, chain-break stinger fires on a broken 2.5x+ streak,
  panic (2 lives) and boss states still trigger correctly and are
  audibly unchanged from before this work.

## Open items to confirm by ear during implementation

- Whether 15s is the right idle threshold (tunable constant, not locked).
- Final chain-break stinger candidate (user picks after hearing options).
- Whether the `daily` build-up needs a second editing pass after the first
  attempt at softening it.
