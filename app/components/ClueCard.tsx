import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clue } from '../game/types';

type Props = {
  clue: Clue;
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

function clueBadge(clue: Clue): string | null {
  if (clue.trickType === 'equation') return '🧮 SOLVE';
  if (clue.trickType === 'opposite') return '↩️ INVERSION';
  if (clue.isDecoy) return '⚠️ DECOY';
  return null;
}

export default function ClueCard({ clue, isActive, isPassed }: Props) {
  const badge = clueBadge(clue);

  return (
    <View style={[
      styles.card,
      isActive && styles.cardActive,
      isPassed && styles.cardPassed,
    ]}>
      {badge && (
        <View style={styles.badgeRow}>
          <View style={[styles.badge, clue.isDecoy && styles.badgeDecoy]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
      )}
      <Text style={[styles.clueText, isPassed && styles.clueTextPassed]}>
        {clue.text}
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
  },
  cardActive: {
    borderColor: COLORS.blue,
    borderWidth: 2,
  },
  cardPassed: {
    opacity: 0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: COLORS.purple,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeDecoy: {
    backgroundColor: '#6b7280',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  clueText: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  clueTextPassed: {
    color: 'rgba(255,255,255,0.6)',
  },
});
