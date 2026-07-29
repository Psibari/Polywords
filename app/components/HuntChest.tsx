import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { playSfx, SfxName } from '../audio/sfx';

// Presentational chest — no game logic, no store access. Positions are
// tuned from app/components/dev/ChestTest.tsx; nudge there, not here.

const CONTAINER_W = 330;
const CONTAINER_H = 300;
const LID_CROSSFADE_MS = 200;
const LOCK_POP_MS = 90; // up-leg and down-leg each get this; ~180ms total

type Piece = { x: number; y: number; w: number };

// x/y are offsets in px from container center, w is render width;
// height is derived from each asset's real aspect ratio below.
const INTERIOR:   Piece = { x: 0,   y: 49,   w: 214 };
const BASE:       Piece = { x: -2,  y: 36,   w: 386 };
const LID_CLOSED: Piece = { x: -2,  y: -45,  w: 378 };
const LID_OPEN:   Piece = { x: -2,  y: -117, w: 378 };
const LOCK_1:      Piece = { x: -95, y: 87, w: 62 };
const LOCK_2:      Piece = { x: 0,   y: 89, w: 62 };
const LOCK_3:      Piece = { x: 95,  y: 89, w: 56 };

// Real pixel dimensions of the source PNGs (assets/images/chest/).
const ASPECT = {
  interior: 388 / 350,
  base: 439 / 276,
  lidClosed: 443 / 160,
  lidOpen: 448 / 167,
  lock1Locked: 207 / 195,
  lock1Open: 217 / 198,
  lock2Locked: 205 / 194,
  lock2Open: 215 / 197,
  lock3Locked: 193 / 195,
  lock3Open: 204 / 199,
};

function layerStyle(cfg: Piece, aspect: number) {
  const h = cfg.w / aspect;
  return {
    position: 'absolute' as const,
    left: CONTAINER_W / 2 + cfg.x - cfg.w / 2,
    top: CONTAINER_H / 2 + cfg.y - h / 2,
    width: cfg.w,
    height: h,
  };
}

const interiorStyle = layerStyle(INTERIOR, ASPECT.interior);
const baseStyle = layerStyle(BASE, ASPECT.base);
// The lid wrapper uses LID_CLOSED as its canonical box; an animated
// translateY carries it the rest of the way to LID_OPEN's seat (same
// x/w on both, so the delta is exact — only y needs to move).
const lidWrapperStyle = layerStyle(LID_CLOSED, ASPECT.lidClosed);
const LID_TRAVEL_Y = LID_OPEN.y - LID_CLOSED.y;

const LOCKS: {
  cfg: Piece;
  lockedAspect: number;
  openAspect: number;
  lockedSrc: number;
  openSrc: number;
  sfxName: SfxName;
}[] = [
  {
    cfg: LOCK_1,
    lockedAspect: ASPECT.lock1Locked,
    openAspect: ASPECT.lock1Open,
    lockedSrc: require('../../assets/images/chest/lock_1_locked.png'),
    openSrc: require('../../assets/images/chest/lock_1_open.png'),
    sfxName: 'lockSpin1',
  },
  {
    cfg: LOCK_2,
    lockedAspect: ASPECT.lock2Locked,
    openAspect: ASPECT.lock2Open,
    lockedSrc: require('../../assets/images/chest/lock_2_locked.png'),
    openSrc: require('../../assets/images/chest/lock_2_open.png'),
    sfxName: 'lockSpin2',
  },
  {
    cfg: LOCK_3,
    lockedAspect: ASPECT.lock3Locked,
    openAspect: ASPECT.lock3Open,
    lockedSrc: require('../../assets/images/chest/lock_3_locked.png'),
    openSrc: require('../../assets/images/chest/lock_3_open.png'),
    sfxName: 'lockSpin3',
  },
];

function ChestLock({
  isOpen,
  cfg,
  lockedAspect,
  openAspect,
  lockedSrc,
  openSrc,
  sfxName,
}: {
  isOpen: boolean;
  cfg: Piece;
  lockedAspect: number;
  openAspect: number;
  lockedSrc: number;
  openSrc: number;
  sfxName: SfxName;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const wasOpen = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      playSfx(sfxName, { rate: 2.0 });
      scale.setValue(1);
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.18,
          duration: LOCK_POP_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: LOCK_POP_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
    wasOpen.current = isOpen;
  }, [isOpen, scale, sfxName]);

  const box = layerStyle(cfg, isOpen ? openAspect : lockedAspect);

  return (
    <View style={box}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
        <Image source={isOpen ? openSrc : lockedSrc} style={StyleSheet.absoluteFill} contentFit="contain" />
      </Animated.View>
    </View>
  );
}

export type HuntChestProps = {
  open: boolean;
  locksOpen: 0 | 1 | 2 | 3;
  style?: StyleProp<ViewStyle>;
};

export function HuntChest({ open, locksOpen, style }: HuntChestProps) {
  const openAnim = useRef(new Animated.Value(open ? 1 : 0)).current;
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    Animated.timing(openAnim, {
      toValue: open ? 1 : 0,
      duration: LID_CROSSFADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, openAnim]);

  const lidTranslateY = openAnim.interpolate({ inputRange: [0, 1], outputRange: [0, LID_TRAVEL_Y] });
  const lidClosedOpacity = openAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const lidOpenOpacity = openAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={[styles.container, style]}>
      <Image source={require('../../assets/images/chest/chest_interior.png')} style={interiorStyle} contentFit="contain" />
      <Image source={require('../../assets/images/chest/chest_base.png')} style={baseStyle} contentFit="contain" />

      {LOCKS.map((lock, i) => (
        <ChestLock key={i} isOpen={locksOpen > i} {...lock} />
      ))}

      <Animated.View style={[lidWrapperStyle, { transform: [{ translateY: lidTranslateY }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: lidClosedOpacity }]}>
          <Image source={require('../../assets/images/chest/chest_lid_closed.png')} style={StyleSheet.absoluteFill} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: lidOpenOpacity }]}>
          <Image source={require('../../assets/images/chest/chest_lid_open.png')} style={StyleSheet.absoluteFill} contentFit="contain" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_W,
    height: CONTAINER_H,
  },
});
