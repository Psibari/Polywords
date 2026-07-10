# Settings Screen — Design

## Why

Settings never got the design-system migration or atmosphere pass every other
screen has: raw hardcoded hex colors (no `PW.color.*`/`pwMaterials` import at all),
flat solid background, and text sizes (10-13px) that violate the standing
legibility rule (`docs/superpowers/specs/2026-07-03-home-screen-pollys-threshold-design.md`
Legibility clause: 14px floor, titles 20+, non-gameplay UI never shrinks for
hierarchy). It also shows fake data where real data already exists in the store.

## Visual migration

- Swap every raw hex for its exact `PW.color.*` equivalent (`#1A1830`→`PW.color.bg`,
  `#0F0D2A`→`PW.color.surfaceDeep`, `#F5C842`→`PW.color.gold`, etc. — all have exact
  matches). Local purple/rose rgba alpha variants stay as-is; that pattern is already
  standard across `MaskBoard.tsx`/`ResultsScreen.tsx`.
- Add `stageMaterial.vignette` + `stageMaterial.purpleAmbient` layered under the
  `ScrollView`, same pattern as today's Vault fix.
- Text sizes: kicker/eyebrow/note text up to 14px minimum, title stays 20+ (already
  42px, fine), row labels 15→16 to sit clearly above the floor. Differentiate
  secondary text by opacity/letterspacing, not size, per the standing rule.

## Real data, not placeholders

- Profile card: mastered/ghost counts already read `progress.masteredWords.length`
  / `ghosts.length` correctly elsewhere (Vault) — wire the same here instead of the
  static `"0 Mastered · 0 Ghosts"` string.
- Replace invented "Level 1" (no leveling system exists anywhere in this game) with
  the real rank letter computed from `progress.personalBest`. `VaultScreen.tsx` and
  `ResultsScreen.tsx` each already duplicate a `RANK_TIERS`/`computeRank` table
  locally — rather than add a third copy, extract one shared `getRankTier()` into a
  new `app/game/ranks.ts` and have Settings import it. Vault/Results keep their
  existing local copies untouched (not in scope; both already work and are
  committed).

## Sound toggle — real, single choke point

Add `soundEnabled: boolean` to the persisted store (`PlayerProgress`-adjacent slice,
same `AsyncStorage` pattern as existing settings-like flags). `playSfx()` in
`app/audio/sfx.ts` is the single call path every sound in the app already goes
through — gate at its top: if disabled, return before touching the player pool.
Settings' `ToggleRow` reads/writes the store instead of local `useState`.

## Haptics toggle — persisted value only, enforcement out of scope

Also persisted (real store value, not fake local state), so the UI is honest about
what's saved. Full enforcement is explicitly deferred: haptic calls are scattered
across ~20+ call sites in `MaskBoard.tsx` and `SwipeMask.tsx`, both warroom-gated per
CLAUDE.md. Wiring a global gate through either file is a broad change, not a
surgical patch, and wasn't asked for at that scope. Flagged here so it isn't lost,
not silently done.

## Scope boundaries

No changes to `VaultScreen.tsx`, `ResultsScreen.tsx`, `BottomNav.tsx`,
`MaskBoard.tsx`, or `SwipeMask.tsx`. New file: `app/game/ranks.ts`. Modified:
`SettingsScreen.tsx`, `sfx.ts`, `useGameStore.ts` (new persisted flags).
