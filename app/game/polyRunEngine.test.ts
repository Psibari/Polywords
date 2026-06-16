import {
  createGame,
  submitSwipeUp,
  submitSwipeDown,
  completeWord,
} from './polyRunEngine';

console.log('=== POLY RUN ENGINE TESTS ===\n');

// Test 1: Swipe up on real mask → +100, combo rises
let s1 = createGame(); // BARK
s1 = submitSwipeUp(s1, 'bark_dog');
console.log('TEST 1 - swipe up real:', {
  score: s1.score,           // 100
  combo: s1.combo,           // 1
  lives: s1.lives,           // 3
  feedback: s1.feedback,     // '+100'
});

// Test 2: Swipe up on trap → -1 life, combo resets
let s2 = createGame();
s2 = submitSwipeUp(s2, 'bark_loud'); // trap
console.log('TEST 2 - swipe up trap:', {
  score: s2.score,           // 0
  lives: s2.lives,           // 2
  combo: s2.combo,           // 0
  mistakes: s2.mistakesOnWord, // 1
});

// Test 3: Swipe down on trap → +50
let s3 = createGame();
s3 = submitSwipeDown(s3, 'bark_loud'); // trap
console.log('TEST 3 - swipe down trap:', {
  score: s3.score,  // 50
  combo: s3.combo,  // 1
});

// Test 4: Swipe down on real mask → -1 life
let s4 = createGame();
s4 = submitSwipeDown(s4, 'bark_dog'); // real
console.log('TEST 4 - swipe down real:', {
  lives: s4.lives,     // 2
  mistakes: s4.mistakesOnWord, // 1
});

// Test 5: Boss word (DRAFT) doubles points on swipe up
let s5 = createGame();
s5 = { ...s5, stepIndex: 3 }; // DRAFT, eventType: bossWord
s5 = submitSwipeUp(s5, 'draft_version');
console.log('TEST 5 - boss swipe up real:', {
  score: s5.score, // 200 (100 * 2)
});

// Test 6: completeWord advances stepIndex and records WordResult
let s6 = createGame();
s6 = submitSwipeUp(s6, 'bark_dog');
s6 = submitSwipeUp(s6, 'bark_tree');
s6 = submitSwipeDown(s6, 'bark_loud');
s6 = submitSwipeDown(s6, 'bark_howl');
s6 = submitSwipeDown(s6, 'bark_forest');
const beforeComplete = s6.stepIndex;
s6 = completeWord(s6);
console.log('TEST 6 - completeWord:', {
  stepAdvanced: s6.stepIndex > beforeComplete,  // true
  wordResultsLen: s6.wordResults.length,        // 1
  word: s6.wordResults[0]?.word,               // 'BARK'
  correctUp: s6.wordResults[0]?.correctUp,     // 2
  correctDown: s6.wordResults[0]?.correctDown, // 3
  wrongSwipes: s6.wordResults[0]?.wrongSwipes, // 0
  pollyTrigger: s6.pollyTrigger,               // 'perfect'
});

console.log('\n=== TESTS COMPLETE ===');
