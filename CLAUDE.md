# POLYWORDS Architecture

`AGENTS.md` owns authority/workflow. `CONTEXT.md` owns current branches, priorities and open work.
Focused product rules live in `docs/`. Runtime code/data outrank every doc.

> Never write a count `npm run state` can print. Counts rot; the command does not.

## Source Map

| Area | Owner |
| --- | --- |
| Hunt rules, scoring, onboarding | `docs/GAME_REFERENCE.md` |
| Hunt pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt editorial law | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily gameplay/castle | `docs/DAILY_CHALLENGE_SPEC.md` |
| Daily editorial law | `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Polly voice | `docs/POLLY_DIALOGUE_BANK.md` |
| Polly relationship | `docs/POLLY_RELATIONSHIP_MEMORY_V2.md` |
| Polybook | `docs/POLYBOOK.md`, `docs/POLYBOOK_LIVING_JOURNAL.md` |
| Visual system | `DESIGN.md`, `app/ui/` |
| Workflow | `docs/WORKFLOW.md` |

## Runtime

- Expo SDK 57, React Native 0.86 New Architecture, strict TypeScript.
- Zustand + immer own state; AsyncStorage owns persistence.
- React Native Animated handles most motion; Reanimated owns finger-tracked cards.
- Bebas Neue is the hero face; Barlow Condensed is UI/tile/dialogue.
- `MusicEngine.ts` owns persistent music; `audioSession.ts` owns the app audio session;
  `sfx.ts` owns on-demand SFX players.

### Native rules learned on device

- Never swap a native-driven transform between an Animated node and a plain number across renders.
- Stacking containers that must survive native flattening use `collapsable={false}` + zIndex.
- Full-size art containers carry no padding; give bundled absolute images explicit dimensions.
- Huge `borderRadius` is not a soft glow. Use art.
- JSX shape changes remount nodes; animation on the old node silently dies.

`wallShake.ts` is the shared stone-wall shake channel. Consumers use its helpers and call
`resetWallShake()` on unmount. Never scale the wall; the Boss ledge derives from full-width,
bottom-anchored geometry.

## Hunt Architecture

- `huntGenerator.ts` builds 10-round standard and 8-round fledgling arcs. Polly's Word is final;
  Returning Haunt is round 5 / round 4 and never gets Boss presentation.
- UP claims a REAL; RIGHT rejects a trap. Six starting feathers. Up to five visible masks.
- Boss: survive visible masks, then judge three hidden cards one at a time. All three correct =
  MASTERED; any hidden miss or Boss death = HAUNTED. `bossOutcome` is authoritative.
- Returning Haunt re-tests the exact hidden pair that won. Mastered words may return only as
  ordinary tension/panic `isMasteredReturn` revisits, never Boss/Haunt candidates.
- GPS arc: Confidence → Flow → Tension → Panic → Boss. `docs/GOLDEN_PACING_SYSTEM.md` owns the
  product rhythm; `huntGenerator.ts` owns executable pools/fallbacks.
- Runtime Hunt entries are validated before selection. Invalid difficulty/gpsTag, malformed or
  duplicate mask IDs, non-Boolean REAL/trap flags, missing swipe-direction coverage, or Boss
  entries without hidden content must fail loudly rather than silently disappear from pools.
- `assets/data/huntData.json` is the single live Hunt bank. The generator and every Hunt
  validation, audit and state tool consume it directly; parallel runtime override banks are not
  part of the architecture.
- Scoring is computed/persisted but player-facing nowhere. Rank is retired. Momentum is the live
  STEADY / SHARP / RAZOR SHARP / UNTRAPPABLE system with FELL OFF on a broken chain.

## First-Run Onboarding

Player-facing flow/copy: `docs/GAME_REFERENCE.md`.

- One versioned `FirstRunOnboardingState`; version mismatch must not casually re-tutorialize
  established players.
- First Home uses Polly's four-line perch intro and a one-time HUNT glow.
- First Hunt is the real 8-round board, opens on FINE, and pins guided REAL, guided TRAP and first
  unaided masks. No practice board.
- Active Hunt state is authoritative. Resume reconciles only from committed decisions.
- Direction limits flow through MaskBoard input mode to SwipeMask disabled state.
- Settings replay re-runs only the FINE opening; it does not reset Boss/Haunt/HUD lesson gates.
- HUD lessons teach feathers, momentum, broken run and Hunt progress only after the player lives
  the event. `HudLessonLayer.tsx` owns the spotlight and accessibility lock. Do not use
  `gameplayGateActive` for this because it unmounts gameplay.

## Boss Presentation

### Gauntlet entrance

`BossGauntletSpines.tsx` owns the three wall-brick cards. Sprite padding and derived closed-card
height are geometry contracts. Wall holes are an overlay; never cut the wall art.

### Outcome

`HeroBook.tsx` swaps neutral/mastered/haunted rigs on one canvas; `MaskBoard.tsx` owns the
continuous open → transform → close choreography. Boss outcome music stays fully silent through
both outcomes. Returning Haunts do not use this package.

## Polybook

- Vault route is Polly's book. Current architecture: closed physical book → one large portrait
  page, not the retired miniature two-page spread.
- Navigation: TODAY / JOURNAL / MASTERY on bottom forked ribbons, plus visible `< COVER` return.
- Never display a meaning, trap or hidden pair. Words recur, so that becomes an answer key.
- TODAY/JOURNAL/MASTERY interior behavior is owned by the Polybook docs. Do not duplicate its
  typography, pagination or visual tuning here.
- Old Lexicon rollback components remain until Pete decides to delete them.
- The nav tab and in-round spine both say POLYBOOK; renaming remains Pete's decision.

## Daily

Deterministic, one attempt per date, five UP-only rounds, two lives. `docs/DAILY_CHALLENGE_SPEC.md`
owns the sequence and device-approved castle behavior.

Architecture only:
- `DailyCastleStage.tsx` owns the persistent scene behind entry/play/results.
- Measured geometry and animation constants live in `app/ui/dailyCastleScene.ts`; re-measure when
  exported art changes rather than copying coordinates into docs.
- Derived castle/door/wall/tunnel/coin art comes from `tools/art/`; rerun scripts, never hand-edit
  generated output.
- Text fitting uses measured widths, not browser-dependent auto-fit behavior.
- Correct claim, gold hit and gold-coin finale are separate progress systems. Input stays locked
  until the gate settles; Results waits for the finale.

## Audio and Haptics

- App owns audio lifetime; screens claim music only while focused.
- Loudness is partly asset-level. Measure/normalize files before blaming player volume.
- `cueAsync` in `app/utils/haptics.ts` is the only haptic gateway; heavy belongs to Boss beats.
- Polly's ordinary laugh, Boss laugh, Returning Haunt laugh and Hunt-loss Results chuckle are
  separate product beats.

## Content and Data

- Live Hunt bank: `assets/data/huntData.json`.
- Editorial workbooks are staging only and never update runtime automatically.
- Word/mask/hidden-pair IDs are persistence contracts. Never renumber approved live content.
- Runtime validation is a shipping gate, not an editorial writer: it catches structural failures;
  Pete's approval and `docs/CONTENT_WRITING_STANDARD.md` decide whether copy is good.
- Daily runtime content is `app/game/dailyPool.ts`, governed separately from Hunt.
- Retired: `assets/data/huntData.v2.json`, `tools/content/_deprecated/mask-rewriter/`.

## Polly Architecture

- Polly authored the traps. The words are the game; Polly is the pressure. She jabs, she does not
  teach. Voice law: `docs/POLLY_DIALOGUE_BANK.md`.
- Relationship Memory V2 is durable/reversible in the documented split: permanent progression is
  monotonic; current rivalry/form may move. Do not replace it with freeform LLM dialogue or a
  visible relationship meter.
- Life hierarchy: immediate gameplay event > relationship life profile > ambient idle. Logical
  profiles are neutral, cocky, watchful, rattled, hauntFocused; they are behavior policy, not
  saved progression labels.
- `PollyHomePerch` + `PollyPerchRig` + `usePollyAmbientMotion` are the current Home foundation.
  Rig 2 articulates face/crown but most body anatomy remains baked. Preserve device-approved
  `BROW_FOLLOW = 0.33`.
- The DEV ALIVE LOOP whole-image lean/rotation experiment was rejected. Do not wire it to Home.
- Next articulation gate lives in `CONTEXT.md`: inventory existing separated art, then prove one
  DEV Neutral articulated sequence before new art or production life-profile animation.

## Services and Boundaries

- `ErrorBoundary.tsx` wraps the navigator and uses system fonts in fallback UI.
- Boss and Returning Haunt explainers have separate one-time persistence gates from onboarding.
- `playtestTelemetry.ts` is local only; Daily reminders are optional local notifications.
- Theme/material tokens live in `app/ui/`; render code outranks abandoned plans.
- Preserve stashes and unrelated local art. Branch merges require Pete's approval.
