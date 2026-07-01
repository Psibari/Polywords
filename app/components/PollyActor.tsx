import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import {
  POLLY_ANIMATIONS,
  POLLY_BRANCH,
  PollyAnimationState,
} from '../animations/pollyAnimations';
import { POLLY_RIG_SIZE, PollyRig } from './PollyRig';

const SHOW_POLLY_BRANCH = false;

type PollyActorProps = {
  state: PollyAnimationState;
  renderer?: 'flipbook' | 'rig';
};

export function PollyActor({ state, renderer = 'flipbook' }: PollyActorProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        renderer === 'rig' ? styles.rigOverlay : styles.flipbookOverlay,
      ]}
    >
      {renderer === 'rig' ? (
        <PollyRig state="idle" />
      ) : (
        <>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    zIndex: 0,
  },
  rigOverlay: {
    left: 4,
    bottom: 16,
    width: POLLY_RIG_SIZE,
    height: POLLY_RIG_SIZE,
  },
  flipbookOverlay: {
    left: 4,
    bottom: -4,
    width: 120,
    height: 240,
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
