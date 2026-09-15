import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import DailyTreeScene from './DailyTreeScene';

type Props = {
  visible: boolean;
  onClose: () => void;
};

// DEV-ONLY. Renders DailyTreeScene edge-to-edge (no SafeAreaView padding) so
// the percentage bands from DAILY_TREE_DESIGN_2026-09-14 (1).md §4 measure
// against the true screen height, same as they will wherever this scene is
// eventually wired into live play. Reachable only from Settings' Development
// section — DailyChallengeScreen.tsx is not touched by this prompt at all
// (see app/screens/dailyDevControls.test.mjs, which forbids Daily from
// wiring dev-tuning panels directly).
export function DailyTreeSceneDevViewer({ visible, onClose }: Props) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <View style={styles.screen}>
        <DailyTreeScene />
        <View style={styles.kickerWrap} pointerEvents="none">
          <Text style={styles.kicker}>DEVELOPMENT ONLY — DAILY TREE SCENE (STATIC LAYOUT)</Text>
        </View>
        <Pressable
          accessibilityLabel="Close Daily Tree scene preview"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
  },
  kickerWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 56,
  },
  kicker: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
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
    fontSize: 26,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.8,
  },
});
