# POLYWORDS Game Design Document

**Meaning Mask Blitz / POLY RUN Direction**

| Brand Color | Usage |
|---|---|
| Deep Indigo | Primary background |
| Gold | Rewards, highlights, premium energy |
| Purple | Polly / arcade accents |

**Core statement**

**A fast arcade run where one word wears multiple meaning masks, and the
player has to expose the real ones before the traps bite.**

Version 1.0 - Core Gameplay GDD

> **Current working design source of truth:** This document is not permanent law, but it is the active design compass for POLYWORDS until revised.


# 1. Executive Summary

POLYWORDS is a fast, mobile-first word-meaning arcade game built around
polysemous English words: one word, multiple meanings. The player is not
handed a clue and asked to pick an answer. The word itself is the
puzzle. The player sees a word and a set of meaning masks: some are true
meanings, some are traps, and some are rare or hidden meanings. The
challenge is to expose the real meanings before the traps bite.

The core mode is POLY RUN, a short arcade session built from Meaning
Mask Blitz rounds. Each run should feel like a compact emotional
rollercoaster: confidence, flow, tension, brain glitch, relief,
surprise, panic, climax, and the immediate urge to run it back.

> **Design spine:** No clue-driven quiz flow. No dictionary definitions. No reading comprehension tests. POLYWORDS must make the player judge meaning through action.

| **Item**       | **Direction**                                                     |
|----------------|-------------------------------------------------------------------|
| Genre          | Fast arcade word game / semantic recognition game                 |
| Platform       | Mobile-first, portrait orientation, later adaptable to web        |
| Core mode      | POLY RUN built around Meaning Mask Blitz                          |
| Primary action | Tap every true meaning mask, avoid decoy masks                    |
| Session length | Target 60-120 seconds for short runs                              |
| Mascot         | Polly, a street-smart parrot guide and reactive personality layer |
| Tone           | Clever, slick, energetic, playful, never classroom-like           |
| Core hook      | I knew that word, but I missed one meaning. Run it back.          |

# 2. Product Vision

POLYWORDS should feel like a tiny arcade machine built out of language.
It is not trying to teach vocabulary in a traditional way. It is trying
to make familiar words feel unstable, surprising, and satisfying. The
player should begin a word thinking, “I know this,” then feel the floor
shift when the meaning masks appear.

## 2.1 Vision Statement

Create the most replayable mobile word game about multiple meanings by
turning semantic doubt into fast, tactile arcade action.

## 2.2 Player Promise

- Every word can surprise you.

- Every tap reveals something: truth, trap, or rare meaning.

- Every run is short enough to replay immediately.

- Every near miss feels fixable, not unfair.

- Every system reinforces the central fantasy: one word wears many
  masks.

# 3. Design Pillars

| **Pillar**                | **Meaning**                                                                             | **Design Implication**                                                                                      |
|---------------------------|-----------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Meaning through action    | The player must prove they know the meanings by tapping, revealing, and avoiding traps. | Avoid clue prompts that point to the answer. Make tiles carry the meaning challenge.                        |
| Brain glitch, then payoff | The best moment is “Wait... what? Oh, right.”                                           | Write meaning masks that are slick, compressed, visual, and fair after reveal.                              |
| One more run              | Runs must end with unfinished business.                                                 | Use near-misses, ghost tiles, next-word cliffhangers, perfect-chain meters, and revenge moments.            |
| Fair traps                | Decoys should be close enough to cause hesitation, not random.                          | Each trap needs a reason: associated idea, neighboring concept, common confusion, or close-but-not-meaning. |
| Polly as emotional glue   | Polly guides, reacts, and rewards without hijacking play.                               | Use short lines at high-emotion moments. “Word up.” is rare.                                                |
| Arcade clarity            | The game must feel fast and instantly readable on a phone.                              | Tiles must be short. Feedback must be immediate. Round rules must be obvious.                               |

