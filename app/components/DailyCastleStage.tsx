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

const SQUARE_ARCH = require('../../assets/images/dailycastle/squarearch.png');
const ANSWER_WALL = require('../../assets/images/dailycastle/answerwall.png');
const ANSWER_RECESSES = require('../../assets/images/dailycastle/answerwqallrecesses.png');
const FEATHER_WALL = require('../../assets/images/dailycastle/featherwall.png');

type Props = {
  gatePosition: Animated.Value;
  clues: string[];
  revealedCount: 1 | 2 | 3;
  solvedCount: number;
  roundKey: number;
  onGateLayout: () => void;
  children: React.ReactNode;
};

/** Fixed castle layers; only the gate and answer cards move. */
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
    top: target.y * scale - insets.top,
    width: target.width * scale,
    height: target.height * scale,
  });

  const opening = DAILY_CASTLE_LAYOUT.opening;
  const cardGrid = DAILY_CASTLE_LAYOUT.cardGrid;

  return (
    <View pointerEvents="box-none" style={styles.stage}>
      <View style={[styles.opening, rect(opening)]}>
        <Image
          source={FEATHER_WALL}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />
        <FeatherWall
          featherCount={Math.min(solvedCount, 4)}
          showGold={solvedCount === 5}
          scale={scale}
        />
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

      <Image
        source={SQUARE_ARCH}
        style={[styles.layer, styles.arch, rect(DAILY_CASTLE_LAYOUT.arch)]}
        resizeMode="stretch"
      />

      <Image
        source={ANSWER_WALL}
        style={[styles.layer, styles.answerWall, rect(DAILY_CASTLE_LAYOUT.answerWall)]}
        resizeMode="stretch"
      />
      <Image
        source={ANSWER_RECESSES}
        style={[styles.layer, styles.answerRecesses, rect(DAILY_CASTLE_LAYOUT.answerRecesses)]}
        resizeMode="stretch"
      />

      <View
        pointerEvents="box-none"
        style={[styles.cardArea, rect(cardGrid)]}
      >
        <View
          key={`grid-${roundKey}`}
          style={[
            styles.cardGrid,
            {
              columnGap: DAILY_CASTLE_LAYOUT.cardColumnGap * scale,
              rowGap: DAILY_CASTLE_LAYOUT.cardRowGap * scale,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    elevation: 3,
  },
  arch: {
    zIndex: 50,
    elevation: 50,
  },
  answerWall: {
    zIndex: 10,
    elevation: 10,
  },
  answerRecesses: {
    zIndex: 11,
    elevation: 11,
  },
  cardArea: {
    position: 'absolute',
    zIndex: 40,
    elevation: 40,
  },
  cardGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
  },
});
