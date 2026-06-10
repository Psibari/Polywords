import { SessionStep } from './types';

export const SESSION: SessionStep[] = [

  // STEP 1 — LIGHT (confidence)
  {
    kind: 'word',
    word: 'LIGHT',
    emotionalRole: 'confidence',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'Where the bird rested',
    hiddenTrap:      'Green means go',
    hiddenEmoji:     '🌿',
    hiddenTrapEmoji: '🚦',
    masks: [
      { id: 'light_darkness', phrase: 'What darkness surrenders to', isReal: true },
      { id: 'light_weight',   phrase: 'Easy on the shoulders',       isReal: true },
      { id: 'light_wick',     phrase: 'Sets the wick going',          isReal: true },
      { id: 'light_pale',     phrase: 'Washed out, almost white',    isReal: true },
      { id: 'light_monday',   phrase: "Monday's easier cousin",      isReal: false, trapType: 'almostSynonym' },
      { id: 'light_gentle',   phrase: 'A gentle kind of force',      isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // STEP 2 — BARK (flow)
  {
    kind: 'word',
    word: 'BARK',
    emotionalRole: 'flow',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'A small sailing vessel',
    hiddenTrap:      "A lemon's bitter coat",
    hiddenEmoji:     '⛵',
    hiddenTrapEmoji: '🍋',
    masks: [
      { id: 'bark_order', phrase: "Boss's favorite verb",      isReal: true },
      { id: 'bark_tree',  phrase: "A trunk's outer jacket",    isReal: true },
      { id: 'bark_dog',   phrase: 'What startles the mailman', isReal: true },
      { id: 'bark_growl', phrase: 'A low rumbling warning',    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bark_wolf',  phrase: "A pack's night anthem",     isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 3 — RING (firstTension)
  {
    kind: 'word',
    word: 'RING',
    emotionalRole: 'firstTension',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'Where the circus lives',
    hiddenTrap:      'A sound, not a shape',
    hiddenEmoji:     '🎪',
    hiddenTrapEmoji: '🔔',
    masks: [
      { id: 'ring_phone',   phrase: 'What your phone does',       isReal: true },
      { id: 'ring_jewelry', phrase: 'On the fourth finger',       isReal: true },
      { id: 'ring_boxing',  phrase: 'Where fighters earn it',     isReal: true },
      { id: 'ring_circle',  phrase: 'A perfect closed loop',      isReal: true },
      { id: 'ring_bell',    phrase: 'What bells do best',         isReal: false, trapType: 'almostSynonym' },
      { id: 'ring_round',   phrase: 'Goes around, comes around',  isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // STEP 4 — MATCH (escalation)
  {
    kind: 'word',
    word: 'MATCH',
    emotionalRole: 'escalation',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'Slow-burning battle cord',
    hiddenTrap:      "Your reflection's nod back",
    hiddenEmoji:     '🧨',
    hiddenTrapEmoji: '🪞',
    masks: [
      { id: 'match_rivals', phrase: 'Where rivals settle things',   isReal: true },
      { id: 'match_flame',  phrase: 'One scratch, instant light',   isReal: true },
      { id: 'match_pair',   phrase: 'Two things, one verdict',      isReal: true },
      { id: 'match_copy',   phrase: 'Identical by accident',        isReal: true },
      { id: 'match_tie',    phrase: "The scoreboard's awkward tie", isReal: false, trapType: 'almostSynonym' },
      { id: 'match_trophy', phrase: "A winner's permanent record",  isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 5 — RAW (freshness)
  {
    kind: 'word',
    word: 'RAW',
    emotionalRole: 'freshness',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    slangEra: 'NOW',
    slangMaskId: 'raw_slang',
    meanings: [],
    hiddenMeaning:   'Unprocessed footage',
    hiddenTrap:      'Barely above freezing',
    hiddenEmoji:     '🎬',
    hiddenTrapEmoji: '🥶',
    masks: [
      { id: 'raw_uncooked', phrase: 'Not yet cooked',            isReal: true },
      { id: 'raw_tender',   phrase: 'Tender to the touch',       isReal: true },
      { id: 'raw_exposed',  phrase: 'Exposed and unguarded',     isReal: true },
      { id: 'raw_slang',    phrase: 'Uncut and electric',        isReal: true, isSlang: true, era: 'modern' },
      { id: 'raw_frozen',   phrase: 'Barely above freezing',     isReal: false, trapType: 'associatedNeighbor' },
      { id: 'raw_wild',     phrase: 'Untamed, not domesticated', isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // STEP 6 — BEAR (hesitation)
  {
    kind: 'word',
    word: 'BEAR',
    emotionalRole: 'hesitation',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'The market that eats portfolios',
    hiddenTrap:      'Heavy and hard to lift',
    hiddenEmoji:     '📉',
    hiddenTrapEmoji: '🏋️',
    masks: [
      { id: 'bear_animal',  phrase: 'Hibernates all winter',        isReal: true },
      { id: 'bear_carry',   phrase: 'Carry the whole weight',       isReal: true },
      { id: 'bear_endure',  phrase: 'Grit your teeth and take it',  isReal: true },
      { id: 'bear_produce', phrase: 'What fruit trees do',          isReal: true },
      { id: 'bear_growl',   phrase: 'Angry and showing it',         isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bear_heavy',   phrase: 'Too much to lift alone',       isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // STEP 7 — WAKE (tension)
  {
    kind: 'word',
    word: 'WAKE',
    emotionalRole: 'tension',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'The mess nobody chose',
    hiddenTrap:      'What tides leave behind',
    hiddenEmoji:     '💧',
    hiddenTrapEmoji: '🌊',
    masks: [
      { id: 'wake_boat',    phrase: "A boat's churned-up road",   isReal: true },
      { id: 'wake_funeral', phrase: 'Goodbye before the ground',  isReal: true },
      { id: 'wake_dawn',    phrase: 'Eyelids lifting at dawn',    isReal: true },
      { id: 'wake_alarm',   phrase: "Alarm clocks' one purpose",  isReal: false, trapType: 'almostSynonym' },
      { id: 'wake_snooze',  phrase: 'Nine more minutes, always',  isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wake_river',   phrase: "A river's gentle push",      isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 8 — PITCH (nearMiss)
  {
    kind: 'word',
    word: 'PITCH',
    emotionalRole: 'nearMiss',
    eventType: 'standard',
    difficulty: 'hard',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'Sailors sealed hulls with this',
    hiddenTrap:      "A thrower's signature move",
    hiddenEmoji:     '⛵',
    hiddenTrapEmoji: '🥎',
    masks: [
      { id: 'pitch_note',     phrase: "A note's altitude",          isReal: true },
      { id: 'pitch_sales',    phrase: 'Where the sales begin',      isReal: true },
      { id: 'pitch_grass',    phrase: 'British grass, match-ready', isReal: true },
      { id: 'pitch_black',    phrase: 'Blacker than black itself',  isReal: true },
      { id: 'pitch_darkness', phrase: 'Blackness made absolute',    isReal: false, trapType: 'almostSynonym' },
      { id: 'pitch_tent',     phrase: "A tent's founding moment",   isReal: false, trapType: 'domainNeighbor' },
      { id: 'pitch_mound',    phrase: "The mound's main character", isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 9 — PRESS (panic)
  {
    kind: 'word',
    word: 'PRESS',
    emotionalRole: 'panic',
    eventType: 'standard',
    difficulty: 'hard',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'A wardrobe essential',
    hiddenTrap:      "A journalist's notebook",
    hiddenEmoji:     '👔',
    hiddenTrapEmoji: '📓',
    masks: [
      { id: 'press_push',      phrase: 'Apply force to a button',     isReal: true },
      { id: 'press_media',     phrase: 'Reporters as a group',        isReal: true },
      { id: 'press_printing',  phrase: "Gutenberg's great machine",   isReal: true },
      { id: 'press_crowd',     phrase: 'The mob pushing forward',     isReal: true },
      { id: 'press_squeeze',   phrase: 'Juice it out by force',       isReal: true },
      { id: 'press_headline',  phrase: "Tomorrow's front page",       isReal: false, trapType: 'domainNeighbor' },
      { id: 'press_stress',    phrase: 'Weight on your shoulders',    isReal: false, trapType: 'almostSynonym' },
    ],
  },

  // STEP 10 — BANK (rebound)
  {
    kind: 'word',
    word: 'BANK',
    emotionalRole: 'rebound',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning:   'What lighthouses argue with',
    hiddenTrap:      'Guarded by serious steel',
    hiddenEmoji:     '🌫️',
    hiddenTrapEmoji: '🔒',
    masks: [
      { id: 'bank_tilt',     phrase: 'Sky tilted on purpose',          isReal: true },
      { id: 'bank_frozen',   phrase: 'Frozen just in case',            isReal: true },
      { id: 'bank_river',    phrase: "A river's grassy edge",          isReal: true },
      { id: 'bank_money',    phrase: 'Where your cash hibernates',     isReal: true },
      { id: 'bank_interest', phrase: 'Where interest quietly grows',   isReal: false, trapType: 'almostSynonym' },
      { id: 'bank_cliff',    phrase: 'Straight vertical drop',         isReal: false, trapType: 'domainNeighbor' },
      { id: 'bank_teller',   phrase: "A teller's long queue",          isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 11 — SPRING (firstBoss)
  {
    kind: 'word',
    word: 'SPRING',
    emotionalRole: 'firstBoss',
    eventType: 'bossWord',
    difficulty: 'hard',
    hapticTier: 'heavy',
    tileStagger: 120,
    bossModifier: true,
    meanings: [],
    hiddenMeaning:   "A mousetrap's big moment",
    hiddenTrap:      'A water source bubbling up',
    hiddenEmoji:     '🐭',
    hiddenTrapEmoji: '💦',
    masks: [
      { id: 'spring_coil',     phrase: 'Bouncy metal squiggle',    isReal: true },
      { id: 'spring_jump',     phrase: 'Launched from a crouch',   isReal: true },
      { id: 'spring_water',    phrase: 'Bubbling up from nowhere', isReal: true },
      { id: 'spring_season',   phrase: 'What snowmen dread most',  isReal: true },
      { id: 'spring_mattress', phrase: "A mattress's bounce",      isReal: false, trapType: 'almostSynonym' },
      { id: 'spring_rivers',   phrase: 'Where rivers begin',       isReal: false, trapType: 'domainNeighbor' },
      { id: 'spring_cage',     phrase: 'A cage door flying open',  isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 12 — ORDER (finalBoss)
  {
    kind: 'word',
    word: 'ORDER',
    emotionalRole: 'finalBoss',
    eventType: 'bossWord',
    difficulty: 'hard',
    hapticTier: 'heavy',
    tileStagger: 120,
    bossModifier: true,
    postSessionPollyDuration: 3000,
    pollyLine: 'I gave the ORDER first.',
    meanings: [],
    hiddenMeaning:   'Below class, above family',
    hiddenTrap:      "The bench's final word",
    hiddenEmoji:     '⛪',
    hiddenTrapEmoji: '🏛️',
    masks: [
      { id: 'order_monks',     phrase: 'What monks answer to',              isReal: true },
      { id: 'order_command',   phrase: 'Said once, not twice',              isReal: true },
      { id: 'order_purchase',  phrase: 'Your choice made official',         isReal: true },
      { id: 'order_arrange',   phrase: 'Chaos cleaned up',                  isReal: true },
      { id: 'order_court',     phrase: "A judge's last ruling",             isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_queue',     phrase: 'The British national pastime',      isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_blueprint', phrase: "An architect's master plan",        isReal: false, trapType: 'domainNeighbor' },
      { id: 'order_checklist', phrase: 'Everything ticked, nothing missed', isReal: false, trapType: 'almostSynonym' },
    ],
  },

];

export function getStep(index: number): SessionStep | null {
  return SESSION[index] ?? null;
}

export function getTotalSteps(): number {
  return SESSION.length;
}

export function isWordStep(step: SessionStep): step is import('./types').WordStep {
  return step.kind === 'word';
}

export function isPhraseBreak(step: SessionStep): step is import('./types').PhraseBreakStep {
  return step.kind === 'phraseBreak';
}

export function isSwitchbackStep(step: SessionStep): step is import('./types').SwitchbackStep {
  return step.kind === 'switchback';
}