# 4. Target Audience

POLYWORDS should appeal to casual mobile word-game players, puzzle fans,
language-curious players, and people who like quick daily challenges.
The tone should be smart without being academic. It should feel
accessible to casual players but deep enough for mastery chasers.

| **Audience Segment**     | **What They Want**                              | **How POLYWORDS Serves Them**                                      |
|--------------------------|-------------------------------------------------|--------------------------------------------------------------------|
| Casual word-game players | Quick rounds, satisfying feedback, easy restart | Short POLY RUN sessions and clear tap-based actions                |
| Puzzle fans              | Clever misdirection and fair challenge          | Close decoys, rare meanings, boss words, perfect clears            |
| Language lovers          | Surprising meanings and wordplay                | Slang drops, semantic evolution, rare meaning discoveries          |
| Daily habit players      | A small challenge worth checking each day       | Daily Poly Run, social proof, daily modifiers later                |
| Completionists           | Progress and mastery targets                    | Word collection, perfect chains, missed-meaning revenge list later |

# 5. Core Gameplay: Meaning Mask Blitz

Meaning Mask Blitz is the core interaction. The player sees a single
word and a group of tiles. Each tile is a meaning mask: a compact, slick
representation of either a real meaning, a decoy, or a rare hidden
meaning. The player taps every tile they believe is a true meaning of
the word and avoids traps.

## 5.1 Round Flow

1.  Word appears big and centered.

2.  Meaning masks appear as tappable tiles.

3.  Player scans the masks and taps all tiles they believe are true
    meanings.

4.  Each tap immediately reveals whether the tile is real, a trap, rare,
    slang, or hidden.

5.  The round ends when the player submits, finds all true meanings,
    runs out of lives, or a timed variation expires.

6.  Missed meanings and wrong traps are revealed in a clear, emotional
    summary.

7.  The player receives score, streak, perfect clear status, and Polly
    feedback.

## 5.2 What the Player Is Actually Doing

The player is not answering a question. The player is separating real
meanings from false neighbors. The best tile makes the player briefly
doubt whether it belongs. That doubt is the game.

## 5.3 Meaning Masks

A meaning mask is a stylized representation of a possible meaning. It
should be short, visual, tap-friendly, and clever. It should not read
like a dictionary definition. It should be slightly indirect before
reveal and clear after reveal.

| **Tile Type**     | **Purpose**                                      | **Design Rule**                             |
|-------------------|--------------------------------------------------|---------------------------------------------|
| Real meaning mask | Represents an actual meaning of the word.        | Must be fair and recognizable after reveal. |
| Trap mask         | Associated with the word but not a true meaning. | Must be close enough to create hesitation.  |
| Rare meaning mask | Represents a real but less expected meaning.     | Should create discovery and bonus reward.   |
| Slang mask        | Represents a durable cultural/slang meaning.     | Use sparingly; avoid fragile meme slang.    |
| Era mask          | Represents older vs modern semantic use.         | Keep it playable, not lecture-like.         |

# 6. No-Clue Rule and Design Guardrails

The most important guardrail is that POLYWORDS should not become
clue-driven. A clue tells the player what to think. A meaning mask asks
the player to judge whether a possible meaning belongs. This difference
is the identity of the game.

> **Hard rule:** No clue prompts. No hint sentences. No “pointing the player to the answer.” The word and the meaning masks must carry the challenge.

## 6.1 Avoid These Patterns

- Question prompts that ask for a single answer.

- Sentence context clues that make the intended meaning obvious.

- Dictionary-style definitions on tiles.

- Random decoys that are clearly nonsense.

- Long reading tasks that slow down arcade flow.

- Mascot explanations that solve the meaning for the player.

## 6.2 Keep These Patterns

- Short meaning masks with attitude and visual punch.

- Decoys that feel close, guilty, or “nearby” but are not meanings.

- Rare meanings that create discovery.

