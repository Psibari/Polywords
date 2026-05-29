# POLYWORDS — Game Design Document v2
### Living Reference · Updated May 28, 2026

---

## The Game in One Sentence

A word appears. Meaning masks appear — some real, some traps. Swipe UP on real meanings. Swipe RIGHT to call out traps. Find all real meanings to unlock the hidden one.

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
Editor:         VS Code
```

---

## Palette — Royal Word Game (Strict)

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

**Two golds max per screen. No new colors without Pete's sign-off.**

---

## Typography

| Element | Font | Size |
|---|---|---|
| Hero word — normal | Bagel Fat One | ~52px |
| Hero word — Boss/Slang | Bagel Fat One | 72-76px |
| Switchback answer words | Bagel Fat One | 28px |
| Phrase Break phrase | Bagel Fat One | 36px |
| Tile text | Plus Jakarta Sans 800 | 20px |
| Polly speech | Plus Jakarta Sans 800 | 18px |
| Kicker labels | Plus Jakarta Sans 800 | 11px, letterSpacing 3 |
| Find-meter label | Plus Jakarta Sans 800 | 10px |

---

## Current Build Status

### ✅ Built and Working
- 10-step session with all round types wired
- Tile swipe system — UP = real meaning, RIGHT = trap
- Tile states — gold lock, red buzz, shatter, collapse
- Sticker tile treatment — 2px navy border, 5px hard shadow
- Progress dots — gold/white/dim, auto-scales to session length
- Hearts (5 lives) separated from round counter
- Polly Card + Find-Meter
- HIDDEN MEANING tile — pulsing green/gold border
- 10-step cinematic split sequence on perfect clear
- Boss Word — smash entrance, screen shake, gold sweep, 76px
- PHRASE BREAK — full screen, phrase rises, swipe-up answers, random rotation
- SLANG DROP — record scratch, word from left, "Slang check." from right, era badge
- SWITCHBACK — two clues from opposite sides, word tiles, 2-attempt logic (swipe fix in progress)
- Sound system — correct tap, wrong buzz, shatter, scratch, split reveal, round complete
- Mask language upgraded — all 8 session words with sharp 2-4 word masks
- Emoji upgraded — 111 fields, no repeats
- Staggered tile mount — 80ms per tile
- Hero word fade+scale on transition
- Ghost tile system — missed meanings carry to next run
- Session data conflict-free — all 17 hidden meaning duplicates resolved
- 5-life system

### ⚠️ In Progress
- SWITCHBACK swipe fix — currently tapping not swiping
- Polly image in pill — circular crop doesn't work, punted
- Fluent 3D emoji — CDN fallback still firing
- "Word up." protection — needs boss-only limiting
- Streak feedback in-round

### ❌ Not Yet Built
- Timer / pressure system
- Results screen redesign
- Chip-stack collapse for solved tiles
- Polly character animation / Rive sprite
- Home screen with real Polly
- Scholar's Cave / mastery system
- Streak freeze / recovery window

---

## Swipe System (Universal)

- **Swipe UP** → claim as real meaning
  - Correct: gold lock, stays on screen
  - Wrong: red buzz + shake, flies off top
- **Swipe RIGHT** → call it a trap
  - Correct: shatter + collapse
  - Wrong: red buzz, flies right
- **No left swipe exists in this game**
- **All screens use swipe — never tap**

---

## Round Types

### 1. STANDARD MEANING MASK BLITZ
Normal word round. Word appears, tiles mount with 80ms stagger.
- Swipe UP on real meanings, RIGHT on traps
- Find all real meanings → HIDDEN MEANING unlocks
- Scoring: +100 per correct × combo multiplier

### 2. BOSS WORD
Triggered by `eventType: 'bossWord'` in session data.

**Entrance:**
1. 600ms silence
2. "BOSS WORD · 2× SCORE" kicker appears
3. Word SMASHES from off-screen top
4. Heavy spring overshoot — word compresses on impact
5. Screen shake — 3 rapid oscillations, 180ms
6. Single heavy haptic
7. Gold sweep passes through word left→right
8. Polly reading expression fires
9. Tiles mount at 100ms stagger (heavier than normal)

**Words:** ORDER (word 8 in current session), SPRING
**Font:** 76px Bagel Fat One, gold color

### 3. PHRASE BREAK
Full screen palate cleanser. No tiles. Pure language curiosity.

**Entrance:**
1. "PHRASE BREAK" kicker fades in (gold)
2. Phrase RISES from bottom — spring animation
3. 600ms pause
4. Polly: "Tiny detour. Big meaning."
5. Question text fades in
6. Four answer tiles mount with 80ms stagger

**Rules:**
- Swipe UP to select answer
- Correct → gold, Polly reveal fires, +150 bonus, auto-advance 2s
- Wrong → red flash, correct reveals gold, "Now you know.", no life lost
- Always low stakes — curiosity round

**Current phrase pool (3 entries, random per run):**
- "Spill the beans" → Ancient Greek bean voting
- "Bite the bullet" → Pre-anaesthetic surgery
- "Break a leg" → Theatre reverse superstition

### 4. SLANG DROP
Full screen. Cultural surprise. Tests slang knowledge only.

**Entrance:**
1. Record scratch sound fires
2. Word scratches in from LEFT (translateX -500 → overshoot +15 → 0)
3. 400ms pause — word sits alone
4. "Slang check." slides in from RIGHT (Polly green #4CAF50)
5. Tiles mount — ONLY slang meaning + traps

**Rules:**
- Same swipe mechanic — UP for real, RIGHT for trap
- Correct slang meaning → gold lock + ERA BADGE slides up
- Wrong → red buzz, life penalty
- Tiles are slang meaning only — regular meanings not shown

**Era badges:**
| Label | Era |
|---|---|
| `CLASSIC` | 1920s-40s |
| `RETRO` | 1950s-60s |
| `OLD SCHOOL` | 1970s-80s |
| `THROWBACK` | 1990s-2000s |
| `NOW` | 2010s |
| `FRESH` | 2020s |

**Current slang pool (3 entries, random per run):**
- SICK — OLD SCHOOL — "That trick though"
- BAD — OLD SCHOOL — "Michael said so"
- CHILL — OLD SCHOOL — "What Fridays are for"

### 5. SWITCHBACK
Full screen. Puzzle flips — two clues, find the connecting word.

**Entrance:**
1. "SWITCHBACK" kicker drops in
2. Two clue bars slide from OPPOSITE sides simultaneously
3. 800ms pause — player reads both clues
4. "One word. Two lives." fades in (Polly green)
5. Four WORD tiles mount at 100ms stagger (Bagel Fat One 28px)

**Rules:**
- Swipe UP on the word that connects BOTH clues
- First attempt correct → +200, Polly: "Sharp."
- Second attempt correct → +100, Polly: "Got there."
- Both wrong → correct reveals, Polly reveal fires, -1 life

**Clue bar style:**
- Background: #251F4A
- Border: 2px solid #FFD700
- Labels: "CLUE 1" / "CLUE 2" above each bar

**Current switchback pool (5 entries, random per run):**
- BAT: "Swings in baseball" / "Sleeps upside down"
- BANK: "Holds your money" / "River's edge"
- CAST: "Fishing line goes this way" / "Actors in a film"
- STRIKE: "Lightning does it" / "Bowler's perfect throw"
- SOUND: "Ears catch it" / "Water between two lands"

---

## HIDDEN MEANING System

Every word in the standard round has a hidden meaning pair — one real, one trap.

**During round:** "✨ HIDDEN MEANING" tile sits above tile stack. Pulsing green→gold border. Untouchable.

**Perfect clear missed:** Tile dims, greys out. Polly: "Locked."

**Perfect clear earned → 10-step cinematic:**
1. 400ms silence
2. Tile pulses 3x
3. Floats up 8px
4. Screen dims 20%
5. ScaleX squeeze to 0
6. Tile collapses height to 0
7. Two split tiles slam in (staggered spring)
8. Dim fades
9. Both tiles pulse gold borders
10. `playSplitReveal()` + Polly: "Hidden. Worth it."

**Split tiles:** both live SwipeMask — UP for real, RIGHT for trap. +300 if both correct.

---

## Current 10-Step Session Structure

| Position | Word/Event | Round Type | Notes |
|---|---|---|---|
| 1 | BARK | Standard | Confidence opener |
| 2 | SPRING | Boss | Boss word |
| 3 | [SWITCHBACK] | Switchback | Random from pool |
| 4 | BANK | Standard | Hesitation |
| 5 | [PHRASE BREAK] | Phrase Break | Random from pool |
| 6 | WAKE | Standard | Curiosity |
| 7 | [SLANG DROP] | Slang Drop | Random from pool |
| 8 | MATCH | Standard | Hesitation |
| 9 | SOUND | Standard | Surprise/hidden |
| 10 | ORDER | Boss | Final boss |

---

## Mask Language Standard

**Must be:** 2-4 words, visual/tactile/emotional, slightly tricky but fair, built for hesitation, clear after reveal, distinct from decoys.

**Must not be:** Long definitions, academic/clinical language, random or cheap, obvious enough to auto-tap.

### Scene-style masks (correct approach)
Instead of definitions, use social/cultural moments:
- ✅ "Michael said so" (BAD slang)
- ✅ "Left on read forever" (GHOST slang)
- ✅ "What Fridays are for" (CHILL slang)
- ✅ "Your dad at the dance" (SQUARE slang)
- ❌ "Excellent, impressive" (definition — wrong)
- ❌ "Uncool, conventional person" (too long, too academic)

### Tile trap types
| Type | Description | Example |
|---|---|---|
| Standard meaning bleed | The word's normal meaning sounds close | "Fridge temperature" for CHILL |
| Near-miss | Almost the right meaning but off | "Calm and collected" for COOL |
| Domain neighbor | Same world, wrong word | "Rhythm in the hips" for JIVE |
| Object trap | What the thing IS, not what it means | "Howls at the moon" for WOLF |
| Phrase trap | A phrase that uses the word | "On the rocks" for ROCK |

---

## Word Lists

### Standard Session Words (8 active)
BARK, SPRING, LIGHT, BANK, WAKE, MATCH, SOUND, ORDER

### Switchback Pool (5 words)
BAT, BANK, CAST, STRIKE, SOUND

### Phrase Break Pool (3 phrases, expanding)
"Spill the beans", "Bite the bullet", "Break a leg"

---

### Slang Pool — 20 Words, 6 Eras

**CLASSIC (1920s-40s)**
| Word | Standard | Slang | Scene tile |
|---|---|---|---|
| WOLF | Wild animal | Flirtatious man | "Always at the bar" |
| POWDER | Fine particles | Leave quickly | "Take it and run" |
| BLOW | Air/wind | Lose your temper | "Top comes right off" |
| DIG | Excavate | Understand/appreciate | "You feel it or you don't" |

**RETRO (1950s-60s)**
| Word | Standard | Slang | Scene tile |
|---|---|---|---|
| COOL | Low temperature | Stylish, excellent | "Every teen wanted it" |
| SQUARE | Geometric shape | Uncool, boring | "Your dad at the dance" |
| BREAD | Baked food | Money | "What the hustle is for" |
| GROOVY | In a groove | Excellent, cool | "Woodstock approved it" |
| PSYCH | Psychology | Gotcha, tricked you | "Said at the last second" |

**OLD SCHOOL (1970s-80s)**
| Word | Standard | Slang | Scene tile |
|---|---|---|---|
| JIVE | Swing music | Nonsense, lies | "Don't give me that" |
| CHILL | Make cold | Relax, calm down | "What Fridays are for" |
| BAD | Not good | Excellent, tough | "Michael said so" |
| SICK | Unwell | Excellent | "That trick though" |
| RAD | Radiation unit | Awesome, exciting | "Skate parks said it first" |

**THROWBACK (1990s-2000s)**
| Word | Standard | Slang | Scene tile |
|---|---|---|---|
| WHATEVER | Anything at all | Dismissive indifference | "Valley girl's favorite exit" |
| GHOST | Spirit of dead | Cut off contact | "No text back. Ever." |

**NOW (2010s)**
| Word | Standard | Slang | Scene tile |
|---|---|---|---|
| WOKE | Past tense of wake | Socially aware | "Eyes open to the world" |
| GHOST | Spirit of dead | Cut contact (peak) | "No text back. Ever." |

**FRESH (2020s)**
| Word | Standard | Slang | Scene tile |
|---|---|---|---|
| SLAY | Kill | Excel, dominate | "Beyoncé approved it" |

---

### Full Switchback Word Pool (20 designed rounds)

| Word | Clue 1 | Clue 2 |
|---|---|---|
| BAT | "Swings in baseball" | "Sleeps upside down" |
| BARK | "Tree wears it" | "Dog does it" |
| SPRING | "Follows the frost" | "Legs do it" |
| BANK | "Holds your money" | "River's edge" |
| LIGHT | "Eyes need it" | "Not heavy at all" |
| MATCH | "Strikes a flame" | "Rivals play one" |
| ROCK | "Music with an edge" | "Baby needs it" |
| WELL | "Dug deep for water" | "How you feel after rest" |
| WAVE | "Ocean does this" | "Goodbye does this" |
| FINE | "Breaking rules costs this" | "Thin as a thread" |
| COLD | "Nose runs with it" | "Winter morning feels it" |
| PITCH | "Thrown by a pitcher" | "How high the note is" |
| POOL | "Summer swimming" | "Cue and balls" |
| SLIP | "Ice causes it" | "Paper left behind" |
| DRAFT | "Cold air sneaking in" | "First version of writing" |
| SCALE | "Weighs what you carry" | "Fish wears it" |
| CAST | "Fishing line goes this way" | "Actors in a film" |
| STRIKE | "Lightning does it" | "Bowler's perfect throw" |
| CURRENT | "River moves with it" | "Electricity flows as it" |
| SOUND | "Ears catch it" | "Water between two lands" |

---

### Full Phrase Break Pool (10 phrases designed)

| Phrase | Question | Correct Answer | Polly Reveal |
|---|---|---|---|
| Spill the beans | Where did this come from? | Secret voting with beans | "Ancient Greeks voted with beans." |
| Bite the bullet | What did this literally mean? | Chew metal to survive pain | "Surgery before anaesthetic." |
| Break a leg | Why do actors say this? | Saying luck brings bad luck | "Reverse the curse." |
| Saved by the bell | This phrase came from... | Coffins with signal bells | "Victorian coffins had bells." |
| Let the cat out of the bag | What was the original scam? | Swapping a pig for a cat | "Medieval market fraud." |
| Rule of thumb | Where did brewers use their thumb? | Testing beer temperature | "Brewer's temperature check." |
| Raining cats and dogs | What did heavy rain wash out? | Dead animals from gutters | "17th century street flooding." |
| Kick the bucket | What was the bucket? | Something stood on, then kicked | "A grim stepping stool." |
| Burning the midnight oil | What made midnight special then? | Oil lamps ran through the night | "No electricity. Real oil. Real work." |
| The whole nine yards | What was exactly nine yards? | A fighter pilot's ammo belt | "WWII ammunition belts." |

---

## Polly — Brand & Character

**Who she is:** Green parrot, gold goggles, explorer hat, rainbow tail feathers, gold P-chain medallion. Smart, slightly smug, one step ahead. Adult-coded. Never childlike.

**6 expression images:**
| File | Expression | Used for |
|---|---|---|
| polly_letsPlay.png | Friendly gesture | Session start |
| polly_knowing.png | Open beak, forward | Round start |
| polly_clever.png | Finger to beak | Correct tap |
| polly_thinking.png | Smug side-eye | Wrong tap |
| polly_wordUp.png | Pointing up | Perfect clear |
| polly_reading.png | Reading book | Boss word |

**Future vision (not built):** Polly at top of screen, master word overlaid across her body. Perfect clear → she physically drops the ❓ tile down toward the stack.

**Polly line rules:**
- Round start: "[N] real, [N] fake[s]." — always factual count
- Never jargon ("Clean split", "Pick carefully")
- "Word up." — max 0-2 per run, boss perfect only (not yet enforced)
- Slang Drop: "Language moves."
- Phrase Break: "Tiny detour. Big meaning."
- Switchback intro: "One word. Two lives."

---

## Sound System

All generated WAV via SoundEngine.ts:

| Event | Function | Character |
|---|---|---|
| Correct swipe up | `playCorrectTap()` | 880→1100Hz sine sweep, 120ms |
| Wrong swipe | `playWrongBuzz()` | Square wave 120Hz, 180ms |
| Trap shatter | `playShatter()` | White noise + pitch drop, 250ms |
| Split reveal | `playSplitReveal()` | Two-tone ascending sweep, 350ms |
| Round complete | `playRoundComplete()` | 3-note C-E-G resolution |
| Record scratch | `playScratch()` | Noise burst + 400→100Hz sweep, 280ms |

---

## Haptics

| Event | Haptic |
|---|---|
| Correct swipe | `Haptics.impactAsync(Medium)` |
| Wrong swipe | `Haptics.impactAsync(Heavy)` |
| Boss word impact | `Haptics.impactAsync(Heavy)` × 1 |
| Hidden split correct | `Haptics.notificationAsync(Success)` |
| Hidden split wrong | `Haptics.notificationAsync(Error)` |

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

## File Structure (Current)

```
poly-words/
├── app/
│   ├── components/
│   │   ├── FluentEmoji.tsx
│   │   ├── MaskBoard.tsx
│   │   ├── PollyCard.tsx
│   │   ├── PollyController.tsx
│   │   ├── SwipeMask.tsx
│   │   ├── PhraseBreakScreen.tsx    ← NEW
│   │   ├── SlangDropScreen.tsx      ← NEW
│   │   └── SwitchbackScreen.tsx     ← NEW
│   ├── game/
│   │   ├── polyRunEngine.ts
│   │   ├── session.ts
│   │   ├── types.ts
│   │   └── useGameStore.ts
│   └── screens/
│       ├── GameScreen.tsx
│       ├── HomeScreen.tsx
│       └── ResultsScreen.tsx
├── assets/
│   ├── images/polly/                # 6 expression PNGs
│   └── fonts/
└── app/utils/
    └── SoundEngine.ts
