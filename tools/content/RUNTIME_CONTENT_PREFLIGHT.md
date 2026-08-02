# Runtime Content Preflight

This read-only gate checks a candidate Hunt runtime JSON file before any production merge.
It does not edit the workbook, candidate, dormant V2 bank, or live `huntData.json`.

For an in-progress content batch:

```powershell
npm.cmd run content:preflight -- --input C:\path\to\candidate.json --structural-only
```

For the full launch gate:

```powershell
npm.cmd run content:preflight -- --input C:\path\to\candidate.json
```

Add `--json` for machine-readable output. Every report includes the candidate's SHA-256
fingerprint so an approved export can be identified exactly.

The structural gate covers runtime shape, stable IDs, tile counts, visible truth balance,
headword leaks, duplicate phrases, placeholder text, pacing tags, and the three-pair Route C
boss contract. The launch gate also requires 110 words, at least 10 boss words, and enough
words to build the locked 10-round phase arc.

Passing does not replace the editorial audit in `docs/CONTENT_WRITING_STANDARD.md`. Truth,
sourcing, voice, familiarity, and whether every trap is legally wrong still require human
approval.
