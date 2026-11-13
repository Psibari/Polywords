import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRuntimeHuntData } from './runtimeHuntValidation.mjs';

const huntData = JSON.parse(readFileSync('assets/data/huntData.json', 'utf8'));

const expectedMasks = {
  BRIDGE: {
    bridge_r1: 'A CARD GAME PLAYED AT THE RETIREMENT HOME',
    bridge_t91: 'WHAT LINKS TWO RAILROAD CARS SO THEY MOVE TOGETHER',
  },
  BRIEF: {
    brief_t9: 'WHERE RECEIPTS, LIPSTICK, AND HER KEYS ALL DISAPPEAR',
  },
  BED: {
    bed_r0: 'WHERE YOU’RE STILL LYING AFTER HITTING SNOOZE FIVE TIMES',
  },
  BULB: {
    bulb_r1: 'THE INVENTION THOMAS EDISON IS MOST FAMOUS FOR',
  },
  GREEN: {
    green_r1: 'HOW THE NEW GUY STILL IS ON HIS FIRST DAY',
    green_r3: 'WHERE YOU FINALLY USE THE PUTTER INSTEAD OF AN IRON',
  },
  CAPE: {
    cape_t91: 'THE GRIM REAPER’S FASHION CHOICE IN BLACK',
  },
  CAPITAL: {
    capital_r0: 'MONEY THAT STARTS THE BUSINESS',
    capital_r1: 'EVERY STATE HAS ONE',
    capital_r2: 'HOW EVERY SENTENCE IS SUPPOSED TO BEGIN',
    capital_t1: "MAYOR'S OFFICE DOWNTOWN",
    capital_t91: 'WHAT THE FIRST LETTERS OF YOUR NAME ARE CALLED',
    capital_t92: 'WHAT CTRL+C THEN CTRL+V GIVES YOU',
  },
  CHAMBER: {
    chamber_t100: 'WHAT OPENS BEHIND THE BOOKCASE WHEN YOU PULL THE RIGHT BOOK',
    chamber_t3: 'WHERE SURGEONS OPERATE AT THE HOSPITAL',
    chamber_t101: 'THE PADDED ROOM WHERE THE OCCUPANT WEARS A STRAITJACKET',
  },
  CIRCUIT: {
    circuit_t92: 'WHAT A DOCTOR TRACES TO CHECK YOUR HEARTBEAT',
    circuit_t93: 'WHAT CONNECTS ALL THE STOPS ON A SUBWAY MAP',
    circuit_t94: 'WHAT A SALESMAN IS ASSIGNED TO COVER',
  },
  CLEAR: {
    clear_t6: 'WHAT YOU GET AFTER PASSING A BACKGROUND CHECK',
  },
  COMPOUND: {
    compound_t4: 'WHAT YOUR FOOD SCRAPS CAN BECOME IN THE BACKYARD',
    compound_t5: 'WHAT A DJ DOES WITH TWO RECORDS',
    compound_t6: 'AN EDIT OF YOUR FAVORITE VIDEO CLIPS',
  },
  CONDUCT: {
    conduct_t92: 'WHAT THE FLIGHT ATTENDANT DOES BEFORE TAKEOFF',
  },
  COPY: {
    copy_r02: 'WHAT BOOTLEGS ARE TO THE ORIGINAL',
    copy_r03: 'THE WAY YOU TELL SOMEONE YOU UNDERSTOOD THEM OVER A WALKIE-TALKIE',
  },
  LIGHT: {
    light_r7: 'THE DIET VERSION OF BEER',
    light_r8: 'WHAT THE MOON GIVES YOU ON A CLEAR NIGHT',
    light_r6: 'WHAT YOUR REFRIGERATOR HAS BUT YOUR FREEZER DOESN’T',
    light_t92: 'WHAT THE SUN LEAVES BEHIND YOU ON THE SIDEWALK',
    light_t94: 'WHAT YOU SHUT IN A ROOM WHEN YOU WANT PRIVACY',
    light_t96: 'WHAT KEEPS THE CAMERA STILL FOR A NIGHT PHOTO',
    light_t97: 'HOW YOU TAKE YOUR COFFEE WHEN YOU SKIP THE CREAM',
  },
  PALM: {
    palm_r6: 'WHAT CHARMING MANIPULATION CAN HAVE SOMEONE EATING OUT OF',
    palm_r4: 'WHAT SMACKS AGAINST THEIRS WHEN YOU HIGH-FIVE SOMEONE',
    palm_r5: 'WHAT GETS CLAMMY WHEN YOU’RE REALLY NERVOUS',
    palm_t91: 'WHAT THE POLICE TAKE IN INK AFTER THEY ARREST YOU',
    palm_t92: 'WHAT WRINKLES UP WHEN YOU STAY IN THE POOL TOO LONG',
  },
  SENTENCE: {
    sentence_t5: 'WHAT YOU PUT ON THE FRONT PAGE OF A BOOK REPORT',
    sentence_t6: 'WHAT YOU TEACH A PARROT TO SAY OVER AND OVER',
  },
};