- Immediate reveal feedback after every tap.

- End-of-word summaries that show what was missed and why it hurt.

# 7. POLY RUN Session Structure

POLY RUN is the primary session wrapper. Instead of asking players to
manually choose many separate modes, the game conducts them through a
short run with controlled variation. The player experiences a shaped
emotional arc rather than a flat set of repeated questions.

## 7.1 Run Length

- Target: 60-120 seconds for a short run.

- Early prototype: 8-10 rounds.

- Daily run: 8-12 rounds, curated.

- Extended modes later: 15-20 rounds for advanced play.

## 7.2 Emotional Arc

| **Beat**          | **Player Emotion** | **Purpose**                                                  |
|-------------------|--------------------|--------------------------------------------------------------|
| Opening word      | Confidence         | Player feels capable immediately.                            |
| Second word       | Flow               | Streak begins and speed feels good.                          |
| Speed beat        | Tension            | Pressure spikes without changing the core rules.             |
| Brain-glitch beat | Surprise           | A variation flips the expectation.                           |
| Relief beat       | Recovery           | Player gets a familiar or slower round.                      |
| Surprise beat     | Freshness          | Slang, hidden, or rare meaning changes the flavor.           |
| Panic beat        | Adrenaline         | Second speed or close-decoy round increases stakes.          |
| Boss beat         | Climax             | Hardest word creates near-miss and pride.                    |
| Results           | Regret and replay  | Show missed meaning, ghost tile, next word, and Run It Back. |

## 7.3 Variable Round Mix

Players should know a run may contain a boss, a surprise, and a rare
meaning, but not exactly when they appear. This creates curiosity
without chaos. The system should randomize within rules, not purely
randomize everything.

# 8. Round Types and Variations

All round types should orbit the core mechanic. Variations can change
pressure, tile count, penalties, rewards, or presentation, but they
should not drift into reading-comprehension clue gameplay.

| **Round Type**              | **Core Change**                                          | **Emotional Role**               |
|-----------------------------|----------------------------------------------------------|----------------------------------|
| Standard Meaning Mask Blitz | Normal tile count, no special modifier.                  | Confidence and flow.             |
| Speed Round                 | Timer pressure or faster decision window.                | Adrenaline and urgency.          |
| Boss Word                   | More real meanings, more decoys, heavier penalty.        | Climax and pride.                |
| Hidden Meaning              | One or more real meanings are obscured until discovered. | Curiosity and discovery.         |
| Slang Drop                  | A durable slang/cultural meaning appears.                | Surprise and freshness.          |
| Semantic Evolution          | Old and modern meanings coexist.                         | Cleverness and cultural depth.   |
| Switchback Bonus            | Meanings point back toward one word.                     | Brain-glitch break, used rarely. |
| Hidden Word Bonus           | Meanings identify a hidden word in a small grid.         | Breather and visual variety.     |
| Daily Modifier              | A temporary rule or boon affects the run.                | Habit and FOMO.                  |

# 9. Emotional Engagement Model

The core emotional engine is semantic doubt under light pressure. The
player should feel smart, then uncertain, then rewarded or stung, then
motivated to try again.

## 9.1 The Per-Word Emotional Arc

| **Moment**      | **Internal Player Reaction** | **Design Lever**               |
|-----------------|------------------------------|--------------------------------|
| Word appears    | I know this word.            | Familiar word choice.          |
| Masks appear    | Wait, how many meanings?     | Tile count and mask variety.   |
| First tap       | Easy.                        | Obvious real meaning.          |
| Suspicious tile | Is that real or just nearby? | Close decoy.                   |
| Wrong tap       | Damn, I got baited.          | Fair trap and red reveal.      |
| Rare reveal     | I did not know that counted. | Rare meaning bonus.            |
| Perfect clear   | I owned that word.           | Bonus, animation, Polly line.  |
| Missed meaning  | I can fix that.              | Results screen and ghost tile. |

