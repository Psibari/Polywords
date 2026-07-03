// Run with: npx.cmd -y tsx app/ui/spineVariants.test.ts
// Plain assert script (repo has no jest; no node:assert — no @types/node).
import { spineVariantFor } from './spineVariants';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}
function ok(cond: boolean, label: string): void {
  if (!cond) throw new Error(label);
}

const SAMPLE = [
  'BARK', 'DRAFT', 'SEAL', 'PALM', 'STEAL', 'TIDE', 'MASK', 'CHARGE',
  'SPRING', 'LIGHT', 'CAST', 'SCALE', 'PITCH', 'CROWN', 'FILE', 'TOAST',
  'BOLT', 'RING', 'JAM', 'DUCK',
];

// Determinism: same word, same variant — every time.
for (const w of SAMPLE) {
  const a = spineVariantFor(w);
  const b = spineVariantFor(w);
  eq(a.widthTier, b.widthTier, `${w} widthTier deterministic`);
  eq(a.leanDeg, b.leanDeg, `${w} leanDeg deterministic`);
}

// Ranges: tier in {0,1,2}, lean within ±1 degree.
for (const w of SAMPLE) {
  const v = spineVariantFor(w);
  ok(v.widthTier === 0 || v.widthTier === 1 || v.widthTier === 2, `${w} tier in range (${v.widthTier})`);
  ok(v.leanDeg >= -1.0 && v.leanDeg <= 1.0, `${w} lean in range (${v.leanDeg})`);
}

// Variety: a 20-word shelf must not be uniform.
const tiers = new Set(SAMPLE.map(w => spineVariantFor(w).widthTier));
ok(tiers.size >= 2, `sample uses ${tiers.size} width tier(s) — expected at least 2`);

console.log('OK — spineVariants: all assertions passed');
