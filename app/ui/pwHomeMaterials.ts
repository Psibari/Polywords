import { PW } from './pwTheme';
import { heroBookMaterial } from './pwMaterials';

// ── Copy ──
export const HOME_TAGLINE = 'Polly stole the meanings. Take them back.';

// Polly speech: mixed case, never uppercase. One line per app open, rotating.
export const HOME_GREETING_LINES = [
  'Back again?',
  'Miss me?',
  'Still missing a few meanings, aren’t you.',
  'Come to lose some feathers?',
  'The words asked about you. I lied.',
  'Take your time. They’re mine either way.',
] as const;

// ── Type scale (legibility clause: floor 14, tune on device) ──
export const homeType = {
  tagline: 18,
  dareLabel: 32,
  doorEyebrow: 14,
  doorTitle: 21,
  doorCopy: 15,
  greeting: 16,
  settingsLink: 14,
  streakBadge: 14,
} as const;

// ── ENTER THE HUNT — gold dare in BOOK vocabulary ──
export const homeDare = {
  faceGradient: [PW.color.foilLight, PW.color.gold, PW.color.amber] as const,
  faceLocations: [0, 0.52, 1] as const,
  rim: PW.color.goldSoft,
  bottomEdge: PW.color.amber,
  label: PW.color.surfaceDeep,
  labelHighlight: 'rgba(255,255,255,0.38)',
  minHeight: 84,
} as const;

// ── Doors (CARD material trims) ──
export const homeDoor = {
  dailyTrim: PW.color.cardRim, // gold at hairline strength only
  vaultTrim: heroBookMaterial.coverPurpleTop, // purple leather
  title: PW.color.white,
  copy: PW.color.softWhite,
  eyebrow: PW.color.mutedWhite,
  minHeight: 150,
} as const;

// ── Polly perch geometry (the branch is part of the pose art) ──
export const homePerch = {
  bottomOffset: 404, // high enough to loom from the left, but layered behind the Home book so she never covers controls
  pollySize: 246, // antagonist-sized presence without swallowing the Hunt action
  bubbleFace: '#1A1055', // matches Daily bubble material
  bubbleRim: 'rgba(245,200,66,0.55)',
  bubbleText: PW.color.foilLight,
} as const;
