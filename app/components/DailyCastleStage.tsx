import React, { useEffect, useRef } from 'react';
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
import type { DailyAnswerCardProps } from './DailyAnswerCard';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  resolveDailyCastleScale,
} from '../ui/dailyCastleLayout';

const CASTLE_SCENE = require('../../assets/images/dailycastle/3darch5.png');
const FEATHER_WALL = require('../../assets/images/dailycastle/featherwall.png');
const useDailyCastleTuning = __DEV__
  ? require('../dev/dailyCastleTuning').useDailyCastleTuning
  : null;

const DEFAULTS = {
  background: { scale: 1, x: 0, y: 0 },
  gate: { scale: 1, x: 0, closedY: 0, openTravel: 286 },
  grid: { x: 0, y: 0, cardWidth: 167, cardHeight: 62, columnGap: 12, rowGap: 12 },
  clues: { x: 0, y: 0, width: 226, verticalGap: 76 },
};

// Same three physical legs as the gauntlet stones: release from the wall,
// travel toward the player, then settle. One progress value per slot drives
// both the wall-side layers below and the plaque transform in DailyAnswerCard.
const PLAQUE_SEG = [0.26, 0.86, 1] as const;
const PLAQUE_SEG_MS = [234, 540, 126] as const;
const PLAQUE_INPUT = [0, PLAQUE_SEG[0], PLAQUE_SEG[1], 1];
const RECESS_SHADOW = '#0D0918';
const RECESS_LIP = '#21183B';

type Props = {
  gatePosition: Animated.Value;
  clues: string[];
  revealedCount: 1 | 2 | 3;
  solvedCount: number;
  roundKey: number;
  onGateLayout: () => void;
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
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(plaqueProgress, {
          toValue: PLAQUE_SEG[2],
          duration: PLAQUE_SEG_MS[2],
          easing: Easing.out(Easing.back(1.7)),
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
    outputRange: [0, 0.18, 0.48, 0.58, 0.48],
  });
  const contactShadowScale = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0.94, 0.985, 1.035, 1.02],
  });
  const contactShadowX = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0, 1 * castleScale, 3 * castleScale, 2 * castleScale],
  });
  const contactShadowY = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0, 1 * castleScale, 5 * castleScale, 4 * castleScale],
  });

  // The broader shadow is intentionally restrained; it softens the contact
  // edge without making the plaque look detached from the wall.
  const dropShadowOpacity = plaqueProgress.interpolate({
    inputRange: [0, PLAQUE_SEG[0], PLAQUE_SEG[1], 1],
    outputRange: [0, 0.025, 0.14, 0.1],
  });
  const dropShadowScale = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0.94, 1, 1.075, 1.055],
  });
  const dropShadowY = plaqueProgress.interpolate({
    inputRange: PLAQUE_INPUT,
    outputRange: [0, 2 * castleScale, 7 * castleScale, 5 * castleScale],
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

/** One registered castle scene; only the gate and answer cards move. */
export default function DailyCastleStage({
  gatePosition,
  clues,
  revealedCount,
  solvedCount,
  roundKey,
  onGateLayout,
  children,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotionPreference();
  const background = __DEV__ ? useDailyCastleTuning((s: typeof DEFAULTS) => s.background) : DEFAULTS.background;
  const gate = __DEV__ ? useDailyCastleTuning((s: typeof DEFAULTS) => s.gate) : DEFAULTS.gate;
  const grid = __DEV__ ? useDailyCastleTuning((s: typeof DEFAULTS) => s.grid) : DEFAULTS.grid;
  const clueLayout = __DEV__ ? useDailyCastleTuning((s: typeof DEFAULTS) => s.clues) : DEFAULTS.clues;
  // Art source: 1790 × 3304. Preserve the rounded arch's native proportions.
  const widthScale = windowWidth / 390;
  const availableBottom = windowHeight - insets.bottom - 50;
  const gridTop = Math.min(435 * widthScale, availableBottom - (3 * grid.cardHeight + 2 * grid.rowGap) * widthScale);
  const opening = { left: (windowWidth - 254 * widthScale) / 2 + gate.x * widthScale,
    top: 110 * widthScale + gate.closedY * widthScale - insets.top,
    width: 254 * widthScale * gate.scale, height: 280 * widthScale * gate.scale };

  return (
    <View pointerEvents="box-none" style={styles.stage}>
      <Image
        source={CASTLE_SCENE}
        style={[styles.layer, styles.castleScene, {
          left: (windowWidth - windowWidth * background.scale) / 2 + background.x * widthScale,
          top: 10 * widthScale + background.y * widthScale - insets.top,
          width: windowWidth * background.scale,
          height: windowWidth * background.scale * 3304 / 1790,
        }]}
        resizeMode="cover"
      />
      <View style={[styles.opening, opening]}>
          <Image
            source={FEATHER_WALL}
            style={StyleSheet.absoluteFill}
            resizeMode="stretch"
          />
          <View style={[styles.featherArea, { top: 24 * widthScale, height: 260 * widthScale }]}>
            <FeatherWall
              featherCount={Math.min(solvedCount, 4)}
              showGold={solvedCount === 5}
              scale={widthScale}
            />
          </View>
          <View onLayout={onGateLayout} style={styles.gate}>
            <DailyGate
              gatePosition={gatePosition}
              clues={clues}
              revealedCount={revealedCount}
              width={opening.width}
              height={opening.width * 1062 / 737}
              openTravel={gate.openTravel * widthScale}
              scale={widthScale}
              clueX={clueLayout.x * widthScale}
              clueY={clueLayout.y * widthScale}
              clueWidth={clueLayout.width * widthScale}
              clueGap={clueLayout.verticalGap * widthScale}
            />
          </View>
      </View>

      {React.Children.toArray(children).map((child, index) => {
        if (index >= 6) return null;
        const cardWidth = grid.cardWidth * widthScale;
        const cardHeight = grid.cardHeight * widthScale;
        const gap = grid.columnGap * widthScale;
        const left = (windowWidth - 2 * cardWidth - gap) / 2 + (index % 2) * (cardWidth + gap) + grid.x * widthScale;
        const top = gridTop + Math.floor(index / 2) * (cardHeight + grid.rowGap * widthScale) + grid.y * widthScale - insets.top;
        return (
          <View
            key={`slot-${roundKey}-${index}`}
            pointerEvents="box-none"
            style={[
              styles.cardSlot,
              { left, top, width: cardWidth, height: cardHeight },
            ]}
          >
            <DailyCastlePlaqueSlot
                child={React.isValidElement<DailyAnswerCardProps>(child)
                  ? React.cloneElement(child, { castleWidth: cardWidth, castleHeight: cardHeight })
                  : child}
                castleScale={widthScale}
                reduceMotion={reduceMotion}
                roundKey={roundKey}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFill,
  },
  layer: {
    position: 'absolute',
  },
  opening: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 20,
    elevation: 20,
  },
  gate: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
    elevation: 3,
  },
  featherArea: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  castleScene: {
    zIndex: 30,
    elevation: 30,
  },
  cardSlot: {
    position: 'absolute',
    zIndex: 40,
    elevation: 40,
    overflow: 'visible',
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
