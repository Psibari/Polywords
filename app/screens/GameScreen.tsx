import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { MaskBoard } from '../components/MaskBoard';
import { StreakDisplay } from '../components/StreakDisplay';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';
import ResultsScreen from './ResultsScreen';
import { initSounds, playRoundComplete } from '../utils/SoundEngine';
import { preloadSfx, unloadSfx } from '../audio/sfx';
import { initMusicEngine, startMusic, stopMusic, setMusicState, triggerChainBreak, disposeMusicEngine, MusicState } from '../audio/MusicEngine';
import * as Haptics from 'expo-haptics';

// ─── SHARD ANGLES ────────────────────────────────────────────
const SHARD_ANGLES = [0, 30, 60, 90, 120, 150, 180, 220, 270, 320];
const SHARD_COLORS = ['#7B2D8B', '#9B2D6B'];
const MAX_FEATHERS = 5;

// ─── SHARD EFFECT ─────────────────────────────────────────────
function ShardEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const anims = useRef(
    SHARD_ANGLES.map((_, i) => ({
      tx:      new Animated.Value(0),
      ty:      new Animated.Value(0),
      rot:     new Animated.Value(0),
      op:      new Animated.Value(1),
      sc:      new Animated.Value(1),
      color:   SHARD_COLORS[i % 2],
      w:       8  + Math.random() * 8,   // 8–16
      h:       4  + Math.random() * 4,   // 4–8
      dist:    55 + Math.random() * 35,  // 55–90
      rotEnd:  90 + Math.random() * 270, // 90–360
      stagger: Math.random() * 50,       // 0–50ms
    }))
  ).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    SHARD_ANGLES.forEach((angle, i) => {
      const rad  = (angle * Math.PI) / 180;
      const anim = anims[i];
      timers.push(setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.tx,  { toValue: Math.cos(rad) * anim.dist, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.ty,  { toValue: Math.sin(rad) * anim.dist, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.rot, { toValue: 1,                         duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.op,  { toValue: 0,                         duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.sc,  { toValue: 0.1,                       duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
      }, anim.stagger));
    });

    timers.push(setTimeout(onDone, 450));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {anims.map((anim, i) => {
        const rotInterp = anim.rot.interpolate({
          inputRange:  [0, 1],
          outputRange: ['0deg', `${anim.rotEnd}deg`],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position:        'absolute',
              left:            x - anim.w / 2,
              top:             y - anim.h / 2,
              width:           anim.w,
              height:          anim.h,
              borderRadius:    2,
              backgroundColor: anim.color,
              transform: [
                { translateX: anim.tx },
                { translateY: anim.ty },
                { rotate:     rotInterp },
                { scale:      anim.sc  },
              ],
              opacity: anim.op,
            }}
          />
        );
      })}
    </>
  );
}

// ─── TRAIL EFFECT ─────────────────────────────────────────────
const TRAIL_COUNT = 12;

function TrailEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const anims = useRef(
    Array.from({ length: TRAIL_COUNT }, () => {
      const angle = (-50 + Math.random() * 100) * (Math.PI / 180);
      const dist  = 50 + Math.random() * 30;
      return {
        tx:      new Animated.Value(0),
        ty:      new Animated.Value(0),
        op:      new Animated.Value(1),
        sc:      new Animated.Value(1),
        size:    4 + Math.random() * 3,
        dx:      Math.sin(angle) * dist,
        dy:      -Math.cos(angle) * dist,
        stagger: Math.random() * 25,
      };
    })
  ).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    anims.forEach(anim => {
      timers.push(setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.tx, { toValue: anim.dx, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.ty, { toValue: anim.dy, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.op, { toValue: 0,       duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.sc, { toValue: 0,       duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
      }, anim.stagger));
    });

    timers.push(setTimeout(onDone, 400));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            position:        'absolute',
            left:            x - anim.size / 2,
            top:             y - anim.size / 2,
            width:           anim.size,
            height:          anim.size,
            borderRadius:    anim.size / 2,
            backgroundColor: '#F5C842',
            transform: [
              { translateX: anim.tx },
              { translateY: anim.ty },
              { scale:      anim.sc },
            ],
            opacity: anim.op,
          }}
        />
      ))}
    </>
  );
}

