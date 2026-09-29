# POLYWORDS Game Reference

This file owns durable Hunt rules. Live code remains authoritative for implementation detail.

## Hunt

- Standard arc: 10 rounds. First three fledgling runs: 8 rounds.
- Polly's Word is always final. A Returning Haunt may occupy round 5 standard / round 4
  fledgling and remains a normal round presentation.
- Six starting feathers; zero ends the run. Up to five visible masks appear per word.
- UP claims a REAL; RIGHT rejects a trap. Wrong choices cost one feather, reset the chain,
  and preserve the chosen mask ID/direction in results.
- Mastered words return to ordinary tension/panic play as marked revisits. They are excluded from
  the Boss slot and Returning Haunt reservation, so mastery changes their status without deleting
  their visible REAL meanings. `RUN IT BACK` creates a fresh arc with ghost priority.
- `huntGenerator.ts` builds the arc from `assets/data/huntData.json` and marks ordinary mastered
  revisits with `isMasteredReturn`.

Economy target: roughly 54% survive and 25% master, with deaths concentrated late. This
depends on genuinely difficult but fair boss-hidden content; it is a simulation target, not
measured player data.

## Polly's Word and Haunts

- Surviving visible boss tiles opens three face-down hidden-gauntlet cards.
- The player chooses a card, opens it, then judges it with UP/RIGHT. Opened cards cannot be
  put back.
- All three hidden tiles correct = MASTERED. One hidden mistake or boss death = HAUNTED.
- Visible mistakes do not block the gauntlet; they only affect `bossFlawless`.
- A Returning Haunt re-tests the exact hidden pair that previously won. Success banishes it from
  the active ghost queue; failure keeps it queued. Banished Haunts are currently not persisted as
  a separate Vault collection item. Ordinary missed meanings are not Haunts.
- `bossOutcome` is the authority for mastery/haunt. The Master Gate must not return.

## Scoring

| Action | Base points |
| --- | ---: |
| REAL | 100 (rare REAL: 300 — no live content currently carries `isRare`, tier unreachable) |
| Trap rejected | 50 |
| Boss REAL / trap | 2× normal / 100 |
| Full hidden gauntlet clear | 600 once |
| Wrong choice | 0 |

The chain starts at 1×, rises by 0.5× every three consecutive correct choices, caps at 3×,
and resets on error. Correct REAL claims and correct trap rejections both build it.

| Consecutive correct | Multiplier | HUD tier |
| --- | --- | --- |
| 0–2 | 1.0× | STEADY |
| 3–5 | 1.5× | SHARP |
| 6–8 | 2.0× | RAZOR SHARP |
| 9–11 | 2.5× | UNTRAPPABLE |
| 12+ | 3.0× (cap) | UNTRAPPABLE |

Score is still calculated in `polyRunEngine.ts` and persisted, but it is displayed nowhere:
the Hunt HUD shows live status and Results shows an outcome label, not a number or rank. The
live status is a 4-tier momentum system (STEADY/SHARP/RAZOR SHARP/UNTRAPPABLE) with its own
break state (FELL OFF); see CLAUDE.md's Hunt section for the current, detailed version.

## First-Run Onboarding

Locked (Pete, device-approved 2026-09-28). Architecture: `CLAUDE.md`, Modes → First-run
onboarding. Everything below runs on the real Hunt board with real scoring; there is no
practice board and no HUD tour.

**Home (first launch only).** Polly arrives on her usual perch, with no blocking modal, and
says in turn: "Who are you?", "What do you want?", "You think you know words?", "You don’t look
ready." HUNT then gets one subtle glow.

**FINE recognition.** The first Hunt opens on FINE, which stands alone for a moment. The
examples then build up one line at a time, and none of them is removed:

> I'M FINE. / PAY A FINE. / FINE DINING. / READ THE FINE PRINT.

All four stay on screen together before the next line: SAME WORD. FOUR DIFFERENT THINGS. /
YOUR BRAIN SWITCHES BETWEEN THEM WITHOUT YOU EVEN NOTICING. / THAT’S POLYWORDS. / YOU ALREADY
KNOW THE MEANINGS. NOW YOU HAVE TO RECOGNIZE THEM.

