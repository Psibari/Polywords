# POLYWORDS — CLAUDE.md
### Ground Truth for Claude Code · Updated June 5, 2026

---

## The Game in One Sentence

A word appears. Meaning masks appear — some real, some traps. Swipe UP on real meanings. Swipe RIGHT to call out traps. Perfect clear unlocks the Master Gate, which drops two final tiles to play.

---

## Emotional Core

> *"Wait… what? … Shit, that's right."*

Every mechanic, word, trap, tile, animation, and sound exists to serve this moment. If it doesn't create hesitation → recognition → reward, it's cut.

---

## Tech Stack

```
Runtime:        Expo SDK (managed workflow)
Language:       TypeScript (strict)
Framework:      React Native
State:          Zustand + immer middleware
Animation:      React Native Animated API
Haptics:        Expo Haptics
Audio:          Expo AV (generated WAV synthesis)
Navigation:     Expo Router
Fonts:          Bagel Fat One (hero word) · Plus Jakarta Sans 800 (all UI)
Testing:        Expo Go via QR code on physical device
Version control: Git + GitHub
Editor:         VS Code (Windows — use forward-slash paths)
```

---

## Palette — Royal Word Game (Strict)

| Token | Hex | Use |
|---|---|---|
| Indigo background | `#1E1A3A` | Screen background |
| Tile idle | `#1E1C4A` | Unswiped tile |
| Tile special | `#251F4A` | Switchback clues, split tiles |
| Gold | `#F5C842` | Correct tiles, reward moments, gate unlock |
| Polly green | `#4CAF50` | Polly mascot + correct swipe particles ONLY |
| Wrong red | `#CC2200` | Wrong swipe flash ONLY — never decorative |
| Purple | `#7B2D8B` | Accent, trap shards, rare events |
| Rose | `#9B2D6B` | Ghost gate border, trap shards |
| Gate background | `#0F0D2A` | Master Gate tile ONLY |
| Navy border | `#1A1830` | Tile border + shadow |
| White text | `#FFFFFF` | All tile text |

**Two golds max per screen. No new colors without Pete's sign-off.**
**Red is wrong-swipe flash only — never on a tile before it's swiped.**

---

## Typography

| Element | Font | Size |
|---|---|---|
| Hero word — normal | Bagel Fat One | ~52px |
| Hero word — Boss | Bagel Fat One | 72-76px |
| Switchback answer words | Bagel Fat One | 28px |
| Phrase Break phrase | Bagel Fat One | 36px |
| Tile text | Plus Jakarta Sans 800 | 16px |
| Polly speech | Plus Jakarta Sans 800 | 18px |
| Kicker labels | Plus Jakarta Sans 800 | 11px, letterSpacing 3 |
| Master Gate text | Bagel Fat One | 16px |

---

## Current Build Status

### ✅ Built and Working — Passes 1–7

**Core mechanics**
- 12-word session (updated from 10)
- Swipe UP = real meaning, swipe RIGHT = trap — universal, no taps anywhere
- Tile states: gold lock (correct), red buzz + shake (wrong), shatter + collapse (trap)
- Staggered tile mount — 80ms per tile default, per-word overrides via `tileStagger`
- Hero word fade + scale on transition
- Progress dots — gold/white/dim, scales to session length
- 5-life system (hearts)
- Score + combo multiplier system

**Round types — all built and swiping**
- Standard Meaning Mask Blitz ✅
- Boss Word (smash entrance, screen shake, gold sweep, 76px) ✅
- Boss Entrance Choreography (Pass 8) ✅ — squash/stretch on fall + impact (bossScaleX/bossScaleY, non-native rAF), ignite flash white→gold over 150ms (setState), shockwave rings + dust overlay (BossShockwave component, rAF-driven)
- Phrase Break (full screen, phrase rises, swipe-up answers) ✅
- Slang Drop (record scratch, era badge, swipe mechanic) ✅
- Switchback (two clues from opposite sides, 2-attempt logic) ✅

**Master Gate (Pass 7) ✅**
- Sits locked on board every word
- On PERFECT CLEAR (all masks UP correct + all traps RIGHT correct + zero wrong swipes):
  gate opens automatically — no player swipe needed
- Gate drops TWO tiles to center of board: one real hidden meaning + one trap
- Player swipes both tiles before word advances
- Both correct → +300, haptic Success, Polly gateMastered
- Wrong swipe → life penalty
- Non-perfect → gate stays locked, auto-advance 1400ms, ghosted master stored
- Polly intro line fires ONCE ever on first gate appearance: "Only with a Perfect sweep — or it will come back to haunt you." (AsyncStorage: `polywords_hasSeenGateIntro`)

