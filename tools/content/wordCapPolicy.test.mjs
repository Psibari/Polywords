import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import {
  discoverGovernedWordCapFiles,
  findAbsoluteWordCapFindings,
} from './wordCapPolicy.mjs';

const governedFiles = await discoverGovernedWordCapFiles(process.cwd());

for (const expected of [
  'docs/CONTENT_WRITING_STANDARD.md',
  'app/components/SwipeMask.tsx',
  'scripts/auditContent.ts',
  'tools/content/import-workbook.mjs',
  'tools/content/mask-rewriter/server.js',
  'tools/content/mask-rewriter/src/MaskRewriter.jsx',
]) {
  assert.ok(governedFiles.includes(expected), `discovery must govern new production file ${expected}`);
}

for (const excluded of [
  'app/components/tileTextLayout.test.ts',
  'tools/content/runtimeHuntValidation.test.mjs',
  'tools/content/mask-rewriter/tests/contentWorkflow.test.mjs',
  'tools/content/pacing-overrides.json',
  'tools/content/RUNTIME_CONTENT_PREFLIGHT.md',
]) {
  assert.equal(governedFiles.includes(excluded), false, `discovery must exclude ${excluded}`);
}

const capFixtures = [
  'const MAX_WORDS = 12;',
  'if (wordCount >= 16) rejectPhrase();',
  'if (words.length > 24) return false;',
  'if (countWords(candidate) <= 7) approve();',
  'if (12 < countWords(candidate)) rejectPhrase();',
  'Masks must use no more than 15 words.',
  'Keep every phrase at most 18 words.',
  'Never exceed 22 words in a REAL.',
  'Apply a 14-word maximum.',
  'Use 20 words max.',
  'Prefer 2-6 words for every trap.',
  'A preferred range is 3 to 12 words.',
  'Every tile has eight words maximum.',
  'A one-word phrase requires review.',
];

for (const source of capFixtures) {
  assert.ok(
    findAbsoluteWordCapFindings('fixture.ts', source).length > 0,
    `must detect arbitrary numeric word cap: ${source}`,
  );
}

const safeFixtures = [
  'const lengthDelta = Math.abs(countWords(pair.real) - countWords(pair.trap));\nif (lengthDelta > 2) warn();',
  'if (Math.abs(countWords(real) - countWords(trap)) > 2) warnAboutParity();',
  'const maxWidth = 320;',
  'const MAX_MASTERED_WORDS = 12;',
  'if (progress.masteredWords.length === 0) showEmptyState();',
  'console.log(`${words.length} headwords imported`);',
  'Uppercase player-facing text; there is no numeric word maximum.',
  'Prefer recognition and natural phrasing over mechanical symmetry.',
];

for (const source of safeFixtures) {
  assert.deepEqual(
    findAbsoluteWordCapFindings('safe-fixture.ts', source),
    [],
    `must not misclassify non-cap code or REAL/trap parity: ${source}`,
  );
}

const repositoryFindings = [];
for (const file of governedFiles) {
  const contents = await readFile(file, 'utf8');
  repositoryFindings.push(...findAbsoluteWordCapFindings(file, contents));
}

assert.deepEqual(
  repositoryFindings,
  [],
  `governed production files must not enforce numeric word caps:\n${repositoryFindings
    .map(finding => `${finding.file}:${finding.line} [${finding.rule}] ${finding.excerpt}`)
    .join('\n')}`,
);

console.log(`wordCapPolicy tests passed (${governedFiles.length} governed production files)`);
