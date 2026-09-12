export type MusicState =
  | 'off'
  | 'neutral'
  | 'rhythm'
  | 'onARun'
  | 'untrappable'
  | 'crisis'
  | 'boss'
  | 'daily'
  | 'home'
  | 'static';

export type MusicOwner = 'hunt' | 'daily' | 'home';

// neutral/rhythm/onARun/untrappable mirror the HUD's STEADY/SHARP/RAZOR
// SHARP/UNTRAPPABLE tiers (1.0/1.5/2.0/2.5x) — see resolveReadTier in
// huntControl.ts. Kept as their own names here (not renamed to match) since
// they're internal-only, never player-facing. First-pass values pending a
// device pass, same as the rest of the momentum feedback work (2026-09-12).
export const STATE_VOLUMES: Record<Exclude<MusicState, 'off'>, number> = {
  neutral: 0.18,
  rhythm: 0.20,
  onARun: 0.22,
  untrappable: 0.24,
  crisis: 0.20,
  boss: 0.14,
  daily: 0.16,
  home: 0.14,
  static: 0.18,
};

export const BOSS_OUTCOME_SILENCE_ATTACK_MS = 100;
export const BOSS_OUTCOME_SILENCE_RELEASE_MS = 220;

export function resolveMusicTargetVolume({
  activeOwner,
  state,
  muted,
  transportPaused,
  bossOutcomeSilenced,
  returningHauntCueActive,
}: {
  activeOwner: MusicOwner | null;
  state: Exclude<MusicState, 'off'> | null;
  muted: boolean;
  transportPaused: boolean;
  bossOutcomeSilenced: boolean;
  returningHauntCueActive?: boolean;
}): number {
  if (muted || transportPaused || !activeOwner || !state) return 0;
  if (returningHauntCueActive && activeOwner === 'hunt') return 0;
  if (bossOutcomeSilenced && activeOwner === 'hunt' && state === 'boss') return 0;
  return STATE_VOLUMES[state];
}
