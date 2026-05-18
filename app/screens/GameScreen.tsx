import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { GameState, currentStep } from '../game/polyRunEngine';
import { SESSION } from '../game/session';
import { Clue, Meaning, PhraseBreakStep, WordStep } from '../game/types';
import ClueCard from '../components/ClueCard';
import { PollyController } from '../components/PollyController';
import { useGameStore } from '../store/useGameStore';

const COLORS = {
  bg: '#1A1040',
  card: '#24175A',
  card2: '#311F78',
  gold: '#FFD700',
  purple: '#8B5CF6',
  white: '#FFFFFF',
  muted: '#B8B3D9',
  success: '#22C55E',
  error: '#EF4444',
  darkSuccess: '#143D2A',
  darkError: '#421818',
};

function isWrongFeedback(text: string): boolean {
  return !text.includes('+');
}

function eventBadgeLabel(eventType: string | null): string | null {
  if (!eventType) return null;
  switch (eventType) {
    case 'bossWord': return 'BOSS WORD';
    case 'speedRound': return 'SPEED ROUND';
    case 'missingMeaning': return 'HIDDEN MEANINGS';
    case 'slangDrop': return 'SLANG DROP';
    case 'semanticEvolution': return 'ERA SHIFT';
    case 'wordLore': return 'WORD LORE';
    default: return null;
  }
}

// ─── ANIMATED CLUE SLOT ──────────────────────────────────────
// One per clue. Mounts fresh per step (key includes stepIndex),
// so each remount gets a clean shared value and fires its timer.

type ClueSlotProps = {
  clue: Clue;
  myIndex: number;
  clueIndex: number;
  meanings: Meaning[];
  locked: boolean;
  onSubmit: (id: string) => void;
};

