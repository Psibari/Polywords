export const SCHEMA_VERSION = 2;

export const ARC_PHASES = ['confidence', 'flow', 'tension', 'panic', 'boss'];
export const PHASE_BUDGETS = {
  confidence: { real: 2, traps: 3 },
  flow: { real: 3, traps: 3 },
  tension: { real: 3, traps: 4 },
  panic: { real: 4, traps: 4 },
  boss: { real: 4, traps: 6 },
};

export const TRAP_STYLES = [
  'neighbor',
  'scene',
  'tool',
  'result',
  'phrase',
  'sound-confusion',
  'almost-synonym',
  'sequence',
  'category',
  'family',
];

export const PILOT_WORDS = [
  { word: 'ARROW', phase: 'confidence' },
  { word: 'DUCK', phase: 'confidence' },
  { word: 'NAIL', phase: 'confidence' },
  { word: 'MOUSE', phase: 'confidence' },
  { word: 'ADDRESS', phase: 'flow' },
  { word: 'ARMS', phase: 'flow' },
  { word: 'BASS', phase: 'flow' },
  { word: 'CRANE', phase: 'flow' },
  { word: 'ABSTRACT', phase: 'tension' },
  { word: 'BARK', phase: 'tension' },
  { word: 'BAT', phase: 'tension' },
  { word: 'BALANCE', phase: 'tension' },
  { word: 'DRAFT', phase: 'tension' },
  { word: 'FINE', phase: 'tension' },
  { word: 'BANK', phase: 'panic' },
  { word: 'BOW', phase: 'panic' },
  { word: 'SPRING', phase: 'panic' },
  { word: 'PITCH', phase: 'panic' },
  { word: 'EXTRACT', phase: 'boss' },
  { word: 'REVOLUTION', phase: 'boss' },
];

export const REVIEW_CHECKS = [
  'realMeaningsTrue',
  'meaningFamiliesDistinct',
  'trapsLegallyWrong',
  'wordingHuman',
  'noAnswerLeak',
  'noFakeObjectActing',
  'noRoleTell',
  'semanticSnapPresent',
  'sourcesVerified',
];

const WORD_TYPES = {
  1: 'Single',
  2: 'Double',
  3: 'Triple',
  4: 'Quadruple',
  5: 'Quintuple',
  6: 'Sextuple',
};

const FLAT_PATTERNS = [
  'a type of',
  'one of the',
  'the act of',
  'the process of',
  'a person who',
  'a thing that',
  'means',
  'definition of',
];

const STOP_WORDS = new Set([
  'A', 'AN', 'AND', 'ARE', 'AS', 'AT', 'BE', 'BEFORE', 'BY', 'FOR', 'FROM', 'IN', 'INTO',
  'IS', 'IT', 'OF', 'ON', 'OR', 'THE', 'THEIR', 'THIS', 'TO', 'UNDER', 'UP', 'WITH', 'YOUR',
]);

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

