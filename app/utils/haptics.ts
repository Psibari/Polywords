import * as ExpoHaptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';

export type HapticCue =
  | 'gestureThreshold'
  | 'pressSteady'
  | 'pressSharp'
  | 'pressRazor'
  | 'pressUntrappable'
  | 'pressHunted'
  | 'standardCorrect'
  | 'heightenedCorrect'
  | 'wrong'
  | 'tierUp'
  | 'tierUpRazor'
  | 'tierUpUntrappable'
  | 'claimMedium'
  | 'trapRejectLight'
  | 'trapRejectMedium'
  | 'trapRejectHeavy'
  // Hunt-only copies of cues the Daily also fires (2026-11-06): the Hunt was
  // made stronger, the Daily keeps the originals untouched.
  | 'huntPressSteady'
  | 'huntStandardCorrect'
  | 'huntClaimMedium'
  | 'huntHeightenedCorrect'
  | 'huntWrong'
  | 'bookShut'
  | 'fellOffSmall'
  | 'fellOffMedium'
  | 'fellOffBig'
  | 'bossEntry'
  | 'bossCorrect'
  | 'bossHaunted'
  | 'masteredBookImpact'
  | 'hauntedBookImpact'
  | 'mastery'
  | 'gauntletPick'
  | 'gauntletBegin'
  | 'gauntletWallTremble'
  | 'gauntletBrickTear'
  | 'gauntletBrickLand'
  | 'dailyInkPress'
  | 'dailyRodStop'
  | 'dailyGateShut'
  | 'dailyStoneSeat'
  | 'breachHit'
  | 'breachSmash';

function hapticsEnabled(): boolean {
  return useGameStore.getState().hapticsEnabled;
}

// gauntletWallTremble fires a burst of one-shots rather than a single call,
// so its pulses can outlive the moment that started them (e.g. a fast exit
// from the gauntlet). Tracked here rather than returned from cueAsync, which
// must keep returning Promise<void> for every other cue — cancelled through
// the companion Haptics.cancelGauntletWallTremble() instead.
let gauntletWallTrembleTimeouts: ReturnType<typeof setTimeout>[] = [];

// ── THE BREACH HAPTICS: the one place to tune them ──
// Pete, 2026-11-04: "I want them to hit heavy when the castle rumbles. I want
// to feel it. When the brick breaks, I want to feel it." Heavy is otherwise
// kept for Boss beats; Pete overrode that for the breach. expo-haptics has no
// sustained buzz, so the rumble is simulated the way gauntletWallTremble is:
// Soft impacts close enough together to fuse into one grind.
// Tuned and approved on the phone by Pete, 5 Nov 2026. Each tier: its `hits` (ms from the contact),
// then a Soft `rumble` (one pulse every `everyMs`, from `fromMs` to `toMs`
// inclusive), then an optional `last` hit.
type BreachHapticShape = {
  hits: readonly { atMs: number; style: ExpoHaptics.ImpactFeedbackStyle }[];
  rumble: { style: ExpoHaptics.ImpactFeedbackStyle; fromMs: number; toMs: number; everyMs: number };
  last: { atMs: number; style: ExpoHaptics.ImpactFeedbackStyle } | null;
};
export const BREACH_HAPTICS: Readonly<{ hit: BreachHapticShape; smash: BreachHapticShape }> = {
  // Two clues: the plaque hits the shut gate. About 0.5 s, the strongest part
  // of the 720 ms castle shake. 7 rumble pulses.
  hit: {
    hits: [
      { atMs: 0, style: ExpoHaptics.ImpactFeedbackStyle.Rigid },
      { atMs: 55, style: ExpoHaptics.ImpactFeedbackStyle.Heavy },
    ],
    rumble: { style: ExpoHaptics.ImpactFeedbackStyle.Soft, fromMs: 120, toMs: 480, everyMs: 60 },
    last: null,
  },
  // One clue: the brick breaks. Two Heavy hits, the Rigid crack, a 13-pulse
  // rumble, a Medium to settle. About 0.9 s, matching the 950 ms shake.
  smash: {
    hits: [
      { atMs: 0, style: ExpoHaptics.ImpactFeedbackStyle.Heavy },
      { atMs: 70, style: ExpoHaptics.ImpactFeedbackStyle.Heavy },
      { atMs: 130, style: ExpoHaptics.ImpactFeedbackStyle.Rigid },
    ],
    rumble: { style: ExpoHaptics.ImpactFeedbackStyle.Soft, fromMs: 190, toMs: 850, everyMs: 55 },
    last: { atMs: 900, style: ExpoHaptics.ImpactFeedbackStyle.Medium },
  },
};

/** Every pulse of a breach shape, in order: its hits, the rumble, the last hit. */
export function breachHapticPulses(shape: BreachHapticShape): { atMs: number; style: ExpoHaptics.ImpactFeedbackStyle }[] {
  const pulses = [...shape.hits];
  const { style, fromMs, toMs, everyMs } = shape.rumble;
  for (let atMs = fromMs; atMs <= toMs; atMs += everyMs) pulses.push({ atMs, style });
  if (shape.last) pulses.push(shape.last);
  return pulses;
}

