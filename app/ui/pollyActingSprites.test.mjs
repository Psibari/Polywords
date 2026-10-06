import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const registryUrl = new URL('./pollyActingSprites.ts', import.meta.url);
assert.equal(existsSync(registryUrl), true, 'Polly acting sprite registry must exist');

const source = readFileSync(registryUrl, 'utf8');
const expectedFiles = [
  'polly_perch_neutral.png',
  'polly_perch_smug.png',
  'polly_perch_smirk.png',
  'polly_perch_blink.png',
  'polly_perch_laugh_01.png',
  'polly_perch_laugh_02.png',
  'polly_perch_laugh_03.png',
  'polly_perch_shocked.png',
  'polly_perch_sulk.png',
  'polly_perch_angry.png',
  'polly_perch_big_laugh.png',
  'polly_perch_embarrassed.png',
  'polly_shock_jump.png',
];

for (const file of expectedFiles) {
  assert.ok(source.includes(`perch_poses/${file}`), `registry must include ${file}`);
}

assert.match(
  source,
  /POLLY_LAUGH_SEQUENCE\s*=\s*\[\s*POLLY_ACTING_SPRITES\.laugh01,\s*POLLY_ACTING_SPRITES\.laugh02,\s*POLLY_ACTING_SPRITES\.laugh03,?\s*\]/s,
  'laugh sequence must remain laugh01 -> laugh02 -> laugh03',
);

assert.ok(source.includes('POLLY_ACTING_SPRITE_ORDER'), 'viewer order must be explicit and deterministic');
assert.ok(source.includes('POLLY_LAUGH_FRAME_MS'), 'laugh frame timing must be centralized');

console.log('Polly acting sprite registry contract passed');
