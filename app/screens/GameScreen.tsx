import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { SESSION } from '../game/session';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { HeartbeatBackground } from '../components/HeartbeatBackground';
import { TruthStream } from '../components/TruthStream';
import { ReversedBuild } from '../components/ReversedBuild';
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
        <Text style={tb.progress}>
          {game.stepIndex + 1}/{total}
        </Text>
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

function ResultsScreen({ onRestart }: { onRestart: () => void }) {
  const game = useGameStore(s => s.game);
  const won = game.status === 'complete';

  return (
    <View style={rs.container}>
      <Text style={rs.emoji}>{won ? '🏆' : '💀'}</Text>
      <Text style={rs.headline}>{won ? 'SESSION COMPLETE' : 'GAME OVER'}</Text>
      <Text style={rs.score}>{game.score}</Text>
      <Text style={rs.scoreLabel}>POINTS</Text>
      <Pressable onPress={onRestart} style={rs.btn}>
        <Text style={rs.btnText}>PLAY AGAIN</Text>
      </Pressable>
    </View>
  );
}

const rs = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emoji: { fontSize: 64 },
  headline: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 8,
  },
  score: { color: '#FFFFFF', fontSize: 64, fontWeight: '900' },
  scoreLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  btn: {
    marginTop: 32,
    backgroundColor: '#FFD700',
    borderRadius: 32,
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  btnText: { color: '#1A1040', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
});

// ─── INNER DIRECTOR (needs HeartbeatProvider above it) ───────

function GameDirector() {
  const game = useGameStore(s => s.game);
  const startGame = useGameStore(s => s.startGame);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  // resolve tension from game state
  useEffect(() => {
    const step = currentStep(game);
    if (step.kind !== 'word') return;

    let t = 0;
    if (step.eventType === 'bossWord') t = 3;
    else if (step.eventType === 'speedRound') t = 2;
    else if (step.emotionalRole === 'boss') t = 2;

    if (game.lives === 1) t = Math.min(t + 1, 3);
    if (missedCount >= 2) t = Math.min(t + 1, 3);
    setTension(t);
  }, [game.stepIndex, game.lives, missedCount, setTension]);

  // reset miss counter on new word
  useEffect(() => {
    setMissedCount(0);
  }, [game.stepIndex]);

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

// ─── GAME CONTENT — switches mechanic per step ───────────────

function GameContent() {
  const game = useGameStore(s => s.game);
  const step = currentStep(game);

  if (step.kind !== 'word') {
    // phraseBreak — placeholder (session currently has none)
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>PHRASE BREAK</Text>
      </View>
    );
  }

  // decoy word options for ReversedBuild (other session words)
  const decoyWords = SESSION.filter(s => s.kind === 'word' && s.word !== step.word)
    .map(s => (s as WordStep).word);

  // conveyorBlitz → TruthStream; anything else → ReversedBuild
  if (!step.mode || step.mode === 'conveyorBlitz') {
    return (
      <TruthStream
        key={`stream-${game.stepIndex}`}
        step={step}
      />
    );
  }

  return (
    <ReversedBuild
      key={`reversed-${game.stepIndex}`}
      step={step}
      decoyWords={decoyWords}
      onAnswer={() => {}}
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
