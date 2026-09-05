import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedStyle,
  Easing as ReaEasing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '../utils/haptics';
import { playSfx } from '../audio/sfx';
import { dailyCardMaterial, dailyCardFaceMaterial } from '../ui/pwDailyMaterials';
import DailyCardFace from './ui/DailyCardFace';
import { CLAIM_ONLY_ACTIONS, resolveTileAccessibilityAction } from './tileAccessibility';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';

export type DailyAnswerCardState = 'idle' | 'correct' | 'wrong' | 'disabled';

export const DAILY_CARD_TIMING = {
  wrongExitMs: 620,
  reducedWrongExitMs: 240,
} as const;

export type DailyAnswerCardClaimOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  label: string;
  disabled?: boolean;
  state?: DailyAnswerCardState;
  onClaimStart: (label: string) => boolean;
  onClaim: (label: string, origin: DailyAnswerCardClaimOrigin | null) => void;
  testID?: string;
  enterFromLeft?: boolean;
  enterDelay?: number;
  roundKey?: string | number;
};

const CLAIM_THRESHOLD = -80;
const MOVE_THRESHOLD = 4;

function rimColors(
  state: DailyAnswerCardState,
): readonly [string, string] {
  if (state === 'correct') return [dailyCardFaceMaterial.rimCorrect, dailyCardFaceMaterial.rimCorrect];
  if (state === 'wrong') return [dailyCardFaceMaterial.rimWrong, dailyCardFaceMaterial.rimWrong];
  if (state === 'disabled') return [dailyCardFaceMaterial.rimDisabledStart, dailyCardFaceMaterial.rimDisabledEnd];
  return [dailyCardMaterial.outerGradient[0], dailyCardMaterial.outerGradient[1]];
}

