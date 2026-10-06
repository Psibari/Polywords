# POLYWORDS Game Reference

Owns durable Hunt player rules. Live code remains authoritative for implementation detail;
`docs/GOLDEN_PACING_SYSTEM.md` owns emotional placement.

## Hunt

- Standard arc: 10 rounds. First three fledgling runs: 8.
- Polly's Word is always final. Returning Haunt may occupy round 5 standard / round 4 fledgling
  and remains normal-round presentation.
- Six starting feathers; zero ends the run. Up to five visible masks appear per word.
- UP claims a REAL; RIGHT rejects a trap. Wrong choices cost one feather, reset the chain and
  preserve chosen mask ID/direction in Results.
- Mastered words may return to ordinary tension/panic play as marked revisits, but never Boss or
  Returning Haunt candidates. `RUN IT BACK` creates a fresh arc with ghost priority.
- `huntGenerator.ts` builds the arc from effective runtime Hunt data and must validate content
  metadata before selection. Approved words may not be silently bypassed because of missing
  difficulty/gpsTag or malformed REAL/trap data.

Economy target: roughly 54% survive and 25% master, with deaths concentrated late. This is a
simulation target, not measured player data.

## Polly's Word and Haunts

- Surviving visible Boss tiles opens three face-down hidden-gauntlet cards.
- Player chooses, opens and judges each card with UP/RIGHT. Opened cards cannot be put back.
- All three hidden tiles correct = MASTERED. One hidden mistake or Boss death = HAUNTED.
- Visible mistakes do not block the gauntlet; they only affect `bossFlawless`.
- Returning Haunt re-tests the exact hidden pair that previously won. Success removes the active
  ghost; failure keeps it queued. Banished Haunts are not currently a separate Vault collection.
- `bossOutcome` is authoritative. The Master Gate must not return.

## Scoring and Momentum

| Action | Base points |
| --- | ---: |
| REAL | 100 |
| Trap rejected | 50 |
| Boss REAL / trap | 2× normal / 100 |
| Full hidden gauntlet clear | 600 once |
| Wrong choice | 0 |

Chain starts at 1×, rises 0.5× every three consecutive correct choices, caps at 3× and resets on
error. Both correct REAL claims and trap rejections build it.

| Consecutive correct | Multiplier | HUD tier |
| --- | --- | --- |
| 0–2 | 1.0× | STEADY |
| 3–5 | 1.5× | SHARP |
| 6–8 | 2.0× | RAZOR SHARP |
| 9–11 | 2.5× | UNTRAPPABLE |
| 12+ | 3.0× | UNTRAPPABLE |

Score persists but is displayed nowhere. Player-facing Hunt status is the four-tier momentum
system plus FELL OFF after a broken chain.

## First-Run Onboarding

Device-approved 2026-09-28. Runs on the real Hunt board with real scoring. No practice board and
no HUD tour.

- First Home: Polly says "Who are you?", "What do you want?", "You think you know words?",
  "You don’t look ready." HUNT then gets one subtle glow.
- First Hunt opens on FINE. Recognition examples build and remain visible:
  `I'M FINE.` / `PAY A FINE.` / `FINE DINING.` / `READ THE FINE PRINT.`
- System explanation: same word, different things; the player already knows the meanings and now
  has to recognize them. Polly explains that she mixes REAL meanings with convincing traps.
- Guided REAL accepts only UP; guided trap accepts only RIGHT. Truth appears only after commitment.
  First unaided decision opens both directions with temporary helper copy.
- HUD lessons fire once after the player actually experiences the event: feathers, first 1.5×
  run, first FELL OFF after that lesson, and Hunt progress after FINE.
- No HUD lesson on Polly's Word, Returning Haunt, fatal swipe or Results. Reduce Motion preserves
  all copy and tap-to-continue behavior.
- Settings replay repeats only the FINE opening on the next new Hunt; it does not reset other
  one-time gates.

Implementation detail belongs in `CLAUDE.md` and the onboarding modules, not here.

## Gold Feather and Results

- Winning Daily awards one dated Gold Feather. It expires by date and cannot stack.
- From Hunt game-over Results it revives the same run with one feather, preserves committed
  choices, resets `bossOutcome` to pending and is consumed once.
- Fatal wrong choices finalize the current word result before game-over.
- Locked system text includes `YOU BEAT POLLY`, `POLLY HUNT COMPLETE`, and
  `POLLY CLIPPED YOUR RUN.`
- `BINGO BANGO ZZZZINGO!` is unassigned and must not be reintroduced into mastery without approval.

## Presentation

- Hierarchy: hero word, active mask, Polybook, HUD, Polly visit.
- Ordinary masks stay neutral before commitment.
- In-round spine and archive nav both currently say POLYBOOK; renaming remains Pete's decision.
- The Polybook is Polly's book; the player reads it.

## Owners

- Screen/presentation: `app/screens/GameScreen.tsx`, `app/components/MaskBoard.tsx`
- Gestures: `app/components/SwipeMask.tsx`
- Rules/arc: `app/game/polyRunEngine.ts`, `app/game/huntGenerator.ts`
- Onboarding: `app/game/firstRunOnboarding.ts`, `app/game/hudLessons.ts`,
  `app/components/FirstRunHuntOnboarding.tsx`, `app/components/HudLessonLayer.tsx`
- State: `app/store/useGameStore.ts`
- Results/Vault: `app/screens/ResultsScreen.tsx`, `app/screens/VaultScreen.tsx`
