/**
 * Daily clue fit checker (Pete, 2026-11-12).
 *
 * Tells you whether a Daily clue fits the gate's plank in two lines, measured
 * exactly as the game draws it (Bebas Neue widths, the plank's box, the same
 * fitter). A clue that does not fit was drawn as tiny unreadable text on a
 * tester's phone, so the content test refuses it. Use this while writing.
 *
 *   npm run daily:fit -- "A BRIGHT STREAK THAT CAN STRIKE DURING A THUNDERSTORM"
 *   npm run daily:fit -- --xlsx "C:\Users\pdiba\Downloads\POLYWORDS_DAILY_NEW.xlsx"
 *   npm run daily:fit -- --file clues.txt          (one clue per line)
 *   npm run daily:fit -- --live                    (every clue in the game)
 *
 * Workbooks: every sheet is read; the header row is the one with a "Word"
 * cell and one or more cells starting with "Clue" (the Daily workbook's
 * "Clue 1 (Hardest)", "Clue 2", "Clue 3 (Easiest)"). A workbook without those
 * headers is reported, never guessed at.
 *
 * Exit code 1 when any clue does not fit.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { APPROVED_DAILY_POOL } from '../../app/game/dailyChallengeEngine';
import { DAILY_CLUE_CHAR_CAP, dailyClueFitReport } from '../../app/ui/dailyCastleScene';

type Entry = { label: string; clue: string };

function fromXlsx(path: string): Entry[] {
  const require = createRequire(import.meta.url);
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(path);
  const entries: Entry[] = [];
  let foundHeader = false;
  for (const sheetName of wb.SheetNames as string[]) {
    const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: true });
    const headerIndex = rows.findIndex(
      (row) =>
        row.some((cell) => String(cell ?? '').trim().toLowerCase() === 'word') &&
        row.some((cell) => /^clue/i.test(String(cell ?? '').trim())),
    );
    if (headerIndex < 0) continue;
    foundHeader = true;
    const header = rows[headerIndex].map((cell) => String(cell ?? '').trim());
    const wordCol = header.findIndex((cell) => cell.toLowerCase() === 'word');
    const clueCols = header
      .map((cell, index) => ({ cell, index }))
      .filter(({ cell }) => /^clue/i.test(cell));
    rows.slice(headerIndex + 1).forEach((row, offset) => {
      const word = String(row[wordCol] ?? '').trim();
      for (const { cell, index } of clueCols) {
        const clue = String(row[index] ?? '').trim();
        if (!clue) continue;
        const excelRow = headerIndex + offset + 2;
        entries.push({ label: `${sheetName} row ${excelRow} ${word || '(no word)'} / ${cell}`, clue });
      }
    });
  }
  if (!foundHeader) {
    throw new Error(
      `No sheet in ${path} has a header row with a "Word" cell and "Clue..." cells. ` +
        'Add those headers, or pass the clues with --file or as arguments.',
    );
  }
  return entries;
}

function collect(argv: string[]): Entry[] {
  const entries: Entry[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--xlsx') {
      entries.push(...fromXlsx(argv[++i]));
    } else if (arg === '--file') {
      readFileSync(argv[++i], 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((clue, index) => entries.push({ label: `line ${index + 1}`, clue }));
    } else if (arg === '--live') {
      for (const word of APPROVED_DAILY_POOL) {
        word.meanings.forEach((clue, index) => entries.push({ label: `${word.word} / clue ${index + 1}`, clue }));
      }
    } else {
      entries.push({ label: 'clue', clue: arg });
    }
  }
  return entries;
}

const entries = collect(process.argv.slice(2));
if (entries.length === 0) {
  console.log('Give a clue in quotes, --xlsx <workbook>, --file <text file> or --live.');
  process.exit(2);
}

let over = 0;
let longFits = 0;
for (const { label, clue } of entries) {
  const report = dailyClueFitReport(clue);
  if (!report.fits) {
    over += 1;
    console.log(`OVER  ${label}: ${report.chars} chars, ${report.overPercent.toFixed(1)}% too wide -> shorten\n      ${clue}`);
  } else if (report.chars > DAILY_CLUE_CHAR_CAP) {
    longFits += 1;
    console.log(`OK    ${label}: ${report.chars} chars (over the ${DAILY_CLUE_CHAR_CAP} cap but fits, ${report.size} pt)\n      ${clue}`);
  } else if (entries.length <= 10) {
    // A short list (clues typed in by hand): confirm every one, not just problems.
    console.log(`OK    ${label}: ${report.chars} chars, ${report.size} pt\n      ${clue}`);
  }
}
console.log(
  `\n${entries.length} clue(s) checked: ${over} do not fit, ${longFits} over ${DAILY_CLUE_CHAR_CAP} characters but fit, ` +
    `${entries.length - over - longFits} fine.`,
);
process.exit(over > 0 ? 1 : 0);
