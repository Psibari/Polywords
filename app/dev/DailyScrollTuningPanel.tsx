import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDailyScrollTuning } from './dailyScrollTuning';

// DEV-ONLY live tuning control for the Daily scroll — lets Pete dial in
// scroll height, the header block, card height, and a rod nudge directly
// on-device instead of a code-edit-reload cycle per nudge. Remove once
// values are locked in and baked back into the real constants (see the
// contract comment atop dailyScrollTuning.ts).
export default function DailyScrollTuningPanel() {
  const scrollHeight = useDailyScrollTuning((s) => s.scrollHeight);
  const headerVisible = useDailyScrollTuning((s) => s.headerVisible);
  const cardHeight = useDailyScrollTuning((s) => s.cardHeight);
  const rodOffsetY = useDailyScrollTuning((s) => s.rodOffsetY);
  const setScrollHeight = useDailyScrollTuning((s) => s.setScrollHeight);
  const setHeaderVisible = useDailyScrollTuning((s) => s.setHeaderVisible);
  const setCardHeight = useDailyScrollTuning((s) => s.setCardHeight);
  const setRodOffsetY = useDailyScrollTuning((s) => s.setRodOffsetY);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Text style={styles.section}>SCROLL</Text>
      <Row
        label="HEIGHT"
        value={`${Math.round(scrollHeight)}`}
        onDec={() => setScrollHeight(scrollHeight - 8)}
        onInc={() => setScrollHeight(scrollHeight + 8)}
      />

      <Text style={styles.section}>HEADER</Text>
      <View style={styles.row}>
        <Text style={styles.label}>SHOW</Text>
        <Pressable
          onPress={() => setHeaderVisible(!headerVisible)}
          style={styles.btn}
          hitSlop={8}
        >
          <Text style={styles.btnText}>{headerVisible ? 'ON' : 'OFF'}</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>CARD</Text>
      <Row
        label="HEIGHT"
        value={`${Math.round(cardHeight)}`}
        onDec={() => setCardHeight(cardHeight - 4)}
        onInc={() => setCardHeight(cardHeight + 4)}
      />

      <Text style={styles.section}>ROD</Text>
      <Row
        label="Y"
        value={`${Math.round(rodOffsetY)}`}
        onDec={() => setRodOffsetY(rodOffsetY - 2)}
        onInc={() => setRodOffsetY(rodOffsetY + 2)}
      />
    </View>
  );
}

function Row({
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
      <Pressable onPress={onDec} style={styles.btn} hitSlop={8}>
        <Text style={styles.btnText}>-</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable onPress={onInc} style={styles.btn} hitSlop={8}>
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 70,
    right: 14,
    zIndex: 99,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 6,
    padding: 6,
    gap: 2,
  },
  section: {
    color: '#FFC800',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: '#00FF88',
    fontSize: 10,
    width: 44,
  },
  btn: {
    backgroundColor: '#333',
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
  },
  value: {
    color: '#00FF88',
    fontSize: 11,
    width: 34,
    textAlign: 'center',
  },
});
