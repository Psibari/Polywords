import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Mask } from '../game/types';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ShardVariant } from '../ui/pwEffects';
import { playSfx } from '../audio/sfx';
import { PW } from '../ui/pwTheme';
import { FONTS } from '../constants/fonts';
import { libraryMaterial } from '../ui/pwMaterials';

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
  wordY: number;
  intakeY: number;
};

// Matches perform.onGauntletTileDrop's existing ~280ms landing timer
// (MaskBoard.tsx) — the spine's own open animation should finish at
// roughly the same beat the tile becomes swipeable (tileLanded).
const SPINE_OPEN_MS = 280;
// A real book spine (BookSpine.tsx, the Vault shelf) runs 30-44px wide at
// 128px tall — roughly a 1:3 to 1:4 width:height ratio, not the 1:13 sliver
// a 0.14 scale produced here (110 * 0.14 ≈ 15px against a 200px height).
// 0.55 puts the closed rest width at ~60px against this spine's 200px
// height (~1:3.3), landing inside BookSpine's own established range instead
// of guessing a new one.
const SPINE_CLOSED_SCALE_X = 0.55;
// Sized against MaskBoard's own container padding (14px each side) so 3
// slots + 2 gaps fit on the narrowest realistic target width (375pt)
// without guessing: (375 - 14*2 - 8*2) / 3 = 110.3, floored to 110.
const SPINE_WIDTH = 110;
const SPINE_HEIGHT = 200;
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
  const contentWidth = tileCount * SPINE_WIDTH + (tileCount - 1) * ROW_GAP;
  const slotCenter = index * (SPINE_WIDTH + ROW_GAP) + SPINE_WIDTH / 2;
  return contentWidth / 2 - slotCenter;
}

function SpineSlot({
  tile, index, offsetX, status, isOpen, anyOpen, tileLanded, inputLocked,
  onPick, onSwipeUp, onSwipeRight, onEffect, onSwipeAttempt, onCardTouch, wordY, intakeY,
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
  wordY: number;
  intakeY?: number;
}) {
  const openAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
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

  useEffect(() => {
    Animated.timing(openAnim, {
      toValue: isOpen || resolved ? 1 : 0,
      duration: SPINE_OPEN_MS,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resolved]);

  const scaleX = openAnim.interpolate({ inputRange: [0, 1], outputRange: [SPINE_CLOSED_SCALE_X, 1] });
  const labelRotate = openAnim.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });
  const labelOpacity = openAnim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0, 0] });
  const contentOpacity = openAnim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] });

  // A closed, unopened, unresolved slot's hit target should never capture
  // touches meant for whichever OTHER slot is currently open — its own
  // card can be picked only while nothing else is active anyway
  // (useBoardMechanics.pickGauntletTile no-ops once a tile is active), so
  // there's no functional loss in going fully inert here.
  const closedHitInert = resolved || anyOpen;

  return (
    <View style={[styles.slot, isOpen ? styles.slotOpen : elevated && styles.slotElevated]}>
      <Animated.View pointerEvents="none" style={[styles.spine, { transform: [{ scaleX }] }]}>
        {/* Same leather-and-tooling material as BookSpine.tsx (Vault shelf)
            and HeroBook's own cover — every purple/gold token here traces
            back to heroBookMaterial, so this reads as the same object, not
            a new material invented for this one component. */}
        <Svg width={SPINE_WIDTH} height={SPINE_HEIGHT} style={StyleSheet.absoluteFillObject}>
          <Defs>
            {/* Id must be unique per instance — 3 slots render simultaneously,
                each with its own Svg, same reason BookSpine.tsx keys its
                gradient id off the word instead of a shared literal. */}
            <LinearGradient id={`gauntletSpineLeather-${tile.mask.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={libraryMaterial.spineLeatherTop} />
              <Stop offset="0.5" stopColor={libraryMaterial.spineLeather} />
              <Stop offset="1" stopColor={libraryMaterial.spineLeatherBot} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.5} y={0.5}
            width={SPINE_WIDTH - 1} height={SPINE_HEIGHT - 1}
            rx={16}
            fill={`url(#gauntletSpineLeather-${tile.mask.id})`}
            stroke={libraryMaterial.spineToolingHairline}
            strokeWidth={1}
          />
          {/* Gold tooling bands, head and tail */}
          <Rect x={8} y={18} width={SPINE_WIDTH - 16} height={2.5} fill={libraryMaterial.spineTooling} />
          <Rect x={8} y={SPINE_HEIGHT - 24} width={SPINE_WIDTH - 16} height={2.5} fill={libraryMaterial.spineTooling} />
          {/* Boss-only second amber band, same treatment BookSpine reserves
              for isBoss — this spine is always Polly's Word, so it's always
              on. */}
          <Rect x={8} y={26} width={SPINE_WIDTH - 16} height={1.5} fill={libraryMaterial.spineAmber} />
          <Rect x={8} y={SPINE_HEIGHT - 32} width={SPINE_WIDTH - 16} height={1.5} fill={libraryMaterial.spineAmber} />
        </Svg>
        <Animated.Text
          style={[styles.spineLabel, { opacity: labelOpacity, transform: [{ rotate: labelRotate }] }]}
        >
          SEALED
        </Animated.Text>
      </Animated.View>

      {/* Closed hit target — sits on top while sealed, stops intercepting
          touches once open (or once ANY sibling is open) so it never fights
          SwipeMask's own gesture or steals touches from an overflowing
          neighbor's open card. */}
      <Pressable
        pointerEvents={closedHitInert ? 'none' : 'auto'}
        disabled={closedHitInert || inputLocked}
        onPressIn={() => { if (!resolved) onPick(index); }}
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
          tileHeight={200}
          entryDelay={0}
          onEffect={onEffect}
          onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
          onPressHoldStart={() => playSfx('pressHoldStart')}
          onCardTouch={onCardTouch}
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
  onEffect, onSwipeAttempt, onCardTouch, wordY, intakeY,
}: BossGauntletSpinesProps) {
  if (gatePhase !== 'tiles' && gatePhase !== 'wrongFail') return null;

  const anyOpen = activeGauntletTile !== null;

  return (
    <View style={styles.row} pointerEvents="box-none">
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
          wordY={wordY}
          intakeY={intakeY}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: ROW_GAP,
    height: 206,
  },
  slot: {
    width: SPINE_WIDTH,
    height: SPINE_HEIGHT,
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
  spine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Static warm-toned drop shadow, not an ambient glow (this codebase
    // has burned three times on animated/ongoing glow effects — see
    // MaskBoard's boss-round governing rules) — a one-time, non-animated
    // shadow satisfies pwMaterials.ts's own "spines stand against warm
    // wood, never purple-on-purple" rule without adding an effect system.
    // The boss room's ambient is purple/indigo, unlike the Vault's warm
    // wood backing, so the purple leather needs this to read as an object
    // sitting in front of the scene rather than blending into it.
    // iOS-only shadow props deliberately — Android's `elevation` establishes
    // its own stacking context and this component already has a carefully
    // tuned zIndex/elevation scheme on the parent `slot` (see slotOpen/
    // slotElevated above, fixing a real touch-stealing bug); adding a
    // second elevation value on a nested child risks reopening that.
    shadowColor: PW.color.amber,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  spineLabel: {
    position: 'absolute',
    color: PW.color.gold,
    fontFamily: FONTS.label,
    fontSize: 14,
    letterSpacing: 2,
  },
  openContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
