# POLYWORDS — DAILY CHALLENGE SPEC
### Polly's Daily Challenge · Approved June 2026

Full implementation source of truth for the Daily Challenge mode.
Do not implement anything not described here.
Standard Hunt rules are unchanged — see CLAUDE.md.

---

## Overview

A curated 5-round daily puzzle. Same puzzle for every player, seeded by date.
One attempt per day. No replays.
Player-facing name: **Polly's Daily Challenge**.

---

## Session

- 5 rounds per day
- Tier curve: `[1, 1, 2, 2, 3]`
- Seeded by date — deterministic, same for all players
- One attempt per day, no replays
- Engine: `app/game/dailyChallengeEngine.ts`
- Word pool: `app/game/dailyPool.ts`

---

## Lives — Word Senses

- 2 Word Senses per session (not Hunt feathers)
- Wrong swipe = lose 1 Word Sense AND trigger next clue reveal
- 0 Word Senses = session ends immediately, remaining rounds skipped
- No HAUNTED system in Daily — if session ends at 0 lives, result is HAUNTED title only
- Timed clue reveals do NOT spend Word Senses

---

## Candidate Board

- 6 cards per round
- 2-column grid layout
- All 6 are curated near-misses from the word's own `candidates` array
- No random pool padding — every card must be a plausible answer
- Swipe UP to claim (real meaning)
- Swipe RIGHT to reject (trap / wrong word)
- No taps anywhere — swipe only

---

## Clue Reveal — Sequential

Three clues per round. Revealed one at a time.

| Clue | Unlocks |
|---|---|
| Clue 1 | Visible immediately on round load |
| Clue 2 | After 4 seconds OR first wrong swipe — whichever comes first |
| Clue 3 | After 8 seconds OR second wrong swipe — whichever comes first |

- Locked clues show placeholder bar rows + a timing tag ("AFTER 4s", "AFTER 8s")
- Player can see that more clues are coming
- Timed unlocks do NOT cost Word Senses
- Wrong swipe unlocks next clue AND costs 1 Word Sense
- If both Word Senses are lost: all clues become visible, session ends

---

## Round Transition

Between rounds after a correct claim:

1. Correct card holds gold border — 800ms
2. Meanings zone wipes up and fades out
3. `ROUND X OF 5` stamp appears center screen — 600ms
4. New meanings fade in

Total target: ~1.8s

---

## Result Titles

| Title | Condition | Presentation |
|---|---|---|
| WORD MASTER | 5/5 solved, lives remaining | Gold, large, full entrance ceremony |
| SHARP | 4/5 solved | White, clean, no ceremony |
| SURVIVED | 2–3/5 solved | Muted, small |
| HAUNTED | 0–1/5 solved OR 0 lives hit mid-session | Deep purple, slow bleed in, no celebration |

---

## Share Text — Story Format

Share text surfaces how the player played, not just the score.

Format example:Got STREAM from 1 clue. Burned a sense on PITCH. 5/5.

WORD MASTER · POLYWORDS Daily #142

polywords.appRules:
- Name the word that cost a sense (if any)
- Name words solved from clue 1 alone if notable
- End with score fraction and title
- Never just a stat line

---

## Gold Feather Reward

Awarded at end of session if player completed all 5 rounds with at least 1 Word Sense remaining.

| Condition | Feather |
|---|---|
| Completed 5 rounds, lives > 0 | Earned |
| HAUNTED (0 lives, session ended early) | Not earned |

### Feather rules
- One feather max — cannot stack
- One day only — expires at midnight
- If player already holds a feather, today's win does not add a second
- Feather persists in Zustand store with a date stamp

### Feather visibility
- Results screen: feather shown as prize reveal if earned
- Hunt HUD: feather visible as a spendable slot when held

### Feather spend
- Player activates manually at any point during a Hunt
- Burns to respawn the last tile that exited (the one that cost the life)
- One-time use — gone after spent
- Spend is the player's choice — no auto-activation

### Store implications
- Zustand slice needs: `featherHeld: boolean`, `featherDate: string | null`
- Expiry check: on Daily load and on Hunt load, compare `featherDate` to today's date string
- If `featherDate !== today` → clear feather

---

## What Daily Does NOT Change

- Standard Hunt: always 10 rounds, boss always Round 10
- Hunt feathers (lives): 5 per hunt, unchanged
- Swipe grammar: UP = real, RIGHT = trap — same as Hunt
- HAUNTED / Ghost system: Hunt-only, not in Daily
- MASTERED / boss mystery tile: Hunt-only
- Polly's Word / boss word: Hunt-only
- No left swipe, no taps — applies everywhere

---

## Key Files

| File | Role |
|---|---|
| `app/screens/DailyChallengeScreen.tsx` | UI, swipe interaction, clue reveal, round transition |
| `app/game/dailyChallengeEngine.ts` | Session builder, correct/wrong swipe handlers, result builder |
| `app/game/dailyPool.ts` | Tiered word pool with curated candidates |
| `app/store/useGameStore.ts` | Daily state slice + Gold Feather state |
| `assets/images/feather-gold-reward.png` | Gold Feather prize asset (exists, unused) |

---

*DAILY_CHALLENGE_SPEC.md · Pete DiBari · June 2026*
