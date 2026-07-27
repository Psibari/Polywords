import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';

// First-boss-only warning. Plays over the existing boss entrance (haptics,
// board shake, Polly's "This word stays mine." visit) rather than replacing
// it — this only supplies the explanation that entrance never carried.
// Shown once, ever, gated by BOSS_INTRO_SEEN_KEY in GameScreen.

type Props = {
  onDismiss: () => void;
};

export function BossIntroOverlay({ onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  function handleBegin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }

  return (
    <Animated.View style={[bo.root, { opacity }]}>
      <View style={bo.card}>
        <Text style={bo.kicker}>BOSS ROUND</Text>
        <Text style={bo.headline}>POLLY'S WORD</Text>
        <Text style={bo.body}>
          This is it — the last word of the Hunt. Clear what's on the board,
          and Polly reveals what she's kept hidden.
        </Text>
        <Text style={bo.stakes}>
          Get it right, and the word goes in your vault. Get it wrong, and
          it comes back to haunt you.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Face the boss"
          onPress={handleBegin}
          style={({ pressed }) => [bo.beginBtn, pressed && bo.beginPressed]}
        >
          <Text style={bo.beginLabel}>FACE THE BOSS</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const bo = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 320,
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
    borderColor: 'rgba(155,45,107,0.55)',
    backgroundColor: 'rgba(15,13,42,0.92)',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  headline: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 14,
  },
  stakes: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 22,
  },
  beginBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: 'rgba(155,45,107,0.75)',
    backgroundColor: 'rgba(155,45,107,0.14)',
    marginTop: 8,
  },
  beginPressed: {
    opacity: 0.84,
  },
  beginLabel: {
    color: PW.color.foilLight,
    fontFamily: FONTS.hud,
    fontSize: 17,
    letterSpacing: 3,
  },
});
