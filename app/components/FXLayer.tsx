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

// ── ShardBurst ───────────────────────────────────────────────
function ShardBurst({
  x,
  y,
  variant = 'generic',
  onDone,
}: {
  x: number;
  y: number;
  variant?: ShardVariant;
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
