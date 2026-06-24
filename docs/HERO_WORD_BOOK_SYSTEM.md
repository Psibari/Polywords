# Hero Word-Book Interaction System

Approved UI system for the POLYWORDS play screen hero word.

## Hero Word Object

- The hero word is a front-facing magical word-book cover.
- The target word is printed on the cover.
- The spine / top binding is UP.
- The pages / opening side is DOWN.
- Default state is closed.
- Visual target is solid gold, bold, readable, KIND-style but bolder.
- Do not use hollow Bungee Shade for the hero cover word.

## Hero Entrance

- At round start, the cover swings shut into front-facing position.
- Haptic impact fires when it lands closed.
- The hero word is visible on the cover.

## Hero Exit

- At round end, the closed cover exits by reversing the entrance swing.

## Correct UP on REAL

- Player swipes the real tile upward.
- Tile travels toward the hero word-book.
- The bottom / pages side opens to accept it.
- Tile slides upward into the open pages.
- Cover closes shut.
- Haptic lock / seal impact fires.
- This is the sacred book intake payoff.

## Correct RIGHT on TRAP

- Player swipes trap tile right.
- Tile flings off-screen right.
- Glass / crystal shatter effect bursts back onto the screen from the off-screen right side.
- Glass pieces / shards crack back into view from the right edge.
- No feather loss.
- This is the glass shatter rejection payoff.

## Wrong UP on TRAP

- Hero word-book does not open.
- Big buzzer sound fires.
- Strong haptic impact fires.
- Red flash feedback hits.
- Feather loss happens.
- Tile exits permanently.
- No snap-back.

## Wrong RIGHT on REAL

- Hero word-book does not open.
- Big buzzer sound fires.
- Strong haptic impact fires.
- Red flash feedback hits.
- Feather loss happens.
- Tile exits permanently.
- No snap-back.

## Interaction Identity Summary

- Correct UP = sacred book intake.
- Correct RIGHT = glass / crystal shatter rejection.
- Wrong swipe = buzzer punishment.
- Hero entrance = swing-shut impact.
- Hero exit = reverse swing.

## Implementation Status

This system is approved conceptually but not yet fully / correctly implemented.

Future code patches must implement it surgically and must not substitute:

- generic absorb / pulse
- sideways book
- mouth animation
- fade-only entrance
- soft snap-back wrong swipe behavior
