export type PollyDriver =
  | 'bodyBob' | 'headTilt' | 'crownBob' | 'pupilGlance' | 'blink' | 'tailFlick'
  | 'headThrow' | 'beakOpen' | 'bodyShake' | 'wingSpread'
  | 'scalePop' | 'recoil' | 'eyeNarrow';

export type PerformanceName = 'idle' | 'smug' | 'laugh' | 'shocked';

export type Keyframe = {
  to: number;
  dur: number;
  delay?: number;
  easing?: 'linear' | 'inOut' | 'out';
};

export type Track = {
  driver: PollyDriver;
  keys: Keyframe[];
  loop?: boolean;
};

// Ambient life — a watchful predator, not a busy mascot. Slow, deliberate, quiet.
// Idle drivers are DISJOINT from reaction drivers so reactions layer cleanly on top.
export const IDLE_TRACKS: Track[] = [
  // Slow breath
  { driver: 'bodyBob', loop: true, keys: [
    { to: -2, dur: 2200, easing: 'inOut' }, { to: 0, dur: 2200, easing: 'inOut' } ] },
  // Occasional slow, deliberate head-cock toward the player
  { driver: 'headTilt', loop: true, keys: [
    { to: 1, dur: 1600, delay: 1600, easing: 'inOut' }, { to: 0, dur: 1400, delay: 1500, easing: 'inOut' },
    { to: -0.6, dur: 1500, delay: 2800, easing: 'inOut' }, { to: 0, dur: 1400, delay: 1400, easing: 'inOut' } ] },
  { driver: 'crownBob', loop: true, keys: [
    { to: -1.5, dur: 1700, delay: 400, easing: 'inOut' }, { to: 0, dur: 1500, easing: 'inOut' },
    { to: 0, dur: 400 } ] },
  // Watchful side-eye
  { driver: 'pupilGlance', loop: true, keys: [
    { to: 1.5, dur: 300, delay: 2000, easing: 'out' }, { to: 0, dur: 320, delay: 1600, easing: 'out' },
    { to: 0, dur: 3200 } ] },
  { driver: 'blink', loop: true, keys: [
    { to: 1, dur: 55, delay: 3600 }, { to: 0, dur: 85, delay: 45 }, { to: 0, dur: 2600 } ] },
  // Rare, slow tail sway
  { driver: 'tailFlick', loop: true, keys: [
    { to: 1, dur: 520, delay: 7000, easing: 'out' }, { to: 0, dur: 520, easing: 'inOut' },
    { to: 0, dur: 5200 } ] },
];

// One-shot reactions — SHARP and deliberate, not bouncy. Rest at 0, return to 0.
export const PERFORMANCES: Record<Exclude<PerformanceName, 'idle'>, Track[]> = {
  // Wrong: cold, slow contempt — head cocks, eyes narrow, one hard beak snap.
  smug: [
    { driver: 'headThrow', keys: [{ to: -0.5, dur: 240, easing: 'out' }, { to: 0, dur: 520, delay: 720, easing: 'inOut' }] },
    { driver: 'eyeNarrow', keys: [{ to: 1, dur: 260, easing: 'out' }, { to: 0, dur: 520, delay: 720, easing: 'inOut' }] },
    { driver: 'beakOpen',  keys: [{ to: 0.8, dur: 80, easing: 'out' }, { to: 0, dur: 200, delay: 100 }] },
  ],
  // Out of lives: a single hard head-throw bark, then snaps back to still.
  laugh: [
    { driver: 'headThrow', keys: [{ to: 1, dur: 110, easing: 'out' }, { to: 0, dur: 400, delay: 220, easing: 'inOut' }] },
    { driver: 'beakOpen',  keys: [{ to: 1, dur: 70, easing: 'out' }, { to: 0.15, dur: 260, delay: 60, easing: 'inOut' }, { to: 0, dur: 160 }] },
    { driver: 'bodyShake', keys: [{ to: 1, dur: 60 }, { to: -0.7, dur: 70 }, { to: 0, dur: 140 }] },
    { driver: 'recoil',    keys: [{ to: 0.4, dur: 90, easing: 'out' }, { to: 0, dur: 320, delay: 100, easing: 'inOut' }] },
  ],
  // Win: composure cracks — a fast flinch/recoil with wide eyes, then re-settle.
  shocked: [
    { driver: 'recoil',    keys: [{ to: 1, dur: 80, easing: 'out' }, { to: 0, dur: 480, delay: 140, easing: 'inOut' }] },
    { driver: 'scalePop',  keys: [{ to: 1, dur: 80, easing: 'out' }, { to: 0, dur: 280, delay: 80, easing: 'inOut' }] },
    { driver: 'eyeNarrow', keys: [{ to: -0.6, dur: 90, easing: 'out' }, { to: 0, dur: 420, delay: 160, easing: 'inOut' }] },
    { driver: 'blink',     keys: [{ to: 1, dur: 45, delay: 260 }, { to: 0, dur: 55, delay: 40 }] },
    { driver: 'beakOpen',  keys: [{ to: 0.9, dur: 80, easing: 'out' }, { to: 0, dur: 240, delay: 120 }] },
  ],
};

// Retained for the rig's optional `speaking` path (Hunt/future). Daily no longer
// uses a continuous flap — the reaction's own beak snap carries the delivery.
export const TALK_TRACK: Track = {
  driver: 'beakOpen', loop: true,
  keys: [
    { to: 0.5, dur: 120, easing: 'inOut' }, { to: 0.05, dur: 160, easing: 'inOut' },
  ],
};
