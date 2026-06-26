# POLYWORDS — CLAUDE.md
### Ground truth for Claude Code · Updated June 22, 2026

---

## The Game

Polly is the Master of Words. She holds every word in her vault and set every trap. The player challenges her one word at a time to take the title. Every run is a HUNT: 10 rounds, a designed difficulty arc, and a boss confrontation at Round 10.

North star: *"Wait… what? … Oh. Right."* — the Semantic Snap.

App shell: Home is the arcade lobby. Play is the arena. Word Vault is the player's reclaimed-meaning archive. Settings holds player/account/preferences/about (Profile lives inside Settings for MVP). Bottom nav (Home / Play / Vault / Settings) shows outside active gameplay only.

---

## Tech Stack

```
Runtime:    Expo SDK (managed)
Language:   TypeScript (strict)
Framework:  React Native
State:      Zustand + immer
Animation:  React Native Animated API. Reanimated = SwipeMask.tsx ONLY, frozen, never imported elsewhere.
Haptics:    Expo Haptics
Audio:      expo-audio
Navigation: Expo Router
Fonts:      Bungee Shade (hero word extrusion) · BebasNeue-Regular (hero word face) · Barlow Condensed Bold (all UI) · Lilita One (Polly speech)
Dev:        Windows, VS Code, forward-slash paths, Expo Go via QR
```

### Animation rules — non-negotiable
- `useNativeDriver: true` → transform, opacity ONLY
- `useNativeDriver: false` → height, margin, backgroundColor ONLY
- Never mix drivers on the same Animated.Value
- `setTimeout` between animation phases — never `.start()` callbacks
- `babel.config.js` frozen — presets only, no plugins (duplicate Reanimated plugin causes silent failure)

---

## Palette — strict

| Token | Hex | Use |
|---|---|---|
| Background | `#1A1830` | Every screen |
| Gold | `#F5C842` | Score, boss word, reward, mastery — MAX 2 gold elements on screen |
| Purple | `#7B2D8B` | Trap shards, ghost border, Polly accent |
| Rose | `#9B2D6B` | Crystal shard gradient partner |
| Polly Green | `#4CAF50` | Polly mascot ONLY |
| Deep Dark | `#0F0D2A` | Hero plaque + tile + Vault surfaces |
| Wrong Flash | `#CC2200` | Wrong-swipe flash ONLY — never text, never decoration |
| White | `#FFFFFF` | UI text |

---

## Swipe Grammar — sacred

| Gesture | Meaning | Result |
|---|---|---|
| UP | Real meaning | Magnetic absorb into hero word |
| RIGHT | Trap | Purple/rose crystal shard burst (glass shatter) |
| Wrong UP (trap) | Claimed a trap | Feather lost, tile exits permanently, red flash |
| Wrong RIGHT (real) | Rejected a real meaning | Feather lost, tile exits permanently, red flash |

UP = real. RIGHT = trap. Permanent. Never change. No left swipe, no tap, swipe only.
Wrong swipes are permanent — no snap-back, no retry, no wrong tile staying in the deck.

---

## Session Model — THE HUNT

Always 10 rounds, always a boss at Round 10, 5 feathers (lives) for the whole hunt.

GPS arc (`docs/GOLDEN_PACING_SYSTEM.md` is source of truth): 2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss.

| Position | Phase | Difficulty |
|---|---|---|
| 1–2 | Confidence | Easy |
| 3–5 | Flow | Medium |
| 6–8 | Tension | Medium-Hard |
| 8–9 | Panic | Hard |
| 10 | Boss | Maximum |

Living pool: mastered words graduate permanently to the Vault and never return in a standard run. Ghost (haunt) words get priority placement at index 7 (Round 8) in the current 10-round Hunt. RUN IT BACK = fresh 10-round draw with ghost priority. Daily Challenge is the one curated fixed session.

Hunt generation: `generateHunt()` in `app/game/huntGenerator.ts` samples a fresh GPS arc every run from `assets/data/huntData.json` (403 words). `SESSION` fallback preserved.

### Hunt 1 (locked test session)
WAVE · FINE (Confidence) · CHARGE · PLANT · TABLE (Flow) · CAPITAL · SENTENCE · SPELL (Tension) · DRAFT · RANK · SOUND (Panic) · CAST (Boss).
Words 1–11 carry no hidden meaning. CAST: `hiddenMeaning: 'Molten metal takes shape'`, `hiddenTrap: 'Spell gets thrown on you'`.

---

## Boss Word — "Polly's Word"

