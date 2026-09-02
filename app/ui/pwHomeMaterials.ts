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
  POLLY_LINES.homeCracker,
] as const;

// ── Type scale (legibility clause: floor 14, tune on device) ──
export const homeType = {
  tagline: 32,
  dareLabel: 32,
  doorTitle: 16,
  greeting: 18,
  settingsLink: 15,
  goldFeatherReady: 14,
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
  // Dark indigo on dark screens barely separated the bubble from the
  // board — inverted so the bubble reads against the background instead
  // of blending into it. Straight token swap: face and text trade places,
  // and the rim goes solid because a half-opacity gold line disappears
  // against a cream face. (The old '#1A1055' was a raw literal outside
  // DESIGN.md's palette; its "matches Daily bubble material" comment was
  // stale — that colour appears nowhere else in the materials layer.)
  bubbleFace: PW.color.foilLight,
  bubbleRim: PW.color.goldDark,
  bubbleText: PW.color.bg,
} as const;
