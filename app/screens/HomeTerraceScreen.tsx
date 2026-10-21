import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeTerraceScene } from '../components/HomeTerraceScene';
import PollyHomePerch from '../components/PollyHomePerch';
import { HomeTerracePositioner } from '../dev/HomeTerracePositioner';
import { currentRect, useHomeTerraceTuning } from '../dev/homeTerraceTuning';
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

// DEV-only work-in-progress Home (outdoor night terrace, Pete 2026-10-20). Reached from Settings
// (DEV) while __DEV__; the real HomeScreen is untouched. Static art and navigation only: movement
// (slabs sliding, Hunt dive, Polybook pop, cage fall, shooting stars, breathing glows) is a later
// step, after Pete has set the positions with the positioner.
//
// Not carried over from HomeScreen because Pete has not decided them for the terrace (lockdown doc,
// section B): START HERE badge, GOLD FEATHER READY, the Daily streak badge, the first-run Hunt
// glow, and Home onboarding. RESUME HUNT is kept so a saved run can still be resumed.

type Props = { navigation: any };

export default function HomeTerraceScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const startGame = useGameStore((s) => s.startGame);
  const hasResumableGame = useGameStore((s) => s.hasResumableGame);
  const pollyMemoryLoaded = useGameStore((s) => s.pollyMemoryLoaded);
  const dailyResult = useGameStore((s) => s.dailyResult);
  const loadDailyResult = useGameStore((s) => s.loadDailyResult);

  const overrides = useHomeTerraceTuning((s) => s.overrides);
  const forceDailyPlayed = useHomeTerraceTuning((s) => s.forceDailyPlayed);
  const loadTuning = useHomeTerraceTuning((s) => s.load);
  const [selected, setSelected] = useState<TerraceElementId | null>(null);
  const [showHitAreas, setShowHitAreas] = useState(false);

  useEffect(() => {
    loadTuning();
  }, [loadTuning]);

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
        huntLabel={hasResumableGame ? 'RESUME HUNT' : 'ENTER THE HUNT'}
        selected={selected}
        showHitAreas={showHitAreas}
        onDaily={handleDaily}
        onHunt={handleHunt}
        onBook={handleBook}
        onSettings={() => navigation.navigate('Settings')}
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
      <HomeTerracePositioner
        k={layout.k}
        selected={selected}
        onSelect={setSelected}
        showHitAreas={showHitAreas}
        onToggleHitAreas={() => setShowHitAreas((v) => !v)}
        onExit={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bg },
  pollyWrap: { position: 'absolute', left: 0, top: 0 },
});
