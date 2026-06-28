export const FX = {
  shard: {
    // trap variant drives TrapShatter — three-layer system
    trap: {
      // Layer 2: tile chunks
      chunkCount: 5,
      chunkColors: ['#141038', '#1A1248'] as const,
      chunkEdgeColor: '#9B2D6B' as const,
      chunkSpeedMin: 180,
      chunkSpeedRange: 140,
      chunkDuration: 620,
      // Layer 3: crystal gem shards
      gemCount: 14,
      gemColors: ['#7B2D8B', '#9B2D6B', '#9B2D6B', '#F5C842'] as const,
      gemSpeedMin: 220,
      gemSpeedRange: 200,
      gemDuration: 700,
      // Scatter cone: leftward from right wall, 80deg spread
      coneCenter: 180,  // degrees — straight left
      coneSpread: 80,   // degrees total spread
      // Layer 1: impact glow
      glowColor: '#F5C842' as const,
      glowFadeColor: '#9B2D6B' as const,
      glowDuration: 300,
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
