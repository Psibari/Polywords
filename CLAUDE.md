# POLYWORDS â€” CLAUDE.md
### Ground Truth for Claude Code Â· Updated June 8, 2026

---

## The Game in One Sentence

Polly is the Master of Words. She holds every word in her vault. The player challenges her â€” one word at a time â€” to take the title.

## The North Star

> *"The word is the puzzle. The masks are Polly's traps. The reveal is what she's been hiding. The near miss is her winning. The vault is yours to fill. And Polly has been Master of Words long enough."*

---

## Polly â€” Master of Words

**Who she is:** Polly is the REIGNING MASTER OF WORDS. Not a mascot. The antagonist. The title holder. She holds every word in her vault. She set every trap. She knows every meaning. The player's goal is to take her title one word at a time.

**The traps:** Every trap tile is POLLY'S MOVE. She planted them deliberately to protect her words. Catching a trap = beating one of Polly's defenses.

**The boss word:** Polly's signature word per session. Her most confident defense. She throws it down herself at position 12.

**The vault transfer:** When a word is mastered, it leaves Polly's vault and enters the player's. That word is gone from Polly's possession permanently.

**The slogan:** "WORDS HAVE MEANING.....sssss" â€” Polly's dare. Not a statement of fact. A challenge.

**Endgame:** The database is a living system â€” it grows over time. New words enter Polly's vault. The title of Master of Words is never permanent. The challenge never ends.

---

## Tech Stack

```
Runtime:        Expo SDK (managed workflow)
Language:       TypeScript (strict)
Framework:      React Native
State:          Zustand + immer middleware
Animation:      React Native Animated API (primary)
Exception:      Reanimated â€” SwipeMask.tsx ONLY â€” frozen, no new usage ever
Haptics:        Expo Haptics
Audio:          Expo AV â†’ migrating to expo-audio
Navigation:     Expo Router
Fonts:          Gomarice Okuba (hero word + all UI) Â· Inter Medium (tile text) Â· Poppins Bold (HUD score/combo) Â· SuperCartoon (Polly big reactions)
Testing:        Expo Go via QR code on physical device
Version control: Git + GitHub
Editor:         VS Code (Windows â€” use forward-slash paths)
```

### Animation Rules â€” Non-Negotiable
```
useNativeDriver: true  â†’ transform, opacity ONLY
useNativeDriver: false â†’ height, margin, backgroundColor ONLY
NEVER mix on same Animated.Value
Use setTimeout between phases â€” NEVER .start() callbacks
Reanimated locked to SwipeMask.tsx ONLY â€” never import elsewhere
```

---

## Palette â€” Strict

| Token | Hex | Use |
|---|---|---|
| Background | `#1A1830` | Every screen background. Always. |
| Gold | `#F5C842` | Score, boss word, reward, gate unlock â€” MAX 2 gold elements simultaneously |
| Purple | `#7B2D8B` | Trap shatter, rare events, ghost tile border, Polly accent |
| Rose | `#9B2D6B` | Crystal shard gradient partner with purple |
| Polly Green | `#4CAF50` | Polly mascot ONLY â€” never as UI chrome |
| Deep Dark | `#0F0D2A` | Master Gate locked background â€” darkest surface |
| Wrong Flash | `#CC2200` | Wrong-swipe flash ONLY â€” never decoration, never text |
| White | `#FFFFFF` | All UI text on dark surfaces |

ðŸ”’ Red is wrong-swipe flash only. Never text. Never decoration.
ðŸ”’ Polly Green reserved for Polly exclusively.
ðŸ”’ Max 2 gold elements on screen simultaneously.

---

## Typography

| Element | Font | Size |
|---|---|---|
| Hero word â€” normal | Gomarice Okuba | 108px |
| Hero word â€” Boss | Gomarice Okuba | 118px, gold |
| All UI labels, gate text, HUD labels | Gomarice Okuba | varies |
| Tile mask text | Inter Medium | 22px |
| HUD score | Poppins Bold | 18px |
| Combo multiplier | Poppins Bold | 26px â€” GOLD #F5C842 only |
| Grade text (RATTLED etc) | Gomarice Okuba | 48px â€” WHITE only |
| MASTERED label | Gomarice Okuba | 13px, letter-spacing 6px, gold |
| Polly big reaction lines | SuperCartoon | varies |

---

## Session Model â€” THE HUNT

### The Fundamental Architecture

Every POLY RUN is a HUNT. Always 12 words. Always a designed difficulty arc. Always a boss at position 12. The player hunts through 11 words to confront the boss word that Polly holds.

