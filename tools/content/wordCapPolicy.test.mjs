import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const governedFiles = [
  'docs/CONTENT_WRITING_STANDARD.md',
  'tools/content/runtimeHuntValidation.mjs',
  'tools/content/audit-hunt-data.mjs',
  'tools/content/mask-rewriter/src/contentWorkflow.js',
  'tools/content/mask-rewriter/server.js',
  'scripts/auditContent.ts',
  'app/game/dailyChallengeEngine.test.ts',
  'app/game/types.ts',
];

const forbiddenPatterns = [
  /eight words? (?:maximum|or fewer)/i,
  /8-word (?:hard )?maximum/i,
  /words? exceeds? the hard maximum/i,
  /max(?:imum)?\s*8/i,
  /never exceed\s+8\b/i,
  /\b\d+(?:-\d+)? words? max\b/i,
  /wordCount\s*>\s*8/,
  /countWords\([^)]*\)\s*>\s*8/,
  new RegExp('split\\(\\/\\\\s\\+\\/\\)\\.length\\s*<=\\s*8'),
  /one-word (?:phrase|tile).*(?:review|flat)/i,
  /word tile requires review/i,
];

for (const file of governedFiles) {
  const contents = await readFile(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(contents, pattern, `${file} must not enforce a word-count cap`);
  }
}

console.log('wordCapPolicy tests passed');
