# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# POLYWORDS — CLAUDE.md
### Living Game Design Document · Updated May 2026

---

## What This Is

This is the authoritative reference for anyone (human or AI) working on POLYWORDS. It reflects the current built state, locked decisions, open work, and design principles. It is not a vision document — it is a map of what exists and what comes next.

**Do not treat this as gospel. Pete corrects it. Updates happen after sessions.**

---

## The Game in One Sentence

A word appears. Meaning masks appear — some real, some traps. Swipe UP on real meanings. Swipe RIGHT to call out traps. Find all real meanings to unlock the hidden one.

---

## Emotional Core

> *"Wait… what? … Shit, that's right."*

Every mechanic, word, trap, tile, animation, and sound exists to serve this moment. If it doesn't create hesitation — recognition — reward, it's cut.

---

## Tech Stack

```
Runtime:         Expo SDK (managed workflow)
Language:        TypeScript (strict)
Framework:       React Native
State:           Zustand
Animation:       React Native Animated (not Reanimated — current build uses Animated API)
Haptics:         Expo Haptics
Audio:           Expo AV (generated WAV synthesis — no external audio files yet)
Navigation:      React Navigation (native stack)
Fonts:           Bagel Fat One (hero word) · Plus Jakarta Sans 800 (all UI text)
Testing:         Expo Go via QR code on physical device
Version control: Git + GitHub via Git Bash
Editor:          VS Code
```

---

## Commands

```bash
npx expo start          # Start dev server, scan QR to open in Expo Go
npx tsc --noEmit        # Type check — must exit 0 before testing on device
npx ts-node app/game/polyRunEngine.test.ts   # Run engine unit tests (console output)
```

---

## Palette — Royal Word Game (Strict)

| Token | Hex | Use |
|---|---|---|
| Indigo background | `#1E1A3A` | Screen background |
| Tile idle | `#2A2560` | Unswiped tile background |
| Tile special | `#251F4A` | Hidden meaning split tiles |
| Gold | `#FFD700` | Correct tiles, progress dots, kicker labels ONLY |
| Polly green | `#4CAF50` | Polly mascot, HIDDEN MEANING border pulse |
| Wrong red | `#CC2200` | Wrong swipe flash |
| Navy border | `#1A1830` | Tile sticker border + shadow |
| White text | `#FFFFFF` | All tile text |
| White dim | `rgba(255,255,255,0.85)` | Polly speech text |
| White ghost | `rgba(255,255,255,0.25)` | Remaining progress dots |

**Two golds max per screen.** Gold only on: correct tile fill, progress dots (completed), round type kicker.
**No new colors without Pete's sign-off.**

---

## Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Hero word (BARK, SPRING…) | Bagel Fat One | 400 | ~52px |
| Tile text | Plus Jakarta Sans | 800 ExtraBold | 20px |
| Score, combo, labels | Plus Jakarta Sans | 800 ExtraBold | varies |
| Polly speech | Plus Jakarta Sans | 800 ExtraBold | 14px |
| Find-meter label | Plus Jakarta Sans | 800 ExtraBold | 10px |

---

## Current Build Status

### ✅ Built and Working
- Game loop — 15-word Poly Run session fully wired
- Tile swipe system — swipe UP = claim real meaning, swipe RIGHT = call trap
- Tile states — gold lock (correct), red buzz + collapse (wrong), shatter (trap caught)
- Sticker tile treatment — 2px navy border, 5px hard black shadow
- Bagel Fat One + Plus Jakarta Sans fonts loaded
- Progress dots — 15 dots across top bar, gold/white/dim states
- Hearts separated from round counter
- Polly Card + Find-Meter — between hero word and tile stack
- HIDDEN MEANING tile — pulsing green/gold border, sits above tile stack
- Cinematic split sequence — perfect clear triggers 10-step animation
- Hidden meaning split tiles — ✨ badge, gold border, special dark background
- Sound system — correct tap, wrong buzz, shatter crunch, split reveal, round complete (generated WAV)
- LogBox disabled in playtest builds
- Mask language upgraded — all 15 words with sharp 2-4 word masks
- Emoji upgraded — 111 fields, no repeats, Fluent 3D ready
- Staggered tile mount — 80ms per tile, board comes alive
- Hero word fade+scale on word transition
- 5 lives system
- Ghost tile system — missed meanings carry to next run
- Polly character images — 6 expressions cropped from polly3.png (needs better implementation)

