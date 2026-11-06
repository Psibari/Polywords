NOTE: the docs block at the end of this file was superseded and never run as written. The breach as built is recorded in CONTEXT.md section THE BREACH (commit 721af41). Prompts 1-9 below were run and device-tested on 5 Nov 2026.
# POLYWORDS: the breach, build prompts (4 Nov 2026)

One Claude Code prompt per concern, run in order. Each is one fenced block with its commit message.
Pete tests on the DEV build after prompt 5, again after 6 and 7, and tunes haptics (prompt 8) on his phone.
Nothing here is locked except the swipe (up claims, right rejects). Where a prompt touches something the
code marks LOCKED, the prompt says so and Pete's go-ahead for the change is the 4 Nov instruction.

## What is already done (by Claude, in the repo working tree, NOT committed)
- `assets/images/dailycastle/gate_door_broken.png`: the gate with the hole. 1399x1597 RGBA, same frame
  as `gate_door.png`. Metadata stripped; pixel hash 27526b24b5a53e2486738ca6a8dbcab411a93194894da6334359a0fc64a91a4c.
- `assets/audio/sfx/breach_gate_crack.mp3`, `breach_castle_rumble.mp3`, `breach_smash.mp3`, `breach_thunder.mp3`.
  ID3 stripped. md5 aeb56864ead0777345fec3705071e9d6 / c5108c9d01c43edf04eca90538108472 /
  db5537bc06f1e6e7cee1ad3eba6fe967 / ac727fa54891656d3eea0e7ef7ded85c.

## Settled design (Pete, 3-4 Nov)
- Every round is graded by its OWN `revealedClueCount`, the winning round included.
- THREE clues: today's sequence exactly, plus the castle's gold hit made bigger ("big3").
- TWO clues: the plaque hits the SHUT gate. Castle and gate shake, the door cracks, gold hit "big2", a faint
  white flash. Then the gate lifts, the plaque goes through, the next gate drops. No lightning.
  Sounds: gate crack + castle rumble. Polly: shocked on the perch, quick straight-up jump, lands embarrassed.
- ONE clue: the plaque breaks through the gate (broken art, hole in the bottom two clue planks), splinters, dust,
  2 lightning bolts, heavy shake, much bigger gold hit "big1" with a white wash. The plaque goes down the hole,
  the broken gate lifts away, a whole gate drops with the next round. Sounds: smash (explosion + debris) +
  castle rumble + thunder. Polly: furious, crouches, tries to fly off, blown up and back, shakes, drops, stays angry.
- FIRST lost life only: Polly's "lost-life dance" replaces the old first-miss pointing lean. The second lost
  life ends the game as today.
- Heavy haptics matching the visuals, tuned on the phone.
- Reduce Motion / Reduce Flashes get calm variants; strip whatever is needed.
- Polly never covers the clues, the blocks or the UP lane, and stays on screen.

## Answers Pete gave on 4 Nov (these are settled, not assumptions)
1. Winning round solved on 2 or 1 clues: the tier move plays FIRST, then today's win (shocked, line, angry fly-off).
2. Lost-life dance sound: the existing short squawk (`pollySqwawkShort`).
3. Thunder stays on the one-clue breach.

## Defaults Claude chose that Pete has NOT approved (change any of them)
- Two-clue Polly sounds: the existing startled pool when she goes shocked at the hit; nothing at the jump or the landing.
- One-clue Polly sounds: existing angry pool at the throw, existing startled pool at the blow-back (as in the mock).
- Dance squawk fires at the start of the dance, exactly when the old first-miss squawk fired.
- Every timing and distance below is the number from the approved mock. They are start values; tune on the phone.
- Two and one clues play NO "correct claim" chime at the claim (the mock plays none; the breach sounds start at
  contact, 380-450 ms later). Only the three-clue round keeps the chime at the claim. Say if you want it on all three.
- The mock's two-clue jump table starts at -27.8 pt on its first sample (measured from Pete's video). Kept as is.
  If it pops on the phone, tell Pete, do not smooth it silently.

## Run order and dependencies
1 assets/registry -> 2 tier model -> 3 gate art -> 4 castle effects -> 5 claim flow (needs 2, 3, 4) ->
6 Polly tier moves (needs 1, 2, 5) -> 7 Polly dance (needs 1) -> 8 haptics (needs 5) -> 9 Reduce Motion / Flashes (last).

---

## Prompt 1: breach assets, sound registry, licences, pose table

