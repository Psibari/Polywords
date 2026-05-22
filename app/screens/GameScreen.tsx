import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { SESSION } from '../game/session';
import { WordResult } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { HeartbeatBackground } from '../components/HeartbeatBackground';
import { MaskBoard } from '../components/MaskBoard';
import { PollyController } from '../components/PollyController';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';

// ─── TOP BAR ─────────────────────────────────────────────────

function TopBar() {
  const game = useGameStore(s => s.game);
  const lives = '❤️'.repeat(Math.max(game.lives, 0));
  const total = SESSION.length;

  return (
    <View style={tb.bar}>
      <View style={tb.block}>
        <Text style={tb.label}>SCORE</Text>
        <Text style={tb.value}>{game.score}</Text>
      </View>

      <View style={tb.block}>
        <Text style={tb.lives}>{lives || '💀'}</Text>
        <Text style={tb.progress}>{game.stepIndex + 1}/{total}</Text>
      </View>

      <View style={tb.block}>
        <Text style={tb.label}>COMBO</Text>
        <Text style={tb.value}>x{game.combo}</Text>
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  block: { alignItems: 'center', minWidth: 64 },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  lives: { fontSize: 18 },
  progress: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700' },
});

// ─── RESULTS ─────────────────────────────────────────────────

function WordResultRow({ result }: { result: WordResult }) {
  const perfect = result.wrongSwipes === 0;
  return (
    <View style={rs.wordRow}>
      <View style={rs.wordRowLeft}>
        <Text style={[rs.wordLabel, perfect && rs.wordLabelPerfect]}>{result.word}</Text>
        {perfect && <Text style={rs.perfectBadge}>PERFECT</Text>}
      </View>
      <View style={rs.wordRowRight}>
        <Text style={rs.stat}>✓ {result.correctUp + result.correctDown}</Text>
        {result.wrongSwipes > 0 && (
          <Text style={rs.statWrong}>✗ {result.wrongSwipes}</Text>
        )}
        {result.hiddenFound && (
          <Text style={rs.statHidden}>✨ hidden</Text>
        )}
      </View>
    </View>
  );
}

function ResultsScreen({ onRestart }: { onRestart: () => void }) {
  const game = useGameStore(s => s.game);
  const won = game.status === 'complete';

  return (
    <View style={rs.container}>
      <Text style={rs.emoji}>{won ? '🏆' : '💀'}</Text>
      <Text style={rs.headline}>{won ? 'SESSION COMPLETE' : 'GAME OVER'}</Text>
      <Text style={rs.score}>{game.score}</Text>
      <Text style={rs.scoreLabel}>POINTS</Text>

      {game.wordResults.length > 0 && (
        <ScrollView
          style={rs.wordList}
          contentContainerStyle={rs.wordListContent}
          showsVerticalScrollIndicator={false}
        >
          {game.wordResults.map(r => (
            <WordResultRow key={r.word} result={r} />
          ))}
        </ScrollView>
      )}

      <Pressable onPress={onRestart} style={rs.btn}>
        <Text style={rs.btnText}>RUN IT BACK</Text>
      </Pressable>
    </View>
  );
}

const rs = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 40, gap: 6 },
  emoji: { fontSize: 60 },
  headline: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 6,
  },
  score: { color: '#FFFFFF', fontSize: 60, fontWeight: '900' },
  scoreLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  wordList: {
    width: '100%',
    maxHeight: 200,
    marginTop: 16,
  },
  wordListContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  wordRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordRowRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  wordLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  wordLabelPerfect: { color: '#FFD700' },
  perfectBadge: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  stat: { color: '#22C55E', fontSize: 13, fontWeight: '900' },
  statWrong: { color: '#EF4444', fontSize: 13, fontWeight: '900' },
  statHidden: { color: '#A78BFA', fontSize: 13, fontWeight: '900' },
  btn: {
    marginTop: 24,
    backgroundColor: '#FFD700',
    borderRadius: 32,
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  btnText: { color: '#1A1040', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
});

// ─── INNER DIRECTOR ───────────────────────────────────────────

function GameDirector() {
  const game      = useGameStore(s => s.game);
  const startGame = useGameStore(s => s.startGame);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  useEffect(() => {
    const step = currentStep(game);
    if (step.kind !== 'word') return;

    let t = 0;
    if (step.eventType === 'bossWord')   t = 3;
    else if (step.eventType === 'speedRound') t = 2;
    else if (step.emotionalRole === 'boss')   t = 2;
    if (game.lives === 1) t = Math.min(t + 1, 3);
    if (missedCount >= 2) t = Math.min(t + 1, 3);
    setTension(t);
  }, [game.stepIndex, game.lives, missedCount, setTension]);

  useEffect(() => { setMissedCount(0); }, [game.stepIndex]);

  function handleRestart() {
    startGame();
    setMissedCount(0);
  }

  const isDone = game.status === 'complete' || game.status === 'gameOver';

  return (
    <SafeAreaView style={styles.screen}>
      <HeartbeatBackground />
      <TopBar />
      {isDone ? (
        <ResultsScreen onRestart={handleRestart} />
      ) : (
        <>
          <PollyController />
          <GameContent />
        </>
      )}
    </SafeAreaView>
  );
}

// ─── GAME CONTENT ─────────────────────────────────────────────

function GameContent() {
  const game = useGameStore(s => s.game);
  const step = currentStep(game);

  if (step.kind !== 'word') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>PHRASE BREAK</Text>
      </View>
    );
  }

  return (
    <MaskBoard
      key={`board-${game.stepIndex}`}
      step={step}
    />
  );
}

// ─── ROOT EXPORT ─────────────────────────────────────────────

export default function GameScreen() {
  return (
    <HeartbeatProvider>
      <GameDirector />
    </HeartbeatProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1040',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
