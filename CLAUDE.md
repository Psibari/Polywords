# POLYWORDS Architecture

`AGENTS.md` owns authority/workflow. `CONTEXT.md` owns current branches, priorities and open work.
Focused product rules live in `docs/`. Runtime code/data outrank every doc.

> Never write a count `npm run state` can print. Counts rot; the command does not.

## Source Map

| Area | Owner |
| --- | --- |
| Hunt rules, scoring, onboarding | `docs/GAME_REFERENCE.md` |
| Hunt pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt writing (master, Pete) | `docs/CONTENT_WRITING_BIBLE.md` (wins where documents disagree) |
| Hunt editorial law, data boundary | `docs/CONTENT_WRITING_STANDARD.md` |
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
- `assets/favicon.png` (48x48) is still the Expo starter's black-and-white cubes icon from the first commit. `app.json` uses it ONLY as the web favicon, so it shows in a browser tab when Pete tests the web build (seen 2026-11-07). It is not the Android or iOS icon; Android uses `adaptive-icon.png` (checked 2026-11-07). Swap it for a small crown only if Pete asks.

### iOS expo-audio watchdog patch (SDK 57)

- `expo-audio 57.0.5` carries the official iOS watchdog fix as `patches/expo-audio+57.0.5.patch`, applied by `patch-package` from `postinstall`.
- `tools/expoAudioPatch.test.mjs` is a regression guard and runs in normal `npm test`. Do not delete the patch, bypass the guard, or upgrade SDK merely to remove it. Retire it only when an intentional native/SDK upgrade contains the fix and passes device background/foreground verification.

### Audio rebuild after a long absence (2026-11-07)

- A build 17 TestFlight crash (watchdog `0x8BADF00D`) froze Pete's phone on the first sound after returning from the background (he tapped Polybook), then iOS killed the app. The main thread sat in `AVPlayerItem currentMediaSelection` and another thread in `SetRate`, both waiting on `mediaplaybackd`; no app code was running. The patch above covers `currentDate` / `currentTime` only, not this path.
- Fix (written and `npm test` clean; device-proven by Pete on his phone, 2026-11-08): `App.tsx`'s AppState handler times the absence (`createAwayTracker` in `app/audio/audioResumePolicy.ts`). On return after `AUDIO_REBUILD_AFTER_AWAY_MS` (60 s, TEST VALUE) it calls `rebuildSfxAfterAbsence()` (`sfx.ts`: `unloadSfx`, `resetAudioSessionConfiguration`, `preloadSfx`) and `rebuildMusicPlayerAfterAbsence()` (`MusicEngine.ts`), then `setMusicAppActive(true)`. A short app switch changes nothing. Apple's guidance after a media-service reset is to recreate audio objects and set the session up again.
- Pinned by tests: `audioResumePolicy.test.ts` (threshold, tracker) and `audioResumeWiring.test.mjs` (rebuild runs before music resumes; the stale music player may only be `remove()`d, never read or driven, because a stale player can block its caller).
- Known costs: cues a screen warmed ahead of time (`warm*Sfx`) load on first play again after a long absence. Whether `remove()` on a dead player can itself hang is unknown.
- Cause NOT confirmed: nothing proves iOS restarted its media service on Pete's phone. Pause-on-leaving was considered and rejected as the main fix: music already fades and pauses on leaving, and the freeze began in the foreground after the return.

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
  in `recordRunComplete` (streaks, mood). A rematch win is counted in `progress.kingWins` (Polybook KING tally) and nowhere else.
- KING counter (2026-11-10, `40e1baa`): `kingWins` and `lastKingWinId` (both optional, like other late fields) in `PlayerProgress`. Incremented in the store at the moment the last hidden card is judged (`resolveMystery`, the `isMasteryRematch` win branch), the same moment and one-time guard as normal Boss mastery. `lastKingWinId` (run seed:round:WORD) is saved in the same write so a Hunt restored after the app was killed before its debounced save cannot count the same win twice. `loadProgress` sanitizes: missing, negative, fractional or non-number becomes 0. `resetProgressForDev` resets it; `resetDailyForDev` does not. Logic and tests: `app/game/kingWins.ts`. Device-proven (Pete, his phone, 2026-11-10): a Master's Rematch win moved KING from 0 to 1 exactly once; KING stayed 1 after reopening the Polybook; a lost rematch left KING at 1, MASTERED unchanged, and created no Haunt (MASTERED showed 1 because Pete first beat a Boss with the BOSS button).
- DEV REMATCH button (2026-11-10, `da4ad05`, `__DEV__` only, after BOSS CRISIS): `applyDevMasteryRematch` (`app/game/devMasteryRematch.ts`) swaps the Hunt's Boss step for a real rematch step built by the generator's own `buildWordStep` (via `buildMasteryRematchStepForDev` in `huntGenerator.ts`), then runs the normal BOSS jump; judging, KING +1 on a win and no Haunt on a loss are the real code. Word: the first mastered word with hidden content that is not already in the Hunt and has no active Haunt, else this Hunt's own Boss word; with none usable it does nothing. States a normal Hunt cannot reach: a rematch while unbeaten Boss words remain; a rematch on a never-mastered word (a win still adds KING +1 and no crown); Polly's Word replaced and rounds skipped, as BOSS does. Finishing such a Hunt records it as a normal Hunt (quit from the pause menu to avoid that). Device-proven with the KING counter (Pete, his phone, 2026-11-10): a Master's Rematch win moved KING from 0 to 1 exactly once; KING stayed 1 after reopening the Polybook; a lost rematch left KING at 1, MASTERED unchanged, and created no Haunt.
- PINNED BOSS (Pete, 2026-11-12): the Boss stays the same Hunt after Hunt until the player REACHES it. `startGame` passes `progress.pinnedBossWord` to `generateHunt`, which uses it as the Boss only while it is still eligible (in the bank, has Boss content, not mastered, not a Haunt, not already in the Hunt); otherwise the normal pick runs. The store then saves the new Hunt's Boss as the pin right at Hunt start (`pinnedBossForHunt`, `app/game/pinnedBoss.ts`), so dying early, quitting from the pause menu or closing the app keeps it. Reaching the Boss settles it either way with no extra code: a win masters it, a loss makes it a Haunt (it returns at round 5 as now), and both make it ineligible, so the next Hunt pins a new Boss. A Master's Rematch pins nothing. `loadProgress` drops bad saved values; Reset Progress clears it. With no pin the generator output is unchanged. Pete also ruled: the ordinary word the player died on does NOT come back (normal recent-word rotation). Tests: `app/game/pinnedBoss.test.ts`.
- GPS arc: Confidence → Flow → Tension → Panic → Boss. `docs/GOLDEN_PACING_SYSTEM.md` owns the
  product rhythm; `huntGenerator.ts` owns executable pools/fallbacks.
