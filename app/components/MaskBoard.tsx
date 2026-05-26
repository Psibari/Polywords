import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP = 10;   // gap between tiles (each tile's marginTop)
const MIN_TILE_H = 68; // minimum tile height for readable text (FIX 1)
const MAX_TILE_H = 72; // cap so tiles don't grow huge on large screens

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

  // ── available height for tile stack ────────────────────────
  const [gridHeight, setGridHeight] = useState(0);

  const visibleGridMasks = store.game.shuffledMasks[store.game.stepIndex]
    ?? step.masks.filter(m => !m.isHidden);
  const tileCount = visibleGridMasks.length;

  // Each tile occupies (tileHeight + TILE_GAP) in the layout.
  // Solve: tileCount * (tileH + TILE_GAP) ≤ gridHeight
  // → tileH = floor(gridHeight / tileCount - TILE_GAP)
  // Clamped to [MIN_TILE_H, MAX_TILE_H].
  const tileHeight: number = gridHeight > 0
    ? Math.min(MAX_TILE_H, Math.max(MIN_TILE_H, Math.floor(gridHeight / tileCount - TILE_GAP)))
    : MAX_TILE_H;

  // ── hidden mask activation ──────────────────────────────────
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
        toValue: 200,
        useNativeDriver: true,
        damping: 14,
        stiffness: 120,
      }),
    ]).start();
  }, [hiddenActive]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── container ref (for coordinate conversion) ───────────────
  const containerRef = useRef<View>(null);

  // ── tile refs (for score float spawn position) ───────────────
  // createRef<T>() in @types/react 19 returns RefObject<T | null>; map type matches.
  const tileRefs = useRef(new Map<string, React.RefObject<View | null>>());

  function getTileRef(maskId: string): React.Ref<View> {
    if (!tileRefs.current.has(maskId)) {
      tileRefs.current.set(maskId, React.createRef<View | null>());
    }
    return tileRefs.current.get(maskId) as React.Ref<View>;
  }

  // ── score floats ─────────────────────────────────────────────
  const [floats, setFloats] = useState<FloatEntry[]>([]);
  const floatIdRef = useRef(0);

  function spawnFloat(value: number, maskId: string) {
    const refObj    = tileRefs.current.get(maskId);
    const view      = refObj ? refObj.current : null;
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

  // ── completion check ──────────────────────────────────────────
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

    if (hiddenMask && tileStates.get(hiddenMask.id) === 'revealed') return;

    if (perfect && hiddenMask) {
      setTimeout(() => {
        setHiddenActive(true);
        store.setPollyTrigger('perfect');
      }, 350);
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
    store.submitSwipeUp(maskId);
    spawnFloat(100, maskId);
    setTileStates(prev => new Map(prev).set(maskId, 'correct'));
    completedRef.current = true;
    setTimeout(() => store.completeWord(), 700);
  }

  function handleSwipeDownHidden(maskId: string) {
    wrongCountRef.current++;
    store.submitSwipeDown(maskId);
    setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    completedRef.current = true;
    setTimeout(() => store.completeWord(), 700);
  }

  // ── render ────────────────────────────────────────────────────
  const eyebrow  = eventEyebrow(step);
  const isBoss   = step.eventType === 'bossWord';
  const wordColor = isBoss ? '#FFD700' : '#FFFFFF';

  return (
    <View style={styles.container} ref={containerRef} onStartShouldSetResponder={() => true}>

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

      {/* tile stack — flex: 1, measured by onLayout */}
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
              onSwipeDown={() => handleSwipeLeft(mask.id)}
              onTapReveal={() => {}}
              revealable={false}
              tileHeight={tileHeight}
            />
          </View>
        ))}
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

      {/* hidden tile — drops in from word area after perfect clear */}
      {hiddenMask && hiddenActive && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.hiddenOverlay,
            {
              opacity: hiddenDropOpacity,
              transform: [{ translateY: hiddenDropY }, { scale: hiddenDropScale }],
            },
          ]}
        >
          <SwipeMask
            mask={hiddenMask}
            state={tileStates.get(hiddenMask.id) ?? 'hidden'}
            onSwipeUp={() => handleSwipeUpHidden(hiddenMask.id)}
            onSwipeDown={() => handleSwipeDownHidden(hiddenMask.id)}
            onTapReveal={() => handleTapReveal(hiddenMask.id)}
            revealable={hiddenActive}
            tileHeight={64}
          />
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
    paddingTop: 12,      // reduced from 28 — makes room for tiles on small screens
    paddingBottom: 8,
  },
  eyebrow: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 2,     // reduced from 4
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
    marginBottom: 8,     // reduced from 16
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
  // hidden tile drops in as a full-width overlay inside the container
  hiddenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
