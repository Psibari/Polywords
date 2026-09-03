# POLYWORDS Current Context

Updated September 2, 2026. Branch: `play-screen-overhaul`, tracking
`origin/play-screen-overhaul`. Current code baseline: `199dd1a`.

## Verified Current State

- The boss MASTERED/HAUNTED outcome package is fully complete and **LOCKED** (Pete,
  device-approved 2026-09-01). All of it is device-confirmed: the 3-piece Mastered/Haunted
  `HeroBook` rigs; the one continuous locked open → transform → close choreography; the single
  color-driven boss headword; and the illustrated `isBoss` result plaques. Both winning routes
  remain intact: accepting the final REAL and correctly rejecting the final TRAP, which stays
  rejected. The non-boss Returning Haunt path remains a separate, unchanged presentation.
  - MASTERED starts `assets/audio/sfx/mastered_transform_v1.wav` at `onMasteredSequence`; its
    physical book slam uses `assets/audio/sfx/mastered_book_slam_v1.wav` plus one Heavy haptic
    at +270ms from sequence start. Its result uses `assets/audio/sfx/mastered_result_sting_v1.wav`
    plus Success haptic at actual plaque visibility, after the existing 350ms mount delay.
  - HAUNTED starts the combined `assets/audio/sfx/haunted_transform_slam_v1.wav` at
    `onHauntedSequence`; one Heavy haptic and the board shake land together at the +580ms
    physical close from sequence start. The failed decision's immediate Error feedback and Polly
    laugh remain; the plaque adds neither a second shake nor a result SFX.
  - `sfx.ts` warms only these four boss assets when the boss gauntlet begins; it does not restore
    global eager SFX preload. `app/utils/haptics.ts` remains the preference-gated haptic gateway.
  - `MusicEngine` owns boss-only outcome ducking, never `MaskBoard` player-volume manipulation:
    boss music smoothly ducks 0.14 → 0.07 in 100ms, remains ducked through the plaque audio, and
    releases over 220ms without pausing or restarting the track. Mute, background recovery, state
    changes, and track ownership remain authoritative. This balance is locked unless new
    regression/device evidence warrants revisiting it.

- Daily's correct-answer transition now reads as one physical mechanism: card lands on the
  parchment, a matching ornate rod rolls reward paper over it, the reward holds, and the
  paper rolls up to reveal the next clue. Repeated-round state/input tests, TypeScript, the
  full test suite, and an iPhone check passed.
- Hunt runtime content is `assets/data/huntData.json`: 209 words and 1,900 tiles, including
  18 boss words and 54 hidden pairs. The 24-word DISPATCH-through-FLAG import preserved all
  173 prior entries; DISCHARGE remained unchanged. Boss/hidden-pair structure did not change.
- Merged from `localworkbooks/POLYWORDS_content_data_2026-08-30_FOSTER_FOUL_LOCKED.xlsx`
  (copied into the repo 2026-08-31, same convention as the existing
  `POLYWORDS_content_data_2026-08-15_DIRECT_DISCHARGE_LOCKED.xlsx`): TANK, FOAM, FOLD and FORK
  added as brand-new boss words (full REAL/TRAP sets plus 3 locked hidden pairs each, all dated
  complete 2026-08-26 through 2026-08-29 in the workbook); WAKE promoted from a regular
  `tension` word to `boss` (gained a 5th REAL — "WHAT YOU DON'T DO TO A SLEEPING GIANT" — and 3
  hidden pairs). BULB and DATE were initially "merged" with edits from this workbook — an onion
  trap re-added to BULB, DATE's `date_t1` swapped to a fig-pun — but both were reverted within
  the same session: the 2026-08-07 gpsTag/difficulty pacing pass (`bfbd2f2`/`8e0b1a5`) had
  already deliberately fixed both (cut BULB's onion trap as an unfair non-contrasting trap —
  onions genuinely are bulbs; rewrote DATE's fig trap to "A ONE-NIGHT STAND" for the same
  reason), and this workbook still carries the pre-fix text for those two tiles specifically.
  Confirmed via git history, not assumption. No other word in this merge had a pre-existing
  live entry with conflicting history — this was checked for all 197 pre-merge overlap words.
  The workbook's own `import-workbook.mjs`-staged output
  was NOT used as-is: that tool only captures one hidden pair per boss word (a stale schema)
  where the live game requires exactly 3 per boss word for the Route C gauntlet
  (`runtimeHuntValidation.mjs` enforces this and passed clean on the merge). 13 other words the
  tool flagged as "boss-ready" (BATTERY, BRIEF, CAST, CHECK, COURT, CRAFT, ENGAGED, EXCHANGE,
  EXTRACT, HORN, IRON, STOCK, STRIKE) were left untouched — they are already complete live boss
  words with all 3 hidden pairs; the workbook only has 1-2 of them and is stale for these (per
  the workbook's own "Repo Sync Audit" sheet, the rest were finished through a separate
  boss/gauntlet sync process not in this file). KERNEL was intentionally demoted from boss back
  to a regular word on 2026-08-11 per the workbook's own Word Tracker; its leftover single
  hidden-pair draft is historical cruft and was ignored. BOIL, flagged in the workbook's own
  recovery audit (dated 2026-08-12) as a completed word missing from live data, is already
  present and matches the recovered text — already resolved, no action taken. HAUNT and CRAZY
  remain intentionally absent per the workbook's own instruction not to reconstruct lost text
  for either.