**The challenge.** Polly: "Think you know this word?" Then: POLLY MIXES REAL MEANINGS WITH
CONVINCING TRAPS. SHE’S TRYING TO MAKE YOU SECOND-GUESS WHAT YOU ALREADY KNOW. Polly: "Let’s see
how sure you are."

**Guided decisions.** A real FINE REAL accepts only UP (caption BELONGS TO FINE?); a real FINE
trap accepts only RIGHT (caption DOESN’T BELONG?). Neither shows its truth before the swipe.
Each result is labelled after commitment (REAL MEANING, then TRAP) and Polly answers it ("That
one was easy.", "Almost sounded right."). The first unaided decision opens both directions
with a temporary helper (↑ CLAIM A MEANING → REJECT A TRAP) until the first correct unaided call.

**HUD lessons.** Each lesson fires once, the first time the player actually meets the event.
The event plays out first; then the next decision locks, the screen dims around the live HUD
element, an arrow points at it, the rule shows until the player taps, and Polly adds one line.

| Lesson | Fires on | Rule | Polly |
| --- | --- | --- | --- |
| Feathers | first nonfatal feather lost on an ordinary word | THESE ARE YOUR FEATHERS. / THEY’RE YOUR LIVES. / WRONG CALLS COST ONE. / LOSE THEM ALL, AND POLLY WINS THE HUNT. | "And you lost to a bird." |
| Run | first time the multiplier reaches 1.5× | YOU’RE ON A RUN. / CONSECUTIVE CORRECT CALLS BOOST YOUR SCORE. / KEEP IT GOING TO REACH 3×. | "Try not to ruin it." |
| Run broken | first FELL OFF after the Run lesson | WRONG CALLS BREAK YOUR RUN. | "There it is." |
| Hunt progress | FINE completed, round markers advanced | ONE WORD DOWN. / EACH MARKER IS ANOTHER WORD IN THE HUNT. / REACH THE CROWN TO FACE POLLY’S WORD. | "Assuming you make it that far." |

- The guided REAL, guided TRAP and a correct unaided call are three in a row, so the Run lesson
  usually lands on the first unaided FINE decision.
- The Hunt progress lesson is the hand-off from FINE: the next word's card stays hidden and
  locked until it ends.
- Only one lesson shows at a time. None appears on Polly's Word, a Returning Haunt, a fatal
  swipe or Results.
- Reduce Motion keeps every line and the tap to continue.
- First Hunt Replay (Settings) replays only the FINE opening on the next new Hunt. Players who
  finished onboarding before HUD lessons existed are not shown them.

## Gold Feather and Results

- Winning Daily awards one dated Gold Feather. It expires by date and cannot stack.
- From Hunt game-over Results, it revives the same run with one feather, preserves committed
  choices, resets `bossOutcome` to pending, and is consumed once.
- Fatal wrong choices finalize the current word result before game-over.

Locked system text includes `YOU BEAT POLLY`, `POLLY HUNT COMPLETE`, and
`POLLY CLIPPED YOUR RUN.`. `BINGO BANGO ZZZZINGO!` is unassigned and must not be reintroduced
into mastery without approval. `Thought so.` is not locked system text — it is one example
from `WRONG_HECKLE_LINES`, a pool `resolveVisit` now picks from on each wrong swipe
(see `docs/POLLY_DIALOGUE_BANK.md`).

## Presentation

- Hierarchy: hero word, active mask, Polybook, HUD, Polly visit.
- Ordinary masks stay neutral before commitment.
- The in-round book's spine reads **POLYBOOK**, and so does the archive screen (Vault route,
  `PolybookSpread.tsx`). That collision is open; renaming is Pete's call.
- The Polybook is Polly's book, kept in the old Vault; the player reads it (Pete, 2026-09-26).

## Owners

- Screen/presentation: `app/screens/GameScreen.tsx`, `app/components/MaskBoard.tsx`
- Gestures: `app/components/SwipeMask.tsx`
- Rules/arc: `app/game/polyRunEngine.ts`, `app/game/huntGenerator.ts`
- Onboarding: `app/game/firstRunOnboarding.ts`, `app/game/hudLessons.ts`,
  `app/components/FirstRunHuntOnboarding.tsx`, `app/components/HudLessonLayer.tsx`
- State: `app/store/useGameStore.ts`
- Results/Vault: `app/screens/ResultsScreen.tsx`, `app/screens/VaultScreen.tsx`
