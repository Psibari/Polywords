// ============================================================
// POLY WORDS — POLY RUN SESSION
// 15-word Poly Run session. Fixed order. No randomization.
// ============================================================

import { SessionStep, WordStep, PhraseBreakStep, SwitchbackStep } from './types';

// ============================================================
// PHRASE BREAK POOL
// ============================================================

export const phraseBreakPool: PhraseBreakStep[] = [
  {
    kind: 'phraseBreak',
    emotionalRole: 'reward',
    eventType: 'phraseBreak',
    phrase: 'Spill the beans',
    question: 'Where did this come from?',
    answers: [
      { text: 'Secret voting with beans', correct: true },
      { text: 'Cooking accident',         correct: false },
      { text: 'Farm market gossip',        correct: false },
      { text: 'Sailor punishment',         correct: false },
    ],
    pollyReveal: 'Ancient Greeks voted with beans.',
  },
  {
    kind: 'phraseBreak',
    emotionalRole: 'reward',
    eventType: 'phraseBreak',
    phrase: 'Bite the bullet',
    question: 'What did this literally mean?',
    answers: [
      { text: 'Chew metal to survive pain', correct: true },
      { text: 'Face gunfire bravely',        correct: false },
      { text: 'Load your weapon fast',       correct: false },
      { text: 'Take the hit for someone',    correct: false },
    ],
    pollyReveal: 'Surgery before anaesthetic.',
  },
  {
    kind: 'phraseBreak',
    emotionalRole: 'reward',
    eventType: 'phraseBreak',
    phrase: 'Break a leg',
    question: 'Why do actors say this?',
    answers: [
      { text: 'Saying luck brings bad luck', correct: true },
      { text: 'Old dance move',              correct: false },
      { text: 'Shakespeare wrote it first',  correct: false },
      { text: 'Stage falling was common',    correct: false },
    ],
    pollyReveal: 'Reverse the curse.',
  },
];

const _selected = phraseBreakPool[Math.floor(Math.random() * phraseBreakPool.length)];

// ============================================================
// SLANG DROP POOL
// ============================================================

