import { create } from 'zustand';

// DEV-ONLY live calibration for the complete Daily castle assembly. Values
// are intentionally not persisted: every reload returns to the current
// production fit baseline. Remove this store and its panel after Pete locks
// the final transform on-device.
export const DAILY_CASTLE_TUNING_DEFAULTS = {
  scale: 1,
  x: 0,
  y: 0,
} as const;

export const DAILY_CASTLE_TUNING_STEPS = {
  scale: 0.01,
  x: 2,
  y: 2,
} as const;

export const DAILY_CASTLE_TUNING_LIMITS = {
  scale: { min: 0.85, max: 1.05 },
  x: { min: -60, max: 60 },
  y: { min: -100, max: 100 },
} as const;

type DailyCastleTuningState = {
  scale: number;
  x: number;
  y: number;
  setScale: (value: number) => void;
  setX: (value: number) => void;
  setY: (value: number) => void;
  reset: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const useDailyCastleTuning = create<DailyCastleTuningState>((set) => ({
  ...DAILY_CASTLE_TUNING_DEFAULTS,
  setScale: (scale) => set({
    scale: clamp(
      scale,
      DAILY_CASTLE_TUNING_LIMITS.scale.min,
      DAILY_CASTLE_TUNING_LIMITS.scale.max,
    ),
  }),
  setX: (x) => set({
    x: clamp(x, DAILY_CASTLE_TUNING_LIMITS.x.min, DAILY_CASTLE_TUNING_LIMITS.x.max),
  }),
  setY: (y) => set({
    y: clamp(y, DAILY_CASTLE_TUNING_LIMITS.y.min, DAILY_CASTLE_TUNING_LIMITS.y.max),
  }),
  reset: () => set({ ...DAILY_CASTLE_TUNING_DEFAULTS }),
}));
