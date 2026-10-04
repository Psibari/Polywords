# Polly Relationship Memory V2

**Status:** DESIGN SPEC — implementation not yet approved  
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
