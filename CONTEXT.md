# POLYWORDS — CONTEXT.md
### Session briefing · June 21, 2026

Read this at the start of any session. `CLAUDE.md` has full detail; this is the quick-reference and current build state.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds the word vault and set every trap. The player challenges her one word at a time. Every run is a HUNT: 12 words, GPS difficulty arc, boss at position 12. North star: *"Wait… what? … Oh. Right."*

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

**Active branch: `play-screen-overhaul`. Do not merge to main yet.**

New safe head: `1ce8add Add swipe direction affordances`.

Recent safe commits:
1. `1ce8add Add swipe direction affordances`
2. `e9a78d8 Add tile deck entrance`
3. `492accc Add hero word lock-in entrance`
4. `a64bd7a Add stacked clue deck visuals`
5. `8fc5696 Restore stable play screen layout`
6. `92c727f Restore centralized tile SFX wiring`

TypeScript passed before the affordance commit. Device screenshot approved after readability tune. Working tree clean after push.

Shipped play-screen branch additions:
1. Centralized tile SFX restored
2. Stable layout restored after bad play layout commit was neutralized
3. True stacked clue deck visuals
4. Hero word lock-in entrance
5. Tile deck entrance
6. Swipe direction affordances

Swipe direction affordances:
- Implemented in `app/components/MaskBoard.tsx`
- Commit: `1ce8add Add swipe direction affordances`
- Text: `SWIPE UP TO CLAIM` and `SWIPE RIGHT TO REJECT`
- UP cue: above active tile, centered in open gap between hero word and deck; `color: '#F5C842'`, `opacity: 0.72`, `fontSize: 14`, `top: -48`
- RIGHT cue: outside active tile body, lower-right/right side of clue deck area; `color: '#B98ADE'`, `opacity: 0.74`, `fontSize: 14`, `top: TILE_H + 44`, `right: 8`, `width: 190`
- Overlay uses `pointerEvents="none"` and does not block swipes/touches
- Direction help only: no correctness feedback, no hero glow during drag, no target validation during drag, no buttons, boxes, pills, or tutorial panels

Current visual/gameplay systems still in force:
- **Master Gate removed entirely** — boss perfect clear now: Polly fires → heavy haptic → 600ms → mystery tile drops direct via `triggerFinalTilesDrop()`. `gatePhase` = `'locked' | 'tiles' | 'wrongFail' | 'mastered'`.
- **Hero plaque redesign** — chamfered stage, multi-layer gold border, deep `#08061E` surface, page edges at bottom, purple underlight. Bottom fans open like a book on correct UP swipe (`triggerBookOpen`).
- **Tile card redesign** — landscape playing card, `borderRadius: 26`, corner pips, spinning gold→purple rim on press-hold (Reanimated, in SwipeMask).
- **New Polly system** — 10 individual PNGs in `assets/images/Polly/` (`polly_01-10.png`). `PollySprite.tsx` named poses; `usePollyAnimator.ts` is a fly-up arc system. `POLLY_SIZE = 190`.

**Polly poses:** flyExcited(01) flyRelaxed(02) perchNeutral(03) perchDismissive(04) perchLaughing(05) perchSmug(06) perchPointing(07) perchShocked(08) perchSulking(09) flyAngry(10).

**Polly behavior:** fly-up entrances (not pop-ins). Mid-round perches, delivers speech, exits via branch pull. Perch side derived from pose facing — only `perchSmug` faces left (right perch), all others face right (left perch).

**Trigger map:** trap rejected → perchDismissive · wrong swipe → perchSmug "Thought so." · haunt created / run clipped → perchLaughing · player masters → perchSulking · beats Polly → flyAngry · boss throw → perchPointing · perfect clear → perchShocked.

**Stash:** Ghost Haunt Loop stash preserved (`stash@{0}: On main: wip haunt loop type scaffolding`) — do not drop.

**Cleanup candidate:** `gate_open.mp3` still in sfx folder, gate removed.

---

## Boss Word — "Polly's Word"

Player-facing name = **Polly's Word**. Engine still uses `bossWord` / `eventType: 'bossWord'` — do not rename.

Master Gate REMOVED. Boss perfect clear (no wrong swipes on visible masks) → Polly fires → heavy haptic → 600ms → one mystery tile drops (randomly real hidden meaning or hidden trap, `mysteryIsRealRef`). Correct = MASTERED. Wrong = GHOST. Boss with any wrong swipe on visible masks → no mystery, advance silently.

MASTERED and GHOST are boss-only. Words 1–11 clear via `triggerWordExit()` → `completeWord()`, no overlay.

MASTERED celebration: hero crashes center → diagonal MASTER stamp → cracks → Word Core grows/spins → shoots to Vault nav → bloom. Boss mastery may fire BINGO BANGO ZZZZINGO! (game/system stinger, not Polly dialogue).

