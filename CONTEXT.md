# POLYWORDS â€” CONTEXT.md
### Quick-Reference Session Briefing Â· June 9, 2026

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
| Wrong UP | Claimed a trap | Word REJECTS tile â€” shakes, tile exits downward |
| Wrong RIGHT | Rejected real meaning | Tile rubber-bands back, buzzes red, dissolves |

**No left swipe. No tap. No tap-and-submit. Swipe only. Always.**

---

## Current Session (12 words â€” test harness)

## Locked Play Screen Design

POLYWORDS is a word arena, not a quiz list. The hero word is the boss, the active mask tile is the challenger, the Master Gate is Polly's locked cage/vault, and the player steals mastery one swipe at a time.

**Hierarchy:** HERO WORD -> ACTIVE MASK TILE -> MASTER GATE -> HUD / SCORE / FEATHERS / STREAK -> POLLY POP-IN ONLY.

**Polly pop-in design:** Patch 10 complete. Polly is the opponent, not a friendly celebration mascot. She is not permanent on the gameplay screen. She appears only as a pop-in: 1 time during a big moment in a word round, always at end-of-round win/loss, entering from bottom-left. She never blocks the active tile, right shatter lane, Master Gate, or hidden tiles. Sprite size is now 160 with a larger bottom-left opponent presentation. Normal mastery opponent line: "That was mine." Boss mastery opponent line: "Fine. Take it." Normal ghost failure: "Not yours yet." Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!"

**Gameplay layout:** Top quiet HUD for score, feathers, streak. Giant hero word top-center as UP absorb target. Empty middle swipe lane. One active mask tile in lower-middle thumb zone. Clear right toss/shatter lane. MASTER THE WORD gate low on board above nav safe area. Bottom nav is not visible during active gameplay. Patch 3 implemented the one-active visible mask tile queue.

**Hero word:** Dominates screen, sits top-center during normal play, absorbs correct UP swipes, and crashes down to center during MASTERED celebration.

**Active mask tile design:** One active tile at a time. Large, premium, tactile, readable. Patch 16 complete: the active mask/trap tile is the top slab in a concealed heavy POLYWORDS meaning-tile stack, not a paper-card deck. Up to 2 under-tiles may imply depth beneath it, but they must stay unreadable and must never reveal truth/type/status. Hidden Truth Rule remains sacred. Press-hold wakes tile, gives haptic feedback, and feels like gripping/pulling a heavy slab off the stack. The active tile has heavier slab/bevel treatment; pre-swipe masks feel solid. Trap identity as brittle false-meaning glass appears only after RIGHT commitment/shatter; real meanings stay weighty and absorb upward when claimed. Scoring, swipe grammar, one-active queue, resolution, hidden release, gate logic, Polly timing/budget, and navigation unchanged.

Patch 17 complete: gameplay arena device-sanity polish only. HUD chrome is slightly slimmer, under-tile slab offsets are cleaner/heavier without revealing text or truth/type/status, right shatter-lane marker is quieter, Master Gate dock has more breathing room, and gameplay gold was normalized to `#F5C842`. Mechanics, scoring, swipe grammar, one-active queue, tile resolution, hidden release, Master Gate logic, Polly timing/budget, navigation, Golden Pacing, and content data unchanged.

**Swipe motion:** UP claims real meaning; RIGHT rejects trap. No left swipe and no tap-submit. Patch 5 tuned the single-tile arena motion: correct UP pulls harder into the hero word, shrinks/fades near impact, and triggers the existing word absorb pulse; correct RIGHT traps fling farther into the right shatter lane with stronger rotation, shrink, fade, and a larger purple/rose burst; wrong RIGHT on a real meaning visibly fails with `#CC2200` wrong flash, reject wobble, bounce-back, fade/collapse, and existing feather loss.

**Master Gate:** Text is MASTER THE WORD. It belongs to Polly, not the player. It is a low board bird cage / vault hybrid with subtle tension, `#0F0D2A` surface, faint cage bars, small lock, and quiet gold charge only when earned. The player's Vault is never on the game board; it is a nav/page destination.

**Master Gate unlock:** Last real visible tile absorbs into hero word -> gate border charges gold -> cage bars split slightly left/right -> lock snaps open -> two hidden tiles fly up into active tile position.

