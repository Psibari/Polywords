import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  DAILY_FIRST_MISS_LINE,
  DAILY_LOSS_LINE_IDS,
  DAILY_MOOD_LINES,
  DAILY_WIN_LINE,
  DailyPollyReaction,
} from '../ui/pwDailyMaterials';
import { playSfx } from '../audio/sfx';
import { playPollyReaction } from '../audio/pollyReactionSfx';
import { PollyScreenPoseName, pollyScreenPoseArt, pollyScreenPoseUsesRig } from '../ui/pollyScreenPoses';
import { POLLY_LINES, PollyLineId } from '../game/pollyCharacter';
import { BookRivalryState } from '../game/pollyBookLines';
import { pickFreshLine } from '../game/pollyVisitPolicy';
import { useGameStore } from '../store/useGameStore';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollyPerchRig, POLLY_PERCH_RIG_ENABLED } from './PollyPerchRig';
import { PollySpeechBubble } from './PollySpeechBubble';
import { DAILY_POLLY_BUBBLE } from '../ui/dailyCastleScene';
import { POLLY_DANCE_MS } from '../ui/pollyDailyDance';
import {
  DAILY_PERCH_EXIT_POSE,
  DAILY_PERCH_FLY_POSE,
  DAILY_PERCH_LAYER_POSES,
  DAILY_PERCH_POSE,
  DailyPerchMove,
  composeDailyPerch,
  dailyPerchOwnOpacity,
} from '../ui/pollyDailyPerchLayers';

// DailyPollyReaction here is pwDailyMaterials' POSE-keyed type ('perched' |
// 'happy' | 'laughing' | 'shocked'), NOT the trigger type of the same name in
// game/types.ts. 'correct' is a distinct trigger that happens to render the
// same 'perched' pose, so it's added on locally rather than folded into
// either DailyPollyReaction.
type Reaction = DailyPollyReaction | 'correct';

type Props = {
  reaction: Reaction | null;
  /**
   * New for every reaction the screen sends, so a repeat of the same
   * reaction (two correct claims in a row) still starts a fresh one.
   */
  reactionKey?: number;
  /**
   * Called once per reaction, with its reactionKey, when its bubble has
   * faded. Not called for a reaction a newer one replaced, or after unmount.
   */
  onReactionComplete?: (key: number) => void;
  rivalryState: BookRivalryState;
  show?: boolean;
  /**
   * Window point for the top-left of her picture box, at the wall low on the
   * left (DAILY_POLLY_PERCH, converted by the screen with the castle frame).
   * She stays hidden until it is known.
   */
  perchAt?: { x: number; y: number };
  /**
   * Window point for the speech bubble's top-left, on the castle steps to her
   * right, so it never covers a clue (Pete, 2026-09-26). Without it the
   * bubble sits beside her.
   */
  bubbleAt?: { x: number; y: number; maxWidth: number };
  /**
   * How long a correct claim's throw takes to clear the steps. The bubble for
   * 'correct' and the win waits this long, so it never covers the plaque.
   */
  throwDelayMs?: number;
  /**
   * Called once she has flown out after the Daily's last line (win or loss).
   * The screen holds Results until then.
   */
  onExited?: () => void;
  /**
   * The breach clocks (ui/dailyBreach.ts), ms from the claim, which the screen
   * starts with the plaque's first leg. Her tier moves (ui/pollyDailyBreach.ts)
   * ride them: the two-clue jump from the contact, the one-clue fury from the
   * throw. While a move runs it owns her pose; at 0 (rest) it shows nothing.
   * Each clock has a live gate (0/1, only ever set, never animated): the
   * screen sets it to 1 as it starts that clock and to 0 BEFORE it stops one,
   * so a stopped clock can never light a layer (ui/pollyDailyPerchLayers.ts,
   * THE LIVE GATES).
   */
  breachClocks?: { hit: Animated.Value; smash: Animated.Value; hitLive: Animated.Value; smashLive: Animated.Value };
  /** The castle shake's translate values (DailyCastleStage onShakeTransform); 0 at rest. */
  shake?: {
    translateX: Animated.AnimatedInterpolation<number>;
    translateY: Animated.AnimatedInterpolation<number>;
  } | null;
};

