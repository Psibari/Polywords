import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, FONT_SIZES } from '../constants/fonts';
import * as Haptics from 'expo-haptics';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { SwipeMask, SwipeMaskState } from './SwipeMask';
import { ScoreFloat } from './ScoreFloat';
import HeroBook from './ui/HeroBook';
import { FoilWord } from './ui/FoilWord';
import { BookLight } from './ui/BookLight';
import type { PollyEvent } from '../game/pollyVisitPolicy';
import { playRoundComplete } from '../utils/SoundEngine';
import { playSfx } from '../audio/sfx';
import { PW } from '../ui/pwTheme';
import { libraryMaterial } from '../ui/pwMaterials';
import { useHeartbeat } from '../hooks/useHeartbeat';
import MasterySeal from './MasterySeal';
import { useBoardMechanics } from '../hooks/useBoardMechanics';
import type { ChainTier } from '../hooks/useBoardMechanics';
import { HuntChest } from './HuntChest';
import MaskCardArtwork from './ui/MaskCardArtwork';

// ── Layout constants ──────────────────────────────────────────
const TILE_GAP   = 6;
const TILE_H     = 152;
const FINAL_TILE_H = 72;
const FINAL_TILE_GAP = 10;
const FINAL_TILE_RELEASE_OFFSET_Y = 190;
const TILE_INSET = 16;
const MAX_DECK_BACKING_CARDS = 4;
const DECK_BACKING_OFFSET = 9;

// Deck timing curves — shared by the round's opening deal-in and the
// per-tile shuffle-forward animation (Task 1), so the deck reads as one
// consistent object rather than two different systems.
const CARD_DEAL = Easing.bezier(0.18, 1.04, 0.26, 1.00);
const CARD_SNAP = Easing.bezier(0.16, 0.95, 0.22, 1.00);

const SCREEN_WIDTH = Dimensions.get('window').width;

type FloatKind = 'real' | 'trap' | 'mastery';
type FloatEntry = {
  id: number;
  value: number;
  x: number;
  y: number;
  color: string;
  kind: FloatKind;
  tier?: ChainTier;
};

const CHAIN_TIER_SFX_RATE: Record<ChainTier, number> = { 1: 1.0, 2: 1.08, 3: 1.16 };
const CHAIN_TIER_FONT_SIZE: Record<ChainTier, number> = { 1: 26, 2: 28, 3: 31 };
const CHAIN_TIER_GLOW_RADIUS: Record<ChainTier, number> = { 1: 2, 2: 5, 3: 9 };

type SwipeScoreFloatProps = {
  value: number;
  color: string;
  kind: Exclude<FloatKind, 'mastery'>;
  tier: ChainTier;
  onComplete: () => void;
};

function SwipeScoreFloat({
  value,
  color,
  kind,
  tier,
  onComplete,
}: SwipeScoreFloatProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 940,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onComplete();
    });
    return () => animation.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const opacity = progress.interpolate({
    inputRange: [0, 0.62, 0.82, 1],
    outputRange: [1, 1, 0.92, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.18, 0.42, 1],
    outputRange: [1.2, 1.08, 1, 1],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, kind === 'trap' ? 8 : 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, kind === 'trap' ? -44 : -48],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        ...(kind === 'trap'
          ? { right: 24, top: -18 }
          : { alignSelf: 'center', top: -34 }),
        minWidth: 64,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'rgba(15,13,42,0.92)',
        borderWidth: 1,
        borderColor: color,
        zIndex: PW.z.overlay,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Text
        style={{
          color,
          fontFamily: FONTS.hud,
          fontSize: CHAIN_TIER_FONT_SIZE[tier],
          lineHeight: CHAIN_TIER_FONT_SIZE[tier] + 3,
          textShadowColor: tier > 1 ? color : PW.color.shadow,
          textShadowOffset: { width: 0, height: tier > 1 ? 0 : 1 },
          textShadowRadius: CHAIN_TIER_GLOW_RADIUS[tier],
        }}
      >
        +{value}
      </Text>
    </Animated.View>
  );
}

export type Props = {
  step: WordStep;
  spawnEffect?: (type: 'shard' | 'trail', x: number, y: number, variant?: string) => void;
  onTrapCaught?: () => void;
  onWrongSwipe?: () => void;
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
};

function MasteredOutcomeOverlay({ word, headline = 'MASTERED', bonusLabel, onContinue }: OutcomeOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const resolvedRef = useRef(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 160, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    const auto = setTimeout(resolve, 2800);
    return () => clearTimeout(auto);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.62] });

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
        <Text style={styles.outcomeContinue}>CONTINUE</Text>
      </Animated.View>
    </Pressable>
  );
}

function HauntedOutcomeOverlay({ word, detail, onContinue }: OutcomeOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const resolvedRef = useRef(false);

  function resolve() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onContinue();
  }

  function handlePress() {
    playSfx('uiClick');
    resolve();
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 9, stiffness: 120, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    const auto = setTimeout(resolve, 3200);
    return () => clearTimeout(auto);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hazeY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const hazeOpacity = drift.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.48] });

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
        <Text style={styles.outcomeContinue}>CONTINUE</Text>
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

