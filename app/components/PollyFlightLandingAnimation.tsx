import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { POLLY_FLIGHT_LANDING_MOTION } from '../animations/pollyFlightLandingMotion';
import {
  FLIGHT_LANDING_TOTAL_MS,
  PollyFlightLandingFrame,
  PollyFlightWingFrame,
  flightLandingFrameAt,
} from '../animations/pollyFlightLandingTimeline';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { POLLY_POSES, POLLY_POSE_SCALE } from '../ui/pollyPoses';

const FLIGHT_BODY = require('../../assets/images/polly/flight-rig/polly_flight_body.png');

const FLIGHT_WINGS: Record<
  PollyFlightWingFrame,
  { left: ImageSourcePropType; right: ImageSourcePropType }
> = {
  up: {
    left: require('../../assets/images/polly/flight-rig/polly_wing_left_up.png'),
    right: require('../../assets/images/polly/flight-rig/polly_wing_right_up.png'),
  },
  middle: {
    left: require('../../assets/images/polly/flight-rig/polly_wing_left_middle.png'),
    right: require('../../assets/images/polly/flight-rig/polly_wing_right_middle.png'),
  },
  down: {
    left: require('../../assets/images/polly/flight-rig/polly_wing_left_down.png'),
    right: require('../../assets/images/polly/flight-rig/polly_wing_right_down.png'),
  },
};

type Props = {
  active?: boolean;
  size?: number;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

function sameFrame(a: PollyFlightLandingFrame, b: PollyFlightLandingFrame): boolean {
  return a.phase === b.phase && a.visiblePose === b.visiblePose && a.wingFrame === b.wingFrame;
}

export function PollyFlightLandingAnimation({
  active = true,
  size = 220,
  onComplete,
  style,
  accessibilityLabel = 'Polly flight and landing animation',
}: Props) {
  const reduceMotion = useReducedMotionPreference();
  const progress = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  const [frame, setFrame] = useState<PollyFlightLandingFrame>(() => flightLandingFrameAt(0));
  onCompleteRef.current = onComplete;

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    setFrame(flightLandingFrameAt(0));

    if (!active || reduceMotion === null) return;

    if (reduceMotion) {
      progress.setValue(1);
      setFrame(flightLandingFrameAt(FLIGHT_LANDING_TOTAL_MS));
      const completeTimer = setTimeout(() => onCompleteRef.current?.(), 0);
      return () => clearTimeout(completeTimer);
    }

    const startedAt = Date.now();
    let frameTimer: ReturnType<typeof setInterval> | null = setInterval(() => {
      const elapsedMs = Math.min(Date.now() - startedAt, FLIGHT_LANDING_TOTAL_MS);
      const nextFrame = flightLandingFrameAt(elapsedMs);
      setFrame(current => (sameFrame(current, nextFrame) ? current : nextFrame));

      if (elapsedMs >= FLIGHT_LANDING_TOTAL_MS && frameTimer !== null) {
        clearInterval(frameTimer);
        frameTimer = null;
      }
    }, 45);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FLIGHT_LANDING_TOTAL_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (!finished) return;
      setFrame(flightLandingFrameAt(FLIGHT_LANDING_TOTAL_MS));
      onCompleteRef.current?.();
    });

    return () => {
      animation.stop();
      if (frameTimer !== null) clearInterval(frameTimer);
      progress.setValue(0);
    };
  }, [active, progress, reduceMotion]);

  const translateX = progress.interpolate({
    inputRange: POLLY_FLIGHT_LANDING_MOTION.inputRange,
    outputRange: POLLY_FLIGHT_LANDING_MOTION.translateX,
  });
  const translateY = progress.interpolate({
    inputRange: POLLY_FLIGHT_LANDING_MOTION.inputRange,
    outputRange: POLLY_FLIGHT_LANDING_MOTION.translateY,
  });
  const scale = progress.interpolate({
    inputRange: POLLY_FLIGHT_LANDING_MOTION.inputRange,
    outputRange: POLLY_FLIGHT_LANDING_MOTION.scale,
  });
  const rotate = progress.interpolate({
    inputRange: POLLY_FLIGHT_LANDING_MOTION.inputRange,
    outputRange: POLLY_FLIGHT_LANDING_MOTION.rotateDeg.map(value => `${value}deg`),
  });

  const wings = FLIGHT_WINGS[frame.wingFrame];
  const landedPose = frame.visiblePose === 'laugh' ? 'laugh' : 'idle';

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
      {frame.visiblePose === 'flight' ? (
        <View style={styles.rigCanvas}>
          <Image accessible={false} resizeMode="contain" source={wings.left} style={styles.rigLayer} />
          <Image accessible={false} resizeMode="contain" source={wings.right} style={styles.rigLayer} />
          <Image accessible={false} resizeMode="contain" source={FLIGHT_BODY} style={styles.rigLayer} />
        </View>
      ) : (
        <Image
          accessible={false}
          resizeMode="contain"
          source={POLLY_POSES[landedPose]}
          style={[
            styles.pose,
            {
              width: size,
              height: size,
              transform: [{ scale: POLLY_POSE_SCALE[landedPose] }],
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rigCanvas: {
    width: '100%',
    height: '100%',
  },
  rigLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  pose: {
    position: 'absolute',
  },
});
