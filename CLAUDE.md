# POLYWORDS Architecture

`AGENTS.md` owns authority/workflow. `CONTEXT.md` owns current branches, priorities and open work.
Focused product rules live in `docs/`. Runtime code/data outrank every doc.

> Never write a count `npm run state` can print. Counts rot; the command does not.

## Source Map

| Area | Owner |
| --- | --- |
| Hunt rules, scoring, onboarding | `docs/GAME_REFERENCE.md` |
| Hunt pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt editorial law | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily gameplay/castle | `docs/DAILY_CHALLENGE_SPEC.md` |
| Daily editorial law | `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Polly voice | `docs/POLLY_DIALOGUE_BANK.md` |
| Polly relationship | `docs/POLLY_RELATIONSHIP_MEMORY_V2.md` |
| Polybook | `docs/POLYBOOK.md`, `docs/POLYBOOK_LIVING_JOURNAL.md` |
| Visual system | `DESIGN.md`, `app/ui/` |
| Workflow | `docs/WORKFLOW.md` |

## Runtime

- Expo SDK 57, React Native 0.86 New Architecture, strict TypeScript.
- Zustand + immer own state; AsyncStorage owns persistence.
- React Native Animated handles most motion; Reanimated owns finger-tracked cards.
- Bebas Neue is the hero face; Barlow Condensed is UI/tile/dialogue.
- `MusicEngine.ts` owns persistent music; `audioSession.ts` owns the app audio session;
  `sfx.ts` owns on-demand SFX players.

### App variants and phone testing

- Production identity stays `POLYWORDS` / `com.pdb8080.polywords`.
- Development identity is `POLYWORDS DEV` / `com.pdb8080.polywords.dev`. `app.config.js` selects it only when `APP_VARIANT=development`; the EAS development profile sets that variable and enables the generated dev-client URL scheme.
- Normal physical-iPhone iteration is `APP_VARIANT=development npx expo start --dev-client` and opens POLYWORDS DEV. Use `-c` only to clear Metro's cache. The TestFlight/production app must never be the target of the dev QR.
- Rebuild POLYWORDS DEV only when native dependencies, native configuration, or the Expo SDK changes. Ordinary JS/TS/assets changes come from Metro. TestFlight remains the release-candidate/native-production check.

### App launch / splash

- The splash is the `expo-splash-screen` plugin entry in `app.json`: image `assets/splash-icon.png`,
  `resizeMode: "contain"`, `backgroundColor: "#241338"`, `imageWidth: 288`. The image is a
  transparent-background logo cropped tight (1356x476). The plugin fits the image into an
  `imageWidth` square (default 100), so margin or an opaque background in the image makes the logo
  smaller or boxed. 288 matches the plugin's 288 dp Android canvas; a larger value clips on Android.
- A splash change needs a NEW native build (POLYWORDS DEV or TestFlight), not a Metro reload.
- `App.tsx` holds the native splash with `SplashScreen.preventAutoHideAsync()` and hides it once from
  `NavigationContainer` `onReady` (`hideSplashOnce`), with an 8000 ms failsafe. The boot placeholder
  View is `#241338`. Do not hide it from the root `onLayout`: `SafeAreaProvider` renders its children
  only after native insets arrive, so its layout can land while it is still empty.
- `scripts/generate-brand-icons.ts` still writes the old 1200x307 `splash-icon.png` (line 45). Do not
  run it until it is updated.

### iOS expo-audio watchdog patch (SDK 57)

- `expo-audio 57.0.5` carries the official iOS watchdog fix as `patches/expo-audio+57.0.5.patch`, applied by `patch-package` from `postinstall`.
- `tools/expoAudioPatch.test.mjs` is a regression guard and runs in normal `npm test`. Do not delete the patch, bypass the guard, or upgrade SDK merely to remove it. Retire it only when an intentional native/SDK upgrade contains the fix and passes device background/foreground verification.

### Gameplay-feedback accessibility

- `app/game/gameplayFeedbackAccessibility.ts` is the shared short-feedback policy. Motion animates only when Reduce Motion resolves false. Flash/pulse feedback requires motion to be allowed **and** Reduce Flashes to be off. A pending system motion preference takes the conservative static path.
- Preserve gameplay state, copy, decisions, timing gates, and required tap-to-continue behavior when motion/flash decoration is suppressed.

### Native rules learned on device

- Never swap a native-driven transform between an Animated node and a plain number across renders.
- Stacking containers that must survive native flattening use `collapsable={false}` + zIndex.
- Full-size art containers carry no padding; give bundled absolute images explicit dimensions.
- Huge `borderRadius` is not a soft glow. Use art.
- JSX shape changes remount nodes; animation on the old node silently dies.
- A rig-or-Image either/or that mounts fresh image views on a pose switch draws an empty frame or
  two. Keep every pose layer mounted and switch by opacity.
- A one-time timer started at screen load cannot drive an arrival that happens later. Tie the
  pose switch to the end of the arrival animation.
- Pete's DEV RESET DAILY reuses the same perch instance; per-session state must reset when `show`
  turns true, not on mount.

