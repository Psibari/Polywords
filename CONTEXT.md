# POLYWORDS — AI Session Context File
> Drop this file at the start of any Claude or ChatGPT session to resume instantly.
> **Always update this file at the end of a session before closing.**

---

## What Is POLYWORDS?

A mobile-first semantic arcade word game built around **polysemy** — words with multiple real meanings. Players see a word, then swipe tiles labeled with meanings — some real, some traps. Mechanics reward fast semantic thinking, punish overthinking, and create "wait... that's also right" moments.

- **Core emotion:** *"Wait… what? … Shit, that's right."*
- **Session length:** 12 steps (not 15 — that was old)
- **Lives:** 5 hearts per session

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Expo SDK (managed workflow) |
| Language | TypeScript (strict) |
| State | Zustand + immer middleware |
| Animations | React Native Animated API (NOT Reanimated) |
| Haptics | Expo Haptics |
| Audio | Expo AV (generated WAV synthesis via SoundEngine.ts) |
| Navigation | Expo Router |
| Testing | Expo Go via QR code on physical device |

### Animation Rules (non-negotiable)
- `useNativeDriver: true` — transform, opacity only
- `useNativeDriver: false` — height, margin, layout
- **Never mix drivers in the same animation chain**
- Use `setTimeout` to separate animation phases — never `.start()` callbacks
- Always run `tsc --noEmit` after every fix — must exit 0

---

## Brand Identity (LOCKED — no changes without Pete's sign-off)

### Palette — "Royal Word Game"
| Token | Hex | Use |
|---|---|---|
| Indigo background | `#1E1A3A` | Screen background |
| Tile idle | `#2A2560` | Unswiped tile |
| Tile special | `#251F4A` | Hidden split tiles, Switchback clues |
| Gold | `#FFD700` | Correct tiles, progress dots, kicker labels ONLY |
| Polly green | `#4CAF50` | Polly mascot, HIDDEN MEANING border, "Slang check." text |
| Wrong red | `#CC2200` | Wrong swipe flash |
| Navy border | `#1A1830` | Tile sticker border + shadow |
| White text | `#FFFFFF` | All tile text |
| White dim | `rgba(255,255,255,0.85)` | Polly speech text |
| White ghost | `rgba(255,255,255,0.25)` | Remaining progress dots |

**Two golds max per screen.**

### Typography
| Element | Font | Size |
|---|---|---|
| Hero word — normal | SuperCartoon-6R791 | 76px, letterSpacing 3 |
| Hero word — Boss | gomarice_okuba_cloud | 80px, letterSpacing 4 |
| Switchback answer words | SuperCartoon-6R791 | 28px |
| Phrase Break phrase | SuperCartoon-6R791 | 36px |
| Tile text | InterVariable | 20px |
| Polly speech / brand title | SuperCarnival-j9Wq0 | 48px title / 14px speech |
| HUD score | SuperCartoon-6R791 | 22px |
| HUD multiplier | SuperCartoon-6R791 | 32px |
| Kicker / HUD labels | SuperFrosting-R9z4o | 11px, letterSpacing 3 |

### Mascot — Polly
- Green parrot, gold goggles, explorer hat, rainbow tail feathers, gold P-chain medallion
- Personality: smart, slightly smug, one step ahead
- Style: adult-coded — **never childlike**
- Assets: `polly_fullbody.png`, `polly_sprite.png`

---

## Swipe System (Universal — never tap)

- **Swipe UP** → claim as real meaning
- **Swipe RIGHT** → call it a trap
- **No left swipe exists in this game**
- All screens use swipe — **never tap**

---

## Round Types

### Standard (Meaning Mask Blitz)
Word appears, tiles mount with 80ms stagger. Swipe UP on real meanings, RIGHT on traps. Find all real meanings → HIDDEN MEANING unlocks. +100 per correct × combo multiplier.

### Boss Word
`eventType: 'bossWord'` — smash entrance from top, screen shake, gold sweep, 80px gomarice font, all scoring × 2. Current boss words: SPRING (step 3), ORDER (step 12).

### Phrase Break
Full screen. No tiles. Phrase rises from bottom. Four answer tiles. Swipe UP to select. Correct → +150, no life lost on wrong. Always low stakes — curiosity round. The active session uses a fixed phrase break step (`Give it a shot`), while `phraseBreakPool` defines additional phrase-break content.

### Slang Drop
Full screen. Record scratch. Word scratches in from left. "Slang check." from right in Polly green. Slang meaning + traps only. Era badge on correct.

### Switchback
Full screen. Two clues from opposite sides. One word connects both. Swipe UP on answer word. First attempt +200, second +100. Both wrong → -1 life. The active session uses a fixed COLD switchback step, while `switchbackPool` defines additional switchback content.

---

## HIDDEN MEANING System

