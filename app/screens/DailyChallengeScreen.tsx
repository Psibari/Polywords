import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Haptics } from '../utils/haptics';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  AppState,
  BackHandler,
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
import { getDisplayStreak } from '../game/dailyStreak';
import { DailyClaimResult, DailySession } from '../game/types';
import {
  beginDailyCommittedPresentation,
  canBeginDailyClaim,
  canUnlockDailyRound,
  dailyCelebrationHaptic,
  DailyClaimPresentation,
  DailyClaimPresentationPhase,
  isDailyClaimInputLocked,
  resolveDailyCelebrationGrade,
  resolveDailyActiveElapsedMs,
  selectDailyDisplaySession,
  shouldShowDailyResult,
} from '../game/dailyClaimPresentation';
import {
  BREACH_CONTACT_LEAD_MS,
  dailyBreachBeats,
  dailyBreachClockMs,
  dailyBreachContactCueMs,
  dailyBreachCracksOnClock,
  dailyBreachEffects,
  dailyBreachGateJitterOnClock,
  dailyBreachHapticCue,
  dailyBreachPollyMoveEndMs,
  dailyBreachPressOnClock,
  dailyGateBreakKeyframes,
  resolveDailyBreachTier,
  type DailyBreachTier,
} from '../ui/dailyBreach';
import { canOpenDailyPause } from '../game/dailyPause';
import { DAILY_INTRO_SEEN_KEY } from '../constants/storageKeys';
import { recordPlaytestEvent } from '../game/playtestTelemetry';
import { resolveRivalryState } from '../game/pollyMood';
import { useGameStore } from '../store/useGameStore';
import { playSfx, sfxReady, warmBreachSfx, warmDailyPlaqueEntranceSfx } from '../audio/sfx';
import { playPollyReaction } from '../audio/pollyReactionSfx';
import {
  setMusicState,
  startMusic,
  stopMusic,
} from '../audio/MusicEngine';
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_LOSS_TITLE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyScrollMaterial,
  dailyResultsMaterial,
  dailyHudMaterial,
  dailyChromeMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
