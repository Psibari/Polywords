import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { SESSION } from '../game/session';
import { useGameStore } from '../store/useGameStore';
import { HeartbeatBackground } from '../components/HeartbeatBackground';
import { MaskBoard } from '../components/MaskBoard';
import { StreakDisplay } from '../components/StreakDisplay';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';
import ResultsScreen from './ResultsScreen';
import { initSounds, playRoundComplete } from '../utils/SoundEngine';

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
            backgroundColor: '#4CAF50',
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
      Animated.timing(opacity, { toValue: 0.45, duration: 50,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 370, useNativeDriver: true }),
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
  const total   = SESSION.length;
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

function FeatherIcon({ filled }: { filled: boolean }) {
  return (
    <View style={tb.featherBox}>
      <View style={[tb.featherBlade, filled ? tb.featherBladeFilled : tb.featherBladeEmpty]}>
        <View style={[tb.featherHighlight, filled ? tb.featherHighlightFilled : tb.featherHighlightEmpty]} />
      </View>
      <View style={[tb.featherShaft, filled ? tb.featherShaftFilled : tb.featherShaftEmpty]} />
    </View>
  );
}

const tb = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 28,
  },
  scoreVal: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.hudScore,
    fontFamily: FONTS.hud,
    minWidth: 52,
  },
  featherRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 3,
    minWidth: 58,
    height: 22,
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
    backgroundColor: 'rgba(123,45,139,0.12)',
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
    backgroundColor: 'rgba(118,101,135,0.55)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 12,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotDone:      { backgroundColor: '#FFD700' },
  dotCurrent:   { backgroundColor: '#FFFFFF' },
  dotRemaining: { backgroundColor: 'rgba(255,255,255,0.25)' },
});

// ─── INNER DIRECTOR ───────────────────────────────────────────

type EffectEntry = { id: number; type: 'shard' | 'trail'; x: number; y: number };

function GameDirector({ navigation }: { navigation: any }) {
  const game       = useGameStore(s => s.game);
  const startGame  = useGameStore(s => s.startGame);
  const loadGhosts = useGameStore(s => s.loadGhosts);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  // ── Effects overlay state ──────────────────────────────────
  const [effects, setEffects] = useState<EffectEntry[]>([]);
  const effectIdRef = useRef(0);

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
    loadGhosts();
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

  function handleRestart() {
    startGame();
    setMissedCount(0);
  }

  function handleHome() {
    navigation.navigate('Home');
  }

  const isDone      = game.status === 'complete' || game.status === 'gameOver';
  const screenBg = '#1A1830';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: screenBg }]}>
      <HeartbeatBackground />
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
  effectsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
});
