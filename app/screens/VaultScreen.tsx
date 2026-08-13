import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { cardMaterial, libraryMaterial, stageMaterial } from '../ui/pwMaterials';
import { vaultMaterial, vaultType } from '../ui/pwVaultMaterials';
import { Bookcase } from '../components/ui/Bookcase';
import { FoilWord } from '../components/ui/FoilWord';
import { useGameStore } from '../store/useGameStore';
import { getTodayDateString } from '../game/dailyChallengeEngine';
import { getDisplayStreak } from '../game/dailyStreak';
import rawHuntData from '../../assets/data/huntData.json';

import { RANK_TIERS, getRankProgress, getRankTier } from '../game/ranks';

type HuntDataMask = { phrase: string; isReal: boolean };
type HuntDataEntry = { masks?: HuntDataMask[] };
const HUNT_DATA = rawHuntData as unknown as Record<string, HuntDataEntry>;

function realMeaningsFor(word: string): string[] {
  return (HUNT_DATA[word]?.masks ?? [])
    .filter(mask => mask.isReal)
    .map(mask => mask.phrase);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Props = {
  navigation: any;
};

export default function VaultScreen({ navigation }: Props) {
  const progress = useGameStore(s => s.progress);
  const ghosts   = useGameStore(s => s.ghosts);

  // A re-ghosted master keeps its trophy spine; the rematch surfaces through
  // gameplay (haunt return), not the archive. Locked: mastery is permanent.
  const ghostsToShow = ghosts.filter(
    g => !progress.masteredWords.some(m => m.word === g.word),
  );

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showRanks, setShowRanks] = useState(false);

  const masteredNewestLast = progress.masteredWords; // shelf grows left→right, newest last
  const tier = getRankTier(progress.personalBest);
  const rankProgress = getRankProgress(progress.personalBest, tier);
  const streak = getDisplayStreak(progress, getTodayDateString());

  const selectedMastered = selectedWord
    ? progress.masteredWords.find(m => m.word === selectedWord) ?? null
    : null;
  const selectedGhost = selectedWord && !selectedMastered
    ? ghostsToShow.find(g => g.word === selectedWord) ?? null
    : null;
  const selectedHiddenMeanings = selectedMastered
    ? selectedMastered.hiddenMeaningsFound?.filter(Boolean)
      ?? (selectedMastered.hiddenMeaningFound ? [selectedMastered.hiddenMeaningFound] : [])
    : [];
  const selectedRealMeanings = selectedMastered ? realMeaningsFor(selectedMastered.word) : [];

  return (
    <SafeAreaView style={styles.screen}>
      {/* STAGE — night air, candle on the bookcase */}
      <View pointerEvents="none" style={styles.ambientWash} />
      <LinearGradient
        colors={[...stageMaterial.vignette]}
        locations={[...stageMaterial.vignetteLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.candlePool} />
      <View pointerEvents="none" style={styles.candleCore} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomNavContentPadding }}
      >
        {/* Header — archive language */}
        <Text style={styles.title}>WORD VAULT</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{progress.masteredWords.length}</Text>
            <Text style={styles.statLabel}>MASTERED</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{ghostsToShow.length}</Text>
            <Text style={styles.statLabel}>HAUNTED</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>
        </View>

        {/* Bookplate — parchment inset, tier seal; tap → rank ladder (Task 7) */}
        <Pressable
          style={styles.bookplate}
          onPress={() => setShowRanks(true)}
          accessibilityRole="button"
          accessibilityLabel={`Open rank ladder. Current rank ${tier.letter}, ${tier.description}`}
        >
          <View style={styles.bookplateInner}>
            <Text style={[styles.bookplateSeal, { color: tier.color }]}>{tier.letter}</Text>
            <View style={styles.bookplateMeta}>
              <Text style={styles.bookplateDesc}>{tier.description}</Text>
              <View style={styles.bookplateTrack}>
                <View style={[styles.bookplateFill, { width: `${Math.round(rankProgress * 100)}%` }]} />
              </View>
            </View>
          </View>
        </Pressable>

        {/* The library */}
        <Bookcase
          mastered={masteredNewestLast}
          ghosts={ghostsToShow}
          selectedWord={selectedWord}
          onSelect={setSelectedWord}
        />

        {progress.masteredWords.length === 0 && (
          <Text style={styles.emptyLine}>Your first mastered word will stand here.</Text>
        )}
      </ScrollView>

      {(selectedMastered || selectedGhost) && (
        <Pressable
          style={styles.panelScrim}
          onPress={() => setSelectedWord(null)}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Pressable
            style={[cardMaterial.base, styles.detailPanel]}
            onPress={() => {}}
            accessibilityViewIsModal
          >
            <View style={styles.detailTitleRow}>
              {selectedMastered ? (
                <FoilWord
                  word={selectedMastered.word}
                  baseStyle={styles.detailWord}
                  fontSize={40}
                />
              ) : (
                <Text style={[styles.detailWord, styles.detailWordGhost]} numberOfLines={1} adjustsFontSizeToFit>
                  {selectedGhost!.word}
                </Text>
              )}
            </View>
            {selectedMastered && (
              <>
                <Text style={styles.detailLine}>
                  Mastered {formatDate(selectedMastered.dateMastered)}
                </Text>
                {selectedMastered.isBoss && (
                  <Text style={[styles.detailLine, styles.detailBoss]}>POLLY'S WORD — MASTERED</Text>
                )}
                <Text style={styles.detailLine}>
                  {selectedMastered.flawless ? 'Flawless mastery' : 'Mastered with visible mistakes'}
                </Text>
                {selectedHiddenMeanings.map((meaning, index) => (
                  <Text key={`${meaning}-${index}`} style={styles.detailLine}>
                    Hidden {index + 1}: {meaning}
                  </Text>
                ))}
                {(selectedMastered.priorHauntAttempts ?? 0) > 0 && (
                  <Text style={styles.detailLine}>
                    Mastered after {selectedMastered.priorHauntAttempts} prior {selectedMastered.priorHauntAttempts === 1 ? 'Haunt' : 'Haunts'}
                  </Text>
                )}
                {selectedRealMeanings.length > 0 && (
                  <View style={styles.detailMeaningsBlock}>
                    <Text style={styles.detailMeaningsTitle}>MEANINGS</Text>
                    {selectedRealMeanings.map((meaning, index) => (
                      <Text key={`${meaning}-${index}`} style={styles.detailLine}>{meaning}</Text>
                    ))}
                  </View>
                )}
              </>
            )}
            {selectedGhost && (
              <>
                <Text style={styles.detailLine}>
                  Still haunted — missed {selectedGhost.runsMissed} {selectedGhost.runsMissed === 1 ? 'run' : 'runs'}.
                </Text>
                {selectedGhost.hiddenMeaningReal && (
                  <Text style={styles.detailLine}>Hidden meaning: {selectedGhost.hiddenMeaningReal}</Text>
                )}
                {selectedGhost.hiddenMeaningTrap && (
                  <Text style={[styles.detailLine, styles.detailTrap]}>
                    Watch for: {selectedGhost.hiddenMeaningTrap}
                  </Text>
                )}
                <Text style={styles.detailLine}>Run it back next Hunt.</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      )}

      {showRanks && (
        <Pressable
          style={styles.panelScrim}
          onPress={() => setShowRanks(false)}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Pressable
            style={[cardMaterial.base, styles.detailPanel]}
            onPress={() => {}}
            accessibilityViewIsModal
          >
            <Text style={styles.ranksTitle}>RANKS</Text>
            {RANK_TIERS.map(t => {
              const reachedAt = progress.rankHistory?.[t.letter];
              return (
                <View key={t.letter} style={styles.rankRow}>
                  <Text style={[styles.rankLetter, { color: t.color }]}>{t.letter}</Text>
                  <View style={styles.rankDescWrap}>
                    <Text style={styles.rankDesc}>{t.description}</Text>
                    {reachedAt && (
                      <Text style={styles.rankReached}>Reached {formatDate(reachedAt)}</Text>
                    )}
                  </View>
                  <Text style={styles.rankThreshold}>{t.threshold.toLocaleString()}</Text>
                </View>
              );
            })}
          </Pressable>
        </Pressable>
      )}

      <BottomNav active="Vault" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: stageMaterial.base,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: PW.space.screenX,
  },
  ambientWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: stageMaterial.purpleAmbient,
  },
  candlePool: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: stageMaterial.candleGlow,
  },
  candleCore: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    marginTop: 90,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(245,200,66,0.16)',
  },
  title: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 24,
    letterSpacing: 6,
    color: PW.color.softWhite,
    textAlign: 'center',
    marginTop: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  statChip: {
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
    backgroundColor: vaultMaterial.detailFace,
    borderWidth: 1,
    borderColor: vaultMaterial.detailRim,
    borderRadius: PW.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statValue: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 22,
    color: PW.color.gold,
  },
  statLabel: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 1.5,
    color: PW.color.mutedWhite,
    marginTop: 2,
  },
  bookplate: {
    backgroundColor: libraryMaterial.parchmentDeep,
    borderRadius: PW.radius.md,
    borderWidth: 2,
    borderColor: PW.color.goldSoft,
    padding: 3,
    marginBottom: 16,
  },
  bookplateInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: vaultMaterial.bookplateBorder,
    borderRadius: PW.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: vaultMaterial.bookplateFace,
  },
  bookplateSeal: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: vaultType.seal,
    color: vaultMaterial.bookplateSeal,
  },
  bookplateMeta: {
    flex: 1,
    gap: 6,
  },
  bookplateDesc: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: vaultType.sealLabel,
    color: vaultMaterial.bookplateSealText,
  },
  bookplateTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: vaultMaterial.bookplateTrack,
    overflow: 'hidden',
  },
  bookplateFill: {
    height: 4,
    backgroundColor: vaultMaterial.bookplateProgress,
  },
  emptyLine: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: vaultType.empty,
    color: vaultMaterial.emptyText,
    textAlign: 'center',
    marginTop: 18,
  },
  panelScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: vaultMaterial.panelScrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  detailPanel: {
    alignSelf: 'stretch',
    gap: 8,
  },
  detailTitleRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  detailWord: {
    fontSize: vaultType.detailWord,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  detailWordGhost: {
    color: vaultMaterial.detailGhostText,
  },
  detailLine: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: vaultType.detailCopy,
    lineHeight: 21,
    color: vaultMaterial.detailText,
    textAlign: 'center',
  },
  detailBoss: {
    color: vaultMaterial.detailBoss,
    letterSpacing: 1.5,
  },
  detailTrap: {
    color: vaultMaterial.detailGhostText,
  },
  detailMeaningsBlock: {
    marginTop: 4,
    gap: 4,
  },
  detailMeaningsTitle: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 2,
    color: vaultMaterial.bookplateSeal,
    textAlign: 'center',
    marginBottom: 2,
  },
  ranksTitle: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: vaultType.rankTitle,
    letterSpacing: 4,
    color: vaultMaterial.bookplateSeal,
    textAlign: 'center',
    marginBottom: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: vaultMaterial.rankSeparator,
  },
  rankLetter: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: vaultType.rankLetter,
    width: 78,
    color: vaultMaterial.rankText,
  },
  rankDescWrap: {
    flex: 1,
    gap: 2,
  },
  rankDesc: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: vaultType.rankRow,
    color: vaultMaterial.rankText,
  },
  rankReached: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 12,
    color: PW.color.mutedWhite,
  },
  rankThreshold: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: vaultType.rankRow,
    color: vaultMaterial.rankText,
  },
});