for (const [word, expected] of Object.entries(expectedMasks)) {
  const actual = new Map(huntData[word].masks.map(mask => [mask.id, mask.phrase]));
  for (const [id, phrase] of Object.entries(expected)) {
    assert.equal(actual.get(id), phrase, `${word}/${id} must carry its approved semantic identity`);
  }
}

const forbiddenPhrases = [
  'WHAT A MATADOR USES TO INSTIGATE THE BULL',
  'INVESTORS WIRE THE SEED FUNDING',
  'LOWERCASE LETTER AT THE END',
];
const canonicalPhrases = new Set(
  Object.values(huntData).flatMap(entry => entry.masks.map(mask => mask.phrase)),
);
for (const phrase of forbiddenPhrases) {
  assert.equal(canonicalPhrases.has(phrase), false, `retired phrase must be absent: ${phrase}`);
}

const retiredMaskIds = [
  'brief_t8',
  'click_t4',
  'close_t2',
  'concentration_t8',
  'counter_t03',
  'die_t00',
  'ground_t9',
  'hold_t3',
  'hollow_t8',
  'hood_t0',
  'kind_t6',
  'light_t91',
  'light_t93',
  'light_t95',
  'plant_t1',
  'round_t0',
  'tire_t5',
];
const canonicalMaskIds = new Set(
  Object.values(huntData).flatMap(entry => entry.masks.map(mask => mask.id)),
);
for (const id of retiredMaskIds) {
  assert.equal(canonicalMaskIds.has(id), false, `retired mask ID must be absent: ${id}`);
}

assert.deepEqual(
  {
    CAPITAL: huntData.CAPITAL.wordType,
    LIGHT: huntData.LIGHT.wordType,
    PALM: huntData.PALM.wordType,
    FAST: huntData.FAST.wordType,
    FOOT: huntData.FOOT.wordType,
  },
  {
    CAPITAL: 'Triple',
    LIGHT: 'Septuple',
    PALM: 'Sextuple',
    FAST: '8-MEANING',
    FOOT: '11-MEANING',
  },
);

for (const word of ['CASE', 'CUT', 'DRIVE', 'HOLD', 'ROUND', 'SET']) {
  assert.equal(huntData[word].difficulty, 'hard', `${word} must retain the approved difficulty repair`);
}

const affectedWords = [
  'BRIDGE', 'BRIEF', 'CAPE', 'CAPITAL', 'CHAMBER', 'CIRCUIT', 'CLEAR', 'COMPOUND',
  'CONCENTRATION', 'CONDUCT', 'COPY', 'CORNER', 'LIGHT', 'PALM', 'SENTENCE',
  'CASE', 'CUT', 'DRIVE', 'FAST', 'FOOT', 'HOLD', 'ROUND', 'SET',
];
const affectedData = Object.fromEntries(affectedWords.map(word => [word, huntData[word]]));
const validation = validateRuntimeHuntData(affectedData);
assert.deepEqual(validation.blockers, [], 'canonicalized Hunt entries must be structurally valid');

console.log('Hunt canonicalization tests passed');
