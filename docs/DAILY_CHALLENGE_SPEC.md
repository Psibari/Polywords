# POLYWORDS — DAILY CHALLENGE SPEC
### Polly's Daily Challenge · Approved June 2026

Full implementation source of truth for the Daily Challenge mode.
Do not implement anything not described here.
Standard Hunt rules are unchanged — see `CLAUDE.md`.

Daily is currently documentation-only. Existing coded Daily files are stale, unapproved scaffold and must remain quarantined until an approved implementation patch.

---

## Title and Promise

Player-facing title:

**POLLY'S DAILY CHALLENGE**

Player-facing promise:

**ONE word · FIVE rounds · TWO chances · ONE gold feather**

---

## Overview

A curated five-round daily puzzle. The same puzzle is presented to every player, seeded by date.
One attempt per day. No replays.

The player studies the visible clues and claims the single candidate word that represents them all.

---

## Session

- 5 rounds per day
- Tier curve: `[1, 1, 2, 2, 3]`
- Seeded by date — deterministic, same for all players
- One attempt per day, no replays
- 2 Chances for the full challenge
- Win by solving all 5 rounds before losing both Chances
- Engine target: `app/game/dailyChallengeEngine.ts`
- Word pool target: `app/game/dailyPool.ts`

---

## Daily Control Rule — UP Only

Daily does not use Hunt's reject action.

- Player swipes UP on the word they believe represents all visible clues.
- There is no RIGHT swipe in Daily.
- There are no taps.
- A correct UP claim completes the round.
- A wrong UP claim costs 1 Chance and reveals the next clue.
- Timed clue reveals do not cost Chances.
- Losing the second Chance ends the Daily immediately.

This UP-only rule is specific to Daily. Standard Hunt swipe grammar remains unchanged.

---

## Approved Layout Labels

### Zone 3

**ONE REPRESENTS ALL**

This label frames the six candidate words as one semantic choice across all visible clues.

### Zone 4

**SWIPE UP TO CLAIM**

This is the only Daily action instruction.

---

## Candidate Board

- 6 cards per round
- 2-column grid
- All 6 are curated near-misses from the word's own `candidates` array
- No random pool padding — every card must be a plausible answer
- One candidate represents all visible clues
- Player claims a candidate with an intentional UP swipe

---

## Daily Answer Tile Visual Direction

Daily answer tiles are gold-rimmed dark-purple word relic cards.

- Outer gradient frame: `#F5C842` to `#9B2D6B`
- Inner face: `#1A1830`
- Centered uppercase word
- Compact mobile card shape
- Premium rounded corners
- Soft shadow and physical depth
- Interaction glow for press, drag, correct, and wrong states
- No hover behavior
- No web CSS implementation details

All six cards share the same neutral resting treatment. The tile must not reveal correctness before commitment.

---

## Press-and-Hold and Swipe Feel

Daily answer tiles use the same press-and-hold feel and swipe confidence as regular gameplay where practical.

- Press and hold wakes the tile.
- The player gets grip and control before swiping.
- Releasing without enough movement returns the tile home.
- An intentional UP swipe claims the word.
- Use the same general control feel and confidence threshold as regular gameplay where practical.
- A correct claim completes its physical journey into the three-clue vault: the chosen tile
  accelerates upward, shrinks into the clue panel, resolves as a brief gold answer stamp, and
  triggers one contained vault-impact pulse before the next round enters.
- A wrong claim recoils and drops out of the candidate board. It does not snap home or remain
  as a disabled gray card.
- Daily remains UP-only even when borrowing the regular gameplay feel.
- Do not change `SwipeMask.tsx` as part of the Daily docs lock.

---

## Clue Reveal — Sequential

Three clues are available per round and reveal one at a time.

| Clue | Unlocks |
|---|---|
| Clue 1 | Visible immediately on round load |
| Clue 2 | After 4 seconds OR first wrong UP claim — whichever comes first |
| Clue 3 | After 8 seconds OR next wrong UP claim — whichever comes first |

- Locked clues show placeholder bar rows and a timing tag: `AFTER 4s` or `AFTER 8s`.
- The player can see that more clues are coming.
- Timed unlocks do not cost Chances.
- A wrong UP claim unlocks the next clue and costs 1 Chance.
- Losing both Chances reveals the loss result and ends the session immediately.

---

