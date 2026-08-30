import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { playSfx } from '../audio/sfx';
import { POLLY_POSES, POLLY_POSE_SCALE, PollyPoseName } from '../ui/pollyPoses';
import type { ActiveVisit } from '../hooks/usePollyVisits';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollySpeechBubble } from './PollySpeechBubble';

const FLY_IN_MS = 600;
const FLY_OUT_MS = 500;
const FAST_EXIT_MS = 250;
const BUBBLE_IN_MS = 180;
const BUBBLE_OUT_MS = 150;
const OFF_X = -240; // off-screen bottom-left start/end of the arc
const OFF_Y = 200;

type Props = {
  visit: ActiveVisit | null;
  onDone: (id: number) => void;
};

// Hunt Polly's body: renders exactly one visit arc at a time, bottom-left
// (the play field already clears this lane; the right side is the reject
// lane and is never used). Whole-image motion only — no part seams.
export function PollyHuntVisit({ visit, onDone }: Props) {
  const [pose, setPose] = useState<PollyPoseName>('fly');
  const [line, setLine] = useState<string | null>(null);
  const [perchScale, setPerchScale] = useState(1);

  // Arc position (fly-in/out) — native driver, transforms only.
  const arcX = useRef(new Animated.Value(OFF_X)).current;
  const arcY = useRef(new Animated.Value(OFF_Y)).current;
  const flightTilt = useRef(new Animated.Value(-1)).current;
  const flightScale = useRef(new Animated.Value(0.84)).current;
  // Continuous life on the perch (offset periods = organic).
  const { translateX: breatheX, translateY: breatheY, reduceMotion } =
    usePollyAmbientMotion('hunt', visit !== null);
  // Per-reaction whole-image punch.
  const reactX = useRef(new Animated.Value(0)).current;
  const reactY = useRef(new Animated.Value(0)).current;
  const reactTilt = useRef(new Animated.Value(0)).current;
  const reactScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.92)).current;

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const visitIdRef = useRef<number | null>(null);
  const exitPoseRef = useRef<PollyPoseName>('fly');
  const exitingRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  function later(fn: () => void, ms: number) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  useEffect(() => clearTimers, []);

  function runExit(ms: number) {
    if (exitingRef.current) return;
    exitingRef.current = true;
    clearTimers();
    if (reduceMotion) {
      bubbleOpacity.setValue(0);
      setPose(exitPoseRef.current);
      arcX.setValue(OFF_X);
      arcY.setValue(OFF_Y);
      const id = visitIdRef.current;
      visitIdRef.current = null;
      if (id !== null) onDoneRef.current(id);
      return;
    }
    Animated.parallel([
      Animated.timing(bubbleOpacity, { toValue: 0, duration: BUBBLE_OUT_MS, useNativeDriver: true }),
      Animated.timing(bubbleScale, { toValue: 0.96, duration: BUBBLE_OUT_MS, useNativeDriver: true }),
    ]).start();
    setPose(exitPoseRef.current);
    Animated.parallel([
      Animated.timing(arcX, { toValue: OFF_X, duration: ms, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(arcY, { toValue: OFF_Y, duration: ms, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(flightTilt, { toValue: -1, duration: ms, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(flightScale, { toValue: 0.86, duration: ms, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    later(() => {
      const id = visitIdRef.current;
      visitIdRef.current = null;
      if (id !== null) onDoneRef.current(id);
    }, ms + 30);
  }

  function runPunch(perchPose: PollyPoseName) {
    reactX.setValue(0);
    reactY.setValue(0);
    reactTilt.setValue(0);
    reactScale.setValue(1);
    if (reduceMotion) return;
    if (perchPose === 'laugh') {
      // Sharp bark: quick pop + hard shake.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.08, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactTilt, { toValue: -1, duration: 85, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(reactTilt, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactX, { toValue: 9, duration: 55, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: -9, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    } else if (perchPose === 'shocked') {
      // Fast recoil pop.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 320, delay: 60, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactY, { toValue: -10, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactY, { toValue: 0, duration: 400, delay: 80, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactTilt, { toValue: 1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactTilt, { toValue: 0, duration: 360, delay: 80, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else if (perchPose === 'sulk') {
      // Slow deflating droop.
      Animated.timing(reactY, { toValue: 6, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(reactScale, { toValue: 0.95, duration: 500, useNativeDriver: true }).start();
      Animated.timing(reactTilt, { toValue: 0.45, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else if (perchPose === 'point') {
      Animated.sequence([
        Animated.timing(reactX, { toValue: 18, duration: 130, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 10, duration: 130, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 420, delay: 760, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactTilt, { toValue: -0.55, duration: 130, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(reactTilt, { toValue: 0, duration: 500, delay: 880, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else {
      // Smug: cold lean toward the puzzle (she is on the left, leaning right).
      Animated.sequence([
        Animated.timing(reactX, { toValue: 12, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 540, delay: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactTilt, { toValue: 0.35, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactTilt, { toValue: 0, duration: 540, delay: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
  }

  useEffect(() => {
    if (!visit || reduceMotion === null) return;

    // Same visit object flipping fastExit → cut to a fast fly-out.
    if (visit.id === visitIdRef.current) {
      if (visit.fastExit) runExit(FAST_EXIT_MS);
      return;
    }

    // New visit: reset and run the arc.
    visitIdRef.current = visit.id;
    exitingRef.current = false;
    clearTimers();
    reactX.setValue(0);
    reactY.setValue(0);
    reactTilt.setValue(0);
    reactScale.setValue(1);
    bubbleOpacity.setValue(0);
    bubbleScale.setValue(0.92);
    arcX.setValue(OFF_X);
    arcY.setValue(OFF_Y);
    flightTilt.setValue(-1);
    flightScale.setValue(0.84);
    setLine(visit.spec.line);
    setPose(visit.spec.flyPose);
    setPerchScale(visit.spec.perchScale ?? 1);
    exitPoseRef.current = visit.spec.exitPose ?? 'fly';

    if (reduceMotion) {
      arcX.setValue(0);
      arcY.setValue(0);
      flightTilt.setValue(0);
      flightScale.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(arcX, { toValue: 0, duration: FLY_IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(arcY, { toValue: 0, duration: FLY_IN_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(flightTilt, { toValue: 0.18, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(flightTilt, { toValue: 0, duration: 170, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(flightScale, { toValue: 1.03, duration: 470, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(flightScale, { toValue: 1, duration: 130, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start();
    }

    later(() => {
      // Landed: reaction pose + punch + bubble + squawk.
      setPose(visit.spec.perchPose);
      if (visit.spec.sfx) playSfx(visit.spec.sfx);
      runPunch(visit.spec.perchPose);
      if (visit.spec.line) {
        Animated.parallel([
          Animated.timing(bubbleOpacity, { toValue: 1, duration: BUBBLE_IN_MS, useNativeDriver: true }),
          Animated.spring(bubbleScale, {
            toValue: 1,
            speed: 24,
            bounciness: 4,
            useNativeDriver: true,
          }),
        ]).start();
      }
      if (!visit.spec.holdPerch) {
        later(() => runExit(FLY_OUT_MS), visit.spec.perchMs);
      }
      // holdPerch: stay until fastExit or unmount (terminal beats).
    }, reduceMotion ? 0 : FLY_IN_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit, reduceMotion]);

  if (!visit) return null;

  const flightRotate = flightTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });
  const reactionRotate = reactTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <View style={styles.root} pointerEvents="none">
      {/* Speech bubble — to Polly's right, tail points left at her */}
      <Animated.View
        style={[
          styles.bubbleWrap,
          { opacity: bubbleOpacity, transform: [{ scale: bubbleScale }] },
        ]}
      >
        <PollySpeechBubble line={line ?? ''} maxWidth={185} fontSize={15} lineHeight={21} />
      </Animated.View>

      {/* Polly — whole-image motion only, bottom-left, faces right */}
      <Animated.View
        style={[
          styles.pollyWrap,
          {
            transform: [
              { translateX: arcX },
              { translateY: arcY },
              { translateX: breatheX },
              { translateY: breatheY },
              { translateX: reactX },
              { translateY: reactY },
              { rotate: flightRotate },
              { rotate: reactionRotate },
              { scale: flightScale },
              { scale: reactScale },
              { scale: perchScale },
            ],
          },
        ]}
      >
        <Image
          source={POLLY_POSES[pose]}
          style={[styles.pollyImage, { transform: [{ scale: POLLY_POSE_SCALE[pose] }] }]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    zIndex: 40, // above stage/tiles, below GameScreen flash overlays (50)
  },
  pollyWrap: {
    position: 'absolute',
    left: -64,
    bottom: -20,
    width: 260,
    height: 260,
  },
  pollyImage: {
    width: 260,
    height: 260,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 148,
    bottom: 140,
  },
});
