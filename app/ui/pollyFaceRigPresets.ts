// Ledger-state expression presets for the Polly Face Rig DEV viewer.
//
// DEV ONLY. These are starting guesses, built only from the controls the rig2 face
// layers already have, so Pete can judge them on a phone and tune the numbers.
// Nothing here is read by Home, Daily, Results or Hunt, and PollyPerchRig is untouched.
//
// The five states and their registers come from docs/POLLY_POLYBOOK_LOG_LINES.md
// (DISMISSIVE, AMUSED, WATCHFUL, RATTLED, CONCEDING).

export type FaceRigMouth = 'closed' | 'open' | 'gape';
export type FaceRigBrow = 'normal' | 'angry' | 'shock' | 'slack';

// Bounds shared with the viewer. EYE_REST_MIN stays above the blink-closed scale (0.05)
// so a held lid never looks like a blink in progress.
export const FACE_RIG_EYE_REST_MIN = 0.4;
export const FACE_RIG_EYE_REST_MAX = 1;
export const FACE_RIG_BREATHE_MS_MIN = 800;
export const FACE_RIG_BREATHE_MS_MAX = 3600;

export type FaceRigPreset = {
  id: 'dismissive' | 'amused' | 'watchful' | 'rattled' | 'conceding';
  label: string;
  // What the eye rests at between blinks. 1 = the art as drawn (smug half-lid).
  // Lower squashes the lid shut from its bottom edge, so it reads as heavier / bored.
  eyeRest: number;
  eyeWide: boolean;
  brow: FaceRigBrow;
  mouth: FaceRigMouth;
  crownTilt: boolean;
  blink: boolean;
  breathe: boolean;
  breatheMs: number;
  life: boolean;
  shake: boolean;
  intent: string;
};

export const FACE_RIG_PRESETS: readonly FaceRigPreset[] = [
  {
    id: 'dismissive',
    label: 'DISMISSIVE',
    eyeRest: 0.62,
    eyeWide: false,
    brow: 'normal',
    mouth: 'closed',
    crownTilt: false,
    blink: true,
    breathe: true,
    breatheMs: 2800,
    life: false,
    shake: false,
    intent: 'Heavy lid, slow breathing, barely moving. She has not noticed you.',
  },
  {
    id: 'amused',
    label: 'AMUSED',
    eyeRest: 1,
    eyeWide: false,
    brow: 'normal',
    mouth: 'closed',
    crownTilt: false,
    blink: true,
    breathe: true,
    breatheMs: 1800,
    life: true,
    shake: false,
    intent: 'The art as drawn: smug lid, easy breathing, a lazy lean now and then.',
  },
  {
    id: 'watchful',
    label: 'WATCHFUL',
    eyeRest: 0.8,
    eyeWide: false,
    brow: 'angry',
    mouth: 'closed',
    crownTilt: false,
    blink: true,
    breathe: true,
    breatheMs: 1400,
    life: true,
    shake: false,
    intent: 'Narrowed eye, brow down, quicker breath. Still, but paying attention.',
  },
  {
    id: 'rattled',
    label: 'RATTLED',
    eyeRest: 1,
    eyeWide: true,
    brow: 'shock',
    mouth: 'open',
    crownTilt: true,
    blink: true,
    breathe: true,
    breatheMs: 1000,
    life: false,
    shake: true,
    intent: 'Wide eye, shocked brow, beak open, crown wobbling, a quick shake.',
  },
  {
    id: 'conceding',
    label: 'CONCEDING',
    eyeRest: 0.5,
    eyeWide: false,
    brow: 'slack',
    mouth: 'closed',
    crownTilt: false,
    blink: true,
    breathe: true,
    breatheMs: 3400,
    life: false,
    shake: false,
    intent: 'Lid half shut, brow slack, slow heavy breath. Out of excuses.',
  },
];

// Shake: horizontal jitter on the whole figure, in px at the 340pt stage.
export const FACE_RIG_SHAKE_STEPS: readonly number[] = [7, -7, 5, -5, 3, 0];
export const FACE_RIG_SHAKE_STEP_MS = 55;

// Slack brow: drops and tips the opposite way to the angry brow.
export const FACE_RIG_BROW_SLACK_Y = 4;
export const FACE_RIG_BROW_SLACK_DEG = 5;