Player-facing name is **Polly's Word**. (Engine still uses `bossWord` / `eventType: 'bossWord'` internally — do not rename yet.)

The Master Gate has been REMOVED. On a perfect boss clear (no wrong swipes on visible masks), Polly fires → heavy haptic → 600ms pause → one mystery tile drops directly into the active tile position via `triggerFinalTilesDrop()`. No gate, no door split, no lock.

- Mystery tile is randomly the real hidden meaning OR the hidden trap (`mysteryIsRealRef`).
- Correct judgment = MASTERED. Wrong judgment = GHOST.
- Boss with any wrong swipe on visible masks: no mystery tile, word advances silently.
- `gatePhase` states: `'locked' | 'tiles' | 'wrongFail' | 'mastered'`.

MASTERED is boss-only. GHOST is boss-only. Words 1–11 clear via `triggerWordExit()` → `completeWord()` with no overlay.

### MASTERED celebration
Hero word crashes center → diagonal MASTER stamp → cracks/energy → Word Core grows/spins → shoots to Vault nav icon → impact bloom. Boss mastery may fire the rare game/system stinger **BINGO BANGO ZZZZINGO!** (one word at a time, ZZZZINGO! biggest). This is NOT Polly dialogue.

### GHOST loss
Wrong boss mystery judgment → tile exits permanently → HAUNTED overlay at +800ms. Ghost tile: solid purple border (no dashes), shows only "MASTER THE WORD" / "From [WORD]" — phrase NEVER revealed. Ghost `wordId` = word string always, never stepIndex.

### Haunt return
Ghosted boss words return at index 7 (Round 8), never replacing the Round 10 boss. Entrance: "Guess who's back." Mastered → HAUNT BROKEN. Failed again → STILL HAUNTED.

---

## Play Screen Visual System (current)

**Token system** - `app/ui/pwTheme.ts` and `app/ui/pwMaterials.ts` define the premium POLYWORDS visual language. Token sections: color, opacity, space, radius, font, motion, z, shadow. Material recipes: `cardMaterial`, `deckBackMaterial`, `heroPlaqueMaterial`, `panelMaterial`, `affordanceText`. The token system is now partially wired into gameplay materials.

**Hero plaque** - dominant word altar. The plaque face, rim, bevel, chamfers, page-edge accents, shadows, and underlight use tokenized hero material. Size/position, hero word font size/line height, and hero entrance animation unchanged. On correct UP swipe the bottom fans open like a book to absorb the tile (`triggerBookOpen` + `triggerAbsorption`), then snaps shut. Word never moves.

**Tile card** - landscape playing card using tokenized card material in `SwipeMask.tsx`. On press-hold a gold-to-purple gradient rim spins around the tile edge (Reanimated, in SwipeMask). Swipe logic, PanResponder, Reanimated timings/shared values, card size, and positioning unchanged.

**Deck stack** - backing cards in `MaskBoard.tsx` use tokenized deck material. Backing card colors/rims/radius/shadow are tokenized; a subtle lower edge makes the stack read as physical cards. Stack count and offsets unchanged; active card still owns attention.

**Locked visual grammar** - Center = active card/deck gameplay. Up lane = claim toward hero. Right side = reject lane, keep clean during active gameplay. Left side = Polly heckle/perch zone. Hero plaque = word altar. Active card + deck backs = same card-material family. Direction cues are help only, not correctness feedback.

**SFX** (`assets/sfx/`): `tile_swipe.mp3` = sword whoosh, `press_hold_start.mp3` = card pickup. `trap_shatter`, `trap_wrong`, `mastered`, `haunted`, `ui_click`, `polly_call` in use. `gate_open.mp3` orphaned (gate removed) - cleanup candidate.

### Play-screen-overhaul current state

Active branch: `play-screen-overhaul`.

Patch history belongs in `CHANGELOG.md`.
Current build state belongs in `CONTEXT.md`.
Canonical workflow lives in `docs/WORKFLOW.md`.

Do not use stale safe-commit lists in this file as source of truth.

---

## Polly — Master of Words

The antagonist, not a mascot. Every trap is her move. The boss word is hers. When a word is mastered it leaves her vault permanently.

### Sprite system (current)
10 individual PNGs in `assets/images/Polly/` (capital-P folder, `polly_01.png`–`polly_10.png`). `PollySprite.tsx` maps named poses; `usePollyAnimator.ts` is a fly-up arc system.

Poses: `flyExcited` (01), `flyRelaxed` (02), `perchNeutral` (03), `perchDismissive` (04), `perchLaughing` (05), `perchSmug` (06), `perchPointing` (07), `perchShocked` (08), `perchSulking` (09), `flyAngry` (10).

