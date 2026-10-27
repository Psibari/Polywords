import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';

const POLLY_QUIT = require('../../assets/images/polly/polly_quit_smug.png');

type Props = {
  onStay: () => void;
  onLeave: () => void;
};

export function PollyExitConfirm({ onStay, onLeave }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;
  const pollyY = useRef(new Animated.Value(34)).current;
  const pollyScale = useRef(new Animated.Value(0.96)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotionPreference();

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

  function handleStay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStay();
  }

  function handleLeave() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onLeave();
  }

  return (
    <Animated.View
      style={[ec.root, { opacity }]}
      accessibilityViewIsModal
      onAccessibilityEscape={handleStay}
    >
      <View style={ec.stage}>
        <Animated.View
          pointerEvents="none"
          style={[
            ec.pollyWrap,
            { transform: [{ translateY: pollyY }, { scale: pollyScale }] },
          ]}
        >
          <Image source={POLLY_QUIT} resizeMode="contain" style={ec.polly} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[ec.speechBubble, { opacity: bubbleOpacity }]}
        >
          <Text style={ec.speechText}>See you later,{'\n'}LOSER.</Text>
          <View style={ec.speechTail} />
        </Animated.View>

        <Animated.View style={[ec.card, { transform: [{ scale: cardScale }] }]}>
          <Text style={ec.kicker}>LEAVING THE HUNT?</Text>
          <Text style={ec.body}>
            Leave now and this run ends. Your score and remaining feathers are lost.
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
      </View>
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
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 1.8,
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
    marginBottom: 26,
  },
  stayBtn: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(245,200,66,0.11)',
    marginBottom: 12,
  },
  stayPressed: {
    opacity: 0.82,
  },
  stayLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 19,
    letterSpacing: 3,
  },
  leaveBtn: {
    width: '100%',
    minHeight: 50,
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
    fontSize: 17,
    letterSpacing: 2.4,
  },
});
