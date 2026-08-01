import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { computeGroundLayout, StarDensity } from './ambientSkyLayout';

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
}: AmbientSkyBackgroundProps) {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);
  const layout = width > 0 ? computeGroundLayout(width) : null;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      <LinearGradient colors={tint} style={StyleSheet.absoluteFill} />
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
  groundBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
