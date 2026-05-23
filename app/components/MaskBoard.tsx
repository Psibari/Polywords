import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';

type FloatEntry = { id: number; value: number; x: number; y: number };

type Props = {
  step: WordStep;
};

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
    step.masks.forEach(mask => m.set(mask.id, mask.isHidden ? 'hidden' : 'idle'));
    return m;
  });

  const wrongCountRef  = useRef(0);
  const completedRef   = useRef(false);

  // ── word pulse (perfect clear) ──────────────────────────────
  const [wordPulsing, setWordPulsing] = useState(false);
  const wordPulsingRef = useRef(false);
  const wordScale = useRef(new Animated.Value(1)).current;
  const wordPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (wordPulsing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wordScale, { toValue: 1.06, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(wordScale, { toValue: 1.0,  duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      wordPulseLoopRef.current = loop;
      loop.start();
      return () => loop.stop();
    }
    wordPulseLoopRef.current?.stop();
    wordScale.setValue(1);
  }, [wordPulsing]);

  // ── absorption animation (correct swipe up) ─────────────────
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

  // ── container ref (for coordinate conversion) ───────────────
  const containerRef = useRef<View>(null);

  // ── tile refs (for float spawn position) ─────────────────────
  const tileRefs = useRef(new Map<string, React.RefObject<View | null>>());

  function getTileRef(maskId: string): React.RefObject<View | null> {
    if (!tileRefs.current.has(maskId)) {
      tileRefs.current.set(maskId, React.createRef<View>());
    }
    return tileRefs.current.get(maskId)!;
  }

  // ── score floats ────────────────────────────────────────────
  const [floats, setFloats] = useState<FloatEntry[]>([]);
  const floatIdRef = useRef(0);

  function spawnFloat(value: number, maskId: string) {
    const view      = tileRefs.current.get(maskId)?.current;
    const container = containerRef.current;

    if (view && container) {
      container.measure((_cx, _cy, _cw, _ch, cPageX, cPageY) => {
        view.measure((_x, _y, w, h, pageX, pageY) => {
          const id = ++floatIdRef.current;
          setFloats(prev => [...prev, {
            id,
            value,
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
      setFloats(prev => [...prev, { id, value, x: 180, y: 200 }]);
    }
  }

  // ── completion check ─────────────────────────────────────────
  // Runs after each tile-state update via useEffect
  useEffect(() => {
    if (completedRef.current) return;

    const visibleMasks = step.masks.filter(m => !m.isHidden);
    const allVisibleJudged = visibleMasks.every(m => {
      const ts = tileStates.get(m.id);
      return ts === 'correct' || ts === 'wrong';
    });
    if (!allVisibleJudged) return;

    const perfect = wrongCountRef.current === 0;
    const hiddenMask = step.masks.find(m => m.isHidden);

    // if the hidden mask was already revealed, wait for the player to swipe it
    if (hiddenMask && tileStates.get(hiddenMask.id) === 'revealed') return;

    console.log('[perfect-clear]', {
      perfect,
      hasHiddenMask: !!hiddenMask,
      tileStates: [...tileStates.entries()].map(([k, v]) => `${k}:${v}`),
    });

    if (perfect && hiddenMask) {
      // pulse word so player taps to reveal; fire Polly when word starts pulsing
      setTimeout(() => {
        console.log('[wordPulsing → true]');
        wordPulsingRef.current = true;
        setWordPulsing(true);
        store.setPollyTrigger('perfect');
      }, 350);
    } else if (perfect) {
      // no hidden mask — pulse word gold, fire Polly, then auto-complete
      wordPulsingRef.current = true;
      setWordPulsing(true);
      store.setPollyTrigger('perfect');
      completedRef.current = true;
      setTimeout(() => store.completeWord(), 700);
    } else {
      completedRef.current = true;
      setTimeout(() => store.completeWord(), 700);
    }
  }, [tileStates]);

  // ── swipe handlers ────────────────────────────────────────────
  function handleSwipeUp(maskId: string) {
    const mask = step.masks.find(m => m.id === maskId)!;
    const correct = mask.isReal;

    if (!correct) wrongCountRef.current++;
    store.submitSwipeUp(maskId);
    if (correct) {
      spawnFloat(mask.isRare ? 300 : 100, maskId);
      triggerAbsorption(mask.phrase);
    }

    setTileStates(prev => new Map(prev).set(maskId, correct ? 'correct' : 'wrong'));
  }

  function handleSwipeDown(maskId: string) {
    const mask = step.masks.find(m => m.id === maskId)!;
    const correct = !mask.isReal;

    if (!correct) wrongCountRef.current++;
    store.submitSwipeDown(maskId);
    if (correct) spawnFloat(50, maskId);

    setTileStates(prev => new Map(prev).set(maskId, correct ? 'correct' : 'wrong'));
  }

  function handleTapReveal(maskId: string) {
    store.revealHidden(maskId);
    spawnFloat(300, maskId);
    setTileStates(prev => new Map(prev).set(maskId, 'revealed'));
  }

  function handleSwipeUpHidden(maskId: string) {
    // revealed hidden masks are always real — treat same as correct swipe up
    store.submitSwipeUp(maskId);
    spawnFloat(100, maskId);
    setTileStates(prev => new Map(prev).set(maskId, 'correct'));

    completedRef.current = true;
    wordPulsingRef.current = false;
    setWordPulsing(false);
    setTimeout(() => store.completeWord(), 700);
  }

  function handleSwipeDownHidden(maskId: string) {
    // swiping down a revealed hidden (which is always real) = wrong
    wrongCountRef.current++;
    store.submitSwipeDown(maskId);
    setTileStates(prev => new Map(prev).set(maskId, 'wrong'));

    completedRef.current = true;
    wordPulsingRef.current = false;
    setWordPulsing(false);
    setTimeout(() => store.completeWord(), 700);
  }

  function handleWordTap() {
    console.log('[word tapped fired]', { wordPulsing, wordPulsingRef: wordPulsingRef.current });
    const hiddenMask = step.masks.find(m => m.isHidden);
    if (!hiddenMask || !wordPulsingRef.current) return;
    wordPulseLoopRef.current?.stop();
    wordScale.setValue(1);
    wordPulsingRef.current = false;
    setWordPulsing(false);
    handleTapReveal(hiddenMask.id);
  }

  // ── layout ────────────────────────────────────────────────────
  const eyebrow = eventEyebrow(step);
  const isBoss = step.eventType === 'bossWord';
  const wordColor = isBoss ? '#FFD700' : '#FFFFFF';

  const useScroll = step.masks.length > 10;

  const GridContent = (
    <View style={styles.grid}>
      {step.masks.map(mask => (
        <View key={mask.id} style={styles.cell} ref={getTileRef(mask.id)}>
          <SwipeMask
            mask={mask}
            state={tileStates.get(mask.id) ?? 'idle'}
            onSwipeUp={mask.isHidden
              ? () => handleSwipeUpHidden(mask.id)
              : () => handleSwipeUp(mask.id)}
            onSwipeDown={mask.isHidden
              ? () => handleSwipeDownHidden(mask.id)
              : () => handleSwipeDown(mask.id)}
            onTapReveal={mask.isHidden
              ? () => handleTapReveal(mask.id)
              : () => {}}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container} ref={containerRef}>
      {/* word header */}
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

        {/* word + expanding ring container */}
        <View style={styles.wordContainer}>
          <Pressable
            onPress={handleWordTap}
            disabled={!wordPulsing}
            hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
          >
            <Animated.Text
              style={[
                styles.word,
                { color: wordColor, transform: [{ scale: wordScale }, { scale: absorptionScale }] },
              ]}
            >
              {step.word}
            </Animated.Text>
          </Pressable>

          {/* gold ring — expands outward on correct swipe up */}
          <Animated.View
            pointerEvents="none"
            style={[styles.goldRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
        </View>

        {/* absorbed phrase fades in then out */}
        {absorbedPhrase !== null && (
          <Animated.Text style={[styles.absorbedPhrase, { opacity: absorbedPhraseOpacity }]}>
            {absorbedPhrase}
          </Animated.Text>
        )}

        {wordPulsing && step.masks.some(m => m.isHidden) && (
          <Text style={styles.tapWordHint}>TAP THE WORD</Text>
        )}
      </View>

      {/* swipe hint */}
      <View style={styles.hintRow}>
        <Text style={styles.hint}>↑ real meaning</Text>
        <Text style={styles.hint}>↓ trap</Text>
      </View>

      {/* tile grid */}
      {useScroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {GridContent}
        </ScrollView>
      ) : (
        <View style={styles.gridWrap}>{GridContent}</View>
      )}

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
    paddingTop: 28,
    paddingBottom: 8,
  },
  eyebrow: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  word: {
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 3,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  hint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  gridWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47%',
  },
  tapWordHint: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
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
});
