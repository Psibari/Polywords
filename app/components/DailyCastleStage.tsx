import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Polyline, RadialGradient, Rect, Stop } from 'react-native-svg';
import DailyGate from './DailyGate';
import DailyFloorCoins, { type DailyCoinRise } from './DailyFloorCoins';
import DailyRoundMarkers from './DailyRoundMarkers';
import {
  DailyCastlePlaqueFace,
  dailyCastlePlaqueStyle,
  type DailyAnswerCardClaimOrigin,
  type DailyAnswerCardProps,
} from './DailyAnswerCard';
import {
  useReducedFlashesPreference,
  useReducedMotionPreference,
} from '../hooks/usePollyAmbientMotion';
import { dailyStoneSeatSfx, playSfx } from '../audio/sfx';
import { Haptics } from '../utils/haptics';
import { resolveGameplayFeedbackAccessibility } from '../game/gameplayFeedbackAccessibility';
import {
  DAILY_BREACH_DUST,
  DAILY_BREACH_LIGHTNING,
  DAILY_BREACH_PLAQUE_PRESS,
  DAILY_BREACH_SHAKE,
  dailyBreachBoltKeyframes,
  dailyBreachBolts,
  dailyBreachDust,
  dailyBreachDustKeyframes,
  dailyBreachEffectsMs,
  dailyBreachFlashes,
  dailyBreachFlashKeyframes,
  dailyBreachShakeKeyframes,
  dailyBreachSplinterKeyframes,
  dailyBreachSplinters,
  dailyFlightLayerOpacity,
  type DailyBreachShakeProfile,
  type DailyBreachTier,
} from '../ui/dailyBreach';
import {
  DAILY_PLAQUE_ENTRANCE,
  DAILY_PLAQUE_INITIAL_PROGRESS,
  DAILY_PLAQUE_MOTION_FAILSAFE_MS,
  DAILY_PLAQUE_PEAK,
  DAILY_STONE_SEAT_RATES,
  DAILY_WALL_TREMBLE_X,
  DAILY_WALL_TREMBLE_Y,
  dailyPlaqueEntranceCues,
  dailyPlaqueEntranceDelay,
  dailyPlaqueEntranceMode,
  dailyWallTrembleMs,
} from '../ui/dailyPlaqueEntrance';
import {
  DAILY_CASTLE_FLIGHT,
  DAILY_CASTLE_CAP_GLOWS,
  DAILY_CASTLE_FLIGHT_HANDOFF,
  DAILY_CASTLE_CANVAS,
  DAILY_CASTLE_GRID,
  DAILY_GOLD_HALO,
  DAILY_GOLD_HIT_COLOR,
  DAILY_GOLD_HIT_INPUT,
  DAILY_GOLD_HIT_WHITE,
  dailyBreachHoleCanvas,
  dailyGoldHitTierKeyframes,
  dailyGoldHitTimingForTier,
  DAILY_ANSWER_WALL_FOOT,
  DAILY_CASTLE_OPENING,
  dailyGateClosed,
  dailyGateMaxSink,
  dailyGateOpenTravel,
  resolveDailyCastleFrame,
  resolveDailyClueTop,
  resolveDailyCastleSlot,
  resolveDailyGateClueRects,
  resolveDailyRoundMarkers,
  toDailyCastleScreen,
  type DailyCastleFrame,
  type DailyCastleGrid,
} from '../ui/dailyCastleScene';

// The cartoon castle (towers, arch, steps, floor; tools/art/build_daily_castle.py)
// and the answer wall share one
// 1290 × 2796 canvas and are always drawn at the same rect.
const CASTLE_ARCH = require('../../assets/images/dailycastle/castle_cartoon.png');
// The castle's white trim (tower caps, rope hooks, step edges) in gold, clear
// everywhere else, on the same canvas; it lights up on every correct answer
// (Pete, 2026-09-27). Built with the castle by the same script.
const CASTLE_GOLD_FLASH = require('../../assets/images/dailycastle/castle_cartoon_gold_flash.png');
// The gold coin's soft radial glow (build_daily_coins.py), reused as the bloom
// that swells behind each tower cap in the gold hit.
const CAP_GLOW = require('../../assets/images/dailycastle/coin_glow.png');
// The answer wall, built by tools/art/build_daily_answer_wall.py: Pete's
// cartoon wall (slate frame), each panel black mortar with three block
// recesses. The answer blocks sit flush over the recesses.
const CASTLE_WALL = require('../../assets/images/dailycastle/answerwall_framed.png');
// What shows behind the raised gate: a cartoon stone tunnel receding to a lit
// far opening, drawn by tools/art/build_daily_tunnel.py. The thrown block flies
// down it. It replaced the old feather wall.
const BACK_TUNNEL = require('../../assets/images/dailycastle/tunnel.png');
// A block with no word: the wall looks whole on entry and Results (Pete,
// 2026-09-27, option b), when there are no answer blocks in play.
const BLANK_BLOCK = require('../../assets/images/dailycastle/answerplaque_stone.png');
const useDailyCastleTuning = __DEV__
  ? require('../dev/dailyCastleTuning').useDailyCastleTuning
  : null;

type Tuning = {
  gate: { x: number; y: number };
  grid: Omit<DailyCastleGrid, 'top'> & { x: number; y: number };
  clues: { x: number; y: number; width: number };
};

const DEFAULTS: Tuning = {
  gate: { x: 0, y: 0 },
  grid: {
    x: 0,
    y: 0,
    cardWidth: DAILY_CASTLE_GRID.cardWidth,
    cardHeight: DAILY_CASTLE_GRID.cardHeight,
    columnGap: DAILY_CASTLE_GRID.columnGap,
    rowGap: DAILY_CASTLE_GRID.rowGap,
  },
  clues: { x: 0, y: 0, width: 0 },
};

