# POLYWORDS â€” CLAUDE.md
### Ground Truth for Claude Code · Updated June 12, 2026

---

## The Game in One Sentence

Polly is the Master of Words. She holds every word in her vault. The player challenges her â€” one word at a time â€” to take the title.

## The North Star

> *"The word is the puzzle. The masks are Polly's traps. The reveal is what she's been hiding. The near miss is her winning. The vault is yours to fill. And Polly has been Master of Words long enough."*

## App Shell Identity

Home is the arcade lobby / launchpad. Play is the arena. Word Vault is the player's reclaimed meaning archive. Settings is utility for player/account/preferences/about. Profile belongs inside Settings for MVP and should not be a main nav tab. Bottom nav tabs are Home / Play / Vault / Settings, visible outside active gameplay only.

Patch 12C rebuilt `app/screens/HomeScreen.tsx` as a polished lobby shell with PLAY, Daily Challenge placeholder, Word Vault preview, Continue Run placeholder, and footer flavor. It preserves the existing `startGame()` -> `Game` play route.

Patch 12D added `app/screens/SettingsScreen.tsx` and registered a `Settings` stack route. The page has a static Profile card at top, visual-only Sound/Haptics toggles, placeholder Game/Account/About rows, and a disabled Reset Progress row.

Patch 12E added `app/components/BottomNav.tsx` and wired it into Home, Vault, and Settings. The Play tab uses the same `startGame()` -> `Game` path and the dock is not visible during active gameplay.

Patch 12F polished bottom nav spacing and active states. Home, Vault, and Settings use shared bottom content padding so content clears the dock. Play remains a center action but no longer looks permanently selected.

Patch 13 refreshed active Polly dialogue in `app/hooks/usePollyAnimator.ts`, `app/screens/ResultsScreen.tsx`, and `app/game/session.ts` so Polly reads as a smug polysemous word thief/opponent instead of a friendly helper. Dormant/legacy dialogue paths were left untouched.

Patch 15 polished the active Play/Game screen as a premium semantic combat arena: compact glass HUD, staged hero word, framed active tile lane, and stronger Master Gate dock. GameScreen remains nav-free and gameplay logic is unchanged.

Patch 16 polished the active mask/trap tile as the top slab in a concealed heavy POLYWORDS meaning-tile stack, not a flimsy paper-card deck. Up to 2 under-tiles may be visually implied with thick dark edges, shadow, offset, and depth only; they must stay unreadable and must never reveal truth/type/status. Press-hold now feels like gripping/pulling a heavy tile off the stack. The active tile has a heavier slab/bevel treatment; pre-swipe masks feel like solid meaning tiles. Trap identity as brittle false-meaning glass is revealed only after RIGHT commitment/shatter; real meanings remain weighty and absorb upward when claimed. Scoring, swipe grammar, tile resolution, Master Gate logic, Polly timing/budget, and navigation unchanged.

Patch 17 completed device-sanity visual polish for the active gameplay arena: slimmer HUD chrome, cleaner/heavier concealed under-tile slab offsets, less visually loud right shatter-lane marker, more breathing room above the Master Gate dock, and locked gold normalization in the gameplay surface. Gameplay mechanics, scoring, swipe grammar, one-active queue, tile resolution, hidden release, Master Gate logic, Polly timing/budget, navigation, and content data unchanged.

Patch 18 added Mastered / Haunted outcome drama in `app/components/MaskBoard.tsx`: Master Word success now pauses on a MASTERED overlay after the existing ceremony, and Master Word failure now pauses on a HAUNTED overlay with return promise and an available missed/trap detail. Input is locked while either overlay is visible, and word advancement waits for the overlay auto-complete or tap-to-continue. Scoring math, swipe grammar, Master Gate logic, mask/trap data, and one-active-tile queue behavior are unchanged.

Patch 19 added `app/audio/sfx.ts`, a centralized cleaned-SFX helper on the existing `expo-av` stack. It preloads, plays, cools down, and unloads the files in `assets/sfx/` with per-sound volumes and silent failure. `GameScreen.tsx` preloads/unloads the SFX set, and `MaskBoard.tsx` uses cleaned SFX for Mastered/Haunted overlays, overlay continue taps, Master Gate open, trap shatter, and wrong trap/meaning feedback. Tile-swipe-start and press-hold SFX remain unwired because no clean `MaskBoard` event surface exists for those starts.

Patch 20 wired the remaining supported SFX names through clean tile gesture hooks. `SwipeMask.tsx` now exposes optional `onSwipeStart`, `onPressHoldStart`, and `disabled` props; `MaskBoard.tsx` passes them for active tiles and the boss mystery tile. `pressHoldStart` plays once on PanResponder grant, `tileSwipe` plays once when drag crosses the existing intentional-swipe threshold, and both are blocked when Mastered/Haunted overlays lock input. Gameplay behavior, scoring, swipe grammar, Master Gate logic, mask/trap data, and queue behavior are unchanged.

