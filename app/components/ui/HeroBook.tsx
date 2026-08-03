import React from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { HERO_BOOK_PERSPECTIVE } from '../../ui/heroBookMotion';
import { heroBookMaterial as M } from '../../ui/pwMaterials';
import { PW } from '../../ui/pwTheme';

export type HeroBookProps = {
  coverRotateX: Animated.AnimatedInterpolation<string>;
  intakeOpacity: Animated.Value;
  intakeScaleY: Animated.AnimatedInterpolation<number>;
  children: React.ReactNode;
};

const SOURCE_HEIGHT = 830;
const SOURCE_HINGE_Y = 88;
const HINGE_Y = (SOURCE_HINGE_Y / SOURCE_HEIGHT) * M.bookHeight;

const bookBase = require('../../../assets/images/hero-book-rig-v1/book-base.png');
const coverOuter = require('../../../assets/images/hero-book-rig-v1/cover-outer.png');
const coverInner = require('../../../assets/images/hero-book-rig-v1/cover-inner.png');

export default function HeroBook({
  coverRotateX,
  intakeOpacity,
  intakeScaleY,
  children,
}: HeroBookProps) {
  return (
    <View style={styles.book}>
      <Image
        resizeMode="stretch"
        source={bookBase}
        style={styles.rigImage}
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.coverPlane,
          {
            transform: [
              { perspective: HERO_BOOK_PERSPECTIVE },
              { translateY: HINGE_Y - (M.bookHeight / 2) },
              { rotateX: coverRotateX },
              { translateY: (M.bookHeight / 2) - HINGE_Y },
            ],
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.outerSurface]}>
          <Image
            resizeMode="stretch"
            source={coverOuter}
            style={styles.rigImage}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.intakeSeam,
              {
                opacity: intakeOpacity,
                transform: [{ scaleY: intakeScaleY }],
              },
            ]}
          />

          <View pointerEvents="none" style={styles.coverContent}>
            {children}
          </View>
        </View>

        <View style={[StyleSheet.absoluteFill, styles.innerSurface]}>
          <Image
            resizeMode="stretch"
            source={coverInner}
            style={styles.rigImage}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  book: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: M.bookHeight,
    overflow: 'visible',
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.60,
    shadowRadius: 16,
    elevation: 14,
  },
  rigImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  coverPlane: {
    backfaceVisibility: 'visible',
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.44,
    shadowRadius: 12,
    elevation: 10,
  },
  outerSurface: {
    backfaceVisibility: 'hidden',
  },
  innerSurface: {
    backfaceVisibility: 'hidden',
    transform: [{ rotateX: '180deg' }],
  },
  intakeSeam: {
    position: 'absolute',
    left: '13%',
    right: '12%',
    top: 161,
    height: 7,
    borderRadius: 4,
    backgroundColor: M.intakeGlow,
    shadowColor: M.goldTrim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.82,
    shadowRadius: 8,
    elevation: 5,
  },
  coverContent: {
    position: 'absolute',
    left: '19%',
    right: '18%',
    top: 48,
    bottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
