import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import {
  POLLY_ANIMATIONS,
  POLLY_BRANCH,
  PollyAnimationState,
} from '../animations/pollyAnimations';

const SHOW_POLLY_BRANCH = false;

type PollyActorProps = {
  state: PollyAnimationState;
};

export function PollyActor({ state }: PollyActorProps) {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      {SHOW_POLLY_BRANCH && (
        <Image
          source={POLLY_BRANCH}
          style={styles.branch}
          contentFit="contain"
        />
      )}
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
    left: 4,
    bottom: -4,
    width: 120,
    height: 240,
    zIndex: 0,
  },
  branch: {
    position: 'absolute',
    left: -20,
    bottom: 52,
    width: 170,
    height: 18,
  },
  polly: {
    ...StyleSheet.absoluteFillObject,
  },
});
