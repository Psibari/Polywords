// Shared one-time presentation flags. The Hunt flag remains readable only as
// a migration source for installs that completed the retired fake-card intro.
export const INTRO_SEEN_KEY = 'polywords_intro_seen';
export const ONBOARDING_STATE_KEY = 'polywords_onboarding_v1';
export const BOSS_INTRO_SEEN_KEY = 'polywords_boss_intro_seen';
export const HAUNT_INTRO_SEEN_KEY = 'polywords_haunt_intro_seen';
// The Daily's entry card explains the mode once, the first time the player
// presses BEGIN DAILY (Pete, 2026-11-03). The card itself still shows every
// day: it is the gate that spends the one attempt, so it can never stop
// appearing or a mis-tap would burn the day.
export const DAILY_INTRO_SEEN_KEY = 'polywords_daily_intro_seen';
