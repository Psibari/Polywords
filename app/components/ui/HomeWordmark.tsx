import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import { useReducedMotionPreference } from '../../hooks/usePollyAmbientMotion';
import { HOME_TAGLINE } from '../../ui/pwHomeMaterials';

// Source crop geometry (px) from the approved title-reveal render. Lockup and
// tagline are two separate pieces cropped from the same frame; GAP is the
// vertical space between them, all scaled together from `width` so the whole
// unit stays correctly proportioned at any size.
const LOCKUP_W = 1558;
const LOCKUP_H = 251;
const TAGLINE_W = 1462;
const TAGLINE_H = 208;
const GAP = 51;

type Props = {
  width: number;
};

// Home masthead: the POLYWORDS lockup fades in, and the "WORDS HAVE MEANING"
// tagline types itself on via a left-to-right wipe, revealing its own curl
// flourish as it goes. Both pieces are baked-in pixels from the approved
// title-reveal render (not live text) since the tagline's hand-drawn font
// isn't one bundled with the app. Reduced motion skips straight to settled.
export function HomeWordmark({ width }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const lockupOpacity = useRef(new Animated.Value(0)).current;
  const tagWipe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion !== false) {
      lockupOpacity.setValue(1);
      tagWipe.setValue(1);
      return;
    }
    lockupOpacity.setValue(0);
    tagWipe.setValue(0);
    const anim = Animated.parallel([
      Animated.timing(lockupOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tagWipe, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, lockupOpacity, tagWipe]);

  const scale = width / LOCKUP_W;
  const lockupHeight = LOCKUP_H * scale;
  const tagWidth = TAGLINE_W * scale;
  const tagHeight = TAGLINE_H * scale;
  const gap = GAP * scale;
  const height = lockupHeight + gap + tagHeight;

  const tagRevealWidth = tagWipe.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tagWidth],
  });

  return (
    <Animated.View
      accessible
      accessibilityLabel={`POLYWORDS. ${HOME_TAGLINE}`}
      style={{ width, height }}
    >
      <Animated.View
        style={[styles.lockup, { width, height: lockupHeight, opacity: lockupOpacity }]}
      >
        <Image
          accessible={false}
          source={require('../../../assets/images/brand/home-title-lockup.png')}
          resizeMode="contain"
          style={styles.fill}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.tagWrap,
          { top: lockupHeight + gap, width: tagRevealWidth, height: tagHeight },
        ]}
      >
        <Image
          accessible={false}
          source={require('../../../assets/images/brand/home-title-tagline.png')}
          resizeMode="contain"
          style={[styles.fill, { width: tagWidth }]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tagWrap: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
