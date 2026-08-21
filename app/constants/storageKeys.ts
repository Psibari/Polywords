// Shared across GameScreen, useGameStore, and SettingsScreen (Tutorial
// Replay clears these) — extracted once a third consumer needed them
// instead of repeating the literal a third time.
export const INTRO_SEEN_KEY = 'polywords_intro_seen';
export const BOSS_INTRO_SEEN_KEY = 'polywords_boss_intro_seen';
export const HAUNT_INTRO_SEEN_KEY = 'polywords_haunt_intro_seen';
