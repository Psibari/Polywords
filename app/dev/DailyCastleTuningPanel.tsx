import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DailyCastleGroup, useDailyCastleTuning } from './dailyCastleTuning';

const groups: { group: DailyCastleGroup; title: string; fields: [string, string, number][] }[] = [
  { group: 'background', title: 'CASTLE BACKGROUND', fields: [['scale', 'SCALE', 0.01], ['x', 'X', 2], ['y', 'Y', 2]] },
  { group: 'gate', title: 'GATE', fields: [['scale', 'SCALE', 0.01], ['x', 'X', 2], ['closedY', 'CLOSED Y', 2], ['openTravel', 'OPEN TRAVEL', 4]] },
  { group: 'grid', title: 'ANSWER GRID', fields: [['x', 'X', 2], ['y', 'Y', 2], ['cardWidth', 'CARD WIDTH', 2], ['cardHeight', 'CARD HEIGHT', 2], ['columnGap', 'COLUMN GAP', 2], ['rowGap', 'ROW GAP', 2]] },
  { group: 'clues', title: 'CLUES', fields: [['x', 'X', 2], ['y', 'Y', 2], ['width', 'WIDTH', 2], ['verticalGap', 'VERTICAL GAP', 2]] },
];

export default function DailyCastleTuningPanel({ visible }: { visible: boolean }) {
  const tuning = useDailyCastleTuning();
  if (!visible) return null;
  return (
    <ScrollView style={styles.panel} contentContainerStyle={styles.content} nestedScrollEnabled>
      <Pressable accessibilityRole="button" onPress={tuning.reset}>
        <Text style={styles.title}>RESET ALL</Text>
      </Pressable>
      {groups.map(({ group, title, fields }) => (
        <View key={group}>
          <Text style={styles.title}>{title}</Text>
          {fields.map(([key, label, step]) => {
            const value = (tuning[group] as Record<string, number>)[key];
            return (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${title} ${label}`} onPress={() => tuning.setValue(group, key, +(value - step).toFixed(2))}><Text style={styles.button}>−</Text></Pressable>
                <Text style={styles.value}>{value.toFixed(step < 1 ? 2 : 0)}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${title} ${label}`} onPress={() => tuning.setValue(group, key, +(value + step).toFixed(2))}><Text style={styles.button}>+</Text></Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', top: 210, alignSelf: 'center', width: 240, maxHeight: 420, zIndex: 110, elevation: 110, backgroundColor: 'rgba(0,0,0,0.92)', borderColor: '#F5C842', borderWidth: 1, borderRadius: 8 },
  content: { padding: 9, gap: 8 },
  title: { color: '#F5C842', fontWeight: '800', fontSize: 11, marginBottom: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 28 },
  label: { width: 92, color: 'white', fontSize: 10 },
  button: { color: 'white', fontSize: 18, width: 25, textAlign: 'center', backgroundColor: '#444' },
  value: { color: 'white', width: 42, textAlign: 'center', fontSize: 11 },
});
