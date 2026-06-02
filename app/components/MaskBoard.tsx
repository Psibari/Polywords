import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
type HiddenPhase   = 'visible' | 'locked' | 'split';
type SplitPair     = { left: SwipeMaskState; right: SwipeMaskState };
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

  const wrongCountRef         = useRef(0);
  const completedRef          = useRef(false);
  const splitTriggeredRef     = useRef(false);
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

  // ── hidden meaning ────────────────────────────────────────────
  const hasHidden = !!step.hiddenMeaning;

  const [hiddenPhase, setHiddenPhase]       = useState<HiddenPhase>('visible');
  const [showSplitBars, setShowSplitBars]   = useState(false);
  const [splitTopIsReal, setSplitTopIsReal] = useState(false);
  const [dimVisible, setDimVisible]         = useState(false);

  const splitTopIsRealRef = useRef(false);
  const splitStatesRef    = useRef<SplitPair>({ left: 'idle', right: 'idle' });
  const [splitTileStates, setSplitTileStates] = useState<SplitPair>({ left: 'idle', right: 'idle' });

  const hiddenBorderAnim    = useRef(new Animated.Value(0)).current;
  const hiddenBorderLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const hiddenTileOpacity   = useRef(new Animated.Value(1)).current;
  const hiddenTileScale     = useRef(new Animated.Value(1)).current;
  const hiddenTileTransY    = useRef(new Animated.Value(0)).current;
  const hiddenTileScaleX    = useRef(new Animated.Value(1)).current;
  const dimOpacity          = useRef(new Animated.Value(0)).current;

  const hiddenEntryOpacity = useRef(new Animated.Value(0)).current;
  const hiddenEntryTransY  = useRef(new Animated.Value(30)).current;
  const hiddenEntryScaleY  = useRef(new Animated.Value(0.85)).current;

  const splitTopOpacity = useRef(new Animated.Value(0)).current;
  const splitTopTransY  = useRef(new Animated.Value(-40)).current;
  const splitTopScaleY  = useRef(new Animated.Value(0)).current;
  const splitTopPulse   = useRef(new Animated.Value(1)).current;
  const splitBotOpacity = useRef(new Animated.Value(0)).current;
  const splitBotTransY  = useRef(new Animated.Value(-40)).current;
  const splitBotScaleY  = useRef(new Animated.Value(0)).current;
  const splitBotPulse   = useRef(new Animated.Value(1)).current;

  const hiddenRealMask: Mask = {
    id:     'hidden_real',
    emoji:  step.hiddenEmoji     ?? '✨',
    phrase: step.hiddenMeaning   ?? '',
    isReal: true,
  };
  const hiddenTrapMask: Mask = {
    id:     'hidden_trap',
    emoji:  step.hiddenTrapEmoji ?? '❓',
    phrase: step.hiddenTrap      ?? '',
    isReal: false,
  };

  const hiddenBorderColor = hiddenBorderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#4CAF50', '#FFD700'],
  });

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

  // ── border loop ──────────────────────────────────────────────
  useEffect(() => {
    if (!hasHidden || hiddenPhase !== 'visible') return;
    hiddenBorderAnim.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(hiddenBorderAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
      Animated.timing(hiddenBorderAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
    ]));
    hiddenBorderLoopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [hiddenPhase]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Hidden tile entry (non-boss)
  useEffect(() => {
    if (!hasHidden || isBoss) return;
    const id = setTimeout(() => {
      Animated.parallel([
        Animated.spring(hiddenEntryTransY,  { toValue: 0, tension: 160, friction: 14, useNativeDriver: true }),
        Animated.spring(hiddenEntryScaleY,  { toValue: 1, tension: 160, friction: 14, useNativeDriver: true }),
        Animated.timing(hiddenEntryOpacity, { toValue: 1, duration: 250,              useNativeDriver: true }),
      ]).start();
    }, visibleGridMasks.length * 80);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hidden tile entry after boss entrance
  useEffect(() => {
    if (!isBoss || !bossReady || !hasHidden) return;
    const id = setTimeout(() => {
      Animated.parallel([
        Animated.spring(hiddenEntryTransY,  { toValue: 0, tension: 160, friction: 14, useNativeDriver: true }),
        Animated.spring(hiddenEntryScaleY,  { toValue: 1, tension: 160, friction: 14, useNativeDriver: true }),
        Animated.timing(hiddenEntryOpacity, { toValue: 1, duration: 250,              useNativeDriver: true }),
      ]).start();
    }, visibleGridMasks.length * 100);
    return () => clearTimeout(id);
  }, [bossReady]); // eslint-disable-line react-hooks/exhaustive-deps

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

              if (hasHidden) {
                hiddenEntryOpacity.setValue(0);
                hiddenEntryTransY.setValue(30);
                hiddenEntryScaleY.setValue(0.85);
              }

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

  function lockHidden() {
    hiddenBorderLoopRef.current?.stop();
    setHiddenPhase('locked');
    Animated.timing(hiddenTileOpacity, { toValue: 0.2, duration: 300, useNativeDriver: true }).start();
  }

  // ── Cinematic split sequence ──────────────────────────────────
  function startSplit() {
    hiddenBorderLoopRef.current?.stop();
    hiddenBorderAnim.setValue(1);

    const topIsReal = Math.random() > 0.5;

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hiddenTileScale, { toValue: 1.06, duration: 180, useNativeDriver: true }),
          Animated.timing(hiddenTileScale, { toValue: 1.0,  duration: 180, useNativeDriver: true }),
        ]),
        { iterations: 3 },
      ).start(() => {

        Animated.spring(hiddenTileTransY, {
          toValue: -8, tension: 60, friction: 8, useNativeDriver: true,
        }).start(() => {

          setDimVisible(true);
          Animated.timing(dimOpacity, { toValue: 0.25, duration: 150, useNativeDriver: true }).start(() => {

            Animated.timing(hiddenTileScaleX, { toValue: 0.05, duration: 120, useNativeDriver: true }).start(() => {

              setSplitTopIsReal(topIsReal);
              splitTopIsRealRef.current = topIsReal;
              setHiddenPhase('split');
              setShowSplitBars(true);

              splitTopOpacity.setValue(0);
              splitTopTransY.setValue(-40);
              splitTopScaleY.setValue(0);
              splitTopPulse.setValue(1);
              splitBotOpacity.setValue(0);
              splitBotTransY.setValue(-40);
              splitBotScaleY.setValue(0);
              splitBotPulse.setValue(1);

              setTimeout(() => {
                Animated.parallel([
                  Animated.timing(splitTopOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                  Animated.spring(splitTopTransY,  { toValue: 0, damping: 10, stiffness: 300, useNativeDriver: true }),
                  Animated.spring(splitTopScaleY,  { toValue: 1, damping: 12, stiffness: 280, useNativeDriver: true }),
                ]).start();

                setTimeout(() => {
                  Animated.parallel([
                    Animated.timing(splitBotOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                    Animated.spring(splitBotTransY,  { toValue: 0, damping: 10, stiffness: 300, useNativeDriver: true }),
                    Animated.spring(splitBotScaleY,  { toValue: 1, damping: 12, stiffness: 280, useNativeDriver: true }),
                  ]).start(() => {

                    Animated.timing(dimOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                      setDimVisible(false);

                      Animated.loop(Animated.sequence([
                        Animated.timing(splitTopPulse, { toValue: 1.06, duration: 180, useNativeDriver: true }),
                        Animated.timing(splitTopPulse, { toValue: 1.0,  duration: 180, useNativeDriver: true }),
                      ]), { iterations: 2 }).start();

                      Animated.loop(Animated.sequence([
                        Animated.timing(splitBotPulse, { toValue: 1.06, duration: 180, useNativeDriver: true }),
                        Animated.timing(splitBotPulse, { toValue: 1.0,  duration: 180, useNativeDriver: true }),
                      ]), { iterations: 2 }).start();

                      playSplitReveal();
                      // Fire hiddenFound or streakX10 at the reveal moment
                      if (streakRef.current > 0 && streakRef.current % 10 === 0) {
                        firePollyEvent('streakX10');
                      } else {
                        firePollyEvent('hiddenFound');
                      }
                    });
                  });
                }, 80);
              }, 16);
            });
          });
        });
      });
    }, 400);
  }

  // ── split tile helpers ────────────────────────────────────────
  function updateSplitState(side: 'left' | 'right', state: SwipeMaskState) {
    const next: SplitPair = { ...splitStatesRef.current, [side]: state };
    splitStatesRef.current = next;
    setSplitTileStates({ ...next });
    checkSplitDone(next);
  }

  function checkSplitDone(states: SplitPair) {
    const done = (s: SwipeMaskState) =>
      s === 'correct' || s === 'trap-caught' || s === 'wrong';
    if (!done(states.left) || !done(states.right)) return;

    const allCorrect =
      (states.left  === 'correct' || states.left  === 'trap-caught') &&
      (states.right === 'correct' || states.right === 'trap-caught');

    if (allCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playRoundComplete();
      spawnFloatAtSplit(300);
      store.addBonusScore(300);
      firePollyEvent('cleanSweep');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    completedRef.current = true;
    setTimeout(() => store.completeWord(), 900);
  }

  function handleSplitSwipeUp(side: 'left' | 'right') {
    const sideIsReal = side === 'left'
      ? splitTopIsRealRef.current
      : !splitTopIsRealRef.current;
    if (sideIsReal) {
      spawnFloatAtSplit(100, '#F5C842');
      store.addBonusScore(100);
      updateSplitState(side, 'correct');
    } else {
      store.submitWrongSwipe();
      updateSplitState(side, 'wrong');
    }
  }

  function handleSplitSwipeRight(side: 'left' | 'right') {
    const sideIsReal = side === 'left'
      ? splitTopIsRealRef.current
      : !splitTopIsRealRef.current;
    if (!sideIsReal) {
      spawnFloatAtSplit(50, '#7B2D8B');
      store.addBonusScore(50);
      updateSplitState(side, 'trap-caught');
    } else {
      store.submitWrongSwipe();
      updateSplitState(side, 'wrong');
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

  // ── completion check ─────────────────────────────────────────
  useEffect(() => {
    if (completedRef.current || splitTriggeredRef.current) return;

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
      if (!ghostJudgedCorrectRef.current) store.clearGhost(step.word);
      splitTriggeredRef.current = true;
      firePollyEvent('allMasksFound');
      startSplit();
    } else {
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
      wrongCountRef.current++;
      if (wrongCountRef.current === 1 && hasHidden) lockHidden();
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
      wrongCountRef.current++;
      if (wrongCountRef.current === 1 && hasHidden) lockHidden();
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
      onStartShouldSetResponder={() => true}
    >
      {/* ── POLLY ZONE ────────────────────────────────────────── */}
      <View style={styles.pollyZone}>

        {/* ghost tint overlay */}
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

        {/* Polly sprite */}
        <Animated.View
          style={[
            pollyAnimatedStyle,
            { position: 'absolute', bottom: 0, alignSelf: 'center' },
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

      {/* HIDDEN MEANING slot */}
      {hasHidden && hiddenPhase !== 'split' && showBoardContent && (
        ghostVisible && ghost ? (
          <GhostTile
            ghost={ghost}
            tileHeight={tileHeight}
            onCorrect={handleGhostSwipeUp}
            onWrong={handleGhostSwipeRight}
            onDone={() => setGhostVisible(false)}
          />
        ) : (
          <Animated.View
            style={{
              opacity: hiddenEntryOpacity,
              transform: [{ translateY: hiddenEntryTransY }, { scaleY: hiddenEntryScaleY }],
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                marginTop: 8,
                opacity: hiddenTileOpacity,
                transform: [
                  { scale:      hiddenTileScale  },
                  { translateY: hiddenTileTransY },
                  { scaleX:     hiddenTileScaleX },
                ],
              }}
            >
              <Animated.View
                style={[
                  styles.hiddenTile,
                  { height: tileHeight, borderColor: hiddenBorderColor as any },
                ]}
              >
                <Text style={styles.hiddenTileText}>✨ HIDDEN MEANING</Text>
              </Animated.View>
            </Animated.View>
          </Animated.View>
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

        {/* split tiles */}
        {showBoardContent && showSplitBars && (
          <View style={styles.splitStack}>
            <Animated.View
              style={{
                opacity: splitTopOpacity,
                transform: [
                  { translateY: splitTopTransY },
                  { scaleY:     splitTopScaleY },
                  { scale:      splitTopPulse  },
                ],
              }}
            >
              <SwipeMask
                mask={splitTopIsReal ? hiddenRealMask : hiddenTrapMask}
                state={splitTileStates.left}
                onSwipeUp={() => handleSplitSwipeUp('left')}
                onSwipeDown={() => handleSplitSwipeRight('left')}
                onSwipeReveal={() => {}}
                tileHeight={tileHeight}
                isSpecialSplit
              />
            </Animated.View>

            <View style={{ height: TILE_GAP }} />

            <Animated.View
              style={{
                opacity: splitBotOpacity,
                transform: [
                  { translateY: splitBotTransY },
                  { scaleY:     splitBotScaleY },
                  { scale:      splitBotPulse  },
                ],
              }}
            >
              <SwipeMask
                mask={splitTopIsReal ? hiddenTrapMask : hiddenRealMask}
                state={splitTileStates.right}
                onSwipeUp={() => handleSplitSwipeUp('right')}
                onSwipeDown={() => handleSplitSwipeRight('right')}
                onSwipeReveal={() => {}}
                tileHeight={tileHeight}
                isSpecialSplit
              />
            </Animated.View>
          </View>
        )}
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

      {/* dim overlay */}
      {dimVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: '#000000', opacity: dimOpacity, zIndex: 100 },
          ]}
        />
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
    height: 260,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  wordOverlay: {
    position: 'absolute',
    bottom: 16,
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
  // ── hidden tile ───────────────────────────────────────────────
  hiddenTile: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1A1830',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenTileText: {
    fontSize: FONT_SIZES.tileCopy,
    fontFamily: FONTS.label,
    color: '#FFFFFF',
  },
  gridWrap: {
    flex: 1,
  },
  splitStack: {
    marginTop: TILE_GAP,
  },
});
