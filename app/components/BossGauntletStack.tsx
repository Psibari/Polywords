import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Mask } from '../game/types';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ShardVariant } from '../ui/pwEffects';
import { playSfx } from '../audio/sfx';

type GauntletTile = { pairIndex: number; mask: Mask; isReal: boolean };

export type BossGauntletStackProps = {
  gatePhase: 'locked' | 'tiles' | 'wrongFail' | 'mastered';
  activeGauntletTile: GauntletTile | null;
  gauntletTiles: GauntletTile[];
  gauntletIndex: number;
  tileState: SwipeMaskState;
  tileLanded: boolean;
  inputLocked: boolean;
  onSwipeUp: () => void;
  onSwipeRight: () => void;
  onEffect: (type: 'shard' | 'trail', x: number, y: number, variant?: ShardVariant) => void;
  onSwipeAttempt?: () => void;
  onCardTouch: () => void;
  wordY: number;
  intakeY: number;
};

// The 3 hidden gauntlet tiles, presented as a stack Polly threw in: two
// inert "back" cards fanned out behind the active one, pivoting from the
// bottom edge (like a hand of cards), the active card swipeable via the
// same SwipeMask gesture every other tile in the game already uses.
export function BossGauntletStack({
  gatePhase, activeGauntletTile, gauntletTiles, gauntletIndex, tileState,
  tileLanded, inputLocked, onSwipeUp, onSwipeRight, onEffect, onSwipeAttempt,
  onCardTouch, wordY, intakeY,
}: BossGauntletStackProps) {
  if ((gatePhase !== 'tiles' && gatePhase !== 'wrongFail') || !activeGauntletTile) return null;

  const remainingAfterActive = gauntletTiles.length - gauntletIndex - 1;

  return (
    <View style={styles.stage} pointerEvents="box-none">
      {/* Back card 2 (furthest), only if 2 tiles remain behind the active one */}
      {remainingAfterActive >= 2 && (
        <View style={[styles.backCard, styles.backCard2]} />
      )}
      {/* Back card 1, only if at least 1 tile remains behind the active one */}
      {remainingAfterActive >= 1 && (
        <View style={[styles.backCard, styles.backCard1]} />
      )}

      <Animated.View
        pointerEvents={gatePhase === 'wrongFail' ? 'none' : tileLanded ? 'auto' : 'none'}
        style={styles.activeCardSlot}
      >
        <SwipeMask
          key={activeGauntletTile.mask.id}
          mask={activeGauntletTile.mask}
          state={tileState}
          onSwipeUp={onSwipeUp}
          onSwipeDown={onSwipeRight}
          onSwipeReveal={() => {}}
          revealable={false}
          disabled={inputLocked}
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

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  activeCardSlot: {
    zIndex: 3,
  },
  backCard: {
    position: 'absolute',
    bottom: 0,
    width: 300,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#47236f',
  },
  backCard1: {
    zIndex: 2,
    transform: [{ rotate: '5deg' }, { translateY: 6 }],
    transformOrigin: ['50%', '100%'],
    opacity: 0.9,
  },
  backCard2: {
    zIndex: 1,
    transform: [{ rotate: '-6deg' }, { translateY: 10 }],
    transformOrigin: ['50%', '100%'],
    opacity: 0.75,
  },
});
