import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { SESSION } from '../game/session';
import { useGameStore } from '../store/useGameStore';
import { HeartbeatBackground } from '../components/HeartbeatBackground';
import { MaskBoard } from '../components/MaskBoard';
import { StreakDisplay } from '../components/StreakDisplay';
import { PhraseBreakScreen } from '../components/PhraseBreakScreen';
import { SlangDropScreen } from '../components/SlangDropScreen';
import { SwitchbackScreen } from '../components/SwitchbackScreen';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';
import ResultsScreen from './ResultsScreen';
import { initSounds, playRoundComplete } from '../utils/SoundEngine';

// ─── TOP BAR ─────────────────────────────────────────────────

function TopBar() {
  const game = useGameStore(s => s.game);
  const lives = '❤️'.repeat(Math.max(game.lives, 0));
  const total = SESSION.length;
  const current = game.stepIndex;

  const animScore = useRef(new Animated.Value(game.score)).current;
  const [displayScore, setDisplayScore] = useState(game.score);

  useEffect(() => {
    const id = animScore.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => animScore.removeListener(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Animated.timing(animScore, {
      toValue: game.score,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [game.score]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View>
      <View style={tb.dotsRow}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              tb.dot,
              i < current   ? tb.dotDone    :
              i === current ? tb.dotCurrent :
              tb.dotRemaining,
            ]}
          />
        ))}
      </View>

      <View style={tb.bar}>
        <View style={tb.block}>
          <Text style={tb.label}>SCORE</Text>
          <Text style={tb.value}>{displayScore}</Text>
        </View>

        <StreakDisplay />

        <View style={tb.block}>
          <Text style={tb.lives}>{lives || '💀'}</Text>
        </View>
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotDone:      { backgroundColor: '#FFD700' },
  dotCurrent:   { backgroundColor: '#FFFFFF' },
  dotRemaining: { backgroundColor: 'rgba(255,255,255,0.25)' },
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
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
  },
  value: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.hudScore,
    fontFamily: FONTS.hud,
  },
  lives: { fontSize: 18 },
});

// ─── INNER DIRECTOR ───────────────────────────────────────────

function GameDirector({ navigation }: { navigation: any }) {
  const game       = useGameStore(s => s.game);
  const startGame  = useGameStore(s => s.startGame);
  const loadGhosts = useGameStore(s => s.loadGhosts);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  useEffect(() => {
    initSounds();
    loadGhosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.status === 'complete' || game.status === 'gameOver') {
      playRoundComplete();
    }
  }, [game.status]);

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

  function handleHome() {
    navigation.navigate('Home');
  }

  const isDone = game.status === 'complete' || game.status === 'gameOver';
  const activeStep = !isDone ? currentStep(game) : null;
  const screenBg = activeStep?.kind === 'switchback' ? '#1A1A4A' : '#1A1040';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: screenBg }]}>
      <HeartbeatBackground />
      {!isDone && <TopBar />}
      {isDone ? (
        <ResultsScreen onRestart={handleRestart} onHome={handleHome} />
      ) : (
        <GameContent />
      )}
    </SafeAreaView>
  );
}

// ─── SWITCHBACK BUFFER VIEW ───────────────────────────────────

function SwitchbackBufferView({ line }: { line: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={sbuf.container}>
      <Animated.Text style={[sbuf.line, { opacity }]}>{line}</Animated.Text>
    </View>
  );
}

const sbuf = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  line: {
    color: '#4CAF50',
    fontSize: FONT_SIZES.pollyLine,
    fontFamily: FONTS.brand,
    textAlign: 'center',
  },
});

// ─── GAME CONTENT ─────────────────────────────────────────────

function GameContent() {
  const game = useGameStore(s => s.game);
  const step = currentStep(game);

  // Switchback polly buffer — hold before mounting next step
  const prevStepRef   = useRef(step);
  const [bufferLine, setBufferLine]   = useState<string | null>(null);

  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = step;

    if (
      prev.kind === 'switchback' &&
      prev.pollyBufferDelay &&
      prev.pollyBufferLine &&
      step.kind !== 'switchback'
    ) {
      setBufferLine(prev.pollyBufferLine);
      const t = setTimeout(() => setBufferLine(null), prev.pollyBufferDelay);
      return () => clearTimeout(t);
    }
  }, [game.stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (bufferLine !== null) {
    return <SwitchbackBufferView line={bufferLine} />;
  }

  if (step.kind === 'phraseBreak') {
    return <PhraseBreakScreen step={step} />;
  }

  if (step.kind === 'switchback') {
    return (
      <SwitchbackScreen
        key={`switchback-${game.stepIndex}`}
        step={step}
      />
    );
  }

  if (step.eventType === 'slangDrop') {
    return (
      <SlangDropScreen
        key={`slang-${game.stepIndex}`}
        step={step}
      />
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

export default function GameScreen({ navigation }: { navigation: any }) {
  return (
    <HeartbeatProvider>
      <GameDirector navigation={navigation} />
    </HeartbeatProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1040',
  },
});
