# POLLY — POLYBOOK LOG LINES

**Date:** 2 October 2026. Today-entry expansion approved; Work Log pool expansion approved through Haunt Broken.

The authored copy remains approved. Earlier fit notes were measured against the retired
miniature-spread/Buggie layout and are historical only. The new portrait-page redesign has more
usable width, and Buggie itself failed physical-phone readability for being too thin. Re-verify
these pools only after the replacement handwriting font is approved; do not rewrite good copy
merely to preserve obsolete width assumptions. Lines are picked at render time from
these pools, so each must be true for **any** day in its bucket.

Voice rules: `docs/POLLY_DIALOGUE_BANK.md` and `docs/POLYBOOK.md` (the file this line
originally cited, `POLYBOOK_LEDGER_DESIGN.md`, no longer exists — folded into those two).
She owns her traps and nothing else, the joke lands on her, she never credits the player,
she does not know a phone exists.
---

## Part 1 — the work log, left page

Twelve-point, her hand. One row per day.

### 1.1 Quiet day — a gap, nobody played

- Scared them off, then.
- Nobody dared. Naturally.
- Must be intimidating.
- No one. They know.
- Word must have spread.
- Probably heard about me.
- The champ rests.
- Champion. Unchallenged.
- No challengers today.
- They stayed away. Wise.
- Hiding, I assume.
- Maybe tomorrow. Doubt it.
- Undefeated. Again.
- A peaceful day. Suspicious.
- Crown untouched. Good.
- Champ. Still. Obviously.
- They lost their nerve.
- Nobody volunteered for humiliation.
- Still undefeated. Note it.
- No takers. Imagine that.

### 1.2 Light day — little got past her

- Traps held. As designed.
- Barely a scratch.
- Held the line. Easily.
- A good day for me.
- That is more like it.
- As expected. As always.
- They got nowhere.
- Turned back. Naturally.
- Comfortable. Very.
- Never in doubt.
- Routine. For me.
- Textbook. My text.
- Hardly worth writing.
- Easy. Almost dull.
- The crown stays put.
- Not a chance today.
- I was never worried.
- Did that in my sleep.
- Good work.
- Effortless, frankly.
- Nothing got through.
- Held everything. Note it.
- Big deal.
- I think I’ll polish my crown.
- Not even a dent.
- Just chilling over here.

### 1.3 Heavy day — a lot got past her

- Bad room. Bad light.
- The traps are fine.
- One of those days.
- I blame the hour.
- Read straight through.
- Nothing held. Nothing.
- My own fault. Probably.
- A poor batch.
- I have had better.
- The light was wrong.
- Sloppy work.
- Not my finest hour.
- Wrote those in a hurry.
- That batch was weak.
- An off day. Rare.
- The hinges were loose.
- Too generous, clearly.
- I built those tired.
- Weak set. My weak set.
- Everything gave way.
- A bad afternoon.
- I will rewrite them all.
- They came to play.
- They must be cheating.
- Found a weakness.
- Things are getting real.

### 1.4 Boss held — she won the boss round

- Held the boss. Finally.
- The gauntlet held.
- Not that one. Not today.
- That one stayed shut.
- Kept the last one.
- The last door held.
- Turned back at the end.
- Not the last one. Never.
- The good one held.
- Stopped at the door.
- My best work, that.
- So close. Not close.
- Held it. Barely. Held it.
- I'm still the boss.
- Nowhere near the end.
- The stones went back in the wall.
- Only the worthy will get by.
- That one should haunt them nicely.
- Let’s see if they fall for it twice.

### 1.5 First day

- New name in the book.
- A visitor. We'll see.
- Someone new. Hm.
- A new one. Noted.
- Another one. Fine.
- We shall see about this.
- This one looks soft. Give them some extra feathers.
- Five Daily Challenges couldn’t help this one.
- Bet they get where, wear, and were mixed up.
- I bet this one still needs phonics lessons.
- This one thinks “oxymoron” is an insult.
- This one would be lost without spell check.
- This one’s still waiting for the movie version of the dictionary.
- Probably celebrated when the spelling test was canceled.
- Probably thinks a homophone is a new smartphone.

