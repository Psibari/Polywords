import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { playSfx } from "../audio/sfx";
import { useReducedMotionPreference } from "../hooks/usePollyAmbientMotion";
import {
  POLYBOOK_CAGE,
  markPolybookCageFallen,
  polybookCageHasFallen,
  polybookCageLayout,
} from "../ui/polybookCage";

type PolybookCageProps = {
  /** True when the Polybook was opened by Home's dive, so the book's thud is there to shake the cage loose. */
  canFall: boolean;
  /** Turns true when the book has landed (its thud): the cage jolts and falls. */
  falling: boolean;
  pageWidth: number;
  /** The bottom of the page's content area, in the screen's own coordinates. The floor pieces rest above it. */
  contentBottom: number;
};

const T = POLYBOOK_CAGE.timing;
const DEG = { inputRange: [-90, 90], outputRange: ["-90deg", "90deg"] };

/**
 * The rope, and the cage: hanging from the rope and falling on the first Polybook visit of an app launch,
 * lying broken on the floor on every later one (Pete, 2026-10-23). Sizes and timings: ui/polybookCage.ts.
 * Everything animated here is a transform, so it all runs on the native driver. No sound for now.
 */
export default function PolybookCage({ canFall, falling, pageWidth, contentBottom }: PolybookCageProps) {
  const reduceMotion = useReducedMotionPreference();
  const layout = polybookCageLayout(pageWidth, contentBottom);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const pageWidthRef = useRef(pageWidth);
  pageWidthRef.current = pageWidth;

  const [phase, setPhase] = useState<"hanging" | "broken">(() =>
    canFall && !polybookCageHasFallen() ? "hanging" : "broken",
  );

  const drop = useRef(new Animated.Value(0)).current;
  const swing = useRef(new Animated.Value(POLYBOOK_CAGE.hang.tiltDeg)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const domeX = useRef(new Animated.Value(0)).current;
  const domeY = useRef(new Animated.Value(0)).current;
  const domeTurn = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  // The fall waits for the hanging picture to be on screen. In Expo Go the art arrives over the network and can land
  // after the thud, which let the cage fall before anyone saw it (Pete's phone, 2026-10-23).
  const [hangReady, setHangReady] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Less motion: the cage is simply already broken.
  useEffect(() => {
    if (reduceMotion === true && phase === "hanging") {
      markPolybookCageFallen();
      setPhase("broken");
    }
  }, [reduceMotion, phase]);

  useEffect(() => {
    if (!falling || !hangReady || phaseRef.current !== "hanging" || reduceMotion !== false || started.current) return;
    started.current = true;
    markPolybookCageFallen();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const tilt = POLYBOOK_CAGE.hang.tiltDeg;
    const to = (v: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.quad)) =>
      Animated.timing(v, { toValue, duration, easing, useNativeDriver: true });

    // The thud jolts it...
    at(T.shakeAtMs, () => {
      const s = T.shakeMs;
      Animated.sequence([
        to(swing, tilt - T.shakeDeg, s * 0.25),
        to(swing, tilt + T.shakeDeg * 0.8, s * 0.3),
        to(swing, tilt - T.shakeDeg * 0.5, s * 0.25),
        to(swing, tilt, s * 0.2),
      ]).start();
    });
    // ...it lets go and falls...
    at(T.fallAtMs, () => {
      Animated.parallel([
        to(drop, layoutRef.current.fallDistance, T.fallMs, Easing.in(Easing.quad)),
        to(swing, tilt * 0.4, T.fallMs),
      ]).start();
    });
    // ...and breaks on the floor: the base squashes and settles, the dome hops out.
    at(T.fallAtMs + T.fallMs, () => {
      // The crash, the instant it lands.
      playSfx("polybookCageCrash");
      squash.setValue(0.86);
      domeX.setValue(T.domeFromX * pageWidthRef.current);
      domeY.setValue(T.domeFromY * pageWidthRef.current);
      domeTurn.setValue(T.domeFromDeg);
      setPhase("broken");
      // One frame for the pieces to mount before their animation starts.
      at(16, () => {
        Animated.parallel([
          to(squash, 1, T.settleMs, Easing.out(Easing.quad)),
          to(domeX, 0, T.domeMs, Easing.out(Easing.quad)),
          to(domeY, 0, T.domeMs, Easing.out(Easing.bounce)),
          to(domeTurn, 0, T.domeMs, Easing.out(Easing.quad)),
        ]).start();
      });
    });
    // Only the screen leaving clears these: the slam changes `phase`, and that must not cancel the pieces' own start.
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [falling, hangReady, reduceMotion]);

  if (!(pageWidth > 0 && contentBottom > 0)) return null;
  const L = layout;

  return (
    <>
      <Animated.Image
        source={require("../../assets/images/polybook/polybook_cage_rope.webp")}
        resizeMode="stretch"
        style={[styles.art, L.rope]}
      />
      {phase === "hanging" ? (
        <Animated.Image
          source={require("../../assets/images/polybook/polybook_cage_hang.webp")}
          resizeMode="stretch"
          onLoad={() => setHangReady(true)}
          style={[
            styles.art,
            {
              left: L.hang.left,
              top: L.hang.top,
              width: L.hang.width,
              height: L.hang.height,
              // An array, not a string: React Native's string parser (processTransformOrigin) cannot read decimals, so
              // "58.4px 10.5px" became (4px, 5px) of nonsense and threw the cage off the screen.
              transformOrigin: [L.hang.originX, L.hang.originY, 0],
              transform: [{ translateY: drop }, { rotate: swing.interpolate(DEG) }],
            },
          ]}
        />
      ) : (
        <>
          <Animated.Image
            source={require("../../assets/images/polybook/polybook_cage_base.webp")}
            resizeMode="stretch"
            style={[styles.art, { ...L.base, transformOrigin: "50% 100%", transform: [{ scaleY: squash }] }]}
          />
          <Animated.Image
            source={require("../../assets/images/polybook/polybook_cage_dome.webp")}
            resizeMode="stretch"
            style={[
              styles.art,
              {
                ...L.dome,
                transform: [{ translateX: domeX }, { translateY: domeY }, { rotate: domeTurn.interpolate(DEG) }],
              },
            ]}
          />
        </>
      )}
    </>
  );
}

// pointerEvents lives in a style because an RN Image has no such prop; explicit sizes come from the layout.
const styles = StyleSheet.create({
  art: { position: "absolute", pointerEvents: "none" },
});
