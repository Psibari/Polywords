import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { FONTS } from '../constants/fonts';

type ToggleRowProps = {
  label: string;
  enabled: boolean;
  onPress: () => void;
};

type PlaceholderRowProps = {
  label: string;
  note?: string;
  accent?: 'purple' | 'rose' | 'gold';
};

type Props = {
  navigation: any;
};

function ToggleRow({ label, enabled, onPress }: ToggleRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowNote}>{enabled ? 'On' : 'Off'}</Text>
      </View>
      <View style={[styles.toggleTrack, enabled && styles.toggleTrackOn]}>
        <View style={[styles.toggleKnob, enabled && styles.toggleKnobOn]} />
      </View>
    </Pressable>
  );
}

function PlaceholderRow({ label, note = 'Coming soon', accent = 'purple' }: PlaceholderRowProps) {
  const accentStyle = accent === 'rose'
    ? styles.rowAccentRose
    : accent === 'gold'
      ? styles.rowAccentGold
      : styles.rowAccentPurple;

  return (
    <View style={[styles.row, styles.placeholderRow]}>
      <View style={[styles.rowAccent, accentStyle]} />
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowNote}>{note}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </View>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerGlow} />
          <Text style={styles.kicker}>UTILITY</Text>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>Tune the hunt.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>W</Text>
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileEyebrow}>PROFILE</Text>
              <Text style={styles.playerName}>Word Hunter</Text>
              <Text style={styles.profileLevel}>Level 1</Text>
            </View>
          </View>
          <View style={styles.profileStats}>
            <Text style={styles.profileStatText}>0 Mastered · 0 Ghosts</Text>
          </View>
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Edit Profile</Text>
            <Text style={styles.disabledButtonNote}>Coming soon</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Sound"
              enabled={soundEnabled}
              onPress={() => setSoundEnabled(value => !value)}
            />
            <ToggleRow
              label="Haptics"
              enabled={hapticsEnabled}
              onPress={() => setHapticsEnabled(value => !value)}
            />
            <PlaceholderRow label="Tutorial Replay" />
            <PlaceholderRow label="Accessibility" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <PlaceholderRow label="Profile" note="Lives in Settings for MVP" accent="gold" />
            <PlaceholderRow label="Cloud Save" />
            <PlaceholderRow label="Sign In / Account Sync" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <PlaceholderRow label="Credits" />
            <PlaceholderRow label="Privacy" />
            <PlaceholderRow label="Version" note="App shell preview" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger / Reset</Text>
          <View style={[styles.card, styles.warningCard]}>
            <PlaceholderRow label="Reset Progress" note="Disabled placeholder" accent="rose" />
          </View>
        </View>
      </ScrollView>
      <BottomNav active="Settings" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1830',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: bottomNavContentPadding,
  },
  header: {
    minHeight: 150,
    borderRadius: 24,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.50)',
    padding: 22,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    right: -44,
    top: -58,
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 16,
    borderColor: 'rgba(245,200,66,0.07)',
  },
  kicker: {
    color: 'rgba(255,255,255,0.56)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#F5C842',
    fontFamily: FONTS.brand,
    fontSize: 42,
    letterSpacing: 2,
  },
  subtitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.tileCopy,
    fontSize: 16,
    marginTop: 6,
  },
  profileCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.24)',
    padding: 18,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(123,45,139,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 28,
    letterSpacing: 1,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileEyebrow: {
    color: 'rgba(245,200,66,0.78)',
    fontFamily: FONTS.tileCopy,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  playerName: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 20,
    letterSpacing: 1,
  },
  profileLevel: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    marginTop: 4,
  },
  profileStats: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(26,24,48,0.80)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.34)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  profileStatText: {
    color: '#FFFFFF',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
  },
  disabledButton: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.40)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.78,
  },
  disabledButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 1,
  },
  disabledButtonNote: {
    color: 'rgba(255,255,255,0.46)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.34)',
    overflow: 'hidden',
  },
  warningCard: {
    borderColor: 'rgba(155,45,107,0.44)',
  },
  row: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  placeholderRow: {
    opacity: 0.78,
    justifyContent: 'flex-start',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    color: '#FFFFFF',
    fontFamily: FONTS.tileCopy,
    fontSize: 15,
  },
  rowNote: {
    color: 'rgba(255,255,255,0.46)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    marginTop: 3,
  },
  rowAccent: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  rowAccentPurple: {
    backgroundColor: '#7B2D8B',
  },
  rowAccentRose: {
    backgroundColor: '#9B2D6B',
  },
  rowAccentGold: {
    backgroundColor: '#F5C842',
  },
  chevron: {
    color: 'rgba(255,255,255,0.30)',
    fontFamily: FONTS.tileCopy,
    fontSize: 24,
    lineHeight: 24,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(123,45,139,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.42)',
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: 'rgba(245,200,66,0.18)',
    borderColor: 'rgba(245,200,66,0.42)',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#F5C842',
  },
});
