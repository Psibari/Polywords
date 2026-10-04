import React, { useState } from 'react';
import { Animated, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getPollyLifeProfile, PollyLifeProfileName } from '../game/pollyLifeProfile';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { POLLY_POSES, POLLY_POSE_SCALE, PollyPoseName } from '../ui/pollyPoses';

type Props = { visible: boolean; onClose: () => void };

const PROFILES: PollyLifeProfileName[] = ['neutral', 'cocky', 'watchful', 'rattled', 'hauntFocused'];
const PREVIEW_SIZE = 300;

type Candidate = {
  pose: PollyPoseName;
  label: string;
  scale?: number;
  translateX?: number;
  translateY?: number;
};

const CANDIDATES: Record<PollyLifeProfileName, Candidate> = {
  neutral: {
    pose: 'idle',
    label: 'SPRITE 4 · BASELINE',
  },
  cocky: {
    pose: 'cocky',
    label: 'SPRITE 6 · LEFT-FACING / HALF-LIDDED',
  },
  watchful: {
    pose: 'shocked',
    label: 'SPRITE 8 · ALERT',
  },
  rattled: {
    pose: 'masterShock',
    label: 'HIGH-RES SHOCK · COMEBACK CANDIDATE',
  },
  hauntFocused: {
    pose: 'masterAngry',
    label: 'HIGH-RES ANGRY · HAUNT CANDIDATE',
  },
};

/**
 * DEV-only five-pose comparison. Every state is deliberately rendered as
 * static authored art here so facial-rig differences cannot muddy the read.
 * Scale is normalized against sprite4 through the shared pose-scale table.
 * Nothing in this viewer changes production Home behavior.
 */
export function PollyLifeDevViewer({ visible, onClose }: Props) {
  const [name, setName] = useState<PollyLifeProfileName>('neutral');
  const profile = getPollyLifeProfile(name);
  const candidate = CANDIDATES[name];
  const { translateX, translateY } = usePollyAmbientMotion('home', visible, profile.ambientIntensity);
  const scale = candidate.scale ?? POLLY_POSE_SCALE[candidate.pose];

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>DEVELOPMENT ONLY</Text>
            <Text style={styles.title}>POLLY LIFE PROFILES</Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Polly life profiles">
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>
        <Text style={styles.note}>
          Five normalized authored-art candidates. Judge the emotional read and Polly's apparent size; production Home is unchanged.
        </Text>
        <View style={styles.stage}>
          <Animated.View style={[styles.candidate, { transform: [{ translateX }, { translateY }] }]}>
            <Image
              source={POLLY_POSES[candidate.pose]}
              resizeMode="contain"
              style={[
                styles.pose,
                {
                  transform: [
                    { translateX: candidate.translateX ?? 0 },
                    { translateY: candidate.translateY ?? 0 },
                    { scale },
                  ],
                },
              ]}
            />
          </Animated.View>
          <Text style={styles.sourceLabel}>{candidate.label}</Text>
        </View>
        <View style={styles.buttons}>
          {PROFILES.map(profileName => (
            <Pressable
              key={profileName}
              onPress={() => setName(profileName)}
              accessibilityRole="button"
              accessibilityState={{ selected: name === profileName }}
              style={[styles.button, name === profileName && styles.buttonActive]}
            >
              <Text style={[styles.buttonText, name === profileName && styles.buttonTextActive]}>
                {profileName.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.readout}>
          ART SCALE ×{scale.toFixed(2)} · DOZE ×{profile.dozeDelayMultiplier.toFixed(2)} · AMBIENT ×{profile.ambientIntensity.toFixed(2)}
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: PW.color.mutedWhite, fontFamily: FONTS.label, fontSize: 13, letterSpacing: 2 },
  title: { color: PW.color.gold, fontFamily: FONTS.hud, fontSize: 24, marginTop: 5 },
  close: { color: PW.color.white, fontSize: 42, lineHeight: 44 },
  note: { color: PW.color.softWhite, fontFamily: FONTS.tileCopy, fontSize: 15, lineHeight: 21, marginTop: 16 },
  stage: { height: 390, alignItems: 'center', justifyContent: 'center' },
  candidate: { width: PREVIEW_SIZE, height: PREVIEW_SIZE, alignItems: 'center', justifyContent: 'center' },
  pose: { width: PREVIEW_SIZE, height: PREVIEW_SIZE },
  sourceLabel: { color: PW.color.goldSoft, fontFamily: FONTS.label, fontSize: 12, letterSpacing: 1, marginTop: 8 },
  buttons: { gap: 8 },
  button: { borderWidth: 1, borderColor: PW.color.purpleSoft, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  buttonActive: { borderColor: PW.color.gold, backgroundColor: PW.color.overlayMedium },
  buttonText: { color: PW.color.mutedWhite, fontFamily: FONTS.hud, fontSize: 15, letterSpacing: 1 },
  buttonTextActive: { color: PW.color.gold },
  readout: { color: PW.color.mutedWhite, fontFamily: FONTS.label, fontSize: 13, marginTop: 14, textAlign: 'center' },
});