function AnimatedClueSlot({
  clue,
  myIndex,
  clueIndex,
  meanings,
  locked,
  onSubmit,
}: ClueSlotProps) {
  const tx = useSharedValue(400);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  useEffect(() => {
    const id = setTimeout(() => {
      tx.value = withTiming(0, { duration: 350 });
    }, clue.spawnDelayMs);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPast = myIndex < clueIndex;
  const isActive = myIndex === clueIndex;

  return (
    <Animated.View style={[{ opacity: isPast ? 0.3 : 1 }, animStyle]}>
      <ClueCard
        clue={clue}
        meanings={meanings}
        locked={locked}
        isActive={isActive}
        onSubmit={onSubmit}
      />
    </Animated.View>
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────

function TopBar({ game, total }: { game: GameState; total: number }) {
  const fullHeart = '♥';
  const emptyHeart = '♡';
  const hearts = fullHeart.repeat(game.lives) + emptyHeart.repeat(3 - game.lives);

  return (
    <View style={styles.topBar}>
      <Text style={styles.topScore}>{game.score}</Text>
      <View style={styles.topCenter}>
        {game.combo > 1 && (
          <Text style={styles.topCombo}>x{game.combo}</Text>
        )}
        <Text style={styles.topLives}>{hearts}</Text>
      </View>
      <Text style={styles.topProgress}>{game.stepIndex + 1}/{total}</Text>
    </View>
  );
}

// ─── GAME SCREEN ─────────────────────────────────────────────

export default function GameScreen() {
  const { game, startGame, submitAnswer: storeSubmitAnswer, submitPhraseAnswer: storeSubmitPhraseAnswer } = useGameStore();

  const [locked, setLocked] = useState(false);
  const [phraseChoice, setPhraseChoice] = useState<string | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset phrase choice when the step advances
  useEffect(() => {
    setPhraseChoice(null);
    setLocked(false);
    if (lockTimer.current) clearTimeout(lockTimer.current);
  }, [game.stepIndex]);

  function handleAnswer(meaningId: string) {
    if (locked) return;
    setLocked(true);
    storeSubmitAnswer(meaningId);
    lockTimer.current = setTimeout(() => setLocked(false), 750);
  }

  function handlePhraseChoice(choice: string) {
    if (phraseChoice) return;
    setPhraseChoice(choice);
  }

  function handlePhraseConfirm() {
    if (!phraseChoice) return;
    storeSubmitPhraseAnswer(phraseChoice);
  }

  const step = currentStep(game);

  // ─── GAME OVER / COMPLETE ────────────────────────────────────
  if (game.status === 'gameOver' || game.status === 'complete') {
    const lastStep = SESSION[game.stepIndex];
    const wasBoss = lastStep?.eventType === 'bossWord';
    const failedBoss = wasBoss && game.mistakesOnWord > 0;

    return (
      <View style={styles.endScreen}>
        <Pressable onPress={startGame} style={styles.runItBack}>
          <Text style={styles.runItBackText}>RUN IT BACK</Text>
        </Pressable>

        {game.nearMissClue && (
          <Pressable onPress={startGame} style={styles.ghostTile}>
            <Text style={styles.ghostLabel}>[TEMP: You missed this]</Text>
            <Text style={styles.ghostClueText}>{game.nearMissClue.text}</Text>
          </Pressable>
        )}

        <Text style={styles.nextWord}>Next: {(SESSION[0] as WordStep).word}</Text>

        {failedBoss && (
          <Text style={styles.bossFailText}>
            92% of players fail this first time. Run it back?
          </Text>
        )}

        <Text style={styles.homeText}>home</Text>
        <Text style={styles.pollyExit}>🦜 [TEMP: That had shape.]</Text>
      </View>
    );
  }

  // ─── PHRASE BREAK ─────────────────────────────────────────────
  if (game.status === 'phraseBreak' && step.kind === 'phraseBreak') {
    const phraseStep = step as PhraseBreakStep;
    const answered = phraseChoice !== null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TopBar game={game} total={SESSION.length} />

          <Text style={styles.kicker}>PHRASE BREAK</Text>
          <Text style={styles.phrase}>{phraseStep.phrase}</Text>
          <Text style={styles.pollySmall}>🦜 {phraseStep.pollyLine}</Text>
          <Text style={styles.question}>{phraseStep.question}</Text>

          <View style={styles.choiceList}>
            {phraseStep.choices.map((choice) => {
              const isSelected = phraseChoice === choice;
              const isCorrect = choice === phraseStep.correctChoice;
              return (
                <Pressable
                  key={choice}
                  onPress={() => handlePhraseChoice(choice)}
                  style={[
                    styles.phraseChoice,
                    isSelected && styles.phraseChoiceSelected,
                    answered && isCorrect && styles.phraseChoiceCorrect,
                    answered && isSelected && !isCorrect && styles.phraseChoiceWrong,
                  ]}
                >
                  <Text style={styles.phraseChoiceText}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>

          {answered && (
            <View style={styles.phraseFeedbackBox}>
              <Text style={[
                styles.phraseFeedbackText,
                phraseChoice === phraseStep.correctChoice ? styles.feedbackCorrect : styles.feedbackWrong,
              ]}>
                {phraseChoice === phraseStep.correctChoice
                  ? 'COGNITIVE BREAKOUT +500'
                  : `The answer: ${phraseStep.correctChoice}`}
              </Text>
              <Pressable style={styles.primaryButton} onPress={handlePhraseConfirm}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────
  if (step.kind !== 'word') return null;

  const wordStep = step as WordStep;
  const clues = game.selectedClues[game.stepIndex];
  const clueTotal = clues.length;
  const eventBadge = eventBadgeLabel(wordStep.eventType);
  const isBoss = wordStep.eventType === 'bossWord';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TopBar game={game} total={SESSION.length} />

        {eventBadge && (
          <View style={styles.eventBadgeRow}>
            <View style={[styles.eventBadge, isBoss && styles.eventBadgeBoss]}>
              <Text style={[styles.eventBadgeText, isBoss && styles.eventBadgeBossText]}>
                {eventBadge}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.word, isBoss && styles.wordBoss]}>
          {wordStep.word}
        </Text>

        {wordStep.pollyLine && (
          <Text style={styles.pollySmall}>🦜 {wordStep.pollyLine}</Text>
        )}

        <PollyController />

        <View style={styles.clueTrack}>
          {clues.map((clue, i) => (
            <AnimatedClueSlot
              key={`${game.stepIndex}-${i}`}
              clue={clue}
              myIndex={i}
              clueIndex={game.clueIndex}
              meanings={wordStep.meanings}
              locked={locked}
              onSubmit={handleAnswer}
            />
          ))}
        </View>

        {game.feedback && (
          <Text style={[
            styles.feedback,
            isWrongFeedback(game.feedback) ? styles.feedbackWrong : styles.feedbackCorrect,
          ]}>
            {game.feedback}
          </Text>
        )}

        <Text style={styles.clueProgress}>
          {game.clueIndex + 1} / {clueTotal}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  topScore: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '900',
    minWidth: 60,
  },
  topCenter: {
    alignItems: 'center',
    gap: 2,
  },
  topCombo: {
    color: COLORS.purple,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  topLives: {
    color: COLORS.error,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  topProgress: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },

  // ─── Event badge
  eventBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eventBadge: {
    backgroundColor: COLORS.purple,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  eventBadgeBoss: {
    backgroundColor: COLORS.gold,
  },
  eventBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  eventBadgeBossText: {
    color: COLORS.bg,
  },

  // ─── Word
  word: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 62,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 16,
  },
  wordBoss: {
    color: COLORS.gold,
  },

  // ─── Polly
  pollySmall: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '700',
    lineHeight: 22,
  },

  // ─── Clue conveyor track
  clueTrack: {
    overflow: 'hidden',
  },

  // ─── Feedback
  feedback: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  feedbackCorrect: {
    color: COLORS.gold,
  },
  feedbackWrong: {
    color: COLORS.error,
  },

  // ─── Clue progress
  clueProgress: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: 1,
  },

  // ─── End screens
  kicker: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  bigScore: {
    color: COLORS.white,
    fontSize: 80,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  scoreSub: {
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLine: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  pollyLine: {
    color: COLORS.white,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 32,
    width: '100%',
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 19,
    fontWeight: '900',
  },

  // ─── Phrase break
  phrase: {
    color: COLORS.gold,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 46,
  },
  question: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 28,
  },
  choiceList: {
    marginTop: 20,
    gap: 12,
  },
  phraseChoice: {
    backgroundColor: COLORS.card,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  phraseChoiceSelected: {
    borderColor: COLORS.gold,
  },
  phraseChoiceCorrect: {
    backgroundColor: COLORS.darkSuccess,
    borderColor: COLORS.success,
  },
  phraseChoiceWrong: {
    backgroundColor: COLORS.darkError,
    borderColor: COLORS.error,
  },
  phraseChoiceText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  phraseFeedbackBox: {
    marginTop: 24,
    alignItems: 'center',
  },
  phraseFeedbackText: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  // ─── End screen (gameOver + complete)
  endScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
  },
  runItBack: {
    width: '80%',
    height: 64,
    backgroundColor: '#0ea5e9',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runItBackText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  ghostTile: {
    marginTop: 20,
    opacity: 0.4,
    borderWidth: 1,
    borderColor: '#555',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '80%',
  },
  ghostLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  ghostClueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  nextWord: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 28,
    letterSpacing: 1,
  },
  bossFailText: {
    color: '#f97316',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  homeText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 32,
    letterSpacing: 1,
  },
  pollyExit: {
    position: 'absolute',
    bottom: 40,
    color: '#B8B3D9',
    fontSize: 14,
    fontWeight: '700',
  },
});
