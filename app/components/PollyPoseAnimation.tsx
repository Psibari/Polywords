import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  POLLY_POSE_ANIMATIONS,
  PollyPoseAnimationName,
} from '../animations/pollyPoseAnimations';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { POLLY_POSES } from '../ui/pollyPoses';

export type PollyPoseAnimationProps = {
  animation: PollyPoseAnimationName;
  size?: number;
  active?: boolean;
  loop?: boolean;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function PollyPoseAnimation({
  animation,
  size = 220,
  active = true,
  loop = true,
  onComplete,
  style,
  accessibilityLabel = `Polly ${animation}`,
}: PollyPoseAnimationProps) {
  const reduceMotion = useReducedMotionPreference();
  const progress = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const preset = POLLY_POSE_ANIMATIONS[animation];

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);

    if (!active || reduceMotion === null) return;
    if (reduceMotion) {
      if (!loop) onCompleteRef.current?.();
      return;
    }

    const cycle = Animated.timing(progress, {
      toValue: 1,
      duration: preset.durationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const runningAnimation = loop ? Animated.loop(cycle) : cycle;

    runningAnimation.start(({ finished }) => {
      if (finished && !loop) onCompleteRef.current?.();
    });

    return () => {
      runningAnimation.stop();
      progress.setValue(0);
    };
  }, [active, loop, preset, progress, reduceMotion]);

  const translateX = progress.interpolate({
    inputRange: preset.inputRange,
    outputRange: preset.translateX,
  });
  const translateY = progress.interpolate({
    inputRange: preset.inputRange,
    outputRange: preset.translateY,
  });
  const scale = progress.interpolate({
    inputRange: preset.inputRange,
    outputRange: preset.scale,
  });
  const rotate = progress.interpolate({
    inputRange: preset.inputRange,
    outputRange: preset.rotateDeg.map(value => `${value}deg`),
  });

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel}
      pointerEvents="none"
      style={[
        styles.root,
        { width: size, height: size },
        style,
        { transform: [{ translateX }, { translateY }, { rotate }, { scale }] },
      ]}
    >
      <Image
        accessible={false}
        source={POLLY_POSES[preset.pose]}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
