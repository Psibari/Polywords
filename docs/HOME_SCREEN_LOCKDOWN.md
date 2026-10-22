# POLYWORDS Home Screen Lockdown

Approved direction: 2026-10-13 (America/New_York).
Owner: Pete. Status: **approved design direction; not implemented or device-verified by this document**.
Working branch: `play-screen-overhaul`. Do not use `daily-castle-test`.
Scope: Home composition, entrance, menu movement, and destination transitions.

> **2026-10-20 direction change (Pete): Home is OUTDOORS, a night castle terrace, not the indoor
> room.** The indoor room below is PARKED, not deleted. Read "Pete rulings, 2026-10-20 (outdoor
> terrace)" at the end of this file first: it says which earlier rulings are parked, which still
> stand, and which Pete has not yet answered. Where it conflicts with the indoor text, the
> 2026-10-20 section wins.

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
  *(superseded by 2026-10-13 rulings)*
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
   and settle into the resting Home arrangement. *(superseded by 2026-10-13 rulings)*

The causal order is locked; exact timing and overlap between the crash and menu reveal
are not yet specified. This opening performance happens on app opening, not whenever
navigation returns to Home. It is not specified as a once-ever installation tutorial.
Cold launch versus foreground-resume handling still needs an explicit implementation rule.

The cage is shown hanging again in later rough frames. That is NOT approval to replay
its fall or silently regenerate it on every Home visit. Debris cleanup, final cage state,
and any reset policy remain open.

## 3. Locked console movement

The three menu compartments are parts of one compact physical structure.
They stagger out and lift into position: one, two, three. *(superseded by 2026-10-13 rulings)*
The intended effect is extension into room depth with a lift, rather than three independent
buttons simply fading in. *(superseded by 2026-10-13 rulings)* Emerging from the floor is an
allowed construction option, not the defining requirement. *(superseded by 2026-10-13 rulings)*
Exact rails, travel paths, offsets, timing, and easing are open.

Use "three-tier stone console" as a descriptive production name, not player-facing copy.
"Compartment" is the intended word; transcript references to an "apartment" mean compartment.

## 4. Locked Hunt selection sequence

1. Player taps ENTER THE HUNT.
2. Other compartments collapse back together with the Hunt compartment.
3. During the combined structure's retraction, only the ENTER THE HUNT face remains visible.
4. As it retracts, the floor opens to reveal a HALL with stairs descending.
   *(superseded by 2026-10-13 rulings)*
5. The retraction and opening are coordinated parts of the same physical event.
   *(superseded by 2026-10-13 rulings)*

Pete explicitly corrected "hole" to "hall, H-A-L-L." Build an architectural passage with
descending stairs, not an unexplained pit. *(superseded by 2026-10-13 rulings)* This is not
the earlier interpretation of a Hunt slab simply lifting like a gate.
Exact camera travel after the hall reveal and the handoff to gameplay remain to be finalized;
do not present an assumed camera descent or extra tap as an approved requirement.
*(superseded by 2026-10-13 rulings)*

## 5. Locked Daily selection sequence

1. Player taps DAILY CHALLENGE.
2. Transition the view through the existing window toward the Daily Castle.
3. A silhouette of that castle must be visible outside the window to establish the destination.

The Daily route is through the window, not through the Hunt hall.
The HOME_DC frame is a rough intermediate composition, not a separate new gameplay screen.
Exact compartment clearing, camera path, duration, and handoff to the existing Daily
entry/play/completed states remain implementation decisions to review.
*(superseded by 2026-10-13 rulings)*

## 6. Locked Polybook selection sequence

1. Player taps POLYBOOK.
2. The book rises out of its own compartment.
3. It comes forward and takes over the screen, as HOME_POLYBOOK1 -> HOME_POLYBOOK2 shows.

One button tap triggers this emergence and takeover. Do not require a second tap merely
to reach the large closed-book state.
Whether the cover then automatically opens, and the precise handoff to the existing
Polybook cover/page flow, remain open. *(superseded by 2026-10-13 rulings)* Preserve
existing Polybook interior rules.
The book is revealed when selected; do not restore it as a permanent floating Hunt hero.

## 7. Return Home and existing behavior