## 9.2 Brain-Glitch Design

A good POLYWORDS moment is not confusion for confusion’s sake. It is a
fast mental flip from disbelief to recognition. The player should be
able to say, “At first I thought that was nonsense, then I realized why
it belonged.”

## 9.3 Fairness Test

> **Fairness test:** After a wrong tap or missed meaning, the player should think: “I should have caught that,” not “the game cheated me.”

# 10. Replay and Addiction Loop

POLYWORDS should create “one more round” through skill, near-miss,
reveal rhythm, unfinished business, and mastery pursuit. The goal is
addictive game feel, not manipulative monetization.

## 10.1 Seven Replay Triggers

| **Trigger**              | **Why It Hooks**                        | **POLYWORDS Implementation**                                                   |
|--------------------------|-----------------------------------------|--------------------------------------------------------------------------------|
| Variable reward schedule | Predictability kills replay.            | Run contains known ingredients in shifting order: boss, rare, surprise, speed. |
| Near-miss effect         | Losing by one tile feels fixable.       | Results emphasize missed meaning or one decoy that fooled the player.          |
| Zeigarnik effect         | Unfinished tasks linger in memory.      | Show the next waiting word or ghost tile after a run.                          |
| Micro-progression        | Tiny wins keep attention alive.         | Meaning reveal points, perfect clear, chain meter, word collection.            |
| Loss aversion + comeback | Players hate losing streaks.            | Streak freeze, revenge round, recoverable mistake window.                      |
| Social proof / FOMO      | Players want to know how others did.    | Daily stats like “players cleared today,” without harsh leaderboards.          |
| Juice + feedback         | Game feel makes repetition pleasurable. | Particles, haptics, sound, tile flip, screen pulse, Polly reactions.           |

## 10.2 One-More-Run Hooks

- Ghost Tile: missed meanings linger after the run and invite a revenge
  attempt.

- Revenge Meter: mistakes fill a meter that can trigger a missed-word
  run.

- Perfect Chain: clearing multiple words perfectly creates a chaseable
  bonus.

- Next Word Cliffhanger: results screen shows the next word waiting.

- Boss Near-Miss: boss words are hard enough to create immediate
  run-back motivation.

- Daily Run: a curated, time-bound run creates habit without needing
  heavy pressure.

## 10.3 Results Screen Philosophy

The results screen is not an ending. It is a launchpad for the next run.
It should show success, sting, and unfinished business. The primary
action should be Run It Back. Home can exist, but it should not be the
emotional focus.

# 11. Scoring and Rewards

Scoring should reward truth, discovery, accuracy, streaks, and pressure.
It should be legible enough for casual players but deep enough to chase.

| **Action**              | **Reward / Penalty**                  | **Purpose**                       |
|-------------------------|---------------------------------------|-----------------------------------|
| Tap real meaning        | Base score gain                       | Immediate positive reinforcement. |
| Tap rare/hidden meaning | Large bonus                           | Discovery spike.                  |
| Perfect clear           | Large bonus and Polly reaction        | Mastery reward.                   |
| Speed clear             | Multiplier                            | Pressure reward.                  |
| Boss clear              | Multiplier or boss bonus              | Climax reward.                    |
| Tap decoy               | Life loss, score penalty, streak risk | Creates stakes.                   |
| Miss real meaning       | Revealed at end, near-miss sting      | Replay hook.                      |
| Perfect chain           | Special bonus and visual effect       | Micro-progression chase.          |

## 11.1 Lives and Failure

Failure should be sharp but recoverable. Standard runs should allow a
few mistakes. Boss words can be more punishing. The punishment should
never feel like a dead stop unless the player is deep into a high-stakes
round.

## 11.2 Streak Freeze

A future comeback mechanic can freeze the streak on the first mistake.
The player must tap a small number of real meanings quickly to save it.
This turns a mistake into a rescue moment instead of immediate collapse.

