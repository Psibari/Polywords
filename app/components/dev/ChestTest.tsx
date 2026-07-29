import React, { useRef, useState, useEffect } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { HuntChest } from '../HuntChest';

// ─── THROWAWAY DEV TEST ─────────────────────────────────────────
// QA harness for HuntChest + entrance-variant comparison. No boss/game
// logic. Trivially removable — see the "CHEST TEST" dev button wiring
// in GameScreen.tsx. Entrances animate a wrapper around HuntChest only;
// HuntChest itself is untouched.

type Variant = 'slam' | 'arc' | 'shadow';
const VARIANTS: Variant[] = ['slam', 'arc', 'shadow'];
const VARIANT_LABELS: Record<Variant, string> = { slam: 'Slam', arc: 'Arc', shadow: 'Shadow' };

const STAGE_W = 330;
const STAGE_H = 300;

const START_TRANSLATE_Y = -160;
const START_TRANSLATE_X = 90; // Arc only
const START_SCALE = 0.15;

const FLIGHT_DURATION_MS = 520;
const FLIGHT_EASING = Easing.bezier(0.2, 0.9, 0.1, 1);

// Arc's translateX settles well before translateY finishes falling — with
// matching timing on both axes the path is mathematically a straight line
// (x:y ratio never changes), so the curve only reads once X is decoupled
// to a shorter, snappier settle than Y's full-length fall.
const ARC_X_SETTLE_MS = 300;
const ARC_X_EASING = Easing.out(Easing.cubic);

const SQUASH_IMPACT_MS = 70;
const SQUASH_SETTLE_MS = 140;
const OVERSHOOT_LEG_MS = 70;

export default function ChestTest({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [locksOpen, setLocksOpen] = useState<0 | 1 | 2 | 3>(0);
  const [variant, setVariant] = useState<Variant>('slam');

  const translateY = useRef(new Animated.Value(START_TRANSLATE_Y)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(START_SCALE)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const shadowScale = useRef(new Animated.Value(0.2)).current;
  const shadowOpacity = useRef(new Animated.Value(0.08)).current;

  function playEntrance(v: Variant) {
    translateY.setValue(START_TRANSLATE_Y);
    translateX.setValue(v === 'arc' ? START_TRANSLATE_X : 0);
    scale.setValue(START_SCALE);
    scaleX.setValue(1);
    scaleY.setValue(1);
    shadowScale.setValue(0.2);
    shadowOpacity.setValue(0.08);

    const flight = [
      Animated.timing(translateY, { toValue: 0, duration: FLIGHT_DURATION_MS, easing: FLIGHT_EASING, useNativeDriver: true }),
      Animated.timing(scale,      { toValue: 1, duration: FLIGHT_DURATION_MS, easing: FLIGHT_EASING, useNativeDriver: true }),
    ];
    if (v === 'arc') {
      flight.push(Animated.timing(translateX, { toValue: 0, duration: ARC_X_SETTLE_MS, easing: ARC_X_EASING, useNativeDriver: true }));
    }
    if (v === 'shadow') {
      flight.push(Animated.timing(shadowScale,   { toValue: 1,    duration: FLIGHT_DURATION_MS, easing: FLIGHT_EASING, useNativeDriver: true }));
      flight.push(Animated.timing(shadowOpacity, { toValue: 0.82, duration: FLIGHT_DURATION_MS, easing: FLIGHT_EASING, useNativeDriver: true }));
    }

    Animated.parallel(flight).start(() => {
      const squash = Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleX, { toValue: 1.08, duration: SQUASH_IMPACT_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 0.92, duration: SQUASH_IMPACT_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleX, { toValue: 1, duration: SQUASH_SETTLE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 1, duration: SQUASH_SETTLE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]);

      const scaleOvershoot = Animated.sequence([
        Animated.timing(scale, { toValue: v === 'arc' ? 1.09 : 1.05, duration: OVERSHOOT_LEG_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: OVERSHOOT_LEG_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]);

      const landing = [squash, scaleOvershoot];
      if (v === 'arc') {
        landing.push(Animated.sequence([
          Animated.timing(translateY, { toValue: 22, duration: OVERSHOOT_LEG_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0,  duration: OVERSHOOT_LEG_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]));
      }
      Animated.parallel(landing).start();
    });
  }

  useEffect(() => {
    playEntrance(variant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  function cycleLocks() {
    setLocksOpen(prev => (((prev + 1) % 4) as 0 | 1 | 2 | 3));
  }

  return (
    <Pressable style={styles.screen} onPress={() => setOpen(prev => !prev)}>
      <View style={styles.stage}>
        {variant === 'shadow' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shadowEllipse,
              { opacity: shadowOpacity, transform: [{ scale: shadowScale }] },
            ]}
          />
        )}
        <Animated.View
          style={{ transform: [{ translateX }, { translateY }, { scale }, { scaleX }, { scaleY }] }}
        >
          <HuntChest open={open} locksOpen={locksOpen} />
        </Animated.View>
      </View>

      {onClose && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close chest test"
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={12}
        >
          <Text style={styles.buttonText}>CLOSE</Text>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cycle unlocked dial count"
        onPress={cycleLocks}
        style={styles.locksButton}
        hitSlop={12}
      >
        <Text style={styles.buttonText}>LOCK + ({locksOpen}/3)</Text>
      </Pressable>

      <View style={styles.entranceBar}>
        <Text style={styles.variantLabel}>ENTRANCE: {VARIANT_LABELS[variant].toUpperCase()}</Text>
        <View style={styles.variantRow}>
          {VARIANTS.map(v => (
            <Pressable
              key={v}
              accessibilityRole="button"
              onPress={() => setVariant(v)}
              style={[styles.variantButton, variant === v && styles.variantButtonActive]}
            >
              <Text style={[styles.buttonText, variant === v && styles.variantButtonTextActive]}>
                {VARIANT_LABELS[v]}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Replay entrance"
            onPress={() => playEntrance(variant)}
            style={styles.replayButton}
          >
            <Text style={styles.buttonText}>REPLAY ENTRANCE</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: '#0F0D2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    width: STAGE_W,
    height: STAGE_H,
  },
  shadowEllipse: {
    position: 'absolute',
    left: STAGE_W / 2 - 120,
    top: 268,
    width: 240,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F5C842',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  locksButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F5C842',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  buttonText: {
    color: '#F5C842',
    fontSize: 12,
    letterSpacing: 1,
  },
  entranceBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,200,66,0.3)',
    gap: 8,
  },
  variantLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 1,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  variantButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.4)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  variantButtonActive: {
    backgroundColor: '#F5C842',
    borderColor: '#F5C842',
  },
  variantButtonTextActive: {
    color: '#0F0D2A',
    fontWeight: '700',
  },
  replayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#9B2D6B',
  },
});
