import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Haptics } from '../utils/haptics';
import { useFocusEffect } from '@react-navigation/native';
import {
  Animated,
  AppState,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import { DAILY_SKY_TUNING } from '../ui/ambientSkyTuning';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import {
  DAILY_ROUND_COUNT,
  DAILY_CHANCES,
  getChallengeNumber,
  getTodayDateString,
} from '../game/dailyChallengeEngine';
import { DailyClaimResult, DailySession } from '../game/types';
import {
  beginDailyCommittedPresentation,
  DailyClaimPresentation,
  resolveDailyActiveElapsedMs,
  selectDailyDisplaySession,
  shouldShowDailyResult,
} from '../game/dailyClaimPresentation';
import { recordPlaytestEvent } from '../game/playtestTelemetry';
import { useGameStore } from '../store/useGameStore';
import { playSfx, preloadSfx, sfxReady } from '../audio/sfx';
import {
  setMusicState,
  startMusic,
  stopMusic,
  musicReady,
} from '../audio/MusicEngine';
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_WIN_LINE,
  DAILY_LOSS_TITLE,
  DAILY_LOSS_LINE,
  DAILY_CLUE_TITLE,
  DAILY_CLUE_RULE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyScrollMaterial,
  dailyResultsMaterial,
  dailyHudMaterial,
  dailyChromeMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
import DailyAnswerCard, {
  DAILY_CARD_TIMING,
  DailyAnswerCardState,
} from '../components/DailyAnswerCard';
import QuillScrollPanel from '../components/ui/QuillScrollPanel';
import PollyDailyPerch from '../components/PollyDailyPerch';
import { POLLY_POSES } from '../ui/pollyPoses';
import { PollySpeechBubble } from '../components/PollySpeechBubble';
import {
  usePollyAmbientMotion,
  useReducedMotionPreference,
} from '../hooks/usePollyAmbientMotion';

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
  const reduceMotion = useReducedMotionPreference();
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

      if (reduceMotion !== false) {
        progress.setValue(1);
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
  }, [revealedCount, clueKey, reduceMotion]);

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
  const rememberPollyLine = useGameStore((s) => s.rememberPollyLine);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const lineRememberedRef = useRef(false);
  const { translateX: pollyX, translateY: pollyY } =
    usePollyAmbientMotion('results', dailyResult !== null);

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  useEffect(() => {
    if (!dailyResult || lineRememberedRef.current) return;
    lineRememberedRef.current = true;
    rememberPollyLine(
      dailyResult.status === 'won' ? 'dailyWinTomorrow' : 'dailyLossBat',
      'daily',
    );
  }, [dailyResult, rememberPollyLine]);

  if (!dailyResult) return null;

  const isWin = dailyResult.status === 'won';
  const resultLine = isWin ? DAILY_WIN_LINE : DAILY_LOSS_LINE;

  return (
    <Animated.View style={[res.fill, { opacity: fadeIn }]}>
      <ScrollView
        style={res.scroll}
        contentContainerStyle={res.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[res.card, isWin ? res.cardWin : res.cardLoss]}>
        <Text style={res.challenge}>{`DAILY #${dailyResult.challengeNumber}`}</Text>

        <Text style={[res.title, { color: isWin ? dailyResultsMaterial.titleWin : dailyResultsMaterial.titleLoss }]}>
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

        {(() => {
          if (isWin) {
            return (
              <Text style={res.stat}>
                {`${dailyResult.solvedCount}/${DAILY_ROUND_COUNT} words - ${dailyResult.chancesRemaining} chances left`.toUpperCase()}
              </Text>
            );
          }
          const missedIndex = dailyResult.wordResults.findIndex(r => r.status === 'missed');
          const roundLabel = missedIndex >= 0 ? missedIndex + 1 : DAILY_ROUND_COUNT;
          return <Text style={res.stat}>{`POLYTRAPS GOT YOU ON ROUND ${roundLabel}`.toUpperCase()}</Text>;
        })()}

        <Text style={res.speedTitle}>CLUE SPEED</Text>
        <View style={res.speedGrid}>
          {dailyResult.wordResults.map((result, i) => {
            const cluesUsed = (result as { cluesUsed?: number }).cluesUsed;
            let cellStyle: ViewStyle = res.speedUnknown;
            let outcome = 'clue speed unavailable';
            let isUnknown = true;

            if (result.status === 'unreached') {
              cellStyle = res.speedUnreached;
              outcome = 'not reached';
              isUnknown = true;
            } else if (result.status === 'missed') {
              cellStyle = res.speedMissed;
              outcome = 'missed';
              isUnknown = false;
            } else if (cluesUsed === 1) {
              cellStyle = res.speedClue1;
              outcome = 'solved from one clue';
              isUnknown = false;
            } else if (cluesUsed === 2) {
              cellStyle = res.speedClue2;
              outcome = 'solved from two clues';
              isUnknown = false;
            } else if (cluesUsed === 3) {
              cellStyle = res.speedClue3;
              outcome = 'solved from three clues';
              isUnknown = false;
            }

            return (
              <View
                key={`speed-${i}`}
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Round ${i + 1}, ${outcome}`}
                style={[res.speedCell, cellStyle]}
              >
                {isUnknown && <Text style={res.speedUnknownMark}>–</Text>}
              </View>
            );
          })}
        </View>

        <View style={res.speedLegend}>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedClue1]} />
            <Text style={res.speedLegendText}>1 CLUE</Text>
          </View>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedClue2]} />
            <Text style={res.speedLegendText}>2 CLUES</Text>
          </View>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedClue3]} />
            <Text style={res.speedLegendText}>3 CLUES</Text>
          </View>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedMissed]} />
            <Text style={res.speedLegendText}>MISSED</Text>
          </View>
        </View>

        <View style={styles.resultPollyStage}>
          <Animated.View style={{ transform: [{ translateX: pollyX }, { translateY: pollyY }] }}>
            <Image
              source={isWin ? POLLY_POSES.shocked : POLLY_POSES.laugh}
              style={styles.resultPollyImage}
              resizeMode="contain"
            />
          </Animated.View>
          <View style={styles.resultPollyBubble}>
            <PollySpeechBubble line={resultLine} maxWidth={170} fontSize={17} lineHeight={22} />
          </View>
        </View>

        <Pressable
          style={res.shareBtn}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share result"
        >
          <Text style={res.shareText}>SHARE RESULT</Text>
        </Pressable>

          <Pressable
            style={res.homeBtn}
            onPress={onHome}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
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
  const reduceMotion = useReducedMotionPreference();
  const dailySession = useGameStore((s) => s.dailySession);
  const dailyResult = useGameStore((s) => s.dailyResult);
  const dailyLastClaimResult = useGameStore((s) => s.dailyLastClaimResult);
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);
  const claimDailyAnswer = useGameStore((s) => s.claimDailyAnswer);
  const revealDailyClues = useGameStore((s) => s.revealDailyClues);
  const pauseDailyChallenge = useGameStore((s) => s.pauseDailyChallenge);
  const clearDailyReaction = useGameStore((s) => s.clearDailyReaction);
  const loadDailyResult = useGameStore((s) => s.loadDailyResult);
  const resetDailyForDev = useGameStore((s) => s.resetDailyForDev);

  const [cardStates, setCardStates] = useState<Map<string, DailyAnswerCardState>>(
    new Map(),
  );
  const [pollyPose, setPollyPose] = useState<PerchReaction>('perched');
  // Starts locked (unlike the old default of unlocked) — GameScreen never
  // renders its interactive content until audioReady is true; Daily had no
  // equivalent gate at all, so a fast tap could request a sound before
  // preloadSfx() had a chance to finish. See the audioReady effect below.
  const [inputLocked, setInputLocked] = useState(true);
  const [dailyInitialized, setDailyInitialized] = useState(false);
  const [dailyStarting, setDailyStarting] = useState(false);
  const inputLockedRef = useRef(true);
  const clueVaultRef = useRef<View>(null);
  const [claimTarget, setClaimTarget] = useState<{ x: number; y: number } | null>(
    null,
  );
  const completingCandidateRef = useRef<string | null>(null);
  const [claimPresentation, setClaimPresentation] = useState<
    DailyClaimPresentation<DailySession> | null
  >(null);
  const claimPresentationRef = useRef<
    DailyClaimPresentation<DailySession> | null
  >(null);
  const intakeScale = useRef(new Animated.Value(1)).current;
  // How many of today's 5 rounds are solved as of this claim, for the
  // reveal curtain's feather tally. Computed synchronously in handleClaim
  // (not read from the store) so it can't race the session update.
  const [revealSolvedCount, setRevealSolvedCount] = useState(0);

  function setLocked(val: boolean) {
    inputLockedRef.current = val;
    setInputLocked(val);
  }

  const rollProgress   = useRef(new Animated.Value(0)).current;
  const revealProgress = useRef(new Animated.Value(0)).current;

  const completedRef = useRef(false);
  const roundStartRef = useRef<number>(Date.now());
  const dailyFocusedRef = useRef(false);
  const dailySessionRef = useRef(dailySession);
  dailySessionRef.current = dailySession;
  const displayedDailySession = selectDailyDisplaySession(
    dailySession,
    claimPresentationRef.current ?? claimPresentation,
  );

  function beginClaimPresentation(
    session: DailySession,
    candidate: string,
    outcome: 'correct' | 'wrong',
  ) {
    const roundElapsedMsAtClaim = activeDailyElapsedMs(session);
    beginDailyCommittedPresentation(
      session,
      candidate,
      outcome,
      roundElapsedMsAtClaim,
      presentation => {
        // The ref becomes authoritative before the store commit. If the
        // external store publishes synchronously, that render still sees the
        // outgoing round instead of flashing the next round or Results.
        claimPresentationRef.current = presentation;
        setClaimPresentation(presentation);
      },
      claimDailyAnswer,
    );
  }

  function finishClaimPresentation(candidate: string): boolean {
    if (claimPresentationRef.current?.candidate !== candidate) return false;

    const presentation = claimPresentationRef.current;
    const committedSession = dailySessionRef.current;
    if (committedSession?.status === 'active') {
      const sameRound =
        presentation.session.currentRoundIndex ===
        committedSession.currentRoundIndex;
      const resumeElapsedMs = sameRound
        ? Math.max(
            committedSession.roundElapsedMs,
            presentation.roundElapsedMsAtClaim,
          )
        : committedSession.roundElapsedMs;
      // The committed round was intentionally paused while its predecessor's
      // claim animation remained on screen. Start its active clock now.
      roundStartRef.current = Date.now() - resumeElapsedMs;
    }
    claimPresentationRef.current = null;
    setClaimPresentation(null);
    return true;
  }

  function activeDailyElapsedMs(session: DailySession): number {
    const presentation = claimPresentationRef.current;
    const presentationRoundElapsedMs =
      presentation?.session.currentRoundIndex === session.currentRoundIndex
        ? presentation.roundElapsedMsAtClaim
        : session.roundElapsedMs;
    return resolveDailyActiveElapsedMs({
      presentationActive: presentation !== null,
      committedRoundElapsedMs: session.roundElapsedMs,
      presentationRoundElapsedMs,
      roundStartedAtMs: roundStartRef.current,
      nowMs: Date.now(),
    });
  }

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
      try {
        await loadDailyResult();
      } finally {
        setDailyInitialized(true);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DAILY SFX PRELOAD
  useEffect(() => {
    preloadSfx();
  }, []);

  // AUDIO READY GATE — same pattern GameScreen already uses (audioReady /
  // gameplayGateActive). Daily previously had no equivalent, so cards were
  // tappable immediately, racing preloadSfx() every session rather than
  // only on a slow load.
  const [audioReady, setAudioReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all([sfxReady(), musicReady()]).then(() => {
      if (!cancelled) setAudioReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // DAILY MUSIC
  // Tied to navigation focus, not mount/unmount: native-stack keeps the
  // outgoing and incoming screens both mounted during the transition
  // animation, so a mount/unmount effect here would overlap with whatever
  // screen is fading out, bleeding both tracks together.
  useFocusEffect(
    useCallback(() => {
      setMusicState('daily', 'daily');
      startMusic('daily');

      return () => {
        stopMusic('daily');
      };
    }, []),
  );

  // ROUND CHANGE
  useEffect(() => {
    if (!displayedDailySession || displayedDailySession.status !== 'active') return;
    completedRef.current = false;
    completingCandidateRef.current = null;
    // Unlocking itself is handled by the audioReady-gated effect below —
    // it re-checks audioReady on every round change too, so this doesn't
    // need to unlock unconditionally here.
    roundStartRef.current = Date.now() - displayedDailySession.roundElapsedMs;
    intakeScale.setValue(1);
    revealProgress.setValue(0);
    setRevealSolvedCount(0);

    const round = displayedDailySession.rounds[displayedDailySession.currentRoundIndex];
    if (!round) return;
    const candidates = [...round.candidates];
    const map = new Map<string, DailyAnswerCardState>();
    const committedWrongClaims = new Set(round.wrongClaims);
    candidates.forEach((c) =>
      map.set(c, committedWrongClaims.has(c) ? 'disabled' : 'idle'),
    );
    setCardStates(map);

    rollProgress.stopAnimation();
    if (reduceMotion !== false) {
      rollProgress.setValue(1);
    } else {
      rollProgress.setValue(0);
      Animated.timing(rollProgress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    const measureTimer = setTimeout(
      measureClueTarget,
      reduceMotion !== false ? 0 : 420,
    );
    return () => clearTimeout(measureTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedDailySession?.currentRoundIndex]);

  // UNLOCK GATE — fires on round change (paired with the effect above,
  // which always runs first in the same commit and resets completedRef)
  // and whenever audioReady flips true, so a round that starts before
  // audio finishes preloading unlocks retroactively instead of never.
  useEffect(() => {
    if (!audioReady) return;
    if (!displayedDailySession || displayedDailySession.status !== 'active') return;
    if (completedRef.current) return;
    setLocked(false);
  }, [audioReady, displayedDailySession?.currentRoundIndex, displayedDailySession?.status]);

  // CLUE TIMER — active play time only. Leaving Daily or backgrounding the
  // app saves elapsed time and stops the clock; returning resumes from there.
  useFocusEffect(
    useCallback(() => {
      dailyFocusedRef.current = true;
      const focusedSession = dailySessionRef.current;
      if (focusedSession?.status === 'active') {
        roundStartRef.current =
          Date.now() - focusedSession.roundElapsedMs;
      }

      const id = setInterval(() => {
        const current = dailySessionRef.current;
        if (!current || current.status !== 'active') return;
        if (claimPresentationRef.current !== null) return;
        revealDailyClues(Date.now() - roundStartRef.current);
      }, 250);

      return () => {
        clearInterval(id);
        const current = dailySessionRef.current;
        if (current?.status === 'active') {
          recordPlaytestEvent('daily_abandon_candidate', {
            round: current.currentRoundIndex + 1,
            chances: current.chancesRemaining,
            clues: current.rounds[current.currentRoundIndex]?.revealedClueCount ?? 1,
          });
          pauseDailyChallenge(activeDailyElapsedMs(current));
        }
        dailyFocusedRef.current = false;
      };
    }, [pauseDailyChallenge, revealDailyClues]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (!dailyFocusedRef.current) return;
      const current = dailySessionRef.current;
      if (!current || current.status !== 'active') return;

      if (nextState === 'active') {
        roundStartRef.current = Date.now() - current.roundElapsedMs;
        return;
      }

      pauseDailyChallenge(activeDailyElapsedMs(current));
    });
    return () => subscription.remove();
  }, [pauseDailyChallenge]);

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
      setRevealSolvedCount(dailySession.currentRoundIndex + 1);
      measureClueTarget();
      beginClaimPresentation(dailySession, candidate, 'correct');

      // Curtain starts dropping the same instant the tile starts flying, so
      // the two finish together instead of the curtain lagging behind a tile
      // that already landed and sat there waiting to be covered.
      Haptics.cueAsync(
        dailySession.currentRoundIndex === DAILY_ROUND_COUNT - 1
          ? 'mastery'
          : 'standardCorrect',
      );
      playSfx('correctClaim');
      const curtainCloseMs = reduceMotion !== false ? 120 : 600;
      const curtainHoldMs = reduceMotion !== false ? 180 : 500;
      const curtainOpenMs = reduceMotion !== false ? 120 : 400;
      const finishClaimOnce = () => {
        if (!finishClaimPresentation(candidate)) return;
        completingCandidateRef.current = null;
      };
      Animated.sequence([
        Animated.timing(revealProgress, {
          toValue: 1,
          duration: curtainCloseMs,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
        Animated.delay(curtainHoldMs),
        Animated.timing(revealProgress, {
          toValue: 0,
          duration: curtainOpenMs,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) finishClaimOnce();
      });
      // The claim is already committed. If the native animation callback is
      // interrupted, release only the outgoing presentation hold here.
      setTimeout(finishClaimOnce, curtainCloseMs + curtainHoldMs + curtainOpenMs + 300);

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
    Haptics.cueAsync('wrong');
    playSfx('trapWrong');
    beginClaimPresentation(dailySession, candidate, 'wrong');
    const wrongExitMs = reduceMotion !== false
      ? DAILY_CARD_TIMING.reducedWrongExitMs
      : DAILY_CARD_TIMING.wrongExitMs;
    setTimeout(() => {
      if (!finishClaimPresentation(candidate)) return;
      setCardStates((prev) => new Map(prev).set(candidate, 'disabled'));
      setLocked(false);
    }, wrongExitMs);
  }

  function handleCorrectExitComplete(candidate: string) {
    if (completingCandidateRef.current !== candidate) return;
    intakeScale.setValue(1);

    const isFinalRound =
      claimPresentationRef.current?.session.currentRoundIndex ===
      DAILY_ROUND_COUNT - 1;

    if (reduceMotion === false) {
      Animated.sequence([
        Animated.timing(intakeScale, {
          toValue: isFinalRound ? 1.085 : 1.045,
          duration: isFinalRound ? 170 : 120,
          useNativeDriver: true,
        }),
        Animated.timing(intakeScale, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (!isFinalRound) {
      if (reduceMotion !== false) {
        rollProgress.setValue(0);
      } else {
        setTimeout(() => {
          Animated.timing(rollProgress, {
            toValue: 0,
            duration: 260,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }, 430);
      }
    }
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

  async function handleStartDaily() {
    if (dailyStarting) return;
    setDailyStarting(true);
    try {
      await startDailyChallenge();
    } finally {
      setDailyStarting(false);
    }
  }

  const isReadyToStart = dailyInitialized && !dailyResult && !dailySession;
  const committedComplete =
    dailyInitialized &&
    (!!dailyResult || (dailySession !== null && dailySession.status !== 'active'));
  const activeClaimPresentation = claimPresentationRef.current ?? claimPresentation;
  const isComplete = shouldShowDailyResult(
    committedComplete,
    activeClaimPresentation,
  );
  const challengeNumber = displayedDailySession
    ? displayedDailySession.challengeNumber
    : getChallengeNumber(getTodayDateString());
  const currentRound =
    displayedDailySession?.rounds[displayedDailySession.currentRoundIndex] ?? null;
  const revealedCount = currentRound?.revealedClueCount ?? 1;
  const dailyPressure = displayedDailySession
    ? Math.min(
        0.18,
        displayedDailySession.currentRoundIndex * 0.025 +
          (2 - displayedDailySession.chancesRemaining) * 0.045,
      )
    : 0;
  const clueSpeedPrompt = revealedCount === 1
    ? 'FIRST-CLUE MARK'
    : revealedCount === 2
      ? 'SECOND-CLUE MARK'
      : 'FINAL CLUE';

  return (
    <View style={styles.screen}>
      {/* Daily's own sky, distinct from Boss's now that they no longer share art or tint. */}
      <AmbientSkyBackground {...DAILY_SKY_TUNING} />
      <LinearGradient
        colors={['rgba(15,13,42,0.46)', 'rgba(15,13,42,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />
      <View
        pointerEvents="none"
        style={[styles.dailyPressureVeil, { opacity: dailyPressure }]}
      />

      <SafeAreaView style={styles.content}>
      {isReadyToStart && (
        <View style={styles.startGate}>
          <View style={styles.startCard}>
            <Text style={styles.startKicker}>{`DAILY #${challengeNumber}`}</Text>
            <Text style={styles.startTitle}>{DAILY_CLUE_TITLE}</Text>
            <Text style={styles.startRule}>FIVE WORDS · TWO CHANCES</Text>
            <Text style={styles.startBody}>
              One word connects the clues. Swipe UP to claim it. This is your
              one attempt for today, and it begins when you enter.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Begin today's Daily Challenge"
              accessibilityState={{ disabled: dailyStarting }}
              disabled={dailyStarting}
              onPress={() => void handleStartDaily()}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
                dailyStarting && styles.startButtonDisabled,
              ]}
            >
              <Text style={styles.startButtonText}>
                {dailyStarting ? 'OPENING…' : 'BEGIN DAILY'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return Home"
              onPress={handleHome}
              style={({ pressed }) => [styles.startHomeButton, pressed && styles.startButtonPressed]}
            >
              <Text style={styles.startHomeText}>NOT NOW</Text>
            </Pressable>
          </View>
        </View>
      )}
      {!isComplete && displayedDailySession && (
        <>
          <DailyHUD
            challengeNumber={challengeNumber}
            currentRound={Math.min(
              displayedDailySession.currentRoundIndex,
              DAILY_ROUND_COUNT - 1,
            )}
            chances={displayedDailySession.chancesRemaining}
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
              revealPerfect={revealSolvedCount === DAILY_ROUND_COUNT}
              revealFeatherCount={
                revealSolvedCount > 0 && revealSolvedCount < DAILY_ROUND_COUNT
                  ? revealSolvedCount
                  : undefined
              }
            >
              {currentRound && (
                <ClueStage
                  clues={currentRound.word.clues}
                  revealedCount={revealedCount}
                />
              )}
            </QuillScrollPanel>
          </Animated.View>
          <Text style={styles.speedPrompt}>{clueSpeedPrompt}</Text>
          <Text style={styles.actionLabel}>
            {displayedDailySession.currentRoundIndex === DAILY_ROUND_COUNT - 1 ? 'FINAL CLAIM · ' : ''}
            {DAILY_ACTION_RULE}
          </Text>

          <View style={styles.cardArea}>
            {/* Candidate board -- the surface the six cards rest on, so they
                read as laid out on Polly's board instead of floating. */}
            <View style={styles.cardBoard}>
              <View
                key={`grid-${displayedDailySession.currentRoundIndex}`}
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
                      roundKey={displayedDailySession.currentRoundIndex}
                    />
                  ))}
              </View>
            </View>
          </View>
        </>
      )}

      <PollyDailyPerch
        reaction={pollyPose}
        show={!isComplete && !isReadyToStart}
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
    </View>
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
  dailyPressureVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PW.color.purple,
  },
  // The background layers sit on the outer View so they reach the true screen
  // edges; this holds everything that should respect the safe-area insets.
  content: {
    flex: 1,
  },
  startGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  startCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: dailyScrollMaterial.goldTrim,
    backgroundColor: dailyResultsMaterial.cardBg,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  startKicker: {
    color: dailyResultsMaterial.challengeLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 8,
  },
  startTitle: {
    color: dailyResultsMaterial.titleWin,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 34,
    letterSpacing: 2,
    textAlign: 'center',
  },
  startRule: {
    color: dailyResultsMaterial.speedTitle,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 2,
    marginTop: 12,
    textAlign: 'center',
  },
  startBody: {
    color: dailyResultsMaterial.statText,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 18,
    textAlign: 'center',
  },
  startButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: dailyResultsMaterial.shareBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  startButtonPressed: {
    opacity: 0.82,
  },
  startButtonDisabled: {
    opacity: 0.55,
  },
  startButtonText: {
    color: dailyResultsMaterial.shareBtnText,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 2.5,
  },
  startHomeButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  startHomeText: {
    color: dailyResultsMaterial.homeText,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 2,
  },
  clueVaultWrap: {
    // Above cardArea's zIndex: 4 so the correct tile visually ducks into the
    // panel as it flies up, instead of hovering in front of it the whole way.
    zIndex: 40,
    elevation: 40,
  },
  actionLabel: {
    color: dailyChromeMaterial.actionLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 8,
  },
  speedPrompt: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 8,
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
    backgroundColor: dailyChromeMaterial.cardBoardBg,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: dailyChromeMaterial.cardBoardBorder,
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
  },
  resultPollyStage: {
    width: '100%',
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  resultPollyBubble: {
    maxWidth: 170,
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
    color: dailyChromeMaterial.featherLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 14,
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
    color: dailyChromeMaterial.devResetText,
    fontFamily: FONTS.label,
    includeFontPadding: false,
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
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  clueHeaderRule: {
    color: dailyChromeMaterial.clueHeaderRule,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 2.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  clueText: {
    color: dailyScrollMaterial.clueInk,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
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
    backgroundColor: dailyHudMaterial.rowBg,
    borderWidth: 0.5,
    borderColor: dailyHudMaterial.rowBorder,
    borderBottomColor: dailyHudMaterial.rowBorderBottom,
    borderBottomWidth: 0.5,
  },
  label: {
    color: dailyHudMaterial.label,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 24,
    letterSpacing: 2,
    textShadowColor: dailyHudMaterial.labelGlow,
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
    backgroundColor: dailyHudMaterial.dotDone,
  },
  dotCurrent: {
    backgroundColor: dailyHudMaterial.dotCurrent,
    shadowColor: dailyHudMaterial.dotCurrent,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  dotPending: {
    backgroundColor: dailyHudMaterial.dotPending,
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
    backgroundColor: dailyResultsMaterial.overlayScrim,
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
    backgroundColor: dailyResultsMaterial.cardBg,
    borderRadius: 24,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  cardWin: {
    borderColor: dailyResultsMaterial.cardBorderWin,
  },
  cardLoss: {
    borderColor: dailyResultsMaterial.cardBorderLoss,
  },
  challenge: {
    color: dailyResultsMaterial.challengeLabel,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 2,
  },
  title: {
    fontFamily: FONTS.hud,
    includeFontPadding: false,
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
    color: dailyResultsMaterial.rewardText,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 2.5,
  },
  stat: {
    color: dailyResultsMaterial.statText,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 16,
    marginTop: 6,
  },
  speedGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  speedTitle: {
    color: dailyResultsMaterial.speedTitle,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 2,
    marginTop: 16,
  },
  speedCell: {
    width: 26,
    height: 26,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedClue1: {
    backgroundColor: dailyResultsMaterial.speedClue1Bg,
    borderColor: dailyResultsMaterial.speedClue1Border,
  },
  speedClue2: {
    backgroundColor: dailyResultsMaterial.speedClue2Bg,
    borderColor: dailyResultsMaterial.speedClue2Border,
  },
  speedClue3: {
    backgroundColor: dailyResultsMaterial.speedClue3Bg,
    borderColor: dailyResultsMaterial.speedClue3Border,
  },
  speedMissed: {
    backgroundColor: dailyResultsMaterial.speedMissedBg,
    borderColor: dailyResultsMaterial.speedMissedBorder,
  },
  speedUnreached: {
    backgroundColor: 'transparent',
    borderColor: dailyResultsMaterial.speedUnreachedBorder,
    borderStyle: 'dashed',
  },
  speedUnknown: {
    backgroundColor: dailyResultsMaterial.speedUnknownBg,
    borderColor: dailyResultsMaterial.speedUnknownBorder,
  },
  speedUnknownMark: {
    color: dailyResultsMaterial.speedUnknownMark,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 16,
  },
  speedLegend: {
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  speedLegendItem: {
    width: '44%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedLegendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  speedLegendText: {
    color: dailyResultsMaterial.speedLegendText,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 0.9,
  },
  shareBtn: {
    backgroundColor: dailyResultsMaterial.shareBtnBg,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  shareText: {
    color: dailyResultsMaterial.shareBtnText,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 2,
  },
  homeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  homeText: {
    color: dailyResultsMaterial.homeText,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 2,
  },
});
