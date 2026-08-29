import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';

const baseArt = require('../../assets/images/polly/rig2/polly_base.png');
const beakArt = require('../../assets/images/polly/rig2/polly_beak.png');
const beakOpenArt = require('../../assets/images/polly/rig2/polly_beak_open.png');
const beakGapeArt = require('../../assets/images/polly/rig2/polly_beak_gape.png');
const eyeArt = require('../../assets/images/polly/rig2/polly_eye.png');
const eyeWideArt = require('../../assets/images/polly/rig2/polly_eye_wide.png');
const browArt = require('../../assets/images/polly/rig2/polly_brow.png');
const browShockArt = require('../../assets/images/polly/rig2/polly_brow_shock.png');
const crownArt = require('../../assets/images/polly/rig2/polly_crown.png');

// Flip off to fall back to the flat pose image everywhere this rig is wired.
export const POLLY_PERCH_RIG_ENABLED = true;

// Ported from PollyFaceRigDevViewer.tsx, which tuned these against a 340pt
// square stage — expressed here as fractions of `size` so the rig scales
// correctly at any perch size.
const EYE_PIVOT_Y_FRAC = 0.12;
const EYE_CLOSED_SCALE = 0.05;
const BLINK_DOWN_MS = 90;
const BLINK_UP_MS = 110;
const BLINK_MIN_INTERVAL_MS = 2000;
const BLINK_MAX_INTERVAL_MS = 6000;
const BROW_TO_EYE_PIVOT_FRAC = 0.085;
const BROW_FOLLOW = 0.33; // Pete device-locked this value 2026-08-28
const BROW_MAX_FRAC = 6 / 340;
const BROW_ROTATE_DEG = -7;
const BROW_TRANSITION_MS = 220;
const CROWN_PIVOT_X_FRAC = 0.04;
const CROWN_PIVOT_Y_FRAC = 0.236;
const CROWN_TILT_RANGE = 8;
const CROWN_TILT_DURATION_MS = 1400;

type Props = {
  size: number;
  crownTilt?: boolean;
  angryBrow?: boolean;
  mouth?: 'closed' | 'open' | 'gape';
  eye?: 'default' | 'wide';
  brow?: 'default' | 'shocked';
  reduceMotion: boolean | null;
};

export function PollyPerchRig({
  size,
  crownTilt = false,
  angryBrow = false,
  mouth = 'closed',
  eye = 'default',
  brow = 'default',
  reduceMotion,
}: Props) {
  const motionAllowed = reduceMotion === false;

  const blinkValue = useRef(new Animated.Value(1)).current;
  const browValue = useRef(new Animated.Value(0)).current;
  const crownValue = useRef(new Animated.Value(0)).current;

  // BLINK — random-interval squash/reopen, always running while motion is allowed.
  useEffect(() => {
    if (!motionAllowed) {
      blinkValue.stopAnimation();
      blinkValue.setValue(1);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNext = () => {
      const delay = BLINK_MIN_INTERVAL_MS + Math.random() * (BLINK_MAX_INTERVAL_MS - BLINK_MIN_INTERVAL_MS);
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        Animated.sequence([
          Animated.timing(blinkValue, {
            toValue: EYE_CLOSED_SCALE,
            duration: BLINK_DOWN_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(blinkValue, {
            toValue: 1,
            duration: BLINK_UP_MS,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (!cancelled) scheduleNext();
        });
      }, delay);
    };
    scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      blinkValue.stopAnimation();
      blinkValue.setValue(1);
    };
  }, [motionAllowed, blinkValue]);

  // ANGRY BROW — holds the offset pose while true, doesn't loop. Off by
  // default this pass, so it's a no-op transition to 0.
  useEffect(() => {
    const toValue = angryBrow ? BROW_MAX_FRAC * size : 0;
    if (motionAllowed) {
      Animated.timing(browValue, {
        toValue,
        duration: BROW_TRANSITION_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      browValue.stopAnimation();
      browValue.setValue(toValue);
    }
    return () => browValue.stopAnimation();
  }, [angryBrow, motionAllowed, size, browValue]);

  // CROWN TILT — loops between +/- CROWN_TILT_RANGE while true. Off by
  // default this pass, so it's a no-op held at rest.
  useEffect(() => {
    if (!motionAllowed || !crownTilt) {
      crownValue.stopAnimation();
      crownValue.setValue(0);
      return;
    }

    crownValue.stopAnimation();
    crownValue.setValue(-CROWN_TILT_RANGE);
    const swing = (toValue: number) =>
      Animated.timing(crownValue, {
        toValue,
        duration: CROWN_TILT_DURATION_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([swing(CROWN_TILT_RANGE), swing(-CROWN_TILT_RANGE)]));
    loop.start();

    return () => loop.stop();
  }, [motionAllowed, crownTilt, crownValue]);

  const browRotateDeg = browValue.interpolate({
    inputRange: [0, BROW_MAX_FRAC * size],
    outputRange: ['0deg', `${BROW_ROTATE_DEG}deg`],
  });
  const browFollowY = blinkValue.interpolate({
    inputRange: [EYE_CLOSED_SCALE, 1],
    outputRange: [BROW_TO_EYE_PIVOT_FRAC * size * BROW_FOLLOW, 0],
  });
  const crownSpinDeg = crownValue.interpolate({
    inputRange: [-CROWN_TILT_RANGE, CROWN_TILT_RANGE],
    outputRange: [`${-CROWN_TILT_RANGE}deg`, `${CROWN_TILT_RANGE}deg`],
  });

  const layerSize = { width: size, height: size };

  return (
    <Animated.View style={[styles.stage, layerSize]}>
      <Image source={baseArt} resizeMode="contain" style={[styles.layer, layerSize]} />
      <Image
        source={mouth === 'gape' ? beakGapeArt : mouth === 'open' ? beakOpenArt : beakArt}
        resizeMode="contain"
        style={[styles.layer, layerSize]}
      />
      <Animated.Image
        source={eye === 'wide' ? eyeWideArt : eyeArt}
        resizeMode="contain"
        style={[
          styles.layer,
          layerSize,
          {
            transform: [
              { translateY: -EYE_PIVOT_Y_FRAC * size },
              { scaleY: blinkValue },
              { translateY: EYE_PIVOT_Y_FRAC * size },
            ],
          },
        ]}
      />
      <Animated.Image
        source={brow === 'shocked' ? browShockArt : browArt}
        resizeMode="contain"
        style={[
          styles.layer,
          layerSize,
          {
            transform: [
              { translateY: browFollowY },
              { translateY: browValue },
              { rotate: browRotateDeg },
            ],
          },
        ]}
      />
      <Animated.Image
        source={crownArt}
        resizeMode="contain"
        style={[
          styles.layer,
          layerSize,
          {
            transform: [
              { translateX: -CROWN_PIVOT_X_FRAC * size },
              { translateY: -CROWN_PIVOT_Y_FRAC * size },
              { rotate: crownSpinDeg },
              { translateX: CROWN_PIVOT_X_FRAC * size },
              { translateY: CROWN_PIVOT_Y_FRAC * size },
            ],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
  },
  layer: {
    position: 'absolute',
  },
});
