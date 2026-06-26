import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { playSfx } from '../audio/sfx';
import PollySprite, { PollyPose } from '../components/ui/PollySprite';
import { FONTS } from '../constants/fonts';
import { DAILY_CHANCES, DAILY_ROUND_COUNT, getTodayDateString } from '../game/dailyChallengeEngine';
import { DailyClaimResult } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import {
  DAILY_ACTION_RULE,
  DAILY_CLUE_TITLE,
  DAILY_FIRST_MISS_LINE,
  DAILY_LOSS_LINE,
  DAILY_LOSS_TITLE,
  DAILY_NO_FEATHER,
  DAILY_PROMISE,
  DAILY_TITLE,
  DAILY_WIN_LINE,
  DAILY_WIN_REWARD,
  DAILY_WIN_TITLE,
  dailyBackdrop,
  dailyCardMaterial,
  dailyClueVaultMaterial,
} from '../ui/pwDailyMaterials';

const CLAIM_THRESHOLD = -48;
const POLLY_SIZE = 122;

type Props = {
  navigation: {
    goBack?: () => void;
    navigate?: (screen: string) => void;
  };
};

type DailyCardProps = {
  disabled: boolean;
  outcome: 'idle' | 'correct' | 'wrong';
  word: string;
  onClaim: (word: string) => void;
};

function DailyAnswerCard({
  disabled,
  outcome,
  word,
  onClaim,
}: DailyCardProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const grip = useRef(new Animated.Value(0)).current;
  const claimedRef = useRef(false);
  const thresholdRef = useRef(false);

  useEffect(() => {
    claimedRef.current = false;
    thresholdRef.current = false;
    translateY.setValue(0);
    translateX.setValue(0);
    scale.setValue(1);
    grip.setValue(0);
  }, [grip, scale, translateX, translateY, word]);

  const returnHome = () => {
    thresholdRef.current = false;
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(grip, {
        toValue: 0,
        duration: dailyCardMaterial.motion.pressOutMs,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: (_, gesture) =>
      !disabled && Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => {
      if (disabled) return;
      claimedRef.current = false;
      Animated.parallel([
        Animated.timing(grip, {
          toValue: 1,
          duration: dailyCardMaterial.motion.pressInMs,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: dailyCardMaterial.liftScale,
          friction: 8,
          tension: 130,
          useNativeDriver: true,
        }),
      ]).start();
      playSfx('pressHoldStart');
    },
    onPanResponderMove: (_, gesture) => {
      if (disabled || claimedRef.current) return;

      translateY.setValue(Math.min(10, gesture.dy));
      translateX.setValue(gesture.dx * 0.08);

      if (gesture.dy <= CLAIM_THRESHOLD && !thresholdRef.current) {
        thresholdRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playSfx('tileSwipe');
      } else if (gesture.dy > CLAIM_THRESHOLD) {
        thresholdRef.current = false;
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (disabled || claimedRef.current) return;

      const intentionalUp =
        gesture.dy <= CLAIM_THRESHOLD &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.1;

      if (intentionalUp) {
        claimedRef.current = true;
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -64,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(grip, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
        ]).start();
        onClaim(word);
        return;
      }

      returnHome();
    },
    onPanResponderTerminate: returnHome,
  }), [disabled, grip, onClaim, scale, translateX, translateY, word]);

  const glowOpacity = grip.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const borderColors: readonly [string, string] =
    outcome === 'correct'
      ? ['#F5C842', '#F5C842']
      : outcome === 'wrong'
        ? ['#CC2200', '#9B2D6B']
        : dailyCardMaterial.outerGradient;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cardOuter,
        disabled && outcome === 'idle' && styles.cardDisabled,
        {
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <LinearGradient colors={borderColors} style={styles.cardFrame}>
        <View style={styles.cardFace}>
          <Animated.View
            pointerEvents="none"
            style={[styles.cardGripGlow, { opacity: glowOpacity }]}
          />
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.68}
            numberOfLines={1}
            style={styles.cardWord}
          >
            {word.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function ProgressDots({
  currentRound,
  solvedCount,
}: {
  currentRound: number;
  solvedCount: number;
}) {
  return (
    <View style={styles.progressDots}>
      {Array.from({ length: DAILY_ROUND_COUNT }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index < solvedCount && styles.progressDotDone,
            index === currentRound && index >= solvedCount && styles.progressDotCurrent,
          ]}
        />
      ))}
    </View>
  );
}

