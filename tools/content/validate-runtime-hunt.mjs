import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { validateRuntimeHuntData } from './runtimeHuntValidation.mjs';

function usage() {
  return [
    'Usage:',
    '  npm.cmd run content:preflight -- --input <candidate.json> [--structural-only] [--json]',
    '',
    'The command is read-only. --structural-only permits incomplete content batches while',
    'still reporting the remaining launch-supply requirements.',
  ].join('\n');
}
function parseArgs(args) {
  const options = { input: '', structuralOnly: false, json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') options.input = args[++index] ?? '';
    else if (arg === '--structural-only') options.structuralOnly = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function printList(label, items) {
  console.log(`${label} (${items.length})`);
  if (!items.length) console.log('  none');
  else for (const item of items) console.log(`  - ${item}`);
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exitCode = 2;
}

if (options && (options.help || !options.input)) {
  console.log(usage());
  if (!options.help) process.exitCode = 2;
} else if (options) {
  try {
    const inputPath = path.resolve(options.input);
    const raw = await readFile(inputPath);
    const fingerprint = createHash('sha256').update(raw).digest('hex');
    const data = JSON.parse(raw.toString('utf8'));
    const report = {
      input: inputPath,
      sha256: fingerprint,
      mode: options.structuralOnly ? 'structural-only' : 'launch',
      ...validateRuntimeHuntData(data),
      editorialApprovalRequired: true,
    };
    const failed = report.blockers.length > 0 ||
      (!options.structuralOnly && report.launchBlockers.length > 0);

    if (options.json) {
      console.log(JSON.stringify({ ...report, passed: !failed }, null, 2));
    } else {
      console.log(`POLYWORDS runtime content preflight: ${failed ? 'FAILED' : 'PASSED'}`);
      console.log(`Input: ${report.input}`);
      console.log(`SHA-256: ${report.sha256}`);
      console.log(`Mode: ${report.mode}`);
      console.log(`Supply: ${report.summary.words} words, ${report.summary.masks} masks, ${report.summary.hiddenPairs} hidden pairs`);
      console.log(`Phases: ${Object.entries(report.summary.byPhase).map(([phase, count]) => `${phase}=${count}`).join(', ')}`);
      printList('Structural blockers', report.blockers);
      printList('Launch blockers', report.launchBlockers);
      printList('Warnings', report.warnings);
      console.log('Editorial approval: still required; this gate cannot prove truth, voice, sourcing, or legal trap fairness.');
    }

    if (failed) process.exitCode = 1;
  } catch (error) {
    console.error(`Content preflight could not run: ${error.message}`);
    process.exitCode = 2;
  }
}
