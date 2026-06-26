import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { WordResult } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { Mask, SessionStep } from '../game/types';

// ─── HELPERS ─────────────────────────────────────────────────

function findMaskById(maskId: string, session: SessionStep[]): Mask | undefined {
  for (const step of session) {
    if (step.kind !== 'word') continue;
    const found = step.masks.find(m => m.id === maskId);
    if (found) return found;
  }
  return undefined;
}

function findWordForMaskId(maskId: string, session: SessionStep[]): string {
  for (const step of session) {
    if (step.kind !== 'word') continue;
    if (step.masks.some(m => m.id === maskId)) return step.word;
  }
  return '';
}

// ─── GRADE COMPUTATION ───────────────────────────────────────

function computeGrade(
  lives: number,
  wordResults: WordResult[],
): { text: string; color: string } {
  if (lives === 0) return { text: 'RATTLED.', color: '#FFFFFF' };
  const wordRounds = wordResults.filter(r => r.roundKind === 'word');
  const ghostCount = wordResults.filter(r => r.missedMaskIds.length > 0).length;
  if (ghostCount === 0) return { text: 'CLEAN RUN', color: '#4CAF50' };
  if (ghostCount <= 2) return { text: 'CLOSE.', color: '#FFFFFF' };
  return { text: 'HAUNTED.', color: '#7B2FBE' };
}

// ─── RANK COMPUTATION ────────────────────────────────────────

function computeRank(score: number): { letter: string; color: string } {
  if (score >= 22000) return { letter: 'MASTER', color: '#F5C842' };
  if (score >= 18000) return { letter: 'S',      color: '#F5C842' };
  if (score >= 14000) return { letter: 'A',      color: '#FFFFFF' };
  if (score >= 11000) return { letter: 'B',      color: '#FFFFFF' };
  if (score >= 8000)  return { letter: 'C',      color: '#FFFFFF' };
  return               { letter: 'D',            color: 'rgba(255,255,255,0.5)' };
}

// ─── POLLY LINE ───────────────────────────────────────────────

function derivePollyLine(
  wordResults: WordResult[],
  isComplete: boolean,
): string | null {
  const allPerfect =
    isComplete && wordResults.every(r => r.wrongSwipes === 0);
  if (allPerfect) return 'You emptied my little vault.';

  const bossCleared = wordResults.some(r => r.isBossWord && r.wrongSwipes === 0);
  if (bossCleared) return 'Fine. Keep the word.';

  const hasMissed = wordResults.some(r => r.missedMaskIds.length > 0);
  if (hasMissed) return 'Some meanings still haunt you.';

  return null;
}

// ─── WORD RESULT ROW ─────────────────────────────────────────

function WordResultRow({ result }: { result: WordResult }) {
  const allFound = result.correctUp === result.totalRealMasks && result.wrongSwipes === 0;
  const isWordRound = result.roundKind === 'word';
  const ghostCreated = result.missedMaskIds.length > 0;

  let resultText: string;
  let resultColor: string;

  if (result.isBossWord && allFound) {
    resultText = 'Boss ✓';
    resultColor = '#FFD700';
  } else if (allFound) {
    resultText = 'Perfect ✓';
    resultColor = '#4CAF50';
  } else {
    resultText = `${result.correctUp}/${result.totalRealMasks}`;
    resultColor = '#FFFFFF';
  }

  return (
    <View style={wr.row}>
      <View style={wr.left}>
        <Text style={wr.word}>{result.word}</Text>
      </View>
      <View style={wr.right}>
        {isWordRound && (
          <Text style={wr.hidden}>{'🔒'}</Text>
        )}
        <Text style={[wr.result, { color: resultColor }]}>{resultText}</Text>
      </View>
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
  word: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', fontFamily: FONTS.hud },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hidden: { fontSize: 14 },
  result: { fontSize: 13 },
});

// ─── GHOST SET CARD ──────────────────────────────────────────

function GhostSetCard({ firstMissedMaskId }: { firstMissedMaskId: string }) {
  const session = useGameStore(s => s.game.session);
  const word = findWordForMaskId(firstMissedMaskId, session);
  if (!word) return null;

  return (
    <View style={gs.card}>
      <Text style={gs.header}>Ghost ready for rematch</Text>
      <Text style={gs.word}>{word.toUpperCase()}</Text>
      <Text style={gs.body}>Guess who's back next run.</Text>
    </View>
  );
}

const gs = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.25)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,215,0,0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.25)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  header: {
    color: '#FFD700',
    fontSize: 13,
    fontFamily: FONTS.hud,
    fontWeight: '700',
    marginBottom: 6,
  },
  word: {
    color: '#FFD700',
    fontSize: 22,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
    marginBottom: 4,
  },
  body: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});

// ─── GHOST REVENGE CARD ──────────────────────────────────────

const gr = StyleSheet.create({
  cardCleared: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.25)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,215,0,0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.25)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  cardHaunting: {
    backgroundColor: 'rgba(123,47,190,0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#7B2FBE',
    borderTopWidth: 1,
    borderTopColor: 'rgba(123,47,190,0.35)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(123,47,190,0.35)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123,47,190,0.35)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  header: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  word: {
    color: '#FFD700',
    fontSize: 22,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 2,
    marginBottom: 4,
  },
  meaning: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
});

