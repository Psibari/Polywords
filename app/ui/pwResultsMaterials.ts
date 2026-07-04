import { PW } from './pwTheme';
import { heroBookMaterial, libraryMaterial } from './pwMaterials';
import { WordResult } from '../game/polyRunEngine';

// ── Verdict copy (verdict appears exactly once, top of the ledger) ──
export const RESULTS_VERDICT_BEAT = 'YOU BEAT POLLY';
export const RESULTS_VERDICT_COMPLETE = 'POLLY HUNT COMPLETE';
export const RESULTS_VERDICT_LOSS = 'POLLY CLIPPED YOUR RUN.';
export const RESULTS_SUB_BEAT = 'Thought so.'; // never-change line, system text
export const RESULTS_SUB_LOSS = 'Out of feathers.';

// Polly's one bubble line on the ledger. All lines are bank-sourced
// (docs/POLLY_DIALOGUE_BANK.md, Result Screen Polly Seeds).
export function deriveResultsPollyLine(
  wordResults: WordResult[],
  isComplete: boolean,
): string | null {
  if (!isComplete) return 'My traps remember you.';
  const allPerfect =
    wordResults.length > 0 && wordResults.every(r => r.wrongSwipes === 0);
  if (allPerfect) return 'You emptied my little vault.';
  const bossCleared = wordResults.some(r => r.isBossWord && r.wrongSwipes === 0);
  if (bossCleared) return 'Fine. Keep the word.';
  const hasMissed = wordResults.some(r => r.missedMaskIds.length > 0);
  if (hasMissed) return 'Some meanings got past you.';
  return null;
}

// ── Type scale (legibility clause: floor 14, tune on device) ──
export const resultsType = {
  verdict: 46,
  verdictSub: 16,
  gradeSub: 15,
  rankLabel: 14,
  rankLetter: 30,
  scoreLine: 17,
  perfectLine: 15,
  bestLine: 15,
  ledgerWord: 18,
  ledgerResult: 15,
  cardHeader: 15,
  cardWord: 24,
  cardCopy: 15,
  homeLink: 14,
} as const;

// ── Ledger panel: BOOK leather frame around dark parchment ──
export const resultsLedger = {
  panelFace: heroBookMaterial.coverPurple,
  panelRim: heroBookMaterial.goldHairline,
  parchmentTop: heroBookMaterial.pagesCreamTop,
  parchment: heroBookMaterial.pagesCream,
  rule: heroBookMaterial.pagesLine,
  ink: '#33291A', // ledger ink on parchment
  inkSoft: 'rgba(51,41,26,0.72)',
  mark: PW.color.amber, // Boss ✓ / Perfect ✓ — ink-gold on parchment
} as const;

// ── Callout cards (CARD material trims) ──
export const resultsCard = {
  rimGold: PW.color.cardRim,
  rimTrap: 'rgba(155,45,107,0.55)', // rose — trap identity
  ghostFace: libraryMaterial.ghostTint,
  ghostRim: libraryMaterial.ghostFeatherEdge,
  ghostTitle: libraryMaterial.ghostTitle,
} as const;

// ── Verdict-block colors (no green, no raw gold beyond the foil) ──
export const resultsVerdictColor = {
  gradeClean: PW.color.foilLight,
  gradeClose: PW.color.white,
  gradeMissed: PW.color.lavender,
  gradeRattled: PW.color.white,
  rankTop: PW.color.amber, // MASTER / S
  rankMid: PW.color.white, // A / B / C
  rankLow: PW.color.mutedWhite, // D
  newBest: PW.color.amber,
  prevBest: PW.color.faintWhite,
} as const;