### Animation behavior
Fly-up entrances, not pop-ins. Gameplay Polly size is `POLLY_GAMEPLAY_SIZE = 210`.
- Mid-round: flies in from bottom-left, perches left, delivers speech, exits left.
- End-of-round: same entrance, left perch, delivers speech, exits left.
- Active gameplay right side is reserved as the `SWIPE RIGHT TO REJECT` lane: no Polly perch, settle point, speech bubble, body/crown, or fly-in destination there.
- Speech bubble stays with left-side Polly and is narrowed/contained left so it does not crowd the reject cue.
- One mid-round pop-in budget per word; end-of-round always fires.

### Trigger → pose map
- Trap correctly rejected → `perchDismissive` (Polly annoyed she got caught)
- Wrong swipe → `perchSmug`, "Thought so."
- Haunt created / run clipped → `perchLaughing` (Polly wins)
- Player masters the word → `perchSulking` (Polly loses)
- Player beats Polly → `flyAngry`
- Boss throw → `perchPointing`
- Perfect clear → `perchShocked`

### Locked lines
"Thought so." · "BINGO BANGO ZZZZINGO!" · "BBBLAAAAHHAHAHA!" · "YOU BEAT POLLY" · "POLLY HUNT COMPLETE" · "POLLY CLIPPED YOUR RUN." — never change any of these.

`docs/POLLY_DIALOGUE_BANK.md` is the dialogue source of truth.

---

## Word Vault — player archive

Player-owned reclaimed-meaning archive, not Polly's cage. Sections: Mastered Words, Ghost Words, Hidden Meanings, Ranks. `VaultScreen.tsx` reads real persisted progress from `useGameStore` (`masteredWords`, `personalBest`, `runsCompleted` via `recordMastery` / `recordRunComplete` / `loadProgress`). Archive/collection language, never cage/prison. No Polly presence.

---

## Scoring

| Action | Points |
|---|---|
| Correct real (UP) | 100 × chainMultiplier |
| Correct rare real (UP) | 300 × chainMultiplier (isRare flag) |
| Correct trap (RIGHT) | 50 × chainMultiplier |
| Boss correct real | 200 × chainMultiplier (2×) |
| Boss correct trap | 100 × chainMultiplier (2×) |
| Boss mystery correct | 600 × chainMultiplier via `submitBossMastery()` |
| Wrong swipe | 0 — feather lost, combo reset |

Chain multiplier: starts 1.0, +0.5 every 3 consecutive correct, caps 3.0, resets on wrong. Score floats mirror the engine formula (read streak before store action, apply boss 2× where applicable). Combo counter is GOLD only.

Polly target: 15,000 pts. Ranks: D <8k · C 8k · B 11k · A 14k · S 18k · MASTER 22k. Feather milestones at 8,000 and 16,000 restore 1 feather (max 1 reserve, lives can reach 6). "YOU BEAT POLLY" on results when score ≥ 15,000. "POLLY HUNT COMPLETE" is the results header. "POLLY CLIPPED YOUR RUN." replaces GAME OVER at zero feathers.

Dead/removed: `revealHidden()`, `hiddenFound` in WordResult, `pollyTrigger 'hiddenReveal'` (→ `'bossMastery'`), `addBonusScore(300)` in triggerMastered.

---

## Feathers (lives)

5 feathers per hunt. Wrong swipe plucks 1. 0 ends run. Milestones at 8,000 / 16,000 restore 1 (max 1 reserve). HUD renders five feather slots + separate reserve in `GameScreen.tsx`. Engine/store state is still named `lives` — do not rename without a dedicated migration.

Gold Feather: earned on Daily win, expires midnight, used on hunt game-over to restore 1 life. `applyGoldFeather()` engine · `useGoldFeatherInHunt()` store.

---

## Content Rules

Content standard — "meaning hidden, not meaning lost": tiles create a "Wait… what? → Oh. Right." experience. Scene-language, never dictionary voice. Register Parity: all tile types indistinguishable by tone.

- Tile length: 5–6 words acceptable
- Hidden tiles CUT from the pipeline entirely
- 1 real per meaning, 2–3 traps per meaning, hard cap 8 traps per word
- No trap-to-trap duplicate words; trap sharing vocab with reals is allowed
- No headword or derived forms in any tile
- No trap may share a meaning direction with another trap on the same word

`huntData.json` = 403 words, QA-clean (all trap-is-real / real-is-trap fixed, ALL CAPS normalized). Loaded via `require()` at import. Mask Rewriter V7 in project files (`claude-sonnet-4-6`, `tiles[]` output). GPS metadata tagging pending before next regeneration.

