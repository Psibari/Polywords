import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import type { ResultsConsequence, ResultsConsequenceKind } from '../game/resultsAftermath';
import { PW } from '../ui/pwTheme';

const STATUS_ART: Record<ResultsConsequenceKind, ImageSourcePropType> = {
  mastered: require('../../assets/images/results/GoldenCrown.png'),
  haunted: require('../../assets/images/results/Padlock.png'),
  banished: require('../../assets/images/results/banishcrown.png'),
};

type Props = {
  consequences: ResultsConsequence[];
  onOpenJournal: () => void;
};

export function ResultsConsequencePanel({ consequences, onOpenJournal }: Props) {
  if (consequences.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>WHAT CHANGED</Text>
      <View style={styles.records}>
        {consequences.map((consequence, index) => (
          <View
            key={`${consequence.kind}-${consequence.word}-${index}`}
            style={[styles.record, index > 0 && styles.recordSecondary]}
          >
            <Image
              source={STATUS_ART[consequence.kind]}
              resizeMode="contain"
              style={[styles.statusArt, index > 0 && styles.statusArtSecondary]}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.copyBlock}>
              <Text
                style={styles.word}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {consequence.word}
              </Text>
              <Text style={styles.copy}>{consequence.copy}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="See what Polly wrote in the Polybook Journal"
        onPress={onOpenJournal}
        style={({ pressed }) => [styles.journalButton, pressed && styles.pressed]}
      >
        <Text style={styles.journalKicker}>POLLY WROTE ABOUT THIS</Text>
        <Text
          style={styles.journalAction}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          SEE WHAT POLLY WROTE  ›
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  kicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 2.6,
    textAlign: 'center',
    marginBottom: 8,
  },
  records: {
    borderRadius: PW.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.38)',
    backgroundColor: 'rgba(15,13,42,0.78)',
    overflow: 'hidden',
  },
  record: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  recordSecondary: {
    minHeight: 80,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,200,66,0.20)',
  },
  statusArt: {
    width: 92,
    height: 78,
    marginRight: 6,
  },
  statusArtSecondary: {
    width: 74,
    height: 62,
    marginLeft: 8,
    marginRight: 16,
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
  },
  word: {
    color: PW.color.softWhite,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 30,
    letterSpacing: 1.8,
    lineHeight: 34,
  },
  copy: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  journalButton: {
    marginTop: 8,
    minHeight: 74,
    borderRadius: PW.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(179,136,255,0.58)',
    backgroundColor: 'rgba(123,45,139,0.22)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalKicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 1.05,
    opacity: 0.88,
  },
  journalAction: {
    color: PW.color.lavender,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: 1.15,
    marginTop: 4,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
