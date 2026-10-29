// app/components/GraphicGround.tsx
import React, { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import {
  resetWallFall,
  resetWallShake,
  resetWallStrain,
  runWallFallAnimation,
  WALL_FALL_PIT_SCALE,
  WALL_KICK_AMP,
  WALL_STRAIN_MAX_AMP,
  WALL_TREMBLE_AMP,
  subscribeWallFall,
  wallFallScale,
  wallFallShade,
  wallShakeTransform,
} from './wallShake';
import { resetWallVeinPulse } from './wallVeinPulse';

const stoneWallImage = require('../../assets/images/background/StoneWall2.png');
// How far the shadow backdrop extends past the wall on every side, in points.
// It has to beat the largest displacement wallShake.ts can produce on one axis
// when everything stacks (tremble + kick + momentum strain), with a margin.
const WALL_EDGE_BLEED =
  Math.ceil(WALL_TREMBLE_AMP + WALL_KICK_AMP + WALL_STRAIN_MAX_AMP) + 3;
// The wall's own darkest under-shelf shadow, sampled from StoneWall2.png (the
// median of wall rows 1408-1424, where the lit shelf face falls away into
// shadow). Deliberately the wall's colour and not a new one: this is only ever
// seen for a frame or two at an edge the shake has momentarily uncovered, and
// it has to read as more wall, never as a border.
const WALL_SHADOW = '#140922';
// Laid over the pit's copy of the wall. Dark enough that the pit reads as deep,
// light enough that the stone is still visible in it.
const PIT_DARK = 'rgba(10,5,20,0.72)';

// Ground art: a photoreal stone wall texture filling the same box the old
// flat-graphic SVG (gradient + flagstone tiles + pillar stacks + corner
// vines) used to occupy. This wall is INTACT and shared by
// every screen — Home, Daily, the Polybook, Settings and every ordinary Hunt
// round. The boss gauntlet's three holes are never baked in here; the
// gauntlet owns them and shows them only while it is on screen (see
// bossGauntletLedge.ts's RECESS_OVERLAYS).
// The middle of the wall is deliberately left empty — Polly's spot, not a
// decorated focal point (an earlier gold-seal design was rejected).
//
// The wall shakes during the boss gauntlet (wallShake.ts). One rule governs
// that, and breaking it breaks the gauntlet:
//
//   The wall is NEVER scaled, inset or re-fitted to hide the shake's edges.
//   Every brick's flight is aligned to the ledge line, and that line's
//   on-screen position is derived purely from the wall being drawn at
//   exactly full screen width, bottom-anchored (bossGauntletLedge.ts). Any
//   scale or inset moves the ledge and desyncs all three bricks from it.
//   Edge bleed is handled by the shadow backdrop below instead.
//
// At rest both shake values are 0 and the transform is the identity, so the
// resting layout here is exactly what it was before the shake existed.
//
// The wall carries NO glow layers right now. StoneWall2 has no gold veins, and
// a glow along its grout lines was tried on device (2026-10-28) and rejected
// by Pete ("looks like Tron"). The `wallVeins` prop and wallVeinPulse.ts stay
// so a replacement can be wired back in; nothing reads the prop today.
type GraphicGroundProps = {
  wallVeins?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GraphicGround(_props: GraphicGroundProps) {
  // True only while a fell-off fall is playing (wallShake.ts). The real wall
  // below never changes; the fall is drawn as an overlay that exists only then.
  const [falling, setFalling] = useState(false);
  useEffect(() => subscribeWallFall(setFalling), []);
  // Runs after the overlay has mounted, so the animated values already have a
  // view attached when the animation starts.
  useEffect(() => {
    if (falling) runWallFallAnimation();
  }, [falling]);

  // These values are module-level and outlive this component. An animation
  // interrupted by navigation would otherwise strand a non-zero offset and
  // leave the wall sitting crooked, or its veins lit, on the next screen.
  useEffect(
    () => () => {
      resetWallShake();
      resetWallStrain();
      resetWallFall();
      resetWallVeinPulse();
    },
    [],
  );

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

        {falling && (
          // The fall (fell-off, wallShake.ts), drawn over the real wall only
          // while it plays. The pit is the same stone, bigger and darkened; the
          // wall copy in front shrinks and darkens. At scale 1 the copy covers
          // the real wall exactly, so this appears and goes without a seam.
          <View style={styles.fallOverlay} pointerEvents="none">
            <View style={styles.pitClip}>
              <Image
                source={stoneWallImage}
                style={[styles.wall, { transform: [{ scale: WALL_FALL_PIT_SCALE }] }]}
                resizeMode="cover"
              />
              <View style={styles.pitDark} />
            </View>
            <Animated.View style={[styles.fallLayer, { transform: [{ scale: wallFallScale }] }]}>
              <Image source={stoneWallImage} style={styles.wall} resizeMode="cover" />
              <Animated.View style={[styles.fallShade, { opacity: wallFallShade }]} />
            </Animated.View>
          </View>
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
  },
  // Pinned to all four edges of root, so it is exactly the box the wall used
  // to lay out against — the resting geometry is unchanged.
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
  fallOverlay: {
    ...StyleSheet.absoluteFill,
  },
  pitClip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  pitDark: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PIT_DARK,
  },
  fallLayer: {
    ...StyleSheet.absoluteFill,
  },
  fallShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: WALL_SHADOW,
  },
});