Patch 21 complete: player progress persistence, Word Vault real data wiring, and Vault Ranks implemented. `app/store/useGameStore.ts` gained `PROGRESS_KEY = 'polywords_progress'`, a `progress: PlayerProgress` state slice (`masteredWords[]`, `personalBest`, `runsCompleted`), and actions `recordMastery`, `recordRunComplete`, `loadProgress`. All progress persists via AsyncStorage using the same pattern as the ghost system. `app/screens/VaultScreen.tsx` reads real persisted progress from `useGameStore`: Mastered Words renders real plaque entries with hidden meaning found and date mastered, Ghost Words reads real ghost data, Hidden Meanings renders entries with non-empty `hiddenMeaningFound`, and Ranks shows personal best, rank ladder, progress to next rank, Polly target status, runs completed, and words mastered. `app/game/types.ts` gained `MasteredWordRecord` type. `app/App.tsx` loads both `loadGhosts()` and `loadProgress()` on mount. TypeScript passed. Device sanity passed.

Patch 22 complete: Haunt Word return system implemented. `app/game/session.ts` gained `buildRunSession(ghostWordIds: string[]): SessionStep[]` which deep-copies `SESSION`, identifies the first matching ghost word, swaps it into index 9 (word position 10, 1-based), sets `isHauntReturn: true` on that step, and never replaces the boss at position 12. `app/store/useGameStore.ts` `startGame()` now passes run-start ghost word ids into `createGame()` which calls `buildRunSession()`. `app/components/MaskBoard.tsx` and `app/hooks/usePollyAnimator.ts` gained haunt entrance banner ("Guess who's back."), HAUNT BROKEN stamp on mastery of a haunt word, STILL HAUNTED stamp when a haunt word ghosts again, and `'hauntFailed'` event which fires Polly pop-in "BBBLAAAAHHAHAHA!" via `endOfRoundPopIn`. Double `impactAsync(Medium)` haptic fires at haunt word entrance. Haunt depth cards tinted purple (`#130D2A`). TypeScript passed.

Patch 28B complete: Daily Challenge screen implemented.
- New file `app/screens/DailyChallengeScreen.tsx`: 3-round identify-the-word mode. Three meanings are shown in a card; shuffled candidate word tiles are stacked using the same `SwipeMask` deck system as the main arena. UP claims the correct word, RIGHT rejects a distractor. Two shared lives span all 3 rounds. Results overlay shows title (WORD MASTER / SHARP / SURVIVED / HAUNTED), solved/missed pills per word, and a native Share sheet.
- `App.tsx` gained `Daily` stack route (`headerShown: false`).
- `HomeScreen.tsx` Daily Challenge card is now a live `Pressable` wired to `startDailyChallenge()` + `navigation.navigate('Daily')`. It reads `challengeNumber` and `alreadyPlayed` state from the store and shows result copy when already played.
- All daily engine logic (`app/game/dailyChallengeEngine.ts`, `app/game/dailyPool.ts`) and store actions (`startDailyChallenge`, `submitDailyWrongSwipe`, `submitDailyCorrectSwipe`, `completeDailyChallenge`, `loadDailyResult`) were already complete before this patch.
- `key={topId}` on `SwipeMask` forces remount per card change — same pattern as MaskBoard.
- Only React Native `Animated` used in the new screen; no new Reanimated imports.
- TypeScript passed with `npx.cmd tsc --noEmit`.

Patch 23 revised: card deck tile system fully rebuilt. WRONG SWIPES ARE NOW PERMANENT — tile flies away immediately, no snap-back, no retry. One decision per tile, permanent consequence. `'snap-back'` state REMOVED from `SwipeMaskState` in `SwipeMask.tsx` and all snap-back handler code removed from `MaskBoard.tsx`. The deck model is unchanged: all tiles arrive simultaneously stacked, top card only is interactive, correct/trap-caught tiles remove from deck at 180ms, wrong tiles remove from deck at 400ms (after exit animation has started). Gate is now BOSS ONLY — words 1–11 never open the Master Gate and never have a hidden tile. MASTERED is BOSS ONLY — only word 12 (boss) can be vaulted per hunt. GHOST is BOSS ONLY — only the boss word can create a true ghost. Non-boss words 1–11: deck empty → `triggerWordExit()` (word scales up and fades, 1050ms total) → `store.completeWord()`. No overlay. No gate. No mastery. No ghost. Boss word: perfect visible clear → gate opens → ONE mystery tile drops (randomly the real hidden meaning or the hidden trap, determined by `mysteryIsRealRef`) → correct judgment = MASTERED → wrong = GHOST. Boss with any wrong swipe on visible masks → gate permanently locked → silent advance. The old two-tile split gate system is replaced by a single mystery tile. The complex ghost merge animation (`ghostMergeOpacity`, `splitTile2TransY`, `ghostMergeVisible`, etc.) was removed. `triggerWrongFail` simplified to: shard burst → HAUNTED overlay at 800ms. `triggerWordExit()` added as a new function for non-boss word transitions. TypeScript passed. Device sanity passed.

docs/POLLY_DIALOGUE_BANK.md is the source-of-truth bank for future Polly dialogue ideas, approved tone examples, raw seeds, ghost/system copy, boss-word taunts, and lines to avoid.

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
| Deep Dark | `#0F0D2A` | Master Gate locked background and player Vault archive/card surfaces |
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
| MASTER stamp | Gomarice Okuba | 44px, diagonal, gold |
| Polly big reaction lines | SuperCartoon | varies |

---

## Session Model â€” THE HUNT

### The Fundamental Architecture

Every POLY RUN is a HUNT. Always 12 words. Always a designed difficulty arc. Always a boss at position 12. The player hunts through 11 words to confront the boss word that Polly holds.

**Lives are session lives â€” 5 lives for the entire 12-word hunt.**