### ⚠️ In Progress / Needs Fix
- Results screen — red dot shows on complete words (should be green), perfect count wrong
- Polly image in pill — current circular crop doesn't work, punted
- Fluent 3D emoji — CDN fallback still firing, native emoji showing
- SPRING tile count — still 7 tiles, needs audit
- Near-miss reveal copy on results screen
- "Word up." protection — needs limiting to 0-2 per run, boss perfect only
- Tile shuffle — real meanings still grouping at top visually

### ❌ Not Yet Built
- Timer / pressure system
- Results screen redesign (per critique)
- Chip-stack collapse for solved tiles
- Polly character animation / sprite
- Home screen with real Polly
- Scholar's Cave / mastery system
- Streak freeze / recovery window
- Session arc enforcement (emotional pacing locked by position)

---

## Architecture

### Data flow
```
session.ts (static word/mask data)
    ↓
polyRunEngine.ts (pure state machine — no side effects)
    ↓
useGameStore.ts (Zustand store wrapping engine functions)
    ↓
MaskBoard.tsx (UI — reads store, owns all animation state locally)
```

**The engine (`polyRunEngine.ts`) is a pure function state machine.** Every action (`submitSwipeUp`, `submitSwipeDown`, `revealHidden`, `completeWord`, `submitPhraseAnswer`) takes a `GameState` and returns a new `GameState`. No mutation, no side effects. All animation and UI state lives in `MaskBoard.tsx` local React state.

**`useGameStore`** is a thin Zustand wrapper — each action calls the engine function and replaces `game` with the returned state.

**`MaskBoard.tsx`** is the most complex file. It owns:
- Per-tile swipe states (`tileStates` Map)
- All `Animated.Value` refs for the cinematic split sequence (10-step)
- The hidden meaning phase machine (`visible` → `locked` → `split`)
- Score float spawn logic
- Completion detection and word advancement trigger

### Session structure
`session.ts` exports a fixed 15-step array (`SESSION`). Steps are either `WordStep` or `PhraseBreakStep` (discriminated by `kind`). No randomization of order. Masks within each word are shuffled on `createGame()` and stored in `GameState.shuffledMasks` keyed by step index.

### Animation constraint
Height/margin animations: always `useNativeDriver: false`.
Transform/opacity animations: always `useNativeDriver: true`.
Never chain these in the same `Animated.parallel`. Use `setTimeout` to separate phases instead of `.start()` callbacks where phase boundaries cross driver types.

---

## Core Mechanics

### Swipe System
- **Swipe UP** — claiming it's a real meaning
  - Correct: gold lock, stays on screen, +score
  - Wrong: red buzz, shake, flies off top, collapses
- **Swipe RIGHT** — calling it a trap
  - Correct trap: shatter animation, collapses, gone
  - Wrong (swiped right on real meaning): red buzz, flies right, collapses
- **No left swipe exists in this game**

### Tile Types
| Type | Visual | Behavior |
|---|---|---|
| Real meaning | Idle dark blue | Gold lock on correct UP swipe |
| Trap | Idle dark blue (identical) | Shatter on correct RIGHT swipe |
| Hidden meaning (during round) | Dark bg, green/gold pulsing border, "✨ HIDDEN MEANING" text | Locked, untouchable until perfect clear |
| Split tile (after perfect clear) | `#251F4A` bg, gold border, ✨ badge | Live SwipeMask — UP for real, RIGHT for trap |

