import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/fonts';
import { WordResult } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { SessionStep } from '../game/types';
import { playSfx } from '../audio/sfx';
import { FoilWord } from '../components/ui/FoilWord';
import PollyResultsPerch, { POLLY_RESULTS_PERCH_CLEARANCE } from '../components/PollyResultsPerch';
import { ResultsConsequencePanel } from '../components/ResultsConsequencePanel';
import { PW } from '../ui/pwTheme';
import { homePlateMaterial, homeType } from '../ui/pwHomeMaterials';
import { usePulseScale } from '../hooks/usePulseScale';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { resolveHuntResultLabel } from '../game/huntControl';
import { resolveHuntPerformance } from '../game/pollyMood';
import { localDateKey } from '../game/bookLog';
import { resolveResultsConsequences } from '../game/resultsAftermath';
import {
  derivePollyRelationshipContext,
  resolvePollyRelationshipBeat,
  resolvePollyRelationshipPresentation,
} from '../game/pollyRelationship';
import {
  RESULTS_RESTART_LABEL,
  deriveResultsPollyMoment,
  LOSS_CAUSE_LINES,
  pickLossVerdictLine,
  resultsLedger,
  resultsType,
} from '../ui/pwResultsMaterials';

const GOLD_FEATHER_IMG = require('../../assets/ui/feather-gold-reward.png');

function buildShareMessage(
  session: SessionStep[],
  wordResults: WordResult[],
  isComplete: boolean,
  bossMastered: boolean,
  haunted: boolean,
  bossRematchLost: boolean,
  bossRematchWon: boolean,
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
  const verdict = resolveHuntResultLabel({
    status: isComplete ? 'complete' : 'gameOver',
    bossMastered,
    haunted,
    bossRematchLost,
    bossRematchWon,
  });
  return `POLYWORDS · ${verdict}\n${grid}`;
}

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
    paddingVertical: 8,
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

function StartNewHuntButton({ onPress }: { onPress: () => void }) {
  const scale = usePulseScale();
  const glow = useRef(new Animated.Value(0)).current;
  const glowOn = () => Animated.timing(glow, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  const glowOff = () => Animated.timing(glow, { toValue: 0, duration: 320, useNativeDriver: true }).start();

  return (
    <View style={btn.wrap}>
      <Animated.View pointerEvents="none" style={[btn.glowBloom, { opacity: glow }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={glowOn}
          onPressOut={glowOff}
          accessibilityRole="button"
          accessibilityLabel="Start a new hunt"
          style={({ pressed }) => [btn.shell, pressed && btn.pressed]}
        >
          <LinearGradient colors={homePlateMaterial.huntFace} style={btn.face}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={btn.label}>
              {RESULTS_RESTART_LABEL}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const btn = StyleSheet.create({
  wrap: { position: 'relative' },
  glowBloom: {
    position: 'absolute', left: -6, right: -6, top: -6, bottom: -6,
    borderRadius: homePlateMaterial.huntRadius + 4,
    backgroundColor: 'rgba(245,200,66,0.16)',
    ...PW.shadow.glowGold,
  },
  shell: {
    borderRadius: homePlateMaterial.huntRadius,
    borderWidth: 1.5,
    borderColor: homePlateMaterial.huntRim,
    overflow: 'hidden',
  },
  face: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  label: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: homeType.dareLabel,
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.96 }] },
});

function ResultsQuietRow({ onShare, onHome }: { onShare: () => void; onHome: () => void }) {
  return (
    <View style={qp.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share this run"
        onPress={onShare}
        style={({ pressed }) => [qp.shell, pressed && qp.pressed]}
      >
        <LinearGradient colors={homePlateMaterial.quietFace} style={qp.face}>
          <Text style={qp.label}>SHARE RESULT</Text>
        </LinearGradient>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go home"
        onPress={onHome}
        style={({ pressed }) => [qp.shell, pressed && qp.pressed]}
      >
        <LinearGradient colors={homePlateMaterial.quietFace} style={qp.face}>
          <Text style={qp.label}>HOME</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const qp = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  shell: {
    flex: 1,
    borderRadius: homePlateMaterial.quietRadius,
    borderWidth: 1.5,
    borderColor: homePlateMaterial.quietRim,
    overflow: 'hidden',
  },
  face: { minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  label: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: homeType.doorTitle,
    letterSpacing: 1,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.96 }] },
});

function GoldFeatherButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Use Gold Feather free life"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [gf.shell, pressed && !disabled && gf.pressed, disabled && gf.disabled]}
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
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: PW.color.overlayHeavy,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    ...PW.shadow.glowGold,
  },
  feather: { width: 28, height: 46 },
  copyBlock: { flex: 1 },
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
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.5 },
});

