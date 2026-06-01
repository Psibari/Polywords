import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Mask } from '../game/types';
import { FluentEmoji } from './FluentEmoji';
import { playCorrectSwipe, playWrongBuzz, playShatter } from '../utils/SoundEngine';
import { FONTS, FONT_SIZES } from '../constants/fonts';

export type SwipeMaskState = 'idle' | 'correct' | 'trap-caught' | 'wrong' | 'hidden' | 'revealed';

const SWIPE_THRESHOLD = 40;
const TILE_GAP        = 10;

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
};

// Part D — 3 fragment configs (spec values)
const FRAG_CONFIGS = [
  { finalX: -60, finalY: -40, finalRot: -25, dur: 280 },
  { finalX:  50, finalY: -50, finalRot:  20, dur: 260 },
  { finalX: -20, finalY:  40, finalRot: -10, dur: 300 },
] as const;

// Gold steps for word absorption (Part C Phase 4) — exported for MaskBoard
export const GOLD_STEPS = [0, 0.25, 0.55, 0.80, 1.0] as const;

export function SwipeMask({
  mask,
  onSwipeUp,
  onSwipeDown,
  onSwipeReveal,
  state: s,
  revealable = false,
  tileHeight = 64,
  isSpecialSplit = false,
  entryDelay = 0,
  eraBadge,
  hapticCorrect,
}: Props) {

  // ── UI state ──────────────────────────────────────────────────
  const [showShatter, setShowShatter] = useState(false);
  const [purpleFlash, setPurpleFlash] = useState(false);
  const [flashRed,    setFlashRed]    = useState(false);

  // ── Reanimated shared values (native driver: transform/opacity) ─
  const translateX       = useSharedValue(0);
  const translateY       = useSharedValue(0);
  const scale            = useSharedValue(1);
  const rotation         = useSharedValue(0);
  const tileOpacity      = useSharedValue(1);
  const borderOpacityVal = useSharedValue(0.08);

  // ── RN Animated: height/margin collapse (non-native) ──────────
  const outerHeightAnim    = useRef(new RNAnimated.Value(Math.max(tileHeight, 58))).current;
  const outerMarginTopAnim = useRef(new RNAnimated.Value(TILE_GAP)).current;

  // ── RN Animated: entry (native driver) ────────────────────────
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const entryTransY  = useRef(new RNAnimated.Value(30)).current;
  const entryScaleY  = useRef(new RNAnimated.Value(0.85)).current;

  // ── RN Animated: era badge (native driver) ────────────────────
  const eraBadgeTransY  = useRef(new RNAnimated.Value(20)).current;
  const eraBadgeOpacity = useRef(new RNAnimated.Value(0)).current;

  // ── RN Animated: shatter fragments (native driver, Part D) ────
  const fragAnims = useRef(
    FRAG_CONFIGS.map(() => ({
      x:   new RNAnimated.Value(0),
      y:   new RNAnimated.Value(0),
      rot: new RNAnimated.Value(0),
      op:  new RNAnimated.Value(0),
    }))
  ).current;

  // ── Refs ──────────────────────────────────────────────────────
  const judgedRef             = useRef(false);
  const swipeDirRef           = useRef<'up' | 'right' | null>(null);
  const hasThresholdFiredRef  = useRef(false);
  const tileLayoutRef         = useRef({ width: 300, height: tileHeight });
  const onSwipeUpRef          = useRef(onSwipeUp);
  const onSwipeDownRef        = useRef(onSwipeDown);
  const hapticCorrectRef      = useRef(hapticCorrect);

  useEffect(() => { onSwipeUpRef.current    = onSwipeUp;    }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current  = onSwipeDown;  }, [onSwipeDown]);
  useEffect(() => { hapticCorrectRef.current = hapticCorrect; }, [hapticCorrect]);

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

    // ── CORRECT (swipe UP on real meaning) — Part C ────────────
    if (s === 'correct') {
      if (hapticCorrectRef.current) hapticCorrectRef.current();
      playCorrectSwipe();

      // Phase 2: launch toward word after resistance dip (60ms buffer)
      timers.push(setTimeout(() => {
        translateY.value = withSpring(-140, { damping: 10, stiffness: 180 });
        scale.value      = withTiming(0.4,   { duration: 250 });
        tileOpacity.value = withTiming(0,    { duration: 250 });
      }, 60));

      // Phase 5: absorption haptic (only for non-hapticCorrect tier)
      if (!hapticCorrectRef.current) {
        timers.push(setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 180));
      }

      // Era badge briefly slides up before tile vanishes
      if (eraBadge) {
        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(eraBadgeTransY,  { toValue: 0, duration: 200, useNativeDriver: true }),
            RNAnimated.timing(eraBadgeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          ]).start();
        }, 80));
      }

      // Collapse height after tile is gone
      timers.push(setTimeout(() => {
        RNAnimated.parallel([
          RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
      }, 260));
    }

    // ── WRONG (incorrect swipe in either direction) ────────────
    if (s === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playWrongBuzz();
      setFlashRed(true);
      timers.push(setTimeout(() => setFlashRed(false), 250));

      // Shake X sequence
      translateX.value = withSequence(
        withTiming( 14, { duration: 50 }),
        withTiming(-14, { duration: 55 }),
        withTiming(  9, { duration: 55 }),
        withTiming( -9, { duration: 55 }),
        withTiming(  0, { duration: 55 }),
      );

      // Fly off after shake completes (~270ms total, use 300ms buffer)
      timers.push(setTimeout(() => {
        if (swipeDirRef.current === 'right') {
          translateX.value = withTiming(600, {
            duration: 250,
            easing: ReaEasing.in(ReaEasing.quad),
          });
        } else {
          translateY.value = withTiming(-800, {
            duration: 250,
            easing: ReaEasing.in(ReaEasing.quad),
          });
        }
        tileOpacity.value = withTiming(0, { duration: 200 });
      }, 300));

      // Collapse height
      timers.push(setTimeout(() => {
        RNAnimated.parallel([
          RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
      }, 520));
    }

    // ── TRAP-CAUGHT (swipe RIGHT on fake meaning) — Part D ─────
    if (s === 'trap-caught') {
      playShatter();

      // Phase 1: accelerate off screen right
      translateX.value  = withSpring(500, { damping: 6, stiffness: 400 });
      tileOpacity.value = withTiming(0, { duration: 200 });

      // Phase 4 + 3: impact at ~150ms → haptic + purple flash + fragments
      timers.push(setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setPurpleFlash(true);
        timers.push(setTimeout(() => setPurpleFlash(false), 60));
        setShowShatter(true);
      }, 150));

      // Collapse height after shatter
      timers.push(setTimeout(() => {
        RNAnimated.parallel([
          RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
      }, 520));
    }

    // ── REVEALED (reset — used for ghost tile re-entry) ────────
    if (s === 'revealed') {
      judgedRef.current   = false;
      swipeDirRef.current = null;
      translateX.value    = 0;
      translateY.value    = 0;
      tileOpacity.value   = 1;
      scale.value         = 1;
      rotation.value      = 0;
      borderOpacityVal.value = 0.08;
      outerHeightAnim.setValue(Math.max(tileHeight, 58));
      outerMarginTopAnim.setValue(TILE_GAP);
      setShowShatter(false);
      setPurpleFlash(false);
      setFlashRed(false);
    }

    return () => timers.forEach(clearTimeout);
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shatter fragment animations (Part D Phase 3) ──────────────
  useEffect(() => {
    if (!showShatter) return;

    fragAnims.forEach((fa, i) => {
      fa.x.setValue(0);
      fa.y.setValue(0);
      fa.rot.setValue(0);
      fa.op.setValue(1);
      RNAnimated.parallel([
        RNAnimated.timing(fa.x,  { toValue: FRAG_CONFIGS[i].finalX, duration: FRAG_CONFIGS[i].dur, useNativeDriver: true }),
        RNAnimated.timing(fa.y,  { toValue: FRAG_CONFIGS[i].finalY, duration: FRAG_CONFIGS[i].dur, useNativeDriver: true }),
        RNAnimated.timing(fa.rot, { toValue: 1,                     duration: FRAG_CONFIGS[i].dur, useNativeDriver: true }),
        RNAnimated.timing(fa.op,  { toValue: 0,                     duration: FRAG_CONFIGS[i].dur, useNativeDriver: true }),
      ]).start();
    });

    const tid = setTimeout(() => setShowShatter(false), 320);
    return () => clearTimeout(tid);
  }, [showShatter]); // eslint-disable-line react-hooks/exhaustive-deps

  const tileAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale:      scale.value      },
      { rotate:     `${rotation.value}deg` },
    ],
    opacity:     tileOpacity.value,
    borderColor: isSpecialSplit ? '#FFD700' : `rgba(255,255,255,${borderOpacityVal.value})`,
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

      // Part B — Finger down: scale lift + border glow + shadow deepen
      onPanResponderGrant: () => {
        if (judgedRef.current) return;
        scale.value            = withSpring(1.04, { damping: 12, stiffness: 400 });
        borderOpacityVal.value = withTiming(0.40, { duration: 60 });
        Haptics.selectionAsync(); // JS thread — equivalent to runOnJS
        hasThresholdFiredRef.current = false;
      },

      // Part B — Finger moving: track + rotation + scale breathing + threshold haptic
      onPanResponderMove: (_, g) => {
        if (judgedRef.current) return;
        translateX.value = g.dx;
        translateY.value = g.dy;

        // Rotation follows dominant drag direction
        const domRight = Math.abs(g.dx) > Math.abs(g.dy) && g.dx > 0;
        const domUp    = g.dy < 0 && Math.abs(g.dy) >= Math.abs(g.dx);
        const targetRot = domRight ? 4 : domUp ? -2 : 0;
        rotation.value = withSpring(targetRot, { damping: 20, stiffness: 300 });

        // Scale breathes with velocity (vx/vy are px/ms; ×1000 → px/s estimate)
        const speed = Math.sqrt(g.vx * g.vx + g.vy * g.vy) * 1000;
        scale.value = withSpring(speed > 300 ? 1.07 : 1.04, { damping: 12, stiffness: 400 });

        // Threshold haptic — fires once at 60% of SWIPE_THRESHOLD in dominant axis
        const mainAxis = Math.max(g.dx > 0 ? g.dx : 0, -g.dy > 0 ? -g.dy : 0);
        if (mainAxis > SWIPE_THRESHOLD * 0.6 && !hasThresholdFiredRef.current) {
          hasThresholdFiredRef.current = true;
          Haptics.selectionAsync();
        }
      },

      onPanResponderRelease: (_, g) => {
        if (judgedRef.current) return;

        // Swipe UP — claim mask (Part C)
        if (g.dy < -SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'up';
          // Phase 1: resistance dip
          scale.value = withSequence(
            withTiming(0.96, { duration: 40 }),
            withSpring(1.04, { damping: 6, stiffness: 400 }),
          );
          // Lift-off haptic (or hapticCorrect override)
          if (hapticCorrectRef.current) {
            hapticCorrectRef.current();
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          onSwipeUpRef.current();

        // Swipe RIGHT — call trap (Part D)
        } else if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'right';
          // Full swipe extension haptic
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSwipeDownRef.current();

        // Spring home — Part B return to origin
        } else {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
          borderOpacityVal.value = withTiming(0.08, { duration: 150 });
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
          borderOpacityVal.value = withTiming(0.08, { duration: 150 });
        }
      },
    })
  ).current;

  // ── Hidden state (HIDDEN MEANING placeholder tile) ─────────────
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
            style={[styles.hiddenTile]}
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

  // ── Fragment spawn position (centered on tile) ────────────────
  const fragLeft = tileLayoutRef.current.width * 0.5 - 20;
  const fragTop  = Math.max(tileHeight, 58) * 0.5 - 8;

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
        style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim, overflow: 'visible' }}
      >
        {/* Part D — shatter fragments (appear after tile flies right) */}
        {showShatter && FRAG_CONFIGS.map((cfg, i) => (
          <RNAnimated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              zIndex: 50,
              left: fragLeft,
              top:  fragTop,
              width: 40,
              height: 16,
              borderRadius: 4,
              backgroundColor: '#2D2B6E',
              opacity: fragAnims[i].op,
              transform: [
                { translateX: fragAnims[i].x },
                { translateY: fragAnims[i].y },
                {
                  rotate: fragAnims[i].rot.interpolate({
                    inputRange:  [0, 1],
                    outputRange: ['0deg', `${cfg.finalRot}deg`],
                  }),
                },
              ],
            }}
          />
        ))}

        {/* Main animated tile (Reanimated — native driver for transforms/opacity) */}
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
          {/* Part A — gradient background */}
          <LinearGradient
            colors={['#2D2B6E', '#252350']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Part D Phase 2 — purple flash at impact */}
          {purpleFlash && (
            <View style={[StyleSheet.absoluteFill, styles.flashOverlay, { backgroundColor: '#7B2D8B' }]} />
          )}

          {/* Wrong flash */}
          {flashRed && (
            <View style={[StyleSheet.absoluteFill, styles.flashOverlay, { backgroundColor: '#CC2200' }]} />
          )}

          {/* Part A — text only, no emoji */}
          <Text style={styles.phrase} numberOfLines={2}>
            {mask.phrase}
          </Text>

          {/* Era badge (SlangDrop) */}
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
  // ── Main mask/trap tile ───────────────────────────────────────
  tile: {
    borderRadius: 16,
    minHeight: 58,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 0,
    borderWidth: 1,
    // borderColor driven by Reanimated (tileAnimStyle)
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 3 },
    shadowRadius:  6,
    shadowOpacity: 0.4,
    elevation: 4,
    overflow: 'hidden',
  },
  phrase: {
    fontSize: FONT_SIZES.tileCopy,
    fontFamily: FONTS.tileCopy,
    color: '#FFFFFF',
    flex: 1,
    flexShrink: 1,
    textAlignVertical: 'center',
  },
  flashOverlay: {
    borderRadius: 16,
    zIndex: 10,
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
  // ── Hidden-state tile ─────────────────────────────────────────
  hiddenTile: {
    backgroundColor: '#2A2060',
    borderRadius: 16,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hiddenPhrase: {
    fontSize: FONT_SIZES.tileCopy,
    fontFamily: FONTS.tileCopy,
    color: '#FFD700',
    marginLeft: 12,
    flex: 1,
  },
});
