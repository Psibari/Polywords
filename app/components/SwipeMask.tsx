import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { heroBookMaterial } from '../ui/pwMaterials';
import { ShardVariant } from '../ui/pwEffects';
import { CLAIM_REJECT_ACTIONS, resolveTileAccessibilityAction } from './tileAccessibility';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import MaskCardArtwork from './ui/MaskCardArtwork';

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
  // Gauntlet card material — a page pulled from the book itself, not the
  // deck's plain gold→magenta bezel.
  bookMaterial?: boolean;
  gauntletCard?: boolean;
  entryDelay?: number;
  eraBadge?: string;
  hapticCorrect?: () => void;
  onEffect?: (type: 'shard' | 'trail', x: number, y: number, variant?: ShardVariant) => void;
  onSwipeStart?: () => void;
  onPressHoldStart?: () => void;
  onExitComplete?: () => void;
  onCardTouch?: () => void;
  disabled?: boolean;
  nearMastery?: boolean;
  wordY?: number;
  intakeY?: number;
  splitBorderColor?: string;
  splitTextColor?: string;
  splitBackgroundColor?: string;
};

// Gold steps for word absorption — exported for MaskBoard
export const GOLD_STEPS = [0, 0.25, 0.55, 0.80, 1.0] as const;

function tileGradient(
  state: SwipeMaskState,
  bookMaterial: boolean
): readonly [string, string] {
  if (state === 'correct')     return [PW.color.gold, PW.color.goldDark] as const;
  if (state === 'wrong')       return [PW.color.wrong, PW.color.bgDeep] as const;
  if (state === 'trap-caught') return [PW.color.rose, PW.color.purple] as const;
  if (bookMaterial) return [heroBookMaterial.goldTrim, heroBookMaterial.coverPurpleTop] as const;
  return [PW.color.surfaceRaised, PW.color.surfaceBase] as const;
}

