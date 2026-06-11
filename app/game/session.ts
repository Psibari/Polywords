import { SessionStep } from './types';

export const SESSION: SessionStep[] = [

  // ─── HUNT 1 ───────────────────────────────────────────────────────────────
  // ARC: Confidence x2 -> Flow x3 -> Tension x3 -> Panic x3 -> Boss x1

  // 1 — WAVE (Confidence)
  {
    kind: 'word',
    word: 'WAVE',
    emotionalRole: 'confidence',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'Stadium crowd ripple',
    hiddenTrap:    'Sea breeze arrives',
    masks: [
      { id: 'wave_hand',       phrase: 'Goodbye and hello',           isReal: true  },
      { id: 'wave_surfer',     phrase: "Surfer's perfect ride",        isReal: true  },
      { id: 'wave_panic',      phrase: 'Panic rolls through everyone', isReal: true  },
      { id: 'wave_summer',     phrase: "Summer's hottest week",        isReal: true  },
      { id: 'wave_tide',       phrase: "Tide's highs and lows",        isReal: false },
      { id: 'wave_gent',       phrase: "Gentleman's nod",              isReal: false },
      { id: 'wave_foam',       phrase: 'Foam on the shore',            isReal: false },
    ],
  },

  // 2 — FINE (Confidence)
  {
    kind: 'word',
    word: 'FINE',
    emotionalRole: 'confidence',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'Not a cloud above',
    hiddenTrap:    'Top of the class',
    masks: [
      { id: 'fine_soso',       phrase: "So-so, it'll do",    isReal: true  },
      { id: 'fine_courthouse', phrase: 'Courthouse payment', isReal: true  },
      { id: 'fine_thin',       phrase: 'Thinner than thread',isReal: true  },
      { id: 'fine_fivestar',   phrase: 'Five-star dining',   isReal: true  },
      { id: 'fine_officer',    phrase: 'Officer gives warning',isReal: false },
      { id: 'fine_silk',       phrase: 'Silk against skin',  isReal: false },
      { id: 'fine_perfect',    phrase: 'Perfect beyond doubt',isReal: false },
    ],
  },

  // 3 — CHARGE (Flow)
  {
    kind: 'word',
    word: 'CHARGE',
    emotionalRole: 'flow',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'Under the supervision of',
    hiddenTrap:    'Register drawer opens',
    masks: [
      { id: 'charge_phone',    phrase: 'Phones always need it',  isReal: true  },
      { id: 'charge_price',    phrase: 'Price gets added',       isReal: true  },
      { id: 'charge_sprint',   phrase: 'Aggressive sprint',      isReal: true  },
      { id: 'charge_court',    phrase: 'Must face in court',     isReal: true  },
      { id: 'charge_customer', phrase: 'Customer pays up',       isReal: false },
      { id: 'charge_lawyer',   phrase: 'Lawyer argues loudly',   isReal: false },
      { id: 'charge_battery',  phrase: 'Battery nearly full',    isReal: false },
    ],
  },

  // 4 — PLANT (Flow)
  {
    kind: 'word',
    word: 'PLANT',
    emotionalRole: 'flow',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'Placement of strategy',
    hiddenTrap:    'Grows toward light',
    masks: [
      { id: 'plant_water',     phrase: 'Best results when watered', isReal: true  },
      { id: 'plant_nuclear',   phrase: 'Nuclear factory floor',     isReal: true  },
      { id: 'plant_evidence',  phrase: 'Placed false evidence',     isReal: true  },
      { id: 'plant_seeds',     phrase: 'Seeds field for crops',     isReal: true  },
      { id: 'plant_roots',     phrase: 'Roots dig deep',            isReal: false },
      { id: 'plant_greenhouse',phrase: 'Greenhouse stays warm',     isReal: false },
      { id: 'plant_warehouse', phrase: 'Warehouse stores goods',    isReal: false },
    ],
  },

  // 5 — TABLE (Flow)
  {
    kind: 'word',
    word: 'TABLE',
    emotionalRole: 'brainGlitch',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: "Ping-pong's little court",
    hiddenTrap:    'Meeting gets cancelled',
    masks: [
      { id: 'table_elbows',    phrase: 'Elbows get judged here', isReal: true  },
      { id: 'table_multi',     phrase: 'Multiplication chart',   isReal: true  },
      { id: 'table_pushed',    phrase: 'Pushed to later',        isReal: true  },
      { id: 'table_nook',      phrase: 'Nook in kitchen',        isReal: false },
      { id: 'table_school',    phrase: "School's lunch room",    isReal: false },
      { id: 'table_agenda',    phrase: 'Agenda item skipped',    isReal: false },
    ],
  },

  // 6 — CAPITAL (Tension)
  {
    kind: 'word',
    word: 'CAPITAL',
    emotionalRole: 'firstTension',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: "Column's decorative crown",
    hiddenTrap:    'Mayor makes speech',
    masks: [
      { id: 'capital_states',  phrase: 'All states have one',        isReal: true  },
      { id: 'capital_money',   phrase: 'Money starts a business',    isReal: true  },
      { id: 'capital_letter',  phrase: 'First letter of names',      isReal: true  },
      { id: 'capital_punish',  phrase: 'Highest form of punishment', isReal: true  },
      { id: 'capital_capitol', phrase: 'Capitol dome energy',        isReal: false },
      { id: 'capital_invest',  phrase: 'Investor signs check',       isReal: false },
      { id: 'capital_writing', phrase: 'Writing looks careful',      isReal: false },
    ],
  },

  // 7 — SENTENCE (Tension)
  {
    kind: 'word',
    word: 'SENTENCE',
    emotionalRole: 'tension',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: "Logic's true-or-false unit",
    hiddenTrap:    'Written essay',
    masks: [
      { id: 'sentence_period',   phrase: 'Ends with a period',    isReal: true  },
      { id: 'sentence_criminal', phrase: 'Criminal consequence',  isReal: true  },
      { id: 'sentence_judge',    phrase: 'Judge hands down time', isReal: true  },
      { id: 'sentence_lawyer',   phrase: 'Lawyer leaves angry',   isReal: false },
      { id: 'sentence_comma',    phrase: 'Comma takes a breath',  isReal: false },
      { id: 'sentence_verdict',  phrase: 'Verdict still pending', isReal: false },
    ],
  },

  // 8 — SPELL (Tension)
  {
    kind: 'word',
    word: 'SPELL',
    emotionalRole: 'tension',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'Take the wheel awhile',
    hiddenTrap:    'Dark clouds gather',
    masks: [
      { id: 'spell_letters',  phrase: 'Letters fall in place', isReal: true  },
      { id: 'spell_cold',     phrase: 'Cold snap',             isReal: true  },
      { id: 'spell_wand',     phrase: 'Wand words do work',    isReal: true  },
      { id: 'spell_trouble',  phrase: 'Trouble knocks next',   isReal: true  },
      { id: 'spell_pencil',   phrase: 'Pencil writes slowly',  isReal: false },
      { id: 'spell_weekend',  phrase: 'Weekend feels long',    isReal: false },
      { id: 'spell_witch',    phrase: 'Witch needs her book',  isReal: false },
    ],
  },

  // 9 — DRAFT (Panic)
  {
    kind: 'word',
    word: 'DRAFT',
    emotionalRole: 'panic',
    eventType: 'standard',
    difficulty: 'hard',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'Heavy hauler breed',
    hiddenTrap:    'Rider mounts a stallion',
    masks: [
      { id: 'draft_rough',    phrase: 'Rough written version',    isReal: true  },
      { id: 'draft_window',   phrase: 'Window open feeling',      isReal: true  },
      { id: 'draft_service',  phrase: 'Forced into service',      isReal: true  },
      { id: 'draft_pub',      phrase: "Pub's beer option",        isReal: true  },
      { id: 'draft_polished', phrase: 'Polished copy sent',       isReal: false },
      { id: 'draft_curtains', phrase: 'Curtains start swaying',   isReal: false },
      { id: 'draft_recruit',  phrase: 'Recruitment office visit', isReal: false },
    ],
  },

  // 10 — RANK (Panic)
  {
    kind: 'word',
    word: 'RANK',
    emotionalRole: 'panic',
    eventType: 'standard',
    difficulty: 'hard',
    hapticTier: 'medium',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'One slip, whole drop',
    hiddenTrap:    'Fancy job title',
    masks: [
      { id: 'rank_general',  phrase: 'General above colonel',  isReal: true  },
      { id: 'rank_soldiers', phrase: 'Soldiers in a row',      isReal: true  },
      { id: 'rank_sun',      phrase: 'Left too long in sun',   isReal: true  },
      { id: 'rank_numbered', phrase: 'Numbered rating',        isReal: true  },
      { id: 'rank_queue',    phrase: 'Queue at checkout',      isReal: false },
      { id: 'rank_badge',    phrase: 'Badge on chest',         isReal: false },
      { id: 'rank_trophy',   phrase: 'Trophy on shelf',        isReal: false },
    ],
  },

  // 11 — SOUND (Panic)
  {
    kind: 'word',
    word: 'SOUND',
    emotionalRole: 'adrenaline',
    eventType: 'standard',
    difficulty: 'hard',
    hapticTier: 'heavy',
    tileStagger: 80,
    meanings: [],
    hiddenMeaning: 'Sleeping without stirring',
    hiddenTrap:    'Pillow swallows noise',
    masks: [
      { id: 'sound_silence', phrase: 'Breaks the silence',        isReal: true  },
      { id: 'sound_advice',  phrase: 'Great advice',              isReal: true  },
      { id: 'sound_islands', phrase: 'Water between islands',     isReal: true  },
      { id: 'sound_depth',   phrase: 'Depth checked by rope',     isReal: true  },
      { id: 'sound_volume',  phrase: 'Pump up the volume',        isReal: false },
      { id: 'sound_bridge',  phrase: 'Engineer fixes bridge',     isReal: false },
      { id: 'sound_boat',    phrase: 'Boat charts the path',      isReal: false },
    ],
  },

  // 12 — CAST (Boss)
  {
    kind: 'word',
    word: 'CAST',
    emotionalRole: 'finalBoss',
    eventType: 'bossWord',
    difficulty: 'hard',
    hapticTier: 'heavy',
    tileStagger: 120,
    bossModifier: true,
    postSessionPollyDuration: 3000,
    pollyLine: 'Every role. Already mine.',
    meanings: [],
    hiddenMeaning: 'Molten metal takes shape',
    hiddenTrap:    'Spell gets thrown on you',
    masks: [
      { id: 'cast_fishing',  phrase: 'Fishing line leaves hand', isReal: true  },
      { id: 'cast_voter',    phrase: 'One per voter',            isReal: true  },
      { id: 'cast_shadow',   phrase: 'Shadow clouds the wall',   isReal: true  },
      { id: 'cast_doubt',    phrase: 'Doubt lands on story',     isReal: true  },
      { id: 'cast_stage',    phrase: 'Everyone up on stage',     isReal: true  },
      { id: 'cast_armor',    phrase: 'Friends sign the armor',   isReal: true  },
      { id: 'cast_bait',     phrase: 'Bait lures the fish',      isReal: false },
      { id: 'cast_curtain',  phrase: 'Curtain falls slowly',     isReal: false },
      { id: 'cast_election', phrase: 'Election day tomorrow',    isReal: false },
    ],
  },

];

