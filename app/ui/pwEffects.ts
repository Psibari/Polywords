export const FX = {
  shard: {
    trap: {
      count: 20,
      speedMin: 220,
      speedRange: 200,
      widthMin: 6,
      widthRange: 8,
      heightMin: 22,
      heightRange: 22,
      rightBias: 50,
      duration: 800,
      colors: ['#7B2D8B', '#9B2D6B'] as const,
    },
    mastery: {
      count: 16,
      speedMin: 200,
      speedRange: 180,
      widthMin: 6,
      widthRange: 8,
      heightMin: 20,
      heightRange: 16,
      rightBias: 30,
      duration: 900,
      colors: ['#7B2D8B', '#9B2D6B'] as const,
    },
    generic: {
      count: 14,
      speedMin: 180,
      speedRange: 160,
      widthMin: 6,
      widthRange: 8,
      heightMin: 18,
      heightRange: 18,
      rightBias: 30,
      duration: 800,
      colors: ['#7B2D8B', '#9B2D6B'] as const,
    },
  },
  trail: {
    count: 12,
    spreadDeg: 100,
    distMin: 50,
    distRange: 30,
    sizeMin: 4,
    sizeRange: 3,
    duration: 320,
    color: '#F5C842' as const,
  },
} as const;

export type ShardVariant = keyof typeof FX.shard;

export type FXEvent =
  | { type: 'shard'; x: number; y: number; variant?: ShardVariant }
  | { type: 'trail'; x: number; y: number };
