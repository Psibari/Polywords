# POLYWORDS – CONTEXT.md
### Quick-Reference Session Briefing · June 15, 2026

Paste this at the start of any Claude Code session to restore full context.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds 700+ words in her vault. She set every trap. The player challenges her one word at a time to take the title. Every session is a HUNT – 12 words, a designed difficulty arc, and a boss confrontation at position 12.

**North star:** *"Wait… what? … Shit, that's right."*

**App shell identity:** Home is the arcade lobby / launchpad. Play is the arena. Word Vault is the player's reclaimed meaning archive. Settings is utility for player/account/preferences/about. Profile belongs inside Settings for MVP.

**Golden Pacing System:** `docs/GOLDEN_PACING_SYSTEM.md` is the source of truth for Hunt emotional rhythm, Semantic Snap Rate, future content metadata, and content selection. Target cycle: Recognition + Flow + Tension + Panic + Boss.

**Hidden Truth Rule:** Before a swipe, all ordinary masks are equal. The player must never know whether a mask is real, trap, rare, hidden-worthy, or important before commitment. Truth is revealed only after swiping.

**Polly dialogue bank:** docs/POLLY_DIALOGUE_BANK.md is the source-of-truth bank for future Polly dialogue ideas, approved tone examples, raw seeds, boss-word taunts, ghost/system copy, and lines to avoid.

---

## Stack

```
Expo SDK · React Native · TypeScript strict · Zustand+immer
React Native Animated API (Reanimated = SwipeMask.tsx ONLY, frozen)
Expo Haptics · Expo AV (→ expo-audio pending) · Expo Router
Fonts: Bungee Shade (hero word), Barlow Condensed Bold (UI), Lilita One (Polly speech)
Windows dev: forward-slash paths only
```

---

## Colors (Strict)

```
#1A1830  Background (always)
#F5C842  Gold – score, reward, gate, boss word (MAX 2 on screen)
#7B2D8B  Purple – trap shards, ghost border, rare events
#9B2D6B  Rose – shard gradient partner
#4CAF50  Polly Green – Polly mascot ONLY
#0F0D2A  Deep Dark – Master Gate background only
#CC2200  Wrong Flash – wrong swipe only, never decoration
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

## Scoring System (Patch 33 — locked)

| Action | Points | Notes |
|---|---|---|
| Correct real (UP) | 100 × chainMultiplier | |
| Correct rare real (UP) | 300 × chainMultiplier | isRare flag on mask |
| Correct trap (RIGHT) | 50 × chainMultiplier | |
| Boss correct real | 200 × chainMultiplier | 2× applied |
| Boss correct trap | 100 × chainMultiplier | 2× applied |
| Boss mystery tile correct | 600 × chainMultiplier | submitBossMastery() — chain-scaled climax |
| Wrong swipe | 0 — feather lost, combo reset | |
| Ghost tile correct (UP) | +250 flat | addBonusScore — bonus on top of word |

Chain multiplier: starts 1.0, +0.5 every 3 consecutive correct swipes, caps at 3.0. Resets on any wrong swipe.
Score floats show actual earned points — mirrors engine formula including boss 2×.
Feather milestones: 8,000 and 16,000 pts restore 1 feather.
Polly target: 15,000 pts. Rank scale: D/8k · C/8k · B/11k · A/14k · S/18k · MASTER/22k.

Dead / removed: revealHidden() removed. hiddenFound in WordResult removed. pollyTrigger 'hiddenReveal' replaced by 'bossMastery'.

---

## Locked Play Screen Design

POLYWORDS is a word arena, not a quiz list. The hero word is the boss, the active mask tile is the challenger, the Master Gate is Polly's locked cage/vault, and the player steals mastery one swipe at a time.

**Hierarchy:** HERO WORD -> ACTIVE MASK TILE -> HUD / SCORE / FEATHERS / STREAK -> POLLY POP-IN ONLY.

**Polly pop-in design:** Patch 10 complete. Polly is the opponent, not a friendly celebration mascot. She is not permanent on the gameplay screen. She appears only as a pop-in: 1 time during a big moment in a word, always at end of round win/loss.

**Gameplay layout:** Top quiet HUD for score, feathers, streak. Giant hero word top-center as UP absorb target. Empty middle swipe lane. One active mask tile on top of tile deck in lower-middle thumb zone. Clear right-side shatter lane for trap flicks. Master Gate below tile. Polly pops bottom-left on big moments.

**Hero word:** Dominates screen, sits top-center during normal play, absorbs correct UP swipes, and crashes down to center during MASTERED celebration.

**Active mask tile design:** One active tile at a time. Large, premium, tactile, readable. Patch 32E-STACK complete: visible deck stack shows up to 2 dark under-card slabs beneath the active card (no text, no truth hints). Only the top card is interactive.

**Swipe motion:** UP claims real meaning; RIGHT rejects trap. No left swipe and no tap-submit. Correct UP pulls into hero word, shrinks/fades near impact. Correct RIGHT flings into shatter lane with rotation/fade and 18 purple/rose polygon shards.

**Master Gate:** Text is {POLLY's WORD). It belongs to Polly, not the player. It is a low board bird cage / vault hybrid with subtle tension, `#0F0D2A` surface, faint cage bars, small lock, and quiet breathing pulse. Gate is BOSS ONLY.

