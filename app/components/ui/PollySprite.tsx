import React from 'react';
import { Image, View, ViewStyle } from 'react-native';

export type PollyPose =
  | 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT'
  | 'MID_LEFT' | 'MID_CENTER' | 'MID_RIGHT'
  | 'BOT_LEFT' | 'BOT_CENTER' | 'BOT_RIGHT';

interface PollySpriteProps {
  pose: PollyPose;
  size: number;
  style?: ViewStyle;
}

const CELL_SIZE = 418;
const SHEET_SIZE = 1254;

const POSE_MAP: Record<PollyPose, [number, number]> = {
  TOP_LEFT:   [0, 0],
  TOP_CENTER: [0, 1],
  TOP_RIGHT:  [0, 2],
  MID_LEFT:   [1, 0],
  MID_CENTER: [1, 1],
  MID_RIGHT:  [1, 2],
  BOT_LEFT:   [2, 0],
  BOT_CENTER: [2, 1],
  BOT_RIGHT:  [2, 2],
};

export default function PollySprite({ pose, size, style }: PollySpriteProps) {
  const [row, col] = POSE_MAP[pose];
  const sheetDim   = SHEET_SIZE * (size / CELL_SIZE);

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden' }, style]}>
      <Image
        source={require('../../../assets/images/polly_sprite.png')}
        style={{
          width:      sheetDim,
          height:     sheetDim,
          marginLeft: -(col * size),
          marginTop:  -(row * size),
        }}
        resizeMode="cover"
      />
    </View>
  );
}
