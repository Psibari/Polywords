# POLYWORDS Game Reference

## App Model

POLYWORDS is a recognition game about familiar words with multiple meanings. Polly sets
the traps; the player reclaims meanings. Home is the lobby, Play the arena, Vault the
player archive, and Settings the utility/profile surface.

## Hunt

- 10 rounds and 5 starting feathers.
- Round 10/index 9 is Polly’s Word (`eventType: 'bossWord'`).
- Round 8/index 7 may host a Returning Haunt as a standard event with
  `isHauntReturn: true`; it never receives boss presentation.
- Only boss words can become HAUNTED. Mastered words leave the standard pool.
- RUN IT BACK builds a fresh Hunt with ghost priority.
- UP claims a REAL; RIGHT rejects a trap. No left swipe or tap-submit.
- Wrong swipes are permanent, cost a feather, and reset the chain.

`app/game/huntGenerator.ts` builds the arc from `assets/data/huntData.json`. Daily is a
separate mode.

## Boss and Haunts

The player-facing name is Polly’s Word; keep internal `bossWord` identifiers unless a
migration is explicitly approved.

- Boss visible tiles lead to one mystery tile.
- Correct mystery resolution masters the word.
- Boss failure or wrong mystery resolution haunts the word once.
- Returning Haunt clear: BANISHED / HAUNT BROKEN and remove it from the queue.
- Returning Haunt failure: STILL HAUNTED and retain/rotate it.
- Ordinary missed meanings are not called Haunts.
- The Master Gate is removed; do not restore its UI or logic.

## Scoring

| Action | Points |
| --- | ---: |
| REAL UP | 100 × chain |
| Rare REAL UP | 300 × chain |
| Trap RIGHT | 50 × chain |
| Boss REAL | 200 × chain |
| Boss trap | 100 × chain |
| Boss mystery | 600 × chain |
| Wrong swipe | 0 |

The chain starts at 1.0, increases by 0.5 every three correct swipes, caps at 3.0,
and resets on error. Polly’s score target is 15,000. Ranks are D under 8k, C at 8k,
B at 11k, A at 14k, S at 18k, and MASTER at 22k.

## Feathers and Results

- Hunt starts with 5 feathers; a wrong swipe removes 1; zero ends the run.
- Score milestones at 8,000 and 16,000 restore one feather, subject to engine limits.
- Daily can award one dated Gold Feather. Hunt spending is currently quarantined.
- Results must preserve mask ID and UP/RIGHT direction for wrong swipes.
- Fatal wrong swipes finalize the current word result before game-over.

Locked text includes `YOU BEAT POLLY`, `POLLY HUNT COMPLETE`,
`POLLY CLIPPED YOUR RUN.`, `Thought so.`, and `BINGO BANGO ZZZZINGO!`.

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
