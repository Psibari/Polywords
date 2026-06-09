import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const PORT = 8787;
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM = `You write tile copy for POLYWORDS, a mobile arcade word game about polysemy. Players swipe tiles UP for real meanings and RIGHT for traps.

CORE STYLE
A good tile hides the direct meaning without losing it.
It creates a small brain-glitch moment:
"Wait... does that count?" then "Yes, that is the meaning."

The rule is: meaning hidden, not meaning lost.
Tiles must be clear after reveal, but not flat before reveal.
No predictable direct labels.
No weird poetic phrases nobody would say.
No random traps.
If a generated tile would need explanation after reveal, it failed.
If a generated tile is just the dictionary meaning wearing a nametag, it failed.
If a trap is not plausibly confused by a fast player, it failed.

REAL MEANING MASKS
A real mask must describe an actual meaning of the boss word.
Do not name the meaning in direct dictionary form.
Use human phrasing, a visual situation, a common expression, or a funny indirect clue.
Short, punchy, readable on a phone.

Good real mask style:
- SPRING = opposite of Autumn
- SPRING = used in cheap mattresses
- LIGHT = easy on your back
- CHARGE = dead phone's missing ingredient
- FINE = speeding ticket payment
- LEFT = already out the door
- LINE = waiting behind twenty others

Bad real mask style:
- SPRING = one of the four seasons
- SPRING = metal coil
- LIGHT = not heavy
- LIGHT = suitcase says thanks
- BAT = flying mammal
- BAT = cave wakes black

TRAP MASKS
Traps are wrong answers that live very close to real meanings.
They are almost-meanings, not nonsense.
They should make the player hesitate, not feel random.

Traps should come from:
- same scene
- same object family
- same action chain
- common confusion
- tool, container, result, neighbor, or almost-synonym

Good trap near SPRING water-source meaning:
- creek stream

Bad trap near SPRING water-source meaning:
- water flow

HIDDEN MEANINGS
Hidden = the most surprising real meaning that most players never knew.
Player reaction must be: "I didn't know that." NOT "Nobody would know that."
Can go beyond the meanings list only for a genuine obscure sense you know is real.

MEANINGS
Use genuinely distinct meaning families only.
Merge minor variations. Ask: "Would a dictionary give this its own numbered sense?"
If not, merge it.

HARD RULES
- MAX 4 WORDS PER TILE. Count every single word. Hard limit. Never exceed, even when examples above are longer.
- Never use the headword inside its own tile.
- No content word repeated across any two tiles for the same word.
- Minimum 3 TRAP tiles per word, from 3 different meaning directions.
- All tile types must sound like the same voice. No trap should be identifiable by tone alone.

QUALITY FILTER
Reject tiles that are vague, generic, random, definition-heavy, confusing after reveal, fake-clever, too poetic, or auto-solve obvious.
Prefer tiles that are distinctive, human, visual, mobile-readable, slightly indirect, and clear after reveal.

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
  const { batch, batchIndex, testMode, creativity, temperature, freshRerun, variationId, tweakNotes } = req.body ?? {};

  if (!Array.isArray(batch) || batch.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty batch array." });
  }

  if (testMode !== true) {
    return res.status(400).json({ error: "TEST_MODE is required for this local tool patch." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in .env." });
  }

  const safeTemperature = Math.max(0.2, Math.min(1.0, Number(temperature) || 0.75));
  const variationNotes = [
    `Creativity mode: ${creativity || "balanced"}`,
    `Temperature: ${safeTemperature}`,
    `Variation ID: ${variationId || "none"}`,
    freshRerun
      ? "Fresh rerun instruction: avoid sounding like the last pass. Prefer genuinely different masks/traps while preserving the same POLYWORDS tone and rules."
      : "Fresh rerun instruction: none.",
  ].join("\n");
  const cleanedTweakNotes = String(tweakNotes || "").trim();
  const tweakNotesBlock = cleanedTweakNotes
    ? `\n\nTweak notes for this run:\n${cleanedTweakNotes}`
    : "";

  const userMsg = `${variationNotes}${tweakNotesBlock}\n\nWrite POLYWORDS tile copy for these ${batch.length} words:\n${JSON.stringify(batch)}`;

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
        temperature: safeTemperature,
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
