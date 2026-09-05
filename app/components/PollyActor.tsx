import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import {
  POLLY_ANIMATIONS,
  POLLY_BRANCH,
  PollyAnimationState,
} from '../animations/pollyAnimations';
import { PerformanceName } from '../animations/pollyPerformances';
import { POLLY_RIG_SIZE, PollyRig } from './PollyRig';

const SHOW_POLLY_BRANCH = false;

type PollyActorProps = {
  performance: PerformanceName;
  speaking?: boolean;
  renderer?: 'flipbook' | 'rig';
  flipbookState?: PollyAnimationState;
};

export function PollyActor({
  performance,
  speaking = false,
  renderer = 'rig',
  flipbookState = 'idle',
}: PollyActorProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        renderer === 'rig' ? styles.rigOverlay : styles.flipbookOverlay,
      ]}
    >
      {renderer === 'rig' ? (
        <PollyRig performance={performance} speaking={speaking} />
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
            key={flipbookState}
            source={POLLY_ANIMATIONS[flipbookState]}
            style={styles.polly}
            contentFit="contain"
            autoplay
            recyclingKey={flipbookState}
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
    ...StyleSheet.absoluteFill,
  },
});
