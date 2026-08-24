# POLYWORDS Daily Challenge

Daily is a deterministic, one-attempt-per-date, five-round mode separate from Hunt.

> **Content status:** `app/game/dailyPool.ts` is a 54-entry development placeholder. It is
> not approved or release-ready. Leave it unchanged until a new Daily pool is written; before
> release, replace it or disable Daily. Hunt content is not an automatic substitute.

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

- UI/motion: `app/screens/DailyChallengeScreen.tsx`, `app/components/DailyAnswerCard.tsx`,
  `app/components/ui/QuillScrollPanel.tsx`
- Rules/content: `app/game/dailyChallengeEngine.ts`, `app/game/dailyPool.ts`
- State/streak: `app/store/useGameStore.ts`, `app/game/dailyStreak.ts`