### Golden Pacing System

`docs/GOLDEN_PACING_SYSTEM.md` is the durable source of truth for Hunt emotional rhythm, Semantic Snap Rate, content selection, and future content metadata. It defines the target cycle: Recognition -> Doubt -> Discovery -> Confidence -> Tension -> Mastery.

The system is documentation only for now. Do not hardcode pacing logic or automated Hunt generation until a manually tagged test set exists.

Golden Pacing System documentation is locked in `docs/GOLDEN_PACING_SYSTEM.md`. The GPS defines the target emotional arc: 2 Confidence + 3 Flow + 3 Tension + 3 Panic + 1 Boss per Hunt. Core principle: POLYWORDS is a semantic combat game â€" the word is the boss, masks are Polly's defenses, mastery is taking the word away from her. Primary success metric: Semantic Snap Rate. The Semantic Snap is the "Waitâ€¦ what? Oh. Right." moment. Implementation is documentation-only until a manually tagged word set exists.

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

| # | Word | Phase | Emotional Beat |
|---|---|---|---|
| 1 | WAVE | Confidence | Opener |
| 2 | FINE | Confidence | Build trust |
| 3 | CHARGE | Flow | Rhythm begins |
| 4 | PLANT | Flow | Spy snap |
| 5 | TABLE | Flow | Brain glitch |
| 6 | CAPITAL | Tension | First tension |
| 7 | SENTENCE | Tension | Dual domain |
| 8 | SPELL | Tension | Multi-domain |
| 9 | DRAFT | Panic | Three domains |
| 10 | RANK | Panic | Smell snap |
| 11 | SOUND | Panic | Geographic snap |
| 12 | CAST | Boss | Final boss â€” Polly's word |

Hunt 1 is GPS-compliant: 2 Confidence + 3 Flow + 3 Tension + 3 Panic + 1 Boss. Words 1â€”11 carry no hidden meaning â€” gate and mastery are boss-only. CAST carries hiddenMeaning: 'Molten metal takes shape' and hiddenTrap: 'Spell gets thrown on you'. Mystery tile is randomly either the real hidden or the trap.

---

## Swipe Grammar â€” Sacred

| Gesture | Meaning | Result |
|---|---|---|
| Swipe UP | This IS a real meaning | Correct: magnetic absorb into word |
| Swipe RIGHT | This is a TRAP | Correct: purple/rose crystal shard burst |
| Wrong UP (trap swiped up) | Claimed a trap | Feather lost, tile exits permanently, red flash |
| Wrong RIGHT (real swiped right) | Rejected a real meaning | Feather lost, tile exits permanently, red flash |

ðŸ”’ UP = real. RIGHT = trap. Sacred. Permanent. Never change.
ðŸ”’ No left swipe. No tap. No tap-and-submit. Swipe only.

### Wrong Swipe Behaviors â€” Locked

Wrong swipes are permanent. The tile exits immediately, the player loses 1 feather, and the same tile is never retried.

- No snap-back.
- No rubber-band return.
- No tile staying in the deck after a wrong swipe.
- No retrying the same tile after a wrong swipe.
- The word continues when feathers remain; run/haunt logic handles zero-feather or boss failure outcomes.

---

## One-at-a-Time Tile Queue System

**LOCKED DESIGN - Patch 3 complete.**

### Fundamentals
One tile enters at a time. Player makes one binary decision. Next tile arrives after resolution. Feels like a fight, not a quiz.

### Current Implementation Notes
- Patch 23 revised is the current source of truth.
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
## Master the Word â€” Boss-Only Sequence (Patch 23 Revised)

### ACT 1 â€” LOCKED STATE
- Background: #0F0D2A Â· Border: 1.5px gold 22% Â· Lock breathing pulse Â· Height: 72px
- Zero player interaction ever
- Words 1-11 never open the gate.

### ACT 2 â€” THE BREAK (Perfect Clear â€” Auto)
Boss word only. `wrongSwipeOccurred.current` must be false. Player NEVER swipes gate.
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
T+900ms: ONE mystery tile drops into the active tile position.
- Mystery tile is randomly either the real hidden meaning or the hidden trap.
- No two hidden split tiles.
- No second hidden tile.

### ACT 4 â€” THE JUDGMENT
- Correct UP: magnetic absorb, word FLARES gold, Polly hiddenReveal
- Correct RIGHT: 18 shards, faster, double bloom
- Correct judgment on the mystery tile: MASTERED
- Wrong judgment on the mystery tile: GHOST
- Wrong mystery swipe loses 1 feather and triggers the simplified boss failure path.

### ACT 5 â€” MASTERY SEQUENCE (Patch 8 complete)
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

ðŸ”’ Diagonal MASTER stamp over the word â€” not the old "MASTERED" label below the word.
ðŸ”’ Word Core goes toward the Vault nav icon, never into the Master Gate.
ðŸ”’ Polly is not the achievement voice.
ðŸ”’ Crystal shards are POLYGON geometry â€” never rectangles or squares.

### BINGO BANGO ZZZZINGO! â€” System Stinger

`BINGO BANGO ZZZZINGO!` is NOT Polly dialogue.

Use it only as a rare GAME/SYSTEM achievement stinger:
- Trigger only when a Boss Word is fully mastered and the Word Core is vaulted.
- Do not use it for every mastered word.
- Do not use it as Polly dialogue.
- Presentation: one word at a time, hard entrance for each word, each word lands with a BOOM-style impact.
- Rhythm:
  - BINGO
  - BANGO
  - ZZZZINGO!
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