function ClueRow({
  clue,
  index,
  revealed,
}: {
  clue: string;
  index: number;
  revealed: boolean;
}) {
  if (revealed) {
    return (
      <View style={styles.clueRow}>
        <View style={styles.clueNumber}>
          <Text style={styles.clueNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.clueText}>{clue}</Text>
      </View>
    );
  }

  return (
    <View style={styles.clueRow}>
      <View style={styles.clueNumber}>
        <Text style={styles.clueNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.lockedClue}>
        <View style={styles.lockedBarLong} />
        <View style={styles.lockedBarShort} />
      </View>
      <Text style={styles.timerTag}>{index === 1 ? 'AFTER 4s' : 'AFTER 8s'}</Text>
    </View>
  );
}

function getPollyPresentation(
  claim: DailyClaimResult | null,
  resultStatus?: 'won' | 'lost',
): { line: string | null; pose: PollyPose; stateLabel: string } {
  if (resultStatus === 'won') {
    return { line: DAILY_WIN_LINE, pose: 'perchShocked', stateLabel: 'SHOCKED' };
  }
  if (resultStatus === 'lost') {
    return { line: DAILY_LOSS_LINE, pose: 'perchLaughing', stateLabel: 'LAUGHING' };
  }
  if (claim?.pollyReaction === 'firstMiss') {
    return { line: DAILY_FIRST_MISS_LINE, pose: 'perchSmug', stateLabel: 'SMUG' };
  }
  return { line: null, pose: 'perchNeutral', stateLabel: 'PERCHED' };
}

