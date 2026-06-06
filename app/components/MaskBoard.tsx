import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import * as Haptics from 'expo-haptics';
import { GhostMeaning, Mask, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { GhostTile } from './GhostTile';
import { ScoreFloat } from './ScoreFloat';
import PollySprite from './ui/PollySprite';
import { usePollyAnimator } from '../hooks/usePollyAnimator';
import { playSplitReveal, playRoundComplete } from '../utils/SoundEngine';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 6;
const TILE_H     = 58;
const HIDDEN_H   = 76;
const TILE_INSET = 16;

const CLIP_PATHS = [
  'polygon(0 0,100% 22%,72% 100%)',
  'polygon(0 18%,100% 0,100% 78%,30% 100%)',
  'polygon(10% 0,100% 40%,55% 100%,0 70%)',
  'polygon(0 0,78% 0,100% 100%,20% 86%)',
  'polygon(0 30%,60% 0,100% 64%,40% 100%)',
] as const;
void CLIP_PATHS; // clipPath not supported in RN — kept for reference

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
        borderWidth: 2.5, borderColor: 'rgba(255,215,0,0.9)',
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
  if (step.eventType === 'bossWord')  return 'BOSS WORD · 2× SCORE';
  if (step.eventType === 'slangDrop') return 'SLANG DROP';
  return null;
}

