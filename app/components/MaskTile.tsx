import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type MaskData = {
  id: string;
  icon?: string;
  phrase: string;
  isReal: boolean;
  isHidden?: boolean;
};

export type MaskTileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed';

type Props = {
  mask: MaskData;
  state: MaskTileState;
  onPress: () => void;
  entranceDelay?: number;
};

const C = {
  idle: '#311F78',
  selected: '#3D2590',
  correct: '#22C55E',
  error: '#EF4444',
  missed: '#374151',
  gold: '#FFD700',
  white: '#FFFFFF',
};

export function MaskTile({ mask, state: s, onPress, entranceDelay = 0 }: Props) {
  const enterY = useRef(new Animated.Value(30)).current;
  const enterOp = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const flipX = useRef(new Animated.Value(1)).current;
  const goldPulse = useRef(new Animated.Value(0)).current;
  const goldLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // entrance with spring overshoot
  useEffect(() => {
    Animated.sequence([
      Animated.delay(entranceDelay),
      Animated.parallel([
        Animated.timing(enterY, {
          toValue: 0,
          duration: 400,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          useNativeDriver: true,
        }),
        Animated.timing(enterOp, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state-driven animations
  useEffect(() => {
    if (s === 'wrong') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 9, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -9, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
    if (s === 'correct') {
      Animated.sequence([
        Animated.timing(flipX, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(flipX, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [s]);

  // hidden mystery tile — gold border pulse
  useEffect(() => {
    if (!mask.isHidden) return;
    goldLoopRef.current?.stop();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(goldPulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    goldLoopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [mask.isHidden]);

  const bgColor =
    s === 'correct' ? C.correct
    : s === 'wrong' ? C.error
    : s === 'missed' ? C.missed
    : s === 'selected' ? C.selected
    : C.idle;

  const borderColor =
    s === 'selected' ? C.gold
    : s === 'correct' ? C.correct
    : s === 'wrong' ? C.error
    : 'rgba(255,255,255,0.12)';

  const borderWidth = s === 'selected' || s === 'correct' || s === 'wrong' ? 2 : 1;
  const showReveal = s === 'correct' || s === 'wrong' || s === 'missed';

  return (
    <Animated.View
      style={{
        opacity: enterOp,
        transform: [
          { translateY: enterY },
          { translateX: shakeX },
          { scaleX: flipX },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        style={[styles.tile, { backgroundColor: bgColor, borderColor, borderWidth }]}
      >
        {/* animated gold border overlay for hidden tiles */}
        {mask.isHidden && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.goldBorderOverlay,
              { opacity: goldPulse },
            ]}
          />
        )}

        {mask.isHidden ? (
          <Text style={styles.hiddenIcon}>❓</Text>
        ) : (
          <View style={styles.content}>
            {mask.icon ? <Text style={styles.icon}>{mask.icon}</Text> : null}
            <Text style={styles.phrase} numberOfLines={2}>
              {mask.phrase}
            </Text>
          </View>
        )}

        {showReveal && (
          <Text
            style={[
              styles.revealLabel,
              s === 'correct' && styles.revealGreen,
              s === 'wrong' && styles.revealRed,
              s === 'missed' && styles.revealGrey,
            ]}
          >
            {s === 'correct' ? '✓ real meaning' : s === 'wrong' ? '✗ not a meaning' : 'missed'}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    overflow: 'hidden',
  },
  goldBorderOverlay: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  content: {
    alignItems: 'center',
  },
  hiddenIcon: {
    fontSize: 28,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  phrase: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  revealLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  revealGreen: { color: '#22C55E' },
  revealRed: { color: '#EF4444' },
  revealGrey: { color: 'rgba(255,255,255,0.35)' },
});
