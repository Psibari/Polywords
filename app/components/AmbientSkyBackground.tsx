import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
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
  // Hunt/Boss's TopBar is wide and opaque enough to sit directly over the
  // default position, hiding the moon entirely — screens with tall top
  // chrome should override these rather than share the default.
  moonTop?: DimensionValue;
  moonRight?: DimensionValue;
  showGround?: boolean;
  // When provided, the ground band fills from this many points below the
  // screen top down to the bottom (cropped via GraphicGround's own
  // resizeMode="cover") instead of the default aspectRatio-based sizing.
  groundTopInset?: number;
};

export default function AmbientSkyBackground({
  tint,
  starDensity = 'medium',
  driftSpeedMs = 26000,
  meteorsEnabled = false,
  moonPhase,
  starTint,
  moonTop = '8%',
  moonRight = '10%',
  showGround = true,
  groundTopInset,
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
      <View style={[styles.moonWrap, { top: moonTop, right: moonRight }]}>
        <Moon phase={moonPhase} />
      </View>
      {showGround && (
        <View
          style={[
            styles.groundBand,
            groundTopInset === undefined
              ? styles.groundBandAspect
              : { top: groundTopInset },
          ]}
        >
          <GraphicGround />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  moonWrap: {
    position: 'absolute',
  },
  groundBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  groundBandAspect: {
    aspectRatio: 853 / 1844,
  },
});
