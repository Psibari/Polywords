# POLYWORDS — State of Project
*Source of truth for all chats. Update at end of every significant session.*
*Last updated: June 6, 2026*

---

## 1. CORE IDENTITY (never changes)

**What it is:** Mobile-first semantic arcade game. One word. Multiple meaning masks. Swipe real meanings UP, call traps RIGHT.

**Emotional core:** *"Wait… what? … Shit, that's right."*

**Session format:** POLY RUN — 12-word curated session. Words 1–4 onboarding, 5–9 rhythm, 10–13 tension, 14 pre-boss buildup, 15 boss word climax. Results screen = emotional resolution + hunger for more.

**Word database:** 739 polysemous words — LOCKED. No additions without Pete's sign-off.

---

## 2. TECH STACK (locked)

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK |
| UI | React Native Animated API (primary) · Reanimated (SwipeMask.tsx ONLY — frozen) |
| Language | TypeScript strict mode |
| State | Zustand + immer |
| Haptics | Expo Haptics |
| Audio | Expo AV |
| Navigation | Expo Router |
| Fonts | Bagel Fat One (hero word) · Plus Jakarta Sans 800 (UI) |

**Animation rules:**
- `useNativeDriver:true` — transform, opacity only
- `useNativeDriver:false` — height, margin only
- NEVER chain these — keep them in separate `Animated.timing` calls
- NEVER use `.start()` callbacks between phases — use `setTimeout`
- Reanimated is LOCKED to SwipeMask.tsx only — no new usage anywhere else, ever
- Always end code output with `tsc --noEmit` clean confirmation

---

## 3. BRAND BIBLE (locked)

**Palette:** Indigo / Gold / Purple — "Royal Word Game" scheme. Strict 3-color + Polly green. No deviations.

**Polly (mascot):**
- Green parrot, oversized eyes, orange curved beak, explorer hat
- Personality: smartass but welcoming — adult/stylized, NEVER Sesame Street
- No circular crop on Polly cards — full illustrated banner format
- Polly green is the ONLY accent color outside the core 3

**Voice/tone:** Confident, slightly sarcastic, arcade energy. Not educational. Not friendly-app.

---

## 4. LIVE MECHANICS (current build)

**Swipe system:**
- Swipe UP = claim as real meaning ✅
- Swipe RIGHT = call it a trap ✅
- Tap-and-submit: CUT — does not exist

**Session engine:**
- `polyRunEngine.ts` — pure function state machine
- `useGameStore.ts` — Zustand store
- 12-word session fully wired and playable

**Tile system:**
- Real meaning tiles — claim with UP swipe
- Trap tiles — call with RIGHT swipe
- Hidden meaning tiles — unlock system active
- Ghost tiles — carry missed meanings forward into next encounter

**Boss word (word 15):**
- Highest difficulty, highest payoff
- "Word up." message: ONLY on boss word perfect clears (not every word) — FIX PENDING

**Scoring/timing constants:**
- [Pete: fill in from current build]

**Components built:**
- HeartbeatBackground · MaskBoard · MasterGateTile
- SwipeMask · GhostTile · SlangDropScreen
- SwitchbackScreen · PhraseBreakScreen
- StreakDisplay · ScoreFloat · PollyCard · PollyController
- ResultsScreen

**Audio:** WAV synthesis via Expo AV — generated, not sampled

**Haptics:** Expo Haptics — full haptic map (confirm current map with Pete)

---

## 5. CUT LIST — ✂️ (PERMANENT — never suggest, never revive)

- ❌ Tap-and-submit mechanic (replaced by swipe)
- ❌ Pencil icon / any pencil branding
- ❌ "Word up." on every correct word (boss-only now)
- ❌ Circular crop on Polly card
- ❌ SPRING word with full tile count (trim to 6 tiles — fix pending)
- ❌ Generic vocabulary quiz mechanics
- ❌ Definition matching (word → definition, no reinterpretation)
- ❌ Crossword-style / clue matching
- ❌ Word search / letter patterns / spelling / anagram
- ❌ Homophone mode (unless creates direct meaning-shift snap)
- ❌ Educational trivia framing
- ❌ Educational app aesthetic (too bright, too friendly, too rounded)
- ❌ Reanimated anywhere except SwipeMask.tsx — that file is the sole exception, frozen
- ❌ [Pete: add anything else that's been killed]

---

## 6. LOCKED DECISIONS (final — not up for revisit)

- 12-word Poly Run session length ✅
- UP = real / RIGHT = trap swipe directions ✅
- 739-word database count ✅
- Royal Word Game palette (indigo/gold/purple) ✅
- Polly's character design ✅
- Two-step card pipeline: polysemy-specialist FIRST → mask-writer SECOND ✅
- Mask tile standard: ≤4 words, witty not flat, 3+ traps minimum per word ✅

---

## 7. ACTIVE PRIORITIES (ordered)

*Update this section every session. Top = fix first.*

1. 🔴 Results screen — red dot on complete words (bug)
2. 🔴 Results screen — perfect count display (bug)
3. 🔴 Results screen — near-miss reveal copy (missing)
4. 🟠 Tile shuffle randomization (not random enough)
5. 🟠 "Word up." — limit to boss perfect clears only
6. 🟠 Polly hiddenReveal trigger — wired in engine, verify PollyCard handles the case
7. 🟠 expo-av → expo-audio migration (deferred)
8. 🟡 In-round streak feedback
9. 🟡 SICK slang pool trap replacement (sick_waiting swap)

---

## 8. SKILLS REGISTRY (installed)

| Skill | Role |
|-------|------|
| `polywords-warroom` | Master command — load FIRST for any design/mechanics/feel work |
| `polywords-coder` | All implementation — React Native / Expo / TypeScript |
| `polywords-game-design` | Defers to warroom. Execution layer for design decisions. |
| `polywords-feel-engine` | Haptics · sound · animation specs |
| `polywords-ui-master` | Visual layout — requires screenshot |
| `polywords-mask-writer` | Tile copy — always run AFTER polysemy-specialist |
| `polysemy-specialist` | Word analysis — always run BEFORE mask-writer |
| `polywords-video-analyst` | Gameplay video / screen recording review |

---

## 9. SESSION LOG (recent decisions)

*Add to top. Keep last 5 sessions. Archive older ones.*

---
**June 6 2026** — Full repo audit via warroom. 11 fixes shipped across 6 Claude Code prompts: content (RAW/SICK/BAD/CHILL slang fairness fix, PITCH hidden meaning replaced with tar meaning, SPRING hiddenTrap added), engine (revealHidden now fires pollyTrigger hiddenReveal, ghost wordId key normalized to word string, phraseAnswer feedback string fixed), UI (RATTLED color white), codebase (dead pools deleted, dead types cleaned, typecheck script added, Reanimated boundary locked to SwipeMask.tsx only). tsc clean.

---
**[DATE]** — [previous session]

---

*[Archive older sessions below this line or delete when log exceeds 10 entries]*
