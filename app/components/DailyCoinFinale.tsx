import React, { useMemo } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PW } from '../ui/pwTheme';
import type { DailyCastleFrame } from '../ui/dailyCastleScene';
import {
  DAILY_COIN_COLORS,
  DAILY_COIN_FACE,
  dailyCoinFinaleKeyframes,
  resolveDailyCoinFinaleGeometry,
  type DailyCoinFinaleChannel,
  type DailyCoinFinaleMode,
} from '../ui/dailyCoinFinale';

// The feather the floor coin's emblem was built from (build_daily_coins.py).
const GOLD_FEATHER = require('../../assets/ui/feather-gold-reward.png');
// Soft radial gold (build_daily_coins.py): the hero's halo, and, tinted, the
// enamel's lit centre.
const GOLD_GLOW = require('../../assets/images/dailycastle/coin_glow.png');

type Props = {
  /** The finale's progress (ui/dailyCoinFinale.ts steps 0–5). */
  progress: Animated.Value;
  mode: DailyCoinFinaleMode;
  /** False under Reduce Motion or Reduce Flashes: no moving glint. */
  glint: boolean;
  frame: DailyCastleFrame | null;
  windowWidth: number;
  windowHeight: number;
  topInset: number;
};

/**
 * The win's hero coin: the floor's gold coin drawn face-on, flown off the
 * floor at the player (ui/dailyCoinFinale.ts). A foreground layer over the
 * whole screen, never touchable; invisible at rest (progress 0), so it stays
 * mounted and every native-driven transform stays bound to its value.
 *
 * Built from the coin's own recipe rather than coin_gold.png: that art is the
 * coin at the floor's angle with an upright feather, which cannot be turned
 * face-on without stretching the feather. Turned to the floor's angle (disc
 * squashed, feather scaled with it, edge showing below) this matches it.
 */
