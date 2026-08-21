import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Mask } from '../game/types';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ShardVariant } from '../ui/pwEffects';
import { playSfx } from '../audio/sfx';
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

// Per-spine identity marker (2026-08-08 doc) — a single flat-silhouette
// crown asset (verified transparent, not a baked-in white background: all
// four corners decode to alpha 0, the crown shape itself to alpha 255),
// recolored per card via tintColor rather than three separate art files.
const crownMarkerArt = require('../../assets/images/gauntlet/crown-marker.png');
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
// Sized against MaskBoard's own container padding (14px each side) so 3
// slots + 2 gaps fit on the narrowest realistic target width (375pt)
// without guessing: (375 - 14*2 - 8*2) / 3 = 110.3, floored to 110.
export const CARD_WIDTH = 110;
// Card-shaped, not spine-shaped: the old standing spine ran 110x200 (a
// 1:1.8 width:height ratio) and read as "a stick" on device (Pete,
// 2026-08-15) — the fix isn't new art, it's a shorter box. This lands much
// closer to a real card proportion, and closer to the *opened* gauntletCard
// shape (300x200, wider than tall — see SwipeMask.tsx), so picking a card
// grows one shape into a same-family bigger shape instead of a tall sliver
// morphing into a squat one. See
// docs/superpowers/specs/2026-08-15-gauntlet-card-flip-design.md.
export const CARD_CLOSED_HEIGHT = 144;
// Floor for the *opened* gauntletCard's measured height — matches the fixed
// tileHeight={200} SwipeMask is given below for gauntletCard mode. Kept
// separate from CARD_CLOSED_HEIGHT: the closed card is deliberately shorter
// than this, and using CARD_CLOSED_HEIGHT as the opened-card floor would
// undersize the row the instant something opens.
const GAUNTLET_CARD_OPEN_MIN_HEIGHT = 200;
// Starting point only, tuned against this card's own ~144px height (same
// spirit as QuillScrollPanel.tsx's PANEL_PERSPECTIVE, which is explicitly
// NOT portable across panel sizes) — re-tune on device, not a lock.
const CARD_PERSPECTIVE = 700;
const ROW_VERTICAL_INSET = 6;
const ROW_GAP = 8; // must match styles.row.gap below — read by the centering math too

// The expanded SwipeMask (gauntletCard width, up to 300px) is centered
// within its OWN 110px-wide slot by default. For the outer slots that means
// it's centered on a point far from the row's actual midpoint — on a 3-tile
// row the left slot's card ends up centered ~118px left of screen-center,
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

function SpineSlot({
  tile, index, offsetX, status, isOpen, anyOpen, tileLanded, inputLocked,
  onPick, onSwipeUp, onSwipeRight, onEffect, onSwipeAttempt, onCardTouch,
  onMeasuredHeightChange, onLayoutExitComplete, wordY, intakeY, totalTiles, slotHeight,
}: {
  tile: GauntletTile;
  index: number;
  offsetX: number;
  status: SwipeMaskState;
  isOpen: boolean;
  anyOpen: boolean;
  tileLanded: boolean;
  inputLocked: boolean;
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
  const reduceMotion = useReducedMotionPreference();
  const measuredHeightRef = useRef(GAUNTLET_CARD_OPEN_MIN_HEIGHT);
  const resolved = status !== 'idle';
  // Open (or resolved) cards render wider than their 90px slot (see
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
      <Animated.View
        pointerEvents="none"
        style={[
          styles.card,
          // Shadow only while actually closed — NOT driven by closedOpacity
          // like the rest of this view. RN/iOS shadows are computed from
          // the layer's bounding box independently of animated `opacity`,
          // so a shadow left on this view kept casting a faint rounded-rect
          // "ghost" outline behind the opened card even once this view had
          // faded to opacity 0 and turned edge-on (confirmed on device,
          // 2026-08-15 — Pete: "there's a trace... on kind of an angle").
          // `!elevated` alone only covers THIS card's own shadow once IT
          // opens — it missed the same bleed from its still-closed
          // siblings: the open card grows well past its own 110px slot and
          // visually overlaps the other two, which are still closed and
          // still casting their own shadow underneath it (confirmed via
          // screenshot, 2026-08-15 — Pete: "a different outline... outside
          // of the card"). Once any card is active, the other two are
          // background and have no reason to keep casting depth, so
          // `anyOpen` cuts their shadow the same instant the sibling opens.
          !elevated && !anyOpen && styles.cardShadow,
          {
            opacity: closedOpacity,
            transform: [{ perspective: CARD_PERSPECTIVE }, { rotateY: closedRotateY }],
          },
        ]}
      >
        {/* Same purple-leather gradient recipe as the Hero Book cover and
            the Vault spines (heroBookMaterial), not a flat fill — this is
            what actually reads as "book material" rather than "a plain
            dark card," and reads as distinct from the flat cardMaterial
            regular tiles use. Real closed-card texture/illustration is
            still an open item (2026-08-15 doc); this is the material
            recipe, not the final art. */}
        <LinearGradient
          colors={[
            heroBookMaterial.coverPurpleTop,
            heroBookMaterial.coverPurple,
            heroBookMaterial.coverPurpleBot,
          ]}
          style={styles.cardFace}
        >
          {/* No "SEALED" label — Pete wants the crown to be the only
              content, as large as the card can hold (2026-08-15). */}
          <Image
            source={crownMarkerArt}
            contentFit="contain"
            tintColor={CARD_MARKER_COLORS[index % CARD_MARKER_COLORS.length]}
            style={styles.cardMarker}
          />
        </LinearGradient>
      </Animated.View>

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

  useEffect(() => {
    onActiveCardHeightChange?.(activeCardHeight);
  }, [activeCardHeight, onActiveCardHeightChange]);

  if (gatePhase !== 'tiles' && gatePhase !== 'wrongFail') return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View
        style={styles.header}
        accessible
        accessibilityLabel={`Choose a seal. ${correctCount} of ${gauntletTiles.length} correct.`}
      >
        <Text style={styles.instruction}>CHOOSE A SEAL</Text>
        <Text style={styles.progress}>{correctCount}/{gauntletTiles.length}</Text>
      </View>
      <View
        style={[styles.row, { height: activeCardHeight + ROW_VERTICAL_INSET }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: PW.space.md,
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
  },
  slot: {
    width: CARD_WIDTH,
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
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_CLOSED_HEIGHT,
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: heroBookMaterial.goldHairline,
    overflow: 'hidden',
  },
  // Split out from `card` — see the "shadow ghost" comment where this is
  // applied conditionally (only while actually closed).
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
  // No "SEALED" label anymore — the crown is the only content, so it can
  // take up most of the card instead of sharing space with text (Pete,
  // 2026-08-15: "just the crowns as big as they go").
  cardMarker: {
    width: 84,
    height: 54,
  },
  openContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