# 12. Difficulty Curve

The game should seduce first, then sharpen. Early rounds should make
players feel smart. Mid-run should introduce traps and rare meanings.
Late-run should apply pressure through boss words, close meanings, and
higher stakes.

| **Difficulty Layer**   | **How It Increases**                                           |
|------------------------|----------------------------------------------------------------|
| Tile count             | More total masks on screen.                                    |
| Real meaning count     | More meanings must be found.                                   |
| Decoy closeness        | Traps become more semantically adjacent.                       |
| Rare meaning frequency | Less common meanings appear later.                             |
| Penalty weight         | Bosses and late rounds punish wrong taps more.                 |
| Time pressure          | Speed rounds compress decision time.                           |
| Abstractness           | Later words include more abstract or domain-specific meanings. |

## 12.1 Difficulty Principles

- Never make early rounds feel like a test.

- Introduce only one new pressure at a time.

- Bosses should be hard but readable.

- Rare meanings should feel surprising, not impossible.

- Close decoys should create hesitation, not ambiguity that feels
  unfair.

# 13. Content Design System

Content quality is the game. A brilliant mechanic with weak masks
becomes a quiz. Every word needs curated meanings, masks, reveal labels,
decoys, reasons, difficulty, and emotional role.

## 13.1 Word Data Requirements

| **Field**                   | **Purpose**                                                     |
|-----------------------------|-----------------------------------------------------------------|
| word                        | The visible puzzle word.                                        |
| difficulty                  | Controls tile count, decoy closeness, penalties, and placement. |
| emotionalRole               | Confidence, flow, surprise, boss, relief, panic, etc.           |
| roundType                   | Standard, speed, boss, slang, hidden, semantic evolution, etc.  |
| tiles                       | All meaning masks and decoys for the word.                      |
| mask                        | The pre-reveal tile language.                                   |
| reveal                      | The clear post-tap truth label.                                 |
| isReal                      | Whether the mask is a true meaning.                             |
| isRare / isHidden / isSlang | Special reward flags.                                           |
| decoyReason                 | Why the trap is tempting but false.                             |
| Polly hooks                 | Possible reaction line categories.                              |

## 13.2 Meaning Mask Writing Rules

- Use compact language, ideally two to four words.

- Prefer visual or tactile phrasing over abstract labels.

- Avoid full sentence clues.

- Avoid definitions that sound copied from a dictionary.

- Make the mask feel slightly surprising but clear after reveal.

- For decoys, write something that “hangs nearby” the meaning space.

## 13.3 Decoy Types

| **Decoy Type**       | **Description**                                        |
|----------------------|--------------------------------------------------------|
| Associated neighbor  | Closely associated with the word but not a meaning.    |
| Domain neighbor      | Lives in the same topic area as a true meaning.        |
| Almost synonym       | Looks close but crosses the meaning line.              |
| Visual neighbor      | Shares imagery with the word but not semantic meaning. |
| Common misconception | A thing players may casually assume is a meaning.      |

# 14. Polly Mascot System

Polly is the emotional glue of POLYWORDS. She is a confident,
street-smart parrot who loves wordplay, reacts to big moments, and gives
the game a recognizable voice. She should not become the teacher or the
star over the word puzzle.

## 14.1 Polly Personality

| **Trait**          | **Direction**                                         |
|--------------------|-------------------------------------------------------|
| Smart              | Knows words are slippery.                             |
| Quick              | Short lines, fast reactions.                          |
| Slightly sarcastic | Attitude toward the word/trap, never cruel to player. |
| Welcoming          | Guides without babying.                               |
| Streetwise         | Modern, stylish, hoodie/cap energy.                   |
| Restrained         | Does not talk every tap.                              |

## 14.2 Polly Usage Rules

- Use Polly at high-emotion points: run start, boss intro, rare meaning,
  wrong streak, perfect clear, results.

