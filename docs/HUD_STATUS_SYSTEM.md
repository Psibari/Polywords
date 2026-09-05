# Hunt HUD Status System

## Why We Changed

The old Hunt HUD showed a **score number** and a **rank letter** (like F, E, D, C, B, A, S).

The problem:
- The score was just a number going up. It did not tell the player how they were actually doing.
- The rank letter was confusing. Players did not know what it meant or how to improve it.
- The score and rank created a grinding feeling — playing for points instead of playing for the read.
- Polly is the opponent, not a spreadsheet. The HUD should feel like the Hunt, not a report card.

The new system replaces score and rank with **live emotional status**. The player sees how the Hunt is going in plain language, not numbers.

---

## What the HUD Shows Now

The HUD has **two text rows** and **feathers** (lives) on the right side.

### Row 1: Context (when applicable)

This row only appears during special moments. It tells the player what kind of word they are facing.

| Label | When it appears |
|-------|----------------|
| `RETURNING HAUNT` | A word that defeated the player in a previous Hunt has come back |
| `MASTERED RETURN` | A word the player already mastered is appearing again |
| `POLLY'S WORD` | The boss word (final word of the Hunt) has started |

When nothing special is happening, this row is empty.

### Row 2: Player Status (always visible)

This row tells the player how they are doing right now.

| Label | What it means | How to trigger it |
|-------|--------------|-------------------|
| `STEADY` | The Hunt just started or the player is at 0-2 correct in a row | streak 0-2 |
| `FLOW` | The player is building momentum | streak 3-5 |
| `IN CONTROL` | The player is reading Polly's pattern | streak 6+ |
| `HUNTED` | The player is down to 1 feather — the run is in danger | 1 life remaining (overrides everything) |

### Gauntlet

When the hidden gauntlet begins (after the boss word's visible tiles are done), the HUD shows:

```
POLLY'S WORD
GAUNTLET
```

---

## How the Streak Works

The streak counts consecutive correct answers (swiping up on a real meaning or swiping down on a trap).

The streak determines the **chain multiplier**, which is:

```
multiplier = 1 + floor(streak / 3) * 0.5
```

| Streak | Multiplier | HUD Status |
|--------|-----------|------------|
| 0-2 | 1.0 | STEADY |
| 3-5 | 1.5 | FLOW |
| 6+ | 2.0+ | IN CONTROL |

Any wrong answer (losing a feather) resets the streak to 0 and the multiplier to 1.0.

If the player has only 1 feather left, the status becomes `HUNTED` regardless of the streak.

---

## What the Old System Was

The old HUD showed:
- A **score number** that went up with every correct answer
- A **rank letter** based on the score
- Score milestones that sometimes granted extra feathers

The old Results screen showed:
- A final score
- A rank letter (F through S)
- A rank-up animation if the player improved

### What was removed
- The score number in the HUD
- The rank letter in the HUD
- Score milestone popups
- Rank-up animations on Results
- The score display on Results

### What stays
- The score is still calculated internally (for save compatibility and milestone effects)
- The Gold Feather reward system is unchanged
- The chain multiplier still affects music intensity and point values

---

## Results Card

When the Hunt ends, the Results card shows one of four outcomes:

| Outcome | What it means |
|---------|--------------|
| `MASTERED` | The player beat Polly's final word in the gauntlet |
| `CLOSE, BUT CLOSE DOESN'T COUNT.` | The player survived all rounds but did not master the final word |
| `HAUNTED` | A returning Haunt word defeated the player |
| `YOU WERE HUNTED` | Polly ended a normal Hunt run (the player ran out of lives) |

---

## Colors

The HUD uses no gold. Gold is reserved for earned rewards only.

| Element | Color |
|---------|-------|
| STEADY | White |
| FLOW | Lavender |
| IN CONTROL | Lavender (with haptic on change) |
| HUNTED | Rose |
| Context labels | Lavender |
| HUD border | Purple soft |
| Feathers | White/purple |

---

## Animation

When the HUD status changes:
- A subtle glow pulses behind the text (14% opacity, not a solid block)
- The text briefly scales up 8% then settles back
- A haptic fires for: Returning Haunt, Mastered Return, Polly's Word, Gauntlet, and reaching IN CONTROL
- Ordinary STEADY/FLOW changes are visual only (no haptic) so the status does not chatter

---

## Technical Details

The HUD logic lives in `app/game/huntControl.ts`:
- `resolveLiveHuntControl(chainMultiplier, lives)` — determines the base status
- `resolveHuntHud(input)` — adds context labels on top of the base status
- `resolveHuntResultLabel(input)` — determines the Results card outcome

The HUD rendering lives in the `TopBar` component inside `app/screens/GameScreen.tsx`.
