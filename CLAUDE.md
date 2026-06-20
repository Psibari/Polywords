# POLYWORDS — CLAUDE.md
### Ground Truth for Claude Code · Updated June 20, 2026

Full patch-by-patch history lives in `docs/CHANGELOG.md` — read it on demand, it is not auto-loaded. This file describes only the current state of the game and the rules that govern future changes.

---

## The Game in One Sentence

Polly is the Master of Words. She holds every word in her vault. The player challenges her — one word at a time — to take the title.

## The North Star

> *"The word is the puzzle. The masks are Polly's traps. The reveal is what she's been hiding. The near miss is her winning. The vault is yours to fill. And Polly has been Master of Words long enough."*

## App Shell Identity

Home is the arcade lobby / launchpad. Play is the arena. Word Vault is the player's reclaimed meaning archive. Settings is utility for player/account/preferences/about. Profile belongs inside Settings for MVP and should not be a main nav tab. Bottom nav tabs are Home / Play / Vault / Settings, visible outside active gameplay only.

`docs/POLLY_DIALOGUE_BANK.md` is the source-of-truth bank for future Polly dialogue ideas, approved tone examples, raw seeds, ghost/system copy, boss-word taunts, and lines to avoid.

---

## Polly — Master of Words

**Who she is:** Polly is the REIGNING MASTER OF WORDS. Not a mascot. The antagonist. The title holder. She holds every word in her vault. She set every trap. She knows every meaning. The player's goal is to take her title one word at a time.

**The traps:** Every trap tile is POLLY'S MOVE. She planted them deliberately to protect her words. Catching a trap = beating one of Polly's defenses.

**The boss word:** Polly's signature word per session. Her most confident defense. She throws it down herself at position 12.

**The vault transfer:** When a word is mastered, it leaves Polly's vault and enters the player's. That word is gone from Polly's possession permanently.

**The slogan:** "WORDS HAVE MEANING.....sssss" — Polly's dare. Not a statement of fact. A challenge.

**Endgame:** The database is a living system — it grows over time. New words enter Polly's vault. The title of Master of Words is never permanent. The challenge never ends.

---

## Tech Stack

```
Runtime:        Expo SDK (managed workflow)
Language:       TypeScript (strict)
Framework:      React Native
State:          Zustand + immer middleware
Animation:      React Native Animated API (primary)
Exception:      Reanimated — SwipeMask.tsx ONLY — frozen, no new usage ever
Haptics:        Expo Haptics
Audio:          Expo AV → migrating to expo-audio
Navigation:     Expo Router
Fonts:          Bungee Shade (hero word extrusion) · BebasNeue-Regular (hero word face) · Barlow Condensed Bold (all UI) · Lilita One (Polly speech)
Testing:        Expo Go via QR code on physical device
Version control: Git + GitHub
Editor:         VS Code (Windows — use forward-slash paths)
```

### Animation Rules — Non-Negotiable
```
useNativeDriver: true  → transform, opacity ONLY
useNativeDriver: false → height, margin, backgroundColor ONLY
NEVER mix on same Animated.Value
Use setTimeout between phases — NEVER .start() callbacks
Reanimated locked to SwipeMask.tsx ONLY — never import elsewhere
```

---

## Palette — Strict

| Token | Hex | Use |
|---|---|---|
| Background | `#1A1830` | Every screen background. Always. |
| Gold | `#F5C842` | Score, boss word, reward, gate unlock — MAX 2 gold elements simultaneously |
| Purple | `#7B2D8B` | Trap shatter, rare events, ghost tile border, Polly accent |
| Rose | `#9B2D6B` | Crystal shard gradient partner with purple |
| Polly Green | `#4CAF50` | Polly mascot ONLY — never as UI chrome |
| Deep Dark | `#0F0D2A` | Master Gate locked background and player Vault archive/card surfaces |
| Wrong Flash | `#CC2200` | Wrong-swipe flash ONLY — never decoration, never text |
| White | `#FFFFFF` | All UI text on dark surfaces |

🔒 Red is wrong-swipe flash only. Never text. Never decoration.
🔒 Polly Green reserved for Polly exclusively.
🔒 Max 2 gold elements on screen simultaneously.

---

## Typography

| Element | Font | Size |
|---|---|---|
| Hero word — normal | Bungee Shade (extrusion) + BebasNeue-Regular (face) | 96px |
| Hero word — Boss | Bungee Shade (extrusion) + BebasNeue-Regular (face) | 114px, gold |
| All UI labels, gate text, HUD labels | Barlow Condensed Bold | varies, uppercase |
| Tile mask text | Barlow Condensed Bold | 26px, adjustsFontSizeToFit |
| HUD score | Barlow Condensed Bold | 18px |
| Combo multiplier | Barlow Condensed Bold | 26px — GOLD #F5C842 only |
| Grade text (RATTLED etc) | Barlow Condensed Bold | 48px — WHITE only |
| MASTER stamp | Barlow Condensed Bold | 44px, diagonal, gold |
| Polly speech lines | Lilita One | varies |

