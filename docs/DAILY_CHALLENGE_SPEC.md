# POLYWORDS Daily Challenge

Daily is a deterministic, one-attempt-per-date, five-round mode separate from Hunt.

> **Content status:** The canonical source is the 43-word locked workbook at
> `workbooks/POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx`; `STAGE` is included and
> `SENTENCE` is excluded. `app/game/dailyPool.ts` is the approved runtime representation.
> Each source row has three clues, nine unique approved candidates, and tier 1–3. A round
> deterministically presents the target plus five of those distractors: six candidates total.

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

## Correct-Claim Scroll Sequence

1. Keep the submitted card continuous from the swipe and settle it on the clue parchment.
2. Hold briefly with clue and card readable.
3. Roll reward paper down from the fixed ornate rod; a matching moving rod stays attached to
   its lower edge and physically covers clue and card.
4. Show the existing feather/crown reward on that paper.
5. While fully covered, render the next clue underneath.
6. Roll the reward paper and moving rod upward to reveal only the next clue.
7. Re-enable input after stable reveal. Lock input and reject stale/double claims throughout.

The final round must complete the same reward/reveal sequence without flashing the old clue
before Results.

## Reward, Results, and Streak

- A win awards one dated Gold Feather; it cannot stack and expires when its date is no longer
  today. Hunt game-over Results can consume it once for an in-place one-feather revive.
- Results report clue speed without exposing future answers.
- Completing Daily—win or lose—advances the play streak. Missing a calendar day resets it.
- Polly may react to a lost Chance or final result but must not obstruct clue, cards, or UP lane.

## Owners

- Editorial standard: `docs/DAILY_CONTENT_WRITING_STANDARD.md`
- Authoring source: `workbooks/POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx`
- UI/motion: `app/screens/DailyChallengeScreen.tsx`, `app/components/DailyAnswerCard.tsx`,
  `app/components/ui/QuillScrollPanel.tsx`
- Gameplay rules: `app/game/dailyChallengeEngine.ts`
- Runtime content: `app/game/dailyPool.ts`
- State/streak: `app/store/useGameStore.ts`, `app/game/dailyStreak.ts`
