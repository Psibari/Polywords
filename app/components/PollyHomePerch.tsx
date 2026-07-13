import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
} from 'react-native';
import { POLLY_POSES } from '../ui/pollyPoses';
import { homePerch } from '../ui/pwHomeMaterials';
import { resolveHomePollyMoment } from '../game/pollyMemory';
import { useGameStore } from '../store/useGameStore';
import { useIsFocused } from '@react-navigation/native';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollySpeechBubble } from './PollySpeechBubble';

// Once per app session: fly-in + one greeting. Navigating away re-mounts
// Home, but Polly is already at her post — no re-entrance, no re-greeting.
let enteredThisSession = false;

export default function PollyHomePerch() {
  const memory = useGameStore(s => s.pollyMemory);
  const rememberLine = useGameStore(s => s.rememberPollyLine);
  const isFocused = useIsFocused();
  const isEntrance = !enteredThisSession;
  const [moment] = useState(() => resolveHomePollyMoment(memory));
  const settledPose = memory.playerWinStreak > 0
    ? POLLY_POSES.sulk
    : memory.pollyWinStreak > 0
    ? POLLY_POSES.smug
    : POLLY_POSES.idle;
  const [pose, setPose] = useState<ImageSourcePropType>(
    isEntrance ? POLLY_POSES.fly : settledPose,
  );

  const slideY = useRef(new Animated.Value(isEntrance ? 300 : 0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const { translateX: breatheX, translateY: breatheY, reduceMotion } =
    usePollyAmbientMotion('home', isFocused);

  // Entrance + one greeting (setTimeout between phases, per animation rules).
  useEffect(() => {
    if (!isEntrance || reduceMotion === null) return;
    enteredThisSession = true;
    rememberLine(moment.lineId, 'home');

    if (reduceMotion) {
      slideY.setValue(0);
      setPose(settledPose);
    }

    if (!reduceMotion) {
      Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    }
    const poseT = setTimeout(() => setPose(settledPose), reduceMotion ? 0 : 650);
    const showT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, 900);
    const hideT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    }, 4900);
    return () => {
      clearTimeout(poseT);
      clearTimeout(showT);
      clearTimeout(hideT);
    };
    // This entrance is deliberately keyed only to the resolved accessibility
    // preference. Recording the line updates memory immediately; depending on
    // that object here would cancel the entrance timers on the same frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      {/* Polly — whole-image motion only; her branch is part of the pose art,
          rooted off the left edge */}
      <Animated.View
        style={[
          styles.pollyWrap,
          { transform: [{ translateX: breatheX }, { translateY: breatheY }] },
        ]}
      >
        <Image source={pose} style={styles.pollyImage} resizeMode="contain" />
      </Animated.View>

      {/* Greeting bubble — to her right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <PollySpeechBubble line={moment.line} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    bottom: homePerch.bottomOffset,
    width: 260,
    height: homePerch.pollySize,
    pointerEvents: 'none',
    zIndex: 2,
  },
  pollyWrap: {
    position: 'absolute',
    left: -66,
    bottom: 0,
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  pollyImage: {
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 150,
    bottom: 128,
  },
});
