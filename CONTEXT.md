# POLYWORDS â€” CONTEXT.md
### Quick-Reference Session Briefing · June 13, 2026

Paste this at the start of any Claude Code session to restore full context.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds 700+ words in her vault. She set every trap. The player challenges her one word at a time to take the title. Every session is a HUNT â€” 12 words, a designed difficulty arc, and Polly's boss word waiting at position 12.

**North star:** *"Waitâ€¦ what? â€¦ Shit, that's right."*

**App shell identity:** Home is the arcade lobby / launchpad. Play is the arena. Word Vault is the player's reclaimed meaning archive. Settings is utility for player/account/preferences/about. Profile belongs inside Settings for MVP and should not be a main nav tab. Bottom nav tabs are Home / Play / Vault / Settings, visible outside active gameplay only.

**Golden Pacing System:** `docs/GOLDEN_PACING_SYSTEM.md` is the source of truth for Hunt emotional rhythm, Semantic Snap Rate, future content metadata, and content selection. Target cycle: Recognition -> Doubt -> Discovery -> Confidence -> Tension -> Mastery. This is docs-only architecture for now; do not hardcode pacing logic or automated Hunt generation until a manually tagged test set exists.

**Hidden Truth Rule:** Before a swipe, all ordinary masks are equal. The player must never know whether a mask is real, trap, rare, hidden-worthy, or important before commitment. Truth is revealed only after commitment.

**Polly dialogue bank:** docs/POLLY_DIALOGUE_BANK.md is the source-of-truth bank for future Polly dialogue ideas, approved tone examples, raw seeds, boss-word taunts, ghost/system copy, and lines to avoid.

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
| Wrong UP | Claimed a trap | Feather lost, tile exits permanently |
| Wrong RIGHT | Rejected real meaning | Feather lost, tile exits permanently |

**No left swipe. No tap. No tap-and-submit. Swipe only. Always.**
**Wrong swipes are permanent. No snap-back, no retry, no wrong tile staying in the deck.**

---

## Current Session (12 words â€” test harness)

## Locked Play Screen Design

POLYWORDS is a word arena, not a quiz list. The hero word is the boss, the active mask tile is the challenger, the Master Gate is Polly's locked cage/vault, and the player steals mastery one swipe at a time.

**Hierarchy:** HERO WORD -> ACTIVE MASK TILE -> MASTER GATE -> HUD / SCORE / FEATHERS / STREAK -> POLLY POP-IN ONLY.

**Polly pop-in design:** Patch 10 complete. Polly is the opponent, not a friendly celebration mascot. She is not permanent on the gameplay screen. She appears only as a pop-in: 1 time during a big moment in a word round, always at end-of-round win/loss, entering from bottom-left. She never blocks the active tile, right shatter lane, Master Gate, or boss mystery tile. Sprite size is now 160 with a larger bottom-left opponent presentation. Non-boss words do not show mastery/ghost overlays. Boss mastery opponent line: "Fine. Take it." Boss ghost failure: "Not yours yet." Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!"

**Gameplay layout:** Top quiet HUD for score, feathers, streak. Giant hero word top-center as UP absorb target. Empty middle swipe lane. One active mask tile in lower-middle thumb zone. Clear right toss/shatter lane. MASTER THE WORD gate low on board above nav safe area. Bottom nav is not visible during active gameplay. Patch 3 implemented the one-active visible mask tile queue.

**Hero word:** Dominates screen, sits top-center during normal play, absorbs correct UP swipes, and crashes down to center during MASTERED celebration.

**Active mask tile design:** One active tile at a time. Large, premium, tactile, readable. Patch 16 complete: the active mask/trap tile is the top slab in a concealed heavy POLYWORDS meaning-tile stack, not a paper-card deck. Up to 2 under-tiles may imply depth beneath it, but they must stay unreadable and must never reveal truth/type/status. Hidden Truth Rule remains sacred. Press-hold wakes tile, gives haptic feedback, and feels like gripping/pulling a heavy slab off the stack. The active tile has heavier slab/bevel treatment; pre-swipe masks feel solid. Trap identity as brittle false-meaning glass appears only after RIGHT commitment/shatter; real meanings stay weighty and absorb upward when claimed. Scoring, swipe grammar, resolution, boss mystery gate logic, Polly timing/budget, and navigation unchanged.