type Props = {
  onRestart: () => void;
  onHome: () => void;
};

export default function ResultsScreen({ onRestart, onHome }: Props) {
  const navigation = useNavigation<any>();
  const reduceMotion = useReducedMotionPreference();
  const game = useGameStore(s => s.game);
  const ghosts = useGameStore(s => s.ghosts);
  const recordRunComplete = useGameStore(s => s.recordRunComplete);
  const goldFeatherAvailable = useGameStore(s => s.goldFeatherAvailable);
  const goldFeatherExpiresAt = useGameStore(s => s.goldFeatherExpiresAt);
  const useGoldFeatherInHunt = useGameStore(s => s.useGoldFeatherInHunt);
  const checkGoldFeatherExpiry = useGameStore(s => s.checkGoldFeatherExpiry);
  const currentPollyMemory = useGameStore(s => s.pollyMemory);
  const currentProgress = useGameStore(s => s.progress);
  const rememberPollyLine = useGameStore(s => s.rememberPollyLine);
  const pollyRelationshipBeatForDev = useGameStore(s => s.pollyRelationshipBeatForDev);
  const clearPollyRelationshipBeatForDev = useGameStore(s => s.clearPollyRelationshipBeatForDev);
  const { wordResults, score, bestCombo, status } = game;
  const isComplete = status === 'complete';
  const haunted = game.bossOutcome === 'haunted' || game.hauntOutcome === 'haunted';
  const hasGoldFeather =
    status === 'gameOver' &&
    goldFeatherAvailable &&
    goldFeatherExpiresAt !== null &&
    Date.now() < goldFeatherExpiresAt;

  const [pollyMemoryBeforeRunRecorded] = useState(() => currentPollyMemory);
  const [progressBeforeRunRecorded] = useState(() => currentProgress);
  const [relationshipBeatForDev] = useState(() => pollyRelationshipBeatForDev);
  const [usingGoldFeather, setUsingGoldFeather] = useState(false);
  const died = status === 'gameOver';
  const bossMastered = game.bossOutcome === 'mastered';
  const flawlessWin = bossMastered && game.bossFlawless;
  const outcome: 'loss' | 'beat' | 'complete' = died ? 'loss' : bossMastered ? 'beat' : 'complete';
  const bossStep = game.session.find(step => step.kind === 'word' && step.eventType === 'bossWord');
  const hauntStep = game.session.find(step => step.kind === 'word' && step.isHauntReturn === true);
  // A lost MASTER'S REMATCH: nothing haunts the player, so it reads BUSTER.
  const bossRematchLost =
    game.bossOutcome === 'haunted' && bossStep?.kind === 'word' && bossStep.isMasteryRematch === true;
  // A won MASTER'S REMATCH: KING takes over the MASTERED label.
  const bossRematchWon =
    bossMastered && bossStep?.kind === 'word' && bossStep.isMasteryRematch === true;
  const resultLabel = resolveHuntResultLabel({
    status: died ? 'gameOver' : 'complete',
    bossMastered,
    haunted,
    bossRematchLost,
    bossRematchWon,
  });

  const consequences = resolveResultsConsequences({
    bossOutcome: game.bossOutcome,
    hauntOutcome: game.hauntOutcome,
    bossWord: bossStep?.kind === 'word' ? bossStep.word : null,
    hauntWord: hauntStep?.kind === 'word' ? hauntStep.word : null,
    bossIsRematch: bossStep?.kind === 'word' && bossStep.isMasteryRematch === true,
  });

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
    if (!revived) setUsingGoldFeather(false);
  }

  function handleRestart() {
    recordFinalRunIfNeeded();
    onRestart();
  }

  function handleHome() {
    recordFinalRunIfNeeded();
    onHome();
  }

  function handleOpenJournal() {
    recordFinalRunIfNeeded();
    navigation.navigate('Vault', {
      polybookSection: 'JOURNAL',
      polybookDate: localDateKey(new Date()),
    });
  }

  async function handleShare() {
    recordFinalRunIfNeeded();
    try {
      await Share.share({
        message: buildShareMessage(game.session, wordResults, isComplete, bossMastered, haunted, bossRematchLost, bossRematchWon),
      });
    } catch {}
  }

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
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(detailOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(detailY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setDetailsInteractive(true);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const wordOnlyResults = wordResults.filter(r => r.roundKind === 'word');
  const [pollyRoll] = useState(() => Math.random());
  const currentPerformance = resolveHuntPerformance({
    status: died ? 'gameOver' : 'complete',
    stepIndex: game.stepIndex,
    sessionLength: game.session.length,
    bossOutcome: game.bossOutcome,
  });
  const relationshipContext = derivePollyRelationshipContext({
    memory: pollyMemoryBeforeRunRecorded,
    recent: [currentPerformance, ...(progressBeforeRunRecorded.recentHuntPerformance ?? [])].slice(0, 5),
    runsCompleted: progressBeforeRunRecorded.runsCompleted + 1,
    masteredCount: progressBeforeRunRecorded.masteredWords.length,
    now: Date.now(),
  });
  const relationshipDecision = __DEV__ && relationshipBeatForDev === 'veteranSlump'
    ? { beat: 'veteranSlump' as const, wordRivalry: null }
    : resolvePollyRelationshipBeat({
        context: relationshipContext,
        surface: 'results',
        currentOutcome: died ? 'pollyWon' : bossMastered ? 'playerBeatPolly' : 'playerCompleted',
      });
  const relationshipPresentation = resolvePollyRelationshipPresentation({
    decision: relationshipDecision,
    recentLineIds: pollyMemoryBeforeRunRecorded.recentLineIds,
    lineRoll: pollyRoll,
  });
  const pollyMoment = relationshipPresentation?.moment ?? deriveResultsPollyMoment(
    wordResults,
    isComplete,
    bossMastered,
    pollyMemoryBeforeRunRecorded,
    pollyRoll,
  );
  const pollyLineRememberedRef = useRef(false);

  useEffect(() => {
    if (__DEV__ && relationshipBeatForDev !== null) clearPollyRelationshipBeatForDev();
  }, [relationshipBeatForDev, clearPollyRelationshipBeatForDev]);

  useEffect(() => {
    if (!pollyMoment || pollyLineRememberedRef.current) return;
    pollyLineRememberedRef.current = true;
    rememberPollyLine(pollyMoment.lineId, 'results');
  }, [pollyMoment, rememberPollyLine]);

  const [lossLineRoll] = useState(() => Math.random());
  // A lost MASTER'S REMATCH ends as BUSTER with its own line; it is not a
  // 'loss' outcome (the Hunt completes), so it is checked first.
  const verdictSub = bossRematchLost
    ? LOSS_CAUSE_LINES.rematchLost
    : outcome === 'loss'
      ? pickLossVerdictLine(ghosts.length, game.lossCause, lossLineRoll)
      : null;
  const perfectCount = wordOnlyResults.filter(
    r => r.correctUp === r.totalRealMasks && r.wrongSwipes === 0,
  ).length;

  const SCROLL_FADE_EDGE = 4;
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollOffsetRef = useRef(0);
  const scrollContentHeightRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);

  function recomputeScrollFade() {
    const maxOffset = Math.max(0, scrollContentHeightRef.current - scrollViewportHeightRef.current);
    const nextUp = scrollOffsetRef.current > SCROLL_FADE_EDGE;
    const nextDown = maxOffset > SCROLL_FADE_EDGE && scrollOffsetRef.current < maxOffset - SCROLL_FADE_EDGE;
    setCanScrollUp(prev => (prev === nextUp ? prev : nextUp));
    setCanScrollDown(prev => (prev === nextDown ? prev : nextDown));
  }

  function handleResultsScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
    recomputeScrollFade();
  }

  function handleResultsContentSizeChange(_w: number, h: number) {
    scrollContentHeightRef.current = h;
    recomputeScrollFade();
  }

  function handleResultsScrollLayout(e: LayoutChangeEvent) {
    scrollViewportHeightRef.current = e.nativeEvent.layout.height;
    recomputeScrollFade();
  }

  return (
    <View style={rs.container}>
      <View style={rs.topStack}>
        <Animated.View
          style={[rs.verdictBlock, { transform: [{ scale: verdictScale }, { translateY: verdictY }] }]}
        >
          <View style={rs.verdictBox}>
            <FoilWord
              word={resultLabel}
              fontSize={30}
              numberOfLines={0}
              baseStyle={rs.verdict}
            />
          </View>
          {verdictSub && <Text style={rs.verdictSub}>{verdictSub}</Text>}
          {flawlessWin && <Text style={rs.flawlessTag}>FLAWLESS</Text>}
        </Animated.View>
      </View>

      <View style={rs.scrollWrap} onLayout={handleResultsScrollLayout}>
        <ScrollView
          style={rs.scroll}
          contentContainerStyle={rs.scrollContent}
          showsVerticalScrollIndicator={true}
          onScroll={handleResultsScroll}
          onContentSizeChange={handleResultsContentSizeChange}
          scrollEventThrottle={16}
        >
          <Animated.View
            pointerEvents={detailsInteractive ? 'auto' : 'none'}
            accessibilityElementsHidden={!detailsInteractive}
            importantForAccessibility={detailsInteractive ? 'auto' : 'no-hide-descendants'}
            style={{ opacity: detailOpacity, transform: [{ translateY: detailY }] }}
          >
            <ResultsConsequencePanel consequences={consequences} onOpenJournal={handleOpenJournal} />

            <View style={rs.recapHeader}>
              <Text style={rs.recapTitle}>HUNT RECAP</Text>
              <Text style={rs.perfectLine}>
                {perfectCount}/{wordOnlyResults.length} perfect  ·  best chain {bestCombo}
              </Text>
            </View>

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

            <View style={rs.actions}>
              {hasGoldFeather && (
                <GoldFeatherButton onPress={handleUseGoldFeather} disabled={usingGoldFeather} />
              )}
              <StartNewHuntButton onPress={handleRestart} />
              <ResultsQuietRow onShare={handleShare} onHome={handleHome} />
            </View>
          </Animated.View>
        </ScrollView>

        {canScrollUp && (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(15,13,42,0.6)', 'rgba(15,13,42,0)']}
            style={rs.scrollFadeTop}
          />
        )}
        {canScrollDown && (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(15,13,42,0)', 'rgba(15,13,42,0.6)']}
            style={rs.scrollFadeBottom}
          />
        )}
      </View>

      <PollyResultsPerch
        outcome={outcome}
        line={pollyMoment?.line ?? null}
        relationshipPose={relationshipPresentation?.poseIntent ?? 'default'}
      />
    </View>
  );
}

const rs = StyleSheet.create({
  container: { flex: 1 },
  topStack: {
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  verdictBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  verdictBox: {
    width: '100%',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdict: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: 2,
    textAlign: 'center',
    width: '100%',
  },
  verdictSub: {
    width: '100%',
    color: PW.color.softWhite,
    fontSize: 14,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    letterSpacing: 2.4,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  flawlessTag: {
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    color: PW.color.amber,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  scrollWrap: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: POLLY_RESULTS_PERCH_CLEARANCE + 24,
  },
  scrollFadeTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 28 },
  scrollFadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 28 },
  recapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  recapTitle: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 2.2,
  },
  perfectLine: {
    flexShrink: 1,
    color: PW.color.foilLight,
    fontSize: 13,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    textAlign: 'right',
    opacity: 0.78,
  },
  ledgerPanel: {
    backgroundColor: resultsLedger.panelFace,
    borderWidth: 1.5,
    borderColor: resultsLedger.panelRim,
    borderRadius: PW.radius.lg,
    padding: 6,
    marginBottom: 12,
  },
  parchment: {
    borderRadius: PW.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  actions: {
    paddingTop: 2,
    paddingBottom: 12,
  },
});
