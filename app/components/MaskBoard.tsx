import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FONTS, FONT_SIZES } from '../constants/fonts';
import * as Haptics from 'expo-haptics';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';
import HeroBook from './ui/HeroBook';
import { FoilWord } from './ui/FoilWord';
import type { PollyEvent } from '../game/pollyVisitPolicy';
import { playRoundComplete } from '../utils/SoundEngine';
import { playSfx } from '../audio/sfx';
import { PW } from '../ui/pwTheme';
import { deckBackMaterial } from '../ui/pwMaterials';
import { useHeartbeat } from '../hooks/useHeartbeat';
import MasterySeal from './MasterySeal';
import { useBoardMechanics } from '../hooks/useBoardMechanics';
import type { ChainTier } from '../hooks/useBoardMechanics';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 6;
const TILE_H     = 152;
const FINAL_TILE_H = 72;
const FINAL_TILE_GAP = 10;
const FINAL_TILE_RELEASE_OFFSET_Y = 190;
const TILE_INSET = 16;
const MAX_DECK_BACKING_CARDS = 4;
const DECK_BACKING_OFFSET = 9;
const DECK_BACKING_COLORS = [
  '#2A2352',
  '#231D48',
  '#1C173E',
  '#161234',
] as const;
const DECK_BACKING_BORDER_COLORS = [
  'rgba(245,200,66,0.45)',
  'rgba(198,130,95,0.34)',
  'rgba(158,62,104,0.26)',
  'rgba(124,52,96,0.18)',
] as const;

const SCREEN_WIDTH = Dimensions.get('window').width;

type FloatKind = 'real' | 'trap' | 'mastery';
type FloatEntry = {
  id: number;
  value: number;
  x: number;
  y: number;
  color: string;
  kind: FloatKind;
  tier?: ChainTier;
};

const CHAIN_TIER_SFX_RATE: Record<ChainTier, number> = { 1: 1.0, 2: 1.08, 3: 1.16 };
const CHAIN_TIER_FONT_SIZE: Record<ChainTier, number> = { 1: 26, 2: 28, 3: 31 };
const CHAIN_TIER_GLOW_RADIUS: Record<ChainTier, number> = { 1: 2, 2: 5, 3: 9 };

type SwipeScoreFloatProps = {
  value: number;
  color: string;
  kind: Exclude<FloatKind, 'mastery'>;
  tier: ChainTier;
  onComplete: () => void;
};

function SwipeScoreFloat({
  value,
  color,
  kind,
  tier,
  onComplete,
}: SwipeScoreFloatProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 940,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onComplete();
    });
    return () => animation.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const opacity = progress.interpolate({
    inputRange: [0, 0.62, 0.82, 1],
    outputRange: [1, 1, 0.92, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.18, 0.42, 1],
    outputRange: [1.2, 1.08, 1, 1],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, kind === 'trap' ? 8 : 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, kind === 'trap' ? -44 : -48],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        ...(kind === 'trap'
          ? { right: 24, top: -18 }
          : { alignSelf: 'center', top: -34 }),
        minWidth: 64,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'rgba(15,13,42,0.92)',
        borderWidth: 1,
        borderColor: color,
        zIndex: PW.z.overlay,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Text
        style={{
          color,
          fontFamily: FONTS.hud,
          fontSize: CHAIN_TIER_FONT_SIZE[tier],
          lineHeight: CHAIN_TIER_FONT_SIZE[tier] + 3,
          textShadowColor: tier > 1 ? color : PW.color.shadow,
          textShadowOffset: { width: 0, height: tier > 1 ? 0 : 1 },
          textShadowRadius: CHAIN_TIER_GLOW_RADIUS[tier],
        }}
      >
        +{value}
      </Text>
    </Animated.View>
  );
}

export type Props = {
  step: WordStep;
  spawnEffect?: (type: 'shard' | 'trail', x: number, y: number, variant?: string) => void;
  onTrapCaught?: () => void;
  onWrongSwipe?: () => void;
  onSwipeAttempt?: () => void;
  // Owned by GameContent — the visit layer must outlive this board's
  // per-word remount (key={stepIndex}), or word-completion beats die mid-arc.
  firePollyEvent: (event: PollyEvent) => void;
};

type BoardPresenterProps = Props & {
  // Inert for now — drives nothing. Reserved for the boss theater work that
  // follows this step; BossBoard passes true, MaskBoard passes false.
  isBossStage: boolean;
};

type ResolvedTileState = 'correct' | 'trap-caught' | 'wrong';

type OutcomeOverlayProps = {
  word: string;
  headline?: string;
  bonusLabel?: string;
  detail?: string;
  onContinue: () => void;
};

function MasteredOutcomeOverlay({ word, headline = 'MASTERED', bonusLabel, onContinue }: OutcomeOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const resolvedRef = useRef(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 160, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    const auto = setTimeout(resolve, 2800);
    return () => clearTimeout(auto);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.62] });

  return (
    <Pressable style={styles.outcomeOverlay} onPress={handlePress}>
      <Animated.View style={[styles.outcomePanel, styles.masteredOutcomePanel, { opacity, transform: [{ scale }] }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.masteredPulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
        />
        <Text style={[styles.outcomeHeadline, styles.masteredOutcomeHeadline]}>{headline}</Text>
        <Text style={styles.outcomeWord} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.64}>
          {word}
        </Text>
        <View style={styles.outcomeCopyBlock}>
          <Text style={styles.outcomeCopy}>Not one of Polly's traps.</Text>
          <Text style={styles.outcomeCopy}>You saw through it.</Text>
        </View>
        {bonusLabel && <Text style={styles.outcomeBonus}>{bonusLabel}</Text>}
        <Text style={styles.outcomeContinue}>CONTINUE</Text>
      </Animated.View>
    </Pressable>
  );
}

function HauntedOutcomeOverlay({ word, detail, onContinue }: OutcomeOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const resolvedRef = useRef(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 9, stiffness: 120, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    const auto = setTimeout(resolve, 3200);
    return () => clearTimeout(auto);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hazeY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const hazeOpacity = drift.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.48] });

  return (
    <Pressable style={styles.outcomeOverlay} onPress={handlePress}>
      <Animated.View style={[styles.outcomePanel, styles.hauntedOutcomePanel, { opacity, transform: [{ scale }] }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.hauntedHaze, { opacity: hazeOpacity, transform: [{ translateY: hazeY }] }]}
        />
        <Text style={[styles.outcomeHeadline, styles.hauntedOutcomeHeadline]}>HAUNTED</Text>
        <Text style={styles.outcomeWord} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.64}>
          {word}
        </Text>
        <View style={styles.outcomeCopyBlock}>
          <Text style={styles.outcomeCopy}>Polly's trap held.</Text>
          <Text style={styles.outcomeCopy}>It'll be waiting.</Text>
        </View>
        {detail && <Text style={styles.hauntedDetail} numberOfLines={2}>{detail}</Text>}
        <Text style={styles.outcomeContinue}>CONTINUE</Text>
      </Animated.View>
    </Pressable>
  );
}

function getResolvedTileState(state: SwipeMaskState | undefined): ResolvedTileState | null {
  if (state === 'correct' || state === 'trap-caught' || state === 'wrong') {
    return state;
  }
  return null;
}