Patch 17 complete: gameplay arena device-sanity polish only. HUD chrome is slightly slimmer, under-tile slab offsets are cleaner/heavier without revealing text or truth/type/status, right shatter-lane marker is quieter, Master Gate dock has more breathing room, and gameplay gold was normalized to `#F5C842`. Mechanics, scoring, swipe grammar, one-active queue, tile resolution, hidden release, Master Gate logic, Polly timing/budget, navigation, Golden Pacing, and content data unchanged.

Patch 18 outcome overlays remain available for boss outcomes only after Patch 23 revised. Boss success shows MASTERED with reclaimed/vault copy, gold pulse styling, and boss bonus text when applicable. Boss failure shows HAUNTED with Polly-stole/return copy and purple/rose ghost styling. Non-boss words do not show MASTERED/HAUNTED overlays. Input is locked while an outcome overlay is visible, and the word advances only after the overlay auto-completes or the player taps continue. Scoring math and swipe grammar are unchanged.

Patch 19 complete: cleaned SFX assets in `assets/sfx/` are centralized through `app/audio/sfx.ts` using the existing `expo-av` dependency. The helper exposes `preloadSfx()`, `playSfx(name)`, and `unloadSfx()`, uses requested default volumes, fails silently if audio is unavailable, and cools down longer sounds to avoid repeats. `GameScreen.tsx` preloads/unloads the SFX set. `MaskBoard.tsx` plays cleaned SFX for Mastered/Haunted overlays, overlay continue taps, gate open, trap shatter, and wrong trap/meaning feedback. Tile-swipe-start and press-hold-start remain supported names but unwired until a clean `MaskBoard` start event exists.

Patch 20 complete: `SwipeMask.tsx` exposes optional tile interaction hooks and `MaskBoard.tsx` wires them to the centralized SFX helper. `pressHoldStart` plays once on the existing PanResponder grant/grip start, and `tileSwipe` plays once when the drag crosses the existing intentional-swipe threshold. The hooks are disabled while Mastered/Haunted overlays lock input. Gameplay behavior, scoring, swipe grammar, Master Gate logic, mask/trap data, one-active queue behavior, and overlay timing are unchanged.

**Swipe motion:** UP claims real meaning; RIGHT rejects trap. No left swipe and no tap-submit. Patch 5 tuned the single-tile arena motion: correct UP pulls harder into the hero word, shrinks/fades near impact, and triggers the existing word absorb pulse; correct RIGHT traps fling farther into the right shatter lane with stronger rotation, shrink, fade, and a larger purple/rose burst. Patch 23 revised changed all wrong swipes to permanent exits: wrong tile leaves, 1 feather is lost, no bounce-back, no snap-back, no retry.

**Master Gate:** Text is MASTER THE WORD. It belongs to Polly, not the player. It is a low board bird cage / vault hybrid with subtle tension, `#0F0D2A` surface, faint cage bars, small lock, and quiet gold charge only when earned. The player's Vault is never on the game board; it is a nav/page destination.

**Master Gate unlock:** Boss word only. Last real visible boss tile absorbs into hero word -> gate border charges gold -> cage bars split slightly left/right -> lock snaps open -> one mystery tile drops into active tile position. The mystery tile is randomly either the real hidden meaning or hidden trap. Words 1-11 never open the gate.

**MASTERED celebration design:** Boss mystery tile judged correctly -> hero word crashes down center -> diagonal MASTER stamp slams over word -> word cracks open -> Word Core jumps out -> Core grows/glows/spins center-screen -> Core shoots toward Vault nav icon. MASTERED is boss-only. Boss mastery may additionally trigger the rare game/system `BINGO BANGO ZZZZINGO!` stinger after vaulting.

**BINGO BANGO ZZZZINGO! rule:** This is not Polly dialogue. Use only as a rare GAME/SYSTEM achievement stinger when a Boss Word is fully mastered and the Word Core is vaulted. It fires one word at a time with BOOM-style impacts: BINGO -> BANGO -> ZZZZINGO!, with `ZZZZINGO!` biggest.