// Clean full-pose drawings (background stripped to transparent). The expression
// lives in the art; life + menace come from whole-image motion + the SFX.
// Art and multipliers come from the shared screen table (pollyScreenPoses.ts):
// master art at 1, except idle, which stays sprite4 for the face rig. Which
// pose each reaction shows, and which layer is visible, live in
// ui/pollyDailyPerchLayers.ts (pure, tested).
const POSE = DAILY_PERCH_POSE;
const POSE_FLY = DAILY_PERCH_FLY_POSE; // fly-in entrance
// Her picture box: the original 150 pt perch box times DAILY_POLLY_SCALE.
// One size for the rig and every pose layer, so they all grow together. Tune
// DAILY_POLLY_SCALE on the phone; the wall spot is the 150 pt box's, and she
// grows up and to the right from its bottom-left corner (see pollyWrap below).
const DAILY_POLLY_BASE_SIZE = 150;
const DAILY_POLLY_SCALE = 1.25;
const DAILY_POLLY_SIZE = DAILY_POLLY_BASE_SIZE * DAILY_POLLY_SCALE;

// The win and the loss end the Daily: once that last line has faded she flies
// out (win: angry, loss: grinning) and Results opens after she is gone.
const EXIT_POSE: Partial<Record<Reaction, PollyScreenPoseName>> = DAILY_PERCH_EXIT_POSE;

// Arrival (Pete, 2026-10-08): when play starts she flies in from the top-left
// in the fly pose, drifting down to her wall spot and slowing as she lands; on
// landing she switches to idle. Tune on the phone.
const DAILY_POLLY_ENTRY_MS = 650;
// Start: her box this far left of the wall spot, and its top this far above
// the screen's top edge (one box height, so she starts fully off screen).
const DAILY_POLLY_ENTRY_DX = -60;
const DAILY_POLLY_ENTRY_ABOVE_TOP = DAILY_POLLY_SIZE;
// Start tilt in flyTilt units (±1 = ±12°, the Hunt's sign convention):
// +1 is nose-down while she descends, easing to level on landing.
const DAILY_POLLY_ENTRY_TILT = 1;
// Out of play she is parked this far above her spot: off screen on any phone.
const DAILY_POLLY_PARKED_Y = -4000;

// Fly-out arc, copied from PollyHuntVisit's runExit (Hunt, 2026-10-08): up
// and to the right off the top edge, nose-up, shrinking. Kept in step by hand.
const FLY_OUT_MS = 500;
const EXIT_X_FRAC = 0.6;
const EXIT_Y_HEADROOM = 80;

// Every pose the perch can show gets one stacked layer that stays mounted for
// the life of the perch; only the current pose is visible (opacity 1, the rest
// 0). Swapping by mount/unmount made each switch create a fresh image view,
// which draws empty for a frame or two. To give a new pose a layer, add it to
// DAILY_PERCH_LAYER_POSES.
// Poses the face rig draws (idle) share the one rig layer instead of an image.
const PERCH_IMAGE_POSES = DAILY_PERCH_LAYER_POSES.filter(
  p => !(POLLY_PERCH_RIG_ENABLED && pollyScreenPoseUsesRig(p)),
);
// One Animated number node of the perch's layer graph.
type PerchNode = Animated.Value | Animated.AnimatedInterpolation<number>;

function getLine(
  reaction: Reaction | null,
  lossLineId: PollyLineId,
  correctLineId: PollyLineId | null,
): string {
  if (reaction === 'happy') return DAILY_FIRST_MISS_LINE;
  if (reaction === 'laughing') return POLLY_LINES[lossLineId];
  if (reaction === 'shocked') return DAILY_WIN_LINE;
  if (reaction === 'correct') return correctLineId ? POLLY_LINES[correctLineId] : '';
  return '';
}

