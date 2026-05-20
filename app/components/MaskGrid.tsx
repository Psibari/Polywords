import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MASK_STAGGER, REVEAL_PAUSE } from '../constants/animations';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { MaskData, MaskTile, MaskTileState } from './MaskTile';

type Props = {
  masks: MaskData[];
  onLock: (selectedIds: string[]) => void;
};

export function MaskGrid({ masks, onLock }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const { pulseAnim } = useHeartbeat();

  // LOCK IT IN button breathes with heartbeat
  const btnScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.025],
  });

  function handleTilePress(id: string) {
    if (locked) return;
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function handleLock() {
    if (locked || selectedIds.length === 0) return;
    setLocked(true);
    setTimeout(() => onLock(selectedIds), REVEAL_PAUSE);
  }

  function tileState(mask: MaskData): MaskTileState {
    if (selectedIds.includes(mask.id)) return 'selected';
    return 'idle';
  }

  // grid: always 2 columns, variable rows
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {masks.map((mask, i) => (
          <View key={mask.id} style={styles.cell}>
            <MaskTile
              mask={mask}
              state={tileState(mask)}
              onPress={() => handleTilePress(mask.id)}
              entranceDelay={i * MASK_STAGGER}
            />
          </View>
        ))}
      </View>

      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <Pressable
          onPress={handleLock}
          style={[
            styles.lockBtn,
            (selectedIds.length === 0 || locked) && styles.lockBtnDimmed,
          ]}
          disabled={locked}
        >
          <Text style={styles.lockBtnText}>LOCK IT IN</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 28,
  },
  cell: {
    width: '46%',
  },
  lockBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 32,
    paddingVertical: 18,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  lockBtnDimmed: {
    opacity: 0.35,
  },
  lockBtnText: {
    color: '#1A1040',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
  },
});
