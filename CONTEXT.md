# POLYWORDS — CONTEXT.md
### Quick-Reference Session Briefing · June 7, 2026

Paste this at the start of any Claude Code session to restore full context.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds 700+ words in her vault. She set every trap. The player challenges her one word at a time to take the title. Every session is a HUNT — 12 words, a designed difficulty arc, and Polly's boss word waiting at position 12.

**North star:** *"Wait… what? … Shit, that's right."*

---

## Stack

```
Expo SDK · React Native · TypeScript strict · Zustand+immer
React Native Animated API (Reanimated = SwipeMask.tsx ONLY, frozen)
Expo Haptics · Expo AV (→ expo-audio pending) · Expo Router
Fonts: Bagel Fat One (hero word) · Plus Jakarta Sans 800 (UI)
Windows dev: forward-slash paths only
```

---

## Colors (Strict)

```
#1A1830  Background (always)
#F5C842  Gold — score, reward, gate, boss word (MAX 2 on screen)
#7B2D8B  Purple — trap shards, ghost border, rare events
#9B2D6B  Rose — shard gradient partner
#4CAF50  Polly Green — Polly mascot ONLY
#0F0D2A  Deep Dark — Master Gate background only
#CC2200  Wrong Flash — wrong swipe only, never decoration
#FFFFFF  All UI text
```

---

## Swipe Grammar (Sacred)

| Swipe | Meaning | Result |
|---|---|---|
| UP | Real meaning | Magnetic absorb into word |
| RIGHT | Trap | Crystal shard burst |
| Wrong UP | Claimed a trap | Word REJECTS tile — shakes, tile exits downward |
| Wrong RIGHT | Rejected real meaning | Tile rubber-bands back, buzzes red, dissolves |

**No left swipe. No tap. No tap-and-submit. Swipe only. Always.**

---

## Current Session (12 words — test harness)

```
1  LIGHT   Standard  Confidence
2  BARK    Standard  Flow
3  RING    Standard  First tension
4  MATCH   Standard  Escalation
5  RAW     Standard  Freshness
6  BEAR    Standard  Hesitation
7  WAKE    Standard  Tension
8  PITCH   Standard  Near miss
9  PRESS   Standard  Panic
10 BANK    Standard  Rebound
11 SPRING  Boss      First climax
12 ORDER   Boss      Final boss — Polly's word
```

---

## Living Pool Model (Phase 2 — design locked)

- Always 12 fresh words from Unmastered Pool
- Mastered words permanently graduate to Vault — never in standard run again
- Ghost words get priority placement in difficulty tier
- RUN IT BACK = fresh 12-word draw with ghost priority
- Boss always position 12 — one per session
- Daily Challenge = only curated fixed session

---

## One-at-a-Time Tile Queue (Design locked — not yet built)

- One tile flies in at a time. Player swipes. Next tile arrives.
- ALL TILES LOOK IDENTICAL UNTIL SWIPED — Polly gives nothing away
- Ghost tile always first, enters from LEFT
- Ghost unresolvable until perfect clear — merges into split tile sequence
- Random queue order · Speed escalates -20ms per tile (floor 280ms)
- Gap = skill-based: base 350ms, combo reduces, wrong swipe +150ms
- Between tiles: pure silence — emptiness is tension
- Landing position: vertical center of battlefield

---

## Master Gate (Auto-opens on perfect clear)

**wrongSwipeOccurred.current MUST reset to false at start of every new word.**

Sequence: Last tile absorbs → border charges clockwise → lock cracks → gate opens → two split tiles drop.

Split tiles: real hidden meaning (UP) + hidden trap (RIGHT).

Both correct → MASTERY SEQUENCE:
MASTERED text first → word swells → crystal shards → seed drops → word compresses → flies to vault icon.

Missed → GHOST (solid purple border, no dashes, phrase NEVER revealed).

---

## Polly Hunt System (Design locked — not yet built)

Polly is the MASTER OF WORDS. Every trap is her move. Boss word is hers.

| Trigger | Line |
|---|---|
| Before word 1 | "I've got a word you need to earn." |
| Word 3→4 well | "You're moving. I've seen better." |
| Word 3→4 struggling | "You'll need more than that." |
| Word 6→7 well | "Getting warmer. Keep going." |
| Word 6→7 struggling | "Want this word? Show me something." |
| Word 9→10 | "Not yet." |
| Word 11→12 | "Last one. Then it's just you and me." |
| Boss mastered | "BINGO BANGO ZZZINGOO" |
| Boss failed | "Thought so." |

---

## The Vault (Replaces Garden — permanent)

- Mastered words = trophies taken from Polly
- Hidden meaning permanently visible here — ONLY place in the game
- Boss tiles: full gold border + purple glow + breathing pulse
- Empty state: "Polly has them all." / "Go take one."
- Mastery ends with word compressing → launching to vault nav icon
- Paywall at word 21: "Vault Full / Unlock unlimited"
- Polly has NO presence in vault — player's domain only

---

## Key Bugs Pending

```
🔴 wrongSwipeOccurred.current not resetting between words
🟠 Mastery celebration word zoom over-scales (target 1.6×)
🟠 Polly Hunt System — not built yet
🟠 expo-av → expo-audio migration deferred
🟡 One-at-a-time queue — implementation pending
🟡 Vault — implementation pending
🟡 Living Pool Model — requires Supabase (Phase 2)
```

---

## Cut List (Never Suggest These)

```
☠️ Garden (dead — Vault replaced it)
☠️ Simultaneous tile render (dead — one-at-a-time queue)
☠️ Switchback / Phrase Break / SlangDropScreen in main session
☠️ Left swipe / tap interactions
☠️ Dashed borders / pink / magenta colors
☠️ Red for text or decoration
☠️ Visual tells on tiles before swipe
☠️ Reanimated outside SwipeMask.tsx
☠️ Rectangle/square particles
☠️ RATTLED. in any color except white
☠️ Circular Polly crop
☠️ More than 2 gold elements simultaneously
```

---

## Non-Negotiable Rules

- tsc --noEmit must exit 0 before device test
- One prompt, one concern — surgical always
- useNativeDriver: true → transform/opacity only
- useNativeDriver: false → height/margin/backgroundColor only
- Never chain both drivers on same Animated.Value
- setTimeout between phases — never .start() callbacks
- Ghost wordId = WORD STRING always (e.g. "BARK") not stepIndex
- Boss position 12 always — non-negotiable
- "Thought so." — never change
- "BINGO BANGO ZZZINGOO" — never change

---

## File Map (Key Files)

```
app/components/MaskBoard.tsx         Main game board — primary file
app/components/SwipeMask.tsx         Tile + swipe physics (Reanimated — frozen)
app/components/MasterGateTile.tsx    Gate: locked / unlock / split tiles
app/components/PollyCard.tsx         Polly sprite + speech
app/components/PollyController.tsx   Polly trigger system
app/game/session.ts                  12-word session data
app/game/polyRunEngine.ts            Game state engine
app/game/types.ts                    All TypeScript types
app/store/useGameStore.ts            Zustand store
app/screens/GameScreen.tsx           Main game screen
app/screens/ResultsScreen.tsx        End-of-run results
app/utils/SoundEngine.ts             WAV synthesis
```

---

*POLYWORDS CONTEXT.md · Pete DiBari · June 7, 2026*