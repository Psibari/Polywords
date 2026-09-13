import { PW } from './pwTheme';
import { heroBookMaterial, libraryMaterial } from './pwMaterials';
import { WordResult } from '../game/polyRunEngine';
import { PollyMoment } from '../game/pollyCharacter';
import { PollyMemory, resolveResultsPollyMoment } from '../game/pollyMemory';
import { LOSS_CAUSE_LINES, pickLossVerdictLine } from '../game/lossCauseLines';

// The pure line pools + picker live in game/lossCauseLines.ts (RN-free, unit
// tested under plain node) — same split as pollyMemory.ts/
// deriveResultsPollyMoment below. Re-exported here so the screen has one
// import surface for all Results copy.
export { LOSS_CAUSE_LINES, pickLossVerdictLine };

// ── Verdict copy (verdict appears exactly once, top of the ledger) ──
export const RESULTS_SUB_LOSS = LOSS_CAUSE_LINES.neutral[1];

// ── Footer action copy ──
export const RESULTS_RESTART_LABEL = 'START A NEW HUNT';

// Polly's one bubble line on the ledger. All lines are bank-sourced
// (docs/POLLY_DIALOGUE_BANK.md, Result Screen Polly Seeds).
export function deriveResultsPollyMoment(
  wordResults: WordResult[],
  isComplete: boolean,
  bossMastered: boolean,
  memory: PollyMemory,
  roll: number,
): PollyMoment | null {
  const allPerfect =
    wordResults.length > 0 && wordResults.every(r => r.wrongSwipes === 0);
  const hasMissed = wordResults.some(r => r.missedMaskIds.length > 0);
  return resolveResultsPollyMoment(memory, {
    isComplete,
    allPerfect,
    bossMastered,
    hasMissed,
  }, roll);
}

// ── Type scale (legibility clause: floor 14, tune on device) ──
export const resultsType = {
  verdict: 40,
  verdictSub: 17,
  perfectLine: 16,
  ledgerWord: 18,
  ledgerResult: 16,
  cardHeader: 16,
  cardWord: 24,
  cardCopy: 16,
} as const;

// ── Ledger panel: BOOK leather frame around a dark card face ──
export const resultsLedger = {
  panelFace: heroBookMaterial.coverPurple,
  panelRim: heroBookMaterial.goldHairline,
  parchmentTop: PW.color.overlayLight,
  parchment: PW.color.cardFace,
  rule: 'rgba(245,200,66,0.22)',
  ink: PW.color.softWhite, // ledger text on the dark card face
  inkSoft: PW.color.mutedWhite,
  mark: PW.color.amber, // Boss ✓ / Perfect ✓
} as const;

// ── Callout cards (CARD material trims) ──
export const resultsCard = {
  rimGold: PW.color.cardRim,
  rimTrap: 'rgba(155,45,107,0.55)', // rose — trap identity
  ghostFace: libraryMaterial.ghostTint,
  ghostRim: libraryMaterial.ghostFeatherEdge,
  ghostTitle: libraryMaterial.ghostTitle,
} as const;
