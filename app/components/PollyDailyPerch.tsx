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
import {
  DAILY_FIRST_MISS_LINE,
  DAILY_LOSS_LINE,
  DAILY_WIN_LINE,
  DailyPollyReaction,
} from '../ui/pwDailyMaterials';
import { playSfx } from '../audio/sfx';
import { POLLY_ANIMATIONS } from '../animations/pollyAnimations';

type Props = {
  reaction: DailyPollyReaction | null;
  show?: boolean;
};

// Clean full-pose drawings (no rig seams). The expression lives in the art;
// life + menace come from whole-image motion + the SFX.
const POSE: Record<'idle' | 'happy' | 'laughing' | 'shocked', ImageSourcePropType> = {
  idle: POLLY_ANIMATIONS.idle,
  happy: POLLY_ANIMATIONS.tauntPoint,
  laughing: POLLY_ANIMATIONS.laugh,
  shocked: POLLY_ANIMATIONS.bossWarning,
};

function getLine(reaction: DailyPollyReaction | null): string {
  if (reaction === 'happy') return DAILY_FIRST_MISS_LINE;
  if (reaction === 'laughing') return DAILY_LOSS_LINE;
  if (reaction === 'shocked') return DAILY_WIN_LINE;
  return '';
}

export default function PollyDailyPerch({ reaction, show = true }: Props) {
  const [pose, setPose] = useState<ImageSourcePropType>(POSE.idle);

  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(280)).current;

  // Whole-image drivers (no part seams possible — we only move the whole image).
  const breatheY = useRef(new Animated.Value(0)).current;
  const reactX = useRef(new Animated.Value(0)).current;
  const reactY = useRef(new Animated.Value(0)).current;
  const reactScale = useRef(new Animated.Value(1)).current;

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  // Slow, continuous breath — always alive but quiet (menacing).
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheY, {
          toValue: -6,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breatheY, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breatheY]);

  useEffect(() => {
    if (show) {
      Animated.spring(slideY, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 280,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    const isReacting =
      reaction === 'happy' || reaction === 'laughing' || reaction === 'shocked';

    if (!isReacting) {
      setPose(POSE.idle);
      reactX.setValue(0);
      reactY.setValue(0);
      reactScale.setValue(1);
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    setPose(POSE[reaction]);
    if (reaction === 'laughing') playSfx('pollySqwawkLaugh');
    else playSfx('pollySqwawkShort');

    reactX.setValue(0);
    reactY.setValue(0);
    reactScale.setValue(1);

    if (reaction === 'laughing') {
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
    } else if (reaction === 'happy') {
      // Cold, slow lean toward the puzzle (she's on the right → lean left).
      Animated.sequence([
        Animated.timing(reactX, { toValue: -12, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 540, delay: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else {
      // Shocked: fast recoil pop.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 320, delay: 60, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactY, { toValue: -10, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactY, { toValue: 0, duration: 400, delay: 80, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }

    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setPose(POSE.idle);
      });
    }, 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction]);

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      {/* Speech bubble — to Polly's left, tail points right at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{getLine(reaction)}</Text>
        </View>
        <View style={styles.tailBorder} />
        <View style={styles.tailFill} />
      </Animated.View>

      {/* Polly — clean full pose, whole-image motion, bottom-right facing left */}
      <Animated.View
        style={[
          styles.pollyWrap,
          {
            transform: [
              { translateX: reactX },
              { translateY: breatheY },
              { translateY: reactY },
              { scale: reactScale },
            ],
          },
        ]}
      >
        <Image source={pose} style={styles.pollyImage} resizeMode="contain" />
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
    right: 0,
    bottom: 0,
    width: 220,
    height: 220,
  },
  pollyImage: {
    width: 220,
    height: 220,
  },
  bubbleWrap: {
    position: 'absolute',
    right: 212,
    bottom: 120,
  },
  bubble: {
    backgroundColor: '#1A1055',
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 220,
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
    right: -9,
    bottom: 12,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 9,
    borderLeftColor: 'rgba(245,200,66,0.55)',
  },
  tailFill: {
    position: 'absolute',
    right: -7,
    bottom: 12,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 9,
    borderLeftColor: '#1A1055',
  },
});
