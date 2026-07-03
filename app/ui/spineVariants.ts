// Deterministic per-word spine variety (width tier + lean) so the Vault
// bookcase feels collected, not manufactured. Pure TS — no RN imports;
// the test runs under plain Node via npx tsx.

export type SpineVariant = {
  widthTier: 0 | 1 | 2;
  leanDeg: number; // -1.0 … +1.0 in 0.1° steps
};

export function spineVariantFor(word: string): SpineVariant {
  // djb2 — stable, cheap, good spread on short uppercase words.
  let h = 5381;
  for (let i = 0; i < word.length; i++) {
    h = ((h << 5) + h + word.charCodeAt(i)) >>> 0;
  }
  const widthTier = (h % 3) as 0 | 1 | 2;
  const leanDeg = (((h >>> 3) % 21) - 10) / 10;
  return { widthTier, leanDeg };
}
