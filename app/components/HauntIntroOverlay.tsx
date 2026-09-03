import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';

// First-haunt-only explainer. GameScreen holds the board unmounted until this
// is dismissed, same gate pattern as BossIntroOverlay.

type Props = {
  onDismiss: () => void;
};

export function HauntIntroOverlay({ onDismiss }: Props) {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
    <Animated.View style={[ho.root, { opacity }]}>
      <View style={ho.card}>
        <Text style={ho.kicker}>RETURNING HAUNT</Text>
        <Text style={ho.headline}>DON'T LOSE TO{'\n'}A PARROT AGAIN</Text>
        <Text style={ho.body}>
          It's the one that got you last time. It'll keep haunting you until
          you beat it. Polly's the one with the bird brain here — go prove
          it.
        </Text>
        <Text style={ho.stakes}>
          Beat it: BANISHED, gone for good. Miss it again: STILL HAUNTED —
          she keeps it and it comes back.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Face the returning haunt"
          onPress={handleBegin}
          style={({ pressed }) => [ho.beginBtn, pressed && ho.beginPressed]}
        >
          <Text style={ho.beginLabel}>FACE IT AGAIN</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const ho = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 310,
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
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  headline: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 14,
  },
  stakes: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
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
    borderColor: 'rgba(123,45,139,0.75)',
    backgroundColor: 'rgba(123,45,139,0.14)',
    marginTop: 8,
  },
  beginPressed: {
    opacity: 0.84,
  },
  beginLabel: {
    color: PW.color.foilLight,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 3,
  },
});