## Polly — Persistent Daily Opponent

Polly is perched on screen for the entire Daily Challenge.

- Polly is mostly silent.
- Polly only reacts when the player loses a Chance, loses the challenge, or wins the challenge.
- Polly must not obstruct clues, answer tiles, or the UP claim lane.

### First lost Chance

- Polly uses a happy/smug pose.
- Polly says: **“Sharp as a butter knife.”**

### Second lost Chance

- Daily ends immediately.
- Result: **YOU LOSE**
- No HAUNTED language.
- Polly laughs.
- Polly says: **“CAN’T BEAT THAT WITH A BAT.”**

### Challenge win

- Result: **YOU BEAT POLLY’S CHALLENGE**
- Gold Feather is awarded.
- No WORD MASTER language.
- Polly gives the feather with annoyed/shocked energy.
- Polly says: **“WON’T HAPPEN TOMORROW.”**

---

## Round Transition

Between rounds after a correct claim:

1. The claimed tile follows the UP gesture into the clue vault and collapses into it.
2. The answer appears briefly as a gold stamp while the clue vault gives one impact pulse.
3. The current vault exits left.
4. The next vault and candidate board enter.

The intake is the signature beat. Do not replace it with a stationary gold glow or immediate
round swap.

---

## Results Language

Do not use `WORD MASTER`, `SHARP`, `SURVIVED`, or `HAUNTED` in Daily results.

### Win

**YOU BEAT POLLY’S CHALLENGE**

**GOLD FEATHER EARNED**

Polly: **“WON’T HAPPEN TOMORROW.”**

### Loss

**YOU LOSE**

**NO FEATHER TODAY**

Polly: **“CAN’T BEAT THAT WITH A BAT.”**

---

## Share Text — Story Format

Share text surfaces how the player played, not just the score.

Example:

```text
Got STREAM from 1 clue. Burned a chance on PITCH. 5/5.

YOU BEAT POLLY'S CHALLENGE · POLYWORDS Daily #142

polywords.app
```

Rules:

- Name the word that cost a Chance, if any.
- Name words solved from Clue 1 alone when notable.
- End with the score fraction and the Daily win/loss result.
- Never use the removed graded result titles.
- Never publish only a stat line.

---

## Gold Feather Reward

The Gold Feather is awarded when the player wins the Daily by completing all 5 rounds before losing both Chances.

| Condition | Feather |
|---|---|
| Daily won | Earned |
| Second Chance lost before completion | Not earned |

### Feather rules

- One feather maximum — cannot stack
- One day only — expires at midnight
- If the player already holds a feather, today's win does not add a second
- Feather persists in Zustand store with a date stamp

### Feather visibility

- Results screen: feather shown as the win prize reveal
- Hunt HUD: feather visible as a spendable slot when held

### Feather spend

- Player activates it manually at any point during a Hunt
- Burns to respawn the last tile that exited and cost a life
- One-time use — gone after spending
- Spend is the player's choice — no auto-activation

### Store implications

- Zustand slice needs: `featherHeld: boolean`, `featherDate: string | null`
- On Daily load and Hunt load, compare `featherDate` with today's date string
- If `featherDate !== today`, clear the feather

---

## What Daily Does NOT Change

- Standard Hunt remains 10 rounds with the boss at Round 10.
- Hunt feathers remain 5 per Hunt.
- Hunt swipe grammar remains UP = real and RIGHT = trap.
- Daily alone is UP-only and has no reject gesture.
- HAUNTED and Ghost systems remain Hunt-only.
- MASTERED and the boss mystery tile remain Hunt-only.
- Polly's Word remains Hunt-only.
- No left swipe and no taps apply everywhere.

---

## Key Files

These are future implementation targets only. Their current coded versions are stale, unapproved scaffold.

| File | Intended role |
|---|---|
| `app/screens/DailyChallengeScreen.tsx` | UI, UP-only interaction, clue reveal, Polly, and transitions |
| `app/game/dailyChallengeEngine.ts` | Session builder, claim handling, and result builder |
| `app/game/dailyPool.ts` | Tiered word pool with curated candidates |
| `app/store/useGameStore.ts` | Daily state slice and Gold Feather state |
| `assets/images/feather-gold-reward.png` | Gold Feather prize asset |

---

*DAILY_CHALLENGE_SPEC.md · Pete DiBari · June 2026*
