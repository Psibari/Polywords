import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { FX, FXEvent, ShardVariant } from '../ui/pwEffects';
import {
  useReducedFlashesPreference,
  useReducedMotionPreference,
} from '../hooks/usePollyAmbientMotion';
import { resolveFXAccessibility } from '../game/huntFeedbackPolicy';

export interface FXLayerHandle {
  spawn: (event: FXEvent) => void;
}

type FXEntry = FXEvent & { id: number };

function TrapShatter({
  x,
  y,
  showImpactGlow,
  onDone,
}: {
  x: number;
  y: number;
  showImpactGlow: boolean;
  onDone: () => void;
}) {
  const cfg = FX.shard.trap;

  // ── Layer 1: Impact glow ──────────────────────────────────
  const glowScale   = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(1)).current;

  // ── Layer 2: Tile chunks ──────────────────────────────────
  const CHUNK_SHAPES = [
    { w: 72, h: 52, points: '0,8 54,0 72,18 59,52 12,45', facet: '8,10 52,5 36,24 12,39' },
    { w: 58, h: 44, points: '5,0 58,9 49,39 18,44 0,20', facet: '8,5 50,11 30,22 5,19' },
    { w: 80, h: 36, points: '0,7 61,0 80,19 70,36 16,31', facet: '7,9 59,5 43,19 15,27' },
    { w: 48, h: 58, points: '12,0 48,13 42,50 21,58 0,32', facet: '14,6 42,15 25,29 5,30' },
    { w: 64, h: 40, points: '0,14 18,0 64,8 57,34 25,40', facet: '18,5 57,10 39,22 7,15' },
  ];

  const chunks = useRef(
    CHUNK_SHAPES.slice(0, cfg.chunkCount).map((shape) => {
      const angleRad =
        ((cfg.coneCenter - cfg.coneSpread / 2 +
          Math.random() * cfg.coneSpread) *
          Math.PI) /
        180;
      const speed = cfg.chunkSpeedMin + Math.random() * cfg.chunkSpeedRange;
      return {
        ...shape,
        angle: angleRad,
        speed,
        rot: (Math.random() - 0.5) * 90,
        anim: new Animated.Value(0),
      };
    })
  ).current;

  // ── Layer 3: Crystal gem shards ───────────────────────────
  const gems = useRef(
    Array.from({ length: cfg.gemCount }, (_, i) => {
      const angleRad =
        ((cfg.coneCenter - cfg.coneSpread / 2 +
          Math.random() * cfg.coneSpread) *
          Math.PI) /
        180;
      const speed = cfg.gemSpeedMin + Math.random() * cfg.gemSpeedRange;
      const width  = 6 + Math.random() * 9;
      const height = 15 + Math.random() * 18;
      return {
        angle: angleRad,
        speed,
        width,
        height,
        color: cfg.gemColors[i % cfg.gemColors.length] as string,
        rot: Math.random() * 360,
        anim: new Animated.Value(0),
        stagger: Math.random() * 40,
      };
    })
  ).current;

  React.useEffect(() => {
    // Layer 1 — glow fires immediately
    Animated.sequence([
      Animated.timing(glowScale, {
        toValue: 2.8,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 4.0,
          duration: cfg.glowDuration - 120,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: cfg.glowDuration - 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Layer 2 — chunks fire at 30ms
    const chunkTimer = setTimeout(() => {
      Animated.parallel(
        chunks.map(c =>
          Animated.timing(c.anim, {
            toValue: 1,
            duration: cfg.chunkDuration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          })
        )
      ).start();
    }, 30);

    // Layer 3 — gems fire staggered from 40ms
    const gemTimers = gems.map(g =>
      setTimeout(() => {
        Animated.timing(g.anim, {
          toValue: 1,
          duration: cfg.gemDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 40 + g.stagger)
    );

    const doneTimer = setTimeout(onDone, 780);

    return () => {
      clearTimeout(chunkTimer);
      clearTimeout(doneTimer);
      gemTimers.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Layer 1 — Impact glow at right wall */}
      {showImpactGlow && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: x - 30,
            top: y - 30,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: cfg.glowColor,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
            shadowColor: cfg.glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 20,
          }}
        />
      )}

      {/* Layer 2 — Tile chunks */}
      {chunks.map((c, i) => {
        const tx = c.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(c.angle) * c.speed],
        });
        const ty = c.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(c.angle) * c.speed + 80],
        });
        const op = c.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1, 0],
        });
        const rotate = c.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${c.rot}deg`],
        });
        return (
          <Animated.View
            key={`chunk-${i}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: x - c.w / 2,
              top: y - c.h / 2,
              width: c.w,
              height: c.h,
              opacity: op,
              transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
              shadowColor: cfg.chunkEdgeColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: showImpactGlow ? 0.6 : 0,
              shadowRadius: 6,
            }}
          >
            <Svg width={c.w} height={c.h} viewBox={`0 0 ${c.w} ${c.h}`}>
              <Polygon
                points={c.points}
                fill={cfg.chunkColors[i % cfg.chunkColors.length] as string}
                stroke={cfg.chunkEdgeColor}
                strokeWidth={1.5}
              />
              <Polygon points={c.facet} fill="rgba(255,255,255,0.12)" />
            </Svg>
          </Animated.View>
        );
      })}

      {/* Layer 3 — pointed crystal shards with glass facets */}
      {gems.map((g, i) => {
        const tx = g.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(g.angle) * g.speed],
        });
        const ty = g.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(g.angle) * g.speed + 40],
        });
        const op = g.anim.interpolate({
          inputRange: [0, 0.65, 1],
          outputRange: [1, 1, 0],
        });
        const rotate = g.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${g.rot}deg`, `${g.rot + 120}deg`],
        });
        return (
          <Animated.View
            key={`gem-${i}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: x - g.width / 2,
              top: y - g.height / 2,
              width: g.width,
              height: g.height,
              opacity: op,
              transform: [
                { translateX: tx },
                { translateY: ty },
                { rotate },
              ],
              shadowColor: g.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: showImpactGlow ? 0.8 : 0,
              shadowRadius: 4,
            }}
          >
            <Svg width={g.width} height={g.height} viewBox={`0 0 ${g.width} ${g.height}`}>
              <Polygon
                points={[
                  `${g.width * 0.5},0`,
                  `${g.width},${g.height * 0.3}`,
                  `${g.width * 0.66},${g.height}`,
                  `${g.width * 0.12},${g.height * 0.72}`,
                  `0,${g.height * 0.22}`,
                ].join(' ')}
                fill={g.color}
                stroke="rgba(255,255,255,0.32)"
                strokeWidth={0.8}
              />
              <Polygon
                points={[
                  `${g.width * 0.5},${g.height * 0.08}`,
                  `${g.width * 0.82},${g.height * 0.31}`,
                  `${g.width * 0.48},${g.height * 0.55}`,
                  `${g.width * 0.16},${g.height * 0.25}`,
                ].join(' ')}
                fill="rgba(255,255,255,0.42)"
              />
            </Svg>
          </Animated.View>
        );
      })}
    </>
  );
}