### 1.6 Mercy — the run was revived

- Let them live. Again.
- Showed mercy. Again.
- I was generous.
- Spared them. My choice.
- Let it go on. Why not.
- Gave them another.
- Too soft, as usual.
- Happy birthday, pal.
- I was feeling charitable.
- Don’t make me regret this.
- They looked so pathetic.
- Consider it a donation.
- One more chance. Don’t waste it.
- I wasn’t finished with them yet.
- It’s more fun when they struggle.
- I could’ve ended it there.
- They owe me for that one.
- Call it professional courtesy.
- My good deed for the year.
- Even I have a heart. Apparently.
- Fine. One more.
- I’m getting soft. Disgusting.
- That was pity. Nothing more.
- I wanted to beat them properly.
- They’re more entertaining alive.
- Consider that a royal pardon.
- I’ll collect on that favor later.
- Don’t tell anyone I did that.
- Must be my generous phase.
- I blame the holiday spirit.
- They looked like they needed it.

> **1.6 is a Hunt bucket.** Verified in `polyRunEngine.ts`: the Hunt revive is
> Mercy, and the engine comment says she revives her prey rather than ending it.
> It is a Hunt event, so it is legal in the log.

### 1.7 Two-line rows without a word

A new row shape. The pair overflows on one line and reads better split anyway.

```
Fell for it again.
La la la la.
```

### 1.8 Pre-install rows

These are the three or four dated rows that already exist in the book the
first time a player opens it — her business before they arrived. §1.5
"First day" is about the player's first day. §1.8 is about the days before
the player existed. They must never be mistaken for the player's own
record.

Rules specific to this pool: no word names, no reference to the player or
any visitor, no "they", no numbers. The register is deliberately dull — she
is undefeated, unchallenged, bored, and keeping meticulous records of
nothing. The joke lands on her because she bothered to write it down.

One-line rows:

- I am the champ.
- This is what I do.
- Nothing to report.
- Records up to date.
- Dusted the crown.
- Ink refilled.
- Traps checked. Fine.
- All present. All shut.
- Oiled the hinges.
- Is it still Tuesday.
- Began a new page. Why.
- Lost count of the days.
- Same as the last one.
- As yesterday.

Two-line rows:

```
The days have stopped
being separate.
```

```
I have written this
before, I think.
```

