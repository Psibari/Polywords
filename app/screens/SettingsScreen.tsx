import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { PollyAnimationDevViewer } from '../components/PollyAnimationDevViewer';
import { TorchGlow } from '../components/ui/TorchGlow';
import { FONTS } from '../constants/fonts';
import { getRankTier } from '../game/ranks';
import { useGameStore } from '../store/useGameStore';
import { chamberMaterial } from '../ui/pwMaterials';
import { PW } from '../ui/pwTheme';

const CHAMBER_ASPECT_RATIO = 941 / 1672;
const chamberImage = require('../../assets/images/settings/chamber-dark-mobile.png');

// Anchor points measured from the source art's actual pixels (brightness-cluster
// scan of the PNG), not eyeballed. Percentages of the chamber image's own
// width/height, top-left origin.
const TORCH_POSITIONS = [
  { leftPct: 0.110, topPct: 0.310, sizePct: 0.16 }, // foreground L
  { leftPct: 0.897, topPct: 0.309, sizePct: 0.16 }, // foreground R
  { leftPct: 0.293, topPct: 0.422, sizePct: 0.11 }, // mid L
  { leftPct: 0.700, topPct: 0.422, sizePct: 0.11 }, // mid R
  { leftPct: 0.365, topPct: 0.480, sizePct: 0.08 }, // far L
  { leftPct: 0.615, topPct: 0.479, sizePct: 0.08 }, // far R
  { leftPct: 0.447, topPct: 0.535, sizePct: 0.07 }, // altar candle
] as const;

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
    <Pressable
      onPress={() => Alert.alert(label, 'Not built yet — coming in a future update.')}
      style={({ pressed }) => [styles.row, styles.placeholderRow, pressed && styles.pressed]}
    >
      <View style={[styles.rowAccent, accentStyle]} />
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowNote}>{note}</Text>
      </View>
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const [showPollyAnimations, setShowPollyAnimations] = useState(false);
  const [chamberWidth, setChamberWidth] = useState(0);
  const chamberHeight = chamberWidth / CHAMBER_ASPECT_RATIO;
  const progress = useGameStore(s => s.progress);
  const ghosts = useGameStore(s => s.ghosts);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const hapticsEnabled = useGameStore(s => s.hapticsEnabled);
  const setSoundEnabled = useGameStore(s => s.setSoundEnabled);
  const setHapticsEnabled = useGameStore(s => s.setHapticsEnabled);
  const resetProgressForDev = useGameStore(s => s.resetProgressForDev);

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      "This clears mastered words, Hunt stats, Daily results, and Polly's memory of you. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => { resetProgressForDev(); } },
      ],
    );
  };

  const rank = getRankTier(progress.personalBest);
  const ghostsToShow = ghosts.filter(
    g => !progress.masteredWords.some(m => m.word === g.word),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={styles.chamberFrame}
        onLayout={e => setChamberWidth(e.nativeEvent.layout.width)}
      >
        <ImageBackground source={chamberImage} resizeMode="cover" style={StyleSheet.absoluteFillObject}>
          <View pointerEvents="none" style={styles.stoneShade} />
          {chamberWidth > 0 && TORCH_POSITIONS.map((t, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={[
                styles.torchAnchor,
                {
                  left: t.leftPct * chamberWidth - (t.sizePct * chamberWidth) / 2,
                  top: t.topPct * chamberHeight - (t.sizePct * chamberWidth) / 2,
                  width: t.sizePct * chamberWidth,
                  height: t.sizePct * chamberWidth,
                },
              ]}
            >
              <TorchGlow size={t.sizePct * chamberWidth} />
            </View>
          ))}
          <LinearGradient
            colors={['transparent', PW.color.bg]}
            pointerEvents="none"
            style={styles.chamberFade}
          />
        </ImageBackground>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View pointerEvents="none" style={styles.headerGlowLeft}>
            <TorchGlow size={72} />
          </View>
          <View pointerEvents="none" style={styles.headerGlowRight}>
            <TorchGlow size={72} />
          </View>
          <Text style={styles.kicker}>UTILITY</Text>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>Tune the hunt.</Text>
        </View>

        <View style={styles.profileCard}>
          <View pointerEvents="none" style={styles.plaqueHighlight} />
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={[styles.avatarText, { color: rank.color }]}>{rank.letter}</Text>
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileEyebrow}>PROFILE</Text>
              <Text style={styles.playerName}>Word Hunter</Text>
              <Text style={styles.profileLevel}>{rank.description}</Text>
            </View>
          </View>
          <View style={styles.profileStats}>
            <Text style={styles.profileStatText}>
              {progress.masteredWords.length} Mastered · {ghostsToShow.length} Ghosts
            </Text>
          </View>
          <Pressable
            onPress={() => Alert.alert('Edit Profile', 'Not built yet — coming in a future update.')}
            style={({ pressed }) => [styles.disabledButton, pressed && styles.pressed]}
          >
            <Text style={styles.disabledButtonText}>Edit Profile</Text>
            <Text style={styles.disabledButtonNote}>Coming soon</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game</Text>
          <View style={styles.card}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <ToggleRow
              label="Sound"
              enabled={soundEnabled}
              onPress={() => setSoundEnabled(!soundEnabled)}
            />
            <ToggleRow
              label="Haptics"
              enabled={hapticsEnabled}
              onPress={() => setHapticsEnabled(!hapticsEnabled)}
            />
            <PlaceholderRow label="Tutorial Replay" />
            <PlaceholderRow label="Accessibility" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <PlaceholderRow label="Profile" note="Lives in Settings for MVP" accent="gold" />
            <PlaceholderRow label="Cloud Save" />
            <PlaceholderRow label="Sign In / Account Sync" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <PlaceholderRow label="Credits" />
            <PlaceholderRow label="Privacy" />
            <PlaceholderRow label="Version" note="App shell preview" />
          </View>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development</Text>
            <View style={styles.card}>
              <View pointerEvents="none" style={styles.plaqueHighlight} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPollyAnimations(true)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>Polly Animation Viewer</Text>
                  <Text style={styles.rowNote}>Interactive branch, performance, and memory proof</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger / Reset</Text>
          <View style={[styles.card, styles.warningCard]}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <Pressable
              onPress={handleResetProgress}
              style={({ pressed }) => [styles.row, styles.placeholderRow, pressed && styles.pressed]}
            >
              <View style={[styles.rowAccent, styles.rowAccentRose]} />
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Reset Progress</Text>
                <Text style={styles.rowNote}>Clears Hunt, Daily, and Polly memory — can't be undone</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {__DEV__ && (
        <PollyAnimationDevViewer
          onClose={() => setShowPollyAnimations(false)}
          visible={showPollyAnimations}
        />
      )}
      <BottomNav active="Settings" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
  },
  chamberFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: CHAMBER_ASPECT_RATIO,
    overflow: 'hidden',
  },
  stoneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: chamberMaterial.stoneShade,
  },
  chamberFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  plaqueHighlight: {
    position: 'absolute',
    top: 6,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: PW.color.cardInner,
    opacity: 0.5,
  },
  torchAnchor: {
    position: 'absolute',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: bottomNavContentPadding,
  },
  header: {
    minHeight: 150,
    borderRadius: 24,
    backgroundColor: PW.color.overlayHeavy,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    padding: 22,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerGlowLeft: {
    position: 'absolute',
    left: -20,
    top: 18,
    width: 72,
    height: 72,
  },
  headerGlowRight: {
    position: 'absolute',
    right: -20,
    top: 18,
    width: 72,
    height: 72,
  },
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    fontSize: 42,
    letterSpacing: 2,
  },
  subtitle: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    fontSize: 16,
    marginTop: 6,
  },
  profileCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: chamberMaterial.plaqueFace,
    borderWidth: 1.5,
    borderColor: chamberMaterial.plaqueRim,
    padding: 18,
    overflow: 'hidden',
    ...PW.shadow.panel,
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
    backgroundColor: PW.color.purpleSoft,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.hud,
    fontSize: 28,
    letterSpacing: 1,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileEyebrow: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  playerName: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    fontSize: 20,
    letterSpacing: 1,
  },
  profileLevel: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    marginTop: 4,
  },
  profileStats: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: PW.color.overlayMedium,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  profileStatText: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
  },
  disabledButton: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.78,
  },
  disabledButtonText: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 1,
  },
  disabledButtonNote: {
    color: PW.color.faintWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    borderRadius: 18,
    backgroundColor: chamberMaterial.plaqueFace,
    borderWidth: 1.5,
    borderColor: chamberMaterial.plaqueRim,
    overflow: 'hidden',
    ...PW.shadow.panel,
  },
  warningCard: {
    borderColor: chamberMaterial.emberAccent,
  },
  row: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PW.color.borderMuted,
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
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    fontSize: 16,
  },
  rowNote: {
    color: PW.color.faintWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    marginTop: 3,
  },
  rowAccent: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  rowAccentPurple: {
    backgroundColor: PW.color.purple,
  },
  rowAccentRose: {
    backgroundColor: PW.color.rose,
  },
  rowAccentGold: {
    backgroundColor: PW.color.gold,
  },
  chevron: {
    color: PW.color.faintWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 24,
    lineHeight: 24,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: PW.color.purpleSoft,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: PW.color.goldGlow,
    borderColor: PW.color.goldSoft,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PW.color.transparentWhite,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
    backgroundColor: PW.color.gold,
  },
});
