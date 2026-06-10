import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { FONTS } from '../constants/fonts';

type VaultSectionKey = 'mastered' | 'ghosts' | 'hidden' | 'stats';

const sections: Array<{
  key: VaultSectionKey;
  label: string;
  title: string;
  copy: string;
  accent: string;
}> = [
  {
    key: 'mastered',
    label: 'Mastered Words',
    title: 'Mastered Words',
    copy: 'Fully reclaimed words live here.',
    accent: '#F5C842',
  },
  {
    key: 'ghosts',
    label: 'Ghost Words',
    title: 'Ghost Words',
    copy: 'Missed meanings waiting for a rematch.',
    accent: '#9B2D6B',
  },
  {
    key: 'hidden',
    label: 'Hidden Meanings',
    title: 'Hidden Meanings',
    copy: 'Rare meanings you cracked open.',
    accent: '#7B2D8B',
  },
  {
    key: 'stats',
    label: 'Stats',
    title: 'Stats',
    copy: 'Your mastery trail will live here.',
    accent: '#F5C842',
  },
];

const stats = [
  { label: 'Mastered', value: '12', accent: '#F5C842' },
  { label: 'Ghosts', value: '3', accent: '#9B2D6B' },
  { label: 'Hidden Found', value: '8', accent: '#7B2D8B' },
];

const plaques = ['SPRING', 'LIGHT', 'BANK'];

type Props = {
  navigation: any;
};

export default function VaultScreen({ navigation }: Props) {
  const [activeSection, setActiveSection] = useState<VaultSectionKey>('mastered');
  const currentSection = sections.find(section => section.key === activeSection) ?? sections[0];

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
          {stats.map(stat => (
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
              <Text style={styles.featureCopy}>{currentSection.copy}</Text>
            </View>
          </View>

          {activeSection === 'mastered' && (
            <View style={styles.plaqueShelf}>
              {plaques.map(word => (
                <View key={word} style={styles.wordPlaque}>
                  <Text style={styles.wordPlaqueText}>{word}</Text>
                  <Text style={styles.wordPlaqueSub}>Core vaulted</Text>
                </View>
              ))}
            </View>
          )}

          {activeSection !== 'mastered' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Archive drawer ready</Text>
              <Text style={styles.emptyCopy}>
                Progress wiring lands later. This shelf is reserved for reclaimed meaning records.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.archiveGrid}>
          <View style={styles.drawerCard}>
            <Text style={styles.drawerTitle}>Meaning Cores</Text>
            <Text style={styles.drawerCopy}>Collected mastery trophies will stack into this archive.</Text>
          </View>
          <View style={[styles.drawerCard, styles.ghostDrawer]}>
            <Text style={styles.drawerTitle}>Rematch Shelf</Text>
            <Text style={styles.drawerCopy}>Ghost words will wait here until the haunt breaks.</Text>
          </View>
        </View>
      </ScrollView>
      <BottomNav active="Vault" navigation={navigation} />
    </SafeAreaView>
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
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  featureCopy: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  plaqueShelf: {
    gap: 10,
    marginTop: 18,
  },
  wordPlaque: {
    borderRadius: 14,
    backgroundColor: 'rgba(26,24,48,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  wordPlaqueText: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  wordPlaqueSub: {
    color: 'rgba(245,200,66,0.78)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    marginTop: 3,
  },
  emptyState: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(26,24,48,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.24)',
    padding: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 15,
    letterSpacing: 1,
  },
  emptyCopy: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  archiveGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  drawerCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 18,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.35)',
    padding: 14,
  },
  ghostDrawer: {
    borderColor: 'rgba(155,45,107,0.44)',
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 1,
  },
  drawerCopy: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