// ─── HAUNT WORD SWAP ─────────────────────────────────────────
// Inserts the first matching ghost word at index 9 (word 10, 1-based).
// Boss positions (indexes 10, 11) are never displaced.
export function buildRunSession(ghostWordIds: string[]): SessionStep[] {
  const sessionCopy: SessionStep[] = SESSION.map(step => ({ ...step }));
  if (ghostWordIds.length === 0) return sessionCopy;

  const HAUNT_INDEX = 9;
  let ghostOriginalIndex = -1;
  for (const wid of ghostWordIds) {
    const idx = sessionCopy.findIndex(
      s => s.kind === 'word' && s.word === wid && s.eventType !== 'bossWord'
    );
    if (idx !== -1) { ghostOriginalIndex = idx; break; }
  }
  if (ghostOriginalIndex === -1) return sessionCopy;

  if (ghostOriginalIndex === HAUNT_INDEX) {
    const step = sessionCopy[HAUNT_INDEX];
    if (step.kind === 'word') {
      sessionCopy[HAUNT_INDEX] = { ...step, isHauntReturn: true };
    }
  } else {
    const ghostStep = sessionCopy[ghostOriginalIndex];
    sessionCopy[ghostOriginalIndex] = { ...sessionCopy[HAUNT_INDEX] };
    sessionCopy[HAUNT_INDEX] = ghostStep.kind === 'word'
      ? { ...ghostStep, isHauntReturn: true }
      : { ...ghostStep };
  }
  return sessionCopy;
}

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
