import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import {
  resolveDailyFloorCoin,
  resolveDailyGoldCoin,
  toDailyCastleScreen,
  type DailyCastleFrame,
  type DailyCastleRect,
} from '../ui/dailyCastleScene';
import { dailyCoinFinaleKeyframes, type DailyCoinFinaleMode } from '../ui/dailyCoinFinale';

const WHITE_COIN = require('../../assets/images/dailycastle/coin_feather.png');
const GOLD_COIN = require('../../assets/images/dailycastle/coin_gold.png');

const WHITE_SLOTS = 4;

export type DailyCoinRise = {
  /** Increments once per correct claim, when the gate starts to come down. */
  token: number;
  /** Duration of that rise; 0 lands it at once (reduce motion). */
  ms: number;
};

type Props = {
  /** Rounds solved so far, 0–5. */
  solvedCount: number;
  /**
   * The newest coin rises out of the floor (and the row re-centres) when
   * `token` changes. On the win the four white coins sink as the gold one
   * rises. A new coin is already in the row, sunk, from the moment
   * `solvedCount` counts it.
   */
  rise: DailyCoinRise;
  /**
   * The win's finale (ui/dailyCoinFinale.ts): the gold coin hands over to the
   * hero coin (DailyCoinFinale) as it leaves the floor, and stays off the
   * floor after the hero has gone.
   */
  finale: Animated.Value;
  finaleMode: DailyCoinFinaleMode;
  frame: DailyCastleFrame;
  /** Stage-local offset of the scene. */
  offsetX: number;
  offsetY: number;
};

// Canvas-point offset of white coin `index` from the centred slot, in a row
// of `count`.
function rowOffset(index: number, count: number): number {
  return resolveDailyFloorCoin(index, count).x - resolveDailyFloorCoin(0, 1).x;
}

/**
 * The Daily's progress on the courtyard floor: a white-feather coin for each
 * solved round (one to four), then one gold-feather coin for the win. Each
 * coin sits in its own box clipped at its bottom edge, so moving it down
 * sinks it into the floor and moving it up raises it out.
 *
 * Every coin owns its Animated values for the life of the component and its
 * transform is always bound to them. A native-driven transform must never be
 * swapped for a plain number between renders: on device the view keeps the
 * last value the native driver wrote (coins stayed sunk and stuck mid-slide).
 */
export default function DailyFloorCoins({
  solvedCount,
  rise,
  finale,
  finaleMode,
  frame,
  offsetX,
  offsetY,
}: Props) {
  const solved = Math.max(0, Math.min(5, solvedCount));
  const won = solved === 5;
  const whites = Math.min(solved, WHITE_SLOTS);

  // sink: 0 = resting on the floor, 1 = one coin height down (hidden).
  // shift: canvas points from the centred slot.
  const coins = useRef<{ sink: Animated.Value[]; shift: Animated.Value[]; goldSink: Animated.Value } | null>(null);
  if (!coins.current) {
    coins.current = {
      sink: Array.from({ length: WHITE_SLOTS }, (_, i) => new Animated.Value(!won && i < whites ? 0 : 1)),
      shift: Array.from({ length: WHITE_SLOTS }, (_, i) =>
        new Animated.Value(!won && i < whites ? rowOffset(i, whites) : rowOffset(i, i + 1)),
      ),
      goldSink: new Animated.Value(won ? 0 : 1),
    };
  }
  const { sink, shift, goldSink } = coins.current;

  // A claim adds exactly one coin, which waits sunk for the rise. Any other
  // change — a fresh session (dev reset, a new day) or a restored one — settles
  // everything at once. Coins not yet earned wait sunk at the place they will
  // first appear, so the claim that earns one never has to move it first.
  const prevSolved = useRef(solved);
  useLayoutEffect(() => {
    const before = prevSolved.current;
    prevSolved.current = solved;
    if (solved === before || solved === before + 1) return;
    goldSink.stopAnimation();
    goldSink.setValue(won ? 0 : 1);
    for (let i = 0; i < WHITE_SLOTS; i += 1) {
      sink[i].stopAnimation();
      shift[i].stopAnimation();
      const shown = !won && i < whites;
      sink[i].setValue(shown ? 0 : 1);
      shift[i].setValue(shown ? rowOffset(i, whites) : rowOffset(i, i + 1));
    }
  }, [solved, won, whites, sink, shift, goldSink]);

  // The rise itself, on the gate's beat.
  const lastToken = useRef(rise.token);
  useEffect(() => {
    if (rise.token === lastToken.current) return;
    lastToken.current = rise.token;
    const moves: Array<[Animated.Value, number]> = [];
    if (won) {
      for (let i = 0; i < WHITE_SLOTS; i += 1) moves.push([sink[i], 1]);
      moves.push([goldSink, 0]);
    } else if (whites > 0) {
      moves.push([sink[whites - 1], 0]);
      for (let i = 0; i < whites - 1; i += 1) moves.push([shift[i], rowOffset(i, whites)]);
    }
    if (rise.ms <= 0) {
      moves.forEach(([value, to]) => {
        value.stopAnimation();
        value.setValue(to);
      });
      return;
    }
    Animated.parallel(
      moves.map(([value, to]) =>
        Animated.timing(value, {
          toValue: to,
          duration: rise.ms,
          // No overshoot: the coin is clipped to its own box at the floor.
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
    // Only a new token starts a rise; the other inputs are read as they stand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rise.token]);

  const place = (rect: DailyCastleRect) => {
    const r = toDailyCastleScreen(frame, rect);
    return { left: r.x + offsetX, top: r.y + offsetY, width: r.width, height: r.height };
  };
  const whiteBox = place(resolveDailyFloorCoin(0, 1));
  const goldBox = place(resolveDailyGoldCoin());
  const sunkY = (value: Animated.Value, height: number) =>
    value.interpolate({ inputRange: [0, 1], outputRange: [0, height] });

  const goldFloor = dailyCoinFinaleKeyframes(finaleMode, 1, false).floor;
  const goldOpacity = finale.interpolate({
    inputRange: goldFloor.input,
    outputRange: goldFloor.output,
    extrapolate: 'clamp',
  });

  // Four white slots are always mounted (unearned ones wait sunk, which the
  // clip hides), so no coin's view is ever created mid-claim.
  return (
    <>
      {sink.map((value, i) => (
        <Animated.View
          key={`w-${i}`}
          pointerEvents="none"
          style={[
            styles.clip,
            whiteBox,
            { transform: [{ translateX: Animated.multiply(shift[i], frame.scale) }] },
          ]}
        >
          <Animated.View style={[styles.fill, { transform: [{ translateY: sunkY(value, whiteBox.height) }] }]}>
            <Image source={WHITE_COIN} resizeMode="stretch" style={{ width: whiteBox.width, height: whiteBox.height }} />
          </Animated.View>
        </Animated.View>
      ))}
      <Animated.View pointerEvents="none" style={[styles.clip, goldBox, { opacity: goldOpacity }]}>
        <Animated.View style={[styles.fill, { transform: [{ translateY: sunkY(goldSink, goldBox.height) }] }]}>
          <Image source={GOLD_COIN} resizeMode="stretch" style={{ width: goldBox.width, height: goldBox.height }} />
        </Animated.View>
      </Animated.View>
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
