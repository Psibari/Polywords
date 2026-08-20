import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dailyScrollMaterial as M, dailyPanelFrameMaterial as F } from '../../ui/pwDailyMaterials';

export type DailyPanelFrameState = 'idle' | 'revealing' | 'perfect';

type Props = {
  state: DailyPanelFrameState;
  children: React.ReactNode;
};

const PIN_SIZE = 6;
const INSET = 8;

const stoneTileTexture = require('../../../assets/images/textures/stoneTile.png');

export default function DailyPanelFrame({ state, children }: Props) {
  const borderColor =
    state === 'perfect' ? F.borderPerfect : state === 'revealing' ? F.borderRevealing : F.border;
  const borderWidth = state === 'idle' ? 1.5 : 3;

  return (
    <View style={styles.outer}>
      <ImageBackground
        source={stoneTileTexture}
        resizeMode="repeat"
        style={[styles.inner, { borderColor, borderWidth }]}
        imageStyle={styles.innerTexture}
      >
        <View style={styles.insetTrim} />
        <LinearGradient
          colors={[F.sheenTop, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.sheen}
        />
        {children}
      </ImageBackground>
      <View style={[styles.pin, styles.pinTL]} />
      <View style={[styles.pin, styles.pinTR]} />
      <View style={[styles.pin, styles.pinBL]} />
      <View style={[styles.pin, styles.pinBR]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    position: 'relative',
  },
  inner: {
    flex: 1,
    borderRadius: M.radius,
    overflow: 'hidden',
  },
  innerTexture: {
    borderRadius: M.radius,
  },
  insetTrim: {
    position: 'absolute',
    top: INSET,
    left: INSET,
    right: INSET,
    bottom: INSET,
    borderWidth: 1,
    borderColor: F.insetTrim,
    borderRadius: Math.max(M.radius - INSET, 0),
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  pin: {
    position: 'absolute',
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: F.pin,
    borderWidth: 1,
    borderColor: F.pinInner,
  },
  pinTL: { top: -3, left: -3 },
  pinTR: { top: -3, right: -3 },
  pinBL: { bottom: -3, left: -3 },
  pinBR: { bottom: -3, right: -3 },
});
