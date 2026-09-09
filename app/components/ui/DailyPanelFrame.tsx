import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dailyScrollMaterial as M, dailyPanelFrameMaterial as F } from '../../ui/pwDailyMaterials';
import ParchmentSurface from './ParchmentSurface';

export type DailyPanelFrameState = 'idle' | 'revealing' | 'perfect';

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
        <ParchmentSurface width={panelWidth} height={panelHeight} />
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
    borderRadius: M.radius,
    // Reverted to 'hidden' 2026-08-23 — the paper-overflow bug that made
    // 'hidden' crop the art is fixed above (paperHeight now fits by
    // construction), so clipping is safe again and needed for rounded
    // corners + the round-open grow animation.
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
});