**Lives are session lives â€” 5 lives for the entire 12-word hunt.**

| Position | Phase | Difficulty | Emotional Target |
|---|---|---|---|
| 1â€“2 | Confidence Zone | Easy | Player feels capable immediately |
| 3â€“5 | Rhythm Zone | Medium | Flow state, combo building |
| 6â€“8 | Tension Zone | Medium-Hard | First traps sting, stakes rising |
| 9â€“11 | Panic Zone | Hard | Wrong swipes cost, near-misses |
| 12 | Boss â€” THE CONFRONTATION | Maximum | Climax. Polly's word. |

ðŸ”’ Boss word is ALWAYS position 12. Non-negotiable.

### Living Pool Model

The 700+ word database is divided into:

**Unmastered Pool:** All words not yet mastered. Every standard POLY RUN draws from here. Difficulty arc determines placement.

**Ghost Queue:** Words where player missed hidden meaning. Priority placement in next session's difficulty tier.

**Mastered (Graduated):** Perfect cleared including hidden meaning. PERMANENTLY LEAVES the Unmastered Pool. Goes to THE VAULT. Never appears in standard POLY RUN again.

**RUN IT BACK:** Always a fresh 12-word draw with ghost priority. Never replays same session. Never resumes from death. Always fresh with ghost words prioritized.

**Daily Challenge:** The ONE curated fixed session. Same 12 words for every player every day. Exception, not the rule.

### Test Session (Current â€” 12 words)

| # | Word | Type | Emotional Beat |
|---|---|---|---|
| 1 | LIGHT | Standard | Confidence |
| 2 | BARK | Standard | Flow |
| 3 | RING | Standard | First tension |
| 4 | MATCH | Standard | Escalation |
| 5 | RAW | Standard | Freshness |
| 6 | BEAR | Standard | Hesitation |
| 7 | WAKE | Standard | Tension |
| 8 | PITCH | Standard | Near miss |
| 9 | PRESS | Standard | Panic |
| 10 | BANK | Standard | Rebound |
| 11 | SPRING | Boss | First climax |
| 12 | ORDER | Boss | Final boss |

---

## Swipe Grammar â€” Sacred

| Gesture | Meaning | Result |
|---|---|---|
| Swipe UP | This IS a real meaning | Correct: magnetic absorb into word |
| Swipe RIGHT | This is a TRAP | Correct: purple/rose crystal shard burst |
| Wrong UP (trap swiped up) | Claimed a trap | Life lost, tile flies off top, red flash |
| Wrong RIGHT (real swiped right) | Rejected a real meaning | Life lost, tile rubber-bands back, red flash |

ðŸ”’ UP = real. RIGHT = trap. Sacred. Permanent. Never change.
ðŸ”’ No left swipe. No tap. No tap-and-submit. Swipe only.

### Wrong Swipe Behaviors â€” Locked

**Wrong UP (trap claimed as real):**
Tile flies toward word â†’ word SHAKES and REJECTS it â†’ tile buzzes red â†’ disappears downward.

**Wrong RIGHT (real meaning rejected):**
Tile starts flying right â†’ gets less than halfway â†’ RUBBER-BANDS back â†’ buzzes red â†’ dissolves.

---

## One-at-a-Time Tile Queue System

**LOCKED DESIGN - Patch 3 complete.**

### Fundamentals
One tile enters at a time. Player makes one binary decision. Next tile arrives after resolution. Feels like a fight, not a quiz.

### Current Implementation Notes
- Patch 3 complete: `MaskBoard.tsx` renders only one active visible mask tile at a time.
- The active visible queue uses the existing shuffled mask order from `store.game.shuffledMasks`.
- Hidden split tiles are excluded from the visible queue and keep their existing flow.
- The active visible tile advances after the current tile resolves as correct, trap-caught, or wrong.
- A guarded 650ms delay prevents duplicate advances from repeated renders and lets Patch 5 motion finish cleanly.
- Existing scoring is preserved.
- Existing swipe grammar is preserved.
- Current Master Gate logic is preserved.
- Ghost tile behavior is preserved.
- Patch 4 complete: active mask tile presentation and press-hold polish are implemented.
- Patch 5 complete: UP absorb and RIGHT toss/shatter are tuned for the single-tile arena.
- Final Haunt placement remains pending.

### Queue Build Rules
1. Ghost tile always first (if exists) - enters from LEFT
2. Remaining tiles shuffled randomly
3. Final 2 tiles tagged nearMastery
4. Queue locked on word load

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
## Master the Word â€” Full Sequence (6 Acts)

