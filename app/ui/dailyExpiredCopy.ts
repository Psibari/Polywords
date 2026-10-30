// Every word on the Daily's TIME'S UP card (DailyExpiredCard). Pete's wording
// (2026-10-29): change it only on his word.

/** The card's one line. `number` is the unfinished Daily's challenge number. */
export function dailyExpiredTitle(number: number): string {
  return `TIME'S UP FOR DAILY #${number}`;
}

/** The one button: leaves the card for today's Daily entry. */
export const DAILY_EXPIRED_BUTTON = "TODAY'S DAILY";

// Screen-reader labels.
export function dailyExpiredTitleA11y(number: number): string {
  return `Time's up for Daily number ${number}`;
}
export const DAILY_EXPIRED_BUTTON_A11Y = "Go to today's Daily";
