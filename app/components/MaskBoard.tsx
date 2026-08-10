import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, FONT_SIZES } from '../constants/fonts';
import { Haptics } from '../utils/haptics';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';
import HeroBook from './ui/HeroBook';
import { FoilWord } from './ui/FoilWord';
import { BookLight } from './ui/BookLight';
import type { PollyEvent } from '../game/pollyVisitPolicy';
import { playSfx } from '../audio/sfx';
import { PW } from '../ui/pwTheme';
import { libraryMaterial } from '../ui/pwMaterials';
import { bossOutcomeAssets } from '../ui/bossOutcomeAssets';
import { useHeartbeat } from '../hooks/useHeartbeat';
import MasterySeal from './MasterySeal';
import { useBoardMechanics } from '../hooks/useBoardMechanics';
import type { ChainTier } from '../hooks/useBoardMechanics';
import MaskCardArtwork from './ui/MaskCardArtwork';
import { BossGauntletSpines } from './BossGauntletSpines';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  hasBoardVerticalOverflow,
  resolveActiveCueLayout,
  resolveActiveTileHeight,
  resolveBoardVerticalSpacing,
} from './tileTextLayout';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 6;
const TILE_H     = 152;
const FINAL_TILE_H = 72;
const FINAL_TILE_GAP = 10;
const TILE_INSET = 16;
const MAX_DECK_BACKING_CARDS = 4;
const DECK_BACKING_OFFSET = 9;
const GAUNTLET_TILE_H = 200;
const GAUNTLET_HEADER_REGION_EXTRA = 44;

// Deck timing curves — shared by the round's opening deal-in and the
// per-tile shuffle-forward animation (Task 1), so the deck reads as one
// consistent object rather than two different systems.
const CARD_DEAL = Easing.bezier(0.18, 1.04, 0.26, 1.00);
const CARD_SNAP = Easing.bezier(0.16, 0.95, 0.22, 1.00);

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
  onGoldFlash?: () => void;
  onSwipeAttempt?: () => void;
  // Owned by GameContent — the visit layer must outlive this board's
  // per-word remount (key={stepIndex}), or word-completion beats die mid-arc.
  firePollyEvent: (event: PollyEvent) => void;
};

