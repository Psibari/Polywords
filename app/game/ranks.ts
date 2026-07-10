export type RankTier = {
  letter:      string;
  label:       string;
  threshold:   number;
  nextAt:      number | null;
  color:       string;
  description: string;
};

export const RANK_TIERS: RankTier[] = [
  { letter: 'D',      label: 'D',      threshold: 0,     nextAt: 8000,  color: 'rgba(255,255,255,0.45)', description: 'Just getting started.'   },
  { letter: 'C',      label: 'C',      threshold: 8000,  nextAt: 11000, color: '#FFFFFF',                description: 'Warming up.'             },
  { letter: 'B',      label: 'B',      threshold: 11000, nextAt: 14000, color: '#FFFFFF',                description: 'Getting sharper.'        },
  { letter: 'A',      label: 'A',      threshold: 14000, nextAt: 18000, color: '#FFFFFF',                description: 'Polly noticed.'          },
  { letter: 'S',      label: 'S',      threshold: 18000, nextAt: 22000, color: '#F5C842',                description: 'Better than Polly.'      },
  { letter: 'MASTER', label: 'MASTER', threshold: 22000, nextAt: null,  color: '#F5C842',                description: 'The title is yours.'     },
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
