import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDailyScrollTuning } from './dailyScrollTuning';

// DEV-ONLY live tuning control for the Daily scroll art — lets Pete dial in
// position (X/Y) and size for both the rod and the paper background,
// directly on-device, instead of a code-edit-reload cycle per nudge. One
// knob set for each art piece, shared across both places it renders (the
// idle DailyPanelFrame mount and the DailyRevealCurtain reveal). Remove once
// values are locked in and baked back into the real constants.
export default function DailyScrollTuningPanel() {
  const rod = useDailyScrollTuning((s) => s.rod);
  const paper = useDailyScrollTuning((s) => s.paper);
  const contentTopPad = useDailyScrollTuning((s) => s.contentTopPad);
  const setRod = useDailyScrollTuning((s) => s.setRod);
  const setPaper = useDailyScrollTuning((s) => s.setPaper);
  const setContentTopPad = useDailyScrollTuning((s) => s.setContentTopPad);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Text style={styles.section}>ROD</Text>
      <Row label="X" value={`${Math.round(rod.offsetX)}`} onDec={() => setRod({ offsetX: rod.offsetX - 15 })} onInc={() => setRod({ offsetX: rod.offsetX + 15 })} />
      <Row label="Y" value={`${Math.round(rod.offsetY)}`} onDec={() => setRod({ offsetY: rod.offsetY - 15 })} onInc={() => setRod({ offsetY: rod.offsetY + 15 })} />
      <Row label="LEN" value={`${rod.scaleX.toFixed(2)}x`} onDec={() => setRod({ scaleX: rod.scaleX - 0.1 })} onInc={() => setRod({ scaleX: rod.scaleX + 0.1 })} />
      <Row label="THICK" value={`${rod.scaleY.toFixed(2)}x`} onDec={() => setRod({ scaleY: rod.scaleY - 0.1 })} onInc={() => setRod({ scaleY: rod.scaleY + 0.1 })} />

      <Text style={styles.section}>PAPER</Text>
      <Row label="X" value={`${Math.round(paper.offsetX)}`} onDec={() => setPaper({ offsetX: paper.offsetX - 15 })} onInc={() => setPaper({ offsetX: paper.offsetX + 15 })} />
      <Row label="Y" value={`${Math.round(paper.offsetY)}`} onDec={() => setPaper({ offsetY: paper.offsetY - 15 })} onInc={() => setPaper({ offsetY: paper.offsetY + 15 })} />
      <Row label="LEN" value={`${paper.scaleX.toFixed(2)}x`} onDec={() => setPaper({ scaleX: paper.scaleX - 0.1 })} onInc={() => setPaper({ scaleX: paper.scaleX + 0.1 })} />
      <Row label="THICK" value={`${paper.scaleY.toFixed(2)}x`} onDec={() => setPaper({ scaleY: paper.scaleY - 0.1 })} onInc={() => setPaper({ scaleY: paper.scaleY + 0.1 })} />

      <Text style={styles.section}>TEXT</Text>
      <Row label="GAP" value={`${Math.round(contentTopPad)}`} onDec={() => setContentTopPad(contentTopPad - 2)} onInc={() => setContentTopPad(contentTopPad + 2)} />
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
    width: 34,
  },
  btn: {
    backgroundColor: '#333',
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 14,
  },
  value: {
    color: '#00FF88',
    fontSize: 11,
    width: 34,
    textAlign: 'center',
  },
});
