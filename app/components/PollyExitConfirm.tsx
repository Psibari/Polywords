import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { POLLY_LINES } from '../game/pollyCharacter';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';

// Guards a mid-Hunt exit (back gesture, hardware back, or nav away) behind
// a real choice — never a system "are you sure?" dialog. Losing the run is
// framed as Polly's win, not an app warning.

type Props = {
  onStay: () => void;
  onLeave: () => void;
};

export function PollyExitConfirm({ onStay, onLeave }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const reduceMotion = useReducedMotionPreference();

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 260, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, reduceMotion]);

  function handleStay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStay();
  }

  function handleLeave() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onLeave();
  }

  return (
    <Animated.View style={[ec.root, { opacity }]}>
      <Animated.View style={[ec.card, { transform: [{ scale }] }]}>
        <Text style={ec.kicker}>LEAVING THE HUNT?</Text>
        <Text style={ec.pollyLine}>“{POLLY_LINES.huntAbandonTaunt}”</Text>
        <Text style={ec.body}>
          Leave now and this run is gone — score, feathers, everything you've
          claimed today.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keep hunting"
          onPress={handleStay}
          style={({ pressed }) => [ec.stayBtn, pressed && ec.stayPressed]}
        >
          <Text style={ec.stayLabel}>KEEP HUNTING</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave the hunt and forfeit this run"
          onPress={handleLeave}
          style={({ pressed }) => [ec.leaveBtn, pressed && ec.leavePressed]}
        >
          <Text style={ec.leaveLabel}>LEAVE THE HUNT</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const ec = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 350,
    backgroundColor: 'rgba(9,7,26,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: PW.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(155,45,107,0.55)',
    backgroundColor: 'rgba(15,13,42,0.94)',
    paddingVertical: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  pollyLine: {
    color: PW.color.lavender,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 22,
    lineHeight: 27,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  stayBtn: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(245,200,66,0.10)',
    marginBottom: 12,
  },
  stayPressed: {
    opacity: 0.84,
  },
  stayLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 3,
  },
  leaveBtn: {
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.55)',
  },
  leavePressed: {
    opacity: 0.7,
  },
  leaveLabel: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 2,
  },
});
