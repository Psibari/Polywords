// app/components/GraphicGround.tsx
import React, { useEffect } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import GroundTorch from './GroundTorch';
import { resetWallShake, wallShakeTransform } from './wallShake';

const stoneWallImage = require('../../assets/images/background/StoneWall.png');

// How far the shadow backdrop extends past the wall on every side, in points.
// It only has to beat the largest displacement wallShake.ts can produce on one
// axis (WALL_TREMBLE_AMP + WALL_KICK_AMP = 6.5), with a margin.
const WALL_EDGE_BLEED = 8;
// The wall's own darkest under-shelf shadow, sampled from StoneWall.png (the
// median of wall rows 1408-1424, where the lit shelf face falls away into
// shadow). Deliberately the wall's colour and not a new one: this is only ever
// seen for a frame or two at an edge the shake has momentarily uncovered, and
// it has to read as more wall, never as a border.
const WALL_SHADOW = '#0C0A17';

// Ground art: a photoreal stone wall texture filling the same box the old
// flat-graphic SVG (gradient + flagstone tiles + pillar stacks + corner
// vines) used to occupy, plus two torches. This wall is INTACT and shared by
// every screen — Home, Daily, the Polybook, Settings and every ordinary Hunt
// round. The boss gauntlet's three holes are never baked in here; the
// gauntlet owns them and shows them only while it is on screen (see
// bossGauntletLedge.ts's RECESS_OVERLAYS).
// The space between the torches is deliberately left empty — Polly's spot,
// not a decorated focal point (an earlier gold-seal design was rejected).
//
// The wall shakes during the boss gauntlet (wallShake.ts). Two rules govern
// that, and breaking either one breaks the gauntlet:
//
//   1. The wall is NEVER scaled, inset or re-fitted to hide the shake's edges.
//      Every brick's flight is aligned to the ledge line, and that line's
//      on-screen position is derived purely from the wall being drawn at
//      exactly full screen width, bottom-anchored (bossGauntletLedge.ts). Any
//      scale or inset moves the ledge and desyncs all three bricks from it.
//      Edge bleed is handled by the shadow backdrop below instead.
//   2. The torches move WITH the wall. They are mounted on it, not floating in
//      front of it, so they share one transform.
//
// At rest both shake values are 0 and the transform is the identity, so the
// resting layout here is exactly what it was before the shake existed.
export default function GraphicGround() {
  // These values are module-level and outlive this component. An animation
  // interrupted by navigation would otherwise strand a non-zero offset and
  // leave the wall sitting crooked on the next screen.
  useEffect(() => resetWallShake, []);

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.shakeLayer, { transform: wallShakeTransform() }]}>
        {/* Behind the wall, extended past it on all four sides, so a frame in
            which the shake uncovers an edge shows wall shadow rather than the
            sky gradient behind the ground band. The band itself does not clip
            (AmbientSkyBackground's groundBand), and that component's root
            does, so this never escapes the screen. */}
        <View style={styles.edgeBleed} />

        <Image source={stoneWallImage} style={styles.wall} resizeMode="cover" />

        {/* torches sit above the wall art, positioned to match the old pillar
            stacks. Fixed points from the bottom (reverse-derived from the old
            top: 30%/28% at the old, much shorter band height) instead of a
            percentage, so they stay put regardless of the band's rendered
            height on any screen or device. */}
        <View style={{ position: 'absolute', left: '4%', bottom: 300 }}>
          <GroundTorch size={56} delayMs={0} />
        </View>
        <View style={{ position: 'absolute', right: '4%', bottom: 300 }}>
          <GroundTorch size={56} delayMs={400} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
  },
  // Pinned to all four edges of root, so it is exactly the box the wall and
  // torches used to lay out against — the resting geometry is unchanged.
  shakeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  edgeBleed: {
    position: 'absolute',
    top: -WALL_EDGE_BLEED,
    left: -WALL_EDGE_BLEED,
    right: -WALL_EDGE_BLEED,
    bottom: -WALL_EDGE_BLEED,
    backgroundColor: WALL_SHADOW,
  },
  wall: {
    width: '100%',
    height: '100%',
  },
});
