import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { HuntBookV2PrototypeBook } from './HuntBookV2PrototypeBook';
import {
  HUNT_BOOK_V2_GEOMETRY as G,
  HUNT_BOOK_V2_STATES,
  HUNT_BOOK_V2_TEXT_SCALES,
  HUNT_BOOK_V2_WORDS,
} from './huntBookV2PrototypeGeometry';

type Props = {
  visible: boolean;
  onClose: () => void;
};

function nextIndex(current: number, length: number): number {
  return (current + 1) % length;
}

export function HuntBookV2PrototypeDevViewer({ visible, onClose }: Props) {
  const [wordIndex, setWordIndex] = useState(0);
  const [stateIndex, setStateIndex] = useState(0);
  const [textScaleIndex, setTextScaleIndex] = useState(1);
  const coverProgress = useRef(new Animated.Value(0)).current;

  const selectedState = HUNT_BOOK_V2_STATES[stateIndex];
  const selectedWord = HUNT_BOOK_V2_WORDS[wordIndex];
  const selectedTextScale = HUNT_BOOK_V2_TEXT_SCALES[textScaleIndex];

  useEffect(() => {
    if (!visible) return;
    const animation = Animated.timing(coverProgress, {
      toValue: selectedState.progress,
      duration: 260,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [coverProgress, selectedState.progress, visible]);

  useEffect(() => {
    if (!visible) {
      coverProgress.setValue(0);
      setStateIndex(0);
    }
  }, [coverProgress, visible]);

  const coverRotateX = coverProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '65deg'],
    extrapolate: 'clamp',
  });
  const intakeOpacity = coverProgress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.35, 1],
    extrapolate: 'clamp',
  });
  const intakeScaleY = coverProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
    extrapolate: 'clamp',
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
            <Text style={styles.title}>HUNT BOOK V2 PROTOTYPE</Text>
          </View>
          <Pressable
            accessibilityLabel="Close Hunt Book V2 prototype"
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
          <Text style={styles.note}>
            Isolated SVG prototype. Live Hunt is unchanged. Width stays locked while the book grows vertically.
          </Text>

          <View style={styles.commandStage}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageEyebrow}>COMMAND STAGE</Text>
              <Text style={styles.stageState}>{selectedState.label}</Text>
            </View>

            <View style={styles.bookFrame}>
              <HuntBookV2PrototypeBook
                coverRotateX={coverRotateX}
                intakeOpacity={intakeOpacity}
                intakeScaleY={intakeScaleY}
                word={selectedWord}
                textScale={selectedTextScale}
              />
            </View>

            <View pointerEvents="none" style={styles.cardRegion}>
              <Text style={styles.cardRegionLabel}>CARD INTAKE REGION</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <View style={styles.controlCopy}>
                <Text style={styles.controlLabel}>WORD</Text>
                <Text style={styles.controlValue}>{selectedWord}</Text>
              </View>
              <Pressable
                accessibilityLabel="Cycle prototype word"
                accessibilityRole="button"
                onPress={() => setWordIndex(index => nextIndex(index, HUNT_BOOK_V2_WORDS.length))}
                style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
              >
                <Text style={styles.controlButtonText}>NEXT WORD</Text>
              </Pressable>
            </View>

            <View style={styles.controlRow}>
              <View style={styles.controlCopy}>
                <Text style={styles.controlLabel}>BOOK STATE</Text>
                <Text style={styles.controlValue}>{selectedState.label}</Text>
              </View>
              <Pressable
                accessibilityLabel="Cycle prototype book state"
                accessibilityRole="button"
                onPress={() => setStateIndex(index => nextIndex(index, HUNT_BOOK_V2_STATES.length))}
                style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
              >
                <Text style={styles.controlButtonText}>NEXT STATE</Text>
              </Pressable>
            </View>

            <View style={styles.controlRow}>
              <View style={styles.controlCopy}>
                <Text style={styles.controlLabel}>TEXT SCALE</Text>
                <Text style={styles.controlValue}>{Math.round(selectedTextScale * 100)}%</Text>
              </View>
              <Pressable
                accessibilityLabel="Cycle prototype text scale"
                accessibilityRole="button"
                onPress={() => setTextScaleIndex(index => nextIndex(index, HUNT_BOOK_V2_TEXT_SCALES.length))}
                style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
              >
                <Text style={styles.controlButtonText}>NEXT SCALE</Text>
              </Pressable>
            </View>
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
    letterSpacing: 0.8,
  },
  closeButton: {
    width: 48,
    height: 48,
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
    paddingHorizontal: PW.space.lg,
    paddingTop: PW.space.lg,
    paddingBottom: PW.space.xxl,
  },
  note: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: PW.space.md,
  },
  commandStage: {
    width: '100%',
    minHeight: 486,
    borderRadius: PW.radius.xl,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.bgDeep,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
  },
  stageHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stageEyebrow: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  stageState: {
    color: PW.color.lavender,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 1.1,
  },
  bookFrame: {
    width: '100%',
    maxWidth: 390,
    height: G.viewBoxHeight,
    position: 'relative',
    alignSelf: 'center',
    overflow: 'visible',
  },
  cardRegion: {
    width: '88%',
    minHeight: 116,
    marginTop: 26,
    borderRadius: PW.radius.card,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRegionLabel: {
    color: PW.color.faintWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  controls: {
    marginTop: PW.space.md,
    borderRadius: PW.radius.xl,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.overlayHeavy,
    overflow: 'hidden',
  },
  controlRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PW.space.md,
    paddingHorizontal: PW.space.md,
    paddingVertical: PW.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PW.color.borderMuted,
  },
  controlCopy: {
    flex: 1,
    minWidth: 0,
  },
  controlLabel: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  controlValue: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  controlButton: {
    minWidth: 112,
    minHeight: 48,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRimStrong,
    backgroundColor: PW.color.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  controlButtonText: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.78,
  },
});
