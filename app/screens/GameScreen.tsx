import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { MaskBoard } from '../components/MaskBoard';
import { BossBoard } from '../components/BossBoard';
import { StreakDisplay } from '../components/StreakDisplay';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';
import { PW } from '../ui/pwTheme';
import { heroBookMaterial } from '../ui/pwMaterials';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import { BOSS_SKY_TUNING, HUNT_SKY_TUNING } from '../ui/ambientSkyTuning';
import ResultsScreen from './ResultsScreen';
import { playSfx, preloadSfx, unloadSfx, sfxReady } from '../audio/sfx';
import { startMusic, stopMusic, setMusicState, MusicState, musicReady } from '../audio/MusicEngine';
import { Haptics } from '../utils/haptics';
import FXLayer, { FXLayerHandle } from '../components/FXLayer';
import { ShardVariant } from '../ui/pwEffects';
import { usePollyVisits } from '../hooks/usePollyVisits';
import { PollyHuntVisit } from '../components/PollyHuntVisit';
import { HuntIntroOverlay } from '../components/HuntIntroOverlay';
import { BossIntroOverlay } from '../components/BossIntroOverlay';
import { PollyExitConfirm } from '../components/PollyExitConfirm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReducedFlashesPreference, useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { INTRO_SEEN_KEY, BOSS_INTRO_SEEN_KEY } from '../constants/storageKeys';

const MAX_FEATHERS = 6;

function BossCrownIcon() {
  return (
    <Svg width={15} height={12} viewBox="0 0 30 24" accessibilityElementsHidden>
      <Path
        d="M3 6.5L9.2 13 15 3l5.8 10L27 6.5 24.7 20H5.3L3 6.5Z"
        fill={PW.color.gold}
        stroke={PW.color.foilLight}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M6 17.2h18" stroke={PW.color.bgDeep} strokeWidth={1.5} opacity={0.55} />
    </Svg>
  );
}
// ─── PURPLE FLASH — trap-caught confirmation ───────────────────
function PurpleFlash({ flashKey }: { flashKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceFlashes = useReducedFlashesPreference();
  useEffect(() => {
    if (flashKey === 0 || reduceFlashes) {
      opacity.setValue(0);
      return;
    }
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.50, duration: 69,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 391, useNativeDriver: true }),
    ]).start();
  }, [flashKey, reduceFlashes]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#7B2D8B', opacity }}
    />
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
function GoldFlash({ flashKey }: { flashKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceFlashes = useReducedFlashesPreference();
  useEffect(() => {
    if (flashKey === 0 || reduceFlashes) {
      opacity.setValue(0);
      return;
    }
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.38, duration: 65,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 260, useNativeDriver: true }),
    ]).start();
  }, [flashKey, reduceFlashes]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#F5C842', opacity }}
    />
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────

