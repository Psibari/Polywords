import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { cardMaterial, libraryMaterial, stageMaterial } from '../ui/pwMaterials';
import { Bookcase } from '../components/ui/Bookcase';
import { FoilWord } from '../components/ui/FoilWord';
import { useGameStore } from '../store/useGameStore';

type RankTier = {
  letter:      string;
  label:       string;
  threshold:   number;
  nextAt:      number | null;
  color:       string;
  description: string;
};

const RANK_TIERS: RankTier[] = [
  { letter: 'D',      label: 'D',      threshold: 0,     nextAt: 8000,  color: 'rgba(255,255,255,0.45)', description: 'Just getting started.'   },
  { letter: 'C',      label: 'C',      threshold: 8000,  nextAt: 11000, color: '#FFFFFF',                description: 'Warming up.'             },
  { letter: 'B',      label: 'B',      threshold: 11000, nextAt: 14000, color: '#FFFFFF',                description: 'Getting sharper.'        },
  { letter: 'A',      label: 'A',      threshold: 14000, nextAt: 18000, color: '#FFFFFF',                description: 'Polly noticed.'          },
  { letter: 'S',      label: 'S',      threshold: 18000, nextAt: 22000, color: '#F5C842',                description: 'Better than Polly.'      },
  { letter: 'MASTER', label: 'MASTER', threshold: 22000, nextAt: null,  color: '#F5C842',                description: 'The title is yours.'     },
];

function getRankTier(score: number): RankTier {
  const reversed = [...RANK_TIERS].reverse();
  return reversed.find(t => score >= t.threshold) ?? RANK_TIERS[0];
}

function getRankProgress(score: number, tier: RankTier): number {
  if (!tier.nextAt) return 1;
  const range = tier.nextAt - tier.threshold;
  if (range <= 0) return 1;
  return Math.min((score - tier.threshold) / range, 1);
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

  const selectedMastered = selectedWord
    ? progress.masteredWords.find(m => m.word === selectedWord) ?? null
    : null;
  const selectedGhost = selectedWord && !selectedMastered
    ? ghostsToShow.find(g => g.word === selectedWord) ?? null
    : null;

  return (
    <SafeAreaView style={styles.screen}>
      {/* STAGE — night air, candle on the bookcase */}
      <LinearGradient
        colors={[...stageMaterial.vignette]}
        locations={[...stageMaterial.vignetteLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.candlePool} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomNavContentPadding }}
      >
        {/* Header — archive language */}
        <Text style={styles.title}>WORD VAULT</Text>
        <Text style={styles.counts}>
          {progress.masteredWords.length} RECLAIMED · {ghostsToShow.length} HAUNTED
        </Text>

        {/* Bookplate — parchment inset, tier seal; tap → rank ladder (Task 7) */}
        <Pressable style={styles.bookplate} onPress={() => setShowRanks(true)}>
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
          <Text style={styles.emptyLine}>Your first reclaimed word will stand here.</Text>
        )}
      </ScrollView>

      {(selectedMastered || selectedGhost) && (
        <Pressable style={styles.panelScrim} onPress={() => setSelectedWord(null)}>
          <Pressable style={[cardMaterial.base, styles.detailPanel]} onPress={() => {}}>
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
                  Reclaimed {formatDate(selectedMastered.dateMastered)}
                </Text>
                {selectedMastered.isBoss && (
                  <Text style={[styles.detailLine, styles.detailBoss]}>POLLY'S WORD — TAKEN</Text>
                )}
                {selectedMastered.hiddenMeaningFound.length > 0 && (
                  <Text style={styles.detailLine}>
                    Hidden meaning: {selectedMastered.hiddenMeaningFound}
                  </Text>
                )}
              </>
            )}
            {selectedGhost && (
              <>
                <Text style={styles.detailLine}>
                  Still haunted — missed {selectedGhost.runsMissed} {selectedGhost.runsMissed === 1 ? 'run' : 'runs'}.
                </Text>
                <Text style={styles.detailLine}>Win it back in the next Hunt.</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      )}

      {showRanks && (
        <Pressable style={styles.panelScrim} onPress={() => setShowRanks(false)}>
          <Pressable style={[cardMaterial.base, styles.detailPanel]} onPress={() => {}}>
            <Text style={styles.ranksTitle}>RANKS</Text>
            {RANK_TIERS.map(t => (
              <View key={t.letter} style={styles.rankRow}>
                <Text style={[styles.rankLetter, { color: t.color }]}>{t.letter}</Text>
                <Text style={styles.rankDesc}>{t.description}</Text>
                <Text style={styles.rankThreshold}>{t.threshold.toLocaleString()}</Text>
              </View>
            ))}
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
  candlePool: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: stageMaterial.candleGlow,
  },
  title: {
    fontFamily: FONTS.label,
    fontSize: 24,
    letterSpacing: 6,
    color: PW.color.softWhite,
    textAlign: 'center',
    marginTop: 18,
  },
  counts: {
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 2.5,
    color: PW.color.mutedWhite,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
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
    borderColor: PW.color.amber,
    borderRadius: PW.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bookplateSeal: {
    fontFamily: FONTS.wordDisplay,
    fontSize: 34,
  },
  bookplateMeta: {
    flex: 1,
    gap: 6,
  },
  bookplateDesc: {
    fontFamily: FONTS.brand,
    fontSize: 13,
    color: 'rgba(15,13,42,0.85)', // ink on parchment
  },
  bookplateTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15,13,42,0.30)', // surfaceDeep family — track on parchment
    overflow: 'hidden',
  },
  bookplateFill: {
    height: 4,
    backgroundColor: PW.color.amber,
  },
  emptyLine: {
    fontFamily: FONTS.brand,
    fontSize: 15,
    color: PW.color.mutedWhite,
    textAlign: 'center',
    marginTop: 18,
  },
  panelScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,4,22,0.72)',
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
    fontSize: 40,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  detailWordGhost: {
    color: PW.color.lavender,
  },
  detailLine: {
    fontFamily: FONTS.brand,
    fontSize: 15,
    lineHeight: 21,
    color: PW.color.softWhite,
    textAlign: 'center',
  },
  detailBoss: {
    color: PW.color.gold,
    letterSpacing: 1.5,
  },
  ranksTitle: {
    fontFamily: FONTS.label,
    fontSize: 16,
    letterSpacing: 4,
    color: PW.color.gold,
    textAlign: 'center',
    marginBottom: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  rankLetter: {
    fontFamily: FONTS.wordDisplay,
    fontSize: 22,
    width: 78,
  },
  rankDesc: {
    flex: 1,
    fontFamily: FONTS.brand,
    fontSize: 13,
    color: PW.color.mutedWhite,
  },
  rankThreshold: {
    fontFamily: FONTS.label,
    fontSize: 12,
    color: PW.color.faintWhite,
  },
});