/** The castle shake, as translate values for a transform array. */
export type DailyCastleShakeTransform = {
  translateX: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
};

export type DailyCastleFlight = {
  label: string;
  /** Window rect of the plaque at the moment it was released. */
  origin: DailyAnswerCardClaimOrigin;
  /**
   * The breach's 'hit': the gate is SHUT at the handoff and still covers it as
   * it starts to rise, so the plaque never goes onto the back copy (under the
   * gate). The front copy holds over the shut gate and fades into the tunnel as
   * the gate slides up behind it (dailyFlightLayerOpacity). Default: today's
   * switch to the back copy just before the handoff.
   */
  stayInFront?: boolean;
};

type Props = {
  gatePosition: Animated.Value;
  clues: string[];
  revealedCount: 1 | 2 | 3;
  solvedCount: number;
  roundKey: number;
  /** The correct plaque being thrown into the gate, if any. */
  flight: DailyCastleFlight | null;
  /** 0 → 1 over the whole throw; DAILY_CASTLE_FLIGHT_HANDOFF is the handoff. */
  flightProgress: Animated.Value;
  /** Starts the newest floor coin's rise (and, on the win, the gold one's). */
  coinRise: DailyCoinRise;
  /**
   * The castle's gold hit: bumping `token` plays it once, graded by `tier`
   * (DAILY_GOLD_HIT_TIERS). token 0 = never.
   */
  goldHit: { token: number; tier: DailyBreachTier };
  /** The breach's castle shake: bumping `token` plays `profile` once. Absent or token 0 = never. */
  shake?: { token: number; profile: DailyBreachShakeProfile };
  /**
   * The breach's flashes, lightning, splinters and dust for `tier` ('open' has
   * none): bumping `token` plays them once, from the plaque's contact. Absent or
   * token 0 = never.
   */
  breachEffects?: { token: number; tier: DailyBreachTier };
  /**
   * Receives the castle shake's translate values (resting at exactly 0) so the
   * screen can shake Polly's overlay with the castle. Called again only if they change.
   */
  onShakeTransform?: (shake: DailyCastleShakeTransform) => void;
  /** Passed to DailyGate: the broken gate (the breach's 'smash'); it hides clues two and three. */
  gateBroken?: boolean;
  /**
   * Passed to DailyGate: the broken art's opacity 0..1, driven natively from
   * the flight's progress (dailyGateBreakKeyframes) so the hole opens in the
   * frame the plaque goes behind the gate.
   */
  gateBrokenArt?: Animated.AnimatedNode;
  /** Passed to DailyGate: its side-to-side shudder, screen points (the screen drives it). */
  gateJitterX?: Animated.AnimatedInterpolation<number>;
  /** Passed to DailyGate: the cracks on the shut door, opacity 0..1. */
  gateCracks?: Animated.Value;
  /**
   * The thrown plaque pressing into the shut gate ('hit'): 0 at rest, 1 fully
   * pressed (DAILY_BREACH_PLAQUE_PRESS). Rests at 0.
   */
  flightPress?: Animated.Value;
  /** The win's gold-coin finale (ui/dailyCoinFinale.ts steps 0–5). */
  coinFinale: Animated.Value;
  /** Window y of the HUD's bottom edge; the first clue stays below it. */
  hudBottom: number;
  /** Round progress on the wall's frieze, during play only. */
  roundMarkers?: { current: number; total: number } | null;
  /** Reports where the scene is drawn, for things placed on it from outside (Polly's bubble). */
  onFrame?: (frame: DailyCastleFrame) => void;
  children: React.ReactNode;
};

type PlaqueSlotProps = {
  child: React.ReactNode;
  index: number;
  reduceMotion: boolean | null;
  roundKey: number;
  /** Starts the wall's tremble; the block carrying the grind calls it. */
  onWallTremble: () => void;
};

/** A row of blocks seats in the wall: its thud and its tap, together. */
function seatDailyPlaqueRow(row: number) {
  playSfx(dailyStoneSeatSfx(row), {
    rate: DAILY_STONE_SEAT_RATES[row % DAILY_STONE_SEAT_RATES.length],
  });
  Haptics.cueAsync('dailyStoneSeat');
}