---

## Session Model — THE HUNT

### The Fundamental Architecture

Every POLY RUN is a HUNT. Always 12 words. Always a designed difficulty arc. Always a boss at position 12. The player hunts through 11 words to confront the boss word that Polly holds.

**Lives are session lives — 5 lives for the entire 12-word hunt.**

### Golden Pacing System

`docs/GOLDEN_PACING_SYSTEM.md` is the durable source of truth for Hunt emotional rhythm, Semantic Snap Rate, content selection, and future content metadata. It defines the target cycle: Recognition -> Doubt -> Discovery -> Confidence -> Tension -> Mastery.

The system is documentation only for now. Do not hardcode pacing logic or automated Hunt generation until a manually tagged test set exists.

The GPS defines the target emotional arc: 2 Confidence + 3 Flow + 3 Tension + 3 Panic + 1 Boss per Hunt. Core principle: POLYWORDS is a semantic combat game — the word is the boss, masks are Polly's defenses, mastery is taking the word away from her. Primary success metric: Semantic Snap Rate. The Semantic Snap is the "Wait… what? Oh. Right." moment.

| Position | Phase | Difficulty | Emotional Target |
|---|---|---|---|
| 1–2 | Confidence Zone | Easy | Player feels capable immediately |
| 3–5 | Rhythm Zone | Medium | Flow state, combo building |
| 6–8 | Tension Zone | Medium-Hard | First traps sting, stakes rising |
| 9–11 | Panic Zone | Hard | Wrong swipes cost, near-misses |
| 12 | Boss — THE CONFRONTATION | Maximum | Climax. Polly's word. |

🔒 Boss word is ALWAYS position 12. Non-negotiable.

### Living Pool Model

The 700+ word database is divided into:

**Unmastered Pool:** All words not yet mastered. Every standard POLY RUN draws from here. Difficulty arc determines placement.

**Ghost Queue:** Words where player missed hidden meaning. Priority placement in next session's difficulty tier.

**Mastered (Graduated):** Perfect cleared including hidden meaning. PERMANENTLY LEAVES the Unmastered Pool. Goes to THE VAULT. Never appears in standard POLY RUN again.

**RUN IT BACK:** Always a fresh 12-word draw with ghost priority. Never replays same session. Never resumes from death. Always fresh with ghost words prioritized.

**Daily Challenge:** The ONE curated fixed session. Same 12 words for every player every day. Exception, not the rule.

### Hunt Generation (Current)

Live Hunt generation draws from `assets/data/huntData.json` via `app/game/huntGenerator.ts` (GPS tier sampling, Mulberry32 PRNG, ghost priority at index 9, boss-first selection, fallback tiers). `app/game/session.ts`'s static `SESSION` (WAVE → CAST, 12 words) remains the fallback/reference session if generation fails. Words 1–11 carry no hidden meaning — gate and mastery are boss-only.

---

## Swipe Grammar — Sacred

| Gesture | Meaning | Result |
|---|---|---|
| Swipe UP | This IS a real meaning | Correct: magnetic absorb into word |
| Swipe RIGHT | This is a TRAP | Correct: purple/rose crystal shard burst |
| Wrong UP (trap swiped up) | Claimed a trap | Feather lost, tile exits permanently, red flash |
| Wrong RIGHT (real swiped right) | Rejected a real meaning | Feather lost, tile exits permanently, red flash |

🔒 UP = real. RIGHT = trap. Sacred. Permanent. Never change.
🔒 No left swipe. No tap. No tap-and-submit. Swipe only.

### Wrong Swipe Behaviors — Locked

Wrong swipes are permanent. The tile exits immediately, the player loses 1 feather, and the same tile is never retried.

- No snap-back.
- No rubber-band return.
- No tile staying in the deck after a wrong swipe.
- No retrying the same tile after a wrong swipe.
- The word continues when feathers remain; run/haunt logic handles zero-feather or boss failure outcomes.

---

## One-at-a-Time Tile Queue System — LOCKED DESIGN

### Fundamentals
One tile enters at a time. Player makes one binary decision. Next tile arrives after resolution. Feels like a fight, not a quiz.

### Current Rules
- All visible tiles for a word arrive as a stacked deck; only the top tile is interactive.
- Correct real meanings and caught traps leave the deck after judgment.
- Wrong swipes are permanent: the tile exits, 1 feather is lost, and the same tile is never retried.
- No snap-back, no rubber-band return, and no wrong tile staying in the deck.
- Words 1-11 have no hidden tile, no gate opening, no mastery overlay, and no ghost creation.
- Non-boss deck empty -> `triggerWordExit()` -> `store.completeWord()`.
- Boss perfect visible clear opens the gate and drops exactly one mystery tile.
- Boss mystery tile is randomly either the real hidden meaning or hidden trap.
- Boss mystery correct judgment = MASTERED. Boss mystery wrong judgment = GHOST.
- Boss visible-mask wrong swipe locks the gate and the boss word advances without mastery or ghost.
- Existing scoring and UP/RIGHT swipe grammar are preserved.

