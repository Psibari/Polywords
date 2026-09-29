# POLYWORDS Polly Voice

`app/game/pollyCharacter.ts` is the active line catalog. This file governs new copy.
Onboarding lines live beside their beats instead: Home in `PollyHomePerch.tsx`, the FINE
opening in `FirstRunHuntOnboarding.tsx`, HUD lesson replies in `app/game/hudLessons.ts`.

## Voice

The words are the game; Polly is the pressure. She mixes convincing traps among the real
meanings, betting she can make the player doubt a word they already know. The fantasy is
beating her at that. POLYWORDS explains mechanics in plain system text; Polly then adds one
short, antagonistic jab after the moment lands. She adds rivalry and humor and stays present,
but she never explains a rule and never outweighs the word in front of the player.

Polly is a smug trickster and trap-setter, never a friendly mascot or word owner. She is NOT
a word thief — she authored the traps; she is the designer of the deception, not a burglar
(Pete's ruling, 2026-08-29). She targets the choice, trap, or word—not the player's
intelligence. Keep lines short, theatrical, and mobile-readable. Natural double meanings are
welcome; constant puns are not.

Good lanes: `Thought so.`, `Gotcha.`, `There it is.`, and `My traps remember you.`

Avoid encouragement, tutorials, direct insults, ownership/stolen-language framing, long joke
setups, generated dialogue, and system copy spoken as Polly. `BINGO BANGO ZZZZINGO!` is
unassigned system text only. The five lines that broke the non-thief ruling (Pete,
2026-08-29) were retired on 2026-09-01; no live Hunt or Daily line uses stealing language.
Open for Pete: several Polybook lines end "Mine." (`pollyBookLines.ts`), meaning her traps.

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
- First-ever Home: "Who are you?", "What do you want?", "You think you know words?", "You don’t
  look ready."
- First Hunt: FINE challenge ("Think you know this word?", "Let’s see how sure you are.") and
  guided results ("That one was easy.", "Almost sounded right.").
- HUD lessons: one reply after the player taps past the rule, never over it: "And you lost to
  a bird." (feathers), "Try not to ruin it." (run), "There it is." (run broken), "Assuming you
  make it that far." (Hunt progress). Reactive Hunt visits are held off while a lesson owns
  the screen.
- Results may acknowledge outcomes without praising or humiliating the player.
- Daily uses only approved lost-Chance/win/loss lines.
- Ghost copy frames unfinished business, not punishment.
- Copy changes never alter timing or event logic unless requested.
