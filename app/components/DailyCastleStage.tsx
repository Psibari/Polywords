import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import FeatherWall from './FeatherWall';
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
  DAILY_CASTLE_OPENING,
  DAILY_GATE_CLOSED,
  DAILY_GATE_MAX_SINK,
  DAILY_GATE_OPEN_TRAVEL,
  resolveDailyCastleFrame,
  resolveDailyCastleSlot,
  resolveDailyGateClueRects,
  toDailyCastleScreen,
  type DailyCastleGrid,
} from '../ui/dailyCastleScene';

// ARCHNEW (towers, arch, steps, floor) and the answer wall share one
// 1290 × 2796 canvas and are always drawn at the same rect.
const CASTLE_ARCH = require('../../assets/images/dailycastle/ARCHNEW.png');
const CASTLE_WALL = require('../../assets/images/dailycastle/cornerwall.png');
const FEATHER_WALL = require('../../assets/images/dailycastle/featherwall.png');
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

// Same three physical legs as the gauntlet stones: release from the wall,
// push forward toward the player past its resting size, then settle back.
// One progress value per slot drives both the wall-side layers below and the
// plaque transform and depth shade in DailyAnswerCard.
const PLAQUE_SEG = [0.26, 0.86, 1] as const;
const PLAQUE_SEG_MS = [200, 460, 240] as const;
const PLAQUE_INPUT = [0, PLAQUE_SEG[0], PLAQUE_SEG[1], 1];
const RECESS_SHADOW = '#0D0918';
const RECESS_LIP = '#21183B';

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
  /** 0 → 1 rise of the newest feather on the wall behind the gate. */
  featherRise: Animated.Value;
  /** Window y of the HUD's bottom edge; the first clue stays below it. */
  hudBottom: number;
  children: React.ReactNode;
};

type PlaqueSlotProps = {
  child: React.ReactNode;
  castleScale: number;
  reduceMotion: boolean | null;
  roundKey: number;
};

