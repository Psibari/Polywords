import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { DAILY_CASTLE_LAYOUT } from '../ui/dailyCastleLayout';

const STONE_FEATHER = require('../../assets/images/dailycastle/stonefeather.png');
const GOLD_FEATHER = require('../../assets/ui/feather-gold-reward.png');

type Props = {
  /** Number of regular feathers to show (0-4) */
  featherCount: number;
  /** Show the gold feather instead (round 5 win) */
  showGold?: boolean;
  /** Uniform scale from the locked 430 × 932 reference phone. */
  scale?: number;
};

/**
 * Reward layer inside the castle opening. Its parent owns the opening geometry,
 * so this component simply fills that opening instead of guessing offsets.
 */
export default function FeatherWall({
  featherCount,
  showGold,
  scale = 1,
}: Props) {
  const count = Math.max(0, Math.min(4, featherCount));
  const reduceMotion = useReducedMotionPreference();
  const goldRise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showGold) {
      goldRise.setValue(0);
      return;
    }
    Animated.timing(goldRise, {
      toValue: 1,
      duration: reduceMotion === false ? 420 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [goldRise, reduceMotion, showGold]);

  return (
    <View pointerEvents="none" style={styles.root}>
      {count > 0 && (
        <View
          style={[
            styles.featherRow,
            { gap: DAILY_CASTLE_LAYOUT.stoneFeatherGap * scale },
          ]}
        >
          {Array.from({ length: count }).map((_, i) => (
            <Image
              key={i}
              source={STONE_FEATHER}
              style={{
                width: DAILY_CASTLE_LAYOUT.stoneFeather.width * scale,
                height: DAILY_CASTLE_LAYOUT.stoneFeather.height * scale,
              }}
              resizeMode="contain"
            />
          ))}
        </View>
      )}

      {showGold && (
        <Animated.View
          style={[
            styles.featherRow,
            {
              opacity: goldRise,
              transform: [{
                translateY: goldRise.interpolate({
                  inputRange: [0, 1],
                  outputRange: [35 * scale, 0],
                }),
              }],
            },
          ]}
        >
          <Image
            source={GOLD_FEATHER}
            style={{ width: 72 * scale, height: 96 * scale }}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  featherRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