// ── Boss chest — Arc entrance (values match the tuned "Arc" variant in
// app/components/dev/ChestTest.tsx; keep the two in sync by hand). Wraps
// HuntChest in an Animated.View only — HuntChest itself is untouched.
const CHEST_START_TRANSLATE_Y = -160;
const CHEST_START_TRANSLATE_X = 90;
const CHEST_START_SCALE = 0.15;
const CHEST_FLIGHT_MS = 520;
const CHEST_FLIGHT_EASING = Easing.bezier(0.2, 0.9, 0.1, 1);
// X settles well before Y finishes falling — matching timing on both axes
// is mathematically a straight line, so decoupling them is what curves it.
const CHEST_ARC_X_MS = 300;
const CHEST_ARC_X_EASING = Easing.out(Easing.cubic);
const CHEST_SQUASH_IMPACT_MS = 70;
const CHEST_SQUASH_SETTLE_MS = 140;
const CHEST_OVERSHOOT_LEG_MS = 70;
const CHEST_SCALE_OVERSHOOT = 1.09;
const CHEST_Y_OVERSHOOT = 22;
// After landing, the chest recedes — smaller and pushed further back —
// so it reads as a quiet status object during the gauntlet instead of
// competing with the card for the same space. It was too big for the
// room it had (device-checked against a screenshot 2026-07-29).
const CHEST_REST_SCALE = 0.58;
const CHEST_REST_TRANSLATE_Y = 30;
const CHEST_RECEDE_MS = 650;
// Win beat — explicit chained phases, not parallel-and-hope-it-lines-up
// (a spring for the return read as an instant pop between two frames on
// device, and the token was sized so small after two rounds of shrinking
// that it was never actually visible — both confirmed against a screen
// recording 2026-07-29):
//   1. Chest grows back to full prominence (CHEST_WIN_RETURN_MS, explicit
//      timing so the growth itself is guaranteed visible, not spring physics).
//   2. Once grown, the lid opens.
//   3. After CHEST_TOKEN_DELAY_MS (timed to the real book's fade-out —
//      BOOK_TRAVEL_MS below), a token big enough to actually read as
//      something falls the last stretch inside the chest via travelingSlot.
//   4. Lid closes.
const CHEST_WIN_RETURN_MS = 700;
const CHEST_TOKEN_DELAY_MS = 300; // after the lid finishes opening
// Round 5 fix (device-confirmed via frame-by-frame video 2026-07-30): the
// token was invisible not because it was too subtle, but because the math
// placed it ~140px ABOVE the entire chest artwork at its starting position
// — outside the visible opening entirely, not just hard to see. Anchored
// to the mouth/interior region now (not the box's dead-center) and the
// whole fall stays within the chest's own visible bounds throughout.
const CHEST_TOKEN_ANCHOR_Y = 130;
const CHEST_TOKEN_START_Y = -40;
const CHEST_TOKEN_END_Y = 90;
// Much bigger — over half the chest's own width — and barely shrinks, so
// it cannot be missed even in a compressed recording. Being unmissable
// matters more here than subtlety.
const CHEST_TOKEN_W = 190;
const CHEST_TOKEN_H = 130;
const CHEST_TOKEN_START_SCALE = 1.0;
const CHEST_TOKEN_END_SCALE = 0.6;
const CHEST_TOKEN_FALL_MS = 500;
const CHEST_TOKEN_HOLD_MS = 300;
const CHEST_TOKEN_FADE_MS = 250;
const CHEST_CLOSE_DELAY_MS = 200;
// The real book's own local reaction (used by triggerBookTravelIntoChest,
// defined further down in BoardPresenter — kept here so all win-sequence
// timing tunes in one place). Short and fixed, deliberately — see the
// comment on triggerBookTravelIntoChest for why it must NOT travel far
// enough to reach the chest's screen space.
const BOOK_TRAVEL_DISTANCE = 200;
const BOOK_TRAVEL_MS = 700;
const BOOK_FADE_MS = 220;
// Total win-beat runtime — used to hold the MASTERED card back until the
// chest is actually done (return + lid-open crossfade + token delay/fall/
// hold/fade + close delay + its own crossfade, plus a buffer).
const CHEST_WIN_SEQUENCE_MS =
  CHEST_WIN_RETURN_MS + 200 + CHEST_TOKEN_DELAY_MS + CHEST_TOKEN_FALL_MS + CHEST_TOKEN_HOLD_MS + CHEST_TOKEN_FADE_MS + CHEST_CLOSE_DELAY_MS + 300;
// Must match HuntChest's own internal container (330x300) — not exported,
// so mirrored here for the token's position within travelingSlot.
const CHEST_LOCAL_CENTER_X = 165;

