# Reactive BGM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `hunt`/`daily` BGM tracks with the user's edited music, add a new `static` (idle/stuck) music state, and wire a chain-break stinger — all inside the existing track-swap `MusicEngine.ts` architecture.

**Architecture:** `static` becomes a 5th `TrackKey`/`MusicState` following the exact existing pattern (no new engine capability). A dwell timer in `GameScreen.tsx` drives it. The chain-break stinger is delivered through the existing pooled one-shot `sfx.ts` system, replacing the dead `triggerChainBreak()` stub.

**Tech Stack:** ffmpeg (audio editing, already installed — v8.1.2 with libmp3lame), Expo `expo-audio`, React Native, TypeScript strict.

## Global Constraints

- Runtime music synthesis is deleted and must not return (CLAUDE.md) — all audio in this plan is pre-rendered static files, never generated at runtime.
- Boss music keys off `eventType === 'bossWord'`, not step numbers (CLAUDE.md) — unchanged by this plan; boss priority stays intact.
- Do not change scoring, swipe grammar, `SwipeMask`, or Hunt/Boss/Daily gameplay rules (CLAUDE.md) — the `onSwipeAttempt` prop added to `MaskBoard` is a pure side-channel notification; it must not affect swipe outcome, timing, or grammar.
- After code patches: `npx tsc --noEmit`, `git diff --check`, `git status --short` (CLAUDE.md workflow).
- Commit only what's scoped to the task using explicit pathspecs (`git commit -m "..." -- <paths>`), never a bare `git add -A`.
- Neither `MusicEngine.ts` nor `sfx.ts` has an existing automated test file (only `app/game/polyRunEngine.test.ts` covers game logic) — verification for the code tasks in this plan is `tsc --noEmit` plus the manual playtest in Task 9, matching existing project convention for this surface.
- Source raw audio: `C:\Users\pdiba\Downloads\backgroundSFX\` (4 files). Do not modify or delete the originals — all ffmpeg commands write to new output paths.

---

## Asset reference: measured values

Existing BGM integrated loudness (measured via one-pass `ffmpeg -af loudnorm=print_format=json`), used as normalization targets so new tracks match their gain slot in `TRACK_VOLUMES` without retuning:

| Track | Existing `input_i` (LUFS) |
|---|---|
| hunt | -11.14 |
| tension | -14.64 |
| boss | -10.58 |
| daily | -16.79 |

Raw source file analysis (via `ffprobe`, `silencedetect=noise=-32dB:d=0.3`, `volumedetect`):

| Source file | Duration | Usable content window (skips lead/tail silence) |
|---|---|---|
| `desifreemusic-sneaky-mystery-underscore-for-detective-and-thriller-scenes-488452.mp3` | 126.624s | 9.640208s – 95.509354s |
| `ikoliks_aj-funny-comedy-cartoon-background-music-562774.mp3` | 119.144s | 0.70034s – 117.606712s |
| `leberch-funny-comedy-355603 (1).mp3` | 120.085s | 0s – 116.687755s |
| `viacheslavstarostin-comedy-funny-cartoon-background-music-346752.mp3` | 121.234s | (candidate extraction points below, Task 4) |

---

### Task 1: Render the hunt loop track

**Files:**
- Create (temp, via command): `assets/audio/bgm/hunt_suspense_loop.mp3` (overwrite)

**Interfaces:**
- Produces: a loop-safe, loudness-matched mp3 at the existing `hunt_suspense_loop.mp3` path, consumed by `MusicEngine.ts`'s existing `TRACK_SOURCES.hunt` require (no code change needed for this track — path is unchanged).

- [ ] **Step 1: Run the seamless-loop render command**

This uses the source's silence-free window (9.640208s–95.509354s, length 85.869146s) and stitches a 1.5s self-crossfade seam so the loop repeats without a bump (`tail` crossfades into `head`; the next cycle continues from `body`, which picks up exactly where `head` left off, so the seam is inaudible by construction).

```bash
cd "c:\Users\pdiba\poly-words"
ffmpeg -y -i "C:/Users/pdiba/Downloads/backgroundSFX/desifreemusic-sneaky-mystery-underscore-for-detective-and-thriller-scenes-488452.mp3" -filter_complex "[0:a]atrim=9.640208:95.509354,asetpts=PTS-STARTPTS,asplit=3[a1][a2][a3];[a1]atrim=0:1.5,asetpts=PTS-STARTPTS[head];[a2]atrim=1.5:84.369146,asetpts=PTS-STARTPTS[body];[a3]atrim=84.369146:85.869146,asetpts=PTS-STARTPTS[tail];[tail][head]acrossfade=d=1.5:c1=tri:c2=tri[seam];[body][seam]concat=n=2:v=0:a=1,loudnorm=I=-11.14:TP=-1.5:LRA=7[out]" -map "[out]" -ar 44100 -ac 2 -b:a 256k "assets/audio/bgm/hunt_suspense_loop.mp3"
```

Expected: ffmpeg exits 0, prints an `Output #0` summary with `Audio: mp3, 44100 Hz, stereo`.

