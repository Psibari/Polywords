# POLYWORDS Architecture

## Current verified implementation and CI handoff (2026-11-20)

**Active branch:** `play-screen-overhaul`; eight-round standard Hunt approved and merged. Six regular starting feathers; eligible Returning Haunt between rounds 4 and 5; round-eight Boss; Gold Feather separate; first-run FINE and mercy retained. Explicit ten-round override is historical/test-only. The older ten-round contract and pre-merge feature-branch checkpoint below are **archived history**, not instructions for current gameplay. Runtime code outranks any stale documentation.

**Current green CI:** commit `b4c0c8e03572637d76565ba8ac2dca2e632ac6ec`, Typecheck / Quality Checks #1094, green on GitHub. Pete separately verified local `npx.cmd tsc --noEmit`, `npm test`, and `npm run content:preflight -- --input assets/data/huntData.json` all pass. This verifies automation only, not native gameplay or workbook parity. Reverify CI after any later commit.

**Hunt content gate:** live `assets/data/huntData.json` preflight SHA-256 `477cb5959d3480582f9e3fb6ad4ecb87901b2fcea8fb6af371a307b45df6b437`; 253 words, 2,583 visible masks, 72 hidden pairs, 0 structural/known-debt/launch blockers. One advisory EXTRACT Hidden Truth asymmetry and six advisory REAL/trap overlap flags (DOUBLE, MINE, PALM, HANDLE, INDEX, ROUND) are reviewed KEEP decisions, not gate failures. Structural checks remain strict.

**Relevant recent commits and their intent:**
- `5d70a687593e8f0ea0591ad1fcad8b4862eb0499`: approved ROW trap `row_t6` changed to `WHAT ALL THE KIDS SIT IN WHEN THEY PLAY DUCK DUCK GOOSE` (owner CIRCLE).
- `85301134bf5c5d40195b8716f1b68de2563b37b7`: approved HANDLE REAL `handle_r4` changed to `WHAT THE CAR COULDN'T DO ON THE SHARP TURN AT THAT SPEED, SO IT CRASHED`.
- `4f3d6a60360a6578698a63c740d347886f97f08d`: reduce false-positive editorial overlap and length warnings; do not weaken structural validation.
- `b4c0c8e03572637d76565ba8ac2dca2e632ac6ec`: update outdated `tools/content/runtimeHuntValidation.test.mjs` Hidden Truth length assertion; fixes red CI from previous commits. Latest Quality Checks #1094 green.
- FORK runtime `wordType` is Septuple (7 REALs); the separate workbook Word Tracker was corrected. Preserve approved Boss removals.

**Editorial authority and next work:** `assets/data/huntData.json` is the only runtime Hunt bank. The delivered `POLYWORDS_CANONICAL_SYNC_VERIFIED_EDITS_2026-11-20.xlsx` is an **external working workbook**, not yet exhaustively reconciled with runtime. Do not claim parity or rewrite locked text without inspecting both current files. Next: compare all IDs, headwords, REAL/TRAP flags, exact phrases, hidden pairs, word types and tracker counts; preserve workbook-only history, resolve discrepancies with Pete where necessary, then validate again. See the current handoff at the top of `CONTEXT.md`.

## Archived approved development baseline (2026-11-20; superseded above)

**Branch:** `play-screen-overhaul`. Eight-round Hunt migration merged via PR #20 and locked by Pete after iPhone smoke testing. Original ten-round branch snapshot: `backup-play-screen-overhaul-10-round-pre-merge-2026-11-20` (`189f923`). Latest verified pre-documentation-change CI: `34eccd0`, Quality Checks `44808877477`, all three gates green. Eight rounds across tiers; six starting regular feathers; eligible Returning Haunt between rounds 4 and 5; Boss in round 8. Gold Feather remains separate. First-run FINE and mercy preserved. Explicit ten-round generator override remains historical/test-only.

**Historical next-task note (superseded):** audit first-time player experience against actual current code and device, then prioritize any demonstrated confusion. Word rotation issue #17 is substantially addressed by regression coverage and native observation, but early-loss/restart remains an unverified edge case. Do not reopen approved gameplay or Home design without evidence.

**Historical note:** the pre-merge feature-branch checkpoint below is superseded.