**MASTERED celebration design:** Patch 8 complete. Hidden tiles judged correctly -> hero word crashes down center -> diagonal MASTER stamp slams over word -> word cracks open -> Word Core jumps out -> Core grows/glows/spins center-screen -> Core shoots toward Vault nav icon. Normal mastery ends with opponent Polly reaction, not `BINGO BANGO ZZZZINGO!`. Boss mastery may additionally trigger the rare game/system `BINGO BANGO ZZZZINGO!` stinger after vaulting.

**BINGO BANGO ZZZZINGO! rule:** This is not Polly dialogue. Use only as a rare GAME/SYSTEM achievement stinger when a Boss Word is fully mastered and the Word Core is vaulted. It fires one word at a time with BOOM-style impacts: BINGO -> BANGO -> ZZZZINGO!, with `ZZZZINGO!` biggest.

**Word Core:** Mastery trophy. It does not go into the Master Gate. It belongs in the player's Vault page. The Master Gate is Polly's cage, not storage.

**Ghost loss design:** Patch 9 complete. Wrong hidden/master swipe makes failed tile leave, remaining hidden tile stay, failed tile glitch and lose substance, failed tile pulled back, both hidden tiles merge, hero word flickers dull, ghostly presence fades into merged tile, and Ghost Tile forms with MASTER THE WORD / From [WORD]. Microcopy: You left me behind.

**Ghost return / Haunt Words design:** Ghosted words return late in future Hunts, best at word 10 or 11, never replacing Boss Word 12. Entrance copy: Guess who's back. If mastered: Haunt broken. If failed again: STILL HAUNTED. Returning Haunt failure taunt: "BBBLAAAAHHAHAHA!" Haunt return is locked but not implemented yet.

**Feathers:** Hearts are replaced by Feathers. Player starts with 5. Wrong swipe plucks 1. 0 feathers ends run. Score milestones can restore a Life Feather. If full, player can hold 1 reserve feather max.

Current HUD: `GameScreen.tsx` renders five custom feather slots while engine/store state remains named `lives`. Reserve feathers and score milestone restore are not implemented yet.

**Score target/rank design:** Competition system for personal bests, Polly target score, Hunt rank, and future daily/friend/global rankings. Score does not replace mastery. Word Cores are permanent mastery trophies. The score target/rank system is pending.

**Color rules:** `#1A1830` background. `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core, and restrained Vault stat/title accents. `#7B2D8B` for UI/gate/shards/Vault frames. `#9B2D6B` for trap/ghost shard accents and Ghost Words accents. `#4CAF50` only Polly character. `#0F0D2A` for Master Gate locked surface and player Vault archive/card surfaces. `#CC2200` only wrong swipe flash. `#FFFFFF` readable text. No pink/magenta, no orange UI, no green UI, no red except wrong flash, max 2 visible gold elements.

**Implementation order:** Main gameplay layout -> hero word dominance -> one active tile queue (Patch 3 complete) -> press-hold tile behavior (Patch 4 complete) -> UP absorb and RIGHT toss/shatter (Patch 5 complete) -> Master Gate visual overhaul (Patch 6 complete) -> hidden tile unlock (Patch 7 complete) -> MASTERED celebration (Patch 8 complete) -> ghost merge loss (Patch 9 complete) -> Polly pop-in budget (Patch 10 complete) -> database audit + selective masks/traps rewrite -> Word Vault page shell (Patch 12A complete) -> Home arcade lobby shell (Patch 12C complete) -> Settings/Profile shell (Patch 12D complete) -> bottom navigation app shell (Patch 12E complete) -> feathers and score targets -> Haunt Word return system -> Ranks page and real data wiring.

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
- A guarded 650ms delay prevents duplicate advances from repeated renders and lets Patch 5 motion finish cleanly.
- Scoring, swipe grammar, current Master Gate logic, Ghost tile behavior, hidden tile flow, Polly logic, and store architecture are preserved.
- Patch 4 press-hold polish and Patch 5 UP absorb / RIGHT toss-shatter tuning are complete.
- Proper returning Haunt placement remains pending.

---
## Master Gate (Auto-opens on perfect clear)

**wrongSwipeOccurred.current MUST reset to false at start of every new word.**