export function normalizePhrase(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordTypeForCount(count) {
  return WORD_TYPES[count] || `${count}-MEANING`;
}

export function createEmptyWord(word, phase) {
  const upperWord = String(word || '').trim().toUpperCase();
  return {
    id: slugify(upperWord),
    word: upperWord,
    editorialStatus: 'draft',
    wordType: 'Single',
    profile: {
      word: upperWord,
      realMeaningCount: 0,
      trapCount: 0,
      snapStrength: 3,
      trapSharpness: 3,
      hiddenFairness: 3,
      familiarity: 3,
      wordComplexity: 3,
      bossEligible: phase === 'boss',
      tutorialEligible: phase === 'confidence',
      pollyTauntPotential: 3,
      recommendedPhase: phase,
    },
    meanings: [],
    reviewChecklist: Object.fromEntries(REVIEW_CHECKS.map(key => [key, false])),
  };
}

export function synchronizeDerivedFields(word) {
  const meanings = Array.isArray(word.meanings) ? word.meanings : [];
  const ordinary = meanings.filter(meaning => meaning.visibility !== 'boss-hidden');
  const trapCount = meanings.reduce((sum, meaning) => sum + (meaning.traps?.length || 0), 0);
  return {
    ...word,
    wordType: wordTypeForCount(ordinary.length),
    profile: {
      ...word.profile,
      word: word.word,
      realMeaningCount: ordinary.length,
      trapCount,
    },
  };
}

function isRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function obviousWordForms(word) {
  const upper = normalizePhrase(word);
  const bases = new Set([upper]);
  if (upper.endsWith('S') && !upper.endsWith('SS') && upper.length > 3) {
    bases.add(upper.slice(0, -1));
  }
  const forms = new Set();
  for (const base of bases) {
    forms.add(base);
    forms.add(`${base}S`);
    forms.add(`${base}ES`);
    forms.add(`${base}ED`);
    forms.add(`${base}ING`);
    if (base.endsWith('E')) {
      forms.add(`${base.slice(0, -1)}ING`);
    }
    if (/[^AEIOU][AEIOU][^AEIOUWXY]$/.test(base)) {
      const last = base.at(-1);
      forms.add(`${base}${last}ED`);
      forms.add(`${base}${last}ING`);
    }
    if (/[^AEIOU]Y$/.test(base)) {
      forms.add(`${base.slice(0, -1)}IES`);
      forms.add(`${base.slice(0, -1)}IED`);
    }
  }
  return forms;
}

function contentTokens(text) {
  return [...new Set(
    normalizePhrase(text)
      .split(/\s+/)
      .filter(token => token.length > 2 && !STOP_WORDS.has(token)),
  )];
}

function validateTile(tile, context, ids, phrases, blockers, warnings) {
  const prefix = `${context.word}/${context.meaningId}/${context.kind}`;
  if (!tile || typeof tile !== 'object') {
    blockers.push(`${prefix}: tile is missing`);
    return;
  }
  if (!tile.id) blockers.push(`${prefix}: stable tile ID is required`);
  else if (ids.has(tile.id)) blockers.push(`${prefix}: duplicate tile ID ${tile.id}`);
  else ids.add(tile.id);

  const text = String(tile.text || '').trim();
  if (!text) blockers.push(`${prefix}: tile text is required`);
  if (text && text !== text.toUpperCase()) blockers.push(`${prefix}: tile text must be uppercase`);
  const wordCount = countWords(text);
  if (wordCount > 8) blockers.push(`${prefix}: tile exceeds the 8-word hard maximum`);
  else if (wordCount >= 7) warnings.push(`${prefix}: ${wordCount}-word tile requires review`);
  else if (wordCount < 2) warnings.push(`${prefix}: one-word tile may be too flat`);

  const normalized = normalizePhrase(text);
  if (normalized) {
    if (phrases.has(normalized)) blockers.push(`${prefix}: duplicate tile text`);
    else phrases.add(normalized);
    const tokens = normalized.split(/\s+/);
    if (tokens.some(token => context.wordForms.has(token))) {
      blockers.push(`${prefix}: tile leaks the headword or an obvious inflection`);
    }
    if (FLAT_PATTERNS.some(pattern => text.toLowerCase().includes(pattern))) {
      warnings.push(`${prefix}: possible flat dictionary phrasing`);
    }
  }

  for (const field of ['difficulty', 'snapStrength', 'trapSharpness', 'familiarity', 'hiddenFairness']) {
    if (!isRating(tile[field])) blockers.push(`${prefix}: ${field} must be a 1-5 rating`);
  }
  if (!Array.isArray(tile.phaseFit) || !tile.phaseFit.length ||
      tile.phaseFit.some(phase => !ARC_PHASES.includes(phase))) {
    blockers.push(`${prefix}: phaseFit must contain valid phases`);
  }

  if (!['pending', 'accepted', 'rejected'].includes(tile.reviewStatus)) {
    blockers.push(`${prefix}: reviewStatus must be pending, accepted, or rejected`);
  }

  if (context.kind === 'trap') {
    if (!TRAP_STYLES.includes(tile.trapStyle)) blockers.push(`${prefix}: invalid trapStyle`);
    if (!String(tile.whyTempting || '').trim()) blockers.push(`${prefix}: whyTempting is required`);
    if (tile.baitMeaningId !== context.meaningId) blockers.push(`${prefix}: baitMeaningId mismatch`);
  }
}

export function validateWord(rawWord) {
  const blockers = [];
  const warnings = [];
  if (!rawWord || typeof rawWord !== 'object') {
    return { blockers: ['Word record is missing'], warnings };
  }

  const word = synchronizeDerivedFields(rawWord);
  const upperWord = String(word.word || '').trim().toUpperCase();
  if (!upperWord) blockers.push('Word is required');
  if (word.word !== upperWord) blockers.push('Word must be uppercase');
  if (!word.id || word.id !== slugify(upperWord)) blockers.push('Word ID must be the stable word slug');
  if (!ARC_PHASES.includes(word.profile?.recommendedPhase)) blockers.push('Invalid recommended phase');

  for (const field of [
    'snapStrength', 'trapSharpness', 'hiddenFairness', 'familiarity',
    'wordComplexity', 'pollyTauntPotential',
  ]) {
    if (!isRating(word.profile?.[field])) blockers.push(`Profile ${field} must be a 1-5 rating`);
  }
  if (typeof word.profile?.bossEligible !== 'boolean') blockers.push('Profile bossEligible must be boolean');
  if (typeof word.profile?.tutorialEligible !== 'boolean') blockers.push('Profile tutorialEligible must be boolean');

  const meanings = Array.isArray(word.meanings) ? word.meanings : [];
  if (!meanings.length) blockers.push('At least one approved meaning is required');
  const meaningIds = new Set();
  const tileIds = new Set();
  const phrases = new Set();
  let hiddenCount = 0;

  for (const meaning of meanings) {
    const prefix = `${upperWord}/${meaning?.id || 'meaning'}`;
    if (!meaning?.id) blockers.push(`${prefix}: stable meaning ID is required`);
    else if (meaningIds.has(meaning.id)) blockers.push(`${prefix}: duplicate meaning ID`);
    else meaningIds.add(meaning.id);
    if (!String(meaning?.label || '').trim()) blockers.push(`${prefix}: meaning label is required`);
    if (!String(meaning?.definition || '').trim()) blockers.push(`${prefix}: definition is required`);
    if (!String(meaning?.source?.name || '').trim()) blockers.push(`${prefix}: source name is required`);
    if (!/^https?:\/\//i.test(String(meaning?.source?.url || ''))) {
      blockers.push(`${prefix}: source URL must use http or https`);
    }
    if (!isRating(meaning?.familiarity)) blockers.push(`${prefix}: familiarity must be 1-5`);
    if (!isRating(meaning?.snapStrength)) blockers.push(`${prefix}: snapStrength must be 1-5`);
    if (!['ordinary', 'boss-hidden'].includes(meaning?.visibility)) {
      blockers.push(`${prefix}: visibility must be ordinary or boss-hidden`);
    }
    if (meaning?.visibility === 'boss-hidden') hiddenCount++;
    if (meaning?.approved !== true) blockers.push(`${prefix}: meaning must be human-approved`);

    const realMasks = Array.isArray(meaning?.realMasks) ? meaning.realMasks : [];
    const traps = Array.isArray(meaning?.traps) ? meaning.traps : [];
    if (realMasks.length !== 2) blockers.push(`${prefix}: pilot requires exactly 2 real masks`);
    if (traps.length !== 3) blockers.push(`${prefix}: pilot requires exactly 3 traps`);
    const context = { word: upperWord, meaningId: meaning.id, wordForms: obviousWordForms(upperWord) };
    realMasks.forEach(tile => validateTile(tile, { ...context, kind: 'real' }, tileIds, phrases, blockers, warnings));
    traps.forEach(tile => validateTile(tile, { ...context, kind: 'trap' }, tileIds, phrases, blockers, warnings));
  }

  if (word.profile?.recommendedPhase === 'boss') {
    if (hiddenCount !== 1) blockers.push('Boss words require exactly one boss-hidden meaning');
  } else if (hiddenCount > 0) {
    blockers.push('Only boss words may contain a boss-hidden meaning');
  }

  const ordinaryCount = meanings.filter(meaning => meaning.visibility !== 'boss-hidden').length;
  const expectedWordType = wordTypeForCount(ordinaryCount);
  if (rawWord.wordType !== expectedWordType) blockers.push(`wordType must be ${expectedWordType}`);
  if (rawWord.profile?.realMeaningCount !== ordinaryCount) blockers.push('Profile realMeaningCount mismatch');
  const totalTraps = meanings.reduce((sum, meaning) => sum + (meaning.traps?.length || 0), 0);
  if (rawWord.profile?.trapCount !== totalTraps) blockers.push('Profile trapCount mismatch');

  const budget = PHASE_BUDGETS[word.profile?.recommendedPhase];
  if (budget) {
    if (ordinaryCount < budget.real) blockers.push(`Bank cannot supply ${budget.real} distinct visible REAL masks`);
    if (totalTraps < budget.traps) blockers.push(`Bank cannot supply ${budget.traps} visible traps`);
  }

  const allTiles = meanings.flatMap(meaning => [...(meaning.realMasks || []), ...(meaning.traps || [])]);
  const realLengths = meanings.flatMap(meaning => meaning.realMasks || []).map(tile => countWords(tile.text));
  const trapLengths = meanings.flatMap(meaning => meaning.traps || []).map(tile => countWords(tile.text));
  if (realLengths.length && trapLengths.length) {
    const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
    if (Math.abs(average(realLengths) - average(trapLengths)) >= 1) {
      warnings.push(`${upperWord}: REAL/trap length imbalance may reveal tile roles`);
    }
  }

  const tokenOwners = new Map();
  for (const tile of allTiles) {
    for (const token of contentTokens(tile.text)) {
      if (!tokenOwners.has(token)) tokenOwners.set(token, []);
      tokenOwners.get(token).push(tile.id);
    }
  }
  for (const [token, owners] of tokenOwners) {
    if (owners.length >= 3) warnings.push(`${upperWord}: repeated key word "${token}" across ${owners.length} tiles`);
  }

  return { word, blockers: [...new Set(blockers)], warnings: [...new Set(warnings)] };
}

export function canApproveWord(rawWord) {
  const result = validateWord(rawWord);
  const meanings = result.word?.meanings || [];
  const allTiles = meanings.flatMap(meaning => [...(meaning.realMasks || []), ...(meaning.traps || [])]);
  const checklistComplete = REVIEW_CHECKS.every(key => result.word?.reviewChecklist?.[key] === true);
  return {
    ...result,
    canApprove: result.blockers.length === 0 &&
      allTiles.length > 0 &&
      allTiles.every(tile => tile.reviewStatus === 'accepted') &&
      checklistComplete,
  };
}

export function validateBank(bank) {
  const blockers = [];
  const warnings = [];
  if (bank?.schemaVersion !== SCHEMA_VERSION) blockers.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!bank?.words || typeof bank.words !== 'object' || Array.isArray(bank.words)) {
    blockers.push('words must be an object keyed by stable word ID');
    return { blockers, warnings };
  }
  for (const [key, word] of Object.entries(bank.words)) {
    const result = canApproveWord(word);
    if (key !== word.id) blockers.push(`${key}: bank key must match word.id`);
    blockers.push(...result.blockers.map(issue => `${key}: ${issue}`));
    warnings.push(...result.warnings.map(issue => `${key}: ${issue}`));
    if (word.editorialStatus !== 'approved') blockers.push(`${key}: only approved words may enter V2`);
    if (!result.canApprove) blockers.push(`${key}: human checklist and tile acceptance must be complete`);
  }
  return { blockers, warnings };
}
