import type { ImageSourcePropType } from 'react-native';

// TEST-ONLY registry of AI-video-derived Polly clips (keyed, normalized to the
// approved neutral perch sprite, exported as animated WebP).
//
// Status: EXPERIMENT. docs/superpowers/specs/2026-10-06-polly-animation-architecture-design.md
// says "Do not use unconstrained text-to-video output as a shipping Polly animation
// source." These clips exist only to be judged on a phone in Settings -> Polly Clip Lab.
// Nothing in Hunt, Daily, Home or Results reads this file.

export type PollyClipName =
  | 'idleBlinkHq'
  | 'idleBlinkLite'
  | 'laugh'
  | 'rattled'
  | 'bored'
  | 'smugLookaway';

export type PollyClipDef = {
  source: ImageSourcePropType;
  label: string;
  // Suggested rivalry-ledger state (docs/POLLY_POLYBOOK_LOG_LINES.md). Suggestion only.
  suggestedUse: string;
  loops: boolean;
  frames: number;
  frameMs: number;
  durationMs: number;
  width: number;
  height: number;
  kb: number;
};

export const POLLY_CLIPS: Record<PollyClipName, PollyClipDef> = {
  idleBlinkHq: {
    source: require('../../assets/images/polly/clips/polly_clip_idle_blink_hq.webp'),
    label: 'Idle blink (HQ)',
    suggestedUse: 'Neutral / smug idle loop, 519 x 758, 24 fps',
    loops: true, frames: 96, frameMs: 42, durationMs: 4032, width: 519, height: 758, kb: 4224,
  },
  idleBlinkLite: {
    source: require('../../assets/images/polly/clips/polly_clip_idle_blink_lite.webp'),
    label: 'Idle blink (Lite)',
    suggestedUse: 'Same loop at 346 x 505, to judge sharpness vs size',
    loops: true, frames: 96, frameMs: 42, durationMs: 4032, width: 346, height: 505, kb: 2459,
  },
  laugh: {
    source: require('../../assets/images/polly/clips/polly_clip_laugh.webp'),
    label: 'Laugh',
    suggestedUse: 'Gloat when Polly wins (HAUNT_FAILED_LAUGH moments)',
    loops: false, frames: 123, frameMs: 83, durationMs: 10209, width: 346, height: 505, kb: 2871,
  },
  rattled: {
    source: require('../../assets/images/polly/clips/polly_clip_rattled.webp'),
    label: 'Rattled -> deflated',
    suggestedUse: 'RATTLED, then CONCEDING when the player beats her',
    loops: false, frames: 120, frameMs: 83, durationMs: 9960, width: 346, height: 505, kb: 2702,
  },
  bored: {
    source: require('../../assets/images/polly/clips/polly_clip_bored.webp'),
    label: 'Bored / yawn',
    suggestedUse: 'DISMISSIVE',
    loops: false, frames: 120, frameMs: 83, durationMs: 9960, width: 346, height: 505, kb: 2749,
  },
  smugLookaway: {
    source: require('../../assets/images/polly/clips/polly_clip_smug_lookaway.webp'),
    label: 'Smug look-away',
    suggestedUse: 'AMUSED',
    loops: false, frames: 120, frameMs: 83, durationMs: 9960, width: 346, height: 505, kb: 2918,
  },
};

export const POLLY_CLIP_ORDER: readonly PollyClipName[] = [
  'idleBlinkHq',
  'idleBlinkLite',
  'laugh',
  'rattled',
  'bored',
  'smugLookaway',
];

// Reaction clips the director demo can cut to from the idle loop.
export const POLLY_REACTION_CLIPS: readonly PollyClipName[] = [
  'smugLookaway',
  'bored',
  'rattled',
  'laugh',
];

// Model sheet canvas (docs/POLLY_MODEL_SHEET_v1.md). Clips are exported on this aspect.
export const POLLY_CLIP_ASPECT = 1515 / 1038;
