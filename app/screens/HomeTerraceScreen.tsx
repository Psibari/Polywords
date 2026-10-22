import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeTerraceScene } from '../components/HomeTerraceScene';
import PollyHomePerch from '../components/PollyHomePerch';
import { HomeTerracePositioner } from '../dev/HomeTerracePositioner';
import { currentRect, useHomeTerraceTuning } from '../dev/homeTerraceTuning';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { useTerraceEntrance } from '../hooks/useTerraceEntrance';
import { getDisplayStreak } from '../game/dailyStreak';
import { useGameStore } from '../store/useGameStore';
import { getTodayDateString } from '../game/dailyChallengeEngine';
import { homePerch } from '../ui/pwHomeMaterials';
import { PW } from '../ui/pwTheme';
import {
  TerraceElementId,
  resolveTerraceLayout,
  terracePollyTransform,
} from '../ui/homeTerraceScene';
import { Haptics } from '../utils/haptics';
import { setMusicState, startMusic, stopMusic } from '../audio/MusicEngine';

// THE Home (outdoor night terrace, Pete 2026-10-20; swapped in as the real Home 2026-10-21). The
// old HomeScreen is parked and reachable only in dev builds as 'HomeOld'. The DEV positioner and its
// state toggles render only under __DEV__. Movement beyond the button entrance (moon rise, castle
// reveal on Daily, cage opening, Polly's landing, Hunt dive, Polybook pop, shooting stars) is a
// later step.
//
// Carried over from HomeScreen as Pete ruled 2026-10-21: GOLD FEATHER READY takes the Daily
// plaque's label (the plaque stays gold while the feather is ready), the Daily streak is the number
// on the moon, START HERE sits on the console ledge above ENTER THE HUNT for the first Hunt only,
// and the first-run Hunt glow is kept. RESUME HUNT is kept so a saved run can still be resumed.

type Props = { navigation: any };