### ACT 6 â€” THE GHOST (Boss Only)
- Background: rgba(123,45,139,0.06) Â· Border: SOLID 1.5px rgba(123,45,139,0.55)
- NO DASHES, NO PINK, NO MAGENTA
- Purple dot top-right: 6px slow pulse
- Text: "MASTER THE WORD" â€” white 70% Â· Subtitle: "From [WORD]" â€” dim purple
- The phrase is NEVER revealed.
- Triggered only by boss failure.
- Ghost `wordId` is always the word string, never `stepIndex`.

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
ðŸ”’ `BINGO BANGO ZZZZINGO!` is game/system achievement text only, never Polly dialogue.
ðŸ”’ Max 2 Polly in-round appearances per word. Hunt-level = separate system.
ðŸ”’ Boss word drops FROM Polly's direction â€” she throws it.

---

## The Word Vault — Player Archive (Real Data + Ranks Implemented)

The Word Vault is the player's reclaimed meaning archive and trophy room. It is distinct from Polly's Master Gate cage/vault in gameplay.

Patch 12A added the first page shell in `app/screens/VaultScreen.tsx` and registered a `Vault` stack route in `App.tsx`. Patch 21 completed real persisted progress wiring and Vault Ranks.

Current Vault sections:
- Mastered Words
- Ghost Words
- Hidden Meanings
- Ranks

`VaultScreen.tsx` reads real persisted progress from `useGameStore`: `masteredWords`, `personalBest`, and `runsCompleted`. Progress writes through `recordMastery`, `recordRunComplete`, and loads through `loadProgress`. Ghost Words reads real ghost data.

Vault Ranks are implemented. Rank tiers:
- D below 8,000
- C at 8,000
- B at 11,000
- A at 14,000
- S at 18,000
- MASTER at 22,000

The Ranks tab shows personal best, rank ladder, progress to next rank, Polly target status, runs completed, and words mastered.

Mastered Words, Ghost Words, Hidden Meanings, and Ranks live here. The page must feel player-owned: dark magical archive, trophy-card shelves, word plaques, subtle vault/archive geometry. Avoid cage, prison, chain, or Polly-lair visuals.

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
Word compresses â†’ gold tile â†’ launches to vault nav icon â†’ vault icon blooms â†’ impactAsync(Heavy) â†’ THUNK sound

### Paywall (Word 21)
No Polly. Frosted overlay on word 21.
"VAULT FULL" / "Unlock unlimited to keep going." / CTA: "UNLOCK UNLIMITED"

### Navigation
Tab: "VAULT" Â· Icon: heavy vault door, partially open, gold light spilling

---

## Ghost System

**Creates a ghost:** Boss-only failure after the boss gate mystery tile is judged wrong. Non-boss words never create true ghosts.

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
- Haunt return placement is position 10 / index 9.
- Haunt return never replaces boss position 12.

### Boss Ghost Loss Sequence â€” Patch 23 Revised

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
| Vault impact / core landing | impactAsync(Heavy) |
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
- Rank scale: D below 8,000 Â· C at 8,000 Â· B at 11,000 Â· A at 14,000 Â· S at 18,000 Â· MASTER at 22,000
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
  - Patch 23 revised later replaced the old hidden tile flow with boss-only one mystery tile while preserving scoring and UP/RIGHT swipe grammar.
- Patch 4 complete: active mask tile presentation and press-hold polish implemented in `app/components/MaskBoard.tsx` and `app/components/SwipeMask.tsx`.
- Patch 5 complete: UP absorb and RIGHT toss/shatter tuned for the single-tile arena.
  - Correct UP real meanings now pull harder into the hero word, shrink/fade near impact, and trigger the existing word absorb pulse.
  - Correct RIGHT traps now fling farther into the right-side shatter lane with stronger rotation, shrink, fade, and larger purple/rose shard burst.
  - Shard burst count is now 18.
  - Shard colors remain only `#7B2D8B` and `#9B2D6B`.
  - Patch 23 revised superseded the old bounce-back: wrong RIGHT now loses 1 feather and exits permanently.
  - Existing wrong-swipe logic still handles feather loss.
  - Active visible tile advance delay changed from 450ms to 650ms.
  - Scoring unchanged.
  - Swipe grammar unchanged.
  - One-active-visible-tile queue unchanged.
  - Patch 23 revised later replaced the old hidden tile flow with boss-only one mystery tile.
  - TypeScript passed with `npx.cmd tsc --noEmit`.
- Patch 6 complete: Master Gate cage/vault visual overhaul.
  - Changed only `app/components/MaskBoard.tsx`.
  - Removed emoji lock.
  - Added custom lock built from React Native `View` shapes.
  - Rebuilt locked gate as a darker cage/vault mechanism using `#0F0D2A`.
  - Reduced locked-state gold: border starts as muted purple and only charges toward gold during unlock.
  - Added faint purple cage bars, center ribs, bolts, dark inset depth, and layered door halves.
  - `MASTER THE WORD` text remains exact.
  - Text is readable white, not reward-like gold.
  - Gate height shortened to 64px.
  - Gate remains below active tile and quieter than tile.
  - Existing perfect-clear/unlock flow preserved.
  - Patch 23 revised later replaced door split/hidden tile flow with boss-only one mystery tile.
  - Scoring, swipe grammar, active tile queue, ghost logic, Polly logic, and store architecture unchanged.
  - TypeScript passed with `npx.cmd tsc --noEmit`.
