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

import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import * as Haptics from 'expo-haptics';
import { GhostMeaning, Mask, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';
import PollySprite from './ui/PollySprite';
import { POLLY_GAMEPLAY_SIZE, usePollyAnimator } from '../hooks/usePollyAnimator';
import { playRoundComplete } from '../utils/SoundEngine';
import { playSfx } from '../audio/sfx';
import { PW } from '../ui/pwTheme';
import { deckBackMaterial, heroPlaqueMaterial } from '../ui/pwMaterials';
import {
  HERO_BOOK_PERSPECTIVE,
  HERO_BOOK_SWING_INPUT_RANGE,
  HERO_BOOK_SWING_OUTPUT_RANGE,
  HERO_BOOK_FADE_IN_MS,
  heroBookSetOpen,
  heroBookSwingShut,
  heroBookSwingOpen,
} from '../ui/heroBookMotion';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 6;
const TILE_H     = 152;
const FINAL_TILE_H = 72;
const FINAL_TILE_GAP = 10;
const FINAL_TILE_RELEASE_OFFSET_Y = 190;
const TILE_INSET = 16;
const MAX_DECK_BACKING_CARDS = 4;
const DECK_BACKING_OFFSET = 6;
const DECK_BACKING_COLORS = [
  PW.color.surfaceRaised,
  PW.color.surfaceBase,
  'rgba(15,13,42,0.88)',
  'rgba(11,9,32,0.82)',
] as const;
const DECK_BACKING_BORDER_COLORS = [
  PW.color.purpleSoft,
  'rgba(123,45,139,0.30)',
  'rgba(245,200,66,0.14)',
  'rgba(255,255,255,0.07)',
] as const;

type FloatEntry = { id: number; value: number; x: number; y: number; color: string };

type BurstEntry = { id: number; x: number; y: number; count?: number };

function Burst({ x, y, count = 14 }: { x: number; y: number; count?: number }) {
  const shards = useRef(
    Array.from({ length: count }, (_, i) => {
      const baseAngle = (360 / count) * i + (Math.random() - 0.5) * 30;
      const rightBias = 30;
      const angle = ((baseAngle + rightBias) * Math.PI) / 180;
      const speed = 180 + Math.random() * 160;
      return {
        angle,
        speed,
        w: 6 + Math.random() * 8,
        h: 18 + Math.random() * 18,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        color: Math.random() > 0.5 ? '#7B2D8B' : '#9B2D6B',
        anim: new Animated.Value(0),
      };
    })
  ).current;

  useEffect(() => {
    Animated.parallel(
      shards.map(s =>
        Animated.timing(s.anim, {
          toValue: 1,
          duration: 800 + Math.random() * 100,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {shards.map((s, i) => {
        const translateX = s.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(s.angle) * s.speed],
        });
        const translateY = s.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(s.angle) * s.speed + 120],
        });
        const opacity = s.anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 1, 0],
        });
        const rotate = s.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${s.rot}deg`, `${s.rot + s.rotSpeed * 60}deg`],
        });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: x - s.w / 2,
              top: y - s.h / 2,
              width: s.w,
              height: s.h,
              borderRadius: 2,
              backgroundColor: s.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </>
  );
}

function easeOutBack(t: number, overshoot: number): number {
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}

type ShockwaveProps = { boardWidth: number; onDone: () => void };
function BossShockwave({ boardWidth, onDone }: ShockwaveProps) {
  const [p, setP]      = useState(0);
  const startRef       = useRef<number | null>(null);
  const rafRef         = useRef<number>(0);
  const DURATION       = 600;
  const cx             = boardWidth / 2;
  const cy             = 76;

  useEffect(() => {
    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const np = Math.min((now - startRef.current) / DURATION, 1);
      setP(np);
      if (np < 1) rafRef.current = requestAnimationFrame(tick);
      else onDone();
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const r1p     = Math.min(p / 0.8, 1);
  const r1scale = 0.4 + r1p * 5.1;
  const r1op    = (1 - r1p) * (1 - r1p);

  const r2raw   = (p - 0.133) / 0.633;
  const r2p     = Math.max(0, Math.min(r2raw, 1));
  const r2scale = 0.4 + r2p * 2.8;
  const r2op    = 0.6 * (1 - r2p * r2p);

  const DUST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315].map(a => a * Math.PI / 180);
  const dustP    = Math.min(p / 0.75, 1);
  const dustEase = dustP * (2 - dustP);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
    >
      <View style={{
        position: 'absolute',
        left: cx - 30, top: cy - 30,
        width: 60, height: 60, borderRadius: 30,
        borderWidth: 2.5, borderColor: 'rgba(245,200,66,0.9)',
        opacity: r1op, transform: [{ scale: r1scale }],
      }} />
      {r2p > 0 && (
        <View style={{
          position: 'absolute',
          left: cx - 30, top: cy - 30,
          width: 60, height: 60, borderRadius: 30,
          borderWidth: 1.5, borderColor: 'rgba(123,45,139,0.8)',
          opacity: r2op, transform: [{ scale: r2scale }],
        }} />
      )}
      {DUST_ANGLES.map((angle, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: cx + Math.cos(angle) * (50 + i * 8) * dustEase - 3,
          top:  cy + Math.sin(angle) * (50 + i * 8) * dustEase - 3,
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: i % 2 === 0 ? '#F5C842' : 'rgba(255,255,255,0.8)',
          opacity: (1 - dustP) * 0.8,
        }} />
      ))}
    </View>
  );
}

type Props = {
  step: WordStep;
  spawnEffect?: (type: 'shard' | 'trail', x: number, y: number) => void;
  onTrapCaught?: () => void;
  onWrongSwipe?: () => void;
};

function eventKicker(step: WordStep): string | null {
  if (step.eventType === 'bossWord')  return "POLLY'S WORD · 2× SCORE";
  if (step.eventType === 'slangDrop') return 'SLANG DROP';
  return null;
}

type ResolvedTileState = 'correct' | 'trap-caught' | 'wrong';
type WordOutcomeState = 'none' | 'mastered' | 'haunted';

type OutcomeOverlayProps = {
  word: string;
  bonusLabel?: string;
  detail?: string;
  onContinue: () => void;
};

function MasteredOutcomeOverlay({ word, bonusLabel, onContinue }: OutcomeOverlayProps) {
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
        <Text style={[styles.outcomeHeadline, styles.masteredOutcomeHeadline]}>MASTERED</Text>
        <Text style={styles.outcomeWord} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.64}>
          {word}
        </Text>
        <View style={styles.outcomeCopyBlock}>
          <Text style={styles.outcomeCopy}>Every meaning reclaimed.</Text>
          <Text style={styles.outcomeCopy}>Vault strengthened.</Text>
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
          <Text style={styles.outcomeCopy}>Polly stole a meaning.</Text>
          <Text style={styles.outcomeCopy}>It'll be back.</Text>
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

function buildInitialTileStates(step: WordStep): Map<string, SwipeMaskState> {
  const states = new Map<string, SwipeMaskState>();
  step.masks.forEach(mask => states.set(mask.id, 'idle'));
  return states;
}

export function MaskBoard({ step, spawnEffect, onTrapCaught, onWrongSwipe }: Props) {
  const store   = useGameStore();
  const isBoss  = step.eventType === 'bossWord';
  const isHaunt = step.isHauntReturn === true;
  const kicker    = eventKicker(step);

  // Stale-closure-safe refs
  const streakRef = useRef(store.game.streak);
  streakRef.current = store.game.streak;
  const livesRef = useRef(store.game.lives);
  livesRef.current = store.game.lives;

  // ── Polly animator ────────────────────────────────────────────
  const {
    currentPose,
    currentSpeechLine,
    speechLineVisible,
    firePollyEvent,
    ghostTintOpacity,
    pollyAnimatedStyle,
    pollyVisible,
    perchSide,
    pollyPositionStyle,
  } = usePollyAnimator(store.game.streak, store.game.lives, store.game.stepIndex);

  // ── tile state map ───────────────────────────────────────────
  const [tileStates, setTileStates] = useState<Map<string, SwipeMaskState>>(() => buildInitialTileStates(step));

  // ── 14-shard burst system ────────────────────────────────────
  const [bursts, setBursts] = useState<BurstEntry[]>([]);
  const burstIdRef = useRef(0);

  const completedRef          = useRef(false);
  const gateTriggeredRef      = useRef(false);
  const ghostJudgedCorrectRef = useRef(false);
  const wrongSwipeOccurred    = useRef(false);
  const mysteryIsRealRef      = useRef(true);
  const gapLockedRef          = useRef(false);
  const tileIndexInWordRef    = useRef(0);

  const ghost = store.runStartGhostWordIds.includes(step.word)
    ? store.ghosts.find((g: GhostMeaning) => g.wordId === step.word) ?? null
    : null;

  // ── layout ───────────────────────────────────────────────────
  const [containerWidth, setContainerWidth] = useState(350);
  const containerWidthRef                   = useRef(350);
  const containerRef  = useRef<View>(null);
  const wordZoneRef   = useRef<View>(null);
  const [wordScreenY, setWordScreenY] = useState(180);

  const visibleGridMasks = (store.game.shuffledMasks[store.game.stepIndex] ?? step.masks)
    .filter(m => !m.isHidden);

  // ── Deck state ────────────────────────────────────────────────
  const [remainingMaskIds, setRemainingMaskIds] = useState<string[]>(() =>
    visibleGridMasks.map(m => m.id)
  );
  const prevTopIdRef = useRef<string | null>(null);
  const cardPopCountRef = useRef(0);

  useEffect(() => {
    const newTopId = remainingMaskIds[0] ?? null;
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
  }, [remainingMaskIds]);

  const topMaskId    = remainingMaskIds[0] ?? null;
  const topMask      = topMaskId
    ? visibleGridMasks.find(m => m.id === topMaskId) ?? null
    : null;
  const deckSize     = remainingMaskIds.length;
  const nearMastery  = !isBoss && deckSize <= 2 && deckSize > 0;
  const topMaskState = topMask ? tileStates.get(topMask.id) ?? 'idle' : 'idle';
  const showBackingCards =
    topMaskState === 'idle' || topMaskState === 'hidden' || topMaskState === 'revealed';
  const backingCardCount =
    topMask && showBackingCards
      ? Math.min(MAX_DECK_BACKING_CARDS, Math.max(0, deckSize - 1))
      : 0;
  const backingCardWidth = Math.min(Math.max(containerWidth - 56, 0), 340);

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

  // ── find counts ──────────────────────────────────────────────
  const realMasks  = visibleGridMasks.filter(m => m.isReal);
  const foundCount = realMasks.filter(m => tileStates.get(m.id) === 'correct').length;

  // ── word absorption ──────────────────────────────────────────
  const absorptionScale       = useRef(new Animated.Value(1)).current;
  const ringScale             = useRef(new Animated.Value(1)).current;
  const ringOpacity           = useRef(new Animated.Value(0)).current;
  const wordEntryOpacity      = useRef(new Animated.Value(0)).current;
  const wordEntryScale        = useRef(new Animated.Value(0.85)).current;
  const wordEntryTranslateY   = useRef(new Animated.Value(0)).current;
  const wordEntryTilt         = useRef(new Animated.Value(0)).current;
  const wordLockPulse         = useRef(new Animated.Value(1)).current;
  const wordSwingX            = useRef(new Animated.Value(0)).current; // rotateX degrees, native driver
  const bookOpenAnim          = useRef(new Animated.Value(0)).current;  // useNativeDriver: true
  const wordEntranceHapticRef = useRef<string | null>(null);
  const transitionLabelOpacity = useRef(new Animated.Value(0)).current;
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
  const goldTextOpacity       = useRef(new Animated.Value(0)).current;
  const [absorbedPhrase, setAbsorbedPhrase] = useState<string | null>(null);

  // ── wrong-swipe word recoil ───────────────────────────────────
  const wordRecoilY     = useRef(new Animated.Value(0)).current;  // useNativeDriver:false
  const wordRecoilScale = useRef(new Animated.Value(1)).current;  // useNativeDriver:false
  const wordRedOpacity  = useRef(new Animated.Value(0)).current;  // useNativeDriver:false
  const recoilRafRef    = useRef<number | null>(null);

  // ── mastery shards ────────────────────────────────────────────
  type MasteryShard = {
    angle: number; speed: number;
    w: number; h: number;
    rot: number; rotSpeed: number;
    color: string;
  };

  const masteryShards = useRef<MasteryShard[]>(
    Array.from({ length: 16 }, (_, i) => ({
      angle:    ((360 / 16) * i + (Math.random() - 0.5) * 20) * Math.PI / 180,
      speed:    200 + Math.random() * 180,
      w:        6   + Math.random() * 8,
      h:        20  + Math.random() * 16,
      rot:      Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      color:    Math.random() > 0.5 ? '#7B2D8B' : '#9B2D6B',
    }))
  ).current;

  const masteryRafRef      = useRef<number | null>(null);
  const masteryStartRef    = useRef<number | null>(null);
  const [masteryProgress, setMasteryProgress] = useState(-1);

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

  function triggerWrongSwipeFeedback() {
    playSfx('trapWrong');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    firePollyEvent('wrong');
    triggerWrongWordRecoil();
    onWrongSwipe?.();
  }

  // ── boss entrance ─────────────────────────────────────────────
  const bossWordTranslateY = useRef(new Animated.Value(isBoss ? -300 : 0)).current;
  const bossShakeX         = useRef(new Animated.Value(0)).current;
  const bossSweepX         = useRef(new Animated.Value(-60)).current;
  const bossSweepOpacity   = useRef(new Animated.Value(0)).current;
  const badgeOpacity      = useRef(new Animated.Value(0)).current;
  const underlineProgress = useRef(new Animated.Value(0)).current;
  const [bossUnderlineVisible, setBossUnderlineVisible] = useState(false);
  // Boss squash/stretch (non-native, rAF setValue-driven)
  const bossScaleX         = useRef(new Animated.Value(isBoss ? 0.86 : 1)).current;
  const bossScaleY         = useRef(new Animated.Value(isBoss ? 1.16 : 1)).current;
  const bossEntranceRafRef = useRef<number | null>(null);
  const bossImpactRef      = useRef<number | null>(null);
  const [bossWordColor, setBossWordColor] = useState('#F5C842');
  const [bossShockwaveVisible, setBossShockwaveVisible] = useState(false);

  function triggerBookOpen() {
    bookOpenAnim.setValue(0);
    Animated.sequence([
      Animated.timing(bookOpenAnim, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bookOpenAnim, {
        toValue: 0,
        duration: 110,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }

  function triggerAbsorption(phrase: string) {
    triggerBookOpen();
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

  const [bossReady, setBossReady]             = useState(!isBoss);
  const [bossSweepActive, setBossSweepActive] = useState(false);
  const [tilesReady, setTilesReady]           = useState(false);

  // ── haunt entrance ────────────────────────────────────────────
  const [hauntReady, setHauntReady]           = useState(!isHaunt);
  const [hauntBannerVisible, setHauntBannerVisible] = useState(false);
  const [hauntBrokenVisible, setHauntBrokenVisible] = useState(false);
  const [stillHauntedVisible, setStillHauntedVisible] = useState(false);
  const wordHauntTintOpacity = useRef(new Animated.Value(0)).current;
  const hauntBannerOpacity   = useRef(new Animated.Value(0)).current;
  const hauntBrokenOpacity   = useRef(new Animated.Value(0)).current;
  const hauntBrokenScale     = useRef(new Animated.Value(0.7)).current;
  const stillHauntedOpacity  = useRef(new Animated.Value(0)).current;
  const stillHauntedScale    = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (visibleGridMasks.length > 0) {
      const id = setTimeout(() => setTilesReady(true), 50);
      return () => clearTimeout(id);
    }
  }, [visibleGridMasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function spawnFloat(value: number, maskId: string, color: string) {
    const refObj    = tileRefs.current.get(maskId);
    const view      = refObj ? refObj.current : null;
    const container = containerRef.current;

    if (view && container) {
      container.measure((_cx, _cy, _cw, _ch, cPageX, cPageY) => {
        view.measure((_x, _y, w, h, pageX, pageY) => {
          const id = ++floatIdRef.current;
          setFloats(prev => [...prev, {
            id, value, color,
            x: pageX - cPageX + w / 2,
            y: pageY - cPageY + h / 2,
          }]);
        });
      });
    } else {
      const id = ++floatIdRef.current;
      setFloats(prev => [...prev, { id, value, color, x: containerWidth / 2, y: 200 }]);
    }
  }

  function spawnFloatAtSplit(value: number, color = '#F5C842') {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, value, color, x: containerWidth / 2, y: 300 }]);
  }

  // ── Shard burst ───────────────────────────────────────────────
  function triggerShardBurst(centerX: number, centerY: number, count = 14) {
    const id = ++burstIdRef.current;
    setBursts(prev => [...prev, { id, x: centerX, y: centerY, count }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 1000);
  }

  function handleEffect(type: 'shard' | 'trail', pageX: number, pageY: number) {
    if (type === 'shard') {
      (containerRef.current as any)?.measure(
        (_x: number, _y: number, _w: number, _h: number, bx: number, by: number) => {
          triggerShardBurst(pageX - bx, pageY - by, 18);
        }
      );
    } else {
      spawnEffect?.(type, pageX, pageY);
    }
  }

  // ── master gate ───────────────────────────────────────────────
  const hasHidden = !!step.hiddenMeaning;

  const hiddenRealMask: Mask | null = step.hiddenMeaning
    ? { id: `${step.word}_hidden_real`, phrase: step.hiddenMeaning, isReal: true }
    : null;
  const hiddenTrapMask: Mask | null = step.hiddenMeaning
    ? { id: `${step.word}_hidden_trap`, phrase: step.hiddenTrap ?? 'Not this one', isReal: false }
    : null;

  // Gate phase
  const [gatePhase, setGatePhase] = useState<
    'locked' | 'tiles' | 'wrongFail' | 'mastered'
  >('locked');

  // Final tile states (replaces splitStates)
  const [finalTileStates, setFinalTileStates] = useState<Map<string, SwipeMaskState>>(new Map());
  const [releasedHiddenTileCount, setReleasedHiddenTileCount] = useState(0);
  const [landedHiddenTileCount, setLandedHiddenTileCount] = useState(0);
  const [failedHiddenTileId, setFailedHiddenTileId] = useState<string | null>(null);

  // Final tile drop (native: transform only)
  const splitTile1TransY  = useRef(new Animated.Value(FINAL_TILE_RELEASE_OFFSET_Y)).current;
  const splitCompletedRef = useRef(false);

  // Final tile border pulse (non-native)
  const finalBorder1Anim = useRef(new Animated.Value(0)).current;

  // Mastered celebration
  const masterHeroScale      = useRef(new Animated.Value(1)).current;
  const masterHeroTransY     = useRef(new Animated.Value(0)).current;
  const masterAllFadeAnim    = useRef(new Animated.Value(1)).current;
  // Phase-based mastery sequence
  const masteredLabelOpacity = useRef(new Animated.Value(0)).current;
  const goldSeedScale        = useRef(new Animated.Value(0)).current;
  const goldSeedTransY       = useRef(new Animated.Value(0)).current;
  const goldSeedTransX       = useRef(new Animated.Value(0)).current;
  const goldSeedRotate       = useRef(new Animated.Value(0)).current;
  const goldSeedTrailOpacity = useRef(new Animated.Value(0)).current;
  const goldBloomScale       = useRef(new Animated.Value(1)).current;
  const goldBloomOpacity     = useRef(new Animated.Value(0)).current;
  const masterCrackOpacity   = useRef(new Animated.Value(0)).current;
  const masterStampScale     = useRef(new Animated.Value(0.6)).current;
  const masterCoreOpacity    = useRef(new Animated.Value(0)).current;
  const systemStingerOpacity = useRef(new Animated.Value(0)).current;
  const systemStingerScale   = useRef(new Animated.Value(0.75)).current;
  const [masterStampVisible, setMasterStampVisible]   = useState(false);
  const [masteredLabelVisible, setMasteredLabelVisible] = useState(false);
  const [goldSeedVisible, setGoldSeedVisible]           = useState(false);
  const [goldBloomVisible, setGoldBloomVisible]         = useState(false);
  const [masterCracksVisible, setMasterCracksVisible]   = useState(false);
  const [systemStingerWord, setSystemStingerWord]       = useState<string | null>(null);
  const [wordOutcome, setWordOutcome] = useState<WordOutcomeState>('none');
  const [outcomeDetail, setOutcomeDetail] = useState<string | undefined>(undefined);
  const [outcomeBonusLabel, setOutcomeBonusLabel] = useState<string | undefined>(undefined);
  const outcomeContinueRef = useRef<(() => void) | null>(null);
  const outcomeActiveRef = useRef(false);

  // ── hesitation timers ─────────────────────────────────────────
  const hes1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hes2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hes3Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startHesitationTimers() {
    if (hes1Ref.current !== null) { clearTimeout(hes1Ref.current); hes1Ref.current = null; }
    if (hes2Ref.current !== null) { clearTimeout(hes2Ref.current); hes2Ref.current = null; }
    if (hes3Ref.current !== null) { clearTimeout(hes3Ref.current); hes3Ref.current = null; }
    hes1Ref.current = setTimeout(() => firePollyEvent('hesitation3s'), 3000);
    hes2Ref.current = setTimeout(() => firePollyEvent('hesitation6s'), 6000);
    hes3Ref.current = setTimeout(() => firePollyEvent('hesitation9s'), 9000);
  }

  function resetHesitation() {
    firePollyEvent('hesitationCleared');
    startHesitationTimers();
  }

  const showBoardContent = (!isBoss || bossReady) && tilesReady && (!isHaunt || hauntReady);

  useEffect(() => {
    if (!showBoardContent) return;
    startHesitationTimers();
    return () => {
      if (hes1Ref.current !== null) clearTimeout(hes1Ref.current);
      if (hes2Ref.current !== null) clearTimeout(hes2Ref.current);
      if (hes3Ref.current !== null) clearTimeout(hes3Ref.current);
    };
  }, [showBoardContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polly reactive triggers ───────────────────────────────────
  useEffect(() => {
    if (store.game.lives === 1) firePollyEvent('oneHeartLeft');
  }, [store.game.lives]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zero-feather red tint on deck depth cards
  useEffect(() => {
    if (store.game.lives === 0 && !completedRef.current) {
      Animated.timing(deckRedTint, {
        toValue: 1, duration: 300, useNativeDriver: false,
      }).start();
      firePollyEvent('oneWrongMove');
    }
  }, [store.game.lives]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (store.game.status === 'gameOver') firePollyEvent('gameOver');
  }, [store.game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (store.game.streak > 0 && store.game.streak % 10 === 0) {
      firePollyEvent('streakX10');
    }
  }, [store.game.streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset guards and animated values on new word
  useEffect(() => {
    wrongSwipeOccurred.current    = false;
    completedRef.current          = false;
    gateTriggeredRef.current      = false;
    ghostJudgedCorrectRef.current = false;
    splitCompletedRef.current     = false;
    mysteryIsRealRef.current      = true;
    setTileStates(buildInitialTileStates(step));
    // Deck reset
    const freshIds = (store.game.shuffledMasks[store.game.stepIndex] ?? step.masks)
      .filter((m: Mask) => !m.isHidden)
      .map((m: Mask) => m.id);
    setRemainingMaskIds(freshIds);
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
    bossShakeX.setValue(0);
    if (!isBoss) bossWordTranslateY.setValue(0);
    bossScaleX.setValue(isBoss ? 0.86 : 1);
    bossScaleY.setValue(isBoss ? 1.16 : 1);
    if (bossEntranceRafRef.current !== null) {
      cancelAnimationFrame(bossEntranceRafRef.current);
      bossEntranceRafRef.current = null;
    }
    bossImpactRef.current = null;
    setBossWordColor('#F5C842');
    setBossShockwaveVisible(false);
    goldTextOpacity.setValue(0);
    wordEntryTilt.setValue(0);
    wordSwingX.setValue(0);
    bookOpenAnim.setValue(0);
    wordRecoilY.setValue(0);
    wordRecoilScale.setValue(1);
    wordRedOpacity.setValue(0);

    // Gate reset
    setGatePhase('locked');
    setFinalTileStates(new Map());
    setReleasedHiddenTileCount(0);
    setLandedHiddenTileCount(0);
    setFailedHiddenTileId(null);
    setMasterStampVisible(false);
    splitTile1TransY.setValue(FINAL_TILE_RELEASE_OFFSET_Y);
    finalBorder1Anim.setValue(0);
    masterHeroScale.setValue(1);
    masterHeroTransY.setValue(0);
    masterAllFadeAnim.setValue(1);
    masteredLabelOpacity.setValue(0);
    goldSeedScale.setValue(0);
    goldSeedTransY.setValue(0);
    goldSeedTransX.setValue(0);
    goldSeedRotate.setValue(0);
    goldSeedTrailOpacity.setValue(0);
    goldBloomScale.setValue(1);
    goldBloomOpacity.setValue(0);
    masterCrackOpacity.setValue(0);
    masterStampScale.setValue(0.6);
    masterCoreOpacity.setValue(0);
    systemStingerOpacity.setValue(0);
    systemStingerScale.setValue(0.75);
    setMasteredLabelVisible(false);
    setGoldSeedVisible(false);
    setGoldBloomVisible(false);
    setMasterCracksVisible(false);
    setSystemStingerWord(null);
    setWordOutcome('none');
    setOutcomeDetail(undefined);
    setOutcomeBonusLabel(undefined);
    outcomeContinueRef.current = null;
    outcomeActiveRef.current = false;

    // Haunt resets
    setHauntReady(!isHaunt);
    setHauntBannerVisible(false);
    setHauntBrokenVisible(false);
    setStillHauntedVisible(false);
    wordHauntTintOpacity.setValue(0);
    hauntBannerOpacity.setValue(0);
    hauntBrokenOpacity.setValue(0);
    hauntBrokenScale.setValue(0.7);
    stillHauntedOpacity.setValue(0);
    stillHauntedScale.setValue(0.7);
    return () => clearTimeout(slamTimer);
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word title fade + scale in (non-boss)
  useEffect(() => {
    tileIndexInWordRef.current = 0;
    gapLockedRef.current = false;
    if (isBoss) return;
    wordEntryOpacity.setValue(0);
    wordEntryScale.setValue(0.85);
    wordEntryTranslateY.setValue(0);
    wordEntryTilt.setValue(0);
    wordLockPulse.setValue(1);

    if (isHaunt) {
      // Haunt entrance: double haptic + purple word tint + banner
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 180);

      wordHauntTintOpacity.setValue(0.75);
      Animated.parallel([
        Animated.timing(wordEntryOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(wordEntryScale,   { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
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
      // ── HERO BOOK COVER — SWING SHUT (word stays readable) ──
      wordEntryOpacity.setValue(0);
      wordEntryScale.setValue(1);
      wordEntryTranslateY.setValue(0);
      wordEntryTilt.setValue(0);
      wordLockPulse.setValue(1);
      heroBookSetOpen(wordSwingX);

      Animated.parallel([
        Animated.timing(wordEntryOpacity, {
          toValue: 1, duration: HERO_BOOK_FADE_IN_MS, easing: Easing.linear, useNativeDriver: true,
        }),
        heroBookSwingShut(wordSwingX),
      ]).start(() => {
        if (wordEntranceHapticRef.current !== step.word) {
          wordEntranceHapticRef.current = step.word;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Animated.sequence([
          Animated.timing(wordLockPulse, { toValue: 1.025, duration: 90, useNativeDriver: true }),
          Animated.timing(wordLockPulse, { toValue: 1.00, duration: 110, useNativeDriver: true }),
        ]).start();
      });
    }
    firePollyEvent('wordEntry');
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ghost Polly trigger
  useEffect(() => {
    if (ghost) firePollyEvent('ghostEntry');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Boss entrance sequence
  useEffect(() => {
    if (!isBoss) return;

    badgeOpacity.setValue(0);
    underlineProgress.setValue(0);
    setBossUnderlineVisible(false);

    // T+400ms — Shockwave + 3 heavy haptics
    const t1 = setTimeout(() => {
      setBossShockwaveVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 260);
    }, 400);

    // T+800ms — Boss word drops in + squash/stretch ignite
    const t2 = setTimeout(() => {
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);
      wordLockPulse.setValue(1);
      deckDeepY.setValue(0);    deckDeepRot.setValue(0);    deckDeepOp.setValue(1);
      deckMidY.setValue(0);     deckMidRot.setValue(0);     deckMidOp.setValue(1);
      deckActiveY.setValue(0);  deckActiveRot.setValue(0);  deckActiveOp.setValue(1);
      deckBackingY.setValue(0); deckBackingOp.setValue(1);

      Animated.spring(bossWordTranslateY, {
        toValue: 0, tension: 280, friction: 6, useNativeDriver: false,
      }).start();

      // Shake on land
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(bossShakeX, { toValue:  4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  0, duration: 30, useNativeDriver: true }),
        ]).start();

        // Squash/stretch + ignite
        bossImpactRef.current = performance.now ? performance.now() : Date.now();
        bossScaleX.setValue(1.32);
        bossScaleY.setValue(0.66);

        const SQUASH_DUR = 520;
        const IGNITE_DUR = 400;
        const TOTAL_DUR  = Math.max(SQUASH_DUR, IGNITE_DUR);
        let rafStart: number | null = null;

        function squashIgniteTick(now: number) {
          if (rafStart === null) rafStart = now;
          const elapsed = now - rafStart;
          if (elapsed <= SQUASH_DUR) {
            const k = easeOutBack(Math.min(elapsed / SQUASH_DUR, 1), 2.2);
            bossScaleX.setValue(1.32 - 0.32 * k);
            bossScaleY.setValue(0.66 + 0.34 * k);
          }
          if (elapsed <= IGNITE_DUR) {
            const sweep = Math.min(elapsed / 150, 1);
            const g = Math.round(255 + (215 - 255) * sweep);
            const b = Math.round(255 + (0   - 255) * sweep);
            setBossWordColor(`rgb(255,${g},${b})`);
          }
          if (elapsed < TOTAL_DUR) {
            bossEntranceRafRef.current = requestAnimationFrame(squashIgniteTick);
          } else {
            bossScaleX.setValue(1); bossScaleY.setValue(1);
            setBossWordColor('#F5C842');
            bossEntranceRafRef.current = null;
          }
        }
        bossEntranceRafRef.current = requestAnimationFrame(squashIgniteTick);
      }, 200);
    }, 800);

    // T+1000ms — Bloom sweep starts
    const t3 = setTimeout(() => {
      setBossSweepActive(true);
      bossSweepX.setValue(-80);
      bossSweepOpacity.setValue(1);

      // Badge reveals 200ms into sweep (bloom crosses badge position)
      setTimeout(() => {
        Animated.timing(badgeOpacity, {
          toValue: 1, duration: 180, useNativeDriver: true,
        }).start();
      }, 200);

      // Underline starts tracing 100ms into sweep
      setTimeout(() => {
        setBossUnderlineVisible(true);
        underlineProgress.setValue(0);
        Animated.timing(underlineProgress, {
          toValue: 1, duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start(() => {
          // Slight haptic on underline complete
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        });
      }, 100);

      Animated.timing(bossSweepX, {
        toValue: containerWidthRef.current + 80,
        duration: 520,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(bossSweepOpacity, {
          toValue: 0, duration: 120, useNativeDriver: true,
        }).start(() => {
          setBossSweepActive(false);
          firePollyEvent('bossEntry');
          setBossReady(true);
        });
      });
    }, 1000);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (bossEntranceRafRef.current !== null) {
        cancelAnimationFrame(bossEntranceRafRef.current);
        bossEntranceRafRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gate sequence ─────────────────────────────────────────────

  function triggerFinalTilesDrop() {
    if (!hiddenRealMask || !hiddenTrapMask) return;
    const useReal = Math.random() < 0.5;
    mysteryIsRealRef.current = useReal;
    const mysteryMask = useReal ? hiddenRealMask : hiddenTrapMask;

    setGatePhase('tiles');
    setFinalTileStates(new Map([[mysteryMask.id, 'idle']]));
    setReleasedHiddenTileCount(1);
    setLandedHiddenTileCount(0);
    splitTile1TransY.setValue(FINAL_TILE_RELEASE_OFFSET_Y);
    finalBorder1Anim.setValue(0);

    Animated.spring(splitTile1TransY, {
      toValue: 0, damping: 13, stiffness: 150, useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setLandedHiddenTileCount(1);
      Animated.sequence([
        Animated.timing(finalBorder1Anim, { toValue: 0.55, duration: 120, useNativeDriver: false }),
        Animated.timing(finalBorder1Anim, { toValue: 1.0, duration: 220, useNativeDriver: false }),
      ]).start();
    });
  }

  function buildHauntedDetail(failedMaskId?: string): string | undefined {
    if (failedMaskId === hiddenRealMask?.id && hiddenRealMask) {
      return `Missed: ${hiddenRealMask.phrase}`;
    }
    if (failedMaskId === hiddenTrapMask?.id && hiddenTrapMask) {
      return `Trap claimed: ${hiddenTrapMask.phrase}`;
    }

    const missedReal = visibleGridMasks.find(m => m.isReal && tileStates.get(m.id) === 'wrong');
    if (missedReal) return `Missed: ${missedReal.phrase}`;

    const acceptedTrap = visibleGridMasks.find(m => !m.isReal && tileStates.get(m.id) === 'wrong');
    if (acceptedTrap) return `Trap claimed: ${acceptedTrap.phrase}`;

    if (ghost?.isGhostedMaster) return 'Still haunted.';
    return undefined;
  }

  function showWordOutcome(
    outcome: Exclude<WordOutcomeState, 'none'>,
    options: { detail?: string; bonusLabel?: string },
    onContinue: () => void
  ) {
    if (outcomeActiveRef.current) return;
    outcomeActiveRef.current = true;
    playSfx(outcome === 'mastered' ? 'mastered' : 'haunted');
    setOutcomeDetail(options.detail);
    setOutcomeBonusLabel(options.bonusLabel);
    setWordOutcome(outcome);
    outcomeContinueRef.current = () => {
      outcomeContinueRef.current = null;
      outcomeActiveRef.current = false;
      setWordOutcome('none');
      setOutcomeDetail(undefined);
      setOutcomeBonusLabel(undefined);
      onContinue();
    };
  }

  function continueOutcome() {
    outcomeContinueRef.current?.();
  }

  function triggerWrongFail(failedMaskId: string) {
    if (splitCompletedRef.current) return;
    splitCompletedRef.current = true;
    completedRef.current = true;
    wrongSwipeOccurred.current = true;
    setGatePhase('wrongFail');
    setFailedHiddenTileId(failedMaskId);
    firePollyEvent('hiddenMasterFailed');
    triggerShardBurst(containerWidthRef.current / 2, wordScreenY + 110, 14);

    if (isHaunt) {
      setTimeout(() => {
        setStillHauntedVisible(true);
        stillHauntedOpacity.setValue(0);
        stillHauntedScale.setValue(0.7);
        Animated.parallel([
          Animated.timing(stillHauntedOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.spring(stillHauntedScale, { toValue: 1.0, damping: 7, stiffness: 280, useNativeDriver: true }),
        ]).start();
        firePollyEvent('hauntFailed');
        setTimeout(() => {
          Animated.timing(stillHauntedOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
          setTimeout(() => setStillHauntedVisible(false), 240);
        }, 1400);
      }, 400);
    }

    setTimeout(() => {
      showWordOutcome(
        'haunted',
        { detail: buildHauntedDetail(failedMaskId) },
        () => {
          store.addGhostedMaster(step.word);
          store.completeWord();
        }
      );
    }, 800);
  }

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

  function triggerMastered() {
    store.recordMastery(step.word, isBoss, step.hiddenMeaning ?? '');
    if (isHaunt) store.clearGhost(step.word);
    setGatePhase('mastered');
    completedRef.current = true;
    const masteryPoints = Math.round(600 * store.game.chainMultiplier);
    store.submitBossMastery();
    spawnFloatAtSplit(masteryPoints, '#F5C842');
    setMasterStampVisible(true);
    setMasteredLabelVisible(false);
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
    setTimeout(() => {
      setMasteredLabelVisible(true);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(masteredLabelOpacity, { toValue: 1, duration: 110, useNativeDriver: true }),
          Animated.spring(masterStampScale, { toValue: 1.18, damping: 6, stiffness: 260, useNativeDriver: true }),
        ]),
        Animated.spring(masterStampScale, { toValue: 1.0, damping: 8, stiffness: 220, useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 360);

    // Haunt broken stinger — T+460ms (after stamp slam at T+360ms)
    if (isHaunt) {
      setTimeout(() => {
        setHauntBrokenVisible(true);
        hauntBrokenOpacity.setValue(0);
        hauntBrokenScale.setValue(0.7);
        Animated.parallel([
          Animated.timing(hauntBrokenOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.spring(hauntBrokenScale, { toValue: 1.0, damping: 6, stiffness: 300, useNativeDriver: true }),
        ]).start();
        setTimeout(() => {
          Animated.timing(hauntBrokenOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          setTimeout(() => setHauntBrokenVisible(false), 220);
        }, 560);
      }, 460);
    }

    // Phase 3 — T+800ms: MASTERED label appears below word
    setTimeout(() => {
      setMasterCracksVisible(true);
      masterCrackOpacity.setValue(0);
      Animated.timing(masterCrackOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      triggerShardBurst(containerWidthRef.current / 2, wordScreenY + crashDistance, 16);
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

    // Phase 5 — T+1300ms: Crystal shard burst + Polly + haptic
    setTimeout(() => {
      triggerShardBurst(containerWidthRef.current / 2, 40, 16);
      masteryStartRef.current = null;
      setMasteryProgress(0);
      function masteryTick(now: number) {
        if (masteryStartRef.current === null) masteryStartRef.current = now;
        const mp = Math.min((now - masteryStartRef.current) / 900, 1);
        setMasteryProgress(mp);
        if (mp < 1) masteryRafRef.current = requestAnimationFrame(masteryTick);
        else { masteryRafRef.current = null; setMasteryProgress(-1); }
      }
      masteryRafRef.current = requestAnimationFrame(masteryTick);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playRoundComplete();
    }, 1300);

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
      firePollyEvent(isBoss ? 'gateMasteredBoss' : 'gateMastered');
      if (isBoss) {
        playSystemStingerWord('BINGO', 1.0);
        setTimeout(() => playSystemStingerWord('BANGO', 1.08), 430);
        setTimeout(() => playSystemStingerWord('ZZZZINGO!', 1.28), 900);
      }
    }, 2600);

    // Restore dim before transition
    setTimeout(() => {
      Animated.timing(masteredLabelOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      Animated.timing(masterCrackOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      Animated.timing(masterAllFadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    }, isBoss ? 4050 : 3200);

    // Phase 9 — T+2700ms: Hold (silence)

    // Phase 10 — T+3000ms: Transition
    setTimeout(() => {
      setMasteredLabelVisible(false);
      setMasterCracksVisible(false);
      setSystemStingerWord(null);
      showWordOutcome(
        'mastered',
        { bonusLabel: isBoss ? `BOSS MASTERY +${masteryPoints}` : undefined },
        () => {
          if (!ghostJudgedCorrectRef.current) store.clearGhost(step.word);
          store.completeWord();
        }
      );
    }, isBoss ? 4300 : 3450);
  }

  function triggerWordExit(onComplete: () => void, perfect?: boolean) {
    badgeOpacity.setValue(0);
    underlineProgress.setValue(0);
    setBossUnderlineVisible(false);
    if (perfect) {
      setTransitionLabel('CLEAR');
      transitionLabelOpacity.setValue(0);
      Animated.timing(transitionLabelOpacity, {
        toValue: 1, duration: 100, useNativeDriver: true,
      }).start();
    }

    // Hold 320ms then shoot up
    const EXIT_IN = Easing.bezier(0.36, 0.00, 0.66, 0.00);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(wordEntryOpacity, {
          toValue: 0, duration: 260, easing: EXIT_IN, useNativeDriver: true,
        }),
        heroBookSwingOpen(wordSwingX, EXIT_IN),
        Animated.timing(transitionLabelOpacity, {
          toValue: 0, duration: 160, useNativeDriver: true,
        }),
      ]).start();
    }, 320);

    setTimeout(() => {
      setTransitionLabel(null);
      onComplete();
    }, 700);
  }

  function handleFinalTileSwipeUp(maskId: string) {
    if (wordOutcome !== 'none') return;
    resetHesitation();
    const isReal = mysteryIsRealRef.current;
    if (isReal) {
      splitCompletedRef.current = true;
      setFinalTileStates(prev => new Map(prev).set(maskId, 'correct'));
      if (hiddenRealMask) triggerAbsorption(hiddenRealMask.phrase);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => triggerMastered(), 200);
    } else {
      wrongSwipeOccurred.current = true;
      triggerWrongSwipeFeedback();
      store.submitWrongSwipe();
      setFinalTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      triggerWrongFail(maskId);
    }
  }

  function handleFinalTileSwipeRight(maskId: string) {
    if (wordOutcome !== 'none') return;
    resetHesitation();
    const isReal = mysteryIsRealRef.current;
    if (!isReal) {
      splitCompletedRef.current = true;
      playSfx('trapShatter');
      setFinalTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => triggerMastered(), 200);
    } else {
      wrongSwipeOccurred.current = true;
      triggerWrongSwipeFeedback();
      store.submitWrongSwipe();
      setFinalTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      triggerWrongFail(maskId);
    }
  }

  // ── completion check ─────────────────────────────────────────
  useEffect(() => {
    if (completedRef.current || gateTriggeredRef.current) return;
    if (remainingMaskIds.length > 0) return;

    // Deck empty — all tiles judged (correct, trap-caught, or wrong)
    const perfect = !wrongSwipeOccurred.current;

    if (isBoss) {
      if (perfect && hasHidden) {
        gateTriggeredRef.current = true;
        firePollyEvent('allMasksFound');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          triggerFinalTilesDrop();
        }, 600);
      } else {
        // Boss escaped — wrong swipes closed the gate
        // Silent: no overlay, no ghost, just advance
        gateTriggeredRef.current = true;
        completedRef.current = true;
        store.completeWord();
      }
    } else {
      // Non-boss words 1–11: always just complete, no gate ever
      gateTriggeredRef.current = true;
      if (perfect) firePollyEvent('cleanSweep');
      triggerWordExit(() => store.completeWord(), perfect);
    }
  }, [remainingMaskIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── swipe handlers ────────────────────────────────────────────
  const GOLD_STEPS_LOCAL = [0, 0.25, 0.55, 0.80, 1.0] as const;

  function computeGapMs(
    combo: number,
    resolution: 'up' | 'right' | 'wrong',
    bossWord: boolean,
    tileIndex: number,
  ): number {
    let gap = 350;
    // Combo modifier
    if      (combo <= 3)  gap += 100;
    else if (combo <= 6)  gap += 0;
    else if (combo <= 9)  gap -= 80;
    else                  gap -= 150;
    // Resolution type
    if      (resolution === 'right') gap -= 50;
    else if (resolution === 'wrong') gap += 150;
    // Boss modifier
    if (bossWord) gap -= 100;
    // Per-tile escalation: each tile within a word tightens the gap
    gap -= Math.min(tileIndex * 18, 90);
    return Math.min(Math.max(gap, 150), 500);
  }

  function handleSwipeUp(maskId: string) {
    if (wordOutcome !== 'none') return;
    if (gapLockedRef.current) return;
    resetHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (mask.isReal) {
      const baseUp = mask.isRare ? 300 : 100;
      const chainMult = Math.min(1 + Math.floor((store.game.streak + 1) / 3) * 0.5, 3.0);
      const upPoints = Math.round(baseUp * chainMult * (isBoss ? 2 : 1));
      store.submitSwipeUp(maskId);
      spawnFloat(upPoints, maskId, '#F5C842');
      triggerAbsorption(mask.phrase);

      const nextFound = realMasks.filter(m =>
        tileStates.get(m.id) === 'correct' || m.id === maskId
      ).length;
      Animated.timing(goldTextOpacity, {
        toValue: GOLD_STEPS_LOCAL[Math.min(nextFound, GOLD_STEPS_LOCAL.length - 1)],
        duration: 400,
        useNativeDriver: true,
      }).start();

      setTileStates(prev => new Map(prev).set(maskId, 'correct'));
      firePollyEvent('correct');
      const gapUp = computeGapMs(store.game.combo, 'up', isBoss, tileIndexInWordRef.current);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapUp);
    } else {
      // Wrong swipe — UP on trap
      wrongSwipeOccurred.current = true;
      triggerWrongSwipeFeedback();
      store.submitWrongSwipe();
      // Tile exits permanently — no retry
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      const gapWrong = computeGapMs(store.game.combo, 'wrong', isBoss, tileIndexInWordRef.current);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapWrong);
    }
  }

  function handleSwipeRight(maskId: string) {
    if (wordOutcome !== 'none') return;
    if (gapLockedRef.current) return;
    resetHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (!mask.isReal) {
      playSfx('trapShatter');
      const chainMultTrap = Math.min(1 + Math.floor((store.game.streak + 1) / 3) * 0.5, 3.0);
      const trapPoints = Math.round((isBoss ? 100 : 50) * chainMultTrap);
      store.submitSwipeDown(maskId);
      spawnFloat(trapPoints, maskId, '#7B2D8B');
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
      onTrapCaught?.();
      const gapRight = computeGapMs(store.game.combo, 'right', isBoss, tileIndexInWordRef.current);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapRight);
    } else {
      // Wrong swipe — RIGHT on real meaning
      wrongSwipeOccurred.current = true;
      triggerWrongSwipeFeedback();
      store.submitWrongSwipe();
      // Tile exits permanently — no retry
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      const gapWrongR = computeGapMs(store.game.combo, 'wrong', isBoss, tileIndexInWordRef.current);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapWrongR);
    }
  }

  // ── render ────────────────────────────────────────────────────
  const wordCoreRotate = goldSeedRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });
  const masteryWordCenterY = Math.max(170, Dimensions.get('window').height * 0.48);
  const vaultBloomX = Math.max(28, containerWidth - 86);
  const mysteryMask = mysteryIsRealRef.current ? hiddenRealMask : hiddenTrapMask;
  const inputLocked = wordOutcome !== 'none';

  const deckActiveRotDeg = deckActiveRot.interpolate({ inputRange: [-4, 0, 4], outputRange: ['-4deg', '0deg', '4deg'] });
  const wordEntryTiltDeg = wordEntryTilt.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '0deg', '5deg'] });
  const wordSwingXDeg = wordSwingX.interpolate({
    inputRange: [...HERO_BOOK_SWING_INPUT_RANGE],
    outputRange: [...HERO_BOOK_SWING_OUTPUT_RANGE],
  });

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: bossShakeX }] }]}
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
        <View style={[styles.wordStageOuterFrame, heroPlaqueMaterial.rim]} pointerEvents="none" />
        <View style={[styles.wordStageFrame, heroPlaqueMaterial.base]} pointerEvents="none" />
        <View style={[styles.wordStageInnerBevel, heroPlaqueMaterial.rim]} pointerEvents="none" />
        <View style={styles.wordStageChamferTL} pointerEvents="none" />
        <View style={styles.wordStageChamferTR} pointerEvents="none" />
        <Animated.View
          pointerEvents="none"
          style={[styles.wordStageChamferBL, {
            transform: [{
              translateY: bookOpenAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
            }],
          }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.wordStageChamferBR, {
            transform: [{
              translateY: bookOpenAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
            }],
          }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.wordStagePageEdge1, {
            transform: [{
              translateY: bookOpenAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 10],
              }),
            }],
          }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.wordStagePageEdge2, {
            transform: [{
              translateY: bookOpenAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 14],
              }),
            }],
          }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.wordStagePageEdge3, {
            transform: [{
              translateY: bookOpenAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 18],
              }),
            }],
          }]}
        />
        <View style={[heroPlaqueMaterial.underGlow, styles.wordStageUnderlight]} pointerEvents="none" />

        {/* Boss gold sweep */}
        {bossSweepActive && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View
              style={{
                position: 'absolute', top: 0, bottom: 0, width: 160,
                opacity: bossSweepOpacity,
                transform: [{ translateX: bossSweepX }],
              }}
            >
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(245,200,66,0.10)',
                  'rgba(245,200,66,0.22)',
                  'rgba(245,200,66,0.10)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        )}

        {/* Kicker — floats above word zone */}
        {kicker && (
          isBoss ? (
            <Animated.Text style={[styles.kicker, { opacity: badgeOpacity }]}>
              {kicker}
            </Animated.Text>
          ) : (
            <Text style={styles.kicker}>{kicker}</Text>
          )
        )}

        {bossUnderlineVisible && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 8,
              left: 14,
              height: 2.5,
              borderRadius: 2,
              backgroundColor: '#F5C842',
              width: underlineProgress.interpolate({
                inputRange:  [0, 1],
                outputRange: [0, containerWidthRef.current - 28],
              }),
              shadowColor: '#F5C842',
              shadowOpacity: 0.6,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
              elevation: 4,
            }}
          />
        )}

        {transitionLabel && (
          <Animated.Text
            pointerEvents="none"
            style={[styles.kicker, { opacity: transitionLabelOpacity, color: '#F5C842', letterSpacing: 5 }]}
          >
            {transitionLabel}
          </Animated.Text>
        )}

        {/* Word with entry + boss animations */}
        {/* Static perspective context for the hero book cover's rotateX swing */}
        <View style={{ transform: [{ perspective: HERO_BOOK_PERSPECTIVE }] }}>
        {/* Outer wrapper: non-native recoil transforms (RAF-driven setValue) */}
        <Animated.View
          style={{
            transform: [
              { translateY: wordRecoilY },
              { scale: wordRecoilScale },
            ],
          }}
        >
          {/* Boss squash/stretch wrapper — non-native, identity for non-boss */}
          <Animated.View
            style={{
              transform: [
                { translateY: bossWordTranslateY },
                { scaleX: bossScaleX },
                { scaleY: bossScaleY },
              ],
            }}
          >
          {/* Inner: native-only transforms */}
          <Animated.View
            style={{
              opacity: wordEntryOpacity,
              transform: [
                { scale: absorptionScale },
                { scale: wordEntryScale },
                { scale: wordLockPulse },
                { scale: masterHeroScale },
                { translateY: masterHeroTransY },
                { translateY: wordEntryTranslateY },
                { rotate: wordEntryTiltDeg },
                { rotateX: wordSwingXDeg },
              ],
            }}
          >
            <Text
              style={[styles.word, isBoss && styles.wordBoss]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {step.word}
            </Text>
            {/* Gold overlay for absorption fill */}
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.word,
                isBoss && styles.wordBoss,
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
        </Animated.View>
        </View>

        {/* Boss shockwave rings + dust */}
        {bossShockwaveVisible && (
          <BossShockwave
            boardWidth={containerWidth}
            onDone={() => setBossShockwaveVisible(false)}
          />
        )}

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
          {showBoardContent && gatePhase !== 'tiles' && gatePhase !== 'wrongFail' && topMask && (
            <View pointerEvents="none" style={styles.swipeCueOverlay}>
              <Text style={[styles.swipeCueText, styles.swipeUpCue]}>
                SWIPE UP TO CLAIM
              </Text>
              <Text style={[styles.swipeCueText, styles.swipeRightCue]}>
                SWIPE RIGHT TO REJECT
              </Text>
            </View>
          )}
          {showBoardContent && (
          <Animated.View style={[styles.tileStack, { transform: [{ translateY: deckSlamY }] }]}>
            <Animated.View style={{ opacity: masterAllFadeAnim }}>
            {gatePhase !== 'tiles' && gatePhase !== 'wrongFail' && topMask && (
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
                            { scale: 1 - depth * 0.006 },
                            { rotate: `${depth * -2.2}deg` },
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
                    transform: [{ translateY: deckActiveY }, { translateY: cardPopY }, { rotate: deckActiveRotDeg }],
                    opacity: deckActiveOp,
                  },
                ]}>
                <View
                  ref={getTileRef(topMask.id)}
                  style={styles.deckTopCardSlot}
                >
                  <SwipeMask
                    key={topMask.id}
                    mask={topMask}
                    state={tileStates.get(topMask.id) ?? 'idle'}
                    onSwipeUp={() => handleSwipeUp(topMask.id)}
                    onSwipeDown={() => handleSwipeRight(topMask.id)}
                    onSwipeReveal={() => {}}
                    revealable={false}
                    disabled={inputLocked}
                    nearMastery={nearMastery}
                    tileHeight={TILE_H}
                    entryDelay={0}
                    hapticCorrect={step.hapticTier === 'light' ? () => Haptics.selectionAsync() : undefined}
                    onEffect={handleEffect}
                    onSwipeStart={() => playSfx('tileSwipe')}
                    onPressHoldStart={() => playSfx('pressHoldStart')}
                    onExitComplete={() => {
                      setRemainingMaskIds(prev => prev.filter(id => id !== topMask.id));
                    }}
                    wordY={wordScreenY}
                  />
                </View>
                </Animated.View>
              </View>
            )}

            {(gatePhase === 'tiles' || gatePhase === 'wrongFail') && mysteryMask && (
              <View style={styles.finalHiddenTileStack}>
                {releasedHiddenTileCount >= 1 && (
                  <Animated.View
                    pointerEvents={gatePhase === 'wrongFail' ? 'none' : landedHiddenTileCount >= 1 ? 'auto' : 'none'}
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
                        mask={mysteryMask}
                        state={finalTileStates.get(mysteryMask.id) ?? 'idle'}
                        onSwipeUp={() => handleFinalTileSwipeUp(mysteryMask.id)}
                        onSwipeDown={() => handleFinalTileSwipeRight(mysteryMask.id)}
                        onSwipeReveal={() => {}}
                        revealable={false}
                        disabled={inputLocked}
                        isSpecialSplit={true}
                        tileHeight={FINAL_TILE_H}
                        entryDelay={0}
                        onEffect={handleEffect}
                        onSwipeStart={() => playSfx('tileSwipe')}
                        onPressHoldStart={() => playSfx('pressHoldStart')}
                        wordY={wordScreenY}
                        splitBorderColor="rgba(245,200,66,1.0)"
                        splitTextColor="rgba(255,248,230,1)"
                        splitBackgroundColor="#0F0D2A"
                      />
                    </Animated.View>
                  </Animated.View>
                )}
              </View>
            )}
            </Animated.View>
          </Animated.View>
          )}

        </View>
      </View>

      {/* Shard burst system */}
      {bursts.map(burst => (
        <Burst key={burst.id} x={burst.x} y={burst.y} count={burst.count} />
      ))}

      {/* Score floats */}
      {floats.map(f => (
        <ScoreFloat
          key={f.id}
          value={f.value}
          startPosition={{ x: f.x, y: f.y }}
          color={f.color}
          onComplete={() => setFloats(prev => prev.filter(e => e.id !== f.id))}
        />
      ))}

      {/* Polly — flies up in an arc to a left or right perch, hidden during ordinary play */}
      {pollyVisible && (
        <Animated.View style={[styles.pollyAnchor, pollyPositionStyle]} pointerEvents="none">
          <Animated.View style={pollyAnimatedStyle}>
            <PollySprite pose={currentPose} size={POLLY_GAMEPLAY_SIZE} />
          </Animated.View>
        </Animated.View>
      )}

      {/* Speech bubble — above Polly's current perch */}
      {pollyVisible && speechLineVisible && currentSpeechLine && (
        <View
          style={[styles.speechBubble, perchSide === 'right' ? styles.speechBubbleRight : styles.speechBubbleLeft]}
          pointerEvents="none"
        >
          <Text style={styles.speechText} numberOfLines={3}>
            {currentSpeechLine}
          </Text>
        </View>
      )}

      {/* Mastery celebration — phase-based elements */}
      {masterStampVisible && (
        <>
          {/* Mastery shards — rAF driven */}
          {masteryProgress >= 0 && masteryShards.map((s, i) => {
            const originX  = containerWidthRef.current / 2;
            const originY  = 40;
            const px       = originX + Math.cos(s.angle) * s.speed * masteryProgress;
            const py       = originY + Math.sin(s.angle) * s.speed * masteryProgress
                             + 160 * masteryProgress * masteryProgress;
            const opacity  = masteryProgress < 0.3 ? 1 : 1 - (masteryProgress - 0.3) / 0.7;
            const rotation = s.rot + s.rotSpeed * masteryProgress * 60;
            return (
              <View
                key={i}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: px - s.w / 2,
                  top:  py - s.h / 2,
                  width: s.w, height: s.h,
                  borderRadius: 2,
                  backgroundColor: s.color,
                  opacity,
                  transform: [{ rotate: `${rotation}deg` }],
                }}
              />
            );
          })}

          {/* Diagonal MASTER stamp over the crashed word */}
          {masteredLabelVisible && (
            <Animated.Text
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: masteryWordCenterY - 54,
                left: 0, right: 0,
                textAlign: 'center',
                fontFamily: FONTS.label,
                fontWeight: '900',
                fontSize: 44,
                color: '#F5C842',
                letterSpacing: 0,
                opacity: masteredLabelOpacity,
                textShadowColor: 'rgba(245,200,66,0.55)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
                transform: [
                  { rotate: '-14deg' },
                  { scale: masterStampScale },
                ],
              }}
            >
              MASTER
            </Animated.Text>
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

      {/* ── HAUNT BROKEN stamp ────────────────────────────────── */}
      {hauntBrokenVisible && (
        <Animated.Text
          pointerEvents="none"
          style={[styles.hauntBrokenText, {
            top: masteryWordCenterY + 38,
            opacity: hauntBrokenOpacity,
            transform: [{ scale: hauntBrokenScale }],
          }]}
        >
          HAUNT BROKEN
        </Animated.Text>
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

      {wordOutcome === 'mastered' && (
        <MasteredOutcomeOverlay
          word={step.word}
          bonusLabel={outcomeBonusLabel}
          onContinue={continueOutcome}
        />
      )}

      {wordOutcome === 'haunted' && (
        <HauntedOutcomeOverlay
          word={step.word}
          detail={outcomeDetail}
          onContinue={continueOutcome}
        />
      )}
    </Animated.View>
  );
}

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
  wordStageFrame: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    bottom: 0,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PW.color.goldSoft,
    backgroundColor: PW.color.bgDeep,
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  wordStageOuterFrame: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
    bottom: -2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.surfaceDeep,
  },
  wordStageInnerBevel: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    bottom: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: 'transparent',
  },
  wordStageChamferTL: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: PW.color.goldSoft,
    opacity: 0.68,
  },
  wordStageChamferTR: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: PW.color.goldSoft,
    opacity: 0.68,
  },
  wordStageChamferBL: {
    position: 'absolute',
    left: 6,
    bottom: 4,
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: PW.color.goldSoft,
    opacity: 0.68,
  },
  wordStageChamferBR: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: PW.color.goldSoft,
    opacity: 0.68,
  },
  wordStagePageEdge1: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    height: 1,
    backgroundColor: PW.color.cardRim,
  },
  wordStagePageEdge2: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: -3,
    height: 1,
    backgroundColor: PW.color.goldGlow,
    opacity: 0.62,
  },
  wordStagePageEdge3: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: -6,
    height: 1,
    backgroundColor: PW.color.cardRim,
    opacity: 0.28,
  },
  wordStageUnderlight: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: -18,
    height: 20,
    borderRadius: 10,
    backgroundColor: PW.color.purple,
    opacity: PW.opacity.subtle,
    shadowColor: PW.color.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 0,
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
  word: {
    fontSize: 96,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: FONT_SIZES.wordDisplayLetterSpacing,
    color: '#F5C842',
    textShadowColor: 'rgba(245,200,66,0.38)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
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
    width: 200,
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
  // ── Tile zone ─────────────────────────────────────────────────
  gridWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 84,
    paddingBottom: 12,
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
    top: -48,
    left: 0,
    right: 0,
    color: '#F5C842',
    opacity: 0.72,
  },
  swipeRightCue: {
    top: TILE_H + 44,
    right: 8,
    width: 190,
    color: '#B98ADE',
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
    left: 18,
    right: 18,
    bottom: 6,
    height: 2,
    borderRadius: 2,
    backgroundColor: PW.color.cardBottomEdge,
    opacity: 0.42,
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
  // ── Polly — absolute bottom-left pop-in ───────────────────────
  pollyAnchor: {
    position: 'absolute',
    bottom: 16,
    left: -10,
    width: POLLY_GAMEPLAY_SIZE,
    height: POLLY_GAMEPLAY_SIZE,
  },
  speechBubble: {
    position: 'absolute',
    maxWidth: 168,
    backgroundColor: 'rgba(20,18,56,0.94)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speechBubbleLeft: {
    bottom: 184,
    left: 20,
  },
  speechBubbleRight: {
    bottom: 164,
    right: 78,
  },
  speechText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontFamily: FONTS.polly,
    letterSpacing: 0.3,
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
  hauntBrokenText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.label,
    fontWeight: '900',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(123,45,139,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
