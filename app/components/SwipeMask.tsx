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
const TILE_GAP = 10;

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
  tileHeight = 64,
}: Props) {
  const [bgColor, setBgColor] = useState('#1E1A3A');

  // Outer: controls layout space
  const outerHeightAnim    = useRef(new Animated.Value(tileHeight)).current;
  const outerMarginTopAnim = useRef(new Animated.Value(TILE_GAP)).current;

  // Inner: visual movement
  const slideY      = useRef(new Animated.Value(0)).current;
  const tileOpacity = useRef(new Animated.Value(1)).current;
  const shakeX      = useRef(new Animated.Value(0)).current;

  const judgedRef      = useRef(false);
  const stateRef       = useRef(s);
  const onSwipeUpRef   = useRef(onSwipeUp);
  const onSwipeDownRef = useRef(onSwipeDown);

  useEffect(() => { stateRef.current = s; }, [s]);
  useEffect(() => { onSwipeUpRef.current = onSwipeUp; }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current = onSwipeDown; }, [onSwipeDown]);

  // Sync layout height when tileHeight prop updates (onLayout fires after first render)
  useEffect(() => {
    if (!judgedRef.current) {
      outerHeightAnim.setValue(tileHeight);
    }
  }, [tileHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s === 'correct') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBgColor('#FFD700');
    }

    if (s === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBgColor('#CC2200');
      Animated.sequence([
        // shake
        Animated.sequence([
          Animated.timing(shakeX, { toValue:  14, duration: 50,  useNativeDriver: false }),
          Animated.timing(shakeX, { toValue: -14, duration: 55,  useNativeDriver: false }),
          Animated.timing(shakeX, { toValue:   9, duration: 55,  useNativeDriver: false }),
          Animated.timing(shakeX, { toValue:  -9, duration: 55,  useNativeDriver: false }),
          Animated.timing(shakeX, { toValue:   0, duration: 55,  useNativeDriver: false }),
        ]),
        // slide down + fade
        Animated.parallel([
          Animated.timing(slideY,      { toValue: 60, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: false }),
          Animated.timing(tileOpacity, { toValue: 0,  duration: 180, useNativeDriver: false }),
        ]),
        // collapse layout space
        Animated.parallel([
          Animated.timing(outerHeightAnim,    { toValue: 0, duration: 150, useNativeDriver: false }),
          Animated.timing(outerMarginTopAnim, { toValue: 0, duration: 150, useNativeDriver: false }),
        ]),
      ]).start();
    }

    if (s === 'trap-caught') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // no flash — just gone
      Animated.parallel([
        Animated.timing(tileOpacity,        { toValue: 0, duration: 80,  useNativeDriver: false }),
        Animated.timing(outerHeightAnim,    { toValue: 0, duration: 150, useNativeDriver: false }),
        Animated.timing(outerMarginTopAnim, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    }

    if (s === 'revealed') {
      judgedRef.current = false;
      slideY.setValue(0);
      shakeX.setValue(0);
      tileOpacity.setValue(1);
      outerHeightAnim.setValue(tileHeight);
      outerMarginTopAnim.setValue(TILE_GAP);
      setBgColor('#1E1A3A');
    }
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !judgedRef.current,
      onStartShouldSetPanResponderCapture: () => !judgedRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 4 || Math.abs(g.dx) > 4),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, g) => {
        if (judgedRef.current) return;
        if (g.dy < -SWIPE_THRESHOLD) {
          judgedRef.current = true;
          onSwipeUpRef.current();
        } else if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          judgedRef.current = true;
          onSwipeDownRef.current();
        }
      },
      onPanResponderTerminate: () => {},
    }),
  ).current;

  // Hidden: tap to reveal
  if (s === 'hidden') {
    return (
      <Animated.View style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim }}>
        <Pressable
          onPress={revealable ? onTapReveal : undefined}
          style={[styles.tile, { height: tileHeight, backgroundColor: '#2A2060' }]}
        >
          <Text style={styles.emoji}>❓</Text>
          <Text style={[styles.phrase, { color: '#FFD700' }]} numberOfLines={1}>
            Hidden meaning
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

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
            transform: [{ translateX: shakeX }, { translateY: slideY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.emoji}>{mask.emoji}</Text>
        <Text style={[styles.phrase, { color: textColor }]} numberOfLines={1}>
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
  emoji: {
    fontSize: 28,
    lineHeight: 34,
    marginRight: 12,
  },
  phrase: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