- [ ] **Step 2: Verify the output**

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "assets/audio/bgm/hunt_suspense_loop.mp3"
```

Expected: a value close to `84.37` (85.869146 - 1.5 crossfade = 84.369146s), within ~0.1s.

- [ ] **Step 3: Commit**

```bash
git add assets/audio/bgm/hunt_suspense_loop.mp3
git commit -m "Replace hunt BGM track with edited detective/thriller underscore" -- assets/audio/bgm/hunt_suspense_loop.mp3
```

---

### Task 2: Render the daily loop track

**Files:**
- Create (via command): `assets/audio/bgm/daily_detective_clue_patrol.mp3` (overwrite)

**Interfaces:**
- Produces: a loop-safe, loudness-matched mp3 at the existing `daily_detective_clue_patrol.mp3` path. The file's own build-up softening is handled by an `MusicEngine.ts` config change in Task 5 (longer fade-in on playback start), not baked into this render — see spec rationale: reuses the engine's existing fade-in mechanism instead of hand-editing a fade into the source.

- [ ] **Step 1: Run the seamless-loop render command**

Silence-free window: 0.70034s–117.606712s (length 116.906372s), 1.5s self-crossfade seam.

```bash
cd "c:\Users\pdiba\poly-words"
ffmpeg -y -i "C:/Users/pdiba/Downloads/backgroundSFX/ikoliks_aj-funny-comedy-cartoon-background-music-562774.mp3" -filter_complex "[0:a]atrim=0.70034:117.606712,asetpts=PTS-STARTPTS,asplit=3[a1][a2][a3];[a1]atrim=0:1.5,asetpts=PTS-STARTPTS[head];[a2]atrim=1.5:115.406372,asetpts=PTS-STARTPTS[body];[a3]atrim=115.406372:116.906372,asetpts=PTS-STARTPTS[tail];[tail][head]acrossfade=d=1.5:c1=tri:c2=tri[seam];[body][seam]concat=n=2:v=0:a=1,loudnorm=I=-16.79:TP=-1.5:LRA=7[out]" -map "[out]" -ar 48000 -ac 2 -b:a 256k "assets/audio/bgm/daily_detective_clue_patrol.mp3"
```

Expected: ffmpeg exits 0, `Audio: mp3, 48000 Hz, stereo`.

- [ ] **Step 2: Verify the output**

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "assets/audio/bgm/daily_detective_clue_patrol.mp3"
```

Expected: a value close to `115.41` (116.906372 - 1.5 = 115.406372s), within ~0.1s.

- [ ] **Step 3: Commit**

```bash
git add assets/audio/bgm/daily_detective_clue_patrol.mp3
git commit -m "Replace daily BGM track with edited comedy track" -- assets/audio/bgm/daily_detective_clue_patrol.mp3
```

---

### Task 3: Render the new static-idle loop track

