# POLYWORDS Daily Challenge

Daily is a deterministic, one-attempt-per-date, five-round mode separate from Hunt.

> **Content status:** The canonical source is the locked workbook at
> `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx`; `STAGE` is included and
> `SENTENCE` is excluded. `app/game/dailyPool.ts` is the approved runtime representation.
> Each source row has three clues, nine unique approved candidates, and tier 1–3. A round
> deterministically presents the target plus five of those distractors: six candidates total.
> `npm run state` prints the live pool size.

## Session

- Opening Daily does not spend the attempt; `BEGIN DAILY` does.
- Five rounds use tiers `[1, 1, 2, 2, 3]` with two lives for the whole challenge.
- Each round shows six candidates; one word connects all three clues.
- The same date produces the same session. Solve all five before losing both lives to win.

## Input and Clues

- Daily is UP-only. Press/hold lifts a card; a deliberate UP swipe commits it. Releasing below
  threshold returns it. There is no RIGHT, left, or tap-submit path.
- All candidate cards remain neutral before commitment.
- Clue 1 is immediate; clues 2 and 3 appear at 4s and 8s or after wrong claims. Timed reveals
  do not cost lives.
- Wrong claim: costs one life, disables that candidate, reveals the next clue, and returns
  input after the wrong-card exit.

## Castle and Correct-Claim Sequence

The whole Daily screen is a castle: towers and an arch at the top, the gate in the arch
carrying the clues, and the six answer blocks set in a framed wall below. The same castle,
gate shut and blank, stands behind the entry card and Results.

- The gate is a cartoon indigo plank door with two iron straps. Clues are painted on it, one
  per plank, and move with it. Dark seams mark every plank;
  clues are capped at 20 pt and split into two even lines so three clues read as three.
- Answer blocks (Pete, 2026-09-27) sit flush in the wall like bricks, marked only by a gold
  outline that is their mortar. Tapped, a block pops out and its 3D top shows; pulled out,
  it leaves a dark recess with black edges (a wrong block leaves it too). Each new round's
  blocks slide into the recesses and come flush. On entry and Results the wall shows six
  blank flush blocks.
- The moment a correct claim is confirmed, the castle lights gold: both tower caps (and the
  rest of the gold trim) go crown gold with a glow swelling behind each cap, then fade, all
  within 0.7 s and before the next round's gate comes down (Pete, device-approved
  2026-09-29). Under reduce motion or reduce flashes the gold is just as strong but comes up
  more gently, with no swelling.
- A correct UP claim throws the plaque at the castle while the gate lifts.
- The plaque passes into the arch, goes in behind the gate line and flies off down the tunnel.
- The gate comes back down carrying the next round's clues while a white-feather coin rises
  out of the courtyard floor. Coins stay down for the rest of the challenge, up to four in a
  row. The next blocks fill the recesses.
- Input stays locked from the claim until the gate is down. Stale and double claims are
  rejected throughout.

The final round runs the same sequence, castle gold hit included, except its gate comes down
blank, so the old clue never flashes. As it comes down the four white coins sink and one
bigger gold-feather coin rises.

The gold-coin finale (LOCKED, Pete, device-approved 2026-09-29) follows:

1. The gold coin rests on the floor for a moment, then leaves it.
2. It flies toward the player, growing and turning until its face points at the camera. The
   rest of the screen dims to 42%, so the coin reads as a foreground reward.
3. It reaches hero size with one small overshoot and settles. The reward chime and the
   Success haptic land on its arrival, not on the floor rise.
4. One glint crosses the coin, it holds, then it fades.
5. Only then do the Results come up.

The finale never overlaps the castle's gold hit: the coin leaves the floor only after the hit
is over. Once it has left the floor, the small floor coin stays hidden through the fade and
behind Results. Reopening an already-won Daily still shows the gold coin on the floor as the
mark of a completed challenge.

Under reduce motion there is no flight, zoom, turn or overshoot: the floor coin crossfades
into the hero coin in place, which holds and fades the same way. Under reduce flashes the
glint is left out; the gold and its glow stay.

## Reward, Results, and Streak

- A win awards one dated Gold Feather; it cannot stack and expires when its date is no longer
  today. Hunt game-over Results can consume it once for an in-place one-feather revive.
- Results report clue speed without exposing future answers.
- Completing Daily—win or lose—advances the play streak. Missing a calendar day resets it.
- Polly perches on the left tower under the HUD. Her speech bubble sits on the steps below
  the gate so it never covers a clue; after a correct claim it waits until the thrown block is
  down the tunnel. She must never obstruct the clues, the blocks, or the UP lane.
- Correct-claim reactions read the existing Hunt rivalry state through `resolveRivalryState`
  and choose from the Daily mood pool. Daily never writes that rivalry state. Session-level
  miss/win/loss lines remain separate fixed beats.

## Owners

- Editorial standard: `docs/DAILY_CONTENT_WRITING_STANDARD.md`
- Authoring source: `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx`
- UI/motion: `app/screens/DailyChallengeScreen.tsx`, `app/components/DailyCastleStage.tsx`,
  `app/components/DailyGate.tsx`, `app/components/DailyAnswerCard.tsx`
- Castle geometry: `app/ui/dailyCastleScene.ts`
- Gameplay rules: `app/game/dailyChallengeEngine.ts`
- Runtime content: `app/game/dailyPool.ts`
- State/streak: `app/store/useGameStore.ts`, `app/game/dailyStreak.ts`