### Deck Build Rules
1. Remaining visible masks are shuffled into the per-word deck.
2. Only the top tile is interactive.
3. Wrong tiles leave permanently after judgment.
4. Haunt return, when present, is injected at index 9 (position 10) before the run starts.
5. Boss word remains position 12 and is never replaced by haunt placement.

### Gap System (Skill-Based)
```
BASE GAP: 350ms

COMBO MODIFIER:
  x1-x3:   +100ms
  x4-x6:   +0ms
  x7-x9:   -80ms
  x10+:    -150ms

RESOLUTION TYPE:
  Correct UP:    base
  Correct RIGHT: -50ms
  Wrong swipe:   +150ms

BOSS WORD: all gaps -100ms
MINIMUM: 150ms - MAXIMUM: 500ms
```

### Tile Entry
- Origin: bottom of screen, below viewport
- Travel: upward arc, slight rightward curve
- Duration: 380ms standard, 280ms boss
- Physics: spring tension 180, friction 14
- Landing: vertical center of battlefield
- On landing: border brightens, impactAsync(Light)

### Speed Escalation
Tile 1: 380ms - Tile 2: 360ms - Tile 3: 340ms - Tile 4: 320ms - Tile 5: 300ms - Tile 6+: 280ms floor
Boss: starts 300ms, floors 220ms

### Between Tiles
Pure silence. Nothing fires. Emptiness is tension. Polly gives nothing away.

### Near Mastery Signal (Final 2 Tiles)
- Gate border: 22% -> 45% opacity
- Lock pulse: 2400ms -> 1200ms
- Entry haptic upgrades to impactAsync(Medium)

### ALL TILES LOOK IDENTICAL UNTIL SWIPED
Polly gives nothing away. No visual tells. No color hints. No speed variation by type.

---
## Master the Word — Boss-Only Sequence

### ACT 1 — LOCKED STATE
- Background: #0F0D2A · Border: 1.5px gold 22% · Lock breathing pulse · Height: 72px
- Zero player interaction ever
- Words 1-11 never open the gate.

### ACT 2 — THE BREAK (Perfect Clear — Auto)
Boss word only. `wrongSwipeOccurred.current` must be false. Player NEVER swipes gate.
```
T+0ms    Last tile absorbed
T+0ms    Gold light clockwise around border, 600ms
T+100ms  Lock shackle cracks
T+300ms  Border → 100% opacity
T+400ms  ONE heavy haptic
T+500ms  Sound: ascending chime + bass
T+600ms  Gate bg → #150C00
T+700ms  Polly (first-time): "Only with a perfect sweep"
```

### ACT 3 — THE RELEASE
T+900ms: ONE mystery tile drops into the active tile position.
- Mystery tile is randomly either the real hidden meaning or the hidden trap.
- No two hidden split tiles.
- No second hidden tile.

### ACT 4 — THE JUDGMENT
- Correct UP: magnetic absorb, word FLARES gold, Polly hiddenReveal
- Correct RIGHT: 18 shards, faster, double bloom
- Correct judgment on the mystery tile: MASTERED
- Wrong judgment on the mystery tile: GHOST
- Wrong mystery swipe loses 1 feather and triggers the simplified boss failure path.

### ACT 5 — MASTERY SEQUENCE
```
T+0ms    Boss mystery tile judged correctly.
T+0ms    Hero word crashes toward center with impact.
T+360ms  Diagonal MASTER stamp slams over the word.
T+800ms  Word cracks / energy effect appears.
T+1900ms Word Core appears, grows, glows, and spins center-screen.
T+2100ms Word Core shoots toward the Vault nav area.
T+2400ms Vault impact bloom and heavy haptic.
T+2600ms Boss mastery: Polly opponent line "Fine. Take it."
T+2600ms Boss mastery may additionally trigger GAME/SYSTEM stinger:
         BINGO -> BANGO -> ZZZZINGO!
```

🔒 Diagonal MASTER stamp over the word — not the old "MASTERED" label below the word.
🔒 Word Core goes toward the Vault nav icon, never into the Master Gate.
🔒 Polly is not the achievement voice.
🔒 Crystal shards are POLYGON geometry — never rectangles or squares.

### BINGO BANGO ZZZZINGO! — System Stinger

`BINGO BANGO ZZZZINGO!` is NOT Polly dialogue.

Use it only as a rare GAME/SYSTEM achievement stinger:
- Trigger only when a Boss Word is fully mastered and the Word Core is vaulted.
- Do not use it for every mastered word.
- Do not use it as Polly dialogue.
- Presentation: one word at a time, hard entrance for each word, each word lands with a BOOM-style impact.
- Rhythm: BINGO / BANGO / ZZZZINGO!
- `ZZZZINGO!` gets the biggest impact.

