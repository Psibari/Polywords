export type MusicState =
  | 'off'
  | 'neutral'
  | 'rhythm'
  | 'onARun'
  | 'crisis'
  | 'boss'
  | 'daily'
  | 'home'
  | 'static';

export type MusicOwner = 'hunt' | 'daily' | 'home';

export const STATE_VOLUMES: Record<Exclude<MusicState, 'off'>, number> = {
  neutral: 0.18,
  rhythm: 0.20,
  onARun: 0.22,
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
