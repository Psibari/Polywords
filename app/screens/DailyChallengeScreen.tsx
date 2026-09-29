import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  canBeginDailyClaim,
  canUnlockDailyRound,
  DailyClaimPresentation,
  DailyClaimPresentationPhase,
  isDailyClaimInputLocked,
  resolveDailyActiveElapsedMs,
  selectDailyDisplaySession,
  shouldShowDailyResult,
} from '../game/dailyClaimPresentation';
import { recordPlaytestEvent } from '../game/playtestTelemetry';
import { resolveRivalryState } from '../game/pollyMood';
import { useGameStore } from '../store/useGameStore';
import { playSfx, sfxReady, warmDailyPlaqueEntranceSfx } from '../audio/sfx';
import {
  setMusicState,
  startMusic,
  stopMusic,
} from '../audio/MusicEngine';
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_WIN_LINE,
  DAILY_LOSS_TITLE,
  DAILY_LOSS_LINE_IDS,
  DAILY_CLUE_TITLE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyScrollMaterial,
  dailyResultsMaterial,
  dailyHudMaterial,
  dailyChromeMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
import { POLLY_LINES } from '../game/pollyCharacter';
import { pickFreshLine } from '../game/pollyVisitPolicy';
import DailyAnswerCard, {
  DailyAnswerCardClaimOrigin,
  DAILY_CARD_TIMING,
  DailyAnswerCardState,
} from '../components/DailyAnswerCard';
import DailyCastleStage, { DailyCastleFlight } from '../components/DailyCastleStage';
import { type DailyCoinRise } from '../components/DailyFloorCoins';
import DailyCoinFinale from '../components/DailyCoinFinale';
import {
  DAILY_CASTLE_FLIGHT,
  DAILY_CASTLE_FLIGHT_HANDOFF,
  DAILY_HUD,
  DAILY_POLLY_BUBBLE,
  dailyActionLabelBottom,
  dailyGoldHitMs,
  type DailyCastleFrame,
} from '../ui/dailyCastleScene';
import {
  DAILY_COIN_FINALE,
  DAILY_COIN_FINALE_STEPS,
  dailyCoinFinaleArrivalMs,
  dailyCoinFinaleFloorHoldMs,
  dailyCoinFinaleResetsFor,
  dailyCoinFinaleRestingStep,
  dailyCoinFinaleTotalMs,
} from '../ui/dailyCoinFinale';
import { dailyPlaqueEntranceMs } from '../ui/dailyPlaqueEntrance';
import PollyDailyPerch from '../components/PollyDailyPerch';
import { POLLY_POSES } from '../ui/pollyPoses';
import { PollySpeechBubble } from '../components/PollySpeechBubble';
import {
  usePollyAmbientMotion,
  useReducedFlashesPreference,
  useReducedMotionPreference,
} from '../hooks/usePollyAmbientMotion';

const DailyCastleTuningPanel = __DEV__
  ? require('../dev/DailyCastleTuningPanel').default
  : null;


// Maps store claim result reaction -> PollyDailyPerch prop
function dailyGateRiseMs(motion: boolean): number {
  return motion ? 400 : 120;
}

/**
 * From a correct claim until the thrown plaque is gone down the tunnel (the
 * gate is up by then too). Polly's bubble on the steps waits this long, so it
 * never covers the throw.
 */
