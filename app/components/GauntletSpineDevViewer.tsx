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
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { heroBookMaterial } from '../ui/pwMaterials';
import { CARD_WIDTH, CARD_CLOSED_HEIGHT, CARD_MARKER_COLORS } from './BossGauntletSpines';

const crownMarkerArt = require('../../assets/images/gauntlet/crown-marker.png');

type Props = {
  visible: boolean;
  onClose: () => void;
};

// This used to tune a stretched spine PNG's scale/position — that job no
// longer exists (BossGauntletSpines.tsx, 2026-08-15: cut the standing spine
// for a card-shaped, code-drawn closed face, no image asset at all). What's
// genuinely still un-sized is the crown identity marker (real artwork
// landed 2026-08-15) — so this viewer now previews the real card recipe
// live (same gradient/border tokens as the live component, imported, not
// duplicated) with the scale/position controls sizing the actual crown art.
const SCALE_STEP = 0.05;
const SCALE_MIN = 0.5;
const SCALE_MAX = 2;
const OFFSET_STEP = 4;

export function GauntletSpineDevViewer({ visible, onClose }: Props) {
  const [markerScale, setMarkerScale] = useState(1);
  const [markerOffsetY, setMarkerOffsetY] = useState(0);

  function nudgeScale(delta: number) {
    setMarkerScale(prev => Math.min(SCALE_MAX, Math.max(SCALE_MIN, +(prev + delta).toFixed(2))));
  }

  function reset() {
    setMarkerScale(1);
    setMarkerOffsetY(0);
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
            <Text style={styles.title}>GAUNTLET CARD MARKER SIZER</Text>
          </View>
          <Pressable
            accessibilityLabel="Close gauntlet card marker sizer"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Live preview of the real closed-card recipe (same gradient/border tokens the actual
          gauntlet row uses, {CARD_WIDTH}×{CARD_CLOSED_HEIGHT}). Controls below size/position the
          identity marker only — swap the colored dot for real crown artwork once it lands, then
          tune it here and report the numbers back.
        </Text>

        <View style={styles.row}>
          {CARD_MARKER_COLORS.map((color, i) => (
            <View key={i} style={styles.slot}>
              <LinearGradient
                colors={[
                  heroBookMaterial.coverPurpleTop,
                  heroBookMaterial.coverPurple,
                  heroBookMaterial.coverPurpleBot,
                ]}
                style={styles.card}
              >
                <Image
                  source={crownMarkerArt}
                  contentFit="contain"
                  tintColor={color}
                  style={[
                    styles.marker,
                    {
                      transform: [{ scale: markerScale }, { translateY: markerOffsetY }],
                    },
                  ]}
                />
              </LinearGradient>
            </View>
          ))}
        </View>

        <View style={styles.controls}>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>MARKER SCALE — {markerScale.toFixed(2)}x</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease marker scale"
                onPress={() => nudgeScale(-SCALE_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase marker scale"
                onPress={() => nudgeScale(SCALE_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>MARKER VERTICAL — {markerOffsetY}px</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nudge marker up"
                onPress={() => setMarkerOffsetY(prev => prev - OFFSET_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>↑</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nudge marker down"
                onPress={() => setMarkerOffsetY(prev => prev + OFFSET_STEP)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              >
                <Text style={styles.stepperText}>↓</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset marker scale and position"
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
    gap: PW.space.md,
  },
  slot: {
    width: CARD_WIDTH,
    height: CARD_CLOSED_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    borderStyle: 'dashed',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_CLOSED_HEIGHT,
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: heroBookMaterial.goldHairline,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 84,
    height: 54,
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
  pressed: {
    opacity: 0.8,
  },
});
