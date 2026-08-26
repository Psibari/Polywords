import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '../utils/haptics';
import { FONTS } from '../constants/fonts';
import { WordResult } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { Mask, SessionStep } from '../game/types';
import { getRankTier } from '../game/ranks';
import { playSfx } from '../audio/sfx';
import { FoilWord } from '../components/ui/FoilWord';
import PollyResultsPerch, { POLLY_RESULTS_PERCH_CLEARANCE } from '../components/PollyResultsPerch';
import { PW } from '../ui/pwTheme';
import { homeDare, homeType } from '../ui/pwHomeMaterials';
import { usePulseScale } from '../hooks/usePulseScale';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { resolveRankUpFeedback } from '../game/huntOutcomeFeedback';
import {
  RESULTS_SUB_LOSS,
  RESULTS_VERDICT_BEAT,
  RESULTS_VERDICT_COMPLETE,
  RESULTS_VERDICT_LOSS,
  deriveResultsPollyMoment,
  resultsCard,
  resultsLedger,
  resultsType,
  resultsVerdictColor,
} from '../ui/pwResultsMaterials';

const GOLD_FEATHER_IMG = require('../../assets/ui/feather-gold-reward.png');

// ─── HELPERS ─────────────────────────────────────────────────

function findMaskById(maskId: string, session: SessionStep[]): Mask | undefined {
  for (const step of session) {
    if (step.kind !== 'word') continue;
    const found = step.masks.find(m => m.id === maskId);
    if (found) return found;
  }
  return undefined;
}

function findWordForMaskId(maskId: string, session: SessionStep[]): string {
  for (const step of session) {
    if (step.kind !== 'word') continue;
    if (step.masks.some(m => m.id === maskId)) return step.word;
  }
  return '';
}

// Spoiler-free run summary: one square per round, no words revealed.
function buildShareMessage(
  session: SessionStep[],
  wordResults: WordResult[],
  score: number,
  rankLetter: string,
  isComplete: boolean,
  bossMastered: boolean,
): string {
  const resultByStep = new Map(wordResults.map(r => [r.wordId, r]));
  const grid = session
    .map((step, i) => {
      if (step.kind !== 'word') return '';
      const r = resultByStep.get(String(i));
      if (!r) return '⬛';
      const perfect = r.correctUp === r.totalRealMasks && r.wrongSwipes === 0;
      if (r.isBossWord) return bossMastered ? '👑' : '🟪';
      return perfect ? '🟨' : '🟪';
    })
    .join('');
  const verdict = !isComplete
    ? RESULTS_VERDICT_LOSS
    : bossMastered ? RESULTS_VERDICT_BEAT : RESULTS_VERDICT_COMPLETE;
  return `POLYWORDS · RANK ${rankLetter}\n${score.toLocaleString()} pts\n${grid}\n${verdict}`;
}

// ─── GRADE / RANK (thresholds and text unchanged; colors tokenized) ──

function computeGrade(
  lives: number,
  wordResults: WordResult[],
): { text: string; color: string } {
  if (lives === 0) return { text: 'RATTLED.', color: resultsVerdictColor.gradeRattled };
  const ghostCount = wordResults.filter(r => r.missedMaskIds.length > 0).length;
  if (ghostCount === 0) return { text: 'CLEAN RUN', color: resultsVerdictColor.gradeClean };
  if (ghostCount <= 2) return { text: 'CLOSE.', color: resultsVerdictColor.gradeClose };
  return { text: 'MEANINGS MISSED.', color: resultsVerdictColor.gradeMissed };
}

function computeRank(score: number): { letter: string; color: string } {
  const tier = getRankTier(score);
  const color =
    tier.threshold >= 15000
      ? resultsVerdictColor.rankTop
      : tier.threshold >= 3000
      ? resultsVerdictColor.rankMid
      : resultsVerdictColor.rankLow;
  return { letter: tier.letter, color };
}

// ─── LEDGER ROW ──────────────────────────────────────────────