### ACT 1 â€” LOCKED STATE
- Background: #0F0D2A Â· Border: 1.5px gold 22% Â· Lock breathing pulse Â· Height: 72px
- Zero player interaction ever

### ACT 2 â€” THE BREAK (Perfect Clear â€” Auto)
wrongSwipeOccurred.current must be false. Player NEVER swipes gate.
```
T+0ms    Last tile absorbed
T+0ms    Gold light clockwise around border, 600ms
T+100ms  Lock shackle cracks
T+300ms  Border â†’ 100% opacity
T+400ms  ONE heavy haptic
T+500ms  Sound: ascending chime + bass
T+600ms  Gate bg â†’ #150C00
T+700ms  Polly (first-time): "Only with a perfect sweep"
```

### ACT 3 â€” THE RELEASE
T+900ms: First split tile drops Â· T+1050ms: Second split tile (150ms stagger)
- Real hidden meaning tile: gold border 100%, text warm rgba(255,248,230,1)
- Hidden trap tile: gold border 80%, text pure white

### ACT 4 â€” THE JUDGMENT
- Correct UP: magnetic absorb, word FLARES gold, Polly hiddenReveal
- Correct RIGHT: 18 shards, faster, double bloom
- Wrong swipe: life lost, ghost created, advances 1500ms

### ACT 5 â€” MASTERY SEQUENCE (Sequential â€” Never Simultaneous)
```
T+0ms    Both correct. Silence.
T+200ms  Screen dims 15% â€” word zone full brightness
T+500ms  Word PULSES 1.0â†’1.06â†’1.0
T+800ms  "MASTERED" appears BELOW word â€” 13px, gold, letter-spacing 6px
T+1050ms Word begins to SWELL
T+1300ms Word at 1.6Ã— width. 16 CRYSTAL SHARDS BURST radially.
         Purple #7B2D8B + rose #9B2D6B. Gravity-affected.
T+1300ms Polly: "BINGO BANGO ZZZINGOO". notificationAsync(Success).
T+1900ms GOLD SEED at word center. 12px, inner glow, single pulse.
T+2100ms Seed DROPS with 60px gold trail.
T+2400ms Seed hits bottom. selectionAsync(). Bloom. Naturalistic tone.
T+2700ms Silence. Hold.
T+3000ms Word compresses â†’ gold tile â†’ launches to VAULT nav icon.
T+3900ms Vault icon blooms. impactAsync(Heavy). THUNK sound.
T+4100ms Next word loads.
```

ðŸ”’ MASTERED text BELOW the word â€” never screen center.
ðŸ”’ Word zoom and MASTERED text SEQUENTIAL â€” MASTERED first, then word swells.
ðŸ”’ Crystal shards are POLYGON geometry â€” never rectangles or squares.

### ACT 6 â€” THE GHOST
- Background: rgba(123,45,139,0.06) Â· Border: SOLID 1.5px rgba(123,45,139,0.55)
- NO DASHES, NO PINK, NO MAGENTA
- Purple dot top-right: 6px slow pulse
- Text: "MASTER THE WORD" â€” white 70% Â· Subtitle: "From [WORD]" â€” dim purple
- The phrase is NEVER revealed.

---

## The Polly Hunt System â€” 6 Acts

Hunt-level appearances fire in word TRANSITIONS (400-600ms). Max 4 per session. Never interrupt play.

### All Locked Lines

| Trigger | Line |
|---|---|
| Before word 1 | "I've got a word you need to earn." |
| Word 3â†’4, doing well | "You're moving. I've seen better." |
| Word 3â†’4, struggling | "You'll need more than that." |
| Word 6â†’7, doing well | "Getting warmer. Keep going." |
| Word 6â†’7, struggling | "Want this word? Show me something." |
| Word 9â†’10 | "Not yet." |
| Word 11â†’12 | "Last one. Then it's just you and me." |
| Boss mastered | "BINGO BANGO ZZZINGOO" |
| Boss failed | "Thought so." |

### In-Round Lines (max 2 per round)

| Trigger | Line |
|---|---|
| First correct swipe (rare) | "Word up." |
| Mastery / hidden / Ã—10 | "BINGO BANGO ZZZINGOO" |
| Wrong swipe | "Nope." / "Hard no." |
| 3+ wrong same word | "BLAHH HA HA HA" |
| Perfect clear | "Clean sweep." |
| Ghost tile appears | Silent â€” sway loop |
| 1 heart left | "Oh. NOOOooo" |
| Boss word entry | "Did you justâ€”" |
| Game over | "AARRRGGHH" |
| Hesitation 3s | "You sure about that." |
| Hesitation 6s | "Really. That one." |
| Hesitation 9s | "Hard no." |
| Results / ghost set | "That one's waiting for you." |
| Hidden meaning found | "Deep cut. Most miss that one." |
| Ghost birth | "Not yours yet." |

