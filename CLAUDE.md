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
| Daily breach build prompts (2026-11-04) | `claude/POLYWORDS_SESSION_2026-11-04_BREACH_BUILD_PROMPTS.md` |

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
- A font load error no longer stops the boot (`7ee75fe`): `fontsLoaded || fontError != null` opens the gate,
  one `console.warn` is logged, and text falls back to the system font.
- `scripts/generate-brand-icons.ts` no longer writes `assets/splash-icon.png` (`26e0503`) or `assets/icon.png`
  (`524b307`) or `assets/adaptive-icon.png`; all three are hand-made (the script carries a comment saying so).
  It still writes `assets/images/brand/wordmark.png` and `assets/images/brand/home-wordmark.png`.
- `assets/adaptive-icon.png` is the crown icon: `icon.png` scaled to 531 px, centered on `#240353`, 1024x1024,
  inside the Android safe zone (a circle 66/108 of the canvas). Do not regenerate it.

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
`readTier` (sharp 1, razorSharp 2, untrappable 3; 0 for STEADY, for HUNTED, when not playing, or when
motion is off; HUNTED only shows below SHARP, see the armor section). `WALL_STRAIN_AMP` [0, 0.6, 1.4, 2.4], `WALL_STRAIN_LOOP_MS` [0, 600, 420, 300]. Offsets compose
as `add(add(trembleX, kickX), strainX)`. `GraphicGround`'s edge bleed is sized from tremble + kick +
strain max. The shake stops on FELL OFF because the tier resets.