function DailyCastlePlaqueSlot({
  child,
  castleScale,
  reduceMotion,
  roundKey,
}: PlaqueSlotProps) {
  const answerCard = React.isValidElement<DailyAnswerCardProps>(child)
    ? child
    : null;
  const entranceDelay = answerCard?.props.enterDelay ?? 0;
  const state = answerCard?.props.state ?? 'idle';
  const sealedIdle = state === 'idle';
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

  // The socket belongs to the wall. It appears under the plaque in the same
  // first sliver used by the gauntlet recess overlay, then remains fixed while
  // the plaque advances toward the player.
  const socketOpacity = plaqueProgress.interpolate({
    inputRange: [0, 0.06, 1],
    outputRange: [0, 1, 1],
  });
  // A tight contact shadow carries the main separation cue. It grows early
  // enough to read as a wall release, then settles close to the plaque.
  const contactShadowOpacity = plaqueProgress.interpolate({
    inputRange: [0, 0.06, PLAQUE_SEG[0], PLAQUE_SEG[1], 1],
    outputRange: [0, 0.18, 0.5, 0.62, 0.48],
  });
  // Tracks the plaque's own scale (DailyAnswerCard DAILY_RECESS_SCALE) a
  // touch behind it, so the shadow trails the push toward the player.
  const contactShadowScale = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0.8, 0.84, 1.08, 1.02],
  });
  const contactShadowX = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0, 1 * castleScale, 4 * castleScale, 2 * castleScale],
  });
  const contactShadowY = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0, 1 * castleScale, 8 * castleScale, 4 * castleScale],
  });

  // The broader shadow peaks while the plaque is furthest out of the wall,
  // then settles back to a soft rest.
  const dropShadowOpacity = plaqueProgress.interpolate({
    inputRange: [0, PLAQUE_SEG[0], PLAQUE_SEG[1], 1],
    outputRange: [0, 0.04, 0.3, 0.12],
  });
  const dropShadowScale = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0.8, 0.86, 1.14, 1.05],
  });
  const dropShadowY = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0, 2 * castleScale, 12 * castleScale, 5 * castleScale],
  });

  // Fixed to the wall rather than the plaque. It shades/covers the rim on the
  // first frame, then clears as the plaque exits the carved socket.
  const capOpacity = plaqueProgress.interpolate({
    inputRange: [0, 0.1, 0.3, 1],
    outputRange: [1, 1, 0, 0],
  });

  const plaque = React.cloneElement(answerCard, { recessProgress: plaqueProgress });

  return (
    <>
      {sealedIdle && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.recessSocket,
              {
                top: -3 * castleScale,
                right: -3 * castleScale,
                bottom: -3 * castleScale,
                left: -3 * castleScale,
                borderRadius: 11 * castleScale,
                opacity: socketOpacity,
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dropShadow,
              {
                borderRadius: 12 * castleScale,
                opacity: dropShadowOpacity,
                transform: [
                  { translateY: dropShadowY },
                  { scale: dropShadowScale },
                ],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.contactShadow,
              {
                borderRadius: 10 * castleScale,
                opacity: contactShadowOpacity,
                transform: [
                  { translateX: contactShadowX },
                  { translateY: contactShadowY },
                  { scale: contactShadowScale },
                ],
              },
            ]}
          />
        </>
      )}

      {plaque}

      {sealedIdle && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.recessCap,
            {
              borderRadius: 10 * castleScale,
              borderWidth: 3 * castleScale,
              opacity: capOpacity,
            },
          ]}
        />
      )}
    </>
  );
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
  featherRise,
  hudBottom,
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
  const sceneTop = frame.top - stageOffset.y;
  const sceneLeft = -stageOffset.x;
  const opening = toDailyCastleScreen(frame, DAILY_CASTLE_OPENING);
  opening.x += sceneLeft;
  opening.y -= stageOffset.y;

  // Gate and clue rects relative to the opening / gate image that hold them.
  const gateFrame = {
    x: (DAILY_GATE_CLOSED.x - DAILY_CASTLE_OPENING.x + tuning.gate.x) * s,
    y: (DAILY_GATE_CLOSED.y - DAILY_CASTLE_OPENING.y + tuning.gate.y) * s,
    width: DAILY_GATE_CLOSED.width * s,
    height: DAILY_GATE_CLOSED.height * s,
  };
  const clueRects = resolveDailyGateClueRects().map((rect) => {
    const width = (tuning.clues.width || rect.width) * s;
    return {
      x: (rect.x - DAILY_GATE_CLOSED.x + tuning.clues.x) * s + (rect.width * s - width) / 2,
      y: (rect.y - DAILY_GATE_CLOSED.y + tuning.clues.y) * s,
      width,
      height: rect.height * s,
    };
  });

  return (
    <View
      ref={stageRef}
      onLayout={measureStage}
      pointerEvents="box-none"
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

      <View pointerEvents="none" style={[styles.opening, {
        left: opening.x,
        top: opening.y,
        width: opening.width,
        height: opening.height,
      }]}>
        <Image
          source={FEATHER_WALL}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />
        <FeatherWall
          featherCount={Math.min(solvedCount, 4)}
          showGold={solvedCount === 5}
          scale={s}
          newestRise={featherRise}
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
            openTravel={DAILY_GATE_OPEN_TRAVEL * s}
            maxSink={DAILY_GATE_MAX_SINK * s}
            scale={s}
          />
        </View>
      </View>

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
                castleScale={s}
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
        <DailyCastlePlaqueFace label={flight.label} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFill,
  },
  layer: {
    position: 'absolute',
  },
  castleArch: {
    zIndex: 30,
    elevation: 30,
  },
  castleWall: {
    zIndex: 35,
    elevation: 35,
  },
  opening: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 20,
    elevation: 20,
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
  recessSocket: {
    position: 'absolute',
    backgroundColor: RECESS_SHADOW,
  },
  contactShadow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#080611',
  },
  dropShadow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  recessCap: {
    ...StyleSheet.absoluteFill,
    borderColor: RECESS_LIP,
    backgroundColor: 'rgba(13,9,24,0.46)',
  },
});