ðŸ”’ "Thought so." â€” never change it.
ðŸ”’ "BINGO BANGO ZZZINGOO" â€” never change it.
ðŸ”’ Max 2 Polly in-round appearances per word. Hunt-level = separate system.
ðŸ”’ Boss word drops FROM Polly's direction â€” she throws it.

---

## The Vault â€” Replaces Garden Permanently

Mastered words are TROPHIES taken from Polly. They live here permanently.

### Vault Design
- Background: #0F0D2A â€” dark, heavy, earned
- 2-column grid, most recent top-left
- Standard tile: gradient bg, 1.5px gold border 55%, word Bagel Fat One 28px gold, hidden meaning below (ONLY place in game), date mastered
- Boss tile: full gold border 100%, outer glow, purple inner accent, breathing border pulse

### Empty State
"Polly has them all." / "Go take one."

### Arrival Animation
Word compresses â†’ gold tile â†’ launches to vault nav icon â†’ vault icon blooms â†’ impactAsync(Heavy) â†’ THUNK sound

### Paywall (Word 21)
No Polly. Frosted overlay on word 21.
"VAULT FULL" / "Unlock unlimited to keep going." / CTA: "UNLOCK UNLIMITED"

### Navigation
Tab: "VAULT" Â· Icon: heavy vault door, partially open, gold light spilling

---

## Ghost System

**Creates a ghost:** Wrong swipe on split tile OR lives run out before gate opens.

**Ghost tile styling â€” LOCKED:**
- Background: rgba(123,45,139,0.06)
- Border: SOLID 1.5px rgba(123,45,139,0.55) â€” NO DASHES, NO PINK, NO MAGENTA
- Purple dot top-right: 6px, slow pulse
- Text: "MASTER THE WORD" â€” white 70%
- Subtitle: "From [WORD]" â€” dim purple
- Phrase NEVER revealed

**Ghost wordId:** Always use WORD STRING (e.g. "BARK") â€” not stepIndex.

**Current implementation note:**
- Ghosts created during the current run are stored but do not appear until a new run starts.
- `useGameStore.runStartGhostWordIds` snapshots which ghosts existed at run start.
- `GhostTile` is currently disabled from the Master Gate slot so it cannot block normal gate unlock/release flow.
- Proper returning Haunt placement remains pending.

### Ghost Loss Sequence â€” 7 Acts (Locked)

Triggered when player wrong-swipes a hidden split tile.
NOTE: Hidden split tile wrong exit OVERRIDES standard wrong swipe physics. Tile does NOT complete normal exit.

```
T+0ms    Wrong hidden swipe released
T+120ms  Wrong tile GLITCHES â€” edges blur, text flickers,
         one red flash. Does NOT complete normal exit.
T+160ms  Remaining hidden tile FREEZES â€” border dims,
         text fades ghostly white, purple mist leaks
T+260ms  Failed tile PULLED BACK â€” curves from swipe path,
         shrinks, semi-transparent, purple trail
T+520ms  TILE MERGE â€” soft purple pulse, glassy crack ring,
         medium haptic, reverse-chime sound. Both texts blur.
         Tiles overlap and compress. Purple vapor curls inward.
T+520ms  HERO WORD LOSES LIFE ESSENCE â€” letters desaturate,
         glow dims, outline thins, wisps drain downward.
         Faint ghost of word peels backward into forming tile.
T+760ms  GHOST TILE REFORMS: "MASTER THE WORD / From [WORD]"
         dark purple glass, solid purple border, mist inside
T+920ms  "THE HAUNT BEGINS" â€” small text overlay, one beat
T+1300ms Ghost tile compresses â†’ fades to purple mist
T+1500ms Polly: "Not yours yet."
T+1900ms Exit to next word
```

---

## Visual Effects

### Magnetic Absorb (Correct UP)
```
k = 44 + 390 * elapsed
Damping: Math.pow(0.84, dt * 60)
Word ceiling: tile cannot overshoot above word
Gold fill: pale honey â†’ rich gold, glow 8pxâ†’32px
```

