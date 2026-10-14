# POLYWORDS Home Screen Lockdown

Approved direction: 2026-10-13 (America/New_York).
Owner: Pete. Status: **approved design direction; not implemented or device-verified by this document**.
Working branch: `play-screen-overhaul`. Do not use `daily-castle-test`.
Scope: Home composition, entrance, menu movement, and destination transitions.

## Read this first when resuming

Preserve Pete's October 13 mockup layout and its sense of looking into a deep room.
Correct the art, palette, lighting, and materials without replacing the approved composition.
Home is a castle room with a three-tier moving stone console. Hunt reveals a descending
hall; Daily travels through the window; Polybook rises from its compartment.
Polly stays on the left. The cage crash belongs only to app opening.
This is the current approved Home direction, not evidence of current runtime behavior.

This focused specification records Pete's explicit decisions and supersedes earlier Home
concepts where they conflict: a floating book as the Home Hunt button, a shallow/flat room,
and the older instruction to defer all Home design work. It does not replace project-wide
rules in AGENTS.md or DESIGN.md, nor authorize unrelated gameplay changes.
"Locked" means approved and not to be casually changed; Pete can reopen a decision.

## Evidence and interpretation

Authority for this sequence is Pete's mockups plus his spoken corrections on October 13.
The images are rough composition/motion references, NOT final art or color approval.
Later verbal corrections take precedence over incidental objects left in a mockup.

| Reference | Purpose |
| --- | --- |
| HOME_ENTER1.png | Opening room; Polly at left; cage attached near the logo's S. |
| HOME_ENTER2.png | Cage has fallen to the floor and crashes/breaks. |
| HOME1.png | Resting Home with three menu tiers. |
| HOME_HUNT1.png | Hunt selection, other compartments collapse together. |
| HOME_HUNT2.png | Retraction and floor opening reveal the descending hall. |
| HOME_DC.png | Daily selection state; subsequent travel is through the window. |
| HOME_POLYBOOK1.png | Book emerges above its compartment. |
| HOME_POLYBOOK2.png | Book comes forward and takes over the screen. |
| HOME2png.png, later arrow mockup | Compact origin from which all compartments stagger outward and lift. |

The first eight images were visually reviewed in this conversation. A later HOME_HUNT2.png
and HOME2png.png were supplied in an outside-thread message; their movement explanation was
provided in text. Do not claim exact measurements were taken from those later images.
Repeated filenames are version-ambiguous: use the later arrow/retraction references when
available. These reference images have not been added to the repository by this document.
The text below is deliberately self-contained so the direction survives missing attachments.

## 1. Locked composition and perspective

- Portrait Home, looking INTO a castle room with visible depth.
- Preserve the basic arrangement and relative visual footprint in Pete's mockups.
- The room needs enough depth for compartments to extend from a compact structure into
  separate staggered positions. Do not flatten it into a wall with stacked floating buttons.
- Floor, side architecture, back wall/window, and console must share a coherent perspective.
- Visible upper surfaces, overlap, changing apparent size, and contact shadows must explain depth.
- Logo remains overhead; Polly remains on the left in her established perch area.
- Window remains the window on the far wall. It is the Daily destination route.
- Resting menu order, top to bottom: ENTER THE HUNT / DAILY CHALLENGE / POLYBOOK.
- Settings must remain available; exact placement is flexible and not yet selected.
- Moon faces are part of the intended finished Home, but are explicitly deferred until the
  main layout, art, and movement are right.

## 2. Locked app-opening sequence

1. Begin with the room and compact console arrangement.
2. Reuse Polly's existing drop-in arrival: she drops and lands on her left-hand perch.
   Do not substitute a newly invented swooping flight or mandatory swing routine.
3. Her landing triggers the cage, connected to the S in POLYWORDS, to shake/rattle.
4. The cage falls to the floor, crashes, and breaks.
5. The three menu compartments emerge from their compact origin, stagger outward, lift,
   and settle into the resting Home arrangement.

The causal order is locked; exact timing and overlap between the crash and menu reveal
are not yet specified. This opening performance happens on app opening, not whenever
navigation returns to Home. It is not specified as a once-ever installation tutorial.
Cold launch versus foreground-resume handling still needs an explicit implementation rule.

The cage is shown hanging again in later rough frames. That is NOT approval to replay
its fall or silently regenerate it on every Home visit. Debris cleanup, final cage state,
and any reset policy remain open.

