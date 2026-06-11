import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';
import { MasteredWordRecord } from '../game/types';

type VaultSectionKey = 'mastered' | 'ghosts' | 'hidden' | 'stats';

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
    key: 'stats',
    label: 'Stats',
    title: 'Stats',
    emptyCopy: '',
    accent: '#F5C842',
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

    if (activeSection === 'stats') {
      return (
        <View style={styles.statsBlock}>
          <View style={styles.statBlockRow}>
            <Text style={styles.statBlockLabel}>Personal Best</Text>
            <Text style={[styles.statBlockValue, { color: '#F5C842' }]}>
              {progress.personalBest.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statBlockRow, styles.statBlockRowLast]}>
            <Text style={styles.statBlockLabel}>Runs Completed</Text>
            <Text style={styles.statBlockValue}>{progress.runsCompleted}</Text>
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
