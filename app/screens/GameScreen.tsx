import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

type Mask = {
  text: string;
  correct: boolean;
};

type WordRound = {
  word: string;
  role: string;
  polly: string;
  masks: Mask[];
};

const WORDS: WordRound[] = [
  {
    word: 'BANK',
    role: 'Confidence',
    polly: 'This one wears layers.',
    masks: [
      { text: 'money vault', correct: true },
      { text: 'river edge', correct: true },
      { text: 'tilt sideways', correct: true },
      { text: 'piggy bank', correct: false },
    ],
  },
  {
    word: 'CURRENT',
    role: 'Discovery',
    polly: 'That one travels.',
    masks: [
      { text: 'happening now', correct: true },
      { text: 'river pull', correct: true },
      { text: 'electric flow', correct: true },
      { text: 'ocean wave', correct: false },
    ],
  },
  {
    word: 'DRAFT',
    role: 'Hesitation',
    polly: 'Close. That one hangs nearby.',
    masks: [
      { text: 'rough pages', correct: true },
      { text: 'cold hallway wind', correct: true },
      { text: 'forced enlistment', correct: true },
      { text: 'beer on tap', correct: true },
      { text: 'blueprint sketch', correct: false },
    ],
  },
  {
    word: 'POINT',
    role: 'Pressure',
    polly: 'Too many angles.',
    masks: [
      { text: 'sharp tip', correct: true },
      { text: 'scoreboard tick', correct: true },
      { text: 'main takeaway', correct: true },
      { text: 'finger direction', correct: true },
      { text: 'mountain peak', correct: false },
    ],
  },
  {
    word: 'CHARGE',
    role: 'Boss',
    polly: 'Careful. This word bites back.',
    masks: [
      { text: 'battery juice', correct: true },
      { text: 'rush forward', correct: true },
      { text: 'courtroom accusation', correct: true },
      { text: 'expensive bill', correct: true },
      { text: 'speeding ticket', correct: false },
    ],
  },
];

export default function GameScreen() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [lastTrap, setLastTrap] = useState<string | null>(null);
  const [ghostTile, setGhostTile] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState('');

  const round = WORDS[roundIndex];

  const allCorrectSelected = useMemo(() => {
    return round.masks
      .filter((m) => m.correct)
      .every((m) => selected.includes(m.text));
  }, [round, selected]);

  function handleMaskPress(mask: Mask) {
    if (selected.includes(mask.text)) return;

    setSelected((prev) => [...prev, mask.text]);

    if (mask.correct) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore((prev) => prev + 120 + streak * 10);
      setStreak((prev) => prev + 1);
      setFeedback('Clean hit +120');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setMistakes((prev) => prev + 1);
      setStreak(0);
      setLastTrap(mask.text);
      setFeedback('Trap snapped.');
    }
  }

  function goNext() {
    const missed = round.masks.find(
      (m) => m.correct && !selected.includes(m.text)
    );

    if (missed) setGhostTile(missed.text);

    if (roundIndex >= WORDS.length - 1) {
      setFinished(true);
      return;
    }

    setRoundIndex((prev) => prev + 1);
    setSelected([]);
    setFeedback('');
  }

  function restartRun() {
    setRoundIndex(0);
    setSelected([]);
    setScore(0);
    setStreak(0);
    setMistakes(0);
    setLastTrap(null);
    setGhostTile(null);
    setFinished(false);
    setFeedback('');
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.title}>POLY RUN COMPLETE</Text>

          <View style={styles.resultsCard}>
            <ResultRow label="Score" value={String(score)} highlight />
            <ResultRow label="Mistakes" value={String(mistakes)} danger />
            <ResultRow label="Final Streak" value={`x${streak}`} />

            {ghostTile && (
              <View style={styles.ghostBox}>
                <Text style={styles.smallGold}>GHOST TILE</Text>
                <Text style={styles.bigText}>{ghostTile}</Text>
              </View>
            )}

            {lastTrap && (
              <View style={styles.trapBox}>
                <Text style={styles.smallRed}>TRAP THAT GOT YOU</Text>
                <Text style={styles.bigText}>{lastTrap}</Text>
              </View>
            )}

            <Text style={styles.polly}>🦜 “That run had shape. Sharpen it.”</Text>
          </View>

          <Pressable style={styles.goldButton} onPress={restartRun}>
            <Text style={styles.goldButtonText}>RUN IT BACK</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.label}>Score</Text>
          <Text style={styles.goldValue}>{score}</Text>
        </View>

        <View style={styles.centerTop}>
          <Text style={styles.role}>{round.role}</Text>
          <Text style={styles.label}>
            Word {roundIndex + 1}/{WORDS.length}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Streak</Text>
          <Text style={styles.value}>x{streak}</Text>
        </View>
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.word}>{round.word}</Text>
        <Text style={styles.polly}>🦜 “{round.polly}”</Text>

        <View style={styles.tileGrid}>
          {round.masks.map((mask) => {
            const isSelected = selected.includes(mask.text);
            return (
              <Pressable
                key={mask.text}
                onPress={() => handleMaskPress(mask)}
                style={[
                  styles.tile,
                  isSelected && mask.correct && styles.correctTile,
                  isSelected && !mask.correct && styles.wrongTile,
                ]}
              >
                <Text style={styles.tileText}>{mask.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
      </View>

      <Pressable
        style={[
          styles.nextButton,
          allCorrectSelected && styles.perfectNextButton,
        ]}
        onPress={goNext}
      >
        <Text style={styles.nextButtonText}>
          {roundIndex === WORDS.length - 1 ? 'FINISH RUN' : 'NEXT WORD'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.resultValue,
          highlight && styles.goldText,
          danger && styles.redText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const COLORS = {
  indigo: '#16142B',
  card: '#241F47',
  card2: '#1A1735',
  purple: '#8D5CFF',
  gold: '#FFD23F',
  white: '#FFFFFF',
  muted: '#A8A4C7',
  green: '#31D081',
  red: '#FF4E6A',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.indigo,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerTop: {
    alignItems: 'center',
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  role: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  value: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
  },
  goldValue: {
    color: COLORS.gold,
    fontSize: 26,
    fontWeight: '900',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  word: {
    color: COLORS.white,
    fontSize: 58,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  polly: {
    color: '#CDBDFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 28,
  },
  tileGrid: {
    gap: 12,
  },
  tile: {
    backgroundColor: COLORS.card,
    borderColor: 'rgba(141, 92, 255, 0.35)',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  correctTile: {
    backgroundColor: 'rgba(49, 208, 129, 0.18)',
    borderColor: COLORS.green,
  },
  wrongTile: {
    backgroundColor: 'rgba(255, 78, 106, 0.18)',
    borderColor: COLORS.red,
  },
  tileText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  feedback: {
    color: COLORS.gold,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
  },
  perfectNextButton: {
    shadowColor: COLORS.gold,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  nextButtonText: {
    color: '#111',
    fontSize: 20,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 28,
  },
  resultsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 22,
    borderColor: 'rgba(141, 92, 255, 0.35)',
    borderWidth: 1,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  resultValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },
  goldText: {
    color: COLORS.gold,
  },
  redText: {
    color: COLORS.red,
  },
  ghostBox: {
    backgroundColor: COLORS.card2,
    borderColor: 'rgba(255, 210, 63, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  trapBox: {
    backgroundColor: '#2B1320',
    borderColor: 'rgba(255, 78, 106, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
  },
  smallGold: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  smallRed: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  bigText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  goldButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 26,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  goldButtonText: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
});