import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import HeroBook from '../components/ui/HeroBook';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { buildRematchOutcomeDevPreview, type RematchOutcomeDevPreviewKind } from '../game/rematchOutcomeDevPreview';
import {
  BUSTER_WORD,
  resolveBossOutcomePlaqueFeedback,
  resolveBossOutcomeSequenceFeedback,
  resolveRematchLossFeedback,
} from '../game/huntOutcomeFeedback';
import { playSfx } from '../audio/sfx';
import { Haptics } from '../utils/haptics';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { BOSS_SKY_TUNING } from '../ui/ambientSkyTuning';
import { PW } from '../ui/pwTheme';

const masteredPlaqueArt = require('../../assets/images/results/mastered-result-plaque.png');
const MASTERED_PLAQUE_ASPECT = 681 / 567;

const KING_HOLD_MS = 700;
const KING_LAND_MS = 240;
const KING_DROP_DISTANCE = 52;
const BUSTER_HOLD_MS = 650;
const BUSTER_DROP_MS = 260;
const BUSTER_LAND_DELAY_MS = 150;
const BUSTER_LAND_MS = 240;
const BUSTER_PUNCH_AT_MS = 200;
const BUSTER_DROP_DISTANCE = 46;

type Props = {
  navigation: any;
  route: { params?: { outcome?: RematchOutcomeDevPreviewKind } };
};

function KingHeadline({ from }: { from: string }) {
  const reduceMotion = useReducedMotionPreference();
  const kingY = useRef(new Animated.Value(-KING_DROP_DISTANCE)).current;
  const kingOpacity = useRef(new Animated.Value(0)).current;
  const fromY = useRef(new Animated.Value(0)).current;
  const fromOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion !== false) {
      kingY.setValue(0);
      kingOpacity.setValue(1);
      fromOpacity.setValue(0);
      return;
    }
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(kingOpacity, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(kingY, { toValue: 0, duration: KING_LAND_MS, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(fromOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fromY, { toValue: 10, duration: 200, useNativeDriver: true }),
      ]).start();
    }, 180 + KING_HOLD_MS);
    return () => clearTimeout(timer);
  }, [reduceMotion, fromOpacity, fromY, kingOpacity, kingY]);

  return (
    <View accessible accessibilityLabel="King">
      <Animated.Text style={[styles.plaqueHeadline, { opacity: fromOpacity, transform: [{ translateY: fromY }] }]}>{from}</Animated.Text>
      <Animated.Text style={[styles.plaqueHeadline, styles.kingArriving, { opacity: kingOpacity, transform: [{ translateY: kingY }] }]}>KING</Animated.Text>
    </View>
  );
}

