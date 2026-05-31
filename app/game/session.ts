// ============================================================
// POLY WORDS — POLY RUN SESSION
// 12-word Poly Run session. Fixed order. No randomization.
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

  // COLD — both clues resolve to the same connecting word
  {
    kind: 'switchback',
    id: 'switchback_cold',
    word: 'COLD',
    clueA: "Left out on purpose",
    clueB: "Fever's uninvited guest",
    senseA: "Emotionally distant",
    senseB: "A common illness",
    pollyLine: "Same word. Two completely different bad days.",
    clue1: { emoji: '🥶', text: "Left out on purpose" },
    clue2: { emoji: '🤒', text: "Fever's uninvited guest" },
    answers: [
      { word: 'COLD',  correct: true  },
      { word: 'WARM',  correct: false },
      { word: 'SICK',  correct: false },
      { word: 'CHILL', correct: false },
    ],
    pollyReveal: "Same word. Two completely different bad days.",
    emotionalRole: 'brainGlitch',
    eventType: 'switchback',
    pollyBufferDelay: 1500,
    pollyBufferLine: 'Back to meanings. Stay sharp.',
  },

];

// ============================================================
// SESSION — 12 steps
// ============================================================

export const SESSION: SessionStep[] = [

  // STEP 1 — LIGHT (Standard, opener)
  {
    kind: 'word',
    word: 'LIGHT',
    emotionalRole: 'opener',
    eventType: 'standard',
    tileStagger: 100,
    pollyLine: 'More than one kind of light.',
    meanings: [],
    hiddenMeaning:   'Where the bird rested',
    hiddenTrap:      "A traffic signal's job",
    hiddenEmoji:     '🌿',
    hiddenTrapEmoji: '🚦',
    masks: [
      { id: 'light_darkness', emoji: '✨', phrase: 'What darkness surrenders to', isReal: true },
      { id: 'light_weight',   emoji: '🪶', phrase: 'Easy on the shoulders',       isReal: true },
      { id: 'light_wick',     emoji: '🕯️', phrase: 'Sets the wick going',          isReal: true },
      { id: 'light_pale',     emoji: '🫧', phrase: 'Washed out, almost white',    isReal: true },
      { id: 'light_monday',   emoji: '😌', phrase: "Monday's easier cousin",      isReal: false, trapType: 'almostSynonym' },
      { id: 'light_green',    emoji: '🟢', phrase: 'Green means go',              isReal: false, trapType: 'domainNeighbor' },
      { id: 'light_gentle',   emoji: '🌬️', phrase: 'A gentle kind of force',      isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // STEP 2 — STRIKE (Standard, flow)
  {
    kind: 'word',
    word: 'STRIKE',
    emotionalRole: 'flow',
    eventType: 'standard',
    tileStagger: 80,
    pollyLine: 'Same word. Very different days.',
    meanings: [],
    hiddenMeaning:   'What prospectors prayed for',
    hiddenTrap:      "Sky's electrical signature",
    hiddenEmoji:     '⛏️',
    hiddenTrapEmoji: '⚡',
    masks: [
      { id: 'strike_fist',      emoji: '👊', phrase: 'Fist finds its target',           isReal: true },
      { id: 'strike_workers',   emoji: '🪧', phrase: 'Workers walk out',                isReal: true },
      { id: 'strike_bowling',   emoji: '🎳', phrase: 'All ten, one ball',               isReal: true },
      { id: 'strike_lands',     emoji: '💥', phrase: 'Lands differently than expected', isReal: true },
      { id: 'strike_planes',    emoji: '💣', phrase: 'Planes arriving uninvited',        isReal: false, trapType: 'domainNeighbor' },
      { id: 'strike_lightning', emoji: '🌩️', phrase: 'Where lightning touches down',    isReal: false, trapType: 'visualNeighbor' },
      { id: 'strike_pitcher',   emoji: '⚾', phrase: "A pitcher's moment of truth",     isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // STEP 3 — SPRING (Boss, tension)
  {
    kind: 'word',
    word: 'SPRING',
    emotionalRole: 'tension',
    eventType: 'bossWord',
    tileStagger: 100,
    bossModifier: 'reverseMountOrder',
    pollyLine: 'Boss word. More meanings. Same clock.',
    meanings: [],
    hiddenMeaning:   "A hull's bad morning",
    hiddenTrap:      'What beds hide inside',
    hiddenEmoji:     '⛵',
    hiddenTrapEmoji: '🛏️',
    masks: [
      { id: 'spring_coil',    emoji: '🔩', phrase: 'Bouncy metal squiggle',     isReal: true },
      { id: 'spring_jump',    emoji: '🤸', phrase: 'Launched from a crouch',    isReal: true },
      { id: 'spring_water',   emoji: '💦', phrase: 'Bubbling up from nowhere',  isReal: true },
      { id: 'spring_season',  emoji: '☃️', phrase: 'What snowmen dread most',   isReal: true },
      { id: 'spring_thaw',    emoji: '🌤️', phrase: "The thaw's first exhale",   isReal: false, trapType: 'domainNeighbor' },
      { id: 'spring_rabbit',  emoji: '🐇', phrase: "A rabbit's getaway move",   isReal: false, trapType: 'associatedNeighbor' },
      { id: 'spring_blossom', emoji: '🌺', phrase: 'When cherry blossoms fall', isReal: false, trapType: 'visualNeighbor' },
      { id: 'spring_trap',    emoji: '🐭', phrase: "A mousetrap's big moment",  isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 4 — COLD (Switchback, brainGlitch)
  // After resolve: 1500ms Polly buffer → "Back to meanings. Stay sharp."
  {
    kind: 'switchback',
    emotionalRole: 'brainGlitch',
    eventType: 'switchback',
    switchbackId: 'switchback_cold',
    clue1: { emoji: '🥶', text: 'Left out on purpose' },
    clue2: { emoji: '🤒', text: "Fever's uninvited guest" },
    answers: [
      { word: 'COLD',  correct: true  },
      { word: 'WARM',  correct: false },
      { word: 'SICK',  correct: false },
      { word: 'CHILL', correct: false },
    ],
    pollyReveal: 'Same word. Two completely different bad days.',
    pollyLine:   'Same word. Two completely different bad days.',
    pollyBufferDelay: 1500,
    pollyBufferLine:  'Back to meanings. Stay sharp.',
  },

  // STEP 5 — PITCH (Standard, hesitation)
  {
    kind: 'word',
    word: 'PITCH',
    emotionalRole: 'hesitation',
    eventType: 'standard',
    tileStagger: 80,
    pollyLine: 'Four meanings. One word. Pick carefully.',
    meanings: [],
    hiddenMeaning:   "A roof's steepest secret",
    hiddenTrap:      "A thrower's signature move",
    hiddenEmoji:     '📐',
    hiddenTrapEmoji: '🥎',
    masks: [
      { id: 'pitch_note',     emoji: '🎵', phrase: "A note's altitude",          isReal: true },
      { id: 'pitch_sales',    emoji: '💼', phrase: 'Where the sales begin',      isReal: true },
      { id: 'pitch_grass',    emoji: '⚽', phrase: 'British grass, match-ready', isReal: true },
      { id: 'pitch_black',    emoji: '🖤', phrase: 'Blacker than black itself',  isReal: true },
      { id: 'pitch_darkness', emoji: '🌑', phrase: 'What darkness is called',    isReal: false, trapType: 'almostSynonym' },
      { id: 'pitch_tent',     emoji: '⛺', phrase: "A tent's founding moment",   isReal: false, trapType: 'domainNeighbor' },
      { id: 'pitch_mound',    emoji: '🏟️', phrase: "The mound's main character", isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 6 — PHRASE BREAK: "Give it a shot" (recovery)
  {
    kind: 'phraseBreak',
    emotionalRole: 'recovery',
    eventType: 'phraseBreak',
    phrase: 'Give it a shot',
    question: 'Which of these capture its meaning?',
    answers: [
      { text: 'Try it once',   correct: true  },
      { text: 'Take a chance', correct: true  },
      { text: 'Pour a drink',  correct: false },
      { text: 'Aim carefully', correct: false },
    ],
    pollyReveal: 'From firearms to slang — one word, four lives.',
    pollyLine:   'One word. Four journeys.',
  },

  // STEP 7 — BANK (Standard, freshness)
  {
    kind: 'word',
    word: 'BANK',
    emotionalRole: 'freshness',
    eventType: 'standard',
    tileStagger: 80,
    pollyLine: 'Not just where money lives.',
    meanings: [],
    hiddenMeaning:   'What lighthouses argue with',
    hiddenTrap:      'Guarded by serious steel',
    hiddenEmoji:     '🌫️',
    hiddenTrapEmoji: '🔒',
    masks: [
      { id: 'bank_tilt',     emoji: '✈️', phrase: 'Sky tilted on purpose',             isReal: true },
      { id: 'bank_frozen',   emoji: '🧊', phrase: 'Frozen just in case',               isReal: true },
      { id: 'bank_river',    emoji: '🏞️', phrase: "A river's grassy edge",             isReal: true },
      { id: 'bank_money',    emoji: '🏦', phrase: 'Where your cash hibernates',        isReal: true },
      { id: 'bank_interest', emoji: '📈', phrase: 'Where interest quietly multiplies', isReal: false, trapType: 'almostSynonym' },
      { id: 'bank_cliff',    emoji: '🪨', phrase: 'Straight vertical drop',            isReal: false, trapType: 'domainNeighbor' },
      { id: 'bank_teller',   emoji: '💳', phrase: "A teller's long queue",             isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 8 — RAW (Slang Drop, culturalSnap) — NOW era
  // Tile order: traps first, slang real last
  {
    kind: 'word',
    word: 'RAW',
    emotionalRole: 'culturalSnap',
    eventType: 'slangDrop',
    slangEra: 'NOW',
    slangMaskId: 'raw_slang',
    tileStagger: 80,
    pollyLine: 'Same word. Different century.',
    meanings: [],
    masks: [
      { id: 'raw_uncooked', emoji: '🥩', phrase: 'Not yet cooked',        isReal: false, trapType: 'domainNeighbor' },
      { id: 'raw_tender',   emoji: '🤕', phrase: 'Tender to the touch',   isReal: false, trapType: 'associatedNeighbor' },
      { id: 'raw_exposed',  emoji: '🫣', phrase: 'Exposed and unguarded', isReal: false, trapType: 'almostSynonym' },
      { id: 'raw_slang',    emoji: '🔥', phrase: 'Uncut and electric',    isReal: true,  isSlang: true, era: 'modern' },
    ],
  },

  // STEP 9 — WAKE (Standard, surprise) — hapticTier: light
  {
    kind: 'word',
    word: 'WAKE',
    emotionalRole: 'surprise',
    eventType: 'standard',
    tileStagger: 80,
    hapticTier: 'light',
    pollyLine: 'Three meanings. One carries more weight.',
    meanings: [],
    hiddenMeaning:   'The mess nobody chose',
    hiddenTrap:      'Water that has opinions',
    hiddenEmoji:     '💧',
    hiddenTrapEmoji: '🌙',
    masks: [
      { id: 'wake_boat',    emoji: '🚢', phrase: "A boat's churned-up road",  isReal: true },
      { id: 'wake_funeral', emoji: '🪦', phrase: 'Goodbye before the ground', isReal: true },
      { id: 'wake_dawn',    emoji: '🌄', phrase: 'Eyelids lifting at dawn',   isReal: true },
      { id: 'wake_alarm',   emoji: '⏰', phrase: "Alarm clocks' one purpose", isReal: false, trapType: 'almostSynonym' },
      { id: 'wake_snooze',  emoji: '😴', phrase: 'Nine more minutes, always', isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wake_river',   emoji: '🌊', phrase: "A river's gentle push",     isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 10 — MATCH (Standard, adrenaline)
  {
    kind: 'word',
    word: 'MATCH',
    emotionalRole: 'adrenaline',
    eventType: 'standard',
    tileStagger: 60,
    pollyLine: 'One of these is ancient history.',
    meanings: [],
    hiddenMeaning:   'Slow-burning battle cord',
    hiddenTrap:      "Your reflection's nod back",
    hiddenEmoji:     '🧨',
    hiddenTrapEmoji: '🪞',
    masks: [
      { id: 'match_rivals',  emoji: '⚔️', phrase: 'Where rivals settle things',    isReal: true },
      { id: 'match_flame',   emoji: '🪔', phrase: 'One scratch, instant light',    isReal: true },
      { id: 'match_pair',    emoji: '🤝', phrase: 'Two people, one verdict',       isReal: true },
      { id: 'match_copy',    emoji: '🧩', phrase: 'Identical by accident',         isReal: true },
      { id: 'match_tie',     emoji: '🎯', phrase: "The scoreboard's awkward tie",  isReal: false, trapType: 'almostSynonym' },
      { id: 'match_trophy',  emoji: '🏅', phrase: "A winner's permanent record",   isReal: false, trapType: 'domainNeighbor' },
      { id: 'match_sticks',  emoji: '🎋', phrase: 'Little sticks, big ambitions',  isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 11 — BARK (Standard, nearMiss)
  {
    kind: 'word',
    word: 'BARK',
    emotionalRole: 'nearMiss',
    eventType: 'standard',
    tileStagger: 80,
    pollyLine: "Don't rush. One of these bites.",
    meanings: [],
    hiddenMeaning:   "A doorframe's parting gift",
    hiddenTrap:      "A lemon's bitter coat",
    hiddenEmoji:     '🚪',
    hiddenTrapEmoji: '🍋',
    masks: [
      { id: 'bark_order', emoji: '🫵', phrase: "Boss's favorite verb",      isReal: true },
      { id: 'bark_tree',  emoji: '🌳', phrase: "A trunk's outer jacket",    isReal: true },
      { id: 'bark_dog',   emoji: '🐕', phrase: 'What startles the mailman', isReal: true },
      { id: 'bark_growl', emoji: '🐩', phrase: 'A low rumbling warning',    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bark_wolf',  emoji: '🐺', phrase: "A pack's night anthem",     isReal: false, trapType: 'domainNeighbor' },
      { id: 'bark_pie',   emoji: '🥧', phrase: 'Inside every apple pie',    isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 12 — ORDER (Boss, climax)
  {
    kind: 'word',
    word: 'ORDER',
    emotionalRole: 'climax',
    eventType: 'bossWord',
    tileStagger: 80,
    bossModifier: 'reverseMountOrder',
    postSessionPollyDuration: 3000,
    pollyLine: "That's everything. Did any of those surprise you?",
    meanings: [],
    hiddenMeaning:   'Below class, above family',
    hiddenTrap:      "The bench's final document",
    hiddenEmoji:     '⛪',
    hiddenTrapEmoji: '🏛️',
    masks: [
      { id: 'order_monks',        emoji: '🧹', phrase: 'What monks answer to',              isReal: true },
      { id: 'order_command',      emoji: '🎖️', phrase: 'Said once, not twice',              isReal: true },
      { id: 'order_purchase',     emoji: '📬', phrase: 'Your choice made official',         isReal: true },
      { id: 'order_arrange',      emoji: '🗂️', phrase: 'Chaos cleaned up',                  isReal: true },
      { id: 'order_court',        emoji: '⚖️', phrase: "A judge's last ruling",            isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_queue',        emoji: '🛒', phrase: 'The British national pastime',      isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_instructions', emoji: '📋', phrase: 'The instructions, page one',        isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_checklist',    emoji: '🔄', phrase: 'Everything ticked, nothing missed', isReal: false, trapType: 'almostSynonym' },
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
