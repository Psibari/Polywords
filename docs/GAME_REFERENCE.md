# POLYWORDS Game Reference

## App Model

POLYWORDS is a recognition game about familiar words with multiple meanings. Polly sets
the traps; the player reclaims meanings. Home is the lobby, Play the arena, Vault the
player archive, and Settings the utility/profile surface.

## Hunt

- 10 rounds and 6 starting feathers (economy lock, 2026-07-22).
- Fledgling runs (first 3, `runsCompleted < 3`) use an 8-round arc with the boss at
  index 7 instead of 9.
- Up to 5 masks are shown per word (`VISIBLE_MASK_CAP`); unshown masks resurface in
  other runs rather than being wasted.
- Round 10/index 9 is Polly’s Word (`eventType: 'bossWord'`).
- Round 8/index 7 may host a Returning Haunt as a standard event with
  `isHauntReturn: true`; it never receives boss presentation.
- Only boss words can become HAUNTED. Mastered words leave the standard pool.
- RUN IT BACK builds a fresh Hunt with ghost priority.
- UP claims a REAL; RIGHT rejects a trap. No left swipe or tap-submit.
- Wrong swipes are permanent, cost a feather, and reset the chain.

`app/game/huntGenerator.ts` builds the arc from `assets/data/huntData.json`. Daily is a
separate mode.

Design targets (60k-run simulation, locked 2026-07-22): ~54% of runs survive, ~25% master
Polly's Word (a trophy, not an expectation), and deaths cluster late — 0% in
Confidence/Flow, rising through Tension/Panic, over half in the boss phase. Never a
round-3 rug-pull. Holds only if boss hidden content is genuinely hard (~1-in-4 miss rate
for a decent player) — an easy boss cheapens the mastery trophy by inflating the rate.

## Boss and Haunts

The player-facing name is Polly’s Word; keep internal `bossWord` identifiers unless a
migration is explicitly approved.

- Surviving the visible boss tiles unlocks a 3-tile hidden gauntlet (Route C): one
  tile per hidden meaning/trap pair, each judged UP/RIGHT independently. A visible
  mistake does not block the gauntlet from unlocking.
- **Pick Your Trap** (shipped 2026-08-01): all three gauntlet tiles arrive together as
  closed spines and the player picks which one to face and in what order — tapping a
  spine opens it (reveal), then a separate later swipe judges it; once a spine is
  opened it cannot be closed back up unpicked. Order is purely a player choice and does
  not change the per-tile odds — the judgment math below is unaffected.
- All three gauntlet tiles correct masters the word, regardless of visible mistakes.
- One wrong gauntlet tile ends the boss attempt immediately and haunts the word once.
- Returning Haunt re-tests the exact pair that beat the player last run.
- Returning Haunt clear: BANISHED / HAUNT BROKEN and remove it from the queue.
- Returning Haunt failure: STILL HAUNTED and retain/rotate it.
- Ordinary missed meanings are not called Haunts.
- The Master Gate is removed; do not restore its UI or logic.

## Scoring

| Action | Points |
| --- | ---: |
| REAL UP | 100 × chain |
| Trap RIGHT | 50 × chain |
| Boss REAL | 200 × chain |
| Boss trap | 100 × chain |
| Boss mystery | 600 × chain |
| Wrong swipe | 0 |

The chain starts at 1.0, increases by 0.5 every three correct swipes, caps at 3.0,
and resets on error. Polly’s score target is 15,000. Ranks are D below 3,000, C at
3,000, B at 6,000, A at 10,000, S at 15,000, and MASTER at 19,500. Boss mystery is
awarded once, on clearing the full 3-tile hidden gauntlet — not per tile.

## Feathers and Results

- Hunt starts with 6 feathers; a wrong swipe removes 1; zero ends the run.
- Score milestones at 3,000 and 10,000 trigger a celebration beat only — they no
  longer grant a feather (economy lock, 2026-07-22; the old score→life net was
  regressive, reaching only players who were already winning).
- Daily can award one dated Gold Feather. In Hunt, it revives a failed run in place
  with one feather, preserves committed swipes, and consumes the dated reward once.
- Results must preserve mask ID and UP/RIGHT direction for wrong swipes.
- Fatal wrong swipes finalize the current word result before game-over.

Locked text includes `YOU BEAT POLLY`, `POLLY HUNT COMPLETE`,
`POLLY CLIPPED YOUR RUN.`, and `Thought so.`. `BINGO BANGO ZZZZINGO!` was unassigned from
the mastery sequence by Pete on 2026-07-23 (see `CLAUDE.md`) — the line itself is still
locked text, but it is not currently placed anywhere; do not reintroduce it into mastery
without a new decision.

## Presentation

- Hierarchy: hero word, active tile, HeroBook target, HUD, Polly visit.
- Ordinary tiles use one neutral treatment before commitment.
- HeroBook is a bound book with a top hinge and label `POLLY'S VAULT`.
- Correct REAL UP uses a compact gold score badge; correct trap RIGHT uses rose;
  wrong swipes show no score badge.
- Vault is a Polly-free reclaimed archive. Use archive/collection language.

Polly visits are owned by GameScreen so MaskBoard remounts cannot kill them. Live Polly
uses `assets/images/polly/poses/*.png`, `usePollyVisits`, authored character copy, and
bounded local memory. Dialogue rules live in `docs/POLLY_DIALOGUE_BANK.md`.

## Content and Pacing

`docs/CONTENT_WRITING_STANDARD.md` exclusively governs tiles. The live Hunt arc is
2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss; placement rules live in
`docs/GOLDEN_PACING_SYSTEM.md`.

## Key Owners

- Arena: `app/screens/GameScreen.tsx`, `app/components/MaskBoard.tsx`
- Gestures: `app/components/SwipeMask.tsx`
- Rules: `app/game/polyRunEngine.ts`, `app/game/huntGenerator.ts`
- State: `app/store/useGameStore.ts`
- Vault: `app/screens/VaultScreen.tsx`, `app/components/ui/Bookcase.tsx`
- Feedback/audio: `app/components/FXLayer.tsx`, `app/audio/sfx.ts`
