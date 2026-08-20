// app/components/GraphicGround.tsx
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import GroundTorch from './GroundTorch';

const stoneWallImage = require('../../assets/images/background/StoneWall.png');

// Ground art: a photoreal stone wall texture filling the same box the old
// flat-graphic SVG (gradient + flagstone tiles + pillar stacks + corner
// vines) used to occupy, plus two torches. The space between the torches is
// deliberately left empty — Polly's spot, not a decorated focal point (an
// earlier gold-seal design was rejected).
export default function GraphicGround() {
  return (
    <View style={styles.root} pointerEvents="none">
      <Image source={stoneWallImage} style={styles.wall} resizeMode="cover" />

      {/* torches sit above the wall art, positioned to match the old pillar stacks */}
      <View style={{ position: 'absolute', left: '4%', top: '30%' }}>
        <GroundTorch size={56} delayMs={0} />
      </View>
      <View style={{ position: 'absolute', right: '4%', top: '28%' }}>
        <GroundTorch size={56} delayMs={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
  },
  wall: {
    width: '100%',
    height: '100%',
  },
});
