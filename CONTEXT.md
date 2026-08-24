# POLYWORDS Current Context

Updated August 23, 2026. Branch: `play-screen-overhaul`, tracking
`origin/play-screen-overhaul`. Current code baseline: `97470f0`.

## Verified Current State

- Daily's correct-answer transition now reads as one physical mechanism: card lands on the
  parchment, a matching ornate rod rolls reward paper over it, the reward holds, and the
  paper rolls up to reveal the next clue. Repeated-round state/input tests, TypeScript, the
  full test suite, and an iPhone check passed.
- Hunt runtime content is `assets/data/huntData.json`: 173 words, including 13 boss words
  and 39 hidden pairs; no `PLACEHOLDER TEST` text was found.
- The tracked Hunt workbook is `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`; live JSON remains
  authoritative.
- Live Polly uses pose images. The layered rig remains dormant.
- Local playtest telemetry is available through Settings and is never networked.

## Release Blocker: Daily Content

`app/game/dailyPool.ts` contains 54 hard-coded development placeholders (18 per tier). The
July expansion is explicitly labeled “drafts, pending joint content pass.” The current pool
must not be treated as approved or shipped as final content.

Decision: leave it unchanged as a placeholder until a new Daily-specific pool is written and
approved. Do not substitute Hunt content automatically. Before release, replace the pool or
disable Daily.

## Next Work

1. Define the Daily editorial source, approval states, and runtime export format.
2. Write and approve a new Daily pool.
3. Version/schedule the new pool so every player receives the same puzzle for a date.
4. Continue real-device iOS/Android journey checks before release.

## Protection

- Preserve every Git stash unless Pete names one and explicitly requests an operation.
- Preserve unrelated worktree changes.
- Git history is the patch diary; do not rebuild session logs in this file.