- Navigation back to Home does not replay the app-opening cage crash.
- Restore a usable three-choice Home. Whether the console reassembles with a brief animation
  or is already settled is not yet specified. *(superseded by 2026-10-13 rulings)*
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
- Which mockup assets are reusable versus replacement art. *(superseded by 2026-10-13 rulings)*
- Exact compartment order of motion, offsets, duration, and easing.
- Floor-opening mechanism and Hunt camera/handoff after revealing the hall.
  *(superseded by 2026-10-13 rulings)*
- Daily compartment clearing and route handoff. *(superseded by 2026-10-13 rulings)*
- Whether Polybook opens automatically after taking over. *(superseded by 2026-10-13 rulings)*
- Cage debris cleanup and post-crash resting state.
- Cold launch versus background/foreground replay policy.
- Console behavior when returning Home. *(superseded by 2026-10-13 rulings)*
- Settings placement.
- Moon expressions and timing. *(superseded by 2026-10-13 rulings)*
- Sound/haptic assets and timing; opening skip/interrupt behavior.
- Reduced-motion transition treatment and first-run onboarding coordination.

## 11. Acceptance and verification checklist

These are implementation gates, not claims that the feature already passes.

- [ ] At phone size, the still composition preserves Pete's layout and visibly deep room.
- [ ] Polly stays left; the window and logo retain their intended roles.
- [ ] All three menu labels are readable and tappable; Settings remains reachable.
- [ ] The console visibly originates as one compact structure and staggers outward/up.
      *(superseded by 2026-10-13 rulings)*
- [ ] Polly landing -> cage rattle -> fall -> break reads as one causal opening event.
- [ ] Leaving and returning Home does not replay the cage crash.
- [ ] Hunt collapses the compartments, shows only its face during retraction, and opens
      the floor concurrently to reveal an architectural hall with descending stairs.
      *(superseded by 2026-10-13 rulings)*
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
  *(superseded by 2026-10-13 rulings)*
- 2026-10-13: Specified Daily travel through the window toward a castle silhouette.
- 2026-10-13: Confirmed Polybook rises from its compartment and takes over the screen.
- 2026-10-13: Corrected Hunt motion to combined retraction plus simultaneous floor opening;
  explicitly corrected "hole" to "hall." *(superseded by 2026-10-13 rulings)*
- 2026-10-13: Confirmed Polly remains left, Settings placement flexible, moon faces deferred.
- 2026-10-13: Reaffirmed deep-room perspective and mockup layout; art/colors still need correction.
- 2026-10-13: Requested this durable lockdown for repository continuity.

## Pete rulings, 2026-10-13

Pete says nothing here is law until reviewed together, and any line can be retracted.
Older lines above and in `POLYWORDS_HOME_VISUAL_TONE.md` that conflict are kept, marked
"superseded by 2026-10-13 rulings".