function TopBar({ navigation }: { navigation: any }) {
  const game  = useGameStore(s => s.game);
  const gauntletActive = useGameStore(s => s.game.gauntletActive);
  const goldFeatherAvailable = useGameStore(s => s.goldFeatherAvailable);
  const goldFeatherExpiresAt = useGameStore(s => s.goldFeatherExpiresAt);
  const filledFeathers = Math.max(0, Math.min(MAX_FEATHERS, game.lives));
  const hasReserve     = game.lives > MAX_FEATHERS;
  const hasGoldFeather =
    goldFeatherAvailable &&
    goldFeatherExpiresAt !== null &&
    Date.now() < goldFeatherExpiresAt;
  const total   = game.session.length;
  const current = game.stepIndex;
  const reduceMotion = useReducedMotionPreference();

  const animScore = useRef(new Animated.Value(game.score)).current;
  const [displayScore, setDisplayScore] = useState(game.score);

  useEffect(() => {
    const id = animScore.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => animScore.removeListener(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reduceMotion !== false) {
      animScore.setValue(game.score);
      return;
    }
    Animated.timing(animScore, {
      toValue: game.score,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [game.score, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={tb.outerRow}>
      <View style={tb.root}>
        <View style={tb.statsRow}>
          <View style={tb.scoreWrap}>
            <Text style={tb.scoreVal} numberOfLines={1} adjustsFontSizeToFit>{displayScore}</Text>
            <StreakDisplay />
          </View>
          <View
            style={tb.featherRow}
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
                <Text style={tb.reservePlus}>+</Text>
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
          </View>
        </View>
        <RoundChips current={current} total={total} />
      </View>
    </View>
  );
}

// ─── ROUND CHIPS ─────────────────────────────────────────────

function RoundChips({ current, total }: { current: number; total: number }) {
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
    <View style={tb.chipsRow}>
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
              <Text style={[tb.chipLabel, isCurrent && tb.chipLabelCurrent]}>
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
  root: {
    flex: 1,
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
    borderColor: heroBookMaterial.goldHairline,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Floating, bottom-right — stacked above the __DEV__-only boss-jump
  // buttons (styles.devBossOverlay, right: 10, bottom: 10) rather than
  // overlapping them. This is meant to be the pause button's permanent home
  // once those dev buttons are removed, not a temporary parking spot.
  pauseBtn: {
    position: 'absolute',
    right: 10,
    bottom: 74,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 200,
  },
  pausePressed: {
    opacity: 0.7,
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 3.5,
  },
  pauseBar: {
    width: 3.5,
    height: 13,
    borderRadius: 1.5,
    backgroundColor: PW.color.softWhite,
  },
  // Score + StreakDisplay share this row; StreakDisplay renders nothing at
  // all when there's no active chain, so no space is reserved for it.
  scoreWrap: {
    // Allowed to compress under width pressure — see scoreVal's
    // adjustsFontSizeToFit below. The feather row must never shrink (a life
    // indicator that visually shrinks when it's fuller would read backwards),
    // so the score is what gives when a 5-digit score + an active streak +
    // all 8 feather elements (6 lives + reserve "+" + Gold Feather) would
    // otherwise overflow the row and get silently clipped by tb.root's
    // overflow: 'hidden' (the original bug this HUD redesign was for).
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
    minWidth: 0,
  },
  scoreVal: {
    color: PW.color.gold,
    // Was 50/52 — shrunk so the score fits alongside the feather row.
    // adjustsFontSizeToFit (see the Text usage above) lets it compress
    // further under pressure; this is its normal-case starting size.
    fontSize: 36,
    fontFamily: FONTS.hud,
    lineHeight: 38,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: PW.color.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
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
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
  },
  chip: {
    width: 28,
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
  const game       = useGameStore(s => s.game);
  const startGame  = useGameStore(s => s.startGame);
  const forfeitGame = useGameStore(s => s.forfeitGame);
  const consumeFeatherMilestone = useGameStore(s => s.consumeFeatherMilestone);
  const consumeMercy = useGameStore(s => s.consumeMercy);
  const loadGoldFeather = useGameStore(s => s.loadGoldFeather);
  const checkGoldFeatherExpiry = useGameStore(s => s.checkGoldFeatherExpiry);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  // ── Exit guard — leaving mid-Hunt takes a real choice, never silence ────
  // beforeRemove fires for edge-swipe-back, Android back, and any
  // navigation away, so this is the one place that covers all three.
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  const pendingExitActionRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (game.status !== 'playing') return;
      e.preventDefault();
      pendingExitActionRef.current = e.data.action;
      setExitConfirmVisible(true);
    });
    return unsubscribe;
  }, [navigation, game.status]);

  const handleStayHunting = useCallback(() => {
    pendingExitActionRef.current = null;
    setExitConfirmVisible(false);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    setExitConfirmVisible(false);
    const action = pendingExitActionRef.current;
    pendingExitActionRef.current = null;
    forfeitGame();
    if (action) navigation.dispatch(action);
  }, [navigation, forfeitGame]);

  // ── Feather float animation ────────────────────────────────
  const featherFloatY       = useRef(new Animated.Value(0)).current;
  const featherFloatOpacity = useRef(new Animated.Value(0)).current;
  const [showFeatherFloat, setShowFeatherFloat] = useState(false);

  // ── Effects overlay ────────────────────────────────────────
  const fxLayerRef    = useRef<FXLayerHandle>(null);
  const prevChainRef  = useRef<number>(1);

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
  const [purpleFlashKey, setPurpleFlashKey] = useState(0);
  const [redFlashKey,    setRedFlashKey]    = useState(0);
  const [goldFlashKey,   setGoldFlashKey]   = useState(0);

  const handleTrapCaught = useCallback(() => setPurpleFlashKey(k => k + 1), []);
  const handleWrongSwipe = useCallback(() => setRedFlashKey(k => k + 1),    []);
  const handleGoldFlash  = useCallback(() => setGoldFlashKey(k => k + 1),   []);

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
    if (game.status !== 'playing') {
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
  }, [game.stepIndex, game.status, resetIdleTimer]);

  useEffect(() => {
    preloadSfx();
    return () => {
      unloadSfx();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Audio and the board used to render independently and just show up
  // whenever each one's own async work finished — the visible "things
  // arrive at different times" glitch. This holds the initial reveal
  // (via gameplayGateActive below) until both engines report ready, same
  // fail-open philosophy as introSeen/bossIntroSeen: never blocks forever.
  const [audioReady, setAudioReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all([sfxReady(), musicReady()]).then(() => {
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

  // ── First-hunt intro overlay ──────────────────────────────────
  // null = still loading the flag; fail open so gameplay is never blocked.
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(INTRO_SEEN_KEY)
      .then(v => setIntroSeen(v === 'true'))
      .catch(() => setIntroSeen(true));
  }, []);
  const [introVisitPending, setIntroVisitPending] = useState(false);
  const handleIntroDismiss = useCallback(() => {
    setIntroSeen(true);
    setIntroVisitPending(true);
    AsyncStorage.setItem(INTRO_SEEN_KEY, 'true').catch(() => {});
  }, []);

  // ── First-boss-only warning overlay ─────────────────────────────
  // The first encounter gates the board mount so its entrance, haptics, and
  // decision clock all begin after the player dismisses this explanation.
  const [bossIntroSeen, setBossIntroSeen] = useState<boolean | null>(null);
  const [bossTransitionActive, setBossTransitionActive] = useState(false);
  const skipBossTransitionStepRef = useRef<number | null>(null);
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

  useEffect(() => {
    if (game.status === 'complete' || game.status === 'gameOver') {
      playSfx('roundComplete');
    }
  }, [game.status]);

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

  useEffect(() => {
    if (!game.featherMilestone) return;
    consumeFeatherMilestone();
    Haptics.selectionAsync();
    featherFloatY.setValue(0);
    featherFloatOpacity.setValue(0);
    setShowFeatherFloat(true);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(featherFloatOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
        Animated.timing(featherFloatY, {
          toValue: -12, duration: 200, useNativeDriver: true,
        }),
      ]),
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(featherFloatOpacity, {
          toValue: 0, duration: 300, useNativeDriver: true,
        }),
        Animated.timing(featherFloatY, {
          toValue: -44, duration: 300, useNativeDriver: true,
        }),
      ]),
    ]).start(() => setShowFeatherFloat(false));
  }, [game.featherMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fledgling Mercy — Polly revives her prey once ─────────────
  const mercyFloatY       = useRef(new Animated.Value(0)).current;
  const mercyFloatOpacity = useRef(new Animated.Value(0)).current;
  const [showMercyFloat, setShowMercyFloat] = useState(false);

  useEffect(() => {
    if (!game.mercyTriggered) return;
    consumeMercy();
    playSfx('pollySqwawkLaugh');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    mercyFloatY.setValue(0);
    mercyFloatOpacity.setValue(0);
    setShowMercyFloat(true);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(mercyFloatOpacity, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
        Animated.timing(mercyFloatY, {
          toValue: -10, duration: 220, useNativeDriver: true,
        }),
      ]),
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(mercyFloatOpacity, {
          toValue: 0, duration: 320, useNativeDriver: true,
        }),
        Animated.timing(mercyFloatY, {
          toValue: -36, duration: 320, useNativeDriver: true,
        }),
      ]),
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
      state = 'onARun';
    } else if (game.chainMultiplier >= 1.5) {
      state = 'rhythm';
    } else {
      state = 'neutral';
    }
    setMusicState('hunt', state);
  }, [game.chainMultiplier, game.lives, game.stepIndex, game.status, isIdleStatic]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chain break detection ─────────────────────────────────────
  useEffect(() => {
    if (prevChainRef.current >= 2.5 && game.chainMultiplier === 1.0) {
      playSfx('chainBreak');
    }
    prevChainRef.current = game.chainMultiplier;
  }, [game.chainMultiplier]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRestart() {
    startGame();
    setMissedCount(0);
  }

  function handleHome() {
    navigation.navigate('Home');
  }

  function handleDevJumpToBoss(livesOverride?: number) {
    if (!__DEV__) return;

    const currentGame = useGameStore.getState().game;
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
      },
    });
    setMissedCount(0);
    setShowFeatherFloat(false);
  }

  const isDone = game.status === 'complete' || game.status === 'gameOver';
  const activeStep = currentStep(game);
  const isBossRound =
    !isDone &&
    activeStep.kind === 'word' &&
    activeStep.eventType === 'bossWord';

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
    const timer = setTimeout(() => setBossTransitionActive(false), 760);
    return () => clearTimeout(timer);
  }, [game.stepIndex, bossIntroSeen, isBossRound]);

  const gameplayGateActive =
    introSeen !== true ||
    (isBossRound && bossIntroSeen !== true) ||
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

  return (
    <View style={styles.screen}>
      <AmbientSkyBackground {...(isBossRound ? BOSS_SKY_TUNING : HUNT_SKY_TUNING)} />
      {/* Radial vignette, not a flat top-to-bottom scrim: keeps the hero word
          card's stage clear (so the starfield behind it actually reads) while
          still darkening the edges for focus. Replaces a prior flat gradient
          that smothered the ambient sky layers in the middle of the screen. */}
      <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
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
            style={StyleSheet.absoluteFillObject}
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
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}
      {!isDone && <TopBar navigation={navigation} />}
      {!isDone && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pause the Hunt"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={({ pressed }) => [tb.pauseBtn, pressed && tb.pausePressed]}
          hitSlop={8}
        >
          <View style={tb.pauseBars}>
            <View style={tb.pauseBar} />
            <View style={tb.pauseBar} />
          </View>
        </Pressable>
      )}
      {isDone ? (
        <ResultsScreen onRestart={handleRestart} onHome={handleHome} />
      ) : !gameplayGateActive ? (
        <GameContent
          spawnEffect={spawnEffect}
          onTrapCaught={handleTrapCaught}
          onWrongSwipe={handleWrongSwipe}
          onGoldFlash={handleGoldFlash}
          onSwipeAttempt={resetIdleTimer}
          fireIntroVisit={introVisitPending}
          onIntroVisitFired={() => setIntroVisitPending(false)}
        />
      ) : null}
      {__DEV__ && !isDone && !isBossRound && (
        <View pointerEvents="box-none" style={styles.devBossOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to boss round"
            onPress={() => handleDevJumpToBoss()}
            style={styles.devBossButton}
          >
            <Text style={styles.devBossButtonText}>BOSS</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to boss round with two lives remaining"
            onPress={() => handleDevJumpToBoss(2)}
            style={[styles.devBossButton, styles.devBossButtonCrisis]}
          >
            <Text style={styles.devBossButtonText}>BOSS{'\n'}(CRISIS)</Text>
          </Pressable>
        </View>
      )}

      {/* ── Flash overlays — zIndex 50, above game content ── */}
      <PurpleFlash flashKey={purpleFlashKey} />
      <RedFlash    flashKey={redFlashKey} />
      <GoldFlash   flashKey={goldFlashKey} />

      {/* ── Effects overlay — pointerEvents none, zIndex 100 ── */}
      <View style={styles.effectsOverlay} pointerEvents="none">
        {showFeatherFloat && (
          <Animated.Text
            style={[
              gs.featherFloat,
              {
                opacity:   featherFloatOpacity,
                transform: [{ translateY: featherFloatY }],
              },
            ]}
          >
            SCORE MILESTONE
          </Animated.Text>
        )}
        {showMercyFloat && (
          <Animated.Text
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

      {introSeen === false && !isDone && (
        <HuntIntroOverlay onDismiss={handleIntroDismiss} />
      )}

      {introSeen === true && bossIntroSeen === false && isBossRound && (
        <BossIntroOverlay onDismiss={handleBossIntroDismiss} />
      )}

      {bossTransitionActive && isBossRound && (
        <View style={styles.bossTransition} pointerEvents="none" accessible accessibilityLabel="Polly's Word. One last breath.">
          <Text style={styles.bossTransitionKicker}>
            {activeStep.kind === 'word' && activeStep.isMasteryRematch ? "MASTER'S REMATCH" : "POLLY'S WORD"}
          </Text>
          <Text style={styles.bossTransitionCopy}>ONE LAST BREATH</Text>
        </View>
      )}

      {exitConfirmVisible && (
        <PollyExitConfirm onStay={handleStayHunting} onLeave={handleConfirmLeave} />
      )}
      </SafeAreaView>
    </View>
  );
}

// ─── GAME CONTENT ─────────────────────────────────────────────

function GameContent({
  spawnEffect,
  onTrapCaught,
  onWrongSwipe,
  onGoldFlash,
  onSwipeAttempt,
  fireIntroVisit,
  onIntroVisitFired,
}: {
  spawnEffect: (type: 'shard' | 'trail', x: number, y: number) => void;
  onTrapCaught: () => void;
  onWrongSwipe: () => void;
  onGoldFlash: () => void;
  onSwipeAttempt: () => void;
  fireIntroVisit: boolean;
  onIntroVisitFired: () => void;
}) {
  const game = useGameStore(s => s.game);
  const ghosts = useGameStore(s => s.ghosts);
  const step = currentStep(game);
  const ghostRunsMissed = step.kind === 'word' && step.isHauntReturn
    ? ghosts.find(ghost => ghost.wordId === step.word.trim().toUpperCase())?.runsMissed ?? 0
    : 0;

  // Visit layer lives HERE, above MaskBoard's per-word remount boundary
  // (key={stepIndex}) — word-completion beats must outlive the board.
  const { visit, onVisitDone, firePollyEvent } = usePollyVisits(
    step.kind === 'word' && step.eventType === 'speedRound',
    ghostRunsMissed,
  );

  useEffect(() => {
    if (!fireIntroVisit) return;
    firePollyEvent('huntIntro');
    onIntroVisitFired();
  }, [fireIntroVisit, firePollyEvent, onIntroVisitFired]);

  if (step.kind === 'word') {
    // Same predicate GameDirector uses for isBossRound, so routing here and
    // the boss background/scrim there stay in lockstep.
    const isBossStep = step.eventType === 'bossWord';
    const Board = isBossStep ? BossBoard : MaskBoard;
    return (
      <View style={{ flex: 1 }}>
        <Board
          key={`board-${game.stepIndex}`}
          step={step}
          spawnEffect={spawnEffect}
          onTrapCaught={onTrapCaught}
          onWrongSwipe={onWrongSwipe}
          onGoldFlash={onGoldFlash}
          onSwipeAttempt={onSwipeAttempt}
          firePollyEvent={firePollyEvent}
        />
        <PollyHuntVisit visit={visit} onDone={onVisitDone} />
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
    ...StyleSheet.absoluteFillObject,
  },
  bossBackground: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: 'rgba(245,200,66,0.04)',
  },
  bossTransition: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 290,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,13,42,0.94)',
  },
  bossTransitionKicker: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    fontSize: 34,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  bossTransitionCopy: {
    marginTop: 8,
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 3,
  },
  devBossOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
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
    letterSpacing: 2,
    textShadowColor:  'rgba(123,45,139,0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  featherFloat: {
    position:   'absolute',
    top:        72,
    right:      20,
    color:      '#F5C842',
    fontSize:   13,
    fontFamily: FONTS.wordDisplay,
    fontWeight: '700',
    letterSpacing: 1.5,
    textShadowColor:  'rgba(245,200,66,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