function LedgerRow({ result, bossMastered }: { result: WordResult; bossMastered: boolean }) {
  const allFound = result.correctUp === result.totalRealMasks && result.wrongSwipes === 0;

  let resultText: string;
  let resultColor: string;
  if (result.isBossWord) {
    resultText = bossMastered ? 'Boss ✓' : `${result.correctUp}/${result.totalRealMasks}`;
    resultColor = bossMastered ? resultsLedger.mark : resultsLedger.ink;
  } else if (allFound) {
    resultText = 'Perfect ✓';
    resultColor = resultsLedger.mark;
  } else {
    resultText = `${result.correctUp}/${result.totalRealMasks}`;
    resultColor = resultsLedger.ink;
  }

  return (
    <View style={lr.row}>
      <Text style={lr.word}>{result.word.toUpperCase()}</Text>
      <Text style={[lr.result, { color: resultColor }]}>{resultText}</Text>
    </View>
  );
}

const lr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: resultsLedger.rule,
  },
  word: {
    color: resultsLedger.ink,
    fontSize: resultsType.ledgerWord,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 1,
  },
  result: {
    fontSize: resultsType.ledgerResult,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
  },
});

// ─── CALLOUT CARDS ───────────────────────────────────────────

function GhostSetCard({ firstMissedMaskId }: { firstMissedMaskId: string }) {
  const session = useGameStore(s => s.game.session);
  const word = findWordForMaskId(firstMissedMaskId, session);
  if (!word) return null;

  return (
    <View style={[cc.card, cc.ghost]}>
      <Text style={[cc.header, { color: resultsCard.ghostTitle }]}>Meaning missed</Text>
      <Text style={[cc.word, { color: resultsCard.ghostTitle }]}>{word.toUpperCase()}</Text>
      <Text style={cc.copy}>You left this one behind.</Text>
    </View>
  );
}

function TrapCard({ maskId }: { maskId: string }) {
  const session = useGameStore(s => s.game.session);
  const mask = findMaskById(maskId, session);
  const word = findWordForMaskId(maskId, session);
  if (!mask) return null;

  return (
    <View style={[cc.card, cc.trap]}>
      <Text style={[cc.header, { color: PW.color.lavender }]}>The trap that got you</Text>
      <Text style={cc.phrase}>{mask.phrase}</Text>
      <Text style={cc.copy}>Not a meaning of {word.toUpperCase()}. Just nearby.</Text>
    </View>
  );
}

const cc = StyleSheet.create({
  card: {
    backgroundColor: PW.color.cardFace,
    borderWidth: 1.5,
    borderRadius: PW.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  ghost: {
    backgroundColor: resultsCard.ghostFace,
    borderColor: resultsCard.ghostRim,
  },
  trap: {
    borderColor: resultsCard.rimTrap,
  },
  cleared: {
    borderColor: resultsCard.rimGold,
  },
  header: {
    fontSize: resultsType.cardHeader,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  word: {
    fontSize: resultsType.cardWord,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  phrase: {
    color: PW.color.softWhite,
    fontSize: resultsType.cardCopy + 1,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    marginBottom: 4,
  },
  copy: {
    color: PW.color.mutedWhite,
    fontSize: resultsType.cardCopy,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    lineHeight: resultsType.cardCopy + 5,
  },
});

// ─── RUN IT BACK (Home dare treatment, native scale pulse) ──

function RunItBackButton({ onPress }: { onPress: () => void }) {
  const scale = usePulseScale();

  return (
    <Animated.View style={[btn.wrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Run it back"
        style={({ pressed }) => [btn.shell, pressed && btn.pressed]}
      >
        <LinearGradient
          colors={[...homeDare.faceGradient]}
          locations={[...homeDare.faceLocations]}
          style={btn.face}
        >
          <View style={btn.bottomEdge} />
          <Text style={btn.label}>RUN IT BACK</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const btn = StyleSheet.create({
  wrap: {
    ...PW.shadow.glowGold,
  },
  shell: {
    borderRadius: PW.radius.card,
    borderWidth: 2,
    borderColor: homeDare.rim,
    overflow: 'hidden',
  },
  face: {
    minHeight: homeDare.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: homeDare.bottomEdge,
  },
  label: {
    color: homeDare.label,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: homeType.dareLabel - 2,
    letterSpacing: 3,
    textShadowColor: homeDare.labelHighlight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pressed: {
    opacity: 0.84,
  },
});

function ShareRunButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Share this run"
      onPress={onPress}
      style={({ pressed }) => [sb.shell, pressed && sb.pressed]}
    >
      <Text style={sb.label}>SHARE RESULT</Text>
    </Pressable>
  );
}

const sb = StyleSheet.create({
  shell: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.overlayHeavy,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.84,
  },
  label: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 2,
  },
});

function GoldFeatherButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Use Gold Feather free life"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        gf.shell,
        pressed && !disabled && gf.pressed,
        disabled && gf.disabled,
      ]}
    >
      <Image source={GOLD_FEATHER_IMG} style={gf.feather} resizeMode="contain" />
      <View style={gf.copyBlock}>
        <Text style={gf.title}>USE GOLD FEATHER</Text>
        <Text style={gf.copy}>Free life. Run the Hunt back now.</Text>
      </View>
    </Pressable>
  );
}

