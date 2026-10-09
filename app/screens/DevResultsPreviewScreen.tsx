import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import ResultsScreen from './ResultsScreen';
import { HUNT_SKY_TUNING } from '../ui/ambientSkyTuning';
import { PW } from '../ui/pwTheme';
import { useGameStore } from '../store/useGameStore';
import type { ResultsDevPreviewOutcome } from '../game/resultsDevPreview';

type Props = {
  navigation: any;
  route: { params?: { outcome?: ResultsDevPreviewOutcome } };
};

export default function DevResultsPreviewScreen({ navigation, route }: Props) {
  const startGame = useGameStore(s => s.startGame);
  const outcome: ResultsDevPreviewOutcome = route.params?.outcome === 'buster' ? 'buster' : 'king';

  if (!__DEV__) return null;

  return (
    <View style={styles.screen}>
      <AmbientSkyBackground {...HUNT_SKY_TUNING} />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="devResultsVignette" cx="50%" cy="30%" r="72%">
            <Stop offset="0%" stopColor={PW.color.bgDeep} stopOpacity={0.24} />
            <Stop offset="45%" stopColor={PW.color.bgDeep} stopOpacity={0.20} />
            <Stop offset="100%" stopColor={PW.color.bgDeep} stopOpacity={0.56} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#devResultsVignette)" />
      </Svg>
      <SafeAreaView style={styles.content}>
        <ResultsScreen
          devPreviewOutcome={outcome}
          onRestart={() => {
            startGame();
            navigation.replace('Game');
          }}
          onHome={() => navigation.navigate('Home')}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
  },
  content: {
    flex: 1,
  },
});
