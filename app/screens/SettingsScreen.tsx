import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import { SETTINGS_SKY_TUNING } from '../ui/ambientSkyTuning';
import { PollyAnimationDevViewer } from '../components/PollyAnimationDevViewer';
import { GauntletSpineDevViewer } from '../components/GauntletSpineDevViewer';
import { PollyCrownDevViewer } from '../components/PollyCrownDevViewer';
import { TorchGlow } from '../components/ui/TorchGlow';
import { InfoModal } from '../components/ui/InfoModal';
import { FONTS } from '../constants/fonts';
import { INTRO_SEEN_KEY, BOSS_INTRO_SEEN_KEY, HAUNT_INTRO_SEEN_KEY } from '../constants/storageKeys';
import { getRankTier } from '../game/ranks';
import {
  clearPlaytestHistory,
  formatPlaytestSummaryText,
  getPlaytestEventCount,
} from '../game/playtestTelemetry';
import { useGameStore } from '../store/useGameStore';
import { chamberMaterial } from '../ui/pwMaterials';
import { PW } from '../ui/pwTheme';
import appConfig from '../../app.json';

const APP_VERSION = appConfig.expo.version;

const stoneTileTexture = require('../../assets/images/textures/stoneTile.png');

const PRIVACY_TEXT =
  "POLYWORDS stores your game progress locally on this device only — " +
  "mastered words, Hunt stats, Daily Challenge history, and Polly's memory " +
  "of your runs. None of it leaves your device, is sent to a server, or is " +
  "shared or sold to anyone.\n\n" +
  "There are no accounts and no sign-in. If you delete the app, or use " +
  "Reset Progress, this information is gone for good.\n\n" +
  "During this playtest period, POLYWORDS also keeps a local tally of run " +
  "outcomes (survived/mastered/lost, and at what round) under Playtest Data " +
  "below. It stays on this device and is never sent anywhere automatically " +
  "— it only leaves the device if you tap Share Debug Stats yourself, and " +
  "you can clear it at any time.\n\n" +
  "Daily Reminder (off by default) asks your phone's permission to show a " +
  "single local notification if you haven't played Daily in a while. " +
  "Nothing is scheduled unless you turn it on, and it uses no server — the " +
  "reminder is set entirely on your device.";

const CREDITS_TEXT =
  "POLYWORDS\n\n" +
  "A recognition game about familiar words with more than one meaning.\n\n" +
  "Built with React Native and Expo.\n\n" +
  "Typography: Bebas Neue and Barlow Condensed.";

type ToggleRowProps = {
  label: string;
  enabled: boolean;
  onPress: () => void;
};

type Props = {
  navigation: any;
};

function ToggleRow({ label, enabled, onPress }: ToggleRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: enabled }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
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

