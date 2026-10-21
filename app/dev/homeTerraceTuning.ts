import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  TERRACE_DEFAULTS,
  TERRACE_ELEMENT_IDS,
  lockTerraceAspect,
  TerraceElementId,
  TerraceOverrides,
  TerraceRect,
} from '../ui/homeTerraceScene';

// DEV-only positioning for the terrace Home (Pete, 2026-10-20: "I'm going to need a dev button to
// position stuff"). Overrides are in DESIGN units (the 443 x 960 canvas), keyed by element, and are
// saved on the phone so they survive a reload. This is a calibration aid, not production state:
// when Pete is happy, the readout is copied into app/ui/homeTerraceScene.ts as the new defaults.

const STORAGE_KEY = 'pw.dev.homeTerrace.v1';

type State = {
  loaded: boolean;
  overrides: TerraceOverrides;
  /** Force the Daily lighting state for testing: null = follow the real state. */
  forceDailyPlayed: boolean | null;
  /** Show the castle so it can be positioned; at rest it is hidden (Pete, 2026-10-20). */
  showCastle: boolean;
  load: () => Promise<void>;
  setRect: (id: TerraceElementId, rect: Partial<TerraceRect>) => void;
  setForceDailyPlayed: (value: boolean | null) => void;
  setShowCastle: (value: boolean) => void;
  resetElement: (id: TerraceElementId) => void;
  resetAll: () => void;
};

function persist(overrides: TerraceOverrides): void {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)).catch(() => {});
}

function sanitize(raw: unknown): TerraceOverrides {
  const out: TerraceOverrides = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const id of TERRACE_ELEMENT_IDS) {
    const entry = (raw as Record<string, unknown>)[id];
    if (!entry || typeof entry !== 'object') continue;
    const clean: Partial<TerraceRect> = {};
    for (const key of ['x', 'y', 'w', 'h'] as const) {
      const value = (entry as Record<string, unknown>)[key];
      if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
    }
    if (Object.keys(clean).length > 0) out[id] = clean;
  }
  return out;
}

export const useHomeTerraceTuning = create<State>((set, get) => ({
  loaded: false,
  overrides: {},
  forceDailyPlayed: null,
  showCastle: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      set({ overrides: raw ? sanitize(JSON.parse(raw)) : {}, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  setRect: (id, rect) => {
    const overrides = { ...get().overrides, [id]: { ...get().overrides[id], ...rect } };
    set({ overrides });
    persist(overrides);
  },
  setForceDailyPlayed: (value) => set({ forceDailyPlayed: value }),
  setShowCastle: (value) => set({ showCastle: value }),
  resetElement: (id) => {
    const overrides = { ...get().overrides };
    delete overrides[id];
    set({ overrides });
    persist(overrides);
  },
  resetAll: () => {
    set({ overrides: {} });
    persist({});
  },
}));

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The element's current rect: its override over its default. */
export function currentRect(id: TerraceElementId, overrides: TerraceOverrides): TerraceRect {
  return lockTerraceAspect(id, { ...TERRACE_DEFAULTS[id], ...(overrides[id] ?? {}) });
}

/** Plain-text readout of every element's final values, for Pete to copy. */
export function formatTerraceReadout(overrides: TerraceOverrides): string {
  const lines = TERRACE_ELEMENT_IDS.map((id) => {
    const r = currentRect(id, overrides);
    const moved = overrides[id] ? '*' : ' ';
    return `${moved} ${id}: x ${round2(r.x)}  y ${round2(r.y)}  w ${round2(r.w)}  h ${round2(r.h)}`;
  });
  return ['Home terrace, design units (443 x 960), * = changed from default', ...lines].join('\n');
}
