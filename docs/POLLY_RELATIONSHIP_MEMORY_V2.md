# Polly Relationship Memory V2

**Status:** V2 FOUNDATION IMPLEMENTED — source/device verification still required before lock  
**Branch context:** `play-screen-overhaul`  
**Purpose:** Upgrade Polly's existing deterministic memory into a persistent relationship system without changing the locked Polybook interior or authored-character model.

## Product rule

**Permanent progression moves forward; the rivalry moves both directions.**

Crowns/mastery and important shared history are permanent. Recent performance is temporary and can improve or deteriorate. Polly should remember who the player has been while reacting to how they are playing now.

## Existing foundation to preserve

The repo already persists:
- PollyMemory V1: Hunt count, last Hunt outcome, player/Polly win streaks, lifetime Hunt wins, last score, last boss word, last Haunt word, Daily history, recent Polly lines.
- PlayerProgress: mastered words, mastery dates, flawless mastery, prior Haunt attempts, personal best, runs completed, Daily streak/rank history, recent Hunt performance, recent words, discovered visible REAL ids, discovered hidden-pair ids, and Polybook day facts.
- Ghost/Haunt records and returning-Haunt resolution.
- A reversible five-state TODAY rivalry read in `pollyMood.ts`: DISMISSIVE / AMUSED / WATCHFUL / RATTLED / CONCEDING.

Do not replace these systems with a parallel progression model.

## Four memory layers

### 1. Immediate / session
Existing live Hunt state. Examples: current word, mistakes, hesitation, clean decisions, boss result. Usually not persisted as relationship history unless it becomes a meaningful event.

### 2. Recent form
Short rolling performance. Reversible. Drives current emotional weather and comeback/dominance recognition.

Primary existing source: `recentHuntPerformance` plus player/Polly win streaks.

### 3. Episodic memory
Small durable records of meaningful shared events. V2 should add only memories with a clear future behavioral use.

Initial V2 candidates:
- first Hunt completed
- first time player beats Polly
- first mastery
- first Haunt created
- word-specific Haunt history: word, failures/holds, eventual banish, dates/sequence where available going forward
- first Haunt banished
- notable comeback after a losing stretch
- notable reversal after a winning stretch
- mastery milestones, with thresholds to be chosen only after crown/mastery cadence is audited
- last meaningful visit timestamp / return-after-absence signal

Never fabricate missing episodic history for legacy saves.

### 4. Long-term relationship
A slow interpretation of permanent history, distinct from TODAY mood. It answers how seriously Polly fundamentally takes this player, not how today's session is going.

Do not expose this as a numeric meter.

Exact state names and thresholds remain unapproved. Candidate conceptual arc only:
unfamiliar → noticed → rival → proven threat → grudging respect.

## Behavioral context

Future Polly selection should be able to derive:

`longTermRelationship + recentForm + immediateEvent + relevantEpisode`

Examples of intended behavior:
- veteran + slump differs from beginner + slump
- proven player + comeback differs from new player + first good run
- a returning Haunt can reference that word's actual shared history
- a bad streak never deletes mastery, crowns, unlocked Polybook material, or permanent respect/history

This context may later feed authored dialogue, Polybook copy, gameplay reactions, and Polly animation. It must not generate freeform character dialogue.

## Persistence and migration rules

- V2 must hydrate old V1 saves safely.
- Missing V2 fields default to unknown/empty, never invented history.
- Permanent memories are monotonic unless a record is explicitly correcting corrupted data.
- Recent-form data is intentionally rolling/decaying.
- Store facts/events, not authored sentences.
- Every persisted field requires a named behavioral consumer before implementation.
- Keep deterministic authored dialogue and existing anti-repeat line memory.

## Player identity requirement

The repo already has a locally persisted `playerName`, defaulting to `Word Hunter`, editable in Settings.

A proper first-time player naming / identity moment is still required. Treat this as **PLAYER IDENTITY / FIRST MEETING**, separate from account/cloud registration. Polly learning the player's chosen name should eventually be part of the relationship experience.

Do not build account/cloud signup as part of Relationship Memory V2.

## Locked systems / non-goals

Do not reopen or redesign:
- TODAY visual treatment or authored pools
- JOURNAL layout/pagination
- MASTERY layout/pagination
- shared ribbon shell
- current Polly animation work
- crown reward/unlock thresholds
- closed-cover art

Do not add:
- visible relationship XP/respect meter
- generative/LLM Polly dialogue
- arbitrary milestone thresholds
- loss penalties that remove permanent progress
- huge event logs with no behavioral purpose

## Implementation sequence

