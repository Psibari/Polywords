// app/components/GraphicGround.tsx
import React, { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  resetWallFall,
  resetWallShake,
  resetWallStrain,
  runWallFallAnimation,
  WALL_KICK_AMP,
  WALL_STRAIN_MAX_AMP,
  WALL_TREMBLE_AMP,
  subscribeWallFall,
  wallFallPitScale,
  wallFallRim,
  wallFallScale,
  wallFallShade,
  wallFallStreakAOp,
  wallFallStreakAY,
  wallFallStreakBOp,
  wallFallStreakBY,
  WALL_FALL_STREAK_TRAVEL,
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
// Laid over the pit's copy of the wall (the hole's stone sides). Light enough
// that the stone stays visible; the edge bands below add the depth.
const PIT_DARK = 'rgba(10,5,20,0.5)';
// The hole's sides: lit at the screen edge, falling into darkness toward the
// bottom of the hole (the falling wall). TEST VALUES, tuned on device.
const PIT_BAND_CLEAR = 'rgba(10,5,20,0)';
const PIT_BAND_DARK = 'rgba(10,5,20,0.92)';
const PIT_BAND_REACH = '28%';
// The falling wall's own lip: dark at its edge, fading inward.
const RIM_DARK = 'rgba(10,5,20,0.85)';
const RIM_REACH = '7%';
// Hole look, a mix of three (Pete, 2026-11-02): stone RINGS stepping down the
// shaft, a dim warm GLOW at the bottom where the wall lands, and pale HAZE
// along the sides (now dark, see HAZE_EDGE). TEST VALUES, tuned on device.
// Rings are insets (percent of the screen) in the pit's own coordinates; the
// pit is drawn at 1.4x, so anything under ~15% is off-screen at rest.
const PIT_RING_INSETS = [16, 22, 29, 37] as const;
const PIT_RING_DARK = ['rgba(10,5,20,0.35)', 'rgba(10,5,20,0.45)', 'rgba(10,5,20,0.55)', 'rgba(10,5,20,0.65)'] as const;
const PIT_RING_LIT = 'rgba(205,195,225,0.22)';
const PIT_RING_WIDTH = 3;
const GLOW_COLOR = '#FFCF86';
const GLOW_PEAK_OPACITY = 0.38;
// Dark, not pale (Pete, 2026-11-02): a pale haze made the falling wall's outline
// stand out against the sides. TEST VALUES, tuned on device.
const HAZE_EDGE = 'rgba(10,5,20,0.5)';
const HAZE_CLEAR = 'rgba(10,5,20,0)';
const HAZE_REACH = '24%';
const HAZE_OUT_TO_IN = [HAZE_EDGE, HAZE_CLEAR] as const;
const HAZE_IN_TO_OUT = [HAZE_CLEAR, HAZE_EDGE] as const;
// Air streaks: thin pale lines, fixed pattern (no randomness, so every fall
// looks the same). Positions are percent of the layer, which is two screen
// heights tall so it can travel one screen height and stay covered.
type StreakSpec = {
  left: `${number}%`;
  top: `${number}%`;
  height: number;
  width: number;
  colors: readonly [string, string, string];
};
function buildStreaks(shift: number): StreakSpec[] {
  return Array.from({ length: 24 }, (_, i) => {
    const alpha = 0.22 + (i % 4) * 0.09;
    const tint = `rgba(225,220,240,${alpha.toFixed(2)})`;
    return {
      left: `${(i * 37 + 11 + shift) % 96}%`,
      top: `${(i * 61 + 7 + shift) % 100}%`,
      height: 70 + ((i * 29) % 7) * 20,
      width: i % 3 === 0 ? 2.5 : 1.5,
      colors: ['rgba(225,220,240,0)', tint, 'rgba(225,220,240,0)'] as const,
    };
  });
}
const STREAKS_A = buildStreaks(0);
const STREAKS_B = buildStreaks(23);

// Gradient colour pairs, outer edge first. Tuples because LinearGradient wants
// at least two stops.
const PIT_OUT_TO_IN = [PIT_BAND_CLEAR, PIT_BAND_DARK] as const;
const PIT_IN_TO_OUT = [PIT_BAND_DARK, PIT_BAND_CLEAR] as const;
const RIM_EDGE_TO_IN = [RIM_DARK, PIT_BAND_CLEAR] as const;
const RIM_IN_TO_EDGE = [PIT_BAND_CLEAR, RIM_DARK] as const;

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

function StreakLayer({
  y,
  op,
  streaks,
}: {
  y: Animated.Value;
  op: Animated.Value;
  streaks: StreakSpec[];
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.streakLayer, { opacity: op, transform: [{ translateY: y }] }]}
    >
      {streaks.map((st, i) => (
        <LinearGradient
          key={i}
          colors={st.colors}
          style={{
            position: 'absolute',
            left: st.left,
            top: st.top,
            width: st.width,
            height: st.height,
          }}
        />
      ))}
    </Animated.View>
  );
}

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
              <Animated.View
                style={[StyleSheet.absoluteFill, { transform: [{ scale: wallFallPitScale }] }]}
              >
                <Image source={stoneWallImage} style={styles.wall} resizeMode="cover" />
              </Animated.View>
              <View style={styles.pitDark} />
              <LinearGradient colors={PIT_OUT_TO_IN} style={styles.pitTop} />
              <LinearGradient colors={PIT_IN_TO_OUT} style={styles.pitBottom} />
              <LinearGradient
                colors={PIT_OUT_TO_IN}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pitLeft}
              />
              <LinearGradient
                colors={PIT_IN_TO_OUT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pitRight}
              />
              {/* A: stone rings stepping down the shaft. They scale with the
                  pit, so they rush outward on the dive. */}
              <Animated.View
                style={[StyleSheet.absoluteFill, { transform: [{ scale: wallFallPitScale }] }]}
              >
                {PIT_RING_INSETS.map((inset, i) => (
                  <View
                    key={inset}
                    style={{
                      position: 'absolute',
                      top: `${inset}%`,
                      bottom: `${inset}%`,
                      left: `${inset}%`,
                      right: `${inset}%`,
                      borderWidth: PIT_RING_WIDTH,
                      borderColor: PIT_RING_DARK[i],
                      borderTopColor: PIT_RING_LIT,
                    }}
                  />
                ))}
              </Animated.View>
              {/* C: pale haze along the sides of the shaft. */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: wallFallRim }]}>
                <LinearGradient
                  colors={HAZE_OUT_TO_IN}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.hazeLeft}
                />
                <LinearGradient
                  colors={HAZE_IN_TO_OUT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.hazeRight}
                />
              </Animated.View>
              {/* B: a dim warm glow at the bottom, around the landing wall. */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: wallFallRim }]}>
                <Svg width="100%" height="100%">
                  <Defs>
                    <RadialGradient id="wallFallGlow" cx="50%" cy="50%" rx="55%" ry="55%">
                      <Stop offset="0" stopColor={GLOW_COLOR} stopOpacity={GLOW_PEAK_OPACITY} />
                      <Stop offset="0.55" stopColor={GLOW_COLOR} stopOpacity={GLOW_PEAK_OPACITY * 0.5} />
                      <Stop offset="1" stopColor={GLOW_COLOR} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#wallFallGlow)" />
                </Svg>
              </Animated.View>
              {/* Air streaks rushing up past us: A on the wall's drop, B on the
                  camera's dive. */}
              <StreakLayer y={wallFallStreakAY} op={wallFallStreakAOp} streaks={STREAKS_A} />
              <StreakLayer y={wallFallStreakBY} op={wallFallStreakBOp} streaks={STREAKS_B} />
            </View>
            <Animated.View style={[styles.fallLayer, { transform: [{ scale: wallFallScale }] }]}>
              <Image source={stoneWallImage} style={styles.wall} resizeMode="cover" />
              <Animated.View style={[styles.fallShade, { opacity: wallFallShade }]} />
              <Animated.View style={[styles.fallRim, { opacity: wallFallRim }]}>
                <LinearGradient colors={RIM_EDGE_TO_IN} style={styles.rimTop} />
                <LinearGradient colors={RIM_IN_TO_EDGE} style={styles.rimBottom} />
                <LinearGradient
                  colors={RIM_EDGE_TO_IN}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.rimLeft}
                />
                <LinearGradient
                  colors={RIM_IN_TO_EDGE}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.rimRight}
                />
              </Animated.View>
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
  pitTop: { position: 'absolute', top: 0, left: 0, right: 0, height: PIT_BAND_REACH },
  pitBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: PIT_BAND_REACH },
  pitLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, width: PIT_BAND_REACH },
  pitRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: PIT_BAND_REACH },
  hazeLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, width: HAZE_REACH },
  hazeRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: HAZE_REACH },
  streakLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: WALL_FALL_STREAK_TRAVEL * 2,
  },
  fallLayer: {
    ...StyleSheet.absoluteFill,
  },
  fallRim: {
    ...StyleSheet.absoluteFill,
  },
  rimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: RIM_REACH },
  rimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: RIM_REACH },
  rimLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, width: RIM_REACH },
  rimRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: RIM_REACH },
  fallShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: WALL_SHADOW,
  },
});
