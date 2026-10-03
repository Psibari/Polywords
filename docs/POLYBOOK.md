# The Polybook

**Date:** 7 September 2026. **Updated:** 2 October 2026.
This file preserves durable Polybook behavior/voice rulings. The current visual architecture and
V1 redesign are governed by `docs/POLYBOOK_LIVING_JOURNAL.md`. Where this file describes the
old two-page spread, sideways spread navigation, old BEATEN corner, or old fixed typography,
the Living Journal document wins.

## What it is

The Polybook is Polly's diary. It is not a record and it is not a stats screen.
Nobody asked her to keep it. She appointed herself registrar of every Hunt that
happens, and she writes about it whether the player wins, loses, or never
opens the app at all.

The player is allowed to read it. She hates that. The route opens directly into the book;
there is no explanatory intro modal.

She writes every day, including days nobody played. That is what makes it a
diary and not a log — a log only gets an entry when something happens, a
diary gets one every day, even a day whose entry is a complaint that nobody
showed up. That is also the reason to open the app on a day you didn't mean
to play: to see what she wrote about you not playing.

## The numbers

GOT PAST ME, HUNTS RUN, and the two streaks stay on the page. They sit under
the double rule at the foot of the left page, at log-line size, not headline
size.

They stay because she can't lie about them, and that is the joke. The rest of
the page is her spin, her excuses, her moods — and then four numbers at the
bottom that she cannot argue with.

They do not lead. Score and rank were cut from the game in `c48e3fe`, so
these four numbers are now the only persistent numbers anywhere in the
player-facing game. Left large, they would just rebuild the score screen
that was just removed. They stay small on purpose.

## Today's entry

Today's entry is re-picked every day from whichever pool matches Polly's
current mood, keyed on the date. It is not re-picked only when her mood
changes.

That has a consequence: each mood's pool needs roughly ten entries so a daily
re-pick has somewhere new to land. What is written today is three or four
per mood — enough to prove the shape of the idea, not enough to survive a
week of daily reads without repeating.

## What counts as beating her

Beating her means mastering the boss word. Nothing else counts.

Surviving the Hunt without mastering the boss word is not beating her.
`resolveHuntResultLabel` in `app/game/huntControl.ts` already says so, in the
words a surviving player sees: "CLOSE, BUT CLOSE DOESN'T COUNT." Close is not
a win, on the Results screen or in her book.

A `playerCompleted` run that didn't master the boss word resets both
streaks. That is deliberate, not a bug to be found and fixed later.

Until `208b2ec` the per-run stamp disagreed with this rule: a run that
mastered the boss word but missed one visible tile was stamped `steady`,
identical to a run that died halfway having taken nothing, because the
stamp also required a flawless boss. It now requires only that the boss
word was mastered — which is what this section already said counted.

## Her five states

DISMISSIVE, AMUSED, WATCHFUL, RATTLED, and CONCEDING are a mood, not a score.
The mood is read from `progress.recentHuntPerformance`, the five-run rolling
window of struggle, steady, or clean runs that already exists for another
purpose.

Nothing new is recorded to drive this. Nothing accumulates. There is no
threshold, and there is nothing to climb toward. The mood reverses on its own
as the five-run window rolls forward — it isn't a state that has to be
earned back.

Do not reintroduce a hidden standing, points per outcome, band edges, or
hysteresis to make this feel more precise. That was proposed once already
and rejected, because it is a rank ladder wearing a mood as a disguise.

The window's coarseness is accepted, not a flaw to fix. A "steady" run could
be one the player survived cleanly but late, or one that ended in a death
after a strong start. The five-run window cannot tell those two runs apart,
and it is not supposed to.

DISMISSIVE is the one exception, and it is deliberately one-way. She
notices a player either the moment they master a word, or once they have
kept coming back for a full window of runs — two doors, either one opens
it, and neither can close again because both inputs only ever grow. She
can be rattled again; she cannot un-meet someone.

