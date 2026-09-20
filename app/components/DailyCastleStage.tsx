import React from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import DailyGate from './DailyGate';
import FeatherWall from './FeatherWall';

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

/** Fixed castle layers; only the gate and the answer cards move. */
export default function DailyCastleStage({
  gatePosition, clues, revealedCount, solvedCount,
  roundKey, onGateLayout, children,
}: Props) {
  return (
    <View pointerEvents="box-none" style={styles.stage}>
      <Image source={FEATHER_WALL} style={styles.featherWall} resizeMode="stretch" />
      <FeatherWall featherCount={Math.min(solvedCount, 4)} showGold={solvedCount === 5} />
      <View onLayout={onGateLayout} style={styles.gate}>
        <DailyGate gatePosition={gatePosition} clues={clues} revealedCount={revealedCount} width={340} />
      </View>
      <Image source={SQUARE_ARCH} style={styles.arch} resizeMode="stretch" />
      <Image source={ANSWER_WALL} style={styles.answerWall} resizeMode="stretch" />
      <Image source={ANSWER_RECESSES} style={styles.answerRecesses} resizeMode="stretch" />
      <View pointerEvents="box-none" style={styles.cardArea}>
        <View key={`grid-${roundKey}`} style={styles.cardGrid}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', top: 60, right: 0, bottom: 0, left: 0 },
  featherWall: { position: 'absolute', top: 80, left: 0, right: 0, height: 300, zIndex: 15 },
  arch: { position: 'absolute', top: 0, left: 0, right: 0, height: 370, zIndex: 50 },
  gate: { position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  answerWall: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 320, zIndex: 10 },
  answerRecesses: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 320, zIndex: 11 },
  cardArea: { position: 'absolute', bottom: 40, left: 16, right: 16, zIndex: 40 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
});
