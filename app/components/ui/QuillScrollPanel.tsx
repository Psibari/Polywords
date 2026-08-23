import React, { forwardRef, useState } from 'react';
import { Animated, Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { dailyScrollMaterial as M } from '../../ui/pwDailyMaterials';
import DailyPanelFrame from './DailyPanelFrame';
import DailyRevealCurtain from './DailyRevealCurtain';
import { useDailyScrollTuning } from '../../dev/dailyScrollTuning';

const SCROLL_ROD = require('../../../assets/images/textures/scroll_rod.png');
// Native pixel ratio (1659x165) of scroll_rod.png.
const ROD_ASPECT_RATIO = 1659 / 165;

export type QuillScrollPanelProps = {
  // 0 = rolled closed, 1 = fully open. Native driver: transform + opacity only.
  rollProgress: Animated.Value;
  // 0 = clue showing, 1 = purple reveal panel fully covers the card. Native driver: transform + opacity only.
  revealProgress?: Animated.Value;
  // Daily's day-progress feathers: 1-4 correct claims today shows that many
  // white feathers; the 5th (revealPerfect) shows a single gold feather and
  // gilds the card border for the rest of that reveal.
  revealFeatherCount?: number;
  revealPerfect?: boolean;
  children: React.ReactNode;
};

const VIEW_H = 190;

const QuillScrollPanel = forwardRef<View, QuillScrollPanelProps>(
  function QuillScrollPanel(
    { rollProgress, revealProgress, revealFeatherCount, revealPerfect, children },
    ref,
  ) {
    const contentTopPad = useDailyScrollTuning((s) => s.contentTopPad);
    const rod = useDailyScrollTuning((s) => s.rod);

    // Round-to-round entrance: the panel grows downward from the fixed top
    // rod (0 -> full height, clipped by scrollBody's overflow:hidden), like
    // paper unrolling — replaced a 3D rotateY card-flip that no longer
    // matched the scroll art (Pete: "it has to roll", 2026-08-22). rollProgress
    // is still named for the original flip; kept to avoid touching every
    // caller over a rename.
    const rollHeight = rollProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, VIEW_H],
    });

    // The rod is now ONE fixture, fixed in place, shared by both the idle
    // panel and the reveal — it used to be drawn separately by each of
    // DailyPanelFrame and DailyRevealCurtain, which could drift out of sync
    // and looked like two different rods (Pete, 2026-08-23). Measured here
    // once and handed down as sizes, not duplicated.
    const [scrollBodyWidth, setScrollBodyWidth] = useState(0);
    const handleScrollBodyLayout = (e: LayoutChangeEvent) =>
      setScrollBodyWidth(e.nativeEvent.layout.width);
    const rodBaseHeight = scrollBodyWidth > 0 ? scrollBodyWidth / ROD_ASPECT_RATIO : undefined;
    const rodHeight = rodBaseHeight !== undefined ? rodBaseHeight * rod.scaleY : undefined;
    const rodWidth = scrollBodyWidth > 0 ? scrollBodyWidth * rod.scaleX : undefined;
    const rodLeft =
      rodWidth !== undefined ? (scrollBodyWidth - rodWidth) / 2 + rod.offsetX : undefined;
    const rodTop = rod.offsetY;

    // front-content: fades + sinks as the reveal grows over it (CSS: opacity 0, translateY(30%))
    const frontOpacity = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
      : 1;
    const frontTranslateY = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [0, VIEW_H * 0.3] })
      : 0;

    // Reveal: grows straight down from directly under the ONE shared rod
    // above, instead of a separate curtain sliding in from off-screen — so
    // it reads as the same scroll continuing to unroll, not a second object
    // landing on top (Pete: "it doesn't look right... looks like a separate
    // thing", 2026-08-23).
    const revealAreaHeight = rodHeight !== undefined ? Math.max(0, VIEW_H - rodHeight) : VIEW_H;
    const revealGrowHeight = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [0, revealAreaHeight] })
      : 0;

    const isRevealing = Boolean(revealFeatherCount) || revealPerfect;

    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        <Animated.View
          style={[styles.scrollBody, { height: rollHeight }]}
          onLayout={handleScrollBodyLayout}
        >
          {/* front-content — the idle paper + live clue text, fades away as
              the reveal grows over it. */}
          <Animated.View
            pointerEvents="none"
            style={{
              flex: 1,
              opacity: frontOpacity,
              transform: [{ translateY: frontTranslateY }],
            }}
          >
            <DailyPanelFrame
              height={VIEW_H}
              state={revealPerfect ? 'perfect' : isRevealing ? 'revealing' : 'idle'}
            >
              <View style={[styles.content, { top: contentTopPad }]}>{children}</View>
            </DailyPanelFrame>
          </Animated.View>

          {/* reveal — grows down from directly under the shared rod below,
              covering the clue and showing the feather/seal celebration
              content, instead of a separate curtain sliding in. */}
          {revealProgress && rodHeight !== undefined && rodTop !== undefined && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: rodTop + rodHeight,
                height: revealGrowHeight,
                overflow: 'hidden',
              }}
            >
              <DailyRevealCurtain
                height={revealAreaHeight}
                revealFeatherCount={revealFeatherCount}
                revealPerfect={revealPerfect}
              />
            </Animated.View>
          )}

          {/* the one shared rod — fixed in place, always visible, on top of
              both the idle content and the reveal growing beneath it. */}
          {rodHeight !== undefined && (
            <Image
              source={SCROLL_ROD}
              style={{
                position: 'absolute',
                width: rodWidth,
                height: rodHeight,
                left: rodLeft,
                top: rodTop,
              }}
              resizeMode="stretch"
            />
          )}
        </Animated.View>
      </View>
    );
  },
);

export default QuillScrollPanel;

const styles = StyleSheet.create({
  root: {
    height: VIEW_H,
    marginHorizontal: 20,
    marginTop: 8,
  },
  scrollBody: {
    // height comes from the animated rollHeight (see render) — the
    // round-entrance grow, replacing the old flex:1 + rotateY flip.
    borderRadius: M.radius,
    // Reverted to 'hidden' 2026-08-23 — the paper-overflow bug that made
    // 'hidden' crop the art is fixed in DailyPanelFrame.tsx/
    // DailyRevealCurtain.tsx (paperHeight now fits by construction), and
    // 'hidden' is required for the round-open grow animation to clip
    // correctly (only the currently-grown portion should be visible).
    overflow: 'hidden',
    // Removed the flat backgroundColor + drop shadow 2026-08-23 — both were
    // tuned for the old solid-rectangle card and read as an artificial "box"
    // framing the torn-edge parchment art (Pete: "the art sits inside a box
    // rather than being the box"). The scroll art's own alpha/silhouette is
    // now the only thing visible; nothing solid sits behind it.
  },
  content: {
    position: 'absolute',
    left: 18,
    right: 18,
    // top comes from useDailyScrollTuning's contentTopPad (see render) —
    // clearance below DailyPanelFrame's top-mounted rod art, dev-tunable.
    bottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
