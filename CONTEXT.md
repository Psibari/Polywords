# POLYWORDS â€” CONTEXT.md
### Quick-Reference Session Briefing Â· June 8, 2026

Paste this at the start of any Claude Code session to restore full context.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds 700+ words in her vault. She set every trap. The player challenges her one word at a time to take the title. Every session is a HUNT â€” 12 words, a designed difficulty arc, and Polly's boss word waiting at position 12.

**North star:** *"Waitâ€¦ what? â€¦ Shit, that's right."*

---

## Stack

```
Expo SDK Â· React Native Â· TypeScript strict Â· Zustand+immer
React Native Animated API (Reanimated = SwipeMask.tsx ONLY, frozen)
Expo Haptics Â· Expo AV (â†’ expo-audio pending) Â· Expo Router
Fonts: Gomarice Okuba (hero word + all UI) Â· Inter Medium (tile text) Â· Poppins Bold (HUD score/combo) Â· SuperCartoon (Polly big reactions)
Windows dev: forward-slash paths only
```

---

## Colors (Strict)

```
#1A1830  Background (always)
#F5C842  Gold â€” score, reward, gate, boss word (MAX 2 on screen)
#7B2D8B  Purple â€” trap shards, ghost border, rare events
#9B2D6B  Rose â€” shard gradient partner
#4CAF50  Polly Green â€” Polly mascot ONLY
#0F0D2A  Deep Dark â€” Master Gate background only
#CC2200  Wrong Flash â€” wrong swipe only, never decoration
#FFFFFF  All UI text
```

---

## Swipe Grammar (Sacred)

| Swipe | Meaning | Result |
|---|---|---|
| UP | Real meaning | Magnetic absorb into word |
| RIGHT | Trap | Crystal shard burst |
| Wrong UP | Claimed a trap | Word REJECTS tile â€” shakes, tile exits downward |
| Wrong RIGHT | Rejected real meaning | Tile rubber-bands back, buzzes red, dissolves |

**No left swipe. No tap. No tap-and-submit. Swipe only. Always.**

---

## Current Session (12 words â€” test harness)

## Locked Play Screen Design

POLYWORDS is a word arena, not a quiz list. The hero word is the boss, the active mask tile is the challenger, the Master Gate is Polly's locked cage/vault, and the player steals mastery one swipe at a time.

**Hierarchy:** HERO WORD -> ACTIVE MASK TILE -> MASTER GATE -> HUD / SCORE / FEATHERS / STREAK -> POLLY POP-IN ONLY.

**Polly pop-in design:** Polly is not permanent on the gameplay screen. She appears only at high-emotion moments: 1 pop-in per word round, 2 max for a major event, always at end-of-round win/loss. She pops from bottom-left and never blocks the active tile, right shatter lane, or Master Gate. Mastery line: "BINGO BANGO ZZZZINGO!" Normal ghost failure: "Not yours yet." Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!" This pop-in budget is locked but not implemented yet.

**Layout:** Top quiet HUD for score, feathers, streak. Giant hero word top-center as UP absorb target. Empty middle swipe lane. One active mask tile in lower-middle thumb zone. Clear right toss/shatter lane. MASTER THE WORD gate low on board above nav safe area. Bottom nav reserves Home / Ranks / Vault / Profile. Patch 3 implemented the one-active visible mask tile queue.

**Hero word:** Dominates screen, sits top-center during normal play, absorbs correct UP swipes, and crashes down to center during MASTERED celebration.

**Active mask tile design:** One active tile at a time. Large, premium, tactile, readable. Text must pop with size, weight, contrast, and spacing. All mask tiles look and behave the same until release. No real/trap tells before swipe. Press-hold wakes tile, gives tiny haptic, lifts slightly, follows finger, and release commits. One-active queue is implemented; press-hold polish is pending.

**Swipe motion:** UP claims real meaning; RIGHT rejects trap. No left swipe and no tap-submit. Correct UP feeds the tile into the hero word, which absorbs and pulses. Wrong UP rejects, wrong-flashes, and plucks a feather. Correct RIGHT flings the false meaning right with a "get outta here" feel and purple/rose glass shatter. Wrong RIGHT wrong-flashes and plucks a feather.

**Master Gate:** Text is MASTER THE WORD. It belongs to Polly, not the player. It is a low board bird cage / vault hybrid with subtle tension, `#0F0D2A` surface, faint cage bars, small lock, and quiet gold charge only when earned. The player's Vault is never on the game board; it is a nav/page destination.

**Master Gate unlock:** Last real visible tile absorbs into hero word -> gate border charges gold -> cage bars split slightly left/right -> lock snaps open -> two hidden tiles fly up into active tile position.

**MASTERED celebration design:** Hidden tiles judged correctly -> hero word crashes down center -> diagonal MASTER stamp slams over word -> word cracks open -> Word Core jumps out -> Core grows/glows/spins center-screen -> Core shoots toward Vault nav icon -> Polly pops in: "BINGO BANGO ZZZZINGO!" This rewrite is locked but not implemented yet.

**Word Core:** Mastery trophy. It does not go into the Master Gate. It belongs in the player's Vault page. The Master Gate is Polly's cage, not storage.