type BoardPresenterProps = Props & {
  // Drives the boss-only chest theater below; BossBoard passes true,
  // MaskBoard passes false, so the normal-round face is unaffected.
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
  const reduceMotion = useReducedMotionPreference();
  const [canDismiss, setCanDismiss] = useState(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    if (!canDismiss) return;
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      pulse.setValue(0);
      const auto = setTimeout(resolve, 2800);
      const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
      return () => { clearTimeout(auto); clearTimeout(dismissTimer); };
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 160, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    const auto = setTimeout(resolve, 2800);
    const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
    return () => { clearTimeout(auto); clearTimeout(dismissTimer); loop.stop(); };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const reduceMotion = useReducedMotionPreference();
  const [canDismiss, setCanDismiss] = useState(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    if (!canDismiss) return;
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      drift.setValue(0);
      const auto = setTimeout(resolve, 3200);
      const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
      return () => { clearTimeout(auto); clearTimeout(dismissTimer); };
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 9, stiffness: 120, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    const auto = setTimeout(resolve, 3200);
    const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
    return () => { clearTimeout(auto); clearTimeout(dismissTimer); loop.stop(); };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

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


function BoardPresenter({ step, spawnEffect, onTrapCaught, onWrongSwipe, onGoldFlash, onSwipeAttempt, firePollyEvent, isBossStage }: BoardPresenterProps) {
  const { fontScale } = useWindowDimensions();
  // Only stepIndex is read here, so select it directly rather than the
  // whole store — this is the per-word presenter, remounted on every swipe
  // resolution, so a whole-store subscription re-rendered it on completely
  // unrelated state (daily session, settings, pollyMemory...).
  const gameStepIndex = useGameStore(s => s.game.stepIndex);
  const gauntletCorrectCount = useGameStore(s => s.game.gauntletCorrectCount);
  const { pulseAnim, tension } = useHeartbeat();
  const tileBreatheAmount = useRef(new Animated.Value(0)).current;
  const isBoss  = step.eventType === 'bossWord';
  const isHaunt = step.isHauntReturn === true;

  // ── layout ───────────────────────────────────────────────────
  // Seeded from the real device width (available synchronously before
  // first paint) instead of a guessed literal — onLayout below still
  // corrects it for edge cases (split-view resize, rotation), but the
  // first render is no longer drawn against a made-up number.
  const initialWindowWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(initialWindowWidth);
  const containerWidthRef                   = useRef(initialWindowWidth);
  const [activeTileLayout, setActiveTileLayout] = useState({
    maskId: null as string | null,
    height: TILE_H,
  });
  const activeTopMaskIdRef = useRef<string | null>(null);
  const [activeGauntletTileHeight, setActiveGauntletTileHeight] = useState(GAUNTLET_TILE_H);
  const [gridViewportWidth, setGridViewportWidth] = useState(0);
  const [gridViewportHeight, setGridViewportHeight] = useState(0);
  const [gridContentHeight, setGridContentHeight] = useState(0);
  const cueLayoutIdentityRef = useRef('');
  const [cueTextMeasurements, setCueTextMeasurements] = useState({
    identity: '',
    upHeight: 0,
    rightHeight: 0,
  });
  const handleActiveTileHeightChange = useCallback((maskId: string, measuredHeight: number) => {
    if (activeTopMaskIdRef.current !== maskId) return;
    const height = resolveActiveTileHeight(measuredHeight);
    setActiveTileLayout(previous => (
      previous.maskId === maskId && previous.height === height
        ? previous
        : { maskId, height }
    ));
  }, []);
  const handleGauntletTileHeightChange = useCallback((measuredHeight: number) => {
    const height = resolveActiveTileHeight(measuredHeight, GAUNTLET_TILE_H);
    setActiveGauntletTileHeight(height);
  }, []);
  const handleCueTextLayout = useCallback((cue: 'up' | 'right', measuredHeight: number) => {
    const identity = cueLayoutIdentityRef.current;
    if (!identity) return;
    const height = Number.isFinite(measuredHeight) && measuredHeight > 0
      ? Math.ceil(measuredHeight)
      : 0;
    setCueTextMeasurements(previous => {
      const current = previous.identity === identity
        ? previous
        : { identity, upHeight: 0, rightHeight: 0 };
      const key = cue === 'up' ? 'upHeight' : 'rightHeight';
      return current[key] === height ? current : { ...current, [key]: height };
    });
  }, []);
  const containerRef  = useRef<View>(null);
  const wordZoneRef   = useRef<View>(null);
  // wordScreenY has no synchronous real-value equivalent (it's a page
  // position, not a device dimension) — wordZoneMeasured gates its only
  // consumers (SwipeMask's wordY/intakeY props) so nothing reads the
  // still-default value before the real onLayout+measure() lands.
  const [wordScreenY, setWordScreenY] = useState(180);
  const [wordZoneMeasured, setWordZoneMeasured] = useState(false);

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

  // Per-backing-card animated depth state, keyed by mask id so a card's
  // identity survives the deck shrinking. This is what makes the stack
  // advance smoothly instead of snapping — see getBackingCardAnim below.
  const backingCardAnimsRef = useRef(
    new Map<string, { depthY: Animated.Value; scale: Animated.Value; rotate: Animated.Value }>()
  ).current;

  function getBackingCardAnim(maskId: string, depth: number) {
    let anim = backingCardAnimsRef.get(maskId);
    if (!anim) {
      anim = {
        depthY: new Animated.Value(depth * DECK_BACKING_OFFSET),
        scale: new Animated.Value(1 - depth * 0.01),
        rotate: new Animated.Value(depth * -1.3),
      };
      backingCardAnimsRef.set(maskId, anim);
    }
    return anim;
  }

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
  const bookGhostDrainOpacity = useRef(new Animated.Value(0)).current; // Task 4 — boss haunt only
  const bookSlideX            = useRef(new Animated.Value(SCREEN_WIDTH)).current; // book entrance/exit slide, native driver
  const boardShakeX           = useRef(new Animated.Value(0)).current; // boss entrance / haunted micro-shake, native driver
  const wordEntranceHapticRef = useRef<string | null>(null);
  const bookOpenAnimationRef   = useRef<Animated.CompositeAnimation | null>(null);

  function triggerBoardShake() {
    boardShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(boardShakeX, { toValue: -4, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 4,  duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: -2, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 0,  duration: 35, useNativeDriver: true }),
    ]).start();
  }
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
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
    // Staggered slightly behind wrongLame — fired together, the sharper
    // squawk was burying the softer wrong-swipe whistle entirely.
    setTimeout(() => playSfx('pollySqwawkShort'), 70);
    if (brokeRealChain) {
      playSfx('correctClaim', { rate: 0.55 });
    }
    Haptics.cueAsync('wrong');
    triggerWrongWordRecoil();
    onWrongSwipe?.();
  }

  // ── boss entrance ─────────────────────────────────────────────
  function triggerBookOpen() {
    bookOpenAnim.stopAnimation();
    bookIntakeGlowAnim.stopAnimation();
    bookOpenAnimationRef.current?.stop();
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.setValue(0);
    bookOpenAnimationRef.current = Animated.parallel([
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
    ]);
    bookOpenAnimationRef.current.start();
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

  // Set by onRealClaimed the instant a swipe is judged correct — consumed
  // here at the card's actual visual arrival (onCardTouch fires from
  // SwipeMask's magnetic-flight physics reaching the book, up to ~1.15s
  // later) so the absorption pulse and the book's own open flick land on
  // the same beat instead of the pulse firing up to a second early.
  const pendingAbsorbPhraseRef = useRef<string | null>(null);

  function handleCardTouch() {
    if (mechanics.gatePhase !== 'locked') return;
    triggerBookOpen();
    if (pendingAbsorbPhraseRef.current !== null) {
      triggerAbsorption(pendingAbsorbPhraseRef.current);
      pendingAbsorbPhraseRef.current = null;
    }
  }

  // ── gauntlet pulse ────────────────────────────────────────────
  // A stronger, distinct pulse fired for each correctly-judged mystery
  // tile — the book stays at rest between tiles (same as normal) but
  // gets a bigger glow + heavier haptic on each correct judgment, rather
  // than holding open statically for the whole gauntlet. Reuses the same
  // bookOpenAnimationRef safety pattern as triggerBookOpen: reset both
  // bookOpenAnim and bookIntakeGlowAnim unconditionally before starting.
  function triggerGauntletPulse() {
    bookOpenAnimationRef.current?.stop();
    bookOpenAnim.stopAnimation();
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.stopAnimation();
    bookIntakeGlowAnim.setValue(0);
    bookOpenAnimationRef.current = Animated.parallel([
      Animated.sequence([
        Animated.timing(bookOpenAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(220),
        Animated.timing(bookOpenAnim, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(220),
        Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]);
    bookOpenAnimationRef.current.start();
  }

  const [bossReady, setBossReady]             = useState(!isBoss);
  const [tilesReady, setTilesReady]           = useState(false);
  // Held beat between the close-beat finishing and the outcome card
  // appearing — mirrors ResultsScreen's verdict-then-detail stagger.
  const [showOutcomeCard, setShowOutcomeCard] = useState(false);

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
  // Bumped each time the boss gauntlet begins so BossGauntletStack remounts
  // and replays its throw-in (relevant for Returning Haunt retries within
  // the same session).
  const [gauntletThrowKey, setGauntletThrowKey]         = useState(0);

  const showBoardContent = (!isBoss || bossReady) && tilesReady && (!isHaunt || hauntReady);

  // Swipe cues quiet down after round 3, but never disappear for good — a
  // full fade-to-zero re-imposed the grammar-recall tax on every session
  // after the first few rounds, every run.
  useEffect(() => {
    if (gameStepIndex >= 3) {
      Animated.timing(cueOpacityAnim, {
        toValue: 0.38,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [gameStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

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
      onRealClaimed({ mask, tier, points }) {
        playSfx('correctClaim', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.cueAsync(step.hapticTier === 'light' ? 'standardCorrect' : 'heightenedCorrect');
        spawnFloat(points, 'real', tier);
        // Not fired directly — handleCardTouch fires it at actual arrival,
        // synced with triggerBookOpen (see pendingAbsorbPhraseRef).
        pendingAbsorbPhraseRef.current = mask.phrase;
        onGoldFlash?.();
      },
      onTrapRejected({ tier, points }) {
        playSfx('trapShatter', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.cueAsync(step.hapticTier === 'light' ? 'standardCorrect' : 'heightenedCorrect');
        spawnFloat(points, 'trap', tier);
        onTrapCaught?.();
      },
      onWrongSwipe({ brokeRealChain }) {
        performWrongSwipeFeedback(brokeRealChain);
      },
      onGauntletCorrect({ swipedUp, phrase }) {
        playSfx(swipedUp ? 'correctClaim' : 'trapShatter');
        Haptics.cueAsync('bossCorrect');
        triggerGauntletPulse();
        onGoldFlash?.();
        // gauntletCorrectCount in the store hasn't incremented for this
        // tile yet (resolveGauntletTile calls this callback before it calls
        // incrementGauntletCorrectCount) — same for mechanics.finalTileStates,
        // so counting its prior entries and adding this tile gives the
        // correct ordinal without an off-by-one. The gauntlet-ending tile
        // (the one immediately before mastery) gets a heavier double-pulse;
        // reuses the same stacked Heavy-impact shape as the boss entrance.
        const priorCorrect = Array.from(mechanics.finalTileStates.values())
          .filter(s => s === 'correct' || s === 'trap-caught').length;
        const isFinalGauntletTile = priorCorrect + 1 >= mechanics.gauntletTiles.length;
        if (isFinalGauntletTile) {
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
        }
        if (swipedUp) triggerAbsorption(phrase);
      },
      onGauntletTileDrop() {
        // No longer drives any visible animation — BossGauntletStack owns
        // the card's own motion now. This timer only stands in for the old
        // spring's settle time (damping: 13, stiffness: 150) so
        // onGauntletTileLanded still fires on roughly the same beat.
        setTimeout(() => {
          mechanics.onGauntletTileLanded();
        }, 280);
      },
      onGauntletBegin() {
        setGauntletThrowKey(k => k + 1);
        Haptics.cueAsync('bossEntry');
      },
      onWordExit(perfect) {
        // Stop any prior per-tile flick animation and reset both values it
        // drives to their rest state, unconditionally — triggerBookOpen may
        // have fired on any tile in this round on either the perfect or
        // imperfect path, and both bookOpenAnim and bookIntakeGlowAnim need
        // to return to 0 before anything else touches them.
        bookOpenAnimationRef.current?.stop();
        bookOpenAnim.stopAnimation();
        bookOpenAnim.setValue(0);
        bookIntakeGlowAnim.stopAnimation();
        bookIntakeGlowAnim.setValue(0);

        if (perfect) {
          // Round clear pulses the book's own glow harder and longer than
          // the 120ms per-tile flick (triggerBookOpen) — a full round
          // reads as more than one tile landing, using the same prop.
          Animated.sequence([
            Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]).start();
        }
        playSfx('bookClose');
        Animated.timing(bookSlideX, {
          toValue: -SCREEN_WIDTH,
          duration: isBoss ? 380 : 280,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start();
      },
      onMasteredSequence({ isBoss: bossOutcome, isHaunt: hauntOutcome, masteryPoints }) {
        // `!isBoss` here can only mean isHaunt (onMasteredSequence is only
        // ever invoked when isFinalGateStep — isBoss || isHaunt — is true,
        // see the completion-check effect above). The old 12-phase Haunt-mastery
        // sequence that used to live here is unreachable; removed rather than left
        // as dead code a future edit could waste time modifying.
        // ── One decisive beat, boss or Haunt rematch alike.
        onGoldFlash?.();
        if (!hauntOutcome) spawnFloatAtSplit(masteryPoints, '#F5C842');
        playSfx('bookClose');
        Haptics.cueAsync('mastery');
        // Cancel any in-flight composite (e.g. a gauntlet pulse parked in
        // its Animated.delay) before driving these shared values directly —
        // otherwise its queued final leg fires later and fights this beat.
        // Reset to a known 0 rather than leaving stopAnimation()'s frozen
        // mid-flight value as the start point — triggerGauntletPulse from the
        // just-resolved 3rd gauntlet tile can still be mid-cycle here, and
        // starting this sequence from an arbitrary in-between value made its
        // timing unpredictable.
        bookOpenAnimationRef.current?.stop();
        bookOpenAnim.stopAnimation();
        bookIntakeGlowAnim.stopAnimation();
        bookOpenAnim.setValue(0);
        bookIntakeGlowAnim.setValue(0);
        bookOpenAnimationRef.current = Animated.parallel([
          // Explicit chained legs, not a spring — a spring here read as an
          // under-damped blink/pulse on device instead of a single clean
          // snap. Snap-to-shut, a tiny recoil settle, then rest.
          //
          // The first leg used to target -0.04 (a small overshoot PAST fully
          // shut) rather than 0. bookOpenAnim never goes negative anywhere
          // else in the app; that negative value was the only thing that
          // ever drove HeroBook's coverRotateX below 0deg, and its two cover
          // faces (coverOuter/coverInner) both use backfaceVisibility:
          // 'hidden' — a combination that's flaky on RN once rotateX crosses
          // zero, which read on device as the cover flickering out and back.
          // Targeting 0 keeps the decisive snap without ever crossing zero.
          Animated.sequence([
            Animated.timing(bookOpenAnim, {
              toValue: 0,
              duration: PW.motion.heroBook.overshootMs,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bookOpenAnim, {
              toValue: 0.02, // tiny recoil settle, proportional to heroBook's settleAngle/openAngle ratio
              duration: PW.motion.heroBook.settleMs,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bookOpenAnim, {
              toValue: 0,
              duration: PW.motion.heroBook.settleMs,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 360, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
        ]);
        bookOpenAnimationRef.current.start();
      },
      onHauntedSequence({ isHaunt: hauntFail, failedMaskId }) {
        if (hauntFail) {
        // ── Returning Haunt path — existing STILL HAUNTED sequence, unchanged ──
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
        return;
        }
        if (!isBoss) return;
        // ── Boss path — same shape of beat as the master close (one decisive
        // motion, not the 12-phase sequence) but a different physical quality:
        // the mastered close is a spring with bounce-settle, this is a slower
        // 420ms ease with no overshoot. No flash, no stamp: colour drains, it
        // does not travel.
        playSfx('bookClose');
        Haptics.cueAsync('bossHaunted');
        triggerBoardShake();
        // Cancel any in-flight composite (e.g. a gauntlet pulse parked in
        // its Animated.delay) before driving these shared values directly —
        // otherwise its queued final leg fires later and fights this beat.
        bookOpenAnimationRef.current?.stop();
        bookOpenAnim.stopAnimation();
        bookIntakeGlowAnim.stopAnimation();
        bookGhostDrainOpacity.setValue(0);
        bookOpenAnimationRef.current = Animated.parallel([
          // Heavier and slower than the mastered spring, no overshoot — reads
          // as losing structure, not snapping shut.
          Animated.timing(bookOpenAnim, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.timing(bookGhostDrainOpacity, { toValue: 0.55, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]);
        bookOpenAnimationRef.current.start();
      },
      onOutcomeReveal(outcome) {
        playSfx(outcome === 'mastered' ? 'mastered' : 'haunted');
        if (outcome === 'haunted') triggerBoardShake();
        setShowOutcomeCard(false);
        setTimeout(() => setShowOutcomeCard(true), 350);
      },
      onLivesDepleted() {
        Animated.timing(deckRedTint, {
          toValue: 1, duration: 300, useNativeDriver: false,
        }).start();
      },
    },
  });

  const activeTopMaskId = mechanics.topMask?.id ?? null;
  activeTopMaskIdRef.current = activeTopMaskId;
  // The keyed measurement belongs only to the current top mask. An identity
  // mismatch synchronously renders the 152px minimum, so a long prior card
  // can never flash its stale height while the next card is being measured.
  const activeTileHeight = activeTileLayout.maskId === activeTopMaskId
    ? activeTileLayout.height
    : TILE_H;
  const cueLayoutIdentity = `${activeTopMaskId ?? 'none'}:${gridViewportWidth}:${fontScale}`;
  cueLayoutIdentityRef.current = cueLayoutIdentity;
  const activeCueMeasurements = cueTextMeasurements.identity === cueLayoutIdentity
    ? cueTextMeasurements
    : { upHeight: 0, rightHeight: 0 };

  useEffect(() => {
    if (mechanics.visibleGridMasks.length > 0) {
      setTilesReady(true);
    }
  }, [mechanics.visibleGridMasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const newTopId = mechanics.remainingMaskIds[0] ?? null;
    if (newTopId && newTopId !== prevTopIdRef.current) {
      prevTopIdRef.current = newTopId;
      cardPopCountRef.current += 1;
      if (cardPopCountRef.current > 1) {
        cardPopY.setValue(DECK_BACKING_OFFSET);
        Animated.timing(cardPopY, {
          toValue: 0,
          duration: 180,
          easing: CARD_SNAP,
          useNativeDriver: true,
        }).start(() => {
          Haptics.selectionAsync();
          mechanics.onDecisionReady();
        });
      }
    }
  }, [mechanics.remainingMaskIds]);

  const backingCardCount = mechanics.topMask
    ? Math.min(MAX_DECK_BACKING_CARDS, Math.max(0, mechanics.deckSize - 1))
    : 0;
  const backingCardWidth = Math.min(Math.max(containerWidth - 80, 0), 290);

  useEffect(() => {
    const backingIds = mechanics.remainingMaskIds.slice(1, 1 + backingCardCount).reverse();
    backingIds.forEach((maskId, index) => {
      const depth = backingCardCount - index;
      const anim = getBackingCardAnim(maskId, depth);
      Animated.timing(anim.depthY, { toValue: depth * DECK_BACKING_OFFSET, duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
      Animated.timing(anim.scale,  { toValue: 1 - depth * 0.01,            duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
      Animated.timing(anim.rotate, { toValue: depth * -1.3,                duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
    });
    // Garbage-collect cards that have left the deck entirely (claimed,
    // rejected, or judged wrong) so the map doesn't grow across a round.
    const liveIds = new Set(mechanics.remainingMaskIds);
    backingCardAnimsRef.forEach((_, maskId) => {
      if (!liveIds.has(maskId)) backingCardAnimsRef.delete(maskId);
    });
  }, [mechanics.remainingMaskIds, backingCardCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polly reactive triggers not tied to a presentation animation move to
  // useBoardMechanics; oneWrongMove stays wired here only through
  // perform.onLivesDepleted above, so the deck's red-tint reaction and its
  // Polly event share one trigger condition.

  // Reset guards and animated values on new word
  useEffect(() => {
    cardPopY.setValue(0);
    // The remaining-mask effect above has already observed the opening card
    // by the time this reset runs on mount. Preserve that identity explicitly
    // so card 2 is treated as a real deck advance and fires onDecisionReady;
    // resetting to null/0 left every card after the opener input-locked.
    const openingMaskId = mechanics.remainingMaskIds[0] ?? null;
    prevTopIdRef.current = openingMaskId;
    cardPopCountRef.current = openingMaskId ? 1 : 0;
    deckRedTint.setValue(0);
    deckSlamY.setValue(0);  // outer wrapper stays static
    const cardDelay = isBoss ? 1200 : 80;

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
          const deckEntranceKey = `${gameStepIndex}:${step.word}`;
          if (deckEntranceHapticRef.current !== deckEntranceKey) {
            deckEntranceHapticRef.current = deckEntranceKey;
            Haptics.selectionAsync();
          }
          mechanics.onDecisionReady();
        });
      }, 120);
    }, cardDelay);
    wordEntryTilt.setValue(0);
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.setValue(0);
    bookGhostDrainOpacity.setValue(0);
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
      const hauntEntranceKey = `${gameStepIndex}:${step.word}`;
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
    // Clamped: bookOpenAnim should never go negative (nothing animates it
    // below 0 anymore), but HeroBook's cover faces use backfaceVisibility:
    // 'hidden', which flickers on RN once rotateX crosses zero — clamp is a
    // defensive floor against ever rendering a negative angle here again.
    extrapolateLeft: 'clamp',
  });
  const bookIntakeGlowScale = bookOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
    extrapolateLeft: 'clamp', // this one must not go below 0.86 on overshoot
  });

  // Resuming directly into an already-haunted boss word sets gatePhase to
  // 'wrongFail' with no gauntlet tiles ever built (there's nothing left to
  // judge) — without the length guard this briefly mounts an empty
  // "0/0" gauntlet before the outcome overlay covers it.
  const showGauntletCard =
    mechanics.gatePhase === 'tiles' ||
    (mechanics.gatePhase === 'wrongFail' && mechanics.gauntletTiles.length > 0);
  const showSwipeCues =
    showBoardContent &&
    mechanics.gatePhase !== 'tiles' &&
    mechanics.gatePhase !== 'wrongFail' &&
    mechanics.topMask !== null;
  const activeCueLayout = resolveActiveCueLayout(
    activeTileHeight,
    activeCueMeasurements.upHeight,
    activeCueMeasurements.rightHeight,
  );
  const ownedGridRegionHeight = showGauntletCard
    ? activeGauntletTileHeight + GAUNTLET_HEADER_REGION_EXTRA
    : showSwipeCues
      ? activeCueLayout.ownedRegionHeight
      : activeTileHeight + 48;
  const boardSpacing = resolveBoardVerticalSpacing(
    gridViewportHeight,
    ownedGridRegionHeight,
    0,
  );
  const gridHasVerticalOverflow = hasBoardVerticalOverflow(
    gridViewportHeight,
    gridContentHeight,
  );
  const gridPaddingTop = Math.max(
    0,
    boardSpacing.gridPaddingTop - (showSwipeCues ? activeCueLayout.leadingCueRegionHeight : 0),
  );

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
      <BookLight tension={tension} isBoss={isBoss} />

      {mechanics.kicker && (
        isBoss ? (
          <Text style={styles.kickerBossFixed}>{mechanics.kicker}</Text>
        ) : (
          <Text style={styles.kickerFixed}>{mechanics.kicker}</Text>
        )
      )}

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
              setWordZoneMeasured(true);
            }
          );
        }}
      >

        {/* Book slide wrapper — entire book (shadow, pages, intake, cover) slides in/out as one unit.
            absoluteFill keeps the absolutely-positioned book children aligned to the word zone. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: Animated.add(bookSlideX, boardShakeX) },
              ],
            },
          ]}
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
              // FoilWord's 3-layer bevel recipe was tuned against the default
              // word size/font; at the boss word's larger size and heavier
              // `FONTS.bossWord` face, the deboss/catch-light layers stopped
              // registering as a subtle bevel and read as visibly doubled
              // letters instead (confirmed on device 2026-08-02). Reverted to
              // plain text rather than ship that; the gold-absorb/wrong-flash
              // overlays below don't have this problem since they're a single
              // flat layer, same technique the existing Haunt tint already
              // uses successfully over this same plain text.
              <Text
                style={[styles.word, styles.wordBoss]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Text>
            )}
            {/* Red flash overlay — wrong swipe danger signal */}
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.word,
                isBoss && styles.wordBoss,
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
        {/* CAUTION: this gate (wordOutcome === 'mastered') is also what mounts
            MasteredOutcomeOverlay elsewhere in this file — a full-screen scrim
            (zIndex 300, rgba(15,13,42,0.78)) that renders after the book in tree
            order. Once real art replaces bossOutcomeAssets.masterSeal, it will be
            covered by that scrim unless the gate changes to something that fires
            before the overlay mounts (e.g. mechanics.gatePhase === 'mastered',
            which flips earlier) or the render order changes. Untested today
            because masterSeal is null — do not assume this renders correctly
            once art lands without checking. */}
        {isBossStage && mechanics.wordOutcome === 'mastered' && bossOutcomeAssets.masterSeal && (
          <View pointerEvents="none" style={styles.bossMasterSeal}>
            <Image
              source={bossOutcomeAssets.masterSeal}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        )}
        </HeroBook>

        {/* Vault brand on spine — slides in with the book every round */}
        <Text
          pointerEvents="none"
          style={styles.vaultLabel}
        >
          WORD VAULT
        </Text>

        {/* Boss haunt only — colour drains from the book, it does not travel */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: libraryMaterial.ghostTint, opacity: bookGhostDrainOpacity }]} />
        </Animated.View>

        {/* Absorbed phrase flash */}
        {absorbedPhrase !== null && (
          <Animated.Text style={[styles.absorbedPhrase, { opacity: absorbedPhraseOpacity }]}>
            {absorbedPhrase}
          </Animated.Text>
        )}
      </View>

      {/* ── TILE ZONE ───────────────────────────────────────── */}
      <ScrollView
        style={styles.gridViewport}
        contentContainerStyle={[
          styles.gridWrap,
          {
            minHeight: ownedGridRegionHeight +
              gridPaddingTop + boardSpacing.gridPaddingBottom,
            paddingTop: gridPaddingTop,
            paddingBottom: boardSpacing.gridPaddingBottom,
          },
        ]}
        scrollEnabled={gridHasVerticalOverflow}
        showsVerticalScrollIndicator={gridHasVerticalOverflow}
        directionalLockEnabled
        removeClippedSubviews={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onLayout={event => {
          setGridViewportWidth(Math.ceil(event.nativeEvent.layout.width));
          setGridViewportHeight(Math.ceil(event.nativeEvent.layout.height));
        }}
        onContentSizeChange={(_width, height) => setGridContentHeight(Math.ceil(height))}
      >
        <View style={[styles.tileStackArea, { minHeight: ownedGridRegionHeight }]}>
          {showSwipeCues && (
            <Animated.View
              pointerEvents="none"
              style={[styles.swipeUpCueRegion, { opacity: cueOpacityAnim }]}
            >
              <Text
                key={`up-${cueLayoutIdentity}`}
                style={[styles.swipeCueText, styles.swipeUpCue]}
                onLayout={event => handleCueTextLayout('up', event.nativeEvent.layout.height)}
              >
                SWIPE UP TO CLAIM
              </Text>
            </Animated.View>
          )}
          {showBoardContent && (
          <Animated.View style={[styles.tileStack, { transform: [{ translateY: deckSlamY }] }]}>
            <Animated.View style={{ opacity: masterAllFadeAnim }}>
            {mechanics.gatePhase !== 'tiles' && mechanics.gatePhase !== 'wrongFail' && mechanics.topMask && (
              <View style={[styles.deckWrap, { minHeight: activeTileHeight + 18 }]}>
                {mechanics.remainingMaskIds.slice(1, 1 + backingCardCount).reverse().map((maskId, index) => {
                  const depth = backingCardCount - index;
                  const anim = getBackingCardAnim(maskId, depth);
                  const rotateDeg = anim.rotate.interpolate({ inputRange: [-6, 0], outputRange: ['-6deg', '0deg'] });
                  const backingMask = mechanics.visibleGridMasks.find(m => m.id === maskId);
                  return (
                    <Animated.View
                      key={maskId}
                      pointerEvents="none"
                      style={[
                        styles.deckBackingCard,
                        {
                          width: backingCardWidth,
                          opacity: deckBackingOp,
                          transform: [
                            { translateY: Animated.add(deckBackingY, anim.depthY) },
                            { scale: anim.scale },
                            { rotate: rotateDeg },
                          ],
                        },
                      ]}
                    >
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          { opacity: 1 - (depth - 1) * 0.12 },
                        ]}
                      >
                        <MaskCardArtwork />
                      </Animated.View>
                      {backingMask && (
                        <View style={styles.deckBackingPhrasePanel} pointerEvents="none">
                          <Text
                            style={styles.deckBackingPhrase}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {backingMask.phrase}
                          </Text>
                        </View>
                      )}
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
                  style={[styles.deckTopCardSlot, { minHeight: activeTileHeight }]}
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
                    tileHeight={TILE_H}
                    entryDelay={0}
                    skipEntryAnimation={
                      prevTopIdRef.current !== null && prevTopIdRef.current !== mechanics.topMask.id
                    }
                    onEffect={handleEffect}
                    onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
                    onPressHoldStart={() => playSfx('pressHoldStart')}
                    onExitComplete={() => {
                      mechanics.onTileExitComplete(mechanics.topMask!.id);
                    }}
                    onCardTouch={handleCardTouch}
                    onMeasuredHeightChange={handleActiveTileHeightChange}
                    wordY={wordZoneMeasured ? wordScreenY : undefined}
                    intakeY={wordZoneMeasured ? wordScreenY + 73 : undefined}
                  />
                </View>
                </Animated.View>
              </View>
            )}

            {showGauntletCard && (
              <View style={styles.finalHiddenTileStack}>
                <BossGauntletSpines
                  key={gauntletThrowKey}
                  gatePhase={mechanics.gatePhase}
                  gauntletTiles={mechanics.gauntletTiles}
                  finalTileStates={mechanics.finalTileStates}
                  activeGauntletTile={mechanics.activeGauntletTile}
                  tileLanded={mechanics.tileLanded}
                  inputLocked={mechanics.inputLocked}
                  onPick={(index) => {
                    playSfx('gauntletPick');
                    Haptics.cueAsync('gauntletPick');
                    mechanics.pickGauntletTile(index);
                  }}
                  onSwipeUp={mechanics.onGauntletSwipeUp}
                  onSwipeRight={mechanics.onGauntletSwipeRight}
                  onEffect={handleEffect}
                  onSwipeAttempt={onSwipeAttempt}
                  onCardTouch={handleCardTouch}
                  onActiveCardHeightChange={handleGauntletTileHeightChange}
                  wordY={wordZoneMeasured ? wordScreenY : undefined}
                  intakeY={wordZoneMeasured ? wordScreenY + 73 : undefined}
                  correctCount={gauntletCorrectCount}
                />
              </View>
            )}
            </Animated.View>
          </Animated.View>
          )}

          {showSwipeCues && (
            <Animated.View
              pointerEvents="none"
              style={[styles.swipeRightCueRegion, { opacity: cueOpacityAnim }]}
            >
              <Text
                key={`right-${cueLayoutIdentity}`}
                style={[styles.swipeCueText, styles.swipeRightCue]}
                onLayout={event => handleCueTextLayout('right', event.nativeEvent.layout.height)}
              >
                SWIPE RIGHT TO REJECT
              </Text>
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
      </ScrollView>


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
                playSfx('roundComplete');
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

      {mechanics.wordOutcome === 'mastered' && showOutcomeCard && (
        <MasteredOutcomeOverlay
          word={step.word}
          headline={isHaunt ? 'BANISHED' : 'MASTERED'}
          bonusLabel={mechanics.outcomeBonusLabel}
          onContinue={mechanics.continueOutcome}
        />
      )}

      {mechanics.wordOutcome === 'haunted' && showOutcomeCard && (
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
    overflow: 'visible',
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
    // Extra headroom so the chromed kickerBossFixed badge (restored padding
    // + border, see below) has clearance above the book instead of
    // overlapping its top edge. Kept on wordZone rather than lifting the
    // badge itself with a negative top: kickerBossFixed is a direct child
    // of this component's root container and must remain inside its
    // no-padding top edge. Pushing the zone down instead
    // keeps the whole badge inside the visible, unclipped area.
    marginTop: 26,
  },
  kickerFixed: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  kickerBossFixed: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    // top intentionally stays 0, not negative: this Text is a direct child
    // of the root container with no paddingTop, and the original negative
    // offset caused the "kicker never visible" bug. Clearance from the
    // book comes from wordZoneBoss's marginTop instead (see above).
    top: 0,
    left: 20,
    right: 20,
    zIndex: 5,
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
  gridViewport: {
    flex: 1,
    width: '100%',
    overflow: 'visible',
  },
  gridWrap: {
    flexGrow: 1,
    flexShrink: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    // Was 180 — left the deck sitting low enough to collide with the ground
    // torches (GraphicGround) and crowd Polly's speech bubble, both pinned
    // near the bottom of the screen. Pulled up to give both room.
    paddingTop: 110,
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
  swipeUpCueRegion: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
    zIndex: 3,
    elevation: 3,
  },
  swipeRightCueRegion: {
    width: '94%',
    alignItems: 'flex-end',
    marginTop: 0,
    paddingRight: 8,
    zIndex: 3,
    elevation: 3,
  },
  swipeCueText: {
    fontFamily: FONTS.label,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swipeUpCue: {
    color: '#F5C842',
    opacity: 0.92,
  },
  swipeRightCue: {
    width: 210,
    color: 'rgba(185,138,222,0.96)',
    opacity: 0.92,
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
    backgroundColor: 'transparent',
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  deckBackingPhrasePanel: {
    position: 'absolute',
    top: 0,
    left: '9%',
    right: '9%',
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 18,
  },
  deckBackingPhrase: {
    fontSize: 27,
    fontFamily: FONTS.tileCopy,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 31,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.76)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
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
  bossMasterSeal: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: 96,
    height: 96,
  },
});
