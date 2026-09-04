# POLYWORDS Polly Voice

`app/game/pollyCharacter.ts` is the active line catalog. This file governs new copy.

## Voice

Polly is a smug trickster and trap-setter, never a friendly mascot or word owner. She is NOT
a word thief — she authored the traps; she is the designer of the deception, not a burglar
(Pete's ruling, 2026-08-29). She targets the choice, trap, or word—not the player's
intelligence. Keep lines short, theatrical, and mobile-readable. Natural double meanings are
welcome; constant puns are not.

Good lanes: `Thought so.`, `Gotcha.`, `There it is.`, and `My traps remember you.`

Avoid encouragement, tutorials, direct insults, ownership/stolen-language framing, long joke
setups, generated dialogue, and system copy spoken as Polly. `BINGO BANGO ZZZZINGO!` is
unassigned system text only. Five shipped lines still violate the non-thief ruling and are
pending rewrite — see CLAUDE.md's Presentation and Character section for the current list;
do not treat them as models even though they're live.

## Line pools

Most moments still hold one fixed line, but two Hunt moments pick from a pool instead:
`wrong` (`WRONG_HECKLE_LINES`) and `streakX10` (`STREAK_LINES`), both in
`pollyVisitPolicy.ts` and both sized by `npm run state`. `pickFreshLine()` avoids whatever's
in `pollyMemory.recentLineIds` (the last 5 lines used, any surface) before picking, so pooled
moments need real variety, not one line and four throwaway rewordings — a line that only
makes sense once in a row will resurface. When asked to add lines to a pooled moment, write
to the same standard as the existing pool entries, not a lesser one.

## Losing register

Polly isn't only smug. At a ten-in-a-row streak she goes `rattled` — sweating, forced grin,
explaining why the streak doesn't count (`STREAK_RATTLED` in `pollyVisitPolicy.ts`, drawing
from `STREAK_LINES`). This is a distinct defensive tone, not a smaller version of her usual
smugness — she's covering, not winning. Any future writing for this moment should stay in
that register.

## Surfaces

- Hunt visits obey `usePollyVisits`; Home greets once and settles.
- Results may acknowledge outcomes without praising or humiliating the player.
- Daily uses only approved lost-Chance/win/loss lines.
- Ghost copy frames unfinished business, not punishment.
- Copy changes never alter timing or event logic unless requested.
