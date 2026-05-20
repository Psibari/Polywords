import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MASK_DRIFT_NORMAL, MASK_DRIFT_SPEED } from '../constants/animations';
import { Clue, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { ScoreFloat } from './ScoreFloat';

const TILE_W = 180;
const TILE_H = 64;
const TRACK_H = 96;

type ActiveTile = {
  clue: Clue;
  clueIndex: number;
  xAnim: Animated.Value;
  resolved: boolean;
  tapped: boolean;
};

type FloatEntry = { id: number; value: number; x: number; y: number };

type Props = {
  step: WordStep;
  /** called when a non-decoy clue drifts off untouched */
  onMiss?: () => void;
};

export function TruthStream({ step, onMiss }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const { game, submitAnswer, skipClue } = useGameStore();

  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const [tile, setTile] = useState<ActiveTile | null>(null);
  const tileRef = useRef<ActiveTile | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const activeRef = useRef(true);
  const [floats, setFloats] = useState<FloatEntry[]>([]);
  const floatIdRef = useRef(0);

  const driftMs = step.eventType === 'speedRound' ? MASK_DRIFT_SPEED : MASK_DRIFT_NORMAL;
  const trackY = H * 0.44; // vertical centre of the track

  const spawnClue = useCallback(
    (clueIndex: number) => {
      if (!activeRef.current) return;
      const clues = gameRef.current.selectedClues[gameRef.current.stepIndex];
      if (!clues || clueIndex >= clues.length) return;

      const clue = clues[clueIndex];
      const xAnim = new Animated.Value(W + TILE_W);
      const next: ActiveTile = { clue, clueIndex, xAnim, resolved: false, tapped: false };
      tileRef.current = next;
      setTile({ ...next });

      const drift = Animated.timing(xAnim, {
        toValue: -(TILE_W + 80),
        duration: driftMs,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      animRef.current = drift;

      drift.start(({ finished }) => {
        if (!finished || !activeRef.current) return;
        const t = tileRef.current;
        if (t && !t.resolved) {
          if (t.clue.isDecoy) {
            // pass silently
            submitAnswer('');
          } else {
            skipClue();
            onMiss?.();
          }
        }
        tileRef.current = null;
        setTile(null);
        setTimeout(() => {
          if (activeRef.current) spawnClue(gameRef.current.clueIndex);
        }, 350);
      });
    },
    // spawnClue is stable — deps in refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [W, driftMs],
  );

  useEffect(() => {
    spawnClue(gameRef.current.clueIndex);
    return () => {
      activeRef.current = false;
      animRef.current?.stop();
    };
    // run once per step mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTap() {
    const t = tileRef.current;
    if (!t || t.resolved) return;

    const updated: ActiveTile = { ...t, resolved: true, tapped: true };
    tileRef.current = updated;
    setTile({ ...updated });

    submitAnswer(t.clue.correctMeaningId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!t.clue.isDecoy) {
      const id = ++floatIdRef.current;
      setFloats(prev => [...prev, { id, value: 100, x: W / 2, y: trackY }]);
    }

    animRef.current?.stop();
    setTimeout(() => {
      if (!activeRef.current) return;
      tileRef.current = null;
      setTile(null);
      setTimeout(() => {
        if (activeRef.current) spawnClue(gameRef.current.clueIndex);
      }, 180);
    }, 320);
  }

  // fade opacity near the left edge
  const tileOpacity = tile
    ? tile.xAnim.interpolate({
        inputRange: [-(TILE_W), 0, 60, W],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      })
    : 1;

  const tileBgColor = tile?.tapped
    ? '#22C55E'
    : tile?.clue && !tile.tapped && tile.resolved
    ? '#374151' // missed grey ghost
    : '#311F78';

  const tileBorderColor = tile?.tapped
    ? '#22C55E'
    : tile?.clue.isDecoy
    ? 'rgba(255,255,255,0.08)'
    : '#8B5CF6';

  return (
    <View style={styles.container}>
      {/* word label */}
      <View style={styles.wordArea}>
        <Text style={styles.wordSub}>WHAT DOES</Text>
        <Text style={styles.wordMain}>{step.word}</Text>
        <Text style={styles.wordSub}>MEAN?</Text>
      </View>

      {/* horizontal track */}
      <View style={[styles.track, { marginTop: trackY - TRACK_H / 2 - 120 }]}>
        {/* left fade veil */}
        <View style={styles.fadeLeft} pointerEvents="none" />

        {tile && (
          <Animated.View
            style={[
              styles.tileWrap,
              {
                transform: [{ translateX: tile.xAnim }],
                opacity: tileOpacity,
              },
            ]}
          >
            <Pressable
              onPress={handleTap}
              style={[
                styles.tileInner,
                {
                  backgroundColor: tileBgColor,
                  borderColor: tileBorderColor,
                },
              ]}
            >
              <Text style={styles.clueText}>{tile.clue.text}</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* meanings guide */}
      <View style={styles.meaningsArea}>
        <Text style={styles.meaningsLabel}>MEANINGS</Text>
        <View style={styles.meaningsList}>
          {step.meanings.map(m => (
            <View key={m.id} style={styles.meaningChip}>
              {m.emoji ? <Text style={styles.meaningEmoji}>{m.emoji}</Text> : null}
              <Text style={styles.meaningText}>{m.text}</Text>
            </View>
          ))}
        </View>
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
  },
  wordArea: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  wordSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  wordMain: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 3,
    marginVertical: 4,
  },
  track: {
    height: TRACK_H,
    backgroundColor: '#120A30',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 2,
    // gradient-like fade handled by opacity on the tile itself
    backgroundColor: 'transparent',
  },
  tileWrap: {
    position: 'absolute',
    width: TILE_W,
    height: TILE_H,
    top: (TRACK_H - TILE_H) / 2,
  },
  tileInner: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  clueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  meaningsArea: {
    marginTop: 36,
    paddingHorizontal: 24,
  },
  meaningsLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 10,
    textAlign: 'center',
  },
  meaningsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  meaningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  meaningEmoji: {
    fontSize: 16,
  },
  meaningText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
});
