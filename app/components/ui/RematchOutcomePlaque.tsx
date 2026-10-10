import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';

import { FONTS, FONT_SIZES } from '../../constants/fonts';
import { resolveBossOutcomePlaqueFeedback, resolveRematchLossFeedback } from '../../game/huntOutcomeFeedback';
import { Haptics } from '../../utils/haptics';
import { playSfx } from '../../audio/sfx';
import { useReducedMotionPreference } from '../../hooks/usePollyAmbientMotion';
import { resolvePlaqueImagePhase, type BusterTransformPhase } from '../../ui/plaqueTextMaterial';
import PlaqueText from './PlaqueText';

const masteredPlaqueArt = require('../../../assets/images/results/mastered-result-plaque.png');
const kingPlaqueArt = require('../../../assets/images/results/king-result-plaque.png');
const busterPlaqueArt = require('../../../assets/images/results/buster-result-plaque.png');

const PLAQUE_ASPECT = 681 / 567;
const MASTER_HOLD_MS = 720;
const BUSTER_DROP_MS = 260;
const BUSTER_LAND_DELAY_MS = 110;
const BUSTER_LAND_MS = 230;
const BUSTER_DROP_DISTANCE = 46;

export type RematchOutcomeKind = 'king' | 'buster';

type Props = {
  word: string;
  kind: RematchOutcomeKind;
  onContinue: () => void;
};

export default function RematchOutcomePlaque({ word, kind, onContinue }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const maY = useRef(new Animated.Value(0)).current;
  const maOpacity = useRef(new Animated.Value(1)).current;
  const buY = useRef(new Animated.Value(-BUSTER_DROP_DISTANCE)).current;
  const buOpacity = useRef(new Animated.Value(0)).current;
  const continueOpacity = useRef(new Animated.Value(0.35)).current;
  const resolvedRef = useRef(false);
  const [canDismiss, setCanDismiss] = useState(false);
  const [phase, setPhase] = useState<BusterTransformPhase>('master');
  const [busterSplit, setBusterSplit] = useState(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function playIntroFeedback() {
    const feedback = resolveBossOutcomePlaqueFeedback('mastered');
    if (feedback.sfx) playSfx(feedback.sfx);
    if (feedback.hapticCue) Haptics.cueAsync(feedback.hapticCue);
  }

  function playBusterPunch() {
    const feedback = resolveRematchLossFeedback();
    playSfx(feedback.sfx);
    Haptics.cueAsync(feedback.hapticCue);
  }

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    playIntroFeedback();

    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      setPhase('final');
      if (kind === 'buster') playBusterPunch();
      setCanDismiss(true);
      continueOpacity.setValue(1);
      timers.push(setTimeout(resolve, 2800));
      return () => timers.forEach(clearTimeout);
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
        playBusterPunch();
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
    timers.push(setTimeout(resolve, 3600));

    return () => {
      timers.forEach(clearTimeout);
      opacity.stopAnimation();
      scale.stopAnimation();
      maY.stopAnimation();
      maOpacity.stopAnimation();
      buY.stopAnimation();
      buOpacity.stopAnimation();
      continueOpacity.stopAnimation();
    };
  }, [kind, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const imagePhase = resolvePlaqueImagePhase(phase);
  const finalArt = kind === 'king' ? kingPlaqueArt : busterPlaqueArt;
  const plaqueArt = imagePhase === 'master' ? masteredPlaqueArt : finalArt;
  const finalMaterial = kind === 'king' ? 'goldPlaque' : 'purplePlaque';
  const wordMaterial = phase === 'master' ? 'goldPlaque' : finalMaterial;

  return (
    <Pressable
      style={styles.plaqueOverlay}
      onPress={() => canDismiss && resolve()}
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

const styles = StyleSheet.create({
  plaqueOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15,13,42,0.42)',
  },
  plaqueColumn: {
    alignItems: 'center',
    marginTop: 36,
  },
  plaqueFrame: {
    width: 324,
    aspectRatio: PLAQUE_ASPECT,
    position: 'relative',
  },
  plaqueImage: {
    width: '100%',
    height: '100%',
  },
  masterLabel: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '28%',
  },
  masterWord: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: '56%',
  },
  kingWord: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: '58%',
  },
  busterWord: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: '58%',
  },
  busterHeadlineRow: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: '28%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  busterPrefix: { width: 48 },
  busterSuffix: { width: 79 },
  plaqueContinue: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.hudLabel,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