### Hidden Meaning System
1. "✨ HIDDEN MEANING" tile sits between PollyCard and tile stack during round
2. Pulsing border: `#4CAF50` → `#FFD700` loop, 2s cycle
3. First wrong swipe → tile dims, border goes grey, Polly: "Locked."
4. **Perfect clear earned** → 10-step cinematic sequence:
   - 400ms pause
   - Tile pulses 3×
   - Floats up 8px
   - Screen dims (20% overlay)
   - ScaleX squeeze to 0
   - HIDDEN MEANING tile collapses to height 0
   - Two split tiles slam in with stagger
   - Dim overlay fades
   - Both tiles pulse borders
   - `playSplitReveal()` fires + Polly: "Hidden. Worth it."
5. Both split tiles judged correctly → +300, haptic success, Polly: "Clean split."
6. Wrong on either → -1 life, haptic error

### Scoring
- Correct swipe up → +100 × combo multiplier
- Hidden split both correct → +300 bonus
- Wrong swipe → combo resets to ×0
- Combo ×1 → ×2 → ×3… etc. on consecutive corrects

### Lives
- 5 lives per run
- Wrong swipe = no life lost (just combo reset)
- Full word failure / specific conditions → life lost (TBD — needs audit)

---

## 15-Word Session Data

| # | Word | Type | Real Meanings | Traps |
|---|---|---|---|---|
| 1 | BARK | Normal | 3 | 2 |
| 2 | SPRING | Boss | 3 | 3 |
| 3 | LIGHT | Speed | 4 | 2 |
| 4 | BANK | Hesitation | 4 | 2 |
| 5 | WAKE | Normal | 2 | 3 |
| 6 | MATCH | Hesitation | 3 | 2 |
| 7 | SOUND | Surprise | 4 (2 hidden) | 3 |
| 8 | PHRASE BREAK | — | "Spill the beans" trivia | — |
| 9 | WAVE | Relief | 2 | 2 |
| 10 | ROCK | Slang Drop | 4 (incl. slang) | 2 |
| 11 | WELL | Word Lore | 3 | 2 |
| 12 | FINE | Decoy Heavy | 4 | 2 |
| 13 | SICK | Era Snap | 2 (old + modern slang) | 2 |
| 14 | CAN | Speed | 2 | 2 |
| 15 | ORDER | Boss/Final | 4 | 3 |

Each word has a `hiddenMeaning` + `hiddenTrap` that appear only on perfect clear.
Example: BARK → hidden real: "Old ship's hull" (⛵) / hidden trap: "Crowd's roar" (📣)

---

## Mask Language Standard

**The tile text must be:**
- 2-4 words maximum
- Visual, tactile, or emotional — not academic
- Slightly tricky but fair
- Built for hesitation
- Clear after reveal
- Distinct from nearby decoys

**Examples of correct mask language:**
- ✅ "Tree's tough skin" (BARK)
- ✅ "Dog's sharp cry" (BARK)
- ✅ "Snap a command" (BARK)
- ❌ "The outer covering of a tree" (too long, too clinical)
- ❌ "Sound a dog makes" (too obvious, no hesitation)

---

## Polly — Brand & Character

**Who she is:** A green parrot with oversized golden goggles, explorer hat, rainbow tail feathers, gold P-chain medallion. Smart, slightly smug, always one step ahead. Adult-coded. Never childlike.

**Six expression images (cropped from polly3.png):**
| File | Expression | Used for |
|---|---|---|
| polly_letsPlay.png | Friendly gesture | Session start |
| polly_knowing.png | Open beak, forward | Round start |
| polly_clever.png | Finger to beak | Correct tap |
| polly_thinking.png | Smug side-eye | Wrong tap |
| polly_wordUp.png | Pointing up | Perfect clear / boss |
| polly_reading.png | Reading book | Boss word |

**Current pill implementation:** Expression images in circular crop — not working well. Planned: Polly banner card (half-body left, text right, ~90px tall). Full Rive animation when approaching launch.

**Future vision (not yet built):**
Polly sits at top of screen as live character. Master word overlaid across her body. Perfect clear — she physically drops the hidden meaning tile down toward the tile stack.

