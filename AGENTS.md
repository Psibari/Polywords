# POLYWORDS Agent Instructions

## Project Identity

POLYWORDS is a mobile word arena game, not a quiz list. The hero word is the boss. The active mask tile is the challenger. The Master Gate is Polly's locked cage/vault. The player steals mastery one swipe at a time.

The Word Vault page is the player's reclaimed meaning archive and trophy room. It is not Polly's cage, not Polly's lair, and should avoid cage/prison visuals.

Home is the arcade lobby / launchpad. Play is the arena. Home should communicate that POLYWORDS is about stealing meanings back from Polly without implying unfinished placeholder features are live.

Settings is the utility page for player/account/preferences/about. Profile belongs inside Settings for MVP and should not be a main nav tab.

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
- Polly is not permanent on the play screen.
- Polly appears only as a pop-in.
- 1 time during a big moment in a word round.
- Always at end of every round win/loss.
- 2 max only if round has a major event.
- Bottom-left entrance.
- Never blocks active tile, right shatter lane, hidden tiles, or Master Gate.
- Polly dialogue should use polysemous/double-meaning taunts where possible.
- Polly should never sound warmly supportive.
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

- Meaning hidden, not meaning lost.
- Real Meaning Masks describe actual meanings of the boss word.
- They should be masked, creative, human-readable, and clear after reveal.
- Avoid flat dictionary labels.
- Avoid weird poetic phrases nobody would say.
- Avoid predictable direct extensions.
- Traps are almost-meanings close to a real meaning.
- Traps should live in the same scene, object family, action chain, common confusion, tool, container, result, neighbor, or almost-synonym.
- Good examples:
  - SPRING = opposite of Autumn
  - SPRING = used in cheap mattresses
  - SPRING trap near water-source = creek stream
- Bad examples:
  - SPRING = one of the four seasons
  - SPRING = metal coil
  - SPRING trap = water flow

## Mask Rewriter Tool

- Local content tool lives at:
  ```text
  tools/content/mask-rewriter/
  ```
- It is not player-facing gameplay code.
- It supports:
  - Test Batch
  - Specific Words
  - Full Loaded Database with confirmation
  - Creativity controls
  - Fresh rerun
  - Tweak Notes
  - CSV word source import
  - Mock / Anthropic / OpenAI providers
  - Audit columns: `AUDIT STATUS` and `AUDIT ISSUES`
- It uses `.env` for API keys.
- Never commit `.env`.
- Never commit generated CSVs or `dist` output.
- Generated output is draft-only and requires human audit before game import.
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
