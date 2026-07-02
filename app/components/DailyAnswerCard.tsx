import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONTS } from '../constants/fonts';
import { playSfx } from '../audio/sfx';
import { dailyCardMaterial } from '../ui/pwDailyMaterials';

export type DailyAnswerCardState = 'idle' | 'correct' | 'wrong' | 'disabled';

type Props = {
  label: string;
  disabled?: boolean;
  state?: DailyAnswerCardState;
  onClaim: (label: string) => void;
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
  if (state === 'correct') return ['#F5C842', '#F5C842'];
  if (state === 'wrong') return ['#CC2200', '#CC2200'];
  if (state === 'disabled') return ['#3C315E', '#7B2D8B'];
  return [dailyCardMaterial.outerGradient[0], dailyCardMaterial.outerGradient[1]];
}

export default function DailyAnswerCard({
  label,
  disabled = false,
  state = 'idle',
  onClaim,
  testID,
  enterFromLeft = false,
  enterDelay = 0,
  roundKey = 0,
}: Props) {
  const entryTranslateX = useRef(new Animated.Value(0)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const gripGlow = useRef(new Animated.Value(0)).current;

  const labelRef = useRef(label);
  const onClaimRef = useRef(onClaim);
  const interactionDisabledRef = useRef(disabled || state !== 'idle');
  const claimedRef = useRef(false);
  const thresholdCrossedRef = useRef(false);

  labelRef.current = label;
  onClaimRef.current = onClaim;
  interactionDisabledRef.current = disabled || state !== 'idle';

  function springBack() {
    thresholdCrossedRef.current = false;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(gripGlow, {
        toValue: 0,
        duration: dailyCardMaterial.motion.pressOutMs,
        useNativeDriver: true,
      }),
    ]).start();
  }

  useEffect(() => {
    const entryDistance = Dimensions.get('window').width * 0.7;
    entryTranslateX.stopAnimation();
    entryOpacity.stopAnimation();
    entryTranslateX.setValue(enterFromLeft ? -entryDistance : entryDistance);
    entryOpacity.setValue(0);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(entryTranslateX, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(entryOpacity, {
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
    roundKey,
  ]);

  useEffect(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    scale.setValue(0.96);
    opacity.setValue(1);
    gripGlow.setValue(0);
    claimedRef.current = false;
    thresholdCrossedRef.current = false;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [label, gripGlow, opacity, scale, translateX, translateY]);

  useEffect(() => {
    if (state === 'correct') {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.04,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(gripGlow, {
          toValue: 0,
          duration: dailyCardMaterial.motion.pressOutMs,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (state === 'wrong') {
      translateY.setValue(0);
      scale.setValue(1);
      gripGlow.setValue(0);
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -9,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 9,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -5,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 45,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (state === 'disabled') {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 0.96,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: dailyCardMaterial.disabledOpacity,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(gripGlow, {
          toValue: 0,
          duration: dailyCardMaterial.motion.pressOutMs,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    claimedRef.current = false;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [gripGlow, opacity, scale, state, translateX, translateY]);

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
        Animated.parallel([
          Animated.spring(scale, {
            toValue: dailyCardMaterial.liftScale,
            friction: 7,
            tension: 140,
            useNativeDriver: true,
          }),
          Animated.timing(gripGlow, {
            toValue: 1,
            duration: dailyCardMaterial.motion.pressInMs,
            useNativeDriver: true,
          }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playSfx('pressHoldStart');
      },

      onPanResponderMove: (_, gesture) => {
        if (interactionDisabledRef.current || claimedRef.current) return;

        translateX.setValue(gesture.dx);
        translateY.setValue(gesture.dy);

        const crossedUpThreshold =
          gesture.dy < CLAIM_THRESHOLD &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx) * 0.85;

        if (crossedUpThreshold && !thresholdCrossedRef.current) {
          thresholdCrossedRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          playSfx('tileSwipe');
        } else if (!crossedUpThreshold) {
          thresholdCrossedRef.current = false;
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (interactionDisabledRef.current || claimedRef.current) {
          springBack();
          return;
        }

        const isUpClaim =
          gesture.dy < CLAIM_THRESHOLD &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx) * 0.85;

        if (!isUpClaim) {
          springBack();
          return;
        }

        claimedRef.current = true;
        springBack();
        onClaimRef.current(labelRef.current);
      },

      onPanResponderTerminate: () => {
        if (!claimedRef.current) springBack();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.entryShell,
        {
          opacity: entryOpacity,
          transform: [{ translateX: entryTranslateX }],
        },
      ]}
    >
      <Animated.View
        testID={testID}
        accessibilityLabel={label}
        {...panResponder.panHandlers}
        style={[
          styles.shell,
          state === 'correct' && styles.shellCorrect,
          state === 'wrong' && styles.shellWrong,
          {
            opacity,
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
      >
        <LinearGradient
          colors={rimColors(state)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rim}
        >
          <View style={styles.face}>
            <Animated.View
              pointerEvents="none"
              style={[styles.gripGlow, { opacity: gripGlow }]}
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
            <Text
              style={styles.label}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {label.toUpperCase()}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  entryShell: {
    width: '47%',
    height: 64,
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: dailyCardMaterial.pressGlow,
  },
  correctOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,200,66,0.14)',
  },
  wrongOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(204,34,0,0.14)',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: dailyCardMaterial.disabledOverlay,
  },
  label: {
    color: dailyCardMaterial.text,
    fontFamily: FONTS.tileCopy,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