Sequence: Last tile absorbs â†’ border charges clockwise â†’ lock cracks â†’ gate opens â†’ two split tiles drop.

Split tiles: real hidden meaning (UP) + hidden trap (RIGHT).

Both correct â†’ MASTERY SEQUENCE:
Hero word crashes center â†’ diagonal MASTER stamp â†’ cracks/energy â†’ Word Core grows/spins â†’ Core shoots to Vault nav icon.

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
| Boss mastered | "Fine. Take it." |
| Boss failed | "Thought so." |

---

## The Word Vault (Player Archive — shell implemented)

- Player-owned reclaimed meaning archive, not Polly's cage/lair.
- Trophy room for mastered words, ghost words, hidden discoveries, and future stats.
- Patch 12A added `app/screens/VaultScreen.tsx` and the `Vault` stack route in `App.tsx`.
- Current page uses static placeholder data only; no real save/progress state wiring yet.
- Sections: Mastered Words, Ghost Words, Hidden Meanings, Stats.
- Empty-state direction: archive/collection language, not cage/prison language.
- Mastery ends with word compressing -> launching to vault nav icon.
- Paywall at word 21: "Vault Full / Unlock unlimited"
- Polly has NO presence in Vault — player's domain only.
- Real Vault data wiring and future Ranks work are still pending. Profile stays inside Settings for MVP.

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
- Patch 6 complete: Master Gate cage/vault visual overhaul in `app/components/MaskBoard.tsx`; removed emoji lock, added custom React Native View lock, rebuilt locked gate as darker `#0F0D2A` cage/vault mechanism, reduced locked-state gold, added faint purple bars/ribs/bolts/depth/layered doors, kept exact `MASTER THE WORD` text in readable white, shortened gate to 64px, preserved perfect-clear/unlock flow, door split, hidden tile flow, scoring, swipe grammar, active queue, ghost logic, Polly logic, and store architecture. `npx.cmd tsc --noEmit` passed.
- Patch 7 complete: hidden tiles release into active play band.
  - Changed `app/components/MaskBoard.tsx` and `app/components/SwipeMask.tsx`.
  - Hidden tiles release after gate unlock into the active tile band, not the gate area.
  - First hidden tile rises from the gate offset and becomes swipeable only after landing.
  - Second hidden tile starts release 150ms after the first tile starts releasing for quick "bop-bop" timing.
  - Each tile becomes swipeable only after its own landing animation finishes.
  - Real hidden tile uses full gold border, warm cream text, and `#0F0D2A` surface.
  - Hidden trap tile uses 80% gold border, white text, and `#0F0D2A` surface.
  - Hidden tiles reuse `SwipeMask`, preserving press-hold, UP/RIGHT swipes, absorb, wrong flash, and trap shatter.
  - Wrong hidden swipes call `submitWrongSwipe` and lose a feather.
  - Old hidden-wrong ghost placeholder rendering was removed from this path.
  - Scoring model, swipe grammar, one-active visible queue, gate unlock/perfect-clear logic, and ghost/store/Polly architecture preserved.
  - Reanimated stays in `SwipeMask.tsx`; hidden release motion uses React Native Animated in `MaskBoard.tsx`.
  - `npx.cmd tsc --noEmit` passed.
  - Device sanity passed.
- Patch 8 complete: MASTERED celebration rewrite implemented.
  - Changed `app/components/MaskBoard.tsx` and `app/hooks/usePollyAnimator.ts`.
  - Hero word crashes toward center with impact after hidden tiles resolve correctly.
  - Diagonal MASTER stamp slams over the word.
  - Word cracks open, Word Core appears, grows, glows, spins, then shoots toward Vault nav icon.
  - Normal mastery does not trigger `BINGO BANGO ZZZZINGO!`.
  - Boss mastery may trigger rare game/system stinger: BINGO → BANGO → ZZZZINGO!
  - `BINGO BANGO ZZZZINGO!` is not Polly dialogue.
  - Normal mastery Polly opponent line: "That was mine."
  - Boss mastery Polly opponent line: "Fine. Take it."
  - `npx.cmd tsc --noEmit` passed. Device sanity passed.
