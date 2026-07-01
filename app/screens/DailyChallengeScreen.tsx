import React, { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import {
  DAILY_ROUND_COUNT,
  DAILY_CHANCES,
  getChallengeNumber,
  getTodayDateString,
} from '../game/dailyChallengeEngine';
import { DailyClaimResult } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { playSfx } from '../audio/sfx';
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_LOSS_TITLE,
  DAILY_CLUE_TITLE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyClueVaultMaterial,
  DailyPollyReaction as PerchReaction,
} from '../ui/pwDailyMaterials';
import DailyAnswerCard, {
  DailyAnswerCardState,
} from '../components/DailyAnswerCard';
import PollyDailyPerch from '../components/PollyDailyPerch';
import { POLLY_ANIMATIONS } from '../animations/pollyAnimations';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_ENTER_DELAYS = [80, 80, 140, 140, 200, 200];

// Maps store claim result reaction → PollyDailyPerch prop
function toPerchReaction(
  r: DailyClaimResult['pollyReaction'] | undefined,
): PerchReaction {
  if (r === 'firstMiss') return 'happy';
  if (r === 'loss') return 'laughing';
  if (r === 'win') return 'shocked';
  return 'perched';
}

// ─────────────────────────────────────────
// FeatherIcon
// ─────────────────────────────────────────
function FeatherIcon({ filled }: { filled: boolean }) {
  return (
    <View style={feather.wrap}>
      <View
        style={[
          feather.blade,
          filled ? feather.bladeFilled : feather.bladeEmpty,
        ]}
      />
      <View
        style={[
          feather.shaft,
          filled ? feather.shaftFilled : feather.shaftEmpty,
        ]}
      />
      <View style={feather.highlight} />
    </View>
  );
}

