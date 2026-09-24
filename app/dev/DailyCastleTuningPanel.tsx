import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  DAILY_CASTLE_TUNING_STEPS,
  useDailyCastleTuning,
} from './dailyCastleTuning';

type Props = {
  visible: boolean;
};

// DEV-ONLY live controls. The compact panel sits in the castle's empty arch
// opening so Pete can still judge the silhouette, sides, recesses, and bottom
// edge while nudging the complete registered assembly.
export default function DailyCastleTuningPanel({ visible }: Props) {
  const scale = useDailyCastleTuning((state) => state.scale);
  const x = useDailyCastleTuning((state) => state.x);
  const y = useDailyCastleTuning((state) => state.y);
  const setScale = useDailyCastleTuning((state) => state.setScale);
  const setX = useDailyCastleTuning((state) => state.setX);
  const setY = useDailyCastleTuning((state) => state.setY);
  const reset = useDailyCastleTuning((state) => state.reset);

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.section}>CASTLE</Text>
          <Pressable
            accessibilityLabel="Reset castle tuning"
            accessibilityRole="button"
            hitSlop={8}
            onPress={reset}
            style={styles.resetButton}
          >
            <Text style={styles.resetText}>RESET</Text>
          </Pressable>
        </View>
        <TuningRow
          label="SCALE"
          value={scale.toFixed(2)}
          onDec={() => setScale(scale - DAILY_CASTLE_TUNING_STEPS.scale)}
          onInc={() => setScale(scale + DAILY_CASTLE_TUNING_STEPS.scale)}
        />
        <TuningRow
          label="X"
          value={`${Math.round(x)}`}
          onDec={() => setX(x - DAILY_CASTLE_TUNING_STEPS.x)}
          onInc={() => setX(x + DAILY_CASTLE_TUNING_STEPS.x)}
        />
        <TuningRow
          label="Y"
          value={`${Math.round(y)}`}
          onDec={() => setY(y - DAILY_CASTLE_TUNING_STEPS.y)}
          onInc={() => setY(y + DAILY_CASTLE_TUNING_STEPS.y)}
        />
      </View>
    </View>
  );
}

function TuningRow({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityLabel={`Decrease castle ${label.toLowerCase()}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDec}
        style={styles.stepButton}
      >
        <Text style={styles.stepText}>-</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityLabel={`Increase castle ${label.toLowerCase()}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onInc}
        style={styles.stepButton}
      >
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 210,
    right: 0,
    left: 0,
    zIndex: 110,
    elevation: 110,
    alignItems: 'center',
  },
  panel: {
    width: 158,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245,200,66,0.55)',
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.86)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  section: {
    color: '#F5C842',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  resetButton: {
    minHeight: 22,
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  row: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    width: 42,
    color: '#00FF88',
    fontSize: 10,
    fontWeight: '700',
  },
  stepButton: {
    width: 24,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  },
  value: {
    width: 38,
    color: '#00FF88',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