**Ghost loss design:** Wrong hidden/master swipe makes failed tile leave, remaining hidden tile stay, failed tile glitch and lose substance, failed tile pulled back, both hidden tiles merge, hero word flickers dull, ghostly presence fades into merged tile, and Ghost Tile forms with MASTER THE WORD / From [WORD]. Microcopy: THE HAUNT BEGINS. The full ghost merge loss sequence is locked but not implemented yet.

**Ghost return / Haunt Words design:** Ghosted words return late in future Hunts, best at word 10 or 11, never replacing Boss Word 12. Entrance copy: REMEMBER ME? If mastered: HAUNT BROKEN. If failed again: STILL HAUNTED. Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!" Haunt return is locked but not implemented yet.

**Feathers:** Hearts are replaced by Feathers. Player starts with 5. Wrong swipe plucks 1. 0 feathers ends run. Score milestones can restore a Life Feather. If full, player can hold 1 reserve feather max.

Current HUD: `GameScreen.tsx` renders five custom feather slots while engine/store state remains named `lives`. Reserve feathers and score milestone restore are not implemented yet.

**Score target/rank design:** Competition system for personal bests, Polly target score, Hunt rank, and future daily/friend/global rankings. Score does not replace mastery. Word Cores are permanent mastery trophies. The score target/rank system is pending.

**Color rules:** `#1A1830` background. `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core. `#7B2D8B` for UI/gate/shards. `#9B2D6B` for trap/ghost shard accents. `#4CAF50` only Polly character. `#0F0D2A` only Master Gate locked surface. `#CC2200` only wrong swipe flash. `#FFFFFF` readable text. No pink/magenta, no orange UI, no green UI, no red except wrong flash, max 2 visible gold elements.

**Implementation order:** Main gameplay layout -> hero word dominance -> one active tile queue (Patch 3 complete) -> press-hold tile behavior -> UP absorb and RIGHT toss/shatter -> Master Gate visual overhaul -> hidden tile unlock -> MASTERED celebration -> ghost merge loss -> feathers and score targets -> Haunt Word return system -> Vault / Ranks / Profile pages.

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
12 ORDER   Boss      Final boss â€” Polly's word
```

---

## Living Pool Model (Phase 2 â€” design locked)

- Always 12 fresh words from Unmastered Pool
- Mastered words permanently graduate to Vault â€” never in standard run again
- Ghost words get priority placement in difficulty tier
- RUN IT BACK = fresh 12-word draw with ghost priority
- Boss always position 12 â€” one per session
- Daily Challenge = only curated fixed session

---

## One-at-a-Time Tile Queue (Design locked - Patch 3 complete)

- One tile flies in at a time. Player swipes. Next tile arrives.
- ALL TILES LOOK IDENTICAL UNTIL SWIPED - Polly gives nothing away
- Ghost tile always first, enters from LEFT
- Ghost unresolvable until perfect clear - merges into split tile sequence
- Random queue order - Speed escalates -20ms per tile (floor 280ms)
- Gap = skill-based: base 350ms, combo reduces, wrong swipe +150ms
- Between tiles: pure silence - emptiness is tension
- Landing position: vertical center of battlefield

Current implementation:
- Patch 3 complete: `MaskBoard.tsx` renders only one active visible mask tile at a time.
- The queue keeps existing shuffled mask order from `store.game.shuffledMasks`.
- The active visible tile advances after the current tile resolves as correct, trap-caught, or wrong.
- A guarded 450ms delay prevents duplicate advances from repeated renders.
- Scoring, swipe grammar, `SwipeMask.tsx`, current Master Gate logic, Ghost tile behavior, and hidden tile flow are preserved.
- Press-hold polish, UP absorb tuning, RIGHT toss/shatter tuning, and proper returning Haunt placement are still pending after the one-active queue.

---
## Master Gate (Auto-opens on perfect clear)

**wrongSwipeOccurred.current MUST reset to false at start of every new word.**

Sequence: Last tile absorbs â†’ border charges clockwise â†’ lock cracks â†’ gate opens â†’ two split tiles drop.

Split tiles: real hidden meaning (UP) + hidden trap (RIGHT).

Both correct â†’ MASTERY SEQUENCE:
MASTERED text first â†’ word swells â†’ crystal shards â†’ seed drops â†’ word compresses â†’ flies to vault icon.

Missed â†’ GHOST (solid purple border, no dashes, phrase NEVER revealed).

Current ghost behavior:
- Ghosts created during the current run are stored but cannot appear until the next run starts.
- The store snapshots `runStartGhostWordIds` at run start.
- `GhostTile` is currently disabled from the Master Gate slot so it cannot block gate unlock/release flow.

---

## Polly Hunt System (Design locked â€” not yet built)

Polly is the MASTER OF WORDS. Every trap is her move. Boss word is hers.

| Trigger | Line |
|---|---|
| Before word 1 | "I've got a word you need to earn." |
| Word 3â†’4 well | "You're moving. I've seen better." |
| Word 3â†’4 struggling | "You'll need more than that." |
| Word 6â†’7 well | "Getting warmer. Keep going." |
| Word 6â†’7 struggling | "Want this word? Show me something." |
| Word 9â†’10 | "Not yet." |
| Word 11â†’12 | "Last one. Then it's just you and me." |
| Boss mastered | "BINGO BANGO ZZZZINGO!" |
| Boss failed | "Thought so." |

---

## The Vault (Replaces Garden â€” permanent; page pending)

- Mastered words = trophies taken from Polly
- Hidden meaning permanently visible here â€” ONLY place in the game
- Boss tiles: full gold border + purple glow + breathing pulse
- Empty state: "Polly has them all." / "Go take one."
- Mastery ends with word compressing â†’ launching to vault nav icon
- Paywall at word 21: "Vault Full / Unlock unlimited"
- Polly has NO presence in vault â€” player's domain only
- Vault / Ranks / Profile pages are pending.

---

## Current Repo State

Completed and committed:
- Locked gameplay screen design added to `CLAUDE.md` and `CONTEXT.md`.
- Patch 1 complete: HUD hearts replaced with custom feather lives in `app/screens/GameScreen.tsx`.
- Patch 2 complete: `app/components/MaskBoard.tsx` layout hierarchy strengthened. Hero word zones and sizes increased, overlays use single-line fitting, `wordScreenY` targets the word-zone center, a 34px swipe lane was added, tile/gate bands were separated, stacked mask area is 86% width and left-biased, and the gate remains low with spacing/reserve.
- Ghost tile styling complete: solid purple border, locked dark/purple treatment, no dashed styling.
- MasterGateTile forbidden colors complete: removed Polly Green `#4CAF50` and Polly Orange `#FF8C00`; gate sweep uses gold opacity values only.
- `wrongSwipeOccurred.current` reset verified correct and stale debug `console.log` removed.
- Mastery word swell scale complete: target changed from 2.8 to 1.6.
- Patch 3 complete: one active visible mask tile queue implemented in `app/components/MaskBoard.tsx`; it preserves scoring, swipe grammar, `SwipeMask.tsx`, Master Gate logic, hidden tile flow, and Ghost tile behavior.