// ─────────────────────────────────────────
// DailyHUD
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// ClueVault
// ─────────────────────────────────────────
function ClueVault({
  clues,
  revealedCount,
}: {
  clues: [string, string, string];
  revealedCount: 1 | 2 | 3;
}) {
  const fade2 = useRef(new Animated.Value(0)).current;
  const fade3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (revealedCount >= 2) {
      Animated.timing(fade2, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      fade2.setValue(0);
    }
    if (revealedCount >= 3) {
      Animated.timing(fade3, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      fade3.setValue(0);
    }
  }, [revealedCount, fade2, fade3]);

  return (
    <View style={cv.cvRoot}>
      <Text style={cv.cvLabel}>{DAILY_CLUE_TITLE}</Text>

      <View style={cv.cvRow}>
        <View style={cv.cvBullet} />
        <Text style={cv.cvText}>{clues[0].toUpperCase()}</Text>
      </View>

      <Animated.View style={[cv.cvRow, { opacity: fade2 }]}>
        <View style={cv.cvBullet} />
        <Text style={cv.cvText}>{clues[1].toUpperCase()}</Text>
      </Animated.View>

      <Animated.View style={[cv.cvRow, { opacity: fade3 }]}>
        <View style={cv.cvBullet} />
        <Text style={cv.cvText}>{clues[2].toUpperCase()}</Text>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────
// Daily answer-card control lives in components/DailyAnswerCard.
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// ResultsOverlay
// ─────────────────────────────────────────
function ResultsOverlay({
  onHome,
  onShare,
}: {
  onHome: () => void;
  onShare: () => void;
}) {
  const FEATHER_IMG = require('../../assets/ui/feather-gold-reward.png');

  const dailyResult = useGameStore((s) => s.dailyResult);
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

        {isWin && (
          <View style={styles.featherWrap}>
            <Image
              source={FEATHER_IMG}
              style={styles.featherImage}
              resizeMode="contain"
            />
            <Text style={styles.featherLabel}>{DAILY_WIN_REWARD}</Text>
          </View>
        )}

        <Text style={res.stat}>
          {`${dailyResult.solvedCount}/${DAILY_ROUND_COUNT} words · ${dailyResult.chancesRemaining} chances left`.toUpperCase()}
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

// ─────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────
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

  function setLocked(val: boolean) {
    inputLockedRef.current = val;
    setInputLocked(val);
  }

  const vaultX        = useRef(new Animated.Value(0)).current;
  const [pollyVisible, setPollyVisible] = useState(true);

  const completedRef = useRef(false);
  const roundStartRef = useRef<number>(Date.now());

  // INIT
  useEffect(() => {
    async function init() {
      await loadDailyResult();
      await startDailyChallenge();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ROUND CHANGE
  useEffect(() => {
    if (!dailySession || dailySession.status !== 'active') return;
    completedRef.current = false;
    setLocked(false);
    roundStartRef.current = Date.now();

    const round = dailySession.rounds[dailySession.currentRoundIndex];
    if (!round) return;
    const candidates = [...round.candidates];
    const map = new Map<string, DailyAnswerCardState>();
    candidates.forEach((c) => map.set(c, 'idle'));
    setCardStates(map);

    vaultX.stopAnimation();
    vaultX.setValue(SCREEN_WIDTH);
    Animated.spring(vaultX, {
      toValue: 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
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

  // CLAIM RESULT → Polly reaction
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
      setLocked(true);
      setCardStates(prev => new Map(prev).set(candidate, 'correct'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSfx('uiClick');

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

      // Polly exits + vault slides left
      setTimeout(() => {
        setPollyVisible(false);
        Animated.timing(vaultX, {
          toValue: -SCREEN_WIDTH,
          duration: 260,
          useNativeDriver: true,
        }).start();
      }, 240);

      // Advance round, snap vault to right, slide vault in
      setTimeout(() => {
        claimDailyAnswer(candidate);
      }, 480);

      // Polly enters after cards are settling
      setTimeout(() => {
        setPollyVisible(true);
      }, 780);

      return;
    }

    // Wrong
    setLocked(true);
    setCardStates((prev) => new Map(prev).set(candidate, 'wrong'));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    playSfx('trapWrong');
    setTimeout(() => {
      setCardStates((prev) => new Map(prev).set(candidate, 'disabled'));
      claimDailyAnswer(candidate);
      setLocked(false);
    }, 380);
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

          <Animated.View style={{ transform: [{ translateX: vaultX }] }}>
            {currentRound && (
              <ClueVault
                clues={currentRound.word.clues}
                revealedCount={revealedCount}
              />
            )}
            <Text style={styles.actionLabel}>{DAILY_ACTION_RULE}</Text>
          </Animated.View>

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
                  testID={`daily-answer-${index}`}
                  enterFromLeft={index % 2 === 0}
                  enterDelay={CARD_ENTER_DELAYS[index] ?? 200}
                  roundKey={dailySession.currentRoundIndex}
                />
              ))}
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

      <Pressable
        onPress={async () => {
          await resetDailyForDev();
          await startDailyChallenge();
        }}
        style={styles.devResetBtn}
      >
        <Text style={styles.devResetText}>DEV · RESET DAILY</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: dailyBackdrop.base,
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 10,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 20,
    justifyContent: 'center',
    paddingBottom: 230,
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
    top: 52,
    right: 12,
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
});

const hud = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  label: {
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 2,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    gap: 4,
  },
});

const feather = StyleSheet.create({
  wrap: {
    width: 14,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blade: {
    width: 9,
    height: 13,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '-22deg' }],
  },
  bladeFilled: {
    backgroundColor: '#FFFFFF',
  },
  bladeEmpty: {
    backgroundColor: 'rgba(123,45,139,0.45)',
  },
  shaft: {
    position: 'absolute',
    width: 2,
    height: 12,
    bottom: 1,
    transform: [{ rotate: '-22deg' }],
  },
  shaftFilled: {
    backgroundColor: '#7B2D8B',
  },
  shaftEmpty: {
    backgroundColor: 'rgba(123,45,139,0.3)',
  },
  highlight: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

const cv = StyleSheet.create({
  cvRoot: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 22,
    borderRadius: dailyClueVaultMaterial.radius,
    backgroundColor: dailyClueVaultMaterial.panelBackground,
    borderWidth: dailyClueVaultMaterial.borderWidth,
    borderColor: dailyClueVaultMaterial.borderColor,
  },
  cvLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cvRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  cvBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7B2D8B',
    marginTop: 8,
    flexShrink: 0,
  },
  cvText: {
    color: dailyClueVaultMaterial.clueTextColor,
    fontFamily: FONTS.tileCopy,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    flex: 1,
  },
});

const res = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,24,48,0.98)',
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
    gap: 8,
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
    gap: 8,
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
