# POLYWORDS --- Polybook Living Journal

**Status:** Canonical product direction\
**Decision state:** LOCKED V1 interior architecture and approved visual treatment\
**Date:** 2026-10-02

> **Implementation warning**
>
> Do not implement future interactive features merely because they
> appear in this document. Only items explicitly marked **LOCKED** and
> **V1** are current implementation requirements. **EXPERIMENTAL**,
> **FUTURE**, and **DEFERRED** concepts require Pete's explicit approval
> before implementation.

------------------------------------------------------------------------

## 1. Product Vision

Polybook is no longer a stats screen arranged to resemble an open book.

Polybook is **Polly's actual book**: a persistent, expandable,
increasingly interactive journal that records the rivalry between Polly
and the player.

The player should want to open Polybook because they are curious:

> **What did that bird write about me today?**

Over time, the book should feel used, personal, funny, slightly private,
and increasingly shared between Polly and the player.

Polybook's long-term purpose is not merely to store progress. It is to
become a place where the relationship between Polly and the player
develops.

------------------------------------------------------------------------

## 2. Core Experience

The intended experience is:

**Closed Polybook → choose a section → book opens → full portrait page →
navigate sections with physical forked ribbons**

The physical-book metaphor remains central, but the inside of the book
must be designed for a portrait phone screen rather than forcing a
miniature desktop-style book spread onto a phone.

### LOCKED

-   Polybook first appears as a **closed physical book**, visually
    connected to the book already established in POLYWORDS.
-   The closed book acts as the Polybook hub.
-   The player chooses a section and the book physically opens to that
    section.
-   Once open, one portrait page uses essentially the full usable phone
    screen.
-   The old miniature two-page spread is not the redesign direction.
-   Horizontal left/right page navigation is retired from the redesign
    direction.
-   Sections use the existing **forked ribbon/bookmark language** as
    navigation.
-   The ribbons behave conceptually like dividers in a multi-subject
    notebook.
-   Each ribbon owns a separate full-page or vertically scrollable
    experience.
-   The section system must support additional ribbons later without
    requiring another Polybook redesign.

------------------------------------------------------------------------

## 3. Ribbon Navigation

The existing forked ribbon/bookmark form should become Polybook's
section-navigation language.

Do **not** turn these into modern pill tabs or generic rectangular UI
buttons.

Ribbons should remain visibly part of the physical book.

While the book is open, section ribbons may remain visible along the
page edge. The selected ribbon should have a clear physical selected
state, such as being pulled forward, extending farther, receiving
restrained gold emphasis, or another approved physical treatment.

The ribbon component must support a variable section list.

### Initial V1 ribbons

1.  **TODAY**
2.  **JOURNAL**
3.  **MASTERY**

MASTERY is the fixed navigation label. The player's actual profile name appears inside the
mastery page so long legal names never have to shrink into ribbon text. Three sections are enough for V1. Do not invent additional sections
merely because the architecture can support them.

### Locked design principle

> **A new Polybook feature earns a ribbon. It does not compete for space
> on an existing page.**

A future section must create a genuine reason to open Polybook.
Available physical space is not sufficient justification for adding a
section.

------------------------------------------------------------------------

### LOCKED 2026-10-03 — open-book ribbon treatment

- Open navigation is **TODAY / JOURNAL / MASTERY**.
- Ribbon position, scale, material, selected-state behavior, and labels are device-approved.
- The straight top section of each ribbon artwork is masked so the bookmark reads as tucked
  beneath the bottom page edge rather than pasted across the parchment.
- Preserve the single approved open-book artwork. A split base/pages layering experiment was
  tested, looked wrong on device, and was reverted.
- Do not reopen this treatment without a demonstrated regression.

## 4. TODAY

**TODAY** is Polly's current page.

For V1 it contains Polly's current authored entry using the existing
approved rivalry-state system and authored copy.

The page should provide enough usable writing space for the approved
three-line entries without ellipsis caused by arbitrary legacy width
constraints.

TODAY should feel like Polly wrote in the book, not like a game placed
text inside a parchment UI card.

### Mood-color direction

The experiment that colored Polly's handwriting by mood was rejected on device. It made the
writing feel pasted onto the parchment and reduced readability.

The current direction is:

-   Polly's entry uses one dark, high-contrast ink.
-   Mood color moves to a substantial accent bar directly under TODAY rather than tinting the
    body writing.
-   **AMUSED = Polly green**.
-   **No brown** in the mood system.
-   The remaining state colors are still experimental and must be judged together so the page
    reads as one book, not a rainbow UI.
-   Mood color is a secondary character signal. Readability wins every conflict.

