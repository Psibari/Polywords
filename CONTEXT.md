# POLYWORDS Current Context

Updated August 26, 2026. Branch: `play-screen-overhaul`, tracking
`origin/play-screen-overhaul`. Current code baseline: `5ebab24`.

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

## Protection

- Preserve every Git stash unless Pete names one and explicitly requests an operation.
- Preserve unrelated worktree changes.
- Git history is the patch diary; do not rebuild session logs in this file.
