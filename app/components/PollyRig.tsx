import React, { useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import {
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  POLLY_RIG_LAYER_ORDER,
  POLLY_RIG_PARTS,
  PollyRigPartName,
} from '../animations/pollyRigParts';

export type PollyRigState = 'idle';

type PollyRigProps = {
  state: PollyRigState;
};

export const POLLY_RIG_SIZE = 210;
export const POLLY_RIG_INNER_SCALE = 1.45;

const HEAD_PARTS = new Set<PollyRigPartName>([
  'head',
  'bandana',
  'brow',
  'beakUpper',
  'beakLower',
]);

export function PollyRig({ state }: PollyRigProps) {
  const bodyBob = useRef(new Animated.Value(0)).current;
  const headTilt = useRef(new Animated.Value(0)).current;
  const crownBob = useRef(new Animated.Value(0)).current;
  const pupilGlance = useRef(new Animated.Value(0)).current;
  const blinkScaleY = useRef(new Animated.Value(1)).current;
  const tailFlick = useRef(new Animated.Value(0)).current;
  const wingTwitch = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'idle') return;

    const idleAnimations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(bodyBob, {
            toValue: -1.25,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bodyBob, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(headTilt, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(900),
          Animated.timing(headTilt, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(1300),
          Animated.timing(headTilt, {
            toValue: -1,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(900),
          Animated.timing(headTilt, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(320),
          Animated.timing(crownBob, {
            toValue: -1.75,
            duration: 1450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(crownBob, {
            toValue: 0,
            duration: 1250,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(180),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(2600),
          Animated.timing(pupilGlance, {
            toValue: 1.25,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(750),
          Animated.timing(pupilGlance, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(3600),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(3200),
          Animated.timing(blinkScaleY, {
            toValue: 0.06,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.delay(45),
          Animated.timing(blinkScaleY, {
            toValue: 1,
            duration: 75,
            useNativeDriver: true,
          }),
          Animated.delay(2100),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(4300),
          Animated.timing(tailFlick, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(tailFlick, {
            toValue: -0.35,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(tailFlick, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(2200),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(6200),
          Animated.timing(wingTwitch, {
            toValue: 1,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(wingTwitch, {
            toValue: 0,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(3100),
        ])
      ),
    ];

    idleAnimations.forEach((animation) => animation.start());
    return () => idleAnimations.forEach((animation) => animation.stop());
  }, [
    blinkScaleY,
    bodyBob,
    crownBob,
    headTilt,
    pupilGlance,
    state,
    tailFlick,
    wingTwitch,
  ]);

  const headRotate = headTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1.5deg', '1.5deg'],
  });
  const tailRotate = tailFlick.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1.25deg', '1.25deg'],
  });
  const wingLeftRotate = wingTwitch.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-1deg'],
  });
  const wingRightRotate = wingTwitch.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1deg'],
  });

  function animatedPartStyle(partName: PollyRigPartName) {
    if (partName === 'crown') {
      return {
        transform: [{ rotate: headRotate }, { translateY: crownBob }],
      };
    }
    if (partName === 'eyeWhite') {
      return {
        transform: [{ rotate: headRotate }, { scaleY: blinkScaleY }],
      };
    }
    if (partName === 'pupil') {
      return {
        transform: [
          { rotate: headRotate },
          { translateX: pupilGlance },
          { scaleY: blinkScaleY },
        ],
      };
    }
    if (partName === 'tail') {
      return { transform: [{ rotate: tailRotate }] };
    }
    if (partName === 'wingLeft') {
      return { transform: [{ rotate: wingLeftRotate }] };
    }
    if (partName === 'wingRight') {
      return { transform: [{ rotate: wingRightRotate }] };
    }
    if (HEAD_PARTS.has(partName)) {
      return { transform: [{ rotate: headRotate }] };
    }
    return undefined;
  }

  function pivotStyle(partName: PollyRigPartName): ViewStyle | undefined {
    if (partName === 'head' || HEAD_PARTS.has(partName)) {
      return styles.headPivot;
    }
    if (partName === 'crown') return styles.crownPivot;
    if (partName === 'eyeWhite' || partName === 'pupil') return styles.eyePivot;
    if (partName === 'tail') return styles.tailPivot;
    if (partName === 'wingLeft') return styles.wingLeftPivot;
    if (partName === 'wingRight') return styles.wingRightPivot;
    return undefined;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={styles.container}
      testID={`polly-rig-${state}`}
    >
      <Animated.View
        style={[
          styles.innerRig,
          {
            transform: [
              { translateY: bodyBob },
              { scale: POLLY_RIG_INNER_SCALE },
            ],
          },
        ]}
      >
        {POLLY_RIG_LAYER_ORDER.map((partName) => (
          <Animated.View
            key={partName}
            style={[
              styles.partLayer,
              pivotStyle(partName),
              animatedPartStyle(partName),
            ]}
          >
            <Image
              source={POLLY_RIG_PARTS[partName]}
              style={styles.partImage}
              contentFit="contain"
            />
          </Animated.View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: POLLY_RIG_SIZE,
    height: POLLY_RIG_SIZE,
    overflow: 'visible',
  },
  innerRig: {
    ...StyleSheet.absoluteFillObject,
  },
  partLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  partImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: POLLY_RIG_SIZE,
    height: POLLY_RIG_SIZE,
  },
  headPivot: {
    transformOrigin: [
      (POLLY_RIG_SIZE * 250) / 512,
      (POLLY_RIG_SIZE * 190) / 512,
      0,
    ],
  },
  crownPivot: {
    transformOrigin: [
      (POLLY_RIG_SIZE * 245) / 512,
      (POLLY_RIG_SIZE * 150) / 512,
      0,
    ],
  },
  eyePivot: {
    transformOrigin: [
      (POLLY_RIG_SIZE * 240) / 512,
      (POLLY_RIG_SIZE * 205) / 512,
      0,
    ],
  },
  tailPivot: {
    transformOrigin: [
      (POLLY_RIG_SIZE * 185) / 512,
      (POLLY_RIG_SIZE * 340) / 512,
      0,
    ],
  },
  wingLeftPivot: {
    transformOrigin: [
      (POLLY_RIG_SIZE * 160) / 512,
      (POLLY_RIG_SIZE * 245) / 512,
      0,
    ],
  },
  wingRightPivot: {
    transformOrigin: [
      (POLLY_RIG_SIZE * 315) / 512,
      (POLLY_RIG_SIZE * 260) / 512,
      0,
    ],
  },
});