```
Concern: bring the breach's art and sounds into the repo properly. No behaviour change.

Read first: CLAUDE.md, CONTEXT.md (section THE BREACH), app/audio/sfx.ts, assets/audio/LICENSES.md,
app/ui/pollyScreenPoses.ts. If anything below disagrees with the code, stop and report; do not improvise.

1. Already in the working tree, untracked: assets/images/dailycastle/gate_door_broken.png and
   assets/audio/sfx/breach_gate_crack.mp3, breach_castle_rumble.mp3, breach_smash.mp3, breach_thunder.mp3.
   Verify each is present. Verify the PNG has only IHDR/IDAT/IEND chunks (no caBX or other metadata) and
   decodes to 1399x1597 RGBA with pixel sha256 27526b24b5a53e2486738ca6a8dbcab411a93194894da6334359a0fc64a91a4c.
   Verify each mp3 starts with the MPEG frame sync (bytes ff fb), not "ID3". If any check fails, stop and report.
   Do not re-encode or edit these files.

2. app/audio/sfx.ts: register four sounds, following the file's own conventions (name union, registry entry,
   preloading, per-name player, cooldown). Names: breachGateCrack, breachCastleRumble, breachSmash,
   breachThunder -> the four files above. Volumes are FILE-RELATIVE like the other entries (read the comment
   above the boss gauntlet entrance entries): measure each new file's loudest 100 ms with ffmpeg, and set each
   volume so its loudest 100 ms sits at the level boulderImpact and hardHeavyImpact reach at their volume
   (0.22 today). Write the arithmetic in a comment, the way the neighbouring entries do. cooldownMs: crack 300,
   rumble 600, smash 1200, thunder 1500. These volumes are start values for a phone pass; say so in the comment.

3. assets/audio/LICENSES.md: add a section "Sound effects added 2026-11-04 (the Daily breach)" with exactly this
   content (do not add anything Claude Code cannot verify):
   - sfx/breach_gate_crack.mp3: "Wood Break" by freesound_community (Pixabay file 40011), the first crack
     (starts about 1.38 s into the source), 0.44 s, Pixabay Content License.
   - sfx/breach_castle_rumble.mp3: "Punch A Rock" by lordsonny (Pixabay file 161647), starts about 0.30 s into
     the source, 1.15 s, Pixabay Content License.
   - sfx/breach_smash.mp3: "Explosion With Debris" by dragon-studio (Pixabay file 494320), starts at the
     beginning of the source, 1.54 s, Pixabay Content License.
   - sfx/breach_thunder.mp3: "Thunderstorm Lightning Strike" by freesound_community (Pixabay file 7180),
     starts about 7.45 s into the 48 s source, 1.83 s, Pixabay Content License.
   Then a note: creator names and file numbers were read from the downloaded file names; the Pixabay page URLs
   were not opened or checked by Claude. POLYWORDS edits: each is a trimmed excerpt lowered roughly 6 to 8 dB so it
   does not clip (the sources decode up to +6 dBFS), re-encoded to mp3; start offsets are approximate (matched by
   waveform, not recorded at the time). Pixabay's terms were updated 20 Oct 2026; Claude read them on 4 Nov 2026
   and they grant commercial use with no attribution and forbid selling or redistributing the sound on its own;
   they do not mention games or apps by name. Keep a dated saved copy of the licence page. Also record that
   "Wood Smash 3" by floraphonic (Pixabay file 170418) was auditioned and NOT used or shipped.

4. app/ui/pollyScreenPoses.ts: add these pose names to the pose map and to POLLY_SCREEN_POSE_SCALE (scale 1 each),
   each pointing at the file of the same name in assets/images/polly/master/: masterShock, angryYell, angry,
   jumpAngry, laugh01, laugh03, hauntTaunt. (bigLaugh is already `laugh`; flyGrin, flyAngry, sulk, shocked,
   embarrassed already exist.) Confirm every file exists first. Do not add them to PollyDailyPerch yet.
   NOTE the name `masterShock` also exists in app/ui/pollyPoses.ts pointing at the older polly_shocked.png; that is
   a different table. The new entry here must point at assets/images/polly/master/masterShock.png.

5. Run npm run typecheck and npm test. Everything green.

Commit message:
Daily breach: add broken-gate art, four breach sounds, licences, Polly pose entries

Assets and registry only; no behaviour change. Sounds are Pixabay Content License, recorded in
assets/audio/LICENSES.md with the caveat that creator names and ids came from file names.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 2: the tier model (pure, tested)

```
Concern: one pure module that says, for a correct claim, which breach tier it is and when each beat happens.
No UI.

Read first: app/game/dailyClaimPresentation.ts (resolveDailyCelebrationGrade, dailyCelebrationHaptic and their
tests), app/screens/DailyChallengeScreen.tsx lines ~150-170 (dailyGateRiseMs, dailyThrowGoneMs) and
runPhysicalCorrectTransition, app/ui/dailyCastleScene.ts (DAILY_CASTLE_FLIGHT, DAILY_GOLD_HIT).

Create app/ui/dailyBreach.ts (RN-free, importable by tsx tests) and app/ui/dailyBreach.test.ts, and add the test to
the "test" script in package.json next to the other app/ui/daily* tests.

1. Tier. Derive it from the EXISTING grade so there is one clue ladder, not two:
   type DailyBreachTier = 'open' | 'hit' | 'smash';   // three clues / two clues / one clue
   resolveDailyBreachTier(revealedClueCount) = 'open' for 'solved', 'hit' for 'sharp', 'smash' for 'cold',
   via resolveDailyCelebrationGrade. Test every count 0..4 (0 and 1 are 'smash', 2 'hit', 3 and above 'open').

2. Timing. All values are milliseconds from the claim (t = 0 is when the plaque launches), motion on, and are the
   numbers from the approved 4 Nov mock; export them as named constants so the phone pass has one place to tune:
   - open : plaque rise 450 (DAILY_CASTLE_FLIGHT.riseMs), absorb 200; gate rises from t=0 over 400.
   - hit  : plaque rise 450; CONTACT at 450; the gate stays SHUT for hold 760 after contact; at contact+760 the
            gate rises over 400 while the plaque is absorbed over 200.
   - smash: plaque rise 380 (faster: it arrives with speed); CONTACT at 380; the broken gate takes the plaque
            immediately (absorb 200); the broken gate then hangs for 480 after the absorb, then rises over 400.
   Export a function dailyBreachBeats(tier, motion) returning { contactMs, plaqueRiseMs, plaqueAbsorbMs,
   gateRiseStartMs, gateRiseMs, plaqueGoneMs, gateUpMs, thrownGoneMs } where
   plaqueGoneMs = the plaque has finished its absorb, gateUpMs = the gate has finished rising,
   thrownGoneMs = max(plaqueGoneMs, gateUpMs). For 'open' it must equal today's dailyThrowGoneMs(motion) exactly
   (650 with motion, 120 without). Expected values with motion on: hit gateRiseStartMs 1210, thrownGoneMs 1610;
   smash gateRiseStartMs 1060 (380+200+480), plaqueGoneMs 580, thrownGoneMs 1460.
   With motion off ("calm"): tier is still resolved, but there is no hold, no contact beat and no separate timing:
   return today's calm numbers for all three tiers (gate rise 120, no plaque flight), so Reduce Motion plays the
   same short sequence for every tier. The calm variants of the effects are prompt 9; this is only the clock.

