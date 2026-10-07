import React from 'react';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { POLLY_CLIPS, POLLY_CLIP_ASPECT, type PollyClipName } from '../ui/pollyClips';
import { POLLY_ACTING_SPRITES } from '../ui/pollyActingSprites';

type Props = {
  clip: PollyClipName;
  width: number;
  // Change this value to restart a clip from frame 0.
  playKey?: number | string;
  // When true the approved neutral still is shown instead of any motion.
  reduceMotion?: boolean;
  // Draws the approved neutral still over the clip so registration drift is visible.
  onionSkin?: boolean;
};

// TEST-ONLY. Plays a keyed animated-WebP Polly clip. Not used by any production screen.
export function PollyClipPlayer({ clip, width, playKey, reduceMotion, onionSkin }: Props) {
  const height = Math.round(width * POLLY_CLIP_ASPECT);

  if (reduceMotion) {
    return (
      <RNImage
        accessibilityIgnoresInvertColors
        source={POLLY_ACTING_SPRITES.neutral}
        resizeMode="contain"
        style={{ width, height }}
      />
    );
  }

  return (
    <View style={{ width, height }}>
      <Image
        key={`${clip}-${playKey ?? 0}`}
        accessibilityIgnoresInvertColors
        autoplay
        contentFit="contain"
        source={POLLY_CLIPS[clip].source}
        style={StyleSheet.absoluteFill}
      />
      {onionSkin ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <RNImage
            source={POLLY_ACTING_SPRITES.neutral}
            resizeMode="contain"
            style={[StyleSheet.absoluteFill, { opacity: 0.45 }]}
          />
        </View>
      ) : null}
    </View>
  );
}
