# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Expo/React Native app (SDK 54, RN 0.81, New Architecture) shipping to both iOS and
Android from one codebase with a single, unified visual language (not a per-OS
theme split) — confirmed by user. Still owes each OS its native guarantees (safe
areas, Reduce Motion, gesture conventions); load both `ios.md` and `android.md`.

## Users

Broad general audience, not a niche word-game-enthusiast crowd — confirmed by user.
Design should read as approachable and immediate (closer to how Wordle reached far
beyond puzzle hobbyists) rather than assuming players already seek out vocabulary
games or expect a steep challenge curve.

## Product Purpose

POLYWORDS is a word-recognition game. The desired player reaction is "Wait… Oh.
Right." — recognition, not vocabulary lookup. Core modes: Hunt (10-round run,
round 10 is Polly's Word boss encounter), Daily Challenge (separate UP-only
five-round mode), Vault (player's reclaimed-word archive), Home (lobby/launchpad),
Settings (profile/preferences/about).

## Positioning

Built on a swipe grammar that encodes meaning rather than menu choice: in Hunt, UP
claims a REAL definition, RIGHT rejects a trap; Daily is UP-only. Content design
follows a REAL/trap editorial law (`docs/CONTENT_WRITING_STANDARD.md`) built around
recognition-triggering memory, not dictionary-style correctness — the mechanism a
generic trivia or vocab-quiz competitor could not truthfully copy.

## Operating Context

Mobile play, short-to-medium sessions per Hunt run. Polly is an authored
trickster/trap-setter antagonist (not a mascot, never owns the words) who visits
during play and is remembered across runs via bounded, deterministic, local Polly
memory. Boss rounds (Route C, in progress) escalate into a hidden-tile gauntlet.
RUN IT BACK draws a fresh Hunt with ghost priority from prior haunted words.

## Capabilities and Constraints

- TypeScript strict, Zustand + immer state, AsyncStorage persistence.
- React Native Animated for most motion; Reanimated isolated to `SwipeMask.tsx`.
- Locked: palette, swipe grammar, HeroBook — see Brand Commitments. Everything else
  is open to redesign (per Pete, 2026-07-13).
- `MaskBoard.tsx` and `SwipeMask.tsx` require a warroom pass before editing.
- Boss round presentation (Route C) is specced but not yet built —
  `docs/BOSS_ROUND_SPEC.md`.
- Hunt economy (survive/master/death rates) is locked —
  `docs/POLYWORDS_ECONOMY_LOCK.md`.
- Fledgling runs (first 3) use an 8-round arc with the boss at index 7, not 9 —
  no screen may hardcode round 10 as "the boss."

## Brand Commitments

- Locked palette: background `#1A1830`, deep dark `#0F0D2A`, gold `#F5C842`,
  purple `#7B2D8B`, rose `#9B2D6B`, Polly green `#4CAF50`, wrong flash `#CC2200`,
  white `#FFFFFF`. No orange UI, no pink/magenta, no green UI outside Polly, no red
  outside wrong feedback. Gold stays a scarce focus color.
- Runtime fonts: Bebas Neue (hero), Barlow Condensed (UI, tiles, Polly bubbles).
- Polly: smug opponent and trap-setter, never a friendly mascot, never an owner of
  the words. Live art is transparent pose images with whole-image motion — no rig,
  flipbook, or legacy animator.
- `BINGO BANGO ZZZZINGO!` is system text, never Polly dialogue. `Thought so.` is
  locked mastery text.
- Vault must never be presented as Polly's cage or lair.

## Evidence on Hand

- Live test content: `assets/data/huntData.json` (~400 words, deliberately kept as
  a broken/legacy test corpus — do not treat as production copy).
- Editorial master: `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` (~110 real words:
  100 standard + ~10-11 boss). Workbook approval never auto-promotes to live JSON.
- No app store listing, marketing site, testimonials, or press exist yet — do not
  fabricate any of these for future design work.

## Product Principles

1. Recognition over vocabulary: the win condition is a memory click, not correct
   dictionary recall.
2. Swipe grammar is meaning, not chrome — UP/RIGHT map to REAL/trap and must never
   be treated as arbitrary interaction sugar.
3. Polly is a threat with authored personality, not decoration — she never
   softens into a mascot.
4. Broad-audience approachability over puzzle-hobbyist depth-signaling, per the
   confirmed target audience.
5. Unified cross-platform visual language, with native OS guarantees (safe areas,
   Reduce Motion, gestures) honored underneath it on both iOS and Android.

## Accessibility & Inclusion

Polly's motion respects reduced-motion and stops when off-screen. No
product-specific accessibility standard has been confirmed beyond this; do not
invent WCAG/ADA compliance claims.