- Do not make Polly explain the answer.

- Do not overuse catchphrases.

- “Word up.” is a rare positive stamp, not a default line.

- Polly should soften failure without removing stakes.

## 14.3 Visual Direction

Polly should feel brandable and game-like: green parrot, oversized
orange beak, expressive eyebrows, purple hoodie, sideways cap or
streetwear accents, gold/purple details, confident half-smirk. The
visual tone should avoid classroom mascot energy.

# 15. Visual Design Direction

The visual identity should be premium arcade wordplay: deep indigo
background, gold reward moments, purple energy, clean white type, and
Polly’s green/orange silhouette as a brand anchor.

| **Element**      | **Direction**                                                       |
|------------------|---------------------------------------------------------------------|
| Background       | Deep indigo, rich and game-like.                                    |
| Primary accent   | Gold for reward, perfect, rare, and boss moments.                   |
| Secondary accent | Purple for energy, special rounds, and Polly wardrobe.              |
| Correct feedback | Green flash, pop, confirmation.                                     |
| Wrong feedback   | Red snap/shake, clear trap reveal.                                  |
| Tile design      | Rounded, tactile, high contrast, readable at thumb distance.        |
| Typography       | Bold, chunky, readable, not academic.                               |
| Motion           | Fast flips, small bursts, screen pulses, restrained character pops. |

## 15.1 UI Priorities

- The word must be the visual anchor.

- Tiles must be instantly tappable and readable.

- Feedback must happen immediately after every tap.

- Special rounds should feel different but not require relearning the
  app.

- Results screen must create a desire to restart.

# 16. Audio, Haptics, and Juice

Game feel is a major part of the replay hook. POLYWORDS should use
short, clean sounds and haptics to make every reveal feel physical.

| **Moment**    | **Feedback Direction**                                |
|---------------|-------------------------------------------------------|
| Correct tap   | Soft pop/chord, green flip, small haptic.             |
| Wrong tap     | Short buzz/record scratch, red shake, sharper haptic. |
| Rare meaning  | Gold burst, rising sparkle sound, stronger haptic.    |
| Perfect clear | Chord, screen pulse, Polly reaction.                  |
| Boss intro    | Low hit, gold frame, Polly serious pose.              |
| Streak save   | Tension snap into relief sound.                       |
| Run complete  | Short reward flourish, not too long.                  |

## 16.1 Audio Rules

- Sounds must be short: mostly 0.1 to 0.4 seconds.

- No long jingles during active play.

- Avoid annoying repeated wrong sounds.

- Audio should support speed, not slow the game down.

# 17. Progression Systems

Progression should enhance the core loop, not replace it. The game
should be fun before any meta-progression is added.

## 17.1 MVP Progression

- Best score per run.

- Perfect clears count.

- Missed meanings history.

- Boss words cleared.

- Daily run result.

## 17.2 Later Progression

- Word collection / Word Garden: cleared words and discovered meanings
  become collectible entries.

- Polly cosmetic unlocks: hats, poses, stickers, reaction cards, used
  carefully.

- Perfect chain badges.

- Rare meaning collection.

- Daily streaks and weekly challenge packs.

## 17.3 Progression Guardrails

- Do not bury fun behind currency.

- Do not overcomplicate early builds with shops or economies.

- Rewards should celebrate mastery and discovery, not grind.

# 18. Daily Run and Retention

Daily Poly Run should become the cleanest retention feature once the
core loop is tuned. Everyone receives the same curated run, with light
social proof and a simple personal score chase.

| **Feature**         | **Purpose**                                                             |
|---------------------|-------------------------------------------------------------------------|
| Daily curated run   | Creates habit and shareable challenge.                                  |
| Daily boss word     | Gives the day a focal challenge.                                        |
| Gentle social proof | Shows how many players cleared or missed key words.                     |
| Daily modifier      | Adds novelty with a temporary boon or twist.                            |
| Result card         | Makes the outcome shareable without requiring competitive leaderboards. |

