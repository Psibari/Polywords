import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const gauntletSpineArt = require('../../assets/images/gauntlet/spine.png');

// Matches BossGauntletSpines.tsx's real slot dimensions exactly — the
// point of this viewer is to preview the actual art at the actual size
// it renders in-game, not a stand-in.
const SPINE_WIDTH = 110;
const SPINE_HEIGHT = 200;

const SCALE_STEP = 0.05;
const SCALE_MIN = 0.5;
const SCALE_MAX = 2;
const OFFSET_STEP = 4;

export function GauntletSpineDevViewer({ visible, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  function nudgeScale(delta: number) {
    setScale(prev => Math.min(SCALE_MAX, Math.max(SCALE_MIN, +(prev + delta).toFixed(2))));
  }

  function reset() {
    setScale(1);
    setOffsetY(0);
  }

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
            <Text style={styles.title}>GAUNTLET SPINE SIZER</Text>
          </View>
          <Pressable
            accessibilityLabel="Close gauntlet spine sizer"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Same slot size (110×200) the real gauntlet row uses. Tune scale/position here,
          then report the numbers back — this viewer doesn't write to the live component itself.
        </Text>

        <View style={styles.row}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.slot}>
              <Image
                source={gauntletSpineArt}
                contentFit="contain"
                style={{
                  width: SPINE_WIDTH,
                  height: SPINE_HEIGHT,
                  transform: [{ scale }, { translateY: offsetY }],
                }}
              />
            </View>
          ))}
        </View>

        <View style={styles.controls}>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>SCALE — {scale.toFixed(2)}x</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease scale"
                onPress={() => nudgeScale(-SCALE_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase scale"
                onPress={() => nudgeScale(SCALE_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>VERTICAL — {offsetY}px</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nudge up"
                onPress={() => setOffsetY(prev => prev - OFFSET_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>↑</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nudge down"
                onPress={() => setOffsetY(prev => prev + OFFSET_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>↓</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset scale and position"
            onPress={reset}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Text style={styles.resetText}>RESET</Text>
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
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: PW.space.xs,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
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
    fontSize: 30,
    lineHeight: 32,
  },
  note: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
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
    gap: PW.space.md,
  },
  slot: {
    width: SPINE_WIDTH,
    height: SPINE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    borderStyle: 'dashed',
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
    fontSize: 15,
    letterSpacing: 0.6,
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
  stepperText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
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
    fontSize: 13,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
