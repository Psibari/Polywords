import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import DailyCastleScene, { CASTLE_LAYOUT_DEFAULTS, CastleLayout } from './DailyCastleScene';

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

type TunableKey =
  | 'pollySizePct'
  | 'pollyTopPct'
  | 'boardWidthPct'
  | 'boardTopPct'
  | 'cardRow1TopPct'
  | 'cardRowStepPct'
  | 'clueMaxFontPct';

const TUNE_ROWS: { key: TunableKey; label: string; step: number; max?: number }[] = [
  { key: 'pollySizePct', label: 'Polly size', step: 0.01 },
  { key: 'pollyTopPct', label: 'Polly height', step: 0.005 },
  { key: 'boardWidthPct', label: 'Board size', step: 0.01, max: 1.0 },
  { key: 'boardTopPct', label: 'Board height', step: 0.005 },
  { key: 'cardRow1TopPct', label: 'Cards height', step: 0.005 },
  { key: 'cardRowStepPct', label: 'Card spacing', step: 0.002 },
  { key: 'clueMaxFontPct', label: 'Clue max size', step: 0.002 },
];

// DEV-ONLY. Renders DailyCastleScene edge-to-edge (no SafeAreaView padding),
// same pattern as DailyTreeSceneDevViewer, plus an on-device tuning panel
// for the screen-fraction layout values so Pete can dial CASTLE_LAYOUT_DEFAULTS
// in without a rebuild. Reachable only from Settings' Development section —
// DailyChallengeScreen.tsx is not touched by this prompt at all.
export function DailyCastleSceneDevViewer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [cycleIndex, setCycleIndex] = useState(0);
  const [layout, setLayout] = useState<CastleLayout>({ ...CASTLE_LAYOUT_DEFAULTS });
  const [panelHidden, setPanelHidden] = useState(false);
  const [clueFit, setClueFit] = useState<{ fontSize: number; overflowAtFloor: boolean }>({
    fontSize: 0,
    overflowAtFloor: false,
  });
  const state = CYCLE[cycleIndex];

  function adjust(key: TunableKey, delta: number, max?: number) {
    setLayout((prev) => {
      const next = prev[key] + delta;
      return { ...prev, [key]: max !== undefined ? Math.min(max, next) : next };
    });
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <View style={styles.screen}>
        <DailyCastleScene
          word={state.word}
          clueCount={state.clueCount}
          layout={layout}
          onClueFit={(fontSize, overflowAtFloor) => setClueFit({ fontSize, overflowAtFloor })}
        />
        <Pressable
          accessibilityLabel="Cycle Daily Castle scene preview"
          accessibilityRole="button"
          onPress={() => setCycleIndex((i) => (i + 1) % CYCLE.length)}
          style={styles.cycleTap}
        />
        <View style={[styles.kickerWrap, { top: insets.top + 8 }]} pointerEvents="none">
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

        {panelHidden ? (
          <Pressable
            accessibilityLabel="Show Daily Castle tuning panel"
            accessibilityRole="button"
            onPress={() => setPanelHidden(false)}
            style={[styles.tuneReopenButton, { bottom: insets.bottom + 8 }]}
          >
            <Text style={styles.tuneActionText}>TUNE</Text>
          </Pressable>
        ) : (
          <View style={[styles.tuningPanel, { bottom: insets.bottom + 8 }]}>
            {TUNE_ROWS.map((row) => (
              <View key={row.key} style={styles.tuneRow}>
                <Text style={styles.tuneLabel}>{row.label}</Text>
                <Pressable
                  accessibilityLabel={`Decrease ${row.label}`}
                  accessibilityRole="button"
                  onPress={() => adjust(row.key, -row.step, row.max)}
                  style={styles.tuneButton}
                >
                  <Text style={styles.tuneButtonText}>−</Text>
                </Pressable>
                <Text style={styles.tuneValue}>{layout[row.key].toFixed(3)}</Text>
                <Pressable
                  accessibilityLabel={`Increase ${row.label}`}
                  accessibilityRole="button"
                  onPress={() => adjust(row.key, row.step, row.max)}
                  style={styles.tuneButton}
                >
                  <Text style={styles.tuneButtonText}>+</Text>
                </Pressable>
              </View>
            ))}
            <Text style={styles.tuneReadout}>
              CLUE FONT: {clueFit.fontSize}pt
              {clueFit.overflowAtFloor ? ' — OVERFLOW AT FLOOR' : ''}
            </Text>
            <View style={styles.tuneActions}>
              <Pressable
                accessibilityLabel="Hide Daily Castle tuning panel"
                accessibilityRole="button"
                onPress={() => setPanelHidden(true)}
                style={styles.tuneActionButton}
              >
                <Text style={styles.tuneActionText}>HIDE</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Reset Daily Castle tuning panel"
                accessibilityRole="button"
                onPress={() => setLayout({ ...CASTLE_LAYOUT_DEFAULTS })}
                style={styles.tuneActionButton}
              >
                <Text style={styles.tuneActionText}>RESET</Text>
              </Pressable>
            </View>
          </View>
        )}
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
  tuningPanel: {
    position: 'absolute',
    left: 8,
    right: 8,
    backgroundColor: PW.color.overlayMedium,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    padding: 10,
  },
  tuneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  tuneLabel: {
    flex: 1,
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
  },
  tuneButton: {
    width: 44,
    height: 44,
    borderRadius: PW.radius.md,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuneButtonText: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 20,
    lineHeight: 22,
  },
  tuneValue: {
    width: 64,
    textAlign: 'center',
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
  },
  tuneReadout: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  tuneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tuneActionButton: {
    flex: 1,
    height: 44,
    borderRadius: PW.radius.md,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuneActionText: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
  },
  tuneReopenButton: {
    position: 'absolute',
    right: 8,
    width: 64,
    height: 44,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