function KingOverlay({ word, onContinue }: { word: string; onContinue: () => void }) {
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const continueOpacity = useRef(new Animated.Value(0.35)).current;
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    const feedback = resolveBossOutcomePlaqueFeedback('mastered');
    playSfx(feedback.sfx);
    if (feedback.hapticCue) Haptics.cueAsync(feedback.hapticCue);
    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 160, useNativeDriver: true }),
      ]).start();
    }
    const ready = setTimeout(() => setCanDismiss(true), 1200);
    return () => clearTimeout(ready);
  }, [opacity, reduceMotion, scale]);

  useEffect(() => {
    if (!canDismiss) return;
    Animated.timing(continueOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [canDismiss, continueOpacity]);

  return (
    <Pressable style={styles.plaqueOverlay} onPress={() => canDismiss && onContinue()}>
      <Animated.View style={[styles.plaqueColumn, { opacity, transform: [{ scale }] }]}>
        <View style={styles.masteredPlaqueFrame}>
          <Image source={masteredPlaqueArt} style={styles.plaqueImage} resizeMode="contain" />
          <View pointerEvents="none" style={styles.masteredPlaqueContent}>
            <KingHeadline from="MASTERED" />
            <Text style={styles.plaqueWord} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{word}</Text>
            <View style={styles.plaqueCopyBlock}>
              <Text style={styles.plaqueCopy}>Not one of Polly's traps.</Text>
              <Text style={styles.plaqueCopy}>You saw through it.</Text>
            </View>
            <Text style={styles.plaqueBonus}>BOSS MASTERY +600</Text>
          </View>
        </View>
        <Animated.Text style={[styles.plaqueContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function BusterOverlay({ word, onContinue }: { word: string; onContinue: () => void }) {
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(0)).current;
  const maY = useRef(new Animated.Value(0)).current;
  const maOpacity = useRef(new Animated.Value(1)).current;
  const buY = useRef(new Animated.Value(-BUSTER_DROP_DISTANCE)).current;
  const buOpacity = useRef(new Animated.Value(0)).current;
  const continueOpacity = useRef(new Animated.Value(0.35)).current;
  const [canDismiss, setCanDismiss] = useState(false);

  function punch() {
    const feedback = resolveRematchLossFeedback();
    playSfx(feedback.sfx);
    Haptics.cueAsync(feedback.hapticCue);
  }

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduceMotion !== false) {
      opacity.setValue(1);
      maOpacity.setValue(0);
      buOpacity.setValue(1);
      buY.setValue(0);
      punch();
      timers.push(setTimeout(() => setCanDismiss(true), 1200));
      return () => timers.forEach(clearTimeout);
    }
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const dropAt = 180 + BUSTER_HOLD_MS;
    timers.push(setTimeout(() => {
      Animated.parallel([
        Animated.timing(maY, { toValue: BUSTER_DROP_DISTANCE, duration: BUSTER_DROP_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(maOpacity, { toValue: 0, duration: BUSTER_DROP_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, dropAt));
    timers.push(setTimeout(() => {
      Animated.parallel([
        Animated.timing(buOpacity, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(buY, { toValue: 0, duration: BUSTER_LAND_MS, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      ]).start();
    }, dropAt + BUSTER_LAND_DELAY_MS));
    timers.push(setTimeout(punch, dropAt + BUSTER_LAND_DELAY_MS + BUSTER_PUNCH_AT_MS));
    timers.push(setTimeout(() => setCanDismiss(true), 1800));
    return () => timers.forEach(clearTimeout);
  }, [buOpacity, buY, maOpacity, maY, opacity, reduceMotion]);

  useEffect(() => {
    if (!canDismiss) return;
    Animated.timing(continueOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [canDismiss, continueOpacity]);

  return (
    <Pressable style={styles.outcomeOverlay} onPress={() => canDismiss && onContinue()} accessibilityRole="button" accessibilityLabel={`Buster. ${word}. Continue.`}>
      <Animated.View style={[styles.outcomePanel, styles.busterOutcomePanel, { opacity }]}>
        <View style={styles.busterHeadlineRow}>
          <View style={styles.busterSlot}>
            <Animated.Text style={[styles.outcomeHeadline, { opacity: maOpacity, transform: [{ translateY: maY }] }]}>{BUSTER_WORD.dropped}</Animated.Text>
            <Animated.Text style={[styles.outcomeHeadline, styles.busterArriving, { opacity: buOpacity, transform: [{ translateY: buY }] }]}>{BUSTER_WORD.arriving}</Animated.Text>
          </View>
          <Text style={styles.outcomeHeadline}>{BUSTER_WORD.kept}</Text>
        </View>
        <Text style={styles.outcomeWord}>{word}</Text>
        <Animated.Text style={[styles.outcomeContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export default function DevRematchOutcomePreviewScreen({ navigation, route }: Props) {
  const kind: RematchOutcomeDevPreviewKind = route.params?.outcome === 'buster' ? 'buster' : 'king';
  const preview = buildRematchOutcomeDevPreview(kind);
  const reduceMotion = useReducedMotionPreference();
  const cover = useRef(new Animated.Value(kind === 'king' ? 1 : 0)).current;
  const intake = useRef(new Animated.Value(0)).current;
  const [bookVariant, setBookVariant] = useState<'neutral' | 'mastered'>('neutral');
  const [showOverlay, setShowOverlay] = useState(false);

  const coverRotateX = cover.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '58deg'] });
  const intakeScaleY = intake.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  useEffect(() => {
    if (kind === 'king') {
      const feedback = resolveBossOutcomeSequenceFeedback('mastered');
      playSfx(feedback.startSfx);
      if (reduceMotion === false) {
        cover.setValue(1);
        Animated.sequence([
          Animated.timing(cover, { toValue: 0.08, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(cover, { toValue: 0, duration: 230, easing: Easing.out(Easing.back(1.15)), useNativeDriver: true }),
        ]).start();
      } else {
        cover.setValue(0);
      }
      const swap = setTimeout(() => setBookVariant('mastered'), 70);
      const impact = setTimeout(() => {
        if (feedback.impact.sfx) playSfx(feedback.impact.sfx);
        Haptics.cueAsync(feedback.impact.hapticCue);
      }, feedback.impact.delayMs);
      const reveal = setTimeout(() => setShowOverlay(true), 1050);
      return () => { clearTimeout(swap); clearTimeout(impact); clearTimeout(reveal); };
    }

    cover.setValue(0);
    setBookVariant('neutral');
    const reveal = setTimeout(() => setShowOverlay(true), 950);
    return () => clearTimeout(reveal);
  }, [cover, kind, reduceMotion]);

  if (!__DEV__) return null;

  return (
    <View style={styles.screen}>
      <AmbientSkyBackground {...BOSS_SKY_TUNING} />
      <SafeAreaView style={styles.safe}>
        <Text style={styles.kicker}>MASTER'S REMATCH · 2×</Text>
        <View style={styles.bookStage} pointerEvents="none">
          <HeroBook coverRotateX={coverRotateX} intakeOpacity={intake} intakeScaleY={intakeScaleY} variant={bookVariant}>
            <Text style={styles.bookWord}>{preview.word}</Text>
          </HeroBook>
        </View>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close preview">
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </SafeAreaView>
      {showOverlay && (kind === 'king'
        ? <KingOverlay word={preview.word} onContinue={() => navigation.goBack()} />
        : <BusterOverlay word={preview.word} onContinue={() => navigation.goBack()} />)}
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
  bookWord: { color: PW.color.gold, fontFamily: FONTS.wordDisplay, includeFontPadding: false, fontSize: 54, textAlign: 'center' },
  closeButton: { position: 'absolute', right: 18, top: 8, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,13,42,0.82)', borderWidth: 1, borderColor: PW.color.purpleSoft },
  closeText: { color: PW.color.white, fontSize: 28, lineHeight: 30 },
  plaqueOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(15,13,42,0.42)' },
  plaqueColumn: { alignItems: 'center' },
  masteredPlaqueFrame: { width: 324, aspectRatio: MASTERED_PLAQUE_ASPECT, position: 'relative' },
  plaqueImage: { width: '100%', height: '100%' },
  masteredPlaqueContent: { position: 'absolute', left: '14%', right: '14%', top: '13%', bottom: '25%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plaqueHeadline: { color: PW.color.purple, fontFamily: FONTS.label, includeFontPadding: false, fontWeight: '900', fontSize: 33, textAlign: 'center' },
  kingArriving: { position: 'absolute', left: 0, right: 0, top: 0 },
  plaqueWord: { marginTop: 3, color: PW.color.purple, fontFamily: FONTS.wordDisplay, includeFontPadding: false, fontSize: 41, textAlign: 'center', maxWidth: '100%' },
  plaqueCopyBlock: { marginTop: 4, gap: 2 },
  plaqueCopy: { color: PW.color.bg, fontFamily: FONTS.label, includeFontPadding: false, fontSize: 14, textAlign: 'center' },
  plaqueBonus: { marginTop: 6, color: PW.color.bg, fontWeight: '800', fontFamily: FONTS.hud, includeFontPadding: false, fontSize: 20, letterSpacing: 0.5, textAlign: 'center' },
  plaqueContinue: { marginTop: 16, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.label, includeFontPadding: false, fontSize: FONT_SIZES.hudLabel, letterSpacing: 1, textAlign: 'center' },
  outcomeOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, backgroundColor: 'rgba(15,13,42,0.78)' },
  outcomePanel: { width: '100%', maxWidth: 360, minHeight: 300, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 26, overflow: 'hidden' },
  busterOutcomePanel: { borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(15,13,42,0.97)' },
  busterHeadlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  busterSlot: { alignItems: 'center', justifyContent: 'center' },
  busterArriving: { position: 'absolute', left: 0, right: 0, top: 0 },
  outcomeHeadline: { color: PW.color.white, fontFamily: FONTS.label, includeFontPadding: false, fontWeight: '900', fontSize: 38, textAlign: 'center' },
  outcomeWord: { marginTop: 8, color: PW.color.gold, fontFamily: FONTS.wordDisplay, includeFontPadding: false, fontSize: 54, textAlign: 'center', maxWidth: '100%' },
  outcomeContinue: { marginTop: 20, color: 'rgba(255,255,255,0.72)', fontFamily: FONTS.label, includeFontPadding: false, fontSize: FONT_SIZES.hudLabel, letterSpacing: 1, textAlign: 'center' },
});
