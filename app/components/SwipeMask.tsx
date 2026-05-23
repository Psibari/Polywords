import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Mask } from '../game/types';

export type SwipeMaskState = 'idle' | 'correct' | 'wrong' | 'hidden' | 'revealed';

type Props = {
  mask: Mask;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onTapReveal: () => void;
  state: SwipeMaskState;
};

const SWIPE_THRESHOLD = 40;

export function SwipeMask({ mask, onSwipeUp, onSwipeDown, onTapReveal, state: s }: Props) {
  const panY        = useRef(new Animated.Value(0)).current;
  const tileOpacity = useRef(new Animated.Value(1)).current;
  const shakeX      = useRef(new Animated.Value(0)).current;
  const goldPulse   = useRef(new Animated.Value(0)).current;

  const flyAnimRef    = useRef<Animated.CompositeAnimation | null>(null);
  const goldLoopRef   = useRef<Animated.CompositeAnimation | null>(null);
  const judgedRef     = useRef(false);
  const swipeDirRef   = useRef<'up' | 'down' | null>(null);
  const stateRef      = useRef(s);
  const onSwipeUpRef  = useRef(onSwipeUp);
  const onSwipeDownRef = useRef(onSwipeDown);

  const [showFragments, setShowFragments] = useState(false);
  const [fragColor, setFragColor] = useState<'green' | 'red'>('green');
  const fragAnims = useRef([
    { x: new Animated.Value(0), y: new Animated.Value(0), op: new Animated.Value(1) },
    { x: new Animated.Value(0), y: new Animated.Value(0), op: new Animated.Value(1) },
    { x: new Animated.Value(0), y: new Animated.Value(0), op: new Animated.Value(1) },
    { x: new Animated.Value(0), y: new Animated.Value(0), op: new Animated.Value(1) },
  ]).current;

  useEffect(() => { stateRef.current = s; }, [s]);
  useEffect(() => { onSwipeUpRef.current = onSwipeUp; }, [onSwipeUp]);
  useEffect(() => { onSwipeDownRef.current = onSwipeDown; }, [onSwipeDown]);

  // ── gold border pulse for hidden ─────────────────────────────
  useEffect(() => {
    if (s === 'hidden') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(goldPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(goldPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
      );
      goldLoopRef.current = loop;
      loop.start();
      return () => loop.stop();
    }
    goldLoopRef.current?.stop();
  }, [s]);

  // ── shatter effect ────────────────────────────────────────────
  function fireShatter() {
    fragAnims.forEach(a => { a.x.setValue(0); a.y.setValue(0); a.op.setValue(1); });
    const dirs = [
      { tx: -38, ty: -42 },
      { tx:  38, ty: -42 },
      { tx: -38, ty:  42 },
      { tx:  38, ty:  42 },
    ];
    Animated.parallel(
      fragAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim.x, { toValue: dirs[i].tx, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.y, { toValue: dirs[i].ty, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.op, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ),
    ).start(() => setShowFragments(false));
  }

  // ── react to result state ─────────────────────────────────────
  useEffect(() => {
    if (s === 'correct') {
      flyAnimRef.current?.stop();
      if (swipeDirRef.current === 'down') {
        tileOpacity.setValue(0);
        setFragColor('green');
        setShowFragments(true);
        fireShatter();
      } else {
        Animated.timing(tileOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }
    }

    if (s === 'wrong') {
      flyAnimRef.current?.stop();
      if (swipeDirRef.current === 'down') {
        panY.setValue(0);
        tileOpacity.setValue(0);
        setFragColor('red');
        setShowFragments(true);
        fireShatter();
      } else {
        panY.setValue(0);
        tileOpacity.setValue(1);
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 14, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -14, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 9, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -9, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();
      }
    }

    if (s === 'revealed') {
      // reset so the tile is swipeable from its natural position
      judgedRef.current = false;
      swipeDirRef.current = null;
      panY.setValue(0);
      tileOpacity.setValue(1);
      setShowFragments(false);
    }
  }, [s]);

  // ── fly-off animation ─────────────────────────────────────────
  function flyOff(direction: 'up' | 'down') {
    const anim = Animated.parallel([
      Animated.timing(panY, {
        toValue: direction === 'up' ? -700 : 700,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(tileOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]);
    flyAnimRef.current = anim;
    anim.start();
  }

  // ── pan responder ─────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        !judgedRef.current && stateRef.current !== 'hidden',

      onMoveShouldSetPanResponder: (_, g) =>
        !judgedRef.current &&
        stateRef.current !== 'hidden' &&
        Math.abs(g.dy) > 6,

      onPanResponderMove: (_, g) => {
        if (judgedRef.current) return;
        panY.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (judgedRef.current) return;
        if (g.dy < -SWIPE_THRESHOLD) {
          judgedRef.current = true;
          swipeDirRef.current = 'up';
          flyOff('up');
          onSwipeUpRef.current();
        } else if (g.dy > SWIPE_THRESHOLD) {
          judgedRef.current = true;
          swipeDirRef.current = 'down';
          // dim tile immediately; shatter fires when state resolves
          Animated.timing(tileOpacity, { toValue: 0, duration: 80, useNativeDriver: true }).start();
          onSwipeDownRef.current();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 22,
            bounciness: 8,
          }).start();
        }
      },

      onPanResponderTerminate: (_, g) => {
        if (!judgedRef.current) {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
        }
      },
    }),
  ).current;

  // ── hidden tile ───────────────────────────────────────────────
  if (s === 'hidden') {
    return (
      <Pressable onPress={onTapReveal} style={styles.tile}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.goldBorderOverlay, { opacity: goldPulse }]}
        />
        <Text style={styles.hiddenIcon}>❓</Text>
        <Text style={styles.tapHint}>tap to reveal</Text>
      </Pressable>
    );
  }

  // ── swipeable tile ────────────────────────────────────────────
  const bgColor =
    s === 'correct' ? '#22C55E'
    : s === 'wrong'  ? '#EF4444'
    : '#311F78';

  const borderColor =
    s === 'correct' ? '#22C55E'
    : s === 'wrong'  ? '#EF4444'
    : 'rgba(139,92,246,0.5)';

  const wrongLabel =
    swipeDirRef.current === 'up' ? 'Not a meaning.' : 'Actually a meaning.';

  const fragBg = fragColor === 'green' ? '#22C55E' : '#EF4444';

  return (
    <View style={styles.tileOuter} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.tile,
          { backgroundColor: bgColor, borderColor, opacity: tileOpacity },
          { transform: [{ translateY: panY }, { translateX: shakeX }] },
        ]}
      >
        <Text style={styles.emoji}>{mask.emoji}</Text>
        <Text style={styles.phrase} numberOfLines={2}>{mask.phrase}</Text>
        {s === 'wrong' && swipeDirRef.current !== 'down' && (
          <Text style={styles.wrongLabel}>{wrongLabel}</Text>
        )}
      </Animated.View>

      {showFragments && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          {fragAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.fragment,
                {
                  top:  i < 2 ? 0 : '50%',
                  left: i % 2 === 0 ? 0 : '50%',
                  backgroundColor: fragBg,
                  opacity: anim.op,
                  transform: [{ translateX: anim.x }, { translateY: anim.y }],
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tileOuter: {
    overflow: 'visible',
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.5)',
    backgroundColor: '#311F78',
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  fragment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    borderRadius: 8,
  },
  goldBorderOverlay: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  phrase: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  wrongLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
  },
  hiddenIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  tapHint: {
    color: 'rgba(255,215,0,0.6)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
