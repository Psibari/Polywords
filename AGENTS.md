# POLYWORDS Agent Instructions

## Authority and Read Order

For repository changes, read `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, then the focused source.
Runtime code/data outrank docs when describing current behavior.

| Task | Focused source |
| --- | --- |
| Hunt/gameplay | `docs/GAME_REFERENCE.md` |
| Hunt pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt content | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily gameplay | `docs/DAILY_CHALLENGE_SPEC.md` |
| Daily content | `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Polly copy | `docs/POLLY_DIALOGUE_BANK.md` |
| Polly relationship | `docs/POLLY_RELATIONSHIP_MEMORY_V2.md` |
| Polybook | `docs/POLYBOOK.md` |
| visual system | `DESIGN.md` |
| workflow | `docs/WORKFLOW.md` |

Authority: current user request > this file > focused source > `CLAUDE.md` > `CONTEXT.md`.
Report conflicts; never blend them silently. Branch state and open work live in `CONTEXT.md`.

## Product Locks

Only two things are permanently locked: the swipe grammar and the premise. Everything else
called "locked" is current approved product state and may be reopened by Pete, but never changed
casually.

- Premise: one word, many genuine meanings, convincing almost-meaning traps. Recognition, not
  vocabulary instruction.
- Hunt: UP claims a REAL; RIGHT rejects a trap. No left swipe or tap-submit.
- Daily is UP-only. Never import Hunt's RIGHT gesture into Daily.
- Ordinary choices stay neutral before commitment.
- Standard Hunt = 10 rounds; first three fledgling runs = 8. Polly's Word is final. Returning
  Haunt = round 5 standard / round 4 fledgling.
- Boss outcome comes from the hidden gauntlet, never score.
- Do not change scoring, swipe grammar, Boss rules, persistence, `MaskBoard.tsx`, or
  `SwipeMask.tsx` without an explicit focused request.
- Polybook is Polly's book. It may never reveal meanings, traps, or hidden pairs because words
  recur. Counts, status, titles and Polly's diary copy only.

## Polly and Visual Locks

- Polly is a smug opponent and trap-setter, not a friendly word owner.
- Rig 2 face/crown animation is live on settled Home/Daily/Results Polly; most body art remains
  baked. The rejected ALIVE LOOP whole-image rocking experiment is not production direction.
  Current articulation work lives in `CONTEXT.md`.
- `BINGO BANGO ZZZZINGO!` is unassigned system text, never Polly dialogue.
- Locked semantic palette: `#1A1830`, `#0F0D2A`, `#F5C842`, `#7B2D8B`, `#9B2D6B`, Polly
  green `#4CAF50`, wrong red `#CC2200`, and white. Gold remains scarce.
- Visual consistency means shared hierarchy/material/typography/semantic color, not identical
  skins. `DESIGN.md` owns surface-family rules.

## Content Boundaries

- `docs/CONTENT_WRITING_STANDARD.md` exclusively governs Hunt REALS, traps, hidden content and
  editorial approval. Daily has its own standard.
- Runtime Hunt source is `assets/data/huntData.json`. `huntGenerator.ts` may apply explicit,
  reviewed audit/metadata overrides before selection; runtime validation must reject malformed
  difficulty/gpsTag, IDs, REAL/trap flags and invalid Boss hidden content rather than silently
  bypassing it.
- Editorial workbooks do not update runtime automatically. Promote approved content explicitly
  and preserve stable IDs.
- `assets/data/huntData.v2.json` and `tools/content/_deprecated/mask-rewriter/` are retired.
- `.agents/skills/polywords-master-director/` is the version-controlled product skill. Do not
  create competing doctrine copies.

## Workflow

- Keep patches scoped; preserve unrelated changes and every stash.
- Do not run destructive rebuilds, full content generation, or `npm audit fix` unless asked.
- Never expose credentials or commit `.env`, caches, generated CSVs, workspaces, or `dist`.
- Never hard-code content counts in docs. Use `npm run state` for live counts.
- Code/tooling changes: run `npm run typecheck`, relevant tests (full `npm test` for broad
  runtime changes), `git diff --check`, and `git status --short`.
- Docs-only changes: `git diff --check`, `git status --short`, and a reference/staleness scan.
- Report device/native validation separately from static checks.
- Commit, push, merge, or alter stashes only with explicit approval.

## Key Owners

- Entry/navigation: `App.tsx`
- Screens: `app/screens/`
- Hunt: `app/game/huntGenerator.ts`, `app/game/polyRunEngine.ts`
- Daily: `app/game/dailyChallengeEngine.ts`, `app/game/dailyPool.ts`
- State: `app/store/useGameStore.ts`
- Gestures/presentation: `app/components/MaskBoard.tsx`, `app/components/SwipeMask.tsx`
- Theme/materials: `app/ui/`
