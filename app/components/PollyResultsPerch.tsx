import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import { POLLY_POSES } from '../ui/pollyPoses';
import { homePerch, homeType } from '../ui/pwHomeMaterials';

type Outcome = 'loss' | 'beat' | 'complete';

export const POLLY_RESULTS_PERCH_CLEARANCE = 300; // matches pollyImage height — screen must reserve this much bottom padding

type Props = {
  outcome: Outcome;
  line: string | null;
};

const OUTCOME_POSE: Record<Outcome, ImageSourcePropType> = {
  loss: POLLY_POSES.laugh,     // her win — synced with the laugh SFX Results plays
  beat: POLLY_POSES.shocked,   // her sulk
  complete: POLLY_POSES.idle,  // the watcher
};

const ENTRANCE_DELAY_MS = 600; // the verdict stamps first

export default function PollyResultsPerch({ outcome, line }: Props) {
  const [pose, setPose] = useState<ImageSourcePropType>(POLLY_POSES.fly);

  const slideY = useRef(new Animated.Value(300)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const breatheY = useRef(new Animated.Value(0)).current;
  const breatheX = useRef(new Animated.Value(0)).current;

  // Entrance + one line, fresh on every mount (setTimeout between phases).
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    }, ENTRANCE_DELAY_MS));
    timers.push(setTimeout(() => setPose(OUTCOME_POSE[outcome]), ENTRANCE_DELAY_MS + 650));
    if (line) {
      timers.push(setTimeout(() => {
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      }, ENTRANCE_DELAY_MS + 900));
      timers.push(setTimeout(() => {
        Animated.timing(bubbleOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
      }, ENTRANCE_DELAY_MS + 4900));
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same breath + sway recipe as the Daily/Home perches.
  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheY, { toValue: -6, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breatheY, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheX, { toValue: 3, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breatheX, { toValue: -3, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    bob.start();
    sway.start();
    return () => {
      bob.stop();
      sway.stop();
    };
  }, [breatheY, breatheX]);

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      <Animated.View
        style={[
          styles.pollyWrap,
          { transform: [{ translateX: breatheX }, { translateY: breatheY }] },
        ]}
      >
        <Image source={pose} style={styles.pollyImage} resizeMode="contain" />
      </Animated.View>

      {/* Bubble — to her right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line ?? ''}</Text>
        </View>
        <View style={styles.tailBorder} />
        <View style={styles.tailFill} />
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
    width: 300,
    height: 300,
  },
  pollyImage: {
    width: 300,
    height: 300,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 162,
    bottom: 158,
  },
  bubble: {
    backgroundColor: homePerch.bubbleFace,
    borderWidth: 1.5,
    borderColor: homePerch.bubbleRim,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 190,
  },
  bubbleText: {
    fontFamily: FONTS.brand,
    fontSize: homeType.greeting,
    lineHeight: 22,
    color: homePerch.bubbleText,
    flexWrap: 'wrap',
  },
  tailBorder: {
    position: 'absolute',
    left: -9,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: homePerch.bubbleRim,
  },
  tailFill: {
    position: 'absolute',
    left: -7,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: homePerch.bubbleFace,
  },
});
