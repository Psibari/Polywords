const PHASES = ['confidence', 'flow', 'tension', 'panic', 'boss'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LAUNCH_PHASE_MINIMUMS = {
  confidence: 2,
  flow: 2,
  tension: 3,
  panic: 2,
  boss: 10,
};
const WORD_TYPE_BY_REAL_COUNT = {
  1: 'Single',
  2: 'Double',
  3: 'Triple',
  4: 'Quadruple',
  5: 'Quintuple',
  6: 'Sextuple',
  7: 'Septuple',
};
const PLACEHOLDER_PATTERN = /\b(?:PLACEHOLDER|TODO|TBD|FIXME|TEST CONTENT)\b/i;

export function normalizePhrase(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(value) {
  return String(value ?? '').trim().split(/\s+/).filter(Boolean).length;
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
    if (base.endsWith('E')) forms.add(`${base.slice(0, -1)}ING`);
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

function validatePhrase(value, context, wordForms, phraseOwners, blockers) {
  const phrase = typeof value === 'string' ? value.trim() : '';
  if (!phrase) {
    blockers.push(`${context}: phrase is required`);
    return;
  }
  if (phrase !== phrase.toUpperCase()) {
    blockers.push(`${context}: phrase must be uppercase`);
  }
  if (PLACEHOLDER_PATTERN.test(phrase)) {
    blockers.push(`${context}: placeholder text is not shippable`);
  }

  const normalized = normalizePhrase(phrase);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.some(token => wordForms.has(token))) {
    blockers.push(`${context}: phrase leaks the headword or an obvious inflection`);
  }

  const previousOwner = phraseOwners.get(normalized);
  if (previousOwner) {
    blockers.push(`${context}: duplicate phrase also used by ${previousOwner}`);
  } else {
    phraseOwners.set(normalized, context);
  }
}

function nonemptyLegacyHidden(entry) {
  return [entry.hiddenMeaning, entry.hiddenTrap]
    .some(value => typeof value === 'string' ? value.trim().length > 0 : value != null);
}

export function validateRuntimeHuntData(data) {
  const blockers = [];
  const launchBlockers = [];
  const warnings = [];
  const byPhase = Object.fromEntries(PHASES.map(phase => [phase, 0]));
  const summary = {
    words: 0,
    masks: 0,
    hiddenPairs: 0,
    realMasks: 0,
    trapMasks: 0,
    byPhase,
  };

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    blockers.push('root: expected a word-keyed object');
    return { blockers, launchBlockers, warnings, summary };
  }

  const entries = Object.entries(data);
  summary.words = entries.length;
  if (!entries.length) blockers.push('root: at least one word is required');

  const ids = new Map();
  const phraseOwners = new Map();

  for (const [word, entry] of entries) {
    const context = word || '<empty-word>';
    if (!word || word !== word.toUpperCase() || normalizePhrase(word) !== word) {
      blockers.push(`${context}: word key must be nonempty uppercase letters or numbers separated by spaces`);
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      blockers.push(`${context}: entry must be an object`);
      continue;
    }

    const wordForms = obviousWordForms(word);
    if (!DIFFICULTIES.includes(entry.difficulty)) {
      blockers.push(`${context}: difficulty must be easy, medium, or hard`);
    }
    if (!PHASES.includes(entry.gpsTag)) {
      blockers.push(`${context}: gpsTag must be ${PHASES.join(', ')}`);
    } else {
      byPhase[entry.gpsTag] += 1;
    }

    const masks = Array.isArray(entry.masks) ? entry.masks : null;
    if (!masks) {
      blockers.push(`${context}: masks must be an array`);
    } else {
      summary.masks += masks.length;
      if (masks.length < 5) {
        blockers.push(`${context}: at least 5 masks are required for the live tile cap`);
      }

      let realCount = 0;
      let trapCount = 0;
      for (let index = 0; index < masks.length; index += 1) {
        const mask = masks[index];
        const maskContext = `${context}/mask[${index}]`;
        if (!mask || typeof mask !== 'object' || Array.isArray(mask)) {
          blockers.push(`${maskContext}: mask must be an object`);
          continue;
        }

        const id = typeof mask.id === 'string' ? mask.id.trim() : '';
        if (!id) {
          blockers.push(`${maskContext}: stable mask ID is required`);
        } else if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) {
          blockers.push(`${maskContext}: mask ID may contain only letters, numbers, underscores, and hyphens`);
        } else if (ids.has(id)) {
          blockers.push(`${maskContext}: duplicate mask ID also used by ${ids.get(id)}`);
        } else {
          ids.set(id, maskContext);
        }

        if (typeof mask.isReal !== 'boolean') {
          blockers.push(`${maskContext}: isReal must be boolean`);
        } else if (mask.isReal) {
          realCount += 1;
        } else {
          trapCount += 1;
        }
        validatePhrase(mask.phrase, maskContext, wordForms, phraseOwners, blockers);
      }

      summary.realMasks += realCount;
      summary.trapMasks += trapCount;
      if (realCount < 2) blockers.push(`${context}: at least 2 REAL masks are required`);
      if (trapCount < 3) blockers.push(`${context}: at least 3 trap masks are required`);

      if (entry.wordType != null) {
        const expectedWordType = WORD_TYPE_BY_REAL_COUNT[realCount] ?? `${realCount}-MEANING`;
        if (entry.wordType !== expectedWordType) {
          blockers.push(`${context}: wordType ${entry.wordType} does not match ${realCount} REAL masks (${expectedWordType})`);
        }
      }
    }

    if (entry.hiddenPairs != null && !Array.isArray(entry.hiddenPairs)) {
      blockers.push(`${context}: hiddenPairs must be an array or null`);
    }
    const hiddenPairs = Array.isArray(entry.hiddenPairs) ? entry.hiddenPairs : [];
    if (entry.gpsTag === 'boss') {
      if (nonemptyLegacyHidden(entry)) {
        blockers.push(`${context}: legacy hiddenMeaning/hiddenTrap must be null or absent when hiddenPairs are used`);
      }
      if (!Array.isArray(entry.hiddenPairs) || hiddenPairs.length !== 3) {
        blockers.push(`${context}: boss words require exactly 3 hiddenPairs for the Route C gauntlet`);
      }
      summary.hiddenPairs += hiddenPairs.length;
      for (let index = 0; index < hiddenPairs.length; index += 1) {
        const pair = hiddenPairs[index];
        const pairContext = `${context}/hiddenPairs[${index}]`;
        if (!pair || typeof pair !== 'object' || Array.isArray(pair)) {
          blockers.push(`${pairContext}: hidden pair must be an object`);
          continue;
        }
        const pairId = typeof pair.id === 'string' ? pair.id.trim() : '';
        const wordPrefix = word.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!pairId) {
          blockers.push(`${pairContext}: missing hidden pair ID`);
        } else if (!/^[a-z0-9-]+_h\d+$/.test(pairId)) {
          blockers.push(`${pairContext}: malformed hidden pair ID`);
        } else if (!pairId.startsWith(`${wordPrefix}_h`)) {
          blockers.push(`${pairContext}: hidden pair ID has the wrong word prefix`);
        } else if (ids.has(pairId)) {
          blockers.push(`${pairContext}: duplicate content ID also used by ${ids.get(pairId)}`);
        } else {
          ids.set(pairId, pairContext);
        }
        validatePhrase(pair.real, `${pairContext}/real`, wordForms, phraseOwners, blockers);
        validatePhrase(pair.trap, `${pairContext}/trap`, wordForms, phraseOwners, blockers);
        if (normalizePhrase(pair.real) && normalizePhrase(pair.real) === normalizePhrase(pair.trap)) {
          blockers.push(`${pairContext}: hidden REAL and trap cannot be identical`);
        }
        const lengthDelta = Math.abs(countWords(pair.real) - countWords(pair.trap));
        if (lengthDelta > 2) {
          warnings.push(`${pairContext}: REAL/trap length differs by ${lengthDelta} words; review Hidden Truth parity`);
        }
      }
    } else {
      if (hiddenPairs.length > 0 || nonemptyLegacyHidden(entry)) {
        blockers.push(`${context}: non-boss words cannot contain hidden gauntlet content`);
      }
    }
  }

  if (summary.words < 110) {
    launchBlockers.push(`launch supply: ${summary.words}/110 runtime words`);
  }
  for (const [phase, minimum] of Object.entries(LAUNCH_PHASE_MINIMUMS)) {
    if (byPhase[phase] < minimum) {
      launchBlockers.push(`launch supply: ${phase} has ${byPhase[phase]}/${minimum} required words`);
    }
  }

  return { blockers, launchBlockers, warnings, summary };
}