**Word Core:** Mastery trophy. It does not go into the Master Gate. It belongs in the player's Vault page. The Master Gate is Polly's cage, not storage.

**Ghost loss design:** GHOST is boss-only. Wrong boss mystery judgment loses 1 feather, the tile exits permanently, and HAUNTED appears after the boss failure beat. No two hidden tiles merge. Ghost Tile forms with MASTER THE WORD / From [WORD]. Microcopy: You left me behind. Ghost `wordId` is always the word string, never `stepIndex`.

**Ghost return / Haunt Words design:** Ghosted boss words return late in future Hunts at position 10 / index 9, never replacing Boss Word 12. Entrance copy: Guess who's back. If mastered: HAUNT BROKEN. If failed again: STILL HAUNTED. Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!"

**Feathers:** Hearts are replaced by Feathers. Player normally has 5. Wrong swipe plucks 1. 0 feathers ends run. Score milestones exist at 8,000 and 16,000 points. Crossing a milestone can restore 1 feather. If feathers are full, player can hold 1 reserve feather max, so lives can reach 6.

Current HUD: `GameScreen.tsx` renders five custom feather slots plus a separate reserve feather. `+1 FEATHER` milestone feedback exists. Engine/store state may still be named `lives`; do not rename it.

**Score target/rank design:** Local personal best, Polly target status, Hunt rank ladder, and Vault Ranks display are implemented. Score does not replace mastery. Word Cores are permanent mastery trophies. Future daily/friend/global leaderboards and deeper social ranking systems remain future work.

**Color rules:** `#1A1830` background. `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core, and restrained Vault stat/title accents. `#7B2D8B` for UI/gate/shards/Vault frames. `#9B2D6B` for trap/ghost shard accents and Ghost Words accents. `#4CAF50` only Polly character. `#0F0D2A` for Master Gate locked surface and player Vault archive/card surfaces. `#CC2200` only wrong swipe flash. `#FFFFFF` readable text. No pink/magenta, no orange UI, no green UI, no red except wrong flash, max 2 visible gold elements.

**Implementation order:** Main gameplay layout -> hero word dominance -> one active tile queue (Patch 3 complete) -> press-hold tile behavior (Patch 4 complete) -> UP absorb and RIGHT toss/shatter (Patch 5 complete) -> Master Gate visual overhaul (Patch 6 complete) -> original hidden tile unlock/ghost merge (Patch 7-9, superseded by Patch 23 revised) -> Polly pop-in budget (Patch 10 complete) -> app shell and Vault work -> Patch 23 revised permanent wrong swipes, boss-only gate/mastery/ghost, single mystery tile, non-boss word exit transition (complete) -> Daily Challenge screen (Patch 28B complete) -> database audit + selective masks/traps rewrite.

Hunt 1 â€” GPS Compliant (2 Confidence + 3 Flow + 3 Tension + 3 Panic + 1 Boss)

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
| 12 | CAST | Boss | Polly's word |

Words 1â€”11: no hidden meaning, no gate, no mastery.
CAST: hiddenMeaning 'Molten metal takes shape', hiddenTrap 'Spell gets thrown on you'.

---

## Living Pool Model (Phase 2 â€” design locked)

- Always 12 fresh words from Unmastered Pool
- Mastered words permanently graduate to Vault â€” never in standard run again
- Ghost words get priority placement in difficulty tier
- RUN IT BACK = fresh 12-word draw with ghost priority
- Boss always position 12 â€” one per session
- Daily Challenge = only curated fixed session

---

## Card Deck Tile System (Patch 23 complete)

All tiles for a word arrive simultaneously as a stacked deck. Only the top card is interactive. Wrong swipes are PERMANENT â€" tile flies away, life drains, no retry, no snap-back. Correct and trap-caught tiles remove from deck at 180ms. Wrong tiles remove at 400ms. Deck empty = word complete.

ALL TILES LOOK IDENTICAL UNTIL SWIPED â€" Polly gives nothing away.

