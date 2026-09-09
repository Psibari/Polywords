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
import { resolveRodMetrics } from '../dailyScrollLayout';

const SCROLL_ROD = require('../../../assets/images/textures/scroll_rod.png');

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
    // Rod metrics come from the drawing's own aspect (1659x165), never from
    // scale knobs. The shipped rod.scaleX 1.1 / scaleY 0.9 rendered a 10.055
    // drawing at 12.29 — a x1.22 stretch that smeared its cast finials.
    const rodMetrics = scrollBodyWidth > 0 ? resolveRodMetrics(scrollBodyWidth) : null;
    const rodWidth = rodMetrics?.width;
    const rodHeight = rodMetrics?.height;
    const rodLeft = rodMetrics ? -rodMetrics.overhang : undefined;
    const rodTop = 0;

    // Reveal: grows straight down from directly under the ONE shared rod
    // above, instead of a separate curtain sliding in from off-screen — so
    // it reads as the same scroll continuing to unroll, not a second object
    // landing on top (Pete: "it doesn't look right... looks like a separate
    // thing", 2026-08-23).
    const revealAreaHeight = rodHeight !== undefined ? Math.max(0, VIEW_H - rodHeight) : VIEW_H;
    const revealGrowHeight = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [0, revealAreaHeight] })
      : 0;
    // This is the reward paper's OWN descending edge — a separate instance
    // from the permanent bottom rod rendered below. Do not try to merge them:
    // the permanent rod must read as the scroll's bottom in every state
    // (including before any reveal exists), while this one is purely the
    // moving paper's lower edge and must stay invisible until a reveal is
    // actually in flight. revealProgress is always supplied at the sole call
    // site (DailyChallengeScreen.tsx), so the fallback branch below is
    // unreachable in the shipped app; it exists only because the prop is
    // optional in QuillScrollPanelProps.
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

        {/* The permanent bottom rod. Unlike the moving rod above, this one
            does not fade or move — it sits at the paper's lower edge in
            every state, including before any claim, so the scroll reads as
            a scroll (rod top and bottom) rather than a torn page in normal
            play. It sits below the reward paper's revealClip (zIndex 30) so
            the descending paper still visually covers it as a reveal grows,
            landing coincident with it at progress 1. */}
        {rodHeight !== undefined && (
          <Image
            source={SCROLL_ROD}
            style={[
              styles.permanentBottomRod,
              {
                width: rodWidth,
                height: rodHeight,
                left: rodLeft,
                top: revealAreaHeight,
              },
            ]}
            resizeMode="stretch"
          />
        )}

        {rodHeight !== undefined && (
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
  permanentBottomRod: {
    position: 'absolute',
    // Below revealClip (30) and movingRod (31) so the descending reward
    // paper still covers it as a reveal grows.
    zIndex: 29,
    elevation: 29,
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
