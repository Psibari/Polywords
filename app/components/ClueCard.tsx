import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clue, Meaning } from '../game/types';

type Props = {
  clue: Clue;
  meanings: Meaning[];
  locked: boolean;
  onSubmit: (meaningId: string) => void;
};

const COLORS = {
  bg: '#1A1040',
  card: '#24175A',
  card2: '#311F78',
  gold: '#FFD700',
  purple: '#8B5CF6',
  white: '#FFFFFF',
  muted: '#B8B3D9',
};

function clueBadge(clue: Clue): string | null {
  if (clue.isSlangClue) return '💬 SLANG';
  if (clue.isModernEraClue) return '🕰️ ERA SHIFT';
  return null;
}

export default function ClueCard({ clue, meanings, locked, onSubmit }: Props) {
  const badge = clueBadge(clue);

  return (
    <View style={styles.card}>
      {badge && (
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
      )}

      <Text style={styles.clueText}>{clue.text}</Text>

      <View style={styles.meaningList}>
        {meanings.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => !locked && onSubmit(m.id)}
            style={({ pressed }) => [
              styles.meaningButton,
              m.hidden && styles.meaningButtonHidden,
              locked && styles.meaningButtonLocked,
              pressed && !locked && styles.meaningButtonPressed,
            ]}
          >
            <Text style={styles.meaningIcon}>{m.icon}</Text>
            <Text style={styles.meaningLabel}>{m.label}</Text>
            {m.hidden && <Text style={styles.hiddenTag}>HIDDEN</Text>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: COLORS.purple,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  clueText: {
    color: COLORS.white,
    fontSize: 26,
    lineHeight: 35,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 28,
  },
  meaningList: {
    gap: 12,
  },
  meaningButton: {
    backgroundColor: COLORS.card2,
    borderColor: 'rgba(255,215,0,0.25)',
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  meaningButtonHidden: {
    borderColor: COLORS.purple,
    borderStyle: 'dashed',
  },
  meaningButtonLocked: {
    opacity: 0.5,
  },
  meaningButtonPressed: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  meaningIcon: {
    fontSize: 28,
  },
  meaningLabel: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
  },
  hiddenTag: {
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
