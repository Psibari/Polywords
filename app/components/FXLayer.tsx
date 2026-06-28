import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { FX, FXEvent, ShardVariant } from '../ui/pwEffects';

export interface FXLayerHandle {
  spawn: (event: FXEvent) => void;
}

type FXEntry = FXEvent & { id: number };

function TrapShatter({
  x,
  y,
  onDone,
}: {
  x: number;
  y: number;
  onDone: () => void;
}) {
  const cfg = FX.shard.trap;

  // ── Layer 1: Impact glow ──────────────────────────────────
  const glowScale   = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(1)).current;

  // ── Layer 2: Tile chunks ──────────────────────────────────
  const CHUNK_SHAPES = [
    { w: 72, h: 52, br: { tl: 2,  tr: 18, br: 4,  bl: 10 } },
    { w: 58, h: 44, br: { tl: 14, tr: 2,  br: 10, bl: 2  } },
    { w: 80, h: 36, br: { tl: 2,  tr: 6,  br: 22, bl: 4  } },
    { w: 48, h: 58, br: { tl: 10, tr: 2,  br: 2,  bl: 16 } },
    { w: 64, h: 40, br: { tl: 2,  tr: 10, br: 6,  bl: 2  } },
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
      const size   = 8 + Math.random() * 16;
      return {
        angle: angleRad,
        speed,
        size,
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
              backgroundColor: cfg.chunkColors[i % cfg.chunkColors.length] as string,
              borderTopLeftRadius: c.br.tl,
              borderTopRightRadius: c.br.tr,
              borderBottomRightRadius: c.br.br,
              borderBottomLeftRadius: c.br.bl,
              borderWidth: 1.5,
              borderColor: cfg.chunkEdgeColor,
              opacity: op,
              transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
              shadowColor: cfg.chunkEdgeColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
            }}
          />
        );
      })}

      {/* Layer 3 — Crystal gem shards (rotated squares with inner facet) */}
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
              left: x - g.size / 2,
              top: y - g.size / 2,
              width: g.size,
              height: g.size,
              backgroundColor: g.color,
              borderRadius: 2,
              opacity: op,
              transform: [
                { translateX: tx },
                { translateY: ty },
                { rotate },
                { rotate: '45deg' },
              ],
              shadowColor: g.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            }}
          >
            {/* Inner facet highlight */}
            <View
              style={{
                position: 'absolute',
                top: '12%',
                left: '12%',
                width: '38%',
                height: '38%',
                backgroundColor: 'rgba(255,255,255,0.50)',
                borderRadius: 1,
              }}
            />
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
              borderRadius: 2,
              backgroundColor: s.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
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

// ── FXLayer ──────────────────────────────────────────────────
const FXLayer = forwardRef<FXLayerHandle>(
  (_, ref) => {
    const [entries, setEntries] = useState<FXEntry[]>([]);
    const idRef = useRef(0);

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
          if (e.type === 'shard') {
            if (e.variant === 'trap') {
              return (
                <TrapShatter
                  key={e.id}
                  x={e.x}
                  y={e.y}
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