3. Polly move lengths (the perch needs them, and the win round needs them): export
   dailyBreachPollyMoveMs(tier, motion): 'open' 0; 'hit' 140 + 933 = 1073 then an embarrassed hold of 1300 after the
   jump (so 'hit' = { moveMs: 1073, holdMs: 1300 }); 'smash' = { moveMs: 1570 (130+130+120+200+480+380+130), holdMs: 1300 }.
   Under Reduce Motion both are 0 (no Polly tier move). Test them.

4. Tests (assert-style like the neighbours): tier table; beats for each tier with motion on and off; 'open'
   equals the old dailyThrowGoneMs; for every tier and mode thrownGoneMs >= plaqueGoneMs and >= gateUpMs and the
   gate never starts rising before contact for hit and smash.

Do NOT touch DailyChallengeScreen.tsx in this prompt. Do not change dailyThrowGoneMs yet.
Run npm run typecheck and npm test.

Commit message:
Daily breach: pure tier model and beat timing from the clue count

One ladder (reuses resolveDailyCelebrationGrade), one clock. 'open' reproduces today's throw timing exactly.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 3: the broken gate, gate rumble, door cracks

```
Concern: DailyGate can show the broken gate (hole in the bottom two clue planks), shudder side to side, and
show cracks on the shut door. Visual only; nothing calls it yet.

Read first: app/components/DailyGate.tsx, the gate/clue rect code in app/components/DailyCastleStage.tsx
(gateFrame, clueRects, resolveDailyGateClueRects, dailyGateClosed in app/ui/dailyCastleScene.ts), and
CONTEXT.md THE BREACH. react-native-svg 15.15.4 is already a dependency; use it for the cracks.

1. DailyGate props (all optional, defaults = today's behaviour exactly):
   - broken?: boolean. When true, render assets/images/dailycastle/gate_door_broken.png instead of gate_door.png,
     same frame (it is the same 1399x1597 canvas; same explicit width/height, resizeMode stretch). Keep BOTH images
     mounted and switch by opacity so the swap never flashes an empty frame (the repo's rule for stacked art).
   - jitterX?: Animated.Value (native driver). Adds a translateX to the gate's existing transform. Used for the
     gate's shudder (mock: gateRumble, random +/-3.5 pt over 720 ms for two clues, +/-4 pt over 500 ms for one clue,
     decaying to 0). Do not use random at render time: the caller will drive it with a deterministic keyframe
     interpolation (see prompt 4).
   - cracks?: Animated.Value 0..1 opacity (native driver) for a cracks overlay.
2. Cracks overlay: an SVG child of the gate (so it travels with it), seven short dark crack lines (#12041F, stroke
   1.6 in canvas points, round caps) radiating from the centre of where the hole will be, each 4 segments of 9-20 pt
   with +/-0.5 rad wobble. In the mock the centre is (215, 342) canvas points = (96.3, 194.7) inside the opening, but
   that is the mock's fixed layout: the real gate moves with resolveDailyClueTop (it is centred in the door unless the HUD
   would cover the clues), so anchor the cracks to the HOLE IN THE ART (item 3), in the gate's own coordinates. Generate the lines from a FIXED seed (put the seed and a small seeded generator next to the geometry;
   there is already a seededRandom in app/game, reuse it if it is RN-free) so the cracks are identical every time.
   Opacity 0 at rest. Scaled by the same screen scale as the gate. The clue text must stay readable: cracks are
   dark thin lines, drawn UNDER the clue text.
3. The hole: it is in the art (a transparent region in the bottom two clue planks). Do not draw it. MEASURE its centre
   from the alpha channel of gate_door_broken.png (centroid of the fully transparent region inside the planks, in art
   pixels; the art is drawn at 0.3644 pt per art pixel, see DAILY_GATE_CLOSED) and export it as DAILY_BREACH_HOLE in
   gate-art coordinates in app/ui/dailyCastleScene.ts, with a helper that converts it to canvas points for a given clueTop
   (gateClosed(clueTop) origin + art offset). Cross-check against the mock's centre (208, 341) canvas points at the
   default clueTop and report the difference. Prompt 4 aims bolts and splinters at this point. Also report: on the phone
   sizes the app supports, how far does resolveDailyClueTop shift the gate from its default? The plaque's handoff
   point (DAILY_CASTLE_FLIGHT.handoff = 215, 342) is fixed, so if the gate can shift by more than a few points the
   plaque and the hole will not line up; do NOT change DAILY_CASTLE_FLIGHT, just report the numbers to Pete.
4. Clue visibility: with broken=true the gate shows revealedCount 1 only (the hole sits where clues two and three
   would be). The caller already passes revealedCount; add a test or a dev assertion that DailyGate never renders
   clue 2 or 3 text while broken is true (hide them even if revealedCount says otherwise).
5. No change to the wrong-claim slam, the openTravel/maxSink maths, or the clue fitting.

Verify on the phone later; here run npm run typecheck and npm test. If a test pins DailyGate's source text
(see app/ui/dailyHaptics.test.ts and other source-pinned tests) and your change breaks it, update the pin ONLY if
the pinned behaviour is unchanged, and say which pins you touched.

Commit message:
Daily breach: DailyGate can show the broken gate, shudder and door cracks

Optional props, defaults unchanged. Cracks are seeded so they are the same every time.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 4: castle effects (shake, tiered gold hit, white wash, lightning, splinters, dust, screen flash)

```
Concern: DailyCastleStage can play the breach effects. Visual only; the claim flow calls it in prompt 5.

Read first: app/components/DailyCastleStage.tsx in full (gold hit block ~lines 355-395, layer order comment ~lines
90-100, the wall group), app/ui/dailyCastleScene.ts (DAILY_GOLD_HIT, dailyGoldHitKeyframes, DAILY_CASTLE_CAPS,
DAILY_CASTLE_CAP_GLOWS, DAILY_CAP_GLOW_SIZE), app/ui/dailyPlaqueEntrance.ts (DAILY_WALL_TREMBLE_X/Y,
dailyWallTrembleKeyframes: the existing deterministic-keyframe tremble; copy that pattern, do not use
Math.random in render), app/ui/dailyBreach.ts (prompt 2).

