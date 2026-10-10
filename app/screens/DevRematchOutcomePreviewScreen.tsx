import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import HeroBook from '../components/ui/HeroBook';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { buildRematchOutcomeDevPreview, type RematchOutcomeDevPreviewKind } from '../game/rematchOutcomeDevPreview';
import { BUSTER_WORD, resolveBossOutcomePlaqueFeedback, resolveRematchLossFeedback } from '../game/huntOutcomeFeedback';
import { playSfx } from '../audio/sfx';
import { Haptics } from '../utils/haptics';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { BOSS_SKY_TUNING } from '../ui/ambientSkyTuning';
import { PW } from '../ui/pwTheme';

const masteredPlaqueArt = require('../../assets/images/results/mastered-result-plaque.png');
const kingPlaqueArt = require('../../assets/images/results/king-result-plaque.png');
const busterPlaqueArt = require('../../assets/images/results/buster-result-plaque.png');
const PLAQUE_ASPECT = 681 / 567;

const MASTER_HOLD_MS = 720;
const BUSTER_DROP_MS = 260;
const BUSTER_LAND_DELAY_MS = 150;
const BUSTER_LAND_MS = 240;
const BUSTER_DROP_DISTANCE = 46;

type Props = {
  navigation: any;
  route: { params?: { outcome?: RematchOutcomeDevPreviewKind } };
};