import {
  dailyEntryKicker,
  DAILY_ENTRY_TITLE,
  DAILY_ENTRY_RULE,
  DAILY_ENTRY_INTRO,
  DAILY_ENTRY_RULES,
  DAILY_ENTRY_REWARD,
  DAILY_ENTRY_REWARD_SUB,
  dailyEntryTaunt,
  DAILY_ENTRY_TAUNT_FIRST,
  DAILY_ENTRY_ATTEMPT,
  DAILY_ENTRY_BEGIN,
  DAILY_ENTRY_BEGIN_BUSY,
  DAILY_ENTRY_RULES_SHOW,
  DAILY_ENTRY_RULES_HIDE,
  DAILY_ENTRY_RULES_A11Y_SHOW,
  DAILY_ENTRY_RULES_A11Y_HIDE,
  DAILY_ENTRY_LEAVE,
} from '../ui/dailyEntryCopy';
import DailyAnswerCard, {
  DailyAnswerCardClaimOrigin,
  DAILY_CARD_TIMING,
  DailyAnswerCardState,
} from '../components/DailyAnswerCard';
import DailyCastleStage, { DailyCastleFlight, type DailyCastleShakeTransform } from '../components/DailyCastleStage';
import { type DailyCoinRise } from '../components/DailyFloorCoins';
import DailyCoinFinale from '../components/DailyCoinFinale';
import { DailyPauseCard } from '../components/DailyPauseCard';
import { DailyExpiredCard } from '../components/DailyExpiredCard';
import { isDailySessionExpired } from '../game/dailyExpiry';
import UiIconButton from '../components/UiIconButton';
import { DAILY_PAUSE_ICON_A11Y } from '../ui/dailyPauseCopy';
import {
  DAILY_CASTLE_FLIGHT_HANDOFF,
  DAILY_HUD,
  dailyStreakLineFits,
  DAILY_POLLY_BUBBLE,
  DAILY_POLLY_PERCH,
  dailyActionLabelBottom,
  dailyGoldHitMsForTier,
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
import { dailyPlaqueEntranceMode, dailyPlaqueLockMs } from '../ui/dailyPlaqueEntrance';
import PollyDailyPerch from '../components/PollyDailyPerch';
import { pollyScreenPoseArt } from '../ui/pollyScreenPoses';
import {
  usePollyAmbientMotion,
  useReducedFlashesPreference,
  useReducedMotionPreference,
} from '../hooks/usePollyAmbientMotion';
import { resolveGameplayFeedbackAccessibility } from '../game/gameplayFeedbackAccessibility';

const DailyCastleTuningPanel = __DEV__
  ? require('../dev/DailyCastleTuningPanel').default
  : null;
const DailyPuzzlePicker = __DEV__
  ? require('../dev/DailyPuzzlePicker').default
  : null;


// Maps store claim result reaction -> PollyDailyPerch prop

// Longest the Daily's ending waits for Polly's fly-out hand-off before opening
// Results anyway. Her normal path is about 3.9 s after the winning claim.
const DAILY_POLLY_EXIT_FAILSAFE_MS = 6000;
// Extra room past a winning claim's tier move, which delays the win itself.
const DAILY_POLLY_EXIT_MOVE_MARGIN_MS = 1000;

/**
 * The exit failsafe for one claim. Her normal exit: the bubble waits for the
 * throw, shows 2500 ms, fades 220 ms, and she flies 500 ms.
 *   'open' win (no delay): 650 + 2500 + 220 + 500 = 3870 ms, about 3.9 s;
 *     failsafe 6000.
 *   two-clue win: the win starts at 2823 (her move's end) and its bubble waits
 *     max(0, 1610 - 2823) = 0, so 2823 + 2500 + 220 + 500 = 6043 ms;
 *     failsafe 6000 + 2823 + 1000 = 9823.
 *   one-clue win (she is blown off the screen and flies back): 2960 + 3220 = 6180 ms;
 *     failsafe 6000 + 2960 + 1000 = 9960.
 * A delayed win's exit is today's path shifted by the delay, so the failsafe
 * keeps today's 6000 ms of room after it, plus the margin.
 */
function dailyPollyExitFailsafeMs(winDelayMs: number): number {
  return winDelayMs > 0
    ? DAILY_POLLY_EXIT_FAILSAFE_MS + winDelayMs + DAILY_POLLY_EXIT_MOVE_MARGIN_MS
    : DAILY_POLLY_EXIT_FAILSAFE_MS;
}
// The pause icon's opacity while it ignores taps (a claim or Polly's reaction
// in flight).
const DAILY_PAUSE_ICON_DIMMED_OPACITY = 0.6;
/**
 * A wrong claim's gate shimmy: its first leg drives the gate past fully down
 * until it hits the stop. The 'wrong' haptic lands on that same beat.
 */
const DAILY_WRONG_GATE_STOP_MS = 75;

/**
 * The gate's rise on a correct claim, for the claim's breach tier
 * (ui/dailyBreach.ts): 400 ms with motion, 120 without, every tier.
 */
function dailyGateRiseMs(motion: boolean, tier: DailyBreachTier): number {
  return dailyBreachBeats(tier, motion).gateRiseMs;
}

/**
 * From a correct claim until the thrown plaque is gone down the tunnel and the
 * gate is up, for the claim's breach tier. Polly's bubble on the steps waits
 * this long, so it never covers the throw or the breach. 'open' is today's
 * max(gate rise, rise 450 + absorb 200): 650 ms, 120 without motion.
 */
function dailyThrowGoneMs(motion: boolean, tier: DailyBreachTier): number {
  return dailyBreachBeats(tier, motion).thrownGoneMs;
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
  streak,
}: {
  challengeNumber: number;
  chances: number;
  featherPulse?: Animated.Value;
  /** Consecutive days the player has finished the Daily; the line shows only above zero. */
  streak: number;
}) {
  // Compact, centred between the towers (Pete, 2026-09-28): DAILY #<n> with
  // the chances beneath it. The round markers sit on the wall's frieze
  // (DailyRoundMarkers, placed by DailyCastleStage).
  return (
    <View style={hud.plate}>
      {streak > 0 ? (
        <Text allowFontScaling={false} style={hud.streak} accessibilityLabel={`Streak ${streak} days`}>{`STREAK ${streak}`}</Text>
      ) : null}
      <Text allowFontScaling={false} style={hud.label}>{`DAILY #${challengeNumber}`}</Text>
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
  const fadeIn = useRef(new Animated.Value(0)).current;
  const { translateX: pollyX, translateY: pollyY } =
    usePollyAmbientMotion('results', dailyResult !== null);
  // No Polly line here: she says her last line in full on the perch before
  // Results opens, and the perch remembers it (Pete, 2026-10-08).

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  if (!dailyResult) return null;

  const isWin = dailyResult.status === 'won';
  const resultPollyArt = pollyScreenPoseArt(isWin ? 'shocked' : 'laugh');

  return (
    <Animated.View style={[res.fill, { opacity: fadeIn }]}>
      <ScrollView
        style={res.scroll}
        contentContainerStyle={res.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[res.card, isWin ? res.cardWin : res.cardLoss]}>
        <Text allowFontScaling={false} style={res.challenge}>{`DAILY #${dailyResult.challengeNumber}`}</Text>

        <Text allowFontScaling={false} style={[res.title, { color: isWin ? dailyResultsMaterial.titleWin : dailyResultsMaterial.titleLoss }]}>
          {isWin ? DAILY_WIN_TITLE : DAILY_LOSS_TITLE}
        </Text>

        {(isWin || streakMilestoneReward) && (
          <View style={styles.featherWrap}>
            <Image
              source={FEATHER_IMG}
              style={styles.featherImage}
              resizeMode="contain"
            />
            <Text allowFontScaling={false} style={styles.featherLabel}>
              {streakMilestoneReward
                ? getStreakMilestoneRewardLabel(streakMilestoneReward)
                : DAILY_WIN_REWARD}
            </Text>
          </View>
        )}

        {(() => {
          if (isWin) {
            return (
              <Text allowFontScaling={false} style={res.stat}>
                {`${dailyResult.solvedCount}/${DAILY_ROUND_COUNT} words - ${dailyResult.chancesRemaining} lives left`.toUpperCase()}
              </Text>
            );
          }
          const missedIndex = dailyResult.wordResults.findIndex(r => r.status === 'missed');
          const roundLabel = missedIndex >= 0 ? missedIndex + 1 : DAILY_ROUND_COUNT;
          return <Text allowFontScaling={false} style={res.stat}>{`POLYTRAPS GOT YOU ON ROUND ${roundLabel}`.toUpperCase()}</Text>;
        })()}

        <Text allowFontScaling={false} style={res.speedTitle}>CLUE SPEED</Text>
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
                {isUnknown && <Text allowFontScaling={false} style={res.speedUnknownMark}>–</Text>}
              </View>
            );
          })}
        </View>

        <View style={res.speedLegend}>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedClue1]} />
            <Text allowFontScaling={false} style={res.speedLegendText}>1 CLUE</Text>
          </View>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedClue2]} />
            <Text allowFontScaling={false} style={res.speedLegendText}>2 CLUES</Text>
          </View>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedClue3]} />
            <Text allowFontScaling={false} style={res.speedLegendText}>3 CLUES</Text>
          </View>
          <View style={res.speedLegendItem}>
            <View style={[res.speedLegendSwatch, res.speedMissed]} />
            <Text allowFontScaling={false} style={res.speedLegendText}>MISSED</Text>
          </View>
        </View>

        <View style={styles.resultPollyStage}>
          <Animated.View style={{ transform: [{ translateX: pollyX }, { translateY: pollyY }] }}>
            <Image
              source={resultPollyArt.source}
              style={[styles.resultPollyImage, { transform: [{ scale: resultPollyArt.scale }] }]}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Pressable
          style={res.shareBtn}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share result"
        >
          <Text allowFontScaling={false} style={res.shareText}>SHARE RESULT</Text>
        </Pressable>

          <Pressable
            style={({ pressed }) => [res.homeBtn, pressed && res.homeBtnPressed]}
            onPress={onHome}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <Text allowFontScaling={false} style={res.homeText}>HOME</Text>
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
  const expireStaleDailySession = useGameStore((s) => s.expireStaleDailySession);
  const clearDailyExpiredNotice = useGameStore((s) => s.clearDailyExpiredNotice);
  const dailyExpiredNotice = useGameStore((s) => s.dailyExpiredNotice);

  const [cardStates, setCardStates] = useState<Map<string, DailyAnswerCardState>>(
    new Map(),
  );
  const [pollyPose, setPollyPose] = useState<PerchReaction | 'correct'>('perched');
  // One key per reaction sent to the perch. It starts a fresh reaction even
  // when the pose is unchanged (two correct claims in a row), and the perch
  // hands it back when that reaction's bubble has faded. The ref is the
  // latest key, so a report from a replaced reaction is ignored.
  const pollyReactionKeyRef = useRef(0);
  const [pollyReactionKey, setPollyReactionKey] = useState(0);
  // True from the Daily's last claim (win or loss) until Polly has said her
  // last line and flown out; Results waits for it. A safety release stops a
  // missed hand-off from holding Results forever.
  const [pollyExitPending, setPollyExitPending] = useState(false);
  const pollyExitFailsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A winning claim on two clues or one: the win reaction waits for her tier
  // move (see the CLAIM RESULT effect). The delay also shortens the win
  // bubble's wait, which counts from the claim.
  const pollyWinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pollyWinDelayMs, setPollyWinDelayMs] = useState(0);
  useEffect(() => () => {
    if (pollyWinTimerRef.current) clearTimeout(pollyWinTimerRef.current);
  }, []);
  const releasePollyExit = useCallback(() => {
    if (pollyExitFailsafeRef.current) clearTimeout(pollyExitFailsafeRef.current);
    pollyExitFailsafeRef.current = null;
    setPollyExitPending(false);
  }, []);
  useEffect(() => () => {
    if (pollyExitFailsafeRef.current) clearTimeout(pollyExitFailsafeRef.current);
  }, []);
  // Starts locked (unlike the old default of unlocked) — GameScreen never
  // renders its interactive content until audioReady is true; Daily had no
  // equivalent gate at all, so a fast tap could request a sound before
  // preloadSfx() had a chance to finish. See the audioReady effect below.
  const [inputLocked, setInputLocked] = useState(true);
  const [dailyInitialized, setDailyInitialized] = useState(false);
  // Has this install already been told how the Daily works? Read inside the
  // same init that flips dailyInitialized, so the entry card never renders
  // before the answer is known and the explanation cannot flicker in. It
  // starts true and a failed read leaves it true: on storage trouble the
  // player gets the short card, never a repeat lecture (the Boss and Haunt
  // explainers fail closed the same way).
  const [dailyIntroSeen, setDailyIntroSeen] = useState(true);
  // A returning player can reopen the rules on the short card. Reset every
  // time the screen mounts: the short card is what they asked to see.
  const [rulesOpen, setRulesOpen] = useState(false);
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
  // The pause card (DailyPauseCard). The ref is read by the clue clock, the
  // elapsed-time reads and the claim handlers, so it is set in the same call
  // as the state.
  const [paused, setPausedState] = useState(false);
  const pausedRef = useRef(false);
  // TIME'S UP FOR DAILY #N: the number the card is showing. Copied from the store once the Daily
  // has initialised, and the store's copy is cleared at the same moment, so the card shows once.
  const [expiredNoticeNumber, setExpiredNoticeNumber] = useState<number | null>(null);
  // How many of today's 5 rounds are solved as of this claim, for the
  // reveal curtain's feather tally. Computed synchronously in handleClaim
  // (not read from the store) so it can't race the session update.
  const [revealSolvedCount, setRevealSolvedCount] = useState(0);

  // DEV: castle tuning panel
  const [castleTuningVisible, setCastleTuningVisible] = useState(false);
  const [puzzlePickerVisible, setPuzzlePickerVisible] = useState(false);

  function setLocked(val: boolean) {
    inputLockedRef.current = val;
    setInputLocked(val);
  }

  function setPlaquesPresenting(val: boolean) {
    plaquesPresentingRef.current = val;
    setPlaquesPresentingState(val);
  }

  function setPaused(val: boolean) {
    pausedRef.current = val;
    setPausedState(val);
    // A tier move still holding (after its claim ended) stops, and Polly is
    // back on her perch at rest.
    if (val) restBreachClocks();
  }

  function setPhysicalClaimPhase(phase: DailyClaimPresentationPhase) {
    claimPhaseRef.current = phase;
    setClaimPhase(phase);
  }

  /**
   * `keepBreachClocks`: the claim has ended normally, but Polly's tier move
   * still rides its clock through her hold (past the next gate's landing), so
   * the clock runs out on its own. A new claim, a pause and unmount do reset it.
   */
  function clearCorrectTransitionTimers(keepBreachClocks = false) {
    correctTransitionTimersRef.current.forEach(clearTimeout);
    correctTransitionTimersRef.current = [];
    resetBreachPresentation(keepBreachClocks);
  }

  function scheduleCorrectTransition(callback: () => void, delayMs: number) {
    const timer = setTimeout(callback, delayMs);
    correctTransitionTimersRef.current.push(timer);
  }

  useEffect(() => clearCorrectTransitionTimers, []);

  // The wrong claim's haptic, waiting for the gate to hit the stop.
  const wrongGateStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearWrongGateStopTimer() {
    if (wrongGateStopTimerRef.current !== null) clearTimeout(wrongGateStopTimerRef.current);
    wrongGateStopTimerRef.current = null;
  }
  useEffect(() => clearWrongGateStopTimer, []);

  // Gate position: 1 = fully down (showing clues), 0 = fully up (hidden)
  const gatePosition = useRef(new Animated.Value(1)).current;
  // The correct plaque's throw into the gate (DailyCastleStage), and the
  // floor coin that rises as the gate comes back down.
  const [castleFlight, setCastleFlight] = useState<DailyCastleFlight | null>(null);
  const flightProgress = useRef(new Animated.Value(0)).current;
  const [coinRise, setCoinRise] = useState<DailyCoinRise>({ token: 0, ms: 0 });
  // Bumped on each correct claim: the castle's gold hit (DailyCastleStage),
  // graded by the claim's breach tier.
  const [goldHit, setGoldHit] = useState<{ token: number; tier: DailyBreachTier }>({ token: 0, tier: 'open' });
  // The breach (CONTEXT.md "THE BREACH"): the claim's tier, from the claimed
  // round's own clue count. The ref is for the transition's timers; the state
  // is for Polly's bubble delay.
  const claimBreachTierRef = useRef<DailyBreachTier>('open');
  const [claimBreachTier, setClaimBreachTierState] = useState<DailyBreachTier>('open');
  function setClaimBreachTier(tier: DailyBreachTier) {
    claimBreachTierRef.current = tier;
    setClaimBreachTierState(tier);
  }
  // The breach clocks (ui/dailyBreach.ts), one per tier with a contact, in ms
  // from the claim. The claim's clock starts in the same tick as the plaque's
  // first leg, so every contact visual (the castle shake, the gold hit, the
  // flash, the lightning, the splinters and dust on the stage; the shudder,
  // cracks and press on the gate) runs on the native clock from the plaque's
  // own start and lands on its contact frame, with no JS at contact. At 0
  // (rest) every one of them is invisible.
  const breachHitClock = useRef(new Animated.Value(0)).current;
  const breachSmashClock = useRef(new Animated.Value(0)).current;
  // Polly's live gate per clock (0/1, only ever set, never animated): 1 from
  // the moment that clock starts, 0 BEFORE it is stopped. A clock stopped
  // mid-run reports its last value back to JS after it was reset to 0, so the
  // clock alone cannot say her tier move is over (ui/pollyDailyPerchLayers.ts,
  // THE LIVE GATES).
  const breachHitLive = useRef(new Animated.Value(0)).current;
  const breachSmashLive = useRef(new Animated.Value(0)).current;
  const breachClocks = useMemo(
    () => ({ hit: breachHitClock, smash: breachSmashClock, hitLive: breachHitLive, smashLive: breachSmashLive }),
    [breachHitClock, breachSmashClock, breachHitLive, breachSmashLive],
  );
  // The gate's side of the breach: the broken state (it hides clues two and
  // three), the shudder, the cracks on the shut door, and the plaque's press
  // into it. The last three read the clocks; all rest at 0 / whole.
  const [gateBroken, setGateBroken] = useState(false);
  const gateJitterX = useMemo(
    () => Animated.add(
      breachHitClock.interpolate({ ...dailyBreachGateJitterOnClock('hit'), extrapolate: 'clamp' }),
      breachSmashClock.interpolate({ ...dailyBreachGateJitterOnClock('smash'), extrapolate: 'clamp' }),
    ),
    [breachHitClock, breachSmashClock],
  );
  const gateCracks = useMemo(
    () => breachHitClock.interpolate({ ...dailyBreachCracksOnClock(), extrapolate: 'clamp' }),
    [breachHitClock],
  );
  const plaquePress = useMemo(
    () => breachHitClock.interpolate({ ...dailyBreachPressOnClock(), extrapolate: 'clamp' }),
    [breachHitClock],
  );
  // The smash's broken art, driven natively off the flight's own progress
  // (dailyGateBreakKeyframes) so the hole opens in the very frame the plaque
  // goes behind the gate; a React render cannot land in that frame. Armed 0/1:
  // only a smash arms it, and it is disarmed once the broken gate is up.
  const gateBreakArmed = useRef(new Animated.Value(0)).current;
  const gateBrokenArt = useMemo(
    () => Animated.multiply(
      gateBreakArmed,
      flightProgress.interpolate({
        ...dailyGateBreakKeyframes(DAILY_CASTLE_FLIGHT_HANDOFF),
        extrapolate: 'clamp',
      }),
    ),
    [flightProgress, gateBreakArmed],
  );
  // Back to rest whenever the correct-claim timers are cleared: a new claim,
  // the end of one, and unmount.
  function resetBreachPresentation(keepBreachClocks = false) {
    if (!keepBreachClocks) restBreachClocks();
    gateBreakArmed.setValue(0);
    setGateBroken(false);
  }
  // Both clocks to 0: every breach visual, and Polly's tier move, at rest, and
  // Polly back on her perch at (0, 0, 0).
  function restBreachClocks() {
    // A breach rumble still running stops with its breach (a new claim, a
    // wrong claim, a pause, unmount).
    Haptics.cancelBreach();
    // Polly's gates first, so the stopped clocks' late values cannot light her.
    breachHitLive.setValue(0);
    breachSmashLive.setValue(0);
    breachHitClock.stopAnimation();
    breachHitClock.setValue(0);
    breachSmashClock.stopAnimation();
    breachSmashClock.setValue(0);
  }
  // The castle shake's translate values, for Polly's layer (DailyCastleStage onShakeTransform).
  const [castleShake, setCastleShake] = useState<DailyCastleShakeTransform | null>(null);
  // Where the castle is drawn, so Polly's bubble can sit on its steps.
  const [castleFrame, setCastleFrame] = useState<DailyCastleFrame | null>(null);
  // The win's gold-coin finale, after the coin lands and before Results
  // (ui/dailyCoinFinale.ts). 0 at rest: the hero coin is hidden.
  const coinFinale = useRef(new Animated.Value(0)).current;
  // Reduce Motion or Reduce Flashes: the castle's gold hit runs calm (its
  // length decides when the finale may start) and the hero gets no glint.
  const reduceFlashes = useReducedFlashesPreference();
  const { animateMotion, animateFlashes } = resolveGameplayFeedbackAccessibility(
    reduceMotion,
    reduceFlashes,
  );
  // Which breach effects play under Reduce Motion / Reduce Flashes (and while
  // Reduce Motion is still unknown): ONE decision, ui/dailyBreach.ts
  // dailyBreachEffects, read by this screen, the castle stage and the perch.
  const breachPlays = dailyBreachEffects(reduceMotion, reduceFlashes);
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
    hudShakeX.stopAnimation();
    hudShakeY.stopAnimation();
    hudShakeX.setValue(0);
    hudShakeY.setValue(0);
    // Chance lost — shake the HUD
    if (animateMotion) {
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
    }
    // Red pulse on feather row
    featherPulse.setValue(0);
    if (animateFlashes) {
      Animated.sequence([
        Animated.timing(featherPulse, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(featherPulse, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    // No haptic here: a wrong claim's one haptic lands when the gate hits the
    // stop (handleClaim).
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
      // While the pause card is open the clock is frozen at its saved value,
      // so leaving or backgrounding with the card open adds no play time.
      paused: pausedRef.current,
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
        const seen = await AsyncStorage.getItem(DAILY_INTRO_SEEN_KEY);
        setDailyIntroSeen(seen === 'true');
      } catch {
        setDailyIntroSeen(true);
      }
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
      // The breach's contact sounds land on a beat, so they are loaded too.
      warmBreachSfx();
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

  // A new round never inherits a pending wrong-claim haptic.
  useEffect(() => {
    clearWrongGateStopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedDailySession?.currentRoundIndex]);

  // BLOCK ENTRANCE — a new round's blocks come out of the wall the moment
  // their slots mount (DailyCastleStage, keyed by this round index). Hold
  // input until the last is flush. Same inputs as the slots' own effect
  // (round, reduce motion), so the lock and the motion start together. While
  // reduce motion is still unknown the blocks wait hidden, so input stays
  // held until the failsafe at most (dailyPlaqueLockMs). Must stay above the
  // unlock gate so the gate sees the lock in the same commit.
  const plaquesInWall =
    dailyInitialized && displayedDailySession?.status === 'active';
  useEffect(() => {
    const entranceMs = plaquesInWall
      ? dailyPlaqueLockMs(dailyPlaqueEntranceMode(reduceMotion, false))
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
        if (pausedRef.current) return;
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
      // Back in the app after midnight: an unfinished Daily from yesterday is lost, wherever
      // the screen is (under Settings or not).
      if (nextState === 'active') {
        void expireStaleDailySession().then(expired => {
          if (!expired) return;
          pendingClaimCandidateRef.current = null;
          setLocked(false);
          setPaused(false);
        });
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseDailyChallenge, expireStaleDailySession]);

  // CLAIM RESULT -> Polly reaction
  useEffect(() => {
    if (!dailyLastClaimResult) return;
    // 'correct' (an ordinary, non-winning claim) shares toPerchReaction's
    // 'perched' fallthrough with "no reaction" — it needs its own branch here
    // so PollyDailyPerch still gets told to react, just with the perched pose.
    // The perch owns how long the reaction lasts and reports back through
    // handlePollyReactionComplete; nothing here times it.
    if (dailyLastClaimResult.pollyReaction === 'correct') {
      pollyReactionKeyRef.current += 1;
      setPollyPose('correct');
      setPollyReactionKey(pollyReactionKeyRef.current);
      return;
    }
    const pose = toPerchReaction(dailyLastClaimResult.pollyReaction);
    if (pose !== 'perched') {
      // A WIN on two clues or one (Pete, 2026-11-04): her tier move plays
      // FIRST, then today's win (pose, startled sound, recoil, bubble,
      // fly-off). The move rides its breach clock from the claim, so the win
      // waits until that move and its hold are over: 2823 ms on two clues
      // (contact 450 + 1073 + 1300), 2960 on one (0 + 2460 + 500). 'open'
      // wins and Reduce Motion (no tier move) start at once, as before.
      const tier = claimBreachTierRef.current;
      const winDelayMs = pose === 'shocked' && breachPlays.pollyTierMoves && tier !== 'open'
        ? dailyBreachPollyMoveEndMs(tier)
        : 0;
      const startReaction = () => {
        pollyWinTimerRef.current = null;
        pollyReactionKeyRef.current += 1;
        setPollyWinDelayMs(winDelayMs);
        setPollyPose(pose);
        setPollyReactionKey(pollyReactionKeyRef.current);
      };
      if (pollyWinTimerRef.current) clearTimeout(pollyWinTimerRef.current);
      if (winDelayMs > 0) pollyWinTimerRef.current = setTimeout(startReaction, winDelayMs);
      else startReaction();
      if (pose === 'laughing' || pose === 'shocked') {
        // The Daily just ended: hold Results until she has flown out (from
        // the claim, even while her tier move delays the win itself).
        setPollyExitPending(true);
        if (pollyExitFailsafeRef.current) clearTimeout(pollyExitFailsafeRef.current);
        pollyExitFailsafeRef.current = setTimeout(releasePollyExit, dailyPollyExitFailsafeMs(winDelayMs));
      }
    } else {
      clearDailyReaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLastClaimResult]);

  // The perch's bubble for reaction `key` has faded. Only the latest
  // reaction settles her; an older one was replaced and is ignored.
  const handlePollyReactionComplete = useCallback((key: number) => {
    if (key !== pollyReactionKeyRef.current) return;
    setPollyPose('perched');
    clearDailyReaction();
  }, [clearDailyReaction]);

  // Leaving the Daily drops the in-memory claim result, so a quick return
  // does not replay her last reaction (and hold Results) for a claim the
  // player already saw. Unmount only; staying on the screen is unchanged.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => clearDailyReaction(), []);

  function finishPhysicalCorrectTransition(candidate: string) {
    if (completingCandidateRef.current !== candidate) return;
    // Polly's tier move may still be holding on its clock: let it run out.
    clearCorrectTransitionTimers(true);
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
    /** The claim's breach tier: it sets the gold hit's length, which the coin finale waits out. */
    breachTier: DailyBreachTier,
  ) {
    clearCorrectTransitionTimers();
    setPhysicalClaimPhase('settling');

    const motion = breachPlays.motion;
    // The breach's beats for this claim (ui/dailyBreach.ts). 'open', and every
    // tier under Reduce Motion, is today's sequence: the gate rises at once and
    // there is no contact beat.
    const beats = dailyBreachBeats(breachTier, breachPlays.contactBeat);
    const gateRiseMs = dailyGateRiseMs(motion, breachTier);
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
    const flies = motion && origin !== null;
    // The flight's progress also opens the smash's hole, so a breach runs it
    // even when there is no measured plaque to draw.
    const runsProgress = flies || beats.contactMs !== null;
    // A 'hit' plaque holds against the SHUT gate and is still in front of it
    // while it rises, so it never goes onto the copy under the gate
    // (DailyCastleFlight.stayInFront).
    setCastleFlight(flies && origin
      ? { label: candidate, origin, stayInFront: breachTier === 'hit' }
      : null);
    // The tier with a contact beat ('hit' / 'smash' with motion), or null.
    const contactTier = beats.contactMs !== null && breachTier !== 'open' ? breachTier : null;
    if (contactTier) {
      // Everything the contact needs is set HERE, at the claim, so neither the
      // contact nor anything after it has to render: the gold hit's tier (its
      // clock plays it), and for a smash the broken state (it hides clues two
      // and three) and the hole, which opens off the flight's progress.
      setGoldHit((prev) => ({ token: prev.token, tier: contactTier }));
      if (contactTier === 'smash') {
        setGateBroken(true);
        gateBreakArmed.setValue(1);
      }
    }

    gatePosition.stopAnimation();
    const raiseGate = () => {
      Animated.timing(gatePosition, {
        toValue: 0,
        duration: gateRiseMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };
    // The plaque's two legs: up to the handoff, then into the tunnel.
    const plaqueRiseLeg = () => Animated.timing(flightProgress, {
      toValue: DAILY_CASTLE_FLIGHT_HANDOFF,
      duration: beats.plaqueRiseMs,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    const plaqueAbsorbLeg = () => Animated.timing(flightProgress, {
      toValue: 1,
      duration: beats.plaqueAbsorbMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    const plaqueAbsorbAtMs = beats.plaqueGoneMs - beats.plaqueAbsorbMs;
    // 'open' and 'smash' go straight through (the smash through the hole);
    // a 'hit' holds at the shut gate and is absorbed as the gate rises.
    const straightThrough = plaqueAbsorbAtMs === beats.plaqueRiseMs;

    // 'open' (and calm): the gate rises at once. 'hit' / 'smash': it stays
    // shut and rises at gateRiseStartMs (below).
    if (beats.gateRiseStartMs === 0) raiseGate();

    // CONTACT. Its visuals ride the tier's clock (below), so the only JS at
    // contact is its sounds and haptic: fired first, with no state around them.
    // They land on the plaque's real contact, the first leg's completion,
    // unless BREACH_CONTACT_LEAD_MS moves them earlier for output latency.
    const fireContactCues = () => {
      if (completingCandidateRef.current !== candidate) return;
      // The hit you feel, first: a hard hit and a rumble tail that rides the
      // castle shake (haptics.ts BREACH_HAPTICS).
      Haptics.cueAsync(contactTier === 'hit' ? 'breachHit' : 'breachSmash');
      // The breach sounds belong to the contact beat (breachPlays.breachSounds).
      // Polly startles on the contact in both tiers: the two-clue jump starts
      // here, and the fury is blown up and back from here.
      playPollyReaction('startled');
      if (contactTier === 'hit') {
        playSfx('breachGateCrack');
        playSfx('breachCastleRumble');
      } else {
        playSfx('breachSmash');
        playSfx('breachCastleRumble');
        playSfx('breachThunder');
      }
    };
    const cuesOnLegEnd = contactTier !== null && BREACH_CONTACT_LEAD_MS === 0;
    if (contactTier && !cuesOnLegEnd) {
      scheduleCorrectTransition(fireContactCues, dailyBreachContactCueMs(contactTier));
    }

    if (runsProgress) {
      // The tier's clock starts in the SAME tick as the plaque's first leg, so
      // both begin on the same native frame and stay together under load.
      if (contactTier) {
        const clock = contactTier === 'hit' ? breachHitClock : breachSmashClock;
        const clockMs = dailyBreachClockMs(contactTier);
        clock.stopAnimation();
        clock.setValue(0);
        (contactTier === 'hit' ? breachHitLive : breachSmashLive).setValue(1);
        Animated.timing(clock, {
          toValue: clockMs,
          duration: clockMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
        // Polly's fury starts at the throw, with her yell; it rides this clock.
        if (contactTier === 'smash') playPollyReaction('angry');
      }
      plaqueRiseLeg().start(({ finished }) => {
        if (!finished) return;
        if (cuesOnLegEnd) fireContactCues();
        // The plaque's own chaining (what Animated.sequence does): the absorb
        // starts as the first leg ends.
        if (straightThrough) plaqueAbsorbLeg().start();
      });
    }

    // 'hit' / 'smash': the gate rises late, and a 'hit' plaque is absorbed with
    // it (the door's cracks fade on the clock).
    if (beats.gateRiseStartMs > 0) {
      scheduleCorrectTransition(() => {
        if (completingCandidateRef.current !== candidate) return;
        raiseGate();
        if (runsProgress && plaqueAbsorbAtMs === beats.gateRiseStartMs) plaqueAbsorbLeg().start();
      }, beats.gateRiseStartMs);
    }

    // The plaque is gone down the tunnel and the gate is fully up.
    const goneAtMs = dailyThrowGoneMs(motion, breachTier);
    scheduleCorrectTransition(() => {
      if (completingCandidateRef.current !== candidate) return;
      setPhysicalClaimPhase('landed');
      Haptics.cueAsync('dailyRodStop');
      // The broken gate is up out of sight: the gate that drops with the next
      // round's clues is the whole one.
      gateBreakArmed.setValue(0);
      setGateBroken(false);
    }, goneAtMs);

    // The gate comes back down, and it is the new round. 'reward' switches the
    // display to the committed session while the gate is still up, so the
    // next clues are already painted on it as it drops. The coin rises on
    // the same beat and lands with the gate.
    const dropAtMs = goneAtMs + tunnelBeatMs;
    // The win's coin finale waits for the gold hit to be over. The hit starts
    // at the claim ('open', and every tier under Reduce Motion) or at contact
    // ('hit' / 'smash'), so it ends, from the claim:
    //   open  : 0 + 860 = 860;    the coin lands at 650 + 180 + 400 = 1230: no extra wait
    //   hit   : 450 + 980 = 1430; lands at 1610 + 180 + 400 = 2190: no extra wait
    //   smash : 380 + 1230 = 1610; lands at 1460 + 180 + 400 = 2040: no extra wait
    //   calm  : 0 + 750 (calm hit) = 750; lands at 120 + 80 + 120 = 320: waits 430
    // (Reduce Flashes with motion on: the calm 750 from the contact, still
    // well before the coin lands.) The safety net below is measured from the
    // new dropAtMs, so it grows with the tier.
    const goldHitEndMs = (beats.contactMs ?? 0) + dailyGoldHitMsForTier(breachTier, breachPlays.calmGoldHit);
    const floorHoldMs = dailyCoinFinaleFloorHoldMs(
      finaleMode,
      dropAtMs + gateDropMs,
      goldHitEndMs,
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
        // The gate lands: one tap, on every correct claim including the win.
        Haptics.cueAsync('dailyGateShut');
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
    // A stone held before the pause card opened springs back on release.
    if (pausedRef.current) return false;
    // Midnight passed while the Daily sat open: yesterday's Daily is lost, never claimed.
    if (isDailySessionExpired(useGameStore.getState().dailySession, getTodayDateString())) {
      void expireStaleDaily();
      return false;
    }
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
    if (pausedRef.current) return;
    if (isDailySessionExpired(useGameStore.getState().dailySession, getTodayDateString())) {
      void expireStaleDaily();
      return;
    }
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
      // The breach tier, from the claimed round's own clue count. Set before
      // the claim commits, so Polly's bubble delay already knows it.
      const breachTier = resolveDailyBreachTier(round.revealedClueCount);
      setClaimBreachTier(breachTier);
      beginClaimPresentation(dailySession, candidate, 'correct');
      runPhysicalCorrectTransition(candidate, origin, breachTier);

      // Game result commits immediately; the physical presentation now owns
      // the readable settle, cover, reward, and next-clue reveal sequence.
      // The win's Success haptic lands with the gold coin (see
      // runPhysicalCorrectTransition), not here at the claim.
      // How many clues were showing when the player committed grades the
      // claim's haptic (Pete, 2026-11-03). The castle's gold hit is graded
      // by the breach tier from the same count (Pete, 2026-11-04: bigger,
      // stepped versions, big3 / big2 / big1). An earlier graded TINT read no
      // differently on device and came out; this grades size, swell, a white
      // wash and a halo instead.
      const grade = resolveDailyCelebrationGrade(round.revealedClueCount);
      Haptics.cueAsync(dailyCelebrationHaptic(grade));
      // 'open' (and every tier under Reduce Motion): the chime and the gold hit
      // at the claim, as before. 'hit' / 'smash': the claim keeps only its
      // haptic; the castle answers at the contact (runPhysicalCorrectTransition).
      if (dailyBreachBeats(breachTier, breachPlays.contactBeat).contactMs === null) {
        playSfx('correctClaim');
        // The castle lights gold on the same beat as the claim's sound.
        setGoldHit((prev) => ({ token: prev.token + 1, tier: breachTier }));
        // No contact (Reduce Motion, or while it is unknown): the tier's breach
        // haptic lands once here, so the grade is still felt. DEFAULT, pending
        // Pete's approval (dailyBreachEffects.breachHapticAt).
        const breachCue = dailyBreachHapticCue(breachTier);
        if (breachCue && breachPlays.breachHapticAt === 'claim') Haptics.cueAsync(breachCue);
      }
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
    // A new claim ends a breach move still holding from the last round, so
    // Polly's reaction to this one starts from rest.
    restBreachClocks();
    setCardStates((prev) => new Map(prev).set(candidate, 'wrong'));
    playSfx('trapWrong');
    beginClaimPresentation(dailySession, candidate, 'wrong');

    // Reduced motion omits the jolt.
    if (reduceMotion === false) {
      // The one haptic lands when the gate hits the stop, the end of the
      // shimmy's first leg, from the same constant so the two cannot drift.
      clearWrongGateStopTimer();
      wrongGateStopTimerRef.current = setTimeout(() => {
        wrongGateStopTimerRef.current = null;
        Haptics.cueAsync('wrong');
      }, DAILY_WRONG_GATE_STOP_MS);
      // Translate the gate vertically only; no scale or horizontal movement.
      Animated.sequence([
        Animated.timing(gatePosition, {
          toValue: 1.06,
          duration: DAILY_WRONG_GATE_STOP_MS,
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
    } else {
      // No shimmy to land on: the haptic marks the claim itself.
      Haptics.cueAsync('wrong');
    }

    const wrongExitMs = reduceMotion !== false
      ? DAILY_CARD_TIMING.reducedWrongExitMs
      : DAILY_CARD_TIMING.wrongExitMs;
    setTimeout(() => {
      if (!finishClaimPresentation(candidate)) return;
      setCardStates((prev) => new Map(prev).set(candidate, 'disabled'));
      // A lost Daily stays locked while Polly finishes and flies out before
      // Results (the win path already stays locked).
      if (dailySessionRef.current?.status === 'active') setLocked(false);
    }, wrongExitMs);
  }

  async function handleShare() {
    if (!dailyResult) return;
    try {
      await Share.share({ message: dailyResult.shareText });
    } catch {}
  }

  function handleHome() {
    navigation.navigate('Home', undefined, { pop: true });
  }

  // PAUSE CARD — opens only with nothing in flight (canOpenDailyPause); any
  // other tap is ignored. Opening saves the round's elapsed time and freezes
  // the clock (pausedRef). Leaving never costs anything: HOME and SETTINGS
  // leave the session active and saved, and it resumes from the frozen time.
  function handlePause() {
    const session = useGameStore.getState().dailySession;
    if (!session || !canOpenDailyPause({
      sessionActive: session.status === 'active',
      inputLocked: inputLockedRef.current,
      claimPhase: claimPhaseRef.current,
      presentationActive: claimPresentationRef.current !== null,
      pollyReacting: pollyPose !== 'perched',
      pollyExitPending,
      paused: pausedRef.current,
    })) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingClaimCandidateRef.current = null;
    // Read before pausedRef is set: once paused, the read returns the saved value.
    pauseDailyChallenge(activeDailyElapsedMs(session));
    setPaused(true);
  }

  // An unfinished Daily from an earlier date is lost with its day: no result, no streak, no
  // Gold Feather. The store clears it and queues the TIME'S UP card; this resets the screen's
  // own claim lock and pause card.
  async function expireStaleDaily() {
    const expired = await expireStaleDailySession();
    if (!expired) return;
    pendingClaimCandidateRef.current = null;
    setLocked(false);
    setPaused(false);
  }

  function handleContinue() {
    if (!pausedRef.current) return;
    if (isDailySessionExpired(useGameStore.getState().dailySession, getTodayDateString())) {
      void expireStaleDaily();
      return;
    }
    // The store, not dailySessionRef: the ref only catches up on render.
    const session = useGameStore.getState().dailySession;
    if (session?.status === 'active') {
      roundStartRef.current = Date.now() - session.roundElapsedMs;
    }
    setPaused(false);
  }

  function handlePauseSettings() {
    // The card stays open under Settings; Back returns to the paused Daily.
    navigation.navigate('Settings');
  }

  // Android back closes the card. Registered only while the card is open and
  // the Daily is focused, so Back on Settings above it still leaves Settings.
  useFocusEffect(
    useCallback(() => {
      if (!paused) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleContinue();
        return true;
      });
      return () => subscription.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paused]),
  );

  // A session that stops being active (a DEV reset from Settings) takes the
  // card down with it.
  useEffect(() => {
    if (dailySession?.status === 'active' || !pausedRef.current) return;
    setPaused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailySession?.status]);

  // TIME'S UP FOR DAILY #N: take the store's notice once the Daily has initialised, so the card
  // never flashes before the entry is ready and is not remembered after it has been shown.
  useEffect(() => {
    if (!dailyInitialized || dailyExpiredNotice === null) return;
    setExpiredNoticeNumber(dailyExpiredNotice);
    clearDailyExpiredNotice();
  }, [dailyInitialized, dailyExpiredNotice, clearDailyExpiredNotice]);

  async function handleStartDaily() {
    if (dailyStarting) return;
    setDailyStarting(true);
    // Pressing BEGIN is the moment they have read it. Marked here rather than
    // on render, so backing out with NOT NOW leaves the explanation intact.
    if (!dailyIntroSeen) {
      setDailyIntroSeen(true);
      AsyncStorage.setItem(DAILY_INTRO_SEEN_KEY, 'true').catch(() => {});
    }
    try {
      await startDailyChallenge();
    } finally {
      setDailyStarting(false);
    }
  }

  const isReadyToStart = dailyInitialized && !dailyResult && !dailySession;
  // The explanation is open by default the very first time, and thereafter
  // only when the player asks for it with HOW TO PLAY.
  const showEntryRules = !dailyIntroSeen || rulesOpen;
  const committedComplete =
    dailyInitialized &&
    (!!dailyResult || (dailySession !== null && dailySession.status !== 'active'));
  const activeClaimPresentation = claimPresentationRef.current ?? claimPresentation;
  // Results also waits for Polly to fly out after the Daily's last line.
  const isComplete = shouldShowDailyResult(
    committedComplete,
    activeClaimPresentation,
    claimPhase,
  ) && !pollyExitPending;
  const challengeNumber = displayedDailySession
    ? displayedDailySession.challengeNumber
    : getChallengeNumber(getTodayDateString());
  const currentRound =
    displayedDailySession?.rounds[displayedDailySession.currentRoundIndex] ?? null;
  const revealedCount = currentRound?.revealedClueCount ?? 1;
  // A won challenge keeps its last round as current, so once the display
  // switches to the committed session the gate would come back down wearing
  // the final round's clues. It comes down blank instead, straight into
  // Results. On a win it also stays blank while Results waits for Polly to fly
  // out.
  const gateClues =
    committedComplete && (
      claimPhase === 'reward' ||
      claimPhase === 'revealing' ||
      (pollyExitPending && dailySession?.status === 'won')
    )
      ? []
      : currentRound?.word.clues ?? [];
  const dailyPressure = displayedDailySession
    ? Math.min(
        0.18,
        displayedDailySession.currentRoundIndex * 0.025 +
          (2 - displayedDailySession.chancesRemaining) * 0.045,
      )
    : 0;
  // The pause icon shows while the Daily is being played (the same rule as the
  // HUD) and is dimmed and inert while anything is in flight.
  const showPauseIcon = !isComplete && displayedDailySession !== null;
  const pauseAvailable = canOpenDailyPause({
    sessionActive: dailySession?.status === 'active',
    inputLocked,
    claimPhase,
    presentationActive: activeClaimPresentation !== null,
    pollyReacting: pollyPose !== 'perched',
    pollyExitPending,
    paused,
  });

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
          goldHit={goldHit}
          breachClocks={breachClocks}
          gateBroken={gateBroken}
          gateBrokenArt={gateBrokenArt}
          gateJitterX={gateJitterX}
          gateCracks={gateCracks}
          flightPress={plaquePress}
          coinFinale={coinFinale}
          hudBottom={hudBottom}
          roundMarkers={!isComplete && displayedDailySession
            ? {
                current: Math.min(displayedDailySession.currentRoundIndex, DAILY_ROUND_COUNT - 1),
                total: DAILY_ROUND_COUNT,
              }
            : null}
          onFrame={setCastleFrame}
          onShakeTransform={setCastleShake}
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
        <ScrollView
          style={styles.startScroll}
          contentContainerStyle={styles.startGate}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.startCard}>
            <Text allowFontScaling={false} style={styles.startKicker}>{dailyEntryKicker(challengeNumber)}</Text>
            <Text allowFontScaling={false} style={styles.startTitle}>{DAILY_ENTRY_TITLE}</Text>
            <Text allowFontScaling={false} style={styles.startRule}>{DAILY_ENTRY_RULE}</Text>
            {showEntryRules && (
              <>
                <Text allowFontScaling={false} style={styles.startIntro}>{DAILY_ENTRY_INTRO}</Text>
                <View style={styles.startRuleList}>
                  {DAILY_ENTRY_RULES.map((line) => (
                    <Text allowFontScaling={false} key={line} style={styles.startRuleLine}>{line}</Text>
                  ))}
                </View>
                <Text allowFontScaling={false} style={styles.startReward}>{DAILY_ENTRY_REWARD}</Text>
                <Text allowFontScaling={false} style={styles.startBody}>{DAILY_ENTRY_REWARD_SUB}</Text>
              </>
            )}
            <Text allowFontScaling={false} style={styles.startAttempt}>{DAILY_ENTRY_ATTEMPT}</Text>
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
              <Text allowFontScaling={false} style={styles.startButtonText}>
                {dailyStarting ? DAILY_ENTRY_BEGIN_BUSY : DAILY_ENTRY_BEGIN}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return Home"
              onPress={handleHome}
              style={({ pressed }) => [styles.startHomeButton, pressed && styles.startButtonPressed]}
            >
              <Text allowFontScaling={false} style={styles.startHomeText}>{DAILY_ENTRY_LEAVE}</Text>
            </Pressable>
            {dailyIntroSeen && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={rulesOpen ? DAILY_ENTRY_RULES_A11Y_HIDE : DAILY_ENTRY_RULES_A11Y_SHOW}
                accessibilityState={{ expanded: rulesOpen }}
                onPress={() => setRulesOpen(open => !open)}
                style={({ pressed }) => [styles.startRulesButton, pressed && styles.startButtonPressed]}
              >
                <Text allowFontScaling={false} style={styles.startRulesText}>
                  {rulesOpen ? DAILY_ENTRY_RULES_HIDE : DAILY_ENTRY_RULES_SHOW}
                </Text>
              </Pressable>
            )}
            <Text allowFontScaling={false} style={styles.startTaunt}>
              {dailyIntroSeen ? dailyEntryTaunt(challengeNumber) : DAILY_ENTRY_TAUNT_FIRST}
            </Text>
          </View>
        </ScrollView>
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
              streak={
                dailyStreakLineFits(windowWidth, windowHeight, insets.top, insets.bottom)
                  ? getDisplayStreak(progress, getTodayDateString())
                  : 0
              }
            />
          </Animated.View>

          <Text allowFontScaling={false} style={[styles.actionLabel, { bottom: dailyActionLabelBottom(insets.bottom) }]}>
            {displayedDailySession.currentRoundIndex === DAILY_ROUND_COUNT - 1 ? 'FINAL CLAIM · ' : ''}
            {DAILY_ACTION_RULE}
          </Text>
        </>
      )}

      <PollyDailyPerch
        reaction={pollyPose}
        reactionKey={pollyReactionKey}
        onReactionComplete={handlePollyReactionComplete}
        rivalryState={rivalryState}
        show={!isComplete && !isReadyToStart}
        perchAt={
          castleFrame
            ? {
                x: DAILY_POLLY_PERCH.x * castleFrame.scale,
                y: castleFrame.top + DAILY_POLLY_PERCH.y * castleFrame.scale,
              }
            : undefined
        }
        bubbleAt={
          castleFrame
            ? {
                x: DAILY_POLLY_BUBBLE.x * castleFrame.scale,
                y: castleFrame.top + DAILY_POLLY_BUBBLE.y * castleFrame.scale,
                maxWidth: DAILY_POLLY_BUBBLE.maxWidth,
              }
            : undefined
        }
        throwDelayMs={Math.max(
          0,
          dailyThrowGoneMs(breachPlays.contactBeat, claimBreachTier) - (pollyPose === 'shocked' ? pollyWinDelayMs : 0),
        )}
        onExited={releasePollyExit}
        breachClocks={breachClocks}
        shake={castleShake}
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
          <Text allowFontScaling={false} style={styles.devResetText}>DEV - RESET DAILY</Text>
        </Pressable>
      )}

      {__DEV__ && (
        <Pressable
          onPress={() => setCastleTuningVisible((visible) => !visible)}
          style={[styles.devResetBtn, { right: 14, bottom: 104 }]}
        >
          <Text allowFontScaling={false} style={styles.devResetText}>CASTLE TUNE</Text>
        </Pressable>
      )}

      {__DEV__ && DailyCastleTuningPanel && (
        <DailyCastleTuningPanel visible={castleTuningVisible} />
      )}

      {__DEV__ && (
        <Pressable
          onPress={() => setPuzzlePickerVisible((visible) => !visible)}
          style={[styles.devResetBtn, { right: 14, bottom: 70 }]}
        >
          <Text allowFontScaling={false} style={styles.devResetText}>PICK PUZZLE</Text>
        </Pressable>
      )}

      {__DEV__ && DailyPuzzlePicker && (
        <DailyPuzzlePicker
          visible={puzzlePickerVisible}
          onClose={() => setPuzzlePickerVisible(false)}
          onPick={async (answer: string) => {
            setPuzzlePickerVisible(false);
            await resetDailyForDev();
            await startDailyChallenge(undefined, answer);
          }}
        />
      )}

      </SafeAreaView>

      {/* Pause, top-right beside the DAILY # plate (Pete, 2026-10-29). Placed
          from the window top: absolute children ignore the safe-area padding.
          zIndex 2 with the SafeAreaView, later in order, so it sits above the
          HUD row; under the coin finale's veil (3) like the HUD. */}
      {showPauseIcon && (
        <UiIconButton
          kind="pause"
          accessibilityLabel={DAILY_PAUSE_ICON_A11Y}
          accessibilityElementsHidden={paused}
          importantForAccessibility={paused ? 'no-hide-descendants' : 'auto'}
          disabled={!pauseAvailable}
          onPress={handlePause}
          style={[
            styles.pauseBtn,
            { top: insets.top + DAILY_HUD.marginTop },
            !pauseAvailable && styles.pauseBtnDimmed,
          ]}
        />
      )}

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

      {/* Last child, zIndex 340 like the Hunt's: over the castle, HUD, DEV
          buttons and coin finale. Ordinary screen state, so it is still open
          when the player comes back from Settings. */}
      {paused && dailySession?.status === 'active' && (
        <DailyPauseCard
          onContinue={handleContinue}
          onHome={handleHome}
          onSettings={handlePauseSettings}
        />
      )}

      {/* TIME'S UP FOR DAILY #N: over everything, shown once, then today's Daily entry. */}
      {expiredNoticeNumber !== null && (
        <DailyExpiredCard
          number={expiredNoticeNumber}
          onDismiss={() => setExpiredNoticeNumber(null)}
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
  // The entry card is the Daily's only explainer, so it is allowed to run long
  // (Pete, 2026-11-03: "make the card bigger so everything fits" rather than
  // shrink the copy). It scrolls like the results card so a long card cannot
  // clip on a short phone, and sits 10 pt from each edge instead of 24.
  startScroll: {
    flex: 1,
    width: '100%',
  },
  startGate: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  // Same flat card as the results card (res.card), with a neutral white rim:
  // gold and rose there mean win and loss.
  startCard: {
    width: '100%',
    backgroundColor: 'rgba(26,24,48,0.94)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: PW.color.white,
    padding: 20,
    alignItems: 'center',
  },
  startKicker: {
    color: dailyResultsMaterial.challengeLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 17,
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
    fontSize: 18,
    letterSpacing: 2,
    marginTop: 12,
    textAlign: 'center',
  },
  // Polly's framing, above the mechanics.
  startIntro: {
    color: dailyResultsMaterial.statText,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 20,
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  // How it works: one idea per line, in the HUD voice, so the three clues read
  // as three things and not as a paragraph.
  startRuleList: {
    marginTop: 18,
    gap: 7,
    alignSelf: 'stretch',
  },
  startRuleLine: {
    color: dailyResultsMaterial.speedTitle,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: 1,
    textAlign: 'center',
  },
  // The reward, shouted in the same gold as the title so the eye lands on the
  // payoff, then said plainly underneath.
  startReward: {
    color: dailyResultsMaterial.titleWin,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 1,
    marginTop: 18,
    textAlign: 'center',
  },
  startBody: {
    color: dailyResultsMaterial.statText,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 19,
    lineHeight: 23,
    marginTop: 4,
    textAlign: 'center',
  },
  // Polly's jab under the button.
  startTaunt: {
    color: dailyResultsMaterial.homeText,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },
  // What entering costs.
  startAttempt: {
    color: dailyResultsMaterial.homeText,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 18,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
  // BEGIN DAILY matches the results SHARE RESULT button (res.shareBtn).
  startButton: {
    backgroundColor: dailyResultsMaterial.shareBtnBg,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
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
    fontSize: 19,
    letterSpacing: 2,
  },
  // Reopens the rules on the short returning card. Same shape as NOT NOW but
  // in the brighter rule colour, so the only gold button on the card stays
  // BEGIN DAILY and this still reads as an action rather than a way out.
  startRulesButton: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  startRulesText: {
    color: dailyResultsMaterial.speedTitle,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    letterSpacing: 2.5,
  },
  // NOT NOW is a real button, not a link: sitting under a gold primary and
  // above a grey jab, a bare text line did not read as pressable (Pete,
  // 2026-11-04). This is the game's own secondary treatment, copied from
  // DailyPauseCard's actionSecondary, so gold stays unique to the primary.
  startHomeButton: {
    paddingVertical: 13,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: 'rgba(33,27,74,0.42)',
  },
  startHomeText: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    letterSpacing: 2.5,
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
  pauseBtn: {
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
  // Visible but inert while a claim or Polly's reaction is in flight.
  pauseBtnDimmed: {
    opacity: DAILY_PAUSE_ICON_DIMMED_OPACITY,
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
  streak: {
    color: dailyHudMaterial.label,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: DAILY_HUD.streakSize,
    lineHeight: DAILY_HUD.streakLineHeight,
    letterSpacing: 2,
    opacity: 0.85,
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
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: PW.color.surfaceDeep,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PW.color.lavender,
    marginTop: 8,
  },
  homeBtnPressed: {
    backgroundColor: PW.color.surfaceRaised,
  },
  homeText: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 2,
  },
});