This is the game acknowledging a major achievement, not Polly celebrating the player.

### Polly Mastery Reaction

Polly is the opponent, not a friendly celebration mascot. The hierarchy is:
- Game celebrates the player.
- Polly resents it.

Boss word mastered:
- Game/system may trigger `BINGO BANGO ZZZZINGO!` after Word Core vault impact.
- Polly may pop in separately with an annoyed opponent line.
- Suggested line: "Fine. Take it."

### ACT 6 — THE GHOST (Boss Only)
- Background: rgba(123,45,139,0.06) · Border: SOLID 1.5px rgba(123,45,139,0.55)
- NO DASHES, NO PINK, NO MAGENTA
- Purple dot top-right: 6px slow pulse
- Text: "MASTER THE WORD" — white 70% · Subtitle: "From [WORD]" — dim purple
- The phrase is NEVER revealed.
- Triggered only by boss failure.
- Ghost `wordId` is always the word string, never `stepIndex`.

---

## The Polly Hunt System — 6 Acts

Hunt-level appearances fire in word TRANSITIONS (400-600ms). Max 4 per session. Never interrupt play.

### All Locked Lines

| Trigger | Line |
|---|---|
| Before word 1 | "I've got a word you need to earn." |
| Word 3→4, doing well | "You're moving. I've seen better." |
| Word 3→4, struggling | "You'll need more than that." |
| Word 6→7, doing well | "Getting warmer. Keep going." |
| Word 6→7, struggling | "Want this word? Show me something." |
| Word 9→10 | "Not yet." |
| Word 11→12 | "Last one. Then it's just you and me." |
| Boss mastered | "Fine. Take it." |
| Boss failed | "Thought so." |

### In-Round Lines (max 2 per round)

| Trigger | Line |
|---|---|
| First correct swipe (rare) | "Word up." |
| Mastery | "That was mine." |
| Wrong swipe | "Nope." / "Hard no." |
| 3+ wrong same word | "BLAHH HA HA HA" |
| Perfect clear | "Clean sweep." |
| Ghost tile appears | Silent — sway loop |
| 1 heart left | "Oh. NOOOooo" |
| Boss word entry | "Did you just—" |
| Game over | "AARRRGGHH" |
| Hesitation 3s | "You sure about that." |
| Hesitation 6s | "Really. That one." |
| Hesitation 9s | "Hard no." |
| Results / ghost set | "That one's waiting for you." |
| Hidden meaning found | "Deep cut. Most miss that one." |
| Ghost birth | "Not yours yet." |

🔒 "Thought so." — never change it.
🔒 `BINGO BANGO ZZZZINGO!` is game/system achievement text only, never Polly dialogue.
🔒 Max 2 Polly in-round appearances per word. Hunt-level = separate system.
🔒 Boss word drops FROM Polly's direction — she throws it.

---

## The Word Vault — Player Archive

The Word Vault is the player's reclaimed meaning archive and trophy room. It is distinct from Polly's Master Gate cage/vault in gameplay.

Current Vault sections:
- Mastered Words
- Ghost Words
- Hidden Meanings
- Ranks

`VaultScreen.tsx` reads real persisted progress from `useGameStore`: `masteredWords`, `personalBest`, and `runsCompleted`. Progress writes through `recordMastery`, `recordRunComplete`, and loads through `loadProgress`. Ghost Words reads real ghost data.

Vault Ranks tiers:
- D below 8,000
- C at 8,000
- B at 11,000
- A at 14,000
- S at 18,000
- MASTER at 22,000

The Ranks tab shows personal best, rank ladder, progress to next rank, Polly target status, runs completed, and words mastered.

The page must feel player-owned: dark magical archive, trophy-card shelves, word plaques, subtle vault/archive geometry. Avoid cage, prison, chain, or Polly-lair visuals.

### Vault Design
- Background: `#1A1830`.
- Archive/card surfaces: `#0F0D2A`.
- Gold `#F5C842` restrained for WORD VAULT title and important stat accents.
- Purple `#7B2D8B` for section frames, archive marks, and shelf UI.
- Rose `#9B2D6B` only for Ghost Words accents.
- Standard future tile: trophy-card/plaque treatment, hidden meaning below when real data exists, date mastered.
- Boss future tile: restrained gold border, purple inner accent, earned glow.

### Empty State
Use archive/collection language, not Polly ownership language. Current shell copy:
- Mastered Words: "Fully reclaimed words live here."
- Ghost Words: "Missed meanings waiting for a rematch."
- Hidden Meanings: "Rare meanings you cracked open."
- Ranks: local personal best, rank ladder, Polly target status, runs completed, and words mastered.

### Arrival Animation
Word compresses → gold tile → launches to vault nav icon → vault icon blooms → impactAsync(Heavy) → THUNK sound

### Paywall (Word 21)
No Polly. Frosted overlay on word 21.
"VAULT FULL" / "Unlock unlimited to keep going." / CTA: "UNLOCK UNLIMITED"