- Patch 9 complete: Ghost merge loss sequence implemented.
  - Changed `app/components/MaskBoard.tsx` and `app/hooks/usePollyAnimator.ts`.
  - Wrong hidden/master swipes trigger full ghost birth sequence instead of old placeholder.
  - Failed hidden tile glitches, loses opacity/substance, gets pulled back.
  - Remaining hidden tile merges with failed tile.
  - Hero word flickers dull/lifeless during merge.
  - Ghost Tile forms: "MASTER THE WORD" / "From [WORD]".
  - Microcopy appears: "You left me behind."
  - Polly opponent line on hidden/master failure: "Not yours yet."
  - `npx.cmd tsc --noEmit` passed. Device sanity passed.
- Patch 10 complete: Polly pop-in budget and larger opponent presentation implemented.
  - Changed `app/hooks/usePollyAnimator.ts` and `app/components/MaskBoard.tsx`.
  - Polly is no longer rendered permanently during ordinary gameplay.
  - Polly render is conditional on `pollyPopInVisible`.
  - Added `pollyPopInVisible` state/ref.
  - Added `pollyEnterAnim` and `pollyPopInStyle` for enter/exit slide.
  - Added `pollyHideTimerRef` cleanup on unmount.
  - Added `popInCountRef` for per-word budget.
  - `tryMidRoundPopIn()` silently skips if one mid-round pop-in was already used for the word.
  - `endOfRoundPopIn()` always fires for round-end events.
  - Wrong event reacts without consuming budget if Polly is already visible; otherwise it tries the budget.
  - `hesitation6s`/`hesitation9s` only update speech if Polly is already visible and do not summon a new pop-in.
  - `oneHeartLeft` / one-feather-left critical warning still fires as a special urgent event.
  - `wordEntry`/`switchbackEntry` reset `popInCountRef`.
  - `MaskBoard.tsx` applies both `pollyPopInStyle` and `pollyAnimatedStyle`: outer `Animated.View` handles enter/exit; inner `Animated.View` handles reaction animation.
  - Polly pop-in size increased from 80 to 160.
  - Polly remains bottom-left.
  - Speech bubble repositioned above/above-right of Polly: `bottom: 186`, `left: 78`, `maxWidth: 210`, with slightly larger text/padding.
  - Polly now reads as a larger opponent reaction character, not a small sticker.
  - Non-gate perfect completion now fires `cleanSweep` end-of-round pop-in.
  - Existing opponent lines preserved: "That was mine." / "Fine. Take it." / "Not yours yet." / "BBBLAAAAHHAHAHA!"
  - `BINGO BANGO ZZZZINGO!` remains game/system stinger only and is not Polly dialogue.
  - Scoring, swipe grammar, active visible queue, Master Gate, hidden tile release, Patch 8 mastery celebration, and Patch 9 ghost merge sequence unchanged.
  - `npx.cmd tsc --noEmit` passed.
  - Device sanity passed.
- Content tool added: local POLYWORDS Mask Rewriter at `tools/content/mask-rewriter`.
  - Local internal tooling only, not player-facing gameplay code.
  - React/Vite frontend plus Express server.
  - `npm.cmd run dev` starts backend `http://localhost:8787` and frontend `http://localhost:5173`.
  - Server endpoint: `POST http://localhost:8787/api/rewrite-batch`.
  - Uses Anthropic through `ANTHROPIC_API_KEY` in `tools/content/mask-rewriter/.env`.
  - `.env`, real API keys, and generated CSVs must never be committed.
  - `.env.example` is placeholder-only and includes `TEST_MODE=true`.
  - Generated output is draft-only and requires human audit before any database import.
  - Supports Test Batch, Specific Words, Full Loaded Database with confirmation, creativity controls, Fresh rerun, Tweak Notes, CSV word source import, and audit columns `AUDIT STATUS` / `AUDIT ISSUES`.
- Patch 12A complete: Word Vault screen shell added at `app/screens/VaultScreen.tsx`.
  - Word Vault is the player's reclaimed meaning archive, distinct from Polly's Master Gate cage/vault.
  - It uses static placeholder data only; real Vault data wiring remains pending.
- Patch 12B complete: Golden Pacing System documented at `docs/GOLDEN_PACING_SYSTEM.md`.
  - Semantic Snap Rate is the primary content success metric.
  - Hidden Truth Rule is sacred.
  - Full pacing automation must not be implemented until metadata/test words exist.
