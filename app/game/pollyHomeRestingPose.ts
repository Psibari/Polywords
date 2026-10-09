// Polly's resting pose on Home, between the entrance and the doze. Pure and
// RN-free so it runs under plain Node (npx tsx); the art for each name lives
// in app/ui/pollyHomePoses.ts.
//
// Priority, first match wins:
//   1. the 'rattled' life profile (a comeback after a rough patch) -> embarrassed
//   2. the player is on a win streak (beat her last Hunt)          -> angry
//   3. Polly is on a win streak, or the 'cocky' life profile       -> smug (face rig)
//   4. otherwise                                                    -> idle (face rig)

import type { PollyLifeProfileName } from './pollyLifeProfile';

export type PollyHomeRestingPose = 'embarrassed' | 'angry' | 'smug' | 'idle';

export function resolveHomeRestingPose(input: {
  lifeProfileName: PollyLifeProfileName;
  playerWinStreak: number;
  pollyWinStreak: number;
}): PollyHomeRestingPose {
  const { lifeProfileName, playerWinStreak, pollyWinStreak } = input;
  if (lifeProfileName === 'rattled') return 'embarrassed';
  if (playerWinStreak > 0) return 'angry';
  if (pollyWinStreak > 0 || lifeProfileName === 'cocky') return 'smug';
  return 'idle';
}
