import React from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useDailyScrollTuning } from './dailyScrollTuning';

// DEV-ONLY live tuning control for the Daily scroll — lets Pete dial in
// scroll height, the header block, card height, and a rod nudge without a
// code-edit-reload cycle per nudge. Remove once values are locked in and
// baked back into the real constants (see the contract comment atop
// dailyScrollTuning.ts).
//
// Two mount shapes, one control stack:
//  - with `onClose`, it renders as a full-screen dev viewer, the same shape
//    as the four Settings > Development viewers. That is how it is reachable
//    today: `app/screens/dailyDevControls.test.mjs` forbids DailyChallenge
//    Screen from referencing this panel at all (it used to float over the
//    answer-card grid), so Settings is the surface that does not fight that
//    rule. The store is plain module state, so a value set here is still in
//    force when Daily is opened afterwards.
//  - without it, it renders as the original floating overlay. Nothing mounts
//    that form today; it is kept so the panel can go back over a live screen
//    without being rewritten, if Pete ever lifts the Daily ban.
type Props = {
  visible?: boolean;
  onClose?: () => void;
};

// scrollHeight's "use the derived reservation" sentinel is null, so the
// steppers need a number to start from when leaving it. 244 is roughly the
// derived value at a 375pt screen — a starting point for nudging, never a
// shipped constant.
const SCROLL_HEIGHT_SEED = 244;

export default function DailyScrollTuningPanel({ visible = true, onClose }: Props) {
  const scrollHeight = useDailyScrollTuning((s) => s.scrollHeight);
  const headerVisible = useDailyScrollTuning((s) => s.headerVisible);
  const cardHeight = useDailyScrollTuning((s) => s.cardHeight);
  const rodOffsetY = useDailyScrollTuning((s) => s.rodOffsetY);
  const setScrollHeight = useDailyScrollTuning((s) => s.setScrollHeight);
  const setHeaderVisible = useDailyScrollTuning((s) => s.setHeaderVisible);
  const setCardHeight = useDailyScrollTuning((s) => s.setCardHeight);
  const setRodOffsetY = useDailyScrollTuning((s) => s.setRodOffsetY);

  const nudgeScrollHeight = (delta: number) =>
    setScrollHeight(scrollHeight === null ? SCROLL_HEIGHT_SEED + delta : scrollHeight + delta);

  const controls = (
    <View style={styles.root} pointerEvents="box-none">
      <Text style={styles.section}>SCROLL</Text>
      <Row
        label="HEIGHT"
        value={scrollHeight === null ? 'AUTO' : `${Math.round(scrollHeight)}`}
        onDec={() => nudgeScrollHeight(-8)}
        onInc={() => nudgeScrollHeight(8)}
      />
      <View style={styles.row}>
        <Text style={styles.label}>DERIVED</Text>
        <Pressable onPress={() => setScrollHeight(null)} style={styles.btn} hitSlop={8}>
          <Text style={styles.btnText}>AUTO</Text>
        </Pressable>
      </View>

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

  if (!onClose) return visible ? controls : null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.screen} accessibilityViewIsModal>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>DEVELOPMENT ONLY</Text>
            <Text style={styles.title}>DAILY SCROLL TUNING</Text>
          </View>
          <Pressable
            accessibilityLabel="Close Daily scroll tuning"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        <Text style={styles.note}>
          Values apply to the Daily Challenge screen and survive until reload. Set them here,
          then open Daily to judge. HEIGHT AUTO uses the derived reservation.
        </Text>
        <View style={styles.stack}>{controls}</View>
      </SafeAreaView>
    </Modal>
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
  screen: {
    flex: 1,
    backgroundColor: '#0F0D2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerCopy: {
    flexShrink: 1,
  },
  kicker: {
    color: '#00FF88',
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    color: '#F5C842',
    fontSize: 20,
    letterSpacing: 1.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 32,
  },
  note: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  // The control stack keeps its absolute overlay positioning in both mount
  // shapes; this reserves the space it sits in inside the modal.
  stack: {
    flex: 1,
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
