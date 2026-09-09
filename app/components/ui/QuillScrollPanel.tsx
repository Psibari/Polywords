import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { dailyCardMaterial } from '../../ui/pwDailyMaterials';
import { DailySubmittedAnswerCard } from '../DailyAnswerCard';
import DailyInkedWord from './DailyInkedWord';
import DailyPanelFrame, { PARCHMENT_TUCK } from './DailyPanelFrame';
import DailyRevealCurtain from './DailyRevealCurtain';
import {
  resolveClueStackHeight,
  resolveClueTextBoxWidth,
  resolveReservedTextHeight,
  resolveRodMetrics,
} from '../dailyScrollLayout';
import type { DailyClaimPresentationPhase } from '../../game/dailyClaimPresentation';
import { DAILY_POOL_CLUES } from '../../game/dailyPool';
import { useReducedMotionPreference } from '../../hooks/usePollyAmbientMotion';
import { useDailyScrollTuning } from '../../dev/dailyScrollTuning';

const SCROLL_ROD = require('../../../assets/images/textures/scroll_rod.png');

export type QuillScrollPanelProps = {
  // 0 = rolled closed, 1 = fully open. Drives clipped layout height.
  rollProgress: Animated.Value;
  // 0 = clue showing, 1 = reward paper fully covers clue + submitted card.
  revealProgress?: Animated.Value;
  // Daily's day-progress feathers: 1-4 correct claims today shows that many
  // white feathers; the 5th (revealPerfect) shows a single gold feather
  // instead.
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
  // 0 = the submitted card is still a card; 1 = fully inked into the
  // parchment. Drives the card-chrome fade and the ink's own opacity/
  // transform (see DailyInkedWord) — never layout or color.
  inkProgress?: Animated.Value;
  // How many of the round's clues are currently revealed. Drives how far the
  // parchment unrolls; a fresh round with no value yet defaults to 1.
  revealedClueCount?: 1 | 2 | 3;
  // True for the same phase span the caller passes to ClueStage's own
  // `contracted` prop ('settling' | 'landed' | 'inking' | 'covering') — a
  // single boolean threaded from one phase check in DailyChallengeScreen,
  // not re-derived here. Top-anchors the content band instead of centering
  // it, so the height ClueStage's unmounted memory clues free up collects
  // at the BOTTOM, where the card lands and inks in, rather than splitting
  // above and below the surviving active clue.
  contracted?: boolean;
  // The claim presentation's own phase, threaded from DailyChallengeScreen
  // rather than inferred from `submittedAnswer` here. submittedAnswer is
  // cleared at the TOP of the 'reward' phase, so inferring the pin from it
  // released the parchment's full height one frame into the reward beat —
  // panel, both rods and the reveal curtain all dropped together while the
  // reward paper was meant to be sitting still and readable. See
  // unrollTarget below.
  claimPhase?: DailyClaimPresentationPhase;
  children: React.ReactNode;
};

// The panel reserves its WORST case and never resizes, so nothing below it
// on screen ever moves. The parchment unrolls INTO this reservation as
// clues arrive (see unrollTarget below), which is what turns round 1's
// empty parchment from "dead space" into "not yet unrolled".
const CONTENT_TOP_CLEARANCE = 12; // below the top rod
const CONTENT_BOTTOM_CLEARANCE = 10; // above the bottom rod
// How far the reward paper starts ABOVE the top rod's lower edge, so its own
// straight top edge is hidden behind the rod instead of sitting flush against
// the rod's boundary where it reads as a seam. Same trick as the parchment's
// PARCHMENT_TUCK in DailyPanelFrame.tsx.
const CURTAIN_TUCK = 10;