- Patch 7 original two-hidden-tile release was superseded by Patch 23 revised single boss mystery tile.
  - Changed `app/components/MaskBoard.tsx` and `app/components/SwipeMask.tsx`.
  - Current rule: boss perfect clear drops one mystery tile into the active tile position.
  - Current rule: mystery tile is randomly real hidden meaning or hidden trap.
  - Current rule: wrong mystery swipe loses 1 feather and creates a boss-only GHOST.
  - Words 1-11 never release hidden tiles, open the gate, master, or ghost.
  - Scoring model and UP/RIGHT swipe grammar are preserved.
  - Reanimated stays in `SwipeMask.tsx`.
  - Hidden release motion uses React Native Animated in `MaskBoard.tsx`.
  - TypeScript passed with `npx.cmd tsc --noEmit`.
  - Device sanity passed.
- Patch 8 MASTERED celebration remains, but Patch 23 revised made MASTERED boss-only.
  - Changed `app/components/MaskBoard.tsx` and `app/hooks/usePollyAnimator.ts`.
  - Reworked mastery handoff after the boss mystery tile resolves correctly.
  - Hero word crashes toward center.
  - Diagonal MASTER stamp slams over the word.
  - Crack/energy effect appears.
  - Word Core appears, grows, glows, spins, then shoots toward the Vault nav area.
  - Non-boss words never show MASTERED/HAUNTED overlays.
  - Boss mastery can show boss-only GAME/SYSTEM stinger: BINGO, BANGO, ZZZZINGO!.
  - `BINGO BANGO ZZZZINGO!` is not Polly dialogue.
  - Polly's old BINGO-style dialogue removed.
  - Boss mastery Polly line is now: "Fine. Take it."
  - `SwipeMask.tsx` unchanged.
  - Scoring and swipe grammar unchanged.
  - TypeScript passed with `npx.cmd tsc --noEmit`.
  - Device sanity passed.
- Patch 9 two-hidden-tile ghost merge was superseded by Patch 23 revised boss-only ghost failure.
  - Changed `app/components/MaskBoard.tsx` and `app/hooks/usePollyAnimator.ts`.
  - Current rule: wrong boss mystery judgment triggers the simplified GHOST path.
  - Current rule: no two hidden tiles merge.
  - Ghost Tile forms with exact copy: `MASTER THE WORD` / `From [WORD]`.
  - Microcopy appears: `You left me behind.`
  - Existing `store.addGhostedMaster(step.word)` and `store.completeWord()` behavior preserved.
  - Wrong mystery swipe loses exactly one feather.
  - Added safe opponent Polly pop-in line for boss ghost failure: "Not yours yet."
  - `SwipeMask.tsx` unchanged.
  - Scoring, swipe grammar, and Patch 8 boss mastery celebration unchanged.
  - `BINGO BANGO ZZZZINGO!` behavior unchanged and still not Polly dialogue.
  - TypeScript passed with `npx.cmd tsc --noEmit`.
  - Device sanity passed.
- Patch 10 complete: Polly pop-in budget and larger opponent presentation implemented.
  - Changed `app/hooks/usePollyAnimator.ts` and `app/components/MaskBoard.tsx`.
  - Added/tightened per-word pop-in budget system.
  - Added `pollyPopInVisible` state/ref, `pollyEnterAnim` slide, `pollyHideTimerRef`, `popInCountRef`.
  - `tryMidRoundPopIn()` silently skips if 1 mid-round pop-in already used for the current word.
  - `endOfRoundPopIn()` always fires for boss mastery/failure, `gameOver`, `bossEntry`, `gateIntro`, and ghost resolution.
  - `wrong` event: reacts without consuming budget if Polly already visible; otherwise tries budget.
  - `hesitation6s`/`9s`: updates speech only if Polly already visible — no new pop-in, no budget consumed.
  - `oneHeartLeft` / one-feather-left critical warning still fires as a special urgent event.
  - `wordEntry`/`switchbackEntry`: reset `popInCountRef` per word.
  - Non-boss completion now uses the normal word exit/transition, not MASTERED/HAUNTED overlays.
  - Polly render is conditional on `pollyPopInVisible` — not in the tree during ordinary play.
  - `MaskBoard.tsx` applies both `pollyPopInStyle` and `pollyAnimatedStyle`.
  - Two-layer `Animated.View`: outer gets `pollyPopInStyle` for enter/exit slide; inner gets `pollyAnimatedStyle` for reactions.
  - Polly sprite size increased from 80 to 160.
  - Polly remains bottom-left and reads as a larger opponent reaction character, not a small sticker.
  - Speech bubble repositioned: `bottom: 186`, `left: 78`, `maxWidth: 210`, 13px text.
  - Existing opponent lines preserved: "That was mine." / "Fine. Take it." / "Not yours yet."
  - `BINGO BANGO ZZZZINGO!` remains game/system stinger only — not Polly dialogue.
  - Patch 23 revised later replaced hidden tile release and ghost merge with boss-only one mystery tile and simplified ghost failure.
  - TypeScript passed with `npx.cmd tsc --noEmit`.
  - Device sanity passed.
