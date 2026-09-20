import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';

const STONE_FEATHER = require('../../assets/images/dailycastle/stonefeather.png');
const GOLD_FEATHER = require('../../assets/ui/feather-gold-reward.png');

type Props = {
  /** Number of regular feathers to show (0-4) */
  featherCount: number;
  /** Show the gold feather instead (round 5 win) */
  showGold?: boolean;
};

/**
 * The wall behind the gate. Visible only when the gate rises.
 * Feathers accumulate one per won round — they're carved into the stone.
 * Transparent background — sits behind the gate, no solid block.
 */
export default function FeatherWall({ featherCount, showGold }: Props) {
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
    <View style={styles.root}>
      {count > 0 && (
        <View style={styles.featherRow}>
          {Array.from({ length: count }).map((_, i) => (
            <Image
              key={i}
              source={STONE_FEATHER}
              style={styles.feather}
              resizeMode="contain"
            />
          ))}
        </View>
      )}
      {showGold && (
        <Animated.View style={[styles.featherRow, {
          opacity: goldRise,
          transform: [{ translateY: goldRise.interpolate({ inputRange: [0, 1], outputRange: [35, 0] }) }],
        }]}>
          <Image
            source={GOLD_FEATHER}
            style={styles.featherGold}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 80,
    left: 40,
    right: 40,
    height: 300,
    zIndex: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  featherRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  feather: {
    width: 48,
    height: 40,
    tintColor: '#FFF7D6',
  },
  featherGold: {
    width: 88,
    height: 110,
  },
});