## 18.1 Avoid

- Aggressive leaderboards that scare casual players.

- Punishing streak loss that makes players quit.

- Daily content that is too obscure or unfair.

# 19. Monetization Direction

The monetization model should respect the arcade-word-game identity.
Early priority is gameplay validation, not monetization. Later, the
safest directions are cosmetic, content-pack, or premium upgrade models.

| **Model**              | **Fit**     | **Notes**                                                    |
|------------------------|-------------|--------------------------------------------------------------|
| Ad-supported free play | Medium      | Could work, but ads must not interrupt the short run rhythm. |
| Premium unlock         | High        | Pay once to remove ads and unlock extra packs/modes.         |
| Cosmetic Polly items   | Medium-high | Only if cosmetics do not clutter the brand.                  |
| Themed word packs      | High        | Slang, phrase origins, advanced packs, daily archive.        |
| Energy systems         | Low         | Risky; can damage one-more-run feel.                         |
| Pay-to-win boosters    | Very low    | Avoid. Undercuts mastery and fairness.                       |

# 20. MVP Scope

The MVP should prove one thing: the corrected gameplay loop is fun
enough to replay. Everything else is secondary.

## 20.1 MVP Must-Haves

- Meaning Mask Blitz core round.

- 8-10 word POLY RUN.

- Real meaning tiles, decoy tiles, rare/hidden tiles.

- Immediate tap reveal feedback.

- Score, lives, streak, perfect clear.

- Results screen with missed meanings and Run It Back.

- Basic Polly reactions.

- Brand colors and readable mobile UI.

## 20.2 MVP Nice-to-Haves

- Speed modifier.

- Boss word modifier.

- Ghost tile on results screen.

- Basic audio/haptic integration.

- Simple home screen with best score.

## 20.3 Not MVP

- Large word database integration.

- Account system.

- Shop/economy.

- Arena/multiplayer.

- Full Word Garden.

- Advanced onboarding and daily run backend.

# 21. Technical Design Notes

The project should keep gameplay data separate from engine logic and UI
presentation. This will prevent design drift and make it easier to test
round structures.

| **Layer**     | **Responsibility**                                             |
|---------------|----------------------------------------------------------------|
| Content data  | Words, tiles, masks, reveal labels, decoy reasons, difficulty. |
| Game engine   | Round state, scoring, lives, streak, outcomes, transitions.    |
| Store/state   | Expose game actions to screens and components.                 |
| UI components | Render word, tiles, results, Polly, feedback.                  |
| Audio/haptics | Trigger short feedback at state changes.                       |

## 21.1 Recommended Components

- GameScreen: route and high-level layout.

- MeaningMaskRound: core round component.

- MeaningTile: tile rendering and reveal state.

- ResultsScreen: run summary and replay hooks.

- PollyController: reaction selection and display.

- TopBar: score, lives, streak, progress.

- polyRunSession.ts: curated run data.

- polyRunEngine.ts: pure state transitions.

## 21.2 State Requirements

- Current word index and run progress.

- Selected/revealed tile states.

- Remaining true meanings.

- Mistakes and lives.

- Score, streak, perfect chain, modifiers.

- Missed meanings and decoys hit for results.

- Polly trigger events.

# 22. Onboarding

Onboarding should teach through action. The first run should make the
rule clear without a long tutorial. Since the game has no clue prompts,
the onboarding must explain the meaning-mask concept quickly and then
let the player experience it.

## 22.1 First-Time Flow

8.  Show the core statement in plain language: “Tap every real meaning.
    Avoid traps.”

9.  Start with an easy familiar word and few tiles.

10. Use immediate reveals so the player learns the tile logic.

11. Show a near-miss result if they miss a meaning.

12. Offer Run It Back immediately.

## 22.2 Onboarding Guardrails

