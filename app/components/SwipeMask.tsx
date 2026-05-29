import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mask } from '../game/types';
import { FluentEmoji } from './FluentEmoji';
import { playCorrectTap, playWrongBuzz, playShatter } from '../utils/SoundEngine';

export type SwipeMaskState = 'idle' | 'correct' | 'trap-caught' | 'wrong' | 'hidden' | 'revealed';

const SWIPE_THRESHOLD = 40;
const TILE_GAP        = 10;

type Props = {
  mask: Mask;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onTapReveal: () => void;
  state: SwipeMaskState;
  revealable?: boolean;
  tileHeight?: number;
  isSpecialSplit?: boolean;
  entryDelay?: number;
  eraBadge?: string;
};

const FRAGMENT_OFFSETS = [
  { dx: -80,  dy: -60 },
  { dx:  80,  dy: -60 },
  { dx: -100, dy:   0 },
  { dx:  100, dy:   0 },
  { dx: -60,  dy:  60 },
  { dx:  60,  dy:  60 },
] as const;

export function SwipeMask({
  mask,
  onSwipeUp,
  onSwipeDown,
  onTapReveal,
  state: s,
  revealable = false,
  tileHeight = 64,
  isSpecialSplit = false,
  entryDelay = 0,
  eraBadge,
}: Props) {
  const [bgColor, setBgColor] = useState(isSpecialSplit ? '#251F4A' : '#2A2560');
  const [showShatter, setShowShatter] = useState(false);

  const outerHeightAnim    = useRef(new Animated.Value(tileHeight)).current;
  const outerMarginTopAnim = useRef(new Animated.Value(TILE_GAP)).current;

  const panXY       = useRef(new Animated.ValueXY()).current;
  const tileOpacity = useRef(new Animated.Value(1)).current;

  const tileLayoutRef = useRef({ width: 300, height: tileHeight });

  const fragmentAnims = useRef(
    Array.from({ length: 6 }, () => ({
      x:       new Animated.Value(0),
      y:       new Animated.Value(0),
      rotate:  new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const eraBadgeTransY  = useRef(new Animated.Value(20)).current;
  const eraBadgeOpacity = useRef(new Animated.Value(0)).current;

  const judgedRef      = useRef(false);
  const swipeDirRef    = useRef<'up' | 'right' | null>(null);
  const onSwipeUpRef   = useRef(onSwipeUp);
  const onSwipeDownRef = useRef(onSwipeDown);

  useEffect(() => { onSwipeUpRef.current = onSwipeUp; }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current = onSwipeDown; }, [onSwipeDown]);

  // ── Entry animation ───────────────────────────────────────────
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryTransY  = useRef(new Animated.Value(30)).current;
  const entryScaleY  = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const id = setTimeout(() => {
      Animated.parallel([
        Animated.spring(entryTransY,  { toValue: 0, tension: 180, friction: 12, useNativeDriver: true }),
        Animated.spring(entryScaleY,  { toValue: 1, tension: 180, friction: 12, useNativeDriver: true }),
        Animated.timing(entryOpacity, { toValue: 1, duration: 220,              useNativeDriver: true }),
      ]).start();
    }, entryDelay);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!judgedRef.current) {
      outerHeightAnim.setValue(tileHeight);
    }
  }, [tileHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── State-driven animations ───────────────────────────────────
  useEffect(() => {

    if (s === 'correct') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playCorrectTap();
      setBgColor('#FFD700');
      Animated.spring(panXY, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        speed: 20,
        bounciness: 6,
      }).start();
      if (eraBadge) {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(eraBadgeTransY,  { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(eraBadgeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          ]).start();
        }, 200);
      }
    }

    if (s === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playWrongBuzz();
      setBgColor('#CC2200');
      Animated.sequence([
        Animated.timing(panXY, { toValue: { x: 0, y: 0 }, duration: 80, useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(panXY, { toValue: { x:  14, y: 0 }, duration: 50, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x: -14, y: 0 }, duration: 55, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x:   9, y: 0 }, duration: 55, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x:  -9, y: 0 }, duration: 55, useNativeDriver: false }),
          Animated.timing(panXY, { toValue: { x:   0, y: 0 }, duration: 55, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(panXY, {
            toValue: swipeDirRef.current === 'right'
              ? { x: 600, y: 0 }
              : { x: 0, y: -800 },
            duration: 250,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(tileOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
      ]).start();
    }

    if (s === 'trap-caught') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playShatter();
      tileOpacity.setValue(0);
      panXY.setValue({ x: 0, y: 0 });

      fragmentAnims.forEach(anim => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });

      setShowShatter(true);

      const fragmentParallels = fragmentAnims.map((anim, i) => {
        const { dx, dy } = FRAGMENT_OFFSETS[i];
        const rot = Math.random() * 60 - 30;
        return Animated.parallel([
          Animated.timing(anim.x,       { toValue: dx,  duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.y,       { toValue: dy,  duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.rotate,  { toValue: rot, duration: 350, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 0,   duration: 350, useNativeDriver: true }),
        ]);
      });

      Animated.parallel(fragmentParallels).start();

      setTimeout(() => {
        setShowShatter(false);
        Animated.parallel([
          Animated.timing(outerHeightAnim,    { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(outerMarginTopAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
      }, 350);
    }

    if (s === 'revealed') {
      judgedRef.current   = false;
      swipeDirRef.current = null;
      panXY.setValue({ x: 0, y: 0 });
      tileOpacity.setValue(1);
      outerHeightAnim.setValue(tileHeight);
      outerMarginTopAnim.setValue(TILE_GAP);
      setBgColor('#2A2560');
      setShowShatter(false);
    }

  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PanResponder ──────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !judgedRef.current,
      onStartShouldSetPanResponderCapture: () => !judgedRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 4 || Math.abs(g.dx) > 4),
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, g) => {
        if (judgedRef.current) return;
        panXY.setValue({ x: g.dx, y: g.dy });
      },

      onPanResponderRelease: (_, g) => {
        if (judgedRef.current) return;

        if (g.dy < -SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'up';
          onSwipeUpRef.current();

        } else if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          judgedRef.current   = true;
          swipeDirRef.current = 'right';
          onSwipeDownRef.current();

        } else {
          Animated.spring(panXY, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            speed: 22,
            bounciness: 8,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          Animated.spring(panXY, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            speed: 22,
            bounciness: 8,
          }).start();
        }
      },
    }),
  ).current;

  // ── Hidden state ──────────────────────────────────────────────
  if (s === 'hidden') {
    return (
      <Animated.View
        style={{
          overflow: 'visible',
          opacity: entryOpacity,
          transform: [{ translateY: entryTransY }, { scaleY: entryScaleY }],
        }}
      >
        <Animated.View style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim }}>
          <Pressable
            onPress={revealable ? onTapReveal : undefined}
            style={[styles.tile, { height: tileHeight, backgroundColor: '#2A2060' }]}
          >
            <FluentEmoji emoji="❓" size={32} />
            <Text style={[styles.phrase, { color: '#FFD700' }]} numberOfLines={2}>
              Hidden meaning
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  }

  // ── Normal tile ───────────────────────────────────────────────
  const textColor = s === 'correct' ? '#1A1040' : '#FFFFFF';

  const fragW   = tileLayoutRef.current.width * 0.4;
  const fragH   = tileHeight * 0.45;
  const centerX = tileLayoutRef.current.width / 2 - fragW / 2;
  const centerY = tileHeight / 2 - fragH / 2;

  return (
    <Animated.View
      style={{
        overflow: 'visible',
        opacity: entryOpacity,
        transform: [{ translateY: entryTransY }, { scaleY: entryScaleY }],
      }}
    >
    <Animated.View
      style={{ height: outerHeightAnim, marginTop: outerMarginTopAnim, overflow: 'visible' }}
    >
      <Animated.View
        style={[
          styles.tile,
          {
            height: tileHeight,
            backgroundColor: bgColor,
            opacity: tileOpacity,
            transform: [{ translateX: panXY.x }, { translateY: panXY.y }],
            ...(isSpecialSplit ? { borderColor: '#FFD700' } : {}),
          },
        ]}
        onLayout={(e: LayoutChangeEvent) => {
          tileLayoutRef.current = {
            width:  e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.emojiSlot}>
          <FluentEmoji emoji={mask.emoji} size={32} />
        </View>
        <Text style={[styles.phrase, { color: textColor }]} numberOfLines={2}>
          {mask.phrase}
        </Text>
        {isSpecialSplit && (
          <Text style={styles.specialBadge}>✨</Text>
        )}
        {eraBadge && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.eraBadgeWrap,
              { opacity: eraBadgeOpacity, transform: [{ translateY: eraBadgeTransY }] },
            ]}
          >
            <Text style={styles.eraBadgeText}>{eraBadge}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {showShatter && FRAGMENT_OFFSETS.map((_, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            zIndex: 999,
            left: centerX,
            top:  centerY,
            width: fragW,
            height: fragH,
            borderRadius: 8,
            backgroundColor: '#CC2200',
            opacity: fragmentAnims[i].opacity,
            transform: [
              { translateX: fragmentAnims[i].x },
              { translateY: fragmentAnims[i].y },
              {
                rotate: fragmentAnims[i].rotate.interpolate({
                  inputRange:  [-30, 0, 30],
                  outputRange: ['-30deg', '0deg', '30deg'],
                }),
              },
            ],
          }}
        />
      ))}
    </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    borderWidth: 2,
    borderColor: '#1A1830',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 8,
  },
  emojiSlot: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phrase: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    flex: 1,
  },
  specialBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 10,
  },
  eraBadgeWrap: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  eraBadgeText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
});