- Content tool added: local POLYWORDS Mask Rewriter at `tools/content/mask-rewriter`.
  - It is local internal tooling, not player-facing gameplay code, and must never be wired into the live app UI.
  - React/Vite frontend plus local Express server.
  - `npm.cmd run dev` starts both backend and frontend.
  - Backend: `http://localhost:8787`.
  - Frontend: `http://localhost:5173`.
  - Server endpoint: `POST http://localhost:8787/api/rewrite-batch`.
  - Uses Anthropic via `ANTHROPIC_API_KEY` in `tools/content/mask-rewriter/.env`.
  - Never commit `.env`, real API keys, or generated CSV output.
  - `.env.example` must contain placeholders only.
  - `TEST_MODE=true` is required by the current local server guard.
  - Generated output is draft-only and must be human-audited before entering the game database.
  - Exported rows include `AUDIT STATUS` and `AUDIT ISSUES` review metadata.
  - Supports Test Batch, Specific Words, Full Loaded Database with confirmation, creativity controls, Fresh rerun, Tweak Notes, CSV word source import, pause/resume, live preview, run log, CSV download, and audit columns (`AUDIT STATUS`, `AUDIT ISSUES`).
- Patch 23 original snap-back behavior was superseded by Patch 23 revised.
  - Changed `app/components/MaskBoard.tsx`, `app/components/SwipeMask.tsx`, and `app/hooks/usePollyAnimator.ts`.
  - All tiles for a word arrive as a stacked deck; only the top card is interactive.
  - Wrong swipes are permanent: tile exits, 1 feather is lost, no snap-back, no retry.
  - `'snap-back'` was removed from `SwipeMaskState` in Patch 23 revised.
  - `key={topMask.id}` added to top-card `SwipeMask` so React fully remounts on card change (prevents frozen judgedRef / stale rAF).
  - Unmount cleanup useEffect added to `SwipeMask.tsx` to cancel absorb rAF on unmount.
  - `activeVisibleTileIndex`, `activeVisibleAdvanceRef`, `orderedVisibleMasks`, and `ACTIVE_VISIBLE_TILE_ADVANCE_DELAY_MS` fully removed from `MaskBoard.tsx`.
  - New `remainingMaskIds` state drives deck membership; top card is `remainingMaskIds[0]`.
  - Correct swipes remove card from deck at 180ms (gives animation a head start).
  - Wrong swipes remove card from deck at 400ms after the exit animation starts.
  - Completion check watches `remainingMaskIds` instead of tile index.
  - `deckSlamY` (useNativeDriver: true) animates deck entrance per word — spring from -52 to 0, with delay 80ms normal / 1200ms boss.
  - `deckRedTint` (useNativeDriver: false) tints depth card backgrounds toward `#2A0808` when lives reach 0.
  - Zero-feather/run-failure handling follows the current run/haunt logic; wrong swipes do not leave the tile in deck.
  - Deck renders up to 3 depth cards (`#2E2870`, purple border) at staggered offsets/rotations.
  - `deckSlamY` (native) and `masterAllFadeAnim` (JS) are split across two nested `Animated.View`s to avoid mixed-driver crash.
  - `'oneWrongMove'` event added to `usePollyAnimator.ts`: fires at most once per word when lives hit 0, Polly says "One wrong move." via `endOfRoundPopIn`.
  - Patch 23 revised changed gate sequence to boss-only, one mystery tile, boss-only mastery/ghost, and non-boss word exit transitions.
  - TypeScript passed with `npx.cmd tsc --noEmit`.
- Patch 29 complete: Live Hunt generation from tile database.
  - assets/data/huntData.json: 232-word tile database (208KB).
  - app/game/huntGenerator.ts: GPS tier sampling, Mulberry32 PRNG, ghost priority at index 9, boss-first selection, fallback tiers.
  - app/game/polyRunEngine.ts: createGame() accepts optional session param.
  - app/store/useGameStore.ts: startGame() calls generateHunt().
  - SESSION fallback preserved. Every run generates a fresh 12-word arc.
- Patch 30 complete: Game screen visual redesign.
  - Font stack: Bungee Shade (hero word), Barlow Condensed Bold (all UI), Lilita One (Polly speech only). All UI uppercase except Polly.
  - Hero word: 12-layer diagonal extrusion, gold face, dark amber depth, outer glow shadow. Bungee Shade at 96px normal / 114px boss.
  - Tile slab: full-width, purple glow border, gloss highlight, adjustsFontSizeToFit on phrase text (26px, min scale 0.65, 2 lines).
  - Gate restricted to boss-only (isBoss condition restored).
  - POLLY'S WORD replaces BOSS WORD in all player-facing copy.
  - Font rollout to HomeScreen, ResultsScreen, VaultScreen, SettingsScreen.
  - POLYWORDS / WORD VAULT / SETTINGS titles use FONTS.wordDisplay.
  - Polly speech lines use FONTS.polly (Lilita One) on all screens.
- Patch 31 complete: Daily Challenge redesign.
  - 5 rounds (was 3). ROUND_COUNT = 5.
  - Layout fills full screen. Cards height 100px. 3x3 grid.
  - Instruction label: ONE WORD FITS ALL.
  - CLAIM_THRESHOLD reduced to -25 (was -40) — bottom row tiles now register.
  - Font system applied throughout DailyChallengeScreen.
  - adjustsFontSizeToFit on candidate word cards.

### Remaining Pending Work

