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
    hiddenMeaning:   "A doorframe's parting gift",
    hiddenTrap:      "A lemon's bitter coat",
    hiddenEmoji:     '⛵',
    hiddenTrapEmoji: '📣',
    masks: [
      { id: 'bark_tree',   emoji: '🪵', phrase: "What a tree wears in winter",  isReal: true },
      { id: 'bark_dog',    emoji: '🐕', phrase: "What startles the mailman",    isReal: true },
      { id: 'bark_order',  emoji: '🫵', phrase: "Boss's favorite verb",         isReal: true },
      { id: 'bark_growl',  emoji: '🧱', phrase: "Dog's warning, not its bite",  isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bark_wolf',   emoji: '📯', phrase: "A pack's night anthem",        isReal: false, trapType: 'visualNeighbor' },
      { id: 'bark_pie',    emoji: '🥧', phrase: "Inside every apple pie",       isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // WORD 2 — SPRING (index 1)
  {
    kind: 'word',
    word: 'SPRING',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [],
    hiddenMeaning:   "A hull's bad morning",
    hiddenTrap:      "What beds hide inside",
    hiddenEmoji:     '⚡',
    hiddenTrapEmoji: '🌈',
    masks: [
      { id: 'spring_season', emoji: '🌸', phrase: "What snowmen dread most",     isReal: true },
      { id: 'spring_jump',   emoji: '🤸', phrase: "Launched from a crouch",      isReal: true },
      { id: 'spring_water',  emoji: '💦', phrase: "Bubbling up from nowhere",    isReal: true },
      { id: 'spring_coil',   emoji: '🪝', phrase: 'Bouncy metal squiggle',       isReal: true, isHidden: true },
      { id: 'spring_warm',   emoji: '🌤️', phrase: 'First after the last freeze', isReal: false, trapType: 'domainNeighbor' },
      { id: 'spring_new',    emoji: '🌱', phrase: 'When cherry blossoms fall',   isReal: false, trapType: 'associatedNeighbor' },
      { id: 'spring_bounce', emoji: '⚡', phrase: "A mousetrap's big moment",    isReal: false, trapType: 'almostSynonym' },
      { id: 'spring_flower', emoji: '🌿', phrase: "A rabbit's getaway move",     isReal: false, trapType: 'domainNeighbor' },
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
    hiddenMeaning:   'What lighthouses argue with',
    hiddenTrap:      'Guarded by serious steel',
    hiddenEmoji:     '☁️',
    hiddenTrapEmoji: '🪨',
    masks: [
      { id: 'bank_money',    emoji: '🏦', phrase: "Where your cash hibernates",      isReal: true },
      { id: 'bank_river',    emoji: '🏞️', phrase: "Where fishing lines land",        isReal: true },
      { id: 'bank_tilt',     emoji: '🛩️', phrase: 'Sky tilted on purpose',           isReal: true },
      { id: 'bank_frozen',   emoji: '🧊', phrase: 'Frozen just in case',             isReal: true },
      { id: 'bank_teller',   emoji: '💳', phrase: "A teller's long queue",           isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bank_interest', emoji: '🏺', phrase: 'Where interest quietly multiplies', isReal: false, trapType: 'almostSynonym' },
      { id: 'bank_cliff',    emoji: '🌫️', phrase: 'A cliff face, not a slope',       isReal: false, trapType: 'domainNeighbor' },
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
    hiddenMeaning:   'The mess nobody chose',
    hiddenTrap:      'Water that has opinions',
    hiddenEmoji:     '⚰️',
    hiddenTrapEmoji: '🌙',
    masks: [
      { id: 'wake_dawn',     emoji: '⏰', phrase: 'Eyelids lifting at dawn',         isReal: true },
      { id: 'wake_boat',     emoji: '🚢', phrase: "A boat's churned-up road",        isReal: true },
      { id: 'wake_funeral',  emoji: '🕯️', phrase: 'Goodbye before the ground',      isReal: true },
      { id: 'wake_snooze',   emoji: '😪', phrase: 'Nine more minutes, always',       isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wake_river',    emoji: '🌊', phrase: "A river's gentle push",           isReal: false, trapType: 'domainNeighbor' },
      { id: 'wake_alarm',    emoji: '🌄', phrase: 'What alarm clocks wage war on',   isReal: false, trapType: 'almostSynonym' },
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
    hiddenMeaning:   'Slow-burning battle cord',
    hiddenTrap:      "Your reflection's nod back",
    hiddenEmoji:     '💍',
    hiddenTrapEmoji: '🥅',
    masks: [
      { id: 'match_competition', emoji: '⚔️', phrase: 'Where rivals settle things',    isReal: true },
      { id: 'match_fire',        emoji: '🪔', phrase: 'One scratch, instant light',    isReal: true },
      { id: 'match_copy',        emoji: '🧩', phrase: 'Identical by accident',         isReal: true },
      { id: 'match_pair',        emoji: '🤝', phrase: 'Two people, one verdict',       isReal: true },
      { id: 'match_kindle',      emoji: '🕯️', phrase: 'Little sticks, big ambitions', isReal: false, trapType: 'domainNeighbor' },
      { id: 'match_tie',         emoji: '💑', phrase: "The scoreboard's awkward tie",  isReal: false, trapType: 'almostSynonym' },
      { id: 'match_trophy',      emoji: '⚽', phrase: "A winner's permanent record",   isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // WORD 8 — SOUND (index 9)
  {
    kind: 'word',
    word: 'SOUND',
    emotionalRole: 'surprise',
    eventType: 'missingMeaning',
    meanings: [],
    hiddenMeaning:   "A band's whole vibe",
    hiddenTrap:      "A ping's patient echo",
    hiddenEmoji:     '🗣️',
    hiddenTrapEmoji: '🎙️',
    masks: [
      { id: 'sound_audio',   emoji: '👂', phrase: 'Ears have no off switch',        isReal: true },
      { id: 'sound_valid',   emoji: '🏔️', phrase: "Advice you don't question",      isReal: true, isHidden: true },
      { id: 'sound_strait',  emoji: '🗺️', phrase: "The sea's hallway",              isReal: true, isHidden: true },
      { id: 'sound_seem',    emoji: '⚓', phrase: 'Comes across as right',          isReal: true },
      { id: 'sound_speaker', emoji: '🎤', phrase: 'What a speaker pushes out',      isReal: false, trapType: 'almostSynonym' },
      { id: 'sound_checkup', emoji: '🩺', phrase: "A note's place in the scale",    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'sound_drum',    emoji: '🐬', phrase: "A drum's taut face",             isReal: false, trapType: 'domainNeighbor' },
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
    hiddenMeaning:   'Below class, above family',
    hiddenTrap:      "The bench's final document",
    hiddenEmoji:     '⛪',
    hiddenTrapEmoji: '🏛️',
    masks: [
      { id: 'order_monks',        emoji: '🧹', phrase: 'What monks answer to',              isReal: true },
      { id: 'order_command',      emoji: '🎖️', phrase: 'Said once, not twice',              isReal: true },
      { id: 'order_purchase',     emoji: '📬', phrase: 'Your choice made official',         isReal: true },
      { id: 'order_arrange',      emoji: '📐', phrase: 'Chaos cleaned up',                  isReal: true },
      { id: 'order_court',        emoji: '🍽️', phrase: "A courtroom's final word",         isReal: false, trapType: 'associatedNeighbor', borderline: true },
      { id: 'order_queue',        emoji: '🛒', phrase: 'The British national pastime',      isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_checklist',    emoji: '🔄', phrase: 'Everything ticked, nothing missed', isReal: false, trapType: 'almostSynonym' },
      { id: 'order_instructions', emoji: '📋', phrase: 'The instructions, page one',        isReal: false, trapType: 'associatedNeighbor' },
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
