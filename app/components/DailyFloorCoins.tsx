import React from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import {
  resolveDailyFloorCoin,
  resolveDailyGoldCoin,
  toDailyCastleScreen,
  type DailyCastleFrame,
  type DailyCastleRect,
} from '../ui/dailyCastleScene';

const WHITE_COIN = require('../../assets/images/dailycastle/coin_feather.png');
const GOLD_COIN = require('../../assets/images/dailycastle/coin_gold.png');

type Props = {
  /** Rounds solved so far, 0–5. */
  solvedCount: number;
  /**
   * 0 → 1 as the newest coin rises out of the floor (the stage drives it
   * with the gate coming down). On the win it also sinks the four white
   * coins back into the floor as the gold one comes up.
   */
  rise: Animated.Value;
  frame: DailyCastleFrame;
  /** Stage-local offset of the scene. */
  offsetX: number;
  offsetY: number;
};

/**
 * The Daily's progress on the courtyard floor: a white-feather coin for each
 * solved round (one to four), then one gold-feather coin for the win. Each
 * coin sits in its own box clipped at its bottom edge, so moving it down
 * sinks it into the floor and moving it up raises it out.
 */
export default function DailyFloorCoins({ solvedCount, rise, frame, offsetX, offsetY }: Props) {
  const solved = Math.max(0, Math.min(5, solvedCount));
  const won = solved === 5;
  const whites = Math.min(solved, 4);

  const place = (rect: DailyCastleRect) => {
    const r = toDailyCastleScreen(frame, rect);
    return { left: r.x + offsetX, top: r.y + offsetY, width: r.width, height: r.height };
  };

  // Up out of the floor: fully sunk (one coin height down) to resting.
  const up = (height: number) =>
    rise.interpolate({ inputRange: [0, 1], outputRange: [height, 0], extrapolate: 'clamp' });
  // Back into the floor, on the same beat.
  const down = (height: number) =>
    rise.interpolate({ inputRange: [0, 1], outputRange: [0, height], extrapolate: 'clamp' });

  return (
    <>
      {Array.from({ length: whites }).map((_, i) => {
        const box = place(resolveDailyFloorCoin(i, whites));
        const isNewest = !won && i === solved - 1;
        const translateY = won ? down(box.height) : isNewest ? up(box.height) : 0;
        // The row re-centres as it grows. A coin that was already down slides
        // from its place in the shorter row on the same beat the new one
        // rises, instead of jumping the moment the answer is claimed.
        const wasInRow = !won && !isNewest && whites > 1;
        const slideFrom = wasInRow
          ? (resolveDailyFloorCoin(i, whites - 1).x - resolveDailyFloorCoin(i, whites).x) * frame.scale
          : 0;
        const translateX = slideFrom
          ? rise.interpolate({ inputRange: [0, 1], outputRange: [slideFrom, 0], extrapolate: 'clamp' })
          : 0;
        return (
          <Animated.View
            key={`w-${i}`}
            pointerEvents="none"
            style={[styles.clip, box, { transform: [{ translateX }] }]}
          >
            <Animated.View style={[styles.fill, { transform: [{ translateY }] }]}>
              <Image source={WHITE_COIN} resizeMode="stretch" style={{ width: box.width, height: box.height }} />
            </Animated.View>
          </Animated.View>
        );
      })}
      {won && (() => {
        const box = place(resolveDailyGoldCoin());
        return (
          <View key="gold" pointerEvents="none" style={[styles.clip, box]}>
            <Animated.View style={[styles.fill, { transform: [{ translateY: up(box.height) }] }]}>
              <Image source={GOLD_COIN} resizeMode="stretch" style={{ width: box.width, height: box.height }} />
            </Animated.View>
          </View>
        );
      })()}
    </>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 32,
    elevation: 32,
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
});
