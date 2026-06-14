import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONTS } from '../constants/fonts';
import { DAILY_ROUND_COUNT, getChallengeNumber, getTodayDateString } from '../game/dailyChallengeEngine';
import { useGameStore } from '../store/useGameStore';

// ─── CONSTANTS ────────────────────────────────────────────────
const MAX_LIVES   = 2;
const ROUND_COUNT = DAILY_ROUND_COUNT;
const CLAIM_THRESHOLD = -25;

type DailyCardState = 'idle' | 'correct' | 'wrong' | 'disabled';

// ─── FEATHER ICON ─────────────────────────────────────────────
function FeatherIcon({ filled }: { filled: boolean }) {
  return (
    <View style={hud.featherBox}>
      <View style={[hud.blade, filled ? hud.bladeFilled : hud.bladeEmpty]}>
        <View style={[hud.highlight, filled ? hud.highlightFilled : hud.highlightEmpty]} />
      </View>
      <View style={[hud.shaft, filled ? hud.shaftFilled : hud.shaftEmpty]} />
    </View>
  );
}

// ─── HUD ─────────────────────────────────────────────────────
function DailyHUD({
  challengeNumber,
  currentRound,
  lives,
}: {
  challengeNumber: number;
  currentRound: number;
  lives: number;
}) {
  return (
    <View style={hud.root}>
      <View style={hud.row}>
        <Text style={hud.number}>DAILY #{challengeNumber}</Text>
        <View style={hud.dots}>
          {Array.from({ length: ROUND_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                hud.dot,
                i < currentRound   ? hud.dotDone    :
                i === currentRound ? hud.dotCurrent :
                hud.dotPending,
              ]}
            />
          ))}
        </View>
        <View style={hud.feathers}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <FeatherIcon key={i} filled={i < lives} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── MEANINGS ZONE ────────────────────────────────────────────