1. Continue running Mask Rewriter sessions to grow `huntData.json` beyond 232 words (target 400+)
2. Future daily/friend/global leaderboards and deeper social ranking systems.
3. `expo-av` to `expo-audio` migration.

### Pinned / Pending

- Polly redesign blocked — needs new bird-like sprite sheet.
  Current design is too humanoid for the planned flight animation system.
  New animation design: mid-round fly-through (enter bottom-left, hover,
  exit bottom-right), end-of-round perch (land on branch bottom-right,
  stay until next word, branch pulled off screen on exit).
  No code work until new sprite delivered.

### Content Pipeline State

- 232 words tiled, 1838 tiles total (614 real / 1047 trap / 151 hidden).
- huntData.json live in game. 507 words still at zero tiles.
- Target: 400+ tiled words before next huntData.json regeneration.
- Mask Rewriter V4 artifact available in project files.

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
- â˜ ï¸ Old "MASTERED" label-below-word celebration
- â˜ ï¸ Visual tells on tiles before swipe
- â˜ ï¸ phraseBreakPool, slangPool, switchbackPool
- â˜ ï¸ expo-av (migrating)
- â˜ ï¸ "reverseMountOrder" bossModifier
- â˜ ï¸ Snap-back wrong swipes — replaced by permanent tile exit
- â˜ ï¸ Two-tile hidden gate split — replaced by single mystery tile
- â˜ ï¸ Ghost system for non-boss words — ghosts are boss-only
- â˜ ï¸ MASTERED/HAUNTED overlays for non-boss words
- â˜ ï¸ hiddenEmoji and hiddenTrapEmoji fields on WordStep

---

## Locked Decisions â€” Non-Negotiable

- Session: always 12 words, always boss at position 12
- Swipe UP = real. Swipe RIGHT = trap. Always.
- Living Pool: mastered words graduate permanently
- RUN IT BACK = fresh draw, ghost priority
- Boss position 12 = confrontation endpoint
- Polly throws boss word at position 12
- Gate auto-opens only on boss perfect clear â€” never swipe to open
- wrongSwipeOccurred.current resets at start of every new word
- Crystal shards: polygon, purple/rose, radial burst â€” never rectangles
- Diagonal MASTER stamp over crashed word during mastery celebration
- Ghost tile never reveals missed phrase
- "Thought so." â€” never change
- "BINGO BANGO ZZZZINGO!" spelling â€” never change
- "BINGO BANGO ZZZZINGO!" is rare game/system achievement text only, never Polly dialogue
- Database grows over time â€” no finish line, no endgame
- All tiles identical until swiped â€” Polly gives nothing away
- Vault replaces Garden â€” permanent
- "POLLY CLIPPED YOUR RUN." replaces GAME OVER at zero feathers
- "POLLY HUNT COMPLETE" is the results screen session header
- "YOU BEAT POLLY" fires on results when score â‰¥ 15,000
- Polly's target score: 15,000 pts (MVP fixed)
- Rank scale: D below 8,000 / C at 8,000 / B at 11,000 / A at 14,000 / S at 18,000 / MASTER at 22,000
- Life Feather milestones: 8,000 and 16,000 pts restore 1 feather; 1 reserve feather max is implemented
- “You left me behind.” â€” micro-copy on ghost birth
- “Not yours yet.” â€” Polly line on ghost exit
- Wrong swipes are permanent â€” tile flies away, no snap-back, no retry
- Gate opens on boss word perfect clear only â€” words 1â€”11 never open the gate
- MASTERED is boss-only â€” only word 12 (boss) can be vaulted per hunt
- GHOST is boss-only â€” only boss failure creates a true ghost
- Boss gate uses one mystery tile â€” randomly real or trap â€” one shot
- Non-boss words advance via triggerWordExit() â€” no overlay, no gate
- Haunt slot is index 9 (position 10) â€” never indexes 10 or 11 (boss zone)
- Ghost wordId = word string always â€” never stepIndex
- Boss word player-facing display name: “POLLY'S WORD” (replaces “BOSS WORD” in all UI copy). Engine flags (eventType: 'bossWord', bossModifier) unchanged.
- Live Content Engine is POST-LAUNCH ONLY — do not build pre-launch
- Content law locked: min 2 reals per word, max 3 traps per real

---

## Pinned / Blocked

### Polly Redesign — BLOCKED until new sprite delivered
- Current sprite too humanoid for planned flight animation system.
- File: assets/images/polly_sprite.png — 3×3 PNG, 418×418 cells.
- New animation design (do not build yet):
  Mid-round: flies in bottom-left, hovers with comment, exits right.
  End-of-round: lands on branch bottom-right, stays until next word,
  branch + Polly pulled off screen right on exit.
- No code work until new bird-like sprite is delivered.

