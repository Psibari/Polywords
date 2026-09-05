import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, FONT_SIZES } from '../constants/fonts';
import { Haptics } from '../utils/haptics';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import HeroBook, { type HeroBookVariant } from './ui/HeroBook';
import { FoilWord } from './ui/FoilWord';
import { BookLight } from './ui/BookLight';
import type { PollyEvent } from '../game/pollyVisitPolicy';
import { playSfx, warmBossOutcomeSfx } from '../audio/sfx';
import { setBossOutcomeMusicDucked } from '../audio/MusicEngine';
import { PW } from '../ui/pwTheme';
import { libraryMaterial } from '../ui/pwMaterials';
import { bossOutcomeAssets } from '../ui/bossOutcomeAssets';
import { useHeartbeat } from '../hooks/useHeartbeat';
import MasterySeal from './MasterySeal';
import { useBoardMechanics } from '../hooks/useBoardMechanics';
import type { ChainTier } from '../hooks/useBoardMechanics';
import MaskCardArtwork from './ui/MaskCardArtwork';
import { BossGauntletSpines } from './BossGauntletSpines';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  resolveBossOutcomePlaqueFeedback,
  resolveBossOutcomeSequenceFeedback,
  resolveOutcomeRevealSfx,
} from '../game/huntOutcomeFeedback';
import type { ScreenFlashEvent } from '../game/huntFeedbackPolicy';
import {
  hasBoardVerticalOverflow,
  resolveActiveCueLayout,
  resolveActiveTileHeight,
  resolveBoardVerticalSpacing,
} from './tileTextLayout';
import { shouldReleaseOpeningDecision } from './boardDecisionReadiness';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 6;
const TILE_H     = 152;
const FINAL_TILE_H = 72;
const FINAL_TILE_GAP = 10;
const TILE_INSET = 16;
const MAX_DECK_BACKING_CARDS = 4;
const DECK_BACKING_OFFSET = 9;

// ── Boss outcome slam timing ────────────────────────────────────
// See triggerBossOutcomeSlam's comment for the concealed-swap rationale.
// Mastered total 400ms / Haunted total 580ms — the ~1.45x ratio between
// them (Haunted heavier/slower) is deliberate and preserved from the
// original pass; both were nudged up together for more weight, not just
// Haunted in isolation. First-pass feel numbers, not device-confirmed.
const MASTERED_IMPACT_MS = 170; // front-facing → edge-on, punchy (was 150)
const MASTERED_SWAP_AT_MS = 70; // ~GoldFlash's 65ms attack peak — unchanged, tied to the flash, not the swing
const MASTERED_RECOIL_MS = 100; // edge-on → slight overshoot bounce (was 90)
const MASTERED_SETTLE_MS = 130; // bounce → rest, reveals the gold rig (was 110)
const HAUNTED_DRAG_MS = 280;    // front-facing → edge-on, heavy, no punch (was 260)
const HAUNTED_SWAP_AT_MS = 150; // under the rising drain haze + board shake — scaled with HAUNTED_DRAG_MS to hold the same ~54% mid-swing concealment point (was 140)
const HAUNTED_SETTLE_MS = 300;  // edge-on → rest, no bounce — sinks shut (was 260)

// Deck timing curves — shared by the round's opening deal-in and the
// per-tile shuffle-forward animation (Task 1), so the deck reads as one
// consistent object rather than two different systems.
const CARD_DEAL = Easing.bezier(0.18, 1.04, 0.26, 1.00);
const CARD_SNAP = Easing.bezier(0.16, 0.95, 0.22, 1.00);

const SCREEN_WIDTH = Dimensions.get('window').width;

const CHAIN_TIER_SFX_RATE: Record<ChainTier, number> = { 1: 1.0, 2: 1.08, 3: 1.16 };

export type Props = {
  step: WordStep;
  spawnEffect?: (type: 'shard' | 'trail', x: number, y: number, variant?: string) => void;
  onWrongSwipe?: () => void;
  onGoldFlash?: (event: ScreenFlashEvent) => void;
  onBossDecisionReady?: () => void;
  onSwipeAttempt?: () => void;
  // Owned by GameContent — the visit layer must outlive this board's
  // per-word remount (key={stepIndex}), or word-completion beats die mid-arc.
  firePollyEvent: (event: PollyEvent) => void;
};

type BoardPresenterProps = Props & {
  // Drives the boss-only chest theater below; BossBoard passes true,
  // MaskBoard passes false, so the normal-round face is unaffected.
  isBossStage: boolean;
};

type ResolvedTileState = 'correct' | 'trap-caught' | 'wrong';

type OutcomeOverlayProps = {
  word: string;
  headline?: string;
  bonusLabel?: string;
  detail?: string;
  onContinue: () => void;
  // Boss only: swaps the generic rounded panel for the illustrated result
  // plaque that continues the just-completed book transformation. A
  // Returning Haunt success (headline 'BANISHED') gets its own illustrated
  // plaque too (see isBanished in MasteredOutcomeOverlay/banishedPlaqueArt),
  // independent of this flag — its book never transforms, so it renders
  // through the full scrim, not the boss plaque's lighter one. Only the
  // Haunt-rematch failure (STILL HAUNTED) keeps the original generic panel.
  isBoss: boolean;
};

// Result plaques (boss only) — approved production art, used as supplied.
// Both are pre-cropped to their own visible-alpha bounds (source PSDs carry
// very different amounts of transparent padding — sizing off raw canvas
// dimensions instead of visible content made Mastered read far smaller
// than Haunted at the same declared width). Aspect ratios below are each
// crop's own measured width/height; contain-fit at a shared frame width
// preserves them exactly, never stretching either plaque.
const masteredPlaqueArt = require('../../assets/images/results/mastered-result-plaque.png');
const hauntedPlaqueArt = require('../../assets/images/results/haunted-result-plaque.png');
const MASTERED_PLAQUE_ASPECT = 681 / 567;
const HAUNTED_PLAQUE_ASPECT = 1263 / 954;

// The Returning Haunt banish plaque. Same alpha-crop-plus-margin treatment as
// the two above, cropped from the supplied banished.png. Unlike those two,
// this is not boss-gated — a Returning Haunt is never boss UI (see
// isBoss below), so it renders through the full outcomeOverlay scrim, not
// the lighter plaqueOverlay: there is no just-transformed book behind it to
// keep visible.
const banishedPlaqueArt = require('../../assets/images/results/banished-result-plaque.png');
const BANISHED_PLAQUE_ASPECT = 705 / 553;

// buildHauntedDetail (useBoardMechanics.ts) formats one combined string —
// "Trap claimed: X" or "Missed: X" for a boss failure, "Still haunted."
// for a Haunt-rematch fail (never reaches this boss-only split). Pure
// presentation-layer parse of that existing string; no brain-layer change.
function splitHauntedDetail(detail?: string): { label: string; phrase: string } | null {
  if (!detail) return null;
  const trapMatch = detail.match(/^Trap claimed: (.+)$/);
  if (trapMatch) return { label: 'TRAP CLAIMED', phrase: trapMatch[1] };
  const missedMatch = detail.match(/^Missed: (.+)$/);
  if (missedMatch) return { label: 'MISSED', phrase: missedMatch[1] };
  return { label: 'TRAP CLAIMED', phrase: detail };
}

