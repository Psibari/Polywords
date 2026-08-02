import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import { HOME_SKY_TUNING } from '../ui/ambientSkyTuning';
import HomeEmbers from '../components/HomeEmbers';
import PollyHomePerch from '../components/PollyHomePerch';
import { HomeWordmark } from '../components/ui/HomeWordmark';
import { DailyQuillGlyph, VaultSpinesGlyph } from '../components/ui/HomeDoorGlyphs';
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';
import { getTodayDateString } from '../game/dailyChallengeEngine';
import { getDisplayStreak } from '../game/dailyStreak';
import { heroBookMaterial } from '../ui/pwMaterials';
import { DAILY_CLUE_TITLE } from '../ui/pwDailyMaterials';
import { homeDoor, homeType } from '../ui/pwHomeMaterials';
import { PW } from '../ui/pwTheme';
import { usePulseScale } from '../hooks/usePulseScale';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const startGame = useGameStore(s => s.startGame);
  const hasResumableGame = useGameStore(s => s.hasResumableGame);
  const progress = useGameStore(s => s.progress);
  const pollyMemoryLoaded = useGameStore(s => s.pollyMemoryLoaded);
  const streak = getDisplayStreak(progress, getTodayDateString());
  const wordmarkWidth = Math.min(Dimensions.get('window').width - 40, 520);
  const dareScale = usePulseScale();

  function handleHunt() {
    // A resumable run is already hydrated into the store by App.tsx's boot
    // check — starting fresh here would overwrite the very run this button
    // is offering to resume.
    if (!hasResumableGame) startGame();
    navigation.navigate('Game');
  }

  return (
    <View style={styles.screen}>
      <AmbientSkyBackground {...HOME_SKY_TUNING} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(6,4,22,0.45)', 'rgba(9,6,26,0.22)', 'rgba(7,5,23,0.38)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Title block — bespoke POLYWORDS brand lockup */}
            <View style={styles.titleBlock}>
              <View style={styles.wordmarkBox}>
                <HomeWordmark width={wordmarkWidth} />
              </View>
            </View>

            {/* Open plaza — Polly's room to breathe */}
            <View style={styles.plaza} />

            {/* The Home book â€” all primary routes are plates on the cover */}
            <Animated.View style={[styles.homeBookWrap, { transform: [{ scale: dareScale }] }]}>
              <View pointerEvents="none" style={styles.bookDepthShadow} />
              <LinearGradient
                pointerEvents="none"
                colors={[
                  heroBookMaterial.pagesCreamTop,
                  heroBookMaterial.pagesCream,
                  heroBookMaterial.pagesCreamBot,
                ]}
                style={styles.bookPageBlock}
              >
                <View style={styles.bookPageLineTop} />
                <View style={styles.bookPageLineMid} />
                <View style={styles.bookPageLineLow} />
              </LinearGradient>
              <LinearGradient
                colors={[
                  heroBookMaterial.coverPurpleTop,
                  heroBookMaterial.coverPurple,
                  heroBookMaterial.coverPurpleBot,
                ]}
                locations={[0, 0.46, 1]}
                style={styles.homeBookCover}
              >
                <View pointerEvents="none" style={styles.bookSpine}>
                  <View style={styles.bookSpineBandTop} />
                  <Text style={styles.bookSpineText}>PW</Text>
                  <View style={styles.bookSpineBandBottom} />
                </View>
                <View pointerEvents="none" style={styles.huntBookOuterTooling} />
                <View pointerEvents="none" style={styles.huntBookInnerTooling} />
                <View pointerEvents="none" style={styles.huntBookPinLeft} />
                <View pointerEvents="none" style={styles.huntBookPinRight} />
                <Text style={styles.huntBookHingeText}>POLLY'S VAULT</Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={hasResumableGame ? 'Resume Hunt' : 'Enter the Hunt'}
                  onPress={handleHunt}
                  style={({ pressed }) => [styles.huntPlate, pressed && styles.pressed]}
                >
                  {progress.runsCompleted === 0 && (
                    <View style={styles.startHereBadge}>
                      <Text style={styles.startHereBadgeText}>START HERE</Text>
                    </View>
                  )}
                  <Text style={styles.dareLabel}>
                    {hasResumableGame ? 'RESUME HUNT' : 'ENTER THE HUNT'}
                  </Text>
                </Pressable>

                <View style={styles.coverPlateRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open Polly's Daily Challenge"
                    onPress={() => navigation.navigate('Daily')}
                    style={({ pressed }) => [
                      styles.coverPlate,
                      styles.dailyPlate,
                      pressed && styles.pressed,
                    ]}
                  >
                    {streak > 0 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakBadgeText}>{streak}</Text>
                      </View>
                    )}
                    <DailyQuillGlyph size={24} />
                    <Text style={styles.doorTitle}>{DAILY_CLUE_TITLE}</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open the Word Vault"
                    onPress={() => navigation.navigate('Vault')}
                    style={({ pressed }) => [
                      styles.coverPlate,
                      styles.vaultPlate,
                      pressed && styles.pressed,
                    ]}
                  >
                    <VaultSpinesGlyph size={24} />
                    <Text style={styles.doorTitle}>WORD VAULT</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Quiet settings — low opacity, never tiny */}
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              style={({ pressed }) => [styles.settingsLinkWrap, pressed && styles.pressed]}
            >
              <Text style={styles.settingsLink}>SETTINGS</Text>
            </Pressable>
          </View>
        </SafeAreaView>

      <HomeEmbers />
      {pollyMemoryLoaded && <PollyHomePerch />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    zIndex: 3,
  },
  titleBlock: {
    alignItems: 'center',
  },
  wordmarkBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  plaza: {
    flex: 1,
  },
  homeBookWrap: {
    marginHorizontal: 10,
    minHeight: 314,
    paddingRight: 12,
    paddingBottom: 14,
    position: 'relative',
    ...PW.shadow.cardLifted,
  },
  bookDepthShadow: {
    position: 'absolute',
    left: 14,
    right: 1,
    top: 22,
    bottom: 1,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  bookPageBlock: {
    position: 'absolute',
    left: 24,
    right: 0,
    top: 20,
    bottom: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 28,
    borderWidth: 1,
    borderColor: PW.color.outlineSoft,
    overflow: 'hidden',
  },
  bookPageLineTop: {
    position: 'absolute',
    left: 24,
    right: 14,
    bottom: 22,
    height: 1,
    backgroundColor: heroBookMaterial.pagesLine,
  },
  bookPageLineMid: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 15,
    height: 1,
    backgroundColor: heroBookMaterial.pagesLine,
    opacity: 0.72,
  },
  bookPageLineLow: {
    position: 'absolute',
    left: 26,
    right: 22,
    bottom: 8,
    height: 1,
    backgroundColor: heroBookMaterial.pagesLine,
    opacity: 0.52,
  },
  homeBookCover: {
    minHeight: 300,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 14,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 24,
    borderWidth: 2,
    borderColor: heroBookMaterial.goldHairline,
    paddingLeft: 54,
    paddingRight: 14,
    paddingTop: 34,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: heroBookMaterial.hingeDark,
    borderRightWidth: 1,
    borderRightColor: heroBookMaterial.goldHairline,
  },
  bookSpineBandTop: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: heroBookMaterial.goldHairline,
  },
  bookSpineBandBottom: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: heroBookMaterial.goldHairline,
  },
  bookSpineText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: 15,
    letterSpacing: 1,
    textShadowColor: PW.color.textShadowMedium,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  huntBookHingeText: {
    color: 'rgba(255,247,214,0.62)',
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  huntBookOuterTooling: {
    position: 'absolute',
    left: 48,
    right: 10,
    top: 18,
    bottom: 14,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 20,
    borderWidth: 1.5,
    borderColor: heroBookMaterial.goldHairline,
  },
  huntBookInnerTooling: {
    position: 'absolute',
    left: 60,
    right: 22,
    top: 50,
    bottom: 28,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: PW.color.goldSoft,
  },
  huntBookPinLeft: {
    position: 'absolute',
    left: 54,
    top: 36,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: heroBookMaterial.goldPin,
    borderWidth: 1,
    borderColor: heroBookMaterial.goldPinInner,
  },
  huntBookPinRight: {
    position: 'absolute',
    right: 25,
    top: 36,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: heroBookMaterial.goldPin,
    borderWidth: 1,
    borderColor: heroBookMaterial.goldPinInner,
  },
  huntPlate: {
    width: '100%',
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: heroBookMaterial.goldHairline,
    backgroundColor: PW.color.overlayLight,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  startHereBadge: {
    position: 'absolute',
    top: -12,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: PW.color.gold,
    zIndex: 5,
  },
  startHereBadgeText: {
    color: PW.color.surfaceDeep,
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  dareLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: homeType.dareLabel,
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.74)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  coverPlateRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  coverPlate: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: 'rgba(15,13,42,0.36)',
  },
  dailyPlate: {
    borderColor: homeDoor.dailyTrim,
  },
  vaultPlate: {
    borderColor: homeDoor.vaultTrim,
  },
  doorTitle: {
    color: homeDoor.title,
    fontFamily: FONTS.hud,
    fontSize: homeType.doorTitle,
    letterSpacing: 1,
    marginTop: 9,
    textAlign: 'center',
  },
  streakBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: PW.color.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadgeText: {
    color: PW.color.surfaceDeep,
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  settingsLinkWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingsLink: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    fontSize: homeType.settingsLink,
    letterSpacing: 1.6,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.96 }],
  },
});
