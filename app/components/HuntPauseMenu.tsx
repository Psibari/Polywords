import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';

type Props = {
  onResume: () => void;
  onHome: () => void;
  onSettings: () => void;
  onQuit: () => void;
};

type ActionProps = {
  label: string;
  accessibilityLabel: string;
  tone: 'primary' | 'secondary' | 'quiet';
  onPress: () => void;
};

function PauseAction({ label, accessibilityLabel, tone, onPress }: ActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        tone === 'primary' && styles.actionPrimary,
        tone === 'secondary' && styles.actionSecondary,
        tone === 'quiet' && styles.actionQuiet,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionLabel,
          tone === 'primary' && styles.actionLabelPrimary,
          tone === 'quiet' && styles.actionLabelQuiet,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function HuntPauseMenu({ onResume, onHome, onSettings, onQuit }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 16,
        stiffness: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, reduceMotion, scale]);

  return (
    <Animated.View
      style={[styles.root, { opacity }]}
      accessibilityViewIsModal
      onAccessibilityEscape={onResume}
    >
      <Animated.View style={[styles.panel, { transform: [{ scale }] }]}>
        <View style={styles.titleRule} />
        <Text style={styles.title}>HUNT PAUSED</Text>
        <Text style={styles.subtitle}>Your run is waiting.</Text>

        <View style={styles.actions}>
          <PauseAction
            label="RESUME HUNT"
            accessibilityLabel="Resume Hunt"
            tone="primary"
            onPress={onResume}
          />
          <PauseAction
            label="HOME"
            accessibilityLabel="Go Home and keep this Hunt"
            tone="secondary"
            onPress={onHome}
          />
          <PauseAction
            label="SETTINGS"
            accessibilityLabel="Open Settings and keep this Hunt"
            tone="secondary"
            onPress={onSettings}
          />
          <PauseAction
            label="QUIT HUNT"
            accessibilityLabel="Quit Hunt"
            tone="quiet"
            onPress={onQuit}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 340,
    backgroundColor: 'rgba(9,7,26,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    borderRadius: PW.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(155,45,107,0.58)',
    backgroundColor: 'rgba(15,13,42,0.97)',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    ...PW.shadow.panel,
  },
  titleRule: {
    width: 54,
    height: 3,
    borderRadius: 2,
    backgroundColor: PW.color.gold,
    marginBottom: 14,
  },
  title: {
    color: PW.color.white,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 2.3,
    textAlign: 'center',
  },
  subtitle: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 17,
    lineHeight: 22,
    marginTop: 5,
    marginBottom: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
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
  actionQuiet: {
    minHeight: 48,
    marginTop: 4,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.42)',
    backgroundColor: 'rgba(15,13,42,0.38)',
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
  actionLabelQuiet: {
    color: PW.color.mutedWhite,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.78,
  },
});
