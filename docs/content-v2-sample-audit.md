# Content V2 Sample Audit

Scratch file for testing the V2 rebuild workflow only.

This is not production data, not final JSON, and not a replacement for any existing content
file. Existing hunt data remains placeholder/test content only.

Definitions below are internal audit notes. Final REALS come from human handles, stay within
the 8-word tile maximum, use American English, avoid fake-clever object acting, and avoid
dictionary-label tile wording.

## PRIME

```text
word: PRIME
recommendedWordType: 3

dictionaryMeanings:
  - internalDefinition: First or most important in rank, order, or likelihood.
    decision: core_real
    reason: Common American usage in phrases such as prime suspect and prime example.
  - internalDefinition: A preparatory coat applied before the main paint layer.
    decision: core_real
    reason: Everyday hardware/home-improvement meaning with a concrete visual handle.
  - internalDefinition: The peak or best period for attention, performance, or viewing.
    decision: cultural_handle
    reason: Prime time is familiar American media language and playable without definition wording.
  - internalDefinition: A whole number greater than one divisible only by itself and one.
    decision: boss_bonus
    reason: True and familiar, but risks a classroom-label tile unless handled carefully.

humanHandles:
  - meaning: First or most important.
    handle: First name on a suspect board.
  - meaning: Preparatory paint coat.
    handle: Base coat before the real color.
  - meaning: Peak broadcast/viewing period.
    handle: TV's expensive evening hour.

finalReals:
  - tile: FIRST NAME ON THE SUSPECT BOARD
    meaning: First or most important.
    sourceDecision: core_real
  - tile: BASE COAT BEFORE THE REAL COLOR
    meaning: Preparatory paint coat.
    sourceDecision: core_real
  - tile: TV'S MOST EXPENSIVE EVENING HOUR
    meaning: Peak broadcast/viewing period.
    sourceDecision: cultural_handle

trapPool:
  - tile: PLACEHOLDER ONLY
    trapType: TBD
    whyLegallyWrong: Draft only after the meaning ledger and final REALS are approved.

rejectedMeanings:
  - meaning: Prime number.
    reason: Held for boss/bonus review; current sample avoids math-label wording.
```

## PULSE

```text
word: PULSE
recommendedWordType: 3

dictionaryMeanings:
  - internalDefinition: The rhythmic beat felt in an artery as the heart pumps blood.
    decision: core_real
    reason: Common, fair American meaning with a strong human medical handle.
  - internalDefinition: A brief electronic signal or burst.
    decision: core_real
    reason: Common enough in sensors, monitors, and signals; playable through a concrete blip.
  - internalDefinition: The living mood, energy, or current feeling of a group or place.
    decision: cultural_handle
    reason: Familiar phrase in American usage, as in taking the pulse of a room.
  - internalDefinition: Edible seeds of legumes such as peas, lentils, or beans.
    decision: reject_hold
    reason: Technical/food-category use is less familiar in American everyday language.

humanHandles:
  - meaning: Heartbeat felt in an artery.
    handle: Checked before calling time of death.
  - meaning: Brief electronic signal.
    handle: One blip that says the sensor fired.
  - meaning: Mood or current feeling.
    handle: Reading the room's living mood.

finalReals:
  - tile: CHECKED BEFORE CALLING TIME OF DEATH
    meaning: Heartbeat felt in an artery.
    sourceDecision: core_real
  - tile: ONE BLIP SAYS THE SENSOR FIRED
    meaning: Brief electronic signal.
    sourceDecision: core_real
  - tile: READING THE ROOM'S LIVING MOOD
    meaning: Mood or current feeling.
    sourceDecision: cultural_handle

trapPool:
  - tile: PLACEHOLDER ONLY
    trapType: TBD
    whyLegallyWrong: Draft only after the meaning ledger and final REALS are approved.

rejectedMeanings:
  - meaning: Edible legume seed category.
    reason: Held as too technical or weak for this American-English sample pass.
```

## PUPIL

