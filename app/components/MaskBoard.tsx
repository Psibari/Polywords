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
  const game  = store.game;

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
    const view = tileRefs.current.get(maskId)?.current;
    if (view) {
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

    if (perfect) store.setPollyTrigger('perfect');

    if (perfect && hiddenMask) {
      // pulse word — player taps it to reveal hidden mask
      setTimeout(() => setWordPulsing(true), 350);
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
    if (correct) spawnFloat(mask.isRare ? 300 : 100, maskId);

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
    setWordPulsing(false);
    setTimeout(() => store.completeWord(), 700);
  }

  function handleSwipeDownHidden(maskId: string) {
    // swiping down a revealed hidden (which is always real) = wrong
    wrongCountRef.current++;
    store.submitSwipeDown(maskId);
    setTileStates(prev => new Map(prev).set(maskId, 'wrong'));

    completedRef.current = true;
    setWordPulsing(false);
    setTimeout(() => store.completeWord(), 700);
  }

  function handleWordTap() {
    const hiddenMask = step.masks.find(m => m.isHidden);
    if (!hiddenMask || !wordPulsing) return;
    wordPulseLoopRef.current?.stop();
    wordScale.setValue(1);
    setWordPulsing(false);
    handleTapReveal(hiddenMask.id);
  }

  // ── layout ────────────────────────────────────────────────────
  const eyebrow = eventEyebrow(step);
  const isBoss = step.eventType === 'bossWord';
  const wordColor = isBoss ? '#FFD700' : '#FFFFFF';

  const visibleMasks = step.masks.filter(m => !m.isHidden);
  const hiddenMasks  = step.masks.filter(m => m.isHidden);
  const useScroll    = visibleMasks.length > 6;

  const GridContent = (
    <View style={styles.grid}>
      {visibleMasks.map(mask => (
        <View key={mask.id} style={styles.cell} ref={getTileRef(mask.id)}>
          <SwipeMask
            mask={mask}
            state={tileStates.get(mask.id) ?? 'idle'}
            onSwipeUp={() => handleSwipeUp(mask.id)}
            onSwipeDown={() => handleSwipeDown(mask.id)}
            onTapReveal={() => {}} // visible masks don't use this
          />
        </View>
      ))}
      {hiddenMasks.map(mask => {
        const ts = tileStates.get(mask.id)!;
        return (
          <View key={mask.id} style={styles.cell} ref={getTileRef(mask.id)}>
            <SwipeMask
              mask={mask}
              state={ts}
              onSwipeUp={() => handleSwipeUpHidden(mask.id)}
              onSwipeDown={() => handleSwipeDownHidden(mask.id)}
              onTapReveal={() => handleTapReveal(mask.id)}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* word header */}
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Pressable onPress={handleWordTap} disabled={!wordPulsing}>
          <Animated.Text
            style={[
              styles.word,
              { color: wordColor, transform: [{ scale: wordScale }] },
            ]}
          >
            {step.word}
          </Animated.Text>
        </Pressable>
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
});
