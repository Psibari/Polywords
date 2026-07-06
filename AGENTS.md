# POLYWORDS Agent Instructions

## Required Reading and Authority

`AGENTS.md` is the front door for every coding agent working in this repository.
Before planning or changing files:

1. Read this file completely.
2. Read `CLAUDE.md` for architecture, locked implementation decisions, and the
   project document map.
3. Read `CONTEXT.md` for the current branch state, shipped work, and next priorities.
4. Read the focused source document for the area being changed, such as:
   - `docs/GAME_REFERENCE.md` for Hunt, scoring, Vault, SFX, and gameplay systems.
   - `docs/GOLDEN_PACING_SYSTEM.md` for Hunt pacing and content selection.
   - `docs/CONTENT_WRITING_STANDARD.md` for meaning research, REAL masks, traps, and
     editorial approval.
   - `docs/DAILY_CHALLENGE_SPEC.md` for Daily Challenge.
   - `docs/POLLY_DIALOGUE_BANK.md` for Polly dialogue.
   - `docs/WORKFLOW.md` for patch and verification workflow.

Instruction authority is: the user's current request, then `AGENTS.md`, then the
focused source document, then `CLAUDE.md`, then `CONTEXT.md`. If lower-authority
documentation conflicts with a higher-authority instruction, follow the
higher-authority instruction and report the mismatch instead of silently combining
the two.

## Project Identity

POLYWORDS is a mobile word arena game, not a quiz list. The hero word is the boss. The active mask tile is the challenger. The Master Gate is Polly's locked cage/vault. The player steals mastery one swipe at a time.

The Play screen uses a premium semantic combat arena shell. Keep GameScreen nav-free, protect the Hidden Truth Rule, and treat HUD/hero/tile/gate polish as visual shell work unless a patch explicitly changes mechanics. The active tile is a heavy top slab in a concealed POLYWORDS meaning-tile stack, not a paper-card deck; under-tiles may imply depth but must stay unreadable and truth-hidden.

The Word Vault page is the player's reclaimed meaning archive and trophy room. It is not Polly's cage, not Polly's lair, and should avoid cage/prison visuals.

Home is the arcade lobby / launchpad. Play is the arena. Home should communicate that POLYWORDS is about stealing meanings back from Polly without implying unfinished placeholder features are live.

Settings is the utility page for player/account/preferences/about. Profile belongs inside Settings for MVP and should not be a main nav tab.

Bottom nav tabs are Home / Play / Vault / Settings. The bottom nav is visible outside active gameplay only and must not overlay or clutter `GameScreen`.

## Workflow

- User uses VS Code with Codex extension.
- Codex permissions stay on Approve.
- IDE Context stays ON.
- ChatGPT is architect/planner.
- Codex is code mechanic.
- One surgical patch at a time.
- Do not broaden patch scope.
- After code patches, always run:
  ```bash
  npx.cmd tsc --noEmit
  ```
- If TypeScript passes and device sanity is clean, commit + push only after approval.
- Keep `CLAUDE.md` and `CONTEXT.md` synced after completed code/tooling patches.

## Sacred Gameplay Rules

- UP = claim real meaning.
- RIGHT = reject trap.
- No left swipe.
- No tap-submit.
- Ordinary mask tiles must not reveal whether they are real/trap by style.
- Preserve the Hidden Truth Rule from `docs/GOLDEN_PACING_SYSTEM.md`: no ordinary mask may reveal real/trap/rare/hidden-worthy/important status before commitment.
- Do not change scoring unless explicitly requested.
- Do not change swipe grammar unless explicitly requested.
- Do not change Master Gate logic unless explicitly requested.
- Do not change `SwipeMask` behavior unless explicitly requested.

## Golden Pacing System

- `docs/GOLDEN_PACING_SYSTEM.md` is source of truth for Hunt emotional rhythm, Semantic Snap Rate, future content metadata, and content selection.
- Do not implement pacing logic, metadata schema, or automated Hunt generation unless explicitly requested.
- Golden Pacing is documentation/content architecture until a manually tagged test set exists.

