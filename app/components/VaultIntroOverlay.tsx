import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';

// First-visit-only Vault explainer. Non-gating: VaultScreen's content
// renders normally underneath it, same frame — this is a dismissible layer,
// not a loading gate like the Hunt-round intro overlays. No Polly visit
// fires on dismiss; Vault is a Polly-free archive.

type Props = {
  onDismiss: () => void;
};

export function VaultIntroOverlay({ onDismiss }: Props) {
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
    <Animated.View style={[vo.root, { opacity }]}>
      <View style={vo.card}>
        <Text style={vo.kicker}>YOUR ARCHIVE</Text>
        <Text style={vo.headline}>WORDS MEAN MORE HERE</Text>
        <Text style={vo.body}>
          Every card you swipe correctly into the Polybook gets recorded
          here. Mastered words stand permanent — every trap she set on them,
          beaten. Haunted words are the ones whose trap held once — tap one
          to see exactly which trap got you, and what's still waiting.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter the Vault"
          onPress={handleBegin}
          style={({ pressed }) => [vo.beginBtn, pressed && vo.beginPressed]}
        >
          <Text style={vo.beginLabel}>LOOK INSIDE</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const vo = StyleSheet.create({
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
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(15,13,42,0.92)',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 2,
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
    marginBottom: 22,
  },
  beginBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(245,200,66,0.10)',
    marginTop: 8,
  },
  beginPressed: {
    opacity: 0.84,
  },
  beginLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 3,
  },
});
