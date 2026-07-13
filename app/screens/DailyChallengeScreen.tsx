import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/fonts';
import {
  DAILY_ROUND_COUNT,
  DAILY_CHANCES,
  getChallengeNumber,
  getTodayDateString,
} from '../game/dailyChallengeEngine';
import { DailyClaimResult } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { playSfx, preloadSfx } from '../audio/sfx';
import {
  haltMusicEngine,
  initMusicEngine,
  setMusicState,
  startMusic,
  stopMusic,
} from '../audio/MusicEngine';
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_LOSS_TITLE,
  DAILY_CLUE_TITLE,
  DAILY_CLUE_RULE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyScrollMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
import DailyAnswerCard, {
  DailyAnswerCardState,
} from '../components/DailyAnswerCard';
import QuillScrollPanel from '../components/ui/QuillScrollPanel';
import PollyDailyPerch from '../components/PollyDailyPerch';
import { POLLY_ANIMATIONS } from '../animations/pollyAnimations';

const CARD_ENTER_DELAYS = [80, 80, 140, 140, 200, 200];

// Maps store claim result reaction -> PollyDailyPerch prop
function toPerchReaction(
  r: DailyClaimResult['pollyReaction'] | undefined,
): PerchReaction {
  if (r === 'firstMiss') return 'happy';
  if (r === 'loss') return 'laughing';
  if (r === 'win') return 'shocked';
  return 'perched';
}

// -----------------------------------------
// FeatherIcon
// -----------------------------------------
function FeatherIcon({ filled }: { filled: boolean }) {
  return (
    <Image
      source={
        filled
          ? require('../../assets/ui/feather-life-filled.png')
          : require('../../assets/ui/feather-life-empty.png')
      }
      style={feather.img}
      resizeMode="contain"
    />
  );
}

// -----------------------------------------
// DailyHUD
// -----------------------------------------
function DailyHUD({
  challengeNumber,
  currentRound,
  chances,
}: {
  challengeNumber: number;
  currentRound: number;
  chances: number;
}) {
  return (
    <View style={hud.row}>
      <Text style={hud.label}>{`DAILY #${challengeNumber}`}</Text>

      <View style={hud.dots}>
        {Array.from({ length: DAILY_ROUND_COUNT }).map((_, i) => {
          const isDone = i < currentRound;
          const isCurrent = i === currentRound;
          return (
            <View
              key={i}
              style={[
                hud.dot,
                isDone && hud.dotDone,
                isCurrent && hud.dotCurrent,
                !isDone && !isCurrent && hud.dotPending,
              ]}
            />
          );
        })}
      </View>

      <View style={hud.feathers}>
        {Array.from({ length: DAILY_CHANCES }).map((_, i) => (
          <FeatherIcon key={i} filled={i < chances} />
        ))}
      </View>
    </View>
  );
}

