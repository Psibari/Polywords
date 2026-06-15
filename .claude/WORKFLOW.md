# POLYWORDS Claude Workflow
### Ground Truth for Multi-Session Consistency · June 15, 2026

---

## Session Start Checklist

**Before any code work, ALWAYS:**

1. ✅ Read `CLAUDE.md` lines 1-100 (Game identity + Tech Stack)
2. ✅ Read `CONTEXT.md` "BUILD STATE" section (current patch state)
3. ✅ Check `AGENTS.md` "Workflow" and "Sacred Gameplay Rules"
4. ✅ Run `git log --oneline -5` — what was the last real commit?
5. ✅ Ask user: "Is this a new feature or continuing an existing patch?"

---

## Session Scope Rule

**ONE SURGICAL PATCH PER SESSION. ALWAYS.**

| Do | Don't |
|---|---|
| "Add Polly taunts for wrong swipes" | "Refactor swipe system AND add taunts" |
| "Fix Daily Challenge card heights" | "Refactor Daily AND fix card heights" |
| "Wire Bungee font to hero word" | "Update fonts AND redesign HUD" |

**If scope creeps:** Stop. Ask user to file a separate issue for the extra work.

---

## Implementation Workflow

### Phase 1: Confirm Scope
1. User states ONE concern
2. You: "Reading CONTEXT.md BUILD STATE to check for conflicts..."
3. You: "This patch does not conflict with [PATCH_NAME]. Proceeding."
4. User approves

### Phase 2: Code
1. Read the relevant file FULLY before touching
2. One concern only — no drive-by fixes
3. Use `// PATCH_XXX` comments if touching multiple files
4. Keep changes surgical

### Phase 3: Verify
```bash
# MUST run before device test
npx.cmd tsc --noEmit

# Must exit 0. If not, fix TypeScript errors first.
# Do not proceed to device without passing TS.
```

### Phase 4: Device Sanity
- Test on Expo Go physical device or simulator
- Confirm the feature works as intended
- No crashes, no fallback fonts, no visual regressions

### Phase 5: Docs Sync
**IMMEDIATELY after code is done:**

1. Open `CLAUDE.md`
2. Find `## Pending Fixes` → `### Completed and Committed`
3. Add new entry:
   ```markdown
   - Patch XX complete: [PATCH NAME].
     - Changed `file1.tsx`, `file2.tsx`.
     - [1-3 sentence summary of what changed].
   ```

4. Open `CONTEXT.md`
5. Find `## BUILD STATE` (update date if needed)
6. Add new line to BUILD STATE section:
   ```markdown
   Patch XX complete: [PATCH NAME]. [1-2 sentence summary].
   ```

7. Commit:
   ```bash
   git add CLAUDE.md CONTEXT.md
   git commit -m "docs: sync Patch XX to CLAUDE.md and CONTEXT.md"
   ```

8. Show user:
   ```
   ✅ Code committed: [hash]
   ✅ Docs synced: [hash]
   ✅ Ready to push
   ```

---

## Codex Integration (Token Overflow Handoff)

**When Claude reaches token limits mid-patch:**

### Claude's Handoff Checklist

Before switching to Codex, provide:

```markdown
## CLAUDE → CODEX HANDOFF

Patch: [NAME]
Status: [e.g., "60% complete", "ready for implementation"]

### ✅ Design is LOCKED
- [Design detail 1]
- [Design detail 2]
- [Design detail 3]

### ✅ Files to Change
- app/components/MaskBoard.tsx (lines X-Y)
- app/screens/GameScreen.tsx (lines A-B)
- [others]

### 🔧 Code Changes Needed
1. [Exact change 1 with context]
2. [Exact change 2 with context]
3. [Exact change 3 with context]

### ⚠️ CODEX MUST NOT
- ❌ Broaden scope or add features
- ❌ Change gameplay/swipe grammar/colors
- ❌ Touch CLAUDE.md, CONTEXT.md, or AGENTS.md
- ❌ Commit without explicit approval
- ❌ Change Sacred Rules from AGENTS.md

### ✅ CODEX MUST DO
- ✅ Run: npx.cmd tsc --noEmit (report result)
- ✅ Test on device if possible
- ✅ Use forward-slash paths (Windows)
- ✅ Add // PATCH_XX comments in code
- ✅ Keep files readable (no over-refactoring)

### 📝 When Done
Codex reports:
- TypeScript: PASS/FAIL
- Device sanity: PASS/FAIL/UNTESTED
- Files changed: [list]

Claude then:
1. Reviews changes
2. Updates CLAUDE.md + CONTEXT.md
3. Commits docs sync
4. Declares patch complete
```

### Codex's Rules During Handoff

**Codex must follow these STRICTLY:**