Every standard round word has a hidden pair. Tile sits above stack, pulsing green→gold border. Untouchable until perfect clear. Perfect clear → 10-step cinematic split sequence. Both split tiles are live SwipeMasks. +300 if both correct.

---

## 12-Step Session Structure (Current)

| Step | Word/Event | Type |
|---|---|---|
| 1 | LIGHT | Standard |
| 2 | STRIKE | Standard |
| 3 | SPRING | Boss |
| 4 | PITCH | Standard |
| 5 | COLD | Switchback |
| 6 | "Give it a shot" | Phrase Break |
| 7 | BANK | Standard |
| 8 | RAW | Slang Drop (NOW era) |
| 9 | WAKE | Standard |
| 10 | MATCH | Standard |
| 11 | BARK | Standard |
| 12 | ORDER | Boss (final) |

---

## Scoring

| Event | Score |
|---|---|
| Correct meaning | +100 × combo |
| Hidden split both correct | +300 bonus |
| Phrase Break correct | +150 bonus |
| Switchback first attempt | +200 bonus |
| Switchback second attempt | +100 bonus |
| Wrong swipe | Combo resets to x0 |
| Boss Word | All scoring × 2 |

---

## Sound System (SoundEngine.ts — generated WAV)

| Event | Sound |
|---|---|
| Correct swipe up | 880→1100Hz sine sweep, 120ms |
| Wrong swipe | Square wave 120Hz, 180ms |
| Trap shatter | White noise + pitch drop, 250ms |
| Split reveal | Two-tone ascending sweep, 350ms |
| Round complete | 3-note C-E-G resolution |
| Record scratch | Noise burst + 400→100Hz sweep, 280ms |

---

## Current Build Status

### Built and Working
- 12-step session with all round types wired
- Tile swipe system, tile states (gold lock, red buzz, shatter, collapse)
- Sticker tile treatment — 2px navy border, 5px hard shadow
- Progress dots, Hearts (5 lives), Polly Card + Find-Meter
- HIDDEN MEANING tile — pulsing green/gold border
- 10-step cinematic split sequence on perfect clear
- Boss Word entrance sequence (smash, shake, sweep)
- PHRASE BREAK, SLANG DROP, SWITCHBACK flow implemented
- Full sound system, haptics, staggered tile mount (80ms)
- Hero word fade+scale on transition, ghost tile system
- Session data conflict-free — all hidden meaning duplicates resolved

### In Progress
- Polly image in pill — circular crop punted
- Fluent 3D emoji — CDN fallback still firing
- "Word up." protection — needs boss-only limiting
- Streak feedback in-round

### Not Yet Built
- Timer / pressure system
- Results screen redesign
- Chip-stack collapse for solved tiles
- Polly character animation / Rive sprite
- Home screen with real Polly
- Scholar's Cave / mastery system

---

## Key Design Decisions (Already Made — Don't Re-litigate)

- Palette: "Royal Word Game" — locked
- Fonts: SuperCartoon / gomarice / InterVariable / SuperCarnival / SuperFrosting — locked
- Polly: green parrot, adult style, gold goggles — locked
- Tile copy ≤4 words, scene-style (not definitions) — locked
- Session = 12 steps — locked
- Hidden meanings split into 2 live tiles on perfect clear — locked
- Ghost tiles carry missed meanings forward — locked
- No left swipe, no tap on answer tiles — locked

---

## Anti-Patterns (Never)

- Left swipe / tap instead of swipe
- Jargon in Polly lines
- More than 2 gold elements on screen
- Red as primary color
- Dashed borders
- Circular Polly crop
- `useNativeDriver` mixing between animation phases
- Definition-style tile text (use scene-style masks)
- Generic or repeated emoji across tiles

---

## Next Priorities

1. **Polly banner card** — half-body, not circular crop
2. **Expand phrase pool** — add remaining 7 phrases
3. **Expand slang pool** — add remaining 17 words
4. **Expand switchback pool** — add remaining 15 rounds
5. **Timer system** — Speed rounds need pressure
6. **Home screen** — real Polly, proper branding
7. **Results screen redesign** — polish end-of-run flow

---

## About Pete

- Based in New York, NY
- Also pursuing AI consulting / automation for small businesses
- Prefers: direct advice, implementation focus, honest feedback
- No hand-holding — say what's wrong, say why, move on

---

## Session Log
> Update this section at the end of every session.

| Date | AI Used | What Was Done | Left Off At |
|---|---|---|---|
| May 31, 2026 | Claude | Initial CONTEXT.md created | Bug/polish list active |
| Jun 3, 2026 | Claude | Updated context.md and CLAUDE.md to match current code-backed session state | Docs synced to current run and switchback implementation |

---

*Last updated: June 3, 2026*
*To update: ask Claude or ChatGPT — "update context.md"*
