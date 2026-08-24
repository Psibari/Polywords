import React, { forwardRef, useState } from 'react';
import { Animated, Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
  dailyCardMaterial,
  dailyScrollMaterial as M,
} from '../../ui/pwDailyMaterials';
import { DailySubmittedAnswerCard } from '../DailyAnswerCard';
import DailyPanelFrame from './DailyPanelFrame';
import DailyRevealCurtain from './DailyRevealCurtain';
import { useDailyScrollTuning } from '../../dev/dailyScrollTuning';

const SCROLL_ROD = require('../../../assets/images/textures/scroll_rod.png');
// Native pixel ratio (1659x165) of scroll_rod.png.
const ROD_ASPECT_RATIO = 1659 / 165;

export type QuillScrollPanelProps = {
  // 0 = rolled closed, 1 = fully open. Drives clipped layout height.
  rollProgress: Animated.Value;
  // 0 = clue showing, 1 = reward paper fully covers clue + submitted card.
  revealProgress?: Animated.Value;
  // Daily's day-progress feathers: 1-4 correct claims today shows that many
  // white feathers; the 5th (revealPerfect) shows a single gold feather and
  // gilds the card border for the rest of that reveal.
  revealFeatherCount?: number;
  revealPerfect?: boolean;
  submittedAnswer?: {
    label: string;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null;
  submittedProgress?: Animated.Value;
  children: React.ReactNode;
};

const VIEW_H = 190;

const QuillScrollPanel = forwardRef<View, QuillScrollPanelProps>(
  function QuillScrollPanel(
    {
      rollProgress,
      revealProgress,
      revealFeatherCount,
      revealPerfect,
      submittedAnswer,
      submittedProgress,
      children,
    },
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
    const handleRootLayout = (e: LayoutChangeEvent) =>
      setScrollBodyWidth(e.nativeEvent.layout.width);
    const rodBaseHeight = scrollBodyWidth > 0 ? scrollBodyWidth / ROD_ASPECT_RATIO : undefined;
    const rodHeight = rodBaseHeight !== undefined ? rodBaseHeight * rod.scaleY : undefined;
    const rodWidth = scrollBodyWidth > 0 ? scrollBodyWidth * rod.scaleX : undefined;
    const rodLeft =
      rodWidth !== undefined ? (scrollBodyWidth - rodWidth) / 2 + rod.offsetX : undefined;
    const rodTop = rod.offsetY;

    // Reveal: grows straight down from directly under the ONE shared rod
    // above, instead of a separate curtain sliding in from off-screen — so
    // it reads as the same scroll continuing to unroll, not a second object
    // landing on top (Pete: "it doesn't look right... looks like a separate
    // thing", 2026-08-23).
    const revealAreaHeight = rodHeight !== undefined ? Math.max(0, VIEW_H - rodHeight) : VIEW_H;
    const revealGrowHeight = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [0, revealAreaHeight] })
      : 0;
    // The descending paper edge uses the exact same authored rod as the
    // fixed fixture. At progress 0 the two rods coincide; as the reward paper
    // grows, this copy stays attached to its lower edge.
    const movingRodTop = revealProgress
      ? Animated.add(revealGrowHeight, rodTop)
      : rodTop;
    const movingRodOpacity = revealProgress
      ? revealProgress.interpolate({
          inputRange: [0, 0.02, 1],
          outputRange: [0, 1, 1],
        })
      : 0;

    const submittedTargetX = submittedAnswer
      ? (scrollBodyWidth - submittedAnswer.width) / 2
      : 0;
    const submittedTargetY = submittedAnswer
      ? Math.max(rodTop + (rodHeight ?? 0) + 12, VIEW_H - submittedAnswer.height - 16)
      : 0;
    const submittedTranslateX = submittedAnswer && submittedProgress
      ? submittedProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [submittedAnswer.startX, submittedTargetX],
        })
      : 0;
    const submittedTranslateY = submittedAnswer && submittedProgress
      ? submittedProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [submittedAnswer.startY, submittedTargetY],
        })
      : 0;
    const submittedScale = submittedProgress
      ? submittedProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [dailyCardMaterial.liftScale, 1],
        })
      : 1;

    const isRevealing = Boolean(revealFeatherCount) || revealPerfect;

    return (
      <View
        ref={ref}
        style={styles.root}
        collapsable={false}
        onLayout={handleRootLayout}
      >
        <Animated.View style={[styles.scrollBody, { height: rollHeight }]}>
          {/* The clue stays intact; the reward paper physically covers it. */}
          <Animated.View pointerEvents="none" style={styles.frontContent}>
            <DailyPanelFrame
              height={VIEW_H}
              state={revealPerfect ? 'perfect' : isRevealing ? 'revealing' : 'idle'}
            >
              <View style={[styles.content, { top: contentTopPad }]}>{children}</View>
            </DailyPanelFrame>
          </Animated.View>
        </Animated.View>

        {submittedAnswer && submittedProgress && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.submittedAnswer,
              {
                width: submittedAnswer.width,
                height: submittedAnswer.height,
                transform: [
                  { translateX: submittedTranslateX },
                  { translateY: submittedTranslateY },
                  { scale: submittedScale },
                ],
              },
            ]}
          >
            <DailySubmittedAnswerCard label={submittedAnswer.label} />
          </Animated.View>
        )}

        {/* Reward paper grows from the shared rod above both clue and card. */}
        {revealProgress && rodHeight !== undefined && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.revealClip,
              { top: rodTop + rodHeight, height: revealGrowHeight },
            ]}
          >
            <DailyRevealCurtain
              height={revealAreaHeight}
              revealFeatherCount={revealFeatherCount}
              revealPerfect={revealPerfect}
            />
          </Animated.View>
        )}

        {revealProgress && rodHeight !== undefined && (
          <Animated.Image
            source={SCROLL_ROD}
            style={[
              styles.movingRod,
              {
                width: rodWidth,
                height: rodHeight,
                left: rodLeft,
                top: movingRodTop,
                opacity: movingRodOpacity,
              },
            ]}
            resizeMode="stretch"
          />
        )}

        {/* One shared rod stays fixed above every moving layer. */}
        {rodHeight !== undefined && (
            <Image
              source={SCROLL_ROD}
              style={[
                styles.fixedRod,
                {
                  width: rodWidth,
                  height: rodHeight,
                  left: rodLeft,
                  top: rodTop,
                },
              ]}
              resizeMode="stretch"
            />
        )}
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
    overflow: 'visible',
  },
  frontContent: {
    flex: 1,
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
  submittedAnswer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 20,
    elevation: 20,
  },
  revealClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 30,
    elevation: 30,
  },
  movingRod: {
    position: 'absolute',
    zIndex: 31,
    elevation: 31,
  },
  fixedRod: {
    position: 'absolute',
    zIndex: 40,
    elevation: 40,
  },
});
