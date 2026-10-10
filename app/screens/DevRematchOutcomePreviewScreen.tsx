import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import HeroBook from '../components/ui/HeroBook';
import PlaqueText from '../components/ui/PlaqueText';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { buildRematchOutcomeDevPreview, type RematchOutcomeDevPreviewKind } from '../game/rematchOutcomeDevPreview';
import { resolveBossOutcomePlaqueFeedback, resolveRematchLossFeedback } from '../game/huntOutcomeFeedback';
import { playSfx } from '../audio/sfx';
import { Haptics } from '../utils/haptics';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { BOSS_SKY_TUNING } from '../ui/ambientSkyTuning';
import { PW } from '../ui/pwTheme';
import { resolvePlaqueImagePhase, type BusterTransformPhase } from '../ui/plaqueTextMaterial';

const masteredPlaqueArt = require('../../assets/images/results/mastered-result-plaque.png');
const kingPlaqueArt = require('../../assets/images/results/king-result-plaque.png');
const busterPlaqueArt = require('../../assets/images/results/buster-result-plaque.png');
const PLAQUE_ASPECT = 681 / 567;

const MASTER_HOLD_MS = 720;
const BUSTER_DROP_MS = 260;
const BUSTER_LAND_DELAY_MS = 110;
const BUSTER_LAND_MS = 230;
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
  const maY = useRef(new Animated.Value(0)).current;
  const maOpacity = useRef(new Animated.Value(1)).current;
  const buY = useRef(new Animated.Value(-BUSTER_DROP_DISTANCE)).current;
  const buOpacity = useRef(new Animated.Value(0)).current;
  const continueOpacity = useRef(new Animated.Value(0.35)).current;
  const [canDismiss, setCanDismiss] = useState(false);
  const [phase, setPhase] = useState<BusterTransformPhase>('master');
  const [busterSplit, setBusterSplit] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const feedback = resolveBossOutcomePlaqueFeedback('mastered');
    playSfx(feedback.sfx);
    if (feedback.hapticCue) Haptics.cueAsync(feedback.hapticCue);

    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      setPhase('final');
      setCanDismiss(true);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 150, useNativeDriver: true }),
    ]).start();

    if (kind === 'king') {
      timers.push(setTimeout(() => setPhase('final'), MASTER_HOLD_MS));
    } else {
      timers.push(setTimeout(() => {
        setBusterSplit(true);
        Animated.parallel([
          Animated.timing(maY, {
            toValue: BUSTER_DROP_DISTANCE,
            duration: BUSTER_DROP_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(maOpacity, {
            toValue: 0,
            duration: BUSTER_DROP_MS,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      }, MASTER_HOLD_MS));

      timers.push(setTimeout(() => {
        setPhase('swap');
        Animated.parallel([
          Animated.timing(buOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(buY, {
            toValue: 0,
            duration: BUSTER_LAND_MS,
            easing: Easing.out(Easing.back(1.35)),
            useNativeDriver: true,
          }),
        ]).start();
        const punch = resolveRematchLossFeedback();
        playSfx(punch.sfx);
        Haptics.cueAsync(punch.hapticCue);
      }, MASTER_HOLD_MS + BUSTER_DROP_MS + BUSTER_LAND_DELAY_MS));

      timers.push(setTimeout(() => {
        setPhase('final');
        setBusterSplit(false);
      }, MASTER_HOLD_MS + BUSTER_DROP_MS + BUSTER_LAND_DELAY_MS + BUSTER_LAND_MS + 80));
    }

    timers.push(setTimeout(() => {
      setCanDismiss(true);
      Animated.timing(continueOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, 1650));

    return () => timers.forEach(clearTimeout);
  }, [buOpacity, buY, continueOpacity, kind, maOpacity, maY, opacity, reduceMotion, scale]);

  const imagePhase = resolvePlaqueImagePhase(phase);
  const plaqueArt = imagePhase === 'master' ? masteredPlaqueArt : finalArt;
  const finalMaterial = kind === 'king' ? 'goldPlaque' : 'purplePlaque';
  const wordMaterial = phase === 'master' ? 'goldPlaque' : finalMaterial;

  return (
    <Pressable
      style={styles.plaqueOverlay}
      onPress={() => canDismiss && onContinue()}
      accessibilityRole="button"
      accessibilityLabel={`${kind === 'king' ? 'King' : 'Buster'}. ${word}. Continue.`}
    >
      <Animated.View style={[styles.plaqueColumn, { opacity, transform: [{ scale }] }]}>
        <View style={styles.plaqueFrame}>
          <Image source={plaqueArt} style={styles.plaqueImage} resizeMode="contain" />

          {kind === 'king' ? (
            <>
              {phase === 'master' && (
                <PlaqueText
                  text="MASTER"
                  material="goldPlaque"
                  fontSize={36}
                  fontFamily={FONTS.label}
                  containerStyle={styles.masterLabel}
                />
              )}
              <PlaqueText
                text={word}
                material={wordMaterial}
                fontSize={42}
                containerStyle={phase === 'master' ? styles.masterWord : styles.kingWord}
              />
            </>
          ) : (
            <>
              {phase === 'master' && !busterSplit && (
                <PlaqueText
                  text="MASTER"
                  material="goldPlaque"
                  fontSize={36}
                  fontFamily={FONTS.label}
                  containerStyle={styles.masterLabel}
                />
              )}

              {busterSplit && phase === 'master' && (
                <View style={styles.busterHeadlineRow}>
                  <Animated.View style={{ opacity: maOpacity, transform: [{ translateY: maY }] }}>
                    <PlaqueText text="MA" material="goldPlaque" fontSize={36} fontFamily={FONTS.label} containerStyle={styles.busterPrefix} />
                  </Animated.View>
                  <PlaqueText text="STER" material="goldPlaque" fontSize={36} fontFamily={FONTS.label} containerStyle={styles.busterSuffix} />
                </View>
              )}

              {phase === 'swap' && (
                <View style={styles.busterHeadlineRow}>
                  <Animated.View style={{ opacity: buOpacity, transform: [{ translateY: buY }] }}>
                    <PlaqueText text="BU" material="purplePlaque" fontSize={36} fontFamily={FONTS.label} containerStyle={styles.busterPrefix} />
                  </Animated.View>
                  <PlaqueText text="STER" material="purplePlaque" fontSize={36} fontFamily={FONTS.label} containerStyle={styles.busterSuffix} />
                </View>
              )}

              {phase === 'final' && (
                <PlaqueText
                  text="BUSTER"
                  material="purplePlaque"
                  fontSize={36}
                  fontFamily={FONTS.label}
                  containerStyle={styles.masterLabel}
                />
              )}

              <PlaqueText
                text={word}
                material={wordMaterial}
                fontSize={42}
                containerStyle={phase === 'master' ? styles.masterWord : styles.busterWord}
              />
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
  masterLabel: { position: 'absolute', left: '12%', right: '12%', top: '28%' },
  masterWord: { position: 'absolute', left: '15%', right: '15%', top: '56%' },
  kingWord: { position: 'absolute', left: '15%', right: '15%', top: '58%' },
  busterWord: { position: 'absolute', left: '15%', right: '15%', top: '58%' },
  busterHeadlineRow: { position: 'absolute', left: '14%', right: '14%', top: '28%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  busterPrefix: { width: 48 },
  busterSuffix: { width: 79 },
  plaqueContinue: { marginTop: 16, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.label, includeFontPadding: false, fontSize: FONT_SIZES.hudLabel, letterSpacing: 1, textAlign: 'center' },
});