- 8 new non-boss headwords, fully written and LOCKED in the workbook's Tiles sheet, were merged
  with hand-assigned difficulty/gpsTag (no precedent exists in the runtime for a word without
  both, and gpsTag is a deliberately tuned pacing distribution — Pete asked for a judgment call
  rather than leaving them out, so difficulty/gpsTag were assigned per
  `docs/GOLDEN_PACING_SYSTEM.md`'s rule — semantic distance and trap sharpness — calibrated
  against existing words of similar size): FLAT (11R/5T, hard/panic — wide domain spread, sharp
  traps), FLUSH (6R/4T, medium/tension), FOCUS (7R/6T, hard/panic — includes obscure senses:
  seismology, satellite, epidemiology), FOIL (6R/5T, medium/tension), FOOT (12R/5T, hard/panic —
  widest spread in the batch), FORGE (4R/5T, medium/flow), FOSTER (3R/4T, easy/confidence —
  smallest/gentlest, matches the confidence-bucket profile), FOUL (6R/5T, medium/tension — every
  trap sharply baits one specific REAL). These are Pete's calls to revise, not settled fact.
- Current gpsTag pool counts are confidence 17, flow 42, tension 72, panic 60, boss 18. The
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
  - `oneHeartLeft` no longer fires on every run and gets discarded. It now substitutes for
    `wrong` at the three wrong-swipe call sites in `useBoardMechanics.ts` when pre-swipe
    `game.lives` is 2, and resolves to a guaranteed five-line pool (`af1a250`). `streakX10`
    (`:348`) was the same until 2e82c32 and now resolves to a rattled heckle.
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
  - `POLLY_LINES` holds 85 lines; 28 of them have a `hunt`-prefixed id. That undercounts lines
    that actually fire in the Hunt — `streakLucky`/etc. (6) and `featherOne*` (5) also fire
    only there but don't carry the prefix — so "Hunt lines" is not one number without saying
    which count it means.
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
- The one-feather beat shipped (`af1a250`, device-confirmed). The non-obvious part: every
  life-loss path is already a wrong swipe that claims the word's single heckle via
  `firePollyEvent('wrong')`, so a plain `oneHeartLeft` heckle branch would never have fired —
  it had to substitute for `wrong` at the three wrong-swipe call sites in
  `useBoardMechanics.ts` when pre-swipe `game.lives` is 2, not add alongside it. Guaranteed,
  not heckle; `sfx: null` because MaskBoard already squawks on the swipe. Five lines; two pair
  with the `asleep` perch pose, and `perchPose` travels with whichever line is drawn rather
  than being fixed on the spec. This is also why the old Next Work item calling it "the same
  shape of change as the streak reaction" was itself the wrong diagnosis: `streakX10` already
  fired at the right moment and only needed a `resolveVisit` branch, but `oneHeartLeft` fired
  one render late from a since-deleted `useEffect`, always after an earlier `wrong` heckle had
  already spent the word's single-heckle budget — a `resolveVisit` branch alone could never
  have surfaced it. That wrong diagnosis is what left the item open.
- The Polly speech bubble inverted to light on dark screens (`a0b585f`) across all four
  `PollySpeechBubble` surfaces — Home, Hunt, Daily, Results. The three colour tokens live in
  `homePerch` (`pwHomeMaterials.ts`) and are read by `PollySpeechBubble` alone. Separately,
  Hunt and Daily had each overridden the component's own 18/22 default down to 15/21; both
  overrides were removed and the default `lineHeight` raised to 24 (`dff9b73`), so all four
  surfaces now inherit the same type.
- The asleep pose is live. Pete redrew the art with white Zzz beside her head instead of above
  it (`594be2d`), `POLLY_POSE_SCALE.asleep` was corrected from 1.24 to 0.96 (`9ea32e3`; crown
  width was the wrong scale anchor — see CLAUDE.md), and it now drives Polly's Home doze
  (`e38e814`). The doze delay is honestly two different numbers: ~8s after the screen goes
  still, which is ~13s from a fresh arrival because the greeting's 5.16s fade runs first, and a
  flat ~8s on a return visit where there is no entrance or bubble at all.