// ─── PURPLE FLASH — trap-caught confirmation ───────────────────
function PurpleFlash({ flashKey }: { flashKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (flashKey === 0) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.50, duration: 69,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 391, useNativeDriver: true }),
    ]).start();
  }, [flashKey]); // eslint-disable-line react-hooks/exhaustive-deps
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
  useEffect(() => {
    if (flashKey === 0) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.10, duration: 35,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 145, useNativeDriver: true }),
    ]).start();
  }, [flashKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#CC2200', opacity }}
    />
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────

function TopBar() {
  const game  = useGameStore(s => s.game);
  const filledFeathers = Math.max(0, Math.min(MAX_FEATHERS, game.lives));
  const hasReserve     = game.lives > MAX_FEATHERS;
  const total   = game.session.length;
  const current = game.stepIndex;

  const animScore = useRef(new Animated.Value(game.score)).current;
  const [displayScore, setDisplayScore] = useState(game.score);

  useEffect(() => {
    const id = animScore.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => animScore.removeListener(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Animated.timing(animScore, {
      toValue: game.score,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [game.score]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={tb.root}>
      {/* Row 1: Score · Streak · Feathers */}
      <View style={tb.statsRow}>
        <Text style={tb.scoreVal}>{displayScore}</Text>
        <StreakDisplay />
        <View
          style={tb.featherRow}
          accessible
          accessibilityLabel={`${filledFeathers} feathers remaining`}
        >
          {Array.from({ length: MAX_FEATHERS }, (_, i) => (
            <FeatherIcon key={i} filled={i < filledFeathers} />
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
        </View>
      </View>

      {/* Row 2: Progress dots */}
      <View style={tb.dotsRow}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              tb.dot,
              i < current   ? tb.dotDone    :
              i === current ? tb.dotCurrent :
              tb.dotRemaining,
            ]}
          />
        ))}
      </View>
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

function FeatherIcon({ filled }: { filled: boolean }) {
  const prevFilled    = useRef(filled);
  const shakeRotate   = useRef(new Animated.Value(0)).current;
  const launchY       = useRef(new Animated.Value(0)).current;
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const dustProgress  = useRef(new Animated.Value(0)).current;
  const [dustVisible, setDustVisible] = useState(false);

  useEffect(() => {
    if (prevFilled.current === true && filled === false) {
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
  }, [filled]); // eslint-disable-line react-hooks/exhaustive-deps

  const rotate = shakeRotate.interpolate({
    inputRange:  [-8, 8],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <View style={[tb.featherBox, { overflow: 'visible' }]}>
      <Animated.View
        style={{
          transform: [{ rotate }, { translateY: launchY }],
          opacity: launchOpacity,
        }}
      >
        <View style={[tb.featherBlade, filled ? tb.featherBladeFilled : tb.featherBladeEmpty]}>
          <View style={[tb.featherHighlight, filled ? tb.featherHighlightFilled : tb.featherHighlightEmpty]} />
        </View>
        <View style={[tb.featherShaft, filled ? tb.featherShaftFilled : tb.featherShaftEmpty]} />
      </Animated.View>
      {dustVisible && FEATHER_DUST_ANGLES.map((angle, i) => (
        <FeatherDustParticle key={i} angle={angle} progress={dustProgress} />
      ))}
    </View>
  );
}

const tb = StyleSheet.create({
  root: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingTop: 7,
    paddingBottom: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(15,13,42,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.36)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 28,
  },
  scoreVal: {
    color: '#F5C842',
    fontSize: FONT_SIZES.hudScore,
    fontFamily: FONTS.hud,
    letterSpacing: 1,
    textTransform: 'uppercase',
    minWidth: 62,
    textShadowColor: 'rgba(245,200,66,0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  label: {
    fontFamily: FONTS.label,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
  },
  featherRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 3,
    minWidth: 58,
    height: 22,
    overflow: 'visible',
  },
  featherBox: {
    width: 10,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featherBlade: {
    position: 'absolute',
    width: 8,
    height: 15,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    transform: [{ rotate: '-22deg' }],
    shadowColor: '#7B2D8B',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 3,
    elevation: 2,
  },
  featherBladeFilled: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(123,45,139,0.75)',
    shadowOpacity: 0.35,
  },
  featherBladeEmpty: {
    backgroundColor: 'rgba(155,89,182,0.18)',
    borderColor: 'rgba(118,101,135,0.45)',
    shadowOpacity: 0,
  },
  featherHighlight: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 2,
    height: 9,
    borderRadius: 1,
  },
  featherHighlightFilled: {
    backgroundColor: 'rgba(123,45,139,0.22)',
  },
  featherHighlightEmpty: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  featherShaft: {
    position: 'absolute',
    width: 1.25,
    height: 14,
    borderRadius: 1,
    transform: [{ rotate: '-22deg' }],
  },
  featherShaftFilled: {
    backgroundColor: 'rgba(123,45,139,0.65)',
  },
  featherShaftEmpty: {
    backgroundColor: 'rgba(155,89,182,0.14)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 12,
    gap: 5,
    marginTop: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotDone:      { backgroundColor: '#F5C842' },
  dotCurrent:   { backgroundColor: '#FFFFFF', shadowColor: '#FFFFFF', shadowOpacity: 0.5, shadowRadius: 5 },
  dotRemaining: { backgroundColor: 'rgba(255,255,255,0.18)' },
  reserveFeatherWrap: {
    width:          8,
    height:         14,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     2,
  },
  reserveBlade: {
    width:  6,
    height: 11,
    borderColor: 'rgba(245,200,66,0.85)',
    backgroundColor: 'rgba(245,200,66,0.25)',
  },
  reserveShaft: {
    backgroundColor: 'rgba(245,200,66,0.75)',
    height: 10,
  },
  reservePlus: {
    position:   'absolute',
    top:        -5,
    right:      -3,
    color:      '#F5C842',
    fontSize:   7,
    fontWeight: '700',
    lineHeight: 8,
  },
});

// ─── INNER DIRECTOR ───────────────────────────────────────────

type EffectEntry = { id: number; type: 'shard' | 'trail'; x: number; y: number };

function GameDirector({ navigation }: { navigation: any }) {
  const game       = useGameStore(s => s.game);
  const startGame  = useGameStore(s => s.startGame);
  const consumeFeatherMilestone = useGameStore(s => s.consumeFeatherMilestone);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  // ── Feather float animation ────────────────────────────────
  const featherFloatY       = useRef(new Animated.Value(0)).current;
  const featherFloatOpacity = useRef(new Animated.Value(0)).current;
  const [showFeatherFloat, setShowFeatherFloat] = useState(false);

  // ── Effects overlay state ──────────────────────────────────
  const [effects, setEffects] = useState<EffectEntry[]>([]);
  const effectIdRef   = useRef(0);
  const prevChainRef  = useRef<number>(1);

  const spawnEffect = useCallback((type: 'shard' | 'trail', x: number, y: number) => {
    const id = ++effectIdRef.current;
    setEffects(prev => [...prev, { id, type, x, y }]);
  }, []);

  // ── Flash overlay state ────────────────────────────────────
  const [purpleFlashKey, setPurpleFlashKey] = useState(0);
  const [redFlashKey,    setRedFlashKey]    = useState(0);

  const handleTrapCaught = useCallback(() => setPurpleFlashKey(k => k + 1), []);
  const handleWrongSwipe = useCallback(() => setRedFlashKey(k => k + 1),    []);

  function removeEffect(id: number) {
    setEffects(prev => prev.filter(e => e.id !== id));
  }

  useEffect(() => {
    initSounds();
    preloadSfx();
    return () => {
      unloadSfx();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.status === 'complete' || game.status === 'gameOver') {
      playRoundComplete();
    }
  }, [game.status]);

  useEffect(() => {
    const step = currentStep(game);
    if (step.kind !== 'word') return;

    let t = 0;
    if (step.eventType === 'bossWord') t = 3;
    if (game.lives === 1) t = Math.min(t + 1, 3);
    if (missedCount >= 2) t = Math.min(t + 1, 3);
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

  // ── Music Engine lifecycle ────────────────────────────────────
  useEffect(() => {
    initMusicEngine().then(() => startMusic());
    return () => {
      stopMusic();
      disposeMusicEngine();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Music state machine ───────────────────────────────────────
  useEffect(() => {
    if (game.status !== 'playing') {
      stopMusic();
      return;
    }
    let state: MusicState;
    if (game.stepIndex === 11) {
      state = 'boss';
    } else if (game.lives <= 2) {
      state = 'crisis';
    } else if (game.chainMultiplier >= 2.5) {
      state = 'onARun';
    } else if (game.chainMultiplier >= 1.5) {
      state = 'rhythm';
    } else {
      state = 'neutral';
    }
    setMusicState(state);
  }, [game.chainMultiplier, game.lives, game.stepIndex, game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chain break detection ─────────────────────────────────────
  useEffect(() => {
    if (prevChainRef.current >= 2.5 && game.chainMultiplier === 1.0) {
      triggerChainBreak();
    }
    prevChainRef.current = game.chainMultiplier;
  }, [game.chainMultiplier]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop music on run end ─────────────────────────────────────
  useEffect(() => {
    if (game.status === 'gameOver' || game.status === 'complete') {
      stopMusic();
    }
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRestart() {
    startGame();
    setMissedCount(0);
  }

  function handleHome() {
    navigation.navigate('Home');
  }

  const isDone      = game.status === 'complete' || game.status === 'gameOver';
  return (
    <SafeAreaView style={styles.screen}>
      <ImageBackground
        source={require('../../assets/home/home-hero-bg.png')}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <View pointerEvents="none" style={styles.backgroundOverlay} />
      </ImageBackground>
      {!isDone && <TopBar />}
      {isDone ? (
        <ResultsScreen onRestart={handleRestart} onHome={handleHome} />
      ) : (
        <GameContent
          spawnEffect={spawnEffect}
          onTrapCaught={handleTrapCaught}
          onWrongSwipe={handleWrongSwipe}
        />
      )}

      {/* ── Flash overlays — zIndex 50, above game content ── */}
      <PurpleFlash flashKey={purpleFlashKey} />
      <RedFlash    flashKey={redFlashKey} />

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
            +1 FEATHER
          </Animated.Text>
        )}
        {effects.map(e =>
          e.type === 'shard'
            ? <ShardEffect key={e.id} x={e.x} y={e.y} onDone={() => removeEffect(e.id)} />
            : <TrailEffect key={e.id} x={e.x} y={e.y} onDone={() => removeEffect(e.id)} />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── GAME CONTENT ─────────────────────────────────────────────

function GameContent({
  spawnEffect,
  onTrapCaught,
  onWrongSwipe,
}: {
  spawnEffect: (type: 'shard' | 'trail', x: number, y: number) => void;
  onTrapCaught: () => void;
  onWrongSwipe: () => void;
}) {
  const game = useGameStore(s => s.game);
  const step = currentStep(game);

  if (step.kind === 'word') {
    return (
      <MaskBoard
        key={`board-${game.stepIndex}`}
        step={step}
        spawnEffect={spawnEffect}
        onTrapCaught={onTrapCaught}
        onWrongSwipe={onWrongSwipe}
      />
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
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,7,30,0.66)',
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
