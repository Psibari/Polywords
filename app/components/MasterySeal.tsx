import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

export type MasterySealVariant = 'master' | 'banished';

type Props = {
  x: number;
  y: number;
  variant: MasterySealVariant;
  label: string;
  onReveal?: () => void;
};

const PALETTE: Record<MasterySealVariant, {
  blob: string; blobDeep: string; rim: string; text: string;
  stampFill: string; stampRim: string;
}> = {
  master:   { blob: '#EF9F27', blobDeep: '#854F0B', rim: '#F5C842', text: '#4A1B0C', stampFill: '#26215C', stampRim: '#F5C842' },
  banished: { blob: '#9B2D6B', blobDeep: '#5A1A3E', rim: '#F5C842', text: '#F5E8F0', stampFill: '#26215C', stampRim: '#9B2D6B' },
};

const BLOB_PATH = 'M50,8 C68,6 90,20 92,42 C94,62 82,82 60,90 C40,96 16,86 8,64 C1,44 10,20 30,10 C36,7 44,8 50,8 Z';
const BLOB_SIZE = 92;
const STAMP_SIZE = 108;

export default function MasterySeal({ x, y, variant, label, onReveal }: Props) {
  const pal = PALETTE[variant];

  const blobOpacity = useRef(new Animated.Value(0)).current;
  const blobScale   = useRef(new Animated.Value(0)).current;
  const blobSquashX = useRef(new Animated.Value(1)).current;
  const blobSquashY = useRef(new Animated.Value(1)).current;

  const stampOpacity = useRef(new Animated.Value(0)).current;
  const stampY        = useRef(new Animated.Value(-64)).current;

  const labelOpacity = useRef(new Animated.Value(0)).current;
  const sweepX        = useRef(new Animated.Value(-60)).current;
  const sweepOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(blobOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(blobScale,   { toValue: 1, damping: 7, stiffness: 180, useNativeDriver: true }),
    ]).start();

    const pressTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.parallel([
        Animated.spring(stampY,       { toValue: 0, damping: 6, stiffness: 260, useNativeDriver: true }),
        Animated.timing(stampOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(blobSquashX,  { toValue: 1.14, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(blobSquashY,  { toValue: 0.84, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 260);

    const revealTimer = setTimeout(() => {
      onReveal?.();
      Animated.parallel([
        Animated.timing(stampY,       { toValue: -70, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(stampOpacity, { toValue: 0,   duration: 220, useNativeDriver: true }),
        Animated.spring(blobSquashX,  { toValue: 1, damping: 8, stiffness: 200, useNativeDriver: true }),
        Animated.spring(blobSquashY,  { toValue: 1, damping: 8, stiffness: 200, useNativeDriver: true }),
        Animated.timing(labelOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();

      sweepX.setValue(-60);
      sweepOpacity.setValue(0.55);
      Animated.parallel([
        Animated.timing(sweepX,       { toValue: 60, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweepOpacity, { toValue: 0,  duration: 260, useNativeDriver: true }),
      ]).start();
    }, 560);

    return () => {
      clearTimeout(pressTimer);
      clearTimeout(revealTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View
        style={{
          position: 'absolute',
          left: x - BLOB_SIZE / 2,
          top: y - BLOB_SIZE / 2,
          width: BLOB_SIZE,
          height: BLOB_SIZE,
          opacity: blobOpacity,
          transform: [{ scale: blobScale }, { scaleX: blobSquashX }, { scaleY: blobSquashY }],
        }}
      >
        <Svg width={BLOB_SIZE} height={BLOB_SIZE} viewBox="0 0 100 100">
          <Path d={BLOB_PATH} fill={pal.blob} stroke={pal.blobDeep} strokeWidth={2} />
          <Ellipse cx={36} cy={30} rx={13} ry={8} fill="#FFFFFF" opacity={0.22} />
        </Svg>
        <Animated.Text
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            textAlign: 'center',
            textAlignVertical: 'center',
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1,
            color: pal.text,
            opacity: labelOpacity,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {label}
        </Animated.Text>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 18,
            left: BLOB_SIZE / 2 - 9,
            opacity: sweepOpacity,
            backgroundColor: '#FFFFFF',
            transform: [{ translateX: sweepX }, { rotate: '18deg' }],
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          left: x - STAMP_SIZE / 2,
          top: y - STAMP_SIZE / 2,
          width: STAMP_SIZE,
          height: STAMP_SIZE,
          opacity: stampOpacity,
          transform: [{ translateY: stampY }],
        }}
      >
        <Svg width={STAMP_SIZE} height={STAMP_SIZE} viewBox="0 0 108 108">
          <Circle cx={54} cy={54} r={52} fill={pal.stampFill} stroke={pal.stampRim} strokeWidth={3} />
          <Circle cx={54} cy={54} r={40} fill="none" stroke={pal.stampRim} strokeWidth={1} opacity={0.5} />
        </Svg>
      </Animated.View>
    </View>
  );
}
