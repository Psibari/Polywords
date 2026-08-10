import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const PORT = Number(process.env.PORT) || 8787;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const SERVER_MOCK_MODE = process.env.MOCK_MODE === 'true';
const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, '../../..');
const writingStandardPath = path.join(repoRoot, 'docs', 'CONTENT_WRITING_STANDARD.md');
const legacyDataPath = path.join(repoRoot, 'assets', 'data', 'huntData.json');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

function sanitizeError(value) {
  return String(value || '')
    .replace(/x-api-key["':\s]+[^"',}\s]+/gi, 'x-api-key: [redacted]')
    .replace(/authorization["':\s]+bearer\s+[^"',}\s]+/gi, 'authorization: Bearer [redacted]')
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[redacted-api-key]')
    .slice(0, 600);
}

function ratingDefaults(word, meaning) {
  return {
    difficulty: word.profile.wordComplexity,
    snapStrength: meaning.snapStrength,
    trapSharpness: word.profile.trapSharpness,
    familiarity: meaning.familiarity,
    hiddenFairness: word.profile.hiddenFairness,
    phaseFit: [word.profile.recommendedPhase],
    reviewStatus: 'pending',
  };
}

function mockText(prefix, label, suffix) {
  const tokens = `${prefix} ${label} ${suffix}`
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 6);
  while (tokens.length < 2) tokens.push('MOMENT');
  return tokens.join(' ');
}

function createMockWord(word) {
  return {
    meanings: word.meanings.map(meaning => {
      const base = ratingDefaults(word, meaning);
      return {
        id: meaning.id,
        realMasks: [
          {
            id: `${meaning.id}.real.1`,
            text: mockText('FAMILIAR', meaning.label, 'MOMENT'),
            ...base,
          },
          {
            id: `${meaning.id}.real.2`,
            text: mockText('EVERYDAY', meaning.label, 'HANDLE'),
            ...base,
          },
        ],
        traps: [1, 2, 3].map((number, index) => ({
          id: `${meaning.id}.trap.${number}`,
          text: mockText(['NEARBY', 'SIMILAR', 'EXPECTED'][index], meaning.label, 'DISTRACTION'),
          ...base,
          trapStyle: ['neighbor', 'scene', 'result'][index],
          whyTempting: `Mock trap near ${meaning.label}`,
          baitMeaningId: meaning.id,
        })),
      };
    }),
  };
}

function generationContract(word, rerunTileIds) {
  return `
Generate copy for exactly one approved word inventory.

NON-NEGOTIABLE CONTRACT
- Do not add, delete, merge, rename, or reinterpret meanings.
- Return exactly 2 REAL masks and 3 traps for each supplied meaning.
- Preserve every supplied meaning ID.
- Store tile text in uppercase.
- Use only as many words as recognition needs; avoid padding/repetition.
- Every trap must include trapStyle, whyTempting, and the supplied baitMeaningId.
- Use only these trapStyle values: neighbor, scene, tool, result, phrase, sound-confusion,
  almost-synonym, sequence, category, family.
- Ratings are integers 1-5. phaseFit contains only confidence, flow, tension, panic, or boss.
- reviewStatus is always "pending".
- Stable IDs use: MEANING_ID.real.1, MEANING_ID.real.2, and
  MEANING_ID.trap.1 through MEANING_ID.trap.3.
- Return JSON only, with this shape:
{"meanings":[{"id":"MEANING_ID","realMasks":[{"id":"","text":"","difficulty":3,
"snapStrength":3,"trapSharpness":3,"familiarity":3,"hiddenFairness":3,
"phaseFit":["flow"],"reviewStatus":"pending"}],"traps":[{"id":"","text":"",
"difficulty":3,"snapStrength":3,"trapSharpness":3,"familiarity":3,
"hiddenFairness":3,"phaseFit":["flow"],"reviewStatus":"pending",
"trapStyle":"neighbor","whyTempting":"","baitMeaningId":"MEANING_ID"}]}]}

${rerunTileIds?.length
    ? `SURGICAL RERUN: Rewrite only these rejected tile IDs: ${rerunTileIds.join(', ')}.
Return the complete structure, but keep all other supplied tile text unchanged.`
    : 'INITIAL DRAFT: Generate the complete word bank.'}

APPROVED WORD INVENTORY
${JSON.stringify(word)}
`;
}

async function parseModelJson(raw) {
  const clean = String(raw || '').replace(/```json\s*|\s*```/g, '').trim();
  return JSON.parse(clean);
}

async function callProvider({ selectedProvider, system, userPrompt, temperature, maxTokens = 8000 }) {
  if (selectedProvider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!response.ok) {
      const error = new Error(`OpenAI API ${response.status}`);
      error.status = response.status;
      error.detail = sanitizeError(await response.text());
      throw error;
    }
    const data = await response.json();
    return parseModelJson(data.choices?.[0]?.message?.content);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!response.ok) {
    const error = new Error(`Anthropic API ${response.status}`);
    error.status = response.status;
    error.detail = sanitizeError(await response.text());
    throw error;
  }
  const data = await response.json();
  return parseModelJson(data.content?.[0]?.text);
}

function mockMeaningInventory(word, legacyRow) {
  const sourceUrl = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word.toLowerCase())}`;
  const realCandidates = (legacyRow?.masks || []).filter(mask => mask.isReal);
  const meanings = realCandidates.map((mask, index) => ({
    id: `${word.toLowerCase()}.meaning.${index + 1}`,
    label: mask.phrase,
    definition: `PROVISIONAL LEGACY MEANING CANDIDATE: ${mask.phrase}`,
    source: { name: 'MERRIAM-WEBSTER — VERIFY THIS ENTRY', url: sourceUrl },
    familiarity: 3,
    snapStrength: index === 0 ? 2 : 3,
    visibility: 'ordinary',
    approved: false,
    realMasks: [],
    traps: [],
  }));
  if (legacyRow?.gpsTag === 'boss' && legacyRow.hiddenMeaning) {
    meanings.push({
      id: `${word.toLowerCase()}.meaning.hidden`,
      label: legacyRow.hiddenMeaning,
      definition: `PROVISIONAL BOSS-HIDDEN CANDIDATE: ${legacyRow.hiddenMeaning}`,
      source: { name: 'MERRIAM-WEBSTER — VERIFY THIS ENTRY', url: sourceUrl },
      familiarity: 2,
      snapStrength: 5,
      visibility: 'boss-hidden',
      approved: false,
      realMasks: [],
      traps: [],
    });
  }
  return { meanings };
}

app.get('/api/source-words', async (_req, res) => {
  try {
    const data = JSON.parse(await readFile(legacyDataPath, 'utf8'));
    const words = Object.entries(data).map(([word, row]) => ({
      word,
      difficulty: row.difficulty,
      gpsTag: row.gpsTag,
      legacyRealCount: row.masks.filter(mask => mask.isReal).length,
      legacyTrapCount: row.masks.filter(mask => !mask.isReal).length,
    }));
    res.json({ words });
  } catch (error) {
    res.status(500).json({ error: sanitizeError(error.message) });
  }
});

app.get('/api/writing-standard', async (_req, res) => {
  try {
    res.type('text/plain').send(await readFile(writingStandardPath, 'utf8'));
  } catch (error) {
    res.status(500).json({ error: sanitizeError(error.message) });
  }
});

app.post('/api/research-meanings', async (req, res) => {
  const {
    word,
    phase,
    provider = 'anthropic',
    mockMode = false,
    creativity = 'balanced',
    temperature = 0.45,
    tweakNotes = '',
  } = req.body || {};
  const upperWord = String(word || '').trim().toUpperCase();
  if (!upperWord) return res.status(400).json({ error: 'A word is required.' });

  try {
    const legacyData = JSON.parse(await readFile(legacyDataPath, 'utf8'));
    const legacyRow = legacyData[upperWord];
    if (!legacyRow) return res.status(404).json({ error: `${upperWord} is not in huntData.json.` });
    if (mockMode || SERVER_MOCK_MODE) {
      return res.json({
        inventory: mockMeaningInventory(upperWord, legacyRow),
        warning: 'Mock inventory uses provisional legacy candidates. Verify and edit before approval.',
      });
    }

    const selectedProvider = String(provider).toLowerCase() === 'openai' ? 'openai' : 'anthropic';
    if (selectedProvider === 'openai' && !process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY.' });
    }
    if (selectedProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY.' });
    }

    const standard = await readFile(writingStandardPath, 'utf8');
    const safeTemperature = Math.max(0.2, Math.min(0.7, Number(temperature) || 0.45));
    const sourceUrl = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(upperWord.toLowerCase())}`;
    const userPrompt = `
Research the strong playable meaning inventory for ${upperWord}. Do not write masks or traps.

REQUIREMENTS
- Include every strong, recognizable, genuinely distinct meaning family.
- Exclude duplicate senses, predictable grammatical variations, specialist trivia, and weak associations.
- Treat the legacy content only as candidate evidence; it may be incomplete or wrong.
- Use stable IDs in the form ${upperWord.toLowerCase()}.meaning.SLUG.
- Set approved to false and leave realMasks and traps empty.
- Ordinary meanings use visibility "ordinary".
- Only a boss-phase word may include one "boss-hidden" meaning, and it must be rare but fair.
- familiarity and snapStrength are integers 1-5.
- Use this source URL for every candidate: ${sourceUrl}
- Use source name "MERRIAM-WEBSTER — HUMAN VERIFICATION REQUIRED".
- Definitions must describe the actual sense plainly so a human can verify it.
- Never claim the source was checked by the model. Human approval is still required.
- Return JSON only:
{"meanings":[{"id":"","label":"","definition":"","source":{"name":"","url":""},
"familiarity":3,"snapStrength":3,"visibility":"ordinary","approved":false,
"realMasks":[],"traps":[]}]}

Recommended phase: ${phase || legacyRow.gpsTag}
Tweak notes: ${String(tweakNotes).trim() || 'none'}
Legacy candidates:
${JSON.stringify(legacyRow)}
`;
    const inventory = await callProvider({
      selectedProvider,
      system: standard,
      userPrompt,
      temperature: safeTemperature,
      maxTokens: 5000,
    });
    return res.json({ inventory });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: sanitizeError(error.message),
      detail: error.detail,
    });
  }
});