`wallShake.ts` is the shared stone-wall shake channel. Consumers use its helpers and call
`resetWallShake()` on unmount. Never scale the wall; the Boss ledge derives from full-width,
bottom-anchored geometry (`LEDGE_ART_Y` 1349 for `StoneWall2.png`, 853x1844).

Momentum strain (2026-10-28, works on device): `setWallStrain(tier)` / `resetWallStrain()` (separate
from `resetWallShake()`, which the gauntlet calls) make the wall tremble harder and quicker as the
streak tier rises. `GameScreen`'s `GameDirector` derives the tier from `resolveLiveHuntControl`
`readTier` (sharp 1, razorSharp 2, untrappable 3; 0 for HUNTED, when not playing, or when motion is
off). `WALL_STRAIN_AMP` [0, 0.6, 1.4, 2.4], `WALL_STRAIN_LOOP_MS` [0, 600, 420, 300]. Offsets compose
as `add(add(trembleX, kickX), strainX)`. `GraphicGround`'s edge bleed is sized from tremble + kick +
strain max. The shake stops on FELL OFF because the tier resets.

FELL OFF wall zoom (2026-10-28, BUILT BUT NOT VISIBLE ON DEVICE, unfinished): `fallWall(severity)`,
`runWallFallAnimation()`, `resetWallFall()`, plain Animated values `wallFallScale` / `wallFallShade`.
`GraphicGround` draws a `falling` overlay (a darkened, enlarged wall copy as the pit and a shrinking
wall copy in front); `GameScreen` fires it from `game.fellOffSeverity`. Gauntlet and haunt wrong paths
never set `fellOffSeverity`. Lessons: do not interpolate unattached/at-rest native values (the wall
vanished when the real wall was scaled through an interpolation) and start native animations after
the target view mounts. Debug lead: a deliberately loud test build, a JS-driven animation, and a log
in the `subscribeWallFall` callback.

`wallVeinPulse.ts` is still called on every correct answer (`MaskBoard` `pulseWallVeinsForCorrect`)
but NOTHING DRAWS IT: `GraphicGround` has carried no glow layers since 2026-10-28 (Pete rejected the
grout-line glow, "looks like Tron") and the `wallVeins` prop is read by nothing. The old
`assets/images/background/wall-veins/*` art and `tools/art/build_wall_veins.py` (built for the old
`StoneWall.png`) are unused.

Removed (Pete): the wall torches and `GroundTorch.tsx`, the card-trail idea, and the wall vein/grout
glow. Do not re-add any of them. `TorchGlow.tsx` stays (Settings uses it).

## Hunt Architecture

- `huntGenerator.ts` builds 10-round standard and 8-round fledgling arcs. Polly's Word is final;
  Returning Haunt is round 5 / round 4 and never gets Boss presentation.
- UP claims a REAL; RIGHT rejects a trap. Six starting feathers. Up to five visible masks.
- Boss: survive visible masks, then judge three hidden cards one at a time. All three correct =
  MASTERED; any hidden miss or Boss death = HAUNTED. `bossOutcome` is authoritative.
- Returning Haunt re-tests the exact hidden pair that won. Mastered words may return only as
  ordinary tension/panic `isMasteredReturn` revisits, never Boss/Haunt candidates, with one
  exception: MASTER'S REMATCH.
- MASTER'S REMATCH: only when no unmastered word with hidden Boss content is left,
  `generateHunt` makes the final round a mastered boss word flagged `step.isMasteryRematch`
  instead of throwing. Hunts with an unbeaten boss word are unchanged. A rematch win adds no
  crown and no Polybook mastery; a loss creates no Haunt. A win still counts as beating Polly
  in `recordRunComplete` (streaks, mood).
- GPS arc: Confidence → Flow → Tension → Panic → Boss. `docs/GOLDEN_PACING_SYSTEM.md` owns the
  product rhythm; `huntGenerator.ts` owns executable pools/fallbacks.
- Runtime Hunt entries are validated before selection. Invalid difficulty/gpsTag, malformed or
  duplicate mask IDs, non-Boolean REAL/trap flags, missing swipe-direction coverage, or Boss
  entries without hidden content must fail loudly rather than silently disappear from pools.
- `assets/data/huntData.json` is the single live Hunt bank. The generator and every Hunt
  validation, audit and state tool consume it directly; parallel runtime override banks are not
  part of the architecture.
- Scoring is computed/persisted but player-facing nowhere. Rank is retired. Momentum is the live
  STEADY / SHARP / RAZOR SHARP / UNTRAPPABLE system with FELL OFF on a broken chain.
- Momentum colour has one source, `app/ui/momentumAccent.ts`: `MOMENTUM_ACCENT_BY_TIER`,
  `resolveMomentumAccent(hud)`, `momentumAccentColor(strength)`, `MOMENTUM_GLOW_HUNTED`,
  `momentumGlowColor(strength)`. No second colour table exists; GameScreen's `hudAccent` and rungs
  read it. STEADY `softWhite`, SHARP ice blue `#6EC3FF` (was lavender `#B98ADE`), RAZOR SHARP
  `#B388FF`, UNTRAPPABLE gold `#F5C842`. HUNTED (lives <= 1) turns the HUD word `PW.color.rose`
  `#9B2D6B`; the card glow and vein pulse use the lighter `#D9488F` instead. The four rungs follow
  the streak tier (`readTier`) even while HUNTED. Card glow, vein pulse and press haptic always
  match the HUD word's strength, HUNTED included.