- ORDINARY WORDS PICK BY DIFFICULTY, NOT gpsTag (Pete, 2026-11-13). The phase still sets each round's role,
  haptics and Polly beats, but the word comes from difficulty: Confidence (rounds 1-2) easy; Flow (3-4) easy +
  medium; Tension (5-7) medium + hard + mastered returns; Panic (8-9) hard + mastered returns. Pools in
  `generateHunt`: `easyPool`, `earlyPool`, `latePool`, `hardPool`; only `boss` still matters as a tag. Reason:
  gpsTag locked words to late rounds (9 easy Panic words only in rounds 8-9), so early-dying players never met
  them. Unchanged: Boss, pin, Haunt slot, FINE, mastered returns (still rounds 5-9 only). Simulation (20 Hunts,
  200 players each): words never seen by round-5 players 70 -> 0, round-7 61 -> 0; round-3 players meet every
  easy and medium word, no hard ones (by design). `app/game/huntReachability.test.ts` pins it.
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
  FIXED 2026-11-07, DEVICE-CHECKED (Pete saw STEADY, SHARP, RAZOR SHARP and UNTRAPPABLE unclipped on POLYWORDS DEV: "look great"; the wrong-swipe red flash still shows around the unclipped card): candidate C, `styles.tile` in `SwipeMask.tsx` is now `overflow: 'visible'` (live cards grow to fit their text, so nothing needed the clip; undo = `'hidden'`). No retune needed; leave opacity and radius as they are. Original problem (Pete, 2026-10-11): the glow is nearly invisible on device. The same view
  (`styles.tile`) carries the glow and clips (overflow hidden, radius 20), and with no background
  the shadow is traced from `card-face.png`'s alpha (1410x604, painted x 31-1378, y 14-591; sides
  bow outward, corners far rounder than 20 pt). Only the ~6 pt side / ~3 pt top-bottom margin
  shows, as a flat hard-edged band. Raising radius or opacity cannot fix it; do not retune until
  the clip is dealt with. Candidate fixes: (C) drop the tile's clip and clip only the children that
  need it; (A) a sibling backing view with a copy of the transform; (B) move the transform to a new
  outer wrapper. Any backing shape must fit inside the painted silhouette. The black
  `deckTopCardSlot` shadow (0.24, r22, 16 pt down) is not the cause. Android: Android 9+ tints the
  elevation shadow with `shadowColor` but has no opacity, radius or offset; not handled yet.
