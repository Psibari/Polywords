# POLYWORDS Stranger Playtest Plan

Written 2026-11-21 for Pete's first test with people who don't know him. Friends liked the game; this test is about what strangers do when nobody is there to explain it.

## What we want to learn

1. **Do they get it without help?** How many finish the first FINE Hunt, and where do the rest stop?
2. **How far do they get?** Deaths by round, how many reach the Boss in round 8, how many master it.
3. **Do they come back?** A second and third day, and whether they play the Daily.
4. **Which cards feel unfair or confusing?** Exact cards, with screenshots.
5. **How Polly lands.** Funny, annoying, or not noticed.

The numbers come from **Settings > Share Debug Stats** on each tester's phone. Nothing is sent automatically (see `PRIVACY_TEXT`), so testers have to tap it and send it. The ask below makes that one step.

## Before posting anything

1. **Build.** Make a TestFlight build of the current `play-screen-overhaul` head. It must include 8 rounds, full variety, the two-step Daily onboarding and the Boss audit. Friends are on older builds.
2. **New external group called `Strangers`.** Keep it separate from the friends group. That way you can see how many strangers joined, and their feedback isn't mixed in with your friends'.
   - App Store Connect > POLYWORDS > TestFlight > External Testing > the + button > name it `Strangers`.
   - Add the new build. Apple reviews it automatically before testers can get it. Builds after the first one are usually quicker. Wait for "Ready to Test".
   - Turn on **Public Link**. Set a tester limit (50 is plenty for a first round). Under criteria, pick iPhone only.
3. **Test Information.** Your friends group already made you fill this in. Update **What to Test** with the text below for this build.
4. **Feedback form.** Make a free Google Form with the questions below. Put its link in the tester message. It's the easiest way for strangers to send the stats.

## Text to paste into App Store Connect

**Beta App Description**

> POLYWORDS is a word game about words with more than one meaning. Every word has a handful of cards. Some are real meanings of the word, some are traps written to sound right. Swipe UP to claim a real meaning, swipe RIGHT to reject a trap. Polly, a smug parrot, wrote the traps and wants you to fall for them. Survive eight rounds to reach Polly's Word, her hardest one. There's also a Daily Challenge: one puzzle a day, three clues, one answer.

**What to Test** (update for each build)

> Thanks for testing! Please play the game the way you normally would and don't look anything up.
> 1. Play at least 5 Hunts over 2 or 3 days, and the Daily Challenge if you like.
> 2. If a card seems unfair, wrong or confusing, take a screenshot. TestFlight lets you send it to me with a note.
> 3. When you're done, open Settings (the gold gear, bottom-left of the home screen) > Share Debug Stats, copy the text, and paste it into the feedback form along with your answers. It only has game results: no name, no contacts, nothing personal.

**Review Notes** (for Apple's reviewer)

> No account or sign-in. No purchases or ads in this build. To play, tap ENTER THE HUNT on the home screen. Swipe UP on cards that are real meanings of the word and RIGHT on cards that aren't. The first Hunt teaches the controls. Daily Challenge: tap DAILY CHALLENGE and swipe UP on the word that fits all three clues.

## Tester message

Use this for Reddit posts, DMs and texts. Swap in the two links.

> **Looking for testers: POLYWORDS, a word game where a parrot tries to trick you (iPhone, free, TestFlight)**
>
> I'm a solo dev, about to launch my first game, and I need people who don't know me to play it honestly.
>
> Every word has a handful of cards. Some are real meanings, like "what Babe Ruth swung" for BAT. Some are traps that sound right but aren't, like "what a player swings to serve an ace" (that's a racket, not a bat). Swipe up to claim, swipe right to reject. Get fooled too many times and Polly wins. Survive 8 rounds to face her hardest word.
>
> What I'm asking: play 5 or more Hunts over a couple of days, screenshot anything that feels unfair, then fill in a 2-minute form (it asks you to paste your stats from Settings > Share Debug Stats).
>
> Join: [TestFlight public link]
> Form: [Google Form link]
>
> You'll need the free TestFlight app from the App Store. Brutal honesty welcome.

The BAT example uses two live cards (`bat` REAL "WHAT BABE RUTH SWUNG" and trap "WHAT A PLAYER SWINGS TO SERVE AN ACE", checked 2026-11-21). Pete allows real tiles in public posts. Re-check they're still live before posting.

## Feedback form questions

1. Paste your stats here (Settings > Share Debug Stats). *(long answer)*
2. Did you understand how to play from the first Hunt, without help? *(Yes / Mostly / No)*
3. If anything confused you, what was it? *(short answer)*
4. Did any card feel unfair, like you were right and the game said you were wrong? Which word and card? *(long answer, optional)*
5. How often did you want to play "one more"? *(Never / Sometimes / Every time)*
6. Did you play the Daily Challenge? Would you come back for it tomorrow? *(Yes / Maybe / No)*
7. Polly: funny, annoying, or didn't notice her? *(choice + optional comment)*
8. Anything else? *(long answer, optional)*

## Where to find strangers

Free channels only (marketing budget is $0 for now). Post in a few places over several days rather than all at once, and read each community's rules before posting.

- **Tester communities, built for this:** r/TestFlight, r/betatests, r/TestMyApp, r/playmygame. Post the tester message as is.
- **r/iosgaming:** self-promotion is allowed on Saturdays only (Developer Saturday), so post there on a Saturday.
- **TouchArcade forums, Upcoming Games section:** long-standing place where iPhone gamers try betas.
- **Word-game and puzzle communities** (Wordle, Connections, crossword groups): the best-fit players, but many ban self-promotion. Only post where the rules allow it or a mod says yes.
- **People near you who aren't your friend group:** coworkers, other people's group chats, a local Discord. Even 5 to 10 real strangers is worth more than 50 drive-by installs.

Expect lots of people to install and only some to play or send stats. Getting about 20 stat pastes is a good first round.

## Timeline

1. **Day 0:** build, Strangers group, review, public link live.
2. **Days 1-3:** post to two or three places a day.
3. **Days 4-7:** let people play. Answer screenshot feedback in TestFlight.
4. **Day 7 or 8:** close the link (or leave it open). Bring the form answers and stat pastes to a session to read them together.

## Stats targets (settled 2026-11-21)

Share Debug Stats compares players against 54% survive and 25% master (`SURVIVE_TARGET_PCT`, `MASTER_TARGET_PCT` in `app/game/playtestTelemetry.ts`). These came from a July simulation that can't be reproduced, and have never been measured against real players. Pete asked for Claude's call: keep both as design goals, not predictions. About half of Hunts should reach the end, and about one in four should master Polly's Word. This test is the first real check. If strangers come in well under 54% survive, the early Hunt is still too punishing. Revisit the numbers only after real stat pastes are in.