Remaining pending:
1. Press-hold tile polish after one-active queue.
2. UP absorb and RIGHT toss/shatter tuning for the single-tile arena.
3. Master Gate visual overhaul: Polly cage/vault hybrid, low on board, faint cage bars, small lock, subtle tension.
4. Hidden tiles flying up into active tile position.
5. MASTERED celebration rewrite: hero word crashes center, diagonal MASTER stamp, word cracks open, Word Core jumps out/grows/glows/spins, Core shoots toward Vault nav icon, Polly says "BINGO BANGO ZZZZINGO!".
6. Ghost merge loss sequence: wrong hidden tile merges with remaining hidden tile, hero word loses life essence, Ghost Tile forms, "THE HAUNT BEGINS".
7. Haunt Word return system: late Hunt return at word 10 or 11, never Boss 12, REMEMBER ME? / HAUNT BROKEN / STILL HAUNTED / "BBBLAAAAHHAHAHA!".
8. Polly pop-in budget: not permanent, 1 per word round, 2 max for major moments, always at end-of-round win/loss.
9. Score target/rank system for personal best, Polly target, Hunt rank, future daily/friend/global rankings.
10. Life Feather milestone/reserve system: UI feathers exist; score milestone restore and 1 reserve feather are not implemented yet.
11. Vault / Ranks / Profile pages.
12. `expo-av` to `expo-audio` migration.

---
## Cut List (Never Suggest These)

```
â˜ ï¸ Garden (dead â€” Vault replaced it)
â˜ ï¸ Simultaneous tile render (dead â€” one-at-a-time queue)
â˜ ï¸ Switchback / Phrase Break / SlangDropScreen in main session
â˜ ï¸ Left swipe / tap interactions
â˜ ï¸ Dashed borders / pink / magenta colors
â˜ ï¸ Red for text or decoration
â˜ ï¸ Visual tells on tiles before swipe
â˜ ï¸ Reanimated outside SwipeMask.tsx
â˜ ï¸ Rectangle/square particles
â˜ ï¸ RATTLED. in any color except white
â˜ ï¸ Circular Polly crop
â˜ ï¸ More than 2 gold elements simultaneously
```

---

## Non-Negotiable Rules

- tsc --noEmit must exit 0 before device test
- One prompt, one concern â€” surgical always
- useNativeDriver: true â†’ transform/opacity only
- useNativeDriver: false â†’ height/margin/backgroundColor only
- Never chain both drivers on same Animated.Value
- setTimeout between phases â€” never .start() callbacks
- Ghost wordId = WORD STRING always (e.g. "BARK") not stepIndex
- Boss position 12 always â€” non-negotiable
- "Thought so." â€” never change
- "BINGO BANGO ZZZZINGO!" â€” never change

---

## File Map (Key Files)

```
app/components/MaskBoard.tsx         Main game board â€” primary file
app/components/SwipeMask.tsx         Tile + swipe physics (Reanimated â€” frozen)
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

*POLYWORDS CONTEXT.md Â· Pete DiBari Â· June 8, 2026*

