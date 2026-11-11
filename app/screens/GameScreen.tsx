import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, PixelRatio, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import UiIconButton from '../components/UiIconButton';
import { HuntPauseMenu } from '../components/HuntPauseMenu';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { FONTS } from '../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chainMultiplierForStreak, currentStep, isArmored, type GameState } from '../game/polyRunEngine';
import { applyDevMasteryRematch } from '../game/devMasteryRematch';
import { resolveHuntHud, resolveLiveHuntControl, HuntReadTier } from '../game/huntControl';
import {
  fallWall,
  fgLandScale,
  fgLandY,
  resetWallFall,
  resetWallStrain,
  setWallStrain,
  WallStrainTier,
} from '../components/wallShake';
import { MOMENTUM_ACCENT_BY_TIER, resolveMomentumAccent } from '../ui/momentumAccent';
import { flushActiveGamePersistence, useGameStore } from '../store/useGameStore';
import { MaskBoard } from '../components/MaskBoard';
import { BossBoard } from '../components/BossBoard';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';
import { PW } from '../ui/pwTheme';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import { BOSS_SKY_TUNING, HUNT_SKY_TUNING } from '../ui/ambientSkyTuning';
import ResultsScreen from './ResultsScreen';
import { playSfx, sfxReady, warmArmorFlipSfx, warmHuntSwipeSfx, warmWallFallSfx } from '../audio/sfx';
import { startMusic, stopMusic, setMusicState, MusicState } from '../audio/MusicEngine';
import { Haptics } from '../utils/haptics';
import FXLayer, { FXLayerHandle } from '../components/FXLayer';
import { ShardVariant } from '../ui/pwEffects';
import { usePollyVisits } from '../hooks/usePollyVisits';
import { PollyHuntVisit } from '../components/PollyHuntVisit';
import { FirstRunHuntOnboarding } from '../components/FirstRunHuntOnboarding';
import { HudLessonLayer } from '../components/HudLessonLayer';
import {
  hudTargetAccessibilityLabel,
  roundProgressAccessibilityLabel,
  type HudLessonTarget,
} from '../game/hudLessons';
import { BossIntroOverlay } from '../components/BossIntroOverlay';
import { HauntIntroOverlay } from '../components/HauntIntroOverlay';
import { PollyExitConfirm } from '../components/PollyExitConfirm';
import {
  isHuntExitGuardBypassed,
  withHuntExitGuardBypass,
} from '../game/huntPauseNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReducedFlashesPreference, useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { BOSS_INTRO_SEEN_KEY, HAUNT_INTRO_SEEN_KEY } from '../constants/storageKeys';
import { recordPlaytestEvent } from '../game/playtestTelemetry';
import {
  derivePollyRelationshipContext,
  resolvePollyRelationshipBeat,
  resolvePollyRelationshipPresentation,
} from '../game/pollyRelationship';
import { FLEDGLING_MERCY_LIVES } from '../game/mercyPolicy';
import {
  devMercyArmAllowed,
  mercyLessonOwnsRevive,
  recognitionOpensWithHold,
  resolveHudLesson,
  resolveOnboardingBoardPresentation,
  resolveOnboardingCaption,
  resolveOnboardingCaptionReserve,
  resolveOnboardingInputMode,
} from '../game/firstRunOnboarding';

type HudTargetRefs = Record<HudLessonTarget, React.RefObject<View | null>>;

// Hides a subtree from screen readers while a HUD lesson panel is up. iOS also
// gets accessibilityViewIsModal on the lesson layer itself; Android needs the
// siblings hidden explicitly.
function a11yHiddenProps(hidden: boolean) {
  return {
    accessibilityElementsHidden: hidden,
    importantForAccessibility: hidden ? 'no-hide-descendants' as const : 'auto' as const,
  };
}
import {
  resolveScreenFlash,
  resolveTierUpHapticCue,
  shouldPlayRazorStartle,
  type ScreenFlashEvent,
} from '../game/huntFeedbackPolicy';
import { playPollyReaction } from '../audio/pollyReactionSfx';
import { resolveGameplayFeedbackAccessibility } from '../game/gameplayFeedbackAccessibility';
import {
  createBossReadinessState,
  markBossEntered,
  markBossPlayable,
} from '../game/bossReadinessTelemetry';

const MAX_FEATHERS = 6;

function BossCrownIcon() {
  return (
    <Svg width={15} height={12} viewBox="0 0 30 24" accessibilityElementsHidden>
      <Path
        d="M3 6.5L9.2 13 15 3l5.8 10L27 6.5 24.7 20H5.3L3 6.5Z"
        fill={PW.color.lavender}
        stroke={PW.color.softWhite}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M6 17.2h18" stroke={PW.color.bgDeep} strokeWidth={1.5} opacity={0.55} />
    </Svg>
  );
}
// ─── RED FLASH — wrong-swipe danger signal ─────────────────────
function RedFlash({ flashKey }: { flashKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceFlashes = useReducedFlashesPreference();
  useEffect(() => {
    if (flashKey === 0 || reduceFlashes) {
      opacity.setValue(0);
      return;
    }
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.32, duration: 55,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 180, useNativeDriver: true }),
    ]).start();
  }, [flashKey, reduceFlashes]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#CC2200', opacity }}
    />
  );
}

// ─── GOLD FLASH — real-claim / gauntlet-correct / mastery confirmation ──
function GoldFlash({ flashKey, event }: { flashKey: number; event: ScreenFlashEvent }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceFlashes = useReducedFlashesPreference();
  const recipe = resolveScreenFlash(event);
  useEffect(() => {
    if (flashKey === 0 || reduceFlashes || recipe === null) {
      opacity.setValue(0);
      return;
    }
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: recipe.peakOpacity, duration: recipe.attackMs, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: recipe.decayMs, useNativeDriver: true }),
    ]).start();
  }, [flashKey, reduceFlashes, recipe]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: recipe?.color ?? '#F5C842', opacity }}
    />
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────

// Tier rank for comparing crossings (level-up vs. a FELL OFF drop) — must
// stay in step with resolveReadTier's boundaries in huntControl.ts.
const READ_TIER_RANK: Record<HuntReadTier, number> = {
  steady: 0,
  sharp: 1,
  razorSharp: 2,
  untrappable: 3,
};

// UNTRAPPABLE ARMOR FLIP (Pete, 2026-11-02): the whole top bar is a slab with
// two faces. When the armor is on, the slab turns over on its long edge and the
// back face shows UNTRAPPABLE, pulsing harder the longer the streak holds. A
// wrong answer turns it back to the front. All timings and sizes are first
// pass, NOT device-confirmed.
const ARMOR_FLIP_IN_MS = 340;
const ARMOR_FLIP_BACK_MS = 280;
const ARMOR_FLIP_PERSPECTIVE = 900;
const ARMOR_PULSE_PERIOD_MS = [520, 400, 300, 230]; // by level, 0..3
const ARMOR_PULSE_SCALE = [1.02, 1.035, 1.05, 1.065];
const ARMOR_JITTER_PX = [0.8, 1.4, 2.2, 3.0];
const ARMOR_SWEEP_PERIOD_MS = [1800, 1500, 1200, 950]; // light sweep across the face, by level
const ARMOR_HOT_PEAK = [0.6, 0.7, 0.8, 0.9]; // how white the letters get at the pulse's peak
const ARMOR_GOLD = '#F5C842';
const ARMOR_LEVEL_STREAK_STEP = 3; // level 0 at streak 9, then +1 every 3 words
// Same dark as the front of the bar (tb.root). Mock-up D (Pete, 2026-11-03):
// bone letters with a fine gold rim, replacing the flat yellow, which Pete
// found too yellow. The rim is a TIGHT gold text shadow, not a second text
// node: PlaqueText learned that layered copies separate into visible duplicate
// words on device, which is the same reason the extrusion was dropped.
const ARMOR_BACK_BG = 'rgba(11,9,32,0.95)';
const ARMOR_BACK_FACE = '#F2EBDA';
const ARMOR_BACK_GLOW = 'rgba(201,162,75,0.95)';
// Small enough to hug the letters as an edge rather than bloom as a glow; the
// face's own breathing ring and inner glow carry the ambient light.
const ARMOR_BACK_RIM_RADIUS = 7;
const ARMOR_WORD = 'UNTRAPPABLE';
const ARMOR_WORD_CHAR_WIDTH_EM = 0.47; // Bebas Neue, rough advance per letter incl. spacing
// Headroom. The word used to be sized to fill its box exactly (height / 1.0),
// which was fine when it had the face to itself: once the round chips took
// their share below it, the word still filled whatever was left and sat flush
// against them, with its rim spilling over the top of the chips. Sizing to a
// fraction of the box leaves a gap that belongs to neither (Pete, 2026-11-03).
const ARMOR_WORD_HEIGHT_FIT = 1.28;

function ArmorWord({
  width,
  height,
  hot,
  hotPeak,
}: {
  width: number;
  height: number;
  hot: Animated.Value;
  hotPeak: number;
}) {
  const fontSize = Math.max(
    12,
    Math.floor(Math.min(
      height / ARMOR_WORD_HEIGHT_FIT,
      width / (ARMOR_WORD.length * ARMOR_WORD_CHAR_WIDTH_EM),
    )),
  );
  const textStyle = {
    fontFamily: FONTS.wordDisplay,
    fontSize,
    lineHeight: Math.round(fontSize * 1.02),
    includeFontPadding: false,
    letterSpacing: 1,
    textAlign: 'center' as const,
    width,
  };
  const hotOpacity = hot.interpolate({ inputRange: [0, 1], outputRange: [0, hotPeak] });
  return (
    <View style={{ width, height: textStyle.lineHeight }}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[textStyle, {
          color: ARMOR_BACK_FACE,
          textShadowColor: ARMOR_BACK_GLOW,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: ARMOR_BACK_RIM_RADIUS,
        }]}
      >
        {ARMOR_WORD}
      </Text>
      {/* White-hot: a white copy laid over the gold, pulsing with the beat. */}
      <Animated.Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[textStyle, { position: 'absolute', left: 0, top: 0, color: '#FFFFFF', opacity: hotOpacity }]}
      >
        {ARMOR_WORD}
      </Animated.Text>
    </View>
  );
}

// The run that already had its RAZOR SHARP startle. Module level so a TopBar
// remount mid-run does not replay it.
let lastRazorStartleRunSeed: string | number | null = null;

