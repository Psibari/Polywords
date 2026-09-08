import React, { useState } from 'react';
import {
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
import { PW } from '../ui/pwTheme';
import { PollyFlightLandingAnimation } from './PollyFlightLandingAnimation';
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

export function PollyAnimationDevViewer({ visible, onClose }: Props) {
  const [flightReplayKey, setFlightReplayKey] = useState(0);

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

        <Text style={styles.note}>
          Five isolated whole-image loops plus the new flight-rig landing sequence. Motion follows the device Reduce Motion setting.
        </Text>

        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
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

          <View style={[styles.preview, styles.flightPreview]}>
            <View style={[styles.stage, styles.flightStage]}>
              {visible ? (
                <PollyFlightLandingAnimation
                  key={flightReplayKey}
                  active
                  accessibilityLabel="Polly flight rig landing preview"
                  size={190}
                />
              ) : null}
            </View>
            <Text style={styles.previewLabel}>Flight → Land → Laugh</Text>
            <Pressable
              accessibilityLabel="Replay Polly flight landing animation"
              accessibilityRole="button"
              onPress={() => setFlightReplayKey(value => value + 1)}
              style={({ pressed }) => [styles.replayButton, pressed && styles.pressed]}
            >
              <Text style={styles.replayText}>REPLAY</Text>
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
  grid: {
    padding: PW.space.lg,
    paddingBottom: PW.space.xxl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: PW.space.md,
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
    minHeight: 286,
  },
  flightStage: {
    minHeight: 220,
    overflow: 'hidden',
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
  replayButton: {
    alignSelf: 'center',
    minWidth: 112,
    minHeight: 40,
    marginBottom: PW.space.md,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: PW.space.md,
  },
  replayText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
