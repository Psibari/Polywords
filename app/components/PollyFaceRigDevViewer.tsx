import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';

const baseArt = require('../../assets/images/polly/rig2/polly_base.png');
const beakArt = require('../../assets/images/polly/rig2/polly_beak.png');
const eyeArt = require('../../assets/images/polly/rig2/polly_eye.png');
const browArt = require('../../assets/images/polly/rig2/polly_brow.png');
const crownArt = require('../../assets/images/polly/rig2/polly_crown.png');

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Layer geometry for the rig2 face parts (all 283×413, same canvas —
// resizeMode="contain" at identical size aligns them with no coordinate
// maths). Pivots below are expressed as fractions of the stage size so each
// transform's translate-*-translate trick rotates/scales about the actual
// facial landmark rather than the canvas centre.
const STAGE_SIZE = 340;

// Estimate of the eye artwork's own vertical centre line, above the canvas
// centre — tune by eye against the live render and port the number once set.
const EYE_PIVOT_Y_FRAC = 0.12;
const EYE_CLOSED_SCALE = 0.05;
const BLINK_DOWN_MS = 90;
const BLINK_UP_MS = 110;
const BLINK_MIN_INTERVAL_MS = 2000;
const BLINK_MAX_INTERVAL_MS = 6000;
const BLINK_NUDGE_STEP = 0.05;

const BROW_MAX = 6;
const BROW_ROTATE_DEG = -7;
const BROW_TRANSITION_MS = 220;
const BROW_NUDGE_STEP = 1;

const CROWN_PIVOT_X_FRAC = 0.04;
const CROWN_PIVOT_Y_FRAC = 0.236;
const CROWN_ANGLE_MIN = -25;
const CROWN_ANGLE_MAX = 25;
const CROWN_TILT_RANGE = 8;
const CROWN_TILT_DURATION_MS = 1400;
const CROWN_NUDGE_STEP = 2;

const BREATHE_RANGE = -3;
const BREATHE_DURATION_MS = 1800;
const BREATHE_NUDGE_STEP = 0.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PollyFaceRigDevViewer({ visible, onClose }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const motionAllowed = reduceMotion === false;

  const blinkValue = useRef(new Animated.Value(1)).current;
  const browValue = useRef(new Animated.Value(0)).current;
  const crownValue = useRef(new Animated.Value(0)).current;
  const breatheValue = useRef(new Animated.Value(0)).current;

  const [blink, setBlink] = useState(1);
  const [brow, setBrow] = useState(0);
  const [crownAngle, setCrownAngle] = useState(0);
  const [breathe, setBreathe] = useState(0);

  const [blinkOn, setBlinkOn] = useState(false);
  const [browOn, setBrowOn] = useState(false);
  const [crownTiltOn, setCrownTiltOn] = useState(false);
  const [breatheOn, setBreatheOn] = useState(false);

  useEffect(() => {
    const id = blinkValue.addListener(({ value }) => setBlink(value));
    return () => blinkValue.removeListener(id);
  }, [blinkValue]);

  useEffect(() => {
    const id = browValue.addListener(({ value }) => setBrow(value));
    return () => browValue.removeListener(id);
  }, [browValue]);

  useEffect(() => {
    const id = crownValue.addListener(({ value }) => setCrownAngle(value));
    return () => crownValue.removeListener(id);
  }, [crownValue]);

  useEffect(() => {
    const id = breatheValue.addListener(({ value }) => setBreathe(value));
    return () => breatheValue.removeListener(id);
  }, [breatheValue]);

  // BLINK — random-interval squash/reopen while toggled on.
  useEffect(() => {
    if (!visible || !blinkOn || !motionAllowed) return;

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
  }, [visible, blinkOn, motionAllowed, blinkValue]);

  // BROW — holds the angry pose while toggled on, doesn't loop.
  useEffect(() => {
    const toValue = browOn ? BROW_MAX : 0;
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
  }, [browOn, motionAllowed, browValue]);

  // CROWN TILT — loops between ±CROWN_TILT_RANGE while toggled on.
  useEffect(() => {
    if (!visible || !crownTiltOn || !motionAllowed) return;

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
  }, [visible, crownTiltOn, motionAllowed, crownValue]);

  // BREATHE — whole-figure idle loop while toggled on.
  useEffect(() => {
    if (!visible || !breatheOn || !motionAllowed) return;

    breatheValue.stopAnimation();
    breatheValue.setValue(0);
    const swing = (toValue: number) =>
      Animated.timing(breatheValue, {
        toValue,
        duration: BREATHE_DURATION_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([swing(BREATHE_RANGE), swing(0)]));
    loop.start();

    return () => loop.stop();
  }, [visible, breatheOn, motionAllowed, breatheValue]);

  function nudgeBlink(delta: number) {
    if (blinkOn) return;
    blinkValue.setValue(clamp(blink + delta, EYE_CLOSED_SCALE, 1));
  }

  function nudgeBrow(delta: number) {
    browValue.setValue(clamp(brow + delta, 0, BROW_MAX));
  }

  function nudgeCrown(delta: number) {
    if (crownTiltOn) return;
    crownValue.setValue(clamp(crownAngle + delta, CROWN_ANGLE_MIN, CROWN_ANGLE_MAX));
  }

  function nudgeBreathe(delta: number) {
    if (breatheOn) return;
    breatheValue.setValue(clamp(breathe + delta, BREATHE_RANGE, 0));
  }

  function handleDump() {
    console.log('[PollyFaceRigDevViewer] drivers:', {
      blinkScaleY: +blink.toFixed(2),
      browOffsetPx: +brow.toFixed(1),
      crownAngleDeg: +crownAngle.toFixed(1),
      breatheYPx: +breathe.toFixed(2),
    }, 'pivots:', {
      stage: STAGE_SIZE,
      eyePivotYFrac: EYE_PIVOT_Y_FRAC,
      crownPivotXFrac: CROWN_PIVOT_X_FRAC,
      crownPivotYFrac: CROWN_PIVOT_Y_FRAC,
    });
  }

  const browRotateDeg = browValue.interpolate({
    inputRange: [0, BROW_MAX],
    outputRange: ['0deg', `${BROW_ROTATE_DEG}deg`],
  });
  const crownSpinDeg = crownValue.interpolate({
    inputRange: [CROWN_ANGLE_MIN, CROWN_ANGLE_MAX],
    outputRange: [`${CROWN_ANGLE_MIN}deg`, `${CROWN_ANGLE_MAX}deg`],
  });

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.screen} accessibilityViewIsModal>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>DEVELOPMENT ONLY</Text>
            <Text style={styles.title}>POLLY FACE RIG TEST</Text>
          </View>
          <Pressable
            accessibilityLabel="Close Polly face rig test"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Five layers — base, beak, eye, brow, crown — each driven independently. Toggle a
          driver to run its motion, nudge to hand-tune the value while paused, then dump the
          numbers to port them.
        </Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stageWrap}>
            <Animated.View style={[styles.stage, { transform: [{ translateY: breatheValue }] }]}>
              <Image source={baseArt} resizeMode="contain" style={styles.layer} />
              <Animated.Image source={beakArt} resizeMode="contain" style={styles.layer} />
              <Animated.Image
                source={eyeArt}
                resizeMode="contain"
                style={[
                  styles.layer,
                  {
                    transform: [
                      { translateY: -EYE_PIVOT_Y_FRAC * STAGE_SIZE },
                      { scaleY: blinkValue },
                      { translateY: EYE_PIVOT_Y_FRAC * STAGE_SIZE },
                    ],
                  },
                ]}
              />
              <Animated.Image
                source={browArt}
                resizeMode="contain"
                style={[
                  styles.layer,
                  { transform: [{ translateY: browValue }, { rotate: browRotateDeg }] },
                ]}
              />
              <Animated.Image
                source={crownArt}
                resizeMode="contain"
                style={[
                  styles.layer,
                  {
                    transform: [
                      { translateX: -CROWN_PIVOT_X_FRAC * STAGE_SIZE },
                      { translateY: -CROWN_PIVOT_Y_FRAC * STAGE_SIZE },
                      { rotate: crownSpinDeg },
                      { translateX: CROWN_PIVOT_X_FRAC * STAGE_SIZE },
                      { translateY: CROWN_PIVOT_Y_FRAC * STAGE_SIZE },
                    ],
                  },
                ]}
              />
            </Animated.View>
          </View>

          <View style={styles.controls}>
            <View style={styles.groupCard}>
              <View style={styles.groupRow}>
                <Text style={styles.groupTitle}>BLINK</Text>
                {motionAllowed ? (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel="Toggle looping blink animation"
                    accessibilityState={{ checked: blinkOn }}
                    onPress={() => setBlinkOn(prev => !prev)}
                    style={[styles.toggleTrack, blinkOn && styles.toggleTrackOn]}
                  >
                    <View style={[styles.toggleKnob, blinkOn && styles.toggleKnobOn]} />
                  </Pressable>
                ) : (
                  <Text style={styles.reduceMotionNote}>Reduce Motion — nudge only</Text>
                )}
              </View>
              <View style={styles.groupRow}>
                <Text style={styles.controlLabel}>EYE SCALE Y — {blink.toFixed(2)}</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge eye more closed"
                    disabled={blinkOn}
                    onPress={() => nudgeBlink(-BLINK_NUDGE_STEP)}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      blinkOn && styles.stepperButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepperText}>−</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge eye more open"
                    disabled={blinkOn}
                    onPress={() => nudgeBlink(BLINK_NUDGE_STEP)}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      blinkOn && styles.stepperButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.groupCard}>
              <View style={styles.groupRow}>
                <Text style={styles.groupTitle}>BROW (ANGRY)</Text>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityLabel="Toggle angry brow pose"
                  accessibilityState={{ checked: browOn }}
                  onPress={() => setBrowOn(prev => !prev)}
                  style={[styles.toggleTrack, browOn && styles.toggleTrackOn]}
                >
                  <View style={[styles.toggleKnob, browOn && styles.toggleKnobOn]} />
                </Pressable>
              </View>
              <View style={styles.groupRow}>
                <Text style={styles.controlLabel}>BROW OFFSET — {brow.toFixed(1)}px</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge brow toward neutral"
                    onPress={() => nudgeBrow(-BROW_NUDGE_STEP)}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.stepperText}>−</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge brow toward angry"
                    onPress={() => nudgeBrow(BROW_NUDGE_STEP)}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.groupCard}>
              <View style={styles.groupRow}>
                <Text style={styles.groupTitle}>CROWN TILT</Text>
                {motionAllowed ? (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel="Toggle looping crown tilt animation"
                    accessibilityState={{ checked: crownTiltOn }}
                    onPress={() => setCrownTiltOn(prev => !prev)}
                    style={[styles.toggleTrack, crownTiltOn && styles.toggleTrackOn]}
                  >
                    <View style={[styles.toggleKnob, crownTiltOn && styles.toggleKnobOn]} />
                  </Pressable>
                ) : (
                  <Text style={styles.reduceMotionNote}>Reduce Motion — nudge only</Text>
                )}
              </View>
              <View style={styles.groupRow}>
                <Text style={styles.controlLabel}>CROWN ANGLE — {crownAngle.toFixed(1)}°</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge crown counter-clockwise"
                    disabled={crownTiltOn}
                    onPress={() => nudgeCrown(-CROWN_NUDGE_STEP)}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      crownTiltOn && styles.stepperButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepperText}>−</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge crown clockwise"
                    disabled={crownTiltOn}
                    onPress={() => nudgeCrown(CROWN_NUDGE_STEP)}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      crownTiltOn && styles.stepperButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.groupCard}>
              <View style={styles.groupRow}>
                <Text style={styles.groupTitle}>BREATHE</Text>
                {motionAllowed ? (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel="Toggle looping breathe animation"
                    accessibilityState={{ checked: breatheOn }}
                    onPress={() => setBreatheOn(prev => !prev)}
                    style={[styles.toggleTrack, breatheOn && styles.toggleTrackOn]}
                  >
                    <View style={[styles.toggleKnob, breatheOn && styles.toggleKnobOn]} />
                  </Pressable>
                ) : (
                  <Text style={styles.reduceMotionNote}>Reduce Motion — nudge only</Text>
                )}
              </View>
              <View style={styles.groupRow}>
                <Text style={styles.controlLabel}>BREATHE Y — {breathe.toFixed(2)}px</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge breathe further up"
                    disabled={breatheOn}
                    onPress={() => nudgeBreathe(-BREATHE_NUDGE_STEP)}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      breatheOn && styles.stepperButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepperText}>−</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nudge breathe toward rest"
                    disabled={breatheOn}
                    onPress={() => nudgeBreathe(BREATHE_NUDGE_STEP)}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      breatheOn && styles.stepperButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dump current driver values and pivot constants to console"
              onPress={handleDump}
              style={({ pressed }) => [styles.dumpButton, pressed && styles.pressed]}
            >
              <Text style={styles.dumpText}>DUMP</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
  },
  header: {
    minHeight: 92,
    paddingHorizontal: PW.space.lg,
    paddingTop: PW.space.md,
    paddingBottom: PW.space.md,
    borderBottomWidth: 1,
    borderBottomColor: PW.color.purpleSoft,
    backgroundColor: PW.color.surfaceDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PW.space.md,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: PW.space.xs,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 24,
    letterSpacing: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 30,
    lineHeight: 32,
  },
  note: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: PW.space.lg,
    paddingTop: PW.space.lg,
  },
  content: {
    paddingBottom: PW.space.xxl,
  },
  stageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PW.space.lg,
  },
  stage: {
    width: STAGE_SIZE,
    height: STAGE_SIZE,
  },
  layer: {
    position: 'absolute',
    width: STAGE_SIZE,
    height: STAGE_SIZE,
  },
  controls: {
    paddingHorizontal: PW.space.lg,
    gap: PW.space.md,
  },
  groupCard: {
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    borderRadius: PW.radius.lg,
    padding: PW.space.md,
    gap: PW.space.sm,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 1,
  },
  controlLabel: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  reduceMotionNote: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: PW.space.sm,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: PW.radius.md,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 20,
    lineHeight: 22,
  },
  dumpButton: {
    alignSelf: 'center',
    paddingHorizontal: PW.space.lg,
    paddingVertical: PW.space.sm,
    borderRadius: PW.radius.md,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    marginTop: PW.space.sm,
  },
  dumpText: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: PW.color.purpleSoft,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: PW.color.goldGlow,
    borderColor: PW.color.goldSoft,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PW.color.transparentWhite,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
    backgroundColor: PW.color.gold,
  },
  pressed: {
    opacity: 0.8,
  },
});
