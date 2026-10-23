import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import {
  TERRACE_ELEMENT_IDS,
  TERRACE_ELEMENT_LABEL,
  TerraceElementId,
} from '../ui/homeTerraceScene';
import { currentRect, formatTerraceReadout, useHomeTerraceTuning } from './homeTerraceTuning';

// DEV-only positioning tool for the terrace Home (Pete's requirement, 2026-10-20).
// Pick an element, then drag it on the scene or nudge it with the arrows. Values are design units
// (443 x 960) and are saved on the phone. READOUT shows every element's final numbers.

type Props = {
  k: number;
  selected: TerraceElementId | null;
  onSelect: (id: TerraceElementId | null) => void;
  showHitAreas: boolean;
  onToggleHitAreas: () => void;
  onExit: () => void;
};

const STEPS = [0.25, 1, 5] as const;

export function HomeTerracePositioner({ k, selected, onSelect, showHitAreas, onToggleHitAreas, onExit }: Props) {
  const [open, setOpen] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [readout, setReadout] = useState(false);
  const [step, setStep] = useState<(typeof STEPS)[number]>(1);
  const overrides = useHomeTerraceTuning((s) => s.overrides);
  const forceDailyPlayed = useHomeTerraceTuning((s) => s.forceDailyPlayed);
  const setRect = useHomeTerraceTuning((s) => s.setRect);
  const setForce = useHomeTerraceTuning((s) => s.setForceDailyPlayed);
  const forceGoldFeather = useHomeTerraceTuning((s) => s.forceGoldFeather);
  const setForceGoldFeather = useHomeTerraceTuning((s) => s.setForceGoldFeather);
  const forceStartHere = useHomeTerraceTuning((s) => s.forceStartHere);
  const setForceStartHere = useHomeTerraceTuning((s) => s.setForceStartHere);
  const showCastle = useHomeTerraceTuning((s) => s.showCastle);
  const setShowCastle = useHomeTerraceTuning((s) => s.setShowCastle);
  const resetElement = useHomeTerraceTuning((s) => s.resetElement);
  const resetAll = useHomeTerraceTuning((s) => s.resetAll);

  // The drag handler must always see the current selection and values.
  const live = useRef({ selected, overrides, k });
  live.current = { selected, overrides, k };
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => live.current.selected !== null,
        onMoveShouldSetPanResponder: () => live.current.selected !== null,
        onPanResponderGrant: () => {
          const { selected: id, overrides: o } = live.current;
          if (!id) return;
          const r = currentRect(id, o);
          dragStart.current = { x: r.x, y: r.y };
        },
        onPanResponderMove: (_e, g) => {
          const { selected: id, k: scale } = live.current;
          const start = dragStart.current;
          if (!id || !start) return;
          setRect(id, {
            x: Math.round((start.x + g.dx / scale) * 100) / 100,
            y: Math.round((start.y + g.dy / scale) * 100) / 100,
          });
        },
        onPanResponderRelease: () => {
          dragStart.current = null;
        },
      }),
    [setRect],
  );

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    const r = currentRect(selected, overrides);
    setRect(selected, { x: r.x + dx * step, y: r.y + dy * step });
  };
  const resize = (factor: number) => {
    if (!selected) return;
    const r = currentRect(selected, overrides);
    setRect(selected, { w: r.w * factor, h: r.h * factor });
  };

  const sel = selected ? currentRect(selected, overrides) : null;
  const text = formatTerraceReadout(overrides);

  return (
    <>
      {dragMode && selected ? (
        <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle DEV positioner"
        onPress={() => setOpen((v) => !v)}
        style={styles.fab}
      >
        <Text style={styles.fabText}>{open ? 'HIDE' : 'DEV'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.panel} pointerEvents="box-none">
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>HOME TERRACE POSITIONER</Text>
            <View style={styles.chips}>
              {TERRACE_ELEMENT_IDS.map((id) => (
                <Pressable
                  key={id}
                  onPress={() => onSelect(selected === id ? null : id)}
                  style={[styles.chip, selected === id && styles.chipOn, overrides[id] && styles.chipMoved]}
                >
                  <Text style={[styles.chipText, selected === id && styles.chipTextOn]}>
                    {TERRACE_ELEMENT_LABEL[id]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selected && sel ? (
              <>
                <Text style={styles.value}>
                  {TERRACE_ELEMENT_LABEL[selected]}: x {sel.x.toFixed(2)}  y {sel.y.toFixed(2)}  w {sel.w.toFixed(2)}  h {sel.h.toFixed(2)}
                </Text>
                <View style={styles.row}>
                  <Btn label="Left" onPress={() => nudge(-1, 0)} />
                  <Btn label="Right" onPress={() => nudge(1, 0)} />
                  <Btn label="Up" onPress={() => nudge(0, -1)} />
                  <Btn label="Down" onPress={() => nudge(0, 1)} />
                </View>
                <View style={styles.row}>
                  <Btn label="Smaller 1%" onPress={() => resize(0.99)} />
                  <Btn label="Bigger 1%" onPress={() => resize(1.01)} />
                  <Btn label="Smaller 5%" onPress={() => resize(0.95)} />
                  <Btn label="Bigger 5%" onPress={() => resize(1.05)} />
                </View>
                <View style={styles.row}>
                  {STEPS.map((s) => (
                    <Btn key={s} label={`Step ${s}`} on={step === s} onPress={() => setStep(s)} />
                  ))}
                  <Btn label={dragMode ? 'Drag: ON' : 'Drag: off'} on={dragMode} onPress={() => setDragMode((v) => !v)} />
                  <Btn label="Reset this" onPress={() => resetElement(selected)} />
                </View>
              </>
            ) : (
              <Text style={styles.hint}>Pick an element, then drag it on the scene or nudge it.</Text>
            )}

            <View style={styles.row}>
              <Btn label={showHitAreas ? 'Hit areas: ON' : 'Hit areas: off'} on={showHitAreas} onPress={onToggleHitAreas} />
              <Btn
                label={forceDailyPlayed === null ? 'Daily: real' : forceDailyPlayed ? 'Daily: played' : 'Daily: not played'}
                onPress={() => setForce(forceDailyPlayed === null ? false : forceDailyPlayed === false ? true : null)}
              />
              <Btn
                label={forceGoldFeather === null ? 'Feather: real' : forceGoldFeather ? 'Feather: ready' : 'Feather: none'}
                onPress={() => setForceGoldFeather(forceGoldFeather === null ? true : forceGoldFeather ? false : null)}
              />
              <Btn
                label={forceStartHere === null ? 'Start here: real' : forceStartHere ? 'Start here: shown' : 'Start here: hidden'}
                onPress={() => setForceStartHere(forceStartHere === null ? true : forceStartHere ? false : null)}
              />
              <Btn label={showCastle ? 'Castle: shown' : 'Castle: hidden'} on={showCastle} onPress={() => setShowCastle(!showCastle)} />
              <Btn label={readout ? 'Readout: ON' : 'Readout'} on={readout} onPress={() => setReadout((v) => !v)} />
              <Btn label="Reset ALL" onPress={resetAll} />
              <Btn label="Old Home (dev)" onPress={onExit} />
            </View>

            {readout ? (
              <>
                <Text selectable style={styles.readout}>{text}</Text>
                <Btn label="Share readout" onPress={() => { Share.share({ message: text }).catch(() => {}); }} />
              </>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

function Btn({ label, onPress, on }: { label: string; onPress: () => void; on?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, on && styles.btnOn]}>
      <Text style={[styles.btnText, on && styles.btnTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 8,
    top: '45%',
    zIndex: 100,
    backgroundColor: '#F5C842',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fabText: { color: '#1B1230', fontWeight: '800', fontSize: 13 },
  panel: { position: 'absolute', left: 0, right: 0, top: 0, height: '52%', zIndex: 99 },
  scroll: { backgroundColor: 'rgba(11,9,32,0.9)' },
  scrollContent: { padding: 12, paddingTop: 48, gap: 10 },
  title: { color: '#F5C842', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#4A3A78', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: '#B98ADE', borderColor: '#B98ADE' },
  chipMoved: { borderColor: '#F5C842' },
  chipText: { color: '#FFFFFF', fontSize: 13 },
  chipTextOn: { color: '#1B1230', fontWeight: '700' },
  value: { color: '#FFFFFF', fontSize: 13 },
  hint: { color: '#B7ACDC', fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: { backgroundColor: '#211B4A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  btnOn: { backgroundColor: '#F5C842' },
  btnText: { color: '#FFFFFF', fontSize: 13 },
  btnTextOn: { color: '#1B1230', fontWeight: '700' },
  readout: { color: '#FFFFFF', fontFamily: 'Courier', fontSize: 11 },
});
