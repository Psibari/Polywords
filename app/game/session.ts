// ============================================================
// POLY WORDS — POLY RUN SESSION
// 5-word Conveyor Blitz session. Fixed order. No randomization.
// Every clue engineered for the "wait... OH" moment.
// ============================================================

import { SessionStep, WordStep, PhraseBreakStep, Clue } from './types';

export const SESSION: SessionStep[] = [
  {
    kind: 'word',
    word: 'LIGHT',
    mode: 'conveyorBlitz',
    eventType: null,
    emotionalRole: 'calibration',
    meanings: [
      { id: 'light_illumination', text: 'not heavy', emoji: '🪶' },
      { id: 'light_bright', text: 'illumination', emoji: '💡' },
      { id: 'light_ignite', text: 'set on fire' },
    ],
    clues: [
      { text: 'NOT HEAVY', correctMeaningId: 'light_illumination', isDecoy: false, trickType: 'opposite', spawnDelayMs: 0 },
      { text: '🪶', correctMeaningId: 'light_illumination', isDecoy: false, trickType: 'emoji', spawnDelayMs: 1800 },
      { text: 'DARK AS NIGHT', correctMeaningId: '', isDecoy: true, trickType: 'none', spawnDelayMs: 3600 },
      { text: '💡', correctMeaningId: 'light_bright', isDecoy: false, trickType: 'emoji', spawnDelayMs: 5400 },
      { text: 'FLAME IT UP', correctMeaningId: 'light_ignite', isDecoy: false, trickType: 'action', spawnDelayMs: 7200 },
    ],
  },
  {
    kind: 'word',
    word: 'BANK',
    mode: 'conveyorBlitz',
    eventType: null,
    emotionalRole: 'trap',
    meanings: [
      { id: 'bank_money', text: 'financial institution', emoji: '🏦' },
      { id: 'bank_river', text: 'ground beside water' },
      { id: 'bank_rely', text: 'count on it' },
    ],
    clues: [
      { text: 'NOT RIVER', correctMeaningId: 'bank_money', isDecoy: false, trickType: 'opposite', spawnDelayMs: 0 },
      { text: '🏦', correctMeaningId: 'bank_money', isDecoy: false, trickType: 'emoji', spawnDelayMs: 1800 },
      { text: 'WALL BESIDE OCEAN', correctMeaningId: '', isDecoy: true, trickType: 'none', spawnDelayMs: 3600 },
      { text: 'GROUND BY WATER', correctMeaningId: 'bank_river', isDecoy: false, trickType: 'rephrase', spawnDelayMs: 5400 },
      { text: 'POCKET FULL OF COINS', correctMeaningId: '', isDecoy: true, trickType: 'none', spawnDelayMs: 7200 },
      { text: 'COUNT ON IT', correctMeaningId: 'bank_rely', isDecoy: false, trickType: 'action', spawnDelayMs: 9000 },
    ],
  },
  {
    kind: 'word',
    word: 'JAM',
    mode: 'conveyorBlitz',
    eventType: null,
    emotionalRole: 'switch',
    meanings: [
      { id: 'jam_fruit', text: 'fruit spread' },
      { id: 'jam_stuck', text: 'traffic jam' },
      { id: 'jam_music', text: 'improvise music' },
    ],
    clues: [
      { text: 'TOAST TOPPING', correctMeaningId: 'jam_fruit', isDecoy: false, trickType: 'rephrase', spawnDelayMs: 0 },
      { text: 'CARS STOPPED', correctMeaningId: 'jam_stuck', isDecoy: false, trickType: 'rephrase', spawnDelayMs: 1800 },
      { text: 'OPEN ROAD', correctMeaningId: '', isDecoy: true, trickType: 'none', spawnDelayMs: 3600 },
      { text: 'PLAY IT LIVE', correctMeaningId: 'jam_music', isDecoy: false, trickType: 'action', spawnDelayMs: 5400 },
    ],
  },
  {
    kind: 'word',
    word: 'MATCH',
    mode: 'conveyorBlitz',
    eventType: null,
    emotionalRole: 'trap',
    meanings: [
      { id: 'match_fire', text: 'fire starter' },
      { id: 'match_equal', text: 'equal pair' },
      { id: 'match_game', text: 'sports game' },
    ],
    clues: [
      { text: 'NOT FIRE', correctMeaningId: 'match_equal', isDecoy: false, trickType: 'opposite', spawnDelayMs: 0 },
      { text: 'STRIKE TO LIGHT', correctMeaningId: 'match_fire', isDecoy: false, trickType: 'action', spawnDelayMs: 1800 },
      { text: 'FINAL SCORE', correctMeaningId: 'match_game', isDecoy: false, trickType: 'rephrase', spawnDelayMs: 3600 },
      { text: 'PERFECT PAIR', correctMeaningId: 'match_equal', isDecoy: false, trickType: 'rephrase', spawnDelayMs: 5400 },
    ],
  },
  {
    kind: 'word',
    word: 'SPRING',
    mode: 'conveyorBlitz',
    eventType: 'bossWord',
    emotionalRole: 'boss',
    meanings: [
      { id: 'spring_season', text: 'season after winter' },
      { id: 'spring_coil', text: 'metal coil' },
      { id: 'spring_jump', text: 'jump up' },
    ],
    clues: [
      { text: 'WINTER + 90 DAYS', correctMeaningId: 'spring_season', isDecoy: false, trickType: 'equation', spawnDelayMs: 0 },
      { text: 'BOING', correctMeaningId: 'spring_coil', isDecoy: false, trickType: 'action', spawnDelayMs: 1600 },
      { text: 'FALL DOWN', correctMeaningId: '', isDecoy: true, trickType: 'none', spawnDelayMs: 3200 },
      { text: 'LEAP UP', correctMeaningId: 'spring_jump', isDecoy: false, trickType: 'action', spawnDelayMs: 4800 },
      { text: 'FLOWERS BLOOM', correctMeaningId: 'spring_season', isDecoy: false, trickType: 'rephrase', spawnDelayMs: 6400 },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

export function getStep(index: number): SessionStep | null {
  return SESSION[index] ?? null;
}

export function getTotalSteps(): number {
  return SESSION.length;
}

export function isWordStep(step: SessionStep): step is WordStep {
  return step.kind === 'word';
}

export function isPhraseBreak(step: SessionStep): step is PhraseBreakStep {
  return step.kind === 'phraseBreak';
}

// Pick clues for a word step.
// conveyorBlitz: return non-decoy clues in authored order.
// Other modes: shuffle and guarantee at least one clue per meaning.
export function pickClues(step: WordStep, count: number): Clue[] {
  if (step.mode === 'conveyorBlitz') {
    return step.clues.filter(c => !c.isDecoy);
  }

  const shuffled = [...step.clues].sort(() => Math.random() - 0.5);
  const remainingMeanings = step.meanings.map(m => m.id);
  const guaranteed: Clue[] = [];
  const rest: Clue[] = [];

  for (const clue of shuffled) {
    const idx = remainingMeanings.indexOf(clue.correctMeaningId);
    if (idx !== -1) {
      guaranteed.push(clue);
      remainingMeanings.splice(idx, 1);
    } else {
      rest.push(clue);
    }
  }

  return [...guaranteed, ...rest].slice(0, count);
}