function PlaqueShell({
  word,
  finalArt,
  kind,
  onContinue,
}: {
  word: string;
  finalArt: any;
  kind: RematchOutcomeDevPreviewKind;
  onContinue: () => void;
}) {
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const finalArtOpacity = useRef(new Animated.Value(0)).current;
  const masterOpacity = useRef(new Animated.Value(1)).current;
  const maY = useRef(new Animated.Value(0)).current;
  const maOpacity = useRef(new Animated.Value(1)).current;
  const buY = useRef(new Animated.Value(-BUSTER_DROP_DISTANCE)).current;
  const buOpacity = useRef(new Animated.Value(0)).current;
  const continueOpacity = useRef(new Animated.Value(0.35)).current;
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const feedback = resolveBossOutcomePlaqueFeedback('mastered');
    playSfx(feedback.sfx);
    if (feedback.hapticCue) Haptics.cueAsync(feedback.hapticCue);

    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      finalArtOpacity.setValue(1);
      masterOpacity.setValue(0);
      if (kind === 'buster') {
        maOpacity.setValue(0);
        buOpacity.setValue(1);
        buY.setValue(0);
      }
      setCanDismiss(true);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 150, useNativeDriver: true }),
    ]).start();

    if (kind === 'king') {
      timers.push(setTimeout(() => {
        Animated.parallel([
          Animated.timing(masterOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(finalArtOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
      }, MASTER_HOLD_MS));
    } else {
      const dropAt = MASTER_HOLD_MS;
      timers.push(setTimeout(() => {
        Animated.parallel([
          Animated.timing(maY, { toValue: BUSTER_DROP_DISTANCE, duration: BUSTER_DROP_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(maOpacity, { toValue: 0, duration: BUSTER_DROP_MS, useNativeDriver: true }),
          Animated.timing(finalArtOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
      }, dropAt));
      timers.push(setTimeout(() => {
        Animated.parallel([
          Animated.timing(buOpacity, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(buY, { toValue: 0, duration: BUSTER_LAND_MS, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        ]).start();
        const punch = resolveRematchLossFeedback();
        playSfx(punch.sfx);
        Haptics.cueAsync(punch.hapticCue);
      }, dropAt + BUSTER_LAND_DELAY_MS));
    }

    timers.push(setTimeout(() => {
      setCanDismiss(true);
      Animated.timing(continueOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, 1500));

    return () => timers.forEach(clearTimeout);
  }, [buOpacity, buY, continueOpacity, finalArtOpacity, kind, maOpacity, maY, masterOpacity, opacity, reduceMotion, scale]);

  const finalWordStyle = kind === 'king' ? styles.kingWord : styles.busterWord;

  return (
    <Pressable
      style={styles.plaqueOverlay}
      onPress={() => canDismiss && onContinue()}
      accessibilityRole="button"
      accessibilityLabel={`${kind === 'king' ? 'King' : 'Buster'}. ${word}. Continue.`}
    >
      <Animated.View style={[styles.plaqueColumn, { opacity, transform: [{ scale }] }]}>
        <View style={styles.plaqueFrame}>
          <Image source={masteredPlaqueArt} style={styles.plaqueImage} resizeMode="contain" />
          <Animated.Image
            source={finalArt}
            style={[styles.plaqueImage, styles.plaqueImageAbsolute, { opacity: finalArtOpacity }]}
            resizeMode="contain"
          />

          {kind === 'king' ? (
            <>
              <Animated.Text style={[styles.masterLabel, { opacity: masterOpacity }]}>MASTER</Animated.Text>
              <Text style={[styles.dynamicWord, finalWordStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.58}>
                {word}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.busterHeadlineRow}>
                <View style={styles.busterPrefixSlot}>
                  <Animated.Text style={[styles.busterHeadline, { opacity: maOpacity, transform: [{ translateY: maY }] }]}>
                    {BUSTER_WORD.dropped}
                  </Animated.Text>
                  <Animated.Text style={[styles.busterHeadline, styles.busterArriving, { opacity: buOpacity, transform: [{ translateY: buY }] }]}>
                    {BUSTER_WORD.arriving}
                  </Animated.Text>
                </View>
                <Text style={styles.busterHeadline}>{BUSTER_WORD.kept}</Text>
              </View>
              <Text style={[styles.dynamicWord, finalWordStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.58}>
                {word}
              </Text>
            </>
          )}
        </View>
        <Animated.Text style={[styles.plaqueContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

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
            <Text style={[styles.bookWord, bookVariant === 'mastered' ? styles.bookWordMastered : styles.bookWordNeutral]}>{preview.word}</Text>
          </HeroBook>
        </View>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close preview">
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </SafeAreaView>
      {showOverlay && (
        <PlaqueShell
          word={preview.word}
          finalArt={kind === 'king' ? kingPlaqueArt : busterPlaqueArt}
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
  bookStage: { marginTop: 70, marginHorizontal: 14, height: 360, position: 'relative' },
  bookWord: { fontFamily: FONTS.wordDisplay, includeFontPadding: false, fontSize: 54, textAlign: 'center' },
  bookWordMastered: { color: PW.color.purple },
  bookWordNeutral: { color: PW.color.gold },
  closeButton: { position: 'absolute', right: 18, top: 8, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,13,42,0.82)', borderWidth: 1, borderColor: PW.color.purpleSoft },
  closeText: { color: PW.color.white, fontSize: 28, lineHeight: 30 },
  plaqueOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(15,13,42,0.42)' },
  plaqueColumn: { alignItems: 'center' },
  plaqueFrame: { width: 324, aspectRatio: PLAQUE_ASPECT, position: 'relative' },
  plaqueImage: { width: '100%', height: '100%' },
  plaqueImageAbsolute: { position: 'absolute', left: 0, top: 0 },
  masterLabel: { position: 'absolute', left: '12%', right: '12%', top: '29%', color: PW.color.purple, fontFamily: FONTS.label, includeFontPadding: false, fontWeight: '900', fontSize: 36, textAlign: 'center' },
  dynamicWord: { position: 'absolute', left: '15%', right: '15%', color: PW.color.purple, fontFamily: FONTS.wordDisplay, includeFontPadding: false, fontSize: 42, textAlign: 'center' },
  kingWord: { top: '58%' },
  busterWord: { top: '58%', color: PW.color.gold },
  busterHeadlineRow: { position: 'absolute', left: '10%', right: '10%', top: '29%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  busterPrefixSlot: { position: 'relative', minWidth: 58, alignItems: 'center', justifyContent: 'center' },
  busterHeadline: { color: PW.color.gold, fontFamily: FONTS.label, includeFontPadding: false, fontWeight: '900', fontSize: 36, textAlign: 'center' },
  busterArriving: { position: 'absolute', left: 0, right: 0, top: 0 },
  plaqueContinue: { marginTop: 16, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.label, includeFontPadding: false, fontSize: FONT_SIZES.hudLabel, letterSpacing: 1, textAlign: 'center' },
});