export default function HomeTerraceScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const startGame = useGameStore((s) => s.startGame);
  const hasResumableGame = useGameStore((s) => s.hasResumableGame);
  const pollyMemoryLoaded = useGameStore((s) => s.pollyMemoryLoaded);
  const dailyResult = useGameStore((s) => s.dailyResult);
  const loadDailyResult = useGameStore((s) => s.loadDailyResult);
  const progress = useGameStore((s) => s.progress);
  const goldFeatherAvailable = useGameStore((s) => s.goldFeatherAvailable);
  const goldFeatherExpiresAt = useGameStore((s) => s.goldFeatherExpiresAt);
  const loadGoldFeather = useGameStore((s) => s.loadGoldFeather);
  const checkGoldFeatherExpiry = useGameStore((s) => s.checkGoldFeatherExpiry);
  const homeOnboardingComplete = useGameStore((s) => s.onboarding.home.completed);
  const reduceMotion = useReducedMotionPreference() !== false;

  const overrides = useHomeTerraceTuning((s) => s.overrides);
  const forceDailyPlayed = useHomeTerraceTuning((s) => s.forceDailyPlayed);
  const forceGoldFeather = useHomeTerraceTuning((s) => s.forceGoldFeather);
  const forceStreak = useHomeTerraceTuning((s) => s.forceStreak);
  const forceStartHere = useHomeTerraceTuning((s) => s.forceStartHere);
  const showCastle = useHomeTerraceTuning((s) => s.showCastle);
  const loadTuning = useHomeTerraceTuning((s) => s.load);
  const entrance = useTerraceEntrance();
  const [selected, setSelected] = useState<TerraceElementId | null>(null);
  const [showHitAreas, setShowHitAreas] = useState(false);

  useEffect(() => {
    loadTuning();
  }, [loadTuning]);

  // Same gold-feather loading as HomeScreen.
  useEffect(() => {
    loadGoldFeather().then(checkGoldFeatherExpiry).catch(() => {});
  }, [loadGoldFeather, checkGoldFeatherExpiry]);

  // First-run Hunt glow (HomeScreen's own sequence): when Home onboarding has just completed, the
  // Hunt button pulses gold. Value 0..1; the scene turns it into a gold wash.
  const huntGlow = useRef(new Animated.Value(0)).current;
  const previousHomeOnboardingComplete = useRef(homeOnboardingComplete);
  useEffect(() => {
    const justCompleted = !previousHomeOnboardingComplete.current && homeOnboardingComplete;
    previousHomeOnboardingComplete.current = homeOnboardingComplete;
    if (!justCompleted) return;
    if (reduceMotion) {
      huntGlow.setValue(0.32);
      const timer = setTimeout(() => huntGlow.setValue(0), 900);
      return () => clearTimeout(timer);
    }
    const emphasis = Animated.sequence([
      Animated.timing(huntGlow, { toValue: 0.42, duration: 180, useNativeDriver: true }),
      Animated.timing(huntGlow, { toValue: 0.12, duration: 520, useNativeDriver: true }),
      Animated.timing(huntGlow, { toValue: 0.32, duration: 180, useNativeDriver: true }),
      Animated.timing(huntGlow, { toValue: 0, duration: 620, useNativeDriver: true }),
    ]);
    emphasis.start();
    return () => emphasis.stop();
  }, [homeOnboardingComplete, huntGlow, reduceMotion]);

  // Home music, same as HomeScreen.
  useFocusEffect(
    useCallback(() => {
      setMusicState('home', 'home');
      startMusic('home');
      // Reads today's saved result so the Daily-first lighting is right. This is the same call
      // the Daily screen makes; it only writes when a result for today already exists.
      loadDailyResult().catch(() => {});
      return () => {
        stopMusic('home');
      };
    }, [loadDailyResult]),
  );

  const viewport = useMemo(() => ({ width, height, insetTop: insets.top }), [width, height, insets.top]);
  const layout = useMemo(() => resolveTerraceLayout(viewport, overrides), [viewport, overrides]);
  const dailyPlayedReal = dailyResult !== null && dailyResult.date === getTodayDateString();
  const dailyPlayed = forceDailyPlayed ?? dailyPlayedReal;
  const goldFeatherReal =
    goldFeatherAvailable && goldFeatherExpiresAt !== null && Date.now() < goldFeatherExpiresAt;
  const goldFeatherReady = forceGoldFeather ?? goldFeatherReal;
  const streak = forceStreak ?? getDisplayStreak(progress, getTodayDateString());
  const startHere = forceStartHere ?? progress.runsCompleted === 0;

  const pollyT = terracePollyTransform(
    currentRect('polly', overrides),
    viewport,
    layout.k,
    homePerch.bottomOffset,
  );

  const handleHunt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // A resumable run is already in the store (App.tsx boot check); starting fresh would
    // overwrite the run the button is offering to resume. Same rule as HomeScreen.
    if (!hasResumableGame) startGame();
    navigation.navigate('Game');
  };
  const handleDaily = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Daily');
  };
  const handleBook = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Vault');
  };

  return (
    <View style={styles.screen}>
      <HomeTerraceScene
        layout={layout}
        width={width}
        height={height}
        dailyPlayed={dailyPlayed}
        goldFeatherReady={goldFeatherReady}
        streak={streak}
        startHere={startHere}
        huntGlow={huntGlow}
        showCastle={showCastle}
        huntLabel={hasResumableGame ? 'RESUME HUNT' : 'ENTER THE HUNT'}
        selected={selected}
        showHitAreas={showHitAreas}
        onDaily={handleDaily}
        onHunt={handleHunt}
        onBook={handleBook}
        onSettings={() => navigation.navigate('Settings')}
        entrance={entrance}
        polly={
          pollyMemoryLoaded ? (
            <View
              pointerEvents="none"
              style={[
                styles.pollyWrap,
                {
                  width,
                  height,
                  transform: [
                    { translateX: pollyT.translateX },
                    { translateY: pollyT.translateY },
                    { scale: pollyT.scale },
                  ],
                  transformOrigin: `${pollyT.originX}px ${pollyT.originY}px`,
                },
              ]}
            >
              <PollyHomePerch />
            </View>
          ) : null
        }
      />
      {__DEV__ ? (
      <HomeTerracePositioner
        k={layout.k}
        selected={selected}
        onSelect={setSelected}
        showHitAreas={showHitAreas}
        onToggleHitAreas={() => setShowHitAreas((v) => !v)}
        onExit={() => navigation.navigate('HomeOld')}
      />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bg },
  pollyWrap: { position: 'absolute', left: 0, top: 0 },
});
