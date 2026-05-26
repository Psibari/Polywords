import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Mask, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 10;
const MIN_TILE_H = 68;
const MAX_TILE_H = 72;

type FloatEntry = { id: number; value: number; x: number; y: number };
type QPhase     = 'visible' | 'locked' | 'split';
type SplitPair  = { left: SwipeMaskState; right: SwipeMaskState };

type Props = { step: WordStep };

function eventEyebrow(step: WordStep): string | null {
  if (step.eventType === 'speedRound') return 'SPEED ROUND';
  if (step.eventType === 'bossWord')   return 'BOSS WORD';
  if (step.eventType === 'slangDrop')  return 'SLANG DROP';
  return null;
}

export function MaskBoard({ step }: Props) {
  const store = useGameStore();

  // ── tile state map ──────────────────────────────────────────
  const [tileStates, setTileStates] = useState<Map<string, SwipeMaskState>>(() => {
    const m = new Map<string, SwipeMaskState>();
    step.masks.forEach(mask => m.set(mask.id, 'idle'));
    return m;
  });

  const wrongCountRef     = useRef(0);
  const completedRef      = useRef(false);
  const splitTriggeredRef = useRef(false);

  // ── available height / width for tile stack ─────────────────
  const [gridHeight, setGridHeight]         = useState(0);
  const [containerWidth, setContainerWidth] = useState(350);

  const visibleGridMasks = store.game.shuffledMasks[store.game.stepIndex]
    ?? step.masks.filter(m => !m.isHidden);
  const tileCount = visibleGridMasks.length;

  const tileHeight: number = gridHeight > 0
    ? Math.min(MAX_TILE_H, Math.max(MIN_TILE_H, Math.floor(gridHeight / tileCount - TILE_GAP)))
    : MAX_TILE_H;

  // ── absorption animation ────────────────────────────────────
  const absorptionScale       = useRef(new Animated.Value(1)).current;
  const ringScale             = useRef(new Animated.Value(1)).current;
  const ringOpacity           = useRef(new Animated.Value(0)).current;
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
  const [absorbedPhrase, setAbsorbedPhrase] = useState<string | null>(null);

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

  // ── ❓ tile system ────────────────────────────────────────────
  const hasHidden = !!step.hiddenMeaning;

  const [qPhase, setQPhase]               = useState<QPhase>('visible');
  const [qBorderColor, setQBorderColor]   = useState('#FFD700');
  const [showSplitBars, setShowSplitBars] = useState(false);
  const [splitTopIsReal, setSplitTopIsReal] = useState(false);

  const splitTopIsRealRef  = useRef(false);
  const splitStatesRef     = useRef<SplitPair>({ left: 'idle', right: 'idle' });
  const [splitTileStates, setSplitTileStates] = useState<SplitPair>({ left: 'idle', right: 'idle' });

  // ❓ animated values
  const pulseAnim    = useRef(new Animated.Value(0.5)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const qOpacity     = useRef(new Animated.Value(1)).current;
  const qScaleX      = useRef(new Animated.Value(1)).current;
  const topScaleY    = useRef(new Animated.Value(0)).current;
  const bottomScaleY = useRef(new Animated.Value(0)).current;

  // Hidden split masks
  const hiddenRealMask: Mask = {
    id:     'hidden_real',
    emoji:  step.hiddenEmoji     ?? '❓',
    phrase: step.hiddenMeaning   ?? '',
    isReal: true,
  };
  const hiddenTrapMask: Mask = {
    id:     'hidden_trap',
    emoji:  step.hiddenTrapEmoji ?? '❓',
    phrase: step.hiddenTrap      ?? '',
    isReal: false,
  };

  // ── pulse loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasHidden || qPhase !== 'visible') return;
    pulseAnim.setValue(0.5);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 750, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.5, duration: 750, useNativeDriver: true }),
    ]));
    pulseLoopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [qPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── lock ❓ on first wrong swipe ─────────────────────────────
  function lockQuestion() {
    pulseLoopRef.current?.stop();
    setQBorderColor('#444444');
    setQPhase('locked');
    Animated.timing(qOpacity, { toValue: 0.2, duration: 300, useNativeDriver: true }).start();
    store.setPollyTrigger('locked');
  }

  // ── collapse ❓ bar and drop two split tiles ───────────────────
  function startSplit() {
    pulseLoopRef.current?.stop();

    const topIsReal = Math.random() > 0.5;
    setSplitTopIsReal(topIsReal);
    splitTopIsRealRef.current = topIsReal;

    topScaleY.setValue(0);
    bottomScaleY.setValue(0);
    qScaleX.setValue(1);

    // Phase 1: collapse ❓ bar horizontally
    Animated.timing(qScaleX, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setQPhase('split');
      setShowSplitBars(true);

      // One frame so React mounts tiles before animating them
      setTimeout(() => {
        Animated.timing(topScaleY, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        setTimeout(() => {
          Animated.timing(bottomScaleY, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        }, 80);
      }, 16);
    });
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
      spawnFloatAtSplit(300);
      store.addBonusScore(300);
      store.setPollyTrigger('cleanSplit');
    }

    completedRef.current = true;
    setTimeout(() => store.completeWord(), 900);
  }

  // top tile = 'left' in SplitPair; bottom tile = 'right'
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
      setTimeout(() => startSplit(), 350);
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
      if (wrongCountRef.current === 1 && hasHidden) lockQuestion();
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
      if (wrongCountRef.current === 1 && hasHidden) lockQuestion();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    }
  }

  // ── render ────────────────────────────────────────────────────
  const eyebrow   = eventEyebrow(step);
  const isBoss    = step.eventType === 'bossWord';
  const wordColor = isBoss ? '#FFD700' : '#FFFFFF';

  return (
    <View
      style={styles.container}
      ref={containerRef}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
    >

      {/* word header */}
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

        <View style={styles.wordContainer}>
          <Animated.Text
            style={[styles.word, { color: wordColor, transform: [{ scale: absorptionScale }] }]}
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
      </View>

      {/* swipe hints */}
      <View style={styles.hintRow}>
        <Text style={styles.hint}>↑ real meaning</Text>
        <Text style={styles.hint}>→ trap</Text>
      </View>

      {/* ❓ tile — collapses scaleX→0 when split fires */}
      {hasHidden && qPhase !== 'split' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.questionTile,
            { borderColor: qBorderColor, opacity: qOpacity, transform: [{ scaleX: qScaleX }] },
          ]}
        >
          <Animated.Text style={[styles.questionMark, { opacity: pulseAnim }]}>❓</Animated.Text>
        </Animated.View>
      )}

      {/* tile stack */}
      <View
        style={styles.gridWrap}
        onLayout={e => setGridHeight(e.nativeEvent.layout.height)}
      >
        {visibleGridMasks.map(mask => (
          <View key={mask.id} ref={getTileRef(mask.id)}>
            <SwipeMask
              mask={mask}
              state={tileStates.get(mask.id) ?? 'idle'}
              onSwipeUp={() => handleSwipeUp(mask.id)}
              onSwipeDown={() => handleSwipeRight(mask.id)}
              onTapReveal={() => {}}
              revealable={false}
              tileHeight={tileHeight}
            />
          </View>
        ))}

        {/* split tiles — stacked vertically below judged tiles */}
        {showSplitBars && (
          <View style={styles.splitStack}>
            <Animated.View style={{ transform: [{ scaleY: topScaleY }] }}>
              <SwipeMask
                mask={splitTopIsReal ? hiddenRealMask : hiddenTrapMask}
                state={splitTileStates.left}
                onSwipeUp={() => handleSplitSwipeUp('left')}
                onSwipeDown={() => handleSplitSwipeRight('left')}
                onTapReveal={() => {}}
                tileHeight={tileHeight}
              />
            </Animated.View>
            <View style={{ height: TILE_GAP }} />
            <Animated.View style={{ transform: [{ scaleY: bottomScaleY }] }}>
              <SwipeMask
                mask={splitTopIsReal ? hiddenTrapMask : hiddenRealMask}
                state={splitTileStates.right}
                onSwipeUp={() => handleSplitSwipeUp('right')}
                onSwipeDown={() => handleSplitSwipeRight('right')}
                onTapReveal={() => {}}
                tileHeight={tileHeight}
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
    </View>
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
    paddingBottom: 8,
  },
  eyebrow: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 2,
  },
  word: {
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 3,
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
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  hint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionTile: {
    marginTop: 16,
    marginBottom: 24,
    height: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMark: {
    fontSize: 24,
    color: '#FFD700',
  },
  gridWrap: {
    flex: 1,
  },
  splitStack: {
    marginTop: TILE_GAP,
  },
});
