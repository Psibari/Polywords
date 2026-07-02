import React, { useEffect, useMemo, useRef } from 'react';
import { Image } from 'expo-image';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import {
  POLLY_RIG_LAYER_ORDER,
  POLLY_RIG_PARTS,
  PollyRigPartName,
} from '../animations/pollyRigParts';
import {
  IDLE_TRACKS,
  PERFORMANCES,
  TALK_TRACK,
  PollyDriver,
  PerformanceName,
  Track,
} from '../animations/pollyPerformances';

type PollyRigProps = {
  performance: PerformanceName;
  speaking?: boolean;
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

// Reaction drivers snap back to 0 when a performance ends or is interrupted.
const REACTION_DRIVERS: PollyDriver[] = [
  'headThrow',
  'bodyShake',
  'wingSpread',
  'scalePop',
  'recoil',
  'beakOpen',
];

const EASINGS = {
  linear: Easing.linear,
  inOut: Easing.inOut(Easing.quad),
  out: Easing.out(Easing.quad),
};

export function PollyRig({ performance, speaking = false }: PollyRigProps) {
  const drivers = useRef<Record<PollyDriver, Animated.Value>>({
    bodyBob: new Animated.Value(0),
    headTilt: new Animated.Value(0),
    crownBob: new Animated.Value(0),
    pupilGlance: new Animated.Value(0),
    blink: new Animated.Value(0),
    tailFlick: new Animated.Value(0),
    headThrow: new Animated.Value(0),
    beakOpen: new Animated.Value(0),
    bodyShake: new Animated.Value(0),
    wingSpread: new Animated.Value(0),
    scalePop: new Animated.Value(0),
    recoil: new Animated.Value(0),
    eyeNarrow: new Animated.Value(0),
  }).current;

  const trackToAnim = useMemo(
    () =>
      (track: Track): Animated.CompositeAnimation => {
        const value = drivers[track.driver];
        const seq = track.keys.map((k) =>
          Animated.timing(value, {
            toValue: k.to,
            duration: k.dur,
            delay: k.delay ?? 0,
            easing: EASINGS[k.easing ?? 'inOut'],
            useNativeDriver: true,
          }),
        );
        const chain = Animated.sequence(seq);
        return track.loop ? Animated.loop(chain) : chain;
      },
    [drivers],
  );

  // Ambient idle — always running underneath.
  useEffect(() => {
    const anims = IDLE_TRACKS.map(trackToAnim);
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [trackToAnim]);

  // One-shot performances layered on top; reset reaction drivers on exit/interrupt.
  useEffect(() => {
    if (performance === 'idle') return;
    const anims = PERFORMANCES[performance].map(trackToAnim);
    anims.forEach((a) => a.start());
    return () => {
      anims.forEach((a) => a.stop());
      REACTION_DRIVERS.forEach((d) =>
        Animated.timing(drivers[d], {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }).start(),
      );
    };
  }, [performance, trackToAnim, drivers]);

  // Silent talk loop — beak flap while a bubble is up.
  useEffect(() => {
    if (!speaking) return;
    const anim = trackToAnim(TALK_TRACK);
    anim.start();
    return () => {
      anim.stop();
      Animated.timing(drivers.beakOpen, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    };
  }, [speaking, trackToAnim, drivers]);

  // ── Interpolations (stacked transforms compose additively) ──
  const headTiltDeg = drivers.headTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });
  const headThrowDeg = drivers.headThrow.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-22deg'],
  });
  // Hinge the lower beak open (rotate around the jaw joint) rather than sliding it
  // down — a translate reads as a duplicate "double beak".
  const beakOpenDeg = drivers.beakOpen.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });
  const blinkScaleY = drivers.blink.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.06],
  });
  const eyeNarrowScaleY = drivers.eyeNarrow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });
  const tailDeg = drivers.tailFlick.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });
  const wingLeftSpreadDeg = drivers.wingSpread.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-16deg'],
  });
  const wingRightSpreadDeg = drivers.wingSpread.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '16deg'],
  });
  const bodyShakeX = drivers.bodyShake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });
  const recoilY = drivers.recoil.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const rigScale = drivers.scalePop.interpolate({
    inputRange: [0, 1],
    outputRange: [POLLY_RIG_INNER_SCALE, POLLY_RIG_INNER_SCALE * 1.09],
  });

  function animatedPartStyle(partName: PollyRigPartName): any {
    if (partName === 'crown') {
      return {
        transform: [
          { rotate: headTiltDeg },
          { rotate: headThrowDeg },
          { translateY: drivers.crownBob },
        ],
      };
    }
    if (partName === 'eyeWhite') {
      return {
        transform: [
          { rotate: headTiltDeg },
          { rotate: headThrowDeg },
          { scaleY: blinkScaleY },
          { scaleY: eyeNarrowScaleY },
        ],
      };
    }
    if (partName === 'pupil') {
      return {
        transform: [
          { rotate: headTiltDeg },
          { rotate: headThrowDeg },
          { translateX: drivers.pupilGlance },
          { scaleY: blinkScaleY },
          { scaleY: eyeNarrowScaleY },
        ],
      };
    }
    if (partName === 'beakLower') {
      return {
        transform: [
          { rotate: headTiltDeg },
          { rotate: headThrowDeg },
          { rotate: beakOpenDeg },
        ],
      };
    }
    if (partName === 'tail') {
      return { transform: [{ rotate: tailDeg }] };
    }
    if (partName === 'wingLeft') {
      return { transform: [{ rotate: wingLeftSpreadDeg }] };
    }
    if (partName === 'wingRight') {
      return { transform: [{ rotate: wingRightSpreadDeg }] };
    }
    if (HEAD_PARTS.has(partName)) {
      return { transform: [{ rotate: headTiltDeg }, { rotate: headThrowDeg }] };
    }
    return undefined;
  }

  function pivotStyle(partName: PollyRigPartName): ViewStyle | undefined {
    if (partName === 'beakLower') return styles.beakPivot;
    if (partName === 'head' || HEAD_PARTS.has(partName)) return styles.headPivot;
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
      testID={`polly-rig-${performance}`}
    >
      <Animated.View
        style={[
          styles.innerRig,
          {
            transform: [
              { translateX: bodyShakeX },
              { translateY: drivers.bodyBob },
              { translateY: recoilY },
              { scale: rigScale },
            ],
          },
        ]}
      >
        {POLLY_RIG_LAYER_ORDER.map((partName) => (
          <Animated.View
            key={partName}
            style={[styles.partLayer, pivotStyle(partName), animatedPartStyle(partName)]}
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
  beakPivot: {
    transformOrigin: [
      (POLLY_RIG_SIZE * 250) / 512,
      (POLLY_RIG_SIZE * 235) / 512,
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
