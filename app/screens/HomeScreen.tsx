import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { DAILY_CLUE_TITLE } from '../ui/pwDailyMaterials';
import { homeDare, homeDoor, homeType } from '../ui/pwHomeMaterials';
import { PW } from '../ui/pwTheme';
import { usePulseScale } from '../hooks/usePulseScale';
import { Haptics } from '../utils/haptics';

const HOME_BOOK_IMAGE = require('../../assets/images/homebook/homebook1.png');
// Book geometry is locked (tuned on device). The three route plates are
// positioned absolutely inside the cover, each driven by its own X/Y/H/W
// state so they can be fitted inside the painted gold frame from the
// dev-only tweak panel (bottom-left).
const HOME_BOOK_HEIGHT = 440;
const HOME_BOOK_MAX_WIDTH = 350;
const HOME_BOOK_OFFSET_X = -5;
const HOME_BOOK_OFFSET_Y = 115;

// Default plate placement (book-local pt) — tuned on device to sit inside
// the painted gold frame.
const HUNT_X = 68, HUNT_Y = 75, HUNT_W = 235, HUNT_H = 75;
const DAILY_X = 67, DAILY_Y = 160, DAILY_W = 115, DAILY_H = 104;
const VAULT_X = 190, VAULT_Y = 160, VAULT_W = 115, VAULT_H = 104;

// Route-plate faces — purple ink plaques in the book's family
const DAILY_PLATE_FACE = ['#211B4A', '#0F0D2A'] as const;
const VAULT_PLATE_FACE = ['#17143A', '#0F0D2A'] as const;

