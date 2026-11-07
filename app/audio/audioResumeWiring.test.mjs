import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Guards the order that matters on return from a long absence: replace the old
// players first, THEN let music resume on the new one. Reversed, music would
// restart on the stale player and the rebuild would pull it out from under it.
const app = readFileSync('App.tsx', 'utf8');
const sfxAt = app.indexOf('rebuildSfxAfterAbsence()');
const musicAt = app.indexOf('rebuildMusicPlayerAfterAbsence()');
const resumeAt = app.indexOf("setMusicAppActive(nextState === 'active')");

assert.ok(sfxAt > 0 && musicAt > 0 && resumeAt > 0, 'App.tsx must call both rebuilds and setMusicAppActive');
assert.ok(sfxAt < resumeAt && musicAt < resumeAt, 'rebuild must happen before music resumes');
assert.match(app, /shouldRebuildAudioOnReturn\(awayTracker\.returned\(Date\.now\(\)\)\)/, 'rebuild must be gated by the away time');
assert.match(app, /awayTracker\.left\(Date\.now\(\)\)/, 'leaving the foreground must start the away clock');

// A stale player can block whoever touches it, so the rebuild may only release it.
const music = readFileSync('app/audio/MusicEngine.ts', 'utf8');
const start = music.indexOf('export function rebuildMusicPlayerAfterAbsence');
const end = music.indexOf('export function haltMusicEngine');
assert.ok(start > 0 && end > start, 'rebuildMusicPlayerAfterAbsence must exist');
const body = music.slice(start, end);
const touches = [...body.matchAll(/stalePlayer\.(\w+)/g)].map(match => match[1]);
assert.deepEqual(touches, ['remove'], 'the stale player may only be released, never read or driven');

console.log('audioResumeWiring.test.mjs passed');
