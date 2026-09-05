# POLLY — POLYBOOK LOG LINES

**Date:** 4 September 2026. Pete's additions folded in. Nothing in code.

Measured in Buggie at real size against the real page width (160pt usable).
Anything that would overflow is flagged. Lines are picked at render time from
these pools, so each must be true for **any** day in its bucket.

Voice rules: POLYBOOK_LEDGER_DESIGN.md §6. She owns her traps and nothing else,
the joke lands on her, she never credits the player, she does not know a phone
exists.
---

## Part 1 — the work log, left page

Twelve-point, her hand. One row per day.

### 1.1 Quiet day — a gap, nobody played

- Scared them off, then.
- Nobody dared. Naturally.
- Frightened them away.
- No one. They know better.
- Word must have spread.
- Afraid, I expect.
- The champ rests.
- Champion. Unchallenged.
- No challengers today.
- They stayed away. Wise.
- Hiding, I assume.
- Not brave enough today.
- Undefeated. Again.
- Too frightened, I expect.
- I am still the champ.
- Champ. Still. Obviously.
- They lost their nerve.
- Nerve failed them.
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
- Good work. Mine.
- Effortless, frankly.
- Nothing got through.
- Held everything. Note it.
- Big deal.

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
- Sloppy work. Mine.
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
- The last one is mine.
- Nowhere near the end.

### 1.5 First day

- New name in the book.
- A visitor. We'll see.
- Someone new. Hm.
- A new one. Noted.
- Another one. Fine.
- We shall see about this.

### 1.6 Mercy — the run was revived

- Let them live. Again.
- Showed mercy. Again.
- I was generous.
- Spared them. My choice.
- Let it go on. Why not.
- Gave them another.
- Too soft, as usual.

> **1.6 is a new bucket.** Verified in `polyRunEngine.ts`: the Hunt revive is
> Mercy, and the engine comment says she revives her prey rather than ending it.
> It is a Hunt event, so it is legal in the log. Thin — needs more lines.

### 1.7 Two-line rows without a word

A new row shape. The pair overflows on one line and reads better split anyway.

```
Fell for it again.
La la la la.
```

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
- Badly built. Mine.
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

### 2.2 Haunt left — walked away from

- Walked right past it.
- Left standing.
- Still shut. Good.
- Untouched. Good.
- Not today, then.
- That one holds.
- Missed entirely.
- Never even close.

### 2.3 Haunt broken — came back and took it

- Back for it. Persistent.
- Second time, then.
- Twice asked. Fine.
- I moved it too late.
- Should have changed it.
- They remembered. Hm.
- Came back. Of course.
- That one is settled.

---
## Part 3 — today's entry, right page

Fifteen-point, three short lines. Roughly nineteen characters a line.

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

### RATTLED

```
I let them have that.    [TOO WIDE 164px]
I was not trying.
Ask anyone.
```

```
Bad week. Bad light.
Bad batch.
Not about them.
```

```
Luck. Repeated luck.
Which is still luck.
I checked.
```

### CONCEDING

```
Who am I?
I doubt myself now.
Truly.
```

```
I have run out of
reasons. So.
New traps, then.
```

```
Nothing I build holds.    [TOO WIDE 168px]
Not one of them.
I need better work.
```

---
## Part 4 — struck-out pairs

- ~~The visitor is no trouble.~~ → Trouble, then.
- ~~They will tire of it.~~ → They have not tired.
- ~~Beginner's luck.~~ → Not luck. Still luck.
- ~~I am not concerned.~~ → Still not concerned.
- ~~A quiet season ahead.~~ → It has not been quiet.
- ~~They cannot read.~~ → They can read.
- ~~No one lasts a month.~~ → A month, then.
- ~~This will not continue.~~ → It continued.

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

- More MERCY lines. New bucket, seven deep.
- More CONCEDING. Thinnest pool and it is the payoff.
- The line where she first writes *they* as a person rather than a dodge.
- Haunt notes per rivalry state, if state is meant to colour them.
- Today's entries need to reach roughly ten per rivalry state — the entry is
  now re-picked daily, not only on a mood change.
- The payoff entry itself: the one where she drops both the excuse and
  "the visitor" at once.
