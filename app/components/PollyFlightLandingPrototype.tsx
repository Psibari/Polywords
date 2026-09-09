import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  FLIGHT_LANDING_TOTAL_MS,
  POLLY_FLIGHT_LANDING_CUES,
  POLLY_FLIGHT_LANDING_TIMING,
  type PollyFlightLandingPhase,
  type PollyFlightWingFrame,
} from '../animations/pollyFlightLandingTimeline';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { POLLY_POSES } from '../ui/pollyPoses';
import { PW } from '../ui/pwTheme';

const flightBody = require('../../assets/images/polly/flight-rig/polly_flight_body.png');
const leftWing = {
  up: require('../../assets/images/polly/flight-rig/polly_wing_left_up.png'),
  middle: require('../../assets/images/polly/flight-rig/polly_wing_left_middle.png'),
  down: require('../../assets/images/polly/flight-rig/polly_wing_left_down.png'),
} as const;
const rightWing = {
  up: require('../../assets/images/polly/flight-rig/polly_wing_right_up.png'),
  middle: require('../../assets/images/polly/flight-rig/polly_wing_right_middle.png'),
  down: require('../../assets/images/polly/flight-rig/polly_wing_right_down.png'),
} as const;
const branchArt = require('../../assets/images/polly/polly_branch.png');

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 350;
const MAX_STAGE_WIDTH = 420;
const FLAP_QUARTER_MS = POLLY_FLIGHT_LANDING_TIMING.flapCycleMs / 4;

const PHASE_LABEL: Record<PollyFlightLandingPhase, string> = {
  approach: 'FLIGHT APPROACH',
  brake: 'BRAKING',
  touchdown: 'TOUCHDOWN',
  settle: 'LANDING REBOUND',
  laugh: 'LAUGH',
  rest: 'PERCHED',
};

type Props = {
  active: boolean;
};