**Polly speech lines follow this pattern:**
- Round start: "Three real, two fakes." (factual count, always)
- Never jargon like "Clean split" or "Pick carefully"
- "Something's hiding in this one." — kept (atmospheric, not jargon)
- "Word up." — RARE, max 0-2 per run, boss perfect clear only (not yet enforced)

---

## UI Layout (Current Screen Structure)

```
┌─────────────────────────────────┐
│  ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●  │  ← 15 progress dots
│  SCORE    ❤❤❤❤❤    COMBO       │  ← top bar
│  950                  x7        │
├─────────────────────────────────┤
│                                 │
│          B A R K                │  ← Bagel Fat One hero word
│                                 │
│  [🦜  Three real, two fakes.]   │  ← Polly Card (pill)
│  0 OF 3 REAL MEANINGS FOUND     │  ← Find-meter
│  ──────────────────             │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ✨ HIDDEN MEANING       │    │  ← Locked tile, pulsing border
│  └─────────────────────────┘    │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🪵  Tree's tough skin     │  │  ← Tile (staggered entry, 80ms)
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 🐕  Dog's sharp cry       │  │
│  └───────────────────────────┘  │
│  ... more tiles ...             │
└─────────────────────────────────┘
```

---

## Sound System

All sounds generated as base64 WAV via `SoundEngine.ts` — no external files.

| Event | Sound | Character |
|---|---|---|
| Correct swipe up | `playCorrectTap()` | 880Hz→1100Hz sine sweep, 120ms |
| Wrong swipe | `playWrongBuzz()` | Square wave 120Hz, 180ms |
| Trap shatter | `playShatter()` | White noise burst + pitch drop, 250ms |
| Split reveal | `playSplitReveal()` | Two-tone ascending sweep, 350ms |
| Round complete | `playRoundComplete()` | 3-note C-E-G resolution |

Meter tick sound removed — correct tap handles that feedback.

---

## Haptics

| Event | Haptic |
|---|---|
| Correct swipe | `Haptics.impactAsync(Medium)` |
| Wrong swipe | `Haptics.impactAsync(Heavy)` |
| Hidden split both correct | `Haptics.notificationAsync(Success)` |
| Hidden split wrong | `Haptics.notificationAsync(Error)` |

---

## Design Principles (Ranked)

1. **Fair traps** — tempting but not cheap
2. **Semantic tension** — player must hold two meanings at once
3. **Mobile arcade pacing** — fast, rhythmic, punchy
4. **Replayability** — near-miss > grind > unlock
5. **Boss words** — rare words with 3-4 meanings, elevated stakes
6. **Ghost tiles** — missed meanings haunt the next run
7. **Sharp reveal** — the "oh wait" snap must land every time
8. **Juice** — haptics, sound, animation all sync
9. **Content quality** — no fake meanings, no unfair obscurity
10. **Streak pressure** — momentum should feel physical

---

## Seven Replay Triggers (Design Bible)

| Trigger | Status | Notes |
|---|---|---|
| Variable reward schedule | ✅ Partial | Boss words, hidden meaning, slang drops in session |
| Near-miss effect | ⚠️ Partial | Results show missed meanings, not WHY trap fooled |
| Zeigarnik effect | ✅ Built | Ghost tile system wired |
| Micro-progression | ⚠️ Partial | Score + combo work, no in-round streak feedback yet |
| Loss aversion + comeback | ❌ Not built | No streak freeze or recovery window |
| Social proof / FOMO | ❌ Not built | Later |
| Juice and feedback | ⚠️ Partial | Sounds + haptics in, Polly reactions partial |

---

## Emotional Arc Per Word (Design Target)

| Moment | Player Feeling | Design Cause |
|---|---|---|
| Word appears | Confidence | Familiar word |
| Tiles appear | Doubt | More meanings than expected |
| First correct tap | Validation | Fast reward |
| Close trap appears | Hesitation | Near-association challenges certainty |
| Wrong tap | Regret | Player sees exactly how they were fooled |
| Rare meaning reveal | Surprise | Word feels deeper |
| Perfect clear | Pride + revenge itch | Invites one more try |

---

