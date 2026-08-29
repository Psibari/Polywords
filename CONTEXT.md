# POLYWORDS Current Context

Updated August 28, 2026. Branch: `play-screen-overhaul`, tracking
`origin/play-screen-overhaul`. Current code baseline: `d39ca2e`.

## Verified Current State

- Daily's correct-answer transition now reads as one physical mechanism: card lands on the
  parchment, a matching ornate rod rolls reward paper over it, the reward holds, and the
  paper rolls up to reveal the next clue. Repeated-round state/input tests, TypeScript, the
  full test suite, and an iPhone check passed.
- Hunt runtime content is `assets/data/huntData.json`: 197 words and 1,748 tiles, including
  13 boss words and 39 hidden pairs. The 24-word DISPATCH-through-FLAG import preserved all
  173 prior entries; DISCHARGE remained unchanged. Boss/hidden-pair structure did not change.
- Current gpsTag pool counts are confidence 16, flow 41, tension 70, panic 57, boss 13. The
  confidence retag has happened; any earlier figure of 6 or 12 is stale.
- The tracked Hunt workbook is `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`; live JSON remains
  authoritative.
- The layered face rig is live on three screens: Home (`5c6f92a`), Daily (`44b4114`) and
  Results (`d39ca2e`), each device-confirmed before commit. `PollyPerchRig.tsx` renders the
  five `rig2` face layers and the idle blink, with the brow riding it at 0.33. It renders only
  when she is settled in the sprite4 idle/smug pose; fly-ins and all other poses stay flat art.
  `POLLY_PERCH_RIG_ENABLED` turns it off in one line. The rig composite was verified against
  `sprite4.png` pixel by pixel — nothing is displaced, the only difference is a hairline on her
  black outlines, so the flat-to-rig swap is not visible in play.
- Crown tilt exists as a prop and is deliberately off. A crown that rocks continuously while
  she sits reads as a broken prop; it belongs to a one-shot reaction, which only the Hunt has.
- The Hunt perch is unwired and blocked on content, not code. Only two visit specs perch as
  `smug`, both about 1800ms, against a blink scheduled 2000–6000ms after mount.
- `PollyFaceRigDevViewer` stays in Settings behind `__DEV__` as the tuning harness.
- Nothing is left unpainted for the perch. `rig2` holds base, crown, beak, eye, brow, feet,
  far wing and tail, all registered on the 283x413 sprite4 canvas (commit 981af56). Feet, far
  wing and tail are banked and nothing imports them yet: the far wing is hidden behind the
  body, the tail is hidden because it is still baked into `polly_base`, and the feet only
  matter once the branch becomes its own layer. The tail's placement is provisional.
- Both known rig defects are closed by `2a24a4e`. `EYE_PIVOT_Y_FRAC` 0.12 was verified to sit
  on the eye artwork's lower edge, the correct blink pivot — the value was always right, only
  its comment was wrong. The brow now follows the blink, locked at 0.33.
- The beak is a swap, not a hinge — open and closed mouths as matched states. Chosen because
  a hinge needs a mouth interior no pose contains.
- `POLLY_ART_SPEC_2026-08-13.md` sets a beak-aspect test of 0.78 ±0.05. That figure was
  measured on an open mouth. Her closed beak is ~1.01. Do not judge a closed beak against it.
- An open mouth cannot be harvested from an existing pose; it must be drawn on the perched
  head. Tested 2026-08-28 against sprite7 and sprite5 at multiple scales and alignments —
  sprite7's mouth opens across her own cheek and eye on the sprite4 head, and sprite5's head
  is tipped back. See CLAUDE.md for the full finding.
- The current Hunt generator keeps mastered words in ordinary tension/panic play as marked
  revisits. Mastered words cannot be Bosses or Returning Haunts, and deterministic regression
  coverage protects those rules. The old mastered-word deletion/rematch behavior is retired.
- The Vault now derives books from claimed visible REAL mask IDs: a word appears after its first
  claim and is finished when all of its visible REALs are claimed. Banishing a Haunt removes it
  from the active ghost queue; permanent Haunt-clear history in the Vault is not implemented yet.
- Audio was repaired at the transport boundary. SFX now load on demand from real sources and
  wait for native load-status events; the old eager 36-player startup burst and polling retry
  path are retired. Music uses the same real-source construction, has app foreground recovery,
  and restarts a new Hunt from the start. The protected Hunt-loss Results chuckle remains
  distinct from ordinary, boss, and Returning Haunt laughs and was verified on device.

## REWARD ECONOMY

- Rank comes off the Vault; meanings taken is the headline. APPROVED.
- Books equal words, finished when all of that word's visible REALs are found. APPROVED. No
  perfect-clear tier — a round shows only about 2.54 of a word's 4.61 REALs, so a flawless
  clear certifies the tiles dealt, not the word.
- Roughly every fifth new word should carry `hiddenPairs`. APPROVED. This is the only fix for
  the mastery ceiling.
- Rank thresholds are now retuned and live: D 0, C 3,000, B 6,000, A 9,000, S 11,500,
  MASTER 14,000. This is an absolute ladder and should be revisited if future content changes
  materially alter the perfect-play ceiling.
- Roughly every fifth new word should carry `hiddenPairs`. APPROVED as the content remedy for
  the finite Boss pool; the current runtime still has 13 Boss words / 39 hidden pairs.
- Banished Haunts are removed from the active queue but are not yet recorded as a permanent Vault
  collection item. This is a future reward/UX decision, not a reason to remove Haunts from Hunt.

## Approved Daily Content

`workbooks/POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx` is the canonical source for
43 approved locked words; `STAGE` is included and `SENTENCE` is excluded.
`app/game/dailyPool.ts` is the runtime representation. Each source word has three clues, nine
unique approved candidates, and tier 1–3; each round deterministically presents the target plus
five distractors.

## Next Work

1. Continue real-device iOS/Android journey checks before release, including cold-start audio,
  rapid navigation, app background/foreground recovery, and every distinct Polly laugh beat.
2. Author and editorially approve more Boss-capable Hunt words, targeting roughly one in five
  new words with three fair, stable-ID `hiddenPairs`. Do not generate placeholder hidden truth.
3. Decide and implement a permanent player-facing record for banished Haunts, if the Vault should
  remember that victory. Keep the hidden pair ledger on Polly's side; do not turn it into a
  player shelf collection.
4. Replace the placeholder Boss-gauntlet card art when the stone-block/crown direction is
  specified. The desired motion is push-forward, not `rotateY`.
5. Continue iPhone Expo Go validation for Vault density, mastered returns, Boss/Haunt placement,
  persistence, gestures, animation, and performance.
6. Wire the face rig into live Polly. Every player-facing perch still renders a flat pose;
  `PollyHuntVisit` is the only place the game renders her. Route it through a `PollyFigure`
  wrapper that renders the flat pose or the rig behind a flag so the flat path stays
  shippable.

## Protection

- Preserve every Git stash unless Pete names one and explicitly requests an operation.
- Preserve unrelated worktree changes.
- Git history is the patch diary; do not rebuild session logs in this file.