---

## Archived feature-branch checkpoint (2026-11-20; historical only)

**Branch:** `hunt-eight-round-migration`. Read `CONTEXT.md` for the latest verification and open pre-merge checks. **Do not merge without Pete's approval.** Yesterday's local 103 MB web ZIP commit was safely removed from the active branch, with a backup branch retained; the local and origin heads matched at `be34f76` before this documentation update. Do not restore or merge the ZIP.

**Current Hunt contract:** eight standard rounds across tiers, six regular starting feathers, Returning Haunt in round 4 when eligible, Boss in round 8; first-run FINE and fledgling mercy preserved. Explicit ten-round generation is a legacy/test override only. Daily-earned Gold Feather appears as a separate seventh HUD icon when available; Pete confirmed on iPhone that it displays correctly alongside all six regular feathers. Gold Feather revive mechanics were not changed.

**Verification:** Pete reports successful eight-round iPhone playtests, working book/card animations, and correct Returning Haunt / BANISHED gameplay. Those observations do not independently certify revive-after-banish or force-close persistence. GitHub Actions Quality Checks `44673171596` passed TypeScript, tests, and content-quality gate on `be34f76`; rerun checks after further edits. The web-only HeroBook issue remains tracked in issue #19 and is not a native release blocker.

**Next:** finish stale-reference and state-integrity audit, review the diverged integration with `play-screen-overhaul`, then seek explicit merge authorization. Preserve approved gameplay and visuals; do not make speculative fixes.

---



Durable implementation map, not a session diary. `AGENTS.md` owns repository authority and safeguards; `CONTEXT.md` owns the current state and next task. Focused specifications own product detail. Executable code and canonical data establish what actually ships. Prior decisions and discarded experiments remain recoverable in Git history.

Do not hard-code live content counts here; run `npm run state`.

## Source map

| Subject | Source of detail |
| --- | --- |
| Agent rules and safe editing | `AGENTS.md`, `docs/WORKFLOW.md` |
| Hunt mechanics and pacing | `docs/GAME_REFERENCE.md`, `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt editorial workflow and data gate | `docs/CONTENT_WRITING_STANDARD.md` |
| Pete's Hunt writing rulings and examples | `docs/CONTENT_WRITING_BIBLE.md` |
| Daily mechanics and writing | `docs/DAILY_CHALLENGE_SPEC.md`, `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Home's approved design | `docs/HOME_SCREEN_LOCKDOWN.md` |
| Polly's voice and relationship | `docs/POLLY_DIALOGUE_BANK.md`, `docs/POLLY_RELATIONSHIP_MEMORY_V2.md` |
| Polybook | `docs/POLYBOOK.md`, `docs/POLYBOOK_LIVING_JOURNAL.md` |
| Visual grammar | `DESIGN.md`, `app/ui/` |
| Hunt recovery, approvals and historical IDs | `docs/HUNT_CONTENT_RECOVERY_FINAL_2026-11-16.md`, `docs/HUNT_CONTENT_HISTORICAL_DISPOSITIONS_2026-11-16.csv` |

The Hunt standard and Bible both contain binding editorial language; do not silently resolve a disagreement between them. Follow `AGENTS.md`'s conflict-reporting rule and obtain Pete's ruling if necessary.

## Runtime and entry points

- Expo SDK 57, React Native 0.86 New Architecture, strict TypeScript. Zustand/immer and AsyncStorage own gameplay state and persistence.
- `App.tsx` owns navigation, boot and audio-app-state wiring. `app/screens/` owns screens; `app/store/useGameStore.ts` owns durable game progress.
- `app/game/huntGenerator.ts` and `app/game/polyRunEngine.ts` own Hunt selection and outcomes. `app/components/MaskBoard.tsx` and `app/components/SwipeMask.tsx` own cards and swipe behavior.
- `app/game/dailyChallengeEngine.ts` combines Daily pools. `app/ui/` owns reusable presentation constants/materials.
- React Native Animated drives most presentation; Reanimated drives finger-tracked cards. Do not refactor either gesture owner without a focused request.
- Production is `POLYWORDS` / `com.pdb8080.polywords`. Phone iteration uses the separate `POLYWORDS DEV` / `com.pdb8080.polywords.dev` client: `APP_VARIANT=development npx expo start --dev-client`. Add `-c` only for a Metro cache problem. JS/TS/art changes use Metro; native dependencies/config/SDK and splash changes need a new native build. TestFlight is for production-native checks.
- App icon and splash artwork are Pete-approved. `assets/icon.png`, `assets/adaptive-icon.png` and `assets/splash-icon.png` are hand-made, not generated by `scripts/generate-brand-icons.ts`. Do not overwrite or redesign them. Splash config and ready/hide timing live in `app.json` and `App.tsx`; hide only when navigation is ready, not on the root layout callback.

