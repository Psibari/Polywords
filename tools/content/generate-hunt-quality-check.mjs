import fs from 'node:fs';

const sourcePath = 'assets/data/huntData.json';
const outputPath = 'docs/HUNT_DATA_400_WORD_QUALITY_CHECK.md';
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const words = Object.entries(data);
const lines = [];
const code = (value) => `\`${value}\``;
const sampleWords = [
  'ARROW',
  'DUCK',
  'ADDRESS',
  'ARMS',
  'ABSTRACT',
  'BARK',
  'BAT',
  'BANK',
  'BOW',
  'EXTRACT',
  'NAIL',
  'MOUSE',
  'BASS',
  'CRANE',
  'BALANCE',
  'DRAFT',
  'FINE',
  'PITCH',
  'SPRING',
];

lines.push(
  '# POLYWORDS HuntData — 400-Word Quality Check',
  '',
  `Generated from ${code(sourcePath)}. This is an offline editorial review sheet, not a gameplay data source. Make final corrections in ${code('huntData.json')}.`,
  '',
  '## Review standard',
  '',
  'Review every tile and word against the current canonical standard.',
  '',
  'Mask, trap, REAL, tile length, tone, and giveaway-root rules are governed by `docs/CONTENT_WRITING_STANDARD.md`. Do not duplicate or override those rules here.',
  '',
  'This sheet is a review aid, not source evidence. Legacy JSON does not become approved until its meaning inventory has named sources and human sign-off.',
  '',
  '## Masked voice sample',
  '',
  ...sampleWords.map((word, index) => `${index + 1}. ${word}`),
  '',
  '## Review progress',
  '',
  '- [ ] All 400 words reviewed',
  '- [ ] Every REAL legally true',
  '- [ ] Every trap legally wrong',
  '- [ ] Hidden Truth parity checked',
  `- [ ] Final corrections copied into ${code('huntData.json')}`,
  '',
  '---',
  '',
);

words.forEach(([word, entry], index) => {
  const reals = entry.masks.filter((mask) => mask.isReal);
  const traps = entry.masks.filter((mask) => !mask.isReal);

  lines.push(
    `## ${String(index + 1).padStart(3, '0')}. ${word}`,
    '',
    `**Difficulty:** ${entry.difficulty}  `,
    `**Word type:** ${entry.wordType}  `,
    `**REAL count:** ${reals.length}  `,
    `**Trap count:** ${traps.length}`,
    '',
    '### REAL masks',
    '',
    ...reals.map((mask) => `- [ ] ${code(mask.phrase)} — ${code(mask.id)}`),
    '',
    '### Trap masks',
    '',
    ...traps.map((mask) => `- [ ] ${code(mask.phrase)} — ${code(mask.id)}`),
  );

  if (entry.hiddenMeaning || entry.hiddenTrap) {
    lines.push('', '### Boss-hidden content', '');
    if (entry.hiddenMeaning) lines.push(`- [ ] Hidden REAL — ${code(entry.hiddenMeaning)}`);
    if (entry.hiddenTrap) lines.push(`- [ ] Hidden trap — ${code(entry.hiddenTrap)}`);
  }

  lines.push(
    '',
    '### Word approval',
    '',
    '- [ ] Meaning inventory is sourced and approved',
    '- [ ] REAL meanings are true and distinct',
    '- [ ] REALs are masked handles, not shortened definitions',
    '- [ ] Traps are wrong, fair, and tempting',
    '- [ ] Wording sounds human without canned symmetry or fake acting',
    '- [ ] REAL/trap presentation has no role tell',
    '- [ ] At least one meaning creates a Semantic Snap',
    '- [ ] **WORD APPROVED**',
    '',
    '**Notes / corrections:**  ',
    '',
    '',
    '---',
    '',
  );
});

fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

console.log(JSON.stringify({
  outputPath,
  words: words.length,
  tiles: words.reduce((count, [, entry]) => count + entry.masks.length, 0),
}, null, 2));
