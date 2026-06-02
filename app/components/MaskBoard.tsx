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
import { MasterGateTile } from './MasterGateTile';
import { ScoreFloat } from './ScoreFloat';
import PollySprite from './ui/PollySprite';
import { usePollyAnimator } from '../hooks/usePollyAnimator';
import { playSplitReveal, playRoundComplete } from '../utils/SoundEngine';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP      = 10;
const MIN_TILE_H    = 52;
const MAX_TILE_H    = 80;
const UI_OVERHEAD_BASE = 380; // TopBar + PollyZone + safe areas + bottom padding
const HIDDEN_SLOT_H    = 74;

// ── Glass shard configs ───────────────────────────────────────
const SHARD_CONFIGS = [
  { w:  90, h: 14, finalX: -120, finalY:  -80, finalRot: -35, dur: 200 },
  { w:  60, h: 18, finalX:  100, finalY:  -90, finalRot:  28, dur: 190 },
  { w: 110, h: 12, finalX:  -30, finalY:   70, finalRot: -15, dur: 220 },
  { w:  75, h: 16, finalX:   80, finalY:   60, finalRot:  42, dur: 210 },
] as const;

type FloatEntry    = { id: number; value: number; x: number; y: number; color: string };
type ShatterOrigin = { x: number; y: number } | null;

type Props = { step: WordStep };

function eventKicker(step: WordStep): string | null {
  if (step.eventType === 'bossWord')   return 'BOSS WORD · 2× SCORE';
  if (step.eventType === 'speedRound') return 'SPEED ROUND';
  if (step.eventType === 'slangDrop')  return 'SLANG DROP';
  return null;
}

