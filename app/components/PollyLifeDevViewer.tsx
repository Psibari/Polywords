import React, { useState } from 'react';
import { Animated, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getPollyLifeProfile, PollyLifeProfileName } from '../game/pollyLifeProfile';
import { usePollyAmbientMotion, useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { PollyPerchRig } from './PollyPerchRig';

type Props = { visible: boolean; onClose: () => void };

const PROFILES: PollyLifeProfileName[] = ['neutral', 'cocky', 'watchful', 'rattled', 'hauntFocused'];

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
          Compare Polly without dialogue. Relationship memory changes her resting body language; gameplay reactions still override it.
        </Text>
        <View style={styles.stage}>
          <Animated.View style={{ transform: [{ translateX }, { translateY }] }}>
            <PollyPerchRig
              size={300}
              reduceMotion={reduceMotion}
              crownTilt={profile.crownTilt}
              angryBrow={profile.angryBrow}
              eye={profile.eye}
              mouth={profile.mouth}
            />
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
  buttons: { gap: 8 },
  button: { borderWidth: 1, borderColor: PW.color.purpleSoft, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  buttonActive: { borderColor: PW.color.gold, backgroundColor: PW.color.overlayMedium },
  buttonText: { color: PW.color.mutedWhite, fontFamily: FONTS.hud, fontSize: 15, letterSpacing: 1 },
  buttonTextActive: { color: PW.color.gold },
  readout: { color: PW.color.mutedWhite, fontFamily: FONTS.label, fontSize: 13, marginTop: 14, textAlign: 'center' },
});