// A new round's block comes out of the wall (ui/dailyPlaqueEntrance.ts):
// hidden, small and deep → zooms forward past flush → settles flush. One
// progress value per slot drives the block's opacity, scale, drop, top face
// and wall shadow in DailyAnswerCard. The slots go in reading order.
function DailyCastlePlaqueSlot({
  child,
  index,
  reduceMotion,
  roundKey,
  onWallTremble,
}: PlaqueSlotProps) {
  const answerCard = React.isValidElement<DailyAnswerCardProps>(child)
    ? child
    : null;
  // Hidden from the very first frame: the slot remounts every round
  // (keyed by roundKey), so no round ever paints a finished block first.
  const plaqueProgress = useRef(new Animated.Value(DAILY_PLAQUE_INITIAL_PROGRESS)).current;
  // Once the failsafe has shown this round's blocks in place they stay that
  // way, even if the preference resolves to motion afterwards.
  const failsafeFiredRef = useRef(false);
  const seatedStillRef = useRef(false);

  useEffect(() => {
    plaqueProgress.stopAnimation();

    // Blocks simply in the wall. The set gets one thud and one tap so a new
    // round is still felt; only once per round.
    const showStill = () => {
      plaqueProgress.setValue(1);
      if (seatedStillRef.current) return;
      seatedStillRef.current = true;
      const { seatRow } = dailyPlaqueEntranceCues(index, false);
      if (seatRow !== null) seatDailyPlaqueRow(seatRow);
    };

    const mode = failsafeFiredRef.current
      ? 'still'
      : dailyPlaqueEntranceMode(reduceMotion, false);
    // Unknown yet (the preference is still loading): keep the blocks hidden.
    // The effect runs again once it is known; if it is still unknown after
    // the failsafe, behave as reduced motion.
    if (mode === 'waiting') {
      plaqueProgress.setValue(DAILY_PLAQUE_INITIAL_PROGRESS);
      const failsafeTimer = setTimeout(() => {
        failsafeFiredRef.current = true;
        showStill();
      }, DAILY_PLAQUE_MOTION_FAILSAFE_MS);
      return () => clearTimeout(failsafeTimer);
    }
    if (mode === 'still') {
      showStill();
      return;
    }

    const cues = dailyPlaqueEntranceCues(index, true);
    plaqueProgress.setValue(DAILY_PLAQUE_INITIAL_PROGRESS);
    const releaseTimer = setTimeout(() => {
      // The grind and the wall's tremble start together, with the first block.
      if (cues.shift) {
        playSfx('dailyStoneShift');
        onWallTremble();
      }
      Animated.timing(plaqueProgress, {
        toValue: DAILY_PLAQUE_PEAK,
        duration: DAILY_PLAQUE_ENTRANCE.punchMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Stopped: the round moved on or the slot unmounted mid-punch.
        if (!finished) return;
        // The thud lands on the frame the block hits its farthest point.
        if (cues.seatRow !== null) seatDailyPlaqueRow(cues.seatRow);
        // Eased in as well as out: the block holds out of the wall a beat,
        // so its top face reads as depth rather than a flicker of art, then
        // slides home and stops flush.
        Animated.timing(plaqueProgress, {
          toValue: 1,
          duration: DAILY_PLAQUE_ENTRANCE.settleMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    }, dailyPlaqueEntranceDelay(index));

    return () => {
      clearTimeout(releaseTimer);
      plaqueProgress.stopAnimation();
    };
  }, [index, onWallTremble, plaqueProgress, reduceMotion, roundKey]);

  if (!answerCard) return <>{child}</>;

  // The wall's dark panel shows where the block is hidden; the block's own
  // opacity, scale, drop, top face and shadow (DailyAnswerCard) bring it out.
  return React.cloneElement(answerCard, { recessProgress: plaqueProgress });
}

/**
 * One registered castle scene. The arch and wall never move; the gate, the
 * gold hit, the floor coins and the answer plaques do.
 *
 * Layer order, back to front: sky (screen) → gold halo → tunnel → plaque
 * going in (back flight) → gate → arch → gold hit (cap blooms, trim, tint,
 * white wash) → floor coins → wall → round markers → plaques in the wall →
 * breach lightning → breach dust → breach splinters → plaque being thrown
 * (front flight) → breach white flash. The wall, its sill strip, the round
 * markers and the plaques in the wall are one group that trembles while a
 * round's blocks come out. Everything but the white flash sits in one world
 * that the breach's castle shake moves.
 */
export default function DailyCastleStage({
  gatePosition,
  clues,
  revealedCount,
  solvedCount,
  roundKey,
  flight,
  flightProgress,
  coinRise,
  goldHit: goldHitRequest,
  shake,
  breachEffects,
  onShakeTransform,
  gateBroken = false,
  gateBrokenArt,
  gateJitterX,
  gateCracks,
  flightPress,
  coinFinale,
  hudBottom,
  roundMarkers,
  onFrame,
  children,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotionPreference();
  // True under Reduce Motion (or while it is unknown) as well as Reduce
  // Flashes: the gold hit keeps its gold, loses its overshoot and swell.
  const calmGoldHit = useReducedFlashesPreference();
  // The breach effects follow the shared policy: the shake, splinters and dust
  // need motion; the lightning and the screen flash need flashes too.
  const { animateMotion, animateFlashes } = resolveGameplayFeedbackAccessibility(
    reduceMotion,
    calmGoldHit,
  );
  // The plaque's press into a shut gate; a resting 0 when the screen passes
  // none, so the flight's transform keeps one shape.
  const restingPlaquePress = useRef(new Animated.Value(0)).current;
  const plaquePress = flightPress ?? restingPlaquePress;
  const animateMotionRef = useRef(animateMotion);
  animateMotionRef.current = animateMotion;
  const animateFlashesRef = useRef(animateFlashes);
  animateFlashesRef.current = animateFlashes;

  // The breach's castle shake (ui/dailyBreach.ts): one 0 → 1 value over the
  // profile's length, the keyframes resting at exactly 0 at both ends. A
  // parent transform over the whole stage, separate from the wall's tremble.
  const breachShake = useRef(new Animated.Value(0)).current;
  const shakeProfile: DailyBreachShakeProfile = shake?.profile ?? 'hit';
  const shakeProfileRef = useRef(shakeProfile);
  shakeProfileRef.current = shakeProfile;
  const shakeTranslate = useMemo<DailyCastleShakeTransform>(() => {
    const keys = dailyBreachShakeKeyframes(shakeProfile);
    return {
      translateX: breachShake.interpolate({ ...keys.x, extrapolate: 'clamp' }),
      translateY: breachShake.interpolate({ ...keys.y, extrapolate: 'clamp' }),
    };
  }, [breachShake, shakeProfile]);
  const shakeTransform = useMemo(
    () => [{ translateX: shakeTranslate.translateX }, { translateY: shakeTranslate.translateY }],
    [shakeTranslate],
  );
  useEffect(() => {
    onShakeTransform?.(shakeTranslate);
  }, [onShakeTransform, shakeTranslate]);
  const shakeToken = shake?.token ?? 0;
  useEffect(() => {
    if (shakeToken === 0 || !animateMotionRef.current) return;
    breachShake.stopAnimation();
    breachShake.setValue(0);
    const run = Animated.timing(breachShake, {
      toValue: 1,
      duration: DAILY_BREACH_SHAKE[shakeProfileRef.current].ms,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start();
    return () => {
      // A new shake, leaving, or a cut-short shake never keeps an offset.
      run.stop();
      breachShake.setValue(0);
    };
  }, [breachShake, shakeToken]);

  // The breach's flashes, lightning, splinters and dust run on one clock in ms.
  // Their views mount only while a breach plays (`breachRun`) and come off when
  // the clock finishes; the clock starts after they mount.
  const breachClock = useRef(new Animated.Value(0)).current;
  const [breachRun, setBreachRun] = useState<{
    token: number;
    tier: 'hit' | 'smash';
    /** Reduce Flashes is off: the lightning and the screen flash play too. */
    flashes: boolean;
  } | null>(null);
  const breachTierRef = useRef<DailyBreachTier>(breachEffects?.tier ?? 'open');
  breachTierRef.current = breachEffects?.tier ?? 'open';
  const breachToken = breachEffects?.token ?? 0;
  useEffect(() => {
    const tier = breachTierRef.current;
    if (breachToken === 0 || tier === 'open' || !animateMotionRef.current) return;
    setBreachRun({ token: breachToken, tier, flashes: animateFlashesRef.current });
  }, [breachToken]);
  useEffect(() => {
    if (!breachRun) return;
    const total = dailyBreachEffectsMs(breachRun.tier);
    breachClock.stopAnimation();
    breachClock.setValue(0);
    const run = Animated.timing(breachClock, {
      toValue: total,
      duration: total,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start(({ finished }) => {
      if (!finished) return;
      setBreachRun((current) => (current?.token === breachRun.token ? null : current));
    });
    return () => {
      run.stop();
      breachClock.setValue(0);
    };
  }, [breachClock, breachRun]);
  // A new round, or leaving, ends any breach effect still on screen.
  useEffect(() => {
    breachShake.stopAnimation();
    breachShake.setValue(0);
    setBreachRun(null);
  }, [breachShake, roundKey]);

  // The answer wall trembles while a round's blocks come out
  // (ui/dailyPlaqueEntrance.ts): Daily-local, never the Hunt wall's channel.
  // Linear 0 → 1; the keyframes carry the shape and rest at exactly 0 at
  // both ends.
  const wallTremble = useRef(new Animated.Value(0)).current;
  const wallTrembleTransform = useMemo(() => [
    { translateX: wallTremble.interpolate(DAILY_WALL_TREMBLE_X) },
    { translateY: wallTremble.interpolate(DAILY_WALL_TREMBLE_Y) },
  ], [wallTremble]);
  const startWallTremble = useCallback(() => {
    wallTremble.stopAnimation();
    wallTremble.setValue(0);
    Animated.timing(wallTremble, {
      toValue: 1,
      duration: dailyWallTrembleMs(),
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [wallTremble]);
  // A new round, or leaving, never inherits an interrupted tremble's offset.
  useEffect(() => {
    wallTremble.stopAnimation();
    wallTremble.setValue(0);
  }, [roundKey, wallTremble]);
  const tuning: Tuning = __DEV__
    ? useDailyCastleTuning((s: Tuning) => s)
    : DEFAULTS;

  // Card origins arrive in window coordinates. The stage normally sits at the
  // window origin; measuring keeps the flight honest if it ever does not.
  const stageRef = useRef<View>(null);
  const [stageOffset, setStageOffset] = useState({ x: 0, y: 0 });
  const measureStage = useCallback(() => {
    stageRef.current?.measureInWindow((x, y) => {
      setStageOffset((prev) =>
        prev.x === x && prev.y === y ? prev : { x, y },
      );
    });
  }, []);

  const grid: DailyCastleGrid = {
    top: DAILY_CASTLE_GRID.top + tuning.grid.y,
    cardWidth: tuning.grid.cardWidth,
    cardHeight: tuning.grid.cardHeight,
    columnGap: tuning.grid.columnGap,
    rowGap: tuning.grid.rowGap,
  };
  const frame = resolveDailyCastleFrame({
    windowWidth,
    windowHeight,
    bottomInset: insets.bottom,
    hudBottom,
    grid,
  });
  const s = frame.scale;
  useEffect(() => {
    onFrame?.(frame);
    // The frame is rebuilt each render; report it only when it moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.scale, frame.top, frame.width, frame.height]);
  const sceneTop = frame.top - stageOffset.y;
  const sceneLeft = -stageOffset.x;
  const opening = toDailyCastleScreen(frame, DAILY_CASTLE_OPENING);
  opening.x += sceneLeft;
  opening.y -= stageOffset.y;

  // Where the clues sit on this phone: centred in the door unless the HUD
  // would cover them. The whole gate moves with them.
  const clueTop = resolveDailyClueTop(frame, hudBottom);
  const gateClosed = dailyGateClosed(clueTop);

  // The gold hit: the castle answers a correct claim the moment it is made
  // (ui/dailyCastleScene.ts DAILY_GOLD_HIT). It runs on its own progress, not
  // the throw's, so it plays under reduced motion and without a measured
  // throw origin too, and peaks well before the gate brings the next round.
  // Graded by the breach tier (DAILY_GOLD_HIT_TIERS); under calmGoldHit every
  // tier plays today's calm hit.
  const goldHit = useRef(new Animated.Value(0)).current;
  const calmGoldHitRef = useRef(calmGoldHit);
  calmGoldHitRef.current = calmGoldHit;
  const goldHitToken = goldHitRequest.token;
  const goldHitTier = goldHitRequest.tier;
  const goldHitTierRef = useRef(goldHitTier);
  goldHitTierRef.current = goldHitTier;
  useEffect(() => {
    if (goldHitToken === 0) return;
    const timing = dailyGoldHitTimingForTier(goldHitTierRef.current, calmGoldHitRef.current);
    goldHit.stopAnimation();
    goldHit.setValue(0);
    const hit = Animated.sequence([
      Animated.timing(goldHit, {
        toValue: 1,
        duration: timing.igniteMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(goldHit, {
        toValue: 2,
        duration: timing.holdMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(goldHit, {
        toValue: 3,
        duration: timing.decayMs,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    hit.start();
    return () => {
      // Never leave the trim lit if the hit is cut short.
      hit.stop();
      goldHit.setValue(0);
    };
  }, [goldHit, goldHitToken]);
  const goldHitStyles = useMemo(() => {
    const keyframes = dailyGoldHitTierKeyframes(goldHitTier, calmGoldHit);
    const read = (outputRange: number[]) => goldHit.interpolate({
      inputRange: DAILY_GOLD_HIT_INPUT,
      outputRange,
      extrapolate: 'clamp',
    });
    return {
      trim: read(keyframes.trim),
      tint: read(keyframes.tint),
      glow: read(keyframes.glow),
      glowScale: read(keyframes.glowScale),
      white: read(keyframes.white),
      halo: read(keyframes.halo),
    };
  }, [calmGoldHit, goldHit, goldHitTier]);

  // Gate and clue rects relative to the opening / gate image that hold them.
  const gateFrame = {
    x: (gateClosed.x - DAILY_CASTLE_OPENING.x + tuning.gate.x) * s,
    y: (gateClosed.y - DAILY_CASTLE_OPENING.y + tuning.gate.y) * s,
    width: gateClosed.width * s,
    height: gateClosed.height * s,
  };
  const clueRects = resolveDailyGateClueRects(clueTop).map((rect) => {
    const width = (tuning.clues.width || rect.width) * s;
    return {
      x: (rect.x - gateClosed.x + tuning.clues.x) * s + (rect.width * s - width) / 2,
      y: (rect.y - gateClosed.y + tuning.clues.y) * s,
      width,
      height: rect.height * s,
    };
  });

  // The breach's layers, built only while one plays. Canvas points → stage
  // points; the hole moves with the gate (clueTop and the DEV gate offset).
  const holeCanvas = dailyBreachHoleCanvas(clueTop);
  const holeX = holeCanvas.x + tuning.gate.x;
  const holeY = holeCanvas.y + tuning.gate.y;
  const breachLayers = useMemo(() => {
    if (!breachRun) return null;
    const read = (keys: { inputRange: number[]; outputRange: number[] }) =>
      breachClock.interpolate({ ...keys, extrapolate: 'clamp' });
    const toStage = (x: number, y: number) => ({ x: x * s + sceneLeft, y: sceneTop + y * s });

    const flashes = breachRun.flashes ? dailyBreachFlashes(breachRun.tier) : [];
    const flash = flashes.length > 0 ? read(dailyBreachFlashKeyframes(flashes)) : null;
    const bolts = breachRun.flashes && breachRun.tier === 'smash'
      ? dailyBreachBolts({ x: holeX, y: holeY }).map((bolt, index) => ({
          bolt,
          opacity: read(dailyBreachBoltKeyframes(index === 0 ? 0 : 1)),
        }))
      : [];

    const dustKeys = dailyBreachDustKeyframes();
    const dustCentre = breachRun.tier === 'hit' ? DAILY_BREACH_DUST.hit.at : { x: holeX, y: holeY };
    const dust = dailyBreachDust(breachRun.tier).map((puff) => {
      const centre = toStage(dustCentre.x + puff.dx, dustCentre.y + puff.dy);
      const size = puff.size * s;
      return { left: centre.x - size / 2, top: centre.y - size / 2, size };
    });

    const origin = toStage(holeX, holeY);
    const splinters = breachRun.tier === 'smash'
      ? dailyBreachSplinters().map((splinter) => {
          const keys = dailyBreachSplinterKeyframes(splinter);
          const width = splinter.width * s;
          const height = splinter.height * s;
          return {
            color: splinter.color,
            left: origin.x - width / 2,
            top: origin.y - height / 2,
            width,
            height,
            translateX: read({ inputRange: keys.inputRange, outputRange: keys.x.map((v) => v * s) }),
            translateY: read({ inputRange: keys.inputRange, outputRange: keys.y.map((v) => v * s) }),
            rotate: breachClock.interpolate({
              inputRange: keys.inputRange,
              outputRange: keys.rotateDeg.map((deg) => `${deg}deg`),
              extrapolate: 'clamp',
            }),
            opacity: read({ inputRange: keys.inputRange, outputRange: keys.opacity }),
          };
        })
      : [];

    return {
      flash,
      bolts,
      dust,
      dustRise: read({ inputRange: dustKeys.inputRange, outputRange: dustKeys.rise.map((v) => v * s) }),
      dustScale: read({ inputRange: dustKeys.inputRange, outputRange: dustKeys.scale }),
      dustOpacity: read({ inputRange: dustKeys.inputRange, outputRange: dustKeys.opacity }),
      splinters,
    };
  }, [breachClock, breachRun, holeX, holeY, s, sceneLeft, sceneTop]);

  return (
    <View
      ref={stageRef}
      onLayout={measureStage}
      pointerEvents="box-none"
      // Never flattened: the layers below carry zIndex 20–40 for their order
      // inside the castle. If this layout-only View were flattened away (native
      // does, web does not), those zIndexes would compete with the screen's
      // SafeAreaView and draw the castle over the HUD, Polly and Results.
      collapsable={false}
      style={styles.stage}
    >
      {/* The breach's castle shake moves everything the stage draws, as one
          world, except the full-stage flash below. Never flattened, for the
          same zIndex reason as the stage; box-none so the plaques still take
          touches. At rest its offset is exactly 0. */}
      <Animated.View
        pointerEvents="box-none"
        collapsable={false}
        style={[styles.shakeWorld, { transform: shakeTransform }]}
      >
      {/* The gold hit's halo: soft gold behind the castle top, under the arch
          and the opening, so it shows only in the sky. Rests at 0. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.layer, styles.goldHalo, {
          left: sceneLeft,
          top: sceneTop,
          width: DAILY_GOLD_HALO.width * s,
          height: DAILY_GOLD_HALO.height * s,
          opacity: goldHitStyles.halo,
        }]}
      >
        <Svg width={DAILY_GOLD_HALO.width * s} height={DAILY_GOLD_HALO.height * s}>
          <Defs>
            <RadialGradient
              id="dailyGoldHalo"
              cx={`${DAILY_GOLD_HALO.centre.x * 100}%`}
              cy={`${DAILY_GOLD_HALO.centre.y * 100}%`}
              fx={`${DAILY_GOLD_HALO.centre.x * 100}%`}
              fy={`${DAILY_GOLD_HALO.centre.y * 100}%`}
              rx="50%"
              ry="50%"
            >
              <Stop offset="0" stopColor={DAILY_GOLD_HALO.color} stopOpacity={DAILY_GOLD_HALO.peakOpacity} />
              <Stop offset={DAILY_GOLD_HALO.fadeOffset} stopColor={DAILY_GOLD_HALO.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#dailyGoldHalo)" />
        </Svg>
      </Animated.View>
      <Image
        source={CASTLE_ARCH}
        style={[styles.layer, styles.castleArch, {
          left: sceneLeft,
          top: sceneTop,
          width: frame.width,
          height: frame.height,
        }]}
        resizeMode="stretch"
      />
      {/* The gold hit, back to front: a bloom swelling behind each tower cap,
          the gold trim, then the trim again in flat crown gold to saturate
          it. Same zIndex, so document order stacks them; all rest at 0. */}
      {DAILY_CASTLE_CAP_GLOWS.map((rect, index) => {
        const glow = toDailyCastleScreen(frame, rect);
        return (
          <Animated.Image
            key={`cap-glow-${index}`}
            source={CAP_GLOW}
            resizeMode="stretch"
            // Explicit size: a bundled image otherwise takes the file's pixel size.
            style={[styles.layer, styles.castleGoldFlash, {
              left: glow.x + sceneLeft,
              top: glow.y - stageOffset.y,
              width: glow.width,
              height: glow.height,
              opacity: goldHitStyles.glow,
              transform: [{ scale: goldHitStyles.glowScale }],
            }]}
          />
        );
      })}
      <Animated.Image
        source={CASTLE_GOLD_FLASH}
        style={[styles.layer, styles.castleGoldFlash, {
          left: sceneLeft,
          top: sceneTop,
          width: frame.width,
          height: frame.height,
          opacity: goldHitStyles.trim,
        }]}
        resizeMode="stretch"
      />
      <Animated.Image
        source={CASTLE_GOLD_FLASH}
        // Runtime tint only; the art itself is untouched.
        tintColor={DAILY_GOLD_HIT_COLOR}
        style={[styles.layer, styles.castleGoldFlash, {
          left: sceneLeft,
          top: sceneTop,
          width: frame.width,
          height: frame.height,
          opacity: goldHitStyles.tint,
        }]}
        resizeMode="stretch"
      />
      {/* The white wash over the gold: the same art tinted DAILY_GOLD_HIT_WHITE.
          Its peak counts as a flash (DAILY_BREACH_FLASH_LIMIT). */}
      <Animated.Image
        source={CASTLE_GOLD_FLASH}
        tintColor={DAILY_GOLD_HIT_WHITE}
        style={[styles.layer, styles.castleGoldFlash, {
          left: sceneLeft,
          top: sceneTop,
          width: frame.width,
          height: frame.height,
          opacity: goldHitStyles.white,
        }]}
        resizeMode="stretch"
      />

      {/* Progress on the courtyard floor: a coin per solved round, gold on
          the win. Above the arch layer, below the answer wall. */}
      <DailyFloorCoins
        solvedCount={solvedCount}
        rise={coinRise}
        finale={coinFinale}
        finaleMode={reduceMotion === false ? 'full' : 'calm'}
        frame={frame}
        offsetX={-stageOffset.x}
        offsetY={-stageOffset.y}
      />

      <View pointerEvents="none" style={[styles.opening, {
        left: opening.x,
        top: opening.y,
        width: opening.width,
        height: opening.height,
      }]}>
        {/* Explicit size: with absoluteFill alone a bundled image takes its
            file's own pixel size (the old back wall was 737 x 1062) and only a blown-up corner of it
            showed in the opening. */}
        <Image
          source={BACK_TUNNEL}
          style={[styles.backWall, { width: opening.width, height: opening.height }]}
          resizeMode="stretch"
        />
        {flight && (
          <DailyCastleFlightPlaque
            flight={flight}
            progress={flightProgress}
            press={plaquePress}
            layer="back"
            frame={frame}
            // Back layer lives inside the opening: window → opening-local.
            offsetX={opening.x + stageOffset.x}
            offsetY={opening.y + stageOffset.y}
          />
        )}
        <View style={styles.gate}>
          <DailyGate
            gatePosition={gatePosition}
            clues={clues}
            revealedCount={revealedCount}
            frame={gateFrame}
            clueRects={clueRects}
            openTravel={dailyGateOpenTravel(clueTop) * s}
            maxSink={dailyGateMaxSink(clueTop) * s}
            scale={s}
            broken={gateBroken}
            brokenArt={gateBrokenArt}
            jitterX={gateJitterX}
            cracks={gateCracks}
          />
        </View>
      </View>

      {/* The wall group: the wall, its sill strip, the round markers and the
          plaques in it, one stacking group at the wall's zIndex so its
          members keep their order (35 → 38 → 40) and nothing else sits
          between them. It trembles while a round's blocks come out and rests
          at exactly zero otherwise. Never flattened, for the same reason as
          the stage. The thrown plaque stays outside, above it. */}
      <Animated.View
        pointerEvents="box-none"
        collapsable={false}
        style={[styles.wallGroup, { transform: wallTrembleTransform }]}
      >
        <Image
          source={CASTLE_WALL}
          style={[styles.layer, styles.castleWall, {
            left: sceneLeft,
            top: sceneTop,
            width: frame.width,
            height: frame.height,
          }]}
          resizeMode="stretch"
        />
        {sceneTop + frame.height < windowHeight - stageOffset.y && (
          // The scene rose to clear the action label; continue the sill to the
          // screen edge instead of showing sky under it.
          <View
            pointerEvents="none"
            style={[styles.layer, styles.castleWall, {
              left: 0,
              right: 0,
              top: sceneTop + frame.height,
              bottom: 0,
              backgroundColor: DAILY_ANSWER_WALL_FOOT,
            }]}
          />
        )}

        {/* Round progress on the frieze: over the wall art, under the blocks, so a
            popped block's top face stays in front of it. */}
        {roundMarkers && (() => {
          const plate = toDailyCastleScreen(frame, resolveDailyRoundMarkers(roundMarkers.total));
          return (
            <View
              pointerEvents="none"
              style={[styles.layer, styles.roundMarkers, {
                left: plate.x + sceneLeft,
                top: plate.y - stageOffset.y,
                width: plate.width,
                height: plate.height,
              }]}
            >
              <DailyRoundMarkers
                currentRound={roundMarkers.current}
                total={roundMarkers.total}
                scale={s}
              />
            </View>
          );
        })()}

        {/* toArray, not count: count includes the `false` a finished game passes. */}
        {React.Children.toArray(children).length === 0 &&
          Array.from({ length: 6 }, (_, index) => {
            const slot = toDailyCastleScreen(frame, resolveDailyCastleSlot(grid, index));
            return (
              <Image
                key={`blank-${index}`}
                source={BLANK_BLOCK}
                resizeMode="stretch"
                style={[styles.cardSlot, {
                  left: slot.x + sceneLeft + tuning.grid.x * s,
                  top: slot.y - stageOffset.y,
                  width: slot.width,
                  height: slot.height,
                }]}
              />
            );
          })}

        {React.Children.toArray(children).map((child, index) => {
          if (index >= 6) return null;
          const slot = toDailyCastleScreen(frame, resolveDailyCastleSlot(grid, index));
          return (
            <View
              key={`slot-${roundKey}-${index}`}
              pointerEvents="box-none"
              style={[
                styles.cardSlot,
                {
                  left: slot.x + sceneLeft + tuning.grid.x * s,
                  top: slot.y - stageOffset.y,
                  width: slot.width,
                  height: slot.height,
                },
              ]}
            >
              <DailyCastlePlaqueSlot
                  child={React.isValidElement<DailyAnswerCardProps>(child)
                    ? React.cloneElement(child, { castleWidth: slot.width, castleHeight: slot.height })
                    : child}
                  index={index}
                  reduceMotion={reduceMotion}
                  roundKey={roundKey}
                  onWallTremble={startWallTremble}
              />
            </View>
          );
        })}
      </Animated.View>

      {/* The breach's lightning (smash, flashes allowed): above the castle and
          the wall, below the thrown plaque. Canvas-point viewBox, so the bolts
          scale with the scene. */}
      {breachLayers?.bolts.map(({ bolt, opacity }, index) => (
        <Animated.View
          key={`breach-bolt-${index}`}
          pointerEvents="none"
          style={[styles.layer, styles.breachBolt, {
            left: sceneLeft,
            top: sceneTop,
            width: frame.width,
            height: frame.height,
            opacity,
          }]}
        >
          <Svg
            width={frame.width}
            height={frame.height}
            viewBox={`0 0 ${DAILY_CASTLE_CANVAS.width} ${DAILY_CASTLE_CANVAS.height}`}
          >
            {(['hole', 'left', 'right'] as const).map((branch) => {
              const points = bolt[branch].map((p) => `${p.x},${p.y}`).join(' ');
              return (
                <React.Fragment key={branch}>
                  <Polyline
                    points={points}
                    fill="none"
                    stroke={DAILY_BREACH_LIGHTNING.glow.color}
                    strokeWidth={DAILY_BREACH_LIGHTNING.glow.width}
                    strokeOpacity={DAILY_BREACH_LIGHTNING.glow.opacity}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <Polyline
                    points={points}
                    fill="none"
                    stroke={DAILY_BREACH_LIGHTNING.core.color}
                    strokeWidth={DAILY_BREACH_LIGHTNING.core.width}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </Animated.View>
      ))}

      {/* Dust puffs (hit at the handoff, smash at the hole) and splinters
          (smash), mounted only while the breach plays. */}
      {breachLayers?.dust.map((puff, index) => (
        <Animated.View
          key={`breach-dust-${index}`}
          pointerEvents="none"
          style={[styles.layer, styles.breachDust, {
            left: puff.left,
            top: puff.top,
            width: puff.size,
            height: puff.size,
            opacity: breachLayers.dustOpacity,
            transform: [{ translateY: breachLayers.dustRise }, { scale: breachLayers.dustScale }],
          }]}
        >
          <Svg width={puff.size} height={puff.size} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient
                id={`dailyBreachDust${index}`}
                cx="50"
                cy="50"
                r="50"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={DAILY_BREACH_DUST.color} stopOpacity={DAILY_BREACH_DUST.peakOpacity} />
                <Stop offset={DAILY_BREACH_DUST.fadeOffset} stopColor={DAILY_BREACH_DUST.color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill={`url(#dailyBreachDust${index})`} />
          </Svg>
        </Animated.View>
      ))}
      {breachLayers?.splinters.map((splinter, index) => (
        <Animated.View
          key={`breach-splinter-${index}`}
          pointerEvents="none"
          style={[styles.layer, styles.breachSplinter, {
            left: splinter.left,
            top: splinter.top,
            width: splinter.width,
            height: splinter.height,
            borderRadius: splinter.width / 3,
            backgroundColor: splinter.color,
            opacity: splinter.opacity,
            transform: [
              { translateX: splinter.translateX },
              { translateY: splinter.translateY },
              { rotate: splinter.rotate },
            ],
          }]}
        />
      ))}

      {flight && (
        <DailyCastleFlightPlaque
          flight={flight}
          progress={flightProgress}
          press={plaquePress}
          layer="front"
          frame={frame}
          offsetX={stageOffset.x}
          offsetY={stageOffset.y}
        />
      )}
      </Animated.View>

      {/* The one shared full-stage white flash: the hit's flash and the
          lightning's. Outside the shake so its edges never show. Mounted only
          while a breach with flashes plays. */}
      {breachLayers?.flash && (
        <Animated.View
          pointerEvents="none"
          style={[styles.breachFlash, { opacity: breachLayers.flash }]}
        />
      )}
    </View>
  );
}

/**
 * The thrown plaque. Two copies ride one progress value: the FRONT copy is
 * drawn over the whole castle until the plaque is wholly inside the opening,
 * then the BACK copy — inside the opening, under the gate — takes over at the
 * identical position and carries it away into the wall. The gate is already
 * raised by the handoff, so nothing covers either copy at the swap.
 */
function DailyCastleFlightPlaque({
  flight,
  progress,
  press,
  layer,
  frame,
  offsetX,
  offsetY,
}: {
  flight: DailyCastleFlight;
  progress: Animated.Value;
  /** 0 → 1: the press into a shut gate ('hit'); 0 at rest. */
  press: Animated.Value;
  layer: 'front' | 'back';
  frame: ReturnType<typeof resolveDailyCastleFrame>;
  /** Window position of this copy's parent. */
  offsetX: number;
  offsetY: number;
}) {
  const { origin } = flight;
  const H = DAILY_CASTLE_FLIGHT_HANDOFF;
  const handoff = {
    x: DAILY_CASTLE_FLIGHT.handoff.x * frame.scale,
    y: frame.top + DAILY_CASTLE_FLIGHT.handoff.y * frame.scale,
  };
  const end = {
    x: DAILY_CASTLE_FLIGHT.end.x * frame.scale,
    y: frame.top + DAILY_CASTLE_FLIGHT.end.y * frame.scale,
  };
  const startX = origin.x + origin.width / 2;
  const startY = origin.y + origin.height / 2;

  const translateX = progress.interpolate({
    inputRange: [0, H, 1],
    outputRange: [0, handoff.x - startX, end.x - startX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, H, 1],
    outputRange: [0, handoff.y - startY, end.y - startY],
  });
  const scale = progress.interpolate({
    inputRange: [0, H, 1],
    outputRange: [1, DAILY_CASTLE_FLIGHT.handoffScale, DAILY_CASTLE_FLIGHT.endScale],
  });
  // Which copy shows (ui/dailyBreach.ts dailyFlightLayerOpacity): today's
  // switch to the back copy just before the handoff, or, for a 'hit', the
  // front copy the whole way.
  const layers = dailyFlightLayerOpacity(H, flight.stayInFront === true);
  const opacity = progress.interpolate({
    ...(layer === 'front' ? layers.front : layers.back),
    extrapolate: 'clamp',
  });
  // The press: a short dip and squeeze, canvas points scaled with the scene.
  const pressedY = Animated.add(
    translateY,
    press.interpolate({ inputRange: [0, 1], outputRange: [0, DAILY_BREACH_PLAQUE_PRESS.dipPt * frame.scale] }),
  );
  const pressedScale = Animated.multiply(
    scale,
    press.interpolate({ inputRange: [0, 1], outputRange: [1, 1 - DAILY_BREACH_PLAQUE_PRESS.scaleDown] }),
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flight,
        layer === 'front' ? styles.flightFront : styles.flightBack,
        {
          left: origin.x - offsetX,
          top: origin.y - offsetY,
          width: origin.width,
          height: origin.height,
          opacity,
          transform: [{ translateX }, { translateY: pressedY }, { scale: pressedScale }],
        },
      ]}
    >
      <View style={dailyCastlePlaqueStyle}>
        <DailyCastlePlaqueFace label={flight.label} width={origin.width} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFill,
    // Under the screen's SafeAreaView (DailyChallengeScreen styles.content).
    zIndex: 1,
  },
  layer: {
    position: 'absolute',
  },
  shakeWorld: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    elevation: 1,
  },
  goldHalo: {
    zIndex: 10,
    elevation: 10,
  },
  breachBolt: {
    zIndex: 45,
    elevation: 45,
  },
  breachDust: {
    zIndex: 46,
    elevation: 46,
  },
  breachSplinter: {
    zIndex: 47,
    elevation: 47,
  },
  breachFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    elevation: 2,
  },
  castleArch: {
    zIndex: 30,
    elevation: 30,
  },
  castleGoldFlash: {
    zIndex: 31,
    elevation: 31,
  },
  castleWall: {
    zIndex: 35,
    elevation: 35,
  },
  wallGroup: {
    ...StyleSheet.absoluteFill,
    zIndex: 35,
    elevation: 35,
  },
  roundMarkers: {
    zIndex: 38,
    elevation: 38,
  },
  opening: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 20,
    elevation: 20,
  },
  backWall: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  gate: {
    ...StyleSheet.absoluteFill,
    zIndex: 4,
    elevation: 4,
  },
  cardSlot: {
    position: 'absolute',
    zIndex: 40,
    elevation: 40,
    overflow: 'visible',
  },
  flight: {
    position: 'absolute',
  },
  flightFront: {
    zIndex: 50,
    elevation: 50,
  },
  flightBack: {
    zIndex: 3,
    elevation: 3,
  },
});
