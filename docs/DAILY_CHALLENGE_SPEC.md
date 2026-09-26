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
- Five rounds use tiers `[1, 1, 2, 2, 3]` with two Chances for the whole challenge.
- Each round shows six candidates; one word connects all three clues.
- The same date produces the same session. Solve all five before losing both Chances to win.

## Input and Clues

- Daily is UP-only. Press/hold lifts a card; a deliberate UP swipe commits it. Releasing below
  threshold returns it. There is no RIGHT, left, or tap-submit path.
- All candidate cards remain neutral before commitment.
- Clue 1 is immediate; clues 2 and 3 appear at 4s and 8s or after wrong claims. Timed reveals
  do not cost Chances.
- Wrong claim: costs one Chance, disables that candidate, reveals the next clue, and returns
  input after the wrong-card exit.

## Castle and Correct-Claim Sequence

The play screen is a castle: towers and an arch at the top, the gate in the arch carrying the
clues, and the six answer plaques set in the wall below.

- Clues are painted on the gate, one per plank, and move with it.
- A correct UP claim throws the plaque at the castle while the gate lifts.
- The plaque passes into the arch, goes in behind the gate line and flies off down the tunnel.
- The gate comes back down carrying the next round's clues while a white-feather coin rises
  out of the courtyard floor. Coins stay down for the rest of the challenge, up to four in a
  row. The next plaques come out of the wall.
- Input stays locked from the claim until the gate is down. Stale and double claims are
  rejected throughout.

The final round runs the same sequence, except its gate comes down blank, so the old clue
never flashes. As it comes down the four white coins sink and one bigger gold-feather coin
rises. The gold coin then gets its own presentation: a chime, the Success haptic, a gold glow
and a pop. It holds for a pause (1.6 s, or 1.0 s under reduce motion), and only then do the
Results come up.

## Reward, Results, and Streak

- A win awards one dated Gold Feather; it cannot stack and expires when its date is no longer
  today. Hunt game-over Results can consume it once for an in-place one-feather revive.
- Results report clue speed without exposing future answers.
- Completing Daily—win or lose—advances the play streak. Missing a calendar day resets it.
- Polly may react to a lost Chance or final result but must not obstruct clue, cards, or UP lane.

## Owners

- Editorial standard: `docs/DAILY_CONTENT_WRITING_STANDARD.md`
- Authoring source: `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx`
- UI/motion: `app/screens/DailyChallengeScreen.tsx`, `app/components/DailyCastleStage.tsx`,
  `app/components/DailyGate.tsx`, `app/components/DailyAnswerCard.tsx`
- Castle geometry: `app/ui/dailyCastleScene.ts`
- Gameplay rules: `app/game/dailyChallengeEngine.ts`
- Runtime content: `app/game/dailyPool.ts`
- State/streak: `app/store/useGameStore.ts`, `app/game/dailyStreak.ts`
