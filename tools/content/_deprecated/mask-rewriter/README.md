# POLYWORDS Content Workflow

This local-only tool manages the dormant V2 content pilot. It does not write to the player-facing
app or legacy `assets/data/huntData.json`.

## Editorial flow

1. Select one of the 20 pilot words.
2. Generate a provisional meaning inventory and source links.
3. Human-verify, correct, and approve every meaning.
4. Generate one complete word bank.
5. Edit, accept, or reject every tile.
6. Rerun rejected tiles without replacing accepted work.
7. Use the blind preview to inspect Hidden Truth voice parity.
8. Complete the human checklist and approve the word.
9. Export approved V2 words.
10. Merge the export with the deterministic CLI only after explicit approval.

The canonical prompt is `docs/CONTENT_WRITING_STANDARD.md`.

## Setup and run

```bash
npm.cmd install
npm.cmd run dev
```

Backend: `http://localhost:8787`

Frontend: `http://localhost:5173`

Drafts persist in browser local storage and can also be imported/exported as JSON.

## Providers

Copy `.env.example` to `.env` and add provider keys locally. Never commit `.env`.

- Anthropic uses `ANTHROPIC_API_KEY`.
- OpenAI uses `OPENAI_API_KEY`.
- Local mock mode uses no paid API.

Generate one word at a time. Full-database generation is intentionally removed.

## Validation tests

```bash
npm.cmd run test:content
```

## Safe V2 merge

Dry run:

```bash
npm.cmd run merge:v2 -- --input C:/path/POLYWORDS_APPROVED_V2.json --dry-run
```

Merge new words:

```bash
npm.cmd run merge:v2 -- --input C:/path/POLYWORDS_APPROVED_V2.json
```

Replacing an existing approved word requires an explicit word:

```bash
npm.cmd run merge:v2 -- --input C:/path/POLYWORDS_APPROVED_V2.json --replace BANK
```

The command validates both banks, accepts approved words only, is idempotent for identical
content, and refuses silent overwrites.
