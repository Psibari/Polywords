import { PW } from './pwTheme';
import { heroBookMaterial } from './pwMaterials';
import { POLLY_LINES } from '../game/pollyCharacter';

// ── Copy ──
export const HOME_TAGLINE = 'WORDS HAVE MEANING..SSsss';

// Polly speech: mixed case, never uppercase. One line per app open, rotating.
export const HOME_GREETING_LINES = [
  POLLY_LINES.homeBackAgain,
  POLLY_LINES.homeMissMe,
  POLLY_LINES.homeMissingMeanings,
  POLLY_LINES.homeLoseFeathers,
  POLLY_LINES.homeWordsAsked,
  POLLY_LINES.homeTakeTime,
] as const;

// ── Type scale (legibility clause: floor 14, tune on device) ──
export const homeType = {
  tagline: 32,
  dareLabel: 32,
  doorTitle: 16,
  greeting: 18,
  settingsLink: 15,
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
  minHeight: 150,
} as const;

// ── Polly perch geometry (the branch is part of the pose art) ──
export const homePerch = {
  bottomOffset: 364, // high enough to loom from the left, but layered behind the Home book so she never covers controls; lowered to clear the bigger tagline above her
  pollySize: 246, // antagonist-sized presence without swallowing the Hunt action
  bubbleFace: '#1A1055', // matches Daily bubble material
  bubbleRim: 'rgba(245,200,66,0.55)',
  bubbleText: PW.color.foilLight,
} as const;