const QuillScrollPanel = forwardRef<View, QuillScrollPanelProps>(
  function QuillScrollPanel(
    {
      rollProgress,
      revealProgress,
      revealFeatherCount,
      revealPerfect,
      submittedAnswer,
      submittedProgress,
      inkProgress,
      revealedClueCount,
      contracted,
      claimPhase,
      children,
    },
    ref,
  ) {
    const reduceMotion = useReducedMotionPreference();

    // DEV-ONLY tuning (app/dev/dailyScrollTuning.ts) — see that file's
    // contract comment. scrollHeight overrides the derived reservedHeight
    // below; rodOffsetY nudges the fixed top rod and the permanent bottom
    // rod together, never the reward paper's own moving rod.
    const scrollHeightOverride = useDailyScrollTuning((s) => s.scrollHeight);
    const rodOffsetY = useDailyScrollTuning((s) => s.rodOffsetY);

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
    // Base position for the fixed top rod and the reveal paper's own moving
    // rod, which starts its descent from here. rodOffsetY is applied
    // separately, below, only to the fixed top rod and the permanent bottom
    // rod — never to this value, so the dev nudge cannot touch the moving
    // rod's independent journey.
    // Raised by PARCHMENT_TUCK so the rod's top edge sits level with the
    // parchment's own tucked top edge and covers it. DailyPanelFrame draws
    // the paper at -PARCHMENT_TUCK to keep its straight cut edge hidden;
    // with the rod left at 0 that tuck stuck out ABOVE the rod as a thin
    // band of paper across the top (device-reported: "the curtain's peeking
    // out on top of it"). The reward curtain does NOT need this — its own
    // CURTAIN_TUCK starts it below the rod's top, already inside the rod.
    const rodTop = -PARCHMENT_TUCK;

    // The honest worst case: both rods, the clearance above and below the
    // text, and the reserved text box itself. Device-dependent, because the
    // rod's height is a fraction of the panel's width — a hard-coded
    // constant was several points short at 393 and 430pt. scrollHeight
    // (DEV-ONLY) OVERRIDES this when Pete moves the knob off its "derived"
    // sentinel; it does not replace it, so the shipped default is genuinely
    // the derived value. Still gated on rodMetrics: nothing can reserve
    // space before the root has a measured width.
    const derivedReservedHeight =
      rodMetrics === null
        ? 0
        : rodMetrics.height * 2 +
          CONTENT_TOP_CLEARANCE +
          resolveReservedTextHeight(scrollBodyWidth) +
          CONTENT_BOTTOM_CLEARANCE;
    const reservedHeight =
      rodMetrics === null ? 0 : scrollHeightOverride ?? derivedReservedHeight;

    // Measured from the rod's LOWER edge, which is now rodTop + rodHeight —
    // rodTop is negative, so this must not assume the rod starts at 0.
    const contentTopPad =
      rodHeight !== undefined
        ? rodTop + rodHeight + CONTENT_TOP_CLEARANCE
        : CONTENT_TOP_CLEARANCE;
    // The permanent bottom rod sits at the paper's lower edge, so the clue
    // stack must clear the rod's own height as well as CONTENT_BOTTOM_
    // CLEARANCE — exactly what the reservation above budgets. styles.content
    // used to hard-code 14 here, which predates that rod and ran the last
    // line of a worst-case stack under it. Computed inline (like
    // contentTopPad) because rodHeight is device-dependent.
    const contentBottomPad =
      rodHeight !== undefined
        ? rodHeight + CONTENT_BOTTOM_CLEARANCE
        : CONTENT_BOTTOM_CLEARANCE;

    // resolveClueStackHeight guards width but not clueCount — a NaN count
    // would propagate NaN into the unroll math. Only 1/2/3 are ever valid,
    // so anything else (including a genuinely absent prop) defaults to 1.
    const safeRevealedClueCount: 1 | 2 | 3 =
      revealedClueCount === 2 || revealedClueCount === 3 ? revealedClueCount : 1;

    // One clue shows a short scroll; each new clue unrolls it further. The
    // paper's own lower edge and the bottom rod travel down together, which
    // is what a scroll does. rollProgress still drives the round-entrance
    // grow (0 -> full reservation); unrollHeight below scales that target.
    //
    // While a claim presentation is running the parchment opens to its FULL
    // reserved height regardless of how many clues are showing. Below full
    // height, one clue's worth of unroll leaves too little room for an
    // active clue plus the inked card to land without overlapping — see the
    // Task 6 fix-round-1 report. Thematically this reads as the document
    // opening up to take the word.
    //
    // The pin lasts the WHOLE presentation ('settling' through 'revealing'),
    // not just while submittedAnswer is non-null. submittedAnswer is cleared
    // at the top of 'reward', and the same batch flips the displayed session
    // to the next round — dropping revealedCount to 1 — so keying off it
    // shrank the reservation mid-reward. It releases at 'idle', once the
    // reward paper has finished rolling back up.
    const claimPresentationActive = claimPhase !== undefined
      ? claimPhase !== 'idle'
      : submittedAnswer != null;
    const unrollTarget = (() => {
      if (rodMetrics === null || scrollBodyWidth <= 0) return 0;
      if (claimPresentationActive) return reservedHeight;
      const box = resolveClueTextBoxWidth(scrollBodyWidth);
      const stack = resolveClueStackHeight(safeRevealedClueCount, box, DAILY_POOL_CLUES);
      return Math.min(
        reservedHeight,
        rodMetrics.height +
          CONTENT_TOP_CLEARANCE +
          stack +
          CONTENT_BOTTOM_CLEARANCE +
          rodMetrics.height,
      );
    })();

    // A separate Animated.Value from rollProgress (which stays a pure 0->1
    // round-entrance driver, untouched here) so that changing unrollTarget
    // animates smoothly instead of rebuilding an interpolation's captured
    // outputRange out from under a running animation, which would jump
    // rather than glide. Initialised to 0, not unrollTarget: the effect
    // below drives it to the first real target once one exists, so this
    // doesn't construct-and-discard a fresh Animated.Value on every render.
    const unrollHeight = useRef(new Animated.Value(0)).current;
    // Plain mirror of unrollHeight's last requested target. There is no
    // safe synchronous read of an Animated.Value (no __getValue, and a
    // listener is the wrong tool for a one-off comparison), so this ref is
    // the source of truth for "did the target grow or shrink".
    const unrollHeightTargetRef = useRef(0);
    // Whether the previous render's target was the claim-presentation pin,
    // so the effect can tell "the pin was just released" from "a fresh
    // round reset the clue count".
    const wasPinnedRef = useRef(false);
    useEffect(() => {
      const grew = unrollTarget > unrollHeightTargetRef.current;
      const releasingPin = wasPinnedRef.current && !claimPresentationActive;
      unrollHeightTargetRef.current = unrollTarget;
      wasPinnedRef.current = claimPresentationActive;
      if (reduceMotion !== false || (!grew && !releasingPin)) {
        // A round boundary resets the clue count from 3 back to 1 — a
        // shrink. Animating that down raced the entrance (rollProgress
        // 0->1 over 320ms) easing up toward the OLD, larger unrollHeight,
        // so the panel overshot to the previous round's height and then
        // visibly shrank to the new one. The entrance owns that moment, so
        // a shrink snaps instead. Reduce Motion always snaps too, same as
        // every other animation in this feature.
        //
        // The pin's own release is the one shrink that does NOT snap. On
        // that path the round already changed back during 'reward', and the
        // ROUND CHANGE effect in DailyChallengeScreen skips the entrance
        // whenever a physical transition is active — so rollProgress is
        // still 1 and no entrance is running to own the moment or hide a
        // snap. The scroll rolling back up to its one-clue length is what
        // should be seen there instead.
        unrollHeight.setValue(unrollTarget);
        return;
      }
      Animated.timing(unrollHeight, {
        toValue: unrollTarget,
        duration: 420,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        // height, not transform — native driver is not available here
        useNativeDriver: false,
      }).start();
    }, [unrollTarget, unrollHeight, reduceMotion, claimPresentationActive]);

    // The visible paper height composes the round-entrance grow with the
    // per-clue unroll target: 0 while rollProgress is 0, unrollHeight once
    // the round has entered.
    const panelAnimatedHeight = Animated.multiply(rollProgress, unrollHeight);

    // Reveal: grows straight down from directly under the ONE shared rod
    // above, instead of a separate curtain sliding in from off-screen — so
    // it reads as the same scroll continuing to unroll, not a second object
    // landing on top (Pete: "it doesn't look right... looks like a separate
    // thing", 2026-08-23).
    // Plain number, used only where a plain number is genuinely required
    // (DailyRevealCurtain's height prop draws its background art at this
    // size). Nothing that feeds an Animated interpolation's outputRange may
    // derive from unrollTarget — see revealGrowHeight below, which tracks
    // the same live unrollHeight the panel itself uses instead.
    const revealAreaHeight =
      rodHeight !== undefined ? Math.max(0, unrollTarget - rodHeight) : reservedHeight;
    // Tracks the live unrollHeight (not the plain-number unrollTarget/
    // revealAreaHeight above) via Animated.multiply/subtract rather than an
    // interpolation whose outputRange would need rebuilding — and silently
    // jump — every time unrollTarget changes. This also makes the moving
    // reward-paper edge and the permanent bottom rod below track the exact
    // same animated value, so the two rods cannot land at different
    // heights in the same window.
    const revealGrowHeight = revealProgress
      ? Animated.multiply(revealProgress, Animated.subtract(unrollHeight, rodHeight ?? 0))
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
    // Derived from unrollTarget (how far the parchment is unrolled RIGHT
    // NOW), not reservedHeight (the worst-case reservation) — a card landed
    // against reservedHeight on a one- or two-clue round flew past the
    // paper's actual lower edge and the bottom rod onto the stone
    // background, where the reward paper could never reach it to cover it
    // (device-confirmed, fix round 2). This does read like the same
    // "interpolation outputRange derived from a changing value" hazard
    // Correction 1 exists to avoid, but it is safe here: unrollTarget only
    // changes when the revealed clue count changes, and clue reveals are
    // gated on isDailyClaimInputLocked in DailyChallengeScreen.tsx, which is
    // exactly the window during which a submitted-card animation can be in
    // flight. The two never run at the same time. Do not "fix" this by
    // switching back to reservedHeight.
    const submittedTargetY = submittedAnswer && rodMetrics
      ? Math.max(
          rodMetrics.height + CONTENT_TOP_CLEARANCE,
          unrollTarget - rodMetrics.height - CONTENT_BOTTOM_CLEARANCE - submittedAnswer.height,
        )
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

    // The card's leather and gold rim fade out as the ink comes in, so the
    // two never simply cross-dissolve on top of each other — the chrome is
    // mostly gone (opacity 0) well before the ink is fully legible.
    const cardChromeOpacity = inkProgress
      ? inkProgress.interpolate({ inputRange: [0, 0.45], outputRange: [1, 0] })
      : 1;

    return (
      <View
        ref={ref}
        style={[styles.root, { height: reservedHeight }]}
        collapsable={false}
        onLayout={handleRootLayout}
      >
        <Animated.View style={[styles.scrollBody, { height: panelAnimatedHeight }]}>
          {/* The clue stays intact; the reward paper physically covers it. */}
          <Animated.View pointerEvents="none" style={styles.frontContent}>
            <DailyPanelFrame height={reservedHeight}>
              <View
                style={[
                  styles.content,
                  { top: contentTopPad, bottom: contentBottomPad },
                  contracted && styles.contentContracted,
                ]}
              >
                {children}
              </View>
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
            {/* absoluteFill, not a bare wrapper: DailySubmittedAnswerCard's
                shell is width/height '100%', which against an indefinite
                owner height content-sized to roughly 37pt inside the 64pt
                box. The ink below centres in the FULL box, so the two halves
                of the crossfade sat ~13pt apart and the word stepped as the
                chrome faded. Both layers must occupy the identical
                rectangle. */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: cardChromeOpacity }]}>
              <DailySubmittedAnswerCard label={submittedAnswer.label} />
            </Animated.View>
            {inkProgress && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={styles.inkCentre}>
                  <DailyInkedWord label={submittedAnswer.label} progress={inkProgress} />
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Reward paper grows from the shared rod above both clue and card. */}
        {revealProgress && rodHeight !== undefined && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.revealClip,
              {
                // Tucked UP behind the top rod by CURTAIN_TUCK rather than
                // starting flush at the rod's lower edge. Flush left the
                // curtain's own straight top edge sitting exactly on the
                // rod's boundary, where it read as a hard line under the
                // rod (device-reported: "the top rod is showing the
                // curtain underneath it"). The rod is ~30-38pt tall, so
                // the tuck stays comfortably hidden behind it. Height is
                // grown by the same amount so the curtain's lower edge —
                // which the moving rod rides — is unchanged.
                top: rodTop + rodHeight - CURTAIN_TUCK,
                height: Animated.add(revealGrowHeight, CURTAIN_TUCK),
              },
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
            landing coincident with it at progress 1. rodOffsetY (DEV-ONLY,
            dailyScrollTuning.ts) nudges this together with the fixed top
            rod below — the pair must never drift apart — and never touches
            the reward paper's own moving rod above. */}
        {rodHeight !== undefined && (
          <Animated.Image
            source={SCROLL_ROD}
            style={[
              styles.permanentBottomRod,
              {
                width: rodWidth,
                height: rodHeight,
                left: rodLeft,
                top: Animated.add(Animated.subtract(panelAnimatedHeight, rodHeight), rodOffsetY),
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

        {/* One shared rod stays fixed above every moving layer. rodOffsetY
            (DEV-ONLY, dailyScrollTuning.ts) nudges this together with the
            permanent bottom rod above — see that comment. */}
        {rodHeight !== undefined && (
            <Image
              source={SCROLL_ROD}
              style={[
                styles.fixedRod,
                {
                  width: rodWidth,
                  height: rodHeight,
                  left: rodLeft,
                  top: rodTop + rodOffsetY,
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
    // height comes from the derived reservedHeight (see render) — it never
    // changes once the rod is measured, so nothing below the panel moves.
    marginHorizontal: 20,
    marginTop: 8,
    overflow: 'visible',
  },
  frontContent: {
    flex: 1,
  },
  scrollBody: {
    // height comes from panelAnimatedHeight (see render) — the
    // round-entrance grow composed with the per-clue unroll target,
    // replacing the old flex:1 + rotateY flip.
    // borderRadius removed 2026-09-09 — the parchment art has its own
    // painted torn silhouette; a rounded-rect clip cut a hard geometric
    // edge across it and was a leftover from the boxed-panel look removed
    // below. overflow stays: it is still required for the round-open grow
    // animation to clip correctly (only the currently-grown portion should
    // be visible).
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
    // top comes from contentTopPad and bottom from contentBottomPad (see
    // render) — the measured rod height plus the matching clearance at each
    // end, i.e. clearance inside both the top-mounted rod and the permanent
    // bottom rod, and exactly what the reservation budgets.
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Active during 'settling' | 'landed' | 'inking' | 'covering' (the same
  // span ClueStage unmounts its memory clues for). The surviving active
  // clue rises to the top of the content band instead of staying centred,
  // so the height the memory clues freed up collects at the BOTTOM — where
  // the card lands and inks in — rather than splitting evenly above and
  // below it.
  contentContracted: {
    justifyContent: 'flex-start',
  },
  submittedAnswer: {
    position: 'absolute',
    left: 0,
    top: 0,
    // ABOVE the permanent bottom rod (25), below the reward paper (30).
    // The card flies up from the grid below the scroll and crosses the
    // paper's lower edge on its way in, so at zIndex 20 it passed BEHIND
    // the bottom rod and then reappeared in front of the parchment —
    // device-reported as "it goes underneath, then pops on top of it".
    // It must stay below revealClip so the reward paper still covers it.
    zIndex: 28,
    elevation: 28,
  },
  inkCentre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    // paper still covers it as a reveal grows, and below the flying card
    // (28) so the card crosses in FRONT of the rod on its way in.
    zIndex: 25,
    elevation: 25,
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
