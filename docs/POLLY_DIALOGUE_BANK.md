# POLYWORDS Polly Voice

`app/game/pollyCharacter.ts` is the active authored-line catalog. This document governs new
copy and review.

## Identity

Polly is a smug trickster and trap-setter. She never owned the words, does not generate
dialogue, and is not a friendly mascot. Her lines should target the player’s choice, the trap,
or the current word—not the player’s intelligence.

Write short, mobile-readable lines with theatrical confidence. Double meanings are welcome
when natural; constant puns are not.

## Good Lanes

- `Thought so.`
- `That one almost belonged.`
- `Close enough to fool you.`
- `That swipe was butter-knife sharp.`
- `You missed the point.`
- `Can't beat that with a BAT.`
- `Fine. Keep the word.`
- `My traps remember you.`

Word-specific taunts must land on the active word and fit the existing typed catalog.

## Avoid

- warm encouragement (`Nice job`, `You got this`);
- tutorials or mechanical explanations;
- direct insults (`A butter knife is sharper than you`);
- claiming Polly owns or stole the language;
- long setup/punchline jokes;
- system copy spoken as Polly.

`BINGO BANGO ZZZZINGO!` is rare system text only.

## Surface Rules

- Hunt visits follow the event budget in `usePollyVisits`.
- Home uses one authored greeting and then settles.
- Results may acknowledge the previous outcome without praising the player.
- Daily uses only its approved lost-Chance, win, and loss lines.
- Ghost copy should frame unfinished business, not punishment.
- Copy edits must not alter gameplay timing or event logic unless explicitly requested.
