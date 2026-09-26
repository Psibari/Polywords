# POLYWORDS Current Context

Updated 2026-09-26. Current state and open work only; `CLAUDE.md` holds architecture and Git
history is the diary. Verify anything here against code before acting on it.

## Branches

| Branch | Role |
| --- | --- |
| `play-screen-overhaul` | The main working branch for the whole game (at `c3aaa89`). |
| `daily-castle-test` | Used only to rebuild the Daily Challenge as the castle. Branched from `play-screen-overhaul` at `c3aaa89`; merges back through draft PR Psibari/Polywords#13. Nothing else is worked on here. |
| `main` | Stale and untouched. Never merge into it without Pete's approval. |

Nothing merges into `play-screen-overhaul` without Pete's approval.

Testing on the phone: the phone runs whatever is in the local checkout, not GitHub. On the
machine that serves Expo, `git pull` the branch, then `npx expo start --clear`. A stale local
branch showing days-old art on 2026-09-26 was exactly this. Tests run on Node 24 (CI's version).

## Current State

- **Ruling (Pete, 2026-09-26):** the Polybook is Polly's book, kept in the old Vault; the
  player reads it.
- **Daily castle** (`daily-castle-test`, device-checked on iPhone 2026-09-26). Castle scene
  behind entry, play and Results; scroll-coloured gate carrying the clues; stone tunnel behind
  it; framed answer wall with stone blocks that come out of the wall and glow when grabbed;
  the throw into the gate; floor coins, one per round, and a gold coin with its own moment
  before Results; Polly on the left tower with her bubble on the steps. Pete, on device: coins,
  bubble and layout "looking better". Not yet confirmed on device: the gold coin's chime,
  haptic, pause and glow strength. Spec: `docs/DAILY_CHALLENGE_SPEC.md`.
- **Hunt momentum** (STEADY → SHARP → RAZOR SHARP → UNTRAPPABLE, FELL OFF, music that climbs
  with it) is device-confirmed on TestFlight #3–4 (2026-09-12). The level-up/FELL OFF cues
  still borrow the wrong-swipe SFX by design.
- **Boss gauntlet** bricks punch out of the wall with tremble, sound and haptics
  (device-confirmed 2026-09-10). **Boss outcome** package is LOCKED (see `CLAUDE.md`).
- **Polybook** screen is built and live (see `docs/POLYBOOK.md`).
- **Results** (2026-09-12/13): loss-cause verdict lines, Polybook plate controls, Meaning
  Missed cut, scroll cues. Not recorded as device-confirmed.
- **Polly**: face rig live on Home, Daily and Results; Hunt lines rotate; ten-streak and
  one-feather beats and the Home doze are live and device-confirmed. Daily per-round reactions
  read the rivalry state (`b7c6148`).
- **TestFlight** works end to end (build → `eas submit` → install). Store name "POLYWORDS: Hunt
  or Be Trapped" (bare "POLYWORDS" is taken); device name stays POLYWORDS. ASC App ID
  6810968284, bundle `com.pdb8080.polywords`. Subtitle empty. iPad support is off.

## Approved Rulings (reward and content)

- Rank and score are shown nowhere (2026-09-04); meanings taken is the headline.
- A book is a word, finished when all its visible REALs are found. No perfect-clear tier: a
  round deals only some of a word's REALs.
- Roughly every fifth new Hunt word should carry three `hiddenPairs`; it is the only remedy
  for the finite Boss pool. Never generate placeholder hidden truth.
- Daily content: the 60-word locked workbook (`STAGE` in, `SENTENCE` out); `dailyPool.ts` is
  its runtime form.

## Next Work

Daily castle (on `daily-castle-test`):
1. Cartoon pass (Pete, 2026-09-26): coins done (option D, silver and a 100 pt gold). The
   castle is now cartoon art (castle B, `castle_cartoon.png`) so it matches Polly. Still in the
   old painted style: the tunnel, the gate texture, the answer wall and the blocks. Next is
   cartoon versions of those, likely generated in the same style (Magnific; Pete's account hit
   its usage limit on 2026-09-26). Sharper castle: re-export B at full size from Magnific (the
   build used Pete's 864 px screen copy).
2. Device check of the gold-coin moment: chime volume, Success haptic, pause length, glow
   strength.
3. Card look across the whole game: every card and panel should look alike (Pete,
   2026-09-26). Daily entry and Results cards were deliberately left for this pass.
4. Cleanup. Done (Pete, 2026-09-26): the 24 unreferenced exports in
   `assets/images/dailycastle/`; the old dev viewers (Asset Audit, CodeLab, the old
   `DailyCastleScene` preview) with their Settings rows, the ASSET AUDIT button and their
   eight images. Still Pete's call: the Daily tree assets and `DailyTreeScene`, and the
   scroll-era leftovers the Daily screen still imports (`dailyScrollTuning`,
   `dailyScrollLayout`). CASTLE TUNE and DEV - RESET DAILY stay (Pete).
5. Review with Pete (next session) of Polly's Polybook lines, starting with the four that
   use "mine": "Good work. Mine." (light, held day), "Sloppy work. Mine." (heavy, bad day),
   "The last one is mine." (boss held), "Badly built. Mine." (boss lost). She is not a thief.
   Pete wants to look at them himself first. Do not rewrite or add any line until he rules.
   Source: `docs/POLLY_POLYBOOK_LOG_LINES.md`; runtime: `app/game/pollyBookLines.ts`.
6. Merge PR Psibari/Polywords#13 into `play-screen-overhaul` once Pete approves.

Whole game:
7. Real-device journeys before release: cold-start audio, rapid navigation,
   background/foreground recovery, every Polly laugh, persistence, performance.
8. Author more boss-capable Hunt words (three fair hidden pairs each).
9. Decide whether a banished Haunt earns a permanent record.
10. Known gap, needs a cold-start listen: the gauntlet's `stoneRumble` can start late on the
   first gauntlet after launch, because `warmGauntletEntranceSfx` runs when the gauntlet
   mounts. If audible, warm the cues when the boss word starts. Do not drop this item.
11. Navigation: `BottomNav` renders only on the Polybook and Settings; Home cannot reach the
    Polybook.
12. Haptics: four `Haptics.selectionAsync()` calls in `MaskBoard.tsx` and two in
    `GameScreen.tsx` bypass `cueAsync`. The Haunt rematch's final tile may stack two Heavies
    60 ms apart (untested). Reduce-motion `stoneLand1` has no paired haptic (undecided).
13. `warnDev()` in `sfx.ts` is silent outside `__DEV__`, so audio failures are invisible in
    TestFlight.
14. Polly: redraw sprite9 (sulk) to sprite4's canvas if still a placeholder; re-render the four
    clipped webp animations at 724×724; `flyGrin`/`masterShock`/`masterAngry` are unused;
    `tone='loss'` bubble is unused; `ONE_FEATHER_POSE` is typed `Record<string, …>`.
15. Polybook writing: more today's entries per rivalry state (CONCEDING and MERCY thinnest),
    the payoff entry, the player-name arc, and recording the first played date.
16. Settings' Tutorial Replay alert undersells what it resets (four overlays).
17. External TestFlight needs a hosted privacy policy and a support contact.

## Protection

- Preserve every Git stash and unrelated worktree change.
- Pete's local art files are his: ask before touching anything not in Git.