There are two doors and not one because a mastery-only rule would strand
a player who keeps playing and keeps losing in DISMISSIVE for weeks — and
that player is precisely who the AMUSED lines were written for.

The mood now has code: `resolveRivalryState` in `app/game/pollyMood.ts`.
It is the source of truth for what each band contains; this document does
not restate it, so a rewrite there cannot leave a stale copy here.

## The payoff

The old idea for the payoff was a run where Polly could no longer say a
meaning belongs to her. That idea is void. She never owned the meanings,
possession language was retired from her voice, and a payoff can't be built
on a claim she isn't allowed to make anymore.

The replacement runs on her two tics. The first is the excuse: on every heavy
day she has an alibi — a bad room, bad light, loose hinges, anything but her
own work. The second is that she never calls the player a person. She calls
them "the visitor," always, no matter how many times they've come back.

The payoff is one entry where both tics drop at once. She names the player as
a person, and she offers no excuse for whatever just happened. It fires once,
it never reverses, and it is never announced — no banner, no unlock toast,
nothing telling the player it just happened. It is gated on mastered words.
The exact number is not decided.

## What already exists

`app/game/pollyBookLines.ts` holds the authored line pools and
`TODAY_ENTRIES`. `BookDayRecord`, `foldRunIntoBookLog`, and `localDateKey`
record one row per day, and they are already writing those rows during play.

The screen exists now — `app/components/ui/PolybookSpread.tsx` reads all of
it. The sections below record what got ruled or discovered while building it.

For current pool sizes and line counts, see `npm run state` and the file
itself. This document does not restate either.

## Gestures — legacy spread behavior

> **SUPERSEDED FOR THE CURRENT REDESIGN:** the miniature two-page spread and horizontal
> left/right page navigation are retired. Preserve the behavioral/history notes below only as
> implementation history; do not rebuild this interaction.

Two, and no more. Sideways moves the view across the one open spread — the
log page and today's page. Down the log goes back in time. There is no page
turn and there is nowhere to turn to: the book has a single spread whose left
page is simply very long, and going backwards through time is the vertical
scroll.

The earlier "scroll, no page turns" ruling is PRESERVED by this, not
overridden. That rule was about not turning pages to travel backwards through
the log — the log has always been, and remains, a continuous scroll with no
page-flip control for time travel. Sliding across the two halves of one
spread is a different motion doing a different job: it switches which static
page is in view, log or today, and never touches how far back in time either
page reads. Read the older rule alone and the new sideways motion looks like
a page turn that snuck back in. It is not one, and it must not be ripped out
on that reading.

## Empty days collapse

A run of two or more unplayed days renders as one row spanning the range. A
single unplayed day stays one row, because one day is not a gap. This
knowingly overrides "one row per day" for empty days only — played days
still get exactly one row however many runs happened that day.

At a twice-a-week cadence, one quiet row per unplayed day made five rows in
six say nobody came, and at that density her quiet lines read as nagging the
player rather than as a bird alone with her records. The joke inverts and
lands on the player, which her voice may never do.

## How a day is read

Specific events outrank the general reading of a day: quiet, then boss lost,
haunt broken, haunt left, boss held, mercy, then heavy or light. Heavy is
more than 20 meanings taken in a day — volume, not accuracy.

It is deliberately not a ratio, because this is the mistake most likely to be
made again: claims-over-offered tracks how accurately the player swipes,
sits near their accuracy whatever they do, and barely moves day to day.
Setting a line on it would have made nearly every day read the same.
`offered` is still recorded — it is the only thing that could later separate
a long sloppy day from a long clean one.

## The BEATEN corner — legacy layout

Every mastered word renders, always. The corner never scrolls and never cuts
the list; once the group would outgrow the corner, the seals shrink instead.
The words are the content, the corner is the container. An earlier version
derived the count from a fixed box and silently dropped words, which is the
failure this rule exists to prevent.

## Typography