### Crystal Shard Burst (Correct RIGHT)
ðŸ”’ POLYGON shards â€” NOT rectangles, NOT squares
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
T+1000ms "BOSS WORD Â· 2Ã— SCORE" badge
T+1100ms Gold underline traces leftâ†’right
T+1400ms Tiles stagger in at 120ms intervals
```

---

## Haptic Map

| Event | Pattern |
|---|---|
| Tile press-and-hold | impactAsync(Light) â†’ 40ms â†’ impactAsync(Medium) â†’ 45ms â†’ impactAsync(Medium) |
| Correct swipe | impactAsync(Medium) â†’ 80ms â†’ impactAsync(Light) |
| Trap caught (RIGHT) | impactAsync(Heavy) â†’ 60ms â†’ notificationAsync(Success) |
| Wrong swipe | notificationAsync(Error) â€” single, no echo |
| Gate unlock | impactAsync(Heavy) Ã— 1 |
| Boss word entrance | impactAsync(Heavy) Ã— 3 at 0/180/360ms |
| Hidden meaning reveal | notificationAsync(Success) â†’ 120ms â†’ impactAsync(Medium) |
| Mastery celebration | notificationAsync(Success) |
| Seed landing | selectionAsync() |
| Vault arrival | impactAsync(Heavy) |

---

## Scoring

| Action | Reward |
|---|---|
| Correct real meaning | Base + combo multiplier |
| Trap caught correctly | Trap bonus |
| Perfect clear | Large bonus + Polly |
| Hidden meaning found | Large bonus + hiddenReveal |
| Boss clear | 2Ã— all scoring |
| Wrong swipe | Life lost, combo resets |
| Previously mastered word (future run) | 2Ã— all swipes |

**Combo counter: GOLD #F5C842 with glow â€” NEVER orange, never red.**

### Polly Target Score System

- Polly's target: 15,000 pts (fixed MVP, scales Phase 2)
- Rank scale: D (below 8k) Â· C (8k) Â· B (11k) Â· A (14k) Â· S (18k) Â· MASTER (22k+)
- "BEAT POLLY" is separate from rank â€” coexists independently
- "YOU BEAT POLLY" shown on results when score â‰¥ 15,000
- "POLLY HUNT COMPLETE" is the results screen session header
- Suppress mid-run "POLLY BEATEN" flash â€” reveal on results only
- Pre-hunt display shows 2 numbers only: Polly's Score + Your Best
- Life Feather milestones: 8,000 pts and 16,000 pts restore 1 feather
- Score â‰  Mastery â€” explicitly separate systems

---

## Pending Fixes

### Completed and Committed

- Locked gameplay screen design has been added to `CLAUDE.md` and `CONTEXT.md`.
- Patch 1 complete: gameplay HUD hearts replaced with custom feather lives in `app/screens/GameScreen.tsx`.
- Patch 2 complete: gameplay layout hierarchy strengthened in `app/components/MaskBoard.tsx`.
  - Hero word zone increased from 80 to 142.
  - Boss word zone increased to 156.
  - Hero word size increased to 88.
  - Boss word size increased to 96.
  - Hero word shadow radius increased from 10 to 16.
  - Hero word overlays now use single-line font fitting.
  - `wordScreenY` now targets the actual word-zone center instead of a hardcoded +40.
  - A 34px swipe/breathing lane was added below the hero word.
  - Board layout was split into stacked tile band and low gate band.
  - Current stacked mask area is 86% width and left-biased to leave more right-side toss/shatter space.
  - Gate area stays low with added top spacing and bottom reserve.
- Ghost tile styling patch complete: no dashed ghost styling; ghost styling uses solid purple border and locked dark/purple treatment.
- MasterGateTile forbidden colors patch complete: removed Polly Green `#4CAF50` and Polly Orange `#FF8C00` from gate border animation; gate color sweep now uses gold opacity values only.
- `wrongSwipeOccurred.current` reset verified as already correct: it resets on new word, and the stale debug `console.log` was removed.
- Mastery word swell scale patch complete: target changed from 2.8 to 1.6.
- Patch 3 complete: one active visible mask tile queue implemented in `app/components/MaskBoard.tsx`.
  - Renders only one active visible mask tile at a time.
  - Keeps existing shuffled mask order from `store.game.shuffledMasks`.
  - Advances after the current visible tile resolves.
  - Uses a guarded advance delay.
  - Preserves scoring, swipe grammar, `SwipeMask.tsx`, Master Gate logic, hidden tile flow, and Ghost tile behavior.