### Navigation
Tab: "VAULT" · Icon: heavy vault door, partially open, gold light spilling

---

## Ghost System

**Creates a ghost:** Boss-only failure after the boss gate mystery tile is judged wrong. Non-boss words never create true ghosts.

**Ghost tile styling — LOCKED:**
- Background: rgba(123,45,139,0.06)
- Border: SOLID 1.5px rgba(123,45,139,0.55) — NO DASHES, NO PINK, NO MAGENTA
- Purple dot top-right: 6px, slow pulse
- Text: "MASTER THE WORD" — white 70%
- Subtitle: "From [WORD]" — dim purple
- Phrase NEVER revealed

**Ghost wordId:** Always use WORD STRING (e.g. "BARK") — not stepIndex.

**Current implementation note:**
- Ghosts created during the current run are stored but do not appear until a new run starts.
- `useGameStore.runStartGhostWordIds` snapshots which ghosts existed at run start.
- Haunt return placement is position 10 / index 9.
- Haunt return never replaces boss position 12.

### Boss Ghost Loss Sequence

Triggered when the boss mystery tile is judged wrong.

```
T+0ms    Wrong mystery swipe released
T+0ms    Tile exits permanently through the wrong-swipe path.
T+800ms  HAUNTED overlay appears.
T+1500ms Polly may answer as opponent: "Not yours yet."
T+1900ms Exit to next word/results flow.
```

---

## Visual Effects

### Magnetic Absorb (Correct UP)
```
k = 44 + 390 * elapsed
Damping: Math.pow(0.84, dt * 60)
Word ceiling: tile cannot overshoot above word
Gold fill: pale honey → rich gold, glow 8px→32px
```

### Crystal Shard Burst (Correct RIGHT)
🔒 POLYGON shards — NOT rectangles, NOT squares
- 18 current trap shatter burst
- Purple #7B2D8B + rose #9B2D6B
- Rightward bias, gravity-affected, individual rotation
- Purple bloom from break point
- Haptic: Heavy + triple buzz

### Boss Word Entrance
```
T+0ms    Previous word exits
T+200ms  200ms silence
T+400ms  Purple shockwave + three heavy haptics (0/180/360ms)
T+800ms  Polly top-right, throwing gesture
T+800ms  Boss word drops FROM Polly's direction
T+1000ms "POLLY'S WORD · 2× SCORE" badge
T+1100ms Gold underline traces left→right
T+1400ms Tiles stagger in at 120ms intervals
```

---

## Haptic Map

| Event | Pattern |
|---|---|
| Tile press-and-hold | impactAsync(Light) → 40ms → impactAsync(Medium) → 45ms → impactAsync(Medium) |
| Correct swipe | impactAsync(Medium) → 80ms → impactAsync(Light) |
| Trap caught (RIGHT) | impactAsync(Heavy) → 60ms → notificationAsync(Success) |
| Wrong swipe | notificationAsync(Error) — single, no echo |
| Gate unlock | impactAsync(Heavy) × 1 |
| Boss word entrance | impactAsync(Heavy) × 3 at 0/180/360ms |
| Hidden meaning reveal | notificationAsync(Success) → 120ms → impactAsync(Medium) |
| Mastery celebration | notificationAsync(Success) |
| Vault impact / core landing | impactAsync(Heavy) |
| Vault arrival | impactAsync(Heavy) |

---

## Scoring

| Action | Reward |
|---|---|
| Correct real meaning | Base + combo multiplier |
| Trap caught correctly | Trap bonus |
| Perfect clear | Large bonus + Polly |
| Boss clear | 2× all scoring |
| Wrong swipe | Life lost, combo resets |
| Previously mastered word (future run) | 2× all swipes |

**Combo counter: GOLD #F5C842 with glow — NEVER orange, never red.**

`submitBossMastery()` in `polyRunEngine.ts` handles boss mastery scoring (600 × chainMultiplier, feather-milestone aware, sets `pollyTrigger: 'bossMastery'`).

### Polly Target Score System

- Polly's target: 15,000 pts (fixed MVP, scales Phase 2)
- Rank scale: D below 8,000 · C at 8,000 · B at 11,000 · A at 14,000 · S at 18,000 · MASTER at 22,000
- "BEAT POLLY" is separate from rank — coexists independently
- "YOU BEAT POLLY" shown on results when score ≥ 15,000
- "POLLY HUNT COMPLETE" is the results screen session header
- Suppress mid-run "POLLY BEATEN" flash — reveal on results only
- Pre-hunt display shows 2 numbers only: Polly's Score + Your Best
- Life Feather milestones: 8,000 pts and 16,000 pts restore 1 feather
- Score ≠ Mastery — explicitly separate systems

---

## Current Status / Pending Work