// ─── TRAP CARD ───────────────────────────────────────────────

function TrapCard({ maskId }: { maskId: string }) {
  const session = useGameStore(s => s.game.session);
  const mask = findMaskById(maskId, session);
  const word = findWordForMaskId(maskId, session);
  if (!mask) return null;

  return (
    <View style={tc.section}>
      <Text style={tc.header}>The trap that got you</Text>
      <View style={tc.card}>
        <Text style={tc.phrase}>{mask.phrase}</Text>
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
    fontFamily: FONTS.hud,
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
    fontSize: FONT_SIZES.hudScore,
    fontFamily: FONTS.hud,
    letterSpacing: 2,
  },
});

// ─── GOLD FEATHER CHOICE ─────────────────────────────────────

const FEATHER_IMG = require('../../assets/ui/feather-gold-reward.png');

function GoldFeatherChoice({
  onUse,
  onDecline,
}: {
  onUse: () => void;
  onDecline: () => void;
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Animated.View
      style={[
        fc.root,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Feather image */}
      <Animated.Image
        source={FEATHER_IMG}
        style={[fc.featherImg, { opacity: glowOpacity }]}
        resizeMode="contain"
      />

      {/* Header */}
      <Text style={fc.title}>USE YOUR GOLD FEATHER?</Text>
      <Text style={fc.sub}>One extra life · Pick up exactly where you fell</Text>

      {/* YES */}
      <Pressable onPress={onUse} style={fc.yesBtn}>
        <Text style={fc.yesLabel}>YES, USE IT</Text>
      </Pressable>

      {/* NO */}
      <Pressable onPress={onDecline} style={fc.noBtn}>
        <Text style={fc.noLabel}>NO, SEE RESULTS</Text>
      </Pressable>
    </Animated.View>
  );
}

const fc = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  featherImg: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 22,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 36,
    textTransform: 'uppercase',
  },
  yesBtn: {
    width: '100%',
    backgroundColor: '#F5C842',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  yesLabel: {
    color: '#1A1040',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 2,
  },
  noBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  noLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: FONTS.hud,
    fontSize: 13,
    letterSpacing: 2,
  },
});

// ─── RESULTS SCREEN ──────────────────────────────────────────

type Props = {
  onRestart: () => void;
  onHome: () => void;
};