NOTE ON A LOCKED ITEM: the code marks the castle's gold hit "device-approved and LOCKED" (2026-09-29). Pete asked
on 4 Nov for bigger, stepped versions of it for the breach, so changing it for the 'hit' and 'smash' tiers is
authorised. The 'open' tier uses the new "big3" values too (Pete approved big3 in the 4 Nov mock). The old
DAILY_GOLD_HIT / dailyGoldHitKeyframes stay as the CALM variant source (Reduce Flashes) until prompt 9.

1. Tiered gold hit. Add to dailyCastleScene.ts a table DAILY_GOLD_HIT_TIERS keyed by tier with the mock's numbers.
   Each: ms = [ignite, hold, decay]; keyframes for trim, tint, glow, glowScale, plus white (full-castle white wash)
   and halo (multiplier for a soft halo around the trim):
     open  (big3): ms [100,260,500] trim [0,1,1,0] tint [0,.85,.7,0] glow [0,1,1,0] glowScale [.9,1.45,1.25,1] white [0,.18,.06,0] halo 1
     hit   (big2): ms [80,340,560]  trim [0,1,1,0] tint [0,1,.9,0]   glow [0,1,1,0] glowScale [.9,1.75,1.5,1]  white [0,.45,.18,0] halo 1.5
     smash (big1): ms [70,460,700]  trim [0,1,1,0] tint [0,1,1,0]    glow [0,1,1,0] glowScale [.9,2.1,1.8,1]   white [0,.6,.25,0]  halo 2.2
   Colour stays DAILY_GOLD_HIT_COLOR #F5C842. The white wash is a second copy of the CASTLE_GOLD_FLASH art with tintColor '#FFF6D8' (the mock masks a #fff6d8 fill
   with that art) at the white keyframe opacity, over the gold layers. The halo is a soft gold radial glow behind the
   castle top, in the mock a 430 x 520 pt ellipse centred at 50% x 38% of that box at the scene's top, radial gradient
   rgba(245,200,66,.55) fading to 0 at 68%, at opacity min(1, trim * 0.55 * halo). Draw it with react-native-svg
   (RadialGradient), already installed; no blur and no new asset.
   Export dailyGoldHitMsForTier(tier) for the finale hold-off (dailyCoinFinaleFloorHoldMs takes a duration).
   Stage prop: change goldHitToken: number to goldHit: { token: number; tier: DailyBreachTier } (keep 0 = never).
   Under calmGoldHit (Reduce Flashes or Reduce Motion) keep today's calm behaviour for every tier for now.

2. Castle shake. A decaying shake of the whole stage content (castle, gate, wall group, plaques), driven by one
   Animated.Value 0..1 and deterministic keyframes (copy the wall tremble's approach), native driver, resting at
   exactly 0 at both ends and on unmount. Two named profiles: hit = amplitude 7 pt over 720 ms; smash = 13 pt over
   950 ms; both decay linearly to 0. Expose the same two interpolated translate values (x, y) so the SCREEN can apply
   them to Polly's overlay too (the mock shakes the "world", Polly included). Stage prop: shake?: { token: number;
   profile: 'hit' | 'smash' } (0 = never). The wall group already has its own tremble transform; the breach shake is
   a separate parent transform, never merged into the wall's channel.