The old fixed Buggie sizing below is historical, not a current lock. Physical-phone testing of
the new portrait TODAY page showed Buggie's strokes are too thin for comfortable reading.
A heavier handwriting replacement is being selected. Until that choice is approved, keep
Polly's body writing dark and do not use mood-colored handwriting. Mood is carried by the
TODAY accent bar; AMUSED uses Polly green and brown is excluded.

Legacy sizing reference: her log lines 19, today's entry 21, every label, date, word name and
total 14 — the project's non-gameplay floor. Nothing on the page goes below 14.
Every Text in her hand sets `includeFontPadding` false.

The working rule that came out of the passes: a line that does not fit gets
rewritten, not shrunk — UNLESS a large share of a pool does not fit, in which
case the type is what is wrong. Both happened during the build and both are
correct in their place.

Log lines and today's entry are clipped rather than wrapped, so an overflow
is visible as a fault. A wrapped line looks deliberate, which is how one
survived several device passes.

## The quill is cut

Five passes. At a readable opacity it competed with her writing; at scenery
opacity it read as a smudge on the screen. The art stays in the repo; the
placement was the problem, not the drawing.

## What is not decided

- The number of masteries that opens the payoff entry.
- Whether the unread indicator on the Polybook nav item ships before any
  notification work does.
- What happens to the score, which is still computed and stored, but shown
  nowhere.
- The first-day label is derived from the log not yet being full, so on the
  day the log reaches its cap the oldest row stops reading as the player's
  first day and starts reading as whatever happened — and if a word was
  mastered that day, the word appears, having been hidden until then. One
  row, roughly two hundred days out, about to be trimmed anyway. The proper
  fix is recording the player's first played date once; it is safe to add
  later and backfillable from the oldest row.
- A player who masters a word on their very first day gets the first-day
  line and the word is never named. Accepted, not overlooked.
- LexiconPrototype is dead, reachable only via `POLYBOOK_SPREAD_ENABLED`.
  Deleting it is Pete's call.
- Tabs down the page edge, jumping to a month, are the answer for when the
  log gets long. Not needed until a book is months deep, and deliberately
  not built against content nobody has yet.


## 2026-10-02 Redesign checkpoint

- The live shell is a closed physical Polybook opening to one large portrait page.
- Open sections use bottom forked ribbons: **TODAY / JOURNAL / MASTERY**. MASTERY is fixed navigation copy; the player's actual name stays on the mastery page.
- A visible **< COVER** control returns from an open page to the closed book.
- TODAY's ten-entry rivalry-state pools are wired for testing; DEV controls can cycle entries
  and Journal test states.
- Colored body handwriting was tested and rejected. Use dark readable ink plus a stronger
  mood-color bar under TODAY. AMUSED = Polly green. No brown. Other mood colors remain open.
- BUTTERZ represents mastery with crowns. The crown should not carry a redundant mastered-word
  label such as ROUND.
- Crowns need future consequence so collecting them matters. Earned Polybook access/unlocks are
  an approved direction to explore later, not an economy to implement during this visual pass.
- Closed-cover art follow-up: remove the side ribbons and relocate the ribbon treatment to the
  bottom. Do this after the interior typography is stable.


## 2026-10-03 Locked interior checkpoint

- TODAY, JOURNAL, and MASTERY are device-approved and locked.
- JOURNAL uses physical pages, whole-entry grouping, arrows plus horizontal swipe, the enlarged
  readable `PAGE X OF Y` counter, and no stats footer.
- Open navigation is **TODAY / JOURNAL / MASTERY**. The ribbon positions and forked artwork stay
  as approved; the straight top of each ribbon is masked so it reads as tucked beneath the
  bottom page edge.
- The rejected split-art layering experiment was reverted. Preserve the single approved open-book
  artwork plus the ribbon-top mask.
- The next Polybook product problem is mastery progression: what accumulating crowns reveal or
  unlock. Preserve the locked interior while designing it.
