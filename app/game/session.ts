// ============================================================
// POLY WORDS — POLY RUN SESSION
// 15-word Poly Run session. Fixed order. No randomization.
// ============================================================

import { SessionStep, WordStep, PhraseBreakStep } from './types';

export const SESSION: SessionStep[] = [

  // WORD 1 — BARK
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

  // WORD 2 — SPRING
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

  // WORD 3 — LIGHT
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

  // WORD 4 — BANK
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

  // WORD 5 — WAKE
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

  // WORD 6 — MATCH
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

  // WORD 7 — SOUND
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

  // WORD 8 — PHRASE BREAK
  {
    kind: 'phraseBreak',
    phrase: 'Spill the beans',
    emotionalRole: 'reward',
    eventType: 'phraseBreak',
    question: 'Where did this phrase likely come from?',
    choices: ['Secret voting with beans', 'Cooking soup', 'Farm markets', 'Pirate treasure'],
    correctChoice: 'Secret voting with beans',
    pollyLine: 'Tiny detour. Big meaning.',
  },

  // WORD 9 — WAVE
  {
    kind: 'word',
    word: 'WAVE',
    emotionalRole: 'relief',
    eventType: 'normal',
    meanings: [],
    hiddenMeaning:   'Surge of something',
    hiddenTrap:      'Rides into shore',
    hiddenEmoji:     '📊',
    hiddenTrapEmoji: '🌺',
    masks: [
      { id: 'wave_ocean',    emoji: '🌊', phrase: 'Water rising up',       isReal: true },
      { id: 'wave_hand',     emoji: '🖐️', phrase: 'Hand says goodbye',    isReal: true },
      { id: 'wave_surfer',   emoji: '🏄', phrase: "Surfer's playground",   isReal: false, trapType: 'domainNeighbor' },
      { id: 'wave_circular', emoji: '📈', phrase: 'Sudden surge of it',    isReal: false, trapType: 'almostSynonym' },
      { id: 'wave_stop',     emoji: '✋', phrase: 'Hand says stop',        isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wave_splash',   emoji: '💨', phrase: "Shore's white splash",  isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // WORD 10 — ROCK
  {
    kind: 'word',
    word: 'ROCK',
    emotionalRole: 'surprise',
    eventType: 'slangDrop',
    meanings: [],
    hiddenMeaning:   'Rocked the whole room',
    hiddenTrap:      'Dense and solid',
    hiddenEmoji:     '🌋',
    hiddenTrapEmoji: '⛏️',
    masks: [
      { id: 'rock_stone',   emoji: '🪨', phrase: 'Stone you can hold',    isReal: true },
      { id: 'rock_music',   emoji: '🎸', phrase: 'Music with an edge',    isReal: true },
      { id: 'rock_sway',    emoji: '🛏️', phrase: 'Sway it to sleep',      isReal: true },
      { id: 'rock_diamond', emoji: '💍', phrase: 'Ice on her finger',     isReal: true, isSlang: true },
      { id: 'rock_peak',    emoji: '🏔️', phrase: "Mountain's peak",       isReal: false, trapType: 'visualNeighbor' },
      { id: 'rock_hard',    emoji: '⛏️', phrase: 'Hard and heavy',        isReal: false, trapType: 'associatedNeighbor' },
      { id: 'rock_glass',   emoji: '🥃', phrase: 'On the rocks',          isReal: false, trapType: 'phraseTrap' },
      { id: 'rock_shore',   emoji: '🌋', phrase: 'Shake the room',        isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // WORD 11 — WELL
  {
    kind: 'word',
    word: 'WELL',
    emotionalRole: 'curiosity',
    eventType: 'wordLore',
    meanings: [],
    hiddenMeaning:   'Welled up inside',
    hiddenTrap:      'Back on your feet',
    hiddenEmoji:     '🫧',
    hiddenTrapEmoji: '💉',
    masks: [
      { id: 'well_healthy', emoji: '🩹', phrase: 'Back in good health',   isReal: true },
      { id: 'well_right',   emoji: '🎯', phrase: 'Done the right way',    isReal: true },
      { id: 'well_hole',    emoji: '🪣', phrase: 'Dug deep for water',    isReal: true },
      { id: 'well_source',  emoji: '🐟', phrase: 'Rise to the surface',   isReal: true },
      { id: 'well_fine',    emoji: '🙂', phrase: 'Everything is fine',    isReal: false, trapType: 'almostSynonym' },
      { id: 'well_water',   emoji: '💧', phrase: 'Clean drinking water',  isReal: false, trapType: 'domainNeighbor' },
      { id: 'well_medical', emoji: '🏥', phrase: 'Medical recovery',      isReal: false, trapType: 'almostSynonym' },
      { id: 'well_dug',     emoji: '🌊', phrase: 'Bubbles rising up',     isReal: false, trapType: 'visualNeighbor' },
    ],
    lore: {
      title: 'Ancient Roots',
      text: 'Well has meant both good health and deep water since Old English. One word. Two completely different worlds. Both ancient.',
    },
  },

  // WORD 12 — FINE
  {
    kind: 'word',
    word: 'FINE',
    emotionalRole: 'hesitation',
    eventType: 'decoyHeavy',
    meanings: [],
    hiddenMeaning:   'Bright clear morning',
    hiddenTrap:      'Called the cops',
    hiddenEmoji:     '🌤️',
    hiddenTrapEmoji: '🚔',
    masks: [
      { id: 'fine_penalty', emoji: '⚖️', phrase: 'Pay the penalty',        isReal: true },
      { id: 'fine_okay',    emoji: '😑', phrase: 'Not bad, not great',     isReal: true },
      { id: 'fine_thin',    emoji: '🧵', phrase: 'Thin as a thread',       isReal: true },
      { id: 'fine_quality', emoji: '🎨', phrase: 'Crafted with care',      isReal: true },
      { id: 'fine_alright', emoji: '👌', phrase: 'All is okay',            isReal: false, trapType: 'almostSynonym' },
      { id: 'fine_law',     emoji: '👮', phrase: 'Law enforcement',        isReal: false, trapType: 'associatedNeighbor' },
      { id: 'fine_payment', emoji: '🌤️', phrase: 'Clear weather, finally', isReal: false, trapType: 'almostSynonym' },
      { id: 'fine_art',     emoji: '🖼️', phrase: 'Artistic quality',       isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // WORD 13 — SICK
  {
    kind: 'word',
    word: 'SICK',
    emotionalRole: 'surprise',
    eventType: 'semanticEvolution',
    meanings: [],
    hiddenMeaning:   'Wrong kind of dark',
    hiddenTrap:      'Call the doctor',
    hiddenEmoji:     '😨',
    hiddenTrapEmoji: '🩺',
    masks: [
      { id: 'sick_ill',        emoji: '🤒', phrase: 'Fever and chills',      isReal: true,  era: 'old' },
      { id: 'sick_impressive', emoji: '🤙', phrase: 'That was unreal',       isReal: true,  era: 'modern', isSlang: true },
      { id: 'sick_hospital',   emoji: '😰', phrase: 'Deeply disturbing',     isReal: false, trapType: 'domainNeighbor' },
      { id: 'sick_dizzy',      emoji: '💊', phrase: 'Needs a doctor',        isReal: false, trapType: 'almostSynonym' },
      { id: 'sick_cool',       emoji: '😎', phrase: 'Really cool looking',   isReal: false, trapType: 'almostSynonym' },
      { id: 'sick_nauseous',   emoji: '🤢', phrase: 'Nauseous, queasy',      isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // WORD 14 — CAN
  {
    kind: 'word',
    word: 'CAN',
    emotionalRole: 'relief',
    eventType: 'speedRound',
    meanings: [],
    hiddenMeaning:   'Shown the door',
    hiddenTrap:      'Cold one in a tin',
    hiddenEmoji:     '🚪',
    hiddenTrapEmoji: '🍺',
    masks: [
      { id: 'can_container', emoji: '🥫', phrase: "Soup's tin home",      isReal: true },
      { id: 'can_able',      emoji: '💪', phrase: "You're able to",       isReal: true },
      { id: 'can_trash',     emoji: '🗑️', phrase: 'Trash receptacle',     isReal: false, trapType: 'visualNeighbor' },
      { id: 'can_beer',      emoji: '🚪', phrase: 'Fire someone out',     isReal: false, trapType: 'domainNeighbor' },
      { id: 'can_permit',    emoji: '🔓', phrase: 'Permission granted',   isReal: false, trapType: 'almostSynonym' },
      { id: 'can_sealed',    emoji: '🍺', phrase: 'Tin of beer',          isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // WORD 15 — ORDER
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
      { id: 'order_court',      emoji: '⛪', phrase: 'A holy brotherhood',   isReal: false, trapType: 'almostSynonym' },
      { id: 'order_restaurant', emoji: '🍽️', phrase: 'Restaurant request',  isReal: false, trapType: 'associatedNeighbor', borderline: true },
      { id: 'order_pattern',    emoji: '🔄', phrase: 'Repeating pattern',    isReal: false, trapType: 'almostSynonym' },
      { id: 'order_law',        emoji: '🏛️', phrase: "Court's ruling",       isReal: false, trapType: 'phraseTrap' },
      { id: 'order_military',   emoji: '👮', phrase: 'Law and order',        isReal: false, trapType: 'domainNeighbor' },
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