export default function DailyAnswerCard({
  label,
  disabled = false,
  state = 'idle',
  onClaimStart,
  onClaim,
  testID,
  enterFromLeft = false,
  enterDelay = 0,
  roundKey = 0,
}: Props) {
  const reduceMotion = useReducedMotionPreference();
  const shellRef = useRef<View>(null);
  const entryTranslateX = useRef(new RNAnimated.Value(0)).current;
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.96);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const gripGlow = useSharedValue(0);

  const labelRef = useRef(label);
  const onClaimStartRef = useRef(onClaimStart);
  const onClaimRef = useRef(onClaim);
  const interactionDisabledRef = useRef(disabled || state !== 'idle');
  const claimedRef = useRef(false);
  const thresholdCrossedRef = useRef(false);
  const gestureOffsetRef = useRef({ x: 0, y: 0 });

  // Elevation while a card is under the finger — before onPanResponderGrant,
  // there was no zIndex boost until `state` flipped to 'correct'/'wrong',
  // so a mid-drag card in the 2-column grid could render underneath a
  // sibling it visually overlapped. Cleared once `state` actually leaves
  // 'idle' so entryShellClaiming/Failing's own elevation takes over with no
  // gap; left true across the claim-to-outcome handoff for the same reason.
  const [activelyHeld, setActivelyHeld] = useState(false);

  labelRef.current = label;
  onClaimStartRef.current = onClaimStart;
  onClaimRef.current = onClaim;
  interactionDisabledRef.current = disabled || state !== 'idle';

  function publishClaim() {
    const currentLabel = labelRef.current;
    const offset = gestureOffsetRef.current;
    const node = shellRef.current;
    if (!node) {
      onClaimRef.current(currentLabel, null);
      return;
    }

    let published = false;
    const fallbackTimer = setTimeout(() => {
      if (published) return;
      published = true;
      onClaimRef.current(currentLabel, null);
    }, 100);

    node.measureInWindow((x, y, width, height) => {
      if (published) return;
      published = true;
      clearTimeout(fallbackTimer);
      onClaimRef.current(currentLabel, {
        x: x + offset.x,
        y: y + offset.y,
        width,
        height,
      });
    });
  }

  function springBack() {
    thresholdCrossedRef.current = false;
    gestureOffsetRef.current = { x: 0, y: 0 };
    translateX.value = withSpring(0, { damping: 7, stiffness: 110 });
    translateY.value = withSpring(0, { damping: 7, stiffness: 110 });
    scale.value = withSpring(1, { damping: 7, stiffness: 110 });
    rotation.value = withSpring(0, { damping: 7, stiffness: 110 });
    gripGlow.value = withTiming(0, { duration: dailyCardMaterial.motion.pressOutMs });
  }

  useEffect(() => {
    const entryDistance = Dimensions.get('window').width * 0.7;
    entryTranslateX.stopAnimation();
    entryOpacity.stopAnimation();
    if (reduceMotion !== false) {
      entryTranslateX.setValue(0);
      entryOpacity.setValue(1);
      return;
    }
    entryTranslateX.setValue(enterFromLeft ? -entryDistance : entryDistance);
    entryOpacity.setValue(0);

    const timer = setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.spring(entryTranslateX, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        RNAnimated.timing(entryOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }, enterDelay);

    return () => clearTimeout(timer);
  }, [
    enterDelay,
    enterFromLeft,
    entryOpacity,
    entryTranslateX,
    reduceMotion,
    roundKey,
  ]);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 0.96;
    rotation.value = 0;
    opacity.value = 1;
    gripGlow.value = 0;
    claimedRef.current = false;
    thresholdCrossedRef.current = false;
    gestureOffsetRef.current = { x: 0, y: 0 };
    setActivelyHeld(false);

    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
  }, [label, gripGlow, opacity, rotation, scale, translateX, translateY]);

  // Held elevation only ever needs to survive up to the moment `state`
  // itself starts driving entryShellClaiming/Failing — once it's no longer
  // 'idle', clear it (harmless no-op if already false).
  useEffect(() => {
    if (state !== 'idle') setActivelyHeld(false);
  }, [state]);

  useEffect(() => {
    if (state === 'correct') {
      gripGlow.value = withTiming(0, { duration: dailyCardMaterial.motion.pressOutMs });
      rotation.value = 0;

      opacity.value = 0;
      // The scroll-owned transient copy is already mounted at this exact
      // release position, so hiding the grid source does not create a gap.
      return;
    }

    if (state === 'wrong') {
      if (reduceMotion !== false) {
        scale.value = 1;
        gripGlow.value = 0;
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.97, { duration: 200 });
        return;
      }
      const fallDistance = Dimensions.get('window').height * 0.72;
      scale.value = 1;
      gripGlow.value = 0;
      translateX.value = withSequence(
        withTiming(34, { duration: 75, easing: ReaEasing.out(ReaEasing.quad) }),
        withTiming(18, { duration: 60 }),
        withTiming(46, { duration: 430, easing: ReaEasing.in(ReaEasing.quad) }),
      );
      translateY.value = withSequence(
        withTiming(7, { duration: 75 }),
        withTiming(13, { duration: 60 }),
        withTiming(fallDistance, { duration: 430, easing: ReaEasing.in(ReaEasing.quad) }),
      );
      rotation.value = withSequence(
        withTiming(5, { duration: 75 }),
        withTiming(-4, { duration: 60 }),
        withTiming(18, { duration: 430, easing: ReaEasing.in(ReaEasing.quad) }),
      );
      opacity.value = withDelay(275, withTiming(0, { duration: 290, easing: ReaEasing.in(ReaEasing.quad) }));
      return;
    }

    if (state === 'disabled') {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(0.96);
      rotation.value = withSpring(0);
      opacity.value = withTiming(dailyCardMaterial.disabledOpacity, { duration: 180 });
      gripGlow.value = withTiming(0, { duration: dailyCardMaterial.motion.pressOutMs });
      return;
    }

    claimedRef.current = false;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    rotation.value = withSpring(0);
    opacity.value = withTiming(1, { duration: 120 });
  }, [gripGlow, opacity, reduceMotion, rotation, scale, state, translateX, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        !interactionDisabledRef.current && !claimedRef.current,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !interactionDisabledRef.current &&
        !claimedRef.current &&
        (Math.abs(gesture.dx) > MOVE_THRESHOLD ||
          Math.abs(gesture.dy) > MOVE_THRESHOLD),
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        if (interactionDisabledRef.current || claimedRef.current) return;
        thresholdCrossedRef.current = false;
        setActivelyHeld(true);
        scale.value = withSpring(dailyCardMaterial.liftScale, { damping: 7, stiffness: 140 });
        gripGlow.value = withTiming(1, { duration: dailyCardMaterial.motion.pressInMs });
        playSfx('pressHoldStart');
      },

      onPanResponderMove: (_, gesture) => {
        if (interactionDisabledRef.current || claimedRef.current) return;

        translateX.value = gesture.dx;
        translateY.value = gesture.dy;
        gestureOffsetRef.current = { x: gesture.dx, y: gesture.dy };

        const crossedUpThreshold =
          gesture.dy < CLAIM_THRESHOLD &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx) * 0.85;

        if (crossedUpThreshold && !thresholdCrossedRef.current) {
          thresholdCrossedRef.current = true;
          Haptics.cueAsync('gestureThreshold');
          playSfx('tileSwipe');
        } else if (!crossedUpThreshold) {
          thresholdCrossedRef.current = false;
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (interactionDisabledRef.current || claimedRef.current) {
          setActivelyHeld(false);
          springBack();
          return;
        }

        const isUpClaim =
          gesture.dy < CLAIM_THRESHOLD &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx) * 0.85;

        if (!isUpClaim) {
          setActivelyHeld(false);
          springBack();
          return;
        }

        if (!onClaimStartRef.current(labelRef.current)) {
          setActivelyHeld(false);
          springBack();
          return;
        }
        claimedRef.current = true;
        // activelyHeld intentionally stays true here — cleared by the
        // state-effect above once `state` actually flips to 'correct'/
        // 'wrong' and its own elevation style takes over, so there's no
        // frame where the card drops back to baseline zIndex in between.
        gripGlow.value = withTiming(0, { duration: dailyCardMaterial.motion.pressOutMs });
        publishClaim();
      },

      onPanResponderTerminate: () => {
        if (!claimedRef.current) {
          setActivelyHeld(false);
          springBack();
        }
      },
    }),
  ).current;

  // ── Screen-reader alternate path ──────────────────────────────
  // Daily has one gesture (swipe up to claim this candidate) and no reject,
  // so this only ever resolves 'claim' — same outcome as onPanResponderRelease.
  function handleAccessibilityAction(actionName: string) {
    if (interactionDisabledRef.current || claimedRef.current) return;
    if (resolveTileAccessibilityAction(actionName) !== 'claim') return;

    if (!onClaimStartRef.current(labelRef.current)) return;
    claimedRef.current = true;
    gripGlow.value = withTiming(0, { duration: dailyCardMaterial.motion.pressOutMs });
    gestureOffsetRef.current = { x: 0, y: 0 };
    publishClaim();
  }

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const gripGlowStyle = useAnimatedStyle(() => ({
    opacity: gripGlow.value,
  }));

  return (
    <RNAnimated.View
      ref={shellRef}
      collapsable={false}
      style={[
        styles.entryShell,
        (activelyHeld || state === 'correct') && styles.entryShellClaiming,
        (!activelyHeld && state === 'wrong') && styles.entryShellFailing,
        {
          opacity: entryOpacity,
          transform: [{ translateX: entryTranslateX }],
        },
      ]}
    >
      <Animated.View
        testID={testID}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || state !== 'idle' }}
        accessibilityActions={CLAIM_ONLY_ACTIONS}
        onAccessibilityAction={(event) => handleAccessibilityAction(event.nativeEvent.actionName)}
        {...panResponder.panHandlers}
        style={[
          styles.shell,
          state === 'correct' && styles.shellCorrect,
          state === 'wrong' && styles.shellWrong,
          cardAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={rimColors(state)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rim}
        >
          <View style={styles.face}>
            <DailyCardFace label={label} state={state} />
            <Animated.View
              pointerEvents="none"
              style={[styles.gripGlow, gripGlowStyle]}
            />
            {state === 'correct' && (
              <View pointerEvents="none" style={styles.correctOverlay} />
            )}
            {state === 'wrong' && (
              <View pointerEvents="none" style={styles.wrongOverlay} />
            )}
            {state === 'disabled' && (
              <View pointerEvents="none" style={styles.disabledOverlay} />
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </RNAnimated.View>
  );
}

export function DailySubmittedAnswerCard({ label }: { label: string }) {
  return (
    <View style={[styles.shell, styles.shellCorrect]} pointerEvents="none">
      <LinearGradient
        colors={rimColors('correct')}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rim}
      >
        <View style={styles.face}>
          <DailyCardFace label={label} state="correct" />
          <View style={styles.correctOverlay} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  entryShell: {
    width: '47%',
    height: 64,
    overflow: 'visible',
  },
  entryShellClaiming: {
    zIndex: 30,
    elevation: 30,
  },
  entryShellFailing: {
    zIndex: 20,
    elevation: 20,
  },
  shell: {
    width: '100%',
    height: '100%',
    borderRadius: dailyCardMaterial.outerRadius,
    shadowColor: dailyCardMaterial.shadowColor,
    shadowOpacity: dailyCardMaterial.shadowOpacity,
    shadowRadius: dailyCardMaterial.shadowRadius,
    shadowOffset: dailyCardMaterial.shadowOffset,
    elevation: dailyCardMaterial.elevation,
  },
  shellCorrect: {
    shadowColor: '#F5C842',
    shadowOpacity: 0.48,
    shadowRadius: 16,
    elevation: 11,
  },
  shellWrong: {
    shadowColor: '#CC2200',
    shadowOpacity: 0.48,
    shadowRadius: 16,
    elevation: 11,
  },
  rim: {
    flex: 1,
    borderRadius: dailyCardMaterial.outerRadius,
    padding: dailyCardMaterial.frameWidth,
  },
  face: {
    flex: 1,
    borderRadius: dailyCardMaterial.innerRadius,
    backgroundColor: dailyCardMaterial.innerFace,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  gripGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: dailyCardMaterial.pressGlow,
  },
  correctOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(245,200,66,0.14)',
  },
  wrongOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(204,34,0,0.14)',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: dailyCardMaterial.disabledOverlay,
  },
});
