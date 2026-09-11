import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mask } from '../game/types';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ShardVariant } from '../ui/pwEffects';
import {
  gauntletLandSfx,
  gauntletTearSfx,
  playSfx,
  warmGauntletEntranceSfx,
} from '../audio/sfx';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';
import { FONTS } from '../constants/fonts';
import { heroBookMaterial } from '../ui/pwMaterials';
import {
  releaseGauntletMeasuredHeight,
  resolveActiveTileHeight,
  resolveGauntletRowHeight,
} from './tileTextLayout';
import { createBossGauntletPressProps } from './bossGauntletPress';
import {
  kickWall,
  resetWallShake,
  rumbleWall,
  wallShakeOffset,
  wallShakeTransform,
} from './wallShake';
import {
  BRICK_RECESSES,
  LEDGE_ART_Y,
  RECESS_OVERLAYS,
  SHELF_FACE_ART_BOTTOM,
  SHELF_FACE_ART_TOP,
  SHELF_LIP_ART_H,
  SHELF_LIP_ART_TOP,
  WALL_ART_W,
  resolveLedgeOffset,
  wallArtScale,
} from './bossGauntletLedge';

// Per-spine identity marker (2026-08-08 doc) — a single flat-silhouette
// crown asset (verified transparent, not a baked-in white background: all
// four corners decode to alpha 0, the crown shape itself to alpha 255),
// recolored per card via tintColor rather than three separate art files.
const crownMarkerArt = require('../../assets/images/gauntlet/crown-marker.png');
// The carved ledge's own foreground lip, cut from the wall art itself, so
// the bricks land BEHIND the shelf rather than on top of it.
const shelfLipArt = require('../../assets/images/gauntlet/shelf-front.png');

// Each sealed card IS one of the wall's own bricks — three distinct sprites,
// one per slot, so the row never reads as the same stone stamped three
// times. Every sprite is authored on the SAME recipe: TOP_FACE art-units of
// the brick's top surface, then faceH of its front face, then exactly
// TOP_FACE more of TRANSPARENT PADDING at the bottom. That bottom padding is
// load-bearing: it puts the padded image's own centre exactly on the centre
// of the brick's FRONT FACE, which is the point React Native rotates a view
// about. Never substitute an unpadded sprite and never trim the padding —
// the punch-out below would then swing about the wrong point.
const TOP_FACE = 46;
const BRICK_SPRITES = [
  { src: require('../../assets/images/gauntlet/brick1_rn.png'), w: 240, padH: 464, faceH: 372 },
  { src: require('../../assets/images/gauntlet/brick2_rn.png'), w: 240, padH: 477, faceH: 385 },
  { src: require('../../assets/images/gauntlet/brick3_rn.png'), w: 240, padH: 459, faceH: 367 },
] as const;

// The holes those bricks leave — one per slot, cut from the wall art at the
// RECESS_OVERLAYS rects so each one's outer bleed IS the surrounding wall and
// disappears into it. The shared wall itself is never cut: GraphicGround
// renders the intact StoneWall on every screen, and these appear only while
// the gauntlet is mounted.
const RECESS_ART = [
  require('../../assets/images/gauntlet/recess1.png'),
  require('../../assets/images/gauntlet/recess2.png'),
  require('../../assets/images/gauntlet/recess3.png'),
] as const;
// Three genuinely distinct hues, not three golds, so "which one is which"
// actually reads. Pulled from the app's own locked palette, not new colors.
export const CARD_MARKER_COLORS = [PW.color.gold, PW.color.rose, PW.color.lavender] as const;

type GauntletTile = { pairIndex: number; mask: Mask; isReal: boolean };

export type BossGauntletSpinesProps = {
  gatePhase: 'locked' | 'tiles' | 'wrongFail' | 'mastered';
  gauntletTiles: GauntletTile[];
  finalTileStates: Map<string, SwipeMaskState>;
  activeGauntletTile: GauntletTile | null;
  tileLanded: boolean;
  inputLocked: boolean;
  onPick: (index: number) => void;
  onSwipeUp: () => void;
  onSwipeRight: () => void;
  onEffect: (type: 'shard' | 'trail', x: number, y: number, variant?: ShardVariant) => void;
  onSwipeAttempt?: () => void;
  onCardTouch: () => void;
  // Optional to match SwipeMask's own wordY/intakeY (these are forwarded
  // straight through to it below) — undefined until MaskBoard's word zone
  // has actually been measured, rather than forwarding a guessed default.
  wordY?: number;
  intakeY?: number;
  correctCount: number;
  onActiveCardHeightChange?: (height: number) => void;
};

// Matches perform.onGauntletTileDrop's existing ~280ms landing timer
// (MaskBoard.tsx) — the flip should finish at roughly the same beat the
// tile becomes swipeable (tileLanded).
const SPINE_OPEN_MS = 280;

// ── Brick punch-out entrance ──────────────────────────────────
// The sealed cards are not faded in. Each one starts lying on its side,
// flush inside its own recess in the wall art, punches out toward the
// camera, swings upright and settles on the shelf. Opacity plays no part in
// it: a brick is a solid object leaving a real hole, so it is fully opaque
// from its first frame.
// Before anything moves, the wall trembles. Nothing about a brick changes in
// this window — it buys the break a moment of strain, so the bricks read as
// heavy stone coming out of a structure rather than sprites arriving on cue.
const BRICK_LEAD_IN_MS = 400;
const BRICK_STAGGER_MS = 240;
const BRICK_FLIGHT_MS = 900;
// One 0 -> 1 progress value per slot, driven as three sequenced legs: push
// out of the wall, travel and tip upright, settle onto the shelf.
const BRICK_SEG = [0.26, 0.86, 1];
const BRICK_SEG_MS = [234, 540, 126]; // 0.26 / 0.60 / 0.14 of BRICK_FLIGHT_MS
// Shared input range for every flight interpolation below — the leg
// boundaries, so each interpolation is read against the same three legs.
const BRICK_INPUT = [0, BRICK_SEG[0], BRICK_SEG[1], 1];
// Every crown arrives on ONE beat, after the last brick has settled.
// Index-independent by design: a third stagger here would read as three
// more events instead of the single identity reveal this is.
const BRICK_CROWN_DELAY_MS =
  BRICK_LEAD_IN_MS + 2 * BRICK_STAGGER_MS + BRICK_FLIGHT_MS + 120;