export default function DailyCoinFinale({
  progress,
  mode,
  glint,
  frame,
  windowWidth,
  windowHeight,
  topInset,
}: Props) {
  const geometry = frame
    ? resolveDailyCoinFinaleGeometry(frame, windowWidth, windowHeight, topInset)
    : null;
  const size = geometry?.size ?? 0;
  const startScale = geometry?.startScale ?? 1;
  const dx = geometry ? geometry.start.x - geometry.hero.x : 0;
  const dy = geometry ? geometry.start.y - geometry.hero.y : 0;

  const anim = useMemo(() => {
    const k = dailyCoinFinaleKeyframes(mode, startScale, glint);
    const read = (channel: DailyCoinFinaleChannel, map: (v: number) => number = (v) => v) =>
      progress.interpolate({
        inputRange: channel.input,
        outputRange: channel.output.map(map),
        extrapolate: 'clamp',
      });
    // Edge depth in points. A zero scale is a degenerate transform; keep a hair.
    const edgeDepth = (v: number) => Math.max(v * size, 0.01);
    return {
      veil: read(k.veil),
      hero: read(k.hero),
      glow: read(k.glow),
      translateX: read(k.travel, (t) => dx * (1 - t)),
      translateY: read(k.travel, (t) => dy * (1 - t)),
      scale: read(k.scale),
      tilt: read(k.tilt),
      edgeY: read(k.edge, (v) => v * size),
      bandY: read(k.edge, (v) => (v * size) / 2),
      bandScale: read(k.edge, edgeDepth),
      glintX: read(k.glintX, (v) => v * size * 1.1),
      glintOpacity: read(k.glintOpacity),
    };
  }, [progress, mode, glint, startScale, size, dx, dy]);

  if (!geometry) return null;

  const round = size / 2;
  const ring = DAILY_COIN_FACE.ring * size;
  const enamel = size - ring * 2;
  // The feather, face-on: FEATHER of the face's height, its alpha box centred.
  const art = DAILY_COIN_FACE.featherArt;
  const featherHeight = DAILY_COIN_FACE.feather * size;
  const featherImage = (featherHeight * art.size) / art.boxHeight;
  const featherLeft =
    round - featherImage / 2 + ((art.size - art.boxLeft - art.boxRight) / 2 / art.size) * featherImage;
  const featherTop = round - featherImage / 2 - DAILY_COIN_FACE.featherLift * featherHeight;
  const shadow = DAILY_COIN_FACE.featherShadow;
  const halo = size * 1.7;
  const glintWidth = size * 0.36;
  const glintHeight = size * 1.6;

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.layer}
    >
      <Animated.View style={[styles.veil, { opacity: anim.veil }]} />
      <Animated.View
        style={[
          styles.coin,
          {
            left: geometry.hero.x - round,
            top: geometry.hero.y - round,
            width: size,
            height: size,
            opacity: anim.hero,
            transform: [
              { translateX: anim.translateX },
              { translateY: anim.translateY },
              { scale: anim.scale },
            ],
          },
        ]}
      >
        <Animated.Image
          source={GOLD_GLOW}
          resizeMode="stretch"
          // Explicit size: a bundled image otherwise takes the file's pixel size.
          style={[styles.abs, {
            left: round - halo / 2,
            top: round - halo / 2,
            width: halo,
            height: halo,
            opacity: anim.glow,
          }]}
        />

        {/* The edge: the disc swept down by its depth at this tilt. */}
        <Animated.View
          style={[styles.abs, {
            left: 0,
            top: 0,
            width: size,
            height: size,
            transform: [{ translateY: anim.edgeY }, { scaleY: anim.tilt }],
          }]}
        >
          <LinearGradient
            colors={[DAILY_COIN_COLORS.edgeSide, DAILY_COIN_COLORS.edgeCentre, DAILY_COIN_COLORS.edgeSide]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: size, height: size, borderRadius: round }}
          />
        </Animated.View>
        <Animated.View
          style={[styles.abs, {
            left: 0,
            top: round - 0.5,
            width: size,
            height: 1,
            transform: [{ translateY: anim.bandY }, { scaleY: anim.bandScale }],
          }]}
        >
          <LinearGradient
            colors={[DAILY_COIN_COLORS.edgeSide, DAILY_COIN_COLORS.edgeCentre, DAILY_COIN_COLORS.edgeSide]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: size, height: 1 }}
          />
        </Animated.View>

        {/* The face: gold ring, midnight enamel, and the one glint. */}
        <Animated.View
          style={[styles.abs, {
            left: 0,
            top: 0,
            width: size,
            height: size,
            transform: [{ scaleY: anim.tilt }],
          }]}
        >
          <LinearGradient
            colors={[DAILY_COIN_COLORS.ringTop, DAILY_COIN_COLORS.ringBottom]}
            style={{ width: size, height: size, borderRadius: round }}
          />
          <View
            style={[styles.abs, styles.enamel, {
              left: ring,
              top: ring,
              width: enamel,
              height: enamel,
              borderRadius: enamel / 2,
            }]}
          >
            <Image
              source={GOLD_GLOW}
              resizeMode="stretch"
              tintColor={DAILY_COIN_COLORS.faceCentre}
              style={[styles.abs, {
                left: -enamel * 0.15,
                top: -enamel * 0.15,
                width: enamel * 1.3,
                height: enamel * 1.3,
              }]}
            />
          </View>
          <View style={[styles.abs, styles.clip, { left: 0, top: 0, width: size, height: size, borderRadius: round }]}>
            <Animated.View
              style={[styles.abs, {
                left: round - glintWidth / 2,
                top: round - glintHeight / 2,
                width: glintWidth,
                height: glintHeight,
                opacity: anim.glintOpacity,
                transform: [{ translateX: anim.glintX }, { rotate: '22deg' }],
              }]}
            >
              <LinearGradient
                colors={[DAILY_COIN_COLORS.glintClear, DAILY_COIN_COLORS.glint, DAILY_COIN_COLORS.glintClear]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: glintWidth, height: glintHeight }}
              />
            </Animated.View>
          </View>
        </Animated.View>

        {/* The feather stands upright on the face: it scales with the tilt
            instead of squashing, as on the floor art. */}
        <Animated.View
          style={[styles.abs, {
            left: 0,
            top: 0,
            width: size,
            height: size,
            transform: [{ scale: anim.tilt }],
          }]}
        >
          <Image
            source={GOLD_FEATHER}
            resizeMode="stretch"
            tintColor={DAILY_COIN_COLORS.shadow}
            style={[styles.abs, {
              left: featherLeft + shadow.x * size,
              top: featherTop + shadow.y * size,
              width: featherImage,
              height: featherImage,
              opacity: shadow.opacity,
            }]}
          />
          <Image
            source={GOLD_FEATHER}
            resizeMode="stretch"
            style={[styles.abs, {
              left: featherLeft,
              top: featherTop,
              width: featherImage,
              height: featherImage,
            }]}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    // Over the castle (1) and the SafeAreaView (2): HUD, Polly and her bubble
    // sit under the veil while the coin is the foreground.
    zIndex: 3,
  },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PW.color.bgDeep,
  },
  coin: {
    position: 'absolute',
  },
  abs: {
    position: 'absolute',
  },
  enamel: {
    overflow: 'hidden',
    backgroundColor: DAILY_COIN_COLORS.faceRim,
    borderWidth: 1,
    borderColor: 'rgba(5,4,12,0.5)',
  },
  clip: {
    overflow: 'hidden',
  },
});
