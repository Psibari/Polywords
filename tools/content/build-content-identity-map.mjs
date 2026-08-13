function slugWord(word) {
  return String(word).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function nextId(word, kind, used) {
  const prefix = `${slugWord(word)}_${kind}`;
  const suffixes = [...used]
    .filter(id => id.startsWith(prefix))
    .map(id => Number(id.slice(prefix.length)))
    .filter(Number.isInteger);
  const index = suffixes.length ? Math.max(...suffixes) + 1 : 0;
  const id = `${prefix}${String(index).padStart(2, '0')}`;
  used.add(id);
  return id;
}

export function buildIdentityMap({ workbookRows, runtime, retiredIds = [] }) {
  const used = new Set(retiredIds);
  const entries = [];
  const exceptions = [];
  const matchedRuntimePairs = new Set();
  const assignedRuntimePairIds = new Map();
  for (const data of Object.values(runtime)) {
    for (const mask of data.masks ?? []) if (mask.id) used.add(mask.id);
    for (const pair of data.hiddenPairs ?? []) if (pair.id) used.add(pair.id);
  }
  for (const row of workbookRows) {
    const word = String(row.word ?? '').trim().toUpperCase();
    if (!word || !row.text) continue;
    const candidates = [];
    if (row.kind === 'r' || row.kind === 't') {
      for (const mask of runtime[word]?.masks ?? []) {
        if (mask.phrase === row.text && mask.isReal === (row.kind === 'r')) candidates.push(mask);
      }
    } else if (row.kind === 'h') {
      for (const [index, pair] of (runtime[word]?.hiddenPairs ?? []).entries()) {
        if (pair.real === row.text && pair.trap === row.pairedText) candidates.push({ ...pair, index });
      }
    }
    if (candidates.length > 1) {
      if (row.kind === 'h') {
        for (const candidate of candidates) matchedRuntimePairs.add(`${word}:${candidate.index}`);
      }
      exceptions.push({ type: 'ambiguous', word, kind: row.kind, text: row.text, matches: candidates.length });
      continue;
    }
    const runtimePairKey = row.kind === 'h' && candidates.length === 1 ? `${word}:${candidates[0].index}` : null;
    const id = row.id || candidates[0]?.id || (runtimePairKey ? assignedRuntimePairIds.get(runtimePairKey) : null) || nextId(word, row.kind, used);
    if (runtimePairKey) {
      matchedRuntimePairs.add(runtimePairKey);
      assignedRuntimePairIds.set(runtimePairKey, id);
    }
    used.add(id);
    entries.push({
      id, word, kind: row.kind, text: row.text,
      ...(row.pairedText ? { pairedText: row.pairedText } : {}),
      workbookLocation: row.workbookLocation,
      ...(candidates.length === 1 ? {
        runtimeLocation: row.runtimeLocation ?? (row.kind === 'h' ? `${word}.hiddenPairs[${candidates[0].index}]` : word),
      } : {}),
    });
  }
  for (const [word, data] of Object.entries(runtime)) {
    for (const [index, pair] of (data.hiddenPairs ?? []).entries()) {
      if (matchedRuntimePairs.has(`${word}:${index}`)) continue;
      const id = pair.id || nextId(word, 'h', used);
      used.add(id);
      entries.push({
        id,
        word,
        kind: 'h',
        text: pair.real,
        pairedText: pair.trap,
        workbookLocation: 'Hidden Pair Registry!NEW',
        runtimeLocation: `${word}.hiddenPairs[${index}]`,
      });
    }
  }
  return { entries, exceptions, retiredIds: [...retiredIds] };
}
