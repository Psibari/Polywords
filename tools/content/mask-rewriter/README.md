# POLYWORDS Mask Rewriter

This is a local-only POLYWORDS content writing tool.

It is not part of the player-facing game app, and it should not be wired into the live app UI. Generated output is draft-only and requires human audit before it belongs anywhere near the game database.

## Safety

- Never commit `.env` or real API keys.
- Copy `.env.example` to `.env` and put the real Anthropic key there manually.
- `TEST_MODE` is enabled by default and should stay on while testing.
- Exported rows include `AUDIT STATUS` and `AUDIT ISSUES` review metadata.

## Setup

```bash
npm.cmd install
```

## Run

Start the local Express backend and Vite frontend together:

```bash
npm.cmd run dev
```

This starts:

- Backend: `http://localhost:8787`
- Frontend: `http://localhost:5173`

The frontend calls the local Express server at:

```text
http://localhost:8787/api/rewrite-batch
```

You can also run either side separately:

```bash
npm.cmd run server
npm.cmd run client
```

The Express server reads `ANTHROPIC_API_KEY` from `.env`.

### Mock mode

If you do not have Anthropic credits, enable mock mode by setting `MOCK_MODE=true` in `.env` or by turning on "Local mock mode (skip Anthropic)" in the UI.
Mock mode returns placeholder tile responses so the frontend can be tested without an actual Anthropic call.

### Real Anthropic mode

When mock mode is off, the tool uses real Anthropic generation and may use API credits.
If credits are low or billing is not enabled, use mock mode or add Anthropic billing/credits before running generation.
Full Loaded Database runs in real Anthropic mode can use significant API credits, so keep the full-run confirmation checkbox as an intentional safety step.

### Common errors

- `Anthropic credits or billing appear unavailable.` means the Anthropic account likely needs credits or billing enabled.
- `Anthropic API key may be missing or invalid.` usually means `.env` is missing `ANTHROPIC_API_KEY` or the key is invalid.
- `Anthropic rate limit hit.` means retry later or reduce request volume.
- `Local API server may not be running.` means the Express backend is probably not available at `http://localhost:8787`; run `npm.cmd run dev`.
- `Model returned invalid JSON.` means the model response could not be parsed as the strict JSON format the tool expects.

## Build

```bash
npm.cmd run build
```
