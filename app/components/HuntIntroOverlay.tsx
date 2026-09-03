import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';
import { resolveHuntSwipeDirection } from './huntSwipeDirection';

// First-hunt-only instruction card. Purely instructional — explains the swipe
// grammar and stakes, never correctness. Shown once, before the first word.

type Props = {
  onDismiss: () => void;
};

type PracticeDirection = 'up' | 'right';

function PracticeCard({
  phrase,
  truthLabel,
  direction,
  reduceMotion,
  onComplete,
}: {
  phrase: string;
  truthLabel: 'REAL' | 'TRAP';
  direction: PracticeDirection;
  reduceMotion: boolean;
  onComplete: () => void;
}) {
  const position = useRef(new Animated.ValueXY()).current;
  const completedRef = useRef(false);
  const thresholdFiredRef = useRef(false);

  function reset() {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      damping: 14,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  }

  function resolve(dx: number, dy: number) {
    if (completedRef.current) return;
    const resolved = resolveHuntSwipeDirection(dx, dy);
    if (resolved !== direction) {
      reset();
      return;
    }
    completedRef.current = true;
    Haptics.cueAsync('standardCorrect');
    if (reduceMotion) {
      onComplete();
      return;
    }
    Animated.timing(position, {
      toValue: direction === 'up' ? { x: 0, y: -120 } : { x: 180, y: 0 },
      duration: 180,
      useNativeDriver: true,
    }).start(onComplete);
  }

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => {
      thresholdFiredRef.current = false;
    },
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
      if (
        !thresholdFiredRef.current &&
        resolveHuntSwipeDirection(gesture.dx, gesture.dy, 24)
      ) {
        thresholdFiredRef.current = true;
        Haptics.cueAsync('gestureThreshold');
      }
    },
    onPanResponderRelease: (_, gesture) => resolve(gesture.dx, gesture.dy),
    onPanResponderTerminate: reset,
  })).current;

  const actionName = direction === 'up' ? 'practiceClaim' : 'practiceReject';
  const actionLabel = direction === 'up' ? 'Swipe up' : 'Swipe right';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${truthLabel}. ${phrase}. ${actionLabel} to practice.`}
      accessibilityActions={[{ name: actionName, label: actionLabel }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === actionName) {
          resolve(direction === 'right' ? 80 : 0, direction === 'up' ? -80 : 0);
        }
      }}
      style={[io.practiceCard, { transform: position.getTranslateTransform() }]}
    >
      <Text style={io.practicePhrase}>{phrase}</Text>
      <View style={io.practiceFooter}>
        <Text style={truthLabel === 'REAL' ? io.exampleTagReal : io.exampleTagTrap}>{truthLabel}</Text>
        <Text style={io.practiceDirection}>{direction === 'up' ? 'SWIPE UP  ↑' : 'SWIPE RIGHT  →'}</Text>
      </View>
    </Animated.View>
  );
}

export function HuntIntroOverlay({ onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotionPreference();
  const [practiceStep, setPracticeStep] = useState(0);

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
    if (practiceStep < 2) return;
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
          <Text style={io.exampleIntro}>PRACTICE WITH ONE WORD · {Math.min(practiceStep + 1, 2)} OF 2</Text>
          <Text style={io.exampleWord}>FINE</Text>
          {practiceStep === 0 && (
            <PracticeCard
              key="practice-real"
              phrase="Parking ten minutes longer costs this."
              truthLabel="REAL"
              direction="up"
              reduceMotion={reduceMotion !== false}
              onComplete={() => setPracticeStep(1)}
            />
          )}
          {practiceStep === 1 && (
            <PracticeCard
              key="practice-trap"
              phrase="Judge dismisses the parking ticket."
              truthLabel="TRAP"
              direction="right"
              reduceMotion={reduceMotion !== false}
              onComplete={() => setPracticeStep(2)}
            />
          )}
          {practiceStep === 2 && <Text style={io.practiceComplete}>GRAMMAR LOCKED IN</Text>}
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
          accessibilityState={{ disabled: practiceStep < 2 }}
          disabled={practiceStep < 2}
          onPress={handleBegin}
          style={({ pressed }) => [io.beginBtn, practiceStep < 2 && io.beginDisabled, pressed && io.beginPressed]}
        >
          <Text style={io.beginLabel}>{practiceStep < 2 ? 'PRACTICE BOTH SWIPES' : 'BEGIN THE HUNT'}</Text>
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
    includeFontPadding: false,
    fontSize: 14,
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
    includeFontPadding: false,
    fontSize: 20,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  practiceCard: {
    minHeight: 86,
    borderRadius: PW.radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: PW.color.surfaceRaised,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  practicePhrase: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  practiceFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  practiceDirection: {
    color: PW.color.lavender,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 1,
  },
  practiceComplete: {
    minHeight: 86,
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 30,
  },
  exampleLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  exampleTagReal: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 1,
  },
  exampleTagTrap: {
    color: 'rgba(155,45,107,0.95)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 1,
  },
  headline: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
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
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 2,
  },
  ruleCopy: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 15,
    lineHeight: 19,
    marginTop: 2,
  },
  stakes: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 15,
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
  beginDisabled: {
    opacity: 0.45,
  },
  beginLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 3,
  },
});
