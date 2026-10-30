import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  DAILY_EXPIRED_BUTTON,
  DAILY_EXPIRED_BUTTON_A11Y,
  dailyExpiredTitle,
  dailyExpiredTitleA11y,
} from '../ui/dailyExpiredCopy';

// TIME'S UP FOR DAILY #N (Pete, 2026-10-29): a plain card, no Polly, one button. Shown once when
// an unfinished Daily ran out with its day. The card and button are DailyPauseCard's, copied
// rather than shared; the words live in app/ui/dailyExpiredCopy.ts.

type Props = {
  /** Challenge number of the Daily that ran out. */
  number: number;
  onDismiss: () => void;
};

export function DailyExpiredCard({ number, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;
  const reduceMotion = useReducedMotionPreference();

  // The pause card's entrance without Polly; Reduce Motion shows the final state.
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (reduceMotion !== false) {
      opacity.setValue(1);
      cardScale.setValue(1);
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
    ]).start();
  }, [cardScale, opacity, reduceMotion]);

  return (
    <Animated.View
      style={[ex.root, { opacity }]}
      accessibilityViewIsModal
      onAccessibilityEscape={onDismiss}
    >
      <Animated.View style={[ex.card, { transform: [{ scale: cardScale }] }]}>
        <Text
          style={ex.title}
          accessibilityRole="header"
          accessibilityLabel={dailyExpiredTitleA11y(number)}
        >
          {dailyExpiredTitle(number)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={DAILY_EXPIRED_BUTTON_A11Y}
          onPress={onDismiss}
          style={({ pressed }) => [ex.action, pressed && ex.pressed]}
        >
          <Text style={ex.actionLabel}>{DAILY_EXPIRED_BUTTON}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// Same overlay and card as DailyPauseCard (dp.*), minus the room Polly needed above the card.
const ex = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 345,
    backgroundColor: 'rgba(9,7,26,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: PW.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(155,45,107,0.62)',
    backgroundColor: 'rgba(15,13,42,0.97)',
    paddingTop: 34,
    paddingBottom: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...PW.shadow.panel,
  },
  title: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 28,
  },
  action: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(245,200,66,0.11)',
  },
  actionLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 19,
    letterSpacing: 3,
  },
  pressed: {
    opacity: 0.78,
  },
});