function TopBar({
  navigation,
  featherRowPulse,
  hudTargets,
  a11yHidden = false,
}: {
  navigation: any;
  featherRowPulse?: Animated.Value;
  // Live HUD elements a HUD lesson spotlights; measured, never duplicated.
  hudTargets?: HudTargetRefs;
  a11yHidden?: boolean;
}) {
  const reduceMotion = useReducedMotionPreference();
  const reduceFlashes = useReducedFlashesPreference();
  const { animateMotion, animateFlashes } = resolveGameplayFeedbackAccessibility(
    reduceMotion,
    reduceFlashes,
  );
  const game  = useGameStore(s => s.game);
  const onboarding = useGameStore(s => s.onboarding);
  const gauntletActive = useGameStore(s => s.game.gauntletActive);
  const goldFeatherAvailable = useGameStore(s => s.goldFeatherAvailable);
  const goldFeatherExpiresAt = useGameStore(s => s.goldFeatherExpiresAt);
  const fellOffSeverity = useGameStore(s => s.game.fellOffSeverity);
  const consumeFellOff = useGameStore(s => s.consumeFellOff);
  const filledFeathers = Math.max(0, Math.min(MAX_FEATHERS, game.lives));
  const hasReserve     = game.lives > MAX_FEATHERS;
  const hasGoldFeather =
    goldFeatherAvailable &&
    goldFeatherExpiresAt !== null &&
    Date.now() < goldFeatherExpiresAt;
  const total   = game.session.length;
  const current = game.stepIndex;
  const step = currentStep(game);
  const isWordStep = step.kind === 'word';
  const hud = resolveHuntHud({
    chainMultiplier: game.chainMultiplier,
    lives: game.lives,
    isHauntReturn: isWordStep && step.isHauntReturn === true,
    isMasteredReturn: isWordStep && step.isMasteredReturn === true,
    isBossWord: isWordStep && step.eventType === 'bossWord',
    isGauntletActive: game.gauntletActive,
  });
  const hudSignature = `${hud.contextLabel ?? 'NORMAL'}:${hud.label}`;
  const previousHudSignatureRef = useRef(hudSignature);
  const hudPulse = useRef(new Animated.Value(0)).current;
  // Tier bump — spring pop + hop + white flash when readTier crosses UP a
  // threshold. A drop in tier is handled entirely by the FELL OFF effect
  // below, not by this one (see the guard in the crossing effect).
  const tierBumpScale = useRef(new Animated.Value(1)).current;
  const tierBumpHopY = useRef(new Animated.Value(0)).current;
  const tierFlashOpacity = useRef(new Animated.Value(0)).current;
  const prevTierRef = useRef(hud.readTier);
  // FELL OFF — drop + shake + red flash, scaled by fellOffSeverity, plus a
  // brief "FELL OFF" text override before the label settles back to STEADY.
  const fellOffShakeX = useRef(new Animated.Value(0)).current;
  const fellOffDropY = useRef(new Animated.Value(0)).current;
  const fellOffFlashOpacity = useRef(new Animated.Value(0)).current;
  const [showFellOffTextState, setShowFellOffText] = useState(false);
  // fellOffSeverity is set in the same state update that resets the streak, but
  // the state above is set in an effect, one frame later. Without this the new
  // label (STEADY) painted for a frame before FELL OFF replaced it.
  const showFellOffText = showFellOffTextState || fellOffSeverity !== null;
  // Armor flip: true exactly while the engine's armor is on (UNTRAPPABLE, not
  // the gauntlet), so the back face never shows while a wrong answer would cost.
  const armored = isArmored(game);
  const armorLevel = armored
    ? Math.max(0, Math.min(3, Math.floor((game.streak - 9) / ARMOR_LEVEL_STREAK_STEP)))
    : 0;
  const flip = useRef(new Animated.Value(armored ? 1 : 0)).current;
  const armorPulse = useRef(new Animated.Value(0)).current;
  const armorJitter = useRef(new Animated.Value(0)).current;
  const armorSweep = useRef(new Animated.Value(0)).current;
  const armorSinceRef = useRef<number>(armored ? 0 : -1);
  const wasArmoredRef = useRef(armored);
  const [armorWordBox, setArmorWordBox] = useState({ w: 0, h: 0 });
  const { width: windowWidth } = useWindowDimensions();
  const hudAccent = resolveMomentumAccent(hud).color;
  const rungLitCount = READ_TIER_RANK[hud.readTier] + 1;
  const rungLitColor = MOMENTUM_ACCENT_BY_TIER[hud.readTier];
  const hudPulseScale = hudPulse.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 1.08, 1],
  });

  useEffect(() => {
    flip.stopAnimation();
    if (armored) armorSinceRef.current = Date.now();
    else armorSinceRef.current = -1;
    // Two cues, both at the start of the turn (Pete, 2026-11-03): the riffle
    // covers the 340 ms flip itself, and the chime swells behind it so the
    // shine lands as the slab settles. Supersedes the earlier "no thud" note:
    // the chime alone read as the sound arriving after the flip was over.
    // Only on the way in, not on a remount, not on the way back.
    if (armored && !wasArmoredRef.current) {
      playSfx('armorFlipTurn');
      playSfx('armorFlipChime');
    }
    wasArmoredRef.current = armored;
    if (!animateMotion) {
      flip.setValue(armored ? 1 : 0);
      return;
    }
    const flipAnimation = Animated.timing(flip, {
      toValue: armored ? 1 : 0,
      duration: armored ? ARMOR_FLIP_IN_MS : ARMOR_FLIP_BACK_MS,
      easing: armored ? Easing.out(Easing.cubic) : Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    });
    flipAnimation.start();
    return () => flipAnimation.stop();
  }, [armored, animateMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // The back face pulses and vibrates once the flip has landed, harder by level.
  useEffect(() => {
    armorPulse.setValue(0);
    armorJitter.setValue(0);
    armorSweep.setValue(0);
    if (!armored || !animateMotion) return;
    const sinceFlip = armorSinceRef.current > 0 ? Date.now() - armorSinceRef.current : ARMOR_FLIP_IN_MS;
    const wait = Math.max(0, ARMOR_FLIP_IN_MS - sinceFlip);
    const half = ARMOR_PULSE_PERIOD_MS[armorLevel] / 2;
    const jitter = ARMOR_JITTER_PX[armorLevel];
    const pulseLoop = Animated.sequence([
      Animated.delay(wait),
      Animated.loop(Animated.sequence([
        Animated.timing(armorPulse, { toValue: 1, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(armorPulse, { toValue: 0, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])),
    ]);
    const jitterLoop = Animated.sequence([
      Animated.delay(wait),
      Animated.loop(Animated.sequence([
        Animated.timing(armorJitter, { toValue: jitter, duration: 45, useNativeDriver: true }),
        Animated.timing(armorJitter, { toValue: -jitter, duration: 45, useNativeDriver: true }),
      ])),
    ]);
    const sweepLoop = Animated.sequence([
      Animated.delay(wait),
      Animated.loop(Animated.timing(armorSweep, {
        toValue: 1,
        duration: ARMOR_SWEEP_PERIOD_MS[armorLevel],
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })),
    ]);
    pulseLoop.start();
    jitterLoop.start();
    sweepLoop.start();
    return () => {
      pulseLoop.stop();
      jitterLoop.stop();
      sweepLoop.stop();
    };
  }, [armored, armorLevel, animateMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (previousHudSignatureRef.current === hudSignature) return;
    previousHudSignatureRef.current = hudSignature;
    hudPulse.stopAnimation();
    hudPulse.setValue(0);
    if (animateMotion || animateFlashes) {
      Animated.timing(hudPulse, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }).start();
    }

    // Tier bump — spring pop + hop + flash only on a genuine LEVEL UP
    // (rank increasing). A rank decrease is always a real chain breaking,
    // which the FELL OFF effect below owns entirely — this guard keeps the
    // two from double-animating the same event.
    if (hud.readTier !== prevTierRef.current) {
      const wasRank = READ_TIER_RANK[prevTierRef.current];
      const isRank = READ_TIER_RANK[hud.readTier];
      prevTierRef.current = hud.readTier;
      if (isRank > wasRank) {
        const bumpScale = 1.14 + isRank * 0.04; // 1.18 / 1.22 / 1.26 by tier
        tierBumpScale.stopAnimation();
        tierBumpHopY.stopAnimation();
        tierFlashOpacity.stopAnimation();
        tierBumpScale.setValue(1);
        tierBumpHopY.setValue(0);
        tierFlashOpacity.setValue(0);
        const tierAnimations: Animated.CompositeAnimation[] = [];
        if (animateMotion) {
          tierAnimations.push(Animated.sequence([
            Animated.spring(tierBumpScale, {
              toValue: bumpScale, damping: 8, stiffness: 260, useNativeDriver: true,
            }),
            Animated.spring(tierBumpScale, {
              toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true,
            }),
          ]));
          tierAnimations.push(Animated.sequence([
            Animated.timing(tierBumpHopY, { toValue: -6, duration: 90, useNativeDriver: true }),
            Animated.spring(tierBumpHopY, { toValue: 0, damping: 10, stiffness: 200, useNativeDriver: true }),
          ]));
        }
        if (animateFlashes) {
          tierAnimations.push(Animated.sequence([
            Animated.timing(tierFlashOpacity, { toValue: 0.9, duration: 60, useNativeDriver: true }),
            Animated.timing(tierFlashOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          ]));
        }
        if (tierAnimations.length > 0) Animated.parallel(tierAnimations).start();
        Haptics.cueAsync(resolveTierUpHapticCue(isRank));
        // Polly's startle on first reaching RAZOR SHARP: a sound, not motion or
        // a flash, so it plays with Reduce Motion / Reduce Flashes on.
        const onboardingRunActive = onboarding.activeRun?.runSeed === game.runSeed &&
          onboarding.activeRun.mode === game.onboardingMode &&
          onboarding.activeRun.phase !== 'complete';
        if (shouldPlayRazorStartle({
          isRank,
          wasRank,
          runSeed: game.runSeed,
          lastStartleRunSeed: lastRazorStartleRunSeed,
          muted: a11yHidden || onboardingRunActive,
        })) {
          lastRazorStartleRunSeed = game.runSeed;
          playPollyReaction('startled');
        }
      }
    }

    // Context changes and reaching the top read are deliberate beats.
    // Ordinary STEADY/SHARP changes stay visual-only so the status never
    // chatters in the player's hand; HUNTED already arrives with the
    // wrong-answer error cue.
    if (hud.contextLabel !== null || hud.tier === 'untrappable') {
      Haptics.selectionAsync();
    }
  }, [
    animateFlashes,
    animateMotion,
    hudSignature,
    hud.contextLabel,
    hud.tier,
    hud.readTier,
    hudPulse,
  ]);

  // FELL OFF — fires purely from game.fellOffSeverity, independent of the
  // tier-bump effect above. Drop + shake + red flash scaled by severity,
  // plus a brief "FELL OFF" text override before the label reveals STEADY.
  // All timings/amplitudes here are first-pass placeholders pending a device
  // pass (see the design spec's open items) — the shape (bigger fall = more
  // channels react) is the locked part, not these exact numbers.
  useEffect(() => {
    if (fellOffSeverity === null) return;
    setShowFellOffText(true);
    const shakeAmp = 3 + fellOffSeverity * 3; // 6 / 9 / 12 px
    const flashPeak = 0.35 + fellOffSeverity * 0.15; // 0.5 / 0.65 / 0.8
    const dropDistance = 4 + fellOffSeverity * 2; // 6 / 8 / 10 px

    fellOffDropY.stopAnimation();
    fellOffFlashOpacity.stopAnimation();
    fellOffShakeX.stopAnimation();
    fellOffDropY.setValue(0);
    fellOffFlashOpacity.setValue(0);
    fellOffShakeX.setValue(0);

    const finishFellOff = () => {
      setShowFellOffText(false);
      consumeFellOff();
    };

    if (!animateMotion && !animateFlashes) {
      const timer = setTimeout(finishFellOff, 320);
      return () => clearTimeout(timer);
    }

    const shakeSteps: Animated.CompositeAnimation[] = [];
    if (animateMotion) {
      for (let i = 0; i < fellOffSeverity; i++) {
        shakeSteps.push(
          Animated.timing(fellOffShakeX, {
            toValue: i % 2 === 0 ? -shakeAmp : shakeAmp, duration: 45, useNativeDriver: true,
          }),
        );
      }
      shakeSteps.push(Animated.timing(fellOffShakeX, { toValue: 0, duration: 45, useNativeDriver: true }));
    }

    const fellOffAnimations: Animated.CompositeAnimation[] = [];
    if (animateMotion) {
      fellOffAnimations.push(Animated.sequence([
        Animated.timing(fellOffDropY, { toValue: dropDistance, duration: 90, useNativeDriver: true }),
        Animated.spring(fellOffDropY, { toValue: 0, damping: 10, stiffness: 180, useNativeDriver: true }),
      ]));
      fellOffAnimations.push(Animated.sequence(shakeSteps));
    }
    if (animateFlashes) {
      fellOffAnimations.push(Animated.sequence([
        Animated.timing(fellOffFlashOpacity, { toValue: flashPeak, duration: 60, useNativeDriver: true }),
        Animated.timing(fellOffFlashOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]));
    }
    const animation = Animated.parallel(fellOffAnimations);
    animation.start(({ finished }) => {
      if (finished) finishFellOff();
    });
    return () => animation.stop();
  }, [animateFlashes, animateMotion, fellOffSeverity]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderFeathers = (withTarget: boolean) => (
      <Animated.View
        ref={withTarget ? hudTargets?.feathers : undefined}
        collapsable={false}
        style={[tb.featherRow, featherRowPulse && {
          backgroundColor: featherRowPulse.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['transparent', 'rgba(204,34,0,0.25)', 'transparent'],
          }),
          borderRadius: 8,
          paddingHorizontal: 4,
        }]}
        accessible
        accessibilityLabel={`${filledFeathers} feathers remaining`}
      >
        {Array.from({ length: MAX_FEATHERS }, (_, i) => (
          <FeatherIcon key={i} filled={i < filledFeathers} inert={gauntletActive} />
        ))}
        {hasReserve && (
          <View style={tb.reserveFeatherWrap}>
            <View style={[tb.featherBlade, tb.featherBladeFilled, tb.reserveBlade]}>
              <View style={[tb.featherHighlight, tb.featherHighlightFilled]} />
            </View>
            <View style={[tb.featherShaft, tb.featherShaftFilled, tb.reserveShaft]} />
            <Text allowFontScaling={false} style={tb.reservePlus}>+</Text>
          </View>
        )}
        {hasGoldFeather && (
          <View
            style={tb.goldFeatherWrap}
            accessible
            accessibilityLabel="Gold Feather free life available"
          >
            <Image
              source={require('../../assets/ui/feather-gold-reward.png')}
              style={tb.goldFeatherImg}
              resizeMode="contain"
            />
          </View>
        )}
      </Animated.View>
  );

  const frontRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const armorScale = armorPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, ARMOR_PULSE_SCALE[armorLevel]],
  });

  return (
    <View style={tb.outerRow} {...a11yHiddenProps(a11yHidden)}>
      <View ref={hudTargets?.momentumBar} collapsable={false} style={tb.flipStage}>
      <Animated.View
        style={[tb.flipFace, { transform: [{ perspective: ARMOR_FLIP_PERSPECTIVE }, { rotateX: frontRot }] }]}
        accessibilityElementsHidden={armored}
        importantForAccessibility={armored ? 'no-hide-descendants' : 'auto'}
      >
      <View style={tb.root}>
        <View style={tb.statsRow}>
          {/* Plain, untransformed wrapper: the spotlight measures this, not the
              control inside it, which pulses, pops and shakes. */}
          <View ref={hudTargets?.streak} collapsable={false} style={tb.controlTarget}>
          <Animated.View
            style={[
              tb.controlWrap,
              { transform: [{ scale: animateMotion ? hudPulseScale : 1 }] },
            ]}
            accessible
            accessibilityLabel={`${hud.contextLabel ? `${hud.contextLabel}. ` : ''}${hud.label}. Level ${rungLitCount} of 4.`}
          >
            <Animated.View
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
                transform: [
                  { scale: tierBumpScale },
                  { translateY: Animated.add(tierBumpHopY, fellOffDropY) },
                  { translateX: fellOffShakeX },
                ],
              }}
            >
            <View style={tb.controlRungColumn}>
              {[0, 1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[
                    tb.controlRung,
                    { backgroundColor: i < rungLitCount ? rungLitColor : 'rgba(185,138,222,0.16)' },
                  ]}
                />
              ))}
            </View>
            <View style={tb.controlTextColumn}>
              <Text allowFontScaling={false} style={tb.controlContext} numberOfLines={1}>
                {hud.contextLabel ?? ' '}
              </Text>
              {/* The flashes are on the word itself, never a box behind it
                  (Pete, 2026-11-02): white copies of the label whose opacity
                  flashes, laid exactly over the real one. */}
              <View>
                <Text
                  allowFontScaling={false}
                  style={[tb.controlLabel, hud.tier === 'rattled' && tb.controlLabelRattled, { color: showFellOffText ? PW.color.wrong : hudAccent }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {showFellOffText ? 'FELL OFF' : hud.label}
                </Text>
                <Animated.Text
                  allowFontScaling={false}
                  pointerEvents="none"
                  style={[tb.controlLabel, tb.controlLabelFlash, { opacity: tierFlashOpacity }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {showFellOffText ? 'FELL OFF' : hud.label}
                </Animated.Text>
                <Animated.Text
                  allowFontScaling={false}
                  pointerEvents="none"
                  style={[tb.controlLabel, tb.controlLabelFlash, { opacity: fellOffFlashOpacity }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {showFellOffText ? 'FELL OFF' : hud.label}
                </Animated.Text>
              </View>
            </View>
            </Animated.View>
          </Animated.View>
          </View>
          {renderFeathers(true)}
        </View>
        <RoundChips current={current} total={total} targetRef={hudTargets?.rounds} />
      </View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          tb.flipFace,
          tb.armorBack,
          { transform: [{ perspective: ARMOR_FLIP_PERSPECTIVE }, { rotateX: backRot }] },
        ]}
        accessible={armored}
        accessibilityLabel={`UNTRAPPABLE. ${filledFeathers} feathers remaining.`}
        accessibilityElementsHidden={!armored}
        importantForAccessibility={armored ? 'yes' : 'no-hide-descendants'}
      >
        {/* Breathing gold: the face's inner glow and ring brighten with the pulse. */}
        <Animated.View
          pointerEvents="none"
          style={[tb.armorGlow, {
            opacity: armorPulse.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.2] }),
          }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[tb.armorRing, {
            opacity: armorPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          }]}
        />
        {/* A soft band of light crossing the whole face. */}
        {armorWordBox.w > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[tb.armorSweep, {
              width: armorWordBox.w * 0.18,
              transform: [
                {
                  translateX: armorSweep.interpolate({
                    inputRange: [0, 0.55, 1],
                    outputRange: [-armorWordBox.w * 0.2, armorWordBox.w * 1.15, armorWordBox.w * 1.15],
                  }),
                },
                { skewX: '-18deg' },
              ],
            }]}
          >
            <LinearGradient
              colors={['rgba(255,216,77,0)', 'rgba(255,226,120,0.32)', 'rgba(255,216,77,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <View
          style={tb.armorBackWord}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            setArmorWordBox(prev => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
          }}
        >
          {armorWordBox.w > 0 && (
            <Animated.View style={{ transform: [{ translateX: armorJitter }, { scale: armorScale }] }}>
              <ArmorWord
                width={armorWordBox.w}
                height={armorWordBox.h}
                hot={armorPulse}
                hotPeak={ARMOR_HOT_PEAK[armorLevel]}
              />
            </Animated.View>
          )}
        </View>
        {/* Round progress on the back face (Pete, 2026-11-03). Without it the
            flip hides which word you are on for as long as armor holds. NO
            targetRef here: the front face owns the lesson target, and two
            views must never share one RefObject (the later one to mount
            overwrites .current and the spotlight measures the wrong box). */}
        <RoundChips current={current} total={total} />
      </Animated.View>
      </View>
    </View>
  );
}

// ─── ROUND CHIPS ─────────────────────────────────────────────

function RoundChips({
  current,
  total,
  targetRef,
}: {
  current: number;
  total: number;
  targetRef?: React.RefObject<View | null>;
}) {
  const reduceMotion = useReducedMotionPreference();
  const chipAnims = useRef(
    Array.from({ length: total }, (_, i) => ({
      scale: new Animated.Value(i === current ? 1.25 : i < current ? 0.92 : 1),
      translateY: new Animated.Value(i === current ? -3 : 0),
      opacity: new Animated.Value(i < current ? 0.45 : 1),
    }))
  ).current;

  const prevCurrentRef = useRef(current);

  useEffect(() => {
    const justCompletedIndex = current > prevCurrentRef.current ? current - 1 : null;
    prevCurrentRef.current = current;

    chipAnims.forEach((anim, i) => {
      const isDone = i < current;
      const isCurrent = i === current;
      const toScale = isCurrent ? 1.25 : isDone ? 0.92 : 1;
      const toY = isCurrent ? -3 : 0;
      const toOpacity = isDone ? 0.45 : 1;

      if (reduceMotion !== false) {
        anim.scale.setValue(toScale);
        anim.translateY.setValue(toY);
        anim.opacity.setValue(toOpacity);
        return;
      }

      if (i === justCompletedIndex) {
        // The chip that just finished gets one deliberate pop before
        // settling to its resting "done" scale — this is the round's
        // actual completion signal now that the floating text is gone.
        Animated.sequence([
          Animated.spring(anim.scale, { toValue: 1.4, damping: 9, stiffness: 260, useNativeDriver: true }),
          Animated.spring(anim.scale, { toValue: toScale, damping: 12, stiffness: 180, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.spring(anim.scale, {
          toValue: toScale,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }).start();
      }
      Animated.spring(anim.translateY, {
        toValue: toY,
        damping: 12,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
      Animated.timing(anim.opacity, {
        toValue: toOpacity,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [current, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      ref={targetRef}
      collapsable={false}
      style={tb.chipsRow}
      accessible
      accessibilityLabel={roundProgressAccessibilityLabel(current + 1, total)}
    >
      {chipAnims.map((anim, i) => {
        const isBoss = i === total - 1;
        const isCurrent = i === current;
        const isPurpleFramed = isCurrent || isBoss;
        return (
          <Animated.View
            key={i}
            style={[
              tb.chip,
              {
                borderColor: isPurpleFramed
                  ? PW.color.purple
                  : 'rgba(255,255,255,0.55)',
                borderWidth: isPurpleFramed ? 1.5 : 1,
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  { translateY: anim.translateY },
                ],
              },
              isCurrent && {
                shadowColor: PW.color.purple,
                shadowOpacity: 0.5,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              },
            ]}
          >
            {isBoss ? (
              <BossCrownIcon />
            ) : (
              <Text allowFontScaling={false} style={[tb.chipLabel, isCurrent && tb.chipLabelCurrent]}>
                {i + 1}
              </Text>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const FEATHER_DUST_ANGLES = [0, 60, 120, 180, 240, 300].map(
  a => (a * Math.PI) / 180,
);

function FeatherDustParticle({
  angle,
  progress,
}: {
  angle: number;
  progress: Animated.Value;
}) {
  const tx = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, Math.cos(angle) * 16],
  });
  const ty = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, Math.sin(angle) * 16],
  });
  const op = progress.interpolate({
    inputRange:  [0, 0.35, 1],
    outputRange: [0.9, 0.6, 0],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 6,
        left: 5,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#9B59B6',
        transform: [{ translateX: tx }, { translateY: ty }],
        opacity: op,
      }}
    />
  );
}

function FeatherIcon({ filled, inert }: { filled: boolean; inert?: boolean }) {
  const reduceMotion = useReducedMotionPreference();
  const prevFilled    = useRef(filled);
  const shakeRotate   = useRef(new Animated.Value(0)).current;
  const launchY       = useRef(new Animated.Value(0)).current;
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const dustProgress  = useRef(new Animated.Value(0)).current;
  const [dustVisible, setDustVisible] = useState(false);

  useEffect(() => {
    if (prevFilled.current === true && filled === false) {
      if (reduceMotion !== false) {
        launchY.setValue(0);
        launchOpacity.setValue(1);
        setDustVisible(false);
        prevFilled.current = filled;
        return;
      }
      // Phase 1 — Shake (80ms)
      Animated.sequence([
        Animated.timing(shakeRotate, { toValue:  8, duration: 22, useNativeDriver: true }),
        Animated.timing(shakeRotate, { toValue: -8, duration: 22, useNativeDriver: true }),
        Animated.timing(shakeRotate, { toValue:  5, duration: 20, useNativeDriver: true }),
        Animated.timing(shakeRotate, { toValue:  0, duration: 16, useNativeDriver: true }),
      ]).start(() => {
        // Phase 2 — Launch up + dust burst (200ms)
        setDustVisible(true);
        dustProgress.setValue(0);
        Animated.parallel([
          Animated.timing(launchY,       { toValue: -40, duration: 140, useNativeDriver: true }),
          Animated.timing(launchOpacity, { toValue: 0,   duration: 140, useNativeDriver: true }),
          Animated.timing(dustProgress,  { toValue: 1,   duration: 300, useNativeDriver: true }),
        ]).start(() => {
          // Reset — slot now shows dim silhouette (empty styles)
          launchY.setValue(0);
          launchOpacity.setValue(1);
          setDustVisible(false);
          dustProgress.setValue(0);
        });
      });
    }
    prevFilled.current = filled;
  }, [filled, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const rotate = shakeRotate.interpolate({
    inputRange:  [-8, 8],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <View style={[tb.featherBox, { overflow: 'visible' }, inert && tb.featherBoxInert]}>
      <Animated.View
        style={{
          transform: [{ rotate }, { translateY: launchY }],
          opacity: launchOpacity,
        }}
      >
        <Image
          source={
            filled
              ? require('../../assets/ui/feather-life-filled.png')
              : require('../../assets/ui/feather-life-empty.png')
          }
          style={tb.featherImg}
          resizeMode="contain"
        />
      </Animated.View>
      {dustVisible && FEATHER_DUST_ANGLES.map((angle, i) => (
        <FeatherDustParticle key={i} angle={angle} progress={dustProgress} />
      ))}
    </View>
  );
}

const tb = StyleSheet.create({
  // The slab: front face (the normal bar) and back face (UNTRAPPABLE) share it.
  flipStage: {
    flex: 1,
  },
  flipFace: {
    backfaceVisibility: 'hidden',
  },
  armorBack: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: ARMOR_BACK_BG,
    paddingHorizontal: PW.space.md,
    paddingTop: 8,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  armorGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: ARMOR_GOLD,
  },
  armorRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: ARMOR_GOLD,
  },
  armorSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  armorBackWord: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pause used to live inside this row, eating ~42px (button + gap) from the
  // same row the feathers/gold-feather have to share. Moved to a floating
  // bottom-right button (see pauseBtn below) so the bar keeps that width —
  // this wrapper now holds only `root`, but stays a row so `root`'s `flex: 1`
  // still means "fill available width" instead of "fill available height."
  outerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: PW.space.screenX,
    marginTop: 4,
    marginBottom: 0,
  },
  // No flex: 1 here. Inside the flip slab this sits in a column, where flex: 1
  // collapses the height to zero and clips the bar. Width comes from stretch.
  root: {
    paddingHorizontal: PW.space.md,
    paddingTop: 14,
    paddingBottom: 15,
    borderRadius: 8,
    // Was 0.86 — see-through enough that the old, much darker sky behind it
    // never showed. Now that Hunt shares the lighter unified sky tint, that
    // same translucency lets it bleed through unevenly (solid over the score
    // row, patchy over the round chips below), making one continuous bar
    // read as two different ones. More opaque so it looks the same regardless
    // of what's behind it.
    backgroundColor: 'rgba(11,9,32,0.95)',
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Floating, bottom-right, in its own low lane: this is the pause button's
  // permanent home. At bottom 8 its top edge (52 pt up) sits below every one of
  // Polly's Hunt bubbles (PollyHuntVisit.tsx: normal bubble bottom 58, pointing
  // bubble bottom 76), so the pointing bubble, which reaches the right edge of
  // a 375 pt phone, never draws under it. The __DEV__-only boss-jump stack
  // (styles.devBossOverlay) is lifted above it (bottom 58) instead of behind it.
  // Pete's gold pause icon, the same size as every round icon button (ui/uiIconButton.ts).
  pauseBtn: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    zIndex: 200,
  },
  controlTarget: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 4,
    overflow: 'visible',
  },
  controlRungColumn: {
    width: 3,
    height: 44,
    flexDirection: 'column-reverse',
    gap: 3,
  },
  controlRung: {
    flex: 1,
    width: 3,
    borderRadius: 2,
  },
  controlTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  controlContext: {
    color: PW.color.lavender,
    fontSize: 13,
    lineHeight: 15,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  controlLabel: {
    color: PW.color.white,
    fontSize: 25,
    lineHeight: 27,
    // Bebas Neue, not FONTS.hud (Barlow Condensed) — this label is the
    // player's momentum state (STEADY/SHARP/RAZOR SHARP/UNTRAPPABLE), and
    // reuses the game's existing "this is a dramatic moment" face instead of
    // its plain UI face (Pete, 2026-09-12).
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(185,138,222,0.30)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  controlLabelFlash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    color: PW.color.white,
    textShadowColor: 'transparent',
  },
  controlLabelRattled: {
    color: PW.color.lavender,
    textShadowColor: 'rgba(185,138,222,0.48)',
  },
  featherRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  featherBox: {
    // On-device check confirmed room to spare at 18×32 — sized back up.
    width: 21,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featherBoxInert: {
    opacity: 0.35,
  },
  featherImg: {
    width: 21,
    height: 38,
  },
  featherBlade: {
    position: 'absolute',
    width: 7,
    height: 17,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 1,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 7,
    borderWidth: 1,
    transform: [{ rotate: '-24deg' }],
    shadowColor: PW.color.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 2,
    elevation: 2,
  },
  featherBladeFilled: {
    backgroundColor: PW.color.softWhite,
    borderColor: 'rgba(185,138,222,0.62)',
    shadowOpacity: 0.12,
  },
  featherHighlight: {
    position: 'absolute',
    top: 4,
    right: 1.5,
    width: 1.25,
    height: 7,
    borderRadius: 1,
    transform: [{ rotate: '28deg' }],
  },
  featherHighlightFilled: {
    backgroundColor: 'rgba(123,45,139,0.34)',
  },
  featherShaft: {
    position: 'absolute',
    top: 1,
    left: 4.25,
    width: 1,
    height: 17,
    borderRadius: 1,
    transform: [{ rotate: '-24deg' }],
  },
  featherShaftFilled: {
    backgroundColor: 'rgba(123,45,139,0.70)',
  },
  // A ten-round row has to fit INSIDE the bar's padding on both faces of the
  // flip. At 375 pt the bar is 347 wide; less its 12 pt padding and 1 pt
  // border each side, 319 pt is usable. The old 28 pt chips with 7 pt gaps
  // measured 343 and overflowed by about 11 pt a side, clipped against the
  // border on the front face too (unnoticed there only because that border is
  // a dim line, while the armor face rings it in gold). 26 + 5 measures 305
  // and leaves about 7 pt of air each side (Pete, 2026-11-03).
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  chip: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: PW.color.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    color: PW.color.softWhite,
  },
  chipLabelCurrent: {
    color: PW.color.lavender,
  },
  crownBase: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 4,
    borderRadius: 1,
    backgroundColor: PW.color.gold,
  },
  crownPoint: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: PW.color.gold,
    transform: [{ rotate: '45deg' }],
  },
  reserveFeatherWrap: {
    width:          11,
    height:         19,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     2,
  },
  reserveBlade: {
    width:  8,
    height: 16,
    borderColor: PW.color.goldSoft,
    backgroundColor: PW.color.goldGlow,
  },
  reserveShaft: {
    backgroundColor: PW.color.goldSoft,
    height: 15,
  },
  reservePlus: {
    position:   'absolute',
    top:        -7,
    right:      -4,
    color:      PW.color.gold,
    fontSize:   10,
    fontWeight: '700',
    lineHeight: 11,
  },
  goldFeatherWrap: {
    width: 25,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  goldFeatherImg: {
    width: 25,
    height: 44,
  },
});

// ─── INNER DIRECTOR ───────────────────────────────────────────

function GameDirector({ navigation }: { navigation: any }) {
  const vignetteId = useId();
  const reduceMotion = useReducedMotionPreference();
  const reduceFlashes = useReducedFlashesPreference();
  const { animateMotion, animateFlashes } = resolveGameplayFeedbackAccessibility(
    reduceMotion,
    reduceFlashes,
  );
  const game       = useGameStore(s => s.game);
  const ghosts     = useGameStore(s => s.ghosts);
  const startGame  = useGameStore(s => s.startGame);
  const forfeitGame = useGameStore(s => s.forfeitGame);
  const markOnboardingAbandoned = useGameStore(s => s.markOnboardingAbandoned);
  const onboarding = useGameStore(s => s.onboarding);
  const completeHudLesson = useGameStore(s => s.completeHudLesson);
  const consumeMercy = useGameStore(s => s.consumeMercy);
  const loadGoldFeather = useGameStore(s => s.loadGoldFeather);
  const checkGoldFeatherExpiry = useGameStore(s => s.checkGoldFeatherExpiry);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  // ── Exit guard — leaving mid-Hunt takes a real choice, never silence ────
  // beforeRemove fires for edge-swipe-back, Android back, and any
  // navigation away, so this is the one place that covers all three.
  const [pauseVisible, setPauseVisible] = useState(false);
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  const pendingExitActionRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (game.status !== 'playing' || isHuntExitGuardBypassed()) return;
      e.preventDefault();
      pendingExitActionRef.current = e.data.action;
      setPauseVisible(false);
      setExitConfirmVisible(true);
    });
    return unsubscribe;
  }, [navigation, game.status]);

  const preserveActiveHunt = useCallback(() => {
    // A run started in this process is not marked resumable until loadGame()
    // hydrates it on a later launch. Set the flag before temporary navigation
    // so Home says RESUME HUNT now, then force the pending snapshot to disk.
    useGameStore.setState({ hasResumableGame: true });
    return flushActiveGamePersistence().catch(() => {});
  }, []);

  const handlePause = useCallback(() => {
    if (game.status !== 'playing') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingExitActionRef.current = null;
    setExitConfirmVisible(false);
    setPauseVisible(true);
  }, [game.status]);

  const handleResumeHunt = useCallback(() => {
    setPauseVisible(false);
  }, []);

  const handlePauseHome = useCallback(() => {
    void preserveActiveHunt().then(() => {
      withHuntExitGuardBypass(() => {
        navigation.navigate('Home', undefined, { pop: true });
      });
    });
  }, [navigation, preserveActiveHunt]);

  const handlePauseSettings = useCallback(() => {
    // Keep pauseVisible true while Settings sits above Game. Back from
    // Settings therefore returns to the same deliberately paused Hunt.
    void preserveActiveHunt().then(() => {
      navigation.navigate('Settings', { preserveHunt: true });
    });
  }, [navigation, preserveActiveHunt]);

  const handlePauseQuit = useCallback(() => {
    pendingExitActionRef.current = null;
    setPauseVisible(false);
    setExitConfirmVisible(true);
  }, []);

  const handleStayHunting = useCallback(() => {
    pendingExitActionRef.current = null;
    setExitConfirmVisible(false);
    setPauseVisible(false);
  }, []);

  const handleConfirmLeave = useCallback(async () => {
    setExitConfirmVisible(false);
    const action = pendingExitActionRef.current;
    pendingExitActionRef.current = null;
    markOnboardingAbandoned('hunt');
    await forfeitGame();
    withHuntExitGuardBypass(() => {
      if (action) {
        navigation.dispatch(action);
      } else {
        navigation.navigate('Home', undefined, { pop: true });
      }
    });
  }, [navigation, forfeitGame, markOnboardingAbandoned]);

  // ── Effects overlay ────────────────────────────────────────
  const fxLayerRef    = useRef<FXLayerHandle>(null);

  const spawnEffect = useCallback(
    (type: 'shard' | 'trail', x: number, y: number, variant?: ShardVariant) => {
      if (type === 'shard') {
        fxLayerRef.current?.spawn({ type, x, y, variant });
      } else {
        fxLayerRef.current?.spawn({ type, x, y });
      }
    },
    []
  );

  // ── Flash overlay state ────────────────────────────────────
  const [redFlashKey,    setRedFlashKey]    = useState(0);
  const [goldFlash, setGoldFlash] = useState<{ key: number; event: ScreenFlashEvent }>({
    key: 0,
    event: 'gauntletCorrect',
  });

  const handleWrongSwipe = useCallback(() => setRedFlashKey(k => k + 1),    []);
  const handleGoldFlash = useCallback((event: ScreenFlashEvent) => {
    setGoldFlash(previous => ({ key: previous.key + 1, event }));
  }, []);

  // ── Idle/stuck-static timer ──────────────────────────────────
  const STATIC_IDLE_TIMEOUT_MS = 15000;
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isIdleStatic, setIsIdleStatic] = useState(false);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
    }
    setIsIdleStatic(false);
    idleTimerRef.current = setTimeout(() => {
      setIsIdleStatic(true);
    }, STATIC_IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (game.status !== 'playing' || pauseVisible || exitConfirmVisible) {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setIsIdleStatic(false);
      return;
    }
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [exitConfirmVisible, game.stepIndex, game.status, pauseVisible, resetIdleTimer]);

  // SFX session setup is app-owned and warmed from App.tsx. This holds the
  // initial reveal until the audio session is available; individual effects
  // load on demand, while music starts through the focused screen owner.
  const [audioReady, setAudioReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    sfxReady().then(() => {
      if (!cancelled) setAudioReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadGoldFeather().then(() => {
      checkGoldFeatherExpiry();
    });
  }, [loadGoldFeather, checkGoldFeatherExpiry]);

  // ── First-boss-only warning overlay ─────────────────────────────
  // The first encounter gates the board mount so its entrance, haptics, and
  // decision clock all begin after the player dismisses this explanation.
  const [bossIntroSeen, setBossIntroSeen] = useState<boolean | null>(null);
  const [bossTransitionActive, setBossTransitionActive] = useState(false);
  const skipBossTransitionStepRef = useRef<number | null>(null);
  const bossReadinessRef = useRef(createBossReadinessState());

  // ── Fatal-swipe death hold ───────────────────────────────────
  // Holds the board on-screen for the wrong-swipe death animation's full
  // 780ms (760ms under Reduce Motion — see SwipeMask.tsx) before letting
  // isDone swap to ResultsScreen. Only fires on a fresh transition into
  // gameOver; a session that resumes already-gameOver has no animation to
  // protect and must go straight to Results.
  const [deathHoldActive, setDeathHoldActive] = useState(false);
  const [deathHoldStatusSeen, setDeathHoldStatusSeen] = useState(game.status);
  // Entering the hold must happen synchronously during render, not in a
  // useEffect: an effect runs after React commits and paints, so a
  // fresh gameOver render would still paint with the stale (false)
  // deathHoldActive first — a visible flash to Results and back to the
  // board before the effect could catch up. Adjusting state during
  // render (React's documented pattern for this) makes React redo the
  // render with the new value before anything is ever painted.
  if (game.status !== deathHoldStatusSeen) {
    if (game.status === 'gameOver' && deathHoldStatusSeen === 'playing') {
      setDeathHoldActive(true);
    }
    setDeathHoldStatusSeen(game.status);
  }
  useEffect(() => {
    if (!deathHoldActive) return;
    const timer = setTimeout(() => setDeathHoldActive(false), 780);
    return () => clearTimeout(timer);
  }, [deathHoldActive]);
  useEffect(() => {
    AsyncStorage.getItem(BOSS_INTRO_SEEN_KEY)
      .then(v => setBossIntroSeen(v === 'true'))
      .catch(() => setBossIntroSeen(true));
  }, []);
  const handleBossIntroDismiss = useCallback(() => {
    skipBossTransitionStepRef.current = game.stepIndex;
    setBossIntroSeen(true);
    AsyncStorage.setItem(BOSS_INTRO_SEEN_KEY, 'true').catch(() => {});
  }, [game.stepIndex]);

  // ── First-haunt-only explainer overlay ──────────────────────────
  const [hauntIntroSeen, setHauntIntroSeen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(HAUNT_INTRO_SEEN_KEY)
      .then(v => setHauntIntroSeen(v === 'true'))
      .catch(() => setHauntIntroSeen(true));
  }, []);
  const [hauntIntroVisitPending, setHauntIntroVisitPending] = useState(false);
  const handleHauntIntroDismiss = useCallback(() => {
    setHauntIntroSeen(true);
    setHauntIntroVisitPending(true);
    AsyncStorage.setItem(HAUNT_INTRO_SEEN_KEY, 'true').catch(() => {});
  }, []);

  // ── One Heart Left — dramatic feedback when lives drop to 1 ──
  const boardShakeX = useRef(new Animated.Value(0)).current;
  const boardShakeY = useRef(new Animated.Value(0)).current;
  const featherRowPulse = useRef(new Animated.Value(0)).current;
  const prevLivesForShakeRef = useRef(game.lives);

  useEffect(() => {
    const prev = prevLivesForShakeRef.current;
    prevLivesForShakeRef.current = game.lives;
    if (prev !== 2 || game.lives !== 1) return;
    boardShakeX.stopAnimation();
    boardShakeY.stopAnimation();
    boardShakeX.setValue(0);
    boardShakeY.setValue(0);
    if (animateMotion) {
      // Lighter board shake (4 quick jolts, not the heavy boss shake)
      Animated.sequence([
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: 3,  duration: 30, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: -2, duration: 30, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: -3, duration: 30, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: 2,  duration: 30, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: 2,  duration: 25, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: -1, duration: 25, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: 0,  duration: 40, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: 0,  duration: 40, useNativeDriver: true }),
        ]),
      ]).start();
    }
    featherRowPulse.setValue(0);
    if (animateFlashes) {
      // Feather row red pulse
      Animated.sequence([
        Animated.timing(featherRowPulse, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(featherRowPulse, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [game.lives]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── HUD lesson spotlight targets ─────────────────────────────
  const featherTargetRef = useRef<View>(null);
  const streakTargetRef = useRef<View>(null);
  const roundsTargetRef = useRef<View>(null);
  const momentumBarTargetRef = useRef<View>(null);
  // The bar's own refs. Each ref belongs to exactly one view: never alias two
  // entries to the same RefObject, or the later view to mount overwrites
  // .current and the spotlight measures the wrong box.
  const hudTargets = useMemo<HudTargetRefs>(() => ({
    feathers: featherTargetRef,
    streak: streakTargetRef,
    rounds: roundsTargetRef,
    momentumBar: momentumBarTargetRef,
  }), []);
  // What the LESSON LAYER measures, which is not always what the bar renders.
  // While armor holds, the top bar is flipped to the UNTRAPPABLE face and the
  // run meter on the front face is turned away: a lesson spotlighting it
  // highlights a slice of the back face and points the arrow at nothing. The
  // slab IS the run meter in that moment. Remapping here (and not in
  // hudTargets) keeps every ref attached to one view only.
  // Reachable in real play: lessons never land on Polly's Word or a Returning
  // Haunt, so a streak built through one can come out already armored with the
  // run-meter lesson still owed. Feather and round-chip targets need no
  // fallback: a real feather loss resets the streak (armor off), an
  // armor-absorbed miss never makes the feather lesson due, and the round-chip
  // lesson only fires in the first-run hand-off, far below nine.
  const hudBarFlipped = isArmored(game);
  const hudLessonTargets = useMemo<HudTargetRefs>(() => ({
    ...hudTargets,
    streak: hudBarFlipped ? momentumBarTargetRef : streakTargetRef,
  }), [hudTargets, hudBarFlipped]);
  const [hudLessonShowing, setHudLessonShowing] = useState(false);

  const prevTensionRef = useRef(0);

  useEffect(() => {
    const step = currentStep(game);
    if (step.kind !== 'word') return;

    const phaseFloor = (role: typeof step.emotionalRole): number => {
      switch (role) {
        case 'confidence':
        case 'flow':
          return 0;
        case 'firstTension':
        case 'tension':
          return 1;
        case 'panic':
        case 'adrenaline':
          return 2;
        case 'finalBoss':
          return 3;
        default:
          return 0;
      }
    };

    let t = phaseFloor(step.emotionalRole);
    if (step.eventType === 'bossWord') t = 3;
    if (game.lives === 1) t = Math.min(t + 1, 3);
    if (missedCount >= 2) t = Math.min(t + 1, 3);

    if (t > prevTensionRef.current) {
      Haptics.selectionAsync();
    }
    prevTensionRef.current = t;
    setTension(t);
  }, [game.stepIndex, game.lives, missedCount, setTension]);

  useEffect(() => { setMissedCount(0); }, [game.stepIndex]);

  // ── Fledgling Mercy — Polly revives her prey once ─────────────
  const mercyFloatY       = useRef(new Animated.Value(0)).current;
  const mercyFloatOpacity = useRef(new Animated.Value(0)).current;
  const [showMercyFloat, setShowMercyFloat] = useState(false);

  useEffect(() => {
    if (!game.mercyTriggered) return;
    consumeMercy();
    // The first Mercy on an ordinary word is explained by the Mercy HUD lesson
    // instead (Pete, 2026-11-09): no float, squawk or haptic here, so the
    // player never gets both. The lesson was captured in the same store update
    // as the revive. Every later Mercy plays this beat unchanged.
    if (mercyLessonOwnsRevive(onboarding, game.runSeed)) return;
    playSfx('pollySqwawkLaugh');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    mercyFloatY.setValue(0);
    mercyFloatOpacity.setValue(0);
    setShowMercyFloat(true);
    const mercyEnter: Animated.CompositeAnimation[] = [
      Animated.timing(mercyFloatOpacity, {
        toValue: 1, duration: 220, useNativeDriver: true,
      }),
    ];
    const mercyExit: Animated.CompositeAnimation[] = [
      Animated.timing(mercyFloatOpacity, {
        toValue: 0, duration: 320, useNativeDriver: true,
      }),
    ];
    if (animateMotion) {
      mercyEnter.push(Animated.timing(mercyFloatY, {
        toValue: -10, duration: 220, useNativeDriver: true,
      }));
      mercyExit.push(Animated.timing(mercyFloatY, {
        toValue: -36, duration: 320, useNativeDriver: true,
      }));
    }
    Animated.sequence([
      Animated.parallel(mercyEnter),
      Animated.delay(1400),
      Animated.parallel(mercyExit),
    ]).start(() => setShowMercyFloat(false));
  }, [game.mercyTriggered]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Music Engine lifecycle ────────────────────────────────────
  // Tied to navigation focus, not mount/unmount: native-stack keeps the
  // outgoing and incoming screens both mounted during the transition
  // animation, so a mount/unmount effect here would overlap with whatever
  // screen is fading out, bleeding both tracks together.
  useFocusEffect(
    useCallback(() => {
      startMusic('hunt');
      return () => {
        stopMusic('hunt');
      };
    }, []),
  );

  // ── Music state machine ───────────────────────────────────────
  useEffect(() => {
    if (game.status !== 'playing') {
      setMusicState('hunt', 'off');
      return;
    }
    const activeStep = currentStep(game);
    const isBossStep = activeStep.kind === 'word' && activeStep.eventType === 'bossWord';

    let state: MusicState;
    if (isBossStep) {
      state = 'boss';
    } else if (game.lives <= 2) {
      state = 'crisis';
    } else if (isIdleStatic) {
      state = 'static';
    } else if (game.chainMultiplier >= 2.5) {
      state = 'untrappable';
    } else if (game.chainMultiplier >= 2.0) {
      state = 'onARun';
    } else if (game.chainMultiplier >= 1.5) {
      state = 'rhythm';
    } else {
      state = 'neutral';
    }
    setMusicState('hunt', state);
  }, [game.chainMultiplier, game.lives, game.stepIndex, game.status, isIdleStatic]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wall strain: the stone wall vibrates harder as momentum builds ──
  // Still at STEADY, and still at HUNTED (one feather left): the wall only
  // shakes for a streak that is actually alive. Reduced motion keeps it still.
  // The tier read is the HUD's own (resolveLiveHuntControl), so the wall can
  // never disagree with the label on screen.
  const wallStrainTier: WallStrainTier = useMemo(() => {
    if (!animateMotion || game.status !== 'playing') return 0;
    const control = resolveLiveHuntControl(game.chainMultiplier, game.lives);
    if (control.tier === 'rattled') return 0;
    switch (control.readTier) {
      case 'sharp': return 1;
      case 'razorSharp': return 2;
      case 'untrappable': return 3;
      default: return 0;
    }
  }, [animateMotion, game.chainMultiplier, game.lives, game.status]);

  useEffect(() => {
    setWallStrain(wallStrainTier);
  }, [wallStrainTier]);

  // The four fall cues load on demand, so a cue's first play would wait on a
  // native load. Warm them once when the Hunt opens, with the armor flip and
  // the wrong-swipe slap, whistle and book-shut slam.
  useEffect(() => {
    warmWallFallSfx();
    warmArmorFlipSfx();
    warmHuntSwipeSfx();
  }, []);

  // Fell-off: the wall falls down a hole, then the camera falls after it and
  // lands on top (wallShake.ts). Fires from the
  // same store field as the HUD's FELL OFF effect, so it matches it exactly,
  // and a gauntlet miss (which never sets that field) can never trigger it.
  useEffect(() => {
    if (game.fellOffSeverity === null || !animateMotion) return;
    fallWall(game.fellOffSeverity);
  }, [game.fellOffSeverity]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      resetWallStrain();
      resetWallFall();
    },
    [],
  );

  function handleRestart() {
    startGame();
    setMissedCount(0);
  }

  function handleHome() {
    navigation.navigate('Home', undefined, { pop: true });
  }

  function handleDevJumpToBoss(livesOverride?: number, baseGame?: GameState) {
    if (!__DEV__) return;

    const currentGame = baseGame ?? useGameStore.getState().game;
    const bossIndex = currentGame.session.findIndex(
      step => step.kind === 'word' && step.eventType === 'bossWord'
    );
    if (bossIndex === -1) return;

    useGameStore.setState({
      game: {
        ...currentGame,
        stepIndex: bossIndex,
        lives: livesOverride ?? currentGame.lives,
        swipedUpIds: [],
        swipedDownIds: [],
        revealedHiddenMasks: {},
        mistakesOnWord: 0,
        feedback: null,
        lastActionAt: Date.now(),
        pollyTrigger: null,
        streakMilestone: null,
        featherMilestone: null,
        fellOffSeverity: null,
      },
    });
    setMissedCount(0);
  }

  // DEV: swaps this Hunt's Boss for a real MASTER'S REMATCH (app/game/devMasteryRematch.ts),
  // then jumps to it like BOSS. Changes only the live Hunt; judging runs the normal store path.
  function handleDevJumpToRematch() {
    if (!__DEV__) return;
    const { game: currentGame, progress, ghosts } = useGameStore.getState();
    const rematch = applyDevMasteryRematch(
      currentGame,
      progress.masteredWords.map((record) => record.word),
      ghosts.map((ghost) => ghost.wordId),
    );
    if (!rematch) return;
    handleDevJumpToBoss(undefined, rematch);
  }

  const isDone =
    (game.status === 'complete' || game.status === 'gameOver') && !deathHoldActive;
  const activeStep = currentStep(game);
  const isBossRound =
    !isDone &&
    activeStep.kind === 'word' &&
    activeStep.eventType === 'bossWord';
  const isHauntRound =
    !isDone &&
    activeStep.kind === 'word' &&
    activeStep.isHauntReturn === true;

  useEffect(() => {
    if (!isBossRound) {
      bossReadinessRef.current = createBossReadinessState();
      return;
    }
    const entered = markBossEntered(
      bossReadinessRef.current,
      game.stepIndex,
      Date.now(),
    );
    bossReadinessRef.current = entered.state;
    if (entered.shouldRecord) {
      recordPlaytestEvent('boss_entered', { round: game.stepIndex + 1 });
    }
  }, [game.stepIndex, isBossRound]);

  const handleBossDecisionReady = useCallback(() => {
    const stepIndex = useGameStore.getState().game.stepIndex;
    const playable = markBossPlayable(
      bossReadinessRef.current,
      stepIndex,
      Date.now(),
    );
    bossReadinessRef.current = playable.state;
    if (playable.transitionMs !== null) {
      recordPlaytestEvent('boss_playable', {
        round: stepIndex + 1,
        transitionMs: playable.transitionMs,
      });
    }
  }, []);

  useEffect(() => {
    if (!isBossRound || bossIntroSeen !== true) {
      setBossTransitionActive(false);
      return;
    }
    if (skipBossTransitionStepRef.current === game.stepIndex) {
      skipBossTransitionStepRef.current = null;
      setBossTransitionActive(false);
      return;
    }
    setBossTransitionActive(true);
    // Heavier board shake on boss entrance — sells the weight of the moment
    boardShakeX.stopAnimation();
    boardShakeY.stopAnimation();
    boardShakeX.setValue(0);
    boardShakeY.setValue(0);
    if (animateMotion) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: 5, duration: 40, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: -3, duration: 40, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: -5, duration: 40, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: 3, duration: 40, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: 3, duration: 35, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: -2, duration: 35, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: -3, duration: 35, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: 2, duration: 35, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(boardShakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.timing(boardShakeY, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
      ]).start();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const timer = setTimeout(() => {
      setBossTransitionActive(false);
    }, 760);
    return () => clearTimeout(timer);
  }, [game.stepIndex, bossIntroSeen, isBossRound]);

  useEffect(() => {
    if (!isHauntRound || activeStep.kind !== 'word') return;
    const word = activeStep.word;
    const runsWaited = ghosts.find(
      ghost => ghost.wordId === word.trim().toUpperCase(),
    )?.runsMissed ?? 0;
    recordPlaytestEvent('haunt_reached', { word, runsWaited });
  }, [game.stepIndex, isHauntRound]); // eslint-disable-line react-hooks/exhaustive-deps

  const gameplayGateActive =
    (isBossRound && bossIntroSeen !== true) ||
    (isHauntRound && hauntIntroSeen !== true) ||
    bossTransitionActive ||
    !audioReady;

  useEffect(() => {
    if (!gameplayGateActive || game.status !== 'playing') return;
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setIsIdleStatic(false);
  }, [gameplayGateActive, game.status]);

  // ── HUD lessons ───────────────────────────────────────────────
  // The board locks itself from the same rule (resolveOnboardingInputMode);
  // this only decides what the lesson layer presents. Never over Results,
  // the death hold, or a gate that has unmounted the board.
  const hudLesson = !isDone && !gameplayGateActive ? resolveHudLesson(onboarding, game) : null;
  const hudLessonActive = hudLesson !== null;
  const hudLessonWasActiveRef = useRef(false);
  useEffect(() => {
    const wasActive = hudLessonWasActiveRef.current;
    hudLessonWasActiveRef.current = hudLessonActive;
    if (game.status !== 'playing') return;
    if (hudLessonActive) {
      // A lesson is not idling: keep the 15 s static-music timer off it.
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setIsIdleStatic(false);
    } else if (wasActive) {
      resetIdleTimer();
    }
  }, [hudLessonActive, game.status, resetIdleTimer]);
  const hudTargetLabels = useMemo<Record<HudLessonTarget, string>>(() => {
    const hudStep = currentStep(game);
    const hudState = resolveHuntHud({
      chainMultiplier: game.chainMultiplier,
      lives: game.lives,
      isHauntReturn: hudStep.kind === 'word' && hudStep.isHauntReturn === true,
      isMasteredReturn: hudStep.kind === 'word' && hudStep.isMasteredReturn === true,
      isBossWord: hudStep.kind === 'word' && hudStep.eventType === 'bossWord',
      isGauntletActive: game.gauntletActive,
    });
    const hud = {
      lives: Math.max(0, Math.min(MAX_FEATHERS, game.lives)),
      streakLabel: hudState.label,
      round: game.stepIndex + 1,
      totalRounds: game.session.length,
    };
    return {
      feathers: hudTargetAccessibilityLabel('feathers', hud),
      streak: hudTargetAccessibilityLabel('streak', hud),
      rounds: hudTargetAccessibilityLabel('rounds', hud),
      momentumBar: hudTargetAccessibilityLabel('momentumBar', hud),
    };
  }, [game]);

  return (
    <View style={styles.screen}>
      <AmbientSkyBackground {...(isBossRound ? BOSS_SKY_TUNING : HUNT_SKY_TUNING)} />
      {/* Radial vignette, not a flat top-to-bottom scrim: keeps the hero word
          card's stage clear (so the starfield behind it actually reads) while
          still darkening the edges for focus. Replaces a prior flat gradient
          that smothered the ambient sky layers in the middle of the screen. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id={`gameVignette-${vignetteId}`} cx="50%" cy="30%" r="72%">
            <Stop offset="0%" stopColor={PW.color.bgDeep} stopOpacity={0.24} />
            <Stop offset="45%" stopColor={PW.color.bgDeep} stopOpacity={0.20} />
            {/* Was rose-tinted for boss specifically — dropped 2026-08-02,
                same rule as ambientSkyTuning.ts: one background family,
                no per-screen exceptions. */}
            <Stop offset="100%" stopColor={PW.color.bgDeep} stopOpacity={0.56} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#gameVignette-${vignetteId})`} />
      </Svg>
      <SafeAreaView style={styles.content}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: boardShakeX }, { translateY: boardShakeY }, { translateY: fgLandY }, { scale: fgLandScale }] }}>
      {isBossRound && (
        <View pointerEvents="none" style={styles.bossBackground}>
          <View style={styles.bossBookGlow}>
            <View style={styles.bossBookGlowCore} />
          </View>
          <LinearGradient
            colors={[
              'rgba(15,13,42,0.30)',
              'rgba(15,13,42,0.00)',
              'rgba(15,13,42,0.04)',
              'rgba(15,13,42,0.34)',
            ]}
            locations={[0, 0.30, 0.70, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              'rgba(15,13,42,0.22)',
              'rgba(15,13,42,0.00)',
              'rgba(15,13,42,0.22)',
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {!isDone && (
        <TopBar
          navigation={navigation}
          featherRowPulse={featherRowPulse}
          hudTargets={hudTargets}
          a11yHidden={hudLessonShowing || pauseVisible || exitConfirmVisible}
        />
      )}
      {!isDone && (
        <UiIconButton
          {...a11yHiddenProps(hudLessonShowing || pauseVisible || exitConfirmVisible)}
          kind="pause"
          accessibilityLabel="Pause the Hunt"
          onPress={handlePause}
          style={tb.pauseBtn}
        />
      )}
      {isDone ? (
        <ResultsScreen onRestart={handleRestart} onHome={handleHome} />
      ) : !gameplayGateActive ? (
        <GameContent
          spawnEffect={spawnEffect}
          onWrongSwipe={handleWrongSwipe}
          onGoldFlash={handleGoldFlash}
          onBossDecisionReady={handleBossDecisionReady}
          onSwipeAttempt={resetIdleTimer}
          fireHauntIntroVisit={hauntIntroVisitPending}
          onHauntIntroVisitFired={() => setHauntIntroVisitPending(false)}
          a11yHidden={hudLessonShowing || pauseVisible || exitConfirmVisible}
        />
      ) : null}
      {__DEV__ && !isDone && <DevWindowReadout />}
      {__DEV__ && !isDone && !isBossRound && (
        <View pointerEvents="box-none" style={styles.devBossOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to boss round"
            onPress={() => handleDevJumpToBoss()}
            style={styles.devBossButton}
          >
            <Text allowFontScaling={false} style={styles.devBossButtonText}>BOSS</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to boss round with two lives remaining"
            onPress={() => handleDevJumpToBoss(2)}
            style={[styles.devBossButton, styles.devBossButtonCrisis]}
          >
            <Text allowFontScaling={false} style={styles.devBossButtonText}>BOSS{'\n'}(CRISIS)</Text>
          </Pressable>
          {/* Dev tool (Pete, 2026-11-10): starts a real MASTER'S REMATCH to test the KING counter. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dev: jump to a Master's Rematch"
            onPress={() => handleDevJumpToRematch()}
            style={styles.devBossButton}
          >
            <Text allowFontScaling={false} style={styles.devBossButtonText}>REMATCH</Text>
          </Pressable>
          {/* Dev tool: plays the wall fall at its largest size, bypassing gameplay (for tuning the fall's look and sounds). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dev: play the wall fall at the largest size"
            onPress={() => {
              fallWall(3);
            }}
            style={styles.devBossButton}
          >
            <Text allowFontScaling={false} style={styles.devBossButtonText}>FALL 3</Text>
          </Pressable>
          {/* Dev tool: steps the streak 0 -> 9 -> 12 -> 15 -> 18 -> 0 so the UNTRAPPABLE flip and its four pulse levels can be seen without playing nine words. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dev: step the streak to preview the UNTRAPPABLE flip"
            onPress={() => {
              const steps = [0, 9, 12, 15, 18];
              const g = useGameStore.getState().game;
              const next = steps[(steps.indexOf(g.streak) + 1) % steps.length] ?? 9;
              useGameStore.setState({
                game: { ...g, streak: next, chainMultiplier: chainMultiplierForStreak(next) },
              });
            }}
            style={styles.devBossButton}
          >
            <Text allowFontScaling={false} style={styles.devBossButtonText}>ARMOR{'\n'}STEP</Text>
          </Pressable>
          {/* Dev tool (Pete, 2026-11-03): replays the HUD lessons without Settings >
              Reset Progress. Clears every lesson flag and puts the streak at 9, so
              the run-meter lesson lands first and the armor lesson right after it.
              Only the lesson flags are cleared; real progress is untouched. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dev: replay the HUD lessons from the run meter up"
            onPress={() => {
              useGameStore.getState().devReplayHudLessons();
              const g = useGameStore.getState().game;
              useGameStore.setState({
                game: { ...g, streak: 9, chainMultiplier: chainMultiplierForStreak(9) },
              });
            }}
            style={styles.devBossButton}
          >
            <Text allowFontScaling={false} style={styles.devBossButtonText}>REPLAY{'\n'}LESSONS</Text>
          </Pressable>
          {/* Dev tool (Pete, 2026-11-09): arms the REAL Mercy on the current
              ordinary word. One feather left and a revive armed (the Hunt's own
              amount, or 3 when this Hunt has none), the streak reset so armor
              cannot absorb the miss. The next wrong swipe then runs
              resolveLifeLoss and the lesson capture exactly as in play. Does
              nothing while any HUD lesson is due or showing. Changes only the
              live Hunt, never progress or runsCompleted. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dev: arm Mercy so the next wrong swipe revives"
            onPress={() => {
              const { game: g, onboarding: ob } = useGameStore.getState();
              if (hudLessonShowing || !devMercyArmAllowed(ob, g)) return;
              useGameStore.setState({
                game: {
                  ...g,
                  lives: 1,
                  mercyReviveLives: g.mercyReviveLives > 0 ? g.mercyReviveLives : FLEDGLING_MERCY_LIVES,
                  streak: 0,
                  chainMultiplier: chainMultiplierForStreak(0),
                },
              });
            }}
            style={styles.devBossButton}
          >
            <Text allowFontScaling={false} style={styles.devBossButtonText}>MERCY</Text>
          </Pressable>
        </View>
      )}

      {/* ── Flash overlays — zIndex 50, above game content ── */}
      <RedFlash    flashKey={redFlashKey} />
      <GoldFlash   flashKey={goldFlash.key} event={goldFlash.event} />

      {/* ── Effects overlay — pointerEvents none, zIndex 100 ── */}
      <View style={styles.effectsOverlay} pointerEvents="none">
        {showMercyFloat && (
          <Animated.Text
            allowFontScaling={false}
            style={[
              gs.mercyFloat,
              {
                opacity:   mercyFloatOpacity,
                transform: [{ translateY: mercyFloatY }],
              },
            ]}
          >
            POLLY ISN'T DONE WITH YOU
          </Animated.Text>
        )}
      </View>

      <FXLayer ref={fxLayerRef} />

      <HudLessonLayer
        lesson={pauseVisible || exitConfirmVisible ? null : hudLesson}
        targets={hudLessonTargets}
        targetLabels={hudTargetLabels}
        onComplete={completeHudLesson}
        onShowingChange={setHudLessonShowing}
        context={{ mercyFeathers: hudLesson === 'mercy' ? onboarding.hudLessons.mercyPendingFeathers : null }}
      />

      {bossIntroSeen === false && isBossRound && (
        <BossIntroOverlay onDismiss={handleBossIntroDismiss} />
      )}

      {hauntIntroSeen === false && isHauntRound && (
        <HauntIntroOverlay onDismiss={handleHauntIntroDismiss} />
      )}

      {bossTransitionActive && isBossRound && (
        <View style={styles.bossTransition} pointerEvents="none" accessible accessibilityLabel="Polly's Word. One last breath.">
          <Text allowFontScaling={false} style={styles.bossTransitionKicker}>
            {activeStep.kind === 'word' && activeStep.isMasteryRematch ? "MASTER'S REMATCH" : "POLLY'S WORD"}
          </Text>
          <Text allowFontScaling={false} style={styles.bossTransitionCopy}>ONE LAST BREATH</Text>
        </View>
      )}

      {pauseVisible && !exitConfirmVisible && (
        <HuntPauseMenu
          onResume={handleResumeHunt}
          onHome={handlePauseHome}
          onSettings={handlePauseSettings}
          onQuit={handlePauseQuit}
        />
      )}

      {exitConfirmVisible && (
        <PollyExitConfirm onStay={handleStayHunting} onLeave={handleConfirmLeave} />
      )}
      </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// DEV ONLY (Pete, 2026-11-09): the phone's real logical window, pixel ratio and font scale, so
// the card-to-ledge layout can be checked against real values (Display Zoom changes the window).
// Rendered only under __DEV__, bottom-left of the Hunt screen; never in a production build.
function DevWindowReadout() {
  const { width, height, fontScale } = useWindowDimensions();
  return (
    <Text allowFontScaling={false} pointerEvents="none" style={styles.devWindowReadout}>
      {`${Math.round(width * 100) / 100} x ${Math.round(height * 100) / 100}  PR ${PixelRatio.get()}  font ${fontScale.toFixed(2)}`}
    </Text>
  );
}

// ─── GAME CONTENT ─────────────────────────────────────────────

function GameContent({
  spawnEffect,
  onWrongSwipe,
  onGoldFlash,
  onBossDecisionReady,
  onSwipeAttempt,
  fireHauntIntroVisit,
  onHauntIntroVisitFired,
  a11yHidden,
}: {
  spawnEffect: (type: 'shard' | 'trail', x: number, y: number) => void;
  onWrongSwipe: () => void;
  onGoldFlash: (event: ScreenFlashEvent) => void;
  onBossDecisionReady: () => void;
  onSwipeAttempt: () => void;
  fireHauntIntroVisit: boolean;
  onHauntIntroVisitFired: () => void;
  a11yHidden: boolean;
}) {
  const game = useGameStore(s => s.game);
  const ghosts = useGameStore(s => s.ghosts);
  const pollyMemory = useGameStore(s => s.pollyMemory);
  const progress = useGameStore(s => s.progress);
  const onboarding = useGameStore(s => s.onboarding);
  const recordOnboardingDecision = useGameStore(s => s.recordOnboardingDecision);
  const [onboardingVisitActive, setOnboardingVisitActive] = useState(false);
  // `${runSeed}:${stepIndex}` of the board whose plate entrance has settled.
  const [settledBoardKey, setSettledBoardKey] = useState<string | null>(null);
  // Count of wrong swipes that did not break a real chain, kept for the whole
  // Hunt. The board remounts on every word (key=board-stepIndex), so the count
  // cannot live inside it. Drives Polly's "every third" squawk.
  const wrongSquawkCounter = useRef({ current: 0 }).current;
  useEffect(() => { wrongSquawkCounter.current = 0; }, [game.runSeed, wrongSquawkCounter]);
  const step = currentStep(game);
  const activeGhostRunsMissed = step.kind === 'word' && step.isHauntReturn
    ? ghosts.find(ghost => ghost.wordId === step.word.trim().toUpperCase())?.runsMissed ?? 0
    : 0;
  const relationshipContext = derivePollyRelationshipContext({
    memory: pollyMemory,
    recent: progress.recentHuntPerformance ?? [],
    runsCompleted: progress.runsCompleted,
    masteredCount: progress.masteredWords.length,
    now: Date.now(),
    word: step.kind === 'word' ? step.word : null,
  });
  // The active Ghost owns current queue timing; durable rivalry memory owns
  // shared history across restarts. Use the stronger proven count so Polly's
  // rematch body language never forgets a battle the Ghost queue still knows.
  const ghostRunsMissed = step.kind === 'word' && step.isHauntReturn
    ? Math.max(
        activeGhostRunsMissed,
        relationshipContext.relevantWordRivalry?.hauntHolds ?? 0,
      )
    : 0;
  const hauntRelationshipDecision = step.kind === 'word' && step.isHauntReturn
    ? resolvePollyRelationshipBeat({
        context: relationshipContext,
        surface: 'wordEntry',
      })
    : null;
  // Stable per board without storing another piece of relationship state.
  // Fresh-line filtering still prevents the recent authored lines repeating.
  const hauntRelationshipPresentation = resolvePollyRelationshipPresentation({
    decision: hauntRelationshipDecision,
    recentLineIds: pollyMemory.recentLineIds,
    lineRoll: ((game.stepIndex + 1) * 0.61803398875) % 1,
  });

  // Visit layer lives HERE, above MaskBoard's per-word remount boundary
  // (key={stepIndex}) — word-completion beats must outlive the board.
  const { visit, onVisitDone, firePollyEvent, dismissVisits } = usePollyVisits(
    step.kind === 'word' && step.eventType === 'speedRound',
    ghostRunsMissed,
    hauntRelationshipPresentation?.moment ?? null,
  );

  // A due HUD lesson owns the moment, and its own Polly line closes it. The
  // wrong-call or one-heart reaction fired by the same swipe never shows: it
  // is dropped here, not parked to replay once the lesson is over.
  const hudLessonDue = resolveHudLesson(onboarding, game) !== null;
  useEffect(() => {
    if (hudLessonDue) dismissVisits();
  }, [hudLessonDue, dismissVisits]);

  useEffect(() => {
    if (!fireHauntIntroVisit) return;
    firePollyEvent('hauntIntro');
    onHauntIntroVisitFired();
  }, [fireHauntIntroVisit, firePollyEvent, onHauntIntroVisitFired]);

  if (step.kind === 'word') {
    // Same predicate GameDirector uses for isBossRound, so routing here and
    // the boss background/scrim there stay in lockstep.
    const isBossStep = step.eventType === 'bossWord';
    const Board = isBossStep ? BossBoard : MaskBoard;
    const inputMode = isBossStep ? 'both' : resolveOnboardingInputMode(onboarding, game);
    const boardPresentation = isBossStep
      ? { showDecisionCard: true, swipeCueMode: 'both' as const }
      : resolveOnboardingBoardPresentation(onboarding, game);
    const onboardingCaption = isBossStep
      ? null
      : resolveOnboardingCaption(onboarding, game);
    const activeOnboarding = onboarding.activeRun?.runSeed === game.runSeed &&
      onboarding.activeRun.mode === game.onboardingMode;
    const suppressReactivePolly = hudLessonDue || (activeOnboarding &&
      (onboarding.activeRun?.phase !== 'complete' || onboardingVisitActive));
    const boardPollyEvent = suppressReactivePolly ? (() => {}) : firePollyEvent;
    const boardKey = `${game.runSeed}:${game.stepIndex}`;
    return (
      <View style={{ flex: 1 }} {...a11yHiddenProps(a11yHidden)}>
        <Board
          key={`board-${game.stepIndex}`}
          step={step}
          spawnEffect={spawnEffect}
          onWrongSwipe={onWrongSwipe}
          onGoldFlash={onGoldFlash}
          onBossDecisionReady={onBossDecisionReady}
          onSwipeAttempt={onSwipeAttempt}
          inputMode={inputMode}
          showDecisionCard={boardPresentation.showDecisionCard}
          swipeCueMode={boardPresentation.swipeCueMode}
          onboardingCaption={onboardingCaption}
          onboardingCaptionReserve={isBossStep ? 0 : resolveOnboardingCaptionReserve(game)}
          onEntranceSettled={recognitionOpensWithHold(onboarding, game)
            ? () => setSettledBoardKey(boardKey)
            : undefined}
          onDecisionCommitted={({ maskId, direction, correct, responseMs }) => {
            recordOnboardingDecision(maskId, direction, correct, responseMs);
          }}
          firePollyEvent={boardPollyEvent}
          wrongSquawkCounter={wrongSquawkCounter}
        />
        {!onboardingVisitActive && !hudLessonDue && (
          <PollyHuntVisit visit={visit} onDone={onVisitDone} />
        )}
        {activeOnboarding && (
          <FirstRunHuntOnboarding
            onVisitActivityChange={setOnboardingVisitActive}
            plateSettled={settledBoardKey === boardKey}
          />
        )}
      </View>
    );
  }

  return null;
}

// ─── ROOT EXPORT ─────────────────────────────────────────────

export default function GameScreen({ navigation }: { navigation: any }) {
  return (
    <HeartbeatProvider>
      <GameDirector navigation={navigation} />
    </HeartbeatProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1830',
  },
  // The background layers sit on the outer View so they reach the true screen
  // edges; this holds everything that should respect the safe-area insets.
  content: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  bossBackground: {
    ...StyleSheet.absoluteFill,
  },
  bossBookGlow: {
    position: 'absolute',
    top: 72,
    left: '6%',
    right: '6%',
    height: 230,
    borderRadius: 150,
    // Was PW.color.rose at low opacity — dropped 2026-08-02 along with the
    // other boss-specific rose accents; PW.color.purple instead, same family
    // as everything else now.
    backgroundColor: 'rgba(123,45,139,0.08)',
  },
  bossBookGlowCore: {
    position: 'absolute',
    top: 48,
    bottom: 48,
    left: '16%',
    right: '16%',
    borderRadius: 90,
    backgroundColor: 'rgba(185,138,222,0.05)',
  },
  bossTransition: {
    ...StyleSheet.absoluteFill,
    zIndex: 290,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,13,42,0.94)',
  },
  bossTransitionKicker: {
    color: PW.color.lavender,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 34,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  bossTransitionCopy: {
    marginTop: 8,
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 3,
  },
  devWindowReadout: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    zIndex: 200,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.72)',
    color: '#FFFFFF',
    fontSize: 11,
  },
  devBossOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 58,
    zIndex: 200,
    gap: 6,
    alignItems: 'flex-end',
  },
  devBossButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.surfaceDeep,
    opacity: 0.72,
  },
  devBossButtonCrisis: {
    borderColor: '#CC2200',
  },
  devBossButtonText: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  effectsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
});

const gs = StyleSheet.create({
  mercyFloat: {
    position:   'absolute',
    top:        128,
    left:       0,
    right:      0,
    textAlign:  'center',
    color:      PW.color.lavender,
    fontSize:   16,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    letterSpacing: 2,
    textShadowColor:  'rgba(123,45,139,0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
