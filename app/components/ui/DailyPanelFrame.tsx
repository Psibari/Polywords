import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dailyScrollMaterial as M, dailyPanelFrameMaterial as F } from '../../ui/pwDailyMaterials';
import { useDailyScrollTuning } from '../../dev/dailyScrollTuning';

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

const SCROLL_PAPER = require('../../../assets/images/textures/scroll_paper.png');

export default function DailyPanelFrame({ height: panelHeight, children }: Props) {
  const [panelWidth, setPanelWidth] = useState(0);
  const handleLayout = (e: LayoutChangeEvent) => setPanelWidth(e.nativeEvent.layout.width);
  const paper = useDailyScrollTuning((s) => s.paper);

  // Top-anchored, and height is measured from the offset position down to
  // the panel's own bottom edge — NOT the full panel height. Shifting the
  // paper down while keeping it full-height pushed its bottom edge past the
  // panel, so overflow:hidden was cropping the torn edge off (device-
  // confirmed 2026-08-23). Sizing it to what's actually left below the
  // offset means it always fits by construction, at any offsetY.
  const paperWidth = panelWidth > 0 ? panelWidth * paper.scaleX : undefined;
  const paperHeight =
    panelHeight > 0 ? Math.max(0, panelHeight - paper.offsetY) * paper.scaleY : undefined;
  const paperLeft =
    paperWidth !== undefined ? (panelWidth - paperWidth) / 2 + paper.offsetX : undefined;
  const paperTop = paper.offsetY;

  return (
    <View style={styles.outer}>
      <View style={styles.inner} onLayout={handleLayout}>
        <Image
          source={SCROLL_PAPER}
          style={
            paperWidth !== undefined
              ? { position: 'absolute', width: paperWidth, height: paperHeight, left: paperLeft, top: paperTop }
              : StyleSheet.absoluteFill
          }
          resizeMode="stretch"
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
