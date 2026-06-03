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

export function MasterGateTile({ perfectClear, onMasteredSwipe, tileHeight = 76 }: Props) {
  const phaseRef      = useRef<Phase>('locked');
  const judgedRef     = useRef(false);
  const pulseLoopRef  = useRef<Animated.CompositeAnimation | null>(null);
  const breathLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Native-driver: opacity + transforms
  const pulseOpacity = useRef(new Animated.Value(1.0)).current;
  const lockScale    = useRef(new Animated.Value(1)).current;
  const lockRotate   = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0.65)).current;

  // Non-native: border color sweep
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  // At 0 (locked): dim gold. Sweeps green→orange then settles at full gold (1).
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange:  [0,                       0.25,      0.55,      0.85,     1],
    outputRange: ['rgba(245,200,66,0.45)', '#4CAF50', '#FF8C00', '#F5C842', '#F5C842'],
  });

  const lockRotateDeg = lockRotate.interpolate({
    inputRange:  [-20, 0, 20],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  // Locked breathing pulse — 0.65 ↔ 0.45 at 2400ms cycle while locked
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(textOpacity, { toValue: 0.45, duration: 1200, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0.65, duration: 1200, useNativeDriver: true }),
    ]));
    breathLoopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('[MasterGateTile] perfectClear prop =', perfectClear, 'phase =', phaseRef.current);
    if (!perfectClear || phaseRef.current !== 'locked') return;

    console.log('[MasterGateTile] starting unlock sequence');
    phaseRef.current = 'unlocking';

    // Stop locked breathing pulse
    breathLoopRef.current?.stop();

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
    const t2 = setTimeout(() => {
      Animated.timing(textOpacity,  { toValue: 1.0, duration: 500, useNativeDriver: true }).start();
      Animated.timing(pulseOpacity, { toValue: 1.0, duration: 500, useNativeDriver: true }).start();
    }, 200);

    // Phase 3 — T+400ms: border color sweep (non-native)
    const t3 = setTimeout(() => {
      borderColorAnim.setValue(0);
      Animated.timing(borderColorAnim, { toValue: 1, duration: 800, useNativeDriver: false }).start();
    }, 400);

    // Phase 4 — T+600ms: heavy haptic
    const t4 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 600);

    // Phase 5 — T+800ms: mark unlocked, start pulse loop
    const t5 = setTimeout(() => {
      console.log('[MasterGateTile] phase now UNLOCKED — swipe enabled');
      phaseRef.current = 'unlocked';
      pulseLoopRef.current?.stop();
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ]));
      pulseLoopRef.current = loop;
      loop.start();
    }, 800);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      phaseRef.current = 'locked';
      pulseLoopRef.current?.stop();
    };
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
        console.log('[MasterGateTile] release — dy:', gs.dy, 'dx:', gs.dx, 'phase:', phaseRef.current);
        if (gs.dy < -40) {
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
    width: 20,
    height: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  lockShackle: {
    width: 12,
    height: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2.5,
    borderColor: '#F5C842',
    borderBottomWidth: 0,
    marginBottom: -1,
  },
  lockBody: {
    width: 20,
    height: 14,
    backgroundColor: '#F5C842',
    borderRadius: 3,
  },
  label: {
    fontSize: 16,
    fontFamily: FONTS.label,
    color: '#F5C842',
    letterSpacing: 3,
    fontWeight: '800',
  },
});
