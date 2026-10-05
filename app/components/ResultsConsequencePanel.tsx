import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { FONTS } from '../constants/fonts';
import type { ResultsConsequence, ResultsConsequenceKind } from '../game/resultsAftermath';
import { PW } from '../ui/pwTheme';

const STATUS_ART: Partial<Record<ResultsConsequenceKind, ImageSourcePropType>> = {
  mastered: require('../../assets/images/results/GoldenCrown.png'),
  banished: require('../../assets/images/results/banishcrown.png'),
};

function HauntedLock({ secondary = false }: { secondary?: boolean }) {
  const width = secondary ? 58 : 70;
  const height = secondary ? 58 : 70;
  return (
    <View style={[styles.lockSlot, secondary && styles.lockSlotSecondary]} accessibilityElementsHidden>
      <Svg width={width} height={height} viewBox="0 0 72 72">
        <Path
          d="M22 31V23C22 14.7 28.3 9 36 9s14 5.7 14 14v8"
          fill="none"
          stroke="#F5C842"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Rect x="13" y="28" width="46" height="36" rx="9" fill="#5B2678" stroke="#F5C842" strokeWidth="3" />
        <Rect x="18" y="33" width="36" height="26" rx="6" fill="#24183D" opacity="0.72" />
        <Circle cx="36" cy="44" r="5" fill="#F5C842" />
        <Path d="M33.5 47h5L41 56H31l2.5-9Z" fill="#F5C842" />
      </Svg>
    </View>
  );
}

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
        {consequences.map((consequence, index) => {
          const secondary = index > 0;
          return (
            <View
              key={`${consequence.kind}-${consequence.word}-${index}`}
              style={[styles.record, secondary && styles.recordSecondary]}
            >
              {consequence.kind === 'haunted' ? (
                <HauntedLock secondary={secondary} />
              ) : (
                <Image
                  source={STATUS_ART[consequence.kind]!}
                  resizeMode="contain"
                  style={[styles.statusArt, secondary && styles.statusArtSecondary]}
                  accessibilityIgnoresInvertColors
                />
              )}
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
          );
        })}
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
  lockSlot: {
    width: 92,
    height: 78,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockSlotSecondary: {
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
    marginTop: 7,
    borderRadius: PW.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(179,136,255,0.34)',
    backgroundColor: 'rgba(123,45,139,0.13)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  journalKicker: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 0.7,
    opacity: 0.82,
  },
  journalAction: {
    color: PW.color.lavender,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1.05,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
