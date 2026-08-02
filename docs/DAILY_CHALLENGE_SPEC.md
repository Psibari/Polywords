# POLYWORDS Daily Challenge

Daily is a deterministic, one-attempt-per-day mode separate from Hunt.

Opening the Daily screen does not spend the attempt. The attempt is recorded only after
the player confirms `BEGIN DAILY`, after seeing the five-word, two-Chance stakes.

## Session

- Five rounds with tier curve `[1, 1, 2, 2, 3]`.
- Same date-seeded puzzle for every player.
- Two Chances for the full challenge.
- Six curated near-miss candidate words per round.
- One candidate connects all three clues.
- Win by solving all five rounds before the second lost Chance.

## Control

Daily is UP-only. Press and hold wakes a card; a deliberate UP swipe claims it. Releasing
below threshold returns it home. There is no RIGHT action, left swipe, or tap-submit.

- Correct claim: card travels into the clue vault, resolves as a gold answer stamp, then
  advances the round.
- Wrong claim: costs one Chance, reveals the next clue, recoils, and drops away.
- All cards use one neutral treatment before commitment.
- Daily must never change Hunt’s `SwipeMask.tsx` gesture behavior.

Labels: `ONE REPRESENTS ALL` and `SWIPE UP TO CLAIM`.

## Clues

- Clue 1 is immediate.
- Clue 2 appears after 4 seconds or the first wrong claim.
- Clue 3 appears after 8 seconds or the next wrong claim.
- Timed reveals do not cost Chances.
- Each new clue receives centered emphasis, then joins the persistent revealed group.

## Polly and Results

Polly stays perched without obstructing clues, cards, or the UP lane. She reacts only to a
lost Chance or the final result.

- First lost Chance: `Sharp as a butter knife.`
- Win: `YOU BEAT POLLY'S CHALLENGE`, `GOLD FEATHER EARNED`,
  `WON'T HAPPEN TOMORROW.`
- Loss: `YOU LOSE`, `NO FEATHER TODAY`, `CAN'T BEAT THAT WITH A BAT.`

Results show each round’s clue speed (1/2/3 clues or missed), with an accessible unknown
fallback for older persisted results. Share copy tells the short play story without exposing
future answers.

## Gold Feather

A win awards one dated Gold Feather. It cannot stack and expires when its stored date no
longer matches today. Hunt can consume it once from game-over Results to revive the same
run in place with one feather.

## Owners

- UI: `app/screens/DailyChallengeScreen.tsx`, `app/components/ui/QuillScrollPanel.tsx`
- Rules: `app/game/dailyChallengeEngine.ts`, `app/game/dailyPool.ts`
- State: `app/store/useGameStore.ts`
- Materials/copy: `app/ui/pwDailyMaterials.ts`, `app/game/pollyCharacter.ts`