- Patch 4 complete: active mask tile presentation and press-hold polish implemented in `app/components/MaskBoard.tsx` and `app/components/SwipeMask.tsx`.
- Patch 5 complete: UP absorb and RIGHT toss/shatter tuned for the single-tile arena.
  - Correct UP real meanings now pull harder into the hero word, shrink/fade near impact, and trigger the existing word absorb pulse.
  - Correct RIGHT traps now fling farther into the right-side shatter lane with stronger rotation, shrink, fade, and larger purple/rose shard burst.
  - Shard burst count is now 18.
  - Shard colors remain only `#7B2D8B` and `#9B2D6B`.
  - Wrong RIGHT on a real meaning now visibly fails with `#CC2200` wrong flash, reject wobble, bounce-back, and fade/collapse.
  - Existing wrong-swipe logic still handles feather loss.
  - Active visible tile advance delay changed from 450ms to 650ms.
  - Scoring unchanged.
  - Swipe grammar unchanged.
  - One-active-visible-tile queue unchanged.
  - Master Gate, hidden tile flow, ghost logic, Polly logic, and store architecture unchanged.
  - TypeScript passed with `npx.cmd tsc --noEmit`.

### Remaining Pending Work

Current next patch: **Patch 6 - Master Gate cage/vault visual overhaul.**

1. Patch 6: Master Gate cage/vault visual overhaul:
   - Master Gate text remains MASTER THE WORD.
   - Gate belongs to Polly, not the player.
   - Low on board above nav safe area.
   - Bird cage / vault hybrid.
   - Locked surface uses `#0F0D2A`.
   - Faint cage bars.
   - Small lock.
   - Subtle tension.
   - Quiet gold charge only when earned.
   - No player Vault storage on game board.
   - Do not change Master Gate unlock logic yet unless visual-only wiring requires it.
   - Do not change scoring, swipe grammar, hidden tile flow, ghost logic, or store architecture.
2. Hidden tiles flying up into active tile position.
3. MASTERED celebration rewrite:
   - Hero word crashes center.
   - Diagonal MASTER stamp.
   - Word cracks open.
   - Word Core jumps out.
   - Core grows/glows/spins center-screen.
   - Core shoots toward Vault nav icon.
   - Polly line: "BINGO BANGO ZZZZINGO!"
4. Ghost merge loss sequence:
   - Wrong hidden tile merges with remaining hidden tile.
   - Hero word flickers dull and loses life essence.
   - Ghost Tile forms: MASTER THE WORD / From [WORD].
   - Microcopy: THE HAUNT BEGINS.
5. Haunt Word return system:
   - Ghosted words return late in future Hunts.
   - Preferred placement: word 10 or 11.
   - Never replace Boss Word at position 12.
   - Entrance copy: REMEMBER ME?
   - Cleared copy: HAUNT BROKEN.
   - Failed again copy: STILL HAUNTED.
   - Polly taunt: "BBBLAAAAHHAHAHA!"
6. Polly pop-in budget:
   - Polly is not permanent during gameplay.
   - 1 pop-in per word round.
   - 2 max for major moments.
   - Always appears at end of round win/loss.
7. Score target/rank system:
   - Score should support personal best, Polly target score, Hunt rank, and future daily/friend/global rankings.
8. Life Feather milestone/reserve system:
   - UI feathers exist.
   - Score milestone restore and 1 reserve feather are not implemented yet.
9. Vault / Ranks / Profile pages.
10. `expo-av` to `expo-audio` migration.

---
## Cut List â˜ ï¸ â€” Permanent

- â˜ ï¸ Garden â€” replaced by Vault permanently
- â˜ ï¸ Simultaneous tile render â€” replaced by one-at-a-time queue
- â˜ ï¸ Switchback rounds in main session
- â˜ ï¸ Phrase Break rounds in main session
- â˜ ï¸ SlangDropScreen as separate component
- â˜ ï¸ Left swipe
- â˜ ï¸ Circular Polly crop
- â˜ ï¸ Dashed borders on any tile
- â˜ ï¸ Pink or magenta colors
- â˜ ï¸ Red for text or decoration
- â˜ ï¸ Polly Green for UI elements
- â˜ ï¸ More than 2 gold elements simultaneously
- â˜ ï¸ RATTLED. in any color except white
- â˜ ï¸ Reanimated outside SwipeMask.tsx
- â˜ ï¸ Rectangle/square particles
- â˜ ï¸ Simultaneous MASTER text + word zoom
- â˜ ï¸ Visual tells on tiles before swipe
- â˜ ï¸ phraseBreakPool, slangPool, switchbackPool
- â˜ ï¸ expo-av (migrating)
- â˜ ï¸ "reverseMountOrder" bossModifier