**Files:**
- Create: `assets/audio/bgm/static_idle_loop.mp3`

**Interfaces:**
- Produces: a new loop-safe, loudness-matched mp3, consumed by `MusicEngine.ts`'s new `TRACK_SOURCES.static` require added in Task 5.

- [ ] **Step 1: Run the seamless-loop render command**

Content window: 0s–116.687755s (no leading silence detected), 1.5s self-crossfade seam. Loudness target matches `tension`'s profile (-14.64 LUFS), since `static` is a lower-intensity mood state similar in spirit.

```bash
cd "c:\Users\pdiba\poly-words"
ffmpeg -y -i "C:/Users/pdiba/Downloads/backgroundSFX/leberch-funny-comedy-355603 (1).mp3" -filter_complex "[0:a]atrim=0:116.687755,asetpts=PTS-STARTPTS,asplit=3[a1][a2][a3];[a1]atrim=0:1.5,asetpts=PTS-STARTPTS[head];[a2]atrim=1.5:115.187755,asetpts=PTS-STARTPTS[body];[a3]atrim=115.187755:116.687755,asetpts=PTS-STARTPTS[tail];[tail][head]acrossfade=d=1.5:c1=tri:c2=tri[seam];[body][seam]concat=n=2:v=0:a=1,loudnorm=I=-14.64:TP=-1.5:LRA=7[out]" -map "[out]" -ar 44100 -ac 2 -b:a 256k "assets/audio/bgm/static_idle_loop.mp3"
```

Expected: ffmpeg exits 0, `Audio: mp3, 44100 Hz, stereo`.

- [ ] **Step 2: Verify the output**

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "assets/audio/bgm/static_idle_loop.mp3"
```

Expected: a value close to `115.19` (116.687755 - 1.5 = 115.187755s), within ~0.1s.

- [ ] **Step 3: Commit**

```bash
git add assets/audio/bgm/static_idle_loop.mp3
git commit -m "Add static-idle BGM track for the new idle/stuck music state" -- assets/audio/bgm/static_idle_loop.mp3
```

---

### Task 4: Render the chain-break stinger (user picks the candidate)

**Files:**
- Create (scratch, not committed): 3 candidate clips in the scratchpad directory
- Create: `assets/audio/sfx/chain_break_stinger.mp3`

**Interfaces:**
- Produces: a short (~2s) mp3 stinger, consumed by `sfx.ts`'s new `SFX.chainBreak.source` require added in Task 6.

- [ ] **Step 1: Extract 3 candidate clips**

The source has audible phrase-boundary pauses at several points; each candidate starts right after one of those pauses (a likely musical "hit"/accent), runs 2.0s, with a 150ms fade-out tail so it doesn't cut off hard.

```bash
cd "c:\Users\pdiba\poly-words"
SCRATCH="C:/Users/pdiba/AppData/Local/Temp/claude/c--Users-pdiba-poly-words/ac95ff9f-784a-40e2-b746-33778ad2e22f/scratchpad"
SRC="C:/Users/pdiba/Downloads/backgroundSFX/viacheslavstarostin-comedy-funny-cartoon-background-music-346752.mp3"

ffmpeg -y -i "$SRC" -filter_complex "[0:a]atrim=22.433991:24.433991,asetpts=PTS-STARTPTS,afade=t=out:st=1.85:d=0.15[out]" -map "[out]" -ar 44100 -ac 2 -b:a 192k "$SCRATCH/chainbreak_candidate_a.mp3"

ffmpeg -y -i "$SRC" -filter_complex "[0:a]atrim=51.973447:53.973447,asetpts=PTS-STARTPTS,afade=t=out:st=1.85:d=0.15[out]" -map "[out]" -ar 44100 -ac 2 -b:a 192k "$SCRATCH/chainbreak_candidate_b.mp3"

