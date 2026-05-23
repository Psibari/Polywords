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
  revealable?: boolean;
};

const SWIPE_THRESHOLD = 40;

export function SwipeMask({ mask, onSwipeUp, onSwipeDown, onTapReveal, state: s, revealable = false }: Props) {
  const panY        = useRef(new Animated.Value(0)).current;
  const panX        = useRef(new Animated.Value(0)).current;
  const tileOpacity = useRef(new Animated.Value(1)).current;
  const shakeX      = useRef(new Animated.Value(0)).current;
  const goldPulse   = useRef(new Animated.Value(0)).current;

  const flyAnimRef    = useRef<Animated.CompositeAnimation | null>(null);
  const goldLoopRef   = useRef<Animated.CompositeAnimation | null>(null);
  const judgedRef     = useRef(false);
  const swipeDirRef   = useRef<'up' | 'left' | null>(null);
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
    if (s === 'hidden' && revealable) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(goldPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(goldPulse, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      );
      goldLoopRef.current = loop;
      loop.start();
      return () => loop.stop();
    }
    goldLoopRef.current?.stop();
    goldPulse.setValue(0);
  }, [s, revealable]);

  // ── shatter effect ────────────────────────────────────────────
  function fireShatter(onDone?: () => void) {
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
    ).start(() => { setShowFragments(false); onDone?.(); });
  }

  // ── react to result state ─────────────────────────────────────
  useEffect(() => {
    if (s === 'correct') {
      flyAnimRef.current?.stop();
      if (swipeDirRef.current === 'left') {
        panX.setValue(0);
        tileOpacity.setValue(0);
        setFragColor('green');
        setShowFragments(true);
        fireShatter(() => {
          Animated.timing(tileOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
      } else {
        // snap back from fly position, fade in green
        Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
        Animated.timing(tileOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      }
    }

    if (s === 'wrong') {
      flyAnimRef.current?.stop();
      if (swipeDirRef.current === 'left') {
        panY.setValue(0);
        panX.setValue(0);
        tileOpacity.setValue(0);
        setFragColor('red');
        setShowFragments(true);
        fireShatter(() => {
          Animated.timing(tileOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
      } else {
        panY.setValue(0);
        panX.setValue(0);
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
      panX.setValue(0);
      tileOpacity.setValue(1);
      setShowFragments(false);
    }
  }, [s]);

  // ── fly-off animations ────────────────────────────────────────
  function flyOff(_direction: 'up') {
    const anim = Animated.parallel([
      Animated.timing(panY, {
        toValue: -700,
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
      onStartShouldSetPanResponder:        () => !judgedRef.current,
      onStartShouldSetPanResponderCapture: () => !judgedRef.current,

      onMoveShouldSetPanResponder: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 8 || g.dx < -8),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 5 || g.dx < -5),

      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, g) => {
        if (judgedRef.current) return;
        // Track dominant axis: left swipe vs up swipe
        if (g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy)) {
          panX.setValue(g.dx);
        } else {
          panY.setValue(g.dy);
        }
      },

      onPanResponderRelease: (_, g) => {
        if (judgedRef.current) return;
        if (g.dy < -SWIPE_THRESHOLD) {
          // Swipe up — claim as real meaning
          judgedRef.current = true;
          swipeDirRef.current = 'up';
          flyOff('up');
          onSwipeUpRef.current();
        } else if (g.dx < -SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          // Swipe left — reject as trap
          judgedRef.current = true;
          swipeDirRef.current = 'left';
          // Dim tile immediately; shatter fires when state resolves
          Animated.timing(tileOpacity, { toValue: 0, duration: 80, useNativeDriver: true }).start();
          onSwipeDownRef.current();
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
        }
      },
    }),
  ).current;

  // ── hidden tile ───────────────────────────────────────────────
  if (s === 'hidden') {
    return (
      <Pressable onPress={onTapReveal} disabled={!revealable} style={styles.tile}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.goldBorderOverlay, { opacity: goldPulse }]}
        />
        <Text style={styles.hiddenIcon}>❓</Text>
      </Pressable>
    );
  }

  // ── swipeable tile ────────────────────────────────────────────
  const bgColor =
    s === 'correct' && swipeDirRef.current === 'left' ? '#374151'
    : s === 'correct' ? '#22C55E'
    : s === 'wrong'   ? '#EF4444'
    : '#311F78';

  const borderColor =
    s === 'correct' && swipeDirRef.current === 'left' ? '#374151'
    : s === 'correct' ? '#22C55E'
    : s === 'wrong'   ? '#EF4444'
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
          { transform: [{ translateY: panY }, { translateX: panX }, { translateX: shakeX }] },
        ]}
      >
        <Text style={styles.emoji}>{mask.emoji}</Text>
        {!(s === 'correct' && swipeDirRef.current === 'left') && (
          <Text style={styles.phrase} numberOfLines={2}>{mask.phrase}</Text>
        )}
        {(s === 'correct' || s === 'wrong') && (
          <Text style={styles.resultIcon}>{s === 'correct' ? '✓' : '✗'}</Text>
        )}
        {s === 'wrong' && (
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
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  resultIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
});