**Master Gate unlock:** Boss word only. Last real visible boss tile absorbs into hero word -> gate border charges gold -> cage bars split slightly left/right -> lock snaps open -> one mystery tile drops into the active tile position (randomly real hidden meaning or hidden trap).

**MASTERED celebration design:** Boss mystery tile judged correctly -> hero word crashes down center -> diagonal MASTER stamp slams over word -> word cracks open -> Word Core jumps out -> Core grows/glows/spins center-screen -> Core shoots to Vault nav icon -> Vault impact bloom + heavy haptic.

**BINGO BANGO ZZZZINGO! rule:** This is not Polly dialogue. Use only as a rare GAME/SYSTEM achievement stinger when a Boss Word is fully mastered and the Word Core is vaulted. It fires one word at a time with hard entrance for each word, each word lands with a BOOM-style impact. Rhythm: BINGO → BANGO → ZZZZINGO! (ZZZZINGO! gets biggest impact).

**Word Core:** Mastery trophy. It does not go into the Master Gate. It belongs in the player's Vault page. The Master Gate is Polly's cage, not storage.

**Ghost loss design:** GHOST is boss-only. Wrong boss mystery judgment loses 1 feather, the tile exits permanently, and HAUNTED appears after the boss failure beat. No two hidden tiles merge. Ghost tile styling: solid purple border, no dashes, phrase NEVER revealed, "MASTER THE WORD" text.

**Ghost return / Haunt Words design:** Ghosted boss words return late in future Hunts at position 10 / index 9, never replacing Boss Word 12. Entrance copy: Guess who's back. If mastered: HAUNT BROKEN. If failed again: ghost remains for future runs.

**Feathers:** Hearts are replaced by Feathers. Player normally has 5. Wrong swipe plucks 1. 0 feathers ends run. Score milestones exist at 8,000 and 16,000 points. Crossing a milestone can restore 1 feather (max reserve = 1).

Current HUD: `GameScreen.tsx` renders five custom feather slots plus a separate reserve feather. `+1 FEATHER` milestone feedback exists. Engine/store state may still be named `lives`; do not rename.

**Score target/rank design:** Local personal best, Polly target status, Hunt rank ladder, and Vault Ranks display are implemented. Score does not replace mastery. Word Cores are permanent mastery records. Polly's target score: 15,000 pts (MVP fixed). Rank scale: D below 8,000 / C at 8,000 / B at 11,000 / A at 14,000 / S at 18,000 / MASTER at 22,000.

**Color rules:** `#1A1830` background. `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core, and restrained Vault stat/title accents. `#7B2D8B` for UI/gate/shards/Vault frames. `#9B2D6B` rose for shard/ghost accents. `#0F0D2A` deep dark for vault surfaces. `#CC2200` red for wrong flash only. No pink/magenta, no orange UI, no green UI, no red except wrong flash. Gold max 2 visible elements where practical.

Hunt 1 – GPS Compliant (2 Confidence + 3 Flow + 3 Tension + 3 Panic + 1 Boss)

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

Words 1–11: no hidden meaning, no gate, no mastery.
CAST: hiddenMeaning 'Molten metal takes shape', hiddenTrap 'Spell gets thrown on you'.

---

## Living Pool Model (Phase 2 – design locked)

- Always 12 fresh words from Unmastered Pool
- Mastered words permanently graduate to Vault – never in standard run again
- Ghost words get priority placement in difficulty tier
- RUN IT BACK = fresh 12-word draw with ghost priority
- Boss always position 12 – one per session
- Daily Challenge = only curated fixed session

---

## Card Deck Tile System (Patch 23 complete)

All tiles for a word arrive simultaneously as a stacked deck. Only the top card is interactive. Wrong swipes are PERMANENT – tile flies away, life drains, no retry, no snap-back. Correct and caught-trap swipes remove the card and advance to next.