**Ghost system ✅**
- Missed real meanings → regular ghost tiles (dashed rose border, definition visible)
- Unmastered Master Gate → ghosted master (locked gate UI, `#9B2D6B` rose border, no definition ever visible)
- Ghost gate haunts next word's board, player can master it there
- Both ghost types are separate render paths — never mixed

**Other**
- Sound system via SoundEngine.ts (generated WAVs)
- Polly 9-pose sprite (3×3 grid), 6 states wired to game events
- WORD text overlays Polly's chest/lower body — face always visible above
- Ghost tint overlay on Polly — purple tint when ghost present, default opacity 0
- `gateTriggeredRef` resets on every new word mount
- Repo cleaned — 8 dead files deleted (ClueCard, TruthStream, RevealSequence, ReversedBuild, MaskTile, MaskGrid, GameController, wordBank)

### 🔴 Known Bugs (active)
- Purple box sometimes visible behind Polly — source in MaskBoard ghost tint View, ghostVisible not resetting cleanly
- Master meaning text occasionally leaking into ghost tile as readable text
- Gate tile can disappear when regular tiles clear (render condition issue)

### ⏳ In Progress (this session)

- (none — carrying into next session)

### ❌ Not Yet Built
- Timer / pressure system
- Results screen redesign
- Heartbeat System (Pass 9)
- Full Polly Lines + Triggers (Pass 10) — 18 lines, full trigger map
- Sound Design full implementation (Pass 11) — 15 audio files
- Bottom Navigation (Pass 12) — 4 tabs
- Home Screen + Splash (Pass 13)
- Supabase persistence
- The Garden

---

## Swipe System (Universal)

- **Swipe UP** → claim as real meaning
  - Correct: gold lock, tile stays on screen
  - Wrong: red buzz + shake, flies off top, life lost
- **Swipe RIGHT** → call it a trap
  - Correct: shatter + collapse (purple/rose shards)
  - Wrong: red buzz, flies right, life lost
- **No left swipe exists in this game**
- **All screens use swipe — never tap**
- **No directional arrows on tiles in live play** — onboarding only

---

## Master Gate — Full Spec

```
LOCKED state:
  backgroundColor: '#0F0D2A'
  border: 2px solid rgba(245,200,66,0.45)
  height: 76px
  text: 'MASTER THE WORD' — Bagel Fat One 16px, gold 65% opacity
  breathing pulse on text: 0.65→0.45, 2400ms loop
  No swipe gesture. Dormant.

UNLOCK (auto on perfect clear):
  Phase 1 T+0ms: lock icon bounces, rotates
  Phase 2 T+200ms: border opacity → 100%, text → full opacity
  Phase 3 T+400ms: Polly colors sweep border 360°, 800ms
  Phase 4 T+600ms: Haptics.impactAsync(Heavy)
  Phase 5 T+800ms: onGateOpened() fires automatically

TILE DROP (onGateOpened):
  Two SwipeMask tiles spawn at gate position
  Spring down to center of tile zone:
    translateY: gateY → centerY
    damping: 12, stiffness: 120
    stagger: 80ms
  Tile 1: real hidden meaning (swipe UP)
  Tile 2: trap (swipe RIGHT)
  Both swiped → store.completeWord() after 800ms
  Both correct → +300, notificationAsync(Success), Polly gateMastered

NON-PERFECT:
  Gate stays locked.
  store.addGhostedMaster(word) — word string only, no text
  setTimeout 1200ms → store.completeWord()

GHOST GATE (haunted):
  backgroundColor: '#0F0D2A'
  borderColor: '#9B2D6B' (rose)
  borderStyle: 'dashed'
  text: 'MASTER THE WORD'
  NO definition text ever
  Same unlock rules — perfect clear on this word unlocks it
```

---

## Layout Spec (Current Target)

```
HUD — single compact row:
  Row 1: SCORE left · STREAK center · LIVES right
  Row 2: progress dots full width
  Total height: 44px
  No card containers — transparent backgrounds

WORD ZONE:
  Full width, centered
  Font: Bagel Fat One, ~52px gold
  No border/box around it
  Fixed height: 80px
  Nothing encroaches

TILE ZONE:
  Maximum available vertical space
  Full width minus 32px padding
  Tile height: 58px fixed
  Gap between tiles: 6px
  backgroundColor: #1E1C4A
  border: 1px solid rgba(255,255,255,0.12)
  borderRadius: 12
  text: Plus Jakarta Sans 800, 16px, white

POLLY — permanently bottom-left:
  position: absolute
  bottom: 34
  left: 12
  width: 80, height: 80
  overflow: 'hidden'
  Never moves. Pose + dialogue bubble only.

MASTER GATE — bottom of tile stack:
  height: 76px
  backgroundColor: '#0F0D2A'
  border: 2px solid rgba(245,200,66,0.45)
  borderRadius: 12
```

