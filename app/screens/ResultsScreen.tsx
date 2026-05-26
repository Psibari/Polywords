import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SESSION } from '../game/session';
import { WordResult } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { Mask } from '../game/types';

// ─── HELPERS ─────────────────────────────────────────────────

function findMaskById(maskId: string): Mask | undefined {
  for (const step of SESSION) {
    if (step.kind !== 'word') continue;
    const found = step.masks.find(m => m.id === maskId);
    if (found) return found;
  }
  return undefined;
}

function findWordForMaskId(maskId: string): string {
  for (const step of SESSION) {
    if (step.kind !== 'word') continue;
    if (step.masks.some(m => m.id === maskId)) return step.word;
  }
  return '';
}

// ─── POLLY LINE ───────────────────────────────────────────────

function derivePollyLine(
  wordResults: WordResult[],
  isComplete: boolean,
): string | null {
  const allPerfect =
    isComplete && wordResults.every(r => r.wrongSwipes === 0);
  if (allPerfect) return '🦜 Clean sweep. Locked in.';

  const bossCleared = wordResults.some(r => r.isBossWord && r.wrongSwipes === 0);
  if (bossCleared) return '🦜 Mask Master.';

  const ghostCleared = wordResults.some(r => r.hiddenFound);
  if (ghostCleared) return '🦜 Revenge Snap. Felt that.';

  const hasMissed = wordResults.some(r => r.missedMaskIds.length > 0);
  if (hasMissed) return "🦜 That one's waiting for you.";

  return null;
}

// ─── WORD RESULT ROW ─────────────────────────────────────────

function WordResultRow({ result }: { result: WordResult }) {
  const perfect = result.wrongSwipes === 0;
  const hasWrongSwipes = result.wrongSwipes > 0;

  let resultText: string;
  let resultColor: string;

  if (result.isBossWord && perfect) {
    resultText = 'Boss ✓';
    resultColor = '#FFD700';
  } else if (perfect) {
    resultText = 'Perfect ✓';
    resultColor = '#22C55E';
  } else {
    resultText = `${result.correctUp}/${result.totalRealMasks} meanings`;
    resultColor = 'rgba(255,255,255,0.45)';
  }

  return (
    <View style={wr.row}>
      <View style={wr.left}>
        <Text style={wr.word}>{result.word}</Text>
        {hasWrongSwipes && <View style={wr.redDot} />}
      </View>
      <Text style={[wr.result, { color: resultColor }]}>{resultText}</Text>
    </View>
  );
}

const wr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  result: { fontSize: 13 },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
});

// ─── MISSED MEANING CARD ─────────────────────────────────────

function MissedMeaningCard({ maskId }: { maskId: string }) {
  const mask = findMaskById(maskId);
  const word = findWordForMaskId(maskId);
  if (!mask) return null;

  return (
    <View style={mm.card}>
      <Text style={mm.phrase}>
        {mask.emoji}{'  '}{mask.phrase}
      </Text>
      <Text style={mm.pollyLine}>
        {word.toUpperCase()} — Polly knew.
      </Text>
    </View>
  );
}

const mm = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  phrase: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  pollyLine: {
    color: '#FFD700',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

// ─── GHOST SET CARD ──────────────────────────────────────────

function GhostSetCard({ firstMissedMaskId }: { firstMissedMaskId: string }) {
  const mask = findMaskById(firstMissedMaskId);
  if (!mask) return null;

  return (
    <View style={gs.card}>
      <Text style={gs.header}>👻 Ghost set for next run</Text>
      <Text style={gs.body}>"{mask.phrase}" is waiting.</Text>
    </View>
  );
}

const gs = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  header: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    color: '#FFD700',
    fontSize: 13,
    opacity: 0.75,
  },
});

// ─── TRAP CARD ───────────────────────────────────────────────

function TrapCard({ maskId }: { maskId: string }) {
  const mask = findMaskById(maskId);
  const word = findWordForMaskId(maskId);
  if (!mask) return null;

  return (
    <View style={tc.section}>
      <Text style={tc.header}>The trap that got you</Text>
      <View style={tc.card}>
        <Text style={tc.phrase}>
          {mask.emoji}{'  '}{mask.phrase}
        </Text>
        <Text style={tc.reveal}>
          Not a meaning of {word.toUpperCase()}. Just nearby.
        </Text>
      </View>
    </View>
  );
}