// A breach's pending pulses. Starting either breach cue cancels the earlier
// one first; Haptics.cancelBreach() clears them (a new claim, a pause, leaving).
let breachTimeouts: ReturnType<typeof setTimeout>[] = [];

function playBreach(shape: BreachHapticShape): Promise<void> {
  breachTimeouts.forEach(clearTimeout);
  breachTimeouts = [];
  let first: Promise<void> = Promise.resolve();
  for (const { atMs, style } of breachHapticPulses(shape)) {
    if (atMs <= 0) first = ExpoHaptics.impactAsync(style);
    else breachTimeouts.push(setTimeout(() => ExpoHaptics.impactAsync(style), atMs));
  }
  return first;
}

/**
 * Single haptics gateway for player-facing feedback.
 *
 * Keeping the preference check here makes Settings authoritative without
 * asking every animation or gameplay presenter to duplicate store logic.
 */
export const Haptics = {
  ImpactFeedbackStyle: ExpoHaptics.ImpactFeedbackStyle,
  NotificationFeedbackType: ExpoHaptics.NotificationFeedbackType,

  impactAsync(
    style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Medium,
  ): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    return ExpoHaptics.impactAsync(style);
  },

  notificationAsync(type: ExpoHaptics.NotificationFeedbackType): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    return ExpoHaptics.notificationAsync(type);
  },

  selectionAsync(): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    return ExpoHaptics.selectionAsync();
  },

  cueAsync(cue: HapticCue): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    switch (cue) {
      // selectionAsync is built for a stationary finger on a picker wheel; it
      // read as nothing at the 24px gesture threshold on device. Rigid sits
      // below the ceiling reserved for boss beats (Pete, 2026-09-12).
      case 'gestureThreshold':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
      // The Daily answer card's touch-down. The Hunt used this too until
      // 2026-11-06; it now fires huntPressSteady below.
      case 'pressSteady':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      // A finger landing on a Hunt card, firmer with momentum. Fired once at
      // touch-down; the swipe itself stays silent. TEST VALUES (Pete,
      // 2026-11-06, "they all feel weak"): each moved up one notch. Pete
      // allows Heavy on Hunt cues now (2026-11-06), overriding the old rule
      // that kept Heavy for Boss beats.
      case 'huntPressSteady':
      case 'pressSharp':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      case 'pressRazor':
      case 'pressHunted': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 40);
        return first;
      }
      case 'pressUntrappable':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      // Hunt REAL claim by round tier (resolveClaimHapticCue). TEST VALUES
      // (2026-11-06): each tier moved up one notch; the heavy tier ends on Heavy.
      case 'huntStandardCorrect': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft), 70);
        return first;
      }
      case 'huntClaimMedium': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 90);
        return first;
      }
      case 'huntHeightenedCorrect': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 90);
        return first;
      }
      // Hunt wrong swipe, up or right, normal card and gauntlet card. TEST
      // VALUES (2026-11-06): a Rigid hit then a Heavy, replacing the Error
      // notification the Daily still uses ('wrong' below).
      case 'huntWrong': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 60);
        return first;
      }
      // The Hunt book shutting at the end of a word (MaskBoard onWordExit).
      // TEST VALUE (2026-11-06): one Heavy, replacing selectionAsync.
      case 'bookShut':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      // The Daily's claim cues (dailyCelebrationHaptic). The Hunt used these
      // until 2026-11-06; it now fires the hunt* copies above.
      case 'standardCorrect':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // Daily only now. Climbs by rhythm instead of force: a double Medium
      // pulse, same shape as gauntletBegin's pulses (Pete, 2026-09-12).
      case 'heightenedCorrect': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 90);
        return first;
      }
      // The Daily's wrong claim. The Hunt fires huntWrong (above) since 2026-11-06.
      case 'wrong':
        return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
      // Momentum tier crossing (STEADY/SHARP/RAZOR SHARP/UNTRAPPABLE). One
      // routine pulse for all three crossings, replacing a raw
      // Haptics.selectionAsync() call that only fired on one of them and
      // bypassed this gateway (Pete, 2026-09-12). Placeholder weight pending
      // its own device pass — see the design spec's open items.
      case 'tierUp':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // Momentum level-ups escalate with the level: SHARP is one Medium pulse
      // (above), RAZOR SHARP doubles it, UNTRAPPABLE is a three-beat climb
      // that opens Rigid. Rhythm, not Heavy, which stays reserved for Boss
      // beats. First-pass shapes pending a device pass.
      case 'tierUpRazor': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 80);
        return first;
      }
      case 'tierUpUntrappable': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 60);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 120);
        return first;
      }
      // Daily only now (the Hunt fires huntClaimMedium). A solid Medium "take"
      // with a soft follow-up, between standardCorrect and heightenedCorrect.
      case 'claimMedium': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft), 70);
        return first;
      }
      // A trap rejection always opens with a sharp Rigid "swat" so it can
      // never be mistaken for a claim, then bounces. Same three phase tiers,
      // climbing by what follows the swat. Hunt-only. TEST VALUES (2026-11-06):
      // each moved up one notch; the heavy tier's bounce is Heavy (Pete's
      // override of the Boss-only Heavy rule).
      case 'trapRejectLight': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 55);
        return first;
      }
      case 'trapRejectMedium': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 55);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 110);
        return first;
      }
      case 'trapRejectHeavy': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 55);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 110);
        return first;
      }
      // FELL OFF severities — layered ON TOP of the 'huntWrong' cue above, not a
      // replacement for it, scaled to how far the chain fell. fellOffSmall
      // and fellOffMedium are first-pass placeholders (Open Items 3-4 in the
      // design spec); fellOffBig's shape is decided — two Medium pulses
      // 90ms apart, same shape as heightenedCorrect/gauntletBegin, not Heavy
      // (reserved for boss beats).
      case 'fellOffSmall':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      case 'fellOffMedium': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 70);
        return first;
      }
      case 'fellOffBig': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 90);
        return first;
      }
      case 'bossEntry': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 100);
        return first;
      }
      // Heavy is the ceiling, and standardCorrect moved up to Medium, so a
      // single Heavy no longer reads as distinct from a routine correct.
      // bossCorrect climbs by shape instead of force: Rigid then Heavy,
      // same principle as bossEntry's own pulse (Pete, 2026-09-12).
      case 'bossCorrect': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 60);
        return first;
      }
      case 'bossHaunted':
      case 'masteredBookImpact':
      case 'hauntedBookImpact':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      case 'mastery':
        return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      case 'gauntletPick':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // Deliberately NOT bossEntry's double-heavy-pulse — reusing that cue
      // for a second, different moment made the gauntlet's own arrival feel
      // like more of the same instead of a distinct beat (Pete, 2026-08-15).
      // Three quick Medium pulses instead of two slow Heavy ones: faster,
      // lighter rhythm reads as "here we go" rather than repeating the
      // entrance's own weight, and echoes the 3-tile gauntlet itself.
      case 'gauntletBegin': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 90);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 180);
        return first;
      }
      // The Daily scroll's two physical contacts: the word pressing into the
      // parchment, and the rod arriving at its stop. Light then Medium, so
      // the rod lands heavier than the ink — the rod is the bigger object.
      case 'dailyInkPress':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      case 'dailyRodStop':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // The Daily gate landing back down after a correct claim (Pete,
      // 2026-10-11). Medium, not Heavy: Heavy stays with Boss beats.
      case 'dailyGateShut':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // A row of Daily answer blocks seating in the wall. Three rows land 120ms
      // apart, so three Medium taps: a rhythm the hand reads as the wall
      // presenting the set. Light read too faint for stone on device (Pete,
      // 2026-09-29). It rides the same call site as the row's thud
      // (DailyCastleStage), never a timer of its own.
      case 'dailyStoneSeat':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // expo-haptics has no sustained or variable-length haptic, so the wall
      // rumble is simulated: seven Soft impacts at 60ms spacing, tight enough
      // to fuse into one continuous grind rather than read as seven separate
      // taps. Soft, not Light and not Rigid — dull and diffuse is the texture
      // of stone grinding in a wall, and Rigid is already spoken for by
      // gestureThreshold. The burst ends at 360ms, 40ms before the first
      // brick launches at BRICK_LEAD_IN_MS (400ms) (Pete, 2026-09-12).
      case 'gauntletWallTremble': {
        gauntletWallTrembleTimeouts.forEach(clearTimeout);
        gauntletWallTrembleTimeouts = [];
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft);
        [60, 120, 180, 240, 300, 360].forEach((delay) => {
          gauntletWallTrembleTimeouts.push(
            setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft), delay),
          );
        });
        return first;
      }
      // The entrance's remaining two beats ride the same call sites as their
      // sound, never a timer of their own — a parallel setTimeout against
      // BRICK_LEAD_IN_MS/BRICK_STAGGER_MS/BRICK_FLIGHT_MS would drift from the
      // actual animation and silently break if those constants are retuned.
      // Three-beat physics: grind (gauntletWallTremble), crack (this tear),
      // seat (the land below). Flight between them is deliberately silent —
      // that silence is what makes the landing read.
      case 'gauntletBrickTear':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
      case 'gauntletBrickLand':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      // The Daily breach's contact: a hard hit, then a rumble tail that rides
      // the castle shake. Every number lives in BREACH_HAPTICS above.
      case 'breachHit':
        return playBreach(BREACH_HAPTICS.hit);
      case 'breachSmash':
        return playBreach(BREACH_HAPTICS.smash);
    }
  },

  cancelGauntletWallTremble(): void {
    gauntletWallTrembleTimeouts.forEach(clearTimeout);
    gauntletWallTrembleTimeouts = [];
  },

  /** Stops a breach rumble still running (a new claim, a pause, leaving the Daily). */
  cancelBreach(): void {
    breachTimeouts.forEach(clearTimeout);
    breachTimeouts = [];
  },
} as const;
