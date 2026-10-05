import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
} from 'react-native';
import { POLLY_POSES, pollyPoseScale } from '../ui/pollyPoses';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollyPerchRig, POLLY_PERCH_RIG_ENABLED } from './PollyPerchRig';
import { PollySpeechBubble } from './PollySpeechBubble';

type Outcome = 'loss' | 'beat' | 'complete';

const POLLY_SIZE = 244;

// Results actions are interactive UI, so Polly gets a dedicated stage below
// them rather than floating over the Share/Home row. The ScrollView reserves
// this exact clearance. Her bubble also lives inside the same stage.
export const POLLY_RESULTS_PERCH_CLEARANCE = 238;

type Props = {
  outcome: Outcome;
  line: string | null;
  relationshipPose?: 'default' | 'rattled' | 'smug' | 'point';
};

const OUTCOME_POSE: Record<Outcome, ImageSourcePropType> = {
  loss: POLLY_POSES.laugh,     // her win — synced with the laugh SFX Results plays
  beat: POLLY_POSES.sulk,      // carries her boss-defeat pose into the ledger
  complete: POLLY_POSES.idle,  // the watcher
};

const ENTRANCE_DELAY_MS = 600; // the verdict stamps first

export default function PollyResultsPerch({ outcome, line, relationshipPose = 'default' }: Props) {
  const relationshipPoseArt = relationshipPose === 'rattled'
    ? POLLY_POSES.rattled
    : relationshipPose === 'smug'
    ? POLLY_POSES.smug
    : relationshipPose === 'point'
    ? POLLY_POSES.point
    : null;
  const settledPose = relationshipPoseArt ?? OUTCOME_POSE[outcome];
  const [pose, setPose] = useState<ImageSourcePropType>(POLLY_POSES.fly);

  const slideY = useRef(new Animated.Value(POLLY_SIZE)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const { translateX: breatheX, translateY: breatheY, reduceMotion } =
    usePollyAmbientMotion('results');

  // Entrance + one line, fresh on every mount (setTimeout between phases).
  useEffect(() => {
    if (reduceMotion === null) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      if (reduceMotion) slideY.setValue(0);
      else Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    }, reduceMotion ? 0 : ENTRANCE_DELAY_MS));
    timers.push(setTimeout(
      () => setPose(settledPose),
      reduceMotion ? 0 : ENTRANCE_DELAY_MS + 650,
    ));
    if (line) {
      timers.push(setTimeout(() => {
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      }, reduceMotion ? 0 : ENTRANCE_DELAY_MS + 900));
      timers.push(setTimeout(() => {
        Animated.timing(bubbleOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
      }, reduceMotion ? 4000 : ENTRANCE_DELAY_MS + 4900));
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, outcome, relationshipPose, reduceMotion, slideY]);

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      <Animated.View
        style={[
          styles.pollyWrap,
          { transform: [{ translateX: breatheX }, { translateY: breatheY }] },
        ]}
      >
        {POLLY_PERCH_RIG_ENABLED && pose === POLLY_POSES.idle ? (
          <PollyPerchRig size={POLLY_SIZE} reduceMotion={reduceMotion} />
        ) : (
          <Image
            source={pose}
            style={[styles.pollyImage, { transform: [{ scale: pollyPoseScale(pose) }] }]}
            resizeMode="contain"
          />
        )}
      </Animated.View>

      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <PollySpeechBubble line={line ?? ''} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: POLLY_RESULTS_PERCH_CLEARANCE,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  pollyWrap: {
    position: 'absolute',
    left: -44,
    bottom: -22,
    width: POLLY_SIZE,
    height: POLLY_SIZE,
  },
  pollyImage: {
    width: POLLY_SIZE,
    height: POLLY_SIZE,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 150,
    right: 18,
    bottom: 112,
  },
});