const tc = StyleSheet.create({
  section: { marginBottom: 24 },
  header: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    borderRadius: 14,
    padding: 14,
  },
  phrase: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  reveal: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

// ─── PULSING BUTTON ──────────────────────────────────────────

function RunItBackButton({ onPress }: { onPress: () => void }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ]),
    ).start();
  }, [glow]);

  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const shadowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [8, 24] });

  return (
    <Animated.View style={[btn.shadow, { shadowOpacity, shadowRadius }]}>
      <Pressable onPress={onPress} style={btn.btn}>
        <Text style={btn.label}>RUN IT BACK</Text>
      </Pressable>
    </Animated.View>
  );
}

const btn = StyleSheet.create({
  shadow: {
    width: '100%',
    borderRadius: 18,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  btn: {
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  label: {
    color: '#1A1040',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

// ─── RESULTS SCREEN ──────────────────────────────────────────

type Props = {
  onRestart: () => void;
  onHome: () => void;
};

export default function ResultsScreen({ onRestart, onHome }: Props) {
  const game = useGameStore(s => s.game);
  const { wordResults, score, bestCombo, status } = game;
  const isComplete = status === 'complete';

  // entrance animation
  const enterY = useRef(new Animated.Value(40)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(enterOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [enterY, enterOpacity]);

  // derived data
  const wordOnlyResults = wordResults.filter(r => r.totalRealMasks > 0);
  const totalWords = wordOnlyResults.length;
  const perfectClears = wordOnlyResults.filter(r => r.wrongSwipes === 0).length;

  const allMissedMaskIds = wordResults.flatMap(r => r.missedMaskIds);
  const allWrongMaskIds = wordResults.flatMap(r => r.wrongMaskIds);

  const hasMissed = allMissedMaskIds.length > 0;
  const firstWrongMaskId = allWrongMaskIds[0] ?? null;

  const pollyLine = derivePollyLine(wordResults, isComplete);

  return (
    <Animated.View
      style={[rs.container, { transform: [{ translateY: enterY }], opacity: enterOpacity }]}
    >
      <ScrollView
        style={rs.scroll}
        contentContainerStyle={rs.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── POLLY LINE ── */}
        {pollyLine && (
          <Text style={rs.pollyLine}>{pollyLine}</Text>
        )}

        {/* ── SCORE HEADER ── */}
        <View style={rs.header}>
          <Text style={rs.eyebrow}>RUN COMPLETE</Text>
          <Text style={rs.score}>{score}</Text>
          <View style={rs.metaRow}>
            <Text style={rs.meta}>x{bestCombo} best combo</Text>
            <Text style={rs.meta}>{perfectClears}/{totalWords} perfect</Text>
          </View>
        </View>
s
        {/* ── WORD RESULTS ── */}
        {wordResults.length > 0 && (
          <View style={rs.section}>
            {wordResults.map((r, i) => (
              <WordResultRow key={`${r.word}-${i}`} result={r} />
            ))}
          </View>
        )}

        {/* ── MISSED MEANINGS ── */}
        {hasMissed && (
          <View style={rs.section}>
            <Text style={rs.sectionHeader}>You missed</Text>
            {allMissedMaskIds.map(id => (
              <MissedMeaningCard key={id} maskId={id} />
            ))}
          </View>
        )}

        {/* ── GHOST SET — separate from missed section ── */}
        {console.log('[results]', { allMissedMaskIds, hasMissed }) as unknown as null}
        {hasMissed && (
          <GhostSetCard firstMissedMaskId={allMissedMaskIds[0]} />
        )}

        {/* ── TRAP THAT GOT YOU ── */}
        {firstWrongMaskId && (
          <TrapCard maskId={firstWrongMaskId} />
        )}

        {/* ── RUN IT BACK ── */}
        <RunItBackButton onPress={onRestart} />

        {/* ── BACK TO PERCH ── */}
        <Pressable onPress={onHome} style={rs.homeLink}>
          <Text style={rs.homeLinkText}>Back to Perch</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

const rs = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1040',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  pollyLine: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  score: {
    color: '#FFD700',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 60,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 6,
  },
  meta: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  homeLinkText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
  },
});
