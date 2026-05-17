// ============================================================
// POLY WORDS — POLY RUN SESSION
// 15-step curated session. Fixed order. No randomization.
// Every clue engineered for the "wait... OH" moment.
// ============================================================

import { SessionStep, WordStep, Clue } from './types';

export const SESSION: SessionStep[] = [

  // ─────────────────────────────────────────────────────────
  // ROUND 1 — BARK
  // Confidence opener. Two meanings. Vivid clues. Easy win.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'BARK',
    emotionalRole: 'confidence',
    eventType: 'normal',
    meanings: [
      { id: 'dogSound',  label: 'Dog Sound', icon: '🐶' },
      { id: 'treeLayer', label: 'Tree Skin',  icon: '🌳' },
    ],
    clues: [
      { text: "Dog's sharp announcement",  correctMeaningId: 'dogSound',  clueType: 'vivid',     difficulty: 1 },
      { text: "Tree's outer skin",         correctMeaningId: 'treeLayer', clueType: 'vivid',     difficulty: 1 },
      { text: "Noise from the yard",       correctMeaningId: 'dogSound',  clueType: 'vivid',     difficulty: 1 },
      { text: "What a trunk wears",        correctMeaningId: 'treeLayer', clueType: 'misdirect', difficulty: 2 },
      { text: "Rough coat on a log",       correctMeaningId: 'treeLayer', clueType: 'vivid',     difficulty: 1 },
      { text: "A warning from the garden", correctMeaningId: 'dogSound',  clueType: 'vivid',     difficulty: 1 },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 2 — BOLT
  // Confidence + speed. Three wildly different domains.
  // First speed round. Instinct over thinking.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'BOLT',
    emotionalRole: 'confidence',
    eventType: 'speedRound',
    meanings: [
      { id: 'fastener',  label: 'Metal Fastener', icon: '🔩' },
      { id: 'dash',      label: 'Sudden Dash',    icon: '💨' },
      { id: 'lightning', label: 'Lightning Flash', icon: '⚡' },
    ],
    clues: [
      { text: "Nut's threaded partner",    correctMeaningId: 'fastener',  clueType: 'vivid',     difficulty: 1 },
      { text: "Run off in a flash",        correctMeaningId: 'dash',      clueType: 'vivid',     difficulty: 1 },
      { text: "Lightning's jagged strike", correctMeaningId: 'lightning', clueType: 'vivid',     difficulty: 1 },
      { text: "Sky's electric whip",       correctMeaningId: 'lightning', clueType: 'vivid',     difficulty: 2 },
      { text: "Gone before you blinked",   correctMeaningId: 'dash',      clueType: 'vivid',     difficulty: 2 },
      { text: "Holds the door together",   correctMeaningId: 'fastener',  clueType: 'vivid',     difficulty: 1 },
    ],
    pollyLine: "Three meanings. One word. No mercy.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 3 — LIGHT
  // Curiosity. Four meanings. Switches between domains.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'LIGHT',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [
      { id: 'brightness', label: 'Brightness', icon: '💡' },
      { id: 'notHeavy',   label: 'Not Heavy',  icon: '🪶' },
      { id: 'ignite',     label: 'Set Fire',   icon: '🔥' },
      { id: 'paleColor',  label: 'Pale Color', icon: '🎨' },
    ],
    clues: [
      { text: "Glow in the dark",                correctMeaningId: 'brightness', clueType: 'vivid',    difficulty: 1 },
      { text: "Easy to carry",                   correctMeaningId: 'notHeavy',   clueType: 'vivid',    difficulty: 1 },
      { text: "Set something burning",           correctMeaningId: 'ignite',     clueType: 'vivid',    difficulty: 1 },
      { text: "Soft pale shade",                 correctMeaningId: 'paleColor',  clueType: 'vivid',    difficulty: 2 },
      { text: "Room after the switch",           correctMeaningId: 'brightness', clueType: 'context',  difficulty: 2 },
      { text: "Opposite of dark... or heavy",    correctMeaningId: 'brightness', clueType: 'opposite', difficulty: 2 },
      { text: "Washed-out blue",                 correctMeaningId: 'paleColor',  clueType: 'context',  difficulty: 3 },
      { text: "Start a candle",                  correctMeaningId: 'ignite',     clueType: 'vivid',    difficulty: 1 },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 4 — WAKE
  // Opposite clues. Player must reverse-engineer each one.
  // Hesitation. Two meanings. Builds careful thinking.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'WAKE',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [
      { id: 'stopSleeping', label: 'Stop Sleeping', icon: '⏰' },
      { id: 'boatTrail',    label: 'Boat Trail',    icon: '🚢' },
    ],
    clues: [
      { text: "Opposite of sleep",            correctMeaningId: 'stopSleeping', clueType: 'opposite',  difficulty: 1 },
      { text: "Foamy trail behind a boat",    correctMeaningId: 'boatTrail',    clueType: 'vivid',     difficulty: 2 },
      { text: "Leave sleep behind",           correctMeaningId: 'stopSleeping', clueType: 'vivid',     difficulty: 1 },
      { text: "What the sea remembers",       correctMeaningId: 'boatTrail',    clueType: 'misdirect', difficulty: 3 },
      { text: "Alarm clock's only job",       correctMeaningId: 'stopSleeping', clueType: 'context',   difficulty: 2 },
      { text: "Ship's white ribbon on water", correctMeaningId: 'boatTrail',    clueType: 'vivid',     difficulty: 2 },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 5 — MATCH
  // Decoy tension. Three meanings with misdirects.
  // Player starts second-guessing.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'MATCH',
    emotionalRole: 'hesitation',
    eventType: 'decoyTension',
    meanings: [
      { id: 'fireStick', label: 'Tiny Flame Stick', icon: '🔥' },
      { id: 'equalFit',  label: 'Perfect Pair',     icon: '🧩' },
      { id: 'contest',   label: 'Contest',           icon: '🏆' },
    ],
    clues: [
      { text: "Tiny fire starter",           correctMeaningId: 'fireStick', clueType: 'vivid',    difficulty: 1 },
      { text: "Pair that belongs together",  correctMeaningId: 'equalFit',  clueType: 'vivid',    difficulty: 2 },
      { text: "Game between rivals",         correctMeaningId: 'contest',   clueType: 'vivid',    difficulty: 1 },
      { text: "Strikes to start a fire",     correctMeaningId: 'fireStick', clueType: 'vivid',    difficulty: 2 },
      { text: "Colors that belong together", correctMeaningId: 'equalFit',  clueType: 'context',  difficulty: 2 },
      { text: "Tennis showdown",             correctMeaningId: 'contest',   clueType: 'context',  difficulty: 2 },
      { text: "Box of fire on a stick",      correctMeaningId: 'fireStick', clueType: 'vivid',    difficulty: 1 },
      { text: "Not a winner — a connector",  correctMeaningId: 'equalFit',  clueType: 'negative', difficulty: 3 },
    ],
    pollyLine: "One of these will trick you.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 6 — SOUND
  // Missing meaning. Two hidden meanings.
  // Players discover the full range of SOUND mid-game.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'SOUND',
    emotionalRole: 'surprise',
    eventType: 'missingMeaning',
    meanings: [
      { id: 'noise',    label: 'Noise',         icon: '🔊' },
      { id: 'healthy',  label: 'Healthy',       icon: '💪', hidden: true },
      { id: 'waterway', label: 'Waterway',      icon: '🌊', hidden: true },
      { id: 'depth',    label: 'Measure Depth', icon: '📏' },
    ],
    clues: [
      { text: "Something your ears catch",   correctMeaningId: 'noise',    clueType: 'vivid',    difficulty: 1 },
      { text: "Safe solid and reliable",     correctMeaningId: 'healthy',  clueType: 'vivid',    difficulty: 2 },
      { text: "Waterway between lands",      correctMeaningId: 'waterway', clueType: 'vivid',    difficulty: 2 },
      { text: "Find how deep it goes",       correctMeaningId: 'depth',    clueType: 'vivid',    difficulty: 2 },
      { text: "Not sick not broken",         correctMeaningId: 'healthy',  clueType: 'negative', difficulty: 2 },
      { text: "Channel between two shores",  correctMeaningId: 'waterway', clueType: 'vivid',    difficulty: 3 },
      { text: "What the sonar sends down",   correctMeaningId: 'depth',    clueType: 'context',  difficulty: 2 },
      { text: "A drum makes this",           correctMeaningId: 'noise',    clueType: 'context',  difficulty: 1 },
    ],
    pollyLine: "Two of these are hiding. Find them all.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 7 — DRAFT (BOSS)
  // Four meanings with zero semantic overlap.
  // Hardest word so far. x2 score.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'DRAFT',
    emotionalRole: 'boss',
    eventType: 'bossWord',
    meanings: [
      { id: 'roughVersion', label: 'Rough Version',     icon: '📝' },
      { id: 'coldAir',      label: 'Cold Air Current',  icon: '🌬️' },
      { id: 'recruit',      label: 'Recruit Selection', icon: '🏈' },
      { id: 'beerTap',      label: 'Beer on Tap',       icon: '🍺' },
    ],
    clues: [
      { text: "First messy version",                   correctMeaningId: 'roughVersion', clueType: 'vivid',     difficulty: 2 },
      { text: "Cold air sneaking in",                  correctMeaningId: 'coldAir',      clueType: 'vivid',     difficulty: 2 },
      { text: "Teams pick new players",                correctMeaningId: 'recruit',      clueType: 'vivid',     difficulty: 2 },
      { text: "Beer pulled from a tap",                correctMeaningId: 'beerTap',      clueType: 'vivid',     difficulty: 2 },
      { text: "Not the final version",                 correctMeaningId: 'roughVersion', clueType: 'negative',  difficulty: 2 },
      { text: "Chill through the window gap",          correctMeaningId: 'coldAir',      clueType: 'context',   difficulty: 3 },
      { text: "NFL picks new rookies",                 correctMeaningId: 'recruit',      clueType: 'context',   difficulty: 2 },
      { text: "On tap — not in a bottle",              correctMeaningId: 'beerTap',      clueType: 'context',   difficulty: 2 },
      { text: "Opposite of a final copy",              correctMeaningId: 'roughVersion', clueType: 'opposite',  difficulty: 2 },
      { text: "What the crack under the door lets in", correctMeaningId: 'coldAir',      clueType: 'misdirect', difficulty: 3 },
    ],
    pollyLine: "Careful. This one pulls in every direction.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 8 — PHRASE BREAK
  // Reward. Brain reset. Dopamine.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'phraseBreak',
    phrase: 'Spill the beans',
    emotionalRole: 'reward',
    eventType: 'phraseBreak',
    question: "Where did this phrase likely come from?",
    choices: [
      "Secret voting with beans",
      "Cooking soup",
      "Farm markets",
      "Pirate treasure",
    ],
    correctChoice: "Secret voting with beans",
    pollyLine: "Tiny detour. Big meaning.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 9 — WAVE
  // Relief after the boss. Two simple meanings.
  // Breath before the second half.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'WAVE',
    emotionalRole: 'relief',
    eventType: 'normal',
    meanings: [
      { id: 'waterSwell',   label: 'Water Swell', icon: '🌊' },
      { id: 'handGreeting', label: 'Hand Signal', icon: '👋' },
    ],
    clues: [
      { text: "Ocean rising up",                correctMeaningId: 'waterSwell',   clueType: 'vivid',   difficulty: 1 },
      { text: "Goodbye with your hand",         correctMeaningId: 'handGreeting', clueType: 'vivid',   difficulty: 1 },
      { text: "Surf rolling in",                correctMeaningId: 'waterSwell',   clueType: 'vivid',   difficulty: 1 },
      { text: "Friendly motion across a room",  correctMeaningId: 'handGreeting', clueType: 'vivid',   difficulty: 1 },
      { text: "What surfers chase",             correctMeaningId: 'waterSwell',   clueType: 'context', difficulty: 1 },
      { text: "How you say hi from a distance", correctMeaningId: 'handGreeting', clueType: 'context', difficulty: 1 },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 10 — ROCK
  // Slang drop. Four meanings including street slang.
  // Surprise — unexpected meaning unlocks mid-round.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'ROCK',
    emotionalRole: 'surprise',
    eventType: 'slangDrop',
    meanings: [
      { id: 'stone',   label: 'Stone',        icon: '🪨' },
      { id: 'music',   label: 'Loud Music',   icon: '🎸' },
      { id: 'sway',    label: 'Gentle Sway',  icon: '👶' },
      { id: 'diamond', label: 'Flashy Stone', icon: '💎', isSlang: true },
    ],
    clues: [
      { text: "Stone you can hold",              correctMeaningId: 'stone',   clueType: 'vivid',   difficulty: 1 },
      { text: "Music with an edge",              correctMeaningId: 'music',   clueType: 'vivid',   difficulty: 1 },
      { text: "Move back and forth",             correctMeaningId: 'sway',    clueType: 'vivid',   difficulty: 1 },
      { text: "Ice on her finger",               correctMeaningId: 'diamond', clueType: 'slang',   difficulty: 3, isSlangClue: true },
      { text: "Skipped across the lake",         correctMeaningId: 'stone',   clueType: 'context', difficulty: 2 },
      { text: "Soothe a baby",                   correctMeaningId: 'sway',    clueType: 'context', difficulty: 2 },
      { text: "Turn it up till the walls shake", correctMeaningId: 'music',   clueType: 'vivid',   difficulty: 1 },
      { text: "That ring cost a rock",           correctMeaningId: 'diamond', clueType: 'slang',   difficulty: 2, isSlangClue: true },
    ],
    pollyLine: "One of these just dropped from the streets.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 11 — WELL
  // Word lore. Four meanings across wildly different domains.
  // Curiosity. Lore unlocked after clear.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'WELL',
    emotionalRole: 'curiosity',
    eventType: 'wordLore',
    meanings: [
      { id: 'healthy',        label: 'In Good Health', icon: '💪' },
      { id: 'satisfactorily', label: 'Done Right',     icon: '✅' },
      { id: 'waterHole',      label: 'Water Hole',     icon: '🪣' },
      { id: 'deepSource',     label: 'Deep Source',    icon: '🌀' },
    ],
    clues: [
      { text: "Feeling healthy again",          correctMeaningId: 'healthy',        clueType: 'vivid',     difficulty: 2 },
      { text: "Done the right way",             correctMeaningId: 'satisfactorily', clueType: 'vivid',     difficulty: 2 },
      { text: "Deep hole for water",            correctMeaningId: 'waterHole',      clueType: 'vivid',     difficulty: 1 },
      { text: "A hidden source to draw from",   correctMeaningId: 'deepSource',     clueType: 'vivid',     difficulty: 3 },
      { text: "Not sick anymore",               correctMeaningId: 'healthy',        clueType: 'negative',  difficulty: 2 },
      { text: "Rope and bucket situation",      correctMeaningId: 'waterHole',      clueType: 'context',   difficulty: 2 },
      { text: "Executed perfectly",             correctMeaningId: 'satisfactorily', clueType: 'vivid',     difficulty: 2 },
      { text: "Bottomless supply of something", correctMeaningId: 'deepSource',     clueType: 'misdirect', difficulty: 3 },
    ],
    lore: {
      title: "WORD LORE UNLOCKED",
      text: '"Well" has meant both good health and deep water since Old English. One word. Two completely different things. Both ancient.',
    },
    pollyLine: "One word. Too many jobs.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 12 — FINE
  // Decoy heavy. Four meanings. Heavy misdirect load.
  // Hesitation builds. Player starts second-guessing hard.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'FINE',
    emotionalRole: 'hesitation',
    eventType: 'decoyHeavy',
    meanings: [
      { id: 'penalty',  label: 'Penalty Money', icon: '💸' },
      { id: 'okay',     label: 'Just Okay',     icon: '😐' },
      { id: 'delicate', label: 'Delicate',      icon: '🕸️' },
      { id: 'quality',  label: 'High Quality',  icon: '🏅' },
    ],
    clues: [
      { text: "Money paid for breaking rules",   correctMeaningId: 'penalty',  clueType: 'vivid',     difficulty: 1 },
      { text: "Everything is okay",              correctMeaningId: 'okay',     clueType: 'vivid',     difficulty: 2 },
      { text: "So thin it nearly disappears",    correctMeaningId: 'delicate', clueType: 'vivid',     difficulty: 2 },
      { text: "Carefully made and elegant",      correctMeaningId: 'quality',  clueType: 'vivid',     difficulty: 3 },
      { text: "Parking ticket consequence",      correctMeaningId: 'penalty',  clueType: 'context',   difficulty: 2 },
      { text: "Not great. Not bad. Just fine.",  correctMeaningId: 'okay',     clueType: 'vivid',     difficulty: 2 },
      { text: "Spider silk has this quality",    correctMeaningId: 'delicate', clueType: 'context',   difficulty: 3 },
      { text: "Fine dining — not fine paying",   correctMeaningId: 'quality',  clueType: 'misdirect', difficulty: 3 },
      { text: "A court-ordered payment",         correctMeaningId: 'penalty',  clueType: 'context',   difficulty: 2 },
      { text: "Between good and great — nothing",correctMeaningId: 'okay',     clueType: 'negative',  difficulty: 3 },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 13 — SICK
  // Semantic evolution. Two eras of the same word.
  // Surprise — the word changed meaning mid-century.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'SICK',
    emotionalRole: 'surprise',
    eventType: 'semanticEvolution',
    meanings: [
      { id: 'ill',        label: 'Ill',        icon: '🤒', era: 'old' },
      { id: 'impressive', label: 'Impressive', icon: '🔥', era: 'modern' },
    ],
    clues: [
      { text: "Fever and chills",               correctMeaningId: 'ill',        clueType: 'vivid',   difficulty: 1 },
      { text: "That trick was unreal",          correctMeaningId: 'impressive', clueType: 'era',     difficulty: 2, isModernEraClue: true },
      { text: "Hospital bed feeling",           correctMeaningId: 'ill',        clueType: 'vivid',   difficulty: 1 },
      { text: "Crowd went crazy for it",        correctMeaningId: 'impressive', clueType: 'era',     difficulty: 2, isModernEraClue: true },
      { text: "Calling in to work — not going", correctMeaningId: 'ill',        clueType: 'context', difficulty: 2 },
      { text: "Your gran does NOT mean this",   correctMeaningId: 'impressive', clueType: 'era',     difficulty: 3, isModernEraClue: true },
    ],
    pollyLine: "Language just changed outfits.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 14 — CAN
  // Speed relief. Two meanings. Brain clears.
  // Fast and clean before the final boss.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'CAN',
    emotionalRole: 'relief',
    eventType: 'speedRound',
    meanings: [
      { id: 'container', label: 'Metal Container', icon: '🥫' },
      { id: 'able',      label: 'Able To',         icon: '💪' },
    ],
    clues: [
      { text: "Soup in metal",           correctMeaningId: 'container', clueType: 'vivid',   difficulty: 1 },
      { text: "You've got the ability",  correctMeaningId: 'able',      clueType: 'vivid',   difficulty: 1 },
      { text: "Pop the lid",             correctMeaningId: 'container', clueType: 'vivid',   difficulty: 1 },
      { text: "Yes you are able",        correctMeaningId: 'able',      clueType: 'vivid',   difficulty: 1 },
    ],
    pollyLine: "Fast. Clean. One more word.",
  },

  // ─────────────────────────────────────────────────────────
  // ROUND 15 — ORDER (FINAL BOSS)
  // All clue types mixed. x2 score. Earned finale.
  // Every skill from the session tested at once.
  // ─────────────────────────────────────────────────────────
  {
    kind: 'word',
    word: 'ORDER',
    emotionalRole: 'boss',
    eventType: 'bossWord',
    meanings: [
      { id: 'sequence',    label: 'Sequence',    icon: '🔢' },
      { id: 'purchase',    label: 'Purchase',    icon: '📦' },
      { id: 'command',     label: 'Command',     icon: '🗣️' },
      { id: 'arrangement', label: 'Arrangement', icon: '⚖️' },
    ],
    clues: [
      { text: "Alphabet lined up",             correctMeaningId: 'sequence',    clueType: 'vivid',     difficulty: 2 },
      { text: "Package on the way",            correctMeaningId: 'purchase',    clueType: 'vivid',     difficulty: 2 },
      { text: "General's word",                correctMeaningId: 'command',     clueType: 'vivid',     difficulty: 2 },
      { text: "Chaos cleaned up",              correctMeaningId: 'arrangement', clueType: 'vivid',     difficulty: 2 },
      { text: "First second third",            correctMeaningId: 'sequence',    clueType: 'vivid',     difficulty: 1 },
      { text: "Checkout confirmation",         correctMeaningId: 'purchase',    clueType: 'context',   difficulty: 2 },
      { text: "Do it now — not a suggestion",  correctMeaningId: 'command',     clueType: 'vivid',     difficulty: 2 },
      { text: "Opposite of chaos",             correctMeaningId: 'arrangement', clueType: 'opposite',  difficulty: 2 },
      { text: "Not a request — a demand",      correctMeaningId: 'command',     clueType: 'negative',  difficulty: 3 },
      { text: "Amazon sent you one",           correctMeaningId: 'purchase',    clueType: 'misdirect', difficulty: 2 },
      { text: "Everything in its place",       correctMeaningId: 'arrangement', clueType: 'vivid',     difficulty: 2 },
      { text: "What comes after second",       correctMeaningId: 'sequence',    clueType: 'context',   difficulty: 1 },
    ],
    pollyLine: "Final split. Stay sharp.",
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

// Pick N clues from a word step, guaranteeing at least one per meaning.
// Useful for replay variety — each run samples a fresh subset.
export function pickClues(step: WordStep, count: number): Clue[] {
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
