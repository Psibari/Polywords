// Mercy taper, read by startGame (useGameStore.ts) and by the Mercy HUD lesson.
// RN-free so the lesson copy and its tests can read the same numbers.
//
// Onboarding taper: a hard cliff from full protection to zero protection at
// run 4 felt unfair in simulation (finish rate fell from ~32% to ~6% for an
// unchanged player). Fledgling gets the full ramp; Grace keeps a lighter
// safety net for several more runs before the game goes full stakes.
export const FLEDGLING_RUNS = 3;
export const GRACE_RUNS = 10;
export const FLEDGLING_MERCY_LIVES = 3;
export const GRACE_MERCY_LIVES = 2;
