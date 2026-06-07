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

## Locked Play Screen Design

POLYWORDS is a word arena, not a quiz list. The hero word is the boss, the active mask tile is the challenger, the Master Gate is Polly's locked cage/vault, and the player steals mastery one swipe at a time.

**Hierarchy:** HERO WORD -> ACTIVE MASK TILE -> MASTER GATE -> HUD / SCORE / FEATHERS / STREAK -> POLLY POP-IN ONLY.

**Polly:** Not permanent on the gameplay screen. She appears only at high-emotion moments: 1 pop-in per word round, 2 max for a major event, always at end-of-round win/loss. She pops from bottom-left and never blocks the active tile, right shatter lane, or Master Gate. Mastery line: "BINGO BANGO ZZZZINGO!" Normal ghost failure: "Not yours yet." Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!"

**Layout:** Top quiet HUD for score, feathers, streak. Giant hero word top-center as UP absorb target. Empty middle swipe lane. One active mask tile in lower-middle thumb zone. Clear right toss/shatter lane. MASTER THE WORD gate low on board above nav safe area. Bottom nav reserves Home / Ranks / Vault / Profile.

**Hero word:** Dominates screen, sits top-center during normal play, absorbs correct UP swipes, and crashes down to center during MASTERED celebration.

**Active mask tile:** One active tile at a time. Large, premium, tactile, readable. Text must pop with size, weight, contrast, and spacing. All mask tiles look and behave the same until release. No real/trap tells before swipe. Press-hold wakes tile, gives tiny haptic, lifts slightly, follows finger, and release commits.

**Swipe motion:** UP claims real meaning; RIGHT rejects trap. No left swipe and no tap-submit. Correct UP feeds the tile into the hero word, which absorbs and pulses. Wrong UP rejects, wrong-flashes, and plucks a feather. Correct RIGHT flings the false meaning right with a "get outta here" feel and purple/rose glass shatter. Wrong RIGHT wrong-flashes and plucks a feather.

**Master Gate:** Text is MASTER THE WORD. It belongs to Polly, not the player. It is a low board bird cage / vault hybrid with subtle tension, `#0F0D2A` surface, faint cage bars, small lock, and quiet gold charge only when earned. The player's Vault is never on the game board; it is a nav/page destination.

**Master Gate unlock:** Last real visible tile absorbs into hero word -> gate border charges gold -> cage bars split slightly left/right -> lock snaps open -> two hidden tiles fly up into active tile position.

**MASTERED celebration:** Hidden tiles judged correctly -> hero word crashes down center -> diagonal MASTER stamp slams over word -> word cracks open -> Word Core jumps out -> Core grows/glows/spins center-screen -> Core shoots toward Vault nav icon -> Polly pops in: "BINGO BANGO ZZZZINGO!"

**Word Core:** Mastery trophy. It does not go into the Master Gate. It belongs in the player's Vault page. The Master Gate is Polly's cage, not storage.

**Ghost loss:** Wrong hidden/master swipe makes failed tile leave, remaining hidden tile stay, failed tile glitch and lose substance, failed tile pulled back, both hidden tiles merge, hero word flickers dull, ghostly presence fades into merged tile, and Ghost Tile forms with MASTER THE WORD / From [WORD]. Microcopy: THE HAUNT BEGINS.

**Ghost return / Haunt Words:** Ghosted words return late in future Hunts, best at word 10 or 11, never replacing Boss Word 12. Entrance copy: REMEMBER ME? If mastered: HAUNT BROKEN. If failed again: STILL HAUNTED. Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!"

**Feathers:** Hearts are replaced by Feathers. Player starts with 5. Wrong swipe plucks 1. 0 feathers ends run. Score milestones can restore a Life Feather. If full, player can hold 1 reserve feather max.

**Score:** Competition system for personal bests, Polly target score, Hunt rank, and future daily/friend/global rankings. Score does not replace mastery. Word Cores are permanent mastery trophies.

**Color rules:** `#1A1830` background. `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core. `#7B2D8B` for UI/gate/shards. `#9B2D6B` for trap/ghost shard accents. `#4CAF50` only Polly character. `#0F0D2A` only Master Gate locked surface. `#CC2200` only wrong swipe flash. `#FFFFFF` readable text. No pink/magenta, no orange UI, no green UI, no red except wrong flash, max 2 visible gold elements.

**Implementation order:** Main gameplay layout -> hero word dominance -> one active tile queue -> press-hold tile behavior -> UP absorb and RIGHT toss/shatter -> Master Gate visual overhaul -> hidden tile unlock -> MASTERED celebration -> ghost merge loss -> feathers and score targets -> Haunt Word return system -> Vault / Ranks / Profile pages.

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
| Boss mastered | "BINGO BANGO ZZZZINGO!" |
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
- "BINGO BANGO ZZZZINGO!" — never change

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
