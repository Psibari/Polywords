import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeApprovedBanks } from '../src/mergeV2.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../../..');
const targetPath = path.join(repoRoot, 'assets', 'data', 'huntData.v2.json');
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

const inputArg = valueAfter('--input');
const replaceArg = valueAfter('--replace') || '';
const dryRun = args.includes('--dry-run');

if (!inputArg) {
  console.error('Usage: npm.cmd run merge:v2 -- --input <approved-export.json> [--replace WORD,...] [--dry-run]');
  process.exitCode = 1;
} else {
  try {
    const inputPath = path.resolve(process.cwd(), inputArg);
    const existing = JSON.parse(await readFile(targetPath, 'utf8'));
    const incoming = JSON.parse(await readFile(inputPath, 'utf8'));
    const replaceIds = replaceArg.split(',').map(value => value.trim()).filter(Boolean);
    const result = mergeApprovedBanks(existing, incoming, replaceIds);
    console.log(JSON.stringify(result.summary, null, 2));
    if (dryRun) {
      console.log('Dry run only; huntData.v2.json was not changed.');
    } else {
      await writeFile(targetPath, `${JSON.stringify(result.bank, null, 2)}\n`, 'utf8');
      console.log(`Merged approved content into ${targetPath}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
