import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { homePerch, homeType } from '../ui/pwHomeMaterials';

type Props = {
  line: string;
  maxWidth?: number;
  fontSize?: number;
  lineHeight?: number;
};

export function PollySpeechBubble({
  line,
  maxWidth = 190,
  fontSize = homeType.greeting,
  lineHeight = 22,
}: Props) {
  return (
    <View>
      <View style={[styles.bubble, { maxWidth }]}>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.text, { fontSize, lineHeight }]}
        >
          {line}
        </Text>
      </View>
      <View style={styles.tailBorder} />
      <View style={styles.tailFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: homePerch.bubbleFace,
    borderWidth: 1.5,
    borderColor: homePerch.bubbleRim,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontFamily: FONTS.brand,
    color: homePerch.bubbleText,
    flexWrap: 'wrap',
  },
  tailBorder: {
    position: 'absolute',
    left: -9,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: homePerch.bubbleRim,
  },
  tailFill: {
    position: 'absolute',
    left: -7,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: homePerch.bubbleFace,
  },
});