- Full patch history: `docs/CHANGELOG.md`.
- Continue running Mask Rewriter sessions to grow `huntData.json` beyond 232 words (target 400+; threshold of 400 reached June 15, 2026 per latest content pipeline state in changelog — verify current count before relying on it).
- Future daily/friend/global leaderboards and deeper social ranking systems.
- `expo-av` to `expo-audio` migration still pending.

### Pinned / Blocked

**Polly Redesign — BLOCKED** until new sprite delivered.
- Current sprite too humanoid for planned flight animation system.
- File: `assets/images/polly_sprite.png` — 3×3 PNG, 418×418 cells.
- New animation design (do not build yet): mid-round fly-through (enter bottom-left, hover, exit bottom-right), end-of-round perch (land on branch bottom-right, stay until next word, branch pulled off screen on exit).
- No code work until new bird-like sprite is delivered.

**Live Content Engine — POST-LAUNCH ONLY. DO NOT BUILD BEFORE LAUNCH.**
After launch, this system keeps content fresh for returning players: finds zero-tile words and generates them, periodically rewrites existing tile sets, generates GPS-compliant Hunt arcs from the updated database, and the game fetches `huntData.json` from a CDN instead of bundled JSON. Built on `tools/content/mask-rewriter` (Node/Express). Content laws enforced: min 2 reals, max 3 traps per real, GPS arc rules. Hosting TBD. v2 post-launch feature only.

---

## Cut List ☠️ — Permanent

- ☠️ Garden — replaced by Vault permanently
- ☠️ Simultaneous tile render — replaced by one-at-a-time queue
- ☠️ Switchback rounds in main session
- ☠️ Phrase Break rounds in main session
- ☠️ SlangDropScreen as separate component
- ☠️ Left swipe
- ☠️ Circular Polly crop
- ☠️ Dashed borders on any tile
- ☠️ Pink or magenta colors
- ☠️ Red for text or decoration
- ☠️ Polly Green for UI elements
- ☠️ More than 2 gold elements simultaneously
- ☠️ RATTLED. in any color except white
- ☠️ Reanimated outside SwipeMask.tsx
- ☠️ Rectangle/square particles
- ☠️ Old "MASTERED" label-below-word celebration
- ☠️ Visual tells on tiles before swipe
- ☠️ phraseBreakPool, slangPool, switchbackPool
- ☠️ expo-av (migrating)
- ☠️ "reverseMountOrder" bossModifier
- ☠️ Snap-back wrong swipes — replaced by permanent tile exit
- ☠️ Two-tile hidden gate split — replaced by single mystery tile
- ☠️ Ghost system for non-boss words — ghosts are boss-only
- ☠️ MASTERED/HAUNTED overlays for non-boss words
- ☠️ hiddenEmoji and hiddenTrapEmoji fields on WordStep
- ☠️ revealHidden() — removed
- ☠️ hiddenFound in WordResult — removed
- ☠️ pollyTrigger 'hiddenReveal' — replaced by 'bossMastery'
- ☠️ addBonusScore(300) in triggerMastered — removed
- ☠️ HIDDEN tile type — removed from content pipeline entirely

---

## Locked Decisions — Non-Negotiable

- Session: always 12 words, always boss at position 12
- Swipe UP = real. Swipe RIGHT = trap. Always.
- Living Pool: mastered words graduate permanently
- RUN IT BACK = fresh draw, ghost priority
- Boss position 12 = confrontation endpoint
- Polly throws boss word at position 12
- Gate auto-opens only on boss perfect clear — never swipe to open
- wrongSwipeOccurred.current resets at start of every new word
- Crystal shards: polygon, purple/rose, radial burst — never rectangles
- Diagonal MASTER stamp over crashed word during mastery celebration
- Ghost tile never reveals missed phrase
- "Thought so." — never change
- "BINGO BANGO ZZZZINGO!" spelling — never change
- "BINGO BANGO ZZZZINGO!" is rare game/system achievement text only, never Polly dialogue
- Database grows over time — no finish line, no endgame
- All tiles identical until swiped — Polly gives nothing away
- Vault replaces Garden — permanent
- "POLLY CLIPPED YOUR RUN." replaces GAME OVER at zero feathers
- "POLLY HUNT COMPLETE" is the results screen session header
- "YOU BEAT POLLY" fires on results when score ≥ 15,000
- Polly's target score: 15,000 pts (MVP fixed)
- Rank scale: D below 8,000 / C at 8,000 / B at 11,000 / A at 14,000 / S at 18,000 / MASTER at 22,000
- Life Feather milestones: 8,000 and 16,000 pts restore 1 feather; 1 reserve feather max is implemented
- "You left me behind." — micro-copy on ghost birth
- "Not yours yet." — Polly line on ghost exit
- Wrong swipes are permanent — tile flies away, no snap-back, no retry
- Gate opens on boss word perfect clear only — words 1—11 never open the gate
- MASTERED is boss-only — only word 12 (boss) can be vaulted per hunt
- GHOST is boss-only — only boss failure creates a true ghost
- Boss gate uses one mystery tile — randomly real or trap — one shot
- Non-boss words advance via triggerWordExit() — no overlay, no gate
- Haunt slot is index 9 (position 10) — never indexes 10 or 11 (boss zone)
- Ghost wordId = word string always — never stepIndex
- Boss word player-facing display name: "POLLY'S WORD" (replaces "BOSS WORD" in all UI copy). Engine flags (eventType: 'bossWord', bossModifier) unchanged.
- Live Content Engine is POST-LAUNCH ONLY — do not build pre-launch
- Content law locked: min 2 reals per word, max 3 traps per real