ALL TILES LOOK IDENTICAL UNTIL SWIPED – Polly gives nothing away.

Deck entrance: `deckSlamY` spring animation per word (-52 → 0).
Depth cards: up to 3 visible at `#2E2870` purple, staggered offsets.
Haunt depth cards: `#130D2A` purple tint.
Zero-feather red tint: `deckRedTint` shifts depth cards to `#2A0808`.

`key={topMask.id}` on top `SwipeMask` forces full remount on card change – prevents stale `judgedRef` / frozen input.

---

## Master Gate (Boss-only — auto-opens on perfect boss clear)

Gate is BOSS ONLY. Words 1–11 never open the gate.
**wrongSwipeOccurred.current MUST reset to false at start of every new word.**

Boss gate sequence: Last visible tile exits → gate opens only if `wrongSwipeOccurred` is false → ONE mystery tile drops (randomly `hiddenRealMask` or `hiddenTrapMask`, set by `mysteryTileIsReal` at word start).

Boss with any wrong swipe on visible masks: gate never opens, word advances silently.

Non-boss completion: deck empty → word exits with scale/fade (1050ms) → `store.completeWord()`. No overlay. No gate.

Mystery correct → MASTERY SEQUENCE:
Hero word crashes center → diagonal MASTER stamp → cracks/energy → Word Core grows/spins → Core shoots to Vault nav icon.

Mystery wrong → GHOST (solid purple border, no dashes, phrase NEVER revealed).

---

## Polly Hunt System (Design locked – not yet built)

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

## BUILD STATE — June 15, 2026

**Latest completed patch: Patch 33 (Scoring system overhaul)**

Patches 1–28B: complete (see CLAUDE.md for full history)

**Patch 29** complete: Live Hunt generation. huntData.json at assets/data/ (232 words, 208KB). generateHunt() in app/game/huntGenerator.ts samples fresh GPS arc every run.

**Patch 30** complete: Game screen visual redesign. Font stack: Bungee Shade / Barlow Condensed Bold / Lilita One. Hero word 12-layer extrusion at 96/114px. Tile text adjustsFontSizeToFit. POLLY'S WORD copy locked.

**Patch 31** complete: Daily Challenge redesign. 5 rounds, full screen layout, CLAIM_THRESHOLD -25, font system applied.

**Patch 32A** complete: Bungee Shade wired as the real hero/boss word font. `assets/fonts/BungeeShade-Regular.ttf` registered in `app.json`.

**Patch 32B** complete: Daily Challenge plays 5 rounds end-to-end. `buildDailySession()` returns 5 seeded rounds on 1,1,2,2,3 tier curve.

**Patch 32B-FIX** complete: Daily Challenge content bootstrap. `dailyPool.ts` has 10 entries per tier, each with 3 meanings and 9-word candidate board.

**Patch 32C** complete: Home uses Native Bungee Shade POLYWORDS logo (gold POLY + purple WORDS, no image asset).

**Patch 32D** complete: First Hunt word uses Bungee hero treatment from frame 1. `App.tsx` preloads `BungeeShade-Regular` before any screen renders.

**Patch 32E** complete: Main Play wrong-swipe feedback restored (sharp premium recoil/flash). Heavy full-screen red wash reduced to faint blink. MaskBoard owns single `trapWrong` cue + crisp mistake haptic.

**Patch 32E-STACK** complete: Visible meaning-card deck stack restored in Main Play. MaskBoard renders up to 2 dark under-card slabs; no text, no truth hints. Top card only interactive.

**Patch 32E-FIX** complete: Visual recovery. Main Play deck uses narrower active top card with wider/brighter dark-purple under-card lips. Hero/boss words keep Bungee extrusion behind solid BebasNeue foreground face. Daily uses solid Barlow text. No gameplay logic changed.

**Patch 33** complete: Scoring system overhaul. `submitBossMastery()` added to engine (600 × chainMultiplier, feather-milestone aware, sets `pollyTrigger: 'bossMastery'`). `revealHidden()` removed. `hiddenFound` removed from `WordResult`. `pollyTrigger 'hiddenReveal'` replaced by `'bossMastery'` throughout. Score floats in `MaskBoard` now mirror the engine formula — streak captured before store action, boss 2× applied where applicable. `tsc --noEmit` exits 0.

**Pinned:**
- Polly redesign: bird-like sprite needed before flight animation. Mid-round fly-through + end-of-round perch system designed, implementation blocked on asset.