## Hunt contracts

- UP claims a REAL; RIGHT rejects a trap. No left swipe or tap-submit. Ordinary choices remain neutral before commitment.
- **Current standard Hunt: eight rounds**; first-run FINE and fledgling mercy are preserved. Polly's Word is the round-eight Boss. An eligible Returning Haunt appears between rounds four and five and does not use Boss presentation. Explicit ten-round generation remains historical/test-only.
- A word encounter deals up to five visible cards from its larger approved pool. A card in live JSON is eligible to rotate, not guaranteed to appear in a particular Hunt.
- Boss outcome is determined by the three hidden judgments, never the score: all correct means MASTERED; a hidden miss or Boss death means HAUNTED. Returning Haunts retry the saved exact hidden pair; success banishes the active Haunt.
- The Boss is pinned across Hunts until the player reaches it, provided it remains eligible. Ordinary word rotation remains independent. `app/game/pinnedBoss.ts` and `app/game/pinnedBoss.test.ts` own the invariant.
- MASTER'S REMATCH appears only after the ordinary unbeaten Boss pool is exhausted. A rematch win is KING, increments the persistent `kingWins` once and creates no extra mastery/crown; a loss is BUSTER and creates no Haunt. `app/game/kingWins.ts` owns the idempotent counter. Approved plaque choreography is shared between DEV and production.
- Hunt word selection is difficulty-driven; GPS phases still control pacing/presentation. Only Boss classification depends on the Boss tag. `app/game/huntReachability.test.ts` guards reachability.
- Momentum is STEADY, SHARP, RAZOR SHARP, UNTRAPPABLE, with FELL OFF on a broken chain. At armor threshold, one wrong call consumes the armor rather than a feather but still breaks the chain. Presentation constants live in `app/ui/momentumAccent.ts`, `app/components/wallShake.ts` and the current HUD code; do not revive rejected grout/vein glows or torches.
- HUNT PAUSED preserves the active run through HOME or SETTINGS. QUIT HUNT is the explicit destructive action and must warn truthfully. Navigation tests live in `app/game/huntPauseNavigation.test.ts` and `app/screens/huntPauseFlow.test.mjs`.
- First-run Hunt is a real FINE round, not a disposable tutorial board. HUD lessons are event-driven and resume-safe. `docs/GAME_REFERENCE.md` owns player-facing copy.

## Content integrity

- `assets/data/huntData.json` is the only live Hunt bank. No parallel override bank. Workbooks are editorial staging, never an automatic runtime feed.
- Word, visible-mask and hidden-pair IDs are persistence contracts. Preserve approved text, roles and stable IDs; never reuse retired IDs for different content. Check Git history and the historical-dispositions index before assigning new IDs.
- Editorial approval precedes difficulty/GPS placement and explicit runtime promotion. The generator and structural validation must reject malformed IDs, wrong owner prefixes, bad REAL/trap flags, invalid difficulty/GPS and incomplete Boss hidden content.
- `npm run content:quality` is the CI structural/live-content gate with an explicit known-debt allowance; passing it is **not** editorial signoff. Run relevant content tests and compare the authoritative workbook with live JSON when promoting.
- The November 16 recovery is closed editorially. CAPITAL `capital_r3` (REAL) and CONCENTRATION `concentration_t3` (TRAP) were restored verbatim and locked. Do not revive any other historical-only card without Pete's approval. The definitive recovered workbook and provenance are identified in the final recovery report.
- `assets/data/huntData.v2.json` and `tools/content/_deprecated/mask-rewriter/` are retired; never use them as authority.

