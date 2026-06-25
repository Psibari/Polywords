# POLYWORDS — CHANGELOG
### Full patch history, moved out of CLAUDE.md to keep the always-loaded context file lean.

This file is historical record only. It is not auto-loaded into every Claude Code session — read it on demand when patch history/provenance is actually needed. `CLAUDE.md` reflects only the current state of the game; this file explains how it got there.

---

## App Shell History

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
- New file `app/screens/DailyChallengeScreen.tsx`: identify-the-word Daily mode, originally introduced before the later 5-round redesign. Three meanings are shown in a card; shuffled candidate word tiles are stacked using the same `SwipeMask` deck system as the main arena. UP claims the correct word, RIGHT rejects a distractor. Two shared lives span the Daily. Results overlay shows title (WORD MASTER / SHARP / SURVIVED / HAUNTED), solved/missed pills per word, and a native Share sheet.
- `App.tsx` gained `Daily` stack route (`headerShown: false`).
- `HomeScreen.tsx` Daily Challenge card is now a live `Pressable` wired to `startDailyChallenge()` + `navigation.navigate('Daily')`. It reads `challengeNumber` and `alreadyPlayed` state from the store and shows result copy when already played.
- All daily engine logic (`app/game/dailyChallengeEngine.ts`, `app/game/dailyPool.ts`) and store actions (`startDailyChallenge`, `submitDailyWrongSwipe`, `submitDailyCorrectSwipe`, `completeDailyChallenge`, `loadDailyResult`) were already complete before this patch.
- `key={topId}` on `SwipeMask` forces remount per card change — same pattern as MaskBoard.
- Only React Native `Animated` used in the new screen; no new Reanimated imports.
- TypeScript passed with `npx.cmd tsc --noEmit`.

Patch 23 revised: card deck tile system fully rebuilt. WRONG SWIPES ARE NOW PERMANENT — tile flies away immediately, no snap-back, no retry. One decision per tile, permanent consequence. `'snap-back'` state REMOVED from `SwipeMaskState` in `SwipeMask.tsx` and all snap-back handler code removed from `MaskBoard.tsx`. The deck model is unchanged: all tiles arrive simultaneously stacked, top card only is interactive, correct/trap-caught tiles remove from deck at 180ms, wrong tiles remove from deck at 400ms (after exit animation has started). Gate is now BOSS ONLY — words 1–11 never open the Master Gate and never have a hidden tile. MASTERED is BOSS ONLY — only word 12 (boss) can be vaulted per hunt. GHOST is BOSS ONLY — only the boss word can create a true ghost. Non-boss words 1–11: deck empty → `triggerWordExit()` (word scales up and fades, 1050ms total) → `store.completeWord()`. No overlay. No gate. No mastery. No ghost. Boss word: perfect visible clear → gate opens → ONE mystery tile drops (randomly the real hidden meaning or the hidden trap, determined by `mysteryIsRealRef`) → correct judgment = MASTERED → wrong = GHOST. Boss with any wrong swipe on visible masks → gate permanently locked → silent advance. The old two-tile split gate system is replaced by a single mystery tile. The complex ghost merge animation (`ghostMergeOpacity`, `splitTile2TransY`, `ghostMergeVisible`, etc.) was removed. `triggerWrongFail` simplified to: shard burst → HAUNTED overlay at 800ms. `triggerWordExit()` added as a new function for non-boss word transitions. TypeScript passed. Device sanity passed.

---

## Numbered Patch Log (Completed and Committed)

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
- Patch 32A complete: Bungee Shade wired as the real hero/boss word font.
  - `assets/fonts/BungeeShade-Regular.ttf` is registered in the Expo font plugin.
  - `app/constants/fonts.ts` maps `FONTS.wordDisplay` and `FONTS.bossWord` to `BungeeShade-Regular`.
  - Bebas Neue remains registered for now; no gameplay, Daily Challenge, Hunt generation, content, scoring, swipe grammar, ghost logic, or Master Gate logic changed.
- Patch 32B complete: Daily Challenge is truly 5 rounds end-to-end.
  - `buildDailySession()` now returns 5 seeded rounds from the existing Daily pool with a 1, 1, 2, 2, 3 tier curve.
  - Daily results, share text, title thresholds, type comments, results overlay, and Home preview all count out of 5.
  - Two shared lives and the 9-candidate board are preserved; main Hunt gameplay, Master Gate, ghosts, Hunt generation, SFX, and hero font wiring unchanged.
- Patch 32B-FIX complete: Daily Challenge content bootstrap.
  - `app/game/dailyPool.ts` now has 10 entries per tier, and every DailyWord has exactly 3 meanings plus a 9-word candidate board containing the correct word.
  - `buildDailySession()` now always deals exactly 5 rounds, prefers the 1, 1, 2, 2, 3 tier curve, falls back deterministically through nearby tiers, and validates the 9-card board contract.
  - Daily still uses 2 shared lives and the existing 9-card screen; main Hunt gameplay, Master Gate, ghosts, Hunt generation, SFX, and hero font wiring unchanged.
- Patch 32C complete: Native POLYWORDS Home logo treatment.
  - Home now renders a centered native Bungee Shade wordmark instead of the old wrapping title text because the image asset route was blocked.
  - `POLY` renders gold and `WORDS` renders purple in one no-wrap row with dark extrusion layers and subtle gold/purple glow.
  - No downloaded assets, gameplay, Daily logic, Hunt generation, SFX, navigation, scoring, swipe grammar, ghost logic, or Master Gate logic changed.