Cracker rows — two-line, and their own group. **One of them is guaranteed to
appear in every book** (Pete's ruling). The guarantee is selection logic and
is not implemented in this commit.

```
Never had a cracker.
I bet they are good.
```

```
A cracker. That is all.
I do not want one.
```

```
Still no cracker.
Nobody has offered.
```

Historical note: every line above fit the old Buggie/160pt layout. That is no longer the
acceptance target. Re-measure once against the approved replacement handwriting font on the new
portrait page.

---
## Part 2 — the rows that name a word

Word on its own line, her note underneath. Forced: CONCENTRATION fills a line by
itself. Note lines never contain the word.

```
Sep 04
CONCENTRATION
My worst work.
```

### 2.1 Boss lost — the word was mastered

- My worst work.
- A weak set, that.
- Badly built.
- Sloppy of me.
- I rushed that one.
- All three. Fine.
- Of all the ones to lose.
- I never liked that set.
- Poor hinges on that one.
- Should have kept it back.
- Fine. It was old work.
- That set was tired.
- Big deal.
- Who cares?
- One win. Look at the scoreboard.

### 2.2 Haunt left — walked away from

- Walked right past it.
- Left standing.
- Still shut. Good.
- Untouched. Good.
- Not today, then.
- That one holds.
- Missed entirely.
- Never even close.
- The haunts are stacking up.
- Might as well live in a haunted house.
- Lost the same way as last time. Instant replay.
- Again? This is getting embarrassing.
- Same word. Same result.
- They fell for it twice. Beautiful.
- Still haunted. I love this one.
- This one might haunt them forever.
- Back it goes.
- I knew they’d miss it again.
- They remembered nothing. Excellent.
- Maybe third time’s the charm.
- They saw it before. That’s the funny part.
- I almost feel bad. Almost.
- See you again soon.
- This one isn’t going anywhere.
- I’m starting to get attached to this one.
- At this point, it lives here.

### 2.3 Haunt broken — came back and took it

- Back for it. Persistent.
- Second time, then.
- Twice asked. Fine.
- I moved it too late.
- Should have changed it.
- They remembered. Hm.
- Came back. Of course.
- That one is settled.
- It’s about time.
- Finally got past one.
- They’re learning from their mistakes now.
- Look who thinks they’re a ghost hunter now.
- There goes another perfectly good haunt.
- I liked that one.
- Fine. They learned something.
- Apparently they do remember things.
- They finally figured it out.
- Took them long enough.
- Well, that won’t haunt them anymore.
- I should’ve changed the trap.
- Should’ve known they’d remember.
- They came prepared this time.
- I preferred them the first time.
- Beginner’s luck. The second time.
- One less haunt. Tragic.
- They ruined a perfectly good haunt.
- I was saving that one.
- So much for the rematch.
- They got their revenge. Cute.
- Fine. Consider it settled.
- That ghost is officially dead.
- I suppose they earned that one.
- Look who finally learned.
- I’ll find something else to haunt them with.
- Enjoy it. I have more.
- One down. Plenty left.

---
## Part 3 — TODAY entry

Three authored lines on the full portrait TODAY page. The old fifteen-point/right-page and
nineteen-character assumptions are retired. The copy should render comfortably at a readable
phone size without shrinking it to satisfy the old spread.

### DISMISSIVE

```
A visitor.
Nothing to note.
We shall see.
```

```
Someone new.
They will tire.
They always do.
```

```
A name. No more.
Not worth the ink.
Next.
```

```
Another visitor.
Probably just a tourist.
Not a real player.
```

```
They came back.
Once proves nothing.
I barely noticed.
```

```
Made a few moves.
Those were easy.
Just a setup.
```

```
A decent run.
Beginner’s luck.
It won’t last.
```

```
They got through.
I wasn’t trying.
Obviously.
```

```
Getting confident.
That’s adorable.
Let them.
```

```
Another decent showing.
Still not impressed.
Moving on.
```

### AMUSED

```
Back again.
Persistent, at least.
Still losing.
```

```
They keep coming.
I keep winning.
A fine arrangement.
```

```
Regular, now.
Regularly beaten.
Charming.
```

```
Let us see, then.
See what they have.
Same as always.
```

```
They’re improving.
How entertaining.
Almost impressive... almost.
```

```
They’re getting better.
This could be fun.
For me, obviously.
```

```
They surprised me.
Once.
Let’s not celebrate.
```

```
Another good run.
They’re enjoying this.
So am I.
```

```
They caught me twice.
Getting interesting.
Don’t get excited.
```

```
I know their tricks.
They know mine.
Game time.
```

### WATCHFUL

```
This is getting real.
The traps are fine.
It is the room.
```

```
Quicker than before.
That is all it is.
Nothing more.
```

```
Slower to fall for it.
Coincidence.
Obviously.
```

```
They’re learning me.
Small inconvenience.
I’ll adjust.
```

```
That was too close.
Not worried.
Just paying attention.
```

```
They’re adapting.
So am I.
Let’s see who’s faster.
```

```
Another clean run.
I’m seeing a pattern.
I don’t like patterns.
```

```
They’re harder to fool.
Good.
I was getting bored.
```

```
They saw that coming.
Interesting.
I’ll make the next one harder.
```

```
That was close.
I don’t like close.
Time to shake it up.
```

### RATTLED

```
I gave them that.
I wasn’t trying.
Ask anyone.
```

```
I didn’t get any sleep.
I’m a little under the weather.
They know it. I know it.
```

```
Luck. Repeated luck.
Which is still luck.
I checked.
```

```
Something’s off.
Cheater, cheater.
Big cheater.
```

```
That one doesn’t count.
I have my reasons.
Several, actually.
```

```
They’re on a streak.
Who the hell is this guy?
I want a background check.
```

```
That was not supposed to work.
I planned for that.
I think.
```

```
They did it again.
This is getting annoying.
Very annoying.
```

```
Why is this happening?
What is going on?
This can’t be happening.
```

```
Okay. That was good.
Annoyingly good.
I hate this.
```

### CONCEDING

```
Who am I?
What have I become?
This is humiliating.
```

```
I’m out of excuses.
There. I said it.
Back to the drawing board.
```

```
They break everything.
Every single time.
I need better traps.
```

```
They’re actually good.
There. You happy now?
You’ll never hear that again.
```

```
I tried everything.
They keep coming back.
Again and again and again.
```

```
I’m getting too old for this.
Maybe that’s the problem.
It’s definitely my age.
```

```
The talent is undeniable.
There’s nothing else to say.
I’ve got nothing.
```

```
I’ve underestimated them.
For quite a while.
That was a mistake.
```

```
They’ve earned this.
I hate admitting that.
But they have.
```

```
I know when I’m beaten.
Apparently, it’s now.
My reign is over.
```


---
## Part 4 — struck-out pairs

- ~~Easy work, that one.~~ → Not easy work.
- ~~They will tire of it.~~ → They have not tired.
- ~~Beginner's luck.~~ → Not luck. Still luck.
- ~~I am not concerned.~~ → Still not concerned.
- ~~A quiet season ahead.~~ → It has not been quiet.
- ~~They cannot read.~~ → They can read.
- ~~No one lasts a month.~~ → A month, then.
- ~~This will not continue.~~ → It continued.

The first pair used to read ~~The visitor is no trouble.~~ → Trouble, then.
The crossed-out line measured 265pt against the real 245pt page and had to
go; no shortening of it preserved the echo "Trouble, then." depends on, so
the whole pair was rewritten instead. This pair no longer says "the
visitor" — accepted: the pairs above still carry it, and "that one"
performs the same refusal by another route. She is calling a person a
thing either way.

---
## Part 5 — cut, and why

- **Game on!!!** — She does not know it is a game, and this is shouted, not written. Keep for the Hunt.
- **WTF** — Texting shorthand from a bird with a quill, and a rating risk in a word game.
- **They choked.** — Points at the player. Same class as the lines already cut. Her version takes the credit: *That was the trap, not their nerves.*
- **Bingo Bango Zingo** — Appears nowhere in the codebase — still unspent. It is a spoken catchphrase; do not burn it in a silent ledger.
- **The struggle is real.** — A recognisable internet catchphrase. Borrowed, not hers.
- **It's on for real.** — Same problem as Game on — a taunt shouted at someone.
- **Used the gold feather.** — The gold feather is the Daily reward, and the Daily does not appear in the log. The Hunt equivalent is Mercy — see §1.6.

---
## Still needed

- Verify the expanded Today-entry pools after the new handwriting font is approved; rewrite only
  lines that physically fail the new portrait-page layout.
- The line where she first writes *they* as a person rather than a dodge.
- Haunt notes per rivalry state, if state is meant to colour them.
- Today’s entries are now ten per rivalry state in the authored source; code sync still required.
- Future one-time payoff where she drops both the excuse and "the visitor" remains separate from the regular CONCEDING pool.
- Work Log pool expansions through Haunt Broken are approved; verify new lines at locked typography and rewrite only lines that physically fail.