export function MaskBoard({ step, spawnEffect, onTrapCaught, onWrongSwipe }: Props) {
  const store  = useGameStore();
  const isBoss = step.eventType === 'bossWord';
  const wordColor = '#F5C842'; // always gold
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
  } = usePollyAnimator(store.game.streak, store.game.lives, store.game.stepIndex);

  // ── tile state map ───────────────────────────────────────────
  const [tileStates, setTileStates] = useState<Map<string, SwipeMaskState>>(() => {
    const m = new Map<string, SwipeMaskState>();
    step.masks.forEach(mask => m.set(mask.id, 'idle'));
    return m;
  });

  // ── 14-shard burst system ────────────────────────────────────
  const [bursts, setBursts] = useState<BurstEntry[]>([]);
  const burstIdRef = useRef(0);

  const completedRef          = useRef(false);
  const gateTriggeredRef      = useRef(false);
  const ghostJudgedCorrectRef = useRef(false);
  const wrongSwipeOccurred    = useRef(false);

  const ghost = store.ghosts.find((g: GhostMeaning) => g.wordId === step.word) ?? null;
  const [ghostVisible, setGhostVisible] = useState(!!ghost);

  // ── layout ───────────────────────────────────────────────────
  const [containerWidth, setContainerWidth] = useState(350);
  const containerWidthRef                   = useRef(350);
  const containerRef  = useRef<View>(null);
  const wordZoneRef   = useRef<View>(null);
  const [wordScreenY, setWordScreenY] = useState(180);

  const visibleGridMasks = store.game.shuffledMasks[store.game.stepIndex]
    ?? step.masks.filter(m => !m.isHidden);

  // ── find counts ──────────────────────────────────────────────
  const realMasks  = visibleGridMasks.filter(m => m.isReal);
  const totalReal  = realMasks.length;
  const foundCount = realMasks.filter(m => tileStates.get(m.id) === 'correct').length;

  // ── word absorption ──────────────────────────────────────────
  const absorptionScale       = useRef(new Animated.Value(1)).current;
  const ringScale             = useRef(new Animated.Value(1)).current;
  const ringOpacity           = useRef(new Animated.Value(0)).current;
  const wordEntryOpacity      = useRef(new Animated.Value(0)).current;
  const wordEntryScale        = useRef(new Animated.Value(0.85)).current;
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

  // ── boss entrance ─────────────────────────────────────────────
  const bossWordTranslateY = useRef(new Animated.Value(isBoss ? -300 : 0)).current;
  const bossShakeX         = useRef(new Animated.Value(0)).current;
  const bossSweepX         = useRef(new Animated.Value(-60)).current;
  const bossSweepOpacity   = useRef(new Animated.Value(0)).current;
  // Boss squash/stretch (non-native, rAF setValue-driven)
  const bossScaleX         = useRef(new Animated.Value(isBoss ? 0.86 : 1)).current;
  const bossScaleY         = useRef(new Animated.Value(isBoss ? 1.16 : 1)).current;
  const bossEntranceRafRef = useRef<number | null>(null);
  const bossImpactRef      = useRef<number | null>(null);
  const [bossWordColor, setBossWordColor] = useState('#FFD700');
  const [bossShockwaveVisible, setBossShockwaveVisible] = useState(false);

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

  const [bossReady, setBossReady]             = useState(!isBoss);
  const [bossSweepActive, setBossSweepActive] = useState(false);
  const [tilesReady, setTilesReady]           = useState(false);

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
          triggerShardBurst(pageX - bx, pageY - by);
        }
      );
    } else {
      spawnEffect?.(type, pageX, pageY);
    }
  }

  // ── master gate ───────────────────────────────────────────────
  const hasHidden = !!step.hiddenMeaning;

  const hiddenRealMask: Mask | null = step.hiddenMeaning
    ? { id: `${step.word}_hidden_real`, emoji: step.hiddenEmoji ?? '✨', phrase: step.hiddenMeaning, isReal: true }
    : null;
  const hiddenTrapMask: Mask | null = step.hiddenMeaning
    ? { id: `${step.word}_hidden_trap`, emoji: step.hiddenTrapEmoji ?? '🪤', phrase: step.hiddenTrap ?? 'Not this one', isReal: false }
    : null;

  // Gate phase
  const [gatePhase, setGatePhase] = useState<
    'locked' | 'unlocking' | 'doorSplit' | 'tiles' | 'wrongFail' | 'mastered'
  >('locked');

  // Final tile states (replaces splitStates)
  const [finalTileStates, setFinalTileStates] = useState<Map<string, SwipeMaskState>>(new Map());

  // Gate animated values — all useNativeDriver:false (border color requires it)
  const gateScaleAnim       = useRef(new Animated.Value(1)).current;
  const gateTranslateYAnim  = useRef(new Animated.Value(0)).current;
  const gateBorderOpAnim    = useRef(new Animated.Value(0.25)).current;
  const lockScaleAnim       = useRef(new Animated.Value(1)).current;
  const lockRotAnim         = useRef(new Animated.Value(0)).current;
  const doorLeftTransXAnim  = useRef(new Animated.Value(0)).current;
  const doorRightTransXAnim = useRef(new Animated.Value(0)).current;
  const doorsOpacityAnim    = useRef(new Animated.Value(1)).current;

  // Final tile drop (native: transform only)
  const splitTile1TransY  = useRef(new Animated.Value(-60)).current;
  const splitTile2TransY  = useRef(new Animated.Value(-60)).current;
  const splitCompletedRef = useRef(false);

  // Final tile border pulse (non-native)
  const finalBorder1Anim = useRef(new Animated.Value(1)).current;
  const finalBorder2Anim = useRef(new Animated.Value(1)).current;

  // Wrong-fail: both tiles shrink + fade (native)
  const wrongFailScaleAnim   = useRef(new Animated.Value(1)).current;
  const wrongFailOpacityAnim = useRef(new Animated.Value(1)).current;
  const [wrongGhostVisible, setWrongGhostVisible] = useState(false);

  // Mastered celebration
  const masterHeroScale      = useRef(new Animated.Value(1)).current;
  const masterHeroTransY     = useRef(new Animated.Value(0)).current;
  const masterAllFadeAnim    = useRef(new Animated.Value(1)).current;
  // Phase-based mastery sequence
  const masteredLabelOpacity = useRef(new Animated.Value(0)).current;
  const goldSeedScale        = useRef(new Animated.Value(0)).current;
  const goldSeedTransY       = useRef(new Animated.Value(0)).current;
  const goldSeedTrailOpacity = useRef(new Animated.Value(0)).current;
  const goldBloomScale       = useRef(new Animated.Value(1)).current;
  const goldBloomOpacity     = useRef(new Animated.Value(0)).current;
  const [masterStampVisible, setMasterStampVisible]   = useState(false);
  const [masteredLabelVisible, setMasteredLabelVisible] = useState(false);
  const [goldSeedVisible, setGoldSeedVisible]           = useState(false);
  const [goldBloomVisible, setGoldBloomVisible]         = useState(false);

  // Gate ref for measuring rise distance
  const gateViewRef = useRef<View>(null);

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

  const showBoardContent = (!isBoss || bossReady) && tilesReady;

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

  useEffect(() => {
    if (store.game.status === 'gameOver') firePollyEvent('gameOver');
  }, [store.game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (store.game.streak > 0 && store.game.streak % 10 === 0) {
      firePollyEvent('streakX10');
    }
  }, [store.game.streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Master Gate intro — fires once per player's lifetime ─────
  useEffect(() => {
    if (!hasHidden) return;
    AsyncStorage.getItem('polywords_hasSeenGateIntro').then(val => {
      if (val === null) {
        AsyncStorage.setItem('polywords_hasSeenGateIntro', 'true').catch(() => {});
        firePollyEvent('gateIntro');
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset guards and animated values on new word
  useEffect(() => {
    wrongSwipeOccurred.current    = false;
    completedRef.current          = false;
    gateTriggeredRef.current      = false;
    ghostJudgedCorrectRef.current = false;
    splitCompletedRef.current     = false;
    bossShakeX.setValue(0);
    if (!isBoss) bossWordTranslateY.setValue(0);
    bossScaleX.setValue(isBoss ? 0.86 : 1);
    bossScaleY.setValue(isBoss ? 1.16 : 1);
    if (bossEntranceRafRef.current !== null) {
      cancelAnimationFrame(bossEntranceRafRef.current);
      bossEntranceRafRef.current = null;
    }
    bossImpactRef.current = null;
    setBossWordColor('#FFD700');
    setBossShockwaveVisible(false);
    goldTextOpacity.setValue(0);
    wordRecoilY.setValue(0);
    wordRecoilScale.setValue(1);
    wordRedOpacity.setValue(0);

    // Gate reset
    setGatePhase('locked');
    setFinalTileStates(new Map());
    setWrongGhostVisible(false);
    setMasterStampVisible(false);
    gateScaleAnim.setValue(1);
    gateTranslateYAnim.setValue(0);
    gateBorderOpAnim.setValue(0.25);
    lockScaleAnim.setValue(1);
    lockRotAnim.setValue(0);
    doorLeftTransXAnim.setValue(0);
    doorRightTransXAnim.setValue(0);
    doorsOpacityAnim.setValue(1);
    splitTile1TransY.setValue(-60);
    splitTile2TransY.setValue(-60);
    finalBorder1Anim.setValue(1);
    finalBorder2Anim.setValue(1);
    wrongFailScaleAnim.setValue(1);
    wrongFailOpacityAnim.setValue(1);
    masterHeroScale.setValue(1);
    masterHeroTransY.setValue(0);
    masterAllFadeAnim.setValue(1);
    masteredLabelOpacity.setValue(0);
    goldSeedScale.setValue(0);
    goldSeedTransY.setValue(0);
    goldSeedTrailOpacity.setValue(0);
    goldBloomScale.setValue(1);
    goldBloomOpacity.setValue(0);
    setMasteredLabelVisible(false);
    setGoldSeedVisible(false);
    setGoldBloomVisible(false);
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word title fade + scale in (non-boss)
  useEffect(() => {
    if (isBoss) return;
    wordEntryOpacity.setValue(0);
    wordEntryScale.setValue(0.85);
    Animated.parallel([
      Animated.timing(wordEntryOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(wordEntryScale,   { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    firePollyEvent('wordEntry');
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ghost Polly trigger
  useEffect(() => {
    if (ghost) firePollyEvent('ghostEntry');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Boss entrance sequence
  useEffect(() => {
    if (!isBoss) return;

    const t1 = setTimeout(() => {
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);

      Animated.spring(bossWordTranslateY, {
        toValue: 0, tension: 280, friction: 6, useNativeDriver: false,
      }).start();

      setTimeout(() => {
        // ── Impact ────────────────────────────────────────────────
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        Animated.sequence([
          Animated.timing(bossShakeX, { toValue:  4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  1, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  0, duration: 30, useNativeDriver: true }),
        ]).start();

        // ── Squash/stretch + ignite flash (single rAF loop) ───────
        bossImpactRef.current = performance.now ? performance.now() : Date.now();
        bossScaleX.setValue(1.32);
        bossScaleY.setValue(0.66);
        setBossShockwaveVisible(true);

        const SQUASH_DUR = 520;
        const IGNITE_DUR = 400;
        const TOTAL_DUR  = Math.max(SQUASH_DUR, IGNITE_DUR);
        let rafStart: number | null = null;

        function squashIgniteTick(now: number) {
          if (rafStart === null) rafStart = now;
          const elapsed = now - rafStart;

          if (elapsed <= SQUASH_DUR) {
            const since = Math.min(elapsed / SQUASH_DUR, 1);
            const k     = easeOutBack(since, 2.2);
            bossScaleX.setValue(1.32 - 0.32 * k);
            bossScaleY.setValue(0.66 + 0.34 * k);
          }

          if (elapsed <= IGNITE_DUR) {
            const sweep = Math.min(elapsed / 150, 1);
            const g     = Math.round(255 + (215 - 255) * sweep);
            const b     = Math.round(255 + (0   - 255) * sweep);
            setBossWordColor(`rgb(255,${g},${b})`);
          }

          if (elapsed < TOTAL_DUR) {
            bossEntranceRafRef.current = requestAnimationFrame(squashIgniteTick);
          } else {
            bossScaleX.setValue(1);
            bossScaleY.setValue(1);
            setBossWordColor('#FFD700');
            bossEntranceRafRef.current = null;
          }
        }
        bossEntranceRafRef.current = requestAnimationFrame(squashIgniteTick);

        setTimeout(() => {
          setBossSweepActive(true);
          bossSweepX.setValue(-60);
          bossSweepOpacity.setValue(0.7);

          Animated.timing(bossSweepX, {
            toValue: containerWidthRef.current + 60,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(bossSweepOpacity, {
              toValue: 0, duration: 150, useNativeDriver: true,
            }).start(() => {
              setBossSweepActive(false);
              firePollyEvent('bossEntry');
              setBossReady(true);
            });
          });
        }, 100);
      }, 300);
    }, 600);

    return () => {
      clearTimeout(t1);
      if (bossEntranceRafRef.current !== null) {
        cancelAnimationFrame(bossEntranceRafRef.current);
        bossEntranceRafRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gate sequence ─────────────────────────────────────────────

  function triggerDoorSplit() {
    setGatePhase('doorSplit');
    playSplitReveal();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const halfWidth = Dimensions.get('window').width / 2;

    Animated.spring(doorLeftTransXAnim, {
      toValue: -halfWidth, damping: 14, stiffness: 160, useNativeDriver: false,
    }).start();
    Animated.spring(doorRightTransXAnim, {
      toValue: halfWidth, damping: 14, stiffness: 160, useNativeDriver: false,
    }).start();
    Animated.timing(doorsOpacityAnim, {
      toValue: 0, duration: 200, useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) triggerFinalTilesDrop();
    });
  }

  function triggerFinalTilesDrop() {
    if (!hiddenRealMask || !hiddenTrapMask) return;
    setGatePhase('tiles');
    setFinalTileStates(new Map([
      [hiddenRealMask.id, 'idle'],
      [hiddenTrapMask.id, 'idle'],
    ]));
    splitTile1TransY.setValue(-60);
    splitTile2TransY.setValue(-60);

    Animated.spring(splitTile1TransY, {
      toValue: 0, damping: 10, stiffness: 140, useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      Animated.sequence([
        Animated.timing(finalBorder1Anim, { toValue: 0.4, duration: 200, useNativeDriver: false }),
        Animated.timing(finalBorder1Anim, { toValue: 1.0, duration: 400, useNativeDriver: false }),
      ]).start();
    });

    setTimeout(() => {
      Animated.spring(splitTile2TransY, {
        toValue: 0, damping: 10, stiffness: 140, useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        Animated.sequence([
          Animated.timing(finalBorder2Anim, { toValue: 0.4, duration: 200, useNativeDriver: false }),
          Animated.timing(finalBorder2Anim, { toValue: 1.0, duration: 400, useNativeDriver: false }),
        ]).start();
      });
    }, 60);
  }

  function triggerWrongFail() {
    if (splitCompletedRef.current) return;
    splitCompletedRef.current = true;
    completedRef.current = true;
    wrongSwipeOccurred.current = true;
    setGatePhase('wrongFail');

    Animated.parallel([
      Animated.timing(wrongFailScaleAnim, {
        toValue: 0.94, duration: 120, useNativeDriver: true,
      }),
      Animated.timing(wrongFailOpacityAnim, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }),
    ]).start(() => {
      setWrongGhostVisible(true);
    });

    setTimeout(() => {
      store.addGhostedMaster(step.word);
      store.completeWord();
    }, 1200);
  }

  function triggerMastered() {
    setGatePhase('mastered');
    completedRef.current = true;
    store.addBonusScore(300);
    spawnFloatAtSplit(300, '#F5C842');
    firePollyEvent('gateMastered');
    setMasterStampVisible(true);

    const screenH = Dimensions.get('window').height;

    // Phase 1 — T+0ms: Screen dims — tiles to 15% opacity
    Animated.timing(masterAllFadeAnim, {
      toValue: 0.15, duration: 300, useNativeDriver: false,
    }).start();

    // Phase 2 — T+500ms: Word pulse
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(masterHeroScale, { toValue: 1.06, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(masterHeroScale, { toValue: 1.0,  duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 500);

    // Phase 3 — T+800ms: MASTERED label appears below word
    setTimeout(() => {
      setMasteredLabelVisible(true);
      masteredLabelOpacity.setValue(0);
      Animated.timing(masteredLabelOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }, 800);

    // Fade label before word swells — NEVER simultaneous
    setTimeout(() => {
      Animated.timing(masteredLabelOpacity, { toValue: 0, duration: 80, useNativeDriver: true }).start();
    }, 1000);

    // Phase 4 — T+1050ms: Word swells 1.0→2.8
    setTimeout(() => {
      Animated.timing(masterHeroScale, {
        toValue: 2.8, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: true,
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
      goldSeedScale.setValue(0);
      goldSeedTransY.setValue(0);
      goldSeedTrailOpacity.setValue(0);
      Animated.spring(goldSeedScale, {
        toValue: 1.2, damping: 6, stiffness: 400, useNativeDriver: true,
      }).start();
    }, 1900);

    // Seed settles
    setTimeout(() => {
      Animated.spring(goldSeedScale, {
        toValue: 1.0, damping: 8, stiffness: 300, useNativeDriver: true,
      }).start();
    }, 2000);

    // Phase 7 — T+2100ms: Seed drops to screen bottom
    setTimeout(() => {
      const dropDist = screenH - wordScreenY;
      goldSeedTrailOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(goldSeedTransY, {
          toValue: dropDist, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(goldSeedTrailOpacity, {
          toValue: 0, duration: 500, useNativeDriver: true,
        }),
      ]).start();
    }, 2100);

    // Phase 8 — T+2400ms: Seed landing bloom
    setTimeout(() => {
      Haptics.selectionAsync();
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

    // Restore dim before transition
    setTimeout(() => {
      Animated.timing(masterAllFadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    }, 2600);

    // Phase 9 — T+2700ms: Hold (silence)

    // Phase 10 — T+3000ms: Transition
    setTimeout(() => {
      setMasteredLabelVisible(false);
      if (!ghostJudgedCorrectRef.current) store.clearGhost(step.word);
      store.completeWord();
    }, 3000);
  }

  function triggerGateUnlock() {
    setGatePhase('unlocking');

    lockScaleAnim.setValue(1);
    lockRotAnim.setValue(0);
    Animated.sequence([
      Animated.timing(lockScaleAnim, { toValue: 1.4, duration: 150, useNativeDriver: false }),
      Animated.timing(lockScaleAnim, { toValue: 1.0, duration: 150, useNativeDriver: false }),
    ]).start();
    Animated.timing(lockRotAnim, { toValue: -20, duration: 300, useNativeDriver: false }).start();

    Animated.timing(gateBorderOpAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();

    Animated.spring(gateScaleAnim, {
      toValue: 1.15, damping: 10, stiffness: 120, useNativeDriver: false,
    }).start();

    setTimeout(() => {
      const cont = containerRef.current;
      const gate = gateViewRef.current;
      if (cont && gate) {
        (cont as any).measure((_cx: number, _cy: number, _cw: number, _ch: number, _cpx: number, cPageY: number) => {
          (gate as any).measure((_gx: number, _gy: number, _gw: number, _gh: number, _gpx: number, gPageY: number) => {
            const riseDistance = (cPageY + 84) - gPageY;
            Animated.spring(gateTranslateYAnim, {
              toValue: riseDistance, damping: 12, stiffness: 100, useNativeDriver: false,
            }).start(({ finished }) => {
              if (finished) triggerDoorSplit();
            });
          });
        });
      } else {
        Animated.spring(gateTranslateYAnim, {
          toValue: -350, damping: 12, stiffness: 100, useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) triggerDoorSplit();
        });
      }
    }, 100);
  }

  function handleFinalTileSwipeUp(maskId: string) {
    const isReal = maskId === hiddenRealMask?.id;
    if (isReal) {
      setFinalTileStates(prev => new Map(prev).set(maskId, 'correct'));
      if (hiddenRealMask) triggerAbsorption(hiddenRealMask.phrase);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setFinalTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      triggerWrongFail();
    }
  }

  function handleFinalTileSwipeRight(maskId: string) {
    const isReal = maskId === hiddenRealMask?.id;
    if (!isReal) {
      setFinalTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setFinalTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      triggerWrongFail();
    }
  }

  // ── Final tile completion ─────────────────────────────────────
  useEffect(() => {
    if (gatePhase !== 'tiles' || splitCompletedRef.current || !hiddenRealMask || !hiddenTrapMask) return;
    const realState = finalTileStates.get(hiddenRealMask.id);
    const trapState = finalTileStates.get(hiddenTrapMask.id);
    if (realState === 'correct' && trapState === 'trap-caught') {
      splitCompletedRef.current = true;
      setTimeout(() => triggerMastered(), 200);
    }
  }, [finalTileStates]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── completion check ─────────────────────────────────────────
  useEffect(() => {
    if (completedRef.current || gateTriggeredRef.current) return;

    const allVisibleJudged = visibleGridMasks.every(m => {
      const ts = tileStates.get(m.id);
      return ts === 'correct' || ts === 'trap-caught' || ts === 'wrong';
    });
    if (!allVisibleJudged) return;

    const perfect = visibleGridMasks.every(m => {
      const ts = tileStates.get(m.id);
      return ts === 'correct' || ts === 'trap-caught';
    });

    if (perfect && hasHidden && !wrongSwipeOccurred.current) {
      gateTriggeredRef.current = true;
      firePollyEvent('allMasksFound');
      triggerGateUnlock();
    } else {
      gateTriggeredRef.current = true;
      setTimeout(() => {
        if (hasHidden && !ghostJudgedCorrectRef.current) {
          store.addGhostedMaster(step.word);
        }
        store.completeWord();
      }, 1400);
    }
  }, [tileStates]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── swipe handlers ────────────────────────────────────────────
  const GOLD_STEPS_LOCAL = [0, 0.25, 0.55, 0.80, 1.0] as const;

  function handleSwipeUp(maskId: string) {
    resetHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (mask.isReal) {
      store.submitSwipeUp(maskId);
      spawnFloat(mask.isRare ? 300 : 100, maskId, '#F5C842');
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
    } else {
      wrongSwipeOccurred.current = true;
      store.submitWrongSwipe();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      firePollyEvent('wrong');
      triggerWrongWordRecoil();
      onWrongSwipe?.();
    }
  }

  function handleSwipeRight(maskId: string) {
    resetHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (!mask.isReal) {
      store.submitSwipeDown(maskId);
      spawnFloat(50, maskId, '#7B2D8B');
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
      onTrapCaught?.();
    } else {
      wrongSwipeOccurred.current = true;
      store.submitWrongSwipe();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      firePollyEvent('wrong');
      triggerWrongWordRecoil();
      onWrongSwipe?.();
    }
  }

  // ── ghost tile handlers ──────────────────────────────────────
  function handleGhostSwipeUp() {
    ghostJudgedCorrectRef.current = true;
    store.clearGhost(step.word);
    store.setGhostRevenge({ result: 'correct', word: step.word, meaningText: ghost?.hiddenMeaningReal ?? '' });
    store.addBonusScore(250);
    spawnFloatAtSplit(250, '#F5C842');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    firePollyEvent('ghostFoundLate');
  }

  function handleGhostSwipeRight() {
    store.setGhostRevenge({ result: 'wrong', word: step.word, meaningText: ghost?.hiddenMeaningReal ?? '' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    firePollyEvent('ghostDissolved');
  }

  // ── render ────────────────────────────────────────────────────
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
      {/* ── WORD ZONE — 80px fixed ──────────────────────────── */}
      <View
        style={styles.wordZone}
        pointerEvents="none"
        ref={wordZoneRef as any}
        onLayout={() => {
          (wordZoneRef.current as any)?.measure(
            (_x: number, _y: number, _w: number, _h: number, _px: number, pageY: number) => {
              setWordScreenY(pageY + 40); // center of 80px word zone
            }
          );
        }}
      >
        {/* Boss gold sweep */}
        {bossSweepActive && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View
              style={{
                position: 'absolute', top: 0, bottom: 0, width: 60,
                backgroundColor: '#FFD700',
                opacity: bossSweepOpacity,
                transform: [{ translateX: bossSweepX }],
              }}
            />
          </View>
        )}

        {/* Kicker — floats above word zone */}
        {kicker && (
          <Text style={styles.kicker}>{kicker}</Text>
        )}

        {/* Word with entry + boss animations */}
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
                { scale: masterHeroScale },
                { translateY: masterHeroTransY },
              ],
            }}
          >
            <Text style={[styles.word, isBoss && styles.wordBoss, { color: isBoss ? bossWordColor : wordColor }]}>
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
            >
              {step.word}
            </Animated.Text>

            {/* Absorption ring */}
            <Animated.View
              pointerEvents="none"
              style={[styles.goldRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
          </Animated.View>
          </Animated.View>
        </Animated.View>

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
        {showBoardContent && (
          <Animated.View style={{ opacity: masterAllFadeAnim }}>
            {(() => {
              const stagger      = step.tileStagger ?? 80;
              const orderedMasks = !!step.bossModifier
                ? [...visibleGridMasks].reverse()
                : visibleGridMasks;
              const hapticCorrect = step.hapticTier === 'light'
                ? () => Haptics.selectionAsync()
                : undefined;
              return orderedMasks.map((mask, index) => (
                <View key={mask.id} ref={getTileRef(mask.id)}>
                  <SwipeMask
                    mask={mask}
                    state={tileStates.get(mask.id) ?? 'idle'}
                    onSwipeUp={() => handleSwipeUp(mask.id)}
                    onSwipeDown={() => handleSwipeRight(mask.id)}
                    onSwipeReveal={() => {}}
                    revealable={false}
                    tileHeight={TILE_H}
                    entryDelay={index * stagger}
                    hapticCorrect={hapticCorrect}
                    onEffect={handleEffect}
                    wordY={wordScreenY}
                  />
                </View>
              ));
            })()}
          </Animated.View>
        )}

        {/* ── MASTER GATE — bottom of tile stack ─────────── */}
        {hasHidden && (
          ghostVisible && ghost ? (
            <GhostTile
              ghost={ghost}
              tileHeight={HIDDEN_H}
              onCorrect={handleGhostSwipeUp}
              onWrong={handleGhostSwipeRight}
              onDone={() => setGhostVisible(false)}
            />
          ) : (gatePhase === 'tiles' || gatePhase === 'wrongFail' || gatePhase === 'mastered') && hiddenRealMask && hiddenTrapMask ? (
            wrongGhostVisible ? (
              // Wrong-fail ghost placeholder
              <View style={{
                height: HIDDEN_H,
                marginTop: TILE_GAP,
                backgroundColor: '#0F0D2A',
                borderRadius: 12,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#9B2D6B',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontFamily: FONTS.wordDisplay,
                  fontSize: 16,
                  color: 'rgba(155,45,107,0.7)',
                  letterSpacing: 2,
                }}>MASTER THE WORD</Text>
              </View>
            ) : (
              // Two final tiles
              <Animated.View style={{
                marginTop: TILE_GAP,
                transform: [{ scale: wrongFailScaleAnim }],
                opacity: wrongFailOpacityAnim,
              }}>
                <Animated.View style={{ transform: [{ translateY: splitTile1TransY }] }}>
                  <Animated.View style={{
                    borderWidth: 2,
                    borderRadius: 14,
                    borderColor: finalBorder1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255,215,0,0.4)', 'rgba(255,215,0,1.0)'],
                    }),
                  }}>
                    <SwipeMask
                      mask={hiddenRealMask}
                      state={finalTileStates.get(hiddenRealMask.id) ?? 'idle'}
                      onSwipeUp={() => handleFinalTileSwipeUp(hiddenRealMask.id)}
                      onSwipeDown={() => handleFinalTileSwipeRight(hiddenRealMask.id)}
                      onSwipeReveal={() => {}}
                      revealable={false}
                      tileHeight={72}
                      entryDelay={0}
                      onEffect={handleEffect}
                      wordY={wordScreenY}
                    />
                  </Animated.View>
                </Animated.View>
                <Animated.View style={{ marginTop: 10, transform: [{ translateY: splitTile2TransY }] }}>
                  <Animated.View style={{
                    borderWidth: 2,
                    borderRadius: 14,
                    borderColor: finalBorder2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255,215,0,0.4)', 'rgba(255,215,0,1.0)'],
                    }),
                  }}>
                    <SwipeMask
                      mask={hiddenTrapMask}
                      state={finalTileStates.get(hiddenTrapMask.id) ?? 'idle'}
                      onSwipeUp={() => handleFinalTileSwipeUp(hiddenTrapMask.id)}
                      onSwipeDown={() => handleFinalTileSwipeRight(hiddenTrapMask.id)}
                      onSwipeReveal={() => {}}
                      revealable={false}
                      tileHeight={72}
                      entryDelay={0}
                      onEffect={handleEffect}
                      wordY={wordScreenY}
                    />
                  </Animated.View>
                </Animated.View>
              </Animated.View>
            )
          ) : (
            // Gate: locked / unlocking / doorSplit
            <Animated.View
              ref={gateViewRef as any}
              style={{
                height: HIDDEN_H,
                marginTop: TILE_GAP,
                borderRadius: 12,
                borderWidth: 2,
                backgroundColor: '#0F0D2A',
                borderColor: gateBorderOpAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(245,200,66,0.25)', 'rgba(245,200,66,1.0)'],
                }),
                overflow: 'visible',
                zIndex: gatePhase === 'locked' ? 0 : 100,
                transform: [
                  { scale: gateScaleAnim },
                  { translateY: gateTranslateYAnim },
                ],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Left door half */}
              <Animated.View style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: '50%',
                backgroundColor: '#0F0D2A',
                borderRadius: 10,
                transform: [{ translateX: doorLeftTransXAnim }],
                opacity: doorsOpacityAnim,
                zIndex: 1,
              }} />
              {/* Right door half */}
              <Animated.View style={{
                position: 'absolute',
                right: 0, top: 0, bottom: 0,
                width: '50%',
                backgroundColor: '#0F0D2A',
                borderRadius: 10,
                transform: [{ translateX: doorRightTransXAnim }],
                opacity: doorsOpacityAnim,
                zIndex: 1,
              }} />
              {/* Content: lock icon + text */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 2 }} pointerEvents="none">
                <Animated.Text style={{
                  fontSize: 18,
                  transform: [
                    { scale: lockScaleAnim },
                    { rotate: lockRotAnim.interpolate({
                      inputRange: [-20, 0],
                      outputRange: ['-20deg', '0deg'],
                    })},
                  ],
                }}>🔒</Animated.Text>
                <Text style={{
                  fontFamily: FONTS.wordDisplay,
                  fontSize: 16,
                  color: 'rgba(245,200,66,0.65)',
                  letterSpacing: 2,
                }}>MASTER THE WORD</Text>
              </View>
            </Animated.View>
          )
        )}
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

      {/* Polly — locked absolute bottom-left */}
      <View style={styles.pollyAnchor} pointerEvents="none">
        <PollySprite pose={currentPose} size={80} />
      </View>

      {/* Speech bubble — above Polly */}
      {speechLineVisible && currentSpeechLine && (
        <View style={styles.speechBubble} pointerEvents="none">
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

          {/* MASTERED label — directly below word zone */}
          {masteredLabelVisible && (
            <Animated.Text
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 84,
                left: 0, right: 0,
                textAlign: 'center',
                fontFamily: FONTS.label,
                fontWeight: '800',
                fontSize: 13,
                color: '#F5C842',
                letterSpacing: 6,
                opacity: masteredLabelOpacity,
              }}
            >
              MASTERED
            </Animated.Text>
          )}

          {/* Gold seed + trail */}
          {goldSeedVisible && (
            <>
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: containerWidth / 2 - 1,
                  top: 40,
                  width: 2,
                  height: 60,
                  backgroundColor: '#F5C842',
                  opacity: goldSeedTrailOpacity,
                  transform: [{ translateY: goldSeedTransY }],
                }}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: containerWidth / 2 - 6,
                  top: 34,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#F5C842',
                  shadowColor: '#F5C842',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                  elevation: 8,
                  transform: [{ scale: goldSeedScale }, { translateY: goldSeedTransY }],
                }}
              />
            </>
          )}

          {/* Gold bloom on landing */}
          {goldBloomVisible && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 0,
                left: containerWidth / 2 - 30,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#F5C842',
                transform: [{ scale: goldBloomScale }],
                opacity: goldBloomOpacity,
              }}
            />
          )}
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // ── Word zone ─────────────────────────────────────────────────
  wordZone: {
    height: 80,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginBottom: 4,
  },
  kicker: {
    color: '#FFD700',
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
    fontSize: FONT_SIZES.wordDisplay,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: FONT_SIZES.wordDisplayLetterSpacing,
    color: '#F5C842',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  wordBoss: {
    fontSize: FONT_SIZES.bossWordDisplay,
    fontFamily: FONTS.bossWord,
    letterSpacing: FONT_SIZES.bossWordLetterSpacing,
    color: '#FFD700',
  },
  goldRing: {
    position: 'absolute',
    alignSelf: 'center',
    width: 200,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#FFD700',
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
    paddingBottom: 110,
  },
  splitZone: {
    marginTop: TILE_GAP,
  },
  // ── Polly — absolute bottom-left ──────────────────────────────
  pollyAnchor: {
    position: 'absolute',
    bottom: 34,
    left: 12,
    width: 80,
    height: 80,
    overflow: 'hidden',
  },
  speechBubble: {
    position: 'absolute',
    bottom: 128,
    left: 8,
    maxWidth: 180,
    backgroundColor: 'rgba(20,18,56,0.92)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  speechText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: FONTS.label,
    letterSpacing: 0.3,
  },
});
