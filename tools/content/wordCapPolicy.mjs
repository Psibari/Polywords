import { readdir } from 'node:fs/promises';
import path from 'node:path';

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const GOVERNED_ROOTS = ['app', 'scripts', 'tools/content'];
const EXCLUDED_DIRECTORY_NAMES = new Set([
  '.git',
  'assets',
  'build',
  'coverage',
  'data',
  'dist',
  'fixtures',
  'generated',
  'localworkbooks',
  'node_modules',
  'snapshots',
  'tests',
  'vendor',
  '__tests__',
]);

const CAP_PATTERNS = [
  {
    rule: 'numeric max-words constant',
    pattern: /\b(?:MAX_WORDS|MAX_(?:PHRASE|MASK|TILE|REAL|TRAP|COPY)_WORDS|(?:PHRASE|MASK|TILE|REAL|TRAP|COPY)_MAX_WORDS|maxWords|max(?:Phrase|Mask|Tile|Real|Trap|Copy)Words)\s*=\s*\d+\b/i,
  },
  {
    rule: 'wordCount numeric comparison',
    pattern: /\bwordCount\s*(?:>=|>|<=|<|===?|!==?)\s*\d+\b|\b\d+\s*(?:>=|>|<=|<|===?|!==?)\s*wordCount\b/i,
  },
  {
    rule: 'words.length numeric comparison',
    pattern: /(?:^|[^A-Za-z0-9_])words\s*\.\s*length\s*(?:>=|>|<=|<|===?|!==?)\s*\d+\b|\b\d+\s*(?:>=|>|<=|<|===?|!==?)\s*words\s*\.\s*length\b/i,
  },
  {
    rule: 'countWords numeric comparison',
    pattern: /\bcountWords\([^()\r\n]*\)\s*(?:>=|>|<=|<|===?|!==?)\s*\d+\b|\b\d+\s*(?:>=|>|<=|<|===?|!==?)\s*countWords\([^()\r\n]*\)/i,
  },
  {
    rule: 'split word-count numeric comparison',
    pattern: /\.split\([^\r\n]*?\)\.length\s*(?:>=|>|<=|<|===?|!==?)\s*\d+\b/i,
  },
  {
    rule: 'absolute prose word limit',
    pattern: /\b(?:no more than|at most|never exceed|maximum of|max(?:imum)?\s*:?\s*)\s*\d+(?:\s*(?:-|\u2013|to)\s*\d+)?\s+words?\b/i,
  },
  {
    rule: 'hyphenated numeric word maximum',
    pattern: /\b\d+\s*-\s*words?\s+(?:hard\s+)?max(?:imum)?\b/i,
  },
  {
    rule: 'numeric words maximum',
    pattern: /\b\d+(?:\s*(?:-|\u2013|to)\s*\d+)?\s+words?\s+(?:hard\s+)?max(?:imum)?\b/i,
  },
  {
    rule: 'numeric preferred word count',
    pattern: /\bprefer(?:red)?\s+(?:between\s+)?\d+(?:\s*(?:-|\u2013|to)\s*\d+)?\s+words?\b|\bpreferred\s+range\s+(?:is|of)\s+\d+\s*(?:-|\u2013|to)\s*\d+\s+words?\b|\b\d+\s*(?:-|\u2013|to)\s*\d+\s+words?\s+preferred\b/i,
  },
  {
    rule: 'legacy spelled word maximum',
    pattern: /\beight words?\s+(?:maximum|or fewer)\b/i,
  },
  {
    rule: 'one-word editorial penalty',
    pattern: /\bone-word\s+(?:phrase|tile).*\b(?:review|flat)\b|\bword tile requires review\b/i,
  },
];

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isGovernedCodeFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const segments = normalized.split('/');
  if (segments.some(segment => EXCLUDED_DIRECTORY_NAMES.has(segment.toLowerCase()))) return false;
  const basename = segments.at(-1) ?? '';
  if (/\.(?:test|spec)\.[^.]+$/i.test(basename)) return false;
  if (/\.d\.ts$/i.test(basename)) return false;
  if (/^wordCapPolicy\.(?:mjs|js|ts)$/i.test(basename)) return false;
  return CODE_EXTENSIONS.has(path.extname(basename).toLowerCase());
}

async function walkGovernedRoot(repoRoot, relativeRoot, results) {
  const absoluteRoot = path.join(repoRoot, relativeRoot);
  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = normalizeRelativePath(path.join(relativeRoot, entry.name));
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORY_NAMES.has(entry.name.toLowerCase())) {
        await walkGovernedRoot(repoRoot, relativePath, results);
      }
    } else if (entry.isFile() && isGovernedCodeFile(relativePath)) {
      results.push(relativePath);
    }
  }
}

export async function discoverGovernedWordCapFiles(repoRoot) {
  const results = ['docs/CONTENT_WRITING_STANDARD.md'];
  for (const root of GOVERNED_ROOTS) {
    await walkGovernedRoot(repoRoot, root, results);
  }
  return [...new Set(results)].sort();
}

export function findAbsoluteWordCapFindings(file, source) {
  const findings = [];
  const lines = String(source).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const countWordsCalls = line.match(/\bcountWords\s*\(/gi)?.length ?? 0;
    const comparativeParityLine = countWordsCalls >= 2 && (
      /\bMath\.abs\s*\(/.test(line) ||
      (/\breal\b/i.test(line) && /\btrap\b/i.test(line))
    );

    for (const { rule, pattern } of CAP_PATTERNS) {
      if (comparativeParityLine && rule === 'countWords numeric comparison') continue;
      if (pattern.test(line)) {
        findings.push({
          file,
          line: index + 1,
          rule,
          excerpt: line.trim(),
        });
      }
    }
  }
  return findings;
}