---

## Visual Effects Spec

### Trap Shatter (swipe RIGHT correct)
```
Tile: translateX 0→400, opacity 1→0, 260ms ease-in

10 shards at tile position:
  Colors: '#7B2D8B' and '#9B2D6B' alternating
  Size: 8-16px × 4-8px, borderRadius: 2
  Angles: radially distributed, bias right
  Distance: 55-90px per shard
  Rotation: 90-360deg
  opacity: 1→0, scale: 1→0.1
  Duration: 380ms ease-out, stagger 0-50ms
  useNativeDriver: true

Haptics.impactAsync(Heavy) on shatter
Auto-remove after 450ms
```

### Correct Swipe Trail (swipe UP correct)
```
12 particles at tile center:
  color: '#4CAF50'
  size: 4-7px, borderRadius: 50%
  Direction: upward, spread ±50° from vertical
  Distance: 50-80px
  opacity: 1→0, scale: 1→0
  Duration: 320ms ease-out, stagger 0-25ms
  useNativeDriver: true

Tile brief flash: backgroundColor → #2d6e3a 80ms
  then settles to #1a3520
```

### Shard Overlay Architecture
```
GameScreen: absolute View top/left/right/bottom 0
  pointerEvents: 'none'
  zIndex: 100
All shards and particles render here only
Never inside tile tree
```

---

## Animation Rules — Non-Negotiable

```
useNativeDriver: true  → transform + opacity ONLY
useNativeDriver: false → height, margin, backgroundColor ONLY
NEVER mix on same Animated.Value
Use setTimeout between animation phases — never chained .start() callbacks
Never .start() callbacks for sequencing
```

---

## Session Structure (12 words — Arc Law)

Session length: **12 words**. Follows strict emotional arc law — every position has a job.

| # | Word | Type | Emotional Beat | Haptic | Stagger |
|---|---|---|---|---|---|
| 1 | LIGHT | Standard | CONFIDENCE — easy, introduces mechanic | light | 80ms |
| 2 | BARK | Standard | FLOW — streak starts, rhythm sets | light | 80ms |
| 3 | MATCH | Standard | FIRST TENSION — close traps, first hesitation | medium | 80ms |
| 4 | COLD | Switchback | DISRUPTION — format flips, brain glitch | medium | — |
| 5 | [PHRASE BREAK] | Phrase Break | RELIEF — curiosity, low stakes, breathe | light | — |
| 6 | RAW | Slang Drop | FRESHNESS — cultural snap, guard down | medium | — |
| 7 | WAKE | Standard | ESCALATION — streak rebuilding, traps closer | medium | 80ms |
| 8 | PITCH | Standard | HESITATION — hardest traps, first near-miss | medium | 80ms |
| 9 | SPRING | Boss | FIRST CLIMAX — earned, 2× score, full entrance | heavy | 100ms |
| 10 | BANK | Standard | REBOUND — generous after Boss, riding high | medium | 80ms |
| 11 | STRIKE | Switchback | LATE SHOCK — second format flip surprise | medium | — |
| 12 | ORDER | Boss | FINAL BOSS — everything on the line | heavy | 100ms |

**Arc Law — non-negotiable:**
- Bosses at positions 9 and 12 ONLY — never before position 9
- Switchbacks at positions 4 and 11 — disruption bookends
- Phrase Break at 5 — relief must follow disruption
- Slang Drop at 6 — freshness while guard is down
- Positions 1-3 are always easy/medium standard words
- Positions 7-8 escalate difficulty before the first Boss
- Position 10 is always generous — rebound after Boss pressure

**Switchback IDs:**
- Position 4: `switchback_cold` — "Left out on purpose" / "Fever's uninvited guest"
- Position 11: `switchback_strike` — "Lightning does it" / "Bowler's perfect throw"

---

## File Structure (Current — dead files removed)

