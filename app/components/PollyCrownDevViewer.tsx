import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';

const baseArt = require('../../assets/images/polly/polly_perch_nocrown.png');
const crownArt = require('../../assets/images/polly/polly_crown.png');

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Layer geometry for polly_perch_nocrown.png / polly_crown.png (both 283×413,
// same canvas — resizeMode="contain" at identical size aligns them with no
// coordinate math). The crown must rotate about the base of its band, not the
// canvas centre, so the pivot is expressed as a fraction of the stage size.
const STAGE_SIZE = 320;
const PIVOT_X_FRAC = 0.04;
const PIVOT_Y_FRAC = 0.236;
const NUDGE_STEP = 2;
const ANGLE_MIN = -25;
const ANGLE_MAX = 25;
const TILT_RANGE = 8;
const TILT_DURATION_MS = 1400;

function clampAngle(value: number) {
  return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, value));
}

export function PollyCrownDevViewer({ visible, onClose }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const motionAllowed = reduceMotion === false;

  const spin = useRef(new Animated.Value(0)).current;
  const [angle, setAngle] = useState(0);
  const [tiltOn, setTiltOn] = useState(false);

  useEffect(() => {
    const id = spin.addListener(({ value }) => setAngle(value));
    return () => spin.removeListener(id);
  }, [spin]);

  useEffect(() => {
    if (!visible || !tiltOn || !motionAllowed) return;

    spin.stopAnimation();
    spin.setValue(-TILT_RANGE);
    const swing = (toValue: number) =>
      Animated.timing(spin, {
        toValue,
        duration: TILT_DURATION_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([swing(TILT_RANGE), swing(-TILT_RANGE)]));
    loop.start();

    return () => loop.stop();
  }, [visible, tiltOn, motionAllowed, spin]);

  function toggleTilt() {
    if (!motionAllowed) return;
    setTiltOn(prev => !prev);
  }

  function nudge(delta: number) {
    if (tiltOn) return;
    spin.setValue(clampAngle(angle + delta));
  }

  function handleDump() {
    console.log('[PollyCrownDevViewer] angle:', `${angle.toFixed(1)}deg`, 'pivot:', {
      stage: STAGE_SIZE,
      pivotXFrac: PIVOT_X_FRAC,
      pivotYFrac: PIVOT_Y_FRAC,
    });
  }

  const spinDeg = spin.interpolate({
    inputRange: [ANGLE_MIN, ANGLE_MAX],
    outputRange: [`${ANGLE_MIN}deg`, `${ANGLE_MAX}deg`],
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
            <Text style={styles.title}>POLLY CROWN LAYER TEST</Text>
          </View>
          <Pressable
            accessibilityLabel="Close Polly crown layer test"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Crown rendered as its own layer over the crownless perch pose. Tilt rotates the crown
          about the base of its band, independent of Polly's body.
        </Text>

        <View style={styles.row}>
          <View style={styles.stage}>
            <Image source={baseArt} resizeMode="contain" style={styles.layer} />
            <Animated.Image
              source={crownArt}
              resizeMode="contain"
              style={[
                styles.layer,
                {
                  transform: [
                    { translateX: -PIVOT_X_FRAC * STAGE_SIZE },
                    { translateY: -PIVOT_Y_FRAC * STAGE_SIZE },
                    { rotate: spinDeg },
                    { translateX: PIVOT_X_FRAC * STAGE_SIZE },
                    { translateY: PIVOT_Y_FRAC * STAGE_SIZE },
                  ],
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.controls}>
          {motionAllowed ? (
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>TILT LOOP</Text>
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Toggle looping tilt animation"
                accessibilityState={{ checked: tiltOn }}
                onPress={toggleTilt}
                style={[styles.toggleTrack, tiltOn && styles.toggleTrackOn]}
              >
                <View style={[styles.toggleKnob, tiltOn && styles.toggleKnobOn]} />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.reduceMotionNote}>Reduce Motion is on — nudge only.</Text>
          )}

          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>ANGLE — {angle.toFixed(1)}°</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nudge crown counter-clockwise"
                disabled={tiltOn}
                onPress={() => nudge(-NUDGE_STEP)}
                style={({ pressed }) => [
                  styles.stepperButton,
                  tiltOn && styles.stepperButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nudge crown clockwise"
                disabled={tiltOn}
                onPress={() => nudge(NUDGE_STEP)}
                style={({ pressed }) => [
                  styles.stepperButton,
                  tiltOn && styles.stepperButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dump current angle and pivot constants to console"
            onPress={handleDump}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Text style={styles.resetText}>DUMP</Text>
          </Pressable>
        </View>
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
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: PW.space.xxl,
    paddingTop: PW.space.md,
    gap: PW.space.lg,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 0.6,
  },
  reduceMotionNote: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: PW.space.sm,
  },
  stepperButton: {
    width: 44,
    height: 44,
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
    fontSize: 22,
    lineHeight: 24,
  },
  resetButton: {
    alignSelf: 'center',
    paddingHorizontal: PW.space.lg,
    paddingVertical: PW.space.sm,
    borderRadius: PW.radius.md,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
  },
  resetText: {
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