Deck entrance: `deckSlamY` spring animation per word (-52 â†' 0).
Depth cards: up to 3 visible at `#2E2870` purple, staggered offsets.
Haunt depth cards: `#130D2A` purple tint.
Zero-feather red tint: `deckRedTint` shifts depth cards to `#2A0808`.

`key={topMask.id}` on top `SwipeMask` forces full remount on card change â€" prevents stale `judgedRef` / frozen input.

---

## Master Gate (Boss-only — auto-opens on perfect boss clear)

Gate is BOSS ONLY. Words 1â€"11 never open the gate.
**wrongSwipeOccurred.current MUST reset to false at start of every new word.**

Boss gate sequence: Last visible tile exits â†’ gate opens only if `wrongSwipeOccurred` is false â†’ ONE mystery tile drops (randomly `hiddenRealMask` or `hiddenTrapMask`, set by `mysteryIsRealRef`) â†’ player judges the tile â†’ correct judgment = MASTERED â†’ wrong judgment = GHOST.

Boss with any wrong swipe on visible masks: gate never opens, word advances silently.

Non-boss completion: deck empty â†’ word exits with scale/fade (1050ms) â†’ `store.completeWord()`. No overlay. No gate.

Mystery correct â†’ MASTERY SEQUENCE:
Hero word crashes center â†’ diagonal MASTER stamp â†’ cracks/energy â†’ Word Core grows/spins â†’ Core shoots to Vault nav icon.

Mystery wrong â†’ GHOST (solid purple border, no dashes, phrase NEVER revealed).

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
| Boss mastered | "Fine. Take it." |
| Boss failed | "Thought so." |

---

## The Word Vault (Player Archive — real data + Ranks implemented)

- Player-owned reclaimed meaning archive, not Polly's cage/lair.
- Trophy room for mastered words, ghost words, hidden discoveries, and local ranks.
- Patch 12A added `app/screens/VaultScreen.tsx` and the `Vault` stack route in `App.tsx`.
- `VaultScreen.tsx` reads real persisted progress from `useGameStore`.
- Progress persistence exists through `masteredWords`, `personalBest`, `runsCompleted`, `recordMastery`, `recordRunComplete`, and `loadProgress`.
- Sections: Mastered Words, Ghost Words, Hidden Meanings, Ranks.
- Ghost Words reads real ghost data.
- Ranks tab is implemented: personal best, rank ladder, progress to next rank, Polly target status, runs completed, and words mastered.
- Rank tiers: D below 8,000; C at 8,000; B at 11,000; A at 14,000; S at 18,000; MASTER at 22,000.
- Empty-state direction: archive/collection language, not cage/prison language.
- Mastery ends with word compressing -> launching to vault nav icon.
- Paywall at word 21: "Vault Full / Unlock unlimited"
- Polly has NO presence in Vault — player's domain only.
- Future daily/friend/global leaderboards are still future. Profile stays inside Settings for MVP.

---

## BUILD STATE — June 13, 2026

Patches 1–28B: complete (see CLAUDE.md for full history)

Patch 29 complete: Live Hunt generation. huntData.json at
assets/data/ (232 words, 208KB). generateHunt() in
app/game/huntGenerator.ts samples fresh GPS arc every run.
createGame() accepts optional session. SESSION fallback preserved.

Patch 30 complete: Game screen visual redesign. Font stack:
Bungee Shade / Barlow Condensed Bold / Lilita One. Hero word
12-layer extrusion at 96/114px. Tile text adjustsFontSizeToFit.
POLLY'S WORD copy locked. Font rollout complete to all screens.

Patch 31 complete: Daily Challenge redesign. 5 rounds, full screen
layout, CLAIM_THRESHOLD -25, font system applied.

Patch 32A complete: Bungee Shade is now wired as the actual hero/boss
word font. `assets/fonts/BungeeShade-Regular.ttf` is registered in
`app.json`, and `FONTS.wordDisplay` / `FONTS.bossWord` both resolve to
`BungeeShade-Regular`. Bebas Neue remains registered for now.

Patch 32B complete: Daily Challenge now truly plays and scores 5 rounds
end-to-end. `buildDailySession()` returns 5 seeded rounds from the existing
Daily pool on a 1, 1, 2, 2, 3 tier curve, and result/share/Home preview copy
counts out of 5. Two shared lives and the 9-candidate board are preserved.

Patch 32B-FIX complete: Daily Challenge now has enough valid seeded pool
content to actually complete 5 rounds. `dailyPool.ts` has 10 entries per
tier, each with exactly 3 meanings and a 9-word candidate board containing
the correct word. `buildDailySession()` validates the board contract and
always returns exactly 5 rounds with deterministic nearby-tier fallback.

Patch 32C complete: Home now uses a Native Bungee Shade POLYWORDS logo
treatment because the image asset route was blocked. `POLY` renders gold,
`WORDS` renders purple, and the mark is a centered no-wrap row with dark
extrusion layers plus subtle gold/purple glow. No downloaded assets.

Patch 32D complete: First Hunt word now uses the same Bungee hero
treatment/render path as later Hunt words from the first frame. `App.tsx`
preloads `BungeeShade-Regular` through the existing font gate before any
screen renders, so word 1 cannot flash a fallback font. No gameplay,
Daily, Hunt generation, scoring, swipe grammar, Master Gate, ghost logic,
SFX, or Home logo behavior changed.

Patch 32E complete: Main Play wrong-swipe feedback is restored to a
sharp premium recoil/flash while preserving permanent tile exit and feather
loss. The heavy full-screen red wash is now a faint blink, the tile uses a
brief translucent wrong accent instead of a flat red slab, and `MaskBoard`
owns the single `trapWrong` cue plus one crisp mistake haptic for wrong
swipes. Daily, Hunt generation, scoring, swipe grammar, Master Gate, ghost
logic, Home logo behavior, and Bungee font loading were not changed.

Patch 32E-STACK complete: Visible meaning-card deck stack restored in
Main Play. `MaskBoard` renders up to two visual-only dark under-card slabs
behind the active tile based on `deckSize`; they have no text, no future
content, and no truth/status hints. The top card remains the only
interactive `SwipeMask`, and permanent tile exit/advancement behavior is
unchanged. Daily was not changed.

Patch 32E-FIX complete: Visual recovery after the first stack patch failed
device sanity. The Main Play deck now uses a narrower active top card with
wider/brighter dark-purple under-card lips so the stack is visibly real
without revealing content. Hero/boss words keep Bungee Shade as the
extrusion/shadow treatment behind a solid `BebasNeue-Regular` foreground
face. Daily cards/results use solid Barlow foreground text with stronger
contrast and line height. Home logo behavior stayed unchanged; only small
supporting copy contrast was raised. No gameplay logic changed.

Pinned:
- Polly redesign: bird-like sprite needed before flight animation.
  Mid-round fly-through + end-of-round perch system designed,
  implementation blocked on asset.

Content pipeline:
- 232 words tiled (1838 tiles). 507 at zero.
- Mask Rewriter V4 in project files for ongoing sessions.
- Regenerate huntData.json when word count reaches 400+.

Next priorities:
1. Content pipeline — run more Mask Rewriter sessions
2. Polly sprite redesign (Pete)
3. Polly flight animation system (after sprite)
4. Daily Challenge result screen polish
5. App Store launch prep

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
â˜ ï¸ Snap-back wrong swipes
â˜ ï¸ Two-tile hidden gate
â˜ ï¸ Ghost/mastery for non-boss words
â˜ ï¸ hiddenEmoji / hiddenTrapEmoji
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
- Haunt slot is position 10 / index 9, never boss position 12
- Wrong swipes are permanent: tile exits, 1 feather lost, no snap-back, no retry
- Gate opens only on boss word perfect clear
- Words 1-11 never open the gate and never show MASTERED/HAUNTED overlays
- MASTERED is boss-only
- GHOST is boss-only
- Boss gate uses one mystery tile, randomly real hidden meaning or hidden trap
- "Thought so." â€” never change
- "BINGO BANGO ZZZZINGO!" spelling â€” never change
- "BINGO BANGO ZZZZINGO!" is rare game/system achievement text only, never Polly dialogue

---

## File Map (Key Files)

```
app/components/MaskBoard.tsx         Main game board â€” primary file
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

*POLYWORDS CONTEXT.md · Pete DiBari · June 13, 2026*