// -----------------------------------------
// ClueStage — sequential clue-reveal text, rendered onto QuillScrollPanel
// -----------------------------------------
function ClueStage({
  clues,
  revealedCount,
}: {
  clues: [string, string, string];
  revealedCount: 1 | 2 | 3;
}) {
  const clue1Progress = useRef(new Animated.Value(0)).current;
  const clue2Progress = useRef(new Animated.Value(0)).current;
  const clue3Progress = useRef(new Animated.Value(0)).current;
  const clueProgresses = [clue1Progress, clue2Progress, clue3Progress];
  const activeIndex = revealedCount - 1;
  const clueKey = clues.join('|');

  useEffect(() => {
    clueProgresses.forEach((progress, index) => {
      progress.stopAnimation();

      if (index < activeIndex) {
        progress.setValue(2);
        return;
      }

      if (index > activeIndex) {
        progress.setValue(0);
        return;
      }

      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedCount, clueKey]);

  return (
    <>
      {clues.map((clue, index) => {
        if (index > activeIndex) return null;
        const progress = clueProgresses[index];
        const opacity = progress.interpolate({
          inputRange: [0, 0.22, 1, 2],
          outputRange: [0, 1, 1, 0.9],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.22, 1, 2],
          outputRange: [0.98, 1.025, 1, 0.98],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.22, 2],
          outputRange: [8, 0, 0],
        });

        return (
          <Animated.Text
            key={`${clue}-${index}`}
            style={[
              styles.clueText,
              index < activeIndex && styles.clueTextMemory,
              {
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.58}
          >
            {clue.toUpperCase()}
          </Animated.Text>
        );
      })}
    </>
  );
}

// -----------------------------------------
// Daily answer-card control lives in components/DailyAnswerCard.
// -----------------------------------------
// -----------------------------------------
// ResultsOverlay
// -----------------------------------------
function ResultsOverlay({
  onHome,
  onShare,
}: {
  onHome: () => void;
  onShare: () => void;
}) {
  const FEATHER_IMG = require('../../assets/ui/feather-gold-reward.png');

  const dailyResult = useGameStore((s) => s.dailyResult);
  const streakMilestoneReward = useGameStore((s) => s.streakMilestoneReward);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  if (!dailyResult) return null;

  const isWin = dailyResult.status === 'won';

  return (
    <Animated.View style={[res.fill, { opacity: fadeIn }]}>
      <ScrollView
        style={res.scroll}
        contentContainerStyle={res.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={res.card}>
        <Image
          source={
            isWin
              ? POLLY_ANIMATIONS.bossWarning
              : POLLY_ANIMATIONS.laugh
          }
          style={styles.resultPollyImage}
          resizeMode="contain"
        />
        <Text style={res.challenge}>{`DAILY #${dailyResult.challengeNumber}`}</Text>

        <Text style={[res.title, { color: isWin ? '#F5C842' : '#FFFFFF' }]}>
          {isWin ? DAILY_WIN_TITLE : DAILY_LOSS_TITLE}
        </Text>

        {(isWin || streakMilestoneReward) && (
          <View style={styles.featherWrap}>
            <Image
              source={FEATHER_IMG}
              style={styles.featherImage}
              resizeMode="contain"
            />
            <Text style={styles.featherLabel}>
              {streakMilestoneReward
                ? getStreakMilestoneRewardLabel(streakMilestoneReward)
                : DAILY_WIN_REWARD}
            </Text>
          </View>
        )}

        <Text style={res.stat}>
          {`${dailyResult.solvedCount}/${DAILY_ROUND_COUNT} words - ${dailyResult.chancesRemaining} chances left`.toUpperCase()}
        </Text>

        <View style={res.pills}>
          {dailyResult.wordResults.map((result, i) => {
            const solved = result.status === 'solved';
            return (
              <View
                key={`${result.word}-${i}`}
                style={[res.pill, solved ? res.pillSolved : res.pillMissed]}
              >
                <Text style={res.pillText}>{result.word.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>

        <Pressable style={res.shareBtn} onPress={onShare}>
          <Text style={res.shareText}>SHARE RESULT</Text>
        </Pressable>

          <Pressable style={res.homeBtn} onPress={onHome}>
            <Text style={res.homeText}>HOME</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// -----------------------------------------
// MAIN SCREEN
// -----------------------------------------
type Props = { navigation: any };

export default function DailyChallengeScreen({ navigation }: Props) {
  const dailySession = useGameStore((s) => s.dailySession);
  const dailyResult = useGameStore((s) => s.dailyResult);
  const dailyLastClaimResult = useGameStore((s) => s.dailyLastClaimResult);
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);
  const claimDailyAnswer = useGameStore((s) => s.claimDailyAnswer);
  const revealDailyClues = useGameStore((s) => s.revealDailyClues);
  const clearDailyReaction = useGameStore((s) => s.clearDailyReaction);
  const loadDailyResult = useGameStore((s) => s.loadDailyResult);
  const resetDailyForDev = useGameStore((s) => s.resetDailyForDev);

  const [cardStates, setCardStates] = useState<Map<string, DailyAnswerCardState>>(
    new Map(),
  );
  const [pollyPose, setPollyPose] = useState<PerchReaction>('perched');
  const [inputLocked, setInputLocked] = useState(false);
  const inputLockedRef = useRef(false);
  const clueVaultRef = useRef<View>(null);
  const [claimTarget, setClaimTarget] = useState<{ x: number; y: number } | null>(
    null,
  );
  const completingCandidateRef = useRef<string | null>(null);
  const intakeScale = useRef(new Animated.Value(1)).current;
  const [intakeWord, setIntakeWord] = useState('');

  function setLocked(val: boolean) {
    inputLockedRef.current = val;
    setInputLocked(val);
  }

  const rollProgress   = useRef(new Animated.Value(0)).current;
  const revealProgress = useRef(new Animated.Value(0)).current;
  const [pollyVisible, setPollyVisible] = useState(true);

  const completedRef = useRef(false);
  const roundStartRef = useRef<number>(Date.now());

  function measureClueTarget() {
    requestAnimationFrame(() => {
      clueVaultRef.current?.measureInWindow((x, y, width, height) => {
        setClaimTarget({
          x: x + width / 2,
          y: y + height * 0.5,
        });
      });
    });
  }

  // INIT
  useEffect(() => {
    async function init() {
      await loadDailyResult();
      await startDailyChallenge();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DAILY SFX PRELOAD
  useEffect(() => {
    preloadSfx();
  }, []);

  // DAILY MUSIC
  // Tied to navigation focus, not mount/unmount: native-stack keeps the
  // outgoing and incoming screens both mounted during the transition
  // animation, so a mount/unmount effect here would overlap with whatever
  // screen is fading out, bleeding both tracks together.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      setMusicState('daily');
      startMusic();
      initMusicEngine().then(() => {
        if (cancelled) return;
        setMusicState('daily');
        startMusic();
      });

      return () => {
        cancelled = true;
        stopMusic();
        haltMusicEngine();
      };
    }, []),
  );

  // ROUND CHANGE
  useEffect(() => {
    if (!dailySession || dailySession.status !== 'active') return;
    completedRef.current = false;
    completingCandidateRef.current = null;
    setLocked(false);
    roundStartRef.current = Date.now();
    setIntakeWord('');
    intakeScale.setValue(1);
    revealProgress.setValue(0);

    const round = dailySession.rounds[dailySession.currentRoundIndex];
    if (!round) return;
    const candidates = [...round.candidates];
    const map = new Map<string, DailyAnswerCardState>();
    candidates.forEach((c) => map.set(c, 'idle'));
    setCardStates(map);

    rollProgress.stopAnimation();
    rollProgress.setValue(0);
    Animated.timing(rollProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const measureTimer = setTimeout(measureClueTarget, 420);
    return () => clearTimeout(measureTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailySession?.currentRoundIndex]);

  // CLUE TIMER
  useEffect(() => {
    if (!dailySession) return;
    const id = setInterval(() => {
      revealDailyClues(Date.now() - roundStartRef.current);
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailySession?.currentRoundIndex]);

  // CLAIM RESULT -> Polly reaction
  useEffect(() => {
    if (!dailyLastClaimResult) return;
    const pose = toPerchReaction(dailyLastClaimResult.pollyReaction);
    if (pose !== 'perched') {
      setPollyPose(pose);
      setTimeout(() => {
        setPollyPose('perched');
        clearDailyReaction();
      }, 2800);
    } else {
      clearDailyReaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLastClaimResult]);

  function handleClaim(candidate: string) {
    if (completedRef.current || inputLockedRef.current) return;
    if (!dailySession) return;
    const round = dailySession.rounds[dailySession.currentRoundIndex];
    if (!round) return;

    const isCorrect =
      candidate.trim().toUpperCase() === round.word.answer.toUpperCase();

    if (isCorrect) {
      completedRef.current = true;
      completingCandidateRef.current = candidate;
      setLocked(true);
      setCardStates(prev => new Map(prev).set(candidate, 'correct'));
      measureClueTarget();

      // Curtain starts dropping the same instant the tile starts flying, so
      // the two finish together instead of the curtain lagging behind a tile
      // that already landed and sat there waiting to be covered.
      setIntakeWord(candidate.toUpperCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSfx('correctClaim');
      Animated.sequence([
        Animated.timing(revealProgress, {
          toValue: 1,
          duration: 600,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
        Animated.delay(500), // hold the reveal so it's readable before the next round rolls in
        Animated.timing(revealProgress, {
          toValue: 0,
          duration: 400,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
      ]).start();

      // Remaining cards fade out
      setTimeout(() => {
        setCardStates(prev => {
          const next = new Map(prev);
          next.forEach((v, k) => {
            if (k !== candidate) next.set(k, 'disabled');
          });
          return next;
        });
      }, 100);

      return;
    }

    // Wrong
    setLocked(true);
    setCardStates((prev) => new Map(prev).set(candidate, 'wrong'));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    playSfx('trapWrong');
    setTimeout(() => {
      claimDailyAnswer(candidate);
      setLocked(false);
    }, 620);
  }

  function handleCorrectExitComplete(candidate: string) {
    if (completingCandidateRef.current !== candidate) return;
    completingCandidateRef.current = null;
    intakeScale.setValue(1);

    Animated.sequence([
      Animated.timing(intakeScale, {
        toValue: 1.045,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(intakeScale, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    const isFinalRound =
      dailySession?.currentRoundIndex === DAILY_ROUND_COUNT - 1;

    if (!isFinalRound) {
      setTimeout(() => {
        Animated.timing(rollProgress, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 430);
    }

    setTimeout(() => {
      claimDailyAnswer(candidate);
    }, isFinalRound ? 1100 : 720);
  }

  async function handleShare() {
    if (!dailyResult) return;
    try {
      await Share.share({ message: dailyResult.shareText });
    } catch {}
  }

  function handleHome() {
    navigation.navigate('Home');
  }

  const isComplete = !!dailyResult || dailySession?.status !== 'active';
  const challengeNumber = dailySession
    ? dailySession.challengeNumber
    : getChallengeNumber(getTodayDateString());
  const currentRound =
    dailySession?.rounds[dailySession.currentRoundIndex] ?? null;
  const revealedCount = currentRound?.revealedClueCount ?? 1;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Polly's turf -- her boss chamber, tamed so clues + cards stay readable */}
      <ImageBackground
        source={require('../../assets/backgrounds/boss-round-bg.png')}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={['rgba(15,13,42,0.46)', 'rgba(15,13,42,0.18)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {!isComplete && dailySession && (
        <>
          <DailyHUD
            challengeNumber={challengeNumber}
            currentRound={Math.min(
              dailySession.currentRoundIndex,
              DAILY_ROUND_COUNT - 1,
            )}
            chances={dailySession.chancesRemaining}
          />

          <View style={styles.clueHeaderRow}>
            <Text style={styles.clueHeaderLabel}>{DAILY_CLUE_TITLE}</Text>
            <Text style={styles.clueHeaderRule}>{DAILY_CLUE_RULE}</Text>
          </View>

          <Animated.View
            onLayout={measureClueTarget}
            style={[
              styles.clueVaultWrap,
              { transform: [{ scale: intakeScale }] },
            ]}
          >
            <QuillScrollPanel
              ref={clueVaultRef}
              rollProgress={rollProgress}
              revealProgress={revealProgress}
              revealHeading={intakeWord}
              revealBody="RECLAIMED"
            >
              {currentRound && (
                <ClueStage
                  clues={currentRound.word.clues}
                  revealedCount={revealedCount}
                />
              )}
            </QuillScrollPanel>
          </Animated.View>
          <Text style={styles.actionLabel}>{DAILY_ACTION_RULE}</Text>

          <View style={styles.cardArea}>
            {/* Candidate board -- the surface the six cards rest on, so they
                read as laid out on Polly's board instead of floating. */}
            <View style={styles.cardBoard}>
              <View
                key={`grid-${dailySession.currentRoundIndex}`}
                style={styles.cardGrid}
              >
                {currentRound &&
                  [...currentRound.candidates].map((candidate, index) => (
                    <DailyAnswerCard
                      key={candidate}
                      label={candidate}
                      state={cardStates.get(candidate) ?? 'idle'}
                      disabled={inputLocked}
                      onClaim={handleClaim}
                      claimTarget={claimTarget}
                      onCorrectExitComplete={handleCorrectExitComplete}
                      testID={`daily-answer-${index}`}
                      enterFromLeft={index % 2 === 0}
                      enterDelay={CARD_ENTER_DELAYS[index] ?? 200}
                      roundKey={dailySession.currentRoundIndex}
                    />
                  ))}
              </View>
            </View>
          </View>
        </>
      )}

      <PollyDailyPerch
        reaction={pollyPose}
        show={pollyVisible}
      />

      {isComplete && (
        <ResultsOverlay onHome={handleHome} onShare={handleShare} />
      )}

      {__DEV__ && (
        <Pressable
          onPress={async () => {
            await resetDailyForDev();
            await startDailyChallenge();
          }}
          style={styles.devResetBtn}
        >
          <Text style={styles.devResetText}>DEV - RESET DAILY</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

// -----------------------------------------
// STYLES
// -----------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: dailyBackdrop.base,
  },
  clueVaultWrap: {
    // Above cardArea's zIndex: 4 so the correct tile visually ducks into the
    // panel as it flies up, instead of hovering in front of it the whole way.
    zIndex: 40,
    elevation: 40,
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
  },
  cardArea: {
    marginHorizontal: 20,
    marginTop: 2,
    paddingBottom: 210,
    position: 'relative',
    zIndex: 4,
    elevation: 4,
  },
  cardBoard: {
    backgroundColor: 'rgba(10,7,26,0.45)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.14)',
    padding: 10,
    overflow: 'visible',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    justifyContent: 'center',
  },
  resultPollyImage: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 0,
  },
  featherWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  featherImage: {
    width: 72,
    height: 72,
  },
  featherLabel: {
    color: '#F5C842',
    fontFamily: FONTS.label,
    fontSize: 11,
    letterSpacing: 2.5,
    marginTop: 4,
    textAlign: 'center',
  },
  devResetBtn: {
    position: 'absolute',
    bottom: 36,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 99,
  },
  devResetText: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  clueHeaderRow: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  clueHeaderLabel: {
    color: dailyScrollMaterial.goldTrim,
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  clueHeaderRule: {
    color: 'rgba(255,247,214,0.55)',
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 2.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  clueText: {
    color: dailyScrollMaterial.clueInk,
    fontFamily: FONTS.wordDisplay,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: 0.6,
    textAlign: 'center',
    width: '100%',
  },
  clueTextMemory: {
    color: dailyScrollMaterial.clueInkMemory,
    fontSize: 23,
    lineHeight: 28,
  },
});

const hud = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(11,9,32,0.80)',
    borderWidth: 0.5,
    borderColor: 'rgba(123,45,139,0.28)',
    borderBottomColor: 'rgba(245,200,66,0.22)',
    borderBottomWidth: 0.5,
  },
  label: {
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 24,
    letterSpacing: 2,
    textShadowColor: 'rgba(245,200,66,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotDone: {
    backgroundColor: '#F5C842',
  },
  dotCurrent: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  dotPending: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  feathers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});

const feather = StyleSheet.create({
  img: {
    width: 20,
    height: 36,
  },
});

const res = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,10,34,0.55)',
    zIndex: 20,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#0F0D2A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.55)',
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  challenge: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    fontFamily: FONTS.hud,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 6,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  rewardText: {
    color: '#F5C842',
    fontFamily: FONTS.label,
    fontSize: 11,
    letterSpacing: 2.5,
  },
  stat: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    marginTop: 4,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  pill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillSolved: {
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(245,200,66,0.10)',
  },
  pillMissed: {
    borderColor: 'rgba(155,45,107,0.55)',
    backgroundColor: 'rgba(155,45,107,0.10)',
  },
  pillText: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 12,
    letterSpacing: 1,
  },
  shareBtn: {
    backgroundColor: '#F5C842',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  shareText: {
    color: '#0F0D2A',
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 2,
  },
  homeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  homeText: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: FONTS.hud,
    fontSize: 13,
    letterSpacing: 2,
  },
});
