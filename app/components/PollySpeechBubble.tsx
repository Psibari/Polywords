import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { homePerch, homeType } from '../ui/pwHomeMaterials';

type Props = {
  line: string;
  maxWidth?: number;
  fontSize?: number;
  lineHeight?: number;
  tone?: 'default' | 'loss';
};

export function PollySpeechBubble({
  line,
  maxWidth = 190,
  fontSize = homeType.greeting,
  lineHeight = 22,
  tone = 'default',
}: Props) {
  return (
    <View>
      <View style={[
        styles.bubble,
        { maxWidth },
        tone === 'loss' && styles.bubbleLoss,
      ]}>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.text, { fontSize, lineHeight }, tone === 'loss' && styles.textLoss]}
        >
          {line}
        </Text>
      </View>
      <View style={[styles.tailBorder, tone === 'loss' && styles.tailBorderLoss]} />
      <View style={[styles.tailFill, tone === 'loss' && styles.tailFillLoss]} />
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
    includeFontPadding: false,
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
  bubbleLoss: {
    backgroundColor: 'rgba(226,75,74,0.14)',
    borderColor: '#E24B4A',
  },
  textLoss: {
    color: '#F5DCDC',
  },
  tailBorderLoss: {
    borderRightColor: '#E24B4A',
  },
  tailFillLoss: {
    borderRightColor: 'rgba(226,75,74,0.14)',
  },
});