## 3. Locked console movement

The three menu compartments are parts of one compact physical structure.
They stagger out and lift into position: one, two, three.
The intended effect is extension into room depth with a lift, rather than three independent
buttons simply fading in. Emerging from the floor is an allowed construction option, not
the defining requirement. Exact rails, travel paths, offsets, timing, and easing are open.

Use "three-tier stone console" as a descriptive production name, not player-facing copy.
"Compartment" is the intended word; transcript references to an "apartment" mean compartment.

## 4. Locked Hunt selection sequence

1. Player taps ENTER THE HUNT.
2. Other compartments collapse back together with the Hunt compartment.
3. During the combined structure's retraction, only the ENTER THE HUNT face remains visible.
4. As it retracts, the floor opens to reveal a HALL with stairs descending.
5. The retraction and opening are coordinated parts of the same physical event.

Pete explicitly corrected "hole" to "hall, H-A-L-L." Build an architectural passage with
descending stairs, not an unexplained pit. This is not the earlier interpretation of a
Hunt slab simply lifting like a gate.
Exact camera travel after the hall reveal and the handoff to gameplay remain to be finalized;
do not present an assumed camera descent or extra tap as an approved requirement.

## 5. Locked Daily selection sequence

1. Player taps DAILY CHALLENGE.
2. Transition the view through the existing window toward the Daily Castle.
3. A silhouette of that castle must be visible outside the window to establish the destination.

The Daily route is through the window, not through the Hunt hall.
The HOME_DC frame is a rough intermediate composition, not a separate new gameplay screen.
Exact compartment clearing, camera path, duration, and handoff to the existing Daily
entry/play/completed states remain implementation decisions to review.

## 6. Locked Polybook selection sequence

1. Player taps POLYBOOK.
2. The book rises out of its own compartment.
3. It comes forward and takes over the screen, as HOME_POLYBOOK1 -> HOME_POLYBOOK2 shows.

One button tap triggers this emergence and takeover. Do not require a second tap merely
to reach the large closed-book state.
Whether the cover then automatically opens, and the precise handoff to the existing
Polybook cover/page flow, remain open. Preserve existing Polybook interior rules.
The book is revealed when selected; do not restore it as a permanent floating Hunt hero.

## 7. Return Home and existing behavior

- Navigation back to Home does not replay the app-opening cage crash.
- Restore a usable three-choice Home. Whether the console reassembles with a brief animation
  or is already settled is not yet specified.
- Keep Polly on the left. Existing personality, pose, sleep, and relationship behavior is
  not being rewritten by this visual specification.
- Preserve existing Hunt, Daily, onboarding, saved progress, resume, and Polybook behavior.
- Inspect first-run onboarding before implementing: its existing perch intro and Hunt
  highlight must be coordinated with this opening, not removed or replayed accidentally.
- Settings placement must preserve access and safe-area usability.
- Existing reduced-motion and sound/haptic preferences remain authoritative.

## 8. Art direction: locked intent, unfinished assets

Pete approves the layout, room depth, and movement. He explicitly does NOT approve the
mockups' current colors, all their artwork, pasted edges, or final typography.

Use the art actually active on play-screen-overhaul to establish POLYWORDS materials and
world consistency. Create Home-specific art in that same world; do not copy another game
screen wholesale or substitute arbitrary older castle art.
Follow DESIGN.md's painted stone, purple/indigo world, restrained gold, typography, and
semantic color rules. Exact Home hues, exposure, stone treatment, and light balance remain
to be approved. Do not derive a final palette from the rough mockups.

Polly's approved identity/proportions and existing usable art remain protected.
The window outline and moon shown in the mockups are placement cues, not finished assets.
Moon expressions come last.

## 9. Production preparation (technical plan, not final asset approval)

A flattened screenshot alone cannot provide all the required motion.
Prepare independently controllable layers with shared perspective, scale, and registration:

- Room shell and fixed architecture.
- Window frame/opening mask and separate exterior castle view.
- Separate moon and later expression treatment.
- Logo, hanging cage, attachment point, and breakable cage pieces.
- Existing Polly/perch components.
- Three console compartments, including surfaces exposed during extension/retraction.
- Floor opening/moving section and its edges.
- Descending hall/stairs visible behind the opening.
- Polybook emergence layer and existing cover/page presentation.
- Independent interactive labels and Settings control.