const BRICK_CROWN_MS = 460;
// Masks the brick's top face while it is still flush in the wall. React
// Native has no clip-path, so a flat rectangle in the recess's own shadow
// colour stands in for one, fading out as the brick clears the hole.
const RECESS_SHADOW = '#120C1F';
// Where the crown sits on the brick's front face, as a fraction of THAT
// face's height measured from its top — not of the padded sprite.
const CROWN_FACE_RATIO = 0.44;
const CROWN_W = 84;
const CROWN_H = 54;
// The one on-device tuning knob for the shelf lip: points added to its top
// edge, so it can be nudged without re-deriving the wall-art geometry.
export const SHELF_LIP_NUDGE_Y = 0;
// The same knob for the shelf label below it.
export const SHELF_LABEL_NUDGE_Y = 0;
// Fixed box for the label row, sized for its own 16px progress text rather
// than for the stone band it sits on, so the type can never be clipped by a
// band that scales with screen width.
const SHELF_LABEL_BOX_H = 22;

// Must stay > 1 — the angle spread below divides by (DUST_PARTICLE_COUNT - 1).
const DUST_PARTICLE_COUNT = 5;
const DUST_DURATION_MS = 420;
// Dusty tan-gray, deliberately distinct from pwEffects.ts's FX.shard palette
// (magic gem/crystal colors) — this is ambient stone debris, not the
// trap-shatter/gold-trail gameplay-feedback system, so it does not reuse it.
const DUST_COLOR = '#B8A98F';
// Deliberately NOT the widest brick that fits. 110 was that — the most three
// slots plus two gaps allow at 375pt inside MaskBoard's 14pt padding — and on
// device the row filled almost the whole screen width, and each brick grew by
// about two thirds between its hole and the shelf, which read as a brick
// GROWING rather than one coming toward the camera (device, 2026-09-10). At 96
// the row is 3 * 96 + 2 * ROW_GAP = 304pt wide with real margins, and the
// growth (1 / startScale, where startScale = recess width / face height) drops
// with it.
export const CARD_WIDTH = 96;
// The closed card is a brick standing on the shelf, so this is the tallest of
// the three brick FRONT FACES at CARD_WIDTH wide: brick2, 385 / 240 at 96 wide,
// = 154 exactly. DERIVED rather than typed in, because it has to move with
// CARD_WIDTH or the brick distorts — computing it from the same sprite table
// the bricks render from means the two cannot drift apart. The three faces end
// up marginally different heights inside this shared box, which is correct:
// they are different bricks.
export const CARD_CLOSED_HEIGHT = Math.ceil(
  Math.max(...BRICK_SPRITES.map(sprite => (CARD_WIDTH * sprite.faceH) / sprite.w)),
);
// Floor for the *opened* gauntletCard's measured height — matches the fixed
// tileHeight={200} SwipeMask is given below for gauntletCard mode. Kept
// separate from CARD_CLOSED_HEIGHT: the closed card is deliberately shorter
// than this, and using CARD_CLOSED_HEIGHT as the opened-card floor would
// undersize the row the instant something opens.
const GAUNTLET_CARD_OPEN_MIN_HEIGHT = 200;
// Starting point only, tuned against the ~144pt stone card the bricks later
// replaced; re-tune against CARD_CLOSED_HEIGHT on device if the pick flip reads
// wrong on a brick (same
// spirit as QuillScrollPanel.tsx's PANEL_PERSPECTIVE, which is explicitly
// NOT portable across panel sizes) — re-tune on device, not a lock.
const CARD_PERSPECTIVE = 700;
const ROW_VERTICAL_INSET = 6;
const ROW_GAP = 8; // must match styles.row.gap below — read by the centering math too

// The expanded SwipeMask (gauntletCard width, up to 300px) is centered
// within its OWN CARD_WIDTH-wide slot by default. For the outer slots that
// means it's centered on a point far from the row's actual midpoint — on a
// 3-tile row the left slot's card ends up centered over 100pt left of
// screen-center (104pt at CARD_WIDTH 96; it was 118 at the original 110),
// wide enough to clip off the left edge entirely (confirmed on device).
// This computes the horizontal correction so an opened/resolved card at any
// slot index re-centers on the ROW's own midpoint instead of its slot's,
// generalized over tile count (N) rather than hardcoded to 3, so it's also
// a no-op (0 offset) for the 1-tile Returning Haunt case, where a single
// slot is already centered on the full row width and needs no correction.
function centerOffsetX(index: number, tileCount: number): number {
  const contentWidth = tileCount * CARD_WIDTH + (tileCount - 1) * ROW_GAP;
  const slotCenter = index * (CARD_WIDTH + ROW_GAP) + CARD_WIDTH / 2;
  return contentWidth / 2 - slotCenter;
}

function StoneDustBurst({ onDone }: { onDone: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: DUST_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [progress, onDone]);

  return (
    <View pointerEvents="none" style={styles.dustWrap}>
      {Array.from({ length: DUST_PARTICLE_COUNT }).map((_, i) => {
        // Fan the particles out in a shallow upward arc from the landing point.
        const angle = -70 + i * (140 / (DUST_PARTICLE_COUNT - 1));
        const rad = (angle * Math.PI) / 180;
        const distance = 18 + (i % 2) * 6;
        const dx = Math.cos(rad) * distance;
        const dy = -Math.abs(Math.sin(rad) * distance) - 6;
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const opacity = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.85, 0] });
        const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] });
        return (
          <Animated.View
            key={i}
            style={[
              styles.dustParticle,
              { opacity, transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          />
        );
      })}
    </View>
  );
}

