import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated } from 'react-native';

// ms per full beat cycle at each tension level
const CYCLE_MS = [1100, 900, 700, 550] as const;

export type HeartbeatValue = {
  pulseAnim: Animated.Value;
  tension: number;
  setTension: (t: number) => void;
};

const HeartbeatCtx = createContext<HeartbeatValue | null>(null);

export function HeartbeatProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [tension, setTension] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current?.stop();
    const cycle = CYCLE_MS[Math.min(tension, 3) as 0 | 1 | 2 | 3];
    const beatIn = Math.round(cycle * 0.2);
    const beatOut = cycle - beatIn;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: beatIn,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: beatOut,
          useNativeDriver: true,
        }),
      ]),
    );
    loopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [tension, pulseAnim]);

  return (
    <HeartbeatCtx.Provider value={{ pulseAnim, tension, setTension }}>
      {children}
    </HeartbeatCtx.Provider>
  );
}

export function useHeartbeat(): HeartbeatValue {
  const ctx = useContext(HeartbeatCtx);
  if (!ctx) throw new Error('useHeartbeat must be used inside HeartbeatProvider');
  return ctx;
}