Exact layer count, export sizes, camera geometry, masks, and animation technology are
not locked. Choose them after checking the existing implementation and testing movement.
All moving pieces need sufficient painted coverage so motion does not expose blank areas.

## 10. Open details: never silently treat these as approved

- Final colors, materials, lighting, dimensions, and exact phone framing.
- Which mockup assets are reusable versus replacement art.
- Exact compartment order of motion, offsets, duration, and easing.
- Floor-opening mechanism and Hunt camera/handoff after revealing the hall.
- Daily compartment clearing and route handoff.
- Whether Polybook opens automatically after taking over.
- Cage debris cleanup and post-crash resting state.
- Cold launch versus background/foreground replay policy.
- Console behavior when returning Home.
- Settings placement.
- Moon expressions and timing.
- Sound/haptic assets and timing; opening skip/interrupt behavior.
- Reduced-motion transition treatment and first-run onboarding coordination.

## 11. Acceptance and verification checklist

These are implementation gates, not claims that the feature already passes.

- [ ] At phone size, the still composition preserves Pete's layout and visibly deep room.
- [ ] Polly stays left; the window and logo retain their intended roles.
- [ ] All three menu labels are readable and tappable; Settings remains reachable.
- [ ] The console visibly originates as one compact structure and staggers outward/up.
- [ ] Polly landing -> cage rattle -> fall -> break reads as one causal opening event.
- [ ] Leaving and returning Home does not replay the cage crash.
- [ ] Hunt collapses the compartments, shows only its face during retraction, and opens
      the floor concurrently to reveal an architectural hall with descending stairs.
- [ ] Daily travels through the window toward a visible castle silhouette.
- [ ] A single Polybook selection raises the book from its compartment and brings it forward.
- [ ] No gaps, clipped moving pieces, mismatched perspective, or visibly floating stone tiers.
- [ ] Repeated taps, leaving mid-transition, and app interruption cannot duplicate navigation
      or strand the screen.
- [ ] Existing gameplay, saves/resume, Daily eligibility/completion, onboarding, and Polybook
      content remain correct.
- [ ] Reduced Motion reaches the same destinations without requiring the full camera motion.
- [ ] Check small-phone/safe-area layouts and real iOS/Android behavior before marking verified.
- [ ] Review against the mockups and this document with Pete before final visual approval.

## 12. Next work and continuation protocol

Most valuable next step: establish the room/console perspective and layer map from the
approved composition.

Next three actions:
1. Inspect current Home code/art and map reusable pieces plus missing layers against this spec.
2. Prove compact -> three tiers -> Hunt retraction/floor reveal using rough pieces at phone size;
   also establish Daily and Polybook transition endpoints.
3. Finish matching artwork, integrate the transitions, and verify the checklist with Pete.

Do not polish moon faces, add new Polly animation systems, redesign other screens, or change
gameplay during this Home task. Do not spend on final art before the moving geometry works.

For every future session:
1. Read AGENTS.md, CLAUDE.md, CONTEXT.md, this document, and DESIGN.md.
2. Verify the branch and current runtime before claiming what is already built.
3. Resume from approved decisions; ask only about unresolved details needed for the next step.
4. Record new rulings here, with date, and update CONTEXT.md with implementation status.
5. Never quietly replace this design with a new layout or promote an assistant suggestion
   to a Pete-approved rule.

## Decision history

- 2026-10-13: Pete supplied rough Home entrance, resting menu, Hunt, Daily, and Polybook frames.
- 2026-10-13: Corrected Polly arrival to the existing drop onto her perch; cage hangs from S.
- 2026-10-13: Corrected menu origin to one compact structure, staggered outward and upward.
- 2026-10-13: Specified Daily travel through the window toward a castle silhouette.
- 2026-10-13: Confirmed Polybook rises from its compartment and takes over the screen.
- 2026-10-13: Corrected Hunt motion to combined retraction plus simultaneous floor opening;
  explicitly corrected "hole" to "hall."
- 2026-10-13: Confirmed Polly remains left, Settings placement flexible, moon faces deferred.
- 2026-10-13: Reaffirmed deep-room perspective and mockup layout; art/colors still need correction.
- 2026-10-13: Requested this durable lockdown for repository continuity.
