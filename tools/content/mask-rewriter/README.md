# POLYWORDS Mask Rewriter

This is a local-only POLYWORDS content writing tool.

It is not part of the player-facing game app, and it should not be wired into the live app UI. Generated output is draft-only and requires human audit before it belongs anywhere near the game database.

## Safety

- Never commit `.env` or real API keys.
- Copy `.env.example` to `.env` and put real provider keys there manually.
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

The Express server reads provider keys and model settings from `.env`.

## Providers

The tool supports three generation modes:

- Mock: local placeholder output; skips paid APIs.
- Anthropic: real generation using `ANTHROPIC_API_KEY`.
- OpenAI: real generation using `OPENAI_API_KEY`.

Use the Provider selector to choose Anthropic or OpenAI. If one provider has low credits, quota, or billing problems, switch providers or enable mock mode.

Model environment variables:

- Anthropic uses `ANTHROPIC_MODEL` when set; otherwise the server default is `claude-sonnet-4-20250514`.
- OpenAI uses `OPENAI_MODEL` when set; otherwise the server default is `gpt-4.1-mini`.

### Mock mode

If you do not want to use paid API credits, enable mock mode by setting `MOCK_MODE=true` in `.env` or by turning on "Local mock mode (skip paid APIs)" in the UI.
Mock mode returns placeholder tile responses so the frontend can be tested without an Anthropic or OpenAI call.

### Real provider mode

When mock mode is off, the tool uses the selected real provider and may use API credits.
If credits are low or billing is not enabled for one provider, use mock mode, add billing/credits, or switch to the other configured provider.
Full Loaded Database runs in real provider mode can use significant API credits, so keep the full-run confirmation checkbox as an intentional safety step.

### Common errors

- `Anthropic credits or billing appear unavailable.` means the Anthropic account likely needs credits or billing enabled.
- `Anthropic API key may be missing or invalid.` usually means `.env` is missing `ANTHROPIC_API_KEY` or the key is invalid.
- `Anthropic rate limit hit.` means retry later or reduce request volume.
- `OpenAI credits, quota, or billing appear unavailable.` means the OpenAI project likely needs credits, quota, or billing enabled.
- `OpenAI API key may be missing or invalid.` usually means `.env` is missing `OPENAI_API_KEY` or the key is invalid.
- `OpenAI rate limit hit.` means retry later or reduce request volume.
- `Local API server may not be running.` means the Express backend is probably not available at `http://localhost:8787`; run `npm.cmd run dev`.
- `Model returned invalid JSON.` means the model response could not be parsed as the strict JSON format the tool expects.

## Build

```bash
npm.cmd run build
```
