import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';

// First-hunt-only instruction card. Purely instructional — explains the swipe
// grammar and stakes, never correctness. Shown once, before the first word.

type Props = {
  onDismiss: () => void;
};

export function HuntIntroOverlay({ onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  function handleBegin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }

  return (
    <Animated.View style={[io.root, { opacity }]}>
      <View style={io.card}>
        <Text style={io.headline}>POLLY STOLE{'\n'}YOUR WORDS</Text>
        <Text style={io.body}>
          Every word hides more meanings than you think. Polly mixed the real
          ones with her traps.
        </Text>

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
          Lose every feather and Polly keeps the words.
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