3. Lightning (smash only). Two bolts, 110 ms then 80 ms apart, each lasting ~70 ms. Each bolt is an SVG polyline
   (stroke #A98CFF width 9 opacity .55 under stroke #FFFFFF width 3.2, round joins) from the sky down to three
   targets: the hole (DAILY_BREACH_HOLE), the left tower cap centre (35.3, 102.3) and the right tower cap centre
   (394.3, 102.3); start x about 190-240 for the hole bolt, 10-70 for the left, 360-420 for the right; segments of
   30-56 pt stepping 25 percent toward the target with +/-18 pt wobble. Use FIXED seeds for the two bolt shapes
   (two precomputed shapes), not Math.random. Each bolt also fires a screen-wide white flash at opacity .5 decaying
   over 200 ms. The bolts draw above the castle and below the plaque in the front flight and below Polly's overlay.

4. Splinters and dust (smash: 26 splinters, 9 dust puffs at the hole; hit: 7 dust puffs at (215,342), no splinters).
   Splinters: small slivers w 4-10, h 16-46 pt in #3F2787 #3A2380 #1C0A2E #2B1A5E and a few #E0B030, thrown from
   around the hole at 180-520 pt/s with gravity 1300 pt/s^2 and a 120 pt/s upward kick, spinning +/-700 deg/s,
   fading over 1.0 s. Dust: soft round puffs 26-60 pt (radial gradient rgba(210,195,235,.55) fading to 0 at 70%, an SVG RadialGradient),
   rising 34 pt, growing from .6 to 1.7 times, fading over 700 ms. Drive them with
   Animated transforms on the native driver from precomputed per-particle parameters generated from a fixed seed
   (26 + 9 views mounted only while a breach plays, removed after). Cap: if profiling the smash shows frame drops,
   halve the splinter count and say so; do not silently drop effects.

5. A plain white screen flash for the 'hit' tier: opacity .18 decaying over 200 ms (the mock's flash(.18,200)).
   One shared full-stage white layer serves this, the lightning flashes and nothing else.

6. All of it plays only when asked; at rest every effect layer is opacity 0 and pointerEvents none; nothing intercepts
   touches; nothing remains if the Daily is left mid-effect (clear on unmount and on a new round key).

7. Photosensitivity: the smash has 2 bolts (each with a .5 flash) plus the gold hit's white peak inside about 700 ms.
   That is the maximum Pete accepted. Do not add any further full-screen flash to any tier. Leave a comment with the
   count and the limit (no more than three flashes in any one second).

Add tests for the pure parts (tier table values, deterministic particle/bolt generators return identical output
for the same seed, shake keyframes start and end at 0). Run npm run typecheck and npm test.

Commit message:
Daily breach: tiered gold hit, castle shake, lightning, splinters and dust in DailyCastleStage

Effects exist and are driven by props; the claim flow wires them next. Gold hit is now graded big3/big2/big1;
the old keyframes stay as the calm variant.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 5: the claim flow (timing, contact-timed gate, sounds, finale)

```
Concern: wire the tier model into the real correct-claim sequence in DailyChallengeScreen. This is the risky
prompt: it changes when the gate rises. Surgical.

Read first: app/screens/DailyChallengeScreen.tsx lines ~140-170 and ~895-1250 (dailyGateRiseMs, dailyThrowGoneMs,
the CLAIM RESULT effect, runPhysicalCorrectTransition, handleClaim), app/ui/dailyBreach.ts, app/ui/dailyCoinFinale.ts
(dailyCoinFinaleFloorHoldMs and its callers), app/components/DailyCastleStage.tsx props, app/components/PollyDailyPerch.tsx
(throwDelayMs, the exit failsafe constant DAILY_POLLY_EXIT_FAILSAFE_MS), app/ui/dailyHaptics.test.ts and every
other test that reads DailyChallengeScreen.tsx source (grep for readFileSync of it) so you know which pins this touches.

Rules that must hold afterwards:
- Tier 'open' is byte-for-byte today's timing and effects, except the gold hit is now "big3" (prompt 4).
- Input stays locked from the claim until finishPhysicalCorrectTransition, as today; no new way to claim twice.
- Reduce Motion: every tier plays today's calm sequence (dailyBreachBeats(tier, false)); no contact beat, no hold.

Do this:
1. Compute the tier from the round being claimed: round.revealedClueCount at the moment of the claim (the same value
   already used for resolveDailyCelebrationGrade in handleClaim). Store it in a ref for the transition so a late
   timer cannot read a different round.
2. runPhysicalCorrectTransition(candidate, origin, tier): replace the single "gate rises at t=0" with the beats from
   dailyBreachBeats(tier, motion):
   - open: unchanged.
   - hit/smash: the gate does NOT rise at claim start. The plaque flight runs (rise to the handoff point). At
     contactMs fire the contact beat (below). The gate starts rising at gateRiseStartMs, the plaque absorbs per
     plaqueAbsorbMs. The existing flightProgress sequence is split: first leg to DAILY_CASTLE_FLIGHT_HANDOFF over
     plaqueRiseMs, hold at the handoff until the plaque absorb start, then the absorb leg. For smash the absorb leg
     starts AT contact (the plaque goes through the hole at once) while the gate rises later at gateRiseStartMs.
   - goneAtMs = beats.thrownGoneMs (replaces dailyThrowGoneMs(motion) inside this function); the 'landed' phase and
     'dailyRodStop' haptic stay on goneAtMs; dropAtMs = goneAtMs + tunnelBeatMs as today.
   - Update dailyThrowGoneMs to take the tier: dailyThrowGoneMs(motion, tier) = dailyBreachBeats(tier, motion)
     .thrownGoneMs, and pass the tier to every caller (including the Polly bubble's throwDelayMs prop, which today
     uses dailyThrowGoneMs(reduceMotion === false)). The Polly bubble for the claim must wait for the new value so it
     never covers the breach.
   - The safety-net timer and the coin finale hold-off (dailyCoinFinaleFloorHoldMs with the gold hit duration) must
     use the new numbers: dropAtMs, and the gold hit duration for the tier (dailyGoldHitMsForTier from prompt 4).
     Recheck the arithmetic and write it in a comment.
3. Contact beat (hit and smash), all at contactMs, fired by ONE scheduleCorrectTransition callback (not separate
   timers), guarded by completingCandidateRef like the others:
   - hit  : playSfx('breachGateCrack'); playSfx('breachCastleRumble'); gold hit tier 'hit'; stage shake profile 'hit';
            gate jitter (3.5 pt, 720 ms); door cracks fade in (on at contact, off at gateRiseStartMs); white flash .18;
            dust at the plaque; Haptics breach cue 'hit' (prompt 8; until then call Haptics.cueAsync('trapRejectHeavy')
            as a stand-in and leave a TODO naming prompt 8); a 6 pt, 90 ms press-in on the plaque at the contact
            (the mock: the plaque dips 6 pt and scales down .04 for 90 ms).
   - smash: playSfx('breachSmash'); playSfx('breachCastleRumble'); playSfx('breachThunder'); gold hit tier 'smash';
            swap the gate to the broken art (DailyGate broken=true); stage shake 'smash'; gate jitter (4 pt, 500 ms);
            splinters, dust, two lightning bolts; Haptics 'smash' cue (stand-in: 'bossEntry' until prompt 8).
   - open : at t=0 as today: playSfx('correctClaim'), gold hit tier 'open'.
   The gold hit and sounds that fire at the claim moment today (setGoldHitToken, playSfx('correctClaim')) must move
   with the tier: for hit and smash the claim moment keeps ONLY the claim haptic (dailyCelebrationHaptic stays as it
   is) and NO correctClaim chime and NO gold hit until contact. Say in your report exactly what plays at the claim
   moment and at contact for each tier.
4. After the broken gate rises away, the next gate must be the whole one: set broken=false while the gate is fully
   up (before the drop), and the drop that brings the next round's clues is unchanged. The cracks overlay is off by
   then. A win: the broken gate lifts away and no gate drops back (as today's win path); verify the finale still
   starts after the right beat.
5. Cleanup: clearCorrectTransitionTimers must also stop the new animations and reset broken/jitter/cracks/shake
   state; a new round, leaving the Daily and unmount never inherit a half-played breach. Pause mid-breach: check
   how the pause card interacts with scheduleCorrectTransition today and keep that behaviour; report what it is.
6. The wrong-claim path is untouched in this prompt.
7. Update the source-pinned tests only where the pinned behaviour truly changed (say which pins and why); keep the
   rule "the gate lands: one Medium tap on every correct claim including the win" true.

Run npm run typecheck and npm test. Report: the beat table you implemented per tier with motion on and off, which
tests you touched, and anything in the code that disagreed with this prompt.

Commit message:
Daily breach: correct claims play the tier's breach, graded by the round's own clue count

Two clues: the plaque hits the shut gate and the gate waits. One clue: it breaks through. Three clues: today's
sequence. The gate no longer rises at claim start for hit/smash; throw timing, Polly bubble delay, safety net and
finale hold-off all follow the tier.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 6: Polly's tier moves (two clues: jump; one clue: fury)

```
Concern: PollyDailyPerch performs the two-clue jump and the one-clue fury move, started by the screen. The win
round plays the tier move FIRST, then today's win (Pete, 4 Nov).

Read first: app/components/PollyDailyPerch.tsx in full, the CLAIM RESULT effect and handlePollyReactionComplete in
app/screens/DailyChallengeScreen.tsx (~lines 440-470, 900-945, 1580-1615), app/audio/pollyReactionSfx.ts,
app/ui/dailyBreach.ts (dailyBreachPollyMoveMs), the layout numbers in app/ui/dailyCastleScene.ts (DAILY_POLLY_PERCH,
DAILY_POLLY_BUBBLE), app/ui/pollyScreenPoses.ts (prompt 1 added the poses).

Design (all numbers from the approved mock; offsets are points, the same unscaled kind as the existing reactX/reactY):
Polly's box is 187.5 pt (150 x 1.25) at the perch. She must never cover the clues, the blocks or the UP lane and must
stay on screen: the moves stay in the strip to the left of the castle.

New perch prop: breach?: { token: number; tier: 'hit' | 'smash' } | null (token changes per breach, like reactionKey).
Add every pose the moves use to PERCH_LAYER_POSES so each stays mounted and switches by opacity (the existing rule).

TWO CLUES ('hit'), starts at the CONTACT moment (the screen passes the token at contactMs):
  t 0-140 ms     pose `shocked` on the perch (play the existing startled pool: playPollyReaction('startled'))
  t 140-1073     pose `masterShock`, straight up and down (no sideways step, x stays 0), y = interpolate this table
                 (time ms -> y in pt; linear between samples). Source: Pete's video, video px x 187.5/304:
                 0:-27.8 33:-49.4 67:-66.0 100:-87.0 133:-88.8 200:-89.5 300:-90.1 333:-88.8 367:-86.4 400:-77.7
                 433:-70.9 467:-62.9 500:-50.0 533:-45.7 567:-32.1 600:-28.4 633:-18.5 667:-12.3 700:-9.9 767:-6.8
                 867:-3.7 900:-0.6 933:0 (times are from the jump's start; the jump lasts 933 ms)
  then           pose `embarrassed`, y 0, held 1300 ms (through the gate's rise and the next gate's drop), then back to
                 the idle pose.
ONE CLUE ('smash'), starts at the THROW (claim moment, t = 0), so it is not tied to the contact time:
  0-130          `angryYell`; play the existing angry pool (playPollyReaction('angry')) at t=0
  130-260        `sulk` crouch: y 0 -> +4 (ease out)
  260-380        `flyAngry`: x 0 -> +18, y +4 -> -36 (ease out). She ends this step exactly as the plaque reaches the gate.
  380-580        `jumpAngry`: blown up and back to (x +10, y -120), rotate 0 -> -6 deg, ease out cubic; play the
                 existing startled pool at 380 (playPollyReaction('startled'))
  580-1060       still `jumpAngry`, shaking in mid-air: jitter +/-3 pt decaying to +/-1.5, y drifts -120 -> -114, rotation
                 -6 +/- 2 deg decaying; DETERMINISTIC jitter (precomputed keyframes), not Math.random in render
  1060-1440      falls to the perch: (x, y, rotate) -> (0, 0, 0), ease in quad
  1440-1570      pose `angry`, landing bounce y 0 -> +3 -> 0 over 130 ms
  1570-2870      holds `angry` 1300 ms (through the next gate's drop), then back to idle
  These are start values; the apex of -120 is deliberately higher than the two-clue jump (-90) and her right wing tip may
  touch the left edge of the hole for a moment (Pete knows).
The breach shake from prompt 4 (the 'world' shake) also applies to Polly's overlay: apply the stage's shake translate to
the perch root while a breach shake is active (the screen passes the Animated values down).

Interaction with her existing reactions:
- While a tier move runs it OWNS her pose. The 'correct' reaction (bubble after throwDelayMs) must not set the idle pose
  at claim start while a move is active; its bubble still appears at throwDelayMs (now the tier's thrownGoneMs) and the
  speech bubble position is unchanged (DAILY_POLLY_BUBBLE). When the move ends she returns to idle unless a later
  reaction has set a pose.
- WIN round solved on 2 or 1 clues: the tier move plays first, then today's win. So the 'shocked' win reaction (pose,
  startled sound, recoil, bubble, fly-off) must START when the move (+ its hold) ends, not at the claim. Do it in the
  screen: delay setPollyPose('shocked') by dailyBreachPollyMoveMs(tier).moveMs + holdMs; set pollyExitPending
  IMMEDIATELY at the claim as today so Results still waits; pass the perch a throwDelayMs reduced by the same delay (floor 0);
  and raise DAILY_POLLY_EXIT_FAILSAFE_MS so it cannot fire before her real exit: failsafe = today's 6000 + the move delay +
  a 1000 ms margin, computed per claim. Today's normal exit is "about 3.9 s after the winning claim"; write the new
  arithmetic in a comment. 'open' wins are unchanged.
- LOSS never reaches this (a loss follows a wrong claim).
- Reduce Motion: no tier move at all; she does today's 'correct' reaction (idle pose + bubble). Calm details in prompt 9.
- If a new claim, pause or unmount interrupts a move, stop all its Animated values and return her to rest at (0,0,0) with
  the idle pose; never leave her offset.

Tests: pure helpers only (the jump table interpolation returns the table values at its sample times and 0 at the ends;
the fury timeline segments are contiguous and sum to 2870 ms). Put the tables and a small timeline function in
app/ui/pollyDailyBreach.ts (RN-free) and test that. Run npm run typecheck and npm test.

Commit message:
Daily breach: Polly jumps on a two-clue claim and flies into a fury on a one-clue claim

Tier moves own her pose while they run; the winning round plays the tier move first, then today's win
(the exit failsafe grows with the move).

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 7: the lost-life dance (replaces the first-miss lean)

```
Concern: Polly's reaction to the FIRST lost life becomes the dance. The second lost life (game over) is untouched.

Read first: app/components/PollyDailyPerch.tsx (the 'happy' reaction: POSE.happy 'point', the reactX lean, the
bubble timing, playSfx('pollySqwawkShort')), toPerchReaction and the CLAIM RESULT effect in
app/screens/DailyChallengeScreen.tsx, DAILY_FIRST_MISS_LINE in app/ui/pwDailyMaterials.ts (POLLY_LINES.dailyButterKnife
= "Sharp as a butter knife."), DAILY_POLLY_BUBBLE in app/ui/dailyCastleScene.ts. Confirm from the code that play is not
locked by Polly's reaction (input locks only for the claim presentation), because the dance must never cover blocks,
clues or the UP lane.

Replace the 'happy' reaction's pose and motion with this sequence (all inside her left strip; offsets in points, the same
unscaled kind as reactX/reactY; times are ms from the reaction start):
  0-250     `laugh01` on the perch
  250-500   `laugh03`, a small bob: y = -3 * sin(2*pi*p) over the 250 ms
  500-850   `flyGrin`, hop up: x 0 -> +6, y 0 -> -44 (ease out cubic)
  850-1650  `hauntTaunt`, hover and point: x drifts +6 -> -8 (ease out over the first half), y = -44 + 4*sin(3*pi*p)
            (a small bob). The "Sharp as a butter knife." bubble fades IN at 850 (180 ms) and fades OUT from 1650 (160 ms)
            so it shows while she hovers and points. Her wing must stay clear of the left edge of the clue planks (castle x >= 127 pt);
            at x -8 it clears with the margin the mock measured.
  1650-2000 falls to the perch: (x, y) -> (0, 0), ease in quad, still `hauntTaunt`
  2000-2110 `laugh` (the bigLaugh art): landing bounce y 0 -> +3 -> 0 over 110 ms
  2110-2500 holds `laugh`, then returns to idle. Total about 2.5 s.
Sound: the existing playSfx('pollySqwawkShort') at t=0, exactly when the old first-miss squawk fired (Pete, 4 Nov:
"existing short squawk"). No new sounds.
Reduce Motion: no hop or bob. Show `laugh` on the perch for the old 2500 ms hold, bubble as today, no offsets.
The 'happy' reaction owns the bubble for its duration exactly as today (reactionToken, onReactionComplete after the bubble
fades, the existing ~2500 ms reaction length); keep the end of the dance aligned with that timer so
handlePollyReactionComplete still fires once at the end. If the old bubble timing (appears at 0, hides at 2500) conflicts
with the new in-dance timing, change the 'happy' branch only, not 'laughing', 'shocked' or 'correct'.
Add every pose it uses to PERCH_LAYER_POSES. Put the timeline tables in app/ui/pollyDailyDance.ts (RN-free) and test that the
segments are contiguous and total 2500 ms; add it to the npm test script. Interruption (new claim, pause, unmount) resets her
to (0,0,0), idle pose, as for the breach moves. Remove the old lean branch for 'happy'; do not leave dead code.

Run npm run typecheck and npm test. Report which tests, if any, pinned the old behaviour.

Commit message:
Daily: Polly's first lost life is a dance, not the pointing lean

Laughs, hops, hovers pointing with the butter-knife line, drops and lands laughing, about 2.5 s, all in her left
strip. Existing short squawk; Reduce Motion shows the laugh pose only.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 8: breach haptics (start values, tuned on the phone)

```
Concern: heavy haptics for the breach. Pete: "I want them to hit heavy when the castle rumbles. I want to feel it.
When the brick breaks, I want to feel it." expo-haptics cannot do a long variable buzz, so the rumble is simulated
the way gauntletWallTremble does it. These are START values; Pete tunes them on his phone.

Read first: app/utils/haptics.ts (HapticCue, cueAsync, gauntletWallTremble's timeout list and cancel,
dailyGateShut/dailyRodStop), app/ui/dailyHaptics.test.ts. NOTE: comments in haptics.ts keep Heavy for boss beats; Pete
overrode that for the breach on 4 Nov. gauntletBrickLand already uses Heavy.

1. Add two cues to HapticCue and cueAsync, going through the same hapticsEnabled gate:
   - 'breachHit' (two clues, at the plaque hitting the shut gate): Rigid at 0, Heavy at 55 ms, then a rumble tail of
     Soft impacts every 60 ms from 120 to 480 ms (7 pulses). Total about 0.5 s, matching the 720 ms castle shake's
     strongest part.
   - 'breachSmash' (one clue, at the brick breaking): Heavy at 0, Heavy at 70 ms, Rigid at 130 ms (the crack), then a Soft
     rumble every 55 ms from 190 to 850 ms (13 pulses) ending with Medium at 900 ms. Total about 0.9 s, matching the 950 ms
     shake.
   Both keep their pending timeouts in a module list and are cancelled by a new Haptics.cancelBreach() (same pattern as
   cancelGauntletWallTremble) and by starting either cue again.
2. In app/screens/DailyChallengeScreen.tsx, replace the stand-ins from prompt 5 ('trapRejectHeavy' for hit, 'bossEntry' for
   smash) with 'breachHit' and 'breachSmash', fired from the SAME contact callback as the sounds (never a parallel timer).
   Call Haptics.cancelBreach() wherever clearCorrectTransitionTimers runs and on unmount.
3. Each pulse spacing, count and style lives in ONE exported constants block so Pete's phone pass changes numbers in one
   place; no magic numbers in the switch.
4. Reduce Motion: the haptics stay (they are not motion), but Reduce Flashes/Reduce Motion do not change them. Report if
   there is an existing user setting that should gate them differently.
5. The graded claim haptic (standardCorrect / claimMedium / heightenedCorrect) fired at the claim stays as it is.
   Update source-pinned tests in app/ui/dailyHaptics.test.ts only for what changed, and add a pin that the two new cues
   fire from the contact callback.

Run npm run typecheck and npm test.

Commit message:
Daily breach: heavy haptics for the plaque hit and the brick break

breachHit and breachSmash: a hard hit, then a rumble tail that matches the shake. Start values for a phone pass.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## Prompt 9: Reduce Motion and Reduce Flashes

```
Concern: calm variants of everything the breach added. Pete: "If we have to take everything off for reduce motion,
then do it, whatever's needed."

Read first: app/game/gameplayFeedbackAccessibility.ts (resolveGameplayFeedbackAccessibility: animateMotion,
animateFlashes), app/hooks/usePollyAmbientMotion.ts (useReducedMotionPreference returns true while unknown;
useReducedFlashesPreference), how DailyChallengeScreen already uses them (reduceMotion === false = motion on), and the
beats from app/ui/dailyBreach.ts.

Rules (one decision per flag, no special cases):
- Reduce Motion ON (or still unknown): the breach has NO contact beat, NO hold, NO shake, NO gate jitter, NO splinters,
  NO dust, NO lightning, NO door cracks, NO plaque flight (that is today's calm path), NO Polly tier move and NO dance
  motion. Every tier plays today's calm correct-claim sequence (gate lift 120 ms, tunnel beat 80, drop 120). Sounds:
  the claim plays today's correctClaim chime for every tier (the breach sounds belong to the contact beat, which does not
  exist here). Haptics: the claim's graded haptic as today, plus ONE breach cue per tier at the claim moment (breachHit for
  two clues, breachSmash for one) so the grade is still felt; report if you think that is wrong.
  Polly: today's 'correct' reaction; the dance becomes the `laugh` pose on the perch with the bubble (prompt 7).
- Reduce Motion OFF, Reduce Flashes ON: motion plays but every light effect is calm. The gold hit uses the CALM keyframes
  (today's dailyGoldHitKeyframes(true): same gold, gentler ignition, no overshoot or swell) for every tier, with NO white
  wash and NO halo; NO lightning bolts and NO screen-wide white flashes; the tier is carried by shake, sound, haptics, the
  broken gate and splinters. Keep the broken gate art for the one-clue tier.
- Flash budget check: write a test or an assertion over the tier tables that, with Reduce Flashes off, no tier has more than
  three flash peaks (bolt flashes + white wash peak + hit flash) inside any 1000 ms window, and with Reduce Flashes on, none.
- The wrong-claim path and the dance obey the same flags.
Report, per flag, exactly which effects are removed or replaced and where each decision lives (one helper, not scattered
checks). Run npm run typecheck and npm test.

Commit message:
Daily breach: Reduce Motion and Reduce Flashes calm variants

Reduce Motion plays the short calm claim for every tier. Reduce Flashes keeps motion but drops the bolts, the white wash and
the screen flashes. A test pins the flash budget.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```

## After the build: what Pete checks on the phone (one pass)
1. Three-clue round: same as before except the bigger gold hit.
2. Two-clue round: plaque stops at the shut gate, shake and crack, gate lifts, plaque goes through, Polly jump then embarrassed.
3. One-clue round: plaque breaks through, bolts, splinters, thunder, Polly's fury, broken gate lifts, whole gate drops.
4. Win round on one and two clues: tier move, then the shocked win and the fly-off, then the gold coin, then Results.
5. First lost life: the dance and the butter-knife line; second lost life ends the game as before.
6. Haptics: the hit and the brick break feel heavy; tune the constants in `app/utils/haptics.ts`.
7. Reduce Motion and Reduce Flashes: both settings, each tier.
8. Small and large phones: Polly stays on screen and off the clues, blocks and UP lane in every move.
9. Still never run on a phone: the 4 Nov entry card and onboarding card (Reset Progress shows the long card, DEV RESET DAILY the short one).

## Delta update prompt for CLAUDE.md and CONTEXT.md (run AFTER prompt 1 is committed; update again when 2-9 land)

```
Docs only. In CONTEXT.md section "THE BREACH": replace "NOT yet saved" with: the broken gate is saved as
assets/images/dailycastle/gate_door_broken.png (1399x1597, same frame as gate_door.png, hole in the bottom two clue
planks) and the four sounds are registered as breachGateCrack, breachCastleRumble, breachSmash, breachThunder
(Pixabay Content License, see assets/audio/LICENSES.md). Record the settled design: every round is graded by its own
revealedClueCount, winning round included; three clues = today's sequence with the bigger gold hit (big3); two clues
= plaque hits the shut gate, shake, door cracks, gold hit big2, white flash .18, gate lifts after 760 ms, Polly shocked
then a straight-up jump then embarrassed; one clue = plaque breaks through, splinters, dust, 2 lightning bolts,
thunder, heavy shake, gold hit big1 with a white wash, Polly's fury move; the winning round plays the tier move first,
then the win; first lost life = Polly's dance replacing the pointing lean (existing short squawk). Record: the gold
hit's old LOCKED label no longer applies (Pete, 4 Nov); only the swipe is locked. Record the build order (prompts 1-9
in claude/POLYWORDS_SESSION_2026-11-04_BREACH_BUILD_PROMPTS.md) and that haptics are tuned on the phone. In CLAUDE.md add
one line pointing to that file. Do not change anything else.

Commit message:
Docs: the breach design is settled and its art and sounds are in the repo

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LmViNGequDtGFRZKcv6kvE
```
