# Runtime Content Preflight

Read-only validation for a candidate Hunt JSON. It never edits the workbook or live bank.

```powershell
npm.cmd run content:preflight -- --input C:\path\candidate.json --structural-only
npm.cmd run content:preflight -- --input C:\path\candidate.json
```

Add `--json` for machine output and a SHA-256 fingerprint. The gate checks runtime shape,
stable IDs, tile balance/counts, headword leaks, duplicates, placeholder text, pacing tags,
boss contracts, and launch depth.

Passing is mechanical evidence only. Human truth, sourcing, fairness, and voice approval remain
mandatory under `docs/CONTENT_WRITING_STANDARD.md`.