**Content pipeline:**
- 232 words tiled (1838 tiles). 507 at zero.
- Mask Rewriter V4 in project files for ongoing sessions.
- Regenerate huntData.json when word count reaches 400+.

**Next priorities:**
1. Content pipeline — run more Mask Rewriter sessions
2. Adaptive audio / music system
3. Polly sprite redesign (Pete)
4. Polly flight animation system (after sprite)
5. Daily Challenge result screen polish
6. App Store launch prep

---

## Cut List (Never Suggest These)

```
☑️ Garden (dead – Vault replaced it)
☑️ Simultaneous tile render (dead – one-at-a-time queue)
☑️ Switchback / Phrase Break / SlangDropScreen in main session
☑️ Left swipe / tap interactions
☑️ Dashed borders / pink / magenta colors
☑️ Red for text or decoration
☑️ Visual tells on tiles before swipe
☑️ Reanimated outside SwipeMask.tsx
☑️ Rectangle/square particles
☑️ RATTLED. in any color except white
☑️ Circular Polly crop
☑️ More than 2 gold elements simultaneously
☑️ Snap-back wrong swipes
☑️ Two-tile hidden gate
☑️ Ghost/mastery for non-boss words
☑️ hiddenEmoji / hiddenTrapEmoji
☑️ revealHidden() / hiddenFound in WordResult / pollyTrigger 'hiddenReveal' / addBonusScore(300) in triggerMastered — all removed Patch 33
```

---

## Non-Negotiable Rules

- tsc --noEmit must exit 0 before device test
- One prompt, one concern – surgical always
- useNativeDriver: true → transform/opacity only
- useNativeDriver: false → height/margin/backgroundColor only
- Never chain both drivers on same Animated.Value
- setTimeout between phases – never .start() callbacks
- Ghost wordId = WORD STRING always (e.g. "BARK") not stepIndex
- Boss position 12 always – non-negotiable
- Haunt slot is position 10 / index 9, never boss position 12
- Wrong swipes are permanent: tile exits, 1 feather lost, no snap-back, no retry
- Gate opens only on boss word perfect clear
- Words 1-11 never open the gate and never show MASTERED/HAUNTED overlays
- MASTERED is boss-only
- GHOST is boss-only
- Boss gate uses one mystery tile, randomly real hidden meaning or hidden trap
- "Thought so." – never change
- "BINGO BANGO ZZZZINGO!" spelling – never change
- "BINGO BANGO ZZZZINGO!" is rare game/system achievement text only, never Polly dialogue
- Boss mastery scoring uses submitBossMastery() — never addBonusScore() for this event
- Score floats must mirror engine formula — read streak before store action, apply boss 2× where applicable

---

## File Map (Key Files)

```
.claude/WORKFLOW.md             👈 Claude multi-session workflow (NEW)
CLAUDE.md                       👈 Ground truth game design + patches
CONTEXT.md (this file)          👈 Quick-ref + build state

app/components/MaskBoard.tsx    Main game board – primary file
app/components/SwipeMask.tsx    Tile + swipe physics (Reanimated – frozen)
app/components/MasterGateTile.tsx    Gate: locked / unlock / boss mystery tile
app/components/PollyCard.tsx    Polly sprite + speech
app/components/PollyController.tsx   Polly trigger system
app/game/session.ts             12-word session data
app/game/polyRunEngine.ts       Game state engine
app/game/types.ts               All TypeScript types
app/store/useGameStore.ts       Zustand store
app/screens/GameScreen.tsx      Main game screen
app/screens/ResultsScreen.tsx   End-of-run results
app/screens/DailyChallengeScreen.tsx Daily Challenge screen
app/game/dailyChallengeEngine.ts     Daily session builder, engine functions, result builder
app/game/dailyPool.ts           Daily word pool (tiered)
app/utils/SoundEngine.ts        WAV synthesis
assets/brand/polywords-logo.png Production Home logo layer
assets/home/home-hero-bg.png    Production Home cinematic background layer
app/screens/HomeScreen.tsx      Home lobby: asset-layered jungle-neon menu with premium glass/gold controls
app/screens/GameScreen.tsx      Play HUD shell: compact dark glass arcade status panel
app/components/MaskBoard.tsx    Play arena shell: darkened Home background layer, hero word, tile stack, gate, Polly speech
Play active chain              Home/BottomNav -> GameScreen -> TopBar + MaskBoard -> SwipeMask; visible Master Gate is inline in MaskBoard
tools/content/mask-rewriter     Local-only content rewrite/audit tool; never wire into player app
```

---

*POLYWORDS CONTEXT.md · Pete DiBari · June 15, 2026*
