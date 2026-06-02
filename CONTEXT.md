# POLYWORDS — AI Session Context File
> Drop this file at the start of any Claude or ChatGPT session to resume instantly.
> **Always update this file at the end of a session before closing.**

---

## 🎮 What Is POLYWORDS?

A mobile-first semantic arcade word game built around **polysemy** — words with multiple real meanings. Players see a word, then tap tiles labeled with meanings — some real, some traps. Mechanics reward fast semantic thinking, punish overthinking, and create "wait... that's also right" moments.

- **Game modes:** POLY RUN (primary), Meaning Mask Blitz
- **Session length:** ~90 seconds / 15-word arc
- **Core emotion:** *"Wait… what? … Shit, that's right."*

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | Expo + React Native |
| Language | TypeScript |
| State | Zustand |
| Animations | Reanimated (`useNativeDriver` rules apply — see below) |
| Haptics | Expo Haptics |
| Audio | Expo AV |

### ⚠️ Animation Rules (non-negotiable)
- `useNativeDriver: true` — transform, opacity only
- `useNativeDriver: false` — height, margin, layout
- **Never chain native + JS driver animations**
- Use `setTimeout` between phases — never `.start()` callbacks
- No dev error toasts in playtest builds
- Always run `tsc --noEmit` before QR testing — must exit 0

---

## 🎨 Brand Identity (LOCKED — no changes without Pete's sign-off)

### Palette — "Royal Word Game"
| Role | Hex |
|---|---|
| Background | `#1A1A5E` (deep indigo) |
| Gold accent | `#FFD700` / `#F5A623` |
| Purple mid | `#6A0DAD` |
| Polly green | `#4CAF50` |
| Navy border | `#0D0D3B` |
| Text on dark | `#FFFFFF` |

### Typography
- **Display / word titles:** Bagel Fat One
- **UI / tile labels / body:** Plus Jakarta Sans 800

### Mascot — Polly 🦜
- Green parrot, oversized eyes, orange curved beak, explorer hat
- Personality: smartass but welcoming
- Style: adult/stylized — **never childlike**

---

## 📊 Word Database

- **739 polysemous words** — finalized and clean
- Source file: `POLYWORDS_Master_Database_739_CLEAN.csv`
- Content rule: **CUT-compliant** — no offensive, region-specific, or unfair traps without flagging

---

## 🃏 Tile / Mask System

| Tile Type | Description |
|---|---|
| Real mask | A true meaning of the word — player should claim (swipe UP) |
| Trap mask | Plausible but false — player should call it (swipe RIGHT) |
| Hidden meaning | Rare/unlockable — appears on perfect clear, splits into 2 judgeable tiles |
| Ghost tile | Carries a missed meaning forward into next round |
| Slang / Era mask | Time or culture-specific meaning |

- **Swipe UP** = claim real meaning
- **Swipe RIGHT** = call trap
- **Tile copy rule:** ≤4 words per tile, witty not flat, 3+ traps per word

---

## 🗓️ 15-Word Session Arc (POLY RUN)

Word types in session: Normal, Boss, Speed, Hesitation, Surprise, Relief, Slang, Lore, Decoy, Era

Full arc is ~90 seconds with an emotional curve built in. Session list is **finalized**.

---

## ✅ Current Build Status

**The game is fully playable.** Core loop, swipe mechanics, sound, haptics, and animations are in.

### Active Bug / Polish List (priority order)
- [ ] Results screen dot colors wrong
- [ ] Perfect count not displaying correctly on results screen
- [ ] Tile shuffle not randomized — needs randomization
- [ ] SPRING tile count needs trimming
- [ ] Polly banner card needs redesign
- [ ] Near-miss reveal copy missing — add feedback text
- [ ] Streak feedback missing — needs visual/haptic response

---

## 🧠 Key Design Decisions (Already Made — Don't Re-litigate)

- Palette: Option C "Royal Word Game" — locked
- Polly: green parrot, adult style — locked
- No pencil icon in logo (removed — felt too elementary school)
- Tile copy ≤4 words — locked
- Session = 15 words — locked
- Hidden meanings split into 2 tiles on perfect clear — locked
- Ghost tiles carry missed meanings forward — locked

---

## 🔜 Next Priorities

1. Fix results screen (dot colors + perfect count)
2. Randomize tile shuffle
3. Trim SPRING tile count
4. Redesign Polly banner card
5. Add near-miss reveal copy
6. Add streak feedback (visual + haptic)

---

## 🤝 About Pete

- Based in New York, NY
- Also pursuing AI consulting / automation for small businesses
- Prefers: direct advice, implementation focus, honest feedback
- No hand-holding — say what's wrong, say why, move on

---

## 📅 Session Log
> Update this section at the end of every session.

| Date | AI Used | What Was Done | Left Off At |
|---|---|---|---|
| — | — | Initial CONTEXT.md created | Bug/polish list active |

---

*Last updated: May 31, 2026*
*To update: ask Claude or ChatGPT — "update the session log in CONTEXT.md"*