1. **Scope is locked.** Do not add features. Do not refactor. Do not "improve" unrelated code.
2. **Sacred Rules are sacred.** If Claude's design violates AGENTS.md, STOP and report to user.
3. **No docs.** Never touch CLAUDE.md, CONTEXT.md, AGENTS.md, or .claude/WORKFLOW.md.
4. **TypeScript must pass.** Run `npx.cmd tsc --noEmit` before declaring done. If it fails, fix it.
5. **Device sanity.** If you can test on Expo Go, do it. Report the result.
6. **Forward slashes only.** Windows: use `/` not `\` in paths.
7. **No commits without approval.** Ask user before committing.
8. **Surgical edits.** One file, one concern. Use `// PATCH_XX` comment markers.

---

## Codex → Claude Handback

**When Codex finishes, report:**

```markdown
## CODEX → CLAUDE HANDBACK

Patch: [NAME]

✅ Code complete
- Files changed: [list]
- TypeScript: PASS
- Device sanity: [PASS/FAIL/UNTESTED]

🔍 Changes made:
1. [brief summary]
2. [brief summary]

📋 Ready for:
- Docs sync (CLAUDE.md + CONTEXT.md)
- Final verification
- Commit + push
```

Claude then completes Phase 5 (Docs Sync) and declares patch complete.

---

## Non-Negotiable Rules

### Tech Stack (Locked)
- `useNativeDriver: true` → transform, opacity ONLY
- `useNativeDriver: false` → height, margin, backgroundColor ONLY
- Never chain both drivers on same `Animated.Value`
- `setTimeout` between phases — never `.start()` callbacks
- Reanimated locked to `SwipeMask.tsx` ONLY

### Gameplay (Sacred)
- UP = real. RIGHT = trap. ALWAYS.
- Wrong swipes are permanent — no snap-back, no retry
- Gate opens boss-only on perfect clear
- MASTERED is boss-only
- GHOST is boss-only
- Words 1-11 never open gate or show overlays
- Boss position 12 always

### Colors (Strict)
```
#1A1830  Background
#F5C842  Gold (max 2 on screen)
#7B2D8B  Purple
#9B2D6B  Rose
#4CAF50  Polly Green (Polly only)
#0F0D2A  Deep Dark (gate/vault only)
#CC2200  Wrong Flash (wrong swipe only)
#FFFFFF  UI text
```

### Polly Rules
- Polly is opponent, not mascot
- Pop-in only, never permanent
- 1 mid-round appearance max per word
- Always appears end-of-round
- Bottom-left entrance, never blocks active tile
- Dialogue from opponent/thief/taunter voice

### File Paths
- **Windows:** always use forward slashes (`/`)
- **Confirm paths before editing** — never guess

---

## After Session: Handoff Checklist

When leaving, provide user with:

```markdown
## Session Complete

✅ Patch XX: [NAME]
- Files changed: [list]
- TypeScript: PASS
- Device sanity: [status]

📝 **Docs updated:**
- CLAUDE.md: Added to "Completed and Committed"
- CONTEXT.md: Updated BUILD STATE

🚀 **Ready to:**
- Push to GitHub
- Deploy to TestFlight
- Start next patch

❓ **Next patch ideas:**
1. [If applicable]
2. [If applicable]
```

---

## Conflict Resolution

**If you see code that violates Sacred Rules:**

1. DO NOT COMMIT
2. Ask user: "This code violates [RULE]. Should I fix it first?"
3. Wait for approval
4. Fix + verify TS + device sanity
5. Add separate patch entry for the fix

**Example:**
```markdown
- Patch 32F-FIX complete: Removed accidental Reanimated import from ResultsScreen.
  - Changed `app/screens/ResultsScreen.tsx`.
  - Reanimated stays in `SwipeMask.tsx` only.
  - TypeScript passed.
```

---

## External AI Tools (Codex/Copilot)

**Role:** Code mechanic + code review. Never design.

- **Codex:** Implements code from Claude's checklist. No design changes.
- **Copilot:** "Does this follow conventions?" + performance review.
- **Claude:** Implementation owner + design architect.

**Before merging:** 
1. Codex reports changes
2. Claude reviews + updates docs
3. Device sanity check
4. Merge when TypeScript passes + device sanity passes

---

## When You're Stuck

**STOP and ask user:**
- "This scope is getting big. Should we split it?"
- "I found a prerequisite issue. Should we fix it first?"
- "TypeScript won't pass. Shall we pivot?"
- "Device sanity found a crash. Revert + debug?"

Do NOT guess. Do NOT broaden scope. Do NOT commit broken code.

---

## File Map (Quick Reference)

```
CLAUDE.md                       👈 Ground truth game design + patches
CONTEXT.md                      👈 Quick-ref + build state (READ FIRST)
AGENTS.md                       👈 Agent instructions (this file references it)
.claude/WORKFLOW.md             👈 This file

app/components/MaskBoard.tsx    Main game board (primary file)
app/components/SwipeMask.tsx    Tile + swipe (Reanimated ONLY)
app/screens/GameScreen.tsx      Main play screen
app/game/session.ts             12-word hunt data
app/store/useGameStore.ts       Zustand store

.claude/                        📁 AI collaboration docs (this directory)
```

---

*POLYWORDS Claude Workflow · Pete DiBari · June 15, 2026*