Rulings (Pete's words, paraphrased):

1. Home is Polly's domain: an abandoned castle where her broken cage is, and she is having the time of her life thinking she is king. Art is campy and funny, not dark or gloomy, and not childish or cartoony. Nothing in the art may clash with the game's funny music and jokes.
2. All Home art is new. Mock-ups and reference images only define layout, spacing and movement. New art must match the game's world, not reuse existing art.
3. No outside artist. Pete and Claude make the art. The artist-package zip is dropped.
4. Home keeps the title and Polly. The "words have meaning" tagline is going away for now.
5. Opening, on app open and first Home visit only: Polly drops onto her left perch as she does now. The cage hangs from the POLYWORDS title, rattles, falls to the floor and breaks. Then the three counters come out. Where the cage rests afterwards is decided later.
6. Counters: ENTER THE HUNT (top, biggest), DAILY CHALLENGE, POLYBOOK. They start as ONE counter on the wall under the window, then zoom out of the wall toward the viewer and stagger into place, one, two, three. They never rise from the floor. They come out once per app session; after that they stay out on every return to Home.
7. Room structure: a plain window (no doorway) centered on the back wall, much larger than the first mock-up, with a ledge on the left for Polly's perch and a hook on the right for the cage. A round floor hatch with a crown sits low in the floor, pushed forward. Stairs must never lead up to a room or window. The window is part of the background image with the glass cut out, so the sky, the black Daily castle silhouette and the moon can sit behind it as separate layers.
8. Hunt tap: the other two counters zoom back into the wall behind ENTER THE HUNT, the Hunt face stays visible, then it zooms back into the wall too. The crown hatch then drops down and the stairs going down into the floor are revealed (alternative Pete accepts: the hatch area becomes a sloped hole the camera zooms into; final art decides which reads better). The camera zooms down into the dark and fades into the Hunt screen, whose existing entrance plays (book slides in from the right, moving left, and exits left; cards shuffle in as a deck). No extra handoff.
9. Daily tap: all counters retract, the camera zooms into the window ("then bang"), onto the Daily screen. The window shows a black silhouette of the real Daily castle and the moon.
10. Moon states (full moon always): not played = idle eyes staring at Polly; lost = mad eyes staring at Polly; won = the face goes away and a gold ring with the golden feather in the middle replaces it.
11. Polybook tap: the other two counters retract, the Polybook counter sits big at the back (the altar spot), the book rises out of it, comes forward larger and lands seamlessly on the Polybook screen's CLOSED cover. It opens only when tapped there. The player is still in Polly's room.
12. Settings: a small cog placed wherever it fits, decided after the mechanics and art are done.
13. Messy room direction: papers, books, candles, quills, ink splashes. Anything childish comes off (no cartoon faces, no joke chalkboards, no gag signs). Loose papers stay BLANK: it is Polly's room, where she writes the Polybook, and words can be added later. Orange light stays minimal; violet and restrained gold.
14. Reference images (not game art): the "funniest" messy room with Polly's personality (banners, books, candles) and the arched room with the back altar that the mock-ups came from. A new room image must combine both: larger centered window, a clear spot at the back for the one counter, the hatch pushed forward.
15. Pete is making the room background art himself first and will bring it back.
16. Counter labels: RESUME HUNT replaces ENTER THE HUNT on the Hunt counter when a Hunt is in progress. START HERE goes underneath it on the Hunt counter.
17. The moon's gold-ring feather REPLACES the current "GOLD FEATHER READY" line. There is no GOLD FEATHER READY text on the new Home.

## Pete rulings, 2026-10-20 (outdoor terrace)

Source: Pete's spoken decisions in the 2026-10-20 session. The clickable mock
(claude.ai artifact AE5pMGoT9qUJzSmRTPs2mj, version 15) and the element PNGs are layout, color and
motion references only. They are NOT runtime and NOT in the repo. Positions in the mock are
approximate; Pete says "everything is off on position."
Pete said nothing here is final until reviewed together; any line can be retracted.

### A. Direction (Pete's words, paraphrased)

1. Home is OUTDOORS: a night terrace on a castle wall. Reason Pete gave: it is easier to zoom to the
   castle without making a window, and the indoor room had unresolved issues. He still wants the
   broken cage in it.
2. The indoor room (the 2026-10-13 composition and rulings 7, 13, 14, 15 below) is PARKED, not
   deleted. Do not build it unless Pete reopens it.
3. Background = ONE locked image, 1290x2796: night sky plus distant ridges only. No stars, moon,
   castle, wall or ground detail baked in. Pete: "we can lock this in for right now."
   Everything else is a separate element (castle, wall, floor, console, Polly, logo, cage, moon,
   gear). Pete and Claude make the art; no outside artist.
4. Castle: LOCKED ("castle's done"). Violet castle, windows kept, torches and pennants cut.
   Sits between the two ridge ranges, behind the wall.
5. Layout, back to front: sky/ridges, castle, back wall (parapet with pillars and a dark recess
   panel), floor with a back curb, stone console casing, cage and gear.
6. DAILY CHALLENGE is a button on the back wall's dark recess panel, with the castle behind it.
   Tapping Daily (the panel or the castle) zooms into the castle.
7. ONE stone console (casing + two slabs) serves BOTH Hunt and Polybook. Slabs: ENTER THE HUNT
   (large, top) and POLYBOOK (small, below). Tap either: the slabs slide apart to reveal an opening.
   Hunt: the camera dives down the hall and the Hunt screen takes over.
   Polybook: the book pops out of the opening, jumps up and forward into the big closed-cover state
   (the existing Polybook closed cover; it opens only when tapped there).
8. Polly perches on the BACK WALL (on the wall's top ledge), not floating and not on a separate post.
9. Cage is cut in half. The top half hangs/falls from the POLYWORDS logo. The base half rests on the
   floor. Pete wants the cage in the scene.
10. Settings gear goes in a BOTTOM corner, never on top. Mock has it bottom-left.
11. Lettering is NOT gold everywhere. Default white. Fonts: Bebas Neue (labels) and Barlow Condensed.
12. Daily-first light logic (Pete's earlier stated intent):
    - Daily not played: castle door and windows glow (slow breathing, about 2 s, no hard blinking);
      the DAILY CHALLENGE label is gold; Hunt and Polybook are quiet.
    - Daily played: the castle lights dim; the ENTER THE HUNT label turns gold; a thin gold glow
      leaks around the console slabs.
13. Shooting star about every 30 seconds: Pete confirmed ("30 seconds is fine").
14. Wall and console colors must be adjusted toward the game palette, with shadow where the wall,
    casing and floor meet. (Claude's regrade is in the mock; Pete has not approved final colors.)
15. For implementation Pete WANTS A DEV POSITIONING BUTTON: a DEV-only tool to drag/nudge each
    Home element and read out its final values, because positions in the mock are off. Pete's words:
    "when we're ready to put it in, I'm going to need a dev button to position stuff."

### B. What happens to the 2026-10-13 rulings

Not asked of Pete yet for each line; this is how the document stands until he answers.
- PARKED with the indoor room: 6 (counters zoom out of the wall), 7 (room structure, window, hatch,
  crown, stairs), 8 (Hunt via hatch and stairs), 13 (messy room), 14 (reference rooms),
  15 (indoor background art).
- NOT YET CONFIRMED for the terrace (Pete has not said either way): 1 (Polly's domain, campy tone),
  2, 3, 4 (title and Polly, no tagline), 5 (opening cage crash), 9 (Daily tap), 10 and 17 (moon
  states and the gold-ring feather replacing GOLD FEATHER READY), 11 (Polybook tap detail),
  16 (RESUME HUNT and START HERE labels).
  Do not treat these as dropped or as applying. Ask Pete.
- Ruling 12 (Settings cog placed where it fits) is superseded by A10.

### C. Open questions for Pete (answer before the related build step)

1. Where does the cage base rest, and what is the fall path from the logo? In the mock it overlaps
   the casing's lower-right corner because the casing fills the width.
2. Does the opening still play (Polly drops onto her perch, the cage rattles, falls, breaks)? On
   app open only, as in ruling 5?
3. Does the console just sit there, or does it have an entrance? (The indoor "counters zoom out of
   the wall" does not carry over.)
4. Moon: ruling 10 states, or the 4-phase mock, or something else? New-moon handling?
   Daily shows what moon?
5. Floor color: Claude would tone it down a little because it is the loudest piece. Pete has only
   named the wall and console so far.
6. Wall art: the angled pieces beside the two pillars are slightly bumpy in Pete's original art.
   Claude smoothed them; a clean redraw would be better.
7. Moon, bubble and stars placement in the empty sky band above the castle.
8. Final colors, materials and sizes for each element.

### D. Implementation rules to carry (from CLAUDE.md and the mock)

- Never scale the wall. Derive wall, casing and floor geometry from full-width, bottom-anchored
  measurements (like the Boss ledge and `app/ui/dailyCastleScene.ts`), so the buttons stay aligned
  on every phone shape. The mock scales everything with one stage and does NOT prove this.
- Background crop math (computed, not device-tested): wider phones crop about 250 px top and bottom
  of the 1290x2796 art; taller phones about 45 px each side. Safe box x 60..1230, y 260..2536.
  Never bake the wall into the background.
- Hit areas are driven by the same measured coordinates as the art, not guessed rectangles.
- Daily gold on the label, windows and door is by code overlays on dark art, not baked into the
  art, so the state can change.
- Console slabs are sized to tile the opening exactly; the hall stays hidden until the slabs open.
- Keep the palette: gold scarce and earned, no pink/magenta or orange UI, never pastel. The cage's
  brass is Pete's art and is the only warm element; check that it does not compete with the Daily
  gold on device.
- Reduced-motion, repeated taps, leaving mid-transition and app interruption must not duplicate
  navigation. Same gates as section 11.

### E. Delivered elements (Pete's art, cleaned by Claude; not in the repo)

Wall (back wall with pillars and recess panel), floor, console casing (opening made transparent),
two console slabs (Hunt, Polybook), cage top and cage base. The mock uses cleaned and regraded
copies: ragged edges and leftover background fringe removed, straight wall base, black grout made
deep violet. Polly is the existing master art; castle is the locked violet castle.

## Decision history, 2026-10-20

- 2026-10-20: Pete chose OUTDOORS (night terrace) over the indoor room; indoor room parked.
- 2026-10-20: Pete locked the sky-and-ridges background and the violet castle.
- 2026-10-20: Pete supplied his own wall, floor, console, slab and cage art. Wall edge was rough;
  Claude cleaned it.
- 2026-10-20: Pete: Polly perches on the back wall; no gold lettering on everything; wall and
  console colors need adjusting; cage is cut in half and falls from the logo.
- 2026-10-20: Pete asked for a DEV positioning button for the implementation.
- 2026-10-20: Pete asked for this section to be written into this document.

## Pete rulings, 2026-10-20 (evening, terrace build)

- Ground is drawn by code with big perspective slab seams (no cracks); floor color `#271E3D`; no floor image. Moonlit ground was the runner-up.
- The sky-and-ridges background is a movable element in the DEV tool.
- The castle is hidden at rest. Tapping DAILY CHALLENGE zooms up and over, the castle rises from behind the mountain range, then the view zooms into it.
- A small separate wooden perch stays on the wall (cropped from Polly's own branch). Polly has no perch while flying and lands on it; align her baked branch to it afterwards.
- App-open cage sequence stays: cage hangs from the logo, Polly lands, it shakes, falls and breaks; both halves on the floor is the end state.
- The console may move down to use the empty bottom space (Pete does this in the DEV tool).
- Slabs: Pete rejected the regraded slabs (dirty, not fitting the opening). Rebuilt from his original art, inset with a gap. He dislikes the label size and font and is unsure about the dark box around them; he is making new slab art and resumes 2026-10-21.
- Build note: one width-fit, bottom-anchored frame holds the lower scene (deliberate deviation from the "cover" crop above); sky group is top-anchored below the safe-area inset.

## Pete rulings, 2026-10-21 (flat buttons, entrance, and the swap)

Supersedes the slab rulings above and the "not carried over" list. Pete's words are paraphrased
closely; nothing here is Claude's invention.

1. Slabs are retired: the cracks and detail in the wall and console did not look right on a phone.
   Pete drew flat buttons, a new casing and a new back wall.
2. Every time Home is shown, the buttons come out of the console one after another with the Daily
   answer block's own treatment: tremble of wall and console, stone thud, haptic, and pop out when
   pressed. Order: Daily, Hunt, Polybook.
3. The Daily plaque cannot pop forward (it sits behind the console): it rises from behind the console
   edge and is pressed in. Pete asked for exactly this.
4. Labels: Lilita One. ENTER THE HUNT is much larger than POLYBOOK, three lines ENTER / tiny THE / HUNT.
5. Daily plaque: same navy face as the other buttons. Gold frame and label while unplayed; still gold
   and reading GOLD FEATHER READY while a Gold Feather is ready (it goes exactly where DAILY CHALLENGE
   is); dark gray after it is played and there is no feather (never earned, used, or expired). No white
   state. The gold-ring moon feather of item 17 (2026-10-13) is superseded.
6. Daily streak: the number on the moon, hidden at zero. Later: the moon rises from behind a mountain
   on app open carrying the number.
7. START HERE: first Hunt only. Not on the ledge (it read as the plaque's caption). It is two words under
   the Hunt crowns, START under the left crown and HERE under the right, breathing. Supersedes item 16.
8. First-run Hunt glow: kept (a gold wash over the Hunt button).
9. Hunt gets a crown at each end ("you enter the Hunt to earn a crown"); the feather is the Daily's
   symbol; Polybook gets no symbol so the Hunt reads as the main button. No book, no Polly silhouette.
10. The terrace is the real Home (swapped in 2026-10-21 after Pete's device test). The old Home is
    parked as the DEV-only `HomeOld` route.
11. Next: the movements (moon rise, shooting stars, Daily castle reveal, Hunt dive, Polybook transition).

## Pete rulings, 2026-10-22

1. The Home entrance grind is LOCKED: its own cue `terraceStoneShift`, the same file and level as the gauntlet's stoneRumble (0.41), warmed on Home focus. Pete device-tested it: the grind and the slam as the buttons seat both come through; it is shorter than the gauntlet's, which he accepts. The Daily's own `dailyStoneShift` (0.22) is separate and unchanged.