- Do not explain polysemy with a long lesson.

- Do not use clue sentences to teach the mechanic.

- Do not let Polly over-explain.

- Use the first 30 seconds to create confidence, not confusion.

# 23. Risks and Mitigations

| **Risk**                  | **Why It Matters**            | **Mitigation**                                                       |
|---------------------------|-------------------------------|----------------------------------------------------------------------|
| Game drifts back to clues | Becomes a vocabulary quiz.    | Pin the no-clue rule in design and code reviews.                     |
| Masks are too vague       | Player feels cheated.         | Require reveal labels and decoy reasons for every tile.              |
| Decoys too random         | No meaningful tension.        | Use associated-neighbor or close-meaning decoys.                     |
| Too hard too soon         | Players quit before the hook. | Easy opening words and low penalty early.                            |
| Too many systems          | Prototype becomes scattered.  | MVP only tests Meaning Mask Blitz and core run.                      |
| Polly overtalks           | Mascot becomes annoying.      | Budget Polly lines to high-emotion moments.                          |
| Word up overused          | Signature line loses charm.   | Use 0-2 times per 10-round run.                                      |
| Game feels static         | No arcade energy.             | Add juice, score popups, quick reveals, perfect chain, boss effects. |

# 24. Future Modes and Expansion

Future modes should expand the POLYWORDS universe but remain subordinate
to the core. A mode is valid only if it reinforces meaning judgment,
semantic surprise, or wordplay action.

| **Future Feature** | **Role**                                           | **Priority**              |
|--------------------|----------------------------------------------------|---------------------------|
| Switchback         | Bonus brain-glitch variation.                      | Test soon.                |
| Hidden Word        | Visual breather using meanings to identify a word. | Test soon.                |
| Echo Round         | Sound-alike/homophone bonus.                       | Later.                    |
| Phrase Break       | Short language curiosity reward.                   | Later.                    |
| Crossroads         | Context interpretation mode.                       | Later expansion.          |
| Scholar’s Cave     | Advanced recall/mastery.                           | Much later.               |
| Arena              | Competitive/asynchronous runs.                     | Much later.               |
| Word Garden        | Collection/progression system.                     | After core fun is proven. |

# 25. Success Metrics

The most important metric is not content volume. It is whether players
want another run after a short session.

| **Metric**            | **Target Signal**                                              |
|-----------------------|----------------------------------------------------------------|
| Run completion rate   | Players finish a 60-120 second run.                            |
| Immediate replay rate | Players press Run It Back after results.                       |
| Near-miss replay rate | Players replay after missing one meaning or hitting one decoy. |
| Perfect clear pursuit | Players repeat to improve perfect count.                       |
| Boss retry rate       | Players retry after boss failure.                              |
| Session length        | Multiple short runs per session.                               |
| Confusion reports     | Low reports of “I did not know what to do.”                    |
| Fairness reports      | Wrong taps feel understandable after reveal.                   |

# 26. Immediate Next Steps

13. Replace clue-driven gameplay with Meaning Mask Blitz.

14. Create a curated 8-10 word prototype run with real masks, traps,
    rare meanings, and boss word.

15. Build the tile reveal loop: correct, decoy, rare, missed, perfect
    clear.

16. Build a results screen that emphasizes near-miss and Run It Back.

17. Add basic Polly reactions and protect “Word up.” as rare success
    stamp.

18. Test the prototype with one question: “Did you want another run?”

19. Only after the loop works, refactor and expand content systems.

# 27. Final Design Statement

POLYWORDS is a fast arcade run where one word wears multiple meaning
masks, and the player has to expose the real ones before the traps bite.
The fun is not being told what a word means. The fun is realizing how
many masks the word was wearing, catching the real ones, dodging the
fake ones, and feeling the sting of the one meaning you should have
remembered.

> **North star:** The word is the puzzle. The masks are the battlefield. The reveal is the reward. The near miss is the hook.