---

## Claude Code Conventions

- Always `tsc --noEmit` after every change — must exit 0
- One prompt, one concern — surgical only
- Confirm exact file paths before editing
- Read the relevant file fully before touching it
- useNativeDriver: false → height/margin/backgroundColor only
- useNativeDriver: true → transform/opacity only
- Never chain both drivers on same Animated.Value
- setTimeout between phases — never .start() callbacks
- Never add tap handlers to tiles — swipe only
- Forward-slash paths on Windows
- When a patch/feature is completed, add a one-line entry to `docs/CHANGELOG.md`, not to this file. Only update this file when the *current rules* actually change.

---

## File Map (Key Files)

```
app/components/MaskBoard.tsx         Main game board
app/components/SwipeMask.tsx         Tile + swipe physics (Reanimated — frozen)
app/components/MasterGateTile.tsx    Gate: locked / unlock / boss mystery tile
app/components/PollyCard.tsx         Polly sprite + speech
app/components/PollyController.tsx   Polly trigger system
app/game/session.ts                  12-word fallback session data
app/game/huntGenerator.ts            Live Hunt generation (GPS tier sampling)
app/game/polyRunEngine.ts            Game state engine
app/game/types.ts                    All TypeScript types
app/store/useGameStore.ts            Zustand store
app/screens/GameScreen.tsx           Main game screen
app/screens/ResultsScreen.tsx        End-of-run results
app/screens/DailyChallengeScreen.tsx Daily Challenge screen
app/game/dailyChallengeEngine.ts     Daily session builder, engine functions, result builder
app/game/dailyPool.ts                Daily word pool (tiered)
app/utils/SoundEngine.ts             WAV synthesis
assets/data/huntData.json            Tiled word database (live Hunt generation source)
tools/content/mask-rewriter          Local-only content rewrite/audit tool; never wire into player app
```

---

## Locked Play Screen Design

### Core Identity

POLYWORDS is a word arena, not a quiz list. The hero word is the boss. The active mask tile is the challenger. The Master Gate is Polly's locked cage/vault. The player steals mastery one swipe at a time.

### Main Hierarchy

1. HERO WORD
2. ACTIVE MASK TILE
3. MASTER GATE
4. HUD / SCORE / FEATHERS / STREAK
5. POLLY POP-IN ONLY

### Polly Presence

- Gameplay Polly render is conditional on `pollyPopInVisible`; Polly is not in the tree during ordinary active play.
- Polly is not a permanent gameplay presence.
- Polly is the opponent, not a friendly celebration mascot.
- Polly appears only as a pop-in.
- 1 pop-in during a big moment in a word round.
- Polly always appears at end of round win/loss.
- Polly pops from bottom-left and never blocks the active tile, right shatter lane, Master Gate, or boss mystery tile.
- Polly sprite size is 160 for a larger opponent reaction presentation.
- Speech bubble sits above/above-right of Polly.
- Non-boss words do not show mastery/ghost overlays.
- Boss mastery opponent line: "Fine. Take it."
- Boss ghost failure line: "Not yours yet."
- Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!"
- `BINGO BANGO ZZZZINGO!` is not Polly dialogue.

### Screen Layout

- Top: quiet HUD with score, feathers, streak.
- Upper center: giant hero word, dominant, top-center, absorb target.
- Middle: empty swipe lane for UP motion.
- Lower-middle: one active mask tile only.
- Right side: clear toss/shatter lane.
- Low board: MASTER THE WORD gate, Polly's cage/vault hybrid.
- Bottom: nav bar room for Home / Play / Vault / Settings outside active gameplay only.

### Hero Word

- Must dominate screen.
- Sits top-center during normal play.
- Acts as absorb target for UP swipes.
- During MASTERED celebration, crashes down to center.

### Active Mask Tile

- One active tile at a time.
- Tile sits in lower-middle thumb-comfort zone.
- Tile is large, premium, tactile, readable.
- Text must pop with size, weight, contrast, and spacing.
- All mask tiles look and behave the same until release.
- No real/trap tells before swipe.
- Press-hold interaction: tile wakes up → tiny haptic → tile lifts slightly → tile follows player finger → release commits decision.

### Swipe Motion