1. Audit exact event write points and identify which V2 episodic facts can be captured reliably.
2. Define the smallest V2 schema and pure derivation functions for long-term relationship, recent form, comeback/reversal, and relevant word episode.
3. Add hydration/migration tests before store integration.
4. Wire event recording at existing authoritative commit points.
5. Add deterministic behavioral-context tests.
6. Only after the brain is verified, design authored responses and animation consumers.
7. Audit real crown earning cadence before defining Polybook mastery unlock thresholds.

## Acceptance criteria

- Permanent mastery/history never regresses because of poor recent play.
- Recent rivalry credibly moves both directions.
- Veteran struggle can be distinguished from beginner struggle.
- Meaningful word-specific Haunt history can survive app restart.
- Legacy saves load without fabricated memories or crashes.
- No locked Polybook layout/ribbon behavior changes.
- No freeform generated Polly copy.
- Every new persisted field has a demonstrated consumer.
- Deterministic unit tests cover migration, reversals, comeback context, and word-specific memory.
- Real-device verification follows implementation before the feature is called locked.

## Next product decision

Before implementation, inspect the authoritative event write points and propose the **minimum V2 episodic schema**. Do not add fields merely because they might be useful someday.


---

# Event-write audit — 2026-10-04

This audit traces the authoritative places where relationship-relevant facts are committed today. The goal is to reuse those commits, not create a second shadow history.

## Authoritative write points

| Event/fact | Current authoritative write point | V2 use |
|---|---|---|
| Hunt finished / outcome / score | `useGameStore.recordRunComplete` → `rememberHunt` | recent form, lifetime rivalry, comeback/reversal |
| Recent Hunt quality | `recordRunComplete` → `resolveHuntPerformance` → 5-entry `recentHuntPerformance` | reversible current form |
| Mastery | `useGameStore.recordMastery` → `upsertMasteredRecord` | permanent proof / long-term relationship |
| Boss held / lost | `recordRunComplete` → Polybook `bookLog` | shared history |
| Haunt created | `useGameStore.queueFailedBoss` → `upsertGhostRecord` | begin word-specific rivalry |
| Returning Haunt held/banished | `useGameStore.reconcileHauntOutcome` → `applyReturningHauntResolution` | update word-specific rivalry |
| Haunt left/broken in diary | `recordRunComplete` → `foldRunIntoBookLog` | historical narrative source |
| Daily completed | `useGameStore.claimDailyAnswer` → `rememberDaily` + `applyDailyStreak` | Daily familiarity / return habit |
| Polly line shown | existing `rememberPollyLine` | anti-repeat only |
| Player name | `useGameStore.setPlayerName` → Settings blob | identity; future First Meeting |
| First-run experience | onboarding persistence | distinguishes genuinely new player from established player |
| App boot | `App.tsx` loads memory/progress/settings before first screen | future return-after-absence read/write point |

## Important audit findings

1. **Hunt completion is already the central relationship commit.** It records outcome, updates PollyMemory, updates the rolling five-Hunt form window, and folds facts into the Polybook log. V2 should extend this path rather than create a new run-history subsystem.
2. **Haunt lifecycle already has clean authoritative commits.** Creation and return resolution are separate, idempotent paths. They are the correct places to maintain durable word-specific rivalry memory.
3. **Mastery is already permanent.** V2 should read it as proof; it must not duplicate or weaken it.
4. **TODAY already has reversible weather.** `resolveRivalryState` should remain the broad five-state current mood. V2 relationship context refines behavior around it rather than replacing it.
5. **Daily is already persisted separately.** V2 does not need to absorb the Daily system into a giant universal event log.
6. **There is no durable visit timestamp today.** Return-after-absence requires one new small fact.
7. **The current Ghost record disappears/changes as the Haunt resolves, so it is not by itself a permanent shared-memory record.** Polybook day rows preserve some history, but they are capped and explicitly not backfillable. A tiny durable word-rivalry record is justified if Polly is to remember a specific old battle later.

# Minimum V2 schema proposal

The audit does **not** justify a large event log. Most of Polly's brain can be derived from state the game already owns.

Keep all existing V1 fields and add only:

```ts
type PollyWordRivalry = {
  word: string;
  hauntHolds: number;
  banished: boolean;
  firstHauntedAt: string | null; // local YYYY-MM-DD when known going forward
  lastHauntAt: string | null;    // local YYYY-MM-DD
  banishedAt: string | null;     // local YYYY-MM-DD
};

type PollyMemoryV2 = PollyMemoryV1 & {
  version: 2;
  lastVisitAt: number | null;
  longestPlayerWinStreak: number;
  longestPollyWinStreak: number;
  wordRivalries: Record<string, PollyWordRivalry>;
};
```