FELL OFF wall fall (2026-11-02, works on device, Pete approved the look): on FELL OFF the background
falls down a hole, crashes at the bottom and shakes, a beat, then the camera falls after it (HUD,
book and cards) and lands on top. Everything ends at rest size and position; nothing eases back up.
`fallWall(severity)`, `runWallFallAnimation()`, `resetWallFall()` in `wallShake.ts`; every timing,
depth and sound number there is a labelled TEST VALUE (drop 300 ms, beat 220 ms, catch-up 260 ms,
depth 0.25 / 0.4 / 0.55 by severity). The fall ends when its animation finishes
(`WALL_FALL_SAFETY_MS` 1500 is only a safety net; a fixed timer used to cut every fall short).
`GraphicGround` draws the overlay only while falling: a darkened 1.4x pit copy, edge bands, stone
rings, a dim warm glow and side haze, two sets of air streaks, and the shrinking wall copy with a dark
rim. The foreground wrapper in `GameDirector` takes `fgLandScale` / `fgLandY` for a landing squash.
`GameScreen` fires it from `game.fellOffSeverity`; gauntlet and haunt wrong paths never set it.
`warmWallFallSfx()` (in `sfx.ts`) preloads the cues. SOUNDS (Pete's pairing, locked 2026-11-02):
background slam = `hardHeavyImpact` (hard_heavy_impact.mp3), camera slam = `boulderImpact`
(boulder_impact.mp3, rocks breaking in its tail), both volume 0.22 (the files run hot). Pete found
the old whoosh placeholders (`terraceWhooshCape`, `gauntletPick`) unneeded, so
`WALL_FALL_WHOOSH_ENABLED` is false. Impact tails run 2.1 s / 2.9 s (untrimmed). Impact source
licences are not confirmed (see `LICENSES.md`). A dev `FALL 3` button sits in the `__DEV__`
overlay beside BOSS. Lessons: do not interpolate unattached/at-rest
native values (the wall vanished when the real wall was scaled through an interpolation), start
native animations after the target view mounts, and never end a native animation with a clock that
can fire before it finishes. A second fall starting while one plays does not replay (needs two
breaks within ~0.5 s; breaking resets the streak, so unlikely).

UNTRAPPABLE armor (2026-11-02, works on device; Pete: "I like E a lot"). ENGINE: while `isArmored(game)`
(`chainMultiplier >= 2.5`, i.e. streak >= 9, and not `gauntletActive`) a wrong swipe costs no feather
(`resolveWrongSwipeLoss` in `polyRunEngine.ts`, checked before Mercy); the word still counts wrong,
streak and chain reset, FELL OFF still fires (severity 3). State `armorAbsorbed` (UI flag, cleared by
`consumeArmor`) and `armorUsed` (per-run count for a future share line). Works at any feather count.
LOOK (`TopBar` in `GameScreen.tsx`): the whole top bar is a slab with two faces. Front = the normal
HUD; back = UNTRAPPABLE only. `tb.flipStage` holds a front `Animated.View` (`tb.flipFace`, rotateX
0 to 180) around `tb.root` and an absolute back view (`tb.armorBack`, rotateX 180 to 360), with
`backfaceVisibility: hidden`, perspective 900. Flip in 340 ms (`ARMOR_FLIP_IN_MS`, Pete asked for
faster), back on a fall in 280 ms (`ARMOR_FLIP_BACK_MS`, back-ease). `tb.root` must NOT be `flex: 1`
inside the slab (it collapsed the HUD; fixed). Back face = HUD dark `rgba(11,9,32,0.95)`, BONE
`ArmorWord` (`ARMOR_BACK_FACE` `#F2EBDA`) with a tight gold rim (`ARMOR_BACK_GLOW`
`rgba(201,162,75,0.95)` at `ARMOR_BACK_RIM_RADIUS` 7, a text shadow hugging the letters, not a
bloom), a white copy pulsing over it (white-hot), a breathing gold ring and
inner glow, and a skewed light band sweeping across. (2026-11-03, Pete's mock-up D: the earlier
flat gold `#FFE680` at radius 16 was too yellow. The rim is a shadow and NOT a second text node,
because PlaqueText and the dropped extrusion both showed layered copies separate into visible
duplicate words on device.) Pulse, jitter, sweep speed and whiteness rise
by level = clamp(floor((streak-9)/3), 0, 3) (streak 9, 12, 15, 18+); all in `ARMOR_*` constants.
No feathers, no extrusion, no cracks (Pete rejected them; extrusion smeared on device). ROUND CHIPS
DO draw on the back face (2026-11-03): without them the flip hid which word the player was on for as
long as armor held. The back-face `RoundChips` takes NO `targetRef` — two views must never share one
RefObject, or the later one to mount overwrites `.current` and the lesson spotlight measures the wrong
box. `ARMOR_WORD_HEIGHT_FIT` 1.28 sizes the word to a fraction of its box instead of filling it, so it
no longer sits flush against the chips with its rim spilling over them. Reduce Motion:
no rotation or loops, instant swap. SOUND: `armorFlipChime` (`assets/audio/sfx/armor_flip_chime.mp3`,
a shortened, quickened cut of `mystical_chime.mp3`, 1.03 s, volume 0.45, cooldown 1500), played as the
flip starts, only on entering armor (not on remount, not on the way back; the wall fall covers the way
back). SECOND CUE (2026-11-03): `armorFlipTurn` (`assets/audio/sfx/armor_flip_turn.mp3`, Pete's
Freesound page-flip riffle, +8.5 dB applied to reach -14.8 LUFS, peak -0.3 dBFS, no compression,
volume 0.58) fires at the same instant. The riffle runs 20-360 ms and covers the 340 ms turn; the
chime only reads from about 340 ms and so lands as the slab settles. The chime is the SHINE, the
riffle is the TURN. Before this the flip was silent and Pete heard the sound arrive after the slab
had already landed. The riffle's source is recorded in `LICENSES.md` (2026-11-06: Pixabay file 47177, credited qubodup / Freesound; its licence summary was not checked).
`warmArmorFlipSfx()` preloads both. HUNTED vs streak: `resolveLiveHuntControl` shows HUNTED only
when `lives <= 1 && readTier === 'steady'`; from SHARP up the streak tier shows, and the wall, glow and
shake follow the same resolver. FLASHES: tier-up and FELL OFF flash the WORD (white `Animated.Text`
copies, `tb.controlLabelFlash`), not a box behind it. `showFellOffText` also follows
`fellOffSeverity !== null` so no STEADY frame shows before FELL OFF. Wall fall haze (`GraphicGround`
`HAZE_EDGE` `rgba(10,5,20,0.5)`) is dark so the pit edges blend. Dev button `ARMOR STEP` cycles the
streak 0/9/12/15/18; `FALL 3` also stays. Tests: `huntControl.test.ts`, 'ARMOR' block in
`polyRunEngine.test.ts`. OPEN: feather texture on the back face, share line (parked; check
`bestCombo` first). DONE 2026-11-03: round chips, the armor HUD lesson and the stale SHARP lesson
text (see "First-Run Onboarding").

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
  `#B388FF`, UNTRAPPABLE gold `#F5C842`. HUNTED (lives <= 1 AND streak tier still STEADY; from SHARP up
  the streak tier shows instead, 2026-11-02) turns the HUD word `PW.color.rose`
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
- Hunt pause button position (2026-11-06, `e31898c`): bottom-right of the play area, below every Polly bubble
  (`tb.pauseBtn` right 10, bottom 8, zIndex 200). The 'pointing' bubble (Hunt intro, Haunt intro, Boss entry,
  hesitation heckle; `bubbleWrapPointing` left 205, bottom 76) reaches the right screen edge and used to overlap
  the button at the old bottom 74. The `__DEV__` overlay stack (`styles.devBossOverlay`) sits above it at bottom 58.
  The pointing bubble still touches the right edge on a 375 pt phone; Pete accepted that.

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
- ARMOR LESSON (2026-11-03): a fifth HUD lesson, `armor`, due the first time `isArmored(game)` is
  true on an ordinary word. Armor is durable state, not a one-frame event, so a first UNTRAPPABLE
  reached on Polly's Word or a Returning Haunt (where no lesson lands) simply waits for the next
  ordinary word; no pending seed is needed. It spotlights a FOURTH `HudLessonTarget`, `momentumBar`
  (the whole flip slab), because the run meter on the front face is turned away while armored.
  GameScreen keeps two maps: `hudTargets` (one ref per view, given to TopBar) and
  `hudLessonTargets` (given to HudLessonLayer, which swaps `streak` for `momentumBar` while
  `isArmored`). Copy stands alone — a clean run can reach UNTRAPPABLE having never lost a feather,
  so it says "a wrong call can't cost you a LIFE", not "feather". Polly is `rattled` and says
  "I'll wait." `createHudLessonState` always returns `armor: false`, and `hydrateHudLessons` reads
  `saved.armor === true`, so EXISTING saves are still taught it once: armor shipped later than every
  save in the wild and must never inherit the established-player default. Telemetry:
  `onboarding_hud_armor_completed`.
- The run-meter (`multiplier`) lesson no longer promises a score or 3x, neither of which exists. It
  now ends on "REACH UNTRAPPABLE AND POLLY CAN'T TOUCH YOUR FEATHERS", which the armor lesson pays
  off. Exact copy for every lesson is pinned by `hudLessons.test.ts`.
- DEV: a `REPLAY LESSONS` button (`__DEV__` only, beside BOSS / FALL 3 / ARMOR STEP) clears every HUD
  lesson flag via `devReplayHudLessons` and sets the streak to 9, so the run-meter lesson lands first
  and the armor lesson right after, without Settings > Reset Progress wiping real progress.
- ROUND CHIPS geometry (2026-11-03): 26 pt wide, 5 pt gaps. A ten-round row measured 343 pt against
  321 pt of usable bar width at 375 pt and overflowed about 11 pt a side, clipping on BOTH faces;
  unnoticed because the front border is a dim line and first-run testing uses the 8-round fledgling
  arc, where it fit. 26 + 5 measures 305. Still tight on a 320 pt screen.
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
- Won: the gold Master book stays mastered. The Master plaque shrinks to a dot (220 ms) and the
  crown-led KING plaque pops up from it (spring, with a short gold shine over the art). The KING
  plaque now carries the carved word `KING` under the crown (Pete, 2026-10-30; this reverses the
  old "no literal KING text" ruling); the Boss word stays live text beneath it (42 on the MASTER
  card, 50 on KING; the longest possible Boss word, EXCHANGE, was checked to fit). Results
  label/share text read KING.
- Start-up rule: `useReducedMotionPreference()` returns `null` until the system value loads.
  `RematchOutcomePlaque` waits (`if (reduceMotion === null) return;`). Treating `null` as reduced
  motion made BUSTER/KING start already on the final plaque.
- Rematch plaque sounds (all timings are in `RematchOutcomePlaque.tsx`): the MASTER lead-in card
  plays `masteredFanfare` (the same trumpet fanfare as the first MASTERED card) plus the mastery
  haptic. KING: `kingSwoosh` (its peak lands at the pop), then `kingFanfare` at the pop. BUSTER:
  the BU-drop punch (`streakBreakImpact`) as before, then `busterFail` 250 ms after the punch
  (`BUSTER_FAIL_AFTER_PUNCH_MS`). The same sounds play with Reduce Motion on.
- Dynamic plaque lettering uses `PlaqueText.tsx` as one Text node with material shadow. Do not
  restore the old three-layer text stack; it separated into visible duplicate words on-device.
- Normal Boss/rematch event labels are `POLLY'S WORD` / `MASTER'S REMATCH`. Player-facing Boss
  score, mastery-point and `2x` framing are retired; internal scoring remains unchanged.

### Result plaques

- Mastered, Banished and Haunted show ONLY the headline and the word. (Returning Haunt LOSS adds one
  live word, STILL; see below.) Removed: "Not one of Polly's
  traps. / You saw through it.", HAUNT BROKEN, and the Haunted missed phrase / TRAP CLAIMED lines
  (never show a meaning, trap or hidden pair: words recur, so it becomes an answer key).
- The fixed headline is CARVED INTO THE ART ("lettered" plaques, 2026-10-30); only the round's word
  is live text (`PlaqueText`, inside a `...PlaqueWordSlot` view in `MaskBoard.tsx`). Art:
  `assets/images/results/mastered-result-plaque-lettered.png` (MASTERED, Cinzel Black; word
  `carvedGoldPlaque`, size 53), `haunted-result-plaque-lettered.png` (HAUNTED, Caesar Dressing; word
  `carvedStonePlaque`, 61), `banished-result-plaque-lettered.png` (BANISHED, Caesar Dressing,
  chipped and cracked; word `carvedStonePlaque`, 55), `king-result-plaque.png` (KING baked in). The
  empty cleaned frames are kept: `mastered-result-plaque.png` is STILL USED by the rematch MASTER
  card; the empty haunted/banished frames are unreferenced. To change a headline, re-carve the art
  (the renderer is not in the repo); do not draw it as live text again.
- Returning Haunt LOSS card (Pete, 2026-11-02, locked "it looks good"): the non-boss branch of
  `HauntedOutcomeOverlay` (`MaskBoard.tsx`) reuses `haunted-result-plaque-lettered.png` through the
  full scrim (`outcomeOverlay`, like BANISHED), not the boss `plaqueOverlay`. The art already says
  HAUNTED, so STILL is live `PlaqueText` (`carvedStonePlaque`, 44, letter spacing 10) in the gap under
  it (`hauntedStillSlot`, top 40.5%); the round's word sits lower than on the boss plaque
  (`hauntedStillWordSlot`, top 56%, size 61). STILL drops in 46 px with an overshoot (240 ms,
  `HAUNT_STILL_*` constants) 620 ms after the plaque appears, with the same punch + haptic as BU
  landing in BUSTER (`resolveRematchLossFeedback`: `streakBreakImpact` + `fellOffSmall`). Reduce
  Motion: STILL shows at once, punch still fires. The old generic panel ("Polly's trap held. It'll be
  waiting.", "Trap claimed: ...") is gone; no trap or meaning text. The boss Haunted plaque is
  unchanged. The in-round purple STILL HAUNTED stamp before the card is unchanged. Unused now:
  `hauntedOutcomePanel`, `hauntedHaze`, `hauntedOutcomeHeadline` styles and `drift` in the overlay.
- The live word must match the carved headline's ink; `carvedStonePlaque.face` is `#3E3A55`, measured
  from the baked headline. See `assets/images/results/README.md`.
- Mastered card sound: `masteredFanfare` (after the transform; the book slam is unchanged). The old
  `masteredResult` sting was removed from the code (its .wav file `mastered_result_sting_v1.wav` is
  left unreferenced in `assets/audio/sfx`); `resolveBossOutcomePlaqueFeedback('mastered')` now
  returns `masteredFanfare`, and both cards play whatever it returns.
  Haunted plays `hauntedResult`; Banished has no card sound.
- The BUSTER final plaque and the MASTER lead-in keep live text (headline 36, word 42, CONTINUE 18);
  they are not carved.
- DEV only (Settings, Development): previews for KING, KING with the longest word, BUSTER and the
  MASTERED / HAUNTED / BANISHED plaques (`DevRematchOutcomePreviewScreen`,
  `DevOutcomePlaquePreviewScreen`).
- `splitHauntedDetail` and the `plaqueDanger*` styles in `MaskBoard.tsx` are now unused (left in place).

### PlaqueText materials

- `carvedStonePlaque`: face `#3E3A55` (matches the carved headline ink), depth
  `rgba(238,236,252,0.8)`, tight edge via the optional `edgeOffset` / `edgeRadius`.
- `carvedGoldPlaque` (2026-10-30): deep purple face `#4A1E80` with a pale-gold rim, for the word on
  the gold plaques (Mastered result card, KING).
- The existing stone/gold/purple materials are unchanged. All are pinned by
  `plaqueTextMaterial.test.ts`.

### Plaque sound files (`assets/audio/sfx`)

`king_swoosh.mp3`, `mastered_fanfare.mp3`, `king_fanfare.mp3` (trimmed to 3.6 s), `buster_fail.mp3`
(trimmed to 2.3 s). All Pixabay Content License; see `assets/audio/LICENSES.md` (source page URLs
not recorded). Volumes in `sfx.ts` are first-guess values that Pete approved by ear on 2026-10-30.
Files copied through the device tool get an ID3 block (MP3) or a `caBX` chunk (PNG) injected:
strip it before committing. The two armor flip MP3s carried such a tag (a C2PA/GEOB frame) and were stripped
losslessly in `4a4cfda` (`ffmpeg -c copy -map_metadata -1 -write_id3v2 0`; decoded MD5 identical).

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
  the Daily opens and when Home is focused. A Daily screen left open across midnight cannot finish
  the old session: the guards listed under Expiry end it at the next interaction or app return.
- Expiry: an unfinished Daily is LOST when its day ends. No result, no streak credit, no Gold
  Feather; a new puzzle starts. The player sees one plain card (no Polly, no button): headline
  "TIME'S UP", small line "DAILY #N" (N = the unfinished Daily's own number). It holds 2.5 s then
  fades; a tap closes it sooner. It shows once, also when they come back the next day. Files:
  `app/game/dailyExpiry.ts` (`isDailySessionExpired`, `readExpiredDailyNumber`),
  `app/ui/dailyExpiredCopy.ts` (words; change only on Pete's word), `app/components/DailyExpiredCard.tsx`,
  store `dailyExpiredNotice` + AsyncStorage key `polywords_daily_expired_notice_v1`. Detection is in
  `loadDailyResult`; guards in `DailyChallengeScreen` (`handleContinue`, `handleClaimStart`,
  `handleClaim`, AppState active). Known gap: the 250 ms clue timer does not check for midnight; the
  card appears at the next interaction or app return.

Entry card (2026-11-04). The card behind the start button is the Daily's ONLY teaching surface and
also its attempt gate: opening the Daily is free, pressing ACCEPT CHALLENGE spends the one attempt.
It can therefore never stop appearing, or a mis-tap on the Home plaque would burn the day. What
changes is how much it says. The first time an install presses ACCEPT CHALLENGE it shows the full
explanation; every day after it is the short gate plus HOW TO PLAY, which reopens exactly the same
lines from the same constants, so the two can never drift apart. The flag is
`DAILY_INTRO_SEEN_KEY` (`polywords_daily_intro_seen`) in `app/constants/storageKeys.ts`, beside the
Boss and Haunt one-time gates, read and written by the screen rather than the store (their pattern).
It is marked when ACCEPT CHALLENGE is pressed, NOT on render, so backing out with NOT NOW leaves the
explanation intact. The read happens inside the same `init` that flips `dailyInitialized`, so the
card never renders before the answer is known. It can NOT be folded into `isReadyToStart`:
`PollyDailyPerch` renders OUTSIDE the session guard and keys its `show` off that flag, so gating it
would flash Polly onto the entry screen. A failed read leaves the flag true — short card, never a
repeat lecture — exactly as Boss and Haunt fail closed. `resetProgressForDev` clears it (long card);
`resetDailyForDev` deliberately does NOT (short card), so both states are testable with buttons that
already exist.
- Every word lives in `app/ui/dailyEntryCopy.ts`, like `dailyPauseCopy.ts` and `dailyExpiredCopy.ts`.
  Change the copy only on Pete's word.
- The card scrolls (`startScroll` / `startGate`) and sits 10 pt from each edge so the long version
  cannot clip on a short phone. Measured 2026-11-04: long card 650 pt, short card 408 pt (before the 6 Nov tease line `ANSWER fast. Surprise Polly.`, which adds one rule line, not re-measured); the long
  one fits a 390x844 screen whole and scrolls on a 375x667.
- THREE buttons, descending weight: ACCEPT CHALLENGE (gold fill), NOT NOW (outline plus faint fill,
  the game's own secondary copied from `DailyPauseCard` `actionSecondary`), HOW TO PLAY (outline
  only). NOT NOW was a bare text line and did not read as pressable under a gold primary (Pete).
- The card says LIVES, not feathers, though the HUD draws two feathers: the reward is a GOLD
  FEATHER, so on this card the word "feather" only ever means the reward (Pete).
- A jab is the last line on both cards. `DAILY_ENTRY_TAUNT_FIRST` is fixed on the first-run card;
  `DAILY_ENTRY_TAUNTS` (six lines) rotates on the short card by `challengeNumber % length`, so it is
  the same all day and different tomorrow. VOICE: these are the GAME needling the player ABOUT
  Polly, third person on purpose — NOT her dialogue, which is first person and governed by
  `docs/POLLY_DIALOGUE_BANK.md`. A first-person draft was rejected: in her own mouth the lines read
  as the rules explaining themselves instead of the game having a dig.
- Line budget: a rule line fits ONE line at 19 pt in the card's 326 pt text column on a 390 pt
  screen, a jab at 18 pt. Most wrap on a 320 pt screen, which is accepted because the jab is last
  and the card scrolls. Measure before adding copy; a wrapped rule line breaks the one-idea-per-line
  rhythm the list exists for.
- Nothing on the card may claim the clues get easier. `docs/DAILY_CONTENT_WRITING_STANDARD.md` orders
  them hardest-to-easiest only "when that improves the progression", and the live pool varies.

The castle gold hit is NOT graded by clue count (2026-11-04). A graded version was built
(`GOLD_HIT_GRADE`, `scaleOpacity`, `scaleBloom` and a `goldHitGrade` prop threaded to
`DailyCastleStage`); Pete found no readable difference on device and it was removed, so
`dailyGoldHitKeyframes(calm)` takes one argument again. The clue-count grading of the CLAIM HAPTIC
stays (`resolveDailyCelebrationGrade` / `dailyCelebrationHaptic` in `dailyClaimPresentation.ts`).
The payoff for solving early is the breach (see "THE BREACH" in `CONTEXT.md`), not lighting.

Polly's one-clue blast-off (2026-11-06, `74db273`, Pete on device: "perfect"). On a smash (zero or one clue) she is
no longer hopped back onto the perch: she is blown off the screen and flies back. `smashTimeline()` in
`app/ui/pollyDailyBreach.ts`: yell 130, crouch 130, launch 120, the blast 1000 ms (`jumpAngry`; y ease-out quad,
x ease-in quad so she goes up before she sweeps back, rotation linear to -540 deg, ending at
`POLLY_BLOWN_AWAY.exit` (-240, -800)), gone 300, flight back 650 on `fly` from `returnFrom` (-60, -800) with the
arrival's ease, landing bounce 130 in `angry`, then a 500 ms hold. The move is 2960 ms (segments and hold in
`dailyBreach.ts`: `DAILY_BREACH_POLLY_SMASH_MOVE_SEGMENTS_MS`, `_HOLD_MS`); `dailyBreachPollyMoveEndMs` still delays
the win beat by it. All numbers are TEST VALUES. The first build (blast 520 ms, ease-out cubic) was a blur because
she was off a typical phone in about 200 ms; keep her on screen for about half a second of the tumble. The exit
distances assume the perch sits about 55% down a phone; a screen taller than about 930 pt would need larger values.
The two lightning bolts fire at about contact +110 / +190 ms, so they land while she tumbles; Pete likes that she
looks struck. NO new sound: the throw already plays `playPollyReaction('angry')` and the contact (380 ms)
`playPollyReaction('startled')`, both random picks (Pete heard the pair and likes it). Reduce Motion has no tier
move. `POLLY_FURY` was renamed `POLLY_BLOWN_AWAY`; the old apex, mid-air shake and fall are gone. Rotation past
360 deg works on the perch (its interpolation extends).

## Text sizes

Pete, 2026-10-29: nothing below ~18 for copy.

- Polly speech bubble default 23 (line height 25) via `POLLY_BUBBLE_FONT_SIZE` /
  `POLLY_BUBBLE_LINE_HEIGHT` in `PollySpeechBubble.tsx`, Results included.
- Onboarding, HUD lesson, Boss/Haunt intro and Daily entry card text enlarged (numbers only).

## Audio and Haptics

- App owns audio lifetime; screens claim music only while focused.
- Loudness is partly asset-level. Measure/normalize files before blaming player volume.
- `cueAsync` in `app/utils/haptics.ts` is the only haptic gateway. Its only gate is Settings ▸
  Haptics, checked once when a cue starts; follow-up `setTimeout` pulses are not re-checked.
  Heavy was kept for Boss beats; Pete overrode that on 2026-11-06 for the Hunt cues named below
  (wrong swipe, book shut, the claim and trap-reject tails, the card press). The UNTRAPPABLE press and the
  Daily's lost-chance impact were earlier exceptions. The Daily keeps its own cues (`pressSteady` Light,
  `wrong`, `standardCorrect`, `claimMedium`, `heightenedCorrect`); the Hunt fires separate `hunt*` cues so the
  two never share a body. All 2026-11-06 haptic values are TEST VALUES, felt and approved on Pete's phone.
- Hunt card press-down fires one cue by momentum (`resolvePressHapticCue`, `huntFeedbackPolicy.ts`,
  tested; raised one notch 2026-11-06): STEADY Medium (`huntPressSteady`; the Daily's `pressSteady` stays
  Light), SHARP Medium, RAZOR SHARP and HUNTED Rigid then Medium +40 ms, UNTRAPPABLE Heavy.
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
- Hunt wrong-swipe sound (Pete, 2026-11-06, `ff24714`): EVERY wrong swipe (up or right, normal or gauntlet
  card, broken chain or not) plays `wrongSlap` at judgement (`assets/audio/sfx/wrong_slap.mp3`: the SECOND of
  five slaps in Pete's face-slap file, cut to 0.50 s; volume 0.54, about -17.0 LUFS effective), then
  `wrongImpact` (the whistle, as the card falls) `WRONG_FALL_WHISTLE_DELAY_MS` 125 ms later (TEST VALUE: the
  card's 70 + 55 ms sideways buzz, then the 420 ms fall). `resolveWrongSwipeSfx()` in `huntFeedbackPolicy.ts`
  returns that plan and takes no argument. The streak-break punch (`streakBreakImpact`) no longer plays on wrong
  swipes; BUSTER and the Haunt STILL card still use it. The Polly squawk rule is unchanged.
  `warmHuntSwipeSfx()` (called when the Hunt opens) preloads the slap, the whistle and the book slam.
- Hunt book shut (Pete, 2026-11-06, `5761ed0`, `7a0e94b`): `bookClose` is now `book_shut_door_slam.mp3`
  (volume 0.50, about -18.1 LUFS effective). The old `book_close_v2.mp3` came out near -28.9 effective and was
  never heard; it stays on disk, unreferenced. Pete wants the slam when the COVER shuts after an accepted card
  (a correct UP), not only at word exit: `BOOK_COVER_SHUT_SFX_DELAY_MS` 440 ms after `handleCardTouch` (equals
  `triggerBookOpen`'s 120 open + 200 hold + 120 close; change them together), with a Heavy thump (`bookShut`)
  in the same timer callback. A new card cancels the pending slam and thump, so only the last cover close
  sounds; it plays with Reduce Motion on; the timer is cleared on unmount. The word-exit slam (`onWordExit`, with
  `bookShut` replacing the old `selectionAsync`) and the Haunt-rematch book shut still call `bookClose`; on the
  last card of a word Pete hears one slam and likes it, so leave that alone. Source pages for
  `wrong_slap.mp3` (freesound_community, id 48025) and `book_shut_door_slam.mp3` (soundreality, id 172171) are
  recorded in `assets/audio/LICENSES.md` (2026-11-06); their licence summaries were not checked.
- Outcome strength follows the ROUND (`step.hapticTier` from the pacing phase in
  `huntGenerator.ts`), not momentum, by design (Pete, 2026-10-11). Light rounds 1-4; medium 5-7
  standard / 5-6 fledgling; heavy 8-10 / 7-8; a Returning Haunt round is heavy and the round after
  it light. Claim (2026-11-06, Hunt-only cue names): `huntStandardCorrect` Medium + Soft +70 /
  `huntClaimMedium` Medium + Medium +90 / `huntHeightenedCorrect` Medium + Heavy +90. Trap: `trapRejectLight`,
  `trapRejectMedium` and `trapRejectHeavy` are ALL Medium + Heavy +90 for now. The old Rigid-led shapes were not
  felt AT ALL on device (Pete; a device log showed the cue firing with the shatter, so it was the shape, not the
  wiring); the three tiers stay identical until Pete wants them tiered again (names and the round-tier mapping
  are kept). So a trap reject now feels like a heavy-tier claim in the hand; the sound tells them apart.
  Wrong swipe: `huntWrong` Rigid + Heavy +60 (was notification Error; the Daily keeps `wrong`). Book shut:
  `bookShut`, one Heavy. Only `fellOff*` follows momentum (the chain before the miss:
  SHARP small, RAZOR SHARP medium, UNTRAPPABLE big, STEADY none). Tier-ups have three escalating
  shapes. `huntFeedbackPolicy.ts` picks the cue; shapes live in `haptics.ts`.
- Known haptic risks, not fixed: below ~25 fps a card can exit (1350 ms safety timer) before
  reaching the book, leaving its claim cue to fire one card late; the trap cue still waits in a single
  slot for the card's position measurement (checked on device 2026-11-06: `measure` answered and the cue fired
  1 ms later, so that was not why trap rejects went unfelt); a tier-up can land 0-35 ms from the
  trap cue and mask it. The wrong swipe now stacks `huntWrong` (Rigid + Heavy) with the `fellOff*` pulses
  at release; Pete felt it and was happy, but it was not tuned separately.
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
- Daily perch sound: silent on right answers (`correct`); `pollySqwawkShort` on the first miss;
  `pollySqwawkLaugh` on the lost last chance; the win plays a random startled sound as the
  `shocked` pose is set and a random angry sound as she flies off (`runFlyOut('flyAngry')`). An
  explicit allow-list, so new reactions default to quiet.
- Polly reaction pools (Pete, 31 Oct 2026, wordless): ANGRY = `pollyAngry1..6`, STARTLED =
  `pollyStartled1..4`. Pools and the pure picker `pickReactionSfx` (never the same sound twice in
  a row within a group) live in `app/game/pollyVisitPolicy.ts`; `app/audio/pollyReactionSfx.ts` is
  the thin caller that remembers the last pick per group, shared by Hunt and Daily. `VisitSpec`
  has `sfxGroup?: 'startled'` (played at landing) and `exitSfxGroup?: 'angry'` (played when the
  exit starts, in every exit path). Wired: Hunt win (both mastered events) angry on fly-off; Daily
  win startled at landing and angry on fly-off; first Hunt clean sweep startled at landing (the
  repeat clean sweep is silent). Volumes 0.42 are first guesses, tuned by ear.
- Streak x10 visit: no landing sound; `VisitSpec.exitSfx: 'pollyEmbarrassedExit'` plays when she
  flies off (every exit path). RAZOR SHARP: `shouldPlayRazorStartle` (`huntFeedbackPolicy.ts`)
  plays one startled pick the first time momentum reaches RAZOR SHARP in a run (module-level
  `lastRazorStartleRunSeed` in `GameScreen.tsx`); muted while the HUD is hidden (lesson, pause,
  exit confirm) and during an unfinished first-run onboarding run. Both are Claude's first guesses
  (Pete judges by ear). `pollyLaughChamp` and `pollyLaughBurst8` are in the repo but not placed.
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
  Haunted gloat exits `flyGrin` but holds the perch, so that exit is rarely seen. A lost Returning Haunt fires `hauntMasterFailed` (the silent gloat) and 400 ms
  later `hauntFailed`, whose `HAUNT_FAILED_LAUGH` visit hard-cuts the gloat; its bubble is `huntHauntChant`
  ("Trap. Trap. Trap.", 2026-11-06, `ad27b36`; committed before Pete saw it on device) with the
  `pollySqwawkLaugh` squawk. `huntLaugh` still serves the game-over laugh. Boss entry
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
