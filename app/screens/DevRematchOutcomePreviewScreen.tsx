import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import HeroBook from '../components/ui/HeroBook';
import RematchOutcomePlaque from '../components/ui/RematchOutcomePlaque';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { buildRematchOutcomeDevPreview, type RematchOutcomeDevPreviewKind } from '../game/rematchOutcomeDevPreview';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { BOSS_SKY_TUNING } from '../ui/ambientSkyTuning';
import { PW } from '../ui/pwTheme';

type Props = {
  navigation: any;
  route: { params?: { outcome?: RematchOutcomeDevPreviewKind } };
};

export default function DevRematchOutcomePreviewScreen({ navigation, route }: Props) {
  const kind: RematchOutcomeDevPreviewKind = route.params?.outcome === 'buster' ? 'buster' : 'king';
  const preview = buildRematchOutcomeDevPreview(kind);
  const reduceMotion = useReducedMotionPreference();
  const cover = useRef(new Animated.Value(0)).current;
  const intake = useRef(new Animated.Value(0)).current;
  const [bookVariant, setBookVariant] = useState<'neutral' | 'mastered'>('mastered');
  const [showOverlay, setShowOverlay] = useState(false);

  const coverRotateX = cover.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '58deg'] });
  const intakeScaleY = intake.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  useEffect(() => {
    setBookVariant('mastered');
    setShowOverlay(false);
    cover.setValue(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    if (kind === 'king') {
      if (reduceMotion === false) {
        Animated.sequence([
          Animated.timing(cover, { toValue: 0.16, duration: 140, useNativeDriver: true }),
          Animated.timing(cover, { toValue: 0, duration: 210, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
        ]).start();
      }
      timers.push(setTimeout(() => setShowOverlay(true), 700));
    } else {
      if (reduceMotion === false) {
        Animated.sequence([
          Animated.timing(cover, { toValue: 0.55, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(cover, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]).start();
      }
      timers.push(setTimeout(() => setBookVariant('neutral'), reduceMotion === false ? 260 : 0));
      timers.push(setTimeout(() => setShowOverlay(true), 850));
    }

    return () => timers.forEach(clearTimeout);
  }, [cover, kind, reduceMotion]);

  if (!__DEV__) return null;

  return (
    <View style={styles.screen}>
      <AmbientSkyBackground {...BOSS_SKY_TUNING} />
      <SafeAreaView style={styles.safe}>
        <Text style={styles.kicker}>MASTER'S REMATCH</Text>
        <View style={styles.bookStage} pointerEvents="none">
          <HeroBook coverRotateX={coverRotateX} intakeOpacity={intake} intakeScaleY={intakeScaleY} variant={bookVariant}>
            <Text style={[styles.bookWord, bookVariant === 'mastered' ? styles.bookWordMastered : styles.bookWordNeutral]}>
              {preview.word}
            </Text>
          </HeroBook>
        </View>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </SafeAreaView>
      {showOverlay && (
        <RematchOutcomePlaque
          word={preview.word}
          kind={kind}
          onContinue={() => navigation.goBack()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bgDeep },
  safe: { flex: 1 },
  kicker: {
    marginTop: 16,
    alignSelf: 'center',
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.hudLabel,
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(15,13,42,0.88)',
  },
  bookStage: {
    marginTop: 70,
    marginHorizontal: 14,
    height: 360,
    position: 'relative',
  },
  bookWord: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 54,
    textAlign: 'center',
  },
  bookWordMastered: { color: PW.color.purple },
  bookWordNeutral: { color: PW.color.gold },
  closeButton: {
    position: 'absolute',
    right: 18,
    top: 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,13,42,0.82)',
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
  },
  closeText: { color: PW.color.white, fontSize: 28, lineHeight: 30 },
});
