import fs from 'node:fs';

const sourcePath = 'assets/data/huntData.json';
const outputPath = 'docs/HUNT_DATA_REWRITE_REVIEW.md';
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const batches = [
  {
    title: 'Batch 001',
    words: [
      'BEAM', 'BEAR', 'BED', 'BLADE', 'BOLT', 'BOOT', 'BOTTOM', 'BOWL', 'BRIDGE',
      'CAN', 'CAPE', 'CHARACTER', 'CHARGE', 'CHEST', 'CHIP', 'CLOSE', 'CLUB',
      'COMPOUND', 'CONTENT',
    ],
  },
  {
    title: 'Batch 002',
    words: [
      'COPY', 'CORD', 'CORNER', 'COURT', 'CROWN', 'CRUST', 'CURRENT', 'DATE',
      'DIGEST', 'DIRECT', 'DISCHARGE', 'DISPATCH', 'DOCK', 'DOUBLE', 'DOWN',
      'DRAIN', 'DRIFT', 'DRILL', 'DROP',
    ],
  },
];

const lines = [
  '# POLYWORDS Rewrite Review',
  '',
  'Focused review of the completed editorial batches. These are current draft masks from',
  '`assets/data/huntData.json`; check every line for truth, hesitation, recognition, and human voice.',
  '',
  'Use:',
  '',
  '- `PASS` when the mask is playable as written.',
  '- `REWRITE` when the meaning is right but the wording is weak.',
  '- `ILLEGAL` when a REAL is not truly a meaning or a trap could be accepted as real.',
  '',
];

for (const batch of batches) {
  lines.push(`## ${batch.title}`, '');

  for (const word of batch.words) {
    const entry = data[word];
    if (!entry) throw new Error(`Missing word: ${word}`);

    lines.push(`### ${word}`, '', '**REAL masks**', '');
    for (const mask of entry.masks.filter((candidate) => candidate.isReal)) {
      lines.push(`- [ ] \`${mask.phrase}\`  _${mask.id}_`);
    }

    lines.push('', '**Trap masks**', '');
    for (const mask of entry.masks.filter((candidate) => !candidate.isReal)) {
      lines.push(`- [ ] \`${mask.phrase}\`  _${mask.id}_`);
    }

    lines.push('', '**Verdict:** PASS / REWRITE / ILLEGAL', '', '**Notes:**', '', '---', '');
  }
}

lines.push(
  '## Additional American-English correction',
  '',
  '### PITCH',
  '',
  '- [ ] `WHERE SOCCER SPENDS SATURDAY`  _pitch_r0_',
  '',
);

fs.writeFileSync(outputPath, `${lines.join('\n').trimEnd()}\n`, 'utf8');
console.log(JSON.stringify({
  outputPath,
  words: batches.reduce((total, batch) => total + batch.words.length, 0),
}, null, 2));
