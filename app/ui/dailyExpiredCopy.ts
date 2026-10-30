// Every word on the Daily's TIME'S UP card (DailyExpiredCard). Pete's wording
// (2026-10-30): change it only on his word.

/** The card's headline. */
export const DAILY_EXPIRED_TITLE = "TIME'S UP";

/** Small line under the headline. `number` is the unfinished Daily's challenge number. */
export function dailyExpiredSubtitle(number: number): string {
  return `DAILY #${number}`;
}

/** How long the card stays before it fades by itself. A tap closes it earlier. */
export const DAILY_EXPIRED_HOLD_MS = 2500;

// Screen-reader label.
export function dailyExpiredA11y(number: number): string {
  return `Time's up for Daily number ${number}`;
}
