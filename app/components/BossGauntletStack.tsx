import React, { useEffect, useRef } from 'react';
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
  playThrowIn: boolean;
};

// The 3 hidden gauntlet tiles, presented as a stack Polly threw in: two
// inert "back" cards fanned out behind the active one, pivoting from the
// bottom edge (like a hand of cards), the active card swipeable via the
// same SwipeMask gesture every other tile in the game already uses.
export function BossGauntletStack({
  gatePhase, activeGauntletTile, gauntletTiles, gauntletIndex, tileState,
  tileLanded, inputLocked, onSwipeUp, onSwipeRight, onEffect, onSwipeAttempt,
  onCardTouch, wordY, intakeY, playThrowIn,
}: BossGauntletStackProps) {
  // Throw-in: all 3 stack slots launch from near Polly's bottom-left
  // wingtip perch and arc/spin/scale up into their resting stack position.
  // Back card (2) launches first so it isn't visually covering cards that
  // land after it; active card (0) launches last. Values/timings are
  // starting points from the approved mockup — tune on device.
  //
  // NOTE (final review pass): the stack renders inside MaskBoard's outer
  // container, which has overflow: 'hidden'. The original offsets here
  // (~-210 to -230 x, ~240 to 260 y) were large enough that the throw could
  // start outside that clipped area, meaning on-device the cards would pop
  // in at the clip edge instead of visibly flying in. These halved values
  // are a device-unverified starting point chosen only to keep the whole
  // arc within a plausible on-screen distance of the resting stack — not a
  // claim of pixel alignment with Polly's actual sprite position. Re-tune
  // once Pete can see it on a real screen, ideally by measuring where the
  // board's visible bottom-left actually is relative to this stack's rest
  // position.
  const throw0 = useRef(new Animated.ValueXY(playThrowIn ? { x: -115, y: 130 } : { x: 0, y: 0 })).current;
  const throw0Rotate = useRef(new Animated.Value(playThrowIn ? -200 : 0)).current;
  const throw0Scale = useRef(new Animated.Value(playThrowIn ? 0.3 : 1)).current;
  const throw1 = useRef(new Animated.ValueXY(playThrowIn ? { x: -110, y: 125 } : { x: 0, y: 6 })).current;
  const throw1Rotate = useRef(new Animated.Value(playThrowIn ? -230 : 7)).current;
  const throw1Scale = useRef(new Animated.Value(playThrowIn ? 0.28 : 1)).current;
  const throw2 = useRef(new Animated.ValueXY(playThrowIn ? { x: -105, y: 120 } : { x: 0, y: 10 })).current;
  const throw2Rotate = useRef(new Animated.Value(playThrowIn ? 200 : -6)).current;
  const throw2Scale = useRef(new Animated.Value(playThrowIn ? 0.26 : 1)).current;

  useEffect(() => {
    if (!playThrowIn) return;
    Animated.sequence([
      Animated.delay(0),
      Animated.parallel([
        Animated.timing(throw2, { toValue: { x: 0, y: 10 }, duration: 520, useNativeDriver: true }),
        Animated.timing(throw2Rotate, { toValue: -6, duration: 520, useNativeDriver: true }),
        Animated.timing(throw2Scale, { toValue: 1, duration: 520, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(throw1, { toValue: { x: 0, y: 6 }, duration: 560, useNativeDriver: true }),
        Animated.timing(throw1Rotate, { toValue: 7, duration: 560, useNativeDriver: true }),
        Animated.timing(throw1Scale, { toValue: 1, duration: 560, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(throw0, { toValue: { x: 0, y: 0 }, duration: 600, useNativeDriver: true }),
        Animated.timing(throw0Rotate, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(throw0Scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playThrowIn]);

  if ((gatePhase !== 'tiles' && gatePhase !== 'wrongFail') || !activeGauntletTile) return null;

  const remainingAfterActive = gauntletTiles.length - gauntletIndex - 1;

  return (
    <View style={styles.stage} pointerEvents="box-none">
      {/* Back card 2 (furthest), only if 2 tiles remain behind the active one */}
      {remainingAfterActive >= 2 && (
        <Animated.View
          style={{
            transformOrigin: ['50%', '100%'],
            transform: [
              { translateX: throw2.x }, { translateY: throw2.y },
              { rotate: throw2Rotate.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
              { scale: throw2Scale },
            ],
          }}
        >
          <View style={[styles.backCard, styles.backCard2]} />
        </Animated.View>
      )}
      {/* Back card 1, only if at least 1 tile remains behind the active one */}
      {remainingAfterActive >= 1 && (
        <Animated.View
          style={{
            transformOrigin: ['50%', '100%'],
            transform: [
              { translateX: throw1.x }, { translateY: throw1.y },
              { rotate: throw1Rotate.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
              { scale: throw1Scale },
            ],
          }}
        >
          <View style={[styles.backCard, styles.backCard1]} />
        </Animated.View>
      )}

      <Animated.View
        pointerEvents={gatePhase === 'wrongFail' ? 'none' : tileLanded ? 'auto' : 'none'}
        style={[
          styles.activeCardSlot,
          {
            transformOrigin: ['50%', '100%'],
            transform: [
              { translateX: throw0.x }, { translateY: throw0.y },
              { rotate: throw0Rotate.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
              { scale: throw0Scale },
            ],
          },
        ]}
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
    // Fixed height matching the active SwipeMask's tileHeight (200) plus a
    // small margin. Without this, the stage's height derives entirely from
    // the active card's own wrapper, which animates to 0 between tiles
    // (judgement) and back — the two absolutely-positioned back cards would
    // otherwise visibly slide down and back up on every tile transition.
    height: 206,
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
    opacity: 0.9,
  },
  backCard2: {
    zIndex: 1,
    opacity: 0.75,
  },
});