function MeaningsZone({
  meanings,
  fadeAnim,
}: {
  meanings: [string, string, string];
  fadeAnim: Animated.Value;
}) {
  return (
    <Animated.View style={[mz.root, { opacity: fadeAnim }]}>
      <Text style={mz.label}>ONE WORD FITS ALL</Text>
      {meanings.map((m, i) => (
        <View key={i} style={mz.meaningRow}>
          <View style={mz.bullet} />
          <Text style={mz.meaning}>{m}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

// ─── DAILY CANDIDATE CARD ────────────────────────────────────
// Daily uses word cards, not the main POLY RUN mask tile.
function DailyCandidateCard({
  word,
  state,
  disabled,
  onClaim,
}: {
  word: string;
  state: DailyCardState;
  disabled: boolean;
  onClaim: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const claimedRef = useRef(false);

  useEffect(() => {
    claimedRef.current = false;
    translateX.setValue(0);
    translateY.setValue(0);
    opacity.setValue(1);
    scale.setValue(1);
  }, [word]); // eslint-disable-line

  useEffect(() => {
    if (state === 'correct') {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -48, duration: 220, useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.04, friction: 7, tension: 120, useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(translateX, { toValue: -8, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 8, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -5, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (state === 'disabled') {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0, duration: 180, useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92, duration: 180, useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [state]); // eslint-disable-line

  const springBack = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  const interactive = !disabled && state === 'idle';
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      interactive &&
      Math.abs(gesture.dy) > 6 &&
      Math.abs(gesture.dy) > Math.abs(gesture.dx) * 0.7,
    onPanResponderMove: (_, gesture) => {
      if (!interactive || claimedRef.current) return;
      translateY.setValue(Math.min(14, gesture.dy));
      translateX.setValue(gesture.dx * 0.08);
    },
    onPanResponderRelease: (_, gesture) => {
      if (!interactive || claimedRef.current) return;

      if (
        gesture.dy <= CLAIM_THRESHOLD &&
        Math.abs(gesture.dy) >= Math.abs(gesture.dx) * 0.7
      ) {
        claimedRef.current = true;
        onClaim();
        return;
      }

      springBack();
    },
    onPanResponderTerminate: springBack,
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.dailyCard,
        state === 'correct' && styles.cardCorrect,
        state === 'wrong' && styles.cardWrong,
        state === 'disabled' && styles.cardDisabled,
        {
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <Text
        style={styles.cardText}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.55}
      >
        {word.toUpperCase()}
      </Text>
    </Animated.View>
  );
}

// ─── RESULTS OVERLAY ─────────────────────────────────────────
function ResultsOverlay({
  onHome,
  onShare,
}: {
  onHome: () => void;
  onShare: () => void;
}) {
  const dailyResult = useGameStore(s => s.dailyResult);
  const fadeIn      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 420, useNativeDriver: true,
    }).start();
  }, []); // eslint-disable-line

  if (!dailyResult) return null;

  const titleColor =
    dailyResult.title === 'WORD MASTER' ? '#F5C842' :
    dailyResult.title === 'HAUNTED'     ? '#9B2D6B' :
    '#FFFFFF';

  return (
    <Animated.View style={[res.overlay, { opacity: fadeIn }]}>
      <View style={res.card}>
        <Text style={res.number}>DAILY #{dailyResult.challengeNumber}</Text>
        <Text style={[res.title, { color: titleColor }]}>
          {dailyResult.title}
        </Text>
        <Text style={res.stat}>
          {dailyResult.solvedCount}/{ROUND_COUNT} words · {dailyResult.livesLeft}{' '}
          {dailyResult.livesLeft === 1 ? 'life' : 'lives'} left
        </Text>

        <View style={res.wordRow}>
          {dailyResult.wordResults.map((r, i) => (
            <View
              key={i}
              style={[
                res.wordPill,
                r.status === 'solved'  ? res.pillSolved  :
                r.status === 'missed'  ? res.pillMissed  :
                res.pillPending,
              ]}
            >
              <Text style={res.wordPillText}>{r.word}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={onShare} style={res.shareBtn}>
          <Text style={res.shareBtnText}>SHARE RESULT</Text>
        </Pressable>

        <Pressable onPress={onHome} style={res.homeBtn}>
          <Text style={res.homeBtnText}>HOME</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────
type Props = { navigation: any };

export default function DailyChallengeScreen({ navigation }: Props) {
  const daily             = useGameStore(s => s.daily);
  const dailyResult       = useGameStore(s => s.dailyResult);
  const storeWrongSwipe   = useGameStore(s => s.submitDailyWrongSwipe);
  const storeCorrectSwipe = useGameStore(s => s.submitDailyCorrectSwipe);

  // ── local deck state ────────────────────────────────────────
  const [remaining, setRemaining]     = useState<string[]>([]);
  const [tileStates, setTileStates]   = useState<Map<string, DailyCardState>>(new Map());
  const [inputLocked, setInputLocked] = useState(false);
  const completedRef                  = useRef(false);

  // ── animation values ────────────────────────────────────────
  const meaningsFade = useRef(new Animated.Value(0)).current;

  const challengeNumber = getChallengeNumber(getTodayDateString());

  // ── init / round change ─────────────────────────────────────
  useEffect(() => {
    if (!daily || daily.status === 'complete') return;
    const round = daily.rounds[daily.currentRound];
    completedRef.current = false;
    setInputLocked(false);

    const ids = daily.remainingCandidates[daily.currentRound] ?? round.candidates;
    setRemaining([...ids]);
    const stateMap = new Map<string, DailyCardState>();
    ids.forEach(c => stateMap.set(c, 'idle'));
    setTileStates(stateMap);

    meaningsFade.setValue(0);
    Animated.timing(meaningsFade, {
      toValue: 1, duration: 320, useNativeDriver: true,
    }).start();
  }, [daily?.currentRound]); // eslint-disable-line

  if (!daily) return null;

  const isComplete = daily.status === 'complete' || !!dailyResult;
  const round      = daily.rounds[daily.currentRound];

  // ── Correct claim (UP on the target word) ───────────────────
  function handleClaim(candidate: string) {
    if (completedRef.current || inputLocked) return;

    if (candidate === round.word) {
      completedRef.current = true;
      setInputLocked(true);
      setTileStates(prev => new Map(prev).set(candidate, 'correct'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        storeCorrectSwipe();
      }, 560);
      return;
    }

    setInputLocked(true);
    setTileStates(prev => new Map(prev).set(candidate, 'wrong'));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    setTimeout(() => {
      setTileStates(prev => new Map(prev).set(candidate, 'disabled'));
      setRemaining(prev => prev.filter(c => c !== candidate));
      storeWrongSwipe(candidate);
      setInputLocked(false);
    }, 360);
  }

  // ── Share ────────────────────────────────────────────────────
  async function handleShare() {
    if (!dailyResult) return;
    try {
      await Share.share({ message: dailyResult.shareText });
    } catch {}
  }

  // ── Home ─────────────────────────────────────────────────────
  function handleHome() {
    navigation.navigate('Home');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <DailyHUD
        challengeNumber={challengeNumber}
        currentRound={Math.min(daily.currentRound, ROUND_COUNT - 1)}
        lives={daily.lives}
      />

      {!isComplete && (
        <MeaningsZone
          meanings={round.meanings}
          fadeAnim={meaningsFade}
        />
      )}

      {!isComplete && (
        <>
          <Text style={styles.instructionText}>
            SWIPE UP TO CLAIM THE WORD
          </Text>

          <View style={styles.cardGrid}>
            {remaining.slice(0, 9).map(candidate => (
              <DailyCandidateCard
                key={candidate}
                word={candidate}
                state={tileStates.get(candidate) ?? 'idle'}
                disabled={inputLocked}
                onClaim={() => handleClaim(candidate)}
              />
            ))}
          </View>
        </>
      )}

      {isComplete && (
        <ResultsOverlay onHome={handleHome} onShare={handleShare} />
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

const hud = StyleSheet.create({
  root: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(15,13,42,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.36)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  number: {
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 16,
    letterSpacing: 2,
    minWidth: 90,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotDone:    { backgroundColor: '#F5C842' },
  dotCurrent: { backgroundColor: '#FFFFFF', shadowColor: '#FFFFFF', shadowOpacity: 0.5, shadowRadius: 4 },
  dotPending: { backgroundColor: 'rgba(255,255,255,0.20)' },
  feathers: {
    flexDirection: 'row',
    gap: 4,
    minWidth: 28,
    justifyContent: 'flex-end',
  },
  featherBox: {
    width: 10,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blade: {
    position: 'absolute',
    width: 8,
    height: 15,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    transform: [{ rotate: '-22deg' }],
  },
  bladeFilled:  { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: 'rgba(123,45,139,0.75)' },
  bladeEmpty:   { backgroundColor: 'rgba(123,45,139,0.12)', borderColor: 'rgba(118,101,135,0.45)' },
  highlight:    { position: 'absolute', top: 2, right: 2, width: 2, height: 9, borderRadius: 1 },
  highlightFilled: { backgroundColor: 'rgba(123,45,139,0.22)' },
  highlightEmpty:  { backgroundColor: 'rgba(255,255,255,0.06)' },
  shaft:        { position: 'absolute', width: 1.25, height: 14, borderRadius: 1, transform: [{ rotate: '-22deg' }] },
  shaftFilled:  { backgroundColor: 'rgba(123,45,139,0.65)' },
  shaftEmpty:   { backgroundColor: 'rgba(118,101,135,0.55)' },
});

const mz = StyleSheet.create({
  root: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.50)',
    gap: 14,
  },
  label: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.label,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  meaningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7B2D8B',
    marginTop: 7,
    flexShrink: 0,
  },
  meaning: {
    color: '#FFFFFF',
    fontFamily: FONTS.tileCopy,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
    flex: 1,
  },
});

const res = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,24,48,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#0F0D2A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.55)',
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  number: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    fontFamily: FONTS.wordDisplay,
    fontSize: 52,
    letterSpacing: 3,
    textAlign: 'center',
  },
  stat: {
    color: 'rgba(255,255,255,0.60)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    textAlign: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  wordPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillSolved:  { borderColor: 'rgba(245,200,66,0.55)',  backgroundColor: 'rgba(245,200,66,0.10)'  },
  pillMissed:  { borderColor: 'rgba(155,45,107,0.55)',  backgroundColor: 'rgba(155,45,107,0.10)'  },
  pillPending: { borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(255,255,255,0.05)' },
  wordPillText: {
    color:       '#FFFFFF',
    fontFamily:  FONTS.hud,
    fontSize:    13,
    letterSpacing: 1,
  },
  shareBtn: {
    marginTop: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5C842',
    alignItems: 'center',
  },
  shareBtnText: {
    color:       '#0F0D2A',
    fontFamily:  FONTS.hud,
    fontSize:    14,
    letterSpacing: 2,
  },
  homeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  homeBtnText: {
    color:       'rgba(255,255,255,0.38)',
    fontFamily:  FONTS.hud,
    fontSize:    13,
    letterSpacing: 2,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1830',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: FONTS.label,
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  cardGrid: {
    marginHorizontal: 20,
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 16,
  },
  dailyCard: {
    width: '30.5%',
    height: 100,
    borderRadius: 18,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardCorrect: {
    borderColor: '#F5C842',
    backgroundColor: 'rgba(245,200,66,0.16)',
    shadowColor: '#F5C842',
    shadowOpacity: 0.38,
    shadowRadius: 12,
  },
  cardWrong: {
    borderColor: '#CC2200',
    backgroundColor: 'rgba(204,34,0,0.18)',
  },
  cardDisabled: {
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardText: {
    color: '#FFFFFF',
    fontFamily: FONTS.wordDisplay,
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
