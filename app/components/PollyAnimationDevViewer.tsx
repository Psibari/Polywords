import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import {
  DEFAULT_POLLY_MEMORY,
  PollyMemory,
  resolveHomePollyMoment,
} from '../game/pollyMemory';
import { PW } from '../ui/pwTheme';
import {
  PollyLabAction,
  PollyLabCommand,
  PollyLabPose,
  PollyMotionStage,
} from './PollyMotionStage';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type MemoryPreset = {
  id: 'first' | 'normal' | 'pollyWon' | 'playerMastered' | 'streak' | 'haunt';
  label: string;
  note: string;
  memory: PollyMemory;
};

const MEMORY_PRESETS: MemoryPreset[] = [
  {
    id: 'first',
    label: 'FIRST VISIT',
    note: 'No Hunt or Daily history',
    memory: { ...DEFAULT_POLLY_MEMORY },
  },
  {
    id: 'normal',
    label: 'NORMAL RETURN',
    note: 'A familiar player, no active streak',
    memory: {
      ...DEFAULT_POLLY_MEMORY,
      huntsRemembered: 3,
      homeGreetingCursor: 2,
      lastHuntOutcome: 'playerCompleted',
      lastHuntScore: 6100,
    },
  },
  {
    id: 'pollyWon',
    label: 'POLLY WON',
    note: 'She remembers taking the last Hunt',
    memory: {
      ...DEFAULT_POLLY_MEMORY,
      huntsRemembered: 4,
      lastHuntOutcome: 'pollyWon',
      pollyWinStreak: 2,
      lastHuntScore: 2300,
    },
  },
  {
    id: 'playerMastered',
    label: 'PLAYER MASTERED',
    note: 'One boss word entered the Vault',
    memory: {
      ...DEFAULT_POLLY_MEMORY,
      huntsRemembered: 4,
      lastHuntOutcome: 'playerBeatPolly',
      playerWinStreak: 1,
      lastHuntScore: 14500,
      lastBossWord: 'KERNEL',
    },
  },
  {
    id: 'streak',
    label: 'PLAYER STREAK',
    note: 'Polly has lost three Hunts in a row',
    memory: {
      ...DEFAULT_POLLY_MEMORY,
      huntsRemembered: 8,
      lastHuntOutcome: 'playerBeatPolly',
      playerWinStreak: 3,
      lastHuntScore: 18100,
      lastBossWord: 'EXTRACT',
    },
  },
  {
    id: 'haunt',
    label: 'ACTIVE HAUNT',
    note: 'A failed boss is waiting to return',
    memory: {
      ...DEFAULT_POLLY_MEMORY,
      huntsRemembered: 5,
      homeGreetingCursor: 4,
      lastHuntOutcome: 'playerCompleted',
      lastHuntScore: 7600,
      lastBossWord: 'WAKE',
      lastHauntWord: 'WAKE',
    },
  },
];

const ACTIONS: Array<{ action: PollyLabAction; label: string; note: string }> = [
  { action: 'flyIn', label: 'FLY IN', note: 'Enter and land once' },
  { action: 'idle', label: 'IDLE', note: 'Living settled state' },
  { action: 'pollyWins', label: 'POLLY WINS', note: 'Hop and laugh' },
  { action: 'playerWins', label: 'PLAYER WINS', note: 'Shock, then sulk' },
];

function settledPoseForMemory(memory: PollyMemory): Extract<PollyLabPose, 'idle' | 'smug' | 'sulk'> {
  if (memory.playerWinStreak > 0) return 'sulk';
  if (memory.pollyWinStreak > 0) return 'smug';
  return 'idle';
}

export function PollyAnimationDevViewer({ visible, onClose }: Props) {
  const [activeMemoryId, setActiveMemoryId] = useState<MemoryPreset['id']>('first');
  const [command, setCommand] = useState<PollyLabCommand>({ action: 'idle', nonce: 0 });

  const activePreset = useMemo(
    () => MEMORY_PRESETS.find(preset => preset.id === activeMemoryId) ?? MEMORY_PRESETS[0],
    [activeMemoryId],
  );
  const moment = resolveHomePollyMoment(activePreset.memory);
  const settledPose = settledPoseForMemory(activePreset.memory);

  function trigger(action: PollyLabAction) {
    setCommand(previous => ({ action, nonce: previous.nonce + 1 }));
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
          One canonical branch stage. Raw pose dimensions are normalized, memory chooses
          Polly&apos;s settled mood, and each performance can be replayed independently.
        </Text>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>MEMORY STATE</Text>
            <Text style={styles.sectionNote}>Preview the mood Polly carries back Home.</Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.presetRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {MEMORY_PRESETS.map(preset => {
              const active = preset.id === activeMemoryId;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={preset.id}
                  onPress={() => {
                    setActiveMemoryId(preset.id);
                    trigger('idle');
                  }}
                  style={({ pressed }) => [
                    styles.preset,
                    active && styles.presetActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
                    {preset.label}
                  </Text>
                  <Text style={styles.presetNote}>{preset.note}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <PollyMotionStage
            command={command}
            moodLabel={activePreset.label}
            settledPose={settledPose}
            speech={moment.line}
          />

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>PERFORMANCE</Text>
            <Text style={styles.sectionNote}>
              These controls do not alter saved progress or production gameplay.
            </Text>
          </View>
          <View style={styles.actionGrid}>
            {ACTIONS.map(item => (
              <Pressable
                accessibilityRole="button"
                key={item.action}
                onPress={() => trigger(item.action)}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Text style={styles.actionLabel}>{item.label}</Text>
                <Text style={styles.actionNote}>{item.note}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.scopeCard}>
            <Text style={styles.scopeTitle}>FIRST PROOF SCOPE</Text>
            <Text style={styles.scopeCopy}>
              Hunt and Daily use the long branch. Home remains a separate composition.
              Normal play stays restrained; terminal outcomes carry the large reactions.
            </Text>
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
  content: {
    padding: PW.space.lg,
    paddingBottom: PW.space.xxl,
  },
  sectionHeading: {
    marginTop: PW.space.xl,
    marginBottom: PW.space.md,
  },
  sectionTitle: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  sectionNote: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 4,
  },
  presetRow: {
    gap: PW.space.sm,
    paddingBottom: PW.space.lg,
  },
  preset: {
    width: 168,
    minHeight: 86,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.overlayHeavy,
    padding: PW.space.md,
  },
  presetActive: {
    borderColor: PW.color.cardRimStrong,
    backgroundColor: PW.color.surfaceRaised,
  },
  presetLabel: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 0.8,
  },
  presetLabelActive: {
    color: PW.color.gold,
  },
  presetNote: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 7,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: PW.space.md,
  },
  action: {
    width: '47.5%',
    minHeight: 82,
    borderRadius: PW.radius.lg,
    borderWidth: 1.5,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.surfaceRaised,
    paddingHorizontal: PW.space.md,
    paddingVertical: PW.space.md,
    justifyContent: 'center',
  },
  actionPressed: {
    borderColor: PW.color.gold,
    backgroundColor: PW.color.overlayMedium,
    transform: [{ scale: 0.98 }],
  },
  actionLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: 15,
    letterSpacing: 0.8,
  },
  actionNote: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 5,
  },
  scopeCard: {
    marginTop: PW.space.xl,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.overlayHeavy,
    padding: PW.space.lg,
  },
  scopeTitle: {
    color: PW.color.lavender,
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 1,
  },
  scopeCopy: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },
  pressed: {
    opacity: 0.8,
  },
});
