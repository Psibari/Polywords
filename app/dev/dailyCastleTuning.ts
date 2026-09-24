import { create } from 'zustand';

// Independent, ephemeral device calibration. RESET restores production values.
export const DAILY_CASTLE_TUNING_DEFAULTS = {
  background: { scale: 1, x: 0, y: 0 },
  wall: { scale: 1, x: 0, y: 0 },
  gate: { scale: 1, x: 0, closedY: 0, openTravel: 286 },
  grid: { x: 0, y: 0, cardWidth: 167, cardHeight: 62, columnGap: 12, rowGap: 12 },
  clues: { x: 0, y: 0, width: 226, verticalGap: 76 },
};

export type DailyCastleGroup = keyof typeof DAILY_CASTLE_TUNING_DEFAULTS;
type State = typeof DAILY_CASTLE_TUNING_DEFAULTS & {
  setValue: (group: DailyCastleGroup, key: string, value: number) => void;
  reset: () => void;
};

export const useDailyCastleTuning = create<State>((set) => ({
  ...DAILY_CASTLE_TUNING_DEFAULTS,
  setValue: (group, key, value) => set((state) => ({
    [group]: { ...state[group], [key]: value },
  })),
  reset: () => set({
    background: { ...DAILY_CASTLE_TUNING_DEFAULTS.background },
    wall: { ...DAILY_CASTLE_TUNING_DEFAULTS.wall },
    gate: { ...DAILY_CASTLE_TUNING_DEFAULTS.gate },
    grid: { ...DAILY_CASTLE_TUNING_DEFAULTS.grid },
    clues: { ...DAILY_CASTLE_TUNING_DEFAULTS.clues },
  }),
}));