function BoardPresenter({ step, spawnEffect, onTrapCaught, onWrongSwipe, onSwipeAttempt, firePollyEvent, isBossStage }: BoardPresenterProps) {
  void isBossStage; // inert this step — no visual or timing effect yet
  const store   = useGameStore();
  const { pulseAnim, tension } = useHeartbeat();
  const tileBreatheAmount = useRef(new Animated.Value(0)).current;
  const isBoss  = step.eventType === 'bossWord';
  const isHaunt = step.isHauntReturn === true;

  // ── layout ───────────────────────────────────────────────────
  const [containerWidth, setContainerWidth] = useState(350);
  const containerWidthRef                   = useRef(350);
  const containerRef  = useRef<View>(null);
  const wordZoneRef   = useRef<View>(null);
  const [wordScreenY, setWordScreenY] = useState(180);

  const prevTopIdRef = useRef<string | null>(null);
  const cardPopCountRef = useRef(0);

  // Deck entrance animation (native: translateY / transform only)
  const deckSlamY    = useRef(new Animated.Value(-52)).current;
  // Zero-feather red tint on depth cards (non-native: backgroundColor)
  const deckRedTint  = useRef(new Animated.Value(0)).current;
  // Per-card deal-in (native: translateY / rotate / opacity)
  const deckDeepY    = useRef(new Animated.Value(400)).current;
  const deckMidY     = useRef(new Animated.Value(400)).current;
  const deckActiveY  = useRef(new Animated.Value(400)).current;
  const deckBackingY = useRef(new Animated.Value(28)).current;
  const deckBackingOp = useRef(new Animated.Value(0)).current;
  const deckEntranceHapticRef = useRef<string | null>(null);
  const deckDeepRot  = useRef(new Animated.Value(-4)).current;
  const deckMidRot   = useRef(new Animated.Value(3)).current;
  const deckActiveRot= useRef(new Animated.Value(-2)).current;
  const deckDeepOp   = useRef(new Animated.Value(0)).current;
  const deckMidOp    = useRef(new Animated.Value(0)).current;
  const deckActiveOp = useRef(new Animated.Value(0)).current;
  const cardPopY     = useRef(new Animated.Value(0)).current;

  // ── word absorption ──────────────────────────────────────────
  const absorptionScale       = useRef(new Animated.Value(1)).current;
  const ringScale             = useRef(new Animated.Value(1)).current;
  const ringOpacity           = useRef(new Animated.Value(0)).current;
  const wordEntryOpacity      = useRef(new Animated.Value(0)).current;
  const wordEntryScale        = useRef(new Animated.Value(0.85)).current;
  const wordEntryTranslateY   = useRef(new Animated.Value(0)).current;
  const wordEntryTilt         = useRef(new Animated.Value(0)).current;
  const wordLockPulse         = useRef(new Animated.Value(1)).current;
  const bookOpenAnim          = useRef(new Animated.Value(0)).current;  // useNativeDriver: true
  const bookIntakeGlowAnim    = useRef(new Animated.Value(0)).current;  // useNativeDriver: true
  const bookSlideX            = useRef(new Animated.Value(SCREEN_WIDTH)).current; // book entrance/exit slide, native driver
  const boardShakeX           = useRef(new Animated.Value(0)).current; // boss entrance / haunted micro-shake, native driver
  const wordEntranceHapticRef = useRef<string | null>(null);

  function triggerBoardShake() {
    boardShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(boardShakeX, { toValue: -4, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 4,  duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: -2, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 0,  duration: 35, useNativeDriver: true }),
    ]).start();
  }
  const transitionLabelOpacity = useRef(new Animated.Value(0)).current;
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
  const goldTextOpacity       = useRef(new Animated.Value(0)).current;
  const [absorbedPhrase, setAbsorbedPhrase] = useState<string | null>(null);

  // ── wrong-swipe word recoil ───────────────────────────────────
  const wordRecoilY     = useRef(new Animated.Value(0)).current;  // useNativeDriver:false
  const wordRecoilScale = useRef(new Animated.Value(1)).current;  // useNativeDriver:false
  const wordRedOpacity  = useRef(new Animated.Value(0)).current;  // useNativeDriver:false
  const cueOpacityAnim = useRef(new Animated.Value(1)).current;
  const recoilRafRef    = useRef<number | null>(null);

  function triggerWrongWordRecoil() {
    if (recoilRafRef.current !== null) {
      cancelAnimationFrame(recoilRafRef.current);
    }
    let t0: number | null = null;

    function tick(now: number) {
      if (t0 === null) t0 = now;
      const p = Math.min((now - t0) / 380, 1);
      const y        = -Math.sin(p * Math.PI) * 9 * (1 - p * 0.2);
      const red      = p < 0.22
        ? p / 0.22
        : Math.max(0, Math.min(1, 1 - (p - 0.22) / 0.6));
      const scaleVal = 1 + Math.sin(p * Math.PI) * 0.04;

      wordRecoilY.setValue(y);
      wordRecoilScale.setValue(scaleVal);
      wordRedOpacity.setValue(red * 0.4);

      if (p < 1) {
        recoilRafRef.current = requestAnimationFrame(tick);
      } else {
        wordRecoilY.setValue(0);
        wordRecoilScale.setValue(1);
        wordRedOpacity.setValue(0);
        recoilRafRef.current = null;
      }
    }

    recoilRafRef.current = requestAnimationFrame(tick);
  }

  // Face half of the old triggerWrongSwipeFeedback — shared by normal-tile
  // and gauntlet-tile wrong swipes, same as the original single function was.
  function performWrongSwipeFeedback(brokeRealChain: boolean) {
    playSfx('wrongLame');
    playSfx('pollySqwawkShort');
    if (brokeRealChain) {
      playSfx('correctClaim', { rate: 0.55 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    triggerWrongWordRecoil();
    onWrongSwipe?.();
  }

  // ── boss entrance ─────────────────────────────────────────────
  function triggerBookOpen() {
    bookOpenAnim.stopAnimation();
    bookIntakeGlowAnim.stopAnimation();
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(bookOpenAnim, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(bookOpenAnim, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bookIntakeGlowAnim, {
          toValue: 0.9,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(bookIntakeGlowAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function triggerAbsorption(phrase: string) {
    absorptionScale.setValue(1);
    Animated.sequence([
      Animated.timing(absorptionScale, { toValue: 1.12, duration: 120, useNativeDriver: true }),
      Animated.timing(absorptionScale, { toValue: 1.0,  duration: 180, useNativeDriver: true }),
    ]).start();

    ringScale.setValue(0.6);
    ringOpacity.setValue(0.85);
    Animated.parallel([
      Animated.timing(ringScale,   { toValue: 2.2, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0,   duration: 380, useNativeDriver: true }),
    ]).start();

    setAbsorbedPhrase(phrase);
    absorbedPhraseOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(absorbedPhraseOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setAbsorbedPhrase(null));
  }

  function handleCardTouch() {
    triggerBookOpen();
  }

  const [bossReady, setBossReady]             = useState(!isBoss);
  const [tilesReady, setTilesReady]           = useState(false);

  // ── haunt entrance ────────────────────────────────────────────
  const [hauntReady, setHauntReady]           = useState(!isHaunt);
  const [hauntBannerVisible, setHauntBannerVisible] = useState(false);
  const [stillHauntedVisible, setStillHauntedVisible] = useState(false);
  const wordHauntTintOpacity = useRef(new Animated.Value(0)).current;
  const hauntBannerOpacity   = useRef(new Animated.Value(0)).current;
  const stillHauntedOpacity  = useRef(new Animated.Value(0)).current;
  const stillHauntedScale    = useRef(new Animated.Value(0.7)).current;
  const hauntEntranceStingKeyRef = useRef<string | null>(null);

  const tileRefs = useRef(new Map<string, React.RefObject<View | null>>());

  function getTileRef(maskId: string): React.Ref<View> {
    if (!tileRefs.current.has(maskId)) {
      tileRefs.current.set(maskId, React.createRef<View | null>());
    }
    return tileRefs.current.get(maskId) as React.Ref<View>;
  }

  // ── word transition label ────────────────────────────────────
  const [transitionLabel, setTransitionLabel] = useState<string | null>(null);

  // ── score floats ─────────────────────────────────────────────
  const [floats, setFloats] = useState<FloatEntry[]>([]);
  const floatIdRef          = useRef(0);

  function spawnFloat(value: number, kind: Exclude<FloatKind, 'mastery'>, tier: ChainTier = 1) {
    const color = kind === 'real' ? PW.color.gold : '#9B2D6B';
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, value, color, kind, tier, x: 0, y: 0 }]);
  }

  function spawnFloatAtSplit(value: number, color = '#F5C842') {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, {
      id,
      value,
      color,
      kind: 'mastery',
      x: containerWidth / 2,
      y: 300,
    }]);
  }

  function handleEffect(type: 'shard' | 'trail', pageX: number, pageY: number) {
    if (type === 'shard') {
      spawnEffect?.('shard', pageX, pageY, 'trap');
    } else {
      spawnEffect?.(type, pageX, pageY);
    }
  }

  // ── master gate (face-only) ─────────────────────────────────────
  // Final tile drop (native: transform only)
  const splitTile1TransY  = useRef(new Animated.Value(FINAL_TILE_RELEASE_OFFSET_Y)).current;

  // Final tile border pulse (non-native)
  const finalBorder1Anim = useRef(new Animated.Value(0)).current;

  // Mastered celebration
  const masterHeroScale      = useRef(new Animated.Value(1)).current;
  const masterHeroTransY     = useRef(new Animated.Value(0)).current;
  const masterAllFadeAnim    = useRef(new Animated.Value(1)).current;
  // Phase-based mastery sequence
  const goldSeedScale        = useRef(new Animated.Value(0)).current;
  const goldSeedTransY       = useRef(new Animated.Value(0)).current;
  const goldSeedTransX       = useRef(new Animated.Value(0)).current;
  const goldSeedRotate       = useRef(new Animated.Value(0)).current;
  const goldSeedTrailOpacity = useRef(new Animated.Value(0)).current;
  const goldBloomScale       = useRef(new Animated.Value(1)).current;
  const goldBloomOpacity     = useRef(new Animated.Value(0)).current;
  const masterCrackOpacity   = useRef(new Animated.Value(0)).current;
  const masterCoreOpacity    = useRef(new Animated.Value(0)).current;
  const systemStingerOpacity = useRef(new Animated.Value(0)).current;
  const systemStingerScale   = useRef(new Animated.Value(0.75)).current;
  const [masterStampVisible, setMasterStampVisible]   = useState(false);
  const [sealReady, setSealReady]                       = useState(false);
  const [goldSeedVisible, setGoldSeedVisible]           = useState(false);
  const [goldBloomVisible, setGoldBloomVisible]         = useState(false);
  const [masterCracksVisible, setMasterCracksVisible]   = useState(false);
  const [systemStingerWord, setSystemStingerWord]       = useState<string | null>(null);

  const showBoardContent = (!isBoss || bossReady) && tilesReady && (!isHaunt || hauntReady);

  // Swipe cues fade permanently after round 3
  useEffect(() => {
    if (store.game.stepIndex >= 3) {
      Animated.timing(cueOpacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [store.game.stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Animated.timing(tileBreatheAmount, {
      toValue: tension === 3 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [tension]); // eslint-disable-line react-hooks/exhaustive-deps

  function playSystemStingerWord(word: string, peakScale: number) {
    setSystemStingerWord(word);
    systemStingerOpacity.setValue(0);
    systemStingerScale.setValue(0.75);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(systemStingerOpacity, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.spring(systemStingerScale, { toValue: peakScale, damping: 5, stiffness: 320, useNativeDriver: true }),
      ]),
      Animated.timing(systemStingerOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // ── mechanics (brain) ───────────────────────────────────────────
  // Every perform.* callback below is the FACE half of a function that used
  // to live directly in this component — see useBoardMechanics.ts for the
  // BRAIN half and how the two are stitched back together.
  const mechanics = useBoardMechanics({
    step,
    firePollyEvent,
    perform: {
      onRealClaimed({ mask, tier, points, nextFound }) {
        playSfx('correctClaim', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (tier === 3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        spawnFloat(points, 'real', tier);
        triggerAbsorption(mask.phrase);
        Animated.timing(goldTextOpacity, {
          toValue: GOLD_STEPS_LOCAL[Math.min(nextFound, GOLD_STEPS_LOCAL.length - 1)],
          duration: 400,
          useNativeDriver: true,
        }).start();
      },
      onTrapRejected({ tier, points }) {
        playSfx('trapShatter', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (tier === 3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        spawnFloat(points, 'trap', tier);
        onTrapCaught?.();
      },
      onWrongSwipe({ brokeRealChain }) {
        performWrongSwipeFeedback(brokeRealChain);
      },
      onGauntletCorrect({ swipedUp, phrase }) {
        playSfx(swipedUp ? 'correctClaim' : 'trapShatter');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (swipedUp) triggerAbsorption(phrase);
      },
      onGauntletTileDrop() {
        splitTile1TransY.setValue(FINAL_TILE_RELEASE_OFFSET_Y);
        finalBorder1Anim.setValue(0);
        Animated.spring(splitTile1TransY, {
          toValue: 0, damping: 13, stiffness: 150, useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return;
          mechanics.onGauntletTileLanded();
          Animated.sequence([
            Animated.timing(finalBorder1Anim, { toValue: 0.55, duration: 120, useNativeDriver: false }),
            Animated.timing(finalBorder1Anim, { toValue: 1.0, duration: 220, useNativeDriver: false }),
          ]).start();
        });
      },
      onGauntletBegin() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      },
      onWordExit(perfect) {
        if (perfect) {
          setTransitionLabel('CLEAR');
          transitionLabelOpacity.setValue(0);
          Animated.timing(transitionLabelOpacity, {
            toValue: 1, duration: 80, useNativeDriver: true,
          }).start();
        }
        playSfx('bookClose');
        Animated.timing(bookSlideX, {
          toValue: -SCREEN_WIDTH,
          duration: isBoss ? 380 : 280,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          setTransitionLabel(null);
          transitionLabelOpacity.setValue(0);
        }, 290);
      },
      onMasteredSequence({ isBoss: bossOutcome, isHaunt: hauntOutcome, masteryPoints }) {
        if (!hauntOutcome) {
          spawnFloatAtSplit(masteryPoints, '#F5C842');
        }
        setMasterStampVisible(true);
        setMasterCracksVisible(false);
        setGoldSeedVisible(false);
        setGoldBloomVisible(false);
        setSystemStingerWord(null);

        const screenH = Dimensions.get('window').height;
        const crashDistance = Math.max(150, screenH * 0.48 - wordScreenY);
        const vaultTargetX = Math.max(120, containerWidthRef.current / 2 - 34);
        const vaultTargetY = Math.max(250, screenH * 0.42);

        // Phase 1 — T+0ms: Screen dims — tiles to 15% opacity
        Animated.timing(masterAllFadeAnim, {
          toValue: 0.15, duration: 300, useNativeDriver: false,
        }).start();
        Animated.spring(masterHeroTransY, {
          toValue: crashDistance, damping: 8, stiffness: 170, mass: 0.8, useNativeDriver: true,
        }).start();
        Animated.sequence([
          Animated.timing(masterHeroScale, { toValue: 1.22, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(masterHeroScale, { toValue: 1.0, damping: 8, stiffness: 190, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Phase 2 — T+500ms: Word pulse
        setTimeout(() => setSealReady(true), 360);

        // Phase 3 — T+800ms: MASTERED label appears below word
        setTimeout(() => {
          setMasterCracksVisible(true);
          masterCrackOpacity.setValue(0);
          Animated.timing(masterCrackOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
        }, 800);

        // Fade label before word swells — NEVER simultaneous
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(masterHeroScale, { toValue: 1.08, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(masterHeroScale, { toValue: 0.96, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]).start();
        }, 1000);

        // Phase 4 — T+1050ms: Word swells 1.0→1.6
        setTimeout(() => {
          Animated.timing(masterHeroScale, {
            toValue: 1.0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true,
          }).start();
        }, 1050);

        // Phase 6 — T+1900ms: Gold seed appears at word center
        setTimeout(() => {
          setGoldSeedVisible(true);
          masterCoreOpacity.setValue(1);
          goldSeedScale.setValue(0.15);
          goldSeedTransX.setValue(0);
          goldSeedTransY.setValue(0);
          goldSeedRotate.setValue(0);
          goldSeedTrailOpacity.setValue(0);
          Animated.parallel([
            Animated.spring(goldSeedScale, { toValue: 2.6, damping: 7, stiffness: 150, useNativeDriver: true }),
            Animated.timing(goldSeedRotate, { toValue: 1, duration: 820, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(goldSeedTrailOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          ]).start();
        }, 1900);

        // Seed settles
        setTimeout(() => {
          Animated.spring(goldSeedScale, { toValue: 2.15, damping: 8, stiffness: 220, useNativeDriver: true }).start();
        }, 2000);

        // Phase 7 — T+2100ms: Seed drops to screen bottom
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(goldSeedTransX, {
              toValue: vaultTargetX, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(goldSeedTransY, {
              toValue: vaultTargetY, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(goldSeedScale, {
              toValue: 0.62, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(masterCoreOpacity, { toValue: 0.95, duration: 620, useNativeDriver: true }),
          ]).start();
        }, 2100);

        // Phase 8 — T+2400ms: Seed landing bloom
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setGoldSeedVisible(false);
          setGoldBloomVisible(true);
          goldBloomScale.setValue(1);
          goldBloomOpacity.setValue(1);
          Animated.parallel([
            Animated.timing(goldBloomScale, { toValue: 3.5, duration: 300, useNativeDriver: true }),
            Animated.timing(goldBloomOpacity, { toValue: 0,   duration: 300, useNativeDriver: true }),
          ]).start();
          setTimeout(() => setGoldBloomVisible(false), 350);
        }, 2400);

        setTimeout(() => {
          if (bossOutcome) {
            playSystemStingerWord('BINGO', 1.0);
            setTimeout(() => playSystemStingerWord('BANGO', 1.08), 430);
            setTimeout(() => playSystemStingerWord('ZZZZINGO!', 1.28), 900);
          }
        }, 2600);

        // Restore dim before transition
        setTimeout(() => {
          Animated.timing(masterCrackOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          Animated.timing(masterAllFadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
        }, bossOutcome ? 4050 : 3200);

        // Phase 10 — T+3000ms: presentation cleanup (the outcome reveal
        // itself fires from useBoardMechanics on a matching timer)
        setTimeout(() => {
          setMasterCracksVisible(false);
          setSystemStingerWord(null);
        }, bossOutcome ? 4300 : 3450);
      },
      onHauntedSequence({ isHaunt: hauntFail, failedMaskId }) {
        if (!hauntFail) return;
        void failedMaskId;
        setTimeout(() => {
          setStillHauntedVisible(true);
          stillHauntedOpacity.setValue(0);
          stillHauntedScale.setValue(0.7);
          Animated.parallel([
            Animated.timing(stillHauntedOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
            Animated.spring(stillHauntedScale, { toValue: 1.0, damping: 7, stiffness: 280, useNativeDriver: true }),
          ]).start();
          setTimeout(() => {
            Animated.timing(stillHauntedOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
            setTimeout(() => setStillHauntedVisible(false), 240);
          }, 1400);
        }, 400);
      },
      onOutcomeReveal(outcome) {
        playSfx(outcome === 'mastered' ? 'mastered' : 'haunted');
        if (outcome === 'haunted') triggerBoardShake();
      },
      onLivesDepleted() {
        Animated.timing(deckRedTint, {
          toValue: 1, duration: 300, useNativeDriver: false,
        }).start();
      },
    },
  });
  const GOLD_STEPS_LOCAL = [0, 0.25, 0.55, 0.80, 1.0] as const;

  useEffect(() => {
    if (mechanics.visibleGridMasks.length > 0) {
      const id = setTimeout(() => setTilesReady(true), 50);
      return () => clearTimeout(id);
    }
  }, [mechanics.visibleGridMasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const newTopId = mechanics.remainingMaskIds[0] ?? null;
    if (newTopId && newTopId !== prevTopIdRef.current) {
      prevTopIdRef.current = newTopId;
      cardPopCountRef.current += 1;
      if (cardPopCountRef.current > 1) {
        cardPopY.setValue(18);
        Animated.spring(cardPopY, {
          toValue: 0,
          damping: 14,
          stiffness: 220,
          useNativeDriver: true,
        }).start(() => {
          Haptics.selectionAsync();
        });
      }
    }
  }, [mechanics.remainingMaskIds]);

  const backingCardCount = mechanics.topMask
    ? Math.min(MAX_DECK_BACKING_CARDS, Math.max(0, mechanics.deckSize - 1))
    : 0;
  const backingCardWidth = Math.min(Math.max(containerWidth - 80, 0), 290);

  useEffect(() => {
    if (showBoardContent) mechanics.onBoardContentReady();
  }, [showBoardContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polly reactive triggers not tied to a presentation animation move to
  // useBoardMechanics; oneWrongMove stays wired here only through
  // perform.onLivesDepleted above, so the deck's red-tint reaction and its
  // Polly event share one trigger condition.

  // Reset guards and animated values on new word
  useEffect(() => {
    cardPopY.setValue(0);
    prevTopIdRef.current = null;
    cardPopCountRef.current = 0;
    deckRedTint.setValue(0);
    deckSlamY.setValue(0);  // outer wrapper stays static
    const CARD_DEAL = Easing.bezier(0.18, 1.04, 0.26, 1.00);
    const CARD_SNAP = Easing.bezier(0.16, 0.95, 0.22, 1.00);
    const cardDelay = isBoss ? 1200 : 520;

    // Reset all card values
    [deckDeepY, deckMidY, deckActiveY].forEach(v => v.setValue(400));
    deckBackingY.setValue(28);
    deckBackingOp.setValue(0);
    deckDeepRot.setValue(-4); deckMidRot.setValue(3); deckActiveRot.setValue(-2);
    [deckDeepOp, deckMidOp, deckActiveOp].forEach(v => v.setValue(0));

    // Deep card (back) — arrives first
    const slamTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(deckBackingY, { toValue: 0, duration: 220, easing: CARD_DEAL, useNativeDriver: true }),
        Animated.timing(deckBackingOp, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(deckDeepY,  { toValue: 0, duration: 210, easing: CARD_DEAL, useNativeDriver: true }),
        Animated.timing(deckDeepRot,{ toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(deckDeepOp, { toValue: 1, duration: 100,  useNativeDriver: true }),
      ]).start();

      // Mid card — 90ms after deep
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(deckMidY,  { toValue: 0, duration: 190, easing: CARD_DEAL, useNativeDriver: true }),
          Animated.timing(deckMidRot,{ toValue: 0, duration: 190, useNativeDriver: true }),
          Animated.timing(deckMidOp, { toValue: 1, duration: 80,  useNativeDriver: true }),
        ]).start();
      }, 70);

      // Active card — 180ms after deep, heaviest haptic on land
      setTimeout(() => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(deckActiveY, { toValue: -6, duration: 130, easing: CARD_SNAP, useNativeDriver: true }),
            Animated.timing(deckActiveY, { toValue: 0, duration: 90, useNativeDriver: true }),
          ]),
          Animated.timing(deckActiveRot,{ toValue: 0, duration: 160, useNativeDriver: true }),
          Animated.timing(deckActiveOp, { toValue: 1, duration: 80,  useNativeDriver: true }),
        ]).start(() => {
          const deckEntranceKey = `${store.game.stepIndex}:${step.word}`;
          if (deckEntranceHapticRef.current !== deckEntranceKey) {
            deckEntranceHapticRef.current = deckEntranceKey;
            Haptics.selectionAsync();
          }
        });
      }, 120);
    }, cardDelay);
    goldTextOpacity.setValue(0);
    wordEntryTilt.setValue(0);
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.setValue(0);
    bookSlideX.setValue(SCREEN_WIDTH);

    if (isBoss) {
      bookSlideX.setValue(0);
    } else {
      // Normal words keep the existing book entrance.
      Animated.spring(bookSlideX, {
        toValue: 0,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }

    // Boss word rides the book cover — already visible & in position; drama fires on top
    if (isBoss) {
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);
      wordLockPulse.setValue(1);
    }
    wordRecoilY.setValue(0);
    wordRecoilScale.setValue(1);
    wordRedOpacity.setValue(0);

    // Gate reset (face-only — brain state is fresh via the hook's own
    // per-mount initializers, since MaskBoard remounts per word)
    setMasterStampVisible(false);
    setSealReady(false);
    splitTile1TransY.setValue(FINAL_TILE_RELEASE_OFFSET_Y);
    finalBorder1Anim.setValue(0);
    masterHeroScale.setValue(1);
    masterHeroTransY.setValue(0);
    masterAllFadeAnim.setValue(1);
    goldSeedScale.setValue(0);
    goldSeedTransY.setValue(0);
    goldSeedTransX.setValue(0);
    goldSeedRotate.setValue(0);
    goldSeedTrailOpacity.setValue(0);
    goldBloomScale.setValue(1);
    goldBloomOpacity.setValue(0);
    masterCrackOpacity.setValue(0);
    masterCoreOpacity.setValue(0);
    systemStingerOpacity.setValue(0);
    systemStingerScale.setValue(0.75);
    setGoldSeedVisible(false);
    setGoldBloomVisible(false);
    setMasterCracksVisible(false);
    setSystemStingerWord(null);

    // Haunt resets
    setHauntReady(!isHaunt);
    setHauntBannerVisible(false);
    setStillHauntedVisible(false);
    wordHauntTintOpacity.setValue(0);
    hauntBannerOpacity.setValue(0);
    stillHauntedOpacity.setValue(0);
    stillHauntedScale.setValue(0.7);
    return () => clearTimeout(slamTimer);
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word title fade + scale in (non-boss)
  useEffect(() => {
    if (isBoss) return;
    wordEntryOpacity.setValue(0);
    wordEntryScale.setValue(0.85);
    wordEntryTranslateY.setValue(0);
    wordEntryTilt.setValue(0);
    wordLockPulse.setValue(1);

    if (isHaunt) {
      const hauntEntranceKey = `${store.game.stepIndex}:${step.word}`;
      if (hauntEntranceStingKeyRef.current !== hauntEntranceKey) {
        hauntEntranceStingKeyRef.current = hauntEntranceKey;
        playSfx('detectiveSting');
      }

      // Haunt entrance: double haptic + purple word tint + banner
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 180);

      wordHauntTintOpacity.setValue(0.75);
      // Word already visible on cover — book slide handles reveal
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);
      Animated.timing(wordHauntTintOpacity, { toValue: 0, duration: 800, useNativeDriver: true }).start();

      setHauntBannerVisible(true);
      hauntBannerOpacity.setValue(0);
      Animated.timing(hauntBannerOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(hauntBannerOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }, 1200);
      setTimeout(() => {
        setHauntBannerVisible(false);
        setHauntReady(true);
      }, 1400);
    } else {
      // Word is already on the cover — book slide is the reveal.
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);
      wordEntryTranslateY.setValue(0);
      wordEntryTilt.setValue(0);
      wordLockPulse.setValue(1);

      // Subtle lock pulse fires after spring settles
      setTimeout(() => {
        if (wordEntranceHapticRef.current !== step.word) {
          wordEntranceHapticRef.current = step.word;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Animated.sequence([
          Animated.timing(wordLockPulse, {
            toValue: 1.025, duration: 90, useNativeDriver: true,
          }),
          Animated.timing(wordLockPulse, {
            toValue: 1.00, duration: 110, useNativeDriver: true,
          }),
        ]).start();
      }, 380);
    }
    firePollyEvent('wordEntry');
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ghost Polly trigger
  useEffect(() => {
    if (mechanics.ghost) firePollyEvent('ghostEntry');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Boss V1 entrance: stable hero word, then reveal the real tile stack.
  useEffect(() => {
    if (!isBoss) return;

    const impactTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerBoardShake();
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 260);
    }, 400);

    const readyTimer = setTimeout(() => {
      firePollyEvent('bossEntry');
      setBossReady(true);
    }, 1200);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(readyTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // ── render ────────────────────────────────────────────────────
  const wordCoreRotate = goldSeedRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });
  const masteryWordCenterY = Math.max(170, Dimensions.get('window').height * 0.48);
  const vaultBloomX = Math.max(28, containerWidth - 86);

  const deckActiveRotDeg = deckActiveRot.interpolate({ inputRange: [-4, 0, 4], outputRange: ['-4deg', '0deg', '4deg'] });
  const wordEntryTiltDeg = wordEntryTilt.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '0deg', '5deg'] });
  const bookIntakeRotateX = bookOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '65deg'],
  });
  const bookIntakeGlowScale = bookOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });

  return (
    <Animated.View
      style={styles.container}
      ref={containerRef as any}
      onLayout={e => {
        const w = e.nativeEvent.layout.width;
        setContainerWidth(w);
        containerWidthRef.current = w;
      }}
    >
      {/* ── WORD ZONE — dominant upper arena ────────────────── */}
      <View
        style={[styles.wordZone, isBoss && styles.wordZoneBoss]}
        pointerEvents="none"
        ref={wordZoneRef as any}
        onLayout={e => {
          const zoneHeight = e.nativeEvent.layout.height;
          (wordZoneRef.current as any)?.measure(
            (_x: number, _y: number, _w: number, _h: number, _px: number, pageY: number) => {
              setWordScreenY(pageY + zoneHeight / 2);
            }
          );
        }}
      >
        {/* Kicker — floats above word zone */}
        {mechanics.kicker && (
          isBoss ? (
            <Text style={styles.kickerBoss}>{mechanics.kicker}</Text>
          ) : (
            <Text style={styles.kicker}>{mechanics.kicker}</Text>
          )
        )}

        {transitionLabel && (
          <Animated.Text
            pointerEvents="none"
            style={[styles.kicker, { opacity: transitionLabelOpacity, color: '#F5C842', letterSpacing: 5 }]}
          >
            {transitionLabel}
          </Animated.Text>
        )}

        {/* Book slide wrapper — entire book (shadow, pages, intake, cover) slides in/out as one unit.
            absoluteFill keeps the absolutely-positioned book children aligned to the word zone. */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: Animated.add(bookSlideX, boardShakeX) }] }]}
        >
        {/* SVG Hero Book V5; MaskBoard retains the animated hero-word content. */}
        <HeroBook
          coverRotateX={bookIntakeRotateX}
          intakeOpacity={bookIntakeGlowAnim}
          intakeScaleY={bookIntakeGlowScale}
        >

        {/* Outer wrapper: non-native recoil transforms (RAF-driven setValue) */}
        <Animated.View
          style={{
            transform: [
              { translateY: wordRecoilY },
              { scale: wordRecoilScale },
            ],
          }}
        >
          {/* Hero word transforms */}
          <Animated.View
            style={{
              opacity: mechanics.wordOutcome === 'none' ? wordEntryOpacity : 0,
              transform: [
                { scale: absorptionScale },
                { scale: wordEntryScale },
                { scale: wordLockPulse },
                { scale: masterHeroScale },
                { translateY: masterHeroTransY },
                { translateY: wordEntryTranslateY },
                { rotate: wordEntryTiltDeg },
              ],
            }}
          >
            {!isBoss ? (
              <FoilWord
                word={step.word}
                baseStyle={styles.word}
                fontSize={96}
                minimumFontScale={0.72}
              />
            ) : (
              <Text
                style={[styles.word, styles.wordBoss]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Text>
            )}
            {/* Gold overlay for absorption fill */}
            {!isBoss && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  {
                    color: '#F5C842',
                    opacity: goldTextOpacity,
                    position: 'absolute',
                    left: 0, right: 0,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Animated.Text>
            )}
            {/* Red flash overlay — wrong swipe danger signal */}
            {!isBoss && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  {
                    color: '#CC2200',
                    opacity: wordRedOpacity,
                    position: 'absolute',
                    left: 0, right: 0,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Animated.Text>
            )}

            {/* Haunt entrance purple tint — fades out as tiles appear */}
            {isHaunt && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  isBoss && styles.wordBoss,
                  {
                    color: '#7B2D8B',
                    opacity: wordHauntTintOpacity,
                    position: 'absolute',
                    left: 0, right: 0,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Animated.Text>
            )}

            {/* Absorption ring */}
            <Animated.View
              pointerEvents="none"
              style={[styles.goldRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
          </Animated.View>
        </Animated.View>
        </HeroBook>

        {/* Vault brand on spine — slides in with the book every round */}
        <Text
          pointerEvents="none"
          style={styles.vaultLabel}
        >
          POLLY'S VAULT
        </Text>
        </Animated.View>

        {/* Absorbed phrase flash */}
        {absorbedPhrase !== null && (
          <Animated.Text style={[styles.absorbedPhrase, { opacity: absorbedPhraseOpacity }]}>
            {absorbedPhrase}
          </Animated.Text>
        )}
      </View>

      {/* ── TILE ZONE ───────────────────────────────────────── */}
      <View style={styles.gridWrap}>
        <View style={styles.tileStackArea}>
          {showBoardContent && mechanics.gatePhase !== 'tiles' && mechanics.gatePhase !== 'wrongFail' && mechanics.topMask && (
            <Animated.View
              pointerEvents="none"
              style={[styles.swipeCueOverlay, { opacity: cueOpacityAnim }]}
            >
              <Text style={[styles.swipeCueText, styles.swipeUpCue]}>
                SWIPE UP TO CLAIM
              </Text>
              <Text style={[styles.swipeCueText, styles.swipeRightCue]}>
                SWIPE RIGHT TO REJECT
              </Text>
            </Animated.View>
          )}
          {showBoardContent && (
          <Animated.View style={[styles.tileStack, { transform: [{ translateY: deckSlamY }] }]}>
            <Animated.View style={{ opacity: masterAllFadeAnim }}>
            {mechanics.gatePhase !== 'tiles' && mechanics.gatePhase !== 'wrongFail' && mechanics.topMask && (
              <View style={styles.deckWrap}>
                {Array.from({ length: backingCardCount }, (_, index) => {
                  const depth = backingCardCount - index;
                  return (
                    <Animated.View
                      key={`deck-backing-${depth}`}
                      pointerEvents="none"
                      style={[
                        deckBackMaterial.base,
                        deckBackMaterial.rim,
                        styles.deckBackingCard,
                        {
                          top: depth * DECK_BACKING_OFFSET,
                          width: backingCardWidth,
                          backgroundColor: DECK_BACKING_COLORS[depth - 1],
                          borderColor: DECK_BACKING_BORDER_COLORS[depth - 1],
                          opacity: deckBackingOp,
                          transform: [
                            { translateY: deckBackingY },
                            { scale: 1 - depth * 0.01 },
                            { rotate: `${depth * -1.3}deg` },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.deckBackingLowerEdge} />
                    </Animated.View>
                  );
                })}
                {/* ── TOP CARD — interactive ── */}
                <Animated.View style={[
                  styles.deckActiveCardLayer,
                  {
                    transform: [
                      { translateY: deckActiveY },
                      { translateY: cardPopY },
                      { rotate: deckActiveRotDeg },
                      {
                        scale: Animated.add(
                          1,
                          Animated.multiply(
                            pulseAnim,
                            tileBreatheAmount.interpolate({ inputRange: [0, 1], outputRange: [0, 0.008] }),
                          ),
                        ),
                      },
                    ],
                    opacity: deckActiveOp,
                  },
                ]}>
                <View
                  ref={getTileRef(mechanics.topMask.id)}
                  style={styles.deckTopCardSlot}
                >
                  <SwipeMask
                    key={mechanics.topMask.id}
                    mask={mechanics.topMask}
                    state={mechanics.tileStates.get(mechanics.topMask.id) ?? 'idle'}
                    onSwipeUp={() => mechanics.onSwipeUp(mechanics.topMask!.id)}
                    onSwipeDown={() => mechanics.onSwipeRight(mechanics.topMask!.id)}
                    onSwipeReveal={() => {}}
                    revealable={false}
                    disabled={mechanics.inputLocked}
                    nearMastery={mechanics.nearMastery}
                    tileHeight={TILE_H}
                    entryDelay={0}
                    hapticCorrect={step.hapticTier === 'light' ? () => Haptics.selectionAsync() : undefined}
                    onEffect={handleEffect}
                    onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
                    onPressHoldStart={() => playSfx('pressHoldStart')}
                    onExitComplete={() => {
                      mechanics.onTileExitComplete(mechanics.topMask!.id);
                    }}
                    onCardTouch={handleCardTouch}
                    wordY={wordScreenY}
                    intakeY={wordScreenY + 73}
                  />
                </View>
                </Animated.View>
              </View>
            )}

            {(mechanics.gatePhase === 'tiles' || mechanics.gatePhase === 'wrongFail') && mechanics.activeGauntletTile && (
              <View style={styles.finalHiddenTileStack}>
                {mechanics.gauntletTiles.length > 1 && (
                  <Text style={{
                    color: 'rgba(245,200,66,0.72)',
                    fontFamily: FONTS.label,
                    fontSize: 15,
                    letterSpacing: 3,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}>
                    {`${mechanics.gauntletIndex + 1} OF ${mechanics.gauntletTiles.length}`}
                  </Text>
                )}
                <Animated.View
                  pointerEvents={mechanics.gatePhase === 'wrongFail' ? 'none' : mechanics.tileLanded ? 'auto' : 'none'}
                  style={{ transform: [{ translateY: splitTile1TransY }] }}
                >
                  <Animated.View style={[
                    styles.finalHiddenTileFrame,
                    {
                      borderColor: finalBorder1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(245,200,66,0.35)', 'rgba(245,200,66,1.0)'],
                      }),
                      shadowOpacity: finalBorder1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.08, 0.26],
                      }),
                    },
                  ]}>
                    <SwipeMask
                      key={mechanics.activeGauntletTile.mask.id}
                      mask={mechanics.activeGauntletTile.mask}
                      state={mechanics.finalTileStates.get(mechanics.activeGauntletTile.mask.id) ?? 'idle'}
                      onSwipeUp={mechanics.onGauntletSwipeUp}
                      onSwipeDown={mechanics.onGauntletSwipeRight}
                      onSwipeReveal={() => {}}
                      revealable={false}
                      disabled={mechanics.inputLocked}
                      isSpecialSplit={true}
                      tileHeight={FINAL_TILE_H}
                      entryDelay={0}
                      onEffect={handleEffect}
                      onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
                      onPressHoldStart={() => playSfx('pressHoldStart')}
                      onCardTouch={handleCardTouch}
                      wordY={wordScreenY}
                      intakeY={wordScreenY + 73}
                      splitBorderColor="rgba(245,200,66,1.0)"
                      splitTextColor="rgba(255,248,230,1)"
                      splitBackgroundColor="#0F0D2A"
                    />
                  </Animated.View>
                </Animated.View>
              </View>
            )}
            </Animated.View>
          </Animated.View>
          )}

          <View pointerEvents="none" style={styles.scoreFloatOverlay}>
            {floats.filter(f => f.kind !== 'mastery').map(f => (
              <SwipeScoreFloat
                key={f.id}
                value={f.value}
                color={f.color}
                kind={f.kind as Exclude<FloatKind, 'mastery'>}
                tier={f.tier ?? 1}
                onComplete={() => setFloats(prev => prev.filter(e => e.id !== f.id))}
              />
            ))}
          </View>

        </View>
      </View>


      {/* Mastery score float */}
      {floats.filter(f => f.kind === 'mastery').map(f => (
          <ScoreFloat
            key={f.id}
            value={f.value}
            startPosition={{ x: f.x, y: f.y }}
            color={f.color}
            onComplete={() => setFloats(prev => prev.filter(e => e.id !== f.id))}
          />
      ))}

      {/* Mastery celebration — phase-based elements */}
      {masterStampVisible && (
        <>
          {sealReady && (
            <MasterySeal
              x={containerWidth / 2}
              y={masteryWordCenterY}
              variant={isHaunt ? 'banished' : 'master'}
              label={isHaunt ? 'BANISHED' : 'MASTER'}
              onReveal={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                playRoundComplete();
              }}
            />
          )}

          {/* Cracked word energy */}
          {masterCracksVisible && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: masteryWordCenterY - 36,
                left: containerWidth / 2 - 118,
                width: 236,
                height: 94,
                opacity: masterCrackOpacity,
              }}
            >
              {[
                { left: 22, top: 26, width: 86, rotate: '-24deg', color: '#7B2D8B' },
                { left: 78, top: 42, width: 74, rotate: '18deg', color: '#9B2D6B' },
                { left: 126, top: 24, width: 92, rotate: '-15deg', color: '#7B2D8B' },
                { left: 44, top: 58, width: 54, rotate: '34deg', color: '#F5C842' },
                { left: 144, top: 60, width: 58, rotate: '-32deg', color: '#9B2D6B' },
              ].map((crack, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: crack.left,
                    top: crack.top,
                    width: crack.width,
                    height: i === 3 ? 3 : 4,
                    borderRadius: 3,
                    backgroundColor: crack.color,
                    opacity: i === 3 ? 0.72 : 0.9,
                    transform: [{ rotate: crack.rotate }],
                  }}
                />
              ))}
            </Animated.View>
          )}

          {/* Word Core + trail */}
          {goldSeedVisible && (
            <>
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: containerWidth / 2 - 2,
                  top: masteryWordCenterY - 2,
                  width: 4,
                  height: 74,
                  borderRadius: 2,
                  backgroundColor: '#F5C842',
                  opacity: goldSeedTrailOpacity,
                  transform: [
                    { translateX: goldSeedTransX },
                    { translateY: goldSeedTransY },
                    { rotate: '28deg' },
                  ],
                }}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: containerWidth / 2 - 12,
                  top: masteryWordCenterY - 12,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#F5C842',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.65)',
                  opacity: masterCoreOpacity,
                  shadowColor: '#F5C842',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.95,
                  shadowRadius: 14,
                  elevation: 10,
                  transform: [
                    { translateX: goldSeedTransX },
                    { translateY: goldSeedTransY },
                    { scale: goldSeedScale },
                    { rotate: wordCoreRotate },
                  ],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 5,
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: '#FFFFFF',
                    opacity: 0.72,
                  }}
                />
              </Animated.View>
            </>
          )}

          {/* Vault nav impact bloom */}
          {goldBloomVisible && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 34,
                left: vaultBloomX,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#F5C842',
                transform: [{ scale: goldBloomScale }],
                opacity: goldBloomOpacity,
              }}
            />
          )}

          {/* Boss-only game/system stinger */}
          {systemStingerWord && (
            <Animated.Text
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: masteryWordCenterY - 22,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: FONTS.label,
                fontWeight: '900',
                fontSize: systemStingerWord === 'ZZZZINGO!' ? 42 : 50,
                color: '#FFFFFF',
                letterSpacing: 0,
                opacity: systemStingerOpacity,
                textShadowColor: '#F5C842',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 14,
                transform: [{ scale: systemStingerScale }],
              }}
            >
              {systemStingerWord}
            </Animated.Text>
          )}
        </>
      )}

      {/* ── Haunt entrance banner ─────────────────────────────── */}
      {hauntBannerVisible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.hauntEntranceBanner, { opacity: hauntBannerOpacity }]}
        >
          <Text style={styles.hauntEntranceBannerText}>Guess who's back.</Text>
        </Animated.View>
      )}

      {/* ── STILL HAUNTED stamp ───────────────────────────────── */}
      {stillHauntedVisible && (
        <Animated.Text
          pointerEvents="none"
          style={[styles.stillHauntedText, {
            opacity: stillHauntedOpacity,
            transform: [{ scale: stillHauntedScale }],
          }]}
        >
          STILL HAUNTED
        </Animated.Text>
      )}

      {mechanics.wordOutcome === 'mastered' && (
        <MasteredOutcomeOverlay
          word={step.word}
          headline={isHaunt ? 'BANISHED' : 'MASTERED'}
          bonusLabel={mechanics.outcomeBonusLabel}
          onContinue={mechanics.continueOutcome}
        />
      )}

      {mechanics.wordOutcome === 'haunted' && (
        <HauntedOutcomeOverlay
          word={step.word}
          detail={mechanics.outcomeDetail}
          onContinue={mechanics.continueOutcome}
        />
      )}
    </Animated.View>
  );
}

