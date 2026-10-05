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
const APPROVED_HEADWORD_LEAKS = new Map([
  ['FAST/fast_r04', 'WHAT YOU BREAK WHEN YOU BREAK FAST'],
]);

// These words carry little or no memory-snap information by themselves. The
// review heuristic intentionally ignores them so connective English does not
// turn the report into a landfill fire.
const EDITORIAL_STOPWORDS = new Set([
  'A', 'AN', 'AND', 'ARE', 'AS', 'AT', 'BE', 'BEEN', 'BEFORE', 'BEING', 'BETWEEN',
  'BY', 'CAN', 'DO', 'DOES', 'FOR', 'FROM', 'GET', 'GETS', 'GOT', 'HAD', 'HAS',
  'HAVE', 'HE', 'HER', 'HIM', 'HIS', 'HOW', 'I', 'IN', 'INTO', 'IS', 'IT', 'ITS',
  'JUST', 'LIKE', 'MORE', 'NOT', 'OF', 'OFF', 'ON', 'ONE', 'OR', 'OUT', 'OVER',
  'SHE', 'SO', 'SOME', 'THAN', 'THAT', 'THE', 'THEIR', 'THEM', 'THEN', 'THERE',
  'THESE', 'THEY', 'THIS', 'THOSE', 'THROUGH', 'TO', 'UP', 'WAS', 'WE', 'WERE',
  'WHAT', 'WHEN', 'WHERE', 'WHICH', 'WHO', 'WHY', 'WITH', 'WITHOUT', 'YOU', 'YOUR',
]);

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

function editorialStem(token) {
  if (token.length <= 4) return token;
  if (token.endsWith('IES') && token.length > 5) return `${token.slice(0, -3)}Y`;
  if (token.endsWith('ING') && token.length > 6) return token.slice(0, -3).replace(/(.)\1$/, '$1');
  if (token.endsWith('ED') && token.length > 5) return token.slice(0, -2).replace(/(.)\1$/, '$1');
  if (token.endsWith('ER') && token.length > 5) return token.slice(0, -2).replace(/(.)\1$/, '$1');
  if (token.endsWith('ES') && token.length > 5) return token.slice(0, -2);
  if (token.endsWith('S') && !token.endsWith('SS') && token.length > 4) return token.slice(0, -1);
  return token;
}

function editorialTokens(value) {
  return new Set(
    normalizePhrase(value)
      .split(/\s+/)
      .filter(token => token && !EDITORIAL_STOPWORDS.has(token) && !/^\d+$/.test(token))
      .map(editorialStem)
      .filter(token => token.length >= 3),
  );
}

function sharedTokens(left, right) {
  return [...left].filter(token => right.has(token)).sort();
}

