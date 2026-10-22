import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TERRACE_SHOOTING_STAR,
  ShootingStar,
  terraceShootingStar,
  terraceStarDelay,
} from '../ui/homeTerraceSky';

// A shooting star now and then across the terrace sky (Pete, 2026-10-22). One at a time, a long random wait
// between them, only while Home is showing and nothing is diving. It is drawn behind the back mountains
// (the scene puts the ridge layer over it), so a low one slips behind the ridge. Timings: ui/homeTerraceSky.ts.

type Props = {
  /** Home is focused, motion is allowed and no dive is running. */
  active: boolean;
  width: number;
  /** Height of the open sky on screen, px. */
  skyHeight: number;
  /** Design-unit scale (screen width / 443). */
  k: number;
};

export function TerraceShootingStars({ active, width, skyHeight, k }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [star, setStar] = useState<ShootingStar | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let first = true;

    const schedule = () => {
      timer = setTimeout(fire, terraceStarDelay(first, Math.random));
      first = false;
    };
    const fire = () => {
      if (cancelled) return;
      const next = terraceShootingStar(width, skyHeight, Math.random);
      progress.setValue(0);
      setStar(next);
      Animated.timing(progress, {
        toValue: 1,
        duration: next.durationMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (!cancelled) setStar(null);
      });
      schedule();
    };
    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      progress.stopAnimation();
      setStar(null);
    };
  }, [active, width, skyHeight, progress]);

  if (!star) return null;
  const c = TERRACE_SHOOTING_STAR;
  const tail = c.tailLength * k;
  const thick = c.tailThickness * k;
  const head = c.headSize * k;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mover,
        {
          left: star.x - tail / 2,
          top: star.y - thick / 2,
          opacity: progress.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, star.dx] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, star.dy] }) },
          ],
        },
      ]}
    >
      {/* The tail, brightest at its right end; rotated so that end leads along the heading. */}
      <View style={{ width: tail, height: thick, transform: [{ rotate: `${star.heading}deg` }] }}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(235,240,255,0.55)', 'rgba(255,255,255,1)']}
          locations={[0, 0.7, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: tail, height: thick, borderRadius: thick / 2 }}
        />
        <View
          style={{
            position: 'absolute',
            right: -head / 2,
            top: (thick - head) / 2,
            width: head,
            height: head,
            borderRadius: head / 2,
            backgroundColor: '#FFFFFF',
          }}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mover: { position: 'absolute' },
});
