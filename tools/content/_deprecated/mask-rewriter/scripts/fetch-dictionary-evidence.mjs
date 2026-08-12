import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../../../..');
const huntDataPath = path.join(repoRoot, 'assets/data/huntData.json');
const workspaceDir = path.join(repoRoot, 'tools/content/mask-rewriter/workspace');
const outputPath = path.join(workspaceDir, 'dictionary-evidence.json');
const dictionaryEndpoint = 'https://api.dictionaryapi.dev/api/v2/entries/en';

const huntData = JSON.parse(fs.readFileSync(huntDataPath, 'utf8'));
const words = Object.keys(huntData).sort();

fs.mkdirSync(workspaceDir, { recursive: true });

const existing = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, 'utf8'))
  : {
      schemaVersion: 1,
      editorialLocale: 'en-US',
      candidateSource: 'Free Dictionary API / Wiktionary',
      candidateSourceWarning: 'Discovery only. Reject British-only usage and verify approved meanings with an American-English source.',
      words: {},
    };

function compactEntry(entry) {
  return {
    sourceUrls: entry.sourceUrls || [],
    license: entry.license || null,
    meanings: (entry.meanings || []).map((meaning) => ({
      partOfSpeech: meaning.partOfSpeech,
      definitions: (meaning.definitions || []).map((definition) => ({
        definition: definition.definition,
        example: definition.example || null,
      })),
    })),
  };
}

function save() {
  existing.fetchedAt = new Date().toISOString();
  fs.writeFileSync(outputPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
}

async function fetchWithBackoff(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url);
    if (response.status !== 429) return response;
    const delayMs = 3000 * (attempt + 1);
    console.log(`Rate limited; waiting ${delayMs} ms before retry ${attempt + 1}/6`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return fetch(url);
}

for (const [index, word] of words.entries()) {
  if (existing.words[word]?.status === 'ok') continue;

  try {
    const response = await fetchWithBackoff(
      `${dictionaryEndpoint}/${encodeURIComponent(word.toLowerCase())}`,
    );
    if (response.status === 404) {
      existing.words[word] = {
        status: 'missing',
        httpStatus: response.status,
        americanSourceUrl: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word.toLowerCase())}`,
        candidateSourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}`,
      };
    } else if (!response.ok) {
      existing.words[word] = {
        status: 'error',
        httpStatus: response.status,
        americanSourceUrl: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word.toLowerCase())}`,
      };
    } else {
      const entries = await response.json();
      existing.words[word] = {
        status: 'ok',
        americanSourceUrl: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word.toLowerCase())}`,
        entries: entries.map(compactEntry),
      };
    }
  } catch (error) {
    existing.words[word] = { status: 'error', message: error.message };
  }

  save();
  console.log(`[${index + 1}/${words.length}] ${word}: ${existing.words[word].status}`);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

save();

const statuses = Object.values(existing.words).reduce((counts, record) => {
  counts[record.status] = (counts[record.status] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({ outputPath, words: words.length, statuses }, null, 2));