function jaccard(left, right) {
  const shared = sharedTokens(left, right).length;
  const union = new Set([...left, ...right]).size;
  return union ? shared / union : 0;
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

function validatePhrase(
  value,
  context,
  wordForms,
  phraseOwners,
  blockers,
  editorialReview,
  headwordLeakKey = null,
) {
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
  const approvedLeak =
    headwordLeakKey != null && APPROVED_HEADWORD_LEAKS.get(headwordLeakKey) === phrase;
  if (approvedLeak) {
    editorialReview.push(`approved headword-leak exception requires human re-review: ${headwordLeakKey} — ${phrase}`);
  } else if (tokens.some(token => wordForms.has(token))) {
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

function buildEditorialReview(records, editorialReview) {
  const byWord = new Map();
  for (const record of records) {
    const group = byWord.get(record.word) ?? { reals: [], traps: [] };
    (record.role === 'REAL' ? group.reals : group.traps).push(record);
    byWord.set(record.word, group);
  }

  for (const [word, group] of byWord) {
    for (const real of group.reals) {
      for (const trap of group.traps) {
        const shared = sharedTokens(real.tokens, trap.tokens);
        const suspicious = shared.length >= 2 ||
          (shared.length === 1 && shared[0].length >= 6);
        if (!suspicious) continue;
        editorialReview.push(
          `same-headword REAL/trap overlap: ${word}/${real.id} ↔ ${word}/${trap.id}; shared=${shared.join(', ')}; REAL="${real.phrase}"; TRAP="${trap.phrase}"`,
        );
      }
    }
  }

  // Exact duplicates are already structural blockers. This pass catches only
  // strong near-duplicates across different headwords and leaves judgment to
  // the editorial review rather than pretending lexical similarity proves a
  // writing violation.
  for (let leftIndex = 0; leftIndex < records.length; leftIndex += 1) {
    const left = records[leftIndex];
    if (left.tokens.size < 3) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < records.length; rightIndex += 1) {
      const right = records[rightIndex];
      if (left.word === right.word || right.tokens.size < 3) continue;
      const shared = sharedTokens(left.tokens, right.tokens);
      if (shared.length < 3) continue;
      const similarity = jaccard(left.tokens, right.tokens);
      if (similarity < 0.72) continue;
      editorialReview.push(
        `cross-headword near-duplicate: ${left.word}/${left.id} ↔ ${right.word}/${right.id}; similarity=${similarity.toFixed(2)}; shared=${shared.join(', ')}; A="${left.phrase}"; B="${right.phrase}"`,
      );
    }
  }
}

export function validateRuntimeHuntData(data) {
  const blockers = [];
  const launchBlockers = [];
  const warnings = [];
  const editorialReview = [];
  const contentRecords = [];
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
    return { blockers, launchBlockers, warnings, editorialReview, summary };
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
        validatePhrase(
          mask.phrase,
          maskContext,
          wordForms,
          phraseOwners,
          blockers,
          editorialReview,
          `${word}/${id}`,
        );
        if (typeof mask.phrase === 'string' && mask.phrase.trim() && typeof mask.isReal === 'boolean') {
          contentRecords.push({
            word,
            id: id || `mask[${index}]`,
            role: mask.isReal ? 'REAL' : 'TRAP',
            phrase: mask.phrase.trim(),
            tokens: editorialTokens(mask.phrase),
          });
        }
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
        validatePhrase(pair.real, `${pairContext}/real`, wordForms, phraseOwners, blockers, editorialReview);
        validatePhrase(pair.trap, `${pairContext}/trap`, wordForms, phraseOwners, blockers, editorialReview);
        if (typeof pair.real === 'string' && pair.real.trim()) {
          contentRecords.push({ word, id: `${pairId || `hidden[${index}]`}:real`, role: 'REAL', phrase: pair.real.trim(), tokens: editorialTokens(pair.real) });
        }
        if (typeof pair.trap === 'string' && pair.trap.trim()) {
          contentRecords.push({ word, id: `${pairId || `hidden[${index}]`}:trap`, role: 'TRAP', phrase: pair.trap.trim(), tokens: editorialTokens(pair.trap) });
        }
        if (normalizePhrase(pair.real) && normalizePhrase(pair.real) === normalizePhrase(pair.trap)) {
          blockers.push(`${pairContext}: hidden REAL and trap cannot be identical`);
        }
        const lengthDelta = Math.abs(countWords(pair.real) - countWords(pair.trap));
        if (lengthDelta > 2) {
          warnings.push(`${pairContext}: REAL/trap length differs by ${lengthDelta} words; review Hidden Truth parity`);
        }
      }
    } else if (hiddenPairs.length > 0 || nonemptyLegacyHidden(entry)) {
      blockers.push(`${context}: non-boss words cannot contain hidden gauntlet content`);
    }
  }

  buildEditorialReview(contentRecords, editorialReview);

  if (summary.words < 110) {
    launchBlockers.push(`launch supply: ${summary.words}/110 runtime words`);
  }
  for (const [phase, minimum] of Object.entries(LAUNCH_PHASE_MINIMUMS)) {
    if (byPhase[phase] < minimum) {
      launchBlockers.push(`launch supply: ${phase} has ${byPhase[phase]}/${minimum} required words`);
    }
  }

  return { blockers, launchBlockers, warnings, editorialReview, summary };
}