## November 2026 Hunt editorial and regression milestone

- **Group D old-word audit re-edit: COMPLETE**, explicitly confirmed by Pete on 2026-11-19. Groups A and B were already complete. The former Group D "next: CRAFT" marker and older remaining-count estimates are superseded. FLY was subsequently edited and committed as well. For individual card approvals, retired IDs and exact wording, consult the live bank, Git history and current editorial workbook; this milestone does not independently prove workbook/runtime parity or certify every historical card.
- **Hunt rotation regression coverage:** `app/game/huntReachability.test.ts` gained seeded checks for no duplicate headword inside a Hunt (300 seeds across both supported lengths) and for 60 consecutive **completed** Hunts with recency carried forward. Those automated tests passed in CI. Recency is a **soft preference**, not a universal cross-run no-repeat guarantee. Early-loss/restart overlap remains a specific test gap; do not state it is solved.
- **Boss invariants:** generator prioritizes an eligible pinned, unmastered Boss until it is encountered/resolved; Returning Haunts and Master's Rematch remain separate. Existing Boss/pinning regression coverage is in `app/game/pinnedBoss.test.ts`. The recent rotation change did not intentionally alter Boss selection or outcome rules.
- **Content metadata repairs:** approved REAL counts were reconciled with `wordType` for PALM, SENTENCE, FLY, MOLD, MOUSE, NAIL, SINK, TABLE, TRAIN and TRIP; associated canonicalization expectations were updated. These were metadata/test corrections, not new editorial approvals or rewrites.
- **Approved capitalization exception:** `tools/content/runtimeHuntValidation.mjs` has an exact ID-and-phrase exception for `FLY/fly_t6`, preserving `McFly` in the approved Marty McFly trap. Other phrases still require uppercase. Existing `LEAD/lead_r4` capitalization exception remains. Do not relax the validator globally or rewrite approved copy to appease it.
- **Spelling hygiene:** 33 user-reported cSpell terms were allowlisted in `.vscode/settings.json` (commits `da2b58fe`, `28c9fef9`) without editing the Hunt bank.
- **Verified automated CI:** `67fb414f37c83cd153e8913df16d415b5f471172` passed Quality Checks run `44648860014`, including TypeScript, tests and the live Hunt content-quality gate. The later documentation head `571a160301164cb61066912ba3bb4faffb05f3f0` also passed Quality Checks run `44649402430`. These are CI results only; they do not prove physical-device behavior, current workbook parity, or a fresh human fairness review.
- **Next verification order:** (1) deterministic early-loss/restart rotation and pinned-Boss regression cases; (2) authoritative workbook versus live JSON parity, if the current workbook is available; (3) physical-phone Hunt/Haunt and native regression checks before release. Do not reopen Home design, expand content or refactor unrelated systems to close these gates.

## Approved product surfaces

- **Home:** the outdoor night terrace is the approved production Home (`HomeTerraceScreen`); the old indoor Home is DEV-only rollback, not the active direction. Position, entry, moon, castle, button and dive rulings are in `docs/HOME_SCREEN_LOCKDOWN.md` and the live `app/ui/homeTerrace*.ts` files. Do not reopen a Home redesign from old notes.
- **Daily:** deterministic, one attempt per date, five UP-only rounds and two lives. The player sees six cards (target plus five distractors). New authoring supplies exactly three clues and six cards; legacy nine-source-candidate entries remain compatible only through the engine. Daily uses its own writing standard and clue-fit checker (`npm run daily:fit`). A clue must fit the plank in two lines; 46 characters is the ordinary authoring limit. The Daily entry card and castle breach are built. Daily castle art remains separately revisable, not an invitation to change locked gameplay.
- **Polybook:** Polly's book opens from Home to a portrait Living Journal with TODAY / JOURNAL / MASTERY. It must never reveal REALs, traps or hidden pairs because words recur. The MASTERY tally counts MASTERED, KING, BANISHED and active HAUNTED; section ID `BEATEN` is retained for navigation compatibility. Do not delete the old Lexicon rollback components without approval.
- **Polly:** a sharp opponent and trap-setter, not a vocabulary teacher. Relationship Memory V2 is implemented. Master pose art is in `assets/images/polly/master/`. Rig 2 animates face/crown but not a fully articulated body; the whole-image rocking experiment was rejected. Preserve `BROW_FOLLOW = 0.33`. Do not invent a production full-body animation system without an approved articulation plan.