## Locked Screen Hierarchy

1. HERO WORD
2. ACTIVE MASK TILE
3. MASTER GATE
4. HUD / SCORE / FEATHERS / STREAK
5. POLLY POP-IN ONLY

## Polly Rules

- Polly is the opponent, not a friendly mascot.
- Polly is a polysemous word thief: a mimic, hoarder of stolen meanings, and taunting language burglar.
- Polly steals meanings by mimicking human words.
- Polly is not permanent on the play screen.
- Polly appears only as a pop-in.
- 1 time during a big moment in a word round.
- Always at end of every round win/loss.
- 2 max only if round has a major event.
- Bottom-left entrance.
- Never blocks active tile, right shatter lane, hidden tiles, or Master Gate.
- Polly dialogue should use polysemous/double-meaning taunts where possible.
- Active Polly dialogue was refreshed in Patch 13; keep future edits in the smug word-thief/opponent voice.
- Check docs/POLLY_DIALOGUE_BANK.md before future Polly dialogue patches.
- Polly should never sound warmly supportive.
- Preferred taunt lane: "Can't beat that with a BAT.", "You can't bank on that.", "You missed the point.", "That doesn't sound right.", "I banked that meaning.", "Rough draft. Sharp trap."
- `BINGO BANGO ZZZZINGO!` is not Polly dialogue. It is a rare game/system stinger only for Boss Word mastered and vaulted.

## Locked Colors

- Background: `#1A1830`
- Gold: `#F5C842` only for score, boss word, reward, unlock, MASTER stamp, Word Core
- Purple: `#7B2D8B` for UI/gate/shards/ghost energy
- Rose: `#9B2D6B` for trap/ghost shard accents
- Polly Green: `#4CAF50` only Polly character
- Deep Dark: `#0F0D2A` for Master Gate locked surface and player Vault archive/card surfaces
- Wrong Flash: `#CC2200` only wrong swipe flash
- White: `#FFFFFF` readable text
- No pink/magenta.
- No orange UI.
- No green UI.
- No red except wrong flash.
- Gold max 2 visible elements where practical.

## Content / Mask Writing Rules

- Read and follow `docs/CONTENT_WRITING_STANDARD.md` before researching meanings or writing,
  reviewing, or editing content.
- Mask, trap, REAL, tile length, tone, and giveaway-root rules are governed by
  `docs/CONTENT_WRITING_STANDARD.md`. Do not duplicate or override those rules here.

## Mask Rewriter Tool

- Local content tool lives at:
  ```text
  tools/content/mask-rewriter/
  ```
- It is not player-facing gameplay code.
- It supports the controlled V2 workflow:
  - source-backed meaning inventory;
  - human meaning approval before generation;
  - one complete word per generation;
  - inline tile editing and surgical rejected-tile reruns;
  - blind Hidden Truth review;
  - automated blockers and warnings;
  - human word approval;
  - resumable draft import/export;
  - approved-only V2 export and deterministic merge;
  - Mock / Anthropic / OpenAI providers.
- It uses `.env` for API keys.
- Never commit `.env`.
- Never commit generated CSVs or `dist` output.
- Generated output is draft-only and requires human audit before game import.
- `assets/data/huntData.v2.json` is dormant editorial data. Do not wire it into gameplay until
  the pilot and curated Hunt are approved.
- Start tool with:
  ```bash
  cd tools/content/mask-rewriter
  npm.cmd run dev
  ```

## Safety Rules

- Never expose, print, or commit API keys.
- `.env` stays local only.
- `.env.example` may be committed.
- Do not run full database generation unless explicitly requested.
- Prefer mock mode for UI testing.
- Do not run `npm audit fix` unless explicitly requested.

## Verification

- After this `AGENTS.md` patch, run `npx.cmd tsc --noEmit` from repo root.
- Show `git diff --stat`.
- Show edited files.
- Do not commit yet.
