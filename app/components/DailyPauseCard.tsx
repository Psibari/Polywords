import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  DAILY_PAUSE_CONTINUE,
  DAILY_PAUSE_CONTINUE_A11Y,
  DAILY_PAUSE_HOME,
  DAILY_PAUSE_HOME_A11Y,
  DAILY_PAUSE_KICKER,
  DAILY_PAUSE_POLLY_LINE,
  DAILY_PAUSE_SETTINGS,
  DAILY_PAUSE_SETTINGS_A11Y,
} from '../ui/dailyPauseCopy';

// The Daily's pause card (Pete, 2026-10-29): ONE card, Polly on top, then CONTINUE, HOME and
// SETTINGS. No quit: leaving the Daily costs nothing and an unfinished Daily can be resumed. The
// look is the Hunt's, copied rather than shared (huntPauseFlow.test.mjs pins the Hunt's strings):
// Polly, her bubble, the card and its entrance from PollyExitConfirm, the buttons from
// HuntPauseMenu. No body text: the title sits directly above the buttons with the gap the Hunt's
// card leaves between its text and its first button.

const POLLY_SMUG = require('../../assets/images/polly/polly_quit_smug.png');

type Props = {
  onContinue: () => void;
  onHome: () => void;
  onSettings: () => void;
};

type ActionProps = {
  label: string;
  accessibilityLabel: string;
  tone: 'primary' | 'secondary';
  last?: boolean;
  onPress: () => void;
};

function PauseAction({ label, accessibilityLabel, tone, last, onPress }: ActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        dp.action,
        tone === 'primary' ? dp.actionPrimary : dp.actionSecondary,
        last && dp.actionLast,
        pressed && dp.pressed,
      ]}
    >
      <Text style={[dp.actionLabel, tone === 'primary' && dp.actionLabelPrimary]}>{label}</Text>
    </Pressable>
  );
}

export function DailyPauseCard({ onContinue, onHome, onSettings }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;
  const pollyY = useRef(new Animated.Value(34)).current;
  const pollyScale = useRef(new Animated.Value(0.96)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotionPreference();

  // PollyExitConfirm's entrance, unchanged; Reduce Motion shows the final state.
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (reduceMotion !== false) {
      opacity.setValue(1);
      cardScale.setValue(1);
      pollyY.setValue(0);
      pollyScale.setValue(1);
      bubbleOpacity.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 17,
        stiffness: 250,
        useNativeDriver: true,
      }),
      Animated.spring(pollyY, {
        toValue: 0,
        damping: 12,
        stiffness: 270,
        mass: 0.75,
        useNativeDriver: true,
      }),
      Animated.spring(pollyScale, {
        toValue: 1,
        damping: 13,
        stiffness: 280,
        mass: 0.75,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(80),
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bubbleOpacity, cardScale, opacity, pollyScale, pollyY, reduceMotion]);

  return (
    <Animated.View
      style={[dp.root, { opacity }]}
      accessibilityViewIsModal
      onAccessibilityEscape={onContinue}
    >
      <View style={dp.stage}>
        <Animated.View
          pointerEvents="none"
          style={[
            dp.pollyWrap,
            { transform: [{ translateY: pollyY }, { scale: pollyScale }] },
          ]}
        >
          <Image source={POLLY_SMUG} resizeMode="contain" style={dp.polly} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[dp.speechBubble, { opacity: bubbleOpacity }]}
        >
          <Text style={dp.speechText}>{DAILY_PAUSE_POLLY_LINE}</Text>
          <View style={dp.speechTail} />
        </Animated.View>

        <Animated.View style={[dp.card, { transform: [{ scale: cardScale }] }]}>
          <Text style={dp.kicker}>{DAILY_PAUSE_KICKER}</Text>
          <PauseAction
            label={DAILY_PAUSE_CONTINUE}
            accessibilityLabel={DAILY_PAUSE_CONTINUE_A11Y}
            tone="primary"
            onPress={onContinue}
          />
          <PauseAction
            label={DAILY_PAUSE_HOME}
            accessibilityLabel={DAILY_PAUSE_HOME_A11Y}
            tone="secondary"
            onPress={onHome}
          />
          <PauseAction
            label={DAILY_PAUSE_SETTINGS}
            accessibilityLabel={DAILY_PAUSE_SETTINGS_A11Y}
            tone="secondary"
            last
            onPress={onSettings}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// root, stage, card, pollyWrap, polly, speechBubble, speechTail, speechText and kicker are
// PollyExitConfirm's (ec.*); the action styles are HuntPauseMenu's.
const dp = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 340,
    backgroundColor: 'rgba(9,7,26,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stage: {
    width: '100%',
    maxWidth: 400,
    paddingTop: 116,
    position: 'relative',
  },
  card: {
    width: '100%',
    borderRadius: PW.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(155,45,107,0.62)',
    backgroundColor: 'rgba(15,13,42,0.97)',
    paddingTop: 50,
    paddingBottom: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...PW.shadow.panel,
  },
  pollyWrap: {
    position: 'absolute',
    zIndex: 3,
    left: -35,
    top: -16,
    width: 220,
    height: 203,
  },
  polly: {
    width: '100%',
    height: '100%',
  },
  speechBubble: {
    position: 'absolute',
    zIndex: 4,
    right: 8,
    top: -80,
    width: 184,
    minHeight: 96,
    borderRadius: 24,
    backgroundColor: PW.color.white,
    paddingHorizontal: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...PW.shadow.card,
  },
  speechTail: {
    position: 'absolute',
    left: 8,
    bottom: -12,
    width: 26,
    height: 26,
    backgroundColor: PW.color.white,
    transform: [{ rotate: '45deg' }],
  },
  speechText: {
    color: '#2B2930',
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 23,
    lineHeight: 25,
    textAlign: 'center',
  },
  // The Hunt's kicker; its bottom gap is the Hunt body's gap above the first button.
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 1.8,
    textAlign: 'center',
    marginBottom: 26,
  },
  action: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    marginBottom: 12,
  },
  actionPrimary: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(245,200,66,0.11)',
  },
  actionSecondary: {
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: 'rgba(33,27,74,0.42)',
  },
  actionLast: {
    marginBottom: 0,
  },
  actionLabel: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 2.5,
  },
  actionLabelPrimary: {
    color: PW.color.gold,
    fontSize: 19,
    letterSpacing: 3,
  },
  pressed: {
    opacity: 0.78,
  },
});