ffmpeg -y -i "$SRC" -filter_complex "[0:a]atrim=81.511927:83.511927,asetpts=PTS-STARTPTS,afade=t=out:st=1.85:d=0.15[out]" -map "[out]" -ar 44100 -ac 2 -b:a 192k "$SCRATCH/chainbreak_candidate_c.mp3"
```

Expected: 3 files created, each ~2.0s (`ffprobe -show_entries format=duration` on each to confirm).

- [ ] **Step 2: Ask the user to pick**

Tell the user the 3 candidate file paths and ask them to listen and say which one (a/b/c) sounds like the right "chain break" moment, or whether none of them land and the extraction points need to move. Wait for their answer before continuing.

- [ ] **Step 3: Finalize the chosen candidate**

Replace `<CHOSEN>` with `chainbreak_candidate_a.mp3`, `_b.mp3`, or `_c.mp3` per the user's pick.

```bash
cd "c:\Users\pdiba\poly-words"
SCRATCH="C:/Users/pdiba/AppData/Local/Temp/claude/c--Users-pdiba-poly-words/ac95ff9f-784a-40e2-b746-33778ad2e22f/scratchpad"
ffmpeg -y -i "$SCRATCH/<CHOSEN>" -af "loudnorm=I=-16:TP=-1:LRA=7" -ar 44100 -ac 2 -b:a 192k "assets/audio/sfx/chain_break_stinger.mp3"
```

Expected: ffmpeg exits 0, `Audio: mp3, 44100 Hz, stereo`.

- [ ] **Step 4: Verify the output**

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "assets/audio/sfx/chain_break_stinger.mp3"
```

Expected: a value close to `2.0`.

- [ ] **Step 5: Commit**

```bash
git add assets/audio/sfx/chain_break_stinger.mp3
git commit -m "Add chain-break stinger SFX" -- assets/audio/sfx/chain_break_stinger.mp3
```

---

### Task 5: Add the `static` track to MusicEngine.ts, retune daily's fade-in, remove dead code

**Files:**
- Modify: `app/audio/MusicEngine.ts`