### Live Content Engine — POST-LAUNCH ONLY. DO NOT BUILD BEFORE LAUNCH.
After launch, this system keeps content fresh for returning players.
What it does:
- Finds words with zero tiles and generates them automatically
- Periodically rewrites existing tile sets to refresh content
- Generates GPS-compliant Hunt arcs from updated database
- Game fetches huntData.json from CDN instead of bundled JSON
Built on tools/content/mask-rewriter (Node/Express).
Content laws enforced: min 2 reals, max 3 traps per real, GPS arc rules.
Hosting TBD: Cloudflare Workers / Railway / Render.
This is a v2 post-launch feature. Do not design or build pre-launch.

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
app/components/MasterGateTile.tsx    Gate: locked / unlock / boss mystery tile
app/components/PollyCard.tsx         Polly sprite + speech
app/components/PollyController.tsx   Polly trigger system
app/game/session.ts                  12-word session data
app/game/polyRunEngine.ts            Game state engine
app/game/types.ts                    All TypeScript types
app/store/useGameStore.ts            Zustand store
app/screens/GameScreen.tsx           Main game screen
app/screens/ResultsScreen.tsx        End-of-run results
app/screens/DailyChallengeScreen.tsx Daily Challenge screen
app/game/dailyChallengeEngine.ts     Daily session builder, engine functions, result builder
app/game/dailyPool.ts                Daily word pool (tiered)
app/utils/SoundEngine.ts             WAV synthesis
tools/content/mask-rewriter          Local-only content rewrite/audit tool; never wire into player app
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

- Patch 10 complete: gameplay Polly render is conditional on `pollyPopInVisible`; Polly is not in the tree during ordinary active play.
- Polly is not a permanent gameplay presence.
- Polly is the opponent, not a friendly celebration mascot.
- Polly appears only as a pop-in.
- 1 pop-in during a big moment in a word round.
- Polly always appears at end of round win/loss.
- Polly pops from bottom-left and never blocks the active tile, right shatter lane, Master Gate, or boss mystery tile.
- Polly sprite size is now 160 for a larger opponent reaction presentation.
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
- Gate opens only on boss word perfect clear.
- Words 1-11 never open the gate.
- Low on board, above nav bar safe area.
- Bird cage / vault hybrid.
- Subtle tension, never overbearing.
- Surface uses `#0F0D2A`.
- Faint cage bars.
- Small lock.
- Quiet gold charge only when earned.
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

- Word Core is the mastery trophy.
- It does not go into the Master Gate.
- It belongs in the player's Vault page.
- The Master Gate is Polly's cage, not storage.

### Ghost Loss

- Boss-only.
- Triggered by wrong judgment on the boss mystery tile.
- Wrong swiped tile exits permanently.
- No two hidden tiles merge.
- No hidden split tile sequence.
- HAUNTED overlay appears after the boss failure beat.
- Ghost Tile forms:
  - MASTER THE WORD
  - From [WORD]
- Microcopy: You left me behind.

### Ghost Return / Haunt Words

- Ghosted words return late in future Hunts.
- Haunt slot is position 10 / index 9.
- Never replace Boss Word at position 12.
- Ghost `wordId` is always the word string, never `stepIndex`.
- Returning ghost word entrance copy: Guess who's back.
- If mastered: HAUNT BROKEN
- If failed again: STILL HAUNTED
- Returning Haunt failure Polly taunt: "BBBLAAAAHHAHAHA!"

### Life System

- Hearts are replaced by Feathers.
- Player normally has 5 feathers.
- Wrong swipe plucks 1 feather.
- 0 feathers ends run.
- Score milestones exist at 8,000 and 16,000 points.
- Crossing a milestone can restore 1 feather.
- If feathers are full, player can hold 1 reserve feather max, so lives can reach 6.

Current implementation:
- HUD renders five custom feather slots in `GameScreen.tsx`.
- Reserve feather is rendered separately in the HUD.
- `+1 FEATHER` milestone feedback exists.
- Internal engine/store state is still named `lives`; do not rename it until a dedicated state migration.

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
6. Master Gate visual overhaul (Patch 6 complete)
7. Hidden tile unlock (Patch 7 complete)
8. MASTERED celebration (Patch 8 complete)
9. Ghost merge loss (Patch 9 complete)
10. Polly pop-in budget / larger opponent presentation (Patch 10 complete)
11. Database audit + selective masks/traps rewrite
12. Word Vault page shell (Patch 12A complete)
13. Golden Pacing System docs (Patch 12B complete)
14. Home arcade lobby shell (Patch 12C complete)
15. Settings/Profile shell (Patch 12D complete)
16. Life Feather milestone/reserve system (complete) and score targets
17. Haunt Word return system
18. Bottom navigation app shell (Patch 12E complete)
19. Bottom nav spacing / active-state polish (Patch 12F complete)
20. Polly dialogue tone cleanup (Patch 13 complete)
21. Premium gameplay screen shell polish (Patch 15 complete)
22. Heavy active tile stack / weighted peel polish (Patch 16 complete)
23. Device sanity polish for gameplay arena (Patch 17 complete)
24. Card deck tile system original snap-back behavior (superseded by Patch 23 revised)
25. Patch 21 persistence + Vault real data + Ranks tab (complete)
26. Patch 22 Haunt Word return system (complete)
27. Patch 23 revised: permanent wrong swipes, boss-only gate, single mystery tile, non-boss word exit transition (complete)
28. Hunt 1 GPS-compliant session content (complete)
29. Daily Challenge screen — HomeScreen card wired, DailyChallengeScreen.tsx, Daily route (Patch 28B complete)
30. Live Hunt generation — huntData.json + huntGenerator.ts, GPS tier sampling (Patch 29 complete)
31. Game screen visual redesign — font stack, hero word extrusion, tile slab, font rollout to all screens (Patch 30 complete)
32. Daily Challenge redesign — 5 rounds, full-screen layout, font system applied (Patch 31 complete)

---

*POLYWORDS CLAUDE.md · Pete DiBari · June 12, 2026*