// ── ShardBurst ───────────────────────────────────────────────
function ShardBurst({
  x,
  y,
  variant = 'generic',
  onDone,
}: {
  x: number;
  y: number;
  variant?: Exclude<ShardVariant, 'trap'>;
  onDone: () => void;
}) {
  const cfg = FX.shard[variant];

  const shards = useRef(
    Array.from({ length: cfg.count }, (_, i) => {
      const baseAngle = (360 / cfg.count) * i + (Math.random() - 0.5) * 30;
      const biasedAngle = baseAngle + cfg.rightBias;
      const angle = (biasedAngle * Math.PI) / 180;
      const speed = cfg.speedMin + Math.random() * cfg.speedRange;
      return {
        angle,
        speed,
        w: cfg.widthMin + Math.random() * cfg.widthRange,
        h: cfg.heightMin + Math.random() * cfg.heightRange,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        color: cfg.colors[i % cfg.colors.length] as string,
        anim: new Animated.Value(0),
      };
    })
  ).current;

  React.useEffect(() => {
    Animated.parallel(
      shards.map(s =>
        Animated.timing(s.anim, {
          toValue: 1,
          duration: cfg.duration + Math.random() * 100,
          useNativeDriver: true,
        })
      )
    ).start(() => onDone());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {shards.map((s, i) => {
        const translateX = s.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(s.angle) * s.speed],
        });
        const translateY = s.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(s.angle) * s.speed + 120],
        });
        const opacity = s.anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 1, 0],
        });
        const rotate = s.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${s.rot}deg`, `${s.rot + s.rotSpeed * 60}deg`],
        });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: x - s.w / 2,
              top: y - s.h / 2,
              width: s.w,
              height: s.h,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          >
            <Svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
              <Polygon
                points={[
                  `${s.w * 0.5},0`,
                  `${s.w},${s.h * 0.28}`,
                  `${s.w * 0.65},${s.h}`,
                  `${s.w * 0.08},${s.h * 0.7}`,
                  `0,${s.h * 0.2}`,
                ].join(' ')}
                fill={s.color}
              />
              <Polygon
                points={[
                  `${s.w * 0.5},${s.h * 0.08}`,
                  `${s.w * 0.8},${s.h * 0.3}`,
                  `${s.w * 0.46},${s.h * 0.54}`,
                  `${s.w * 0.14},${s.h * 0.24}`,
                ].join(' ')}
                fill="rgba(255,255,255,0.28)"
              />
            </Svg>
          </Animated.View>
        );
      })}
    </>
  );
}

// ── TrailBurst ───────────────────────────────────────────────
function TrailBurst({
  x,
  y,
  onDone,
}: {
  x: number;
  y: number;
  onDone: () => void;
}) {
  const cfg = FX.trail;

  const particles = useRef(
    Array.from({ length: cfg.count }, () => {
      const angle =
        (-cfg.spreadDeg / 2 + Math.random() * cfg.spreadDeg) *
        (Math.PI / 180);
      const dist = cfg.distMin + Math.random() * cfg.distRange;
      return {
        tx: new Animated.Value(0),
        ty: new Animated.Value(0),
        op: new Animated.Value(1),
        sc: new Animated.Value(1),
        size: cfg.sizeMin + Math.random() * cfg.sizeRange,
        dx: Math.sin(angle) * dist,
        dy: -Math.cos(angle) * dist,
        stagger: Math.random() * 25,
      };
    })
  ).current;

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    particles.forEach(p => {
      timers.push(
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(p.tx, {
              toValue: p.dx,
              duration: cfg.duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(p.ty, {
              toValue: p.dy,
              duration: cfg.duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(p.op, {
              toValue: 0,
              duration: cfg.duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(p.sc, {
              toValue: 0,
              duration: cfg.duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start();
        }, p.stagger)
      );
    });
    timers.push(setTimeout(onDone, cfg.duration + 50));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: x - p.size / 2,
            top: y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: cfg.color,
            opacity: p.op,
            transform: [
              { translateX: p.tx },
              { translateY: p.ty },
              { scale: p.sc },
            ],
          }}
        />
      ))}
    </>
  );
}

function StaticImpact({ event, onDone }: { event: FXEvent; onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0.72)).current;
  const color = event.type === 'shard' && event.variant === 'trap'
    ? '#9B2D6B'
    : '#F5C842';

  React.useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => animation.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: event.x - 10,
        top: event.y - 10,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: color,
        opacity,
      }}
    />
  );
}

// ── FXLayer ──────────────────────────────────────────────────
const FXLayer = forwardRef<FXLayerHandle>(
  (_, ref) => {
    const [entries, setEntries] = useState<FXEntry[]>([]);
    const idRef = useRef(0);
    const reduceMotion = useReducedMotionPreference();
    const reduceFlashes = useReducedFlashesPreference();
    const accessibility = resolveFXAccessibility(reduceMotion, reduceFlashes);

    useImperativeHandle(ref, () => ({
      spawn: (event: FXEvent) => {
        const id = ++idRef.current;
        setEntries(prev => [...prev, { ...event, id }]);
      },
    }));

    function remove(id: number) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {entries.map(e => {
          if (accessibility.mode === 'static') {
            return (
              <StaticImpact
                key={e.id}
                event={e}
                onDone={() => remove(e.id)}
              />
            );
          }
          if (e.type === 'shard') {
            if (e.variant === 'trap') {
              return (
                <TrapShatter
                  key={e.id}
                  x={e.x}
                  y={e.y}
                  showImpactGlow={accessibility.showImpactGlow}
                  onDone={() => remove(e.id)}
                />
              );
            }
            return (
              <ShardBurst
                key={e.id}
                x={e.x}
                y={e.y}
                variant={e.variant}
                onDone={() => remove(e.id)}
              />
            );
          }
          if (e.type === 'trail') {
            return (
              <TrailBurst
                key={e.id}
                x={e.x}
                y={e.y}
                onDone={() => remove(e.id)}
              />
            );
          }
          return null;
        })}
      </View>
    );
  }
);

FXLayer.displayName = 'FXLayer';
export default FXLayer;