---

## Locked Decisions â€” Non-Negotiable

- Session: always 12 words, always boss at position 12
- Swipe UP = real. Swipe RIGHT = trap. Always.
- Living Pool: mastered words graduate permanently
- RUN IT BACK = fresh draw, ghost priority
- Boss position 12 = confrontation endpoint
- Polly throws boss word at position 12
- Gate auto-opens on perfect clear â€” never swipe to open
- wrongSwipeOccurred.current resets at start of every new word
- Crystal shards: polygon, purple/rose, radial burst â€” never rectangles
- MASTERED text below word, not screen center
- Ghost tile never reveals missed phrase
- "Thought so." â€” never change
- "BINGO BANGO ZZZINGOO" â€” never change
- Database grows over time â€” no finish line, no endgame
- All tiles identical until swiped â€” Polly gives nothing away
- Vault replaces Garden â€” permanent
- "POLLY CLIPPED YOUR RUN." replaces GAME OVER at zero feathers
- "POLLY HUNT COMPLETE" is the results screen session header
- "YOU BEAT POLLY" fires on results when score â‰¥ 15,000
- Polly's target score: 15,000 pts (MVP fixed)
- Rank scale: D / C / B / A / S / MASTER
- Life Feather milestones: 8,000 and 16,000 pts
- Ghost Loss Sequence: hidden split tile wrong swipe overrides standard exit â€” tile intercepted at T+120ms into merge sequence
- "THE HAUNT BEGINS" â€” micro-copy on ghost birth
- "Not yours yet." â€” Polly line on ghost exit

---

## Claude Code Conventions

- Always `tsc --noEmit` after every change â€” must exit 0
- One prompt, one concern â€” surgical only
- Confirm exact file paths before editing
- Read the relevant file fully before touching it
- useNativeDriver: false â†’ height/margin/backgroundColor only
- useNativeDriver: true â†’ transform/opacity only
- Never chain both drivers on same Animated.Value
- setTimeout between phases â€” never .start() callbacks
- Never add tap handlers to tiles â€” swipe only
- Forward-slash paths on Windows

---

## File Map (Key Files)

```
app/components/MaskBoard.tsx         Main game board
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

## Locked Play Screen Design

**Official source of truth for future implementation.**

### Core Identity

POLYWORDS is a word arena, not a quiz list. The hero word is the boss. The active mask tile is the challenger. The Master Gate is Polly's locked cage/vault. The player steals mastery one swipe at a time.

### Main Hierarchy

1. HERO WORD
2. ACTIVE MASK TILE
3. MASTER GATE
4. HUD / SCORE / FEATHERS / STREAK
5. POLLY POP-IN ONLY

### Polly Presence

- Polly is not a permanent gameplay presence.
- Polly appears only at high-emotion moments.
- 1 pop-in per word round.
- 2 max if the round has a major event.
- Polly always appears at end of round win/loss.
- Polly pops from bottom-left and never blocks the active tile, right shatter lane, or Master Gate.
- Mastery line: "BINGO BANGO ZZZINGOO"
- Normal ghost failure line: "Not yours yet."
- Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!"

### Screen Layout

- Top: quiet HUD with score, feathers, streak.
- Upper center: giant hero word, dominant, top-center, absorb target.
- Middle: empty swipe lane for UP motion.
- Lower-middle: one active mask tile only.
- Right side: clear toss/shatter lane.
- Low board: MASTER THE WORD gate, Polly's cage/vault hybrid.
- Bottom: nav bar room for Home / Ranks / Vault / Profile.

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
- Press-hold interaction:
  - tile wakes up
  - tiny haptic
  - tile lifts slightly
  - tile follows player finger
  - release commits decision

### Swipe Motion

- UP = claim real meaning.
- RIGHT = reject trap.
- No left swipe.
- No tap-submit.
- Correct UP feeds real meaning into hero word.
- Tile travels upward into word.
- Word absorbs tile and pulses.
- Wrong UP on trap causes rejection, wrong flash, feather loss.
- Correct RIGHT tosses false meaning out.
- Tile flings right with "get outta here" feel.
- Trap shatters like glass because false meaning has no substance.
- Shards use purple/rose crystal language.
- Wrong RIGHT on real meaning fails, wrong flash, feather loss.

### Master Gate

- Text: MASTER THE WORD.
- Gate belongs to Polly, not the player.
- Low on board, above nav bar safe area.
- Bird cage / vault hybrid.
- Subtle tension, never overbearing.
- Surface uses `#0F0D2A`.
- Faint cage bars.
- Small lock.
- Quiet gold charge only when earned.
- The player's Vault is not on the game board. It is a nav/page destination.