export const slangPool: WordStep[] = [

  // SICK — OLD SCHOOL
  {
    kind: 'word',
    word: 'SICK',
    emotionalRole: 'surprise',
    eventType: 'slangDrop',
    slangEra: 'OLD SCHOOL',
    slangMaskId: 'sick_impressive',
    meanings: [],
    masks: [
      { id: 'sick_impressive', emoji: '🤙', phrase: 'That trick though',     isReal: true,  isSlang: true, era: 'modern' },
      { id: 'sick_cool',       emoji: '😎', phrase: 'Really cool looking',   isReal: false, trapType: 'almostSynonym' },
      { id: 'sick_nauseous',   emoji: '🤢', phrase: 'Nauseous, queasy',      isReal: false, trapType: 'associatedNeighbor' },
      { id: 'sick_hospital',   emoji: '💊', phrase: 'Needs a doctor',        isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // BAD — OLD SCHOOL
  {
    kind: 'word',
    word: 'BAD',
    emotionalRole: 'surprise',
    eventType: 'slangDrop',
    slangEra: 'OLD SCHOOL',
    slangMaskId: 'bad_slang',
    meanings: [],
    masks: [
      { id: 'bad_slang',    emoji: '🤙', phrase: 'Michael said so',        isReal: true,  isSlang: true, era: 'modern' },
      { id: 'bad_poor',     emoji: '👎', phrase: 'Needs improvement',      isReal: false, trapType: 'almostSynonym' },
      { id: 'bad_danger',   emoji: '⚠️', phrase: 'Dangerous, watch out',   isReal: false, trapType: 'domainNeighbor' },
      { id: 'bad_villain',  emoji: '🦹', phrase: 'The villain',            isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // CHILL — OLD SCHOOL
  {
    kind: 'word',
    word: 'CHILL',
    emotionalRole: 'surprise',
    eventType: 'slangDrop',
    slangEra: 'OLD SCHOOL',
    slangMaskId: 'chill_relax',
    meanings: [],
    masks: [
      { id: 'chill_relax',   emoji: '🛋️', phrase: 'What Fridays are for', isReal: true,  isSlang: true, era: 'modern' },
      { id: 'chill_cold',    emoji: '🧊', phrase: 'Put it in the fridge',  isReal: false, trapType: 'associatedNeighbor' },
      { id: 'chill_feeling', emoji: '🥶', phrase: 'A slight cold feeling', isReal: false, trapType: 'domainNeighbor' },
      { id: 'chill_phrase',  emoji: '😤', phrase: 'Keep your cool',        isReal: false, trapType: 'almostSynonym' },
    ],
  },

];

const _selectedSlang = slangPool[Math.floor(Math.random() * slangPool.length)];

// ============================================================
// SWITCHBACK POOL
// ============================================================

export const switchbackPool: SwitchbackStep[] = [

  {
    kind: 'switchback',
    clue1: { emoji: '🏏', text: 'Swings in baseball' },
    clue2: { emoji: '🦇', text: 'Sleeps upside down' },
    answers: [
      { word: 'BAT',   correct: true  },
      { word: 'CLUB',  correct: false },
      { word: 'SWING', correct: false },
      { word: 'CAVE',  correct: false },
    ],
    pollyReveal: 'BAT swings. BAT sleeps.',
  },

  {
    kind: 'switchback',
    clue1: { emoji: '🏦', text: 'Holds your money' },
    clue2: { emoji: '🌊', text: "River's edge" },
    answers: [
      { word: 'BANK',  correct: true  },
      { word: 'SHORE', correct: false },
      { word: 'VAULT', correct: false },
      { word: 'LEDGE', correct: false },
    ],
    pollyReveal: 'BANK stores. BANK borders.',
  },

  {
    kind: 'switchback',
    clue1: { emoji: '🎣', text: 'Fishing line goes this way' },
    clue2: { emoji: '🎭', text: 'Actors in a film' },
    answers: [
      { word: 'CAST',  correct: true  },
      { word: 'THROW', correct: false },
      { word: 'CREW',  correct: false },
      { word: 'LINE',  correct: false },
    ],
    pollyReveal: 'CAST launches. CAST performs.',
  },

  {
    kind: 'switchback',
    clue1: { emoji: '⚡', text: 'Lightning does it' },
    clue2: { emoji: '🎳', text: "Bowler's perfect throw" },
    answers: [
      { word: 'STRIKE', correct: true  },
      { word: 'HIT',    correct: false },
      { word: 'BOLT',   correct: false },
      { word: 'BOWL',   correct: false },
    ],
    pollyReveal: 'STRIKE hits. STRIKE wins.',
  },

  {
    kind: 'switchback',
    clue1: { emoji: '👂', text: 'Ears catch it' },
    clue2: { emoji: '🗺️', text: 'Water between two lands' },
    answers: [
      { word: 'SOUND',  correct: true  },
      { word: 'NOISE',  correct: false },
      { word: 'STRAIT', correct: false },
      { word: 'ECHO',   correct: false },
    ],
    pollyReveal: 'SOUND is heard. SOUND is sailed.',
  },

];

const _selectedSwitchback = switchbackPool[Math.floor(Math.random() * switchbackPool.length)];

// ============================================================
// SESSION — 11 steps
// ============================================================

export const SESSION: SessionStep[] = [

  // WORD 1 — BARK (index 0)
  {
    kind: 'word',
    word: 'BARK',
    emotionalRole: 'confidence',
    eventType: 'normal',
    meanings: [],
    hiddenMeaning:   "Old ship's hull",
    hiddenTrap:      "Crowd's roar",
    hiddenEmoji:     '⛵',
    hiddenTrapEmoji: '📣',
    masks: [
      { id: 'bark_trunk',    emoji: '🪵', phrase: "Tree's tough skin",    isReal: true },
      { id: 'bark_dog',      emoji: '🐕', phrase: "Dog's sharp cry",      isReal: true },
      { id: 'bark_orders',   emoji: '🫵', phrase: 'Snap a command',       isReal: true },
      { id: 'bark_scratchy', emoji: '🧱', phrase: 'Rough to touch',       isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bark_surface',  emoji: '📯', phrase: 'Any loud noise',       isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // WORD 2 — SPRING (index 1)
  {
    kind: 'word',
    word: 'SPRING',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [],
    hiddenMeaning:   'Spring it on them',
    hiddenTrap:      'After the rain',
    hiddenEmoji:     '⚡',
    hiddenTrapEmoji: '🌈',
    masks: [
      { id: 'spring_season', emoji: '🌸', phrase: 'Season after frost',   isReal: true },
      { id: 'spring_jump',   emoji: '🤸', phrase: 'Launch your body',     isReal: true },
      { id: 'spring_water',  emoji: '💦', phrase: "Earth's own water",    isReal: true },
      { id: 'spring_coil',   emoji: '🪝', phrase: 'Coiled tension',       isReal: true, isHidden: true },
      { id: 'spring_warm',   emoji: '🌤️', phrase: 'Warm sunny mood',      isReal: false, trapType: 'domainNeighbor' },
      { id: 'spring_new',    emoji: '🌱', phrase: 'Growth just starting', isReal: false, trapType: 'associatedNeighbor' },
      { id: 'spring_bounce', emoji: '⚡', phrase: 'Trigger it fast',      isReal: false, trapType: 'almostSynonym' },
      { id: 'spring_flower', emoji: '🌿', phrase: 'Morning freshness',    isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // WORD 3 — LIGHT (index 2)
  {
    kind: 'word',
    word: 'LIGHT',
    emotionalRole: 'confidence',
    eventType: 'speedRound',
    meanings: [],
    hiddenMeaning:   'Nothing too heavy',
    hiddenTrap:      'The lamp itself',
    hiddenEmoji:     '🛋️',
    hiddenTrapEmoji: '🔦',
    masks: [
      { id: 'light_glow',    emoji: '✨', phrase: 'What eyes drink in',   isReal: true },
      { id: 'light_weight',  emoji: '🪶', phrase: 'Barely any weight',    isReal: true },
      { id: 'light_tone',    emoji: '🫧', phrase: 'Pale, washed out',     isReal: true },
      { id: 'light_switch',  emoji: '🔥', phrase: 'Set it burning',       isReal: false, trapType: 'associatedNeighbor' },
      { id: 'light_sun',     emoji: '☀️', phrase: 'Pure sunshine',        isReal: false, trapType: 'visualNeighbor' },
      { id: 'light_feather', emoji: '🥊', phrase: 'Featherweight class',  isReal: false, trapType: 'almostSynonym' },
      { id: 'light_soft',    emoji: '😮‍💨', phrase: 'Easy, no strain',    isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // SWITCHBACK (index 3) — randomly selected from switchbackPool
  _selectedSwitchback,

  // WORD 4 — BANK (index 4)
  {
    kind: 'word',
    word: 'BANK',
    emotionalRole: 'hesitation',
    eventType: 'decoyTension',
    meanings: [],
    hiddenMeaning:   'Thick wall of fog',
    hiddenTrap:      'Muddy riverbed',
    hiddenEmoji:     '☁️',
    hiddenTrapEmoji: '🪨',
    masks: [
      { id: 'bank_financial', emoji: '🏦', phrase: "Money's safe house",  isReal: true },
      { id: 'bank_river',     emoji: '🏞️', phrase: "River's soft edge",   isReal: true },
      { id: 'bank_tilt',      emoji: '🛩️', phrase: 'Lean into the turn',  isReal: true },
      { id: 'bank_atm',       emoji: '💳', phrase: 'Cash machine',        isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bank_saving',    emoji: '🏺', phrase: 'Save it for later',   isReal: false, trapType: 'almostSynonym' },
      { id: 'bank_muddy',     emoji: '🌫️', phrase: 'Mass of cloud',       isReal: false, trapType: 'domainNeighbor' },
      { id: 'bank_trust',     emoji: '🤞', phrase: 'Lean on and trust',   isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // PHRASE BREAK (index 5) — randomly selected from phraseBreakPool
  _selected,

  // WORD 5 — WAKE (index 6)
  {
    kind: 'word',
    word: 'WAKE',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [],
    hiddenMeaning:   'Sit with the dead',
    hiddenTrap:      "Night's long quiet",
    hiddenEmoji:     '⚰️',
    hiddenTrapEmoji: '🌙',
    masks: [
      { id: 'wake_sleep',   emoji: '⏰', phrase: 'Leave sleep behind',    isReal: true },
      { id: 'wake_boat',    emoji: '🚢', phrase: "Boat's foam trail",      isReal: true },
      { id: 'wake_eyelids', emoji: '😪', phrase: 'Heavy lids drooping',   isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wake_ocean',   emoji: '🌊', phrase: 'Open ocean current',    isReal: false, trapType: 'domainNeighbor' },
      { id: 'wake_alarm',   emoji: '🕯️', phrase: 'Watch over the dead',   isReal: false, trapType: 'almostSynonym' },
      { id: 'wake_dawn',    emoji: '🌄', phrase: "Dawn's arrival",         isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // SLANG DROP (index 7) — randomly selected from slangPool
  _selectedSlang,

  // WORD 7 — MATCH (index 8)
  {
    kind: 'word',
    word: 'MATCH',
    emotionalRole: 'hesitation',
    eventType: 'decoyTension',
    meanings: [],
    hiddenMeaning:   'Worthy for marriage',
    hiddenTrap:      'Goalposts and nets',
    hiddenEmoji:     '💍',
    hiddenTrapEmoji: '🥅',
    masks: [
      { id: 'match_fire',   emoji: '🪔', phrase: 'Strikes a flame',      isReal: true },
      { id: 'match_pair',   emoji: '🧩', phrase: 'Pair that fits',        isReal: true },
      { id: 'match_game',   emoji: '⚔️', phrase: 'Rivals face off',       isReal: true },
      { id: 'match_candle', emoji: '🕯️', phrase: 'Candle on table',      isReal: false, trapType: 'domainNeighbor' },
      { id: 'match_couple', emoji: '💑', phrase: 'Perfect couple',        isReal: false, trapType: 'almostSynonym' },
      { id: 'match_sports', emoji: '⚽', phrase: "Sport's equipment",     isReal: false, trapType: 'domainNeighbor' },
      { id: 'match_copy',   emoji: '🪞', phrase: 'Exact same copy',       isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // WORD 8 — SOUND (index 9)
  {
    kind: 'word',
    word: 'SOUND',
    emotionalRole: 'surprise',
    eventType: 'missingMeaning',
    meanings: [],
    hiddenMeaning:   'Leave an impression',
    hiddenTrap:      'Mic on the stand',
    hiddenEmoji:     '🗣️',
    hiddenTrapEmoji: '🎙️',
    masks: [
      { id: 'sound_noise',   emoji: '👂', phrase: 'Ears catch this',        isReal: true },
      { id: 'sound_solid',   emoji: '🏔️', phrase: 'Solid, no cracks',      isReal: true, isHidden: true },
      { id: 'sound_water',   emoji: '🗺️', phrase: 'Strait between lands',  isReal: true, isHidden: true },
      { id: 'sound_depth',   emoji: '⚓', phrase: 'Probe the depth',        isReal: true },
      { id: 'sound_melody',  emoji: '🎼', phrase: 'Musical melody',         isReal: false, trapType: 'domainNeighbor' },
      { id: 'sound_checkup', emoji: '🩺', phrase: "Doctor's full check",    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'sound_echo',    emoji: '🐬', phrase: 'Underwater echo',        isReal: false, trapType: 'domainNeighbor' },
      { id: 'sound_amp',     emoji: '🎤', phrase: 'Amplified voice',        isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // WORD 9 — ORDER (index 10)
  {
    kind: 'word',
    word: 'ORDER',
    emotionalRole: 'boss',
    eventType: 'bossWord',
    pollyLine: 'Final split. Stay sharp.',
    meanings: [],
    hiddenMeaning:   'Holy men in robes',
    hiddenTrap:      "Judge's final word",
    hiddenEmoji:     '⛪',
    hiddenTrapEmoji: '🏛️',
    masks: [
      { id: 'order_sequence',   emoji: '📐', phrase: 'Everything in line',   isReal: true },
      { id: 'order_purchase',   emoji: '📬', phrase: 'Package incoming',     isReal: true },
      { id: 'order_command',    emoji: '🎖️', phrase: "General's command",    isReal: true },
      { id: 'order_arrange',    emoji: '🧹', phrase: 'Chaos cleaned up',     isReal: true },
      { id: 'order_shopping',   emoji: '🛒', phrase: 'The shopping list',    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_restaurant', emoji: '🍽️', phrase: 'Restaurant request',  isReal: false, trapType: 'associatedNeighbor', borderline: true },
      { id: 'order_pattern',    emoji: '🔄', phrase: 'Repeating pattern',    isReal: false, trapType: 'almostSynonym' },
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

export function isSwitchbackStep(step: SessionStep): step is SwitchbackStep {
  return step.kind === 'switchback';
}