- Patch 32D complete: First Hunt word hero treatment normalized.
  - `App.tsx` now preloads `BungeeShade-Regular` through the existing `useFonts` gate before any screen renders, preventing word 1 from flashing a fallback font.
  - `MaskBoard` continues to use the shared Bungee hero render path for words 1-11; boss still uses `FONTS.bossWord`.
  - No gameplay, Daily logic, Hunt generation, scoring, swipe grammar, Master Gate, ghost logic, SFX, or Home logo behavior changed.
- Patch 32E complete: Premium wrong-swipe feedback restored.
  - Wrong swipes still exit permanently and lose a feather, but feedback is now a sharp hero recoil/red flash plus a brief translucent tile accent.
  - The heavy full-screen red wash was reduced to a faint blink, and the old duplicate wrong buzz/error haptic path was removed from `SwipeMask`.
  - `MaskBoard` now owns the single `trapWrong` cue plus one crisp mistake haptic for wrong UP/RIGHT and final hidden-tile wrong swipes.
  - No gameplay, Daily logic, Hunt generation, scoring, swipe grammar, Master Gate, ghost logic, Home logo behavior, or Bungee font loading changed.
- Patch 32E-STACK complete: Visible meaning-card deck stack restored.
  - Main Play now shows up to two visual-only under-card layers beneath the active meaning tile based on `deckSize`.
  - Under-cards are plain dark slab views with subtle offsets, borders, shadows, and no text/content/truth hints.
  - The active top card remains the only interactive `SwipeMask`; permanent exits and card advancement behavior are unchanged.
  - Daily, Hunt generation, scoring, swipe grammar, Master Gate logic, ghost logic, Home logo behavior, and Bungee font loading were not changed.
- Patch 32E-FIX complete: Visual recovery for deck stack, hero word face, and Daily readability.
  - Deck stack visibility was corrected after the first stack patch rendered hidden/too-subtle slabs; under-cards are wider, brighter dark-purple visual-only lips behind a narrower active top card.
  - Main Play hero/boss words now use Bungee Shade as shadow/extrusion behind a solid `BebasNeue-Regular` foreground face.
  - Daily readable words/results now use solid Barlow text instead of Bungee Shade, with improved contrast and line height.
  - Home logo behavior stayed unchanged; only small supporting copy contrast was raised.
  - No gameplay, Daily logic, Hunt generation, scoring, swipe grammar, Master Gate logic, ghost logic, or wrong-swipe permanence changed.
- Patch 33 complete: Scoring system overhaul.
  - `submitBossMastery()` added to polyRunEngine.ts (600 × chainMultiplier, feather-milestone aware, sets pollyTrigger: 'bossMastery').
  - `revealHidden()` removed from engine.
  - `hiddenFound` removed from WordResult type.
  - pollyTrigger 'hiddenReveal' replaced by 'bossMastery' throughout.
  - Score floats in MaskBoard now mirror the engine formula — streak captured before store action, boss 2× applied where applicable.
  - tsc --noEmit exits 0.

---

## Remaining Pending Work (as of Patch 33)

1. Continue running Mask Rewriter sessions to grow `huntData.json` beyond 232 words (target 400+)
2. Future daily/friend/global leaderboards and deeper social ranking systems.
3. `expo-av` to `expo-audio` migration.

## Content Pipeline State (as of Patch 33)

- 232 words tiled, 1838 tiles total (614 real / 1047 trap / 151 hidden).
- huntData.json live in game. 507 words still at zero tiles.
- Target: 400+ tiled words before next huntData.json regeneration.
- Mask Rewriter V7 artifact available in project files. huntData.json at 400 words (threshold reached June 15 2026).

---

## Numbered Implementation Order (Historical)

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
33. Bungee Shade hero/boss font wiring — registered font asset + FONTS aliases (Patch 32A complete)
34. Daily Challenge 5-round engine wiring — session/result/share flow out of 5 (Patch 32B complete)
35. Daily Challenge content bootstrap — valid 9-card pool boards + guarded 5-round deal (Patch 32B-FIX complete)
36. Native Home POLYWORDS logo treatment — Bungee text mark, no image asset (Patch 32C complete)
37. First Hunt word hero treatment fix — Bungee font preloaded before first gameplay render (Patch 32D complete)
38. Premium wrong-swipe feedback restore — brief recoil/flash, no red slab, permanent exit preserved (Patch 32E complete)
39. Visible meaning-card deck stack restore — visual-only under-cards, top card remains interactive (Patch 32E-STACK complete)
40. Visual recovery — visible deck lips, solid hero foreground, Daily readable foreground text (Patch 32E-FIX complete)
41. Home production asset lobby — branded logo image, jungle-neon background layer, glossy Play/card/nav polish (Patch 32F complete)
42. Home polish pass 2 — premium glass copy plate, dimensional Play button, deeper mode cards/nav (Patch 32G complete)
43. Play screen premium arena pass — darkened Home background layer, glass HUD, hero word/gate/tile polish (Patch 32H complete)
44. Play arena fix pass — active route verified, root temple background exposed, heartbeat tint reduced, lower gate dock scoped to boss (Patch 32I complete)

---

*Moved out of CLAUDE.md on 2026-06-20 to reduce per-message context overhead.*
