# POLYWORDS Current Context

Updated August 31, 2026. Branch: `play-screen-overhaul`, tracking
`origin/play-screen-overhaul`. Current code baseline: `2e82c32`.

## Verified Current State

- Daily's correct-answer transition now reads as one physical mechanism: card lands on the
  parchment, a matching ornate rod rolls reward paper over it, the reward holds, and the
  paper rolls up to reveal the next clue. Repeated-round state/input tests, TypeScript, the
  full test suite, and an iPhone check passed.
- Hunt runtime content is `assets/data/huntData.json`: 197 words and 1,748 tiles, including
  13 boss words and 39 hidden pairs. The 24-word DISPATCH-through-FLAG import preserved all
  173 prior entries; DISCHARGE remained unchanged. Boss/hidden-pair structure did not change.
- Current gpsTag pool counts are confidence 16, flow 41, tension 70, panic 57, boss 13. The
  confidence retag has happened; any earlier figure of 6 or 12 is stale.
- The tracked Hunt workbook is `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`; live JSON remains
  authoritative.
- The layered face rig is live on three screens: Home (`5c6f92a`), Daily (`44b4114`) and
  Results (`d39ca2e`), each device-confirmed before commit. `PollyPerchRig.tsx` renders the
  five `rig2` face layers and the idle blink, with the brow riding it at 0.33. It renders only
  when she is settled in the sprite4 idle/smug pose; fly-ins and all other poses stay flat art.
  `POLLY_PERCH_RIG_ENABLED` turns it off in one line. The rig composite was verified against
  `sprite4.png` pixel by pixel — nothing is displaced, the only difference is a hairline on her
  black outlines, so the flat-to-rig swap is not visible in play.
- Crown tilt exists as a prop and is deliberately off. A crown that rocks continuously while
  she sits reads as a broken prop; it belongs to a one-shot reaction, which only the Hunt has.
- The Hunt perch is unwired. The 1800ms perches block the BLINK only; a face swap is a hard
  cut and would land fine. The actual blocker is that VisitSpec cannot express a face
  separately from `perchPose`, so the rig reaches 2 of 13 specs.
- `PollyFaceRigDevViewer` stays in Settings behind `__DEV__` as the tuning harness.
- Nothing is left unpainted for the perch. `rig2` holds base, crown, beak, eye, brow, feet,
  far wing and tail, all registered on the 283x413 sprite4 canvas (commit 981af56). Feet, far
  wing and tail are banked and nothing imports them yet: the far wing is hidden behind the
  body, the tail is hidden because it is still baked into `polly_base`, and the feet only
  matter once the branch becomes its own layer. The tail's placement is provisional.
- Both known rig defects are closed by `2a24a4e`. `EYE_PIVOT_Y_FRAC` 0.12 was verified to sit
  on the eye artwork's lower edge, the correct blink pivot — the value was always right, only
  its comment was wrong. The brow now follows the blink, locked at 0.33.
- The beak is a swap, not a hinge — open and closed mouths as matched states. Chosen because
  a hinge needs a mouth interior no pose contains.
- `POLLY_ART_SPEC_2026-08-13.md` sets a beak-aspect test of 0.78 ±0.05. That figure was
  measured on an open mouth. Her closed beak is ~1.01. Do not judge a closed beak against it.
- Polly's face rig has three faces. `rig2` now holds `polly_beak_open.png`,
  `polly_eye_wide.png` and `polly_brow_shock.png` alongside the originals, all cut
  in place on the sprite4 canvas. Smug, laughing and shocked all read correctly on
  device. An open mouth could not be harvested from any existing pose — Pete drew
  the parts. See CLAUDE.md for the finding and the drawing workflow.
- The open beak is a talking mouth, not a gasp. Shocked = wide eye + shocked brow +
  closed beak.
- An app-wide error boundary is live (`fb72f65`), device-confirmed catching and
  recovering.
- The current Hunt generator keeps mastered words in ordinary tension/panic play as marked
  revisits. Mastered words cannot be Bosses or Returning Haunts, and deterministic regression
  coverage protects those rules. The old mastered-word deletion/rematch behavior is retired.
- The Vault now derives books from claimed visible REAL mask IDs: a word appears after its first
  claim and is finished when all of its visible REALs are claimed. Banishing a Haunt removes it
  from the active ghost queue; permanent Haunt-clear history in the Vault is not implemented yet.
- Audio was repaired at the transport boundary. SFX now load on demand from real sources and
  wait for native load-status events; the old eager 36-player startup burst and polling retry
  path are retired. Music uses the same real-source construction, has app foreground recovery,
  and restarts a new Hunt from the start. The protected Hunt-loss Results chuckle remains
  distinct from ordinary, boss, and Returning Haunt laughs and was verified on device.
- Polly's mastery beat changed (`e23979d`, device-confirmed). She used to fly in wide-eyed
  shocked, land in an angry glare, stay silent, and hold the perch until the board unmounted.
  She now flies in angry, lands in `sulk` and runs runPunch's previously-unused deflating
  droop, says "Next time, the traps will be different." (`huntMasteredTrapsDiffer`), and sinks
  off still hunched at perchMs 1600 — clearing the screen ~400ms before the MASTERED card
  auto-resolves, on all three mastery paths. Silent by design. `sulk` and its droop branch had
  existed and never fired.
- Pose size is normalized (`f6394e1`, device-confirmed). See CLAUDE.md. Everything except
  idle/smug renders smaller than before; sulk is 31% smaller. Boss entry and gauntlet throw use
  `point` with perchScale 1.45 and 1.3 on top and are now ~9% smaller than originally tuned.
- Two Polly animations were cleaned and committed (`fde5902`): polly_sulk and polly_idle. Four
  others are unusable and need re-rendering at 724x724. See CLAUDE.md.
