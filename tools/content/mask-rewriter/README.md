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

Start the local Express server:

```bash
npm.cmd run server
```

Start the Vite frontend:

```bash
npm.cmd run dev
```

The frontend calls the local Express server at:

```text
http://localhost:8787/api/rewrite-batch
```

The Express server reads `ANTHROPIC_API_KEY` from `.env`.

### Mock mode

If you do not have Anthropic credits, enable mock mode by setting `MOCK_MODE=true` in `.env` or by turning on "Local mock mode" in the UI.
Mock mode returns placeholder tile responses so the frontend can be tested without an actual Anthropic call.

## Build

```bash
npm.cmd run build
```
