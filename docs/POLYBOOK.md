# The Polybook

**Date:** 5 September 2026. This file records rulings. It does not authorise code.

## What it is

The Polybook is Polly's diary. It is not a record and it is not a stats screen.
Nobody asked her to keep it. She appointed herself registrar of every Hunt that
happens, and she writes about it whether the player wins, loses, or never
opens the app at all.

The player is allowed to read it. She hates that.

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

Nothing displays any of it. No component reads `bookLog`. The remaining work
is one screen — the numbers, the pools, and the daily fold are already in
place waiting for it.

For current pool sizes and line counts, see `npm run state` and the file
itself. This document does not restate either.

## What is not decided

- The number of masteries that opens the payoff entry.
- Whether the unread indicator on the Polybook nav item ships before any
  notification work does.
- What happens to the score, which is still computed and stored, but shown
  nowhere.
