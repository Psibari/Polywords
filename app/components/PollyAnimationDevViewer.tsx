import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PollyPoseAnimationName } from '../animations/pollyPoseAnimations';
import { FONTS } from '../constants/fonts';
import {
  POLLY_ACTING_SPRITE_LABELS,
  POLLY_ACTING_SPRITE_ORDER,
  POLLY_ACTING_SPRITES,
  POLLY_LAUGH_FRAME_MS,
  POLLY_LAUGH_SEQUENCE,
} from '../ui/pollyActingSprites';
import { PW } from '../ui/pwTheme';
import { PollyFlightLandingPrototype } from './PollyFlightLandingPrototype';
import { PollyPerchRig } from './PollyPerchRig';
import { PollyPoseAnimation } from './PollyPoseAnimation';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PREVIEWS: Array<{
  animation: PollyPoseAnimationName;
  label: string;
}> = [
  { animation: 'idle', label: 'Idle' },
  { animation: 'angry', label: 'Angry' },
  { animation: 'point', label: 'Point' },
  { animation: 'surprised', label: 'Surprised' },
  { animation: 'flying', label: 'Flying' },
];

const ACTING_PREVIEW_WIDTH = 150;
const ACTING_PREVIEW_HEIGHT = Math.round(ACTING_PREVIEW_WIDTH * (1515 / 1038));

export function PollyAnimationDevViewer({ visible, onClose }: Props) {
  const [laughFrameIndex, setLaughFrameIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setLaughFrameIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setLaughFrameIndex(index => (index + 1) % POLLY_LAUGH_SEQUENCE.length);
    }, POLLY_LAUGH_FRAME_MS);

    return () => clearInterval(timer);
  }, [visible]);

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
            <Text style={styles.title}>POLLY MOTION LAB</Text>
          </View>
          <Pressable
            accessibilityLabel="Close Polly animation viewer"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>NEW ACTING SPRITES</Text>
          <Text style={styles.note}>
            These are the normalized 1038 × 1515 production candidates. Home's existing neutral/smug blink rig is untouched in this patch.
          </Text>

          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>HOME RIG ↔ NEW NEUTRAL SCALE CHECK</Text>
            <View style={styles.compareRow}>
              <View style={styles.compareCell}>
                <View style={styles.rigStage}>
                  <PollyPerchRig size={170} reduceMotion={false} />
                </View>
                <Text style={styles.previewLabel}>Current Home Rig</Text>
              </View>
              <View style={styles.compareCell}>
                <Image
                  source={POLLY_ACTING_SPRITES.neutral}
                  resizeMode="contain"
                  style={styles.compareSprite}
                />
                <Text style={styles.previewLabel}>New Neutral</Text>
              </View>
            </View>
          </View>

          <View style={styles.laughCard}>
            <Text style={styles.compareTitle}>LAUGH 01 → 02 → 03</Text>
            <Image
              source={POLLY_LAUGH_SEQUENCE[laughFrameIndex]}
              resizeMode="contain"
              style={styles.laughSprite}
            />
            <Text style={styles.frameReadout}>Frame {laughFrameIndex + 1} / 3 · {POLLY_LAUGH_FRAME_MS} ms</Text>
          </View>

          <View style={styles.grid}>
            {POLLY_ACTING_SPRITE_ORDER.map(name => (
              <View key={name} style={styles.actingPreview}>
                <Image
                  source={POLLY_ACTING_SPRITES[name]}
                  resizeMode="contain"
                  style={styles.actingSprite}
                />
                <Text style={styles.previewLabel}>{POLLY_ACTING_SPRITE_LABELS[name]}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, styles.legacyTitle]}>LEGACY MOTION REFERENCES</Text>
          <Text style={styles.note}>
            Existing prototypes remain here for comparison only. They are not the new acting-sprite production mapping.
          </Text>

          <View style={[styles.preview, styles.flightPreview]}>
            <PollyFlightLandingPrototype active={visible} />
          </View>

          <View style={styles.grid}>
            {PREVIEWS.map(({ animation, label }) => (
              <View key={animation} style={styles.preview}>
                <View style={styles.stage}>
                  <PollyPoseAnimation
                    active={visible}
                    accessibilityLabel={`Polly ${label.toLowerCase()} animation`}
                    animation={animation}
                    size={142}
                  />
                </View>
                <Text style={styles.previewLabel}>{label}</Text>
              </View>
            ))}
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
  content: {
    padding: PW.space.lg,
    paddingBottom: PW.space.xxl,
  },
  sectionTitle: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    letterSpacing: 1,
    marginBottom: PW.space.xs,
  },
  legacyTitle: {
    marginTop: PW.space.xl,
  },
  note: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: PW.space.lg,
  },
  compareCard: {
    borderRadius: PW.radius.xl,
    borderWidth: 1,
    borderColor: PW.color.goldSoft,
    backgroundColor: PW.color.overlayHeavy,
    padding: PW.space.md,
    marginBottom: PW.space.md,
  },
  compareTitle: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: PW.space.sm,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  compareCell: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rigStage: {
    width: 170,
    height: ACTING_PREVIEW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compareSprite: {
    width: ACTING_PREVIEW_WIDTH,
    height: ACTING_PREVIEW_HEIGHT,
  },
  laughCard: {
    minHeight: 310,
    borderRadius: PW.radius.xl,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.overlayHeavy,
    padding: PW.space.md,
    marginBottom: PW.space.md,
    alignItems: 'center',
  },
  laughSprite: {
    width: 190,
    height: Math.round(190 * (1515 / 1038)),
  },
  frameReadout: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 13,
    marginTop: PW.space.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: PW.space.md,
  },
  actingPreview: {
    width: '47.5%',
    minHeight: ACTING_PREVIEW_HEIGHT + 46,
    borderRadius: PW.radius.xl,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.overlayHeavy,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  actingSprite: {
    width: ACTING_PREVIEW_WIDTH,
    height: ACTING_PREVIEW_HEIGHT,
  },
  preview: {
    width: '47.5%',
    minHeight: 190,
    borderRadius: PW.radius.xl,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.overlayHeavy,
    overflow: 'hidden',
  },
  stage: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightPreview: {
    width: '100%',
    minHeight: 430,
    padding: PW.space.sm,
    paddingBottom: PW.space.lg,
    borderColor: PW.color.goldSoft,
    overflow: 'hidden',
    marginBottom: PW.space.md,
  },
  previewLabel: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 0.8,
    textAlign: 'center',
    paddingHorizontal: PW.space.sm,
    paddingBottom: PW.space.md,
  },
  pressed: {
    opacity: 0.8,
  },
});
