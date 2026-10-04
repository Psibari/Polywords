import React, { useState } from 'react';
import { Animated, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getPollyLifeProfile, PollyLifeProfileName } from '../game/pollyLifeProfile';
import { usePollyAmbientMotion, useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { POLLY_POSES, pollyPoseScale } from '../ui/pollyPoses';
import { PollyPerchRig } from './PollyPerchRig';

type Props = { visible: boolean; onClose: () => void };

const PROFILES: PollyLifeProfileName[] = ['neutral', 'cocky', 'watchful', 'rattled', 'hauntFocused'];
const PREVIEW_SIZE = 300;

/**
 * Life-profile art proof.
 *
 * Neutral/cocky/watchful intentionally keep the live layered perch rig.
 * Rattled and haunt-focused use existing clean authored poses so we can test
 * whether the current art library already carries those emotions before
 * commissioning anything new. This is DEV-only until Pete approves the reads.
 */
function PollyLifeCandidate({
  name,
  reduceMotion,
}: {
  name: PollyLifeProfileName;
  reduceMotion: boolean | null;
}) {
  const profile = getPollyLifeProfile(name);

  if (name === 'rattled') {
    return (
      <Image
        source={POLLY_POSES.rattled}
        resizeMode="contain"
        style={[
          styles.pose,
          { transform: [{ scale: pollyPoseScale(POLLY_POSES.rattled) }] },
        ]}
      />
    );
  }

  if (name === 'hauntFocused') {
    return (
      <Image
        source={POLLY_POSES.sulk}
        resizeMode="contain"
        style={[
          styles.pose,
          {
            transform: [
              { translateX: 4 },
              { translateY: 2 },
              { scale: pollyPoseScale(POLLY_POSES.sulk) * 1.04 },
              { rotate: '-1.5deg' },
            ],
          },
        ]}
      />
    );
  }

  return (
    <PollyPerchRig
      size={PREVIEW_SIZE}
      reduceMotion={reduceMotion}
      crownTilt={profile.crownTilt}
      angryBrow={profile.angryBrow}
      eye={profile.eye}
      mouth={profile.mouth}
    />
  );
}

export function PollyLifeDevViewer({ visible, onClose }: Props) {
  const [name, setName] = useState<PollyLifeProfileName>('neutral');
  const profile = getPollyLifeProfile(name);
  const reduceMotion = useReducedMotionPreference();
  const { translateX, translateY } = usePollyAmbientMotion('home', visible, profile.ambientIntensity);

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
          Compare Polly without dialogue. These are art proofs, not production locks: Rattled uses her dedicated clean pose; Haunt Focused tests the existing angry/sulk pose; Watchful keeps the live wide-eye rig.
        </Text>
        <View style={styles.stage}>
          <Animated.View style={[styles.candidate, { transform: [{ translateX }, { translateY }] }]}>
            <PollyLifeCandidate name={name} reduceMotion={reduceMotion} />
          </Animated.View>
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
          DOZE ×{profile.dozeDelayMultiplier.toFixed(2)} · AMBIENT ×{profile.ambientIntensity.toFixed(2)}
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
  buttons: { gap: 8 },
  button: { borderWidth: 1, borderColor: PW.color.purpleSoft, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  buttonActive: { borderColor: PW.color.gold, backgroundColor: PW.color.overlayMedium },
  buttonText: { color: PW.color.mutedWhite, fontFamily: FONTS.hud, fontSize: 15, letterSpacing: 1 },
  buttonTextActive: { color: PW.color.gold },
  readout: { color: PW.color.mutedWhite, fontFamily: FONTS.label, fontSize: 13, marginTop: 14, textAlign: 'center' },
});