```text
word: PUPIL
recommendedWordType: 2

dictionaryMeanings:
  - internalDefinition: The dark opening in the center of the eye that changes size with light.
    decision: core_real
    reason: Common American meaning with an immediate visual handle.
  - internalDefinition: A student taught by a teacher.
    decision: core_real
    reason: Familiar school meaning and legally distinct from the eye meaning.
  - internalDefinition: A minor under legal guardianship.
    decision: reject_hold
    reason: Legal/older use is less ordinary and may feel dusty or unfair.

humanHandles:
  - meaning: Eye opening that changes with light.
    handle: Black dot shrinking in bright light.
  - meaning: Student.
    handle: Quiet kid called on by the teacher.

finalReals:
  - tile: BLACK DOT SHRINKS IN BRIGHT LIGHT
    meaning: Eye opening that changes with light.
    sourceDecision: core_real
  - tile: TEACHER CALLS ON THE QUIET KID
    meaning: Student.
    sourceDecision: core_real

trapPool:
  - tile: PLACEHOLDER ONLY
    trapType: TBD
    whyLegallyWrong: Draft only after the meaning ledger and final REALS are approved.

rejectedMeanings:
  - meaning: Legal ward or minor under guardianship.
    reason: Held as dusty/legal-specialist usage for this playable sample.
```

## ROOT

```text
word: ROOT
recommendedWordType: 3

dictionaryMeanings:
  - internalDefinition: The underground plant part that anchors the plant and takes in water.
    decision: core_real
    reason: Ordinary American English meaning; concrete, fair, and highly playable.
  - internalDefinition: The origin, source, or basic cause of something.
    decision: core_real
    reason: Common figurative meaning with strong everyday use.
  - internalDefinition: Root beer, especially as a familiar American ice-cream-float handle.
    decision: cultural_handle
    reason: Recognizable American cultural phrase; playable through a human handle.
  - internalDefinition: A number that produces another number when multiplied by itself.
    decision: reject_hold
    reason: School/math sense may be playable later, but needs separate fairness review.

humanHandles:
  - meaning: Underground plant part.
    handle: Plant part that drinks water.
  - meaning: Origin or cause.
    handle: Place where the problem started.
  - meaning: Root beer.
    handle: Beer used in an ice cream float.

finalReals:
  - tile: THE PART THAT DRINKS WATER
    meaning: Underground plant part.
    sourceDecision: core_real
  - tile: WHERE THE PROBLEM STARTED
    meaning: Origin or cause.
    sourceDecision: core_real
  - tile: ONLY BEER YOU PUT IN ICE CREAM
    meaning: Root beer.
    sourceDecision: cultural_handle

trapPool:
  - tile: PLACEHOLDER ONLY
    trapType: TBD
    whyLegallyWrong: Draft only after the meaning ledger and final REALS are approved.

rejectedMeanings:
  - meaning: Mathematical root.
    reason: Held for later review; may be too technical or classroom-label-like for this pass.
```

## RACE

```text
word: RACE
recommendedWordType: 3

dictionaryMeanings:
  - internalDefinition: A contest of speed between people, animals, vehicles, or teams.
    decision: core_real
    reason: Primary ordinary meaning with a strong playable handle.
  - internalDefinition: A campaign or contest to win an office, prize, or position.
    decision: core_real
    reason: Common American civic and competition usage.
  - internalDefinition: A demographic identity category used on American forms and census records.
    decision: cultural_handle
    reason: Familiar American form/census context; avoids clinical biological framing.
  - internalDefinition: To move or run very quickly.
    decision: reject_hold
    reason: Verb use is predictable from the speed-contest family and weaker as a separate tile.

humanHandles:
  - meaning: Speed contest.
    handle: Finish line waiting for the fastest.
  - meaning: Campaign or contest for office.
    handle: Ballots deciding who gets the office.
  - meaning: American demographic form category.
    handle: Box checked on the census form.

finalReals:
  - tile: FINISH LINE WAITING FOR THE FASTEST
    meaning: Speed contest.
    sourceDecision: core_real
  - tile: BALLOTS DECIDE WHO GETS THE OFFICE
    meaning: Campaign or contest for office.
    sourceDecision: core_real
  - tile: BOX CHECKED ON THE CENSUS FORM
    meaning: American demographic form category.
    sourceDecision: cultural_handle

trapPool:
  - tile: PLACEHOLDER ONLY
    trapType: TBD
    whyLegallyWrong: Draft only after the meaning ledger and final REALS are approved.

rejectedMeanings:
  - meaning: To move very quickly.
    reason: Held as a predictable verb extension rather than a strong distinct playable meaning.
```