## Content Rules

- Never invent fake meanings — all meanings must be real and attested
- Flag obscure, outdated, regional, or offensive content
- Traps must be tempting — not obviously wrong, not unfairly obscure
- Slang meanings require `isSlang: true` + `era` field
- Hidden meanings require `isHidden: true`
- SOUND: two hidden meanings on one tile is a valid pattern
- FINE: 4 real + 2 traps max (was 5 traps, reduced for mobile)
- ORDER: "Restaurant request" kept as trap with `borderline: true`

---

## Word Database

739 polysemous English words. Source: `POLYWORDS_Master_Database_739_CLEAN_2.xlsx`
- Double meanings = Common
- Triple meanings = Uncommon
- Quad meanings = Rare / Boss

---

## Next Priorities (In Order)

1. **Results screen** — fix red dot on complete words, fix perfect count, add near-miss reveal copy
2. **Tile shuffle** — randomize order, real meanings should not cluster at top
3. **SPRING tile count** — currently 7 tiles, needs trimming to 6
4. **"Word up." protection** — limit to boss perfect clear only
5. **Polly banner card** — replace circular crop with proper half-body card
6. **Near-miss reveal copy** — tell player exactly which trap fooled them and why
7. **Streak feedback in-round** — visual/haptic escalation as combo builds

---

## Anti-Patterns (Never Do These)

- ❌ Left swipe — doesn't exist in this game
- ❌ Tiles that tap instead of swipe
- ❌ Jargon in Polly lines ("Clean split", "Pick carefully")
- ❌ More than 2 gold elements on screen simultaneously
- ❌ Red as a primary color — only for wrong-tap flash
- ❌ Dashed borders (looks 8-bit, use solid pulsing border instead)
- ❌ Circular Polly crop — kills character
- ❌ Tile overlap during animations — `outerHeightAnim` must collapse properly
- ❌ `useNativeDriver` mixing between phases (height = false, transform = true)
- ❌ Dev error toasts in playtest builds (LogBox.ignoreAllLogs() already set)
- ❌ Generic emoji — no 🪵 on multiple tiles, no face emoji for meanings
- ❌ Vocabulary quiz framing — this is a polysemy game, not a definition-matching game

---

## File Structure (Current)

```
poly-words/
├── app/
│   ├── components/
│   │   ├── FluentEmoji.tsx       # CDN emoji with native fallback
│   │   ├── MaskBoard.tsx         # Main game board, tile layout, hidden meaning
│   │   ├── PollyCard.tsx         # Polly image + speech pill + find-meter
│   │   ├── PollyController.tsx   # Line budget + trigger system
│   │   └── SwipeMask.tsx         # Individual tile — swipe, animate, states
│   ├── game/
│   │   ├── polyRunEngine.ts      # Pure function game state machine
│   │   ├── polyRunEngine.test.ts # Console-based unit tests
│   │   ├── session.ts            # 15-word session data (static)
│   │   └── types.ts              # WordStep, Mask, SessionStep types
│   ├── store/
│   │   └── useGameStore.ts       # Zustand store wrapping engine functions
│   ├── screens/
│   │   ├── GameScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── ResultsScreen.tsx
│   └── utils/
│       └── SoundEngine.ts        # Generated WAV synthesis
├── App.tsx                       # Root — navigation + font loading
└── index.ts                      # Expo entry point
```

---

## Claude Code Conventions

- Always specify `tsc --noEmit` check at end of every prompt
- Specify exact file paths when known
- Reference exact mask IDs from `session.ts` (always confirm IDs first)
- Separate `useNativeDriver: true` animations from `useNativeDriver: false` — never chain them
- Height/margin animations always `useNativeDriver: false`
- Transform/opacity animations always `useNativeDriver: true`
- Use `setTimeout` not `.start()` callback chains to separate phases
- Never mix phases — Phase 1 completes, Phase 2 starts in setTimeout
- `tsc --noEmit` is the clean check — must exit 0 before testing on device

---

*Last updated: May 2026 · Pete Diba · POLYWORDS*