## Why these are the only new persisted fields

### `lastVisitAt`
**Consumer:** return-after-absence context.  
Nothing existing can reliably derive it.

### `longestPlayerWinStreak` / `longestPollyWinStreak`
**Consumer:** distinguish an ordinary current streak from a comeback/collapse relative to known history and support future authored recognition of exceptional runs.  
Current streaks reset, so their previous peaks are otherwise lost.

### `wordRivalries`
**Consumer:** Polly can remember an old specific Haunt after it is no longer an active Ghost.  
This is the one genuinely personal episodic record V1 cannot reconstruct reliably.

No new fields for first Hunt, first mastery, total mastery, lifetime wins, current streak, recent form, Daily streak, boss result, or player name. Those facts already have authoritative owners and should be derived from them.

# Derived context — do not persist

Create pure selectors later; do not store these labels:

- `experienceBand`: new / established / veteran, derived from runs/mastery/history.
- `currentForm`: struggling / steady / surging, derived from recent Hunt performance.
- `momentumOwner`: player / Polly / neutral, derived from current streaks/recent form.
- `isComeback`: recent clean success after a meaningful struggle pattern.
- `isCollapse`: recent struggle after meaningful prior success.
- `returnBand`: normal / away-a-while / long-return, derived from `lastVisitAt`.
- `relevantWordRivalry`: lookup only when the current word has actual shared history.
- `todayMood`: continue using existing `resolveRivalryState`.

Thresholds for these selectors are **not locked by this audit**. They should be tuned with simulations/tests rather than guessed into persistence.

# Event-to-memory map

- **App becomes meaningfully active:** compare previous `lastVisitAt` for return context, then update timestamp. Avoid treating background/foreground flapping as a dramatic return.
- **Hunt completes:** existing `rememberHunt`; additionally update longest player/Polly streak peaks after the new streak is known.
- **Boss failure creates Haunt:** initialize/update that word's rivalry record.
- **Returning Haunt fails:** increment `hauntHolds`, update `lastHauntAt`.
- **Returning Haunt is banished:** mark `banished`, set `banishedAt` and `lastHauntAt`.
- **Mastery:** no duplicate V2 write unless it is also the authoritative resolution of a Haunt; permanent mastery remains owned by PlayerProgress.
- **Daily:** no new V2 write for now. Existing Daily memory is sufficient for V1 relationship behavior.
- **Player naming:** no V2 duplication. Future First Meeting writes through existing Settings owner.

# Migration rule

Hydrating V1 → V2:
- preserve every valid V1 field;
- `lastVisitAt = null`;
- longest streak fields may initialize to the **current known streak only**, never an invented historical peak;
- `wordRivalries = {}`;
- do not infer old Haunt episodes from incomplete/capped logs and present them as certain memories.

This intentionally means legacy players begin accumulating richer episodic memory from V2 onward. Their real mastery/lifetime counters still establish that they are veterans.

# Implementation gate

The next implementation patch should be limited to:
1. V2 types/defaults/hydration migration in `pollyMemory.ts`;
2. pure update helpers for streak peaks and word-rivalry events;
3. unit tests for V1 migration, idempotent Haunt updates, permanent banish memory, and streak-peak preservation;
4. store wiring only at the audited authoritative write points.

Do **not** add authored dialogue, animation changes, Polybook layout changes, crown thresholds, or visible relationship UI in that patch.


---

# Implementation checkpoint — 2026-10-04

Pete approved implementation after the dependency/side-effect audit.

Implemented on `play-screen-overhaul`:
- `pollyMemory.ts` schema version 2 with safe V1 hydration.
- Persisted last meaningful visit time.
- Persisted longest player/Polly Hunt win-streak peaks.
- Persisted compact word-specific Haunt rivalry history.
- Haunt creation/resolution wiring at the existing authoritative Ghost commit points.
- Haunt + relationship-memory persistence written together with `AsyncStorage.multiSet` to reduce split-write drift.
- Visit timestamp written only when the hydrated app leaves the foreground, preserving the absence interval for the next launch.
- Pure `derivePollyRelationshipContext` exposing permanent history + reversible TODAY mood + recent form + absence duration + relevant word history without persisting policy labels.
- Existing `pollyMemory.test.ts` extended for V1 migration, streak-peak preservation, permanent banish history, visit timestamps, and combined relationship context.

