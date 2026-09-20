import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const STONE_FEATHER = require('../../assets/images/dailycastle/stonefeather.png');

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

  return (
    <View style={styles.root}>
      {!showGold && count > 0 && (
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
        <View style={styles.featherRow}>
          <Image
            source={STONE_FEATHER}
            style={[styles.feather, styles.featherGold]}
            resizeMode="contain"
          />
        </View>
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
    tintColor: '#F5C842',
    width: 64,
    height: 54,
  },
});
