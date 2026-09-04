# POLYWORDS Game Reference

This file owns durable Hunt rules. Live code remains authoritative for implementation detail.

## Hunt

- Standard arc: 10 rounds. First three fledgling runs: 8 rounds.
- Polly's Word is always final. A Returning Haunt may occupy round 5 standard / round 4
  fledgling and remains a normal round presentation.
- Six starting feathers; zero ends the run. Up to five visible masks appear per word.
- UP claims a REAL; RIGHT rejects a trap. Wrong choices cost one feather, reset the chain,
  and preserve the chosen mask ID/direction in results.
- Mastered words return to ordinary tension/panic play as marked revisits. They are excluded from
  the Boss slot and Returning Haunt reservation, so mastery changes their status without deleting
  their visible REAL meanings. `RUN IT BACK` creates a fresh arc with ghost priority.
- `huntGenerator.ts` builds the arc from `assets/data/huntData.json` and marks ordinary mastered
  revisits with `isMasteredReturn`.

Economy target: roughly 54% survive and 25% master, with deaths concentrated late. This
depends on genuinely difficult but fair boss-hidden content; it is a simulation target, not
measured player data.

## Polly's Word and Haunts

- Surviving visible boss tiles opens three face-down hidden-gauntlet cards.
- The player chooses a card, opens it, then judges it with UP/RIGHT. Opened cards cannot be
  put back.
- All three hidden tiles correct = MASTERED. One hidden mistake or boss death = HAUNTED.
- Visible mistakes do not block the gauntlet; they only affect `bossFlawless`.
- A Returning Haunt re-tests the exact hidden pair that previously won. Success banishes it from
  the active ghost queue; failure keeps it queued. Banished Haunts are currently not persisted as
  a separate Vault collection item. Ordinary missed meanings are not Haunts.
- `bossOutcome` is the authority for mastery/haunt. The Master Gate must not return.

## Scoring and Rank

| Action | Base points |
| --- | ---: |
| REAL | 100 (rare REAL: 300 — no live content currently carries `isRare`, tier unreachable) |
| Trap rejected | 50 |
| Boss REAL / trap | 2× normal / 100 |
| Full hidden gauntlet clear | 600 once |
| Wrong choice | 0 |

The chain starts at 1×, rises by 0.5× every three consecutive correct choices, caps at 3×,
and resets on error. Current ranks: D 0, C 3,000, B 6,000, A 9,000, S 11,500, MASTER 14,000.
The ladder is an absolute per-run skill axis; it does not represent long-term Vault progress.
It was retuned against the corpus as of 2026-08-24; the corpus has grown since then
(`npm run state`) and the ladder has not been re-verified against that —
a run only ever draws one boss word, so the ceiling is unlikely to have moved, but this is
unverified, not confirmed unaffected.

Score milestones at 3,000 and 10,000 celebrate but do not award feathers.

## Gold Feather and Results

- Winning Daily awards one dated Gold Feather. It expires by date and cannot stack.
- From Hunt game-over Results, it revives the same run with one feather, preserves committed
  choices, resets `bossOutcome` to pending, and is consumed once.
- Fatal wrong choices finalize the current word result before game-over.

Locked system text includes `YOU BEAT POLLY`, `POLLY HUNT COMPLETE`, and
`POLLY CLIPPED YOUR RUN.`. `BINGO BANGO ZZZZINGO!` is unassigned and must not be reintroduced
into mastery without approval. `Thought so.` is not locked system text — it is one example
from `WRONG_HECKLE_LINES`, a pool `resolveVisit` now picks from on each wrong swipe
(see `docs/POLLY_DIALOGUE_BANK.md`).

## Presentation

- Hierarchy: hero word, active mask, Polybook, HUD, Polly visit.
- Ordinary masks stay neutral before commitment.
- The in-round book is **POLYBOOK**; the separate archive is **WORD VAULT**.
- Vault is player-owned and Polly-free.

## Owners

- Screen/presentation: `app/screens/GameScreen.tsx`, `app/components/MaskBoard.tsx`
- Gestures: `app/components/SwipeMask.tsx`
- Rules/arc: `app/game/polyRunEngine.ts`, `app/game/huntGenerator.ts`
- State: `app/store/useGameStore.ts`
- Results/Vault: `app/screens/ResultsScreen.tsx`, `app/screens/VaultScreen.tsx`
