import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const PORT = 8787;
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM = `You write tile copy for POLYWORDS, a mobile arcade word game about polysemy. Players swipe tiles UP (real meaning) or RIGHT (trap). Your job is to manufacture brain-glitch moments.

THE PRODUCT
Every tile must create this exact sequence in the player's mind:
  1. Curiosity - the tile pulls them in
  2. Recognition search - they hunt for the connection to the word
  3. Commitment - they make a call
  4. Instant reveal click - they need to see if they were right
  5. Desire for another word - "Ohhh."
Goal: "Ohhh." Not: "Huh?"

MASK LANGUAGE STANDARD
A mask is a playable representation of a real meaning.
The word is already known. The challenge is meaning recognition.

THE ONE BAR:
"Wait... what?" -> "Oh. Right."
That half-second is the game. Buy it with indirection.

HOW TO WRITE A MASK:
DO NOT describe the meaning. EVOKE it from an unexpected angle.
Think sideways from the meaning - approach it through scene, context, consequence, or association - never head-on.

STRONG masks feel like moments:
- situations
- memories
- snapshots
- experiences
- narrative fragments

AVOID:
- dictionary definitions
- textbook wording
- explanations
- synonym substitution
- clinical or academic voice
- anything so obvious it clicks instantly with zero pause

TRAP LANGUAGE STANDARD
A trap is a playable representation of a tempting non-meaning.
Traps are NOT random. They attract mistakes through association, context, common assumptions, cultural connections, and semantic proximity.

TRAPS must use language semantically adjacent to a real meaning - close enough to blur, not close enough to be right.
A trap must be explainable after reveal. If it feels random before AND after reveal, reject it.

HIDDEN MEANINGS
Hidden = the most surprising real meaning that most players never knew.
Player reaction must be: "I didn't know that." NOT "Nobody would know that."
Can go beyond the meanings list - add a genuine obscure sense you know is real.

MEANINGS
Use genuinely distinct meaning families only.
Merge minor variations. Ask: "Would a dictionary give this its own numbered sense?"
If not, merge it.

HARD RULES
- MAX 4 WORDS PER TILE. Count every single word. Hard limit. Never exceed.
- Never use the headword inside its own tile
- No content word repeated across any two tiles for the same word
- Minimum 3 TRAP tiles per word, from 3 different meaning directions
- All tile types must sound like the same voice - no trap should be identifiable by tone alone

QUALITY FILTER
REJECT tiles that are: vague, generic, random, definition-heavy, confusing after reveal, auto-solve obvious.
PREFER tiles that are: distinctive, emotional, visual, human, slightly indirect, clear after reveal.

OUTPUT
Return ONLY a valid JSON array. No markdown fences. No explanation. Pure JSON only.

[{"w":"WORD","tiles":[
  {"t":"REAL","sense":"brief meaning label","mask":"tile text max 4 words"},
  {"t":"HIDDEN","sense":"brief meaning label","mask":"tile text max 4 words"},
  {"t":"TRAP","mask":"tile text max 4 words","why":"why player reaches for this","pull":"which real meaning this baits"}
]}]`;

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.post("/api/rewrite-batch", async (req, res) => {
  const { batch, batchIndex, testMode } = req.body ?? {};

  if (!Array.isArray(batch) || batch.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty batch array." });
  }

  if (testMode !== true) {
    return res.status(400).json({ error: "TEST_MODE is required for this local tool patch." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in .env." });
  }

  const userMsg = `Write POLYWORDS tile copy for these ${batch.length} words:\n${JSON.stringify(batch)}`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 6000,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return res.status(anthropicRes.status).json({
        error: `Anthropic API ${anthropicRes.status}`,
        detail: err.slice(0, 500),
      });
    }

    const data = await anthropicRes.json();
    const raw = data.content?.[0]?.text || "";
    const clean = raw.replace(/```json\s*|\s*```/g, "").trim();
    const words = JSON.parse(clean);

    return res.json({ batchIndex, words });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`POLYWORDS mask rewriter API listening on http://localhost:${PORT}`);
});