const gf = StyleSheet.create({
  shell: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: PW.color.overlayHeavy,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...PW.shadow.glowGold,
  },
  feather: {
    width: 28,
    height: 46,
  },
  copyBlock: {
    flex: 1,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 2,
  },
  copy: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.5,
  },
});

// ─── RESULTS SCREEN — THE HUNT LEDGER ────────────────────────

type Props = {
  onRestart: () => void;
  onHome: () => void;
};

export default function ResultsScreen({ onRestart, onHome }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const game = useGameStore(s => s.game);
  const ghostRevenge = useGameStore(s => s.ghostRevenge);
  const recordRunComplete = useGameStore(s => s.recordRunComplete);
  const progress = useGameStore(s => s.progress);
  const goldFeatherAvailable = useGameStore(s => s.goldFeatherAvailable);
  const goldFeatherExpiresAt = useGameStore(s => s.goldFeatherExpiresAt);
  const useGoldFeatherInHunt = useGameStore(s => s.useGoldFeatherInHunt);
  const checkGoldFeatherExpiry = useGameStore(s => s.checkGoldFeatherExpiry);
  const currentPollyMemory = useGameStore(s => s.pollyMemory);
  const rememberPollyLine = useGameStore(s => s.rememberPollyLine);
  const { wordResults, score, bestCombo, status, lives } = game;
  const isComplete = status === 'complete';
  const hasGoldFeather =
    status === 'gameOver' &&
    goldFeatherAvailable &&
    goldFeatherExpiresAt !== null &&
    Date.now() < goldFeatherExpiresAt;

  const [prevBest] = useState(() => progress.personalBest);
  const [pollyMemoryBeforeRunRecorded] = useState(() => currentPollyMemory);
  const [usingGoldFeather, setUsingGoldFeather] = useState(false);
  const isNewBest = score > prevBest && score > 0;
  const died = status === 'gameOver';
  const bossMastered = game.bossOutcome === 'mastered';
  const isMasteryRematch = game.session.some(
    step => step.kind === 'word' && step.eventType === 'bossWord' && step.isMasteryRematch,
  );
  const flawlessWin = bossMastered && game.bossFlawless;
  const outcome: 'loss' | 'beat' | 'complete' =
    died ? 'loss' : bossMastered ? 'beat' : 'complete';
  const rank = computeRank(score);
  const prevRank = computeRank(prevBest);
  const didRankUp = isNewBest && rank.letter !== prevRank.letter;
  const grade = computeGrade(lives, wordResults);

  const rankPulseScale = useRef(new Animated.Value(1)).current;
  const rankEffectStartedRef = useRef(false);
  useEffect(() => {
    if (!didRankUp || reduceMotion === null || rankEffectStartedRef.current) return;
    rankEffectStartedRef.current = true;
    const feedback = resolveRankUpFeedback(died);
    if (feedback.sfx) playSfx(feedback.sfx);
    if (feedback.successHaptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (reduceMotion || !feedback.heavyPulse) return;
    const heavyTimer = setTimeout(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      180,
    );
    const pulse = Animated.sequence([
      Animated.spring(rankPulseScale, { toValue: 1.35, friction: 3, useNativeDriver: true }),
      Animated.spring(rankPulseScale, { toValue: 1.0, friction: 6, useNativeDriver: true }),
    ]);
    pulse.start();
    return () => {
      clearTimeout(heavyTimer);
      pulse.stop();
    };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const recordedRef = useRef(false);
  function recordFinalRunIfNeeded() {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordRunComplete(score);
  }

  useEffect(() => {
    if (hasGoldFeather && status === 'gameOver') return;
    recordFinalRunIfNeeded();
  }, [hasGoldFeather, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polly gloats over a lost run — the on-board laugh can't render because
  // the board unmounts to Results the instant the run ends.
  useEffect(() => {
    if (status === 'gameOver') playSfx('pollySqwawkLaugh', { bypassCooldown: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkGoldFeatherExpiry();
  }, [checkGoldFeatherExpiry]);

  async function handleUseGoldFeather() {
    if (!hasGoldFeather || usingGoldFeather) return;
    setUsingGoldFeather(true);
    const revived = await useGoldFeatherInHunt();
    if (!revived) {
      setUsingGoldFeather(false);
    }
  }

  function handleRestart() {
    recordFinalRunIfNeeded();
    onRestart();
  }

  function handleHome() {
    recordFinalRunIfNeeded();
    onHome();
  }

  async function handleShare() {
    recordFinalRunIfNeeded();
    try {
      await Share.share({
        message: buildShareMessage(
          game.session,
          wordResults,
          score,
          rank.letter,
          isComplete,
          bossMastered,
        ),
      });
    } catch {}
  }

  // Ceremony: verdict stamps in immediately; details reveal ~700ms later.
  const verdictScale = useRef(new Animated.Value(0.8)).current;
  const verdictY = useRef(new Animated.Value(20)).current;
  const detailOpacity = useRef(new Animated.Value(0)).current;
  const detailY = useRef(new Animated.Value(24)).current;
  const ceremonyStartedRef = useRef(false);
  const [detailsInteractive, setDetailsInteractive] = useState(false);

  useEffect(() => {
    if (reduceMotion === null || ceremonyStartedRef.current) return;
    ceremonyStartedRef.current = true;
    if (reduceMotion) {
      verdictScale.setValue(1);
      verdictY.setValue(0);
      detailOpacity.setValue(1);
      detailY.setValue(0);
      setDetailsInteractive(true);
      return;
    }
    Animated.parallel([
      Animated.spring(verdictScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      Animated.spring(verdictY, { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(detailOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(detailY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setDetailsInteractive(true);
      });
    }, 700);
    return () => clearTimeout(t);
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // derived data — the missed/trap callouts are haunt territory, so they only
  // read boss-word results (ghosts are boss-only; non-boss misses are not haunts)
  const wordOnlyResults = wordResults.filter(r => r.roundKind === 'word');
  const bossResults = wordResults.filter(r => r.isBossWord);
  const hauntMissedMaskIds = bossResults.flatMap(r => r.missedMaskIds);
  const hauntWrongMaskIds = bossResults.flatMap(r => r.wrongMaskIds);
  const firstWrongMaskId = hauntWrongMaskIds[0] ?? null;
  const pollyMoment = deriveResultsPollyMoment(
    wordResults,
    isComplete,
    bossMastered,
    pollyMemoryBeforeRunRecorded,
  );
  const pollyLineRememberedRef = useRef(false);
  useEffect(() => {
    if (!pollyMoment || pollyLineRememberedRef.current) return;
    pollyLineRememberedRef.current = true;
    rememberPollyLine(pollyMoment.lineId, 'results');
  }, [pollyMoment, rememberPollyLine]);

  const verdictText =
    outcome === 'loss' ? RESULTS_VERDICT_LOSS
    : outcome === 'beat' && isMasteryRematch ? 'REMATCH CLEARED'
    : outcome === 'beat' ? RESULTS_VERDICT_BEAT
    : RESULTS_VERDICT_COMPLETE;
  const verdictSub = outcome === 'loss' ? RESULTS_SUB_LOSS : null;

  const perfectCount = wordOnlyResults.filter(
    r => r.correctUp === r.totalRealMasks && r.wrongSwipes === 0,
  ).length;

  return (
    <View style={rs.container}>
      <ScrollView
        style={rs.scroll}
        contentContainerStyle={rs.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── VERDICT — the ceremony, appears exactly once ── */}
        <Animated.View
          style={[rs.verdictBlock, { transform: [{ scale: verdictScale }, { translateY: verdictY }] }]}
        >
          <View style={rs.verdictBox}>
            <FoilWord
              word={verdictText}
              fontSize={resultsType.verdict}
              numberOfLines={0}
              baseStyle={rs.verdict}
            />
          </View>
          {verdictSub && <Text style={rs.verdictSub}>{verdictSub}</Text>}
          <Text style={[rs.gradeSub, { color: grade.color }]}>{grade.text}</Text>
          {flawlessWin && <Text style={rs.flawlessTag}>FLAWLESS</Text>}

          <View style={rs.rankRow}>
            <Text style={rs.rankLabel}>RANK</Text>
            <Animated.Text
              style={[rs.rankLetter, { color: rank.color, transform: [{ scale: rankPulseScale }] }]}
            >
              {rank.letter}
            </Animated.Text>
          </View>

          <Text style={rs.scoreLine}>
            {score.toLocaleString()} pts  ·  ×{bestCombo} best combo
          </Text>
          <Text style={rs.perfectLine}>
            {perfectCount}/{wordOnlyResults.length} perfect
          </Text>
          {isNewBest ? (
            <Text style={rs.newBest}>NEW BEST</Text>
          ) : (
            <Text style={rs.prevBest}>
              Best: {prevBest > 0 ? prevBest.toLocaleString() : '—'}
            </Text>
          )}
        </Animated.View>

        {/* ── DETAILS — reveal beneath the verdict ── */}
        <Animated.View style={{ opacity: detailOpacity, transform: [{ translateY: detailY }] }}>
          {/* Ledger */}
          {wordOnlyResults.length > 0 && (
            <View style={rs.ledgerPanel}>
              <LinearGradient
                colors={[resultsLedger.parchmentTop, resultsLedger.parchment]}
                style={rs.parchment}
              >
                {wordOnlyResults.map((r, i) => (
                  <LedgerRow key={`${r.wordId ?? r.word}-${i}`} result={r} bossMastered={bossMastered} />
                ))}
              </LinearGradient>
            </View>
          )}

          {/* Ghost revenge */}
          {ghostRevenge?.result === 'correct' && (
            <View style={[cc.card, cc.cleared]}>
              <Text style={[cc.header, { color: PW.color.goldSoft }]}>Haunt broken</Text>
              <View style={rs.foilWordBox}>
                <FoilWord
                  word={ghostRevenge.word.toUpperCase()}
                  fontSize={resultsType.cardWord}
                  baseStyle={rs.foilCardWord}
                />
              </View>
              <Text style={cc.copy}>Rematch won.</Text>
            </View>
          )}
          {ghostRevenge?.result === 'wrong' && (
            <View style={[cc.card, cc.ghost]}>
              <Text style={[cc.header, { color: resultsCard.ghostTitle }]}>Still haunting you</Text>
              <Text style={[cc.word, { color: resultsCard.ghostTitle }]}>
                {ghostRevenge.word.toUpperCase()}
              </Text>
              <Text style={cc.copy}>Missed me?</Text>
            </View>
          )}

          {/* Meaning missed — haunts only */}
          {hauntMissedMaskIds.length > 0 && (
            <GhostSetCard firstMissedMaskId={hauntMissedMaskIds[0]} />
          )}

          {/* Trap that got you */}
          {firstWrongMaskId && <TrapCard maskId={firstWrongMaskId} />}
        </Animated.View>
      </ScrollView>

      {/* ── FOOTER — always above Polly's reach, outside the scroll ── */}
      <Animated.View
        pointerEvents={detailsInteractive ? 'auto' : 'none'}
        accessibilityElementsHidden={!detailsInteractive}
        importantForAccessibility={detailsInteractive ? 'auto' : 'no-hide-descendants'}
        style={[rs.footer, { opacity: detailOpacity, transform: [{ translateY: detailY }] }]}
      >
        {hasGoldFeather && (
          <GoldFeatherButton
            onPress={handleUseGoldFeather}
            disabled={usingGoldFeather}
          />
        )}
        <RunItBackButton onPress={handleRestart} />
        <ShareRunButton onPress={handleShare} />
        <Pressable
          onPress={handleHome}
          accessibilityRole="button"
          accessibilityLabel="Go home"
          style={rs.homeLink}
        >
          <Text style={rs.homeLinkText}>HOME</Text>
        </Pressable>
      </Animated.View>

      <PollyResultsPerch outcome={outcome} line={pollyMoment?.line ?? null} />
    </View>
  );
}

const rs = StyleSheet.create({
  container: {
    flex: 1, // transparent — GameScreen's stage shows through
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: POLLY_RESULTS_PERCH_CLEARANCE, // clears Polly's reach regardless of scroll position
  },
  verdictBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  verdictBox: {
    width: '100%',
    minHeight: resultsType.verdict * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdict: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: resultsType.verdict,
    lineHeight: resultsType.verdict * 1.15,
    letterSpacing: 2,
    textAlign: 'center',
    width: '100%',
  },
  verdictSub: {
    color: PW.color.softWhite,
    fontSize: resultsType.verdictSub,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  gradeSub: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: resultsType.gradeSub,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 6,
    opacity: 0.8,
  },
  flawlessTag: {
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: resultsType.verdictSub,
    color: PW.color.amber,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  rankLabel: {
    color: PW.color.mutedWhite,
    fontSize: resultsType.rankLabel,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    letterSpacing: 2,
  },
  rankLetter: {
    fontSize: resultsType.rankLetter,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 1,
  },
  scoreLine: {
    color: PW.color.softWhite,
    fontSize: resultsType.scoreLine,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
  },
  perfectLine: {
    color: PW.color.foilLight,
    fontSize: resultsType.perfectLine,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    marginTop: 4,
    opacity: 0.85,
  },
  newBest: {
    color: resultsVerdictColor.newBest,
    fontSize: resultsType.bestLine,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    letterSpacing: 2,
    marginTop: 6,
  },
  prevBest: {
    color: resultsVerdictColor.prevBest,
    fontSize: resultsType.bestLine,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    marginTop: 4,
  },
  ledgerPanel: {
    backgroundColor: resultsLedger.panelFace,
    borderWidth: 1.5,
    borderColor: resultsLedger.panelRim,
    borderRadius: PW.radius.lg,
    padding: 6,
    marginBottom: 16,
  },
  parchment: {
    borderRadius: PW.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  foilWordBox: {
    height: resultsType.cardWord + 10,
    justifyContent: 'center',
    marginBottom: 4,
  },
  foilCardWord: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: resultsType.cardWord,
    letterSpacing: 1.5,
    textAlign: 'left',
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  homeLinkText: {
    color: PW.color.mutedWhite,
    fontSize: resultsType.homeLink,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    letterSpacing: 2,
  },
});
