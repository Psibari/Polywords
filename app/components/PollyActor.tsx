import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import {
  POLLY_ANIMATIONS,
  POLLY_BRANCH,
  PollyAnimationState,
} from '../animations/pollyAnimations';

type PollyActorProps = {
  state: PollyAnimationState;
};

export function PollyActor({ state }: PollyActorProps) {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Image
        source={POLLY_BRANCH}
        style={styles.branch}
        contentFit="contain"
      />
      <Image
        key={state}
        source={POLLY_ANIMATIONS[state]}
        style={styles.polly}
        contentFit="contain"
        autoplay
        recyclingKey={state}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: -8,
    bottom: -6,
    width: 170,
    height: 340,
  },
  branch: {
    position: 'absolute',
    left: -4,
    bottom: 75,
    width: 190,
    height: 20,
  },
  polly: {
    ...StyleSheet.absoluteFillObject,
  },
});
