import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';

// First-hunt-only instruction card. Purely instructional — explains the swipe
// grammar and stakes, never correctness. Shown once, before the first word.

type Props = {
  onDismiss: () => void;
};

export function HuntIntroOverlay({ onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotionPreference();

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue(1);
      return;
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [opacity, reduceMotion]);

  function handleBegin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reduceMotion !== false) {
      onDismiss();
      return;
    }
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }

  return (
    <Animated.View style={[io.root, { opacity }]}>
      <View style={io.card}>
        <Text style={io.headline}>POLLY SET{'\n'}THE TRAPS</Text>
        <Text style={io.body}>
          One familiar word can hold several meanings. Polly mixes those
          meanings with convincing lines that belong somewhere else.
        </Text>

        <View style={io.example}>
          <Text style={io.exampleIntro}>LOOK AT ONE WORD — TRUST WHAT YOU RECOGNIZE</Text>
          <Text style={io.exampleWord}>FINE</Text>

          <View style={io.exampleLineRow}>
            <Text style={io.exampleLine}>Parking ten minutes longer costs this.</Text>
            <Text style={io.exampleTagReal}>REAL</Text>
          </View>
          <View style={io.exampleLineRow}>
            <Text style={io.exampleLine}>No clouds spoil the picnic.</Text>
            <Text style={io.exampleTagReal}>REAL</Text>
          </View>
          <View style={io.exampleLineRow}>
            <Text style={io.exampleLine}>Judge dismisses the parking ticket.</Text>
            <Text style={io.exampleTagTrap}>TRAP</Text>
          </View>
        </View>

        <View style={io.ruleRow}>
          <Text style={io.ruleArrow}>↑</Text>
          <View style={io.ruleCopyBlock}>
            <Text style={io.ruleTitle}>SWIPE UP</Text>
            <Text style={io.ruleCopy}>Claim a real meaning</Text>
          </View>
        </View>
        <View style={io.ruleRow}>
          <Text style={io.ruleArrow}>→</Text>
          <View style={io.ruleCopyBlock}>
            <Text style={io.ruleTitle}>SWIPE RIGHT</Text>
            <Text style={io.ruleCopy}>Reject one of Polly's traps</Text>
          </View>
        </View>

        <Text style={io.stakes}>
          Wrong calls cost a feather — and they stick.{'\n'}
          Run out of feathers, and Polly wins.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Begin the hunt"
          onPress={handleBegin}
          style={({ pressed }) => [io.beginBtn, pressed && io.beginPressed]}
        >
          <Text style={io.beginLabel}>BEGIN THE HUNT</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const io = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    backgroundColor: 'rgba(9,7,26,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: PW.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(123,45,139,0.55)',
    backgroundColor: 'rgba(15,13,42,0.92)',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  exampleIntro: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  example: {
    borderRadius: PW.radius.card,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.28)',
    backgroundColor: 'rgba(15,13,42,0.55)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  exampleWord: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    fontSize: 20,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  exampleLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  exampleLine: {
    flex: 1,
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    lineHeight: 18,
  },
  exampleTagReal: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  exampleTagTrap: {
    color: 'rgba(155,45,107,0.95)',
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  headline: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  ruleArrow: {
    color: PW.color.lavender,
    fontSize: 26,
    width: 32,
    textAlign: 'center',
  },
  ruleCopyBlock: {
    flex: 1,
  },
  ruleTitle: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 2,
  },
  ruleCopy: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  stakes: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  beginBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(245,200,66,0.10)',
  },
  beginPressed: {
    opacity: 0.84,
  },
  beginLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: 17,
    letterSpacing: 3,
  },
});
