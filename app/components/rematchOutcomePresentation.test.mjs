import assert from 'node:assert/strict';
import fs from 'node:fs';

const production = fs.readFileSync('app/components/MaskBoard.tsx', 'utf8');
const dev = fs.readFileSync('app/screens/DevRematchOutcomePreviewScreen.tsx', 'utf8');
const mechanics = fs.readFileSync('app/hooks/useBoardMechanics.ts', 'utf8');
const sharedPath = 'app/components/ui/RematchOutcomePlaque.tsx';

assert.equal(fs.existsSync(sharedPath), true, 'shared RematchOutcomePlaque must exist');
const shared = fs.readFileSync(sharedPath, 'utf8');

assert.match(production, /import RematchOutcomePlaque from '\.\/ui\/RematchOutcomePlaque'/);
assert.match(dev, /import RematchOutcomePlaque from '\.\.\/components\/ui\/RematchOutcomePlaque'/);
assert.match(production, /<RematchOutcomePlaque[\s\S]*kind="king"/);
assert.match(production, /<RematchOutcomePlaque[\s\S]*kind="buster"/);
assert.match(dev, /<RematchOutcomePlaque/);

assert.match(shared, /king-result-plaque\.png/);
assert.match(shared, /buster-result-plaque\.png/);
assert.match(shared, /mastered-result-plaque\.png/);
assert.match(shared, /text="BUSTER"/);
assert.match(shared, /marginTop:\s*36/);

assert.match(production, /step\.isMasteryRematch === true \? 'mastered' : 'neutral'/);
assert.match(production, /setBookVariant\('neutral'\)/);

// Boss-facing copy no longer exposes the retired score/multiplier framing.
assert.match(mechanics, /resolveBossEventKicker/);
assert.doesNotMatch(mechanics, /2×/);
assert.doesNotMatch(mechanics, /BOSS MASTERY \+/);

// The ordinary illustrated outcome plaques share the same physical lettering
// system as KING/BUSTER rather than falling back to flat React Native text.
assert.match(production, /import PlaqueText from '\.\/ui\/PlaqueText'/);
assert.match(production, /banishedPlaqueContent[\s\S]*<PlaqueText[\s\S]*text=\{headline\}/);
assert.match(production, /masteredPlaqueContent[\s\S]*<PlaqueText[\s\S]*text=\{headline\}/);
assert.match(production, /hauntedPlaqueContent[\s\S]*<PlaqueText[\s\S]*text="HAUNTED"/);

console.log('rematch and boss outcome presentation contract passed');
