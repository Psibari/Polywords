import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

// Flip off to fall back to nothing rendering — following POLLY_PERCH_RIG_ENABLED's
// pattern (PollyPerchRig.tsx). Nothing in app/ reads this yet; it currently only
// gates the dev viewer (DailyTreeSceneDevViewer.tsx via Settings), not any live
// screen — see docs/DAILY_TREE_DESIGN_2026-09-14 (1).md, prompt 1 of 4.
export const DAILY_TREE_SCENE_ENABLED = true;

const silhouetteBg = require('../../assets/images/dailytree/tree-silhouette-bg.png');
const trunkBare = require('../../assets/images/dailytree/trunk-bare.png');
const branchPollyPerch = require('../../assets/images/dailytree/branch-polly-perch.png');
const branchPlaque = require('../../assets/images/dailytree/branch-plaque.png');
const plank1Nameplate = require('../../assets/images/dailytree/plank-1-nameplate.png');
const plank23Plain = require('../../assets/images/dailytree/plank-2-3-plain.png');
const vine = require('../../assets/images/dailytree/vine.png');
const plaqueBase = require('../../assets/images/dailytree/plaque-base.png');

// Native aspect ratios (width / height), read from the committed PNGs so every
// placement below scales the art without distortion.
const TRUNK_ASPECT = 1182 / 1910;
const BRANCH_ASPECT = 1254 / 871;
const PLANK_ASPECT = 2172 / 724;
const VINE_ASPECT = 1024 / 1536;

// Bands from DAILY_TREE_DESIGN_2026-09-14 (1).md §4, as fractions of screen
// height. Horizontal placement (trunk position, branch spans) is this
// component's own default and is flagged as such where it matters below.
const BAND = {
  pollyBranchTop: 0.07,
  pollyBranchBottom: 0.215,
  plank1Top: 0.266,
  plank1Bottom: 0.341,
  hiddenLipsTop: 0.343,
  hiddenLipsBottom: 0.362,
  corridorTop: 0.362,
  corridorBottom: 0.581,
  plaqueBranch1Top: 0.581,
  plaqueBranch1Bottom: 0.591,
  plaqueRow1Top: 0.616,
  plaqueRow1Bottom: 0.679,
  plaqueBranch2Top: 0.702,
  plaqueBranch2Bottom: 0.714,
  plaqueRow2Top: 0.738,
  plaqueRow2Bottom: 0.801,
  plaqueBranch3Top: 0.821,
  plaqueBranch3Bottom: 0.832,
  plaqueRow3Top: 0.857,
  plaqueRow3Bottom: 0.919,
} as const;

// Plaque size is ruled exactly: 41.4% of screen width, 6.3% of screen height.
const PLAQUE_WIDTH_PCT = 0.414;
const PLAQUE_HEIGHT_PCT = 0.063;
// NOT ruled by the design doc — horizontal spacing of the left/right plaque
// pair is only constrained by the width above. Default: split the remaining
// width into three equal thirds (left margin / gap / right margin). Flag
// this for on-device review; it may want to move to a design-doc ruling.
const PLAQUE_ROW_SIDE_FRACTION = (1 - 2 * PLAQUE_WIDTH_PCT) / 3;

// Trunk horizontal placement is this component's own default (not specified
// in the doc beyond "one continuous tree"): left-of-center, so all four
// branches have room to sweep rightward across the open corridor without the
// trunk crossing the plaques' centerline. Flag alongside the plaque spacing
// default above for on-device review.
const TRUNK_CENTER_X_PCT = 0.3;
const TRUNK_HEIGHT_PCT = 0.97;

// The stacked-plank "peek": plank 2 and plank 3 are nested behind plank 1,
// each offset a little further down so only their bottom lip shows in the
// hidden-lips band (§4, §5 — "growing downward," "lips peeking"). Offsets
// are fractions of screen height, landing each plank's bottom edge inside
// that band.
const PLANK2_OFFSET_PCT = 0.011;
const PLANK3_OFFSET_PCT = 0.021;

const PLANK_WIDTH_PCT = 0.78;