export function SwipeMask({
  mask,
  onSwipeUp,
  onSwipeDown,
  onSwipeReveal,
  state: s,
  revealable = false,
  tileHeight = 58,
  isSpecialSplit = false,
  bookMaterial = false,
  gauntletCard = false,
  entryDelay = 0,
  eraBadge,
  hapticCorrect,
  onEffect,
  onSwipeStart,
  onPressHoldStart,
  onExitComplete,
  onCardTouch,
  disabled = false,
  nearMastery = false,
  wordY = 180,
  intakeY,
  splitBorderColor = '#FFD700',
  splitTextColor = '#FFFFFF',
  splitBackgroundColor,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = gauntletCard
    ? Math.min(screenWidth - 40, 300)
    : Math.min(screenWidth - 80, 290);
  const cardHeight = Math.min(
    Math.max(tileHeight, 96),
    gauntletCard ? 200 : bookMaterial ? 220 : 124,
  );
  const reduceMotion = useReducedMotionPreference();

  // ── UI state ──────────────────────────────────────────────────
  const [flashRed, setFlashRed] = useState(false);

  // ── Reanimated shared values (native driver: transform/opacity) ─
  const translateX       = useSharedValue(0);
  const translateY       = useSharedValue(0);
  const scale            = useSharedValue(1);
  const rotation         = useSharedValue(0);
  const grabLift         = useSharedValue(0);
  const tileOpacity      = useSharedValue(1);

  // ── RN Animated: height/margin collapse (non-native) ──────────
  const outerHeightAnim    = useRef(new RNAnimated.Value(Math.max(tileHeight, 58))).current;
  const outerMarginTopAnim = useRef(new RNAnimated.Value(TILE_GAP)).current;

  // ── RN Animated: entry (native driver) ────────────────────────
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const entryTransY  = useRef(new RNAnimated.Value(10)).current;
  const entryScale   = useRef(new RNAnimated.Value(0.95)).current;

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
  const onExitCompleteRef        = useRef(onExitComplete);
  const disabledRef              = useRef(disabled);
  const outerRef                 = useRef<any>(null);
  const absorbRafRef             = useRef<number | null>(null);
  const lastGestureVelocityRef   = useRef({ vx: 0, vy: 0 });
  const exitCompleteFiredRef     = useRef(false);

  useEffect(() => { onSwipeUpRef.current    = onSwipeUp;    }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current  = onSwipeDown;  }, [onSwipeDown]);
  useEffect(() => { hapticCorrectRef.current = hapticCorrect; }, [hapticCorrect]);
  useEffect(() => { onEffectRef.current      = onEffect;      }, [onEffect]);
  useEffect(() => { onSwipeStartRef.current = onSwipeStart; }, [onSwipeStart]);
  useEffect(() => { onPressHoldStartRef.current = onPressHoldStart; }, [onPressHoldStart]);
  useEffect(() => { onExitCompleteRef.current = onExitComplete; }, [onExitComplete]);
  const onCardTouchRef = useRef(onCardTouch);
  useEffect(() => { onCardTouchRef.current = onCardTouch; }, [onCardTouch]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  function fireExitCompleteOnce() {
    if (exitCompleteFiredRef.current) return;
    exitCompleteFiredRef.current = true;
    onExitCompleteRef.current?.();
  }

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
        RNAnimated.spring(entryTransY,  { toValue: 0, tension: 230, friction: 15, useNativeDriver: true }),
        RNAnimated.spring(entryScale,   { toValue: 1, tension: 260, friction: 14, useNativeDriver: true }),
        RNAnimated.timing(entryOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
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
      exitCompleteFiredRef.current = false;
      grabLift.value = withTiming(0, { duration: 120 });
      if (hapticCorrectRef.current) {
        hapticCorrectRef.current();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (reduceMotion) {
        // Reduce Motion: skip the magnetic-flight physics (a screen-spanning
        // per-frame travel toward the book) for a simple in-place fade.
        // onCardTouch still fires at a sensible "arrival" moment so the
        // book-open timing sync it drives isn't affected by skipping the
        // physics that normally cue it.
        timers.push(setTimeout(() => {
          onCardTouchRef.current?.();
          tileOpacity.value = withTiming(0, { duration: 200, easing: ReaEasing.out(ReaEasing.ease) });
        }, 120));

        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
            RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start(({ finished }) => {
            if (finished) fireExitCompleteOnce();
          });
        }, 340));

        timers.push(setTimeout(fireExitCompleteOnce, 560));
        return () => {
          timers.forEach(clearTimeout);
          if (absorbRafRef.current !== null) {
            cancelAnimationFrame(absorbRafRef.current);
            absorbRafRef.current = null;
          }
        };
      }

      const currentOffsetX = translateX.value;
      const currentOffsetY = translateY.value;

      outerRef.current?.measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
        const screenWidth = Dimensions.get('window').width;
        const targetX  = screenWidth / 2;
        const targetY  = intakeY ?? wordY;

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
          scale.value       = closed < 0.8
            ? Math.max(0.55, Math.min(1.08, 1.04 - closed * 0.6125))
            : Math.max(0.05, 0.55 - ((closed - 0.8) / 0.2) * 0.5);
          tileOpacity.value = dist < startDist * 0.20
            ? Math.max(0, Math.min(1, dist / (startDist * 0.20)))
            : 1;

          if (!bumped && closed > 0.45) {
            bumped = true;
            onEffectRef.current?.('trail', px, py);
          }

          if (dist < 12 || elapsed > 1.15) {
            absorbRafRef.current = null;
            tileOpacity.value = 0;
            onCardTouchRef.current?.();
            RNAnimated.parallel([
              RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
              RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
            ]).start(({ finished }) => {
              if (finished) fireExitCompleteOnce();
            });
            return;
          }

          absorbRafRef.current = requestAnimationFrame(tick);
        }

        absorbRafRef.current = requestAnimationFrame(tick);
        timers.push(setTimeout(fireExitCompleteOnce, 1350));
      });
    }

    // ── WRONG — failed move, then tile exits ─────────────────
    if (s === 'wrong') {
      exitCompleteFiredRef.current = false;
      grabLift.value = withTiming(0, { duration: 120 });
      setFlashRed(true);
      timers.push(setTimeout(() => setFlashRed(false), 145));

      if (reduceMotion) {
        // Reduce Motion: no fling/rotate/fall — hold still so the caption
        // (rendered below) actually gets read, then a plain crossfade out.
        timers.push(setTimeout(() => {
          tileOpacity.value = withTiming(0, { duration: 220, easing: ReaEasing.in(ReaEasing.ease) });
        }, 900));
        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 180, useNativeDriver: false }),
            RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 180, useNativeDriver: false }),
          ]).start(({ finished }) => {
            if (finished) fireExitCompleteOnce();
          });
        }, 1120));
        timers.push(setTimeout(fireExitCompleteOnce, 1340));
      } else {
        const fallDistance = Dimensions.get('window').height + 180;

        // Both wrong directions fail the same way: false reject, buzz, then a shameful drop.
        translateX.value = withSequence(
          withTiming(56, { duration: 70, easing: ReaEasing.out(ReaEasing.ease) }),
          withTiming(26, { duration: 55, easing: ReaEasing.inOut(ReaEasing.ease) }),
          withTiming(40, { duration: 420, easing: ReaEasing.in(ReaEasing.quad) })
        );
        translateY.value = withSequence(
          withTiming(4, { duration: 70, easing: ReaEasing.out(ReaEasing.ease) }),
          withTiming(10, { duration: 55, easing: ReaEasing.inOut(ReaEasing.ease) }),
          withTiming(fallDistance, { duration: 420, easing: ReaEasing.in(ReaEasing.quad) })
        );
        rotation.value = withSequence(
          withTiming(5, { duration: 70, easing: ReaEasing.out(ReaEasing.ease) }),
          withTiming(-4, { duration: 55, easing: ReaEasing.inOut(ReaEasing.ease) }),
          withTiming(18, { duration: 420, easing: ReaEasing.in(ReaEasing.ease) })
        );
        scale.value = withSequence(
          withTiming(0.99, { duration: 70, easing: ReaEasing.out(ReaEasing.ease) }),
          withTiming(0.96, { duration: 55, easing: ReaEasing.inOut(ReaEasing.ease) }),
          withTiming(0.88, { duration: 420, easing: ReaEasing.in(ReaEasing.ease) })
        );

        timers.push(setTimeout(() => {
          tileOpacity.value = withTiming(0, {
            duration: 260,
            easing: ReaEasing.in(ReaEasing.ease),
          });
        }, 280));

        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 170, useNativeDriver: false }),
            RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 170, useNativeDriver: false }),
          ]).start(({ finished }) => {
            if (finished) fireExitCompleteOnce();
          });
        }, 560));

        timers.push(setTimeout(fireExitCompleteOnce, 780));
      }
    }

    // ── TRAP-CAUGHT — hard right toss + shards ───────────────
    if (s === 'trap-caught') {
      exitCompleteFiredRef.current = false;
      grabLift.value = withTiming(0, { duration: 120 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      if (reduceMotion) {
        // Reduce Motion: keep the shard burst (a fixed-position particle
        // effect elsewhere on screen, not this tile flinging/rotating) as
        // the outcome signal, but drop the tile's own toss physics for a
        // plain crossfade.
        outerRef.current?.measure((_x: number, _y: number, _w: number, h: number, _pageX: number, pageY: number) => {
          onEffectRef.current?.(
            'shard',
            Dimensions.get('window').width - 20,
            pageY + h / 2,
            'trap'
          );
        });
        tileOpacity.value = withTiming(0, { duration: 200, easing: ReaEasing.in(ReaEasing.ease) });

        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 180, useNativeDriver: false }),
            RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 180, useNativeDriver: false }),
          ]).start(({ finished }) => {
            if (finished) fireExitCompleteOnce();
          });
        }, 220));
      } else {
        outerRef.current?.measure((_x: number, _y: number, _w: number, h: number, _pageX: number, pageY: number) => {
          onEffectRef.current?.(
            'shard',
            Dimensions.get('window').width - 20,
            pageY + h / 2,
            'trap'
          );
        });

        const shatterLaneX = Dimensions.get('window').width + 180;
        translateX.value  = withTiming(shatterLaneX, { duration: 180, easing: ReaEasing.in(ReaEasing.ease) });
        translateY.value  = withTiming(-10,          { duration: 160, easing: ReaEasing.out(ReaEasing.ease) });
        rotation.value    = withTiming(18,           { duration: 180, easing: ReaEasing.in(ReaEasing.ease) });
        scale.value       = withTiming(0.9,          { duration: 160, easing: ReaEasing.in(ReaEasing.ease) });
        tileOpacity.value = withTiming(0,            { duration: 170, easing: ReaEasing.in(ReaEasing.ease) });

        timers.push(setTimeout(() => {
          RNAnimated.parallel([
            RNAnimated.timing(outerHeightAnim,    { toValue: 0, duration: 160, useNativeDriver: false }),
            RNAnimated.timing(outerMarginTopAnim, { toValue: 0, duration: 160, useNativeDriver: false }),
          ]).start(({ finished }) => {
            if (finished) fireExitCompleteOnce();
          });
        }, 200));
      }
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
      outerHeightAnim.setValue(Math.max(tileHeight, 58));
      outerMarginTopAnim.setValue(TILE_GAP);
      exitCompleteFiredRef.current = false;
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

  const tileAnimStyle = useAnimatedStyle(() => {
    const liftAmount = Math.max(0, Math.min(1, -grabLift.value / 10));
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + grabLift.value },
        { scale:      scale.value      },
        { rotate:     `${rotation.value}deg` },
      ],
      opacity: tileOpacity.value,
      ...(gauntletCard
        ? {
            shadowColor: '#FF3FA0',
            shadowOpacity: 0.25 + (liftAmount * 0.55),
            shadowRadius: 10 + (liftAmount * 26),
            elevation: 10 + (liftAmount * 14),
          }
        : !isSpecialSplit && !bookMaterial
        ? {
            shadowOpacity: 0.36 + (liftAmount * 0.10),
            shadowRadius: 18 + (liftAmount * 6),
            elevation: 10 + (liftAmount * 6),
          }
        : {}),
    };
  });

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
        hasThresholdFiredRef.current = false;
        grabLift.value         = withSpring(-10, { damping: 16, stiffness: 420 });
        scale.value            = withSpring(1.04, { damping: 16, stiffness: 420 });
        onPressHoldStartRef.current?.();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          Haptics.impactAsync(
            nearMastery
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light
          );
          onSwipeDownRef.current();

        } else {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          grabLift.value         = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          translateX.value       = withSpring(0, { damping: 14, stiffness: 300 });
          translateY.value       = withSpring(0, { damping: 14, stiffness: 300 });
          grabLift.value         = withSpring(0, { damping: 14, stiffness: 300 });
          scale.value            = withSpring(1.0, { damping: 14, stiffness: 300 });
          rotation.value         = withSpring(0, { damping: 14, stiffness: 300 });
        }
      },
    })
  ).current;

  // ── Screen-reader alternate path ────────────────────────────────
  // VoiceOver/TalkBack users have no way to perform the drag gesture above,
  // so accessibility actions drive the exact same judged/swipeDir outcome
  // the gesture does. Tiles must stay anonymous until commit either way —
  // the label only repeats the phrase already on screen, never real/trap.
  function handleAccessibilityAction(actionName: string) {
    if (disabledRef.current || judgedRef.current) return;
    const action = resolveTileAccessibilityAction(actionName);
    if (action === 'claim') {
      judgedRef.current   = true;
      swipeDirRef.current = 'up';
      onSwipeUpRef.current();
    } else if (action === 'reject') {
      judgedRef.current   = true;
      swipeDirRef.current = 'right';
      Haptics.impactAsync(
        nearMastery
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
      onSwipeDownRef.current();
    }
  }

  // ── Hidden state ──────────────────────────────────────────────
  if (s === 'hidden') {
    return (
      <RNAnimated.View
        style={{
          overflow: 'visible',
          opacity: entryOpacity,
          transform: [{ translateY: entryTransY }, { scale: entryScale }],
        }}
      >
        <RNAnimated.View style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim }}>
          <Pressable
            onPress={revealable ? onSwipeReveal : undefined}
            style={styles.hiddenTile}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Hidden meaning tile"
            accessibilityState={{ disabled: !revealable }}
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

  // Wrong-swipe caption — the "why," derived from data already on this
  // tile (which way it was swiped + whether it was real), not new
  // per-word content. Both wrong directions funnel into the same 'wrong'
  // state, so this is what tells them apart in the moment instead of only
  // at Results, rounds later.
  const wrongCaption = s === 'wrong'
    ? swipeDirRef.current === 'up' && !mask.isReal
      ? 'THAT WAS A TRAP'
      : swipeDirRef.current === 'right' && mask.isReal
        ? 'THAT WAS REAL'
        : null
    : null;

  // ── Main tile ─────────────────────────────────────────────────
  return (
    <RNAnimated.View
      style={{
        width: '100%',
        alignItems: 'center',
        overflow: 'visible',
        opacity: entryOpacity,
        transform: [{ translateY: entryTransY }, { scale: entryScale }],
      }}
    >
      <RNAnimated.View
        ref={outerRef}
        style={{
          width: isSpecialSplit ? '100%' : cardWidth,
          alignItems: 'center',
          height: outerHeightAnim,
          marginTop: outerMarginTopAnim,
          overflow: 'visible',
        }}
      >
        {/* Main animated tile — Reanimated for transforms/opacity (native) */}
        <Animated.View
          style={[
            isSpecialSplit
              ? styles.splitTile
              : bookMaterial
                ? styles.bookTile
                : styles.tile,
            !isSpecialSplit && { width: cardWidth, height: cardHeight },
            bookMaterial && styles.tileBookMaterial,
            tileAnimStyle,
          ]}
          onLayout={(e: LayoutChangeEvent) => {
            tileLayoutRef.current = {
              width:  e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            };
          }}
          {...panResponder.panHandlers}
          accessible
          accessibilityRole="button"
          accessibilityLabel={mask.phrase}
          accessibilityHint="Choose an action to claim as real or reject as a trap."
          accessibilityActions={CLAIM_REJECT_ACTIONS}
          onAccessibilityAction={(event) => handleAccessibilityAction(event.nativeEvent.actionName)}
        >
          {/* Approved neutral card art. Outcome feedback appears only after commitment. */}
          {!isSpecialSplit && !bookMaterial && (
            <MaskCardArtwork />
          )}
          {!isSpecialSplit && bookMaterial && (
            <LinearGradient
              colors={tileGradient(s, true)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {!isSpecialSplit && gauntletCard && (
            <>
              <LinearGradient
                colors={['#C23E88', '#6B2D9B', '#2A1C5C']}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gauntletInset} pointerEvents="none" />
            </>
          )}
          {/* Split tile background */}
          {isSpecialSplit && splitBackgroundColor && (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: splitBackgroundColor }]}
            />
          )}
          {/* Wrong flash */}
          {flashRed && (
            <View style={[StyleSheet.absoluteFill, styles.flashOverlay]} />
          )}
          {/* Checkmark */}
          {s === 'correct' && (
            <Text style={isSpecialSplit ? styles.splitCheckmark : styles.checkmark}>
              ✓
            </Text>
          )}
          {/* Wrong-swipe caption — why, not just that */}
          {wrongCaption && (
            <Text style={styles.wrongCaption}>{wrongCaption}</Text>
          )}
          {/* Phrase text */}
          <View
            style={[
              isSpecialSplit ? styles.splitPhrasePanel : styles.phrasePanel,
              bookMaterial && styles.phrasePanelBook,
            ]}
            pointerEvents="none"
          >
            <Text
              style={[
                isSpecialSplit ? styles.splitPhrase : styles.phrase,
                isSpecialSplit && { color: splitTextColor },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit={true}
              minimumFontScale={isSpecialSplit ? 0.65 : 0.8}
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
                { opacity: eraBadgeOpacity,
                  transform: [{ translateY: eraBadgeTransY }] },
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
    borderRadius: 20,
    minHeight: 148,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 10,
  },
  bookTile: {
    borderRadius: 20,
    minHeight: 148,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    overflow: 'hidden',
    shadowColor: '#9B2D6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  phrasePanel: {
    width: '82%',
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 18,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  tileBookMaterial: {
    shadowColor: heroBookMaterial.goldTrim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 16,
  },
  phrasePanelBook: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: heroBookMaterial.coverPurpleBot,
    overflow: 'hidden',
  },
  gauntletInset: {
    position: 'absolute',
    top: 5, left: 5, right: 5, bottom: 5,
    borderRadius: 16,
    backgroundColor: '#0F0D2A',
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
  wrongCaption: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    textAlign: 'center',
    fontFamily: FONTS.label,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    zIndex: 4,
  },
  phrase: {
    fontSize: 27,
    fontFamily: FONTS.tileCopy,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 31,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.76)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
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
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: PW.color.wrong,
    backgroundColor: 'rgba(204,34,0,0.24)',
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
});
