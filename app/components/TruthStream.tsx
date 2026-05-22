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
import { Mask, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { RevealSequence, RevealTileData } from './RevealSequence';

const TILE_W = 180;
const TILE_H = 86;
const LANE_H = 106;
const LANE_COUNT = 2;

type DriftTile = {
  mask: Mask;
  xAnim: Animated.Value;
  lane: number;
  speedMs: number;
  animRef: { current: Animated.CompositeAnimation | null };
};

type Props = {
  step: WordStep;
};

export function TruthStream({ step }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const { game, submitAnswer, lockRound } = useGameStore();

  const driftMs = step.eventType === 'speedRound' ? MASK_DRIFT_SPEED : MASK_DRIFT_NORMAL;

  const [locked, setLocked] = useState(false);
  const [revealData, setRevealData] = useState<RevealTileData[] | null>(null);

  // Keep selectedMaskIds readable in callbacks without stale closure issues
  const selectedIdsRef = useRef(game.selectedMaskIds);
  useEffect(() => { selectedIdsRef.current = game.selectedMaskIds; }, [game.selectedMaskIds]);

  const revealTimeoutRef = useRef<number | null>(null);
  const lockedRef = useRef(false);

  // ─── Build drift tiles once ─────────────────────────────────
  const tilesRef = useRef<DriftTile[] | null>(null);
  if (tilesRef.current === null) {
    tilesRef.current = step.masks.map((mask, i) => {
      const lane = i % LANE_COUNT;
      // stagger initial X so tiles spread across lanes from the start
      const laneIndex = Math.floor(i / LANE_COUNT);
      const startX = W + TILE_W + laneIndex * (TILE_W + 50);
      return {
        mask,
        xAnim: new Animated.Value(startX),
        lane,
        // vary speed per tile so they spread naturally after the first pass
        speedMs: driftMs + i * 400,
        animRef: { current: null },
      };
    });
  }
  const tiles = tilesRef.current;

  // ─── Start/stop drift ──────────────────────────────────────
  const startDrift = useCallback(
    (tile: DriftTile) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(tile.xAnim, {
            toValue: -(TILE_W + 80),
            duration: tile.speedMs,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(tile.xAnim, {
            toValue: W + TILE_W,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      tile.animRef.current = loop;
      loop.start();
    },
    [W],
  );

  useEffect(() => {
    tiles.forEach(t => startDrift(t));
    return () => {
      tiles.forEach(t => t.animRef.current?.stop());
      if (revealTimeoutRef.current !== null) clearTimeout(revealTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Tap a tile — toggle selection ─────────────────────────
  function handleTap(maskId: string) {
    if (lockedRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    submitAnswer(maskId);
  }

  // ─── Lock It In ────────────────────────────────────────────
  function handleLock() {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // stop all animations
    tiles.forEach(t => t.animRef.current?.stop());

    // snapshot selected IDs at lock time
    const selected = selectedIdsRef.current;
    const maskMap = new Map(step.masks.map(m => [m.id, m]));

    // build reveal data — show correct/wrong/missed; skip unselected traps
    const revealTiles: RevealTileData[] = step.masks.flatMap((mask) => {
      const isSelected = selected.includes(mask.id);
      if (!isSelected && !mask.isReal) return []; // silent unselected trap

      let result: 'correct' | 'wrong' | 'missed';
      if (isSelected && mask.isReal)   result = 'correct';
      else if (isSelected && !mask.isReal) result = 'wrong';
      else                              result = 'missed'; // isReal && !isSelected

      const scoreValue =
        result === 'correct'
          ? mask.isRare || mask.isHidden ? 300 : 100
          : 0;

      return [{
        mask: {
          id: mask.id,
          icon: mask.emoji,
          phrase: mask.phrase,
          isReal: mask.isReal,
          isHidden: mask.isHidden,
        },
        result,
        scoreValue,
        position: { x: W / 2, y: H * 0.5 },
      }];
    });

    setRevealData(revealTiles);
  }

  // ─── After reveal animation completes ──────────────────────
  function handleRevealComplete() {
    revealTimeoutRef.current = setTimeout(() => {
      lockRound();
    }, 1200);
  }

  // ─── Group tiles by lane ────────────────────────────────────
  const lanes: DriftTile[][] = Array.from({ length: LANE_COUNT }, () => []);
  tiles.forEach(t => lanes[t.lane].push(t));

  const selectedIds = game.selectedMaskIds;
  const lanesTop = H * 0.28;

  // ─── Reveal mode ───────────────────────────────────────────
  if (revealData) {
    return (
      <View style={styles.container}>
        <View style={styles.wordArea}>
          <Text style={styles.wordSub}>WHAT DOES</Text>
          <Text style={styles.wordMain}>{step.word}</Text>
          <Text style={styles.wordSub}>MEAN?</Text>
        </View>
        <RevealSequence tiles={revealData} onComplete={handleRevealComplete} />
      </View>
    );
  }

  // ─── Drift mode ────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* word header */}
      <View style={styles.wordArea}>
        <Text style={styles.wordSub}>WHAT DOES</Text>
        <Text style={styles.wordMain}>{step.word}</Text>
        <Text style={styles.wordSub}>MEAN?</Text>
      </View>

      {/* instruction */}
      <Text style={styles.instruction}>TAP ALL REAL MEANINGS</Text>

      {/* drift lanes */}
      <View style={[styles.lanesArea, { top: lanesTop }]}>
        {lanes.map((laneTiles, laneIdx) => (
          <View key={laneIdx} style={styles.lane}>
            {laneTiles.map((tile) => {
              const isSelected = selectedIds.includes(tile.mask.id);
              return (
                <Animated.View
                  key={tile.mask.id}
                  style={[
                    styles.tileWrap,
                    { transform: [{ translateX: tile.xAnim }] },
                  ]}
                >
                  <Pressable
                    onPress={() => handleTap(tile.mask.id)}
                    style={[
                      styles.tileInner,
                      isSelected && styles.tileSelected,
                    ]}
                  >
                    <Text style={styles.tileEmoji}>{tile.mask.emoji}</Text>
                    <Text style={styles.tilePhrase} numberOfLines={2}>
                      {tile.mask.phrase}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>

      {/* lock button — fixed at bottom */}
      <View style={styles.lockArea}>
        <Pressable
          onPress={handleLock}
          style={[styles.lockButton, locked && styles.lockButtonDim]}
        >
          <Text style={styles.lockText}>LOCK IT IN</Text>
        </Pressable>
      </View>
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
    paddingBottom: 4,
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
  instruction: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 12,
  },
  lanesArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    gap: 10,
  },
  lane: {
    height: LANE_H,
    backgroundColor: '#120A30',
    overflow: 'hidden',
  },
  tileWrap: {
    position: 'absolute',
    width: TILE_W,
    height: TILE_H,
    top: (LANE_H - TILE_H) / 2,
  },
  tileInner: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.5)',
    backgroundColor: '#311F78',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tileSelected: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: '#3D2590',
  },
  tileEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  tilePhrase: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  lockArea: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lockButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 32,
    paddingHorizontal: 48,
    paddingVertical: 18,
  },
  lockButtonDim: {
    opacity: 0.4,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
