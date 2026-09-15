import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import DailyCastleScene from './DailyCastleScene';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type CycleState = { word: 'HIT' | 'HOOD'; clueCount: 1 | 3 };

const CYCLE: CycleState[] = [
  { word: 'HIT', clueCount: 1 },
  { word: 'HIT', clueCount: 3 },
  { word: 'HOOD', clueCount: 1 },
  { word: 'HOOD', clueCount: 3 },
];

// DEV-ONLY. Renders DailyCastleScene edge-to-edge (no SafeAreaView padding),
// same pattern as DailyTreeSceneDevViewer. Reachable only from Settings'
// Development section — DailyChallengeScreen.tsx is not touched by this
// prompt at all.
export function DailyCastleSceneDevViewer({ visible, onClose }: Props) {
  const [cycleIndex, setCycleIndex] = useState(0);
  const state = CYCLE[cycleIndex];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <View style={styles.screen}>
        <DailyCastleScene word={state.word} clueCount={state.clueCount} />
        <Pressable
          accessibilityLabel="Cycle Daily Castle scene preview"
          accessibilityRole="button"
          onPress={() => setCycleIndex((i) => (i + 1) % CYCLE.length)}
          style={styles.cycleTap}
        />
        <View style={styles.kickerWrap} pointerEvents="none">
          <Text style={styles.kicker}>
            DEVELOPMENT ONLY — DAILY CASTLE SCENE (STATIC LAYOUT){'\n'}
            {state.word} · {state.clueCount} CLUE{state.clueCount === 1 ? '' : 'S'}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Close Daily Castle scene preview"
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
  cycleTap: {
    ...StyleSheet.absoluteFill,
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
