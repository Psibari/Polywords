import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mask, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';
import { PollyCard } from './PollyCard';
import { playSplitReveal, playRoundComplete } from '../utils/SoundEngine';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 10;
const MIN_TILE_H = 48;
const MAX_TILE_H = 64;

type FloatEntry   = { id: number; value: number; x: number; y: number };
type HiddenPhase  = 'visible' | 'locked' | 'split';
type SplitPair    = { left: SwipeMaskState; right: SwipeMaskState };

type Props = { step: WordStep };

export function MaskBoard({ step }: Props) {
  const store     = useGameStore();
  const isBoss    = step.eventType === 'bossWord';
  const wordColor = isBoss ? '#FFD700' : '#FFFFFF';

  // ── tile state map ──────────────────────────────────────────
  const [tileStates, setTileStates] = useState<Map<string, SwipeMaskState>>(() => {
    const m = new Map<string, SwipeMaskState>();
    step.masks.forEach(mask => m.set(mask.id, 'idle'));
    return m;
  });

  const wrongCountRef     = useRef(0);
  const completedRef      = useRef(false);
  const splitTriggeredRef = useRef(false);

  // ── available height / width ─────────────────────────────────
  const [gridHeight, setGridHeight]         = useState(0);
  const [containerWidth, setContainerWidth] = useState(350);
  const containerWidthRef                   = useRef(350);

  const visibleGridMasks = store.game.shuffledMasks[store.game.stepIndex]
    ?? step.masks.filter(m => !m.isHidden);
  const tileCount = visibleGridMasks.length;

  const tileHeight: number = gridHeight > 0
    ? Math.min(MAX_TILE_H, Math.max(MIN_TILE_H, Math.floor(gridHeight / tileCount - TILE_GAP)))
    : MAX_TILE_H;

  // ── find-meter counts ────────────────────────────────────────
  const realMasks  = visibleGridMasks.filter(m => m.isReal);
  const totalReal  = realMasks.length;
  const foundCount = realMasks.filter(m => tileStates.get(m.id) === 'correct').length;

  // ── absorption animation ────────────────────────────────────
  const absorptionScale       = useRef(new Animated.Value(1)).current;
  const ringScale             = useRef(new Animated.Value(1)).current;
  const ringOpacity           = useRef(new Animated.Value(0)).current;
  const wordEntryOpacity      = useRef(new Animated.Value(0)).current;
  const wordEntryScale        = useRef(new Animated.Value(0.85)).current;
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
  const [absorbedPhrase, setAbsorbedPhrase] = useState<string | null>(null);

  // ── boss entrance animated values ────────────────────────────
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

  // ── container ref ───────────────────────────────────────────
  const containerRef = useRef<View>(null);

  // ── boss state ───────────────────────────────────────────────
  const [bossReady, setBossReady]             = useState(!isBoss);
  const [bossSweepActive, setBossSweepActive] = useState(false);
  // boss words suppress the PollyCard intro — bossWord trigger fires after entrance instead
  const bossSuppressIntro = isBoss;

  // ── tile refs (for score float spawn position) ───────────────
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

  function spawnFloat(value: number, maskId: string) {
    const refObj    = tileRefs.current.get(maskId);
    const view      = refObj ? refObj.current : null;
    const container = containerRef.current;

    if (view && container) {
      container.measure((_cx, _cy, _cw, _ch, cPageX, cPageY) => {
        view.measure((_x, _y, w, h, pageX, pageY) => {
          const id = ++floatIdRef.current;
          setFloats(prev => [...prev, {
            id, value,
            x: pageX - cPageX + w / 2,
            y: pageY - cPageY + h / 2,
          }]);
        });
      });
    } else if (view) {
      view.measure((_x, _y, w, h, pageX, pageY) => {
        const id = ++floatIdRef.current;
        setFloats(prev => [...prev, { id, value, x: pageX + w / 2, y: pageY + h / 2 }]);
      });
    } else {
      const id = ++floatIdRef.current;
      setFloats(prev => [...prev, { id, value, x: containerWidth / 2, y: 200 }]);
    }
  }

  function spawnFloatAtSplit(value: number) {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, value, x: containerWidth / 2, y: 300 }]);
  }

  // ── hidden meaning tile system ────────────────────────────────
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

  // Border color loop — runs while tile is in 'visible' phase
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

  // Reset boss animated values on mount — guards against native-layer residuals between words
  useEffect(() => {
    bossShakeX.setValue(0);
    if (!isBoss) bossWordTranslateY.setValue(0);
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word title: fade + scale in on word change (boss skips — has own entrance)
  useEffect(() => {
    if (isBoss) return;
    wordEntryOpacity.setValue(0);
    wordEntryScale.setValue(0.85);
    Animated.parallel([
      Animated.timing(wordEntryOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(wordEntryScale,   { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hidden tile staggered entry — skipped for boss (handled by bossReady effect)
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

  // Boss: animate hidden tile in after tiles have staggered
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
      // Make word visible — spring handles the translate from -300
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);

      Animated.spring(bossWordTranslateY, {
        toValue: 0,
        tension: 280,
        friction: 6,
        useNativeDriver: true,
      }).start();

      // Fire impact effects when word hits baseline (~300ms into the spring)
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Screen shake: 0 → 4 → -4 → 3 → -3 → 1 → 0, 180ms total
        Animated.sequence([
          Animated.timing(bossShakeX, { toValue:  4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -4, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue: -3, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  1, duration: 30, useNativeDriver: true }),
          Animated.timing(bossShakeX, { toValue:  0, duration: 30, useNativeDriver: true }),
        ]).start();

        // Gold sweep starts 100ms after impact
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
            // Beam fades out
            Animated.timing(bossSweepOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setBossSweepActive(false);

              // Reset hidden tile values before showing board so it animates in cleanly
              if (hasHidden) {
                hiddenEntryOpacity.setValue(0);
                hiddenEntryTransY.setValue(30);
                hiddenEntryScaleY.setValue(0.85);
              }

              // Fire Polly boss line, then show tiles
              store.setPollyTrigger('bossWord');
              setBossReady(true);
            });
          });
        }, 100);
      }, 300);
    }, 600);

    return () => clearTimeout(t1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function lockHidden() {
    hiddenBorderLoopRef.current?.stop();
    setHiddenPhase('locked');
    Animated.timing(hiddenTileOpacity, { toValue: 0.2, duration: 300, useNativeDriver: true }).start();
    store.setPollyTrigger('locked');
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
                      store.setPollyTrigger('hiddenReveal');
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

  // ── split tile state helpers ─────────────────────────────────
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
      store.setPollyTrigger('cleanSplit');
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
      spawnFloatAtSplit(100);
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
      spawnFloatAtSplit(50);
      store.addBonusScore(50);
      updateSplitState(side, 'trap-caught');
    } else {
      store.submitWrongSwipe();
      updateSplitState(side, 'wrong');
    }
  }

  // ── completion check ──────────────────────────────────────────
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
      splitTriggeredRef.current = true;
      store.setPollyTrigger('perfect');
      startSplit();
    } else {
      completedRef.current = true;
      setTimeout(() => store.completeWord(), 700);
    }
  }, [tileStates]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── swipe handlers ────────────────────────────────────────────
  function handleSwipeUp(maskId: string) {
    const mask = step.masks.find(m => m.id === maskId)!;
    if (mask.isReal) {
      store.submitSwipeUp(maskId);
      spawnFloat(mask.isRare ? 300 : 100, maskId);
      triggerAbsorption(mask.phrase);
      setTileStates(prev => new Map(prev).set(maskId, 'correct'));
    } else {
      store.submitWrongSwipe();
      wrongCountRef.current++;
      if (wrongCountRef.current === 1 && hasHidden) lockHidden();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    }
  }

  function handleSwipeRight(maskId: string) {
    const mask = step.masks.find(m => m.id === maskId)!;
    if (!mask.isReal) {
      store.submitSwipeDown(maskId);
      spawnFloat(50, maskId);
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
    } else {
      store.submitWrongSwipe();
      wrongCountRef.current++;
      if (wrongCountRef.current === 1 && hasHidden) lockHidden();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    }
  }

  const showBoardContent = !isBoss || bossReady;

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
      {/* word header */}
      <View style={styles.header}>
        <View style={styles.wordContainer}>
          <Animated.Text
            style={[
              styles.word,
              isBoss && styles.wordBoss,
              {
                color: wordColor,
                opacity: wordEntryOpacity,
                transform: [
                  { scale: absorptionScale },
                  { scale: wordEntryScale },
                  { translateY: bossWordTranslateY },
                ],
              },
            ]}
          >
            {step.word}
          </Animated.Text>

          <Animated.View
            pointerEvents="none"
            style={[styles.goldRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
        </View>

        {absorbedPhrase !== null && (
          <Animated.Text style={[styles.absorbedPhrase, { opacity: absorbedPhraseOpacity }]}>
            {absorbedPhrase}
          </Animated.Text>
        )}

        {/* Boss gold sweep — absolutely positioned over the header */}
        {bossSweepActive && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
            }}
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
      </View>

      {/* Polly Card strip */}
      <PollyCard
        step={step}
        foundCount={foundCount}
        totalReal={totalReal}
        suppressIntro={bossSuppressIntro}
      />

      {/* HIDDEN MEANING tile — gated for boss until tiles are ready */}
      {hasHidden && hiddenPhase !== 'split' && showBoardContent && (
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
      )}

      {/* tile stack — gridWrap always renders to keep height measurement */}
      <View
        style={styles.gridWrap}
        onLayout={e => setGridHeight(e.nativeEvent.layout.height)}
      >
        {showBoardContent && visibleGridMasks.map((mask, index) => (
          <View key={mask.id} ref={getTileRef(mask.id)}>
            <SwipeMask
              mask={mask}
              state={tileStates.get(mask.id) ?? 'idle'}
              onSwipeUp={() => handleSwipeUp(mask.id)}
              onSwipeDown={() => handleSwipeRight(mask.id)}
              onTapReveal={() => {}}
              revealable={false}
              tileHeight={tileHeight}
              entryDelay={index * (isBoss ? 100 : 80)}
            />
          </View>
        ))}

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
                onTapReveal={() => {}}
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
                onTapReveal={() => {}}
                tileHeight={tileHeight}
                isSpecialSplit
              />
            </Animated.View>
          </View>
        )}
      </View>

      {/* score floats */}
      {floats.map(f => (
        <ScoreFloat
          key={f.id}
          value={f.value}
          startPosition={{ x: f.x, y: f.y }}
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
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  word: {
    fontSize: 58,
    fontWeight: '400',
    fontFamily: 'BagelFatOne_400Regular',
    letterSpacing: 3,
  },
  wordBoss: {
    fontSize: 76,
  },
  wordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldRing: {
    position: 'absolute',
    width: 160,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#FFD700',
  },
  absorbedPhrase: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  hiddenTile: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1A1830',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenTileText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#FFFFFF',
  },
  gridWrap: {
    flex: 1,
  },
  splitStack: {
    marginTop: TILE_GAP,
  },
});