- `#6EC3FF`, `#B388FF` and `#D9488F` are momentum-accent colours outside the AGENTS.md locked
  palette (only `#B388FF` predates this). The repo has no palette checker.
- Pressed-card glow: SwipeMask's `momentumTier` prop (steady / sharp / razorSharp / untrappable /
  hunted). On the normal card, the resting dark drop shadow blends into the tier glow as the card
  lifts. Full press (opacity / radius): 0.30/22, 0.55/36, 0.75/50, 1.0/66, 0.80/44. The gauntlet
  card keeps its own gold glow (0.80/36 at full press), unchanged.
  KNOWN ISSUE, NOT FIXED (Pete, 2026-10-11): the glow is nearly invisible on device. The same view
  (`styles.tile`) carries the glow and clips (overflow hidden, radius 20), and with no background
  the shadow is traced from `card-face.png`'s alpha (1410x604, painted x 31-1378, y 14-591; sides
  bow outward, corners far rounder than 20 pt). Only the ~6 pt side / ~3 pt top-bottom margin
  shows, as a flat hard-edged band. Raising radius or opacity cannot fix it; do not retune until
  the clip is dealt with. Candidate fixes: (C) drop the tile's clip and clip only the children that
  need it; (A) a sibling backing view with a copy of the transform; (B) move the transform to a new
  outer wrapper. Any backing shape must fit inside the painted silhouette. The black
  `deckTopCardSlot` shadow (0.24, r22, 16 pt down) is not the cause. Android: Android 9+ tints the
  elevation shadow with `shadowColor` but has no opacity, radius or offset; not handled yet.

### Hunt pause / resumable navigation

- `HuntPauseMenu.tsx` is the one true in-Hunt pause surface: RESUME HUNT, HOME, SETTINGS, QUIT HUNT. Opening it must not forfeit or advance the run.
- HOME and SETTINGS preserve the exact active Hunt. Before leaving Game, set `hasResumableGame` and flush active persistence. Home must show RESUME HUNT and resume the same word/masks/score/feathers/chain/Haunt/Boss state rather than generating a new run.
- Settings opened from the pause menu carries explicit `preserveHunt: true`; Back returns to the still-paused Game screen. Settings -> Home bypasses the Hunt exit guard only for that explicit preserved-Hunt path.
- `withHuntExitGuardBypass` is synchronous and scoped to the deliberate safe navigation dispatch. Normal back/removal still hits `beforeRemove` and cannot silently discard a live Hunt.
- QUIT HUNT is the only pause action that enters `PollyExitConfirm`. KEEP HUNTING returns to play; LEAVE THE HUNT forfeits only after confirmation. The locked confirmation uses `assets/images/polly/polly_quit_smug.png`, the truthful loss warning, and the single bubble "See you later, LOSER."
- Pause and quit overlays block underlying gameplay/accessibility and suspend the idle-static timer. Reduce Motion shows their final states without pop/bounce animation.

## First-Run Onboarding

Player-facing flow/copy: `docs/GAME_REFERENCE.md`.

- One versioned `FirstRunOnboardingState`; version mismatch must not casually re-tutorialize
  established players.
- First Home uses Polly's four-line perch intro and a one-time HUNT glow.
- First Hunt is the real 8-round board, opens on FINE, and pins guided REAL, guided TRAP and first
  unaided masks. No practice board.
- Active Hunt state is authoritative. Resume reconciles only from committed decisions.
- Direction limits flow through MaskBoard input mode to SwipeMask disabled state.
- Settings replay re-runs only the FINE opening; it does not reset Boss/Haunt/HUD lesson gates.
- HUD lessons teach feathers, momentum, broken run and Hunt progress only after the player lives
  the event. `HudLessonLayer.tsx` owns the spotlight and accessibility lock. Do not use
  `gameplayGateActive` for this because it unmounts gameplay.

## Boss Presentation

### Gauntlet entrance

`BossGauntletSpines.tsx` owns the three wall-brick cards. Sprite padding and derived closed-card
height are geometry contracts. Stones use exact-fit start scaling (see the file); each crown is a
pre-colored image per stone index (`crown-gold/rose/lavender.png`), never a tint. The gauntlet draws
NO hole/recess layer: it caused a black strip on the picked stone and Pete removed it 2026-10-28.
`RECESS_OVERLAYS`, `BRICK_RECESSES` and `recess1-3.png` stay, unused, by Pete's choice. Never cut the
wall art.

### Outcome

`HeroBook.tsx` swaps neutral/mastered/haunted rigs on one canvas; `MaskBoard.tsx` owns the
continuous open → transform → close choreography. Boss outcome music stays fully silent through
both outcomes. Returning Haunts do not use this package.