Deliberately unchanged:
- locked TODAY/JOURNAL/MASTERY visuals and ribbons;
- existing authored Polly line pools;
- animation/face-rig behavior;
- mastery/crown reward thresholds;
- player-name UI / First Meeting;
- storage key name `polywords_polly_memory_v1` (kept intentionally so existing saves are found and migrated in place; schema version is carried inside the payload).

Verification status:
- Source was re-fetched from the target branch after writes and the event wiring was inspected in place.
- Full TypeScript/test execution is still required in the normal repo runtime before this foundation is called locked. GitHub content access here does not provide the repo's installed runtime, so no build-pass claim is made.


---

# Relationship behavior rules checkpoint — 2026-10-04

The first observable-behavior policy layer is now implemented as pure, presentation-free logic in `app/game/pollyRelationship.ts`.

Initial beats:
- **returningAfterAbsence** — Home only, established player, at least 3 days since the last trustworthy visit timestamp.
- **comeback** — Results only, player beats Polly after at least two struggles in the immediately preceding three-result window.
- **veteranSlump** — Results only, established player with three consecutive current struggles. Establishment can be proven by runs, mastery, or lifetime Hunt wins.
- **hauntRematch** — word entry only, current word has an unresolved durable Haunt rivalry.

Priority:
1. word-specific shared history;
2. Results reversal/form recognition;
3. Home return recognition;
4. otherwise no special relationship beat.

These rules intentionally produce **behavior facts, not dialogue**. They do not change visuals, animations, authored line pools, Polybook layout, or save schema. The presentation layer will decide whether a beat earns speech, an existing pose, timing, or silence.

The thresholds above are V1 behavior-policy constants, not persisted player data. They can be tuned without save migration.

Dedicated deterministic tests were added in `app/game/pollyRelationship.test.ts` and registered in the full `npm test` suite. Runtime verification is required after pulling this checkpoint before any presentation consumer is wired.


---

# Observable relationship presentation checkpoint — 2026-10-04

The first relationship beats now have presentation consumers. This pass deliberately reuses the existing authored Polly bank and existing pose art; it adds no freeform dialogue and no new animation assets.

Behavior:
- **Return after absence:** Home entrance may override the ordinary greeting with a fresh authored return-recognition line. Existing Home body/ambient behavior remains unchanged.
- **Comeback:** Results recognizes the reversal before run persistence mutates the store, uses a fresh existing authored rivalry line, and settles Polly in the existing rattled pose.
- **Veteran slump:** Results distinguishes an established rival's three-struggle slide from beginner difficulty, uses existing authored loss-memory copy, and settles Polly smug rather than treating the player as new.
- **Haunt rematch:** Hunt keeps the existing Ghost visit arc and `Remember me.` line. Durable word-rivalry holds are combined with the active Ghost's miss count so repeated shared history can sharpen the existing smug→point body-language rule without adding a competing presenter.

Safety/side-effect rules:
- Results freezes the pre-`recordRunComplete` memory/progress snapshot and synthesizes the current run's performance exactly once for relationship detection. This prevents the Results effect that persists the run from double-counting the current result in the presentation read.
- Relationship presentation selects only existing `PollyLineId` entries and continues through `rememberPollyLine`, preserving the global anti-repeat memory.
- No Polybook layout, ribbon, mastery, Daily, save-schema, or authored-bank copy was changed.
- No new animation assets or runtime LLM behavior was added.
- Dedicated relationship tests now cover presentation selection and silence when no beat exists.

Verification gate: pull this checkpoint, then run `npm run typecheck` and the full `npm test` suite before device feel testing.

# Authored relationship dialogue checkpoint — 2026-10-04

The four proven relationship beats now use dedicated authored dialogue rather than placeholder lines borrowed from ordinary Home/Results reactions.

- **Comeback:** 18 approved lines.
- **Veteran slump:** 30 approved lines.
- **Return after absence:** 61 approved lines. `MISS ME?` and `BACK AGAIN?` reuse their canonical existing line IDs and are reserved for a true return; 59 additional return lines are relationship-specific.
- **Haunt rematch:** 71 approved lines.

That is **180 approved relationship remarks**. They remain deterministic and use the existing global `recentLineIds` anti-repeat path. Ordinary Home, wrong-swipe, streak, Boss, Daily, onboarding, Results, and Polybook writing retain their own jobs.

Haunt copy is history-gated where wording makes a factual claim: the "beat you twice" line is first-rematch-only; repeated-loss wording requires prior holds; the comparative-record line remains authored but ineligible until the game can prove the comparison rather than bluffing with player history.

The rejected legacy remarks removed before this checkpoint are not fallback copy. A relationship beat must use its dedicated pool rather than resurrecting retired dialogue.