app.post('/api/rewrite-word', async (req, res) => {
  const {
    word,
    provider = 'anthropic',
    mockMode = false,
    creativity = 'balanced',
    temperature = 0.75,
    tweakNotes = '',
    rerunTileIds = [],
  } = req.body || {};

  if (!word || !Array.isArray(word.meanings) || !word.meanings.length) {
    return res.status(400).json({ error: 'One word with an approved meaning inventory is required.' });
  }
  const inventoryReady = word.meanings.every(meaning =>
    meaning.approved === true &&
    meaning.id &&
    meaning.label &&
    meaning.definition &&
    meaning.source?.name &&
    /^https?:\/\//i.test(meaning.source?.url || ''),
  );
  if (!inventoryReady) {
    return res.status(400).json({ error: 'Every meaning requires definition, source evidence, and approval.' });
  }

  if (mockMode || SERVER_MOCK_MODE) {
    return res.json({ word: createMockWord(word), warning: 'Local mock mode enabled.' });
  }

  const selectedProvider = String(provider).toLowerCase() === 'openai' ? 'openai' : 'anthropic';
  if (selectedProvider === 'openai' && !process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY.' });
  }
  if (selectedProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY.' });
  }

  try {
    const standard = await readFile(writingStandardPath, 'utf8');
    const safeTemperature = Math.max(0.2, Math.min(1, Number(temperature) || 0.75));
    const userPrompt = [
      `Creativity: ${creativity}`,
      `Tweak notes: ${String(tweakNotes).trim() || 'none'}`,
      generationContract(word, rerunTileIds),
    ].join('\n\n');

    const parsed = await callProvider({
      selectedProvider,
      system: standard,
      userPrompt,
      temperature: safeTemperature,
    });
    return res.json({ word: parsed });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: sanitizeError(error.message),
      detail: error.detail,
    });
  }
});

app.listen(PORT, () => {
  console.log(`POLYWORDS content workflow server running on http://localhost:${PORT}`);
});