function bandBox(topPct: number, bottomPct: number, screenHeight: number) {
  const top = topPct * screenHeight;
  const height = (bottomPct - topPct) * screenHeight;
  return { top, height };
}

/**
 * Pure static layout for Polly's Daily tree — trunk, branches, the plank
 * stack (peeking, unrevealed), and the six answer plaques, positioned
 * against the percentage bands in DAILY_TREE_DESIGN_2026-09-14 (1).md §4.
 * No game-state props: clue text, plaque reskin/disabled state, rope state,
 * motion, and the HUD relocation are later prompts.
 */
export default function DailyTreeScene() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const trunkHeight = screenHeight * TRUNK_HEIGHT_PCT;
  const trunkWidth = trunkHeight * TRUNK_ASPECT;
  const trunkLeft = screenWidth * TRUNK_CENTER_X_PCT - trunkWidth / 2;

  const pollyBranch = bandBox(BAND.pollyBranchTop, BAND.pollyBranchBottom, screenHeight);
  const pollyBranchHeight = pollyBranch.height;
  const pollyBranchWidth = pollyBranchHeight * BRANCH_ASPECT;

  const plank1 = bandBox(BAND.plank1Top, BAND.plank1Bottom, screenHeight);
  const plankWidth = screenWidth * PLANK_WIDTH_PCT;
  const plankHeight = plankWidth / PLANK_ASPECT;
  const plankLeft = (screenWidth - plankWidth) / 2;

  const corridor = bandBox(BAND.corridorTop, BAND.corridorBottom, screenHeight);
  const vineHeight = corridor.height;
  const vineWidth = vineHeight * VINE_ASPECT;

  const plaqueBranch1 = bandBox(BAND.plaqueBranch1Top, BAND.plaqueBranch1Bottom, screenHeight);
  const plaqueBranch2 = bandBox(BAND.plaqueBranch2Top, BAND.plaqueBranch2Bottom, screenHeight);
  const plaqueBranch3 = bandBox(BAND.plaqueBranch3Top, BAND.plaqueBranch3Bottom, screenHeight);

  const plaqueRow1 = bandBox(BAND.plaqueRow1Top, BAND.plaqueRow1Bottom, screenHeight);
  const plaqueRow2 = bandBox(BAND.plaqueRow2Top, BAND.plaqueRow2Bottom, screenHeight);
  const plaqueRow3 = bandBox(BAND.plaqueRow3Top, BAND.plaqueRow3Bottom, screenHeight);

  const plaqueWidth = screenWidth * PLAQUE_WIDTH_PCT;
  const plaqueHeight = screenHeight * PLAQUE_HEIGHT_PCT;
  const plaqueLeftX = screenWidth * PLAQUE_ROW_SIDE_FRACTION;
  const plaqueRightX = screenWidth - PLAQUE_ROW_SIDE_FRACTION * screenWidth - plaqueWidth;

  function renderPlaqueRow(row: { top: number; height: number }, key: string) {
    // Vertically centered inside the row band, since the band (6.3%) is
    // sized exactly to the plaque's own ruled height.
    const top = row.top + (row.height - plaqueHeight) / 2;
    return (
      <React.Fragment key={key}>
        <Image
          source={plaqueBase}
          resizeMode="contain"
          style={[styles.absolute, { top, left: plaqueLeftX, width: plaqueWidth, height: plaqueHeight }]}
        />
        <Image
          source={plaqueBase}
          resizeMode="contain"
          style={[styles.absolute, { top, left: plaqueRightX, width: plaqueWidth, height: plaqueHeight }]}
        />
      </React.Fragment>
    );
  }

  function renderPlaqueBranch(
    band: { top: number; height: number },
    transform: 'flipLeft' | 'scaleSmaller' | 'rotate',
  ) {
    // Each branch spans from the trunk out across the corridor above its
    // plaque row. Distinct transforms per instance so three uses of the same
    // asset don't read as an obviously repeated clip-art piece.
    const baseWidth = screenWidth * 0.62;
    const height = baseWidth / BRANCH_ASPECT;
    const top = band.top + band.height / 2 - height / 2;

    if (transform === 'flipLeft') {
      // Mirrored so the branch sweeps toward the LEFT edge instead of the
      // right — the stub (this asset's left edge) lands against the trunk's
      // left side once flipped.
      const left = trunkLeft - baseWidth * 0.72;
      return (
        <Image
          source={branchPlaque}
          resizeMode="contain"
          style={[
            styles.absolute,
            { top, left, width: baseWidth, height, transform: [{ scaleX: -1 }] },
          ]}
        />
      );
    }

    if (transform === 'scaleSmaller') {
      const width = baseWidth * 0.85;
      const h = width / BRANCH_ASPECT;
      const left = trunkLeft + trunkWidth * 0.5;
      return (
        <Image
          source={branchPlaque}
          resizeMode="contain"
          style={[styles.absolute, { top: band.top + band.height / 2 - h / 2, left, width, height: h }]}
        />
      );
    }

    // 'rotate'
    const left = trunkLeft + trunkWidth * 0.5;
    return (
      <Image
        source={branchPlaque}
        resizeMode="contain"
        style={[
          styles.absolute,
          { top, left, width: baseWidth, height, transform: [{ rotate: '-6deg' }] },
        ]}
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={silhouetteBg}
        resizeMode="cover"
        style={[styles.absolute, { top: 0, left: 0, width: screenWidth, height: screenHeight }]}
      />

      <Image
        source={trunkBare}
        resizeMode="contain"
        style={[
          styles.absolute,
          { top: screenHeight - trunkHeight, left: trunkLeft, width: trunkWidth, height: trunkHeight },
        ]}
      />

      {/* Left vine, right vine (mirrored) — open-corridor edges only, never the center. */}
      <Image
        source={vine}
        resizeMode="contain"
        style={[
          styles.absolute,
          { top: corridor.top, left: screenWidth * 0.02, width: vineWidth, height: vineHeight },
        ]}
      />
      <Image
        source={vine}
        resizeMode="contain"
        style={[
          styles.absolute,
          {
            top: corridor.top,
            left: screenWidth * 0.98 - vineWidth,
            width: vineWidth,
            height: vineHeight,
            transform: [{ scaleX: -1 }],
          },
        ]}
      />

      <Image
        source={branchPollyPerch}
        resizeMode="contain"
        style={[
          styles.absolute,
          {
            top: pollyBranch.top,
            left: trunkLeft + trunkWidth * 0.5,
            width: pollyBranchWidth,
            height: pollyBranchHeight,
          },
        ]}
      />

      {/* Plank stack — top-anchored. Plank 3 and plank 2 are nested behind
          plank 1 and offset down so only their bottom lip peeks out below
          it; plank 1 renders last (frontmost) and never moves. */}
      <Image
        source={plank23Plain}
        resizeMode="contain"
        style={[
          styles.absolute,
          {
            top: plank1.top + screenHeight * PLANK3_OFFSET_PCT,
            left: plankLeft,
            width: plankWidth,
            height: plankHeight,
          },
        ]}
      />
      <Image
        source={plank23Plain}
        resizeMode="contain"
        style={[
          styles.absolute,
          {
            top: plank1.top + screenHeight * PLANK2_OFFSET_PCT,
            left: plankLeft,
            width: plankWidth,
            height: plankHeight,
          },
        ]}
      />
      <Image
        source={plank1Nameplate}
        resizeMode="contain"
        style={[styles.absolute, { top: plank1.top, left: plankLeft, width: plankWidth, height: plankHeight }]}
      />

      {renderPlaqueBranch(plaqueBranch1, 'flipLeft')}
      {renderPlaqueRow(plaqueRow1, 'row1')}

      {renderPlaqueBranch(plaqueBranch2, 'scaleSmaller')}
      {renderPlaqueRow(plaqueRow2, 'row2')}

      {renderPlaqueBranch(plaqueBranch3, 'rotate')}
      {renderPlaqueRow(plaqueRow3, 'row3')}
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
});
