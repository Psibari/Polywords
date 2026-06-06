import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { playScratch, playCorrectSwipe } from '../utils/SoundEngine';
import { FONTS, FONT_SIZES } from '../constants/fonts';

// ── Layout constants ──────────────────────────────────────────
const TILE_HEIGHT = 56;
const TILE_GAP    = 10;

type Props = {
  step: WordStep;
  spawnEffect?: (type: 'shard' | 'trail', x: number, y: number) => void;
};

export function SlangDropScreen({ step, spawnEffect }: Props) {
  const store = useGameStore();

  const slangEra    = step.slangEra;
  const slangMaskId = step.slangMaskId;

  // Use shuffled masks from the store (same path as MaskBoard)
  const masks = store.game.shuffledMasks[store.game.stepIndex] ?? step.masks;

  // ── tile state map ────────────────────────────────────────────
  const [tileStates, setTileStates] = useState<Map<string, SwipeMaskState>>(() => {
    const m = new Map<string, SwipeMaskState>();
    masks.forEach(mask => m.set(mask.id, 'idle'));
    return m;
  });

  const completedRef = useRef(false);

  // ── animated values ───────────────────────────────────────────
  const wordTransX   = useRef(new Animated.Value(-500)).current;
  const wordOpacity  = useRef(new Animated.Value(0)).current;
  const tagTransX    = useRef(new Animated.Value(400)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const [boardReady, setBoardReady] = useState(false);

  // ── entrance sequence ─────────────────────────────────────────
  useEffect(() => {
    // Step 1: scratch sound
    playScratch();

    // Step 2: word slides in from left (100ms after scratch starts)
    const t1 = setTimeout(() => {
      wordOpacity.setValue(1);
      Animated.spring(wordTransX, {
        toValue: 0,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 100);

    // Step 3+4: pause 400ms then tag slides in from right
    // Spring at tension=300,friction=8 settles in ~500ms from start
    const t2 = setTimeout(() => {
      tagOpacity.setValue(1);
      Animated.spring(tagTransX, {
        toValue: 0,
        tension: 260,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, 100 + 500 + 400);

    // Step 5: tiles appear after tag starts mounting
    const t3 = setTimeout(() => {
      store.setPollyTrigger('slangDrop');
      setBoardReady(true);
    }, 100 + 500 + 400 + 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── completion check ──────────────────────────────────────────
  useEffect(() => {
    if (completedRef.current) return;
    setTimeout(() => {
      if (completedRef.current) return;
      const allJudged = masks.every(m => {
        const ts = tileStates.get(m.id);
        return ts === 'correct' || ts === 'trap-caught' || ts === 'wrong';
      });
      if (!allJudged) return;

      completedRef.current = true;

      const slangCorrect = slangMaskId
        ? tileStates.get(slangMaskId) === 'correct'
        : false;

      store.setPollyTrigger(slangCorrect ? 'slangCorrect' : 'slangMiss');
      setTimeout(() => store.completeWord(), 1400);
    }, 200);
  }, [tileStates]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── swipe handlers ────────────────────────────────────────────
  function handleSwipeUp(maskId: string) {
    const mask = masks.find(m => m.id === maskId)!;
    if (mask.isReal) {
      store.submitSwipeUp(maskId);
      setTileStates(prev => new Map(prev).set(maskId, 'correct'));
    } else {
      store.submitWrongSwipe();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    }
  }

  function handleSwipeRight(maskId: string) {
    const mask = masks.find(m => m.id === maskId)!;
    if (!mask.isReal) {
      store.submitSwipeDown(maskId);
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
    } else {
      store.submitWrongSwipe();
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
    }
  }

  // ── render ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* SLANG DROP kicker */}
      <Text style={styles.kicker}>SLANG DROP</Text>

      {/* Hero word — scratches in from left */}
      <Animated.Text
        style={[
          styles.word,
          { opacity: wordOpacity, transform: [{ translateX: wordTransX }] },
        ]}
      >
        {step.word}
      </Animated.Text>

      {/* "Slang check." tag — slides in from right */}
      <Animated.Text
        style={[
          styles.slangTag,
          { opacity: tagOpacity, transform: [{ translateX: tagTransX }] },
        ]}
      >
        Slang check.
      </Animated.Text>

      {/* Tile stack — staggered mount */}
      {boardReady && (
        <View style={styles.tileStack}>
          {masks.map((mask, index) => (
            <SwipeMask
              key={mask.id}
              mask={mask}
              state={tileStates.get(mask.id) ?? 'idle'}
              onSwipeUp={() => handleSwipeUp(mask.id)}
              onSwipeDown={() => handleSwipeRight(mask.id)}
              onSwipeReveal={() => {}}
              tileHeight={TILE_HEIGHT}
              entryDelay={index * 80}
              eraBadge={mask.id === slangMaskId && slangEra ? slangEra : undefined}
              onEffect={spawnEffect}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  kicker: {
    color: '#FFD700',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  word: {
    fontSize: FONT_SIZES.wordDisplay,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 3,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  slangTag: {
    fontSize: 24,
    fontFamily: FONTS.brand,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  tileStack: {
    flex: 1,
  },
});