### Long-term role

TODAY is the natural future home of direct Polly/player interaction.

Eventually it may contain:

-   Polly's current entry.
-   A prior player note.
-   Polly's reaction or reply.
-   Cross-outs.
-   Arrows.
-   Margin comments.
-   Small doodles.
-   Other physical evidence that Polly has interacted with what the
    player left behind.

The interactive functionality itself is **not V1**.

------------------------------------------------------------------------

## TODAY — LOCKED 2026-10-02

TODAY is approved after physical-phone testing across all five rivalry moods and the authored
entry variations. Do not reopen this visual system without a demonstrated regression.

Locked treatment:

- full portrait-page composition and current date / TODAY / entry hierarchy;
- approved heavier handwriting treatment at the current size and spacing;
- Polly's entry uses dark neutral ink, never mood-colored body text;
- rivalry mood is communicated by the 9px rounded bar beneath TODAY;
- the mood bar uses a soft same-color glow and one entrance pulse, then settles;
- AMUSED uses Polly green; the full five-state mood treatment has been device-reviewed;
- existing authored TODAY pools remain the source of copy;
- DEV controls may cycle moods and entries for testing only;
- open-page content is gated until the book artwork is ready, preventing the mood bar or other
  page UI from flashing before the open book appears.

TODAY is now a baseline for the rest of the Polybook. JOURNAL should inherit its legibility and
physical-written-page character without copying TODAY's mood treatment mechanically.

## 5. JOURNAL

**JOURNAL** is the chronological living history of the rivalry.

It replaces the idea that every type of history must occupy its own
permanent dashboard territory.

Journal history may eventually include:

-   Prior Polly entries.
-   Work Log material.
-   Player notes.
-   Polly replies.
-   Mastery events.
-   Haunt events.
-   Significant Daily events.
-   Doodles.
-   Corrections.
-   Crossed-out remarks.
-   Ink marks.
-   Other meaningful rivalry moments.

History should feel accumulated rather than generated as disposable
chat.

When future player/Polly exchanges occur, earlier exchanges should
remain part of the journal so the player can revisit the history of the
relationship.

------------------------------------------------------------------------

### JOURNAL pagination — approved architecture

JOURNAL is the first consumer of the reusable Polybook page-turn system.

- Polybook overflow creates physical pages, not an infinite vertical scroll.
- JOURNAL keeps each logical entry intact and groups entries into pages according to their
  estimated rendered height; do not shrink the approved handwriting merely to fit more rows.
- Visible navigation reads **PAGE X OF Y** with previous/next page controls.
- A horizontal swipe also turns pages.
- Page content is clipped to the parchment viewport; writing must never travel over the book
  frame.
- The old JOURNAL stats footer (`HUNTS / THEIRS / MINE`) is removed. Historical writing is
  the purpose of this section.
- Entering JOURNAL from another section starts at page 1.
- The same page-turn architecture should be reused when BUTTERZ or future Polybook sections
  exceed one physical page.
- MASTERY uses that architecture for mastery overflow: 12 crowns per physical page in the
  approved three-column grid, with the shared readable `PAGE X OF Y` controls and horizontal
  swipe. The pager stays hidden while the collection fits on one page. The mastery composition
  and pagination architecture are approved and locked.
- TODAY remains the locked single-current-entry page and is not changed by this system.
- **LOCKED 2026-10-02 after physical-phone review:** JOURNAL pagination, page density,
  whole-entry grouping, tap arrows, horizontal swipe, parchment clipping, and the enlarged
  readable `PAGE X OF Y` counter are approved. Do not reopen these choices without a
  demonstrated regression.
- DEV FULL may repeat the small amount of real journal history to stress-test pagination;
  repeated DEV entries are expected and are not a production JOURNAL defect.

## 6. MASTERY

**MASTERY** is the mastery section.

It should preserve the existing mastery/seal concept while allowing it
to become more physical, collectible, and book-native.

Gold feather seals and mastered words should feel like earned artifacts
rather than generic statistics.

The current V1 direction is intentionally sparse: mastery is represented by crown artifacts,
not by redundant mastered-word labels under each crown. The earlier crown + ROUND presentation
was rejected because the word label did not explain the artifact and added noise.

Crowns must eventually matter beyond accumulation. Future earned Polybook access/unlocks are a
strong direction for giving them meaning, but the unlock economy is not part of the current
typography/layout pass.

The V1 MASTERY composition is **LOCKED**: live player-name heading, MASTERY label, purple crown
artifacts, approved three-column grid, no redundant mastered-word labels, total crown count, and
shared page-turn behavior when the collection exceeds 12 crowns.

