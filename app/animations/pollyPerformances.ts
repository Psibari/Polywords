export type PollyDriver =
  | 'bodyBob' | 'headTilt' | 'crownBob' | 'pupilGlance' | 'blink'
  | 'tailFlick' | 'wingTwitch'
  | 'headThrow' | 'beakOpen' | 'bodyShake' | 'wingSpread'
  | 'scalePop' | 'recoil';

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

// Ambient life — loops forever underneath everything (ported from PollyRig idle).
export const IDLE_TRACKS: Track[] = [
  { driver: 'bodyBob', loop: true, keys: [
    { to: -1.25, dur: 1600, easing: 'inOut' }, { to: 0, dur: 1600, easing: 'inOut' } ] },
  { driver: 'headTilt', loop: true, keys: [
    { to: 1, dur: 1400, delay: 700, easing: 'inOut' }, { to: 0, dur: 1200, delay: 900, easing: 'inOut' },
    { to: -1, dur: 1400, delay: 1300, easing: 'inOut' }, { to: 0, dur: 1200, delay: 900, easing: 'inOut' } ] },
  { driver: 'crownBob', loop: true, keys: [
    { to: -1.75, dur: 1450, delay: 320, easing: 'inOut' }, { to: 0, dur: 1250, delay: 0, easing: 'inOut' },
    { to: 0, dur: 180 } ] },
  { driver: 'pupilGlance', loop: true, keys: [
    { to: 1.25, dur: 220, delay: 2600, easing: 'out' }, { to: 0, dur: 260, delay: 750, easing: 'out' },
    { to: 0, dur: 3600 } ] },
  { driver: 'blink', loop: true, keys: [
    { to: 1, dur: 55, delay: 3200 }, { to: 0, dur: 75, delay: 45 }, { to: 0, dur: 2100 } ] },
  { driver: 'tailFlick', loop: true, keys: [
    { to: 1, dur: 280, delay: 4300, easing: 'out' }, { to: -0.35, dur: 320, easing: 'inOut' },
    { to: 0, dur: 300, easing: 'inOut' }, { to: 0, dur: 2200 } ] },
  { driver: 'wingTwitch', loop: true, keys: [
    { to: 1, dur: 130, delay: 6200, easing: 'out' }, { to: 0, dur: 220, easing: 'inOut' },
    { to: 0, dur: 3100 } ] },
];

// One-shot reactions. Reaction drivers rest at 0 and return to 0.
export const PERFORMANCES: Record<Exclude<PerformanceName, 'idle'>, Track[]> = {
  smug: [
    { driver: 'headThrow', keys: [{ to: -0.4, dur: 180, easing: 'out' }, { to: 0, dur: 420, delay: 300, easing: 'inOut' }] },
    { driver: 'beakOpen',  keys: [{ to: 0.5, dur: 120 }, { to: 0, dur: 160, delay: 120 }] },
    { driver: 'wingSpread', keys: [{ to: 0.35, dur: 200, easing: 'out' }, { to: 0, dur: 380, delay: 200, easing: 'inOut' }] },
  ],
  laugh: [
    { driver: 'headThrow', keys: [{ to: 1, dur: 140, easing: 'out' }, { to: 0.5, dur: 160 }, { to: 1, dur: 150 }, { to: 0, dur: 360, delay: 120, easing: 'inOut' }] },
    { driver: 'beakOpen',  keys: [{ to: 1, dur: 90 }, { to: 0.2, dur: 90 }, { to: 1, dur: 90 }, { to: 0.2, dur: 90 }, { to: 1, dur: 90 }, { to: 0, dur: 150, delay: 120 }] },
    { driver: 'bodyShake', keys: [{ to: 1, dur: 70 }, { to: -1, dur: 70 }, { to: 1, dur: 70 }, { to: -0.6, dur: 70 }, { to: 0, dur: 120 }] },
    { driver: 'tailFlick', keys: [{ to: 1, dur: 160, easing: 'out' }, { to: 0, dur: 320, delay: 200, easing: 'inOut' }] },
    { driver: 'wingSpread', keys: [{ to: 0.7, dur: 150, easing: 'out' }, { to: 0, dur: 420, delay: 250, easing: 'inOut' }] },
  ],
  shocked: [
    { driver: 'recoil',   keys: [{ to: 1, dur: 90, easing: 'out' }, { to: 0, dur: 520, delay: 160, easing: 'inOut' }] },
    { driver: 'scalePop', keys: [{ to: 1, dur: 90, easing: 'out' }, { to: 0, dur: 300, delay: 80, easing: 'inOut' }] },
    { driver: 'blink',    keys: [{ to: 1, dur: 45 }, { to: 0, dur: 55, delay: 40 }, { to: 1, dur: 45, delay: 60 }, { to: 0, dur: 55, delay: 40 }] },
    { driver: 'beakOpen', keys: [{ to: 0.9, dur: 90, easing: 'out' }, { to: 0, dur: 260, delay: 140 }] },
  ],
};

// Silent talk loop — flaps the beak while a bubble is up (cosmetic delivery).
export const TALK_TRACK: Track = {
  driver: 'beakOpen', loop: true,
  keys: [
    { to: 0.55, dur: 110, easing: 'inOut' }, { to: 0.05, dur: 130, easing: 'inOut' },
    { to: 0.4, dur: 120, easing: 'inOut' }, { to: 0.05, dur: 150, easing: 'inOut' },
  ],
};