function SpineSlot({
  tile, index, offsetX, status, isOpen, anyOpen, tileLanded, inputLocked,
  entranceDelay, reduceMotion, progress, onPick, onSwipeUp, onSwipeRight,
  onEffect, onSwipeAttempt, onCardTouch, onMeasuredHeightChange,
  onLayoutExitComplete, wordY, intakeY, totalTiles, slotHeight,
}: {
  tile: GauntletTile;
  index: number;
  offsetX: number;
  // Owned by the parent, not by this slot: the recess overlay this value also
  // drives is part of the WALL, and renders in its own layer beneath the row.
  progress: Animated.Value;
  status: SwipeMaskState;
  isOpen: boolean;
  anyOpen: boolean;
  tileLanded: boolean;
  inputLocked: boolean;
  entranceDelay: number;
  reduceMotion: boolean;
  onPick: (index: number) => void;
  onSwipeUp: () => void;
  onSwipeRight: () => void;
  onEffect: BossGauntletSpinesProps['onEffect'];
  onSwipeAttempt?: () => void;
  onCardTouch: () => void;
  onMeasuredHeightChange: (maskId: string, height: number) => void;
  onLayoutExitComplete: (maskId: string) => void;
  wordY?: number;
  intakeY?: number;
  totalTiles: number;
  slotHeight: number;
}) {
  const openAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  // `progress` (a prop) drives the whole punch-out — position, rotation,
  // scale, the top-face mask, the contact shadow and the wall's own recess
  // overlay all read off it, so the brick and the hole it leaves can never
  // come apart mid-flight.
  const crownReveal = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();
  const [showLandingDust, setShowLandingDust] = useState(false);
  // Sound and dust are ONE event: the landing cue fires from the very callback
  // that raises the dust, so neither can drift from the other.
  const onEntranceSettled = useCallback(() => {
    setShowLandingDust(true);
    playSfx(gauntletLandSfx(index));
  }, [index]);
  // Stable identity across re-renders — StoneDustBurst's effect depends on
  // this callback, and an inline arrow at the JSX call site would give it a
  // fresh identity on every SpineSlot re-render (e.g. from
  // onMeasuredHeightChange/tileLanded/inputLocked prop churn), restarting
  // the ~420ms dust animation mid-flight instead of letting it finish once.
  const onDustBurstDone = useCallback(() => setShowLandingDust(false), []);
  const measuredHeightRef = useRef(GAUNTLET_CARD_OPEN_MIN_HEIGHT);

  const sprite = BRICK_SPRITES[index % BRICK_SPRITES.length];
  const recess = BRICK_RECESSES[index % BRICK_RECESSES.length];
  // All of the entrance's geometry, resolved once per width. Wall art space
  // and screen points meet here and nowhere else: recess coordinates are
  // wall-art units (wallArtScale), sprite measurements are art units of the
  // brick's own image (CARD_WIDTH / sprite.w), and everything returned is
  // screen points.
  const brick = useMemo(() => {
    const S = wallArtScale(windowWidth);
    const spriteScale = CARD_WIDTH / sprite.w;
    const faceH = sprite.faceH * spriteScale;
    const topFaceH = TOP_FACE * spriteScale;
    const recessCx = ((recess.x0 + recess.x1) / 2) * S;
    const recessCy = ((recess.y0 + recess.y1) / 2) * S;
    const recessW = (recess.x1 - recess.x0) * S;
    // The card's resting bottom sits ON the ledge line — that is what this
    // component's bottom-anchored wrap already guarantees — so both the card
    // and the recess are measured against that same line, negative meaning
    // above it.
    //
    // offsetX (centerOffsetX) is how far LEFT of screen centre this slot
    // sits, so the slot's own centre is screen centre MINUS it.
    const cardCentreX = windowWidth / 2 - offsetX;
    const cardCentreY = -(faceH / 2);
    const recessCentreY = -((LEDGE_ART_Y * S) - recessCy);
    return {
      faceH,
      topFaceH,
      spriteH: sprite.padH * spriteScale,
      // The mask covers the top face plus a two-unit bleed, so no lit pixel
      // of the brick's top surface survives at the seam.
      capH: (TOP_FACE + 2) * spriteScale,
      // Top of the padded sprite box within the slot, placed so the FRONT
      // FACE's bottom edge lands on the card's bottom edge. The transparent
      // padding then overhangs the card's bottom by exactly topFaceH.
      spriteTop: CARD_CLOSED_HEIGHT - faceH - topFaceH,
      startDX: recessCx - cardCentreX,
      startDY: recessCentreY - cardCentreY,
      // Lying on its side, the brick's face height spans the recess's width.
      startScale: recessW / faceH,
      // A small wall-scaled drift so the push-out reads as coming toward the
      // camera rather than sliding along the wall.
      driftY: 20 * S,
    };
  }, [windowWidth, offsetX, sprite, recess]);

  const resolved = status !== 'idle';
  // Open (or resolved) cards render wider than their CARD_WIDTH slot (see
  // SwipeMask's gauntletCard width), so they must paint above sibling
  // slots — otherwise a neighbor's opaque sealed panel occludes the
  // overflow and its full-slot Pressable steals touches meant for it.
  // isOpen and "merely resolved" get DIFFERENT elevation levels (not a
  // shared one) — picking is player-driven, so a resolved-but-inactive
  // slot and a newly-opened slot routinely coexist (e.g. resolve tile 2,
  // then pick tile 0), and a zIndex tie between them resolves by render
  // order, not by which one is actually interactive. isOpen must always
  // win that tie regardless of array index.
  const elevated = isOpen || resolved;

  const handleMeasuredHeightChange = useCallback((maskId: string, measuredHeight: number) => {
    const height = resolveActiveTileHeight(measuredHeight, GAUNTLET_CARD_OPEN_MIN_HEIGHT);
    measuredHeightRef.current = height;
    if (isOpen) onMeasuredHeightChange(maskId, height);
  }, [isOpen, onMeasuredHeightChange]);

  // All gauntlet SwipeMasks stay mounted behind their sealed spines. A long
  // phrase may therefore finish layout before its slot becomes active and
  // never emit another onLayout solely because the seal opens. Relay that
  // exact keyed measurement at activation so the row grows before paint.
  useLayoutEffect(() => {
    if (!isOpen) return;
    onMeasuredHeightChange(tile.mask.id, measuredHeightRef.current);
  }, [isOpen, onMeasuredHeightChange, tile.mask.id]);

  useEffect(() => {
    // The parent collapses a still-unresolved preference (null) into `true`
    // with `reduceMotion !== false`, so this branch also covers "not known
    // yet": the bricks are simply already standing on the shelf with their
    // crowns on, and no dust fires. A later resolved `false` re-runs this
    // effect and resets below, so the entrance is deferred, never skipped.
    if (reduceMotion !== false) {
      progress.setValue(1);
      crownReveal.setValue(1);
      return;
    }
    progress.setValue(0);
    crownReveal.setValue(0);
    const flightTimer = setTimeout(() => {
      // The kick IS this brick tearing loose, so it fires on the same frame
      // the push-out starts — never ahead of it. So does its sound: strictly
      // by slot, brick 1 with stone_tear_1 and so on, never shuffled.
      kickWall();
      playSfx(gauntletTearSfx(index));
      Animated.sequence([
        // Push out of the wall.
        Animated.timing(progress, {
          toValue: BRICK_SEG[0],
          duration: BRICK_SEG_MS[0],
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Travel to the shelf, tipping upright on the way.
        Animated.timing(progress, {
          toValue: BRICK_SEG[1],
          duration: BRICK_SEG_MS[1],
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        // Settle, with a short overshoot so it lands rather than arrives.
        Animated.timing(progress, {
          toValue: BRICK_SEG[2],
          duration: BRICK_SEG_MS[2],
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        // Dust belongs to THIS slot's own settle, not to the row's.
        if (finished) onEntranceSettled();
      });
    }, entranceDelay);
    const crownTimer = setTimeout(() => {
      Animated.timing(crownReveal, {
        toValue: 1,
        duration: BRICK_CROWN_MS,
        easing: Easing.out(Easing.back(2.2)),
        useNativeDriver: true,
      }).start();
    }, BRICK_CROWN_DELAY_MS);
    return () => {
      clearTimeout(flightTimer);
      clearTimeout(crownTimer);
    };
  }, [entranceDelay, reduceMotion, progress, crownReveal, onEntranceSettled, index]);

  useEffect(() => {
    const target = isOpen || resolved ? 1 : 0;
    if (reduceMotion !== false) {
      openAnim.setValue(target);
      return;
    }
    Animated.timing(openAnim, {
      toValue: target,
      duration: SPINE_OPEN_MS,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resolved, reduceMotion]);

  // The closed card turns edge-on (never past it — no mirrored "back" is
  // ever shown, so there's nothing here for backface-visibility to hide).
  // This reuses QuillScrollPanel.tsx's proven roll trick instead of the
  // literal two-sided-flip CSS references Pete looked at for the vibe:
  // this app has a confirmed, documented Android bug with
  // backfaceVisibility:'hidden' (HeroBook.tsx's cover-inner pane), so the
  // flip is built to never depend on it at all. See the design doc's "Flip
  // mechanism" section.
  const closedRotateY = openAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  // A still-closed sibling (never picked, while a DIFFERENT tile is active)
  // was relying on the open card's zIndex to visually cover it — but the
  // open card doesn't cover every pixel of it (it's centered on the row,
  // not stretched over the whole thing), so a sliver of the closed sibling's
  // own gold border/fill kept showing past the open card's edge (confirmed
  // via screenshot, 2026-08-15 — Pete: "an outline... outside of the
  // card," visible even after the shadow-only fix above). Forcing this
  // card fully invisible the instant ANY sibling opens — not just when it
  // opens itself — removes the leftover pixels directly instead of hoping
  // stacking order hides them.
  const closedOpacity = (anyOpen && !isOpen)
    ? 0
    : openAnim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0, 0] });
  const contentOpacity = openAnim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] });

  // ── The punch-out itself ──────────────────────────────────────
  // A plain 2D Z rotation is the whole trick: the brick lies horizontally in
  // its recess at -90deg and spins upright to 0 on the way to the shelf.
  const brickRotate = progress.interpolate({
    inputRange: BRICK_INPUT,
    outputRange: ['-90deg', '-90deg', '4deg', '0deg'],
  });
  const brickScale = progress.interpolate({
    inputRange: BRICK_INPUT,
    outputRange: [brick.startScale, brick.startScale * 1.09, 1.055, 1],
  });
  const brickTranslateX = progress.interpolate({
    inputRange: BRICK_INPUT,
    outputRange: [brick.startDX, brick.startDX * 0.94, 0, 0],
  });
  const brickTranslateY = progress.interpolate({
    inputRange: BRICK_INPUT,
    outputRange: [brick.startDY, brick.startDY + brick.driftY, 0, 0],
  });
  // Stands in for a clip-path: while the brick is flush in the wall its top
  // face must not read, and it uncovers as the brick clears the hole.
  const capOpacity = progress.interpolate({
    inputRange: [0, 0.1, 0.3, 1],
    outputRange: [1, 1, 0, 0],
  });
  // Contact shadow — arrives only over the last third of the flight, as the
  // brick comes down onto the shelf.
  const contactShadowOpacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 0, 0.55],
  });
  const crownOpacity = crownReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  // Deliberately NOT clamped — Easing.back overshoots past 1, and that
  // overshoot is the small pop the crown lands with.
  const crownScale = crownReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  // A brick still SEATED in the wall rattles with the wall — otherwise it
  // would appear to slide out of its own socket during the lead-in. A brick
  // that has torn loose is no longer part of the structure and stops dead.
  // This falls to zero over exactly the sliver of progress the recess overlay
  // fades in on, so the brick and the hole behind it hand off cleanly.
  const seatedInWall = progress.interpolate({
    inputRange: [0, 0.06, 1],
    outputRange: [1, 0, 0],
  });
  const seatedShake = wallShakeOffset(seatedInWall);

  // A closed, unopened, unresolved slot's hit target should never capture
  // touches meant for whichever OTHER slot is currently open — its own
  // card can be picked only while nothing else is active anyway
  // (useBoardMechanics.pickGauntletTile no-ops once a tile is active), so
  // there's no functional loss in going fully inert here.
  const closedHitInert = resolved || anyOpen;
  const pressProps = createBossGauntletPressProps(
    index,
    closedHitInert || inputLocked,
    onPick,
  );

  return (
    <View style={[
      styles.slot,
      { height: slotHeight },
      isOpen ? styles.slotOpen : elevated && styles.slotElevated,
    ]}>
      {/* Contact shadow on the shelf. A painted ellipse, never an RN shadow
          — see the note on styles.card below. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.contactShadow,
          { opacity: Animated.multiply(contactShadowOpacity, closedOpacity) },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.card,
          // No RN shadow on this view, ever. RN/iOS shadows are computed
          // from the layer's bounding box independently of animated
          // `opacity`, so a shadow left here kept casting a faint
          // rounded-rect "ghost" outline behind the opened card even once
          // this view had faded to opacity 0 and turned edge-on (confirmed
          // on device, 2026-08-15 — Pete: "there's a trace... on kind of an
          // angle"), and the same bleed came from still-closed SIBLINGS,
          // whose own shadow showed past the edge of the card overlapping
          // them (screenshot, 2026-08-15 — Pete: "a different outline...
          // outside of the card"). styles.cardShadow survives only as the
          // record of that; it is deliberately not applied to anything.
          {
            top: brick.spriteTop,
            height: brick.spriteH,
            opacity: closedOpacity,
            // Order matters: the brick is scaled, then rotated about its own
            // front-face centre, then translated in the parent's unrotated
            // space. The rotateY flip after it is the PICK animation and
            // stays exactly where it was — the entrance always finishes
            // before a pick is possible, so the two never overlap.
            transform: [
              { translateX: Animated.add(brickTranslateX, seatedShake.x) },
              { translateY: Animated.add(brickTranslateY, seatedShake.y) },
              { rotate: brickRotate },
              { scale: brickScale },
              { perspective: CARD_PERSPECTIVE },
              { rotateY: closedRotateY },
            ],
          },
        ]}
      >
        <Image
          source={sprite.src}
          contentFit="contain"
          style={StyleSheet.absoluteFill}
        />
        {/* The recess mask — covers the brick's top face while it is still
            flush in the wall, so the hole reads as a hole. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.recessCap, { height: brick.capH, opacity: capOpacity }]}
        />
        {/* The crown is the only content on the face, and the only thing
            that distinguishes the three choices. It arrives on its own beat,
            after every brick has landed. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.cardMarker,
            {
              top: brick.topFaceH + brick.faceH * CROWN_FACE_RATIO - CROWN_H / 2,
              opacity: crownOpacity,
              transform: [{ scale: crownScale }],
            },
          ]}
        >
          <Image
            source={crownMarkerArt}
            contentFit="contain"
            tintColor={CARD_MARKER_COLORS[index % CARD_MARKER_COLORS.length]}
            style={styles.crownImage}
          />
        </Animated.View>
      </Animated.View>

      {showLandingDust && (
        <StoneDustBurst onDone={onDustBurstDone} />
      )}

      {/* Closed hit target — sits on top while sealed, stops intercepting
          touches once open (or once ANY sibling is open) so it never fights
          SwipeMask's own gesture or steals touches from an overflowing
          neighbor's open card. */}
      <Pressable
        pointerEvents={closedHitInert ? 'none' : 'auto'}
        {...pressProps}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Sealed tile ${index + 1} of ${totalTiles}`}
        accessibilityHint="Activate to open this tile"
        accessibilityState={{ disabled: closedHitInert || inputLocked }}
        style={StyleSheet.absoluteFill}
      />

      {/* Closed/unopened/unresolved slots must be fully invisible to
          assistive tech — SwipeMask always sets accessibilityLabel to the
          real tile phrase regardless of opacity/pointerEvents, and exposing
          that before the player commits would leak Hidden Truth content. */}
      <Animated.View
        // Only the currently-open slot needs to stay hit-testable — once a
        // slot is resolved and no longer open, its judgment is locked in,
        // so it has nothing left to receive touches for. Leaving it
        // 'box-none' let a resolved (inert) card sitting on top of the
        // open one (see slotOpen/slotElevated above) steal the open
        // card's touches even after this component's zIndex split.
        pointerEvents={isOpen ? 'box-none' : 'none'}
        accessibilityElementsHidden={!(isOpen || resolved)}
        importantForAccessibility={isOpen || resolved ? 'auto' : 'no-hide-descendants'}
        style={[styles.openContent, { opacity: contentOpacity, transform: [{ translateX: offsetX }] }]}
      >
        <SwipeMask
          key={tile.mask.id}
          mask={tile.mask}
          state={status}
          onSwipeUp={onSwipeUp}
          onSwipeDown={onSwipeRight}
          onSwipeReveal={() => {}}
          revealable={false}
          disabled={inputLocked || (!resolved && !(isOpen && tileLanded))}
          gauntletCard
          tileHeight={GAUNTLET_CARD_OPEN_MIN_HEIGHT}
          entryDelay={0}
          onEffect={onEffect}
          onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
          onPressHoldStart={() => playSfx('pressHoldStart')}
          onExitComplete={() => onLayoutExitComplete(tile.mask.id)}
          onCardTouch={onCardTouch}
          onMeasuredHeightChange={handleMeasuredHeightChange}
          wordY={wordY}
          intakeY={intakeY}
        />
      </Animated.View>
    </View>
  );
}

export function BossGauntletSpines({
  gatePhase, gauntletTiles, finalTileStates, activeGauntletTile,
  tileLanded, inputLocked, onPick, onSwipeUp, onSwipeRight,
  onEffect, onSwipeAttempt, onCardTouch, wordY, intakeY, correctCount,
  onActiveCardHeightChange,
}: BossGauntletSpinesProps) {
  const activeMaskId = activeGauntletTile?.mask.id ?? null;
  const activeMaskIdRef = useRef<string | null>(activeMaskId);
  const [measuredCardHeights, setMeasuredCardHeights] = useState(
    () => new Map<string, number>(),
  );
  activeMaskIdRef.current = activeMaskId;

  const handleActiveCardHeightChange = useCallback((maskId: string, measuredHeight: number) => {
    if (activeMaskIdRef.current !== maskId) return;
    const height = resolveActiveTileHeight(measuredHeight, GAUNTLET_CARD_OPEN_MIN_HEIGHT);
    setMeasuredCardHeights(previous => {
      if (previous.get(maskId) === height) return previous;
      const next = new Map(previous);
      next.set(maskId, height);
      return next;
    });
  }, []);

  const handleLayoutExitComplete = useCallback((maskId: string) => {
    setMeasuredCardHeights(previous => releaseGauntletMeasuredHeight(previous, maskId));
  }, []);

  const anyOpen = activeGauntletTile !== null;
  // Explicit CARD_CLOSED_HEIGHT floor (not the helper's own 200 default):
  // before anything's picked, measuredCardHeights is empty and the row
  // should hug the small closed cards, not reserve space for an opened
  // card nothing has grown into yet. Any *real* measured entry already
  // carries its own GAUNTLET_CARD_OPEN_MIN_HEIGHT floor from
  // handleActiveCardHeightChange above, so this never undersizes an
  // actually-open card.
  const activeCardHeight = resolveGauntletRowHeight(measuredCardHeights, CARD_CLOSED_HEIGHT);
  const reduceMotion = useReducedMotionPreference();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // One punch-out progress value per slot, owned HERE rather than inside
  // SpineSlot. Each brick's hole is part of the wall, not part of its card,
  // so the overlays render as their own layer beneath the row — outside the
  // slot that drives them. Grown lazily and never shrunk; MaskBoard keys this
  // component per gauntlet (gauntletThrowKey), so every run gets fresh values
  // and no hole state outlives the gauntlet that opened it.
  const brickProgressRef = useRef<Animated.Value[]>([]);
  while (brickProgressRef.current.length < gauntletTiles.length) {
    brickProgressRef.current.push(new Animated.Value(0));
  }
  const brickProgress = brickProgressRef.current;
  // GameScreen.tsx renders the wall art (AmbientSkyBackground, with the
  // carved ledge this offset targets) as a direct child of the screen,
  // reaching its true bottom edge — but this component now renders inside
  // GameScreen's <SafeAreaView> (no `edges` override), which insets its own
  // frame's bottom by the device's home-indicator/gesture-nav inset. The two
  // views' `bottom` therefore mean different things; subtract the inset here,
  // where the two coordinate frames actually meet, so the stones still land
  // on the ledge as painted rather than floating above it by that amount.
  const ledgeOffset = resolveLedgeOffset(windowWidth) - insets.bottom;
  // The shelf lip is a slice of that same wall art, so it needs no
  // measurement either: full screen width, its own aspect ratio, and its top
  // edge a fixed art-space distance above the ledge line the wrap's bottom
  // already sits on.
  const wallScale = wallArtScale(windowWidth);
  const shelfLipHeight = windowWidth * (SHELF_LIP_ART_H / WALL_ART_W);
  const shelfLipTop = (LEDGE_ART_Y - SHELF_LIP_ART_TOP) * wallScale + SHELF_LIP_NUDGE_Y;
  // Centre of the lip's front face, in points BELOW the ledge line the wrap's
  // bottom sits on. The label rides there.
  const shelfFaceCentre =
    ((SHELF_FACE_ART_TOP + SHELF_FACE_ART_BOTTOM) / 2 - LEDGE_ART_Y) * wallScale +
    SHELF_LABEL_NUDGE_Y;

  useEffect(() => {
    onActiveCardHeightChange?.(activeCardHeight);
  }, [activeCardHeight, onActiveCardHeightChange]);

  // The lead-in tremble, once, the moment the tiles actually appear — not on
  // mount, which can happen a phase early. Under reduced motion the bricks are
  // already standing on the shelf, so there is nothing to shake loose and both
  // values are held at 0.
  //
  // This must stay in step with the conditional return below, which is spelled
  // out longhand there because tileTextLayout.integration.test.mjs matches it
  // literally to prove no hook is ever added after it.
  const tilesVisible = gatePhase === 'tiles' || gatePhase === 'wrongFail';
  // Once per gauntlet. MaskBoard keys this component per gauntlet, so the ref
  // starts false for each one and nothing inside a gauntlet can replay the thud.
  const landingThudPlayedRef = useRef(false);
  useEffect(() => {
    if (!tilesVisible) return;
    if (reduceMotion !== false) {
      resetWallShake();
      // Reduce motion still hears the bricks ARRIVE: one landing thud — one,
      // not one per brick, and no rumble and no tears, because nothing moved
      // and nothing tore (Pete, 2026-09-10). Fired here in the parent, never
      // from a slot, so it cannot multiply by the brick count.
      //
      // useReducedMotionPreference starts EVERY mount at null and resolves
      // asynchronously, so this branch runs first with null on every gauntlet,
      // reduce motion or not. Two things follow:
      //  - the thud waits for a KNOWN `true`. Played on null, every player with
      //    motion ON would hear a thud and then the whole entrance after it;
      //  - the null run is a free head start, so the landing cue is warmed here,
      //    before the preference resolves, rather than in the same breath as
      //    the play (which would gain nothing — the gateway just queues a play
      //    until its player loads). warmGauntletEntranceSfx is the only warm in
      //    reach; at a tile count of 1 it also warms the rumble and first tear,
      //    which a motion player needs moments later anyway.
      warmGauntletEntranceSfx(1);
      if (reduceMotion === true && !landingThudPlayedRef.current) {
        landingThudPlayedRef.current = true;
        playSfx('stoneLand1');
      }
      return;
    }
    // Warm the full set: the tears (400ms+) and landings (1300ms+) then have a
    // real player waiting. The null run above already started the rumble,
    // first tear and first land, so the rumble's first play now waits only on
    // whatever part of its native load the preference's resolution did not
    // already cover. How much that is on a cold start is unmeasured — CONTEXT.md
    // Next Work item 10 stays open.
    warmGauntletEntranceSfx(gauntletTiles.length);
    rumbleWall(BRICK_LEAD_IN_MS);
    playSfx('stoneRumble');
  }, [tilesVisible, reduceMotion, gauntletTiles.length]);

  // The shake values are module-level and outlive this component. Leaving one
  // stranded mid-animation would sit the wall crooked on the next screen.
  useEffect(() => resetWallShake, []);

  if (gatePhase !== 'tiles' && gatePhase !== 'wrongFail') return null;

  return (
    <View style={[styles.wrap, { bottom: ledgeOffset }]} pointerEvents="box-none">
      {/* The holes. Part of the WALL, not of any card — so they live in their
          own layer beneath the row and take no part in a brick's animated
          transform. Positioned in wall art space off the same ledge line the
          wrap's bottom already sits on, and widened from the wrap's centre
          (screen centre) because the wrap is inset by MaskBoard's padding.
          Each one fades in over the first sliver of its own brick's push-out,
          UNDERNEATH that brick, which covers its recess completely while
          flush — so the swap from wall brick to hole is never visible as a
          pop. They leave with the gauntlet; no hole state is persisted. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.recessLayer,
          {
            width: windowWidth,
            marginLeft: -windowWidth / 2,
            // Painted on the wall, so it moves with the wall — otherwise the
            // holes slide out of their own sockets during the tremble.
            transform: wallShakeTransform(),
          },
        ]}
      >
        {gauntletTiles.map((tile, index) => {
          const overlay = RECESS_OVERLAYS[index % RECESS_OVERLAYS.length];
          return (
            <Animated.View
              key={tile.mask.id}
              style={[
                styles.recessOverlay,
                {
                  left: overlay.x * wallScale,
                  width: overlay.w * wallScale,
                  height: overlay.h * wallScale,
                  bottom: (LEDGE_ART_Y - (overlay.y + overlay.h)) * wallScale,
                  opacity: brickProgress[index].interpolate({
                    inputRange: [0, 0.06, 1],
                    outputRange: [0, 1, 1],
                  }),
                },
              ]}
            >
              <Image
                source={RECESS_ART[index % RECESS_ART.length]}
                contentFit="fill"
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          );
        })}
      </Animated.View>

      <View
        // Fixed, not activeCardHeight-driven: this whole wrap is
        // bottom-anchored (see styles.wrap above), so a height that grows
        // when a card opens pushes everything ABOVE it (the header)
        // upward instead of extending downward — a visible jump every time
        // a tile is picked. The opened card already paints through
        // SpineSlot's absolutely-positioned openContent layer, which
        // overflows this box's bounds on its own, so the row itself only
        // ever needs to reserve the closed-card footprint.
        style={[styles.row, { height: CARD_CLOSED_HEIGHT + ROW_VERTICAL_INSET }]}
        pointerEvents="box-none"
      >
        {gauntletTiles.map((tile, index) => (
        <SpineSlot
          key={tile.mask.id}
          tile={tile}
          index={index}
          offsetX={centerOffsetX(index, gauntletTiles.length)}
          status={finalTileStates.get(tile.mask.id) ?? 'idle'}
          isOpen={activeGauntletTile?.mask.id === tile.mask.id}
          anyOpen={anyOpen}
          tileLanded={tileLanded}
          inputLocked={inputLocked}
          entranceDelay={BRICK_LEAD_IN_MS + index * BRICK_STAGGER_MS}
          reduceMotion={reduceMotion !== false}
          progress={brickProgress[index]}
          onPick={onPick}
          onSwipeUp={onSwipeUp}
          onSwipeRight={onSwipeRight}
          onEffect={onEffect}
          onSwipeAttempt={onSwipeAttempt}
          onCardTouch={onCardTouch}
          onMeasuredHeightChange={handleActiveCardHeightChange}
          onLayoutExitComplete={handleLayoutExitComplete}
          wordY={wordY}
          intakeY={intakeY}
          totalTiles={gauntletTiles.length}
          slotHeight={measuredCardHeights.get(tile.mask.id) ?? CARD_CLOSED_HEIGHT}
        />
        ))}
      </View>

      {/* The ledge's own foreground lip, rendered LAST so the bricks land
          BEHIND the shelf rather than on top of it. It must span the full
          screen width, but this wrap is inset by MaskBoard's container
          padding — so the lip is re-widened from the wrap's CENTRE, which is
          screen centre, rather than from its edges. It also hangs well below
          the wrap's own bottom (the art runs to the wall's bottom row),
          which is why styles.wrap must not clip. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shelfLip,
          {
            width: windowWidth,
            marginLeft: -windowWidth / 2,
            height: shelfLipHeight,
            bottom: shelfLipTop - shelfLipHeight,
            // Cut from the wall art, so it is wall: it moves with it.
            transform: wallShakeTransform(),
          },
        ]}
      >
        <Image source={shelfLipArt} contentFit="fill" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* CHOOSE A SEAL rides the shelf's front face, not the space above the
          row. The bricks are ~48pt taller than the stone cards they replaced,
          which left no clear gap between the book and the brick tops — the
          label was squeezed from both sides and unreadable (device,
          2026-09-10 — Pete: "it cuts that out"). The lip's front face is
          empty carved stone directly under the cards, measured off the lip
          art in bossGauntletLedge.ts. Rendered AFTER the lip so the lip does
          not paint over it. */}
      <Animated.View
        style={[
          styles.shelfLabel,
          {
            width: windowWidth,
            marginLeft: -windowWidth / 2,
            height: SHELF_LABEL_BOX_H,
            bottom: -(shelfFaceCentre + SHELF_LABEL_BOX_H / 2),
            // Its position is derived from the shelf face in wall art space,
            // so it rides the wall too. Left still, it would visibly slide
            // across the stone it is meant to be cut into.
            transform: wallShakeTransform(),
          },
        ]}
        pointerEvents="none"
        accessible
        accessibilityLabel={`Choose a seal. ${correctCount} of ${gauntletTiles.length} correct.`}
      >
        <Text style={styles.instruction}>CHOOSE A SEAL</Text>
        <Text style={styles.progress}>{correctCount}/{gauntletTiles.length}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // The shelf lip hangs far below this wrap's own bottom (its art runs to
    // the bottom row of the wall), and a brick in flight swings well outside
    // its slot, so this must never clip its children.
    overflow: 'visible',
  },
  // Absolutely positioned below the wrap's bottom (the ledge line), centred on
  // the lip's front face. Re-widened to the screen from the wrap's centre, the
  // same way the lip itself is, because the wrap is inset by MaskBoard's
  // container padding.
  shelfLabel: {
    position: 'absolute',
    left: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  instruction: {
    color: PW.color.softWhite,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 2,
  },
  progress: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: ROW_GAP,
    paddingTop: ROW_VERTICAL_INSET,
    // A brick lying on its side spans further than its own slot, and starts
    // from a recess that is not above its slot at all — neither this row nor
    // a slot may clip during the flight.
    overflow: 'visible',
  },
  slot: {
    width: CARD_WIDTH,
    overflow: 'visible',
  },
  // Applied to a resolved-but-not-open slot so its overflowing
  // gauntletCard-width SwipeMask paints above sibling sealed spines
  // instead of being occluded by them (finding 2). Deliberately ONE
  // level below slotOpen — a resolved slot must never win a stacking
  // tie against whichever slot the player currently has open (finding 3).
  slotElevated: {
    zIndex: PW.z.activeCard - 1,
    elevation: PW.z.activeCard - 1,
  },
  // Applied to whichever slot is currently open. Strictly higher than
  // slotElevated so the open card always paints/hit-tests above a
  // resolved sibling in their overlap region, regardless of which one
  // has the higher array index (finding 3).
  slotOpen: {
    zIndex: PW.z.activeCard,
    elevation: PW.z.activeCard,
  },
  // Height and top are set inline per slot (see `brick` above): this box is
  // the PADDED sprite, not the card, so its own centre lands on the centre
  // of the brick's front face — the point React Native rotates about. It
  // deliberately does not clip; the transparent padding overhangs the card's
  // bottom edge by design.
  card: {
    position: 'absolute',
    left: 0,
    width: CARD_WIDTH,
  },
  // NOT applied to anything — kept only as the record of the "shadow ghost"
  // bug documented on `card` above, so nobody re-adds an RN shadow here.
  // The brick's depth comes from styles.contactShadow instead.
  cardShadow: {
    // iOS-only shadow props deliberately, NOT PW.shadow.card (which sets
    // Android `elevation`) — this component already has a carefully tuned
    // zIndex/elevation scheme on the parent `slot` (see slotOpen/
    // slotElevated above, fixing a real touch-stealing bug); a second
    // elevation value on this nested child risks reopening that. Same
    // constraint the old spine style noted.
    shadowColor: PW.color.shadow,
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  cardFace: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recessCap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: RECESS_SHADOW,
  },
  contactShadow: {
    position: 'absolute',
    left: -7,
    width: CARD_WIDTH + 14,
    // Straddles the ledge line so roughly half of it still reads above the
    // shelf lip drawn in front of the row.
    top: CARD_CLOSED_HEIGHT - 13,
    height: 16,
    borderRadius: 8,
    backgroundColor: PW.color.shadow,
  },
  shelfLip: {
    position: 'absolute',
    left: '50%',
  },
  // Spans the wrap's full height and is re-widened to the screen from its
  // centre; each overlay inside is then placed by `bottom` off the wrap's
  // bottom edge, which is the wall's own ledge line.
  recessLayer: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
  },
  recessOverlay: {
    position: 'absolute',
  },
  // No "SEALED" label anymore — the crown is the only content, so it can
  // take up most of the card instead of sharing space with text (Pete,
  // 2026-08-15: "just the crowns as big as they go").
  // Horizontally centred on the card; its vertical centre is placed inline
  // at CROWN_FACE_RATIO down the brick's own front face, which differs
  // slightly per sprite.
  cardMarker: {
    position: 'absolute',
    left: (CARD_WIDTH - CROWN_W) / 2,
    width: CROWN_W,
    height: CROWN_H,
  },
  crownImage: {
    width: '100%',
    height: '100%',
  },
  dustWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: CARD_CLOSED_HEIGHT - 12,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dustParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DUST_COLOR,
  },
  openContent: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