- UP = claim real meaning. RIGHT = reject trap. No left swipe. No tap-submit.
- Correct UP feeds real meaning into hero word. Tile travels upward into word. Word absorbs tile and pulses.
- Wrong UP on trap causes rejection, wrong flash, feather loss.
- Correct RIGHT tosses false meaning out. Tile flings right with "get outta here" feel. Trap shatters like glass because false meaning has no substance. Shards use purple/rose crystal language.
- Wrong RIGHT on real meaning fails, wrong flash, feather loss.

### Master Gate

- Text: MASTER THE WORD.
- Gate belongs to Polly, not the player.
- Gate opens only on boss word perfect clear. Words 1-11 never open the gate.
- Low on board, above nav bar safe area.
- Bird cage / vault hybrid. Subtle tension, never overbearing.
- Surface uses `#0F0D2A`. Faint cage bars. Small lock. Quiet gold charge only when earned.
- The player's Vault is not on the game board. It is a nav/page destination.

### Master Gate Unlock

1. Boss word only: last real visible tile absorbs into hero word.
2. Gate border charges gold.
3. Cage bars split slightly left/right.
4. Lock snaps open.
5. One mystery tile drops into active tile position.
6. Mystery tile is randomly the real hidden meaning or hidden trap.

### MASTERED Celebration

1. Boss mystery tile judged correctly.
2. Hero word crashes down to center with impact.
3. Diagonal MASTER stamp slams over word.
4. Word cracks open.
5. Word Core jumps out of cracked word.
6. Core grows, glows, and spins center-screen.
7. Core shoots toward Vault nav icon.
8. Boss mastery ends with opponent Polly reaction, not Polly celebration.
9. Boss mastery may additionally trigger the rare game/system `BINGO BANGO ZZZZINGO!` stinger after vaulting.

### Word Core

- Word Core is the mastery trophy. It does not go into the Master Gate. It belongs in the player's Vault page.
- The Master Gate is Polly's cage, not storage.

### Ghost Loss

- Boss-only. Triggered by wrong judgment on the boss mystery tile.
- Wrong swiped tile exits permanently. No two hidden tiles merge. No hidden split tile sequence.
- HAUNTED overlay appears after the boss failure beat.
- Ghost Tile forms: "MASTER THE WORD" / "From [WORD]". Microcopy: "You left me behind."

### Ghost Return / Haunt Words

- Ghosted words return late in future Hunts.
- Haunt slot is position 10 / index 9. Never replace Boss Word at position 12.
- Ghost `wordId` is always the word string, never `stepIndex`.
- Returning ghost word entrance copy: "Guess who's back."
- If mastered: HAUNT BROKEN. If failed again: STILL HAUNTED.
- Returning Haunt failure Polly taunt: "BBBLAAAAHHAHAHA!"

### Life System

- Hearts are replaced by Feathers. Player normally has 5 feathers.
- Wrong swipe plucks 1 feather. 0 feathers ends run.
- Score milestones exist at 8,000 and 16,000 points; crossing one can restore 1 feather.
- If feathers are full, player can hold 1 reserve feather max, so lives can reach 6.

Current implementation:
- HUD renders five custom feather slots in `GameScreen.tsx`.
- Reserve feather is rendered separately in the HUD.
- `+1 FEATHER` milestone feedback exists.
- Internal engine/store state is still named `lives`; do not rename it until a dedicated state migration.

### Feather Visual Spec

- Full feather: white fill, purple outer glow 0 0 8px rgba(123,45,139,0.5), subtle purple quill line
- Lost feather: rgba(123,45,139,0.25) — dim ghost, stays in slot
- Reserve feather: smaller (12px), gold "+" mark above, max 1
- Wrong swipe pluck sequence:
  ```
  T+0ms    Red flash on tile
  T+80ms   Rightmost feather SHAKES ±8deg
  T+200ms  Feather launches upward translateY -40px
  T+280ms  Feather dissolves into 6 purple dust particles
  T+580ms  Dim purple silhouette remains in slot
  ```
- Earned feather: spins in from above, lands with 50ms gold flash, "+1 FEATHER" floats up in gold, selectionAsync() haptic
- Zero feathers: "POLLY CLIPPED YOUR RUN." replaces GAME OVER

### Score Purpose

- Score is competition, not decoration. Score supports: beat your personal best, beat Polly's target score, earn Hunt rank, future daily/friend/global rankings.
- Score does not replace mastery. Word Cores are permanent mastery trophies.

### Play Screen Color Rules

- Background: `#1A1830`
- Gold: `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core
- Purple: `#7B2D8B` for UI/gate/shards
- Rose: `#9B2D6B` for trap/ghost shard accents
- Polly Green: `#4CAF50` only Polly character
- Deep Dark: `#0F0D2A` only Master Gate locked surface
- Wrong Flash: `#CC2200` only wrong swipe flash
- White: `#FFFFFF` readable text
- No pink/magenta. No orange in UI. No green in UI. No red except wrong flash.
- Gold max 2 visible elements at once.

---

*POLYWORDS CLAUDE.md · Pete DiBari · June 20, 2026*
