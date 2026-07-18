import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import { useReducedMotionPreference } from '../../hooks/usePollyAmbientMotion';

// Source crop geometry (px) from the approved title-reveal render. WORDS_X is
// POLY's and WORDS's relative offset in that source frame; both pieces scale
// together from `width` so the lockup stays correctly spaced at any size.
const POLY_W = 566;
const POLY_H = 204;
const WORDS_W = 870;
const WORDS_H = 210;
const WORDS_X = 604;
const LOCKUP_W = WORDS_X + WORDS_W;
const LOCKUP_H = WORDS_H;
const HOME_WORDMARK_ASPECT_RATIO = LOCKUP_H / LOCKUP_W;

type Props = {
  width: number;
};

// Home masthead: POLY (purple) drops in, WORDS (gold) slides in from the
// lower right, settling into the lockup once on mount. Reduced motion skips
// straight to the settled position. Separate from BrandWordmark: the Home
// screen needs a large readable title; icon/splash assets keep their own lockup.
export function HomeWordmark({ width }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion !== false) return;
    t.setValue(0);
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, t]);

  const scale = width / LOCKUP_W;
  const height = width * HOME_WORDMARK_ASPECT_RATIO;

  const polyTranslateY = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [-46, 0, 0] });
  const polyOpacity = t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] });
  const wordsTranslateX = t.interpolate({
    inputRange: [0, 0.22, 0.75, 1],
    outputRange: [54, 54, 0, 0],
  });
  const wordsTranslateY = t.interpolate({
    inputRange: [0, 0.22, 0.75, 1],
    outputRange: [34, 34, 0, 0],
  });
  const wordsOpacity = t.interpolate({ inputRange: [0, 0.22, 0.6, 1], outputRange: [0, 0, 1, 1] });

  return (
    <Animated.View style={{ width, height }}>
      <Animated.View
        style={[
          styles.piece,
          {
            width: POLY_W * scale,
            height: POLY_H * scale,
            opacity: polyOpacity,
            transform: [{ translateY: polyTranslateY }],
          },
        ]}
      >
        <Image
          accessible={false}
          source={require('../../../assets/images/brand/home-title-poly.png')}
          resizeMode="contain"
          style={styles.fill}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.piece,
          {
            left: WORDS_X * scale,
            width: WORDS_W * scale,
            height: WORDS_H * scale,
            opacity: wordsOpacity,
            transform: [{ translateX: wordsTranslateX }, { translateY: wordsTranslateY }],
          },
        ]}
      >
        <Image
          accessible={false}
          source={require('../../../assets/images/brand/home-title-words.png')}
          resizeMode="contain"
          style={styles.fill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
