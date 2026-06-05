import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  useAnimatedStyle,
  Easing as ReaEasing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Mask } from '../game/types';
import { FluentEmoji } from './FluentEmoji';
import { playCorrectSwipe, playWrongBuzz, playShatter } from '../utils/SoundEngine';
import { FONTS, FONT_SIZES } from '../constants/fonts';

export type SwipeMaskState = 'idle' | 'correct' | 'trap-caught' | 'wrong' | 'hidden' | 'revealed';

const SWIPE_THRESHOLD = 40;
const TILE_GAP        = 6;

type Props = {
  mask: Mask;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onSwipeReveal: () => void;
  state: SwipeMaskState;
  revealable?: boolean;
  tileHeight?: number;
  isSpecialSplit?: boolean;
  entryDelay?: number;
  eraBadge?: string;
  hapticCorrect?: () => void;
  onEffect?: (type: 'shard' | 'trail', x: number, y: number) => void;
  wordY?: number;
};

// Gold steps for word absorption — exported for MaskBoard
export const GOLD_STEPS = [0, 0.25, 0.55, 0.80, 1.0] as const;

export function SwipeMask({
  mask,
  onSwipeUp,
  onSwipeDown,
  onSwipeReveal,
  state: s,
  revealable = false,
  tileHeight = 58,
  isSpecialSplit = false,
  entryDelay = 0,
  eraBadge,
  hapticCorrect,
  onEffect,
  wordY = 180,
}: Props) {

  // ── UI state ──────────────────────────────────────────────────
  const [flashRed, setFlashRed] = useState(false);

  // ── Reanimated shared values (native driver: transform/opacity) ─
  const translateX       = useSharedValue(0);
  const translateY       = useSharedValue(0);
  const scale            = useSharedValue(1);
  const rotation         = useSharedValue(0);
  const tileOpacity      = useSharedValue(1);
  const borderOpacityVal = useSharedValue(0.12);
  const isCorrectSV      = useSharedValue(0); // 1 when locked correct

  // ── RN Animated: height/margin collapse (non-native) ──────────
  const outerHeightAnim    = useRef(new RNAnimated.Value(Math.max(tileHeight, 58))).current;
  const outerMarginTopAnim = useRef(new RNAnimated.Value(TILE_GAP)).current;

  // ── RN Animated: bg color (non-native) ───────────────────────
  // 0 = #1E1C4A (default), 0.5 = #2d6e3a (correct flash), 1.0 = #1a3520 (locked)
  const bgAnim = useRef(new RNAnimated.Value(0)).current;
  const bgColor = bgAnim.interpolate({
    inputRange:  [0,         0.5,       1.0      ],
    outputRange: ['#1E1C4A', '#2d6e3a', '#1a3520'],
  });

  // ── RN Animated: entry (native driver) ────────────────────────
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const entryTransY  = useRef(new RNAnimated.Value(30)).current;
  const entryScaleY  = useRef(new RNAnimated.Value(0.85)).current;

  // ── RN Animated: era badge (native driver) ────────────────────
  const eraBadgeTransY  = useRef(new RNAnimated.Value(20)).current;
  const eraBadgeOpacity = useRef(new RNAnimated.Value(0)).current;

  // ── Refs ──────────────────────────────────────────────────────
  const judgedRef             = useRef(false);
  const swipeDirRef           = useRef<'up' | 'right' | null>(null);
  const hasThresholdFiredRef  = useRef(false);
  const tileLayoutRef         = useRef({ width: 300, height: tileHeight });
  const onSwipeUpRef          = useRef(onSwipeUp);
  const onSwipeDownRef        = useRef(onSwipeDown);
  const hapticCorrectRef      = useRef(hapticCorrect);
  const onEffectRef           = useRef(onEffect);
  const outerRef              = useRef<any>(null);
  const absorbRafRef          = useRef<number | null>(null);

  useEffect(() => { onSwipeUpRef.current    = onSwipeUp;    }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current  = onSwipeDown;  }, [onSwipeDown]);
  useEffect(() => { hapticCorrectRef.current = hapticCorrect; }, [hapticCorrect]);
  useEffect(() => { onEffectRef.current      = onEffect;      }, [onEffect]);

  // ── Entry animation ───────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.spring(entryTransY,  { toValue: 0, tension: 180, friction: 12, useNativeDriver: true }),
        RNAnimated.spring(entryScaleY,  { toValue: 1, tension: 180, friction: 12, useNativeDriver: true }),
        RNAnimated.timing(entryOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }, entryDelay);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Outer height sync on tileHeight prop change ───────────────
  useEffect(() => {
    if (!judgedRef.current) {
      outerHeightAnim.setValue(Math.max(tileHeight, 58));
    }
  }, [tileHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── State-driven animations ───────────────────────────────────
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // ── CORRECT — magnetic absorb physics ────────────────────
    if (s === 'correct') {
      if (hapticCorrectRef.current) {
        hapticCorrectRef.current();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      playCorrectSwipe();
      RNAnimated.timing(bgAnim, { toValue: 0.5, duration: 80, useNativeDriver: false }).start();

      outerRef.current?.measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
        const screenWidth = Dimensions.get('window').width;
        const targetX  = screenWidth / 2;
        const targetY  = wordY;

        let px = pageX + w / 2;
        let py = pageY + h / 2;
        const origCX   = px;
        const origCY   = py;
        let vX         = 0;
        let vY         = -800;
        const startDist = Math.hypot(targetX - px, targetY - py) || 1;
        let elapsed    = 0;
        let bumped     = false;
        let lastTime: number | null = null;

        function tick(now: number) {
          if (lastTime === null) { lastTime = now; }
          const dt = Math.min((now - lastTime) / 1000, 0.04);
          lastTime = now;
          elapsed += dt;

          const k = 34 + 340 * elapsed;
          vX += (targetX - px) * k * dt;
          vY += (targetY - py) * k * dt;
          const damp = Math.pow(0.82, dt * 60);
          vX *= damp;
          vY *= damp;
          px += vX * dt;
          py += vY * dt;
          if (py < targetY) { py = targetY; vY = 0; }

          const dist   = Math.hypot(targetX - px, targetY - py);
          const closed = Math.max(0, Math.min(1, 1 - dist / startDist));

          translateX.value  = px - origCX;
          translateY.value  = py - origCY;
          scale.value       = Math.max(0.1, Math.min(1.12, 1.06 - closed * 0.95));
          tileOpacity.value = dist < startDist * 0.14
            ? Math.max(0, Math.min(1, dist / (startDist * 0.14)))
            : 1;

          if (!bumped && closed > 0.72) {
            bumped = true;
            onEffectRef.current?.('trail', px, py);
          }

          if (dist < 14 || elapsed > 1.4) {
            absorbRafRef.current = null;
            tileOpacity.value = 0;
            RNAnimated.parallel([
              RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
              RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
            ]).start();
            return;
          }

          absorbRafRef.current = requestAnimationFrame(tick);
        }

        absorbRafRef.current = requestAnimationFrame(tick);
      });
    }

    // ── WRONG — tile exits, never returns ────────────────────
    if (s === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playWrongBuzz();
      setFlashRed(true);

      if (mask.isReal) {
        // Real meaning swiped right (wrong) → fly off right
        translateX.value  = withTiming( 500, { duration: 260, easing: ReaEasing.in(ReaEasing.ease) });
      } else {
        // Trap swiped up (wrong) → fly off top
        translateY.value  = withTiming(-500, { duration: 260, easing: ReaEasing.in(ReaEasing.ease) });
      }
      tileOpacity.value = withTiming(0, { duration: 260, easing: ReaEasing.in(ReaEasing.ease) });

      timers.push(setTimeout(() => {
        RNAnimated.parallel([
          RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
      }, 300));
    }

    // ── TRAP-CAUGHT — slide right + shards ───────────────────
    if (s === 'trap-caught') {
      playShatter();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Measure tile for shard effect in overlay
      outerRef.current?.measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
        onEffectRef.current?.('shard', pageX + w / 2, pageY + h / 2);
      });

      // Tile slides right and fades (ease-in 260ms)
      translateX.value  = withTiming(400, { duration: 260, easing: ReaEasing.in(ReaEasing.ease) });
      tileOpacity.value = withTiming(0,   { duration: 260, easing: ReaEasing.in(ReaEasing.ease) });

      // Collapse height after tile is gone
      timers.push(setTimeout(() => {
        RNAnimated.parallel([
          RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
      }, 300));
    }

    // ── REVEALED — full reset ────────────────────────────────
    if (s === 'revealed') {
      judgedRef.current      = false;
      swipeDirRef.current    = null;
      translateX.value       = 0;
      translateY.value       = 0;
      tileOpacity.value      = 1;
      scale.value            = 1;
      rotation.value         = 0;
      borderOpacityVal.value = 0.12;
      isCorrectSV.value      = 0;
      bgAnim.setValue(0);
      outerHeightAnim.setValue(Math.max(tileHeight, 58));
      outerMarginTopAnim.setValue(TILE_GAP);
      setFlashRed(false);
    }

    return () => {
      timers.forEach(clearTimeout);
      if (absorbRafRef.current !== null) {
        cancelAnimationFrame(absorbRafRef.current);
        absorbRafRef.current = null;
      }
    };
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  const tileAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale:      scale.value      },
      { rotate:     `${rotation.value}deg` },
    ],
    opacity:     tileOpacity.value,
    borderColor: isCorrectSV.value === 1
      ? '#4CAF50'
      : isSpecialSplit
        ? '#FFD700'
        : `rgba(255,255,255,${borderOpacityVal.value})`,
  }));

  // ── PanResponder ──────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !judgedRef.current,
      onStartShouldSetPanResponderCapture: () => !judgedRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 4 || Math.abs(g.dx) > 4),
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        if (judgedRef.current) return;
        scale.value            = withSpring(1.06, { damping: 10, stiffness: 500 });
        borderOpacityVal.value = withTiming(0.40, { duration: 60 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, 40);
        setTimeout(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, 85);
        hasThresholdFiredRef.current = false;
      },

      onPanResponderMove: (_, g) => {
        if (judgedRef.current) return;
        translateX.value = g.dx;
        translateY.value = g.dy;

        const domRight  = Math.abs(g.dx) > Math.abs(g.dy) && g.dx > 0;
        const domUp     = g.dy < 0 && Math.abs(g.dy) >= Math.abs(g.dx);
        const targetRot = domRight ? 4 : domUp ? -2 : 0;
        rotation.value  = withSpring(targetRot, { damping: 20, stiffness: 300 });

        const speed = Math.sqrt(g.vx * g.vx + g.vy * g.vy) * 1000;
        scale.value = withSpring(speed > 300 ? 1.07 : 1.04, { damping: 12, stiffness: 400 });

        const mainAxis = Math.max(g.dx > 0 ? g.dx : 0, -g.dy > 0 ? -g.dy : 0);
        if (mainAxis > SWIPE_THRESHOLD * 0.6 && !hasThresholdFiredRef.current) {
          hasThresholdFiredRef.current = true;
          Haptics.selectionAsync();
        }
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSwipeDownRef.current();

        } else {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
          borderOpacityVal.value = withTiming(0.12, { duration: 150 });
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
          borderOpacityVal.value = withTiming(0.12, { duration: 150 });
        }
      },
    })
  ).current;

  // ── Hidden state ──────────────────────────────────────────────
  if (s === 'hidden') {
    return (
      <RNAnimated.View
        style={{
          overflow: 'visible',
          opacity: entryOpacity,
          transform: [{ translateY: entryTransY }, { scaleY: entryScaleY }],
        }}
      >
        <RNAnimated.View style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim }}>
          <Pressable
            onPress={revealable ? onSwipeReveal : undefined}
            style={styles.hiddenTile}
          >
            <FluentEmoji emoji="❓" size={32} />
            <Text style={styles.hiddenPhrase} numberOfLines={2}>
              Hidden meaning
            </Text>
          </Pressable>
        </RNAnimated.View>
      </RNAnimated.View>
    );
  }

  // ── Main tile ─────────────────────────────────────────────────
  return (
    <RNAnimated.View
      style={{
        overflow: 'visible',
        opacity: entryOpacity,
        transform: [{ translateY: entryTransY }, { scaleY: entryScaleY }],
      }}
    >
      <RNAnimated.View
        ref={outerRef}
        style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim, overflow: 'visible' }}
      >
        {/* Main animated tile — Reanimated for transforms/opacity (native) */}
        <Animated.View
          style={[styles.tile, tileAnimStyle]}
          onLayout={(e: LayoutChangeEvent) => {
            tileLayoutRef.current = {
              width:  e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            };
          }}
          {...panResponder.panHandlers}
        >
          {/* Non-native animated background */}
          <RNAnimated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]}
          />

          {/* Wrong flash */}
          {flashRed && (
            <View style={[StyleSheet.absoluteFill, styles.flashOverlay]} />
          )}

          {/* Checkmark — shown when locked correct */}
          {s === 'correct' && (
            <Text style={styles.checkmark}>✓</Text>
          )}

          {/* Phrase text */}
          <Text style={styles.phrase} numberOfLines={2}>
            {mask.phrase}
          </Text>

          {/* Era badge */}
          {eraBadge && (
            <RNAnimated.View
              pointerEvents="none"
              style={[
                styles.eraBadgeWrap,
                { opacity: eraBadgeOpacity, transform: [{ translateY: eraBadgeTransY }] },
              ]}
            >
              <Text style={styles.eraBadgeText}>{eraBadge}</Text>
            </RNAnimated.View>
          )}
        </Animated.View>
      </RNAnimated.View>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    minHeight: 58,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 0,
    borderWidth: 1,
    // borderColor driven by Reanimated (tileAnimStyle)
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 2 },
    shadowRadius:  4,
    shadowOpacity: 0.35,
    elevation: 3,
    overflow: 'hidden',
  },
  checkmark: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '800',
    marginRight: 10,
  },
  phrase: {
    fontSize: 16,
    fontFamily: FONTS.tileCopy,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    flexShrink: 1,
    textAlignVertical: 'center',
  },
  flashOverlay: {
    borderRadius: 12,
    zIndex: 10,
    backgroundColor: '#CC2200',
  },
  eraBadgeWrap: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  eraBadgeText: {
    fontSize: FONT_SIZES.ghostSubLabel,
    color: '#FFD700',
    fontFamily: FONTS.label,
  },
  hiddenTile: {
    backgroundColor: '#2A2060',
    borderRadius: 12,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hiddenPhrase: {
    fontSize: 16,
    fontFamily: FONTS.tileCopy,
    fontWeight: '800',
    color: '#FFD700',
    marginLeft: 12,
    flex: 1,
  },
});