- Deck placed from the wall ledge (2026-11-09, `81abbae`): the wall is drawn full width,
  bottom-anchored, so the ledge top sits at windowHeight − `LEDGE_OFFSET_RATIO` (about 0.58) ×
  windowWidth (`bossGauntletLedge.ts`), while the deck is laid out from the top. `tileTextLayout.ts`
  now pushes the deck DOWN (never up) so the active card overlaps the ledge by
  `LEDGE_ANCHOR_CARD_OVERLAP` 8 pt (TEST VALUE), with `ACTIVE_CARD_TOP_GAP` 6 (= SwipeMask
  `TILE_GAP`): `resolveLedgeTopInBoardViewport`, `resolveCardLedgeOverlap`,
  `resolveLedgeAnchoredBoardSpacing`. Inputs are measured: the board viewport height (`onLayout`),
  window width and `useSafeAreaInsets().bottom` (the viewport ends at the safe-area bottom), never
  `measureInWindow`, which picks up shake and wall-fall transforms. The space below shrinks first,
  never under 12, and the board never starts to scroll; short windows keep today's 110 / 48. The
  result goes through `applyBoardTopReserve` in `MaskBoard.tsx` (the onboarding caption band reads
  from it; Boss words use the same code). Pinned by `app/components/ledgeAnchoredDeck.test.ts`. The
  290 pt card width cap is unchanged. DEV-only readouts, bottom-left of the Hunt: `<w> x <h>  PR <n>
  font <scale>` (`DevWindowReadout`, `GameScreen.tsx`) and, just above it, `ledge card <overlap>
  push <pt>  inset <pt>` (`MaskBoard.tsx`). Pete's phone (iPhone 11, Display Zoom Larger Text)
  reports 375 x 812 at PR 2, bottom inset 31, measured overlap 8.6, push 0. NOT yet checked on a
  tall phone. On 430+ pt phones the pointing Polly bubble can cover the SWIPE RIGHT cue (Pete
  accepted).

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
- MERCY LESSON (2026-11-09, `22fcbe2`, gap fix `2e203db`): a sixth HUD lesson, `mercy`, due the
  first time Mercy revives on an ordinary word; once per save. Copy (pinned by `hudLessons.test.ts`):
  "YOU’RE OUT OF FEATHERS." / "POLLY GIVES {n} MERCY FEATHERS." / "ONCE PER HUNT." / "ONLY FOR YOUR
  FIRST {g} HUNTS." Polly (smug): "I wasn’t finished watching you lose." {n} is the revive amount
  stored with the pending card (`mercyPendingFeathers`) at the moment the revive fires (3 in Hunts
  1-3, 2 in Hunts 4-10), NEVER re-read from the current feathers (a DEV double-press showed 1 once).
  {g} = `GRACE_RUNS`. The four Mercy constants live in `app/game/mercyPolicy.ts` (the store imports
  them). Only a Hunt that reaches Results counts toward the 10; a pause-menu quit does not.
  Spotlight target: `feathers`. When the card owns the revive (`mercyLessonOwnsRevive`), GameScreen
  skips the POLLY ISN'T DONE WITH YOU float, squawk and haptic. The card claims a revive only if it
  can show on this word (cards left on the word, or the next step is an ordinary word): the board
  completes a word about a second after its last swipe, so on the last card before Polly's Word,
  before a Returning Haunt or at the end of the Hunt the float plays and the card waits for a later
  revive (gap found by trace, fixed in `2e203db`). Old saves load the flag false (like armor), so
  established players are taught once. Telemetry: `onboarding_hud_mercy_completed`. DEV: a MERCY
  button beside BOSS / FALL 3 / ARMOR STEP / REPLAY LESSONS sets feathers to 1 and arms the real
  revive (the Hunt's own amount, or 3 if it has none); it does nothing while any lesson is due or
  showing (`devMercyArmAllowed`), on Polly's Word, on a Returning Haunt or after game over. REPLAY
  LESSONS clears the mercy flag. Finishing a Hunt after using it still records that Hunt; quit it to
  keep progress clean.
- FEATHER LESSON (2026-11-09, `22fcbe2`): now three lines (THESE ARE YOUR FEATHERS. / THEY’RE YOUR
  LIVES. / WRONG CALLS COST ONE.); "LOSE THEM ALL, AND POLLY WINS THE HUNT." was cut (Pete: players
  know what zero feathers means, and it contradicted Mercy). Polly's reply is "I’ll take that one."
  (was "And you lost to a bird."), fired after CONTINUE. Taking a feather is the one possession
  exception in `docs/POLLY_DIALOGUE_BANK.md`.
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
- KING plaque art refreshed 2026-11-10 (`54eb44e`): the crown is Polly green; same 1375x1144 size. The carved KING now ends about 54.5% down the plaque (rows 537 to 623 of 1144). `kingWord.top` is 56.5% (TEST VALUE): PlaqueText's ink starts about 6 pt (2.2%) below its box top at size 50 (Bebas Neue, line height 54), so the live word sits about 4.3% below the carved KING, the same gap the old art had. Longest word EXCHANGE: ink bottom about 72% of the frame; the gold panel ends about 80.6%. Pete checked it on POLYWORDS DEV 2026-11-10 and it looked good. A faint pale patch around the crown remains in the art (Pete: the best he could get it). The 6 pt figure comes from reading React Native's iOS text code, not from a device measurement.
- The live word must match the carved headline's ink; `carvedStonePlaque.face` is `#3E3A55`, measured
  from the baked headline. See `assets/images/results/README.md`.
- Mastered card sound: `masteredFanfare` (after the transform; the book slam is unchanged). The old
  `masteredResult` sting was removed from the code (its .wav file `mastered_result_sting_v1.wav` is
  left unreferenced in `assets/audio/sfx`); `resolveBossOutcomePlaqueFeedback('mastered')` now
  returns `masteredFanfare`, and both cards play whatever it returns.
  Haunted plays `hauntedResult`; Banished has no card sound.
- The BUSTER final plaque and the MASTER lead-in keep live text (headline 36, word 42, CONTINUE 18);
  they are not carved.
- BUSTER lettering (2026-11-10, `2d8c6dd`): BUSTER's BU, STER, BUSTER and the round's word use PlaqueText material `raisedGoldPlaque` (face `#F5C842`, edge `rgba(42,12,64,0.85)`, edge offset 0.6 / 0.9, radius 0.8, all TEST VALUES). It replaced `purplePlaque`'s default amber `#8A5400` shadow (offset 1.25 / 1.9). `purplePlaque` is now unused and left in place. The MASTER lead-in still uses `goldPlaque`.
  - Device result (Pete, 2026-11-10): a temporary magenta face proved the material is wired in, but the look barely changed. Pete chose to stop there. Keep the gold; do not retune.
  - Why live: the MA drop / BU land / STER hold animation needs separate letters, so BUSTER cannot be a baked, carved headline like MASTERED, HAUNTED, BANISHED and KING. One text node has one text shadow, so a tight edge and a light rim cannot both be drawn.
  - If it is ever revisited: SVG text (`react-native-svg` is installed; it has no shrink-to-fit, and custom fonts in SVG text are unverified in this app) or carved MA / BU / STER pieces (the carved-lettering renderer is not in the repo). Neither has been tried.
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
strip it before committing. On 2026-11-10 `king-result-plaque.png` and `kingcrown.png` were committed (`54eb44e`, `ef44507`) WITH the `caBX` chunk the device tool added; stripped in `6bf7c4c` (pixels identical). Before every PNG commit list its chunks (IHDR, optional sRGB/gAMA/pHYs, IDAT, IEND only). `GoldenCrown.png`, `banishcrown.png`, `hauntcrown.png` and `Padlock.png` still carry `caBX` from earlier commits; left alone. The two armor flip MP3s carried such a tag (a C2PA/GEOB frame) and were stripped
losslessly in `4a4cfda` (`ffmpeg -c copy -map_metadata -1 -write_id3v2 0`; decoded MD5 identical).

## Polybook

- First-open layout (2026-11-07): `VaultScreen` takes its safe-area padding from `useSafeAreaInsets()`, not a `SafeAreaView`. The Polybook opens as a `transparentModal` from Home, and on the first open of an app launch its own `SafeAreaView` was suspected of reading zero insets (book drawn tall, title under the status bar; later opens were fine). Device-proven by Pete on his phone, 2026-11-08. `app/screens/vaultSafeArea.test.mjs` pins the choice. Polybook has no music and never has had (no music owner exists; Home's music stops on blur).

- Vault route is Polly's book. Current architecture: closed physical book → one large portrait
  page, not the retired miniature two-page spread.
- MASTERY page is a four-crown tally (2026-11-10, `ef44507`). Pete device-checked it on POLYWORDS DEV at normal and at max Text Size + Bold Text, with counts 0 and 123, and approved the look. Section id stays `"BEATEN"` (deep links use it); the ribbon label is MASTERY. 2x2, row by row: MASTERED, KING / BANISHED, HAUNTED; no paging. Crown art in `assets/images/results/`: `GoldenCrown.png`, `kingcrown.png` (Polly green, drawn by Pete, toned), `banishcrown.png`, `hauntcrown.png`. Pete ruled 2026-11-10 to keep `hauntcrown.png` on the tally even though the Results panel shows `Padlock.png` for haunted, so all four read as crowns. Counts: MASTERED = distinct `masteredWords`; KING = `progress.kingWins`; BANISHED = `pollyMemory.wordRivalries` entries with `banished` true; HAUNTED = distinct `wordId` in `ghosts` (active haunts only; a won Returning Haunt prunes the ghost and banishes the word). Pure code: `app/game/polybookTally.ts` (counts) and `app/ui/polybookTally.ts` (crown sizing by PAINTED width from measured bounding boxes, not file size; re-measure if the art changes). The crown width W is measured from the area under the heading, the MASTERY label and the rule, and the crowns shrink first at large Text Size. Count 48 pt Barlow Condensed Bold, label 18 pt. Polybook text still follows Text Size, but the tally text is capped at 1.6x (`maxFontSizeMultiplier`). On a very short page the label can drop to 17.9 pt (not seen on a device). DEV: a TALLY button on the page cycles all four counts REAL, 0, 1, 7, 48, 123 (display only, saved data untouched). The old per-word crown grid and its paging are gone; `polybook_crown.png` stays on disk, unreferenced.
- Tally known gaps (2026-11-10): BANISHED undercounts older saves. `wordRivalries` began 2026-10-03 (`4b636c1`) and nothing rebuilds it for older saves; banishes between 2026-09-04 and 2026-10-03 survive only in the journal log (`bookLog` `hauntBroken`, limited days) and earlier ones are recorded nowhere. A save from before the remove-on-win rule could hold a word in both `masteredWords` and `ghosts` and would count under both; real play cannot create that now. The tester's missing per-word crown (2026-11-09) is no longer visible on this page; its cause was never found.
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
- Clue length gate (Pete, 2026-11-12): every clue in `APPROVED_DAILY_POOL` (exported from
  `dailyChallengeEngine.ts`, so new pools are covered) must fit the plank in two lines
  (`dailyClueFitReport` in `dailyCastleScene.ts`); `dailyCastleScene.test.ts` lists every clue that
  does not. Writing cap `DAILY_CLUE_CHAR_CAP` 46 characters; `npm run daily:fit` checks a clue, a
  text file or a Daily workbook (`--xlsx`, header row `Word` plus `Clue ...` columns). Three-line
  clues were rejected (too cluttered); a clue that does not fit is shortened. `DailyGate.tsx` no
  longer uses `adjustsFontSizeToFit`: iOS shrank an overflowing clue (BOLT, Daily #154) to
  unreadable text. DEV `PICK PUZZLE` (`app/dev/DailyPuzzlePicker.tsx`, `applyDevDailyFirstWord`)
  plays any approved puzzle as round 1 today; LONG marks puzzles with a clue that does not fit.
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
- Gameplay text ignores the iPhone system text size (2026-11-09, `7580264`): every player-facing
  `Text` / `Animated.Text` in the Hunt, Results and the Daily carries `allowFontScaling={false}`.
  Reason: `tileTextLayout.ts` fits card text from an exact glyph table that assumes 1.0x, so iOS
  Dynamic Type or Bold Text clipped the last letter ("WHETHER YOU LIK"). `Text.defaultProps` does not
  work on React 19.2 / RN 0.86 (function components), so the prop sits on each tag, guarded by
  `app/components/gameplayTextScaling.test.mjs` (the file list lives there). `PollySpeechBubble` is
  shared, so Polly's Home bubble is fixed-size too; Settings and the Polybook still scale.
  Device-checked by Pete at max Text Size + Bold Text.

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
- Hunt bubble reading time (2026-11-11): a visit stays perched for `resolveVisitPerchMs(spec)`
  (`pollyVisitPolicy.ts`): the spec's `perchMs` or, if longer, the line's reading time
  (`POLLY_READ_NOTICE_MS` 500 ms + 15 characters a second, capped at 5000 ms; TEST VALUES). `perchMs` is
  now a MINIMUM. This runs in `PollyHuntVisit.tsx`, so the onboarding and HUD-lesson visits get it too.
  A word change no longer fast-exits a heckle (`usePollyVisits.ts`); only a guaranteed visit cuts one.
  Device-checked by Pete 2026-11-11 ("way better now with the timing").
- Daily bubble reading time (2026-11-11): `PollyDailyPerch.tsx` holds a reaction's bubble for
  `DAILY_BUBBLE_MIN_MS` 2500 or the line's `pollyLineReadMs`, whichever is longer (four long mood lines
  gain up to 0.5 s; the reaction completes that much later). First-miss dance: the dance's own bubble
  keyframes (`POLLY_DANCE_BUBBLE`, in at 850, out from 1650) are UNCHANGED, but once it is fully in the
  perch sets its own `bubbleOpacity` to 1 underneath, so the bubble stays beside her after she lands,
  until 850 + reading time (about 2.95 s for the butter-knife line; was about 0.8 s on screen). The sum
  of the two opacities is clamped to 1. The dance itself is untouched. NOT yet device-checked.
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
- Retired Hunt trap ids (2026-11-07, never reuse): `line_t2`, `left_t6`, `last_t3`, `lap_t2`, `lime_t4`, `lead_t2`, `exchange_t1`, `draw_t0`. Their replacements are `line_t7`, `left_t8`, `last_t8`, `lap_t6`, `lime_t5`, `lead_t10`, `exchange_t10`, `draw_t4`. Before picking a fresh id, check git history, not just the current file: `git log --all -S'"<id>"' -- assets/data/huntData.json`. `last_t6`, `lead_t7` and `exchange_t8` were free in the file but used for other cards in older banks, so they were skipped (gaps in the numbering are fine).
- Retired Hunt trap id (2026-11-07, later the same day): `down_t01`, replaced by `down_t06` (`THE WAY YOU FIX A ZIPPER WHEN YOUR FLY IS OPEN`). The old text (`...GOES WHEN YOUR FLY'S OPEN`) contradicted its own answer (UP); Pete's intended wording was the "fix" one. History shows the "fix" wording never existed in the repo or workbooks, so where it was lost is unknown. The stale `exchange_t1` row in the workbook's Boss Words (Production) sheet was also brought to `exchange_t10`.
- Retired Hunt ids (2026-11-11 fact fixes, never reuse): `rank_t0`, `circuit_t2`, `horn_r2`, `bow_t3`, `bill_t2`, `contest_r03`, `bridge_r3`. Replacements: `rank_t5`, `circuit_t95`, `horn_r4`, `bow_t4`, `bill_t6`, `contest_r04`, `bridge_r5` (`rank_t4`, `circuit_t3` and `bill_t4`/`bill_t5` were used in older banks, so skipped). Hidden pairs `battery_h02` and `check_h01` got new REAL text but KEPT their ids: a saved Haunt stores `hiddenPairId`, and `resolveGhostPair` falls back to the old stored text when the id is not found, so a fresh id would keep re-testing the old false card. A player who already claimed a retired REAL id gets one extra count in the Polybook meanings number when they claim its replacement (known, accepted).
- Retired Hunt trap ids (2026-11-11, DRIVE, never reuse): `drive_t1`, `drive_t2`, `drive_t3`, `drive_t5`, `drive_t6` (all the motivation sense, same as REAL `drive_r1`). Four new traps: `drive_t10` paddle, `drive_t11` tow, `drive_t12` pedal (Tour de France), `drive_t13` conscience. DRIVE now has 15 REALs and 9 traps.
- Retired Hunt trap ids (2026-11-11, TRAIN, never reuse): `train_t0` subway, `train_t1` coach drills, `train_t2` lace hem (all true meanings of TRAIN). New: `train_t6` veil, `train_t7` school bus, `train_t8` practice ("practice makes perfect"). `train_t3` to `train_t5` were used in older banks, so skipped.
- Retired Hunt trap ids (2026-11-11, TRIP, never reuse): `trip_t0` cruise, `trip_t1` banana peel, `trip_t2` seeing colors (all true meanings of TRIP). New: `trip_t5` tour ("go on tour" has no article, which is what keeps it from being a trip), `trip_t6` jump the hurdles, `trip_t7` move when your job relocates you. `trip_t3`/`trip_t4` were used in older banks, so skipped.
- Retired Hunt trap ids (2026-11-11, CORD, never reuse): `cord_t03` newspaper twine, `cord_t04` sweatpants drawstring, `cord_t05` package string (all cords). New: `cord_t06` tug-of-war rope (a cord is lighter than a rope), `cord_t07` floss, `cord_t08` ribbon ("snipped", not "cut", because REAL `cord_r02` says CUT).
- Retired Hunt trap ids (2026-11-11, FACE, never reuse): `face_t00` a building’s front, `face_t01` the moon’s visible side, `face_t03` the side toward the sunset (all true senses of FACE). New: `face_t04` costume-party mask, `face_t05` cheeks Grandma pinches. FACE now has three traps (`face_t02` kept); Pete chose not to force a fourth.
- Retired Hunt trap ids (2026-11-11, FIGURE, never reuse): `figure_t01` best guess (a ballpark figure), `figure_t04` calculator result, `figure_t06` price-tag digits (all figures). Cut, not replaced; FIGURE keeps five traps.
- Retired Hunt trap id (2026-11-11, FIGURE, never reuse): `figure_t00` ("TAILOR’S NUMBERS...": numbers are figures). Replaced by `figure_t08` "WHAT A TAILOR TAKES WHEN YOU’RE GETTING FITTED FOR A TUXEDO" (measurements; Pete's wording).
- Retired Hunt trap id (2026-11-11, FIGURE, never reuse): `figure_t05` ("NUMBERS A GRAPH RUNS ALONG": its only link to FIGURE was "numbers", so it was true or no trap). Replaced by `figure_t09` "WHAT PEOPLE FLEX IN THE MIRROR WHILE THEY WORK OUT" (muscles; Pete's scene, "flex" not "stare at" so the answer is only muscles).
- Retired Hunt trap ids (2026-11-11, FINE, never reuse): `fine_t02` (passes inspection) and `fine_t04` (inspection finds no problems); both true (fine = okay), and the tutorial intro itself shows "I'M FINE.". Cut, not replaced. FINE is the tutorial word and stays fixed (Pete): the pinned cards `fine_r03`, `fine_t00`, `fine_r04` (`FIRST_RUN_FINE_MASK_IDS`) never change; the first word deals those three plus two random others.
- Retired Hunt trap ids (2026-11-12, FIELD, never reuse): `field_t01` (Europeans / fútbol; a soccer field is a field to an American, "pitch" is British) and `field_t04` (guerrilla warfare; no definite answer, and "troops in the field" makes it arguably true; its workbook answer "battlefield" contains the headword). Cut, not replaced; FIELD keeps three traps (Pete: no forced fourth; boxing ring, farmer and hockey drafts rejected as repeats).
- Retired Hunt ids (2026-11-12, DIRECT, never reuse): `direct_t00` (a road with no turns; "straight" is a meaning of direct), cut, not replaced; `direct_t02` (the person calling the shots; that is the director, which `direct_r03` accepts), replaced by `direct_t04` "THE PERSON WHO TELLS YOU WHAT TO DO AND PAYS YOU" (boss; Pete's wording); REAL `direct_r02` (road work, must turn: read as a detour), replaced by `direct_r04` "WHAT THE COP DOES WITH TRAFFIC AT THE LIGHT" (Pete's scene; CONDUCT's `conduct_r5` holds the same scene and is flagged separately in audit section 5). DIRECT: 4 REALs, 3 traps.
- Retired Hunt trap ids (2026-11-12, DRAFT, never reuse): `draft_t01` (architect's plans; MW draft 5, design/sketch), `draft_t03` (editor's notes; the marked-up draft, `draft_r00`'s scene), `draft_t04` (AC vent; MW 11a, current of air), `draft_t07` (fireplace damper; MW 11b, "a device for regulating the flow of air (as in a fireplace)"). Cut, not replaced; DRAFT keeps four traps.
- Retired Hunt trap ids (2026-11-12, DIE, never reuse): `die_t01` (engine quits at the light; "my car died"), cut, not replaced; `die_t03` (zero lives left; you died), replaced by `die_t05` "WHAT AN OPOSSUM DOES WHEN IT FEELS THREATENED" (plays dead; Pete's wording). DIE: 6 REALs, 3 traps.
- Retired Hunt ids (2026-11-12, BOUND, never reuse): REAL `bound_r3` ("I'M ON MY WAY NOW") replaced by `bound_r6` "THE CITY ON THE FRONT OF THE BUS"; traps `bound_t0` (rim ricochet; bound = bounce), `bound_t1` (pirate/bounty sound-alike), `bound_t2` (double dutch; jumping = bounding) replaced by counterpart traps `bound_t5` "LIVING THE BACHELOR LIFE, NO BALL AND CHAIN" (single), `bound_t6` "SOMETHING YOU STILL COULDN'T DO WITH ALL THE TIME IN THE WORLD" (impossible), `bound_t7` "PAGES FALLING OUT OF GRANDMA'S OLD COOKBOOK" (loose). `bound_t3`/`bound_t4` were used in older banks, so skipped. BOUND keeps straight apostrophes on every card so no card stands out.
- Retired Hunt trap ids (2026-11-12, section 4 review, never reuse): `exhaust_t00` (lose all patience) and `exhaust_t01` (maxed-out credit card), both the used-up sense, replaced by one new counterpart trap `exhaust_t04` "THE PART OF THE ENGINE WHERE THE AIR COMES IN" (intake); `foster_t1` (a home that takes in strays: a foster home), replaced by `foster_t4` "THE PLACE YOU GET A DOG, THEN TELL EVERYONE YOU RESCUED IT" (shelter/pound; Pete's angle); cut, not replaced: `foul_t1` (foul mood), `fork_t0` (cafeteria plastic fork), `foil_t3` (lining a pan), `floor_t5` (top of the stairs), `flat_t3` (road with potholes filled). Counts: EXHAUST 4R/3T, FOSTER 3/4, FOUL 6/4, FORK 9/4, FOIL 6/4, FLOOR 9/7, FLAT 11/4.
- Retired Hunt trap ids (2026-11-12, section 4 batch 2, never reuse): `light_t91` (camera flash, is light) -> `light_t96` "WHAT KEEPS THE CAMERA STILL FOR A NIGHT PHOTO" (tripod); `light_t93` (visor glare) cut; `light_t95` (lights on while away, arguable) -> `light_t97` "HOW YOU TAKE YOUR COFFEE WHEN YOU SKIP THE CREAM" (black); `dump_t03` (date never returns from the bathroom, read as dumped) -> `dump_t04` "WHAT HAPPENS WHEN YOUR BLIND DATE NEVER SHOWS UP" (stood up, Pete's wording); `dump_t02` (dumpster, a compound containing DUMP) -> `dump_t05` "WHAT YOU DO WITH EMPTY CANS AND BOTTLES TO GET A NICKEL BACK FOR EACH" (Pete's card; deposits exist in only 10 states, Pete kept the nickel); `cut_t6` ("I cut my knee") cut. `tools/content/huntCanonicalization.test.mjs` pins exact card text for LIGHT, COPY, CAPITAL and others: update it when one of those cards changes (done for LIGHT; the three LIGHT ids added to its retired list). Counts: LIGHT 7R/4T, DUMP 5/4, CUT 18/7.
- Retired Hunt trap ids (2026-11-12, section 4 batch 3, never reuse): `cue_t01` (queue, a sound-alike; Pete: no sound-alike traps, and no letter-Q card either) and `cue_t04` (actor reads lines from: cue cards fit) cut; `copy_t01` (doppelgänger) moved to REAL as `copy_r07` (same text; true; Claude noted it is a near-synonym, Pete kept it), so COPY `wordType` went Septuple -> 8-MEANING (the validator requires wordType to match the REAL count); `copy_t04` (genetic look-alike = clone, a copy) -> `copy_t05` "WHAT THE MUSEUM HANGS ON THE WALL WHILE THE GIFT SHOP SELLS THE PRINTS" (the original). Flagged but KEPT by Pete: `cure_t04` (wet paint; everyone says dry) and `cue_t02` (catcher's sign; nobody calls it a cue). Counts: CUE 3R/4T, COPY 8/4, CURE 6/5.
- Retired Hunt trap ids (2026-11-12, section 4 batch 4, never reuse): `bright_t2` (straight A's: smart, same as `bright_r1`), `pen_t3` (slept it off after an arrest: a holding pen; NYC calls the cells at Central Booking, the Tombs, "the pens"), `line_t6` (road map: the road is drawn as a line). All cut, not replaced. Counts: BRIGHT 5R/3T, PEN 6/5, LINE 21/6. History check (2026-11-12, Pete's swap worry): every current card's id prefix matches its side (r = REAL, t = TRAP), and no current card ever changed side in git history; `bright_t2` and `copy_t01` were filed as TRAP from their first locked workbooks (2026-08-02, 2026-08-12), so they were judged wrong when written, not swapped later.
- Retired Hunt trap ids (2026-11-12, section 4 batch 5, never reuse): `exploit_t00` (loophole: gamers call it an exploit) cut; `bottom_t0` (who came in last) -> `bottom_t6` "WHAT YOU CALL THE RUNNER OF A RACE WHO CROSSED THE FINISH LINE AFTER EVERYONE ELSE" (Pete's wording; Claude advised against "position", which echoes `bottom_r0`); `bottom_t1` (part of your foot that never touches the ground: the arch is on the bottom of the foot, confused Pete's nephew) -> `bottom_t7` "WHERE THE SCUBA DIVER HEADS WHEN THE AIR TANK RUNS LOW" (the surface). `bottom_t4`/`bottom_t5` were used in older banks, so skipped. Flagged weak but KEPT by Pete (nobody talks that way): `ceiling_t1` (sky's the limit), `channel_t2` (radio = station), `channel_t3` (gutter, though MW allows channel). Counts: EXPLOIT 4R/3T, BOTTOM 4/4.
- Retired Hunt trap id (2026-11-12, section 4 batch 6, never reuse): `hold_t4` (customer service puts you on hold: hold music, a compound with HOLD; raised by Claude, cut by Pete). Weak flags KEPT by Pete: `click_t0`, `degree_t03`, `drill_t01`, `ground_t3`, `handle_t0`, `hold_t6`. HOLD 18R/6T.
- Retired Hunt ids (2026-11-12, section 4 batch 7, never reuse): trap `jack_t6` (Swiss Army knife: a folding pocket knife is a jackknife) cut; REAL `kind_r3` ("taste of their own medicine" = repay in kind; reads as false, players think payback; raised by Pete's nephew) cut, KIND wordType Sextuple -> Quintuple. Weak flags KEPT by Pete: `iron_t2` (Man of Steel), `kind_t3` (naughty or nice), `palm_t91` (fingerprints), `palm_t92` (fingers prune). JACK 10R/6T, KIND 5/6. Section 4 of the 2026-11-11 audit is DONE for newer words.
- Retired Hunt REAL ids (2026-11-12, section 5 batch 1, never reuse): `counter_r03` (taxi meter turns off; everyone says meter) -> REAL `counter_r04` "HOW YOU BUY MEDICINE THAT DOESN’T NEED A PRESCRIPTION" (over the counter; Pete wanted no brand name) plus new trap `counter_t06` "WHAT YOU TELL THE CAB DRIVER TO LEAVE RUNNING WHEN YOU SAY YOU’LL BE RIGHT BACK" (the meter; Pete's line); `conduct_r5` (cop and traffic: Americans say direct, and `direct_r04` holds the scene) cut, CONDUCT wordType Sextuple -> Quintuple; `foam_r9` (moose: the answer is MOUSSE) cut, FOAM wordType 10-MEANING -> 9-MEANING. Counts: COUNTER 4R/6T, CONDUCT 5/4, FOAM 9/3.
- Retired Hunt REAL ids (2026-11-12, sections 5-6 batch 2, never reuse): `pen_r5` (EpiPen rhyme: few know it and the answer is EpiPen, not PEN), `foot_r9` (bookkeeper footing a column: jargon), `foil_r5` (fox foils its trail: hunting jargon). All cut, not replaced (Pete: don't force a card). wordType: PEN Sextuple -> Quintuple, FOOT 11-MEANING -> 10-MEANING (pinned in `huntCanonicalization.test.mjs`, updated), FOIL Sextuple -> Quintuple. Counts: PEN 5R/5T, FOOT 10/5, FOIL 5/4.
- Retired Hunt REAL ids (2026-11-12, section 6 batch 3, never reuse): `focus_r6` (patient zero: epidemiology jargon), `fork_r8` (code fork: programmer jargon), `commission_r3` (Lucky Luciano's Commission: trivia; Pete liked it but cut it). Cut, not replaced. wordType: FOCUS Septuple -> Sextuple, FORK 9-MEANING -> 8-MEANING, COMMISSION Quintuple -> Quadruple. Counts: FOCUS 6R/6T, FORK 8/4, COMMISSION 4/4.
- Retired Hunt REAL ids (2026-11-12, section 6 batch 4, never reuse): `bench_r3` (workbench riddle; Pete: a plain rewrite reads as a toolbox) cut; `butt_r4` ("A-B conversation, so C your way out" = butt out, riddle) -> `butt_r5` "WHAT YOUR MAMA GAVE YOU TO SHAKE ON THE DANCE FLOOR" (Pete's idea; second REAL on the backside sense, which Pete accepted); `hedge_r3` (riddle; the phrase is hemmed in) cut. `butt_t2` (but, a sound-alike) KEPT as Pete's exception. wordType: BENCH Quintuple -> Quadruple, HEDGE Quadruple -> Triple. Counts: BENCH 4R/4T, BUTT 5/4, HEDGE 3/4.
- Section 6 batch 5 (2026-11-12): REAL `hamper_r2` (gift hamper, British) cut and retired; HAMPER wordType Triple -> Double (2 REALs, the validator minimum). Boss hidden pairs, REAL text replaced with ids KEPT (saved Haunts store hiddenPairId): `extract_h02` REAL "THE CERTIFIED COPY PULLED FROM THE PUBLIC RECORD" (British legal) -> "WHAT THEY SEND THE RESCUE CHOPPER IN TO DO WITH THE SOLDIERS STUCK BEHIND ENEMY LINES" (Pete's wording); `horn_h02` REAL "THE SHARP TIPPY-TOP OF A MOUNTAIN" -> "WHAT YOU GET ON WHEN YOU NEED TO CALL SOMEBODY RIGHT NOW" (get on the horn). Both traps unchanged. Section 6 DONE.
- Section 7 batch 1 (2026-11-12, never reuse the cut ids): `crust_r04` typo fixed (" — ILL" removed, id kept); PLANE `plane_t0` (plains) and `plane_t4` (plain version) cut, `plane_t3` (plain pizza) KEPT as Pete's one sound-alike exception on PLANE (three on one word made them free rejects); NAIL `nail_t4` (second SCREW trap) cut, `nail_t0` kept. Counts: PLANE 4R/4T, NAIL 4/4.
- Section 7 batch 2 (2026-11-12, never reuse): MOUSE `mouse_t1` (finger tapping the phone, same answer as `mouse_t0`) -> `mouse_t3` "WHAT YOU HOLD TO PLAY VIDEO GAMES ON A CONSOLE INSTEAD OF A PC" (controller; Pete's console idea, Claude changed joystick to controller); CHILL `chill_t1` (goosebumps, same card as `arms_t2`, and "gives me chills" makes it arguable) cut, `arms_t2` kept. Counts: MOUSE 2R/3T, CHILL 5/4.
- Section 7 batch 3, tone and profanity (2026-11-12, never reuse the old ids): CROWN `crown_r00` (HILLBILLY) -> `crown_r06` "DENTAL WORK THAT FIXES YOUR BROKEN SMILE" (Pete's wording); HEAD `head_t8` (REDNECK) and CONTEST `contest_t04` (KAREN) cut; DEAL `deal_r04` (profanity) -> `deal_r05` "OVERREACTING MEANS MAKING A BIG ___ OUT OF NOTHING" (Pete's big-deal idea; blanks are already used on `die_r04` and `fast_r06`); KICK `kick_r7` (profanity) -> `kick_r13` "WHAT YOU FINALLY DO TO A BAD HABIT LIKE SMOKING" (kick the habit, a new sense); JACK `jack_r4` ("ass") -> `jack_r10` "WHAT A MALE DONKEY IS CALLED"; CLAP `clap_r3` (gonorrhea slang) cut for the App Store age rating (Pete), CLAP wordType Quintuple -> Quadruple. Pete's rule: no cards that put a group down, and keep cards clean for the age rating. Sections 4-7 of the 2026-11-11 audit are DONE for newer words.
- Retired Hunt trap ids (2026-11-12, fairness pass, never reuse): `forge_t2` (fake hundred-dollar bill; MW forge = to counterfeit, and 18 U.S.C. § 471 says "forges, counterfeits"), replaced by `forge_t5` "WHAT A NOTARY DOES WHILE YOU SIGN" (witnesses; Pete's angle); `clip_t0` (necktie: a tie clip) and `chest_t4` (seatbelt crosses the chest), cut, not replaced. CLIP 5 REALs + 4 traps, CHEST 6 + 4, FORGE 4 + 5. Unflagged traps were left alone by Pete's rule (only flagged cards change), though `forge_t0` (copycat) and `forge_t1` (alibi) sit in the same imitate/fabricate sense and `clip_t2` (laundry clips) and `chest_t3` (burped against the chest) are arguable.
- Retired Hunt ids (2026-11-13, OLD-WORDS REWRITE batch 1, never reuse): ABSTRACT `abstract_r0`, `abstract_r1`, `abstract_t0` (new `abstract_r3` abstract noun, `abstract_r4` CliffsNotes, `abstract_t5` soup-can pop art); ADDRESS all six old cards `address_r0`-`r2`, `address_t0`-`t2` (new REALs `address_r3`-`r9`: pizza place, shipping/billing, @ email, president to the nation, Gettysburg, boss "at the next meeting", celebrity crocodile tears; new traps `address_t7`-`t12`: politician dodge, bar number, followers' tag/handle, concert location, pass the buck, Mayday coordinates; `address_t3`-`t6` were used in older banks, so skipped); ANCHOR `anchor_r1` climber, `anchor_r2` sponsor, `anchor_r5` Spartans, `anchor_t0`-`t3` (new `anchor_r6` fishing-spot drop, `anchor_r7` family, traps `anchor_t4` weatherman, `t5` dock rope, `t6` garage podcast, `t7` paperweight, `t8` cement shoes). wordType: ADDRESS Triple -> Septuple, ANCHOR Sextuple -> Quintuple. Counts: ABSTRACT 3R/3T, ADDRESS 7/6, ANCHOR 5/5.
- Retired Hunt ids (2026-11-13, OLD-WORDS REWRITE batch 2, never reuse): ARMS `arms_r3` (company's charitable "arm", singular), `arms_r4` (pitcher's arm, singular), `arms_t2` goosebumps, `arms_t3` (second LEGS trap), `arms_t4` front lines (new `arms_r7` coat of arms, `arms_r8` quarterback and pitcher, `arms_t6` bird wings); ARROW `arrow_r0` (definition), `arrow_t1` compass needle (arguably an arrow; KEY has it), `arrow_t2` GPS (new `arrow_r2` Robin Hood split, `arrow_r3` Cupid, `arrow_r4` four keys by the number pad, `arrow_t4` javelin, `arrow_t5` throwing star); ARTICULATE `articulate_r0` (definition), `articulate_t0` (answer INARTICULATE contains the headword), `articulate_t1` rigid beam, `articulate_t2` cue cards (new `articulate_r3` kid with no "um", `articulate_r4` feeling you can't describe, traps `articulate_t6` wordy email, `t7` bilingual, `t8` loud, `t9` flexible). Plural headwords: a REAL must point at the plural (Pete agreed to cut singular "arm" cards on ARMS). Batch 2 uses curly apostrophes (bank majority); each word keeps one style. wordType: ARROW Double -> Quadruple, ARTICULATE Double -> Triple; ARMS stays Septuple. Counts: ARMS 7R/3T, ARROW 4/3, ARTICULATE 3/4.
- Retired Hunt ids (2026-11-13, OLD-WORDS REWRITE batch 3, never reuse): BACK `back_r4` (definition), `back_t1` flanking, `back_t2` massage (reads true: it is on your back) (new `back_r9` Terminator, `back_r10` pay your buddy back, `back_t6` front row at the movies; `back_t5` used in older banks); BALANCE `balance_r0`, `balance_t0` (credit-card balance piles up, arguable), `balance_t1` dizzy (shared the spinning-ride scene with new `balance_r7`), `balance_t2` gavel (new REALs `balance_r4` credit card, `r5` checkbook, `r6` work-life, `r7` spinning ride; traps `balance_t7` ATM slip, `t8` even, `t9` overdraft fee; `balance_r3`, `t3`-`t6`, `t90` used in older banks); BAND `band_r2` radio band (Pete never heard of it), `band_t2` playlist (new `band_r3` wedding band, `band_r4` Band of Brothers, `band_t3` choir). Cross-word handles Pete kept: Band of Brothers is also on COMPANY (`company_r3`); BACK `back_r10` and BALANCE `balance_t8` both use a buddy paying back. Pete's rule: an unflagged card is never cut to make room for a new one. wordType: BACK 9-MEANING -> 10-MEANING, BALANCE Triple -> Sextuple, BAND Triple -> Quadruple. Counts: BACK 10R/4T, BALANCE 6/3, BAND 4/3.
- Hunt card order: `selectVisibleMasks` in `huntGenerator.ts` returns up to five cards with at least one REAL and one trap, REAL first, so `step.masks[0]` is always a REAL. The order the player sees comes from `createGame` in `polyRunEngine.ts` (`shuffledMasks`, seeded per run and per word). Read order from `shuffledMasks`, never from `step.masks`. Words with five cards or fewer always show all of them.
- `artifacts/content-identity-map.json` and `tools/content/import-staging/staged-hunt-content.json` are stale generated files (they still hold the retired phrases). No test or build step reads them. Regenerate only if a tool starts depending on them.
- The Linux sandbox cannot run `tsx` (the installed esbuild is the Windows build). `node node_modules/typescript/bin/tsc --noEmit -p .` works there (about two minutes).

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
- START-OF-HUNT DARE (Pete, 2026-11-12): the `huntIntro` event (unused since the first-run onboarding replaced it in Sept) is fired again for every Hunt except the FINE tutorial (first-run or replay): `GameContent` in `GameScreen.tsx` fires it `HUNT_START_DARE_DELAY_MS` 900 ms (TEST VALUE) after round 1 appears, once per run seed (module-level `lastHuntStartDareRunSeed`, so a resumed Hunt never replays it), gated by `shouldFireHuntStartDare` (`pollyVisitPolicy.ts`; not while a HUD lesson is due). Line from `HUNT_START_LINES` via `pickFreshLine`. The old `huntIntro` line text stays in the catalog, unused. Boss entry pool is now eight lines (three crown lines added). Device-checked by Pete on POLYWORDS DEV 2026-11-12: "everything lands perfect" (900 ms delay kept).
- Hunt visits: she flies in on `fly` (she cannot know who wins), except the Returning Haunt gloat,
  which flies in on `hauntTaunt`. Only the exit shows the result: mastery exits `flyAngry`; the
  Haunted gloat exits `flyGrin` but holds the perch, so that exit is rarely seen. A lost Returning Haunt fires `hauntMasterFailed` (the silent gloat) and 400 ms
  later `hauntFailed`, whose `HAUNT_FAILED_LAUGH` visit hard-cuts the gloat; its bubble is `huntHauntChant`
  ("Trap. Trap. Trap.", 2026-11-06, `ad27b36`; device-approved by Pete 2026-11-07) with the
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
- HOME DOZE IS SWITCHED OFF (Pete, 2026-11-11): `HOME_DOZE_ENABLED` is `false` in `PollyHomePerch.tsx`,
  so she never nods off on Home in any resting pose (idle, smug, angry, embarrassed), with or without
  Reduce Motion: no nod, no asleep pose, no Z's. Reason: the idle face rig (sprite4 art) and master
  `asleep.png` are different drawings and testers could see the swap. The two bullets below describe
  the doze as built; all of that code, `asleep.png` and the Z art stay in place, and setting the flag
  to `true` restores it. Bring it back only once the idle and the sleeping pose are the same art (a
  rig built from the master art). Device-checked by Pete on POLYWORDS DEV 2026-11-11 (she keeps
  blinking and never nods off; commit `048b8aa`).
- HOME IDLE JABS (Pete, 2026-11-11; the alternative to the doze). While the player just sits on Home
  she needles them in her bubble: first jab `HOME_IDLE_JAB_FIRST_MS` 10 s after Home gains focus (after
  the greeting bubble has gone, on the entrance visit), then one every `HOME_IDLE_JAB_GAP_MS` 20 s, each
  up `HOME_IDLE_JAB_SHOW_MS` 4 s, `HOME_IDLE_JAB_MAX_PER_VISIT` 3 per focus, then quiet; the clock
  restarts on every Home focus. All four are TEST VALUES (Claude's first guesses). Pools and the pure
  picker live in `app/game/pollyHomeIdleJabs.ts` (pinned by `pollyHomeIdleJabs.test.ts`, exact copy
  included); line text is `homeIdle*` / `homeSore*` / `homeFluster*` in `pollyCharacter.ts`; the timers are one effect in
  `PollyHomePerch.tsx`. Mood is read from her resting pose WHEN A JAB FIRES: idle and smug use the
  normal pool, angry (the player beat her) uses the sore-loser pool, embarrassed (a comeback win after
  a rough patch) uses the flustered pool (`homeFluster*`). No repeat within the last 5, kept in memory for the app session only: jabs do
  NOT go through `rememberPollyLine`, because surface `home` advances the greeting rotation and the
  shared recent-line list would lose Hunt lines. Silent. None on the first-ever Home visit (her four
  intro lines own it). Leaving Home mid-jab hides the bubble at once. Copy is Pete's (several lines are
  his own); change it only on his word. Pete saw the jabs on POLYWORDS DEV 2026-11-11 ("she says the
  lines"); Pete then tested the flustered pool the same day and it passed.
- HOME FLY-AWAY (Pete, 2026-11-11). `HOME_IDLE_LEAVE_AFTER_MS` 3 s (TEST VALUE) after the third jab has
  faded she flies off, silent: the drop-in reversed (`slideY` to `-drop.fromAbove` over `drop.ms`,
  ease-in), on the flight pose `resolveHomeLeavePose` picks (angry `flyAngry`, smug `flyGrin`, idle and
  embarrassed `fly`; the smug and embarrassed picks are Claude's guess). She stays gone until Home is
  focused again, then drops in like the entrance (pose settles at `RETURN_SETTLE_MS` 650, no greeting)
  and the jab clock restarts. `flownAwayRef` blocks the pose-follow effect while she is away. Terrace
  Home only (needs the `drop` prop). Reduce Motion: she is simply gone, and simply back.
  EMPTY PERCH: her log is drawn into every pose and the three logs (rig, master angry, master
  embarrassed) are different drawings. `assets/images/polly/rig2/polly_perch_empty.png`
  (`POLLY_HOME_EMPTY_PERCH`) is the rig's log cut from `polly_base.png` on the same 283x413 canvas with
  her feet filled in automatically (smooth patches, no grain; Pete: "perch, it's fine"). It is a
  sibling of the sliding root, shown only while she is away FROM a rig pose, and on the way back only
  if she lands IN a rig pose. From angry or embarrassed the perch leaves with her (no art; Pete chose
  this, option 2). The rig log can sit up to about 3.7 pt above the static perch at takeoff (her
  breathing), so the log may jolt slightly as she pushes off. Jabs, flustered pool and fly-away
  device-checked by Pete 2026-11-11 ("everything works how we want it to work"; `955848a`).
- TERRACE PERCH STICK OFF (Pete, 2026-11-11). `HomeTerraceScene.tsx` no longer draws
  `assets/images/home/terrace/perch.png` (`TERRACE_SCENE_PERCH_ENABLED` false). It sat behind Polly and,
  because every pose has its own log, showed as a second perch (clearest under the angry pose; Pete's
  screenshots). The art, its rect in `TERRACE_DEFAULTS` and its DEV positioner entry stay, but moving
  `Perch` in the positioner now shows nothing. In its place the empty rig log (`POLLY_HOME_EMPTY_PERCH`)
  also waits for her on the app-open entrance when she will land in a rig pose, and hides the moment
  she settles. Entering angry or embarrassed, no perch shows until she lands (no art). Seen by Pete on
  his phone 2026-11-11 and kept; he plans to make the two missing empty logs himself later.
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

Privacy page (checked 2026-11-08): https://psibari.github.io/Polywords/privacy/ (capital P; lowercase 404s). Free GitHub Pages on branch `gh-pages`, no custom domain, published 2026-10-06. The URL in App Store Connect must match exactly. The repo appears public; GitHub Free allows Pages only on public repos, so making it private would likely take the privacy page down. Do not change repo visibility without a plan for the page.
