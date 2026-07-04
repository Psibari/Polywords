import { SCHEMA_VERSION, validateBank } from './contentWorkflow.js';

export function mergeApprovedBanks(existing, incoming, replaceIds = []) {
  const existingCheck = validateBank(existing);
  if (existingCheck.blockers.length) {
    throw new Error(`Existing V2 bank is invalid:\n${existingCheck.blockers.join('\n')}`);
  }
  const incomingCheck = validateBank(incoming);
  if (incomingCheck.blockers.length) {
    throw new Error(`Incoming export is invalid:\n${incomingCheck.blockers.join('\n')}`);
  }

  const replace = new Set(replaceIds);
  const words = { ...existing.words };
  const added = [];
  const replaced = [];
  const unchanged = [];

  for (const [id, word] of Object.entries(incoming.words)) {
    if (!words[id]) {
      words[id] = word;
      added.push(id);
      continue;
    }
    if (JSON.stringify(words[id]) === JSON.stringify(word)) {
      unchanged.push(id);
      continue;
    }
    if (!replace.has(id) && !replace.has(word.word)) {
      throw new Error(`Refusing to overwrite ${word.word}; pass --replace ${word.word}`);
    }
    words[id] = word;
    replaced.push(id);
  }

  return {
    bank: { schemaVersion: SCHEMA_VERSION, words },
    summary: { added, replaced, unchanged },
  };
}
