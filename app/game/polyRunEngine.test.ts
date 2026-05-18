import { createGame, submitAnswer, markTileMissed } from './polyRunEngine';
import { SESSION } from './session';
import { WordStep } from './types';

console.log('=== POLY RUN ENGINE TESTS ===\n');

// Test 1: Perfect BANK run
let state = createGame();
state = { ...state, stepIndex: 1 }; // BANK
state = submitAnswer(state, 'bank_money'); // NOT RIVER
state = submitAnswer(state, 'bank_money'); // 🏦
state = submitAnswer(state, 'bank_river'); // GROUND BY WATER
state = submitAnswer(state, 'bank_rely'); // COUNT ON IT
console.log('TEST 1 - BANK perfect:', {
  score: state.score,
  pollyTrigger: state.pollyTrigger,
  feedback: state.feedback,
});
// Expected: score > 0, pollyTrigger === 'perfect', feedback includes INVERSION/GLYPH

// Test 2: Near miss
let state2 = createGame();
state2 = { ...state2, stepIndex: 1 };
state2 = markTileMissed(state2, (SESSION[1] as WordStep).clues[0]);
console.log('TEST 2 - Near miss:', {
  nearMissText: state2.nearMissClue?.text,
  pollyTrigger: state2.pollyTrigger,
});
// Expected: nearMissText === 'NOT RIVER', pollyTrigger === 'nearMiss'

// Test 3: Boss SPRING multiplier
let state3 = createGame();
state3 = { ...state3, stepIndex: 4 }; // SPRING
const beforeScore = state3.score;
state3 = submitAnswer(state3, 'spring_season'); // WINTER + 90 DAYS
console.log('TEST 3 - SPRING boss:', {
  scoreGain: state3.score - beforeScore,
  feedback: state3.feedback,
});
// Expected: scoreGain includes x2 from bossWord, feedback includes SOLVE

console.log('\n=== TESTS COMPLETE ===');
