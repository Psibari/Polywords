import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { VaultIntroOverlay } from '../components/VaultIntroOverlay';
import { VAULT_INTRO_SEEN_KEY } from '../constants/storageKeys';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import { VAULT_SKY_TUNING } from '../ui/ambientSkyTuning';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { cardMaterial, libraryMaterial, stageMaterial } from '../ui/pwMaterials';
import { vaultMaterial, vaultType } from '../ui/pwVaultMaterials';
import { Bookcase, VaultWordRecord } from '../components/ui/Bookcase';
import { FoilWord } from '../components/ui/FoilWord';
import { useGameStore } from '../store/useGameStore';
import { getTodayDateString } from '../game/dailyChallengeEngine';
import { getDisplayStreak } from '../game/dailyStreak';
import { resolveGhostPair, resolveMasteredPairs, pairsForWord } from '../game/hiddenPairIdentity';
import rawHuntData from '../../assets/data/huntData.json';

import { RANK_TIERS, getRankProgress, getRankTier } from '../game/ranks';

type HuntDataMask = { id: string; phrase: string; isReal: boolean };
type HuntDataEntry = { masks?: HuntDataMask[] };
const HUNT_DATA = rawHuntData as unknown as Record<string, HuntDataEntry>;

function realMasksFor(word: string): HuntDataMask[] {
  return (HUNT_DATA[word]?.masks ?? []).filter(mask => mask.isReal);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function vaultBookFor(
  word: string,
  claimedIds: Set<string>,
  masteredByWord: Map<string, { isBoss: boolean }>,
): VaultWordRecord | null {
  const realMasks = realMasksFor(word);
  const claimedCount = realMasks.filter(mask => claimedIds.has(mask.id)).length;
  const mastered = masteredByWord.get(word);
  if (claimedCount === 0 && !mastered) return null;
  return {
    word,
    ...(mastered?.isBoss ? { isBoss: true } : {}),
    isFinished: realMasks.length > 0 && claimedCount === realMasks.length,
    claimedCount,
    totalCount: realMasks.length,
  };
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

  const [vaultIntroSeen, setVaultIntroSeen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(VAULT_INTRO_SEEN_KEY)
      .then(v => setVaultIntroSeen(v === 'true'))
      .catch(() => setVaultIntroSeen(true));
  }, []);
  const handleVaultIntroDismiss = useCallback(() => {
    setVaultIntroSeen(true);
    AsyncStorage.setItem(VAULT_INTRO_SEEN_KEY, 'true').catch(() => {});
  }, []);

  const claimedIds = new Set(progress.realMaskIdsFound ?? []);
  const masteredByWord = new Map(progress.masteredWords.map(record => [record.word, record]));
  const books = Object.keys(HUNT_DATA)
    .map(word => vaultBookFor(word, claimedIds, masteredByWord))
    .filter((book): book is VaultWordRecord => book !== null);
  const finishedBooks = books.filter(book => book.isFinished).length;
  const tier = getRankTier(progress.personalBest);
  const rankProgress = getRankProgress(progress.personalBest, tier);
  const streak = getDisplayStreak(progress, getTodayDateString());

  const selectedBook = selectedWord
    ? books.find(book => book.word === selectedWord) ?? null
    : null;
  const selectedMastered = selectedWord
    ? progress.masteredWords.find(m => m.word === selectedWord) ?? null
    : null;
  const selectedGhost = selectedWord && !selectedMastered
    ? ghostsToShow.find(g => g.word === selectedWord) ?? null
    : null;
  const selectedHiddenMeanings = selectedMastered
    ? resolveMasteredPairs(selectedMastered).map(pair => pair.real)
    : [];
  const selectedGhostPair = selectedGhost ? resolveGhostPair(selectedGhost) : null;
  const selectedRealMeanings = selectedBook
    ? realMasksFor(selectedBook.word)
        .filter(mask => claimedIds.has(mask.id))
        .map(mask => mask.phrase)
    : [];
  const selectedGhostTotalPairs = selectedGhost ? pairsForWord(selectedGhost.word) : [];
  const selectedGhostCrackedCount = selectedGhost
    ? selectedGhostTotalPairs.filter(pair => (progress.hiddenPairIdsFound ?? []).includes(pair.id)).length
    : 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* STAGE — the shared night sky every other screen lives under, with
          the candle-lit vignette on top so the bookcase stays readable. */}
      <AmbientSkyBackground {...VAULT_SKY_TUNING} />
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
            <Text style={styles.statValue}>{(progress.realMaskIdsFound ?? []).length}</Text>
            <Text style={styles.statLabel}>MEANINGS TAKEN</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{books.length}</Text>
            <Text style={styles.statLabel}>BOOKS</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{finishedBooks}</Text>
            <Text style={styles.statLabel}>FINISHED</Text>
          </View>
        </View>

        <View style={styles.secondaryStatsRow}>
          <Text style={styles.secondaryStat}>MASTERED {progress.masteredWords.length}</Text>
          <Text style={styles.secondaryDot}>•</Text>
          <Text style={styles.secondaryStat}>HAUNTED {ghostsToShow.length}</Text>
          <Text style={styles.secondaryDot}>•</Text>
          <Text style={styles.secondaryStat}>STREAK {streak}</Text>
        </View>

        <Pressable
          style={styles.rankLink}
          onPress={() => setShowRanks(true)}
          accessibilityRole="button"
          accessibilityLabel={`Open run ranks. Current rank ${tier.letter}, ${tier.description}`}
        >
          <Text style={styles.rankLinkText}>RUN RANK {tier.letter}</Text>
          <View style={styles.rankLinkTrack}>
            <View style={[styles.rankLinkFill, { width: `${Math.round(rankProgress * 100)}%` }]} />
          </View>
        </Pressable>

        {/* The library */}
        <Bookcase
          books={books}
          ghosts={ghostsToShow}
          selectedWord={selectedWord}
          onSelect={setSelectedWord}
        />

        {books.length === 0 && (
          <Text style={styles.emptyLine}>Your first claimed meaning will open a book.</Text>
        )}
      </ScrollView>

      {(selectedBook || selectedGhost) && (
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
              {selectedBook ? (
                <FoilWord
                  word={selectedBook!.word}
                  baseStyle={styles.detailWord}
                  fontSize={40}
                />
              ) : (
                <Text style={[styles.detailWord, styles.detailWordGhost]} numberOfLines={1} adjustsFontSizeToFit>
                  {selectedGhost!.word}
                </Text>
              )}
            </View>
            {selectedBook && (
              <>
                <Text style={styles.detailLine}>
                  {selectedBook.isFinished
                    ? 'Every visible meaning claimed.'
                    : `${selectedBook.claimedCount} of ${selectedBook.totalCount} visible meanings claimed.`}
                </Text>
                {selectedMastered && (
                  <Text style={styles.detailLine}>
                    Mastered {formatDate(selectedMastered.dateMastered)}
                  </Text>
                )}
                {selectedMastered?.isBoss && (
                  <Text style={[styles.detailLine, styles.detailBoss]}>POLLY'S WORD — MASTERED</Text>
                )}
                {selectedMastered && (
                  <Text style={styles.detailLine}>
                    {selectedMastered.flawless ? 'Flawless mastery' : 'Mastered with visible mistakes'}
                  </Text>
                )}
                {selectedMastered && selectedHiddenMeanings.map((meaning, index) => (
                  <Text key={`${meaning}-${index}`} style={styles.detailLine}>
                    Hidden {index + 1}: {meaning}
                  </Text>
                ))}
                {selectedMastered && (selectedMastered.priorHauntAttempts ?? 0) > 0 && (
                  <Text style={styles.detailLine}>
                    Mastered after {selectedMastered.priorHauntAttempts} prior {selectedMastered.priorHauntAttempts === 1 ? 'Haunt' : 'Haunts'}
                  </Text>
                )}
                {selectedRealMeanings.length > 0 && (
                  <View style={styles.detailMeaningsBlock}>
                    <Text style={styles.detailMeaningsTitle}>CLAIMED MEANINGS</Text>
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
                {selectedGhostPair?.real && (
                  <Text style={styles.detailLine}>Hidden meaning: {selectedGhostPair.real}</Text>
                )}
                {selectedGhostPair?.trap && (
                  <Text style={[styles.detailLine, styles.detailTrap]}>
                    Watch for: {selectedGhostPair.trap}
                  </Text>
                )}
                {selectedGhostCrackedCount > 0 && (
                  <Text style={styles.detailLine}>
                    Cracked {selectedGhostCrackedCount} of {selectedGhostTotalPairs.length} hidden meanings.
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

      {vaultIntroSeen === false && (
        <VaultIntroOverlay onDismiss={handleVaultIntroDismiss} />
      )}
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
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: -6,
    marginBottom: 14,
  },
  secondaryStat: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 1.2,
    color: PW.color.mutedWhite,
  },
  secondaryDot: {
    color: vaultMaterial.bookplateSeal,
    fontSize: 12,
  },
  rankLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  rankLinkText: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 1.5,
    color: vaultMaterial.bookplateSeal,
  },
  rankLinkTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: vaultMaterial.bookplateTrack,
    overflow: 'hidden',
  },
  rankLinkFill: {
    height: 3,
    backgroundColor: vaultMaterial.bookplateProgress,
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