- Audit of `pollyVisitPolicy.ts`, 2026-08-29, verified against live source:
  - `oneHeartLeft` (`useBoardMechanics:332`) is still FIRED on every run and discarded —
    `resolveVisit` has no branch for it. `streakX10` (`:348`) was the same until 2e82c32 and
    now resolves to a rattled heckle.
  - `hiddenFound`, `ghostFoundLate` and `ghostDissolved` are declared in `PollyEvent` but fired
    by nothing anywhere.
  - WRONG_SMUG is still the only spec for `wrong`, but it no longer carries a fixed line:
    `resolveVisit` picks from a 12-line pool at fire time (d623087).
  - The Hunt now has a variant mechanism of its own: `pickFreshLine()` in `pollyVisitPolicy.ts`,
    fed `recentLineIds` and a random roll through `PollyBudgetState`. It reads the same
    `recentLineIds` that `resolveHomePollyMoment` and `resolveResultsPollyMoment` use via
    `firstFresh()`. Only `wrong` and `streakX10` have pools; every other moment still holds one
    fixed line.
  - `resolveVisit` receives no pollyMemory data. `PollyBudgetState`'s only history field is
    `ghostRunsMissed`, which does one thing: swaps GHOST_SMUG's `perchPose` to `'point'` at
    >=2. Home and Results both branch on `playerWinStreak`/`pollyWinStreak`; the Hunt does not.
    `usePollyVisits` already imports `useGameStore`, so passing the streaks through is a
    hook-level change with no MaskBoard involvement.
  - She has a losing register in the Hunt as of 2e82c32 — the ten-streak reaction. Everything
    else she says in the Hunt is still her winning or threatening.
  - `POLLY_LINES` holds 43 lines, 27 of them Hunt lines.
- `isMasteredReturn` is set on returning mastered-word steps in `huntGenerator` and is read by
  NOTHING — not the board, store, Results or Polly. A mastered word returns silently and
  unmarked.
- MASTERED overlay timings, for anyone coordinating against them: tap is dead for 1200ms,
  auto-resolves at 2800ms. The HAUNTED overlay is 1200ms and 3200ms.
- Polly's `rattled` pose is banked and live (ff3e68d, 2e82c32). Whole-pose flat art, not
  rig-compatible. See CLAUDE.md.
- Hunt line rotation shipped (d623087, device-confirmed). The most-repeated line in the game
  was "Thought so.", capable of firing ~7 times in a run; it is now one of twelve.
- The ten-streak reaction shipped (2e82c32, device-confirmed). See CLAUDE.md.

## REWARD ECONOMY

- Rank comes off the Vault; meanings taken is the headline. APPROVED.
- Books equal words, finished when all of that word's visible REALs are found. APPROVED. No
  perfect-clear tier — a round shows only about 2.54 of a word's 4.61 REALs, so a flawless
  clear certifies the tiles dealt, not the word.
- Roughly every fifth new word should carry `hiddenPairs`. APPROVED. This is the only fix for
  the mastery ceiling.
- Rank thresholds are now retuned and live: D 0, C 3,000, B 6,000, A 9,000, S 11,500,
  MASTER 14,000. This is an absolute ladder and should be revisited if future content changes
  materially alter the perfect-play ceiling.
- Roughly every fifth new word should carry `hiddenPairs`. APPROVED as the content remedy for
  the finite Boss pool; the current runtime still has 13 Boss words / 39 hidden pairs.
- Banished Haunts are removed from the active queue but are not yet recorded as a permanent Vault
  collection item. This is a future reward/UX decision, not a reason to remove Haunts from Hunt.

## Approved Daily Content

`workbooks/POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx` is the canonical source for
43 approved locked words; `STAGE` is included and `SENTENCE` is excluded.
`app/game/dailyPool.ts` is the runtime representation. Each source word has three clues, nine
unique approved candidates, and tier 1–3; each round deterministically presents the target plus
five distractors.

## Next Work

1. Continue real-device iOS/Android journey checks before release, including cold-start audio,
  rapid navigation, app background/foreground recovery, and every distinct Polly laugh beat.
2. Author and editorially approve more Boss-capable Hunt words, targeting roughly one in five
  new words with three fair, stable-ID `hiddenPairs`. Do not generate placeholder hidden truth.
3. Decide and implement a permanent player-facing record for banished Haunts, if the Vault should
  remember that victory. Keep the hidden pair ledger on Polly's side; do not turn it into a
  player shelf collection.
4. Replace the placeholder Boss-gauntlet card art when the stone-block/crown direction is
  specified. The desired motion is push-forward, not `rotateY`.
5. Continue iPhone Expo Go validation for Vault density, mastered returns, Boss/Haunt placement,
  persistence, gestures, animation, and performance.
6. Rewrite the five theft-voice lines listed in CLAUDE.md.
7. Redraw sprite9 (sulk) at 283x413 with a 164px crown to match sprite4, if it is still a
  placeholder. It is now load-bearing in three places: Home on a win streak, Results 'beat',
  and the mastery beat.
8. Re-render the four clipped animations at 724x724.
9. The streak pool holds six lines against a five-deep line memory, so at a ten-streak there is
  often only one fresh line left and a repeat inside one run is possible. More lines would give
  it room. The wrong-answer pool of twelve does not have this problem.
10. `oneHeartLeft` still fires every run and is discarded. It is the same shape of change as the
  streak reaction: one branch in a pure file plus authored lines, no MaskBoard involvement.

## Protection

- Preserve every Git stash unless Pete names one and explicitly requests an operation.
- Preserve unrelated worktree changes.
- Git history is the patch diary; do not rebuild session logs in this file.