```
poly-words/
├── app/
│   ├── components/
│   │   ├── GhostTile.tsx
│   │   ├── HeartbeatBackground.tsx
│   │   ├── MaskBoard.tsx           ← main board
│   │   ├── MasterGateTile.tsx      ← Pass 7
│   │   ├── PhraseBreakScreen.tsx
│   │   ├── PollyCard.tsx
│   │   ├── PollyController.tsx
│   │   ├── ScoreFloat.tsx
│   │   ├── SlangDropScreen.tsx
│   │   ├── StreakDisplay.tsx
│   │   ├── SwipeMask.tsx           ← tile component
│   │   ├── SwitchbackScreen.tsx
│   │   └── ui/
│   │       └── PollySprite.tsx
│   ├── constants/
│   │   ├── animations.ts
│   │   └── fonts.ts
│   ├── game/
│   │   ├── polyRunEngine.ts
│   │   ├── polyRunEngine.test.ts
│   │   ├── session.ts              ← word data
│   │   └── types.ts
│   ├── hooks/
│   │   ├── useHeartbeat.ts
│   │   └── usePollyAnimator.ts
│   ├── logic/
│   │   └── pollyBudget.ts
│   ├── screens/
│   │   ├── GameScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── ResultsScreen.tsx
│   └── store/
│       └── useGameStore.ts
└── app/utils/
    └── SoundEngine.ts
```

**Dead files removed:** ClueCard, TruthStream, RevealSequence, ReversedBuild, MaskTile, MaskGrid, GameController, wordBank

---

## Polly — Character System

**Who she is:** Green parrot, explorer hat, orange beak, purple bandana with W. Smart, slightly smug, one step ahead. Adult-coded. Never childlike.

**Position:** Always bottom-left. Never moves. `position: absolute, bottom: 34, left: 12`

**9-pose sprite (3×3 grid):**
Each pose = 1/3 of sprite width and height.
Crop via parent View overflow:hidden + Image offset.

**State map:**
| State | Pose | Trigger |
|---|---|---|
| Idle | BOT_LEFT | Default, between words |
| Correct | BOT_LEFT bounce | First correct swipe per word |
| Wrong | MID_CENTER recoil | Wrong swipe |
| Way wrong | BOT_CENTER laugh | 3+ wrong same word |
| Ghost entry | TOP_CENTER sway | Ghost tile appears |
| Gate mastered | BOT_LEFT big bounce | Gate split both correct |
| Boss entry | TOP_RIGHT scale pop | Boss word mounts |
| 1 heart left | TOP_RIGHT alarmed | Hearts drop to 1 |
| Game over | BOT_RIGHT mind blown | Lives exhausted |

**Line rules:**
- Never jargon ("Clean split", "Pick carefully")
- "Word up." — max 0-2 per run, first correct swipe only
- Slang Drop: "Language moves."
- Phrase Break: "Tiny detour. Big meaning."
- Switchback: "One word. Two lives."
- Gate intro (once ever): "Only with a Perfect sweep — or it will come back to haunt you."

---

## Scoring

| Event | Score |
|---|---|
| Correct meaning | +100 × combo |
| Master Gate split both correct | +300 bonus |
| Phrase Break correct | +150 bonus |
| Switchback first attempt | +200 bonus |
| Switchback second attempt | +100 bonus |
| Wrong swipe | Combo resets to ×0 |
| Boss Word | All scoring × 2 |

---

## Design Principles (Ranked)

1. Fair traps — tempting but not cheap
2. Semantic tension — player must hold two meanings at once
3. Mobile arcade pacing — fast, rhythmic, punchy
4. Replayability — near-miss > grind > unlock
5. Master Gate — earned, not given
6. Ghost tiles — missed meanings haunt next run
7. Sharp reveal — the "oh wait" snap must land
8. Juice — haptics, sound, animation all sync
9. Content quality — no fake meanings
10. Streak pressure — momentum feels physical

---

## Anti-Patterns (Never)

- ❌ Left swipe — doesn't exist
- ❌ Tap instead of swipe — all interaction is swipe
- ❌ Directional arrows on tiles in live play — onboarding only
- ❌ Jargon in Polly lines
- ❌ More than 2 gold elements on screen simultaneously
- ❌ Red as primary color or tile state before swipe
- ❌ Dashed borders on regular tiles
- ❌ Circular Polly crop
- ❌ useNativeDriver mixing on same Animated.Value
- ❌ Definition-style tile text (no dictionary language)
- ❌ Vocabulary quiz framing
- ❌ Master meaning text visible in ghost tiles
- ❌ Polly moving position between game states
- ❌ Gate as a swipeable tile — it auto-opens

---

## Claude Code Conventions

- Always `tsc --noEmit` after every change — must exit 0
- Confirm exact file paths before editing — never assume structure
- `useNativeDriver: false` → height/margin/backgroundColor only
- `useNativeDriver: true` → transform/opacity only
- Never chain both drivers on same Animated.Value
- Use `setTimeout` to separate animation phases — never `.start()` callbacks
- All new screens: check `step.kind` or `step.eventType` for routing
- Swipe mechanic only — never add tap handlers to answer tiles
- Read the relevant file fully before touching it
- Surgical prompts — one concern at a time

---

*POLYWORDS CLAUDE.md · Pete DiBari · June 4, 2026*