function ResultOverlay({
  onExit,
}: {
  onExit: () => void;
}) {
  const dailyResult = useGameStore(state => state.dailyResult);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  if (!dailyResult) return null;

  const won = dailyResult.status === 'won';

  return (
    <Animated.View style={[styles.resultOverlay, { opacity: fade }]}>
      <View style={styles.resultCard}>
        <Text style={styles.resultNumber}>DAILY #{dailyResult.challengeNumber}</Text>
        <PollySprite
          pose={won ? 'perchShocked' : 'perchLaughing'}
          size={156}
        />
        <Text style={[styles.resultTitle, won && styles.resultTitleWon]}>
          {won ? DAILY_WIN_TITLE : DAILY_LOSS_TITLE}
        </Text>
        <Text style={styles.resultReward}>
          {won ? DAILY_WIN_REWARD : DAILY_NO_FEATHER}
        </Text>
        <View style={styles.resultLinePlate}>
          <Text style={styles.resultLine}>
            {won ? DAILY_WIN_LINE : DAILY_LOSS_LINE}
          </Text>
        </View>
        <Text style={styles.resultStat}>
          {dailyResult.solvedCount}/{DAILY_ROUND_COUNT} ROUNDS ·{' '}
          {dailyResult.chancesRemaining}/{DAILY_CHANCES} CHANCES
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onExit}
          style={({ pressed }) => [
            styles.exitButton,
            pressed && styles.exitButtonPressed,
          ]}
        >
          <Text style={styles.exitButtonText}>BACK</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function DailyChallengeScreen({ navigation }: Props) {
  const dailySession = useGameStore(state => state.dailySession);
  const dailyResult = useGameStore(state => state.dailyResult);
  const dailyLastClaimResult = useGameStore(state => state.dailyLastClaimResult);
  const loadDailyResult = useGameStore(state => state.loadDailyResult);
  const startDailyChallenge = useGameStore(state => state.startDailyChallenge);
  const claimDailyAnswer = useGameStore(state => state.claimDailyAnswer);
  const revealDailyClues = useGameStore(state => state.revealDailyClues);
  const clearDailyReaction = useGameStore(state => state.clearDailyReaction);

  const [booting, setBooting] = useState(true);
  const [claimedWord, setClaimedWord] = useState<string | null>(null);
  const roundTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const date = getTodayDateString();

    async function bootDaily() {
      await loadDailyResult(date);
      await startDailyChallenge(date);
      if (active) setBooting(false);
    }

    bootDaily();
    return () => {
      active = false;
    };
  }, [loadDailyResult, startDailyChallenge]);

  const currentRoundIndex = dailySession?.currentRoundIndex ?? 0;

  useEffect(() => {
    if (!dailySession || dailySession.status !== 'active') return;

    setClaimedWord(null);
    clearDailyReaction();
    const startedAt = Date.now();

    const clueTwoTimer = setTimeout(() => {
      revealDailyClues(Date.now() - startedAt);
    }, 4000);
    const clueThreeTimer = setTimeout(() => {
      revealDailyClues(Date.now() - startedAt);
    }, 8000);

    roundTimerRef.current = clueThreeTimer as unknown as number;
    return () => {
      clearTimeout(clueTwoTimer);
      clearTimeout(clueThreeTimer);
      roundTimerRef.current = null;
    };
  }, [
    clearDailyReaction,
    currentRoundIndex,
    dailySession?.status,
    revealDailyClues,
  ]);

  useEffect(() => {
    if (dailyLastClaimResult?.pollyReaction !== 'firstMiss') return;
    const timer = setTimeout(() => clearDailyReaction(), 2200);
    return () => clearTimeout(timer);
  }, [clearDailyReaction, dailyLastClaimResult]);

  const currentRound = dailySession?.rounds[currentRoundIndex];
  const polly = getPollyPresentation(
    dailyLastClaimResult,
    dailyResult?.status,
  );

  function handleClaim(word: string) {
    if (!dailySession || dailySession.status !== 'active') return;
    setClaimedWord(word);
    claimDailyAnswer(word);
    const correct = word.toUpperCase() === currentRound?.word.answer.toUpperCase();
    Haptics.notificationAsync(
      correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
    playSfx(correct ? 'uiClick' : 'trapWrong');
  }

  function handleExit() {
    if (navigation.goBack) {
      navigation.goBack();
      return;
    }
    navigation.navigate?.('Home');
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>OPENING TODAY'S CHALLENGE…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dailySession && !dailyResult) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingWrap}>
          <Text style={styles.unavailableTitle}>TODAY'S ATTEMPT IS LOCKED</Text>
          <Text style={styles.unavailableCopy}>
            Polly only gives you one shot each day.
          </Text>
          <Pressable onPress={handleExit} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>BACK</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const claimOutcome = (word: string): 'idle' | 'correct' | 'wrong' => {
    if (claimedWord !== word || !dailyLastClaimResult) return 'idle';
    return dailyLastClaimResult.isCorrect ? 'correct' : 'wrong';
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.centerGlow} />
      <View pointerEvents="none" style={styles.veil} />

      {dailySession && (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hud}>
            <Text style={styles.hudNumber}>
              DAILY #{dailySession.challengeNumber}
            </Text>
            <ProgressDots
              currentRound={dailySession.currentRoundIndex}
              solvedCount={dailySession.solvedCount}
            />
            <Text style={styles.chances}>
              {dailySession.chancesRemaining}/{DAILY_CHANCES}
            </Text>
          </View>

          <View style={styles.modeStrip}>
            <Text style={styles.modeTitle}>{DAILY_TITLE}</Text>
            <Text style={styles.modePromise}>{DAILY_PROMISE}</Text>
          </View>

          {currentRound && (
            <>
              <View style={styles.encounterRow}>
                <View style={styles.pollyZone}>
                  <Text style={styles.pollyState}>{polly.stateLabel}</Text>
                  <PollySprite pose={polly.pose} size={POLLY_SIZE} />
                  <View style={[
                    styles.pollyLinePlate,
                    !polly.line && styles.pollyLinePlateSilent,
                  ]}>
                    <Text style={styles.pollyLine}>
                      {polly.line ?? ' '}
                    </Text>
                  </View>
                </View>

                <View style={styles.clueVault}>
                  <View style={styles.clueTrim} />
                  <Text style={styles.clueTitle}>{DAILY_CLUE_TITLE}</Text>
                  {currentRound.word.clues.map((clue, index) => (
                    <ClueRow
                      clue={clue}
                      index={index}
                      key={`${currentRound.word.id}-${index}`}
                      revealed={index < currentRound.revealedClueCount}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.actionRule}>{DAILY_ACTION_RULE}</Text>

              <View style={styles.cardGrid}>
                {currentRound.candidates.map(word => (
                  <DailyAnswerCard
                    disabled={
                      dailySession.status !== 'active' ||
                      (claimedWord !== null &&
                        dailyLastClaimResult?.status !== 'active')
                    }
                    key={word}
                    onClaim={handleClaim}
                    outcome={claimOutcome(word)}
                    word={word}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {dailyResult && <ResultOverlay onExit={handleExit} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: dailyBackdrop.base,
  },
  centerGlow: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: '12%',
    height: '58%',
    borderRadius: 180,
    backgroundColor: dailyBackdrop.centerGlow,
    opacity: 0.22,
    shadowColor: dailyBackdrop.centerGlow,
    shadowOpacity: 0.38,
    shadowRadius: 52,
    shadowOffset: { width: 0, height: 0 },
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: dailyBackdrop.veil,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 28,
  },
  hud: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 13, 42, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(123, 45, 139, 0.52)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudNumber: {
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  progressDotDone: {
    backgroundColor: '#F5C842',
  },
  progressDotCurrent: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  chances: {
    minWidth: 42,
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'right',
  },
  modeStrip: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 13, 42, 0.72)',
    alignItems: 'center',
  },
  modeTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 19,
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  modePromise: {
    marginTop: 3,
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  encounterRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  pollyZone: {
    width: 128,
    minHeight: 250,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 13, 42, 0.68)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(123, 45, 139, 0.42)',
  },
  pollyState: {
    position: 'absolute',
    top: 10,
    color: 'rgba(255, 255, 255, 0.42)',
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  pollyLinePlate: {
    minHeight: 58,
    width: '100%',
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor: 'rgba(7, 5, 24, 0.92)',
    justifyContent: 'center',
  },
  pollyLinePlateSilent: {
    opacity: 0.36,
  },
  pollyLine: {
    color: '#FFFFFF',
    fontFamily: FONTS.polly,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  clueVault: {
    flex: 1,
    minHeight: 250,
    borderRadius: dailyClueVaultMaterial.radius,
    backgroundColor: dailyClueVaultMaterial.panelBackground,
    borderWidth: dailyClueVaultMaterial.borderWidth,
    borderColor: dailyClueVaultMaterial.borderColor,
    paddingHorizontal: 13,
    paddingTop: 17,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  clueTrim: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: dailyClueVaultMaterial.goldTrimColor,
    opacity: 0.74,
  },
  clueTitle: {
    color: dailyClueVaultMaterial.titleColor,
    fontFamily: FONTS.hud,
    fontSize: 15,
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  clueRow: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  clueNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 45, 139, 0.34)',
  },
  clueNumberText: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 11,
  },
  clueText: {
    flex: 1,
    color: dailyClueVaultMaterial.clueTextColor,
    fontFamily: FONTS.tileCopy,
    fontSize: 15,
    lineHeight: 19,
  },
  lockedClue: {
    flex: 1,
    gap: 6,
  },
  lockedBarLong: {
    height: 7,
    width: '82%',
    borderRadius: 4,
    backgroundColor: dailyClueVaultMaterial.lockedClueBarColor,
  },
  lockedBarShort: {
    height: 7,
    width: '55%',
    borderRadius: 4,
    backgroundColor: dailyClueVaultMaterial.lockedClueBarColor,
    opacity: 0.7,
  },
  timerTag: {
    color: dailyClueVaultMaterial.timerTagColor,
    fontFamily: FONTS.label,
    fontSize: 8,
    letterSpacing: 0.6,
  },
  actionRule: {
    marginTop: 14,
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  cardGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  cardOuter: {
    width: '48.5%',
    minHeight: dailyCardMaterial.minHeight,
    maxHeight: dailyCardMaterial.maxHeight,
    borderRadius: dailyCardMaterial.outerRadius,
    shadowColor: dailyCardMaterial.shadowColor,
    shadowOpacity: dailyCardMaterial.shadowOpacity,
    shadowRadius: dailyCardMaterial.shadowRadius,
    shadowOffset: dailyCardMaterial.shadowOffset,
    elevation: dailyCardMaterial.elevation,
  },
  cardDisabled: {
    opacity: dailyCardMaterial.disabledOpacity,
  },
  cardFrame: {
    flex: 1,
    padding: dailyCardMaterial.frameWidth,
    borderRadius: dailyCardMaterial.outerRadius,
  },
  cardFace: {
    flex: 1,
    minHeight: dailyCardMaterial.minHeight - dailyCardMaterial.frameWidth * 2,
    borderRadius: dailyCardMaterial.innerRadius,
    backgroundColor: dailyCardMaterial.innerFace,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  cardGripGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: dailyCardMaterial.pressGlow,
  },
  cardWord: {
    color: dailyCardMaterial.text,
    fontFamily: FONTS.hud,
    fontSize: 22,
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 24, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    zIndex: 100,
  },
  resultCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 26,
    backgroundColor: '#0F0D2A',
    borderWidth: 1.5,
    borderColor: 'rgba(123, 45, 139, 0.72)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.46,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 18,
  },
  resultNumber: {
    color: 'rgba(255, 255, 255, 0.48)',
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  resultTitleWon: {
    color: '#F5C842',
  },
  resultReward: {
    marginTop: 5,
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1.4,
  },
  resultLinePlate: {
    marginTop: 14,
    width: '100%',
    borderRadius: 14,
    backgroundColor: 'rgba(123, 45, 139, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultLine: {
    color: '#FFFFFF',
    fontFamily: FONTS.polly,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
  },
  resultStat: {
    marginTop: 14,
    color: 'rgba(255, 255, 255, 0.58)',
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  exitButton: {
    marginTop: 18,
    minWidth: 132,
    borderRadius: 14,
    backgroundColor: '#F5C842',
    paddingHorizontal: 24,
    paddingVertical: 13,
    alignItems: 'center',
  },
  exitButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  exitButtonText: {
    color: '#0F0D2A',
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 1.8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingText: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  unavailableTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  unavailableCopy: {
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.64)',
    fontFamily: FONTS.tileCopy,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