function MasteredOutcomeOverlay({ word, headline = 'MASTERED', bonusLabel, onContinue, isBoss }: OutcomeOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  // Starts dim, brightens the instant the tap actually starts working — the
  // 1200ms non-interactive window otherwise had zero visual signal, so an
  // early tap looked like a dropped touch rather than "not yet."
  const continueOpacity = useRef(new Animated.Value(0.35)).current;
  const resolvedRef = useRef(false);
  const reduceMotion = useReducedMotionPreference();
  const [canDismiss, setCanDismiss] = useState(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    if (!canDismiss) return;
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    if (!canDismiss) return;
    if (reduceMotion !== false) {
      continueOpacity.setValue(1);
      return;
    }
    Animated.timing(continueOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [canDismiss, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      pulse.setValue(0);
      const auto = setTimeout(resolve, 2800);
      const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
      return () => { clearTimeout(auto); clearTimeout(dismissTimer); };
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 160, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    const auto = setTimeout(resolve, 2800);
    const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
    return () => { clearTimeout(auto); clearTimeout(dismissTimer); loop.stop(); };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.62] });
  const isBanished = headline === 'BANISHED';

  if (isBanished) {
    // Returning Haunt success. Illustrated frame, but through the standard
    // full scrim (outcomeOverlay), not the boss-only lighter plaqueOverlay —
    // there is no transformed book behind this one.
    return (
      <Pressable style={styles.outcomeOverlay} onPress={handlePress}>
        <Animated.View style={[styles.plaqueColumn, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.plaqueFrame, styles.banishedPlaqueFrame]}>
            <Image source={banishedPlaqueArt} style={[styles.plaqueImage, { aspectRatio: BANISHED_PLAQUE_ASPECT }]} resizeMode="contain" />
            <View pointerEvents="none" style={[styles.plaqueContent, styles.banishedPlaqueContent]}>
              <Text style={[styles.plaqueHeadline, styles.banishedPlaqueHeadline]}>{headline}</Text>
              <Text
                style={[styles.plaqueWord, styles.banishedPlaqueWord]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {word}
              </Text>
              <View style={styles.plaqueCopyBlock}>
                <Text style={[styles.plaqueCopy, styles.banishedPlaqueCopy]}>Not one of Polly's traps.</Text>
                <Text style={[styles.plaqueCopy, styles.banishedPlaqueCopy]}>You saw through it.</Text>
              </View>
              {bonusLabel && (
                <Text
                  style={[styles.plaqueBonus, styles.banishedPlaqueBonus]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {bonusLabel}
                </Text>
              )}
            </View>
          </View>
          <Animated.Text style={[styles.plaqueContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
        </Animated.View>
      </Pressable>
    );
  }

  if (isBoss) {
    // Plaque presentation. pulse keeps running (untouched, above) but has
    // no ring to drive here — the illustrated frame carries that job now.
    return (
      <Pressable style={styles.plaqueOverlay} onPress={handlePress}>
        <Animated.View style={[styles.plaqueColumn, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.plaqueFrame, styles.masteredPlaqueFrame]}>
            <Image source={masteredPlaqueArt} style={[styles.plaqueImage, { aspectRatio: MASTERED_PLAQUE_ASPECT }]} resizeMode="contain" />
            <View pointerEvents="none" style={[styles.plaqueContent, styles.masteredPlaqueContent]}>
              <Text style={[styles.plaqueHeadline, styles.masteredPlaqueHeadline]}>{headline}</Text>
              <Text
                style={[styles.plaqueWord, styles.masteredPlaqueWord]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {word}
              </Text>
              <View style={styles.plaqueCopyBlock}>
                <Text style={[styles.plaqueCopy, styles.masteredPlaqueCopy]}>Not one of Polly's traps.</Text>
                <Text style={[styles.plaqueCopy, styles.masteredPlaqueCopy]}>You saw through it.</Text>
              </View>
              {bonusLabel && (
                <Text
                  style={[styles.plaqueBonus, styles.masteredPlaqueBonus]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {bonusLabel}
                </Text>
              )}
            </View>
          </View>
          <Animated.Text style={[styles.plaqueContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.outcomeOverlay} onPress={handlePress}>
      <Animated.View style={[styles.outcomePanel, styles.masteredOutcomePanel, { opacity, transform: [{ scale }] }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.masteredPulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
        />
        <Text style={[styles.outcomeHeadline, styles.masteredOutcomeHeadline]}>{headline}</Text>
        <Text style={styles.outcomeWord} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.64}>
          {word}
        </Text>
        <View style={styles.outcomeCopyBlock}>
          <Text style={styles.outcomeCopy}>Not one of Polly's traps.</Text>
          <Text style={styles.outcomeCopy}>You saw through it.</Text>
        </View>
        {bonusLabel && <Text style={styles.outcomeBonus}>{bonusLabel}</Text>}
        <Animated.Text style={[styles.outcomeContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function HauntedOutcomeOverlay({ word, detail, onContinue, isBoss }: OutcomeOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const drift = useRef(new Animated.Value(0)).current;
  // Same dim-until-ready treatment as MasteredOutcomeOverlay — see its comment.
  const continueOpacity = useRef(new Animated.Value(0.35)).current;
  const resolvedRef = useRef(false);
  const reduceMotion = useReducedMotionPreference();
  const [canDismiss, setCanDismiss] = useState(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    if (!canDismiss) return;
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    if (!canDismiss) return;
    if (reduceMotion !== false) {
      continueOpacity.setValue(1);
      return;
    }
    Animated.timing(continueOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [canDismiss, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue(1);
      scale.setValue(1);
      drift.setValue(0);
      const auto = setTimeout(resolve, 3200);
      const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
      return () => { clearTimeout(auto); clearTimeout(dismissTimer); };
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 9, stiffness: 120, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    const auto = setTimeout(resolve, 3200);
    const dismissTimer = setTimeout(() => setCanDismiss(true), 1200);
    return () => { clearTimeout(auto); clearTimeout(dismissTimer); loop.stop(); };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const hazeY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const hazeOpacity = drift.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.48] });

  if (isBoss) {
    // Plaque presentation. drift keeps running (untouched, above) but has
    // no haze to drive here — the illustrated frame carries that job now.
    const parts = splitHauntedDetail(detail);
    return (
      <Pressable style={styles.plaqueOverlay} onPress={handlePress}>
        <Animated.View style={[styles.plaqueColumn, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.plaqueFrame, styles.hauntedPlaqueFrame]}>
            <Image source={hauntedPlaqueArt} style={[styles.plaqueImage, { aspectRatio: HAUNTED_PLAQUE_ASPECT }]} resizeMode="contain" />
            <View pointerEvents="none" style={[styles.plaqueContent, styles.hauntedPlaqueContent]}>
              <Text style={[styles.plaqueHeadline, styles.hauntedPlaqueHeadline]}>HAUNTED</Text>
              <Text
                style={[styles.plaqueWord, styles.hauntedPlaqueWord]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {word}
              </Text>
              <View style={styles.plaqueCopyBlock}>
                <Text style={[styles.plaqueCopy, styles.hauntedPlaqueCopy]}>Polly's trap held.</Text>
                <Text style={[styles.plaqueCopy, styles.hauntedPlaqueCopy]}>It'll be waiting.</Text>
              </View>
              {parts && (
                <View style={styles.plaqueDangerBlock}>
                  <Text style={styles.plaqueDangerLabel}>{parts.label}</Text>
                  <Text
                    style={styles.plaqueDangerPhrase}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {parts.phrase}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Animated.Text style={[styles.plaqueContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.outcomeOverlay} onPress={handlePress}>
      <Animated.View style={[styles.outcomePanel, styles.hauntedOutcomePanel, { opacity, transform: [{ scale }] }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.hauntedHaze, { opacity: hazeOpacity, transform: [{ translateY: hazeY }] }]}
        />
        <Text style={[styles.outcomeHeadline, styles.hauntedOutcomeHeadline]}>HAUNTED</Text>
        <Text style={styles.outcomeWord} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.64}>
          {word}
        </Text>
        <View style={styles.outcomeCopyBlock}>
          <Text style={styles.outcomeCopy}>Polly's trap held.</Text>
          <Text style={styles.outcomeCopy}>It'll be waiting.</Text>
        </View>
        {detail && <Text style={styles.hauntedDetail} numberOfLines={2}>{detail}</Text>}
        <Animated.Text style={[styles.outcomeContinue, { opacity: continueOpacity }]}>CONTINUE</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function getResolvedTileState(state: SwipeMaskState | undefined): ResolvedTileState | null {
  if (state === 'correct' || state === 'trap-caught' || state === 'wrong') {
    return state;
  }
  return null;
}


function BoardPresenter({ step, spawnEffect, onWrongSwipe, onGoldFlash, onBossDecisionReady, onSwipeAttempt, firePollyEvent, isBossStage }: BoardPresenterProps) {
  const { fontScale } = useWindowDimensions();
  // Only stepIndex is read here, so select it directly rather than the
  // whole store — this is the per-word presenter, remounted on every swipe
  // resolution, so a whole-store subscription re-rendered it on completely
  // unrelated state (daily session, settings, pollyMemory...).
  const gameStepIndex = useGameStore(s => s.game.stepIndex);
  const gauntletCorrectCount = useGameStore(s => s.game.gauntletCorrectCount);
  const { pulseAnim, tension } = useHeartbeat();
  const tileBreatheAmount = useRef(new Animated.Value(0)).current;
  const isBoss  = step.eventType === 'bossWord';
  const isHaunt = step.isHauntReturn === true;
  // Same convention as MasteredOutcomeOverlay/HauntedOutcomeOverlay below:
  // treat the pending (null) read as "reduce" so there's no frame where an
  // animation starts before the async accessibility read lands.
  const reduceMotion = useReducedMotionPreference() !== false;

  // ── layout ───────────────────────────────────────────────────
  // Seeded from the real device width (available synchronously before
  // first paint) instead of a guessed literal — onLayout below still
  // corrects it for edge cases (split-view resize, rotation), but the
  // first render is no longer drawn against a made-up number.
  const initialWindowWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(initialWindowWidth);
  const containerWidthRef                   = useRef(initialWindowWidth);
  const [activeTileLayout, setActiveTileLayout] = useState({
    maskId: null as string | null,
    height: TILE_H,
  });
  const activeTopMaskIdRef = useRef<string | null>(null);
  const [gridViewportWidth, setGridViewportWidth] = useState(0);
  const [gridViewportHeight, setGridViewportHeight] = useState(0);
  const [gridContentHeight, setGridContentHeight] = useState(0);
  const cueLayoutIdentityRef = useRef('');
  const [cueTextMeasurements, setCueTextMeasurements] = useState({
    identity: '',
    upHeight: 0,
    rightHeight: 0,
  });
  const handleActiveTileHeightChange = useCallback((maskId: string, measuredHeight: number) => {
    if (activeTopMaskIdRef.current !== maskId) return;
    const height = resolveActiveTileHeight(measuredHeight);
    setActiveTileLayout(previous => (
      previous.maskId === maskId && previous.height === height
        ? previous
        : { maskId, height }
    ));
  }, []);
  const handleCueTextLayout = useCallback((cue: 'up' | 'right', measuredHeight: number) => {
    const identity = cueLayoutIdentityRef.current;
    if (!identity) return;
    const height = Number.isFinite(measuredHeight) && measuredHeight > 0
      ? Math.ceil(measuredHeight)
      : 0;
    setCueTextMeasurements(previous => {
      const current = previous.identity === identity
        ? previous
        : { identity, upHeight: 0, rightHeight: 0 };
      const key = cue === 'up' ? 'upHeight' : 'rightHeight';
      return current[key] === height ? current : { ...current, [key]: height };
    });
  }, []);
  const containerRef  = useRef<View>(null);
  const wordZoneRef   = useRef<View>(null);
  // wordScreenY has no synchronous real-value equivalent (it's a page
  // position, not a device dimension) — wordZoneMeasured gates its only
  // consumers (SwipeMask's wordY/intakeY props) so nothing reads the
  // still-default value before the real onLayout+measure() lands.
  const [wordScreenY, setWordScreenY] = useState(180);
  const [wordZoneMeasured, setWordZoneMeasured] = useState(false);

  const prevTopIdRef = useRef<string | null>(null);
  const cardPopCountRef = useRef(0);

  // Deck entrance animation (native: translateY / transform only)
  const deckSlamY    = useRef(new Animated.Value(-52)).current;
  // Zero-feather red tint on depth cards (non-native: backgroundColor)
  const deckRedTint  = useRef(new Animated.Value(0)).current;
  // Per-card deal-in (native: translateY / rotate / opacity)
  const deckDeepY    = useRef(new Animated.Value(400)).current;
  const deckMidY     = useRef(new Animated.Value(400)).current;
  const deckActiveY  = useRef(new Animated.Value(400)).current;
  const deckBackingY = useRef(new Animated.Value(28)).current;
  const deckBackingOp = useRef(new Animated.Value(0)).current;

  // Per-backing-card animated depth state, keyed by mask id so a card's
  // identity survives the deck shrinking. This is what makes the stack
  // advance smoothly instead of snapping — see getBackingCardAnim below.
  const backingCardAnimsRef = useRef(
    new Map<string, { depthY: Animated.Value; scale: Animated.Value; rotate: Animated.Value }>()
  ).current;

  function getBackingCardAnim(maskId: string, depth: number) {
    let anim = backingCardAnimsRef.get(maskId);
    if (!anim) {
      anim = {
        depthY: new Animated.Value(depth * DECK_BACKING_OFFSET),
        scale: new Animated.Value(1 - depth * 0.01),
        rotate: new Animated.Value(depth * -1.3),
      };
      backingCardAnimsRef.set(maskId, anim);
    }
    return anim;
  }

  const deckEntranceHapticRef = useRef<string | null>(null);
  const deckDeepRot  = useRef(new Animated.Value(-4)).current;
  const deckMidRot   = useRef(new Animated.Value(3)).current;
  const deckActiveRot= useRef(new Animated.Value(-2)).current;
  const deckDeepOp   = useRef(new Animated.Value(0)).current;
  const deckMidOp    = useRef(new Animated.Value(0)).current;
  const deckActiveOp = useRef(new Animated.Value(0)).current;
  const cardPopY     = useRef(new Animated.Value(0)).current;

  // ── word absorption ──────────────────────────────────────────
  const absorptionScale       = useRef(new Animated.Value(1)).current;
  const ringScale             = useRef(new Animated.Value(1)).current;
  const ringOpacity           = useRef(new Animated.Value(0)).current;
  const wordEntryOpacity      = useRef(new Animated.Value(0)).current;
  const wordEntryScale        = useRef(new Animated.Value(0.85)).current;
  const wordEntryTranslateY   = useRef(new Animated.Value(0)).current;
  const wordEntryTilt         = useRef(new Animated.Value(0)).current;
  const wordLockPulse         = useRef(new Animated.Value(1)).current;
  const bookOpenAnim          = useRef(new Animated.Value(0)).current;  // useNativeDriver: true
  const bookIntakeGlowAnim    = useRef(new Animated.Value(0)).current;  // useNativeDriver: true
  const bookGhostDrainOpacity = useRef(new Animated.Value(0)).current; // Task 4 — boss haunt only
  const bookSlideX            = useRef(new Animated.Value(SCREEN_WIDTH)).current; // book entrance/exit slide, native driver
  const boardShakeX           = useRef(new Animated.Value(0)).current; // boss entrance / haunted micro-shake, native driver
  const wordEntranceHapticRef = useRef<string | null>(null);
  const bookOpenAnimationRef   = useRef<Animated.CompositeAnimation | null>(null);
  // Which HeroBook rig is showing. Local state, not a ref: swapping it must
  // re-render. Board remounts per word (key={`board-${stepIndex}`} in
  // GameScreen), so a fresh 'neutral' initializer is the only reset this
  // ever needs — no cleanup effect required.
  const [bookVariant, setBookVariant] = useState<HeroBookVariant>('neutral');

  function triggerBoardShake() {
    boardShakeX.setValue(0);
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(boardShakeX, { toValue: -4, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 4,  duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: -2, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 0,  duration: 35, useNativeDriver: true }),
    ]).start();
  }
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
  const [absorbedPhrase, setAbsorbedPhrase] = useState<string | null>(null);

  // ── wrong-swipe word recoil ───────────────────────────────────
  const wordRecoilY     = useRef(new Animated.Value(0)).current;  // useNativeDriver:false
  const wordRecoilScale = useRef(new Animated.Value(1)).current;  // useNativeDriver:false
  const wordRedOpacity  = useRef(new Animated.Value(0)).current;  // useNativeDriver:false
  const cueOpacityAnim = useRef(new Animated.Value(1)).current;
  const recoilRafRef    = useRef<number | null>(null);

  function triggerWrongWordRecoil() {
    if (recoilRafRef.current !== null) {
      cancelAnimationFrame(recoilRafRef.current);
      recoilRafRef.current = null;
    }
    if (reduceMotion) {
      wordRecoilY.setValue(0);
      wordRecoilScale.setValue(1);
      wordRedOpacity.setValue(0);
      return;
    }
    let t0: number | null = null;

    function tick(now: number) {
      if (t0 === null) t0 = now;
      const p = Math.min((now - t0) / 380, 1);
      const y        = -Math.sin(p * Math.PI) * 9 * (1 - p * 0.2);
      const red      = p < 0.22
        ? p / 0.22
        : Math.max(0, Math.min(1, 1 - (p - 0.22) / 0.6));
      const scaleVal = 1 + Math.sin(p * Math.PI) * 0.04;

      wordRecoilY.setValue(y);
      wordRecoilScale.setValue(scaleVal);
      wordRedOpacity.setValue(red * 0.4);

      if (p < 1) {
        recoilRafRef.current = requestAnimationFrame(tick);
      } else {
        wordRecoilY.setValue(0);
        wordRecoilScale.setValue(1);
        wordRedOpacity.setValue(0);
        recoilRafRef.current = null;
      }
    }

    recoilRafRef.current = requestAnimationFrame(tick);
  }

  // Face half of the old triggerWrongSwipeFeedback — shared by normal-tile
  // and gauntlet-tile wrong swipes, same as the original single function was.
  function performWrongSwipeFeedback(brokeRealChain: boolean) {
    playSfx('wrongLame');
    // Staggered slightly behind wrongLame — fired together, the sharper
    // squawk was burying the softer wrong-swipe whistle entirely.
    setTimeout(() => playSfx('pollySqwawkShort'), 70);
    if (brokeRealChain) {
      playSfx('correctClaim', { rate: 0.55 });
    }
    Haptics.cueAsync('wrong');
    triggerWrongWordRecoil();
    onWrongSwipe?.();
  }

  // ── boss entrance ─────────────────────────────────────────────
  function triggerBookOpen() {
    bookOpenAnim.stopAnimation();
    bookIntakeGlowAnim.stopAnimation();
    bookOpenAnimationRef.current?.stop();
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.setValue(0);
    if (reduceMotion) return;
    bookOpenAnimationRef.current = Animated.parallel([
      Animated.sequence([
        Animated.timing(bookOpenAnim, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(bookOpenAnim, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bookIntakeGlowAnim, {
          toValue: 0.9,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(bookIntakeGlowAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);
    bookOpenAnimationRef.current.start();
  }

  function triggerAbsorption(phrase: string) {
    absorptionScale.setValue(1);
    ringScale.setValue(1);
    ringOpacity.setValue(0);
    setAbsorbedPhrase(phrase);
    absorbedPhraseOpacity.setValue(1);
    if (reduceMotion) {
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(absorbedPhraseOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start(() => setAbsorbedPhrase(null));
      return;
    }
    Animated.sequence([
      Animated.timing(absorptionScale, { toValue: 1.12, duration: 120, useNativeDriver: true }),
      Animated.timing(absorptionScale, { toValue: 1.0,  duration: 180, useNativeDriver: true }),
    ]).start();

    ringScale.setValue(0.6);
    ringOpacity.setValue(0.85);
    Animated.parallel([
      Animated.timing(ringScale,   { toValue: 2.2, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0,   duration: 380, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.timing(absorbedPhraseOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setAbsorbedPhrase(null));
  }

  // Set by onRealClaimed the instant a swipe is judged correct — consumed
  // here at the card's actual visual arrival (onCardTouch fires from
  // SwipeMask's magnetic-flight physics reaching the book, up to ~1.15s
  // later) so the absorption pulse and the book's own open flick land on
  // the same beat instead of the pulse firing up to a second early.
  const pendingAbsorbPhraseRef = useRef<string | null>(null);

  function handleCardTouch() {
    if (mechanics.gatePhase !== 'locked') return;
    triggerBookOpen();
    if (pendingAbsorbPhraseRef.current !== null) {
      triggerAbsorption(pendingAbsorbPhraseRef.current);
      pendingAbsorbPhraseRef.current = null;
    }
  }

  // ── gauntlet pulse ────────────────────────────────────────────
  // A stronger, distinct pulse fired for each correctly-judged mystery
  // tile — the book stays at rest between tiles (same as normal) but
  // gets a bigger glow + heavier haptic on each correct judgment, rather
  // than holding open statically for the whole gauntlet. Reuses the same
  // bookOpenAnimationRef safety pattern as triggerBookOpen: reset both
  // bookOpenAnim and bookIntakeGlowAnim unconditionally before starting.
  // holdOpen: true for the final winning tile of a boss gauntlet — opens
  // and stays open instead of closing again, so the Mastered slam
  // (triggerBossOutcomeSlam, fired ~200ms later once useBoardMechanics
  // resolves mastery) continues the cover from where this pulse left it
  // instead of closing here and reopening there — the double-close/reopen
  // bug this parameter exists to fix. The glow still fades on its own
  // timing either way; only the cover's own close leg is skipped.
  function triggerGauntletPulse(holdOpen = false) {
    bookOpenAnimationRef.current?.stop();
    bookOpenAnim.stopAnimation();
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.stopAnimation();
    bookIntakeGlowAnim.setValue(0);
    if (reduceMotion) {
      if (holdOpen) bookOpenAnim.setValue(1);
      return;
    }
    const glow = Animated.sequence([
      Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(220),
      Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    bookOpenAnimationRef.current = holdOpen
      ? Animated.parallel([
          Animated.timing(bookOpenAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          glow,
        ])
      : Animated.parallel([
          Animated.sequence([
            Animated.timing(bookOpenAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.delay(220),
            Animated.timing(bookOpenAnim, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          ]),
          glow,
        ]);
    bookOpenAnimationRef.current.start();
  }

  // ── boss outcome slam ────────────────────────────────────────
  // Boss-only. Drives the SAME coverRotateX channel the per-tile intake
  // pulse already uses, through the full 0↔1 range (front-facing → ~65deg
  // edge-on, HeroBook's own tested ceiling — never past it, see
  // hero-book-rig-v1/README.md).
  //
  // Mastered: the cover is normally ALREADY at 1 by the time this fires —
  // triggerGauntletPulse(true) opened it and held, for the final winning
  // gauntlet tile — so the first leg below is a hold, not a fresh open, and
  // the whole thing reads as one continuous "open → transform → close",
  // never a second close/reopen. (The one exception, resuming straight
  // into an already-decided boss mastery with no live gauntlet played,
  // starts that same leg from bookOpenAnim's untouched 0 and it genuinely
  // opens — still exactly one motion.) Haunted has no such pulse and
  // always starts from closed.
  //
  // The rig swap (bookVariant) fires mid-sequence, timed to land under
  // cover of whichever flash/haze this outcome already drives (GoldFlash's
  // 65ms attack for mastered; the book-local drain haze for haunted) —
  // "concealed swap during the impact/cover transition" per spec, not a
  // bare cut. Not device-confirmed; spot-check the conceal timing and the
  // hold-then-close read before trusting either further.
  function triggerBossOutcomeSlam(outcome: 'mastered' | 'haunted') {
    bookOpenAnimationRef.current?.stop();
    bookOpenAnim.stopAnimation();
    bookIntakeGlowAnim.stopAnimation();
    bookIntakeGlowAnim.setValue(0);
    if (outcome === 'haunted') {
      // Haunted never has an open-hold pulse before it (a wrong swipe never
      // calls triggerGauntletPulse) — it always starts from closed, exactly
      // as before this patch.
      bookOpenAnim.setValue(0);
      bookGhostDrainOpacity.setValue(0);
    }
    // Mastered deliberately does NOT reset bookOpenAnim here. The final
    // winning gauntlet tile's pulse (triggerGauntletPulse(true), called
    // from onGauntletCorrect) already opened the cover and held it at 1 —
    // resetting to 0 and re-animating open here was exactly the
    // close→reopen→close bug this patch fixes. The one other caller
    // (resuming directly into an already-decided boss mastery, no live
    // gauntlet ever played) leaves bookOpenAnim at its untouched initial
    // 0, so the same toValue:1 leg below still reads as a genuine open.

    if (reduceMotion) {
      if (outcome === 'mastered') bookOpenAnim.setValue(0);
      // bossHeadwordColor (the render's precomputed interpolation) tracks
      // bookVariant directly — no separate opacity/timing to drive here.
      setBookVariant(outcome);
      return;
    }

    if (outcome === 'mastered') {
      // Lands with the gold rig, not the slam's end — same beat the rig
      // itself becomes visible, per spec. bossHeadwordColor picks up the
      // new bookVariant on the very next render; no separate fade to drive.
      setTimeout(() => setBookVariant('mastered'), MASTERED_SWAP_AT_MS);
      bookOpenAnimationRef.current = Animated.parallel([
        Animated.sequence([
          Animated.timing(bookOpenAnim, { toValue: 1, duration: MASTERED_IMPACT_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bookOpenAnim, { toValue: 0.08, duration: MASTERED_RECOIL_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }), // was 0.06 — a touch more visible bounce for "weight"
          Animated.timing(bookOpenAnim, { toValue: 0, duration: MASTERED_SETTLE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      ]);
    } else {
      // Lands with the gray rig, not the slam's end — same beat the rig
      // itself becomes visible, mirroring the mastered path above.
      setTimeout(() => setBookVariant('haunted'), HAUNTED_SWAP_AT_MS);
      bookOpenAnimationRef.current = Animated.parallel([
        Animated.sequence([
          Animated.timing(bookOpenAnim, { toValue: 1, duration: HAUNTED_DRAG_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bookOpenAnim, { toValue: 0, duration: HAUNTED_SETTLE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(bookGhostDrainOpacity, { toValue: 0.55, duration: HAUNTED_DRAG_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]);
    }
    bookOpenAnimationRef.current.start();
  }

  const [bossReady, setBossReady]             = useState(!isBoss);
  const [tilesReady, setTilesReady]           = useState(false);
  const [openingCardLanded, setOpeningCardLanded] = useState(false);
  const openingDecisionReleasedRef = useRef(false);
  // Held beat between the close-beat finishing and the outcome card
  // appearing — mirrors ResultsScreen's verdict-then-detail stagger.
  const [showOutcomeCard, setShowOutcomeCard] = useState(false);

  // ── haunt entrance ────────────────────────────────────────────
  const [hauntReady, setHauntReady]           = useState(!isHaunt);
  const [hauntBannerVisible, setHauntBannerVisible] = useState(false);
  const [stillHauntedVisible, setStillHauntedVisible] = useState(false);
  const wordHauntTintOpacity = useRef(new Animated.Value(0)).current;
  const hauntBannerOpacity   = useRef(new Animated.Value(0)).current;
  const stillHauntedOpacity  = useRef(new Animated.Value(0)).current;
  const stillHauntedScale    = useRef(new Animated.Value(0.7)).current;
  const hauntEntranceStingKeyRef = useRef<string | null>(null);

  const tileRefs = useRef(new Map<string, React.RefObject<View | null>>());

  function getTileRef(maskId: string): React.Ref<View> {
    if (!tileRefs.current.has(maskId)) {
      tileRefs.current.set(maskId, React.createRef<View | null>());
    }
    return tileRefs.current.get(maskId) as React.Ref<View>;
  }


  function handleEffect(type: 'shard' | 'trail', pageX: number, pageY: number) {
    if (type === 'shard') {
      spawnEffect?.('shard', pageX, pageY, 'trap');
    } else {
      spawnEffect?.(type, pageX, pageY);
    }
  }

  // ── master gate (face-only) ─────────────────────────────────────

  // Mastered celebration
  const masterHeroScale      = useRef(new Animated.Value(1)).current;
  const masterHeroTransY     = useRef(new Animated.Value(0)).current;
  const masterAllFadeAnim    = useRef(new Animated.Value(1)).current;
  // Phase-based mastery sequence
  const goldSeedScale        = useRef(new Animated.Value(0)).current;
  const goldSeedTransY       = useRef(new Animated.Value(0)).current;
  const goldSeedTransX       = useRef(new Animated.Value(0)).current;
  const goldSeedRotate       = useRef(new Animated.Value(0)).current;
  const goldSeedTrailOpacity = useRef(new Animated.Value(0)).current;
  const goldBloomScale       = useRef(new Animated.Value(1)).current;
  const goldBloomOpacity     = useRef(new Animated.Value(0)).current;
  const masterCrackOpacity   = useRef(new Animated.Value(0)).current;
  const masterCoreOpacity    = useRef(new Animated.Value(0)).current;
  const systemStingerOpacity = useRef(new Animated.Value(0)).current;
  const systemStingerScale   = useRef(new Animated.Value(0.75)).current;
  const [masterStampVisible, setMasterStampVisible]   = useState(false);
  const [sealReady, setSealReady]                       = useState(false);
  const [goldSeedVisible, setGoldSeedVisible]           = useState(false);
  const [goldBloomVisible, setGoldBloomVisible]         = useState(false);
  const [masterCracksVisible, setMasterCracksVisible]   = useState(false);
  const [systemStingerWord, setSystemStingerWord]       = useState<string | null>(null);
  // Bumped each time the boss gauntlet begins so BossGauntletStack remounts
  // and replays its throw-in (relevant for Returning Haunt retries within
  // the same session).
  const [gauntletThrowKey, setGauntletThrowKey]         = useState(0);

  const showBoardContent = (!isBoss || bossReady) && tilesReady && (!isHaunt || hauntReady);

  // Swipe cues quiet down after round 3, but never disappear for good — a
  // full fade-to-zero re-imposed the grammar-recall tax on every session
  // after the first few rounds, every run.
  useEffect(() => {
    if (gameStepIndex >= 3) {
      Animated.timing(cueOpacityAnim, {
        toValue: 0.38,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [gameStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    tileBreatheAmount.stopAnimation();
    if (reduceMotion) {
      tileBreatheAmount.setValue(0);
      return;
    }
    Animated.timing(tileBreatheAmount, {
      toValue: tension === 3 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [tension, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  function playSystemStingerWord(word: string, peakScale: number) {
    setSystemStingerWord(word);
    systemStingerOpacity.setValue(0);
    systemStingerScale.setValue(reduceMotion ? 1 : 0.75);
    if (reduceMotion) {
      Animated.sequence([
        Animated.timing(systemStingerOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(systemStingerOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    Animated.sequence([
      Animated.parallel([
        Animated.timing(systemStingerOpacity, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.spring(systemStingerScale, { toValue: peakScale, damping: 5, stiffness: 320, useNativeDriver: true }),
      ]),
      Animated.timing(systemStingerOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // ── mechanics (brain) ───────────────────────────────────────────
  // Every perform.* callback below is the FACE half of a function that used
  // to live directly in this component — see useBoardMechanics.ts for the
  // BRAIN half and how the two are stitched back together.
  const mechanics = useBoardMechanics({
    step,
    firePollyEvent,
    perform: {
      onRealClaimed({ mask, tier }) {
        playSfx('correctClaim', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.cueAsync(step.hapticTier === 'light' ? 'standardCorrect' : 'heightenedCorrect');
        // Not fired directly — handleCardTouch fires it at actual arrival,
        // synced with triggerBookOpen (see pendingAbsorbPhraseRef).
        pendingAbsorbPhraseRef.current = mask.phrase;
      },
      onTrapRejected({ tier }) {
        playSfx('trapShatter', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.cueAsync(step.hapticTier === 'light' ? 'standardCorrect' : 'heightenedCorrect');
      },
      onWrongSwipe({ brokeRealChain }) {
        performWrongSwipeFeedback(brokeRealChain);
      },
      onGauntletCorrect({ swipedUp, phrase }) {
        playSfx(swipedUp ? 'correctClaim' : 'trapShatter');
        Haptics.cueAsync('bossCorrect');
        // gauntletCorrectCount in the store hasn't incremented for this
        // tile yet (resolveGauntletTile calls this callback before it calls
        // incrementGauntletCorrectCount) — same for mechanics.finalTileStates,
        // so counting its prior entries and adding this tile gives the
        // correct ordinal without an off-by-one. A gauntlet-ending tile on
        // a non-boss Haunt rematch keeps its original second pulse. Boss
        // final tiles keep only their immediate decision Heavy here; the
        // next physical Heavy belongs to the book slam.
        const priorCorrect = Array.from(mechanics.finalTileStates.values())
          .filter(s => s === 'correct' || s === 'trap-caught').length;
        const isFinalGauntletTile = priorCorrect + 1 >= mechanics.gauntletTiles.length;
        // Boss's final winning tile (accepted REAL or correctly-rejected
        // trap alike) hands straight into the Mastered slam — hold the
        // cover open instead of letting this pulse close it first. Every
        // other tile (non-final, or the single-tile non-boss Haunt-rematch
        // gauntlet) keeps the original open-then-close pulse.
        triggerGauntletPulse(isBoss && isFinalGauntletTile);
        onGoldFlash?.('gauntletCorrect');
        if (isFinalGauntletTile && !isBoss) {
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
        }
        if (swipedUp) triggerAbsorption(phrase);
      },
      onGauntletTileDrop() {
        // No longer drives any visible animation — BossGauntletStack owns
        // the card's own motion now. This timer only stands in for the old
        // spring's settle time (damping: 13, stiffness: 150) so
        // onGauntletTileLanded still fires on roughly the same beat.
        setTimeout(() => {
          mechanics.onGauntletTileLanded();
        }, 280);
      },
      onGauntletBegin() {
        if (isBoss) warmBossOutcomeSfx();
        setGauntletThrowKey(k => k + 1);
        Haptics.cueAsync('gauntletBegin');
      },
      onWordExit(perfect) {
        // Stop any prior per-tile flick animation and reset both values it
        // drives to their rest state, unconditionally — triggerBookOpen may
        // have fired on any tile in this round on either the perfect or
        // imperfect path, and both bookOpenAnim and bookIntakeGlowAnim need
        // to return to 0 before anything else touches them.
        bookOpenAnimationRef.current?.stop();
        bookOpenAnim.stopAnimation();
        bookOpenAnim.setValue(0);
        bookIntakeGlowAnim.stopAnimation();
        bookIntakeGlowAnim.setValue(0);

        if (perfect) {
          // Round clear pulses the book's own glow harder and longer than
          // the 120ms per-tile flick (triggerBookOpen) — a full round
          // reads as more than one tile landing, using the same prop.
          Animated.sequence([
            Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]).start();
        }
        playSfx('bookClose');
        if (reduceMotion) {
          bookSlideX.setValue(-SCREEN_WIDTH);
        } else {
          Animated.timing(bookSlideX, {
            toValue: -SCREEN_WIDTH,
            duration: isBoss ? 380 : 280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }).start();
        }
      },
      onMasteredSequence({ isBoss: bossOutcome, isHaunt: hauntOutcome }) {
        const bossFeedback = bossOutcome
          ? resolveBossOutcomeSequenceFeedback('mastered')
          : null;
        if (bossFeedback) {
          setBossOutcomeMusicDucked(true);
          playSfx(bossFeedback.startSfx);
        }
        // `!isBoss` here can only mean isHaunt (onMasteredSequence is only
        // ever invoked when isFinalGateStep — isBoss || isHaunt — is true,
        // see the completion-check effect above). The old 12-phase Haunt-mastery
        // sequence that used to live here is unreachable; removed rather than left
        // as dead code a future edit could waste time modifying.
        // ── One decisive beat, boss or Haunt rematch alike.
        onGoldFlash?.('mastery');
        // Boss only, from here — the gold rig slam. The Haunt-rematch banish
        // beat below (isBoss false) is untouched: it keeps the neutral rig
        // and the original tiny-recoil close.
        if (bossFeedback) {
          setTimeout(() => {
            if (bossFeedback.impact.sfx) playSfx(bossFeedback.impact.sfx);
            Haptics.cueAsync(bossFeedback.impact.hapticCue);
          }, bossFeedback.impact.delayMs);
          triggerBossOutcomeSlam('mastered');
          return;
        }
        playSfx('bookClose');
        Haptics.cueAsync('mastery');
        // Cancel any in-flight composite (e.g. a gauntlet pulse parked in
        // its Animated.delay) before driving these shared values directly —
        // otherwise its queued final leg fires later and fights this beat.
        // Reset to a known 0 rather than leaving stopAnimation()'s frozen
        // mid-flight value as the start point — triggerGauntletPulse from the
        // just-resolved 3rd gauntlet tile can still be mid-cycle here, and
        // starting this sequence from an arbitrary in-between value made its
        // timing unpredictable.
        bookOpenAnimationRef.current?.stop();
        bookOpenAnim.stopAnimation();
        bookIntakeGlowAnim.stopAnimation();
        bookOpenAnim.setValue(0);
        bookIntakeGlowAnim.setValue(0);
        if (reduceMotion) return;
        bookOpenAnimationRef.current = Animated.parallel([
          // Explicit chained legs, not a spring — a spring here read as an
          // under-damped blink/pulse on device instead of a single clean
          // snap. Snap-to-shut, a tiny recoil settle, then rest.
          //
          // The first leg used to target -0.04 (a small overshoot PAST fully
          // shut) rather than 0. bookOpenAnim never goes negative anywhere
          // else in the app; that negative value was the only thing that
          // ever drove HeroBook's coverRotateX below 0deg, and its two cover
          // faces (coverOuter/coverInner) both use backfaceVisibility:
          // 'hidden' — a combination that's flaky on RN once rotateX crosses
          // zero, which read on device as the cover flickering out and back.
          // Targeting 0 keeps the decisive snap without ever crossing zero.
          Animated.sequence([
            Animated.timing(bookOpenAnim, {
              toValue: 0,
              duration: PW.motion.heroBook.overshootMs,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bookOpenAnim, {
              toValue: 0.02, // tiny recoil settle, proportional to heroBook's settleAngle/openAngle ratio
              duration: PW.motion.heroBook.settleMs,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bookOpenAnim, {
              toValue: 0,
              duration: PW.motion.heroBook.settleMs,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 360, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
        ]);
        bookOpenAnimationRef.current.start();
      },
      onHauntedSequence({ isHaunt: hauntFail, failedMaskId }) {
        if (hauntFail) {
        // ── Returning Haunt path — existing STILL HAUNTED sequence, unchanged ──
        void failedMaskId;
        setTimeout(() => {
          setStillHauntedVisible(true);
          stillHauntedOpacity.setValue(0);
          stillHauntedScale.setValue(reduceMotion ? 1 : 0.7);
          if (reduceMotion) {
            Animated.timing(stillHauntedOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
          } else {
            Animated.parallel([
              Animated.timing(stillHauntedOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
              Animated.spring(stillHauntedScale, { toValue: 1.0, damping: 7, stiffness: 280, useNativeDriver: true }),
            ]).start();
          }
          setTimeout(() => {
            Animated.timing(stillHauntedOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
            setTimeout(() => setStillHauntedVisible(false), 240);
          }, 1400);
        }, 400);
        return;
        }
        if (!isBoss) return;
        // ── Boss path — the gray rig slam. Same shape of beat as the master
        // close (one decisive motion) but a different physical quality: the
        // mastered close is a punchy impact with bounce-settle, this is a
        // slower drag with no overshoot. No flash, no stamp: colour drains,
        // it does not travel.
        const bossFeedback = resolveBossOutcomeSequenceFeedback('haunted');
        setBossOutcomeMusicDucked(true);
        playSfx(bossFeedback.startSfx);
        setTimeout(() => {
          if (bossFeedback.impact.sfx) playSfx(bossFeedback.impact.sfx);
          Haptics.cueAsync(bossFeedback.impact.hapticCue);
          if (bossFeedback.impact.boardShake) triggerBoardShake();
        }, bossFeedback.impact.delayMs);
        triggerBossOutcomeSlam('haunted');
      },
      onOutcomeReveal(outcome) {
        if (!isBoss) playSfx(resolveOutcomeRevealSfx(outcome));
        setShowOutcomeCard(false);
        setTimeout(() => setShowOutcomeCard(true), 350);
      },
      onLivesDepleted() {
        Animated.timing(deckRedTint, {
          toValue: 1, duration: 300, useNativeDriver: false,
        }).start();
      },
    },
  });

  useEffect(() => {
    const outcome = mechanics.wordOutcome;
    if (!isBoss || !showOutcomeCard || outcome === 'none') return;
    const feedback = resolveBossOutcomePlaqueFeedback(outcome);
    if (feedback.sfx) playSfx(feedback.sfx);
    if (feedback.hapticCue) Haptics.cueAsync(feedback.hapticCue);
  }, [isBoss, mechanics.wordOutcome, showOutcomeCard]);

  useEffect(() => {
    if (!isBoss) return;
    return () => setBossOutcomeMusicDucked(false);
  }, [isBoss]);

  function continueOutcome() {
    if (isBoss) setBossOutcomeMusicDucked(false);
    mechanics.continueOutcome();
  }

  const activeTopMaskId = mechanics.topMask?.id ?? null;
  activeTopMaskIdRef.current = activeTopMaskId;

  useEffect(() => {
    if (!shouldReleaseOpeningDecision({
      cardLanded: openingCardLanded,
      boardVisible: showBoardContent,
      alreadyReleased: openingDecisionReleasedRef.current,
    })) return;

    openingDecisionReleasedRef.current = true;
    mechanics.onDecisionReady();
    if (isBoss) onBossDecisionReady?.();
  }, [openingCardLanded, showBoardContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // The keyed measurement belongs only to the current top mask. An identity
  // mismatch synchronously renders the 152px minimum, so a long prior card
  // can never flash its stale height while the next card is being measured.
  const activeTileHeight = activeTileLayout.maskId === activeTopMaskId
    ? activeTileLayout.height
    : TILE_H;
  const cueLayoutIdentity = `${activeTopMaskId ?? 'none'}:${gridViewportWidth}:${fontScale}`;
  cueLayoutIdentityRef.current = cueLayoutIdentity;
  const activeCueMeasurements = cueTextMeasurements.identity === cueLayoutIdentity
    ? cueTextMeasurements
    : { upHeight: 0, rightHeight: 0 };

  useEffect(() => {
    if (mechanics.visibleGridMasks.length > 0) {
      setTilesReady(true);
    }
  }, [mechanics.visibleGridMasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const newTopId = mechanics.remainingMaskIds[0] ?? null;
    if (newTopId && newTopId !== prevTopIdRef.current) {
      prevTopIdRef.current = newTopId;
      cardPopCountRef.current += 1;
      if (cardPopCountRef.current > 1) {
        if (reduceMotion) {
          cardPopY.setValue(0);
          Haptics.selectionAsync();
          mechanics.onDecisionReady();
          return;
        }
        cardPopY.setValue(DECK_BACKING_OFFSET);
        Animated.timing(cardPopY, {
          toValue: 0,
          duration: 180,
          easing: CARD_SNAP,
          useNativeDriver: true,
        }).start(() => {
          Haptics.selectionAsync();
          mechanics.onDecisionReady();
        });
      }
    }
  }, [mechanics.remainingMaskIds, reduceMotion]);

  const backingCardCount = mechanics.topMask
    ? Math.min(MAX_DECK_BACKING_CARDS, Math.max(0, mechanics.deckSize - 1))
    : 0;
  const backingCardWidth = Math.min(Math.max(containerWidth - 80, 0), 290);

  useEffect(() => {
    const backingIds = mechanics.remainingMaskIds.slice(1, 1 + backingCardCount).reverse();
    backingIds.forEach((maskId, index) => {
      const depth = backingCardCount - index;
      const anim = getBackingCardAnim(maskId, depth);
      if (reduceMotion) {
        anim.depthY.setValue(depth * DECK_BACKING_OFFSET);
        anim.scale.setValue(1 - depth * 0.01);
        anim.rotate.setValue(depth * -1.3);
      } else {
        Animated.timing(anim.depthY, { toValue: depth * DECK_BACKING_OFFSET, duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
        Animated.timing(anim.scale,  { toValue: 1 - depth * 0.01,            duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
        Animated.timing(anim.rotate, { toValue: depth * -1.3,                duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
      }
    });
    // Garbage-collect cards that have left the deck entirely (claimed,
    // rejected, or judged wrong) so the map doesn't grow across a round.
    const liveIds = new Set(mechanics.remainingMaskIds);
    backingCardAnimsRef.forEach((_, maskId) => {
      if (!liveIds.has(maskId)) backingCardAnimsRef.delete(maskId);
    });
  }, [mechanics.remainingMaskIds, backingCardCount, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polly reactive triggers not tied to a presentation animation move to
  // useBoardMechanics; oneWrongMove stays wired here only through
  // perform.onLivesDepleted above, so the deck's red-tint reaction and its
  // Polly event share one trigger condition.

  // Reset guards and animated values on new word
  useEffect(() => {
    cardPopY.setValue(0);
    openingDecisionReleasedRef.current = false;
    setOpeningCardLanded(false);
    // The remaining-mask effect above has already observed the opening card
    // by the time this reset runs on mount. Preserve that identity explicitly
    // so card 2 is treated as a real deck advance and fires onDecisionReady;
    // resetting to null/0 left every card after the opener input-locked.
    const openingMaskId = mechanics.remainingMaskIds[0] ?? null;
    prevTopIdRef.current = openingMaskId;
    cardPopCountRef.current = openingMaskId ? 1 : 0;
    deckRedTint.setValue(0);
    deckSlamY.setValue(0);  // outer wrapper stays static
    const cardDelay = isBoss ? 1200 : 80;

    // Reset all card values
    [deckDeepY, deckMidY, deckActiveY].forEach(v => v.setValue(400));
    deckBackingY.setValue(28);
    deckBackingOp.setValue(0);
    deckDeepRot.setValue(-4); deckMidRot.setValue(3); deckActiveRot.setValue(-2);
    [deckDeepOp, deckMidOp, deckActiveOp].forEach(v => v.setValue(0));

    // Deep card (back) — arrives first. Timing/haptic sequencing is kept
    // even under Reduce Motion (it's pacing, not visual movement); only the
    // Animated.timing tweens are swapped for an instant snap to end value.
    const slamTimer = setTimeout(() => {
      if (reduceMotion) {
        deckBackingY.setValue(0);
        deckBackingOp.setValue(1);
        deckDeepY.setValue(0);
        deckDeepRot.setValue(0);
        deckDeepOp.setValue(1);
      } else {
        Animated.parallel([
          Animated.timing(deckBackingY, { toValue: 0, duration: 220, easing: CARD_DEAL, useNativeDriver: true }),
          Animated.timing(deckBackingOp, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(deckDeepY,  { toValue: 0, duration: 210, easing: CARD_DEAL, useNativeDriver: true }),
          Animated.timing(deckDeepRot,{ toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(deckDeepOp, { toValue: 1, duration: 100,  useNativeDriver: true }),
        ]).start();
      }

      // Mid card — 90ms after deep
      setTimeout(() => {
        if (reduceMotion) {
          deckMidY.setValue(0);
          deckMidRot.setValue(0);
          deckMidOp.setValue(1);
        } else {
          Animated.parallel([
            Animated.timing(deckMidY,  { toValue: 0, duration: 190, easing: CARD_DEAL, useNativeDriver: true }),
            Animated.timing(deckMidRot,{ toValue: 0, duration: 190, useNativeDriver: true }),
            Animated.timing(deckMidOp, { toValue: 1, duration: 80,  useNativeDriver: true }),
          ]).start();
        }
      }, 70);

      // Active card — 180ms after deep, heaviest haptic on land
      setTimeout(() => {
        function onActiveCardLanded() {
          const deckEntranceKey = `${gameStepIndex}:${step.word}`;
          if (deckEntranceHapticRef.current !== deckEntranceKey) {
            deckEntranceHapticRef.current = deckEntranceKey;
            Haptics.selectionAsync();
          }
          setOpeningCardLanded(true);
        }

        if (reduceMotion) {
          deckActiveY.setValue(0);
          deckActiveRot.setValue(0);
          deckActiveOp.setValue(1);
          onActiveCardLanded();
        } else {
          Animated.parallel([
            Animated.sequence([
              Animated.timing(deckActiveY, { toValue: -6, duration: 130, easing: CARD_SNAP, useNativeDriver: true }),
              Animated.timing(deckActiveY, { toValue: 0, duration: 90, useNativeDriver: true }),
            ]),
            Animated.timing(deckActiveRot,{ toValue: 0, duration: 160, useNativeDriver: true }),
            Animated.timing(deckActiveOp, { toValue: 1, duration: 80,  useNativeDriver: true }),
          ]).start(onActiveCardLanded);
        }
      }, 120);
    }, cardDelay);
    wordEntryTilt.setValue(0);
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.setValue(0);
    bookGhostDrainOpacity.setValue(0);
    bookSlideX.setValue(SCREEN_WIDTH);

    if (isBoss || reduceMotion) {
      bookSlideX.setValue(0);
    } else {
      // Normal words keep the existing book entrance.
      Animated.spring(bookSlideX, {
        toValue: 0,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }

    // Boss word rides the book cover — already visible & in position; drama fires on top
    if (isBoss) {
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);
      wordLockPulse.setValue(1);
    }
    wordRecoilY.setValue(0);
    wordRecoilScale.setValue(1);
    wordRedOpacity.setValue(0);

    // Gate reset (face-only — brain state is fresh via the hook's own
    // per-mount initializers, since MaskBoard remounts per word)
    setMasterStampVisible(false);
    setSealReady(false);
    masterHeroScale.setValue(1);
    masterHeroTransY.setValue(0);
    masterAllFadeAnim.setValue(1);
    goldSeedScale.setValue(0);
    goldSeedTransY.setValue(0);
    goldSeedTransX.setValue(0);
    goldSeedRotate.setValue(0);
    goldSeedTrailOpacity.setValue(0);
    goldBloomScale.setValue(1);
    goldBloomOpacity.setValue(0);
    masterCrackOpacity.setValue(0);
    masterCoreOpacity.setValue(0);
    systemStingerOpacity.setValue(0);
    systemStingerScale.setValue(0.75);
    setGoldSeedVisible(false);
    setGoldBloomVisible(false);
    setMasterCracksVisible(false);
    setSystemStingerWord(null);

    // Haunt resets
    setHauntReady(!isHaunt);
    setHauntBannerVisible(false);
    setStillHauntedVisible(false);
    wordHauntTintOpacity.setValue(0);
    hauntBannerOpacity.setValue(0);
    stillHauntedOpacity.setValue(0);
    stillHauntedScale.setValue(0.7);
    return () => clearTimeout(slamTimer);
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word title fade + scale in (non-boss)
  useEffect(() => {
    if (isBoss) return;
    wordEntryOpacity.setValue(0);
    wordEntryScale.setValue(0.85);
    wordEntryTranslateY.setValue(0);
    wordEntryTilt.setValue(0);
    wordLockPulse.setValue(1);

    if (isHaunt) {
      const hauntEntranceKey = `${gameStepIndex}:${step.word}`;
      if (hauntEntranceStingKeyRef.current !== hauntEntranceKey) {
        hauntEntranceStingKeyRef.current = hauntEntranceKey;
        playSfx('detectiveSting');
      }

      // Haunt entrance: double haptic + purple word tint + banner
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 180);

      wordHauntTintOpacity.setValue(0.75);
      // Word already visible on cover — book slide handles reveal
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);
      Animated.timing(wordHauntTintOpacity, { toValue: 0, duration: 800, useNativeDriver: true }).start();

      setHauntBannerVisible(true);
      hauntBannerOpacity.setValue(0);
      Animated.timing(hauntBannerOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(hauntBannerOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }, 1200);
      setTimeout(() => {
        setHauntBannerVisible(false);
        setHauntReady(true);
      }, 1400);
    } else {
      // Word is already on the cover — book slide is the reveal.
      wordEntryOpacity.setValue(1);
      wordEntryScale.setValue(1);
      wordEntryTranslateY.setValue(0);
      wordEntryTilt.setValue(0);
      wordLockPulse.setValue(1);

      // Subtle lock pulse fires after spring settles
      setTimeout(() => {
        if (wordEntranceHapticRef.current !== step.word) {
          wordEntranceHapticRef.current = step.word;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        if (reduceMotion) {
          wordLockPulse.setValue(1.00);
          return;
        }
        Animated.sequence([
          Animated.timing(wordLockPulse, {
            toValue: 1.025, duration: 90, useNativeDriver: true,
          }),
          Animated.timing(wordLockPulse, {
            toValue: 1.00, duration: 110, useNativeDriver: true,
          }),
        ]).start();
      }, 380);
    }
    firePollyEvent('wordEntry');
  }, [step.word]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ghost Polly trigger
  useEffect(() => {
    if (mechanics.ghost) firePollyEvent('ghostEntry');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Boss V1 entrance: stable hero word, then reveal the real tile stack.
  useEffect(() => {
    if (!isBoss) return;

    const impactTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerBoardShake();
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 260);
    }, 400);

    const readyTimer = setTimeout(() => {
      firePollyEvent('bossEntry');
      setBossReady(true);
    }, 1200);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(readyTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // ── render ────────────────────────────────────────────────────
  const wordCoreRotate = goldSeedRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });
  const masteryWordCenterY = Math.max(170, Dimensions.get('window').height * 0.48);
  const vaultBloomX = Math.max(28, containerWidth - 86);

  const deckActiveRotDeg = deckActiveRot.interpolate({ inputRange: [-4, 0, 4], outputRange: ['-4deg', '0deg', '4deg'] });
  const wordEntryTiltDeg = wordEntryTilt.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '0deg', '5deg'] });
  const bookIntakeRotateX = bookOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '65deg'],
    // Clamped: bookOpenAnim should never go negative (nothing animates it
    // below 0 anymore), but HeroBook's cover faces use backfaceVisibility:
    // 'hidden', which flickers on RN once rotateX crosses zero — clamp is a
    // defensive floor against ever rendering a negative angle here again.
    extrapolateLeft: 'clamp',
  });
  const bookIntakeGlowScale = bookOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
    extrapolateLeft: 'clamp', // this one must not go below 0.86 on overshoot
  });

  // Boss's single headword text node's color. Persistent base tracks
  // bookVariant (matches styles.wordBoss's own '#F5C842' for neutral, so
  // switching a word from static color to this interpolation is a no-op
  // until bookVariant actually changes); wordRedOpacity — already driven
  // 0→0.4→0 by triggerWrongWordRecoil's RAF loop, unchanged — mixes toward
  // wrong-red on top of whichever base is current. inputRange [0,1] (not
  // [0,0.4]) is deliberate: wordRedOpacity's real runtime ceiling is 0.4,
  // so at that peak this reads as a 40% mix toward red, matching the old
  // overlay's 0.4 peak opacity instead of flashing full solid red.
  const bossHeadwordBaseColor = bookVariant === 'mastered'
    ? PW.color.purple
    : bookVariant === 'haunted'
      ? PW.color.bg
      : PW.color.gold;
  const bossHeadwordColor = wordRedOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [bossHeadwordBaseColor, PW.color.wrong],
    extrapolate: 'clamp',
  });

  // Resuming directly into an already-haunted boss word sets gatePhase to
  // 'wrongFail' with no gauntlet tiles ever built (there's nothing left to
  // judge) — without the length guard this briefly mounts an empty
  // "0/0" gauntlet before the outcome overlay covers it.
  const showGauntletCard =
    mechanics.gatePhase === 'tiles' ||
    (mechanics.gatePhase === 'wrongFail' && mechanics.gauntletTiles.length > 0);
  const showSwipeCues =
    showBoardContent &&
    mechanics.gatePhase !== 'tiles' &&
    mechanics.gatePhase !== 'wrongFail' &&
    mechanics.topMask !== null;
  const activeCueLayout = resolveActiveCueLayout(
    activeTileHeight,
    activeCueMeasurements.upHeight,
    activeCueMeasurements.rightHeight,
  );
  // No showGauntletCard branch here: BossGauntletSpines now renders as an
  // absolutely-positioned overlay OUTSIDE this ScrollView's content (see
  // below), so during the gauntlet phase this scrolling region has no
  // deck/topMask content and no swipe cues either — reserving gauntlet-sized
  // space for it here was vestigial and could make an otherwise-empty
  // scroll region behave as if it had overflow.
  const ownedGridRegionHeight = showSwipeCues
    ? activeCueLayout.ownedRegionHeight
    : activeTileHeight + 48;
  const boardSpacing = resolveBoardVerticalSpacing(
    gridViewportHeight,
    ownedGridRegionHeight,
    0,
  );
  const gridHasVerticalOverflow = hasBoardVerticalOverflow(
    gridViewportHeight,
    gridContentHeight,
  );
  const gridPaddingTop = Math.max(
    0,
    boardSpacing.gridPaddingTop - (showSwipeCues ? activeCueLayout.leadingCueRegionHeight : 0),
  );

  return (
    <Animated.View
      style={styles.container}
      ref={containerRef as any}
      onLayout={e => {
        const w = e.nativeEvent.layout.width;
        setContainerWidth(w);
        containerWidthRef.current = w;
      }}
    >
      <BookLight tension={tension} isBoss={isBoss} />

      {mechanics.kicker && (
        isBoss ? (
          // No wrap guard previously — at large system text sizes this
          // could wrap to a 2nd line and overlap the book below it (flagged
          // 2026-08-09, never fixed). Shrinks instead of wrapping.
          <Text
            style={styles.kickerBossFixed}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {mechanics.kicker}
          </Text>
        ) : (
          <Text style={styles.kickerFixed}>{mechanics.kicker}</Text>
        )
      )}

      {/* ── WORD ZONE — dominant upper arena ────────────────── */}
      <View
        style={[styles.wordZone, isBoss && styles.wordZoneBoss]}
        pointerEvents="none"
        ref={wordZoneRef as any}
        onLayout={e => {
          const zoneHeight = e.nativeEvent.layout.height;
          (wordZoneRef.current as any)?.measure(
            (_x: number, _y: number, _w: number, _h: number, _px: number, pageY: number) => {
              setWordScreenY(pageY + zoneHeight / 2);
              setWordZoneMeasured(true);
            }
          );
        }}
      >

        {/* Book slide wrapper — entire book (shadow, pages, intake, cover) slides in/out as one unit.
            absoluteFill keeps the absolutely-positioned book children aligned to the word zone. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: Animated.add(bookSlideX, boardShakeX) },
              ],
            },
          ]}
        >
        {/* SVG Hero Book V5; MaskBoard retains the animated hero-word content. */}
        <HeroBook
          coverRotateX={bookIntakeRotateX}
          intakeOpacity={bookIntakeGlowAnim}
          intakeScaleY={bookIntakeGlowScale}
          variant={bookVariant}
        >

        {/* Outer wrapper: non-native recoil transforms (RAF-driven setValue) */}
        <Animated.View
          style={{
            transform: [
              { translateY: wordRecoilY },
              { scale: wordRecoilScale },
            ],
          }}
        >
          {/* Hero word transforms */}
          <Animated.View
            style={{
              opacity: mechanics.wordOutcome === 'none' ? wordEntryOpacity : 0,
              transform: [
                { scale: absorptionScale },
                { scale: wordEntryScale },
                { scale: wordLockPulse },
                { scale: masterHeroScale },
                { translateY: masterHeroTransY },
                { translateY: wordEntryTranslateY },
                { rotate: wordEntryTiltDeg },
              ],
            }}
          >
            {!isBoss ? (
              // numberOfLines explicitly 1: FoilWord's shared default (2)
              // exists as an Android undershoot fallback for other call
              // sites, but this banner has no room for a 2nd line — a long
              // word (e.g. SENTENCE) wrapping here spills its second line
              // out below the book entirely (confirmed on device
              // 2026-08-14). This restores the single-line config this
              // exact 96px recipe was originally device-confirmed against.
              <FoilWord
                word={step.word}
                baseStyle={styles.word}
                fontSize={96}
                minimumFontScale={0.72}
                numberOfLines={1}
              />
            ) : (
              // Exactly one text node for the boss headword — previously a
              // static Text plus up to 4 stacked Animated.Text overlays
              // (red/haunt-tint/mastered/haunted), each position:'absolute'
              // with left:0/right:0 (full word zone), a different box than
              // this node's own natural/100%-width fit feeds
              // adjustsFontSizeToFit than the base layer got — on a long
              // boss word that could shrink each layer a different amount
              // and read as misaligned doubled glyphs (reported 2026-08-15,
              // wordBoss's width:'100%' below narrowed but didn't remove
              // it). A single node removes the mismatch at the source:
              // bossHeadwordColor (computed above) carries the wrong-swipe
              // flash AND the mastered/haunted outcome color, so there is
              // nothing left to stack on top of it.
              <Animated.Text
                style={[styles.word, styles.wordBoss, { color: bossHeadwordColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Animated.Text>
            )}
            {/* Red flash overlay — wrong swipe danger signal. Non-boss only:
                boss folds this into bossHeadwordColor above instead of a
                second layer. */}
            {!isBoss && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  {
                    color: PW.color.wrong,
                    opacity: wordRedOpacity,
                    position: 'absolute',
                    left: 0, right: 0,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Animated.Text>
            )}

            {/* Haunt entrance purple tint — fades out as tiles appear.
                Non-boss only by construction: Returning Haunt and Polly's
                Word are different round slots (CLAUDE.md — a word is never
                both), but the isBoss guard here is a defensive belt so a
                boss word can never gain a second text node through this
                path even if that ever changed. */}
            {isHaunt && !isBoss && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  {
                    color: '#7B2D8B',
                    opacity: wordHauntTintOpacity,
                    position: 'absolute',
                    left: 0, right: 0,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Animated.Text>
            )}

            {/* Absorption ring */}
            <Animated.View
              pointerEvents="none"
              style={[styles.goldRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
          </Animated.View>
        </Animated.View>
        {/* CAUTION: this gate (wordOutcome === 'mastered') is also what mounts
            MasteredOutcomeOverlay elsewhere in this file — a full-screen scrim
            (zIndex 300, rgba(15,13,42,0.78)) that renders after the book in tree
            order. Once real art replaces bossOutcomeAssets.masterSeal, it will be
            covered by that scrim unless the gate changes to something that fires
            before the overlay mounts (e.g. mechanics.gatePhase === 'mastered',
            which flips earlier) or the render order changes. Untested today
            because masterSeal is null — do not assume this renders correctly
            once art lands without checking. */}
        {isBossStage && mechanics.wordOutcome === 'mastered' && bossOutcomeAssets.masterSeal && (
          <View pointerEvents="none" style={styles.bossMasterSeal}>
            <Image
              source={bossOutcomeAssets.masterSeal}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        )}
        </HeroBook>

        {/* Vault brand on spine — slides in with the book every round */}
        <Text
          pointerEvents="none"
          style={styles.vaultLabel}
        >
          POLYBOOK
        </Text>

        {/* Boss haunt only — colour drains from the book, it does not travel */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: libraryMaterial.ghostTint, opacity: bookGhostDrainOpacity }]} />
        </Animated.View>

        {/* Absorbed phrase flash */}
        {absorbedPhrase !== null && (
          <Animated.Text style={[styles.absorbedPhrase, { opacity: absorbedPhraseOpacity }]}>
            {absorbedPhrase}
          </Animated.Text>
        )}
      </View>

      {/* ── TILE ZONE ───────────────────────────────────────── */}
      <ScrollView
        style={styles.gridViewport}
        contentContainerStyle={[
          styles.gridWrap,
          {
            minHeight: ownedGridRegionHeight +
              gridPaddingTop + boardSpacing.gridPaddingBottom,
            paddingTop: gridPaddingTop,
            paddingBottom: boardSpacing.gridPaddingBottom,
          },
        ]}
        scrollEnabled={gridHasVerticalOverflow}
        showsVerticalScrollIndicator={gridHasVerticalOverflow}
        directionalLockEnabled
        removeClippedSubviews={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onLayout={event => {
          setGridViewportWidth(Math.ceil(event.nativeEvent.layout.width));
          setGridViewportHeight(Math.ceil(event.nativeEvent.layout.height));
        }}
        onContentSizeChange={(_width, height) => setGridContentHeight(Math.ceil(height))}
      >
        <View style={[styles.tileStackArea, { minHeight: ownedGridRegionHeight }]}>
          {showSwipeCues && (
            <Animated.View
              pointerEvents="none"
              style={[styles.swipeUpCueRegion, { opacity: cueOpacityAnim }]}
            >
              <Text
                key={`up-${cueLayoutIdentity}`}
                style={[styles.swipeCueText, styles.swipeUpCue]}
                onLayout={event => handleCueTextLayout('up', event.nativeEvent.layout.height)}
              >
                SWIPE UP TO CLAIM
              </Text>
            </Animated.View>
          )}
          {showBoardContent && (
          <Animated.View style={[styles.tileStack, { transform: [{ translateY: deckSlamY }] }]}>
            <Animated.View style={{ opacity: masterAllFadeAnim }}>
            {mechanics.gatePhase !== 'tiles' && mechanics.gatePhase !== 'wrongFail' && mechanics.topMask && (
              <View style={[styles.deckWrap, { minHeight: activeTileHeight + 18 }]}>
                {mechanics.remainingMaskIds.slice(1, 1 + backingCardCount).reverse().map((maskId, index) => {
                  const depth = backingCardCount - index;
                  const anim = getBackingCardAnim(maskId, depth);
                  const rotateDeg = anim.rotate.interpolate({ inputRange: [-6, 0], outputRange: ['-6deg', '0deg'] });
                  const backingMask = mechanics.visibleGridMasks.find(m => m.id === maskId);
                  return (
                    <Animated.View
                      key={maskId}
                      pointerEvents="none"
                      style={[
                        styles.deckBackingCard,
                        {
                          width: backingCardWidth,
                          opacity: deckBackingOp,
                          transform: [
                            { translateY: Animated.add(deckBackingY, anim.depthY) },
                            { scale: anim.scale },
                            { rotate: rotateDeg },
                          ],
                        },
                      ]}
                    >
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          { opacity: 1 - (depth - 1) * 0.12 },
                        ]}
                      >
                        <MaskCardArtwork />
                      </Animated.View>
                      {backingMask && (
                        <View style={styles.deckBackingPhrasePanel} pointerEvents="none">
                          <Text
                            style={styles.deckBackingPhrase}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {backingMask.phrase}
                          </Text>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
                {/* ── TOP CARD — interactive ── */}
                <Animated.View style={[
                  styles.deckActiveCardLayer,
                  {
                    transform: [
                      { translateY: deckActiveY },
                      { translateY: cardPopY },
                      { rotate: deckActiveRotDeg },
                      {
                        scale: Animated.add(
                          1,
                          Animated.multiply(
                            pulseAnim,
                            tileBreatheAmount.interpolate({ inputRange: [0, 1], outputRange: [0, 0.008] }),
                          ),
                        ),
                      },
                    ],
                    opacity: deckActiveOp,
                  },
                ]}>
                <View
                  ref={getTileRef(mechanics.topMask.id)}
                  style={[styles.deckTopCardSlot, { minHeight: activeTileHeight }]}
                >
                  <SwipeMask
                    key={mechanics.topMask.id}
                    mask={mechanics.topMask}
                    state={mechanics.tileStates.get(mechanics.topMask.id) ?? 'idle'}
                    onSwipeUp={() => mechanics.onSwipeUp(mechanics.topMask!.id)}
                    onSwipeDown={() => mechanics.onSwipeRight(mechanics.topMask!.id)}
                    onSwipeReveal={() => {}}
                    revealable={false}
                    disabled={mechanics.inputLocked}
                    tileHeight={TILE_H}
                    entryDelay={0}
                    skipEntryAnimation={
                      prevTopIdRef.current !== null && prevTopIdRef.current !== mechanics.topMask.id
                    }
                    onEffect={handleEffect}
                    onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
                    onPressHoldStart={() => playSfx('pressHoldStart')}
                    onExitComplete={() => {
                      mechanics.onTileExitComplete(mechanics.topMask!.id);
                    }}
                    onCardTouch={handleCardTouch}
                    onMeasuredHeightChange={handleActiveTileHeightChange}
                    wordY={wordZoneMeasured ? wordScreenY : undefined}
                    intakeY={wordZoneMeasured ? wordScreenY + 73 : undefined}
                  />
                </View>
                </Animated.View>
              </View>
            )}

            </Animated.View>
          </Animated.View>
          )}

          {showSwipeCues && (
            <Animated.View
              pointerEvents="none"
              style={[styles.swipeRightCueRegion, { opacity: cueOpacityAnim }]}
            >
              <Text
                key={`right-${cueLayoutIdentity}`}
                style={[styles.swipeCueText, styles.swipeRightCue]}
                onLayout={event => handleCueTextLayout('right', event.nativeEvent.layout.height)}
              >
                SWIPE RIGHT TO REJECT
              </Text>
            </Animated.View>
          )}

        </View>
      </ScrollView>

      {showGauntletCard && (
        <BossGauntletSpines
          key={gauntletThrowKey}
          gatePhase={mechanics.gatePhase}
          gauntletTiles={mechanics.gauntletTiles}
          finalTileStates={mechanics.finalTileStates}
          activeGauntletTile={mechanics.activeGauntletTile}
          tileLanded={mechanics.tileLanded}
          inputLocked={mechanics.inputLocked}
          onPick={(index) => {
            playSfx('gauntletPick');
            Haptics.cueAsync('gauntletPick');
            mechanics.pickGauntletTile(index);
          }}
          onSwipeUp={mechanics.onGauntletSwipeUp}
          onSwipeRight={mechanics.onGauntletSwipeRight}
          onEffect={handleEffect}
          onSwipeAttempt={onSwipeAttempt}
          onCardTouch={handleCardTouch}
          wordY={wordZoneMeasured ? wordScreenY : undefined}
          intakeY={wordZoneMeasured ? wordScreenY + 73 : undefined}
          correctCount={gauntletCorrectCount}
        />
      )}

      {/* Mastery celebration — phase-based elements */}
      {masterStampVisible && (
        <>
          {sealReady && (
            <MasterySeal
              x={containerWidth / 2}
              y={masteryWordCenterY}
              variant={isHaunt ? 'banished' : 'master'}
              label={isHaunt ? 'BANISHED' : 'MASTER'}
              onReveal={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            />
          )}

          {/* Cracked word energy */}
          {masterCracksVisible && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: masteryWordCenterY - 36,
                left: containerWidth / 2 - 118,
                width: 236,
                height: 94,
                opacity: masterCrackOpacity,
              }}
            >
              {[
                { left: 22, top: 26, width: 86, rotate: '-24deg', color: '#7B2D8B' },
                { left: 78, top: 42, width: 74, rotate: '18deg', color: '#9B2D6B' },
                { left: 126, top: 24, width: 92, rotate: '-15deg', color: '#7B2D8B' },
                { left: 44, top: 58, width: 54, rotate: '34deg', color: '#F5C842' },
                { left: 144, top: 60, width: 58, rotate: '-32deg', color: '#9B2D6B' },
              ].map((crack, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: crack.left,
                    top: crack.top,
                    width: crack.width,
                    height: i === 3 ? 3 : 4,
                    borderRadius: 3,
                    backgroundColor: crack.color,
                    opacity: i === 3 ? 0.72 : 0.9,
                    transform: [{ rotate: crack.rotate }],
                  }}
                />
              ))}
            </Animated.View>
          )}

          {/* Word Core + trail */}
          {goldSeedVisible && (
            <>
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: containerWidth / 2 - 2,
                  top: masteryWordCenterY - 2,
                  width: 4,
                  height: 74,
                  borderRadius: 2,
                  backgroundColor: '#F5C842',
                  opacity: goldSeedTrailOpacity,
                  transform: [
                    { translateX: goldSeedTransX },
                    { translateY: goldSeedTransY },
                    { rotate: '28deg' },
                  ],
                }}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: containerWidth / 2 - 12,
                  top: masteryWordCenterY - 12,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#F5C842',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.65)',
                  opacity: masterCoreOpacity,
                  shadowColor: '#F5C842',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.95,
                  shadowRadius: 14,
                  elevation: 10,
                  transform: [
                    { translateX: goldSeedTransX },
                    { translateY: goldSeedTransY },
                    { scale: goldSeedScale },
                    { rotate: wordCoreRotate },
                  ],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 5,
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: '#FFFFFF',
                    opacity: 0.72,
                  }}
                />
              </Animated.View>
            </>
          )}

          {/* Vault nav impact bloom */}
          {goldBloomVisible && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 34,
                left: vaultBloomX,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#F5C842',
                transform: [{ scale: goldBloomScale }],
                opacity: goldBloomOpacity,
              }}
            />
          )}

          {/* Boss-only game/system stinger */}
          {systemStingerWord && (
            <Animated.Text
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: masteryWordCenterY - 22,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: FONTS.label,
                includeFontPadding: false,
                fontWeight: '900',
                fontSize: systemStingerWord === 'ZZZZINGO!' ? 42 : 50,
                color: '#FFFFFF',
                letterSpacing: 0,
                opacity: systemStingerOpacity,
                textShadowColor: '#F5C842',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 14,
                transform: [{ scale: systemStingerScale }],
              }}
            >
              {systemStingerWord}
            </Animated.Text>
          )}
        </>
      )}

      {/* ── Haunt entrance banner ─────────────────────────────── */}
      {hauntBannerVisible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.hauntEntranceBanner, { opacity: hauntBannerOpacity }]}
        >
          <Text style={styles.hauntEntranceBannerText}>Guess who's back.</Text>
        </Animated.View>
      )}

      {/* ── STILL HAUNTED stamp ───────────────────────────────── */}
      {stillHauntedVisible && (
        <Animated.Text
          pointerEvents="none"
          style={[styles.stillHauntedText, {
            opacity: stillHauntedOpacity,
            transform: [{ scale: stillHauntedScale }],
          }]}
        >
          STILL HAUNTED
        </Animated.Text>
      )}

      {mechanics.wordOutcome === 'mastered' && showOutcomeCard && (
        <MasteredOutcomeOverlay
          word={step.word}
          headline={isHaunt ? 'BANISHED' : 'MASTERED'}
          bonusLabel={mechanics.outcomeBonusLabel}
          onContinue={continueOutcome}
          isBoss={isBoss}
        />
      )}

      {mechanics.wordOutcome === 'haunted' && showOutcomeCard && (
        <HauntedOutcomeOverlay
          word={step.word}
          detail={mechanics.outcomeDetail}
          onContinue={continueOutcome}
          isBoss={isBoss}
        />
      )}
    </Animated.View>
  );
}

// Thin presenter — MaskBoard is BoardPresenter with isBossStage locked off.
// BossBoard (app/components/BossBoard.tsx) is the boss-stage counterpart;
// both render through this exact same face code, never a copy.
export function MaskBoard(props: Props) {
  return <BoardPresenter {...props} isBossStage={false} />;
}

export { BoardPresenter };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  // ── Word zone ─────────────────────────────────────────────────
  wordZone: {
    height: 172,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingTop: 8,
    paddingBottom: 0,
    position: 'relative',
    marginTop: 4,
  },
  wordZoneBoss: {
    height: 186,
    // Extra headroom so the chromed kickerBossFixed badge (restored padding
    // + border, see below) has clearance above the book instead of
    // overlapping its top edge. Kept on wordZone rather than lifting the
    // badge itself with a negative top: kickerBossFixed is a direct child
    // of this component's root container and must remain inside its
    // no-padding top edge. Pushing the zone down instead
    // keeps the whole badge inside the visible, unclipped area.
    marginTop: 26,
  },
  kickerFixed: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  kickerBossFixed: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    // top intentionally stays 0, not negative: this Text is a direct child
    // of the root container with no paddingTop, and the original negative
    // offset caused the "kicker never visible" bug. Clearance from the
    // book comes from wordZoneBoss's marginTop instead (see above).
    top: 0,
    left: 20,
    right: 20,
    zIndex: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(15,13,42,0.88)',
  },
  word: {
    fontSize: 96,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: FONT_SIZES.wordDisplayLetterSpacing,
    color: '#F5C842',
    // Tight warm edge only — a wide zero-offset glow (radius 8) hazed the glyphs
    textShadowColor: 'rgba(245,200,66,0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  wordBoss: {
    fontSize: 112,
    fontFamily: FONTS.bossWord,
    includeFontPadding: false,
    letterSpacing: FONT_SIZES.bossWordLetterSpacing,
    color: '#F5C842',
    // The base boss word (plain Text, no explicit width — just maxWidth via
    // styles.word) hugs its own natural text width. The red wrong-swipe
    // overlay and the haunt tint stacked on top of it are both
    // position:'absolute' with left:0/right:0, which stretches THEM to the
    // full word zone instead — a different box feeding adjustsFontSizeToFit
    // than the base text gets, so the two layers can land at different
    // scaled sizes on a long boss word and read as a misaligned "double
    // word" (reported 2026-08-15, only on some boss words — exactly what a
    // width-dependent shrink mismatch would produce). Forcing this layer to
    // stretch the same way removes the mismatch at the source instead of
    // patching each overlay separately. Scoped to wordBoss (not styles.word)
    // so the regular FoilWord word — already fixed once for its own
    // layering bug — is untouched.
    width: '100%',
  },
  goldRing: {
    position: 'absolute',
    alignSelf: 'center',
    width: '85%',
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#F5C842',
  },
  absorbedPhrase: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.progressLabel,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
  },
  vaultLabel: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(245,200,66,0.72)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    // Was 9px, below this project's 14px non-gameplay floor. Trimmed
    // letterSpacing from 4 to 3 to partly offset the width increase — this
    // sits on the book's fixed spine art, so it's worth a look on-device to
    // confirm "WORD VAULT" still fits the spine cleanly at the new size.
    fontSize: 14,
    letterSpacing: 3,
  },
  // ── Tile zone ─────────────────────────────────────────────────
  gridViewport: {
    flex: 1,
    width: '100%',
    overflow: 'visible',
  },
  gridWrap: {
    flexGrow: 1,
    flexShrink: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    // Was 180 — left the deck sitting low enough to collide with the ground
    // torches (GraphicGround) and crowd Polly's speech bubble, both pinned
    // near the bottom of the screen. Pulled up to give both room.
    paddingTop: 110,
    paddingBottom: 48,
    minHeight: 0,
  },
  tileStackArea: {
    width: '100%',
    minHeight: TILE_H + 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 0,
    overflow: 'visible',
  },
  scoreFloatOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: PW.z.overlay,
    elevation: PW.z.overlay,
  },
  swipeUpCueRegion: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
    zIndex: 3,
    elevation: 3,
  },
  swipeRightCueRegion: {
    width: '94%',
    alignItems: 'flex-end',
    marginTop: 0,
    paddingRight: 8,
    zIndex: 3,
    elevation: 3,
  },
  swipeCueText: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swipeUpCue: {
    color: '#F5C842',
    opacity: 0.92,
  },
  swipeRightCue: {
    width: 210,
    color: 'rgba(185,138,222,0.96)',
    opacity: 0.92,
    textAlign: 'right',
  },
  tileStack: {
    width: '94%',
    alignSelf: 'center',
    paddingRight: 0,
    zIndex: 2,
    overflow: 'visible',
  },
  deckWrap: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    minHeight: TILE_H + 18,
    paddingBottom: 14,
    overflow: 'visible',
  },
  deckBackingCard: {
    position: 'absolute',
    height: TILE_H,
    borderRadius: PW.radius.card,
    backgroundColor: 'transparent',
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  deckBackingPhrasePanel: {
    position: 'absolute',
    top: 0,
    left: '9%',
    right: '9%',
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 18,
  },
  deckBackingPhrase: {
    fontSize: 27,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 31,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.76)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  deckActiveCardLayer: {
    position: 'relative',
    zIndex: 30,
    elevation: 30,
  },
  deckTopCardSlot: {
    position: 'relative',
    zIndex: 20,
    width: '100%',
    minHeight: TILE_H,
    paddingVertical: 0,
    borderWidth: 0,
    borderRadius: 28,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 12,
  },
  outcomeOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(15,13,42,0.78)',
  },
  outcomePanel: {
    width: '100%',
    maxWidth: 360,
    minHeight: 300,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 14,
  },
  masteredOutcomePanel: {
    borderColor: 'rgba(245,200,66,0.92)',
    backgroundColor: 'rgba(15,13,42,0.96)',
    shadowColor: '#F5C842',
    shadowOpacity: 0.34,
  },
  hauntedOutcomePanel: {
    borderColor: 'rgba(155,45,107,0.92)',
    backgroundColor: 'rgba(15,13,42,0.97)',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.42,
  },
  masteredPulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#F5C842',
    backgroundColor: 'rgba(245,200,66,0.08)',
  },
  hauntedHaze: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 24,
    bottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.36)',
    backgroundColor: 'rgba(123,45,139,0.18)',
  },
  outcomeHeadline: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontWeight: '900',
    fontSize: 38,
    letterSpacing: 0,
    textAlign: 'center',
  },
  masteredOutcomeHeadline: {
    color: '#F5C842',
    textShadowColor: 'rgba(245,200,66,0.62)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  hauntedOutcomeHeadline: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(155,45,107,0.74)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  outcomeWord: {
    marginTop: 8,
    color: '#F5C842',
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 54,
    letterSpacing: 0,
    textAlign: 'center',
    maxWidth: '100%',
  },
  outcomeCopyBlock: {
    marginTop: 12,
    gap: 5,
  },
  outcomeCopy: {
    color: '#FFFFFF',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 0,
    textAlign: 'center',
  },
  outcomeBonus: {
    marginTop: 16,
    color: '#F5C842',
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: FONT_SIZES.hudScore,
    letterSpacing: 0,
    textAlign: 'center',
  },
  hauntedDetail: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.46)',
    backgroundColor: 'rgba(123,45,139,0.20)',
    color: '#FFFFFF',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 0,
    textAlign: 'center',
  },
  outcomeContinue: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.hudLabel,
    letterSpacing: 1,
    textAlign: 'center',
  },
  // ── Boss outcome plaques (isBoss only — see OutcomeOverlayProps) ──────
  // Lighter than outcomeOverlay's 0.78: the whole point is the just-
  // transformed book stays recognizable behind the plaque, not fully
  // curtained off.
  plaqueOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15,13,42,0.42)',
  },
  plaqueColumn: {
    alignItems: 'center',
  },
  // MASTERED is the size reference; HAUNTED shares the same sizing logic
  // (own width, own aspectRatio-driven height) so neither is ever
  // stretched or cropped independently of the two supplied plaque images.
  // Both widths trimmed ~9-10% from the original shared 360 (device
  // feedback: plaque was reading larger than the transformed book behind
  // it warranted).
  plaqueFrame: {
    width: '100%',
  },
  masteredPlaqueFrame: {
    maxWidth: 324, // -10% from 360
  },
  hauntedPlaqueFrame: {
    maxWidth: 328, // -9% from 360
  },
  // Not boss-gated (see banishedPlaqueArt) — renders through the full
  // outcomeOverlay scrim, so it can sit at outcomePanel's own width rather
  // than trimmed down to stay behind a transformed book.
  banishedPlaqueFrame: {
    maxWidth: 340,
  },
  plaqueImage: {
    width: '100%',
    height: undefined,
  },
  plaqueContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Backstop only: normal content fits the insets below (checked against
    // each plaque's own measured field), this just guarantees a rare
    // long-phrase/long-headword edge case clips rather than bleeding onto
    // the illustrated border.
    overflow: 'hidden',
  },
  // Insets measured against each plaque's own illustrated inner field
  // (color-sampled against the source art, not eyeballed), tightened from
  // the original pass to use substantially more of the field per device
  // feedback — a small safety margin remains so text still never nears
  // the border.
  masteredPlaqueContent: {
    left: '14%', right: '14%', top: '13%', bottom: '25%',
  },
  hauntedPlaqueContent: {
    left: '13%', right: '13%', top: '13%', bottom: '15%',
  },
  // Measured against banished-result-plaque.png's own grey field (color-
  // sampled through its center cross, same convention as the two above),
  // then padded inward for safety against the crack shards near the corners.
  banishedPlaqueContent: {
    left: '12%', right: '13%', top: '16%', bottom: '17%',
  },
  plaqueHeadline: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontWeight: '900',
    fontSize: 33, // was 24 (+37%)
    letterSpacing: 0,
    textAlign: 'center',
  },
  masteredPlaqueHeadline: {
    color: PW.color.purple, // deep POLYWORDS purple, per spec
  },
  hauntedPlaqueHeadline: {
    // Unified to the same single dark ink as the rest of Haunted's text
    // (was PW.color.softWhite) — device feedback: the prior white
    // headline + dark headword + rose label + dark copy mix read as
    // disconnected from the Haunted book's own gray-stone/dark-indigo
    // palette. One ink color ties the whole plaque to the book.
    color: PW.color.bg,
  },
  banishedPlaqueHeadline: {
    color: PW.color.purple, // same win-ink as Mastered — banishing a Haunt is a win, not a rescue
  },
  plaqueWord: {
    marginTop: 3,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 41, // was 28 (+46%) — the strongest element on either plaque, per spec's priority hierarchy
    letterSpacing: 0,
    textAlign: 'center',
    maxWidth: '100%',
  },
  masteredPlaqueWord: {
    color: PW.color.purple,
  },
  hauntedPlaqueWord: {
    color: PW.color.bg, // dark headword, per spec, kept off gold entirely
  },
  banishedPlaqueWord: {
    color: PW.color.purple,
  },
  plaqueCopyBlock: {
    marginTop: 4,
    gap: 2,
  },
  plaqueCopy: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 14, // was 11 (+27%)
    letterSpacing: 0,
    textAlign: 'center',
  },
  masteredPlaqueCopy: {
    color: PW.color.bg, // dark purple/very-dark readable tone over the gold field
  },
  hauntedPlaqueCopy: {
    color: PW.color.bg, // same single Haunted ink as headline/headword — see hauntedPlaqueHeadline
  },
  banishedPlaqueCopy: {
    color: PW.color.bg, // dark ink for readability on the plaque's neutral grey field
  },
  plaqueBonus: {
    marginTop: 6,
    fontWeight: '800',
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 20, // was 15 (+33%)
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  masteredPlaqueBonus: {
    color: PW.color.bg, // same dark-on-gold family as the copy above, bold/sized for reward emphasis (gold-on-gold would vanish)
  },
  banishedPlaqueBonus: {
    color: PW.color.bg,
  },
  plaqueDangerBlock: {
    marginTop: 5,
    alignItems: 'center',
  },
  plaqueDangerLabel: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontWeight: '800',
    fontSize: 15, // was 11 (+36%) — sits between plaqueCopy (14, priority 4) and plaqueDangerPhrase (17, priority 2), so TRAP CLAIMED reads as priority 3 as spec'd
    letterSpacing: 1,
    color: PW.color.rose, // restrained danger accent — the ONE place rose appears; everything else on the Haunted plaque is the single dark ink
    textAlign: 'center',
  },
  plaqueDangerPhrase: {
    marginTop: 2,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 17, // was 12 (+42%) — recognition content, not footer copy, per spec
    letterSpacing: 0,
    color: PW.color.bg, // same single Haunted ink as the rest of the plaque
    textAlign: 'center',
  },
  plaqueContinue: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.hudLabel,
    letterSpacing: 1,
    textAlign: 'center',
  },
  // ── Haunt system ─────────────────────────────────────────────
  hauntEntranceBanner: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 218,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7B2D8B',
    backgroundColor: '#0F0D2A',
    alignItems: 'center',
    shadowColor: '#7B2D8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  hauntEntranceBannerText: {
    color: '#FFFFFF',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  stillHauntedText: {
    position: 'absolute',
    top: 230,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontWeight: '900',
    fontSize: 30,
    color: '#7B2D8B',
    letterSpacing: 1,
    textShadowColor: 'rgba(123,45,139,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bossMasterSeal: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: 96,
    height: 96,
  },
});
