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
  /** Which way the tail points. 'up' sits at the top-left, for a speaker above. */
  tail?: 'left' | 'up';
};

// All four surfaces (Home, Results, Hunt, Daily) are expected to inherit these
// defaults. A per-surface fontSize/lineHeight override is a layout escape
// hatch, not a style choice — reach for maxWidth first.
export function PollySpeechBubble({
  line,
  maxWidth = 190,
  fontSize = homeType.greeting,
  lineHeight = 24,
  tone = 'default',
  tail = 'left',
}: Props) {
  const up = tail === 'up';
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
      {up ? (
        <>
          <View style={[styles.tailUpBorder, tone === 'loss' && styles.tailUpBorderLoss]} />
          <View style={[styles.tailUpFill, tone === 'loss' && styles.tailUpFillLoss]} />
        </>
      ) : (
        <>
          <View style={[styles.tailBorder, tone === 'loss' && styles.tailBorderLoss]} />
          <View style={[styles.tailFill, tone === 'loss' && styles.tailFillLoss]} />
        </>
      )}
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
  tailUpBorder: {
    position: 'absolute',
    left: 22,
    top: -9,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: 'transparent',
    borderBottomWidth: 9,
    borderBottomColor: homePerch.bubbleRim,
  },
  tailUpFill: {
    position: 'absolute',
    left: 22,
    top: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: 'transparent',
    borderBottomWidth: 9,
    borderBottomColor: homePerch.bubbleFace,
  },
  tailUpBorderLoss: {
    borderBottomColor: '#E24B4A',
  },
  tailUpFillLoss: {
    borderBottomColor: 'rgba(226,75,74,0.14)',
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
