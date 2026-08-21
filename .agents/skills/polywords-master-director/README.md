# POLYWORDS Master Product Director Skill

This package defines a hybrid ChatGPT + Codex skill for auditing, directing, improving, and protecting POLYWORDS across product, content, game feel, UX, progression, monetization, analytics, visuals, audio, and code.

## Files

- `SKILL.md`: master operating instructions
- `references/content-doctrine.md`: REAL and trap writing/audit rules
- `references/game-feel-framework.md`: interaction and feedback audit framework
- `templates/backlog-schema.md`: canonical issue and decision system
- `templates/full-audit-template.md`: broad audit output
- `templates/codex-prompt-template.md`: lean implementation prompt structure

## Suggested Installation

Place this folder in the skill location used by the environment running the audit. Keep the folder in or alongside the POLYWORDS repository so the constitution and templates can be version-controlled.

The canonical backlog and product-constitution state should be stored in project files and updated after approved decisions. Do not rely on chat history as the only record.

## Repository Synchronization

The version-controlled skill belongs at `.agents/skills/polywords-master-director/` in the active POLYWORDS branch. Inside the repository, `docs/CONTENT_WRITING_STANDARD.md` remains the sole editorial authority. The bundled `references/content-doctrine.md` exists so the skill also works outside the repository; keep both documents synchronized whenever a locked content rule changes.
