import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { playSfx } from '../audio/sfx';
import { POLLY_POSES, PollyPoseName } from '../ui/pollyPoses';
import type { ActiveVisit } from '../hooks/usePollyVisits';

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

  // Arc position (fly-in/out) — native driver, transforms only.
  const arcX = useRef(new Animated.Value(OFF_X)).current;
  const arcY = useRef(new Animated.Value(OFF_Y)).current;
  // Continuous life on the perch (offset periods = organic).
  const breatheY = useRef(new Animated.Value(0)).current;
  const breatheX = useRef(new Animated.Value(0)).current;
  // Per-reaction whole-image punch.
  const reactX = useRef(new Animated.Value(0)).current;
  const reactY = useRef(new Animated.Value(0)).current;
  const reactScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const visitIdRef = useRef<number | null>(null);
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

  // Breath + sway loops run for the component's lifetime; invisible while
  // she is off-screen, alive the moment she lands.
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

  function runExit(ms: number) {
    if (exitingRef.current) return;
    exitingRef.current = true;
    clearTimers();
    Animated.timing(bubbleOpacity, { toValue: 0, duration: BUBBLE_OUT_MS, useNativeDriver: true }).start();
    setPose('fly');
    Animated.parallel([
      Animated.timing(arcX, { toValue: OFF_X, duration: ms, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(arcY, { toValue: OFF_Y, duration: ms, easing: Easing.in(Easing.quad), useNativeDriver: true }),
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
    reactScale.setValue(1);
    if (perchPose === 'laugh') {
      // Sharp bark: quick pop + hard shake.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.08, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 220, useNativeDriver: true }),
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
    } else if (perchPose === 'sulk') {
      // Slow deflating droop.
      Animated.timing(reactY, { toValue: 6, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(reactScale, { toValue: 0.95, duration: 500, useNativeDriver: true }).start();
    } else {
      // smug / point: cold lean toward the puzzle (she's on the left → lean right).
      Animated.sequence([
        Animated.timing(reactX, { toValue: 12, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 540, delay: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
  }

  useEffect(() => {
    if (!visit) return;

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
    reactScale.setValue(1);
    bubbleOpacity.setValue(0);
    arcX.setValue(OFF_X);
    arcY.setValue(OFF_Y);
    setLine(visit.spec.line);
    setPose(visit.spec.flyPose);

    Animated.parallel([
      Animated.timing(arcX, { toValue: 0, duration: FLY_IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(arcY, { toValue: 0, duration: FLY_IN_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    later(() => {
      // Landed: reaction pose + punch + bubble + squawk.
      setPose(visit.spec.perchPose);
      if (visit.spec.sfx) playSfx(visit.spec.sfx);
      runPunch(visit.spec.perchPose);
      if (visit.spec.line) {
        Animated.timing(bubbleOpacity, { toValue: 1, duration: BUBBLE_IN_MS, useNativeDriver: true }).start();
      }
      if (!visit.spec.holdPerch) {
        later(() => runExit(FLY_OUT_MS), visit.spec.perchMs);
      }
      // holdPerch: stay until fastExit or unmount (terminal beats).
    }, FLY_IN_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit]);

  if (!visit) return null;

  return (
    <View style={styles.root} pointerEvents="none">
      {/* Speech bubble — to Polly's right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line ?? ''}</Text>
        </View>
        <View style={styles.tailBorder} />
        <View style={styles.tailFill} />
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
              { scale: reactScale },
            ],
          },
        ]}
      >
        <Image source={POLLY_POSES[pose]} style={styles.pollyImage} resizeMode="contain" />
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
  bubble: {
    backgroundColor: '#1A1055',
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 185,
  },
  bubbleText: {
    fontFamily: FONTS.brand,
    fontSize: 15,
    lineHeight: 21,
    color: '#FFF7D6',
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
    borderRightColor: 'rgba(245,200,66,0.55)',
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
    borderRightColor: '#1A1055',
  },
});