Polybook should not become a statistics dashboard. Small lifetime
information may exist where useful, but statistics should remain
subordinate to the book, rivalry, and history.

------------------------------------------------------------------------

## 7. Living-Journal Visual Language

The journal should look **used by Polly**, not decorated by a UI
designer pretending to be Polly.

Personality should come from selective evidence of behavior.

Potential visual ingredients include:

-   Handwritten remarks.
-   Cross-outs.
-   Corrections.
-   Arrows.
-   Cramped margin notes.
-   Occasional ink blots.
-   Small stupid doodles.
-   Polly drawing crowns around herself.
-   Angry scratches after a loss.
-   Marks associated with a broken Haunt.
-   Physical gold seals for meaningful mastery.
-   Distinct player handwriting/ink if player-authored notes are
    introduced later.

These should be used selectively.

If every page is covered in doodles and marks, none of them are
discoveries anymore.

### Avoid

-   A dashboard made from many parchment cards.
-   Giant section bars.
-   Modern pill-shaped navigation.
-   Excessive decoration that harms readability.
-   Filling every empty area merely because it exists.
-   Shrinking text to preserve an old composition.
-   Making every page visually chaotic in the name of personality.

The journal itself should be the interface.

------------------------------------------------------------------------

## 8. Future Player Interaction

### FUTURE --- APPROVED DIRECTION, NOT V1

Polybook should eventually become a **shared journal between Polly and
the player**.

Polly writes about the player. The player can eventually write back or
leave a message. Polly can later react.

The preferred emotional behavior is delayed discovery rather than
instant chatbot conversation.

Example experience:

1.  Polly writes today's entry.
2.  The player leaves something for Polly.
3.  The player returns later or the next day.
4.  Polly has noticed it.
5.  Her response is physically present in the book.

Polly might:

-   Reply beside the player's note.
-   Draw an arrow to it.
-   Cross something out.
-   Correct it.
-   Mock it.
-   Ignore it temporarily.
-   Reference it days later.
-   Doodle on or around it.

The point is to create the feeling that Polly exists and uses the book
when the player is not looking.

### Important implementation caution

Do not jump directly to unrestricted free text or real-time AI chat.

Free text introduces:

-   Moderation requirements.
-   Persistence requirements.
-   Generated-response concerns.
-   Cost.
-   Offline behavior questions.
-   Safety concerns.
-   Considerably larger engineering scope.

A controlled authored-response system should be explored before
unrestricted messaging.

The ability to **write back to Polly** may itself become an earned
unlock.

------------------------------------------------------------------------

## 9. Expandable Sections

The ribbon architecture exists so Polybook can grow without overloading
existing pages.

Possible future sections include:

-   **DOODLES** --- Polly's drawings and visual nonsense.
-   Random Polly notes.
-   Correspondence.
-   Special-event pages.
-   Daily discoveries.
-   Collections.
-   Secrets.
-   Lore.
-   Seasonal material.
-   Other features that genuinely create a reason to revisit Polybook.

These are possibilities, not committed features.

A future section should not be created until its experience is strong
enough to justify a permanent ribbon.

------------------------------------------------------------------------

## 10. Locked, Hidden and Earned Sections

### FUTURE --- APPROVED TO EXPLORE

Polybook may contain sections that are:

-   Available immediately.
-   Visible but locked.
-   Hidden until discovered.
-   Earned through gameplay.
-   Revealed by specific events.

A locked section should create curiosity about **what Polly is hiding**,
rather than feel like a generic feature gate.

Possible unlock sources include:

-   Mastered-word milestones.
-   Haunted progress.
-   Daily Challenge accomplishments.
-   Rivalry milestones.
-   Other meaningful achievements.

Requirements can be expressed in Polly's voice and through the
physical-book metaphor.

Example concept:

> NOT UNTIL YOU'VE BEATEN ME 10 TIMES.

The requirement itself can become banter.

### Discovery

A newly unlocked or newly revealed ribbon may simply appear on the book
one day.

The player notices a ribbon that was not there before and investigates
it.

Avoid conventional `NEW FEATURE!` UI when the physical discovery can
communicate the moment more elegantly.

### Product principle

> **Some Polybook sections are given. Some are discovered. Some have to
> be taken from Polly.**

------------------------------------------------------------------------

## 11. Polly's History

### FUTURE --- APPROVED TO EXPLORE

A particularly strong future locked section is **Polly's personal
history**.

Its purpose is to gradually reveal why Polly became the smug, combative,
competitive pain-in-the-ass the player knows.

This section should deepen the player's understanding and affection for
Polly without explaining away her personality.

Do **not** turn Polly into a tragic exposition machine.

