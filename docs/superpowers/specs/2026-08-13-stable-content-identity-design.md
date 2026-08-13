# Stable Content Identity Design

**Date:** 2026-08-13  
**Status:** Approved design; implementation not started  
**Branch:** `play-screen-overhaul`  
**Decision owner:** Pete  
**Product governance:** POLYWORDS Master Product Director

## Purpose

Give every persistable POLYWORDS meaning a permanent identity so saved player history survives wording edits, content reordering, and future workbook-to-repo synchronization.

The August 13 content workbook is ahead of `huntData.json` and is the canonical editorial source. The repository remains the canonical runtime implementation. Identity must be established in the workbook first and carried into overlapping runtime content without deleting or downgrading workbook-only content.

## Problem

Visible masks already have string IDs in runtime data. Boss `hiddenPairs` do not: they are bare `{ real, trap }` objects. Runtime and persistence consequently use mutable wording and, in some flows, array position to identify hidden content.

Current persisted records copy text:

- `GhostMeaning.hiddenMeaningReal`
- `GhostMeaning.hiddenMeaningTrap`
- `MasteredWordRecord.hiddenMeaningFound`
- `MasteredWordRecord.hiddenMeaningsFound`

This allows three failures:

1. Reordering hidden pairs can make an array index identify different content.
2. Rewriting a sentence leaves old saves displaying stale content.
3. A later workbook import can replace repo-authored IDs unless the workbook owns the identity.

## Governing decisions

### Canonical source

- The latest approved workbook is the editorial source of truth.
- `huntData.json` may lag behind the workbook.
- Stable IDs are assigned in the workbook first.
- Runtime synchronization covers only overlapping content unless a separate content-import task is approved.
- Runtime data must never overwrite or discard newer workbook-only content.

### Identity

- A stable ID identifies the underlying authored content item, not its current sentence or row position.
- IDs are opaque persistence keys. Player-facing copy never depends on parsing them.
- IDs are permanent once shipped.
- Rewriting or reordering an item preserves its ID.
- Deleted IDs are retired and never reused.
- A genuinely new meaning or hidden pair receives a new ID.
- Two alternate phrasings intended to rotate independently are two content items and require two IDs.

### Naming

Use lowercase ASCII identifiers:

- Visible REAL: `<word>_rNN`
- Visible trap: `<word>_tNN`
- Hidden pair: `<word>_hNN`

Examples:

- `deck_r01`
- `deck_t03`
- `horn_h02`

Existing valid visible-mask IDs are preserved. New IDs use two-digit suffixes. Suffixes are allocation labels, not ordering instructions.

### Hidden-pair runtime shape

```ts
export type HiddenPair = {
  id: string;
  real: string;
  trap: string;
};
```

The `id` travels with the pair through Hunt generation and gauntlet resolution.

### Persistence

New Haunted and Mastered writes store stable hidden-pair references.

The target compatibility shapes are:

```ts
export interface GhostMeaning {
  wordId: string;
  word: string;
  hiddenPairId?: string;
  hiddenMeaningReal: string;
  hiddenMeaningTrap: string;
  runsMissed: number;
  isGhostedMaster?: boolean;
  lastHauntResolutionId?: string;
}

export type MasteredWordRecord = {
  word: string;
  isBoss: boolean;
  hiddenPairIds?: string[];
  hiddenMeaningFound: string;
  hiddenMeaningsFound?: string[];
  priorHauntAttempts?: number;
  dateMastered: string;
  flawless?: boolean;
};
```

The legacy text fields remain during migration. They are fallback snapshots, not authoritative identity.

### Read resolution

When displaying or reconstructing saved hidden content:

1. Resolve `hiddenPairId` from current runtime content.
2. If resolved, use the current pair wording.
3. If absent or unresolved, use the legacy saved text.
4. Never silently point an unresolved ID at another pair.
5. Never crash, erase the record, or substitute by array position.

