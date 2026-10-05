import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import type { ResultsConsequence, ResultsConsequenceKind } from '../game/resultsAftermath';
import { PW } from '../ui/pwTheme';

const CROWNS: Record<ResultsConsequenceKind, ImageSourcePropType> = {
  mastered: require('../../assets/images/results/GoldenCrown.png'),
  haunted: require('../../assets/images/results/hauntcrown.png'),
  banished: require('../../assets/images/results/banishcrown.png'),
};

const STATUS_LABEL: Record<ResultsConsequenceKind, string> = {
  mastered: 'MASTERED',
  haunted: 'HAUNTED',
  banished: 'BANISHED',
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
              source={CROWNS[consequence.kind]}
              resizeMode="contain"
              style={[styles.crown, index > 0 && styles.crownSecondary]}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.copyBlock}>
              <Text style={styles.status}>{STATUS_LABEL[consequence.kind]}</Text>
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
        <Text style={styles.journalAction}>SEE WHAT POLLY WROTE  ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
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
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  recordSecondary: {
    minHeight: 86,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,200,66,0.20)',
  },
  crown: {
    width: 94,
    height: 82,
    marginRight: 12,
  },
  crownSecondary: {
    width: 76,
    height: 66,
    marginLeft: 9,
    marginRight: 21,
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
  },
  status: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 2.2,
    marginBottom: 1,
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
    borderRadius: PW.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(179,136,255,0.42)',
    backgroundColor: 'rgba(123,45,139,0.18)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  journalKicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  journalAction: {
    color: PW.color.lavender,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