MASTER'S REMATCH outcomes are device-approved and use the shared
`RematchOutcomePlaque.tsx` presentation in DEV and production:
- Lost (missed hidden card or ran out of feathers): BUSTER. The rematch begins on the gold Master
  book; MASTER shows, `MA` drops, `BU` lands while `STER` holds, and the final BUSTER plaque is the
  approved purple/gold treatment. The Hero Book returns to the neutral purple rig before the final
  BUSTER plaque. No Haunt is created and persistent mastery is unchanged. Results label/share text
  read BUSTER; `Bird brain` remains Results-only.
- Won: the gold Master book stays mastered. The Master plaque resolves to the crown-led KING plaque;
  the in-round final plaque does not need literal `KING` text because the crown carries the
  promotion, and the Boss word remains beneath it. Results label/share text read KING.
- Dynamic plaque lettering uses `PlaqueText.tsx` as one Text node with material shadow. Do not
  restore the old three-layer text stack; it separated into visible duplicate words on-device.
- Normal Boss/rematch event labels are `POLLY'S WORD` / `MASTER'S REMATCH`. Player-facing Boss
  score, mastery-point and `2x` framing are retired; internal scoring remains unchanged.

## Polybook

- Vault route is Polly's book. Current architecture: closed physical book → one large portrait
  page, not the retired miniature two-page spread.
- Navigation: TODAY / JOURNAL / MASTERY on bottom forked ribbons, plus visible `< COVER` return.
- Never display a meaning, trap or hidden pair. Words recur, so that becomes an answer key.
- TODAY/JOURNAL/MASTERY interior behavior is owned by the Polybook docs. Do not duplicate its
  typography, pagination or visual tuning here.
- Old Lexicon rollback components remain until Pete decides to delete them.
- The nav tab and in-round spine both say POLYBOOK; renaming remains Pete's decision.

## Home