### Legacy migration

- Existing saves without IDs remain valid.
- Migration may attach an ID only when the saved word plus REAL and trap text match exactly one current pair.
- Zero matches remain legacy-text records.
- Multiple matches remain legacy-text records and emit a development diagnostic.
- Migration is idempotent.
- Loading legacy progress must not rewrite storage unless the existing persistence architecture already performs a safe canonical write.

## Workbook design

The latest canonical workbook must contain stable identity fields for:

- every visible REAL
- every visible trap
- every hidden pair

If separate hidden-pair rows or sheets exist, the pair ID belongs to the pair record and covers both the hidden REAL and its paired trap. The two sides do not receive competing persistence identities.

Workbook assignment must:

- preserve compatible IDs already present in `huntData.json`
- allocate IDs for workbook-only content
- flag ambiguous text matches instead of guessing
- detect duplicates across the entire workbook
- retain IDs through later editorial rewrites

The edited workbook must preserve existing formatting, formulas, tables, statuses, and locked wording.

## Validation

Repository content validation must fail on:

- missing visible mask IDs
- missing hidden-pair IDs
- duplicate IDs
- malformed IDs
- a hidden-pair ID whose word prefix disagrees with its parent word
- incompatible reuse of one ID for multiple content items

Workbook validation must report the same identity failures before an export is accepted.

## Testing requirements

Tests must prove:

1. Hidden-pair IDs reach generated boss steps unchanged.
2. Reordering pairs does not change which saved pair resolves.
3. Rewriting pair text displays current wording when the ID resolves.
4. A legacy exact-text record can resolve to one ID.
5. An unresolved legacy record continues displaying its saved text.
6. An unknown ID falls back safely and never resolves by array position.
7. Duplicate and missing IDs fail content validation.
8. Existing Hunt generation remains deterministic for a fixed seed except for the additive ID fields.
9. Existing Mastered, Haunted, Returning Haunt, and Banished gameplay behavior is unchanged.

## Scope boundary

This project changes identity, resolution, validation, workbook fields, and backward-compatible persistence only.

It does not change:

- boss eligibility
- boss or Returning Haunt spawn slots
- gauntlet card selection
- gauntlet success rules
- Mastered requirements
- Haunted timing
- Returning Haunt timing or outcome rules
- Banished behavior
- Vault progression architecture
- Polly's rivalry arc
- visible-meaning discovery behavior

Those systems receive a safe identity foundation but no gameplay redesign in this patch.

## Failure handling

- Ambiguous workbook-to-repo matches stop automatic assignment for that item.
- Existing runtime content without a trustworthy workbook match is reported for manual mapping.
- Production reads fail soft to legacy text.
- Authoring and validation fail loudly before malformed identity data ships.

## Rollout sequence

1. Inventory workbook and runtime IDs; produce a mapping and exception report.
2. Add/preserve IDs in the canonical workbook.
3. Add hidden-pair IDs to overlapping `huntData.json` content.
4. Add validation and failing tests.
5. Carry IDs through runtime types and Hunt generation.
6. Add ID-based lookup and legacy migration helpers.
7. Update Haunted and Mastered persistence writes and reads.
8. Run typecheck, full tests, content audit, runtime validation, and migration fixtures.
9. Verify no boss, gauntlet, Mastered, Haunted, Returning Haunt, or Banished behavior changed.

## Acceptance criteria

- The canonical workbook is newer than and never reduced to the repo content set.
- Every runtime visible mask and hidden pair has one unique stable ID.
- Every corresponding workbook item has the same ID.
- Saved content resolves by ID rather than sentence or position when an ID exists.
- Legacy saves still load and display safely.
- Reordering and rewriting hidden pairs cannot redirect saved progress.
- No gameplay outcome or spawn behavior changes.
- Typecheck, all tests, content audit, and runtime validation pass.
- The identity mapping and all unresolved exceptions are reviewable.
