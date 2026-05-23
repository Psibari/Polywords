import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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

  // ── hidden mask activation state ───────────────────────────
  const [hiddenActive, setHiddenActive] = useState(false);
  const hiddenMask = step.masks.find(m => m.isHidden) ?? null;

  // ── hidden tile entrance animation ──────────────────────────
  const hiddenDropY       = useRef(new Animated.Value(80)).current;
  const hiddenDropOpacity = useRef(new Animated.Value(0)).current;
  const hiddenDropScale   = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!hiddenActive) return;
    hiddenDropY.setValue(80);
    hiddenDropOpacity.setValue(0);
    hiddenDropScale.setValue(0.7);
    Animated.parallel([
      Animated.timing(hiddenDropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(hiddenDropScale,   { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hiddenDropY, {
        toValue: 240,
        useNativeDriver: true,
        damping: 14,
        stiffness: 120,
      }),
    ]).start();
  }, [hiddenActive]);

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
      return ts === 'correct' || ts === 'trap-caught' || ts === 'wrong';
    });
    if (!allVisibleJudged) return;

    const perfect = visibleMasks.every(m => {
      const ts = tileStates.get(m.id);
      return ts === 'correct' || ts === 'trap-caught';
    });

    // if the hidden mask was already revealed, wait for the player to swipe it
    if (hiddenMask && tileStates.get(hiddenMask.id) === 'revealed') return;

    if (perfect && hiddenMask) {
      setTimeout(() => {
        setHiddenActive(true);
        store.setPollyTrigger('perfect');
      }, 350);
    } else if (perfect) {
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

    if (mask.isReal) {
      store.submitSwipeUp(maskId);
      spawnFloat(mask.isRare ? 300 : 100, maskId);
      triggerAbsorption(mask.phrase);
      setTileStates(prev => new Map(prev).set(maskId, 'correct'));
    } else {
      store.submitWrongSwipe();
      wrongCountRef.current++;
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    }
  }

  function handleSwipeLeft(maskId: string) {
    const mask = step.masks.find(m => m.id === maskId)!;

    if (!mask.isReal) {
      store.submitSwipeDown(maskId);
      spawnFloat(50, maskId);
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
    } else {
      store.submitWrongSwipe();
      wrongCountRef.current++;
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    }
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
    setTimeout(() => store.completeWord(), 700);
  }

  function handleSwipeDownHidden(maskId: string) {
    // swiping down a revealed hidden (which is always real) = wrong
    wrongCountRef.current++;
    store.submitSwipeDown(maskId);
    setTileStates(prev => new Map(prev).set(maskId, 'wrong'));

    completedRef.current = true;
    setTimeout(() => store.completeWord(), 700);
  }

  // ── layout ────────────────────────────────────────────────────
  const eyebrow = eventEyebrow(step);
  const isBoss = step.eventType === 'bossWord';
  const wordColor = isBoss ? '#FFD700' : '#FFFFFF';

  const visibleGridMasks = store.game.shuffledMasks[store.game.stepIndex] ?? step.masks.filter(m => !m.isHidden);
  const useScroll = visibleGridMasks.length > 10;

  const GridContent = (
    <View style={styles.grid}>
      {visibleGridMasks.map(mask => (
        <View key={mask.id} style={styles.cell} ref={getTileRef(mask.id)}>
          <SwipeMask
            mask={mask}
            state={tileStates.get(mask.id) ?? 'idle'}
            onSwipeUp={() => handleSwipeUp(mask.id)}
            onSwipeDown={() => handleSwipeLeft(mask.id)}
            onTapReveal={() => {}}
            revealable={false}
            wrongReason={
              tileStates.get(mask.id) === 'wrong'
                ? mask.isReal ? 'rejected-real' : 'claimed-trap'
                : undefined
            }
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container} ref={containerRef} onStartShouldSetResponder={() => true}>
      {/* word header */}
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

        {/* word + expanding ring container */}
        <View style={styles.wordContainer}>
          <Animated.Text
            style={[
              styles.word,
              { color: wordColor, transform: [{ scale: absorptionScale }] },
            ]}
          >
            {step.word}
          </Animated.Text>

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
      </View>

      {/* swipe hint */}
      <View style={styles.hintRow}>
        <Text style={styles.hint}>↑ real meaning</Text>
        <Text style={styles.hint}>→ trap</Text>
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

      {/* hidden tile — drops in from word area after perfect clear */}
      {hiddenMask && hiddenActive && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.hiddenOverlay,
            { opacity: hiddenDropOpacity, transform: [{ translateY: hiddenDropY }, { scale: hiddenDropScale }] },
          ]}
        >
          <View style={styles.hiddenOverlayInner}>
            <SwipeMask
              mask={hiddenMask}
              state={tileStates.get(hiddenMask.id) ?? 'hidden'}
              onSwipeUp={() => handleSwipeUpHidden(hiddenMask.id)}
              onSwipeDown={() => handleSwipeDownHidden(hiddenMask.id)}
              onTapReveal={() => handleTapReveal(hiddenMask.id)}
              revealable={hiddenActive}
            />
          </View>
        </Animated.View>
      )}
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
    gap: 8,
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
  hiddenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  hiddenOverlayInner: {
    width: 200,
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
