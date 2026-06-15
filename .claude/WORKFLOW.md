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
5. Find `## BUILD STATE — June 13, 2026` (update date)
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

**Role:** Code review only. Never implementation.

- Codex: "Does this follow AGENTS.md conventions?"
- Copilot: "Review this for TypeScript + performance"
- Claude: Implementation owner (this workflow)

**Before merging:** Code review → Claude confirms no regressions → device sanity → merge

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

app/components/MaskBoard.tsx    Main game board (primary file)
app/components/SwipeMask.tsx    Tile + swipe (Reanimated ONLY)
app/screens/GameScreen.tsx      Main play screen
app/game/session.ts             12-word hunt data
app/store/useGameStore.ts       Zustand store

.claude/WORKFLOW.md             👈 This file
.claude/PROJECT_CONTEXT.md      📋 TODO: Create next session
```

---

*POLYWORDS Claude Workflow · Pete DiBari · June 15, 2026*
