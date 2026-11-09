import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Gameplay text must not follow the iPhone system text size (Pete, 2026-11-09). Card text is laid
// out by tileTextLayout.ts from a glyph-advance table measured at 1.0x; a Text that scales with
// Settings > Text Size draws wider than that layout and clips its last letter ("WHETHER YOU LIK").
// The HUD, round chips, headword and cues moved as well.
//
// Text.defaultProps cannot do this: React 19's JSX runtime ignores defaultProps and the reconciler
// applies them only to class components, and RN 0.86's Text is a function component. So every
// player-facing Text / Animated.Text in Hunt, Results and Daily carries allowFontScaling={false}.
//
// PollySpeechBubble is shared with Home's perch, so Home's bubble is fixed-size too.
// Settings and Polybook are intentionally NOT in this list.
const GAMEPLAY_TEXT_FILES = [
  'app/screens/GameScreen.tsx',
  'app/screens/ResultsScreen.tsx',
  'app/screens/DailyChallengeScreen.tsx',
  'app/components/SwipeMask.tsx',
  'app/components/MaskBoard.tsx',
  'app/components/BossGauntletSpines.tsx',
  'app/components/BossIntroOverlay.tsx',
  'app/components/FirstRunHuntOnboarding.tsx',
  'app/components/FluentEmoji.tsx',
  'app/components/HauntIntroOverlay.tsx',
  'app/components/HudLessonLayer.tsx',
  'app/components/HuntPauseMenu.tsx',
  'app/components/MasterySeal.tsx',
  'app/components/PollyExitConfirm.tsx',
  'app/components/PollySpeechBubble.tsx',
  'app/components/ResultsConsequencePanel.tsx',
  'app/components/ui/FoilWord.tsx',
  'app/components/ui/PlaqueText.tsx',
  'app/components/ui/RematchOutcomePlaque.tsx',
  'app/components/DailyAnswerCard.tsx',
  'app/components/DailyExpiredCard.tsx',
  'app/components/DailyGate.tsx',
  'app/components/DailyPauseCard.tsx',
  'app/components/ui/DailyCardFace.tsx',
];

const OPT_OUT = 'allowFontScaling={false}';

/** Every <Text / <Animated.Text / <TextInput opening tag in a file, brace-aware, with its line. */
function textOpeningTags(src) {
  const tags = [];
  const re = /<(Animated\.Text|Text|TextInput)(?=[\s>])/g;
  let m;
  while ((m = re.exec(src))) {
    let depth = 0;
    let j = m.index + m[0].length;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    tags.push({ tag: src.slice(m.index, j + 1), line: src.slice(0, m.index).split('\n').length });
  }
  return tags;
}

const sources = Object.fromEntries(GAMEPLAY_TEXT_FILES.map((f) => [f, readFileSync(f, 'utf8')]));

// 1. Every player-facing text tag in every gameplay file opts out.
for (const [file, src] of Object.entries(sources)) {
  const tags = textOpeningTags(src);
  assert.ok(tags.length > 0, `${file}: expected text tags (did the scan break, or did the file move?)`);
  for (const { tag, line } of tags) {
    assert.ok(tag.includes(OPT_OUT), `${file}:${line} text must carry ${OPT_OUT}:\n${tag}`);
  }
  assert.doesNotMatch(src, /allowFontScaling=\{true\}/, `${file}: allowFontScaling={true} is not allowed`);
}

// 2. Named surfaces Pete saw move on device. Each must be found AND opted out, so a rename that
// slipped past the scan still fails loudly.
function assertTagOptsOut(file, marker, label) {
  const hits = textOpeningTags(sources[file]).filter(({ tag }) => tag.includes(marker));
  assert.ok(hits.length > 0, `${label}: no text tag containing "${marker}" in ${file}`);
  for (const { tag, line } of hits) {
    assert.ok(tag.includes(OPT_OUT), `${label} (${file}:${line}) lost ${OPT_OUT}`);
  }
}

// Card text (normal and gauntlet cards are both SwipeMask) and the backing card.
assertTagOptsOut('app/components/SwipeMask.tsx', 'styles.phrase', 'card phrase');
assertTagOptsOut('app/components/MaskBoard.tsx', 'styles.deckBackingPhrase', 'backing card phrase');
// Headword: FoilWord layers, plus the Boss word and its flash overlays in MaskBoard.
assertTagOptsOut('app/components/ui/FoilWord.tsx', 'style=', 'headword (FoilWord)');
assertTagOptsOut('app/components/MaskBoard.tsx', 'styles.word', 'headword (Boss word)');
// Swipe cues.
assertTagOptsOut('app/components/MaskBoard.tsx', 'styles.swipeUpCue', 'SWIPE UP cue');
assertTagOptsOut('app/components/MaskBoard.tsx', 'styles.swipeRightCue', 'SWIPE RIGHT cue');
// HUD word, its flash copies, and the round chips.
assertTagOptsOut('app/screens/GameScreen.tsx', 'tb.controlLabel', 'HUD word');
assertTagOptsOut('app/screens/GameScreen.tsx', 'tb.chipLabel', 'round chip');

console.log('gameplay text scaling static checks passed');
