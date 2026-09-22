import React from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DailyGate from './DailyGate';
import FeatherWall from './FeatherWall';
import {
  DAILY_CASTLE_LAYOUT,
  DailyCastleRect,
  resolveDailyCastleScale,
  resolveDailyCastleXOffset,
} from '../ui/dailyCastleLayout';

const CASTLE_SCENE = require('../../assets/images/dailycastle/squarearchfull.png');

type Props = {
  gatePosition: Animated.Value;
  clues: string[];
  revealedCount: 1 | 2 | 3;
  solvedCount: number;
  roundKey: number;
  onGateLayout: () => void;
  children: React.ReactNode;
};

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
  const scale = resolveDailyCastleScale(windowWidth, windowHeight);
  const xOffset = resolveDailyCastleXOffset(windowWidth, scale);

  const rect = (target: DailyCastleRect) => ({
    left: xOffset + target.x * scale,
    top: (target.y + DAILY_CASTLE_LAYOUT.topOffset) * scale - insets.top,
    width: target.width * scale,
    height: target.height * scale,
  });

  const opening = DAILY_CASTLE_LAYOUT.opening;

  return (
    <View pointerEvents="box-none" style={styles.stage}>
      <Image
        source={CASTLE_SCENE}
        style={[styles.layer, styles.castleScene, rect(DAILY_CASTLE_LAYOUT.scene)]}
        resizeMode="stretch"
      />
      <View style={[styles.opening, rect(opening)]}>
        <View style={[styles.featherArea, { top: 24 * scale, height: 404 * scale }]}>
          <FeatherWall
            featherCount={Math.min(solvedCount, 4)}
            showGold={solvedCount === 5}
            scale={scale}
          />
        </View>
        <View onLayout={onGateLayout} style={styles.gate}>
          <DailyGate
            gatePosition={gatePosition}
            clues={clues}
            revealedCount={revealedCount}
            width={opening.width * scale}
            height={opening.height * scale}
            openTravel={DAILY_CASTLE_LAYOUT.gateOpenTravel * scale}
            scale={scale}
          />
        </View>
      </View>

      {React.Children.toArray(children).map((child, index) => {
        const slot = DAILY_CASTLE_LAYOUT.answerSlots[index];
        if (!slot) return null;
        return (
          <View
            key={`slot-${roundKey}-${index}`}
            pointerEvents="box-none"
            style={[
              styles.cardSlot,
              rect({
                x: slot.x,
                y: slot.y,
                width: DAILY_CASTLE_LAYOUT.card.width,
                height: DAILY_CASTLE_LAYOUT.card.height,
              }),
            ]}
          >
            {child}
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
});
