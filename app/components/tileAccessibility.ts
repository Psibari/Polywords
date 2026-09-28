// Screen-reader accessible alternative to the swipe gesture. Both Hunt tiles
// (claim/reject) and Daily cards (claim-only) resolve through this shared
// mapping so VoiceOver/TalkBack users have a real path through the game the
// core mechanic otherwise has none of.

export const CLAIM_ACTION_NAME = 'claim';
export const REJECT_ACTION_NAME = 'reject';

export type TileAccessibilityActionName =
  | typeof CLAIM_ACTION_NAME
  | typeof REJECT_ACTION_NAME;

export const CLAIM_REJECT_ACTIONS = [
  { name: CLAIM_ACTION_NAME, label: 'Claim as a real meaning' },
  { name: REJECT_ACTION_NAME, label: 'Reject as a trap' },
] as const;

export const CLAIM_ONLY_ACTIONS = [
  { name: CLAIM_ACTION_NAME, label: 'Claim as the answer' },
] as const;

export type HuntTileInputMode = 'locked' | 'up-only' | 'right-only' | 'both';

export function huntActionsForInputMode(mode: HuntTileInputMode) {
  if (mode === 'up-only') return CLAIM_REJECT_ACTIONS.slice(0, 1);
  if (mode === 'right-only') return CLAIM_REJECT_ACTIONS.slice(1);
  if (mode === 'both') return CLAIM_REJECT_ACTIONS;
  return [];
}

export function isHuntDirectionAllowed(
  mode: HuntTileInputMode,
  direction: 'up' | 'right',
): boolean {
  return mode === 'both' ||
    (mode === 'up-only' && direction === 'up') ||
    (mode === 'right-only' && direction === 'right');
}

export function resolveTileAccessibilityAction(
  actionName: string,
): TileAccessibilityActionName | null {
  if (actionName === CLAIM_ACTION_NAME) return CLAIM_ACTION_NAME;
  if (actionName === REJECT_ACTION_NAME) return REJECT_ACTION_NAME;
  return null;
}