Home is the OUTDOOR night terrace (Pete, 2026-10-20; made the real Home 2026-10-21). `App.tsx`'s `Home`
route renders `app/screens/HomeTerraceScreen.tsx` (with `app/components/HomeTerraceScene.tsx`,
`app/ui/homeTerraceScene.ts`, `app/ui/homeTerraceEntrance.ts`, `app/hooks/useTerraceEntrance.ts`). The
old `HomeScreen.tsx` is parked, not deleted, and is reachable only under `__DEV__` as the `HomeOld`
route (Dev Settings > OLD HOME). Rulings live in `docs/HOME_SCREEN_LOCKDOWN.md`. Layout is one
width-fit, bottom-anchored frame (design canvas 443x960, k = screenWidth/443); logo, moon and cage top
are top-anchored below the safe-area inset. Positions are the defaults in `TERRACE_DEFAULTS`
(`homeTerraceScene.ts`, Pete's 2026-10-21 20:54 DEV readout, locked). The DEV positioner
(`app/dev/HomeTerracePositioner.tsx`, overrides in AsyncStorage `pw.dev.homeTerrace.v1`, plus Daily /
Feather / Streak / Start-here state toggles) renders only under `__DEV__`.

Buttons are Pete's flat art in the console opening (ENTER THE HUNT with a crown at each end, white,
gold once the Daily is played; POLYBOOK plain) and the Daily plaque in the wall recess behind the
console. Every time Home is focused, Daily, Hunt, Polybook come out in turn with the Daily's own
entrance constants (`dailyPlaqueEntrance.ts`), a stone thud and tap each, one grind (`terraceStoneShift`, the gauntlet's 0.41 level, Pete-locked 2026-10-22; the Daily keeps its quieter `dailyStoneShift`) and a tremble of
wall and console. Hunt and Polybook pop out when pressed (top face and shadow); the Daily cannot come
forward past the console, so it rises from behind the console's top edge and is pressed IN (sinks and
dims). Plaque: gold frame and label while the Daily is unplayed, still gold and reading GOLD FEATHER
READY while a Gold Feather is ready, gray once played with no feather. The Daily streak is NOT on Home (it
left the moon 2026-10-23; it shows on the Daily HUD as STREAK n above DAILY #n). First Hunt only: START and HERE breathe under the Hunt button's crowns. The
first-run Hunt glow (after Home onboarding completes) is a gold wash over the Hunt button.

Aspect-locked art: wall, casing and the Daily plaque derive height from width (`lockTerraceAspect`).
Tap dives (Pete device-confirmed 2026-10-22), in `app/ui/homeTerraceDive.ts` (RN-free timings and maths:
`TERRACE_DIVE`, `TERRACE_DAILY_DIVE`, `TERRACE_BOOK_DIVE`; the only place to tune them) and
`app/hooks/useTerraceDive.ts`. Hunt: Polybook then Hunt retreat into the static hall, zoom into its golden
end, gold flash `#F5C842`, then Game. Daily: the castle is hidden until pressed, rises between the
mountain ranges, zoom into the painted door (`TERRACE_CASTLE_DOOR`), flash, then Daily. Polybook: buttons
retreat, the Vault screen opens transparent over Home, its own closed cover rises out of the hall to its
resting spot, then the page (background, header, bottom nav) fades in. Rules that came out of this:
- Scale about a point with translate-scale-translate (`terraceZoomShift`), NOT `transformOrigin`: with an
  animated native scale it made the scene vanish.
- All Home layers sit in one "world" Animated.View that is scaled during a dive; the gold flash is outside it.
- `App.tsx` opens `Vault` as `transparentModal` with `animation: 'none'` only when route param
  `polybookRiseFrom` is set; every other way in is the ordinary fade.
- React Navigation 7: a plain `navigate` PUSHES a new screen. `HomeButton` sends Home with `{ pop: true }` so
  it returns to the existing Home (a second Home had let the Polybook header show through). The Daily's
  `handleHome` (HOME on Results, NOT NOW, the pause card) and the Hunt Results HOME (`GameScreen` `handleHome`)
  do the same. Popping back is safe: `useTerraceDive` resets zoom, flash, hall, retreat and castle on focus and
  the buttons' entrance replays on every focus.
- Stale DEV overrides in AsyncStorage can make Home look wrong; "Reset all" in the positioner clears them.

Also built and Pete-confirmed: moon rise (real phase, once per app open, `app/ui/homeTerraceSky.ts`), shooting stars,
Polly falling in from the top (`TERRACE_POLLY_DROP`, `terracePollyDropDistance`), the Polybook room background, and dive
sounds named in `TERRACE_DIVE_SFX` (Epic Swoosh on Hunt and Daily, Super Cape on the Polybook rise, book thud on landing,
`terraceStoneShift` when the buttons retreat; credits in `assets/audio/LICENSES.md`). The cage is OFF Home; it is a static
prop on the Polybook page (`app/ui/polybookCage.ts`).
Polybook cage BUILT 2026-10-23 (`app/components/PolybookCage.tsx`, layout and timings in `app/ui/polybookCage.ts`, from Pete's mockup): rope top-left, mirrored cage hanging tilted; the first Polybook open of an app launch the book's thud jolts it, it falls and breaks into dome + base; later visits show the pieces already on the floor, BELOW the open book either side of the HOME button (the open book is far bigger than the closed cover). Reduced motion shows it broken. The slam plays `polybookCageCrash` (Pete's "Metallic Clang", Pixabay, credited in `assets/audio/LICENSES.md`). Fall and sound confirmed on Pete's phone 2026-10-23. Polybook and Settings have NO bottom nav any more: `app/components/HomeButton.tsx` (Pete's round gold HOME icon) replaces it (`BottomNav.tsx` and the old `polybook_cage.webp` were deleted 2026-10-23). The streak moved to the Daily HUD, hidden at 0 and on phones where it would cover the first clue (`dailyStreakLineFits`).

iOS note: an RN `Image` with `StyleSheet.absoluteFill` inside a Pressable drew at intrinsic size on
iOS (Fabric); give such Images explicit width and height. RN `Image` takes no `pointerEvents` prop;
use style.

## Daily

Deterministic, one attempt per date, five UP-only rounds, two lives. `docs/DAILY_CHALLENGE_SPEC.md`
owns the sequence and device-approved castle behavior.

Architecture only:
- Daily source compatibility is deliberately dual-shape during migration. Legacy
  `app/game/dailyPool.ts` rows keep nine approved source candidates. Newly authored rows live in
  `app/game/dailyPoolExpansion.ts` and contain exactly six visible cards: the target plus five
  approved traps. `dailyChallengeEngine.ts` combines both pools, accepts either six or nine source
  candidates, and always presents exactly six cards. Do not pad new rows back to nine.
- `app/game/dailyPoolExpansion.test.ts` is the structural/reachability gate for new six-card
  content: exactly three clues, six unique cards, target exactly once, no answer-card word inside
  any clue, a valid tier, and deterministic runtime reachability.
- `DailyCastleStage.tsx` owns the persistent scene behind entry/play/results.
- Measured geometry and animation constants live in `app/ui/dailyCastleScene.ts`; re-measure when
  exported art changes rather than copying coordinates into docs.
- Derived castle/door/wall/tunnel/coin art comes from `tools/art/`; rerun scripts, never hand-edit
  generated output.
- Text fitting uses measured widths, not browser-dependent auto-fit behavior.
- Correct claim, gold hit and gold-coin finale are separate progress systems. Input stays locked
  until the gate settles; Results waits for the finale.
- Polly perch (`PollyDailyPerch.tsx`): she sits at the wall, in front of it, the whole time.
  `DAILY_POLLY_SCALE` (1.25) grows her from the base 150 pt box's bottom-left; the spot
  (`DAILY_POLLY_PERCH`) and bubble (`DAILY_POLLY_BUBBLE`, to her right, tail left, width capped by
  `screenMargin` 12 pt) are castle units in `dailyCastleScene.ts`.
- Arrival: when play starts she flies in from the top-left in `fly` (`DAILY_POLLY_ENTRY_*`) and
  switches to idle when the descent lands. Pose and flags reset every time `show` turns true.
- Every perch pose is a mounted layer switched by opacity (`PERCH_LAYER_POSES`, incl. `flyAngry`
  and `flyGrin`). Never conditionally mount or unmount pose images.
- End: after her last line she flies out (win `flyAngry`, loss `flyGrin`); Results waits for the
  fly-out (`DAILY_POLLY_EXIT_FAILSAFE_MS` 6 s safety release). The gate stays blank on a win during
  the hold; the board stays locked on a loss.
- The results view (also what an already-finished Daily opens to) shows Polly's pose only: no
  bubble and no remembered line (Pete). The perch is the only place the Daily line is said and
  remembered. On unmount the screen clears the in-memory claim result (`clearDailyReaction`),
  so leaving during the ending and returning does not replay her reaction or hold Results.
- Pause (Pete, 2026-10-29): `UiIconButton kind="pause"` top-right beside the DAILY # plate
  (`top: insets.top + 4`, `right: 12`), shown whenever the HUD is. It dims (0.6) and ignores taps
  unless `canOpenDailyPause` (`app/game/dailyPause.ts`) passes: session active, input unlocked (so
  not during a claim, the round-start stone entrance or before audio is ready), claim phase idle, no
  claim presentation, Polly perched (no reaction) and not flying out. `DailyPauseCard.tsx` is ONE
  card: Polly (`polly_quit_smug.png`) and her bubble over CONTINUE / HOME / SETTINGS, the Hunt's look
  copied (not shared). No QUIT: leaving costs nothing and the session resumes. Every string lives in
  `app/ui/dailyPauseCopy.ts`. While open the clock is frozen: `pausedRef` gates the 250 ms clue timer
  and the claim handlers, and `resolveDailyActiveElapsedMs`'s `paused` flag returns the saved time.
  The card stays open under Settings; Android back closes it.
- Midnight: a saved session is only accepted for today's local date. An unfinished Daily from an
  earlier date is discarded (no result, no streak) at the next `loadDailyResult`, which runs when
  the Daily opens and when Home is focused. A Daily screen left open across midnight keeps the old
  session; finishing it records a result under the old date.

## Audio and Haptics

- App owns audio lifetime; screens claim music only while focused.
- Loudness is partly asset-level. Measure/normalize files before blaming player volume.
- `cueAsync` in `app/utils/haptics.ts` is the only haptic gateway. Its only gate is Settings ▸
  Haptics, checked once when a cue starts; follow-up `setTimeout` pulses are not re-checked.
  Heavy is mostly kept for Boss beats; the UNTRAPPABLE press (Pete) and the Daily's lost-chance
  impact are the non-Boss exceptions.
- Hunt card press-down fires one cue by momentum (`resolvePressHapticCue`, `huntFeedbackPolicy.ts`,
  tested): STEADY Light, SHARP Light, RAZOR SHARP Medium, UNTRAPPABLE Heavy, HUNTED Medium.
  The swipe and the release are silent on Hunt cards; `gestureThreshold` (Rigid) still fires on
  the gauntlet card and the Daily card.
- Outcome haptics fire when the player sees the result: a correct UP when the card reaches the
  book (`handleCardTouch`; queued at `onRealClaimed`), a correct RIGHT when the shards burst
  (`handleEffect('shard')`), a wrong answer when the card's red flash and snap-back start
  (SwipeMask `onWrongShown` → MaskBoard `handleWrongShown`). Gauntlet answers still fire at
  release. FELL OFF fires at release (second pulse +70 / +90 ms); tier-up one render after.
- Hunt correct-UP sound is `correctClaimHunt` (`sfx.ts`, volume 0.28, cooldown 120 ms;
  `assets/audio/sfx/correct_claim_hunt.wav`, a rising two-note chime mixed with a Pixabay hit; the
  full Pixabay licence terms are NOT verified, check before launch). It plays from `handleCardTouch`
  at the tier rate (`CHAIN_TIER_SFX_RATE`), queued with the haptic cue at `onRealClaimed`, so it lands
  when the book accepts the card, not at release. The gauntlet swipe-up (`onGauntletCorrect`) still
  plays it at judgement. The old `correctClaim` is unchanged and the Daily still uses it. Hunt music
  does not slow in crisis (HUNTED switches to the tension track at rate 1.0); Pete: do not slow it.
- Outcome strength follows the ROUND (`step.hapticTier` from the pacing phase in
  `huntGenerator.ts`), not momentum, by design (Pete, 2026-10-11). Light rounds 1-4; medium 5-7
  standard / 5-6 fledgling; heavy 8-10 / 7-8; a Returning Haunt round is heavy and the round after
  it light. Claim: `standardCorrect` Medium / `claimMedium` Medium + Soft +70 /
  `heightenedCorrect` Medium + Medium +90. Trap: `trapRejectLight` Rigid + Light +50 /
  `trapRejectMedium` Rigid + Medium +55 / `trapRejectHeavy` Rigid + Medium +55 + Light +110.
  Wrong is always notification Error. Only `fellOff*` follows momentum (the chain before the miss:
  SHARP small, RAZOR SHARP medium, UNTRAPPABLE big, STEADY none). Tier-ups have three escalating
  shapes. `huntFeedbackPolicy.ts` picks the cue; shapes live in `haptics.ts`.
- Known haptic risks, not fixed: below ~25 fps a card can exit (1350 ms safety timer) before
  reaching the book, leaving its claim cue to fire one card late; the trap cue waits in a single
  slot if the card's position measurement never answers; a tier-up can land 0-35 ms from the
  trap cue and mask it.
- Defined but never fired: cues `bossEntry`, `bossHaunted`, `dailyInkPress`; the uncalled
  `playSystemStingerWord` and the unrendered `BusterOutcomeOverlay` punch. Settings, Polybook,
  Results and the onboarding/HUD-lesson overlays fire no haptics of their own.
- Android (expo-haptics 57.0.3): Light = Soft = selection and Medium = Rigid, so impacts collapse
  to three strengths there.
- Polly's short wrong-swipe squawk fires always when a real chain FELL OFF, otherwise on every
  third other wrong swipe. The count lives in `GameScreen` for the whole Hunt (reset per run),
  not in the board, which remounts per word.
- Polly's ordinary laugh, Boss laugh, Returning Haunt laugh and Hunt-loss Results chuckle are
  separate product beats. The Hunt-loss Results laugh is locked (Pete) and unchanged.
- Daily perch sound: silent on right answers and the winning claim; `pollySqwawkShort` on the
  first miss; `pollySqwawkLaugh` on the lost last chance. An explicit allow-list, so new reactions
  default to quiet.
- Do not guess what a sound is: `pollySqwawkShort` is the sound Pete calls "the laugh".

## Content and Data

- Live Hunt bank: `assets/data/huntData.json`.
- Editorial workbooks are staging only and never update runtime automatically.
- Word/mask/hidden-pair IDs are persistence contracts. Never renumber approved live content.
- Runtime validation is a shipping gate, not an editorial writer: it catches structural failures;
  Pete's approval and `docs/CONTENT_WRITING_STANDARD.md` decide whether copy is good.
- Daily runtime content is split between legacy `app/game/dailyPool.ts` and current six-card
  `app/game/dailyPoolExpansion.ts`; `dailyChallengeEngine.ts` combines them. Daily remains governed
  separately from Hunt by `docs/DAILY_CONTENT_WRITING_STANDARD.md`.
- Retired: `assets/data/huntData.v2.json`, `tools/content/_deprecated/mask-rewriter/`.
- Any change to `assets/data/huntData.json` must pass `npm run content:quality` against the real
  file before commit. A validator self-test passing is not evidence: FOAM/FOLD shipped below the
  3-trap minimum on 2026-08-31 that way.
- New tiles get fresh ids. Retired ids are never reused for different content.

## Polly Architecture

- Polly authored the traps. The words are the game; Polly is the pressure. She jabs, she does not
  teach. Voice law: `docs/POLLY_DIALOGUE_BANK.md`.
- Relationship Memory V2 is durable/reversible in the documented split: permanent progression is
  monotonic; current rivalry/form may move. Do not replace it with freeform LLM dialogue or a
  visible relationship meter.
- Life hierarchy: immediate gameplay event > relationship life profile > ambient idle. Logical
  profiles are neutral, cocky, watchful, rattled, hauntFocused; they are behavior policy, not
  saved progression labels.
- `PollyHomePerch` + `PollyPerchRig` + `usePollyAmbientMotion` are the current Home foundation.
  Rig 2 articulates face/crown but most body anatomy remains baked. Preserve device-approved
  `BROW_FOLLOW = 0.33`.
- Pose art is the master set (`assets/images/polly/master/`, 792x845, all face right), through one
  small table per screen: Hunt `app/ui/pollyHuntPoses.ts` (multiplier 1; falls back to
  `POLLY_POSES`/`POLLY_POSE_SCALE` only for rattled, idle, cocky); Results and Daily
  `app/ui/pollyScreenPoses.ts` (incl. `flyAngry`, `flyGrin`); Home `app/ui/pollyHomePoses.ts` plus
  the pure, tested `app/game/pollyHomeRestingPose.ts`. Idle and smug stay on the face rig (sprite4)
  on Results, Daily and Home: both point at the same `POLLY_POSES.idle` object, which the rig
  check compares against.
- Hunt visits: she flies in on `fly` (she cannot know who wins), except the Returning Haunt gloat,
  which flies in on `hauntTaunt`. Only the exit shows the result: mastery exits `flyAngry`; the
  Haunted gloat exits `flyGrin` but holds the perch, so that exit is rarely seen. Boss entry
  perches `point` (perchScale 1.05); mastery `angryYell`; Haunted gloat `hauntTaunt` (perchScale
  1.24); streak x10 `embarrassed`; two one-feather lines `laugh03`; laugh visits `bigLaugh`. Exit
  arc: +0.6 × screen width, -(screen height + 80), tilt -1 (nose-up), scale 0.86, `FLY_OUT_MS`
  500 / `FAST_EXIT_MS` 250. No Hunt visit sleeps; the Hunt looping-Z work was reverted.
- Home perch: 246 pt box; `POLLY_HOME_MASTER_SCALE` (1.07) matches master poses to the rig's
  resting size. Awake poses (rig, fly, embarrassed, angry) are mounted together and switched by
  opacity (`HOME_AWAKE_LAYER_POSES`). Post-win resting pose is master `angry` (closed beak), not
  `angryYell`; the rattled profile uses `embarrassed`. After the entrance settles, the resting pose
  and life profile follow LIVE memory; the greeting stays frozen. Home stays mounted under the
  Hunt; `enteredThisSession` limits the entrance to once per app session.
- Home's "back after an absence" look (watchful) relaxes after the first completed Hunt of the app
  session (`homeBeatForSession` with the in-memory `sessionStartRunsCompleted`; nothing saved). A
  Hunt quit from the pause menu is not recorded, so it does not count.
- Home sleep: master `asleep` plus three looping Z's (`HOME_Z_*`, native driver), running only
  while fully asleep, Home focused and motion allowed; Reduce Motion shows one still medium Z. She
  wakes only when Home loses focus; touches on Home do not wake her (Pete accepted).
- Home doze (`PollyHomePerch.tsx`): a 600 ms nod (`DOZE_TRANSITION_MS`; sink `DOZE_NOD_Y` 8 pt, lean
  `DOZE_NOD_DEG` 4 deg clockwise, `DOZE_NOD_SCALE` 0.97) while the rig closes its eyes (optional
  `eyesClosed` prop on `PollyPerchRig`, `EYES_CLOSE_MS` 300), then one hard cut to the master asleep
  layer; in the same frame the scale returns to 1 and the sink and lean drop to the settle's leftover
  offset (`DOZE_SETTLE_Y` 3 pt, `DOZE_SETTLE_DEG` 1.5 deg), which then eases to rest
  (`DOZE_SETTLE_MS` 250). The old 450 ms cross-fade is gone; `dozeOutOpacity` now only flips at the
  cut (0 ms). The asleep layer is hidden during the nod; an interrupted nod or
  settle returns her awake at rest. Known leftover: rig art and `asleep.png` are different art, so
  the cut is slightly visible (Pete accepted 2026-10-29). The angry resting pose is still a static
  image. The Daily has no sleeping pose and does not doze.
- Do not delete the old sprites or `POLLY_POSE_SCALE` until every consumer has moved. Remaining:
  the three screen tables (`POLLY_POSES.idle`/`POLLY_POSE_SCALE.idle` for the rig; the Hunt's
  rattled/idle/cocky fallback); unrendered `PollyFlightLandingAnimation`,
  `PollyFlightLandingPrototype`, `PollyPoseAnimation` (+ `pollyPoseAnimations.ts`); and
  `pollyAnimations.ts` (old `polly_*` art) behind the unused `PollyActor`/`PollySprite`.
- The DEV ALIVE LOOP whole-image lean/rotation experiment was rejected. Do not wire it to Home.
- The parked articulation plan lives in `CONTEXT.md`: inventory existing separated art, then
  prove one DEV Neutral articulated sequence before new art or production life-profile
  animation.
- Approved but NOT built: a permanent Polly turn, a second one-way door in the Polybook mood
  (`resolveRivalryState`, `pollyMood.ts`) after a placeholder 12 masteries, after which AMUSED
  is unreachable. Lines are unwritten; revisit the milestone after TestFlight. Today AMUSED is
  still reachable at any mastery count.

## Services and Boundaries

- `ErrorBoundary.tsx` wraps the navigator and uses system fonts in fallback UI.
- Boss and Returning Haunt explainers have separate one-time persistence gates from onboarding.
- `playtestTelemetry.ts` is local only; Daily reminders are optional local notifications.
- Theme/material tokens live in `app/ui/`; render code outranks abandoned plans.
- Preserve stashes and unrelated local art. Branch merges require Pete's approval.
- The public website lives on orphan branch `gh-pages` (GitHub Pages), never mixed with game code.
  Adding any network, analytics, crash-reporting or ads SDK requires updating both `PRIVACY_TEXT`
  in `SettingsScreen.tsx` and `gh-pages:privacy/index.html` in the same release, plus the App
  Store privacy answers.
Round gold icon buttons (Pete drew them 2026-10-23): `app/components/UiIconButton.tsx`, art `assets/images/ui/icon_{home,pause,settings}.webp`, ONE size everywhere (`UI_ICON_BUTTON_SIZE` 44 pt, `app/ui/uiIconButton.ts`). Used for the Home settings gear (bottom-left, just under the console), the Hunt pause (bottom-right), the Daily pause (top-right) and the HOME button on Polybook and Settings. The Home gear is drawn AFTER the console in `HomeTerraceScene.tsx` (and before the gold flash) so the console's floor shadow does not darken it (Pete 2026-10-23). Results/Daily keep their text HOME links. App flow (Pete): the Polybook opens only from Home. Settings is reached from the Home gear, from HUNT PAUSED or from the Daily pause card. A paused Hunt may safely go Home or Settings without forfeiting; all other live-Hunt removal remains guarded. HOME from ordinary screens still returns to the existing Home rather than stacking another one.
