import type { HuntTileInputMode } from './tileAccessibility';

// A Hunt card is playable only when the board has released it and nothing
// outside the board (an onboarding beat, a HUD lesson) holds input.
export function isHuntTileInteractive(disabled: boolean, inputMode: HuntTileInputMode): boolean {
  return !disabled && inputMode !== 'locked';
}

// The response clock (hunt_decision's visibleToTouchMs, onboarding responseMs)
// restarts every time a card goes from held to playable, so time a card spends
// locked behind a lesson or a result beat never counts as the player's
// response time.
export function shouldRestartDecisionClock(wasInteractive: boolean, interactive: boolean): boolean {
  return interactive && !wasInteractive;
}
