import { create } from 'zustand';
import { DAILY_CASTLE_GRID } from '../ui/dailyCastleScene';

// Independent, ephemeral device calibration, in canvas points (430-wide
// reference). RESET restores production values. The arch and wall are NOT
// tunable on their own: they share one export canvas and must stay registered.
export const DAILY_CASTLE_TUNING_DEFAULTS = {
  gate: { x: 0, y: 0 },
  grid: {
    x: 0,
    y: 0,
    cardWidth: DAILY_CASTLE_GRID.cardWidth,
    cardHeight: DAILY_CASTLE_GRID.cardHeight,
    columnGap: DAILY_CASTLE_GRID.columnGap,
    rowGap: DAILY_CASTLE_GRID.rowGap,
  },
  // width 0 = the measured plank width from dailyCastleScene.
  clues: { x: 0, y: 0, width: 0 },
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
    gate: { ...DAILY_CASTLE_TUNING_DEFAULTS.gate },
    grid: { ...DAILY_CASTLE_TUNING_DEFAULTS.grid },
    clues: { ...DAILY_CASTLE_TUNING_DEFAULTS.clues },
  }),
}));