function getLineId(
  reaction: Reaction | null,
  lossLineId: PollyLineId,
  correctLineId: PollyLineId | null,
): PollyLineId | null {
  if (reaction === 'happy') return 'dailyButterKnife';
  if (reaction === 'laughing') return lossLineId;
  if (reaction === 'shocked') return 'dailyWinTomorrow';
  if (reaction === 'correct') return correctLineId;
  return null;
}

export default function PollyDailyPerch({
  reaction,
  reactionKey = 0,
  onReactionComplete,
  rivalryState,
  show = true,
  perchAt,
  bubbleAt,
  throwDelayMs = 0,
  onExited,
  breachClocks,
  shake,
}: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const rememberLine = useGameStore(s => s.rememberPollyLine);
  // Both held stable for the life of this perch, same pattern as
  // ResultsScreen.tsx's pollyMemoryBeforeRunRecorded: a live pollyMemory
  // selector would re-derive recentLineIds (and this pick) right after
  // rememberLine fires below, flipping the bubble away from the line
  // actually remembered. useGameStore.getState() (not a selector — matches
  // usePollyVisits' own reasoning) reads once at mount.
  const [pollyMemoryBeforeRecorded] = useState(() => useGameStore.getState().pollyMemory);
  const [dailyLossRoll] = useState(() => Math.random());
  const dailyLossLineId = pickFreshLine(DAILY_LOSS_LINE_IDS, pollyMemoryBeforeRecorded.recentLineIds, dailyLossRoll);
  const [pose, setPose] = useState<PollyScreenPoseName>(POSE_FLY);
  const rigVisible = POLLY_PERCH_RIG_ENABLED && pollyScreenPoseUsesRig(pose);
  const enteredRef = useRef(false);

  // Unlike firstMiss/loss/win, 'correct' can fire several times per session
  // (every non-winning correct claim), so it needs a fresh roll each time
  // rather than the frozen mount-time pattern above — and its own record of
  // which lines already fired this session, so it doesn't repeat sooner than
  // the DAILY_MOOD_LINES pool for the current rivalry state runs out.
  const firedCorrectLineIdsRef = useRef<string[]>([]);

  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  // The bubble's words belong to the reaction that is showing it: set when
  // a reaction starts, from the line it picked, and cleared when that
  // reaction's bubble has faded. Never re-derived from the reaction prop.
  const [bubbleLine, setBubbleLine] = useState('');
  // Which reaction owns the bubble. Each reaction (and unmount) takes a new
  // token, so a fade that ends after it was replaced reports nothing.
  const reactionTokenRef = useRef(0);
  const onReactionCompleteRef = useRef(onReactionComplete);
  onReactionCompleteRef.current = onReactionComplete;

  // Whole-image drivers (no part seams possible — we only move the whole image).
  const { translateX: breatheX, translateY: breatheY, reduceMotion } =
    usePollyAmbientMotion('daily', show);
  const reactX = useRef(new Animated.Value(0)).current;
  const reactY = useRef(new Animated.Value(0)).current;
  const reactScale = useRef(new Animated.Value(1)).current;
  // The first-miss dance's own clock (ms from the reaction's start, 0 at rest)
  // and its live gate: 1 only while the dance plays, set to 0 BEFORE the clock
  // is stopped (ui/pollyDailyPerchLayers.ts, THE LIVE GATES).
  const danceClock = useRef(new Animated.Value(0)).current;
  const danceLive = useRef(new Animated.Value(0)).current;
  // Flight offsets for the arrival and the fly-out. At rest on the wall: 0, 0,
  // no tilt, full size. Out of play she is parked off screen above.
  const flyX = useRef(new Animated.Value(0)).current;
  const flyY = useRef(new Animated.Value(DAILY_POLLY_PARKED_Y)).current;
  // Read when she arrives; later layout changes never restart the arrival.
  const perchAtRef = useRef(perchAt);
  perchAtRef.current = perchAt;
  const perchKnown = perchAt !== undefined;
  const flyTilt = useRef(new Animated.Value(0)).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const exitingRef = useRef(false);
  // Set as the Daily's last reaction starts (win or loss): from then on she is
  // leaving, so the screen's later reset to 'perched' must not settle her.
  const leavingRef = useRef(false);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  function runFlyOut(exitPose: PollyScreenPoseName) {
    if (exitingRef.current) return;
    exitingRef.current = true;
    // The win's fly-off is angry: a random angry squawk as she leaves (plays
    // with Reduce Motion too; the loss exit flies off grinning, silent).
    if (exitPose === EXIT_POSE.shocked) playPollyReaction('angry');
    setPose(exitPose);
    const exitX = screenW * EXIT_X_FRAC;
    const exitY = -(screenH + EXIT_Y_HEADROOM);
    if (reduceMotion !== false) {
      // Reduce Motion: no flight, she is simply gone.
      flyX.setValue(exitX);
      flyY.setValue(exitY);
      onExitedRef.current?.();
      return;
    }
    Animated.parallel([
      Animated.timing(flyX, { toValue: exitX, duration: FLY_OUT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(flyY, { toValue: exitY, duration: FLY_OUT_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(flyTilt, { toValue: -1, duration: FLY_OUT_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(flyScale, { toValue: 0.86, duration: FLY_OUT_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => onExitedRef.current?.());
  }

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      reactionTokenRef.current += 1;
      danceLive.setValue(0);
      danceClock.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arrival: each time play starts (and her wall spot is known) she starts a
  // fresh session from the fly pose and flies down to the wall; she switches
  // to idle when the descent lands. Out of play she is parked off screen.
  useEffect(() => {
    if (reduceMotion === null) return;
    const spot = perchAtRef.current;
    if (!show || !spot) {
      // Out of play (entry card, Results) or not placed yet: park her unseen.
      flyX.stopAnimation();
      flyY.stopAnimation();
      flyTilt.stopAnimation();
      flyX.setValue(0);
      flyY.setValue(DAILY_POLLY_PARKED_Y);
      flyTilt.setValue(0);
      return;
    }

    // A fresh session: clear everything an earlier run (or its fly-out) left.
    exitingRef.current = false;
    leavingRef.current = false;
    enteredRef.current = false;
    flyScale.setValue(1);

    if (reduceMotion) {
      // Reduce Motion: no descent; she is simply at the wall, idle.
      flyX.setValue(0);
      flyY.setValue(0);
      flyTilt.setValue(0);
      enteredRef.current = true;
      setPose(POSE.idle);
      return;
    }

    setPose(POSE_FLY);
    const spotTop = spot.y + DAILY_POLLY_BASE_SIZE - DAILY_POLLY_SIZE;
    flyX.setValue(DAILY_POLLY_ENTRY_DX);
    flyY.setValue(-DAILY_POLLY_ENTRY_ABOVE_TOP - spotTop);
    flyTilt.setValue(DAILY_POLLY_ENTRY_TILT);
    const entry = Animated.parallel([
      Animated.timing(flyX, { toValue: 0, duration: DAILY_POLLY_ENTRY_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(flyY, { toValue: 0, duration: DAILY_POLLY_ENTRY_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(flyTilt, { toValue: 0, duration: DAILY_POLLY_ENTRY_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    entry.start(({ finished }) => {
      if (!finished) return;
      // Landed. A claim made mid-descent already chose her pose; keep it.
      enteredRef.current = true;
      setPose(p => (p === POSE_FLY ? POSE.idle : p));
    });
    // Play ending, a re-placement or unmount stops a descent mid-flight.
    return () => entry.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, reduceMotion, perchKnown]);

  useEffect(() => {
    const isReacting =
      reaction === 'happy' || reaction === 'laughing' || reaction === 'shocked' || reaction === 'correct';
    // Any new reaction (or the reset after one) ends a dance still playing:
    // she is back at rest, (0, 0), her own pose. The gate goes first: a dance
    // stopped mid-way reports its last value back to JS AFTER this reset, and
    // only the gate keeps that value from lighting a dance pose.
    danceLive.setValue(0);
    danceClock.stopAnimation();
    danceClock.setValue(0);

    if (!isReacting) {
      // The screen's reset can land around her fly-out; leave her be.
      if (leavingRef.current) return;
      if (enteredRef.current) setPose(POSE.idle);
      reactX.setValue(0);
      reactY.setValue(0);
      reactScale.setValue(1);
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    // This reaction owns the bubble from here; an older one still fading
    // (stopped just below) sees a stale token and reports nothing.
    reactionTokenRef.current += 1;
    const token = reactionTokenRef.current;
    const key = reactionKey;

    // 'correct' can fire several times a session, so its line is rolled
    // fresh here rather than at mount, and remembered locally so it doesn't
    // repeat within this session even though pollyMemoryBeforeRecorded is a
    // frozen snapshot.
    let pickedCorrectLineId: PollyLineId | null = null;
    if (reaction === 'correct') {
      const roll = Math.random();
      const recent = [
        ...pollyMemoryBeforeRecorded.recentLineIds,
        ...firedCorrectLineIdsRef.current,
      ];
      pickedCorrectLineId = pickFreshLine(DAILY_MOOD_LINES[rivalryState], recent, roll);
      firedCorrectLineIdsRef.current = [...firedCorrectLineIdsRef.current, pickedCorrectLineId];
    }

    if (EXIT_POSE[reaction]) leavingRef.current = true;
    setPose(reaction === 'correct' ? POSE.idle : POSE[reaction]);
    const lineId = getLineId(reaction, dailyLossLineId, pickedCorrectLineId);
    if (lineId && show) rememberLine(lineId, 'daily');
    // Explicit allow-list: any new reaction stays quiet unless it is added
    // here. The two misses squawk / laugh. The win lands startled (a random
    // startled sound as the shocked pose is set) and flies off angry (see
    // runFlyOut). Right answers (correct) stay silent.
    if (reaction === 'happy') playSfx('pollySqwawkShort');
    else if (reaction === 'laughing') playSfx('pollySqwawkLaugh');
    else if (reaction === 'shocked') playPollyReaction('startled');

    reactX.setValue(0);
    reactY.setValue(0);
    reactScale.setValue(1);

    if (reduceMotion) {
      reactX.setValue(0);
      reactY.setValue(0);
      reactScale.setValue(1);
    } else if (reaction === 'laughing') {
      // Sharp bark: quick pop + hard shake.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.08, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactX, { toValue: 9, duration: 55, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: -9, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    } else if (reaction === 'happy') {
      // The first lost life is a dance (ui/pollyDailyDance.ts), on its own
      // clock from the squawk: it owns her pose and shows the butter-knife
      // bubble while she hovers, and lands on the laugh pose set above.
      danceLive.setValue(1);
      Animated.timing(danceClock, {
        toValue: POLLY_DANCE_MS,
        duration: POLLY_DANCE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    } else if (reaction === 'shocked') {
      // Shocked: fast recoil pop.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 320, delay: 60, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactY, { toValue: -10, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactY, { toValue: 0, duration: 400, delay: 80, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
    // 'correct' fires every non-winning round, so it deliberately gets no
    // extra body motion (unlike the three original reactions) — just the
    // pose hold + speech bubble, so a repeatable beat doesn't wear out.

    // A thrown claim's line waits until the plaque has cleared the steps.
    const bubbleDelay = reaction === 'correct' || reaction === 'shocked' ? throwDelayMs : 0;
    bubbleOpacity.stopAnimation();
    bubbleOpacity.setValue(0);
    setBubbleLine(getLine(reaction, dailyLossLineId, pickedCorrectLineId));
    // The dance shows its bubble itself (in at 850 ms, out from 1650 ms, on its
    // clock); every other reaction, and the dance under Reduce Motion, fades
    // it in here as before.
    if (!(reaction === 'happy' && !reduceMotion)) {
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 180,
        delay: bubbleDelay,
        useNativeDriver: true,
      }).start();
    }

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        // The win and the loss end the Daily: she flies out instead of
        // settling back to idle.
        const exitPose = reaction ? EXIT_POSE[reaction] : undefined;
        if (exitPose) runFlyOut(exitPose);
        else setPose(POSE.idle);
        // Only the reaction still owning the bubble hands it back.
        if (reactionTokenRef.current !== token) return;
        setBubbleLine('');
        onReactionCompleteRef.current?.(key);
      });
    }, 2500 + bubbleDelay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction, reactionKey]);

  const flyRotate = flyTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  // The breach's tier moves, read off the screen's breach clocks (resting ones
  // when none are passed, so every node keeps one shape), and the dance off its
  // own clock. Built once: nothing here waits for a render, so she moves with
  // the plaque and the castle. Which layer shows is composed by
  // ui/pollyDailyPerchLayers.ts, the same composition the tests sample.
  const restingHitClock = useRef(new Animated.Value(0)).current;
  const restingSmashClock = useRef(new Animated.Value(0)).current;
  const restingLive = useRef(new Animated.Value(0)).current;
  const hitClock = breachClocks?.hit ?? restingHitClock;
  const smashClock = breachClocks?.smash ?? restingSmashClock;
  const hitLive = breachClocks?.hitLive ?? restingLive;
  const smashLive = breachClocks?.smashLive ?? restingLive;

  // Her own pose as one stable value per layer (and the rig), switched when the
  // pose changes; a move shows over it by its own opacity.
  const ownOpacity = useRef(
    Object.fromEntries(PERCH_IMAGE_POSES.map((p) => [p, new Animated.Value(p === POSE_FLY ? 1 : 0)])) as Record<PollyScreenPoseName, Animated.Value>,
  ).current;
  const rigOwnOpacity = useRef(new Animated.Value(0)).current;
  useLayoutEffect(() => {
    const own = dailyPerchOwnOpacity(pose, rigVisible, PERCH_IMAGE_POSES);
    rigOwnOpacity.setValue(own.rig);
    for (const p of PERCH_IMAGE_POSES) ownOpacity[p].setValue(own.images[p]);
  }, [ownOpacity, pose, rigOwnOpacity, rigVisible]);

  const perch = useMemo(() => {
    const clocks: Record<DailyPerchMove, { clock: Animated.Value; live: Animated.Value }> = {
      hit: { clock: hitClock, live: hitLive },
      smash: { clock: smashClock, live: smashLive },
      dance: { clock: danceClock, live: danceLive },
    };
    const layers = composeDailyPerch<PerchNode>(
      {
        // A move's keyframes on its clock, times its live gate.
        read: (move, keys) => Animated.multiply(
          clocks[move].clock.interpolate({ ...keys, extrapolate: 'clamp' }),
          clocks[move].live,
        ),
        add: (a, b) => Animated.add(a, b),
        multiply: (a, b) => Animated.multiply(a, b),
        release: (owned) => owned.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' }),
      },
      PERCH_IMAGE_POSES,
      { rig: rigOwnOpacity, image: (p) => ownOpacity[p] },
    );
    return {
      ...layers,
      rotate: layers.rotateDeg.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }),
    };
  }, [danceClock, danceLive, hitClock, hitLive, ownOpacity, rigOwnOpacity, smashClock, smashLive]);
  const bubbleShown = useMemo(
    () => Animated.add(bubbleOpacity, perch.danceBubble),
    [perch, bubbleOpacity],
  );

  // The castle shake moves her whole layer with the castle (her root keeps its
  // zIndex, so this changes nothing about what she sits above or below).
  const restingShake = useRef(new Animated.Value(0)).current;
  const shakeX = shake?.translateX ?? restingShake;
  const shakeY = shake?.translateY ?? restingShake;

  return (
    <Animated.View style={[styles.root, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]}>
      {/* Speech bubble — to Polly's right, tail points left at her */}
      <Animated.View
        style={[
          styles.bubbleWrap,
          bubbleAt && {
            // bubbleAt is a window point; the root covers the screen from its top.
            left: bubbleAt.x,
            top: bubbleAt.y,
          },
          { opacity: bubbleShown },
        ]}
      >
        <PollySpeechBubble
          line={bubbleLine}
          maxWidth={
            bubbleAt
              // Never past the screen's right edge, less the margin.
              ? Math.min(bubbleAt.maxWidth, screenW - bubbleAt.x - DAILY_POLLY_BUBBLE.screenMargin)
              : 185
          }
          tail="left"
        />
      </Animated.View>

      {/* Polly — clean full pose, whole-image motion, low-left at the wall,
          facing right. Hidden until the screen knows her wall spot. */}
      <Animated.View
        style={[
          styles.pollyWrap,
          perchAt
            // Bottom-left stays on the 150 pt box's corner; extra size goes up.
            ? { left: perchAt.x, top: perchAt.y + DAILY_POLLY_BASE_SIZE - DAILY_POLLY_SIZE }
            : styles.pollyWrapUnplaced,
          {
            transform: [
              { translateX: flyX },
              { translateY: flyY },
              { rotate: flyRotate },
              { scale: flyScale },
              { translateX: perch.x },
              { translateY: perch.y },
              { rotate: perch.rotate },
              { translateX: reactX },
              { translateX: breatheX },
              { translateY: breatheY },
              { translateY: reactY },
              { scale: reactScale },
            ],
          },
        ]}
      >
        {/* All layers stay mounted; the current pose is the only one at
            opacity 1. Same DAILY_POLLY_SIZE box for the rig and the flat
            poses. A hidden rig gets reduceMotion so its blink timer rests. */}
        {POLLY_PERCH_RIG_ENABLED && (
          <Animated.View style={[styles.poseLayer, { opacity: perch.rig }]}>
            <PollyPerchRig size={DAILY_POLLY_SIZE} reduceMotion={rigVisible ? reduceMotion : true} />
          </Animated.View>
        )}
        {PERCH_IMAGE_POSES.map(layerPose => {
          const art = pollyScreenPoseArt(layerPose);
          return (
            <Animated.Image
              key={layerPose}
              source={art.source}
              style={[
                styles.pollyImage,
                styles.poseLayer,
                { opacity: perch.images[layerPose], transform: [{ scale: art.scale }] },
              ]}
              resizeMode="contain"
            />
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Covers the whole screen so her wall spot and the bubble can be placed by
  // window points; touches pass straight through.
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 90,
    elevation: 90,
  },
  pollyWrap: {
    position: 'absolute',
    width: DAILY_POLLY_SIZE,
    height: DAILY_POLLY_SIZE,
  },
  pollyWrapUnplaced: {
    left: 0,
    top: 0,
    opacity: 0,
  },
  pollyImage: {
    width: DAILY_POLLY_SIZE,
    height: DAILY_POLLY_SIZE,
  },
  // Every pose layer sits at the box's top-left, where the single image and
  // the rig used to sit, so stacking them moves nothing.
  poseLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    pointerEvents: 'none',
  },
  bubbleWrap: {
    position: 'absolute',
    left: 100,
    top: 90,
  },
});
