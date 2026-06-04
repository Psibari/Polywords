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
import { playSplitReveal } from '../utils/SoundEngine';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 6;
const TILE_H     = 58;
const HIDDEN_H   = 76;

// ── Glass shard configs ───────────────────────────────────────
const SHARD_CONFIGS = [
  { w:  90, h: 14, finalX: -120, finalY:  -80, finalRot: -35, dur: 200 },
  { w:  60, h: 18, finalX:  100, finalY:  -90, finalRot:  28, dur: 190 },
  { w: 110, h: 12, finalX:  -30, finalY:   70, finalRot: -15, dur: 220 },
  { w:  75, h: 16, finalX:   80, finalY:   60, finalRot:  42, dur: 210 },
] as const;

type FloatEntry    = { id: number; value: number; x: number; y: number; color: string };
type ShatterOrigin = { x: number; y: number } | null;

type Props = {
  step: WordStep;
  spawnEffect?: (type: 'shard' | 'trail', x: number, y: number) => void;
};

function eventKicker(step: WordStep): string | null {
  if (step.eventType === 'bossWord')  return 'BOSS WORD · 2× SCORE';
  if (step.eventType === 'slangDrop') return 'SLANG DROP';
  return null;
}

export function MaskBoard({ step, spawnEffect }: Props) {
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
  const [containerWidth, setContainerWidth] = useState(350);
  const containerWidthRef                   = useRef(350);
  const containerRef = useRef<View>(null);

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

  // ── master gate ───────────────────────────────────────────────
  const hasHidden = !!step.hiddenMeaning;

  const hiddenRealMask: Mask | null = step.hiddenMeaning
    ? { id: `${step.word}_hidden_real`, emoji: step.hiddenEmoji ?? '✨', phrase: step.hiddenMeaning, isReal: true }
    : null;
  const hiddenTrapMask: Mask | null = step.hiddenMeaning
    ? { id: `${step.word}_hidden_trap`, emoji: step.hiddenTrapEmoji ?? '🪤', phrase: step.hiddenTrap ?? 'Not this one', isReal: false }
    : null;

  const [perfectClear, setPerfectClear] = useState(false);
  const [splitTilesVisible, setSplitTilesVisible] = useState(false);
  const [splitStates, setSplitStates] = useState<Map<string, SwipeMaskState>>(new Map());

  // Split tile drop animations — native driver only
  const splitTile1TransY  = useRef(new Animated.Value(-100)).current;
  const splitTile2TransY  = useRef(new Animated.Value(-100)).current;
  const splitCompletedRef = useRef(false);

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
    completedRef.current          = false;
    gateTriggeredRef.current      = false;
    ghostJudgedCorrectRef.current = false;
    splitCompletedRef.current     = false;
    bossShakeX.setValue(0);
    if (!isBoss) bossWordTranslateY.setValue(0);
    goldTextOpacity.setValue(0);
    setSplitTilesVisible(false);
    setSplitStates(new Map());
    splitTile1TransY.setValue(-100);
    splitTile2TransY.setValue(-100);
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
        toValue: 0, tension: 280, friction: 6, useNativeDriver: true,
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

    return () => clearTimeout(t1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Shatter animation (legacy glass shards inside board)
  useEffect(() => {
    if (!shatterOrigin) return;
    shardAnims.forEach((fa, i) => {
      fa.x.setValue(0); fa.y.setValue(0); fa.rot.setValue(0); fa.op.setValue(1);
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

  // ── Gate opened — spawn split tiles ──────────────────────────
  function handleGateOpened() {
    splitTile1TransY.setValue(-100);
    splitTile2TransY.setValue(-100);
    setSplitTilesVisible(true);

    Animated.spring(splitTile1TransY, {
      toValue: 0, damping: 12, stiffness: 120, useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.spring(splitTile2TransY, {
        toValue: 0, damping: 12, stiffness: 120, useNativeDriver: true,
      }).start();
    }, 80);
  }

  function handleSplitSwipeUp(maskId: string) {
    const isReal = maskId === `${step.word}_hidden_real`;
    if (isReal) {
      setSplitStates(prev => new Map(prev).set(maskId, 'correct'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      store.submitWrongSwipe();
      setSplitStates(prev => new Map(prev).set(maskId, 'wrong'));
      firePollyEvent('wrong');
    }
  }

  function handleSplitSwipeRight(maskId: string) {
    const isReal = maskId === `${step.word}_hidden_real`;
    if (!isReal) {
      setSplitStates(prev => new Map(prev).set(maskId, 'trap-caught'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      store.submitWrongSwipe();
      setSplitStates(prev => new Map(prev).set(maskId, 'wrong'));
      firePollyEvent('wrong');
    }
  }

  // ── split tile completion ─────────────────────────────────────
  useEffect(() => {
    if (!splitTilesVisible || splitCompletedRef.current || !hiddenRealMask || !hiddenTrapMask) return;
    const realState = splitStates.get(hiddenRealMask.id);
    const trapState = splitStates.get(hiddenTrapMask.id);
    const realJudged = realState === 'correct' || realState === 'wrong';
    const trapJudged = trapState === 'trap-caught' || trapState === 'wrong';
    if (!realJudged || !trapJudged) return;

    splitCompletedRef.current = true;
    completedRef.current = true;

    if (realState === 'correct' && trapState === 'trap-caught') {
      store.addBonusScore(300);
      spawnFloatAtSplit(300, '#F5C842');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      firePollyEvent('gateMastered');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      if (!ghostJudgedCorrectRef.current) store.clearGhost(step.word);
      store.completeWord();
    }, 800);
  }, [splitStates]); // eslint-disable-line react-hooks/exhaustive-deps

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
      gateTriggeredRef.current = true;
      firePollyEvent('allMasksFound');
      playSplitReveal();
      setPerfectClear(true);
    } else {
      gateTriggeredRef.current = true;
      setTimeout(() => {
        if (hasHidden && !ghostJudgedCorrectRef.current) {
          store.addGhostedMaster(step.word);
        }
        store.completeWord();
      }, 1200);
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
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
    } else {
      store.submitWrongSwipe();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      firePollyEvent('wrong');
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
      <View style={styles.wordZone} pointerEvents="none">
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

          {/* Absorption ring */}
          <Animated.View
            pointerEvents="none"
            style={[styles.goldRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
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
        {showBoardContent && (() => {
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
                onEffect={spawnEffect}
              />
            </View>
          ));
        })()}

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
          ) : splitTilesVisible && hiddenRealMask && hiddenTrapMask ? (
            <View style={styles.splitZone}>
              <Animated.View style={{ transform: [{ translateY: splitTile1TransY }] }}>
                <SwipeMask
                  mask={hiddenRealMask}
                  state={splitStates.get(hiddenRealMask.id) ?? 'idle'}
                  onSwipeUp={() => handleSplitSwipeUp(hiddenRealMask.id)}
                  onSwipeDown={() => handleSplitSwipeRight(hiddenRealMask.id)}
                  onSwipeReveal={() => {}}
                  revealable={false}
                  tileHeight={TILE_H}
                  entryDelay={0}
                  onEffect={spawnEffect}
                />
              </Animated.View>
              <Animated.View style={{ marginTop: TILE_GAP, transform: [{ translateY: splitTile2TransY }] }}>
                <SwipeMask
                  mask={hiddenTrapMask}
                  state={splitStates.get(hiddenTrapMask.id) ?? 'idle'}
                  onSwipeUp={() => handleSplitSwipeUp(hiddenTrapMask.id)}
                  onSwipeDown={() => handleSplitSwipeRight(hiddenTrapMask.id)}
                  onSwipeReveal={() => {}}
                  revealable={false}
                  tileHeight={TILE_H}
                  entryDelay={0}
                  onEffect={spawnEffect}
                />
              </Animated.View>
            </View>
          ) : (
            <MasterGateTile
              perfectClear={perfectClear}
              onGateOpened={handleGateOpened}
              tileHeight={HIDDEN_H}
            />
          )
        )}
      </View>

      {/* Legacy glass shards (inside-board fallback) */}
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
