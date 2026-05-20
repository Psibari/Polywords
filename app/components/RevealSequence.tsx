import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { REVEAL_FLIP, REVEAL_PAUSE } from '../constants/animations';
import { MaskData, MaskTile, MaskTileState } from './MaskTile';
import { ScoreFloat } from './ScoreFloat';

export type RevealTileData = {
  mask: MaskData;
  result: 'correct' | 'wrong' | 'missed';
  scoreValue?: number;
  /** screen-space position of the tile, used to launch ScoreFloat */
  position: { x: number; y: number };
};

type FloatEntry = { id: number; value: number; x: number; y: number };

type Props = {
  tiles: RevealTileData[];
  onComplete: () => void;
};

export function RevealSequence({ tiles, onComplete }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [floats, setFloats] = useState<FloatEntry[]>([]);
  const floatIdRef = useRef(0);

  useEffect(() => {
    // 150ms pause, then reveal all simultaneously
    const t1 = setTimeout(() => {
      setRevealed(true);

      // launch score floats for correct tiles
      tiles.forEach(t => {
        if (t.result === 'correct' && t.scoreValue) {
          const id = ++floatIdRef.current;
          setFloats(prev => [
            ...prev,
            { id, value: t.scoreValue!, x: t.position.x, y: t.position.y },
          ]);
        }
      });

      // signal completion after flip animation finishes
      const t2 = setTimeout(onComplete, REVEAL_FLIP + 150);
      return () => clearTimeout(t2);
    }, REVEAL_PAUSE);

    return () => clearTimeout(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {tiles.map((t, i) => (
          <View key={t.mask.id} style={styles.cell}>
            <MaskTile
              mask={t.mask}
              state={revealed ? (t.result as MaskTileState) : 'idle'}
              onPress={() => {}}
              entranceDelay={0}
            />
          </View>
        ))}
      </View>

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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cell: {
    width: '46%',
  },
});
