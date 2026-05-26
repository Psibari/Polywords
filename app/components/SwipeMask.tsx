import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mask } from '../game/types';

export type SwipeMaskState = 'idle' | 'correct' | 'trap-caught' | 'wrong' | 'hidden' | 'revealed';

const SWIPE_THRESHOLD = 40;
const TILE_GAP        = 10;

type Props = {
  mask: Mask;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onTapReveal: () => void;
  state: SwipeMaskState;
  revealable?: boolean;
  tileHeight?: number;
};

export function SwipeMask({
  mask,
  onSwipeUp,
  onSwipeDown,
  onTapReveal,
  state: s,
  revealable = false,
  tileHeight = 68,
}: Props) {
  const [bgColor, setBgColor] = useState('#1E1A3A');

  // Outer wrapper — controls layout height and gap (collapsed on exit)
  const outerHeightAnim    = useRef(new Animated.Value(tileHeight)).current;
  const outerMarginTopAnim = useRef(new Animated.Value(TILE_GAP)).current;

  // FIX 2 — single ValueXY drives both finger tracking and exit animations
  const panXY      = useRef(new Animated.ValueXY()).current;
  const tileOpacity = useRef(new Animated.Value(1)).current;

  const judgedRef      = useRef(false);
  const swipeDirRef    = useRef<'up' | 'right' | 'left' | null>(null);
  const onSwipeUpRef   = useRef(onSwipeUp);
  const onSwipeDownRef = useRef(onSwipeDown);

  useEffect(() => { onSwipeUpRef.current = onSwipeUp; }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current = onSwipeDown; }, [onSwipeDown]);

  // Sync layout height when tileHeight prop changes before any swipe
  useEffect(() => {
    if (!judgedRef.current) {
      outerHeightAnim.setValue(tileHeight);
    }
  }, [tileHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── State-driven animations ───────────────────────────────────
  useEffect(() => {

    if (s === 'correct') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBgColor('#FFD700');
      // Spring the tile back to its locked gold position
      Animated.spring(panXY, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        speed: 20,
        bounciness: 6,
      }).start();
    }

    if (s === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBgColor('#CC2200');
      Animated.sequence([
        // 1. Snap to centre so shake looks clean
        Animated.timing(panXY, { toValue: { x: 0, y: 0 }, duration: 80, useNativeDriver: false }),
        // 2. Horizontal shake
        Animated.sequence([
          Animated.timing(panXY, { toValue: { x:  14, y: 0 }, duration: 50, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x: -14, y: 0 }, duration: 55, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x:   9, y: 0 }, duration: 55, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x:  -9, y: 0 }, duration: 55, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x:   0, y: 0 }, duration: 55, useNativeDriver: false }),
        ]),
        // 3. Fly down off screen + fade out
        Animated.parallel([
          Animated.timing(panXY, {
            toValue: { x: 0, y: 800 },
            duration: 250,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(tileOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
        // 4. Collapse layout space (FIX 3)
        Animated.parallel([
          Animated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
      ]).start();
    }

    if (s === 'trap-caught') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Fly off in the direction of the swipe, then collapse (FIX 3)
      const flyX = swipeDirRef.current === 'left' ? -600 : 600;
      Animated.sequence([
        Animated.parallel([
          Animated.timing(panXY, {
            toValue: { x: flyX, y: 0 },
            duration: 250,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(tileOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
      ]).start();
    }

    if (s === 'revealed') {
      judgedRef.current  = false;
      swipeDirRef.current = null;
      panXY.setValue({ x: 0, y: 0 });
      tileOpacity.setValue(1);
      outerHeightAnim.setValue(tileHeight);
      outerMarginTopAnim.setValue(TILE_GAP);
      setBgColor('#1E1A3A');
    }

  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PanResponder — FIX 2 ──────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !judgedRef.current,
      onStartShouldSetPanResponderCapture: () => !judgedRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 4 || Math.abs(g.dx) > 4),
      onPanResponderTerminationRequest: () => false,

      // FIX 2 — tile physically follows the finger
      onPanResponderMove: (_, g) => {
        if (judgedRef.current) return;
        panXY.setValue({ x: g.dx, y: g.dy });
      },

      onPanResponderRelease: (_, g) => {
        if (judgedRef.current) return;

        if (g.dy < -SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'up';
          onSwipeUpRef.current();

        } else if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'right';
          onSwipeDownRef.current();

        } else if (g.dx < -SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'left';
          onSwipeDownRef.current();

        } else {
          // Sub-threshold release — spring back to origin
          Animated.spring(panXY, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            speed: 22,
            bounciness: 8,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          Animated.spring(panXY, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            speed: 22,
            bounciness: 8,
          }).start();
        }
      },
    }),
  ).current;

  // ── Hidden state ──────────────────────────────────────────────
  if (s === 'hidden') {
    return (
      <Animated.View style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim }}>
        <Pressable
          onPress={revealable ? onTapReveal : undefined}
          style={[styles.tile, { height: tileHeight, backgroundColor: '#2A2060' }]}
        >
          <Text style={styles.emoji}>❓</Text>
          <Text style={[styles.phrase, { color: '#FFD700' }]} numberOfLines={2}>
            Hidden meaning
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  // ── Normal tile ───────────────────────────────────────────────
  const textColor = s === 'correct' ? '#1A1040' : '#FFFFFF';

  return (
    <Animated.View
      style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim, overflow: 'visible' }}
    >
      <Animated.View
        style={[
          styles.tile,
          {
            height: tileHeight,
            backgroundColor: bgColor,
            opacity: tileOpacity,
            // FIX 2 — single ValueXY drives finger tracking AND exit animations
            transform: [{ translateX: panXY.x }, { translateY: panXY.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.emoji}>{mask.emoji}</Text>
        {/* FIX 1 — larger, bolder text; 2-line cap */}
        <Text style={[styles.phrase, { color: textColor }]} numberOfLines={2}>
          {mask.phrase}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    overflow: 'hidden',
  },
  // FIX 1 — emoji 32px
  emoji: {
    fontSize: 32,
    lineHeight: 38,
    marginRight: 12,
  },
  // FIX 1 — 20px / 700 weight fills the bar visually
  phrase: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
});