export function PollyFlightLandingPrototype({ active }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotionPreference();
  const [replayKey, setReplayKey] = useState(0);
  const [wingFrame, setWingFrame] = useState<PollyFlightWingFrame>('up');
  const [phase, setPhase] = useState<PollyFlightLandingPhase>('approach');
  const [laughing, setLaughing] = useState(false);

  const flightX = useRef(new Animated.Value(-185)).current;
  const flightY = useRef(new Animated.Value(38)).current;
  const flightScale = useRef(new Animated.Value(0.72)).current;
  const flightTilt = useRef(new Animated.Value(-1)).current;
  const flightOpacity = useRef(new Animated.Value(1)).current;
  const flapBob = useRef(new Animated.Value(0)).current;
  const landedOpacity = useRef(new Animated.Value(0)).current;
  const landedY = useRef(new Animated.Value(-14)).current;
  const landedScaleX = useRef(new Animated.Value(1)).current;
  const landedScaleY = useRef(new Animated.Value(1)).current;
  const laughX = useRef(new Animated.Value(0)).current;
  const laughTilt = useRef(new Animated.Value(0)).current;
  const laughScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const animations: Animated.CompositeAnimation[] = [];
    const later = (fn: () => void, delayMs: number) => {
      timers.push(setTimeout(fn, delayMs));
    };
    const start = (animation: Animated.CompositeAnimation) => {
      animations.push(animation);
      animation.start();
    };

    flightX.setValue(-185);
    flightY.setValue(38);
    flightScale.setValue(0.72);
    flightTilt.setValue(-1);
    flightOpacity.setValue(1);
    flapBob.setValue(0);
    landedOpacity.setValue(0);
    landedY.setValue(-14);
    landedScaleX.setValue(1);
    landedScaleY.setValue(1);
    laughX.setValue(0);
    laughTilt.setValue(0);
    laughScale.setValue(1);
    setWingFrame('up');
    setPhase('approach');
    setLaughing(false);

    if (!active || reduceMotion === null) {
      return () => {
        timers.forEach(clearTimeout);
        animations.forEach(animation => animation.stop());
      };
    }

    if (reduceMotion) {
      flightOpacity.setValue(0);
      landedOpacity.setValue(1);
      landedY.setValue(0);
      setPhase('rest');
      return () => {
        timers.forEach(clearTimeout);
        animations.forEach(animation => animation.stop());
      };
    }

    const flapFrames: PollyFlightWingFrame[] = ['up', 'middle', 'down', 'middle'];
    for (
      let elapsedMs = 0;
      elapsedMs < POLLY_FLIGHT_LANDING_CUES.brakeAtMs;
      elapsedMs += FLAP_QUARTER_MS
    ) {
      const frame = flapFrames[(elapsedMs / FLAP_QUARTER_MS) % flapFrames.length];
      later(() => setWingFrame(frame), elapsedMs);
    }

    const flapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flapBob, {
          toValue: -4,
          duration: FLAP_QUARTER_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flapBob, {
          toValue: 3,
          duration: FLAP_QUARTER_MS * 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flapBob, {
          toValue: 0,
          duration: FLAP_QUARTER_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    start(flapLoop);

    start(
      Animated.parallel([
        Animated.timing(flightX, {
          toValue: 0,
          duration: POLLY_FLIGHT_LANDING_TIMING.approachMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flightY, {
            toValue: -18,
            duration: 760,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(flightY, {
            toValue: 0,
            duration: POLLY_FLIGHT_LANDING_TIMING.approachMs - 760,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(flightScale, {
          toValue: 1,
          duration: POLLY_FLIGHT_LANDING_TIMING.approachMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flightTilt, {
            toValue: 0.45,
            duration: 760,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(flightTilt, {
            toValue: 0,
            duration: POLLY_FLIGHT_LANDING_TIMING.approachMs - 760,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    later(() => {
      setPhase('brake');
      setWingFrame('up');
      flapLoop.stop();
      flapBob.setValue(-4);
      start(
        Animated.parallel([
          Animated.timing(flightX, {
            toValue: 7,
            duration: POLLY_FLIGHT_LANDING_TIMING.brakeMs,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(flightY, {
              toValue: -12,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(flightY, {
              toValue: 0,
              duration: 150,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(flightScale, {
            toValue: 1.04,
            duration: POLLY_FLIGHT_LANDING_TIMING.brakeMs,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(flightTilt, {
            toValue: -0.28,
            duration: POLLY_FLIGHT_LANDING_TIMING.brakeMs,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    }, POLLY_FLIGHT_LANDING_CUES.brakeAtMs);

    later(() => {
      setPhase('touchdown');
      start(
        Animated.parallel([
          Animated.timing(flightOpacity, {
            toValue: 0,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(landedOpacity, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(landedY, {
            toValue: 2,
            duration: 150,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(landedScaleX, {
              toValue: 1.045,
              duration: 150,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(landedScaleX, {
              toValue: 1,
              duration: 70,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(landedScaleY, {
              toValue: 0.94,
              duration: 150,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(landedScaleY, {
              toValue: 1.015,
              duration: 70,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
    }, POLLY_FLIGHT_LANDING_CUES.touchdownAtMs);

    later(() => {
      setPhase('settle');
      start(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(landedY, {
              toValue: -5,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(landedY, {
              toValue: 0,
              duration: POLLY_FLIGHT_LANDING_TIMING.settleMs - 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(landedScaleY, {
            toValue: 1,
            duration: POLLY_FLIGHT_LANDING_TIMING.settleMs,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );
    }, POLLY_FLIGHT_LANDING_CUES.settleAtMs);

    later(() => {
      setPhase('laugh');
      setLaughing(true);
      start(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(laughScale, {
              toValue: 1.07,
              duration: 90,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(laughScale, {
              toValue: 1,
              duration: 250,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(laughTilt, { toValue: -1, duration: 80, useNativeDriver: true }),
            Animated.timing(laughTilt, { toValue: 0.8, duration: 90, useNativeDriver: true }),
            Animated.timing(laughTilt, { toValue: -0.45, duration: 90, useNativeDriver: true }),
            Animated.timing(laughTilt, { toValue: 0, duration: 130, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(laughX, { toValue: 6, duration: 65, useNativeDriver: true }),
            Animated.timing(laughX, { toValue: -6, duration: 70, useNativeDriver: true }),
            Animated.timing(laughX, { toValue: 4, duration: 70, useNativeDriver: true }),
            Animated.timing(laughX, { toValue: 0, duration: 90, useNativeDriver: true }),
          ]),
        ]),
      );
    }, POLLY_FLIGHT_LANDING_CUES.laughAtMs);

    later(() => {
      setPhase('rest');
      setLaughing(false);
    }, FLIGHT_LANDING_TOTAL_MS);

    return () => {
      timers.forEach(clearTimeout);
      animations.forEach(animation => animation.stop());
    };
  }, [
    active,
    flapBob,
    flightOpacity,
    flightScale,
    flightTilt,
    flightX,
    flightY,
    landedOpacity,
    landedScaleX,
    landedScaleY,
    landedY,
    laughScale,
    laughTilt,
    laughX,
    reduceMotion,
    replayKey,
  ]);

  const stageWidth = Math.min(
    MAX_STAGE_WIDTH,
    Math.max(260, windowWidth - PW.space.lg * 2),
  );
  const unit = stageWidth / DESIGN_WIDTH;
  const px = (value: number) => value * unit;
  const flightRotate = flightTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });
  const laughRotate = laughTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  const leftWingStyle =
    wingFrame === 'down'
      ? { left: px(32), top: px(108), width: px(87), height: px(91) }
      : { left: px(-21), top: 0, width: px(174), height: px(167) };
  const rightWingStyle =
    wingFrame === 'down'
      ? { left: px(184), top: px(110), width: px(87), height: px(91) }
      : { left: px(141), top: 0, width: px(174), height: px(167) };

  return (
    <View style={styles.root}>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>{PHASE_LABEL[phase]}</Text>
        <Text style={styles.timingLabel}>3.46 SEC TEST LOOP</Text>
      </View>

      <View
        accessibilityLabel="Polly flaps in, brakes, lands on the perch, and laughs"
        style={[styles.stage, { width: stageWidth, height: px(DESIGN_HEIGHT) }]}
      >
        <View style={[styles.flightLane, { top: px(24) }]} />
        <Image
          resizeMode="contain"
          source={branchArt}
          style={{
            position: 'absolute',
            left: px(95),
            top: px(262),
            width: px(170),
            height: px(40),
          }}
        />

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: px(50),
            top: px(48),
            width: px(260),
            height: px(250),
            opacity: flightOpacity,
            transform: [
              { translateX: Animated.multiply(flightX, unit) },
              { translateY: Animated.multiply(flightY, unit) },
              { translateY: Animated.multiply(flapBob, unit) },
              { rotate: flightRotate },
              { scale: flightScale },
            ],
          }}
        >
          <Image
            resizeMode="contain"
            source={leftWing[wingFrame]}
            style={[styles.rigLayer, leftWingStyle]}
          />
          <Image
            resizeMode="contain"
            source={rightWing[wingFrame]}
            style={[styles.rigLayer, rightWingStyle]}
          />
          <Image
            resizeMode="contain"
            source={flightBody}
            style={[
              styles.rigLayer,
              {
                left: px(-139),
                top: px(-29),
                width: px(527),
                height: px(366),
              },
            ]}
          />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: px(75),
            top: px(35),
            width: px(210),
            height: px(307),
            opacity: landedOpacity,
            transform: [
              { translateX: Animated.multiply(laughX, unit) },
              { translateY: Animated.multiply(landedY, unit) },
              { rotate: laughRotate },
              { scaleX: landedScaleX },
              { scaleY: landedScaleY },
              { scale: laughScale },
            ],
          }}
        >
          <Image
            resizeMode="contain"
            source={laughing ? POLLY_POSES.laugh : POLLY_POSES.idle}
            style={[
              styles.landedImage,
              laughing && {
                left: px(6),
                top: px(59),
                width: px(198),
                height: px(257),
              },
            ]}
          />
        </Animated.View>
      </View>

      <Pressable
        accessibilityLabel="Replay Polly flight and landing"
        accessibilityRole="button"
        onPress={() => setReplayKey(value => value + 1)}
        style={({ pressed }) => [styles.replayButton, pressed && styles.pressed]}
      >
        <Text style={styles.replayText}>REPLAY FLIGHT + LANDING</Text>
      </Pressable>
      {reduceMotion ? (
        <Text style={styles.reduceMotionNote}>
          Reduce Motion is on, so this preview holds the final perch.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
  },
  statusRow: {
    width: '100%',
    minHeight: 26,
    paddingHorizontal: PW.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PW.space.sm,
  },
  statusLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  timingLabel: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  stage: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: PW.radius.lg,
    backgroundColor: PW.color.surfaceDeep,
  },
  flightLane: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    height: 1,
    opacity: 0.22,
    backgroundColor: PW.color.purpleSoft,
  },
  rigLayer: {
    position: 'absolute',
  },
  landedImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  replayButton: {
    minHeight: 46,
    marginTop: PW.space.md,
    paddingHorizontal: PW.space.lg,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayText: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 0.8,
  },
  reduceMotionNote: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 12,
    lineHeight: 18,
    marginTop: PW.space.sm,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});