---

## Cut List ☠️ — permanent

Left swipe · tap interactions · snap-back wrong swipes · two-tile hidden gate split · the Master Gate · ghost/mastery for non-boss words · Reanimated outside SwipeMask · rectangle/square particles · red for text or decoration · Polly Green for UI · >2 gold elements on screen · hiddenEmoji/hiddenTrapEmoji · revealHidden() · hiddenFound in WordResult · pollyTrigger 'hiddenReveal' · HIDDEN tile type · sprite-sheet Polly · visual tells before swipe · dashed borders · pink/magenta.

---

## Locked Decisions — non-negotiable

- Session always 10 rounds, boss always Round 10
- UP = real, RIGHT = trap, always
- Wrong swipe is permanent
- No left swipe and no tap interaction
- No hero glow during drag, no target validation during drag, no correctness hints before swipe release
- Mastered words graduate permanently; RUN IT BACK = fresh draw with ghost priority
- Master Gate removed — boss perfect clear drops the mystery tile directly
- MASTERED and GHOST are boss-only
- Boss mystery tile is randomly real or trap — one shot
- Non-boss words advance via `triggerWordExit()` — no overlay
- Haunt slot is index 7 (Round 8) in a 10-round Hunt, never boss zone
- Ghost wordId = word string, never stepIndex
- `wrongSwipeOccurred.current` resets at the start of every new word
- Crystal shards: polygon, purple/rose, never rectangles
- Diagonal MASTER stamp over the crashed word
- Ghost tile never reveals the missed phrase
- "Thought so." / "BINGO BANGO ZZZZINGO!" — never change; ZZZZINGO is game/system text, never Polly dialogue
- Boss mastery uses `submitBossMastery()` — never `addBonusScore()`
- Max 2 gold elements on screen
- Polly Green is Polly only; red is wrong-swipe flash only
- Polly's Word / boss internal naming stays as-is for now
- Boss player-facing name = "Polly's Word"; engine `bossWord` flags unchanged
- Live Content Engine is POST-LAUNCH only

---

## Claude Code Conventions

- `tsc --noEmit` after every change — must exit 0
- One prompt, one concern — surgical only
- Read the relevant file fully before editing; confirm exact paths
- Never add tap handlers to tiles — swipe only
- `MaskBoard.tsx` and `SwipeMask.tsx` require warroom analysis before any prompt touches them
- Tag known-good states after device confirmation: `git tag v0.working-YYYYMMDD`
- Preserve stash named `wip haunt loop type scaffolding` — reference by NAME only, never by index, never pop/drop/clear it.
- Current work branch: `play-screen-overhaul` — do not merge to main

---

## Key Files

```
app/components/MaskBoard.tsx      Main game board (warroom-gated)
app/components/SwipeMask.tsx      Tile + swipe physics (Reanimated — frozen, warroom-gated)
app/components/ui/PollySprite.tsx 10-pose PNG sprite component
app/components/PollyDailyPerch.tsx    Polly branch + idle cycle (Daily)
app/hooks/usePollyAnimator.ts     Polly fly-up arc system
app/ui/pwTheme.ts                 Polywords visual tokens
app/ui/pwMaterials.ts             Tokenized material recipes
app/game/huntGenerator.ts         GPS arc sampling, ghost priority
app/game/polyRunEngine.ts         Game state engine
app/game/types.ts                 TypeScript types
app/store/useGameStore.ts         Zustand store
app/screens/GameScreen.tsx        Play HUD + background
app/screens/HomeScreen.tsx        Arcade lobby
app/screens/VaultScreen.tsx       Player archive + Ranks
app/screens/ResultsScreen.tsx     End-of-run results
app/screens/DailyChallengeScreen.tsx  Daily Challenge (5 rounds)
app/game/dailyChallengeEngine.ts  Daily session builder
app/game/dailyPool.ts             Daily word pool (tiered)
assets/data/huntData.json         403-word tile database
assets/images/Polly/polly_01-10.png   Polly poses
assets/sfx/                       Game SFX
docs/GOLDEN_PACING_SYSTEM.md      GPS source of truth
docs/DAILY_CHALLENGE_SPEC.md      Daily Challenge approved spec
docs/POLLY_DIALOGUE_BANK.md       Polly dialogue source of truth
tools/content/mask-rewriter       Local-only content tool — never wire into the app
```

---

*POLYWORDS CLAUDE.md · Pete DiBari · June 26, 2026*