export default function ResultsScreen({ onRestart, onHome }: Props) {
  const game              = useGameStore(s => s.game);
  const ghostRevenge      = useGameStore(s => s.ghostRevenge);
  const recordRunComplete = useGameStore(s => s.recordRunComplete);
  const progress          = useGameStore(s => s.progress);
  const goldFeatherAvailable = useGameStore(s => s.goldFeatherAvailable);
  const useGoldFeatherInHunt = useGameStore(s => s.useGoldFeatherInHunt);
  const { wordResults, score, bestCombo, status, lives } = game;
  const isComplete = status === 'complete';

  const [featherDeclined, setFeatherDeclined] = useState(false);
  const [prevBest] = useState(() => progress.personalBest);
  const isNewBest = score > prevBest && score > 0;
  const beatPolly = score >= 15000;
  const rank = computeRank(score);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordRunComplete(score);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Post-session ceremony hold
  const HOLD_DURATION = isComplete ? 1800 : 1400;
  const [showResults, setShowResults] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowResults(true), HOLD_DURATION);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // entrance animation
  const enterY = useRef(new Animated.Value(40)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;

  // grade spring animation
  const gradeScale = useRef(new Animated.Value(0.8)).current;
  const gradeY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!showResults) return;
    Animated.parallel([
      Animated.timing(enterY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(enterOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(gradeScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
        Animated.spring(gradeY, { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
      ]).start();
    }, 150);
  }, [showResults]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ceremony hold screen — shown before results
  if (!showResults) {
    const holdHeadline = !isComplete
      ? 'POLLY CLIPPED YOUR RUN.'
      : score >= 15000
      ? 'YOU BEAT POLLY'
      : 'POLLY HUNT COMPLETE';
    const holdSub = !isComplete
      ? 'Out of feathers.'
      : score >= 15000
      ? 'Thought so.'
      : null;
    return (
      <View style={ph.container}>
        <Text style={ph.line}>{holdHeadline}</Text>
        {holdSub && <Text style={ph.sub}>{holdSub}</Text>}
      </View>
    );
  }

  // After ceremony — show feather choice if available and not declined
  if (!isComplete && goldFeatherAvailable && !featherDeclined) {
    return (
      <View style={[rs.container, { justifyContent: 'center' }]}>
        <GoldFeatherChoice
          onUse={() => {
            useGoldFeatherInHunt();
          }}
          onDecline={() => setFeatherDeclined(true)}
        />
      </View>
    );
  }

  // derived data
  const wordOnlyResults = wordResults.filter(r => r.roundKind === 'word');
  const allMissedMaskIds = wordResults.flatMap(r => r.missedMaskIds);
  const allWrongMaskIds = wordResults.flatMap(r => r.wrongMaskIds);
  const hasMissed = allMissedMaskIds.length > 0;
  const firstWrongMaskId = allWrongMaskIds[0] ?? null;
  const pollyLine = derivePollyLine(wordResults, isComplete);
  const grade = computeGrade(lives, wordResults);

  const formattedScore = score.toLocaleString();

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

        {/* ── GRADE VERDICT ── */}
        <Animated.View
          style={[rs.header, { transform: [{ scale: gradeScale }, { translateY: gradeY }] }]}
        >

          {/* Grade */}
          <Text style={[rs.grade, { color: beatPolly ? '#F5C842' : grade.color }]}>
            {!isComplete ? 'POLLY CLIPPED YOUR RUN.' : beatPolly ? 'YOU BEAT POLLY' : 'POLLY HUNT COMPLETE'}
          </Text>
          <Text style={[rs.gradeSub, { color: grade.color }]}>{grade.text}</Text>

          {/* Rank */}
          <View style={rs.rankRow}>
            <Text style={rs.rankLabel}>RANK</Text>
            <Text style={[rs.rankLetter, { color: rank.color }]}>{rank.letter}</Text>
          </View>

          {/* Score line */}
          <Text style={rs.scoreLine}>
            {formattedScore} pts  ·  ×{bestCombo} best combo
          </Text>

          {/* Perfect line */}
          <Text style={rs.perfectLine}>
            {wordOnlyResults.filter(r =>
              r.correctUp === r.totalRealMasks && r.wrongSwipes === 0
            ).length}/{wordOnlyResults.length} perfect
          </Text>

          {/* Personal best */}
          {isNewBest ? (
            <Text style={rs.newBest}>NEW BEST</Text>
          ) : (
            <Text style={rs.prevBest}>
              Best: {prevBest > 0 ? prevBest.toLocaleString() : '—'}
            </Text>
          )}

        </Animated.View>

        {/* YOU BEAT POLLY banner */}
        {beatPolly && (
          <View style={rs.beatPollyBanner}>
            <Text style={rs.beatPollyText}>YOU BEAT POLLY</Text>
          </View>
        )}

        {/* ── WORD RESULTS ── */}
        {wordOnlyResults.length > 0 && (
          <View style={rs.section}>
            {wordOnlyResults.map((r, i) => (
              <WordResultRow key={`${r.wordId ?? r.word}-${i}`} result={r} />
            ))}
          </View>
        )}

        {/* ── GHOST REVENGE RESULT ── */}
        {ghostRevenge?.result === 'correct' && (
          <View style={gr.cardCleared}>
            <Text style={gr.header}>Haunt broken 🔥</Text>
            <Text style={gr.word}>{ghostRevenge.word}</Text>
            <Text style={gr.sub}>Rematch won.</Text>
          </View>
        )}
        {ghostRevenge?.result === 'wrong' && (
          <View style={gr.cardHaunting}>
            <Text style={gr.header}>Still haunting you 👻</Text>
            <Text style={gr.word}>{ghostRevenge.word}</Text>
            <Text style={gr.sub}>Missed me?</Text>
          </View>
        )}

        {/* ── GHOST SET — separate from missed section ── */}
        {hasMissed && (
          <GhostSetCard firstMissedMaskId={allMissedMaskIds[0]} />
        )}

        {/* ── TRAP THAT GOT YOU ── */}
        {firstWrongMaskId && (
          <TrapCard maskId={firstWrongMaskId} />
        )}

        {/* ── RUN IT BACK ── */}
        <RunItBackButton onPress={onRestart} />

        {/* ── HOME ── */}
        <Pressable onPress={onHome} style={rs.homeLink}>
          <Text style={rs.homeLinkText}>HOME</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

const ph = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1040',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  line: {
    color: '#4CAF50',
    fontSize: FONT_SIZES.pollyLine,
    fontFamily: FONTS.polly,
    textAlign: 'center',
  },
  sub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
    fontFamily: FONTS.label,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 12,
    textAlign: 'center',
  },
});

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
    fontSize: FONT_SIZES.pollyLine,
    fontFamily: FONTS.polly,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  grade: {
    fontSize: FONT_SIZES.brandTitle,
    fontFamily: FONTS.wordDisplay,
    textAlign: 'center',
    marginBottom: 10,
  },
  gradeSub: {
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.7,
  },
  scoreLine: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.hud,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
  perfectLine: {
    color: '#FFD700',
    fontSize: 13,
    fontFamily: FONTS.hud,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.75,
    marginTop: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  rankLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: FONTS.hud,
    fontWeight: '700',
    letterSpacing: 2,
  },
  rankLetter: {
    fontSize: 28,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
  },
  newBest: {
    color: '#F5C842',
    fontSize: 13,
    fontFamily: FONTS.hud,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 6,
  },
  prevBest: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: FONTS.hud,
    fontWeight: '600',
    marginTop: 4,
  },
  beatPollyBanner: {
    backgroundColor: 'rgba(245,200,66,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.45)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  beatPollyText: {
    color: '#F5C842',
    fontSize: 16,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 16,
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  homeLinkText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontFamily: FONTS.hud,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
