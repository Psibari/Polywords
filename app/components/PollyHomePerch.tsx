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
import Svg, { Rect } from 'react-native-svg';
import { FONTS } from '../constants/fonts';
import { POLLY_POSES } from '../ui/pollyPoses';
import { HOME_GREETING_LINES, homePerch, homeType } from '../ui/pwHomeMaterials';

// Once per app session: fly-in + one greeting. Navigating away re-mounts
// Home, but Polly is already at her post — no re-entrance, no re-greeting.
let enteredThisSession = false;
let greetingCursor = Math.floor(Math.random() * HOME_GREETING_LINES.length);

export default function PollyHomePerch() {
  const isEntrance = !enteredThisSession;
  const [pose, setPose] = useState<ImageSourcePropType>(
    isEntrance ? POLLY_POSES.fly : POLLY_POSES.idle,
  );
  const [line] = useState(
    () => HOME_GREETING_LINES[greetingCursor % HOME_GREETING_LINES.length],
  );

  const slideY = useRef(new Animated.Value(isEntrance ? 300 : 0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const breatheY = useRef(new Animated.Value(0)).current;
  const breatheX = useRef(new Animated.Value(0)).current;

  // Entrance + one greeting (setTimeout between phases, per animation rules).
  useEffect(() => {
    if (!isEntrance) return;
    enteredThisSession = true;
    greetingCursor += 1;

    Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    const poseT = setTimeout(() => setPose(POLLY_POSES.idle), 650);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same breath + sway recipe as the Daily perch: offset periods = organic.
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
      {/* Stone ledge — rooted off the left edge, warm stone family */}
      <Svg width={210} height={36} style={styles.ledge}>
        <Rect x={0} y={0} width={206} height={12} rx={5} fill={homePerch.ledgeTop} />
        <Rect x={0} y={11} width={198} height={16} rx={4} fill={homePerch.ledgeFace} />
        <Rect x={0} y={26} width={188} height={8} rx={3} fill={homePerch.ledgeShadow} />
      </Svg>

      {/* Polly — whole-image motion only */}
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
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line}</Text>
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
    bottom: homePerch.bottomOffset,
    width: 300,
    height: homePerch.pollySize + 40,
    pointerEvents: 'none',
  },
  ledge: {
    position: 'absolute',
    left: -28,
    bottom: 0,
  },
  pollyWrap: {
    position: 'absolute',
    left: -56,
    bottom: 18,
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  pollyImage: {
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 172,
    bottom: 150,
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
