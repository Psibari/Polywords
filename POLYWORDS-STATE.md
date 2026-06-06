# POLYWORDS — State of Project
*Source of truth for all chats. Update at end of every significant session.*
*Last updated: June 6, 2026*

---

## 1. CORE IDENTITY (never changes)

**What it is:** Mobile-first semantic arcade game. One word. Multiple meaning masks. Swipe real meanings UP, call traps RIGHT.

**Emotional core:** *"Wait… what? … Shit, that's right."*

**Session format:** POLY RUN — 12-word curated session. Pure standard Meaning Mask Blitz arc. All positions standard, Bosses close at 11 and 12. Results screen = emotional resolution + hunger for more.

---

## 2. TECH STACK (locked)

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK (managed workflow) |
| UI | React Native Animated API (primary) · Reanimated (SwipeMask.tsx ONLY — frozen) |
| Language | TypeScript strict mode |
| State | Zustand |
| Haptics | Expo Haptics |
| Audio | Expo AV (generated WAV synthesis via SoundEngine.ts) |
| Navigation | Expo Router |
| Fonts | Bagel Fat One (hero word) · Plus Jakarta Sans 800 (UI) |

**Animation rules:**
- `useNativeDriver:true` — transform, opacity only
- `useNativeDriver:false` — height, margin, backgroundColor only
- NEVER mix drivers on same Animated.Value
- NEVER use `.start()` callbacks between phases — use `setTimeout`
- Reanimated is LOCKED to SwipeMask.tsx only — no new usage anywhere else, ever
- Always run `tsc --noEmit` after every change — must exit 0

---

## 3. BRAND BIBLE (locked)

**Palette — Royal Word Game:**

| Token | Hex | Use |
| --- | --- | --- |
| Indigo bg | `#1E1A3A` | Screen background |
| Tile idle | `#1E1C4A` | Unswiped tile |
| Tile special | `#251F4A` | Split tiles |
| Gold | `#F5C842` | Correct tiles, reward moments, gate unlock |
| Polly green | `#4CAF50` | Polly mascot + correct swipe particles ONLY |
| Wrong red | `#CC2200` | Wrong swipe flash ONLY — never decorative |
| Purple | `#7B2D8B` | Trap shards, rare events |
| Rose | `#9B2D6B` | Ghost gate border, trap shards |
| Gate bg | `#0F0D2A` | Master Gate tile ONLY |
| Navy border | `#1A1830` | Tile border + shadow |
| White | `#FFFFFF` | All tile text |

Two golds max per screen. Red is wrong-swipe flash only — never on a tile before it's swiped.

**Polly (mascot):**
- Green parrot, explorer hat, orange beak, purple bandana with W
- Personality: smart, slightly smug, one step ahead — adult-coded, never childlike
- Always bottom-left: `position: absolute, bottom: 34, left: 12` — never moves
- 9-pose sprite (3×3 grid) — crop via overflow:hidden + Image offset
- Line rules: no jargon, no childlike tone, "Word up." max twice per run
- Gate intro (once ever, `polywords_hasSeenGateIntro`): *"Only with a Perfect sweep — or it will come back to haunt you."*

---

## 4. 12-WORD SESSION ARC (current)

Pure standard Meaning Mask Blitz — one mechanic, clean arc.

| # | Word | Type | Emotional Beat | Haptic | Stagger |
| --- | --- | --- | --- | --- | --- |
| 1 | LIGHT | Standard | CONFIDENCE — easy, introduces mechanic | light | 80ms |
| 2 | BARK | Standard | FLOW — streak starts, rhythm sets | light | 80ms |
| 3 | RING | Standard | FIRST TENSION — close traps, first hesitation | light | 80ms |
| 4 | MATCH | Standard | ESCALATION — difficulty rises | medium | 80ms |
| 5 | RAW | Standard | FRESHNESS — guard down, slang tile present | medium | 80ms |
| 6 | BEAR | Standard | HESITATION — semantic overlap, pause moment | medium | 80ms |
| 7 | WAKE | Standard | TENSION — streak pressure builds | medium | 80ms |
| 8 | PITCH | Standard | NEAR MISS — hardest standard traps | medium | 80ms |
| 9 | PRESS | Standard | PANIC — most tiles, highest pressure | medium | 80ms |
| 10 | BANK | Standard | REBOUND — generous after pressure peak | medium | 80ms |
| 11 | SPRING | Boss | FIRST CLIMAX — 2× score, full entrance | heavy | 120ms |
| 12 | ORDER | Boss | FINAL BOSS — everything on the line | heavy | 120ms |

Arc law: Bosses at 11 and 12 only. Positions 1–3 easy. 4–9 continuous escalation. 10 generous. 11–12 Boss.

---

## 5. LIVE MECHANICS (current build)

**Swipe system:**

- Swipe UP = claim as real meaning ✅
- Swipe RIGHT = call it a trap ✅
- No left swipe. No tap on answer tiles. Ever.

**Session engine:**

- `polyRunEngine.ts` — pure function state machine
- `useGameStore.ts` — Zustand store
- `GameStatus`: `'playing' | 'gameOver' | 'complete'`

**Tile system:**

- Real meaning tiles — gold lock on correct UP
- Trap tiles — shatter + collapse (purple/rose shards) on correct RIGHT
- Wrong swipe — red buzz + shake, flies off, −1 life
- Staggered mount: 80ms default, 120ms on Boss
- Master Gate tile — dormant locked tile at bottom of every board

