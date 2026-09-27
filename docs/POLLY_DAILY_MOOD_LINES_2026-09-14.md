# POLLY — DAILY MOOD LINES

**Date:** 14 September 2026. Drafts approved in conversation, same session as
the (now superseded) Daily tree design. **In code since `b7c6148`:** the lines live in
`pollyCharacter.ts`, pooled as `DAILY_MOOD_LINES` in `app/ui/pwDailyMaterials.ts`, and `PollyDailyPerch` picks one per correct
claim. The live code outranks this file.

Written for the ruling in `DAILY_TREE_DESIGN_2026-09-14 (1).md` §9: Daily's
per-round Polly reaction reads the existing rivalry state
(`resolveRivalryState` in `pollyMood.ts`, read-only — a Daily result never
writes into it) and picks a line from the state's pool via `pickFreshLine`,
same anti-repeat mechanism as `WRONG_HECKLE_LINES` / `STREAK_LINES`.

Voice rules: `docs/POLLY_DIALOGUE_BANK.md`. Short version — she is not a word
thief, she owns her traps and nothing else, she targets the trap or the
moment, never the player's intelligence. No encouragement, no praise, no
direct insults, no possession language about meanings, no numbers.

Single spoken lines, not 3-line Polybook blocks — these fire in a bubble
mid-round, not on a page. Every line must be true for **any** round it
might fire on, since the pick is per-claim, not scripted to a specific
moment.

---

## DISMISSIVE — hasn't registered the player yet, minimum effort

- Barely worth the ink.
- Hm. Moving on.
- Who are you again?
- Fine. Whatever that was.

## AMUSED — comfortable, winning, enjoying the routine

- Charming. Do it again.
- I do enjoy this arrangement.
- Predictable. I like predictable.
- I knew you were gonna pick that one.
- Come back. I'm here every day.

## WATCHFUL — something's changed, she's explaining it away

- Faster than yesterday.
- Hm. That's new.
- Coincidence, probably.
- Watching this one.
- Must want that gold feather.

## RATTLED — losing and can't admit it, her funniest register

- I let you have that one.
- Bad light. Not my fault.
- Luck. Still luck, though.
- That shouldn't count.
- Is this really happening right now?

## CONCEDING — out of excuses, not gracious about it

- New traps. Starting tomorrow.
- I'm out of excuses. Hate that.
- Nothing's holding today.
- Back to the drawing board. Apparently.
- Nooooo

---

## Ruled during drafting

- **"Sweet of you to try."** (AMUSED) — cut. Read too close to warm/
  encouraging, which she's not allowed to be in any state.
- **A rope/feather scarcity line** ("one rope left" etc.) — considered, cut.
  Doesn't fit any one state cleanly and the pools cover the tension without it.
- **"I'm out of here" / "Time for me to go"** (CONCEDING) — considered, cut.
  She's built as persistent — always there, every round, every day. A line
  implying she's leaving either breaks that premise or raises a mechanic
  (does she actually exit?) nobody has designed. CONCEDING is her running out
  of excuses while she stays, not retreating.
- **"Nooooo"** kept instead — a pure defeat sound rather than a sentence, same
  lane as `Zing!` / `YIKES!` elsewhere in her voice bank. Doesn't carry the
  leaving problem.

## The four existing fixed Daily lines — ruled

Reviewed individually rather than cut as a block:

- **`dailyButterKnife`** ("Sharp as a butter knife.", first miss) — **kept.**
  Specific metaphor, not generic.
- **`dailyLossBat`** ("CAN'T BEAT THAT WITH A BAT.", full session loss) —
  **kept.** Specific metaphor tied to the loss.
- **`dailyWinTomorrow`** ("WON'T HAPPEN TOMORROW.", full session win) —
  **kept.** Ties directly to Daily's once-a-day structure — a line Hunt
  literally cannot say.
- **`dailyNotToday`** (loss, alternate) — **cut.** Stock phrase, no metaphor,
  the weakest of the four. The new pools cover flat denial better already
  (RATTLED's "That shouldn't count.").

These three survivors stay as **separate fixed triggers** for the three
big session-level moments (first miss, full loss, full win) — a different
tier of event from the round-by-round mood pool above. They are not folded
into the five state pools.

**Code implication, not made here:** `dailyNotToday` comes out of
`DAILY_LOSS_LINE_IDS` in `pwDailyMaterials.ts` and out of `POLLY_LINES` in
`pollyCharacter.ts` when this is implemented.

---

## What this is, and isn't

25 new lines, 5 per state — the top of the 15-20 range costed in
`DAILY_TREE_DESIGN_2026-09-14 (1).md` §11, plus the extra line each on AMUSED
and WATCHFUL. Three of the four existing fixed lines survive unchanged;
one retires.

This document is content, not an implementation authorization — same rule
as the design doc it extends. Adding ids, wiring the pool, and retiring
`dailyNotToday` in code are separate, un-started steps.
