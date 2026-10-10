from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: {label}: expected 1 match, found {count}")
    path.write_text(text.replace(old, new, 1))


context = Path('CONTEXT.md')
replace_once(
    context,
    'Updated 2026-10-08. Current state + next work only.',
    'Updated 2026-10-09. Current state + next work only.',
    'context date',
)
replace_once(
    context,
    '''- **Results:** Hunt Results remains the last major visual surface awaiting a focused keep/change\n  audit. Do not assume it needs redesign.\n''',
    '''- **Results:** Hunt Results is the current integrated post-Hunt experience and is device-approved.\n  It owns verdict, consequences, recap, Gold Feather recovery when eligible, START A NEW HUNT,\n  SHARE RESULT, HOME, and Polly. There is no separate Run It Back screen to redesign.\n''',
    'results state',
)
replace_once(
    context,
    '''- **Master's Rematch and feedback (2026-10-07):** MASTER'S REMATCH, BUSTER, KING, split\n  claim/trap/tier-up haptics and the wrong-swipe squawk rule are built on\n  `play-screen-overhaul`. Pete checked the haptics and squawk on a phone 2026-10-07. NOT\n  device-tested: BUSTER and KING animation timings and the "Bird brain" line. No way to start\n  a rematch on a phone yet: it only appears once every boss word is mastered, and there is no\n  dev shortcut.\n''',
    '''- **Master's Rematch and Boss outcome cleanup (2026-10-09):** MASTER'S REMATCH, BUSTER and\n  KING are wired through the real production path and device-approved. Rematches start on the\n  gold Master book; KING keeps it gold and resolves to the crown plaque, while BUSTER visibly\n  returns the book to purple and runs the approved MASTER -> BUSTER transformation. DEV preview\n  buttons use the same shared plaque component as production. Normal Boss and rematch headers are\n  now `POLLY'S WORD` / `MASTER'S REMATCH`; visible 2x framing and Boss mastery-point copy are\n  retired while internal scoring remains intact. MASTERED / HAUNTED / BANISHED use the shared\n  physical plaque-text treatment. The split claim/trap/tier-up haptics and wrong-swipe squawk rule\n  remain device-checked. `Bird brain` remains Results-only unless Pete rules otherwise.\n''',
    'rematch current state',
)

claude = Path('CLAUDE.md')
replace_once(
    claude,
    '''MASTER'S REMATCH outcomes (timings first-pass, not device-confirmed):\n- Lost (missed hidden card or ran out of feathers): BUSTER. Plain text, no plaque, book stays\n  the neutral rig: MASTER shows, "MA" drops, "BU" lands. One punch as BU lands\n  (`streakBreakImpact` + `fellOffSmall` haptic). Results label and share text read BUSTER;\n  the Results line under it is "Bird brain" (Results only, not on the board).\n- Won: KING drops in over MASTERED on the gold plaque. Results label and share text read KING.\n''',
    '''MASTER'S REMATCH outcomes are device-approved and use the shared\n`RematchOutcomePlaque.tsx` presentation in DEV and production:\n- Lost (missed hidden card or ran out of feathers): BUSTER. The rematch begins on the gold Master\n  book; MASTER shows, `MA` drops, `BU` lands while `STER` holds, and the final BUSTER plaque is the\n  approved purple/gold treatment. The Hero Book returns to the neutral purple rig before the final\n  BUSTER plaque. No Haunt is created and persistent mastery is unchanged. Results label/share text\n  read BUSTER; `Bird brain` remains Results-only.\n- Won: the gold Master book stays mastered. The Master plaque resolves to the crown-led KING plaque;\n  the in-round final plaque does not need literal `KING` text because the crown carries the\n  promotion, and the Boss word remains beneath it. Results label/share text read KING.\n- Dynamic plaque lettering uses `PlaqueText.tsx` as one Text node with material shadow. Do not\n  restore the old three-layer text stack; it separated into visible duplicate words on-device.\n- Normal Boss/rematch event labels are `POLLY'S WORD` / `MASTER'S REMATCH`. Player-facing Boss\n  score, mastery-point and `2x` framing are retired; internal scoring remains unchanged.\n''',
    'rematch presentation',
)

game_ref = Path('docs/GAME_REFERENCE.md')
replace_once(
    game_ref,
    '''- Mastered words may return to ordinary tension/panic play as marked revisits, but never Boss or\n  Returning Haunt candidates. `RUN IT BACK` creates a fresh arc with ghost priority.\n''',
    '''- Mastered words may return to ordinary tension/panic play as marked revisits, but never Boss or\n  Returning Haunt candidates except through MASTER'S REMATCH. `START A NEW HUNT` creates a fresh\n  arc with ghost priority.\n''',
    'fresh hunt label',
)
replace_once(
    game_ref,
    '''- `bossOutcome` is authoritative. The Master Gate must not return.\n''',
    '''- `bossOutcome` is authoritative. The Master Gate must not return.\n- MASTER'S REMATCH appears only when no unmastered Boss word with hidden content remains. A win is\n  KING and does not add another mastery record; a loss is BUSTER and creates no Haunt. Persistent\n  mastery survives either result. The production rematch starts on the gold Master book; KING keeps\n  it gold, while BUSTER returns it to purple before the final plaque.\n''',
    'rematch player rules',
)
replace_once(
    game_ref,
    '''- Fatal wrong choices finalize the current word result before game-over.\n- Locked system text includes `YOU BEAT POLLY`, `POLLY HUNT COMPLETE`, and\n''',
    '''- Fatal wrong choices finalize the current word result before game-over.\n- Hunt Results is integrated inside the Game flow; there is no separate Run It Back screen. It owns\n  the post-Hunt verdict/recap plus Gold Feather recovery when eligible, START A NEW HUNT, SHARE\n  RESULT and HOME.\n- Locked system text includes `YOU BEAT POLLY`, `POLLY HUNT COMPLETE`, and\n''',
    'results integration',
)
replace_once(
    game_ref,
    '''- Ordinary masks stay neutral before commitment.\n- In-round spine and archive nav both currently say POLYBOOK; renaming remains Pete's decision.\n''',
    '''- Ordinary masks stay neutral before commitment.\n- Normal Boss/rematch headers are `POLLY'S WORD` / `MASTER'S REMATCH`. Boss score, mastery points\n  and `2x` framing are not player-facing.\n- In-round spine and archive nav both currently say POLYBOOK; renaming remains Pete's decision.\n''',
    'boss presentation labels',
)

print('current-state docs synchronized')