**Master Gate:**

- Auto-opens on PERFECT CLEAR (zero wrong swipes, all masks judged)
- Drops two live SwipeMask tiles: one real hidden meaning (UP) + one trap (RIGHT)
- Both correct → +300 bonus, haptic Success, Polly gateMastered
- Non-perfect → gate stays locked, word auto-advances after 1400ms, ghost stored

**Ghost system:**

- Missed real meanings → regular ghost tiles (dashed rose border) on next word
- Unmastered Master Gate → ghosted master gate (rose dashed locked gate, no text ever)
- Both ghost types are separate render paths — never mixed

**Boss Word:**

- `eventType: 'bossWord'` — smash entrance from top, screen shake, gold sweep, 76px font
- Squash/stretch fall + impact, ignite flash white→gold, shockwave rings + dust overlay
- All scoring × 2

**Scoring:**

| Event | Score |
| --- | --- |
| Correct meaning | +100 × combo |
| Trap caught | +50 × combo (+100 on Boss) |
| Master Gate both correct | +300 bonus |
| Wrong swipe | Combo resets, −1 life |
| Boss Word | All scoring × 2 |

**Active component files:**

- `MaskBoard.tsx` — main board
- `MasterGateTile.tsx` — gate tile
- `SwipeMask.tsx` — tile component (Reanimated lives here only)
- `GhostTile.tsx` — ghost render path
- `PollyCard.tsx` · `PollyController.tsx` · `PollySprite.tsx`
- `StreakDisplay.tsx` · `ScoreFloat.tsx`
- `HeartbeatBackground.tsx` · `useHeartbeat.ts`
- `GameScreen.tsx` · `ResultsScreen.tsx` · `HomeScreen.tsx`

**Built but disconnected from active flow:**

- `PhraseBreakScreen.tsx` — phrase-swipe round (not routed from GameScreen)
- `SlangDropScreen.tsx` — slang era reveal round (not routed)
- `SwitchbackScreen.tsx` — two-clue word-match round (not routed); `completeSwitchback` removed from store/engine

**Audio:** WAV synthesis via SoundEngine.ts — generated, not sampled

---

## 6. KNOWN BUGS (active)

- 🔴 Purple box visible behind Polly — `ghostVisible` not resetting cleanly in MaskBoard ghost tint View
- 🔴 Master meaning text occasionally leaking into ghost tile as readable text
- 🔴 Gate tile can disappear when regular tiles clear (render condition issue)

---

## 7. NOT YET BUILT

- Timer / pressure system
- Results screen redesign
- Heartbeat System (Pass 9)
- Full Polly Lines + Triggers (Pass 10) — 18 lines, full trigger map
- Sound Design full pass (Pass 11) — 15 audio files
- Bottom Navigation (Pass 12) — 4 tabs
- Home Screen + Splash (Pass 13)
- Supabase persistence
- The Garden

---

## 8. CUT LIST ✂️ (permanent — never suggest, never revive)

- ❌ Tap-and-submit mechanic (replaced by swipe)
- ❌ Left swipe — does not exist in this game
- ❌ Directional arrows on tiles in live play — onboarding only
- ❌ Circular crop on Polly card
- ❌ Jargon in Polly lines ("Clean split", "Pick carefully")
- ❌ More than 2 gold elements on screen simultaneously
- ❌ Red as primary color or tile state before swipe
- ❌ Dashed borders on regular tiles
- ❌ Definition-style tile text — scene-style phrases only (≤4 words)
- ❌ Vocabulary quiz framing or educational app aesthetic
- ❌ Master meaning text visible in ghost tiles
- ❌ Gate as a swipeable tile — it auto-opens
- ❌ Reanimated anywhere except SwipeMask.tsx
- ❌ useNativeDriver mixing on same Animated.Value

---

## 9. SESSION LOG

*Add to top. Keep last 5 sessions.*

---
**June 6, 2026** — Full session rebuild. Stripped to pure standard Meaning Mask Blitz. New 12-word arc: LIGHT → BARK → RING → MATCH → RAW → BEAR → WAKE → PITCH → PRESS → BANK → SPRING → ORDER. Bosses moved to positions 11 and 12 (SPRING, ORDER). Switchback, PhraseBreak, and SlangDrop disconnected from GameScreen routing — component files kept, no-op stubs replace removed store calls. `submitPhraseAnswer` and `completeSwitchback` removed from engine and store. `GameStatus` simplified (phraseBreak removed). `EventType` simplified (phraseBreak, switchback removed). `emoji` made optional on Mask type. `panic` added to EmotionalRole. `tsc --noEmit` clean. CLAUDE.md and POLYWORDS-STATE.md updated.

---
**June 6, 2026 (earlier)** — Full repo audit. 11 fixes across 6 Claude Code prompts: content (RAW/SICK/BAD/CHILL slang fairness, PITCH hidden meaning, SPRING hiddenTrap), engine (revealHidden pollyTrigger, ghost wordId normalization, phraseAnswer feedback), UI (RATTLED color), codebase (dead pools deleted, dead types cleaned, typecheck script, Reanimated boundary locked). tsc clean.

---
**June 3, 2026** — context.md and CLAUDE.md synced to code-backed state. Switchback implementation complete.
