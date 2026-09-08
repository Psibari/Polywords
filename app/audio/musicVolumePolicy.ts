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

export const BOSS_OUTCOME_DUCK_VOLUME = 0.07;
export const BOSS_OUTCOME_DUCK_ATTACK_MS = 100;
export const BOSS_OUTCOME_DUCK_RELEASE_MS = 220;

export function resolveMusicTargetVolume({
  activeOwner,
  state,
  muted,
  transportPaused,
  bossOutcomeDucked,
  returningHauntCueActive,
}: {
  activeOwner: MusicOwner | null;
  state: Exclude<MusicState, 'off'> | null;
  muted: boolean;
  transportPaused: boolean;
  bossOutcomeDucked: boolean;
  returningHauntCueActive?: boolean;
}): number {
  if (muted || transportPaused || !activeOwner || !state) return 0;
  if (returningHauntCueActive && activeOwner === 'hunt') return 0;
  if (bossOutcomeDucked && activeOwner === 'hunt' && state === 'boss') {
    return BOSS_OUTCOME_DUCK_VOLUME;
  }
  return STATE_VOLUMES[state];
}