Potential presentation methods include:

-   Old journal pages.
-   Previous notes.
-   Artifacts.
-   Crossed-out memories.
-   Old doodles.
-   Fragments unlocked over time.
-   Physical evidence from earlier parts of Polly's life.

The exact story, unlock condition, structure, and tone are not yet
designed.

This should be earned through proper character development work rather
than improvised merely because the section exists.

------------------------------------------------------------------------

## 12. Progression Philosophy

### LOCKED PRINCIPLE

> **Polybook progression should reveal more of Polly and deepen the
> rivalry, not merely reveal more UI.**

Rewards inside Polybook do not always need to be currency or power.

Potential rewards can include:

-   Personality.
-   Access.
-   Banter.
-   Private material.
-   New interactions.
-   New ways to interfere with Polly's book.
-   New pieces of history.
-   Secrets.

Curiosity can be a legitimate reward.

The player should want to unlock a section because they want to know
what Polly has hidden there.

------------------------------------------------------------------------

## 13. Monetization Guardrail

### FUTURE / UNDECIDED

The architecture could technically support optional paid expansion
sections or related content in the future.

Do **not** design the core Polybook around monetization locks.

TODAY, JOURNAL, BUTTERZ, and the core Polly/player relationship must not
feel held hostage behind payment.

If monetized Polybook content is ever explored, it should add genuine
optional value rather than sell relief from artificial restriction.

No monetization implementation is approved by this document.

------------------------------------------------------------------------

## 14. V1 Redesign Scope

### V1 / LOCKED FOUNDATION

The first redesign should establish:

-   Closed Polybook hub.
-   Physical book-opening transition.
-   One full portrait page at a time.
-   Expandable forked-ribbon navigation.
-   TODAY.
-   JOURNAL.
-   BUTTERZ.
-   A restrained living-journal visual grammar.
-   Comfortable rendering of the existing approved Today and Journal/Work Log copy.
-   A visible return-to-cover control on every open section.
-   Architecture capable of supporting future sections without
    redesigning the shell.

V1 should prove that opening Polybook is enjoyable and that the book is
readable and characterful on a physical phone.

------------------------------------------------------------------------

## 15. Explicitly Not V1

Do not implement these as part of the initial redesign:

-   Unrestricted player free-text messaging.
-   Real-time AI-generated Polly conversation.
-   Moderation infrastructure.
-   Notification systems for Polly replies.
-   Large doodle libraries.
-   Actual locked-section economies.
-   Monetization offers.
-   Polly-history lore production.
-   Large new progression systems.
-   Empty placeholder sections.
-   New sections merely to fill ribbon space.
-   Rewrites of approved Today/Work Log copy merely to satisfy the old
    layout.
-   Repairs to the rejected two-page layout.

------------------------------------------------------------------------

## 16. Decision States

### LOCKED

-   Polybook is Polly's diary/journal and the long-term record of the
    Polly/player rivalry.
-   Polybook should become increasingly interactive over time.
-   Closed physical book → full portrait page → forked-ribbon
    navigation.
-   Expandable section architecture.
-   Initial V1 sections: TODAY, JOURNAL, BUTTERZ.
-   New features must earn a ribbon.
-   Future player participation and delayed Polly/player correspondence
    are part of the long-term direction.
-   Polybook progression should deepen the relationship with Polly
    rather than merely expose more UI.

### EXPERIMENTAL

-   Exact closed-cover treatment.
-   Ribbon position, scale, material and selected state.
-   Exact typography. Buggie has failed phone readability for journal body copy; replacement
    handwriting selection is in progress.
-   Page composition.
-   Transition timing.
-   Personality/doodle density.
-   Exact TODAY layout beyond the dark-ink + mood-bar direction.
-   Exact JOURNAL layout.
-   Exact BUTTERZ layout.
-   Visual treatment of locked ribbons.

### FUTURE --- APPROVED TO EXPLORE

-   Player write-back.
-   Delayed Polly replies.
-   Doodle section.
-   Random-notes section.
-   Locked/hidden sections.
-   Achievement-earned ribbons.
-   Polly-history section.
-   Contextual authored player-response systems.

### DEFERRED / UNDECIDED

-   Free-text messaging.
-   AI-generated Polly replies.
-   Notifications.
-   Exact unlock requirements.
-   Monetization implementation.
-   Exact Polly-history story.
-   Expanded lore production.

### REJECTED

-   Scaled miniature two-page spread as the redesign direction.
-   Horizontal left/right navigation as the primary Polybook navigation.
-   Shrinking typography to rescue the old layout.
-   Rewriting strong approved copy merely to satisfy obsolete layout
    limits.
