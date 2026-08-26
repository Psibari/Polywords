export type RankTier = {
  letter:      string;
  label:       string;
  threshold:   number;
  nextAt:      number | null;
  color:       string;
  description: string;
};

// Retuned 2026-08-25 against the live 197-word corpus and current five-mask
// cap. A flawless run currently ranges from 12,100 to 14,400 points, so the
// old S/MASTER thresholds (15,000/19,500) were impossible to reach. Rank is a
// per-run skill axis — it does not reflect the Boss outcome or long-term Vault
// progress, which are separate systems.
export const RANK_TIERS: RankTier[] = [
  { letter: 'D',      label: 'D',      threshold: 0,     nextAt: 3000,  color: 'rgba(255,255,255,0.45)', description: 'Just getting started.'   },
  { letter: 'C',      label: 'C',      threshold: 3000,  nextAt: 6000,  color: '#FFFFFF',                description: 'Warming up.'             },
  { letter: 'B',      label: 'B',      threshold: 6000,  nextAt: 9000,  color: '#FFFFFF',                description: 'Getting sharper.'        },
  { letter: 'A',      label: 'A',      threshold: 9000,  nextAt: 11500, color: '#FFFFFF',                description: 'Polly noticed.'          },
  { letter: 'S',      label: 'S',      threshold: 11500, nextAt: 14000, color: '#F5C842',                description: 'Razor sharp.'             },
  { letter: 'MASTER', label: 'MASTER', threshold: 14000, nextAt: null,  color: '#F5C842',                description: 'The title is yours.'     },
];
export function getRankTier(score: number): RankTier {
  const reversed = [...RANK_TIERS].reverse();
  return reversed.find(t => score >= t.threshold) ?? RANK_TIERS[0];
}

export function getRankProgress(score: number, tier: RankTier): number {
  if (!tier.nextAt) return 1;
  const range = tier.nextAt - tier.threshold;
  if (range <= 0) return 1;
  return Math.min((score - tier.threshold) / range, 1);
}

// Pure so it's testable without the store: given a run's final score and the
// tiers already recorded, returns an updated record with `achievedAt` filled
// in for every newly-reached tier, or null if nothing new was reached this
// run. Checks every tier against the score directly (not against the prior
// personalBest) so it's correct even if called out of order or after a
// missed update — a tier's date is set the first time it's ever true.
export function computeRankHistoryUpdates(
  finalScore: number,
  existing: Partial<Record<string, string>>,
  achievedAt: string,
): Partial<Record<string, string>> | null {
  let changed = false;
  const next = { ...existing };
  for (const tier of RANK_TIERS) {
    if (finalScore >= tier.threshold && !next[tier.letter]) {
      next[tier.letter] = achievedAt;
      changed = true;
    }
  }
  return changed ? next : null;
}