export function MaskBoard({ step }: Props) {
  const store  = useGameStore();
  const isBoss = step.eventType === 'bossWord';
  const wordColor = isBoss ? '#FFD700' : '#FFFFFF';
  const kicker    = eventKicker(step);

  // Stale-closure-safe refs for store state read inside callbacks
  const streakRef = useRef(store.game.streak);
  streakRef.current = store.game.streak;
  const livesRef = useRef(store.game.lives);
  livesRef.current = store.game.lives;

  // ── Polly animator ────────────────────────────────────────────
  const {
    currentPose,
    currentSpeechLine,
    speechLineVisible,
    pollyAnimatedStyle,
    ghostTintOpacity,
    firePollyEvent,
  } = usePollyAnimator(store.game.streak, store.game.lives, store.game.stepIndex);

  // ── tile state map ───────────────────────────────────────────
  const [tileStates, setTileStates] = useState<Map<string, SwipeMaskState>>(() => {
    const m = new Map<string, SwipeMaskState>();
    step.masks.forEach(mask => m.set(mask.id, 'idle'));
    return m;
  });

  // ── shatter ──────────────────────────────────────────────────
  const [shatterOrigin, setShatterOrigin] = useState<ShatterOrigin>(null);
  const shardAnims = useRef(
    SHARD_CONFIGS.map(() => ({
      x:   new Animated.Value(0),
      y:   new Animated.Value(0),
      rot: new Animated.Value(0),
      op:  new Animated.Value(0),
    }))
  ).current;

  const completedRef          = useRef(false);
  const gateTriggeredRef      = useRef(false);
  const ghostJudgedCorrectRef = useRef(false);

  const ghost = store.ghosts.find((g: GhostMeaning) => g.wordId === step.word) ?? null;
  const [ghostVisible, setGhostVisible] = useState(!!ghost);

  // ── layout ───────────────────────────────────────────────────
  const [gridHeight, setGridHeight]         = useState(0);
  const [containerWidth, setContainerWidth] = useState(350);
  const containerWidthRef                   = useRef(350);

  const visibleGridMasks = store.game.shuffledMasks[store.game.stepIndex]
    ?? step.masks.filter(m => !m.isHidden);
  const tileCount = visibleGridMasks.length;

  const screenHeight    = Dimensions.get('window').height;
  const availableHeight = screenHeight - UI_OVERHEAD_BASE - (step.hiddenMeaning ? HIDDEN_SLOT_H : 0);
  const dimsTileH       = Math.min(MAX_TILE_H, Math.max(MIN_TILE_H, Math.floor(availableHeight / tileCount)));

  const tileHeight: number = gridHeight > 0
    ? Math.min(MAX_TILE_H, Math.max(MIN_TILE_H, Math.floor(gridHeight / tileCount - TILE_GAP)))
    : dimsTileH;

  // ── find counts ──────────────────────────────────────────────
  const realMasks  = visibleGridMasks.filter(m => m.isReal);
  const totalReal  = realMasks.length;
  const foundCount = realMasks.filter(m => tileStates.get(m.id) === 'correct').length;

  // ── absorption ───────────────────────────────────────────────
  const absorptionScale       = useRef(new Animated.Value(1)).current;
  const ringScale             = useRef(new Animated.Value(1)).current;
  const ringOpacity           = useRef(new Animated.Value(0)).current;
  const wordEntryOpacity      = useRef(new Animated.Value(0)).current;
  const wordEntryScale        = useRef(new Animated.Value(0.85)).current;
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
  const goldTextOpacity       = useRef(new Animated.Value(0)).current;
  const [absorbedPhrase, setAbsorbedPhrase] = useState<string | null>(null);

  // ── boss entrance ─────────────────────────────────────────────
  const bossWordTranslateY = useRef(new Animated.Value(isBoss ? -300 : 0)).current;
  const bossShakeX         = useRef(new Animated.Value(0)).current;
  const bossSweepX         = useRef(new Animated.Value(-60)).current;
  const bossSweepOpacity   = useRef(new Animated.Value(0)).current;

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

  const containerRef = useRef<View>(null);

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
    } else if (view) {
      view.measure((_x, _y, w, h, pageX, pageY) => {
        const id = ++floatIdRef.current;
        setFloats(prev => [...prev, { id, value, color, x: pageX + w / 2, y: pageY + h / 2 }]);
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

  // ── master gate ───────────────────────────────────────────────
  const hasHidden = !!step.hiddenMeaning;

  const [perfectClear, setPerfectClear] = useState(false);
  const [dimVisible, setDimVisible]     = useState(false);
  const [masteredVisible, setMasteredVisible] = useState(false);

  const dimOpacity             = useRef(new Animated.Value(0)).current;
  const masteredFlashOpacity   = useRef(new Animated.Value(0)).current;
  const masteredWordScale      = useRef(new Animated.Value(1.0)).current;
  const masteredWordTransY     = useRef(new Animated.Value(-120)).current;
  const masteredTextScale      = useRef(new Animated.Value(0)).current;
  const masteredTextOpacity    = useRef(new Animated.Value(0)).current;
  const masteredOverlayOpacity = useRef(new Animated.Value(1)).current;

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

  // Start hesitation timers when tiles become interactive
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

  // Reset boss animated values on mount
  useEffect(() => {
    bossShakeX.setValue(0);
    if (!isBoss) bossWordTranslateY.setValue(0);
    goldTextOpacity.setValue(0);
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word title fade + scale in (non-boss) + wordEntry Polly bob
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

  // Boss word entrance sequence
  useEffect(() => {
    if (!isBoss) return;

    const t1 = setTimeout(() => {
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);

      Animated.spring(bossWordTranslateY, {
        toValue: 0,
        tension: 280,
        friction: 6,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        Animated.sequence([
          Animated.timing(bossShakeX, { toValue:  4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  1, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  0, duration: 30, useNativeDriver: true }),
        ]).start();

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
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setBossSweepActive(false);
              firePollyEvent('bossEntry');
              setBossReady(true);
            });
          });
        }, 100);
      }, 300);
    }, 600);

    return () => clearTimeout(t1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Shatter animation
  useEffect(() => {
    if (!shatterOrigin) return;
    shardAnims.forEach((fa, i) => {
      fa.x.setValue(0);
      fa.y.setValue(0);
      fa.rot.setValue(0);
      fa.op.setValue(1);
      Animated.parallel([
        Animated.timing(fa.x,   { toValue: SHARD_CONFIGS[i].finalX, duration: SHARD_CONFIGS[i].dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fa.y,   { toValue: SHARD_CONFIGS[i].finalY, duration: SHARD_CONFIGS[i].dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fa.rot, { toValue: 1,                       duration: SHARD_CONFIGS[i].dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fa.op,  { toValue: 0,                       duration: SHARD_CONFIGS[i].dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
    const tid = setTimeout(() => setShatterOrigin(null), 400);
    return () => clearTimeout(tid);
  }, [shatterOrigin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mastered reveal cinematic ─────────────────────────────────
  function handleMasteredSwipe() {
    completedRef.current = true;
    if (!ghostJudgedCorrectRef.current) store.clearGhost(step.word);

    masteredFlashOpacity.setValue(0);
    masteredWordScale.setValue(1.0);
    masteredWordTransY.setValue(-120);
    masteredTextScale.setValue(0);
    masteredTextOpacity.setValue(0);
    masteredOverlayOpacity.setValue(1);
    dimOpacity.setValue(0);
    setDimVisible(true);
    setMasteredVisible(true);

    // T+0ms: gold flash
    Animated.sequence([
      Animated.timing(masteredFlashOpacity, { toValue: 0.2, duration: 80,  useNativeDriver: true }),
      Animated.timing(masteredFlashOpacity, { toValue: 0,   duration: 300, useNativeDriver: true }),
    ]).start();

    // T+80ms: word zooms from above to center
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(masteredWordScale,  { toValue: 2.2, damping: 8, stiffness: 90, useNativeDriver: true }),
        Animated.spring(masteredWordTransY, { toValue: 0,   damping: 8, stiffness: 90, useNativeDriver: true }),
      ]).start();
    }, 80);

    // T+300ms: dark dim covers tiles
    setTimeout(() => {
      Animated.timing(dimOpacity, { toValue: 0.85, duration: 300, useNativeDriver: true }).start();
    }, 300);

    // T+480ms: MASTERED stamp + haptic + Polly
    setTimeout(() => {
      masteredTextOpacity.setValue(1);
      Animated.sequence([
        Animated.spring(masteredTextScale, { toValue: 1.15, damping: 10, stiffness: 200, useNativeDriver: true }),
        Animated.spring(masteredTextScale, { toValue: 1.0,  damping: 10, stiffness: 200, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playRoundComplete();
      firePollyEvent('gateMastered');
    }, 480);

    // T+900ms: fade out overlay + dim
    setTimeout(() => {
      Animated.timing(masteredOverlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      Animated.timing(dimOpacity,             { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, 900);

    // T+1400ms: advance to next word
    setTimeout(() => {
      setMasteredVisible(false);
      setDimVisible(false);
      store.completeWord();
    }, 1400);
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

    if (perfect && hasHidden) {
      console.log('[MaskBoard] perfect clear — triggering gate unlock');
      gateTriggeredRef.current = true;
      firePollyEvent('allMasksFound');
      playSplitReveal();
      setPerfectClear(true);
    } else {
      console.log('[MaskBoard] word complete — perfect:', perfect, 'hasHidden:', hasHidden);
      if (hasHidden && !ghostJudgedCorrectRef.current) {
        store.addGhost({
          wordId: step.word,
          word: step.word,
          hiddenMeaningReal: step.hiddenMeaning ?? '',
          hiddenMeaningTrap: step.hiddenTrap ?? '',
          runsMissed: 1,
        });
      }
      completedRef.current = true;
      setTimeout(() => store.completeWord(), 700);
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
      store.submitWrongSwipe();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      firePollyEvent('wrong');
    }
  }

  function handleSwipeRight(maskId: string) {
    resetHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (!mask.isReal) {
      store.submitSwipeDown(maskId);
      spawnFloat(50, maskId, '#7B2D8B');

      const refObj    = tileRefs.current.get(maskId);
      const view      = refObj?.current;
      const container = containerRef.current;
      if (view && container) {
        (container as any).measure((_cx: number, _cy: number, _cw: number, _ch: number, cPageX: number, cPageY: number) => {
          (view as any).measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
            setShatterOrigin({
              x: pageX - cPageX + w / 2,
              y: pageY - cPageY + TILE_GAP + tileHeight / 2,
            });
          });
        });
      }

      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
    } else {
      store.submitWrongSwipe();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      firePollyEvent('wrong');
    }
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
      {/* ── POLLY ZONE ────────────────────────────────────────── */}
      <View style={styles.pollyZone}>

        {/* ghost tint overlay — only mounted when a ghost is active */}
        {ghostVisible && ghost && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#7B2D8B',
                opacity: ghostTintOpacity,
                borderRadius: 16,
              },
            ]}
          />
        )}

        {/* Polly sprite — red bg is a temporary bleed diagnostic; remove after confirming */}
        <Animated.View
          style={[
            pollyAnimatedStyle,
            { position: 'absolute', bottom: 0, alignSelf: 'center', backgroundColor: '#FF0000' },
          ]}
        >
          <PollySprite pose={currentPose} size={240} />
        </Animated.View>

        {/* boss gold sweep */}
        {bossSweepActive && (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 60,
                backgroundColor: '#FFD700',
                opacity: bossSweepOpacity,
                transform: [{ translateX: bossSweepX }],
              }}
            />
          </View>
        )}

        {/* word overlay — sits across Polly body */}
        <View style={styles.wordOverlay}>
          {kicker ? (
            <Text style={styles.kicker}>{kicker}</Text>
          ) : null}

          <Animated.View
            style={{
              opacity: wordEntryOpacity,
              transform: [
                { scale: absorptionScale },
                { scale: wordEntryScale },
                { translateY: bossWordTranslateY },
              ],
            }}
          >
            <Text style={[styles.word, isBoss && styles.wordBoss, { color: wordColor }]}>
              {step.word}
            </Text>
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.word,
                isBoss && styles.wordBoss,
                {
                  color: '#F5C842',
                  opacity: goldTextOpacity,
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                },
              ]}
            >
              {step.word}
            </Animated.Text>

            {/* absorption ring */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.goldRing,
                { opacity: ringOpacity, transform: [{ scale: ringScale }] },
              ]}
            />
          </Animated.View>

          {absorbedPhrase !== null && (
            <Animated.Text style={[styles.absorbedPhrase, { opacity: absorbedPhraseOpacity }]}>
              {absorbedPhrase}
            </Animated.Text>
          )}

          {/* speech line replaces progress text when active */}
          {speechLineVisible ? (
            <Text style={styles.speechLine}>{currentSpeechLine}</Text>
          ) : (
            <Text style={styles.progressText}>
              {foundCount} OF {totalReal} REAL MEANINGS FOUND
            </Text>
          )}
        </View>

      </View>

      {/* MASTER GATE slot */}
      {hasHidden && showBoardContent && (
        ghostVisible && ghost ? (
          <GhostTile
            ghost={ghost}
            tileHeight={tileHeight}
            onCorrect={handleGhostSwipeUp}
            onWrong={handleGhostSwipeRight}
            onDone={() => setGhostVisible(false)}
          />
        ) : (
          <MasterGateTile
            perfectClear={perfectClear}
            onMasteredSwipe={handleMasteredSwipe}
            tileHeight={tileHeight}
          />
        )
      )}

      {/* tile stack */}
      <View
        style={styles.gridWrap}
        onLayout={e => setGridHeight(e.nativeEvent.layout.height)}
      >
        {showBoardContent && (() => {
          const stagger = step.tileStagger ?? 80;
          const orderedMasks = step.bossModifier === 'reverseMountOrder'
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
                tileHeight={tileHeight}
                entryDelay={index * stagger}
                hapticCorrect={hapticCorrect}
              />
            </View>
          ));
        })()}

      </View>

      {/* glass shards */}
      {shatterOrigin && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
        >
          {SHARD_CONFIGS.map((cfg, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left:         shatterOrigin.x - cfg.w / 2,
                top:          shatterOrigin.y - cfg.h / 2,
                width:        cfg.w,
                height:       cfg.h,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderWidth:  1.5,
                borderColor:  'rgba(255,255,255,0.9)',
                opacity: shardAnims[i].op,
                transform: [
                  { translateX: shardAnims[i].x },
                  { translateY: shardAnims[i].y },
                  {
                    rotate: shardAnims[i].rot.interpolate({
                      inputRange:  [0, 1],
                      outputRange: ['0deg', `${cfg.finalRot}deg`],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      )}

      {/* score floats */}
      {floats.map(f => (
        <ScoreFloat
          key={f.id}
          value={f.value}
          startPosition={{ x: f.x, y: f.y }}
          color={f.color}
          onComplete={() => setFloats(prev => prev.filter(e => e.id !== f.id))}
        />
      ))}

      {/* dim overlay — used by mastered reveal to cover tiles */}
      {dimVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: '#1E1A3A', opacity: dimOpacity, zIndex: 100 },
          ]}
        />
      )}

      {/* mastered reveal overlays */}
      {masteredVisible && (
        <>
          {/* gold flash */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: '#F5C842', opacity: masteredFlashOpacity, zIndex: 999 },
            ]}
          />

          {/* word zoom + MASTERED stamp */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                zIndex: 998,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: masteredOverlayOpacity,
              },
            ]}
          >
            <Animated.Text
              style={[
                isBoss ? styles.wordBoss : styles.word,
                {
                  color: '#FFFFFF',
                  transform: [
                    { scale: masteredWordScale },
                    { translateY: masteredWordTransY },
                  ],
                },
              ]}
            >
              {step.word}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.masteredLabel,
                {
                  opacity: masteredTextOpacity,
                  transform: [{ scale: masteredTextScale }],
                },
              ]}
            >
              MASTERED
            </Animated.Text>
          </Animated.View>
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
  // ── Polly Zone ────────────────────────────────────────────────
  pollyZone: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  wordOverlay: {
    position: 'absolute',
    bottom: -44,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  kicker: {
    color: '#FFD700',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  word: {
    fontSize: FONT_SIZES.wordDisplay,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: FONT_SIZES.wordDisplayLetterSpacing,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
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
  },
  speechLine: {
    fontFamily: FONTS.brand,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: 'center',
    marginTop: 52,
  },
  progressText: {
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 52,
  },
  gridWrap: {
    flex: 1,
  },
  // ── mastered reveal ───────────────────────────────────────────
  masteredLabel: {
    fontFamily: FONTS.brand,
    fontSize: 36,
    color: '#F5C842',
    letterSpacing: 4,
    marginTop: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});