GHOST: wrong mystery → tile exits → HAUNTED overlay +800ms. Ghost tile solid purple border, phrase NEVER revealed, wordId = word string.

Haunt return: index 9 / position 10, never boss 12. "Guess who's back." → HAUNT BROKEN / STILL HAUNTED.

---

## Hunt 1 (locked)

WAVE · FINE (Confidence) · CHARGE · PLANT · TABLE (Flow) · CAPITAL · SENTENCE · SPELL (Tension) · DRAFT · RANK · SOUND (Panic) · CAST (Boss). Words 1–11 no hidden meaning. CAST: hiddenMeaning 'Molten metal takes shape', hiddenTrap 'Spell gets thrown on you'.

GPS arc: 2 Confidence + 3 Flow + 3 Tension + 3 Panic + 1 Boss. `generateHunt()` samples fresh arc every run from `huntData.json` (403 words).

---

## Scoring (locked)

Real 100× · rare real 300× · trap 50× · boss real 200× (2×) · boss trap 100× (2×) · boss mystery 600× via `submitBossMastery()` · wrong = 0, feather lost. Chain mult: 1.0 start, +0.5 per 3 correct, cap 3.0, reset on wrong. Floats mirror engine formula. Polly target 15,000. Ranks D<8k/C8k/B11k/A14k/S18k/MASTER22k. Feather milestones 8k/16k.

Removed: revealHidden(), hiddenFound in WordResult, pollyTrigger 'hiddenReveal' (→ 'bossMastery'), addBonusScore(300) in triggerMastered.

---

## Content Rules

"Meaning hidden, not meaning lost." Scene-language, never dictionary voice. Register Parity (tile types indistinguishable by tone). Tile length 5–6 words. Hidden tiles cut. 1 real per meaning, 2–3 traps per meaning, cap 8 traps/word. No trap-to-trap dup words. No headword/derived forms in tiles. No two traps from the same meaning direction.

`huntData.json` = 403 words, QA-clean. Mask Rewriter V7 in project files (`claude-sonnet-4-6`, `tiles[]`). GPS tagging pending before next regen.

---

## Locked Rules — non-negotiable

- tsc --noEmit exits 0 before device test
- One prompt, one concern — surgical
- useNativeDriver true → transform/opacity · false → height/margin/backgroundColor · never mix on one value
- setTimeout between phases, never .start() callbacks
- Ghost wordId = word string, never stepIndex
- Boss position 12 always · haunt slot index 9, never boss zone
- Wrong swipes permanent · no snap-back
- Master Gate removed — mystery tile drops direct on perfect boss clear
- MASTERED and GHOST boss-only · boss mystery randomly real or trap
- Words 1–11 advance via triggerWordExit(), no overlay
- wrongSwipeOccurred.current resets every new word
- "Thought so." / "BINGO BANGO ZZZZINGO!" never change · ZZZZINGO is game/system, not Polly
- Boss mastery uses submitBossMastery()
- MaskBoard.tsx and SwipeMask.tsx need warroom analysis before any prompt
- Preserve Ghost Haunt Loop stash
- play-screen-overhaul — do not merge to main

---

## Key Files

```
app/components/MaskBoard.tsx          Main board (warroom-gated)
app/components/SwipeMask.tsx          Tile + swipe (Reanimated, frozen, warroom-gated)
app/components/ui/PollySprite.tsx     10-pose PNG component
app/hooks/usePollyAnimator.ts         Polly fly-up arc system
app/game/huntGenerator.ts             GPS arc sampling
app/game/polyRunEngine.ts             Engine
app/game/types.ts                     Types
app/store/useGameStore.ts             Zustand store
app/screens/GameScreen.tsx            Play HUD + background
app/screens/HomeScreen.tsx            Lobby
app/screens/VaultScreen.tsx           Archive + Ranks
app/screens/ResultsScreen.tsx         Results
app/screens/DailyChallengeScreen.tsx  Daily (5 rounds)
assets/data/huntData.json             403-word database
assets/images/Polly/polly_01-10.png   Polly poses
assets/sfx/                           SFX
docs/GOLDEN_PACING_SYSTEM.md          GPS source of truth
docs/POLLY_DIALOGUE_BANK.md           Polly dialogue source of truth
tools/content/mask-rewriter           Local-only — never wire into app
```

---

## Next

`gate_open.mp3` cleanup from sfx folder · GPS metadata tagging audit · `isRare` reachability audit · cosmetic `submitSwipeDown`→`submitSwipeRight` rename later, post-launch · Gold Feather reward · `expo-av`→`expo-audio` finalization.

---

*POLYWORDS CONTEXT.md · Pete DiBari · June 21, 2026*
