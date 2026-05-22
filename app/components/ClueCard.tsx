import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mask } from '../game/types';

type Props = {
  mask: Mask;
  isActive: boolean;
  isPassed: boolean;
};

const COLORS = {
  bg: '#1a1a1a',
  card: '#24175A',
  purple: '#8B5CF6',
  white: '#FFFFFF',
  blue: '#0ea5e9',
};

export default function ClueCard({ mask, isActive, isPassed }: Props) {
  return (
    <View style={[
      styles.card,
      isActive && styles.cardActive,
      isPassed && styles.cardPassed,
    ]}>
      <Text style={styles.emoji}>{mask.emoji}</Text>
      <Text style={[styles.clueText, isPassed && styles.clueTextPassed]}>
        {mask.phrase}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  cardActive: {
    borderColor: COLORS.blue,
    borderWidth: 2,
  },
  cardPassed: {
    opacity: 0.3,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  clueText: {
    color: COLORS.white,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  clueTextPassed: {
    color: 'rgba(255,255,255,0.6)',
  },
});
