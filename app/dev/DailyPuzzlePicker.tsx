import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APPROVED_DAILY_POOL } from '../game/dailyChallengeEngine';
import { dailyClueFitReport } from '../ui/dailyCastleScene';

/**
 * DEV only (Pete, 2026-11-12): pick any approved Daily puzzle to play as
 * round 1 today, so a clue can be checked on the phone (e.g. with Bold Text
 * and max Text Size) without waiting for its date. Puzzles with a clue that
 * does not fit the plank are listed first and marked LONG. Playing one still
 * records today's Daily like DEV - RESET DAILY does.
 */
export default function DailyPuzzlePicker({
  visible,
  onPick,
  onClose,
}: {
  visible: boolean;
  onPick: (answer: string) => void;
  onClose: () => void;
}) {
  const rows = useMemo(
    () =>
      APPROVED_DAILY_POOL.map((word) => ({
        answer: word.word,
        long: word.meanings.some((clue) => !dailyClueFitReport(clue).fits),
      })).sort((a, b) => Number(b.long) - Number(a.long) || (a.answer < b.answer ? -1 : 1)),
    [],
  );
  if (!visible) return null;
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>PICK A DAILY PUZZLE (ROUND 1)</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Text allowFontScaling={false} style={styles.close}>CLOSE</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {rows.map(({ answer, long }) => (
          <Pressable key={answer} onPress={() => onPick(answer)} style={styles.row}>
            <Text allowFontScaling={false} style={styles.word}>{answer}</Text>
            {long && <Text allowFontScaling={false} style={styles.long}>LONG</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 90,
    bottom: 140,
    backgroundColor: 'rgba(12,8,28,0.96)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 120,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { color: '#F5C842', fontSize: 15, fontWeight: '700' },
  close: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  list: { paddingBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  word: { color: '#FFFFFF', fontSize: 16 },
  long: { color: '#FF8A8A', fontSize: 14, fontWeight: '700' },
});