// Dev-only treatment previews for the plate redesign discussion.
//   current — gold-foil HUNT + dark tiles with gold medallions (as shipped)
//   deboss  — all three carved into the cover: flat dark faces, no glow,
//             faint gold hairline, gold text (reads engraved, not stuck on)
//   foil    — HUNT keeps the gold dare; tiles go quiet (no medallions, flat)
const HUNT_FACE_DEBOSS = ['#251F4E', '#161233'] as const;
const TILE_FACE_QUIET = ['#1D1840', '#130F2C'] as const;
type PlateTreatment = 'current' | 'deboss' | 'foil';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const startGame = useGameStore(s => s.startGame);
  const hasResumableGame = useGameStore(s => s.hasResumableGame);
  const progress = useGameStore(s => s.progress);
  const goldFeatherAvailable = useGameStore(s => s.goldFeatherAvailable);
  const goldFeatherExpiresAt = useGameStore(s => s.goldFeatherExpiresAt);
  const loadGoldFeather = useGameStore(s => s.loadGoldFeather);
  const checkGoldFeatherExpiry = useGameStore(s => s.checkGoldFeatherExpiry);
  const pollyMemoryLoaded = useGameStore(s => s.pollyMemoryLoaded);
  const streak = getDisplayStreak(progress, getTodayDateString());
  const wordmarkWidth = Math.min(Dimensions.get('window').width - 40, 520);
  const dareScale = usePulseScale();
  const [huntX, setHuntX] = useState(HUNT_X);
  const [huntY, setHuntY] = useState(HUNT_Y);
  const [huntW, setHuntW] = useState(HUNT_W);
  const [huntH, setHuntH] = useState(HUNT_H);
  const [dailyX, setDailyX] = useState(DAILY_X);
  const [dailyY, setDailyY] = useState(DAILY_Y);
  const [dailyW, setDailyW] = useState(DAILY_W);
  const [dailyH, setDailyH] = useState(DAILY_H);
  const [vaultX, setVaultX] = useState(VAULT_X);
  const [vaultY, setVaultY] = useState(VAULT_Y);
  const [vaultW, setVaultW] = useState(VAULT_W);
  const [vaultH, setVaultH] = useState(VAULT_H);
  // DEBOSS is the chosen plate design (carved into the cover); the switcher
  // stays live in dev so we can still compare against current/foil.
  const [treatment, setTreatment] = useState<PlateTreatment>('deboss');
  const huntQuiet = treatment === 'deboss';
  const tilesQuiet = treatment === 'deboss' || treatment === 'foil';
  // Press-time gold bloom on all three plates (feedback only — the resting
  // deboss state stays flat). Fades in on press, out on release.
  const huntGlow = useRef(new Animated.Value(0)).current;
  const dailyGlow = useRef(new Animated.Value(0)).current;
  const vaultGlow = useRef(new Animated.Value(0)).current;
  const glowOn = (v: Animated.Value) =>
    Animated.timing(v, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  const glowOff = (v: Animated.Value) =>
    Animated.timing(v, { toValue: 0, duration: 320, useNativeDriver: true }).start();
  const pressHunt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleHunt();
  };
  const pressDaily = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Daily');
  };
  const pressVault = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Vault');
  };
  const goldFeatherReady = goldFeatherAvailable &&
    goldFeatherExpiresAt !== null &&
    Date.now() < goldFeatherExpiresAt;

  useEffect(() => {
    loadGoldFeather().then(checkGoldFeatherExpiry).catch(() => {});
  }, [loadGoldFeather, checkGoldFeatherExpiry]);

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
      {/* Same dark (PW.color.surfaceDeep / cardFace, rgb 15,13,42) GameScreen
          and DailyChallengeScreen already use for this same scrim — this was
          three different one-off near-blacks that didn't match either. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(15,13,42,0.45)', 'rgba(15,13,42,0.22)', 'rgba(15,13,42,0.38)']}
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

            {/* The Home book — all primary routes are plates on the cover */}
            <View style={styles.homeBookWrap}>
              <View style={[styles.homeBookBody, { transform: [{ translateX: HOME_BOOK_OFFSET_X }, { translateY: HOME_BOOK_OFFSET_Y }] }]}>
              <Image
                source={HOME_BOOK_IMAGE}
                resizeMode="stretch"
                style={[styles.homeBookImage, { height: HOME_BOOK_HEIGHT }]}
              />
                <View pointerEvents="box-none" style={styles.homeBookCover}>
                  <Text style={styles.bookSpineText}>PW</Text>
                  <Text style={styles.huntBookHingeText}>WORD VAULT</Text>

                  {/* Hunt plate — absolute placement, tweaked per-button */}
                  <View
                    pointerEvents="box-none"
                    style={[styles.platePos, { left: huntX, top: huntY, width: huntW, height: huntH }]}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.plateGlowBloom, { opacity: huntGlow }]}
                    />
                    <Animated.View style={[styles.huntPulseWrap, { transform: [{ scale: dareScale }] }]}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${hasResumableGame ? 'Resume Hunt' : 'Enter the Hunt'}${goldFeatherReady ? '. Gold Feather ready.' : ''}`}
                        onPress={pressHunt}
                        onPressIn={() => glowOn(huntGlow)}
                        onPressOut={() => glowOff(huntGlow)}
                        style={({ pressed }) => [
                          styles.huntShell,
                          huntQuiet && styles.huntShellDeboss,
                          pressed && styles.pressed,
                        ]}
                      >
                        <LinearGradient
                          colors={huntQuiet ? HUNT_FACE_DEBOSS : [...homeDare.faceGradient]}
                          locations={huntQuiet ? undefined : [...homeDare.faceLocations]}
                          style={styles.huntFace}
                        >
                          {!huntQuiet && <View style={styles.huntFaceEdge} />}
                          {progress.runsCompleted === 0 && (
                            <View style={styles.startHereBadge}>
                              <Text style={styles.startHereBadgeText}>START HERE</Text>
                            </View>
                          )}
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.55}
                            style={[styles.dareLabel, huntQuiet && styles.dareLabelDeboss]}
                          >
                            {hasResumableGame ? 'RESUME HUNT' : 'ENTER THE HUNT'}
                          </Text>
                          {goldFeatherReady && (
                            <Text style={[styles.goldFeatherReady, huntQuiet && styles.goldFeatherReadyDeboss]}>
                              GOLD FEATHER READY
                            </Text>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  </View>

                  {/* Daily plate */}
                  <View
                    pointerEvents="box-none"
                    style={[styles.platePos, { left: dailyX, top: dailyY, width: dailyW, height: dailyH }]}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.plateGlowBloom, { opacity: dailyGlow }]}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open Polly's Daily Challenge"
                      onPress={pressDaily}
                      onPressIn={() => glowOn(dailyGlow)}
                      onPressOut={() => glowOff(dailyGlow)}
                      style={({ pressed }) => [
                        styles.coverPlate,
                        styles.dailyPlate,
                        tilesQuiet && styles.coverPlateQuiet,
                        pressed && styles.pressed,
                      ]}
                    >
                      {streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakBadgeText}>{streak}</Text>
                        </View>
                      )}
                      <LinearGradient
                        colors={tilesQuiet ? TILE_FACE_QUIET : [...DAILY_PLATE_FACE]}
                        style={styles.coverPlateFace}
                      >
                        <View style={[styles.glyphMedallion, tilesQuiet && styles.glyphMedallionQuiet]}>
                          <DailyQuillGlyph size={22} />
                        </View>
                        <Text style={styles.doorTitle}>{DAILY_CLUE_TITLE}</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>

                  {/* Vault plate */}
                  <View
                    pointerEvents="box-none"
                    style={[styles.platePos, { left: vaultX, top: vaultY, width: vaultW, height: vaultH }]}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.plateGlowBloom, { opacity: vaultGlow }]}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open the Word Vault"
                      onPress={pressVault}
                      onPressIn={() => glowOn(vaultGlow)}
                      onPressOut={() => glowOff(vaultGlow)}
                      style={({ pressed }) => [
                        styles.coverPlate,
                        styles.vaultPlate,
                        tilesQuiet && styles.coverPlateQuiet,
                        pressed && styles.pressed,
                      ]}
                    >
                      <LinearGradient
                        colors={tilesQuiet ? TILE_FACE_QUIET : [...VAULT_PLATE_FACE]}
                        style={styles.coverPlateFace}
                      >
                        <View style={[styles.glyphMedallion, tilesQuiet && styles.glyphMedallionQuiet]}>
                          <VaultSpinesGlyph size={22} />
                        </View>
                        <Text style={styles.doorTitle}>WORD VAULT</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Quiet settings — low opacity, never tiny */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
              onPress={() => navigation.navigate('Settings')}
              style={({ pressed }) => [styles.settingsLinkWrap, pressed && styles.pressed]}
            >
              <Text style={styles.settingsLink}>SETTINGS</Text>
            </Pressable>
          </View>
        </SafeAreaView>

      {/* Dev-only tuning stays on web (preview) so it never covers the book
          on a real device — all values are locked defaults on phone. */}
      {__DEV__ && Platform.OS === 'web' && (
        <View pointerEvents="box-none" style={styles.bookTweakPanel}>
          <View style={styles.tweakTreatmentRow}>
            {(['current', 'deboss', 'foil'] as PlateTreatment[]).map(t => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`Treatment ${t}`}
                onPress={() => setTreatment(t)}
                style={[styles.treatmentBtn, treatment === t && styles.treatmentBtnActive]}
              >
                <Text style={styles.treatmentBtnText}>{t.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.tweakPlateRow}>
            <Text style={styles.tweakPlateName}>HUNT</Text>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>X</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate left"
                onPress={() => setHuntX(x => Math.max(-200, x - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{huntX}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate right"
                onPress={() => setHuntX(x => Math.min(300, x + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>Y</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate up"
                onPress={() => setHuntY(y => Math.max(-100, y - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{huntY}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate down"
                onPress={() => setHuntY(y => Math.min(400, y + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>H</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate shorter"
                onPress={() => setHuntH(h => Math.max(40, h - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{huntH}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate taller"
                onPress={() => setHuntH(h => Math.min(300, h + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>W</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate narrower"
                onPress={() => setHuntW(w => Math.max(60, w - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{huntW}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hunt plate wider"
                onPress={() => setHuntW(w => Math.min(350, w + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.tweakPlateRow}>
            <Text style={styles.tweakPlateName}>DAILY</Text>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>X</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate left"
                onPress={() => setDailyX(x => Math.max(-200, x - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{dailyX}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate right"
                onPress={() => setDailyX(x => Math.min(300, x + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>Y</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate up"
                onPress={() => setDailyY(y => Math.max(-100, y - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{dailyY}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate down"
                onPress={() => setDailyY(y => Math.min(400, y + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>H</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate shorter"
                onPress={() => setDailyH(h => Math.max(40, h - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{dailyH}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate taller"
                onPress={() => setDailyH(h => Math.min(300, h + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>W</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate narrower"
                onPress={() => setDailyW(w => Math.max(60, w - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{dailyW}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily plate wider"
                onPress={() => setDailyW(w => Math.min(350, w + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.tweakPlateRow}>
            <Text style={styles.tweakPlateName}>VAULT</Text>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>X</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate left"
                onPress={() => setVaultX(x => Math.max(-200, x - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{vaultX}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate right"
                onPress={() => setVaultX(x => Math.min(300, x + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>Y</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate up"
                onPress={() => setVaultY(y => Math.max(-100, y - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{vaultY}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate down"
                onPress={() => setVaultY(y => Math.min(400, y + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>H</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate shorter"
                onPress={() => setVaultH(h => Math.max(40, h - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{vaultH}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate taller"
                onPress={() => setVaultH(h => Math.min(300, h + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.tweakGroup}>
              <Text style={styles.tweakLabel}>W</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate narrower"
                onPress={() => setVaultW(w => Math.max(60, w - 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>−</Text>
              </Pressable>
              <Text style={styles.bookTweakValue}>{vaultW}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vault plate wider"
                onPress={() => setVaultW(w => Math.min(350, w + 2))}
                style={({ pressed }) => [styles.bookTweakBtn, pressed && styles.pressed]}
              >
                <Text style={styles.bookTweakText}>＋</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

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
    marginHorizontal: -10,
    position: 'relative',
  },
  homeBookBody: {
    width: '100%',
    maxWidth: HOME_BOOK_MAX_WIDTH,
    alignSelf: 'center',
    position: 'relative',
    ...PW.shadow.cardLifted,
  },
  homeBookImage: {
    width: '100%',
  },
  homeBookCover: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  platePos: {
    position: 'absolute',
  },
  plateGlowBloom: {
    position: 'absolute',
    left: -6,
    right: -6,
    top: -6,
    bottom: -6,
    borderRadius: 22,
    backgroundColor: 'rgba(245,200,66,0.16)',
    ...PW.shadow.glowGold,
  },
  bookSpineText: {
    position: 'absolute',
    left: 0,
    width: 40,
    top: '50%',
    marginTop: -10,
    textAlign: 'center',
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 1,
    textShadowColor: PW.color.textShadowMedium,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  huntBookHingeText: {
    color: 'rgba(255,247,214,0.62)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 40,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  huntShell: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: homeDare.rim,
    overflow: 'hidden',
    ...PW.shadow.glowGold,
  },
  huntShellDeboss: {
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.30)',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  huntFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  huntFaceEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: homeDare.bottomEdge,
  },
  huntPulseWrap: {
    width: '100%',
    height: '100%',
  },
  goldFeatherReady: {
    marginTop: 5,
    color: 'rgba(20,16,42,0.82)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: homeType.goldFeatherReady,
    letterSpacing: 1.8,
  },
  goldFeatherReadyDeboss: {
    color: 'rgba(255,247,214,0.75)',
  },
  startHereBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: PW.color.surfaceDeep,
    borderWidth: 1,
    borderColor: PW.color.goldSoft,
    zIndex: 5,
  },
  startHereBadgeText: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  dareLabel: {
    color: PW.color.surfaceDeep,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: homeType.dareLabel,
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.30)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dareLabelDeboss: {
    color: PW.color.gold,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  coverPlateRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  tweakTreatmentRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  treatmentBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.35)',
    backgroundColor: 'rgba(15,13,42,0.9)',
  },
  treatmentBtnActive: {
    backgroundColor: 'rgba(245,200,66,0.28)',
    borderColor: PW.color.gold,
  },
  treatmentBtnText: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 1,
  },
  tweakPlateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tweakPlateName: {
    color: 'rgba(245,200,66,0.95)',
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 1,
    width: 44,
    textAlign: 'left',
    marginTop: 16,
  },
  coverPlate: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  coverPlateQuiet: {
    borderColor: 'rgba(245,200,66,0.22)',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  coverPlateFace: {
    minHeight: 96,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  glyphMedallion: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(245,200,66,0.10)',
    marginBottom: 10,
  },
  glyphMedallionQuiet: {
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.25)',
    backgroundColor: 'rgba(245,200,66,0.05)',
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
    includeFontPadding: false,
    fontSize: homeType.doorTitle,
    letterSpacing: 1,
    marginTop: 0,
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
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  bookTweakPanel: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'column',
    gap: 4,
    zIndex: 20,
    backgroundColor: 'rgba(15,13,42,0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tweakGroup: {
    alignItems: 'center',
    gap: 2,
    width: 40,
  },
  tweakLabel: {
    color: 'rgba(245,200,66,0.9)',
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 9,
    letterSpacing: 1,
  },
  bookTweakBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,13,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTweakText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 16,
  },
  bookTweakValue: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  settingsLinkWrap: {
    // Floats above the book (which is taller + offset now) so SETTINGS is
    // always visible in the bottom-right corner, never covered.
    position: 'absolute',
    right: 4,
    bottom: 14,
    zIndex: 15,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingsLink: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: homeType.settingsLink,
    letterSpacing: 1.6,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.96 }],
  },
});