- A type and contrast pass ran across four surfaces: Vault (`3e03daa`), Hunt intro (`cbcf6de`),
  Settings (`b38cfc6`), and the three sibling intro overlays — Boss, Haunt, Vault (`199dd1a`).
  The rule that came out of it: 15pt is the floor for anything a player reads as prose or as a
  label, and small text was usually also faint (`mutedWhite` or `faintWhite`), so contrast was
  raised alongside size wherever that applied. HomeScreen was reviewed and deliberately
  skipped — it already runs through the `homeType` token block, and its remaining small values
  are decorative set dressing.
- Tutorial Replay now clears all four intro seen-keys (`7c7f01e`). It had only ever cleared
  three — `VAULT_INTRO_SEEN_KEY` was defined and consumed by `VaultIntroOverlay` but never
  removed, so the Vault intro could never be replayed once seen.
- A JSX branch that changes shape between renders causes React to tear down and remount the
  node, and any animation already attached to it silently does nothing — the animation still
  ticks, but there is no continuously-mounted layer left to see it move. This cost four passes
  on the Home doze transition; three of them were spent diagnosing a fade that was never
  actually running. General trap, not specific to Polly.
- Crown width is not a valid scale anchor for any pose where the head is tilted or drooped — it
  produced the 29% oversize on the asleep pose (1.24 vs the corrected 0.96). Use figure height
  instead; it does not tilt.
- Crossfading two layers (outgoing opacity 1→0, incoming 0→1 in parallel) dips to roughly 0.75
  combined alpha at the midpoint and shows the background through the subject. Hold the
  incoming layer opaque underneath from the start and fade only the outgoing one on top.
- Pose art must be cropped to its true visible-alpha bounds, not eyeballed. The old `zzz.png`
  had a handful of near-invisible stray alpha pixels in one corner, isolated roughly 65px below
  the real artwork, that held its 271px canvas open by about a quarter of its height —
  contain-fit sizes against the full canvas, so that invisible margin shrank the whole pose.

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
  the finite Boss pool; the current runtime now has 18 Boss words / 54 hidden pairs (up from
  13/39 — TANK, FOAM, FOLD, FORK added and WAKE promoted, 2026-08-31).
- Banished Haunts are removed from the active queue but are not yet recorded as a permanent Vault
  collection item. This is a future reward/UX decision, not a reason to remove Haunts from Hunt.

## Approved Daily Content

`workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx` is the canonical source for
60 approved locked words; `STAGE` is included and `SENTENCE` is excluded. It supersedes
`POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx` (retired, kept for history) — the prior
43 entries carried over unchanged, plus 17 new entries added 2026-08-28 (JAM, HIGHLIGHT, HIKE,
HIP, HIT, HOLLOW, HOOD, INDEX, INTEREST, ISSUE, JACK, KICK, KIND, LAP, LAST, LATCH, LAUNCH).
`app/game/dailyPool.ts` is the runtime representation and was merged additively to match
(`tsc`/full suite green; `dailyChallengeEngine.test.ts`'s hardcoded pool-size assertion updated
from 43 to 60). Each source word has three clues, nine unique approved candidates, and tier
1–3; each round deterministically presents the target plus five distractors.

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
6. Redraw sprite9 (sulk) at 283x413 with a 164px crown to match sprite4, if it is still a
  placeholder. It is now load-bearing in three places: Home on a win streak, Results 'beat',
  and the mastery beat.
7. Re-render the four clipped animations at 724x724.
8. The Vault needs a redesign, not a fix. Shelves grow without bound, there is no ordering
  beyond alphabetical, spines are already unreadable at 42 books, long spines clip mid-word
  (ABSTRAC/T, EXCHANG/E), and MEANINGS TAKEN now wraps in its chip after the type pass. Pete
  has also questioned whether "Vault" is the right name. Largest open design item.
9. Navigation gap: BottomNav renders on Vault and Settings only, but has four tabs — there is
  no way to reach the Vault from Home. Solve before its 11/12pt labels are worth changing.
10. The `tone='loss'` `PollySpeechBubble` variant is still dead — none of the four call sites
  (Home, Hunt, Daily, Results) pass a `tone`. Wire it or delete it.
11. Three poses remain unused: `flyGrin`, `masterShock`, `masterAngry` — none appear as a value
  in any `pollyVisitPolicy.ts` VisitSpec.
12. `ONE_FEATHER_POSE` is typed `Record<string, ...>`; a typo'd key would compile and yield an
  undefined `perchPose`. Hardening, not urgent.
13. Daily is the last unaddressed screen in the type pass, and the messiest file — 12 distinct
  font sizes from 9pt to 36pt.
14. Tutorial Replay's alert still says "You'll see it again next time you start a Hunt." It now
  clears four overlays across three screens (Settings, GameScreen, VaultScreen); the copy
  undersells it.

## Protection

- Preserve every Git stash unless Pete names one and explicitly requests an operation.
- Preserve unrelated worktree changes.
- Git history is the patch diary; do not rebuild session logs in this file.
