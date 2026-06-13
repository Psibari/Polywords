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
  onSwipeStart?: () => void;
  onPressHoldStart?: () => void;
  disabled?: boolean;
  wordY?: number;
  splitBorderColor?: string;
  splitTextColor?: string;
  splitBackgroundColor?: string;
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
  onSwipeStart,
  onPressHoldStart,
  disabled = false,
  wordY = 180,
  splitBorderColor = '#FFD700',
  splitTextColor = '#FFFFFF',
  splitBackgroundColor,
}: Props) {

  // ── UI state ──────────────────────────────────────────────────
  const [flashRed, setFlashRed] = useState(false);

  // ── Reanimated shared values (native driver: transform/opacity) ─
  const translateX       = useSharedValue(0);
  const translateY       = useSharedValue(0);
  const scale            = useSharedValue(1);
  const rotation         = useSharedValue(0);
  const grabLift         = useSharedValue(0);
  const tileOpacity      = useSharedValue(1);
  const borderOpacityVal = useSharedValue(0.18);
  const isCorrectSV      = useSharedValue(0); // 1 when locked correct

  // ── RN Animated: height/margin collapse (non-native) ──────────
  const outerHeightAnim    = useRef(new RNAnimated.Value(Math.max(tileHeight, 58))).current;
  const outerMarginTopAnim = useRef(new RNAnimated.Value(TILE_GAP)).current;

  // ── RN Animated: bg color (non-native) ───────────────────────
  // 0 = dark glass, 0.5 = resolved pulse, 1.0 = locked dark
  const bgAnim = useRef(new RNAnimated.Value(0)).current;
  const bgColor = bgAnim.interpolate({
    inputRange:  [0,         0.5,       1.0      ],
    outputRange: ['#19143F', '#27205D', '#171833'],
  });

  // ── RN Animated: entry (native driver) ────────────────────────
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const entryTransY  = useRef(new RNAnimated.Value(30)).current;
  const entryScaleY  = useRef(new RNAnimated.Value(0.85)).current;

  // ── RN Animated: era badge (native driver) ────────────────────
  const eraBadgeTransY  = useRef(new RNAnimated.Value(20)).current;
  const eraBadgeOpacity = useRef(new RNAnimated.Value(0)).current;

  // ── Refs ──────────────────────────────────────────────────────
  const judgedRef                = useRef(false);
  const swipeDirRef              = useRef<'up' | 'right' | null>(null);
  const hasThresholdFiredRef     = useRef(false);
  const tileLayoutRef            = useRef({ width: 300, height: tileHeight });
  const onSwipeUpRef             = useRef(onSwipeUp);
  const onSwipeDownRef           = useRef(onSwipeDown);
  const hapticCorrectRef         = useRef(hapticCorrect);
  const onEffectRef              = useRef(onEffect);
  const onSwipeStartRef          = useRef(onSwipeStart);
  const onPressHoldStartRef      = useRef(onPressHoldStart);
  const disabledRef              = useRef(disabled);
  const outerRef                 = useRef<any>(null);
  const absorbRafRef             = useRef<number | null>(null);
  const lastGestureVelocityRef   = useRef({ vx: 0, vy: 0 });

  useEffect(() => { onSwipeUpRef.current    = onSwipeUp;    }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current  = onSwipeDown;  }, [onSwipeDown]);
  useEffect(() => { hapticCorrectRef.current = hapticCorrect; }, [hapticCorrect]);
  useEffect(() => { onEffectRef.current      = onEffect;      }, [onEffect]);
  useEffect(() => { onSwipeStartRef.current = onSwipeStart; }, [onSwipeStart]);
  useEffect(() => { onPressHoldStartRef.current = onPressHoldStart; }, [onPressHoldStart]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  // ── Cleanup rAF on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (absorbRafRef.current !== null) {
        cancelAnimationFrame(absorbRafRef.current);
        absorbRafRef.current = null;
      }
    };
  }, []);

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
      grabLift.value = withTiming(0, { duration: 120 });
      if (hapticCorrectRef.current) {
        hapticCorrectRef.current();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      playCorrectSwipe();
      RNAnimated.timing(bgAnim, { toValue: 0.5, duration: 80, useNativeDriver: false }).start();

      const currentOffsetX = translateX.value;
      const currentOffsetY = translateY.value;

      outerRef.current?.measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
        const screenWidth = Dimensions.get('window').width;
        const targetX  = screenWidth / 2;
        const targetY  = wordY;

        const origCX = pageX + w / 2;
        const origCY = pageY + h / 2;
        let px = origCX + currentOffsetX;
        let py = origCY + currentOffsetY;
        let vX = Math.max(-1500, Math.min(1500,  lastGestureVelocityRef.current.vx * 1000));
        let vY = Math.max(-3200, Math.min(-420,  lastGestureVelocityRef.current.vy * 1000));
        const startDist = Math.hypot(targetX - px, targetY - py) || 1;
        let elapsed    = 0;
        let bumped     = false;
        let lastTime: number | null = null;

        function tick(now: number) {
          if (lastTime === null) { lastTime = now; }
          const dt = Math.min((now - lastTime) / 1000, 0.04);
          lastTime = now;
          elapsed += dt;

          const k = 44 + 390 * elapsed;
          vX += (targetX - px) * k * dt;
          vY += (targetY - py) * k * dt;
          const damp = Math.pow(0.84, dt * 60);
          vX *= damp;
          vY *= damp;
          px += vX * dt;
          py += vY * dt;
          if (py < targetY) { py = targetY; vY = 0; }

          const dist   = Math.hypot(targetX - px, targetY - py);
          const closed = Math.max(0, Math.min(1, 1 - dist / startDist));

          translateX.value  = px - origCX;
          translateY.value  = py - origCY;
          scale.value       = Math.max(0.08, Math.min(1.08, 1.04 - closed * 0.96));
          tileOpacity.value = dist < startDist * 0.20
            ? Math.max(0, Math.min(1, dist / (startDist * 0.20)))
            : 1;

          if (!bumped && closed > 0.72) {
            bumped = true;
            onEffectRef.current?.('trail', px, py);
          }

          if (dist < 12 || elapsed > 1.15) {
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

    // ── WRONG — failed move, then tile exits ─────────────────
    if (s === 'wrong') {
      grabLift.value = withTiming(0, { duration: 120 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playWrongBuzz();
      setFlashRed(true);

      if (mask.isReal) {
        // Real meaning swiped right: visibly reject instead of looking successful.
        translateX.value = withSequence(
          withTiming(92, { duration: 90, easing: ReaEasing.out(ReaEasing.ease) }),
          withSpring(0, { damping: 9, stiffness: 260 })
        );
        translateY.value = withSequence(
          withTiming(8, { duration: 90, easing: ReaEasing.out(ReaEasing.ease) }),
          withSpring(0, { damping: 10, stiffness: 260 })
        );
        rotation.value = withSequence(
          withTiming(7, { duration: 85, easing: ReaEasing.out(ReaEasing.ease) }),
          withTiming(-5, { duration: 110, easing: ReaEasing.inOut(ReaEasing.ease) }),
          withSpring(0, { damping: 10, stiffness: 260 })
        );
        scale.value = withSequence(
          withTiming(0.98, { duration: 90, easing: ReaEasing.out(ReaEasing.ease) }),
          withTiming(1.02, { duration: 110, easing: ReaEasing.inOut(ReaEasing.ease) }),
          withTiming(0.94, { duration: 160, easing: ReaEasing.in(ReaEasing.ease) })
        );
        borderOpacityVal.value = withSequence(
          withTiming(0.65, { duration: 80 }),
          withTiming(0.24, { duration: 260 })
        );
        timers.push(setTimeout(() => {
          tileOpacity.value = withTiming(0, { duration: 180, easing: ReaEasing.in(ReaEasing.ease) });
        }, 380));
        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
            RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start();
        }, 560));
      } else {
        // Trap swiped up (wrong) -> keep existing wrong behavior.
        translateY.value  = withTiming(-500, { duration: 260, easing: ReaEasing.in(ReaEasing.ease) });
        tileOpacity.value = withTiming(0, { duration: 260, easing: ReaEasing.in(ReaEasing.ease) });

        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
            RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start();
        }, 300));
      }
    }

    // ── TRAP-CAUGHT — hard right toss + shards ───────────────
    if (s === 'trap-caught') {
      grabLift.value = withTiming(0, { duration: 120 });
      playShatter();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      outerRef.current?.measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
        onEffectRef.current?.('shard', pageX + w + 88, pageY + h / 2 - 6);
      });

      const shatterLaneX = Dimensions.get('window').width + 180;
      translateX.value  = withTiming(shatterLaneX, { duration: 340, easing: ReaEasing.in(ReaEasing.ease) });
      translateY.value  = withTiming(-16,          { duration: 300, easing: ReaEasing.out(ReaEasing.ease) });
      rotation.value    = withTiming(26,           { duration: 340, easing: ReaEasing.in(ReaEasing.ease) });
      scale.value       = withTiming(0.76,         { duration: 320, easing: ReaEasing.in(ReaEasing.ease) });
      tileOpacity.value = withTiming(0,            { duration: 320, easing: ReaEasing.in(ReaEasing.ease) });

      timers.push(setTimeout(() => {
        RNAnimated.parallel([
          RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
      }, 380));
    }

    // ── REVEALED — full reset ────────────────────────────────
    if (s === 'revealed') {
      judgedRef.current      = false;
      swipeDirRef.current    = null;
      translateX.value       = 0;
      translateY.value       = 0;
      tileOpacity.value      = 1;
      scale.value            = 1;
      grabLift.value         = 0;
      rotation.value         = 0;
      borderOpacityVal.value = 0.18;
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
      { translateY: translateY.value + grabLift.value },
      { scale:      scale.value      },
      { rotate:     `${rotation.value}deg` },
    ],
    opacity:     tileOpacity.value,
    borderColor: isCorrectSV.value === 1
      ? 'rgba(255,255,255,0.5)'
      : isSpecialSplit
        ? splitBorderColor
        : `rgba(255,255,255,${borderOpacityVal.value})`,
  }));

  // ── PanResponder ──────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !disabledRef.current && !judgedRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current && !judgedRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !disabledRef.current && !judgedRef.current && (Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !disabledRef.current && !judgedRef.current && (Math.abs(g.dy) > 4 || Math.abs(g.dx) > 4),
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        if (disabledRef.current || judgedRef.current) return;
        grabLift.value         = withSpring(-8, { damping: 18, stiffness: 360 });
        scale.value            = withSpring(1.026, { damping: 18, stiffness: 360 });
        borderOpacityVal.value = withTiming(0.56, { duration: 100 });
        onPressHoldStartRef.current?.();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        hasThresholdFiredRef.current = false;
      },

      onPanResponderMove: (_, g) => {
        if (disabledRef.current || judgedRef.current) return;
        lastGestureVelocityRef.current = { vx: g.vx, vy: g.vy };
        translateX.value = g.dx;
        translateY.value = g.dy;

        const domRight  = Math.abs(g.dx) > Math.abs(g.dy) && g.dx > 0;
        const domUp     = g.dy < 0 && Math.abs(g.dy) >= Math.abs(g.dx);
        const targetRot = domRight ? 3 : domUp ? -1.5 : 0;
        rotation.value  = withSpring(targetRot, { damping: 20, stiffness: 300 });

        const speed = Math.sqrt(g.vx * g.vx + g.vy * g.vy) * 1000;
        scale.value = withSpring(speed > 300 ? 1.038 : 1.026, { damping: 18, stiffness: 340 });

        const mainAxis = Math.max(g.dx > 0 ? g.dx : 0, -g.dy > 0 ? -g.dy : 0);
        if (mainAxis > SWIPE_THRESHOLD * 0.6 && !hasThresholdFiredRef.current) {
          hasThresholdFiredRef.current = true;
          onSwipeStartRef.current?.();
          Haptics.selectionAsync();
        }
      },

      onPanResponderRelease: (_, g) => {
        if (disabledRef.current || judgedRef.current) return;

        if (g.dy < -SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'up';
          grabLift.value      = withTiming(0, { duration: 80 });
          onSwipeUpRef.current();

        } else if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'right';
          grabLift.value      = withTiming(0, { duration: 80 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSwipeDownRef.current();

        } else {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          grabLift.value         = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
          borderOpacityVal.value = withTiming(0.18, { duration: 150 });
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          grabLift.value         = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
          borderOpacityVal.value = withTiming(0.18, { duration: 150 });
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
          style={[isSpecialSplit ? styles.splitTile : styles.tile, tileAnimStyle]}
          onLayout={(e: LayoutChangeEvent) => {
            tileLayoutRef.current = {
              width:  e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            };
          }}
          {...panResponder.panHandlers}
        >
          {/* Top edge shine */}
          <View style={styles.tileTopShine} />
          {/* Inner ambient glow */}
          <View style={styles.tileInnerGlow} />
          <View style={styles.tileBottomBevel} />
          {/* Non-native animated background */}
          <RNAnimated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isSpecialSplit && splitBackgroundColor ? splitBackgroundColor : bgColor },
            ]}
          />

          {/* Wrong flash */}
          {flashRed && (
            <View style={[StyleSheet.absoluteFill, styles.flashOverlay]} />
          )}

          {/* Checkmark — shown when locked correct */}
          {s === 'correct' && (
            <Text style={isSpecialSplit ? styles.splitCheckmark : styles.checkmark}>✓</Text>
          )}

          {/* Phrase text */}
          <View style={isSpecialSplit ? styles.splitPhrasePanel : styles.phrasePanel} pointerEvents="none">
            <Text
              style={[
                isSpecialSplit ? styles.splitPhrase : styles.phrase,
                isSpecialSplit && { color: splitTextColor },
              ]}
              numberOfLines={2}
            >
              {mask.phrase}
            </Text>
          </View>

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
    borderRadius: 28,
    minHeight: 122,
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    // borderColor driven by Reanimated (tileAnimStyle)
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 16 },
    shadowRadius:  34,
    shadowOpacity: 0.62,
    elevation: 14,
    overflow: 'hidden',
  },
  phrasePanel: {
    width: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(7,6,28,0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.48,
    overflow: 'visible',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 16,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
    zIndex: 3,
  },
  phrase: {
    fontSize: 28,
    fontFamily: FONTS.tileCopy,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 0,
    flexWrap: 'wrap',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  splitTile: {
    borderRadius: 14,
    minHeight: 58,
    height: '100%',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 0,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.35,
    elevation: 3,
    overflow: 'hidden',
  },
  splitPhrasePanel: {
    flex: 1,
    justifyContent: 'center',
  },
  splitPhrase: {
    fontSize: 16,
    fontFamily: FONTS.tileCopy,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    flexShrink: 1,
    textAlignVertical: 'center',
  },
  splitCheckmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    marginRight: 10,
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
    color: 'rgba(255,255,255,0.82)',
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
  tileTopShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 2,
    zIndex: 2,
  },
  tileInnerGlow: {
    position: 'absolute',
    bottom: -22,
    left: '10%',
    right: '10%',
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(123,45,139,0.20)',
    zIndex: 1,
  },
  tileBottomBevel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
    backgroundColor: 'rgba(5,4,18,0.42)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    zIndex: 2,
  },
});
