export type RankTier = {
  letter:      string;
  label:       string;
  threshold:   number;
  nextAt:      number | null;
  color:       string;
  description: string;
};

// Thresholds anchored to the 2026-07-13 playthrough simulation:
// C is reachable by an average run, and MASTER sits just under the 5th
// percentile of perfect play (19700) so a flawless hunt reliably earns the
// title. Rank is a pure score/skill axis — it does not reflect the boss
// outcome (mastered/haunted/died), which is its own independent verdict.
export const RANK_TIERS: RankTier[] = [
  { letter: 'D',      label: 'D',      threshold: 0,     nextAt: 3000,  color: 'rgba(255,255,255,0.45)', description: 'Just getting started.'   },
  { letter: 'C',      label: 'C',      threshold: 3000,  nextAt: 6000,  color: '#FFFFFF',                description: 'Warming up.'             },
  { letter: 'B',      label: 'B',      threshold: 6000,  nextAt: 10000, color: '#FFFFFF',                description: 'Getting sharper.'        },
  { letter: 'A',      label: 'A',      threshold: 10000, nextAt: 15000, color: '#FFFFFF',                description: 'Polly noticed.'          },
  { letter: 'S',      label: 'S',      threshold: 15000, nextAt: 19500, color: '#F5C842',                description: 'Razor sharp.'             },
  { letter: 'MASTER', label: 'MASTER', threshold: 19500, nextAt: null,  color: '#F5C842',                description: 'The title is yours.'     },
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
