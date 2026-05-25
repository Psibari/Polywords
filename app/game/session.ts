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
    masks: [
      { id: 'bark_trunk',    emoji: '🌳', phrase: 'Rough trunk coat',     isReal: true },
      { id: 'bark_dog',      emoji: '🔊', phrase: "Dog's sharp call",     isReal: true },
      { id: 'bark_orders',   emoji: '📢', phrase: 'Command sharply',      isReal: true },
      { id: 'bark_scratchy', emoji: '🫧', phrase: 'Scratchy to touch',    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bark_branch',   emoji: '🪵', phrase: 'Fallen branch',        isReal: false, trapType: 'domainNeighbor' },
      { id: 'bark_animal',   emoji: '🐾', phrase: "Animal's loud call",   isReal: false, trapType: 'almostSynonym' },
      { id: 'bark_surface',  emoji: '🪨', phrase: 'Rough and raw',        isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // WORD 2 — SPRING
  {
    kind: 'word',
    word: 'SPRING',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [],
    masks: [
      { id: 'spring_season', emoji: '🌸', phrase: 'Season after winter',   isReal: true },
      { id: 'spring_jump',   emoji: '🐸', phrase: 'Jump forward fast',     isReal: true },
      { id: 'spring_water',  emoji: '💧', phrase: 'Water from ground',     isReal: true },
      { id: 'spring_coil',   emoji: '🌀', phrase: 'Coiled under pressure', isReal: true, isHidden: true },
      { id: 'spring_warm',   emoji: '☀️', phrase: 'Warm sunny days',       isReal: false, trapType: 'domainNeighbor' },
      { id: 'spring_new',    emoji: '🌱', phrase: 'New beginnings',        isReal: false, trapType: 'associatedNeighbor' },
      { id: 'spring_bounce', emoji: '🤸', phrase: 'Bounce and rebound',    isReal: false, trapType: 'almostSynonym' },
      { id: 'spring_flower', emoji: '🌷', phrase: 'Garden in bloom',       isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // WORD 3 — LIGHT
  {
    kind: 'word',
    word: 'LIGHT',
    emotionalRole: 'confidence',
    eventType: 'speedRound',
    meanings: [],
    masks: [
      { id: 'light_glow',    emoji: '💡', phrase: 'What eyes use',      isReal: true },
      { id: 'light_weight',  emoji: '🪶', phrase: 'Barely any weight',  isReal: true },
      { id: 'light_tone',    emoji: '🩵', phrase: 'Pale soft tone',     isReal: true },
      { id: 'light_switch',  emoji: '🔌', phrase: 'Flip the switch',    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'light_sun',     emoji: '🌟', phrase: 'Pure sunshine',      isReal: false, trapType: 'visualNeighbor' },
      { id: 'light_feather', emoji: '🏋️', phrase: 'Light as air',      isReal: false, trapType: 'almostSynonym' },
      { id: 'light_soft',    emoji: '🎨', phrase: 'Washed out color',   isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // WORD 4 — BANK
  {
    kind: 'word',
    word: 'BANK',
    emotionalRole: 'hesitation',
    eventType: 'decoyTension',
    meanings: [],
    masks: [
      { id: 'bank_financial', emoji: '🏦', phrase: 'Where money lives',   isReal: true },
      { id: 'bank_river',     emoji: '🌊', phrase: 'Land by the water',   isReal: true },
      { id: 'bank_tilt',      emoji: '✈️', phrase: 'Lean into a turn',    isReal: true },
      { id: 'bank_atm',       emoji: '💳', phrase: 'Cash machine nearby', isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bank_saving',    emoji: '💰', phrase: 'Saving your money',   isReal: false, trapType: 'almostSynonym' },
      { id: 'bank_muddy',     emoji: '🪤', phrase: 'Muddy riverbed',      isReal: false, trapType: 'domainNeighbor' },
      { id: 'bank_trust',     emoji: '🤝', phrase: 'Trust and rely on',   isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // WORD 5 — WAKE
  {
    kind: 'word',
    word: 'WAKE',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [],
    masks: [
      { id: 'wake_sleep',   emoji: '😴', phrase: 'Leave sleep behind',    isReal: true },
      { id: 'wake_boat',    emoji: '🚢', phrase: 'Foamy boat trail',       isReal: true },
      { id: 'wake_eyelids', emoji: '🌙', phrase: 'Heavy eyelids',          isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wake_ocean',   emoji: '🌊', phrase: 'Ocean current',         isReal: false, trapType: 'domainNeighbor' },
      { id: 'wake_alarm',   emoji: '⏰', phrase: "Alarm's only job",       isReal: false, trapType: 'almostSynonym' },
      { id: 'wake_dawn',    emoji: '🌅', phrase: 'First light of morning', isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // WORD 6 — MATCH
  {
    kind: 'word',
    word: 'MATCH',
    emotionalRole: 'hesitation',
    eventType: 'decoyTension',
    meanings: [],
    masks: [
      { id: 'match_fire',   emoji: '🔥', phrase: 'Strikes to start fire',  isReal: true },
      { id: 'match_pair',   emoji: '🧩', phrase: 'Pair that belongs',      isReal: true },
      { id: 'match_game',   emoji: '🏆', phrase: 'Game between rivals',    isReal: true },
      { id: 'match_candle', emoji: '🕯️', phrase: 'Candle on table',       isReal: false, trapType: 'domainNeighbor' },
      { id: 'match_couple', emoji: '💑', phrase: 'Perfect couple',         isReal: false, trapType: 'almostSynonym' },
      { id: 'match_sports', emoji: '⚽', phrase: "Sport's equipment",      isReal: false, trapType: 'domainNeighbor' },
      { id: 'match_copy',   emoji: '📋', phrase: 'Exact duplicate',        isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // WORD 7 — SOUND
  {
    kind: 'word',
    word: 'SOUND',
    emotionalRole: 'surprise',
    eventType: 'missingMeaning',
    meanings: [],
    masks: [
      { id: 'sound_noise',   emoji: '👂', phrase: 'What ears catch',        isReal: true },
      { id: 'sound_solid',   emoji: '🛡️', phrase: 'Safe and solid',        isReal: true, isHidden: true },
      { id: 'sound_water',   emoji: '🗺️', phrase: 'Waterway between lands', isReal: true, isHidden: true },
      { id: 'sound_depth',   emoji: '📐', phrase: 'Find how deep',          isReal: true },
      { id: 'sound_melody',  emoji: '🎵', phrase: 'Musical melody',         isReal: false, trapType: 'domainNeighbor' },
      { id: 'sound_checkup', emoji: '🏥', phrase: "Doctor's checkup",       isReal: false, trapType: 'associatedNeighbor' },
      { id: 'sound_echo',    emoji: '🐋', phrase: 'Underwater echo',        isReal: false, trapType: 'domainNeighbor' },
      { id: 'sound_amp',     emoji: '🔈', phrase: 'Amplified voice',        isReal: false, trapType: 'almostSynonym' },
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
    masks: [
      { id: 'wave_ocean',    emoji: '🌊', phrase: 'Ocean rising up',     isReal: true },
      { id: 'wave_hand',     emoji: '👋', phrase: 'Goodbye with hand',   isReal: true },
      { id: 'wave_surfer',   emoji: '🏄', phrase: "Surfer's playground", isReal: false, trapType: 'domainNeighbor' },
      { id: 'wave_circular', emoji: '🔄', phrase: 'Circular motion',     isReal: false, trapType: 'almostSynonym' },
      { id: 'wave_stop',     emoji: '✋', phrase: 'Stop right there',    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wave_splash',   emoji: '💦', phrase: 'Water splashing',     isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // WORD 10 — ROCK
  {
    kind: 'word',
    word: 'ROCK',
    emotionalRole: 'surprise',
    eventType: 'slangDrop',
    meanings: [],
    masks: [
      { id: 'rock_stone',   emoji: '🪨', phrase: 'Stone you hold',       isReal: true },
      { id: 'rock_music',   emoji: '🎸', phrase: 'Music with edge',      isReal: true },
      { id: 'rock_sway',    emoji: '🌊', phrase: 'Move back and forth',  isReal: true },
      { id: 'rock_diamond', emoji: '💎', phrase: 'Ice on her finger',    isReal: true, isSlang: true },
      { id: 'rock_peak',    emoji: '⛰️', phrase: 'Mountain peak',        isReal: false, trapType: 'visualNeighbor' },
      { id: 'rock_hard',    emoji: '🏋️', phrase: 'Hard and heavy',       isReal: false, trapType: 'associatedNeighbor' },
      { id: 'rock_glass',   emoji: '🥃', phrase: 'On the rocks',         isReal: false, trapType: 'phraseTrap' },
      { id: 'rock_shore',   emoji: '🏖️', phrase: 'Rocky shoreline',      isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // WORD 11 — WELL
  {
    kind: 'word',
    word: 'WELL',
    emotionalRole: 'curiosity',
    eventType: 'wordLore',
    meanings: [],
    masks: [
      { id: 'well_healthy', emoji: '💚', phrase: 'Feeling healthy again',  isReal: true },
      { id: 'well_right',   emoji: '✅', phrase: 'Done the right way',     isReal: true },
      { id: 'well_hole',    emoji: '🕳️', phrase: 'Deep hole for water',   isReal: true },
      { id: 'well_source',  emoji: '🌊', phrase: 'Hidden source to draw',  isReal: true },
      { id: 'well_fine',    emoji: '😊', phrase: 'Everything is fine',     isReal: false, trapType: 'almostSynonym' },
      { id: 'well_water',   emoji: '💧', phrase: 'Fresh drinking water',   isReal: false, trapType: 'domainNeighbor' },
      { id: 'well_medical', emoji: '🏥', phrase: 'Medical recovery',       isReal: false, trapType: 'almostSynonym' },
      { id: 'well_dug',     emoji: '⛏️', phrase: 'Dug into earth',         isReal: false, trapType: 'visualNeighbor' },
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
    masks: [
      { id: 'fine_penalty', emoji: '💸', phrase: 'Money for rule-breaking', isReal: true },
      { id: 'fine_okay',    emoji: '😐', phrase: 'Not great not bad',       isReal: true },
      { id: 'fine_thin',    emoji: '🧵', phrase: 'So thin it disappears',   isReal: true },
      { id: 'fine_quality', emoji: '✨', phrase: 'Carefully made',          isReal: true },
      { id: 'fine_alright', emoji: '👌', phrase: 'Everything is okay',      isReal: false, trapType: 'almostSynonym' },
      { id: 'fine_law',     emoji: '👮', phrase: 'Law enforcement',         isReal: false, trapType: 'associatedNeighbor' },
      { id: 'fine_payment', emoji: '💳', phrase: 'Any kind of payment',     isReal: false, trapType: 'almostSynonym' },
      { id: 'fine_art',     emoji: '🎨', phrase: 'Artistic quality',        isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // WORD 13 — SICK
  {
    kind: 'word',
    word: 'SICK',
    emotionalRole: 'surprise',
    eventType: 'semanticEvolution',
    meanings: [],
    masks: [
      { id: 'sick_ill',        emoji: '🤒', phrase: 'Fever and chills',      isReal: true,  era: 'old' },
      { id: 'sick_impressive', emoji: '🔥', phrase: 'That trick was unreal', isReal: true,  era: 'modern', isSlang: true },
      { id: 'sick_hospital',   emoji: '🏥', phrase: 'Hospital stay',         isReal: false, trapType: 'domainNeighbor' },
      { id: 'sick_dizzy',      emoji: '😵', phrase: 'Feeling dizzy',         isReal: false, trapType: 'almostSynonym' },
      { id: 'sick_cool',       emoji: '😎', phrase: 'Really cool looking',   isReal: false, trapType: 'almostSynonym' },
      { id: 'sick_nauseous',   emoji: '🤢', phrase: 'Nauseous feeling',      isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // WORD 14 — CAN
  {
    kind: 'word',
    word: 'CAN',
    emotionalRole: 'relief',
    eventType: 'speedRound',
    meanings: [],
    masks: [
      { id: 'can_container', emoji: '🥫', phrase: 'Soup in metal',       isReal: true },
      { id: 'can_able',      emoji: '💪', phrase: "You've got ability",   isReal: true },
      { id: 'can_trash',     emoji: '🗑️', phrase: 'Trash receptacle',    isReal: false, trapType: 'visualNeighbor' },
      { id: 'can_beer',      emoji: '🍺', phrase: 'Tin of beer',          isReal: false, trapType: 'domainNeighbor' },
      { id: 'can_permit',    emoji: '✅', phrase: 'Permission granted',   isReal: false, trapType: 'almostSynonym' },
      { id: 'can_sealed',    emoji: '🔒', phrase: 'Sealed shut',          isReal: false, trapType: 'visualNeighbor' },
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
    masks: [
      { id: 'order_sequence',   emoji: '🔤', phrase: 'Alphabet lined up',   isReal: true },
      { id: 'order_purchase',   emoji: '📦', phrase: 'Package on the way',  isReal: true },
      { id: 'order_command',    emoji: '⚔️', phrase: "General's word",      isReal: true },
      { id: 'order_arrange',    emoji: '🗂️', phrase: 'Chaos cleaned up',    isReal: true },
      { id: 'order_shopping',   emoji: '🛒', phrase: 'Shopping list',       isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_court',      emoji: '⚖️', phrase: 'Court ruling',        isReal: false, trapType: 'almostSynonym' },
      { id: 'order_restaurant', emoji: '🍽️', phrase: 'Restaurant request', isReal: false, trapType: 'associatedNeighbor', borderline: true },
      { id: 'order_pattern',    emoji: '🔁', phrase: 'Repeat pattern',      isReal: false, trapType: 'almostSynonym' },
      { id: 'order_law',        emoji: '🏛️', phrase: 'Law and order',       isReal: false, trapType: 'phraseTrap' },
      { id: 'order_military',   emoji: '🎖️', phrase: 'Military rank',       isReal: false, trapType: 'domainNeighbor' },
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
