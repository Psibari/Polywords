// Deterministic randomness for one Hunt. A persisted run seed is split into
// named streams so adding a draw in one subsystem cannot silently reroll the
// word selection, mask order, or boss-gauntlet faces in another.

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function deriveSeed(seed: number, stream: string): number {
  const mixed = (seed >>> 0) ^ hashString(stream);
  return Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b) >>> 0;
}

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export function shuffleSeeded<T>(items: readonly T[], seed: number): T[] {
  const rng = createSeededRng(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createSeededTruthPlan(
  seed: number,
  stream: string,
  count: number,
): boolean[] {
  const rng = createSeededRng(deriveSeed(seed, stream));
  return Array.from({ length: Math.max(0, count) }, () => rng() < 0.5);
}
