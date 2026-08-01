import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Mask } from '../game/types';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ShardVariant } from '../ui/pwEffects';
import { playSfx } from '../audio/sfx';
import { PW } from '../ui/pwTheme';
import { FONTS } from '../constants/fonts';

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
const SPINE_CLOSED_SCALE_X = 0.14;

function SpineSlot({
  tile, index, status, isOpen, anyOpen, tileLanded, inputLocked,
  onPick, onSwipeUp, onSwipeRight, onEffect, onSwipeAttempt, onCardTouch, wordY, intakeY,
}: {
  tile: GauntletTile;
  index: number;
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
    <View style={[styles.slot, elevated && styles.slotElevated]}>
      <Animated.View pointerEvents="none" style={[styles.spine, { transform: [{ scaleX }] }]}>
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
        pointerEvents={isOpen || resolved ? 'box-none' : 'none'}
        accessibilityElementsHidden={!(isOpen || resolved)}
        importantForAccessibility={isOpen || resolved ? 'auto' : 'no-hide-descendants'}
        style={[styles.openContent, { opacity: contentOpacity }]}
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
    gap: 8,
    height: 206,
  },
  slot: {
    width: 90,
    height: 200,
  },
  // Applied to whichever slot is currently open (or already resolved) so
  // its overflowing gauntletCard-width SwipeMask paints above sibling
  // sealed spines instead of being occluded by them (finding 2).
  slotElevated: {
    zIndex: PW.z.activeCard,
    elevation: PW.z.activeCard,
  },
  spine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: '#1C1548',
    borderWidth: 1,
    borderColor: PW.color.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
