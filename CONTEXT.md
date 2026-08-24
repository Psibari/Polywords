# POLYWORDS Current Context

Updated August 24, 2026. Branch: `play-screen-overhaul`, tracking
`origin/play-screen-overhaul`. Current code baseline: `4e6294d`.

## Verified Current State

- Daily's correct-answer transition now reads as one physical mechanism: card lands on the
  parchment, a matching ornate rod rolls reward paper over it, the reward holds, and the
  paper rolls up to reveal the next clue. Repeated-round state/input tests, TypeScript, the
  full test suite, and an iPhone check passed.
- Hunt runtime content is `assets/data/huntData.json`: 197 words and 1,748 tiles, including
  13 boss words and 39 hidden pairs. The 24-word DISPATCH-through-FLAG import preserved all
  173 prior entries; DISCHARGE remained unchanged. Boss/hidden-pair structure did not change.
- The tracked Hunt workbook is `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`; live JSON remains
  authoritative.
- Live Polly uses pose images. The layered rig remains dormant.
- Local playtest telemetry is available through Settings and is never networked.

## Approved Daily Content

`workbooks/POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx` is the canonical source for
43 approved locked words; `STAGE` is included and `SENTENCE` is excluded.
`app/game/dailyPool.ts` is the runtime representation. Each source word has three clues, nine
unique approved candidates, and tier 1–3; each round deterministically presents the target plus
five distractors.

## Next Work

1. Continue real-device iOS/Android journey checks before release.

## Protection

- Preserve every Git stash unless Pete names one and explicitly requests an operation.
- Preserve unrelated worktree changes.
- Git history is the patch diary; do not rebuild session logs in this file.
