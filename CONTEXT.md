# POLYWORDS — CONTEXT.md
### Session briefing · June 22, 2026

Read this at the start of any session. `CLAUDE.md` has full detail; this is the quick-reference and current build state.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds the word vault and set every trap. The player challenges her one word at a time. Every run is a HUNT: 10 rounds, GPS difficulty arc, boss at Round 10. North star: *"Wait… what? … Oh. Right."*

App shell: Home (lobby) · Play (arena) · Vault (player archive) · Settings. Bottom nav shows outside gameplay only.

---

## Stack

```
Expo SDK · React Native · TypeScript strict · Zustand+immer
React Native Animated API (Reanimated = SwipeMask.tsx ONLY, frozen)
Expo Haptics · expo-audio · Expo Router
Fonts: Bungee Shade (hero extrusion) · BebasNeue-Regular (hero face) · Barlow Condensed Bold (UI) · Lilita One (Polly)
Windows dev, forward-slash paths
babel.config.js frozen — presets only, no plugins
```

---

## Colors (strict)

```
#1A1830  Background
#F5C842  Gold — score/reward/boss/mastery (MAX 2 on screen)
#7B2D8B  Purple — trap shards, ghost border, Polly accent
#9B2D6B  Rose — shard partner
#4CAF50  Polly Green — Polly ONLY
#0F0D2A  Deep Dark — hero plaque / tile / Vault surfaces
#CC2200  Wrong Flash — wrong swipe only
#FFFFFF  UI text
```

---

## Swipe Grammar (sacred)

UP = real (absorb into word). RIGHT = trap (shard burst). Wrong either way = feather lost, tile exits permanently, red flash. No left swipe, no tap. Wrong swipes permanent — no snap-back, no retry.

---

## CURRENT BUILD STATE

**Active branch:** `play-screen-overhaul`.

Current live state:
- Hunt law is 10 rounds.
- Round 10 is POLLY'S WORD / boss word.
- Returning Haunt slot is Round 8 / index 7.
- Hero Word-Book spec is documented in `docs/HERO_WORD_BOOK_SYSTEM.md`.
- Hero cover font has been restored to a solid readable face.
- Hero Word-Book interaction system is approved but not fully / correctly implemented.

Next recommended implementation order:
1. Wrong swipe punishment package.
2. Correct RIGHT glass / crystal shatter.
3. Correct UP sacred book intake.
4. Hero entrance swing-shut / reverse exit.

Patch history lives in `CHANGELOG.md`.
Canonical workflow lives in `docs/WORKFLOW.md`.

## Hero Word-Book Current Status

Full approved interaction spec lives in `docs/HERO_WORD_BOOK_SYSTEM.md`.

Current status:
- Docs are locked.
- Hero font was restored to solid cover font.
- Code still needs implementation for wrong swipe punishment, correct RIGHT glass shatter, correct UP sacred book intake, and hero swing entrance / reverse exit.

Next recommended implementation order:
1. Wrong swipe punishment package.
2. Correct RIGHT glass / crystal shatter.
3. Correct UP sacred book intake.
4. Hero entrance swing-shut / reverse exit.