```

---

## Design Principles (Ranked)

1. Fair traps — tempting but not cheap
2. Semantic tension — player must hold two meanings at once
3. Mobile arcade pacing — fast, rhythmic, punchy
4. Replayability — near-miss > grind > unlock
5. Boss words — rare, elevated stakes
6. Ghost tiles — missed meanings haunt next run
7. Sharp reveal — the "oh wait" snap must land
8. Juice — haptics, sound, animation all sync
9. Content quality — no fake meanings
10. Streak pressure — momentum feels physical

---

## Anti-Patterns (Never)

- ❌ Left swipe — doesn't exist
- ❌ Tap instead of swipe — all interaction is swipe
- ❌ Jargon in Polly lines
- ❌ More than 2 gold elements on screen
- ❌ Red as primary color
- ❌ Dashed borders
- ❌ Circular Polly crop
- ❌ useNativeDriver mixing between animation phases
- ❌ Generic emoji repeated across tiles
- ❌ Definition-style tile text
- ❌ Vocabulary quiz framing

---

## Claude Code Conventions

- Always `tsc clean after fix` at end of every prompt
- Reference exact mask IDs — always confirm IDs first
- Height/margin: `useNativeDriver: false`
- Transform/opacity: `useNativeDriver: true`
- Never mix drivers in same animation chain
- Use `setTimeout` to separate animation phases, not `.start()` callbacks
- All new screens: check `step.kind` or `step.eventType` for routing
- Swipe mechanic only — never add tap handlers to answer tiles

---

## Next Priorities

1. **SWITCHBACK swipe fix** — tap to swipe, in progress
2. **"Word up." protection** — boss perfect only
3. **Polly banner card** — half-body, not circular crop
4. **Expand phrase pool** — add remaining 7 phrases
5. **Expand slang pool** — add remaining 17 words
6. **Expand switchback pool** — add remaining 15 rounds
7. **Timer system** — Speed rounds need pressure
8. **Home screen** — real Polly, proper branding

---

*POLYWORDS GDD v2 · Pete Diba · May 28, 2026*