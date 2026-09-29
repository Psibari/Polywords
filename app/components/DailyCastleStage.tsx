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
import DailyGate from './DailyGate';
import DailyFloorCoins, { type DailyCoinRise } from './DailyFloorCoins';
import DailyRoundMarkers from './DailyRoundMarkers';
import {
  DailyCastlePlaqueFace,
  dailyCastlePlaqueStyle,
  type DailyAnswerCardClaimOrigin,
  type DailyAnswerCardProps,
} from './DailyAnswerCard';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  DAILY_CASTLE_FLIGHT,
  DAILY_CASTLE_FLIGHT_HANDOFF,
  DAILY_CASTLE_GRID,
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
// everywhere else, on the same canvas; it flashes over the castle on every
// correct answer (Pete, 2026-09-27). Built with the castle by the same script.
const CASTLE_GOLD_FLASH = require('../../assets/images/dailycastle/castle_cartoon_gold_flash.png');
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

export type DailyCastleFlight = {
  label: string;
  /** Window rect of the plaque at the moment it was released. */
  origin: DailyAnswerCardClaimOrigin;
};

// A new round's block fills its recess: it starts sunk, slides forward to a
// hair past flush, and settles flush with the wall. One progress value per
// slot drives the block's scale and depth shade in DailyAnswerCard.
const PLAQUE_SEG = [0.26, 0.86, 1] as const;
const PLAQUE_SEG_MS = [200, 460, 240] as const;

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
  /** 0 → 1 over the win's gold-coin presentation. */
  coinCelebrate: Animated.Value;
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
  reduceMotion: boolean | null;
  roundKey: number;
};

function DailyCastlePlaqueSlot({
  child,
  reduceMotion,
  roundKey,
}: PlaqueSlotProps) {
  const answerCard = React.isValidElement<DailyAnswerCardProps>(child)
    ? child
    : null;
  const entranceDelay = answerCard?.props.enterDelay ?? 0;
  const plaqueProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    plaqueProgress.stopAnimation();
    if (reduceMotion !== false) {
      plaqueProgress.setValue(1);
      return;
    }

    plaqueProgress.setValue(0);
    const releaseTimer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(plaqueProgress, {
          toValue: PLAQUE_SEG[0],
          duration: PLAQUE_SEG_MS[0],
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(plaqueProgress, {
          toValue: PLAQUE_SEG[1],
          duration: PLAQUE_SEG_MS[1],
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(plaqueProgress, {
          toValue: PLAQUE_SEG[2],
          duration: PLAQUE_SEG_MS[2],
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, entranceDelay);

    return () => {
      clearTimeout(releaseTimer);
      plaqueProgress.stopAnimation();
    };
  }, [entranceDelay, plaqueProgress, reduceMotion, roundKey]);

  if (!answerCard) return <>{child}</>;

  // The recess is part of the wall art, under the block; the block's own
  // scale and shade (DailyAnswerCard) carry it from sunk to flush.
  return React.cloneElement(answerCard, { recessProgress: plaqueProgress });
}

/**
 * One registered castle scene. The arch and wall never move; the gate, the
 * feathers behind it and the answer plaques do.
 *
 * Layer order, back to front: sky (screen) → feather wall and feathers →
 * plaque going in (back flight) → gate → arch → wall → plaques in the wall →
 * plaque being thrown (front flight).
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
  coinCelebrate,
  hudBottom,
  roundMarkers,
  onFrame,
  children,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotionPreference();
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

  // The trim flashes gold on every correct claim, peaking at the handoff, the
  // moment the thrown block passes behind the gate into the tunnel. It rides
  // the throw's own progress, so under reduced motion (or with no measured
  // origin) it doesn't play, just as the throw doesn't: intentional.
  const goldFlashOpacity = useMemo(
    () => flightProgress.interpolate({
      inputRange: [0, DAILY_CASTLE_FLIGHT_HANDOFF, 1],
      outputRange: [0, 1, 0],
    }),
    [flightProgress],
  );

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
      <Animated.Image
        source={CASTLE_GOLD_FLASH}
        style={[styles.layer, styles.castleGoldFlash, {
          left: sceneLeft,
          top: sceneTop,
          width: frame.width,
          height: frame.height,
          opacity: goldFlashOpacity,
        }]}
        resizeMode="stretch"
      />
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

      {/* Progress on the courtyard floor: a coin per solved round, gold on
          the win. Above the arch layer, below the answer wall. */}
      <DailyFloorCoins
        solvedCount={solvedCount}
        rise={coinRise}
        celebrate={coinCelebrate}
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
          />
        </View>
      </View>

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
                reduceMotion={reduceMotion}
                roundKey={roundKey}
            />
          </View>
        );
      })}

      {flight && (
        <DailyCastleFlightPlaque
          flight={flight}
          progress={flightProgress}
          layer="front"
          frame={frame}
          offsetX={stageOffset.x}
          offsetY={stageOffset.y}
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
  layer,
  frame,
  offsetX,
  offsetY,
}: {
  flight: DailyCastleFlight;
  progress: Animated.Value;
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
  const opacity = layer === 'front'
    ? progress.interpolate({
        inputRange: [0, H - 0.001, H],
        outputRange: [1, 1, 0],
        extrapolate: 'clamp',
      })
    : progress.interpolate({
        inputRange: [0, H - 0.001, H, H + (1 - H) * 0.35, 1],
        outputRange: [0, 0, 1, 1, 0],
        extrapolate: 'clamp',
      });

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
          transform: [{ translateX }, { translateY }, { scale }],
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
