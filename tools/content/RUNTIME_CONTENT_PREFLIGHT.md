# Runtime Content Preflight

Read-only validation for a candidate Hunt JSON. It never edits the workbook or live bank.

```powershell
npm.cmd run content:preflight -- --input C:\path\candidate.json --structural-only
npm.cmd run content:preflight -- --input C:\path\candidate.json
npm.cmd run content:quality
```

Add `--json` for machine output and a SHA-256 fingerprint. The gate checks runtime shape,
stable IDs, tile balance/counts, headword leaks, exact duplicates, placeholder text, pacing tags,
boss contracts, and launch depth.

It also emits a non-blocking **Editorial review queue** for mechanically suspicious writing:

- same-headword REAL/trap lexical overlap, including visible and Boss-hidden content;
- strong near-duplicate wording across different headwords;
- any currently grandfathered headword-leak exception.

Those findings are deliberately review-only. Shared vocabulary can be legitimate, while semantic
cross-contamination can exist without shared vocabulary at all. The machine therefore surfaces
candidates and exact IDs/phrases; it never rewrites, deletes, or automatically condemns a tile.

`npm run content:quality` runs this preflight against the actual live
`assets/data/huntData.json` and is part of Quality Checks on every push to the active branch.

Passing is mechanical evidence only. Human truth, sourcing, fairness, trap ownership, memory-snap
separation, and voice approval remain mandatory under `docs/CONTENT_WRITING_STANDARD.md`.
