# POLYWORDS Current Context

Updated August 25, 2026. Branch: `play-screen-overhaul`, tracking
`origin/play-screen-overhaul`. Current code baseline: `4e6294d`.

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
- Live Polly uses pose images. The layered rig remains dormant.
- Local playtest telemetry is available through Settings and is never networked.

## REWARD ECONOMY

- Rank comes off the Vault; meanings taken is the headline. APPROVED.
- Books equal words, finished when all of that word's visible REALs are found. APPROVED. No
  perfect-clear tier — a round shows only about 2.54 of a word's 4.61 REALs, so a flawless
  clear certifies the tiles dealt, not the word.
- Roughly every fifth new word should carry `hiddenPairs`. APPROVED. This is the only fix for
  the mastery ceiling.
- Rank thresholds UNRULED: go relative (grade each run against the maximum that run could have
  produced), retune the absolute numbers, or cut the ladder. Relative is recommended because
  absolute thresholds drift on every content ship.

## Approved Daily Content

`workbooks/POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx` is the canonical source for
43 approved locked words; `STAGE` is included and `SENTENCE` is excluded.
`app/game/dailyPool.ts` is the runtime representation. Each source word has three clues, nine
unique approved candidates, and tier 1–3; each round deterministically presents the target plus
five distractors.

## Next Work

1. Continue real-device iOS/Android journey checks before release.
2. Implement the mastered-word return in `huntGenerator.ts`. Mastered words stay out of
  `bossPool` and out of the Returning Haunt reservation, are mixed INTO the tension and panic
  pools (not appended as a fallback tier — `next()` walks pools in order and tension never
  exhausts against a three-word draw), are excluded from the boss slot's `hasBossContent`
  fallback chain, and carry a flag on the step marking the round as a return. Guard it in
  `huntDeterminism.test.ts`: a mastered word must never be the boss, never be the haunt, and
  must be reachable as an ordinary round. Card treatment and Polly's reaction lines are a
  separate later task.
3. The three sealed boss-gauntlet cards in `BossGauntletSpines.tsx` are placeholder art by
  their own comment. Pete's direction is stone blocks pushing out of the wall with a crown,
  replacing the `rotateY` flip with a push-forward motion. Not yet specified.

## Protection

- Preserve every Git stash unless Pete names one and explicitly requests an operation.
- Preserve unrelated worktree changes.
- Git history is the patch diary; do not rebuild session logs in this file.