-   Treating Polybook as a stats dashboard.

------------------------------------------------------------------------

## 17. Product Guardrails

-   Polly remains clever, lightly mischievous, smart-assy, human and
    memorable.
-   Polly should never become cruel, childish, random, exhausting, or
    desperate to be funny.
-   The player should want to inspect Polybook because it is funny,
    personal and revealing.
-   Do not manufacture coercive urgency merely to drive return visits.
-   Locks should create earned curiosity, not punishment designed to
    sell relief.
-   Gold remains scarce and meaningful.
-   The physical-book metaphor may never force miniature text or wasted
    half-pages again.
-   Future additions must preserve the feeling of one physical object
    accumulating history.
-   Avoid turning Polybook into a disguised menu tree.
-   Doodles and annotations should behave like evidence of Polly's
    personality, not wallpaper.
-   Player-facing readability on real phones outranks fidelity to a
    traditional two-page book layout.

------------------------------------------------------------------------

## 18. Acceptance Criteria

The redesign is not ready to lock until all of the following are true:

1.  Opening Polybook immediately reads as opening **Polly's physical
    book**, not entering a statistics screen.
2.  TODAY, JOURNAL and BUTTERZ are understandable through their ribbon
    treatment without horizontal-swipe discovery.
3.  A fourth or fifth ribbon can be added without redesigning the page
    shell.
4.  The longest approved real Today and Work Log entries render
    comfortably on a physical iPhone without arbitrary ellipsis.
5.  The open page uses the available portrait screen efficiently.
6.  The physical-book illusion remains intact despite the mobile-first
    full-page layout.
7.  Doodles and marks add character without reducing legibility.
8.  A mocked locked ribbon can create understandable curiosity without
    requiring a generic modal or tutorial.
9.  The visual system leaves room for future player notes and Polly
    replies.
10. Device verification passes before the visual treatment is promoted
    from EXPERIMENTAL to LOCKED.

------------------------------------------------------------------------

## 19. Verification

Before implementation is considered complete:

-   Test the approved layout at real target phone proportions.
-   Use actual approved Today entries, including the longest/problematic
    entries from the current pool.
-   Use actual Work Log copy rather than placeholder lorem ipsum.
-   Verify no required copy is being truncated by obsolete
    character-width assumptions.
-   Test TODAY, JOURNAL and BUTTERZ navigation.
-   Test the selected/unselected ribbon states.
-   Test a mocked fourth/fifth ribbon for architectural scalability.
-   Test a mocked locked ribbon without implementing a real unlock
    system.
-   Verify the book remains legible with personality marks present.
-   Verify page transitions do not interfere with interaction or
    readability.
-   Verify production behavior is not dependent on DEV-only Polybook
    controls.

------------------------------------------------------------------------

## 20. Immediate Product Sequence

### Single most valuable next action

Lock **Polybook page readability** on a physical phone: choose a heavier approved handwriting
font, restore dark body ink, and validate the thicker mood bar under TODAY.

### Next three actions

1.  **Finish TODAY typography and mood-bar treatment.**    Use the real ten-entry pools and all five rivalry states. AMUSED is Polly green; no brown.
    Do not color the handwriting itself.

2.  **Apply the approved page typography to JOURNAL and stress-test real content.**    Use the authored Work Log/Journal copy, including long entries. DEV cycling controls may
    remain for testing but must not leak into production behavior.

3.  **Finish BUTTERZ composition, then clean the closed-cover ribbon art.**    Keep crowns as the mastery artifact without redundant word labels. After the interior system
    is stable, remove the closed cover's side ribbons and move that art language to the bottom.

### Do not work on yet

-   Free-text correspondence.
-   AI Polly replies.
-   Unlock economies.
-   Monetized sections.
-   Full Polly-history writing.
-   New progression rewards.
-   Large doodle systems.
-   Repairing the rejected two-page layout.

### Why this order wins

The architecture now has substantial long-term expansion value, but its
immediate job is still simple:

**Make Polybook delightful, readable and unmistakably Polly's on a
phone.**

Proving the physical book, ribbon navigation and living-page personality
first protects the core experience while leaving room for the larger
interactive relationship system to grow without expensive rework.

------------------------------------------------------------------------

## 21. Canonical Documentation Rule

This document is the canonical product-direction reference for the
**Polybook Living Journal redesign**.

Existing Polybook documentation should be updated to point here when its
older layout assumptions conflict with this direction.

Do not silently implement older Polybook architecture when it conflicts
with this document.

Implementation details may evolve after approved device testing, but
changes to the locked product architecture require explicit product
approval.
