import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import { POLLY_POSES, pollyPoseScale } from '../ui/pollyPoses';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollyPerchRig, POLLY_PERCH_RIG_ENABLED } from './PollyPerchRig';
import { PollySpeechBubble } from './PollySpeechBubble';

type Outcome = 'loss' | 'beat' | 'complete';

const POLLY_SIZE = 300;

export const POLLY_RESULTS_PERCH_CLEARANCE = 380; // pollyImage height + extra clearance for the speech bubble, which sits above the buttons, not beside them

type Props = {
  outcome: Outcome;
  line: string | null;
};

const OUTCOME_POSE: Record<Outcome, ImageSourcePropType> = {
  loss: POLLY_POSES.laugh,     // her win — synced with the laugh SFX Results plays
  beat: POLLY_POSES.sulk,      // carries her boss-defeat pose into the ledger
  complete: POLLY_POSES.idle,  // the watcher
};

const ENTRANCE_DELAY_MS = 600; // the verdict stamps first

export default function PollyResultsPerch({ outcome, line }: Props) {
  const [pose, setPose] = useState<ImageSourcePropType>(POLLY_POSES.fly);

  const slideY = useRef(new Animated.Value(300)).current;
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
      () => setPose(OUTCOME_POSE[outcome]),
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
  }, [line, outcome, reduceMotion, slideY]);

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

      {/* Bubble — to her right, tail points left at her */}
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
    height: 220,
    pointerEvents: 'none',
  },
  pollyWrap: {
    position: 'absolute',
    left: -74,
    bottom: -26,
    width: POLLY_SIZE,
    height: POLLY_SIZE,
  },
  pollyImage: {
    width: POLLY_SIZE,
    height: POLLY_SIZE,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 162,
    bottom: 190,
  },
});
