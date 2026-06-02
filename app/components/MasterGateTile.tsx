import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONTS } from '../constants/fonts';

type Phase = 'locked' | 'unlocking' | 'unlocked';

interface Props {
  perfectClear: boolean;
  onMasteredSwipe: () => void;
  tileHeight?: number;
}

function LockShape() {
  return (
    <View style={styles.lockWrapper}>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody} />
    </View>
  );
}

export function MasterGateTile({ perfectClear, onMasteredSwipe, tileHeight = 68 }: Props) {
  const phaseRef     = useRef<Phase>('locked');
  const judgedRef    = useRef(false);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Native-driver: opacity + transforms
  const pulseOpacity = useRef(new Animated.Value(0.30)).current;
  const lockScale    = useRef(new Animated.Value(1)).current;
  const lockRotate   = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0.35)).current;

  // Non-native: border color sweep
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  // Locked = 0 → gold, sweeps green→orange→gold, settles at 1 = gold
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange:  [0,         0.33,      0.66,      1],
    outputRange: ['#F5C842', '#4CAF50', '#FF8C00', '#F5C842'],
  });

  const lockRotateDeg = lockRotate.interpolate({
    inputRange:  [-20, 0, 20],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  useEffect(() => {
    if (!perfectClear || phaseRef.current !== 'locked') return;
    phaseRef.current = 'unlocking';

    // Phase 1 — T+0ms: lock icon bounce + rotate
    Animated.parallel([
      Animated.sequence([
        Animated.spring(lockScale,  { toValue: 1.4, damping: 8, stiffness: 300, useNativeDriver: true }),
        Animated.spring(lockScale,  { toValue: 1.0, damping: 8, stiffness: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(lockRotate, { toValue: -20, duration: 150, useNativeDriver: true }),
        Animated.timing(lockRotate, { toValue:   0, duration: 150, useNativeDriver: true }),
      ]),
    ]).start();

    // Phase 2 — T+200ms: text + overall tile opacity rise (native)
    setTimeout(() => {
      Animated.timing(textOpacity,  { toValue: 1.0, duration: 500, useNativeDriver: true }).start();
      Animated.timing(pulseOpacity, { toValue: 1.0, duration: 500, useNativeDriver: true }).start();
    }, 200);

    // Phase 3 — T+400ms: border color sweep (non-native)
    setTimeout(() => {
      borderColorAnim.setValue(0);
      Animated.timing(borderColorAnim, { toValue: 1, duration: 800, useNativeDriver: false }).start();
    }, 400);

    // Phase 4 — T+600ms: heavy haptic
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 600);

    // Phase 5 — T+800ms: mark unlocked, start pulse loop
    setTimeout(() => {
      phaseRef.current = 'unlocked';
      pulseLoopRef.current?.stop();
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ]));
      pulseLoopRef.current = loop;
      loop.start();
    }, 800);

    return () => { pulseLoopRef.current?.stop(); };
  }, [perfectClear]); // eslint-disable-line react-hooks/exhaustive-deps

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        phaseRef.current === 'unlocked' && !judgedRef.current,
      onStartShouldSetPanResponderCapture: () =>
        phaseRef.current === 'unlocked' && !judgedRef.current,
      onMoveShouldSetPanResponder: (_, gs) =>
        phaseRef.current === 'unlocked' && !judgedRef.current &&
        (Math.abs(gs.dy) > 6 || Math.abs(gs.dx) > 6),
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        phaseRef.current === 'unlocked' && !judgedRef.current &&
        (Math.abs(gs.dy) > 4 || Math.abs(gs.dx) > 4),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gs) => {
        if (phaseRef.current !== 'unlocked' || judgedRef.current) return;
        if (gs.dy < -30 && Math.abs(gs.dy) > Math.abs(gs.dx)) {
          judgedRef.current = true;
          pulseLoopRef.current?.stop();
          onMasteredSwipe();
        }
      },
    })
  ).current;

  return (
    // Outer: pulse opacity — native driver
    <Animated.View
      style={{ opacity: pulseOpacity }}
      {...panResponder.panHandlers}
    >
      {/* Inner: border color sweep — non-native driver */}
      <Animated.View
        style={[styles.tile, { height: tileHeight, borderColor: animatedBorderColor as any }]}
      >
        <View style={styles.content}>
          {/* Lock icon — native transforms */}
          <Animated.View
            style={{ transform: [{ scale: lockScale }, { rotate: lockRotateDeg }] }}
          >
            <LockShape />
          </Animated.View>

          {/* Label — native opacity */}
          <Animated.Text style={[styles.label, { opacity: textOpacity }]}>
            MASTER THE WORD
          </Animated.Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    marginTop: 8,
    backgroundColor: '#0F0D2A',
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockWrapper: {
    width: 14,
    height: 17,
    alignItems: 'center',
    marginRight: 10,
  },
  lockShackle: {
    width: 8,
    height: 7,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 2,
    borderColor: '#F5C842',
    borderBottomWidth: 0,
    marginBottom: -1,
  },
  lockBody: {
    width: 14,
    height: 10,
    backgroundColor: '#F5C842',
    borderRadius: 2,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.label,
    color: '#F5C842',
    letterSpacing: 2,
  },
});
