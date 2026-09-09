import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dailyPanelFrameMaterial as F } from '../../ui/pwDailyMaterials';
import ParchmentSurface from './ParchmentSurface';

export type DailyPanelFrameState = 'idle' | 'revealing' | 'perfect';

// Hides the parchment's straight top edge behind the top rod: the paper is
// rendered PARCHMENT_TUCK points above this panel's own top (see below), so
// its top edge sits inside the rod's own footprint regardless of any residual
// stacking/rounding cause. The top rod renders ~30-38pt tall across
// supported device widths (see resolveRodMetrics in dailyScrollLayout.ts),
// so 10pt keeps the tuck safely within it on every one of them.
const PARCHMENT_TUCK = 10;

type Props = {
  state: DailyPanelFrameState;
  // Threaded explicitly from QuillScrollPanel's VIEW_H, same reasoning as
  // DailyRevealCurtain's `height` prop: this panel's real height animates
  // (0 -> VIEW_H) during the round-open grow, so self-measuring it via
  // onLayout made the paper/rod recompute their size on every intermediate
  // layout tick of that animation instead of once against a stable target —
  // a second, separate cause of visible size-jumping (device-confirmed
  // 2026-08-23), on top of the native-driver bug fixed alongside this.
  height: number;
  children: React.ReactNode;
};

export default function DailyPanelFrame({ height: panelHeight, children }: Props) {
  const [panelWidth, setPanelWidth] = useState(0);
  const handleLayout = (e: LayoutChangeEvent) => setPanelWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.outer}>
      <View style={styles.inner} onLayout={handleLayout}>
        {/* Absolutely positioned and tucked PARCHMENT_TUCK above this
            panel's own top so the paper's straight top edge sits behind the
            top rod (rendered above this component) rather than exposed at
            the panel's boundary. Its height grows by the same amount so the
            torn BOTTOM edge — drawn from the bottom of this view — still
            lands exactly at panelHeight, unchanged. This also makes the
            positioning honest: ParchmentSurface was previously the only
            in-flow child here, which only worked because every sibling
            (the sheen gradient, and `children`) is itself absolutely
            positioned. */}
        <ParchmentSurface
          width={panelWidth}
          height={panelHeight + PARCHMENT_TUCK}
          style={styles.parchmentTuck}
        />
        <LinearGradient
          colors={[F.sheenTop, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.sheen}
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    position: 'relative',
  },
  inner: {
    flex: 1,
    // borderRadius removed 2026-09-09 — the parchment art has its own
    // painted torn silhouette; a rounded-rect clip cut a hard geometric
    // edge across it and was a leftover from the boxed-panel look removed
    // 2026-08-23 (see sheen/scrollBody comments elsewhere: "the art sits
    // inside a box rather than being the box"). overflow stays: it is still
    // needed for the round-open grow animation to clip correctly.
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  parchmentTuck: {
    position: 'absolute',
    top: -PARCHMENT_TUCK,
    left: 0,
  },
});