// Thin presenter — MaskBoard is BoardPresenter with isBossStage locked off.
// BossBoard (app/components/BossBoard.tsx) is the boss-stage counterpart;
// both render through this exact same face code, never a copy.
export function MaskBoard(props: Props) {
  return <BoardPresenter {...props} isBossStage={false} />;
}

export { BoardPresenter };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  // ── Word zone ─────────────────────────────────────────────────
  wordZone: {
    height: 172,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingTop: 8,
    paddingBottom: 0,
    position: 'relative',
    marginTop: 4,
  },
  wordZoneBoss: {
    height: 186,
  },
  kicker: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
  },
  kickerBoss: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    top: -24,
    left: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(15,13,42,0.88)',
  },
  word: {
    fontSize: 96,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: FONT_SIZES.wordDisplayLetterSpacing,
    color: '#F5C842',
    // Tight warm edge only — a wide zero-offset glow (radius 8) hazed the glyphs
    textShadowColor: 'rgba(245,200,66,0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  wordBoss: {
    fontSize: 112,
    fontFamily: FONTS.bossWord,
    letterSpacing: FONT_SIZES.bossWordLetterSpacing,
    color: '#F5C842',
  },
  goldRing: {
    position: 'absolute',
    alignSelf: 'center',
    width: '85%',
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#F5C842',
  },
  absorbedPhrase: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.progressLabel,
    fontFamily: FONTS.label,
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
  },
  vaultLabel: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(245,200,66,0.72)',
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 4,
  },
  // ── Tile zone ─────────────────────────────────────────────────
  gridWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 180,
    paddingBottom: 48,
    minHeight: 0,
  },
  tileStackArea: {
    width: '100%',
    minHeight: TILE_H + 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 0,
    overflow: 'visible',
  },
  scoreFloatOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: PW.z.overlay,
    elevation: PW.z.overlay,
  },
  swipeCueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: TILE_H + 96,
    zIndex: 3,
    elevation: 3,
  },
  swipeCueText: {
    position: 'absolute',
    fontFamily: FONTS.label,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.9,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  swipeUpCue: {
    top: -32,
    left: 0,
    right: 0,
    color: '#F5C842',
    opacity: 0.72,
  },
  swipeRightCue: {
    top: TILE_H + 16,
    right: 8,
    width: 190,
    color: 'rgba(155,45,107,0.88)',
    opacity: 0.74,
    textAlign: 'right',
  },
  tileStack: {
    width: '94%',
    alignSelf: 'center',
    paddingRight: 0,
    zIndex: 2,
    overflow: 'visible',
  },
  deckWrap: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    minHeight: TILE_H + 18,
    paddingBottom: 14,
    overflow: 'visible',
  },
  deckBackingCard: {
    position: 'absolute',
    height: TILE_H,
    borderRadius: PW.radius.card,
    borderWidth: 1,
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  deckBackingLowerEdge: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(245,200,66,0.5)',
    opacity: 0.85,
  },
  deckActiveCardLayer: {
    position: 'relative',
    zIndex: 30,
    elevation: 30,
  },
  deckTopCardSlot: {
    position: 'relative',
    zIndex: 20,
    width: '100%',
    minHeight: TILE_H,
    paddingVertical: 0,
    borderWidth: 0,
    borderRadius: 28,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 12,
  },
  finalHiddenTileStack: {
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  finalHiddenTileFrame: {
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#0F0D2A',
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 7,
  },
  outcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(15,13,42,0.78)',
  },
  outcomePanel: {
    width: '100%',
    maxWidth: 360,
    minHeight: 300,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 14,
  },
  masteredOutcomePanel: {
    borderColor: 'rgba(245,200,66,0.92)',
    backgroundColor: 'rgba(15,13,42,0.96)',
    shadowColor: '#F5C842',
    shadowOpacity: 0.34,
  },
  hauntedOutcomePanel: {
    borderColor: 'rgba(155,45,107,0.92)',
    backgroundColor: 'rgba(15,13,42,0.97)',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.42,
  },
  masteredPulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#F5C842',
    backgroundColor: 'rgba(245,200,66,0.08)',
  },
  hauntedHaze: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 24,
    bottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.36)',
    backgroundColor: 'rgba(123,45,139,0.18)',
  },
  outcomeHeadline: {
    fontFamily: FONTS.label,
    fontWeight: '900',
    fontSize: 38,
    letterSpacing: 0,
    textAlign: 'center',
  },
  masteredOutcomeHeadline: {
    color: '#F5C842',
    textShadowColor: 'rgba(245,200,66,0.62)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  hauntedOutcomeHeadline: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(155,45,107,0.74)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  outcomeWord: {
    marginTop: 8,
    color: '#F5C842',
    fontFamily: FONTS.wordDisplay,
    fontSize: 54,
    letterSpacing: 0,
    textAlign: 'center',
    maxWidth: '100%',
  },
  outcomeCopyBlock: {
    marginTop: 12,
    gap: 5,
  },
  outcomeCopy: {
    color: '#FFFFFF',
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 0,
    textAlign: 'center',
  },
  outcomeBonus: {
    marginTop: 16,
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: FONT_SIZES.hudScore,
    letterSpacing: 0,
    textAlign: 'center',
  },
  hauntedDetail: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.46)',
    backgroundColor: 'rgba(123,45,139,0.20)',
    color: '#FFFFFF',
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 0,
    textAlign: 'center',
  },
  outcomeContinue: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.hudLabel,
    letterSpacing: 1,
    textAlign: 'center',
  },
  // ── Haunt system ─────────────────────────────────────────────
  hauntEntranceBanner: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 218,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7B2D8B',
    backgroundColor: '#0F0D2A',
    alignItems: 'center',
    shadowColor: '#7B2D8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  hauntEntranceBannerText: {
    color: '#FFFFFF',
    fontFamily: FONTS.label,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  stillHauntedText: {
    position: 'absolute',
    top: 230,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.label,
    fontWeight: '900',
    fontSize: 30,
    color: '#7B2D8B',
    letterSpacing: 1,
    textShadowColor: 'rgba(123,45,139,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
