// app/components/ambientSkyLayout.test.ts
// Run with: npx.cmd -y tsx app/components/ambientSkyLayout.test.ts
import { StarDensity, MoonPhase } from './ambientSkyLayout';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const density: StarDensity = 'medium';
const phase: MoonPhase = 'gibbous';
eq(density, 'medium', 'StarDensity accepts medium');
eq(phase, 'gibbous', 'MoonPhase accepts gibbous');

console.log('OK');
