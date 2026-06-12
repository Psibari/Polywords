import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';
import { MasteredWordRecord } from '../game/types';

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

type VaultSectionKey = 'mastered' | 'ghosts' | 'hidden' | 'ranks';

const sections: Array<{
  key: VaultSectionKey;
  label: string;
  title: string;
  emptyCopy: string;
  accent: string;
}> = [
  {
    key: 'mastered',
    label: 'Mastered Words',
    title: 'Mastered Words',
    emptyCopy: 'Fully reclaimed words live here.',
    accent: '#F5C842',
  },
  {
    key: 'ghosts',
    label: 'Ghost Words',
    title: 'Ghost Words',
    emptyCopy: 'Missed meanings waiting for a rematch.',
    accent: '#9B2D6B',
  },
  {
    key: 'hidden',
    label: 'Hidden Meanings',
    title: 'Hidden Meanings',
    emptyCopy: 'Rare meanings you cracked open.',
    accent: '#7B2D8B',
  },
  {
    key:       'ranks',
    label:     'Ranks',
    title:     'Ranks',
    emptyCopy: '',
    accent:    '#F5C842',
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Props = {
  navigation: any;
};

export default function VaultScreen({ navigation }: Props) {
  const [activeSection, setActiveSection] = useState<VaultSectionKey>('mastered');
  const currentSection = sections.find(s => s.key === activeSection) ?? sections[0];

  const progress = useGameStore(s => s.progress);
  const ghosts   = useGameStore(s => s.ghosts);

  const masteredCount     = progress.masteredWords.length;
  const ghostCount        = ghosts.length;
  const hiddenFoundCount  = progress.masteredWords.filter(m => m.hiddenMeaningFound).length;

  const masteredNewestFirst = [...progress.masteredWords].reverse();
  const hiddenFound = progress.masteredWords.filter(m => m.hiddenMeaningFound);

  const statsRow = [
    { label: 'Mastered', value: String(masteredCount), accent: '#F5C842' },
    { label: 'Ghosts',   value: String(ghostCount),    accent: '#9B2D6B' },
    { label: 'Hidden Found', value: String(hiddenFoundCount), accent: '#7B2D8B' },
  ];

  function renderSectionContent() {
    if (activeSection === 'mastered') {
      if (masteredNewestFirst.length === 0) {
        return <EmptyState copy={currentSection.emptyCopy} />;
      }
      return (
        <View style={styles.plaqueShelf}>
          {masteredNewestFirst.map((record: MasteredWordRecord) => (
            <View
              key={record.word}
              style={[styles.wordPlaque, record.isBoss && styles.wordPlaqueBoss]}
            >
              {record.isBoss && <View style={styles.wordPlaqueBossAccent} />}
              <View style={styles.wordPlaqueRow}>
                <Text style={styles.wordPlaqueText}>{record.word}</Text>
                <Text style={styles.wordPlaqueDate}>{formatDate(record.dateMastered)}</Text>
              </View>
              {record.hiddenMeaningFound ? (
                <Text style={styles.wordPlaqueSub}>{record.hiddenMeaningFound}</Text>
              ) : (
                <Text style={styles.wordPlaqueSub}>Core vaulted</Text>
              )}
            </View>
          ))}
        </View>
      );
    }

    if (activeSection === 'ghosts') {
      if (ghosts.length === 0) {
        return <EmptyState copy={currentSection.emptyCopy} />;
      }
      return (
        <View style={styles.plaqueShelf}>
          {ghosts.map(ghost => (
            <View key={ghost.wordId} style={styles.ghostCard}>
              <View style={styles.ghostCardRow}>
                <Text style={styles.ghostCardWord}>{ghost.word}</Text>
                <Text style={styles.ghostCardMissed}>Missed ×{ghost.runsMissed}</Text>
              </View>
              <Text style={styles.ghostCardHint}>Returns in a future hunt.</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeSection === 'hidden') {
      if (hiddenFound.length === 0) {
        return <EmptyState copy={currentSection.emptyCopy} />;
      }
      return (
        <View style={styles.plaqueShelf}>
          {hiddenFound.map((record: MasteredWordRecord) => (
            <View key={record.word} style={styles.hiddenCard}>
              <Text style={styles.hiddenCardWord}>{record.word}</Text>
              <Text style={styles.hiddenCardMeaning}>{record.hiddenMeaningFound}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeSection === 'ranks') {
      const tier      = getRankTier(progress.personalBest);
      const progress_ = getRankProgress(progress.personalBest, tier);
      const beatPolly = progress.personalBest >= 15000;

      return (
        <View style={rk.container}>

          {/* ── Current rank badge ── */}
          <View style={rk.badgeRow}>
            <Text style={[rk.rankLetter, { color: tier.color }]}>
              {tier.letter}
            </Text>
            <View style={rk.badgeRight}>
              <Text style={rk.rankDescription}>{tier.description}</Text>
              <Text style={rk.personalBest}>
                {progress.personalBest > 0
                  ? `${progress.personalBest.toLocaleString()} pts personal best`
                  : 'No runs yet'}
              </Text>
            </View>
          </View>

          {/* ── Rank ladder ── */}
          <View style={rk.ladderRow}>
            {RANK_TIERS.map(t => {
              const isCurrent  = t.letter === tier.letter;
              const isAchieved = progress.personalBest >= t.threshold;
              return (
                <View
                  key={t.letter}
                  style={[
                    rk.ladderPill,
                    isCurrent  && rk.ladderPillCurrent,
                    isAchieved && !isCurrent && rk.ladderPillDone,
                  ]}
                >
                  <Text style={[
                    rk.ladderPillText,
                    { color: isCurrent ? tier.color : isAchieved ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.28)' },
                  ]}>
                    {t.letter}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── Progress to next rank ── */}
          {tier.nextAt ? (
            <View style={rk.progressBlock}>
              <View style={rk.progressBar}>
                <View style={[rk.progressFill, {
                  width:           `${Math.round(progress_ * 100)}%` as any,
                  backgroundColor: tier.color,
                }]} />
              </View>
              <Text style={rk.progressLabel}>
                {(tier.nextAt - progress.personalBest).toLocaleString()} pts to {
                  RANK_TIERS[RANK_TIERS.findIndex(t => t.letter === tier.letter) + 1]?.letter
                }
              </Text>
            </View>
          ) : (
            <View style={rk.progressBlock}>
              <View style={rk.progressBar}>
                <View style={[rk.progressFill, { width: '100%', backgroundColor: '#F5C842' }]} />
              </View>
              <Text style={rk.progressLabel}>Rank ceiling reached.</Text>
            </View>
          )}

          {/* ── Polly target ── */}
          <View style={rk.pollyRow}>
            <View style={rk.pollyLeft}>
              <Text style={rk.pollyLabel}>Polly's score</Text>
              <Text style={rk.pollyScore}>15,000 pts</Text>
            </View>
            <View style={[rk.pollyStatus, beatPolly && rk.pollyStatusBeaten]}>
              <Text style={[rk.pollyStatusText, beatPolly && rk.pollyStatusTextBeaten]}>
                {beatPolly ? 'BEATEN' : 'NOT YET'}
              </Text>
            </View>
          </View>

          {/* ── Stats footer ── */}
          <View style={rk.statsFooter}>
            <View style={rk.statsFooterRow}>
              <Text style={rk.statsFooterLabel}>Runs completed</Text>
              <Text style={rk.statsFooterValue}>{progress.runsCompleted}</Text>
            </View>
            <View style={[rk.statsFooterRow, { borderBottomWidth: 0 }]}>
              <Text style={rk.statsFooterLabel}>Words mastered</Text>
              <Text style={rk.statsFooterValue}>{progress.masteredWords.length}</Text>
            </View>
          </View>

        </View>
      );
    }

    return null;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.kicker}>PLAYER ARCHIVE</Text>
          <Text style={styles.title}>WORD VAULT</Text>
          <Text style={styles.subtitle}>Meanings you stole back.</Text>
        </View>

        <View style={styles.statsRow}>
          {statsRow.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.segmented}>
          {sections.map(section => {
            const selected = section.key === activeSection;
            return (
              <Pressable
                key={section.key}
                onPress={() => setActiveSection(section.key)}
                style={[styles.segmentButton, selected && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                  {section.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.featureCard, { borderColor: currentSection.accent }]}>
          <View style={styles.featureHeader}>
            <View style={[styles.archiveMark, { borderColor: currentSection.accent }]}>
              <View style={[styles.archiveMarkInner, { backgroundColor: currentSection.accent }]} />
            </View>
            <View style={styles.featureTitleWrap}>
              <Text style={styles.featureTitle}>{currentSection.title}</Text>
            </View>
          </View>
          {renderSectionContent()}
        </View>
      </ScrollView>
      <BottomNav active="Vault" navigation={navigation} />
    </SafeAreaView>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1830',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: bottomNavContentPadding,
  },
  hero: {
    minHeight: 166,
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.55)',
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    right: -52,
    top: -42,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 18,
    borderColor: 'rgba(245,200,66,0.08)',
  },
  kicker: {
    color: 'rgba(255,255,255,0.56)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#F5C842',
    fontFamily: FONTS.brand,
    fontSize: 44,
    letterSpacing: 2,
  },
  subtitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.tileCopy,
    fontSize: 16,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: 16,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontFamily: FONTS.hud,
    fontSize: 28,
    letterSpacing: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.70)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  segmentButton: {
    borderRadius: 14,
    backgroundColor: 'rgba(15,13,42,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segmentButtonActive: {
    borderColor: '#7B2D8B',
    backgroundColor: 'rgba(123,45,139,0.28)',
  },
  segmentText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  featureCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  archiveMark: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  archiveMarkInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: 0.86,
  },
  featureTitleWrap: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 18,
    letterSpacing: 1,
  },
  plaqueShelf: {
    gap: 10,
    marginTop: 14,
  },
  wordPlaque: {
    borderRadius: 14,
    backgroundColor: 'rgba(26,24,48,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  wordPlaqueBoss: {
    borderColor: 'rgba(245,200,66,0.55)',
  },
  wordPlaqueBossAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(123,45,139,0.7)',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  wordPlaqueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordPlaqueText: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  wordPlaqueDate: {
    color: 'rgba(255,255,255,0.40)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
  },
  wordPlaqueSub: {
    color: 'rgba(245,200,66,0.78)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    marginTop: 3,
  },
  ghostCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(26,24,48,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.42)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ghostCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ghostCardWord: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  ghostCardMissed: {
    color: '#9B2D6B',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
  },
  ghostCardHint: {
    color: 'rgba(255,255,255,0.40)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    marginTop: 3,
  },
  hiddenCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(26,24,48,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.42)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hiddenCardWord: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  hiddenCardMeaning: {
    color: '#7B2D8B',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    marginTop: 4,
  },
  statsBlock: {
    marginTop: 14,
    gap: 2,
  },
  statBlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  statBlockRowLast: {
    borderBottomWidth: 0,
  },
  statBlockLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
  },
  statBlockValue: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 20,
    letterSpacing: 1,
  },
  emptyState: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(26,24,48,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.24)',
    padding: 16,
  },
  emptyCopy: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    lineHeight: 19,
  },
});

const rk = StyleSheet.create({
  container: {
    marginTop: 14,
    gap: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(15,13,42,0.78)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.42)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rankLetter: {
    fontSize: 52,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
    lineHeight: 58,
    minWidth: 52,
    textAlign: 'center',
  },
  badgeRight: {
    flex: 1,
    gap: 4,
  },
  rankDescription: {
    color: '#FFFFFF',
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
  },
  personalBest: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
  },
  ladderRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  ladderPill: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(15,13,42,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  ladderPillCurrent: {
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(245,200,66,0.08)',
  },
  ladderPillDone: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ladderPillText: {
    fontFamily: FONTS.wordDisplay,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  progressBlock: {
    gap: 6,
  },
  progressBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
  },
  pollyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15,13,42,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.42)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pollyLeft: {
    gap: 2,
  },
  pollyLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 1,
  },
  pollyScore: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 18,
    letterSpacing: 1,
  },
  pollyStatus: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pollyStatusBeaten: {
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(245,200,66,0.10)',
  },
  pollyStatusText: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  pollyStatusTextBeaten: {
    color: '#F5C842',
  },
  statsFooter: {
    backgroundColor: 'rgba(15,13,42,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.42)',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 2,
  },
  statsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  statsFooterLabel: {
    color: 'rgba(255,255,255,0.60)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
  },
  statsFooterValue: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 18,
    letterSpacing: 1,
  },
});