**Interfaces:**
- Consumes: `assets/audio/bgm/static_idle_loop.mp3` (Task 3 output — must exist before this task, since it's referenced via `require()`).
- Produces: `MusicState` now includes `'static'`; exported `triggerChainBreak` is removed (Task 8 must not reference it after this task).

- [ ] **Step 1: Add `'static'` to the `MusicState` and `TrackKey` types**

In `app/audio/MusicEngine.ts`, change line 3:

```typescript
export type MusicState = 'off' | 'neutral' | 'rhythm' | 'onARun' | 'crisis' | 'boss' | 'daily' | 'static';
```

And line 5:

```typescript
type TrackKey = 'hunt' | 'tension' | 'boss' | 'daily' | 'static';
```

- [ ] **Step 2: Add `'static'` to `TRACK_KEYS`**

Change line 7:

```typescript
const TRACK_KEYS: TrackKey[] = ['hunt', 'tension', 'boss', 'daily', 'static'];
```

- [ ] **Step 3: Add the static track's source, volume, start position, and fade-in; retune daily's fade-in**

Change the `TRACK_SOURCES` block (lines 9-14) to:

```typescript
const TRACK_SOURCES: Record<TrackKey, ReturnType<typeof require>> = {
  hunt: require('../../assets/audio/bgm/hunt_suspense_loop.mp3'),
  tension: require('../../assets/audio/bgm/tension_running_out.mp3'),
  boss: require('../../assets/audio/bgm/boss_too_hot_to_sleep.mp3'),
  daily: require('../../assets/audio/bgm/daily_detective_clue_patrol.mp3'),
  static: require('../../assets/audio/bgm/static_idle_loop.mp3'),
};
```

Change `TRACK_VOLUMES` (lines 16-21) to:

```typescript
const TRACK_VOLUMES: Record<TrackKey, number> = {
  hunt: 0.22,
  tension: 0.20,
  boss: 0.14,
  daily: 0.16,
  static: 0.18,
};
```

Change `TRACK_START_POSITIONS_SECONDS` (lines 23-28) to (note `daily` changes from `0.85` to `0` — the new daily render already trims the leading silence, so no offset is needed):

```typescript
const TRACK_START_POSITIONS_SECONDS: Record<TrackKey, number> = {
  hunt: 0,
  tension: 0,
  boss: 0,
  daily: 0,
  static: 0,
};
```

Change `TRACK_FADE_IN_MS` (lines 30-35) to (note `daily` changes from `90` to `2500` — this softens the build-up's attack per user feedback, using the engine's existing fade-in mechanism instead of baking a fade into the audio file):

```typescript
const TRACK_FADE_IN_MS: Record<TrackKey, number> = {
  hunt: 300,
  tension: 300,
  boss: 300,
  daily: 2500,
  static: 300,
};
```

- [ ] **Step 4: Map the `static` state to the `static` track**

Change `STATE_TO_TRACK` (lines 37-44) to:

```typescript
const STATE_TO_TRACK: Record<Exclude<MusicState, 'off'>, TrackKey> = {
  neutral: 'hunt',
  rhythm: 'hunt',
  onARun: 'hunt',
  crisis: 'tension',
  boss: 'boss',
  daily: 'daily',
  static: 'static',
};
```

- [ ] **Step 5: Add `static` to the three per-track runtime record initializers**

Change `players` (lines 46-51):

```typescript
const players: Record<TrackKey, AudioPlayer | null> = {
  hunt: null,
  tension: null,
  boss: null,
  daily: null,
  static: null,
};
```

Change `fadeRafIds` (lines 53-58):

```typescript
const fadeRafIds: Record<TrackKey, number | null> = {
  hunt: null,
  tension: null,
  boss: null,
  daily: null,
  static: null,
};
```

Change `startTokens` (lines 60-65):

```typescript
const startTokens: Record<TrackKey, number> = {
  hunt: 0,
  tension: 0,
  boss: 0,
  daily: 0,
  static: 0,
};
```

- [ ] **Step 6: Remove the dead `triggerChainBreak` export**

Delete this block (currently lines 335-337):

```typescript
export function triggerChainBreak(): void {
  // The track-based engine has no beat stem to duck.
}
```

- [ ] **Step 7: Type-check**

```bash
cd "c:\Users\pdiba\poly-words"
npx.cmd tsc --noEmit
```

Expected: no errors referencing `MusicEngine.ts`. (Errors referencing `GameScreen.tsx`'s still-present `triggerChainBreak` import are expected at this point — Task 8 fixes that. If Task 8 hasn't run yet, this step will show that one error; confirm it's the *only* new error before proceeding.)

- [ ] **Step 8: Commit**

```bash
git add app/audio/MusicEngine.ts
git commit -m "Add static music state, retune daily fade-in, remove dead triggerChainBreak stub" -- app/audio/MusicEngine.ts
```

---

### Task 6: Add the `chainBreak` SFX to sfx.ts

**Files:**
- Modify: `app/audio/sfx.ts`

**Interfaces:**
- Consumes: `assets/audio/sfx/chain_break_stinger.mp3` (Task 4 output — must exist before this task).
- Produces: `SfxName` now includes `'chainBreak'`, playable via `playSfx('chainBreak')` — consumed by Task 8.

- [ ] **Step 1: Add `'chainBreak'` to the `SfxName` union**

In `app/audio/sfx.ts`, change lines 4-17 to:

```typescript
export type SfxName =
  | 'uiClick'
  | 'tileSwipe'
  | 'correctClaim'
  | 'trapWrong'
  | 'wrongLame'
  | 'trapShatter'
  | 'mastered'
  | 'haunted'
  | 'pressHoldStart'
  | 'pollySqwawkShort'
  | 'pollySqwawkLaugh'
  | 'bookClose'
  | 'detectiveSting'
  | 'chainBreak';
```

- [ ] **Step 2: Add the `chainBreak` config entry**

In the `SFX` record (lines 30-44), add this line (volume in line with other impactful one-shots like `trapShatter`'s 0.40; cooldown longer than most since it marks a notable moment, not a rapid-fire action):

```typescript
  chainBreak:     { source: require('../../assets/audio/sfx/chain_break_stinger.mp3'), volume: 0.40, cooldownMs: 1800 },
```

- [ ] **Step 3: Type-check**

```bash
cd "c:\Users\pdiba\poly-words"
npx.cmd tsc --noEmit
```

Expected: no errors referencing `sfx.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/audio/sfx.ts
git commit -m "Add chainBreak SFX entry" -- app/audio/sfx.ts
```

---

### Task 7: Add the `onSwipeAttempt` callback to MaskBoard

**Files:**
- Modify: `app/components/MaskBoard.tsx`

**Interfaces:**
- Produces: a new optional `onSwipeAttempt?: () => void` prop on `MaskBoard`, fired on every swipe start (both tiles, any direction, correct or wrong) — consumed by `GameScreen.tsx` in Task 8 to reset the idle-dwell timer.
- This is purely an additive notification callback — it does not change swipe handling, outcome, or timing in any way.

- [ ] **Step 1: Add the prop to `Props`**

In `app/components/MaskBoard.tsx`, change the `Props` type (lines 158-166) to:

```typescript
type Props = {
  step: WordStep;
  spawnEffect?: (type: 'shard' | 'trail', x: number, y: number, variant?: string) => void;
  onTrapCaught?: () => void;
  onWrongSwipe?: () => void;
  onSwipeAttempt?: () => void;
  // Owned by GameContent — the visit layer must outlive this board's
  // per-word remount (key={stepIndex}), or word-completion beats die mid-arc.
  firePollyEvent: (event: PollyEvent) => void;
};
```

- [ ] **Step 2: Destructure the new prop**

Change line 312 from:

```typescript
export function MaskBoard({ step, spawnEffect, onTrapCaught, onWrongSwipe, firePollyEvent }: Props) {
```

to:

```typescript
export function MaskBoard({ step, spawnEffect, onTrapCaught, onWrongSwipe, onSwipeAttempt, firePollyEvent }: Props) {
```

- [ ] **Step 3: Fire it from both `onSwipeStart` call sites**

Change line 1820 from:

```typescript
                    onSwipeStart={() => playSfx('tileSwipe')}
```

to:

```typescript
                    onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
```

Change line 1866 (same pattern, on the final/mystery tile) from:

```typescript
                        onSwipeStart={() => playSfx('tileSwipe')}
```

to:

```typescript
                        onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
```

- [ ] **Step 4: Type-check**

```bash
cd "c:\Users\pdiba\poly-words"
npx.cmd tsc --noEmit
```

Expected: no errors referencing `MaskBoard.tsx`.

- [ ] **Step 5: Commit**

```bash
git add app/components/MaskBoard.tsx
git commit -m "Add onSwipeAttempt notification prop to MaskBoard" -- app/components/MaskBoard.tsx
```

---

### Task 8: Wire the idle-dwell timer and chain-break stinger into GameScreen

**Files:**
- Modify: `app/screens/GameScreen.tsx`

**Interfaces:**
- Consumes: `MusicState` now including `'static'` (Task 5), `playSfx('chainBreak')` (Task 6), `onSwipeAttempt` prop on `MaskBoard` (Task 7).
- Produces: the idle/stuck `static` music trigger and the chain-break stinger, both live end-to-end.

- [ ] **Step 1: Update imports**

Change line 15 from:

```typescript
import { preloadSfx, unloadSfx } from '../audio/sfx';
```

to:

```typescript
import { playSfx, preloadSfx, unloadSfx } from '../audio/sfx';
```

Change line 16 from:

```typescript
import { initMusicEngine, startMusic, stopMusic, setMusicState, triggerChainBreak, disposeMusicEngine, MusicState } from '../audio/MusicEngine';
```

to:

```typescript
import { initMusicEngine, startMusic, stopMusic, setMusicState, disposeMusicEngine, MusicState } from '../audio/MusicEngine';
```

- [ ] **Step 2: Add the idle timer state and reset callback**

In `GameDirector`, after the existing flash-overlay handlers (after line 468, `const handleWrongSwipe = useCallback(...)`), add:

```typescript
  // ── Idle/stuck-static timer ──────────────────────────────────
  const STATIC_IDLE_TIMEOUT_MS = 15000;
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isIdleStatic, setIsIdleStatic] = useState(false);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
    }
    setIsIdleStatic(false);
    idleTimerRef.current = setTimeout(() => {
      setIsIdleStatic(true);
    }, STATIC_IDLE_TIMEOUT_MS);
  }, []);
```

- [ ] **Step 3: Start/reset the timer on step advance, tear down when not playing**

Add a new `useEffect` directly after the block from Step 2:

```typescript
  useEffect(() => {
    if (game.status !== 'playing') {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setIsIdleStatic(false);
      return;
    }
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [game.stepIndex, game.status, resetIdleTimer]);
```

- [ ] **Step 4: Add `static` to the music state priority chain**

Change the music state machine effect (currently lines 552-573) from:

```typescript
  // ── Music state machine ───────────────────────────────────────
  useEffect(() => {
    if (game.status !== 'playing') {
      stopMusic();
      return;
    }
    const activeStep = currentStep(game);
    const isBossStep = activeStep.kind === 'word' && activeStep.eventType === 'bossWord';

    let state: MusicState;
    if (isBossStep) {
      state = 'boss';
    } else if (game.lives <= 2) {
      state = 'crisis';
    } else if (game.chainMultiplier >= 2.5) {
      state = 'onARun';
    } else if (game.chainMultiplier >= 1.5) {
      state = 'rhythm';
    } else {
      state = 'neutral';
    }
    setMusicState(state);
  }, [game.chainMultiplier, game.lives, game.stepIndex, game.status]); // eslint-disable-line react-hooks/exhaustive-deps
```

to:

```typescript
  // ── Music state machine ───────────────────────────────────────
  useEffect(() => {
    if (game.status !== 'playing') {
      stopMusic();
      return;
    }
    const activeStep = currentStep(game);
    const isBossStep = activeStep.kind === 'word' && activeStep.eventType === 'bossWord';

    let state: MusicState;
    if (isBossStep) {
      state = 'boss';
    } else if (game.lives <= 2) {
      state = 'crisis';
    } else if (isIdleStatic) {
      state = 'static';
    } else if (game.chainMultiplier >= 2.5) {
      state = 'onARun';
    } else if (game.chainMultiplier >= 1.5) {
      state = 'rhythm';
    } else {
      state = 'neutral';
    }
    setMusicState(state);
  }, [game.chainMultiplier, game.lives, game.stepIndex, game.status, isIdleStatic]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 5: Replace the dead chain-break call**

Change the chain-break detection effect (currently lines 575-581) from:

```typescript
  // ── Chain break detection ─────────────────────────────────────
  useEffect(() => {
    if (prevChainRef.current >= 2.5 && game.chainMultiplier === 1.0) {
      triggerChainBreak();
    }
    prevChainRef.current = game.chainMultiplier;
  }, [game.chainMultiplier]); // eslint-disable-line react-hooks/exhaustive-deps
```

to:

```typescript
  // ── Chain break detection ─────────────────────────────────────
  useEffect(() => {
    if (prevChainRef.current >= 2.5 && game.chainMultiplier === 1.0) {
      playSfx('chainBreak');
    }
    prevChainRef.current = game.chainMultiplier;
  }, [game.chainMultiplier]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 6: Thread `onSwipeAttempt` down to `MaskBoard` through `GameContent`**

Change the `GameContent` props type and destructuring (currently lines 764-772) from:

```typescript
function GameContent({
  spawnEffect,
  onTrapCaught,
  onWrongSwipe,
}: {
  spawnEffect: (type: 'shard' | 'trail', x: number, y: number) => void;
  onTrapCaught: () => void;
  onWrongSwipe: () => void;
}) {
```

to:

```typescript
function GameContent({
  spawnEffect,
  onTrapCaught,
  onWrongSwipe,
  onSwipeAttempt,
}: {
  spawnEffect: (type: 'shard' | 'trail', x: number, y: number) => void;
  onTrapCaught: () => void;
  onWrongSwipe: () => void;
  onSwipeAttempt: () => void;
}) {
```

Change the `MaskBoard` render (currently lines 785-792) from:

```typescript
        <MaskBoard
          key={`board-${game.stepIndex}`}
          step={step}
          spawnEffect={spawnEffect}
          onTrapCaught={onTrapCaught}
          onWrongSwipe={onWrongSwipe}
          firePollyEvent={firePollyEvent}
        />
```

to:

```typescript
        <MaskBoard
          key={`board-${game.stepIndex}`}
          step={step}
          spawnEffect={spawnEffect}
          onTrapCaught={onTrapCaught}
          onWrongSwipe={onWrongSwipe}
          onSwipeAttempt={onSwipeAttempt}
          firePollyEvent={firePollyEvent}
        />
```

- [ ] **Step 7: Pass `resetIdleTimer` from `GameDirector` into `GameContent`**

Change the `<GameContent>` render (currently lines 709-713) from:

```typescript
        <GameContent
          spawnEffect={spawnEffect}
          onTrapCaught={handleTrapCaught}
          onWrongSwipe={handleWrongSwipe}
        />
```

to:

```typescript
        <GameContent
          spawnEffect={spawnEffect}
          onTrapCaught={handleTrapCaught}
          onWrongSwipe={handleWrongSwipe}
          onSwipeAttempt={resetIdleTimer}
        />
```

- [ ] **Step 8: Type-check**

```bash
cd "c:\Users\pdiba\poly-words"
npx.cmd tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add app/screens/GameScreen.tsx
git commit -m "Wire idle-dwell static music trigger and chain-break stinger into GameScreen" -- app/screens/GameScreen.tsx
```

---

### Task 9: Full verification pass and manual playtest

**Files:** none (verification only)

- [ ] **Step 1: Run the full project workflow checks**

```bash
cd "c:\Users\pdiba\poly-words"
npx.cmd tsc --noEmit
git diff --check
git status --short
```

Expected: `tsc` reports no errors; `git diff --check` reports nothing (no trailing whitespace/conflict markers); `git status --short` shows a clean tree (everything from Tasks 1-8 already committed).

- [ ] **Step 2: Start the app and playtest**

Run the Expo dev server and play a Hunt round on a device/simulator. Confirm by ear and by observation:

- Hunt BGM is the new detective/thriller track and loops without an audible seam or gap.
- Entering Daily plays the new track; the build-up's attack is softened by the 2.5s fade-in (not an abrupt hit).
- Dropping to 2 lives still triggers the existing panic/tension track (unchanged from before this work).
- Reaching Polly's Word (boss round) still triggers the existing boss track (unchanged from before this work).
- Sitting idle (no swipe) for ~15s while a mask is up switches the music to the new static/idle track; swiping again promptly returns to the normal hunt track.
- Breaking a 2.5x+ chain (a correct streak followed by a wrong swipe back to 1.0x) plays the new chain-break stinger over the current music, without cutting the background track.
- No regressions: normal correct/wrong swipe SFX, mastered/haunted cues, and Daily's UP-only swipe grammar are unaffected.

- [ ] **Step 3: Report results**

Note any of the above that didn't sound right (e.g., the daily build-up still feels too fast, the static idle threshold feels off, the chain-break stinger candidate doesn't land) — these are the plan's flagged tunable/by-ear items, not bugs, and can be adjusted with a small follow-up change to the relevant constant (`STATIC_IDLE_TIMEOUT_MS`, `TRACK_FADE_IN_MS.daily`, or re-running Task 4 with a different candidate).
