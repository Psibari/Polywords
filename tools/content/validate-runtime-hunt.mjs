import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { validateRuntimeHuntData } from './runtimeHuntValidation.mjs';

// Baseline only for the current live bank. These are known debt discovered by
// the new gate and must stay visible until the editorial/data pass resolves
// them. Exact-string matching means any new blocker still fails CI.
const KNOWN_LIVE_DEBT = new Set([
  'FAST: wordType 9-MEANING does not match 8 REAL masks (8-MEANING)',
  'FOAM: at least 3 trap masks are required',
  'FOLD: at least 3 trap masks are required',
  'FOOT: wordType 12-MEANING does not match 11 REAL masks (11-MEANING)',
  'CASE: difficulty must be easy, medium, or hard',
  'CUT: difficulty must be easy, medium, or hard',
  'DRIVE: difficulty must be easy, medium, or hard',
  'HOLD: difficulty must be easy, medium, or hard',
  'ROUND: difficulty must be easy, medium, or hard',
  'SET: difficulty must be easy, medium, or hard',
]);

function usage() {
  return [
    'Usage:',
    '  npm.cmd run content:preflight -- --input <candidate.json> [--structural-only] [--allow-known-live-debt] [--json]',
    '',
    'The command is read-only. --structural-only permits incomplete content batches while',
    'still reporting the remaining launch-supply requirements.',
  ].join('\n');
}
function parseArgs(args) {
  const options = { input: '', structuralOnly: false, allowKnownLiveDebt: false, json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') options.input = args[++index] ?? '';
    else if (arg === '--structural-only') options.structuralOnly = true;
    else if (arg === '--allow-known-live-debt') options.allowKnownLiveDebt = true;
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
    const validation = validateRuntimeHuntData(data);
    const knownDebt = options.allowKnownLiveDebt
      ? validation.blockers.filter(item => KNOWN_LIVE_DEBT.has(item))
      : [];
    const blockers = options.allowKnownLiveDebt
      ? validation.blockers.filter(item => !KNOWN_LIVE_DEBT.has(item))
      : validation.blockers;
    const report = {
      input: inputPath,
      sha256: fingerprint,
      mode: options.structuralOnly ? 'structural-only' : 'launch',
      ...validation,
      blockers,
      knownDebt,
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
      printList('New structural blockers', report.blockers);
      printList('Known live debt (visible, temporarily baselined)', report.knownDebt);
      printList('Launch blockers', report.launchBlockers);
      printList('Warnings', report.warnings);
      printList('Editorial review queue', report.editorialReview);
      console.log('Editorial approval: required. Review findings are heuristic flags, not automatic writing failures or permission to rewrite approved copy.');
    }

    if (failed) process.exitCode = 1;
  } catch (error) {
    console.error(`Content preflight could not run: ${error.message}`);
    process.exitCode = 2;
  }
}
