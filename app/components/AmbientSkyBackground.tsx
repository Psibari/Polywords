import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StarDensity, MoonPhase } from './ambientSkyLayout';
import GraphicGround from './GraphicGround';
import Moon from './Moon';
import AmbientDriftLayer from './AmbientDriftLayer';
import AmbientTwinkleLayer from './AmbientTwinkleLayer';
import AmbientMeteorLayer from './AmbientMeteorLayer';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';

export type { StarDensity } from './ambientSkyLayout';

export type AmbientSkyBackgroundProps = {
  tint: [string, string];
  starDensity?: StarDensity;
  driftSpeedMs?: number;
  meteorsEnabled?: boolean;
  moonPhase: MoonPhase;
  starTint?: string;
};

export default function AmbientSkyBackground({
  tint,
  starDensity = 'medium',
  driftSpeedMs = 26000,
  meteorsEnabled = false,
  moonPhase,
  starTint,
}: AmbientSkyBackgroundProps) {
  // Treat the pending (null) read as "reduce" — matches usePollyAmbientMotion's
  // `reduceMotion !== false` convention. Coercing null to false would start every
  // loop for a frame or two before the async accessibility read lands, and would
  // make AmbientTwinkleLayer's static-frame initial value unreachable.
  const reducedMotion = useReducedMotionPreference() !== false;

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      <LinearGradient colors={tint} style={StyleSheet.absoluteFill} />
      <AmbientDriftLayer durationMs={driftSpeedMs} frozen={reducedMotion} tint={starTint} />
      <AmbientTwinkleLayer density={starDensity} frozen={reducedMotion} tint={starTint} />
      {meteorsEnabled && <AmbientMeteorLayer frozen={reducedMotion} />}
      <View style={styles.moonWrap}>
        <Moon phase={moonPhase} tint={starTint} />
      </View>
      <View style={styles.groundBand}>
        <GraphicGround />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  moonWrap: {
    position: 'absolute',
    top: '8%',
    right: '10%',
  },
  groundBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    aspectRatio: 390 / 420,
  },
});