function BossChestGauntlet({ locksOpen, won, word }: { locksOpen: 0 | 1 | 2 | 3; won: boolean; word: string }) {
  const translateY = useRef(new Animated.Value(CHEST_START_TRANSLATE_Y)).current;
  const translateX = useRef(new Animated.Value(CHEST_START_TRANSLATE_X)).current;
  const scale       = useRef(new Animated.Value(CHEST_START_SCALE)).current;
  const scaleX      = useRef(new Animated.Value(1)).current;
  const scaleY      = useRef(new Animated.Value(1)).current;

  const [chestLidOpen, setChestLidOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const tokenY       = useRef(new Animated.Value(CHEST_TOKEN_START_Y)).current;
  const tokenScale   = useRef(new Animated.Value(CHEST_TOKEN_START_SCALE)).current;
  const tokenOpacity = useRef(new Animated.Value(1)).current;
  // TEMP diagnostic — five rounds of tuning off screen recordings hasn't
  // converged, so this answers directly whether the JS/animation sequence
  // is actually firing (vs a rendering/positioning problem in what it
  // produces). Trivially removable once we know which it is.
  const [debugPhase, setDebugPhase] = useState('mounted');

  useEffect(() => {
    // Mounted only while the gauntlet is active, so this fires exactly once
    // per gauntlet — i.e. when it begins.
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: CHEST_FLIGHT_MS, easing: CHEST_FLIGHT_EASING, useNativeDriver: true }),
      Animated.timing(scale,      { toValue: 1, duration: CHEST_FLIGHT_MS, easing: CHEST_FLIGHT_EASING, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: CHEST_ARC_X_MS,  easing: CHEST_ARC_X_EASING,  useNativeDriver: true }),
    ]).start(() => {
      const squash = Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleX, { toValue: 1.08, duration: CHEST_SQUASH_IMPACT_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 0.92, duration: CHEST_SQUASH_IMPACT_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleX, { toValue: 1, duration: CHEST_SQUASH_SETTLE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 1, duration: CHEST_SQUASH_SETTLE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]);
      const scaleOvershoot = Animated.sequence([
        Animated.timing(scale, { toValue: CHEST_SCALE_OVERSHOOT, duration: CHEST_OVERSHOOT_LEG_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: CHEST_OVERSHOOT_LEG_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]);
      const yOvershoot = Animated.sequence([
        Animated.timing(translateY, { toValue: CHEST_Y_OVERSHOOT, duration: CHEST_OVERSHOOT_LEG_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: CHEST_OVERSHOOT_LEG_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]);
      Animated.parallel([squash, scaleOvershoot, yOvershoot]).start(() => {
        Animated.parallel([
          Animated.timing(scale, { toValue: CHEST_REST_SCALE, duration: CHEST_RECEDE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: CHEST_REST_TRANSLATE_Y, duration: CHEST_RECEDE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]).start();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!won) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setDebugPhase('won:growing');

    // Phase 1: grow back to full prominence — explicit timing, not a spring,
    // so the growth itself takes a guaranteed, visible amount of time
    // instead of however long spring physics happens to settle in (that
    // read as an instant pop on device).
    Animated.parallel([
      // inOut, not out — an out-curve front-loads motion so most of the
      // growth happens in the first third and reads as a pop; inOut spreads
      // it evenly across the full duration (device-confirmed 2026-07-30).
      Animated.timing(scale, { toValue: 1, duration: CHEST_WIN_RETURN_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: CHEST_WIN_RETURN_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      // Phase 2: lid opens only once the chest has actually finished growing.
      setChestLidOpen(true);
      setDebugPhase('lid:opening');

      timers.push(setTimeout(() => {
        // Phase 3: token falls the last stretch inside the chest.
        setShowToken(true);
        setDebugPhase('token:falling');
        tokenY.setValue(CHEST_TOKEN_START_Y);
        tokenScale.setValue(CHEST_TOKEN_START_SCALE);
        tokenOpacity.setValue(1);
        Animated.parallel([
          Animated.timing(tokenY, { toValue: CHEST_TOKEN_END_Y, duration: CHEST_TOKEN_FALL_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(tokenScale, { toValue: CHEST_TOKEN_END_SCALE, duration: CHEST_TOKEN_FALL_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(CHEST_TOKEN_HOLD_MS),
            Animated.timing(tokenOpacity, { toValue: 0, duration: CHEST_TOKEN_FADE_MS, useNativeDriver: true }),
          ]),
        ]).start(() => {
          setShowToken(false);
          setDebugPhase('lid:closing');
          // Phase 4: lid closes.
          timers.push(setTimeout(() => {
            setChestLidOpen(false);
            setDebugPhase('done');
          }, CHEST_CLOSE_DELAY_MS));
        });
      }, CHEST_TOKEN_DELAY_MS));
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  return (
    <View style={styles.bossChestSlot} pointerEvents="none">
      <Animated.View
        style={{ transform: [{ translateX }, { translateY }, { scale }, { scaleX }, { scaleY }] }}
      >
        <HuntChest
          open={chestLidOpen}
          locksOpen={locksOpen}
          travelingSlot={showToken && (
            <Animated.View
              style={{
                position: 'absolute',
                left: CHEST_LOCAL_CENTER_X - CHEST_TOKEN_W / 2,
                top: CHEST_TOKEN_ANCHOR_Y - CHEST_TOKEN_H / 2,
                width: CHEST_TOKEN_W,
                height: CHEST_TOKEN_H,
                opacity: tokenOpacity,
                transform: [{ translateY: tokenY }, { scale: tokenScale }],
              }}
            >
              <View style={styles.bossBookToken}>
                <Text style={styles.bossBookTokenText} numberOfLines={1}>{word}</Text>
              </View>
            </Animated.View>
          )}
        />
      </Animated.View>
    </View>
  );
}

function BoardPresenter({ step, spawnEffect, onTrapCaught, onWrongSwipe, onSwipeAttempt, firePollyEvent, isBossStage }: BoardPresenterProps) {
  // Only stepIndex is read here, so select it directly rather than the
  // whole store — this is the per-word presenter, remounted on every swipe
  // resolution, so a whole-store subscription re-rendered it on completely
  // unrelated state (daily session, settings, pollyMemory...).
  const gameStepIndex = useGameStore(s => s.game.stepIndex);
  const { pulseAnim, tension } = useHeartbeat();
  const tileBreatheAmount = useRef(new Animated.Value(0)).current;
  const isBoss  = step.eventType === 'bossWord';
  const isHaunt = step.isHauntReturn === true;

  // ── layout ───────────────────────────────────────────────────
  const [containerWidth, setContainerWidth] = useState(350);
  const containerWidthRef                   = useRef(350);
  const containerRef  = useRef<View>(null);
  const wordZoneRef   = useRef<View>(null);
  const [wordScreenY, setWordScreenY] = useState(180);

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
  // Boss-only win beat: the book drops toward the chest instead of sliding
  // off-frame. Rest values (0/1/1) are a no-op, so this never affects the
  // ordinary close for non-boss or non-mastered outcomes.
  const bookTravelY       = useRef(new Animated.Value(0)).current;
  const bookTravelScale   = useRef(new Animated.Value(1)).current;
  const bookTravelOpacity = useRef(new Animated.Value(1)).current;
  const wordEntranceHapticRef = useRef<string | null>(null);
  const bookOpenAnimationRef   = useRef<Animated.CompositeAnimation | null>(null);

  function triggerBoardShake() {
    boardShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(boardShakeX, { toValue: -4, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 4,  duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: -2, duration: 35, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 0,  duration: 35, useNativeDriver: true }),
    ]).start();
  }
  const absorbedPhraseOpacity = useRef(new Animated.Value(0)).current;
  const goldTextOpacity       = useRef(new Animated.Value(0)).current;
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
    playSfx('pollySqwawkShort');
    if (brokeRealChain) {
      playSfx('correctClaim', { rate: 0.55 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

    setAbsorbedPhrase(phrase);
    absorbedPhraseOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(absorbedPhraseOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setAbsorbedPhrase(null));
  }

  function handleCardTouch() {
    if (mechanics.gatePhase !== 'locked') return;
    triggerBookOpen();
  }

  // ── gauntlet pulse ────────────────────────────────────────────
  // A stronger, distinct pulse fired for each correctly-judged mystery
  // tile — the book stays at rest between tiles (same as normal) but
  // gets a bigger glow + heavier haptic on each correct judgment, rather
  // than holding open statically for the whole gauntlet. Reuses the same
  // bookOpenAnimationRef safety pattern as triggerBookOpen: reset both
  // bookOpenAnim and bookIntakeGlowAnim unconditionally before starting.
  function triggerGauntletPulse() {
    bookOpenAnimationRef.current?.stop();
    bookOpenAnim.stopAnimation();
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.stopAnimation();
    bookIntakeGlowAnim.setValue(0);
    bookOpenAnimationRef.current = Animated.parallel([
      Animated.sequence([
        Animated.timing(bookOpenAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(220),
        Animated.timing(bookOpenAnim, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(bookIntakeGlowAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(220),
        Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]);
    bookOpenAnimationRef.current.start();
  }

  const [bossReady, setBossReady]             = useState(!isBoss);
  const [tilesReady, setTilesReady]           = useState(false);

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

  // ── score floats ─────────────────────────────────────────────
  const [floats, setFloats] = useState<FloatEntry[]>([]);
  const floatIdRef          = useRef(0);

  function spawnFloat(value: number, kind: Exclude<FloatKind, 'mastery'>, tier: ChainTier = 1) {
    const color = kind === 'real' ? PW.color.gold : '#9B2D6B';
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, value, color, kind, tier, x: 0, y: 0 }]);
  }

  function spawnFloatAtSplit(value: number, color = '#F5C842') {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, {
      id,
      value,
      color,
      kind: 'mastery',
      x: containerWidth / 2,
      y: 300,
    }]);
  }

  function handleEffect(type: 'shard' | 'trail', pageX: number, pageY: number) {
    if (type === 'shard') {
      spawnEffect?.('shard', pageX, pageY, 'trap');
    } else {
      spawnEffect?.(type, pageX, pageY);
    }
  }

  // ── master gate (face-only) ─────────────────────────────────────
  // Final tile drop (native: transform only)
  const splitTile1TransY  = useRef(new Animated.Value(FINAL_TILE_RELEASE_OFFSET_Y)).current;

  // Final tile border pulse (non-native)
  const finalBorder1Anim = useRef(new Animated.Value(0)).current;

  // Boss-only: Polly's thrown-card tilt (native: transform only). Rests at
  // 0deg for the ordinary (non-boss) hidden-gate path — only isBossStage
  // ever moves it off center.
  const gauntletCardTilt = useRef(new Animated.Value(0)).current;

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
    Animated.timing(tileBreatheAmount, {
      toValue: tension === 3 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [tension]); // eslint-disable-line react-hooks/exhaustive-deps

  function playSystemStingerWord(word: string, peakScale: number) {
    setSystemStingerWord(word);
    systemStingerOpacity.setValue(0);
    systemStingerScale.setValue(0.75);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(systemStingerOpacity, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.spring(systemStingerScale, { toValue: peakScale, damping: 5, stiffness: 320, useNativeDriver: true }),
      ]),
      Animated.timing(systemStingerOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // ── boss chest (face-only; no brain state) ─────────────────────
  // Locks cracked = gauntlet tiles cleared correctly so far. Derived purely
  // from the existing onGauntletCorrect/onGauntletBegin callbacks below —
  // useBoardMechanics itself is untouched.
  const [gauntletLocksOpen, setGauntletLocksOpen] = useState<0 | 1 | 2 | 3>(0);
  const [bossChestWon, setBossChestWon] = useState(false);
  // Boss-only: hold the MASTERED card back until the chest's own ceremony
  // (return, open, book drops in, close) has actually finished — otherwise
  // the card pops up instantly and covers the chest for the whole thing.
  // Non-boss mastery is unaffected — it never sets this, so it stays true.
  const [showMasteredOverlay, setShowMasteredOverlay] = useState(true);

  function triggerBookTravelIntoChest() {
    // Deliberately NOT travelling anywhere near the chest — the book lives
    // earlier in the layer order than the chest, so once its falling
    // position overlaps the chest's on-screen box it paints behind the
    // WHOLE chest object (not tucked behind just the front wall the way
    // the token is, via HuntChest's travelingSlot). Device-confirmed
    // 2026-07-30: it visibly dropped behind the chest instead of into it.
    // So the book's job is just to sink/shrink/fade in place near the word
    // — a short, fixed hop that never reaches the chest's screen space —
    // and the correctly-layered token (BossChestGauntlet) carries the
    // entire "arrives and goes inside" illusion by itself, later, once the
    // chest has actually opened.
    bookTravelY.setValue(0);
    bookTravelScale.setValue(1);
    bookTravelOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(bookTravelY, { toValue: BOOK_TRAVEL_DISTANCE, duration: BOOK_TRAVEL_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bookTravelScale, { toValue: 0.3, duration: BOOK_TRAVEL_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(BOOK_TRAVEL_MS - BOOK_FADE_MS),
        Animated.timing(bookTravelOpacity, { toValue: 0, duration: BOOK_FADE_MS, useNativeDriver: true }),
      ]),
    ]).start();
  }

  // ── boss gauntlet card — dev size/position tuner (face-only) ──────
  // Wrapper-only transform; SwipeMask's own layout/style is never touched.
  // Seeded to clear the chest lid with real breathing room, and scaled down
  // enough to read as subordinate to the hero word above it rather than a
  // second, competing card (device-checked against a screenshot 2026-07-29).
  const [gauntletCardTune, setGauntletCardTune] = useState({ scale: 0.70, x: -4, y: -252 });

  function dumpGauntletCardTune() {
    const { scale, x, y } = gauntletCardTune;
    // eslint-disable-next-line no-console
    console.log(
      '// ── Boss gauntlet card DUMP — paste back in as the new seed ──\n' +
      `const GAUNTLET_CARD_TUNE = { scale: ${scale}, x: ${x}, y: ${y} };`
    );
  }

  // ── mechanics (brain) ───────────────────────────────────────────
  // Every perform.* callback below is the FACE half of a function that used
  // to live directly in this component — see useBoardMechanics.ts for the
  // BRAIN half and how the two are stitched back together.
  const mechanics = useBoardMechanics({
    step,
    firePollyEvent,
    perform: {
      onRealClaimed({ mask, tier, points, nextFound }) {
        playSfx('correctClaim', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (tier === 3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        spawnFloat(points, 'real', tier);
        triggerAbsorption(mask.phrase);
        Animated.timing(goldTextOpacity, {
          toValue: GOLD_STEPS_LOCAL[Math.min(nextFound, GOLD_STEPS_LOCAL.length - 1)],
          duration: 400,
          useNativeDriver: true,
        }).start();
      },
      onTrapRejected({ tier, points }) {
        playSfx('trapShatter', { rate: CHAIN_TIER_SFX_RATE[tier] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (tier === 3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        spawnFloat(points, 'trap', tier);
        onTrapCaught?.();
      },
      onWrongSwipe({ brokeRealChain }) {
        performWrongSwipeFeedback(brokeRealChain);
      },
      onGauntletCorrect({ swipedUp, phrase }) {
        playSfx(swipedUp ? 'correctClaim' : 'trapShatter');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        triggerGauntletPulse();
        if (swipedUp) triggerAbsorption(phrase);
        setGauntletLocksOpen(prev => (Math.min(3, prev + 1) as 0 | 1 | 2 | 3));
      },
      onGauntletTileDrop() {
        splitTile1TransY.setValue(FINAL_TILE_RELEASE_OFFSET_Y);
        finalBorder1Anim.setValue(0);
        const drops = [
          Animated.spring(splitTile1TransY, {
            toValue: 0, damping: 13, stiffness: 150, useNativeDriver: true,
          }),
        ];
        if (isBossStage) {
          // Polly flings it in — starts crooked, settles level. Alternates
          // side so three in a row don't all lean the same way.
          gauntletCardTilt.setValue(Math.random() < 0.5 ? -9 : 9);
          drops.push(
            Animated.spring(gauntletCardTilt, {
              toValue: 0, damping: 10, stiffness: 120, useNativeDriver: true,
            }),
          );
        }
        Animated.parallel(drops).start(({ finished }) => {
          if (!finished) return;
          mechanics.onGauntletTileLanded();
          Animated.sequence([
            Animated.timing(finalBorder1Anim, { toValue: 0.55, duration: 120, useNativeDriver: false }),
            Animated.timing(finalBorder1Anim, { toValue: 1.0, duration: 220, useNativeDriver: false }),
          ]).start();
        });
      },
      onGauntletBegin() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setGauntletLocksOpen(0);
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
        Animated.timing(bookSlideX, {
          toValue: -SCREEN_WIDTH,
          duration: isBoss ? 380 : 280,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start();
      },
      onMasteredSequence({ isBoss: bossOutcome, isHaunt: hauntOutcome, masteryPoints }) {
        if (!isBoss) {
        // ── Returning Haunt path — existing 12-phase sequence, unchanged ──
        if (!hauntOutcome) {
          spawnFloatAtSplit(masteryPoints, '#F5C842');
        }
        setMasterStampVisible(true);
        setMasterCracksVisible(false);
        setGoldSeedVisible(false);
        setGoldBloomVisible(false);
        setSystemStingerWord(null);

        const screenH = Dimensions.get('window').height;
        const crashDistance = Math.max(150, screenH * 0.48 - wordScreenY);
        const vaultTargetX = Math.max(120, containerWidthRef.current / 2 - 34);
        const vaultTargetY = Math.max(250, screenH * 0.42);

        // Phase 1 — T+0ms: Screen dims — tiles to 15% opacity
        Animated.timing(masterAllFadeAnim, {
          toValue: 0.15, duration: 300, useNativeDriver: false,
        }).start();
        Animated.spring(masterHeroTransY, {
          toValue: crashDistance, damping: 8, stiffness: 170, mass: 0.8, useNativeDriver: true,
        }).start();
        Animated.sequence([
          Animated.timing(masterHeroScale, { toValue: 1.22, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(masterHeroScale, { toValue: 1.0, damping: 8, stiffness: 190, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Phase 2 — T+500ms: Word pulse
        setTimeout(() => setSealReady(true), 360);

        // Phase 3 — T+800ms: MASTERED label appears below word
        setTimeout(() => {
          setMasterCracksVisible(true);
          masterCrackOpacity.setValue(0);
          Animated.timing(masterCrackOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
        }, 800);

        // Fade label before word swells — NEVER simultaneous
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(masterHeroScale, { toValue: 1.08, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(masterHeroScale, { toValue: 0.96, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]).start();
        }, 1000);

        // Phase 4 — T+1050ms: Word swells 1.0→1.6
        setTimeout(() => {
          Animated.timing(masterHeroScale, {
            toValue: 1.0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true,
          }).start();
        }, 1050);

        // Phase 6 — T+1900ms: Gold seed appears at word center
        setTimeout(() => {
          setGoldSeedVisible(true);
          masterCoreOpacity.setValue(1);
          goldSeedScale.setValue(0.15);
          goldSeedTransX.setValue(0);
          goldSeedTransY.setValue(0);
          goldSeedRotate.setValue(0);
          goldSeedTrailOpacity.setValue(0);
          Animated.parallel([
            Animated.spring(goldSeedScale, { toValue: 2.6, damping: 7, stiffness: 150, useNativeDriver: true }),
            Animated.timing(goldSeedRotate, { toValue: 1, duration: 820, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(goldSeedTrailOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          ]).start();
        }, 1900);

        // Seed settles
        setTimeout(() => {
          Animated.spring(goldSeedScale, { toValue: 2.15, damping: 8, stiffness: 220, useNativeDriver: true }).start();
        }, 2000);

        // Phase 7 — T+2100ms: Seed drops to screen bottom
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(goldSeedTransX, {
              toValue: vaultTargetX, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(goldSeedTransY, {
              toValue: vaultTargetY, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(goldSeedScale, {
              toValue: 0.62, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(masterCoreOpacity, { toValue: 0.95, duration: 620, useNativeDriver: true }),
          ]).start();
        }, 2100);

        // Phase 8 — T+2400ms: Seed landing bloom
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setGoldSeedVisible(false);
          setGoldBloomVisible(true);
          goldBloomScale.setValue(1);
          goldBloomOpacity.setValue(1);
          Animated.parallel([
            Animated.timing(goldBloomScale, { toValue: 3.5, duration: 300, useNativeDriver: true }),
            Animated.timing(goldBloomOpacity, { toValue: 0,   duration: 300, useNativeDriver: true }),
          ]).start();
          setTimeout(() => setGoldBloomVisible(false), 350);
        }, 2400);

        setTimeout(() => {
          if (bossOutcome) {
            playSystemStingerWord('BINGO', 1.0);
            setTimeout(() => playSystemStingerWord('BANGO', 1.08), 430);
            setTimeout(() => playSystemStingerWord('ZZZZINGO!', 1.28), 900);
          }
        }, 2600);

        // Restore dim before transition
        setTimeout(() => {
          Animated.timing(masterCrackOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          Animated.timing(masterAllFadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
        }, bossOutcome ? 4050 : 3200);

        // Phase 10 — T+3000ms: presentation cleanup (the outcome reveal
        // itself fires from useBoardMechanics on a matching timer)
        setTimeout(() => {
          setMasterCracksVisible(false);
          setSystemStingerWord(null);
        }, bossOutcome ? 4300 : 3450);
        return;
        }
        // ── Boss path — one decisive beat instead of the 12-phase sequence.
        if (!hauntOutcome) spawnFloatAtSplit(masteryPoints, '#F5C842');
        playSfx('bookClose');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Cancel any in-flight composite (e.g. a gauntlet pulse parked in
        // its Animated.delay) before driving these shared values directly —
        // otherwise its queued final leg fires later and fights this beat.
        bookOpenAnimationRef.current?.stop();
        bookOpenAnim.stopAnimation();
        bookIntakeGlowAnim.stopAnimation();
        bookOpenAnimationRef.current = Animated.parallel([
          Animated.timing(bookOpenAnim, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
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
          stillHauntedScale.setValue(0.7);
          Animated.parallel([
            Animated.timing(stillHauntedOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
            Animated.spring(stillHauntedScale, { toValue: 1.0, damping: 7, stiffness: 280, useNativeDriver: true }),
          ]).start();
          setTimeout(() => {
            Animated.timing(stillHauntedOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
            setTimeout(() => setStillHauntedVisible(false), 240);
          }, 1400);
        }, 400);
        return;
        }
        if (!isBoss) return;
        // ── Boss path — mirror of the master beat: same duration, opposite
        // signal. No flash, no stamp: colour drains, it does not travel.
        playSfx('bookClose');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        triggerBoardShake();
        // Cancel any in-flight composite (e.g. a gauntlet pulse parked in
        // its Animated.delay) before driving these shared values directly —
        // otherwise its queued final leg fires later and fights this beat.
        bookOpenAnimationRef.current?.stop();
        bookOpenAnim.stopAnimation();
        bookIntakeGlowAnim.stopAnimation();
        bookGhostDrainOpacity.setValue(0);
        bookOpenAnimationRef.current = Animated.parallel([
          Animated.timing(bookOpenAnim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.timing(bookIntakeGlowAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.timing(bookGhostDrainOpacity, { toValue: 0.55, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]);
        bookOpenAnimationRef.current.start();
      },
      onOutcomeReveal(outcome) {
        playSfx(outcome === 'mastered' ? 'mastered' : 'haunted');
        if (outcome === 'haunted') triggerBoardShake();
        if (outcome === 'mastered' && isBossStage) {
          setShowMasteredOverlay(false);
          setBossChestWon(true);
          triggerBookTravelIntoChest();
          setTimeout(() => setShowMasteredOverlay(true), CHEST_WIN_SEQUENCE_MS);
        }
      },
      onLivesDepleted() {
        Animated.timing(deckRedTint, {
          toValue: 1, duration: 300, useNativeDriver: false,
        }).start();
      },
    },
  });
  const GOLD_STEPS_LOCAL = [0, 0.25, 0.55, 0.80, 1.0] as const;

  useEffect(() => {
    if (mechanics.visibleGridMasks.length > 0) {
      const id = setTimeout(() => setTilesReady(true), 50);
      return () => clearTimeout(id);
    }
  }, [mechanics.visibleGridMasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const newTopId = mechanics.remainingMaskIds[0] ?? null;
    if (newTopId && newTopId !== prevTopIdRef.current) {
      prevTopIdRef.current = newTopId;
      cardPopCountRef.current += 1;
      if (cardPopCountRef.current > 1) {
        cardPopY.setValue(DECK_BACKING_OFFSET);
        Animated.timing(cardPopY, {
          toValue: 0,
          duration: 180,
          easing: CARD_SNAP,
          useNativeDriver: true,
        }).start(() => {
          Haptics.selectionAsync();
        });
      }
    }
  }, [mechanics.remainingMaskIds]);

  const backingCardCount = mechanics.topMask
    ? Math.min(MAX_DECK_BACKING_CARDS, Math.max(0, mechanics.deckSize - 1))
    : 0;
  const backingCardWidth = Math.min(Math.max(containerWidth - 80, 0), 290);

  useEffect(() => {
    const backingIds = mechanics.remainingMaskIds.slice(1, 1 + backingCardCount).reverse();
    backingIds.forEach((maskId, index) => {
      const depth = backingCardCount - index;
      const anim = getBackingCardAnim(maskId, depth);
      Animated.timing(anim.depthY, { toValue: depth * DECK_BACKING_OFFSET, duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
      Animated.timing(anim.scale,  { toValue: 1 - depth * 0.01,            duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
      Animated.timing(anim.rotate, { toValue: depth * -1.3,                duration: 180, easing: CARD_SNAP, useNativeDriver: true }).start();
    });
    // Garbage-collect cards that have left the deck entirely (claimed,
    // rejected, or judged wrong) so the map doesn't grow across a round.
    const liveIds = new Set(mechanics.remainingMaskIds);
    backingCardAnimsRef.forEach((_, maskId) => {
      if (!liveIds.has(maskId)) backingCardAnimsRef.delete(maskId);
    });
  }, [mechanics.remainingMaskIds, backingCardCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showBoardContent) mechanics.onBoardContentReady();
  }, [showBoardContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polly reactive triggers not tied to a presentation animation move to
  // useBoardMechanics; oneWrongMove stays wired here only through
  // perform.onLivesDepleted above, so the deck's red-tint reaction and its
  // Polly event share one trigger condition.

  // Reset guards and animated values on new word
  useEffect(() => {
    cardPopY.setValue(0);
    prevTopIdRef.current = null;
    cardPopCountRef.current = 0;
    deckRedTint.setValue(0);
    deckSlamY.setValue(0);  // outer wrapper stays static
    const cardDelay = isBoss ? 1200 : 520;

    // Reset all card values
    [deckDeepY, deckMidY, deckActiveY].forEach(v => v.setValue(400));
    deckBackingY.setValue(28);
    deckBackingOp.setValue(0);
    deckDeepRot.setValue(-4); deckMidRot.setValue(3); deckActiveRot.setValue(-2);
    [deckDeepOp, deckMidOp, deckActiveOp].forEach(v => v.setValue(0));

    // Deep card (back) — arrives first
    const slamTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(deckBackingY, { toValue: 0, duration: 220, easing: CARD_DEAL, useNativeDriver: true }),
        Animated.timing(deckBackingOp, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(deckDeepY,  { toValue: 0, duration: 210, easing: CARD_DEAL, useNativeDriver: true }),
        Animated.timing(deckDeepRot,{ toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(deckDeepOp, { toValue: 1, duration: 100,  useNativeDriver: true }),
      ]).start();

      // Mid card — 90ms after deep
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(deckMidY,  { toValue: 0, duration: 190, easing: CARD_DEAL, useNativeDriver: true }),
          Animated.timing(deckMidRot,{ toValue: 0, duration: 190, useNativeDriver: true }),
          Animated.timing(deckMidOp, { toValue: 1, duration: 80,  useNativeDriver: true }),
        ]).start();
      }, 70);

      // Active card — 180ms after deep, heaviest haptic on land
      setTimeout(() => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(deckActiveY, { toValue: -6, duration: 130, easing: CARD_SNAP, useNativeDriver: true }),
            Animated.timing(deckActiveY, { toValue: 0, duration: 90, useNativeDriver: true }),
          ]),
          Animated.timing(deckActiveRot,{ toValue: 0, duration: 160, useNativeDriver: true }),
          Animated.timing(deckActiveOp, { toValue: 1, duration: 80,  useNativeDriver: true }),
        ]).start(() => {
          const deckEntranceKey = `${gameStepIndex}:${step.word}`;
          if (deckEntranceHapticRef.current !== deckEntranceKey) {
            deckEntranceHapticRef.current = deckEntranceKey;
            Haptics.selectionAsync();
          }
        });
      }, 120);
    }, cardDelay);
    goldTextOpacity.setValue(0);
    wordEntryTilt.setValue(0);
    bookOpenAnim.setValue(0);
    bookIntakeGlowAnim.setValue(0);
    bookGhostDrainOpacity.setValue(0);
    bookSlideX.setValue(SCREEN_WIDTH);

    if (isBoss) {
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
    splitTile1TransY.setValue(FINAL_TILE_RELEASE_OFFSET_Y);
    finalBorder1Anim.setValue(0);
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
  });
  const bookIntakeGlowScale = bookOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });

  // Boss-only: it's Polly's card, not the book's — gold is already claimed by
  // STRIKE and the chest, so hers wears her own lavender/purple instead.
  // Non-boss keeps the original gold treatment untouched.
  const gauntletRotateDeg = gauntletCardTilt.interpolate({
    inputRange: [-9, 0, 9],
    outputRange: ['-9deg', '0deg', '9deg'],
  });
  const gauntletBorderColor = isBossStage
    ? finalBorder1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(185,138,222,0.4)', 'rgba(185,138,222,1.0)'],
      })
    : finalBorder1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(245,200,66,0.35)', 'rgba(245,200,66,1.0)'],
      });

  // Shared by both boss and non-boss paths below, unchanged from before this
  // pass — only whether it gets an extra positioning wrapper differs.
  const gauntletCard = (mechanics.gatePhase === 'tiles' || mechanics.gatePhase === 'wrongFail') && mechanics.activeGauntletTile ? (
    <Animated.View
      pointerEvents={mechanics.gatePhase === 'wrongFail' ? 'none' : mechanics.tileLanded ? 'auto' : 'none'}
      style={{ transform: [{ translateY: splitTile1TransY }, { rotate: gauntletRotateDeg }] }}
    >
      <Animated.View style={[
        styles.finalHiddenTileFrame,
        isBossStage && styles.finalHiddenTileFramePolly,
        {
          borderColor: gauntletBorderColor,
          shadowOpacity: finalBorder1Anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.08, 0.26],
          }),
        },
      ]}>
        <SwipeMask
          key={mechanics.activeGauntletTile.mask.id}
          mask={mechanics.activeGauntletTile.mask}
          state={mechanics.finalTileStates.get(mechanics.activeGauntletTile.mask.id) ?? 'idle'}
          onSwipeUp={mechanics.onGauntletSwipeUp}
          onSwipeDown={mechanics.onGauntletSwipeRight}
          onSwipeReveal={() => {}}
          revealable={false}
          disabled={mechanics.inputLocked}
          bookMaterial
          tileHeight={220}
          entryDelay={0}
          onEffect={handleEffect}
          onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
          onPressHoldStart={() => playSfx('pressHoldStart')}
          onCardTouch={handleCardTouch}
          wordY={wordScreenY}
          intakeY={wordScreenY + 73}
        />
      </Animated.View>
    </Animated.View>
  ) : null;

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
            }
          );
        }}
      >
        {/* Kicker — floats above word zone */}
        {mechanics.kicker && (
          isBoss ? (
            <Text style={styles.kickerBoss}>{mechanics.kicker}</Text>
          ) : (
            <Text style={styles.kicker}>{mechanics.kicker}</Text>
          )
        )}

        {/* Book slide wrapper — entire book (shadow, pages, intake, cover) slides in/out as one unit.
            absoluteFill keeps the absolutely-positioned book children aligned to the word zone. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: bookTravelOpacity,
              transform: [
                { translateX: Animated.add(bookSlideX, boardShakeX) },
                { translateY: bookTravelY },
                { scale: bookTravelScale },
              ],
            },
          ]}
        >
        {/* SVG Hero Book V5; MaskBoard retains the animated hero-word content. */}
        <HeroBook
          coverRotateX={bookIntakeRotateX}
          intakeOpacity={bookIntakeGlowAnim}
          intakeScaleY={bookIntakeGlowScale}
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
              <FoilWord
                word={step.word}
                baseStyle={styles.word}
                fontSize={96}
                minimumFontScale={0.72}
              />
            ) : (
              <Text
                style={[styles.word, styles.wordBoss]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Text>
            )}
            {/* Gold overlay for absorption fill */}
            {!isBoss && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  {
                    color: '#F5C842',
                    opacity: goldTextOpacity,
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
            {/* Red flash overlay — wrong swipe danger signal */}
            {!isBoss && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  {
                    color: '#CC2200',
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

            {/* Haunt entrance purple tint — fades out as tiles appear */}
            {isHaunt && (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.word,
                  isBoss && styles.wordBoss,
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
        </HeroBook>

        {/* Vault brand on spine — slides in with the book every round */}
        <Text
          pointerEvents="none"
          style={styles.vaultLabel}
        >
          POLLY'S VAULT
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
      <View style={styles.gridWrap}>
        <View style={styles.tileStackArea}>
          {showBoardContent && mechanics.gatePhase !== 'tiles' && mechanics.gatePhase !== 'wrongFail' && mechanics.topMask && (
            <Animated.View
              pointerEvents="none"
              style={[styles.swipeCueOverlay, { opacity: cueOpacityAnim }]}
            >
              <Text style={[styles.swipeCueText, styles.swipeUpCue]}>
                SWIPE UP TO CLAIM
              </Text>
              <Text style={[styles.swipeCueText, styles.swipeRightCue]}>
                SWIPE RIGHT TO REJECT
              </Text>
            </Animated.View>
          )}
          {showBoardContent && (
          <Animated.View style={[styles.tileStack, { transform: [{ translateY: deckSlamY }] }]}>
            <Animated.View style={{ opacity: masterAllFadeAnim }}>
            {mechanics.gatePhase !== 'tiles' && mechanics.gatePhase !== 'wrongFail' && mechanics.topMask && (
              <View style={styles.deckWrap}>
                {mechanics.remainingMaskIds.slice(1, 1 + backingCardCount).reverse().map((maskId, index) => {
                  const depth = backingCardCount - index;
                  const anim = getBackingCardAnim(maskId, depth);
                  const rotateDeg = anim.rotate.interpolate({ inputRange: [-6, 0], outputRange: ['-6deg', '0deg'] });
                  const mask = mechanics.visibleGridMasks.find(m => m.id === maskId);
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
                      {mask && (
                        <View style={styles.deckBackingPhrasePanel} pointerEvents="none">
                          <Text
                            style={[
                              styles.deckBackingPhrase,
                              {
                                fontSize: 27 - (depth - 1) * 3,
                                color: depth === 1 ? PW.color.softWhite : PW.color.mutedWhite,
                              },
                            ]}
                            numberOfLines={2}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.8}
                          >
                            {mask.phrase}
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
                  style={styles.deckTopCardSlot}
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
                    nearMastery={mechanics.nearMastery}
                    tileHeight={TILE_H}
                    entryDelay={0}
                    hapticCorrect={step.hapticTier === 'light' ? () => Haptics.selectionAsync() : undefined}
                    onEffect={handleEffect}
                    onSwipeStart={() => { playSfx('tileSwipe'); onSwipeAttempt?.(); }}
                    onPressHoldStart={() => playSfx('pressHoldStart')}
                    onExitComplete={() => {
                      mechanics.onTileExitComplete(mechanics.topMask!.id);
                    }}
                    onCardTouch={handleCardTouch}
                    wordY={wordScreenY}
                    intakeY={wordScreenY + 73}
                  />
                </View>
                </Animated.View>
              </View>
            )}

            {gauntletCard && (
              <View style={styles.finalHiddenTileStack}>
                {!isBossStage && mechanics.gauntletTiles.length > 1 && (
                  <Text style={{
                    color: 'rgba(245,200,66,0.72)',
                    fontFamily: FONTS.label,
                    fontSize: 15,
                    letterSpacing: 3,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}>
                    {`${mechanics.gauntletIndex + 1} OF ${mechanics.gauntletTiles.length}`}
                  </Text>
                )}
                {isBossStage ? (
                  <View
                    style={{
                      transform: [
                        { translateX: gauntletCardTune.x },
                        { translateY: gauntletCardTune.y },
                        { scale: gauntletCardTune.scale },
                      ],
                    }}
                  >
                    <View style={{ position: 'relative' }}>
                      {/* Stack depth = cards still to come — Polly threw all
                          three at once, and the pile visibly thins as each
                          one resolves. Doubles as the N-OF-M readout. */}
                      {mechanics.gauntletTiles.length - mechanics.gauntletIndex - 1 >= 2 && (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.gauntletPeekCard,
                            { transform: [{ translateY: -12 }, { translateX: 12 }, { rotate: '-5deg' }, { scale: 0.96 }] },
                          ]}
                        />
                      )}
                      {mechanics.gauntletTiles.length - mechanics.gauntletIndex - 1 >= 1 && (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.gauntletPeekCard,
                            { transform: [{ translateY: -6 }, { translateX: 6 }, { rotate: '3deg' }, { scale: 0.98 }] },
                          ]}
                        />
                      )}
                      {gauntletCard}
                    </View>
                  </View>
                ) : (
                  gauntletCard
                )}
              </View>
            )}
            </Animated.View>
          </Animated.View>
          )}

          <View pointerEvents="none" style={styles.scoreFloatOverlay}>
            {floats.filter(f => f.kind !== 'mastery').map(f => (
              <SwipeScoreFloat
                key={f.id}
                value={f.value}
                color={f.color}
                kind={f.kind as Exclude<FloatKind, 'mastery'>}
                tier={f.tier ?? 1}
                onComplete={() => setFloats(prev => prev.filter(e => e.id !== f.id))}
              />
            ))}
          </View>

        </View>
      </View>

      {/* gatePhase flips to 'mastered' immediately, but the win signal
          (bossChestWon, set from onOutcomeReveal) doesn't fire until
          showWordOutcome runs — 700ms later on the boss path. Gating the
          mount on gatePhase alone (not bossChestWon) covers that whole gap,
          so the chest doesn't unmount/remount mid-celebration and lose its
          settled state right as the win sequence needs it. */}
      {isBossStage && (mechanics.gatePhase === 'tiles' || mechanics.gatePhase === 'wrongFail' || mechanics.gatePhase === 'mastered') && (
        <BossChestGauntlet locksOpen={gauntletLocksOpen} won={bossChestWon} word={step.word} />
      )}

      {/* TEMP dev-only gauntlet card tuner — trivially removable */}
      {__DEV__ && isBossStage && (
        <View pointerEvents="box-none" style={styles.devCardTunerOverlay}>
          <Text style={styles.devCardTunerReadout}>
            {`x:${gauntletCardTune.x} y:${gauntletCardTune.y} s:${gauntletCardTune.scale.toFixed(2)}`}
          </Text>
          <View style={styles.devCardTunerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setGauntletCardTune(p => ({ ...p, x: p.x - 4 }))}
              style={styles.devCardTunerButton}
            >
              <Text style={styles.devCardTunerButtonText}>←</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setGauntletCardTune(p => ({ ...p, y: p.y - 4 }))}
              style={styles.devCardTunerButton}
            >
              <Text style={styles.devCardTunerButtonText}>↑</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setGauntletCardTune(p => ({ ...p, y: p.y + 4 }))}
              style={styles.devCardTunerButton}
            >
              <Text style={styles.devCardTunerButtonText}>↓</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setGauntletCardTune(p => ({ ...p, x: p.x + 4 }))}
              style={styles.devCardTunerButton}
            >
              <Text style={styles.devCardTunerButtonText}>→</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setGauntletCardTune(p => ({ ...p, scale: Math.round((p.scale - 0.02) * 100) / 100 }))}
              style={styles.devCardTunerButton}
            >
              <Text style={styles.devCardTunerButtonText}>S −</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setGauntletCardTune(p => ({ ...p, scale: Math.round((p.scale + 0.02) * 100) / 100 }))}
              style={styles.devCardTunerButton}
            >
              <Text style={styles.devCardTunerButtonText}>S +</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={dumpGauntletCardTune}
              style={styles.devCardTunerDump}
            >
              <Text style={styles.devCardTunerButtonText}>DUMP CARD</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Mastery score float */}
      {floats.filter(f => f.kind === 'mastery').map(f => (
          <ScoreFloat
            key={f.id}
            value={f.value}
            startPosition={{ x: f.x, y: f.y }}
            color={f.color}
            onComplete={() => setFloats(prev => prev.filter(e => e.id !== f.id))}
          />
      ))}

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
                playRoundComplete();
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

      {mechanics.wordOutcome === 'mastered' && showMasteredOverlay && (
        <MasteredOutcomeOverlay
          word={step.word}
          headline={isHaunt ? 'BANISHED' : 'MASTERED'}
          bonusLabel={mechanics.outcomeBonusLabel}
          onContinue={mechanics.continueOutcome}
        />
      )}

      {mechanics.wordOutcome === 'haunted' && (
        <HauntedOutcomeOverlay
          word={step.word}
          detail={mechanics.outcomeDetail}
          onContinue={mechanics.continueOutcome}
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
    overflow: 'hidden',
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
  },
  kicker: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
  },
  kickerBoss: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
    position: 'absolute',
    top: -24,
    left: 20,
    right: 20,
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
    letterSpacing: FONT_SIZES.bossWordLetterSpacing,
    color: '#F5C842',
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
    fontSize: 9,
    letterSpacing: 4,
  },
  // ── Tile zone ─────────────────────────────────────────────────
  gridWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 180,
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
    ...StyleSheet.absoluteFillObject,
    zIndex: PW.z.overlay,
    elevation: PW.z.overlay,
  },
  swipeCueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: TILE_H + 96,
    zIndex: 3,
    elevation: 3,
  },
  swipeCueText: {
    position: 'absolute',
    fontFamily: FONTS.label,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swipeUpCue: {
    top: -34,
    left: 0,
    right: 0,
    color: '#F5C842',
    opacity: 0.92,
  },
  swipeRightCue: {
    top: TILE_H + 16,
    right: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deckBackingPhrase: {
    fontSize: 18,
    fontFamily: FONTS.tileCopy,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
    color: PW.color.mutedWhite,
    textAlign: 'center',
    flexShrink: 1,
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
  finalHiddenTileStack: {
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  bossChestSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  // Small stand-in for the real book during the last leg of its drop into
  // the chest — same gold-plaque material as STRIKE, at token scale.
  bossBookToken: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#F5C842',
    backgroundColor: '#0F0D2A',
  },
  bossBookTokenText: {
    color: '#F5C842',
    fontFamily: FONTS.hud,
    fontSize: 18,
    letterSpacing: 0.5,
    paddingHorizontal: 6,
  },
  chestDebugPhase: {
    position: 'absolute',
    top: -260,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    backgroundColor: '#FF00CC',
    fontFamily: FONTS.hud,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 6,
    zIndex: 999,
  },
  devCardTunerOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    zIndex: 400,
    alignItems: 'flex-end',
    gap: 4,
  },
  devCardTunerReadout: {
    color: '#F5C842',
    fontSize: 10,
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  devCardTunerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    maxWidth: 320,
  },
  devCardTunerButton: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.5)',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  devCardTunerDump: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#9B2D6B',
  },
  devCardTunerButtonText: {
    color: '#F5C842',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  finalHiddenTileFrame: {
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#0F0D2A',
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 7,
  },
  // Boss-only override — Polly's card, not the book's. Purple-tinted fill
  // (heroBookMaterial.coverPurple) + her lavender glow instead of gold.
  finalHiddenTileFramePolly: {
    backgroundColor: '#191541',
    shadowColor: '#B98ADE',
  },
  // Static cards peeking out behind the active gauntlet card — the rest of
  // Polly's thrown stack, not yet turned over.
  gauntletPeekCard: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderRadius: 14,
    borderColor: 'rgba(185,138,222,0.4)',
    backgroundColor: '#191541',
  },
  outcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 0,
    textAlign: 'center',
  },
  outcomeBonus: {
    marginTop: 16,
    color: '#F5C842',
    fontFamily: FONTS.hud,
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
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 0,
    textAlign: 'center',
  },
  outcomeContinue: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: FONTS.label,
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
    fontWeight: '900',
    fontSize: 30,
    color: '#7B2D8B',
    letterSpacing: 1,
    textShadowColor: 'rgba(123,45,139,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