export default function SettingsScreen({ navigation }: Props) {
  const [showPollyAnimations, setShowPollyAnimations] = useState(false);
  const [showGauntletSpineSizer, setShowGauntletSpineSizer] = useState(false);
  const [showPollyCrown, setShowPollyCrown] = useState(false);
  const progress = useGameStore(s => s.progress);
  const ghosts = useGameStore(s => s.ghosts);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const hapticsEnabled = useGameStore(s => s.hapticsEnabled);
  const reduceMotionOverride = useGameStore(s => s.reduceMotionOverride);
  const reduceFlashesOverride = useGameStore(s => s.reduceFlashesOverride);
  const playerName = useGameStore(s => s.playerName);
  const dailyReminderEnabled = useGameStore(s => s.dailyReminderEnabled);
  const setSoundEnabled = useGameStore(s => s.setSoundEnabled);
  const setHapticsEnabled = useGameStore(s => s.setHapticsEnabled);
  const setReduceMotionOverride = useGameStore(s => s.setReduceMotionOverride);
  const setReduceFlashesOverride = useGameStore(s => s.setReduceFlashesOverride);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const setDailyReminderEnabled = useGameStore(s => s.setDailyReminderEnabled);
  const resetProgressForDev = useGameStore(s => s.resetProgressForDev);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(playerName);
  const [showCredits, setShowCredits] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [playtestEventCount, setPlaytestEventCount] = useState(getPlaytestEventCount());

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

  const handleEditName = () => {
    if (isEditingName) {
      setPlayerName(nameDraft);
      setIsEditingName(false);
    } else {
      setNameDraft(playerName);
      setIsEditingName(true);
    }
  };

  const handleSharePlaytestStats = () => {
    Share.share({ message: formatPlaytestSummaryText() }).catch(() => {});
  };

  const handleClearPlaytestStats = () => {
    Alert.alert(
      'Clear Playtest Data',
      'This clears the local run-outcome tally described in Privacy. This can\'t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearPlaytestHistory();
            setPlaytestEventCount(getPlaytestEventCount());
          },
        },
      ],
    );
  };

  const handleDailyReminderToggle = () => {
    if (dailyReminderEnabled) {
      void setDailyReminderEnabled(false);
      return;
    }
    setDailyReminderEnabled(true).then(granted => {
      if (!granted) {
        Alert.alert(
          "Can't Enable Reminder",
          'Notifications are turned off for POLYWORDS. Enable them for this app in your phone\'s system settings, then try again.',
        );
      }
    });
  };

  const handleTutorialReplay = () => {
    Promise.all([
      AsyncStorage.removeItem(INTRO_SEEN_KEY),
      AsyncStorage.removeItem(BOSS_INTRO_SEEN_KEY),
      AsyncStorage.removeItem(HAUNT_INTRO_SEEN_KEY),
    ]).catch(() => {});
    Alert.alert('Tutorial Replay', "You'll see it again next time you start a Hunt.");
  };

  const rank = getRankTier(progress.personalBest);
  const ghostsToShow = ghosts.filter(
    g => !progress.masteredWords.some(m => m.word === g.word),
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Same shared stage — night sky over flagstone ground — every other
          screen lives on, replacing Settings' old one-off stone chamber. */}
      <AmbientSkyBackground {...SETTINGS_SKY_TUNING} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(15,13,42,0.45)', 'rgba(15,13,42,0.22)', 'rgba(15,13,42,0.5)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

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

        <ImageBackground
          source={stoneTileTexture}
          resizeMode="repeat"
          style={styles.profileCard}
          imageStyle={styles.profileCardTexture}
        >
          <View pointerEvents="none" style={styles.plaqueHighlight} />
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={[styles.avatarText, { color: rank.color }]}>{rank.letter}</Text>
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileEyebrow}>PROFILE</Text>
              {isEditingName ? (
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  style={styles.nameInput}
                  autoFocus
                  maxLength={20}
                  placeholder="Word Hunter"
                  placeholderTextColor={PW.color.faintWhite}
                  returnKeyType="done"
                  onSubmitEditing={handleEditName}
                />
              ) : (
                <Text style={styles.playerName}>{playerName}</Text>
              )}
              <Text style={styles.profileLevel}>{rank.description}</Text>
            </View>
          </View>
          <View style={styles.profileStats}>
            <Text style={styles.profileStatText}>
              {progress.masteredWords.length} Mastered · {ghostsToShow.length} Ghosts
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEditingName ? 'Save Name' : 'Edit Name'}
            onPress={handleEditName}
            style={({ pressed }) => [styles.disabledButton, pressed && styles.pressed]}
          >
            <Text style={styles.disabledButtonText}>
              {isEditingName ? 'Save Name' : 'Edit Name'}
            </Text>
          </Pressable>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game</Text>
          <ImageBackground
            source={stoneTileTexture}
            resizeMode="repeat"
            style={styles.card}
            imageStyle={styles.cardTexture}
          >
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
            <ToggleRow
              label="Daily Reminder"
              enabled={dailyReminderEnabled}
              onPress={handleDailyReminderToggle}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Replay Hunt tutorial"
              onPress={handleTutorialReplay}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Tutorial Replay</Text>
                <Text style={styles.rowNote}>See the Hunt, Boss, and Haunt intros again</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <ToggleRow
              label="Reduce Motion"
              enabled={reduceMotionOverride}
              onPress={() => setReduceMotionOverride(!reduceMotionOverride)}
            />
            <ToggleRow
              label="Reduce Flashes"
              enabled={reduceFlashesOverride}
              onPress={() => setReduceFlashesOverride(!reduceFlashesOverride)}
            />
          </ImageBackground>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <ImageBackground
            source={stoneTileTexture}
            resizeMode="repeat"
            style={styles.card}
            imageStyle={styles.cardTexture}
          >
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Credits"
              onPress={() => setShowCredits(true)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Credits</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Privacy information"
              onPress={() => setShowPrivacy(true)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Privacy</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <View style={[styles.row, styles.placeholderRow]}>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Version</Text>
                <Text style={styles.rowNote}>{APP_VERSION}</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playtest Data</Text>
          <ImageBackground
            source={stoneTileTexture}
            resizeMode="repeat"
            style={styles.card}
            imageStyle={styles.cardTexture}
          >
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share debug stats"
              onPress={handleSharePlaytestStats}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Share Debug Stats</Text>
                <Text style={styles.rowNote}>
                  {playtestEventCount > 0
                    ? `${playtestEventCount} events tracked on this device`
                    : 'No events tracked yet — play a Hunt or Daily run first'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear playtest data"
              onPress={handleClearPlaytestStats}
              style={({ pressed }) => [styles.row, styles.placeholderRow, pressed && styles.pressed]}
            >
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Clear Playtest Data</Text>
              </View>
            </Pressable>
          </ImageBackground>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development</Text>
            <ImageBackground
              source={stoneTileTexture}
              resizeMode="repeat"
              style={styles.card}
              imageStyle={styles.cardTexture}
            >
              <View pointerEvents="none" style={styles.plaqueHighlight} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPollyAnimations(true)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>Polly Animation Viewer</Text>
                  <Text style={styles.rowNote}>Preview five isolated motion loops</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowGauntletSpineSizer(true)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>Gauntlet Spine Sizer</Text>
                  <Text style={styles.rowNote}>Tune the boss spine art's scale/position live</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPollyCrown(true)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>Polly Crown Layer Test</Text>
                  <Text style={styles.rowNote}>Tilt the crown as its own layer</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </ImageBackground>
          </View>
        )}

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger / Reset</Text>
            <ImageBackground
              source={stoneTileTexture}
              resizeMode="repeat"
              style={[styles.card, styles.warningCard]}
              imageStyle={styles.cardTexture}
            >
              <View pointerEvents="none" style={styles.plaqueHighlight} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset all progress"
                onPress={handleResetProgress}
                style={({ pressed }) => [styles.row, styles.placeholderRow, pressed && styles.pressed]}
              >
                <View style={[styles.rowAccent, styles.rowAccentRose]} />
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>Reset Progress</Text>
                  <Text style={styles.rowNote}>Clears Hunt, Daily, and Polly memory — can't be undone</Text>
                </View>
              </Pressable>
            </ImageBackground>
          </View>
        )}
      </ScrollView>
      {__DEV__ && (
        <>
          <PollyAnimationDevViewer
            onClose={() => setShowPollyAnimations(false)}
            visible={showPollyAnimations}
          />
          <GauntletSpineDevViewer
            onClose={() => setShowGauntletSpineSizer(false)}
            visible={showGauntletSpineSizer}
          />
          <PollyCrownDevViewer
            onClose={() => setShowPollyCrown(false)}
            visible={showPollyCrown}
          />
        </>
      )}
      <InfoModal
        visible={showCredits}
        title="CREDITS"
        body={CREDITS_TEXT}
        onClose={() => setShowCredits(false)}
      />
      <InfoModal
        visible={showPrivacy}
        title="PRIVACY"
        body={PRIVACY_TEXT}
        onClose={() => setShowPrivacy(false)}
      />
      <BottomNav active="Settings" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
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
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 42,
    letterSpacing: 2,
  },
  subtitle: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 16,
    marginTop: 6,
  },
  profileCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: chamberMaterial.plaqueRim,
    padding: 18,
    overflow: 'hidden',
    ...PW.shadow.panel,
  },
  profileCardTexture: {
    borderRadius: 20,
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
    includeFontPadding: false,
    fontSize: 28,
    letterSpacing: 1,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileEyebrow: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  playerName: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 20,
    letterSpacing: 1,
  },
  nameInput: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 20,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: PW.color.gold,
    paddingVertical: 2,
  },
  profileLevel: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
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
    includeFontPadding: false,
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
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 1,
  },
  disabledButtonNote: {
    color: PW.color.faintWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: chamberMaterial.plaqueRim,
    overflow: 'hidden',
    ...PW.shadow.panel,
  },
  cardTexture: {
    borderRadius: 18,
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
    includeFontPadding: false,
    fontSize: 16,
  },
  rowNote: {
    color: PW.color.faintWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    marginTop: 3,
  },
  rowAccent: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  rowAccentRose: {
    backgroundColor: PW.color.rose,
  },
  chevron: {
    color: PW.color.faintWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
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