- Patch 12C complete: Home screen rebuilt as polished arcade lobby with PLAY, Daily Challenge placeholder, Vault preview, and Continue Run placeholder.
- Patch 12D complete: Settings/Profile shell added. Profile belongs inside Settings for MVP and should not be a bottom nav tab. Settings rows are static placeholders.
- Patch 12E complete: Bottom navigation shell added with Home / Play / Vault / Settings. Nav is visible outside active gameplay only and hidden on `GameScreen`. Play uses `startGame()` then `navigation.navigate('Game')`.
- Patch 12F complete: Bottom nav spacing and active-state polish. Home, Vault, and Settings use bottom padding so content clears the dock. Play remains a center action but no longer looks permanently selected.
- Patch 13 complete: active Polly dialogue refreshed in `app/hooks/usePollyAnimator.ts`, `app/screens/ResultsScreen.tsx`, and `app/game/session.ts` so she reads as a smug polysemous word thief/opponent instead of a friendly helper. Pop-in budget/timing and dormant legacy dialogue paths unchanged.
- Patch 15 complete: premium gameplay screen shell polish in GameScreen.tsx and MaskBoard.tsx; HUD, hero stage, active tile arena frame, and Master Gate dock were visually strengthened with no gameplay, swipe, queue, scoring, nav, Polly timing, or gate logic changes.
- Patch 16 complete: heavy active tile stack and weighted peel polish in MaskBoard.tsx and SwipeMask.tsx. Active mask/trap tile is the readable top slab above up to 2 concealed under-tiles; under-tiles are unreadable and truth-hidden. Press-hold feels like gripping/pulling a heavy slab. Active tile has heavier bevel/slab treatment. Trap brittleness is revealed only after RIGHT shatter; real meanings remain weighty and absorb upward. Scoring, swipe grammar, one-active queue logic, tile resolution, hidden release, Master Gate logic, Polly timing/budget, and navigation unchanged.
- Patch 17 complete: device sanity polish for gameplay arena in GameScreen.tsx and MaskBoard.tsx. Slimmed HUD chrome, cleaned/hefted concealed under-tile slab offsets, quieted the right shatter-lane marker, added Master Gate dock breathing room, and normalized gameplay gold to `#F5C842`. Mechanics, scoring, swipe grammar, one-active queue, tile resolution, hidden release, Master Gate logic, Polly timing/budget, navigation, Golden Pacing, and content data unchanged.

Remaining pending:
Future content lane: **Database audit + selective masks/traps rewrite using the local Mask Rewriter tool.**

- Content quality lane, not a gameplay code patch.
- Use `tools/content/mask-rewriter` for draft generation only; never wire it into the player-facing app.
- Analyze the word database.
- Keep strong entries.
- Rewrite weak masks/traps.
- Improve hidden meanings.
- Add gameplay quality notes/tags where useful.
- Do not rewrite every entry blindly.
- Keep strong masks and sharpen weak masks.
- Replace traps that feel fake, random, too easy, too vague, too dictionary-like, or not tempting.
- Maintain POLYWORDS style:
  - Real Meaning Masks: actual meanings, compact, creative, recognizable, not flat.
  - Trap Masks: tempting nearby decoys, not random.
  - Hidden/Rare Masks: real overlooked meanings that create discovery.
  - Mask/trap text should be 2-4 words where possible, punchy and readable.
  - Avoid dictionary-definition tone.

Other remaining work:
1. Haunt Word return system: late Hunt return at word 10 or 11, never Boss 12, Guess who's back. / Haunt broken. / STILL HAUNTED / "BBBLAAAAHHAHAHA!".
2. Score target/rank system for personal best, Polly target, Hunt rank, future daily/friend/global rankings.
3. Life Feather milestone/reserve system: UI feathers exist; score milestone restore and 1 reserve feather are not implemented yet.
4. Word Vault real data wiring plus future Ranks work.
5. `expo-av` to `expo-audio` migration.

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
- "BINGO BANGO ZZZZINGO!" spelling â€” never change
- "BINGO BANGO ZZZZINGO!" is rare game/system achievement text only, never Polly dialogue

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
tools/content/mask-rewriter          Local-only content rewrite/audit tool; never wire into player app
```

---

*POLYWORDS CONTEXT.md Â· Pete DiBari Â· June 9, 2026*
