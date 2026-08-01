import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { computeGroundLayout, StarDensity } from './ambientSkyLayout';
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
};

const groundSource = require('../../assets/backgrounds/bgbottom.png');

export default function AmbientSkyBackground({
  tint,
  starDensity = 'medium',
  driftSpeedMs = 26000,
  meteorsEnabled = false,
}: AmbientSkyBackgroundProps) {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);
  const layout = width > 0 ? computeGroundLayout(width) : null;
  const reducedMotion = !!useReducedMotionPreference();

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} onLayout={onLayout} pointerEvents="none">
      <LinearGradient colors={tint} style={StyleSheet.absoluteFill} />
      <AmbientDriftLayer durationMs={driftSpeedMs} frozen={reducedMotion} />
      <AmbientTwinkleLayer density={starDensity} frozen={reducedMotion} />
      {meteorsEnabled && <AmbientMeteorLayer frozen={reducedMotion} />}
      {layout && (
        <View style={[styles.groundBand, { height: layout.bandHeight }]}>
          <Image
            source={groundSource}
            resizeMode="stretch"
            style={{
              width: layout.imageWidth,
              height: layout.imageHeight,
              top: layout.imageOffsetY,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  groundBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
