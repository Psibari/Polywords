import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  DAILY_EXPIRED_HOLD_MS,
  DAILY_EXPIRED_TITLE,
  dailyExpiredA11y,
  dailyExpiredSubtitle,
} from '../ui/dailyExpiredCopy';

// TIME'S UP + DAILY #N (Pete, 2026-10-30): a plain card, no Polly, no button. Shown once when an
// unfinished Daily ran out with its day. It fades away by itself after DAILY_EXPIRED_HOLD_MS;
// a tap closes it sooner. The words live in app/ui/dailyExpiredCopy.ts.

type Props = {
  /** Challenge number of the Daily that ran out. */
  number: number;
  onDismiss: () => void;
};

export function DailyExpiredCard({ number, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;
  const reduceMotion = useReducedMotionPreference();
  const closingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const close = useRef((instant: boolean) => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (instant) {
      onDismissRef.current();
      return;
    }
    Animated.timing(opacity, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => onDismissRef.current());
  }).current;

  // The pause card's entrance without Polly; Reduce Motion shows the final state and leaves
  // without a fade. Either way the card holds, then closes itself.
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const instant = reduceMotion !== false;

    if (instant) {
      opacity.setValue(1);
      cardScale.setValue(1);
    } else {
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
    }

    const timer = setTimeout(() => close(instant), DAILY_EXPIRED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [cardScale, close, opacity, reduceMotion]);

  return (
    <Animated.View
      style={[ex.root, { opacity }]}
      accessibilityViewIsModal
      onAccessibilityEscape={() => close(true)}
    >
      <Pressable
        style={ex.tapArea}
        accessibilityRole="button"
        accessibilityLabel={dailyExpiredA11y(number)}
        onPress={() => close(reduceMotion !== false)}
      >
        <Animated.View style={[ex.card, { transform: [{ scale: cardScale }] }]}>
          <Text style={ex.title} accessibilityRole="header">
            {DAILY_EXPIRED_TITLE}
          </Text>
          <Text style={ex.subtitle}>{dailyExpiredSubtitle(number)}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Same overlay and card as DailyPauseCard (dp.*), minus Polly and the button.
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
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...PW.shadow.panel,
  },
  tapArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 20,
    letterSpacing: 3,
    textAlign: 'center',
  },
});