function dailyThrowGoneMs(motion: boolean): number {
  const flightMs = motion ? DAILY_CASTLE_FLIGHT.riseMs + DAILY_CASTLE_FLIGHT.absorbMs : 0;
  return Math.max(dailyGateRiseMs(motion), flightMs);
}

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
  chances,
  featherPulse,
}: {
  challengeNumber: number;
  chances: number;
  featherPulse?: Animated.Value;
}) {
  // Compact, centred between the towers (Pete, 2026-09-28): DAILY #<n> with
  // the chances beneath it. The round markers sit on the wall's frieze
  // (DailyRoundMarkers, placed by DailyCastleStage).
  return (
    <View style={hud.plate}>
      <Text style={hud.label}>{`DAILY #${challengeNumber}`}</Text>
      <Animated.View style={[hud.feathers, featherPulse && {
        backgroundColor: featherPulse.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ['transparent', 'rgba(204,34,0,0.25)', 'transparent'],
        }),
        borderRadius: 8,
        paddingHorizontal: 4,
      }]}>
        {Array.from({ length: DAILY_CHANCES }).map((_, i) => (
          <FeatherIcon key={i} filled={i < chances} />
        ))}
      </Animated.View>
    </View>
  );
}

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
  // Both held stable for the life of the overlay, snapshotted the same way
  // ResultsScreen.tsx's pollyMemoryBeforeRunRecorded is: a live pollyMemory
  // selector here would re-derive recentLineIds (and this pick) right after
  // the effect below calls rememberPollyLine, flipping the displayed line
  // away from the one actually remembered. useGameStore.getState() (not a
  // selector — matches usePollyVisits' own reasoning) reads once at mount.
  const [pollyMemoryBeforeRecorded] = useState(() => useGameStore.getState().pollyMemory);
  const [dailyRoll] = useState(() => Math.random());
  const dailyLossLineId = pickFreshLine(DAILY_LOSS_LINE_IDS, pollyMemoryBeforeRecorded.recentLineIds, dailyRoll);

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
      dailyResult.status === 'won' ? 'dailyWinTomorrow' : dailyLossLineId,
      'daily',
    );
  }, [dailyResult, rememberPollyLine, dailyLossLineId]);

  if (!dailyResult) return null;

  const isWin = dailyResult.status === 'won';
  const resultLine = isWin ? DAILY_WIN_LINE : POLLY_LINES[dailyLossLineId];

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
  const insets = useSafeAreaInsets();
  const dailySession = useGameStore((s) => s.dailySession);
  const dailyResult = useGameStore((s) => s.dailyResult);
  const dailyLastClaimResult = useGameStore((s) => s.dailyLastClaimResult);
  const progress = useGameStore((s) => s.progress);
  // Hunt-derived and inert during an active Daily session — recomputing only
  // when the underlying progress fields change is enough, no per-round churn.
  const rivalryState = useMemo(
    () => resolveRivalryState({
      recent: progress.recentHuntPerformance ?? [],
      masteredCount: progress.masteredWords.length,
      runsCompleted: progress.runsCompleted,
    }),
    [progress.recentHuntPerformance, progress.masteredWords.length, progress.runsCompleted],
  );
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
  const [pollyPose, setPollyPose] = useState<PerchReaction | 'correct'>('perched');
  // Starts locked (unlike the old default of unlocked) — GameScreen never
  // renders its interactive content until audioReady is true; Daily had no
  // equivalent gate at all, so a fast tap could request a sound before
  // preloadSfx() had a chance to finish. See the audioReady effect below.
  const [inputLocked, setInputLocked] = useState(true);
  const [dailyInitialized, setDailyInitialized] = useState(false);
  const [dailyStarting, setDailyStarting] = useState(false);
  const inputLockedRef = useRef(true);
  // True while a new round's blocks are punching out of the wall
  // (DailyCastleStage). Nothing is claimable until the last one is flush.
  const [plaquesPresenting, setPlaquesPresentingState] = useState(false);
  const plaquesPresentingRef = useRef(false);
  const completingCandidateRef = useRef<string | null>(null);
  const pendingClaimCandidateRef = useRef<string | null>(null);
  const [claimPresentation, setClaimPresentation] = useState<
    DailyClaimPresentation<DailySession> | null
  >(null);
  const claimPresentationRef = useRef<
    DailyClaimPresentation<DailySession> | null
  >(null);
  const [claimPhase, setClaimPhase] = useState<DailyClaimPresentationPhase>('idle');
  const claimPhaseRef = useRef<DailyClaimPresentationPhase>('idle');
  const correctTransitionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // How many of today's 5 rounds are solved as of this claim, for the
  // reveal curtain's feather tally. Computed synchronously in handleClaim
  // (not read from the store) so it can't race the session update.
  const [revealSolvedCount, setRevealSolvedCount] = useState(0);

  // DEV: castle tuning panel
  const [castleTuningVisible, setCastleTuningVisible] = useState(false);

  function setLocked(val: boolean) {
    inputLockedRef.current = val;
    setInputLocked(val);
  }

  function setPlaquesPresenting(val: boolean) {
    plaquesPresentingRef.current = val;
    setPlaquesPresentingState(val);
  }

  function setPhysicalClaimPhase(phase: DailyClaimPresentationPhase) {
    claimPhaseRef.current = phase;
    setClaimPhase(phase);
  }

  function clearCorrectTransitionTimers() {
    correctTransitionTimersRef.current.forEach(clearTimeout);
    correctTransitionTimersRef.current = [];
  }

  function scheduleCorrectTransition(callback: () => void, delayMs: number) {
    const timer = setTimeout(callback, delayMs);
    correctTransitionTimersRef.current.push(timer);
  }

  useEffect(() => clearCorrectTransitionTimers, []);

  // Gate position: 1 = fully down (showing clues), 0 = fully up (hidden)
  const gatePosition = useRef(new Animated.Value(1)).current;
  // The correct plaque's throw into the gate (DailyCastleStage), and the
  // floor coin that rises as the gate comes back down.
  const [castleFlight, setCastleFlight] = useState<DailyCastleFlight | null>(null);
  const flightProgress = useRef(new Animated.Value(0)).current;
  const [coinRise, setCoinRise] = useState<DailyCoinRise>({ token: 0, ms: 0 });
  // Bumped on each correct claim: the castle's gold hit (DailyCastleStage).
  const [goldHitToken, setGoldHitToken] = useState(0);
  // Where the castle is drawn, so Polly's bubble can sit on its steps.
  const [castleFrame, setCastleFrame] = useState<DailyCastleFrame | null>(null);
  // The win's gold-coin finale, after the coin lands and before Results
  // (ui/dailyCoinFinale.ts). 0 at rest: the hero coin is hidden.
  const coinFinale = useRef(new Animated.Value(0)).current;
  // Reduce Motion or Reduce Flashes: the castle's gold hit runs calm (its
  // length decides when the finale may start) and the hero gets no glint.
  const reduceFlashes = useReducedFlashesPreference();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Window y of the HUD's bottom edge. The SafeAreaView sits at the window
  // origin, so the HUD's own layout y already includes the top inset.
  const [hudBottom, setHudBottom] = useState(0);

  const completedRef = useRef(false);
  const roundStartRef = useRef<number>(Date.now());
  const dailyFocusedRef = useRef(false);
  const dailySessionRef = useRef(dailySession);
  dailySessionRef.current = dailySession;

  // A new session (a new day, a dev reset) returns the coin finale to rest.
  // Its gold coin is sunk under the floor by then, so nothing visible changes.
  useEffect(() => {
    if (!dailyCoinFinaleResetsFor(dailySession?.status)) return;
    coinFinale.stopAnimation();
    coinFinale.setValue(DAILY_COIN_FINALE_STEPS.landed);
  }, [dailySession?.status, dailySession?.date, coinFinale]);
  const currentClaimPresentation = claimPresentationRef.current ?? claimPresentation;
  const displayPhase: DailyClaimPresentationPhase = currentClaimPresentation
    ? currentClaimPresentation.outcome === 'correct'
      ? claimPhase
      : 'settling'
    : claimPhase;
  const displayedDailySession = selectDailyDisplaySession(
    dailySession,
    currentClaimPresentation,
    displayPhase,
  );

  // ── Chance loss feedback — shake + red pulse when chances drop ──
  const hudShakeX = useRef(new Animated.Value(0)).current;
  const hudShakeY = useRef(new Animated.Value(0)).current;
  const featherPulse = useRef(new Animated.Value(0)).current;
  const prevChancesRef = useRef(3);

  useEffect(() => {
    const current = displayedDailySession?.chancesRemaining;
    if (current == null) return;
    const prev = prevChancesRef.current;
    prevChancesRef.current = current;
    if (current >= prev) return;
    // Chance lost — shake the HUD
    Animated.sequence([
      Animated.parallel([
        Animated.timing(hudShakeX, { toValue: 3, duration: 25, useNativeDriver: true }),
        Animated.timing(hudShakeY, { toValue: -2, duration: 25, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(hudShakeX, { toValue: -3, duration: 25, useNativeDriver: true }),
        Animated.timing(hudShakeY, { toValue: 2, duration: 25, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(hudShakeX, { toValue: 0, duration: 35, useNativeDriver: true }),
        Animated.timing(hudShakeY, { toValue: 0, duration: 35, useNativeDriver: true }),
      ]),
    ]).start();
    // Red pulse on feather row
    featherPulse.setValue(0);
    Animated.sequence([
      Animated.timing(featherPulse, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(featherPulse, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [displayedDailySession?.chancesRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

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
      presentationActive:
        presentation !== null || isDailyClaimInputLocked(claimPhaseRef.current),
      committedRoundElapsedMs: session.roundElapsedMs,
      presentationRoundElapsedMs,
      roundStartedAtMs: roundStartRef.current,
      nowMs: Date.now(),
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

  // AUDIO READY GATE — SFX is app-owned and shared across screens. Daily
  // waits for that shared pool instead of starting its own preload race.
  const [audioReady, setAudioReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    sfxReady().then(() => {
      if (cancelled) return;
      // The blocks' grind and thuds start on their animation frames, so
      // their players must already be loaded (sounds otherwise load on demand).
      warmDailyPlaqueEntranceSfx();
      setAudioReady(true);
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
  // No round-change haptic of its own: a new round is felt through its blocks
  // seating in the wall (DailyCastleStage, 'dailyStoneSeat').
  useEffect(() => {
    if (!displayedDailySession || displayedDailySession.status !== 'active') return;
    const physicalTransitionActive = isDailyClaimInputLocked(claimPhaseRef.current);
    if (!physicalTransitionActive) {
      completedRef.current = false;
      completingCandidateRef.current = null;
      pendingClaimCandidateRef.current = null;
      setRevealSolvedCount(0);
    }
    // Unlocking itself is handled by the audioReady-gated effect below —
    // it re-checks audioReady on every round change too, so this doesn't
    // need to unlock unconditionally here.
    roundStartRef.current = Date.now() - displayedDailySession.roundElapsedMs;

    const round = displayedDailySession.rounds[displayedDailySession.currentRoundIndex];
    if (!round) return;
    const candidates = [...round.candidates];
    const map = new Map<string, DailyAnswerCardState>();
    const committedWrongClaims = new Set(round.wrongClaims);
    candidates.forEach((c) =>
      map.set(c, committedWrongClaims.has(c) ? 'disabled' : 'idle'),
    );
    setCardStates(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedDailySession?.currentRoundIndex]);

  // BLOCK ENTRANCE — a new round's blocks punch out of the wall the moment
  // their slots mount (DailyCastleStage, keyed by this round index). Hold
  // input until the last is flush. Same inputs as the slots' own effect
  // (round, reduce motion), so the lock and the motion start together. Must
  // stay above the unlock gate so the gate sees the lock in the same commit.
  const plaquesInWall =
    dailyInitialized && displayedDailySession?.status === 'active';
  useEffect(() => {
    const entranceMs = plaquesInWall
      ? dailyPlaqueEntranceMs(reduceMotion === false)
      : 0;
    if (entranceMs <= 0) {
      setPlaquesPresenting(false);
      return;
    }
    setPlaquesPresenting(true);
    setLocked(true);
    const settledTimer = setTimeout(() => setPlaquesPresenting(false), entranceMs);
    return () => clearTimeout(settledTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedDailySession?.currentRoundIndex, plaquesInWall, reduceMotion]);

  // UNLOCK GATE — fires on round change (paired with the effect above,
  // which always runs first in the same commit and resets completedRef)
  // and whenever audioReady flips true, so a round that starts before
  // audio finishes preloading unlocks retroactively instead of never.
  useEffect(() => {
    if (!canUnlockDailyRound({
      audioReady,
      roundActive: displayedDailySession?.status === 'active',
      roundCompleted: completedRef.current,
      plaquesPresenting: plaquesPresentingRef.current,
    })) return;
    setLocked(false);
  }, [
    audioReady,
    displayedDailySession?.currentRoundIndex,
    displayedDailySession?.status,
    plaquesPresenting,
  ]);

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
        if (isDailyClaimInputLocked(claimPhaseRef.current)) return;
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
    // 'correct' (an ordinary, non-winning claim) shares toPerchReaction's
    // 'perched' fallthrough with "no reaction" — it needs its own branch here
    // so PollyDailyPerch still gets told to react, just with the perched pose.
    // A correct claim's line waits for the throw (PollyDailyPerch's
    // throwDelayMs), so it stays up that much longer.
    const throwMs = dailyThrowGoneMs(reduceMotion === false);
    if (dailyLastClaimResult.pollyReaction === 'correct') {
      setPollyPose('correct');
      setTimeout(() => {
        setPollyPose('perched');
        clearDailyReaction();
      }, 2800 + throwMs);
      return;
    }
    const pose = toPerchReaction(dailyLastClaimResult.pollyReaction);
    if (pose !== 'perched') {
      setPollyPose(pose);
      setTimeout(() => {
        setPollyPose('perched');
        clearDailyReaction();
      }, 2800 + (pose === 'shocked' ? throwMs : 0));
    } else {
      clearDailyReaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLastClaimResult]);

  function finishPhysicalCorrectTransition(candidate: string) {
    if (completingCandidateRef.current !== candidate) return;
    clearCorrectTransitionTimers();
    if (claimPresentationRef.current?.candidate === candidate) {
      finishClaimPresentation(candidate);
    }

    flightProgress.stopAnimation();
    flightProgress.setValue(0);
    setCastleFlight(null);
    // After a win the finale stays at gone: the gold coin left the floor with
    // the hero and must not reappear behind Results (the effect below brings
    // it back to rest when a new session starts).
    coinFinale.stopAnimation();
    coinFinale.setValue(dailyCoinFinaleRestingStep(dailySessionRef.current?.status));
    setRevealSolvedCount(0);
    completingCandidateRef.current = null;
    setPhysicalClaimPhase('idle');

    // Animate gate back down for the next round
    const gateDropMs = reduceMotion !== false ? 0 : 350;
    if (gateDropMs > 0) {
      Animated.timing(gatePosition, {
        toValue: 1,
        duration: gateDropMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      gatePosition.setValue(1);
    }

    const committedSession = dailySessionRef.current;
    if (committedSession?.status === 'active') {
      completedRef.current = false;
      roundStartRef.current = Date.now() - committedSession.roundElapsedMs;
      // Still locked if the new blocks are mid-punch; the unlock gate opens
      // input once they are flush.
      setLocked(!canUnlockDailyRound({
        audioReady,
        roundActive: true,
        roundCompleted: false,
        plaquesPresenting: plaquesPresentingRef.current,
      }));
    } else {
      setLocked(true);
    }
  }

  // Correct claim, one continuous physical beat:
  //   the plaque is thrown up at the castle while the gate lifts →
  //   it passes into the opening and goes in BEHIND the gate line →
  //   it flies off down the tunnel → a short beat on the empty tunnel →
  //   the gate comes down carrying the next round's clues, and as it
  //   does this round's coin rises out of the courtyard floor (on the win,
  //   the gold coin, while the four white ones sink) and the next round's
  //   plaques come out of the wall.
  function runPhysicalCorrectTransition(
    candidate: string,
    origin: DailyAnswerCardClaimOrigin | null,
  ) {
    clearCorrectTransitionTimers();
    setPhysicalClaimPhase('settling');

    const motion = reduceMotion === false;
    const gateRiseMs = dailyGateRiseMs(motion);
    const tunnelBeatMs = motion ? 180 : 80;
    const gateDropMs = motion ? 400 : 120;
    // On the win the gold coin lands with the gate, then the finale flies it
    // at the player before Results (ui/dailyCoinFinale.ts). It waits for the
    // castle's gold hit to be over, so the two never compete.
    const finaleMode = motion ? 'full' : 'calm';
    const finaleTiming = DAILY_COIN_FINALE[finaleMode];

    // The plaque only flies with motion on and a measured release point;
    // otherwise it simply leaves the wall and the gate beat carries the claim.
    flightProgress.stopAnimation();
    flightProgress.setValue(0);
    setCastleFlight(motion && origin ? { label: candidate, origin } : null);

    gatePosition.stopAnimation();
    Animated.timing(gatePosition, {
      toValue: 0,
      duration: gateRiseMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (motion && origin) {
      Animated.sequence([
        Animated.timing(flightProgress, {
          toValue: DAILY_CASTLE_FLIGHT_HANDOFF,
          duration: DAILY_CASTLE_FLIGHT.riseMs,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flightProgress, {
          toValue: 1,
          duration: DAILY_CASTLE_FLIGHT.absorbMs,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }

    // The plaque is gone down the tunnel.
    const goneAtMs = dailyThrowGoneMs(motion);
    scheduleCorrectTransition(() => {
      if (completingCandidateRef.current !== candidate) return;
      setPhysicalClaimPhase('landed');
      Haptics.cueAsync('dailyRodStop');
    }, goneAtMs);

    // The gate comes back down, and it is the new round. 'reward' switches the
    // display to the committed session while the gate is still up, so the
    // next clues are already painted on it as it drops. The coin rises on
    // the same beat and lands with the gate.
    const dropAtMs = goneAtMs + tunnelBeatMs;
    const floorHoldMs = dailyCoinFinaleFloorHoldMs(
      finaleMode,
      dropAtMs + gateDropMs,
      dailyGoldHitMs(reduceFlashes),
    );
    scheduleCorrectTransition(() => {
      if (completingCandidateRef.current !== candidate) return;
      setCastleFlight(null);
      setPhysicalClaimPhase('reward');
      setCoinRise((prev) => ({ token: prev.token + 1, ms: motion ? gateDropMs : 0 }));
      Animated.timing(gatePosition, {
        toValue: 1,
        duration: gateDropMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || completingCandidateRef.current !== candidate) return;
        if (dailySessionRef.current?.status === 'won') {
          runGoldCoinFinale();
          return;
        }
        finishClaimPresentation(candidate);
        finishPhysicalCorrectTransition(candidate);
      });
    }, dropAtMs);

    // The gold coin has landed. It rests, leaves the floor and flies at the
    // player, arrives at hero size (the reward chime and Success haptic land
    // here, not at the rise), settles, glints once, holds, and goes; then
    // Results. Reduce Motion: the same beats as a crossfade in place.
    const runGoldCoinFinale = () => {
      const steps = DAILY_COIN_FINALE_STEPS;
      const step = (toValue: number, duration: number, easing: (t: number) => number) =>
        Animated.timing(coinFinale, { toValue, duration, easing, useNativeDriver: true });
      coinFinale.stopAnimation();
      coinFinale.setValue(steps.landed);
      Animated.sequence([
        step(steps.liftOff, floorHoldMs, Easing.linear),
        step(
          steps.arrived,
          finaleTiming.flightMs,
          motion ? Easing.inOut(Easing.cubic) : Easing.inOut(Easing.quad),
        ),
        step(steps.settled, finaleTiming.settleMs, Easing.out(Easing.quad)),
        step(steps.held, finaleTiming.holdMs, Easing.linear),
        step(steps.gone, finaleTiming.exitMs, Easing.in(Easing.quad)),
      ]).start(({ finished }) => {
        // Results only once the hero has gone.
        if (!finished || completingCandidateRef.current !== candidate) return;
        finishClaimPresentation(candidate);
        finishPhysicalCorrectTransition(candidate);
      });
      scheduleCorrectTransition(() => {
        if (completingCandidateRef.current !== candidate) return;
        playSfx('mastered');
        Haptics.cueAsync('mastery');
      }, dailyCoinFinaleArrivalMs(finaleMode, floorHoldMs));
    };

    // Safety net if the drop or the finale is interrupted (long enough to
    // cover the whole finale).
    scheduleCorrectTransition(
      () => finishPhysicalCorrectTransition(candidate),
      dropAtMs + gateDropMs + dailyCoinFinaleTotalMs(finaleMode, floorHoldMs) + 600,
    );
  }

  function handleClaimStart(candidate: string): boolean {
    if (!canBeginDailyClaim(completedRef.current, inputLockedRef.current)) {
      return false;
    }
    pendingClaimCandidateRef.current = candidate;
    setLocked(true);
    return true;
  }

  function handleClaim(
    candidate: string,
    origin: DailyAnswerCardClaimOrigin | null,
  ) {
    const ownsPendingLock = pendingClaimCandidateRef.current === candidate;
    if (completedRef.current || (inputLockedRef.current && !ownsPendingLock)) return;
    pendingClaimCandidateRef.current = null;
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
      beginClaimPresentation(dailySession, candidate, 'correct');
      runPhysicalCorrectTransition(candidate, origin);

      // Game result commits immediately; the physical presentation now owns
      // the readable settle, cover, reward, and next-clue reveal sequence.
      // The win's Success haptic lands with the gold coin (see
      // runPhysicalCorrectTransition), not here at the claim.
      Haptics.cueAsync('standardCorrect');
      playSfx('correctClaim');
      // The castle lights gold on the same beat as the claim's sound.
      setGoldHitToken((token) => token + 1);
      // Remaining cards fade out
      scheduleCorrectTransition(() => {
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

    // Wrong — the gate slams down a short distance then rebounds.
    setLocked(true);
    setCardStates((prev) => new Map(prev).set(candidate, 'wrong'));
    Haptics.cueAsync('wrong');
    playSfx('trapWrong');
    beginClaimPresentation(dailySession, candidate, 'wrong');

    // Reduced motion omits the jolt.
    if (reduceMotion === false) {
      // Translate the gate vertically only; no scale or horizontal movement.
      Animated.sequence([
        Animated.timing(gatePosition, {
          toValue: 1.06,
          duration: 75,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gatePosition, {
          toValue: 0.97,
          duration: 70,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gatePosition, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }

    const wrongExitMs = reduceMotion !== false
      ? DAILY_CARD_TIMING.reducedWrongExitMs
      : DAILY_CARD_TIMING.wrongExitMs;
    setTimeout(() => {
      if (!finishClaimPresentation(candidate)) return;
      setCardStates((prev) => new Map(prev).set(candidate, 'disabled'));
      setLocked(false);
    }, wrongExitMs);
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
    claimPhase,
  );
  const challengeNumber = displayedDailySession
    ? displayedDailySession.challengeNumber
    : getChallengeNumber(getTodayDateString());
  const currentRound =
    displayedDailySession?.rounds[displayedDailySession.currentRoundIndex] ?? null;
  const revealedCount = currentRound?.revealedClueCount ?? 1;
  // A won challenge keeps its last round as current, so once the display
  // switches to the committed session the gate would come back down wearing
  // the final round's clues. It comes down blank instead, straight into
  // Results.
  const gateClues =
    committedComplete && (claimPhase === 'reward' || claimPhase === 'revealing')
      ? []
      : currentRound?.word.clues ?? [];
  const dailyPressure = displayedDailySession
    ? Math.min(
        0.18,
        displayedDailySession.currentRoundIndex * 0.025 +
          (2 - displayedDailySession.chancesRemaining) * 0.045,
      )
    : 0;

  return (
    <View style={styles.screen}>
      {/* Daily's own sky, distinct from Boss's now that they no longer share art or tint. */}
      <AmbientSkyBackground {...DAILY_SKY_TUNING} />
      <LinearGradient
        colors={['rgba(15,13,42,0.46)', 'rgba(15,13,42,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[styles.dailyPressureVeil, { opacity: dailyPressure }]}
      />

      {/* The castle sits outside the SafeAreaView on purpose: its art is
          registered to the full screen, and the thrown plaque's origin comes
          from measureInWindow. The SafeAreaView above it is box-none so the
          plaques in the wall stay touchable. */}
      {/* The same castle stands behind the entry card and Results, gate shut
          and blank (Pete, 2026-09-26). One element across all three phases, so
          the floor stays as the win left it when Results come up: no gold coin
          after the finale (DailyCoinFinale), the gold coin on a reopened win. */}
      {dailyInitialized && (
        <DailyCastleStage
          gatePosition={gatePosition}
          clues={!isComplete && displayedDailySession ? gateClues : []}
          revealedCount={revealedCount}
          solvedCount={
            isComplete
              ? dailyResult?.solvedCount ?? revealSolvedCount
              : displayedDailySession
                ? revealSolvedCount || displayedDailySession.currentRoundIndex
                : 0
          }
          roundKey={displayedDailySession?.currentRoundIndex ?? 0}
          flight={castleFlight}
          flightProgress={flightProgress}
          coinRise={coinRise}
          goldHitToken={goldHitToken}
          coinFinale={coinFinale}
          hudBottom={hudBottom}
          roundMarkers={!isComplete && displayedDailySession
            ? {
                current: Math.min(displayedDailySession.currentRoundIndex, DAILY_ROUND_COUNT - 1),
                total: DAILY_ROUND_COUNT,
              }
            : null}
          onFrame={setCastleFrame}
        >
          {!isComplete && displayedDailySession && currentRound &&
            [...currentRound.candidates].map((candidate, index) => (
              <DailyAnswerCard
                key={candidate}
                label={candidate}
                state={cardStates.get(candidate) ?? 'idle'}
                disabled={inputLocked}
                onClaimStart={handleClaimStart}
                onClaim={handleClaim}
                testID={`daily-answer-${index}`}
                enterFromRecess
                castleArt
                roundKey={displayedDailySession.currentRoundIndex}
              />
            ))}
        </DailyCastleStage>
      )}

      <SafeAreaView style={styles.content} pointerEvents="box-none">
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
          <Animated.View
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              setHudBottom(y + height);
            }}
            style={[
              styles.hudLayer,
              { transform: [{ translateX: hudShakeX }, { translateY: hudShakeY }] },
            ]}
          >
            <DailyHUD
              challengeNumber={challengeNumber}
              chances={displayedDailySession.chancesRemaining}
              featherPulse={featherPulse}
            />
          </Animated.View>

          <Text style={[styles.actionLabel, { bottom: dailyActionLabelBottom(insets.bottom) }]}>
            {displayedDailySession.currentRoundIndex === DAILY_ROUND_COUNT - 1 ? 'FINAL CLAIM · ' : ''}
            {DAILY_ACTION_RULE}
          </Text>
        </>
      )}

      <PollyDailyPerch
        reaction={pollyPose}
        rivalryState={rivalryState}
        show={!isComplete && !isReadyToStart}
        hudBottom={hudBottom}
        bubbleAt={
          castleFrame
            ? {
                x: DAILY_POLLY_BUBBLE.x * castleFrame.scale,
                y: castleFrame.top + DAILY_POLLY_BUBBLE.y * castleFrame.scale,
                maxWidth: DAILY_POLLY_BUBBLE.maxWidth,
              }
            : undefined
        }
        throwDelayMs={dailyThrowGoneMs(reduceMotion === false)}
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

      {__DEV__ && (
        <Pressable
          onPress={() => setCastleTuningVisible((visible) => !visible)}
          style={[styles.devResetBtn, { right: 14, bottom: 104 }]}
        >
          <Text style={styles.devResetText}>CASTLE TUNE</Text>
        </Pressable>
      )}

      {__DEV__ && DailyCastleTuningPanel && (
        <DailyCastleTuningPanel visible={castleTuningVisible} />
      )}

      </SafeAreaView>

      {/* The win's hero coin, over everything (the castle, HUD and Polly
          included); Results waits for it. Invisible at rest. */}
      {dailyInitialized && (
        <DailyCoinFinale
          progress={coinFinale}
          mode={reduceMotion === false ? 'full' : 'calm'}
          glint={!reduceFlashes}
          frame={castleFrame}
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          topInset={insets.top}
        />
      )}
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
    ...StyleSheet.absoluteFill,
    backgroundColor: PW.color.purple,
  },
  hudLayer: {
    position: 'relative',
    zIndex: 80,
    elevation: 80,
  },
  // The background layers sit on the outer View so they reach the true screen
  // edges; this holds everything that should respect the safe-area insets.
  content: {
    flex: 1,
    // Above the castle stage (zIndex 1), which is its sibling: the HUD, Polly,
    // the action label, the entry card and Results all live in here. It is
    // box-none, so touches still reach the plaques in the stage below.
    zIndex: 2,
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
    borderRadius: 16,
    borderWidth: 2,
    borderColor: dailyScrollMaterial.goldTrim,
    backgroundColor: 'rgba(26,24,48,0.92)',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    // Stone wall texture behind the card
    overflow: 'hidden',
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
  // Castle arch — front frame at top, in front of gate
  castleArch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 50,
    elevation: 50,
  },
  // Gate — behind the arch, drops down through its opening
  gateBehindArch: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
    elevation: 30,
  },
  // Answer wall — bottom area where cards emerge from
  answerWallImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: 10,
    elevation: 10,
  },
  actionLabel: {
    // bottom comes from dailyActionLabelBottom: the grid's clearance uses it.
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 60,
    color: dailyChromeMaterial.actionLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
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
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    zIndex: 40,
    elevation: 40,
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
});

// Sized from DAILY_HUD, whose dailyHudHeight() the castle geometry tests use.
const hud = StyleSheet.create({
  plate: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: DAILY_HUD.marginTop,
    paddingTop: DAILY_HUD.padTop,
    paddingBottom: DAILY_HUD.padBottom,
    paddingHorizontal: DAILY_HUD.padX,
    borderRadius: 8,
    backgroundColor: dailyHudMaterial.rowBg,
    borderWidth: DAILY_HUD.border,
    borderColor: dailyHudMaterial.rowBorder,
    borderBottomColor: dailyHudMaterial.rowBorderBottom,
  },
  label: {
    color: dailyHudMaterial.label,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: DAILY_HUD.labelSize,
    // Barlow Condensed's own 1.2 em, stated so the plate's height is known.
    lineHeight: DAILY_HUD.labelLineHeight,
    letterSpacing: 2,
    textShadowColor: dailyHudMaterial.labelGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  feathers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DAILY_HUD.featherGap,
  },
});

const feather = StyleSheet.create({
  img: {
    width: DAILY_HUD.feather,
    height: DAILY_HUD.feather,
  },
});

const res = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
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
    backgroundColor: 'rgba(26,24,48,0.94)',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    // Stone wall border effect
    borderColor: 'rgba(245,200,66,0.4)',
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