### Master Gate Unlock

1. Last real visible tile absorbs into hero word.
2. Gate border charges gold.
3. Cage bars split slightly left/right.
4. Lock snaps open.
5. Two hidden tiles fly up into active tile position.

### MASTERED Celebration

1. Hidden tiles judged correctly.
2. Hero word crashes down to center with impact.
3. Diagonal MASTER stamp slams over word.
4. Word cracks open.
5. Word Core jumps out of cracked word.
6. Core grows, glows, and spins center-screen.
7. Core shoots toward Vault nav icon.
8. Polly pops in: "BINGO BANGO ZZZINGOO"

### Word Core

- Word Core is the mastery trophy.
- It does not go into the Master Gate.
- It belongs in the player's Vault page.
- The Master Gate is Polly's cage, not storage.

### Ghost Loss

- Triggered by wrong hidden/master swipe.
- Wrong swiped hidden tile begins leaving.
- Remaining hidden tile stays on board.
- Failed tile glitches and loses substance.
- Failed tile is pulled back.
- Both hidden tiles merge.
- Hero word flickers dull and loses life essence.
- Ghostly presence fades into merged tile.
- Ghost Tile forms:
  - MASTER THE WORD
  - From [WORD]
- Microcopy: THE HAUNT BEGINS

### Ghost Return / Haunt Words

- Ghosted words return late in future Hunts.
- Best placement: word 10 or 11.
- Never replace Boss Word at position 12.
- Returning ghost word entrance copy: REMEMBER ME?
- If mastered: HAUNT BROKEN
- If failed again: STILL HAUNTED
- Returning Haunt failure Polly taunt: "BBBLAAAAHHAHAHA!"

### Life System

- Hearts are replaced by Feathers.
- Player starts with 5 feathers.
- Wrong swipe plucks 1 feather.
- 0 feathers ends run.
- Score milestones can restore a Life Feather.
- If feathers are full, player can hold 1 reserve feather max.

Current implementation:
- HUD renders five custom feather slots in `GameScreen.tsx`.
- Internal engine/store state is still named `lives`; do not rename it until a dedicated state migration.
- Reserve feathers and score milestone restore are not implemented yet.

### Feather Visual Spec

- Full feather: white fill, purple outer glow 0 0 8px rgba(123,45,139,0.5), subtle purple quill line
- Lost feather: rgba(123,45,139,0.25) â€” dim ghost, stays in slot
- Reserve feather: smaller (12px), gold "+" mark above, max 1
- Wrong swipe pluck sequence:
  T+0ms    Red flash on tile
  T+80ms   Rightmost feather SHAKES Â±8deg
  T+200ms  Feather launches upward translateY -40px
  T+280ms  Feather dissolves into 6 purple dust particles
  T+580ms  Dim purple silhouette remains in slot
- Earned feather: spins in from above, lands with 50ms gold flash, "+1 FEATHER" floats up in gold, selectionAsync() haptic
- Zero feathers: "POLLY CLIPPED YOUR RUN." replaces GAME OVER

### Score Purpose

- Score is competition, not decoration.
- Score supports:
  - beat your personal best
  - beat Polly's target score
  - earn Hunt rank
  - future daily/friend/global rankings
- Score does not replace mastery.
- Word Cores are permanent mastery trophies.

### Play Screen Color Rules

- Background: `#1A1830`
- Gold: `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core
- Purple: `#7B2D8B` for UI/gate/shards
- Rose: `#9B2D6B` for trap/ghost shard accents
- Polly Green: `#4CAF50` only Polly character
- Deep Dark: `#0F0D2A` only Master Gate locked surface
- Wrong Flash: `#CC2200` only wrong swipe flash
- White: `#FFFFFF` readable text
- No pink/magenta.
- No orange in UI.
- No green in UI.
- No red except wrong flash.
- Gold max 2 visible elements at once.

### Implementation Order

1. Main gameplay layout
2. Hero word dominance
3. One active tile queue (Patch 3 complete)
4. Press-hold tile behavior (Patch 4 complete)
5. UP absorb and RIGHT toss/shatter (Patch 5 complete)
6. Master Gate visual overhaul (Patch 6 next)
7. Hidden tile unlock
8. MASTERED celebration
9. Ghost merge loss
10. Feathers and score targets
11. Haunt Word return system
12. Vault / Ranks / Profile pages

---

*POLYWORDS CLAUDE.md Â· Pete DiBari Â· June 8, 2026*