## Audio, accessibility and native pitfalls

- `app/audio/MusicEngine.ts` owns music; `app/audio/audioSession.ts` the session; `app/audio/sfx.ts` SFX. Audio objects are rebuilt after a sufficiently long background absence before playback resumes (`app/audio/audioResumePolicy.ts`); preserve the tested order.
- Expo-audio's SDK 57 iOS watchdog fix is carried in `patches/expo-audio+57.0.5.patch` via `patch-package`. `tools/expoAudioPatch.test.mjs` guards it. Remove only after a deliberate native upgrade and device background/foreground verification.
- Haptics route through `app/utils/haptics.ts`. Hunt and Daily feedback have separate cues. Reduce Motion / Reduce Flashes must suppress decoration without changing game decisions, state or required continue gates (`app/game/gameplayFeedbackAccessibility.ts`).
- Native lessons: keep animated transform types stable; protect essential stacked views from flattening; give absolute image layers explicit dimensions on iOS; keep pose layers mounted and switch opacity rather than remounting; trigger arrival reactions from animation completion, not a timer started at screen mount. Use measured layout constants in code, not stale screenshot coordinates.
- Gameplay text sizing is controlled to protect tile fitting; Settings and Polybook retain their own accessibility behavior. Verify native gesture, audio, animation, layout and Bold Text separately from TypeScript/CI.

## Verified Hunt campaign stress test (2026-11-19 / CI 2026-11-20)

- **Source:** `app/game/huntReachability.test.ts`, commit `6ac2b0fec1921f39d6b29bc1a01d16366789e48f`. GitHub Actions Quality Checks run `44649939114` completed **SUCCESS** on that commit. The job log confirms TypeScript, the full automated test command and the live Hunt content-quality gate all succeeded.
- **Campaign coverage:** 200 simulated players × 40 Hunts = **8,000 generated Hunts**; **6,000 simulated early losses** and **2,000 simulated completed Hunts**. The simulation covered first-run FINE onboarding, eight-round introductory and ten-round standard Hunts, deterministic repeatability, within-Hunt word uniqueness, soft recency rotation, eligible pinned-Boss continuity, and visible-card composition.
- **Observed counters from the CI log:** **253 distinct reached headwords**, **0 immediate ordinary-word repeats** (as measured between successive sets of reached ordinary words), **0 pinned-Boss failures**, and **0 visible-card REAL/trap mix or five-card-cap failures**. Assertions for seed reproducibility, Hunt length, onboarding and within-Hunt uniqueness also passed.
- **Interpretation boundary:** These are generator-level synthetic campaigns with scripted early-loss/full-run outcomes, **not** 8,000 real player sessions. The test does not simulate per-card judgments, feather depletion, scoring, mastery/Haunt outcomes, retention, UI gestures, native presentation or emotional difficulty. The zero-repeat observation is specific to these simulated conditions; the generator's recency policy remains a **soft preference**, not an unconditional guarantee.
- **Next highest-value test:** player-decision/balance simulation with explicit accuracy assumptions and real run-engine transitions, followed by physical-device and stranger-player testing. Keep the approved Group D audit re-edit closed unless a specific new issue warrants reopening.

## Shipping and verification

- CI is `.github/workflows/typecheck.yml` (Quality Checks): Node 24, `npm run typecheck`, `npm test` and `npm run content:quality`. Recheck the **latest branch-head run** after any change; a historical green run does not certify a later commit.
- For docs-only changes, check whitespace and references. For code/content, use the relevant regression tests and live-bank gate. Report unperformed device checks explicitly.
- The public site and privacy/support pages are on the separate orphan `gh-pages` branch. Never merge it with the game branch. Adding network, analytics, crash reporting or ad SDKs requires matching updates to `PRIVACY_TEXT`, the published privacy page and App Store disclosures.
- Licensing is a release gate: `assets/fonts/Buggie-LICENSE.txt` was empty in the last documented audit; verify the license before shipping rather than treating the old note as clearance.
